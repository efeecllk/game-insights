---
sidebar_position: 6
title: Custom API Endpoints
description: Connect to REST APIs and custom data endpoints
---

# Custom API Endpoints

Connect to any REST API or custom data endpoint for flexible data integration.

## Overview

| Feature | Details |
|---------|---------|
| **Protocol** | HTTP/HTTPS |
| **Methods** | GET, POST |
| **Formats** | JSON, CSV, XML |
| **Authentication** | API Key, Bearer, Basic, OAuth 2.0 |
| **Best For** | Custom backends, third-party services |

## Basic Configuration

```typescript
import { APIAdapter } from '@/adapters/APIAdapter';

const adapter = new APIAdapter();

await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/analytics/events',
  method: 'GET'
});

const data = await adapter.fetchData();
```

## Authentication

### API Key

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/events',
  auth: {
    type: 'api_key',
    apiKey: 'your-api-key',
    apiKeyHeader: 'X-API-Key'
  }
});
```

### Bearer Token

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/events',
  auth: {
    type: 'bearer',
    token: 'your-jwt-token'
  }
});
```

### OAuth 2.0

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/events',
  auth: {
    type: 'oauth2',
    oauth: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      tokenUrl: 'https://auth.yourgame.com/oauth/token',
      scope: 'analytics:read'
    }
  }
});
```

## Request Configuration

### GET with Query Parameters

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/events',
  method: 'GET',
  params: {
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    limit: '1000'
  }
});
```

### POST with Body

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    query: 'SELECT * FROM events WHERE date > ?',
    parameters: ['2024-01-01']
  }
});
```

## Response Handling

### JSON with Nested Data

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/events',
  responseFormat: 'json',
  dataPath: 'data.events'  // Extract from nested response
});

// API Response: { "data": { "events": [...] } }
// Extracted: [...]
```

### CSV Response

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/export',
  responseFormat: 'csv',
  csvOptions: {
    delimiter: ',',
    hasHeader: true
  }
});
```

## Pagination

### Offset-Based

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/events',
  paginationType: 'offset',
  pagination: {
    offsetParam: 'offset',
    limitParam: 'limit',
    pageSize: 1000,
    totalPath: 'meta.total'
  }
});
```

### Cursor-Based

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/events',
  paginationType: 'cursor',
  pagination: {
    cursorParam: 'cursor',
    cursorPath: 'meta.next_cursor',
    hasMorePath: 'meta.has_more'
  }
});
```

## Rate Limiting

```typescript
await adapter.connect({
  baseUrl: 'https://api.yourgame.com',
  endpoint: '/events',
  rateLimit: {
    requestsPerSecond: 10,
    requestsPerMinute: 500,
    retryAfterHeader: 'Retry-After'
  }
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check base URL and network access |
| 401 Unauthorized | Verify authentication credentials |
| 429 Too Many Requests | Configure rate limiting |
| Empty response | Check dataPath configuration |

## Related

- [File Adapter](/docs/data-management/sources/file-adapter)
- [Google Sheets](/docs/data-management/sources/google-sheets)
- [Data Quality](/docs/data-management/data-quality)
