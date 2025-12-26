# Mobile Game Analytics Datasets

Research findings from searching for real mobile game datasets to test the Game Insights platform.

## Summary by Game Type

| Game Type | Best Datasets | Key Metrics Available |
|-----------|---------------|----------------------|
| **Puzzle/Casual** | Cookie Cats A/B Testing | Retention (D1, D7), game rounds, A/B groups |
| **Battle Royale/FPS** | PUBG Match Deaths | Kills, deaths, survival time, weapon stats, positioning |
| **MOBA/Competitive** | League of Legends Diamond Ranked | Kills, gold, experience, team performance, win prediction |
| **RPG/MMO** | WoW Avatar History, Path of Exile | Level progression, session time, character class, guild data |
| **Idle/Clicker** | No direct datasets found | Use synthetic data |
| **Gacha/RPG** | No public pull rate datasets found | Use synthetic data or community data |
| **Hyper-casual** | No direct datasets found | Use synthetic data |

---

## 1. Puzzle/Casual Games

### Cookie Cats A/B Testing Dataset
- **Source**: https://www.kaggle.com/datasets/yufengsui/mobile-games-ab-testing
- **Format**: CSV (ZIP, ~490 KB)
- **Game Type**: Match-3 Puzzle (Cookie Cats by Tactile Entertainment)
- **Key Columns**:
  - `userid` - unique player identifier
  - `version` - A/B test group (gate_30 vs gate_40)
  - `sum_gamerounds` - total game rounds played
  - `retention_1` - 1-day retention (boolean)
  - `retention_7` - 7-day retention (boolean)
- **Sample Size**: ~90,000 players
- **Use Case**: A/B testing the impact of moving a forced gate from level 30 to level 40 on player retention
- **License**: Free access

---

## 2. Battle Royale/FPS Games

### PUBG Match Deaths and Statistics
- **Source**: https://www.kaggle.com/datasets/skihikingkevin/pubg-match-deaths
- **Format**: CSV (ZIP, ~4.4 GB total, 5 chunks of ~2GB each)
- **Game Type**: Battle Royale (PUBG)
- **Key Columns**:
  - Player stats: kills, damage dealt, distance walked
  - Positional data: X,Y coordinates (0-800,000 range)
  - Death events: killer, victim, location, timing
  - Match metadata: queue size, FPP/TPP mode, date
- **Sample Size**: 720,000+ matches, 65+ million death records
- **Use Case**: Kill tracking, survival time, weapon meta analysis
- **License**: CC0 Public Domain
- **Note**: Data biased toward lower-tier gameplay

---

## 3. MOBA/RPG Competitive Games

### League of Legends Diamond Ranked Games (10 min)
- **Source**: https://www.kaggle.com/datasets/bobbyscience/league-of-legends-diamond-ranked-games-10-min
- **Format**: CSV (ZIP, ~552 KB)
- **Game Type**: MOBA (League of Legends)
- **Key Columns**:
  - 38 features total (19 per team - Blue and Red)
  - `gameId` - unique match identifier
  - Team statistics: kills, deaths, gold, experience, level
  - `blueWins` - binary outcome (1 = Blue team won)
- **Sample Size**: ~10,000 ranked games (Diamond I to Master rank)
- **Use Case**: Early-game win prediction, team performance analysis
- **License**: CC0 Public Domain

### League of Legends Competitive Matches (2015-2018)
- **Source**: https://www.kaggle.com/datasets/chuckephron/leagueoflegends
- **Format**: CSV (ZIP, ~31.87 MB)
- **Game Type**: MOBA (League of Legends esports)
- **Coverage**: NALCS, EULCS, LCK, LMS, CBLoL, Worlds, MSI
- **Sample Size**: 4 years of competitive matches
- **License**: CC0 Public Domain

---

## 4. RPG/MMO Games

### World of Warcraft Avatar History
- **Source**: https://www.kaggle.com/datasets/mylesoneill/warcraft-avatar-history
- **Original Source**: http://mmnet.iis.sinica.edu.tw/dl/wowah/
- **Format**: CSV (ZIP, ~74.9 MB)
- **Game Type**: MMORPG (World of Warcraft)
- **Key Columns**:
  - Character level, race, class
  - Location (zone data)
  - Guild affiliation
  - Session patterns
- **Sample Size**: Horde faction data from single server (2008)
- **Use Case**: Player session behavior, leveling progression, churn prediction
- **License**: CC0 Public Domain

