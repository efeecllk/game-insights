---
sidebar_position: 6
title: Run an A/B Test
description: Step-by-step guide to setting up and analyzing A/B tests
---

# Run an A/B Test

This tutorial guides you through setting up, running, and analyzing an A/B test in Game Insights.

## What You'll Learn

- Create an A/B test experiment
- Define control and variant groups
- Track experiment metrics
- Analyze results for statistical significance

## Prerequisites

- Data with user identifiers
- Event tracking for the metric you want to test
- Understanding of your baseline metrics

## Scenario: Testing Onboarding Flow

Let's test whether a new tutorial improves Day 1 retention.

**Hypothesis:** A simplified tutorial will increase D1 retention by 10%.

## Step 1: Design Your Experiment

### Define the Test

| Element | Value |
|---------|-------|
| **Name** | Simplified Tutorial Test |
| **Primary Metric** | D1 Retention |
| **Secondary Metrics** | Tutorial completion, Session length |
| **Traffic Split** | 50/50 |
| **Duration** | 14 days |
| **Minimum Sample** | 5,000 users per variant |

### Calculate Sample Size

For 80% power to detect a 10% lift (e.g., 40% → 44%):

```typescript
// Game Insights calculates this automatically
const sampleSize = calculateSampleSize({
  baselineRate: 0.40,
  minimumDetectableEffect: 0.10,
  power: 0.80,
  significanceLevel: 0.05
});
// Result: ~4,800 per variant
```

## Step 2: Create the Experiment

### Using the UI

1. Navigate to **A/B Testing** in the sidebar
2. Click **Create Experiment**
3. Fill in the experiment details:

```
Name: Simplified Tutorial Test
Description: Testing if a shorter tutorial improves retention

Primary Metric: d1_retention
Secondary Metrics: tutorial_complete, avg_session_length

Variants:
- Control (50%): Original tutorial
- Treatment (50%): Simplified tutorial

Start Date: [Today]
End Date: [+14 days]
```

4. Click **Create**

### Using Code

```typescript
import { abTestingStore } from '@/stores/abTestingStore';

const experiment = await abTestingStore.createExperiment({
  name: 'Simplified Tutorial Test',
  description: 'Testing if a shorter tutorial improves retention',
  status: 'draft',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  primaryMetric: 'd1_retention',
  secondaryMetrics: ['tutorial_complete', 'avg_session_length'],
  variants: [
    { id: 'control', name: 'Control', description: 'Original tutorial', traffic: 50 },
    { id: 'treatment', name: 'Treatment', description: 'Simplified tutorial', traffic: 50 }
  ],
  targetSampleSize: 10000
});
```

## Step 3: Implement Assignment

Assign users to variants in your game code:

```typescript
// Client-side assignment (simple hash-based)
function getVariant(userId: string, experimentId: string): string {
  const hash = hashCode(`${userId}-${experimentId}`);
  const bucket = Math.abs(hash) % 100;

  // 50/50 split
  return bucket < 50 ? 'control' : 'treatment';
}

// Track assignment
function trackExperimentAssignment(userId: string, experimentId: string, variant: string) {
  trackEvent({
    event_type: 'experiment_assignment',
    user_id: userId,
    properties: {
      experiment_id: experimentId,
      variant: variant
    }
  });
}
```

### Server-side Assignment (Recommended)

```typescript
// More reliable for critical experiments
app.get('/api/experiment/variant', async (req, res) => {
  const { userId, experimentId } = req.query;

  // Check if user already assigned
  let assignment = await db.experimentAssignments.findOne({
    userId, experimentId
  });

  if (!assignment) {
    const variant = assignVariant(userId, experimentId);
    assignment = await db.experimentAssignments.create({
      userId,
      experimentId,
      variant,
      assignedAt: new Date()
    });
  }

  res.json({ variant: assignment.variant });
});
```

## Step 4: Track Experiment Events

Log events with experiment context:

```typescript
// When user completes tutorial
function onTutorialComplete(userId: string) {
  const variant = getVariant(userId, 'simplified_tutorial_test');

  trackEvent({
    event_type: 'tutorial_complete',
    user_id: userId,
    timestamp: new Date().toISOString(),
    properties: {
      experiment_id: 'simplified_tutorial_test',
      variant: variant,
      completion_time_seconds: tutorialDuration
    }
  });
}

// Track retention (typically done server-side)
function checkDayOneRetention(userId: string, installDate: Date) {
  const variant = getVariant(userId, 'simplified_tutorial_test');
  const daysSinceInstall = daysBetween(installDate, new Date());

  if (daysSinceInstall === 1) {
    const hadSession = await checkUserSession(userId, new Date());

    trackEvent({
      event_type: 'd1_retention_check',
      user_id: userId,
      properties: {
        experiment_id: 'simplified_tutorial_test',
        variant: variant,
        retained: hadSession
      }
    });
  }
}
```

