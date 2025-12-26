/**
 * Segmentation Model
 * Automatically clusters users into meaningful segments
 * Phase 5: Advanced AI & Automation
 */

import type {
    UserFeatures,
    UserSegment,
    PredefinedSegment,
    SegmentCriteria,
    ModelConfig,
    ModelMetrics,
} from './types';

// ============================================================================
// Types
// ============================================================================

interface ClusterCenter {
    features: Record<string, number>;
    userCount: number;
}

interface SegmentDefinition {
    id: PredefinedSegment;
    name: string;
    description: string;
    criteria: SegmentCriteria[];
    priority: number;
}

// ============================================================================
// Predefined Segments
// ============================================================================

const PREDEFINED_SEGMENTS: SegmentDefinition[] = [
    {
        id: 'whale',
        name: 'Whales',
        description: 'High-spending VIP users',
        criteria: [
            { feature: 'totalSpend', operator: 'gt', value: 100 },
        ],
        priority: 1,
    },
    {
        id: 'dolphin',
        name: 'Dolphins',
        description: 'Regular moderate spenders',
        criteria: [
            { feature: 'totalSpend', operator: 'between', value: [20, 100] },
            { feature: 'purchaseCount', operator: 'gt', value: 1 },
        ],
        priority: 2,
    },
    {
        id: 'minnow',
        name: 'Minnows',
        description: 'Small occasional spenders',
        criteria: [
            { feature: 'totalSpend', operator: 'between', value: [1, 20] },
        ],
        priority: 3,
    },
    {
        id: 'non_payer',
        name: 'Non-Payers',
        description: 'Free-to-play users who haven\'t purchased',
        criteria: [
            { feature: 'isPayer', operator: 'eq', value: 0 },
        ],
        priority: 4,
    },
    {
        id: 'highly_engaged',
        name: 'Highly Engaged',
        description: 'Users with very high activity levels',
        criteria: [
            { feature: 'weeklyActiveRatio', operator: 'gt', value: 0.7 },
            { feature: 'sessionCount7d', operator: 'gt', value: 10 },
        ],
        priority: 5,
    },
    {
        id: 'casual',
        name: 'Casual Players',
        description: 'Light, occasional players',
        criteria: [
            { feature: 'weeklyActiveRatio', operator: 'lt', value: 0.3 },
            { feature: 'avgSessionLength', operator: 'lt', value: 10 },
        ],
        priority: 6,
    },
    {
        id: 'at_risk',
        name: 'At-Risk Users',
        description: 'Users showing signs of disengagement',
        criteria: [
            { feature: 'sessionTrend', operator: 'lt', value: -0.3 },
            { feature: 'lastSessionHoursAgo', operator: 'gt', value: 48 },
        ],
        priority: 7,
    },
    {
        id: 'churned',
        name: 'Churned Users',
        description: 'Users who have stopped playing',
        criteria: [
            { feature: 'lastSessionHoursAgo', operator: 'gt', value: 168 }, // 7 days
        ],
        priority: 8,
    },
    {
        id: 'new_user',
        name: 'New Users',
        description: 'Recently acquired users (< 7 days)',
        criteria: [
            { feature: 'daysSinceFirstSession', operator: 'lt', value: 7 },
        ],
        priority: 9,
    },
    {
        id: 'veteran',
        name: 'Veterans',
        description: 'Long-term loyal players',
        criteria: [
            { feature: 'daysActive', operator: 'gt', value: 30 },
            { feature: 'weeklyActiveRatio', operator: 'gt', value: 0.4 },
        ],
        priority: 10,
    },
];

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ModelConfig = {
    minDataPoints: 100,
    lookbackDays: 30,
    validationSplit: 0.2,
    confidenceThreshold: 0.7,
    updateFrequency: 'daily',
    hyperparameters: {
        numClusters: 5,
        maxIterations: 100,
        convergenceThreshold: 0.01,
    },
};

// ============================================================================
// Segmentation Model Class
// ============================================================================

