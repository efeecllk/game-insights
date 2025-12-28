---
sidebar_position: 3
title: Idle Game Patterns
description: Analytics for idle, incremental, and clicker mobile games
---

# Idle Game Patterns

Does your game feature prestige/rebirth mechanics, offline rewards, or passive progression? This guide shows what analytics Game Insights generates when it recognizes these patterns.

**Also works for:** Clicker games, incremental games, merge games with offline progress, tycoon games, and any game with passive earning mechanics.

## What Triggers This Pattern

Game Insights recognizes idle patterns when your data contains:
- Prestige or rebirth tracking
- Offline duration and rewards
- Passive resource generation
- Upgrade or multiplier progression

**Examples:** Adventure Capitalist, Cookie Clicker, Idle Heroes, Egg Inc., AFK Arena

## Typical Data Schema

A well-structured idle game dataset should include these columns:

```typescript
interface IdleGameEvent {
  // Core identifiers
  user_id: string;
  session_id: string;
  timestamp: Date;

  // Prestige data
  prestige_level: number;
  total_prestiges: number;
  prestige_currency: number;     // e.g., "souls", "gems"
  time_since_last_prestige: number;

  // Offline progression
  offline_duration_minutes: number;
  offline_rewards_earned: number;
  offline_multiplier: number;

  // Online activity
  session_duration_seconds: number;
  taps_this_session: number;
  upgrades_purchased: number;

  // Economy
  soft_currency: number;         // Main currency
  hard_currency: number;         // Premium currency
  total_earned_lifetime: number;

  // Upgrades
  highest_upgrade_tier: number;
  total_upgrades_owned: number;
  upgrade_categories: Record<string, number>;

  // Monetization
  iap_revenue_usd?: number;
  ad_watched?: boolean;
  ad_multiplier_active?: boolean;

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
| **Day 1 Retention** | % of users returning after 1 day | 50-60% |
| **Day 7 Retention** | % of users returning after 7 days | 25-35% |
| **Day 30 Retention** | % of users returning after 30 days | 10-15% |
| **Sessions per Day** | Average daily sessions per active user | 5-8 |
| **Avg Offline Time** | Hours between sessions | 6-12 hours |

### Engagement KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| **Time to First Prestige** | Days until first prestige | 2-4 days |
| **Prestige Frequency** | Average prestiges per week (active users) | 3-7 |
| **Online/Offline Ratio** | % of progress from active play | 20-40% |
| **Session Frequency** | Sessions per active user per day | 4-6 |

### Monetization KPIs

| Metric | Description | Benchmark |
|--------|-------------|-----------|
| **ARPDAU** | Average revenue per daily active user | $0.08-0.20 |
| **Ad Engagement Rate** | % of sessions with ad views | 40-60% |
| **Payer Conversion** | % of users making any purchase | 3-8% |
| **Time-Skip Revenue** | Revenue from time-skip purchases | 30-50% of IAP |

## Detection Signals

Game Insights identifies idle games through these semantic patterns:

```typescript
// High-weight signals (5 points each)
prestige: [/prestige/i, /rebirth/i, /ascend/i]
offline_reward: [/offline/i, /idle/i, /away/i, /offlineMinutes/i]

// Medium-weight signals (4 points)
upgrade: [/upgrade/i, /enhance/i, /improve/i]

// Supporting signals (3 points)
currency: [/currency/i, /gold/i, /gems/i, /coins/i]

