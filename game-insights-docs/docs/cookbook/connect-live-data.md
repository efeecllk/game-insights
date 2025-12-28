---
sidebar_position: 5
title: Connect Live Data
description: Tutorial for connecting live data sources to Game Insights
---

# Connect Live Data

This tutorial walks through connecting real-time data sources to Game Insights for live dashboards.

## What You'll Learn

- Connect to a live data source
- Set up real-time synchronization
- Handle connection errors gracefully
- Monitor data freshness

## Prerequisites

- Game Insights installed locally
- Access to one of: Supabase, PostgreSQL, or webhook endpoint
- Basic TypeScript knowledge

## Step 1: Choose Your Data Source

Game Insights supports several live data options:

| Source | Best For | Setup Complexity |
|--------|----------|------------------|
| **Supabase** | Real-time dashboards | Easy |
| **PostgreSQL** | Production databases | Medium |
| **Webhooks** | Server-sent events | Medium |
| **Custom API** | Third-party services | Varies |

For this tutorial, we'll use Supabase as it offers true real-time capabilities.

## Step 2: Set Up Supabase

### Create Project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Wait for the database to provision

### Create Events Table

```sql
CREATE TABLE player_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE player_events;
```

### Get Credentials

1. Go to **Settings** > **API**
2. Copy the Project URL and anon key

## Step 3: Configure Game Insights

Add credentials to your environment:

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Connect to Data Source

Navigate to **Data Sources** in Game Insights and click **Add Source**.

### Using the UI

1. Select **Supabase** as the source type
2. Enter your Project URL and API key
3. Select the `player_events` table
4. Enable **Real-time sync**
5. Click **Connect**

### Using Code

```typescript
import { SupabaseAdapter } from '@/adapters/SupabaseAdapter';
import { useData } from '@/context/DataContext';

function LiveDataConnector() {
  const { setData } = useData();
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const connect = async () => {
    setStatus('connecting');

    try {
      const adapter = new SupabaseAdapter({
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
      });

      // Connect with real-time enabled
      await adapter.connect({
        table: 'player_events',
        syncMode: 'realtime',
        order: { column: 'timestamp', ascending: false },
        limit: 10000
      });

      // Load initial data
      const initialData = await adapter.fetchData();
      setData(initialData);

      // Subscribe to changes
      adapter.on('insert', (newRow) => {
        setData(prev => [newRow, ...prev.slice(0, 9999)]);
      });

      await adapter.startRealtime();
      setStatus('connected');
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus('disconnected');
    }
  };

  return (
    <div>
      <p>Status: {status}</p>
      <button onClick={connect} disabled={status === 'connecting'}>
        {status === 'connected' ? 'Connected' : 'Connect'}
      </button>
    </div>
  );
}
```

## Step 5: Handle Real-time Events

Set up event handlers for different scenarios:

```typescript
// New data inserted
adapter.on('insert', (newRow) => {
  console.log('New event:', newRow);
  addToDataset(newRow);
  refreshCharts();
});

// Data updated
adapter.on('update', (newRow, oldRow) => {
  console.log('Updated:', oldRow.id, '->', newRow);
  updateInDataset(newRow);
});

// Data deleted
adapter.on('delete', (deletedRow) => {
  console.log('Deleted:', deletedRow.id);
  removeFromDataset(deletedRow.id);
});

// Connection status
adapter.on('subscribed', () => {
  console.log('Real-time connected');
  showNotification('Live data active');
});

adapter.on('error', (error) => {
  console.error('Connection error:', error);
  showNotification('Connection lost, retrying...');
});
```

## Step 6: Implement Reconnection

Handle connection drops gracefully:

```typescript
function useLiveData() {
  const [adapter, setAdapter] = useState<SupabaseAdapter | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxAttempts = 5;

  const connect = async () => {
    const newAdapter = new SupabaseAdapter({ /* config */ });

    newAdapter.on('error', async (error) => {
      setConnected(false);

      if (reconnectAttempts.current < maxAttempts) {
        reconnectAttempts.current++;
        const delay = Math.pow(2, reconnectAttempts.current) * 1000;

        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

        await new Promise(r => setTimeout(r, delay));
        await connect();
      }
    });

    newAdapter.on('subscribed', () => {
      setConnected(true);
      reconnectAttempts.current = 0;
    });

    await newAdapter.connect({ table: 'player_events', syncMode: 'realtime' });
    await newAdapter.startRealtime();

    setAdapter(newAdapter);
  };

  return { connect, connected, adapter };
}
```

## Step 7: Monitor Data Freshness

Track when data was last updated:

```typescript
function DataFreshnessIndicator() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdate) {
        const ageMs = Date.now() - lastUpdate.getTime();
        setIsStale(ageMs > 60000); // Stale if > 1 minute old
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className={isStale ? 'text-yellow-500' : 'text-green-500'}>
      {isStale ? '⚠️ Data may be stale' : '● Live'}
      {lastUpdate && (
        <span className="text-gray-500 ml-2">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
```

## Step 8: Test with Sample Data

Insert test events to verify the connection:

```sql
-- In Supabase SQL Editor
INSERT INTO player_events (user_id, event_type, properties)
VALUES
  ('user_001', 'session_start', '{"platform": "ios"}'),
  ('user_001', 'level_complete', '{"level": 1, "score": 1500}'),
  ('user_002', 'purchase', '{"item": "gems_100", "amount": 4.99}');
```

You should see the events appear instantly in your dashboard.

## Troubleshooting

### No Real-time Updates

1. Verify table has replication enabled:
   ```sql
   SELECT * FROM pg_publication_tables;
   ```

2. Check WebSocket connection in browser DevTools

3. Ensure RLS policies allow SELECT

### Connection Drops Frequently

1. Check network stability
2. Increase connection timeout
3. Implement exponential backoff reconnection

### High Latency

1. Reduce data payload size with column selection
2. Use server-side filtering
3. Consider batching updates client-side

## Next Steps

- [Set Up Alerts](/docs/cookbook/setup-alerts) for your live data
- [Build Custom Dashboard](/docs/cookbook/custom-dashboard) with live widgets
- [Configure Real-Time Features](/docs/features/real-time)

## Related

- [Supabase Adapter](/docs/data-management/sources/supabase)
- [PostgreSQL Connection](/docs/data-management/sources/postgresql)
- [Webhook Streaming](/docs/data-management/sources/webhooks)
