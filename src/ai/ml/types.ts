/**
 * ML Model Types
 * Core types for predictive analytics
 * Phase 5: Advanced AI & Automation
 */

// ============================================================================
// Feature Types
// ============================================================================

export interface UserFeatures {
    // Identity
    userId: string;
    cohort: string;

    // Activity
    sessionCount7d: number;
    sessionCount30d: number;
    sessionTrend: number; // -1 to 1, negative means declining
    lastSessionHoursAgo: number;
    avgSessionLength: number;
    totalPlayTime: number;

    // Progression
    currentLevel: number;
    maxLevelReached: number;
    progressionSpeed: number; // levels per day
    failureRate: number; // 0-1
    stuckAtLevel: boolean;

    // Monetization
    totalSpend: number;
    purchaseCount: number;
    avgPurchaseValue: number;
    daysSinceLastPurchase: number;
    isPayer: boolean;

    // Engagement
    daysActive: number;
    daysSinceFirstSession: number;
    weeklyActiveRatio: number; // active days / 7
    peakPlayHour: number;
    featureUsage: Record<string, number>;

    // Social (if available)
    friendCount?: number;
    guildMember?: boolean;
    pvpParticipation?: number;
}

export interface AggregateFeatures {
    // Time-based
    date: string;
    dayOfWeek: number;
    isWeekend: boolean;

    // User metrics
    dau: number;
    wau: number;
    mau: number;
    newUsers: number;
    returningUsers: number;

    // Retention
    d1Retention: number;
    d7Retention: number;
    d30Retention: number;

    // Monetization
    revenue: number;
    arpu: number;
    arppu: number;
    payerConversionRate: number;

    // Engagement
    avgSessionLength: number;
    avgSessionsPerUser: number;
    avgLevelReached: number;
}

// ============================================================================
// Prediction Types
// ============================================================================

export interface Prediction<T = number> {
    value: T;
    confidence: number; // 0-1
    range?: {
        low: T;
        high: T;
    };
    factors?: PredictionFactor[];
}

export interface PredictionFactor {
    name: string;
    impact: number; // -1 to 1
    description: string;
}

export interface ChurnPrediction extends Prediction<number> {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    daysUntilChurn?: number;
    preventionActions: string[];
}

export interface LTVPrediction extends Prediction<number> {
    segment: 'whale' | 'dolphin' | 'minnow' | 'non_payer';
    projectedSpend30d: number;
    projectedSpend90d: number;
    projectedSpend365d: number;
}

export interface RetentionPrediction extends Prediction<number> {
    cohortSize: number;
    retentionCurve: Array<{ day: number; retention: number }>;
    benchmarkComparison: 'above' | 'at' | 'below';
}

export interface RevenueForecast extends Prediction<number> {
    period: 'daily' | 'weekly' | 'monthly';
    breakdown: {
        existingUsers: number;
        newUsers: number;
        reactivated: number;
    };
    trend: 'growing' | 'stable' | 'declining';
    seasonalFactor: number;
}

// ============================================================================
// Anomaly Types
// ============================================================================

export interface Anomaly {
    id: string;
    metric: string;
    timestamp: string;
    value: number;
    expectedValue: number;
    expectedRange: [number, number];
    deviation: number; // standard deviations from mean
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'spike' | 'drop' | 'trend_break' | 'pattern_change';
    possibleCauses: string[];
}

// ============================================================================
// Segmentation Types
// ============================================================================

export interface UserSegment {
    id: string;
    name: string;
    description: string;
    criteria: SegmentCriteria[];
    userCount: number;
    percentage: number;
    characteristics: Record<string, number>;
}

export interface SegmentCriteria {
    feature: string;
    operator: 'gt' | 'lt' | 'eq' | 'between' | 'in';
    value: number | number[] | string[];
}

export type PredefinedSegment =
    | 'whale'
    | 'dolphin'
    | 'minnow'
    | 'non_payer'
    | 'highly_engaged'
    | 'casual'
    | 'at_risk'
    | 'churned'
    | 'new_user'
    | 'veteran';

// ============================================================================
// Model Configuration
// ============================================================================

export interface ModelConfig {
    // Training
    minDataPoints: number;
    lookbackDays: number;
    validationSplit: number;

    // Prediction
    confidenceThreshold: number;
    updateFrequency: 'realtime' | 'hourly' | 'daily';

    // Hyperparameters (model-specific)
    hyperparameters?: Record<string, number>;
}

export interface ModelMetrics {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
    r2?: number;
    auc?: number;
    lastTrainedAt: string;
    dataPointsUsed: number;
}

// ============================================================================
// Base Model Interface
// ============================================================================

export interface MLModel<TInput, TOutput> {
    name: string;
    version: string;
    config: ModelConfig;
    metrics?: ModelMetrics;

    // Core methods
    predict(input: TInput): Promise<TOutput>;
    train(data: TInput[]): Promise<ModelMetrics>;

    // Lifecycle
    initialize(): Promise<void>;
    save(): Promise<void>;
    load(): Promise<boolean>;

    // Evaluation
    evaluate(testData: TInput[]): Promise<ModelMetrics>;
    getFeatureImportance(): Record<string, number>;
}
