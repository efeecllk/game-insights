# Phase 1: Core Data Integration

**Goal:** Create a unified data access layer that provides real user data to all pages

## Problem Statement

Currently, `RealDataProvider` is only used in `App.tsx` for the Overview page. Other pages either:
- Use hardcoded demo data (Monetization, Funnels, Realtime)
- Use mock functions (`getMockMetricValue`, `getMockChartData`)
- Ignore uploaded data entirely

## Solution Architecture

### 1.1 Create `useGameData` Hook

**File:** `src/hooks/useGameData.ts`

```typescript
interface UseGameDataReturn {
  // Raw data access
  rawData: Record<string, unknown>[];
  columns: ColumnMapping[];
  rowCount: number;

  // Derived data (memoized)
  dataProvider: IDataProvider;
  analysisResult: AnalysisResult | null;

  // State
  hasRealData: boolean;
  isLoading: boolean;
  dataMode: 'real' | 'demo';

  // Quality
  qualityScore: number;
  qualityIssues: QualityIssue[];
}

export function useGameData(): UseGameDataReturn {
  const { activeGameData } = useData();
  const { selectedGame } = useGame();

  // Memoize data provider creation
  const dataProvider = useMemo(() =>
    createSmartDataProvider(selectedGame, activeGameData),
    [selectedGame, activeGameData]
  );

  // Cache analysis results
  const analysisResult = useMemo(() => {
    if (!activeGameData) return null;
    return getCachedAnalysis(activeGameData.id);
  }, [activeGameData]);

  return {
    rawData: activeGameData?.rawData ?? [],
    columns: activeGameData?.columnMappings ?? [],
    rowCount: activeGameData?.rowCount ?? 0,
    dataProvider,
    analysisResult,
    hasRealData: !!activeGameData,
    isLoading: false,
    dataMode: activeGameData ? 'real' : 'demo',
    qualityScore: analysisResult?.quality?.score ?? 100,
    qualityIssues: analysisResult?.quality?.issues ?? [],
  };
}
```

### 1.2 Use Stored Column Mappings

**Problem:** `RealDataProvider` re-analyzes columns instead of using `GameData.columnMappings`

**Fix in:** `src/lib/realDataProvider.ts`

```typescript
// BEFORE: Re-detects role
const role = detectColumnRole(col, stats);

// AFTER: Use stored mapping if available
const mapping = this.gameData.columnMappings?.find(m => m.originalName === col);
if (mapping && mapping.confidence >= 0.8) {
  this.columnRoles.set(col, mapping.role);
} else {
  // Fall back to detection for unmapped columns
  this.columnRoles.set(col, detectColumnRole(col, stats));
}
```

### 1.3 Cache Analysis Results

**File:** `src/lib/analysisCache.ts`

```typescript
interface CachedAnalysis {
  id: string;
  dataId: string;
  timestamp: number;
  result: AnalysisResult;
  version: string;
}

const CACHE_STORE = 'analysisCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedAnalysis(dataId: string): Promise<AnalysisResult | null> {
  const cached = await dbGet<CachedAnalysis>(CACHE_STORE, dataId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  return null;
}

export async function setCachedAnalysis(dataId: string, result: AnalysisResult): Promise<void> {
  await dbPut<CachedAnalysis>(CACHE_STORE, {
    id: dataId,
    dataId,
    timestamp: Date.now(),
    result,
    version: '1.0',
  });
}
```

### 1.4 Add `analysisCache` Store to IndexedDB

**File:** `src/lib/db.ts`

```typescript
// Add to version 8 migration
if (!db.objectStoreNames.contains('analysisCache')) {
  db.createObjectStore('analysisCache', { keyPath: 'id' });
}
```

### 1.5 Sync Game Type from Upload

**Problem:** `GameContext.selectedGame` can be inconsistent with `activeGameData.type`

**Fix in:** `src/context/GameContext.tsx`

```typescript
// Watch for activeGameData changes and sync game type
useEffect(() => {
  if (activeGameData?.type && activeGameData.type !== 'custom') {
    setSelectedGame(activeGameData.type as GameCategory);
  }
}, [activeGameData]);
```

