# Phase 4: Advanced Features & Placeholder Pages

**Goal:** Complete all partial implementations and make placeholder pages functional

## Overview

This phase addresses:
1. Placeholder pages (6 pages showing "Coming soon")
2. Incomplete features (ML Studio, Folder Upload)
3. Advanced features (Custom Metrics, Natural Language Query)

---

## 4.1 Complete Placeholder Pages

### 4.1.1 Explore Page (Query Builder)

**File:** `src/pages/Explore.tsx`
**Current State:** Placeholder

**Implementation:**

```typescript
function ExplorePage() {
  const { rawData, columns, hasRealData } = useGameData();
  const [query, setQuery] = useState<QueryDefinition | null>(null);
  const [results, setResults] = useState<QueryResult | null>(null);

  // Query builder state
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [aggregation, setAggregation] = useState<Aggregation>('count');
  const [sortBy, setSortBy] = useState<SortConfig | null>(null);
  const [limit, setLimit] = useState(100);

  // Execute query
  const executeQuery = useCallback(() => {
    const queryEngine = new QueryEngine(rawData);
    const result = queryEngine
      .select(selectedColumns)
      .filter(filters)
      .groupBy(groupBy)
      .aggregate(aggregation)
      .sort(sortBy)
      .limit(limit)
      .execute();

    setResults(result);
  }, [rawData, selectedColumns, filters, groupBy, aggregation, sortBy, limit]);

  if (!hasRealData) {
    return (
      <EmptyState
        title="Upload Data to Explore"
        description="The query builder needs data to work with"
        action={<Button onClick={() => navigate('/upload')}>Upload Data</Button>}
      />
    );
  }

  return (
    <div className="flex h-full">
      {/* Query Builder Panel */}
      <div className="w-80 border-r p-4">
        <h3>Build Query</h3>

        <Section title="Select Columns">
          <ColumnSelector
            columns={columns}
            selected={selectedColumns}
            onChange={setSelectedColumns}
          />
        </Section>

        <Section title="Filters">
          <FilterBuilder
            columns={columns}
            filters={filters}
            onChange={setFilters}
          />
        </Section>

        <Section title="Group By">
          <ColumnSelect
            columns={columns.filter(c => c.dataType === 'string')}
            value={groupBy}
            onChange={setGroupBy}
          />
        </Section>

        <Section title="Aggregation">
          <AggregationSelect
            value={aggregation}
            onChange={setAggregation}
          />
        </Section>

        <Button onClick={executeQuery}>Run Query</Button>
      </div>

      {/* Results Panel */}
      <div className="flex-1 p-4">
        {results && (
          <>
            <ResultsTable data={results.rows} columns={results.columns} />
            <ResultsChart data={results} />
            <ExportButton results={results} />
          </>
        )}
      </div>
    </div>
  );
}
```

**New File:** `src/lib/queryEngine.ts`

```typescript
export class QueryEngine {
  private data: Record<string, unknown>[];
  private pipeline: QueryStep[] = [];

  constructor(data: Record<string, unknown>[]) {
    this.data = data;
  }

  select(columns: string[]): this {
    this.pipeline.push({ type: 'select', columns });
    return this;
  }

  filter(filters: Filter[]): this {
    this.pipeline.push({ type: 'filter', filters });
    return this;
  }

  groupBy(column: string | null): this {
    if (column) {
      this.pipeline.push({ type: 'groupBy', column });
    }
    return this;
  }

  aggregate(agg: Aggregation): this {
    this.pipeline.push({ type: 'aggregate', aggregation: agg });
    return this;
  }

  sort(config: SortConfig | null): this {
    if (config) {
      this.pipeline.push({ type: 'sort', config });
    }
    return this;
  }

  limit(n: number): this {
    this.pipeline.push({ type: 'limit', count: n });
    return this;
  }

  execute(): QueryResult {
    let result = [...this.data];

    for (const step of this.pipeline) {
      result = this.applyStep(result, step);
    }

    return {
      rows: result,
      columns: this.getResultColumns(),
      rowCount: result.length,
      executionTime: performance.now(),
    };
  }

  private applyStep(data: Record<string, unknown>[], step: QueryStep) {
    switch (step.type) {
      case 'filter':
        return data.filter(row => this.matchesFilters(row, step.filters));
      case 'groupBy':
        return this.groupData(data, step.column);
      case 'aggregate':
        return this.aggregateData(data, step.aggregation);
      case 'sort':
        return this.sortData(data, step.config);
      case 'limit':
        return data.slice(0, step.count);
      default:
        return data;
    }
  }
}
```

