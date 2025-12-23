# F009 - BigQuery Integration

**Status:** 📋 Planned  
**Priority:** Medium  
**Effort:** Large

## Overview
Google BigQuery integration for large-scale game analytics.

## Features
- [ ] GCP auth flow (service account)
- [ ] Dataset browser
- [ ] Query optimization
- [ ] Cost estimation before query
- [ ] Results caching

## Config
```typescript
interface BigQueryConfig {
  projectId: string;
  dataset: string;
  serviceAccount: 'file' | 'gcloud';
  tables: string[];
}
```

## Use Cases
- GA4 exported data
- Large-scale user events
- Cross-game portfolio analysis
