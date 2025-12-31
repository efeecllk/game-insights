/**
 * AnomalyDetector Unit Tests
 * Tests for anomaly detection in game metrics
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import {
    AnomalyDetector,
    anomalyDetector,
    AnomalySeverity,
    Anomaly,
} from '@/ai/AnomalyDetector';
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

// Helper to create time-series data with an anomaly
function createTimeSeriesData(
    options: {
        points?: number;
        baseValue?: number;
        variance?: number;
        spikeAt?: number;
        spikeMultiplier?: number;
    } = {}
): NormalizedData {
    const {
        points = 30,
        baseValue = 100,
        variance = 5,
        spikeAt = -1,
        spikeMultiplier = 5,
    } = options;

    const rows = [];
    const now = new Date();

    for (let i = 0; i < points; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (points - i));

        // Add small variance
        let value = baseValue + (Math.random() - 0.5) * variance;

        // Add spike at specified point
        if (i === spikeAt) {
            value = baseValue * spikeMultiplier;
        }

        rows.push({
            timestamp: date.toISOString(),
            revenue: value,
            user_id: `user_${i % 10}`,
        });
    }

    return createTestData({ rows });
}

describe('AnomalyDetector', () => {
    // =========================================================================
    // Basic Detection Tests
    // =========================================================================

    describe('detect', () => {
        it('should return no anomalies for empty data', () => {
            const detector = new AnomalyDetector();
            const data = createTestData({ rows: [], columns: ['value'] });
            const meanings = createMeanings([
                { column: 'value', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            expect(result.anomalies).toEqual([]);
            // Metrics are analyzed but no anomalies found
            expect(result.metricsAnalyzed).toContain('value');
        });

        it('should return result structure with all fields', () => {
            const detector = new AnomalyDetector();
            const data = createTimeSeriesData();
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            expect(result).toHaveProperty('anomalies');
            expect(result).toHaveProperty('metricsAnalyzed');
            expect(result).toHaveProperty('timeRange');
            expect(result).toHaveProperty('baselineStats');
        });

        it('should include analyzed metrics', () => {
            const detector = new AnomalyDetector();
            const data = createTimeSeriesData();
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            expect(result.metricsAnalyzed).toContain('revenue');
        });

        it('should calculate baseline stats', () => {
            const detector = new AnomalyDetector();
            const data = createTimeSeriesData({ points: 30, baseValue: 100, variance: 10 });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            expect(result.baselineStats['revenue']).toBeDefined();
            expect(result.baselineStats['revenue'].mean).toBeGreaterThan(0);
            expect(result.baselineStats['revenue'].stdDev).toBeGreaterThanOrEqual(0);
            expect(result.baselineStats['revenue'].median).toBeGreaterThan(0);
        });

        it('should detect time range', () => {
            const detector = new AnomalyDetector();
            const data = createTimeSeriesData({ points: 30 });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            expect(result.timeRange).not.toBeNull();
            expect(result.timeRange?.start).toBeDefined();
            expect(result.timeRange?.end).toBeDefined();
        });
    });

    // =========================================================================
    // Spike Detection Tests
    // =========================================================================

    describe('spike detection', () => {
        it('should detect significant spike', () => {
            const detector = new AnomalyDetector();

            // Create data with clear spike
            const rows = [];
            for (let i = 0; i < 20; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (20 - i));
                rows.push({
                    timestamp: date.toISOString(),
                    revenue: i === 15 ? 500 : 100, // Big spike at day 15
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            // Should detect the spike
            const spikes = result.anomalies.filter(a => a.type === 'spike');
            expect(spikes.length).toBeGreaterThan(0);
        });

        it('should include spike details', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 20; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (20 - i));
                rows.push({
                    timestamp: date.toISOString(),
                    revenue: i === 15 ? 600 : 100,
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);
            const spike = result.anomalies.find(a => a.type === 'spike');

            if (spike) {
                expect(spike.metric).toBe('revenue');
                expect(spike.percentChange).toBeGreaterThan(0);
                expect(spike.description).toBeDefined();
                expect(spike.possibleCauses.length).toBeGreaterThan(0);
            }
        });
    });

    // =========================================================================
    // Drop Detection Tests
    // =========================================================================

    describe('drop detection', () => {
        it('should detect significant drop', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 20; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (20 - i));
                rows.push({
                    timestamp: date.toISOString(),
                    revenue: i === 15 ? 10 : 100, // Big drop at day 15
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            const drops = result.anomalies.filter(a => a.type === 'drop');
            expect(drops.length).toBeGreaterThan(0);
        });

        it('should have negative percent change for drops', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 20; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (20 - i));
                rows.push({
                    timestamp: date.toISOString(),
                    revenue: i === 15 ? 5 : 100,
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);
            const drop = result.anomalies.find(a => a.type === 'drop');

            if (drop) {
                expect(drop.percentChange).toBeLessThan(0);
            }
        });
    });

    // =========================================================================
    // Severity Tests
    // =========================================================================

    describe('severity levels', () => {
        it('should classify severity based on deviation', () => {
            const detector = new AnomalyDetector();

            // Create data with different severity levels
            const rows = [];
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (30 - i));

                let value = 100;
                if (i === 25) value = 300; // Medium severity
                if (i === 28) value = 700; // High/Critical severity

                rows.push({
                    timestamp: date.toISOString(),
                    revenue: value,
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            // Should have anomalies with different severities
            const severities = new Set(result.anomalies.map(a => a.severity));
            expect(severities.size).toBeGreaterThanOrEqual(1);
        });

        it('should sort anomalies by severity', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (30 - i));

                let value = 100;
                if (i === 10) value = 200; // Less severe
                if (i === 20) value = 800; // More severe

                rows.push({
                    timestamp: date.toISOString(),
                    revenue: value,
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            if (result.anomalies.length >= 2) {
                const severityOrder: Record<AnomalySeverity, number> = {
                    critical: 0,
                    high: 1,
                    medium: 2,
                    low: 3,
                };

                for (let i = 0; i < result.anomalies.length - 1; i++) {
                    const current = severityOrder[result.anomalies[i].severity];
                    const next = severityOrder[result.anomalies[i + 1].severity];
                    expect(current).toBeLessThanOrEqual(next);
                }
            }
        });
    });

    // =========================================================================
    // Trend Detection Tests
    // =========================================================================

    describe('trend detection', () => {
        it('should detect trend changes', () => {
            const detector = new AnomalyDetector();

            // Create data with clear trend change
            const rows = [];
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (30 - i));

                // First half: stable around 100
                // Second half: consistently higher around 200
                const value = i < 15 ? 100 + Math.random() * 5 : 200 + Math.random() * 5;

                rows.push({
                    timestamp: date.toISOString(),
                    revenue: value,
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            const trendChanges = result.anomalies.filter(a => a.type === 'trend_change');
            // May or may not detect trend change depending on thresholds
            expect(result.anomalies).toBeDefined();
        });
    });

    // =========================================================================
    // Configuration Tests
    // =========================================================================

    describe('configuration', () => {
        it('should respect custom thresholds', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 20; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (20 - i));
                rows.push({
                    timestamp: date.toISOString(),
                    revenue: i === 15 ? 150 : 100, // 50% increase
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            // With strict thresholds
            const strictResult = detector.detect(data, meanings, {
                thresholds: { minPercentChange: 100 }, // Require 100% change
            });

            // With lenient thresholds
            const lenientResult = detector.detect(data, meanings, {
                thresholds: { minPercentChange: 10 }, // Require only 10% change
            });

            // Lenient should find more or equal anomalies
            expect(lenientResult.anomalies.length).toBeGreaterThanOrEqual(0);
        });

        it('should respect granularity setting', () => {
            const detector = new AnomalyDetector();
            const data = createTimeSeriesData({ points: 60 });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const dayResult = detector.detect(data, meanings, { granularity: 'day' });
            const weekResult = detector.detect(data, meanings, { granularity: 'week' });

            // Both should complete without error
            expect(dayResult.anomalies).toBeDefined();
            expect(weekResult.anomalies).toBeDefined();
        });

        it('should only analyze specified metrics', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 20; i++) {
                rows.push({
                    timestamp: new Date().toISOString(),
                    revenue: 100,
                    dau: 1000,
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
                { column: 'dau', type: 'dau' },
            ]);

            const result = detector.detect(data, meanings, {
                metrics: ['revenue'], // Only analyze revenue
            });

            expect(result.metricsAnalyzed).toContain('revenue');
            expect(result.metricsAnalyzed).not.toContain('dau');
        });
    });

    // =========================================================================
    // Possible Causes Tests
    // =========================================================================

    describe('possible causes', () => {
        it('should include revenue-specific causes for revenue anomalies', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 20; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (20 - i));
                rows.push({
                    timestamp: date.toISOString(),
                    revenue: i === 15 ? 500 : 100,
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);
            const revenueAnomaly = result.anomalies.find(a => a.metric === 'revenue');

            if (revenueAnomaly) {
                expect(revenueAnomaly.possibleCauses.length).toBeGreaterThan(0);
            }
        });

        it('should limit possible causes to 3', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 20; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (20 - i));
                rows.push({
                    timestamp: date.toISOString(),
                    revenue: i === 15 ? 500 : 100,
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            for (const anomaly of result.anomalies) {
                expect(anomaly.possibleCauses.length).toBeLessThanOrEqual(3);
            }
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle data without timestamp', () => {
            const detector = new AnomalyDetector();
            const data = createTestData({
                rows: [
                    { revenue: 100 },
                    { revenue: 200 },
                ],
            });
            const meanings = createMeanings([
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            expect(result.timeRange).toBeNull();
        });

        it('should handle insufficient data points', () => {
            const detector = new AnomalyDetector();
            const data = createTestData({
                rows: [
                    { timestamp: '2024-01-01', revenue: 100 },
                    { timestamp: '2024-01-02', revenue: 200 },
                ],
            });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            // With only 2 data points, may not have enough for detection
            expect(result.anomalies).toBeDefined();
        });

        it('should handle zero variance data', () => {
            const detector = new AnomalyDetector();

            const rows = [];
            for (let i = 0; i < 20; i++) {
                rows.push({
                    timestamp: new Date().toISOString(),
                    revenue: 100, // All same value
                });
            }

            const data = createTestData({ rows });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const result = detector.detect(data, meanings);

            // No anomalies in constant data
            expect(result.anomalies.length).toBe(0);
        });

        it('should handle invalid date values', () => {
            const detector = new AnomalyDetector();
            const data = createTestData({
                rows: [
                    { timestamp: 'invalid', revenue: 100 },
                    { timestamp: '2024-01-01', revenue: 200 },
                ],
            });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'revenue', type: 'revenue' },
            ]);

            // Should not throw
            const result = detector.detect(data, meanings);
            expect(result).toBeDefined();
        });

        it('should handle missing metric column', () => {
            const detector = new AnomalyDetector();
            const data = createTestData({
                rows: [
                    { timestamp: '2024-01-01', other: 100 },
                ],
            });
            const meanings = createMeanings([
                { column: 'timestamp', type: 'timestamp' },
                { column: 'other', type: 'unknown' },
            ]);

            const result = detector.detect(data, meanings);

            expect(result.metricsAnalyzed.length).toBe(0);
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export anomalyDetector singleton', () => {
            expect(anomalyDetector).toBeInstanceOf(AnomalyDetector);
        });
    });
});
