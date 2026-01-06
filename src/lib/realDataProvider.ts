/**
 * Real Data Provider
 * Transforms uploaded game data into chart-compatible formats
 * Falls back to demo data when real data is not available
 */

import { GameData } from './dataStore';
import {
    RetentionData,
    FunnelStep,
    KPIData,
    SegmentData,
    TimeSeriesData,
} from '../types';
import { IDataProvider } from './dataProviders';

// ============================================================================
// Data Analysis Utilities
// ============================================================================

interface ColumnStats {
    column: string;
    type: 'numeric' | 'categorical' | 'date' | 'unknown';
    uniqueValues: number;
    sampleValues: unknown[];
    min?: number;
    max?: number;
    avg?: number;
}

function analyzeColumn(rows: Record<string, unknown>[], column: string): ColumnStats {
    const values = rows.map(r => r[column]).filter(v => v != null);
    const uniqueValues = new Set(values).size;
    const sampleValues = values.slice(0, 5);

    // Check if numeric
    const numericValues = values.filter(v => typeof v === 'number' || !isNaN(Number(v)));
    if (numericValues.length > values.length * 0.8) {
        const nums = numericValues.map(v => Number(v));
        return {
            column,
            type: 'numeric',
            uniqueValues,
            sampleValues,
            min: Math.min(...nums),
            max: Math.max(...nums),
            avg: nums.reduce((a, b) => a + b, 0) / nums.length,
        };
    }

    // Check if date
    const dateValues = values.filter(v => {
        if (typeof v === 'string') {
            const d = new Date(v);
            return !isNaN(d.getTime());
        }
        return false;
    });
    if (dateValues.length > values.length * 0.8) {
        return { column, type: 'date', uniqueValues, sampleValues };
    }

    return { column, type: 'categorical', uniqueValues, sampleValues };
}

function detectColumnRole(column: string, _stats: ColumnStats): string {
    const lower = column.toLowerCase();

    // User identification
    if (lower.includes('user') && (lower.includes('id') || lower.includes('_id'))) return 'user_id';
    if (lower === 'uid' || lower === 'player_id') return 'user_id';

    // Time/Date
    if (lower.includes('date') || lower.includes('timestamp') || lower === 'time' || lower === 'day') return 'timestamp';
    if (lower.includes('created') || lower.includes('installed')) return 'install_date';

    // Retention
    if (lower.includes('retention') || lower.match(/d\d+/) || lower.match(/day_?\d+/)) return 'retention';
    if (lower.includes('cohort')) return 'cohort';

    // Events/Actions
    if (lower.includes('event') || lower.includes('action')) return 'event';
    if (lower.includes('level') || lower.includes('stage')) return 'level';
    if (lower.includes('session')) return 'session';

    // Revenue
    if (lower.includes('revenue') || lower.includes('price') || lower.includes('amount')) return 'revenue';
    if (lower.includes('purchase') || lower.includes('transaction')) return 'purchase';
    if (lower.includes('iap') || lower.includes('ltv')) return 'ltv';

    // Engagement
    if (lower.includes('duration') || lower.includes('time_spent') || lower.includes('playtime')) return 'duration';
    if (lower.includes('count') || lower.includes('frequency')) return 'count';

    // Segments
    if (lower.includes('country') || lower.includes('region')) return 'geo';
    if (lower.includes('platform') || lower.includes('device')) return 'platform';
    if (lower.includes('segment') || lower.includes('tier') || lower.includes('group')) return 'segment';

    return 'unknown';
}

// ============================================================================
// Real Data Provider Class
// ============================================================================

export class RealDataProvider implements IDataProvider {
    private rows: Record<string, unknown>[];
    private columnStats: Map<string, ColumnStats>;
    private columnRoles: Map<string, string>;

