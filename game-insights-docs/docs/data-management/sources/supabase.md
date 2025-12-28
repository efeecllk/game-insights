---
sidebar_position: 4
title: Supabase Real-time
description: Connect Supabase databases with real-time subscriptions
---

# Supabase Real-time

Connect to Supabase for real-time data synchronization with instant updates powered by PostgreSQL's replication.

## Overview

| Feature | Details |
|---------|---------|
| **Connection** | HTTPS + WebSocket |
| **Authentication** | API Key or JWT |
| **Sync Options** | Manual, Polling, Real-time |
| **Row-Level Security** | Fully supported |
| **Best For** | Real-time dashboards, serverless apps |

## Setup

### Prerequisites

1. A Supabase project
2. Project URL and API keys
3. Tables with replication enabled

### Get Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy Project URL and anon key

### Connection

```typescript
import { SupabaseAdapter } from '@/adapters/SupabaseAdapter';

const adapter = new SupabaseAdapter({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
});

await adapter.connect({
  table: 'player_events'
});

const data = await adapter.fetchData();
```

## Real-time Subscriptions

### Enable Real-time

In Supabase dashboard:
1. Go to **Database** > **Replication**
2. Enable replication for your tables

### Subscribe to Changes

```typescript
await adapter.connect({
  table: 'player_events',
  syncMode: 'realtime'
});

adapter.on('insert', (newRow) => {
  console.log('New event:', newRow);
  updateDashboard(newRow);
});

adapter.on('update', (newRow, oldRow) => {
  console.log('Updated:', oldRow, '->', newRow);
});

adapter.on('delete', (deletedRow) => {
  console.log('Deleted:', deletedRow);
});

await adapter.startRealtime();
```

## Filtering Data

```typescript
await adapter.connect({
  table: 'player_events',
  select: 'user_id, event_type, timestamp',
  filters: [
    { column: 'timestamp', operator: 'gte', value: '2024-01-01' },
    { column: 'event_type', operator: 'in', value: ['purchase', 'level_complete'] }
  ],
  order: { column: 'timestamp', ascending: false },
  limit: 1000
});
```

## Filter Operators

| Operator | Description |
|----------|-------------|
| `eq` | Equals |
| `neq` | Not equals |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `like` | Pattern match |
| `in` | In array |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection failed | Verify project URL and API keys |
| No realtime updates | Enable replication for the table |
| Permission denied | Check RLS policies |

## Related

- [PostgreSQL Connection](/docs/data-management/sources/postgresql)
- [Webhook Streaming](/docs/data-management/sources/webhooks)
- [Real-Time Analytics](/docs/features/real-time)
