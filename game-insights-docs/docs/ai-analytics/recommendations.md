---
sidebar_position: 7
title: AI Recommendations
description: Get actionable AI-powered insights for your game
---

# AI Recommendations

Game Insights generates actionable recommendations based on your data patterns, game type, and industry benchmarks. These AI-powered insights help you identify opportunities and issues proactively.

## Overview

The Recommendation Engine analyzes your metrics and produces prioritized recommendations with estimated impact and effort assessments.

```typescript
import { recommendationEngine } from '@/ai';

// Generate recommendations from metrics
const context = recommendationEngine.createContext(metrics, 'puzzle');
const recommendations = recommendationEngine.generateRecommendations(context);

recommendations.forEach(rec => {
  console.log(`[${rec.priority}] ${rec.title}`);
  console.log(`  Impact: ${rec.impact.changePercent}% ${rec.impact.metric}`);
  console.log(`  Actions: ${rec.actions.length}`);
});
```

---

## Insight Types

### Priority Levels

| Priority | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **Critical** | Immediate action required | Same day | D1 retention crashed |
| **High** | Important optimization | This week | High churn risk |
| **Medium** | Beneficial improvement | This month | Conversion opportunity |
| **Low** | Nice-to-have | When convenient | Minor optimization |

### Insight Categories

| Category | Description | Metrics |
|----------|-------------|---------|
| `retention` | User return patterns | D1, D7, D30 retention |
| `monetization` | Revenue optimization | ARPU, conversion, LTV |
| `engagement` | Activity and sessions | Session length, DAU |
| `progression` | Game advancement | Level completion, stuck users |
| `quality` | Technical health | Error rates, performance |
| `acquisition` | User growth | Install rates, UA efficiency |

---

## Impact/Effort Assessment

Each recommendation includes impact estimates:

```typescript
interface ImpactEstimate {
  metric: string;
  currentValue: number;
  projectedValue: number;
  changePercent: number;
  revenueImpact?: {
    monthly: number;
    yearly: number;
  };
  confidenceRange: [number, number];
}
```

### Example Impact

```typescript
{
  metric: 'd1_retention',
  currentValue: 0.35,           // 35% current D1
  projectedValue: 0.455,        // 45.5% projected
  changePercent: 30,            // +30% improvement
  revenueImpact: {
    monthly: 15000,             // $15K additional monthly
    yearly: 180000              // $180K additional yearly
  },
  confidenceRange: [0.7, 0.9]   // 70-90% confidence
}
```

### Effort Levels

Each action includes effort estimation:

| Effort | Timeframe | Resources |
|--------|-----------|-----------|
| **Low** | 1-3 days | Single developer |
| **Medium** | 1-2 weeks | Small team |
| **High** | 2-4 weeks | Full team |

---

## Game-Type Specific Recommendations

### Puzzle Games

```typescript
// Typical puzzle game recommendations:
{
  title: 'Fix Progression Blocker at Level 25',
  description: 'Level 25 is causing 40% player drop-off',
  actions: [
    { type: 'investigate', description: 'Playtest level 25', effort: 'low' },
    { type: 'implement', description: 'Reduce difficulty', effort: 'medium' },
    { type: 'implement', description: 'Add hint system', effort: 'medium' }
  ]
}
```

### Idle Games

```typescript
// Typical idle game recommendations:
{
  title: 'Optimize Prestige Timing',
  description: 'Players are prestiging too early, reducing engagement',
  actions: [
    { type: 'implement', description: 'Adjust prestige multipliers', effort: 'medium' },
    { type: 'experiment', description: 'Test prestige milestone rewards', effort: 'low' }
  ]
}
```

### Battle Royale

```typescript
// Typical BR recommendations:
{
  title: 'Balance Weapon Meta',
  description: '73% of kills are from SMGs, indicating imbalance',
  actions: [
    { type: 'investigate', description: 'Analyze weapon DPS curves', effort: 'low' },
    { type: 'implement', description: 'Adjust weapon balance', effort: 'medium' }
  ]
}
```

### Gacha RPG

