/**
 * Churn Predictor
 * Predicts user churn probability and identifies at-risk users
 * Phase 5: Advanced AI & Automation
 */

import type {
    UserFeatures,
    ChurnPrediction,
    ModelConfig,
    ModelMetrics,
    PredictionFactor,
} from './types';

// ============================================================================
// Types
// ============================================================================

interface ChurnTrainingData {
    features: UserFeatures;
    churned: boolean;
    daysUntilChurn?: number;
}

// ============================================================================
// Feature Weights (learned from training)
// ============================================================================

interface FeatureWeight {
    weight: number;
    threshold?: number;
    direction: 'positive' | 'negative'; // positive = higher value = more churn
}

const DEFAULT_WEIGHTS: Record<string, FeatureWeight> = {
    sessionTrend: { weight: 0.20, direction: 'negative' }, // Declining sessions = higher churn
    lastSessionHoursAgo: { weight: 0.18, threshold: 72, direction: 'positive' },
    failureRate: { weight: 0.12, threshold: 0.5, direction: 'positive' },
    stuckAtLevel: { weight: 0.10, direction: 'positive' },
    weeklyActiveRatio: { weight: 0.15, direction: 'negative' },
    progressionSpeed: { weight: 0.08, direction: 'negative' },
    daysActive: { weight: 0.07, direction: 'negative' },
    isPayer: { weight: 0.05, direction: 'negative' },
    daysSinceLastPurchase: { weight: 0.05, threshold: 30, direction: 'positive' },
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ModelConfig = {
    minDataPoints: 500,
    lookbackDays: 14,
    validationSplit: 0.2,
    confidenceThreshold: 0.7,
    updateFrequency: 'daily',
    hyperparameters: {
        churnThresholdDays: 7, // Days of inactivity = churned
        predictionHorizon: 7, // Predict churn in next N days
    },
};

// ============================================================================
// Churn Predictor Class
// ============================================================================

export class ChurnPredictor {
    name = 'ChurnPredictor';
    version = '1.0.0';
    config: ModelConfig;
    metrics?: ModelMetrics;

    private weights: Record<string, FeatureWeight> = DEFAULT_WEIGHTS;
    private meanFeatures: Partial<UserFeatures> = {};
    private stdFeatures: Partial<UserFeatures> = {};

    constructor(config: Partial<ModelConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    async initialize(): Promise<void> {
        await this.load();
    }

    // ========================================================================
    // Prediction
    // ========================================================================

    /**
     * Predict churn probability for a single user
     */
    predict(features: UserFeatures): ChurnPrediction {
        const score = this.calculateChurnScore(features);
        const riskLevel = this.scoreToRiskLevel(score);
        const factors = this.identifyChurnFactors(features);
        const confidence = this.calculateConfidence(features);

        // Estimate days until churn based on activity trend
        const daysUntilChurn = this.estimateDaysUntilChurn(features, score);

        // Generate prevention actions
        const preventionActions = this.generatePreventionActions(factors);

        return {
            value: score,
            confidence,
            riskLevel,
            daysUntilChurn,
            preventionActions,
            factors,
            range: {
                low: Math.max(0, score - 0.1),
                high: Math.min(1, score + 0.1),
            },
        };
    }

    /**
     * Predict churn for multiple users and segment them
     */
    predictBatch(userFeatures: UserFeatures[]): {
        predictions: Map<string, ChurnPrediction>;
        segments: {
            critical: UserFeatures[];
            high: UserFeatures[];
            medium: UserFeatures[];
            low: UserFeatures[];
        };
        summary: {
            totalUsers: number;
            atRiskCount: number;
            atRiskPercentage: number;
            avgChurnScore: number;
        };
    } {
        const predictions = new Map<string, ChurnPrediction>();
        const segments = {
            critical: [] as UserFeatures[],
            high: [] as UserFeatures[],
            medium: [] as UserFeatures[],
            low: [] as UserFeatures[],
        };

        let totalScore = 0;
        let atRiskCount = 0;

        for (const features of userFeatures) {
            const prediction = this.predict(features);
            predictions.set(features.userId, prediction);
            totalScore += prediction.value;

            if (prediction.value >= 0.5) atRiskCount++;

            segments[prediction.riskLevel].push(features);
        }

        return {
            predictions,
            segments,
            summary: {
                totalUsers: userFeatures.length,
                atRiskCount,
                atRiskPercentage: (atRiskCount / userFeatures.length) * 100,
                avgChurnScore: totalScore / userFeatures.length,
            },
        };
    }

    /**
     * Get users most likely to churn in next N days
     */
    getAtRiskUsers(
        userFeatures: UserFeatures[],
        limit: number = 100,
        minRiskLevel: 'medium' | 'high' | 'critical' = 'high'
    ): Array<{ user: UserFeatures; prediction: ChurnPrediction }> {
        const riskThresholds = {
            medium: 0.4,
            high: 0.6,
            critical: 0.8,
        };

        const threshold = riskThresholds[minRiskLevel];

        return userFeatures
            .map(features => ({
                user: features,
                prediction: this.predict(features),
            }))
            .filter(({ prediction }) => prediction.value >= threshold)
            .sort((a, b) => b.prediction.value - a.prediction.value)
            .slice(0, limit);
    }

    // ========================================================================
    // Training
    // ========================================================================

    async train(data: ChurnTrainingData[]): Promise<ModelMetrics> {
        if (data.length < this.config.minDataPoints) {
            throw new Error(`Insufficient data: need at least ${this.config.minDataPoints} users`);
        }

        // Calculate feature statistics
        this.calculateFeatureStats(data.map(d => d.features));

        // Split data
        const splitIdx = Math.floor(data.length * (1 - this.config.validationSplit));
        const trainData = data.slice(0, splitIdx);
        const testData = data.slice(splitIdx);

        // Train weights using gradient descent
        this.trainWeights(trainData);

        // Evaluate
        const metrics = this.evaluateModel(testData);

        this.metrics = {
            ...metrics,
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: data.length,
        };

        await this.save();

        return this.metrics;
    }

    private trainWeights(data: ChurnTrainingData[]): void {
        const learningRate = 0.01;
        const epochs = 100;

        for (let epoch = 0; epoch < epochs; epoch++) {
            for (const sample of data) {
                const predicted = this.calculateChurnScore(sample.features);
                const actual = sample.churned ? 1 : 0;
                const error = actual - predicted;

                // Update weights
                for (const [feature, weight] of Object.entries(this.weights)) {
                    const featureValue = this.getFeatureValue(sample.features, feature);
                    if (featureValue === null) continue;

                    const normalized = this.normalizeFeature(feature, featureValue);
                    const gradient = error * normalized * (weight.direction === 'positive' ? 1 : -1);

                    weight.weight += learningRate * gradient;
                    weight.weight = Math.max(0, Math.min(1, weight.weight));
                }
            }
        }

        // Normalize weights to sum to 1
        const totalWeight = Object.values(this.weights).reduce((sum, w) => sum + w.weight, 0);
        for (const weight of Object.values(this.weights)) {
            weight.weight /= totalWeight;
        }
    }

    // ========================================================================
    // Evaluation
    // ========================================================================

    async evaluate(testData: ChurnTrainingData[]): Promise<ModelMetrics> {
        return this.evaluateModel(testData);
    }

    private evaluateModel(testData: ChurnTrainingData[]): ModelMetrics {
        let truePositives = 0;
        let falsePositives = 0;
        let trueNegatives = 0;
        let falseNegatives = 0;

        for (const sample of testData) {
            const prediction = this.predict(sample.features);
            const predictedChurn = prediction.value >= 0.5;
            const actualChurn = sample.churned;

            if (predictedChurn && actualChurn) truePositives++;
            else if (predictedChurn && !actualChurn) falsePositives++;
            else if (!predictedChurn && !actualChurn) trueNegatives++;
            else falseNegatives++;
        }

        const accuracy = (truePositives + trueNegatives) / testData.length;
        const precision = truePositives / (truePositives + falsePositives) || 0;
        const recall = truePositives / (truePositives + falseNegatives) || 0;
        const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

        // Calculate AUC (simplified)
        const auc = this.calculateAUC(testData);

        return {
            accuracy,
            precision,
            recall,
            f1Score,
            auc,
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: testData.length,
        };
    }

    private calculateAUC(testData: ChurnTrainingData[]): number {
        // Sort by predicted score
        const scored = testData.map(sample => ({
            score: this.calculateChurnScore(sample.features),
            actual: sample.churned,
        })).sort((a, b) => b.score - a.score);

        let positives = scored.filter(s => s.actual).length;
        let negatives = scored.length - positives;

        if (positives === 0 || negatives === 0) return 0.5;

        let auc = 0;
        let tpCount = 0;

        for (const item of scored) {
            if (item.actual) {
                tpCount++;
            } else {
                auc += tpCount;
            }
        }

        return auc / (positives * negatives);
    }

    getFeatureImportance(): Record<string, number> {
        return Object.fromEntries(
            Object.entries(this.weights).map(([k, v]) => [k, v.weight])
        );
    }

    // ========================================================================
    // Persistence
    // ========================================================================

    async save(): Promise<void> {
        const data = {
            weights: this.weights,
            meanFeatures: this.meanFeatures,
            stdFeatures: this.stdFeatures,
            metrics: this.metrics,
        };
        localStorage.setItem('churn_predictor_model', JSON.stringify(data));
    }

    async load(): Promise<boolean> {
        try {
            const saved = localStorage.getItem('churn_predictor_model');
            if (saved) {
                const data = JSON.parse(saved);
                this.weights = data.weights || DEFAULT_WEIGHTS;
                this.meanFeatures = data.meanFeatures || {};
                this.stdFeatures = data.stdFeatures || {};
                this.metrics = data.metrics;
                return true;
            }
        } catch (e) {
            console.warn('Failed to load churn model:', e);
        }
        return false;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private calculateChurnScore(features: UserFeatures): number {
        let score = 0;

        for (const [featureName, weight] of Object.entries(this.weights)) {
            const value = this.getFeatureValue(features, featureName);
            if (value === null) continue;

            const normalized = this.normalizeFeature(featureName, value);
            const contribution = weight.direction === 'positive'
                ? normalized * weight.weight
                : (1 - normalized) * weight.weight;

            // Apply threshold if exists
            if (weight.threshold !== undefined) {
                if (weight.direction === 'positive' && value < weight.threshold) {
                    continue; // Below threshold, no contribution
                }
                if (weight.direction === 'negative' && value > weight.threshold) {
                    continue;
                }
            }

            score += contribution;
        }

        // Clamp to 0-1
        return Math.max(0, Math.min(1, score));
    }

    private getFeatureValue(features: UserFeatures, featureName: string): number | null {
        switch (featureName) {
            case 'sessionTrend': return features.sessionTrend;
            case 'lastSessionHoursAgo': return features.lastSessionHoursAgo;
            case 'failureRate': return features.failureRate;
            case 'stuckAtLevel': return features.stuckAtLevel ? 1 : 0;
            case 'weeklyActiveRatio': return features.weeklyActiveRatio;
            case 'progressionSpeed': return features.progressionSpeed;
            case 'daysActive': return features.daysActive;
            case 'isPayer': return features.isPayer ? 1 : 0;
            case 'daysSinceLastPurchase': return features.daysSinceLastPurchase;
            default: return null;
        }
    }

    private normalizeFeature(featureName: string, value: number): number {
        // Use stored mean/std if available
        const mean = (this.meanFeatures as Record<string, number>)[featureName] || 0;
        const std = (this.stdFeatures as Record<string, number>)[featureName] || 1;

        // Z-score normalization, then sigmoid
        const zScore = (value - mean) / std;
        return 1 / (1 + Math.exp(-zScore));
    }

    private calculateFeatureStats(features: UserFeatures[]): void {
        const featureNames = Object.keys(this.weights);

        for (const featureName of featureNames) {
            const values = features
                .map(f => this.getFeatureValue(f, featureName))
                .filter((v): v is number => v !== null);

            if (values.length > 0) {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
                const std = Math.sqrt(variance) || 1;

                (this.meanFeatures as Record<string, number>)[featureName] = mean;
                (this.stdFeatures as Record<string, number>)[featureName] = std;
            }
        }
    }

    private scoreToRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
        if (score >= 0.8) return 'critical';
        if (score >= 0.6) return 'high';
        if (score >= 0.4) return 'medium';
        return 'low';
    }

    private identifyChurnFactors(features: UserFeatures): PredictionFactor[] {
        const factors: PredictionFactor[] = [];

        // Activity decline
        if (features.sessionTrend < -0.3) {
            factors.push({
                name: 'Declining Activity',
                impact: 0.8,
                description: `Session frequency down ${Math.abs(features.sessionTrend * 100).toFixed(0)}%`,
            });
        }

        // Long absence
        if (features.lastSessionHoursAgo > 72) {
            factors.push({
                name: 'Extended Absence',
                impact: 0.7,
                description: `Last session ${Math.floor(features.lastSessionHoursAgo / 24)} days ago`,
            });
        }

        // High failure rate
        if (features.failureRate > 0.5) {
            factors.push({
                name: 'High Failure Rate',
                impact: 0.6,
                description: `${(features.failureRate * 100).toFixed(0)}% attempt failure rate`,
            });
        }

        // Stuck at level
        if (features.stuckAtLevel) {
            factors.push({
                name: 'Progression Blocked',
                impact: 0.5,
                description: `Stuck at level ${features.currentLevel}`,
            });
        }

        // Low engagement
        if (features.weeklyActiveRatio < 0.3) {
            factors.push({
                name: 'Low Weekly Engagement',
                impact: 0.4,
                description: `Active only ${Math.round(features.weeklyActiveRatio * 7)} days/week`,
            });
        }

        return factors.sort((a, b) => b.impact - a.impact);
    }

    private estimateDaysUntilChurn(features: UserFeatures, score: number): number | undefined {
        if (score < 0.4) return undefined; // Low risk, can't estimate

        // Based on activity trend and current absence
        const baseEstimate = Math.max(1, 7 - features.lastSessionHoursAgo / 24);

        // Adjust based on trend
        if (features.sessionTrend < -0.5) {
            return Math.floor(baseEstimate * 0.5);
        } else if (features.sessionTrend < 0) {
            return Math.floor(baseEstimate * 0.7);
        }

        return Math.floor(baseEstimate);
    }

    private calculateConfidence(features: UserFeatures): number {
        // More data = higher confidence
        let confidence = 0.5;

        // User age affects confidence
        if (features.daysSinceFirstSession > 7) confidence += 0.1;
        if (features.daysSinceFirstSession > 30) confidence += 0.1;

        // Activity data completeness
        if (features.sessionCount7d > 0) confidence += 0.1;
        if (features.sessionCount30d > 0) confidence += 0.1;

        // If model was trained
        if (this.metrics?.auc && this.metrics.auc > 0.7) {
            confidence += 0.1;
        }

        return Math.min(0.95, confidence);
    }

    private generatePreventionActions(factors: PredictionFactor[]): string[] {
        const actions: string[] = [];

        for (const factor of factors) {
            switch (factor.name) {
                case 'Declining Activity':
                    actions.push('Send re-engagement notification with special offer');
                    actions.push('Highlight new content or features they haven\'t tried');
                    break;
                case 'Extended Absence':
                    actions.push('Send "We miss you" message with comeback bonus');
                    actions.push('Offer time-limited exclusive reward');
                    break;
                case 'High Failure Rate':
                    actions.push('Offer help or hints for difficult content');
                    actions.push('Consider temporary difficulty adjustment');
                    break;
                case 'Progression Blocked':
                    actions.push('Send tips for current level');
                    actions.push('Offer free power-up or helper item');
                    break;
                case 'Low Weekly Engagement':
                    actions.push('Implement daily login rewards');
                    actions.push('Add time-limited events');
                    break;
            }
        }

        return [...new Set(actions)].slice(0, 5);
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const churnPredictor = new ChurnPredictor();
