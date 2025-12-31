# 00 - Storage Solutions for Large Datasets

How to manage and store large game datasets (100MB - 1GB+) in a browser-based application.

---

## Current State Analysis

### What We Have Now
- **IndexedDB** via `src/lib/db.ts` (Version 8)
- 17 object stores for various features
- Basic CRUD operations with `dbPut`, `dbGet`, `dbGetAll`, `dbDelete`
- No streaming, no chunking, no Web Workers for processing

### Current Limitations
1. **Memory**: Full dataset loaded into memory during upload
2. **No streaming**: Papa Parse not configured for streaming mode
3. **No chunking**: Large datasets can crash the browser
4. **No progress**: No incremental loading feedback

---

## Storage Options Comparison

### Option 1: Enhanced IndexedDB (Recommended for Phase 1)

| Aspect | Details |
|--------|---------|
| **Max Size** | 50% of free disk space (Chrome), 2GB limit per origin (Safari), No hard limit (Firefox) |
| **Browser Support** | All modern browsers |
| **Complexity** | Low - already implemented |
| **Best For** | Datasets up to 500MB |

**Enhancements Needed:**
```typescript
// Chunked storage strategy
interface DataChunk {
  id: string;
  datasetId: string;
  chunkIndex: number;
  totalChunks: number;
  rows: GameDataRow[];
  createdAt: number;
}

// Store chunks separately, query with pagination
async function storeDatasetChunked(
  datasetId: string,
  rows: GameDataRow[],
  chunkSize: number = 10000
): Promise<void> {
  const chunks = Math.ceil(rows.length / chunkSize);
  for (let i = 0; i < chunks; i++) {
    const chunk: DataChunk = {
      id: `${datasetId}-chunk-${i}`,
      datasetId,
      chunkIndex: i,
      totalChunks: chunks,
      rows: rows.slice(i * chunkSize, (i + 1) * chunkSize),
      createdAt: Date.now()
    };
    await dbPut('dataChunks', chunk);
  }
}
```

**Implementation Tasks:**
1. Add `dataChunks` object store to `db.ts`
2. Implement `storeDatasetChunked()` function
3. Implement `getDatasetPaginated(datasetId, page, pageSize)`
4. Add streaming CSV parser with progress callbacks
5. Add Web Worker for background processing

---

### Option 2: DuckDB-WASM (Recommended for Phase 2)

| Aspect | Details |
|--------|---------|
| **Max Size** | Limited by available memory + disk via OPFS |
| **Browser Support** | Chrome 86+, Firefox 79+, Safari 15.2+ |
| **Complexity** | Medium |
| **Best For** | SQL queries on large datasets (100MB - 2GB) |

**Why DuckDB-WASM:**
- Full SQL support (aggregations, joins, window functions)
- Direct CSV/Parquet import without parsing
- 10-100x faster than JavaScript processing
- Can persist to Origin Private File System (OPFS)

**Installation:**
```bash
pnpm add @duckdb/duckdb-wasm
```

**Implementation:**
```typescript
import * as duckdb from '@duckdb/duckdb-wasm';

class DuckDBAdapter {
  private db: duckdb.AsyncDuckDB | null = null;
  private conn: duckdb.AsyncDuckDBConnection | null = null;

  async initialize(): Promise<void> {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    this.db = new duckdb.AsyncDuckDB(logger, worker);

    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    this.conn = await this.db.connect();
  }

  async importCSV(file: File): Promise<void> {
    await this.db!.registerFileHandle(
      file.name,
      file,
      duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
      true
    );

    await this.conn!.query(`
      CREATE TABLE game_events AS
      SELECT * FROM read_csv_auto('${file.name}')
    `);
  }

  async query(sql: string): Promise<any[]> {
    const result = await this.conn!.query(sql);
    return result.toArray().map(row => row.toJSON());
  }

  async getRetention(): Promise<any> {
    return this.query(`
      SELECT
        DATE_TRUNC('day', timestamp) as cohort_date,
        COUNT(DISTINCT user_id) as users,
        COUNT(DISTINCT CASE WHEN days_since_install = 1 THEN user_id END) as d1,
        COUNT(DISTINCT CASE WHEN days_since_install = 7 THEN user_id END) as d7,
        COUNT(DISTINCT CASE WHEN days_since_install = 30 THEN user_id END) as d30
      FROM game_events
      GROUP BY 1
      ORDER BY 1 DESC
    `);
  }
}
```

