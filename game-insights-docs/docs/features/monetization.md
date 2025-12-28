---
sidebar_position: 3
title: Monetization Analytics
description: Track revenue, ARPU, ARPPU, spender tiers, and top-performing products
---

# Monetization Analytics

The Monetization page (`/monetization`) provides comprehensive revenue analytics for your mobile game. Track daily revenue trends, analyze spender segments, and identify your top-performing products.

## Overview

Monetization analytics includes:

- **Revenue Dashboard** - Daily revenue charts with period totals
- **Key Metrics** - ARPU, ARPPU, and conversion rates
- **Spender Tiers** - Breakdown of spending segments
- **Top Products** - Best-selling IAPs and their revenue
- **Whale Watch** - Tracking high-value players

## KPI Cards

Five key monetization metrics are displayed at the top of the page:

### Total Revenue

```
$28,500
Last 14 days
```

Sum of all revenue during the selected period.

### Average Daily Revenue

```
$2,035
Per day
```

Total revenue divided by number of days in the period.

### ARPU (Average Revenue Per User)

```
$0.45
All users
```

Total revenue divided by total active users:

```
ARPU = Total Revenue / Total Active Users
```

### ARPPU (Average Revenue Per Paying User)

```
$8.50
Paying users
```

Total revenue divided by paying users only:

```
ARPPU = Total Revenue / Number of Paying Users
```

### Conversion Rate

```
5.3%
Payer rate
```

Percentage of users who made at least one purchase:

```
Conversion Rate = (Paying Users / Total Users) * 100
```

## Daily Revenue Chart

The revenue chart displays daily revenue as a bar chart with:

- **X-axis** - Dates over the selected period
- **Y-axis** - Revenue in dollars (K = thousands)
- **Bars** - Green gradient bars for each day
- **Tooltips** - Hover for exact daily values

### Reading the Chart

```
Example daily values:
Mon:  $1,200  ▓▓▓
Tue:  $1,450  ▓▓▓▓
Wed:  $1,100  ▓▓▓
Thu:  $1,800  ▓▓▓▓▓
Fri:  $2,200  ▓▓▓▓▓▓▓
Sat:  $1,900  ▓▓▓▓▓▓
Sun:  $2,100  ▓▓▓▓▓▓▓
```

### Identifying Patterns

Look for:
- **Weekend spikes** - Common in casual games
- **Event correlations** - Revenue jumps during promotions
- **Trend lines** - Overall increasing or decreasing revenue

## Spender Tier Breakdown

A donut chart visualizes the distribution of users across spending tiers:

### Default Tiers

| Tier | Description | Typical % |
|------|-------------|-----------|
| **$0 (F2P)** | Free-to-play, never purchased | 85-95% |
| **$1-10** | Minnows, occasional spenders | 3-8% |
| **$10-50** | Dolphins, regular spenders | 1-3% |
| **$50-100** | Large dolphins | 0.5-1% |
| **$100+** | Whales, high-value players | 0.1-0.5% |

### Game-Specific Tiers

#### Gacha RPG

```
$0 (F2P):     120,000 users
$1-50:          8,500 users
$50-200:        2,100 users
$200-500:         650 users
$500+:            180 users
```

#### Battle Royale

```
$0 (F2P):     180,000 users
$1-20:         12,000 users
$20-50:         3,500 users
$50-100:          850 users
$100+:             95 users
```

### Tier Analysis

Key insights to extract:

1. **Conversion ratio** - F2P to first purchase
2. **Upgrade rate** - Lower tier to higher tier
3. **Whale concentration** - Revenue from top spenders

## Top Products Analysis

A ranked list of your best-performing products:

```
Rank  Product Name       Revenue    Sales
──────────────────────────────────────────
1     Coin Pack 500      $4,500     900
2     Starter Bundle     $3,200     640
3     No Ads             $2,800     280
4     VIP Pass           $2,100     140
5     Mega Pack          $1,800      36
```

### Product Metrics

| Metric | Description |
|--------|-------------|
| **Revenue** | Total revenue from this product |
| **Sales** | Number of transactions |
| **Avg Price** | Revenue / Sales |

### Optimization Insights

- **High sales, low revenue** - Consider price increase
- **Low sales, high revenue** - Marketing opportunity
- **Declining products** - May need refresh or removal

## Revenue Forecasting

Game Insights provides revenue predictions:

### 30-Day Forecast

Based on historical trends, AI predicts future revenue:

