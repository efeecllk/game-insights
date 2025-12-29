/**
 * Data Pipeline
 * Orchestrates the complete data processing flow:
 * Sample → Analyze → Clean → Metrics → Anomalies → Cohorts → Funnels → Insights
 */

import { NormalizedData, SchemaInfo } from '../adapters/BaseAdapter';
import { dataSampler, SampleResult } from './DataSampler';
import { dataCleaner, CleaningPlan, CleaningResult, CleaningAction } from './DataCleaner';
import { schemaAnalyzer, ColumnMeaning } from './SchemaAnalyzer';
import { gameTypeDetector } from './GameTypeDetector';
import { chartSelector, ChartRecommendation } from './ChartSelector';
import { insightGenerator, Insight } from './InsightGenerator';
import { metricCalculator, CalculatedMetrics } from './MetricCalculator';
import { anomalyDetector, Anomaly, AnomalyDetectionResult, DetectionConfig } from './AnomalyDetector';
import { cohortAnalyzer, CohortAnalysisResult } from './CohortAnalyzer';
import { funnelDetector, DetectedFunnel, FunnelAnalysisResult } from './FunnelDetector';
import { GameCategory } from '../types';
import { LLMConfig } from '../services/llm';

// ============ TYPES ============

export interface PipelineConfig {
    // Existing config
    sampleSize: number;
    autoClean: boolean;
    approvedCleaningActions?: CleaningAction[] | 'all';

    // Phase 2 config
    calculateMetrics?: boolean;
    detectAnomalies?: boolean;
    analyzeCohorts?: boolean;
    detectFunnels?: boolean;
    useLLM?: boolean;
    llmConfig?: LLMConfig;

    // Anomaly detection config
    anomalyConfig?: DetectionConfig;
}

export interface PipelineResult {
    // Step 1: Sampling
    sample: SampleResult;

    // Step 2: Schema Analysis
    schema: SchemaInfo;
    columnMeanings: ColumnMeaning[];

    // Step 3: Game Detection
    gameType: GameCategory;
    gameTypeConfidence: number;

    // Step 4: Data Quality & Cleaning
    qualityBefore: number;
    cleaningPlan: CleaningPlan;
    cleaningResult?: CleaningResult;
    qualityAfter?: number;

    // Step 5: Visualization
    chartRecommendations: ChartRecommendation[];
    dashboardLayout?: {
        kpis: ChartRecommendation[];
        mainCharts: ChartRecommendation[];
        sideCharts: ChartRecommendation[];
    };

    // Step 6: Insights
    insights: Insight[];

    // ============ PHASE 2 ADDITIONS ============

    // Step 7: Calculated Metrics
    metrics?: CalculatedMetrics;

    // Step 8: Anomaly Detection
    anomalies?: Anomaly[];
    anomalyStats?: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };

    // Step 9: Cohort Analysis
    cohortAnalysis?: CohortAnalysisResult;
    availableCohortDimensions?: import('./CohortAnalyzer').CohortDefinition[];

    // Step 10: Funnel Detection
    funnels?: DetectedFunnel[];
    funnelStats?: {
        detected: number;
        avgCompletionRate: number;
    };

    // Metadata
    pipelineStats: {
        originalRows: number;
        sampledRows: number;
        cleanedRows: number;
        processingTimeMs: number;
        llmUsed: boolean;
    };
}

// Default pipeline config
const DEFAULT_CONFIG: Required<PipelineConfig> = {
    sampleSize: 1000,
    autoClean: true,
    approvedCleaningActions: 'all',
    calculateMetrics: true,
    detectAnomalies: true,
    analyzeCohorts: true,
    detectFunnels: true,
    useLLM: false,
    llmConfig: undefined as unknown as LLMConfig,
    anomalyConfig: undefined as unknown as DetectionConfig,
};

// ============ DATA PIPELINE CLASS ============

