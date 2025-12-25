/**
 * Metric Calculator
 * Automatically calculates standard game metrics from raw data
 */

import { NormalizedData } from '../adapters/BaseAdapter';
import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';

// ============ CONFIGURATION ============

export interface MetricConfig {
    retentionDays: number[];
    rollingWindowDays: number;
    ltvProjectionDays: number;
}

const DEFAULT_CONFIG: MetricConfig = {
    retentionDays: [1, 3, 7, 14, 30],
    rollingWindowDays: 7,
    ltvProjectionDays: 90,
};

// ============ METRIC TYPES ============

export interface RetentionMetrics {
    classic: Record<string, number>;      // D1, D3, D7... -> percentage
    rolling: Record<string, number>;      // Rolling retention
    returnRate: number;                   // Overall return rate
}

export interface EngagementMetrics {
    dau: number;
    wau: number;
    mau: number;
    dauMauRatio: number;                  // Stickiness (0-1)
    avgSessionsPerUser: number;
    avgSessionLength: number;             // In seconds
    totalSessions: number;
}

export interface MonetizationMetrics {
    totalRevenue: number;
    arpu: number;                         // Average Revenue Per User
    arppu: number;                        // Average Revenue Per Paying User
    conversionRate: number;               // Free to paying %
    payingUsers: number;
    ltvProjection: number;
    revenueBySource: Record<string, number>;
}

export interface ProgressionMetrics {
    levelCompletionRates: Record<string, number>;
    maxLevelReached: number;
    avgLevel: number;
    difficultySpikes: string[];           // Levels with > 2x avg fail rate
}

