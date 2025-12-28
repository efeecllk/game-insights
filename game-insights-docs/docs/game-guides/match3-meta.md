---
sidebar_position: 5
title: Match-3 Meta Games Guide
description: Analytics best practices for match-3 games with story and decoration meta layers
---

# Match-3 Meta Games Guide

Match-3 Meta games combine classic puzzle mechanics with engaging meta layers like home decoration, story progression, or character collection. These hybrid games require tracking both puzzle performance and meta engagement. This guide covers analytics strategies for this popular genre.

## Overview

**Game Type ID:** `match3_meta`

**Examples:** Homescapes, Gardenscapes, Lily's Garden, Matchington Mansion, Project Makeover

**Core Mechanics:**
- Match-3 puzzle gameplay
- Story/narrative progression
- Decoration/customization systems
- Multiple choice story elements
- Power-up economy
- Lives/energy system

## Typical Data Schema

A well-structured Match-3 Meta dataset should include these columns:

```typescript
interface Match3MetaEvent {
  // Core identifiers
  user_id: string;
  session_id: string;
  timestamp: Date;

  // Puzzle layer data
  level_id: number;
  chapter_id: number;
  level_result: 'win' | 'lose' | 'quit';
  stars_earned: number;
  moves_used: number;
  moves_available: number;
  boosters_used: string[];

  // Meta layer data
  story_chapter: number;
  story_choice?: string;          // For branching narratives
  decoration_item_id?: string;
  decoration_category?: string;   // furniture, garden, room
  decoration_style?: string;      // modern, classic, cozy
  meta_currency_spent: number;

  // Progression
  total_stars: number;
  areas_completed: number;
  decorations_placed: number;

  // Economy
  soft_currency: number;
  hard_currency: number;
  lives_remaining: number;

  // Monetization
  iap_revenue_usd?: number;
  ad_watched?: boolean;
  offer_shown?: string;
  offer_purchased?: boolean;

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
| **Day 1 Retention** | % of users returning after 1 day | 45-55% |
| **Day 7 Retention** | % of users returning after 7 days | 18-28% |
| **Day 30 Retention** | % of users returning after 30 days | 8-12% |
| **Session Length** | Average time per session | 10-20 minutes |
| **Sessions per Day** | Daily sessions per active user | 3-5 |

### Meta Layer KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| **Meta Engagement** | % of sessions with meta activity | 60-75% |
| **Chapter Completion** | % completing each story chapter | Gradual decline |
| **Decoration Rate** | Decorations placed per session | 2-4 |
| **Story Choice Distribution** | Balance across story options | 30-70 split |

### Monetization KPIs

| Metric | Description | Benchmark |
|--------|-------------|-----------|
| **ARPDAU** | Revenue per daily active user | $0.08-0.18 |
| **IAP Conversion** | % making any purchase | 3-6% |
| **Avg Purchase Value** | Average transaction size | $5-12 |
| **LTV (D90)** | 90-day lifetime value | $1.50-4.00 |

## Detection Signals

Game Insights identifies Match-3 Meta games through these semantic patterns:

```typescript
// High-weight signals (5 points each)
moves: [/moves/i, /attempts/i, /moves.*left/i]
booster: [/booster/i, /powerup/i, /helper/i]

// Medium-weight signals (3 points)
level: [/^level$/i, /^lvl$/i]
score: [/score/i, /points/i]

// Supporting signals (2 points)
item_id: [/item.*id/i, /decoration/i]
category: [/category/i, /style/i, /room/i]

