---
sidebar_position: 4
title: Charts
description: Complete guide to chart configuration, the chart registry system, and ECharts integration in Game Insights
---

# Charts

Game Insights uses [Apache ECharts](https://echarts.apache.org/) for all chart visualizations, wrapped in a chart registry system that follows the Open/Closed Principle. This architecture allows adding new chart types without modifying existing code.

## Chart Registry System

The chart registry is a central catalog of all available chart components, providing metadata for automatic chart selection and consistent rendering.

### Registry Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CHART REGISTRY                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ retention_curve │  │  level_funnel   │                   │
│  ├─────────────────┤  ├─────────────────┤                   │
│  │ Component       │  │ Component       │                   │
│  │ Metadata        │  │ Metadata        │                   │
│  │ - name          │  │ - name          │                   │
│  │ - category      │  │ - category      │                   │
│  │ - fields        │  │ - fields        │                   │
│  │ - recommended   │  │ - recommended   │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ revenue_timeline│  │ session_pattern │                   │
│  ├─────────────────┤  ├─────────────────┤                   │
│  │ Component       │  │ Component       │                   │
│  │ Metadata        │  │ Metadata        │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Core Types

```typescript
// Chart type enumeration
type ChartType =
  | 'retention_curve'
  | 'level_funnel'
  | 'revenue_timeline'
  | 'session_pattern'
  | 'spender_segments'
  | 'difficulty_heatmap'
  | 'weapon_meta'
  | 'prestige_funnel'
  | 'banner_performance'
  | 'custom';

// Chart configuration
interface ChartConfig {
  type: ChartType;
  title: string;
  subtitle?: string;
  height?: number;
  interactive?: boolean;
  showLegend?: boolean;
  colors?: string[];
}

// Chart metadata
interface ChartMetadata {
  type: ChartType;
  name: string;
  description: string;
  category: string;
  requiredDataFields: string[];
  recommendedFor: string[];
}
```

### Registry Class

```typescript
import { ChartRegistry } from '@/lib/chartRegistry';

// Register a new chart
ChartRegistry.register('retention_curve', RetentionCurve, {
  name: 'Retention Curve',
  description: 'Shows player retention over days since install',
  category: 'engagement',
  requiredDataFields: ['days', 'values'],
  recommendedFor: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg']
});

// Get a chart component
const RetentionChart = ChartRegistry.get('retention_curve');

// Get chart metadata
const metadata = ChartRegistry.getMetadata('retention_curve');

// Get all charts for a game type
const puzzleCharts = ChartRegistry.getRecommendedFor('puzzle');

// Check if chart exists
const exists = ChartRegistry.has('retention_curve');
```

## Available Chart Types

### Retention Curve

Visualizes player retention over time with benchmark comparison.

```typescript
// Data structure
interface RetentionData {
  days: string[];        // ['Day 0', 'Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30']
  values: number[];      // [100, 42, 28, 18, 12, 5]
  benchmark?: number[];  // Industry benchmark for comparison
}

// Usage
<RetentionCurve
  data={retentionData}
  config={{
    title: 'User Retention',
    subtitle: 'Track how players return over time',
    height: 300,
    showLegend: true
  }}
/>
```

**Features:**
- Smooth line with gradient fill
- Benchmark overlay (dashed line)
- Interactive tooltips
- Day markers with labels

**Recommended for:** All game types

### Level Funnel

Shows progression through game levels.

```typescript
// Data structure
interface FunnelStep {
  name: string;
  value: number;
  percentage: number;
  dropOff?: number;
}

// Usage
<FunnelChart
  data={[
    { name: 'Level 1', value: 10000, percentage: 100, dropOff: 0 },
    { name: 'Level 5', value: 7500, percentage: 75, dropOff: 25 },
    { name: 'Level 10', value: 5200, percentage: 52, dropOff: 23 },
    // ...
  ]}
  config={{ title: 'Level Progression' }}
/>
```

**Recommended for:** Puzzle, Match-3 Meta

### Revenue Timeline

Time series visualization of revenue data.

```typescript
// Data structure
interface TimeSeriesData {
  name: string;
  data: DataPoint[];
  color?: string;
}

interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// Usage
<RevenueChart
  data={[{
    name: 'IAP Revenue',
    data: [
      { timestamp: 'Mon', value: 2400, label: '$2.4K' },
      { timestamp: 'Tue', value: 2100, label: '$2.1K' },
      // ...
    ],
    color: '#8b5cf6'
  }]}
  config={{ title: 'Revenue Trend' }}
/>
```

**Recommended for:** All game types

### Segment Chart

Displays distribution across segments (pie/donut).

```typescript
// Data structure
interface SegmentData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

// Usage
<SegmentChart
  data={[
    { name: 'IAP', value: 60, percentage: 60, color: '#8b5cf6' },
    { name: 'Ads', value: 25, percentage: 25, color: '#6366f1' },
    { name: 'Subs', value: 15, percentage: 15, color: '#ec4899' }
  ]}
  config={{ title: 'Revenue Mix' }}
/>
```

**Recommended for:** All game types

### Spender Segments

Visualizes player spending tiers.

```typescript
// Gacha RPG specific
const spenderData = [
  { name: 'F2P', value: 7500, percentage: 75 },
  { name: 'Minnow ($1-10)', value: 1500, percentage: 15 },
  { name: 'Dolphin ($10-100)', value: 750, percentage: 7.5 },
  { name: 'Whale ($100+)', value: 250, percentage: 2.5 }
];
```

**Recommended for:** Gacha RPG

### Weapon Meta

Shows weapon/character popularity distribution.

```typescript
// Battle Royale specific
const weaponData = [
  { name: 'AK-47', value: 32, percentage: 32, color: '#ef4444' },
  { name: 'Shotgun', value: 28, percentage: 28, color: '#f97316' },
  { name: 'SMG', value: 22, percentage: 22, color: '#eab308' },
  { name: 'Sniper', value: 18, percentage: 18, color: '#22c55e' }
];
```

**Recommended for:** Battle Royale

### Banner Performance

Tracks gacha banner revenue.

```typescript
// Gacha RPG specific
const bannerData = [{
  name: 'Banner Revenue',
  data: [
    { timestamp: 'Luna Banner', value: 45000 },
    { timestamp: 'Kai Banner', value: 32000 },
    { timestamp: 'Nova Banner', value: 28000 },
    { timestamp: 'Limited Collab', value: 78000 }
  ],
  color: '#8b5cf6'
}];
```

**Recommended for:** Gacha RPG

## Data Binding

Charts receive data through props and automatically render updates.

### Direct Data Binding

```tsx
import { useData } from '@/context/DataContext';

function MyChart() {
  const { currentDataset } = useData();

  // Transform raw data to chart format
  const chartData = transformToRetention(currentDataset);

  return <RetentionCurve data={chartData} />;
}
```

### Using Data Providers

```tsx
import { createDataProvider } from '@/lib/dataProviders';
import { useGame } from '@/context/GameContext';

function GameChart() {
  const { gameType } = useGame();
  const provider = createDataProvider(gameType);

  const retentionData = provider.getRetentionData();
  const funnelData = provider.getFunnelData();
  const revenueData = provider.getRevenueData();

  return (
    <>
      <RetentionCurve data={retentionData} />
      <FunnelChart data={funnelData} />
      <RevenueChart data={revenueData} />
    </>
  );
}
```

### Mock Data for Development

```typescript
import { getMockMetricValue, getMockChartData } from '@/lib/dashboardStore';

// Get mock KPI value
const dauData = getMockMetricValue('dau');
// { value: 12456, change: 12.5 }

// Get mock time series
const chartData = getMockChartData('dau', 14); // 14 days
// [{ date: '2024-01-01', value: 12456 }, ...]
```

## Customization Options

### Color Themes

Game Insights uses a consistent color palette:

```typescript
// Primary chart colors
const CHART_COLORS = {
  purple: '#8b5cf6',   // Primary accent
  indigo: '#6366f1',   // Secondary accent
  pink: '#ec4899',     // Tertiary
  cyan: '#22d3ee',     // Highlight
  green: '#22c55e',    // Positive
  orange: '#f97316',   // Warning
  red: '#ef4444',      // Negative
};

// Gradient definitions
const GRADIENTS = {
  purpleArea: {
    type: 'linear',
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
      { offset: 1, color: 'rgba(139, 92, 246, 0)' }
    ]
  }
};
```

### Custom Styling

```tsx
<RetentionCurve
  data={data}
  config={{
    title: 'Custom Styled Chart',
    height: 400,
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1']
  }}
  className="custom-chart-wrapper"
/>
```

### Chart Height

```tsx
// Default heights by chart type
const DEFAULT_HEIGHTS = {
  kpi: 150,
  line_chart: 300,
  bar_chart: 300,
  pie_chart: 300,
  area_chart: 300,
  funnel: 250,
  cohort: 350,
  table: 400
};
```

## Game-Type Specific Charts

Each game type has recommended chart configurations:

### Puzzle Games

| Chart | Metrics | Notes |
|-------|---------|-------|
| Level Funnel | Level 1, 5, 10, 15, 20, 30 | Show progression bottlenecks |
| Retention Curve | D1, D3, D7, D14, D30 | Compare to puzzle benchmarks |
| Revenue Timeline | Ad revenue | Focus on ad monetization |
| Segment Chart | Booster usage | Color Bomb, Extra Moves, Rainbow |

### Idle Games

| Chart | Metrics | Notes |
|-------|---------|-------|
| Prestige Funnel | Never, 1x, 2-5x, 5+ | Prestige progression |
| Session Pattern | By hour | Online vs offline time |
| Revenue Timeline | IAP revenue | By time of day |
| Segment Chart | Activity distribution | Offline % vs Online % |

### Battle Royale

| Chart | Metrics | Notes |
|-------|---------|-------|
| Rank Distribution | Bronze to Legendary | Player skill distribution |
| Weapon Meta | Top weapons | Usage percentages |
| Revenue Timeline | Battle Pass | Weekly spikes |
| Retention Curve | Standard | With shooter benchmarks |

### Match-3 Meta

| Chart | Metrics | Notes |
|-------|---------|-------|
| Chapter Funnel | Chapters 1, 3, 5, 7 | Story progression |
| Retention Curve | Standard | With meta engagement |
| Revenue Timeline | IAP (Stars) | Weekend patterns |
| Segment Chart | Decoration styles | Modern, Classic, Cozy |

### Gacha RPG

| Chart | Metrics | Notes |
|-------|---------|-------|
| Spender Funnel | F2P to Whale | Monetization tiers |
| Banner Performance | By banner | Revenue per banner |
| Retention Curve | Focus on D30 | Long-term retention |
| Revenue Timeline | Banner launches | Event spikes |

## ECharts Integration

Game Insights uses `echarts-for-react` for React integration.

### Basic Usage

```tsx
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

function MyChart({ data }) {
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#252532',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.labels,
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
      axisLabel: { color: '#71717a' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#71717a' },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } }
    },
    series: [{
      type: 'line',
      data: data.values,
      smooth: true,
      lineStyle: { color: '#8b5cf6', width: 3 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0)' }
          ]
        }
      }
    }],
    animationDuration: 1500,
    animationEasing: 'cubicOut'
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 300, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
```

### ECharts Options Reference

| Option | Description |
|--------|-------------|
| `tooltip` | Hover tooltip configuration |
| `legend` | Chart legend settings |
| `grid` | Chart positioning within container |
| `xAxis` | X-axis configuration |
| `yAxis` | Y-axis configuration |
| `series` | Data series and visualization type |
| `animation*` | Animation settings |

### Tooltip Customization

```typescript
tooltip: {
  trigger: 'axis',
  backgroundColor: '#252532',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  textStyle: { color: '#fff' },
  formatter: (params) => {
    const p = params as Array<{ name: string; value: number }>;
    const dataPoint = p[0];
    return `
      <div style="padding: 8px;">
        <div style="font-weight: 600;">${dataPoint.name}</div>
        <div style="color: #8b5cf6;">${dataPoint.value}%</div>
      </div>
    `;
  }
}
```

### Axis Styling

```typescript
xAxis: {
  type: 'category',
  data: labels,
  axisLine: {
    lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
  },
  axisLabel: {
    color: '#71717a',
    fontSize: 12
  },
  axisTick: { show: false }
}
```

### Series Types

```typescript
// Line chart
series: [{
  type: 'line',
  smooth: true,
  symbol: 'circle',
  symbolSize: 8
}]

// Bar chart
series: [{
  type: 'bar',
  barWidth: '60%'
}]

// Pie chart
series: [{
  type: 'pie',
  radius: ['40%', '70%']  // Donut
}]

// Area chart
series: [{
  type: 'line',
  areaStyle: {}
}]
```

## Adding New Charts

### Step 1: Define Data Interface

```typescript
// src/types/index.ts
interface MyChartData {
  labels: string[];
  values: number[];
  metadata?: Record<string, unknown>;
}
```

### Step 2: Create Chart Component

```tsx
// src/components/charts/MyChart.tsx
import ReactECharts from 'echarts-for-react';
import { ChartRegistry, BaseChartProps } from '@/lib/chartRegistry';

interface MyChartProps {
  data: MyChartData;
  config?: Partial<ChartConfig>;
  className?: string;
}

export function MyChart({ data, config, className }: MyChartProps) {
  const option = {
    // ECharts options
  };

  return (
    <div className={className}>
      <h3>{config?.title}</h3>
      <ReactECharts option={option} style={{ height: config?.height ?? 300 }} />
    </div>
  );
}
```

### Step 3: Register in Chart Registry

```typescript
// At bottom of component file
ChartRegistry.register('my_chart', MyChart as React.ComponentType<BaseChartProps<unknown>>, {
  name: 'My Custom Chart',
  description: 'Description of what this chart shows',
  category: 'custom',
  requiredDataFields: ['labels', 'values'],
  recommendedFor: ['puzzle', 'idle']
});

export default MyChart;
```

### Step 4: Add to Widget Types (Optional)

```typescript
// src/lib/dashboardStore.ts
export type WidgetType =
  | 'kpi'
  | 'line_chart'
  | 'my_chart'  // Add new type
  // ...

export const WIDGET_PRESETS: Record<WidgetType, WidgetPreset> = {
  // ...
  my_chart: {
    name: 'My Chart',
    icon: '📊',
    defaultSize: { w: 6, h: 4 },
    description: 'My custom visualization'
  }
};
```

## Best Practices

### Performance

1. **Use canvas renderer** for better performance with large datasets
2. **Limit data points** to 100-500 for smooth animations
3. **Debounce updates** when data changes frequently
4. **Lazy load** charts not in viewport

### Accessibility

1. Add descriptive titles and subtitles
2. Use color-blind friendly palettes
3. Provide data tables as alternatives
4. Include aria-labels for screen readers

### Responsive Design

```tsx
<ReactECharts
  option={option}
  style={{ height: 300, width: '100%' }}
  opts={{ renderer: 'canvas' }}
  notMerge={true}
/>
```

### Error Handling

```tsx
function SafeChart({ data, ...props }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No data available" />;
  }

  try {
    return <MyChart data={data} {...props} />;
  } catch (error) {
    return <ErrorState message="Failed to render chart" />;
  }
}
```

## Next Steps

- [Widgets Reference](/docs/dashboards/widgets) - All widget types
- [Dashboard Builder](/docs/dashboards/builder) - Create custom dashboards
- [Exporting](/docs/dashboards/exporting) - Export charts and data
- [ECharts Documentation](https://echarts.apache.org/en/option.html) - Official ECharts docs
