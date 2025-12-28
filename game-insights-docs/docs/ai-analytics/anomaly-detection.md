---
sidebar_position: 6
title: Anomaly Detection
description: Automatically detect unusual patterns in your game metrics
---

# Anomaly Detection

Game Insights automatically detects unusual patterns in your metrics, alerting you to potential issues or opportunities before they become obvious.

## Overview

The Anomaly Detector uses statistical analysis (Z-score) combined with historical patterns to identify when metrics deviate significantly from expectations.

```typescript
import { anomalyDetector } from '@/ai';

// Detect anomalies in your data
const anomalies = anomalyDetector.detect(data, columnMeanings);

anomalies.forEach(anomaly => {
  console.log(`${anomaly.metric}: ${anomaly.type} detected`);
  console.log(`  Severity: ${anomaly.severity}`);
  console.log(`  Value: ${anomaly.value} (expected: ${anomaly.expectedValue})`);
});
```

---

## Z-Score Analysis

### How Z-Score Works

Z-score measures how many standard deviations a value is from the mean:

```
Z = (value - mean) / standardDeviation
```

- **Z > 2**: Unusually high (top 2.5%)
- **Z > 3**: Extremely high (top 0.1%)
- **Z < -2**: Unusually low (bottom 2.5%)
- **Z < -3**: Extremely low (bottom 0.1%)

### Detection Thresholds

```typescript
const THRESHOLDS = {
  low: 2.0,       // |Z| >= 2.0
  medium: 2.5,    // |Z| >= 2.5
  high: 3.0,      // |Z| >= 3.0
  critical: 4.0,  // |Z| >= 4.0
};
```

---

## Severity Levels

| Severity | Z-Score | Probability | Response |
|----------|---------|-------------|----------|
| **Critical** | 4.0+ | &lt;0.01% | Immediate action |
| **High** | 3.0-4.0 | 0.01-0.1% | Action needed |
| **Medium** | 2.5-3.0 | 0.1-0.6% | Investigate |
| **Low** | 2.0-2.5 | 0.6-2.3% | Monitor |

### Severity Examples

| Metric | Normal Range | Medium Alert | Critical Alert |
|--------|--------------|--------------|----------------|
| DAU | 8,000-12,000 | 6,000 or 14,000 | &lt;4,000 or &gt;16,000 |
| Revenue | $8,000-$12,000 | $5,000 or $15,000 | &lt;$3,000 or &gt;$18,000 |
| D1 Retention | 38%-52% | 30% or 60% | &lt;25% or &gt;65% |

---

## Anomaly Types

### Spike

A sudden increase significantly above normal:

```typescript
{
  type: 'spike',
  metric: 'revenue',
  value: 25000,
  expectedValue: 10000,
  deviation: 3.75,
  severity: 'high',
  possibleCauses: [
    'Successful promotion or sale',
    'Viral marketing effect',
    'App store feature'
  ]
}
```

### Drop

A sudden decrease significantly below normal:

```typescript
{
  type: 'drop',
  metric: 'dau',
  value: 5000,
  expectedValue: 10000,
  deviation: -3.5,
  severity: 'high',
  possibleCauses: [
    'Server or technical issues',
    'App store ranking drop',
    'Competitor launch'
  ]
}
```

### Trend Break

A change in the ongoing trend pattern:

```typescript
{
  type: 'trend_break',
  metric: 'revenue',
  value: 8000,
  expectedValue: 12000,
  deviation: -2.8,
  severity: 'medium',
  possibleCauses: [
    'Market saturation',
    'Product lifecycle change',
    'Monetization fatigue'
  ]
}
```

### Pattern Change

A shift in typical patterns (e.g., day-of-week behavior):

```typescript
{
  type: 'pattern_change',
  metric: 'session_count',
  value: 15000,
  expectedValue: 20000,
  deviation: -2.2,
  severity: 'low',
  possibleCauses: [
    'Seasonal behavior shift',
    'Content staleness',
    'Competitor event'
  ]
}
```

---

## Alert Integration

### Setting Up Alerts