    constructor(gameData: GameData) {
        this.rows = gameData.rawData as Record<string, unknown>[];
        this.columnStats = new Map();
        this.columnRoles = new Map();

        // Analyze columns - use columnMappings if available, otherwise detect from data
        const columns = gameData.columnMappings?.map(c => c.originalName) || Object.keys(this.rows[0] || {});
        for (const col of columns) {
            const stats = analyzeColumn(this.rows, col);
            this.columnStats.set(col, stats);
            // Use existing column mapping role if available
            const mapping = gameData.columnMappings?.find(m => m.originalName === col);
            this.columnRoles.set(col, mapping ? this.mapRoleToDetected(mapping.role, col) : detectColumnRole(col, stats));
        }
    }

    private mapRoleToDetected(role: string, col: string): string {
        const lower = col.toLowerCase();

        switch (role) {
            case 'identifier':
                return 'user_id';
            case 'timestamp':
                if (lower.includes('install') || lower.includes('created')) return 'install_date';
                return 'timestamp';
            case 'metric':
                // For metrics, try to detect more specific type
                if (lower.includes('revenue') || lower.includes('amount') || lower.includes('price')) return 'revenue';
                if (lower.includes('level') || lower.includes('stage')) return 'level';
                if (lower.includes('session') || lower.includes('duration')) return 'duration';
                if (lower.includes('retention') || lower.match(/d\d+/)) return 'retention';
                return detectColumnRole(col, this.columnStats.get(col)!);
            case 'dimension':
                if (lower.includes('country') || lower.includes('region')) return 'geo';
                if (lower.includes('platform') || lower.includes('device')) return 'platform';
                if (lower.includes('event') || lower.includes('action')) return 'event';
                if (lower.includes('source') || lower.includes('channel')) return 'source';
                return 'segment';
            case 'noise':
                return 'unknown';
            default:
                return detectColumnRole(col, this.columnStats.get(col)!);
        }
    }

    getRetentionData(): RetentionData {
        // Look for retention columns (d1, d7, d30, etc.)
        const retentionCols = Array.from(this.columnRoles.entries())
            .filter(([_, role]) => role === 'retention')
            .map(([col]) => col);

        if (retentionCols.length > 0) {
            // Extract retention values
            const days: string[] = [];
            const values: number[] = [];

            for (const col of retentionCols.sort()) {
                const stats = this.columnStats.get(col);
                if (stats?.type === 'numeric' && stats.avg !== undefined) {
                    days.push(col);
                    values.push(Math.round(stats.avg * 100));
                }
            }

            if (days.length > 0) {
                return {
                    days,
                    values,
                    benchmark: this.getIndustryBenchmark(days.length),
                };
            }
        }

        // Try to calculate retention from user activity
        const userIdCol = this.findColumnByRole('user_id');
        const dateCol = this.findColumnByRole('timestamp') || this.findColumnByRole('install_date');

        if (userIdCol && dateCol) {
            return this.calculateRetentionFromEvents(userIdCol, dateCol);
        }

        // Return placeholder if no retention data found
        return {
            days: ['Day 0', 'Day 1', 'Day 7', 'Day 30'],
            values: [100, 0, 0, 0],
            benchmark: [100, 40, 20, 10],
        };
    }

    getFunnelData(): FunnelStep[] {
        // Look for level/stage progression
        const levelCol = this.findColumnByRole('level');
        if (levelCol) {
            return this.calculateLevelFunnel(levelCol);
        }

        // Look for event funnel
        const eventCol = this.findColumnByRole('event');
        if (eventCol) {
            return this.calculateEventFunnel(eventCol);
        }

        // Look for any categorical column with reasonable cardinality
        for (const [col, stats] of this.columnStats.entries()) {
            if (stats.type === 'categorical' && stats.uniqueValues >= 3 && stats.uniqueValues <= 10) {
                return this.calculateCategoricalFunnel(col);
            }
        }

        return [];
    }

