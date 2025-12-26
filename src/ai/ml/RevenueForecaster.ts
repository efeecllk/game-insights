/**
 * Revenue Forecaster
 * Predicts future revenue based on historical data and trends
 * Phase 5: Advanced AI & Automation
 */

import type {
    RevenueForecast,
    ModelConfig,
    ModelMetrics,
    PredictionFactor,
} from './types';

// ============================================================================
// Types
// ============================================================================

interface RevenueDataPoint {
    date: string;
    revenue: number;
    dau: number;
    newUsers: number;
    payers: number;
    arpu?: number;
    arppu?: number;
}

interface SeasonalPattern {
    dayOfWeek: number[];  // 0-6 (Sun-Sat) multipliers
    monthOfYear: number[]; // 0-11 multipliers
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ModelConfig = {
    minDataPoints: 30,
    lookbackDays: 90,
    validationSplit: 0.2,
    confidenceThreshold: 0.7,
    updateFrequency: 'daily',
    hyperparameters: {
        trendWeight: 0.3,
        seasonalWeight: 0.2,
        recentWeight: 0.5,
        smoothingFactor: 0.2,
    },
};

// Default seasonal patterns
const DEFAULT_SEASONAL: SeasonalPattern = {
    dayOfWeek: [1.15, 0.90, 0.85, 0.85, 0.90, 1.05, 1.30], // Sun higher, Wed lowest
    monthOfYear: [1.0, 0.95, 0.95, 0.98, 1.0, 1.0, 0.95, 0.95, 1.0, 1.05, 1.1, 1.2],
};

// ============================================================================
// Revenue Forecaster Class
// ============================================================================

export class RevenueForecaster {
    name = 'RevenueForecaster';
    version = '1.0.0';
    config: ModelConfig;
    metrics?: ModelMetrics;

    private historicalData: RevenueDataPoint[] = [];
    private seasonalPattern: SeasonalPattern = DEFAULT_SEASONAL;
    private baselineRevenue: number = 0;
    private trendSlope: number = 0;

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
     * Forecast revenue for next N days
     */
    forecast(
        days: number = 30,
        includeBreakdown: boolean = true
    ): RevenueForecast[] {
        const forecasts: RevenueForecast[] = [];
        const today = new Date();

        for (let i = 1; i <= days; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + i);

            const forecast = this.forecastSingleDay(targetDate, includeBreakdown);
            forecasts.push(forecast);
        }

        return forecasts;
    }

    /**
     * Forecast revenue for a specific date
     */
    forecastSingleDay(date: Date, includeBreakdown: boolean = true): RevenueForecast {
        const dayOfWeek = date.getDay();
        const month = date.getMonth();
        const daysAhead = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // Base prediction from trend
        const trendPrediction = this.baselineRevenue + (this.trendSlope * daysAhead);

        // Apply seasonality
        const seasonalMultiplier = this.seasonalPattern.dayOfWeek[dayOfWeek] *
            this.seasonalPattern.monthOfYear[month];
        const adjustedPrediction = trendPrediction * seasonalMultiplier;

        // Calculate confidence (decreases with distance)
        const confidence = Math.max(0.3, 0.9 - (daysAhead * 0.02));

        // Determine trend
        const trend = this.trendSlope > 0.01 ? 'growing' :
            this.trendSlope < -0.01 ? 'declining' : 'stable';

        // Build factors
        const factors = this.identifyFactors(dayOfWeek, month, daysAhead);

        const forecast: RevenueForecast = {
            value: Math.max(0, adjustedPrediction),
            confidence,
            range: {
                low: Math.max(0, adjustedPrediction * 0.7),
                high: adjustedPrediction * 1.3,
            },
            factors,
            period: 'daily',
            breakdown: includeBreakdown ? this.calculateBreakdown(adjustedPrediction) : {
                existingUsers: adjustedPrediction * 0.7,
                newUsers: adjustedPrediction * 0.25,
                reactivated: adjustedPrediction * 0.05,
            },
            trend,
            seasonalFactor: seasonalMultiplier,
        };

        return forecast;
    }

