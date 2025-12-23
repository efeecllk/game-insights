/**
 * Data Pipeline
 * Orchestrates the complete data processing flow:
 * Sample → Analyze → Clean → Validate → Dashboard
 */

import { NormalizedData, SchemaInfo } from '../adapters/BaseAdapter';
import { dataSampler, SampleResult } from './DataSampler';
import { dataCleaner, CleaningPlan, CleaningResult, CleaningAction } from './DataCleaner';
import { schemaAnalyzer, ColumnMeaning } from './SchemaAnalyzer';
import { gameTypeDetector } from './GameTypeDetector';
import { chartSelector, ChartRecommendation } from './ChartSelector';
import { insightGenerator, Insight } from './InsightGenerator';
import { GameCategory } from '../types';

export interface PipelineConfig {
    sampleSize: number;
    autoClean: boolean;
    approvedCleaningActions?: CleaningAction[] | 'all';
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

    // Step 6: Insights
    insights: Insight[];

    // Metadata
    pipelineStats: {
        originalRows: number;
        sampledRows: number;
        cleanedRows: number;
        processingTimeMs: number;
    };
}

export class DataPipeline {
    /**
     * Run complete data pipeline
     */
    async run(data: NormalizedData, config: PipelineConfig): Promise<PipelineResult> {
        const startTime = Date.now();

        // Step 1: Sample
        const sample = dataSampler.sample(data, {
            maxRows: config.sampleSize,
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

        if (config.autoClean && cleaningPlan.issues.length > 0) {
            cleaningResult = dataCleaner.clean(
                sample.sample,
                cleaningPlan,
                config.approvedCleaningActions || 'all'
            );
            qualityAfter = cleaningResult.qualityScoreAfter;
            dataForVisualization = cleaningResult.cleanedData;
        }

        // Step 5: Chart Recommendations
        const chartRecommendations = chartSelector.recommend(columnMeanings, detection.gameType);

        // Step 6: Generate Insights
        const insights = insightGenerator.generate(dataForVisualization, columnMeanings, detection.gameType);

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
            insights,
            pipelineStats: {
                originalRows: data.rows.length,
                sampledRows: sample.sampleRowCount,
                cleanedRows: cleaningResult?.cleanedData.rows.length || sample.sampleRowCount,
                processingTimeMs: endTime - startTime,
            }
        };
    }

    /**
     * Run analysis only (no cleaning)
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
