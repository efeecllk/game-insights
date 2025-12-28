# AI & Analytics Overview

Game Insights leverages artificial intelligence and machine learning to automatically analyze your game data and provide actionable insights. This guide explains the AI capabilities and how they work together.

## What AI Can Do

### Automatic Data Understanding

Game Insights AI automatically:

- **Detects Column Types**: Identifies 40+ semantic column types (user_id, revenue, level, timestamp, etc.)
- **Classifies Game Type**: Determines if your game is puzzle, idle, battle royale, match3, or gacha RPG
- **Recommends Visualizations**: Suggests optimal charts based on your data structure
- **Generates Insights**: Creates actionable recommendations for improving your game

### Predictive Analytics

The ML pipeline provides:

- **Retention Prediction**: Forecast D7, D30 retention from early cohort data
- **Churn Risk**: Identify users likely to leave before they do
- **Lifetime Value**: Estimate player LTV and segment users by spending potential
- **Revenue Forecasting**: Project future revenue with confidence intervals

### Anomaly Detection

Automatically detect unusual patterns:

- Revenue spikes or drops
- DAU fluctuations
- Retention trend changes
- Engagement pattern breaks

---

## Architecture Overview

```
Data Source --> Adapter --> AI Pipeline --> Dashboard
                              |
                              +-- DataSampler (smart sampling)
                              +-- SchemaAnalyzer (column detection)
                              +-- GameTypeDetector (classification)
                              +-- DataCleaner (quality fixes)
                              +-- ChartSelector (visualization)
                              +-- InsightGenerator (recommendations)
                              +-- ML Models (predictions)
```

### Pipeline Stages

| Stage | Purpose | Output |
|-------|---------|--------|
| **Sampling** | Handle large datasets efficiently | Representative sample |
| **Schema Analysis** | Understand data structure | Column meanings |
| **Game Detection** | Classify game type | Game category + confidence |
| **Data Cleaning** | Fix quality issues | Cleaned dataset |
| **Visualization** | Recommend charts | Dashboard layout |
| **Insights** | Generate recommendations | Actionable insights |
| **Predictions** | ML-powered forecasts | Retention, churn, LTV |

---

## Processing Modes

### Local Processing (Default)

All AI analysis runs locally in your browser:

```typescript
import { dataPipeline } from '@/ai';

const result = await dataPipeline.run(data, {
  sampleSize: 1000,
  autoClean: true,
  calculateMetrics: true,
  detectAnomalies: true,
});
```

**Benefits:**
- Data never leaves your machine
- No API keys required
- Works offline
- No usage limits

### Cloud Processing (OpenAI)

Optionally enable LLM-powered insights for deeper analysis:

```typescript
import { dataPipeline } from '@/ai';
import { initLLMService } from '@/services/llm';

// Initialize OpenAI service
await initLLMService({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4',
});

const result = await dataPipeline.run(data, {
  sampleSize: 1000,
  useLLM: true,  // Enable LLM insights
});
```

**Benefits:**
- Natural language explanations
- Deeper pattern recognition
- Context-aware recommendations
- Custom analysis queries

---

## OpenAI Integration

### Supported Models

| Model | Best For | Cost |
|-------|----------|------|
| `gpt-4` | Complex analysis, nuanced insights | Higher |
| `gpt-4-turbo` | Fast complex analysis | Medium |
| `gpt-3.5-turbo` | Quick insights, cost-effective | Lower |

### Configuration

```typescript
import { initLLMService } from '@/services/llm';

await initLLMService({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo',
  maxTokens: 2000,
  temperature: 0.3,  // Lower for more consistent results
});
```

### What LLM Adds

When LLM is enabled, insights include:

- **Natural language summaries** of complex patterns
- **Game-specific context** based on industry knowledge
- **Causal explanations** for metric changes
- **Prioritized action items** with effort estimates

### Privacy Considerations

When using OpenAI:
- Only aggregated statistics are sent (not raw data)
- No personally identifiable information is transmitted
- Column names and sample values may be included for context
- You control what data is shared through configuration

---

## Quick Start

### Basic Analysis

```typescript
import { dataPipeline } from '@/ai';

// Run complete analysis
const result = await dataPipeline.run(myData, {
  sampleSize: 1000,
  autoClean: true,
});

// Access results
console.log('Game Type:', result.gameType);
console.log('Confidence:', result.gameTypeConfidence);
console.log('Insights:', result.insights);
console.log('Charts:', result.chartRecommendations);
```

### Analysis Only (No Cleaning)

```typescript
const analysis = await dataPipeline.analyze(myData, 500);

console.log('Column meanings:', analysis.columnMeanings);
console.log('Quality issues:', analysis.issues);
console.log('Quality score:', analysis.qualityScore);
```

### Predictions

```typescript
import { retentionPredictor, churnPredictor } from '@/ai/ml';

// Predict retention
const retention = retentionPredictor.predictD30FromEarly(
  0.45,  // D1 retention
  0.18,  // D7 retention
  10000  // Cohort size
);

// Predict churn
const churnRisk = churnPredictor.predict(userFeatures);
```

---

## Pipeline Configuration

### Full Configuration Options

```typescript
interface PipelineConfig {
  // Sampling
  sampleSize: number;           // Max rows to analyze (default: 1000)

  // Cleaning
  autoClean: boolean;           // Auto-apply cleaning (default: true)
  approvedCleaningActions?: CleaningAction[] | 'all';

  // Features
  calculateMetrics?: boolean;   // Run metric calculations (default: true)
  detectAnomalies?: boolean;    // Detect anomalies (default: true)
  analyzeCohorts?: boolean;     // Cohort analysis (default: true)
  detectFunnels?: boolean;      // Funnel detection (default: true)

  // LLM
  useLLM?: boolean;             // Use OpenAI for insights (default: false)
  llmConfig?: LLMConfig;        // OpenAI configuration
}
```

### Pipeline Result

```typescript
interface PipelineResult {
  // Analysis
  sample: SampleResult;
  schema: SchemaInfo;
  columnMeanings: ColumnMeaning[];
  gameType: GameCategory;
  gameTypeConfidence: number;

  // Quality
  qualityBefore: number;
  cleaningPlan: CleaningPlan;
  cleaningResult?: CleaningResult;
  qualityAfter?: number;

  // Visualization
  chartRecommendations: ChartRecommendation[];
  dashboardLayout?: DashboardLayout;

  // Insights
  insights: Insight[];

  // Predictions
  metrics?: CalculatedMetrics;
  anomalies?: Anomaly[];
  cohortAnalysis?: CohortAnalysisResult;
  funnels?: DetectedFunnel[];

  // Stats
  pipelineStats: {
    originalRows: number;
    sampledRows: number;
    cleanedRows: number;
    processingTimeMs: number;
    llmUsed: boolean;
  };
}
```

---

## Next Steps

- [AI Pipeline Deep Dive](./ai-pipeline) - Detailed component documentation
- [Schema Analysis](./schema-analysis) - Column detection explained
- [Game Type Detection](./game-type-detection) - Classification algorithm
- [Predictions](./predictions/retention) - ML model documentation
- [Anomaly Detection](./anomaly-detection) - Detecting unusual patterns
- [Recommendations](./recommendations) - Understanding AI suggestions