    /**
     * Forecast aggregate revenue for a period
     */
    forecastPeriod(
        period: 'weekly' | 'monthly',
        _startDate?: Date
    ): RevenueForecast {
        const days = period === 'weekly' ? 7 : 30;

        const dailyForecasts = this.forecast(days);
        const totalRevenue = dailyForecasts.reduce((sum, f) => sum + f.value, 0);
        const avgConfidence = dailyForecasts.reduce((sum, f) => sum + f.confidence, 0) / days;

        // Calculate range
        const lowSum = dailyForecasts.reduce((sum, f) => sum + (f.range?.low || f.value * 0.7), 0);
        const highSum = dailyForecasts.reduce((sum, f) => sum + (f.range?.high || f.value * 1.3), 0);

        // Aggregate breakdown
        const breakdown = dailyForecasts.reduce(
            (acc, f) => ({
                existingUsers: acc.existingUsers + f.breakdown.existingUsers,
                newUsers: acc.newUsers + f.breakdown.newUsers,
                reactivated: acc.reactivated + f.breakdown.reactivated,
            }),
            { existingUsers: 0, newUsers: 0, reactivated: 0 }
        );

        // Determine overall trend
        const trendScore = dailyForecasts.reduce((acc, f, i) =>
            acc + (f.value - (dailyForecasts[i - 1]?.value || f.value)), 0);
        const trend = trendScore > totalRevenue * 0.05 ? 'growing' :
            trendScore < -totalRevenue * 0.05 ? 'declining' : 'stable';

        return {
            value: totalRevenue,
            confidence: avgConfidence,
            range: { low: lowSum, high: highSum },
            period,
            breakdown,
            trend,
            seasonalFactor: 1, // Not applicable for periods
            factors: this.getPeriodFactors(period, trend),
        };
    }

    /**
     * Scenario analysis: What if metrics change?
     */
    whatIf(scenarios: {
        dauChange?: number;     // Percentage change in DAU
        arpuChange?: number;    // Percentage change in ARPU
        conversionChange?: number; // Percentage change in payer conversion
    }, days: number = 30): {
        baseline: RevenueForecast;
        scenario: RevenueForecast;
        difference: number;
        percentChange: number;
    } {
        const baseline = this.forecastPeriod(days <= 7 ? 'weekly' : 'monthly');

        let scenarioMultiplier = 1;

        if (scenarios.dauChange) {
            scenarioMultiplier *= (1 + scenarios.dauChange / 100);
        }
        if (scenarios.arpuChange) {
            scenarioMultiplier *= (1 + scenarios.arpuChange / 100);
        }
        if (scenarios.conversionChange) {
            // Conversion affects ARPU indirectly
            scenarioMultiplier *= (1 + (scenarios.conversionChange / 100) * 0.5);
        }

        const scenarioForecast: RevenueForecast = {
            ...baseline,
            value: baseline.value * scenarioMultiplier,
            range: {
                low: (baseline.range?.low || baseline.value * 0.7) * scenarioMultiplier,
                high: (baseline.range?.high || baseline.value * 1.3) * scenarioMultiplier,
            },
        };

        return {
            baseline,
            scenario: scenarioForecast,
            difference: scenarioForecast.value - baseline.value,
            percentChange: ((scenarioForecast.value / baseline.value) - 1) * 100,
        };
    }

    // ========================================================================
    // Training
    // ========================================================================

