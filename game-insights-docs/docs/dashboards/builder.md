---
sidebar_position: 2
title: Dashboard Builder
description: Create custom dashboards with drag-and-drop widgets using Game Insights' visual builder
---

# Dashboard Builder

The **Dashboard Builder** allows you to create fully customized dashboards tailored to your specific analytics needs. Using a visual drag-and-drop interface with a 12-column grid system, you can design layouts that highlight the metrics most important to your game.

## Getting Started

Navigate to the Dashboard Builder from the main navigation or click "New Dashboard" from the overview page.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Dashboard Builder                                                        │
│  Create custom dashboards with drag-and-drop widgets                        │
│                                                                             │
│                    [+ Add Widget]  [👁 Preview]  [💾 Save]  [+ New Dashboard]│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Interface Overview

The Dashboard Builder interface consists of three main areas:

```
┌──────────────┬─────────────────────────────────┬──────────────┐
│  DASHBOARD   │                                 │   WIDGET     │
│    LIST      │       CANVAS AREA               │   CONFIG     │
│              │                                 │    PANEL     │
│  ┌────────┐  │  ┌─────────────────────────┐   │              │
│  │Overview│  │  │                         │   │  Title       │
│  │  ✓     │  │  │    Widget Grid          │   │  [________]  │
│  └────────┘  │  │                         │   │              │
│  ┌────────┐  │  │   12-Column Layout      │   │  Metric      │
│  │Retention│  │  │                         │   │  [DAU    ▼]  │
│  │ Deep   │  │  │                         │   │              │
│  │ Dive   │  │  └─────────────────────────┘   │  Size        │
│  └────────┘  │                                 │  W:[3] H:[2] │
│  ┌────────┐  │                                 │              │
│  │Revenue │  │                                 │  [🗑 Delete] │
│  │Analytics│  │                                 │              │
│  └────────┘  │                                 │              │
└──────────────┴─────────────────────────────────┴──────────────┘
```

### Dashboard List Sidebar

The left sidebar displays all your dashboards:

- Click a dashboard to select and view it
- Default dashboards are marked with a lock icon
- Custom dashboards can be renamed, duplicated, or deleted
- Use the context menu (three dots) for additional actions

### Canvas Area

The main canvas displays the selected dashboard:

- 12-column responsive grid system
- Widgets snap to grid positions
- Visual indicators show widget boundaries
- Drag handles appear on hover in edit mode

### Widget Config Panel

When editing, the right panel shows configuration options:

- Widget title and subtitle
- Metric selection (for applicable widgets)
- Size controls (width and height)
- Widget-specific options
- Delete button

## Drag-and-Drop Interface

The builder supports intuitive drag-and-drop operations:

### Adding Widgets

1. Click **"+ Add Widget"** button
2. Select widget type from the picker modal
3. Widget is added to the next available position
4. Adjust position and size as needed

### Widget Picker Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Add Widget                                           [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    📈       │  │    📉       │  │    📊       │         │
│  │  KPI Card   │  │ Line Chart  │  │  Bar Chart  │         │
│  │Single metric│  │Time series  │  │ Categories  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    🥧       │  │    📈       │  │    📋       │         │
│  │  Pie Chart  │  │ Area Chart  │  │ Data Table  │         │
│  │Distribution │  │  Stacked    │  │Detailed view│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    🔻       │  │    🔥       │  │    📝       │         │
│  │   Funnel    │  │   Cohort    │  │ Text Block  │         │
│  │ Conversion  │  │  Heatmap    │  │Notes/headers│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Moving Widgets

In edit mode:
1. Click and hold a widget
2. Drag to the desired position
3. Release to place the widget
4. Grid will auto-adjust other widgets

### Resizing Widgets

Use the width and height controls in the config panel:

```typescript
// Widget position structure
interface WidgetPosition {
  x: number;  // Column position (0-11)
  y: number;  // Row position
  w: number;  // Width in columns (1-12)
  h: number;  // Height in rows (1-10)
}
```

