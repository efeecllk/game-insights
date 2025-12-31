# 01 - CSV Datasets for Testing

Real-world CSV datasets from Kaggle and other sources for testing Game Insights with complex, large-scale data.

---

## Dataset Summary Table

| Dataset | Size | Rows | Columns | Game Type | Complexity | Download |
|---------|------|------|---------|-----------|------------|----------|
| Cookie Cats A/B | 490 KB | 90K | 5 | Puzzle | Low | [Kaggle](https://www.kaggle.com/datasets/yufengsui/mobile-games-ab-testing) |
| Mobile Games A/B | 8 MB | 50K | 8 | Various | Medium | [Kaggle](https://www.kaggle.com/datasets/msjahid/game-analytics) |
| PUBG Match Deaths | 4.4 GB | 65M | 13 | Battle Royale | Very High | [Kaggle](https://www.kaggle.com/datasets/skihikingkevin/pubg-match-deaths) |
| LoL Diamond Ranked | 552 KB | 10K | 40 | MOBA | High | [Kaggle](https://www.kaggle.com/datasets/bobbyscience/league-of-legends-diamond-ranked-games-10-min) |
| WoW Avatar History | 74.9 MB | 1M+ | 8 | MMORPG | Medium | [Kaggle](https://www.kaggle.com/datasets/mylesoneill/warcraft-avatar-history) |
| Steam User Behavior | 1.5 MB | 200K | 4 | Various | Low | [Kaggle](https://www.kaggle.com/datasets/tamber/steam-video-games) |
| Steam Store Games | 36.9 MB | 27K | 18 | Various | Medium | [Kaggle](https://www.kaggle.com/datasets/nikdavis/steam-store-games) |
| Gaming Churn Prediction | 15 MB | 100K | 12 | Various | Medium | [Kaggle](https://www.kaggle.com/datasets/saurabhshahane/predict-churn-for-gaming-company) |
| Mobile Gaming Behavior | 2 MB | 40K | 15 | Mobile | Medium | [Kaggle](https://www.kaggle.com/datasets/ulrikthygepedersen/mobile-games-user-behavior) |
| Video Game Sales | 488 KB | 6.9K | 16 | All | Medium | [Kaggle](https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings) |
| Dota 2 Matches | 2.5 GB | 50K matches | 100+ | MOBA | Very High | [Kaggle](https://www.kaggle.com/datasets/devinanzelmo/dota-2-matches) |
| Path of Exile Stats | 4.3 MB | 59K | 10 | ARPG | Medium | [Kaggle](https://www.kaggle.com/datasets/gagazet/path-of-exile-league-statistic) |

---

## Phase 1: Small Datasets (< 10MB)

### 1.1 Cookie Cats A/B Testing Dataset
**Priority: HIGH - Start Here**

| Field | Value |
|-------|-------|
| URL | https://www.kaggle.com/datasets/yufengsui/mobile-games-ab-testing |
| Size | 490 KB |
| Rows | ~90,000 |
| Game Type | Match-3 Puzzle |
| License | Free |

**Schema:**
```csv
userid,version,sum_gamerounds,retention_1,retention_7
116,gate_30,3,false,false
337,gate_30,38,true,false
```

| Column | Type | Description |
|--------|------|-------------|
| userid | integer | Unique player identifier |
| version | string | A/B test group (gate_30 or gate_40) |
| sum_gamerounds | integer | Total game rounds played |
| retention_1 | boolean | Day 1 retention |
| retention_7 | boolean | Day 7 retention |

**Test Cases:**
- [ ] Schema detection identifies `userid` as `user_id` type
- [ ] Game type detector classifies as `puzzle`
- [ ] A/B test columns recognized (`version`)
- [ ] Retention metrics calculated correctly
- [ ] 90K rows load in < 2 seconds

**Expected AI Insights:**
- Gate 40 vs Gate 30 retention comparison
- Correlation between game rounds and retention
- Churn risk by variant

---

### 1.2 League of Legends Diamond Ranked Games
**Priority: HIGH - Complex Schema**

| Field | Value |
|-------|-------|
| URL | https://www.kaggle.com/datasets/bobbyscience/league-of-legends-diamond-ranked-games-10-min |
| Size | 552 KB |
| Rows | ~10,000 |
| Columns | 40 |
| Game Type | MOBA |
| License | CC0 |

**Schema (abbreviated):**
```csv
gameId,blueWins,blueWardsPlaced,blueWardsDestroyed,blueFirstBlood,blueKills,
blueDeaths,blueAssists,blueEliteMonsters,blueDragons,blueHeralds,
blueTowersDestroyed,blueTotalGold,blueAvgLevel,blueTotalExperience,
blueTotalMinionsKilled,blueTotalJungleMinionsKilled,blueGoldDiff,
blueExperienceDiff,blueCSPerMin,blueGoldPerMin,
redWardsPlaced,redWardsDestroyed,redFirstBlood,...
```

| Column Pattern | Count | Description |
|----------------|-------|-------------|
| gameId | 1 | Match identifier |
| blueWins | 1 | Outcome (1 = Blue wins) |
| blue* | 19 | Blue team stats |
| red* | 19 | Red team stats |

**Test Cases:**
- [ ] 40-column schema parsed correctly
- [ ] Game type detector classifies as `battle_royale` or competitive
- [ ] Team-based metrics recognized
- [ ] Gold/XP calculations work with prefixed columns
- [ ] Win prediction correlations generated

**Expected AI Insights:**
- Key metrics correlating with wins
- Early game advantage analysis
- Gold differential impact

---

### 1.3 Steam User Behavior Dataset
**Priority: MEDIUM**

| Field | Value |
|-------|-------|
| URL | https://www.kaggle.com/datasets/tamber/steam-video-games |
| Size | 1.5 MB |
| Rows | ~200,000 |
| Columns | 4 |
| License | ODbL |

**Schema:**
```csv
user-id,game-title,behavior-name,value
151603712,The Elder Scrolls V Skyrim,purchase,1.0
151603712,The Elder Scrolls V Skyrim,play,273.0
```

| Column | Type | Description |
|--------|------|-------------|
| user-id | integer | Steam user ID |
| game-title | string | Game name |
| behavior-name | enum | 'purchase' or 'play' |
| value | float | 1 for purchase, hours for play |

**Test Cases:**
- [ ] Hyphenated column names handled
- [ ] Behavior type enum recognized
- [ ] Play time aggregations work
- [ ] Cross-game analysis possible

---

## Phase 2: Medium Datasets (10MB - 100MB)

### 2.1 World of Warcraft Avatar History
**Priority: HIGH - Session Data**

| Field | Value |
|-------|-------|
| URL | https://www.kaggle.com/datasets/mylesoneill/warcraft-avatar-history |
| Size | 74.9 MB |
| Rows | 1M+ |
| Columns | 8 |
| Game Type | MMORPG |
| License | CC0 |

**Schema:**
```csv
char,level,race,charclass,zone,guild,timestamp
1234,60,Orc,Warrior,Orgrimmar,MyGuild,2008-01-15 14:30:00
```

| Column | Type | Description |
|--------|------|-------------|
| char | integer | Character ID |
| level | integer | Character level (1-60) |
| race | string | Character race |
| charclass | string | Character class |
| zone | string | Current location |
| guild | integer | Guild ID |
| timestamp | datetime | Observation time |

**Test Cases:**
- [ ] Timestamp parsing works correctly
- [ ] Session reconstruction from observations
- [ ] Level progression tracking
- [ ] Guild membership changes
- [ ] Zone heatmaps generated
- [ ] 1M rows load with chunking

**Expected AI Insights:**
- Leveling speed by class/race
- Popular zones by level
- Guild retention correlation
- Session duration patterns

---

### 2.2 Steam Store Games Dataset
**Priority: MEDIUM**

| Field | Value |
|-------|-------|
| URL | https://www.kaggle.com/datasets/nikdavis/steam-store-games |
| Size | 36.9 MB |
| Rows | ~27,000 |
| Columns | 18 |
| License | CC BY 4.0 |

**Key Columns:**
- appid, name, release_date
- english, developer, publisher
- platforms (windows, mac, linux)
- categories, genres, steamspy_tags
- achievements, positive_ratings, negative_ratings
- average_playtime, median_playtime
- owners (range string like "1,000,000-2,000,000")
- price

**Test Cases:**
- [ ] Owner range strings parsed correctly
- [ ] Multi-value columns (genres, tags) handled
- [ ] Platform boolean columns recognized
- [ ] Price/rating correlations calculated

---

## Phase 3: Large Datasets (100MB - 1GB)

### 3.1 Dota 2 Match Dataset
**Priority: HIGH - Complex Multi-Table**

| Field | Value |
|-------|-------|
| URL | https://www.kaggle.com/datasets/devinanzelmo/dota-2-matches |
| Size | 2.5 GB |
| Rows | 50K matches, millions of events |
| Tables | 8 separate CSVs |
| Game Type | MOBA |
| License | CC0 |

**Files:**
1. `match.csv` - Match metadata (50K rows)
2. `player_ratings.csv` - Player MMR data
3. `players.csv` - Player info per match
4. `hero_names.csv` - Hero mapping
5. `item_ids.csv` - Item mapping
6. `ability_ids.csv` - Ability mapping
7. `cluster_regions.csv` - Server regions
8. `patch_dates.csv` - Version history

**Schema (match.csv):**
```csv
match_id,start_time,duration,tower_status_radiant,tower_status_dire,
barracks_status_radiant,barracks_status_dire,first_blood_time,
game_mode,radiant_win,negative_votes,positive_votes,cluster
```

**Test Cases:**
- [ ] Multi-file dataset import
- [ ] Foreign key relationships detected
- [ ] Match duration analytics
- [ ] Hero win rate calculations
- [ ] Regional performance analysis
- [ ] DuckDB query performance > 100x JS

**Storage Strategy:**
```
1. Import match.csv to IndexedDB (50K rows)
2. Import players.csv to DuckDB (streaming)
3. Reference tables in memory
4. Query via DuckDB SQL
```

---

### 3.2 Gaming Company Churn Dataset
**Priority: MEDIUM**

| Field | Value |
|-------|-------|
| URL | https://www.kaggle.com/datasets/saurabhshahane/predict-churn-for-gaming-company |
| Size | ~15 MB |
| Rows | 100K |
| Columns | 12 |

**Schema:**
```csv
player_id,registration_date,last_login,total_sessions,total_playtime_hours,
avg_session_minutes,purchases_count,total_spent_usd,friend_count,
achievement_count,level,churned
```

**Test Cases:**
- [ ] Churn prediction model accuracy
- [ ] Feature importance ranking
- [ ] Retention curve generation
- [ ] LTV correlation analysis

---

## Phase 4: Very Large Datasets (1GB+)

### 4.1 PUBG Match Deaths Dataset
**Priority: HIGH - Stress Test**

| Field | Value |
|-------|-------|
| URL | https://www.kaggle.com/datasets/skihikingkevin/pubg-match-deaths |
| Size | 4.4 GB (5 chunks) |
| Rows | 65+ million |
| Columns | 13 |
| Game Type | Battle Royale |
| License | CC0 |

**Schema:**
```csv
killed_by,killer_name,killer_placement,killer_position_x,killer_position_y,
map,match_id,time,victim_name,victim_placement,victim_position_x,
victim_position_y,kill_method
```

| Column | Type | Description |
|--------|------|-------------|
| killed_by | string | Weapon/cause |
| killer_name | string | Player name |
| killer_placement | integer | Final rank |
| killer_position_x | float | X coordinate (0-800000) |
| killer_position_y | float | Y coordinate (0-800000) |
| map | string | Map name |
| match_id | string | Match identifier |
| time | integer | Seconds into match |
| victim_* | - | Same as killer fields |
| kill_method | string | Type of kill |

**Test Cases:**
- [ ] File chunking handles 4.4GB
- [ ] Streaming parser doesn't crash
- [ ] Coordinate heatmaps generated
- [ ] Weapon meta analysis works
- [ ] Time-to-death distributions
- [ ] DuckDB queries complete < 10 seconds

**Storage Strategy:**
```
1. Use File System Access API (Chrome)
2. Stream to DuckDB-WASM with OPFS
3. Sample 1M rows for dashboard preview
4. Full queries via DuckDB SQL
```

**Expected Performance:**
| Operation | Target Time |
|-----------|-------------|
| Initial load (1M sample) | < 30 seconds |
| Retention query | < 5 seconds |
| Heatmap generation | < 10 seconds |
| Full dataset query | < 30 seconds |

---

## Test Implementation Plan

### Week 1: Small Datasets
```bash
# Download datasets
mkdir -p data/csv-tests
cd data/csv-tests
kaggle datasets download yufengsui/mobile-games-ab-testing
kaggle datasets download bobbyscience/league-of-legends-diamond-ranked-games-10-min
unzip *.zip
```

**Test Script:**
```typescript
// tests/integration/csv-datasets.test.ts
import { describe, test, expect } from 'vitest';
import { importCSV } from '@/lib/importers/csvImporter';
import { SchemaAnalyzer } from '@/ai/SchemaAnalyzer';
import { GameTypeDetector } from '@/ai/GameTypeDetector';

describe('Cookie Cats Dataset', () => {
  test('imports 90K rows in < 2 seconds', async () => {
    const start = Date.now();
    const data = await importCSV('data/csv-tests/cookie_cats.csv');
    expect(Date.now() - start).toBeLessThan(2000);
    expect(data.length).toBeGreaterThan(80000);
  });

  test('schema analysis detects retention columns', async () => {
    const data = await importCSV('data/csv-tests/cookie_cats.csv');
    const analyzer = new SchemaAnalyzer();
    const schema = await analyzer.analyze(data);

    expect(schema.columns.find(c => c.name === 'retention_1')?.semanticType)
      .toBe('retention_day_1');
    expect(schema.columns.find(c => c.name === 'retention_7')?.semanticType)
      .toBe('retention_day_7');
  });

  test('game type detected as puzzle', async () => {
    const data = await importCSV('data/csv-tests/cookie_cats.csv');
    const detector = new GameTypeDetector();
    const result = await detector.detect(data);

    expect(result.gameType).toBe('puzzle');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

### Week 2: Medium Datasets
- WoW Avatar History (74.9 MB)
- Enable chunked storage
- Test session reconstruction

### Week 3: Large Datasets
- Dota 2 (2.5 GB)
- Enable DuckDB-WASM
- Test SQL query performance

### Week 4: Stress Testing
- PUBG Deaths (4.4 GB)
- Enable File System API
- Test streaming + sampling

---

## Validation Checklist

### Schema Detection
- [ ] `user_id` / `player_id` recognized
- [ ] `timestamp` / `date` parsed correctly
- [ ] Numeric columns typed properly
- [ ] Boolean columns (0/1, true/false) handled
- [ ] Enum columns detected

### Game Type Detection
- [ ] Puzzle: Cookie Cats
- [ ] MOBA: LoL, Dota 2
- [ ] Battle Royale: PUBG
- [ ] MMORPG: WoW
- [ ] Generic: Steam behavior

### Performance Benchmarks
| Dataset Size | Load Time | Query Time | Memory Peak |
|--------------|-----------|------------|-------------|
| < 1 MB | < 500ms | < 100ms | < 50 MB |
| 1-10 MB | < 2s | < 500ms | < 200 MB |
| 10-100 MB | < 10s | < 2s | < 500 MB |
| 100MB-1GB | < 60s | < 10s | < 1 GB |
| > 1 GB | < 5min | < 30s | < 2 GB |

---

## Download Scripts

### Kaggle CLI Setup
```bash
# Install kaggle CLI
pip install kaggle

# Configure API key (from kaggle.com/settings)
mkdir -p ~/.kaggle
echo '{"username":"YOUR_USERNAME","key":"YOUR_API_KEY"}' > ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json
```

### Batch Download Script
```bash
#!/bin/bash
# scripts/download-csv-datasets.sh

DEST_DIR="data/csv-tests"
mkdir -p $DEST_DIR
cd $DEST_DIR

# Small datasets
kaggle datasets download -d yufengsui/mobile-games-ab-testing
kaggle datasets download -d bobbyscience/league-of-legends-diamond-ranked-games-10-min
kaggle datasets download -d tamber/steam-video-games

# Medium datasets
kaggle datasets download -d mylesoneill/warcraft-avatar-history
kaggle datasets download -d nikdavis/steam-store-games
kaggle datasets download -d saurabhshahane/predict-churn-for-gaming-company

# Large datasets (warning: 4.4GB)
# kaggle datasets download -d skihikingkevin/pubg-match-deaths

# Unzip all
for f in *.zip; do unzip -o "$f" -d "${f%.zip}"; done

echo "Downloaded $(ls -1 | wc -l) datasets"
```

---

## Next Steps

1. Set up Kaggle API credentials
2. Download Phase 1 datasets
3. Run schema detection tests
4. Benchmark current importer
5. Implement chunked storage if needed

See [02-json-datasets.md](./02-json-datasets.md) for JSON/API data sources.
