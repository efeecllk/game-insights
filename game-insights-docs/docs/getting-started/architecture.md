---
sidebar_position: 4
title: Architecture Overview
description: Technical architecture, project structure, and design patterns in Game Insights
---

# Architecture Overview

This guide provides a deep dive into the technical architecture of Game Insights, including project structure, key patterns, and state management.

## High-Level Architecture

Game Insights follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Pages  │  │ Charts  │  │  KPIs   │  │ Widgets │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                         State Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Context   │  │   Stores    │  │  IndexedDB  │             │
│  │  Providers  │  │  (Zustand)  │  │ Persistence │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                      Business Logic Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │     AI      │  │    Data     │  │   Metric    │             │
│  │   Pipeline  │  │  Providers  │  │ Calculators │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                        Data Access Layer                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  File   │  │   API   │  │  Google │  │ Postgres│            │
│  │ Adapter │  │ Adapter │  │ Sheets  │  │ Adapter │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── adapters/              # Data source adapters
│   ├── BaseAdapter.ts     # Abstract adapter interface
│   ├── FileAdapter.ts     # CSV, Excel, JSON parsing
│   ├── APIAdapter.ts      # REST API connections
│   ├── GoogleSheetsAdapter.ts
│   ├── PostgreSQLAdapter.ts
│   ├── SupabaseAdapter.ts
│   └── WebhookAdapter.ts
│
├── ai/                    # AI pipeline modules
│   ├── DataPipeline.ts    # Orchestrator
│   ├── DataSampler.ts     # Smart sampling
│   ├── SchemaAnalyzer.ts  # Column detection
│   ├── GameTypeDetector.ts # Game classification
│   ├── DataCleaner.ts     # Quality fixes
│   ├── ChartSelector.ts   # Visualization recommendations
│   ├── InsightGenerator.ts # Actionable insights
│   ├── MetricCalculator.ts # KPI computation
│   ├── AnomalyDetector.ts # Outlier detection
│   ├── CohortAnalyzer.ts  # User cohorts
│   ├── FunnelDetector.ts  # Conversion funnels
│   └── ml/                # ML models
│
├── components/            # Reusable UI components
│   ├── charts/            # Chart components
│   ├── dashboard/         # Dashboard widgets
│   ├── forms/             # Form components
│   └── layout/            # Layout components
│
├── context/               # React context providers
│   ├── DataContext.tsx    # Uploaded data state
│   ├── GameContext.tsx    # Selected game type
│   └── IntegrationContext.tsx # Data source connections
│
├── lib/                   # Utilities and stores
│   ├── dataStore.ts       # IndexedDB operations
│   ├── gameStore.ts       # Game management
│   ├── dashboardStore.ts  # Dashboard state
│   ├── funnelStore.ts     # Funnel configurations
│   ├── experimentStore.ts # A/B test data
│   ├── alertStore.ts      # Alert configurations
│   ├── dataProviders.ts   # Demo data factory
│   ├── chartRegistry.ts   # Chart type registry
│   └── exportUtils.ts     # Export functionality
│
├── pages/                 # Page components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Upload.tsx         # Data upload
│   ├── Funnels.tsx        # Funnel analysis
│   ├── Experiments.tsx    # A/B testing
│   └── Settings.tsx       # Configuration
│
├── types/                 # TypeScript definitions
│   └── index.ts           # Shared types
│
├── App.tsx                # Root component with routes
└── main.tsx               # Application entry point
```

## Design Patterns

### Adapter Pattern

All data sources implement a common `BaseAdapter` interface, enabling uniform data handling regardless of source:

```typescript
abstract class BaseAdapter {
    abstract name: string;
    abstract type: AdapterType;

    abstract connect(config: AdapterConfig): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract testConnection(): Promise<boolean>;

    abstract fetchSchema(): Promise<SchemaInfo>;
    abstract fetchData(query?: DataQuery): Promise<NormalizedData>;

    abstract getCapabilities(): AdapterCapabilities;
}
```

**Implementation example:**
```typescript
class FileAdapter extends BaseAdapter {
    name = 'file';
    type: AdapterType = 'file';

    async fetchData(): Promise<NormalizedData> {
        // Parse CSV/Excel/JSON and normalize
    }
}
```

**Adapter Registry:**
```typescript
// Register adapters
adapterRegistry.register(new FileAdapter());
adapterRegistry.register(new APIAdapter());
adapterRegistry.register(new PostgreSQLAdapter());

// Get adapter by name
const adapter = adapterRegistry.get('file');
```

### Factory Pattern

The `createDataProvider` factory returns game-type-specific data providers:

```typescript
interface IDataProvider {
    getRetentionData(): RetentionData;
    getFunnelData(): FunnelStep[];
    getKPIData(): KPIData[];
    getRevenueData(): TimeSeriesData[];
    getSegmentData(): SegmentData[];
}

