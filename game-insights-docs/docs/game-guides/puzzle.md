---
sidebar_position: 2
title: Puzzle Game Patterns
description: Analytics for puzzle, match-3, and level-based mobile games
---

# Puzzle Game Patterns

Does your game have level-based progression, limited moves, and power-ups? This guide shows what analytics Game Insights generates when it recognizes these patterns in your data.

**Also works for:** Match-3 games, word puzzles, brain teasers, physics puzzlers, and any game with level-based progression.

## What Triggers This Pattern

Game Insights recognizes puzzle patterns when your data contains:
- Level/stage progression columns
- Move or time tracking
- Booster/power-up usage
- Lives or energy systems
- Score or star ratings

**Examples:** Candy Crush, Toon Blast, Gardenscapes, Lily's Garden, Wordscapes

## Typical Data Schema

A well-structured puzzle game dataset should include these columns:

```typescript
interface PuzzleGameEvent {
  // Core identifiers
  user_id: string;
  session_id: string;
  timestamp: Date;

  // Level data
  level_id: number;
  level_result: 'win' | 'lose' | 'quit';
  stars_earned: number;          // 0-3 typically
  moves_used: number;
  moves_available: number;
  time_spent_seconds: number;

  // Booster usage
  boosters_used: string[];       // e.g., ['color_bomb', 'extra_moves']
  boosters_available: Record<string, number>;

  // Lives economy
  lives_at_start: number;
  lives_at_end: number;
  lives_source?: 'regenerated' | 'purchased' | 'gift';

  // Monetization
  coins_spent: number;
  coins_earned: number;
  iap_revenue_usd?: number;
  ad_watched?: boolean;

  // User context
  platform: string;
  country: string;
  days_since_install: number;
}
```

## Key Metrics

### Primary KPIs

| Metric | Description | Target Range |
|--------|-------------|--------------|
| **Day 1 Retention** | % of users returning after 1 day | 40-50% |
| **Day 7 Retention** | % of users returning after 7 days | 15-25% |
| **Level N Pass Rate** | % of attempts that succeed at level N | 60-80% |
| **Sessions per Day** | Average daily sessions per active user | 3-5 |
| **Session Length** | Average time per session | 8-15 minutes |

### Monetization KPIs

| Metric | Description | Benchmark |
|--------|-------------|-----------|
| **ARPDAU** | Average revenue per daily active user | $0.05-0.15 |
| **Payer Conversion** | % of users making any purchase | 2-5% |
| **Avg Purchase Value** | Average IAP transaction size | $3-8 |
| **Ad Revenue Share** | % of revenue from ads vs IAP | 40-60% |

### Engagement KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| **Levels per Session** | Average levels attempted per session | 5-10 |
| **Booster Usage Rate** | % of levels where boosters are used | 15-30% |
| **Lives Exhaustion** | % of sessions ending due to no lives | 20-30% |

## Recommended Visualizations

### 1. Level Progression Funnel

Track where players drop off in your level sequence:

```typescript
const levelFunnel: FunnelStep[] = [
  { name: 'Level 1', value: 10000, percentage: 100, dropOff: 0 },
  { name: 'Level 5', value: 7500, percentage: 75, dropOff: 25 },
  { name: 'Level 10', value: 5200, percentage: 52, dropOff: 23 },
  { name: 'Level 15', value: 2800, percentage: 28, dropOff: 24 },
  { name: 'Level 20', value: 1500, percentage: 15, dropOff: 13 },
  { name: 'Level 30', value: 800, percentage: 8, dropOff: 7 },
];
```

**Insights to look for:**
- Sharp drops indicate difficulty spikes
- Gradual decline is normal and healthy
- Investigate levels with >30% single-level drop-off

### 2. Difficulty Heatmap

Visualize pass rates across all levels:

```typescript
// Recommended chart: Heatmap or bar chart
const difficultyData = levels.map(level => ({
  levelId: level.id,
  passRate: level.wins / level.attempts,
  avgAttempts: level.totalAttempts / level.uniquePlayers,
  avgMoves: level.movesUsed / level.wins,
}));
```

**Target pass rates by level tier:**
- Levels 1-10: 85-95% (tutorial)
- Levels 11-50: 70-80% (learning)
- Levels 51-100: 60-70% (core)
- Levels 100+: 50-65% (endgame)

### 3. Booster Effectiveness

Track which boosters drive the most value:

```typescript
const boosterSegments: SegmentData[] = [
  { name: 'Color Bomb', value: 45, percentage: 45, color: '#8b5cf6' },
  { name: 'Extra Moves', value: 32, percentage: 32, color: '#6366f1' },
  { name: 'Rainbow', value: 23, percentage: 23, color: '#ec4899' },
];
```

**Metrics per booster:**
- Usage frequency
- Win rate lift (compared to no-booster attempts)
- Revenue generated (if purchasable)
- Free vs purchased ratio

### 4. Lives Economy Flow

Visualize the lives cycle:

```
Lives Gained          Lives Lost
    |                     |
    v                     v
[Regeneration] ---> [Player Pool] ---> [Level Failures]
[Purchases]    --->               ---> [Life Loss Events]
[Social Gifts] --->
[Ad Rewards]   --->
```

## Funnel Templates

### Tutorial Completion Funnel

