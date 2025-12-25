# Game Insights

**Open-source analytics for indie game developers.**

Upload your game data, get instant insights. No data engineering required.

---

## The Problem

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
- **Excel, SQLite, Google Sheets** support (coming soon)
- **Game engine templates** for Unity, Godot, Unreal

### Zero-Config Analytics
- **Auto-detect game type** (puzzle, idle, RPG, battle royale, etc.)
- **Instant dashboard generation** based on your data
- **AI-powered insights** and recommendations

### Smart Analysis
- **40+ semantic column types** recognized automatically
- **Data quality scoring** with auto-fix suggestions
- **Retention, monetization, engagement** metrics calculated

### Tailored for Games
- Puzzle games: Level funnels, booster analysis
- Idle games: Prestige tracking, offline rewards
- Battle royale: Weapon meta, skill distribution
- Gacha RPG: Banner analysis, spender tiers

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/game-insights.git
cd game-insights

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 and upload a CSV to get started.

---

## Sample Data

Try with the sample data in `/sample-data/`:
- `puzzle_game_events.csv` - Puzzle game level completions
- `battle_royale_matches.json` - Match results
- `gacha_rpg_pulls.json` - Gacha pull data
- `iap_transactions.csv` - Purchase events

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast development
- **Tailwind CSS** with dark theme
- **ECharts** for visualizations
- **IndexedDB** for local data persistence

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Universal Data Import | In Progress |
| **Phase 2** | Zero-Config Analytics | In Progress |
| **Phase 3** | One-Click Integrations | Planned |
| **Phase 4** | Community & Ecosystem | Planned |
| **Phase 5** | Advanced AI & Predictions | Planned |

See [docs/phases/](./docs/phases/) for detailed roadmap.

### Coming Soon
- Google Sheets integration
- Firebase Analytics connection
- Supabase / PostgreSQL support
- PlayFab integration
- Template marketplace
- Predictive analytics

---

## Contributing

We welcome contributions! Here's how you can help:

- **Phase 1**: File parsers, game engine templates
- **Phase 2**: AI improvements, metric calculations
- **Phase 3**: New adapter implementations
- **Phase 4**: Templates, documentation
- **Phase 5**: ML models, predictions

### Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

---

## Architecture

```
Data Source → Adapter → Normalizer → AI Pipeline → Dashboard
```

- **Adapters** - Unified interface for all data sources
- **AI Pipeline** - Schema analysis, game detection, cleaning
- **Dashboard** - Auto-generated visualizations

See [CLAUDE.md](./CLAUDE.md) for detailed architecture.

---

## License

MIT License - Use it however you want.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/game-insights/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/game-insights/discussions)

---

**Made for indie devs, by indie devs.**
