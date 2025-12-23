# F007 - Multi-Source Integrations

**Status:** 🔄 In Progress  
**Priority:** High  
**Effort:** Large

## Overview
Support for multiple data sources through unified adapter pattern.

## Supported Integrations

| # | Source | Status | Auth Methods |
|---|--------|--------|--------------|
| 1 | CSV/JSON | ✅ Done | - |
| 2 | REST API | ✅ Done | Bearer, API Key, Basic |
| 3 | PostgreSQL | 📋 Planned | Direct, Env, Vault |
| 4 | BigQuery | 📋 Planned | Service Account |
| 5 | Firebase | 📋 Planned | API Key |

## Files
```
src/adapters/
├── BaseAdapter.ts      # Abstract interface
├── FileAdapter.ts      # CSV/JSON
├── APIAdapter.ts       # REST APIs
├── PostgresAdapter.ts  # [Planned]
├── BigQueryAdapter.ts  # [Planned]
├── FirebaseAdapter.ts  # [Planned]
└── index.ts            # Exports
```

## Adapter Interface
```typescript
interface DataAdapter {
  connect(config): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;
  fetchSchema(): Promise<SchemaInfo>;
  fetchData(query?): Promise<NormalizedData>;
  getCapabilities(): AdapterCapabilities;
}
```

## REST API Features
- Auth types: `none`, `bearer`, `apikey`, `basic`
- Auto-refresh with configurable interval
- JSON path navigation (`data.results`)
- Query filtering and sorting
- Caching with TTL

## Next Steps
- [ ] PostgreSQL with connection pooling
- [ ] BigQuery with cost estimation
- [ ] Firebase real-time sync
