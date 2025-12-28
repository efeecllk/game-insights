---
sidebar_position: 1
title: Funnel Analysis
description: Analyze user conversion funnels with pre-built templates and detailed drop-off analysis
---

# Funnel Analysis

Funnel analysis helps you understand how users progress through key journeys in your game. Game Insights provides pre-built funnel templates tailored to each game type, plus detailed drop-off analysis to identify where users are leaving.

## Overview

The Funnels page (`/funnels`) provides:

- **Pre-built Templates** - Game-type specific funnel configurations
- **Interactive Visualization** - ECharts-powered funnel charts
- **Drop-off Analysis** - Identify exactly where users are leaving
- **Conversion Metrics** - Track overall and step-by-step conversion rates

## Pre-built Funnel Templates

Game Insights provides optimized funnel templates for each supported game type:

### Puzzle Games

```
Tutorial Start → Tutorial Complete → Level 5 → Level 10 → First Purchase
```

Tracks the critical path from first open to first monetization event.

### Idle/Clicker Games

```
First Open → First Upgrade → First Prestige → Second Prestige → VIP Purchase
```

Focuses on the prestige loop and premium conversion.

### Battle Royale

```
First Match → First Kill → First Win → Ranked Mode → Battle Pass
```

Tracks competitive engagement and battle pass adoption.

### Match-3 Meta Games

```
Tutorial → First Decoration → Chapter 5 → Chapter 10 → Premium Decor
```

Measures story progression and meta-layer engagement.

### Gacha RPG

```
First Login → First Pull → SSR Obtained → First Purchase → Whale ($100+)
```

Tracks the gacha conversion funnel and spender tier progression.

## Viewing Funnel Data

### Funnel Visualization

The main funnel chart displays each step with:

- **Step Name** - The event or action being tracked
- **User Count** - Number of users who reached this step
- **Percentage** - Proportion of users relative to the first step
- **Color Gradient** - Visual distinction between steps

Hover over any step to see detailed tooltip information including user counts and conversion rates.

### Stats Cards

Below the funnel visualization, four key metrics are displayed:

| Metric | Description |
|--------|-------------|
| **Total Users** | Starting users at the top of the funnel |
| **Conversion Rate** | Percentage of users completing the entire funnel |
| **Biggest Drop** | The step transition with the largest user loss |
| **Steps** | Total number of steps in the funnel |

## Drop-off Analysis

The drop-off analysis section shows the transition between each consecutive step:

```tsx
// Example drop-off data
Tutorial Start → Tutorial Complete: -2,200 users (22.0%)
Tutorial Complete → Level 5: -2,600 users (33.3%)
Level 5 → Level 10: -2,400 users (46.2%)
Level 10 → First Purchase: -2,380 users (85.0%)
```

Each transition displays:

- **Step Transition** - From step to step
- **User Loss** - Absolute number of users who dropped off
- **Drop-off Percentage** - Relative loss from the previous step
- **Visual Progress Bar** - Red bar indicating severity

### Identifying Bottlenecks

Look for steps with unusually high drop-off rates:

- **> 50% drop-off** - Critical issue requiring immediate attention
- **30-50% drop-off** - Significant friction point to investigate
- **< 30% drop-off** - Normal attrition for most funnels

## Editing Funnels

Click the **Edit Funnel** button to customize the current funnel:

### Editing Steps

1. Click "Edit Funnel" to open the builder
2. Modify step names by editing the text field
3. Adjust user counts (for demo/projection purposes)
4. Click the trash icon to remove a step (minimum 2 steps required)

### Adding Steps

1. Click "+ Add Step" below the existing steps
2. A new step is automatically added with estimated values
3. Edit the step name and values as needed

### Resetting to Default

Click "Reset to Default" to restore the original game-type template.

## Conversion Rate Calculation

The overall conversion rate is calculated as:

```
Conversion Rate = (Users at Last Step / Users at First Step) * 100
```

For example, if 10,000 users start the funnel and 420 complete it:

```
Conversion Rate = (420 / 10,000) * 100 = 4.2%
```

## Best Practices

### Funnel Design

1. **Keep funnels focused** - 4-6 steps maximum for clarity
2. **Use meaningful milestones** - Choose steps that represent real decisions
3. **Order matters** - Steps must be sequential and logical

### Analysis Tips

1. **Compare across segments** - Look at funnels for different user cohorts
2. **Track over time** - Monitor how conversion rates change with updates
3. **Prioritize biggest drops** - Focus optimization on highest-impact steps

### Common Optimizations

| Drop-off Point | Potential Solutions |
|----------------|---------------------|
| Tutorial | Simplify, add skip option, show progress |
| Early Levels | Reduce difficulty, add hints, improve rewards |
| First Purchase | Better value proposition, introductory offers |
| Social Features | Clearer CTAs, friend incentives |

## Integration with Other Features

Funnel data connects with:

- **[Custom Funnel Builder](/docs/features/funnel-builder)** - Create custom funnels from scratch
- **[A/B Testing](/docs/features/ab-testing)** - Test funnel optimizations
- **[Predictions](/docs/ai-analytics/predictions)** - Forecast funnel performance
- **[Alerts](/docs/features/alerts)** - Get notified when conversion rates drop

## Example: Analyzing a Puzzle Game Funnel

```tsx
// Puzzle game funnel data
const puzzleFunnel = [
  { step: 'Tutorial Start', users: 10000 },
  { step: 'Tutorial Complete', users: 7800 },   // 22% drop
  { step: 'Level 5', users: 5200 },              // 33% drop
  { step: 'Level 10', users: 2800 },             // 46% drop
  { step: 'First Purchase', users: 420 },        // 85% drop
];

// Overall conversion: 4.2%
// Biggest drop: Level 10 → First Purchase (85%)
```

**Analysis:**
- Tutorial completion is healthy at 78%
- Level progression shows expected attrition
- Monetization conversion needs improvement
- Consider: better IAP prompts at Level 10, starter bundle offers

## Related Documentation

- [Custom Funnel Builder](/docs/features/funnel-builder) - Build custom funnels
- [Monetization Analytics](/docs/features/monetization) - Revenue analysis
- [A/B Testing](/docs/features/ab-testing) - Test funnel improvements
