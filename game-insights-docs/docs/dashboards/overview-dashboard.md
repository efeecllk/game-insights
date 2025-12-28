---
sidebar_position: 1
title: Overview Dashboard
description: The main Game Insights dashboard with game-type aware KPIs, retention curves, funnels, and AI insights
---

# Overview Dashboard

The **Overview Dashboard** is the main landing page for Game Insights, providing an at-a-glance summary of your game's performance. It automatically adapts its layout and metrics based on the detected game type, ensuring you see the most relevant KPIs for your specific game category.

## Dashboard Layout

The Overview Dashboard is organized into several sections that work together to give you a complete picture of your game's health:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GAME HEADER                                      │
│   [Game Icon] Game Name  |  Role: Admin  |  Org: Studio  |  Platform         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Overview  |  Integration                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                            KPI CARDS ROW                                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                 │
│  │   DAU     │  │ Playtime  │  │ New Users │  │ Sessions  │                 │
│  │  5.4k    │  │ 12m 42s   │  │   3.33k   │  │  9.88k    │                 │
│  │  ▲ +6%   │  │  ▲ +11%   │  │  ▼ -94%   │  │  ▲ +23%   │                 │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                         ACTIVE USERS CHART                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Active users                                          [Live indicator] ││
│  │                                                                         ││
│  │      ▲                                                                  ││
│  │    ╱   ╲                                                                ││
│  │  ╱       ╲       ▲                                                      ││
│  │╱           ╲   ╱   ╲                                                    ││
│  │              ╲╱       ╲                                                  ││
│  │                         ╲__________                                      ││
│  │                                                                         ││
│  │  13:00   15:00   18:00   21:00   00:00   03:00   06:00   09:00   13:00  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Game Type Selector

The game type selector allows you to switch between different game categories, which automatically adjusts:

- **KPI metrics displayed** - Each game type shows its most relevant metrics
- **Chart configurations** - Visualizations are tailored to the game type
- **Funnel definitions** - Conversion funnels match game-specific flows
- **AI insights** - Recommendations are contextualized for the game type

### Supported Game Types

| Game Type | Icon | Key Metrics | Unique Visualizations |
|-----------|------|-------------|----------------------|
| **Puzzle** | :jigsaw: | Level progression, Booster usage | Difficulty heatmaps, Level funnel |
| **Idle** | :alarm_clock: | Prestige count, Offline time | Prestige funnel, Time distribution |
| **Battle Royale** | :gun: | Rank distribution, K/D ratio | Rank funnel, Weapon meta |
| **Match-3 Meta** | :candy: | Story progress, Decoration count | Chapter funnel, Style preferences |
| **Gacha RPG** | :crossed_swords: | Banner pulls, Spender tiers | Spender funnel, Banner performance |

### Switching Game Types

```tsx
import { useGame } from '@/context/GameContext';

function GameTypeSelector() {
  const { gameType, setGameType, gameCategories } = useGame();

  return (
    <select
      value={gameType}
      onChange={(e) => setGameType(e.target.value)}
    >
      {gameCategories.map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.icon} {cat.name}
        </option>
      ))}
    </select>
  );
}
```

## KPI Cards

KPI cards display your game's most important metrics with trend indicators showing changes compared to the previous period.

### KPI Card Anatomy

```
┌─────────────────────────────┐
│  Daily Active Users    (i)  │  ← Label with tooltip
│                             │
│        5,421                │  ← Primary value
│                             │
│    ▲ +12.5%                 │  ← Trend indicator
│    vs last period           │  ← Comparison context
└─────────────────────────────┘
```

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `dau` | Number | Daily Active Users |
| `mau` | Number | Monthly Active Users |
| `revenue` | Currency | Total revenue |
| `d1_retention` | Percent | Day 1 retention rate |
| `d7_retention` | Percent | Day 7 retention rate |
| `d30_retention` | Percent | Day 30 retention rate |
| `arpu` | Currency | Average Revenue Per User |
| `arppu` | Currency | Average Revenue Per Paying User |
| `conversion_rate` | Percent | Purchase conversion rate |
| `session_length` | Number | Average session duration |
| `sessions_per_user` | Number | Sessions per user per day |

### Trend Indicators

- **Green with up arrow** - Positive change (improvement)
- **Red with down arrow** - Negative change (decline)
- **Gray** - No significant change

### Game-Type Specific KPIs

Different game types display different default KPIs:

**Puzzle Games:**
```
DAU → D1 Retention → Level 15 Pass Rate → Avg Session Length
```

**Idle Games:**
```
DAU → D1 Retention → Avg Offline Time → Sessions/Day
```

**Battle Royale:**
```
DAU → D1 Retention → Avg Match Time → Matches/Session
```

**Match-3 Meta:**
```
DAU → D1 Retention → Meta Engagement → IAP Conv Rate
```

**Gacha RPG:**
```
DAU → D30 Retention → ARPPU → Whale Count
```

## Retention Curves

The retention curve visualization shows how well your game retains players over time, comparing your data against industry benchmarks.

### Chart Features

- **Smooth line interpolation** - Visualizes retention trend
- **Area gradient** - Emphasizes retention decay
- **Benchmark overlay** - Dashed line showing industry average
- **Interactive tooltips** - Hover for exact values
- **Day markers** - D0, D1, D3, D7, D14, D30

### Reading the Chart

```
100% ┤ ●
     │  ╲
 50% ┤    ●─────● Your retention
     │          ╲
 25% ┤            ●───────●
     │                      ╲
  0% ┼────────────────────────●──────────
     D0    D1    D3    D7    D14   D30

  ─── Your Game    ╴╴╴ Industry Benchmark
```