---

### 4.1.2 Engagement Page

**File:** `src/pages/Engagement.tsx`
**Current State:** Placeholder

**Implementation:**

```typescript
function EngagementPage() {
  const { dataProvider, hasRealData, dataMode } = useGameData();

  const engagementMetrics = useMemo(() => ({
    dau: dataProvider.getDAU(),
    wau: dataProvider.getWAU(),
    mau: dataProvider.getMAU(),
    dauMauRatio: dataProvider.getDAU() / dataProvider.getMAU(),
    avgSessionLength: dataProvider.getAvgSessionLength(),
    sessionsPerUser: dataProvider.getSessionsPerUser(),
    avgSessionsPerDay: dataProvider.getAvgSessionsPerDay(),
  }), [dataProvider]);

  const sessionDistribution = useMemo(() =>
    dataProvider.getSessionLengthDistribution(),
    [dataProvider]
  );

  const activeUsersTrend = useMemo(() =>
    dataProvider.getActiveUsersTrend(30),
    [dataProvider]
  );

  const stickiness = useMemo(() =>
    dataProvider.calculateStickiness(),
    [dataProvider]
  );

  return (
    <div className="space-y-6">
      <DataModeBadge mode={dataMode} />

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="DAU" value={formatNumber(engagementMetrics.dau)} />
        <KPICard title="WAU" value={formatNumber(engagementMetrics.wau)} />
        <KPICard title="MAU" value={formatNumber(engagementMetrics.mau)} />
        <KPICard
          title="DAU/MAU Ratio"
          value={formatPercent(engagementMetrics.dauMauRatio)}
          subtitle="Stickiness"
        />
      </div>

      {/* Session Metrics */}
      <Card>
        <h2>Session Metrics</h2>
        <div className="grid grid-cols-3 gap-4">
          <Metric
            label="Avg Session Length"
            value={formatDuration(engagementMetrics.avgSessionLength)}
          />
          <Metric
            label="Sessions per User"
            value={engagementMetrics.sessionsPerUser.toFixed(1)}
          />
          <Metric
            label="Avg Sessions/Day"
            value={engagementMetrics.avgSessionsPerDay.toFixed(1)}
          />
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h3>Active Users Trend</h3>
          <LineChart data={activeUsersTrend} />
        </Card>
        <Card>
          <h3>Session Length Distribution</h3>
          <HistogramChart data={sessionDistribution} />
        </Card>
      </div>

      {/* Stickiness Analysis */}
      <Card>
        <h3>User Stickiness Analysis</h3>
        <StickinessChart data={stickiness} />
      </Card>
    </div>
  );
}
```

---

### 4.1.3 Distributions Page

**File:** `src/pages/Distributions.tsx`
**Current State:** Placeholder (marked Beta)

**Implementation:**

