---
sidebar_position: 3
title: PostgreSQL Connection
description: Connect to PostgreSQL databases for production-grade analytics
---

# PostgreSQL Connection

Connect directly to PostgreSQL databases for production-grade analytics with complex queries and aggregations.

## Overview

| Feature | Details |
|---------|---------|
| **Connection** | Direct TCP or SSL/TLS |
| **Authentication** | Username/Password, SSL Certificates |
| **Sync Options** | Manual, Scheduled, CDC |
| **Best For** | Production data, complex queries, large datasets |

## Setup

### Prerequisites

1. PostgreSQL server (version 11+)
2. Network access from Game Insights to your database
3. Database credentials with read permissions

### Basic Connection

```typescript
import { PostgreSQLAdapter } from '@/adapters/PostgreSQLAdapter';

const adapter = new PostgreSQLAdapter();

await adapter.connect({
  host: 'your-database-host.com',
  port: 5432,
  database: 'game_analytics',
  user: 'readonly_user',
  password: 'your-secure-password'
});
```

### SSL Connection

```typescript
await adapter.connect({
  host: 'your-database-host.com',
  port: 5432,
  database: 'game_analytics',
  user: 'readonly_user',
  password: 'your-secure-password',
  ssl: {
    enabled: true,
    rejectUnauthorized: true,
    ca: process.env.PG_CA_CERT
  }
});
```

## Query Building

### Basic Queries

```typescript
// Set target table
await adapter.setTable('player_events');
const data = await adapter.fetchData();

// Custom query
await adapter.setQuery(`
  SELECT user_id, event_type, timestamp
  FROM player_events
  WHERE timestamp > NOW() - INTERVAL '30 days'
`);
const recentData = await adapter.fetchData();
```

### Parameterized Queries

```typescript
await adapter.setQuery(
  `SELECT * FROM player_events
   WHERE user_id = $1
   AND event_type = $2`,
  ['user_123', 'purchase']
);
```

## Security Best Practices

### Create Read-Only User

```sql
CREATE USER game_insights_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE game_analytics TO game_insights_readonly;
GRANT USAGE ON SCHEMA public TO game_insights_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO game_insights_readonly;
```

### Use Environment Variables

```typescript
await adapter.connect({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check host, port, and firewall rules |
| Authentication failed | Verify username and password |
| SSL required | Enable SSL in connection options |
| Permission denied | Grant SELECT permission on tables |

## Related

- [Supabase Real-time](/docs/data-management/sources/supabase)
- [Webhook Streaming](/docs/data-management/sources/webhooks)
- [Data Quality](/docs/data-management/data-quality)
