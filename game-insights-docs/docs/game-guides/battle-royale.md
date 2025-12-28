---
sidebar_position: 4
title: Battle Royale Guide
description: Analytics best practices for battle royale, competitive shooters, and survival games
---

# Battle Royale Guide

Battle Royale games feature intense competitive gameplay where skill-based matchmaking, weapon balance, and match performance are critical to player satisfaction. This guide covers analytics strategies for BR games, competitive shooters, and similar PvP experiences.

## Overview

**Game Type ID:** `battle_royale`

**Examples:** PUBG Mobile, Fortnite, Call of Duty Mobile, Free Fire, Apex Legends Mobile

**Core Mechanics:**
- Last-player/team-standing gameplay
- Looting and inventory management
- Skill-based matchmaking (SBMM)
- Ranked/competitive seasons
- Battle passes and cosmetic monetization

## Typical Data Schema

A well-structured battle royale dataset should include these columns:

```typescript
interface BattleRoyaleEvent {
  // Core identifiers
  user_id: string;
  match_id: string;
  session_id: string;
  timestamp: Date;

  // Match data
  match_mode: 'solo' | 'duo' | 'squad' | 'ranked';
  match_duration_seconds: number;
  final_placement: number;        // 1 = winner
  total_players: number;

  // Performance metrics
  kills: number;
  assists: number;
  knockdowns: number;
  damage_dealt: number;
  damage_taken: number;
  headshot_percentage: number;
  accuracy_percentage: number;
  survival_time_seconds: number;

  // Loadout data
  weapons_used: string[];
  favorite_weapon: string;
  items_looted: number;
  healing_used: number;

  // Rank data
  current_rank: string;           // Bronze, Silver, Gold, etc.
  rank_points: number;
  rank_change: number;

  // Squad data (if applicable)
  squad_size: number;
  squad_kills: number;
  revives_given: number;
  revives_received: number;

  // Monetization
  battle_pass_level: number;
  battle_pass_purchased: boolean;
  cosmetics_owned: number;
  iap_revenue_usd?: number;

  // User context
  platform: string;
  country: string;
  days_since_install: number;
  total_matches_played: number;
}
```

## Key Metrics

### Primary KPIs

| Metric | Description | Target Range |
|--------|-------------|--------------|
| **Day 1 Retention** | % of users returning after 1 day | 35-45% |
| **Day 7 Retention** | % of users returning after 7 days | 15-22% |
| **Matches per Session** | Average matches per play session | 3-5 |
| **Session Length** | Average time per session | 25-45 minutes |
| **Daily Active Users** | Unique daily players | High variance |

### Performance KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| **Average Placement** | Mean final position | 25-35 (100 player) |
| **K/D Ratio** | Kills per death | 0.8-1.2 avg |
| **Win Rate** | % of matches won | 1-3% (solo) |
| **Avg Match Time** | Time alive per match | 10-15 minutes |

### Monetization KPIs

| Metric | Description | Benchmark |
|--------|-------------|-----------|
| **Battle Pass Conversion** | % buying premium pass | 8-15% |
| **ARPPU** | Revenue per paying user | $15-40 |
| **Cosmetic Attach Rate** | % owning paid cosmetics | 20-35% |
| **Season Pass Completion** | % completing all tiers | 25-40% |

## Detection Signals

Game Insights identifies battle royale games through these semantic patterns:

```typescript
// High-weight signals (5 points each)
placement: [/placement/i, /position/i, /standing/i]
kills: [/kills/i, /eliminations/i, /frags/i]

// Medium-weight signals (4 points)
damage: [/damage/i, /dmg/i]
survival_time: [/survival/i, /alive/i, /survivalTime/i]

// Supporting signals (3 points)
rank: [/^rank$/i, /tier/i, /league/i]

// Low-weight signals (1 point)
user_id: [/user.*id/i, /player.*id/i]
```

## Recommended Visualizations

### 1. Rank Distribution

Track how players are distributed across skill tiers:

```typescript
const rankDistribution: FunnelStep[] = [
  { name: 'Bronze', value: 2500, percentage: 25, dropOff: 0 },
  { name: 'Silver', value: 3000, percentage: 30, dropOff: -5 },
  { name: 'Gold', value: 2500, percentage: 25, dropOff: 5 },
  { name: 'Diamond', value: 1500, percentage: 15, dropOff: 10 },
  { name: 'Legendary', value: 500, percentage: 5, dropOff: 10 },
];
```

**Healthy distribution:**
- Bell curve centered at mid-tiers
- 5-10% at highest tier
- 15-25% at lowest tier (new players)

### 2. Weapon Meta Analysis

Track weapon popularity and effectiveness:

