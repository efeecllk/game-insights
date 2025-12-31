# 02 - JSON Datasets & Game APIs

Complex JSON datasets and real-time game APIs for testing Game Insights with nested, hierarchical data structures.

---

## JSON Data Sources Overview

| Source | Type | Complexity | Rate Limits | Auth Required |
|--------|------|------------|-------------|---------------|
| Steam Web API | REST API | Medium | 100K/day | API Key |
| Riot Games API | REST API | High | 20/sec, 100/2min | API Key |
| Fortnite-API.com | REST API | Medium | 3/sec | None |
| OpenDota API | REST API | Very High | 60/min | None |
| Our Test Fixtures | Local JSON | Low-High | N/A | None |
| Mockaroo | Generated | Configurable | 200/day free | Optional |

---

## Part 1: Game APIs

### 1.1 Steam Web API

**Base URL:** `https://api.steampowered.com`
**Documentation:** https://developer.valvesoftware.com/wiki/Steam_Web_API

**Get API Key:** https://steamcommunity.com/dev/apikey

**Useful Endpoints:**

#### Player Stats
```
GET /ISteamUserStats/GetUserStatsForGame/v2/
?key={API_KEY}
&steamid={STEAM_ID}
&appid={APP_ID}
```

**Response:**
```json
{
  "playerstats": {
    "steamID": "76561198012345678",
    "gameName": "Counter-Strike 2",
    "stats": [
      {"name": "total_kills", "value": 12345},
      {"name": "total_deaths", "value": 8765},
      {"name": "total_time_played", "value": 360000},
      {"name": "total_wins", "value": 543}
    ],
    "achievements": [
      {"name": "WIN_MATCH", "achieved": 1},
      {"name": "GET_100_KILLS", "achieved": 1}
    ]
  }
}
```

#### Game Schema (achievements/stats definition)
```
GET /ISteamUserStats/GetSchemaForGame/v2/
?key={API_KEY}
&appid={APP_ID}
```

**Test Cases:**
- [ ] Parse nested stats array
- [ ] Map achievement names to display names
- [ ] Calculate K/D ratio from stats
- [ ] Track achievement completion rate

---

### 1.2 Riot Games API (League of Legends)

**Base URL:** `https://{region}.api.riotgames.com`
**Documentation:** https://developer.riotgames.com/docs/lol

**Get API Key:** https://developer.riotgames.com

**Useful Endpoints:**

#### Match History
```
GET /lol/match/v5/matches/by-puuid/{puuid}/ids
?start=0
&count=20
```

#### Match Details
```
GET /lol/match/v5/matches/{matchId}
```

**Response (simplified):**
```json
{
  "metadata": {
    "matchId": "NA1_4567890123",
    "participants": ["puuid1", "puuid2", "..."]
  },
  "info": {
    "gameDuration": 1823,
    "gameMode": "CLASSIC",
    "participants": [
      {
        "puuid": "abc123...",
        "summonerName": "Player1",
        "championName": "Ahri",
        "teamId": 100,
        "win": true,
        "kills": 8,
        "deaths": 3,
        "assists": 12,
        "totalDamageDealt": 145000,
        "goldEarned": 14500,
        "item0": 3089,
        "item1": 3135,
        "perks": {
          "styles": [
            {
              "style": 8100,
              "selections": [{"perk": 8112}, {"perk": 8126}]
            }
          ]
        }
      }
    ],
    "teams": [
      {
        "teamId": 100,
        "win": true,
        "objectives": {
          "baron": {"kills": 1},
          "dragon": {"kills": 3},
          "tower": {"kills": 9}
        }
      }
    ]
  }
}
```

**Data Complexity:**
- 10 participants per match
- 50+ fields per participant
- Nested perks/items/objectives
- Team aggregations

**Test Cases:**
- [ ] Parse deeply nested JSON (4+ levels)
- [ ] Extract participant arrays
- [ ] Calculate team performance metrics
- [ ] Map item/champion IDs to names
- [ ] Handle missing fields gracefully

**Rate Limits:**
| Tier | Requests/Second | Requests/2 Minutes |
|------|-----------------|-------------------|
| Development | 20 | 100 |
| Production | Varies | Varies |

---

### 1.3 OpenDota API

**Base URL:** `https://api.opendota.com/api`
**Documentation:** https://docs.opendota.com

