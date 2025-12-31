# 03 - Supabase Database Testing

Cloud-based testing with Supabase for large-scale game analytics datasets, real-time sync, and multi-user scenarios.

---

## Supabase Free Tier Limits

| Resource | Limit | Impact on Testing |
|----------|-------|-------------------|
| Database Size | 500 MB | ~5-10M rows depending on schema |
| Row Count | No hard limit | Limited by storage |
| API Requests | 50K/month | ~1,600/day |
| Realtime Messages | 2M/month | ~66K/day |
| Edge Functions | 500K invocations/month | ~16K/day |
| Storage | 1 GB | For backups/exports |
| Bandwidth | 5 GB/month | ~170MB/day |

**Recommended for Testing:**
- Up to 5M event rows
- 10-50 concurrent users
- Moderate real-time updates

---

## Part 1: Schema Design

### Core Tables

#### 1. players
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  country_code CHAR(2),
  platform TEXT CHECK (platform IN ('ios', 'android', 'web', 'steam')),
  device_type TEXT,
  app_version TEXT,
  total_sessions INTEGER DEFAULT 0,
  total_playtime_seconds INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  vip_level INTEGER DEFAULT 0,
  is_whale BOOLEAN DEFAULT FALSE,
  is_churned BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for common queries
CREATE INDEX idx_players_created_at ON players(created_at);
CREATE INDEX idx_players_last_seen ON players(last_seen_at);
CREATE INDEX idx_players_country ON players(country_code);
CREATE INDEX idx_players_platform ON players(platform);
CREATE INDEX idx_players_whale ON players(is_whale) WHERE is_whale = TRUE;
CREATE INDEX idx_players_churned ON players(is_churned);
```

#### 2. events (partitioned by month)
```sql
-- Main events table (partitioned)
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID,
  properties JSONB DEFAULT '{}',
  revenue_cents INTEGER DEFAULT 0,

  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_2024_02 PARTITION OF events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... continue for each month

