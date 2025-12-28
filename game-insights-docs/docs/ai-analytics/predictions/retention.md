---
sidebar_position: 1
title: Retention Prediction
description: Predict D1, D7, D30 retention rates using AI models
---

# Retention Prediction

Game Insights uses machine learning to predict future retention rates based on early cohort data. This enables proactive planning and early warning when retention trends deviate from expectations.

## Overview

The Retention Predictor uses power law decay models combined with game-type benchmarks to forecast D7, D30, and beyond from limited early data.

```typescript
import { retentionPredictor } from '@/ai/ml';

// Predict D30 from D1 and D7 data
const prediction = retentionPredictor.predictD30FromEarly(
  0.45,   // D1 retention
  0.18,   // D7 retention
  10000   // Cohort size
);

console.log('Predicted D30:', prediction.value);
console.log('Confidence:', prediction.confidence);
console.log('Range:', prediction.range.low, '-', prediction.range.high);
```

---

## D1, D7, D30 Prediction Models

### Power Law Decay Model

Retention follows a predictable decay pattern. The model uses:

```
R(t) = R(1) * t^(-alpha)
```

Where:
- `R(t)` = retention at day t
- `R(1)` = D1 retention
- `alpha` = decay rate derived from observed data

### From D1 and D7 Data

Most common scenario - predict D30 from first week:

```typescript
const prediction = retentionPredictor.predictD30FromEarly(
  0.45,   // D1 retention (45%)
  0.18,   // D7 retention (18%)
  5000    // Cohort size
);

// Returns:
{
  value: 0.089,              // Predicted D30 (8.9%)
  confidence: 0.75,          // Model confidence
  range: {
    low: 0.062,              // Lower bound
    high: 0.116              // Upper bound
  },
  factors: [
    { name: 'D1 Retention', impact: 0.8, description: 'D1 at 45.0%' },
    { name: 'D1->D7 Decay', impact: 0.2, description: '40.0% retained from D1 to D7' }
  ],
  retentionCurve: [...],     // Full projected curve
  benchmarkComparison: 'above'
}
```

### From Observed Retention Data

When you have more data points:

```typescript
const observed = {
  1: 0.45,   // D1
  3: 0.28,   // D3
  7: 0.18,   // D7
  14: 0.12   // D14
};

const prediction = retentionPredictor.predictRetention(
  observed,
  30,      // Target day
  10000    // Cohort size
);
```

---

## Cohort-Based Analysis

### Training on Historical Cohorts

Train the model on your historical data for improved accuracy:

```typescript
const cohortData = [
  {
    cohortDate: '2024-01-01',
    size: 5000,
    retentionByDay: { 1: 0.42, 7: 0.16, 14: 0.10, 30: 0.07 }
  },
  {
    cohortDate: '2024-01-08',
    size: 4800,
    retentionByDay: { 1: 0.44, 7: 0.18, 14: 0.11, 30: 0.08 }
  },
];

const metrics = await retentionPredictor.train({ cohortData });
console.log('Model MSE:', metrics.mse);
console.log('Model MAE:', metrics.mae);
```

### Predicting Cohort LTV

Combine retention curves with ARPDAU to estimate cohort lifetime value:

```typescript
const retentionCurve = [
  { day: 1, retention: 0.45 },
  { day: 7, retention: 0.18 },
  { day: 14, retention: 0.12 },
  { day: 30, retention: 0.08 }
];

const { ltv, confidence } = retentionPredictor.predictCohortLTV(
  retentionCurve,
  0.15,    // Daily ARPDAU ($0.15)
  365      // Horizon in days
);
```

---

## Confidence Intervals

### How Confidence is Calculated

Confidence decreases with:
- **Distance from observed data**: Predicting D30 from D7 has higher confidence than D90
- **Data quantity**: More observed days = higher confidence
- **Data consistency**: Smooth curves = higher confidence

### Understanding the Range

Each prediction includes a confidence range:

```typescript
const prediction = retentionPredictor.predictRetention(observed, 30);

// Range represents +/- 20% of predicted value
console.log('Predicted:', prediction.value);         // 0.089
console.log('Low estimate:', prediction.range.low);  // 0.071
console.log('High estimate:', prediction.range.high);// 0.107
```

