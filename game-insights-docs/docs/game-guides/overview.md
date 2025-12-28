---
sidebar_position: 1
title: Game Analytics Overview
description: How Game Insights adapts to any game type
---

# Game Analytics That Adapts to Your Game

Game Insights analyzes YOUR data structure—not the other way around. Upload any game data, and the AI automatically understands it.

## How It Works

```
Your Data → AI Analysis → Tailored Dashboards
```

1. **You upload data** - Any CSV, JSON, or connect a live source
2. **AI analyzes structure** - Identifies what each column means (40+ semantic types)
3. **Patterns recognized** - Matches common game mechanics
4. **Dashboards generated** - Tailored to YOUR game's specific data

### What the AI Detects

The system recognizes columns like:
- **Player data:** user_id, session_id, country, platform
- **Engagement:** level, score, playtime, sessions
- **Monetization:** revenue, purchases, currency, products
- **Retention:** install_date, last_active, days_played
- **Game-specific:** moves, boosters, kills, pulls, prestige, and 30+ more

> **Key point:** You don't configure anything. The AI figures out your data automatically.

---

## Recognized Game Patterns

When the AI detects familiar game mechanics, it optimizes the analytics accordingly. Here are common patterns it recognizes:

| Pattern | Key Mechanics | Example Games |
|---------|---------------|---------------|
| [**Puzzle**](./puzzle) | Levels, moves, boosters, lives | Candy Crush, Gardenscapes |
| [**Idle/Incremental**](./idle) | Prestige, offline rewards, upgrades | Cookie Clicker, Idle Heroes |
| [**Battle Royale**](./battle-royale) | Matches, kills, placement, survival | PUBG Mobile, Fortnite |
| [**Match-3 + Meta**](./match3-meta) | Match-3 + story/decoration | Homescapes, Matchington Mansion |
| [**Gacha/RPG**](./gacha-rpg) | Character pulls, banners, rarity | Genshin Impact, AFK Arena |

### What "Pattern Recognition" Means

When Game Insights recognizes a pattern:
- **Specialized KPIs** appear on your dashboard (e.g., "Prestige Rate" for idle games)
- **Relevant charts** are recommended (e.g., funnel charts for level progression)
- **AI insights** reference industry benchmarks for that game type
- **Predictions** use models tuned for that mechanic type

---

## Works With ANY Game

These patterns are examples, not requirements. The system works with:

### Hybrid Games
Games that blend multiple patterns:
- Puzzle + RPG elements
- Idle + Battle mechanics
- Match-3 + City building

The AI recognizes components from each pattern and combines insights appropriately.

### Unique Mechanics
Games with systems not listed above:
- Simulation games
- Sports games
- Educational games
- Narrative-driven games
- Social/casual games

The AI still extracts meaningful analytics from your data structure.

### Any Data Format
Whether your game exports:
- Standard analytics events
- Custom event schemas
- Backend database dumps
- Third-party analytics exports

---

## Adaptive Analysis Mode

When your game doesn't match a specific pattern—or blends multiple patterns—the system applies intelligent defaults:

### What Happens

1. **Core metrics still work** - Retention, revenue, engagement are universal
2. **Column-based insights** - The AI analyzes what columns you have
3. **Smart defaults** - Reasonable charts and KPIs are generated
4. **Full functionality** - All features remain available

### Common Scenarios

| Your Game | What the AI Does |
|-----------|------------------|
| Strategy + RPG hybrid | Recognizes progression from RPG, session patterns from strategy |
| Casual game with IAPs | Focuses on monetization and engagement patterns |
| Multiplayer shooter | Detects match-based patterns, competitive metrics |
| Subscription-based | Recognizes recurring revenue patterns |

---

## How Detection Works

The AI uses semantic analysis to understand your data:

### Step 1: Column Recognition

Each column name is analyzed for meaning:
- `player_id` → User identifier
- `gem_purchase` → Revenue event
- `level_15_complete` → Progression milestone
- `daily_spin` → Engagement mechanic

### Step 2: Pattern Matching

Column combinations indicate game patterns:
- `moves` + `booster` + `level` → Puzzle pattern
- `prestige` + `offline_reward` → Idle pattern
- `kills` + `placement` → Battle royale pattern

### Step 3: Dashboard Generation

Based on detected patterns:
- Relevant KPI cards are added
- Appropriate chart types are selected
- AI insights are tailored to your game type
- Benchmarks are set accordingly

---

## Override When Needed

You can manually adjust the detected game type:

1. Click the **Game Type** selector in the header
2. Choose from the available patterns
3. The dashboard updates immediately

This is useful when:
- Your game blends multiple types
- You want to see different metrics
- The auto-detection picked a secondary pattern

---

## Explore Pattern Guides

Each guide shows what analytics Game Insights generates when it recognizes that pattern:

- **[Puzzle Games](./puzzle)** - Level funnels, booster economy, lives management
- **[Idle Games](./idle)** - Prestige cycles, offline vs online, upgrade progression
- **[Battle Royale](./battle-royale)** - Match analytics, skill curves, weapon meta
- **[Match-3 + Meta](./match3-meta)** - Dual-loop analytics, decoration engagement, story progression
- **[Gacha/RPG](./gacha-rpg)** - Pull analytics, banner performance, character investment

---

## Getting Started

1. **[Upload your data](/docs/data-management/uploading-data)** - The AI analyzes it automatically
2. **Check your dashboard** - See what patterns were detected
3. **Explore the insights** - AI recommendations appear based on your data
4. **Read the relevant guide** - Deep dive into metrics for your game type

> **Remember:** You don't need to tell Game Insights what type of game you have. It figures it out from your data.
