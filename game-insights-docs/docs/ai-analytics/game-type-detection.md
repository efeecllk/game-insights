# Game Type Detection

Game Insights automatically classifies your game into one of five categories based on the data columns present. This enables game-specific metrics, visualizations, and recommendations.

## Supported Game Types

### Puzzle Games

**Examples:** Candy Crush, Gardenscapes, Homescapes

**Characteristics:**
- Level-based progression
- Move limits per level
- Boosters/power-ups to help complete levels
- Lives/energy system

**Key Metrics:**
- Level completion rate
- Average moves per level
- Booster usage rate
- Level difficulty distribution

**Detection Signals:**
| Signal | Weight |
|--------|--------|
| `moves` + `booster` | 5 (Strong) |
| `level` + `score` | 3 |
| `lives` | 3 |
| `session_id` | 1 |

---

### Idle Games

**Examples:** Cookie Clicker, AdVenture Capitalist, Idle Heroes

**Characteristics:**
- Passive resource generation
- Prestige/rebirth mechanics
- Offline earnings
- Incremental upgrades

**Key Metrics:**
- Prestige rate
- Offline vs online time
- Upgrade progression
- Currency inflation rate

**Detection Signals:**
| Signal | Weight |
|--------|--------|
| `prestige` | 5 (Strong) |
| `offline_reward` | 5 (Strong) |
| `upgrade` | 4 |
| `currency` | 3 |
| `level` | 1 |

---

### Battle Royale

**Examples:** PUBG Mobile, Fortnite, Free Fire

**Characteristics:**
- Match-based gameplay
- Player elimination
- Placement/ranking system
- Survival time tracking

**Key Metrics:**
- Average placement
- Kill/death ratio
- Top 10 rate
- Average survival time

**Detection Signals:**
| Signal | Weight |
|--------|--------|
| `placement` + `kills` | 5 (Strong) |
| `damage` + `survival_time` | 4 |
| `rank` | 3 |
| `user_id` | 1 |

---

### Match3 + Meta

**Examples:** Homescapes, Lily's Garden, Fishdom

**Characteristics:**
- Match-3 core loop
- Meta-game progression (decorating, story)
- Level-based with moves
- Boosters and item collection

**Key Metrics:**
- Level completion rate
- Meta progression rate
- Booster purchase rate
- Story completion percentage

**Detection Signals:**
| Signal | Weight |
|--------|--------|
| `moves` + `booster` | 5 (Strong) |
| `level` + `score` | 3 |
| `item_id` + `category` | 2 |
| `revenue` + `price` | 1 |

---

### Gacha RPG

**Examples:** Genshin Impact, Fire Emblem Heroes, Summoners War

**Characteristics:**
- Character collection via gacha pulls
- Rarity tiers (SSR, SR, R)
- Banner/event-based pulls
- Pity system mechanics

**Key Metrics:**
- Pull rate by rarity
- Pity system utilization
- Banner performance
- Character collection rate

**Detection Signals:**
| Signal | Weight |
|--------|--------|
| `pull_type` + `banner` | 5 (Strong) |
| `rarity` | 5 (Strong) |
| `currency` | 3 |
| `level` + `xp` | 2 |
| `rank` | 1 |

---

### Custom

When no clear pattern is detected, the game is classified as `custom`. This still provides:

- Basic analytics (DAU, sessions, retention)
- Generic visualizations
- Standard recommendations

---

## Detection Algorithm

### How It Works

1. **Extract Semantic Types**: Schema analyzer identifies column meanings
2. **Match Signals**: Compare against game type indicators
3. **Calculate Scores**: Weight matches by importance
4. **Determine Winner**: Highest score wins (with margin requirement)

### Scoring Example

Given columns: `user_id`, `level`, `moves`, `booster`, `lives`, `score`

```
Detected semantic types: [user_id, level, moves, booster, lives, score]

Puzzle scoring:
  moves + booster (weight 5) = 5 (both present)
  level + score (weight 3) = 3 (both present)
  lives (weight 3) = 3
  session_id (weight 1) = 0 (not present)
  Total: 11

Idle scoring:
  prestige (weight 5) = 0
  offline_reward (weight 5) = 0
  upgrade (weight 4) = 0
  currency (weight 3) = 0
  level (weight 1) = 1
  Total: 1

Battle Royale scoring:
  placement + kills (weight 5) = 0
  damage + survival_time (weight 4) = 0
  rank (weight 3) = 0
  user_id (weight 1) = 1
  Total: 1

Winner: Puzzle (11 points)
```

### Confidence Calculation

Confidence is based on score relative to maximum possible:

```typescript
const maxPossible = indicators.reduce((sum, i) =>
  sum + i.weight * i.signals.length, 0
);

const rawConfidence = topScore / maxPossible;
const confidence = Math.min(rawConfidence + 0.3, 0.95);
```

### Margin Requirement

If the top two scores are too close (difference < 2), the result is `custom`:

```typescript
if (topScore === 0 || topScore - secondScore < 2) {
  return { gameType: 'custom', confidence: 0.3 };
}
```

---

## Usage

### Basic Detection

```typescript
import { gameTypeDetector, schemaAnalyzer } from '@/ai';

// First, analyze schema
const meanings = schemaAnalyzer.analyze(schema);

// Then detect game type
const result = gameTypeDetector.detect(meanings);

console.log('Game Type:', result.gameType);
console.log('Confidence:', (result.confidence * 100).toFixed(0) + '%');
console.log('Reasons:', result.reasons);
```

### Example Output

