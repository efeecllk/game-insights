/**
 * Metric Calculator
 * Automatically calculates standard game metrics from raw data
 * Enhanced with ARPU, ARPPU, conversion rates, retention, session metrics,
 * and whale/dolphin/minnow segmentation with confidence scores
 */

import { NormalizedData } from '../adapters/BaseAdapter';
import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';

// ============ CONFIGURATION ============

export interface MetricConfig {
    retentionDays: number[];
    rollingWindowDays: number;
    ltvProjectionDays: number;
    // Spender tier thresholds (USD)
    whaleThreshold: number;
    dolphinThreshold: number;
    minnowThreshold: number;
}

const DEFAULT_CONFIG: MetricConfig = {
    retentionDays: [1, 3, 7, 14, 30],
    rollingWindowDays: 7,
    ltvProjectionDays: 90,
    whaleThreshold: 100,
    dolphinThreshold: 20,
    minnowThreshold: 1,
};

// ============ METRIC TYPES ============

export interface RetentionMetrics {
    classic: Record<string, number>;      // D1, D3, D7... -> percentage
    rolling: Record<string, number>;      // Rolling retention
    returnRate: number;                   // Overall return rate
    d1: number;                           // Day 1 retention (convenience)
    d7: number;                           // Day 7 retention (convenience)
    d30: number;                          // Day 30 retention (convenience)
    confidence: number;                   // Confidence in retention calculation
}

export interface EngagementMetrics {
    dau: number;
    wau: number;
    mau: number;
    dauMauRatio: number;                  // Stickiness (0-1)
    avgSessionsPerUser: number;
    avgSessionLength: number;             // In seconds
    medianSessionLength: number;          // Median session length in seconds
    totalSessions: number;
    sessionFrequency: number;             // Avg sessions per day per active user
    confidence: number;                   // Confidence in engagement metrics
}

export interface SpenderSegment {
    tier: 'whale' | 'dolphin' | 'minnow' | 'non_payer';
    label: string;
    userCount: number;
    percentage: number;
    totalRevenue: number;
    revenuePercentage: number;
    avgSpend: number;
    thresholdMin: number;
    thresholdMax: number | null;
}

export interface MonetizationMetrics {
    totalRevenue: number;
    arpu: number;                         // Average Revenue Per User
    arppu: number;                        // Average Revenue Per Paying User
    conversionRate: number;               // Free to paying %
    payingUsers: number;
    totalUsers: number;
    ltvProjection: number;
    ltvD7: number;                        // Projected LTV at Day 7
    ltvD30: number;                       // Projected LTV at Day 30
    ltvD90: number;                       // Projected LTV at Day 90
    revenueBySource: Record<string, number>;
    spenderSegments: SpenderSegment[];    // Whale/Dolphin/Minnow breakdown
    whaleRevenue: number;                 // Revenue from whales
    whaleRevenuePercentage: number;       // % of revenue from whales
    avgTransactionValue: number;          // Average purchase amount
    purchaseFrequency: number;            // Avg purchases per paying user
    confidence: number;                   // Confidence in monetization metrics
}

export interface ProgressionMetrics {
    levelCompletionRates: Record<string, number>;
    maxLevelReached: number;
    avgLevel: number;
    medianLevel: number;
    difficultySpikes: string[];           // Levels with > 2x avg fail rate
    bottleneckLevels: Array<{             // Levels causing significant churn
        level: string;
        dropOffRate: number;
        usersLost: number;
    }>;
    confidence: number;                   // Confidence in progression metrics
}

export interface DAUTrendPoint {
    date: string;
    users: number;
}

export interface RevenueBreakdownItem {
    dimension: string;
    value: number;
    percentage: number;
    userCount?: number;
}

export interface CalculatedMetrics {
    retention: RetentionMetrics | null;
    engagement: EngagementMetrics | null;
    monetization: MonetizationMetrics | null;
    progression: ProgressionMetrics | null;
    dauTrend: DAUTrendPoint[] | null;
    revenueBreakdowns: {
        source: RevenueBreakdownItem[];
        country: RevenueBreakdownItem[];
        platform: RevenueBreakdownItem[];
        product: RevenueBreakdownItem[];
    } | null;
    calculatedAt: string;
    dataRange: { start: string; end: string } | null;
    confidence: number;
    availableMetrics: string[];
    // Summary stats for quick access
    summary: {
        totalUsers: number;
        totalRevenue: number;
        arpu: number;
        d1Retention: number | null;
        d7Retention: number | null;
        conversionRate: number | null;
    };
}

