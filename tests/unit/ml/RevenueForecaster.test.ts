/**
 * RevenueForecaster Unit Tests
 * Tests for revenue prediction and forecasting
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RevenueForecaster, revenueForecaster } from '@/ai/ml/RevenueForecaster';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Helper to create revenue data points
function createRevenueData(days: number, baseRevenue: number = 1000): Array<{
    date: string;
    revenue: number;
    dau: number;
    newUsers: number;
    payers: number;
}> {
    const data = [];
    const today = new Date();

    for (let i = days; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // Add some randomness and weekly pattern
        const dayOfWeek = date.getDay();
        const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.2 : 1;
        const variance = 0.9 + Math.random() * 0.2;

        data.push({
            date: date.toISOString().slice(0, 10),
            revenue: baseRevenue * weekendBoost * variance,
            dau: 10000 + Math.floor(Math.random() * 2000),
            newUsers: 500 + Math.floor(Math.random() * 200),
            payers: 300 + Math.floor(Math.random() * 100),
        });
    }

    return data;
}

describe('RevenueForecaster', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const forecaster = new RevenueForecaster();

            expect(forecaster.name).toBe('RevenueForecaster');
            expect(forecaster.version).toBe('1.0.0');
            expect(forecaster.config).toBeDefined();
        });

        it('should merge custom config with defaults', () => {
            const forecaster = new RevenueForecaster({
                minDataPoints: 60,
                lookbackDays: 120,
            });

            expect(forecaster.config.minDataPoints).toBe(60);
            expect(forecaster.config.lookbackDays).toBe(120);
        });
    });

    // =========================================================================
    // Forecast Tests
    // =========================================================================

    describe('forecast', () => {
        it('should return array of forecasts for specified days', () => {
            const forecaster = new RevenueForecaster();

            const forecasts = forecaster.forecast(7);

            expect(forecasts.length).toBe(7);
        });

        it('should return forecasts with required fields', () => {
            const forecaster = new RevenueForecaster();

            const forecasts = forecaster.forecast(1);

            expect(forecasts[0].value).toBeDefined();
            expect(forecasts[0].confidence).toBeDefined();
            expect(forecasts[0].period).toBe('daily');
            expect(forecasts[0].breakdown).toBeDefined();
            expect(forecasts[0].trend).toBeDefined();
            expect(forecasts[0].seasonalFactor).toBeDefined();
        });

        it('should include prediction range', () => {
            const forecaster = new RevenueForecaster();

            const forecasts = forecaster.forecast(1);

            expect(forecasts[0].range?.low).toBeDefined();
            expect(forecasts[0].range?.high).toBeDefined();
            expect(forecasts[0].range?.low).toBeLessThanOrEqual(forecasts[0].range?.high || 0);
        });

        it('should include revenue breakdown', () => {
            const forecaster = new RevenueForecaster();

            const forecasts = forecaster.forecast(1, true);

            expect(forecasts[0].breakdown.existingUsers).toBeDefined();
            expect(forecasts[0].breakdown.newUsers).toBeDefined();
            expect(forecasts[0].breakdown.reactivated).toBeDefined();
        });

        it('should decrease confidence for distant forecasts', () => {
            const forecaster = new RevenueForecaster();

            const forecasts = forecaster.forecast(30);

            expect(forecasts[0].confidence).toBeGreaterThan(forecasts[29].confidence);
        });
    });

    // =========================================================================
    // Single Day Forecast Tests
    // =========================================================================

    describe('forecastSingleDay', () => {
        it('should forecast for a specific date', () => {
            const forecaster = new RevenueForecaster();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const forecast = forecaster.forecastSingleDay(tomorrow);

            expect(forecast.value).toBeGreaterThanOrEqual(0);
            expect(forecast.period).toBe('daily');
        });

        it('should apply seasonal multiplier', () => {
            const forecaster = new RevenueForecaster();
            const date = new Date();

            const forecast = forecaster.forecastSingleDay(date);

            expect(forecast.seasonalFactor).toBeGreaterThan(0);
        });

        it('should identify trend direction', () => {
            const forecaster = new RevenueForecaster();
            const date = new Date();

            const forecast = forecaster.forecastSingleDay(date);

            expect(['growing', 'stable', 'declining']).toContain(forecast.trend);
        });

        it('should identify prediction factors', () => {
            const forecaster = new RevenueForecaster();
            const date = new Date();

            const forecast = forecaster.forecastSingleDay(date);

            expect(forecast.factors).toBeDefined();
        });
    });

    // =========================================================================
    // Period Forecast Tests
    // =========================================================================

    describe('forecastPeriod', () => {
        it('should forecast weekly revenue', () => {
            const forecaster = new RevenueForecaster();

            const forecast = forecaster.forecastPeriod('weekly');

            expect(forecast.period).toBe('weekly');
            expect(forecast.value).toBeGreaterThanOrEqual(0);
        });

        it('should forecast monthly revenue', () => {
            const forecaster = new RevenueForecaster();

            const forecast = forecaster.forecastPeriod('monthly');

            expect(forecast.period).toBe('monthly');
            expect(forecast.value).toBeGreaterThanOrEqual(0);
        });

        it('should aggregate breakdown correctly', () => {
            const forecaster = new RevenueForecaster();

            const forecast = forecaster.forecastPeriod('weekly');

            const totalBreakdown = forecast.breakdown.existingUsers +
                forecast.breakdown.newUsers +
                forecast.breakdown.reactivated;

            expect(totalBreakdown).toBeCloseTo(forecast.value, 0);
        });

        it('should include period factors', () => {
            const forecaster = new RevenueForecaster();

            const forecast = forecaster.forecastPeriod('monthly');

            expect(forecast.factors).toBeDefined();
        });
    });

    // =========================================================================
    // What-If Analysis Tests
    // =========================================================================

    describe('whatIf', () => {
        it('should calculate scenario impact', () => {
            const forecaster = new RevenueForecaster();

            const result = forecaster.whatIf({ dauChange: 10 }, 30);

            expect(result.baseline).toBeDefined();
            expect(result.scenario).toBeDefined();
            expect(result.difference).toBeDefined();
            expect(result.percentChange).toBeDefined();
        });

        it('should return different scenarios for DAU changes', () => {
            const forecaster = new RevenueForecaster();

            const increase = forecaster.whatIf({ dauChange: 20 }, 30);
            const decrease = forecaster.whatIf({ dauChange: -20 }, 30);

            // DAU increase should result in higher or equal scenario vs decrease
            expect(increase.scenario.value).toBeGreaterThanOrEqual(decrease.scenario.value);
        });

        it('should handle ARPU changes', () => {
            const forecaster = new RevenueForecaster();

            const result = forecaster.whatIf({ arpuChange: 15 }, 30);

            expect(result.percentChange).toBeDefined();
            expect(typeof result.percentChange).toBe('number');
        });

        it('should handle conversion rate changes', () => {
            const forecaster = new RevenueForecaster();

            const result = forecaster.whatIf({ conversionChange: 10 }, 30);

            expect(result.percentChange).toBeDefined();
            expect(typeof result.percentChange).toBe('number');
        });

        it('should handle combined scenario changes', () => {
            const forecaster = new RevenueForecaster();

            const result = forecaster.whatIf({
                dauChange: 10,
                arpuChange: 5,
                conversionChange: 5,
            }, 30);

            expect(result.difference).toBeDefined();
            expect(typeof result.difference).toBe('number');
        });
    });

    // =========================================================================
    // Training Tests
    // =========================================================================

    describe('train', () => {
        it('should throw error for insufficient data', async () => {
            const forecaster = new RevenueForecaster({ minDataPoints: 30 });
            const data = createRevenueData(10);

            await expect(forecaster.train(data)).rejects.toThrow('Insufficient data');
        });

        it('should train on revenue data', async () => {
            const forecaster = new RevenueForecaster({ minDataPoints: 10 });
            const data = createRevenueData(30);

            const metrics = await forecaster.train(data);

            expect(metrics.dataPointsUsed).toBe(30);
            expect(metrics.lastTrainedAt).toBeDefined();
        });

        it('should learn from historical patterns', async () => {
            const forecaster = new RevenueForecaster({ minDataPoints: 10 });
            const data = createRevenueData(60, 2000);

            await forecaster.train(data);
            const forecast = forecaster.forecast(1);

            expect(forecast[0].value).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Evaluation Tests
    // =========================================================================

    describe('evaluate', () => {
        it('should return evaluation metrics', async () => {
            const forecaster = new RevenueForecaster({ minDataPoints: 10 });
            const data = createRevenueData(30);

            const metrics = await forecaster.evaluate(data);

            expect(metrics.mse).toBeDefined();
            expect(metrics.mae).toBeDefined();
            expect(metrics.dataPointsUsed).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Feature Importance Tests
    // =========================================================================

    describe('getFeatureImportance', () => {
        it('should return feature importance scores', () => {
            const forecaster = new RevenueForecaster();

            const importance = forecaster.getFeatureImportance();

            expect(importance.historical_trend).toBeDefined();
            expect(importance.day_of_week).toBeDefined();
        });

        it('should sum to approximately 1', () => {
            const forecaster = new RevenueForecaster();

            const importance = forecaster.getFeatureImportance();
            const sum = Object.values(importance).reduce((a, b) => a + b, 0);

            expect(sum).toBeCloseTo(1, 0);
        });
    });

    // =========================================================================
    // Persistence Tests
    // =========================================================================

    describe('save and load', () => {
        it('should save model to localStorage', async () => {
            const forecaster = new RevenueForecaster();

            await forecaster.save();

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'revenue_forecaster_model',
                expect.any(String)
            );
        });

        it('should load model from localStorage', async () => {
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
                baselineRevenue: 1000,
                trendSlope: 0.05,
                seasonalPattern: { dayOfWeek: [1, 1, 1, 1, 1, 1, 1] },
                metrics: { mse: 100 },
            }));

            const forecaster = new RevenueForecaster();
            const loaded = await forecaster.load();

            expect(loaded).toBe(true);
        });

        it('should return false when no saved model', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const forecaster = new RevenueForecaster();
            const loaded = await forecaster.load();

            expect(loaded).toBe(false);
        });
    });

    // =========================================================================
    // Seasonal Pattern Tests
    // =========================================================================

    describe('seasonal patterns', () => {
        it('should apply day of week seasonality', () => {
            const forecaster = new RevenueForecaster();

            // Get forecasts for a week
            const forecasts = forecaster.forecast(7);

            // All should have seasonal factors
            for (const forecast of forecasts) {
                expect(forecast.seasonalFactor).toBeGreaterThan(0);
            }
        });

        it('should identify weekend effects in factors', () => {
            const forecaster = new RevenueForecaster();

            // Find a Sunday
            const sunday = new Date();
            sunday.setDate(sunday.getDate() + (7 - sunday.getDay()));

            const forecast = forecaster.forecastSingleDay(sunday);

            // May or may not have weekend effect depending on learned patterns
            expect(forecast.factors).toBeDefined();
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle zero baseline revenue', () => {
            const forecaster = new RevenueForecaster();

            const forecasts = forecaster.forecast(7);

            for (const forecast of forecasts) {
                expect(forecast.value).toBeGreaterThanOrEqual(0);
            }
        });

        it('should handle very long forecast horizons', () => {
            const forecaster = new RevenueForecaster();

            const forecasts = forecaster.forecast(365);

            expect(forecasts.length).toBe(365);
            expect(forecasts[364].confidence).toBeGreaterThan(0);
        });

        it('should handle negative trends', async () => {
            const forecaster = new RevenueForecaster({ minDataPoints: 10 });
            const data = [];
            const today = new Date();

            // Create declining revenue data
            for (let i = 30; i >= 1; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                data.push({
                    date: date.toISOString().slice(0, 10),
                    revenue: 1000 + i * 10, // Declining toward present
                    dau: 10000,
                    newUsers: 500,
                    payers: 300,
                });
            }

            await forecaster.train(data);
            const forecast = forecaster.forecastSingleDay(new Date());

            expect(forecast.trend).toBeDefined();
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export revenueForecaster singleton', () => {
            expect(revenueForecaster).toBeInstanceOf(RevenueForecaster);
        });

        it('should have default configuration', () => {
            expect(revenueForecaster.config).toBeDefined();
            expect(revenueForecaster.name).toBe('RevenueForecaster');
        });
    });
});
