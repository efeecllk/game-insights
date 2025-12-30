# Phase 5: Polish & Production Ready

**Goal:** Ensure the application is production-ready with comprehensive testing, error handling, performance optimization, and documentation

---

## 5.1 Comprehensive Testing

### 5.1.1 Unit Tests for Data Layer

**Files to test:** `src/lib/`, `src/ai/`

```typescript
// src/lib/__tests__/realDataProvider.test.ts
describe('RealDataProvider', () => {
  const mockGameData = createMockGameData({
    rawData: [
      { user_id: '1', revenue: 10, level: 5, timestamp: '2024-01-01' },
      { user_id: '1', revenue: 20, level: 8, timestamp: '2024-01-02' },
      { user_id: '2', revenue: 0, level: 3, timestamp: '2024-01-01' },
    ],
    columnMappings: [
      { originalName: 'user_id', role: 'user_id', confidence: 1 },
      { originalName: 'revenue', role: 'revenue', confidence: 1 },
      { originalName: 'level', role: 'level', confidence: 1 },
    ],
  });

  it('should calculate correct ARPU', () => {
    const provider = new RealDataProvider(mockGameData);
    expect(provider.calculateARPU()).toBe(15); // 30 total / 2 users
  });

  it('should categorize spender tiers correctly', () => {
    const provider = new RealDataProvider(mockGameData);
    const tiers = provider.getSpenderTiers();
    expect(tiers.find(t => t.tier === 'Non-Payer')?.users).toBe(1);
    expect(tiers.find(t => t.tier === 'Minnow')?.users).toBe(1);
  });

  it('should detect retention from timestamps', () => {
    const provider = new RealDataProvider(mockGameData);
    const retention = provider.getRetentionData();
    expect(retention.length).toBeGreaterThan(0);
  });

  it('should handle missing columns gracefully', () => {
    const incompleteData = createMockGameData({ rawData: [{ x: 1 }] });
    const provider = new RealDataProvider(incompleteData);
    expect(provider.getSpenderTiers()).toEqual([]);
  });
});

// src/ai/ml/__tests__/FeatureExtractor.test.ts
describe('FeatureExtractor', () => {
  it('should extract user features correctly', () => {
    const extractor = new FeatureExtractor(mockGameData);
    const features = extractor.extractUserFeatures('1');
    expect(features.totalSpend).toBe(30);
    expect(features.currentLevel).toBe(8);
    expect(features.isPayer).toBe(true);
  });

  it('should calculate session trends', () => {
    const extractor = new FeatureExtractor(mockGameDataWithSessions);
    const features = extractor.extractUserFeatures('1');
    expect(features.sessionTrend).toBeDefined();
  });
});
```

### 5.1.2 Integration Tests

**File:** `tests/integration/data-flow.test.ts`

```typescript
describe('Data Flow Integration', () => {
  it('should flow data from upload to visualization', async () => {
    // 1. Upload CSV
    const file = createTestCSV(testData);
    const importResult = await importCSV(file);
    expect(importResult.success).toBe(true);

    // 2. Add to context
    await dataContext.addGameData(importResult);

    // 3. Create data provider
    const provider = createSmartDataProvider('puzzle', dataContext.activeGameData);

    // 4. Verify data available
    expect(provider.getKPIData().length).toBe(4);
    expect(provider.getRetentionData().length).toBeGreaterThan(0);
  });

  it('should cache analysis results', async () => {
    await dataContext.addGameData(testGameData);

    // First call - should analyze
    const result1 = await getCachedAnalysis(testGameData.id);
    expect(result1).toBeNull();

    // Run analysis
    await runAnalysis(testGameData);

    // Second call - should use cache
    const result2 = await getCachedAnalysis(testGameData.id);
    expect(result2).not.toBeNull();
  });

  it('should train ML models on real data', async () => {
    await mlService.trainOnData(testGameData);
    const predictions = mlService.getChurnPredictions(userFeatures);
    expect(predictions.length).toBeGreaterThan(0);
  });
});
```

### 5.1.3 E2E Tests

**File:** `tests/e2e/full-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow', () => {
  test('should complete upload to insights workflow', async ({ page }) => {
    // 1. Navigate to upload
    await page.goto('/upload');

    // 2. Upload test file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-data.csv');

    // 3. Wait for analysis
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({
      timeout: 30000,
    });

    // 4. Navigate to Overview
    await page.click('[data-testid="nav-overview"]');

    // 5. Verify real data badge
    await expect(page.locator('[data-testid="data-mode-badge"]')).toContainText('Your Data');

    // 6. Verify KPIs populated
    await expect(page.locator('[data-testid="kpi-card"]').first()).toBeVisible();

    // 7. Navigate to Predictions
    await page.click('[data-testid="nav-predictions"]');

    // 8. Verify ML predictions visible
    await expect(page.locator('[data-testid="churn-risk-table"]')).toBeVisible();
  });

  test('should handle large dataset performance', async ({ page }) => {
    await page.goto('/upload');

    // Upload 100k row file
    await page.locator('input[type="file"]').setInputFiles('tests/fixtures/large-dataset.csv');

    // Should complete within 30 seconds
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({
      timeout: 30000,
    });

    // Page should remain responsive
    await page.click('[data-testid="nav-overview"]');
    await expect(page.locator('[data-testid="kpi-card"]').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
```