    getKPIData(): KPIData[] {
        const kpis: KPIData[] = [];

        // Total users
        const userIdCol = this.findColumnByRole('user_id');
        if (userIdCol) {
            const uniqueUsers = new Set(this.rows.map(r => r[userIdCol])).size;
            kpis.push({
                label: 'Total Users',
                value: this.formatNumber(uniqueUsers),
                change: 0,
                changeType: 'neutral',
            });
        } else {
            kpis.push({
                label: 'Total Rows',
                value: this.formatNumber(this.rows.length),
                change: 0,
                changeType: 'neutral',
            });
        }

        // Revenue if available
        const revenueCol = this.findColumnByRole('revenue') || this.findColumnByRole('ltv');
        if (revenueCol) {
            const stats = this.columnStats.get(revenueCol);
            if (stats?.type === 'numeric') {
                const total = this.rows.reduce((sum, r) => sum + (Number(r[revenueCol]) || 0), 0);
                kpis.push({
                    label: 'Total Revenue',
                    value: '$' + this.formatNumber(Math.round(total)),
                    change: 0,
                    changeType: 'neutral',
                });

                if (stats.avg !== undefined) {
                    kpis.push({
                        label: 'Avg Revenue',
                        value: '$' + stats.avg.toFixed(2),
                        change: 0,
                        changeType: 'neutral',
                    });
                }
            }
        }

        // Session/engagement metrics
        const durationCol = this.findColumnByRole('duration');
        if (durationCol) {
            const stats = this.columnStats.get(durationCol);
            if (stats?.type === 'numeric' && stats.avg !== undefined) {
                kpis.push({
                    label: 'Avg Duration',
                    value: this.formatDuration(stats.avg),
                    change: 0,
                    changeType: 'neutral',
                });
            }
        }

        // Level progression
        const levelCol = this.findColumnByRole('level');
        if (levelCol) {
            const stats = this.columnStats.get(levelCol);
            if (stats?.type === 'numeric' && stats.max !== undefined) {
                kpis.push({
                    label: 'Max Level',
                    value: String(Math.round(stats.max)),
                    change: 0,
                    changeType: 'neutral',
                });
            }
        }

        // Fill remaining slots with available numeric columns
        while (kpis.length < 4) {
            const numericCols = Array.from(this.columnStats.entries())
                .filter(([col, stats]) =>
                    stats.type === 'numeric' &&
                    !kpis.some(k => k.label.toLowerCase().includes(col.toLowerCase()))
                );

            if (numericCols.length === 0) break;

            const [col, stats] = numericCols[0];
            if (stats.avg !== undefined) {
                kpis.push({
                    label: this.formatColumnName(col),
                    value: this.formatNumber(Math.round(stats.avg)),
                    change: 0,
                    changeType: 'neutral',
                });
            }
        }

        return kpis.slice(0, 4);
    }

    getRevenueData(): TimeSeriesData[] {
        const revenueCol = this.findColumnByRole('revenue') || this.findColumnByRole('ltv');
        const dateCol = this.findColumnByRole('timestamp') || this.findColumnByRole('install_date');

        if (!revenueCol) {
            return [];
        }

        if (dateCol) {
            // Group by date
            const byDate = new Map<string, number>();
            for (const row of this.rows) {
                const date = this.parseDate(row[dateCol]);
                const revenue = Number(row[revenueCol]) || 0;
                if (date) {
                    const key = date.toISOString().split('T')[0];
                    byDate.set(key, (byDate.get(key) || 0) + revenue);
                }
            }

            const sorted = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
            const data = sorted.slice(-7).map(([date, value]) => ({
                timestamp: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                value: Math.round(value),
                label: '$' + this.formatNumber(Math.round(value)),
            }));

            return [{
                name: 'Revenue',
                data,
                color: '#8b5cf6',
            }];
        }

        // No date column - show distribution
        const total = this.rows.reduce((sum, r) => sum + (Number(r[revenueCol]) || 0), 0);
        return [{
            name: 'Revenue',
            data: [{ timestamp: 'Total', value: Math.round(total), label: '$' + this.formatNumber(Math.round(total)) }],
            color: '#8b5cf6',
        }];
    }

