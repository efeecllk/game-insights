---
sidebar_position: 3
title: Core Concepts
description: Understand game types, data flow, KPIs, and the AI pipeline in Game Insights
---

# Core Concepts

This guide explains the fundamental concepts you need to understand to get the most out of Game Insights.

## Game Types

Game Insights automatically detects your game type and tailors the analytics accordingly. Each game type has unique metrics, funnels, and visualizations.

### Supported Game Types

| Game Type | Description | Key Metrics |
|-----------|-------------|-------------|
| **Puzzle** | Match-3, puzzle solving, level-based games | Level progression, booster usage, lives/energy |
| **Idle** | Incremental, idle mining, factory games | Prestige funnels, offline/online time ratio |
| **Battle Royale** | FPS, competitive shooters, survival games | Rank distribution, K/D ratio, weapon meta |
| **Match-3 Meta** | Match-3 with story/decoration meta layer | Story progression, decoration engagement |
| **Gacha RPG** | Hero collectors, turn-based RPGs with gacha | Spender tiers, banner performance, pity tracking |

### Game Type Detection

Game Insights uses the `GameTypeDetector` to automatically classify your data:

```
Data Columns → Pattern Matching → Weighted Scoring → Game Type
```

**Detection signals by game type:**

| Game Type | Strong Signals | Supporting Signals |
|-----------|----------------|-------------------|
| Puzzle | `moves`, `booster` | `level`, `score`, `lives` |
| Idle | `prestige`, `offline_reward` | `upgrade`, `currency` |
| Battle Royale | `kills`, `placement` | `damage`, `survival_time`, `rank` |
| Match-3 Meta | `moves`, `booster`, `item_id` | `level`, `category`, `revenue` |
| Gacha RPG | `pull_type`, `banner`, `rarity` | `currency`, `level`, `xp` |

If no clear pattern is detected, the game type defaults to **Custom**, which provides generic analytics.

## Data Flow

Game Insights processes data through a multi-stage pipeline:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Data      │───►│   Adapter   │───►│   AI        │───►│  Dashboard  │
│   Source    │    │   Layer     │    │   Pipeline  │    │   Display   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Stage 1: Data Source

Data can come from multiple sources:
- **File uploads** - CSV, Excel, JSON
- **Google Sheets** - Live connection
- **PostgreSQL** - Direct database queries
- **Supabase** - Real-time subscriptions
- **REST API** - Custom endpoints
- **Webhooks** - Push-based ingestion

### Stage 2: Adapter Layer

Adapters normalize data from different sources into a common format:

```typescript
interface NormalizedData {
    columns: string[];
    rows: Record<string, unknown>[];
    metadata: {
        source: string;
        fetchedAt: string;
        rowCount: number;
    };
}
```

All adapters implement the `BaseAdapter` interface with methods like:
- `connect()` - Establish connection
- `fetchSchema()` - Get column information
- `fetchData()` - Retrieve normalized data

### Stage 3: AI Pipeline

The AI Pipeline orchestrates multiple analysis modules:

1. **DataSampler** - Intelligently samples large datasets
2. **SchemaAnalyzer** - Detects semantic column types
3. **GameTypeDetector** - Classifies the game type
4. **DataCleaner** - Identifies and fixes data quality issues
5. **MetricCalculator** - Computes KPIs and aggregates
6. **AnomalyDetector** - Finds statistical outliers
7. **CohortAnalyzer** - Groups users for comparison
8. **FunnelDetector** - Identifies conversion funnels
9. **ChartSelector** - Recommends visualizations
10. **InsightGenerator** - Produces actionable recommendations

### Stage 4: Dashboard Display

Processed data is rendered in:
- KPI cards with trend indicators
- Interactive charts (ECharts)
- Funnel visualizations
- Cohort retention matrices
- Anomaly alerts

## Semantic Column Types

The SchemaAnalyzer recognizes 40+ semantic column types to understand your data:

### User Identification
| Type | Example Columns | Description |
|------|----------------|-------------|
| `user_id` | `userId`, `playerId`, `uid` | Unique user identifier |
| `session_id` | `sessionId`, `matchId` | Session/match identifier |
| `timestamp` | `date`, `time`, `createdAt` | Event timestamp |

### Monetization
| Type | Example Columns | Description |
|------|----------------|-------------|
| `revenue` | `revenue`, `iapRevenue` | Revenue amount |
| `currency` | `gold`, `gems`, `coins` | In-game currency |
| `price` | `priceUsd`, `amount` | Purchase price |
| `ad_revenue` | `adRevenue`, `adEarnings` | Ad monetization |
| `iap_revenue` | `iapRevenue`, `purchaseAmount` | In-app purchase revenue |