-- Indexes on partitioned table
CREATE INDEX idx_events_player_id ON events(player_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_properties ON events USING GIN(properties);
```

#### 3. sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  events_count INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  app_version TEXT,
  platform TEXT,
  country_code CHAR(2)
);

CREATE INDEX idx_sessions_player ON sessions(player_id);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
```

#### 4. purchases
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  session_id UUID REFERENCES sessions(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_type TEXT CHECK (product_type IN ('iap', 'subscription', 'ad_removal', 'bundle')),
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform TEXT,
  is_first_purchase BOOLEAN DEFAULT FALSE,
  is_refunded BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_purchases_player ON purchases(player_id);
CREATE INDEX idx_purchases_timestamp ON purchases(timestamp DESC);
CREATE INDEX idx_purchases_product ON purchases(product_id);
```

#### 5. gacha_pulls (for gacha games)
```sql
CREATE TABLE gacha_pulls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  banner_id TEXT NOT NULL,
  banner_name TEXT,
  pull_type TEXT CHECK (pull_type IN ('single', 'multi_10', 'multi_100')),
  currency_type TEXT CHECK (currency_type IN ('premium', 'free', 'ticket')),
  currency_spent INTEGER NOT NULL,
  result_id TEXT NOT NULL,
  result_name TEXT,
  result_rarity TEXT CHECK (result_rarity IN ('N', 'R', 'SR', 'SSR', 'UR')),
  pity_count INTEGER DEFAULT 0,
  is_rate_up BOOLEAN DEFAULT FALSE,
  is_guaranteed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_gacha_player ON gacha_pulls(player_id);
CREATE INDEX idx_gacha_timestamp ON gacha_pulls(timestamp DESC);
CREATE INDEX idx_gacha_banner ON gacha_pulls(banner_id);
CREATE INDEX idx_gacha_rarity ON gacha_pulls(result_rarity);
```

---

## Part 2: Data Generation Scripts

### SQL Seed Script
```sql
-- scripts/seed-supabase.sql

-- Generate 10,000 test players
INSERT INTO players (external_id, created_at, country_code, platform, vip_level)
SELECT
  'user_' || i,
  NOW() - (random() * interval '365 days'),
  (ARRAY['US', 'JP', 'KR', 'DE', 'BR', 'GB', 'FR', 'CN', 'TW', 'IN'])[floor(random() * 10 + 1)],
  (ARRAY['ios', 'android', 'web'])[floor(random() * 3 + 1)],
  floor(random() * 10)
FROM generate_series(1, 10000) AS i;

-- Generate 1M events for last 30 days
INSERT INTO events (player_id, event_type, event_name, timestamp, properties)
SELECT
  (SELECT id FROM players ORDER BY random() LIMIT 1),
  (ARRAY['session_start', 'session_end', 'level_up', 'purchase', 'gacha_pull', 'achievement'])[floor(random() * 6 + 1)],
  'event_' || floor(random() * 100),
  NOW() - (random() * interval '30 days'),
  jsonb_build_object(
    'level', floor(random() * 100),
    'gold', floor(random() * 10000),
    'source', (ARRAY['organic', 'ad', 'referral'])[floor(random() * 3 + 1)]
  )
FROM generate_series(1, 1000000) AS i;

-- Update player stats
UPDATE players p SET
  total_sessions = (SELECT COUNT(*) FROM events e WHERE e.player_id = p.id AND e.event_type = 'session_start'),
  last_seen_at = (SELECT MAX(timestamp) FROM events e WHERE e.player_id = p.id),
  is_churned = (SELECT MAX(timestamp) FROM events e WHERE e.player_id = p.id) < NOW() - interval '7 days';
```

### TypeScript Data Generator
```typescript
// scripts/generate-supabase-data.ts
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for bulk inserts
);

interface GenerationConfig {
  playerCount: number;
  eventsPerPlayer: number;
  daysOfHistory: number;
  batchSize: number;
}

const DEFAULTS: GenerationConfig = {
  playerCount: 10000,
  eventsPerPlayer: 100,
  daysOfHistory: 30,
  batchSize: 1000
};

async function generatePlayers(count: number): Promise<string[]> {
  const players = [];
  const playerIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const id = faker.string.uuid();
    playerIds.push(id);

    players.push({
      id,
      external_id: `ext_${faker.string.alphanumeric(12)}`,
      created_at: faker.date.past({ years: 1 }).toISOString(),
      country_code: faker.helpers.arrayElement(['US', 'JP', 'KR', 'DE', 'BR', 'GB']),
      platform: faker.helpers.arrayElement(['ios', 'android', 'web']),
      device_type: faker.helpers.arrayElement(['phone', 'tablet', 'desktop']),
      app_version: `${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 20 })}`,
      vip_level: faker.number.int({ min: 0, max: 15 }),
      metadata: {
        acquisition_source: faker.helpers.arrayElement(['organic', 'facebook', 'google', 'tiktok']),
        first_session_country: faker.location.countryCode()
      }
    });

    // Batch insert every 1000 players
    if (players.length >= 1000) {
      await supabase.from('players').insert(players);
      players.length = 0;
      console.log(`Inserted ${i + 1} players...`);
    }
  }

  // Insert remaining
  if (players.length > 0) {
    await supabase.from('players').insert(players);
  }

  return playerIds;
}

async function generateEvents(
  playerIds: string[],
  eventsPerPlayer: number,
  daysOfHistory: number
): Promise<void> {
  const eventTypes = [
    { type: 'session', names: ['session_start', 'session_end'] },
    { type: 'gameplay', names: ['level_up', 'level_complete', 'level_fail'] },
    { type: 'economy', names: ['currency_earn', 'currency_spend', 'shop_view'] },
    { type: 'social', names: ['friend_add', 'guild_join', 'chat_message'] },
    { type: 'monetization', names: ['iap_view', 'iap_purchase', 'ad_watch'] }
  ];

  const events = [];
  let totalInserted = 0;

  for (const playerId of playerIds) {
    const sessionCount = Math.ceil(eventsPerPlayer / 10);

    for (let s = 0; s < sessionCount; s++) {
      const sessionId = faker.string.uuid();
      const sessionStart = faker.date.recent({ days: daysOfHistory });
      const sessionDuration = faker.number.int({ min: 60, max: 3600 });

      // Session start
      events.push({
        player_id: playerId,
        session_id: sessionId,
        event_type: 'session',
        event_name: 'session_start',
        timestamp: sessionStart.toISOString(),
        properties: {
          app_version: '2.1.0',
          platform: 'ios'
        }
      });

      // Generate events within session
      const eventCount = faker.number.int({ min: 5, max: 15 });
      for (let e = 0; e < eventCount; e++) {
        const eventCategory = faker.helpers.arrayElement(eventTypes);
        const eventTime = new Date(sessionStart.getTime() + faker.number.int({ min: 0, max: sessionDuration * 1000 }));

        events.push({
          player_id: playerId,
          session_id: sessionId,
          event_type: eventCategory.type,
          event_name: faker.helpers.arrayElement(eventCategory.names),
          timestamp: eventTime.toISOString(),
          properties: generateEventProperties(eventCategory.type),
          revenue_cents: eventCategory.type === 'monetization' ? faker.number.int({ min: 0, max: 9999 }) : 0
        });
      }

      // Session end
      events.push({
        player_id: playerId,
        session_id: sessionId,
        event_type: 'session',
        event_name: 'session_end',
        timestamp: new Date(sessionStart.getTime() + sessionDuration * 1000).toISOString(),
        properties: {
          duration_seconds: sessionDuration,
          events_count: eventCount
        }
      });

      // Batch insert every 1000 events
      if (events.length >= 1000) {
        await supabase.from('events').insert(events);
        totalInserted += events.length;
        events.length = 0;
        console.log(`Inserted ${totalInserted} events...`);
      }
    }
  }

  // Insert remaining
  if (events.length > 0) {
    await supabase.from('events').insert(events);
    totalInserted += events.length;
  }

  console.log(`Total events inserted: ${totalInserted}`);
}

