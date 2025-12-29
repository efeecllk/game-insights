/**
 * RetentionPredictor Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RetentionPredictor } from '../../../../src/ai/ml/RetentionPredictor';

describe('RetentionPredictor', () => {
    let predictor: RetentionPredictor;

    beforeEach(() => {
        predictor = new RetentionPredictor();
    });

    describe('initialization', () => {
        it('should have correct default name and version', () => {
            expect(predictor.name).toBe('RetentionPredictor');
            expect(predictor.version).toBe('1.0.0');
        });

        it('should have default config values', () => {
            expect(predictor.config.minDataPoints).toBe(100);
            expect(predictor.config.lookbackDays).toBe(90);
            expect(predictor.config.validationSplit).toBe(0.2);
            expect(predictor.config.confidenceThreshold).toBe(0.7);
        });

        it('should allow custom config overrides', () => {
            const customPredictor = new RetentionPredictor({
                minDataPoints: 50,
                lookbackDays: 60,
            });
            expect(customPredictor.config.minDataPoints).toBe(50);
            expect(customPredictor.config.lookbackDays).toBe(60);
        });
    });

    describe('predictRetention', () => {
        it('should return observed value with confidence 1.0 when day data exists', () => {
            const observedRetention = { 0: 1, 1: 0.45, 7: 0.3 };
            const result = predictor.predictRetention(observedRetention, 1, 1000);

            expect(result.value).toBe(0.45);
            expect(result.confidence).toBe(1.0);
            expect(result.cohortSize).toBe(1000);
        });

        it('should extrapolate for future days beyond observed data', () => {
            const observedRetention = { 0: 1, 1: 0.45, 7: 0.3 };
            const result = predictor.predictRetention(observedRetention, 30, 1000);

            expect(result.value).toBeLessThan(0.3);
            expect(result.value).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThan(1.0);
        });

        it('should include prediction range for extrapolated values', () => {
            const observedRetention = { 0: 1, 1: 0.45, 7: 0.3 };
            const result = predictor.predictRetention(observedRetention, 30, 1000);

            expect(result.range).toBeDefined();
            expect(result.range!.low).toBeLessThan(result.value);
            expect(result.range!.high).toBeGreaterThan(result.value);
        });

        it('should include factors for predictions', () => {
            const observedRetention = { 0: 1, 1: 0.45, 7: 0.3 };
            const result = predictor.predictRetention(observedRetention, 30, 1000);

            expect(result.factors).toBeDefined();
            expect(Array.isArray(result.factors)).toBe(true);
        });

        it('should include retention curve in result', () => {
            const observedRetention = { 0: 1, 1: 0.45, 7: 0.3 };
            const result = predictor.predictRetention(observedRetention, 7, 1000);

            expect(result.retentionCurve).toBeDefined();
            expect(result.retentionCurve.length).toBeGreaterThan(0);
            expect(result.retentionCurve[0]).toHaveProperty('day');
            expect(result.retentionCurve[0]).toHaveProperty('retention');
        });

        it('should compare to benchmark', () => {
            const observedRetention = { 0: 1, 1: 0.6 };
            const result = predictor.predictRetention(observedRetention, 1, 1000);

            expect(['above', 'at', 'below']).toContain(result.benchmarkComparison);
        });

        it('should handle single data point gracefully', () => {
            const observedRetention = { 0: 1 };
            const result = predictor.predictRetention(observedRetention, 7, 1000);

            expect(result.value).toBeGreaterThan(0);
            expect(result.value).toBeLessThanOrEqual(1);
        });
    });

    describe('predictD30FromEarly', () => {
        it('should predict D30 retention from D1 and D7', () => {
            const result = predictor.predictD30FromEarly(0.45, 0.3, 1000);

            expect(result.value).toBeGreaterThan(0);
            expect(result.value).toBeLessThan(0.3);
            expect(result.cohortSize).toBe(1000);
        });

        it('should return reasonable confidence level', () => {
            const result = predictor.predictD30FromEarly(0.45, 0.3, 1000);

            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThan(1);
        });

        it('should include D1 and D7 as factors', () => {
            const result = predictor.predictD30FromEarly(0.45, 0.3, 1000);

            expect(result.factors).toBeDefined();
            expect(result.factors!.length).toBeGreaterThanOrEqual(2);
            expect(result.factors!.some(f => f.name.includes('D1'))).toBe(true);
        });

        it('should include retention curve up to day 30', () => {
            const result = predictor.predictD30FromEarly(0.45, 0.3, 1000);

            expect(result.retentionCurve).toBeDefined();
            expect(result.retentionCurve.length).toBe(31); // Day 0 to Day 30
        });

        it('should handle excellent retention rates', () => {
            const result = predictor.predictD30FromEarly(0.6, 0.4, 1000);

            expect(result.confidence).toBeGreaterThan(0.6);
            expect(result.factors!.some(f => f.impact > 0)).toBe(true);
        });

        it('should handle poor retention rates', () => {
            const result = predictor.predictD30FromEarly(0.2, 0.05, 1000);

            expect(result.value).toBeLessThan(0.05);
        });

        it('should provide prediction range', () => {
            const result = predictor.predictD30FromEarly(0.45, 0.3, 1000);

            expect(result.range).toBeDefined();
            expect(result.range!.low).toBeLessThan(result.value);
            expect(result.range!.high).toBeGreaterThan(result.value);
            expect(result.range!.high).toBeLessThanOrEqual(0.3); // Should not exceed D7
        });
    });

    describe('predictCohortLTV', () => {
        it('should calculate LTV from retention curve and ARPDAU', () => {
            const retentionCurve = [
                { day: 1, retention: 0.45 },
                { day: 7, retention: 0.3 },
                { day: 14, retention: 0.2 },
                { day: 30, retention: 0.1 },
            ];
            const result = predictor.predictCohortLTV(retentionCurve, 0.5, 365);

            expect(result.ltv).toBeGreaterThan(0);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });

        it('should increase LTV with higher ARPDAU', () => {
            const retentionCurve = [
                { day: 1, retention: 0.45 },
                { day: 7, retention: 0.3 },
            ];
            const lowArpdau = predictor.predictCohortLTV(retentionCurve, 0.1, 365);
            const highArpdau = predictor.predictCohortLTV(retentionCurve, 1.0, 365);

            expect(highArpdau.ltv).toBeGreaterThan(lowArpdau.ltv);
        });

        it('should have decreasing confidence with longer horizons', () => {
            const retentionCurve = [
                { day: 1, retention: 0.45 },
                { day: 7, retention: 0.3 },
            ];
            const short = predictor.predictCohortLTV(retentionCurve, 0.5, 30);
            const long = predictor.predictCohortLTV(retentionCurve, 0.5, 365);

            // Confidence should be at least as high for shorter horizons
            expect(short.confidence).toBeGreaterThanOrEqual(long.confidence);
        });
    });

    describe('train', () => {
        it('should train on cohort data', async () => {
            const cohortData = Array(10).fill(null).map((_, i) => ({
                cohortDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
                size: 1000,
                retentionByDay: {
                    0: 1,
                    1: 0.45 - Math.random() * 0.1,
                    7: 0.3 - Math.random() * 0.05,
                    14: 0.2 - Math.random() * 0.05,
                    30: 0.1 - Math.random() * 0.03,
                },
            }));

            const metrics = await predictor.train({ cohortData });

            expect(metrics).toBeDefined();
            expect(metrics.lastTrainedAt).toBeDefined();
            expect(metrics.dataPointsUsed).toBe(10);
        });

        it('should throw error with insufficient data', async () => {
            const cohortData = [
                { cohortDate: '2024-01-01', size: 1000, retentionByDay: { 0: 1, 1: 0.45 } },
            ];

            // minDataPoints is 100, but divided by 100 in train = 1, so this should actually pass
            // Let's set minDataPoints to require more cohorts
            const strictPredictor = new RetentionPredictor({ minDataPoints: 1000 });

            await expect(strictPredictor.train({ cohortData })).rejects.toThrow('Insufficient data');
        });
    });

    describe('evaluate', () => {
        it('should return metrics for evaluation', async () => {
            const cohortData = Array(5).fill(null).map((_, i) => ({
                cohortDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
                size: 1000,
                retentionByDay: {
                    0: 1,
                    1: 0.45,
                    7: 0.3,
                    14: 0.2,
                },
            }));

            const metrics = await predictor.evaluate({ cohortData });

            expect(metrics).toBeDefined();
            expect(typeof metrics.mse).toBe('number');
            expect(typeof metrics.mae).toBe('number');
        });

        it('should handle small evaluation sets gracefully', async () => {
            const cohortData = [
                { cohortDate: '2024-01-01', size: 1000, retentionByDay: { 0: 1, 1: 0.45 } },
            ];

            const metrics = await predictor.evaluate({ cohortData });

            expect(metrics).toBeDefined();
        });
    });

    describe('getFeatureImportance', () => {
        it('should return feature importance mapping', () => {
            const importance = predictor.getFeatureImportance();

            expect(importance).toBeDefined();
            expect(Object.keys(importance).length).toBeGreaterThan(0);
            expect(importance['d1_retention']).toBeDefined();
            expect(importance['d7_retention']).toBeDefined();
        });

        it('should have importance values between 0 and 1', () => {
            const importance = predictor.getFeatureImportance();

            Object.values(importance).forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('edge cases', () => {
        it('should handle 100% retention correctly', () => {
            const observedRetention = { 0: 1, 1: 1, 7: 1 };
            const result = predictor.predictRetention(observedRetention, 30, 1000);

            expect(result.value).toBeLessThanOrEqual(1);
        });

        it('should handle near-zero retention', () => {
            const observedRetention = { 0: 1, 1: 0.01, 7: 0.001 };
            const result = predictor.predictRetention(observedRetention, 30, 1000);

            expect(result.value).toBeGreaterThan(0);
        });

        it('should handle empty observed retention gracefully', () => {
            const observedRetention = {};
            const result = predictor.predictRetention(observedRetention, 7, 1000);

            // Should use default pattern
            expect(result.value).toBeGreaterThan(0);
            expect(result.value).toBeLessThanOrEqual(1);
        });
    });
});
