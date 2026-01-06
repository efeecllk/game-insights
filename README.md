# Game Insights

**Open-source analytics for indie game developers.**

Upload your game data, get instant insights. No data engineering required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why Game Insights?

Indie developers are at a massive disadvantage when it comes to analytics:

- Big studios have dedicated data teams
- Enterprise tools cost $10k+/month
- Building custom analytics takes months
- Data comes from dozens of different sources

**Game Insights levels the playing field.**

---

## Features

### Universal Data Import
- **CSV/JSON upload** with AI-powered column detection
- **Google Sheets** integration
- **Firebase Analytics** connection
- **Supabase / PostgreSQL** support
- **PlayFab** integration
- **Unity SDK** adapter

### Zero-Config Analytics
- **Auto-detect game type** (puzzle, idle, RPG, battle royale, etc.)
- **Instant dashboard generation** based on your data
- **AI-powered insights** and recommendations

### Smart Analysis
- **40+ semantic column types** recognized automatically
- **Data quality scoring** with auto-fix suggestions
- **Retention, monetization, engagement** metrics calculated

### Game-Specific Dashboards
| Game Type | Key Metrics |
|-----------|-------------|
| Puzzle | Level funnels, booster usage, difficulty curves |
| Idle | Prestige tracking, offline rewards, progression speed |
| Battle Royale | Weapon meta, skill distribution, match balance |
| Match-3 | Lives economy, hard level analysis, boosters |
| Gacha RPG | Banner analysis, spender tiers, pity tracking |

### Advanced AI Features
- **Predictive Analytics**: Retention, churn, LTV, revenue forecasting
- **Anomaly Detection**: Automatic alerts for unusual patterns
- **User Segmentation**: K-means clustering and behavior-based segments
- **Intelligent Alerting**: Rule-based notifications with severity levels

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/game-insights.git
cd game-insights

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and upload a CSV to get started.

### Try with Sample Data

Sample datasets are included in `/sample-data/`:

```
sample-data/
├── puzzle_game_events.csv     # Puzzle game level completions
├── battle_royale_matches.json # Match results with player stats
├── gacha_rpg_pulls.json       # Gacha pull and banner data
└── iap_transactions.csv       # In-app purchase events
```

---

## Project Structure

```
game-insights/
├── src/
│   ├── adapters/        # Data source connectors (CSV, API, SQL, etc.)
│   ├── ai/              # AI pipeline (schema analysis, game detection, ML models)
│   ├── components/      # Reusable UI components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities, data providers, chart registry
│   ├── pages/           # Page components (Dashboard, Funnels, etc.)
│   ├── plugins/         # Plugin system for extensibility
│   └── types/           # TypeScript type definitions
├── sample-data/         # Example datasets for testing
├── docs/                # Documentation
│   ├── ARCHITECTURE.md  # System architecture overview
│   └── plans/           # Feature implementation plans
└── tests/               # Test suites (Vitest + Playwright)
```

---

## Architecture

```
Data Source → Adapter → Normalizer → AI Pipeline → Dashboard
```

1. **Adapters** (`src/adapters/`): Unified interface for data sources. All extend `BaseAdapter` with `connect()`, `fetchSchema()`, `fetchData()`.

2. **AI Pipeline** (`src/ai/`): Orchestrates analysis:
   - `SchemaAnalyzer` → Semantic column detection (40+ types)
   - `GameTypeDetector` → Game classification
   - `DataCleaner` → Quality issues and cleaning plans
   - `ChartSelector` → Visualization recommendations
   - `InsightGenerator` → AI-driven insights
   - ML Models → Retention, churn, LTV predictions

3. **Dashboard** (`src/pages/`): Auto-generated visualizations based on detected game type.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture.

---

## Available Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:5173)
pnpm build            # TypeScript check + production build
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier

# Testing
pnpm test             # Run unit tests
pnpm test:coverage    # Run tests with coverage report
```

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast development
- **Tailwind CSS** with custom dark theme
- **ECharts** for visualizations
- **IndexedDB** for local data persistence
- **Zustand** for state management

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Areas for Contribution

- **Data Adapters**: Add support for new data sources
- **AI Improvements**: Better game detection, more semantic types
- **Visualizations**: New chart types, dashboard layouts
- **Documentation**: Tutorials, examples, translations

---

## Design Principles

1. **Zero-Config First** - Works for 90% of users without configuration
2. **Progressive Disclosure** - Simple by default, power features available
3. **Local-First** - Your data stays on your machine unless explicitly shared
4. **Game Developer Focus** - Every feature designed for game analytics

---

## License

MIT License - Use it however you want.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/game-insights/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/game-insights/discussions)

---

**Made for indie devs, by indie devs.**
