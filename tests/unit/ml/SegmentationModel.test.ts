/**
 * SegmentationModel Unit Tests
 * Tests for user segmentation and clustering
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SegmentationModel, segmentationModel } from '@/ai/ml/SegmentationModel';
import type { UserFeatures, PredefinedSegment } from '@/ai/ml/types';

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

describe('SegmentationModel', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const model = new SegmentationModel();

            expect(model.name).toBe('SegmentationModel');
            expect(model.version).toBe('1.0.0');
            expect(model.config).toBeDefined();
        });

        it('should merge custom config with defaults', () => {
            const model = new SegmentationModel({
                minDataPoints: 50,
                hyperparameters: { numClusters: 8 },
            });

            expect(model.config.minDataPoints).toBe(50);
            expect(model.config.hyperparameters?.numClusters).toBe(8);
        });
    });

    // =========================================================================
    // Predefined Segment Assignment Tests
    // =========================================================================

    describe('assignPredefinedSegments', () => {
        it('should identify whale users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({ totalSpend: 150 });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('whale');
        });

        it('should identify dolphin users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                totalSpend: 50,
                purchaseCount: 3,
            });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('dolphin');
        });

        it('should identify minnow users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({ totalSpend: 5 });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('minnow');
        });

        it('should identify non-payers', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({ isPayer: false, totalSpend: 0 });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('non_payer');
        });

        it('should identify highly engaged users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                weeklyActiveRatio: 0.9,
                sessionCount7d: 20,
            });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('highly_engaged');
        });

        it('should identify casual users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                weeklyActiveRatio: 0.2,
                avgSessionLength: 5,
            });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('casual');
        });

        it('should identify at-risk users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                sessionTrend: -0.5,
                lastSessionHoursAgo: 72,
            });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('at_risk');
        });

        it('should identify churned users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                lastSessionHoursAgo: 200, // More than 7 days
            });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('churned');
        });

        it('should identify new users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                daysSinceFirstSession: 3,
            });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('new_user');
        });

        it('should identify veterans', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                daysActive: 60,
                weeklyActiveRatio: 0.6,
            });

            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('veteran');
        });

        it('should assign multiple segments when criteria match', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                totalSpend: 200,
                weeklyActiveRatio: 0.9,
                sessionCount7d: 25,
                daysActive: 60,
            });

            const segments = model.assignPredefinedSegments(features);

            expect(segments.length).toBeGreaterThan(1);
        });
    });

    // =========================================================================
    // Primary Segment Tests
    // =========================================================================

    describe('getPrimarySegment', () => {
        it('should return highest priority segment', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({ totalSpend: 150 });

            const primary = model.getPrimarySegment(features);

            expect(primary).toBe('whale');
        });

        it('should return default for unmatched users', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                totalSpend: 0,
                isPayer: false,
                weeklyActiveRatio: 0.4, // Above casual threshold
                sessionTrend: 0, // Not declining
                lastSessionHoursAgo: 24, // Not at-risk
                daysSinceFirstSession: 10, // Not new
                daysActive: 10, // Not veteran
                sessionCount7d: 8, // Not highly engaged
                avgSessionLength: 12, // Not casual session length
            });

            const primary = model.getPrimarySegment(features);

            // Should fall back to a default segment
            expect(primary).toBeDefined();
        });
    });

    // =========================================================================
    // Segment Users Tests
    // =========================================================================

    describe('segmentUsers', () => {
        it('should segment all users', () => {
            const model = new SegmentationModel();
            const users = [
                createUserFeatures({ userId: 'whale', totalSpend: 200 }),
                createUserFeatures({ userId: 'dolphin', totalSpend: 50, purchaseCount: 3 }),
                createUserFeatures({ userId: 'nonpayer', isPayer: false, totalSpend: 0 }),
            ];

            const result = model.segmentUsers(users);

            expect(result.segments.size).toBeGreaterThan(0);
        });

        it('should calculate distribution', () => {
            const model = new SegmentationModel();
            const users = [
                createUserFeatures({ userId: '1', totalSpend: 200 }),
                createUserFeatures({ userId: '2', totalSpend: 200 }),
                createUserFeatures({ userId: '3', isPayer: false, totalSpend: 0 }),
            ];

            const result = model.segmentUsers(users);

            const totalDistribution = Object.values(result.distribution).reduce((a, b) => a + b, 0);
            expect(totalDistribution).toBe(3);
        });

        it('should build summary with statistics', () => {
            const model = new SegmentationModel();
            const users = Array.from({ length: 10 }, (_, i) =>
                createUserFeatures({ userId: `user${i}`, totalSpend: i * 20 })
            );

            const result = model.segmentUsers(users);

            expect(result.summary.length).toBeGreaterThan(0);
            for (const segment of result.summary) {
                expect(segment.userCount).toBeGreaterThanOrEqual(0);
                expect(segment.percentage).toBeDefined();
                expect(segment.characteristics).toBeDefined();
            }
        });

        it('should include segment characteristics', () => {
            const model = new SegmentationModel();
            const users = [
                createUserFeatures({ userId: '1', totalSpend: 200, sessionCount7d: 20 }),
                createUserFeatures({ userId: '2', totalSpend: 150, sessionCount7d: 15 }),
            ];

            const result = model.segmentUsers(users);
            const whaleSegment = result.summary.find(s => s.id === 'whale');

            if (whaleSegment) {
                expect(whaleSegment.characteristics).toBeDefined();
            }
        });
    });

    // =========================================================================
    // Auto Clustering Tests
    // =========================================================================

    describe('autoCluster', () => {
        it('should cluster users into specified number of clusters', () => {
            const model = new SegmentationModel();
            const users = Array.from({ length: 20 }, (_, i) =>
                createUserFeatures({
                    userId: `user${i}`,
                    totalSpend: Math.random() * 100,
                    weeklyActiveRatio: Math.random(),
                })
            );

            const result = model.autoCluster(users, 3);

            expect(result.clusters.size).toBe(3);
            expect(result.labels.size).toBe(20);
        });

        it('should return cluster centers', () => {
            const model = new SegmentationModel();
            const users = Array.from({ length: 20 }, (_, i) =>
                createUserFeatures({ userId: `user${i}` })
            );

            const result = model.autoCluster(users, 3);

            expect(result.centers.length).toBe(3);
            for (const center of result.centers) {
                expect(center.features).toBeDefined();
                expect(center.userCount).toBeGreaterThanOrEqual(0);
            }
        });

        it('should assign each user to a cluster', () => {
            const model = new SegmentationModel();
            const users = Array.from({ length: 10 }, (_, i) =>
                createUserFeatures({ userId: `user${i}` })
            );

            const result = model.autoCluster(users, 3);

            for (const user of users) {
                expect(result.labels.has(user.userId)).toBe(true);
            }
        });

        it('should use default number of clusters', () => {
            const model = new SegmentationModel({
                hyperparameters: { numClusters: 4 },
            });
            const users = Array.from({ length: 15 }, (_, i) =>
                createUserFeatures({ userId: `user${i}` })
            );

            const result = model.autoCluster(users);

            expect(result.clusters.size).toBe(4);
        });
    });

    // =========================================================================
    // Targeting Recommendations Tests
    // =========================================================================

    describe('getTargetingRecommendations', () => {
        it('should return recommendations for key segments', () => {
            const model = new SegmentationModel();

            const recommendations = model.getTargetingRecommendations();

            expect(recommendations.length).toBeGreaterThan(0);
        });

        it('should include action and expected impact', () => {
            const model = new SegmentationModel();

            const recommendations = model.getTargetingRecommendations();

            for (const rec of recommendations) {
                expect(rec.segment).toBeDefined();
                expect(rec.action).toBeDefined();
                expect(rec.expectedImpact).toBeDefined();
                expect(['high', 'medium', 'low']).toContain(rec.priority);
            }
        });

        it('should have high priority for whales', () => {
            const model = new SegmentationModel();

            const recommendations = model.getTargetingRecommendations();
            const whaleRec = recommendations.find(r => r.segment === 'whale');

            expect(whaleRec?.priority).toBe('high');
        });

        it('should have high priority for at-risk users', () => {
            const model = new SegmentationModel();

            const recommendations = model.getTargetingRecommendations();
            const atRiskRec = recommendations.find(r => r.segment === 'at_risk');

            expect(atRiskRec?.priority).toBe('high');
        });
    });

    // =========================================================================
    // Training Tests
    // =========================================================================

    describe('train', () => {
        it('should throw error for insufficient data', async () => {
            const model = new SegmentationModel({ minDataPoints: 100 });
            const users = [createUserFeatures()];

            await expect(model.train(users)).rejects.toThrow();
        });

        it('should train on user data', async () => {
            const model = new SegmentationModel({ minDataPoints: 10 });
            const users = Array.from({ length: 20 }, (_, i) =>
                createUserFeatures({ userId: `user${i}` })
            );

            const metrics = await model.train(users);

            expect(metrics.dataPointsUsed).toBe(20);
            expect(metrics.lastTrainedAt).toBeDefined();
        });

        it('should run clustering during training', async () => {
            const model = new SegmentationModel({ minDataPoints: 10 });
            const users = Array.from({ length: 20 }, (_, i) =>
                createUserFeatures({ userId: `user${i}` })
            );

            await model.train(users);

            // Model should have learned feature statistics
            expect(model.metrics).toBeDefined();
        });
    });

    // =========================================================================
    // Evaluation Tests
    // =========================================================================

    describe('evaluate', () => {
        it('should return silhouette-based metrics', async () => {
            const model = new SegmentationModel();
            const users = Array.from({ length: 15 }, (_, i) =>
                createUserFeatures({ userId: `user${i}` })
            );

            const metrics = await model.evaluate(users);

            expect(metrics.accuracy).toBeDefined(); // Silhouette score
            expect(metrics.dataPointsUsed).toBe(15);
        });
    });

    // =========================================================================
    // Feature Importance Tests
    // =========================================================================

    describe('getFeatureImportance', () => {
        it('should return feature importance scores', () => {
            const model = new SegmentationModel();

            const importance = model.getFeatureImportance();

            expect(importance.totalSpend).toBeDefined();
            expect(importance.weeklyActiveRatio).toBeDefined();
            expect(importance.sessionCount7d).toBeDefined();
        });

        it('should sum to approximately 1', () => {
            const model = new SegmentationModel();

            const importance = model.getFeatureImportance();
            const sum = Object.values(importance).reduce((a, b) => a + b, 0);

            expect(sum).toBeCloseTo(1, 0);
        });
    });

    // =========================================================================
    // Persistence Tests
    // =========================================================================

    describe('save and load', () => {
        it('should save model to localStorage', async () => {
            const model = new SegmentationModel();

            await model.save();

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'segmentation_model',
                expect.any(String)
            );
        });

        it('should load model from localStorage', async () => {
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
                clusterCenters: [],
                featureMeans: { totalSpend: 50 },
                featureStds: { totalSpend: 30 },
                metrics: { accuracy: 0.8 },
            }));

            const model = new SegmentationModel();
            const loaded = await model.load();

            expect(loaded).toBe(true);
        });

        it('should return false when no saved model', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const model = new SegmentationModel();
            const loaded = await model.load();

            expect(loaded).toBe(false);
        });

        it('should handle corrupt saved data', async () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid json');

            const model = new SegmentationModel();
            const loaded = await model.load();

            expect(loaded).toBe(false);
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle user with no matches', () => {
            const model = new SegmentationModel();
            const features = createUserFeatures({
                totalSpend: 0,
                isPayer: false,
                weeklyActiveRatio: 0.35, // Between casual and highly_engaged
                sessionTrend: 0,
                lastSessionHoursAgo: 40, // Not at risk
                daysSinceFirstSession: 10, // Not new
                daysActive: 10, // Not veteran
                sessionCount7d: 5,
                avgSessionLength: 15,
            });

            const primary = model.getPrimarySegment(features);

            expect(primary).toBeDefined();
        });

        it('should handle empty user list', () => {
            const model = new SegmentationModel();

            const result = model.segmentUsers([]);

            expect(result.summary.length).toBe(0);
        });

        it('should handle single user', () => {
            const model = new SegmentationModel();
            const users = [createUserFeatures()];

            const result = model.segmentUsers(users);

            expect(result.summary.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export segmentationModel singleton', () => {
            expect(segmentationModel).toBeInstanceOf(SegmentationModel);
        });

        it('should have default configuration', () => {
            expect(segmentationModel.config).toBeDefined();
            expect(segmentationModel.name).toBe('SegmentationModel');
        });
    });
});
