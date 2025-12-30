/**
 * ML Studio Types
 * Core type definitions for training jobs, models, and pipelines
 */

// ============================================================================
// Model Types
// ============================================================================

export type ModelType =
    | 'retention'
    | 'churn'
    | 'ltv'
    | 'revenue'
    | 'segmentation'
    | 'anomaly'
    | 'custom';

export type ModelStatus =
    | 'draft'
    | 'training'
    | 'completed'
    | 'failed'
    | 'deployed'
    | 'archived';

export type ModelAlgorithm =
    | 'logistic_regression'
    | 'random_forest'
    | 'gradient_boosting'
    | 'neural_network'
    | 'kmeans'
    | 'isolation_forest'
    | 'linear_regression'
    | 'decision_tree';

// ============================================================================
// Feature Configuration
// ============================================================================

export interface FeatureConfig {
    /** Column name */
    name: string;
    /** Data type */
    type: 'numeric' | 'categorical' | 'datetime' | 'text';
    /** Role in training */
    role: 'feature' | 'target' | 'id' | 'timestamp' | 'ignore';
    /** Handle missing values */
    missingStrategy: 'drop' | 'mean' | 'median' | 'mode' | 'zero' | 'custom';
    /** Custom missing value (if strategy is 'custom') */
    customMissingValue?: string | number;
    /** Encoding for categorical */
    encoding?: 'onehot' | 'label' | 'target';
    /** Scaling for numeric */
    scaling?: 'standard' | 'minmax' | 'robust' | 'none';
    /** Importance score from training (0-1) */
    importance?: number;
}

// ============================================================================
// Training Configuration
// ============================================================================

export interface TrainingConfig {
    /** Model type */
    modelType: ModelType;
    /** Algorithm to use */
    algorithm: ModelAlgorithm;
    /** Train/validation split ratio */
    trainSplit: number;
    /** Use cross-validation */
    crossValidation: boolean;
    /** Number of CV folds */
    cvFolds: number;
    /** Random seed for reproducibility */
    randomSeed: number;
    /** Hyperparameters */
    hyperparameters: Record<string, number | string | boolean>;
    /** Early stopping */
    earlyStoppingRounds?: number;
    /** Max training time in seconds */
    maxTrainingTime?: number;
}

export interface TrainingMetrics {
    /** Accuracy (classification) */
    accuracy?: number;
    /** Precision (classification) */
    precision?: number;
    /** Recall (classification) */
    recall?: number;
    /** F1 Score (classification) */
    f1Score?: number;
    /** AUC-ROC (classification) */
    aucRoc?: number;
    /** Mean Absolute Error (regression) */
    mae?: number;
    /** Root Mean Square Error (regression) */
    rmse?: number;
    /** R-squared (regression) */
    r2?: number;
    /** Silhouette Score (clustering) */
    silhouetteScore?: number;
    /** Inertia (clustering) */
    inertia?: number;
    /** Training loss over epochs */
    lossHistory?: number[];
    /** Validation loss over epochs */
    valLossHistory?: number[];
    /** Confusion matrix (classification) */
    confusionMatrix?: number[][];
}

// ============================================================================
// Training Job
// ============================================================================

export interface TrainingJob {
    /** Unique job ID */
    id: string;
    /** Job name */
    name: string;
    /** Description */
    description?: string;
    /** Status */
    status: ModelStatus;
    /** Model type */
    modelType: ModelType;
    /** Created timestamp */
    createdAt: string;
    /** Started timestamp */
    startedAt?: string;
    /** Completed timestamp */
    completedAt?: string;
    /** Feature configuration */
    features: FeatureConfig[];
    /** Training configuration */
    config: TrainingConfig;
    /** Source data ID (from dataStore) */
    dataSourceId?: string;
    /** Training metrics */
    metrics?: TrainingMetrics;
    /** Current training progress (0-100) */
    progress: number;
    /** Current epoch/iteration */
    currentEpoch?: number;
    /** Total epochs/iterations */
    totalEpochs?: number;
    /** Error message if failed */
    error?: string;
    /** Training logs */
    logs: TrainingLogEntry[];
    /** Time taken in seconds */
    trainingTime?: number;
}