**No API Key Required (rate limited)**

**Useful Endpoints:**

#### Public Matches
```
GET /publicMatches
?min_rank=70  # Immortal rank
```

**Response:**
```json
[
  {
    "match_id": 7123456789,
    "match_seq_num": 6234567890,
    "radiant_win": true,
    "start_time": 1703865600,
    "duration": 2134,
    "avg_mmr": 7500,
    "num_mmr": 10,
    "lobby_type": 7,
    "game_mode": 22,
    "avg_rank_tier": 80,
    "radiant_team": "5,7,11,23,52",
    "dire_team": "1,18,31,45,86"
  }
]
```

#### Match Details
```
GET /matches/{match_id}
```

**Response (very complex):**
```json
{
  "match_id": 7123456789,
  "players": [
    {
      "account_id": 12345678,
      "player_slot": 0,
      "hero_id": 5,
      "kills": 12,
      "deaths": 4,
      "assists": 18,
      "gold_per_min": 650,
      "xp_per_min": 720,
      "last_hits": 280,
      "denies": 15,
      "purchase_log": [
        {"time": 0, "key": "tango"},
        {"time": 120, "key": "boots"}
      ],
      "kills_log": [
        {"time": 540, "key": "npc_dota_hero_cm"}
      ],
      "buyback_log": [],
      "runes_log": [
        {"time": 120, "key": 0}
      ],
      "lane_pos": {
        "92": {"128": 5, "129": 3}
      },
      "obs_log": [],
      "sen_log": []
    }
  ],
  "teamfights": [
    {
      "start": 600,
      "end": 620,
      "deaths": 3,
      "players": [...]
    }
  ]
}
```

**Test Cases:**
- [ ] Parse 500KB+ match JSON
- [ ] Process item purchase timelines
- [ ] Generate heatmaps from lane_pos
- [ ] Analyze teamfight participation
- [ ] Handle sparse arrays (buyback_log)

---

### 1.4 Fortnite-API.com

**Base URL:** `https://fortnite-api.com`
**Documentation:** https://fortnite-api.com/documentation

**No API Key Required**

**Useful Endpoints:**