```javascript
{
  gameType: 'puzzle',
  confidence: 0.85,
  reasons: [
    'Found moves, booster (weight: 5)',
    'Found level, score (weight: 3)',
    'Found lives (weight: 3)'
  ]
}
```

---

## Manual Override

If automatic detection is incorrect, you can manually specify the game type:

### In Pipeline Configuration

```typescript
const result = await dataPipeline.run(data, {
  gameType: 'gacha_rpg',  // Force specific game type
});
```

### Using Game Context

```typescript
import { useGame } from '@/context/GameContext';

function GameSettings() {
  const { gameType, setGameType } = useGame();

  return (
    <select
      value={gameType}
      onChange={(e) => setGameType(e.target.value)}
    >
      <option value="puzzle">Puzzle</option>
      <option value="idle">Idle</option>
      <option value="battle_royale">Battle Royale</option>
      <option value="match3_meta">Match3 + Meta</option>
      <option value="gacha_rpg">Gacha RPG</option>
      <option value="custom">Custom</option>
    </select>
  );
}
```

---

## Game-Specific Features

Once a game type is detected, Game Insights enables specialized features:

### Tailored Dashboards

Each game type gets optimized dashboard layouts:

| Game Type | Primary Charts | KPIs |
|-----------|---------------|------|
| Puzzle | Funnel, Level Distribution | Completion Rate, Booster Usage |
| Idle | Area (progression), Gauge | Prestige Rate, Offline Ratio |
| Battle Royale | Histogram (placement), Scatter | K/D, Top 10 Rate |
| Match3 Meta | Funnel, Pie (items) | Level Progress, Meta Progress |
| Gacha RPG | Bar (banner), Donut (rarity) | SSR Rate, Pity Average |

### Contextual Recommendations

Insights are tailored to each game type:

```typescript
const GAME_TIPS = {
  puzzle: [
    'Consider adding hint systems for stuck players',
    'Level completion times reveal difficulty spikes',
    'Boosters near hard levels drive IAP conversion',
  ],
  idle: [
    'Optimize offline reward calculations for engagement',
    'Monitor currency inflation over time',
    'Prestige timing affects long-term retention',
  ],
  battle_royale: [
    'Track time-to-first-kill for early engagement',
    'Analyze where players drop most frequently',
    'Weapon balance affects matchmaking satisfaction',
  ],
  // ...
};
```

### Optimized Metrics

Game-specific metrics are prioritized:

**Puzzle:**
- Level completion rate
- Moves efficiency
- Booster conversion

**Idle:**
- Prestige cadence
- Offline/online ratio
- Upgrade depth

**Battle Royale:**
- Win rate
- K/D ratio
- Survival time

---

## Improving Detection Accuracy

### Column Naming Best Practices

Use clear, standard column names:

| Game Type | Recommended Columns |
|-----------|---------------------|
| Puzzle | `moves`, `booster_used`, `lives_remaining`, `level_completed` |
| Idle | `prestige_count`, `offline_minutes`, `upgrade_level` |
| Battle Royale | `kills`, `placement`, `damage_dealt`, `survival_time` |
| Gacha | `pull_type`, `banner_name`, `rarity`, `pity_count` |

### Adding Missing Columns

If detection confidence is low, consider adding indicator columns:

```csv
# For puzzle games, add:
moves_used,boosters_used,lives_spent

# For idle games, add:
prestige_level,offline_reward_collected,upgrade_purchased

# For gacha games, add:
pull_count,banner_id,character_rarity
```

---

## API Reference

### GameTypeDetector

```typescript
interface DetectionResult {
  gameType: GameCategory;
  confidence: number;  // 0-1
  reasons: string[];   // Human-readable explanations
}

type GameCategory =
  | 'puzzle'
  | 'idle'
  | 'battle_royale'
  | 'match3_meta'
  | 'gacha_rpg'
  | 'custom';

class GameTypeDetector {
  detect(meanings: ColumnMeaning[]): DetectionResult;
}
```

### Indicator Weights

```typescript
const GAME_INDICATORS: Record<GameCategory, Indicator[]> = {
  puzzle: [
    { signals: ['moves', 'booster'], weight: 5 },
    { signals: ['level', 'score'], weight: 3 },
    { signals: ['lives'], weight: 3 },
    { signals: ['session_id'], weight: 1 },
  ],
  idle: [
    { signals: ['prestige'], weight: 5 },
    { signals: ['offline_reward'], weight: 5 },
    { signals: ['upgrade'], weight: 4 },
    { signals: ['currency'], weight: 3 },
    { signals: ['level'], weight: 1 },
  ],
  battle_royale: [
    { signals: ['placement', 'kills'], weight: 5 },
    { signals: ['damage', 'survival_time'], weight: 4 },
    { signals: ['rank'], weight: 3 },
    { signals: ['user_id'], weight: 1 },
  ],
  match3_meta: [
    { signals: ['moves', 'booster'], weight: 5 },
    { signals: ['level', 'score'], weight: 3 },
    { signals: ['item_id', 'category'], weight: 2 },
    { signals: ['revenue', 'price'], weight: 1 },
  ],
  gacha_rpg: [
    { signals: ['pull_type', 'banner'], weight: 5 },
    { signals: ['rarity'], weight: 5 },
    { signals: ['currency'], weight: 3 },
    { signals: ['level', 'xp'], weight: 2 },
    { signals: ['rank'], weight: 1 },
  ],
  custom: [],
};
```

---

## Next Steps

- [Schema Analysis](./schema-analysis) - Column detection details
- [AI Pipeline](./ai-pipeline) - Complete pipeline documentation
- [Recommendations](./recommendations) - Game-specific insights
