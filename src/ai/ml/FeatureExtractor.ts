/**
 * Feature Extractor
 * Extracts ML features from raw game data
 * Phase 3: AI/ML Integration
 */

import type { GameData, ColumnMapping } from '../../lib/dataStore';
import type { UserFeatures, AggregateFeatures } from './types';

// ============================================================================
// Types
// ============================================================================

export interface TimeSeriesPoint {
    date: string;
    value: number;
}

interface DateGroupedRows {
    date: string;
    rows: Record<string, unknown>[];
}

// ============================================================================
// Feature Extractor Class
// ============================================================================

export class FeatureExtractor {
    private rawData: Record<string, unknown>[];
    private columnMappings: ColumnMapping[];
    private columnRoles: Map<string, string>;

    constructor(gameData: GameData) {
        this.rawData = gameData.rawData;
        this.columnMappings = gameData.columnMappings;
        this.columnRoles = this.buildColumnRoles();
    }

    // ========================================================================
    // Public Methods
    // ========================================================================

    /**
     * Extract features for all users
     */
    extractAllUserFeatures(): UserFeatures[] {
        const userIds = this.getUniqueUsers();
        return userIds.map(id => this.extractUserFeatures(id));
    }

    /**
     * Extract features for a single user
     */
    extractUserFeatures(userId: string): UserFeatures {
        const userRows = this.getUserRows(userId);
        if (userRows.length === 0) return this.getDefaultUserFeatures(userId);

        const now = Date.now();
        const firstSessionDate = this.getEarliestDate(userRows);
        const lastSessionDate = this.getLatestDate(userRows);
        const daysSinceFirst = Math.floor((now - firstSessionDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate activity metrics
        const sessionsLast7d = this.countRowsInDateRange(userRows, 7);
        const sessionsLast30d = this.countRowsInDateRange(userRows, 30);
        const sessionTrend = this.calculateSessionTrend(userRows);
        const lastSessionHoursAgo = Math.floor((now - lastSessionDate.getTime()) / (1000 * 60 * 60));

        // Calculate monetization metrics
        const totalSpend = this.sumValue(userRows, 'revenue') || 0;
        const purchaseCount = this.countPurchases(userRows);
        const lastPurchaseDate = this.getLastPurchaseDate(userRows);
        const daysSinceLastPurchase = lastPurchaseDate
            ? Math.floor((now - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        // Calculate progression metrics
        const currentLevel = this.maxValue(userRows, 'level') || 1;
        const progressionSpeed = daysSinceFirst > 0 ? currentLevel / daysSinceFirst : 0;
        const failureRate = this.calculateFailureRate(userRows);

        // Calculate engagement metrics
        const uniqueDays = this.countUniqueDays(userRows);
        const avgSessionLength = this.avgValue(userRows, 'duration') || this.avgValue(userRows, 'session_length') || 300;
        const weeklyActiveRatio = Math.min(1, uniqueDays / Math.max(7, Math.min(daysSinceFirst, 30)));

        // Determine cohort
        const cohort = this.getCohort(firstSessionDate);

        return {
            userId,
            cohort,
            // Activity
            sessionCount7d: sessionsLast7d,
            sessionCount30d: sessionsLast30d,
            sessionTrend,
            lastSessionHoursAgo,
            avgSessionLength,
            totalPlayTime: this.sumValue(userRows, 'duration') || userRows.length * avgSessionLength,
            // Progression
            currentLevel,
            maxLevelReached: currentLevel,
            progressionSpeed,
            failureRate,
            stuckAtLevel: failureRate > 0.5 && sessionsLast7d < 3,
            // Monetization
            totalSpend,
            purchaseCount,
            avgPurchaseValue: purchaseCount > 0 ? totalSpend / purchaseCount : 0,
            daysSinceLastPurchase,
            isPayer: totalSpend > 0,
            // Engagement
            daysActive: uniqueDays,
            daysSinceFirstSession: daysSinceFirst,
            weeklyActiveRatio,
            peakPlayHour: this.getPeakPlayHour(userRows),
            featureUsage: this.getFeatureUsage(userRows),
        };
    }

    /**
     * Extract aggregate features for the entire dataset
     */
    extractAggregateFeatures(): AggregateFeatures {
        const today = new Date();
        const allUsers = this.getUniqueUsers();
        const totalRevenue = this.sumAll('revenue') || 0;

        // Calculate DAU/WAU/MAU
        const dau = this.countActiveUsersInDays(1);
        const wau = this.countActiveUsersInDays(7);
        const mau = this.countActiveUsersInDays(30);

        // Calculate new vs returning
        const newUsers = this.countNewUsersInDays(1);
        const returningUsers = dau - newUsers;

        // Calculate retention
        const d1Retention = this.calculateRetention(1);
        const d7Retention = this.calculateRetention(7);
        const d30Retention = this.calculateRetention(30);

        // Calculate monetization metrics
        const arpu = allUsers.length > 0 ? totalRevenue / allUsers.length : 0;
        const payers = this.countPayers();
        const arppu = payers > 0 ? totalRevenue / payers : 0;
        const payerConversionRate = allUsers.length > 0 ? payers / allUsers.length : 0;

        // Calculate engagement
        const avgSessionLength = this.calculateAvgSessionLength();
        const avgSessionsPerUser = this.rawData.length / Math.max(1, allUsers.length);
        const avgLevelReached = this.calculateAvgLevel();

        return {
            date: today.toISOString().split('T')[0],
            dayOfWeek: today.getDay(),
            isWeekend: today.getDay() === 0 || today.getDay() === 6,
            dau,
            wau,
            mau,
            newUsers,
            returningUsers,
            d1Retention,
            d7Retention,
            d30Retention,
            revenue: this.sumRevenueInDays(1),
            arpu,
            arppu,
            payerConversionRate,
            avgSessionLength,
            avgSessionsPerUser,
            avgLevelReached,
        };
    }

    /**
     * Extract time series for a specific metric
     */
    extractTimeSeries(metric: 'revenue' | 'dau' | 'sessions'): TimeSeriesPoint[] {
        const grouped = this.groupByDate();

        return grouped.map(day => {
            let value: number;

            switch (metric) {
                case 'dau':
                    value = this.countUniqueInGroup(day.rows, 'user_id');
                    break;
                case 'revenue':
                    value = this.sumGroup(day.rows, 'revenue');
                    break;
                case 'sessions':
                    value = day.rows.length;
                    break;
                default:
                    value = 0;
            }

            return { date: day.date, value };
        });
    }

    /**
     * Get revenue data points for forecasting
     */
    extractRevenueDataPoints(): Array<{
        date: string;
        revenue: number;
        dau: number;
        newUsers: number;
        payers: number;
    }> {
        const grouped = this.groupByDate();

        return grouped.map(day => {
            const uniqueUsers = this.countUniqueInGroup(day.rows, 'user_id');
            const newUsers = day.rows.filter(row => this.isNewUser(row, day.date)).length;
            const payers = day.rows.filter(row => {
                const revenue = this.getNumericValue(row, 'revenue');
                return revenue !== null && revenue > 0;
            }).length;

            return {
                date: day.date,
                revenue: this.sumGroup(day.rows, 'revenue'),
                dau: uniqueUsers,
                newUsers: Math.min(newUsers, uniqueUsers),
                payers,
            };
        });
    }

    // ========================================================================
    // Private Methods - Column Helpers
    // ========================================================================

    private buildColumnRoles(): Map<string, string> {
        const roles = new Map<string, string>();

        for (const mapping of this.columnMappings) {
            roles.set(mapping.originalName.toLowerCase(), mapping.canonicalName);
            roles.set(mapping.canonicalName.toLowerCase(), mapping.canonicalName);
        }

        // Add common column name variations
        const variations: Record<string, string[]> = {
            'user_id': ['userid', 'user', 'player_id', 'playerid', 'id'],
            'timestamp': ['date', 'datetime', 'time', 'created_at', 'event_time'],
            'revenue': ['amount', 'price', 'purchase_amount', 'spend', 'value'],
            'level': ['lvl', 'stage', 'wave', 'floor'],
            'duration': ['session_length', 'time_played', 'playtime', 'session_duration'],
        };

        for (const [canonical, aliases] of Object.entries(variations)) {
            for (const alias of aliases) {
                if (!roles.has(alias)) {
                    roles.set(alias, canonical);
                }
            }
        }

        return roles;
    }

    private findColumn(canonicalName: string): string | null {
        // First check mappings
        for (const mapping of this.columnMappings) {
            if (mapping.canonicalName.toLowerCase() === canonicalName.toLowerCase()) {
                return mapping.originalName;
            }
        }

        // Check if column exists directly
        if (this.rawData.length > 0) {
            const firstRow = this.rawData[0];
            for (const key of Object.keys(firstRow)) {
                const role = this.columnRoles.get(key.toLowerCase());
                if (role === canonicalName) {
                    return key;
                }
                if (key.toLowerCase() === canonicalName.toLowerCase()) {
                    return key;
                }
            }
        }

        return null;
    }

    private getStringValue(row: Record<string, unknown>, canonicalName: string): string | null {
        const column = this.findColumn(canonicalName);
        if (!column) return null;
        const value = row[column];
        return value != null ? String(value) : null;
    }

    private getNumericValue(row: Record<string, unknown>, canonicalName: string): number | null {
        const column = this.findColumn(canonicalName);
        if (!column) return null;
        const value = row[column];
        if (value == null) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
    }

    private getDateValue(row: Record<string, unknown>, canonicalName: string): Date | null {
        const column = this.findColumn(canonicalName);
        if (!column) return null;
        const value = row[column];
        if (value == null) return null;
        const date = new Date(value as string | number);
        return isNaN(date.getTime()) ? null : date;
    }

    // ========================================================================
    // Private Methods - User Operations
    // ========================================================================

    private getUniqueUsers(): string[] {
        const userColumn = this.findColumn('user_id');
        if (!userColumn) return [];

        const users = new Set<string>();
        for (const row of this.rawData) {
            const userId = row[userColumn];
            if (userId != null) {
                users.add(String(userId));
            }
        }
        return Array.from(users);
    }

    private getUserRows(userId: string): Record<string, unknown>[] {
        const userColumn = this.findColumn('user_id');
        if (!userColumn) return [];

        return this.rawData.filter(row => String(row[userColumn]) === userId);
    }

    private countPayers(): number {
        const userColumn = this.findColumn('user_id');
        if (!userColumn) return 0;

        const payers = new Set<string>();
        for (const row of this.rawData) {
            const revenue = this.getNumericValue(row, 'revenue');
            if (revenue != null && revenue > 0) {
                const userId = row[userColumn];
                if (userId != null) {
                    payers.add(String(userId));
                }
            }
        }
        return payers.size;
    }

    // ========================================================================
    // Private Methods - Aggregations
    // ========================================================================

    private sumAll(canonicalName: string): number {
        let sum = 0;
        for (const row of this.rawData) {
            const value = this.getNumericValue(row, canonicalName);
            if (value != null) sum += value;
        }
        return sum;
    }

    private sumValue(rows: Record<string, unknown>[], canonicalName: string): number {
        let sum = 0;
        for (const row of rows) {
            const value = this.getNumericValue(row, canonicalName);
            if (value != null) sum += value;
        }
        return sum;
    }

    private avgValue(rows: Record<string, unknown>[], canonicalName: string): number {
        const values: number[] = [];
        for (const row of rows) {
            const value = this.getNumericValue(row, canonicalName);
            if (value != null) values.push(value);
        }
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    private maxValue(rows: Record<string, unknown>[], canonicalName: string): number {
        let max = 0;
        for (const row of rows) {
            const value = this.getNumericValue(row, canonicalName);
            if (value != null && value > max) max = value;
        }
        return max;
    }

    private sumGroup(rows: Record<string, unknown>[], canonicalName: string): number {
        return this.sumValue(rows, canonicalName);
    }

    private countUniqueInGroup(rows: Record<string, unknown>[], canonicalName: string): number {
        const column = this.findColumn(canonicalName);
        if (!column) return 0;

        const unique = new Set<string>();
        for (const row of rows) {
            const value = row[column];
            if (value != null) unique.add(String(value));
        }
        return unique.size;
    }

    // ========================================================================
    // Private Methods - Date Operations
    // ========================================================================

    private groupByDate(): DateGroupedRows[] {
        const groups = new Map<string, Record<string, unknown>[]>();

        for (const row of this.rawData) {
            const date = this.getDateValue(row, 'timestamp');
            if (date) {
                const dateStr = date.toISOString().split('T')[0];
                if (!groups.has(dateStr)) {
                    groups.set(dateStr, []);
                }
                groups.get(dateStr)!.push(row);
            }
        }

        return Array.from(groups.entries())
            .map(([date, rows]) => ({ date, rows }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    private getEarliestDate(rows: Record<string, unknown>[]): Date {
        let earliest = new Date();
        for (const row of rows) {
            const date = this.getDateValue(row, 'timestamp');
            if (date && date < earliest) earliest = date;
        }
        return earliest;
    }

    private getLatestDate(rows: Record<string, unknown>[]): Date {
        let latest = new Date(0);
        for (const row of rows) {
            const date = this.getDateValue(row, 'timestamp');
            if (date && date > latest) latest = date;
        }
        return latest.getTime() === 0 ? new Date() : latest;
    }

    private countUniqueDays(rows: Record<string, unknown>[]): number {
        const days = new Set<string>();
        for (const row of rows) {
            const date = this.getDateValue(row, 'timestamp');
            if (date) {
                days.add(date.toISOString().split('T')[0]);
            }
        }
        return days.size;
    }

    private countRowsInDateRange(rows: Record<string, unknown>[], days: number): number {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return rows.filter(row => {
            const date = this.getDateValue(row, 'timestamp');
            return date && date.getTime() >= cutoff;
        }).length;
    }

    // ========================================================================
    // Private Methods - Activity Calculations
    // ========================================================================

    private calculateSessionTrend(rows: Record<string, unknown>[]): number {
        const recentDays = 7;
        const previousDays = 14;

        const recentCutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
        const previousCutoff = Date.now() - previousDays * 24 * 60 * 60 * 1000;

        const recentCount = rows.filter(row => {
            const date = this.getDateValue(row, 'timestamp');
            return date && date.getTime() >= recentCutoff;
        }).length;

        const previousCount = rows.filter(row => {
            const date = this.getDateValue(row, 'timestamp');
            return date && date.getTime() >= previousCutoff && date.getTime() < recentCutoff;
        }).length;

        if (previousCount === 0) return 0;
        return (recentCount - previousCount) / previousCount;
    }

    private countActiveUsersInDays(days: number): number {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const userColumn = this.findColumn('user_id');
        if (!userColumn) return 0;

        const activeUsers = new Set<string>();
        for (const row of this.rawData) {
            const date = this.getDateValue(row, 'timestamp');
            if (date && date.getTime() >= cutoff) {
                const userId = row[userColumn];
                if (userId != null) activeUsers.add(String(userId));
            }
        }
        return activeUsers.size;
    }

    private countNewUsersInDays(days: number): number {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const userColumn = this.findColumn('user_id');
        if (!userColumn) return 0;

        // Find users whose first session is within the cutoff
        const userFirstSeen = new Map<string, number>();

        for (const row of this.rawData) {
            const userId = String(row[userColumn]);
            const date = this.getDateValue(row, 'timestamp');
            if (date) {
                const existing = userFirstSeen.get(userId);
                if (!existing || date.getTime() < existing) {
                    userFirstSeen.set(userId, date.getTime());
                }
            }
        }

        let newCount = 0;
        for (const firstSeen of userFirstSeen.values()) {
            if (firstSeen >= cutoff) newCount++;
        }
        return newCount;
    }

    private sumRevenueInDays(days: number): number {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        let sum = 0;

        for (const row of this.rawData) {
            const date = this.getDateValue(row, 'timestamp');
            if (date && date.getTime() >= cutoff) {
                const revenue = this.getNumericValue(row, 'revenue');
                if (revenue != null) sum += revenue;
            }
        }
        return sum;
    }

    // ========================================================================
    // Private Methods - Retention
    // ========================================================================

    private calculateRetention(day: number): number {
        const userColumn = this.findColumn('user_id');
        if (!userColumn) return 0;

        // Build user first session map
        const userFirstSeen = new Map<string, Date>();
        const userDaysActive = new Map<string, Set<number>>();

        for (const row of this.rawData) {
            const userId = String(row[userColumn]);
            const date = this.getDateValue(row, 'timestamp');
            if (!date) continue;

            const existing = userFirstSeen.get(userId);
            if (!existing || date < existing) {
                userFirstSeen.set(userId, date);
            }

            if (!userDaysActive.has(userId)) {
                userDaysActive.set(userId, new Set());
            }
            const daysSinceFirst = existing
                ? Math.floor((date.getTime() - existing.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            userDaysActive.get(userId)!.add(daysSinceFirst);
        }

        // Count users who were active on day N
        let eligible = 0;
        let retained = 0;

        const now = Date.now();
        for (const [userId, firstSeen] of userFirstSeen.entries()) {
            // User must have been acquired at least N days ago
            const daysSinceAcquisition = Math.floor((now - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceAcquisition >= day) {
                eligible++;
                const activeDays = userDaysActive.get(userId);
                if (activeDays && activeDays.has(day)) {
                    retained++;
                }
            }
        }

        return eligible > 0 ? retained / eligible : 0;
    }

    // ========================================================================
    // Private Methods - Monetization
    // ========================================================================

    private countPurchases(rows: Record<string, unknown>[]): number {
        return rows.filter(row => {
            const revenue = this.getNumericValue(row, 'revenue');
            return revenue != null && revenue > 0;
        }).length;
    }

    private getLastPurchaseDate(rows: Record<string, unknown>[]): Date | null {
        let lastPurchase: Date | null = null;

        for (const row of rows) {
            const revenue = this.getNumericValue(row, 'revenue');
            if (revenue != null && revenue > 0) {
                const date = this.getDateValue(row, 'timestamp');
                if (date && (!lastPurchase || date > lastPurchase)) {
                    lastPurchase = date;
                }
            }
        }
        return lastPurchase;
    }

    // ========================================================================
    // Private Methods - Engagement & Progression
    // ========================================================================

    private calculateFailureRate(rows: Record<string, unknown>[]): number {
        let failures = 0;
        let attempts = 0;

        for (const row of rows) {
            // Look for event type or result columns
            const eventType = this.getStringValue(row, 'event_type') || this.getStringValue(row, 'event');
            const result = this.getStringValue(row, 'result') || this.getStringValue(row, 'outcome');

            if (eventType?.toLowerCase().includes('attempt') ||
                eventType?.toLowerCase().includes('play') ||
                eventType?.toLowerCase().includes('level')) {
                attempts++;
                if (result?.toLowerCase().includes('fail') ||
                    result?.toLowerCase().includes('lose') ||
                    result?.toLowerCase() === 'false') {
                    failures++;
                }
            }
        }

        return attempts > 0 ? failures / attempts : 0;
    }

    private getPeakPlayHour(rows: Record<string, unknown>[]): number {
        const hourCounts = new Array(24).fill(0);

        for (const row of rows) {
            const date = this.getDateValue(row, 'timestamp');
            if (date) {
                hourCounts[date.getHours()]++;
            }
        }

        let maxHour = 0;
        let maxCount = 0;
        for (let i = 0; i < 24; i++) {
            if (hourCounts[i] > maxCount) {
                maxCount = hourCounts[i];
                maxHour = i;
            }
        }
        return maxHour;
    }

    private getFeatureUsage(rows: Record<string, unknown>[]): Record<string, number> {
        const usage: Record<string, number> = {};

        for (const row of rows) {
            const eventType = this.getStringValue(row, 'event_type') || this.getStringValue(row, 'event');
            if (eventType) {
                usage[eventType] = (usage[eventType] || 0) + 1;
            }
        }

        return usage;
    }

    private calculateAvgSessionLength(): number {
        const durations: number[] = [];
        for (const row of this.rawData) {
            const duration = this.getNumericValue(row, 'duration') || this.getNumericValue(row, 'session_length');
            if (duration != null && duration > 0) {
                durations.push(duration);
            }
        }
        if (durations.length === 0) return 300; // Default 5 minutes
        return durations.reduce((a, b) => a + b, 0) / durations.length;
    }

    private calculateAvgLevel(): number {
        const levels: number[] = [];
        const userLevels = new Map<string, number>();
        const userColumn = this.findColumn('user_id');

        for (const row of this.rawData) {
            const userId = userColumn ? String(row[userColumn]) : 'unknown';
            const level = this.getNumericValue(row, 'level');
            if (level != null) {
                const current = userLevels.get(userId) || 0;
                if (level > current) {
                    userLevels.set(userId, level);
                }
            }
        }

        for (const level of userLevels.values()) {
            levels.push(level);
        }

        if (levels.length === 0) return 1;
        return levels.reduce((a, b) => a + b, 0) / levels.length;
    }

    // ========================================================================
    // Private Methods - Helpers
    // ========================================================================

    private getCohort(firstSessionDate: Date): string {
        return firstSessionDate.toISOString().slice(0, 7); // YYYY-MM format
    }

    private getDefaultUserFeatures(userId: string): UserFeatures {
        return {
            userId,
            cohort: new Date().toISOString().slice(0, 7),
            sessionCount7d: 0,
            sessionCount30d: 0,
            sessionTrend: 0,
            lastSessionHoursAgo: 999,
            avgSessionLength: 0,
            totalPlayTime: 0,
            currentLevel: 1,
            maxLevelReached: 1,
            progressionSpeed: 0,
            failureRate: 0,
            stuckAtLevel: false,
            totalSpend: 0,
            purchaseCount: 0,
            avgPurchaseValue: 0,
            daysSinceLastPurchase: 999,
            isPayer: false,
            daysActive: 0,
            daysSinceFirstSession: 0,
            weeklyActiveRatio: 0,
            peakPlayHour: 12,
            featureUsage: {},
        };
    }

    private isNewUser(row: Record<string, unknown>, currentDate: string): boolean {
        const userColumn = this.findColumn('user_id');
        if (!userColumn) return false;

        const userId = String(row[userColumn]);
        const currentDateObj = new Date(currentDate);

        // Find earliest date for this user
        for (const r of this.rawData) {
            if (String(r[userColumn]) === userId) {
                const date = this.getDateValue(r, 'timestamp');
                if (date && date < currentDateObj) {
                    return false;
                }
            }
        }
        return true;
    }
}