function generateEventProperties(type: string): Record<string, any> {
  switch (type) {
    case 'gameplay':
      return {
        level: faker.number.int({ min: 1, max: 100 }),
        score: faker.number.int({ min: 0, max: 10000 }),
        stars: faker.number.int({ min: 0, max: 3 }),
        moves_used: faker.number.int({ min: 10, max: 50 })
      };
    case 'economy':
      return {
        currency_type: faker.helpers.arrayElement(['gold', 'gems', 'energy']),
        amount: faker.number.int({ min: 1, max: 1000 }),
        source: faker.helpers.arrayElement(['level_reward', 'daily_bonus', 'purchase'])
      };
    case 'monetization':
      return {
        product_id: `product_${faker.number.int({ min: 1, max: 20 })}`,
        price_usd: faker.helpers.arrayElement([0.99, 2.99, 4.99, 9.99, 19.99, 49.99]),
        is_first_purchase: faker.datatype.boolean(0.1)
      };
    default:
      return {};
  }
}

// Main execution
async function main() {
  console.log('Generating test data...');

  const playerIds = await generatePlayers(DEFAULTS.playerCount);
  console.log(`Created ${playerIds.length} players`);

  await generateEvents(playerIds, DEFAULTS.eventsPerPlayer, DEFAULTS.daysOfHistory);
  console.log('Data generation complete!');
}

main().catch(console.error);
```

---

## Part 3: Query Templates

### Retention Analysis
```sql
-- Day N Retention Query
WITH first_seen AS (
  SELECT
    player_id,
    DATE(MIN(timestamp)) as cohort_date
  FROM events
  WHERE event_type = 'session' AND event_name = 'session_start'
  GROUP BY player_id
),
daily_activity AS (
  SELECT DISTINCT
    player_id,
    DATE(timestamp) as activity_date
  FROM events
  WHERE event_type = 'session' AND event_name = 'session_start'
)
SELECT
  f.cohort_date,
  COUNT(DISTINCT f.player_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN d.activity_date = f.cohort_date + 1 THEN f.player_id END) * 100.0 / COUNT(DISTINCT f.player_id) as d1_retention,
  COUNT(DISTINCT CASE WHEN d.activity_date = f.cohort_date + 7 THEN f.player_id END) * 100.0 / COUNT(DISTINCT f.player_id) as d7_retention,
  COUNT(DISTINCT CASE WHEN d.activity_date = f.cohort_date + 30 THEN f.player_id END) * 100.0 / COUNT(DISTINCT f.player_id) as d30_retention
FROM first_seen f
LEFT JOIN daily_activity d ON f.player_id = d.player_id
WHERE f.cohort_date >= CURRENT_DATE - interval '60 days'
GROUP BY f.cohort_date
ORDER BY f.cohort_date DESC;
```

### Revenue Analysis
```sql
-- Daily Revenue Breakdown
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT player_id) as paying_users,
  COUNT(*) as transactions,
  SUM(revenue_cents) / 100.0 as revenue_usd,
  AVG(revenue_cents) / 100.0 as avg_transaction,
  SUM(revenue_cents) / 100.0 / COUNT(DISTINCT player_id) as arppu
