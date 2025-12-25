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

// Insight Generation (Enhanced with LLM)
export { insightGenerator, InsightGenerator } from './InsightGenerator';
export type { Insight, EnhancedInsight, InsightGeneratorConfig } from './InsightGenerator';

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

// ============ NEW PHASE 2 MODULES ============

// Metric Calculator
export { metricCalculator, MetricCalculator } from './MetricCalculator';
export type {
    MetricConfig,
    RetentionMetrics,
    EngagementMetrics,
    MonetizationMetrics,
    ProgressionMetrics,
    CalculatedMetrics
} from './MetricCalculator';

// Anomaly Detector
export { anomalyDetector, AnomalyDetector } from './AnomalyDetector';
export type {
    Anomaly,
    AnomalySeverity,
    AnomalyType,
    AnomalyThresholds,
    AnomalyDetectionResult,
    DetectionConfig
} from './AnomalyDetector';

// Cohort Analyzer
export { cohortAnalyzer, CohortAnalyzer } from './CohortAnalyzer';
export type {
    CohortDimension,
    CohortGranularity,
    CohortDefinition,
    CohortData,
    CohortMetrics,
    CohortComparison,
    CohortAnalysisResult
} from './CohortAnalyzer';

// Funnel Detector
export { funnelDetector, FunnelDetector } from './FunnelDetector';
export type {
    FunnelStep,
    DetectedFunnel,
    FunnelOptimization,
    FunnelAnalysisResult
} from './FunnelDetector';

// Question Answering
export { questionAnswering, QuestionAnswering } from './QuestionAnswering';
export type {
    Question,
    Answer,
    QuestionResult
} from './QuestionAnswering';
