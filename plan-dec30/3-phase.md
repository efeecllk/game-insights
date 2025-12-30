# Phase 3: AI/ML Integration

**Goal:** Connect the 6 implemented ML models to real user data and display predictions in the UI

## Current State

The project has 6 fully implemented ML models in `src/ai/ml/`:
- RetentionPredictor - Power law decay model
- ChurnPredictor - Weighted feature scoring
- LTVPredictor - Linear regression
- RevenueForecaster - Trend + seasonality
- AnomalyModel - Z-score detection
- SegmentationModel - K-means + rules

**Problem:** These models exist but:
1. `initializeMLModels()` is never called
2. No feature extraction pipeline exists
3. Models use localStorage but aren't trained on real data
4. Predictions aren't displayed anywhere

---

## 3.1 Feature Extraction Pipeline

**File:** `src/ai/ml/FeatureExtractor.ts`

ML models need features in specific formats. Create an extractor:

```typescript
import { GameData } from '@/context/DataContext';
import { UserFeatures, AggregateFeatures, TimeSeriesFeatures } from './types';

export class FeatureExtractor {
  private rawData: Record<string, unknown>[];
  private columnRoles: Map<string, string>;

  constructor(gameData: GameData) {
    this.rawData = gameData.rawData as Record<string, unknown>[];
    this.columnRoles = this.buildColumnRoles(gameData.columnMappings);
  }

  // Extract features for a single user
  extractUserFeatures(userId: string): UserFeatures {
    const userRows = this.getUserRows(userId);
    if (userRows.length === 0) return this.getDefaultUserFeatures();

    return {
      userId,
      // Engagement features
      daysActive: this.countUniqueDays(userRows),
      totalSessions: userRows.length,
      avgSessionLength: this.avgValue(userRows, 'duration'),
      weeklyActiveRatio: this.calculateWeeklyActiveRatio(userRows),
      sessionTrend: this.calculateSessionTrend(userRows),
      lastSessionHoursAgo: this.hoursSinceLastSession(userRows),

      // Monetization features
      isPayer: this.hasPurchases(userRows),
      totalSpend: this.sumValue(userRows, 'revenue'),
      purchaseCount: this.countPurchases(userRows),
      daysSinceLastPurchase: this.daysSinceLastPurchase(userRows),

      // Progression features
      currentLevel: this.maxValue(userRows, 'level'),
      progressionSpeed: this.calculateProgressionSpeed(userRows),
      failureRate: this.calculateFailureRate(userRows),
      stuckAtLevel: this.isStuckAtLevel(userRows),
    };
  }

  // Extract features for all users
  extractAllUserFeatures(): UserFeatures[] {
    const userIds = this.getUniqueUsers();
    return userIds.map(id => this.extractUserFeatures(id));
  }

  // Extract aggregate metrics for forecasting
  extractAggregateFeatures(): AggregateFeatures {
    return {
      totalUsers: this.getUniqueUsers().length,
      totalRevenue: this.sumAll('revenue'),
      avgDAU: this.calculateAvgDAU(),
      avgARPU: this.calculateARPU(),
      payerConversion: this.calculatePayerConversion(),
      avgRetentionD1: this.calculateRetention(1),
      avgRetentionD7: this.calculateRetention(7),
      avgRetentionD30: this.calculateRetention(30),
    };
  }

  // Extract time series for forecasting
  extractTimeSeries(metric: 'revenue' | 'dau' | 'sessions'): TimeSeriesPoint[] {
    const dateColumn = this.findColumn('timestamp') || this.findColumn('date');
    const valueColumn = this.findColumn(metric === 'dau' ? 'user_id' : metric);

    return this.groupByDate(dateColumn).map(day => ({
      date: day.date,
      value: metric === 'dau'
        ? this.countUniqueInGroup(day.rows, 'user_id')
        : this.sumGroup(day.rows, valueColumn),
    }));
  }

  // Private helper methods
  private getUserRows(userId: string): Record<string, unknown>[] {
    const userColumn = this.findColumn('user_id');
    return this.rawData.filter(row => row[userColumn] === userId);
  }

  private calculateSessionTrend(rows: Record<string, unknown>[]): number {
    // Compare last 7 days to previous 7 days
    const recent = this.filterByRecency(rows, 7);
    const previous = this.filterByRecency(rows, 14).filter(
      r => !recent.includes(r)
    );
    if (previous.length === 0) return 0;
    return (recent.length - previous.length) / previous.length;
  }

  // ... additional helper methods
}
```

