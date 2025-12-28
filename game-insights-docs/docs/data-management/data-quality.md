---
sidebar_position: 4
title: Data Quality
description: Understanding and improving data quality in Game Insights
---

# Data Quality

Data quality directly impacts the accuracy of your analytics and predictions. Game Insights includes a comprehensive data quality system that automatically analyzes your data, identifies issues, and provides actionable cleaning recommendations.

## Quality Score Overview

Every dataset receives a quality score from 0-100 based on multiple factors:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA QUALITY REPORT                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Overall Score: 87/100  ████████████████████░░░░  Good                 │
│                                                                         │
│   ┌─────────────────┬────────────┬──────────────────────────────────┐  │
│   │ Dimension       │ Score      │ Status                           │  │
│   ├─────────────────┼────────────┼──────────────────────────────────┤  │
│   │ Completeness    │ 92/100     │ ████████████████████░░ Excellent │  │
│   │ Validity        │ 88/100     │ ██████████████████░░░░ Good      │  │
│   │ Consistency     │ 85/100     │ █████████████████░░░░░ Good      │  │
│   │ Uniqueness      │ 90/100     │ ███████████████████░░░ Excellent │  │
│   │ Timeliness      │ 80/100     │ ████████████████░░░░░░ Good      │  │
│   └─────────────────┴────────────┴──────────────────────────────────┘  │
│                                                                         │
│   Issues Found: 3 warnings, 12 info                                     │
│   [View Details]  [Auto-Clean]  [Export Report]                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Score Interpretation

| Score Range | Rating | Action Recommended |
|-------------|--------|-------------------|
| 90-100 | Excellent | Ready for analysis |
| 75-89 | Good | Minor cleanup optional |
| 50-74 | Fair | Review and clean issues |
| 25-49 | Poor | Significant cleaning needed |
| 0-24 | Critical | Major data issues - investigate source |

## Quality Dimensions

### Completeness

Measures the percentage of non-null values in required columns.

```typescript
interface CompletenessReport {
  score: number;
  totalCells: number;
  filledCells: number;
  missingByColumn: {
    column: string;
    missingCount: number;
    missingPercent: number;
    severity: 'critical' | 'warning' | 'info';
  }[];
}
```

#### Completeness Rules

| Column Type | Expected Completeness | Severity if Below |
|-------------|----------------------|-------------------|
| `user_id` | 100% | Critical |
| `timestamp` | 100% | Critical |
| `event_type` | 100% | Critical |
| `session_id` | >95% | Warning |
| `revenue` | >90% | Warning |
| `country` | >80% | Info |
| Other | >70% | Info |

#### Visualizing Missing Data

```
Missing Values by Column:

user_id      │ 0.0%  ████████████████████████████████████████
timestamp    │ 0.0%  ████████████████████████████████████████
event_type   │ 0.1%  ████████████████████████████████████████
session_id   │ 2.3%  █████████████████████████████████████░░░
country      │ 8.5%  ██████████████████████████████████░░░░░░
device_type  │ 12.1% ███████████████████████████████░░░░░░░░░
```

### Validity

Checks that values conform to expected formats and ranges.

```typescript
interface ValidityReport {
  score: number;
  checks: {
    column: string;
    checkType: 'format' | 'range' | 'enum' | 'type';
    validCount: number;
    invalidCount: number;
    invalidExamples: unknown[];
    suggestion: string;
  }[];
}
```

#### Validity Check Types

| Check Type | Description | Example |
|------------|-------------|---------|
| **Format** | Pattern matching | Email format, UUID format |
| **Range** | Numeric bounds | Revenue > 0, Level 1-100 |
| **Enum** | Allowed values | Platform in ['ios', 'android'] |
| **Type** | Data type match | Timestamp is valid date |
| **Reference** | Foreign key exists | user_id exists in users |

#### Example Validity Issues

```json
{
  "column": "timestamp",
  "checkType": "format",
  "invalidCount": 156,
  "invalidExamples": [
    "2024-13-45",     // Invalid month/day
    "not-a-date",     // Non-date string
    "1709294400000"   // Unix timestamp (valid but different format)
  ],
  "suggestion": "Convert Unix timestamps to ISO 8601 format"
}
```

