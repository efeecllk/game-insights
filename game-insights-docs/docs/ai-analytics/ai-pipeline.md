# AI Pipeline Deep Dive

The AI Pipeline orchestrates the complete data processing flow in Game Insights. This document provides detailed documentation for each component.

## Pipeline Architecture

```
Data Input
    |
    v
+-------------------+
|   DataSampler     |  Smart sampling for large datasets
+-------------------+
    |
    v
+-------------------+
|  SchemaAnalyzer   |  40+ semantic column detection
+-------------------+
    |
    v
+-------------------+
| GameTypeDetector  |  5 game type classification
+-------------------+
    |
    v
+-------------------+
|   DataCleaner     |  Quality issues & auto-fix
+-------------------+
    |
    v
+-------------------+
|  ChartSelector    |  Visualization recommendations
+-------------------+
    |
    v
+-------------------+
| InsightGenerator  |  AI recommendations
+-------------------+
    |
    v
Pipeline Result
```

---

## DataSampler

The DataSampler intelligently samples large datasets to enable fast analysis without sacrificing accuracy.

### Sampling Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `random` | Shuffles and takes first N rows | General purpose |
| `head` | First N rows | Time-ordered data, recent focus |
| `tail` | Last N rows | Historical comparison |
| `stratified` | Maintains distribution of key columns | Categorical analysis |
| `systematic` | Every Nth row | Evenly distributed sample |
| `smart` | Combination of head, tail, random | Default recommendation |

### Smart Sampling Algorithm

The `smart` strategy combines multiple approaches:

```typescript
// Smart sampling breakdown:
// - 20% from head (recent data, usually important)
// - 10% from tail (oldest data for comparison)
// - 70% random from middle

const headCount = Math.floor(n * 0.2);
const tailCount = Math.floor(n * 0.1);
const randomCount = n - headCount - tailCount;
```

### Usage

```typescript
import { dataSampler } from '@/ai';

const result = dataSampler.sample(data, {
  maxRows: 1000,
  strategy: 'smart',
  priorityColumns: ['country', 'platform'],  // For stratified
});

console.log('Original rows:', result.originalRowCount);
console.log('Sampled rows:', result.sampleRowCount);
console.log('Sampling ratio:', result.samplingRatio);
console.log('Unique values captured:', result.coverage.uniqueValuesCaptured);
```

### Configuration

```typescript
interface SampleConfig {
  maxRows: number;              // Maximum rows to sample
  strategy: SamplingStrategy;   // Sampling method
  preserveDistribution?: boolean;
  priorityColumns?: string[];   // For stratified sampling
}
```

---

## SchemaAnalyzer

The SchemaAnalyzer detects semantic meaning of columns using pattern matching and value inference.

### Supported Semantic Types (40+)

**User & Session:**
- `user_id`, `session_id`, `event_name`, `timestamp`

**Monetization:**
- `revenue`, `currency`, `price`, `quantity`
- `iap_revenue`, `purchase_amount`, `product_id`, `offer_id`

**Progression:**
- `level`, `score`, `xp`, `rank`

**Demographics:**
- `country`, `platform`, `device`, `version`

**Retention & Cohort:**
- `retention_day`, `cohort`, `segment`

**KPIs:**
- `dau`, `mau`, `arpu`, `ltv`

**Game-Specific:**
- Puzzle: `moves`, `booster`, `lives`
- Idle: `prestige`, `offline_reward`, `upgrade`
- Gacha: `rarity`, `banner`, `pull_type`, `pity_count`
- Battle Royale: `kills`, `placement`, `damage`, `survival_time`

**Ad Monetization:**
- `ad_impression`, `ad_revenue`, `ad_network`, `ad_type`, `ecpm`

**Engagement:**
- `session_duration`, `session_count`, `rounds_played`, `days_since_install`

### Detection Algorithm

1. **Pattern Matching**: Column names are matched against known regex patterns

