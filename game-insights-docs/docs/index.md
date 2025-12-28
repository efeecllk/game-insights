---
sidebar_position: 1
slug: /
title: Introduction
description: Welcome to Game Insights - AI-Powered Analytics Dashboard for Mobile Games
---

# Welcome to Game Insights

**Game Insights** is an AI-powered analytics dashboard designed specifically for mobile game developers. It automatically detects your game type and generates tailored visualizations, predictions, and actionable recommendations.

## Why Game Insights?

Traditional analytics tools require extensive configuration and domain expertise. Game Insights takes a different approach:

- **Zero-Config Analytics** - Upload your data and get insights immediately
- **AI-Powered Detection** - Automatically identifies your game type and relevant metrics
- **Predictive Intelligence** - Forecast retention, churn, LTV, and revenue
- **Game-Specific Dashboards** - Visualizations tailored to puzzle, idle, battle royale, match-3, and gacha games

## Quick Links

<div className="quick-links">

<a href="/docs/getting-started/quickstart" className="quick-link">
  <span className="quick-link__icon">🚀</span>
  <div className="quick-link__content">
    <h3>Quick Start</h3>
    <p>Get up and running in 5 minutes</p>
  </div>
</a>

<a href="/docs/data-management/uploading-data" className="quick-link">
  <span className="quick-link__icon">📊</span>
  <div className="quick-link__content">
    <h3>Upload Data</h3>
    <p>Import your game analytics data</p>
  </div>
</a>

<a href="/docs/ai-analytics/overview" className="quick-link">
  <span className="quick-link__icon">🤖</span>
  <div className="quick-link__content">
    <h3>AI Features</h3>
    <p>Explore predictions and insights</p>
  </div>
</a>

<a href="/docs/cookbook" className="quick-link">
  <span className="quick-link__icon">📖</span>
  <div className="quick-link__content">
    <h3>Cookbook</h3>
    <p>Step-by-step tutorials</p>
  </div>
</a>

</div>

## Core Features

| Feature | Description |
|---------|-------------|
| **Smart Data Import** | Drag-and-drop CSV, Excel, JSON, or connect to databases |
| **Auto Game Detection** | AI identifies puzzle, idle, battle royale, match-3, or gacha games |
| **Retention Prediction** | Forecast D1, D7, D30 retention with ML models |
| **Churn Prevention** | Identify at-risk users before they leave |
| **Revenue Forecasting** | 30-day revenue projections with confidence intervals |
| **A/B Testing** | Built-in experimentation framework with Bayesian analysis |
| **Real-time Monitoring** | Live dashboards with 3-second refresh |
| **Custom Dashboards** | Drag-and-drop dashboard builder |
| **Alert System** | Multi-channel alerts for anomalies and thresholds |

## Supported Game Types

Game Insights provides specialized analytics for five major mobile game categories:

| Game Type | Key Metrics | Unique Features |
|-----------|-------------|-----------------|
| 🧩 **Puzzle** | Level progression, booster usage | Difficulty heatmaps, hint effectiveness |
| ⏰ **Idle** | Prestige funnels, offline time | Upgrade progression, daily login ROI |
| 🎯 **Battle Royale** | Rank distribution, weapon meta | SBMM analysis, squad vs solo |
| 💎 **Match-3 Meta** | Story progression, decorations | Chapter completion, power-up patterns |
| 🎰 **Gacha RPG** | Banner performance, spender tiers | Whale analysis, limited events |

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Data       │     │  AI         │     │  Analysis   │     │  Dashboard  │
│  Source     │ ──► │  Pipeline   │ ──► │  Engine     │ ──► │  Display    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                    │                   │                    │
   Files              Schema              Predictions          Charts
   APIs               Detection           Insights             KPIs
   Databases          Cleaning            Anomalies            Funnels
```

## Design Principles

1. **Zero-Config First** - Works for 90% of users without configuration
2. **Progressive Disclosure** - Simple by default, power features available
3. **Local-First** - Your data stays on your machine unless explicitly shared

## Getting Started

Ready to dive in? Start with the [Quick Start Guide](/docs/getting-started/quickstart) to upload your first dataset and see Game Insights in action.

Or explore the documentation:

- [Core Concepts](/docs/getting-started/core-concepts) - Understand how Game Insights works
- [Data Management](/docs/data-management/overview) - Learn about data import options
- [AI & Analytics](/docs/ai-analytics/overview) - Explore predictive features
- [Dashboards](/docs/dashboards/overview-dashboard) - Build custom visualizations

## Community & Support

- **GitHub**: Report issues and contribute
- **Documentation**: You're here!

---

Built with modern technologies: React, TypeScript, Vite, Zustand, ECharts, and TailwindCSS.
