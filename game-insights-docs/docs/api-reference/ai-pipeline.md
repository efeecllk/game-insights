# AI Pipeline API

The AI Pipeline orchestrates data analysis through multiple stages: sampling, schema analysis, game detection, cleaning, metrics calculation, anomaly detection, cohort analysis, funnel detection, and insight generation.

**Source Location:** `src/ai/`

## DataPipeline Class

The main orchestrator for the complete analysis flow.

```typescript
// src/ai/DataPipeline.ts

import { dataPipeline } from '@/ai/DataPipeline';

const result = await dataPipeline.run(normalizedData, {
    sampleSize: 1000,
    autoClean: true,
    calculateMetrics: true,
    detectAnomalies: true,
    analyzeCohorts: true,
    detectFunnels: true,
    useLLM: false
});
```

### PipelineConfig

```typescript
interface PipelineConfig {
    // Sampling
    sampleSize: number;              // Max rows to sample (default: 1000)

    // Cleaning
    autoClean: boolean;              // Auto-apply cleaning (default: true)
    approvedCleaningActions?: CleaningAction[] | 'all';

    // Analysis toggles
    calculateMetrics?: boolean;      // Run metric calculations (default: true)
    detectAnomalies?: boolean;       // Detect anomalies (default: true)
    analyzeCohorts?: boolean;        // Run cohort analysis (default: true)
    detectFunnels?: boolean;         // Detect funnels (default: true)

    // LLM Integration
    useLLM?: boolean;                // Use LLM for insights (default: false)
    llmConfig?: LLMConfig;
}
```

### PipelineResult

```typescript
interface PipelineResult {
    // Step 1: Sampling
    sample: SampleResult;

    // Step 2: Schema Analysis
    schema: SchemaInfo;
    columnMeanings: ColumnMeaning[];

    // Step 3: Game Detection
    gameType: GameCategory;
    gameTypeConfidence: number;

    // Step 4: Data Quality
    qualityBefore: number;
    cleaningPlan: CleaningPlan;
    cleaningResult?: CleaningResult;
    qualityAfter?: number;

    // Step 5: Visualization
    chartRecommendations: ChartRecommendation[];
    dashboardLayout?: {
        kpis: ChartRecommendation[];
        mainCharts: ChartRecommendation[];
        sideCharts: ChartRecommendation[];
    };

    // Step 6: Insights
    insights: Insight[];

    // Step 7: Metrics
    metrics?: CalculatedMetrics;

    // Step 8: Anomalies
    anomalies?: Anomaly[];
    anomalyStats?: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };

    // Step 9: Cohort Analysis
    cohortAnalysis?: CohortAnalysisResult;

    // Step 10: Funnels
    funnels?: DetectedFunnel[];
    funnelStats?: {
        detected: number;
        avgCompletionRate: number;
    };

    // Metadata
    pipelineStats: {
        originalRows: number;
        sampledRows: number;
        cleanedRows: number;
        processingTimeMs: number;
        llmUsed: boolean;
    };
}
```

### Pipeline Methods

```typescript
class DataPipeline {
    // Full pipeline
    async run(data: NormalizedData, config: Partial<PipelineConfig>): Promise<PipelineResult>;

    // Analysis only (no cleaning)
    async analyze(data: NormalizedData, sampleSize?: number): Promise<{
        columnMeanings: ColumnMeaning[];
        gameType: GameCategory;
        confidence: number;
        issues: CleaningPlan['issues'];
        qualityScore: number;
    }>;

    // Cleaning only
    async clean(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        approvedActions: CleaningAction[] | 'all'
    ): Promise<CleaningResult>;

    // Individual steps
    calculateMetrics(data: NormalizedData, columnMeanings: ColumnMeaning[]): CalculatedMetrics;
    detectAnomalies(data: NormalizedData, columnMeanings: ColumnMeaning[]): AnomalyDetectionResult;
    analyzeCohorts(data: NormalizedData, columnMeanings: ColumnMeaning[]): CohortAnalysisResult | null;
    detectFunnels(data: NormalizedData, columnMeanings: ColumnMeaning[], gameType: GameCategory): FunnelAnalysisResult;
}
```