## Grid Layout (12 Columns)

The dashboard uses a 12-column grid system for flexible layouts:

### Grid Anatomy

```
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │ 12  │
├─────┴─────┴─────┴─────┼─────┴─────┴─────┴─────┼─────┴─────┴─────┴─────┤
│    3-column widget    │    4-column widget    │    5-column widget    │
├───────────────────────┴───────────────────────┴───────────────────────┤
│                        12-column full-width widget                     │
└───────────────────────────────────────────────────────────────────────┘
```

### Common Layout Patterns

**Four KPIs in a row:**
```
│───3───│───3───│───3───│───3───│
│  KPI  │  KPI  │  KPI  │  KPI  │
```

**Main chart with sidebar:**
```
│───────────8───────────│───4───│
│     Main Chart        │  Side │
│                       │ Panel │
```

**Two equal columns:**
```
│───────6───────│───────6───────│
│    Chart 1    │    Chart 2    │
```

### Row Height

Each row has a configurable height (default: 80px):

```typescript
interface Dashboard {
  // ...
  columns: number;     // Default: 12
  rowHeight: number;   // Default: 80px
}
```

## Adding Widgets

### Step-by-Step Guide

1. **Enter Edit Mode**
   - Click the "Edit" button on the dashboard header
   - The interface switches to edit mode with visual indicators

2. **Open Widget Picker**
   - Click "+ Add Widget" button
   - Browse available widget types

3. **Select Widget Type**
   - Click on the desired widget type
   - Widget is added with default settings

4. **Configure Widget**
   - Widget config panel opens automatically
   - Set title, metric, and other options
   - Adjust size using width/height controls

5. **Save Changes**
   - Click "Save" to persist changes
   - Dashboard updates in IndexedDB

### Programmatic Widget Creation

```typescript
import { createWidget, WidgetType, WidgetPosition, WidgetConfig } from '@/lib/dashboardStore';

const newWidget = createWidget(
  'kpi' as WidgetType,
  { x: 0, y: 0, w: 3, h: 2 } as WidgetPosition,
  {
    title: 'Daily Active Users',
    metric: 'dau',
    showTrend: true,
    format: 'number'
  } as WidgetConfig
);
```

## Configuring Widgets

Each widget type has specific configuration options:

### Common Options

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Widget header text |
| `subtitle` | string | Optional description |
| `dateRange` | enum | Time period for data |
| `comparison` | enum | Comparison period |

### KPI Widget Options

```typescript
interface KPIConfig {
  metric: MetricType;       // 'dau', 'revenue', etc.
  format: 'number' | 'percent' | 'currency';
  showTrend: boolean;       // Show change indicator
  decimals?: number;        // Decimal places
}
```

### Chart Widget Options

```typescript
interface ChartConfig {
  metric: MetricType;
  chartColor?: string;      // Override default color
  dateRange?: DateRange;
  showLegend?: boolean;
}
```

### Text Widget Options

```typescript
interface TextConfig {
  textContent: string;      // Markdown supported
  alignment?: 'left' | 'center' | 'right';
}
```

## Saving Dashboards

Dashboards are persisted to IndexedDB:

### Auto-Save vs Manual Save

- Changes are **not** auto-saved during editing
- Click "Save" to persist all changes
- Use "Preview" to see changes without saving
- Unsaved changes are lost on navigation

### Save Operation

```typescript
import { saveDashboard } from '@/lib/dashboardStore';

async function handleSave() {
  if (!selectedDashboard) return;

  // Updates timestamp automatically
  await saveDashboard(selectedDashboard);

  // Refresh dashboard list
  await loadDashboards();

  // Exit edit mode
  setIsEditing(false);
}
```

### Dashboard Data Structure