---

## 3.2 ML Model Initialization Service

**File:** `src/ai/ml/MLService.ts`

Create a service that manages model lifecycle:

```typescript
import {
  RetentionPredictor,
  ChurnPredictor,
  LTVPredictor,
  RevenueForecaster,
  AnomalyModel,
  SegmentationModel,
} from './index';
import { FeatureExtractor } from './FeatureExtractor';
import { GameData } from '@/context/DataContext';

export class MLService {
  private static instance: MLService;
  private models: {
    retention: RetentionPredictor;
    churn: ChurnPredictor;
    ltv: LTVPredictor;
    revenue: RevenueForecaster;
    anomaly: AnomalyModel;
    segmentation: SegmentationModel;
  };
  private isInitialized = false;
  private lastTrainedDataId: string | null = null;

  private constructor() {
    this.models = {
      retention: new RetentionPredictor(),
      churn: new ChurnPredictor(),
      ltv: new LTVPredictor(),
      revenue: new RevenueForecaster(),
      anomaly: new AnomalyModel(),
      segmentation: new SegmentationModel(),
    };
  }

  static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  // Initialize and train models on game data
  async trainOnData(gameData: GameData): Promise<void> {
    if (this.lastTrainedDataId === gameData.id) {
      return; // Already trained on this data
    }

    const extractor = new FeatureExtractor(gameData);

    // Extract features
    const userFeatures = extractor.extractAllUserFeatures();
    const aggregateFeatures = extractor.extractAggregateFeatures();
    const revenueSeries = extractor.extractTimeSeries('revenue');
    const dauSeries = extractor.extractTimeSeries('dau');

    // Train each model
    await Promise.all([
      this.models.retention.train(this.prepareRetentionData(userFeatures)),
      this.models.churn.train(userFeatures),
      this.models.ltv.train(userFeatures),
      this.models.revenue.train(revenueSeries),
      this.models.anomaly.trainMetric('revenue', revenueSeries.map(p => p.value)),
      this.models.anomaly.trainMetric('dau', dauSeries.map(p => p.value)),
      this.models.segmentation.train(userFeatures),
    ]);

    this.isInitialized = true;
    this.lastTrainedDataId = gameData.id;
  }

  // Get predictions
  getChurnPredictions(userFeatures: UserFeatures[]): ChurnPrediction[] {
    return this.models.churn.predictBatch(userFeatures);
  }

  getLTVPredictions(userFeatures: UserFeatures[]): LTVPrediction[] {
    return userFeatures.map(u => this.models.ltv.predict(u));
  }

  getRetentionForecast(days: number): RetentionPoint[] {
    return Array.from({ length: days }, (_, i) =>
      this.models.retention.predictRetention(i + 1)
    );
  }

  getRevenueForecast(days: number): RevenueForecast {
    return this.models.revenue.forecast(days);
  }

  detectAnomalies(metrics: MetricPoint[]): Anomaly[] {
    return this.models.anomaly.detectBatch(metrics);
  }

  getUserSegments(userFeatures: UserFeatures[]): SegmentedUsers {
    return this.models.segmentation.autoCluster(userFeatures, 5);
  }

  // Status
  getModelStatus(): ModelStatus {
    return {
      isInitialized: this.isInitialized,
      lastTrainedDataId: this.lastTrainedDataId,
      modelVersions: {
        retention: this.models.retention.version,
        churn: this.models.churn.version,
        ltv: this.models.ltv.version,
        revenue: this.models.revenue.version,
        anomaly: this.models.anomaly.version,
        segmentation: this.models.segmentation.version,
      },
    };
  }
}

// Export singleton
export const mlService = MLService.getInstance();
```

---

## 3.3 ML Context Provider

**File:** `src/context/MLContext.tsx`

Provide ML predictions throughout the app:

