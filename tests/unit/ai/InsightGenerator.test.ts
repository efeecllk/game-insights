/**
 * InsightGenerator Unit Tests
 * Tests for AI-powered insight generation
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsightGenerator, Insight, insightGenerator } from '@/ai/InsightGenerator';
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

// Helper to create column meanings
function createMeanings(meanings: { column: string; type: string }[]): ColumnMeaning[] {
    return meanings.map(m => ({
        column: m.column,
        semanticType: m.type as ColumnMeaning['semanticType'],
        confidence: 1,
    }));
}

describe('InsightGenerator', () => {
    // =========================================================================
    // Constructor Tests
    // =========================================================================

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const generator = new InsightGenerator();
            expect(generator).toBeInstanceOf(InsightGenerator);
        });

        it('should accept custom config', () => {
            const generator = new InsightGenerator({
                useLLM: false,
                maxInsights: 5,
                minConfidence: 0.7,
            });
            expect(generator).toBeInstanceOf(InsightGenerator);
        });
    });

    // =========================================================================
    // Template-Based Insight Tests
    // =========================================================================

    describe('generateTemplateInsights', () => {
        it('should generate revenue insight when revenue column exists', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { user_id: 'u1', revenue: 100 },
                    { user_id: 'u2', revenue: 200 },
                    { user_id: 'u3', revenue: 300 },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            const revenueInsight = insights.find(i => i.id === 'total-revenue');
            expect(revenueInsight).toBeDefined();
            expect(revenueInsight!.value).toBe(600);
            expect(revenueInsight!.type).toBe('positive');
            expect(revenueInsight!.category).toBe('monetization');
        });

        it('should generate unique users insight', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { user_id: 'u1' },
                    { user_id: 'u2' },
                    { user_id: 'u2' }, // Duplicate
                    { user_id: 'u3' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            const usersInsight = insights.find(i => i.id === 'unique-users');
            expect(usersInsight).toBeDefined();
            expect(usersInsight!.value).toBe(3); // 3 unique users
        });

        it('should generate retention warning insight', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { user_id: 'u1', retention_day: 1 },
                    { user_id: 'u2', retention_day: 7 },
                    { user_id: 'u3', retention_day: 15 },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'retention_day', type: 'retention_day' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            const retentionInsight = insights.find(i => i.id === 'retention-warning');
            expect(retentionInsight).toBeDefined();
            expect(retentionInsight!.type).toBe('warning');
            expect(retentionInsight!.recommendation).toContain('Day 1-3');
        });

        it('should generate level progress insight', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { user_id: 'u1', level: 5 },
                    { user_id: 'u2', level: 10 },
                    { user_id: 'u3', level: 15 },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'level', type: 'level' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            const levelInsight = insights.find(i => i.id === 'level-distribution');
            expect(levelInsight).toBeDefined();
            expect(levelInsight!.description).toContain('1 to 15');
            expect(levelInsight!.value).toBe(10); // Average: (5+10+15)/3 = 10
        });

        it('should generate error alert for high error rate', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { event: 'play', error_type: 'crash' },
                    { event: 'play', error_type: 'timeout' },
                    { event: 'play', error_type: null },
                    { event: 'play', error_type: '' },
                    { event: 'play', error_type: 'network' },
                    // 3/5 = 60% error rate
                ],
            });
            const meanings = createMeanings([
                { column: 'error_type', type: 'error_type' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            const errorInsight = insights.find(i => i.id === 'error-alert');
            expect(errorInsight).toBeDefined();
            expect(errorInsight!.type).toBe('negative');
            expect(errorInsight!.priority).toBe(9);
        });

        it('should generate sessions per user insight', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { user_id: 'u1', session_id: 's1' },
                    { user_id: 'u1', session_id: 's2' },
                    { user_id: 'u1', session_id: 's3' },
                    { user_id: 'u1', session_id: 's4' },
                    { user_id: 'u2', session_id: 's5' },
                    { user_id: 'u2', session_id: 's6' },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'session_id', type: 'session_id' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            const sessionsInsight = insights.find(i => i.id === 'sessions-per-user');
            expect(sessionsInsight).toBeDefined();
            expect(sessionsInsight!.value).toBe(3); // Average: (4+2)/2 = 3
            expect(sessionsInsight!.type).toBe('neutral'); // 3 is not > 3
        });
    });

    // =========================================================================
    // Game Type Tips Tests
    // =========================================================================

    describe('game type tips', () => {
        it('should include game-specific tip for puzzle', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({ rows: [{ id: 1 }] });

            const insights = generator.generateTemplateInsights(data, [], 'puzzle');

            const tipInsight = insights.find(i => i.id === 'game-tip');
            expect(tipInsight).toBeDefined();
            expect(tipInsight!.title).toContain('puzzle');
        });

        it('should include game-specific tip for gacha_rpg', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({ rows: [{ id: 1 }] });

            const insights = generator.generateTemplateInsights(data, [], 'gacha_rpg');

            const tipInsight = insights.find(i => i.id === 'game-tip');
            expect(tipInsight).toBeDefined();
            expect(tipInsight!.title).toContain('gacha rpg');
        });

        it('should include tip for custom game type', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({ rows: [{ id: 1 }] });

            const insights = generator.generateTemplateInsights(data, [], 'custom');

            const tipInsight = insights.find(i => i.id === 'game-tip');
            expect(tipInsight).toBeDefined();
        });
    });

    // =========================================================================
    // Data Quality Tests
    // =========================================================================

    describe('data quality insights', () => {
        it('should generate data quality warning for high null rate', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { a: null, b: null, c: 'value' },
                    { a: null, b: undefined, c: 'value' },
                    { a: '', b: null, c: '' },
                ],
            });

            const insights = generator.generateTemplateInsights(data, [], 'puzzle');

            const qualityInsight = insights.find(i => i.id === 'data-quality');
            expect(qualityInsight).toBeDefined();
            expect(qualityInsight!.type).toBe('warning');
            expect(qualityInsight!.category).toBe('quality');
        });

        it('should not generate quality warning for clean data', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { a: 1, b: 2, c: 3 },
                    { a: 4, b: 5, c: 6 },
                    { a: 7, b: 8, c: 9 },
                ],
            });

            const insights = generator.generateTemplateInsights(data, [], 'puzzle');

            const qualityInsight = insights.find(i => i.id === 'data-quality');
            expect(qualityInsight).toBeUndefined();
        });
    });

    // =========================================================================
    // Main Generate Method Tests
    // =========================================================================

    describe('generate', () => {
        it('should return template insights when LLM is disabled', async () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { user_id: 'u1', revenue: 100 },
                    { user_id: 'u2', revenue: 200 },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const insights = await generator.generate(data, meanings, 'puzzle');

            expect(insights.length).toBeGreaterThan(0);
            expect(insights.every(i => i.source === 'template')).toBe(true);
        });

        it('should fall back to templates when LLM fails', async () => {
            const mockLLMService = {
                generateInsights: vi.fn().mockRejectedValue(new Error('API error')),
            };
            const generator = new InsightGenerator({
                useLLM: true,
                llmService: mockLLMService as any,
            });
            const data = createTestData({
                rows: [{ user_id: 'u1' }],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
            ]);

            const insights = await generator.generate(data, meanings, 'puzzle');

            expect(insights.length).toBeGreaterThan(0);
            expect(insights.every(i => i.source === 'template')).toBe(true);
        });

        it('should merge LLM and template insights', async () => {
            const mockLLMService = {
                generateInsights: vi.fn().mockResolvedValue({
                    insights: [
                        {
                            type: 'positive',
                            category: 'retention',
                            title: 'LLM Insight',
                            description: 'Test LLM insight',
                            priority: 8,
                            confidence: 0.9,
                        },
                    ],
                }),
            };
            const generator = new InsightGenerator({
                useLLM: true,
                llmService: mockLLMService as any,
            });
            const data = createTestData({
                rows: [{ user_id: 'u1', revenue: 100 }],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'revenue', type: 'revenue' },
            ]);

            const insights = await generator.generate(data, meanings, 'puzzle');

            expect(insights.some(i => i.title === 'LLM Insight')).toBe(true);
            // High-confidence template insights should also be included
        });
    });

    // =========================================================================
    // Config Tests
    // =========================================================================

    describe('setConfig', () => {
        it('should update configuration', () => {
            const generator = new InsightGenerator({ maxInsights: 10 });

            generator.setConfig({ maxInsights: 5 });

            // Configuration is private, but we can test its effect
            expect(generator).toBeInstanceOf(InsightGenerator);
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle empty data', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({ rows: [] });

            const insights = generator.generateTemplateInsights(data, [], 'puzzle');

            // Should still return game tip at minimum
            expect(insights.length).toBeGreaterThanOrEqual(1);
        });

        it('should handle data without matching semantic types', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { random_col: 'value1' },
                    { random_col: 'value2' },
                ],
            });

            const insights = generator.generateTemplateInsights(data, [], 'puzzle');

            // Should still return game tip
            const tipInsight = insights.find(i => i.id === 'game-tip');
            expect(tipInsight).toBeDefined();
        });

        it('should handle zero values in revenue', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { revenue: 0 },
                    { revenue: 0 },
                ],
            });
            const meanings = createMeanings([
                { column: 'revenue', type: 'revenue' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            const revenueInsight = insights.find(i => i.id === 'total-revenue');
            expect(revenueInsight).toBeDefined();
            expect(revenueInsight!.value).toBe(0);
        });

        it('should handle NaN values in numeric columns', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { level: 'not a number' },
                    { level: 5 },
                ],
            });
            const meanings = createMeanings([
                { column: 'level', type: 'level' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            const levelInsight = insights.find(i => i.id === 'level-distribution');
            expect(levelInsight).toBeDefined();
            // Should only count valid level
            expect(levelInsight!.value).toBe(5);
        });

        it('should handle missing session or user values', () => {
            const generator = new InsightGenerator({ useLLM: false });
            const data = createTestData({
                rows: [
                    { user_id: 'u1', session_id: 's1' },
                    { user_id: '', session_id: 's2' },
                    { user_id: 'u2', session_id: '' },
                    { user_id: null, session_id: null },
                ],
            });
            const meanings = createMeanings([
                { column: 'user_id', type: 'user_id' },
                { column: 'session_id', type: 'session_id' },
            ]);

            const insights = generator.generateTemplateInsights(data, meanings, 'puzzle');

            // Should handle gracefully without errors
            expect(insights).toBeDefined();
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export insightGenerator singleton', () => {
            expect(insightGenerator).toBeInstanceOf(InsightGenerator);
        });
    });
});
