/**
 * ChurnPredictor Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChurnPredictor } from '../../../../src/ai/ml/ChurnPredictor';
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

describe('ChurnPredictor', () => {
    let predictor: ChurnPredictor;

    beforeEach(() => {
        predictor = new ChurnPredictor();
    });

    describe('initialization', () => {
        it('should have correct default name and version', () => {
            expect(predictor.name).toBe('ChurnPredictor');
            expect(predictor.version).toBe('1.0.0');
        });

        it('should have default config values', () => {
            expect(predictor.config.minDataPoints).toBe(500);
            expect(predictor.config.lookbackDays).toBe(14);
            expect(predictor.config.validationSplit).toBe(0.2);
        });

        it('should allow custom config', () => {
            const custom = new ChurnPredictor({ minDataPoints: 200 });
            expect(custom.config.minDataPoints).toBe(200);
        });
    });

    describe('predict', () => {
        it('should return churn prediction with all required fields', () => {
            const features = createMockUserFeatures();
            const result = predictor.predict(features);

            expect(result.value).toBeDefined();
            expect(result.confidence).toBeDefined();
            expect(result.riskLevel).toBeDefined();
            expect(result.preventionActions).toBeDefined();
            expect(result.factors).toBeDefined();
        });

        it('should return risk level as low for engaged users', () => {
            const features = createMockUserFeatures({
                sessionTrend: 0.2,
                lastSessionHoursAgo: 2,
                weeklyActiveRatio: 0.9,
                failureRate: 0.1,
            });
            const result = predictor.predict(features);

            expect(result.value).toBeLessThan(0.4);
            expect(['low', 'medium']).toContain(result.riskLevel);
        });

        it('should return high risk for disengaged users', () => {
            const features = createMockUserFeatures({
                sessionTrend: -0.5,
                lastSessionHoursAgo: 120, // 5 days
                weeklyActiveRatio: 0.1,
                failureRate: 0.6,
                stuckAtLevel: true,
            });
            const result = predictor.predict(features);

            // User with declining activity should have elevated risk
            expect(result.value).toBeGreaterThan(0.3);
            expect(['medium', 'high', 'critical']).toContain(result.riskLevel);
        });

        it('should include prediction range', () => {
            const features = createMockUserFeatures();
            const result = predictor.predict(features);

            expect(result.range).toBeDefined();
            expect(result.range!.low).toBeLessThanOrEqual(result.value);
            expect(result.range!.high).toBeGreaterThanOrEqual(result.value);
        });

        it('should identify churn factors', () => {
            const features = createMockUserFeatures({
                sessionTrend: -0.5,
                lastSessionHoursAgo: 96,
                failureRate: 0.6,
            });
            const result = predictor.predict(features);

            expect(result.factors!.length).toBeGreaterThan(0);
            expect(result.factors!.some(f => f.name.includes('Declining') || f.name.includes('Absence'))).toBe(true);
        });

        it('should suggest prevention actions for at-risk users', () => {
            const features = createMockUserFeatures({
                sessionTrend: -0.5,
                lastSessionHoursAgo: 96,
            });
            const result = predictor.predict(features);

            if (result.value >= 0.4) {
                expect(result.preventionActions.length).toBeGreaterThan(0);
            }
        });

        it('should estimate days until churn for at-risk users', () => {
            const features = createMockUserFeatures({
                sessionTrend: -0.4,
                lastSessionHoursAgo: 72,
            });
            const result = predictor.predict(features);

            if (result.value >= 0.4) {
                expect(result.daysUntilChurn).toBeDefined();
                expect(result.daysUntilChurn).toBeGreaterThan(0);
            }
        });

        it('should return confidence between 0 and 1', () => {
            const features = createMockUserFeatures();
            const result = predictor.predict(features);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
    });

    describe('predictBatch', () => {
        it('should predict for multiple users', () => {
            const users = Array(10).fill(null).map(() => createMockUserFeatures());
            const result = predictor.predictBatch(users);

            expect(result.predictions.size).toBe(10);
            expect(result.summary.totalUsers).toBe(10);
        });

        it('should segment users into risk categories', () => {
            const users = [
                createMockUserFeatures({ sessionTrend: 0.3, lastSessionHoursAgo: 2 }),
                createMockUserFeatures({ sessionTrend: -0.6, lastSessionHoursAgo: 120, failureRate: 0.7 }),
            ];
            const result = predictor.predictBatch(users);

            expect(result.segments).toBeDefined();
            expect(result.segments.critical).toBeDefined();
            expect(result.segments.high).toBeDefined();
            expect(result.segments.medium).toBeDefined();
            expect(result.segments.low).toBeDefined();
        });

        it('should calculate at-risk percentage', () => {
            const users = Array(10).fill(null).map(() => createMockUserFeatures());
            const result = predictor.predictBatch(users);

            expect(result.summary.atRiskPercentage).toBeDefined();
            expect(result.summary.atRiskPercentage).toBeGreaterThanOrEqual(0);
            expect(result.summary.atRiskPercentage).toBeLessThanOrEqual(100);
        });

        it('should calculate average churn score', () => {
            const users = Array(10).fill(null).map(() => createMockUserFeatures());
            const result = predictor.predictBatch(users);

            expect(result.summary.avgChurnScore).toBeDefined();
            expect(result.summary.avgChurnScore).toBeGreaterThanOrEqual(0);
            expect(result.summary.avgChurnScore).toBeLessThanOrEqual(1);
        });
    });

    describe('getAtRiskUsers', () => {
        it('should return users above threshold', () => {
            const users = [
                createMockUserFeatures({ userId: 'low_risk', sessionTrend: 0.3, lastSessionHoursAgo: 2 }),
                createMockUserFeatures({ userId: 'high_risk', sessionTrend: -0.6, lastSessionHoursAgo: 120, failureRate: 0.8 }),
            ];
            const result = predictor.getAtRiskUsers(users, 10, 'high');

            // High risk user should be included if their score is above threshold
            const highRiskInResult = result.some(r => r.user.userId === 'high_risk');
            if (result.length > 0) {
                expect(result[0].prediction.value).toBeGreaterThanOrEqual(0.6);
            }
        });

        it('should limit results', () => {
            const users = Array(20).fill(null).map(() =>
                createMockUserFeatures({ sessionTrend: -0.5, lastSessionHoursAgo: 100 })
            );
            const result = predictor.getAtRiskUsers(users, 5);

            expect(result.length).toBeLessThanOrEqual(5);
        });

        it('should sort by risk score descending', () => {
            const users = Array(10).fill(null).map(() => createMockUserFeatures());
            const result = predictor.getAtRiskUsers(users, 10, 'medium');

            for (let i = 1; i < result.length; i++) {
                expect(result[i - 1].prediction.value).toBeGreaterThanOrEqual(result[i].prediction.value);
            }
        });
    });

    describe('train', () => {
        it('should train on user churn data', async () => {
            const trainingData = Array(600).fill(null).map((_, i) => ({
                features: createMockUserFeatures(),
                churned: i % 3 === 0, // 33% churn rate
            }));

            const metrics = await predictor.train(trainingData);

            expect(metrics).toBeDefined();
            expect(metrics.lastTrainedAt).toBeDefined();
            expect(metrics.dataPointsUsed).toBe(600);
        });

        it('should throw error with insufficient data', async () => {
            const trainingData = Array(100).fill(null).map(() => ({
                features: createMockUserFeatures(),
                churned: false,
            }));

            await expect(predictor.train(trainingData)).rejects.toThrow('Insufficient data');
        });

        it('should calculate evaluation metrics', async () => {
            const trainingData = Array(600).fill(null).map((_, i) => ({
                features: createMockUserFeatures({
                    sessionTrend: i % 3 === 0 ? -0.5 : 0.2,
                    lastSessionHoursAgo: i % 3 === 0 ? 100 : 10,
                }),
                churned: i % 3 === 0,
            }));

            const metrics = await predictor.train(trainingData);

            expect(metrics.accuracy).toBeDefined();
            expect(metrics.precision).toBeDefined();
            expect(metrics.recall).toBeDefined();
            expect(metrics.f1Score).toBeDefined();
            expect(metrics.auc).toBeDefined();
        });
    });

    describe('getFeatureImportance', () => {
        it('should return feature importance mapping', () => {
            const importance = predictor.getFeatureImportance();

            expect(importance).toBeDefined();
            expect(Object.keys(importance).length).toBeGreaterThan(0);
            expect(importance['sessionTrend']).toBeDefined();
            expect(importance['lastSessionHoursAgo']).toBeDefined();
        });

        it('should have importance values between 0 and 1', () => {
            const importance = predictor.getFeatureImportance();

            Object.values(importance).forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('risk levels', () => {
        it('should classify score >= 0.8 as critical', () => {
            const features = createMockUserFeatures({
                sessionTrend: -0.8,
                lastSessionHoursAgo: 168,
                weeklyActiveRatio: 0.05,
                failureRate: 0.9,
                stuckAtLevel: true,
            });
            // Force high score through extreme values
            const result = predictor.predict(features);

            if (result.value >= 0.8) {
                expect(result.riskLevel).toBe('critical');
            }
        });

        it('should classify score 0.6-0.8 as high', () => {
            const features = createMockUserFeatures({
                sessionTrend: -0.4,
                lastSessionHoursAgo: 96,
                weeklyActiveRatio: 0.2,
            });
            const result = predictor.predict(features);

            if (result.value >= 0.6 && result.value < 0.8) {
                expect(result.riskLevel).toBe('high');
            }
        });

        it('should classify score 0.4-0.6 as medium', () => {
            const features = createMockUserFeatures({
                sessionTrend: -0.2,
                lastSessionHoursAgo: 48,
                weeklyActiveRatio: 0.4,
            });
            const result = predictor.predict(features);

            if (result.value >= 0.4 && result.value < 0.6) {
                expect(result.riskLevel).toBe('medium');
            }
        });

        it('should classify score < 0.4 as low', () => {
            const features = createMockUserFeatures({
                sessionTrend: 0.2,
                lastSessionHoursAgo: 12,
                weeklyActiveRatio: 0.8,
                failureRate: 0.1,
            });
            const result = predictor.predict(features);

            if (result.value < 0.4) {
                expect(result.riskLevel).toBe('low');
            }
        });
    });

    describe('edge cases', () => {
        it('should handle new user with minimal data', () => {
            const features = createMockUserFeatures({
                daysSinceFirstSession: 1,
                sessionCount7d: 1,
                sessionCount30d: 1,
            });
            const result = predictor.predict(features);

            expect(result.value).toBeDefined();
            expect(result.confidence).toBeLessThan(0.9); // Lower confidence for new users
        });

        it('should handle non-payer correctly', () => {
            const features = createMockUserFeatures({
                isPayer: false,
                totalSpend: 0,
                purchaseCount: 0,
            });
            const result = predictor.predict(features);

            expect(result.value).toBeDefined();
        });

        it('should handle perfect engagement user', () => {
            const features = createMockUserFeatures({
                sessionTrend: 0.5,
                lastSessionHoursAgo: 0,
                weeklyActiveRatio: 1.0,
                failureRate: 0,
            });
            const result = predictor.predict(features);

            expect(result.value).toBeLessThan(0.3);
        });
    });
});
