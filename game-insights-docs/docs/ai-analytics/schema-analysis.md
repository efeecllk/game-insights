# Schema Analysis

The Schema Analyzer automatically detects the semantic meaning of columns in your data. This enables Game Insights to understand what your data represents and provide relevant analysis.

## How Column Detection Works

### Detection Pipeline

```
Column Name --> Pattern Matching --> Value Inference --> Semantic Type
                     |                    |
                     v                    v
              "revenue" --> revenue   numeric + decimals --> price
```

### 1. Pattern Matching (Primary)

Column names are matched against known regex patterns. This provides the highest confidence detection.

```typescript
// Examples of pattern matching
'user_id'      --> user_id (0.85 confidence)
'player_level' --> level (0.85 confidence)
'total_revenue'--> revenue (0.85 confidence)
'event_time'   --> timestamp (0.85 confidence)
```

### 2. Value Inference (Fallback)

When no pattern matches, the analyzer infers type from data characteristics:

```typescript
// Type-based inference
{ type: 'date' } --> timestamp (0.70 confidence)

// Value-based inference
['US', 'GB', 'JP'] --> country (0.60 confidence)  // 2-char strings
[9.99, 4.99, 1.99] --> price (0.50 confidence)    // decimals + short name
```

---

## Complete Semantic Types Reference

### User & Session Identification

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `user_id` | user_id, player_id, uid, userId | Unique user identifier |
| `session_id` | session_id, sid, match_id | Session identifier |
| `event_name` | event_name, event_type, action | Event/action name |
| `timestamp` | timestamp, date, time, created_at, ts | Date/time field |

**Pattern Details:**
```typescript
user_id: [/user.*id/i, /player.*id/i, /uid/i, /^id$/i, /^userId$/i]
session_id: [/session.*id/i, /^sid$/i, /match.*id/i]
event_name: [/event.*name/i, /event.*type/i, /action/i, /^eventName$/i]
timestamp: [/timestamp/i, /^date$/i, /^time$/i, /created.*at/i, /^ts$/i, /eventTime/i, /install.*date/i]
```

### Monetization

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `revenue` | revenue, income, earnings | Total revenue value |
| `currency` | currency, gold, gems, coins | In-game currency |
| `price` | price, amount, cost, price_usd | Purchase price |
| `quantity` | quantity, count, qty | Item quantity |
| `iap_revenue` | iap_revenue, purchase_revenue | In-app purchase revenue |
| `purchase_amount` | purchase_amount, transaction_amount, spend | Purchase value |
| `product_id` | product_id, bundle_id, pack_id, sku | Product identifier |
| `offer_id` | offer_id, promo_id, deal_id | Promotional offer ID |
| `offer_shown` | offer_shown, promo_shown | Offer display flag |

### Progression

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `level` | level, lvl, player_level | Player/game level |
| `score` | score, points | Score value |
| `xp` | xp, experience, exp | Experience points |
| `rank` | rank, tier, league | Player ranking |

### Demographics

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `country` | country, region, geo | Geographic location |
| `platform` | platform, os, device_type | Platform/OS |
| `device` | device, model | Device information |
| `version` | version, ver, app_version | App version |

### Retention & Cohort

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `retention_day` | retention, d1, d7, retention_d7 | Retention percentage |
| `cohort` | cohort | User cohort identifier |
| `segment` | segment, group, bucket | User segment |

### KPI Metrics

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `dau` | dau, daily_active | Daily active users |
| `mau` | mau, monthly_active | Monthly active users |
| `arpu` | arpu, revenue_per_user | Average revenue per user |
| `ltv` | ltv, lifetime_value | Lifetime value |

### Items & Categories

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `item_id` | item_id, product_id, sku, transaction_id | Item identifier |
| `item_name` | item_name, product_name | Item name |
| `category` | category, type, mode, upgradeType | Category/type field |

### Funnel & Conversion

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `funnel_step` | step, stage, funnel | Funnel step number |
| `conversion` | conversion, converted | Conversion flag |

### Error Tracking

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `error_type` | error_type, error_code | Error classification |
| `error_message` | error_message, error_msg, exception | Error details |

### Puzzle/Match3 Specific

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `moves` | moves, attempts, moves_left | Move count |
| `booster` | booster, powerup, helper, boosters_used | Booster usage |
| `lives` | lives, hearts, energy | Life/energy count |

### Idle Game Specific

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `prestige` | prestige, rebirth, ascend | Prestige level |
| `offline_reward` | offline, idle, away, offlineMinutes | Offline earnings |
| `upgrade` | upgrade, enhance, improve | Upgrade level |

### Gacha/RPG Specific

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `rarity` | rarity, ssr, sr, legendary, epic | Rarity tier |
| `banner` | banner, summon, bannerName | Gacha banner |
| `pull_type` | pull, gacha, pullType | Pull type (single/multi) |
| `pity_count` | pity, pity_count, guaranteed | Pity counter |

### Battle Royale Specific

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `kills` | kills, eliminations, frags | Kill count |
| `placement` | placement, position, standing | Match placement |
| `damage` | damage, dmg | Damage dealt |
| `survival_time` | survival, alive, survivalTime | Time survived |