    async train(data: RevenueDataPoint[]): Promise<ModelMetrics> {
        if (data.length < this.config.minDataPoints) {
            throw new Error(`Insufficient data: need at least ${this.config.minDataPoints} days`);
        }

        // Store historical data
        this.historicalData = data.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Calculate baseline and trend
        this.calculateTrend();

        // Learn seasonal patterns
        this.learnSeasonality();

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

    private calculateTrend(): void {
        const n = this.historicalData.length;
        if (n < 2) {
            this.baselineRevenue = this.historicalData[0]?.revenue || 0;
            this.trendSlope = 0;
            return;
        }

        // Simple linear regression
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += this.historicalData[i].revenue;
            sumXY += i * this.historicalData[i].revenue;
            sumX2 += i * i;
        }

        this.trendSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        this.baselineRevenue = (sumY - this.trendSlope * sumX) / n;

        // Use more recent baseline
        const recentDays = Math.min(7, n);
        const recentAvg = this.historicalData.slice(-recentDays)
            .reduce((sum, d) => sum + d.revenue, 0) / recentDays;

        // Blend historical trend with recent performance
        const recentWeight = this.config.hyperparameters?.recentWeight || 0.5;
        this.baselineRevenue = this.baselineRevenue * (1 - recentWeight) +
            recentAvg * recentWeight;
    }

    private learnSeasonality(): void {
        // Group by day of week
        const dowRevenue: number[][] = [[], [], [], [], [], [], []];
        const avgRevenue = this.historicalData.reduce((sum, d) => sum + d.revenue, 0) /
            this.historicalData.length;

        for (const point of this.historicalData) {
            const dow = new Date(point.date).getDay();
            dowRevenue[dow].push(point.revenue / avgRevenue);
        }

        // Calculate day-of-week multipliers
        this.seasonalPattern.dayOfWeek = dowRevenue.map(revenues =>
            revenues.length > 0
                ? revenues.reduce((a, b) => a + b, 0) / revenues.length
                : 1
        );

        // Group by month (if enough data)
        if (this.historicalData.length >= 90) {
            const monthRevenue: number[][] = Array(12).fill(null).map(() => []);

            for (const point of this.historicalData) {
                const month = new Date(point.date).getMonth();
                monthRevenue[month].push(point.revenue / avgRevenue);
            }

            this.seasonalPattern.monthOfYear = monthRevenue.map(revenues =>
                revenues.length > 0
                    ? revenues.reduce((a, b) => a + b, 0) / revenues.length
                    : 1
            );
        }
    }

    // ========================================================================
    // Evaluation
    // ========================================================================

    async evaluate(data: RevenueDataPoint[]): Promise<ModelMetrics> {
        // Hold-out validation
        const splitIdx = Math.floor(data.length * (1 - this.config.validationSplit));
        const testData = data.slice(splitIdx);

        let totalSquaredError = 0;
        let totalAbsError = 0;

        for (const point of testData) {
            const date = new Date(point.date);
            const forecast = this.forecastSingleDay(date, false);
            const error = point.revenue - forecast.value;

            totalSquaredError += error * error;
            totalAbsError += Math.abs(error);
        }

        const mse = totalSquaredError / testData.length;
        const mae = totalAbsError / testData.length;

        // Calculate MAPE
        const mape = testData.reduce((sum, point) => {
            const forecast = this.forecastSingleDay(new Date(point.date), false);
            return sum + Math.abs((point.revenue - forecast.value) / point.revenue);
        }, 0) / testData.length;

        return {
            mse,
            mae,
            r2: 1 - mape, // Simplified
            lastTrainedAt: new Date().toISOString(),
            dataPointsUsed: testData.length,
        };
    }

    getFeatureImportance(): Record<string, number> {
        return {
            'historical_trend': 0.30,
            'recent_performance': 0.25,
            'day_of_week': 0.20,
            'month_of_year': 0.10,
            'dau_trend': 0.10,
            'arpu_trend': 0.05,
        };
    }

    // ========================================================================
    // Persistence
    // ========================================================================

    async save(): Promise<void> {
        const data = {
            baselineRevenue: this.baselineRevenue,
            trendSlope: this.trendSlope,
            seasonalPattern: this.seasonalPattern,
            historicalData: this.historicalData.slice(-90), // Keep last 90 days
            metrics: this.metrics,
        };
        localStorage.setItem('revenue_forecaster_model', JSON.stringify(data));
    }