```typescript
// Typical gacha recommendations:
{
  title: 'Banner Performance Declining',
  description: 'Current banner has 30% lower conversion than average',
  actions: [
    { type: 'investigate', description: 'Survey player interest', effort: 'low' },
    { type: 'implement', description: 'Add step-up guarantee', effort: 'medium' }
  ]
}
```

---

## Taking Action on Insights

### Action Types

| Type | Description | Example |
|------|-------------|---------|
| `implement` | Direct change to make | Add tutorial step |
| `investigate` | Analysis needed first | Survey churned users |
| `monitor` | Watch metric closely | Track conversion rate |
| `experiment` | A/B test recommended | Test notification timing |

### Example Workflow

```typescript
// Get user-specific recommendations
const userRec = recommendationEngine.generateUserRecommendations(
  userFeatures,
  churnPrediction,
  ltvPrediction
);

// For a high-churn-risk user:
{
  id: 'user-churn-user_123',
  category: 'retention',
  priority: 'critical',
  title: 'User At High Churn Risk',
  description: 'This user has 78% probability of churning',
  rationale: 'Session frequency down 40%. Last session 4 days ago.',
  actions: [
    { type: 'implement', description: 'Send re-engagement notification', effort: 'low', timeframe: 'Immediate' },
    { type: 'implement', description: 'Offer comeback bonus', effort: 'low', timeframe: 'Immediate' }
  ]
}
```

---

## Common Recommendation Templates

### Low D1 Retention

```typescript
{
  title: 'Improve First-Day Experience',
  description: 'D1 retention is 35%, below 40% benchmark for puzzle games',
  rationale: 'First-day retention is the strongest predictor of success',
  actions: [
    { description: 'Streamline tutorial to under 2 minutes', effort: 'medium' },
    { description: 'Add "quick win" moment in first session', effort: 'medium' },
    { description: 'A/B test push notification timing', effort: 'low' }
  ],
  impact: { changePercent: 30, revenueImpact: { monthly: 10000 } }
}
```

### Low Payer Conversion

```typescript
{
  title: 'Improve Payer Conversion Rate',
  description: 'Only 1.5% convert to paying. Industry average is 2-5%',
  actions: [
    { description: 'Add starter pack offer ($0.99-$2.99)', effort: 'low' },
    { description: 'Test showing IAP at natural "want" moments', effort: 'medium' }
  ]
}
```

### High Churn Risk

```typescript
{
  title: 'Address High Churn Risk',
  description: '18% of users showing churn signals',
  actions: [
    { description: 'Send personalized re-engagement notification', effort: 'low' },
    { description: 'Offer "comeback bonus" for returning players', effort: 'low' }
  ]
}
```

---

## API Reference

### RecommendationEngine Class

```typescript
class RecommendationEngine {
  generateRecommendations(context: RecommendationContext): Recommendation[];

  generateUserRecommendations(
    features: UserFeatures,
    churnPrediction: ChurnPrediction,
    ltvPrediction: LTVPrediction
  ): Recommendation[];

  createContext(
    metrics: Record<string, number>,
    gameType: GameCategory
  ): RecommendationContext;
}
```

### Recommendation Interface

```typescript
interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  actions: RecommendationAction[];
  impact: ImpactEstimate;
  confidence: number;
  relatedMetrics: string[];
  createdAt: string;
}

interface RecommendationAction {
  type: 'implement' | 'investigate' | 'monitor' | 'experiment';
  description: string;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
}
```

---

## Best Practices

### Using Recommendations

1. **Review daily** - Check new insights each morning
2. **Prioritize by impact** - Focus on high-impact, low-effort first
3. **Track actions** - Mark resolved when addressed
4. **Measure results** - Verify recommendations improve metrics

### Maximizing Value

1. **Enable LLM** for more sophisticated insights
2. **Provide context** - More data = better recommendations
3. **Act quickly** - Time-sensitive insights lose value
4. **Iterate** - Use results to improve future recommendations

---

## Next Steps

- [Anomaly Detection](./anomaly-detection) - Detect unusual patterns
- [Churn Prediction](./predictions/churn) - At-risk user identification
- [AI Pipeline](./ai-pipeline) - How insights are generated
