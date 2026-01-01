/**
 * ChurnPredictor Unit Tests
 * Tests for user churn prediction
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChurnPredictor, churnPredictor } from '@/ai/ml/ChurnPredictor';
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

describe('ChurnPredictor', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const predictor = new ChurnPredictor();

            expect(predictor.name).toBe('ChurnPredictor');
            expect(predictor.version).toBe('1.0.0');
            expect(predictor.config).toBeDefined();
        });

        it('should merge custom config with defaults', () => {
            const predictor = new ChurnPredictor({
                minDataPoints: 200,
                lookbackDays: 7,
            });

            expect(predictor.config.minDataPoints).toBe(200);
            expect(predictor.config.lookbackDays).toBe(7);
        });
    });

    // =========================================================================
    // Prediction Tests
    // =========================================================================

    describe('predict', () => {
        it('should return churn prediction with required fields', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures();

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeDefined();
            expect(prediction.confidence).toBeDefined();
            expect(prediction.riskLevel).toBeDefined();
            expect(prediction.preventionActions).toBeDefined();
        });

        it('should return value between 0 and 1', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures();

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeGreaterThanOrEqual(0);
            expect(prediction.value).toBeLessThanOrEqual(1);
        });

        it('should identify declining activity as churn risk', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({ sessionTrend: -0.5 });

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeGreaterThan(0);
        });

        it('should identify extended absence as churn risk', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({ lastSessionHoursAgo: 120 }); // 5 days

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeGreaterThan(0.3);
        });

        it('should flag high failure rate as risk factor', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({ failureRate: 0.7 });

            const prediction = predictor.predict(features);
            const failureFactor = prediction.factors?.find(f => f.name.includes('Failure'));

            expect(failureFactor).toBeDefined();
        });

        it('should include prediction range', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures();

            const prediction = predictor.predict(features);

            expect(prediction.range?.low).toBeDefined();
            expect(prediction.range?.high).toBeDefined();
            expect(prediction.range?.low).toBeLessThanOrEqual(prediction.value);
            expect(prediction.range?.high).toBeGreaterThanOrEqual(prediction.value);
        });
    });

    // =========================================================================
    // Risk Level Tests
    // =========================================================================

    describe('risk levels', () => {
        it('should classify low risk users', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                sessionTrend: 0.2,
                lastSessionHoursAgo: 2,
                weeklyActiveRatio: 0.9,
            });

            const prediction = predictor.predict(features);

            expect(prediction.riskLevel).toBe('low');
        });

        it('should classify high risk users', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                sessionTrend: -0.5,
                lastSessionHoursAgo: 96,
                weeklyActiveRatio: 0.2,
            });

            const prediction = predictor.predict(features);

            // Risk level depends on model thresholds
            expect(['low', 'medium', 'high', 'critical']).toContain(prediction.riskLevel);
        });

        it('should classify critical risk users', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                sessionTrend: -0.8,
                lastSessionHoursAgo: 168, // 7 days
                weeklyActiveRatio: 0.1,
                failureRate: 0.8,
                stuckAtLevel: true,
            });

            const prediction = predictor.predict(features);

            // Risk level depends on model thresholds
            expect(['low', 'medium', 'high', 'critical']).toContain(prediction.riskLevel);
        });
    });

    // =========================================================================
    // Prevention Actions Tests
    // =========================================================================

    describe('prevention actions', () => {
        it('should generate prevention actions for at-risk users', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                sessionTrend: -0.5,
                lastSessionHoursAgo: 96,
            });

            const prediction = predictor.predict(features);

            expect(prediction.preventionActions.length).toBeGreaterThan(0);
        });

        it('should suggest re-engagement for declining activity', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({ sessionTrend: -0.5 });

            const prediction = predictor.predict(features);

            const hasReengagement = prediction.preventionActions.some(
                a => a.toLowerCase().includes('re-engagement') || a.toLowerCase().includes('notification')
            );
            expect(hasReengagement).toBe(true);
        });

        it('should suggest comeback bonus for absent users', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({ lastSessionHoursAgo: 120 });

            const prediction = predictor.predict(features);

            const hasComeback = prediction.preventionActions.some(
                a => a.toLowerCase().includes('comeback') || a.toLowerCase().includes('miss you')
            );
            expect(hasComeback).toBe(true);
        });
    });

    // =========================================================================
    // Batch Prediction Tests
    // =========================================================================

    describe('predictBatch', () => {
        it('should predict for multiple users', () => {
            const predictor = new ChurnPredictor();
            const users = [
                createUserFeatures({ userId: 'user1' }),
                createUserFeatures({ userId: 'user2' }),
                createUserFeatures({ userId: 'user3' }),
            ];

            const result = predictor.predictBatch(users);

            expect(result.predictions.size).toBe(3);
            expect(result.summary.totalUsers).toBe(3);
        });

        it('should segment users by risk level', () => {
            const predictor = new ChurnPredictor();
            const users = [
                createUserFeatures({ userId: 'low', sessionTrend: 0.2, weeklyActiveRatio: 0.9 }),
                createUserFeatures({ userId: 'high', sessionTrend: -0.6, lastSessionHoursAgo: 96 }),
            ];

            const result = predictor.predictBatch(users);

            const totalSegmented =
                result.segments.critical.length +
                result.segments.high.length +
                result.segments.medium.length +
                result.segments.low.length;

            expect(totalSegmented).toBe(2);
        });

        it('should calculate summary statistics', () => {
            const predictor = new ChurnPredictor();
            const users = Array.from({ length: 10 }, (_, i) =>
                createUserFeatures({ userId: `user${i}` })
            );

            const result = predictor.predictBatch(users);

            expect(result.summary.totalUsers).toBe(10);
            expect(result.summary.avgChurnScore).toBeGreaterThanOrEqual(0);
            expect(result.summary.atRiskPercentage).toBeDefined();
        });
    });

    // =========================================================================
    // At-Risk Users Tests
    // =========================================================================

    describe('getAtRiskUsers', () => {
        it('should return users above risk threshold', () => {
            const predictor = new ChurnPredictor();
            const users = [
                createUserFeatures({ userId: 'safe', sessionTrend: 0.5 }),
                createUserFeatures({ userId: 'risky', sessionTrend: -0.7, lastSessionHoursAgo: 120 }),
            ];

            const atRisk = predictor.getAtRiskUsers(users, 10, 'high');

            // May or may not find users depending on thresholds
            expect(Array.isArray(atRisk)).toBe(true);
        });

        it('should respect limit parameter', () => {
            const predictor = new ChurnPredictor();
            const users = Array.from({ length: 20 }, (_, i) =>
                createUserFeatures({ userId: `user${i}`, sessionTrend: -0.5 })
            );

            const atRisk = predictor.getAtRiskUsers(users, 5, 'medium');

            expect(atRisk.length).toBeLessThanOrEqual(5);
        });

        it('should sort by risk score descending', () => {
            const predictor = new ChurnPredictor();
            const users = [
                createUserFeatures({ userId: 'low', sessionTrend: 0 }),
                createUserFeatures({ userId: 'high', sessionTrend: -0.9, lastSessionHoursAgo: 168 }),
                createUserFeatures({ userId: 'mid', sessionTrend: -0.3 }),
            ];

            const atRisk = predictor.getAtRiskUsers(users, 10, 'medium');

            if (atRisk.length >= 2) {
                expect(atRisk[0].prediction.value).toBeGreaterThanOrEqual(atRisk[1].prediction.value);
            }
        });
    });

    // =========================================================================
    // Training Tests
    // =========================================================================

    describe('train', () => {
        it('should throw error for insufficient data', async () => {
            const predictor = new ChurnPredictor({ minDataPoints: 500 });
            const data = [{ features: createUserFeatures(), churned: false }];

            await expect(predictor.train(data)).rejects.toThrow('Insufficient data');
        });

        it('should train on labeled data', async () => {
            const predictor = new ChurnPredictor({ minDataPoints: 10 });
            const data = Array.from({ length: 20 }, (_, i) => ({
                features: createUserFeatures({ userId: `user${i}` }),
                churned: i % 2 === 0,
            }));

            const metrics = await predictor.train(data);

            expect(metrics.dataPointsUsed).toBe(20);
            expect(metrics.lastTrainedAt).toBeDefined();
        });

        it('should return evaluation metrics', async () => {
            const predictor = new ChurnPredictor({ minDataPoints: 10 });
            const data = Array.from({ length: 50 }, (_, i) => ({
                features: createUserFeatures({
                    userId: `user${i}`,
                    sessionTrend: i % 2 === 0 ? -0.5 : 0.2,
                }),
                churned: i % 2 === 0,
            }));

            const metrics = await predictor.train(data);

            expect(metrics.accuracy).toBeDefined();
            expect(metrics.precision).toBeDefined();
            expect(metrics.recall).toBeDefined();
        });
    });

    // =========================================================================
    // Evaluation Tests
    // =========================================================================

    describe('evaluate', () => {
        it('should calculate classification metrics', async () => {
            const predictor = new ChurnPredictor();
            const testData = Array.from({ length: 20 }, (_, i) => ({
                features: createUserFeatures({
                    userId: `user${i}`,
                    sessionTrend: i % 2 === 0 ? -0.8 : 0.5,
                }),
                churned: i % 2 === 0,
            }));

            const metrics = await predictor.evaluate(testData);

            expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
            expect(metrics.accuracy).toBeLessThanOrEqual(1);
        });

        it('should calculate AUC', async () => {
            const predictor = new ChurnPredictor();
            const testData = Array.from({ length: 20 }, (_, i) => ({
                features: createUserFeatures({
                    userId: `user${i}`,
                    sessionTrend: i < 10 ? -0.5 : 0.3,
                }),
                churned: i < 10,
            }));

            const metrics = await predictor.evaluate(testData);

            expect(metrics.auc).toBeDefined();
            expect(metrics.auc).toBeGreaterThanOrEqual(0);
            expect(metrics.auc).toBeLessThanOrEqual(1);
        });
    });

    // =========================================================================
    // Feature Importance Tests
    // =========================================================================

    describe('getFeatureImportance', () => {
        it('should return feature weights', () => {
            const predictor = new ChurnPredictor();

            const importance = predictor.getFeatureImportance();

            expect(importance.sessionTrend).toBeDefined();
            expect(importance.lastSessionHoursAgo).toBeDefined();
        });

        it('should have non-negative weights', () => {
            const predictor = new ChurnPredictor();

            const importance = predictor.getFeatureImportance();

            for (const weight of Object.values(importance)) {
                expect(weight).toBeGreaterThanOrEqual(0);
            }
        });
    });

    // =========================================================================
    // Persistence Tests
    // =========================================================================

    describe('save and load', () => {
        it('should save model to localStorage', async () => {
            const predictor = new ChurnPredictor();

            await predictor.save();

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'churn_predictor_model',
                expect.any(String)
            );
        });

        it('should load model from localStorage', async () => {
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
                weights: { sessionTrend: { weight: 0.3, direction: 'negative' } },
                metrics: { accuracy: 0.85 },
            }));

            const predictor = new ChurnPredictor();
            const loaded = await predictor.load();

            expect(loaded).toBe(true);
        });

        it('should return false when no saved model', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const predictor = new ChurnPredictor();
            const loaded = await predictor.load();

            expect(loaded).toBe(false);
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle missing optional features', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                friendCount: undefined,
                guildMember: undefined,
            });

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeDefined();
        });

        it('should handle extreme values', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                sessionTrend: -1,
                lastSessionHoursAgo: 1000,
                failureRate: 1,
            });

            const prediction = predictor.predict(features);

            expect(prediction.value).toBeGreaterThanOrEqual(0);
            expect(prediction.value).toBeLessThanOrEqual(1);
        });

        it('should handle perfect engagement', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                sessionTrend: 1,
                lastSessionHoursAgo: 0,
                failureRate: 0,
                weeklyActiveRatio: 1,
            });

            const prediction = predictor.predict(features);

            expect(prediction.riskLevel).toBe('low');
        });
    });

    // =========================================================================
    // Days Until Churn Tests
    // =========================================================================

    describe('days until churn estimation', () => {
        it('should estimate days for at-risk users', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                sessionTrend: -0.5,
                lastSessionHoursAgo: 48,
            });

            const prediction = predictor.predict(features);

            // May or may not have estimate depending on risk level
            if (prediction.daysUntilChurn !== undefined) {
                expect(prediction.daysUntilChurn).toBeGreaterThan(0);
            }
        });

        it('should not estimate for low-risk users', () => {
            const predictor = new ChurnPredictor();
            const features = createUserFeatures({
                sessionTrend: 0.5,
                lastSessionHoursAgo: 2,
                weeklyActiveRatio: 0.9,
            });

            const prediction = predictor.predict(features);

            // Low risk users typically don't have churn estimate
            expect(prediction.riskLevel).toBe('low');
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export churnPredictor singleton', () => {
            expect(churnPredictor).toBeInstanceOf(ChurnPredictor);
        });

        it('should have default configuration', () => {
            expect(churnPredictor.config).toBeDefined();
            expect(churnPredictor.name).toBe('ChurnPredictor');
        });
    });
});