## Step 5: Monitor the Experiment

### Dashboard View

Game Insights provides a real-time experiment dashboard:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Simplified Tutorial Test                              Status: Running       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Progress: ████████████████░░░░░░░░░░░░░░ 52% (5,200 / 10,000 users)        │
│ Days: 7 / 14                                                                │
│                                                                             │
│ Primary Metric: D1 Retention                                                │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Control:     40.2% (n=2,600)                                          │  │
│ │ Treatment:   43.8% (n=2,600)     +9.0% ↑                              │  │
│ │                                                                       │  │
│ │ Statistical Significance: 78% (not yet significant at 95%)           │  │
│ │ Estimated days to significance: 3-5 days                              │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Secondary Metrics:                                                          │
│ • Tutorial Completion: Control 82%, Treatment 91% (+11%) ✓ Significant     │
│ • Avg Session Length: Control 8.2m, Treatment 7.8m (-5%)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Check for Issues

Look for these warning signs:

| Issue | Indicator | Action |
|-------|-----------|--------|
| Sample Ratio Mismatch | Traffic not 50/50 | Check assignment logic |
| Selection Bias | Pre-treatment metrics differ | Review assignment timing |
| Novelty Effect | Effect decreasing over time | Extend experiment |
| Contamination | Users in both variants | Fix assignment consistency |

## Step 6: Analyze Results

### Wait for Significance

Don't stop early! Let the experiment run to planned duration or sample size.

```typescript
// Game Insights tracks this automatically
interface ExperimentResults {
  primaryMetric: {
    control: { value: 0.402, sampleSize: 2600 },
    treatment: { value: 0.438, sampleSize: 2600 },
    lift: 0.090,  // 9% relative lift
    pValue: 0.023,
    isSignificant: true,  // p < 0.05
    confidenceInterval: [0.02, 0.16]
  };
}
```

### Interpret Results

After the experiment completes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPERIMENT COMPLETE: Simplified Tutorial Test                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ WINNER: Treatment (Simplified Tutorial)                                     │
│                                                                             │
│ D1 Retention:                                                               │
│   Control:     40.2% ± 1.9%                                                │
│   Treatment:   43.8% ± 1.8%                                                │
│   Relative Lift: +9.0% [95% CI: 2.1% to 15.9%]                            │
│   p-value: 0.011 (Significant at α=0.05)                                   │
│                                                                             │
│ RECOMMENDATION: Roll out simplified tutorial to all users                  │
│                                                                             │
│ Expected Impact:                                                            │
│   • D1 retention: +3.6 percentage points                                   │
│   • Additional retained users per 10K installs: ~360                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Step 7: Make a Decision

### If Significant Winner

```typescript
// Archive experiment and record decision
await abTestingStore.completeExperiment(experimentId, {
  winner: 'treatment',
  decision: 'Roll out to 100% of users',
  notes: 'Simplified tutorial shows significant improvement in D1 retention',
  implementationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
});
```

### If No Significant Difference

Consider:
1. **Extend** the experiment for more power
2. **Iterate** on the variant design
3. **Accept** that the change has no meaningful impact
4. **Segment** analysis to find sub-populations that respond

## Best Practices

### Do

- Define metrics before starting
- Calculate required sample size
- Run for the full planned duration
- Document your hypothesis
- Consider secondary metrics
- Check for sample ratio mismatch

### Don't

- Stop early when you see significance (peeking problem)
- Change experiment parameters mid-flight
- Run too many tests on the same users
- Ignore practical significance (is a 0.5% lift worth it?)
- Forget to track variant assignment

## Common Pitfalls

### 1. Peeking Problem

Looking at results daily and stopping when significant leads to false positives.

**Solution:** Use sequential testing or commit to a fixed sample size.

### 2. Multiple Comparisons

Testing 10 metrics increases false positive rate.

**Solution:** Pre-register primary metric; apply Bonferroni correction for secondary.

### 3. Selection Bias

If users can opt-in, results won't generalize.

**Solution:** Random assignment before any user action.

## Next Steps

- [Analyze Monetization](/docs/cookbook/analyze-monetization) for your variants
- [Set Up Alerts](/docs/cookbook/setup-alerts) for experiment anomalies
- Learn about [A/B Testing Features](/docs/features/ab-testing)

## Related

- [A/B Testing Feature Guide](/docs/features/ab-testing)
- [AI Recommendations](/docs/ai-analytics/recommendations)
- [Funnel Analysis](/docs/features/funnels)