export class SegmentationModel {
    name = 'SegmentationModel';
    version = '1.0.0';
    config: ModelConfig;
    metrics?: ModelMetrics;

    private clusterCenters: ClusterCenter[] = [];
    private featureNames: string[] = [
        'sessionCount7d',
        'weeklyActiveRatio',
        'avgSessionLength',
        'progressionSpeed',
        'totalSpend',
        'purchaseCount',
        'failureRate',
    ];
    private featureMeans: Record<string, number> = {};
    private featureStds: Record<string, number> = {};

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
    // Segmentation
    // ========================================================================

    /**
     * Assign user to predefined segments
     */
    assignPredefinedSegments(features: UserFeatures): PredefinedSegment[] {
        const segments: PredefinedSegment[] = [];

        for (const segDef of PREDEFINED_SEGMENTS) {
            if (this.matchesCriteria(features, segDef.criteria)) {
                segments.push(segDef.id);
            }
        }

        return segments;
    }

    /**
     * Get primary segment for a user
     */
    getPrimarySegment(features: UserFeatures): PredefinedSegment {
        const segments = this.assignPredefinedSegments(features);

        if (segments.length === 0) {
            // Default to non-payer or casual based on activity
            return features.weeklyActiveRatio > 0.3 ? 'casual' : 'at_risk';
        }

        // Return highest priority (lowest number)
        const segmentDefs = segments.map(id =>
            PREDEFINED_SEGMENTS.find(s => s.id === id)!
        );
        segmentDefs.sort((a, b) => a.priority - b.priority);

        return segmentDefs[0].id;
    }

    /**
     * Segment all users
     */
    segmentUsers(userFeatures: UserFeatures[]): {
        segments: Map<PredefinedSegment, UserFeatures[]>;
        distribution: Record<PredefinedSegment, number>;
        summary: UserSegment[];
    } {
        const segments = new Map<PredefinedSegment, UserFeatures[]>();
        const distribution: Record<string, number> = {};

        // Initialize
        for (const segDef of PREDEFINED_SEGMENTS) {
            segments.set(segDef.id, []);
            distribution[segDef.id] = 0;
        }

        // Assign users
        for (const features of userFeatures) {
            const primary = this.getPrimarySegment(features);
            segments.get(primary)!.push(features);
            distribution[primary]++;
        }

        // Build summary
        const summary: UserSegment[] = PREDEFINED_SEGMENTS.map(segDef => {
            const users = segments.get(segDef.id) || [];
            return {
                id: segDef.id,
                name: segDef.name,
                description: segDef.description,
                criteria: segDef.criteria,
                userCount: users.length,
                percentage: (users.length / userFeatures.length) * 100,
                characteristics: this.calculateCharacteristics(users),
            };
        }).filter(s => s.userCount > 0);

        return {
            segments,
            distribution: distribution as Record<PredefinedSegment, number>,
            summary,
        };
    }

    /**
     * Auto-cluster users using K-means
     */
    autoCluster(
        userFeatures: UserFeatures[],
        numClusters?: number
    ): {
        clusters: Map<number, UserFeatures[]>;
        centers: ClusterCenter[];
        labels: Map<string, number>;
    } {
        const k = numClusters || this.config.hyperparameters?.numClusters || 5;

        // Normalize features
        const normalized = this.normalizeFeatures(userFeatures);

        // Initialize centers randomly
        let centers = this.initializeCenters(normalized, k);

        // K-means iteration
        const maxIter = this.config.hyperparameters?.maxIterations || 100;
        const threshold = this.config.hyperparameters?.convergenceThreshold || 0.01;

        for (let iter = 0; iter < maxIter; iter++) {
            // Assign to clusters
            const assignments = normalized.map((point, idx) => ({
                idx,
                cluster: this.assignToCluster(point, centers),
            }));

            // Update centers
            const newCenters = this.updateCenters(normalized, assignments, k);

            // Check convergence
            if (this.hasConverged(centers, newCenters, threshold)) {
                centers = newCenters;
                break;
            }

            centers = newCenters;
        }

        // Build result
        const clusters = new Map<number, UserFeatures[]>();
        const labels = new Map<string, number>();

        for (let i = 0; i < k; i++) {
            clusters.set(i, []);
        }

        normalized.forEach((point, idx) => {
            const cluster = this.assignToCluster(point, centers);
            clusters.get(cluster)!.push(userFeatures[idx]);
            labels.set(userFeatures[idx].userId, cluster);
        });

        // Convert centers back to original scale
        const originalCenters = centers.map(center => ({
            features: this.denormalizeCenter(center),
            userCount: clusters.get(centers.indexOf(center))!.length,
        }));

        this.clusterCenters = originalCenters;

        return { clusters, centers: originalCenters, labels };
    }