## SchemaAnalyzer

Detects semantic meaning of columns.

```typescript
// src/ai/SchemaAnalyzer.ts

import { schemaAnalyzer, ColumnMeaning, SemanticType } from '@/ai/SchemaAnalyzer';

const columnMeanings = schemaAnalyzer.analyze(schemaInfo);
const suggestedMetrics = schemaAnalyzer.getSuggestedMetrics(columnMeanings);
```

### ColumnMeaning

```typescript
interface ColumnMeaning {
    column: string;
    detectedType: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
    semanticType: SemanticType;
    confidence: number; // 0-1
}
```

### SemanticType

All recognized semantic column types:

```typescript
type SemanticType =
    // Core identifiers
    | 'user_id' | 'session_id' | 'event_name' | 'timestamp'

    // Monetization
    | 'revenue' | 'currency' | 'price' | 'quantity'
    | 'iap_revenue' | 'purchase_amount' | 'product_id' | 'offer_id' | 'offer_shown'

    // Progression
    | 'level' | 'score' | 'xp' | 'rank'

    // Demographics
    | 'country' | 'platform' | 'device' | 'version'

    // Retention & Cohort
    | 'retention_day' | 'cohort' | 'segment'

    // Metrics
    | 'dau' | 'mau' | 'arpu' | 'ltv'

    // Items
    | 'item_id' | 'item_name' | 'category'

    // Funnel
    | 'funnel_step' | 'conversion'

    // Errors
    | 'error_type' | 'error_message'

    // Puzzle/Match3 specific
    | 'moves' | 'booster' | 'lives'

    // Idle specific
    | 'prestige' | 'offline_reward' | 'upgrade'

    // Gacha specific
    | 'rarity' | 'banner' | 'pull_type' | 'pity_count'

    // Battle Royale specific
    | 'kills' | 'placement' | 'damage' | 'survival_time'

    // Ad Monetization
    | 'ad_impression' | 'ad_revenue' | 'ad_network' | 'ad_type' | 'ecpm' | 'ad_watched'

    // Engagement
    | 'session_duration' | 'session_count' | 'rounds_played' | 'days_since_install'

    // Premium
    | 'vip_level' | 'battle_pass_level' | 'premium_currency'

    // Hyper-casual
    | 'high_score' | 'is_organic' | 'acquisition_source'

    | 'unknown';
```

### Column Detection Patterns

The analyzer uses regex patterns to detect column types:

```typescript
// Example patterns
const COLUMN_PATTERNS: Record<SemanticType, RegExp[]> = {
    user_id: [/user.*id/i, /player.*id/i, /uid/i, /^id$/i],
    timestamp: [/timestamp/i, /^date$/i, /created.*at/i],
    revenue: [/revenue/i, /income/i, /earnings/i],
    level: [/^level$/i, /^lvl$/i, /player.*level/i],
    // ... more patterns
};
```

## GameTypeDetector

Automatically detects game type from column patterns.

```typescript
// src/ai/GameTypeDetector.ts

import { gameTypeDetector } from '@/ai/GameTypeDetector';

const detection = gameTypeDetector.detect(columnMeanings);
console.log(detection.gameType);      // 'puzzle', 'idle', etc.
console.log(detection.confidence);    // 0-1
console.log(detection.reasons);       // ['Found moves, booster (weight: 5)']
```

### Detection Result

```typescript
interface DetectionResult {
    gameType: GameCategory;
    confidence: number;
    reasons: string[];
}
```

### Game Indicators

Each game type has weighted indicators:

