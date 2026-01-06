# Architecture

## Overview

Game Insights is a React-based analytics dashboard for mobile games. It uses an adapter pattern for data source integration and an AI pipeline for automatic analysis.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Sources                              │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│ CSV/JSON │  Google  │  Firebase │ Supabase │  PlayFab │  Unity  │
│          │  Sheets  │           │ PostgreSQL│         │   SDK   │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬────┘
     │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Adapter Layer                              │
│  FileAdapter  SheetsAdapter  FirebaseAdapter  SQLAdapter  etc.  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI Pipeline                                │
│  SchemaAnalyzer → GameTypeDetector → DataCleaner → ChartSelector │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ML Models                                  │
│  RetentionPredictor  ChurnPredictor  LTVPredictor  RevenueModel │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Dashboard                                  │
│           Game-type specific charts and visualizations           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── adapters/           # Data source connectors
│   ├── BaseAdapter.ts  # Abstract base class
│   ├── FileAdapter.ts  # CSV/JSON file handling
│   ├── GoogleSheetsAdapter.ts
│   ├── SupabaseAdapter.ts
│   └── ...
│
├── ai/                 # AI analysis pipeline
│   ├── DataPipeline.ts # Main orchestrator
│   ├── SchemaAnalyzer.ts
│   ├── GameTypeDetector.ts
│   ├── DataCleaner.ts
│   ├── ChartSelector.ts
│   ├── InsightGenerator.ts
│   └── ml/             # ML prediction models
│       ├── RetentionPredictor.ts
│       ├── ChurnPredictor.ts
│       ├── LTVPredictor.ts
│       └── RevenueForecaster.ts
│
├── components/         # UI components
│   ├── charts/         # Chart components (ECharts)
│   ├── forms/          # Form components
│   └── layout/         # Layout components
│
├── context/            # React contexts
│   ├── DataContext.tsx # Game data state
│   └── GameContext.tsx # Game type selection
│
├── lib/                # Utilities
│   ├── dataProviders.ts# Game-specific data providers
│   ├── chartRegistry.ts# Chart type registry
│   └── utils.ts        # General utilities
│
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Funnels.tsx     # Funnel analysis
│   ├── Monetization.tsx# Revenue analytics
│   └── Predictions.tsx # ML predictions
│
└── types/              # TypeScript definitions
```

---

## Adapter Interface

All data adapters extend `BaseAdapter`:

```typescript
interface DataAdapter {
  name: string;
  type: 'file' | 'api' | 'database' | 'cloud';

  // Connection
  connect(config: AdapterConfig): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;

  // Data
  fetchSchema(): Promise<SchemaInfo>;
  fetchData(query?: DataQuery): Promise<NormalizedData>;

  // Metadata
  getCapabilities(): AdapterCapabilities;
}
```

---

## AI Pipeline

The AI pipeline runs automatically on data upload:

1. **SchemaAnalyzer**: Detects 40+ semantic column types (user_id, timestamp, revenue, level, etc.)
2. **GameTypeDetector**: Classifies game as puzzle/idle/battle_royale/match3_meta/gacha_rpg
3. **DataCleaner**: Identifies quality issues and generates cleaning plans
4. **ChartSelector**: Recommends visualizations based on data and game type
5. **InsightGenerator**: Produces AI-driven recommendations

---

## ML Models

Predictive models in `src/ai/ml/`:

| Model | Purpose |
|-------|---------|
| RetentionPredictor | D-N retention forecasting |
| ChurnPredictor | User churn probability |
| LTVPredictor | Lifetime value estimation |
| RevenueForecaster | Revenue projections |
| AnomalyModel | Anomaly detection |
| SegmentationModel | User segmentation |

---

## Supported Integrations

| Integration | Status |
|-------------|--------|
| CSV/JSON Upload | Complete |
| Google Sheets | Complete |
| Firebase Analytics | Complete |
| Supabase / PostgreSQL | Complete |
| PlayFab | Complete |
| Unity SDK | Complete |
| Webhooks | Complete |

---

## Adding New Integrations

1. Create adapter in `src/adapters/YourAdapter.ts`
2. Extend `BaseAdapter`
3. Implement `connect()`, `fetchSchema()`, `fetchData()`
4. Register in adapter factory
