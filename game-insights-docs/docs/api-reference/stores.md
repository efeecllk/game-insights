---
sidebar_position: 5
title: Stores Reference
description: API reference for Zustand stores managing application state
---

# Stores Reference

Game Insights uses Zustand stores for state management. Each store handles a specific domain of the application.

## Overview

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `dataStore` | User data and datasets | IndexedDB |
| `dashboardStore` | Dashboard configurations | IndexedDB |
| `alertStore` | Alert rules and history | IndexedDB |
| `abTestingStore` | A/B test experiments | IndexedDB |
| `templateStore` | Dashboard templates | IndexedDB |

## dataStore

Manages uploaded data, schema information, and data transformations.

### State

```typescript
interface DataState {
  // Current dataset
  data: DataRow[];
  columns: ColumnSchema[];
  schema: SchemaAnalysis | null;

  // Metadata
  fileName: string | null;
  fileSize: number;
  uploadedAt: string | null;
  rowCount: number;

  // Processing state
  isLoading: boolean;
  error: string | null;

  // Game type detection
  gameType: GameType | null;
  gameTypeConfidence: number;
}
```

### Actions

```typescript
// Import data from file
await dataStore.importFile(file: File): Promise<void>

// Set data directly
dataStore.setData(rows: DataRow[]): void

// Update schema
dataStore.setSchema(schema: SchemaAnalysis): void

// Clear all data
dataStore.clearData(): void

// Get filtered data
dataStore.getFilteredData(filters: Filter[]): DataRow[]

// Export data
await dataStore.exportData(format: 'csv' | 'json'): Promise<Blob>
```

### Usage Example

```typescript
import { useDataStore } from '@/stores/dataStore';

function DataUploader() {
  const { data, isLoading, importFile, clearData } = useDataStore();

  const handleUpload = async (file: File) => {
    await importFile(file);
  };

  return (
    <div>
      <p>Rows: {data.length}</p>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      <button onClick={clearData}>Clear</button>
    </div>
  );
}
```

## dashboardStore

Manages dashboard configurations, layouts, and widgets.

### State

```typescript
interface DashboardState {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  isLoading: boolean;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  columns: number;
  rowHeight: number;
  widgets: Widget[];
  createdAt: string;
  updatedAt: string;
}

interface Widget {
  id: string;
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
}
```

### Actions

```typescript
// CRUD operations
await dashboardStore.createDashboard(dashboard: Partial<Dashboard>): Promise<Dashboard>
await dashboardStore.updateDashboard(id: string, updates: Partial<Dashboard>): Promise<void>
await dashboardStore.deleteDashboard(id: string): Promise<void>

// Widget operations
dashboardStore.addWidget(dashboardId: string, widget: Partial<Widget>): void
dashboardStore.updateWidget(dashboardId: string, widgetId: string, updates: Partial<Widget>): void
dashboardStore.removeWidget(dashboardId: string, widgetId: string): void
dashboardStore.moveWidget(dashboardId: string, widgetId: string, position: Position): void

// Navigation
dashboardStore.setActiveDashboard(id: string): void

// Export/Import
await dashboardStore.exportDashboard(id: string): Promise<DashboardExport>
await dashboardStore.importDashboard(data: DashboardExport): Promise<Dashboard>
```

### Usage Example

```typescript
import { useDashboardStore } from '@/stores/dashboardStore';

function DashboardManager() {
  const { dashboards, createDashboard, setActiveDashboard } = useDashboardStore();

  const handleCreate = async () => {
    const dashboard = await createDashboard({
      name: 'New Dashboard',
      widgets: []
    });
    setActiveDashboard(dashboard.id);
  };

  return (
    <div>
      {dashboards.map(d => (
        <button key={d.id} onClick={() => setActiveDashboard(d.id)}>
          {d.name}
        </button>
      ))}
      <button onClick={handleCreate}>+ New</button>
    </div>
  );
}
```

## alertStore

Manages alert rules, notifications, and history.

### State

```typescript
interface AlertState {
  rules: AlertRule[];
  alerts: Alert[];
  preferences: AlertPreferences;
}

interface AlertRule {
  id: string;
  name: string;
  type: 'threshold' | 'anomaly' | 'prediction';
  metric: string;
  condition: AlertCondition;
  threshold?: number;
  severity: Severity;
  enabled: boolean;
  channels: Channel[];
  cooldownMinutes: number;
}

interface Alert {
  id: string;
  ruleId: string;
  triggeredAt: string;
  resolvedAt?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'snoozed';
  value: number;
  message: string;
}
```

### Actions

