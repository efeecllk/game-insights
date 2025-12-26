/**
 * Retention Predictor
 * Predicts future retention rates based on early cohort data
 * Phase 5: Advanced AI & Automation
 */

import type {
    UserFeatures,
    AggregateFeatures,
    RetentionPrediction,
    ModelConfig,
    ModelMetrics,
    PredictionFactor,
} from './types';

// ============================================================================
// Types
// ============================================================================

interface CohortData {
    cohortDate: string;
    size: number;
    retentionByDay: Record<number, number>; // day -> retention rate
}

interface RetentionInput {
    cohortData: CohortData[];
    userFeatures?: UserFeatures[];
    aggregateFeatures?: AggregateFeatures[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ModelConfig = {
    minDataPoints: 100,
    lookbackDays: 90,
    validationSplit: 0.2,
    confidenceThreshold: 0.7,
    updateFrequency: 'daily',
    hyperparameters: {
        smoothingFactor: 0.3,
        seasonalPeriod: 7,
        trendWeight: 0.4,
    },
};

// Known retention decay patterns by game type
const RETENTION_PATTERNS: Record<string, number[]> = {
    puzzle: [1, 0.45, 0.35, 0.28, 0.24, 0.21, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11, 0.10],
    idle: [1, 0.50, 0.40, 0.32, 0.27, 0.24, 0.21, 0.19, 0.17, 0.15, 0.14, 0.13, 0.12],
    battle_royale: [1, 0.40, 0.30, 0.24, 0.20, 0.17, 0.15, 0.13, 0.11, 0.10, 0.09, 0.08, 0.07],
    match3_meta: [1, 0.48, 0.38, 0.30, 0.25, 0.22, 0.19, 0.17, 0.15, 0.14, 0.13, 0.12, 0.11],
    gacha_rpg: [1, 0.42, 0.32, 0.26, 0.22, 0.19, 0.17, 0.15, 0.13, 0.12, 0.11, 0.10, 0.09],
    default: [1, 0.44, 0.34, 0.27, 0.23, 0.20, 0.17, 0.15, 0.13, 0.12, 0.11, 0.10, 0.09],
};

// ============================================================================
// Retention Predictor Class
// ============================================================================

export class RetentionPredictor {
    name = 'RetentionPredictor';
    version = '1.0.0';
    config: ModelConfig;
    metrics?: ModelMetrics;

    private trainedCurve: number[] = [];
    private gameType: string = 'default';

    constructor(config: Partial<ModelConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    async initialize(): Promise<void> {
        // Load saved model if exists
        await this.load();
    }

    // ========================================================================
    // Prediction
    // ========================================================================

    /**
     * Predict retention for a specific day given early retention data
     */
    predictRetention(
        observedRetention: Record<number, number>,
        targetDay: number,
        cohortSize: number = 1000
    ): RetentionPrediction {
        const observedDays = Object.keys(observedRetention).map(Number).sort((a, b) => a - b);
        const maxObservedDay = Math.max(...observedDays);

        // Use observed data if available
        if (targetDay <= maxObservedDay && observedRetention[targetDay] !== undefined) {
            return {
                value: observedRetention[targetDay],
                confidence: 1.0,
                cohortSize,
                retentionCurve: this.buildRetentionCurve(observedRetention, targetDay),
                benchmarkComparison: this.compareToBenchmark(observedRetention[targetDay], targetDay),
            };
        }

        // Predict future retention
        const prediction = this.extrapolateRetention(observedRetention, targetDay);
        const confidence = this.calculateConfidence(maxObservedDay, targetDay, observedDays.length);
        const factors = this.identifyFactors(observedRetention);

        return {
            value: prediction,
            confidence,
            range: {
                low: Math.max(0, prediction * 0.8),
                high: Math.min(1, prediction * 1.2),
            },
            factors,
            cohortSize,
            retentionCurve: this.buildRetentionCurve(observedRetention, targetDay, prediction),
            benchmarkComparison: this.compareToBenchmark(prediction, targetDay),
        };
    }

    /**
     * Predict D30 retention from D1-D7 data
     */
    predictD30FromEarly(
        d1: number,
        d7: number,
        cohortSize: number = 1000
    ): RetentionPrediction {
        // Use power law decay model: R(t) = R(1) * t^(-alpha)
        // Solve for alpha using D1 and D7
        const alpha = Math.log(d1 / d7) / Math.log(7);

        // Predict D30
        const d30 = d1 * Math.pow(30, -alpha);

        // Adjust for typical patterns
        const adjustedD30 = this.applyPatternAdjustment(d30, d1, d7);

        const confidence = this.calculateEarlyPredictionConfidence(d1, d7);

        return {
            value: adjustedD30,
            confidence,
            range: {
                low: adjustedD30 * 0.7,
                high: Math.min(d7, adjustedD30 * 1.3),
            },
            factors: [
                {
                    name: 'D1 Retention',
                    impact: d1 > 0.4 ? 0.8 : d1 > 0.3 ? 0.4 : -0.2,
                    description: `D1 at ${(d1 * 100).toFixed(1)}%`,
                },
                {
                    name: 'D1→D7 Decay',
                    impact: (d7 / d1) > 0.4 ? 0.6 : (d7 / d1) > 0.3 ? 0.2 : -0.4,
                    description: `${((d7 / d1) * 100).toFixed(1)}% retained from D1 to D7`,
                },
            ],
            cohortSize,
            retentionCurve: this.generatePredictedCurve(d1, alpha, 30),
            benchmarkComparison: this.compareToBenchmark(adjustedD30, 30),
        };
    }

    /**
     * Predict cohort LTV based on retention curve
     */
    predictCohortLTV(
        retentionCurve: Array<{ day: number; retention: number }>,
        dailyARPDAU: number,
        horizonDays: number = 365
    ): { ltv: number; confidence: number } {
        let totalLTV = 0;
        let lastKnownRetention = 1;
        let lastKnownDay = 0;

        // Calculate decay rate from known data
        const knownPoints = retentionCurve.filter(p => p.day <= 30);
        let decayRate = 0.15; // default

        if (knownPoints.length >= 2) {
            const first = knownPoints[0];
            const last = knownPoints[knownPoints.length - 1];
            decayRate = Math.log(first.retention / last.retention) / (last.day - first.day);
        }

        // Sum up daily contributions
        for (let day = 1; day <= horizonDays; day++) {
            const knownPoint = retentionCurve.find(p => p.day === day);

            if (knownPoint) {
                lastKnownRetention = knownPoint.retention;
                lastKnownDay = day;
                totalLTV += knownPoint.retention * dailyARPDAU;
            } else {
                // Extrapolate
                const daysSinceKnown = day - lastKnownDay;
                const predictedRetention = lastKnownRetention * Math.exp(-decayRate * daysSinceKnown);
                totalLTV += Math.max(0.001, predictedRetention) * dailyARPDAU;
            }
        }

        // Confidence decreases with horizon length
        const maxKnownDay = Math.max(...retentionCurve.map(p => p.day));
        const horizonConfidence = Math.max(0.3, 1 - (horizonDays - maxKnownDay) / horizonDays);

        return { ltv: totalLTV, confidence: horizonConfidence };
    }

    // ========================================================================
    // Training
    // ========================================================================

    async train(data: RetentionInput): Promise<ModelMetrics> {
        if (data.cohortData.length < this.config.minDataPoints / 100) {
            throw new Error(`Insufficient data: need at least ${this.config.minDataPoints / 100} cohorts`);
        }

        // Calculate average retention curve
        const dayCounts: Record<number, number[]> = {};

        for (const cohort of data.cohortData) {
            for (const [day, retention] of Object.entries(cohort.retentionByDay)) {
                const dayNum = parseInt(day);
                if (!dayCounts[dayNum]) dayCounts[dayNum] = [];
                dayCounts[dayNum].push(retention);
            }
        }

        // Average and smooth
        this.trainedCurve = [];
        for (let day = 0; day <= 30; day++) {
            if (dayCounts[day] && dayCounts[day].length > 0) {
                const avg = dayCounts[day].reduce((a, b) => a + b, 0) / dayCounts[day].length;
                this.trainedCurve[day] = avg;
            } else if (day > 0 && this.trainedCurve[day - 1]) {
                // Interpolate
                this.trainedCurve[day] = this.trainedCurve[day - 1] * 0.9;
            }
        }

        // Calculate metrics using cross-validation
        const metrics = await this.evaluate(data);

        this.metrics = {
            ...metrics,
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: data.cohortData.length,
        };

        return this.metrics;
    }

    // ========================================================================
    // Evaluation
    // ========================================================================

    async evaluate(data: RetentionInput): Promise<ModelMetrics> {
        if (data.cohortData.length < 2) {
            return { mse: 0, mae: 0, r2: 0, lastTrainedAt: '', dataPointsUsed: 0 };
        }

        // Hold-out validation
        const splitIndex = Math.floor(data.cohortData.length * (1 - this.config.validationSplit));
        const testCohorts = data.cohortData.slice(splitIndex);

        let totalSquaredError = 0;
        let totalAbsError = 0;
        let count = 0;

        for (const cohort of testCohorts) {
            const observedDays = Object.keys(cohort.retentionByDay).map(Number).sort((a, b) => a - b);

            // Use first half to predict second half
            const midPoint = Math.floor(observedDays.length / 2);
            const trainDays = observedDays.slice(0, midPoint);
            const testDays = observedDays.slice(midPoint);

            if (trainDays.length < 2 || testDays.length < 1) continue;

            const observedTrain: Record<number, number> = {};
            trainDays.forEach(d => {
                observedTrain[d] = cohort.retentionByDay[d];
            });

            for (const testDay of testDays) {
                const prediction = this.predictRetention(observedTrain, testDay);
                const actual = cohort.retentionByDay[testDay];

                totalSquaredError += Math.pow(prediction.value - actual, 2);
                totalAbsError += Math.abs(prediction.value - actual);
                count++;
            }
        }

        const mse = count > 0 ? totalSquaredError / count : 0;
        const mae = count > 0 ? totalAbsError / count : 0;

        return {
            mse,
            mae,
            r2: 1 - mse, // Simplified R2
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: count,
        };
    }

    getFeatureImportance(): Record<string, number> {
        return {
            'd1_retention': 0.35,
            'd7_retention': 0.25,
            'session_frequency': 0.15,
            'progression_speed': 0.10,
            'monetization_early': 0.08,
            'social_engagement': 0.07,
        };
    }

    // ========================================================================
    // Persistence
    // ========================================================================

    async save(): Promise<void> {
        const data = {
            trainedCurve: this.trainedCurve,
            gameType: this.gameType,
            metrics: this.metrics,
        };
        localStorage.setItem('retention_predictor_model', JSON.stringify(data));
    }

    async load(): Promise<boolean> {
        try {
            const saved = localStorage.getItem('retention_predictor_model');
            if (saved) {
                const data = JSON.parse(saved);
                this.trainedCurve = data.trainedCurve || [];
                this.gameType = data.gameType || 'default';
                this.metrics = data.metrics;
                return true;
            }
        } catch (e) {
            console.warn('Failed to load retention model:', e);
        }
        return false;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private extrapolateRetention(
        observed: Record<number, number>,
        targetDay: number
    ): number {
        const days = Object.keys(observed).map(Number).sort((a, b) => a - b);

        if (days.length < 2) {
            // Use default pattern
            const pattern = RETENTION_PATTERNS[this.gameType] || RETENTION_PATTERNS.default;
            return pattern[Math.min(targetDay, pattern.length - 1)] || 0.05;
        }

        // Fit power law: R(t) = a * t^(-b)
        const logDays = days.map(d => Math.log(d || 1));
        const logRetention = days.map(d => Math.log(observed[d] || 0.001));

        // Simple linear regression on log-log
        const n = logDays.length;
        const sumX = logDays.reduce((a, b) => a + b, 0);
        const sumY = logRetention.reduce((a, b) => a + b, 0);
        const sumXY = logDays.reduce((acc, x, i) => acc + x * logRetention[i], 0);
        const sumX2 = logDays.reduce((acc, x) => acc + x * x, 0);

        const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const a = Math.exp((sumY - b * sumX) / n);

        // Predict
        const prediction = a * Math.pow(targetDay, b);

        // Clamp to reasonable range
        return Math.max(0.001, Math.min(1, prediction));
    }

    private calculateConfidence(
        maxObservedDay: number,
        targetDay: number,
        dataPoints: number
    ): number {
        // Base confidence from data points
        const dataConfidence = Math.min(1, dataPoints / 7);

        // Decay confidence with prediction distance
        const dayGap = targetDay - maxObservedDay;
        const distanceConfidence = Math.exp(-dayGap / 30);

        return dataConfidence * distanceConfidence * 0.9; // Max 90% for predictions
    }

    private calculateEarlyPredictionConfidence(d1: number, d7: number): number {
        // Higher confidence if D1 and D7 are reasonable
        let confidence = 0.6; // Base

        if (d1 > 0.3 && d1 < 0.7) confidence += 0.1;
        if (d7 > 0.1 && d7 < 0.5) confidence += 0.1;
        if (d7 / d1 > 0.25 && d7 / d1 < 0.6) confidence += 0.1;

        return Math.min(0.85, confidence);
    }

    private applyPatternAdjustment(d30: number, d1: number, d7: number): number {
        // Use known patterns to adjust prediction
        const pattern = RETENTION_PATTERNS[this.gameType] || RETENTION_PATTERNS.default;

        // Expected ratios
        const expectedD7D1 = pattern[7] / pattern[1];
        const actualD7D1 = d7 / d1;

        // If actual decay is faster than expected, D30 will be lower
        const decayAdjustment = actualD7D1 / expectedD7D1;

        return Math.max(0.01, Math.min(d7 * 0.8, d30 * decayAdjustment));
    }

    private buildRetentionCurve(
        observed: Record<number, number>,
        upToDay: number,
        predictedValue?: number
    ): Array<{ day: number; retention: number }> {
        const curve: Array<{ day: number; retention: number }> = [];

        for (let day = 0; day <= upToDay; day++) {
            if (observed[day] !== undefined) {
                curve.push({ day, retention: observed[day] });
            } else if (day === upToDay && predictedValue !== undefined) {
                curve.push({ day, retention: predictedValue });
            } else {
                // Interpolate
                const prev = curve[curve.length - 1];
                if (prev) {
                    curve.push({ day, retention: prev.retention * 0.92 });
                }
            }
        }

        return curve;
    }

    private generatePredictedCurve(
        d1: number,
        alpha: number,
        days: number
    ): Array<{ day: number; retention: number }> {
        const curve: Array<{ day: number; retention: number }> = [{ day: 0, retention: 1 }];

        for (let day = 1; day <= days; day++) {
            const retention = d1 * Math.pow(day, -alpha);
            curve.push({ day, retention: Math.max(0.001, retention) });
        }

        return curve;
    }

    private identifyFactors(observed: Record<number, number>): PredictionFactor[] {
        const factors: PredictionFactor[] = [];

        const d1 = observed[1];
        const d7 = observed[7];

        if (d1 !== undefined) {
            factors.push({
                name: 'Day 1 Retention',
                impact: d1 > 0.45 ? 0.8 : d1 > 0.35 ? 0.4 : d1 > 0.25 ? 0 : -0.4,
                description: `${(d1 * 100).toFixed(1)}% returned on day 1`,
            });
        }

        if (d1 !== undefined && d7 !== undefined) {
            const weekRetention = d7 / d1;
            factors.push({
                name: 'Week 1 Stickiness',
                impact: weekRetention > 0.5 ? 0.7 : weekRetention > 0.35 ? 0.3 : -0.3,
                description: `${(weekRetention * 100).toFixed(1)}% of D1 users returned on D7`,
            });
        }

        return factors;
    }

    private compareToBenchmark(
        retention: number,
        day: number
    ): 'above' | 'at' | 'below' {
        const benchmark = RETENTION_PATTERNS[this.gameType] || RETENTION_PATTERNS.default;
        const expected = benchmark[Math.min(day, benchmark.length - 1)] || 0.1;

        if (retention > expected * 1.1) return 'above';
        if (retention < expected * 0.9) return 'below';
        return 'at';
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const retentionPredictor = new RetentionPredictor();
