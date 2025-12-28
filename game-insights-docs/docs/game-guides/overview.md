---
sidebar_position: 1
title: Game Types Overview
description: Understanding how Game Insights detects and customizes analytics for different game types
---

# Game Types Overview

Game Insights automatically detects your game type from uploaded data and customizes the entire analytics experience accordingly. This guide explains how game type detection works and why it matters for your analytics.

## Why Game Type Matters

Different game genres have fundamentally different success metrics, player behaviors, and monetization strategies. A Match-3 puzzle game cares about level progression and booster usage, while a Battle Royale focuses on skill-based matchmaking and weapon meta.

Game Insights adapts to your game type by:

- **Customizing KPI dashboards** - Showing the metrics that matter most for your genre
- **Recommending relevant funnels** - Pre-configured funnel templates based on genre best practices
- **Tailoring AI insights** - Generating recommendations specific to your game's mechanics
- **Optimizing visualizations** - Selecting chart types that best represent your data

## Supported Game Types

| Game Type | ID | Key Focus Areas |
|-----------|-----|-----------------|
| [Puzzle Games](/docs/game-guides/puzzle) | `puzzle` | Level progression, lives economy, booster usage |
| [Idle Games](/docs/game-guides/idle) | `idle` | Prestige funnels, offline rewards, upgrade paths |
| [Battle Royale](/docs/game-guides/battle-royale) | `battle_royale` | Rank distribution, weapon meta, match performance |
| [Match-3 Meta](/docs/game-guides/match3-meta) | `match3_meta` | Story progression, decoration systems, chapter completion |
| [Gacha RPG](/docs/game-guides/gacha-rpg) | `gacha_rpg` | Spender tiers, banner performance, character collection |

## How Detection Works

Game Insights uses a weighted signal detection algorithm that analyzes your data schema to identify game-specific patterns.

### Detection Signals

Each game type has associated semantic column types that serve as detection signals:

```typescript
// Example detection weights for Puzzle games
puzzle: [
  { signals: ['moves', 'booster'], weight: 5 },  // Strong indicators
  { signals: ['level', 'score'], weight: 3 },    // Medium indicators
  { signals: ['lives'], weight: 3 },             // Medium indicators
  { signals: ['session_id'], weight: 1 },        // Weak indicators
]
```

### Detection Process

1. **Schema Analysis** - Game Insights analyzes your column names against 40+ semantic types
2. **Pattern Matching** - Column names are matched against known patterns (e.g., `/moves/i`, `/booster/i`)
3. **Weight Calculation** - Each match adds weighted points to potential game types
4. **Confidence Scoring** - The highest-scoring type is selected with a confidence percentage
5. **Threshold Check** - If no clear winner emerges, the type defaults to "custom"

### Example Detection

If your data contains columns like:

```
user_id, level, score, moves_remaining, boosters_used, lives_left
```

The detector would identify:
- `moves_remaining` matches the `moves` semantic type (puzzle signal, weight: 5)
- `boosters_used` matches the `booster` semantic type (puzzle signal, weight: 5)
- `level` matches progression (puzzle signal, weight: 3)
- `lives_left` matches `lives` (puzzle signal, weight: 3)

**Result:** `puzzle` game type with high confidence (85%+)

## Switching Game Types

You can manually override the detected game type at any time.

### Via the UI

1. Click the **Game Type** selector in the header
2. Choose from the available game types
3. The dashboard will immediately update with genre-specific metrics

### Via Context API

```tsx
import { useGame } from '@/context/GameContext';

function GameTypeSelector() {
  const { selectedGame, setSelectedGame } = useGame();

  return (
    <select
      value={selectedGame}
      onChange={(e) => setSelectedGame(e.target.value as GameCategory)}
    >
      <option value="puzzle">Puzzle</option>
      <option value="idle">Idle</option>
      <option value="battle_royale">Battle Royale</option>
      <option value="match3_meta">Match-3 Meta</option>
      <option value="gacha_rpg">Gacha RPG</option>
      <option value="custom">Custom</option>
    </select>
  );
}
```

## Custom Game Type

When your game doesn't fit neatly into one of the predefined categories, or when the detector can't identify a clear pattern, the **Custom** game type provides a flexible foundation.

### When to Use Custom

- **Hybrid games** - Your game combines mechanics from multiple genres
- **Unique mechanics** - Your game has novel systems not covered by standard types
- **New genres** - Emerging game categories not yet supported
- **Generic analytics** - You want full manual control over metrics

### Custom Type Features

The custom game type provides:

- All standard retention and revenue metrics
- Generic funnel building tools
- Full chart library access
- AI insights based on general mobile game patterns

### Customizing Detection

To improve detection accuracy for your custom game, ensure your column names follow recognizable patterns:

| Data Type | Recommended Column Names |
|-----------|-------------------------|
| User identification | `user_id`, `player_id`, `uid` |
| Session tracking | `session_id`, `match_id` |
| Timestamps | `timestamp`, `event_time`, `created_at` |
| Revenue | `revenue`, `iap_revenue`, `ad_revenue` |
| Progression | `level`, `score`, `xp`, `rank` |
| Events | `event_name`, `event_type`, `action` |

## Data Provider Architecture

Each game type has a dedicated data provider that implements the `IDataProvider` interface:

```typescript
interface IDataProvider {
  getRetentionData(): RetentionData;
  getFunnelData(): FunnelStep[];
  getKPIData(): KPIData[];
  getRevenueData(): TimeSeriesData[];
  getSegmentData(): SegmentData[];
}
```

The factory function `createDataProvider(gameType)` returns the appropriate provider:

```typescript
import { createDataProvider } from '@/lib/dataProviders';

const provider = createDataProvider('puzzle');
const kpis = provider.getKPIData();
// Returns puzzle-specific KPIs: DAU, D1 Retention, Level 15 Pass Rate, etc.
```

## Best Practices

### For Accurate Detection

1. **Use descriptive column names** - `booster_uses` is better than `bu`
2. **Include game-specific columns** - Add columns like `prestige_count` for idle games
3. **Maintain consistency** - Use the same naming patterns across all data exports

### For Optimal Analytics

1. **Review detected type** - Verify the detected game type matches your game
2. **Explore genre-specific features** - Each game type unlocks tailored dashboards
3. **Combine with custom funnels** - Layer custom funnels on top of genre defaults

## Next Steps

Explore the detailed guides for each game type:

- [Puzzle Games Guide](/docs/game-guides/puzzle) - Level progression and power-up analytics
- [Idle Games Guide](/docs/game-guides/idle) - Prestige funnels and offline engagement
- [Battle Royale Guide](/docs/game-guides/battle-royale) - Competitive matchmaking insights
- [Match-3 Meta Guide](/docs/game-guides/match3-meta) - Story progression and decoration systems
- [Gacha RPG Guide](/docs/game-guides/gacha-rpg) - Spender segmentation and banner analysis
