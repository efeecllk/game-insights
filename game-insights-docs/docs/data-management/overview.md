---
sidebar_position: 1
title: Data Management Overview
description: Learn how Game Insights handles data flow, persistence, and multi-dataset support
---

# Data Management Overview

Game Insights provides a comprehensive data management system designed for flexibility, performance, and privacy. Whether you're uploading a single CSV file or connecting to multiple live data sources, the system handles your data efficiently while keeping it local to your machine.

## How Data Flows Through the System

The data pipeline transforms raw game data into actionable insights through a series of intelligent processing stages:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │ Data Sources │
  │ ─────────────│
  │ • CSV/Excel  │      ┌─────────────┐      ┌─────────────┐
  │ • JSON       │─────►│   Adapter   │─────►│  Normalizer │
  │ • SQLite     │      │   Layer     │      │             │
  │ • PostgreSQL │      └─────────────┘      └──────┬──────┘
  │ • Supabase   │                                  │
  │ • Webhooks   │                                  ▼
  │ • APIs       │                          ┌─────────────┐
  └──────────────┘                          │ AI Pipeline │
                                            │ ─────────────│
                                            │ • Sampling   │
                                            │ • Schema     │
                                            │ • Detection  │
                                            │ • Cleaning   │
                                            └──────┬──────┘
                                                   │
                         ┌─────────────────────────┼─────────────────────────┐
                         │                         │                         │
                         ▼                         ▼                         ▼
                  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
                  │  IndexedDB  │          │   Context   │          │  Dashboard  │
                  │ Persistence │          │  Providers  │          │   Display   │
                  └─────────────┘          └─────────────┘          └─────────────┘
```

### Stage 1: Data Ingestion

Data enters the system through one of several **adapters**, each implementing a unified interface:

| Adapter | Description | Use Case |
|---------|-------------|----------|
| [File Adapter](/docs/data-management/sources/file-adapter) | CSV, Excel, JSON, SQLite | One-time uploads, historical analysis |
| [Google Sheets](/docs/data-management/sources/google-sheets) | Spreadsheet integration | Collaborative data, manual entry |
| [PostgreSQL](/docs/data-management/sources/postgresql) | Direct database connection | Production databases |
| [Supabase](/docs/data-management/sources/supabase) | Real-time sync | Live game data |
| [Webhooks](/docs/data-management/sources/webhooks) | Event streaming | Real-time event ingestion |
| [API](/docs/data-management/sources/api) | Custom endpoints | Third-party integrations |

### Stage 2: Normalization

The **Normalizer** transforms diverse data formats into a consistent internal structure:

```typescript
interface NormalizedDataset {
  id: string;
  name: string;
  source: DataSourceType;
  columns: ColumnDefinition[];
  rows: Record<string, unknown>[];
  metadata: DatasetMetadata;
  quality: QualityReport;
}
```

### Stage 3: AI Pipeline Processing

The AI Pipeline analyzes your data to:

1. **Sample intelligently** - Uses stratified sampling for large datasets
2. **Detect schema** - Identifies 40+ semantic column types automatically
3. **Classify game type** - Determines if data is from puzzle, idle, battle royale, match-3, or gacha games
4. **Generate cleaning plans** - Identifies and resolves data quality issues

### Stage 4: Persistence & Display

Processed data is:
- Stored in IndexedDB for offline access
- Made available through React Context providers
- Rendered in dashboards with appropriate visualizations

## IndexedDB Persistence

Game Insights stores all data locally in your browser using IndexedDB, ensuring:

- **Privacy** - Your data never leaves your machine unless you choose to export it
- **Performance** - Large datasets are accessed efficiently without server round-trips
- **Offline Support** - Continue analyzing data without an internet connection

### Storage Structure

```javascript
// Database: game-insights-db
{
  stores: {
    datasets: {
      keyPath: 'id',
      indexes: ['name', 'createdAt', 'gameType']
    },
    schemas: {
      keyPath: 'datasetId',
      indexes: ['analyzedAt']
    },
    qualityReports: {
      keyPath: 'datasetId',
      indexes: ['score', 'createdAt']
    },
    dashboards: {
      keyPath: 'id',
      indexes: ['datasetId', 'createdAt']
    }
  }
}
```

### Storage Limits

| Browser | Storage Limit | Notes |
|---------|---------------|-------|
| Chrome | Up to 80% of disk | Evicted under storage pressure |
| Firefox | Up to 50% of disk | Prompts user for large storage |
| Safari | 1GB default | Can request more via API |
| Edge | Up to 80% of disk | Similar to Chrome |

:::tip Storage Management
For very large datasets (>100MB), consider using the [PostgreSQL adapter](/docs/data-management/sources/postgresql) for better performance.
:::

### Data Lifecycle

```
Upload ──► Process ──► Store ──► Access ──► Update ──► Archive/Delete
  │           │          │          │          │            │
  │           │          │          │          │            │
  ▼           ▼          ▼          ▼          ▼            ▼