**Implementation Tasks:**
1. Create `src/lib/duckdb.ts` adapter
2. Add DuckDB import option to file upload
3. Create retention/funnel SQL templates
4. Add OPFS persistence for large datasets
5. Benchmark against current JS processing

---

### Option 3: File System Access API (Recommended for Desktop Use)

| Aspect | Details |
|--------|---------|
| **Max Size** | Unlimited (reads from disk) |
| **Browser Support** | Chrome/Edge only |
| **Complexity** | Medium |
| **Best For** | Very large files (1GB+) that don't need full loading |

**Use Case:** User selects a file, we read it in chunks without loading into memory.

```typescript
async function processLargeCSV(
  fileHandle: FileSystemFileHandle,
  onProgress: (percent: number) => void,
  onChunk: (rows: any[]) => void
): Promise<void> {
  const file = await fileHandle.getFile();
  const totalSize = file.size;
  let processedSize = 0;

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      worker: true,
      header: true,
      chunk: (results, parser) => {
        processedSize += results.data.length * 100; // Approximate
        onProgress(Math.min(99, (processedSize / totalSize) * 100));
        onChunk(results.data);
      },
      complete: () => {
        onProgress(100);
        resolve();
      },
      error: reject
    });
  });
}
```

---

### Option 4: sql.js (SQLite in Browser)

| Aspect | Details |
|--------|---------|
| **Max Size** | ~2GB (in-memory), unlimited with persistence |
| **Browser Support** | All modern browsers |
| **Complexity** | Medium |
| **Best For** | Relational queries, existing SQLite databases |

**Already Implemented:** `src/lib/importers/sqliteImporter.ts`

**Enhancements Needed:**
1. Add virtual file system persistence
2. Implement query caching
3. Add export to SQLite format

---

### Option 5: Hybrid Local + Supabase (Recommended for Production)

| Aspect | Details |
|--------|---------|
| **Max Size** | Unlimited (server-side) |
| **Browser Support** | All browsers |
| **Complexity** | High |
| **Best For** | Multi-device access, collaboration, large datasets |

**Architecture:**
```
User Upload → IndexedDB (cache) → Background Sync → Supabase
                    ↓
              DuckDB Query Engine
                    ↓
              AI Pipeline Analysis
                    ↓
              Dashboard Visualization
```

---

## Recommended Implementation Phases

### Phase 1: Enhanced IndexedDB (Week 1-2)
- [ ] Add chunked storage with 10K rows per chunk
- [ ] Implement Papa Parse streaming mode
- [ ] Add Web Worker for CSV parsing
- [ ] Add upload progress with chunk-by-chunk feedback
- [ ] Test with 50MB-100MB datasets

### Phase 2: DuckDB-WASM Integration (Week 3-4)
- [ ] Add DuckDB-WASM as optional query engine
- [ ] Create SQL templates for common analytics queries
- [ ] Add OPFS persistence for datasets
- [ ] Benchmark performance vs JavaScript processing
- [ ] Test with 500MB-1GB datasets

### Phase 3: File System Access API (Week 5)
- [ ] Add "Open from Disk" option (Chrome only)
- [ ] Implement stream-based processing
- [ ] Add graceful fallback for unsupported browsers
- [ ] Test with 1GB+ datasets

### Phase 4: Supabase Cloud Sync (Week 6-8)
- [ ] Implement background sync to Supabase
- [ ] Add offline-first capability
- [ ] Create cloud dashboard for large datasets
- [ ] Add multi-device session sync

---

## Storage Limits by Browser

| Browser | IndexedDB Limit | OPFS Limit | Notes |
|---------|-----------------|------------|-------|
| Chrome | 60% of free disk (max ~1TB) | 10% of disk | Best support |
| Firefox | 50% of free disk | Not supported | Second best |
| Safari | 1GB | Not supported | Most restrictive |
| Edge | Same as Chrome | Same as Chrome | Chromium-based |

---

## Decision Matrix

| Scenario | Recommended Solution |
|----------|---------------------|
| Dataset < 100MB | IndexedDB with chunking |
| Dataset 100MB - 500MB | DuckDB-WASM |
| Dataset 500MB - 2GB | DuckDB-WASM + OPFS |
| Dataset > 2GB | File System API + streaming |
| Multi-device access needed | Supabase sync |
| SQL queries needed | DuckDB-WASM or sql.js |
| Offline-first priority | IndexedDB + DuckDB-WASM |

