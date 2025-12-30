# Phase 2: Page-by-Page Functionality

**Goal:** Wire up each mock page to use real user data via the Phase 1 infrastructure

## Overview

This phase converts 8 pages from mock data to real data. Each section includes:
- Current state analysis
- Required changes
- Testing requirements

---

## 2.1 Monetization Page

**File:** `src/pages/Monetization.tsx`
**Current State:** Uses hardcoded `revenueData` object (lines 12-76)

### Changes Required

```typescript
// BEFORE (mock data)
const revenueData = {
  puzzle: { whale: { revenue: '$2.4M', pct: 45 }, ... },
  ...
};

// AFTER (real data)
import { useGameData } from '@/hooks/useGameData';

function MonetizationPage() {
  const { dataProvider, hasRealData, dataMode } = useGameData();

  const spenderTiers = useMemo(() => {
    if (!hasRealData) return getDefaultSpenderTiers(selectedGame);
    return dataProvider.getSpenderTiers();
  }, [dataProvider, hasRealData]);

  const revenueTimeSeries = useMemo(() =>
    dataProvider.getRevenueTimeSeries('daily'),
    [dataProvider]
  );

  const arpu = useMemo(() =>
    dataProvider.calculateARPU(),
    [dataProvider]
  );

  // Render with real data
  return (
    <PageHeader badge={<DataModeBadge mode={dataMode} />}>
      <SpenderTierChart data={spenderTiers} />
      <RevenueChart data={revenueTimeSeries} />
      <KPICard title="ARPU" value={arpu} />
    </PageHeader>
  );
}
```

### New RealDataProvider Methods

```typescript
// In realDataProvider.ts
getSpenderTiers(): SpenderTier[] {
  const userRevenue = this.calculatePerUserRevenue();
  return [
    { tier: 'Whale', threshold: 100, users: this.countUsersAbove(userRevenue, 100), revenue: this.sumAbove(userRevenue, 100) },
    { tier: 'Dolphin', threshold: 20, users: this.countUsersInRange(userRevenue, 20, 100), revenue: this.sumRange(userRevenue, 20, 100) },
    { tier: 'Minnow', threshold: 1, users: this.countUsersInRange(userRevenue, 1, 20), revenue: this.sumRange(userRevenue, 1, 20) },
    { tier: 'Non-Payer', threshold: 0, users: this.countUsersEqual(userRevenue, 0), revenue: 0 },
  ];
}

calculateARPU(): number {
  const totalRevenue = this.sumColumn('revenue');
  const uniqueUsers = this.countUnique('user_id');
  return uniqueUsers > 0 ? totalRevenue / uniqueUsers : 0;
}
```

---

## 2.2 Funnels Page

**File:** `src/pages/Funnels.tsx`
**Current State:** Uses `funnelTemplates` object (lines 26-68)

### Changes Required

```typescript
// BEFORE (templates only)
const funnelTemplates = {
  puzzle: [{ name: 'Onboarding', steps: [...] }],
  ...
};

// AFTER (real + detected funnels)
function FunnelsPage() {
  const { dataProvider, analysisResult, dataMode } = useGameData();

  // Use detected funnels from AI pipeline
  const detectedFunnels = useMemo(() => {
    if (!analysisResult?.funnels) return [];
    return analysisResult.funnels.detected;
  }, [analysisResult]);

  // Get real funnel data for each detected funnel
  const funnelData = useMemo(() =>
    detectedFunnels.map(f => ({
      ...f,
      steps: dataProvider.calculateFunnelSteps(f.steps),
    })),
    [detectedFunnels, dataProvider]
  );

  // Show empty state if no funnels detected
  if (detectedFunnels.length === 0 && dataMode === 'real') {
    return <NoFunnelsDetected onCreateManual={() => navigate('/funnel-builder')} />;
  }

  return (
    <FunnelList
      funnels={funnelData}
      templateFunnels={funnelTemplates[selectedGame]}
      mode={dataMode}
    />
  );
}
```

### New RealDataProvider Methods

```typescript
calculateFunnelSteps(stepDefinitions: FunnelStepDef[]): FunnelStep[] {
  return stepDefinitions.map((step, i) => {
    const count = this.countMatchingRows(step.condition);
    const prevCount = i === 0 ? count : this.previousStepCount;
    return {
      name: step.name,
      count,
      conversionRate: prevCount > 0 ? count / prevCount : 0,
      dropoff: prevCount - count,
    };
  });
}
```

---

## 2.3 Realtime Page

**File:** `src/pages/Realtime.tsx`
**Current State:** Uses `generateLiveData()` with random variance

### Changes Required

This page needs a different approach - real "realtime" data requires:
1. **Option A:** Poll uploaded data for "recent" entries
2. **Option B:** Connect to live data source (Firebase, Supabase)
3. **Option C:** Simulate with uploaded data patterns

**Implementation (Option C - Practical for MVP):**