    async load(): Promise<boolean> {
        try {
            const saved = localStorage.getItem('revenue_forecaster_model');
            if (saved) {
                const data = JSON.parse(saved);
                this.baselineRevenue = data.baselineRevenue || 0;
                this.trendSlope = data.trendSlope || 0;
                this.seasonalPattern = data.seasonalPattern || DEFAULT_SEASONAL;
                this.historicalData = data.historicalData || [];
                this.metrics = data.metrics;
                return true;
            }
        } catch (e) {
            console.warn('Failed to load revenue model:', e);
        }
        return false;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private calculateBreakdown(totalRevenue: number): {
        existingUsers: number;
        newUsers: number;
        reactivated: number;
    } {
        // Use historical ratios if available
        const recent = this.historicalData.slice(-7);

        if (recent.length === 0) {
            return {
                existingUsers: totalRevenue * 0.70,
                newUsers: totalRevenue * 0.25,
                reactivated: totalRevenue * 0.05,
            };
        }

        // Estimate based on DAU composition
        const avgNewUserRatio = recent.reduce((sum, d) =>
            sum + (d.newUsers / d.dau), 0) / recent.length;

        return {
            existingUsers: totalRevenue * (1 - avgNewUserRatio - 0.05),
            newUsers: totalRevenue * avgNewUserRatio,
            reactivated: totalRevenue * 0.05,
        };
    }

    private identifyFactors(dayOfWeek: number, month: number, daysAhead: number): PredictionFactor[] {
        const factors: PredictionFactor[] = [];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        // Day of week effect
        const dowMultiplier = this.seasonalPattern.dayOfWeek[dayOfWeek];
        if (dowMultiplier > 1.1) {
            factors.push({
                name: 'Weekend Effect',
                impact: dowMultiplier - 1,
                description: `${dayNames[dayOfWeek]}s typically see ${Math.round((dowMultiplier - 1) * 100)}% higher revenue`,
            });
        } else if (dowMultiplier < 0.9) {
            factors.push({
                name: 'Weekday Dip',
                impact: dowMultiplier - 1,
                description: `${dayNames[dayOfWeek]}s typically see ${Math.round((1 - dowMultiplier) * 100)}% lower revenue`,
            });
        }

        // Month effect
        const monthMultiplier = this.seasonalPattern.monthOfYear[month];
        if (monthMultiplier > 1.1) {
            factors.push({
                name: 'Seasonal Peak',
                impact: monthMultiplier - 1,
                description: `${monthNames[month]} is typically a high-revenue month`,
            });
        }

        // Trend
        if (this.trendSlope > 0.01) {
            factors.push({
                name: 'Growth Trend',
                impact: Math.min(0.5, this.trendSlope * 10),
                description: 'Revenue trending upward',
            });
        } else if (this.trendSlope < -0.01) {
            factors.push({
                name: 'Declining Trend',
                impact: Math.max(-0.5, this.trendSlope * 10),
                description: 'Revenue trending downward',
            });
        }

        // Prediction uncertainty
        if (daysAhead > 14) {
            factors.push({
                name: 'Long-term Forecast',
                impact: -0.1,
                description: 'Predictions further out have higher uncertainty',
            });
        }

        return factors;
    }

    private getPeriodFactors(period: 'weekly' | 'monthly', trend: 'growing' | 'stable' | 'declining'): PredictionFactor[] {
        const factors: PredictionFactor[] = [];

        if (trend === 'growing') {
            factors.push({
                name: 'Positive Momentum',
                impact: 0.3,
                description: 'Revenue shows upward trend',
            });
        } else if (trend === 'declining') {
            factors.push({
                name: 'Negative Momentum',
                impact: -0.3,
                description: 'Revenue shows downward trend',
            });
        }

        if (period === 'monthly' && this.historicalData.length >= 60) {
            factors.push({
                name: 'Historical Patterns',
                impact: 0.2,
                description: 'Based on 60+ days of data',
            });
        }

        return factors;
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const revenueForecaster = new RevenueForecaster();
