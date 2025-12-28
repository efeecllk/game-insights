---
sidebar_position: 3
title: LTV Prediction
description: Estimate user lifetime value for smarter decisions
---

# Lifetime Value Prediction

The LTV Predictor estimates the total revenue a user will generate over their lifetime. This enables smarter user acquisition decisions, prioritized retention efforts, and targeted monetization strategies.

## Overview

LTV prediction combines spending history, engagement patterns, and behavioral signals to forecast future revenue from each user.

```typescript
import { ltvPredictor } from '@/ai/ml';

// Predict LTV for a user
const prediction = ltvPredictor.predict(userFeatures, 365);

console.log('Predicted 365-day LTV:', prediction.value);
console.log('User segment:', prediction.segment);
console.log('30-day projection:', prediction.projectedSpend30d);
```

---

## User Segmentation by Value

### Segment Thresholds

Users are classified into spending tiers:

| Segment | LTV Range | Description | Typical % |
|---------|-----------|-------------|-----------|
| **Whale** | $100+ | Top spenders, VIP treatment | 1-2% |
| **Dolphin** | $20-100 | Regular spenders | 5-10% |
| **Minnow** | $1-20 | Light spenders | 10-20% |
| **Non-Payer** | $0 | Free players | 70-85% |

### Segment Users

```typescript
const allUserFeatures = [...];

const segmentation = ltvPredictor.segmentUsers(allUserFeatures);

console.log('Whales:', segmentation.whales.length);
console.log('Dolphins:', segmentation.dolphins.length);
console.log('Minnows:', segmentation.minnows.length);
console.log('Non-payers:', segmentation.nonPayers.length);

console.log('Summary:');
console.log('Total projected LTV:', segmentation.summary.totalProjectedLTV);
console.log('Average LTV:', segmentation.summary.avgLTV);
console.log('Payer %:', segmentation.summary.payerPercentage);
```

---

## LTV Estimation Methods

### Core Algorithm

The predictor uses weighted linear regression on behavioral features:

```typescript
const COEFFICIENTS = {
  intercept: 0,
  isPayer: 50,              // $50 baseline for payers
  totalSpend: 2.5,          // 2.5x multiplier on past spend
  purchaseCount: 5,         // $5 per purchase
  daysActive: 0.5,          // $0.50 per active day
  sessionCount30d: 0.2,     // $0.20 per session
  progressionSpeed: 3,      // $3 per level/day
  earlyPurchase: 30,        // $30 bonus for D1-7 purchase
};
```

### Prediction Horizons

LTV is projected across multiple time windows:

```typescript
const prediction = ltvPredictor.predict(userFeatures, 365);

console.log('30-day LTV:', prediction.projectedSpend30d);
console.log('90-day LTV:', prediction.projectedSpend90d);
console.log('365-day LTV:', prediction.projectedSpend365d);
```

### Early LTV Prediction

Predict lifetime value from first-week behavior:

```typescript
const earlyPrediction = ltvPredictor.predictEarlyLTV(
  5,        // Days since install
  8,        // Session count
  4.99,     // Total spend so far
  15        // Current level
);

console.log('Projected LTV:', earlyPrediction.value);
console.log('Segment:', earlyPrediction.segment);
// Early spenders get 2.5x LTV multiplier
```

---

## High-Potential Non-Payers

Identify users likely to convert:

```typescript
const highPotential = ltvPredictor.getHighPotentialNonPayers(
  allUserFeatures,
  50  // Top 50 candidates
);

highPotential.forEach(({ user, conversionProbability, potentialLTV }) => {
  console.log(`User ${user.userId}:`);
  console.log(`  Conversion probability: ${(conversionProbability * 100).toFixed(0)}%`);
  console.log(`  Potential LTV if converted: $${potentialLTV.toFixed(2)}`);
});
```

### Conversion Probability Factors

The model considers:
- **High weekly engagement** (>70%) = 2x base rate
- **More sessions** = more opportunities
- **Fast progression** shows investment
- **Early in lifecycle** (D1-7) = 1.5x boost
- **After D30** = 0.5x (harder to convert)

---

## Optimization Strategies

| Segment | Strategy | Actions |
|---------|----------|---------|
| **Whale** | Retention & satisfaction | VIP perks, early access, personal support |
| **Dolphin** | Upsell to whale | Bundle deals, subscription offers |
| **Minnow** | Increase purchase frequency | Limited offers, FOMO events |
| **High-potential non-payer** | Convert | Starter packs, first-purchase bonuses |
| **Low-potential non-payer** | Monetize via ads | Ad-supported content |

---

## Model Training

### Training Data

```typescript
interface LTVTrainingData {
  features: UserFeatures;
  actualLTV: number;          // Observed total spend
  observationDays: number;    // Days of observation
}
```

### Training Process

```typescript
const trainingData: LTVTrainingData[] = [...];

const metrics = await ltvPredictor.train(trainingData);

console.log('MSE:', metrics.mse);
console.log('MAE:', metrics.mae);
console.log('R-squared:', metrics.r2);
```

---

## For User Acquisition

Calculate acceptable CPI:

```typescript
const avgLTV = segmentation.summary.avgLTV;
const targetROAS = 1.2;  // 120% return on ad spend

const maxCPI = avgLTV / targetROAS;
console.log(`Maximum CPI: $${maxCPI.toFixed(2)}`);

// Example: $5.00 = $6.00 / 1.2
```

---

## API Reference

### LTVPredictor Class

```typescript
class LTVPredictor {
  predict(features: UserFeatures, horizonDays?: number): LTVPrediction;

  predictEarlyLTV(
    daysSinceInstall: number,
    sessionCount: number,
    totalSpend: number,
    currentLevel: number
  ): LTVPrediction;

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
  };

  getHighPotentialNonPayers(
    userFeatures: UserFeatures[],
    limit?: number
  ): Array<{
    user: UserFeatures;
    conversionProbability: number;
    potentialLTV: number;
  }>;

  train(data: LTVTrainingData[]): Promise<ModelMetrics>;
}
```

### LTVPrediction Interface

```typescript
interface LTVPrediction {
  value: number;                // Total predicted LTV
  confidence: number;
  range: { low: number; high: number };
  segment: 'whale' | 'dolphin' | 'minnow' | 'non_payer';
  projectedSpend30d: number;
  projectedSpend90d: number;
  projectedSpend365d: number;
  factors?: PredictionFactor[];
}
```

---

## Best Practices

### Data Requirements

- **Minimum users**: 200 for reliable training
- **Observation period**: 90+ days for accurate LTV
- **Include churned users**: Don't just train on active users

### Improving Accuracy

1. **Segment separately**: Train models for different user types
2. **Use decay rates**: Account for spending decline over time
3. **Include seasonality**: Holiday spending is different
4. **Update regularly**: Retrain monthly with new data

### Common Pitfalls

- **Survivorship bias**: Only analyzing current users overestimates LTV
- **Short observation**: 30-day LTV vastly underestimates lifetime value
- **Ignoring churned**: Excluding churned users inflates predictions

---

## Next Steps

- [Revenue Forecasting](./revenue) - Aggregate revenue predictions
- [Churn Prediction](./churn) - Protect high-LTV users from churning
- [Recommendations](../recommendations) - LTV-based action recommendations