```typescript
function RealtimePage() {
  const { dataProvider, hasRealData, dataMode } = useGameData();
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);

  // Simulate realtime by animating through uploaded data patterns
  useEffect(() => {
    if (!hasRealData) {
      // Demo mode: continue random generation
      return setupDemoRealtime(setLiveMetrics);
    }

    // Real mode: Use data patterns to simulate realistic updates
    const patterns = dataProvider.extractTimePatterns();
    return setupPatternBasedRealtime(patterns, setLiveMetrics);
  }, [hasRealData, dataProvider]);

  return (
    <div>
      <DataModeBadge mode={dataMode} variant="realtime" />
      {dataMode === 'demo' && (
        <Banner variant="info">
          Connect a live data source for real-time analytics
          <Button onClick={() => navigate('/integrations')}>Connect</Button>
        </Banner>
      )}
      <RealtimeGrid metrics={liveMetrics} />
    </div>
  );
}
```

---

## 2.4 Dashboard Builder

**File:** `src/pages/DashboardBuilder.tsx`
**Current State:** Uses `getMockMetricValue()` and `getMockChartData()`

### Changes Required

```typescript
// In dashboardStore.ts - Replace mock functions

// BEFORE
function getMockMetricValue(metricType: string): number {
  // Hardcoded values
}

// AFTER
function getMetricValue(metricType: string, dataProvider: IDataProvider): number {
  switch (metricType) {
    case 'dau': return dataProvider.getDAU();
    case 'mau': return dataProvider.getMAU();
    case 'arpu': return dataProvider.calculateARPU();
    case 'revenue': return dataProvider.getTotalRevenue();
    case 'd1_retention': return dataProvider.getRetentionData()[0]?.value ?? 0;
    case 'd7_retention': return dataProvider.getRetentionData()[6]?.value ?? 0;
    default: return 0;
  }
}

function getChartData(chartType: string, dataProvider: IDataProvider): ChartData {
  switch (chartType) {
    case 'retention': return dataProvider.getRetentionData();
    case 'revenue': return dataProvider.getRevenueTimeSeries('daily');
    case 'funnel': return dataProvider.getFunnelData();
    case 'segment': return dataProvider.getSegmentData();
    default: return [];
  }
}
```

**In DashboardBuilder.tsx:**

```typescript
function DashboardBuilder() {
  const { dataProvider, dataMode } = useGameData();

  // Pass dataProvider to widget renderers
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'kpi':
        return <KPIWidget
          metric={widget.config.metric}
          value={getMetricValue(widget.config.metric, dataProvider)}
          mode={dataMode}
        />;
      case 'line_chart':
        return <ChartWidget
          data={getChartData(widget.config.chartType, dataProvider)}
          mode={dataMode}
        />;
    }
  };
}
```

---

## 2.5 A/B Testing Page

**File:** `src/pages/ABTesting.tsx`
**Current State:** Uses `generateMockResults()` in experimentStore

### Changes Required

A/B testing requires tracking data. Two approaches:

**Approach A: Infer from uploaded data (if variant column exists)**

```typescript
function ABTestingPage() {
  const { dataProvider, analysisResult, dataMode } = useGameData();
  const { experiments } = useExperimentStore();

  // Check if uploaded data has variant/experiment columns
  const hasExperimentData = useMemo(() => {
    const columns = analysisResult?.schema?.columns ?? [];
    return columns.some(c =>
      c.semanticType === 'experiment_variant' ||
      c.name.includes('variant') ||
      c.name.includes('ab_test')
    );
  }, [analysisResult]);

  // Calculate real results if data exists
  const experimentResults = useMemo(() => {
    if (!hasExperimentData) return null;
    return dataProvider.calculateExperimentResults();
  }, [hasExperimentData, dataProvider]);

  // Show appropriate UI
  if (!hasExperimentData && dataMode === 'real') {
    return (
      <EmptyState
        title="No Experiment Data Found"
        description="Your data doesn't contain A/B test variants"
        action={<Button>Learn how to add experiment tracking</Button>}
      />
    );
  }

  return <ExperimentDashboard results={experimentResults} />;
}
```

**Approach B: Manual experiment definition with metric comparison**

```typescript
// User defines experiment on metric, we calculate difference
const calculateExperimentResult = (
  experiment: Experiment,
  dataProvider: IDataProvider
): ExperimentResult => {
  const metricA = dataProvider.calculateMetric(experiment.metric, {
    filter: experiment.controlFilter
  });
  const metricB = dataProvider.calculateMetric(experiment.metric, {
    filter: experiment.variantFilter
  });

  return {
    control: metricA,
    variant: metricB,
    lift: (metricB - metricA) / metricA,
    significance: calculateSignificance(metricA, metricB, experiment.sampleSize),
  };
};
```

---

## 2.6 What-If Analysis Page

**File:** `src/pages/WhatIf.tsx`
**Current State:** Uses `DEFAULT_BASELINE` hardcoded metrics

### Changes Required