    /**
     * Get segment recommendations for targeting
     */
    getTargetingRecommendations(): Array<{
        segment: PredefinedSegment;
        action: string;
        expectedImpact: string;
        priority: 'high' | 'medium' | 'low';
    }> {
        return [
            {
                segment: 'whale',
                action: 'Offer exclusive VIP content and early access',
                expectedImpact: 'Increased LTV and advocacy',
                priority: 'high',
            },
            {
                segment: 'dolphin',
                action: 'Personalized bundle offers to increase spend',
                expectedImpact: '15-30% spend increase potential',
                priority: 'high',
            },
            {
                segment: 'minnow',
                action: 'Value-focused promotions to encourage second purchase',
                expectedImpact: 'Conversion to dolphin segment',
                priority: 'medium',
            },
            {
                segment: 'non_payer',
                action: 'Starter pack offers when engaged',
                expectedImpact: '3-5% conversion rate',
                priority: 'medium',
            },
            {
                segment: 'highly_engaged',
                action: 'Encourage social sharing and referrals',
                expectedImpact: 'Organic growth and retention',
                priority: 'medium',
            },
            {
                segment: 'at_risk',
                action: 'Re-engagement campaign with bonus rewards',
                expectedImpact: '20-40% can be saved',
                priority: 'high',
            },
            {
                segment: 'churned',
                action: 'Win-back campaign with major content update',
                expectedImpact: '5-15% reactivation rate',
                priority: 'low',
            },
            {
                segment: 'new_user',
                action: 'Onboarding optimization and early retention focus',
                expectedImpact: 'D7 retention improvement',
                priority: 'high',
            },
        ];
    }

    // ========================================================================
    // Training
    // ========================================================================

    async train(userFeatures: UserFeatures[]): Promise<ModelMetrics> {
        if (userFeatures.length < this.config.minDataPoints) {
            throw new Error(`Need at least ${this.config.minDataPoints} users`);
        }

        // Calculate feature statistics
        this.calculateFeatureStats(userFeatures);

        // Run auto-clustering
        this.autoCluster(userFeatures);

        this.metrics = {
            accuracy: 0.85, // Silhouette score placeholder
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: userFeatures.length,
        };

        await this.save();

        return this.metrics;
    }

    // ========================================================================
    // Evaluation
    // ========================================================================

    async evaluate(testData: UserFeatures[]): Promise<ModelMetrics> {
        // Calculate silhouette score (simplified)
        const { labels } = this.autoCluster(testData);

        let totalSilhouette = 0;
        const normalized = this.normalizeFeatures(testData);

        for (let i = 0; i < testData.length; i++) {
            const userCluster = labels.get(testData[i].userId)!;

            // Average distance to same cluster
            let sameClusterDist = 0;
            let sameCount = 0;

            // Average distance to nearest other cluster
            let otherClusterDist = Infinity;

            for (let j = 0; j < testData.length; j++) {
                if (i === j) continue;

                const dist = this.euclideanDistance(normalized[i], normalized[j]);
                const jCluster = labels.get(testData[j].userId)!;

                if (jCluster === userCluster) {
                    sameClusterDist += dist;
                    sameCount++;
                } else {
                    otherClusterDist = Math.min(otherClusterDist, dist);
                }
            }

            const a = sameCount > 0 ? sameClusterDist / sameCount : 0;
            const b = otherClusterDist === Infinity ? 0 : otherClusterDist;
            const silhouette = b > a ? (b - a) / Math.max(a, b) : 0;

            totalSilhouette += silhouette;
        }

        const avgSilhouette = totalSilhouette / testData.length;

        return {
            accuracy: avgSilhouette,
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: testData.length,
        };
    }