    getSegmentData(): SegmentData[] {
        // Look for segment/category column
        const segmentCol = this.findColumnByRole('segment') ||
            this.findColumnByRole('platform') ||
            this.findColumnByRole('geo');

        if (segmentCol) {
            return this.calculateSegmentDistribution(segmentCol);
        }

        // Find any categorical column with good cardinality
        for (const [col, stats] of this.columnStats.entries()) {
            if (stats.type === 'categorical' && stats.uniqueValues >= 2 && stats.uniqueValues <= 8) {
                return this.calculateSegmentDistribution(col);
            }
        }

        return [];
    }

    // ========================================================================
    // Private Helpers
    // ========================================================================

    private findColumnByRole(role: string): string | undefined {
        for (const [col, colRole] of this.columnRoles.entries()) {
            if (colRole === role) return col;
        }
        return undefined;
    }

    private calculateRetentionFromEvents(userIdCol: string, dateCol: string): RetentionData {
        // Group users by first seen date (install cohort)
        const userFirstSeen = new Map<unknown, Date>();
        const userLastSeen = new Map<unknown, Date>();

        for (const row of this.rows) {
            const userId = row[userIdCol];
            const date = this.parseDate(row[dateCol]);
            if (!userId || !date) continue;

            const first = userFirstSeen.get(userId);
            if (!first || date < first) {
                userFirstSeen.set(userId, date);
            }

            const last = userLastSeen.get(userId);
            if (!last || date > last) {
                userLastSeen.set(userId, date);
            }
        }

        // Calculate retention at different days
        const dayTargets = [0, 1, 3, 7, 14, 30];
        const retention: number[] = [];
        const totalUsers = userFirstSeen.size;

        for (const dayTarget of dayTargets) {
            let retained = 0;
            for (const [userId, firstDate] of userFirstSeen.entries()) {
                const lastDate = userLastSeen.get(userId)!;
                const daysSinceInstall = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceInstall >= dayTarget) {
                    retained++;
                }
            }
            retention.push(totalUsers > 0 ? Math.round((retained / totalUsers) * 100) : 0);
        }

