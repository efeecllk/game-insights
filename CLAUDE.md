# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev       # Start Vite dev server
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

1. **Adapters** (`src/adapters/`): Unified interface for data sources (files, APIs, databases). All extend `BaseAdapter` which defines `connect()`, `fetchSchema()`, `fetchData()`.

2. **AI Pipeline** (`src/ai/DataPipeline.ts`): Orchestrates analysis flow:
   - `DataSampler` → smart sampling for large datasets
   - `SchemaAnalyzer` → semantic column detection (user_id, timestamp, revenue, etc.)
   - `GameTypeDetector` → classifies into puzzle/idle/battle_royale/match3_meta/gacha_rpg
   - `DataCleaner` → identifies quality issues and generates cleaning plans
   - `ChartSelector` → recommends visualizations based on detected patterns
   - `InsightGenerator` → produces AI-driven recommendations

3. **Context Providers** (`src/context/`):
   - `DataContext`: manages uploaded game data with IndexedDB persistence
   - `GameContext`: tracks selected game type for UI customization

4. **Data Providers** (`src/lib/dataProviders.ts`): Factory pattern for game-specific demo data. `createDataProvider(gameType)` returns retention, funnel, revenue, and KPI data.

### Key Patterns

- **Adapter Pattern**: All data sources implement `BaseAdapter` interface
- **Factory Pattern**: `createDataProvider()` creates game-type-specific data handlers
- **Path aliases**: Use `@/` for `src/` imports (configured in tsconfig and vite)

### Game Types

The system supports these game categories, each with tailored metrics:
- `puzzle`: Level progression, booster usage
- `idle`: Prestige funnels, offline/online time
- `battle_royale`: Rank distribution, weapon meta
- `match3_meta`: Story progression, decoration styles
- `gacha_rpg`: Spender tiers, banner performance

### Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS with custom dark theme colors (`bg-darkest`, `bg-card`, `accent-primary`, etc.)
- ECharts for visualizations (via echarts-for-react)
- Framer Motion for animations
- React Router for navigation
