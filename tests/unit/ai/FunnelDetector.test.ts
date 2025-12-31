/**
 * FunnelDetector Unit Tests
 * Tests for funnel detection and analysis
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import { FunnelDetector, funnelDetector } from '@/ai/FunnelDetector';
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';
import { NormalizedData } from '@/adapters/BaseAdapter';
import { GameCategory } from '@/types';

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

// Helper to create level progression data
function createLevelData(
    userCount: number,
    maxLevel: number = 10,
    dropOffRate: number = 0.2
): NormalizedData {
    const rows: Record<string, unknown>[] = [];

    for (let userId = 1; userId <= userCount; userId++) {
        // Simulate drop-off at each level
        let shouldContinue = true;
        for (let level = 1; level <= maxLevel && shouldContinue; level++) {
            rows.push({ user_id: `user_${userId}`, level });
            // Random drop-off
            if (Math.random() < dropOffRate && level > 1) {
                shouldContinue = false;
            }
        }
    }

    return createTestData({ rows, columns: ['user_id', 'level'] });
}

// Helper to create event data
function createEventData(events: { user_id: string; event_name: string }[]): NormalizedData {
    return createTestData({
        rows: events,
        columns: ['user_id', 'event_name'],
    });
}

describe('FunnelDetector', () => {
    const detector = new FunnelDetector();

    // =========================================================================
    // Level-Based Funnel Detection Tests
    // =========================================================================

    describe('detectLevelFunnel', () => {
        it('should detect level progression funnel', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', level: 1 },
                    { user_id: 'u1', level: 2 },
                    { user_id: 'u1', level: 3 },
                    { user_id: 'u2', level: 1 },
                    { user_id: 'u2', level: 2 },
                    { user_id: 'u3', level: 1 },
                ],
            });

            const result = detector.detectLevelFunnel(data, 'user_id', 'level');

            expect(result).not.toBeNull();
            expect(result!.name).toBe('Level Progression');
            expect(result!.type).toBe('progression');
            expect(result!.steps.length).toBeGreaterThan(0);
        });

        it('should calculate user counts correctly', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', level: 1 },
                    { user_id: 'u1', level: 2 },
                    { user_id: 'u2', level: 1 },
                    { user_id: 'u2', level: 2 },
                    { user_id: 'u3', level: 1 },
                ],
            });

            const result = detector.detectLevelFunnel(data, 'user_id', 'level');

            expect(result!.totalUsers).toBe(3);
            expect(result!.steps[0].userCount).toBe(3); // Level 1
            expect(result!.steps[1].userCount).toBe(2); // Level 2
        });

        it('should calculate drop-off rates', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', level: 1 },
                    { user_id: 'u2', level: 1 },
                    { user_id: 'u3', level: 1 },
                    { user_id: 'u4', level: 1 },
                    { user_id: 'u1', level: 2 },
                    { user_id: 'u2', level: 2 },
                ],
            });

            const result = detector.detectLevelFunnel(data, 'user_id', 'level');

            // Level 2 should have 50% drop-off from 4 users to 2
            expect(result!.steps[1].dropOffRate).toBe(50);
        });

        it('should track max level per user', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', level: 1 },
                    { user_id: 'u1', level: 2 },
                    { user_id: 'u1', level: 5 }, // Max level for u1
                    { user_id: 'u1', level: 3 },
                ],
            });

            const result = detector.detectLevelFunnel(data, 'user_id', 'level');

            // User should appear in levels 1-5
            expect(result!.steps.length).toBe(5);
            expect(result!.steps[4].name).toBe('Level 5');
        });

        it('should return null for empty data', () => {
            const data = createTestData({ rows: [], columns: ['user_id', 'level'] });

            const result = detector.detectLevelFunnel(data, 'user_id', 'level');

            expect(result).toBeNull();
        });

        it('should limit levels to maxLevels parameter', () => {
            const data = createTestData({
                rows: Array.from({ length: 100 }, (_, i) => ({
                    user_id: 'u1',
                    level: i + 1,
                })),
            });

            const result = detector.detectLevelFunnel(data, 'user_id', 'level', 10);

            expect(result!.steps.length).toBe(10);
        });
    });

    // =========================================================================
    // Step-Based Funnel Detection Tests
    // =========================================================================

    describe('detectStepFunnel', () => {
        it('should detect funnel from step column', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', funnel_step: 'view' },
                    { user_id: 'u1', funnel_step: 'add_to_cart' },
                    { user_id: 'u1', funnel_step: 'purchase' },
                    { user_id: 'u2', funnel_step: 'view' },
                    { user_id: 'u2', funnel_step: 'add_to_cart' },
                    { user_id: 'u3', funnel_step: 'view' },
                ],
            });

            const result = detector.detectStepFunnel(data, 'user_id', 'funnel_step');

            expect(result).not.toBeNull();
            expect(result!.type).toBe('conversion');
            expect(result!.steps.length).toBe(3);
        });

        it('should preserve step order', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', funnel_step: 'step_a' },
                    { user_id: 'u1', funnel_step: 'step_b' },
                    { user_id: 'u1', funnel_step: 'step_c' },
                ],
            });

            const result = detector.detectStepFunnel(data, 'user_id', 'funnel_step');

            expect(result!.steps[0].name).toBe('step_a');
            expect(result!.steps[1].name).toBe('step_b');
            expect(result!.steps[2].name).toBe('step_c');
        });

        it('should count unique users per step', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', funnel_step: 'view' },
                    { user_id: 'u1', funnel_step: 'view' }, // Duplicate
                    { user_id: 'u2', funnel_step: 'view' },
                ],
            });

            const result = detector.detectStepFunnel(data, 'user_id', 'funnel_step');

            expect(result!.steps[0].userCount).toBe(2); // Only 2 unique users
        });

        it('should return null for empty data', () => {
            const data = createTestData({ rows: [], columns: ['user_id', 'funnel_step'] });

            const result = detector.detectStepFunnel(data, 'user_id', 'funnel_step');

            expect(result).toBeNull();
        });
    });

    // =========================================================================
    // Bottleneck Analysis Tests
    // =========================================================================

    describe('bottleneck analysis', () => {
        it('should identify bottleneck step', () => {
            const data = createTestData({
                rows: [
                    // 10 users at level 1
                    ...Array.from({ length: 10 }, (_, i) => ({ user_id: `u${i}`, level: 1 })),
                    // 9 users at level 2 (10% drop)
                    ...Array.from({ length: 9 }, (_, i) => ({ user_id: `u${i}`, level: 2 })),
                    // 3 users at level 3 (66% drop - bottleneck)
                    ...Array.from({ length: 3 }, (_, i) => ({ user_id: `u${i}`, level: 3 })),
                ],
            });

            const result = detector.detectLevelFunnel(data, 'user_id', 'level');

            expect(result!.bottleneck).not.toBeNull();
            expect(result!.bottleneck!.step).toBe('Level 3');
            expect(result!.bottleneck!.recommendations.length).toBeGreaterThan(0);
        });

        it('should return null bottleneck for small drop-offs', () => {
            const data = createTestData({
                rows: [
                    // Very gradual drop-off
                    ...Array.from({ length: 100 }, (_, i) => ({ user_id: `u${i}`, level: 1 })),
                    ...Array.from({ length: 95 }, (_, i) => ({ user_id: `u${i}`, level: 2 })),
                    ...Array.from({ length: 90 }, (_, i) => ({ user_id: `u${i}`, level: 3 })),
                ],
            });

            const result = detector.detectLevelFunnel(data, 'user_id', 'level');

            expect(result!.bottleneck).toBeNull();
        });
    });

    // =========================================================================
    // Full Detection Pipeline Tests
    // =========================================================================

    describe('detect', () => {
        it('should require user_id column', () => {
            const data = createTestData({ rows: [{ value: 1 }] });
            const columnMeanings: ColumnMeaning[] = [];

            const result = detector.detect(data, columnMeanings, 'puzzle');

            expect(result.detectedFunnels.length).toBe(0);
        });

        it('should detect level funnel when level column exists', () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', level: 1 },
                    { user_id: 'u1', level: 2 },
                ],
            });
            const columnMeanings: ColumnMeaning[] = [
                { column: 'user_id', semanticType: 'user_id', confidence: 1 },
                { column: 'level', semanticType: 'level', confidence: 1 },
            ];

            const result = detector.detect(data, columnMeanings, 'puzzle');

            expect(result.detectedFunnels.some(f => f.name === 'Level Progression')).toBe(true);
        });

        it('should include game type in result', () => {
            const data = createTestData({ rows: [] });
            const columnMeanings: ColumnMeaning[] = [];

            const result = detector.detect(data, columnMeanings, 'idle');

            expect(result.gameType).toBe('idle');
        });

        it('should include timestamp in result', () => {
            const data = createTestData({ rows: [] });
            const columnMeanings: ColumnMeaning[] = [];

            const result = detector.detect(data, columnMeanings, 'puzzle');

            expect(result.analyzedAt).toBeDefined();
            expect(new Date(result.analyzedAt).getTime()).not.toBeNaN();
        });
    });

    // =========================================================================
    // Optimization Suggestions Tests
    // =========================================================================

    describe('analyzeBottlenecks', () => {
        it('should generate optimizations for high drop-off steps', () => {
            const funnel = {
                id: 'test',
                name: 'Test Funnel',
                type: 'progression' as const,
                steps: [
                    { id: '1', name: 'Step 1', userCount: 100, percentage: 100, dropOffRate: 0 },
                    { id: '2', name: 'Step 2', userCount: 40, percentage: 40, dropOffRate: 60 }, // >50% is high priority
                    { id: '3', name: 'Step 3', userCount: 20, percentage: 20, dropOffRate: 50 },
                ],
                totalUsers: 100,
                completionRate: 20,
                avgCompletionTime: 0,
                bottleneck: null,
            };

            const optimizations = detector.analyzeBottlenecks(funnel);

            expect(optimizations.length).toBe(2);
            expect(optimizations[0].priority).toBe('high'); // 60% drop-off is high priority
        });

        it('should not generate optimizations for low drop-off steps', () => {
            const funnel = {
                id: 'test',
                name: 'Test Funnel',
                type: 'progression' as const,
                steps: [
                    { id: '1', name: 'Step 1', userCount: 100, percentage: 100, dropOffRate: 0 },
                    { id: '2', name: 'Step 2', userCount: 90, percentage: 90, dropOffRate: 10 },
                ],
                totalUsers: 100,
                completionRate: 90,
                avgCompletionTime: 0,
                bottleneck: null,
            };

            const optimizations = detector.analyzeBottlenecks(funnel);

            expect(optimizations.length).toBe(0);
        });

        it('should include suggestions in optimizations', () => {
            const funnel = {
                id: 'test',
                name: 'Test Funnel',
                type: 'progression' as const,
                steps: [
                    { id: '1', name: 'Step 1', userCount: 100, percentage: 100, dropOffRate: 0 },
                    { id: '2', name: 'Tutorial', userCount: 30, percentage: 30, dropOffRate: 70 },
                ],
                totalUsers: 100,
                completionRate: 30,
                avgCompletionTime: 0,
                bottleneck: null,
            };

            const optimizations = detector.analyzeBottlenecks(funnel);

            expect(optimizations[0].suggestions.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Game Type Funnels Tests
    // =========================================================================

    describe('getGameTypeFunnels', () => {
        it('should return predefined funnels for puzzle', () => {
            const funnels = detector.getGameTypeFunnels('puzzle');

            expect(funnels.length).toBeGreaterThan(0);
            expect(funnels.some(f => f.name.includes('Tutorial'))).toBe(true);
        });

        it('should return predefined funnels for gacha_rpg', () => {
            const funnels = detector.getGameTypeFunnels('gacha_rpg');

            expect(funnels.length).toBeGreaterThan(0);
        });

        it('should return empty array for unknown game type', () => {
            const funnels = detector.getGameTypeFunnels('unknown' as GameCategory);

            expect(funnels).toEqual([]);
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export funnelDetector singleton', () => {
            expect(funnelDetector).toBeInstanceOf(FunnelDetector);
        });
    });
});