### Path of Exile League Statistics
- **Source**: https://www.kaggle.com/datasets/gagazet/path-of-exile-league-statistic
- **Original Source**: pathofstats.com API
- **Format**: CSV (ZIP, ~4.3 MB)
- **Game Type**: Action RPG (Path of Exile)
- **Key Columns**:
  - Player name, rank/ladder position
  - Character class, level
  - Completed challenges
  - Streaming status (Twitch)
  - Deaths (for Hardcore divisions)
- **Sample Size**: ~59,000 players
- **Divisions**: Harbinger, Hardcore, SSF, SSF HC
- **Use Case**: Ladder progression, class distribution, challenge completion
- **License**: Other (specified in description)

---

## 5. General Gaming Behavior Data

### Steam Video Games User Behavior
- **Source**: https://www.kaggle.com/datasets/tamber/steam-video-games
- **Format**: CSV (ZIP, ~1.5 MB)
- **Key Columns**:
  - `user-id` - unique user identifier
  - `game-title` - name of Steam game
  - `behavior-name` - 'purchase' or 'play'
  - `value` - 1 for purchase; hours played for play behavior
- **Sample Size**: ~200,000 user interactions, 6,000+ games
- **Use Case**: Play time analysis, purchase behavior, recommendation systems
- **License**: Open Database License (ODbL)

### Steam Store Games Dataset
- **Source**: https://www.kaggle.com/datasets/nikdavis/steam-store-games
- **Format**: CSV (ZIP, ~36.9 MB)
- **Key Columns**:
  - Game genres
  - Estimated number of owners (player count from SteamSpy)
  - Various Steam Store attributes
- **Sample Size**: ~27,000 games (prior to May 2019)
- **Use Case**: Game market analysis, owner/player estimation
- **License**: CC BY 4.0

---

## 6. Game Sales & Monetization Data

### Video Game Sales with Ratings
- **Source**: https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings
- **Format**: CSV (ZIP, ~488 KB)
- **Key Columns**:
  - Name, Platform, Year_of_Release, Genre, Publisher
  - NA_Sales, EU_Sales, JP_Sales, Other_Sales, Global_Sales (in millions)
  - Critic_Score, Critic_Count, User_Score, User_Count
  - Developer, ESRB Rating
- **Sample Size**: ~6,900 complete rows
- **Use Case**: Sales analysis, rating correlation, regional performance
- **License**: Unknown

### Video Game Sales 2024
- **Source**: https://www.kaggle.com/datasets/asaniczka/video-game-sales-2024
- **Format**: CSV (ZIP, ~1.99 MB)
- **Sample Size**: 64,000+ games
- **Use Case**: Updated sales data and market analysis
- **License**: ODC Attribution License

---

## 7. Streaming/Engagement Analytics

### Top Games on Twitch (2016-2023)
- **Source**: https://www.kaggle.com/datasets/rankirsh/evolution-of-top-games-on-twitch
- **Original Source**: sullygnome.com
- **Format**: CSV (ZIP, ~620 KB)
- **Files**:
  - `Twitch_game_data` - 200 games per month
  - `Twitch_global_data` - 1 observation per month
- **Sample Size**: Monthly data from 2016-present
- **Use Case**: Game popularity trends, viewership analysis
- **License**: CC0 Public Domain

---

## Recommendations for Missing Game Types

For **Idle/Clicker**, **Gacha/RPG**, and **Hyper-casual** games, no publicly available datasets with real player behavior and monetization data were found. Recommendations:

1. **Synthetic Data Generation**: Create realistic synthetic datasets based on known industry patterns (we created these in `tests/fixtures/datasets/`)
2. **Community Data**: Some gacha game communities (like Genshin Impact subreddits) have user-submitted pull data
3. **Academic Research**: Look for research papers that may have accompanying datasets
4. **Game Company APIs**: Some games like Clash Royale and Genshin Impact have APIs that could be used to collect data

---

## Our Test Fixtures

We created synthetic datasets for missing game types in `tests/fixtures/datasets/`:

| File | Game Type | Key Columns |
|------|-----------|-------------|
| `puzzle_game_events.json` | Puzzle/Match-3 | level, moves, boosters, lives, score |
| `idle_game_events.json` | Idle/Clicker | prestige, offline_minutes, upgrade_type |
| `battle_royale_events.json` | Battle Royale | kills, placement, damage, survival_time |
| `gacha_rpg_events.json` | Gacha RPG | banner, pull_type, rarity, pity_count, vip_level |
| `hypercasual_events.json` | Hyper-casual | ad_type, ad_network, ecpm, session_duration |