### Consistency

Evaluates logical consistency across related columns.

```typescript
interface ConsistencyReport {
  score: number;
  rules: {
    name: string;
    description: string;
    violations: number;
    examples: Record<string, unknown>[];
  }[];
}
```

#### Built-in Consistency Rules

| Rule | Description | Example Violation |
|------|-------------|-------------------|
| **Temporal Order** | Events in chronological order | session_end before session_start |
| **Value Relationships** | Logical value constraints | total_revenue < transaction_revenue |
| **Categorical Logic** | Related category consistency | platform='ios' but os='android' |
| **Aggregate Consistency** | Sum/count validations | session_count != count of sessions |
| **State Transitions** | Valid state changes | level decreased without prestige |

#### Example Consistency Check

```typescript
// Custom consistency rule
const rules = [
  {
    name: 'revenue_positive',
    check: (row) => row.revenue >= 0 || row.event_type !== 'purchase',
    description: 'Purchase events should have non-negative revenue'
  },
  {
    name: 'level_progression',
    check: (row, prevRow) => row.level >= prevRow?.level || row.event_type === 'prestige',
    description: 'Level should not decrease without prestige event'
  }
];
```

### Uniqueness

Identifies duplicate records and ensures unique identifiers are truly unique.

```typescript
interface UniquenessReport {
  score: number;
  duplicateRows: {
    count: number;
    percentage: number;
    examples: unknown[][];
  };
  duplicateKeys: {
    column: string;
    expectedUnique: boolean;
    duplicateCount: number;
    totalValues: number;
  }[];
}
```

#### Duplicate Detection Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Exact** | Identical rows | Find copy/paste errors |
| **Key-based** | Same primary key | Duplicate events |
| **Fuzzy** | Similar within threshold | Near-duplicates |

#### Uniqueness Expectations

| Column Type | Should Be Unique | Notes |
|-------------|------------------|-------|
| `user_id` | No | Multiple events per user |
| `session_id` | No | Multiple events per session |
| `user_id + timestamp` | Usually | May have simultaneous events |
| `event_id` | Yes | Primary key |
| `install_id` | Yes | One per installation |

### Timeliness

Assesses the freshness and temporal distribution of data.

```typescript
interface TimelinessReport {
  score: number;
  dateRange: {
    min: Date;
    max: Date;
    span: number;  // days
  };
  freshness: {
    mostRecentEvent: Date;
    daysSinceLatest: number;
  };
  gaps: {
    start: Date;
    end: Date;
    duration: number;  // hours
  }[];
  distribution: {
    date: string;
    eventCount: number;
  }[];
}
```

#### Timeliness Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Stale data | >7 days since latest event | Warning |
| Future dates | Events with future timestamps | Critical |
| Large gaps | >24h with no events | Warning |
| Uneven distribution | Variance >3x average | Info |

## Missing Value Detection

### Detection Methods

Game Insights identifies missing values through multiple checks:

```typescript
const missingValuePatterns = [
  null,
  undefined,
  '',              // Empty string
  'null',          // String 'null'
  'NULL',          // String 'NULL'
  'N/A',           // Common placeholder
  'n/a',
  'NA',
  '-',             // Dash placeholder
  '#N/A',          // Excel error
  'undefined',     // String 'undefined'
  'NaN'            // String 'NaN'
];
```

### Missing Value Report

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MISSING VALUE ANALYSIS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Column: country                                                        │
│  ───────────────                                                        │
│  Missing: 4,250 of 50,000 (8.5%)                                        │
│                                                                         │
│  Pattern Analysis:                                                      │
│  • 3,800 empty strings ('')                                             │
│  • 350 explicit 'null' values                                           │
│  • 100 'N/A' placeholders                                               │
│                                                                         │
│  Missing Value Distribution:                                            │
│  ┌──────────────┬─────────────────────────────────────────────────────┐ │
│  │ Platform     │ Missing Rate                                        │ │
│  ├──────────────┼─────────────────────────────────────────────────────┤ │
│  │ iOS          │ 2.1%  ████░░░░░░░░░░░░░░░░                          │ │
│  │ Android      │ 15.8% ████████████████░░░░                          │ │
│  └──────────────┴─────────────────────────────────────────────────────┘ │
│                                                                         │
│  Recommendation: Android SDK may have geo-detection issue               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Missing Value Imputation

