---
sidebar_position: 7
title: Analyze Monetization
description: Tutorial for deep diving into monetization metrics and optimizing revenue
---

# Analyze Monetization

This tutorial shows you how to analyze monetization performance and identify optimization opportunities using Game Insights.

## What You'll Learn

- Set up monetization tracking
- Analyze key revenue metrics
- Build a revenue dashboard
- Identify optimization opportunities

## Prerequisites

- Game data with purchase/revenue events
- Basic understanding of mobile game monetization

## Step 1: Prepare Your Data

### Required Events

For comprehensive monetization analysis, track these events:

```typescript
// Purchase event
{
  event_type: 'purchase',
  user_id: 'user_123',
  timestamp: '2024-01-15T10:30:00Z',
  properties: {
    product_id: 'gems_100',
    product_name: '100 Gems',
    price_usd: 4.99,
    currency: 'USD',
    is_first_purchase: false,
    platform: 'ios'
  }
}

// IAP impression (for conversion analysis)
{
  event_type: 'iap_impression',
  user_id: 'user_123',
  timestamp: '2024-01-15T10:29:00Z',
  properties: {
    product_id: 'gems_100',
    placement: 'level_complete_popup'
  }
}

// Virtual currency spend
{
  event_type: 'currency_spend',
  user_id: 'user_123',
  timestamp: '2024-01-15T10:35:00Z',
  properties: {
    currency_type: 'gems',
    amount: 50,
    item_purchased: 'booster_speed',
    balance_after: 150
  }
}
```

### Upload Your Data

1. Navigate to **Upload Data**
2. Upload your monetization events CSV/JSON
3. Verify the schema detection recognizes revenue columns

Game Insights automatically detects:
- `price`, `revenue`, `amount` → revenue metrics
- `product_id`, `sku` → product identifiers
- `is_first_purchase` → conversion tracking

## Step 2: Review Key Metrics

### Navigate to Monetization Dashboard

Go to the **Overview** page and check the monetization KPIs:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Monetization Overview                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│ │ Revenue │  │ ARPU    │  │ ARPPU   │  │ Payers  │  │ Conv %  │           │
│ │ $12.5K  │  │ $0.42   │  │ $15.80  │  │ 792     │  │ 2.6%    │           │
│ │ +8.2%   │  │ +3.1%   │  │ -2.4%   │  │ +12.5%  │  │ +0.3pp  │           │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Metrics Explained

| Metric | Formula | Benchmark |
|--------|---------|-----------|
| **Revenue** | Sum of all purchases | Varies |
| **ARPU** | Revenue / DAU | $0.05-0.50 |
| **ARPPU** | Revenue / Paying Users | $10-50 |
| **Conversion** | Payers / Total Users | 2-5% |
| **LTV** | Predicted lifetime revenue | 3-10x ARPU |

## Step 3: Build Revenue Dashboard

### Create Custom Dashboard

1. Go to **Dashboard Builder**
2. Click **+ New Dashboard**
3. Name it "Revenue Deep Dive"

### Add Essential Widgets

#### Widget 1: Revenue Trend

```typescript
{
  type: 'line_chart',
  config: {
    title: 'Daily Revenue',
    metric: 'daily_revenue',
    dateRange: 'last_30_days',
    showTrend: true,
    comparison: 'previous_period'
  }
}
```

#### Widget 2: Revenue by Product

```typescript
{
  type: 'bar_chart',
  config: {
    title: 'Revenue by Product',
    metric: 'revenue',
    groupBy: 'product_id',
    sort: 'descending',
    limit: 10
  }
}
```

#### Widget 3: Spender Distribution

```typescript
{
  type: 'pie_chart',
  config: {
    title: 'Revenue by Spender Tier',
    metric: 'revenue',
    groupBy: 'spender_tier',
    segments: [
      { name: 'Whale', range: [500, Infinity] },
      { name: 'Dolphin', range: [50, 500] },
      { name: 'Minnow', range: [1, 50] }
    ]
  }
}
```

#### Widget 4: Conversion Funnel

```typescript
{
  type: 'funnel',
  config: {
    title: 'Purchase Funnel',
    steps: [
      { event: 'session_start', name: 'Session' },
      { event: 'shop_viewed', name: 'Shop View' },
      { event: 'product_viewed', name: 'Product View' },
      { event: 'checkout_started', name: 'Checkout' },
      { event: 'purchase', name: 'Purchase' }
    ]
  }
}
```

### Arrange Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Revenue Deep Dive                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────┐  ┌─────────────────────────────┐   │
│ │                                     │  │                             │   │
│ │     Daily Revenue Trend             │  │   Revenue by Product        │   │
│ │     (Line Chart)                    │  │   (Bar Chart)               │   │
│ │                                     │  │                             │   │
│ └─────────────────────────────────────┘  └─────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────┐  ┌─────────────────────────────┐   │
│ │                                     │  │                             │   │
│ │     Spender Distribution            │  │   Purchase Funnel           │   │
│ │     (Pie Chart)                     │  │   (Funnel Chart)            │   │
│ │                                     │  │                             │   │
│ └─────────────────────────────────────┘  └─────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Step 4: Analyze Spender Segments

### View Spender Tiers

Game Insights automatically segments users:

| Tier | Monthly Spend | Typical % | Contribution |
|------|---------------|-----------|--------------|
| Whale | $500+ | 0.1-0.5% | 30-50% |
| Dolphin | $50-500 | 1-3% | 20-30% |
| Minnow | $5-50 | 5-10% | 15-25% |
| Starter | $0.01-5 | 5-10% | 5-10% |
| F2P | $0 | 80-90% | 0% |

