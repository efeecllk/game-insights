/**
 * DataPipeline Unit Tests
 * Tests for the main data processing orchestrator
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataPipeline, PipelineConfig, dataPipeline } from '@/ai/DataPipeline';
import { NormalizedData } from '@/adapters/BaseAdapter';

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

// Create minimal game analytics data
function createGameData(rowCount: number = 100): NormalizedData {
    const rows = Array.from({ length: rowCount }, (_, i) => ({
        user_id: `user_${i % 20}`,
        event_name: ['level_complete', 'purchase', 'session_start'][i % 3],
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        level: Math.floor(Math.random() * 50) + 1,
        revenue: i % 5 === 0 ? Math.random() * 100 : 0,
        platform: i % 2 === 0 ? 'iOS' : 'Android',
        country: ['US', 'UK', 'DE', 'FR'][i % 4],
    }));

    return createTestData({
        rows,
        columns: ['user_id', 'event_name', 'timestamp', 'level', 'revenue', 'platform', 'country'],
    });
}

describe('DataPipeline', () => {
    let pipeline: DataPipeline;

    beforeEach(() => {
        pipeline = new DataPipeline();
    });

    // =========================================================================
    // Run Pipeline Tests
    // =========================================================================

    describe('run', () => {
        it('should complete pipeline with minimal config', async () => {
            const data = createGameData(50);
            const config: Partial<PipelineConfig> = {
                sampleSize: 50,
                autoClean: false,
            };

            const result = await pipeline.run(data, config);

            expect(result).toBeDefined();
            expect(result.sample).toBeDefined();
            expect(result.schema).toBeDefined();
            expect(result.columnMeanings).toBeDefined();
            expect(result.gameType).toBeDefined();
            expect(result.chartRecommendations).toBeDefined();
            expect(result.insights).toBeDefined();
        });

        it('should sample large datasets', async () => {
            const data = createGameData(5000);
            const config: Partial<PipelineConfig> = {
                sampleSize: 100,
            };

            const result = await pipeline.run(data, config);

            expect(result.sample.sampleRowCount).toBeLessThanOrEqual(100);
            expect(result.pipelineStats.originalRows).toBe(5000);
            expect(result.pipelineStats.sampledRows).toBeLessThanOrEqual(100);
        });

        it('should analyze schema and detect column meanings', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, { sampleSize: 50 });

            expect(result.schema.columns.length).toBeGreaterThan(0);
            expect(result.columnMeanings.length).toBeGreaterThan(0);

            // Should detect user_id column
            const userIdMeaning = result.columnMeanings.find(m => m.semanticType === 'user_id');
            expect(userIdMeaning).toBeDefined();
        });

        it('should detect game type', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, { sampleSize: 50 });

            expect(result.gameType).toBeDefined();
            expect(result.gameTypeConfidence).toBeGreaterThanOrEqual(0);
            expect(result.gameTypeConfidence).toBeLessThanOrEqual(1);
        });

        it('should calculate quality score', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, { sampleSize: 50, autoClean: false });

            expect(result.qualityBefore).toBeGreaterThanOrEqual(0);
            expect(result.qualityBefore).toBeLessThanOrEqual(100);
        });

        it('should auto-clean data when enabled', async () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', value: 100 },
                    { user_id: null, value: 200 }, // Missing user_id
                    { user_id: 'u3', value: null }, // Missing value
                ],
            });
            const result = await pipeline.run(data, { autoClean: true });

            expect(result.cleaningPlan).toBeDefined();
            // May or may not have cleaning result depending on issues found
        });

        it('should generate chart recommendations', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, { sampleSize: 50 });

            expect(result.chartRecommendations).toBeDefined();
            expect(Array.isArray(result.chartRecommendations)).toBe(true);
        });

        it('should generate dashboard layout', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, { sampleSize: 50 });

            expect(result.dashboardLayout).toBeDefined();
            expect(result.dashboardLayout?.kpis).toBeDefined();
            expect(result.dashboardLayout?.mainCharts).toBeDefined();
        });

        it('should generate insights', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, { sampleSize: 50 });

            expect(result.insights).toBeDefined();
            expect(Array.isArray(result.insights)).toBe(true);
        });

        it('should include pipeline stats', async () => {
            const data = createGameData(100);
            const result = await pipeline.run(data, { sampleSize: 50 });

            expect(result.pipelineStats).toBeDefined();
            expect(result.pipelineStats.originalRows).toBe(100);
            expect(result.pipelineStats.processingTimeMs).toBeGreaterThanOrEqual(0);
            expect(typeof result.pipelineStats.llmUsed).toBe('boolean');
        });
    });

    // =========================================================================
    // Phase 2 Features Tests
    // =========================================================================

    describe('phase 2 features', () => {
        it('should calculate metrics when enabled', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, {
                sampleSize: 50,
                calculateMetrics: true,
            });

            expect(result.metrics).toBeDefined();
        });

        it('should skip metrics when disabled', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, {
                sampleSize: 50,
                calculateMetrics: false,
            });

            expect(result.metrics).toBeUndefined();
        });

        it('should detect anomalies when enabled', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, {
                sampleSize: 50,
                detectAnomalies: true,
            });

            expect(result.anomalies).toBeDefined();
            expect(result.anomalyStats).toBeDefined();
        });

        it('should skip anomaly detection when disabled', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, {
                sampleSize: 50,
                detectAnomalies: false,
            });

            expect(result.anomalies).toBeUndefined();
            expect(result.anomalyStats).toBeUndefined();
        });

        it('should analyze cohorts when enabled', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, {
                sampleSize: 50,
                analyzeCohorts: true,
            });

            expect(result.availableCohortDimensions).toBeDefined();
            // Cohort analysis may or may not produce results depending on data
        });

        it('should skip cohort analysis when disabled', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, {
                sampleSize: 50,
                analyzeCohorts: false,
            });

            expect(result.cohortAnalysis).toBeUndefined();
            expect(result.availableCohortDimensions).toBeUndefined();
        });

        it('should detect funnels when enabled', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, {
                sampleSize: 50,
                detectFunnels: true,
            });

            expect(result.funnels).toBeDefined();
            expect(result.funnelStats).toBeDefined();
        });

        it('should skip funnel detection when disabled', async () => {
            const data = createGameData(50);
            const result = await pipeline.run(data, {
                sampleSize: 50,
                detectFunnels: false,
            });

            expect(result.funnels).toBeUndefined();
            expect(result.funnelStats).toBeUndefined();
        });
    });

    // =========================================================================
    // Analyze Only Tests
    // =========================================================================

    describe('analyze', () => {
        it('should return analysis results without cleaning', async () => {
            const data = createGameData(50);
            const result = await pipeline.analyze(data, 50);

            expect(result.columnMeanings).toBeDefined();
            expect(result.gameType).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.issues).toBeDefined();
            expect(result.qualityScore).toBeGreaterThanOrEqual(0);
        });

        it('should use custom sample size', async () => {
            const data = createGameData(1000);
            const result = await pipeline.analyze(data, 100);

            // Analysis should complete successfully with smaller sample
            expect(result.columnMeanings).toBeDefined();
        });
    });

    // =========================================================================
    // Clean Only Tests
    // =========================================================================

    describe('clean', () => {
        it('should clean data with approved actions', async () => {
            const data = createTestData({
                rows: [
                    { user_id: 'u1', value: 100 },
                    { user_id: 'u2', value: 200 },
                ],
            });
            const { columnMeanings } = await pipeline.analyze(data, 10);

            const result = await pipeline.clean(data, columnMeanings, 'all');

            expect(result.cleanedData).toBeDefined();
            expect(result.cleanedData.rows.length).toBeGreaterThanOrEqual(0);
        });
    });

    // =========================================================================
    // Individual Method Tests
    // =========================================================================

    describe('calculateMetrics', () => {
        it('should calculate metrics directly', () => {
            const data = createGameData(50);
            const pipeline = new DataPipeline();

            // First analyze to get column meanings
            const schema = {
                columns: data.columns.map(name => ({
                    name,
                    type: 'string' as const,
                    nullable: false,
                    sampleValues: data.rows.slice(0, 5).map(r => r[name]),
                })),
                rowCount: data.rows.length,
                sampleData: data.rows.slice(0, 10),
            };

            // Create basic column meanings
            const columnMeanings = [
                { column: 'user_id', semanticType: 'user_id' as const, confidence: 1 },
                { column: 'revenue', semanticType: 'revenue' as const, confidence: 1 },
            ];

            const metrics = pipeline.calculateMetrics(data, columnMeanings);

            expect(metrics).toBeDefined();
        });
    });

    describe('detectAnomalies', () => {
        it('should detect anomalies directly', () => {
            const data = createGameData(50);
            const columnMeanings = [
                { column: 'user_id', semanticType: 'user_id' as const, confidence: 1 },
                { column: 'revenue', semanticType: 'revenue' as const, confidence: 1 },
            ];

            const result = pipeline.detectAnomalies(data, columnMeanings);

            expect(result).toBeDefined();
            expect(result.anomalies).toBeDefined();
        });
    });

    describe('analyzeCohorts', () => {
        it('should analyze cohorts directly', () => {
            const data = createGameData(50);
            const columnMeanings = [
                { column: 'user_id', semanticType: 'user_id' as const, confidence: 1 },
                { column: 'timestamp', semanticType: 'timestamp' as const, confidence: 1 },
                { column: 'platform', semanticType: 'platform' as const, confidence: 1 },
            ];

            const result = pipeline.analyzeCohorts(data, columnMeanings);

            expect(result).toBeDefined();
        });

        it('should return null when no cohort dimensions available', () => {
            const data = createGameData(50);
            const columnMeanings = [
                { column: 'random', semanticType: 'unknown' as const, confidence: 1 },
            ];

            const result = pipeline.analyzeCohorts(data, columnMeanings);

            expect(result).toBeNull();
        });
    });

    describe('detectFunnels', () => {
        it('should detect funnels directly', () => {
            const data = createGameData(50);
            const columnMeanings = [
                { column: 'user_id', semanticType: 'user_id' as const, confidence: 1 },
                { column: 'level', semanticType: 'level' as const, confidence: 1 },
            ];

            const result = pipeline.detectFunnels(data, columnMeanings, 'puzzle');

            expect(result).toBeDefined();
            expect(result.detectedFunnels).toBeDefined();
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle empty data', async () => {
            const data = createTestData({ rows: [], columns: ['id'] });
            const result = await pipeline.run(data, { sampleSize: 10 });

            expect(result).toBeDefined();
            expect(result.pipelineStats.originalRows).toBe(0);
        });

        it('should handle single row data', async () => {
            const data = createTestData({
                rows: [{ user_id: 'u1', event: 'test' }],
            });
            const result = await pipeline.run(data, { sampleSize: 10 });

            expect(result).toBeDefined();
            expect(result.pipelineStats.originalRows).toBe(1);
        });

        it('should handle data with all null values', async () => {
            const data = createTestData({
                rows: [
                    { col1: null, col2: null },
                    { col1: null, col2: null },
                ],
            });
            const result = await pipeline.run(data, { sampleSize: 10 });

            expect(result).toBeDefined();
        });

        it('should handle errors in metric calculation gracefully', async () => {
            const data = createTestData({
                rows: [{ invalid: 'data' }],
            });

            // Should not throw
            const result = await pipeline.run(data, {
                sampleSize: 10,
                calculateMetrics: true,
            });

            expect(result).toBeDefined();
        });

        it('should handle errors in anomaly detection gracefully', async () => {
            const data = createTestData({
                rows: [{ invalid: 'data' }],
            });

            // Should not throw
            const result = await pipeline.run(data, {
                sampleSize: 10,
                detectAnomalies: true,
            });

            expect(result).toBeDefined();
        });

        it('should handle errors in cohort analysis gracefully', async () => {
            const data = createTestData({
                rows: [{ invalid: 'data' }],
            });

            // Should not throw
            const result = await pipeline.run(data, {
                sampleSize: 10,
                analyzeCohorts: true,
            });

            expect(result).toBeDefined();
        });

        it('should handle errors in funnel detection gracefully', async () => {
            const data = createTestData({
                rows: [{ invalid: 'data' }],
            });

            // Should not throw
            const result = await pipeline.run(data, {
                sampleSize: 10,
                detectFunnels: true,
            });

            expect(result).toBeDefined();
        });
    });

    // =========================================================================
    // Schema Building Tests
    // =========================================================================

    describe('schema building', () => {
        it('should detect number type', async () => {
            const data = createTestData({
                rows: [
                    { value: 100 },
                    { value: 200 },
                ],
            });
            const result = await pipeline.run(data, { sampleSize: 10 });

            const valueCol = result.schema.columns.find(c => c.name === 'value');
            expect(valueCol?.type).toBe('number');
        });

        it('should detect boolean type', async () => {
            const data = createTestData({
                rows: [
                    { active: true },
                    { active: false },
                ],
            });
            const result = await pipeline.run(data, { sampleSize: 10 });

            const activeCol = result.schema.columns.find(c => c.name === 'active');
            expect(activeCol?.type).toBe('boolean');
        });

        it('should detect date type', async () => {
            const data = createTestData({
                rows: [
                    { date: '2024-01-15' },
                    { date: '2024-01-16' },
                ],
            });
            const result = await pipeline.run(data, { sampleSize: 10 });

            const dateCol = result.schema.columns.find(c => c.name === 'date');
            expect(dateCol?.type).toBe('date');
        });

        it('should detect nullable columns', async () => {
            const data = createTestData({
                rows: [
                    { value: 100 },
                    { value: null },
                ],
            });
            const result = await pipeline.run(data, { sampleSize: 10 });

            const valueCol = result.schema.columns.find(c => c.name === 'value');
            expect(valueCol?.nullable).toBe(true);
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export dataPipeline singleton', () => {
            expect(dataPipeline).toBeInstanceOf(DataPipeline);
        });
    });
});