```typescript
// BEFORE
const DEFAULT_BASELINE = {
  dau: 10000,
  mau: 50000,
  arpu: 0.50,
  d1Retention: 0.40,
  d7Retention: 0.20,
  d30Retention: 0.08,
};

// AFTER
function WhatIfPage() {
  const { dataProvider, hasRealData, dataMode } = useGameData();

  // Calculate baseline from real data
  const baseline = useMemo(() => {
    if (!hasRealData) return DEFAULT_BASELINE;

    return {
      dau: dataProvider.getDAU(),
      mau: dataProvider.getMAU(),
      arpu: dataProvider.calculateARPU(),
      d1Retention: dataProvider.getRetentionDay(1),
      d7Retention: dataProvider.getRetentionDay(7),
      d30Retention: dataProvider.getRetentionDay(30),
      avgSessionLength: dataProvider.getAvgSessionLength(),
      conversion: dataProvider.getPayerConversion(),
    };
  }, [dataProvider, hasRealData]);

  return (
    <WhatIfSimulator
      baseline={baseline}
      isRealBaseline={hasRealData}
      onScenarioChange={handleScenarioChange}
    />
  );
}
```

**Update WhatIfEngine.ts:**

```typescript
// Add method to use real baseline
setRealBaseline(metrics: BaselineMetrics): void {
  this.baseline = metrics;
  this.isRealBaseline = true;
}

// Improve projections with historical data
projectRevenue(scenario: Scenario): ProjectionResult {
  const historicalGrowth = this.dataProvider?.getHistoricalGrowthRate() ?? 0.02;
  // Use historical patterns for more accurate projections
}
```

---

## 2.7 Predictions Page

**File:** `src/pages/Predictions.tsx`
**Current State:** Uses `generateForecast()` function

### Changes Required

This page should use ML models from Phase 3. For now, connect to real data:

```typescript
function PredictionsPage() {
  const { dataProvider, hasRealData, analysisResult } = useGameData();

  // Get historical data for forecasting
  const historicalRevenue = useMemo(() =>
    dataProvider.getRevenueTimeSeries('daily'),
    [dataProvider]
  );

  // Generate forecast based on real historical data
  const forecast = useMemo(() => {
    if (!hasRealData || historicalRevenue.length < 7) {
      return generateDemoForecast();
    }
    return generateDataBasedForecast(historicalRevenue);
  }, [historicalRevenue, hasRealData]);

  // Get churn risk users (from ML model in Phase 3)
  const churnRiskUsers = analysisResult?.predictions?.churnRisk ?? [];

  return (
    <div>
      <ForecastChart data={forecast} isReal={hasRealData} />
      <ChurnRiskTable users={churnRiskUsers} />
    </div>
  );
}
```

---

## 2.8 Attribution Page

**File:** `src/pages/Attribution.tsx`
**Current State:** Uses `CHANNELS` hardcoded array

### Changes Required

```typescript
function AttributionPage() {
  const { dataProvider, hasRealData, analysisResult } = useGameData();

  // Check for attribution columns
  const hasAttributionData = useMemo(() => {
    const columns = analysisResult?.schema?.columns ?? [];
    return columns.some(c =>
      c.semanticType === 'source' ||
      c.semanticType === 'utm_source' ||
      c.name.includes('channel') ||
      c.name.includes('source')
    );
  }, [analysisResult]);

  const channels = useMemo(() => {
    if (!hasAttributionData) return DEMO_CHANNELS;
    return dataProvider.getAttributionChannels();
  }, [hasAttributionData, dataProvider]);

  if (!hasAttributionData && hasRealData) {
    return (
      <EmptyState
        title="No Attribution Data"
        description="Add source/channel columns to see attribution"
      />
    );
  }

  return <AttributionDashboard channels={channels} />;
}
```

---

## Testing Matrix

| Page | Test Case | Expected Result |
|------|-----------|-----------------|
| Monetization | Upload revenue data | Real spender tiers shown |
| Funnels | Upload level data | Auto-detected funnels |
| Realtime | Upload timestamped data | Pattern-based simulation |
| Dashboard Builder | Add KPI widget | Real metric value |
| A/B Testing | Upload with variant column | Real experiment results |
| What-If | Upload baseline data | Real baseline metrics |
| Predictions | Upload 7+ days revenue | Real-based forecast |
| Attribution | Upload with source column | Real channel distribution |

## Files to Modify

- [ ] `src/pages/Monetization.tsx`
- [ ] `src/pages/Funnels.tsx`
- [ ] `src/pages/Realtime.tsx`
- [ ] `src/pages/DashboardBuilder.tsx`
- [ ] `src/pages/ABTesting.tsx`
- [ ] `src/pages/WhatIf.tsx`
- [ ] `src/pages/Predictions.tsx`
- [ ] `src/pages/Attribution.tsx`
- [ ] `src/lib/dashboardStore.ts`
- [ ] `src/lib/realDataProvider.ts` (add new methods)

## Success Criteria

- [ ] All 8 pages show real data when user has uploaded data
- [ ] All 8 pages show demo data with clear "Demo Mode" indicator when no data
- [ ] Empty states show helpful guidance when data exists but lacks required columns
- [ ] No hardcoded mock data visible to users with uploaded data
