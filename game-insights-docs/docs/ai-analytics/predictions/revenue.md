---
sidebar_position: 4
title: Revenue Forecasting
description: Predict future revenue with confidence intervals
---

# Revenue Forecasting

The Revenue Forecaster predicts future revenue based on historical trends, seasonality, and current performance. This enables proactive business planning and early identification of revenue risks.

## Overview

Revenue forecasting combines time-series analysis with seasonal patterns to project daily, weekly, and monthly revenue.

```typescript
import { revenueForecaster } from '@/ai/ml';

// Forecast next 30 days
const forecasts = revenueForecaster.forecast(30);

forecasts.forEach(f => {
  console.log(`${f.period}: $${f.value.toFixed(2)}`);
  console.log(`  Confidence: ${(f.confidence * 100).toFixed(0)}%`);
  console.log(`  Range: $${f.range.low.toFixed(2)} - $${f.range.high.toFixed(2)}`);
});
```

---

## 30-Day Projections

### Daily Forecasts

Get revenue predictions for each day:

```typescript
const dailyForecasts = revenueForecaster.forecast(30, true);

dailyForecasts.forEach(forecast => {
  console.log(`Predicted: $${forecast.value.toFixed(2)}`);
  console.log(`Trend: ${forecast.trend}`);
  console.log(`Seasonal factor: ${forecast.seasonalFactor.toFixed(2)}`);
});
```

### Revenue Breakdown

Each forecast includes source breakdown:

```typescript
const forecast = revenueForecaster.forecastSingleDay(targetDate);

console.log('Revenue breakdown:');
console.log(`  Existing users: $${forecast.breakdown.existingUsers.toFixed(2)}`);
console.log(`  New users: $${forecast.breakdown.newUsers.toFixed(2)}`);
console.log(`  Reactivated: $${forecast.breakdown.reactivated.toFixed(2)}`);
```

### Period Aggregates

```typescript
// Weekly forecast
const weeklyForecast = revenueForecaster.forecastPeriod('weekly');
console.log(`Next 7 days: $${weeklyForecast.value.toFixed(2)}`);

// Monthly forecast
const monthlyForecast = revenueForecaster.forecastPeriod('monthly');
console.log(`Next 30 days: $${monthlyForecast.value.toFixed(2)}`);
```

---

## Confidence Intervals

### How Confidence is Calculated

Confidence decreases with forecast distance:

| Period | Confidence | Best Use |
|--------|------------|----------|
| 7 days | High (80%+) | Operational planning |
| 30 days | Medium (60-80%) | Budget allocation |
| 90 days | Lower (40-60%) | Strategic planning |

### Range Estimates

Each forecast includes low/high bounds:

```typescript
const forecast = revenueForecaster.forecastSingleDay(targetDate);

// Default range: +/- 30% of predicted value
console.log(`Low estimate: $${forecast.range.low.toFixed(2)}`);
console.log(`High estimate: $${forecast.range.high.toFixed(2)}`);
```

---

## Seasonal Adjustments

### Day-of-Week Patterns

Revenue varies by day of the week:

```typescript
const DOW_MULTIPLIERS = {
  Sunday: 1.15,     // Weekend peak
  Monday: 0.90,
  Tuesday: 0.85,
  Wednesday: 0.85,  // Mid-week low
  Thursday: 0.90,
  Friday: 1.05,
  Saturday: 1.30,   // Weekend peak
};
```

### Month-of-Year Patterns

```typescript
const MONTH_MULTIPLIERS = {
  November: 1.10,   // Holiday buildup
  December: 1.20,   // Holiday peak
  January: 1.00,    // Post-holiday
  July: 0.95,       // Summer lull
};
```

### Learning Custom Seasonality

Train on your historical data:

```typescript
const historicalData = [
  { date: '2024-01-01', revenue: 15000, dau: 8500, newUsers: 500, payers: 340 },
  { date: '2024-01-02', revenue: 12000, dau: 7800, newUsers: 450, payers: 290 },
  // ... more data
];

await revenueForecaster.train(historicalData);
// The model now uses YOUR seasonality patterns
```