```typescript
function DistributionsPage() {
  const { rawData, columns, hasRealData } = useGameData();
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  const numericColumns = useMemo(() =>
    columns.filter(c => c.dataType === 'number'),
    [columns]
  );

  const distribution = useMemo(() => {
    if (!selectedColumn) return null;
    return calculateDistribution(rawData, selectedColumn);
  }, [rawData, selectedColumn]);

  const statistics = useMemo(() => {
    if (!selectedColumn) return null;
    return calculateStatistics(rawData, selectedColumn);
  }, [rawData, selectedColumn]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Data Distributions</h1>
        <Badge variant="info">Beta</Badge>
      </div>

      <Card>
        <h3>Select Column to Analyze</h3>
        <Select
          options={numericColumns.map(c => ({
            value: c.originalName,
            label: c.canonicalName || c.originalName,
          }))}
          value={selectedColumn}
          onChange={setSelectedColumn}
        />
      </Card>

      {distribution && (
        <>
          {/* Statistics Summary */}
          <Card>
            <h3>Statistics</h3>
            <div className="grid grid-cols-5 gap-4">
              <Stat label="Count" value={statistics.count} />
              <Stat label="Mean" value={statistics.mean.toFixed(2)} />
              <Stat label="Median" value={statistics.median.toFixed(2)} />
              <Stat label="Std Dev" value={statistics.stdDev.toFixed(2)} />
              <Stat label="Range" value={`${statistics.min} - ${statistics.max}`} />
            </div>
          </Card>

          {/* Histogram */}
          <Card>
            <h3>Distribution Histogram</h3>
            <HistogramChart
              data={distribution.histogram}
              buckets={20}
            />
          </Card>

          {/* Box Plot */}
          <Card>
            <h3>Box Plot</h3>
            <BoxPlot
              min={statistics.min}
              q1={statistics.q1}
              median={statistics.median}
              q3={statistics.q3}
              max={statistics.max}
              outliers={statistics.outliers}
            />
          </Card>

          {/* Percentiles */}
          <Card>
            <h3>Percentiles</h3>
            <PercentilesTable percentiles={statistics.percentiles} />
          </Card>
        </>
      )}
    </div>
  );
}
```

---

### 4.1.4 Health Page (SDK Health)

**File:** `src/pages/Health.tsx`
**Current State:** Placeholder

**Implementation:**

```typescript
function HealthPage() {
  const { analysisResult, hasRealData } = useGameData();
  const { integrations } = useIntegrations();

  // Data quality from analysis
  const dataQuality = analysisResult?.quality ?? null;

  // Integration health status
  const integrationHealth = useMemo(() =>
    integrations.map(i => ({
      name: i.name,
      type: i.type,
      status: i.lastSync ? 'connected' : 'disconnected',
      lastSync: i.lastSync,
      errorCount: i.errorCount ?? 0,
    })),
    [integrations]
  );

  // Schema validation issues
  const schemaIssues = analysisResult?.schema?.issues ?? [];

  return (
    <div className="space-y-6">
      <h1>Data Health Dashboard</h1>

      {/* Overall Health Score */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2>Overall Health Score</h2>
            <p className="text-sm text-muted">
              Based on data quality, completeness, and freshness
            </p>
          </div>
          <HealthScore score={dataQuality?.score ?? 100} size="lg" />
        </div>
      </Card>

      {/* Data Quality Issues */}
      <Card>
        <h3>Data Quality Issues</h3>
        {dataQuality?.issues.length === 0 ? (
          <EmptyState title="No issues detected" icon={CheckCircle} />
        ) : (
          <IssuesList issues={dataQuality?.issues ?? []} />
        )}
      </Card>

      {/* Integration Status */}
      <Card>
        <h3>Integration Health</h3>
        <IntegrationHealthTable integrations={integrationHealth} />
      </Card>

      {/* Schema Validation */}
      <Card>
        <h3>Schema Validation</h3>
        <SchemaIssuesTable issues={schemaIssues} />
      </Card>

      {/* Data Freshness */}
      <Card>
        <h3>Data Freshness</h3>
        <DataFreshnessIndicator
          lastUpdated={analysisResult?.metadata?.analyzedAt}
          rowCount={analysisResult?.metadata?.rowCount}
        />
      </Card>
    </div>
  );
}
```

---

### 4.1.5 User Analysis Page (Cohort Analysis)

**File:** `src/pages/UserAnalysis.tsx`
**Current State:** Placeholder

**Implementation:**

