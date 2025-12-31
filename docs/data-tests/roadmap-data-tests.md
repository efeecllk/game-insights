# Game Insights - Data Testing Roadmap

Comprehensive testing plan for validating Game Insights with real-world, complex game datasets.

---

## Executive Summary

This roadmap outlines a phased approach to testing Game Insights with increasingly complex datasets:

| Phase | Focus | Data Size | Timeline |
|-------|-------|-----------|----------|
| 1 | Storage Infrastructure | N/A | Week 1-2 |
| 2 | CSV Datasets | 1KB - 4GB | Week 3-4 |
| 3 | JSON/API Datasets | 1MB - 500MB | Week 5-6 |
| 4 | Supabase Cloud | 1M - 10M rows | Week 7-8 |
| 5 | Stress Testing | 1GB+ | Week 9-10 |

---

## Current State Analysis

### What Works
- Basic CSV/JSON import via `FileAdapter`
- IndexedDB persistence with 17 object stores
- Schema analysis with 40+ semantic types
- Game type detection (5 types)
- Mock data providers for dashboard

### What Needs Improvement
- No streaming for large files
- No chunked storage
- Memory limits not handled
- No progress feedback
- No DuckDB/SQL query support
- Limited real-time capabilities

---

## Phase 1: Storage Infrastructure (Week 1-2)

> **Goal:** Enable handling of datasets 100x larger than current capacity

### Deliverables
- [ ] Chunked IndexedDB storage (10K rows/chunk)
- [ ] Streaming CSV parser with Web Workers
- [ ] Progress callbacks during import
- [ ] Memory usage monitoring

### Implementation Tasks

#### 1.1 Add DataChunks Store
```typescript
// Upgrade db.ts to version 9
if (!database.objectStoreNames.contains('dataChunks')) {
  const chunkStore = database.createObjectStore('dataChunks', { keyPath: 'id' });
  chunkStore.createIndex('datasetId', 'datasetId', { unique: false });
  chunkStore.createIndex('chunkIndex', 'chunkIndex', { unique: false });
}
```

#### 1.2 Streaming CSV Importer
```typescript
// src/lib/importers/streamingCsvImporter.ts
export interface ImportProgress {
  phase: 'reading' | 'parsing' | 'storing' | 'analyzing';
  percent: number;
  rowsProcessed: number;
  chunksStored: number;
  estimatedTimeRemaining?: number;
}
```

#### 1.3 Web Worker for Processing
```typescript
// src/workers/csvParser.worker.ts
self.onmessage = async (e: MessageEvent<{ file: File }>) => {
  const { file } = e.data;
  // Stream parse and post progress
};
```

### Validation Criteria
| Metric | Target |
|--------|--------|
| 100MB CSV load time | < 30 seconds |
| Memory peak | < 500MB |
| Progress accuracy | ±5% |
| Chunk retrieval | < 100ms |

### Documentation
- [00-storage-solutions.md](./00-storage-solutions.md)

---

## Phase 2: CSV Dataset Testing (Week 3-4)

> **Goal:** Validate with real Kaggle game analytics datasets

### Target Datasets

#### Tier 1: Small (< 10MB) - Week 3
| Dataset | Size | Rows | Purpose |
|---------|------|------|---------|
| Cookie Cats A/B | 490 KB | 90K | Retention/A/B testing |
| LoL Diamond Ranked | 552 KB | 10K | Complex 40-column schema |
| Steam Behavior | 1.5 MB | 200K | Multi-game analytics |

#### Tier 2: Medium (10-100MB) - Week 3-4
| Dataset | Size | Rows | Purpose |
|---------|------|------|---------|
| WoW Avatar History | 74.9 MB | 1M+ | Session reconstruction |
| Steam Store Games | 36.9 MB | 27K | Rich metadata |
| Gaming Churn | 15 MB | 100K | ML feature testing |

#### Tier 3: Large (100MB-5GB) - Week 4
| Dataset | Size | Rows | Purpose |
|---------|------|------|---------|
| PUBG Match Deaths | 4.4 GB | 65M | Stress test |
| Dota 2 Matches | 2.5 GB | 50K | Multi-file relationships |

### Test Suite
```typescript
// tests/integration/csv-datasets.test.ts
describe('CSV Dataset Integration', () => {
  describe('Tier 1 - Small Datasets', () => {
    test('Cookie Cats: schema detection', async () => { });
    test('Cookie Cats: game type = puzzle', async () => { });
    test('Cookie Cats: retention metrics', async () => { });
    test('LoL: 40-column parsing', async () => { });
    test('Steam: behavior aggregation', async () => { });
  });

  describe('Tier 2 - Medium Datasets', () => {
    test('WoW: 1M row import < 30s', async () => { });
    test('WoW: session reconstruction', async () => { });
    test('Churn: feature extraction', async () => { });
  });

  describe('Tier 3 - Large Datasets', () => {
    test('PUBG: streaming import', async () => { });
    test('PUBG: sample query < 5s', async () => { });
    test('Dota 2: multi-file join', async () => { });
  });
});
```