### Ad Monetization

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `ad_impression` | ad_impression, impression_count, ads_shown | Ad views |
| `ad_revenue` | ad_revenue, ad_earnings, ad_revenue_usd | Ad revenue |
| `ad_network` | ad_network, network_name, admob, unity_ads | Ad network |
| `ad_type` | ad_type, ad_format, interstitial, rewarded | Ad format |
| `ecpm` | ecpm, cpm, ad_ecpm | eCPM value |
| `ad_watched` | ad_watched, watched_full, ad_completed | Ad completion |

### Engagement Metrics

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `session_duration` | session_duration, session_length, time_spent | Session time |
| `session_count` | session_count, session_number | Session number |
| `rounds_played` | rounds_played, games_played, matches_played | Games played |
| `days_since_install` | days_since_install, install_day, player_age | Account age |

### Premium Features

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `vip_level` | vip_level, vip_tier, premium_level | VIP tier |
| `battle_pass_level` | battle_pass, pass_level, season_pass | Battle pass level |
| `premium_currency` | premium_currency, premium_gems, paid_currency | Premium currency |

### Hyper-Casual Specific

| Type | Pattern Examples | Description |
|------|------------------|-------------|
| `high_score` | high_score, best_score, top_score | Best score |
| `is_organic` | is_organic, organic_user, acquisition_type | Organic flag |
| `acquisition_source` | acquisition_source, utm_source, install_source, campaign | Install source |

---

## Suggested Metrics

Based on detected columns, the analyzer suggests relevant metrics to calculate:

```typescript
const metrics = schemaAnalyzer.getSuggestedMetrics(columnMeanings);
```

### Metric Suggestions by Column Type

| Detected Types | Suggested Metrics |
|----------------|-------------------|
| `revenue`, `iap_revenue` | Total Revenue, ARPU, ARPPU, Daily Revenue |
| `user_id` | DAU, MAU, New Users |
| `session_id` | Sessions, Avg Session Length |
| `retention_day` | Day 1 Retention, Day 7 Retention |
| `level` | Level Distribution, Progression Speed |
| `funnel_step` | Funnel Conversion, Drop-off Rate |
| `error_type` | Error Rate, Crash-Free Users |
| `ad_impression`, `ad_revenue` | Ad Revenue, eCPM by Network, Ads per Session |
| `purchase_amount` | Conversion Rate, Paying Users %, Avg Purchase Value |
| `session_duration` | Avg Session Duration, Sessions per User |
| `kills`, `placement` | K/D Ratio, Win Rate, Avg Placement |
| `acquisition_source` | Organic vs Paid, Source ROAS, CAC by Channel |

---

## Manual Column Mapping Override

If automatic detection is incorrect, you can manually specify column meanings:

```typescript
import { schemaAnalyzer } from '@/ai';

// Get automatic detection
const autoMeanings = schemaAnalyzer.analyze(schema);

// Override specific columns
const overriddenMeanings = autoMeanings.map(m => {
  if (m.column === 'my_custom_id') {
    return { ...m, semanticType: 'user_id', confidence: 1.0 };
  }
  if (m.column === 'custom_score') {
    return { ...m, semanticType: 'revenue', confidence: 1.0 };
  }
  return m;
});

// Use overridden meanings in pipeline
const result = await dataPipeline.run(data, {
  columnMeanings: overriddenMeanings,  // Pass custom mappings
});
```

### UI Override (Coming Soon)

The dashboard will provide a visual interface to:

1. View detected column types
2. Correct misidentified columns
3. Save custom mappings per data source
4. Apply mappings automatically on future uploads

---

## Confidence Interpretation

| Confidence | Interpretation | Action |
|------------|----------------|--------|
| 0.85+ | Strong match (pattern) | Trust detection |
| 0.70-0.84 | Good match (type inference) | Likely correct |
| 0.50-0.69 | Weak match (value inference) | Verify manually |
| < 0.50 | Unknown | Manual mapping needed |

---

## Best Practices for Column Naming

To maximize automatic detection accuracy:

### Do Use

- Standard naming: `user_id`, `revenue`, `level`, `timestamp`
- Snake_case: `session_duration`, `days_since_install`
- Clear prefixes: `ad_revenue`, `iap_revenue`, `total_spend`

### Avoid

- Ambiguous names: `val`, `data`, `info`, `num`
- Encoded names: `c1`, `col_a`, `field_01`
- Mixed conventions: `UserID`, `user-id`, `userId` (pick one)

### Example Column Naming

```csv
# Good naming (high detection confidence)
user_id,timestamp,level,revenue,session_duration,country,platform

# Poor naming (low detection confidence)
uid,ts,lvl,amt,dur,loc,os

# Better alternatives for poor names
user_id,event_time,player_level,purchase_amount,session_length,country_code,device_platform
```

---

## Next Steps

- [Game Type Detection](./game-type-detection) - How game classification works
- [AI Pipeline](./ai-pipeline) - Complete pipeline documentation
- [Data Cleaning](./ai-pipeline#datacleaner) - Quality issue detection
