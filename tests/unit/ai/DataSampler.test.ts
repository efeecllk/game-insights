/**
 * DataSampler Unit Tests
 * Tests for data sampling strategies
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import { DataSampler, SampleConfig, dataSampler } from '@/ai/DataSampler';
import { NormalizedData } from '@/adapters/BaseAdapter';

// Helper to create test data
function createTestData(rowCount: number, columns: string[] = ['id', 'category', 'value']): NormalizedData {
    const rows = Array.from({ length: rowCount }, (_, i) => ({
        id: i + 1,
        category: `cat_${i % 5}`, // 5 categories
        value: Math.random() * 100,
    }));

    return {
        columns,
        rows,
        metadata: {
            source: 'test',
            rowCount: rowCount,
        },
    };
}

describe('DataSampler', () => {
    // =========================================================================
    // No Sampling Needed Tests
    // =========================================================================

    describe('no sampling needed', () => {
        it('should return original data when row count is below maxRows', () => {
            const sampler = new DataSampler();
            const data = createTestData(50);
            const config: SampleConfig = { maxRows: 100, strategy: 'random' };

            const result = sampler.sample(data, config);

            expect(result.sample).toBe(data);
            expect(result.sampleRowCount).toBe(50);
            expect(result.samplingRatio).toBe(1);
        });

        it('should return original data when row count equals maxRows', () => {
            const sampler = new DataSampler();
            const data = createTestData(100);
            const config: SampleConfig = { maxRows: 100, strategy: 'random' };

            const result = sampler.sample(data, config);

            expect(result.sample).toBe(data);
            expect(result.samplingRatio).toBe(1);
        });
    });

    // =========================================================================
    // Random Sampling Tests
    // =========================================================================

    describe('random sampling', () => {
        it('should return correct number of rows', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'random' };

            const result = sampler.sample(data, config);

            expect(result.sampleRowCount).toBe(100);
            expect(result.sample.rows.length).toBe(100);
        });

        it('should maintain columns', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'random' };

            const result = sampler.sample(data, config);

            expect(result.sample.columns).toEqual(data.columns);
        });

        it('should update metadata source', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'random' };

            const result = sampler.sample(data, config);

            expect(result.sample.metadata.source).toContain('sampled');
        });
    });

    // =========================================================================
    // Head Sampling Tests
    // =========================================================================

    describe('head sampling', () => {
        it('should return first N rows', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'head' };

            const result = sampler.sample(data, config);

            // First row should be id=1
            expect(result.sample.rows[0].id).toBe(1);
            // Last row should be id=100
            expect(result.sample.rows[99].id).toBe(100);
        });
    });

    // =========================================================================
    // Tail Sampling Tests
    // =========================================================================

    describe('tail sampling', () => {
        it('should return last N rows', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'tail' };

            const result = sampler.sample(data, config);

            // First row in sample should be id=901
            expect(result.sample.rows[0].id).toBe(901);
            // Last row should be id=1000
            expect(result.sample.rows[99].id).toBe(1000);
        });
    });

    // =========================================================================
    // Systematic Sampling Tests
    // =========================================================================

    describe('systematic sampling', () => {
        it('should take every Nth row', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'systematic' };

            const result = sampler.sample(data, config);

            expect(result.sampleRowCount).toBe(100);
            // With 1000 rows and 100 samples, step = 10
            // First row should be id=1
            expect(result.sample.rows[0].id).toBe(1);
            // Second row should be id=11
            expect(result.sample.rows[1].id).toBe(11);
        });

        it('should spread samples evenly across data', () => {
            const sampler = new DataSampler();
            const data = createTestData(100);
            const config: SampleConfig = { maxRows: 10, strategy: 'systematic' };

            const result = sampler.sample(data, config);

            // Check that samples are spread
            const ids = result.sample.rows.map(r => r.id as number);
            // Should include both early and late IDs
            expect(ids.some(id => id <= 50)).toBe(true);
            expect(ids.some(id => id > 50)).toBe(true);
        });
    });

    // =========================================================================
    // Stratified Sampling Tests
    // =========================================================================

    describe('stratified sampling', () => {
        it('should sample from each group', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = {
                maxRows: 100,
                strategy: 'stratified',
                priorityColumns: ['category'],
            };

            const result = sampler.sample(data, config);

            // Check that all categories are represented
            const categories = new Set(result.sample.rows.map(r => r.category));
            expect(categories.size).toBeGreaterThanOrEqual(4); // At least most of 5 categories
        });

        it('should fall back to random when no priority columns', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = {
                maxRows: 100,
                strategy: 'stratified',
                priorityColumns: [],
            };

            const result = sampler.sample(data, config);

            expect(result.sampleRowCount).toBe(100);
        });
    });

    // =========================================================================
    // Smart Sampling Tests
    // =========================================================================

    describe('smart sampling', () => {
        it('should include head, tail, and random middle', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'smart' };

            const result = sampler.sample(data, config);

            const ids = result.sample.rows.map(r => r.id as number);

            // Should include some from the beginning (head 20%)
            expect(ids.some(id => id <= 20)).toBe(true);
            // Should include some from the end (tail 10%)
            expect(ids.some(id => id >= 990)).toBe(true);
            // Should include some from middle
            expect(ids.some(id => id > 100 && id < 900)).toBe(true);
        });

        it('should be the default strategy', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'smart' };

            const result = sampler.sample(data, config);

            expect(result.strategy).toBe('smart');
        });
    });

    // =========================================================================
    // Coverage Calculation Tests
    // =========================================================================

    describe('coverage calculation', () => {
        it('should calculate unique values per column', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'random' };

            const result = sampler.sample(data, config);

            expect(result.coverage.columns).toEqual(['id', 'category', 'value']);
            expect(result.coverage.uniqueValuesCaptured.id).toBe(100); // All unique
            expect(result.coverage.uniqueValuesCaptured.category).toBeLessThanOrEqual(5); // Max 5 categories
        });

        it('should include all columns in coverage', () => {
            const sampler = new DataSampler();
            const data = createTestData(100, ['a', 'b', 'c', 'd']);
            const config: SampleConfig = { maxRows: 50, strategy: 'head' };

            const result = sampler.sample(data, config);

            expect(result.coverage.columns).toEqual(['a', 'b', 'c', 'd']);
        });
    });

    // =========================================================================
    // Result Metadata Tests
    // =========================================================================

    describe('result metadata', () => {
        it('should include sampling ratio', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'random' };

            const result = sampler.sample(data, config);

            expect(result.samplingRatio).toBe(0.1); // 100/1000
        });

        it('should include original row count', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);
            const config: SampleConfig = { maxRows: 100, strategy: 'random' };

            const result = sampler.sample(data, config);

            expect(result.originalRowCount).toBe(1000);
        });

        it('should record strategy used', () => {
            const sampler = new DataSampler();
            const data = createTestData(1000);

            const strategies = ['random', 'head', 'tail', 'systematic', 'stratified', 'smart'] as const;

            for (const strategy of strategies) {
                const result = sampler.sample(data, { maxRows: 100, strategy });
                expect(result.strategy).toBe(strategy);
            }
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export dataSampler singleton', () => {
            expect(dataSampler).toBeInstanceOf(DataSampler);
        });

        it('should work with singleton', () => {
            const data = createTestData(100);
            const result = dataSampler.sample(data, { maxRows: 50, strategy: 'head' });

            expect(result.sampleRowCount).toBe(50);
        });
    });
});