```typescript
interface MLContextValue {
  isReady: boolean;
  isTraining: boolean;
  churnPredictions: ChurnPrediction[];
  ltvPredictions: LTVPrediction[];
  revenueForecast: RevenueForecast | null;
  anomalies: Anomaly[];
  segments: SegmentedUsers | null;
  retentionForecast: RetentionPoint[];
  trainModels: (gameData: GameData) => Promise<void>;
}

export const MLProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { activeGameData } = useData();
  const [isTraining, setIsTraining] = useState(false);
  const [predictions, setPredictions] = useState<Predictions | null>(null);

  // Auto-train when data changes
  useEffect(() => {
    if (activeGameData && activeGameData.rawData.length >= 100) {
      trainModels(activeGameData);
    }
  }, [activeGameData?.id]);

  const trainModels = async (gameData: GameData) => {
    setIsTraining(true);
    try {
      await mlService.trainOnData(gameData);

      // Extract features for predictions
      const extractor = new FeatureExtractor(gameData);
      const userFeatures = extractor.extractAllUserFeatures();

      setPredictions({
        churn: mlService.getChurnPredictions(userFeatures),
        ltv: mlService.getLTVPredictions(userFeatures),
        revenue: mlService.getRevenueForecast(30),
        retention: mlService.getRetentionForecast(30),
        segments: mlService.getUserSegments(userFeatures),
        anomalies: [], // Will be populated by real-time checks
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <MLContext.Provider value={{
      isReady: predictions !== null,
      isTraining,
      churnPredictions: predictions?.churn ?? [],
      ltvPredictions: predictions?.ltv ?? [],
      revenueForecast: predictions?.revenue ?? null,
      anomalies: predictions?.anomalies ?? [],
      segments: predictions?.segments ?? null,
      retentionForecast: predictions?.retention ?? [],
      trainModels,
    }}>
      {children}
    </MLContext.Provider>
  );
};

export const useML = () => useContext(MLContext);
```

---

## 3.4 Update Predictions Page

**File:** `src/pages/Predictions.tsx`

Replace mock forecasts with real ML predictions:

```typescript
function PredictionsPage() {
  const {
    revenueForecast,
    churnPredictions,
    retentionForecast,
    isReady,
    isTraining,
  } = useML();
  const { hasRealData } = useGameData();

  // Sort churn predictions by risk
  const atRiskUsers = useMemo(() =>
    churnPredictions
      .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical')
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 20),
    [churnPredictions]
  );

  if (isTraining) {
    return <TrainingProgress message="Training ML models on your data..." />;
  }

  if (!hasRealData) {
    return (
      <EmptyState
        title="Upload Data for Predictions"
        description="ML models need at least 100 rows of data to make predictions"
      />
    );
  }

  return (
    <div className="space-y-6">
      <DataModeBadge mode="real" variant="ml" />

      {/* Revenue Forecast */}
      <Card>
        <h2>30-Day Revenue Forecast</h2>
        <RevenueForecastChart
          forecast={revenueForecast}
          showConfidenceInterval
        />
        <ForecastInsights forecast={revenueForecast} />
      </Card>

      {/* Churn Risk */}
      <Card>
        <h2>Users at Risk of Churning</h2>
        <ChurnRiskTable
          users={atRiskUsers}
          onActionClick={handleChurnPrevention}
        />
        <ChurnPreventionActions recommendations={getRecommendations()} />
      </Card>

      {/* Retention Forecast */}
      <Card>
        <h2>Retention Forecast</h2>
        <RetentionForecastChart data={retentionForecast} />
      </Card>
    </div>
  );
}
```

---

## 3.5 Add ML Insights to Overview

**File:** `src/App.tsx` (OverviewPage component)

Add ML-powered insights:

```typescript
function OverviewPage() {
  const { churnPredictions, segments, anomalies, isReady } = useML();

  // Calculate high-level ML insights
  const mlInsights = useMemo(() => {
    if (!isReady) return [];

    const atRiskCount = churnPredictions.filter(
      p => p.riskLevel === 'high' || p.riskLevel === 'critical'
    ).length;

    const whaleCount = segments?.predefined?.whale?.length ?? 0;

    return [
      atRiskCount > 0 && {
        type: 'warning',
        title: `${atRiskCount} users at high churn risk`,
        action: 'View in Predictions',
        link: '/predictions',
      },
      whaleCount > 0 && {
        type: 'positive',
        title: `${whaleCount} whale users identified`,
        action: 'View Segments',
        link: '/segments',
      },
      anomalies.length > 0 && {
        type: 'alert',
        title: `${anomalies.length} anomalies detected`,
        action: 'Investigate',
        link: '/analytics?tab=anomalies',
      },
    ].filter(Boolean);
  }, [isReady, churnPredictions, segments, anomalies]);

  return (
    <div>
      {/* Existing overview content */}

      {/* ML Insights Panel */}
      {isReady && mlInsights.length > 0 && (
        <MLInsightsPanel insights={mlInsights} />
      )}
    </div>
  );
}
```