---

## Code Examples

### Chunked IndexedDB Storage
```typescript
// Add to src/lib/db.ts - Version 9
if (!database.objectStoreNames.contains('dataChunks')) {
  const chunkStore = database.createObjectStore('dataChunks', { keyPath: 'id' });
  chunkStore.createIndex('datasetId', 'datasetId', { unique: false });
  chunkStore.createIndex('chunkIndex', 'chunkIndex', { unique: false });
}
```

### Streaming CSV Parser with Progress
```typescript
// src/lib/importers/streamingCsvImporter.ts
export async function importCSVStreaming(
  file: File,
  onProgress: (progress: ImportProgress) => void
): Promise<string> {
  const datasetId = generateId();
  const totalSize = file.size;
  let processedRows = 0;
  let currentChunk: any[] = [];
  let chunkIndex = 0;
  const CHUNK_SIZE = 10000;

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      chunk: async (results) => {
        currentChunk.push(...results.data);
        processedRows += results.data.length;

        // Save chunk when full
        if (currentChunk.length >= CHUNK_SIZE) {
          await saveChunk(datasetId, chunkIndex++, currentChunk.splice(0, CHUNK_SIZE));
        }

        onProgress({
          phase: 'parsing',
          percent: Math.round((processedRows / totalSize) * 100),
          rowsProcessed: processedRows
        });
      },
      complete: async () => {
        // Save remaining rows
        if (currentChunk.length > 0) {
          await saveChunk(datasetId, chunkIndex, currentChunk);
        }
        resolve(datasetId);
      },
      error: reject
    });
  });
}

async function saveChunk(datasetId: string, index: number, rows: any[]): Promise<void> {
  await dbPut('dataChunks', {
    id: `${datasetId}-${index}`,
    datasetId,
    chunkIndex: index,
    rows,
    createdAt: Date.now()
  });
}
```

### DuckDB Query Helper
```typescript
// src/lib/duckdb/queryTemplates.ts
export const ANALYTICS_QUERIES = {
  retention: `
    WITH first_seen AS (
      SELECT user_id, MIN(timestamp) as first_date
      FROM events
      GROUP BY user_id
    ),
    activity AS (
      SELECT
        e.user_id,
        f.first_date,
        DATE_DIFF('day', f.first_date, e.timestamp) as days_since
      FROM events e
      JOIN first_seen f ON e.user_id = f.user_id
    )
    SELECT
      first_date::DATE as cohort,
      COUNT(DISTINCT user_id) as cohort_size,
      COUNT(DISTINCT CASE WHEN days_since = 1 THEN user_id END) * 100.0 / COUNT(DISTINCT user_id) as d1_pct,
      COUNT(DISTINCT CASE WHEN days_since = 7 THEN user_id END) * 100.0 / COUNT(DISTINCT user_id) as d7_pct,
      COUNT(DISTINCT CASE WHEN days_since = 30 THEN user_id END) * 100.0 / COUNT(DISTINCT user_id) as d30_pct
    FROM activity
    GROUP BY 1
    ORDER BY 1 DESC
  `,

  revenueByUser: `
    SELECT
      user_id,
      COUNT(*) as purchase_count,
      SUM(amount) as total_revenue,
      AVG(amount) as avg_purchase,
      MIN(timestamp) as first_purchase,
      MAX(timestamp) as last_purchase
    FROM events
    WHERE event_type = 'purchase'
    GROUP BY user_id
    ORDER BY total_revenue DESC
    LIMIT 100
  `,

  dailyMetrics: `
    SELECT
      DATE_TRUNC('day', timestamp) as date,
      COUNT(DISTINCT user_id) as dau,
      COUNT(*) as events,
      SUM(CASE WHEN event_type = 'purchase' THEN amount ELSE 0 END) as revenue
    FROM events
    GROUP BY 1
    ORDER BY 1 DESC
  `
};
```

---

## Next Steps

1. **Immediate**: Implement chunked IndexedDB storage
2. **Short-term**: Add Papa Parse streaming mode
3. **Medium-term**: Integrate DuckDB-WASM for SQL queries
4. **Long-term**: Add Supabase sync for cloud storage

See [01-csv-datasets.md](./01-csv-datasets.md) for test datasets and validation plans.
