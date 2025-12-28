# API Reference

This section provides comprehensive documentation for developers who want to extend, customize, or integrate with Game Insights. All APIs are written in TypeScript and follow consistent patterns for ease of use.

## Overview

Game Insights exposes several layers of APIs:

| API Category | Purpose | Location |
|-------------|---------|----------|
| [Data Adapters](./adapters.md) | Connect to data sources | `src/adapters/` |
| [AI Pipeline](./ai-pipeline.md) | Data analysis and insights | `src/ai/` |
| [Data Providers](./data-providers.md) | Game-specific data handlers | `src/lib/dataProviders.ts` |
| [Stores](./stores.md) | State management | `src/lib/*Store.ts` |

## Architecture

```
Data Source --> Adapter --> Normalizer --> AI Pipeline --> Dashboard
                  |              |              |
              BaseAdapter    NormalizedData  DataPipeline
                  |              |              |
              connect()      SchemaInfo      PipelineResult
              fetchData()                    Insights
              fetchSchema()                  Charts
```

## Core Types

### GameCategory

Supported game types for specialized analytics:

```typescript
type GameCategory =
    | 'puzzle'        // Match-3, puzzle solving
    | 'idle'          // Incremental, idle games
    | 'battle_royale' // FPS, competitive shooters
    | 'match3_meta'   // Match-3 with meta layer
    | 'gacha_rpg'     // Hero collectors, gacha
    | 'custom';       // Generic/unknown
```

### NormalizedData

Standard data format used throughout the system:

```typescript
interface NormalizedData {
    columns: string[];
    rows: Record<string, unknown>[];
    metadata: {
        source: string;
        fetchedAt: string;
        rowCount: number;
    };
}
```

### SchemaInfo

Schema information extracted from data:

```typescript
interface SchemaInfo {
    columns: ColumnInfo[];
    rowCount: number;
    sampleData: Record<string, unknown>[];
}

interface ColumnInfo {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
    nullable: boolean;
    sampleValues: unknown[];
}
```

## Extension Points

### Adding a New Data Source

1. Extend `BaseAdapter` in `src/adapters/`
2. Implement required methods: `connect()`, `fetchSchema()`, `fetchData()`
3. Register with `adapterRegistry`

```typescript
import { BaseAdapter, adapterRegistry } from '@/adapters';

class MyCustomAdapter extends BaseAdapter {
    name = 'my_source';
    type = 'api' as const;

    async connect(config: MyConfig): Promise<void> { /* ... */ }
    async fetchSchema(): Promise<SchemaInfo> { /* ... */ }
    async fetchData(query?: DataQuery): Promise<NormalizedData> { /* ... */ }
}

adapterRegistry.register(new MyCustomAdapter());
```

### Adding a New Game Type

1. Update `GameTypeDetector.ts` with detection weights
2. Create data provider in `dataProviders.ts`
3. Add game-specific insights in `InsightGenerator.ts`

### Creating Custom Analyzers

Extend the AI pipeline with custom analyzers:

```typescript
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';
import { NormalizedData } from '@/adapters/BaseAdapter';

class MyCustomAnalyzer {
    analyze(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[]
    ): MyAnalysisResult {
        // Custom analysis logic
    }
}
```

## TypeScript Configuration

Game Insights uses path aliases for clean imports:

```json
{
    "compilerOptions": {
        "paths": {
            "@/*": ["./src/*"]
        }
    }
}
```

Use `@/` prefix for all internal imports:

```typescript
import { BaseAdapter } from '@/adapters';
import { dataPipeline } from '@/ai/DataPipeline';
import { createDataProvider } from '@/lib/dataProviders';
```

## Error Handling

All async operations should be wrapped in try-catch:

```typescript
try {
    const result = await dataPipeline.run(data, config);
} catch (error) {
    if (error instanceof AdapterError) {
        // Handle connection errors
    } else if (error instanceof AnalysisError) {
        // Handle analysis errors
    }
}
```

## Next Steps

- [Data Adapters API](./adapters.md) - Connect to various data sources
- [AI Pipeline API](./ai-pipeline.md) - Analyze and process data
- [Data Providers API](./data-providers.md) - Game-specific data handlers
- [Stores API](./stores.md) - State management patterns