// Low-weight signals (1 point)
level: [/^level$/i, /^lvl$/i, /player.*level/i]
```

## Recommended Visualizations

### 1. Prestige Funnel

Track how players progress through prestige tiers:

```typescript
const prestigeFunnel: FunnelStep[] = [
  { name: 'Never Prestiged', value: 4500, percentage: 45, dropOff: 0 },
  { name: 'Prestige 1x', value: 3000, percentage: 30, dropOff: 15 },
  { name: 'Prestige 2-5x', value: 1800, percentage: 18, dropOff: 12 },
  { name: 'Prestige 5+', value: 700, percentage: 7, dropOff: 11 },
];
```

**Insights to look for:**
- Large "Never Prestiged" segment indicates prestige friction
- Healthy games show steady progression through tiers
- 5+ prestige users are your core engaged players

### 2. Online vs Offline Time

Visualize engagement patterns:

```typescript
const engagementSegments: SegmentData[] = [
  { name: 'Offline (78%)', value: 78, percentage: 78, color: '#6366f1' },
  { name: 'Online (22%)', value: 22, percentage: 22, color: '#8b5cf6' },
];
```

**Target ratios:**
- Healthy: 70-80% offline, 20-30% online
- Warning: >90% offline (players not engaging)
- Warning: &lt;60% offline (idle mechanics underperforming)

### 3. Revenue by Time of Day

Idle games have unique engagement patterns:

```typescript
const revenueData: TimeSeriesData[] = [{
  name: 'IAP Revenue',
  data: [
    { timestamp: '6am', value: 800 },    // Morning check-in
    { timestamp: '9am', value: 2200 },   // Commute
    { timestamp: '12pm', value: 1500 },  // Lunch
    { timestamp: '3pm', value: 1800 },   // Afternoon break
    { timestamp: '6pm', value: 3500 },   // Evening peak
    { timestamp: '9pm', value: 2800 },   // Night session
    { timestamp: '12am', value: 1200 },  // Late night
  ],
  color: '#22c55e',
}];
```

### 4. Upgrade Path Distribution

Track which upgrade paths players prioritize:

```
Upgrade Tree         Users    Avg Investment
Production           ████████ 89%   $1.2M
Automation           ██████   72%   $0.8M
Prestige Bonuses     ████     45%   $2.1M
Time Multipliers     ███      38%   $0.4M
Offline Earnings     ██       22%   $0.3M
```

## Funnel Templates

### First Prestige Funnel

```typescript
const firstPrestigeFunnel = {
  name: 'Journey to First Prestige',
  steps: [
    { event: 'install', name: 'Installed' },
    { event: 'tutorial_complete', name: 'Tutorial Done' },
    { event: 'first_upgrade', name: 'First Upgrade' },
    { event: 'prestige_available', name: 'Prestige Unlocked' },
    { event: 'prestige_tooltip_shown', name: 'Saw Prestige Tooltip' },
    { event: 'first_prestige', name: 'First Prestige' },
  ],
};
```

**Target conversion:** 30-40% install to first prestige

### Daily Engagement Funnel

```typescript
const dailyFunnel = {
  name: 'Daily Engagement Loop',
  steps: [
    { event: 'session_start', name: 'Opened Game' },
    { event: 'offline_reward_collected', name: 'Collected Offline Rewards' },
    { event: 'upgrade_purchased', name: 'Made Upgrade' },
    { event: 'ad_watched', name: 'Watched Ad' },
    { event: 'session_5min', name: '5+ Min Session' },
  ],
};
```

### Ad Monetization Funnel

```typescript
const adFunnel = {
  name: 'Ad Engagement Journey',
  steps: [
    { event: 'ad_opportunity_shown', name: 'Saw Ad Button' },
    { event: 'ad_started', name: 'Started Ad' },
    { event: 'ad_completed', name: 'Completed Ad' },
    { event: 'ad_reward_claimed', name: 'Claimed Reward' },
    { event: 'second_ad_same_session', name: 'Watched 2nd Ad' },
  ],
};
```

## Common Insights to Look For

### 1. Prestige Hesitation

**Pattern:** Users unlock prestige but don't use it

**Detection:**
```sql
SELECT user_id,
       prestige_available_date,
       first_prestige_date,
       DATEDIFF(first_prestige_date, prestige_available_date) as days_to_prestige
FROM user_milestones
WHERE prestige_available_date IS NOT NULL
```

**Actions:**
- Add prestige tutorial/tooltip
- Show projected gains from prestiging
- Create "prestige bonus events"

### 2. Offline Reward Decay

**Pattern:** Users stop collecting offline rewards

**Detection:**
```sql
SELECT user_id,
       AVG(offline_duration_hours) as avg_gap,
       COUNT(DISTINCT DATE(session_start)) as active_days