```typescript
const PATTERNS = {
  user_id: [/user.*id/i, /player.*id/i, /uid/i, /^id$/i],
  revenue: [/revenue/i, /income/i, /earnings/i, /^rev$/i],
  level: [/^level$/i, /^lvl$/i, /player.*level/i],
  // ... 40+ patterns
};
```

2. **Value Inference**: If no pattern matches, infer from data types and values

```typescript
// Date detection
if (type === 'date') return 'timestamp';

// Country code detection (2-char strings)
if (allTwoChars) return 'country';

// Price detection (numbers with decimals)
if (hasDecimals && name.length <= 3) return 'price';
```

### Usage

```typescript
import { schemaAnalyzer } from '@/ai';

const meanings = schemaAnalyzer.analyze(schema);

meanings.forEach(m => {
  console.log(`${m.column}: ${m.semanticType} (${m.confidence * 100}%)`);
});

// Get suggested metrics based on detected columns
const metrics = schemaAnalyzer.getSuggestedMetrics(meanings);
// ['Total Revenue', 'ARPU', 'DAU', 'Day 1 Retention', ...]
```

### Confidence Scores

| Confidence | Meaning |
|------------|---------|
| 0.85+ | Strong pattern match |
| 0.60-0.84 | Value inference |
| 0.50-0.59 | Weak inference |
| < 0.50 | Unknown type |

---

## GameTypeDetector

Automatically classifies games into one of five categories based on detected columns.

### Supported Game Types

| Type | Key Indicators | Example Games |
|------|----------------|---------------|
| `puzzle` | moves, booster, lives, level | Candy Crush, Gardenscapes |
| `idle` | prestige, offline_reward, upgrade | Cookie Clicker, AdVenture Capitalist |
| `battle_royale` | kills, placement, damage, survival_time | PUBG, Fortnite |
| `match3_meta` | moves, booster, level + item_id, category | Homescapes, Lily's Garden |
| `gacha_rpg` | rarity, banner, pull_type, pity_count | Genshin Impact, Fire Emblem Heroes |
| `custom` | No clear pattern detected | - |

### Detection Algorithm

The detector uses weighted scoring:

```typescript
const GAME_INDICATORS = {
  puzzle: [
    { signals: ['moves', 'booster'], weight: 5 },  // Strong signal
    { signals: ['level', 'score'], weight: 3 },
    { signals: ['lives'], weight: 3 },
  ],
  idle: [
    { signals: ['prestige'], weight: 5 },
    { signals: ['offline_reward'], weight: 5 },
    { signals: ['upgrade'], weight: 4 },
  ],
  gacha_rpg: [
    { signals: ['pull_type', 'banner'], weight: 5 },
    { signals: ['rarity'], weight: 5 },
    { signals: ['currency'], weight: 3 },
  ],
  // ...
};
```

**Scoring Process:**

1. Count matching semantic types from your data
2. Multiply matches by indicator weights
3. Sum scores for each game type
4. Winner is the highest score (with margin > 2)

### Usage

```typescript
import { gameTypeDetector } from '@/ai';

const result = gameTypeDetector.detect(columnMeanings);

console.log('Game Type:', result.gameType);
console.log('Confidence:', result.confidence);
console.log('Reasons:', result.reasons);
// ['Found moves, booster (weight: 5)', 'Found level, score (weight: 3)']
```

---

## DataCleaner

Identifies data quality issues and applies automatic fixes.

### Issue Types Detected

| Issue Type | Description | Suggested Fix |
|------------|-------------|---------------|
| `missing_values` | Null, undefined, empty | `fill_mode` or `remove_rows` |
| `invalid_type` | Wrong data type | `parse_number`, `parse_date` |
| `outlier` | Statistical outlier (>3 std) | `cap_outliers` |
| `duplicate` | Duplicate rows | `remove_duplicates` |
| `whitespace` | Leading/trailing spaces | `trim_whitespace` |
| `invalid_range` | Out of expected range | `cap_outliers` |

### Cleaning Actions

