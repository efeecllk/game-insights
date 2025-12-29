/**
 * SegmentationModel Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SegmentationModel } from '../../../../src/ai/ml/SegmentationModel';
import type { UserFeatures, PredefinedSegment } from '../../../../src/ai/ml/types';

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

describe('SegmentationModel', () => {
    let model: SegmentationModel;

    beforeEach(() => {
        model = new SegmentationModel();
    });

    describe('initialization', () => {
        it('should have correct default name and version', () => {
            expect(model.name).toBe('SegmentationModel');
            expect(model.version).toBe('1.0.0');
        });

        it('should have default config values', () => {
            expect(model.config.minDataPoints).toBe(100);
            expect(model.config.lookbackDays).toBe(30);
            expect(model.config.validationSplit).toBe(0.2);
        });

        it('should allow custom config', () => {
            const custom = new SegmentationModel({ minDataPoints: 50 });
            expect(custom.config.minDataPoints).toBe(50);
        });
    });

    describe('assignPredefinedSegments', () => {
        it('should identify whale users', () => {
            const features = createMockUserFeatures({
                totalSpend: 150,
                isPayer: true,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('whale');
        });

        it('should identify dolphin users', () => {
            const features = createMockUserFeatures({
                totalSpend: 50,
                purchaseCount: 3,
                isPayer: true,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('dolphin');
        });

        it('should identify minnow users', () => {
            const features = createMockUserFeatures({
                totalSpend: 5,
                purchaseCount: 1,
                isPayer: true,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('minnow');
        });

        it('should identify non-payer users', () => {
            const features = createMockUserFeatures({
                totalSpend: 0,
                purchaseCount: 0,
                isPayer: false,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('non_payer');
        });

        it('should identify highly engaged users', () => {
            const features = createMockUserFeatures({
                weeklyActiveRatio: 0.9,
                sessionCount7d: 15,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('highly_engaged');
        });

        it('should identify casual players', () => {
            const features = createMockUserFeatures({
                weeklyActiveRatio: 0.2,
                avgSessionLength: 5,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('casual');
        });

        it('should identify at-risk users', () => {
            const features = createMockUserFeatures({
                sessionTrend: -0.5,
                lastSessionHoursAgo: 60,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('at_risk');
        });

        it('should identify churned users', () => {
            const features = createMockUserFeatures({
                lastSessionHoursAgo: 200, // > 168 (7 days)
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('churned');
        });

        it('should identify new users', () => {
            const features = createMockUserFeatures({
                daysSinceFirstSession: 3,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('new_user');
        });

        it('should identify veteran users', () => {
            const features = createMockUserFeatures({
                daysActive: 60,
                weeklyActiveRatio: 0.6,
            });
            const segments = model.assignPredefinedSegments(features);

            expect(segments).toContain('veteran');
        });

        it('should allow multiple segments for same user', () => {
            const features = createMockUserFeatures({
                totalSpend: 150,
                isPayer: true,
                weeklyActiveRatio: 0.9,
                sessionCount7d: 15,
                daysActive: 60,
            });
            const segments = model.assignPredefinedSegments(features);

            // Could be whale, highly_engaged, and veteran
            expect(segments.length).toBeGreaterThan(1);
        });
    });

    describe('getPrimarySegment', () => {
        it('should return highest priority segment', () => {
            const features = createMockUserFeatures({
                totalSpend: 150,
                isPayer: true,
                weeklyActiveRatio: 0.9,
                sessionCount7d: 15,
            });
            const primary = model.getPrimarySegment(features);

            // Whale has priority 1, highest
            expect(primary).toBe('whale');
        });

        it('should return default segment when no matches', () => {
            const features = createMockUserFeatures({
                totalSpend: 0.5, // Not quite minnow
                isPayer: false,
                weeklyActiveRatio: 0.5, // Not casual, not highly engaged
                daysActive: 10, // Not veteran, not new
            });
            const primary = model.getPrimarySegment(features);

            // Should return a valid segment
            expect(['casual', 'at_risk', 'non_payer']).toContain(primary);
        });
    });

    describe('segmentUsers', () => {
        it('should segment all users', () => {
            const users = [
                createMockUserFeatures({ totalSpend: 200, isPayer: true }),
                createMockUserFeatures({ totalSpend: 50, purchaseCount: 3, isPayer: true }),
                createMockUserFeatures({ totalSpend: 0, isPayer: false }),
            ];

            const result = model.segmentUsers(users);

            // Count total users across all segments
            let totalInSegments = 0;
            result.segments.forEach((segmentUsers) => {
                totalInSegments += segmentUsers.length;
            });
            expect(totalInSegments).toBe(3);
        });

        it('should provide segment distribution', () => {
            const users = Array(100).fill(null).map((_, i) =>
                createMockUserFeatures({
                    totalSpend: i % 3 === 0 ? 200 : i % 3 === 1 ? 50 : 0,
                    isPayer: i % 3 !== 2,
                })
            );

            const result = model.segmentUsers(users);

            expect(result.distribution).toBeDefined();
        });

        it('should provide segment summary', () => {
            const users = Array(50).fill(null).map(() => createMockUserFeatures());
            const result = model.segmentUsers(users);

            expect(result.summary).toBeDefined();
            expect(result.summary.length).toBeGreaterThan(0);

            result.summary.forEach(segment => {
                expect(segment.id).toBeDefined();
                expect(segment.name).toBeDefined();
                expect(segment.userCount).toBeDefined();
                expect(segment.percentage).toBeDefined();
            });
        });

        it('should calculate segment characteristics', () => {
            const users = Array(50).fill(null).map(() => createMockUserFeatures());
            const result = model.segmentUsers(users);

            result.summary.forEach(segment => {
                expect(segment.characteristics).toBeDefined();
            });
        });

        it('should return segment maps', () => {
            const users = Array(20).fill(null).map(() => createMockUserFeatures());
            const result = model.segmentUsers(users);

            expect(result.segments).toBeDefined();
            expect(result.segments instanceof Map).toBe(true);
        });
    });

    describe('autoCluster', () => {
        it('should cluster users automatically', () => {
            const users = Array(100).fill(null).map(() => createMockUserFeatures({
                totalSpend: Math.random() * 200,
                sessionCount7d: Math.floor(Math.random() * 20),
                weeklyActiveRatio: Math.random(),
            }));

            const result = model.autoCluster(users);

            expect(result.clusters).toBeDefined();
            expect(result.clusters instanceof Map).toBe(true);
            expect(result.centers).toBeDefined();
            expect(result.labels).toBeDefined();
        });

        it('should use specified number of clusters', () => {
            const users = Array(100).fill(null).map(() => createMockUserFeatures());
            const result = model.autoCluster(users, 3);

            expect(result.clusters.size).toBe(3);
            expect(result.centers.length).toBe(3);
        });

        it('should assign all users to clusters', () => {
            const users = Array(50).fill(null).map(() => createMockUserFeatures());
            const result = model.autoCluster(users);

            let totalAssigned = 0;
            result.clusters.forEach(cluster => {
                totalAssigned += cluster.length;
            });

            expect(totalAssigned).toBe(50);
        });

        it('should label all users', () => {
            const users = Array(50).fill(null).map(() => createMockUserFeatures());
            const result = model.autoCluster(users);

            expect(result.labels.size).toBe(50);
        });

        it('should calculate cluster centers', () => {
            const users = Array(100).fill(null).map(() => createMockUserFeatures());
            const result = model.autoCluster(users);

            result.centers.forEach(center => {
                expect(center.features).toBeDefined();
                expect(center.userCount).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('getTargetingRecommendations', () => {
        it('should return targeting recommendations', () => {
            const recommendations = model.getTargetingRecommendations();

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
        });

        it('should include required fields', () => {
            const recommendations = model.getTargetingRecommendations();

            recommendations.forEach(rec => {
                expect(rec.segment).toBeDefined();
                expect(rec.action).toBeDefined();
                expect(rec.expectedImpact).toBeDefined();
                expect(rec.priority).toBeDefined();
            });
        });

        it('should have valid priority levels', () => {
            const recommendations = model.getTargetingRecommendations();

            recommendations.forEach(rec => {
                expect(['high', 'medium', 'low']).toContain(rec.priority);
            });
        });

        it('should include key segments', () => {
            const recommendations = model.getTargetingRecommendations();
            const segments = recommendations.map(r => r.segment);

            expect(segments).toContain('whale');
            expect(segments).toContain('at_risk');
            expect(segments).toContain('new_user');
        });
    });

    describe('train', () => {
        it('should train on user data', async () => {
            const users = Array(150).fill(null).map(() => createMockUserFeatures());
            const metrics = await model.train(users);

            expect(metrics).toBeDefined();
            expect(metrics.lastTrainedAt).toBeDefined();
            expect(metrics.dataPointsUsed).toBe(150);
        });

        it('should throw error with insufficient data', async () => {
            const users = Array(50).fill(null).map(() => createMockUserFeatures());

            await expect(model.train(users)).rejects.toThrow('Need at least');
        });

        it('should calculate feature statistics', async () => {
            const users = Array(150).fill(null).map(() => createMockUserFeatures());
            await model.train(users);

            // Model should now have trained state
            const result = model.autoCluster(users);
            expect(result.centers.length).toBeGreaterThan(0);
        });
    });

    describe('evaluate', () => {
        it('should return evaluation metrics', async () => {
            const users = Array(150).fill(null).map(() => createMockUserFeatures({
                totalSpend: Math.random() * 200,
                weeklyActiveRatio: Math.random(),
            }));

            await model.train(users);
            const metrics = await model.evaluate(users.slice(0, 50));

            expect(metrics).toBeDefined();
            expect(metrics.accuracy).toBeDefined();
        });

        it('should return accuracy as silhouette score', async () => {
            const users = Array(150).fill(null).map(() => createMockUserFeatures());
            await model.train(users);
            const metrics = await model.evaluate(users.slice(0, 50));

            // Silhouette score ranges from -1 to 1
            expect(metrics.accuracy).toBeGreaterThanOrEqual(-1);
            expect(metrics.accuracy).toBeLessThanOrEqual(1);
        });
    });

    describe('getFeatureImportance', () => {
        it('should return feature importance mapping', () => {
            const importance = model.getFeatureImportance();

            expect(importance).toBeDefined();
            expect(Object.keys(importance).length).toBeGreaterThan(0);
        });

        it('should include key segmentation features', () => {
            const importance = model.getFeatureImportance();

            expect(importance['totalSpend']).toBeDefined();
            expect(importance['weeklyActiveRatio']).toBeDefined();
            expect(importance['sessionCount7d']).toBeDefined();
        });

        it('should have importance values between 0 and 1', () => {
            const importance = model.getFeatureImportance();

            Object.values(importance).forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            });
        });

        it('should have importance values sum close to 1', () => {
            const importance = model.getFeatureImportance();
            const sum = Object.values(importance).reduce((a, b) => a + b, 0);

            expect(sum).toBeCloseTo(1, 1);
        });
    });

    describe('segment criteria matching', () => {
        it('should match gt operator correctly', () => {
            const features = createMockUserFeatures({ totalSpend: 150 });
            const segments = model.assignPredefinedSegments(features);

            // totalSpend > 100 means whale
            expect(segments).toContain('whale');
        });

        it('should match lt operator correctly', () => {
            const features = createMockUserFeatures({
                weeklyActiveRatio: 0.2,
                avgSessionLength: 5,
            });
            const segments = model.assignPredefinedSegments(features);

            // weeklyActiveRatio < 0.3 and avgSessionLength < 10 means casual
            expect(segments).toContain('casual');
        });

        it('should match between operator correctly', () => {
            const features = createMockUserFeatures({
                totalSpend: 50,
                purchaseCount: 3,
                isPayer: true,
            });
            const segments = model.assignPredefinedSegments(features);

            // totalSpend between 20-100 means dolphin
            expect(segments).toContain('dolphin');
        });

        it('should match eq operator correctly', () => {
            const features = createMockUserFeatures({
                isPayer: false,
                totalSpend: 0,
            });
            const segments = model.assignPredefinedSegments(features);

            // isPayer eq 0 means non_payer
            expect(segments).toContain('non_payer');
        });
    });

    describe('edge cases', () => {
        it('should handle user with all extreme low values', () => {
            const features = createMockUserFeatures({
                sessionCount7d: 0,
                sessionCount30d: 0,
                totalSpend: 0,
                isPayer: false,
                weeklyActiveRatio: 0,
                lastSessionHoursAgo: 1000,
            });

            const segments = model.assignPredefinedSegments(features);
            const primary = model.getPrimarySegment(features);

            expect(segments.length).toBeGreaterThan(0);
            expect(primary).toBeDefined();
        });

        it('should handle user with all extreme high values', () => {
            const features = createMockUserFeatures({
                sessionCount7d: 100,
                sessionCount30d: 1000,
                totalSpend: 10000,
                isPayer: true,
                weeklyActiveRatio: 1,
                daysActive: 365,
            });

            const segments = model.assignPredefinedSegments(features);
            const primary = model.getPrimarySegment(features);

            expect(segments).toContain('whale');
            expect(primary).toBe('whale');
        });

        it('should handle empty user array', () => {
            const result = model.segmentUsers([]);

            // Count total users across all segments
            let totalInSegments = 0;
            result.segments.forEach((segmentUsers) => {
                totalInSegments += segmentUsers.length;
            });
            expect(totalInSegments).toBe(0);
        });

        it('should handle single user', () => {
            const users = [createMockUserFeatures()];
            const result = model.segmentUsers(users);

            // Count total users across all segments
            let totalInSegments = 0;
            result.segments.forEach((segmentUsers) => {
                totalInSegments += segmentUsers.length;
            });
            expect(totalInSegments).toBe(1);
        });
    });
});