Validate   Analyze   IndexedDB   Context    Merge      Clear from
 Format    Schema    Persist    Provider   New Data    IndexedDB
```

## Multi-Dataset Support

Game Insights allows you to work with multiple datasets simultaneously, enabling:

- **Cross-game comparison** - Analyze metrics across different games
- **A/B test analysis** - Compare control and variant groups
- **Historical trending** - Track metrics over time with multiple snapshots
- **Regional analysis** - Compare performance across different markets

### Dataset Management

```tsx
// Access multiple datasets through DataContext
import { useData } from '@/context/DataContext';

function MultiGameDashboard() {
  const { datasets, activeDatasetId, setActiveDataset } = useData();

  return (
    <div>
      {datasets.map(dataset => (
        <DatasetCard
          key={dataset.id}
          dataset={dataset}
          isActive={dataset.id === activeDatasetId}
          onSelect={() => setActiveDataset(dataset.id)}
        />
      ))}
    </div>
  );
}
```

### Dataset Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| **Add** | Upload new dataset | Drag-and-drop file |
| **Switch** | Change active dataset | Click dataset card |
| **Rename** | Update dataset name | Edit in settings |
| **Merge** | Combine datasets | Union or join operations |
| **Delete** | Remove dataset | Clear from IndexedDB |
| **Export** | Download processed data | CSV, JSON, Excel |

### Merging Datasets

Combine multiple datasets for comprehensive analysis:

```typescript
// Example: Merging player data with purchase data
const mergedDataset = await mergeDatasets({
  primary: playerDataset,
  secondary: purchaseDataset,
  joinKey: 'user_id',
  strategy: 'left_join'
});
```

## Data Refresh Strategies

Different adapters support different refresh strategies:

| Strategy | Description | Adapters |
|----------|-------------|----------|
| **Manual** | User triggers refresh | File, Google Sheets |
| **Scheduled** | Refresh at intervals | PostgreSQL, API |
| **Real-time** | Continuous streaming | Supabase, Webhooks |
| **On-demand** | Query when accessed | PostgreSQL |

### Configuring Refresh

```typescript
const dataSource = createDataSource({
  type: 'postgresql',
  connection: connectionConfig,
  refresh: {
    strategy: 'scheduled',
    interval: '5m',
    onError: 'retry',
    retryAttempts: 3
  }
});
```

## Best Practices

### For Small Datasets (&lt;10MB)

- Use file upload for simplicity
- Enable auto-detection for quick setup
- Export processed data for sharing

### For Medium Datasets (10MB - 100MB)

- Consider database connections for better performance
- Use incremental loading for faster initial display
- Enable data sampling for preview

### For Large Datasets (>100MB)

- Use PostgreSQL or Supabase adapters
- Enable server-side aggregation
- Configure appropriate sampling strategies
- Consider data partitioning by date

## Security Considerations

- **Local-first** - Data stays in your browser by default
- **No server uploads** - Files are processed client-side
- **Encrypted storage** - IndexedDB follows browser security model
- **Connection security** - Database connections use SSL/TLS

## Next Steps

- [Upload your first dataset](/docs/data-management/uploading-data)
- [Explore supported formats](/docs/data-management/supported-formats)
- [Understand data quality features](/docs/data-management/data-quality)
- [Connect a live data source](/docs/data-management/sources/postgresql)