        return {
            days: dayTargets.map(d => d === 0 ? 'Day 0' : `Day ${d}`),
            values: retention,
            benchmark: this.getIndustryBenchmark(dayTargets.length),
        };
    }

    private calculateLevelFunnel(levelCol: string): FunnelStep[] {
        const levelCounts = new Map<number, number>();
        const userIdCol = this.findColumnByRole('user_id');

        if (userIdCol) {
            // Count users at each level (max level reached)
            const userMaxLevel = new Map<unknown, number>();
            for (const row of this.rows) {
                const userId = row[userIdCol];
                const level = Number(row[levelCol]) || 0;
                const current = userMaxLevel.get(userId) || 0;
                if (level > current) {
                    userMaxLevel.set(userId, level);
                }
            }

            for (const level of userMaxLevel.values()) {
                levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
            }
        } else {
            // Just count occurrences
            for (const row of this.rows) {
                const level = Number(row[levelCol]) || 0;
                levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
            }
        }

        // Create funnel steps
        const sortedLevels = Array.from(levelCounts.keys()).sort((a, b) => a - b);
        const total = Array.from(levelCounts.values()).reduce((a, b) => a + b, 0);

        // Pick representative levels (max 6)
        const step = Math.max(1, Math.floor(sortedLevels.length / 5));
        const selectedLevels = sortedLevels.filter((_, i) => i % step === 0).slice(0, 6);

        let prevPercentage = 100;
        return selectedLevels.map((level, i) => {
            const usersAtOrAbove = sortedLevels
                .filter(l => l >= level)
                .reduce((sum, l) => sum + (levelCounts.get(l) || 0), 0);
            const percentage = total > 0 ? Math.round((usersAtOrAbove / total) * 100) : 0;
            const dropOff = i === 0 ? 0 : prevPercentage - percentage;
            prevPercentage = percentage;

            return {
                name: `Level ${level}`,
                value: usersAtOrAbove,
                percentage,
                dropOff,
            };
        });
    }

    private calculateEventFunnel(eventCol: string): FunnelStep[] {
        const eventCounts = new Map<string, number>();

        for (const row of this.rows) {
            const event = String(row[eventCol] || '');
            if (event) {
                eventCounts.set(event, (eventCounts.get(event) || 0) + 1);
            }
        }

        const sorted = Array.from(eventCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        const maxValue = sorted[0]?.[1] || 1;
        let prevPercentage = 100;

        return sorted.map(([name, value], i) => {
            const percentage = Math.round((value / maxValue) * 100);
            const dropOff = i === 0 ? 0 : prevPercentage - percentage;
            prevPercentage = percentage;

            return { name, value, percentage, dropOff };
        });
    }

    private calculateCategoricalFunnel(col: string): FunnelStep[] {
        const counts = new Map<string, number>();

        for (const row of this.rows) {
            const value = String(row[col] || '');
            if (value) {
                counts.set(value, (counts.get(value) || 0) + 1);
            }
        }

        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        const maxValue = sorted[0]?.[1] || 1;
        let prevPercentage = 100;

        return sorted.map(([name, value], i) => {
            const percentage = Math.round((value / maxValue) * 100);
            const dropOff = i === 0 ? 0 : prevPercentage - percentage;
            prevPercentage = percentage;

            return { name, value, percentage, dropOff };
        });
    }

    private calculateSegmentDistribution(col: string): SegmentData[] {
        const counts = new Map<string, number>();

        for (const row of this.rows) {
            const value = String(row[col] || 'Unknown');
            counts.set(value, (counts.get(value) || 0) + 1);
        }

        const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
        const colors = ['#8b5cf6', '#6366f1', '#ec4899', '#DA7756', '#C15F3C', '#5B9BD5'];

        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value], i) => ({
                name,
                value,
                percentage: total > 0 ? Math.round((value / total) * 100) : 0,
                color: colors[i % colors.length],
            }));
    }

    private getIndustryBenchmark(points: number): number[] {
        const benchmarks = [100, 40, 28, 20, 12, 7];
        return benchmarks.slice(0, points);
    }

    private parseDate(value: unknown): Date | null {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value === 'number') return new Date(value);
        if (typeof value === 'string') {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    }

    private formatNumber(n: number): string {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toLocaleString();
    }

    private formatDuration(seconds: number): string {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${(seconds / 3600).toFixed(1)}h`;
    }

    private formatColumnName(col: string): string {
        return col
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    // ========================================================================
    // Extended Methods for Phase 1
    // ========================================================================

    /**
     * Get DAU (Daily Active Users)
     */
    getDAU(): number {
        const userIdCol = this.findColumnByRole('user_id');
        const dateCol = this.findColumnByRole('timestamp');

        if (!userIdCol) {
            return this.rows.length; // Fallback to row count
        }

        if (!dateCol) {
            // No date column - count unique users
            return new Set(this.rows.map(r => r[userIdCol])).size;
        }

        // Get unique users from most recent day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayUsers = new Set<unknown>();
        for (const row of this.rows) {
            const date = this.parseDate(row[dateCol]);
            if (date && date >= today) {
                todayUsers.add(row[userIdCol]);
            }
        }

        if (todayUsers.size === 0) {
            // No data for today - return unique users from last day in data
            return new Set(this.rows.map(r => r[userIdCol])).size;
        }

        return todayUsers.size;
    }

    /**
     * Get MAU (Monthly Active Users)
     */
    getMAU(): number {
        const userIdCol = this.findColumnByRole('user_id');
        const dateCol = this.findColumnByRole('timestamp');

        if (!userIdCol) {
            return this.rows.length;
        }

        if (!dateCol) {
            return new Set(this.rows.map(r => r[userIdCol])).size;
        }

        // Get unique users from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const monthlyUsers = new Set<unknown>();
        for (const row of this.rows) {
            const date = this.parseDate(row[dateCol]);
            if (date && date >= thirtyDaysAgo) {
                monthlyUsers.add(row[userIdCol]);
            }
        }

        if (monthlyUsers.size === 0) {
            return new Set(this.rows.map(r => r[userIdCol])).size;
        }

        return monthlyUsers.size;
    }

    /**
     * Calculate ARPU (Average Revenue Per User)
     */
    calculateARPU(): number {
        const revenueCol = this.findColumnByRole('revenue') || this.findColumnByRole('ltv');
        const userIdCol = this.findColumnByRole('user_id');

        if (!revenueCol) {
            return 0;
        }

        const totalRevenue = this.rows.reduce((sum, r) => sum + (Number(r[revenueCol]) || 0), 0);
        const uniqueUsers = userIdCol
            ? new Set(this.rows.map(r => r[userIdCol])).size
            : this.rows.length;

        return uniqueUsers > 0 ? totalRevenue / uniqueUsers : 0;
    }

    /**
     * Get total revenue
     */
    getTotalRevenue(): number {
        const revenueCol = this.findColumnByRole('revenue') || this.findColumnByRole('ltv');
        if (!revenueCol) return 0;

        return this.rows.reduce((sum, r) => sum + (Number(r[revenueCol]) || 0), 0);
    }

    /**
     * Get retention rate for a specific day
     */
    getRetentionDay(day: number): number {
        const retentionData = this.getRetentionData();
        const dayIndex = retentionData.days.findIndex(d =>
            d.toLowerCase().includes(`day ${day}`) || d === `D${day}` || d === `d${day}`
        );

        return dayIndex >= 0 ? retentionData.values[dayIndex] / 100 : 0;
    }

    /**
     * Get average session length
     */
    getAvgSessionLength(): number {
        const durationCol = this.findColumnByRole('duration');
        if (!durationCol) return 0;

        const stats = this.columnStats.get(durationCol);
        return stats?.avg ?? 0;
    }

    /**
     * Get payer conversion rate
     */
    getPayerConversion(): number {
        const revenueCol = this.findColumnByRole('revenue') || this.findColumnByRole('purchase');
        const userIdCol = this.findColumnByRole('user_id');

        if (!revenueCol || !userIdCol) return 0;

        const totalUsers = new Set(this.rows.map(r => r[userIdCol])).size;
        const payingUsers = new Set(
            this.rows.filter(r => (Number(r[revenueCol]) || 0) > 0).map(r => r[userIdCol])
        ).size;

        return totalUsers > 0 ? payingUsers / totalUsers : 0;
    }

    /**
     * Get spender tiers distribution
     */
    getSpenderTiers(): Array<{ tier: string; users: number; revenue: number; percentage: number }> {
        const revenueCol = this.findColumnByRole('revenue') || this.findColumnByRole('ltv');
        const userIdCol = this.findColumnByRole('user_id');

        if (!revenueCol || !userIdCol) return [];

        // Aggregate revenue per user
        const userRevenue = new Map<unknown, number>();
        for (const row of this.rows) {
            const userId = row[userIdCol];
            const revenue = Number(row[revenueCol]) || 0;
            userRevenue.set(userId, (userRevenue.get(userId) || 0) + revenue);
        }

        // Categorize into tiers
        const tiers = {
            whale: { users: 0, revenue: 0 },
            dolphin: { users: 0, revenue: 0 },
            minnow: { users: 0, revenue: 0 },
            nonPayer: { users: 0, revenue: 0 },
        };

        for (const [, revenue] of userRevenue) {
            if (revenue >= 100) {
                tiers.whale.users++;
                tiers.whale.revenue += revenue;
            } else if (revenue >= 20) {
                tiers.dolphin.users++;
                tiers.dolphin.revenue += revenue;
            } else if (revenue > 0) {
                tiers.minnow.users++;
                tiers.minnow.revenue += revenue;
            } else {
                tiers.nonPayer.users++;
            }
        }

        const totalUsers = userRevenue.size;

        return [
            {
                tier: 'Whale ($100+)',
                users: tiers.whale.users,
                revenue: tiers.whale.revenue,
                percentage: totalUsers > 0 ? (tiers.whale.users / totalUsers) * 100 : 0,
            },
            {
                tier: 'Dolphin ($20-100)',
                users: tiers.dolphin.users,
                revenue: tiers.dolphin.revenue,
                percentage: totalUsers > 0 ? (tiers.dolphin.users / totalUsers) * 100 : 0,
            },
            {
                tier: 'Minnow ($1-20)',
                users: tiers.minnow.users,
                revenue: tiers.minnow.revenue,
                percentage: totalUsers > 0 ? (tiers.minnow.users / totalUsers) * 100 : 0,
            },
            {
                tier: 'Non-Payer',
                users: tiers.nonPayer.users,
                revenue: 0,
                percentage: totalUsers > 0 ? (tiers.nonPayer.users / totalUsers) * 100 : 0,
            },
        ];
    }

    /**
     * Get revenue time series by period
     */
    getRevenueTimeSeries(period: 'daily' | 'weekly' | 'monthly'): Array<{ date: string; value: number }> {
        const revenueCol = this.findColumnByRole('revenue') || this.findColumnByRole('ltv');
        const dateCol = this.findColumnByRole('timestamp') || this.findColumnByRole('install_date');

        if (!revenueCol || !dateCol) return [];

        const grouped = new Map<string, number>();

        for (const row of this.rows) {
            const date = this.parseDate(row[dateCol]);
            const revenue = Number(row[revenueCol]) || 0;

            if (!date) continue;

            let key: string;
            switch (period) {
                case 'weekly': {
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                }
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            grouped.set(key, (grouped.get(key) || 0) + revenue);
        }

        return Array.from(grouped.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, value]) => ({ date, value }));
    }

    /**
     * Get attribution channels
     */
    getAttributionChannels(): Array<{ name: string; users: number; revenue: number; percentage: number }> {
        const sourceCol = this.findColumnByRole('source') ||
            Array.from(this.columnRoles.entries()).find(([col]) =>
                col.toLowerCase().includes('source') ||
                col.toLowerCase().includes('channel') ||
                col.toLowerCase().includes('utm')
            )?.[0];

        const userIdCol = this.findColumnByRole('user_id');
        const revenueCol = this.findColumnByRole('revenue');

        if (!sourceCol) return [];

        const channels = new Map<string, { users: Set<unknown>; revenue: number }>();

        for (const row of this.rows) {
            const source = String(row[sourceCol] || 'Unknown');
            const userId = userIdCol ? row[userIdCol] : null;
            const revenue = revenueCol ? (Number(row[revenueCol]) || 0) : 0;

            if (!channels.has(source)) {
                channels.set(source, { users: new Set(), revenue: 0 });
            }

            const channel = channels.get(source)!;
            if (userId) channel.users.add(userId);
            channel.revenue += revenue;
        }

        const totalUsers = userIdCol
            ? new Set(this.rows.map(r => r[userIdCol])).size
            : this.rows.length;

        return Array.from(channels.entries())
            .map(([name, data]) => ({
                name,
                users: data.users.size,
                revenue: data.revenue,
                percentage: totalUsers > 0 ? (data.users.size / totalUsers) * 100 : 0,
            }))
            .sort((a, b) => b.users - a.users)
            .slice(0, 10);
    }

    /**
     * Calculate funnel steps from step definitions
     */
    calculateFunnelSteps(stepDefinitions: Array<{ name: string; event?: string; condition?: Record<string, unknown> }>): FunnelStep[] {
        const eventCol = this.findColumnByRole('event');
        const userIdCol = this.findColumnByRole('user_id');

        if (!eventCol || !userIdCol) return [];

        const results: FunnelStep[] = [];
        let prevCount = 0;

        for (let i = 0; i < stepDefinitions.length; i++) {
            const step = stepDefinitions[i];
            let matchingUsers: Set<unknown>;

            if (step.event) {
                // Simple event matching
                matchingUsers = new Set(
                    this.rows
                        .filter(r => String(r[eventCol]).toLowerCase() === step.event!.toLowerCase())
                        .map(r => r[userIdCol])
                );
            } else if (step.condition) {
                // Complex condition matching
                matchingUsers = new Set(
                    this.rows
                        .filter(r => this.matchesCondition(r, step.condition!))
                        .map(r => r[userIdCol])
                );
            } else {
                matchingUsers = new Set(this.rows.map(r => r[userIdCol]));
            }

            const count = matchingUsers.size;
            const percentage = i === 0 ? 100 : (prevCount > 0 ? (count / prevCount) * 100 : 0);
            const dropOff = i === 0 ? 0 : (100 - percentage);

            results.push({
                name: step.name,
                value: count,
                percentage: Math.round(percentage),
                dropOff: Math.round(dropOff),
            });

            prevCount = count;
        }

        return results;
    }

    private matchesCondition(row: Record<string, unknown>, condition: Record<string, unknown>): boolean {
        for (const [key, value] of Object.entries(condition)) {
            if (row[key] !== value) return false;
        }
        return true;
    }

    /**
     * Get historical growth rate for projections
     */
    getHistoricalGrowthRate(): number {
        const timeSeries = this.getRevenueTimeSeries('daily');
        if (timeSeries.length < 2) return 0.02; // Default 2% growth

        const recentValues = timeSeries.slice(-7);
        if (recentValues.length < 2) return 0.02;

        const firstValue = recentValues[0].value;
        const lastValue = recentValues[recentValues.length - 1].value;

        if (firstValue === 0) return 0.02;

        const growthRate = (lastValue - firstValue) / firstValue / recentValues.length;
        return Math.max(-0.5, Math.min(0.5, growthRate)); // Cap between -50% and 50%
    }

    /**
     * Get session metrics
     */
    getSessionMetrics(): { avgSessionLength: number; sessionsPerUser: number } {
        const durationCol = this.findColumnByRole('duration');
        const sessionCol = this.findColumnByRole('session');
        const userIdCol = this.findColumnByRole('user_id');

        const avgSessionLength = durationCol
            ? (this.columnStats.get(durationCol)?.avg ?? 0)
            : 0;

        let sessionsPerUser = 0;
        if (sessionCol && userIdCol) {
            const uniqueSessions = new Set(this.rows.map(r => r[sessionCol])).size;
            const uniqueUsers = new Set(this.rows.map(r => r[userIdCol])).size;
            sessionsPerUser = uniqueUsers > 0 ? uniqueSessions / uniqueUsers : 0;
        }

        return { avgSessionLength, sessionsPerUser };
    }
}

// ============================================================================
// Empty Data Provider (for no-data states)
// ============================================================================

export class EmptyDataProvider implements IDataProvider {
    getRetentionData(): RetentionData {
        return { days: [], values: [], benchmark: [] };
    }

    getFunnelData(): FunnelStep[] {
        return [];
    }

    getKPIData(): KPIData[] {
        return [];
    }

    getRevenueData(): TimeSeriesData[] {
        return [];
    }

    getSegmentData(): SegmentData[] {
        return [];
    }

    getDAU(): number {
        return 0;
    }

    getMAU(): number {
        return 0;
    }

    calculateARPU(): number {
        return 0;
    }

    getTotalRevenue(): number {
        return 0;
    }

    getRetentionDay(_day: number): number {
        return 0;
    }

    getAvgSessionLength(): number {
        return 0;
    }

    getPayerConversion(): number {
        return 0;
    }

    getSpenderTiers(): Array<{ tier: string; users: number; revenue: number; percentage: number }> {
        return [];
    }

    getRevenueTimeSeries(_period: 'daily' | 'weekly' | 'monthly'): Array<{ date: string; value: number }> {
        return [];
    }

    getAttributionChannels(): Array<{ name: string; users: number; revenue: number; percentage: number }> {
        return [];
    }

    calculateFunnelSteps(_stepDefinitions: Array<{ name: string; event?: string; condition?: Record<string, unknown> }>): FunnelStep[] {
        return [];
    }

    getHistoricalGrowthRate(): number {
        return 0;
    }

    getSessionMetrics(): { avgSessionLength: number; sessionsPerUser: number } {
        return { avgSessionLength: 0, sessionsPerUser: 0 };
    }
}