function createDataProvider(category: GameCategory): IDataProvider {
    switch (category) {
        case 'puzzle':
            return new PuzzleGameDataProvider();
        case 'idle':
            return new IdleGameDataProvider();
        case 'battle_royale':
            return new BattleRoyaleDataProvider();
        // ...
    }
}
```

This enables game-type-specific KPIs, funnels, and visualizations.

### Pipeline Pattern

The `DataPipeline` orchestrates sequential processing stages:

```typescript
class DataPipeline {
    async run(data: NormalizedData, config: PipelineConfig): Promise<PipelineResult> {
        // Stage 1: Sample
        const sample = dataSampler.sample(data, config);

        // Stage 2: Analyze Schema
        const schema = this.buildSchema(sample);
        const columnMeanings = schemaAnalyzer.analyze(schema);

        // Stage 3: Detect Game Type
        const detection = gameTypeDetector.detect(columnMeanings);

        // Stage 4: Clean Data
        const cleaningResult = dataCleaner.clean(sample, plan);

        // Stage 5: Calculate Metrics
        const metrics = metricCalculator.calculate(data, columnMeanings);

        // Stage 6: Detect Anomalies
        const anomalies = anomalyDetector.detect(data, columnMeanings);

        // Stage 7: Generate Insights
        const insights = insightGenerator.generate(data, context);

        return { sample, schema, metrics, anomalies, insights, ... };
    }
}
```

## State Management

### React Context

Context providers handle global state that many components need:

**DataContext** - Manages uploaded game data:
```typescript
interface DataContextValue {
    gameData: GameData | null;
    setGameData: (data: GameData) => void;
    clearData: () => void;
    isLoading: boolean;
}
```

**GameContext** - Tracks selected game type:
```typescript
interface GameContextValue {
    gameType: GameCategory;
    setGameType: (type: GameCategory) => void;
}
```

**IntegrationContext** - Manages data source connections:
```typescript
interface IntegrationContextValue {
    connections: DataSourceConnection[];
    addConnection: (conn: DataSourceConnection) => void;
    removeConnection: (id: string) => void;
}
```

### IndexedDB Stores

For persistence, Game Insights uses IndexedDB through custom store modules:

**dataStore.ts** - Game data and profiles:
```typescript
// Save game data
await saveGameData({ id, name, type, rawData, ... });

// Retrieve all data
const allData = await getAllGameData();

// Get specific entry
const data = await getGameData(id);
```

**gameStore.ts** - Multi-game management:
```typescript
interface Game {
    id: string;
    name: string;
    genre: GameGenre;
    platform: GamePlatform;
    isActive: boolean;
    settings: GameSettings;
}

await saveGame(game);
const games = await getAllGames();
```

**dashboardStore.ts** - Custom dashboard layouts:
```typescript
interface Dashboard {
    id: string;
    name: string;
    widgets: Widget[];
    layout: GridLayout;
}
```

### Store Operations Pattern

All stores follow a consistent pattern:

```typescript
// Create
await dbPut('storeName', item);

// Read all
const items = await dbGetAll('storeName');

// Read one
const item = await dbGet('storeName', id);

// Delete
await dbDelete('storeName', id);
```

## Data Flow Diagram

```
┌──────────────┐
│   User       │
│   Action     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│   Upload     │────►│   Adapter    │
│   Component  │     │   Layer      │
└──────────────┘     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   AI         │
                     │   Pipeline   │
                     └──────┬───────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Schema     │     │   Game Type  │     │   Data       │
│   Analysis   │     │   Detection  │     │   Cleaning   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Context    │
                     │   Update     │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Dashboard  │
                     │   Render     │
                     └──────────────┘
```

## Key Technical Decisions

### Why Vite?

- **Fast development** - Instant hot module replacement
- **Optimized builds** - Tree-shaking and code splitting
- **Modern defaults** - ESM-first architecture

### Why ECharts?

- **Performance** - Canvas rendering for large datasets
- **Flexibility** - Extensive customization options
- **Mobile support** - Touch and responsive features

### Why IndexedDB?

- **Local-first** - Data stays on user's machine
- **Capacity** - Handle large datasets (vs localStorage)
- **Async** - Non-blocking data operations

### Why TailwindCSS?

- **Utility-first** - Rapid UI development
- **Consistency** - Design token system
- **Performance** - Only used classes in production

## Module Dependencies

```
                    ┌─────────────┐
                    │   App.tsx   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    Pages      │  │   Context     │  │    Lib        │
│ (Dashboard,   │  │ (Data, Game,  │  │ (Stores,      │
│  Upload...)   │  │  Integration) │  │  Utils)       │
└───────┬───────┘  └───────────────┘  └───────┬───────┘
        │                                      │
        │          ┌───────────────┐          │
        └─────────►│   Adapters    │◄─────────┘
                   └───────┬───────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  AI Pipeline  │
                   └───────────────┘
```

## Performance Considerations

### Large Dataset Handling

1. **Smart Sampling** - Process representative subsets
2. **Virtual Scrolling** - Render only visible rows
3. **Web Workers** - Offload heavy computation (planned)
4. **Incremental Loading** - Stream large files

### Rendering Optimization

1. **React.memo** - Prevent unnecessary re-renders
2. **useMemo/useCallback** - Memoize expensive operations
3. **Canvas Charts** - ECharts for high-performance visualization
4. **Lazy Loading** - Load pages and components on demand

## Extending the Architecture

### Adding a New Adapter

1. Create `src/adapters/MyAdapter.ts`
2. Extend `BaseAdapter`
3. Implement required methods
4. Register in adapter factory

### Adding a New Game Type

1. Add type to `GameCategory` in `types/index.ts`
2. Add detection signals in `GameTypeDetector.ts`
3. Create data provider in `dataProviders.ts`
4. Add game-specific charts in `chartRegistry.ts`

### Adding a New AI Module

1. Create `src/ai/MyModule.ts`
2. Export singleton instance
3. Integrate in `DataPipeline.ts`
4. Add results to `PipelineResult`

## Next Steps

- **[AI Pipeline](/docs/ai-analytics/ai-pipeline)** - Deep dive into analysis stages
- **[Data Sources](/docs/data-management/sources/file-adapter)** - Adapter documentation
- **[API Reference](/docs/api-reference)** - Complete API documentation
