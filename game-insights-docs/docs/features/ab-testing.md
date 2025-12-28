---
sidebar_position: 5
title: A/B Testing Framework
description: Create experiments, manage variants, calculate sample sizes, and analyze results with Bayesian statistics
---

# A/B Testing Framework

The A/B Testing page (`/ab-testing`) provides a comprehensive experimentation platform. Create experiments, manage variants, calculate required sample sizes, and determine winners with statistical confidence.

## Overview

The A/B Testing framework includes:

- **Experiment Management** - Create, start, pause, and complete experiments
- **Variant Configuration** - Define control and treatment groups
- **Sample Size Calculator** - Determine required participants
- **Duration Estimator** - Predict experiment runtime
- **Bayesian Analysis** - Probability-based winner declaration
- **Experiment History** - Track all past experiments

## Experiment Dashboard

### Stats Overview

Four key metrics display at the top:

| Metric | Description | Filter Action |
|--------|-------------|---------------|
| **Total Experiments** | All experiments | Show all |
| **Running** | Currently active | Filter to running |
| **Completed** | Finished experiments | Filter to completed |
| **Drafts** | Not yet started | Filter to drafts |

Click any stat card to filter the experiment list.

### Experiment List

Each experiment card shows:

```
┌─────────────────────────────────────────────────────────────┐
│ [Experiment Name]                           [Status Badge]  │
│ Description text here...                                    │
│                                                             │
│ 👥 2 variants  🎯 All Users  🕐 Started Dec 15             │
│                                                             │
│ ████████████████████████░░░░░░░░  75%                      │
│ 7,500 / 10,000 samples    📈 Treatment leading (+5.2%)     │
├─────────────────────────────────────────────────────────────┤
│ [Start] [Delete]  or  [Pause] [Complete]                   │
└─────────────────────────────────────────────────────────────┘
```

## Creating Experiments

### Step 1: Click "New Experiment"

Opens the experiment creation form.

### Step 2: Basic Information

```tsx
// Required fields
{
  name: "Onboarding Flow Test",           // Required
  description: "Testing simplified tutorial",
  hypothesis: "Shorter tutorial will improve D1 retention"
}
```

### Step 3: Target Audience

Select who participates:

| Audience | Description |
|----------|-------------|
| **All Users** | Everyone in the game |
| **New Users** | First-time players only |
| **Returning Users** | Existing players only |
| **Non-Payers** | Free-to-play users |
| **Payers** | Users who have purchased |

### Step 4: Configure Variants

Default setup includes Control and Treatment:

```tsx
const variants = [
  {
    name: 'Control',
    description: 'Original experience',
    trafficPercent: 50,
    isControl: true
  },
  {
    name: 'Treatment',
    description: 'New experience',
    trafficPercent: 50,
    isControl: false
  }
];
```

#### Adding More Variants

Click "+ Add Variant" to add additional treatments:

```tsx
// A/B/C test example
[
  { name: 'Control', trafficPercent: 34 },
  { name: 'Treatment A', trafficPercent: 33 },
  { name: 'Treatment B', trafficPercent: 33 }
]
```

### Step 5: Sample Size Settings

Configure statistical parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| **Baseline Rate** | 5% | Current conversion rate |
| **MDE** | 20% | Minimum detectable effect |

The calculator automatically determines required sample size:

```
Required Sample Size
━━━━━━━━━━━━━━━━━━━
12,500 users
(6,250 per variant)
```

### Step 6: Create Experiment

Click "Create Experiment" to save as draft.

## Managing Experiments

### Experiment Lifecycle

```
Draft → Running → Paused → Running → Completed → Archived
         │                    │
         └────────────────────┘
              (can pause/resume)
```

### Status Actions

| Status | Available Actions |
|--------|-------------------|
| **Draft** | Start, Delete |
| **Running** | Pause, Complete |
| **Paused** | Resume, Complete |
| **Completed** | Archive |
| **Archived** | View only |

### Starting an Experiment

