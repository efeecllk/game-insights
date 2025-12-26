/**
 * LTV Predictor
 * Predicts customer lifetime value and segments users by spending potential
 * Phase 5: Advanced AI & Automation
 */

import type {
    UserFeatures,
    LTVPrediction,
    ModelConfig,
    ModelMetrics,
    PredictionFactor,
} from './types';

// ============================================================================
// Types
// ============================================================================

interface LTVTrainingData {
    features: UserFeatures;
    actualLTV: number;
    observationDays: number;
}

// ============================================================================
// Segment Thresholds
// ============================================================================

const SEGMENT_THRESHOLDS = {
    whale: 100,      // $100+ LTV
    dolphin: 20,     // $20-100 LTV
    minnow: 1,       // $1-20 LTV
    non_payer: 0,    // $0 LTV
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ModelConfig = {
    minDataPoints: 200,
    lookbackDays: 90,
    validationSplit: 0.2,
    confidenceThreshold: 0.7,
    updateFrequency: 'daily',
    hyperparameters: {
        decayRate: 0.03, // Daily LTV decay after initial period
        initialPeriod: 7, // Days of high spending potential
    },
};

// ============================================================================
// LTV Predictor Class
// ============================================================================

export class LTVPredictor {
    name = 'LTVPredictor';
    version = '1.0.0';
    config: ModelConfig;
    metrics?: ModelMetrics;

    private avgLTV: number = 0;
    private avgPayerLTV: number = 0;
    private conversionRate: number = 0.05;
    private coefficients: Record<string, number> = {};

    constructor(config: Partial<ModelConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeCoefficients();
    }

    private initializeCoefficients(): void {
        this.coefficients = {
            intercept: 0,
            isPayer: 50,
            totalSpend: 2.5,
            purchaseCount: 5,
            daysActive: 0.5,
            sessionCount30d: 0.2,
            progressionSpeed: 3,
            avgSessionLength: 0.1,
            earlyPurchase: 30, // Bonus for purchase in first 7 days
        };
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
     * Predict LTV for a single user
     */
    predict(features: UserFeatures, horizonDays: number = 365): LTVPrediction {
        const baseLTV = this.calculateBaseLTV(features);
        const projections = this.calculateProjections(features, baseLTV, horizonDays);
        const segment = this.determineSegment(projections.projected365d);
        const factors = this.identifyLTVFactors(features);
        const confidence = this.calculateConfidence(features);

        return {
            value: projections.projected365d,
            confidence,
            range: {
                low: projections.projected365d * 0.6,
                high: projections.projected365d * 1.5,
            },
            factors,
            segment,
            projectedSpend30d: projections.projected30d,
            projectedSpend90d: projections.projected90d,
            projectedSpend365d: projections.projected365d,
        };
    }

    /**
     * Predict early LTV from first week behavior
     */
    predictEarlyLTV(
        daysSinceInstall: number,
        sessionCount: number,
        totalSpend: number,
        currentLevel: number
    ): LTVPrediction {
        // Create partial features
        const features: UserFeatures = {
            userId: 'early',
            cohort: new Date().toISOString().slice(0, 10),
            sessionCount7d: sessionCount,
            sessionCount30d: sessionCount,
            sessionTrend: 0,
            lastSessionHoursAgo: 0,
            avgSessionLength: 10,
            totalPlayTime: sessionCount * 10,
            currentLevel,
            maxLevelReached: currentLevel,
            progressionSpeed: currentLevel / Math.max(1, daysSinceInstall),
            failureRate: 0.2,
            stuckAtLevel: false,
            totalSpend,
            purchaseCount: totalSpend > 0 ? 1 : 0,
            avgPurchaseValue: totalSpend,
            daysSinceLastPurchase: totalSpend > 0 ? 0 : daysSinceInstall,
            isPayer: totalSpend > 0,
            daysActive: Math.min(daysSinceInstall, sessionCount),
            daysSinceFirstSession: daysSinceInstall,
            weeklyActiveRatio: Math.min(1, sessionCount / 7),
            peakPlayHour: 20,
            featureUsage: {},
        };

        // Apply early prediction multipliers
        let prediction = this.predict(features);

        // Adjust confidence based on data age
        if (daysSinceInstall < 3) {
            prediction.confidence *= 0.5;
        } else if (daysSinceInstall < 7) {
            prediction.confidence *= 0.7;
        }

        // Early spender bonus
        if (totalSpend > 0 && daysSinceInstall <= 7) {
            prediction.value *= 2.5; // Early spenders have much higher LTV
            prediction.projectedSpend30d *= 2;
            prediction.projectedSpend90d *= 2;
            prediction.projectedSpend365d *= 2.5;

            prediction.factors?.unshift({
                name: 'Early Purchase',
                impact: 0.9,
                description: `Purchased within first ${daysSinceInstall} days`,
            });
        }

        return prediction;
    }

    /**
     * Segment users by LTV potential
     */
    segmentUsers(userFeatures: UserFeatures[]): {
        whales: UserFeatures[];
        dolphins: UserFeatures[];
        minnows: UserFeatures[];
        nonPayers: UserFeatures[];
        summary: {
            totalUsers: number;
            totalProjectedLTV: number;
            avgLTV: number;
            payerPercentage: number;
        };
    } {
        const segments = {
            whales: [] as UserFeatures[],
            dolphins: [] as UserFeatures[],
            minnows: [] as UserFeatures[],
            nonPayers: [] as UserFeatures[],
        };

        let totalLTV = 0;
        let payerCount = 0;

        for (const features of userFeatures) {
            const prediction = this.predict(features);
            totalLTV += prediction.value;

            if (prediction.segment === 'whale') segments.whales.push(features);
            else if (prediction.segment === 'dolphin') segments.dolphins.push(features);
            else if (prediction.segment === 'minnow') segments.minnows.push(features);
            else segments.nonPayers.push(features);

            if (features.isPayer) payerCount++;
        }

        return {
            ...segments,
            summary: {
                totalUsers: userFeatures.length,
                totalProjectedLTV: totalLTV,
                avgLTV: totalLTV / userFeatures.length,
                payerPercentage: (payerCount / userFeatures.length) * 100,
            },
        };
    }

    /**
     * Identify users with high conversion potential
     */
    getHighPotentialNonPayers(
        userFeatures: UserFeatures[],
        limit: number = 50
    ): Array<{ user: UserFeatures; conversionProbability: number; potentialLTV: number }> {
        return userFeatures
            .filter(f => !f.isPayer)
            .map(features => ({
                user: features,
                conversionProbability: this.calculateConversionProbability(features),
                potentialLTV: this.calculatePotentialPayerLTV(features),
            }))
            .filter(({ conversionProbability }) => conversionProbability > 0.1)
            .sort((a, b) =>
                (b.conversionProbability * b.potentialLTV) -
                (a.conversionProbability * a.potentialLTV)
            )
            .slice(0, limit);
    }

    // ========================================================================
    // Training
    // ========================================================================

    async train(data: LTVTrainingData[]): Promise<ModelMetrics> {
        if (data.length < this.config.minDataPoints) {
            throw new Error(`Insufficient data: need at least ${this.config.minDataPoints} users`);
        }

        // Calculate averages
        const payers = data.filter(d => d.features.isPayer);
        this.avgLTV = data.reduce((sum, d) => sum + d.actualLTV, 0) / data.length;
        this.avgPayerLTV = payers.length > 0
            ? payers.reduce((sum, d) => sum + d.actualLTV, 0) / payers.length
            : 0;
        this.conversionRate = payers.length / data.length;

        // Train coefficients using linear regression
        this.trainCoefficients(data);

        // Evaluate
        const metrics = await this.evaluate(data);

        this.metrics = {
            ...metrics,
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: data.length,
        };

        await this.save();

        return this.metrics;
    }

    private trainCoefficients(data: LTVTrainingData[]): void {
        // Simple gradient descent
        const learningRate = 0.0001;
        const epochs = 100;

        for (let epoch = 0; epoch < epochs; epoch++) {
            for (const sample of data) {
                const predicted = this.calculateBaseLTV(sample.features);
                const error = sample.actualLTV - predicted;

                // Update coefficients
                this.coefficients.intercept += learningRate * error;
                this.coefficients.isPayer += learningRate * error * (sample.features.isPayer ? 1 : 0);
                this.coefficients.totalSpend += learningRate * error * sample.features.totalSpend * 0.01;
                this.coefficients.purchaseCount += learningRate * error * sample.features.purchaseCount;
                this.coefficients.daysActive += learningRate * error * sample.features.daysActive * 0.1;
                this.coefficients.sessionCount30d += learningRate * error * sample.features.sessionCount30d * 0.01;
            }
        }
    }

    // ========================================================================
    // Evaluation
    // ========================================================================

    async evaluate(data: LTVTrainingData[]): Promise<ModelMetrics> {
        const splitIdx = Math.floor(data.length * (1 - this.config.validationSplit));
        const testData = data.slice(splitIdx);

        let totalSquaredError = 0;
        let totalAbsError = 0;
        let totalActual = 0;
        let sumActualSquared = 0;

        for (const sample of testData) {
            const prediction = this.predict(sample.features);
            const actual = sample.actualLTV;

            totalSquaredError += Math.pow(prediction.value - actual, 2);
            totalAbsError += Math.abs(prediction.value - actual);
            totalActual += actual;
            sumActualSquared += actual * actual;
        }

        const n = testData.length;
        const mse = totalSquaredError / n;
        const mae = totalAbsError / n;
        const meanActual = totalActual / n;
        const ssTotal = sumActualSquared - n * meanActual * meanActual;
        const r2 = ssTotal > 0 ? 1 - (totalSquaredError / ssTotal) : 0;

        return {
            mse,
            mae,
            r2,
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: n,
        };
    }

    getFeatureImportance(): Record<string, number> {
        const total = Object.values(this.coefficients).reduce((a, b) => a + Math.abs(b), 0);
        return Object.fromEntries(
            Object.entries(this.coefficients).map(([k, v]) => [k, Math.abs(v) / total])
        );
    }

    // ========================================================================
    // Persistence
    // ========================================================================

    async save(): Promise<void> {
        const data = {
            coefficients: this.coefficients,
            avgLTV: this.avgLTV,
            avgPayerLTV: this.avgPayerLTV,
            conversionRate: this.conversionRate,
            metrics: this.metrics,
        };
        localStorage.setItem('ltv_predictor_model', JSON.stringify(data));
    }

    async load(): Promise<boolean> {
        try {
            const saved = localStorage.getItem('ltv_predictor_model');
            if (saved) {
                const data = JSON.parse(saved);
                this.coefficients = data.coefficients || this.coefficients;
                this.avgLTV = data.avgLTV || 0;
                this.avgPayerLTV = data.avgPayerLTV || 0;
                this.conversionRate = data.conversionRate || 0.05;
                this.metrics = data.metrics;
                return true;
            }
        } catch (e) {
            console.warn('Failed to load LTV model:', e);
        }
        return false;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private calculateBaseLTV(features: UserFeatures): number {
        let ltv = this.coefficients.intercept;

        // Payer baseline
        if (features.isPayer) {
            ltv += this.coefficients.isPayer;
            ltv += this.coefficients.totalSpend * features.totalSpend;
            ltv += this.coefficients.purchaseCount * features.purchaseCount;

            // Recency
            if (features.daysSinceLastPurchase < 7) {
                ltv *= 1.2;
            } else if (features.daysSinceLastPurchase > 30) {
                ltv *= 0.8;
            }
        }

        // Engagement factors
        ltv += this.coefficients.daysActive * features.daysActive;
        ltv += this.coefficients.sessionCount30d * features.sessionCount30d;
        ltv += this.coefficients.progressionSpeed * features.progressionSpeed;
        ltv += this.coefficients.avgSessionLength * features.avgSessionLength;

        // Non-payer potential
        if (!features.isPayer && features.daysActive > 7 && features.weeklyActiveRatio > 0.5) {
            ltv += this.conversionRate * this.avgPayerLTV;
        }

        return Math.max(0, ltv);
    }

    private calculateProjections(
        features: UserFeatures,
        baseLTV: number,
        horizonDays: number
    ): { projected30d: number; projected90d: number; projected365d: number } {
        const decayRate = this.config.hyperparameters?.decayRate || 0.03;
        const daysRemaining30 = Math.max(0, 30 - features.daysSinceFirstSession);
        const daysRemaining90 = Math.max(0, 90 - features.daysSinceFirstSession);
        const daysRemaining365 = Math.max(0, horizonDays - features.daysSinceFirstSession);

        // Already earned LTV
        const earnedLTV = features.totalSpend;

        // Future projections with decay
        const dailyRate = baseLTV / 365;
        const project = (days: number) => {
            let total = earnedLTV;
            for (let d = 1; d <= days; d++) {
                total += dailyRate * Math.exp(-decayRate * d);
            }
            return total;
        };

        return {
            projected30d: project(daysRemaining30),
            projected90d: project(daysRemaining90),
            projected365d: project(daysRemaining365),
        };
    }

    private determineSegment(ltv: number): 'whale' | 'dolphin' | 'minnow' | 'non_payer' {
        if (ltv >= SEGMENT_THRESHOLDS.whale) return 'whale';
        if (ltv >= SEGMENT_THRESHOLDS.dolphin) return 'dolphin';
        if (ltv >= SEGMENT_THRESHOLDS.minnow) return 'minnow';
        return 'non_payer';
    }

    private calculateConversionProbability(features: UserFeatures): number {
        // Factors that predict conversion
        let probability = this.conversionRate; // Base rate

        // High engagement increases probability
        if (features.weeklyActiveRatio > 0.7) probability *= 2;
        else if (features.weeklyActiveRatio > 0.5) probability *= 1.5;

        // More sessions = more chances
        probability *= Math.min(2, 1 + features.sessionCount30d / 30);

        // Progression shows investment
        if (features.progressionSpeed > 2) probability *= 1.5;

        // Time-based (conversion usually happens in first 7-14 days)
        if (features.daysSinceFirstSession <= 7) probability *= 1.5;
        else if (features.daysSinceFirstSession <= 14) probability *= 1.2;
        else if (features.daysSinceFirstSession > 30) probability *= 0.5;

        return Math.min(0.5, probability); // Cap at 50%
    }

    private calculatePotentialPayerLTV(features: UserFeatures): number {
        // Estimate LTV if this user converted
        const engagementMultiplier = Math.min(2, features.weeklyActiveRatio * 2);
        const progressionMultiplier = Math.min(1.5, 1 + features.progressionSpeed / 5);

        return this.avgPayerLTV * engagementMultiplier * progressionMultiplier;
    }

    private identifyLTVFactors(features: UserFeatures): PredictionFactor[] {
        const factors: PredictionFactor[] = [];

        if (features.isPayer) {
            factors.push({
                name: 'Paying User',
                impact: 0.9,
                description: `Total spend: $${features.totalSpend.toFixed(2)}`,
            });

            if (features.purchaseCount > 1) {
                factors.push({
                    name: 'Repeat Purchaser',
                    impact: 0.7,
                    description: `${features.purchaseCount} purchases`,
                });
            }

            if (features.daysSinceLastPurchase < 7) {
                factors.push({
                    name: 'Recent Purchase',
                    impact: 0.5,
                    description: `Last purchase ${features.daysSinceLastPurchase} days ago`,
                });
            }
        }

        if (features.weeklyActiveRatio > 0.7) {
            factors.push({
                name: 'High Engagement',
                impact: 0.6,
                description: `Active ${Math.round(features.weeklyActiveRatio * 7)} days/week`,
            });
        }

        if (features.progressionSpeed > 2) {
            factors.push({
                name: 'Fast Progression',
                impact: 0.4,
                description: `${features.progressionSpeed.toFixed(1)} levels/day`,
            });
        }

        if (features.daysActive > 30) {
            factors.push({
                name: 'Long-term Player',
                impact: 0.5,
                description: `Active for ${features.daysActive} days`,
            });
        }

        return factors.sort((a, b) => b.impact - a.impact);
    }

    private calculateConfidence(features: UserFeatures): number {
        let confidence = 0.5;

        // More history = more confidence
        if (features.daysSinceFirstSession > 7) confidence += 0.1;
        if (features.daysSinceFirstSession > 30) confidence += 0.1;
        if (features.daysSinceFirstSession > 90) confidence += 0.1;

        // Payers are more predictable
        if (features.isPayer) confidence += 0.1;

        // Model training improves confidence
        if (this.metrics?.r2 && this.metrics.r2 > 0.5) {
            confidence += 0.1;
        }

        return Math.min(0.9, confidence);
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const ltvPredictor = new LTVPredictor();