---

## 5.2 Error Handling

### 5.2.1 Global Error Boundary Enhancement

**File:** `src/components/ErrorBoundary.tsx`

```typescript
class GlobalErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    logError(error, {
      componentStack: errorInfo.componentStack,
      ...getAppContext(),
    });

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReset = async () => {
    // Clear corrupted data
    await clearAllCaches();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          error={this.state.error}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}
```

### 5.2.2 Data Processing Error Handling

**File:** `src/lib/errorHandling.ts`

```typescript
export class DataProcessingError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DataProcessingError';
  }
}

export enum ErrorCode {
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  COLUMN_NOT_FOUND = 'COLUMN_NOT_FOUND',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  ML_TRAINING_FAILED = 'ML_TRAINING_FAILED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
}

export function handleDataError(error: unknown): UserFriendlyError {
  if (error instanceof DataProcessingError) {
    return {
      title: getErrorTitle(error.code),
      message: error.message,
      action: getRecoveryAction(error.code),
      canRetry: isRetryable(error.code),
    };
  }

  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return {
      title: 'Storage Full',
      message: 'Your browser storage is full. Please clear some data.',
      action: { type: 'clear-storage', label: 'Manage Storage' },
      canRetry: false,
    };
  }

  return {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again.',
    action: { type: 'retry', label: 'Try Again' },
    canRetry: true,
  };
}
```

### 5.2.3 Component-Level Error States

**File:** `src/components/ui/DataErrorState.tsx`

```typescript
interface DataErrorStateProps {
  error: UserFriendlyError;
  onRetry?: () => void;
  onAction?: (action: RecoveryAction) => void;
}

export function DataErrorState({ error, onRetry, onAction }: DataErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 rounded-lg">
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
      <h3 className="text-lg font-medium text-red-400">{error.title}</h3>
      <p className="text-sm text-red-400/70 mt-2 text-center max-w-md">
        {error.message}
      </p>
      <div className="flex gap-2 mt-4">
        {error.canRetry && onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
        {error.action && onAction && (
          <Button onClick={() => onAction(error.action)}>
            {error.action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## 5.3 Performance Optimization

### 5.3.1 Large Dataset Handling

**File:** `src/lib/largeDataHandler.ts`

```typescript
const CHUNK_SIZE = 10000;
const STREAMING_THRESHOLD = 50000;

export async function processLargeDataset(
  rawData: Record<string, unknown>[],
  processor: (chunk: Record<string, unknown>[]) => Promise<ProcessedChunk>
): Promise<ProcessedData> {
  if (rawData.length < STREAMING_THRESHOLD) {
    // Small dataset - process all at once
    return processor(rawData);
  }

  // Large dataset - process in chunks
  const results: ProcessedChunk[] = [];
  const totalChunks = Math.ceil(rawData.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, rawData.length);
    const chunk = rawData.slice(start, end);

    // Process chunk
    const result = await processor(chunk);
    results.push(result);

    // Report progress
    reportProgress((i + 1) / totalChunks);

    // Yield to UI thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return mergeChunks(results);
}
```

### 5.3.2 Web Worker for Heavy Processing

**File:** `src/workers/analysisWorker.ts`

```typescript
// Worker file
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'ANALYZE':
      try {
        const result = await runAnalysis(payload.data, payload.config);
        self.postMessage({ type: 'ANALYSIS_COMPLETE', result });
      } catch (error) {
        self.postMessage({ type: 'ANALYSIS_ERROR', error: error.message });
      }
      break;

    case 'TRAIN_ML':
      try {
        await trainModels(payload.data);
        self.postMessage({ type: 'TRAINING_COMPLETE' });
      } catch (error) {
        self.postMessage({ type: 'TRAINING_ERROR', error: error.message });
      }
      break;
  }
};
```

**Usage in hook:**

```typescript
export function useBackgroundAnalysis() {
  const workerRef = useRef<Worker | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/analysisWorker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'PROGRESS') {
        setProgress(e.data.progress);
      } else if (e.data.type === 'ANALYSIS_COMPLETE') {
        setResult(e.data.result);
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const analyze = useCallback((data: GameData) => {
    workerRef.current?.postMessage({ type: 'ANALYZE', payload: { data } });
  }, []);

  return { analyze, progress, result };
}
```

### 5.3.3 Virtualized Lists

**File:** `src/components/ui/VirtualizedTable.tsx`

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 40,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TableRow data={data[virtualRow.index]} columns={columns} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5.4 Documentation

### 5.4.1 JSDoc for Core Functions

```typescript
/**
 * Creates a smart data provider that uses real data when available,
 * falling back to demo data when not.
 *
 * @param category - The game category (puzzle, idle, battle_royale, etc.)
 * @param gameData - The uploaded game data, or null for demo mode
 * @returns An IDataProvider implementation
 *
 * @example
 * ```ts
 * const provider = createSmartDataProvider('puzzle', activeGameData);
 * const kpis = provider.getKPIData();
 * const retention = provider.getRetentionData();
 * ```
 */
