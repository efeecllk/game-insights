/**
 * MetricCalculator Unit Tests
 * Tests for game metric calculations
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import {
    MetricCalculator,
    metricCalculator,
    CalculatedMetrics,
} from '@/ai/MetricCalculator';
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';
import { NormalizedData } from '@/adapters/BaseAdapter';

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

// Helper to generate game analytics data
function createGameData(options: {
    users?: number;
    daysBack?: number;
    withRevenue?: boolean;
    withLevels?: boolean;
    withSessions?: boolean;
} = {}): NormalizedData {
    const {
        users = 100,
        daysBack = 30,
        withRevenue = true,
        withLevels = true,
        withSessions = true,
    } = options;

    const rows: Record<string, unknown>[] = [];
    const now = new Date();

    for (let userId = 1; userId <= users; userId++) {
        // Simulate user activity over multiple days
        const userDaysActive = Math.floor(Math.random() * daysBack) + 1;

        for (let dayOffset = 0; dayOffset < userDaysActive; dayOffset++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (daysBack - dayOffset));

            const row: Record<string, unknown> = {
                user_id: `user_${userId}`,
                timestamp: date.toISOString(),
            };

            if (withSessions) {
                row.session_id = `session_${userId}_${dayOffset}`;
                row.session_duration = Math.floor(Math.random() * 1800) + 60; // 1-30 min
            }

            if (withRevenue) {
                // 10% of users are paying users
                if (userId % 10 === 0 && dayOffset === 0) {
                    row.revenue = Math.floor(Math.random() * 100) + 1;
                } else {
                    row.revenue = 0;
                }
            }

            if (withLevels) {
                row.level = Math.min(userId + dayOffset, 100);
            }

            rows.push(row);
        }
    }

    return createTestData({ rows });
}

describe('MetricCalculator', () => {
    // =========================================================================
    // Basic Calculation Tests
    // =========================================================================

    describe('calculate', () => {
        it('should return all metric categories', () => {
            const calculator = new MetricCalculator();
            const data = createGameData();
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'session_id', type: 'session_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'level', type: 'level' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result).toHaveProperty('retention');
            expect(result).toHaveProperty('engagement');
            expect(result).toHaveProperty('monetization');
            expect(result).toHaveProperty('progression');
        });

        it('should include calculatedAt timestamp', () => {
            const calculator = new MetricCalculator();
            const data = createGameData();
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.calculatedAt).toBeDefined();
            expect(new Date(result.calculatedAt).getTime()).not.toBeNaN();
        });

        it('should include data range when timestamp available', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ daysBack: 30 });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.dataRange).not.toBeNull();
            expect(result.dataRange?.start).toBeDefined();
            expect(result.dataRange?.end).toBeDefined();
        });

        it('should track available metrics', () => {
            const calculator = new MetricCalculator();
            const data = createGameData();
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.availableMetrics).toContain('retention');
            expect(result.availableMetrics).toContain('engagement');
            expect(result.availableMetrics).toContain('monetization');
        });

        it('should calculate confidence score', () => {
            const calculator = new MetricCalculator();
            const data = createGameData();
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
    });

    // =========================================================================
    // Engagement Metrics Tests
    // =========================================================================

    describe('engagement metrics', () => {
        it('should calculate DAU', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50 });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.engagement).not.toBeNull();
            expect(result.engagement!.dau).toBeGreaterThanOrEqual(0);
        });

        it('should calculate WAU and MAU', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, daysBack: 30 });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.engagement!.wau).toBeGreaterThanOrEqual(0);
            expect(result.engagement!.mau).toBeGreaterThanOrEqual(0);
        });

        it('should calculate DAU/MAU ratio (stickiness)', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50 });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.engagement!.dauMauRatio).toBeGreaterThanOrEqual(0);
            expect(result.engagement!.dauMauRatio).toBeLessThanOrEqual(1);
        });

        it('should calculate sessions per user', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withSessions: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'session_id', type: 'session_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.engagement!.avgSessionsPerUser).toBeGreaterThan(0);
            expect(result.engagement!.totalSessions).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Monetization Metrics Tests
    // =========================================================================

    describe('monetization metrics', () => {
        it('should calculate total revenue', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withRevenue: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.monetization).not.toBeNull();
            expect(result.monetization!.totalRevenue).toBeGreaterThanOrEqual(0);
        });

        it('should calculate ARPU (Average Revenue Per User)', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withRevenue: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.monetization!.arpu).toBeGreaterThanOrEqual(0);
        });

        it('should calculate ARPPU (Average Revenue Per Paying User)', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withRevenue: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            if (result.monetization!.payingUsers > 0) {
                expect(result.monetization!.arppu).toBeGreaterThan(0);
            }
        });

        it('should calculate conversion rate', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withRevenue: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.monetization!.conversionRate).toBeGreaterThanOrEqual(0);
            expect(result.monetization!.conversionRate).toBeLessThanOrEqual(100);
        });

        it('should count paying users', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withRevenue: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.monetization!.payingUsers).toBeGreaterThanOrEqual(0);
        });
    });

    // =========================================================================
    // Retention Metrics Tests
    // =========================================================================

    describe('retention metrics', () => {
        it('should calculate classic retention', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 100, daysBack: 30 });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.retention).not.toBeNull();
            expect(result.retention!.classic).toBeDefined();
        });

        it('should calculate return rate', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 100, daysBack: 30 });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.retention!.returnRate).toBeGreaterThanOrEqual(0);
        });
    });

    // =========================================================================
    // Progression Metrics Tests
    // =========================================================================

    describe('progression metrics', () => {
        it('should calculate max level reached', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withLevels: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'level', type: 'level' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.progression).not.toBeNull();
            expect(result.progression!.maxLevelReached).toBeGreaterThan(0);
        });

        it('should calculate average level', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withLevels: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'level', type: 'level' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.progression!.avgLevel).toBeGreaterThan(0);
        });

        it('should calculate level completion rates', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, withLevels: true });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'level', type: 'level' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.progression!.levelCompletionRates).toBeDefined();
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle empty data', () => {
            const calculator = new MetricCalculator();
            const data = createTestData({ rows: [] });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result).toBeDefined();
        });

        it('should handle missing user_id column', () => {
            const calculator = new MetricCalculator();
            const data = createTestData({
                rows: [{ value: 100 }],
            });
            const meanings = createMeanings([
                { column: 'value', type: 'revenue' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.engagement).toBeNull();
            expect(result.retention).toBeNull();
        });

        it('should handle missing timestamp column', () => {
            const calculator = new MetricCalculator();
            const data = createTestData({
                rows: [{ user_id: 'u1', revenue: 100 }],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.retention).toBeNull();
            expect(result.dataRange).toBeNull();
        });

        it('should handle all zero revenue', () => {
            const calculator = new MetricCalculator();
            const data = createTestData({
                rows: [
                    { user_id: 'u1', revenue: 0, timestamp: '2024-01-01' },
                    { user_id: 'u2', revenue: 0, timestamp: '2024-01-01' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.monetization!.totalRevenue).toBe(0);
            expect(result.monetization!.payingUsers).toBe(0);
        });

        it('should handle single user', () => {
            const calculator = new MetricCalculator();
            const data = createTestData({
                rows: [
                    { user_id: 'u1', revenue: 100, timestamp: '2024-01-01' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.engagement!.dau).toBeGreaterThanOrEqual(0);
        });

        it('should handle invalid date values gracefully', () => {
            const calculator = new MetricCalculator();
            const data = createTestData({
                rows: [
                    { user_id: 'u1', timestamp: 'invalid-date' },
                    { user_id: 'u2', timestamp: '2024-01-01' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            // Should not throw
            const result = calculator.calculate(data, meanings);
            expect(result).toBeDefined();
        });

        it('should handle numeric string values', () => {
            const calculator = new MetricCalculator();
            const data = createTestData({
                rows: [
                    { user_id: 'u1', revenue: '99.99', level: '10', timestamp: '2024-01-01' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
                { column: 'level', type: 'level' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings);

            expect(result.monetization!.totalRevenue).toBeCloseTo(99.99, 2);
        });
    });

    // =========================================================================
    // Configuration Tests
    // =========================================================================

    describe('configuration', () => {
        it('should respect custom retention days', () => {
            const calculator = new MetricCalculator();
            const data = createGameData({ users: 50, daysBack: 60 });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'timestamp', type: 'timestamp' },
            ]);

            const result = calculator.calculate(data, meanings, {
                retentionDays: [1, 7, 30, 60],
            });

            expect(result.retention).toBeDefined();
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export metricCalculator singleton', () => {
            expect(metricCalculator).toBeInstanceOf(MetricCalculator);
        });
    });
});
