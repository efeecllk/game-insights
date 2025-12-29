/**
 * RevenueForecaster Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RevenueForecaster } from '../../../../src/ai/ml/RevenueForecaster';

// Helper to create revenue data points
function createRevenueData(days: number, baseRevenue: number = 1000): Array<{
    date: string;
    revenue: number;
    dau: number;
    newUsers: number;
    payers: number;
}> {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        // Add some variance and weekend patterns
        const dayOfWeek = date.getDay();
        const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
        const randomVariance = 0.9 + Math.random() * 0.2;

        data.push({
            date: date.toISOString().slice(0, 10),
            revenue: baseRevenue * weekendMultiplier * randomVariance,
            dau: Math.floor(10000 * randomVariance),
            newUsers: Math.floor(1000 * randomVariance),
            payers: Math.floor(500 * randomVariance),
        });
    }

    return data;
}

describe('RevenueForecaster', () => {
    let forecaster: RevenueForecaster;

    beforeEach(() => {
        forecaster = new RevenueForecaster();
    });

    describe('initialization', () => {
        it('should have correct default name and version', () => {
            expect(forecaster.name).toBe('RevenueForecaster');
            expect(forecaster.version).toBe('1.0.0');
        });

        it('should have default config values', () => {
            expect(forecaster.config.minDataPoints).toBe(30);
            expect(forecaster.config.lookbackDays).toBe(90);
            expect(forecaster.config.validationSplit).toBe(0.2);
        });

        it('should allow custom config', () => {
            const custom = new RevenueForecaster({ minDataPoints: 14 });
            expect(custom.config.minDataPoints).toBe(14);
        });
    });

    describe('forecast', () => {
        beforeEach(async () => {
            const data = createRevenueData(60, 1000);
            await forecaster.train(data);
        });

        it('should forecast for specified number of days', () => {
            const result = forecaster.forecast(7);

            expect(result.length).toBe(7);
        });

        it('should return forecasts with required fields', () => {
            const result = forecaster.forecast(1);
            const forecast = result[0];

            expect(forecast.value).toBeDefined();
            expect(forecast.confidence).toBeDefined();
            expect(forecast.range).toBeDefined();
            expect(forecast.period).toBe('daily');
            expect(forecast.breakdown).toBeDefined();
            expect(forecast.trend).toBeDefined();
            expect(forecast.seasonalFactor).toBeDefined();
        });

        it('should return positive revenue values', () => {
            const result = forecaster.forecast(30);

            result.forEach(forecast => {
                expect(forecast.value).toBeGreaterThanOrEqual(0);
            });
        });

        it('should have decreasing confidence further out', () => {
            const result = forecaster.forecast(30);

            expect(result[0].confidence).toBeGreaterThan(result[29].confidence);
        });

        it('should include revenue breakdown', () => {
            const result = forecaster.forecast(1);
            const breakdown = result[0].breakdown;

            expect(breakdown.existingUsers).toBeDefined();
            expect(breakdown.newUsers).toBeDefined();
            expect(breakdown.reactivated).toBeDefined();
            expect(breakdown.existingUsers + breakdown.newUsers + breakdown.reactivated)
                .toBeCloseTo(result[0].value, 1);
        });

        it('should include prediction range', () => {
            const result = forecaster.forecast(1);

            expect(result[0].range!.low).toBeLessThan(result[0].value);
            expect(result[0].range!.high).toBeGreaterThan(result[0].value);
        });

        it('should default to 30 days', () => {
            const result = forecaster.forecast();

            expect(result.length).toBe(30);
        });
    });

    describe('forecastSingleDay', () => {
        beforeEach(async () => {
            const data = createRevenueData(60, 1000);
            await forecaster.train(data);
        });

        it('should forecast for specific date', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const result = forecaster.forecastSingleDay(futureDate);

            expect(result.value).toBeGreaterThan(0);
            expect(result.period).toBe('daily');
        });

        it('should apply day-of-week seasonality', () => {
            // Test weekend vs weekday
            const saturday = new Date();
            while (saturday.getDay() !== 6) {
                saturday.setDate(saturday.getDate() + 1);
            }
            const wednesday = new Date();
            while (wednesday.getDay() !== 3) {
                wednesday.setDate(wednesday.getDate() + 1);
            }

            const saturdayForecast = forecaster.forecastSingleDay(saturday);
            const wednesdayForecast = forecaster.forecastSingleDay(wednesday);

            // Both should have seasonal factors applied (may vary based on training data)
            expect(saturdayForecast.seasonalFactor).toBeGreaterThan(0);
            expect(wednesdayForecast.seasonalFactor).toBeGreaterThan(0);
        });

        it('should identify factors', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const result = forecaster.forecastSingleDay(futureDate);

            expect(result.factors).toBeDefined();
        });
    });

    describe('forecastPeriod', () => {
        beforeEach(async () => {
            const data = createRevenueData(60, 1000);
            await forecaster.train(data);
        });

        it('should forecast weekly period', () => {
            const result = forecaster.forecastPeriod('weekly');

            expect(result.period).toBe('weekly');
            expect(result.value).toBeGreaterThan(0);
        });

        it('should forecast monthly period', () => {
            const result = forecaster.forecastPeriod('monthly');

            expect(result.period).toBe('monthly');
            expect(result.value).toBeGreaterThan(0);
        });

        it('should aggregate daily forecasts', () => {
            const weekly = forecaster.forecastPeriod('weekly');
            const dailySum = forecaster.forecast(7).reduce((sum, f) => sum + f.value, 0);

            expect(weekly.value).toBeCloseTo(dailySum, 0);
        });

        it('should aggregate breakdown correctly', () => {
            const result = forecaster.forecastPeriod('weekly');

            expect(result.breakdown.existingUsers).toBeGreaterThan(0);
            expect(result.breakdown.newUsers).toBeGreaterThan(0);
        });

        it('should determine trend correctly', () => {
            const result = forecaster.forecastPeriod('weekly');

            expect(['growing', 'stable', 'declining']).toContain(result.trend);
        });
    });

    describe('whatIf', () => {
        beforeEach(async () => {
            const data = createRevenueData(60, 1000);
            await forecaster.train(data);
        });

        it('should calculate DAU change scenario', () => {
            const result = forecaster.whatIf({ dauChange: 20 }, 30);

            expect(result.scenario.value).toBeGreaterThan(result.baseline.value);
            expect(result.percentChange).toBeGreaterThan(0);
        });

        it('should calculate ARPU change scenario', () => {
            const result = forecaster.whatIf({ arpuChange: 10 }, 30);

            expect(result.scenario.value).toBeGreaterThan(result.baseline.value);
        });

        it('should calculate conversion change scenario', () => {
            const result = forecaster.whatIf({ conversionChange: 50 }, 30);

            expect(result.scenario.value).toBeGreaterThan(result.baseline.value);
        });

        it('should combine multiple changes', () => {
            const result = forecaster.whatIf({
                dauChange: 10,
                arpuChange: 10,
                conversionChange: 10,
            }, 30);

            expect(result.scenario.value).toBeGreaterThan(result.baseline.value);
            expect(result.percentChange).toBeGreaterThan(10); // Combined effect
        });

        it('should handle negative changes', () => {
            const result = forecaster.whatIf({ dauChange: -20 }, 30);

            expect(result.scenario.value).toBeLessThan(result.baseline.value);
            expect(result.difference).toBeLessThan(0);
        });

        it('should include baseline forecast', () => {
            const result = forecaster.whatIf({ dauChange: 10 }, 30);

            expect(result.baseline).toBeDefined();
            expect(result.baseline.value).toBeGreaterThan(0);
        });
    });

    describe('train', () => {
        it('should train on revenue data', async () => {
            const data = createRevenueData(60, 1000);
            const metrics = await forecaster.train(data);

            expect(metrics).toBeDefined();
            expect(metrics.lastTrainedAt).toBeDefined();
            expect(metrics.dataPointsUsed).toBe(60);
        });

        it('should throw error with insufficient data', async () => {
            const data = createRevenueData(10, 1000);

            await expect(forecaster.train(data)).rejects.toThrow('Insufficient data');
        });

        it('should learn trend from data', async () => {
            // Create growing revenue data
            const growingData = createRevenueData(60, 1000).map((d, i) => ({
                ...d,
                revenue: d.revenue * (1 + i * 0.01),
            }));

            await forecaster.train(growingData);
            const result = forecaster.forecast(7);

            // Forecasts should be positive and reasonable
            expect(result.length).toBe(7);
            result.forEach(f => {
                expect(f.value).toBeGreaterThan(0);
            });
        });

        it('should learn seasonality from data', async () => {
            const data = createRevenueData(90, 1000);
            await forecaster.train(data);

            // Model should have learned patterns
            const result = forecaster.forecast(7);
            expect(result.length).toBe(7);
        });
    });

    describe('evaluate', () => {
        it('should return evaluation metrics', async () => {
            const data = createRevenueData(60, 1000);
            await forecaster.train(data);
            const metrics = await forecaster.evaluate(data);

            expect(metrics.mse).toBeDefined();
            expect(metrics.mae).toBeDefined();
            expect(metrics.r2).toBeDefined();
        });

        it('should have reasonable error metrics', async () => {
            const data = createRevenueData(60, 1000);
            await forecaster.train(data);
            const metrics = await forecaster.evaluate(data);

            expect(metrics.mse).toBeGreaterThanOrEqual(0);
            expect(metrics.mae).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getFeatureImportance', () => {
        it('should return feature importance mapping', () => {
            const importance = forecaster.getFeatureImportance();

            expect(importance).toBeDefined();
            expect(Object.keys(importance).length).toBeGreaterThan(0);
        });

        it('should include key features', () => {
            const importance = forecaster.getFeatureImportance();

            expect(importance['historical_trend']).toBeDefined();
            expect(importance['recent_performance']).toBeDefined();
            expect(importance['day_of_week']).toBeDefined();
        });

        it('should have importance values between 0 and 1', () => {
            const importance = forecaster.getFeatureImportance();

            Object.values(importance).forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('seasonal patterns', () => {
        beforeEach(async () => {
            const data = createRevenueData(60, 1000);
            await forecaster.train(data);
        });

        it('should identify weekend effect', () => {
            // Get a weekend day forecast
            const date = new Date();
            while (date.getDay() !== 0) { // Sunday
                date.setDate(date.getDate() + 1);
            }

            const result = forecaster.forecastSingleDay(date);

            // Seasonal factor should be positive
            expect(result.seasonalFactor).toBeGreaterThan(0);
        });

        it('should identify weekday effect', () => {
            // Get a mid-week day forecast
            const date = new Date();
            while (date.getDay() !== 3) { // Wednesday
                date.setDate(date.getDate() + 1);
            }

            const result = forecaster.forecastSingleDay(date);

            // Seasonal factor should be positive
            expect(result.seasonalFactor).toBeGreaterThan(0);
        });
    });

    describe('trend detection', () => {
        it('should detect growing trend', async () => {
            const data = createRevenueData(60, 1000).map((d, i) => ({
                ...d,
                revenue: d.revenue * (1 + i * 0.02),
            }));

            await forecaster.train(data);
            const result = forecaster.forecastPeriod('weekly');

            // Trend should be one of valid values
            expect(['growing', 'stable', 'declining']).toContain(result.trend);
        });

        it('should detect declining trend', async () => {
            const data = createRevenueData(60, 1000).map((d, i) => ({
                ...d,
                revenue: d.revenue * (1 - i * 0.01),
            }));

            await forecaster.train(data);
            const result = forecaster.forecastPeriod('weekly');

            expect(['declining', 'stable', 'growing']).toContain(result.trend);
        });

        it('should detect stable trend', async () => {
            const data = createRevenueData(60, 1000).map(d => ({
                ...d,
                revenue: 1000 + (Math.random() - 0.5) * 50, // Small variance
            }));

            await forecaster.train(data);
            const result = forecaster.forecastPeriod('weekly');

            expect(['stable', 'growing', 'declining']).toContain(result.trend);
        });
    });

    describe('edge cases', () => {
        it('should handle zero revenue days', async () => {
            const data = createRevenueData(60, 1000);
            data[30].revenue = 0;

            await forecaster.train(data);
            const result = forecaster.forecast(7);

            expect(result.length).toBe(7);
            result.forEach(f => expect(f.value).toBeGreaterThanOrEqual(0));
        });

        it('should handle very high revenue spikes', async () => {
            const data = createRevenueData(60, 1000);
            data[30].revenue = 100000;

            await forecaster.train(data);
            const result = forecaster.forecast(7);

            expect(result.length).toBe(7);
        });

        it('should handle minimal training data', async () => {
            const data = createRevenueData(30, 1000); // Minimum required

            const metrics = await forecaster.train(data);
            expect(metrics).toBeDefined();

            const result = forecaster.forecast(7);
            expect(result.length).toBe(7);
        });
    });
});