```typescript
function UserAnalysisPage() {
  const { dataProvider, analysisResult, hasRealData } = useGameData();
  const { segments } = useML();
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  // Get cohort data from analysis
  const cohorts = analysisResult?.cohorts ?? [];

  // User segments from ML
  const userSegments = segments?.predefined ?? {};

  return (
    <div className="space-y-6">
      <h1>User Analysis</h1>

      {/* Segment Overview */}
      <Card>
        <h3>User Segments</h3>
        <SegmentPieChart segments={userSegments} />
        <SegmentTable
          segments={userSegments}
          onSegmentClick={setSelectedCohort}
        />
      </Card>

      {/* Cohort Retention Matrix */}
      <Card>
        <h3>Cohort Retention</h3>
        <CohortRetentionMatrix cohorts={cohorts} />
      </Card>

      {/* Selected Cohort Deep Dive */}
      {selectedCohort && (
        <Card>
          <h3>Cohort: {selectedCohort}</h3>
          <CohortDetails
            cohort={cohorts.find(c => c.name === selectedCohort)}
            users={userSegments[selectedCohort]}
          />
        </Card>
      )}

      {/* User Lifecycle */}
      <Card>
        <h3>User Lifecycle Stages</h3>
        <LifecycleFunnel data={dataProvider.getUserLifecycleData()} />
      </Card>
    </div>
  );
}
```

---

### 4.1.6 Remote Configs Page

**File:** `src/pages/RemoteConfigs.tsx`
**Current State:** Placeholder

**Implementation:**

```typescript
function RemoteConfigsPage() {
  const [configs, setConfigs] = useState<RemoteConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<RemoteConfig | null>(null);

  // Remote configs are typically managed externally
  // This page provides a view/documentation of what configs affect analytics

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Remote Configurations</h1>
        <Button onClick={() => setSelectedConfig({} as RemoteConfig)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Config
        </Button>
      </div>

      <Banner variant="info">
        Remote configs let you change game behavior without app updates.
        Track how config changes affect your metrics.
      </Banner>

      {/* Config List */}
      <Card>
        <h3>Active Configurations</h3>
        <ConfigsTable
          configs={configs}
          onEdit={setSelectedConfig}
          onViewImpact={(config) => navigate(`/analytics?config=${config.id}`)}
        />
      </Card>

      {/* Config Editor Modal */}
      {selectedConfig && (
        <ConfigEditorModal
          config={selectedConfig}
          onSave={handleSaveConfig}
          onClose={() => setSelectedConfig(null)}
        />
      )}

      {/* Config Change History */}
      <Card>
        <h3>Change History</h3>
        <ConfigHistoryTimeline configs={configs} />
      </Card>
    </div>
  );
}
```

---

## 4.2 Complete ML Studio

**File:** `src/pages/MLStudio.tsx`
**Current State:** UI only, backend uses simplified simulation

**Enhancement:**

```typescript
function MLStudioPage() {
  const { activeGameData, hasRealData } = useGameData();
  const { trainModels, isTraining } = useML();
  const [jobs, setJobs] = useState<TrainingJob[]>([]);

  // Train on real data
  const handleTrainModel = async (modelType: string) => {
    if (!activeGameData) return;

    const job: TrainingJob = {
      id: nanoid(),
      modelType,
      status: 'running',
      startedAt: new Date(),
      progress: 0,
    };

    setJobs(prev => [...prev, job]);

    try {
      // Use MLService for real training
      await mlService.trainSpecificModel(modelType, activeGameData);

      setJobs(prev =>
        prev.map(j =>
          j.id === job.id
            ? { ...j, status: 'completed', completedAt: new Date(), progress: 100 }
            : j
        )
      );
    } catch (error) {
      setJobs(prev =>
        prev.map(j =>
          j.id === job.id
            ? { ...j, status: 'failed', error: error.message }
            : j
        )
      );
    }
  };

  // Model evaluation metrics
  const modelMetrics = useMemo(() =>
    mlService.getModelStatus(),
    [jobs]
  );

  return (
    <div className="space-y-6">
      <h1>ML Studio</h1>

      {!hasRealData && (
        <Banner variant="warning">
          Upload data to train ML models on your game's data
        </Banner>
      )}

      {/* Available Models */}
      <Card>
        <h3>Available Models</h3>
        <div className="grid grid-cols-3 gap-4">
          {MODEL_TYPES.map(model => (
            <ModelCard
              key={model.type}
              model={model}
              status={modelMetrics.modelVersions[model.type]}
              onTrain={() => handleTrainModel(model.type)}
              isTraining={isTraining}
            />
          ))}
        </div>
      </Card>

      {/* Training Jobs */}
      <Card>
        <h3>Training Jobs</h3>
        <TrainingJobsTable jobs={jobs} />
      </Card>

      {/* Model Performance */}
      <Card>
        <h3>Model Performance</h3>
        <ModelPerformanceCharts metrics={modelMetrics} />
      </Card>
    </div>
  );
}
```