Game Insights offers several imputation strategies:

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Remove rows** | Delete rows with missing values | Critical columns |
| **Default value** | Replace with constant | Categorical with known default |
| **Mean/Median** | Use statistical measure | Numeric columns |
| **Mode** | Most frequent value | Categorical columns |
| **Forward fill** | Previous row value | Time series |
| **Interpolate** | Linear interpolation | Continuous numeric |
| **Model-based** | ML prediction | Complex relationships |

```typescript
// Configure imputation
const cleaningPlan = {
  country: { strategy: 'mode' },
  revenue: { strategy: 'default', value: 0 },
  session_duration: { strategy: 'median' },
  level: { strategy: 'forward_fill' }
};
```

## Outlier Identification

### Detection Methods

#### Statistical Methods

```typescript
interface OutlierDetection {
  method: 'zscore' | 'iqr' | 'isolation_forest' | 'percentile';
  threshold?: number;
  columns?: string[];
}

// Z-Score: |z| > 3 considered outlier
// IQR: < Q1 - 1.5*IQR or > Q3 + 1.5*IQR
// Percentile: Outside specified percentile range
```

#### Z-Score Method

```
Revenue Distribution with Z-Score Outliers:

                     Normal Range (|z| < 3)
                ◄─────────────────────────────►
     │                                              ◆ Outliers
   F │   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
   r │  █████████████████████████▄
   e │ ████████████████████████████▄
   q │██████████████████████████████▄        ◆ $999.99
     │███████████████████████████████▄   ◆ $500.00
     └────────────────────────────────────────────────────►
       $0      $10      $20      $30      $40     Revenue
```

#### IQR Method

```typescript
const iqrOutliers = detectOutliers({
  column: 'revenue',
  method: 'iqr',
  multiplier: 1.5  // Standard IQR multiplier
});

// Result
{
  column: 'revenue',
  q1: 0,
  q3: 9.99,
  iqr: 9.99,
  lowerBound: -14.985,  // Q1 - 1.5*IQR
  upperBound: 24.975,   // Q3 + 1.5*IQR
  outlierCount: 234,
  outlierPercent: 0.47
}
```

### Contextual Outliers

Some outliers are only unusual in context:

```typescript
// Contextual outlier detection
const contextualOutliers = detectContextualOutliers({
  column: 'session_duration',
  context: {
    groupBy: 'platform',
    timeWindow: '1d'
  }
});

// A 60-minute session might be normal for PC games
// but an outlier for mobile casual games
```

### Outlier Handling Options

| Action | Description | Use Case |
|--------|-------------|----------|
| **Flag** | Mark but keep | Review manually |
| **Remove** | Delete rows | Known bad data |
| **Cap** | Winsorize to bounds | Reduce influence |
| **Transform** | Log transformation | Normalize distribution |
| **Investigate** | Drill down | Understand cause |

## Data Cleaning Actions

### Automatic Cleaning

Game Insights generates a cleaning plan based on detected issues:

```typescript
interface CleaningPlan {
  actions: CleaningAction[];
  estimatedImpact: {
    rowsAffected: number;
    columnsAffected: number;
    qualityScoreImprovement: number;
  };
}

interface CleaningAction {
  type: 'remove_duplicates' | 'fill_missing' | 'fix_format' |
        'remove_outliers' | 'standardize' | 'custom';
  column?: string;
  params: Record<string, unknown>;
  priority: 'high' | 'medium' | 'low';
  description: string;
}
```