export class DataPipeline {
    /**
     * Run complete data pipeline
     */
    async run(data: NormalizedData, config: Partial<PipelineConfig>): Promise<PipelineResult> {
        const startTime = Date.now();
        const fullConfig = { ...DEFAULT_CONFIG, ...config };

        // Step 1: Sample
        const sample = dataSampler.sample(data, {
            maxRows: fullConfig.sampleSize,
            strategy: 'smart',
        });

        // Step 2: Analyze Schema
        const schema = this.buildSchema(sample.sample);
        const columnMeanings = schemaAnalyzer.analyze(schema);

        // Step 3: Detect Game Type
        const detection = gameTypeDetector.detect(columnMeanings);

        // Step 4: Quality Analysis & Cleaning
        const qualityBefore = dataCleaner.calculateQualityScore(sample.sample.rows);
        const cleaningPlan = dataCleaner.analyze(sample.sample, columnMeanings);

        let cleaningResult: CleaningResult | undefined;
        let qualityAfter: number | undefined;
        let dataForVisualization = sample.sample;

        if (fullConfig.autoClean && cleaningPlan.issues.length > 0) {
            cleaningResult = dataCleaner.clean(
                sample.sample,
                cleaningPlan,
                fullConfig.approvedCleaningActions || 'all'
            );
            qualityAfter = cleaningResult.qualityScoreAfter;
            dataForVisualization = cleaningResult.cleanedData;
        }

        // Step 5: Chart Recommendations
        const chartRecommendations = chartSelector.recommend(columnMeanings, detection.gameType);
        const dashboardLayout = chartSelector.getDashboardLayout(chartRecommendations);

        // ============ PHASE 2 STEPS ============

        // Step 7: Calculate Metrics
        let metrics: CalculatedMetrics | undefined;
        if (fullConfig.calculateMetrics) {
            try {
                metrics = metricCalculator.calculate(dataForVisualization, columnMeanings);
            } catch (error) {
                console.warn('Metric calculation failed:', error);
            }
        }

        // Step 8: Detect Anomalies
        let anomalies: Anomaly[] | undefined;
        let anomalyStats: PipelineResult['anomalyStats'];
        if (fullConfig.detectAnomalies) {
            try {
                const anomalyResult = anomalyDetector.detect(
                    dataForVisualization,
                    columnMeanings,
                    fullConfig.anomalyConfig
                );
                anomalies = anomalyResult.anomalies;
                anomalyStats = {
                    total: anomalies.length,
                    critical: anomalies.filter(a => a.severity === 'critical').length,
                    high: anomalies.filter(a => a.severity === 'high').length,
                    medium: anomalies.filter(a => a.severity === 'medium').length,
                    low: anomalies.filter(a => a.severity === 'low').length,
                };
            } catch (error) {
                console.warn('Anomaly detection failed:', error);
            }
        }

        // Step 9: Cohort Analysis
        let cohortAnalysis: CohortAnalysisResult | undefined;
        let availableCohortDimensions: import('./CohortAnalyzer').CohortDefinition[] | undefined;
        if (fullConfig.analyzeCohorts) {
            try {
                const dimensions = cohortAnalyzer.suggestCohortDimensions(columnMeanings);
                availableCohortDimensions = dimensions;
                if (dimensions.length > 0) {
                    cohortAnalysis = cohortAnalyzer.analyze(dataForVisualization, columnMeanings, dimensions[0]);
                }
            } catch (error) {
                console.warn('Cohort analysis failed:', error);
            }
        }

        // Step 10: Funnel Detection
        let funnels: DetectedFunnel[] | undefined;
        let funnelStats: PipelineResult['funnelStats'];
        if (fullConfig.detectFunnels) {
            try {
                const funnelResult = funnelDetector.detect(dataForVisualization, columnMeanings, detection.gameType);
                funnels = funnelResult.detectedFunnels;
                funnelStats = {
                    detected: funnels.length,
                    avgCompletionRate: funnels.length > 0
                        ? funnels.reduce((sum, f) => sum + f.completionRate, 0) / funnels.length
                        : 0,
                };
            } catch (error) {
                console.warn('Funnel detection failed:', error);
            }
        }

        // Step 6/11: Generate Insights (now async and LLM-aware)
        let insights: Insight[];
        let llmUsed = false;

        try {
            if (fullConfig.useLLM) {
                // Use LLM-powered insights with all context
                insights = await insightGenerator.generate(
                    dataForVisualization,
                    columnMeanings,
                    detection.gameType,
                    metrics,
                    anomalies
                );
                llmUsed = insights.some(i => i.source === 'llm');
            } else {
                // Use template-only insights
                insights = insightGenerator.generateTemplateInsights(
                    dataForVisualization,
                    columnMeanings,
                    detection.gameType
                );
            }
        } catch (error) {
            console.warn('Insight generation failed, using fallback:', error);
            insights = insightGenerator.generateTemplateInsights(
                dataForVisualization,
                columnMeanings,
                detection.gameType
            );
        }

        const endTime = Date.now();

        return {
            sample,
            schema,
            columnMeanings,
            gameType: detection.gameType,
            gameTypeConfidence: detection.confidence,
            qualityBefore,
            cleaningPlan,
            cleaningResult,
            qualityAfter,
            chartRecommendations,
            dashboardLayout,
            insights,
            metrics,
            anomalies,
            anomalyStats,
            cohortAnalysis,
            availableCohortDimensions,
            funnels,
            funnelStats,
            pipelineStats: {
                originalRows: data.rows.length,
                sampledRows: sample.sampleRowCount,
                cleanedRows: cleaningResult?.cleanedData.rows.length || sample.sampleRowCount,
                processingTimeMs: endTime - startTime,
                llmUsed,
            }
        };
    }

