/**
 * ML Service
 * Singleton service managing ML model lifecycle and predictions
 * Phase 3: AI/ML Integration
 */

import { RetentionPredictor } from './RetentionPredictor';
import { ChurnPredictor } from './ChurnPredictor';
import { LTVPredictor } from './LTVPredictor';
import { RevenueForecaster } from './RevenueForecaster';
import { AnomalyModel } from './AnomalyModel';
import { SegmentationModel } from './SegmentationModel';
import { FeatureExtractor } from './FeatureExtractor';
import type { GameData } from '../../lib/dataStore';
import type {
    UserFeatures,
    ChurnPrediction,
    LTVPrediction,
    RevenueForecast,
    Anomaly,
    UserSegment,
    ModelMetrics,
} from './types';

// ============================================================================
// Types
// ============================================================================

export interface MLPredictions {
    churn: ChurnPredictionResult[];
    ltv: LTVPredictionResult[];
    revenue: RevenueForecast[];
    retention: RetentionPoint[];
    segments: SegmentedUsers | null;
    anomalies: Anomaly[];
}

export interface ChurnPredictionResult extends ChurnPrediction {
    userId: string;
}

export interface LTVPredictionResult extends LTVPrediction {
    userId: string;
}

export interface RetentionPoint {
    day: number;
    retention: number;
    predicted: boolean;
}

export interface SegmentedUsers {
    clusters: UserSegment[];
    predefined: {
        whale: UserFeatures[];
        dolphin: UserFeatures[];
        minnow: UserFeatures[];
        nonPayer: UserFeatures[];
        atRisk: UserFeatures[];
        highlyEngaged: UserFeatures[];
        casual: UserFeatures[];
    };
}

export interface ModelStatus {
    isInitialized: boolean;
    isTraining: boolean;
    lastTrainedDataId: string | null;
    lastTrainedAt: string | null;
    modelMetrics: {
        retention: ModelMetrics | null;
        churn: ModelMetrics | null;
        ltv: ModelMetrics | null;
        revenue: ModelMetrics | null;
        anomaly: ModelMetrics | null;
        segmentation: ModelMetrics | null;
    };
    dataPointsUsed: number;
}

// ============================================================================
// ML Service Class
// ============================================================================

export class MLService {
    private static instance: MLService;

    private models: {
        retention: RetentionPredictor;
        churn: ChurnPredictor;
        ltv: LTVPredictor;
        revenue: RevenueForecaster;
        anomaly: AnomalyModel;
        segmentation: SegmentationModel;
    };

    private isInitialized = false;
    private isTraining = false;
    private lastTrainedDataId: string | null = null;
    private lastTrainedAt: string | null = null;
    private dataPointsUsed = 0;
    private cachedUserFeatures: UserFeatures[] = [];

    private constructor() {
        this.models = {
            retention: new RetentionPredictor(),
            churn: new ChurnPredictor(),
            ltv: new LTVPredictor(),
            revenue: new RevenueForecaster(),
            anomaly: new AnomalyModel(),
            segmentation: new SegmentationModel(),
        };
    }

    static getInstance(): MLService {
        if (!MLService.instance) {
            MLService.instance = new MLService();
        }
        return MLService.instance;
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        await Promise.all([
            this.models.retention.initialize(),
            this.models.churn.initialize(),
            this.models.ltv.initialize(),
            this.models.revenue.initialize(),
            this.models.anomaly.initialize(),
            this.models.segmentation.initialize(),
        ]);

        this.isInitialized = true;
    }

    // ========================================================================
    // Training
    // ========================================================================

