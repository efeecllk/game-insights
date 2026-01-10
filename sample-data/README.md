# Sample Data Files

Comprehensive example datasets for testing Game Insights. Each file contains realistic analytics data for different game types.

## Comprehensive Analytics Files (Recommended)

| File | Game Type | Rows | Key Columns |
|------|-----------|------|-------------|
| `puzzle_game_analytics.csv` | Puzzle | 750 | user_id, level, moves, booster, score, iap_revenue, ad_revenue |
| `idle_clicker_analytics.csv` | Idle/Clicker | 700 | user_id, prestige, gold_earned, offline_minutes, upgrade_type |
| `battle_royale_analytics.csv` | Battle Royale | 800 | user_id, kills, placement, damage, survival_time, weapon |
| `gacha_rpg_analytics.csv` | Gacha RPG | 850 | user_id, banner, pull_type, rarity, pity_count, vip_level |
| `match3_meta_analytics.csv` | Match3 + Meta | 750 | user_id, level, story_chapter, decoration_category |

## Data Characteristics

Each comprehensive file includes:

- **75-90 unique users** with realistic behavior patterns
- **30-day date range** (Dec 11, 2024 - Jan 10, 2025)
- **Realistic retention curves** (D1: ~40-50%, D7: ~35-42%, D30: ~30-35%)
- **Spender segments**: Whales (2-5%), Dolphins (10-15%), Minnows (25-30%), F2P (55-60%)
- **Geographic distribution**: US, UK, JP, KR, BR, DE, FR, CA, AU, MX
- **Platform split**: ~55% iOS, ~45% Android
- **Revenue data**: IAP and ad revenue with realistic distribution

## Quick Start

1. Go to the **Upload** page
2. Drag and drop any `.csv` file, or click **"Try Example Data"** for auto-generated samples
3. Review the detected columns and game type
4. View insights on the **Analytics** dashboard

## Column Schemas

### puzzle_game_analytics.csv
```
user_id, session_id, timestamp, event_name, level, moves, booster, boosters_used,
lives, score, iap_revenue, ad_revenue, country, platform, device,
session_duration, days_since_install, version
```

### idle_clicker_analytics.csv
```
user_id, session_id, timestamp, event_name, prestige, gold_earned, gems_spent,
gems_earned, offline_minutes, upgrade_type, upgrade_level, iap_revenue, ad_revenue,
country, platform, device, session_duration, days_since_install, version
```

### battle_royale_analytics.csv
```
user_id, match_id, timestamp, event_name, kills, placement, damage, survival_time,
weapon, rank, iap_revenue, country, platform, device, session_duration,
days_since_install, version
```

### gacha_rpg_analytics.csv
```
user_id, session_id, timestamp, event_name, banner, pull_type, rarity, pity_count,
level, xp, vip_level, premium_currency, currency_spent, iap_revenue, country,
platform, device, session_duration, days_since_install, version
```

### match3_meta_analytics.csv
```
user_id, session_id, timestamp, event_name, level, moves, booster, boosters_used,
score, lives, story_chapter, decoration_category, item_id, coins_earned, coins_spent,
iap_revenue, ad_revenue, country, platform, device, session_duration,
days_since_install, version
```

## Legacy Small Files

These smaller files are kept for quick testing:

| File | Format | Rows |
|------|--------|------|
| `puzzle_game_events.csv` | CSV | 13 |
| `idle_clicker_events.csv` | CSV | 13 |
| `iap_transactions.csv` | CSV | 10 |
| `user_cohorts.csv` | CSV | 12 |
| `battle_royale_matches.json` | JSON | 10 |
| `gacha_rpg_pulls.json` | JSON | 8 |

## Testing Insights

With the comprehensive files, you should see:
- **Retention metrics**: D1, D7, D30 with realistic decay curves
- **Monetization**: ARPU, ARPPU, conversion rates, spender segmentation
- **Engagement**: DAU/MAU trends, session frequency, session length
- **Progression**: Level funnel, bottleneck detection, difficulty spikes
- **AI Insights**: Game-specific recommendations with revenue impact estimates