export interface TrainingLogEntry {
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    data?: Record<string, unknown>;
}

// ============================================================================
// Deployed Model
// ============================================================================

export interface DeployedModel {
    /** Unique model ID */
    id: string;
    /** Model name */
    name: string;
    /** Description */
    description?: string;
    /** Model type */
    modelType: ModelType;
    /** Algorithm used */
    algorithm: ModelAlgorithm;
    /** Version number */
    version: number;
    /** Training job ID this was created from */
    trainingJobId: string;
    /** Deployed timestamp */
    deployedAt: string;
    /** Created timestamp */
    createdAt: string;
    /** Is currently active */
    isActive: boolean;
    /** Features used */
    features: FeatureConfig[];
    /** Training configuration used */
    config: TrainingConfig;
    /** Final training metrics */
    metrics: TrainingMetrics;
    /** Serialized model (base64 or JSON) */
    modelData?: string;
    /** Model weights (for neural networks) */
    weights?: number[][];
    /** Model coefficients (for linear models) */
    coefficients?: number[];
    /** Usage statistics */
    usageStats: {
        totalPredictions: number;
        lastUsed?: string;
        avgLatencyMs?: number;
    };
}

// ============================================================================
// Pipeline
// ============================================================================

export type PipelineStepType =
    | 'data_source'
    | 'feature_engineering'
    | 'training'
    | 'evaluation'
    | 'deployment'
    | 'monitoring';

export interface PipelineStep {
    /** Step ID */
    id: string;
    /** Step type */
    type: PipelineStepType;
    /** Step name */
    name: string;
    /** Configuration */
    config: Record<string, unknown>;
    /** Dependencies (step IDs) */
    dependsOn: string[];
    /** Status */
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    /** Output from this step */
    output?: Record<string, unknown>;
}

export interface Pipeline {
    /** Pipeline ID */
    id: string;
    /** Pipeline name */
    name: string;
    /** Description */
    description?: string;
    /** Created timestamp */
    createdAt: string;
    /** Last run timestamp */
    lastRunAt?: string;
    /** Steps in order */
    steps: PipelineStep[];
    /** Schedule (cron expression) */
    schedule?: string;
    /** Is enabled */
    enabled: boolean;
    /** Run history */
    runHistory: PipelineRun[];
}

export interface PipelineRun {
    /** Run ID */
    id: string;
    /** Started timestamp */
    startedAt: string;
    /** Completed timestamp */
    completedAt?: string;
    /** Status */
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    /** Step statuses */
    stepStatuses: Record<string, 'pending' | 'running' | 'completed' | 'failed' | 'skipped'>;
    /** Error if failed */
    error?: string;
}

// ============================================================================
// Prediction
// ============================================================================

export interface PredictionInput {
    /** Model ID to use */
    modelId: string;
    /** Input features */
    features: Record<string, unknown>;
}

export interface PredictionOutput {
    /** Predicted value */
    prediction: number | string | number[];
    /** Confidence/probability */
    confidence?: number;
    /** Probabilities per class (classification) */
    classProbabilities?: Record<string, number>;
    /** Feature contributions (explainability) */
    featureContributions?: Record<string, number>;
    /** Prediction timestamp */
    timestamp: string;
    /** Latency in ms */
    latencyMs: number;
}

// ============================================================================
// Model Registry
// ============================================================================

export interface ModelVersion {
    version: number;
    modelId: string;
    createdAt: string;
    metrics: TrainingMetrics;
    isProduction: boolean;
    notes?: string;
}

export interface ModelRegistry {
    /** Model name (unique identifier) */
    name: string;
    /** Model type */
    modelType: ModelType;
    /** All versions */
    versions: ModelVersion[];
    /** Current production version */
    productionVersion?: number;
    /** Staging version (for A/B testing) */
    stagingVersion?: number;
    /** Created timestamp */
    createdAt: string;
    /** Updated timestamp */
    updatedAt: string;
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
    modelType: 'churn',
    algorithm: 'gradient_boosting',
    trainSplit: 0.8,
    crossValidation: true,
    cvFolds: 5,
    randomSeed: 42,
    hyperparameters: {
        n_estimators: 100,
        max_depth: 6,
        learning_rate: 0.1,
    },
    earlyStoppingRounds: 10,
    maxTrainingTime: 300,
};