// ============ HELPER FUNCTIONS ============

function parseDate(value: unknown): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === 'number') {
        // Handle Unix timestamps (seconds or milliseconds)
        const ts = value > 1e12 ? value : value * 1000;
        return new Date(ts);
    }

    if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
}

function getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

function daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / msPerDay);
}

function findColumn(meanings: ColumnMeaning[], ...types: SemanticType[]): string | null {
    for (const type of types) {
        const col = meanings.find(m => m.semanticType === type);
        if (col) return col.column;
    }
    return null;
}

function getNumericValue(row: Record<string, unknown>, column: string): number {
    const val = row[column];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

// ============ METRIC CALCULATOR CLASS ============

export class MetricCalculator {
    /**
     * Calculate all available metrics from data
     */
    calculate(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        config: Partial<MetricConfig> = {}
    ): CalculatedMetrics {
        const fullConfig = { ...DEFAULT_CONFIG, ...config };
        const availableMetrics: string[] = [];

        // Find key columns
        const userIdCol = findColumn(columnMeanings, 'user_id');
        const timestampCol = findColumn(columnMeanings, 'timestamp');
        const sessionIdCol = findColumn(columnMeanings, 'session_id');
        const revenueCol = findColumn(columnMeanings, 'revenue', 'price', 'iap_revenue', 'purchase_amount');
        const levelCol = findColumn(columnMeanings, 'level');
        const sessionDurationCol = findColumn(columnMeanings, 'session_duration');

        // Calculate data range
        let dataRange: { start: string; end: string } | null = null;
        if (timestampCol) {
            const dates = data.rows
                .map(row => parseDate(row[timestampCol]))
                .filter((d): d is Date => d !== null)
                .sort((a, b) => a.getTime() - b.getTime());

            if (dates.length > 0) {
                dataRange = {
                    start: getDateKey(dates[0]),
                    end: getDateKey(dates[dates.length - 1]),
                };
            }
        }

        // Calculate retention metrics
        let retention: RetentionMetrics | null = null;
        if (userIdCol && timestampCol) {
            retention = this.calculateRetention(data, userIdCol, timestampCol, fullConfig);
            if (retention) availableMetrics.push('retention');
        }

        // Calculate engagement metrics
        let engagement: EngagementMetrics | null = null;
        if (userIdCol) {
            engagement = this.calculateEngagement(data, userIdCol, sessionIdCol, timestampCol, sessionDurationCol);
            if (engagement) availableMetrics.push('engagement');
        }

        // Calculate monetization metrics with spender segmentation
        let monetization: MonetizationMetrics | null = null;
        if (revenueCol && userIdCol) {
            monetization = this.calculateMonetization(data, userIdCol, revenueCol, retention, fullConfig);
            if (monetization) availableMetrics.push('monetization');
        }

        // Calculate progression metrics
        let progression: ProgressionMetrics | null = null;
        if (levelCol && userIdCol) {
            progression = this.calculateProgression(data, userIdCol, levelCol);
            if (progression) availableMetrics.push('progression');
        }

        // Calculate DAU trend
        let dauTrend: DAUTrendPoint[] | null = null;
        if (userIdCol && timestampCol) {
            dauTrend = this.calculateDAUTrend(data, userIdCol, timestampCol);
            if (dauTrend && dauTrend.length > 0) availableMetrics.push('dauTrend');
        }

        // Calculate revenue breakdowns by dimension
        let revenueBreakdowns: CalculatedMetrics['revenueBreakdowns'] = null;
        if (revenueCol && userIdCol) {
            revenueBreakdowns = this.calculateRevenueBreakdowns(data, userIdCol, revenueCol, columnMeanings);
            if (revenueBreakdowns) availableMetrics.push('revenueBreakdowns');
        }

        // Calculate confidence based on data completeness
        const confidence = this.calculateConfidence(
            data,
            { userIdCol, timestampCol, sessionIdCol, revenueCol, levelCol }
        );

        // Build summary for quick access
        const totalUsers = userIdCol ? new Set(data.rows.map(r => r[userIdCol])).size : 0;
        const summary = {
            totalUsers,
            totalRevenue: monetization?.totalRevenue ?? 0,
            arpu: monetization?.arpu ?? 0,
            d1Retention: retention?.d1 ?? null,
            d7Retention: retention?.d7 ?? null,
            conversionRate: monetization?.conversionRate ?? null,
        };

        return {
            retention,
            engagement,
            monetization,
            progression,
            dauTrend,
            revenueBreakdowns,
            calculatedAt: new Date().toISOString(),
            dataRange,
            confidence,
            availableMetrics,
            summary,
        };
    }

    /**
     * Calculate retention metrics (D1, D3, D7, etc.)
     * Optimized: Pre-calculates max days since first activity per user to avoid O(n²)
     */
    calculateRetention(
        data: NormalizedData,
        userIdCol: string,
        timestampCol: string,
        config: MetricConfig
    ): RetentionMetrics | null {
        // Group users by their first activity date (cohort)
        const userFirstDay = new Map<string, Date>();
        const userActivityDays = new Map<string, Set<string>>();

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            const date = parseDate(row[timestampCol]);

            if (!userId || !date) continue;

            // Track first activity
            const existing = userFirstDay.get(userId);
            if (!existing || date < existing) {
                userFirstDay.set(userId, date);
            }

            // Track all activity days
            if (!userActivityDays.has(userId)) {
                userActivityDays.set(userId, new Set());
            }
            userActivityDays.get(userId)!.add(getDateKey(date));
        }

        if (userFirstDay.size === 0) return null;

        // Pre-calculate max days since first activity for each user (O(n) optimization)
        // This avoids the O(n²) inner loop when checking rolling retention
        const userMaxDaysSinceFirst = new Map<string, number>();
        for (const [userId, firstDay] of userFirstDay) {
            const activityDays = userActivityDays.get(userId)!;
            let maxDays = 0;
            for (const activityDay of activityDays) {
                const actDate = new Date(activityDay);
                const days = daysBetween(firstDay, actDate);
                if (days > maxDays) maxDays = days;
            }
            userMaxDaysSinceFirst.set(userId, maxDays);
        }

        // Calculate classic retention (Dn)
        const classic: Record<string, number> = {};
        const rolling: Record<string, number> = {};
        const now = new Date();

        for (const day of config.retentionDays) {
            let retained = 0;
            let rollingRetained = 0;
            let eligible = 0;

            for (const [userId, firstDay] of userFirstDay) {
                // Only count users whose first day is old enough
                if (daysBetween(firstDay, now) < day) continue;

                eligible++;

                const activityDays = userActivityDays.get(userId)!;
                const targetDate = new Date(firstDay);
                targetDate.setDate(targetDate.getDate() + day);

                // Classic: active on exactly day N
                if (activityDays.has(getDateKey(targetDate))) {
                    retained++;
                }

                // Rolling: active on day N or any day after (O(1) lookup)
                const maxDays = userMaxDaysSinceFirst.get(userId)!;
                if (maxDays >= day) {
                    rollingRetained++;
                }
            }

            if (eligible > 0) {
                classic[`D${day}`] = Math.round((retained / eligible) * 100 * 100) / 100;
                rolling[`D${day}`] = Math.round((rollingRetained / eligible) * 100 * 100) / 100;
            }
        }

        // Calculate overall return rate
        let returnedUsers = 0;
        for (const [, activityDays] of userActivityDays) {
            if (activityDays.size > 1) returnedUsers++;
        }
        const returnRate = Math.round((returnedUsers / userFirstDay.size) * 100 * 100) / 100;

        // Extract convenience D1, D7, D30 values
        const d1 = classic['D1'] ?? 0;
        const d7 = classic['D7'] ?? 0;
        const d30 = classic['D30'] ?? 0;

        // Calculate confidence based on sample size and data availability
        const totalEligibleUsers = userFirstDay.size;
        let retentionConfidence = 0.5;
        if (totalEligibleUsers >= 1000) retentionConfidence = 0.9;
        else if (totalEligibleUsers >= 500) retentionConfidence = 0.8;
        else if (totalEligibleUsers >= 100) retentionConfidence = 0.7;
        else if (totalEligibleUsers >= 50) retentionConfidence = 0.6;

        return {
            classic,
            rolling,
            returnRate,
            d1,
            d7,
            d30,
            confidence: retentionConfidence,
        };
    }

    /**
     * Calculate engagement metrics (DAU, WAU, MAU, sessions)
     */
    calculateEngagement(
        data: NormalizedData,
        userIdCol: string,
        sessionIdCol: string | null,
        timestampCol: string | null,
        sessionDurationCol: string | null = null
    ): EngagementMetrics | null {
        const uniqueUsers = new Set<string>();
        const sessionsPerUser = new Map<string, Set<string>>();
        const dailyUsers = new Map<string, Set<string>>();
        const sessionDurations: number[] = [];

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            if (!userId) continue;

            uniqueUsers.add(userId);

            // Track sessions per user
            if (sessionIdCol) {
                const sessionId = String(row[sessionIdCol] ?? '');
                if (sessionId) {
                    if (!sessionsPerUser.has(userId)) {
                        sessionsPerUser.set(userId, new Set());
                    }
                    sessionsPerUser.get(userId)!.add(sessionId);
                }
            }

            // Track session durations if available
            if (sessionDurationCol) {
                const duration = getNumericValue(row, sessionDurationCol);
                if (duration > 0) {
                    sessionDurations.push(duration);
                }
            }

            // Track daily active users
            if (timestampCol) {
                const date = parseDate(row[timestampCol]);
                if (date) {
                    const dayKey = getDateKey(date);
                    if (!dailyUsers.has(dayKey)) {
                        dailyUsers.set(dayKey, new Set());
                    }
                    dailyUsers.get(dayKey)!.add(userId);
                }
            }
        }

        if (uniqueUsers.size === 0) return null;

        // Calculate DAU (average daily users)
        let dau = 0;
        let wau = 0;
        let mau = 0;

        if (dailyUsers.size > 0) {
            const dailyCounts = Array.from(dailyUsers.values()).map(s => s.size);
            dau = Math.round(dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length);

            // WAU: unique users in last 7 days
            const sortedDays = Array.from(dailyUsers.keys()).sort().reverse();
            const weekUsers = new Set<string>();
            for (let i = 0; i < Math.min(7, sortedDays.length); i++) {
                const users = dailyUsers.get(sortedDays[i])!;
                users.forEach(u => weekUsers.add(u));
            }
            wau = weekUsers.size;

            // MAU: unique users in last 30 days
            const monthUsers = new Set<string>();
            for (let i = 0; i < Math.min(30, sortedDays.length); i++) {
                const users = dailyUsers.get(sortedDays[i])!;
                users.forEach(u => monthUsers.add(u));
            }
            mau = monthUsers.size;
        } else {
            // Fallback: use total unique users
            dau = uniqueUsers.size;
            mau = uniqueUsers.size;
            wau = uniqueUsers.size;
        }

        // Calculate sessions
        let totalSessions = 0;
        if (sessionIdCol) {
            const uniqueSessions = new Set<string>();
            for (const row of data.rows) {
                const sessionId = String(row[sessionIdCol] ?? '');
                if (sessionId) uniqueSessions.add(sessionId);
            }
            totalSessions = uniqueSessions.size;
        }

        const avgSessionsPerUser = sessionsPerUser.size > 0
            ? Array.from(sessionsPerUser.values()).reduce((sum, s) => sum + s.size, 0) / sessionsPerUser.size
            : 0;

        // Calculate session length metrics
        let avgSessionLength = 0;
        let medianSessionLength = 0;
        if (sessionDurations.length > 0) {
            avgSessionLength = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
            const sorted = [...sessionDurations].sort((a, b) => a - b);
            medianSessionLength = sorted[Math.floor(sorted.length / 2)];
        }

        // Calculate session frequency (sessions per day per active user)
        const numDays = dailyUsers.size || 1;
        const sessionFrequency = dau > 0 ? (totalSessions / numDays) / dau : 0;

        // Calculate confidence
        let engagementConfidence = 0.5;
        if (uniqueUsers.size >= 1000 && dailyUsers.size >= 7) engagementConfidence = 0.9;
        else if (uniqueUsers.size >= 500 && dailyUsers.size >= 7) engagementConfidence = 0.8;
        else if (uniqueUsers.size >= 100) engagementConfidence = 0.7;
        else if (uniqueUsers.size >= 50) engagementConfidence = 0.6;

        return {
            dau,
            wau,
            mau,
            dauMauRatio: mau > 0 ? Math.round((dau / mau) * 100) / 100 : 0,
            avgSessionsPerUser: Math.round(avgSessionsPerUser * 100) / 100,
            avgSessionLength: Math.round(avgSessionLength),
            medianSessionLength: Math.round(medianSessionLength),
            totalSessions,
            sessionFrequency: Math.round(sessionFrequency * 100) / 100,
            confidence: engagementConfidence,
        };
    }

    /**
     * Calculate monetization metrics (ARPU, ARPPU, conversion, spender segmentation)
     */
    calculateMonetization(
        data: NormalizedData,
        userIdCol: string,
        revenueCol: string,
        retention: RetentionMetrics | null,
        config: MetricConfig = DEFAULT_CONFIG
    ): MonetizationMetrics | null {
        const uniqueUsers = new Set<string>();
        const payingUsers = new Set<string>();
        const revenueByUser = new Map<string, number>();
        const purchaseCountByUser = new Map<string, number>();
        const revenueBySource = new Map<string, number>();
        let totalRevenue = 0;
        let totalTransactions = 0;

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            if (!userId) continue;

            uniqueUsers.add(userId);

            const revenue = getNumericValue(row, revenueCol);
            if (revenue > 0) {
                payingUsers.add(userId);
                totalRevenue += revenue;
                totalTransactions++;

                const currentUserRevenue = revenueByUser.get(userId) ?? 0;
                revenueByUser.set(userId, currentUserRevenue + revenue);

                const currentPurchaseCount = purchaseCountByUser.get(userId) ?? 0;
                purchaseCountByUser.set(userId, currentPurchaseCount + 1);

                // Track by source if category column exists
                const category = String(row['category'] ?? row['source'] ?? 'unknown');
                const currentSourceRevenue = revenueBySource.get(category) ?? 0;
                revenueBySource.set(category, currentSourceRevenue + revenue);
            }
        }

        if (uniqueUsers.size === 0) return null;

        const totalUsers = uniqueUsers.size;
        const arpu = totalRevenue / totalUsers;
        const arppu = payingUsers.size > 0 ? totalRevenue / payingUsers.size : 0;
        const conversionRate = (payingUsers.size / totalUsers) * 100;

        // Calculate spender segments (Whale/Dolphin/Minnow)
        const spenderSegments = this.calculateSpenderSegments(
            revenueByUser,
            totalUsers,
            totalRevenue,
            config
        );

        // Find whale stats
        const whaleSegment = spenderSegments.find(s => s.tier === 'whale');
        const whaleRevenue = whaleSegment?.totalRevenue ?? 0;
        const whaleRevenuePercentage = totalRevenue > 0
            ? (whaleRevenue / totalRevenue) * 100
            : 0;

        // Calculate average transaction value and purchase frequency
        const avgTransactionValue = totalTransactions > 0
            ? totalRevenue / totalTransactions
            : 0;
        const purchaseFrequency = payingUsers.size > 0
            ? Array.from(purchaseCountByUser.values()).reduce((a, b) => a + b, 0) / payingUsers.size
            : 0;

        // LTV Projections using retention curve
        let ltvD7 = arpu * 7;
        let ltvD30 = arpu * 30;
        let ltvD90 = arpu * 90;

        if (retention && Object.keys(retention.classic).length > 0) {
            // Use weighted retention for more accurate LTV
            const d1 = (retention.classic['D1'] ?? 100) / 100;
            const d7 = (retention.classic['D7'] ?? d1 * 0.5) / 100;
            const d30 = (retention.classic['D30'] ?? d7 * 0.3) / 100;

            // LTV = ARPU * sum of daily retention
            // Approximate with key retention points
            ltvD7 = arpu * (1 + d1 * 6);
            ltvD30 = arpu * (1 + d1 * 6 + d7 * 23);
            ltvD90 = arpu * (1 + d1 * 6 + d7 * 23 + d30 * 60);
        }

        // Calculate confidence based on sample size and data quality
        let monetizationConfidence = 0.5;
        if (payingUsers.size >= 500) monetizationConfidence = 0.9;
        else if (payingUsers.size >= 200) monetizationConfidence = 0.8;
        else if (payingUsers.size >= 50) monetizationConfidence = 0.7;
        else if (payingUsers.size >= 20) monetizationConfidence = 0.6;

        return {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            arpu: Math.round(arpu * 100) / 100,
            arppu: Math.round(arppu * 100) / 100,
            conversionRate: Math.round(conversionRate * 100) / 100,
            payingUsers: payingUsers.size,
            totalUsers,
            ltvProjection: Math.round(ltvD30 * 100) / 100, // Default to D30
            ltvD7: Math.round(ltvD7 * 100) / 100,
            ltvD30: Math.round(ltvD30 * 100) / 100,
            ltvD90: Math.round(ltvD90 * 100) / 100,
            revenueBySource: Object.fromEntries(revenueBySource),
            spenderSegments,
            whaleRevenue: Math.round(whaleRevenue * 100) / 100,
            whaleRevenuePercentage: Math.round(whaleRevenuePercentage * 100) / 100,
            avgTransactionValue: Math.round(avgTransactionValue * 100) / 100,
            purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
            confidence: monetizationConfidence,
        };
    }

    /**
     * Calculate whale/dolphin/minnow spender segments
     */
    private calculateSpenderSegments(
        revenueByUser: Map<string, number>,
        totalUsers: number,
        totalRevenue: number,
        config: MetricConfig
    ): SpenderSegment[] {
        const segments: SpenderSegment[] = [];
        const nonPayerCount = totalUsers - revenueByUser.size;

        // Categorize users into segments
        let whaleUsers = 0, whaleRev = 0;
        let dolphinUsers = 0, dolphinRev = 0;
        let minnowUsers = 0, minnowRev = 0;

        for (const [, revenue] of revenueByUser) {
            if (revenue >= config.whaleThreshold) {
                whaleUsers++;
                whaleRev += revenue;
            } else if (revenue >= config.dolphinThreshold) {
                dolphinUsers++;
                dolphinRev += revenue;
            } else if (revenue >= config.minnowThreshold) {
                minnowUsers++;
                minnowRev += revenue;
            }
        }

        // Build segments array
        segments.push({
            tier: 'whale',
            label: `Whales ($${config.whaleThreshold}+)`,
            userCount: whaleUsers,
            percentage: totalUsers > 0 ? (whaleUsers / totalUsers) * 100 : 0,
            totalRevenue: whaleRev,
            revenuePercentage: totalRevenue > 0 ? (whaleRev / totalRevenue) * 100 : 0,
            avgSpend: whaleUsers > 0 ? whaleRev / whaleUsers : 0,
            thresholdMin: config.whaleThreshold,
            thresholdMax: null,
        });

        segments.push({
            tier: 'dolphin',
            label: `Dolphins ($${config.dolphinThreshold}-$${config.whaleThreshold})`,
            userCount: dolphinUsers,
            percentage: totalUsers > 0 ? (dolphinUsers / totalUsers) * 100 : 0,
            totalRevenue: dolphinRev,
            revenuePercentage: totalRevenue > 0 ? (dolphinRev / totalRevenue) * 100 : 0,
            avgSpend: dolphinUsers > 0 ? dolphinRev / dolphinUsers : 0,
            thresholdMin: config.dolphinThreshold,
            thresholdMax: config.whaleThreshold,
        });

        segments.push({
            tier: 'minnow',
            label: `Minnows ($${config.minnowThreshold}-$${config.dolphinThreshold})`,
            userCount: minnowUsers,
            percentage: totalUsers > 0 ? (minnowUsers / totalUsers) * 100 : 0,
            totalRevenue: minnowRev,
            revenuePercentage: totalRevenue > 0 ? (minnowRev / totalRevenue) * 100 : 0,
            avgSpend: minnowUsers > 0 ? minnowRev / minnowUsers : 0,
            thresholdMin: config.minnowThreshold,
            thresholdMax: config.dolphinThreshold,
        });

        segments.push({
            tier: 'non_payer',
            label: 'Non-Payers',
            userCount: nonPayerCount,
            percentage: totalUsers > 0 ? (nonPayerCount / totalUsers) * 100 : 0,
            totalRevenue: 0,
            revenuePercentage: 0,
            avgSpend: 0,
            thresholdMin: 0,
            thresholdMax: config.minnowThreshold,
        });

        return segments;
    }

    /**
     * Calculate progression metrics (level completion, difficulty spikes, bottlenecks)
     */
    calculateProgression(
        data: NormalizedData,
        userIdCol: string,
        levelCol: string
    ): ProgressionMetrics | null {
        const userMaxLevel = new Map<string, number>();
        const levelAttempts = new Map<number, number>();
        const levelCompletions = new Map<number, number>();
        const usersAtLevel = new Map<number, Set<string>>();

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            const level = getNumericValue(row, levelCol);

            if (!userId || level <= 0) continue;

            // Track max level per user
            const currentMax = userMaxLevel.get(userId) ?? 0;
            if (level > currentMax) {
                userMaxLevel.set(userId, level);
            }

            // Track attempts at each level
            const attempts = levelAttempts.get(level) ?? 0;
            levelAttempts.set(level, attempts + 1);

            // Track users at each level
            if (!usersAtLevel.has(level)) {
                usersAtLevel.set(level, new Set());
            }
            usersAtLevel.get(level)!.add(userId);

            // Assume reaching level N means completing level N-1
            if (level > 1) {
                const completions = levelCompletions.get(level - 1) ?? 0;
                levelCompletions.set(level - 1, completions + 1);
            }
        }

        if (userMaxLevel.size === 0) return null;

        // Calculate completion rates
        const levelCompletionRates: Record<string, number> = {};
        const totalUsers = userMaxLevel.size;

        for (const [level, completions] of levelCompletions) {
            levelCompletionRates[`Level ${level}`] = Math.round((completions / totalUsers) * 100 * 100) / 100;
        }

        // Find max level and average
        const levels = Array.from(userMaxLevel.values());
        const maxLevelReached = Math.max(...levels);
        const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

        // Calculate median level
        const sortedLevels = [...levels].sort((a, b) => a - b);
        const medianLevel = sortedLevels[Math.floor(sortedLevels.length / 2)];

        // Detect difficulty spikes (levels with significantly lower completion rate)
        const difficultySpikes: string[] = [];
        const bottleneckLevels: Array<{ level: string; dropOffRate: number; usersLost: number }> = [];

        const completionRates = Object.entries(levelCompletionRates)
            .map(([name, rate]) => ({ name, rate }))
            .sort((a, b) => parseInt(a.name.replace('Level ', '')) - parseInt(b.name.replace('Level ', '')));

        if (completionRates.length > 2) {
            const avgRate = completionRates.reduce((sum, l) => sum + l.rate, 0) / completionRates.length;

            for (let i = 1; i < completionRates.length; i++) {
                const prev = completionRates[i - 1];
                const curr = completionRates[i];
                const dropOff = prev.rate - curr.rate;

                // Spike if completion drops by more than 20% from previous or is 50% below average
                if (dropOff > 20 || curr.rate < avgRate * 0.5) {
                    difficultySpikes.push(curr.name);
                }

                // Track as bottleneck if significant user loss
                if (dropOff > 10) {
                    const levelNum = parseInt(curr.name.replace('Level ', ''));
                    const prevLevelUsers = usersAtLevel.get(levelNum - 1)?.size ?? totalUsers;
                    const usersLost = Math.round((dropOff / 100) * prevLevelUsers);

                    bottleneckLevels.push({
                        level: curr.name,
                        dropOffRate: Math.round(dropOff * 100) / 100,
                        usersLost,
                    });
                }
            }
        }

        // Sort bottlenecks by impact (users lost)
        bottleneckLevels.sort((a, b) => b.usersLost - a.usersLost);

        // Calculate confidence
        let progressionConfidence = 0.5;
        if (totalUsers >= 1000 && Object.keys(levelCompletionRates).length >= 10) {
            progressionConfidence = 0.9;
        } else if (totalUsers >= 500) {
            progressionConfidence = 0.8;
        } else if (totalUsers >= 100) {
            progressionConfidence = 0.7;
        } else if (totalUsers >= 50) {
            progressionConfidence = 0.6;
        }

        return {
            levelCompletionRates,
            maxLevelReached,
            avgLevel: Math.round(avgLevel * 100) / 100,
            medianLevel,
            difficultySpikes,
            bottleneckLevels: bottleneckLevels.slice(0, 5), // Top 5 bottlenecks
            confidence: progressionConfidence,
        };
    }

    /**
     * Calculate DAU trend over time
     */
    calculateDAUTrend(
        data: NormalizedData,
        userIdCol: string,
        timestampCol: string
    ): DAUTrendPoint[] {
        const dailyUsers = new Map<string, Set<string>>();

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            const date = parseDate(row[timestampCol]);

            if (!userId || !date) continue;

            const dayKey = getDateKey(date);
            if (!dailyUsers.has(dayKey)) {
                dailyUsers.set(dayKey, new Set());
            }
            dailyUsers.get(dayKey)!.add(userId);
        }

        // Convert to array and sort by date
        const trend: DAUTrendPoint[] = Array.from(dailyUsers.entries())
            .map(([date, users]) => ({ date, users: users.size }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return trend;
    }

    /**
     * Calculate revenue breakdowns by different dimensions
     */
    calculateRevenueBreakdowns(
        data: NormalizedData,
        userIdCol: string,
        revenueCol: string,
        columnMeanings: ColumnMeaning[]
    ): CalculatedMetrics['revenueBreakdowns'] {
        // Find dimension columns
        const sourceCol = findColumn(columnMeanings, 'acquisition_source') ||
            columnMeanings.find(m => m.column.toLowerCase().includes('source') ||
                m.column.toLowerCase().includes('channel') ||
                m.column.toLowerCase().includes('utm'))?.column;

        const countryCol = findColumn(columnMeanings, 'country') ||
            columnMeanings.find(m => m.column.toLowerCase().includes('country') ||
                m.column.toLowerCase().includes('region') ||
                m.column.toLowerCase().includes('geo'))?.column;

        const platformCol = findColumn(columnMeanings, 'platform') ||
            columnMeanings.find(m => m.column.toLowerCase().includes('platform') ||
                m.column.toLowerCase().includes('device') ||
                m.column.toLowerCase().includes('os'))?.column;

        const productCol = findColumn(columnMeanings, 'item_id') ||
            columnMeanings.find(m => m.column.toLowerCase().includes('product') ||
                m.column.toLowerCase().includes('sku') ||
                m.column.toLowerCase().includes('item'))?.column;

        // Calculate total revenue for percentage calculations
        let totalRevenue = 0;
        for (const row of data.rows) {
            totalRevenue += getNumericValue(row, revenueCol);
        }

        const result: CalculatedMetrics['revenueBreakdowns'] = {
            source: [],
            country: [],
            platform: [],
            product: [],
        };

        // Helper to calculate breakdown for a dimension
        const calculateBreakdown = (dimensionCol: string | undefined): RevenueBreakdownItem[] => {
            if (!dimensionCol) return [];

            const breakdown = new Map<string, { revenue: number; users: Set<string> }>();

            for (const row of data.rows) {
                const dimension = String(row[dimensionCol] ?? 'Unknown');
                const revenue = getNumericValue(row, revenueCol);
                const userId = String(row[userIdCol] ?? '');

                if (!breakdown.has(dimension)) {
                    breakdown.set(dimension, { revenue: 0, users: new Set() });
                }

                const entry = breakdown.get(dimension)!;
                entry.revenue += revenue;
                if (userId) entry.users.add(userId);
            }

            return Array.from(breakdown.entries())
                .map(([dimension, data]) => ({
                    dimension,
                    value: Math.round(data.revenue * 100) / 100,
                    percentage: totalRevenue > 0
                        ? Math.round((data.revenue / totalRevenue) * 100 * 100) / 100
                        : 0,
                    userCount: data.users.size,
                }))
                .filter(item => item.value > 0)
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);
        };

        result.source = calculateBreakdown(sourceCol);
        result.country = calculateBreakdown(countryCol);
        result.platform = calculateBreakdown(platformCol);
        result.product = calculateBreakdown(productCol);

        return result;
    }

    /**
     * Calculate confidence based on data quality
     */
    private calculateConfidence(
        data: NormalizedData,
        columns: {
            userIdCol: string | null;
            timestampCol: string | null;
            sessionIdCol: string | null;
            revenueCol: string | null;
            levelCol: string | null;
        }
    ): number {
        let score = 0;
        let maxScore = 5;

        // Check each critical column
        if (columns.userIdCol) score++;
        if (columns.timestampCol) score++;
        if (columns.sessionIdCol) score++;
        if (columns.revenueCol) score++;
        if (columns.levelCol) score++;

        // Bonus for sufficient data volume
        if (data.rows.length >= 1000) score += 0.5;
        if (data.rows.length >= 10000) score += 0.5;
        maxScore += 1;

        return Math.round((score / maxScore) * 100) / 100;
    }
}

export const metricCalculator = new MetricCalculator();