```typescript
const tutorialFunnel = {
  name: 'Tutorial Completion',
  steps: [
    { event: 'tutorial_start', name: 'Started Tutorial' },
    { event: 'level_1_complete', name: 'Level 1 Complete' },
    { event: 'level_2_complete', name: 'Level 2 Complete' },
    { event: 'level_3_complete', name: 'Level 3 Complete' },
    { event: 'booster_tutorial_shown', name: 'Saw Booster Tutorial' },
    { event: 'first_booster_used', name: 'Used First Booster' },
    { event: 'level_5_complete', name: 'Tutorial Complete' },
  ],
};
```

**Target conversion:** 60-70% from start to Level 5

### First Purchase Funnel

```typescript
const firstPurchaseFunnel = {
  name: 'First Purchase Journey',
  steps: [
    { event: 'install', name: 'Installed' },
    { event: 'level_fail_3x', name: '3+ Fails on Level' },
    { event: 'offer_shown', name: 'Saw Starter Pack' },
    { event: 'store_opened', name: 'Opened Store' },
    { event: 'purchase_initiated', name: 'Started Checkout' },
    { event: 'purchase_complete', name: 'First Purchase' },
  ],
};
```

**Target conversion:** 2-5% install to purchase

### Session Flow Funnel

```typescript
const sessionFunnel = {
  name: 'Session Engagement',
  steps: [
    { event: 'session_start', name: 'Session Started' },
    { event: 'level_1_started', name: 'Played 1+ Level' },
    { event: 'level_3_started', name: 'Played 3+ Levels' },
    { event: 'level_5_started', name: 'Played 5+ Levels' },
    { event: 'lives_exhausted', name: 'Used All Lives' },
  ],
};
```

## Common Insights to Look For

### 1. Difficulty Walls

**Pattern:** Sharp retention drop at specific levels

**Detection:**
```sql
SELECT level_id,
       COUNT(DISTINCT CASE WHEN result = 'win' THEN user_id END) /
       COUNT(DISTINCT user_id) as pass_rate
FROM level_attempts
GROUP BY level_id
HAVING pass_rate < 0.5
ORDER BY level_id
```

**Actions:**
- Review level design for spikes
- Consider adding optional tutorials
- Test booster giveaways at hard levels

### 2. Booster Hoarding

**Pattern:** Users accumulate boosters but rarely use them

**Detection:**
```sql
SELECT user_id,
       SUM(boosters_earned) as total_earned,
       SUM(boosters_used) as total_used,
       SUM(boosters_used) / NULLIF(SUM(boosters_earned), 0) as usage_rate
FROM user_economy
GROUP BY user_id
HAVING usage_rate < 0.3
```

**Actions:**
- Add "use it or lose it" mechanics
- Show booster tutorials more frequently
- Create levels designed for specific boosters

### 3. Lives Friction

**Pattern:** High session abandonment when lives run out

**Detection:**
```sql
SELECT
  COUNT(CASE WHEN lives_at_end = 0 AND next_session_gap > 3600 THEN 1 END) as abandoned,
  COUNT(*) as total_exhaustions
FROM session_ends
WHERE lives_at_end = 0
```

**Actions:**
- Review lives regeneration timing
- Test ad-for-lives offers
- Consider unlimited lives events

### 4. Late-Game Churn

**Pattern:** Engaged players leaving after level 100+

**Detection:**
- D30 retention segmented by max level reached
- Time between sessions by level tier
- Purchase frequency drop-off by level

**Actions:**
- Add new content regularly
- Implement prestige/star systems
- Create competitive features (leaderboards, guilds)

## Sample Dashboard Layout

```
+--------------------------------------------------+
|  [Daily Active Users]  [D1 Retention]  [ARPDAU]  |
|      50,421 (+12%)        42% (+5%)    $0.08     |
+--------------------------------------------------+
|                                                   |
|  [Level Progression Funnel]    [Booster Usage]   |
|  Level 1  ████████████ 100%   Color Bomb  45%    |
|  Level 5  █████████    75%    Extra Moves 32%    |
|  Level 10 ██████       52%    Rainbow     23%    |
|  Level 15 ████         28%                       |
|  Level 20 ██           15%                       |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  [Revenue by Source]          [Session Pattern]  |
|  +---------+--------+         Hour  Sessions     |
|  |  IAP    |  Ads   |         6am   ▁▂           |
|  |  $2.4K  | $1.8K  |         9am   ▃▄           |
|  +---------+--------+         12pm  ▅▆           |
|                               6pm   ▇█           |
|                               9pm   ▆▅           |
+--------------------------------------------------+
```

## Best Practices

### Level Design Analytics

1. **Track every attempt** - Not just completions
2. **Measure move efficiency** - Wins with moves remaining indicate easy levels
3. **A/B test difficulty** - Use cohorts to find optimal difficulty curves

### Economy Balancing

1. **Monitor currency inflation** - Ensure sinks match sources
2. **Track time to frustration** - When do players first feel stuck?
3. **Segment by spend** - Non-spenders and whales have different needs

### Retention Optimization

1. **Day 1 is critical** - Focus on smooth onboarding
2. **Identify "aha moments"** - What actions correlate with retention?
3. **Use push notifications wisely** - Lives full, daily rewards, friend progress

### Monetization Balance

1. **Don't paywall progress** - Frustration purchases have low LTV
2. **Offer value, not desperation** - Good offers feel like deals
3. **Mix IAP and ads** - Different users prefer different models

## Related Resources

- [Funnel Builder Guide](/docs/features/funnel-builder) - Create custom level funnels
- [A/B Testing](/docs/features/ab-testing) - Test difficulty variants
- [Retention Predictions](/docs/ai-analytics/predictions/retention) - Predict level-based churn
- [Monetization Analytics](/docs/features/monetization) - Deep dive into puzzle IAP