FROM purchases
WHERE timestamp >= CURRENT_DATE - interval '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Whale Analysis
SELECT
  CASE
    WHEN total_revenue_cents = 0 THEN 'Non-Payer'
    WHEN total_revenue_cents < 1000 THEN 'Minnow (<$10)'
    WHEN total_revenue_cents < 10000 THEN 'Dolphin ($10-$100)'
    WHEN total_revenue_cents < 100000 THEN 'Whale ($100-$1000)'
    ELSE 'Super Whale (>$1000)'
  END as spender_tier,
  COUNT(*) as player_count,
  SUM(total_revenue_cents) / 100.0 as total_revenue,
  AVG(total_revenue_cents) / 100.0 as avg_revenue
FROM players
GROUP BY 1
ORDER BY MIN(total_revenue_cents);
```

### Gacha Analytics
```sql
-- Pull Rate Verification
SELECT
  result_rarity,
  COUNT(*) as pull_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as actual_rate,
  CASE result_rarity
    WHEN 'N' THEN 40.0
    WHEN 'R' THEN 35.0
    WHEN 'SR' THEN 18.0
    WHEN 'SSR' THEN 6.0
    WHEN 'UR' THEN 1.0
  END as expected_rate
FROM gacha_pulls
GROUP BY result_rarity
ORDER BY
  CASE result_rarity
    WHEN 'UR' THEN 1
    WHEN 'SSR' THEN 2
    WHEN 'SR' THEN 3
    WHEN 'R' THEN 4
    WHEN 'N' THEN 5
  END;

-- Pity Distribution
SELECT
  pity_count,
  COUNT(*) as pulls_at_pity,
  SUM(CASE WHEN result_rarity IN ('SSR', 'UR') THEN 1 ELSE 0 END) as high_rarity_pulls,
  SUM(CASE WHEN result_rarity IN ('SSR', 'UR') THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as high_rarity_rate
FROM gacha_pulls
GROUP BY pity_count
ORDER BY pity_count;
```

### Funnel Analysis
```sql
-- Tutorial Completion Funnel
WITH funnel_steps AS (
  SELECT
    player_id,
    MAX(CASE WHEN event_name = 'tutorial_start' THEN 1 ELSE 0 END) as step_1,
    MAX(CASE WHEN event_name = 'tutorial_step_1' THEN 1 ELSE 0 END) as step_2,
    MAX(CASE WHEN event_name = 'tutorial_step_2' THEN 1 ELSE 0 END) as step_3,
    MAX(CASE WHEN event_name = 'tutorial_complete' THEN 1 ELSE 0 END) as step_4
  FROM events
  WHERE timestamp >= CURRENT_DATE - interval '7 days'
  GROUP BY player_id
)
SELECT
  SUM(step_1) as tutorial_start,
  SUM(step_2) as step_1_complete,
  SUM(step_3) as step_2_complete,
  SUM(step_4) as tutorial_complete,
  SUM(step_2) * 100.0 / NULLIF(SUM(step_1), 0) as step_1_rate,
  SUM(step_3) * 100.0 / NULLIF(SUM(step_2), 0) as step_2_rate,
  SUM(step_4) * 100.0 / NULLIF(SUM(step_3), 0) as step_3_rate,
  SUM(step_4) * 100.0 / NULLIF(SUM(step_1), 0) as overall_rate
FROM funnel_steps;
```

---

## Part 4: Real-time Subscriptions

### Live Dashboard Updates
```typescript
// src/adapters/SupabaseRealtimeAdapter.ts

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

export class SupabaseRealtimeAdapter {
  private supabase;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(url: string, anonKey: string) {
    this.supabase = createClient(url, anonKey);
  }

  subscribeToEvents(
    onInsert: (event: any) => void,
    filter?: { player_id?: string; event_type?: string }
  ): string {
    const channelId = `events-${Date.now()}`;

    let channel = this.supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: filter?.player_id ? `player_id=eq.${filter.player_id}` : undefined
        },
        (payload) => {
          if (!filter?.event_type || payload.new.event_type === filter.event_type) {
            onInsert(payload.new);
          }
        }
      )
      .subscribe();

    this.channels.set(channelId, channel);
    return channelId;
  }

  subscribeToPurchases(onPurchase: (purchase: any) => void): string {
    const channelId = `purchases-${Date.now()}`;

    const channel = this.supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchases'
        },
        (payload) => onPurchase(payload.new)
      )
      .subscribe();

    this.channels.set(channelId, channel);
    return channelId;
  }

  subscribeToMetrics(
    metricsQuery: string,
    onUpdate: (metrics: any) => void,
    intervalMs: number = 5000
  ): string {
    const channelId = `metrics-${Date.now()}`;

    // For aggregated metrics, use polling since Postgres changes
    // don't work well with computed values
    const interval = setInterval(async () => {
      const { data, error } = await this.supabase.rpc('get_live_metrics');
      if (!error && data) {
        onUpdate(data);
      }
    }, intervalMs);

    // Store interval ID for cleanup
    this.channels.set(channelId, { unsubscribe: () => clearInterval(interval) } as any);
    return channelId;
  }

  unsubscribe(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelId);
    }
  }

  unsubscribeAll(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
  }
}
```

### Database Functions for Real-time Metrics
```sql
-- Create RPC function for live metrics
CREATE OR REPLACE FUNCTION get_live_metrics()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'dau', (
      SELECT COUNT(DISTINCT player_id)
      FROM events
      WHERE timestamp >= CURRENT_DATE
    ),
    'revenue_today', (
      SELECT COALESCE(SUM(revenue_cents), 0) / 100.0
      FROM purchases
      WHERE timestamp >= CURRENT_DATE
    ),
    'events_last_hour', (
      SELECT COUNT(*)
      FROM events
      WHERE timestamp >= NOW() - interval '1 hour'
    ),
    'active_sessions', (
      SELECT COUNT(DISTINCT session_id)
      FROM events
      WHERE timestamp >= NOW() - interval '30 minutes'
    ),
    'new_players_today', (
      SELECT COUNT(*)
      FROM players
      WHERE created_at >= CURRENT_DATE
    )
  ) INTO result;

  RETURN result;