```typescript
type CleaningAction =
  | 'remove_rows'       // Delete rows with issues
  | 'fill_null'         // Fill with default
  | 'fill_mean'         // Fill with column mean
  | 'fill_median'       // Fill with column median
  | 'fill_mode'         // Fill with most common value
  | 'forward_fill'      // Fill with previous value
  | 'trim_whitespace'   // Remove spaces
  | 'lowercase'         // Convert to lowercase
  | 'parse_date'        // Parse date format
  | 'parse_number'      // Parse string to number
  | 'cap_outliers'      // Cap at percentile bounds
  | 'remove_duplicates' // Remove duplicate rows
  | 'no_action';        // Skip cleaning
```

### Usage

```typescript
import { dataCleaner } from '@/ai';

// Step 1: Analyze quality issues
const plan = dataCleaner.analyze(data, columnMeanings);

console.log('Issues found:', plan.issues.length);
console.log('Quality score:', dataCleaner.calculateQualityScore(data.rows));

// Step 2: Review issues
plan.issues.forEach(issue => {
  console.log(`${issue.column}: ${issue.issueType}`);
  console.log(`  Affected: ${issue.affectedRowsPercent}%`);
  console.log(`  Suggested: ${issue.suggestedFix.action}`);
});

// Step 3: Apply cleaning
const result = dataCleaner.clean(data, plan, 'all');  // or specific actions

console.log('Rows removed:', result.rowsRemoved);
console.log('Rows modified:', result.rowsModified);
console.log('Quality after:', result.qualityScoreAfter);
```

### Quality Score

Quality score (0-100) is calculated as the ratio of clean cells to total cells:

```typescript
// A cell is "clean" if:
// - Not null/undefined/empty
// - No whitespace issues (partial credit: 0.8)
const score = (cleanCells / totalCells) * 100;
```

---

## ChartSelector

Recommends optimal visualizations based on detected columns.

### Chart Types

| Type | Best For |
|------|----------|
| `line` | Time series, trends |
| `area` | Cumulative values, trends |
| `bar` | Comparisons, distributions |
| `pie` / `donut` | Proportions, breakdowns |
| `funnel` | Conversion funnels |
| `histogram` | Value distributions |
| `scatter` | Correlations |
| `heatmap` | Multi-dimensional data |
| `kpi` | Key metrics display |
| `gauge` | Progress indicators |

### Recommendation Algorithm

1. **Template Matching**: Match semantic type combinations to chart templates

```typescript
const TEMPLATES = [
  { requires: ['revenue', 'timestamp'], chart: 'area', priority: 10 },
  { requires: ['user_id', 'timestamp'], chart: 'line', priority: 9 },
  { requires: ['retention_day'], chart: 'bar', priority: 9 },
  { requires: ['funnel_step', 'conversion'], chart: 'funnel', priority: 8 },
  // ...
];
```

2. **Game-Type Boost**: Priority boost for game-specific charts

```typescript
const GAME_BOOSTS = {
  puzzle: ['funnel', 'histogram', 'line'],
  idle: ['area', 'bar', 'gauge'],
  battle_royale: ['scatter', 'histogram', 'kpi'],
  // ...
};
```

### Usage

```typescript
import { chartSelector } from '@/ai';

const recommendations = chartSelector.recommend(columnMeanings, 'puzzle');

// Get dashboard layout
const layout = chartSelector.getDashboardLayout(recommendations);

console.log('KPIs:', layout.kpis);           // Up to 4 KPI cards
console.log('Main charts:', layout.mainCharts);  // Up to 2 main charts
console.log('Side charts:', layout.sideCharts);  // Up to 2 side charts
```

---

## InsightGenerator

Generates actionable insights from data analysis.

### Insight Types

| Type | Color | Meaning |
|------|-------|---------|
| `positive` | Green | Good performance indicator |
| `negative` | Red | Issue requiring attention |
| `warning` | Yellow | Potential concern |
| `neutral` | Gray | Informational |
| `opportunity` | Blue | Growth opportunity |

