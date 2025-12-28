---
sidebar_position: 1
title: Quick Start
description: Get up and running with Game Insights in 5 minutes
---

# Quick Start

Get Game Insights running locally and analyze your first dataset in just 5 minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)

Verify your installation:

```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

## Step 1: Clone and Install

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/your-org/game-insights.git

# Navigate to the project
cd game-insights

# Install dependencies
npm install
```

## Step 2: Start the Development Server

Launch the local development server:

```bash
npm run dev
```

The application will be available at **http://localhost:5173**

You should see the Game Insights dashboard in your browser.

## Step 3: Upload Your First Dataset

1. **Navigate to the Upload page** - Click "Upload Data" in the sidebar or drag a file directly onto the dashboard

2. **Select your data file** - Game Insights supports:
   - CSV files (`.csv`)
   - Excel files (`.xlsx`, `.xls`)
   - JSON files (`.json`)

3. **Automatic Detection** - Once uploaded, Game Insights will:
   - Analyze your data schema
   - Detect column meanings (user_id, timestamp, revenue, etc.)
   - Identify your game type (puzzle, idle, battle royale, etc.)
   - Generate a data quality report

## Step 4: View Your Analytics

After the AI pipeline processes your data, you'll see:

### Dashboard Overview
- **KPI Cards** - Daily Active Users, Retention, Revenue, Session metrics
- **Retention Charts** - D1, D7, D30 retention curves with benchmarks
- **Funnel Visualization** - Conversion funnels based on your game type

### AI-Generated Insights
- Anomaly detection alerts
- Actionable recommendations
- Predictive metrics (if sufficient data)

## Sample Data

Don't have data yet? Use one of our sample datasets to explore the features:

```bash
# Sample datasets are available in the /samples directory
samples/
  puzzle_game_events.csv      # Match-3 puzzle game data
  idle_game_sessions.csv      # Idle/clicker game data
  battle_royale_matches.csv   # Battle royale match data
```

## Next Steps

Now that you have Game Insights running:

- **[Core Concepts](/docs/getting-started/core-concepts)** - Understand game types, KPIs, and the AI pipeline
- **[Architecture Overview](/docs/getting-started/architecture)** - Learn about the system design
- **[Data Management](/docs/data-management/overview)** - Connect to live data sources
- **[Dashboard Builder](/docs/dashboards/builder)** - Create custom visualizations

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## Troubleshooting

### Port already in use

If port 5173 is busy, Vite will automatically try the next available port. Check your terminal output for the actual URL.

### Dependencies fail to install

Try clearing your npm cache:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Data upload fails

Ensure your file:
- Is under 50MB
- Contains at least one column with user identifiers
- Has properly formatted dates (ISO 8601 preferred)

---

Need help? Check the [Installation Guide](/docs/getting-started/installation) for detailed setup instructions.
