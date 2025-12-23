/**
 * Data Analyst - Main AI Orchestrator
 * Coordinates all AI modules to analyze data and generate dashboards
 */

import { SchemaInfo, NormalizedData } from '../adapters/BaseAdapter';
import { schemaAnalyzer, ColumnMeaning } from './SchemaAnalyzer';
import { gameTypeDetector } from './GameTypeDetector';
import { chartSelector, ChartRecommendation } from './ChartSelector';
import { insightGenerator, Insight } from './InsightGenerator';
import { GameCategory } from '../types';

export interface AnalysisResult {
    // Schema analysis
    schema: SchemaInfo;
    columnMeanings: ColumnMeaning[];
    suggestedMetrics: string[];

    // Game detection
    detectedGameType: GameCategory;
    gameTypeConfidence: number;
    detectionReasons: string[];

    // Visualization
    chartRecommendations: ChartRecommendation[];
    dashboardLayout: {
        kpis: ChartRecommendation[];
        mainCharts: ChartRecommendation[];
        sideCharts: ChartRecommendation[];
    };

    // Insights
    insights: Insight[];

    // Metadata
    analyzedAt: string;
    dataRowCount: number;
}

export class DataAnalyst {
    /**
     * Perform full analysis on data
     */
    async analyze(schema: SchemaInfo, data: NormalizedData): Promise<AnalysisResult> {
        // 1. Analyze schema
        const columnMeanings = schemaAnalyzer.analyze(schema);
        const suggestedMetrics = schemaAnalyzer.getSuggestedMetrics(columnMeanings);

        // 2. Detect game type
        const detection = gameTypeDetector.detect(columnMeanings);

        // 3. Get chart recommendations
        const chartRecommendations = chartSelector.recommend(columnMeanings, detection.gameType);
        const dashboardLayout = chartSelector.getDashboardLayout(chartRecommendations);

        // 4. Generate insights
        const insights = insightGenerator.generate(data, columnMeanings, detection.gameType);

        return {
            schema,
            columnMeanings,
            suggestedMetrics,
            detectedGameType: detection.gameType,
            gameTypeConfidence: detection.confidence,
            detectionReasons: detection.reasons,
            chartRecommendations,
            dashboardLayout,
            insights,
            analyzedAt: new Date().toISOString(),
            dataRowCount: data.rows.length,
        };
    }

    /**
     * Quick analysis for schema only (no data needed)
     */
    analyzeSchema(schema: SchemaInfo): {
        columnMeanings: ColumnMeaning[];
        detectedGameType: GameCategory;
        confidence: number;
    } {
        const columnMeanings = schemaAnalyzer.analyze(schema);
        const detection = gameTypeDetector.detect(columnMeanings);

        return {
            columnMeanings,
            detectedGameType: detection.gameType,
            confidence: detection.confidence,
        };
    }
}

export const dataAnalyst = new DataAnalyst();