END;
$$;
```

---

## Part 5: Integration with Game Insights

### SupabaseAdapter Enhancement
```typescript
// src/adapters/SupabaseAdapter.ts (enhanced)

import { BaseAdapter, AdapterConfig, DataSource } from './BaseAdapter';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig extends AdapterConfig {
  url: string;
  anonKey: string;
  schema?: string;
  tableMapping?: {
    events?: string;
    players?: string;
    purchases?: string;
    sessions?: string;
  };
}

export class SupabaseAdapter extends BaseAdapter {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig;

  constructor(config: SupabaseConfig) {
    super(config);
    this.config = config;
  }

  async connect(): Promise<void> {
    this.client = createClient(this.config.url, this.config.anonKey, {
      db: { schema: this.config.schema || 'public' }
    });

    // Test connection
    const { error } = await this.client.from('players').select('id').limit(1);
    if (error) throw new Error(`Connection failed: ${error.message}`);

    this.status = 'connected';
  }

  async fetchSchema(): Promise<DataSource['schema']> {
    if (!this.client) throw new Error('Not connected');

    const tables = ['events', 'players', 'purchases', 'sessions'];
    const schema: DataSource['schema'] = { tables: [] };

    for (const table of tables) {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .limit(1);

      if (!error && data && data.length > 0) {
        const columns = Object.entries(data[0]).map(([name, value]) => ({
          name,
          type: typeof value as 'string' | 'number' | 'boolean',
          nullable: value === null
        }));

        schema.tables.push({ name: table, columns });
      }
    }

    return schema;
  }