```typescript
const weaponMeta: SegmentData[] = [
  { name: 'AK-47', value: 32, percentage: 32, color: '#ef4444' },
  { name: 'Shotgun', value: 28, percentage: 28, color: '#f97316' },
  { name: 'SMG', value: 22, percentage: 22, color: '#eab308' },
  { name: 'Sniper', value: 18, percentage: 18, color: '#22c55e' },
];
```

**Metrics per weapon:**
- Pick rate (% of matches used)
- Kill rate (kills per match when equipped)
- Win correlation (win rate when used)
- Average damage output

### 3. Battle Pass Revenue

Track seasonal monetization:

```typescript
const battlePassRevenue: TimeSeriesData[] = [{
  name: 'Battle Pass',
  data: [
    { timestamp: 'Week 1', value: 45000 },   // Season launch spike
    { timestamp: 'Week 2', value: 32000 },
    { timestamp: 'Week 3', value: 28000 },
    { timestamp: 'Week 4', value: 52000 },   // Mid-season event
  ],
  color: '#f97316',
}];
```

### 4. Match Queue Times

Monitor matchmaking health:

```
Rank Tier    Avg Queue    Peak Queue    Off-Peak
Bronze       12s          8s            25s
Silver       15s          10s           35s
Gold         22s          15s           55s
Diamond      45s          25s           2m30s
Legendary    1m30s        45s           5m+
```

## Funnel Templates

### First Match Experience

```typescript
const firstMatchFunnel = {
  name: 'New Player First Match',
  steps: [
    { event: 'install', name: 'Installed' },
    { event: 'tutorial_complete', name: 'Tutorial Done' },
    { event: 'first_queue', name: 'Queued First Match' },
    { event: 'first_match_start', name: 'Match Started' },
    { event: 'first_kill', name: 'Got First Kill' },
    { event: 'first_top_10', name: 'Top 10 Finish' },
    { event: 'second_match', name: 'Played 2nd Match' },
  ],
};
```

**Critical:** 70%+ should reach "Played 2nd Match"

### Ranked Journey

```typescript
const rankedFunnel = {
  name: 'Ranked Mode Progression',
  steps: [
    { event: 'ranked_unlocked', name: 'Unlocked Ranked' },
    { event: 'first_ranked_match', name: 'First Ranked Match' },
    { event: 'reach_silver', name: 'Reached Silver' },
    { event: 'reach_gold', name: 'Reached Gold' },
    { event: 'reach_diamond', name: 'Reached Diamond' },
    { event: 'reach_legendary', name: 'Reached Legendary' },
  ],
};
```

### Battle Pass Progression

```typescript
const battlePassFunnel = {
  name: 'Battle Pass Engagement',
  steps: [
    { event: 'season_active', name: 'Active This Season' },
    { event: 'free_tier_10', name: 'Free Tier 10+' },
    { event: 'pass_purchased', name: 'Bought Premium' },
    { event: 'tier_50', name: 'Reached Tier 50' },
    { event: 'tier_100', name: 'Completed Pass' },
  ],
};
```

## Squad vs Solo Analysis

Battle Royale games have distinct player segments:

### Player Mode Preferences

```typescript
const modePreferences = {
  solo: {
    percentage: 25,
    avgSession: '35min',
    retention: { d1: 0.38, d7: 0.15 },
    arpu: '$0.08',
  },
  duo: {
    percentage: 30,
    avgSession: '45min',
    retention: { d1: 0.42, d7: 0.19 },
    arpu: '$0.10',
  },
  squad: {
    percentage: 45,
    avgSession: '55min',
    retention: { d1: 0.48, d7: 0.24 },
    arpu: '$0.14',
  },
};
```

**Insight:** Squad players have significantly higher retention and monetization.

### Squad Composition Analysis

Track how players form teams:

| Team Type | % of Squads | Win Rate | Retention Impact |
|-----------|-------------|----------|------------------|
| Pre-made 4 | 35% | 12% | +40% D7 retention |
| Pre-made 3 + Random | 20% | 8% | +20% D7 retention |
| Pre-made 2 + Randoms | 25% | 5% | +10% D7 retention |
| All Randoms | 20% | 3% | Baseline |

## Skill-Based Matchmaking Analysis

### SBMM Health Metrics

Monitor matchmaking fairness:

```typescript
const sbmmMetrics = {
  avgSkillDelta: 125,           // Average MMR difference in matches
  stomps: 0.08,                 // % of matches with >10 kill difference
  closeMatches: 0.45,           // % of matches with <3 placement difference
  queueTimeVsFairness: {
    '10s': { avgDelta: 250, satisfaction: 0.72 },
    '30s': { avgDelta: 150, satisfaction: 0.81 },
    '60s': { avgDelta: 100, satisfaction: 0.89 },
  },
};
```