```
Current monthly: $28,500
Predicted next 30 days: $31,200 (+9.5%)
Confidence interval: $28,000 - $34,400
```

### Factors Considered

- Historical revenue trends
- Seasonal patterns
- Recent growth rate
- Promotional calendar

## Whale Watch

A special section highlights your highest-value players:

```
You have 42 whale users ($100+ spent).
They contribute approximately 35% of total revenue.
```

### Whale Analytics

| Metric | Description |
|--------|-------------|
| **Whale Count** | Users spending $100+ lifetime |
| **Revenue Share** | Percentage of total revenue from whales |
| **Avg Whale Spend** | Average whale lifetime value |

### Whale Retention

Losing whales significantly impacts revenue. Monitor:

- Last active date
- Purchase frequency trend
- Engagement metrics

## Game-Specific Views

Revenue data is tailored to each game type:

### Puzzle Games

```tsx
// Revenue sources
{
  daily: [1200, 1450, 1100, 1800, ...],
  arpu: 0.45,
  arppu: 8.50,
  topProducts: ['Coin Pack', 'Starter Bundle', 'No Ads']
}
```

### Gacha RPG

```tsx
// Revenue sources
{
  daily: [8500, 12000, 9800, 45000, ...], // Spiky due to banners
  arpu: 2.80,
  arppu: 45.00,
  topProducts: ['Crystal Pack', 'Limited Banner', 'Monthly Pass']
}
```

### Battle Royale

```tsx
// Revenue sources
{
  daily: [5200, 5800, 4900, 6500, ...],
  arpu: 0.85,
  arppu: 15.00,
  topProducts: ['Battle Pass', 'Skin Bundle', 'Season Pass']
}
```

## Date Range Selection

Select different time periods for analysis:

| Period | Use Case |
|--------|----------|
| **Last 7 days** | Recent performance |
| **Last 14 days** | Default view |
| **Last 30 days** | Monthly comparison |
| **Custom range** | Specific event analysis |

## Metrics Formulas

### ARPU Calculation

```
ARPU = Total Revenue / Total DAU

Example:
Revenue = $28,500
DAU = 63,333
ARPU = $28,500 / 63,333 = $0.45
```

### ARPPU Calculation

```
ARPPU = Total Revenue / Paying Users

Example:
Revenue = $28,500
Paying Users = 3,353
ARPPU = $28,500 / 3,353 = $8.50
```

### Conversion Rate

```
Conversion = Paying Users / Total Users * 100

Example:
Paying Users = 3,353
Total Users = 63,333
Conversion = 3,353 / 63,333 * 100 = 5.3%
```

## Best Practices

### Revenue Optimization

1. **Price testing** - A/B test different price points
2. **Bundle strategy** - Create value bundles
3. **Limited offers** - Time-sensitive promotions
4. **Progression gates** - Strategic monetization points

### Spender Analysis

1. **First purchase optimization** - Reduce friction to first buy
2. **Tier upgrades** - Incentivize larger purchases
3. **Whale care** - VIP programs for high spenders
4. **Lapsed spender reactivation** - Win back dormant payers

### Product Strategy

1. **Portfolio diversity** - Multiple price points
2. **Consumable balance** - Regular repurchase items
3. **Premium positioning** - High-value exclusive items
4. **Starter bundles** - Easy first purchase options

## Integration with Other Features

Monetization connects with:

- **[Funnels](/docs/features/funnels)** - Purchase conversion funnels
- **[A/B Testing](/docs/features/ab-testing)** - Test pricing strategies
- **[Predictions](/docs/ai-analytics/predictions)** - Revenue forecasting
- **[Alerts](/docs/features/alerts)** - Revenue anomaly detection

## Example: Gacha Banner Analysis

```tsx
// Banner revenue comparison
const bannerRevenue = {
  'Luna Banner':       $45,000,  // Standard character
  'Kai Banner':        $32,000,  // Unpopular character
  'Nova Banner':       $28,000,  // Re-run
  'Limited Collab':    $78,000,  // Special event
};

// Insights:
// - Limited events drive 2.4x revenue
// - Character popularity matters
// - Re-runs underperform
// - Optimal banner frequency: 3 weeks
```

## Related Documentation

- [Funnel Analysis](/docs/features/funnels) - Purchase funnels
- [A/B Testing](/docs/features/ab-testing) - Price testing
- [Predictions](/docs/ai-analytics/predictions) - Revenue forecasts
- [Alerts](/docs/features/alerts) - Revenue alerts