    /**
     * Run analysis only (no cleaning, no Phase 2 features)
     */
    async analyze(data: NormalizedData, sampleSize: number = 500): Promise<{
        columnMeanings: ColumnMeaning[];
        gameType: GameCategory;
        confidence: number;
        issues: CleaningPlan['issues'];
        qualityScore: number;
    }> {
        const sample = dataSampler.sample(data, { maxRows: sampleSize, strategy: 'smart' });
        const schema = this.buildSchema(sample.sample);
        const columnMeanings = schemaAnalyzer.analyze(schema);
        const detection = gameTypeDetector.detect(columnMeanings);
        const cleaningPlan = dataCleaner.analyze(sample.sample, columnMeanings);
        const qualityScore = dataCleaner.calculateQualityScore(sample.sample.rows);

        return {
            columnMeanings,
            gameType: detection.gameType,
            confidence: detection.confidence,
            issues: cleaningPlan.issues,
            qualityScore,
        };
    }

    /**
     * Run cleaning only with pre-analyzed data
     */
    async clean(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        approvedActions: CleaningAction[] | 'all'
    ): Promise<CleaningResult> {
        const cleaningPlan = dataCleaner.analyze(data, columnMeanings);
        return dataCleaner.clean(data, cleaningPlan, approvedActions);
    }

    /**
     * Run metrics calculation only
     */
    calculateMetrics(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[]
    ): CalculatedMetrics {
        return metricCalculator.calculate(data, columnMeanings);
    }

    /**
     * Run anomaly detection only
     */
    detectAnomalies(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[]
    ): AnomalyDetectionResult {
        return anomalyDetector.detect(data, columnMeanings);
    }

    /**
     * Run cohort analysis only
     */
    analyzeCohorts(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[]
    ): CohortAnalysisResult | null {
        const dimensions = cohortAnalyzer.suggestCohortDimensions(columnMeanings);
        if (dimensions.length === 0) return null;
        return cohortAnalyzer.analyze(data, columnMeanings, dimensions[0]);
    }

    /**
     * Run funnel detection only
     */
    detectFunnels(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        gameType: GameCategory
    ): FunnelAnalysisResult {
        return funnelDetector.detect(data, columnMeanings, gameType);
    }

    /**
     * Build schema from data
     */
    private buildSchema(data: NormalizedData): SchemaInfo {
        if (data.rows.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        return {
            columns: data.columns.map(name => {
                const sampleValues = data.rows.slice(0, 10).map(row => row[name]);
                const nonNull = sampleValues.filter(v => v !== null && v !== undefined);
                let type: 'string' | 'number' | 'boolean' | 'date' | 'unknown' = 'unknown';

                if (nonNull.length > 0) {
                    const first = nonNull[0];
                    if (typeof first === 'number') type = 'number';
                    else if (typeof first === 'boolean') type = 'boolean';
                    else if (typeof first === 'string') {
                        if (!isNaN(Date.parse(first)) && first.includes('-')) type = 'date';
                        else type = 'string';
                    }
                }

                return {
                    name,
                    type,
                    nullable: sampleValues.some(v => v === null || v === undefined),
                    sampleValues,
                };
            }),
            rowCount: data.rows.length,
            sampleData: data.rows.slice(0, 10),
        };
    }
}

export const dataPipeline = new DataPipeline();