```typescript
const GAME_INDICATORS: Record<GameCategory, { signals: SemanticType[]; weight: number }[]> = {
    puzzle: [
        { signals: ['moves', 'booster'], weight: 5 },
        { signals: ['level', 'score'], weight: 3 },
        { signals: ['lives'], weight: 3 },
    ],
    idle: [
        { signals: ['prestige'], weight: 5 },
        { signals: ['offline_reward'], weight: 5 },
        { signals: ['upgrade'], weight: 4 },
    ],
    battle_royale: [
        { signals: ['placement', 'kills'], weight: 5 },
        { signals: ['damage', 'survival_time'], weight: 4 },
    ],
    gacha_rpg: [
        { signals: ['pull_type', 'banner'], weight: 5 },
        { signals: ['rarity'], weight: 5 },
    ],
    // ...
};
```

## DataSampler

Smart sampling for large datasets.

```typescript
// src/ai/DataSampler.ts

import { dataSampler, SampleConfig, SampleResult } from '@/ai/DataSampler';

const result = dataSampler.sample(data, {
    maxRows: 1000,
    strategy: 'smart',
    preserveDistribution: true,
    priorityColumns: ['user_id', 'revenue']
});
```

### Sampling Strategies

```typescript
type SamplingStrategy =
    | 'random'      // Random sample
    | 'head'        // First N rows
    | 'tail'        // Last N rows
    | 'stratified'  // Maintain distribution of key columns
    | 'systematic'  // Every Nth row
    | 'smart';      // Combination: 20% head, 70% random middle, 10% tail
```

### SampleResult

```typescript
interface SampleResult {
    sample: NormalizedData;
    originalRowCount: number;
    sampleRowCount: number;
    samplingRatio: number;
    strategy: SamplingStrategy;
    coverage: {
        columns: string[];
        uniqueValuesCaptured: Record<string, number>;
    };
}
```

## DataCleaner

Detects and fixes data quality issues.

```typescript
// src/ai/DataCleaner.ts

import { dataCleaner, CleaningPlan, CleaningResult } from '@/ai/DataCleaner';

// Analyze issues
const plan = dataCleaner.analyze(data, columnMeanings);

// Apply cleaning
const result = dataCleaner.clean(data, plan, 'all');
// or specify actions: ['trim_whitespace', 'fill_mode']

// Get quality score
const score = dataCleaner.calculateQualityScore(data.rows);
```

### Data Issues

```typescript
type DataIssue =
    | 'missing_values'
    | 'invalid_type'
    | 'outlier'
    | 'duplicate'
    | 'inconsistent_format'
    | 'invalid_range'
    | 'encoding_error'
    | 'whitespace'
    | 'special_chars';
```

### Cleaning Actions

```typescript
type CleaningAction =
    | 'remove_rows'         // Delete affected rows
    | 'fill_null'           // Fill with default value
    | 'fill_mean'           // Fill with column mean
    | 'fill_median'         // Fill with column median
    | 'fill_mode'           // Fill with most common value
    | 'forward_fill'        // Fill with previous value
    | 'trim_whitespace'     // Remove leading/trailing spaces
    | 'lowercase'           // Convert to lowercase
    | 'uppercase'           // Convert to uppercase
    | 'titlecase'           // Convert to title case
    | 'parse_date'          // Parse to consistent date format
    | 'parse_number'        // Parse string to number
    | 'cap_outliers'        // Cap at percentile boundaries
    | 'remove_duplicates'   // Remove duplicate rows
    | 'regex_replace'       // Replace with regex
    | 'no_action';          // Skip cleaning
```

### CleaningPlan

```typescript
interface CleaningPlan {
    issues: DataQualityIssue[];
    suggestedActions: {
        column: string;
        action: CleaningAction;
        reason: string;
    }[];
    estimatedRowsAffected: number;
    estimatedCleanPercentage: number;
}

interface DataQualityIssue {
    column: string;
    issueType: DataIssue;
    severity: 'low' | 'medium' | 'high';
    affectedRows: number;
    affectedRowsPercent: number;
    examples: unknown[];
    suggestedFix: CleaningStrategy;
}
```

## ChartSelector

Recommends visualizations based on data.