---

## 4.3 Complete Folder Upload

**File:** `src/lib/importers/folderImporter.ts`
**Current State:** Interfaces exist but merge logic incomplete

**Implementation:**

```typescript
export async function importFolder(
  files: File[],
  strategy: MergeStrategy = 'union'
): Promise<ImportResult> {
  // Parse all files
  const parsedFiles = await Promise.all(
    files.map(async file => ({
      name: file.name,
      data: await parseFile(file),
      columns: extractColumns(await parseFile(file)),
    }))
  );

  // Analyze column compatibility
  const compatibility = analyzeColumnCompatibility(parsedFiles);

  if (!compatibility.isCompatible) {
    throw new ImportError(
      `Files have incompatible schemas: ${compatibility.issues.join(', ')}`
    );
  }

  // Merge based on strategy
  let mergedData: Record<string, unknown>[];

  switch (strategy) {
    case 'union':
      // Combine all rows, fill missing columns with null
      mergedData = mergeUnion(parsedFiles);
      break;

    case 'intersection':
      // Only keep common columns
      mergedData = mergeIntersection(parsedFiles, compatibility.commonColumns);
      break;

    case 'append':
      // Stack rows vertically (require same columns)
      mergedData = mergeAppend(parsedFiles);
      break;

    case 'join':
      // Join on common key column
      mergedData = mergeJoin(parsedFiles, compatibility.keyColumn);
      break;

    default:
      throw new ImportError(`Unknown merge strategy: ${strategy}`);
  }

  return {
    success: true,
    rawData: mergedData,
    metadata: {
      source: 'folder',
      fileCount: files.length,
      fileNames: files.map(f => f.name),
      mergeStrategy: strategy,
    },
    rowCount: mergedData.length,
  };
}

function analyzeColumnCompatibility(files: ParsedFile[]): CompatibilityResult {
  const allColumns = new Set<string>();
  const columnCounts = new Map<string, number>();

  for (const file of files) {
    for (const col of file.columns) {
      allColumns.add(col);
      columnCounts.set(col, (columnCounts.get(col) ?? 0) + 1);
    }
  }

  const commonColumns = [...allColumns].filter(
    col => columnCounts.get(col) === files.length
  );

  const keyColumn = commonColumns.find(col =>
    col.includes('id') || col.includes('user')
  );

  return {
    isCompatible: commonColumns.length > 0,
    commonColumns,
    allColumns: [...allColumns],
    keyColumn,
    issues: commonColumns.length === 0 ? ['No common columns found'] : [],
  };
}

function mergeUnion(files: ParsedFile[]): Record<string, unknown>[] {
  const allColumns = new Set<string>();
  files.forEach(f => f.columns.forEach(c => allColumns.add(c)));

  return files.flatMap(file =>
    file.data.map(row => {
      const merged: Record<string, unknown> = { __source: file.name };
      for (const col of allColumns) {
        merged[col] = row[col] ?? null;
      }
      return merged;
    })
  );
}
```