```typescript
interface Dashboard {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  widgets: DashboardWidget[];

  // Layout settings
  columns: number;          // Default: 12
  rowHeight: number;        // Default: 80

  // Display settings
  theme: 'light' | 'dark' | 'system';
  autoRefresh: boolean;
  refreshInterval: number;  // Seconds

  // Metadata
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
}
```

## Loading Templates

Game Insights provides pre-built dashboard templates for quick setup:

### Default Templates

| Template | Description | Widgets |
|----------|-------------|---------|
| **Overview** | Key metrics at a glance | 4 KPIs, DAU trend, pie chart, cohort, funnel |
| **Retention Deep Dive** | Detailed retention analysis | 3 KPIs, large cohort, line chart, bar chart |
| **Revenue Analytics** | Monetization metrics | 4 KPIs, area chart, pie chart, bar chart, table |

### Loading a Template

1. Click "+ New Dashboard"
2. Select "Start from Template"
3. Choose desired template
4. Customize as needed

### Creating from Template

```typescript
import { createDashboard, DEFAULT_DASHBOARDS } from '@/lib/dashboardStore';

async function createFromTemplate(templateName: string) {
  const template = DEFAULT_DASHBOARDS.find(t => t.name === templateName);
  if (!template) return;

  const newDashboard = createDashboard('My Custom Dashboard', {
    ...template,
    isDefault: false,
  });

  await saveDashboard(newDashboard);
}
```

## Duplicating Dashboards

Create copies of existing dashboards for experimentation:

### Duplicate Operation

```typescript
import { duplicateDashboard } from '@/lib/dashboardStore';

async function handleDuplicate(dashboardId: string) {
  const original = dashboards.find(d => d.id === dashboardId);
  if (!original) return;

  const duplicate = await duplicateDashboard(
    dashboardId,
    `${original.name} (Copy)`
  );

  if (duplicate) {
    await loadDashboards();
    setSelectedDashboard(duplicate);
  }
}
```

### What Gets Copied

- All widgets and their configurations
- Layout settings (columns, row height)
- Display settings (theme, refresh)
- **Not copied**: isDefault flag, timestamps, view history

## Managing Dashboards

### Rename Dashboard

1. Select the dashboard
2. Click on the dashboard name in the header
3. Enter new name
4. Press Enter or click away to save

### Delete Dashboard

1. Click the three-dot menu on a dashboard
2. Select "Delete"
3. Confirm deletion
4. Dashboard is permanently removed

:::warning
Default dashboards cannot be deleted. You can duplicate them and delete the copy if needed.
:::

### Reorder Dashboards

Dashboards are displayed by last viewed time. To "pin" a dashboard to the top, simply view it frequently or set it as your default landing dashboard.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `E` | Enter edit mode |
| `Escape` | Exit edit mode / Close modal |
| `Ctrl/Cmd + S` | Save dashboard |
| `Ctrl/Cmd + N` | New dashboard |
| `Delete` | Remove selected widget |
| `Ctrl/Cmd + D` | Duplicate selected widget |

## Best Practices

### Layout Design

1. **Start with KPIs** - Place most important metrics at the top
2. **Group related widgets** - Keep related visualizations together
3. **Use consistent sizing** - Maintain visual harmony with aligned widgets
4. **Leave breathing room** - Don't overcrowd the dashboard

### Performance

1. **Limit widgets** - 8-12 widgets per dashboard recommended
2. **Use appropriate date ranges** - Shorter ranges load faster
3. **Disable auto-refresh** - Enable only when needed
4. **Optimize data queries** - Use aggregated data where possible

### Naming Conventions

- Use descriptive dashboard names
- Include team or purpose in name
- Date-stamp A/B test dashboards
- Use prefixes for organization (e.g., "Revenue - Weekly")

## Next Steps

- [Widgets Reference](/docs/dashboards/widgets) - All available widget types
- [Charts Reference](/docs/dashboards/charts) - Chart configuration details
- [Exporting](/docs/dashboards/exporting) - Export and share dashboards