FROM sessions
WHERE days_since_install BETWEEN 7 AND 14
GROUP BY user_id
HAVING avg_gap > 24
```

**Actions:**
- Implement push notifications for full rewards
- Add "offline reward cap warning"
- Create catch-up mechanics

### 3. Upgrade Stagnation

**Pattern:** Players stop purchasing upgrades

**Detection:**
```sql
SELECT user_id,
       MAX(upgrade_timestamp) as last_upgrade,
       DATEDIFF(NOW(), MAX(upgrade_timestamp)) as days_since_upgrade
FROM upgrade_events
GROUP BY user_id
HAVING days_since_upgrade > 3
```

**Actions:**
- Add new upgrade content
- Implement "upgrade suggestions"
- Create limited-time upgrade deals

### 4. Session Frequency Decline

**Pattern:** Players check in less often over time

**Detection:**
- Track average sessions/day by days_since_install cohort
- Compare D1-7 frequency vs D8-14 frequency
- Identify the "drop-off day"

**Actions:**
- Add time-sensitive events
- Implement streak bonuses
- Create social features (guilds, leaderboards)

## Sample Dashboard Layout

```
+--------------------------------------------------+
|  [Daily Active Users]  [D1 Retention]  [ARPDAU]  |
|    120,847 (+8%)         55% (+3%)     $0.12     |
+--------------------------------------------------+
|  [Avg Offline Time]    [Sessions/Day]  [Prestiges]|
|      8.5 hours            6.2             2.1     |
+--------------------------------------------------+
|                                                   |
|  [Prestige Distribution]    [Online vs Offline]  |
|  Never      ████████   45%   +--------------+    |
|  1x         ██████     30%   |   Offline    |    |
|  2-5x       ████       18%   |     78%      |    |
|  5+         ██          7%   +--------------+    |
|                              |Online|  22%  |    |
+--------------------------------------------------+
|                                                   |
|  [Revenue by Hour]           [Top Upgrades]      |
|  $                           Production   89%    |
|  |    ▄▄                     Automation   72%    |
|  |  ▂▄██▄▂                   Prestige     45%    |
|  +--6--12--18--24--          Time Multi   38%    |
|                                                   |
+--------------------------------------------------+
```

## Best Practices

### Prestige System Design

1. **Make prestige rewarding** - Clear benefits visible before committing
2. **Preserve progress feeling** - Permanent upgrades alongside resets
3. **Add prestige-only content** - New mechanics unlocked through prestige

### Offline Progression

1. **Cap offline rewards** - Prevent exploitation while rewarding return
2. **Show offline summary** - Celebrate what was earned
3. **Offer ad multipliers** - Double offline rewards for watching ads

### Session Optimization

1. **Quick session value** - Something meaningful in under 60 seconds
2. **Long session depth** - Active engagement content for dedicated players
3. **Session notifications** - Alert when "full" or "ready"

### Monetization Ethics

1. **Ads as acceleration** - Not required, but valuable
2. **Fair premium currency** - Meaningful purchases, not desperation
3. **No pay-to-win** - Time advantage, not exclusive content

## Idle-Specific Features

### Peak Engagement Detection

Game Insights automatically detects peak engagement windows:

```typescript
const peakDetection = {
  morningPeak: { start: '7:00', end: '9:00', sessions: 12500 },
  eveningPeak: { start: '18:00', end: '21:00', sessions: 28000 },
  recommendation: 'Schedule events during evening peak for 2.2x engagement',
};
```

### Daily Login Bonus ROI

Track the effectiveness of daily login systems:

```typescript
const loginBonusMetrics = {
  day1Claim: 0.89,    // 89% claim Day 1
  day7Claim: 0.42,    // 42% complete week
  day30Claim: 0.15,   // 15% complete month
  avgValuePerClaim: 0.003,  // $0.003 LTV per daily claim
  recommendation: 'Day 7 reward value should increase to reduce D6 drop-off',
};
```

## Related Resources

- [Funnel Builder Guide](/docs/features/funnel-builder) - Create prestige funnels
- [Real-time Analytics](/docs/features/real-time) - Monitor peak hours
- [Retention Predictions](/docs/ai-analytics/predictions/retention) - Predict offline churn
- [Alert Configuration](/docs/features/alerts) - Set up engagement alerts