// Low-weight signals (1 point)
revenue: [/revenue/i, /price/i]
```

## Recommended Visualizations

### 1. Chapter Progression Funnel

Track story progression through chapters:

```typescript
const chapterFunnel: FunnelStep[] = [
  { name: 'Chapter 1', value: 10000, percentage: 100, dropOff: 0 },
  { name: 'Chapter 3', value: 6500, percentage: 65, dropOff: 35 },
  { name: 'Chapter 5', value: 3500, percentage: 35, dropOff: 30 },
  { name: 'Chapter 7', value: 1200, percentage: 12, dropOff: 23 },
];
```

**Key observations:**
- Early chapter drops indicate onboarding issues
- Mid-game drops suggest content gaps
- Late-game retention shows engaged core audience

### 2. Decoration Style Preferences

Track aesthetic preferences:

```typescript
const stylePreferences: SegmentData[] = [
  { name: 'Modern Style', value: 45, percentage: 45, color: '#8b5cf6' },
  { name: 'Classic Style', value: 30, percentage: 30, color: '#6366f1' },
  { name: 'Cozy Style', value: 25, percentage: 25, color: '#ec4899' },
];
```

**Use this data for:**
- Content prioritization
- Targeted offers
- Marketing creative selection

### 3. Revenue by Day of Week

Track weekly purchase patterns:

```typescript
const revenueData: TimeSeriesData[] = [{
  name: 'IAP (Stars)',
  data: [
    { timestamp: 'Mon', value: 8500 },
    { timestamp: 'Tue', value: 7200 },
    { timestamp: 'Wed', value: 9100 },
    { timestamp: 'Thu', value: 8800 },
    { timestamp: 'Fri', value: 11200 },
    { timestamp: 'Sat', value: 14500 },   // Weekend peak
    { timestamp: 'Sun', value: 12800 },
  ],
  color: '#ec4899',
}];
```

### 4. Puzzle vs Meta Time Split

Visualize engagement balance:

```
Activity Type         Time %    Sessions %
Puzzle (Levels)       65%       75%
Meta (Decoration)     25%       45%
Story (Cutscenes)     7%        30%
Store (Browsing)      3%        15%
```

**Healthy split:** 60-70% puzzle, 20-30% meta

## Funnel Templates

### Story Progression Funnel

```typescript
const storyFunnel = {
  name: 'Story Chapter Progression',
  steps: [
    { event: 'chapter_1_start', name: 'Chapter 1 Start' },
    { event: 'chapter_1_complete', name: 'Chapter 1 Done' },
    { event: 'chapter_2_complete', name: 'Chapter 2 Done' },
    { event: 'chapter_3_complete', name: 'Chapter 3 Done' },
    { event: 'chapter_5_complete', name: 'Chapter 5 Done' },
    { event: 'chapter_10_complete', name: 'Chapter 10 Done' },
  ],
};
```

### Decoration Engagement Funnel

```typescript
const decorationFunnel = {
  name: 'Decoration Engagement',
  steps: [
    { event: 'meta_unlocked', name: 'Meta Unlocked' },
    { event: 'first_decoration', name: 'First Decoration' },
    { event: 'room_completed', name: 'First Room Done' },
    { event: 'style_choice', name: 'Made Style Choice' },
    { event: 'second_area', name: 'Started 2nd Area' },
    { event: 'meta_purchase', name: 'Purchased Meta Item' },
  ],
};
```

### IAP Conversion Funnel

```typescript
const iapFunnel = {
  name: 'First Purchase Journey',
  steps: [
    { event: 'hard_level_fail_3x', name: 'Stuck on Level' },
    { event: 'offer_displayed', name: 'Saw Offer' },
    { event: 'offer_clicked', name: 'Clicked Offer' },
    { event: 'store_viewed', name: 'Viewed Store' },
    { event: 'checkout_started', name: 'Started Checkout' },
    { event: 'purchase_complete', name: 'First Purchase' },
  ],
};
```

## Level Difficulty Analysis

Match-3 meta games require careful difficulty tuning:

### Pass Rate by Level Tier

```typescript
const difficultyTiers = {
  tutorial: {        // Levels 1-10
    targetPassRate: 0.92,
    actualPassRate: 0.89,
    avgAttempts: 1.1,
    status: 'good',
  },
  learning: {        // Levels 11-50
    targetPassRate: 0.78,
    actualPassRate: 0.72,
    avgAttempts: 1.4,
    status: 'slightly_hard',
  },
  core: {            // Levels 51-200
    targetPassRate: 0.65,
    actualPassRate: 0.58,
    avgAttempts: 1.8,
    status: 'too_hard',
  },
  endgame: {         // Levels 200+
    targetPassRate: 0.55,
    actualPassRate: 0.52,
    avgAttempts: 2.2,
    status: 'good',
  },
};
```

### Hard Level Detection

Identify problematic levels:

```sql
SELECT
  level_id,
  COUNT(DISTINCT user_id) as players,
  AVG(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as pass_rate,
  AVG(attempts) as avg_attempts,
  COUNT(CASE WHEN quit_before_finish THEN 1 END) as rage_quits
FROM level_attempts
GROUP BY level_id
HAVING pass_rate < 0.5 AND players > 100
ORDER BY pass_rate ASC
LIMIT 20
```

## Power-Up Usage Patterns

Track how players use boosters:

### Usage by Level Difficulty

```
Level Pass Rate    Booster Usage    Premium Booster %
90%+               8%               2%
80-90%             15%              5%
70-80%             28%              12%
60-70%             45%              22%
&lt;60%               68%              38%
```

### Booster Effectiveness

```typescript
const boosterStats = {
  colorBomb: {
    usageRate: 0.35,
    winRateLift: 0.18,    // +18% win rate when used
    avgPerWin: 0.8,
    purchaseRate: 0.12,
  },
  hammer: {
    usageRate: 0.28,
    winRateLift: 0.12,
    avgPerWin: 1.2,
    purchaseRate: 0.08,
  },
  extraMoves: {
    usageRate: 0.45,
    winRateLift: 0.25,
    avgPerWin: 0.5,
    purchaseRate: 0.22,
  },
};
```

## Common Insights to Look For

### 1. Meta Disengagement

**Pattern:** Players skipping decoration/story content

**Detection:**
```sql
SELECT
  user_id,
  COUNT(CASE WHEN event_type = 'level_complete' THEN 1 END) as levels,
  COUNT(CASE WHEN event_type = 'decoration_placed' THEN 1 END) as decorations,
  COUNT(decorations) / NULLIF(COUNT(levels), 0) as meta_ratio
FROM events
WHERE days_since_install BETWEEN 3 AND 7
GROUP BY user_id
HAVING meta_ratio < 0.1
```

**Actions:**
- Improve meta tutorial
- Add meta-only rewards
- Gate levels behind meta progress

### 2. Story Choice Imbalance

**Pattern:** One story choice heavily preferred

**Detection:**
```sql
SELECT
  story_branch,
  choice_a_count,
  choice_b_count,
  choice_a_count / (choice_a_count + choice_b_count) as a_preference
FROM story_choices
WHERE a_preference > 0.8 OR a_preference < 0.2
```

**Actions:**
- Review choice presentation
- Balance rewards between options
- Consider A/B testing choice framing

### 3. Lives Exhaustion Churn

**Pattern:** Players leaving when out of lives

**Detection:**
```sql
SELECT
  user_id,
  last_session_lives,
  hours_until_return
FROM session_ends
WHERE last_session_lives = 0
  AND hours_until_return > 24
```

**Actions:**
- Test infinite lives events
- Improve ad-for-lives placement
- Add social lives gifting

### 4. Area Completion Stall

**Pattern:** Players stop at specific decoration areas

**Detection:**
- Track completion rates by area
- Identify areas with &lt;50% completion
- Compare with story chapter drops

**Actions:**
- Review star costs for area completion
- Add more interesting decoration options
- Create limited-time area events

## Sample Dashboard Layout

```
+--------------------------------------------------+
|  [Daily Active Users]  [D1 Retention]  [ARPDAU]  |
|    198,421 (+6%)         48% (+4%)     $0.12     |
+--------------------------------------------------+
|  [Meta Engagement]   [IAP Conv Rate]   [LTV D30] |
|      72%                 4.2%           $2.85    |
+--------------------------------------------------+
|                                                   |
|  [Chapter Progression]      [Style Preferences]  |
|  Ch 1   ██████████   100%   Modern    45%        |
|  Ch 3   ██████       65%    Classic   30%        |
|  Ch 5   ████         35%    Cozy      25%        |
|  Ch 7   ██           12%                         |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  [Weekly Revenue]           [Engagement Split]   |
|  $                          Puzzle    65%        |
|  |        ▄▄▄               Meta      25%        |
|  |   ▂▃▃▃▄██               Story      7%        |
|  +--M--T--W--T--F--S--S--   Store      3%        |
|                                                   |
+--------------------------------------------------+
```

## Best Practices

### Meta Layer Design

1. **Clear progression** - Players should always know what's next
2. **Meaningful choices** - Decoration should feel impactful
3. **Regular reveals** - New areas/stories maintain interest

### Difficulty Balancing

1. **Gradual curve** - No sudden difficulty spikes
2. **Fail forward** - Give partial progress on losses
3. **Win streaks** - Occasional easy levels for satisfaction

### Story Integration

1. **Pacing** - Don't gate story too aggressively
2. **Character attachment** - Build emotional connections
3. **Cliffhangers** - End sessions with story hooks

### Monetization Approach

1. **Value-first offers** - Bundles feel like deals
2. **Event-driven sales** - Tie offers to story moments
3. **Patience respecting** - Non-payers can still progress

## Related Resources

- [Funnel Builder Guide](/docs/features/funnel-builder) - Create chapter funnels
- [Monetization Analytics](/docs/features/monetization) - Deep dive into IAP
- [A/B Testing](/docs/features/ab-testing) - Test difficulty variants
- [LTV Predictions](/docs/ai-analytics/predictions/ltv) - Predict player value
