/**
 * Cohort Analyzer
 * Automatic cohort generation and comparative analysis
 */

import { NormalizedData } from '../adapters/BaseAdapter';
import { ColumnMeaning } from './SchemaAnalyzer';

// ============ TYPES ============

export type CohortDimension =
    | 'install_date'
    | 'first_purchase_date'
    | 'platform'
    | 'country'
    | 'acquisition_source'
    | 'custom';

export type CohortGranularity = 'day' | 'week' | 'month';

export interface CohortDefinition {
    dimension: CohortDimension;
    granularity?: CohortGranularity;   // For date-based cohorts
    customColumn?: string;              // For custom dimension
    name: string;
}

export interface CohortMetrics {
    retention: Record<string, number>;  // D1, D7... -> %
    totalRevenue: number;
    avgSessionLength: number;
    conversionRate: number;
}

export interface CohortData {
    id: string;
    name: string;
    dimension: CohortDimension;
    value: string;                      // e.g., "2024-W01", "iOS", "US"
    userCount: number;
    userIds: string[];
    metrics: CohortMetrics;
}

export interface CohortComparison {
    bestCohort: { id: string; name: string; metric: string; value: number } | null;
    worstCohort: { id: string; name: string; metric: string; value: number } | null;
    insights: string[];
    avgRetention: Record<string, number>;
}

export interface CohortAnalysisResult {
    definition: CohortDefinition;
    cohorts: CohortData[];
    comparison: CohortComparison;
    retentionMatrix: { labels: string[]; days: string[]; matrix: number[][] };
    analyzedAt: string;
}

// ============ HELPER FUNCTIONS ============

function parseDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
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

function getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatCohortValue(value: unknown, granularity: CohortGranularity): string {
    const date = parseDate(value);
    if (!date) return String(value);

    switch (granularity) {
        case 'day':
            return getDateKey(date);
        case 'week':
            return getWeekKey(date);
        case 'month':
            return getMonthKey(date);
    }
}

function daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / msPerDay);
}

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
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

// ============ COHORT ANALYZER CLASS ============

export class CohortAnalyzer {
    /**
     * Analyze data with specified cohort definition
     */
    analyze(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        definition: CohortDefinition
    ): CohortAnalysisResult {
        // Find required columns
        const userIdCol = columnMeanings.find(m => m.semanticType === 'user_id')?.column;
        const timestampCol = columnMeanings.find(m => m.semanticType === 'timestamp')?.column;
        const revenueCol = columnMeanings.find(m => m.semanticType === 'revenue')?.column;

        if (!userIdCol || !timestampCol) {
            return this.emptyResult(definition);
        }

        // Determine cohort column
        let cohortColumn: string | undefined;

        switch (definition.dimension) {
            case 'install_date':
            case 'first_purchase_date':
                cohortColumn = timestampCol;
                break;
            case 'platform':
                cohortColumn = columnMeanings.find(m => m.semanticType === 'platform')?.column;
                break;
            case 'country':
                cohortColumn = columnMeanings.find(m => m.semanticType === 'country')?.column;
                break;
            case 'custom':
                cohortColumn = definition.customColumn;
                break;
        }

        if (!cohortColumn && definition.dimension !== 'install_date') {
            return this.emptyResult(definition);
        }

        // Build cohorts
        const cohorts = this.buildCohorts(
            data,
            userIdCol,
            timestampCol,
            cohortColumn || timestampCol,
            revenueCol,
            definition
        );

        // Compare cohorts
        const comparison = this.compareCohorts(cohorts);

        // Build retention matrix
        const retentionMatrix = this.buildRetentionMatrix(cohorts);

        return {
            definition,
            cohorts,
            comparison,
            retentionMatrix,
            analyzedAt: new Date().toISOString(),
        };
    }

    /**
     * Suggest best cohort dimensions based on available columns
     */
    suggestCohortDimensions(columnMeanings: ColumnMeaning[]): CohortDefinition[] {
        const suggestions: CohortDefinition[] = [];

        // Always suggest install date cohorts if timestamp exists
        if (columnMeanings.some(m => m.semanticType === 'timestamp')) {
            suggestions.push({
                dimension: 'install_date',
                granularity: 'week',
                name: 'Weekly Install Cohorts',
            });
        }

        // Platform cohorts
        if (columnMeanings.some(m => m.semanticType === 'platform')) {
            suggestions.push({
                dimension: 'platform',
                name: 'Platform Cohorts',
            });
        }

        // Country cohorts
        if (columnMeanings.some(m => m.semanticType === 'country')) {
            suggestions.push({
                dimension: 'country',
                name: 'Country Cohorts',
            });
        }

        return suggestions;
    }