    async trainOnData(gameData: GameData): Promise<ModelMetrics> {
        // Skip if already trained on this data
        if (this.lastTrainedDataId === gameData.id) {
            return this.getAggregateMetrics();
        }

        // Check minimum data requirements
        if (gameData.rawData.length < 100) {
            throw new Error('Insufficient data: need at least 100 rows for ML training');
        }

        this.isTraining = true;

        try {
            const extractor = new FeatureExtractor(gameData);

            // Extract features
            const userFeatures = extractor.extractAllUserFeatures();
            const revenueData = extractor.extractRevenueDataPoints();
            const revenueSeries = extractor.extractTimeSeries('revenue');
            const dauSeries = extractor.extractTimeSeries('dau');

            // Cache user features for predictions
            this.cachedUserFeatures = userFeatures;
            this.dataPointsUsed = gameData.rawData.length;

            // Train models in parallel
            const results = await Promise.allSettled([
                this.trainRetention(userFeatures),
                this.trainChurn(userFeatures),
                this.trainLTV(userFeatures),
                this.trainRevenue(revenueData),
                this.trainAnomaly(revenueSeries, dauSeries),
                this.trainSegmentation(userFeatures),
            ]);

            // Log any failures
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const modelNames = ['retention', 'churn', 'ltv', 'revenue', 'anomaly', 'segmentation'];
                    console.warn(`${modelNames[index]} model training failed:`, result.reason);
                }
            });

            this.lastTrainedDataId = gameData.id;
            this.lastTrainedAt = new Date().toISOString();
            this.isInitialized = true;

            return this.getAggregateMetrics();
        } finally {
            this.isTraining = false;
        }
    }

    private async trainRetention(userFeatures: UserFeatures[]): Promise<void> {
        // Group users by cohort and calculate retention by day
        const cohortMap = new Map<string, { users: UserFeatures[], retentionByDay: Record<number, number> }>();

        for (const user of userFeatures) {
            if (!cohortMap.has(user.cohort)) {
                cohortMap.set(user.cohort, { users: [], retentionByDay: {} });
            }
            cohortMap.get(user.cohort)!.users.push(user);
        }

        // Calculate retention rates for each cohort
        const cohortData = Array.from(cohortMap.entries()).map(([cohortDate, data]) => {
            const retentionByDay: Record<number, number> = {};
            const size = data.users.length;

            for (let day = 1; day <= 30; day++) {
                // Estimate retention as percentage of users active on that day
                const retainedCount = data.users.filter(u => {
                    const daysActive = u.daysActive;
                    const totalDays = u.daysSinceFirstSession;
                    return day <= totalDays && (daysActive / Math.max(totalDays, 1)) >= (day / 30);
                }).length;
                retentionByDay[day] = retainedCount / size;
            }

            return {
                cohortDate,
                size,
                retentionByDay,
            };
        });

        if (cohortData.length > 0) {
            await this.models.retention.train({ cohortData });
        }
    }

    private async trainChurn(userFeatures: UserFeatures[]): Promise<void> {
        // Prepare churn training data - users with low recent activity are labeled as churned
        const churnData = userFeatures.map(user => ({
            features: user,
            churned: user.lastSessionHoursAgo > 168, // 7 days = churned
            daysUntilChurn: user.lastSessionHoursAgo > 168
                ? Math.floor(user.lastSessionHoursAgo / 24) - 7
                : undefined,
        }));

        if (churnData.length >= 100) {
            await this.models.churn.train(churnData);
        }
    }

    private async trainLTV(userFeatures: UserFeatures[]): Promise<void> {
        // Prepare LTV training data
        const ltvTrainingData = userFeatures.map(user => ({
            features: user,
            actualLTV: user.totalSpend, // Use current spend as actual LTV
            observationDays: user.daysSinceFirstSession,
        }));

        if (ltvTrainingData.length >= 50) {
            await this.models.ltv.train(ltvTrainingData);
        }
    }

    private async trainRevenue(revenueData: Array<{
        date: string;
        revenue: number;
        dau: number;
        newUsers: number;
        payers: number;
    }>): Promise<void> {
        if (revenueData.length >= 7) {
            await this.models.revenue.train(revenueData);
        }
    }

    private async trainAnomaly(
        revenueSeries: Array<{ date: string; value: number }>,
        dauSeries: Array<{ date: string; value: number }>
    ): Promise<void> {
        // Convert to MetricDataPoint format
        const revenueData = revenueSeries.map(p => ({
            timestamp: p.date,
            value: p.value,
        }));
        const dauData = dauSeries.map(p => ({
            timestamp: p.date,
            value: p.value,
        }));

        if (revenueData.length >= 14) {
            await this.models.anomaly.trainMetric('revenue', revenueData);
        }
        if (dauData.length >= 14) {
            await this.models.anomaly.trainMetric('dau', dauData);
        }
    }

    private async trainSegmentation(userFeatures: UserFeatures[]): Promise<void> {
        if (userFeatures.length >= 50) {
            await this.models.segmentation.train(userFeatures);
        }
    }

    // ========================================================================
    // Predictions
    // ========================================================================

    getAllPredictions(): MLPredictions {
        if (!this.isInitialized || this.cachedUserFeatures.length === 0) {
            return this.getEmptyPredictions();
        }

        return {
            churn: this.getChurnPredictions(),
            ltv: this.getLTVPredictions(),
            revenue: this.getRevenueForecast(30),
            retention: this.getRetentionForecast(30),
            segments: this.getUserSegments(),
            anomalies: [], // Will be populated by real-time checks
        };
    }

    getChurnPredictions(limit?: number): ChurnPredictionResult[] {
        const results: ChurnPredictionResult[] = [];

        for (const user of this.cachedUserFeatures) {
            const prediction = this.models.churn.predict(user);
            results.push({
                ...prediction,
                userId: user.userId,
            });
        }

        // Sort by churn probability (highest first)
        results.sort((a, b) => b.value - a.value);

        return limit ? results.slice(0, limit) : results;
    }

    getAtRiskUsers(limit: number = 20): ChurnPredictionResult[] {
        return this.getChurnPredictions()
            .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical')
            .slice(0, limit);
    }

    getLTVPredictions(limit?: number): LTVPredictionResult[] {
        const results: LTVPredictionResult[] = [];

        for (const user of this.cachedUserFeatures) {
            const prediction = this.models.ltv.predict(user);
            results.push({
                ...prediction,
                userId: user.userId,
            });
        }

        // Sort by predicted LTV (highest first)
        results.sort((a, b) => b.value - a.value);

        return limit ? results.slice(0, limit) : results;
    }

    getRetentionForecast(days: number): RetentionPoint[] {
        const forecast: RetentionPoint[] = [];

        // Build observed retention from cached user data
        const observedRetention: Record<number, number> = {};
        if (this.cachedUserFeatures.length > 0) {
            for (let d = 1; d <= 7; d++) {
                const retainedCount = this.cachedUserFeatures.filter(u => {
                    return u.daysSinceFirstSession >= d &&
                           (u.daysActive / Math.max(u.daysSinceFirstSession, 1)) >= (d / 30);
                }).length;
                observedRetention[d] = retainedCount / this.cachedUserFeatures.length;
            }
        } else {
            // Default retention pattern if no data
            observedRetention[1] = 0.40;
            observedRetention[7] = 0.15;
        }

        for (let day = 1; day <= days; day++) {
            const prediction = this.models.retention.predictRetention(
                observedRetention,
                day,
                this.cachedUserFeatures.length || 1000
            );
            forecast.push({
                day,
                retention: prediction.value,
                predicted: day > 7,
            });
        }

        return forecast;
    }

    getRevenueForecast(days: number): RevenueForecast[] {
        return this.models.revenue.forecast(days);
    }

    getUserSegments(): SegmentedUsers | null {
        if (this.cachedUserFeatures.length === 0) return null;

        // Get auto-clusters
        const clusterResult = this.models.segmentation.autoCluster(this.cachedUserFeatures, 5);

        // Convert Map clusters to UserSegment array
        const clusters: UserSegment[] = Array.from(clusterResult.clusters.entries()).map(([clusterId, users]) => ({
            id: `cluster_${clusterId}`,
            name: `Cluster ${clusterId + 1}`,
            description: `Auto-generated cluster with ${users.length} users`,
            criteria: [],
            userCount: users.length,
            percentage: (users.length / this.cachedUserFeatures.length) * 100,
            characteristics: this.calculateClusterCharacteristics(users),
        }));

        // Get predefined segments
        const predefined = {
            whale: [] as UserFeatures[],
            dolphin: [] as UserFeatures[],
            minnow: [] as UserFeatures[],
            nonPayer: [] as UserFeatures[],
            atRisk: [] as UserFeatures[],
            highlyEngaged: [] as UserFeatures[],
            casual: [] as UserFeatures[],
        };

        for (const user of this.cachedUserFeatures) {
            // Spending segments
            if (user.totalSpend >= 100) {
                predefined.whale.push(user);
            } else if (user.totalSpend >= 20) {
                predefined.dolphin.push(user);
            } else if (user.totalSpend > 0) {
                predefined.minnow.push(user);
            } else {
                predefined.nonPayer.push(user);
            }

            // Engagement segments
            if (user.weeklyActiveRatio >= 0.7 && user.sessionCount7d >= 5) {
                predefined.highlyEngaged.push(user);
            } else if (user.weeklyActiveRatio < 0.3 || user.sessionCount7d <= 1) {
                predefined.casual.push(user);
            }

            // Risk segment
            const churnPrediction = this.models.churn.predict(user);
            if (churnPrediction.riskLevel === 'high' || churnPrediction.riskLevel === 'critical') {
                predefined.atRisk.push(user);
            }
        }

        return {
            clusters,
            predefined,
        };
    }

    private calculateClusterCharacteristics(users: UserFeatures[]): Record<string, number> {
        if (users.length === 0) return {};

        const chars: Record<string, number> = {};

        // Calculate averages for key features
        const avgSessionCount7d = users.reduce((sum, u) => sum + u.sessionCount7d, 0) / users.length;
        const avgWeeklyActiveRatio = users.reduce((sum, u) => sum + u.weeklyActiveRatio, 0) / users.length;
        const avgSessionLength = users.reduce((sum, u) => sum + u.avgSessionLength, 0) / users.length;
        const avgProgressionSpeed = users.reduce((sum, u) => sum + u.progressionSpeed, 0) / users.length;
        const avgTotalSpend = users.reduce((sum, u) => sum + u.totalSpend, 0) / users.length;
        const avgPurchaseCount = users.reduce((sum, u) => sum + u.purchaseCount, 0) / users.length;
        const avgFailureRate = users.reduce((sum, u) => sum + u.failureRate, 0) / users.length;

        chars['sessionCount7d'] = avgSessionCount7d;
        chars['weeklyActiveRatio'] = avgWeeklyActiveRatio;
        chars['avgSessionLength'] = avgSessionLength;
        chars['progressionSpeed'] = avgProgressionSpeed;
        chars['totalSpend'] = avgTotalSpend;
        chars['purchaseCount'] = avgPurchaseCount;
        chars['failureRate'] = avgFailureRate;

        return chars;
    }

    detectAnomalies(metrics: Array<{ metric: string; value: number; timestamp: string }>): Anomaly[] {
        const anomalies: Anomaly[] = [];

        for (const point of metrics) {
            const result = this.models.anomaly.detect(point.metric, point.value, new Date(point.timestamp));
            // detect() returns Anomaly | null - if not null, it's an anomaly
            if (result !== null) {
                anomalies.push(result);
            }
        }

        return anomalies;
    }

    // ========================================================================
    // Status & Metrics
    // ========================================================================

    getStatus(): ModelStatus {
        return {
            isInitialized: this.isInitialized,
            isTraining: this.isTraining,
            lastTrainedDataId: this.lastTrainedDataId,
            lastTrainedAt: this.lastTrainedAt,
            modelMetrics: {
                retention: this.models.retention.metrics || null,
                churn: this.models.churn.metrics || null,
                ltv: this.models.ltv.metrics || null,
                revenue: this.models.revenue.metrics || null,
                anomaly: this.models.anomaly.metrics || null,
                segmentation: this.models.segmentation.metrics || null,
            },
            dataPointsUsed: this.dataPointsUsed,
        };
    }

    private getAggregateMetrics(): ModelMetrics {
        const metrics = [
            this.models.retention.metrics,
            this.models.churn.metrics,
            this.models.ltv.metrics,
            this.models.revenue.metrics,
        ].filter(Boolean) as ModelMetrics[];

        if (metrics.length === 0) {
            return {
                lastTrainedAt: new Date().toISOString(),
                dataPointsUsed: this.dataPointsUsed,
            };
        }

        // Average the metrics
        const avgAccuracy = metrics
            .filter(m => m.accuracy !== undefined)
            .reduce((sum, m) => sum + (m.accuracy || 0), 0) / metrics.length;

        return {
            accuracy: avgAccuracy,
            lastTrainedAt: this.lastTrainedAt || new Date().toISOString(),
            dataPointsUsed: this.dataPointsUsed,
        };
    }

    private getEmptyPredictions(): MLPredictions {
        return {
            churn: [],
            ltv: [],
            revenue: [],
            retention: [],
            segments: null,
            anomalies: [],
        };
    }

    // ========================================================================
    // Reset
    // ========================================================================

    reset(): void {
        this.isInitialized = false;
        this.lastTrainedDataId = null;
        this.lastTrainedAt = null;
        this.cachedUserFeatures = [];
        this.dataPointsUsed = 0;
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const mlService = MLService.getInstance();