---

## What-If Analysis

### Scenario Modeling

Explore how metric changes affect revenue:

```typescript
const scenario = revenueForecaster.whatIf({
  dauChange: 20,        // +20% DAU
  arpuChange: 10,       // +10% ARPU
  conversionChange: 15, // +15% payer conversion
}, 30);

console.log('Baseline 30-day revenue:', scenario.baseline.value.toFixed(2));
console.log('Scenario 30-day revenue:', scenario.scenario.value.toFixed(2));
console.log('Revenue difference:', scenario.difference.toFixed(2));
console.log('Percent change:', scenario.percentChange.toFixed(1) + '%');
```

### Common Scenarios

| Scenario | Example Impact |
|----------|----------------|
| DAU increase | +20% DAU -> +18% revenue |
| ARPU improvement | +10% ARPU -> +10% revenue |
| Conversion boost | +50% conversion -> +25% revenue |

---

## Training the Forecaster

### Historical Data Format

```typescript
interface RevenueDataPoint {
  date: string;           // ISO date (YYYY-MM-DD)
  revenue: number;        // Daily revenue
  dau: number;            // Daily active users
  newUsers: number;       // New users that day
  payers: number;         // Paying users
  arpu?: number;          // Optional
  arppu?: number;         // Optional
}
```

### Training Process

```typescript
const historicalData: RevenueDataPoint[] = [...];

const metrics = await revenueForecaster.train(historicalData);

console.log('MSE:', metrics.mse);
console.log('MAE:', metrics.mae);
console.log('R-squared:', metrics.r2);
```

### What Training Learns

1. **Baseline revenue**: Average daily revenue
2. **Trend slope**: Is revenue growing or declining?
3. **Day-of-week patterns**: Custom weekly seasonality
4. **Month patterns**: Custom yearly seasonality (if 90+ days)

---

## API Reference

### RevenueForecaster Class

```typescript
class RevenueForecaster {
  forecast(days?: number, includeBreakdown?: boolean): RevenueForecast[];

  forecastSingleDay(date: Date, includeBreakdown?: boolean): RevenueForecast;

  forecastPeriod(
    period: 'weekly' | 'monthly',
    startDate?: Date
  ): RevenueForecast;

  whatIf(
    scenarios: {
      dauChange?: number;
      arpuChange?: number;
      conversionChange?: number;
    },
    days?: number
  ): {
    baseline: RevenueForecast;
    scenario: RevenueForecast;
    difference: number;
    percentChange: number;
  };

  train(data: RevenueDataPoint[]): Promise<ModelMetrics>;
}
```

### RevenueForecast Interface

```typescript
interface RevenueForecast {
  value: number;                  // Predicted revenue
  confidence: number;
  range: { low: number; high: number };
  period: 'daily' | 'weekly' | 'monthly';
  breakdown: {
    existingUsers: number;
    newUsers: number;
    reactivated: number;
  };
  trend: 'growing' | 'stable' | 'declining';
  seasonalFactor: number;
  factors?: PredictionFactor[];
}
```

---

## Best Practices

### Data Requirements

- **Minimum days**: 30 for basic forecasting
- **Ideal days**: 90+ for seasonal patterns
- **Year of data**: Best for capturing yearly cycles

### Improving Accuracy

1. **Exclude anomalies**: Don't train on major outlier days
2. **Account for events**: Flag promotional periods separately
3. **Update regularly**: Retrain weekly with new data
4. **Segment forecasts**: Different regions may have different patterns

### When to Retrain

- Weekly routine retraining
- After major game updates
- After monetization changes
- After seasonal events
- When predictions consistently miss

---

## Next Steps

- [Retention Prediction](./retention) - Forecast user retention
- [LTV Prediction](./ltv) - Estimate customer lifetime value
- [Anomaly Detection](../anomaly-detection) - Detect revenue anomalies
