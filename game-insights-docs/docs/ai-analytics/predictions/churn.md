---
sidebar_position: 2
title: Churn Prediction
description: Identify users at risk of churning before they leave
---

# Churn Prediction

The Churn Predictor identifies users at risk of leaving your game before they actually churn. This enables proactive intervention to save users and protect revenue.

## Overview

Churn prediction uses behavioral signals to score each user's likelihood of churning in the next 7 days. High-risk users can be targeted with retention campaigns before it's too late.

```typescript
import { churnPredictor } from '@/ai/ml';

// Predict churn for a single user
const prediction = churnPredictor.predict(userFeatures);

console.log('Churn probability:', prediction.value);
console.log('Risk level:', prediction.riskLevel);
console.log('Prevention actions:', prediction.preventionActions);
```

---

## Churn Risk Scoring

### Risk Levels

Users are classified into four risk tiers:

| Risk Level | Score Range | Description | Urgency |
|------------|-------------|-------------|---------|
| **Critical** | 80-100% | Almost certain to churn | Immediate action |
| **High** | 60-79% | Likely to churn soon | Act within 24-48 hours |
| **Medium** | 40-59% | Shows warning signs | Monitor closely |
| **Low** | 0-39% | Healthy engagement | Standard treatment |

### Scoring Algorithm

The model weighs multiple behavioral signals:

```typescript
const FEATURE_WEIGHTS = {
  sessionTrend: 0.20,           // Declining sessions = higher churn
  lastSessionHoursAgo: 0.18,    // Long absence = higher churn
  failureRate: 0.12,            // High failures = frustration
  stuckAtLevel: 0.10,           // Progression blocked
  weeklyActiveRatio: 0.15,      // Low weekly engagement
  progressionSpeed: 0.08,       // Slow progress
  daysActive: 0.07,             // Shorter tenure = higher risk
  isPayer: 0.05,                // Payers churn less
  daysSinceLastPurchase: 0.05,  // Lapsed payers at risk
};
```

---

## At-Risk User Identification

### Single User Prediction

```typescript
const userFeatures = {
  userId: 'user_123',
  cohort: '2024-01-15',
  sessionCount7d: 2,
  sessionCount30d: 8,
  sessionTrend: -0.4,           // 40% decline
  lastSessionHoursAgo: 96,      // 4 days ago
  failureRate: 0.45,            // 45% attempt failures
  stuckAtLevel: true,
  currentLevel: 25,
  isPayer: false,
  weeklyActiveRatio: 0.28,      // Only 2 days/week
  // ... more features
};

const prediction = churnPredictor.predict(userFeatures);

// Result:
{
  value: 0.78,
  riskLevel: 'high',
  daysUntilChurn: 3,
  preventionActions: [
    'Send re-engagement notification with special offer',
    'Offer help or hints for difficult content',
    'Offer free power-up or helper item'
  ],
  factors: [
    { name: 'Declining Activity', impact: 0.8, description: 'Session frequency down 40%' },
    { name: 'Extended Absence', impact: 0.7, description: 'Last session 4 days ago' },
    { name: 'High Failure Rate', impact: 0.6, description: '45% attempt failure rate' },
    { name: 'Progression Blocked', impact: 0.5, description: 'Stuck at level 25' }
  ]
}
```

### Batch Prediction

Analyze your entire user base at once:

```typescript
const allUserFeatures = [...]; // Array of user feature objects

const result = churnPredictor.predictBatch(allUserFeatures);

console.log('Summary:');
console.log('Total users:', result.summary.totalUsers);
console.log('At risk:', result.summary.atRiskCount);
console.log('At risk %:', result.summary.atRiskPercentage);

console.log('Segments:');
console.log('Critical:', result.segments.critical.length);
console.log('High:', result.segments.high.length);
console.log('Medium:', result.segments.medium.length);
console.log('Low:', result.segments.low.length);
```

### Get Top At-Risk Users

```typescript
const atRiskUsers = churnPredictor.getAtRiskUsers(
  allUserFeatures,
  100,      // Limit to top 100
  'high'    // Minimum risk level
);

atRiskUsers.forEach(({ user, prediction }) => {
  console.log(`${user.userId}: ${(prediction.value * 100).toFixed(0)}% churn risk`);
  console.log(`  Days until churn: ${prediction.daysUntilChurn}`);
  console.log(`  Actions: ${prediction.preventionActions.join(', ')}`);
});
```

