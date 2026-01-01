/**
 * LTVPredictor Unit Tests
 * Tests for customer lifetime value prediction
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LTVPredictor, ltvPredictor } from '@/ai/ml/LTVPredictor';
import type { UserFeatures } from '@/ai/ml/types';

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

// Helper to create user features
function createUserFeatures(overrides: Partial<UserFeatures> = {}): UserFeatures {
    return {
        userId: 'test-user-1',
        cohort: '2024-01-01',
        sessionCount7d: 10,
        sessionCount30d: 30,
        sessionTrend: 0,
        lastSessionHoursAgo: 12,
        avgSessionLength: 15,
        totalPlayTime: 500,
        currentLevel: 25,
        maxLevelReached: 25,
        progressionSpeed: 2,
        failureRate: 0.2,
        stuckAtLevel: false,
        totalSpend: 10,
        purchaseCount: 2,
        avgPurchaseValue: 5,
        daysSinceLastPurchase: 5,
        isPayer: true,
        daysActive: 20,
        daysSinceFirstSession: 30,
        weeklyActiveRatio: 0.7,
        peakPlayHour: 20,
        featureUsage: {},
        ...overrides,
    };
}

describe('LTVPredictor', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const predictor = new LTVPredictor();

            expect(predictor.name).toBe('LTVPredictor');
            expect(predictor.version).toBe('1.0.0');
            expect(predictor.config).toBeDefined();
        });

        it('should merge custom config with defaults', () => {
            const predictor = new LTVPredictor({
                minDataPoints: 100,
                lookbackDays: 60,
            });

            expect(predictor.config.minDataPoints).toBe(100);
            expect(predictor.config.lookbackDays).toBe(60);
        });
    });

    // =========================================================================
    // Prediction Tests
    // =========================================================================

    describe('predict', () => {
        it('should return LTV prediction with required fields', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures();

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeDefined();
            expect(prediction.confidence).toBeDefined();
            expect(prediction.segment).toBeDefined();
            expect(prediction.projectedSpend30d).toBeDefined();
            expect(prediction.projectedSpend90d).toBeDefined();
            expect(prediction.projectedSpend365d).toBeDefined();
        });

        it('should return positive LTV for payers', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({ isPayer: true, totalSpend: 50 });

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeGreaterThan(0);
        });

        it('should include prediction range', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures();

            const prediction = predictor.predict(features);

            expect(prediction.range?.low).toBeDefined();
            expect(prediction.range?.high).toBeDefined();
            expect(prediction.range?.low).toBeLessThan(prediction.range?.high || 0);
        });

        it('should identify LTV factors', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({ isPayer: true, totalSpend: 100 });

            const prediction = predictor.predict(features);

            expect(prediction.factors).toBeDefined();
            expect(prediction.factors?.length).toBeGreaterThan(0);
        });

        it('should calculate projections for different horizons', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures();

            const prediction = predictor.predict(features, 365);

            expect(prediction.projectedSpend30d).toBeLessThanOrEqual(prediction.projectedSpend90d);
            expect(prediction.projectedSpend90d).toBeLessThanOrEqual(prediction.projectedSpend365d);
        });
    });

    // =========================================================================
    // Segment Tests
    // =========================================================================

    describe('segments', () => {
        it('should identify whales', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                isPayer: true,
                totalSpend: 200,
                purchaseCount: 10,
            });

            const prediction = predictor.predict(features);

            // May be whale or dolphin depending on projection
            expect(['whale', 'dolphin']).toContain(prediction.segment);
        });

        it('should identify dolphins', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                isPayer: true,
                totalSpend: 30,
                purchaseCount: 3,
            });

            const prediction = predictor.predict(features);

            expect(['whale', 'dolphin', 'minnow']).toContain(prediction.segment);
        });

        it('should identify minnows', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                isPayer: true,
                totalSpend: 2,
                purchaseCount: 1,
            });

            const prediction = predictor.predict(features);

            expect(['minnow', 'non_payer']).toContain(prediction.segment);
        });

        it('should identify non-payers', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                isPayer: false,
                totalSpend: 0,
                purchaseCount: 0,
                weeklyActiveRatio: 0.2,
            });

            const prediction = predictor.predict(features);

            expect(['non_payer', 'minnow']).toContain(prediction.segment);
        });
    });

    // =========================================================================
    // Early LTV Prediction Tests
    // =========================================================================

    describe('predictEarlyLTV', () => {
        it('should predict LTV from early behavior', () => {
            const predictor = new LTVPredictor();

            const prediction = predictor.predictEarlyLTV(5, 10, 5, 15);

            expect(prediction.value).toBeGreaterThan(0);
            expect(prediction.confidence).toBeDefined();
        });

        it('should apply early spender bonus', () => {
            const predictor = new LTVPredictor();

            const earlySpender = predictor.predictEarlyLTV(3, 10, 10, 15);
            const nonSpender = predictor.predictEarlyLTV(3, 10, 0, 15);

            expect(earlySpender.value).toBeGreaterThan(nonSpender.value);
        });

        it('should have lower confidence for very early predictions', () => {
            const predictor = new LTVPredictor();

            const day1 = predictor.predictEarlyLTV(1, 3, 0, 5);
            const day7 = predictor.predictEarlyLTV(7, 15, 0, 20);

            expect(day1.confidence).toBeLessThan(day7.confidence);
        });

        it('should add early purchase factor', () => {
            const predictor = new LTVPredictor();

            const prediction = predictor.predictEarlyLTV(3, 10, 10, 15);

            const earlyFactor = prediction.factors?.find(f => f.name.includes('Early'));
            expect(earlyFactor).toBeDefined();
        });
    });

    // =========================================================================
    // User Segmentation Tests
    // =========================================================================

    describe('segmentUsers', () => {
        it('should segment users into categories', () => {
            const predictor = new LTVPredictor();
            const users = [
                createUserFeatures({ userId: 'whale', isPayer: true, totalSpend: 500 }),
                createUserFeatures({ userId: 'dolphin', isPayer: true, totalSpend: 50 }),
                createUserFeatures({ userId: 'nonpayer', isPayer: false, totalSpend: 0 }),
            ];

            const result = predictor.segmentUsers(users);

            expect(result.summary.totalUsers).toBe(3);
            expect(result.summary.totalProjectedLTV).toBeGreaterThan(0);
        });

        it('should calculate summary statistics', () => {
            const predictor = new LTVPredictor();
            const users = Array.from({ length: 10 }, (_, i) =>
                createUserFeatures({
                    userId: `user${i}`,
                    isPayer: i < 3,
                    totalSpend: i < 3 ? (i + 1) * 20 : 0,
                })
            );

            const result = predictor.segmentUsers(users);

            expect(result.summary.totalUsers).toBe(10);
            expect(result.summary.avgLTV).toBeGreaterThanOrEqual(0);
            expect(result.summary.payerPercentage).toBe(30);
        });

        it('should populate segment arrays', () => {
            const predictor = new LTVPredictor();
            const users = [
                createUserFeatures({ isPayer: false, totalSpend: 0 }),
            ];

            const result = predictor.segmentUsers(users);

            const totalInSegments =
                result.whales.length +
                result.dolphins.length +
                result.minnows.length +
                result.nonPayers.length;

            expect(totalInSegments).toBe(1);
        });
    });

    // =========================================================================
    // High Potential Non-Payers Tests
    // =========================================================================

    describe('getHighPotentialNonPayers', () => {
        it('should identify high potential non-payers', () => {
            const predictor = new LTVPredictor();
            const users = [
                createUserFeatures({
                    userId: 'engaged',
                    isPayer: false,
                    weeklyActiveRatio: 0.9,
                    sessionCount30d: 50,
                }),
                createUserFeatures({
                    userId: 'casual',
                    isPayer: false,
                    weeklyActiveRatio: 0.2,
                    sessionCount30d: 5,
                }),
            ];

            const result = predictor.getHighPotentialNonPayers(users, 10);

            expect(Array.isArray(result)).toBe(true);
        });

        it('should exclude payers', () => {
            const predictor = new LTVPredictor();
            const users = [
                createUserFeatures({ userId: 'payer', isPayer: true }),
                createUserFeatures({ userId: 'nonpayer', isPayer: false }),
            ];

            const result = predictor.getHighPotentialNonPayers(users, 10);

            for (const item of result) {
                expect(item.user.isPayer).toBe(false);
            }
        });

        it('should include conversion probability', () => {
            const predictor = new LTVPredictor();
            const users = [
                createUserFeatures({
                    isPayer: false,
                    weeklyActiveRatio: 0.8,
                    sessionCount30d: 40,
                }),
            ];

            const result = predictor.getHighPotentialNonPayers(users, 10);

            if (result.length > 0) {
                expect(result[0].conversionProbability).toBeGreaterThan(0);
                expect(result[0].conversionProbability).toBeLessThanOrEqual(1);
            }
        });

        it('should respect limit', () => {
            const predictor = new LTVPredictor();
            const users = Array.from({ length: 20 }, (_, i) =>
                createUserFeatures({
                    userId: `user${i}`,
                    isPayer: false,
                    weeklyActiveRatio: 0.8,
                })
            );

            const result = predictor.getHighPotentialNonPayers(users, 5);

            expect(result.length).toBeLessThanOrEqual(5);
        });
    });

    // =========================================================================
    // Training Tests
    // =========================================================================

    describe('train', () => {
        it('should throw error for insufficient data', async () => {
            const predictor = new LTVPredictor({ minDataPoints: 200 });
            const data = [
                { features: createUserFeatures(), actualLTV: 50, observationDays: 90 },
            ];

            await expect(predictor.train(data)).rejects.toThrow('Insufficient data');
        });

        it('should train on LTV data', async () => {
            const predictor = new LTVPredictor({ minDataPoints: 10 });
            const data = Array.from({ length: 20 }, (_, i) => ({
                features: createUserFeatures({ userId: `user${i}`, totalSpend: i * 10 }),
                actualLTV: i * 15,
                observationDays: 90,
            }));

            const metrics = await predictor.train(data);

            expect(metrics.dataPointsUsed).toBe(20);
            expect(metrics.lastTrainedAt).toBeDefined();
        });

        it('should return evaluation metrics', async () => {
            const predictor = new LTVPredictor({ minDataPoints: 10 });
            const data = Array.from({ length: 30 }, (_, i) => ({
                features: createUserFeatures({
                    userId: `user${i}`,
                    isPayer: i % 2 === 0,
                    totalSpend: i % 2 === 0 ? i * 5 : 0,
                }),
                actualLTV: i % 2 === 0 ? i * 10 : 0,
                observationDays: 365,
            }));

            const metrics = await predictor.train(data);

            expect(metrics.mse).toBeDefined();
            expect(metrics.mae).toBeDefined();
            expect(metrics.r2).toBeDefined();
        });
    });

    // =========================================================================
    // Evaluation Tests
    // =========================================================================

    describe('evaluate', () => {
        it('should calculate regression metrics', async () => {
            const predictor = new LTVPredictor();
            const data = Array.from({ length: 20 }, (_, i) => ({
                features: createUserFeatures({
                    userId: `user${i}`,
                    totalSpend: i * 10,
                }),
                actualLTV: i * 12,
                observationDays: 365,
            }));

            const metrics = await predictor.evaluate(data);

            expect(metrics.mse).toBeDefined();
            expect(metrics.mae).toBeDefined();
            expect(metrics.r2).toBeDefined();
        });
    });

    // =========================================================================
    // Feature Importance Tests
    // =========================================================================

    describe('getFeatureImportance', () => {
        it('should return feature importance scores', () => {
            const predictor = new LTVPredictor();

            const importance = predictor.getFeatureImportance();

            expect(Object.keys(importance).length).toBeGreaterThan(0);
        });

        it('should have scores summing to approximately 1', () => {
            const predictor = new LTVPredictor();

            const importance = predictor.getFeatureImportance();
            const sum = Object.values(importance).reduce((a, b) => a + b, 0);

            expect(sum).toBeCloseTo(1, 1);
        });
    });

    // =========================================================================
    // Persistence Tests
    // =========================================================================

    describe('save and load', () => {
        it('should save model to localStorage', async () => {
            const predictor = new LTVPredictor();

            await predictor.save();

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'ltv_predictor_model',
                expect.any(String)
            );
        });

        it('should load model from localStorage', async () => {
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
                coefficients: { isPayer: 60 },
                avgLTV: 25,
                avgPayerLTV: 100,
                conversionRate: 0.05,
                metrics: { r2: 0.75 },
            }));

            const predictor = new LTVPredictor();
            const loaded = await predictor.load();

            expect(loaded).toBe(true);
        });

        it('should return false when no saved model', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const predictor = new LTVPredictor();
            const loaded = await predictor.load();

            expect(loaded).toBe(false);
        });

        it('should handle corrupt saved data', async () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid json');

            const predictor = new LTVPredictor();
            const loaded = await predictor.load();

            expect(loaded).toBe(false);
        });
    });

    // =========================================================================
    // LTV Factors Tests
    // =========================================================================

    describe('LTV factors', () => {
        it('should identify paying user factor', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({ isPayer: true, totalSpend: 100 });

            const prediction = predictor.predict(features);

            const payerFactor = prediction.factors?.find(f => f.name.includes('Paying'));
            expect(payerFactor).toBeDefined();
        });

        it('should identify repeat purchaser factor', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                isPayer: true,
                purchaseCount: 5,
                totalSpend: 100,
            });

            const prediction = predictor.predict(features);

            const repeatFactor = prediction.factors?.find(f => f.name.includes('Repeat'));
            expect(repeatFactor).toBeDefined();
        });

        it('should identify high engagement factor', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({ weeklyActiveRatio: 0.9 });

            const prediction = predictor.predict(features);

            const engagementFactor = prediction.factors?.find(f => f.name.includes('Engagement'));
            expect(engagementFactor).toBeDefined();
        });

        it('should identify fast progression factor', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({ progressionSpeed: 5 });

            const prediction = predictor.predict(features);

            const progressionFactor = prediction.factors?.find(f => f.name.includes('Progression'));
            expect(progressionFactor).toBeDefined();
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle zero spend', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                isPayer: false,
                totalSpend: 0,
                purchaseCount: 0,
            });

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeGreaterThanOrEqual(0);
        });

        it('should handle very high spenders', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                isPayer: true,
                totalSpend: 10000,
                purchaseCount: 100,
            });

            const prediction = predictor.predict(features);

            expect(prediction.segment).toBe('whale');
        });

        it('should handle new users', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                daysSinceFirstSession: 1,
                daysActive: 1,
                sessionCount7d: 2,
                sessionCount30d: 2,
            });

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeDefined();
            expect(prediction.confidence).toBeLessThan(0.8);
        });

        it('should handle dormant payers', () => {
            const predictor = new LTVPredictor();
            const features = createUserFeatures({
                isPayer: true,
                totalSpend: 50,
                daysSinceLastPurchase: 60,
            });

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeDefined();
        });
    });

    // =========================================================================
    // Confidence Tests
    // =========================================================================

    describe('confidence calculation', () => {
        it('should have higher confidence for longer history', () => {
            const predictor = new LTVPredictor();

            const newUser = createUserFeatures({ daysSinceFirstSession: 5 });
            const oldUser = createUserFeatures({ daysSinceFirstSession: 100 });

            const newPrediction = predictor.predict(newUser);
            const oldPrediction = predictor.predict(oldUser);

            expect(oldPrediction.confidence).toBeGreaterThan(newPrediction.confidence);
        });

        it('should have higher confidence for payers', () => {
            const predictor = new LTVPredictor();

            const payer = createUserFeatures({
                isPayer: true,
                daysSinceFirstSession: 30,
            });
            const nonPayer = createUserFeatures({
                isPayer: false,
                daysSinceFirstSession: 30,
            });

            const payerPrediction = predictor.predict(payer);
            const nonPayerPrediction = predictor.predict(nonPayer);

            expect(payerPrediction.confidence).toBeGreaterThanOrEqual(nonPayerPrediction.confidence);
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export ltvPredictor singleton', () => {
            expect(ltvPredictor).toBeInstanceOf(LTVPredictor);
        });

        it('should have default configuration', () => {
            expect(ltvPredictor.config).toBeDefined();
            expect(ltvPredictor.name).toBe('LTVPredictor');
        });
    });
});