### Win Rate by Skill Tier

```
Skill Tier   Expected Win%   Actual Win%   Delta
Top 10%      3.2%            5.8%          +2.6%
Top 25%      2.5%            3.1%          +0.6%
Middle 50%   2.0%            1.9%          -0.1%
Bottom 25%   1.5%            0.8%          -0.7%
```

**Goal:** Delta should be minimal across all tiers.

## Common Insights to Look For

### 1. New Player Stomping

**Pattern:** New players facing experienced opponents

**Detection:**
```sql
SELECT
  new_player_id,
  AVG(kills) as avg_kills,
  AVG(survival_time) as avg_survival,
  COUNT(*) as matches
FROM match_results
WHERE days_since_install < 3
GROUP BY new_player_id
HAVING avg_kills < 0.2 AND matches > 5
```

**Actions:**
- Create protected newbie lobbies
- Implement stronger SBMM for new players
- Add bot matches for first sessions

### 2. Weapon Imbalance

**Pattern:** One weapon dominates the meta

**Detection:**
```sql
SELECT
  weapon_name,
  COUNT(*) as kills,
  COUNT(DISTINCT match_id) as matches,
  AVG(CASE WHEN placement = 1 THEN 1 ELSE 0 END) as win_correlation
FROM kill_events
GROUP BY weapon_name
ORDER BY win_correlation DESC
```

**Actions:**
- Review weapon stats for nerfs
- Add counters to dominant weapons
- Monitor after balance patches

### 3. Rank Inflation/Deflation

**Pattern:** Ranks not reflecting true skill

**Detection:**
- Compare rank distribution over time
- Track win rates by rank (should be similar)
- Monitor rank volatility (big swings = bad)

**Actions:**
- Adjust rank point gains/losses
- Implement rank decay
- Add placement matches

### 4. Match Completion Issues

**Pattern:** Players leaving matches early

**Detection:**
```sql
SELECT
  leave_reason,
  COUNT(*) as occurrences,
  AVG(survival_time) as avg_time_before_leave
FROM match_exits
WHERE leave_type = 'early'
GROUP BY leave_reason
```

**Actions:**
- Add leaver penalties
- Improve reconnection systems
- Investigate early death frustration

## Sample Dashboard Layout

```
+--------------------------------------------------+
|  [Daily Active Users]  [D1 Retention]  [ARPDAU]  |
|    524,821 (+15%)        38% (+2%)     $0.11     |
+--------------------------------------------------+
|  [Avg Match Time]    [Matches/Session]  [Win %]  |
|      18 minutes          3.2              2.1%    |
+--------------------------------------------------+
|                                                   |
|  [Rank Distribution]        [Weapon Meta]        |
|  Bronze   █████      25%    AK-47     32%        |
|  Silver   ██████     30%    Shotgun   28%        |
|  Gold     █████      25%    SMG       22%        |
|  Diamond  ███        15%    Sniper    18%        |
|  Legend   █           5%                         |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  [Battle Pass Revenue]       [Mode Split]        |
|  Week 1  ████████   $45K     Squad   45%         |
|  Week 2  █████      $32K     Duo     30%         |
|  Week 3  ████       $28K     Solo    25%         |
|  Week 4  ███████    $52K                         |
|                                                   |
+--------------------------------------------------+
```

## Best Practices

### First Match Experience

1. **Protected early matches** - New players vs similar skill or bots
2. **Celebrate first kill** - Strong positive reinforcement
3. **Quick rematch** - Minimize time between death and next game

### Matchmaking Quality

1. **Prioritize fair matches** - Slight queue time > skill imbalance
2. **Transparent rank system** - Players should understand progression
3. **Seasonal resets** - Keep climbing fresh and engaging

### Cosmetic Monetization

1. **Visible cosmetics** - Focus on what others see
2. **Exclusive rewards** - Battle pass exclusives drive purchases
3. **Limited-time offers** - FOMO drives conversions

### Weapon Balance

1. **Data-driven tuning** - Use kill/pick rates for balance
2. **Regular meta shifts** - New weapons/nerfs keep game fresh
3. **Player feedback integration** - Combine data with community sentiment

## Related Resources

- [A/B Testing](/docs/features/ab-testing) - Test SBMM configurations
- [Real-time Analytics](/docs/features/real-time) - Monitor match health
- [Churn Predictions](/docs/ai-analytics/predictions/churn) - Identify frustrated players
- [Anomaly Detection](/docs/ai-analytics/anomaly-detection) - Catch exploits early
