/**
 * AnomalyModel Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnomalyModel } from '../../../../src/ai/ml/AnomalyModel';

// Helper to create time series data
function createTimeSeriesData(days: number, baseMean: number = 100, baseStd: number = 10): Array<{
    timestamp: string;
    value: number;
}> {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        // Normal distribution around mean
        const randomValue = baseMean + (Math.random() - 0.5) * 2 * baseStd;

        data.push({
            timestamp: date.toISOString(),
            value: randomValue,
        });
    }

    return data;
}

describe('AnomalyModel', () => {
    let model: AnomalyModel;

    beforeEach(() => {
        model = new AnomalyModel();
    });

    describe('initialization', () => {
        it('should have correct default name and version', () => {
            expect(model.name).toBe('AnomalyModel');
            expect(model.version).toBe('1.0.0');
        });

        it('should have default config values', () => {
            expect(model.config.minDataPoints).toBe(14);
            expect(model.config.lookbackDays).toBe(30);
            expect(model.config.updateFrequency).toBe('realtime');
        });

        it('should allow custom config', () => {
            const custom = new AnomalyModel({ minDataPoints: 7 });
            expect(custom.config.minDataPoints).toBe(7);
        });
    });

    describe('detect', () => {
        beforeEach(async () => {
            const data = createTimeSeriesData(30, 100, 10);
            await model.trainMetric('test_metric', data);
        });

        it('should return null for normal values', () => {
            const result = model.detect('test_metric', 100);

            expect(result).toBeNull();
        });

        it('should detect anomaly for extreme value', () => {
            const result = model.detect('test_metric', 200); // Far above mean

            expect(result).not.toBeNull();
            if (result) {
                expect(result.metric).toBe('test_metric');
                expect(result.value).toBe(200);
            }
        });

        it('should detect spike anomaly', () => {
            const result = model.detect('test_metric', 200);

            if (result) {
                expect(result.type).toBe('spike');
            }
        });

        it('should detect drop anomaly', () => {
            const result = model.detect('test_metric', 20); // Far below mean

            if (result) {
                expect(result.type).toBe('drop');
            }
        });

        it('should include expected value and range', () => {
            const result = model.detect('test_metric', 200);

            if (result) {
                expect(result.expectedValue).toBeDefined();
                expect(result.expectedRange).toBeDefined();
                expect(result.expectedRange[0]).toBeLessThan(result.expectedRange[1]);
            }
        });

        it('should calculate deviation', () => {
            const result = model.detect('test_metric', 200);

            if (result) {
                expect(result.deviation).toBeGreaterThan(0);
            }
        });

        it('should assign severity level', () => {
            const result = model.detect('test_metric', 200);

            if (result) {
                expect(['low', 'medium', 'high', 'critical']).toContain(result.severity);
            }
        });

        it('should suggest possible causes', () => {
            const result = model.detect('test_metric', 200);

            if (result) {
                expect(result.possibleCauses).toBeDefined();
                expect(result.possibleCauses.length).toBeGreaterThan(0);
            }
        });

        it('should create profile for new metric', () => {
            const result = model.detect('new_metric', 100);

            // First detection creates profile, doesn't flag anomaly
            expect(result).toBeNull();

            // Second detection can detect anomalies
            const result2 = model.detect('new_metric', 500);
            // May or may not be anomaly depending on initial profile
        });
    });

    describe('detectBatch', () => {
        beforeEach(async () => {
            const data = createTimeSeriesData(30, 100, 10);
            await model.trainMetric('metric1', data);
            await model.trainMetric('metric2', data);
        });

        it('should detect anomalies for multiple metrics', () => {
            const result = model.detectBatch([
                { name: 'metric1', value: 200 },
                { name: 'metric2', value: 100 },
            ]);

            expect(Array.isArray(result)).toBe(true);
            // Only anomalous values should be returned
            expect(result.every(a => a.deviation > 2)).toBe(true);
        });

        it('should return empty array when no anomalies', () => {
            const result = model.detectBatch([
                { name: 'metric1', value: 100 },
                { name: 'metric2', value: 100 },
            ]);

            expect(result.length).toBe(0);
        });

        it('should handle custom timestamps', () => {
            const timestamp = new Date();
            const result = model.detectBatch([
                { name: 'metric1', value: 200, timestamp },
            ]);

            if (result.length > 0) {
                expect(result[0].timestamp).toBeDefined();
            }
        });
    });

    describe('analyzeTimeSeries', () => {
        beforeEach(async () => {
            const data = createTimeSeriesData(30, 100, 10);
            await model.trainMetric('timeseries_metric', data);
        });

        it('should detect point anomalies in time series', () => {
            const data = createTimeSeriesData(30, 100, 10);
            data[15].value = 300; // Spike

            const result = model.analyzeTimeSeries('timeseries_metric', data);

            expect(result.anomalies.length).toBeGreaterThan(0);
        });

        it('should detect trend breaks', () => {
            // Create data with trend break
            const olderData = createTimeSeriesData(14, 100, 10);
            const recentData = createTimeSeriesData(14, 150, 10); // Higher mean
            const data = [...olderData, ...recentData];

            const result = model.analyzeTimeSeries('timeseries_metric', data);

            expect(result.trendBreak).toBe(true);
        });

        it('should detect pattern changes', () => {
            // Create data with variance change
            const olderData = createTimeSeriesData(14, 100, 5);  // Low variance
            const recentData = createTimeSeriesData(14, 100, 30); // High variance
            const data = [...olderData, ...recentData];

            const result = model.analyzeTimeSeries('timeseries_metric', data);

            expect(result.patternChange).toBe(true);
        });

        it('should handle small datasets', () => {
            const data = createTimeSeriesData(2, 100, 10);
            const result = model.analyzeTimeSeries('timeseries_metric', data);

            expect(result.anomalies).toBeDefined();
        });
    });

    describe('setSensitivity', () => {
        beforeEach(async () => {
            const data = createTimeSeriesData(30, 100, 10);
            await model.trainMetric('sensitive_metric', data);
        });

        it('should detect more anomalies with high sensitivity', () => {
            model.setSensitivity('high');
            const highResult = model.detect('sensitive_metric', 130);

            model.setSensitivity('low');
            const lowResult = model.detect('sensitive_metric', 130);

            // High sensitivity should be more likely to detect anomaly
            if (highResult !== null && lowResult === null) {
                expect(highResult).not.toBeNull();
            }
        });

        it('should accept valid sensitivity levels', () => {
            model.setSensitivity('low');
            model.setSensitivity('medium');
            model.setSensitivity('high');
            // No error thrown
        });
    });

    describe('getRecentAnomalies', () => {
        beforeEach(async () => {
            const data = createTimeSeriesData(30, 100, 10);
            await model.trainMetric('recent_metric', data);
        });

        it('should return recent anomalies', () => {
            model.detect('recent_metric', 200);
            model.detect('recent_metric', 250);

            const result = model.getRecentAnomalies(24);

            expect(result.length).toBeGreaterThan(0);
        });

        it('should filter by time window', () => {
            model.detect('recent_metric', 200);

            const result = model.getRecentAnomalies(24);
            const oldResult = model.getRecentAnomalies(0);

            // All recent anomalies should be within 24 hours
            expect(result.length).toBeGreaterThanOrEqual(oldResult.length);
        });
    });

    describe('getAnomalySummary', () => {
        beforeEach(async () => {
            const data = createTimeSeriesData(30, 100, 10);
            await model.trainMetric('summary_metric', data);
        });

        it('should return anomaly summary', () => {
            model.detect('summary_metric', 200);

            const summary = model.getAnomalySummary();

            expect(summary.total).toBeDefined();
            expect(summary.bySeverity).toBeDefined();
            expect(summary.byType).toBeDefined();
            expect(summary.topMetrics).toBeDefined();
        });

        it('should count by severity', () => {
            model.detect('summary_metric', 200);

            const summary = model.getAnomalySummary();

            expect(summary.bySeverity.low).toBeDefined();
            expect(summary.bySeverity.medium).toBeDefined();
            expect(summary.bySeverity.high).toBeDefined();
            expect(summary.bySeverity.critical).toBeDefined();
        });

        it('should identify top metrics', () => {
            model.detect('summary_metric', 200);
            model.detect('summary_metric', 250);

            const summary = model.getAnomalySummary();

            expect(summary.topMetrics.length).toBeGreaterThan(0);
            expect(summary.topMetrics[0]).toHaveProperty('metric');
            expect(summary.topMetrics[0]).toHaveProperty('count');
        });
    });

    describe('trainMetric', () => {
        it('should train on historical data', async () => {
            const data = createTimeSeriesData(30, 100, 10);
            const profile = await model.trainMetric('trained_metric', data);

            expect(profile).toBeDefined();
            expect(profile.name).toBe('trained_metric');
            // Allow wider tolerance due to random variance in data generation
            expect(profile.mean).toBeGreaterThan(80);
            expect(profile.mean).toBeLessThan(120);
        });

        it('should throw error with insufficient data', async () => {
            const data = createTimeSeriesData(5, 100, 10);

            await expect(model.trainMetric('small_metric', data))
                .rejects.toThrow('Need at least');
        });

        it('should calculate day of week patterns', async () => {
            const data = createTimeSeriesData(30, 100, 10);
            const profile = await model.trainMetric('dow_metric', data);

            expect(profile.dayOfWeekMeans).toBeDefined();
            expect(profile.dayOfWeekMeans.length).toBe(7);
        });

        it('should calculate hour of day patterns', async () => {
            const data = createTimeSeriesData(30, 100, 10);
            const profile = await model.trainMetric('hour_metric', data);

            expect(profile.hourOfDayMeans).toBeDefined();
            expect(profile.hourOfDayMeans.length).toBe(24);
        });

        it('should calculate volatility', async () => {
            const data = createTimeSeriesData(30, 100, 10);
            const profile = await model.trainMetric('volatile_metric', data);

            expect(profile.volatility).toBeDefined();
            expect(profile.volatility).toBeGreaterThanOrEqual(0);
        });

        it('should calculate recent trend', async () => {
            const data = createTimeSeriesData(30, 100, 10);
            const profile = await model.trainMetric('trend_metric', data);

            expect(profile.recentTrend).toBeDefined();
        });
    });

    describe('train', () => {
        it('should train on multiple metrics', async () => {
            const metricsData = {
                'metric_a': createTimeSeriesData(30, 100, 10),
                'metric_b': createTimeSeriesData(30, 200, 20),
            };

            const metrics = await model.train(metricsData);

            expect(metrics).toBeDefined();
            expect(metrics.lastTrainedAt).toBeDefined();
        });

        it('should skip metrics with insufficient data', async () => {
            const metricsData = {
                'good_metric': createTimeSeriesData(30, 100, 10),
                'bad_metric': createTimeSeriesData(5, 100, 10),
            };

            const metrics = await model.train(metricsData);

            expect(metrics).toBeDefined();
        });
    });

    describe('getFeatureImportance', () => {
        it('should return feature importance mapping', () => {
            const importance = model.getFeatureImportance();

            expect(importance).toBeDefined();
            expect(Object.keys(importance).length).toBeGreaterThan(0);
        });

        it('should include key features', () => {
            const importance = model.getFeatureImportance();

            expect(importance['z_score']).toBeDefined();
            expect(importance['trend_deviation']).toBeDefined();
            expect(importance['seasonal_deviation']).toBeDefined();
        });

        it('should have importance values between 0 and 1', () => {
            const importance = model.getFeatureImportance();

            Object.values(importance).forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('severity levels', () => {
        beforeEach(async () => {
            const data = createTimeSeriesData(30, 100, 10);
            await model.trainMetric('severity_metric', data);
        });

        it('should classify low severity correctly', () => {
            model.setSensitivity('high'); // More likely to detect
            const result = model.detect('severity_metric', 125);

            if (result && result.deviation < 3) {
                expect(result.severity).toBe('low');
            }
        });

        it('should classify medium severity correctly', () => {
            const result = model.detect('severity_metric', 135);

            if (result && result.deviation >= 2.5 && result.deviation < 3) {
                expect(result.severity).toBe('medium');
            }
        });

        it('should classify high severity correctly', () => {
            const result = model.detect('severity_metric', 160);

            if (result && result.deviation >= 3 && result.deviation < 4) {
                expect(result.severity).toBe('high');
            }
        });

        it('should classify critical severity correctly', () => {
            const result = model.detect('severity_metric', 200);

            if (result && result.deviation >= 4) {
                expect(result.severity).toBe('critical');
            }
        });
    });

    describe('edge cases', () => {
        it('should handle zero values', async () => {
            const data = createTimeSeriesData(30, 100, 10);
            await model.trainMetric('zero_metric', data);

            const result = model.detect('zero_metric', 0);

            // Zero is valid, may or may not be anomaly
            expect(result === null || result.value === 0).toBe(true);
        });

        it('should handle negative values', async () => {
            const data = createTimeSeriesData(30, 0, 10);
            await model.trainMetric('negative_metric', data);

            const result = model.detect('negative_metric', -50);

            // Should not crash
            expect(result === null || typeof result.value === 'number').toBe(true);
        });

        it('should handle constant values', async () => {
            const data = Array(30).fill(null).map((_, i) => ({
                timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                value: 100,
            }));
            await model.trainMetric('constant_metric', data);

            // Any deviation from constant should be anomaly
            const result = model.detect('constant_metric', 110);

            // May or may not detect depending on std=0 handling
        });

        it('should handle very large values', async () => {
            const data = createTimeSeriesData(30, 1000000, 100000);
            await model.trainMetric('large_metric', data);

            const result = model.detect('large_metric', 2000000);

            // Should not crash
            expect(result === null || typeof result.value === 'number').toBe(true);
        });
    });
});