### Progression
| Type | Example Columns | Description |
|------|----------------|-------------|
| `level` | `level`, `playerLevel` | Player level |
| `score` | `score`, `points` | Score/points |
| `xp` | `xp`, `experience` | Experience points |
| `rank` | `rank`, `tier`, `league` | Competitive rank |

### Engagement
| Type | Example Columns | Description |
|------|----------------|-------------|
| `session_duration` | `sessionLength`, `playTime` | Time spent in session |
| `session_count` | `sessionCount`, `sessions` | Number of sessions |
| `retention_day` | `d1`, `d7`, `d30` | Retention day markers |
| `dau` | `dailyActiveUsers` | Daily active users |

### Game-Specific Types

**Puzzle/Match-3:**
- `moves` - Moves made/remaining
- `booster` - Power-up usage
- `lives` - Lives/energy remaining

**Idle Games:**
- `prestige` - Prestige/rebirth count
- `offline_reward` - Offline earnings
- `upgrade` - Upgrade purchases

**Battle Royale:**
- `kills` - Eliminations
- `placement` - Match placement
- `damage` - Damage dealt
- `survival_time` - Time survived

**Gacha RPG:**
- `rarity` - Character/item rarity
- `banner` - Gacha banner name
- `pull_type` - Single/multi pull
- `pity_count` - Pity counter

## Key Performance Indicators (KPIs)

Game Insights calculates and tracks these core KPIs:

### Retention Metrics
| Metric | Description | Formula |
|--------|-------------|---------|
| **D1 Retention** | Users returning after 1 day | Users Day 1 / Users Day 0 |
| **D7 Retention** | Users returning after 7 days | Users Day 7 / Users Day 0 |
| **D30 Retention** | Users returning after 30 days | Users Day 30 / Users Day 0 |

### Engagement Metrics
| Metric | Description | Formula |
|--------|-------------|---------|
| **DAU** | Daily Active Users | Unique users per day |
| **MAU** | Monthly Active Users | Unique users per month |
| **Stickiness** | Engagement ratio | DAU / MAU |
| **Avg Session** | Average session length | Total time / Sessions |

### Monetization Metrics
| Metric | Description | Formula |
|--------|-------------|---------|
| **ARPU** | Avg Revenue Per User | Revenue / DAU |
| **ARPPU** | Avg Revenue Per Paying User | Revenue / Payers |
| **LTV** | Lifetime Value | ARPU x Lifetime Days |
| **Conversion** | Purchase rate | Payers / Total Users |

## AI Pipeline Stages

### 1. Data Sampling

For large datasets (100K+ rows), the DataSampler creates a representative sample:

- **Smart sampling** - Preserves distribution across key columns
- **Stratified sampling** - Maintains proportions for segments
- **Time-based sampling** - Ensures coverage across date ranges

Default sample size: 1,000 rows (configurable)

### 2. Schema Analysis

The SchemaAnalyzer detects column meanings using:

1. **Pattern matching** - Regex patterns for common names
2. **Value inspection** - Analyzing sample values
3. **Type inference** - Determining data types

Each column receives:
- `semanticType` - What the column represents
- `confidence` - Detection confidence (0-1)

### 3. Data Cleaning

The DataCleaner identifies and resolves:

- **Missing values** - Nulls, empty strings
- **Duplicates** - Repeated records
- **Outliers** - Statistical anomalies
- **Format issues** - Inconsistent date formats, etc.

Cleaning actions are presented for approval before execution.

### 4. Anomaly Detection

The AnomalyDetector uses statistical methods to find:

- **Spikes** - Sudden increases
- **Drops** - Sudden decreases
- **Trend changes** - Shifts in patterns
- **Outliers** - Values outside normal ranges

Anomalies are classified by severity: `critical`, `high`, `medium`, `low`.

### 5. Insight Generation

The InsightGenerator produces actionable recommendations:

- **Template-based insights** - Pattern matching on metrics
- **LLM-powered insights** - Natural language analysis (optional)
- **Game-specific insights** - Tailored to game type

## Data Persistence

Game Insights uses IndexedDB for local data storage:

```
IndexedDB
├── gameData        # Uploaded datasets
├── gameProfiles    # User profiles
├── games           # Game configurations
├── gameSettings    # Per-game settings
├── dashboards      # Custom dashboards
├── funnels         # Saved funnels
└── experiments     # A/B test results
```

Data remains on your machine unless explicitly exported or shared.

## Next Steps

- **[Architecture Overview](/docs/getting-started/architecture)** - Deep dive into system design
- **[Data Management](/docs/data-management/overview)** - Learn about data sources
- **[AI Pipeline](/docs/ai-analytics/ai-pipeline)** - Detailed pipeline documentation
- **[Game Guides](/docs/game-guides/overview)** - Type-specific analytics guides