1. Select the experiment
2. Click "Start" or "Start Experiment"
3. Experiment begins collecting data
4. Progress bar shows sample collection

### Pausing an Experiment

- Click "Pause" to temporarily stop
- Data collection pauses
- Can resume at any time
- Useful for investigating issues

### Completing an Experiment

1. Click "Complete"
2. Optionally select the winner
3. Experiment enters completed state
4. Results are finalized

## Sample Size Calculator

Access via the "Sample Calculator" button.

### Input Parameters

#### Baseline Conversion Rate

```
Slider: 0.1% ─────●───────── 50%
Current: 5%

Your current conversion rate for the metric being tested.
```

#### Minimum Detectable Effect (MDE)

```
Slider: 1% ────────●──────── 100%
Current: 20%

Smallest improvement you want to detect (relative).
```

#### Statistical Power

```
Slider: 50% ─────────●───── 99%
Current: 80%

Probability of detecting a real effect. Standard: 80%
```

#### Significance Level

```
Slider: 80% ──────────●──── 99%
Current: 95%

Confidence level for results. Standard: 95%
```

### Duration Estimation

Enter your traffic data:

| Input | Example | Purpose |
|-------|---------|---------|
| **Daily Traffic** | 500 | Users per day |
| **Traffic Allocation** | 100% | % in experiment |

### Calculator Results

```
┌─────────────────────────────────────────┐
│ Required Sample Size                    │
│ ━━━━━━━━━━━━━━━━━━━━                    │
│ 12,500 users                            │
│ (6,250 per variant)                     │
├─────────────────────────────────────────┤
│ Estimated Duration                      │
│ ━━━━━━━━━━━━━━━━━━━━                    │
│ 25 days                                 │
│ At 500 users/day (100% allocation)      │
└─────────────────────────────────────────┘

Additional metrics:
• Expected treatment rate: 6.00%
• Absolute difference: 1.00pp
• False positive rate: 5%
• False negative rate: 20%
```

## Analyzing Results

### Variant Results View

Each variant displays comprehensive metrics:

```
┌─────────────────────────────────────────────────────────────┐
│ Control                                         5,000 users │
├─────────────────────────────────────────────────────────────┤
│ Conversion Rate    Improvement    Confidence    Significant │
│     5.20%             -              95%           Yes      │
├─────────────────────────────────────────────────────────────┤
│ 95% CI: ████████████████████░░░░░░░░ 4.8% ─── 5.6%         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Treatment                                [Leading] 5,000 u. │
├─────────────────────────────────────────────────────────────┤
│ Conversion Rate    Improvement    Confidence    Significant │
│     5.85%           +12.5%          97%           Yes      │
├─────────────────────────────────────────────────────────────┤
│ 95% CI: █████████████████████████░░░ 5.4% ─── 6.3%         │
└─────────────────────────────────────────────────────────────┘
```

### Key Metrics Explained

#### Conversion Rate

Percentage of users who completed the target action:

```
Conversion Rate = Conversions / Sample Size * 100
```

#### Improvement

Relative change compared to control:

```
Improvement = (Treatment Rate - Control Rate) / Control Rate * 100
```

#### Confidence

Statistical confidence in the result:

```
Confidence = (1 - p-value) * 100
```

#### Statistical Significance

Whether the result is statistically significant:

- **Yes** - p-value < 0.05 (95% confidence)
- **No** - Result may be due to chance

### Confidence Interval Visualization

A visual bar shows the 95% confidence interval:

```
Lower bound     Conversion     Upper bound
    │               │               │
    ▼               ▼               ▼
    ████████████████████████████████████
    4.8%           5.6%           6.3%
```

## Bayesian Probability

For running experiments, Bayesian analysis shows probability of winning:

```
┌─────────────────────────────────────────────────────────────┐
│ Bayesian Analysis                                           │
├─────────────────────────────────────────────────────────────┤
│ Control wins                                                │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░  32.5%               │
│                                                             │
│ Treatment wins                                              │
│ ████████████████████████████████████░  67.5%               │
└─────────────────────────────────────────────────────────────┘
```