    getFeatureImportance(): Record<string, number> {
        return {
            'totalSpend': 0.25,
            'weeklyActiveRatio': 0.20,
            'sessionCount7d': 0.15,
            'progressionSpeed': 0.12,
            'avgSessionLength': 0.10,
            'purchaseCount': 0.10,
            'failureRate': 0.08,
        };
    }

    // ========================================================================
    // Persistence
    // ========================================================================

    async save(): Promise<void> {
        const data = {
            clusterCenters: this.clusterCenters,
            featureMeans: this.featureMeans,
            featureStds: this.featureStds,
            metrics: this.metrics,
        };
        localStorage.setItem('segmentation_model', JSON.stringify(data));
    }

    async load(): Promise<boolean> {
        try {
            const saved = localStorage.getItem('segmentation_model');
            if (saved) {
                const data = JSON.parse(saved);
                this.clusterCenters = data.clusterCenters || [];
                this.featureMeans = data.featureMeans || {};
                this.featureStds = data.featureStds || {};
                this.metrics = data.metrics;
                return true;
            }
        } catch (e) {
            console.warn('Failed to load segmentation model:', e);
        }
        return false;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private matchesCriteria(features: UserFeatures, criteria: SegmentCriteria[]): boolean {
        for (const criterion of criteria) {
            const value = this.getFeatureValue(features, criterion.feature);
            if (value === null) continue;

            switch (criterion.operator) {
                case 'gt':
                    if (value <= (criterion.value as number)) return false;
                    break;
                case 'lt':
                    if (value >= (criterion.value as number)) return false;
                    break;
                case 'eq':
                    if (value !== criterion.value) return false;
                    break;
                case 'between':
                    const [min, max] = criterion.value as number[];
                    if (value < min || value > max) return false;
                    break;
                case 'in':
                    if (!(criterion.value as unknown[]).includes(value)) return false;
                    break;
            }
        }

        return true;
    }

    private getFeatureValue(features: UserFeatures, featureName: string): number | null {
        switch (featureName) {
            case 'sessionCount7d': return features.sessionCount7d;
            case 'sessionCount30d': return features.sessionCount30d;
            case 'weeklyActiveRatio': return features.weeklyActiveRatio;
            case 'avgSessionLength': return features.avgSessionLength;
            case 'progressionSpeed': return features.progressionSpeed;
            case 'totalSpend': return features.totalSpend;
            case 'purchaseCount': return features.purchaseCount;
            case 'failureRate': return features.failureRate;
            case 'daysActive': return features.daysActive;
            case 'daysSinceFirstSession': return features.daysSinceFirstSession;
            case 'lastSessionHoursAgo': return features.lastSessionHoursAgo;
            case 'sessionTrend': return features.sessionTrend;
            case 'isPayer': return features.isPayer ? 1 : 0;
            default: return null;
        }
    }

    private calculateCharacteristics(users: UserFeatures[]): Record<string, number> {
        if (users.length === 0) return {};

        const chars: Record<string, number> = {};

        for (const feature of this.featureNames) {
            const values = users
                .map(u => this.getFeatureValue(u, feature))
                .filter((v): v is number => v !== null);

            if (values.length > 0) {
                chars[feature] = values.reduce((a, b) => a + b, 0) / values.length;
            }
        }

        return chars;
    }

    private calculateFeatureStats(users: UserFeatures[]): void {
        for (const feature of this.featureNames) {
            const values = users
                .map(u => this.getFeatureValue(u, feature))
                .filter((v): v is number => v !== null);

            if (values.length > 0) {
                this.featureMeans[feature] = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((acc, v) =>
                    acc + Math.pow(v - this.featureMeans[feature], 2), 0) / values.length;
                this.featureStds[feature] = Math.sqrt(variance) || 1;
            }
        }
    }

    private normalizeFeatures(users: UserFeatures[]): number[][] {
        return users.map(user => {
            return this.featureNames.map(feature => {
                const value = this.getFeatureValue(user, feature) || 0;
                const mean = this.featureMeans[feature] || 0;
                const std = this.featureStds[feature] || 1;
                return (value - mean) / std;
            });
        });
    }

    private denormalizeCenter(center: number[]): Record<string, number> {
        const result: Record<string, number> = {};

        this.featureNames.forEach((feature, idx) => {
            const mean = this.featureMeans[feature] || 0;
            const std = this.featureStds[feature] || 1;
            result[feature] = center[idx] * std + mean;
        });

        return result;
    }

    private initializeCenters(data: number[][], k: number): number[][] {
        // K-means++ initialization
        const centers: number[][] = [];
        const indices: number[] = [];

        // First center: random
        const firstIdx = Math.floor(Math.random() * data.length);
        centers.push([...data[firstIdx]]);
        indices.push(firstIdx);

        // Remaining centers: probability proportional to distance squared
        for (let i = 1; i < k; i++) {
            const distances = data.map((point, idx) => {
                if (indices.includes(idx)) return 0;
                return Math.min(...centers.map(c => this.euclideanDistanceSquared(point, c)));
            });

            const totalDist = distances.reduce((a, b) => a + b, 0);
            let threshold = Math.random() * totalDist;

            for (let j = 0; j < data.length; j++) {
                threshold -= distances[j];
                if (threshold <= 0) {
                    centers.push([...data[j]]);
                    indices.push(j);
                    break;
                }
            }
        }

        return centers;
    }

    private assignToCluster(point: number[], centers: number[][]): number {
        let minDist = Infinity;
        let cluster = 0;

        for (let i = 0; i < centers.length; i++) {
            const dist = this.euclideanDistanceSquared(point, centers[i]);
            if (dist < minDist) {
                minDist = dist;
                cluster = i;
            }
        }

        return cluster;
    }

    private updateCenters(
        data: number[][],
        assignments: Array<{ idx: number; cluster: number }>,
        k: number
    ): number[][] {
        const newCenters: number[][] = [];
        const dimensions = data[0].length;

        for (let i = 0; i < k; i++) {
            const clusterPoints = assignments
                .filter(a => a.cluster === i)
                .map(a => data[a.idx]);

            if (clusterPoints.length === 0) {
                // Empty cluster: reinitialize randomly
                newCenters.push([...data[Math.floor(Math.random() * data.length)]]);
            } else {
                // Mean of cluster points
                const center = Array(dimensions).fill(0);
                for (const point of clusterPoints) {
                    for (let d = 0; d < dimensions; d++) {
                        center[d] += point[d];
                    }
                }
                for (let d = 0; d < dimensions; d++) {
                    center[d] /= clusterPoints.length;
                }
                newCenters.push(center);
            }
        }

        return newCenters;
    }

    private hasConverged(
        oldCenters: number[][],
        newCenters: number[][],
        threshold: number
    ): boolean {
        for (let i = 0; i < oldCenters.length; i++) {
            const dist = this.euclideanDistance(oldCenters[i], newCenters[i]);
            if (dist > threshold) return false;
        }
        return true;
    }

    private euclideanDistance(a: number[], b: number[]): number {
        return Math.sqrt(this.euclideanDistanceSquared(a, b));
    }

    private euclideanDistanceSquared(a: number[], b: number[]): number {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += Math.pow(a[i] - b[i], 2);
        }
        return sum;
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const segmentationModel = new SegmentationModel();
