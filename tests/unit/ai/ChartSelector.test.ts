/**
 * ChartSelector Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import { ChartSelector, ChartType } from '../../../src/ai/ChartSelector';
import { ColumnMeaning } from '../../../src/ai/SchemaAnalyzer';

describe('ChartSelector', () => {
    const selector = new ChartSelector();

    describe('recommend', () => {
        it('should recommend revenue over time chart for revenue + timestamp', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.9 },
                { column: 'date', detectedType: 'date', semanticType: 'timestamp', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            const revenueChart = result.find(r => r.title === 'Revenue Over Time');
            expect(revenueChart).toBeDefined();
            expect(revenueChart?.chartType).toBe('area');
            expect(revenueChart?.columns).toContain('revenue');
            expect(revenueChart?.columns).toContain('date');
        });

        it('should recommend DAU chart for user_id + timestamp', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
                { column: 'date', detectedType: 'date', semanticType: 'timestamp', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            const dauChart = result.find(r => r.title === 'Daily Active Users');
            expect(dauChart).toBeDefined();
            expect(dauChart?.chartType).toBe('line');
        });

        it('should recommend retention curve for retention_day', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'retention', detectedType: 'number', semanticType: 'retention_day', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            const retentionChart = result.find(r => r.title === 'Retention Curve');
            expect(retentionChart).toBeDefined();
            expect(retentionChart?.chartType).toBe('bar');
        });

        it('should recommend funnel chart for funnel_step + conversion', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'step', detectedType: 'string', semanticType: 'funnel_step', confidence: 0.9 },
                { column: 'converted', detectedType: 'number', semanticType: 'conversion', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            const funnelChart = result.find(r => r.title === 'Conversion Funnel');
            expect(funnelChart).toBeDefined();
            expect(funnelChart?.chartType).toBe('funnel');
        });

        it('should recommend KPI charts for single metrics', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.9 },
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
                { column: 'session_id', detectedType: 'string', semanticType: 'session_id', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            const revenueKpi = result.find(r => r.title === 'Total Revenue');
            const usersKpi = result.find(r => r.title === 'Total Users');
            const sessionsKpi = result.find(r => r.title === 'Total Sessions');

            expect(revenueKpi?.chartType).toBe('kpi');
            expect(usersKpi?.chartType).toBe('kpi');
            expect(sessionsKpi?.chartType).toBe('kpi');
        });

        it('should recommend pie chart for country distribution', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'country', detectedType: 'string', semanticType: 'country', confidence: 0.9 },
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            const countryChart = result.find(r => r.title === 'Users by Country');
            expect(countryChart?.chartType).toBe('pie');
        });

        it('should recommend donut chart for platform distribution', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'platform', detectedType: 'string', semanticType: 'platform', confidence: 0.9 },
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            const platformChart = result.find(r => r.title === 'Platform Distribution');
            expect(platformChart?.chartType).toBe('donut');
        });

        it('should recommend histogram for level distribution', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'level', detectedType: 'number', semanticType: 'level', confidence: 0.9 },
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            const levelChart = result.find(r => r.title === 'Level Distribution');
            expect(levelChart?.chartType).toBe('histogram');
        });

        it('should boost priority for game-specific charts', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'step', detectedType: 'string', semanticType: 'funnel_step', confidence: 0.9 },
                { column: 'converted', detectedType: 'number', semanticType: 'conversion', confidence: 0.9 },
            ];

            const customResult = selector.recommend(meanings, 'custom');
            const puzzleResult = selector.recommend(meanings, 'puzzle');

            const customFunnel = customResult.find(r => r.chartType === 'funnel');
            const puzzleFunnel = puzzleResult.find(r => r.chartType === 'funnel');

            // Puzzle games boost funnel charts
            expect(puzzleFunnel?.priority).toBeGreaterThan(customFunnel?.priority || 0);
        });

        it('should return max 8 recommendations', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.9 },
                { column: 'date', detectedType: 'date', semanticType: 'timestamp', confidence: 0.9 },
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
                { column: 'session_id', detectedType: 'string', semanticType: 'session_id', confidence: 0.9 },
                { column: 'country', detectedType: 'string', semanticType: 'country', confidence: 0.9 },
                { column: 'platform', detectedType: 'string', semanticType: 'platform', confidence: 0.9 },
                { column: 'level', detectedType: 'number', semanticType: 'level', confidence: 0.9 },
                { column: 'retention', detectedType: 'number', semanticType: 'retention_day', confidence: 0.9 },
                { column: 'step', detectedType: 'string', semanticType: 'funnel_step', confidence: 0.9 },
                { column: 'converted', detectedType: 'number', semanticType: 'conversion', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            expect(result.length).toBeLessThanOrEqual(8);
        });

        it('should sort recommendations by priority descending', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.9 },
                { column: 'date', detectedType: 'date', semanticType: 'timestamp', confidence: 0.9 },
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            for (let i = 1; i < result.length; i++) {
                expect(result[i].priority).toBeLessThanOrEqual(result[i - 1].priority);
            }
        });

        it('should return empty array when no matching templates', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'custom', detectedType: 'string', semanticType: 'unknown', confidence: 0 },
            ];

            const result = selector.recommend(meanings, 'custom');

            expect(result).toHaveLength(0);
        });

        it('should handle empty meanings array', () => {
            const result = selector.recommend([], 'custom');

            expect(result).toHaveLength(0);
        });

        it('should cap priority at 10', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.9 },
                { column: 'date', detectedType: 'date', semanticType: 'timestamp', confidence: 0.9 },
            ];

            // Area charts are boosted for idle games
            const result = selector.recommend(meanings, 'idle');

            for (const rec of result) {
                expect(rec.priority).toBeLessThanOrEqual(10);
            }
        });

        it('should include description for each recommendation', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.9 },
                { column: 'date', detectedType: 'date', semanticType: 'timestamp', confidence: 0.9 },
            ];

            const result = selector.recommend(meanings, 'custom');

            for (const rec of result) {
                expect(rec.description).toBeDefined();
                expect(rec.description.length).toBeGreaterThan(0);
            }
        });
    });

    describe('getDashboardLayout', () => {
        it('should separate KPIs from other charts', () => {
            const recommendations = [
                { chartType: 'kpi' as ChartType, title: 'Revenue', description: '', priority: 8, columns: ['revenue'] },
                { chartType: 'line' as ChartType, title: 'DAU', description: '', priority: 9, columns: ['users'] },
            ];

            const layout = selector.getDashboardLayout(recommendations);

            expect(layout.kpis).toHaveLength(1);
            expect(layout.kpis[0].chartType).toBe('kpi');
        });

        it('should classify line/area/bar/funnel as main charts', () => {
            const recommendations = [
                { chartType: 'line' as ChartType, title: 'Line', description: '', priority: 9, columns: [] },
                { chartType: 'area' as ChartType, title: 'Area', description: '', priority: 9, columns: [] },
                { chartType: 'bar' as ChartType, title: 'Bar', description: '', priority: 8, columns: [] },
                { chartType: 'funnel' as ChartType, title: 'Funnel', description: '', priority: 8, columns: [] },
            ];

            const layout = selector.getDashboardLayout(recommendations);

            expect(layout.mainCharts.length).toBeLessThanOrEqual(2);
            expect(['line', 'area', 'bar', 'funnel']).toContain(layout.mainCharts[0].chartType);
        });

        it('should classify pie/donut/histogram/scatter as side charts', () => {
            const recommendations = [
                { chartType: 'pie' as ChartType, title: 'Pie', description: '', priority: 5, columns: [] },
                { chartType: 'donut' as ChartType, title: 'Donut', description: '', priority: 5, columns: [] },
                { chartType: 'histogram' as ChartType, title: 'Histogram', description: '', priority: 4, columns: [] },
                { chartType: 'scatter' as ChartType, title: 'Scatter', description: '', priority: 4, columns: [] },
            ];

            const layout = selector.getDashboardLayout(recommendations);

            expect(layout.sideCharts.length).toBeLessThanOrEqual(2);
            expect(['pie', 'donut', 'histogram', 'scatter']).toContain(layout.sideCharts[0].chartType);
        });

        it('should limit KPIs to 4', () => {
            const recommendations = Array.from({ length: 6 }, (_, i) => ({
                chartType: 'kpi' as ChartType,
                title: `KPI ${i}`,
                description: '',
                priority: 8,
                columns: [],
            }));

            const layout = selector.getDashboardLayout(recommendations);

            expect(layout.kpis.length).toBeLessThanOrEqual(4);
        });

        it('should limit main charts to 2', () => {
            const recommendations = [
                { chartType: 'line' as ChartType, title: 'Line 1', description: '', priority: 9, columns: [] },
                { chartType: 'line' as ChartType, title: 'Line 2', description: '', priority: 8, columns: [] },
                { chartType: 'area' as ChartType, title: 'Area', description: '', priority: 7, columns: [] },
            ];

            const layout = selector.getDashboardLayout(recommendations);

            expect(layout.mainCharts.length).toBeLessThanOrEqual(2);
        });

        it('should limit side charts to 2', () => {
            const recommendations = [
                { chartType: 'pie' as ChartType, title: 'Pie 1', description: '', priority: 5, columns: [] },
                { chartType: 'pie' as ChartType, title: 'Pie 2', description: '', priority: 4, columns: [] },
                { chartType: 'donut' as ChartType, title: 'Donut', description: '', priority: 3, columns: [] },
            ];

            const layout = selector.getDashboardLayout(recommendations);

            expect(layout.sideCharts.length).toBeLessThanOrEqual(2);
        });

        it('should handle empty recommendations', () => {
            const layout = selector.getDashboardLayout([]);

            expect(layout.kpis).toHaveLength(0);
            expect(layout.mainCharts).toHaveLength(0);
            expect(layout.sideCharts).toHaveLength(0);
        });
    });
});