---

## Prevention Strategies

### Automated Actions by Risk Factor

| Factor | Prevention Action |
|--------|-------------------|
| **Declining Activity** | Re-engagement notification with special offer |
| **Extended Absence** | "We miss you" message with comeback bonus |
| **High Failure Rate** | Offer help or hints for difficult content |
| **Progression Blocked** | Send tips for current level, free power-up |
| **Low Weekly Engagement** | Implement daily login rewards |

### Intervention Timing

```typescript
// Priority matrix
const INTERVENTION_PRIORITY = {
  critical: 'immediate',     // Within hours
  high: '24-48 hours',       // Before next expected session
  medium: '3-7 days',        // During next week
  low: 'monitor only',       // No immediate action
};
```

---

## Re-engagement Recommendations

### By Risk Level

| Risk Level | Strategy | Example Actions |
|------------|----------|-----------------|
| **Critical** (80%+) | Immediate outreach | Significant incentive, personal touch |
| **High** (60-79%) | Proactive within 48h | Moderate incentive, feature highlight |
| **Medium** (40-59%) | Gentle reminder | Social proof, event invitation |
| **Low** (&lt;40%) | Standard messaging | Regular game updates |

---

## Model Training

### Training Data Requirements

```typescript
interface ChurnTrainingData {
  features: UserFeatures;
  churned: boolean;           // Did user actually churn?
  daysUntilChurn?: number;    // Days from snapshot to churn
}
```

### Training Process

```typescript
const trainingData: ChurnTrainingData[] = [...];

const metrics = await churnPredictor.train(trainingData);

console.log('Accuracy:', metrics.accuracy);
console.log('Precision:', metrics.precision);
console.log('Recall:', metrics.recall);
console.log('F1 Score:', metrics.f1Score);
console.log('AUC:', metrics.auc);
```

### Model Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Accuracy | >75% | Overall correct predictions |
| Precision | >70% | Of predicted churners, how many actually churn |
| Recall | >80% | Of actual churners, how many were identified |
| AUC | >0.80 | Area under ROC curve |

---

## API Reference

### ChurnPredictor Class

```typescript
class ChurnPredictor {
  predict(features: UserFeatures): ChurnPrediction;

  predictBatch(userFeatures: UserFeatures[]): {
    predictions: Map<string, ChurnPrediction>;
    segments: {
      critical: UserFeatures[];
      high: UserFeatures[];
      medium: UserFeatures[];
      low: UserFeatures[];
    };
    summary: {
      totalUsers: number;
      atRiskCount: number;
      atRiskPercentage: number;
      avgChurnScore: number;
    };
  };

  getAtRiskUsers(
    userFeatures: UserFeatures[],
    limit?: number,
    minRiskLevel?: 'medium' | 'high' | 'critical'
  ): Array<{ user: UserFeatures; prediction: ChurnPrediction }>;

  train(data: ChurnTrainingData[]): Promise<ModelMetrics>;
  getFeatureImportance(): Record<string, number>;
}
```

### ChurnPrediction Interface

```typescript
interface ChurnPrediction {
  value: number;              // Churn probability (0-1)
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  daysUntilChurn?: number;
  preventionActions: string[];
  factors: PredictionFactor[];
  range: { low: number; high: number };
}
```

---

## Best Practices

### Data Collection

1. **Track all features**: More behavioral data = better predictions
2. **Update daily**: Fresh data improves accuracy
3. **Define churn clearly**: 7 days of inactivity is a common threshold

### Model Maintenance

1. **Retrain weekly**: User behavior patterns shift over time
2. **Monitor precision**: Too many false positives waste resources
3. **Track intervention success**: Measure if actions actually prevent churn

### Intervention Design

1. **Personalize messages**: Use specific reasons from factors
2. **Time it right**: Intervene before the predicted churn date
3. **Test different offers**: A/B test intervention types
4. **Avoid notification fatigue**: Don't over-communicate

---

## Next Steps

- [LTV Prediction](./ltv) - Prioritize high-value at-risk users
- [Revenue Forecasting](./revenue) - Understand churn impact on revenue
- [Recommendations](../recommendations) - Broader recommendation engine
