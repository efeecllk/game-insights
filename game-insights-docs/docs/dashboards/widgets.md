---
sidebar_position: 3
title: Widgets
description: Complete reference for all dashboard widget types in Game Insights
---

# Dashboard Widgets

Game Insights provides a variety of widget types to visualize your game analytics data. Each widget is designed for specific use cases and can be customized through the configuration panel.

## Widget Types Overview

| Widget | Icon | Description | Default Size |
|--------|------|-------------|--------------|
| [KPI Card](#kpi-cards) | :chart_with_upwards_trend: | Single metric with trend | 3x2 |
| [Line Chart](#line-charts) | :chart_with_downwards_trend: | Time series visualization | 6x4 |
| [Bar Chart](#bar-charts) | :bar_chart: | Compare categories | 6x4 |
| [Pie Chart](#piedonut-charts) | :pie: | Show distribution | 4x4 |
| [Area Chart](#area-charts) | :chart_with_upwards_trend: | Stacked time series | 6x4 |
| [Data Table](#data-tables) | :clipboard: | Detailed data view | 6x4 |
| [Funnel Chart](#funnel-charts) | :small_red_triangle_down: | Conversion funnel | 4x4 |
| [Cohort Heatmap](#cohort-heatmaps) | :fire: | Retention analysis | 8x5 |
| [Text Block](#text-blocks) | :memo: | Notes or headers | 4x2 |

## KPI Cards

KPI cards display a single metric value with optional trend indicator and comparison.

### Visual Structure

```
┌─────────────────────────────────┐
│  Daily Active Users             │
│                                 │
│           12,456                │
│                                 │
│       ▲ +12.5%                  │
│       vs last period            │
└─────────────────────────────────┘
```

### Configuration Options

```typescript
interface KPIWidgetConfig {
  // Required
  metric: MetricType;

  // Display
  title?: string;
  showTrend?: boolean;        // Default: true
  format?: 'number' | 'percent' | 'currency';
  decimals?: number;          // Default: 0

  // Comparison
  comparison?: 'previous_period' | 'previous_year' | 'none';
  dateRange?: DateRange;
}
```

### Available Metrics

| Metric Key | Display Name | Format |
|------------|--------------|--------|
| `dau` | Daily Active Users | Number |
| `mau` | Monthly Active Users | Number |
| `revenue` | Revenue | Currency |
| `d1_retention` | D1 Retention | Percent |
| `d7_retention` | D7 Retention | Percent |
| `d30_retention` | D30 Retention | Percent |
| `arpu` | ARPU | Currency |
| `arppu` | ARPPU | Currency |
| `conversion_rate` | Conversion Rate | Percent |
| `session_length` | Avg Session Length | Number |
| `sessions_per_user` | Sessions/User | Number |

### Usage Example

```tsx
import { KPIWidget } from '@/components/widgets';

<KPIWidget
  widget={{
    id: 'kpi-dau',
    type: 'kpi',
    position: { x: 0, y: 0, w: 3, h: 2 },
    config: {
      title: 'Daily Active Users',
      metric: 'dau',
      showTrend: true,
      format: 'number'
    }
  }}
/>
```

### Trend Colors

| Condition | Color | Icon |
|-----------|-------|------|
| Positive change | Green (#22c55e) | Arrow Up |
| Negative change | Red (#ef4444) | Arrow Down |
| No change | Gray (#71717a) | Dash |

## Line Charts

Line charts visualize time series data with smooth curves and optional area fills.

### Visual Structure

```
┌─────────────────────────────────────────┐
│  DAU Trend                              │
│                                         │
│  ▲                                      │
│  │      ●                               │
│  │    ╱   ╲       ●                     │
│  │  ╱       ╲   ╱   ╲                   │
│  │╱           ╲╱       ╲●               │
│  │                       ╲___●          │
│  └──────────────────────────────────►   │
│    Mon  Tue  Wed  Thu  Fri  Sat  Sun   │
└─────────────────────────────────────────┘
```

### Configuration Options

```typescript
interface LineChartConfig {
  metric: MetricType;
  title?: string;
  dateRange?: DateRange;
  showLegend?: boolean;
  chartColor?: string;
  smooth?: boolean;         // Default: true
  showDataPoints?: boolean; // Default: true
  areaFill?: boolean;       // Default: true
}
```

### Data Structure

```typescript
interface ChartData {
  date: string;   // '2024-01-15'
  value: number;  // 12456
}
```

### Features

- **Smooth curves** - Bezier interpolation for visual appeal
- **Gradient area** - Fill below line with transparency gradient
- **Data points** - Circular markers at each data point
- **Interactive tooltips** - Hover for exact values
- **Responsive** - Adapts to container width

## Bar Charts

Bar charts compare categorical data with horizontal bars.

### Visual Structure

```
┌─────────────────────────────────────────┐
│  Top Products                           │
│                                         │
│  Category A  ████████████████   65%    │
│  Category B  ████████████       45%    │
│  Category C  ████████           30%    │
│  Category D  █████              20%    │
└─────────────────────────────────────────┘
```

### Configuration Options

```typescript
interface BarChartConfig {
  title?: string;
  metric?: MetricType;
  orientation?: 'horizontal' | 'vertical';
  showValues?: boolean;      // Default: true
  showPercentages?: boolean; // Default: true
  chartColor?: string;
  maxBars?: number;          // Default: 10
}
```

### Use Cases

- Top performing items
- Category comparisons
- Segment distributions
- Feature usage ranking

## Pie/Donut Charts

Pie charts show proportional distribution of categories.

### Visual Structure

```
┌─────────────────────────────────────────┐
│  Revenue Sources                        │
│                                         │
│       ╭───────╮        ● IAP     60%    │
│     ╱ ╱       ╲ ╲      ● Ads     25%    │
│    │ │   IAP   │ │     ● Subs    15%    │
│    │ │ ╭─────╮ │ │                      │
│     ╲ ╲ Subs ╱ ╱                        │
│       ╰──Ads─╯                          │
└─────────────────────────────────────────┘
```

### Configuration Options

```typescript
interface PieChartConfig {
  title?: string;
  donut?: boolean;          // Default: false
  showLabels?: boolean;     // Default: true
  showLegend?: boolean;     // Default: true
  showPercentages?: boolean;// Default: true
  colors?: string[];
}
```

### Data Structure

```typescript
interface PieData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}
```

### Donut vs Pie

```
   PIE CHART              DONUT CHART
   ╭───────╮              ╭───────╮
 ╱ ╱       ╲ ╲          ╱ ╱ ╭───╮ ╲ ╲
│ │  Filled │ │        │ │ │   │ │ │
│ │  Center │ │        │ │ │   │ │ │
 ╲ ╲       ╱ ╱          ╲ ╲ ╰───╯ ╱ ╱
   ╰───────╯              ╰───────╯
```

## Area Charts

Area charts show stacked or single time series with filled areas.

### Visual Structure

```
┌─────────────────────────────────────────┐
│  Revenue Over Time                      │
│                                         │
│  ▲ ███████████████████████████████████ │
│  │ ████████████████████████████████    │
│  │ █████████████████████████████       │
│  │ ██████████████████████████          │
│  │ ███████████████████████             │
│  └──────────────────────────────────►   │
└─────────────────────────────────────────┘
```

### Configuration Options

```typescript
interface AreaChartConfig {
  title?: string;
  metric: MetricType;
  stacked?: boolean;        // Default: false
  opacity?: number;         // Default: 0.3
  showLine?: boolean;       // Default: true
  dateRange?: DateRange;
}
```

### Stacked vs Single

- **Single area** - One metric over time
- **Stacked area** - Multiple metrics summed visually

## Data Tables

Tables display detailed data in rows and columns with sorting and filtering.

### Visual Structure

```
┌─────────────────────────────────────────────┐
│  Recent Transactions                         │
├──────────────────┬──────────┬───────────────┤
│  Name            │ Revenue  │ Sales         │
├──────────────────┼──────────┼───────────────┤
│  Starter Pack    │  $1,249  │   312         │
│  Premium Bundle  │    $890  │    89         │
│  Coin Pack       │    $567  │   567         │
└──────────────────┴──────────┴───────────────┘
```

### Configuration Options

```typescript
interface TableConfig {
  title?: string;
  columns?: ColumnDefinition[];
  sortable?: boolean;       // Default: true
  filterable?: boolean;     // Default: false
  pageSize?: number;        // Default: 10
  showPagination?: boolean; // Default: true
}

interface ColumnDefinition {
  key: string;
  label: string;
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date';
  align?: 'left' | 'right' | 'center';
  width?: string;
  sortable?: boolean;
}
```

### Features

- **Sortable columns** - Click header to sort
- **Pagination** - Navigate large datasets
- **Responsive** - Horizontal scroll on small screens
- **Custom formatting** - Per-column number formatting

## Funnel Charts

Funnel charts visualize conversion through sequential stages.

### Visual Structure

```
┌─────────────────────────────────────────┐
│  Conversion Funnel                       │
│                                          │
│  Impressions  ████████████████ 100%     │
│  Installs     ████████         25%      │ ← 75% drop
│  Registrations█████            15%      │ ← 10% drop
│  Purchases    ██               3%       │ ← 12% drop
└─────────────────────────────────────────┘
```

### Configuration Options

```typescript
interface FunnelConfig {
  title?: string;
  showPercentages?: boolean;  // Default: true
  showDropOff?: boolean;      // Default: true
  showAbsolute?: boolean;     // Default: false
  orientation?: 'horizontal' | 'vertical';
  colors?: string[];
}
```

### Data Structure

```typescript
interface FunnelStep {
  name: string;
  value: number;
  percentage: number;
  dropOff?: number;
}
```

### Game-Specific Funnels

| Game Type | Funnel Stages |
|-----------|---------------|
| Puzzle | Level 1 → Level 5 → Level 10 → Level 15 → Level 20 → Level 30 |
| Idle | Never Prestiged → 1x → 2-5x → 5+ |
| Battle Royale | Bronze → Silver → Gold → Diamond → Legendary |
| Match-3 Meta | Chapter 1 → Chapter 3 → Chapter 5 → Chapter 7 |
| Gacha RPG | F2P → Minnow → Dolphin → Whale |

## Cohort Heatmaps

Cohort heatmaps display retention data across user cohorts and time periods.

### Visual Structure

```
┌──────────────────────────────────────────────────────┐
│  Retention Cohort                                    │
├──────────────────────────────────────────────────────┤
│        │  D0   │  D1   │  D3   │  D7   │ D14  │ D30 │
├────────┼───────┼───────┼───────┼───────┼──────┼─────┤
│  W1    │ 100%  │  42%  │  32%  │  18%  │ 12%  │  8% │
│        │ ████  │ ███   │ ██    │ █     │ █    │     │
├────────┼───────┼───────┼───────┼───────┼──────┼─────┤
│  W2    │ 100%  │  45%  │  35%  │  20%  │ 14%  │ 10% │
│        │ ████  │ ███   │ ███   │ ██    │ █    │ █   │
├────────┼───────┼───────┼───────┼───────┼──────┼─────┤
│  W3    │ 100%  │  40%  │  30%  │  17%  │ 11%  │  7% │
│        │ ████  │ ██    │ ██    │ █     │ █    │     │
└────────┴───────┴───────┴───────┴───────┴──────┴─────┘
```

### Configuration Options

```typescript
interface CohortConfig {
  title?: string;
  cohortPeriod?: 'day' | 'week' | 'month';
  retentionDays?: number[];   // [1, 3, 7, 14, 30]
  colorScale?: 'purple' | 'green' | 'blue';
  showValues?: boolean;       // Default: true
  showLegend?: boolean;       // Default: true
}
```

### Color Intensity

The cell background color intensity corresponds to the retention percentage:

```
100% retention = rgba(139, 92, 246, 1.0)    // Full purple
 50% retention = rgba(139, 92, 246, 0.5)    // Half opacity
  0% retention = rgba(139, 92, 246, 0.0)    // Transparent
```

### Reading the Heatmap

- **Rows** = User cohorts (when users joined)
- **Columns** = Days since join (D0, D1, D3, etc.)
- **Cell value** = Percentage still active
- **Color** = Visual indicator (darker = higher retention)

## Text Blocks

Text blocks add notes, headers, or explanatory content to dashboards.

### Visual Structure

```
┌─────────────────────────────────────────┐
│  Q4 Revenue Analysis                     │
│                                          │
│  This dashboard tracks revenue metrics   │
│  for the holiday season campaign.        │
│  Updated weekly on Mondays.              │
└─────────────────────────────────────────┘
```

### Configuration Options

```typescript
interface TextConfig {
  title?: string;
  textContent?: string;       // Supports basic formatting
  alignment?: 'left' | 'center' | 'right';
  fontSize?: 'small' | 'medium' | 'large';
}
```

### Use Cases

- Dashboard titles and sections
- Notes and annotations
- Data source information
- Update schedules
- Team attribution

## Widget Configuration Options

### Common Options

All widgets share these configuration options:

```typescript
interface WidgetConfig {
  // Display
  title?: string;
  subtitle?: string;

  // Time
  dateRange?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  customDateRange?: [string, string];  // ['2024-01-01', '2024-01-31']
  comparison?: 'previous_period' | 'previous_year' | 'none';

  // Formatting
  format?: 'number' | 'percent' | 'currency';
  decimals?: number;

  // Appearance
  chartColor?: string;
}
```

### Date Range Options

| Option | Description |
|--------|-------------|
| `today` | Current day |
| `yesterday` | Previous day |
| `last_7_days` | Past 7 days including today |
| `last_30_days` | Past 30 days including today |
| `last_90_days` | Past 90 days including today |
| `custom` | Custom date range |

### Comparison Periods

| Option | Description |
|--------|-------------|
| `previous_period` | Same length period immediately before |
| `previous_year` | Same period one year ago |
| `none` | No comparison |

## Widget Presets

Each widget type has default size presets:

```typescript
const WIDGET_PRESETS: Record<WidgetType, WidgetPreset> = {
  kpi: {
    name: 'KPI Card',
    icon: '📈',
    defaultSize: { w: 3, h: 2 },
    description: 'Single metric with trend indicator'
  },
  line_chart: {
    name: 'Line Chart',
    icon: '📉',
    defaultSize: { w: 6, h: 4 },
    description: 'Time series visualization'
  },
  bar_chart: {
    name: 'Bar Chart',
    icon: '📊',
    defaultSize: { w: 6, h: 4 },
    description: 'Compare categories'
  },
  pie_chart: {
    name: 'Pie Chart',
    icon: '🥧',
    defaultSize: { w: 4, h: 4 },
    description: 'Show distribution'
  },
  area_chart: {
    name: 'Area Chart',
    icon: '📈',
    defaultSize: { w: 6, h: 4 },
    description: 'Stacked time series'
  },
  table: {
    name: 'Data Table',
    icon: '📋',
    defaultSize: { w: 6, h: 4 },
    description: 'Detailed data view'
  },
  funnel: {
    name: 'Funnel',
    icon: '🔻',
    defaultSize: { w: 4, h: 4 },
    description: 'Conversion funnel'
  },
  cohort: {
    name: 'Cohort Heatmap',
    icon: '🔥',
    defaultSize: { w: 8, h: 5 },
    description: 'Retention cohort analysis'
  },
  text: {
    name: 'Text Block',
    icon: '📝',
    defaultSize: { w: 4, h: 2 },
    description: 'Add notes or headers'
  }
};
```

## Widget Lifecycle

```
Create → Configure → Render → Update → Delete

   │         │          │        │        │
   ▼         ▼          ▼        ▼        ▼

createWidget  Update   Display   Data    Remove
    ()       config   in grid   change   from
            panel              refresh  dashboard
```

## Best Practices

### Choosing the Right Widget

| Data Type | Recommended Widget |
|-----------|-------------------|
| Single KPI | KPI Card |
| Time series | Line Chart or Area Chart |
| Category comparison | Bar Chart |
| Distribution | Pie Chart |
| Conversion flow | Funnel Chart |
| Retention analysis | Cohort Heatmap |
| Detailed data | Data Table |
| Annotations | Text Block |

### Widget Sizing

| Widget Type | Recommended Width | Recommended Height |
|-------------|------------------|-------------------|
| KPI Card | 2-3 columns | 2 rows |
| Charts | 4-8 columns | 3-5 rows |
| Tables | 6-12 columns | 4-6 rows |
| Cohort | 8-12 columns | 5-6 rows |
| Text | 2-6 columns | 1-2 rows |

### Performance Tips

1. Limit to 10-15 widgets per dashboard
2. Use appropriate date ranges
3. Avoid real-time refresh unless needed
4. Group related metrics on same dashboard

## Next Steps

- [Charts Reference](/docs/dashboards/charts) - Detailed chart configuration
- [Dashboard Builder](/docs/dashboards/builder) - Building custom dashboards
- [Exporting](/docs/dashboards/exporting) - Export and share widgets
