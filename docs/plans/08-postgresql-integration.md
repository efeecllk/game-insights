# F008 - PostgreSQL Integration

**Status:** 📋 Planned  
**Priority:** Medium  
**Effort:** Medium

## Overview
Direct PostgreSQL database connection for self-hosted analytics.

## Features
- [ ] Connection config UI
- [ ] Schema browser
- [ ] Query builder
- [ ] Secure credential storage (env vars, Vault)
- [ ] Connection pooling

## Config
```typescript
interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  schema: string;
  credentials: 'direct' | 'env' | 'vault';
  ssl?: boolean;
}
```

## Use Cases
- Self-hosted analytics DB
- Data warehouse queries
- Real-time dashboards from production data