```typescript
import { anomalyDetector } from '@/ai';

anomalyDetector.configure({
  alertOnSeverity: 'medium',
  metrics: ['revenue', 'dau', 'd1_retention'],
  windowDays: 30,
  callbacks: {
    onAnomaly: (anomaly) => {
      if (anomaly.severity === 'critical') {
        sendSlackAlert(anomaly);
        sendEmail(anomaly);
      }
    }
  }
});
```

### Alert Format

```typescript
interface AnomalyAlert {
  id: string;
  metric: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'trend_break' | 'pattern_change';
  value: number;
  expectedValue: number;
  expectedRange: [number, number];
  deviation: number;
  possibleCauses: string[];
}
```

---

## Configuration Options

### Detector Configuration

```typescript
interface AnomalyDetectorConfig {
  zScoreThreshold: number;        // Default: 2.0
  minDataPoints: number;          // Default: 7
  windowDays: number;             // Default: 30
  excludeToday: boolean;          // Default: true
  metrics?: string[];             // Default: all detected
  sensitivity: 'low' | 'medium' | 'high';
  adjustForDayOfWeek: boolean;    // Default: true
  adjustForMonthly: boolean;      // Default: true
}
```

### Sensitivity Levels

| Sensitivity | Z-Score Threshold | Use Case |
|-------------|-------------------|----------|
| Low | 3.0 | Reduce noise, only major anomalies |
| Medium | 2.5 | Balanced detection |
| High | 2.0 | Catch subtle changes |

---

## Using Anomaly Detection

### Via the Pipeline

```typescript
import { dataPipeline } from '@/ai';

const result = await dataPipeline.run(data, {
  detectAnomalies: true,
  anomalyConfig: {
    sensitivity: 'medium',
    windowDays: 30,
  },
});

// Access detected anomalies
result.anomalies.forEach(anomaly => {
  console.log(`${anomaly.metric}: ${anomaly.severity} ${anomaly.type}`);
});

// Summary statistics
console.log('Total anomalies:', result.anomalyStats.total);
console.log('Critical:', result.anomalyStats.bySeverity.critical);
```

### Direct Detection

```typescript
import { anomalyDetector } from '@/ai';

// Detect for specific metric
const revenueAnomalies = anomalyDetector.detectForMetric(
  revenueData,
  'revenue',
  { windowDays: 30 }
);

// Detect across all metrics
const allAnomalies = anomalyDetector.detect(data, columnMeanings);
```

---

## API Reference

### AnomalyDetector Class

```typescript
class AnomalyDetector {
  configure(config: AnomalyDetectorConfig): void;

  detect(
    data: NormalizedData,
    columnMeanings: ColumnMeaning[]
  ): Anomaly[];

  detectForMetric(
    values: number[],
    metric: string,
    config?: Partial<AnomalyDetectorConfig>
  ): Anomaly[];

  onAnomaly(callback: (anomaly: Anomaly) => void): void;

  getHistory(
    metric?: string,
    minSeverity?: Anomaly['severity'],
    limit?: number
  ): Anomaly[];
}
```

### Anomaly Interface

```typescript
interface Anomaly {
  id: string;
  metric: string;
  timestamp: string;
  value: number;
  expectedValue: number;
  expectedRange: [number, number];
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'trend_break' | 'pattern_change';
  possibleCauses: string[];
}
```

---

## Best Practices

### Tuning Sensitivity

1. **Start with medium sensitivity** for balanced detection
2. **Increase for critical metrics** like revenue
3. **Decrease for volatile metrics** to reduce noise

### Handling False Positives

1. **Exclude known events** from baseline
2. **Use longer windows** (30+ days) for stable baselines
3. **Enable seasonal adjustment** for day-of-week patterns

### Responding to Alerts

| Severity | Response Time | Action |
|----------|---------------|--------|
| Critical | Immediate | Root cause investigation |
| High | Within 1 hour | Detailed analysis |
| Medium | Within 4 hours | Review and monitor |
| Low | Next business day | Log and track |

---

## Next Steps

- [AI Recommendations](./recommendations) - Get action suggestions
- [Revenue Forecasting](./predictions/revenue) - Predict revenue changes
- [Retention Prediction](./predictions/retention) - Early warning on retention