---

## 4.4 Complete Custom Metrics Execution

**File:** `src/lib/customMetrics.ts`

The Custom Metrics Builder has UI but no formula execution:

```typescript
export class MetricEngine {
  private data: Record<string, unknown>[];

  constructor(data: Record<string, unknown>[]) {
    this.data = data;
  }

  // Execute a custom metric formula
  execute(formula: MetricFormula): MetricResult {
    const baseValue = this.calculateBase(formula.base, formula.filter);

    let result = baseValue;

    for (const op of formula.operations) {
      result = this.applyOperation(result, op);
    }

    return {
      value: result,
      formatted: this.format(result, formula.format),
      metadata: {
        baseMetric: formula.base,
        rowsProcessed: this.data.length,
        formula: formula.expression,
      },
    };
  }

  private calculateBase(base: BaseMetric, filter?: Filter): number {
    let data = this.data;

    if (filter) {
      data = data.filter(row => this.matchesFilter(row, filter));
    }

    switch (base.aggregation) {
      case 'sum':
        return data.reduce((sum, row) => sum + (Number(row[base.column]) || 0), 0);
      case 'avg':
        return data.reduce((sum, row) => sum + (Number(row[base.column]) || 0), 0) / data.length;
      case 'count':
        return data.length;
      case 'unique':
        return new Set(data.map(row => row[base.column])).size;
      case 'min':
        return Math.min(...data.map(row => Number(row[base.column]) || 0));
      case 'max':
        return Math.max(...data.map(row => Number(row[base.column]) || 0));
      default:
        return 0;
    }
  }

  private applyOperation(value: number, op: Operation): number {
    switch (op.type) {
      case 'divide':
        const divisor = typeof op.value === 'number'
          ? op.value
          : this.calculateBase(op.value);
        return divisor !== 0 ? value / divisor : 0;
      case 'multiply':
        return value * (typeof op.value === 'number' ? op.value : this.calculateBase(op.value));
      case 'add':
        return value + (typeof op.value === 'number' ? op.value : this.calculateBase(op.value));
      case 'subtract':
        return value - (typeof op.value === 'number' ? op.value : this.calculateBase(op.value));
      default:
        return value;
    }
  }

  private format(value: number, format: FormatType): string {
    switch (format) {
      case 'number':
        return value.toLocaleString();
      case 'percent':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'duration':
        return formatDuration(value);
      default:
        return String(value);
    }
  }
}
```

---

## Files to Create

- [ ] `src/pages/Explore.tsx` (full implementation)
- [ ] `src/pages/Engagement.tsx` (full implementation)
- [ ] `src/pages/Distributions.tsx` (full implementation)
- [ ] `src/pages/Health.tsx` (full implementation)
- [ ] `src/pages/UserAnalysis.tsx` (full implementation)
- [ ] `src/pages/RemoteConfigs.tsx` (full implementation)
- [ ] `src/lib/queryEngine.ts`
- [ ] `src/lib/customMetrics.ts`
- [ ] `src/components/explore/QueryBuilder.tsx`
- [ ] `src/components/distributions/BoxPlot.tsx`
- [ ] `src/components/health/HealthScore.tsx`

## Files to Modify

- [ ] `src/lib/importers/folderImporter.ts` - Complete merge logic
- [ ] `src/pages/MLStudio.tsx` - Connect to real training
- [ ] `src/components/analytics/CustomMetricsBuilder.tsx` - Use MetricEngine

## Success Criteria

- [ ] All 6 placeholder pages fully functional
- [ ] Explore page can query uploaded data
- [ ] Engagement metrics calculated from real data
- [ ] Distribution analysis works for any numeric column
- [ ] Health page shows data quality issues
- [ ] User Analysis shows cohorts and segments
- [ ] Folder upload merges multiple files correctly
- [ ] Custom metrics execute formulas on real data
- [ ] ML Studio trains real models
