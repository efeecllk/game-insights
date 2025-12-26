/**
 * SchemaAnalyzer Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import { SchemaAnalyzer, ColumnMeaning, SemanticType } from '../../../src/ai/SchemaAnalyzer';
import { SchemaInfo, ColumnInfo } from '../../../src/adapters/BaseAdapter';

describe('SchemaAnalyzer', () => {
    const analyzer = new SchemaAnalyzer();

    describe('analyze', () => {
        it('should detect user_id from column name', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'user_id', type: 'string', nullable: false, sampleValues: ['u123', 'u456'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result).toHaveLength(1);
            expect(result[0].semanticType).toBe('user_id');
            expect(result[0].confidence).toBeGreaterThan(0);
        });

        it('should detect timestamp from various patterns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'timestamp', type: 'date', nullable: false, sampleValues: [] },
                    { name: 'created_at', type: 'date', nullable: false, sampleValues: [] },
                    { name: 'eventTime', type: 'date', nullable: false, sampleValues: [] },
                ],
            };

            const result = analyzer.analyze(schema);

            result.forEach(meaning => {
                expect(meaning.semanticType).toBe('timestamp');
            });
        });

        it('should detect revenue-related columns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'revenue', type: 'number', nullable: false, sampleValues: [10.99, 25.00] },
                    { name: 'iap_revenue', type: 'number', nullable: false, sampleValues: [5.99] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('revenue');
            expect(result[1].semanticType).toBe('revenue');
        });

        it('should detect level column', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'level', type: 'number', nullable: false, sampleValues: [1, 5, 10] },
                    { name: 'player_level', type: 'number', nullable: false, sampleValues: [1, 2] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('level');
            expect(result[1].semanticType).toBe('level');
        });

        it('should detect puzzle game specific columns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'moves', type: 'number', nullable: false, sampleValues: [10, 15] },
                    { name: 'booster', type: 'string', nullable: false, sampleValues: ['hammer', 'bomb'] },
                    { name: 'lives', type: 'number', nullable: false, sampleValues: [3, 5] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('moves');
            expect(result[1].semanticType).toBe('booster');
            expect(result[2].semanticType).toBe('lives');
        });

        it('should detect idle game specific columns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'prestige', type: 'number', nullable: false, sampleValues: [1, 2] },
                    { name: 'offline_reward', type: 'number', nullable: false, sampleValues: [1000] },
                    { name: 'upgrade', type: 'string', nullable: false, sampleValues: ['dmg', 'speed'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('prestige');
            expect(result[1].semanticType).toBe('offline_reward');
            expect(result[2].semanticType).toBe('upgrade');
        });

        it('should detect gacha game specific columns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'rarity', type: 'string', nullable: false, sampleValues: ['SSR', 'SR'] },
                    { name: 'banner', type: 'string', nullable: false, sampleValues: ['limited'] },
                    { name: 'pull_type', type: 'string', nullable: false, sampleValues: ['single', 'multi'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('rarity');
            expect(result[1].semanticType).toBe('banner');
            expect(result[2].semanticType).toBe('pull_type');
        });

        it('should detect battle royale specific columns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'kills', type: 'number', nullable: false, sampleValues: [0, 5, 10] },
                    { name: 'placement', type: 'number', nullable: false, sampleValues: [1, 2, 50] },
                    { name: 'damage', type: 'number', nullable: false, sampleValues: [100, 500] },
                    { name: 'survival_time', type: 'number', nullable: false, sampleValues: [60, 120] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('kills');
            expect(result[1].semanticType).toBe('placement');
            expect(result[2].semanticType).toBe('damage');
            expect(result[3].semanticType).toBe('survival_time');
        });

        it('should detect session_id column', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'session_id', type: 'string', nullable: false, sampleValues: ['sess123'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('session_id');
        });

        it('should detect event_name column', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'event_name', type: 'string', nullable: false, sampleValues: ['login', 'purchase'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('event_name');
        });

        it('should detect currency columns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'gold', type: 'number', nullable: false, sampleValues: [100, 500] },
                    { name: 'gems', type: 'number', nullable: false, sampleValues: [10, 50] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('currency');
            expect(result[1].semanticType).toBe('currency');
        });

        it('should detect platform column', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'platform', type: 'string', nullable: false, sampleValues: ['ios', 'android'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('platform');
        });

        it('should detect country column', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'country', type: 'string', nullable: false, sampleValues: ['US', 'JP'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('country');
        });

        it('should return unknown for unrecognized columns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'xyz_custom_field', type: 'string', nullable: false, sampleValues: ['abc'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('unknown');
            expect(result[0].confidence).toBe(0);
        });

        it('should handle empty schema', () => {
            const schema: SchemaInfo = {
                columns: [],
            };

            const result = analyzer.analyze(schema);

            expect(result).toHaveLength(0);
        });

        it('should infer timestamp from date type column', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'some_date', type: 'date', nullable: false, sampleValues: [] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('timestamp');
            expect(result[0].confidence).toBe(0.7);
        });

        it('should infer country from 2-character string samples', () => {
            const schema: SchemaInfo = {
                columns: [
                    // Use a name that doesn't match any pattern to test value-based inference
                    { name: 'loc_code', type: 'string', nullable: false, sampleValues: ['US', 'UK', 'JP'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('country');
            expect(result[0].confidence).toBe(0.6);
        });

        it('should detect retention_day patterns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'retention', type: 'number', nullable: false, sampleValues: [0.5, 0.3] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('retention_day');
        });

        it('should detect funnel_step column', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'funnel_step', type: 'string', nullable: false, sampleValues: ['start', 'complete'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('funnel_step');
        });

        it('should detect error columns', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'error_type', type: 'string', nullable: false, sampleValues: ['crash'] },
                    { name: 'error_message', type: 'string', nullable: false, sampleValues: ['OOM'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].semanticType).toBe('error_type');
            expect(result[1].semanticType).toBe('error_message');
        });
    });

    describe('getSuggestedMetrics', () => {
        it('should suggest revenue metrics when revenue column detected', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.85 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('Total Revenue');
            expect(metrics).toContain('ARPU');
            expect(metrics).toContain('ARPPU');
        });

        it('should suggest user metrics when user_id detected', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.85 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('DAU');
            expect(metrics).toContain('MAU');
            expect(metrics).toContain('New Users');
        });

        it('should suggest session metrics when session_id detected', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'session_id', detectedType: 'string', semanticType: 'session_id', confidence: 0.85 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('Sessions');
            expect(metrics).toContain('Avg Session Length');
        });

        it('should suggest retention metrics when retention_day detected', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'retention_day', detectedType: 'number', semanticType: 'retention_day', confidence: 0.85 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('Day 1 Retention');
            expect(metrics).toContain('Day 7 Retention');
        });

        it('should suggest level metrics when level detected', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'level', detectedType: 'number', semanticType: 'level', confidence: 0.85 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('Level Distribution');
            expect(metrics).toContain('Progression Speed');
        });

        it('should suggest funnel metrics when funnel_step detected', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'step', detectedType: 'string', semanticType: 'funnel_step', confidence: 0.85 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('Funnel Conversion');
            expect(metrics).toContain('Drop-off Rate');
        });

        it('should suggest error metrics when error_type detected', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'error_type', detectedType: 'string', semanticType: 'error_type', confidence: 0.85 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('Error Rate');
            expect(metrics).toContain('Crash-Free Users');
        });

        it('should return default metrics for unknown columns', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'custom', detectedType: 'string', semanticType: 'unknown', confidence: 0 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('Row Count');
            expect(metrics).toContain('Unique Values');
        });

        it('should combine metrics from multiple detected columns', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.85 },
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.85 },
            ];

            const metrics = analyzer.getSuggestedMetrics(meanings);

            expect(metrics).toContain('DAU');
            expect(metrics).toContain('Total Revenue');
        });

        it('should handle empty meanings array', () => {
            const metrics = analyzer.getSuggestedMetrics([]);

            expect(metrics).toContain('Row Count');
            expect(metrics).toContain('Unique Values');
        });
    });

    describe('confidence scores', () => {
        it('should return high confidence for pattern matches', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'user_id', type: 'string', nullable: false, sampleValues: ['u1'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].confidence).toBe(0.85);
        });

        it('should return medium confidence for type-based inference', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'random_date', type: 'date', nullable: false, sampleValues: [] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].confidence).toBe(0.7);
        });

        it('should return lower confidence for value-based inference', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'code', type: 'string', nullable: false, sampleValues: ['US', 'UK'] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].confidence).toBe(0.6);
        });
    });

    describe('detectedType preservation', () => {
        it('should preserve original column type in result', () => {
            const schema: SchemaInfo = {
                columns: [
                    { name: 'level', type: 'number', nullable: false, sampleValues: [1, 2] },
                    { name: 'user_id', type: 'string', nullable: false, sampleValues: ['u1'] },
                    { name: 'date', type: 'date', nullable: false, sampleValues: [] },
                ],
            };

            const result = analyzer.analyze(schema);

            expect(result[0].detectedType).toBe('number');
            expect(result[1].detectedType).toBe('string');
            expect(result[2].detectedType).toBe('date');
        });
    });
});