### Retention Data Structure

```typescript
interface RetentionData {
  days: string[];        // ['Day 0', 'Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30']
  values: number[];      // [100, 42, 28, 18, 12, 5]
  benchmark?: number[];  // [100, 42, 28, 18, 12, 7]
}
```

## Funnel Visualizations

Funnels show conversion rates through key game stages, automatically adapting based on game type.

### Funnel Types by Game

| Game Type | Funnel Type | Stages |
|-----------|------------|--------|
| Puzzle | Level Progression | Level 1 → 5 → 10 → 15 → 20 → 30 |
| Idle | Prestige Funnel | Never → 1x → 2-5x → 5+ |
| Battle Royale | Rank Distribution | Bronze → Silver → Gold → Diamond → Legendary |
| Match-3 Meta | Chapter Progress | Chapter 1 → 3 → 5 → 7 |
| Gacha RPG | Spender Tiers | F2P → Minnow → Dolphin → Whale |

### Funnel Anatomy

```
┌─────────────────────────────────────────┐
│ Level 1      ████████████████ 100%     │
│ Level 5      ████████████     75%      │ ← 25% drop-off
│ Level 10     ████████         52%      │ ← 23% drop-off
│ Level 15     █████            28%      │ ← 24% drop-off
│ Level 20     ███              15%      │ ← 13% drop-off
│ Level 30     ██               8%       │ ← 7% drop-off
└─────────────────────────────────────────┘
```

## Revenue Charts

Revenue visualizations show monetization performance with game-specific context.

### Revenue by Game Type

| Game Type | Revenue Focus | Chart Type |
|-----------|--------------|------------|
| Puzzle | Ad Revenue | Daily timeline |
| Idle | IAP Revenue | Time-of-day distribution |
| Battle Royale | Battle Pass | Weekly trends |
| Match-3 Meta | IAP (Stars) | Daily with weekend spikes |
| Gacha RPG | Banner Revenue | Per-banner comparison |

### Revenue Data Structure

```typescript
interface TimeSeriesData {
  name: string;     // 'Ad Revenue', 'IAP Revenue', etc.
  data: DataPoint[];
  color?: string;
}

interface DataPoint {
  timestamp: string;  // 'Mon', 'Week 1', 'Luna Banner', etc.
  value: number;      // 2400
  label?: string;     // '$2.4K'
}
```

## AI Insights Panel

The AI Insights panel provides intelligent recommendations based on your data analysis.

### Insight Types

| Type | Icon | Description |
|------|------|-------------|
| **Critical** | :red_circle: | Urgent issues requiring immediate attention |
| **Warning** | :yellow_circle: | Potential problems to monitor |
| **Opportunity** | :green_circle: | Growth opportunities identified |
| **Info** | :blue_circle: | Informational insights |

### Insight Structure

```typescript
interface Insight {
  id: string;
  type: 'warning' | 'opportunity' | 'info' | 'critical';
  title: string;
  message: string;
  metric?: string;
  value?: number;
  recommendation?: string;
  confidence?: number;
}
```

### Example Insights

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Level 15 Bottleneck Detected                            │
│                                                              │
│ Players are dropping off significantly at Level 15.          │
│ Pass rate is 45%, which is 15% below similar games.         │
│                                                              │
│ Recommendation: Consider reducing difficulty or adding       │
│ a tutorial hint at this level.                              │
│                                                              │
│ Confidence: 87%                                             │
└─────────────────────────────────────────────────────────────┘
```

## Dynamic Layout by Game Type

The dashboard layout adapts based on the selected game type:

### Puzzle Game Layout

```
┌─────────┬─────────┬─────────┬─────────┐
│   DAU   │ D1 Ret  │ L15 Pass│ Session │  KPIs
├─────────┴─────────┴─────────┴─────────┤
│            Level Funnel               │  Main chart
├───────────────────────┬───────────────┤
│   Retention Curve     │ Booster Usage │  Secondary
├───────────────────────┴───────────────┤
│              AI Insights              │  Insights
└───────────────────────────────────────┘
```

### Gacha RPG Layout

```
┌─────────┬─────────┬─────────┬─────────┐
│   DAU   │ D30 Ret │  ARPPU  │ Whales  │  KPIs
├─────────┴─────────┴─────────┴─────────┤
│          Banner Performance           │  Main chart
├───────────────────────┬───────────────┤
│   Spender Funnel      │ Revenue Mix   │  Secondary
├───────────────────────┴───────────────┤
│              AI Insights              │  Insights
└───────────────────────────────────────┘
```

## Using Data Providers

The Overview Dashboard uses the factory pattern to load game-specific data:

```typescript
import { createDataProvider } from '@/lib/dataProviders';
import { useGame } from '@/context/GameContext';

function OverviewDashboard() {
  const { gameType } = useGame();
  const dataProvider = createDataProvider(gameType);

  const retentionData = dataProvider.getRetentionData();
  const funnelData = dataProvider.getFunnelData();
  const kpiData = dataProvider.getKPIData();
  const revenueData = dataProvider.getRevenueData();

  return (
    <div className="dashboard-grid">
      <KPIRow data={kpiData} />
      <RetentionCurve data={retentionData} />
      <FunnelChart data={funnelData} />
      <RevenueChart data={revenueData} />
    </div>
  );
}
```

## Next Steps

- [Dashboard Builder](/docs/dashboards/builder) - Create custom dashboards
- [Widgets Reference](/docs/dashboards/widgets) - All available widget types
- [Charts Reference](/docs/dashboards/charts) - Chart configuration options
- [Exporting](/docs/dashboards/exporting) - Export dashboards and data