### Drill Down on Whales

```typescript
// Filter to whale segment
const whaleAnalysis = analyzeSegment({
  segment: 'whale',
  metrics: [
    'total_spend',
    'purchase_frequency',
    'avg_transaction',
    'favorite_products',
    'session_frequency',
    'retention_rate'
  ]
});
```

**Key questions to answer:**
- What products do whales buy most?
- What triggers whale spending?
- How long until users become whales?
- What's the whale churn rate?

## Step 5: Analyze Product Performance

### Product Metrics Table

Create a table widget showing:

| Product | Revenue | Units | ARPU | Conversion |
|---------|---------|-------|------|------------|
| Battle Pass | $4,200 | 280 | $0.14 | 0.9% |
| Gems 100 | $2,495 | 499 | $0.08 | 1.6% |
| Starter Pack | $1,990 | 199 | $0.07 | 0.6% |
| Gems 500 | $1,750 | 70 | $0.06 | 0.2% |
| No Ads | $1,200 | 120 | $0.04 | 0.4% |

### Identify Opportunities

Look for:

1. **High conversion, low revenue** → Increase price or upsell
2. **Low conversion, high potential** → Improve visibility or positioning
3. **High ARPU** → These products drive value, protect them
4. **Declining products** → May need refresh or replacement

## Step 6: Analyze Purchase Timing

### When Do Users Buy?

```typescript
// Analyze purchase timing
const purchaseTimingAnalysis = {
  byDaySinceInstall: analyzeByDay('purchase', 'days_since_install'),
  bySessionNumber: analyzeBySession('purchase'),
  byDayOfWeek: analyzeByDayOfWeek('purchase'),
  byHourOfDay: analyzeByHour('purchase')
};
```

### Key Patterns

**Day Since Install:**
```
Day 0: 40% of first purchases
Day 1: 20% of first purchases
Day 2-7: 25% of first purchases
Day 8+: 15% of first purchases
```

**Insight:** Most first purchases happen on Day 0. Optimize the first session experience.

**Day of Week:**
```
Weekend revenue is typically 20-40% higher than weekdays
```

**Insight:** Time promotions for Saturday/Sunday.

## Step 7: Build Purchase Funnel

### Full Conversion Funnel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Purchase Funnel                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Session Start      ████████████████████████████████████████  100% (30,000) │
│        │                                                                    │
│        ▼ 45%                                                                │
│ Shop Opened        ██████████████████                       45% (13,500)   │
│        │                                                                    │
│        ▼ 60%                                                                │
│ Product Viewed     ███████████                              27% (8,100)    │
│        │                                                                    │
│        ▼ 25%                                                                │
│ Add to Cart        ███                                      6.8% (2,025)   │
│        │                                                                    │
│        ▼ 70%                                                                │
│ Checkout Started   ██                                       4.7% (1,418)   │
│        │                                                                    │
│        ▼ 56%                                                                │
│ Purchase Complete  █                                        2.6% (792)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Identify Drop-off Points

| Step | Drop-off | Opportunity |
|------|----------|-------------|
| Session → Shop | 55% | Add shop prompts |
| Shop → View | 40% | Improve shop UI |
| View → Cart | 75% | Better pricing/value |
| Cart → Checkout | 30% | Reduce friction |
| Checkout → Purchase | 44% | Payment issues |

## Step 8: Set Up Revenue Alerts

### Create Monitoring Rules

```typescript
// Alert for revenue drop
const revenueAlert = {
  name: 'Daily Revenue Drop',
  type: 'threshold',
  metric: 'daily_revenue',
  condition: 'change_lt',
  threshold: -20,  // Alert if drops 20%
  severity: 'high',
  channels: ['email', 'slack']
};

// Alert for conversion drop
const conversionAlert = {
  name: 'Conversion Rate Drop',
  type: 'threshold',
  metric: 'purchase_conversion',
  condition: 'less_than',
  threshold: 0.02,  // Alert if below 2%
  severity: 'medium'
};
```

## Step 9: Generate Insights

### AI Recommendations

Game Insights generates monetization insights:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AI Insights                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🔴 HIGH PRIORITY                                                            │
│ "Cart abandonment rate increased 15% this week. Checkout flow may have     │
│ issues. Review recent changes and payment success rates."                   │
│                                                                             │
│ 🟡 OPPORTUNITY                                                              │
│ "Users who reach level 10 have 3x higher conversion rate. Consider         │
│ targeting level 10 completion with a special offer."                        │
│                                                                             │
│ 🟢 POSITIVE TREND                                                           │
│ "Starter Pack is outperforming by 25%. Consider similar bundles for        │
│ other player segments."                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Optimization Strategies

### 1. First Purchase Optimization
- Offer starter pack within first session
- Time-limited new player offer
- Low-friction entry point ($0.99-1.99)

### 2. ARPU Growth
- Introduce higher value packs
- Bundle products for better value
- Implement VIP/subscription tiers

### 3. Conversion Rate
- A/B test pricing
- Optimize shop placement
- Reduce checkout friction

### 4. Whale Development
- Early whale identification
- VIP treatment and support
- Exclusive high-value offers

## Next Steps

- [Run A/B Test](/docs/cookbook/run-ab-test) on pricing
- [Set Up Alerts](/docs/cookbook/setup-alerts) for revenue
- Explore [Monetization Features](/docs/features/monetization)

## Related

- [Monetization Analytics](/docs/features/monetization)
- [LTV Prediction](/docs/ai-analytics/predictions/ltv)
- [Funnel Analysis](/docs/features/funnels)