### 1.6 Enhanced RealDataProvider Methods

Add these methods to `src/lib/realDataProvider.ts`:

```typescript
// Time-series revenue with proper date parsing
getRevenueTimeSeries(period: 'daily' | 'weekly' | 'monthly'): TimeSeriesData[] {
  const revenueCol = this.findColumnByRole('revenue');
  const dateCol = this.findColumnByRole('timestamp') || this.findColumnByRole('install_date');

  if (!revenueCol || !dateCol) return [];

  // Group by period and sum revenue
  const grouped = this.groupByPeriod(dateCol, revenueCol, period);
  return grouped.map(g => ({
    date: g.period,
    value: g.sum,
  }));
}

// Spender tier distribution
getSpenderTiers(): SpenderTier[] {
  const revenueCol = this.findColumnByRole('revenue');
  const userCol = this.findColumnByRole('user_id');

  if (!revenueCol || !userCol) return [];

  // Calculate per-user revenue and categorize
  const userRevenue = this.aggregateByUser(userCol, revenueCol);
  return this.categorizeSpenders(userRevenue);
}

// Level/progression distribution
getProgressionDistribution(): ProgressionData[] {
  const levelCol = this.findColumnByRole('level');
  if (!levelCol) return [];

  return this.getDistribution(levelCol);
}

// Session metrics
getSessionMetrics(): SessionMetrics {
  const sessionCol = this.findColumnByRole('session');
  const durationCol = this.findColumnByRole('duration');
  const userCol = this.findColumnByRole('user_id');

  return {
    avgSessionLength: this.calculateAverage(durationCol),
    sessionsPerUser: this.calculateSessionsPerUser(sessionCol, userCol),
    sessionDistribution: this.getDistribution(durationCol, 'bucket'),
  };
}
```

### 1.7 Create Data Quality Badge Component

**File:** `src/components/ui/DataQualityBadge.tsx`

```typescript
interface DataQualityBadgeProps {
  score: number; // 0-100
  issues: QualityIssue[];
}

export function DataQualityBadge({ score, issues }: DataQualityBadgeProps) {
  const color = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';
  const criticalIssues = issues.filter(i => i.severity === 'critical');

  return (
    <Tooltip content={<QualityTooltip issues={issues} />}>
      <div className={`px-2 py-1 rounded text-xs font-medium bg-${color}-500/20 text-${color}-400`}>
        {score}% Quality
        {criticalIssues.length > 0 && (
          <AlertCircle className="w-3 h-3 ml-1 inline" />
        )}
      </div>
    </Tooltip>
  );
}
```

## Implementation Order

1. **Create `useGameData` hook** - Central data access point
2. **Update `db.ts`** - Add analysisCache store
3. **Create `analysisCache.ts`** - Caching layer
4. **Fix `realDataProvider.ts`** - Use stored mappings
5. **Sync `GameContext.tsx`** - Automatic game type sync
6. **Add RealDataProvider methods** - Monetization, sessions
7. **Create `DataQualityBadge`** - Quality indicator

## Files to Create

- [ ] `src/hooks/useGameData.ts`
- [ ] `src/lib/analysisCache.ts`
- [ ] `src/components/ui/DataQualityBadge.tsx`

## Files to Modify

- [ ] `src/lib/db.ts` - Add store, bump version
- [ ] `src/lib/realDataProvider.ts` - Use mappings, add methods
- [ ] `src/context/GameContext.tsx` - Sync game type
- [ ] `src/context/DataContext.tsx` - Export more utilities

## Testing Requirements

1. Upload CSV → `useGameData` returns real data
2. No data → `useGameData` returns demo mode
3. Analysis cache hit → No re-analysis on page navigation
4. Column mappings used → No duplicate detection
5. Game type synced → Changing dataset changes game type

## Success Criteria

- [ ] `useGameData` hook available and tested
- [ ] Analysis results cached in IndexedDB
- [ ] Column mappings from upload used by providers
- [ ] Game type auto-synced from uploaded data
- [ ] Quality indicators visible when data has issues
