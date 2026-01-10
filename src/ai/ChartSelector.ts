/**
 * Chart Selector
 * Recommends optimal chart types based on detected data
 * Enhanced with:
 * - Always-include essential visualizations (revenue, retention, segmentation, funnel)
 * - Confidence scores for recommendations
 * - Game-specific visualization priorities
 * - Dashboard layout optimization
 */

import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';
import { GameCategory } from '../types';

export type ChartType =
    | 'line' | 'bar' | 'area' | 'pie' | 'donut'
    | 'funnel' | 'heatmap' | 'scatter' | 'gauge'
    | 'kpi' | 'table' | 'histogram' | 'cohort_heatmap';

export interface ChartRecommendation {
    chartType: ChartType;
    title: string;
    description: string;
    priority: number; // 1-10, higher = more important
    columns: string[];
    config?: Record<string, unknown>;
    confidence: number; // 0-1 confidence in this recommendation
    essential: boolean; // Whether this chart should always be included
    category: 'kpi' | 'trend' | 'distribution' | 'funnel' | 'comparison';
}

// Essential charts that should always be included if data supports them
const ESSENTIAL_CHARTS: {
    requires: SemanticType[];
    chart: ChartType;
    title: string;
    category: ChartRecommendation['category'];
    description: string;
}[] = [
    {
        requires: ['revenue', 'timestamp'],
        chart: 'area',
        title: 'Revenue Over Time',
        category: 'trend',
        description: 'Track revenue trends to identify growth patterns and seasonal effects',
    },
    {
        requires: ['user_id', 'timestamp'],
        chart: 'cohort_heatmap',
        title: 'Retention Cohort Heatmap',
        category: 'comparison',
        description: 'Visualize user retention by cohort to identify engagement patterns',
    },
    {
        requires: ['revenue', 'user_id'],
        chart: 'pie',
        title: 'User Segmentation by Spend',
        category: 'distribution',
        description: 'Whale/Dolphin/Minnow breakdown to understand revenue concentration',
    },
    {
        requires: ['funnel_step'],
        chart: 'funnel',
        title: 'Conversion Funnel',
        category: 'funnel',
        description: 'Track user progression through key conversion steps',
    },
    {
        requires: ['level', 'user_id'],
        chart: 'funnel',
        title: 'Level Progression Funnel',
        category: 'funnel',
        description: 'Identify where players drop off in level progression',
    },
];