### Insight Categories

- `retention` - User retention patterns
- `monetization` - Revenue and spending
- `engagement` - User activity and sessions
- `progression` - Level and gameplay progress
- `quality` - Data quality issues

### Template-Based Insights

Built-in templates automatically detect common patterns:

```typescript
// Revenue insight
if (hasRevenueColumn) {
  insights.push({
    type: 'positive',
    category: 'monetization',
    title: 'Total Revenue',
    description: `Dataset contains $${total.toLocaleString()} in revenue.`,
    priority: 7,
  });
}

// Retention warning
if (hasLowRetention) {
  insights.push({
    type: 'warning',
    category: 'retention',
    title: 'Retention Opportunity',
    recommendation: 'Focus on Day 1-3 engagement features.',
    priority: 8,
  });
}
```

### LLM-Enhanced Insights

When OpenAI is enabled, insights become more sophisticated:

```typescript
const result = await dataPipeline.run(data, {
  useLLM: true,
  llmConfig: {
    provider: 'openai',
    apiKey: 'your-key',
    model: 'gpt-4',
  },
});

// LLM insights include:
// - Natural language explanations
// - Evidence supporting the insight
// - Confidence scores
// - Specific, contextual recommendations
```

### Game-Specific Tips

Each game type has tailored recommendations:

```typescript
const GAME_TIPS = {
  puzzle: [
    'Consider adding hint systems for stuck players',
    'Level completion times reveal difficulty spikes',
    'Boosters near hard levels drive IAP conversion',
  ],
  idle: [
    'Optimize offline reward calculations for engagement',
    'Monitor currency inflation over time',
    'Prestige timing affects long-term retention',
  ],
  gacha_rpg: [
    'Track pity system hits and near-misses',
    'Analyze character collection completion rates',
    'Banner timing affects revenue spikes',
  ],
  // ...
};
```

---

## Running the Complete Pipeline

### Full Pipeline Execution

```typescript
import { dataPipeline } from '@/ai';

const result = await dataPipeline.run(myData, {
  // Sampling
  sampleSize: 1000,

  // Cleaning
  autoClean: true,
  approvedCleaningActions: 'all',

  // Features
  calculateMetrics: true,
  detectAnomalies: true,
  analyzeCohorts: true,
  detectFunnels: true,

  // LLM (optional)
  useLLM: false,
});

// Access all results
console.log('Processing time:', result.pipelineStats.processingTimeMs, 'ms');
console.log('Game type:', result.gameType, `(${result.gameTypeConfidence * 100}%)`);
console.log('Quality:', result.qualityBefore, '->', result.qualityAfter);
console.log('Insights:', result.insights.length);
console.log('Anomalies:', result.anomalyStats?.total);
```

### Individual Component Usage

```typescript
import {
  dataSampler,
  schemaAnalyzer,
  gameTypeDetector,
  dataCleaner,
  chartSelector,
  insightGenerator,
} from '@/ai';

// Sample
const sample = dataSampler.sample(data, { maxRows: 500 });

// Analyze schema
const schema = buildSchema(sample.sample);
const meanings = schemaAnalyzer.analyze(schema);

// Detect game type
const detection = gameTypeDetector.detect(meanings);

// Clean data
const plan = dataCleaner.analyze(sample.sample, meanings);
const cleaned = dataCleaner.clean(sample.sample, plan, 'all');

// Get charts
const charts = chartSelector.recommend(meanings, detection.gameType);

// Generate insights
const insights = insightGenerator.generateTemplateInsights(
  cleaned.cleanedData,
  meanings,
  detection.gameType
);
```

---

## Next Steps

- [Schema Analysis](./schema-analysis) - Deep dive into column detection
- [Game Type Detection](./game-type-detection) - Classification details
- [Anomaly Detection](./anomaly-detection) - Detecting unusual patterns
- [Predictions](./predictions/retention) - ML model documentation
