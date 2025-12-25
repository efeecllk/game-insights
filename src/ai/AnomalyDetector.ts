/**
 * Anomaly Detector
 * Detects unusual patterns in game metrics using statistical methods
 */

import { NormalizedData } from '../adapters/BaseAdapter';
import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';

// ============ TYPES ============

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyType = 'spike' | 'drop' | 'trend_change' | 'pattern_break';

export interface AnomalyThresholds {
    lowStdDev: number;      // Standard deviations for low severity (default: 2)
    mediumStdDev: number;   // Standard deviations for medium severity (default: 2.5)
    highStdDev: number;     // Standard deviations for high severity (default: 3)
    criticalStdDev: number; // Standard deviations for critical severity (default: 4)
    minDataPoints: number;  // Minimum data points needed for analysis
    minPercentChange: number; // Minimum % change to flag
}

export interface Anomaly {
    id: string;
    metric: string;
    type: AnomalyType;
    severity: AnomalySeverity;
    timestamp: string;
    value: number;
    expectedValue: number;
    deviation: number;          // Number of std deviations from mean
    percentChange: number;      // vs expected/baseline
    description: string;
    possibleCauses: string[];
}

export interface AnomalyDetectionResult {
    anomalies: Anomaly[];
    metricsAnalyzed: string[];
    timeRange: { start: string; end: string } | null;
    baselineStats: Record<string, { mean: number; stdDev: number; median: number }>;
}

export interface DetectionConfig {
    metrics?: SemanticType[];    // Specific metrics to analyze
    thresholds?: Partial<AnomalyThresholds>;
    lookbackDays?: number;       // Historical window
    granularity?: 'hour' | 'day' | 'week';
}

// ============ DEFAULT CONFIG ============

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
    lowStdDev: 2.0,
    mediumStdDev: 2.5,
    highStdDev: 3.0,
    criticalStdDev: 4.0,
    minDataPoints: 7,
    minPercentChange: 20,
};

const DEFAULT_CONFIG: Required<DetectionConfig> = {
    metrics: ['revenue', 'dau', 'retention_day', 'level', 'error_type'],
    thresholds: DEFAULT_THRESHOLDS,
    lookbackDays: 30,
    granularity: 'day',
};

// Possible causes by metric type
const POSSIBLE_CAUSES: Record<string, string[]> = {
    revenue: [
        'Promotional event or sale',
        'App store featuring',
        'Marketing campaign launched',
        'Payment provider issues',
        'Currency exchange fluctuation',
        'New IAP content released',
    ],
    dau: [
        'Marketing campaign effect',
        'App store visibility change',
        'Competitor app launch',
        'Technical issues (crashes, servers)',
        'Seasonal effect',
        'Content update released',
    ],
    retention: [
        'Onboarding flow changed',
        'Game balance adjustment',
        'New content added',
        'Technical stability issues',
        'Matchmaking changes',
    ],
    engagement: [
        'Event or limited-time content',
        'UI/UX changes',
        'Notification strategy change',
        'Server performance issues',
    ],
    error: [
        'New build deployment',
        'Third-party SDK update',
        'Server-side changes',
        'Device OS update',
    ],
    default: [
        'Recent update or change',
        'External factors',
        'Data collection issue',
    ],
};

// ============ HELPER FUNCTIONS ============

function parseDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
        const ts = value > 1e12 ? value : value * 1000;
        return new Date(ts);
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

function getDateKey(date: Date, granularity: 'hour' | 'day' | 'week'): string {
    switch (granularity) {
        case 'hour':
            return date.toISOString().slice(0, 13) + ':00';
        case 'day':
            return date.toISOString().split('T')[0];
        case 'week':
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            return startOfWeek.toISOString().split('T')[0];
    }
}

function calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getNumericValue(row: Record<string, unknown>, column: string): number {
    const val = row[column];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function getSeverity(zScore: number, thresholds: AnomalyThresholds): AnomalySeverity {
    const absZ = Math.abs(zScore);
    if (absZ >= thresholds.criticalStdDev) return 'critical';
    if (absZ >= thresholds.highStdDev) return 'high';
    if (absZ >= thresholds.mediumStdDev) return 'medium';
    if (absZ >= thresholds.lowStdDev) return 'low';
    return 'low';
}

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

// ============ ANOMALY DETECTOR CLASS ============

export class AnomalyDetector {
    private thresholds: AnomalyThresholds = { ...DEFAULT_THRESHOLDS };

    /**
     * Detect anomalies in data across multiple metrics
     */
    detect(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        config: DetectionConfig = {}
    ): AnomalyDetectionResult {
        const fullConfig = {
            ...DEFAULT_CONFIG,
            ...config,
            thresholds: { ...DEFAULT_THRESHOLDS, ...config.thresholds },
        };
        this.thresholds = fullConfig.thresholds;

        const anomalies: Anomaly[] = [];
        const metricsAnalyzed: string[] = [];
        const baselineStats: Record<string, { mean: number; stdDev: number; median: number }> = {};

        // Find timestamp column
        const timestampCol = columnMeanings.find(m => m.semanticType === 'timestamp')?.column;
        const userIdCol = columnMeanings.find(m => m.semanticType === 'user_id')?.column;

        // Determine time range
        let timeRange: { start: string; end: string } | null = null;
        if (timestampCol) {
            const dates = data.rows
                .map(row => parseDate(row[timestampCol]))
                .filter((d): d is Date => d !== null)
                .sort((a, b) => a.getTime() - b.getTime());

            if (dates.length > 0) {
                timeRange = {
                    start: dates[0].toISOString().split('T')[0],
                    end: dates[dates.length - 1].toISOString().split('T')[0],
                };
            }
        }

        // Analyze each target metric
        for (const metric of fullConfig.metrics) {
            const col = columnMeanings.find(m => m.semanticType === metric);
            if (!col) continue;

            metricsAnalyzed.push(col.column);

            // Aggregate data by time period
            const aggregatedData = this.aggregateByTime(
                data,
                col.column,
                timestampCol,
                userIdCol,
                fullConfig.granularity
            );

            if (aggregatedData.length < fullConfig.thresholds.minDataPoints) continue;

            // Calculate baseline statistics
            const values = aggregatedData.map(d => d.value);
            const mean = calculateMean(values);
            const stdDev = calculateStdDev(values, mean);
            const median = calculateMedian(values);

            baselineStats[col.column] = {
                mean: Math.round(mean * 100) / 100,
                stdDev: Math.round(stdDev * 100) / 100,
                median: Math.round(median * 100) / 100,
            };

            // Skip if no variance
            if (stdDev === 0) continue;

            // Detect Z-score anomalies
            const zScoreAnomalies = this.detectZScoreAnomalies(
                aggregatedData,
                mean,
                stdDev,
                col.column,
                metric
            );
            anomalies.push(...zScoreAnomalies);

            // Detect moving average anomalies
            const maAnomalies = this.detectMovingAverageAnomalies(
                aggregatedData,
                col.column,
                metric,
                7 // 7-period moving average
            );
            anomalies.push(...maAnomalies);

            // Detect trend changes (CUSUM)
            const trendAnomalies = this.detectTrendChange(
                aggregatedData,
                col.column,
                metric,
                mean
            );
            anomalies.push(...trendAnomalies);
        }

        // Sort by severity and timestamp
        const severityOrder: Record<AnomalySeverity, number> = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
        };
        anomalies.sort((a, b) => {
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0) return severityDiff;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        return {
            anomalies,
            metricsAnalyzed,
            timeRange,
            baselineStats,
        };
    }

    /**
     * Aggregate data by time period
     */
    private aggregateByTime(
        data: NormalizedData,
        valueCol: string,
        timestampCol: string | undefined,
        userIdCol: string | undefined,
        granularity: 'hour' | 'day' | 'week'
    ): { timestamp: string; value: number }[] {
        const aggregated = new Map<string, { sum: number; count: number; uniqueUsers: Set<string> }>();

        for (const row of data.rows) {
            let key: string;

            if (timestampCol) {
                const date = parseDate(row[timestampCol]);
                if (!date) continue;
                key = getDateKey(date, granularity);
            } else {
                key = 'all';
            }

            if (!aggregated.has(key)) {
                aggregated.set(key, { sum: 0, count: 0, uniqueUsers: new Set() });
            }

            const entry = aggregated.get(key)!;
            const value = getNumericValue(row, valueCol);

            // For user-based metrics, count unique users
            if (userIdCol && (valueCol.includes('dau') || valueCol.includes('user'))) {
                const userId = String(row[userIdCol] ?? '');
                if (userId) entry.uniqueUsers.add(userId);
            } else {
                entry.sum += value;
                entry.count++;
            }
        }

        return Array.from(aggregated.entries())
            .map(([timestamp, entry]) => ({
                timestamp,
                value: entry.uniqueUsers.size > 0
                    ? entry.uniqueUsers.size
                    : entry.count > 0 ? entry.sum / entry.count : 0,
            }))
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    /**
     * Detect anomalies using Z-score method
     */
    private detectZScoreAnomalies(
        data: { timestamp: string; value: number }[],
        mean: number,
        stdDev: number,
        column: string,
        metric: string
    ): Anomaly[] {
        const anomalies: Anomaly[] = [];

        for (const point of data) {
            const zScore = (point.value - mean) / stdDev;

            if (Math.abs(zScore) >= this.thresholds.lowStdDev) {
                const type: AnomalyType = zScore > 0 ? 'spike' : 'drop';
                const severity = getSeverity(zScore, this.thresholds);
                const percentChange = ((point.value - mean) / mean) * 100;

                // Only include if percent change is significant
                if (Math.abs(percentChange) < this.thresholds.minPercentChange) continue;

                const metricCategory = this.getMetricCategory(metric);
                const possibleCauses = POSSIBLE_CAUSES[metricCategory] || POSSIBLE_CAUSES.default;

                anomalies.push({
                    id: generateId(),
                    metric: column,
                    type,
                    severity,
                    timestamp: point.timestamp,
                    value: Math.round(point.value * 100) / 100,
                    expectedValue: Math.round(mean * 100) / 100,
                    deviation: Math.round(zScore * 100) / 100,
                    percentChange: Math.round(percentChange * 100) / 100,
                    description: this.generateDescription(type, column, percentChange, point.timestamp),
                    possibleCauses: possibleCauses.slice(0, 3),
                });
            }
        }

        return anomalies;
    }

    /**
     * Detect anomalies using moving average deviation
     */
    private detectMovingAverageAnomalies(
        data: { timestamp: string; value: number }[],
        column: string,
        metric: string,
        windowSize: number
    ): Anomaly[] {
        const anomalies: Anomaly[] = [];

        if (data.length < windowSize + 1) return anomalies;

        for (let i = windowSize; i < data.length; i++) {
            const window = data.slice(i - windowSize, i);
            const ma = calculateMean(window.map(d => d.value));
            const current = data[i];

            if (ma === 0) continue;

            const deviation = Math.abs(current.value - ma) / ma;
            const percentChange = ((current.value - ma) / ma) * 100;

            // Only flag if > 30% deviation from moving average
            if (deviation > 0.3 && Math.abs(percentChange) >= this.thresholds.minPercentChange) {
                const type: AnomalyType = current.value > ma ? 'spike' : 'drop';

                // Avoid duplicating Z-score anomalies
                const severity: AnomalySeverity = deviation > 0.5 ? 'medium' : 'low';

                const metricCategory = this.getMetricCategory(metric);
                const possibleCauses = POSSIBLE_CAUSES[metricCategory] || POSSIBLE_CAUSES.default;

                anomalies.push({
                    id: generateId(),
                    metric: column,
                    type,
                    severity,
                    timestamp: current.timestamp,
                    value: Math.round(current.value * 100) / 100,
                    expectedValue: Math.round(ma * 100) / 100,
                    deviation: Math.round(deviation * 100) / 100,
                    percentChange: Math.round(percentChange * 100) / 100,
                    description: `${column} deviated ${Math.round(deviation * 100)}% from ${windowSize}-period moving average on ${current.timestamp}`,
                    possibleCauses: possibleCauses.slice(0, 3),
                });
            }
        }

        return anomalies;
    }

    /**
     * Detect trend changes using CUSUM algorithm
     */
    private detectTrendChange(
        data: { timestamp: string; value: number }[],
        column: string,
        metric: string,
        _baseline: number
    ): Anomaly[] {
        const anomalies: Anomaly[] = [];

        if (data.length < 14) return anomalies;

        // Use first 7 points as baseline
        const baselineData = data.slice(0, 7);
        const baselineMean = calculateMean(baselineData.map(d => d.value));

        let cusumPos = 0;
        let cusumNeg = 0;
        const threshold = baselineMean * 0.5;

        for (let i = 7; i < data.length; i++) {
            const diff = data[i].value - baselineMean;
            cusumPos = Math.max(0, cusumPos + diff);
            cusumNeg = Math.min(0, cusumNeg + diff);

            if (Math.abs(cusumPos) > threshold || Math.abs(cusumNeg) > threshold) {
                const type: AnomalyType = 'trend_change';
                const direction = cusumPos > threshold ? 'upward' : 'downward';

                const metricCategory = this.getMetricCategory(metric);
                const possibleCauses = POSSIBLE_CAUSES[metricCategory] || POSSIBLE_CAUSES.default;

                anomalies.push({
                    id: generateId(),
                    metric: column,
                    type,
                    severity: 'high',
                    timestamp: data[i].timestamp,
                    value: Math.round(data[i].value * 100) / 100,
                    expectedValue: Math.round(baselineMean * 100) / 100,
                    deviation: Math.round((Math.max(cusumPos, Math.abs(cusumNeg)) / threshold) * 100) / 100,
                    percentChange: Math.round(((data[i].value - baselineMean) / baselineMean) * 100 * 100) / 100,
                    description: `Significant ${direction} trend change detected in ${column} starting ${data[i].timestamp}`,
                    possibleCauses: possibleCauses.slice(0, 3),
                });

                // Reset CUSUM after detection
                cusumPos = 0;
                cusumNeg = 0;
            }
        }

        return anomalies;
    }

    /**
     * Get metric category for possible causes lookup
     */
    private getMetricCategory(metric: string): string {
        if (metric.includes('revenue') || metric.includes('price') || metric.includes('arpu')) {
            return 'revenue';
        }
        if (metric.includes('dau') || metric.includes('mau') || metric.includes('user')) {
            return 'dau';
        }
        if (metric.includes('retention')) {
            return 'retention';
        }
        if (metric.includes('session') || metric.includes('engagement')) {
            return 'engagement';
        }
        if (metric.includes('error') || metric.includes('crash')) {
            return 'error';
        }
        return 'default';
    }

    /**
     * Generate human-readable description
     */
    private generateDescription(
        type: AnomalyType,
        column: string,
        percentChange: number,
        timestamp: string
    ): string {
        const direction = percentChange > 0 ? 'increased' : 'decreased';
        const absChange = Math.abs(Math.round(percentChange));

        switch (type) {
            case 'spike':
                return `${column} spiked ${absChange}% above baseline on ${timestamp}`;
            case 'drop':
                return `${column} dropped ${absChange}% below baseline on ${timestamp}`;
            case 'trend_change':
                return `${column} ${direction} by ${absChange}% indicating a trend change on ${timestamp}`;
            case 'pattern_break':
                return `Unusual pattern detected in ${column} on ${timestamp}`;
        }
    }

    /**
     * Set custom thresholds
     */
    setThresholds(thresholds: Partial<AnomalyThresholds>): void {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }
}

export const anomalyDetector = new AnomalyDetector();