export interface CalculatedMetrics {
    retention: RetentionMetrics | null;
    engagement: EngagementMetrics | null;
    monetization: MonetizationMetrics | null;
    progression: ProgressionMetrics | null;
    calculatedAt: string;
    dataRange: { start: string; end: string } | null;
    confidence: number;
    availableMetrics: string[];
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
        const revenueCol = findColumn(columnMeanings, 'revenue', 'price');
        const levelCol = findColumn(columnMeanings, 'level');

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
            engagement = this.calculateEngagement(data, userIdCol, sessionIdCol, timestampCol);
            if (engagement) availableMetrics.push('engagement');
        }

        // Calculate monetization metrics
        let monetization: MonetizationMetrics | null = null;
        if (revenueCol && userIdCol) {
            monetization = this.calculateMonetization(data, userIdCol, revenueCol, retention);
            if (monetization) availableMetrics.push('monetization');
        }

        // Calculate progression metrics
        let progression: ProgressionMetrics | null = null;
        if (levelCol && userIdCol) {
            progression = this.calculateProgression(data, userIdCol, levelCol);
            if (progression) availableMetrics.push('progression');
        }

        // Calculate confidence based on data completeness
        const confidence = this.calculateConfidence(
            data,
            { userIdCol, timestampCol, sessionIdCol, revenueCol, levelCol }
        );

        return {
            retention,
            engagement,
            monetization,
            progression,
            calculatedAt: new Date().toISOString(),
            dataRange,
            confidence,
            availableMetrics,
        };
    }

    /**
     * Calculate retention metrics (D1, D3, D7, etc.)
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

        // Calculate classic retention (Dn)
        const classic: Record<string, number> = {};
        const rolling: Record<string, number> = {};

        for (const day of config.retentionDays) {
            let retained = 0;
            let rollingRetained = 0;
            let eligible = 0;

            for (const [userId, firstDay] of userFirstDay) {
                const activityDays = userActivityDays.get(userId)!;
                const targetDate = new Date(firstDay);
                targetDate.setDate(targetDate.getDate() + day);

                // Only count users whose first day is old enough
                const now = new Date();
                if (daysBetween(firstDay, now) < day) continue;

                eligible++;

                // Classic: active on exactly day N
                if (activityDays.has(getDateKey(targetDate))) {
                    retained++;
                }

                // Rolling: active on day N or any day after
                for (const activityDay of activityDays) {
                    const actDate = new Date(activityDay);
                    if (daysBetween(firstDay, actDate) >= day) {
                        rollingRetained++;
                        break;
                    }
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

        return {
            classic,
            rolling,
            returnRate,
        };
    }

    /**
     * Calculate engagement metrics (DAU, WAU, MAU, sessions)
     */
    calculateEngagement(
        data: NormalizedData,
        userIdCol: string,
        sessionIdCol: string | null,
        timestampCol: string | null
    ): EngagementMetrics | null {
        const uniqueUsers = new Set<string>();
        const sessionsPerUser = new Map<string, Set<string>>();
        const dailyUsers = new Map<string, Set<string>>();

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

        return {
            dau,
            wau,
            mau,
            dauMauRatio: mau > 0 ? Math.round((dau / mau) * 100) / 100 : 0,
            avgSessionsPerUser: Math.round(avgSessionsPerUser * 100) / 100,
            avgSessionLength: 0, // Would need session start/end events
            totalSessions,
        };
    }

    /**
     * Calculate monetization metrics (ARPU, ARPPU, conversion)
     */
    calculateMonetization(
        data: NormalizedData,
        userIdCol: string,
        revenueCol: string,
        retention: RetentionMetrics | null
    ): MonetizationMetrics | null {
        const uniqueUsers = new Set<string>();
        const payingUsers = new Set<string>();
        const revenueByUser = new Map<string, number>();
        const revenueBySource = new Map<string, number>();
        let totalRevenue = 0;

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            if (!userId) continue;

            uniqueUsers.add(userId);

            const revenue = getNumericValue(row, revenueCol);
            if (revenue > 0) {
                payingUsers.add(userId);
                totalRevenue += revenue;

                const currentUserRevenue = revenueByUser.get(userId) ?? 0;
                revenueByUser.set(userId, currentUserRevenue + revenue);

                // Track by source if category column exists
                const category = String(row['category'] ?? row['source'] ?? 'unknown');
                const currentSourceRevenue = revenueBySource.get(category) ?? 0;
                revenueBySource.set(category, currentSourceRevenue + revenue);
            }
        }

        if (uniqueUsers.size === 0) return null;

        const arpu = totalRevenue / uniqueUsers.size;
        const arppu = payingUsers.size > 0 ? totalRevenue / payingUsers.size : 0;
        const conversionRate = (payingUsers.size / uniqueUsers.size) * 100;

        // LTV Projection: ARPU * expected lifetime
        // Use retention curve if available, otherwise estimate
        let ltvProjection = arpu * 30; // Default: 30 day LTV
        if (retention && Object.keys(retention.classic).length > 0) {
            // Sum retention percentages as expected lifetime
            const retentionSum = Object.values(retention.classic).reduce((a, b) => a + b, 0) / 100;
            ltvProjection = arpu * retentionSum * 30;
        }

        return {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            arpu: Math.round(arpu * 100) / 100,
            arppu: Math.round(arppu * 100) / 100,
            conversionRate: Math.round(conversionRate * 100) / 100,
            payingUsers: payingUsers.size,
            ltvProjection: Math.round(ltvProjection * 100) / 100,
            revenueBySource: Object.fromEntries(revenueBySource),
        };
    }

    /**
     * Calculate progression metrics (level completion, difficulty spikes)
     */
    calculateProgression(
        data: NormalizedData,
        userIdCol: string,
        levelCol: string
    ): ProgressionMetrics | null {
        const userMaxLevel = new Map<string, number>();
        const levelAttempts = new Map<number, number>();
        const levelCompletions = new Map<number, number>();

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

        // Detect difficulty spikes (levels with significantly lower completion rate)
        const difficultySpikes: string[] = [];
        const completionRates = Object.entries(levelCompletionRates)
            .map(([name, rate]) => ({ name, rate }))
            .sort((a, b) => parseInt(a.name.replace('Level ', '')) - parseInt(b.name.replace('Level ', '')));

        if (completionRates.length > 2) {
            const avgRate = completionRates.reduce((sum, l) => sum + l.rate, 0) / completionRates.length;

            for (let i = 1; i < completionRates.length; i++) {
                const prev = completionRates[i - 1];
                const curr = completionRates[i];

                // Spike if completion drops by more than 20% from previous or is 50% below average
                if ((prev.rate - curr.rate) > 20 || curr.rate < avgRate * 0.5) {
                    difficultySpikes.push(curr.name);
                }
            }
        }

        return {
            levelCompletionRates,
            maxLevelReached,
            avgLevel: Math.round(avgLevel * 100) / 100,
            difficultySpikes,
        };
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