```typescript
// src/ai/ChartSelector.ts

import { chartSelector, ChartRecommendation } from '@/ai/ChartSelector';

const recommendations = chartSelector.recommend(columnMeanings, gameType);
const layout = chartSelector.getDashboardLayout(recommendations);
```

### ChartType

```typescript
type ChartType =
    | 'line' | 'bar' | 'area' | 'pie' | 'donut'
    | 'funnel' | 'heatmap' | 'scatter' | 'gauge'
    | 'kpi' | 'table' | 'histogram';
```

### ChartRecommendation

```typescript
interface ChartRecommendation {
    chartType: ChartType;
    title: string;
    description: string;
    priority: number; // 1-10, higher = more important
    columns: string[];
    config?: Record<string, unknown>;
}
```

## InsightGenerator

Generates actionable insights.

```typescript
// src/ai/InsightGenerator.ts

import { insightGenerator, Insight } from '@/ai/InsightGenerator';

// Full generation (with LLM if configured)
const insights = await insightGenerator.generate(
    data,
    columnMeanings,
    gameType,
    metrics,     // optional
    anomalies    // optional
);

// Template-only generation
const templateInsights = insightGenerator.generateTemplateInsights(
    data,
    columnMeanings,
    gameType
);
```

### Insight

```typescript
interface Insight {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning' | 'opportunity';
    category?: 'retention' | 'monetization' | 'engagement' | 'progression' | 'quality';
    title: string;
    description: string;
    metric?: string;
    value?: number | string;
    change?: number;
    priority?: number;
    recommendation?: string;
    confidence?: number;
    evidence?: string[];
    source?: 'template' | 'llm';
}
```

### Game-Specific Insights

The generator includes game-specific tips:

```typescript
const GAME_INSIGHTS: Record<GameCategory, string[]> = {
    puzzle: [
        'Consider adding hint systems for stuck players',
        'Level completion times can reveal difficulty spikes',
    ],
    idle: [
        'Optimize offline reward calculations for engagement',
        'Prestige timing affects long-term retention',
    ],
    gacha_rpg: [
        'Track pity system hits and near-misses',
        'Banner timing affects revenue spikes',
    ],
    // ...
};
```

## Creating Custom Analyzers

Extend the pipeline with custom analysis:

```typescript
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';
import { NormalizedData } from '@/adapters/BaseAdapter';

interface MyAnalysisResult {
    score: number;
    findings: string[];
}

class MyCustomAnalyzer {
    analyze(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[]
    ): MyAnalysisResult {
        const findings: string[] = [];

        // Find specific columns
        const revenueCol = columnMeanings.find(m => m.semanticType === 'revenue');

        if (revenueCol) {
            const total = data.rows.reduce((sum, row) =>
                sum + (Number(row[revenueCol.column]) || 0), 0
            );
            findings.push(`Total revenue: $${total}`);
        }

        return {
            score: findings.length > 0 ? 1 : 0,
            findings
        };
    }
}

// Usage
const analyzer = new MyCustomAnalyzer();
const result = analyzer.analyze(normalizedData, columnMeanings);
```

## Integration Example

Complete pipeline integration:

```typescript
import { dataPipeline } from '@/ai/DataPipeline';
import { FileAdapter } from '@/adapters';

async function analyzeUploadedFile(file: File) {
    // 1. Connect to data source
    const adapter = new FileAdapter();
    await adapter.connect({
        name: 'upload',
        type: 'file',
        file,
        fileType: 'csv'
    });

    // 2. Fetch data
    const data = await adapter.fetchData();

    // 3. Run pipeline
    const result = await dataPipeline.run(data, {
        sampleSize: 5000,
        autoClean: true,
        calculateMetrics: true,
        detectAnomalies: true
    });

    // 4. Use results
    console.log('Game Type:', result.gameType);
    console.log('Confidence:', result.gameTypeConfidence);
    console.log('Quality Score:', result.qualityAfter);
    console.log('Insights:', result.insights);
    console.log('Charts:', result.chartRecommendations);

    // 5. Cleanup
    await adapter.disconnect();

    return result;
}
```
