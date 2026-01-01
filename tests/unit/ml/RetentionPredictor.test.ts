/**
 * RetentionPredictor Unit Tests
 * Tests for retention prediction and cohort analysis
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetentionPredictor, retentionPredictor } from '@/ai/ml/RetentionPredictor';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('RetentionPredictor', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const predictor = new RetentionPredictor();

            expect(predictor.name).toBe('RetentionPredictor');
            expect(predictor.version).toBe('1.0.0');
            expect(predictor.config).toBeDefined();
        });

        it('should merge custom config with defaults', () => {
            const predictor = new RetentionPredictor({
                minDataPoints: 50,
                lookbackDays: 60,
            });

            expect(predictor.config.minDataPoints).toBe(50);
            expect(predictor.config.lookbackDays).toBe(60);
            expect(predictor.config.validationSplit).toBe(0.2); // Default
        });
    });

    // =========================================================================
    // Prediction Tests
    // =========================================================================

    describe('predictRetention', () => {
        it('should return observed value when data is available', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.45, 7: 0.20 };

            const prediction = predictor.predictRetention(observed, 1);

            expect(prediction.value).toBe(0.45);
            expect(prediction.confidence).toBe(1.0);
        });

        it('should predict future retention with confidence < 1', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.45, 7: 0.20 };

            const prediction = predictor.predictRetention(observed, 30);

            expect(prediction.value).toBeLessThan(0.20);
            expect(prediction.confidence).toBeLessThan(1.0);
            expect(prediction.range).toBeDefined();
        });

        it('should include prediction range for future days', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.45, 7: 0.20 };

            const prediction = predictor.predictRetention(observed, 30);

            expect(prediction.range?.low).toBeLessThan(prediction.value);
            expect(prediction.range?.high).toBeGreaterThan(prediction.value);
        });

        it('should include cohort size', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.45 };

            const prediction = predictor.predictRetention(observed, 7, 5000);

            expect(prediction.cohortSize).toBe(5000);
        });

        it('should build retention curve', () => {
            const predictor = new RetentionPredictor();
            const observed = { 0: 1, 1: 0.45, 7: 0.20 };

            const prediction = predictor.predictRetention(observed, 7);

            expect(prediction.retentionCurve).toBeDefined();
            expect(prediction.retentionCurve?.length).toBeGreaterThan(0);
        });

        it('should compare to benchmark', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.45 };

            const prediction = predictor.predictRetention(observed, 1);

            expect(['above', 'at', 'below']).toContain(prediction.benchmarkComparison);
        });

        it('should identify prediction factors', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.45, 7: 0.20 };

            const prediction = predictor.predictRetention(observed, 30);

            expect(prediction.factors).toBeDefined();
        });
    });

    // =========================================================================
    // D30 Prediction Tests
    // =========================================================================

    describe('predictD30FromEarly', () => {
        it('should predict D30 from D1 and D7 data', () => {
            const predictor = new RetentionPredictor();

            const prediction = predictor.predictD30FromEarly(0.45, 0.20);

            expect(prediction.value).toBeGreaterThan(0);
            expect(prediction.value).toBeLessThan(0.20);
        });

        it('should include confidence range', () => {
            const predictor = new RetentionPredictor();

            const prediction = predictor.predictD30FromEarly(0.45, 0.20);

            expect(prediction.range?.low).toBeLessThan(prediction.value);
            expect(prediction.range?.high).toBeGreaterThan(prediction.value);
        });

        it('should include D1 retention factor', () => {
            const predictor = new RetentionPredictor();

            const prediction = predictor.predictD30FromEarly(0.45, 0.20);

            const d1Factor = prediction.factors?.find(f => f.name === 'D1 Retention');
            expect(d1Factor).toBeDefined();
        });

        it('should include D1→D7 decay factor', () => {
            const predictor = new RetentionPredictor();

            const prediction = predictor.predictD30FromEarly(0.45, 0.20);

            const decayFactor = prediction.factors?.find(f => f.name.includes('Decay'));
            expect(decayFactor).toBeDefined();
        });

        it('should generate predicted curve', () => {
            const predictor = new RetentionPredictor();

            const prediction = predictor.predictD30FromEarly(0.45, 0.20, 1000);

            expect(prediction.retentionCurve?.length).toBeGreaterThan(0);
            expect(prediction.cohortSize).toBe(1000);
        });

        it('should have higher confidence for good retention', () => {
            const predictor = new RetentionPredictor();

            const goodPrediction = predictor.predictD30FromEarly(0.50, 0.30);
            const poorPrediction = predictor.predictD30FromEarly(0.20, 0.05);

            expect(goodPrediction.confidence).toBeGreaterThanOrEqual(poorPrediction.confidence);
        });
    });

    // =========================================================================
    // Cohort LTV Tests
    // =========================================================================

    describe('predictCohortLTV', () => {
        it('should calculate LTV from retention curve', () => {
            const predictor = new RetentionPredictor();
            const curve = [
                { day: 1, retention: 0.45 },
                { day: 7, retention: 0.20 },
                { day: 30, retention: 0.10 },
            ];

            const result = predictor.predictCohortLTV(curve, 0.10, 365);

            expect(result.ltv).toBeGreaterThan(0);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });

        it('should scale with daily ARPDAU', () => {
            const predictor = new RetentionPredictor();
            const curve = [{ day: 1, retention: 0.45 }];

            const lowArp = predictor.predictCohortLTV(curve, 0.05, 30);
            const highArp = predictor.predictCohortLTV(curve, 0.20, 30);

            expect(highArp.ltv).toBeGreaterThan(lowArp.ltv);
        });

        it('should decrease confidence with longer horizon', () => {
            const predictor = new RetentionPredictor();
            const curve = [{ day: 1, retention: 0.45 }, { day: 7, retention: 0.20 }];

            const shortHorizon = predictor.predictCohortLTV(curve, 0.10, 30);
            const longHorizon = predictor.predictCohortLTV(curve, 0.10, 365);

            expect(shortHorizon.confidence).toBeGreaterThanOrEqual(longHorizon.confidence);
        });
    });

    // =========================================================================
    // Training Tests
    // =========================================================================

    describe('train', () => {
        it('should throw error for insufficient data', async () => {
            const predictor = new RetentionPredictor({ minDataPoints: 1000 });
            const data = {
                cohortData: [{ cohortDate: '2024-01-01', size: 100, retentionByDay: { 1: 0.45 } }],
            };

            await expect(predictor.train(data)).rejects.toThrow('Insufficient data');
        });

        it('should train on cohort data', async () => {
            const predictor = new RetentionPredictor({ minDataPoints: 10 });
            const cohortData = [];

            for (let i = 0; i < 10; i++) {
                cohortData.push({
                    cohortDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    size: 1000,
                    retentionByDay: { 0: 1, 1: 0.45, 7: 0.20, 30: 0.10 },
                });
            }

            const metrics = await predictor.train({ cohortData });

            expect(metrics).toBeDefined();
            expect(metrics.dataPointsUsed).toBe(10);
            expect(metrics.lastTrainedAt).toBeDefined();
        });

        it('should return model metrics after training', async () => {
            const predictor = new RetentionPredictor({ minDataPoints: 5 });
            const cohortData = Array.from({ length: 5 }, (_, i) => ({
                cohortDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
                size: 1000,
                retentionByDay: { 0: 1, 1: 0.45, 7: 0.20 },
            }));

            const metrics = await predictor.train({ cohortData });

            expect(metrics.mse).toBeDefined();
            expect(metrics.mae).toBeDefined();
        });
    });

    // =========================================================================
    // Evaluation Tests
    // =========================================================================

    describe('evaluate', () => {
        it('should return metrics for empty data', async () => {
            const predictor = new RetentionPredictor();

            const metrics = await predictor.evaluate({ cohortData: [] });

            expect(metrics.mse).toBe(0);
            expect(metrics.mae).toBe(0);
        });

        it('should calculate metrics for valid data', async () => {
            const predictor = new RetentionPredictor();
            const cohortData = Array.from({ length: 5 }, (_, i) => ({
                cohortDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
                size: 1000,
                retentionByDay: { 0: 1, 1: 0.45, 3: 0.30, 7: 0.20, 14: 0.15 },
            }));

            const metrics = await predictor.evaluate({ cohortData });

            expect(metrics.mse).toBeDefined();
            expect(metrics.mae).toBeDefined();
            expect(metrics.dataPointsUsed).toBeGreaterThanOrEqual(0);
        });
    });

    // =========================================================================
    // Feature Importance Tests
    // =========================================================================

    describe('getFeatureImportance', () => {
        it('should return feature importance scores', () => {
            const predictor = new RetentionPredictor();

            const importance = predictor.getFeatureImportance();

            expect(importance.d1_retention).toBeDefined();
            expect(importance.d7_retention).toBeDefined();
            expect(Object.keys(importance).length).toBeGreaterThan(0);
        });

        it('should have scores summing to approximately 1', () => {
            const predictor = new RetentionPredictor();

            const importance = predictor.getFeatureImportance();
            const sum = Object.values(importance).reduce((a, b) => a + b, 0);

            expect(sum).toBeCloseTo(1, 0);
        });
    });

    // =========================================================================
    // Persistence Tests
    // =========================================================================

    describe('save and load', () => {
        it('should save model to localStorage', async () => {
            const predictor = new RetentionPredictor();

            await predictor.save();

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'retention_predictor_model',
                expect.any(String)
            );
        });

        it('should load model from localStorage', async () => {
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
                trainedCurve: [1, 0.45, 0.35],
                gameType: 'puzzle',
                metrics: { mse: 0.01 },
            }));

            const predictor = new RetentionPredictor();
            const loaded = await predictor.load();

            expect(loaded).toBe(true);
        });

        it('should return false when no saved model', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const predictor = new RetentionPredictor();
            const loaded = await predictor.load();

            expect(loaded).toBe(false);
        });

        it('should handle corrupt saved data', async () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid json');

            const predictor = new RetentionPredictor();
            const loaded = await predictor.load();

            expect(loaded).toBe(false);
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle empty observed data', () => {
            const predictor = new RetentionPredictor();
            const observed = {};

            const prediction = predictor.predictRetention(observed, 7);

            expect(prediction.value).toBeGreaterThanOrEqual(0);
            expect(prediction.value).toBeLessThanOrEqual(1);
        });

        it('should handle single data point', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.45 };

            const prediction = predictor.predictRetention(observed, 30);

            expect(prediction.value).toBeGreaterThan(0);
        });

        it('should clamp predictions to 0-1 range', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.99, 7: 0.98 };

            const prediction = predictor.predictRetention(observed, 30);

            expect(prediction.value).toBeGreaterThanOrEqual(0);
            expect(prediction.value).toBeLessThanOrEqual(1);
        });

        it('should handle very low retention', () => {
            const predictor = new RetentionPredictor();
            const observed = { 1: 0.05, 7: 0.01 };

            const prediction = predictor.predictRetention(observed, 30);

            expect(prediction.value).toBeGreaterThanOrEqual(0);
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export retentionPredictor singleton', () => {
            expect(retentionPredictor).toBeInstanceOf(RetentionPredictor);
        });

        it('should have default configuration', () => {
            expect(retentionPredictor.config).toBeDefined();
            expect(retentionPredictor.name).toBe('RetentionPredictor');
        });
    });
});
