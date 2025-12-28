---
sidebar_position: 7
title: Analyze Monetization
description: Understand your revenue, find opportunities, and grow your game's earnings
---

# Analyze Monetization

Understand where your revenue comes from, identify your best spenders, and find opportunities to grow. No spreadsheets required.

**Time:** 15 minutes

## What You'll Achieve

- See your complete revenue picture
- Identify your highest-value players
- Find conversion opportunities
- Build a monetization dashboard

## Before You Start

Your data should include purchase events with:
- User ID (who bought)
- Amount/price (how much)
- Product ID or name (what they bought)
- Timestamp (when)

---

## Step 1: Open Monetization Dashboard

1. Click **Monetization** in the left sidebar
2. The auto-generated dashboard loads

**What you'll see:** Key revenue metrics already calculated from your data

---

## Step 2: Review Key Metrics

The dashboard shows your core monetization KPIs:

### Top Row Metrics

| Metric | What It Means |
|--------|---------------|
| **Total Revenue** | Sum of all purchases in the selected period |
| **ARPU** | Average Revenue Per User (total ÷ all users) |
| **ARPPU** | Average Revenue Per Paying User (total ÷ payers only) |
| **Conversion Rate** | % of users who made at least one purchase |
| **Paying Users** | Count of unique purchasers |

### Quick Health Check

- **ARPU $0.05-0.50** = Typical for mobile games
- **Conversion 2-5%** = Healthy range
- **ARPPU $10-50** = Good spender value

> **Tip:** Click any metric card to see its trend over time.

---

## Step 3: Analyze Revenue Trends

1. Find the **Revenue Over Time** chart
2. Use the date picker to adjust the range
3. Toggle between **Daily**, **Weekly**, or **Monthly** views

**What to look for:**
- 📈 Upward trends = Growing revenue
- 📉 Downward trends = Investigate causes
- 🔄 Patterns = Weekly/monthly cycles are normal

---

## Step 4: Understand Your Spenders

1. Find the **Spender Distribution** chart
2. See how revenue breaks down by spender tier:

| Tier | Typical Spend | Your Revenue Share |
|------|---------------|--------------------|
| **Whales** | $500+/month | Often 30-50% |
| **Dolphins** | $50-500 | Usually 20-30% |
| **Minnows** | $5-50 | Around 15-25% |
| **Starters** | Under $5 | About 5-10% |

### Drill Into a Segment

1. Click on any segment in the chart
2. A filtered view opens showing just those users
3. See their:
   - Purchase frequency
   - Favorite products
   - Session patterns
   - Retention rates

---

## Step 5: Analyze Product Performance

1. Find the **Revenue by Product** chart
2. See which items generate the most revenue

### Product Table View

1. Click **View as Table** for detailed breakdown
2. Sort by any column (Revenue, Units Sold, ARPU)

**Key questions to answer:**
- Which products drive the most revenue?
- Which have the highest conversion rate?
- Are there underperforming products to improve or remove?

---

## Step 6: Find Conversion Opportunities

1. Click **Funnels** tab in the Monetization section
2. View the **Purchase Funnel**:

```
Session Start    → 100%
     ↓
Shop Opened      → 45%    (Opportunity: Get more users to shop)
     ↓
Product Viewed   → 27%    (Opportunity: Improve shop layout)
     ↓
Add to Cart      → 7%     (Opportunity: Better pricing/value)
     ↓
Purchase         → 2.6%   (Opportunity: Reduce checkout friction)
```

### Identify Drop-off Points

- **Low shop opens?** Add more shop entry points
- **Low product views?** Improve shop UI/UX
- **Low add-to-cart?** Review pricing and value proposition
- **Low purchase completion?** Check for payment issues

---

## Step 7: Set Up Revenue Alerts

1. Click **Alerts** in the sidebar
2. Click **+ New Alert**
3. Set up a revenue monitoring alert:
   - **Metric:** Daily Revenue
   - **Condition:** Drops more than 20%
   - **Notification:** Email or in-app

**Recommended alerts:**
- Daily revenue drops 20%+
- Conversion rate drops below 2%
- ARPU drops 15%+

---

## Step 8: Build Custom Dashboard (Optional)

Want a personalized monetization view?

1. Click **Dashboard Builder**
2. Click **+ New Dashboard**
3. Name it "My Revenue Dashboard"

### Add Widgets

1. Click **+ Add Widget**
2. Choose chart type:
   - **Line Chart** for trends
   - **Bar Chart** for comparisons
   - **Pie Chart** for distributions
   - **KPI Card** for single metrics

3. Select metric from dropdown
4. Configure filters if needed
5. Click **Add**

### Arrange Your Layout

1. Drag widgets to reposition
2. Resize by dragging corners
3. Click **Save** when done

---

## You're Done!

You now have a complete picture of your game's monetization. Check back regularly to track trends and spot opportunities.

---

## Key Insights to Look For

### Revenue Concentration

| Pattern | What It Means | Action |
|---------|---------------|--------|
| Top 1% = 50%+ revenue | Whale-dependent | Diversify with mid-tier offers |
| Even distribution | Healthy economy | Maintain current balance |
| Low whale revenue | Untapped potential | Add high-value items |

### Timing Patterns

- **Weekend spikes** = Time promotions for Sat/Sun
- **Payday bumps** = Consider monthly subscription offers
- **Event-driven** = Plan content around spending patterns

### Cohort Differences

Compare spending by:
- **Install date** - Are newer users spending more?
- **Country** - Regional pricing opportunities?
- **Platform** - iOS vs Android differences?

---

## Troubleshooting

### Revenue not showing

- Check that purchase events include price/amount
- Verify the revenue column was detected correctly
- Go to **Settings** → **Schema** to verify column mapping

### Metrics seem wrong

- Check date range selection
- Verify currency is consistent in your data
- Look for test purchases that might skew numbers

### Missing spender tiers

- System needs enough data to segment
- Ensure user_id is present on purchase events
- Check that purchase amounts are numeric

---

## Next Steps

- [Set Up Alerts](/docs/cookbook/setup-alerts) for revenue monitoring
- [Run an A/B Test](/docs/cookbook/run-ab-test) on pricing
- Explore [Monetization Features](/docs/features/monetization)