### Setup Script
```bash
#!/bin/bash
# scripts/download-csv-datasets.sh

# Install Kaggle CLI if needed
pip install kaggle

# Download datasets
kaggle datasets download -d yufengsui/mobile-games-ab-testing -p data/csv-tests
kaggle datasets download -d bobbyscience/league-of-legends-diamond-ranked-games-10-min -p data/csv-tests
kaggle datasets download -d mylesoneill/warcraft-avatar-history -p data/csv-tests

# Unzip
cd data/csv-tests && unzip '*.zip'
```

### Documentation
- [01-csv-datasets.md](./01-csv-datasets.md)

---

## Phase 3: JSON/API Dataset Testing (Week 5-6)

> **Goal:** Handle complex nested JSON and real-time API data

### Data Sources

#### Game APIs
| API | Complexity | Rate Limit | Auth |
|-----|------------|------------|------|
| Steam Web API | Medium | 100K/day | API Key |
| Riot Games API | High | 100/2min | API Key |
| OpenDota API | Very High | 60/min | None |
| Fortnite-API | Medium | 3/sec | None |

#### Local JSON Fixtures
| File | Game Type | Complexity |
|------|-----------|------------|
| gacha_rpg_events.json | Gacha | High (nested) |
| battle_royale_events.json | BR | Medium |
| idle_game_events.json | Idle | Medium |

### Implementation Tasks

#### 3.1 Nested JSON Flattening
```typescript
// Flatten properties.result.rarity → properties_result_rarity
function flattenObject(obj: any, prefix = '', maxDepth = 3): Record<string, any>;
```

#### 3.2 API Integration Layer
```typescript
// src/adapters/GameAPIAdapter.ts
interface GameAPIAdapter {
  fetchPlayerStats(playerId: string): Promise<PlayerStats>;
  fetchMatchHistory(playerId: string, count: number): Promise<Match[]>;
  getSchema(): Schema;
}
```

#### 3.3 Synthetic Data Generator
```typescript
// scripts/generate-test-data.ts
// Generate 1M+ events with realistic distributions
```

### Test Suite
```typescript
describe('JSON Dataset Integration', () => {
  describe('Nested Structure Handling', () => {
    test('flattens 4-level nested objects', async () => { });
    test('handles arrays (count, first, expand)', async () => { });
    test('preserves null values', async () => { });
  });

  describe('API Integration', () => {
    test('Steam: fetches player stats', async () => { });
    test('OpenDota: parses complex match data', async () => { });
    test('handles rate limiting gracefully', async () => { });
  });

  describe('Large JSON Processing', () => {
    test('100MB JSON parses < 10s', async () => { });
    test('streaming import works', async () => { });
  });
});
```

### Documentation
- [02-json-datasets.md](./02-json-datasets.md)

---

## Phase 4: Supabase Cloud Testing (Week 7-8)

> **Goal:** Validate cloud-based data storage and real-time features

### Setup Tasks

#### 4.1 Create Supabase Project
1. Sign up at supabase.com
2. Create new project "game-insights-test"
3. Get API credentials

#### 4.2 Run Schema Migrations
```sql
-- Create partitioned events table
-- Create players, sessions, purchases tables
-- Create indexes for common queries
```

#### 4.3 Generate Test Data
```bash
# Generate 10K players, 1M events
pnpm ts-node scripts/generate-supabase-data.ts
```

### Test Scenarios

| Scenario | Data Volume | Expected Time |
|----------|-------------|---------------|
| Retention query (30 days) | 1M events | < 2s |
| Revenue breakdown | 100K purchases | < 1s |
| Real-time event stream | 100 events/sec | < 100ms latency |
| Bulk export | 1M events | < 60s |

### Test Suite
```typescript
describe('Supabase Integration', () => {
  describe('Connection & Schema', () => {
    test('connects successfully', async () => { });
    test('fetches all table schemas', async () => { });
  });

  describe('Query Performance', () => {
    test('retention query < 2s on 1M events', async () => { });
    test('pagination works correctly', async () => { });
    test('complex filters execute properly', async () => { });
  });

  describe('Real-time', () => {
    test('receives INSERT events < 100ms', async () => { });
    test('handles reconnection', async () => { });
    test('live metrics update correctly', async () => { });
  });
});
```

### Documentation
- [03-supabase-datasets.md](./03-supabase-datasets.md)

---

## Phase 5: Stress Testing (Week 9-10)

> **Goal:** Find breaking points and optimize performance

### Stress Test Scenarios

#### 5.1 Maximum Dataset Size
| Browser | Expected Max | Test Method |
|---------|--------------|-------------|
| Chrome | 2GB IndexedDB | Load PUBG dataset |
| Firefox | 1.5GB | Load WoW + Dota 2 |
| Safari | 500MB | Load WoW only |

#### 5.2 Query Performance Under Load
```typescript
// Concurrent query stress test
async function stressTestQueries() {
  const queries = [
    'retention',
    'revenue',
    'funnel',
    'cohort',
    'realtime'
  ];

  // Run 10 concurrent queries
  await Promise.all(
    Array(10).fill(0).map(() =>
      Promise.all(queries.map(q => executeQuery(q)))
    )
  );
}
```