// Chart templates by semantic type combinations
const CHART_TEMPLATES: {
    requires: SemanticType[];
    optional?: SemanticType[];
    chart: ChartType;
    title: string;
    priority: number;
    category: ChartRecommendation['category'];
    description: string;
}[] = [
    // Revenue & Monetization
    { requires: ['revenue', 'timestamp'], chart: 'area', title: 'Revenue Over Time', priority: 10, category: 'trend', description: 'Daily/weekly revenue trends' },
    { requires: ['revenue'], chart: 'kpi', title: 'Total Revenue', priority: 9, category: 'kpi', description: 'Total revenue in the dataset' },
    { requires: ['revenue', 'user_id'], chart: 'bar', title: 'ARPU & ARPPU', priority: 9, category: 'kpi', description: 'Average revenue per user metrics' },
    { requires: ['category', 'revenue'], chart: 'bar', title: 'Revenue by Category', priority: 7, category: 'distribution', description: 'Revenue breakdown by product/category' },
    { requires: ['revenue', 'country'], chart: 'bar', title: 'Revenue by Country', priority: 6, category: 'distribution', description: 'Geographic revenue distribution' },

    // Users & Engagement
    { requires: ['user_id', 'timestamp'], chart: 'line', title: 'Daily Active Users', priority: 9, category: 'trend', description: 'DAU trend over time' },
    { requires: ['user_id'], chart: 'kpi', title: 'Total Users', priority: 8, category: 'kpi', description: 'Total unique users' },
    { requires: ['session_id'], chart: 'kpi', title: 'Total Sessions', priority: 7, category: 'kpi', description: 'Total session count' },
    { requires: ['session_id', 'user_id'], chart: 'histogram', title: 'Sessions per User', priority: 6, category: 'distribution', description: 'Distribution of session frequency' },
    { requires: ['session_duration'], chart: 'histogram', title: 'Session Length Distribution', priority: 6, category: 'distribution', description: 'How long sessions typically last' },

    // Retention
    { requires: ['retention_day'], chart: 'bar', title: 'Retention Curve', priority: 10, category: 'trend', description: 'D1, D7, D30 retention rates' },
    { requires: ['user_id', 'timestamp'], chart: 'cohort_heatmap', title: 'Retention Cohort Heatmap', priority: 9, category: 'comparison', description: 'Retention by install cohort' },

    // Progression
    { requires: ['level', 'user_id'], chart: 'histogram', title: 'Level Distribution', priority: 7, category: 'distribution', description: 'Player distribution across levels' },
    { requires: ['level', 'user_id'], chart: 'funnel', title: 'Level Funnel', priority: 8, category: 'funnel', description: 'Drop-off at each level milestone' },

    // Funnels
    { requires: ['funnel_step', 'conversion'], chart: 'funnel', title: 'Conversion Funnel', priority: 9, category: 'funnel', description: 'Key conversion steps' },

    // Demographics
    { requires: ['country', 'user_id'], chart: 'pie', title: 'Users by Country', priority: 5, category: 'distribution', description: 'Geographic user distribution' },
    { requires: ['platform', 'user_id'], chart: 'donut', title: 'Platform Distribution', priority: 6, category: 'distribution', description: 'iOS vs Android breakdown' },

    // Items & Content
    { requires: ['item_id', 'quantity'], chart: 'bar', title: 'Top Items', priority: 6, category: 'comparison', description: 'Most purchased/used items' },
    { requires: ['item_id', 'revenue'], chart: 'bar', title: 'Top Revenue Items', priority: 7, category: 'comparison', description: 'Highest revenue items' },

    // Quality
    { requires: ['error_type'], chart: 'pie', title: 'Error Types', priority: 4, category: 'distribution', description: 'Error distribution for debugging' },

    // Game-specific
    { requires: ['banner', 'revenue'], chart: 'bar', title: 'Banner Performance', priority: 8, category: 'comparison', description: 'Revenue by gacha banner' },
    { requires: ['kills', 'user_id'], chart: 'histogram', title: 'Kill Distribution', priority: 6, category: 'distribution', description: 'Player kill performance' },
    { requires: ['placement'], chart: 'histogram', title: 'Match Placement', priority: 6, category: 'distribution', description: 'Where players typically finish' },
    { requires: ['booster', 'level'], chart: 'heatmap', title: 'Booster Usage by Level', priority: 7, category: 'comparison', description: 'Which levels need boosters' },
];

// Game-specific priority boosts
const GAME_PRIORITY_BOOSTS: Record<GameCategory, { chartTypes: ChartType[]; boost: number }> = {
    puzzle: { chartTypes: ['funnel', 'histogram', 'line', 'heatmap'], boost: 2 },
    idle: { chartTypes: ['area', 'bar', 'gauge', 'line'], boost: 2 },
    battle_royale: { chartTypes: ['scatter', 'histogram', 'kpi', 'bar'], boost: 2 },
    match3_meta: { chartTypes: ['funnel', 'pie', 'bar', 'heatmap'], boost: 2 },
    gacha_rpg: { chartTypes: ['pie', 'donut', 'bar', 'funnel'], boost: 2 },
    custom: { chartTypes: [], boost: 0 },
};

// Game-specific essential charts
const GAME_ESSENTIAL_CHARTS: Record<GameCategory, string[]> = {
    puzzle: ['Level Funnel', 'Booster Usage by Level', 'Level Distribution'],
    idle: ['Revenue Over Time', 'Session Length Distribution', 'Daily Active Users'],
    battle_royale: ['Match Placement', 'Kill Distribution', 'Sessions per User'],
    match3_meta: ['Level Funnel', 'Users by Country', 'Revenue by Category'],
    gacha_rpg: ['Banner Performance', 'User Segmentation by Spend', 'Revenue Over Time'],
    custom: ['Revenue Over Time', 'Daily Active Users', 'Total Users'],
};