### Cleaning Plan Example

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RECOMMENDED CLEANING PLAN                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠ High Priority                                                        │
│  ─────────────                                                          │
│  1. Remove 156 duplicate events                                         │
│     Impact: 0.3% of rows                                                │
│     [Apply] [Skip]                                                      │
│                                                                         │
│  2. Fix 89 invalid timestamps                                           │
│     Pattern: Unix ms → ISO 8601                                         │
│     [Apply] [Skip]                                                      │
│                                                                         │
│  ℹ Medium Priority                                                      │
│  ────────────────                                                       │
│  3. Fill 4,250 missing country values                                   │
│     Strategy: Mode imputation (US: 45%)                                 │
│     [Apply] [Skip] [Configure]                                          │
│                                                                         │
│  4. Cap 12 revenue outliers                                             │
│     Current max: $999.99 → Cap at: $99.99                               │
│     [Apply] [Skip] [Configure]                                          │
│                                                                         │
│  Estimated Quality Score: 87 → 94 (+7 points)                           │
│                                                                         │
│  [Apply All]  [Apply Selected]  [Preview Changes]  [Export Plan]        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Manual Cleaning Actions

#### Remove Duplicates

```typescript
await cleanData({
  action: 'remove_duplicates',
  params: {
    subset: ['user_id', 'timestamp', 'event_type'],
    keep: 'first'  // 'first' | 'last' | 'none'
  }
});
```

#### Standardize Values

```typescript
await cleanData({
  action: 'standardize',
  column: 'country',
  params: {
    mapping: {
      'US': 'United States',
      'USA': 'United States',
      'uk': 'United Kingdom',
      'UK': 'United Kingdom'
    },
    lowercase: false
  }
});
```

#### Fix Date Formats

```typescript
await cleanData({
  action: 'fix_format',
  column: 'timestamp',
  params: {
    sourceFormat: 'auto',  // or specific format
    targetFormat: 'ISO8601',
    timezone: 'UTC'
  }
});
```

### Preview Changes

Always preview before applying:

```typescript
const preview = await previewCleaning(cleaningPlan);

// Returns
{
  sampleBefore: [...],  // 10 sample rows before
  sampleAfter: [...],   // Same rows after cleaning
  changes: [
    { row: 0, column: 'country', before: 'US', after: 'United States' },
    { row: 3, column: 'timestamp', before: '1709294400000', after: '2024-03-01T12:00:00Z' }
  ]
}
```

## Quality Monitoring

### Setting Up Alerts

Configure alerts for quality degradation:

```typescript
const qualityAlert = {
  name: 'Data Quality Alert',
  conditions: [
    { metric: 'overall_score', operator: '<', value: 75 },
    { metric: 'completeness', operator: '<', value: 90 },
    { metric: 'duplicate_rate', operator: '>', value: 5 }
  ],
  actions: ['email', 'dashboard_badge'],
  frequency: 'on_upload'
};
```

### Quality Trends

Track quality over time:

```
Quality Score Trend (Last 30 Days)

100 ┤
 90 ┤    ●───●───●───●───●
 80 ┤   ╱                 ╲●───●───●
 70 ┤  ╱
 60 ┤●╱
 50 ┤
    └─────────────────────────────────────►
     Week 1   Week 2   Week 3   Week 4

Events:
• Week 1: Initial data import
• Week 2: Cleaned duplicates (+15 points)
• Week 4: New SDK version introduced missing fields
```

## Best Practices

### Before Upload

1. **Profile your data source** - Understand expected patterns
2. **Set up validation at source** - Catch issues early
3. **Document known issues** - Track recurring problems
4. **Establish baselines** - Define acceptable quality levels

### During Analysis

1. **Review quality report** - Don't skip warnings
2. **Investigate outliers** - They may indicate real events
3. **Check consistency** - Ensure business logic is preserved
4. **Document cleaning** - Track what was changed and why

### Ongoing Monitoring

1. **Set quality thresholds** - Alert when quality drops
2. **Track trends** - Watch for gradual degradation
3. **Regular audits** - Periodic manual review
4. **Feedback loop** - Improve data collection based on issues

## Export Quality Report

Export reports for documentation or sharing:

```typescript
// Export as JSON
const report = await exportQualityReport({
  format: 'json',
  include: ['summary', 'details', 'recommendations']
});

// Export as PDF
const pdf = await exportQualityReport({
  format: 'pdf',
  template: 'detailed'
});
```

## Next Steps

- [Configure data sources](/docs/data-management/sources/file-adapter)
- [Set up automated data pipelines](/docs/data-management/sources/webhooks)
- [Explore AI-powered cleaning](/docs/ai-analytics/overview)
