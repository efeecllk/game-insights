# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

## Architecture Overview

Game Insights is a React analytics dashboard for mobile games. It automatically detects game types from uploaded data and generates appropriate visualizations.

### Core Data Flow

```
Data Source → Adapter → Normalizer → AI Pipeline → Dashboard
```

1. **Adapters** (`src/adapters/`): Unified interface for data sources. All extend `BaseAdapter` with `connect()`, `fetchSchema()`, `fetchData()`.

2. **AI Pipeline** (`src/ai/DataPipeline.ts`): Orchestrates analysis:
   - `DataSampler` → smart sampling for large datasets
   - `SchemaAnalyzer` → semantic column detection (40+ types: user_id, timestamp, revenue, level, etc.)
   - `GameTypeDetector` → classifies into puzzle/idle/battle_royale/match3_meta/gacha_rpg
   - `DataCleaner` → identifies quality issues, generates cleaning plans
   - `ChartSelector` → recommends visualizations
   - `InsightGenerator` → produces AI-driven recommendations

3. **Context Providers** (`src/context/`):
   - `DataContext`: uploaded game data with IndexedDB persistence
   - `GameContext`: selected game type for UI customization

4. **Data Providers** (`src/lib/dataProviders.ts`): Factory pattern - `createDataProvider(gameType)` returns retention, funnel, revenue, and KPI data.

### Key Patterns

- **Adapter Pattern**: All data sources implement `BaseAdapter` interface
- **Factory Pattern**: `createDataProvider()` for game-specific data handlers
- **Path aliases**: Use `@/` for `src/` imports

### Game Types

Each category has tailored metrics and chart configurations:
- `puzzle`: Level progression, booster usage
- `idle`: Prestige funnels, offline/online time
- `battle_royale`: Rank distribution, weapon meta
- `match3_meta`: Story progression, decoration styles
- `gacha_rpg`: Spender tiers, banner performance

## Tailwind Custom Theme

Custom colors defined in `tailwind.config.js`:
```
bg-darkest, bg-dark, bg-card, bg-card-hover, bg-elevated  # Backgrounds
accent-primary (#8b5cf6), accent-secondary (#6366f1)      # Accents
chart-purple, chart-indigo, chart-pink, chart-cyan, chart-green, chart-orange
```
Border radius: `rounded-card` (16px)

## Adding New Features

1. **New data source**: Extend `BaseAdapter` in `src/adapters/`
2. **New column type**: Add to `SemanticType` in `src/ai/SchemaAnalyzer.ts`
3. **New game type**: Update `GameTypeDetector.ts` with detection weights
4. **New chart**: Register in `src/lib/chartRegistry.ts`
5. **New page**: Add route in `src/App.tsx`, component in `src/pages/`

## Feature Plans

Existing plans are in `docs/plans/` (01-14). Roadmap phases in `docs/phases/`.

## Design Principles

1. **Zero-Config First** - Works for 90% of users without configuration
2. **Progressive Disclosure** - Simple by default, power features available
3. **Local-First** - Data stays on user's machine unless explicitly shared