    /**
     * Analyze install date cohorts specifically
     */
    analyzeInstallCohorts(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        granularity: CohortGranularity = 'week'
    ): CohortAnalysisResult {
        const definition: CohortDefinition = {
            dimension: 'install_date',
            granularity,
            name: `${granularity.charAt(0).toUpperCase() + granularity.slice(1)}ly Install Cohorts`,
        };

        return this.analyze(data, columnMeanings, definition);
    }

    /**
     * Build cohorts from data
     */
    private buildCohorts(
        data: NormalizedData,
        userIdCol: string,
        timestampCol: string,
        cohortCol: string,
        revenueCol: string | undefined,
        definition: CohortDefinition
    ): CohortData[] {
        // Group users by cohort
        const userCohort = new Map<string, string>();          // userId -> cohort value
        const userFirstDay = new Map<string, Date>();          // userId -> first activity
        const userActivityDays = new Map<string, Set<string>>(); // userId -> set of activity dates
        const userRevenue = new Map<string, number>();         // userId -> total revenue

        // First pass: determine cohort assignments and collect data
        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            const date = parseDate(row[timestampCol]);

            if (!userId || !date) continue;

            // Track first activity
            const existing = userFirstDay.get(userId);
            if (!existing || date < existing) {
                userFirstDay.set(userId, date);

                // Determine cohort value
                let cohortValue: string;
                if (definition.dimension === 'install_date' || definition.dimension === 'first_purchase_date') {
                    cohortValue = formatCohortValue(date, definition.granularity || 'week');
                } else {
                    cohortValue = String(row[cohortCol] ?? 'Unknown');
                }
                userCohort.set(userId, cohortValue);
            }

            // Track activity days
            if (!userActivityDays.has(userId)) {
                userActivityDays.set(userId, new Set());
            }
            userActivityDays.get(userId)!.add(getDateKey(date));

            // Track revenue
            if (revenueCol) {
                const revenue = getNumericValue(row, revenueCol);
                if (revenue > 0) {
                    const current = userRevenue.get(userId) ?? 0;
                    userRevenue.set(userId, current + revenue);
                }
            }
        }

        // Group users by cohort
        const cohortUsers = new Map<string, string[]>();
        for (const [userId, cohortValue] of userCohort) {
            if (!cohortUsers.has(cohortValue)) {
                cohortUsers.set(cohortValue, []);
            }
            cohortUsers.get(cohortValue)!.push(userId);
        }

        // Calculate metrics for each cohort
        const retentionDays = [1, 3, 7, 14, 30];
        const cohorts: CohortData[] = [];

        for (const [cohortValue, userIds] of cohortUsers) {
            // Calculate retention for this cohort
            const retention: Record<string, number> = {};

            for (const day of retentionDays) {
                let retained = 0;
                let eligible = 0;

                for (const userId of userIds) {
                    const firstDay = userFirstDay.get(userId);
                    const activityDays = userActivityDays.get(userId);

                    if (!firstDay || !activityDays) continue;

                    // Only count users whose first day is old enough
                    const now = new Date();
                    if (daysBetween(firstDay, now) < day) continue;

                    eligible++;

                    const targetDate = new Date(firstDay);
                    targetDate.setDate(targetDate.getDate() + day);

                    if (activityDays.has(getDateKey(targetDate))) {
                        retained++;
                    }
                }

                retention[`D${day}`] = eligible > 0
                    ? Math.round((retained / eligible) * 100 * 100) / 100
                    : 0;
            }

            // Calculate revenue metrics
            let totalRevenue = 0;
            let payingUsers = 0;

            for (const userId of userIds) {
                const revenue = userRevenue.get(userId) ?? 0;
                if (revenue > 0) {
                    totalRevenue += revenue;
                    payingUsers++;
                }
            }

            const conversionRate = userIds.length > 0
                ? Math.round((payingUsers / userIds.length) * 100 * 100) / 100
                : 0;

            cohorts.push({
                id: generateId(),
                name: `Cohort ${cohortValue}`,
                dimension: definition.dimension,
                value: cohortValue,
                userCount: userIds.length,
                userIds,
                metrics: {
                    retention,
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    avgSessionLength: 0, // Would need session data
                    conversionRate,
                },
            });
        }

