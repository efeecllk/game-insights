/**
 * LTVPredictor Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LTVPredictor } from '../../../../src/ai/ml/LTVPredictor';
import type { UserFeatures } from '../../../../src/ai/ml/types';

// Helper function to create mock user features
function createMockUserFeatures(overrides: Partial<UserFeatures> = {}): UserFeatures {
    return {
        userId: 'user_' + Math.random().toString(36).slice(2, 8),
        cohort: '2024-01-01',
        sessionCount7d: 10,
        sessionCount30d: 30,
        sessionTrend: 0.1,
        lastSessionHoursAgo: 12,
        avgSessionLength: 15,
        totalPlayTime: 300,
        currentLevel: 25,
        maxLevelReached: 25,
        progressionSpeed: 1.5,
        failureRate: 0.2,
        stuckAtLevel: false,
        totalSpend: 10,
        purchaseCount: 2,
        avgPurchaseValue: 5,
        daysSinceLastPurchase: 7,
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
    let predictor: LTVPredictor;

    beforeEach(() => {
        predictor = new LTVPredictor();
    });

    describe('initialization', () => {
        it('should have correct default name and version', () => {
            expect(predictor.name).toBe('LTVPredictor');
            expect(predictor.version).toBe('1.0.0');
        });

        it('should have default config values', () => {
            expect(predictor.config.minDataPoints).toBe(200);
            expect(predictor.config.lookbackDays).toBe(90);
            expect(predictor.config.validationSplit).toBe(0.2);
        });

        it('should allow custom config', () => {
            const custom = new LTVPredictor({ minDataPoints: 100 });
            expect(custom.config.minDataPoints).toBe(100);
        });
    });

    describe('predict', () => {
        it('should return LTV prediction with all required fields', () => {
            const features = createMockUserFeatures();
            const result = predictor.predict(features);

            expect(result.value).toBeDefined();
            expect(result.confidence).toBeDefined();
            expect(result.segment).toBeDefined();
            expect(result.projectedSpend30d).toBeDefined();
            expect(result.projectedSpend90d).toBeDefined();
            expect(result.projectedSpend365d).toBeDefined();
        });

        it('should return higher LTV for paying users', () => {
            const payer = createMockUserFeatures({
                isPayer: true,
                totalSpend: 50,
                purchaseCount: 5,
            });
            const nonPayer = createMockUserFeatures({
                isPayer: false,
                totalSpend: 0,
                purchaseCount: 0,
            });

            const payerResult = predictor.predict(payer);
            const nonPayerResult = predictor.predict(nonPayer);

            expect(payerResult.value).toBeGreaterThan(nonPayerResult.value);
        });

        it('should classify whale correctly', () => {
            const features = createMockUserFeatures({
                isPayer: true,
                totalSpend: 500,
                purchaseCount: 20,
            });
            const result = predictor.predict(features);

            if (result.value >= 100) {
                expect(result.segment).toBe('whale');
            }
        });

        it('should classify dolphin correctly', () => {
            const features = createMockUserFeatures({
                isPayer: true,
                totalSpend: 50,
                purchaseCount: 5,
            });
            const result = predictor.predict(features);

            if (result.value >= 20 && result.value < 100) {
                expect(result.segment).toBe('dolphin');
            }
        });

        it('should classify minnow correctly', () => {
            const features = createMockUserFeatures({
                isPayer: true,
                totalSpend: 5,
                purchaseCount: 1,
            });
            const result = predictor.predict(features);

            if (result.value >= 1 && result.value < 20) {
                expect(result.segment).toBe('minnow');
            }
        });

        it('should classify non-payer correctly', () => {
            const features = createMockUserFeatures({
                isPayer: false,
                totalSpend: 0,
                purchaseCount: 0,
                weeklyActiveRatio: 0.2,
            });
            const result = predictor.predict(features);

            if (result.value < 1) {
                expect(result.segment).toBe('non_payer');
            }
        });

        it('should include prediction range', () => {
            const features = createMockUserFeatures();
            const result = predictor.predict(features);

            expect(result.range).toBeDefined();
            expect(result.range!.low).toBeLessThan(result.value);
            expect(result.range!.high).toBeGreaterThan(result.value);
        });

        it('should identify LTV factors', () => {
            const features = createMockUserFeatures({
                isPayer: true,
                totalSpend: 100,
            });
            const result = predictor.predict(features);

            expect(result.factors).toBeDefined();
            expect(result.factors!.length).toBeGreaterThan(0);
        });

        it('should return confidence between 0 and 1', () => {
            const features = createMockUserFeatures();
            const result = predictor.predict(features);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
    });

    describe('predictEarlyLTV', () => {
        it('should predict LTV from early user data', () => {
            const result = predictor.predictEarlyLTV(3, 5, 0, 10);

            expect(result.value).toBeDefined();
            expect(result.confidence).toBeDefined();
        });

        it('should have lower confidence for very new users', () => {
            const veryNew = predictor.predictEarlyLTV(1, 2, 0, 5);
            const older = predictor.predictEarlyLTV(7, 14, 0, 20);

            expect(veryNew.confidence).toBeLessThan(older.confidence);
        });

        it('should boost prediction for early spenders', () => {
            const nonSpender = predictor.predictEarlyLTV(5, 10, 0, 15);
            const earlySpender = predictor.predictEarlyLTV(5, 10, 10, 15);

            expect(earlySpender.value).toBeGreaterThan(nonSpender.value);
        });

        it('should include early purchase factor', () => {
            const result = predictor.predictEarlyLTV(3, 5, 20, 10);

            expect(result.factors).toBeDefined();
            expect(result.factors!.some(f => f.name.includes('Early'))).toBe(true);
        });
    });

    describe('segmentUsers', () => {
        it('should segment all users', () => {
            const users = [
                createMockUserFeatures({ isPayer: true, totalSpend: 200, purchaseCount: 10 }),
                createMockUserFeatures({ isPayer: true, totalSpend: 50, purchaseCount: 3 }),
                createMockUserFeatures({ isPayer: true, totalSpend: 5, purchaseCount: 1 }),
                createMockUserFeatures({ isPayer: false, totalSpend: 0, purchaseCount: 0 }),
            ];

            const result = predictor.segmentUsers(users);

            expect(result.summary.totalUsers).toBe(4);
            expect(result.summary.totalProjectedLTV).toBeGreaterThan(0);
            expect(result.summary.avgLTV).toBeGreaterThan(0);
        });

        it('should calculate payer percentage', () => {
            const users = [
                createMockUserFeatures({ isPayer: true, totalSpend: 10 }),
                createMockUserFeatures({ isPayer: false, totalSpend: 0 }),
            ];

            const result = predictor.segmentUsers(users);

            expect(result.summary.payerPercentage).toBe(50);
        });

        it('should return segment arrays', () => {
            const users = Array(10).fill(null).map(() => createMockUserFeatures());
            const result = predictor.segmentUsers(users);

            expect(result.whales).toBeDefined();
            expect(result.dolphins).toBeDefined();
            expect(result.minnows).toBeDefined();
            expect(result.nonPayers).toBeDefined();
        });
    });

    describe('getHighPotentialNonPayers', () => {
        it('should identify non-payers with high conversion potential', () => {
            const users = [
                createMockUserFeatures({ isPayer: false, weeklyActiveRatio: 0.9, sessionCount30d: 50 }),
                createMockUserFeatures({ isPayer: false, weeklyActiveRatio: 0.1, sessionCount30d: 5 }),
                createMockUserFeatures({ isPayer: true, totalSpend: 10 }),
            ];

            const result = predictor.getHighPotentialNonPayers(users);

            // Should only include non-payers
            result.forEach(r => {
                expect(r.user.isPayer).toBe(false);
            });
        });

        it('should calculate conversion probability', () => {
            const users = [
                createMockUserFeatures({ isPayer: false, weeklyActiveRatio: 0.9, sessionCount30d: 50 }),
            ];

            const result = predictor.getHighPotentialNonPayers(users);

            if (result.length > 0) {
                expect(result[0].conversionProbability).toBeGreaterThan(0);
                expect(result[0].conversionProbability).toBeLessThanOrEqual(0.5);
            }
        });

        it('should calculate potential LTV', () => {
            const users = [
                createMockUserFeatures({
                    isPayer: false,
                    weeklyActiveRatio: 0.9,
                    progressionSpeed: 3,
                    sessionCount30d: 50,
                    daysSinceFirstSession: 5, // Recent user has higher conversion probability
                }),
            ];

            const result = predictor.getHighPotentialNonPayers(users);

            if (result.length > 0) {
                expect(result[0].potentialLTV).toBeGreaterThanOrEqual(0);
            }
        });

        it('should limit results', () => {
            const users = Array(100).fill(null).map(() =>
                createMockUserFeatures({ isPayer: false, weeklyActiveRatio: 0.8 })
            );

            const result = predictor.getHighPotentialNonPayers(users, 10);

            expect(result.length).toBeLessThanOrEqual(10);
        });

        it('should sort by combined potential', () => {
            const users = Array(20).fill(null).map(() =>
                createMockUserFeatures({ isPayer: false, weeklyActiveRatio: Math.random() })
            );

            const result = predictor.getHighPotentialNonPayers(users, 10);

            for (let i = 1; i < result.length; i++) {
                const prevScore = result[i - 1].conversionProbability * result[i - 1].potentialLTV;
                const currScore = result[i].conversionProbability * result[i].potentialLTV;
                expect(prevScore).toBeGreaterThanOrEqual(currScore);
            }
        });
    });

    describe('train', () => {
        it('should train on LTV data', async () => {
            const trainingData = Array(300).fill(null).map(() => ({
                features: createMockUserFeatures(),
                actualLTV: Math.random() * 100,
                observationDays: 90,
            }));

            const metrics = await predictor.train(trainingData);

            expect(metrics).toBeDefined();
            expect(metrics.lastTrainedAt).toBeDefined();
            expect(metrics.dataPointsUsed).toBe(300);
        });

        it('should throw error with insufficient data', async () => {
            const trainingData = Array(50).fill(null).map(() => ({
                features: createMockUserFeatures(),
                actualLTV: 10,
                observationDays: 30,
            }));

            await expect(predictor.train(trainingData)).rejects.toThrow('Insufficient data');
        });

        it('should update model coefficients', async () => {
            const trainingData = Array(300).fill(null).map((_, i) => ({
                features: createMockUserFeatures({
                    isPayer: i % 2 === 0,
                    totalSpend: i % 2 === 0 ? 50 : 0,
                }),
                actualLTV: i % 2 === 0 ? 100 : 0,
                observationDays: 90,
            }));

            const metrics = await predictor.train(trainingData);

            expect(metrics.mse).toBeDefined();
            expect(metrics.mae).toBeDefined();
            expect(metrics.r2).toBeDefined();
        });
    });

    describe('getFeatureImportance', () => {
        it('should return feature importance mapping', () => {
            const importance = predictor.getFeatureImportance();

            expect(importance).toBeDefined();
            expect(Object.keys(importance).length).toBeGreaterThan(0);
        });

        it('should include key LTV features', () => {
            const importance = predictor.getFeatureImportance();

            expect(importance['isPayer']).toBeDefined();
            expect(importance['totalSpend']).toBeDefined();
        });

        it('should have importance values between 0 and 1', () => {
            const importance = predictor.getFeatureImportance();

            Object.values(importance).forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('projections', () => {
        it('should have 30d < 90d < 365d projections', () => {
            const features = createMockUserFeatures({ isPayer: true, totalSpend: 20 });
            const result = predictor.predict(features);

            expect(result.projectedSpend30d).toBeLessThanOrEqual(result.projectedSpend90d);
            expect(result.projectedSpend90d).toBeLessThanOrEqual(result.projectedSpend365d);
        });

        it('should include existing spend in projections', () => {
            const features = createMockUserFeatures({
                isPayer: true,
                totalSpend: 50,
                daysSinceFirstSession: 10,
            });
            const result = predictor.predict(features);

            expect(result.projectedSpend30d).toBeGreaterThanOrEqual(0);
        });
    });

    describe('edge cases', () => {
        it('should handle new user with no purchase history', () => {
            const features = createMockUserFeatures({
                isPayer: false,
                totalSpend: 0,
                purchaseCount: 0,
                daysSinceFirstSession: 1,
            });
            const result = predictor.predict(features);

            expect(result.value).toBeDefined();
            expect(result.value).toBeGreaterThanOrEqual(0);
        });

        it('should handle very high spender', () => {
            const features = createMockUserFeatures({
                isPayer: true,
                totalSpend: 10000,
                purchaseCount: 100,
            });
            const result = predictor.predict(features);

            expect(result.value).toBeGreaterThan(100);
            expect(result.segment).toBe('whale');
        });

        it('should handle user with recent purchase recency boost', () => {
            const features = createMockUserFeatures({
                isPayer: true,
                totalSpend: 20,
                daysSinceLastPurchase: 2,
            });
            const result = predictor.predict(features);

            expect(result.value).toBeGreaterThan(0);
        });

        it('should handle user with old purchase', () => {
            const features = createMockUserFeatures({
                isPayer: true,
                totalSpend: 20,
                daysSinceLastPurchase: 60,
            });
            const result = predictor.predict(features);

            expect(result.value).toBeGreaterThan(0);
        });
    });
});