export class ChartSelector {
    /**
     * Get chart recommendations for data
     * Now ensures essential visualizations are always included
     */
    recommend(meanings: ColumnMeaning[], gameType: GameCategory): ChartRecommendation[] {
        const semanticTypes = new Set(meanings.map(m => m.semanticType));
        const columnMap = new Map(meanings.map(m => [m.semanticType, m.column]));

        const recommendations: ChartRecommendation[] = [];
        const addedCharts = new Set<string>();

        // First, add essential charts if data supports them
        for (const essential of ESSENTIAL_CHARTS) {
            if (!essential.requires.every(t => semanticTypes.has(t))) continue;

            const columns = essential.requires.map(t => columnMap.get(t)!);
            const key = `${essential.chart}-${essential.title}`;

            if (!addedCharts.has(key)) {
                recommendations.push({
                    chartType: essential.chart,
                    title: essential.title,
                    description: essential.description,
                    priority: 10,
                    columns,
                    confidence: 0.95,
                    essential: true,
                    category: essential.category,
                });
                addedCharts.add(key);
            }
        }

        // Then add template-based recommendations
        for (const template of CHART_TEMPLATES) {
            if (!template.requires.every(t => semanticTypes.has(t))) continue;

            const columns = template.requires.map(t => columnMap.get(t)!);
            const key = `${template.chart}-${template.title}`;

            // Skip if already added as essential
            if (addedCharts.has(key)) continue;

            // Calculate priority with game boost
            let priority = template.priority;
            const gameBoost = GAME_PRIORITY_BOOSTS[gameType];
            if (gameBoost?.chartTypes.includes(template.chart)) {
                priority += gameBoost.boost;
            }

            // Boost priority for game-specific essential charts
            const gameEssentials = GAME_ESSENTIAL_CHARTS[gameType] || [];
            if (gameEssentials.includes(template.title)) {
                priority += 2;
            }

            // Calculate confidence based on column match quality
            const columnConfidence = meanings
                .filter(m => template.requires.includes(m.semanticType))
                .reduce((sum, m) => sum + m.confidence, 0) / template.requires.length;

            recommendations.push({
                chartType: template.chart,
                title: template.title,
                description: template.description,
                priority: Math.min(priority, 10),
                columns,
                confidence: columnConfidence,
                essential: gameEssentials.includes(template.title),
                category: template.category,
            });
            addedCharts.add(key);
        }

        // Sort by priority (essential first, then by priority score)
        recommendations.sort((a, b) => {
            if (a.essential !== b.essential) return a.essential ? -1 : 1;
            return b.priority - a.priority;
        });

        // Return top recommendations (max 12 for comprehensive dashboards)
        return recommendations.slice(0, 12);
    }

    /**
     * Get default dashboard layout optimized for impact
     */
    getDashboardLayout(recommendations: ChartRecommendation[]): {
        kpis: ChartRecommendation[];
        mainCharts: ChartRecommendation[];
        sideCharts: ChartRecommendation[];
        secondaryCharts: ChartRecommendation[];
    } {
        // Always prioritize essential charts
        const essential = recommendations.filter(r => r.essential);
        const nonEssential = recommendations.filter(r => !r.essential);

        // KPIs (up to 4)
        const kpis = recommendations
            .filter(r => r.chartType === 'kpi')
            .slice(0, 4);

        // Main charts: trends and funnels (essential first)
        const mainChartTypes: ChartType[] = ['line', 'area', 'bar', 'funnel', 'cohort_heatmap'];
        const mainCharts = [
            ...essential.filter(r => mainChartTypes.includes(r.chartType)),
            ...nonEssential.filter(r => mainChartTypes.includes(r.chartType)),
        ].slice(0, 3);

        // Side charts: distributions and comparisons
        const sideChartTypes: ChartType[] = ['pie', 'donut', 'histogram', 'scatter'];
        const sideCharts = [
            ...essential.filter(r => sideChartTypes.includes(r.chartType)),
            ...nonEssential.filter(r => sideChartTypes.includes(r.chartType)),
        ].slice(0, 3);

        // Secondary charts: anything remaining that's high priority
        const usedCharts = new Set([...kpis, ...mainCharts, ...sideCharts].map(r => r.title));
        const secondaryCharts = recommendations
            .filter(r => !usedCharts.has(r.title) && r.priority >= 6)
            .slice(0, 4);

        return { kpis, mainCharts, sideCharts, secondaryCharts };
    }

    /**
     * Get recommended charts for a specific category
     */
    getChartsByCategory(
        recommendations: ChartRecommendation[],
        category: ChartRecommendation['category']
    ): ChartRecommendation[] {
        return recommendations
            .filter(r => r.category === category)
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get essential charts that are supported by the data
     */
    getEssentialCharts(recommendations: ChartRecommendation[]): ChartRecommendation[] {
        return recommendations.filter(r => r.essential);
    }

    /**
     * Calculate overall visualization confidence
     */
    getVisualizationConfidence(recommendations: ChartRecommendation[]): number {
        if (recommendations.length === 0) return 0;

        const essentialCount = recommendations.filter(r => r.essential).length;
        const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;

        // Weight: 60% essential coverage, 40% average confidence
        const essentialCoverage = Math.min(essentialCount / 4, 1); // Max 4 essential charts
        return essentialCoverage * 0.6 + avgConfidence * 0.4;
    }
}

export const chartSelector = new ChartSelector();