        // Sort cohorts by value (chronologically for dates)
        cohorts.sort((a, b) => a.value.localeCompare(b.value));

        return cohorts;
    }

    /**
     * Compare cohorts and generate insights
     */
    private compareCohorts(cohorts: CohortData[]): CohortComparison {
        if (cohorts.length === 0) {
            return {
                bestCohort: null,
                worstCohort: null,
                insights: ['No cohorts available for comparison'],
                avgRetention: {},
            };
        }

        // Calculate average retention across all cohorts
        const avgRetention: Record<string, number> = {};
        const retentionDays = ['D1', 'D3', 'D7', 'D14', 'D30'];

        for (const day of retentionDays) {
            const values = cohorts
                .map(c => c.metrics.retention[day])
                .filter(v => v > 0);

            avgRetention[day] = values.length > 0
                ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
                : 0;
        }

        // Find best and worst cohorts by D7 retention
        const cohortsWithD7 = cohorts.filter(c => c.metrics.retention['D7'] > 0);

        let bestCohort: CohortComparison['bestCohort'] = null;
        let worstCohort: CohortComparison['worstCohort'] = null;

        if (cohortsWithD7.length > 0) {
            const sorted = [...cohortsWithD7].sort(
                (a, b) => b.metrics.retention['D7'] - a.metrics.retention['D7']
            );

            const best = sorted[0];
            const worst = sorted[sorted.length - 1];

            bestCohort = {
                id: best.id,
                name: best.name,
                metric: 'D7 Retention',
                value: best.metrics.retention['D7'],
            };

            if (sorted.length > 1) {
                worstCohort = {
                    id: worst.id,
                    name: worst.name,
                    metric: 'D7 Retention',
                    value: worst.metrics.retention['D7'],
                };
            }
        }

        // Generate insights
        const insights: string[] = [];

        if (bestCohort && worstCohort) {
            const diff = bestCohort.value - worstCohort.value;
            insights.push(
                `${bestCohort.name} has ${diff.toFixed(1)}% higher D7 retention than ${worstCohort.name}`
            );
        }

        // Compare first vs last cohort for trends
        if (cohorts.length >= 2) {
            const first = cohorts[0];
            const last = cohorts[cohorts.length - 1];
            const firstD7 = first.metrics.retention['D7'];
            const lastD7 = last.metrics.retention['D7'];

            if (firstD7 > 0 && lastD7 > 0) {
                const trend = lastD7 - firstD7;
                if (Math.abs(trend) > 5) {
                    insights.push(
                        trend > 0
                            ? `Retention is improving: +${trend.toFixed(1)}% from ${first.value} to ${last.value}`
                            : `Retention is declining: ${trend.toFixed(1)}% from ${first.value} to ${last.value}`
                    );
                }
            }
        }

        // Compare conversion rates
        const conversionRates = cohorts.map(c => c.metrics.conversionRate).filter(r => r > 0);
        if (conversionRates.length > 0) {
            const avgConversion = conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length;
            insights.push(`Average conversion rate across cohorts: ${avgConversion.toFixed(2)}%`);
        }

        return {
            bestCohort,
            worstCohort,
            insights: insights.slice(0, 5),
            avgRetention,
        };
    }

    /**
     * Build retention matrix for heatmap visualization
     */
    private buildRetentionMatrix(cohorts: CohortData[]): {
        labels: string[];
        days: string[];
        matrix: number[][];
    } {
        const days = ['D1', 'D3', 'D7', 'D14', 'D30'];
        const labels = cohorts.map(c => c.value);
        const matrix = cohorts.map(c =>
            days.map(day => c.metrics.retention[day] ?? 0)
        );

        return { labels, days, matrix };
    }

    /**
     * Return empty result structure
     */
    private emptyResult(definition: CohortDefinition): CohortAnalysisResult {
        return {
            definition,
            cohorts: [],
            comparison: {
                bestCohort: null,
                worstCohort: null,
                insights: ['Insufficient data for cohort analysis'],
                avgRetention: {},
            },
            retentionMatrix: { labels: [], days: [], matrix: [] },
            analyzedAt: new Date().toISOString(),
        };
    }
}

export const cohortAnalyzer = new CohortAnalyzer();