### Benchmark Comparison

Predictions are compared against game-type benchmarks:

| Game Type | D1 Benchmark | D7 Benchmark | D30 Benchmark |
|-----------|--------------|--------------|---------------|
| Puzzle | 45% | 18% | 10% |
| Idle | 50% | 21% | 12% |
| Battle Royale | 40% | 15% | 7% |
| Match3 Meta | 48% | 19% | 11% |
| Gacha RPG | 42% | 17% | 9% |

```typescript
// benchmarkComparison values:
// 'above' - 10%+ better than benchmark
// 'at' - Within 10% of benchmark
// 'below' - 10%+ worse than benchmark
```

---

## Using Predictions for Planning

### User Acquisition Planning

```typescript
// Plan: Acquire 10,000 users on Jan 1
const newUsers = 10000;
const d30Prediction = retentionPredictor.predictD30FromEarly(0.45, 0.18);

// Estimated D30 DAU contribution
const d30DAU = newUsers * d30Prediction.value;
console.log('Expected D30 DAU:', d30DAU); // ~890 users

// Factor in prediction range for planning scenarios
const optimistic = newUsers * d30Prediction.range.high;  // ~1160 users
const pessimistic = newUsers * d30Prediction.range.low;  // ~620 users
```

### Early Warning System

Monitor actual vs predicted retention to catch issues early:

```typescript
const actualD7 = 0.14;  // From real data
const predictedD7 = 0.18;

const deviation = (actualD7 - predictedD7) / predictedD7;
if (deviation < -0.15) {
  console.warn('Retention tracking below expectations!');
}
```

---

## Feature Importance

The model weights these factors when predicting retention:

| Feature | Importance | Description |
|---------|------------|-------------|
| D1 Retention | 35% | First-day return rate |
| D7 Retention | 25% | Week-one stickiness |
| Session Frequency | 15% | How often users play |
| Progression Speed | 10% | Level advancement rate |
| Early Monetization | 8% | Purchases in first week |
| Social Engagement | 7% | Friend/guild activity |

---

## API Reference

### RetentionPredictor Class

```typescript
class RetentionPredictor {
  predictRetention(
    observedRetention: Record<number, number>,
    targetDay: number,
    cohortSize?: number
  ): RetentionPrediction;

  predictD30FromEarly(
    d1: number,
    d7: number,
    cohortSize?: number
  ): RetentionPrediction;

  predictCohortLTV(
    retentionCurve: Array<{ day: number; retention: number }>,
    dailyARPDAU: number,
    horizonDays?: number
  ): { ltv: number; confidence: number };

  train(data: RetentionInput): Promise<ModelMetrics>;
  save(): Promise<void>;
  load(): Promise<boolean>;
}
```

### RetentionPrediction Interface

```typescript
interface RetentionPrediction {
  value: number;                    // Predicted retention rate (0-1)
  confidence: number;               // Model confidence (0-1)
  range?: { low: number; high: number };
  factors?: PredictionFactor[];
  cohortSize: number;
  retentionCurve: Array<{ day: number; retention: number }>;
  benchmarkComparison: 'above' | 'at' | 'below';
}
```

---

## Best Practices

### Data Requirements

- **Minimum cohort size**: 100 users for reliable predictions
- **Minimum data points**: 2+ retention measurements (D1, D7 minimum)
- **Lookback period**: 90 days of historical cohorts for training

### Improving Accuracy

1. **Train on your data**: Use `train()` with historical cohorts
2. **Use more data points**: D1, D3, D7, D14 better than just D1, D7
3. **Segment predictions**: Predict separately for different user segments
4. **Update regularly**: Retrain weekly with new cohort data

### Common Pitfalls

- **Small cohorts**: Below 100 users, predictions are unreliable
- **Seasonal effects**: Train on full-year data when possible
- **Changed game**: Major updates invalidate old predictions

---

## Next Steps

- [Churn Prediction](./churn) - Identify at-risk users
- [LTV Prediction](./ltv) - Estimate customer lifetime value
- [Revenue Forecasting](./revenue) - Project future revenue
