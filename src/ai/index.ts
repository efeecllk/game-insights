/**
 * AI Module Exports
 */

// Schema Analysis
export { schemaAnalyzer } from './SchemaAnalyzer';
export type { ColumnMeaning, SemanticType } from './SchemaAnalyzer';

// Game Detection
export { gameTypeDetector } from './GameTypeDetector';

// Chart Selection
export { chartSelector } from './ChartSelector';
export type { ChartRecommendation, ChartType } from './ChartSelector';

// Insight Generation
export { insightGenerator } from './InsightGenerator';
export type { Insight } from './InsightGenerator';

// Data Analysis
export { dataAnalyst, DataAnalyst } from './DataAnalyst';
export type { AnalysisResult } from './DataAnalyst';

// Data Sampling
export { dataSampler, DataSampler } from './DataSampler';
export type { SampleConfig, SampleResult, SamplingStrategy } from './DataSampler';

// Data Cleaning
export { dataCleaner, DataCleaner } from './DataCleaner';
export type {
    DataQualityIssue,
    CleaningPlan,
    CleaningResult,
    CleaningAction,
    DataIssue
} from './DataCleaner';

// Data Pipeline (Main Orchestrator)
export { dataPipeline, DataPipeline } from './DataPipeline';
export type { PipelineConfig, PipelineResult } from './DataPipeline';