---

## 3.6 Recommendation Actions

**File:** `src/components/ml/RecommendationActions.tsx`

Display actionable recommendations from the ML models:

```typescript
function RecommendationActions() {
  const { churnPredictions, segments } = useML();
  const { selectedGame } = useGame();

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];

    // Churn-based recommendations
    const highRiskCount = churnPredictions.filter(
      p => p.riskLevel === 'high'
    ).length;

    if (highRiskCount > 10) {
      recs.push({
        type: 'retention',
        priority: 'high',
        title: 'High Churn Risk Detected',
        description: `${highRiskCount} users are at high risk of churning. Consider:`,
        actions: [
          'Send re-engagement push notifications',
          'Offer time-limited rewards',
          'Adjust difficulty for stuck users',
        ],
        estimatedImpact: '+15% D7 retention',
      });
    }

    // Monetization recommendations
    const dolphins = segments?.predefined?.dolphin ?? [];
    const potentialWhales = dolphins.filter(d => d.totalSpend > 50);

    if (potentialWhales.length > 5) {
      recs.push({
        type: 'monetization',
        priority: 'medium',
        title: 'Whale Conversion Opportunity',
        description: `${potentialWhales.length} dolphins could become whales.`,
        actions: [
          'Offer exclusive bundles',
          'Create VIP loyalty program',
          'Time limited whale-tier offers',
        ],
        estimatedImpact: '+$5K monthly revenue',
      });
    }

    return recs;
  }, [churnPredictions, segments]);

  return (
    <div className="space-y-4">
      {recommendations.map(rec => (
        <RecommendationCard key={rec.type} recommendation={rec} />
      ))}
    </div>
  );
}
```

---

## 3.7 ML Training Status Component

**File:** `src/components/ml/MLStatusBadge.tsx`

Show ML model status in the UI:

```typescript
function MLStatusBadge() {
  const { isReady, isTraining } = useML();
  const { hasRealData } = useGameData();

  if (!hasRealData) {
    return (
      <Badge variant="muted">
        <Brain className="w-3 h-3 mr-1" />
        ML: No Data
      </Badge>
    );
  }

  if (isTraining) {
    return (
      <Badge variant="info">
        <Loader className="w-3 h-3 mr-1 animate-spin" />
        Training...
      </Badge>
    );
  }

  if (isReady) {
    return (
      <Badge variant="success">
        <Brain className="w-3 h-3 mr-1" />
        ML Ready
      </Badge>
    );
  }

  return null;
}
```

---

## Files to Create

- [ ] `src/ai/ml/FeatureExtractor.ts`
- [ ] `src/ai/ml/MLService.ts`
- [ ] `src/context/MLContext.tsx`
- [ ] `src/components/ml/RecommendationActions.tsx`
- [ ] `src/components/ml/MLStatusBadge.tsx`
- [ ] `src/components/ml/ChurnRiskTable.tsx`
- [ ] `src/components/ml/RevenueForecastChart.tsx`
- [ ] `src/components/ml/MLInsightsPanel.tsx`

## Files to Modify

- [ ] `src/App.tsx` - Add MLProvider, show ML insights
- [ ] `src/pages/Predictions.tsx` - Use real ML predictions
- [ ] `src/pages/Overview.tsx` - Add ML insights panel
- [ ] `src/components/Sidebar.tsx` - Add ML status badge

## Testing Requirements

1. Upload 100+ row dataset → ML training starts
2. Training completes → Predictions available
3. Churn predictions → Users ranked by risk
4. Revenue forecast → 30-day projection with confidence
5. Segments → Users categorized correctly
6. Recommendations → Actionable insights generated

## Success Criteria

- [ ] ML models train automatically when data uploaded
- [ ] Predictions page shows real ML output
- [ ] Churn risk users identified and displayed
- [ ] Revenue forecast uses real historical data
- [ ] User segments calculated and shown
- [ ] Recommendations generated based on predictions
- [ ] ML status visible in sidebar
