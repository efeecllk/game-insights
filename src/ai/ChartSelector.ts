/**
 * Chart Selector
 * Recommends optimal chart types based on detected data
 */

import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';
import { GameCategory } from '../types';

export type ChartType =
    | 'line' | 'bar' | 'area' | 'pie' | 'donut'
    | 'funnel' | 'heatmap' | 'scatter' | 'gauge'
    | 'kpi' | 'table' | 'histogram';

export interface ChartRecommendation {
    chartType: ChartType;
    title: string;
    description: string;
    priority: number; // 1-10, higher = more important
    columns: string[];
    config?: Record<string, unknown>;
}

// Chart templates by semantic type combinations
const CHART_TEMPLATES: {
    requires: SemanticType[];
    optional?: SemanticType[];
    chart: ChartType;
    title: string;
    priority: number;
}[] = [
        { requires: ['revenue', 'timestamp'], chart: 'area', title: 'Revenue Over Time', priority: 10 },
        { requires: ['user_id', 'timestamp'], chart: 'line', title: 'Daily Active Users', priority: 9 },
        { requires: ['retention_day'], chart: 'bar', title: 'Retention Curve', priority: 9 },
        { requires: ['funnel_step', 'conversion'], chart: 'funnel', title: 'Conversion Funnel', priority: 8 },
        { requires: ['level', 'user_id'], chart: 'histogram', title: 'Level Distribution', priority: 7 },
        { requires: ['revenue'], chart: 'kpi', title: 'Total Revenue', priority: 8 },
        { requires: ['user_id'], chart: 'kpi', title: 'Total Users', priority: 7 },
        { requires: ['session_id'], chart: 'kpi', title: 'Total Sessions', priority: 6 },
        { requires: ['country', 'user_id'], chart: 'pie', title: 'Users by Country', priority: 5 },
        { requires: ['platform', 'user_id'], chart: 'donut', title: 'Platform Distribution', priority: 5 },
        { requires: ['category', 'revenue'], chart: 'bar', title: 'Revenue by Category', priority: 6 },
        { requires: ['item_id', 'quantity'], chart: 'bar', title: 'Top Items', priority: 6 },
        { requires: ['error_type'], chart: 'pie', title: 'Error Types', priority: 4 },
        { requires: ['score', 'user_id'], chart: 'scatter', title: 'Score Distribution', priority: 4 },
        { requires: ['arpu', 'timestamp'], chart: 'line', title: 'ARPU Trend', priority: 7 },
        { requires: ['ltv', 'cohort'], chart: 'heatmap', title: 'LTV by Cohort', priority: 8 },
    ];

// Game-specific priority boosts
const GAME_PRIORITY_BOOSTS: Record<GameCategory, ChartType[]> = {
    puzzle: ['funnel', 'histogram', 'line'],
    idle: ['area', 'bar', 'gauge'],
    battle_royale: ['scatter', 'histogram', 'kpi'],
    match3_meta: ['funnel', 'pie', 'bar'],
    gacha_rpg: ['pie', 'donut', 'bar'],
    custom: [],
};

export class ChartSelector {
    /**
     * Get chart recommendations for data
     */
    recommend(meanings: ColumnMeaning[], gameType: GameCategory): ChartRecommendation[] {
        const semanticTypes = new Set(meanings.map(m => m.semanticType));
        const columnMap = new Map(meanings.map(m => [m.semanticType, m.column]));

        const recommendations: ChartRecommendation[] = [];

        for (const template of CHART_TEMPLATES) {
            // Check if all required types exist
            if (!template.requires.every(t => semanticTypes.has(t))) continue;

            // Get column names
            const columns = template.requires.map(t => columnMap.get(t)!);

            // Calculate priority with game boost
            let priority = template.priority;
            if (GAME_PRIORITY_BOOSTS[gameType]?.includes(template.chart)) {
                priority += 2;
            }

            recommendations.push({
                chartType: template.chart,
                title: template.title,
                description: `Based on ${template.requires.join(', ')} columns`,
                priority: Math.min(priority, 10),
                columns,
            });
        }

        // Sort by priority
        recommendations.sort((a, b) => b.priority - a.priority);

        // Return top recommendations (max 8)
        return recommendations.slice(0, 8);
    }

    /**
     * Get default dashboard layout
     */
    getDashboardLayout(recommendations: ChartRecommendation[]): {
        kpis: ChartRecommendation[];
        mainCharts: ChartRecommendation[];
        sideCharts: ChartRecommendation[];
    } {
        const kpis = recommendations.filter(r => r.chartType === 'kpi').slice(0, 4);
        const mainCharts = recommendations
            .filter(r => ['line', 'area', 'bar', 'funnel'].includes(r.chartType))
            .slice(0, 2);
        const sideCharts = recommendations
            .filter(r => ['pie', 'donut', 'histogram', 'scatter'].includes(r.chartType))
            .slice(0, 2);

        return { kpis, mainCharts, sideCharts };
    }
}

export const chartSelector = new ChartSelector();