export const ALGORITHM_CONFIGS: Record<ModelAlgorithm, {
    name: string;
    description: string;
    supportedTypes: ModelType[];
    defaultParams: Record<string, number | string | boolean>;
}> = {
    logistic_regression: {
        name: 'Logistic Regression',
        description: 'Fast, interpretable linear classifier',
        supportedTypes: ['churn', 'retention', 'custom'],
        defaultParams: { C: 1.0, max_iter: 1000 },
    },
    random_forest: {
        name: 'Random Forest',
        description: 'Ensemble of decision trees, robust and accurate',
        supportedTypes: ['churn', 'retention', 'ltv', 'revenue', 'custom'],
        defaultParams: { n_estimators: 100, max_depth: 10, min_samples_split: 2 },
    },
    gradient_boosting: {
        name: 'Gradient Boosting',
        description: 'Powerful sequential ensemble, best for tabular data',
        supportedTypes: ['churn', 'retention', 'ltv', 'revenue', 'custom'],
        defaultParams: { n_estimators: 100, max_depth: 6, learning_rate: 0.1 },
    },
    neural_network: {
        name: 'Neural Network',
        description: 'Deep learning model for complex patterns',
        supportedTypes: ['churn', 'retention', 'ltv', 'revenue', 'custom'],
        defaultParams: { hidden_layers: '64,32', epochs: 50, batch_size: 32, learning_rate: 0.001 },
    },
    kmeans: {
        name: 'K-Means',
        description: 'Unsupervised clustering algorithm',
        supportedTypes: ['segmentation'],
        defaultParams: { n_clusters: 5, max_iter: 300 },
    },
    isolation_forest: {
        name: 'Isolation Forest',
        description: 'Anomaly detection using isolation trees',
        supportedTypes: ['anomaly'],
        defaultParams: { n_estimators: 100, contamination: 0.1 },
    },
    linear_regression: {
        name: 'Linear Regression',
        description: 'Simple linear model for regression',
        supportedTypes: ['ltv', 'revenue', 'custom'],
        defaultParams: { fit_intercept: true },
    },
    decision_tree: {
        name: 'Decision Tree',
        description: 'Single tree, highly interpretable',
        supportedTypes: ['churn', 'retention', 'ltv', 'revenue', 'custom'],
        defaultParams: { max_depth: 10, min_samples_split: 2 },
    },
};

export const MODEL_TYPE_INFO: Record<ModelType, {
    name: string;
    description: string;
    targetType: 'classification' | 'regression' | 'clustering' | 'detection';
    recommendedAlgorithms: ModelAlgorithm[];
}> = {
    retention: {
        name: 'Retention Prediction',
        description: 'Predict if users will return after N days',
        targetType: 'classification',
        recommendedAlgorithms: ['gradient_boosting', 'random_forest', 'logistic_regression'],
    },
    churn: {
        name: 'Churn Prediction',
        description: 'Predict which users are likely to churn',
        targetType: 'classification',
        recommendedAlgorithms: ['gradient_boosting', 'random_forest', 'neural_network'],
    },
    ltv: {
        name: 'LTV Prediction',
        description: 'Predict lifetime value of users',
        targetType: 'regression',
        recommendedAlgorithms: ['gradient_boosting', 'random_forest', 'linear_regression'],
    },
    revenue: {
        name: 'Revenue Forecasting',
        description: 'Forecast future revenue',
        targetType: 'regression',
        recommendedAlgorithms: ['gradient_boosting', 'neural_network', 'linear_regression'],
    },
    segmentation: {
        name: 'User Segmentation',
        description: 'Cluster users into meaningful segments',
        targetType: 'clustering',
        recommendedAlgorithms: ['kmeans'],
    },
    anomaly: {
        name: 'Anomaly Detection',
        description: 'Detect unusual patterns in metrics',
        targetType: 'detection',
        recommendedAlgorithms: ['isolation_forest'],
    },
    custom: {
        name: 'Custom Model',
        description: 'Build a custom model with any target',
        targetType: 'classification',
        recommendedAlgorithms: ['gradient_boosting', 'random_forest', 'neural_network'],
    },
};