### Interpreting Bayesian Results

| Probability | Interpretation | Action |
|-------------|----------------|--------|
| < 50% | Losing | Continue experiment |
| 50-75% | Slightly ahead | Need more data |
| 75-90% | Strong lead | Consider early stop |
| > 90% | Very likely winner | Can conclude |
| > 95% | Near certain | Ship it! |

## Winner Declaration

### Automatic Detection

The system identifies winners when:

1. Required sample size reached
2. Statistical significance achieved (p < 0.05)
3. Improvement exceeds MDE

### Manual Declaration

Select the winner manually:

1. Click on the winning variant card
2. Click "Complete" with winner selected
3. Winner is recorded in experiment history

### Winner Badge

Completed experiments display:

```
┌────────────────────────────────────────┐
│ 🏆 Winner: Treatment (+12.5%)         │
└────────────────────────────────────────┘
```

## Experiment History

### Viewing Past Experiments

Filter by status to see completed/archived experiments:

```
Total: 15  Running: 2  Completed: 8  Drafts: 5
```

### Experiment Details

Click any completed experiment to view:

- Full variant results
- Statistical analysis
- Conclusion notes
- Timeline of changes

### Learning from History

Review past experiments to:

1. Avoid repeating failed tests
2. Build on successful changes
3. Identify testing patterns
4. Improve hypothesis quality

## Best Practices

### Experiment Design

1. **Clear hypothesis** - State expected outcome
2. **Single variable** - Test one thing at a time
3. **Sufficient power** - Use recommended sample sizes
4. **Realistic MDE** - Don't expect miracles

### Running Experiments

1. **Don't peek too early** - Wait for significance
2. **Avoid mid-test changes** - Keep conditions constant
3. **Monitor for issues** - Watch for technical problems
4. **Document everything** - Record observations

### Analyzing Results

1. **Check for significance** - p < 0.05 minimum
2. **Consider practical impact** - Is the lift meaningful?
3. **Look at secondary metrics** - Side effects matter
4. **Validate results** - Consider follow-up tests

### Common Mistakes

| Mistake | Why It's Bad | Solution |
|---------|--------------|----------|
| Stopping early | False positives | Wait for sample size |
| Too many variants | Reduces power | Limit to 2-3 variants |
| Ignoring segments | Missing insights | Segment analysis |
| No documentation | Lost knowledge | Record everything |

## Statistical Calculations

### Sample Size Formula

```
n = (Z_α/2 + Z_β)² * (p₁(1-p₁) + p₂(1-p₂)) / (p₁ - p₂)²

Where:
- Z_α/2 = Z-score for significance level (1.96 for 95%)
- Z_β = Z-score for power (0.84 for 80%)
- p₁ = baseline conversion rate
- p₂ = expected treatment rate (baseline * (1 + MDE))
```

### Duration Estimation

```
Duration = Required Sample Size / (Daily Traffic * Traffic Allocation)
```

### Bayesian Probability

Uses Beta distribution to calculate probability of one variant beating another:

```
P(Treatment > Control) = ∫∫ I(B_t > B_c) * f(B_t) * f(B_c) dB_t dB_c

Where:
- B_t ~ Beta(α_t, β_t) for treatment
- B_c ~ Beta(α_c, β_c) for control
- α = conversions + 1
- β = non-conversions + 1
```

## Integration with Other Features

A/B Testing connects with:

- **[Funnels](/docs/features/funnels)** - Test funnel variations
- **[Monetization](/docs/features/monetization)** - Test pricing
- **[Predictions](/docs/ai-analytics/predictions)** - Forecast impact
- **[Alerts](/docs/features/alerts)** - Notify on significance

## Related Documentation

- [Funnel Builder](/docs/features/funnel-builder) - Create test funnels
- [Monetization](/docs/features/monetization) - Revenue experiments
- [Real-time](/docs/features/real-time) - Monitor live tests
