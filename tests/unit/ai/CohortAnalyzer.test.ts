/**
 * CohortAnalyzer Unit Tests
 * Tests for cohort generation and analysis
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    CohortAnalyzer,
    CohortDefinition,
    cohortAnalyzer,
} from '@/ai/CohortAnalyzer';
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';
import { NormalizedData } from '@/adapters/BaseAdapter';

// Mock dates for predictable testing
const TEST_DATE = new Date('2024-03-15');

// Helper to create test data
function createTestData(options: {
    rows: Record<string, unknown>[];
    columns?: string[];
}): NormalizedData {
    const columns = options.columns || Object.keys(options.rows[0] || {});
    return {
        columns,
        rows: options.rows,
        metadata: { source: 'test', rowCount: options.rows.length },
    };
}

// Helper to create column meanings
function createMeanings(meanings: { column: string; type: string }[]): ColumnMeaning[] {
    return meanings.map(m => ({
        column: m.column,
        semanticType: m.type as ColumnMeaning['semanticType'],
        confidence: 1,
    }));
}

// Helper to generate dates relative to base
function dateOffset(baseDate: Date, days: number): string {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + days);
    return d.toISOString();
}

describe('CohortAnalyzer', () => {
    let analyzer: CohortAnalyzer;

    beforeEach(() => {
        analyzer = new CohortAnalyzer();
        vi.setSystemTime(TEST_DATE);
    });

    // =========================================================================
    // Suggest Cohort Dimensions Tests
    // =========================================================================

    describe('suggestCohortDimensions', () => {
        it('should suggest install date cohorts when timestamp exists', () => {
            const meanings = createMeanings([
                { column: 'event_time', type: 'timestamp' },
                { column: 'user_id', type: 'user_id' },
            ]);

            const suggestions = analyzer.suggestCohortDimensions(meanings);

            expect(suggestions.some(s => s.dimension === 'install_date')).toBe(true);
        });

        it('should suggest platform cohorts when platform column exists', () => {
            const meanings = createMeanings([
                { column: 'platform', type: 'platform' },
                { column: 'user_id', type: 'user_id' },
            ]);

            const suggestions = analyzer.suggestCohortDimensions(meanings);

            expect(suggestions.some(s => s.dimension === 'platform')).toBe(true);
        });

        it('should suggest country cohorts when country column exists', () => {
            const meanings = createMeanings([
                { column: 'country', type: 'country' },
                { column: 'user_id', type: 'user_id' },
            ]);

            const suggestions = analyzer.suggestCohortDimensions(meanings);

            expect(suggestions.some(s => s.dimension === 'country')).toBe(true);
        });

        it('should return multiple suggestions when multiple columns exist', () => {
            const meanings = createMeanings([
                { column: 'event_time', type: 'timestamp' },
                { column: 'platform', type: 'platform' },
                { column: 'country', type: 'country' },
            ]);

            const suggestions = analyzer.suggestCohortDimensions(meanings);

            expect(suggestions.length).toBe(3);
        });

        it('should return empty array when no suitable columns', () => {
            const meanings = createMeanings([
                { column: 'random_col', type: 'unknown' },
            ]);

            const suggestions = analyzer.suggestCohortDimensions(meanings);

            expect(suggestions).toEqual([]);
        });
    });

    // =========================================================================
    // Analyze Tests
    // =========================================================================

    describe('analyze', () => {
        it('should return empty result when user_id column is missing', () => {
            const data = createTestData({
                rows: [{ timestamp: '2024-01-01' }],
            });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'week',
                name: 'Test Cohort',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.cohorts).toEqual([]);
            expect(result.comparison.insights).toContain('Insufficient data for cohort analysis');
        });

        it('should return empty result when timestamp column is missing', () => {
            const data = createTestData({
                rows: [{ user_id: 'u1' }],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'week',
                name: 'Test Cohort',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.cohorts).toEqual([]);
        });

        it('should create cohorts from valid data', () => {
            const baseDate = new Date('2024-01-01');
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: dateOffset(baseDate, 0) },
                    { user_id: 'u2', timestamp: dateOffset(baseDate, 7) },
                    { user_id: 'u3', timestamp: dateOffset(baseDate, 7) },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'week',
                name: 'Weekly Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.cohorts.length).toBeGreaterThan(0);
            expect(result.definition).toEqual(definition);
        });

        it('should include analyzedAt timestamp', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'week',
                name: 'Test',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.analyzedAt).toBeDefined();
            expect(new Date(result.analyzedAt).getTime()).not.toBeNaN();
        });
    });

    // =========================================================================
    // Install Cohorts Tests
    // =========================================================================

    describe('analyzeInstallCohorts', () => {
        it('should analyze with weekly granularity by default', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01' },
                    { user_id: 'u2', timestamp: '2024-01-08' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = analyzer.analyzeInstallCohorts(data, meanings);

            expect(result.definition.granularity).toBe('week');
            expect(result.definition.dimension).toBe('install_date');
        });

        it('should respect custom granularity', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = analyzer.analyzeInstallCohorts(data, meanings, 'month');

            expect(result.definition.granularity).toBe('month');
        });
    });

    // =========================================================================
    // Platform Cohorts Tests
    // =========================================================================

    describe('platform cohorts', () => {
        it('should group users by platform', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01', platform: 'iOS' },
                    { user_id: 'u2', timestamp: '2024-01-01', platform: 'iOS' },
                    { user_id: 'u3', timestamp: '2024-01-01', platform: 'Android' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'platform', type: 'platform' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'platform',
                name: 'Platform Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            // Should have iOS and Android cohorts
            const platformValues = result.cohorts.map(c => c.value);
            expect(platformValues).toContain('iOS');
            expect(platformValues).toContain('Android');
        });

        it('should return empty result when platform column missing', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'platform',
                name: 'Platform Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.cohorts).toEqual([]);
        });
    });

    // =========================================================================
    // Country Cohorts Tests
    // =========================================================================

    describe('country cohorts', () => {
        it('should group users by country', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01', country: 'US' },
                    { user_id: 'u2', timestamp: '2024-01-01', country: 'US' },
                    { user_id: 'u3', timestamp: '2024-01-01', country: 'UK' },
                    { user_id: 'u4', timestamp: '2024-01-01', country: 'DE' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'country', type: 'country' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'country',
                name: 'Country Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.cohorts.length).toBe(3); // US, UK, DE
        });
    });

    // =========================================================================
    // Custom Cohorts Tests
    // =========================================================================

    describe('custom cohorts', () => {
        it('should use custom column for grouping', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01', segment: 'whale' },
                    { user_id: 'u2', timestamp: '2024-01-01', segment: 'minnow' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'custom',
                customColumn: 'segment',
                name: 'Spender Segments',
            };

            const result = analyzer.analyze(data, meanings, definition);

            const values = result.cohorts.map(c => c.value);
            expect(values).toContain('whale');
            expect(values).toContain('minnow');
        });
    });

    // =========================================================================
    // Revenue Tracking Tests
    // =========================================================================

    describe('revenue tracking', () => {
        it('should track total revenue per cohort', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01', revenue: 100, platform: 'iOS' },
                    { user_id: 'u2', timestamp: '2024-01-01', revenue: 200, platform: 'iOS' },
                    { user_id: 'u3', timestamp: '2024-01-01', revenue: 50, platform: 'Android' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
                { column: 'platform', type: 'platform' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'platform',
                name: 'Platform Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            const iosCohort = result.cohorts.find(c => c.value === 'iOS');
            expect(iosCohort).toBeDefined();
            expect(iosCohort!.metrics.totalRevenue).toBe(300);
        });

        it('should calculate conversion rate', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01', revenue: 100, platform: 'iOS' },
                    { user_id: 'u2', timestamp: '2024-01-01', revenue: 0, platform: 'iOS' },
                    { user_id: 'u3', timestamp: '2024-01-01', revenue: 0, platform: 'iOS' },
                    { user_id: 'u4', timestamp: '2024-01-01', revenue: 0, platform: 'iOS' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
                { column: 'platform', type: 'platform' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'platform',
                name: 'Platform Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            const iosCohort = result.cohorts.find(c => c.value === 'iOS');
            expect(iosCohort!.metrics.conversionRate).toBe(25); // 1/4 = 25%
        });
    });

    // =========================================================================
    // Retention Matrix Tests
    // =========================================================================

    describe('retention matrix', () => {
        it('should build retention matrix', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01', platform: 'iOS' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'platform', type: 'platform' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'platform',
                name: 'Platform Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.retentionMatrix.days).toContain('D1');
            expect(result.retentionMatrix.days).toContain('D7');
            expect(result.retentionMatrix.days).toContain('D30');
        });
    });

    // =========================================================================
    // Cohort Comparison Tests
    // =========================================================================

    describe('cohort comparison', () => {
        it('should return no best/worst when no cohorts', () => {
            const data = createTestData({ rows: [] });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'week',
                name: 'Test',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.comparison.bestCohort).toBeNull();
            expect(result.comparison.worstCohort).toBeNull();
        });

        it('should include insights', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-01' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'week',
                name: 'Test',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(Array.isArray(result.comparison.insights)).toBe(true);
        });
    });

    // =========================================================================
    // Date Parsing Tests
    // =========================================================================

    describe('date handling', () => {
        it('should handle ISO date strings', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-15T10:30:00Z' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'day',
                name: 'Test',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.cohorts.length).toBeGreaterThan(0);
        });

        it('should handle Unix timestamps (seconds)', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: 1705300200 }, // Jan 15, 2024
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'day',
                name: 'Test',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.cohorts.length).toBeGreaterThan(0);
        });

        it('should handle Unix timestamps (milliseconds)', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: 1705300200000 }, // Jan 15, 2024 in ms
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'day',
                name: 'Test',
            };

            const result = analyzer.analyze(data, meanings, definition);

            expect(result.cohorts.length).toBeGreaterThan(0);
        });

        it('should handle invalid dates gracefully', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: 'not a date' },
                    { user_id: 'u2', timestamp: '2024-01-15' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'day',
                name: 'Test',
            };

            const result = analyzer.analyze(data, meanings, definition);

            // Should still process valid dates
            expect(result.cohorts.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Granularity Tests
    // =========================================================================

    describe('granularity', () => {
        it('should group by day', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-15T10:00:00Z' },
                    { user_id: 'u2', timestamp: '2024-01-15T14:00:00Z' },
                    { user_id: 'u3', timestamp: '2024-01-16T10:00:00Z' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'day',
                name: 'Daily Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            // u1 and u2 should be in same day cohort
            expect(result.cohorts.length).toBe(2);
        });

        it('should group by month', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-15' },
                    { user_id: 'u2', timestamp: '2024-01-20' },
                    { user_id: 'u3', timestamp: '2024-02-05' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'install_date',
                granularity: 'month',
                name: 'Monthly Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            // Should have 2 month cohorts: Jan and Feb
            expect(result.cohorts.length).toBe(2);
        });
    });

    // =========================================================================
    // User Activity Tracking Tests
    // =========================================================================

    describe('user activity', () => {
        it('should track first activity per user', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-15', platform: 'iOS' },
                    { user_id: 'u1', timestamp: '2024-01-10', platform: 'iOS' }, // Earlier
                    { user_id: 'u1', timestamp: '2024-01-20', platform: 'iOS' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'platform', type: 'platform' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'platform',
                name: 'Platform Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            // User should only be counted once
            const iosCohort = result.cohorts.find(c => c.value === 'iOS');
            expect(iosCohort!.userCount).toBe(1);
        });

        it('should track unique users per cohort', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: '2024-01-15', platform: 'iOS' },
                    { user_id: 'u1', timestamp: '2024-01-16', platform: 'iOS' }, // Same user again
                    { user_id: 'u2', timestamp: '2024-01-15', platform: 'iOS' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'platform', type: 'platform' },
            ]);
            const definition: CohortDefinition = {
                dimension: 'platform',
                name: 'Platform Cohorts',
            };

            const result = analyzer.analyze(data, meanings, definition);

            const iosCohort = result.cohorts.find(c => c.value === 'iOS');
            expect(iosCohort!.userCount).toBe(2);
            expect(iosCohort!.userIds.length).toBe(2);
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export cohortAnalyzer singleton', () => {
            expect(cohortAnalyzer).toBeInstanceOf(CohortAnalyzer);
        });
    });
});