```typescript
// Rule management
await alertStore.createRule(rule: Partial<AlertRule>): Promise<AlertRule>
await alertStore.updateRule(id: string, updates: Partial<AlertRule>): Promise<void>
await alertStore.deleteRule(id: string): Promise<void>
await alertStore.toggleRule(id: string): Promise<void>

// Alert operations
alertStore.acknowledgeAlert(id: string): void
alertStore.resolveAlert(id: string, notes?: string): void
alertStore.snoozeAlert(id: string, durationMinutes: number): void

// Bulk operations
alertStore.acknowledgeAll(): void
alertStore.clearResolved(): void

// Preferences
alertStore.updatePreferences(prefs: Partial<AlertPreferences>): void
```

### Usage Example

```typescript
import { useAlertStore } from '@/stores/alertStore';

function AlertCenter() {
  const { alerts, rules, acknowledgeAlert, snoozeAlert } = useAlertStore();

  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <div>
      <h3>Active Alerts ({activeAlerts.length})</h3>
      {activeAlerts.map(alert => (
        <div key={alert.id}>
          <span>{alert.message}</span>
          <button onClick={() => acknowledgeAlert(alert.id)}>Ack</button>
          <button onClick={() => snoozeAlert(alert.id, 60)}>Snooze 1h</button>
        </div>
      ))}
    </div>
  );
}
```

## abTestingStore

Manages A/B test experiments and results.

### State

```typescript
interface ABTestingState {
  experiments: Experiment[];
  activeExperimentId: string | null;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  variants: Variant[];
  results?: ExperimentResults;
}

interface Variant {
  id: string;
  name: string;
  description: string;
  traffic: number;  // percentage
}
```

### Actions

```typescript
// Experiment lifecycle
await abTestingStore.createExperiment(exp: Partial<Experiment>): Promise<Experiment>
await abTestingStore.updateExperiment(id: string, updates: Partial<Experiment>): Promise<void>
await abTestingStore.deleteExperiment(id: string): Promise<void>

// Status changes
await abTestingStore.startExperiment(id: string): Promise<void>
await abTestingStore.pauseExperiment(id: string): Promise<void>
await abTestingStore.completeExperiment(id: string, decision: ExperimentDecision): Promise<void>

// Results
await abTestingStore.calculateResults(id: string): Promise<ExperimentResults>
```

## templateStore

Manages dashboard templates for sharing and reuse.

### State

```typescript
interface TemplateState {
  templates: Template[];
  myTemplates: Template[];
  savedTemplateIds: string[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  gameTypes: GameType[];
  author: Author;
  rating: number;
  imports: number;
  dashboard: DashboardConfig;
  createdAt: string;
}
```

### Actions

```typescript
// Browse
await templateStore.fetchTemplates(filters?: TemplateFilters): Promise<Template[]>
await templateStore.searchTemplates(query: string): Promise<Template[]>

// Import/Export
await templateStore.importTemplate(id: string): Promise<Dashboard>
await templateStore.createTemplate(dashboard: Dashboard, metadata: TemplateMetadata): Promise<Template>

// Save/Rate
templateStore.saveTemplate(id: string): void
templateStore.unsaveTemplate(id: string): void
await templateStore.rateTemplate(id: string, rating: number): Promise<void>
```

## Persistence Layer

All stores use IndexedDB for persistence via the unified db module.

### Database Schema

```typescript
// Database version 5
const stores = {
  data: {
    keyPath: 'id',
    indexes: ['uploadedAt', 'gameType']
  },
  dashboards: {
    keyPath: 'id',
    indexes: ['createdAt', 'isDefault']
  },
  alerts: {
    keyPath: 'id',
    indexes: ['triggeredAt', 'status', 'severity']
  },
  alertRules: {
    keyPath: 'id',
    indexes: ['enabled', 'type']
  },
  experiments: {
    keyPath: 'id',
    indexes: ['status', 'startDate']
  },
  templates: {
    keyPath: 'id',
    indexes: ['category', 'rating']
  }
};
```

### Access Patterns

```typescript
import { db } from '@/lib/db';

// Read
const dashboards = await db.getAll('dashboards');
const dashboard = await db.get('dashboards', id);

// Write
await db.put('dashboards', dashboard);
await db.delete('dashboards', id);

// Query with index
const activeAlerts = await db.getAllFromIndex('alerts', 'status', 'active');
```

## Subscription Patterns

Use Zustand selectors for efficient re-renders:

```typescript
// Bad: Re-renders on any state change
const { dashboards, alerts, data } = useDataStore();

// Good: Only re-renders when specific slice changes
const dashboards = useDashboardStore(state => state.dashboards);
const alertCount = useAlertStore(state => state.alerts.filter(a => a.status === 'active').length);

// With shallow comparison for objects
import { shallow } from 'zustand/shallow';
const { data, schema } = useDataStore(
  state => ({ data: state.data, schema: state.schema }),
  shallow
);
```

## Related

- [Data Providers](/docs/api-reference/data-providers)
- [AI Pipeline](/docs/api-reference/ai-pipeline)
- [Adapters](/docs/api-reference/adapters)