  async fetchData(options: {
    table: string;
    columns?: string[];
    filters?: Record<string, any>;
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
  }): Promise<any[]> {
    if (!this.client) throw new Error('Not connected');

    let query = this.client.from(options.table);

    // Select columns
    if (options.columns?.length) {
      query = query.select(options.columns.join(','));
    } else {
      query = query.select('*');
    }

    // Apply filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operators: { gte: 10, lte: 100 }
          for (const [op, val] of Object.entries(value)) {
            switch (op) {
              case 'gte': query = query.gte(key, val); break;
              case 'lte': query = query.lte(key, val); break;
              case 'gt': query = query.gt(key, val); break;
              case 'lt': query = query.lt(key, val); break;
              case 'like': query = query.like(key, val as string); break;
            }
          }
        } else {
          query = query.eq(key, value);
        }
      }
    }

    // Order
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true
      });
    }

    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Query failed: ${error.message}`);

    return data || [];
  }

  async executeQuery(sql: string): Promise<any[]> {
    if (!this.client) throw new Error('Not connected');

    const { data, error } = await this.client.rpc('execute_sql', { query: sql });
    if (error) throw new Error(`Query failed: ${error.message}`);

    return data || [];
  }

  async getRetentionData(): Promise<any> {
    return this.executeQuery(`
      WITH cohorts AS (
        SELECT
          player_id,
          DATE(MIN(timestamp)) as cohort_date
        FROM events
        WHERE event_name = 'session_start'
        GROUP BY player_id
      ),
      activity AS (
        SELECT DISTINCT player_id, DATE(timestamp) as activity_date
        FROM events WHERE event_name = 'session_start'
      )
      SELECT
        c.cohort_date,
        COUNT(DISTINCT c.player_id) as cohort_size,
        COUNT(DISTINCT CASE WHEN a.activity_date = c.cohort_date + 1 THEN c.player_id END) as d1,
        COUNT(DISTINCT CASE WHEN a.activity_date = c.cohort_date + 7 THEN c.player_id END) as d7,
        COUNT(DISTINCT CASE WHEN a.activity_date = c.cohort_date + 30 THEN c.player_id END) as d30
      FROM cohorts c
      LEFT JOIN activity a ON c.player_id = a.player_id
      WHERE c.cohort_date >= CURRENT_DATE - interval '60 days'
      GROUP BY c.cohort_date
      ORDER BY c.cohort_date DESC
    `);
  }
}
```

---

## Part 6: Test Implementation Plan

### Week 1: Schema Setup
- [ ] Create Supabase project
- [ ] Run schema migration scripts
- [ ] Set up Row Level Security (RLS)
- [ ] Configure environment variables

### Week 2: Data Generation
- [ ] Run seed script for 10K players
- [ ] Generate 1M events
- [ ] Verify data integrity
- [ ] Test query performance

### Week 3: Integration Testing
```typescript
// tests/integration/supabase.test.ts

describe('Supabase Integration', () => {
  let adapter: SupabaseAdapter;

  beforeAll(async () => {
    adapter = new SupabaseAdapter({
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!
    });
    await adapter.connect();
  });

  test('connects successfully', () => {
    expect(adapter.status).toBe('connected');
  });

  test('fetches schema for all tables', async () => {
    const schema = await adapter.fetchSchema();
    expect(schema.tables.length).toBeGreaterThanOrEqual(4);
    expect(schema.tables.find(t => t.name === 'events')).toBeDefined();
  });

  test('fetches paginated events', async () => {
    const events = await adapter.fetchData({
      table: 'events',
      limit: 100,
      offset: 0,
      orderBy: { column: 'timestamp', ascending: false }
    });
    expect(events.length).toBe(100);
  });

  test('retention query completes in < 5s', async () => {
    const start = Date.now();
    const retention = await adapter.getRetentionData();
    expect(Date.now() - start).toBeLessThan(5000);
    expect(retention.length).toBeGreaterThan(0);
  });
});
```

### Week 4: Real-time Testing
- [ ] Test subscription to events
- [ ] Test live metrics updates
- [ ] Measure latency
- [ ] Test reconnection handling

---

## Performance Benchmarks

| Query | 100K Events | 1M Events | 5M Events |
|-------|-------------|-----------|-----------|
| Daily retention | 200ms | 800ms | 3s |
| Revenue by day | 100ms | 400ms | 2s |
| Active users (24h) | 50ms | 200ms | 800ms |
| Funnel analysis | 300ms | 1.2s | 5s |
| Full export | 2s | 15s | 60s |

### Optimization Tips
1. Use proper indexes (created in schema)
2. Partition events table by month
3. Use materialized views for dashboards
4. Enable connection pooling
5. Use RPC functions for complex queries

---

## Environment Setup

### .env.local
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ... # Only for data generation scripts
```

### Row Level Security
```sql
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated access (testing)
CREATE POLICY "Allow all for testing" ON events
  FOR ALL USING (true);

CREATE POLICY "Allow all for testing" ON players
  FOR ALL USING (true);
```

---

## Next Steps

1. Create Supabase project at supabase.com
2. Run schema migrations
3. Generate test data
4. Run integration tests
5. Benchmark query performance
6. Implement real-time subscriptions

See [../roadmap-data-tests.md](../roadmap-data-tests.md) for the complete testing roadmap.