export function createSmartDataProvider(
  category: GameCategory,
  gameData: GameData | null
): IDataProvider {
  // ...
}

/**
 * Extracts user features from raw game data for ML model consumption.
 *
 * @param gameData - The uploaded game data with column mappings
 * @returns Array of user features for each unique user
 *
 * @remarks
 * Requires at least a user_id column to be mapped.
 * Will derive features from available columns:
 * - timestamp → daysActive, sessionTrend
 * - revenue → isPayer, totalSpend, purchaseCount
 * - level → currentLevel, progressionSpeed
 * - duration → avgSessionLength
 */
export function extractAllUserFeatures(gameData: GameData): UserFeatures[] {
  // ...
}
```

### 5.4.2 Component Documentation

**File:** `src/components/README.md`

```markdown
# Components

## Data Flow Components

### DataModeIndicator
Shows current data mode (Demo/Your Data) in the sidebar.

### DataQualityBadge
Displays data quality score with issue tooltips.

### EmptyState
Standard empty state with CTA for data upload.

## Chart Components

### ChartRenderer
Auto-renders charts based on ChartRecommendation type.

### RetentionCurve, FunnelChart, RevenueChart, SegmentChart
Specialized chart components for game analytics.

## ML Components

### MLStatusBadge
Shows ML model training status.

### ChurnRiskTable
Displays users at risk of churning with actions.

### RecommendationActions
Shows AI-generated recommendations with impact estimates.
```

---

## 5.5 Production Checklist

### 5.5.1 Pre-Launch Checklist

- [ ] All mock data replaced with real data when available
- [ ] All placeholder pages implemented
- [ ] Error boundaries on all routes
- [ ] Loading states for all async operations
- [ ] Empty states with helpful CTAs
- [ ] Data mode indicator visible throughout
- [ ] ML status visible when relevant
- [ ] Performance tested with 100k row dataset
- [ ] Accessibility audit passed
- [ ] i18n strings complete for all new features

### 5.5.2 Monitoring Setup

**File:** `src/lib/monitoring.ts`

```typescript
export function initMonitoring() {
  // Performance monitoring
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const timing = performance.getEntriesByType('navigation')[0];
      reportMetric('page_load', timing.loadEventEnd - timing.startTime);
    });
  }

  // Error monitoring
  window.addEventListener('error', (event) => {
    reportError(event.error, {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { type: 'unhandled_promise' });
  });

  // Storage usage monitoring
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then((estimate) => {
      reportMetric('storage_usage', {
        used: estimate.usage,
        quota: estimate.quota,
        percent: (estimate.usage / estimate.quota) * 100,
      });
    });
  }
}
```

---

## Files to Create

- [ ] `src/lib/__tests__/realDataProvider.test.ts`
- [ ] `src/ai/ml/__tests__/FeatureExtractor.test.ts`
- [ ] `tests/integration/data-flow.test.ts`
- [ ] `tests/e2e/full-workflow.spec.ts`
- [ ] `src/lib/errorHandling.ts`
- [ ] `src/components/ui/DataErrorState.tsx`
- [ ] `src/lib/largeDataHandler.ts`
- [ ] `src/workers/analysisWorker.ts`
- [ ] `src/hooks/useBackgroundAnalysis.ts`
- [ ] `src/components/ui/VirtualizedTable.tsx`
- [ ] `src/lib/monitoring.ts`

## Files to Modify

- [ ] `src/components/ErrorBoundary.tsx` - Enhanced recovery
- [ ] `package.json` - Add test dependencies
- [ ] `vitest.config.ts` - Coverage configuration
- [ ] `playwright.config.ts` - E2E configuration

## Success Criteria

- [ ] 90%+ test coverage on critical paths
- [ ] All errors handled gracefully with user-friendly messages
- [ ] Page loads in <3s with 100k row dataset
- [ ] No UI freezing during heavy processing
- [ ] All components have JSDoc documentation
- [ ] Monitoring captures errors and performance
- [ ] Production checklist complete