#### Cosmetics List
```
GET /v2/cosmetics/br
```

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "id": "CID_001_Athena_Commando_F_Default",
      "name": "Recruit",
      "description": "Standard Issue.",
      "type": {
        "value": "outfit",
        "displayValue": "Outfit"
      },
      "rarity": {
        "value": "common",
        "displayValue": "Common"
      },
      "series": null,
      "set": null,
      "introduction": {
        "chapter": "1",
        "season": "1"
      },
      "images": {
        "smallIcon": "https://...",
        "icon": "https://...",
        "featured": null
      },
      "variants": [
        {
          "channel": "Material",
          "type": "Skin Tone",
          "options": [...]
        }
      ],
      "gameplayTags": ["Cosmetics.Source.ItemShop"],
      "showcaseVideo": null,
      "shopHistory": ["2019-01-15", "2019-03-22"]
    }
  ]
}
```

**Data Volume:**
- 2000+ cosmetics
- Complex nested variants
- Shop history arrays
- Multiple image URLs

**Test Cases:**
- [ ] Parse large cosmetics catalog
- [ ] Extract rarity distributions
- [ ] Analyze shop rotation patterns
- [ ] Handle null/missing nested fields

---

## Part 2: Local JSON Test Fixtures

### Existing Fixtures (tests/fixtures/datasets/)

| File | Game Type | Rows | Complexity |
|------|-----------|------|------------|
| gacha_rpg_events.json | Gacha RPG | 100 | High |
| battle_royale_events.json | Battle Royale | 100 | Medium |
| hypercasual_events.json | Hyper-casual | 100 | Low |
| puzzle_game_events.json | Puzzle | 100 | Low |
| idle_game_events.json | Idle | 100 | Medium |

### Gacha RPG Events Structure

```json
{
  "events": [
    {
      "event_id": "evt_001",
      "user_id": "user_12345",
      "timestamp": "2024-01-15T10:30:00Z",
      "event_type": "gacha_pull",
      "properties": {
        "banner_id": "limited_banner_001",
        "banner_name": "New Year Special",
        "pull_type": "single",
        "currency_type": "premium",
        "currency_spent": 160,
        "result": {
          "character_id": "char_ssr_001",
          "character_name": "Dragon Knight",
          "rarity": "SSR",
          "is_rate_up": true,
          "is_new": true
        },
        "pity_count": 75,
        "pity_type": "soft",
        "vip_level": 5,
        "total_pulls_lifetime": 342
      }
    }
  ]
}
```

**Nested Properties:**
- `properties.result.character_id`
- `properties.result.rarity`
- `properties.pity_count`

---

## Part 3: Synthetic Data Generation

### Mockaroo Templates

**URL:** https://www.mockaroo.com

#### Gacha Events Schema
```json
{
  "fields": [
    {"name": "event_id", "type": "UUID"},
    {"name": "user_id", "type": "UUID"},
    {"name": "timestamp", "type": "Datetime", "min": "2024-01-01", "max": "2024-12-31"},
    {"name": "event_type", "type": "Custom List", "values": ["gacha_pull", "purchase", "login", "level_up"]},
    {"name": "banner_id", "type": "Regular Expression", "format": "banner_[0-9]{3}"},
    {"name": "pull_type", "type": "Custom List", "values": ["single", "multi_10"]},
    {"name": "rarity", "type": "Custom List", "values": ["N", "R", "SR", "SSR", "UR"]},
    {"name": "pity_count", "type": "Number", "min": 0, "max": 90},
    {"name": "currency_spent", "type": "Number", "min": 0, "max": 16000}
  ]
}
```

#### Battle Royale Events Schema
```json
{
  "fields": [
    {"name": "match_id", "type": "UUID"},
    {"name": "user_id", "type": "UUID"},
    {"name": "timestamp", "type": "Datetime"},
    {"name": "kills", "type": "Number", "min": 0, "max": 30},
    {"name": "deaths", "type": "Number", "min": 0, "max": 1},
    {"name": "placement", "type": "Number", "min": 1, "max": 100},
    {"name": "damage_dealt", "type": "Number", "min": 0, "max": 3000},
    {"name": "survival_time_seconds", "type": "Number", "min": 30, "max": 1800},
    {"name": "weapon_used", "type": "Custom List", "values": ["AR", "SMG", "Shotgun", "Sniper", "Melee"]},
    {"name": "map", "type": "Custom List", "values": ["erangel", "miramar", "sanhok", "vikendi"]}
  ]
}
```

### Faker.js Generator Script

```typescript
// scripts/generate-test-data.ts
import { faker } from '@faker-js/faker';

interface GachaEvent {
  event_id: string;
  user_id: string;
  timestamp: string;
  event_type: string;
  properties: {
    banner_id: string;
    pull_type: 'single' | 'multi_10';
    rarity: 'N' | 'R' | 'SR' | 'SSR' | 'UR';
    pity_count: number;
    currency_spent: number;
    is_rate_up: boolean;
  };
}

const RARITY_WEIGHTS = {
  N: 0.40,
  R: 0.35,
  SR: 0.18,
  SSR: 0.06,
  UR: 0.01
};

function generateGachaEvent(userId: string, pityCount: number): GachaEvent {
  const pullType = faker.helpers.arrayElement(['single', 'multi_10']);
  const isSoftPity = pityCount >= 75;
  const isHardPity = pityCount >= 90;

  // Adjust rarity based on pity
  let rarity: keyof typeof RARITY_WEIGHTS;
  if (isHardPity) {
    rarity = 'SSR';
  } else if (isSoftPity) {
    rarity = faker.helpers.weightedArrayElement([
      { value: 'SSR', weight: 0.30 },
      { value: 'SR', weight: 0.40 },
      { value: 'R', weight: 0.20 },
      { value: 'N', weight: 0.10 }
    ]);
  } else {
    rarity = faker.helpers.weightedArrayElement(
      Object.entries(RARITY_WEIGHTS).map(([value, weight]) => ({ value, weight }))
    ) as keyof typeof RARITY_WEIGHTS;
  }

  return {
    event_id: faker.string.uuid(),
    user_id: userId,
    timestamp: faker.date.recent({ days: 30 }).toISOString(),
    event_type: 'gacha_pull',
    properties: {
      banner_id: faker.helpers.arrayElement(['banner_001', 'banner_002', 'limited_001']),
      pull_type: pullType,
      rarity,
      pity_count: rarity === 'SSR' ? 0 : pityCount + (pullType === 'multi_10' ? 10 : 1),
      currency_spent: pullType === 'multi_10' ? 1600 : 160,
      is_rate_up: rarity === 'SSR' && faker.datatype.boolean(0.5)
    }
  };
}

