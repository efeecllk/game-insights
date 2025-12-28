---
sidebar_position: 6
title: Gacha RPG Patterns
description: Analytics for gacha, hero collector, and character collection games
---

# Gacha RPG Patterns

Does your game have character pulls, banners, and rarity-based collection? This guide shows what analytics Game Insights generates when it recognizes gacha mechanics in your data.

**Also works for:** Hero collectors, card collectors, turn-based RPGs with summons, any game with randomized character acquisition.

## What Triggers This Pattern

Game Insights recognizes gacha patterns when your data contains:
- Pull/summon events with rarity
- Banner or rate-up tracking
- Pity counter or guarantee systems
- Character/unit collection metrics
- Multiple premium currencies

**Examples:** Genshin Impact, AFK Arena, Raid Shadow Legends, Summoners War, Epic Seven

## Key Metrics

### Pull Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Pull Rate** | Pulls per DAU | 3-5/day |
| **Premium Pull Rate** | Paid pulls per payer | 20-30/month |
| **Pity Utilization** | % reaching pity | &lt;40% |
| **Banner ARPU** | Revenue per banner | Varies |

### Spender Analysis

| Tier | Monthly Spend | Typical % | Focus |
|------|---------------|-----------|-------|
| **Whale** | $500+ | 0.5-1% | VIP treatment |
| **Dolphin** | $50-500 | 2-5% | Value optimization |
| **Minnow** | $5-50 | 10-15% | First purchase |
| **F2P** | $0 | 80-85% | Engagement, conversion |

### Revenue Distribution

Track where revenue comes from:

- **Banner pulls** - Usually 60-70%
- **Stamina/energy** - 10-15%
- **Bundles** - 15-20%
- **Battle passes** - 5-10%

## Recommended KPIs

Game Insights automatically tracks:

- Pull conversion rate
- Banner performance comparison
- Spender tier distribution
- Currency economy health
- Limited event performance

## Funnel Templates

### First Banner Pull Funnel
```
Tutorial Complete → Shop Visit → Currency View →
Banner View → Pull Animation → Character Obtained
```

### Spender Journey Funnel
```
F2P Player → Shop Browse → First Purchase →
Second Purchase → Monthly Spender → Whale
```

### Event Participation Funnel
```
Event Start → Event Entry → First Clear →
Event Shop → Event Complete → Ranking
```

## Dashboard Recommendations

### Overview Dashboard
- Total revenue with trend
- Active banner performance
- Spender tier breakdown
- Pull rate metrics

### Banner Analysis Dashboard
- Per-banner revenue
- Pull distribution
- Pity rate tracking
- Character acquisition rates

### Whale Watch Dashboard
- Top spender activity
- Whale retention
- Spend velocity
- VIP engagement

## Common Insights

Game Insights generates gacha-specific recommendations:

### Banner Performance
> "Current banner underperforming by 30% vs previous. Consider adjusting rate-up character or banner duration."

### Pity System Health
> "45% of payers hitting pity on recent banner. Rate may be too low or pity threshold too high."

### Whale Behavior
> "3 whales reduced spending 50%+ this month. Consider personalized re-engagement."

### Currency Economy
> "Free currency accumulation rate may be too high. Monitor pull rates and conversion."

## Analytics Tips

### Track Banner ROI
Compare investment in each banner:
- Development cost
- Marketing spend
- Revenue generated
- Player sentiment

### Monitor Pity System
Healthy pity metrics:
- 30-40% reach soft pity
- &lt;20% reach hard pity
- Average pulls between SSR: 40-60

### Analyze Limited Events
Event success metrics:
- Participation rate (target: 70%+)
- Completion rate
- Event shop purchase rate
- Revenue attribution

### Segment by Spending
Different strategies per tier:
- **Whales**: Exclusive content, early access
- **Dolphins**: Value packs, milestone rewards
- **Minnows**: Starter packs, first-purchase bonus
- **F2P**: Engagement mechanics, social features

## Best Practices

1. **Balance generosity** - Too generous = low revenue, too stingy = churn
2. **Track currency flows** - Monitor earn vs spend rates
3. **A/B test banners** - Test character combos, timing, pricing
4. **Watch competitor events** - Time events strategically
5. **Monitor player sentiment** - Rate discussions often predict churn

## Sample Data Schema

For optimal detection, include these columns:

```csv
user_id,timestamp,event_type,banner_id,pull_type,character_id,
rarity,currency_type,currency_amount,is_pity
```

## Related

- [Monetization Analytics](/docs/features/monetization)
- [Spender Tier Analysis](/docs/ai-analytics/predictions/ltv)
- [A/B Testing](/docs/features/ab-testing)
