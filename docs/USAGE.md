# Usage Guide

This guide walks you through using Game Insights to analyze your game data.

## Table of Contents

- [Getting Started](#getting-started)
- [Importing Data](#importing-data)
- [Dashboard Builder](#dashboard-builder)
- [Monetization Analytics](#monetization-analytics)
- [Real-time Monitoring](#real-time-monitoring)
- [Attribution Analytics](#attribution-analytics)
- [A/B Testing](#ab-testing)
- [What-If Analysis](#what-if-analysis)
- [ML Studio](#ml-studio)

---

## Getting Started

### First Launch

When you first open Game Insights, you'll see the **Upload Data** page. You have two options:

1. **Upload your own data** - Drag and drop CSV, Excel, JSON, or SQLite files
2. **Try Example Data** - Explore with pre-loaded sample datasets

![Upload Data Page](screenshots/01-upload-data.png)

### Sample Datasets

Click any of the sample data buttons to instantly load demo data:

- **Puzzle Game Analytics** - Level completions, booster usage, player progression
- **Idle Game Analytics** - Prestige tracking, offline rewards, session data
- **Gacha RPG Analytics** - Banner pulls, character collection, spender analysis

---

## Importing Data

### Supported Formats

| Format | Extensions | Notes |
|--------|------------|-------|
| CSV | `.csv` | Most common, auto-detects delimiters |
| Excel | `.xlsx`, `.xls` | Supports multiple sheets |
| JSON | `.json` | Array of objects format |
| SQLite | `.db`, `.sqlite` | Select tables to import |

### 4-Step Import Wizard

1. **Upload File** - Drag and drop or click to browse
2. **Preview Data** - Review data structure and quality score
3. **AI Analysis** - Automatic game type detection and column mapping
4. **Review & Confirm** - Verify mappings and import

### AI Column Detection

Game Insights recognizes 40+ semantic column types automatically:

- **Player metrics**: user_id, player_level, experience_points
- **Session data**: session_id, session_start, session_duration
- **Monetization**: revenue, currency_type, purchase_amount
- **Events**: event_name, event_timestamp, event_properties

### Optional: OpenAI API Key

For enhanced column detection, add your OpenAI API key in **Game Settings**. Without it, pattern matching is used (works for most cases).

---

## Dashboard Builder

Create custom dashboards tailored to your analytics needs.

![Dashboard Builder](screenshots/04-dashboard-builder.png)

### Features

- **Pre-built Templates**: Overview, Retention Deep Dive, Revenue Analytics
- **Drag-and-Drop Widgets**: Add charts, KPIs, tables
- **Multiple Dashboards**: Create unlimited dashboards
- **Key Metrics at a Glance**: DAU, Revenue, Retention, ARPU

### Creating a Dashboard

1. Navigate to **Dashboards** in the sidebar
2. Click **New Dashboard**
3. Select a template or start blank
4. Add widgets from the widget library
5. Drag to reposition, resize as needed

---

## Monetization Analytics

Track revenue performance and identify monetization opportunities.

![Monetization Analytics](screenshots/02-monetization.png)

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Total Revenue** | Sum of all transactions in the period |
| **Avg Daily** | Average daily revenue |
| **ARPU** | Average Revenue Per User |
| **ARPPU** | Average Revenue Per Paying User |
| **Conversion** | Percentage of users who made a purchase |

### Charts

- **Daily Revenue Trend** - Visualize revenue over time
- **Revenue by Source** - IAP vs Ads vs Subscriptions
- **Top Spenders** - Identify whale players
- **Purchase Funnel** - Shop visits → Cart → Purchase

---

## Real-time Monitoring

Monitor live events from your game with simulated real-time data.

![Real-time Monitoring](screenshots/03-realtime.png)

### Features

- **Live Events Tab** - Stream of incoming events
- **SDK Status Tab** - Monitor SDK health and connectivity
- **Unique User Counts** - Track active users by event type
- **Pattern-Based Simulation** - Realistic event patterns from your data

### Event Types Tracked

- User sessions
- Purchases
- Level completions
- Custom events

---

## Attribution Analytics

Understand which marketing channels drive installs and revenue.

![Attribution Analytics](screenshots/05-attribution.png)

### Attribution Models

| Model | Description |
|-------|-------------|
| **First Touch** | 100% credit to first touchpoint |
| **Last Touch** | 100% credit to last touchpoint |
| **Linear** | Equal credit across all touchpoints |
| **Time Decay** | More credit to recent touchpoints |
| **Position Based** | 40% first, 40% last, 20% middle |

### Metrics

- **Total Installs** - Attributed installs
- **Ad Spend** - Marketing investment
- **Revenue** - Revenue from attributed users
- **Blended ROAS** - Return on ad spend

### Channel Breakdown

Visual breakdown of installs by source: Organic Search, Facebook, Google Ads, Apple Search Ads, etc.

---

## A/B Testing

Run experiments and optimize your game with statistical rigor.

![A/B Testing](screenshots/06-ab-testing.png)

### Experiment Management

- **Create Experiments** - Define variants and target audience
- **Track Progress** - Monitor sample size and completion
- **Statistical Significance** - Know when results are conclusive
- **Winner Detection** - Automatic leading variant identification

### Experiment Cards Show

- Variant count
- Target audience
- Start date
- Sample progress (current / target)
- Leading variant with lift percentage

### Actions

- **Pause** - Temporarily stop an experiment
- **Complete** - End experiment and declare winner

---

## What-If Analysis

Simulate scenarios to project business impact before making changes.

![What-If Analysis](screenshots/07-what-if.png)

### Adjustable Metrics

| Metric | Description |
|--------|-------------|
| **Retention** | D1, D7, D30 retention changes |
| **Conversion** | Purchase conversion rate |
| **ARPU** | Revenue per user |
| **New Users** | Daily acquisition rate |

### Projections

- **30 / 60 / 90 day** projections
- **Revenue Impact** - Dollar change from baseline
- **DAU Impact** - User count changes
- **LTV Impact** - Lifetime value projections
- **Confidence Range** - Min/max estimates

### Save Scenarios

Save and compare different scenarios to evaluate options.

---

## ML Studio

Train machine learning models without writing code.

![ML Studio Overview](screenshots/08-ml-studio.png)

### Supported Models

- **Churn Prediction** - Identify at-risk players
- **LTV Prediction** - Forecast player lifetime value
- **Retention Prediction** - Predict D7/D30 retention

### Training a Model

1. Click **New Training Job**
2. Select model type and algorithm
3. Choose features from your data
4. Start training
5. Review metrics when complete

### Model Metrics

![ML Studio Model Details](screenshots/09-ml-studio-details.png)

| Metric | Description |
|--------|-------------|
| **Accuracy** | Overall prediction accuracy |
| **Precision** | True positive rate |
| **Recall** | Coverage of actual positives |
| **F1 Score** | Harmonic mean of precision/recall |
| **AUC-ROC** | Area under ROC curve |

### Feature Importance

See which features drive predictions:
- `days_since_last_session` - 35%
- `total_sessions` - 25%
- `total_purchases` - 20%
- `avg_session_length` - 12%

### Deployment

Deploy trained models to generate predictions on new data.

---

## Tips & Best Practices

### Data Quality

- Ensure timestamps are in a consistent format
- Include a unique user/player ID column
- More data = better predictions

### Performance

- For files > 50MB, streaming import is automatic
- Use **Performance Mode** (in settings) for slower machines
- Close unused dashboards to reduce memory

### Getting Help

- Check the sidebar navigation for all features
- Hover over (?) icons for tooltips
- Visit [GitHub Discussions](https://github.com/efeecllk/game-insights/discussions) for community help

---

<p align="center">
  <strong>Happy analyzing!</strong>
</p>