function generateDataset(userCount: number, eventsPerUser: number): GachaEvent[] {
  const events: GachaEvent[] = [];

  for (let u = 0; u < userCount; u++) {
    const userId = faker.string.uuid();
    let pityCount = 0;

    for (let e = 0; e < eventsPerUser; e++) {
      const event = generateGachaEvent(userId, pityCount);
      events.push(event);
      pityCount = event.properties.pity_count;
    }
  }

  return events.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// Generate datasets of different sizes
const SIZES = {
  small: { users: 100, events: 50 },      // 5K events
  medium: { users: 1000, events: 100 },   // 100K events
  large: { users: 10000, events: 200 },   // 2M events
  stress: { users: 50000, events: 500 }   // 25M events
};

export { generateDataset, SIZES };
```

---

## Part 4: JSON Import Implementation

### Current State
- Basic JSON import in `FileAdapter.ts`
- No streaming for large files
- No nested property flattening

### Improvements Needed

```typescript
// src/lib/importers/jsonImporter.ts

interface ImportOptions {
  flattenNested: boolean;
  maxDepth: number;
  arrayHandling: 'first' | 'join' | 'expand';
  streaming: boolean;
  chunkSize: number;
}

/**
 * Flatten nested JSON object
 * { a: { b: { c: 1 } } } => { 'a.b.c': 1 }
 */
function flattenObject(
  obj: Record<string, any>,
  prefix = '',
  maxDepth = 3,
  currentDepth = 0
): Record<string, any> {
  if (currentDepth >= maxDepth) return { [prefix]: JSON.stringify(obj) };

  return Object.keys(obj).reduce((acc, key) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey, maxDepth, currentDepth + 1));
    } else if (Array.isArray(value)) {
      // Handle arrays based on options
      acc[newKey] = value.length;
      acc[`${newKey}_first`] = value[0];
    } else {
      acc[newKey] = value;
    }

    return acc;
  }, {} as Record<string, any>);
}

/**
 * Stream-parse large JSON file with chunked processing
 */
async function importJSONStreaming(
  file: File,
  options: ImportOptions,
  onProgress: (progress: number) => void,
  onChunk: (rows: any[]) => Promise<void>
): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Handle both array and object with events/data key
  const rows = Array.isArray(data)
    ? data
    : data.events || data.data || Object.values(data)[0];

  if (!Array.isArray(rows)) {
    throw new Error('JSON must contain an array of events');
  }

  const totalRows = rows.length;
  const { chunkSize } = options;

  for (let i = 0; i < totalRows; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const flattened = options.flattenNested
      ? chunk.map(row => flattenObject(row, '', options.maxDepth))
      : chunk;

    await onChunk(flattened);
    onProgress(Math.round((i + chunk.length) / totalRows * 100));
  }
}
```

### Nested Property Detection

```typescript
// src/ai/SchemaAnalyzer.ts enhancement

function analyzeNestedProperties(sample: any[]): NestedPropertyMap {
  const propertyPaths = new Map<string, {
    depth: number;
    types: Set<string>;
    nullCount: number;
    examples: any[];
  }>();

  function traverse(obj: any, path: string[] = []) {
    if (obj === null || obj === undefined) {
      const pathStr = path.join('.');
      const existing = propertyPaths.get(pathStr);
      if (existing) existing.nullCount++;
      return;
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        traverse(value, [...path, key]);
      }
    } else {
      const pathStr = path.join('.');
      const existing = propertyPaths.get(pathStr) || {
        depth: path.length,
        types: new Set(),
        nullCount: 0,
        examples: []
      };

      existing.types.add(typeof obj);
      if (existing.examples.length < 5) existing.examples.push(obj);
      propertyPaths.set(pathStr, existing);
    }
  }

  sample.forEach(row => traverse(row));
  return propertyPaths;
}
```

---

## Part 5: Test Implementation Plan

### Week 1: API Integration Tests

```typescript
// tests/integration/json-apis.test.ts