#### 5.3 Real-time Event Throughput
```typescript
// Test max events/second
async function testEventThroughput() {
  let eventsPerSecond = 10;

  while (eventsPerSecond < 10000) {
    const success = await simulateEventStream(eventsPerSecond);
    if (!success) break;
    eventsPerSecond *= 2;
  }

  return eventsPerSecond / 2; // Last successful rate
}
```

### Performance Targets

| Metric | Target | Acceptable | Failure |
|--------|--------|------------|---------|
| 1M row load time | < 30s | < 60s | > 120s |
| Retention query | < 2s | < 5s | > 10s |
| Memory peak | < 1GB | < 2GB | > 4GB |
| Event latency | < 100ms | < 500ms | > 1s |
| Concurrent users | 10+ | 5+ | < 3 |

---

## Test Automation

### CI/CD Integration
```yaml
# .github/workflows/data-tests.yml
name: Data Integration Tests

on:
  push:
    paths:
      - 'src/lib/importers/**'
      - 'src/adapters/**'
      - 'src/ai/**'
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  small-datasets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Download test datasets
        run: ./scripts/download-csv-datasets.sh
      - name: Run small dataset tests
        run: pnpm test:integration -- --grep "Tier 1"

  medium-datasets:
    runs-on: ubuntu-latest
    needs: small-datasets
    steps:
      - uses: actions/checkout@v4
      - name: Run medium dataset tests
        run: pnpm test:integration -- --grep "Tier 2"

  supabase-tests:
    runs-on: ubuntu-latest
    needs: medium-datasets
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v4
      - name: Run Supabase tests
        run: pnpm test:integration -- --grep "Supabase"
```

### Local Test Commands
```bash
# Run all data tests
pnpm test:data

# Run specific phase
pnpm test:data:csv
pnpm test:data:json
pnpm test:data:supabase

# Run stress tests (long running)
pnpm test:stress

# Generate test report
pnpm test:data --reporter=html
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] 100MB CSV imports without crashing
- [ ] Progress bar shows accurate percentage
- [ ] Memory stays under 500MB during import

### Phase 2 Complete When:
- [ ] All Tier 1 datasets pass schema detection
- [ ] All Tier 2 datasets import successfully
- [ ] PUBG dataset loads with sampling

### Phase 3 Complete When:
- [ ] Nested JSON flattens correctly
- [ ] At least 2 game APIs integrated
- [ ] 100MB JSON processes < 10s

### Phase 4 Complete When:
- [ ] Supabase adapter passes all tests
- [ ] Real-time events work < 100ms latency
- [ ] 1M rows query < 5s

### Phase 5 Complete When:
- [ ] Maximum dataset size documented per browser
- [ ] Performance regression tests automated
- [ ] Breaking points identified and documented

---

## Related Documentation

- [00-storage-solutions.md](./00-storage-solutions.md) - Storage architecture decisions
- [01-csv-datasets.md](./01-csv-datasets.md) - CSV dataset details and tests
- [02-json-datasets.md](./02-json-datasets.md) - JSON/API dataset details
- [03-supabase-datasets.md](./03-supabase-datasets.md) - Supabase setup and tests
- [../research/mobile-game-datasets.md](../research/mobile-game-datasets.md) - Original dataset research

---

## Quick Start

```bash
# 1. Set up Kaggle API
pip install kaggle
# Add API key to ~/.kaggle/kaggle.json

# 2. Download test datasets
./scripts/download-csv-datasets.sh

# 3. Set up Supabase (optional)
cp .env.example .env.local
# Add SUPABASE_URL and SUPABASE_ANON_KEY

# 4. Run Phase 1 tests
pnpm test:data:storage

# 5. Run Phase 2 tests
pnpm test:data:csv

# 6. Check results
open coverage/data-tests/index.html
```

---

## Appendix: Dataset Download Links

### Kaggle Datasets (CSV)
- [Cookie Cats A/B](https://www.kaggle.com/datasets/yufengsui/mobile-games-ab-testing)
- [LoL Diamond Ranked](https://www.kaggle.com/datasets/bobbyscience/league-of-legends-diamond-ranked-games-10-min)
- [WoW Avatar History](https://www.kaggle.com/datasets/mylesoneill/warcraft-avatar-history)
- [Steam Behavior](https://www.kaggle.com/datasets/tamber/steam-video-games)
- [PUBG Deaths](https://www.kaggle.com/datasets/skihikingkevin/pubg-match-deaths)
- [Dota 2 Matches](https://www.kaggle.com/datasets/devinanzelmo/dota-2-matches)

### Game APIs (JSON)
- [Steam Web API](https://developer.valvesoftware.com/wiki/Steam_Web_API)
- [Riot Games API](https://developer.riotgames.com)
- [OpenDota API](https://docs.opendota.com)
- [Fortnite-API](https://fortnite-api.com)

### Supabase Resources
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://github.com/supabase/supabase-js)