describe('Steam API Integration', () => {
  test('fetches and parses player stats', async () => {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/` +
      `?key=${process.env.STEAM_API_KEY}&steamid=${TEST_STEAM_ID}&appid=730`
    );
    const data = await response.json();

    expect(data.playerstats).toBeDefined();
    expect(data.playerstats.stats).toBeInstanceOf(Array);
  });

  test('schema analyzer handles Steam JSON structure', async () => {
    const steamData = await fetchSteamStats();
    const analyzer = new SchemaAnalyzer();
    const schema = await analyzer.analyze(steamData.playerstats.stats);

    expect(schema.columns.find(c => c.name === 'name')).toBeDefined();
    expect(schema.columns.find(c => c.name === 'value')).toBeDefined();
  });
});

describe('OpenDota API Integration', () => {
  test('fetches and parses match data', async () => {
    const response = await fetch('https://api.opendota.com/api/publicMatches');
    const matches = await response.json();

    expect(matches).toBeInstanceOf(Array);
    expect(matches[0].match_id).toBeDefined();
  });

  test('handles deeply nested match details', async () => {
    const matchId = 7123456789;
    const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
    const match = await response.json();

    // Test nested parsing
    const flattened = flattenObject(match.players[0]);
    expect(flattened['purchase_log_0_key']).toBeDefined();
  });
});
```

### Week 2: Nested JSON Processing

```typescript
// tests/unit/json-flattening.test.ts

describe('JSON Flattening', () => {
  test('flattens 3-level nested object', () => {
    const input = {
      user: {
        profile: {
          name: 'Player1',
          level: 50
        }
      }
    };

    const result = flattenObject(input);
    expect(result['user.profile.name']).toBe('Player1');
    expect(result['user.profile.level']).toBe(50);
  });

  test('handles arrays correctly', () => {
    const input = {
      items: [
        { id: 1, name: 'Sword' },
        { id: 2, name: 'Shield' }
      ]
    };

    const result = flattenObject(input);
    expect(result['items']).toBe(2); // Count
    expect(result['items_first']).toEqual({ id: 1, name: 'Sword' });
  });

  test('stops at maxDepth', () => {
    const deepObject = {
      a: { b: { c: { d: { e: 'too deep' } } } }
    };

    const result = flattenObject(deepObject, '', 3);
    expect(result['a.b.c']).toBe('{"d":{"e":"too deep"}}');
  });
});
```

### Week 3: Large JSON Stress Test

```typescript
// tests/stress/json-large-files.test.ts

describe('Large JSON Processing', () => {
  test('processes 100MB JSON file', async () => {
    // Generate 1M events
    const events = generateDataset(10000, 100);
    const jsonString = JSON.stringify({ events });
    const file = new File([jsonString], 'large.json', { type: 'application/json' });

    const chunks: any[][] = [];
    await importJSONStreaming(
      file,
      { flattenNested: true, maxDepth: 3, chunkSize: 10000 },
      () => {},
      async (chunk) => { chunks.push(chunk); }
    );

    expect(chunks.length).toBeGreaterThan(90); // ~100 chunks
    expect(chunks.flat().length).toBe(1000000);
  });
});
```

---

## Validation Checklist

### API Integration
- [ ] Steam API key configured
- [ ] Riot API key configured (development)
- [ ] OpenDota rate limiting handled
- [ ] Error responses parsed correctly

### JSON Parsing
- [ ] Nested objects flattened correctly
- [ ] Arrays handled (count, first, expand)
- [ ] Null/undefined values preserved
- [ ] Large files streamed without memory issues

### Schema Detection
- [ ] Nested paths recognized (e.g., `properties.result.rarity`)
- [ ] Array fields typed correctly
- [ ] Optional fields marked nullable
- [ ] Semantic types inferred from path names

### Performance Targets
| File Size | Parse Time | Memory Peak |
|-----------|------------|-------------|
| 1 MB | < 100ms | < 20 MB |
| 10 MB | < 500ms | < 100 MB |
| 100 MB | < 5s | < 500 MB |
| 500 MB | < 30s | < 1 GB |

---

## Next Steps

1. Set up API keys for Steam/Riot
2. Test with existing fixtures first
3. Implement nested flattening
4. Add streaming JSON parser
5. Benchmark with generated large files

See [03-supabase-datasets.md](./03-supabase-datasets.md) for cloud database testing.
