# Data Adapters API

Data adapters provide a unified interface for connecting to various data sources. All adapters extend the `BaseAdapter` abstract class and implement a consistent API for data retrieval.

**Source Location:** `src/adapters/`

## BaseAdapter Interface

The abstract base class that all adapters must extend:

```typescript
// src/adapters/BaseAdapter.ts

abstract class BaseAdapter {
    abstract name: string;
    abstract type: AdapterType;

    abstract connect(config: AdapterConfig): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract testConnection(): Promise<boolean>;

    abstract fetchSchema(): Promise<SchemaInfo>;
    abstract fetchData(query?: DataQuery): Promise<NormalizedData>;

    abstract getCapabilities(): AdapterCapabilities;
}
```

### AdapterType

```typescript
type AdapterType = 'file' | 'api' | 'database' | 'cloud';
```

### AdapterConfig

Base configuration interface:

```typescript
interface AdapterConfig {
    name: string;
    type: AdapterType;
}
```

### AdapterCapabilities

Describes what features the adapter supports:

```typescript
interface AdapterCapabilities {
    supportsRealtime: boolean;
    supportsFiltering: boolean;
    supportsAggregation: boolean;
    maxRowsPerQuery: number;
}
```

## Data Query Interface

Used to filter and paginate data:

```typescript
interface DataQuery {
    columns?: string[];
    filters?: QueryFilter[];
    limit?: number;
    offset?: number;
    orderBy?: { column: string; direction: 'asc' | 'desc' };
}

interface QueryFilter {
    column: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
    value: unknown;
}
```

## Available Adapters

### FileAdapter

Handles CSV and JSON file uploads.

```typescript
import { FileAdapter } from '@/adapters';

interface FileAdapterConfig extends AdapterConfig {
    file: File;
    fileType: 'csv' | 'json';
}

// Usage
const adapter = new FileAdapter();
await adapter.connect({
    name: 'my-data',
    type: 'file',
    file: uploadedFile,
    fileType: 'csv'
});

const schema = await adapter.fetchSchema();
const data = await adapter.fetchData({ limit: 1000 });
```

**Capabilities:**
- `supportsRealtime`: false
- `supportsFiltering`: true
- `supportsAggregation`: false
- `maxRowsPerQuery`: 100,000

### APIAdapter

Connects to REST APIs for data fetching.

```typescript
import { APIAdapter, APIAdapterConfig } from '@/adapters';

interface APIAdapterConfig extends AdapterConfig {
    endpoint: string;
    authType: 'none' | 'bearer' | 'apikey' | 'basic';
    authValue?: string;
    apiKeyHeader?: string;
    headers?: Record<string, string>;
    refreshInterval?: number; // minutes
    dataPath?: string; // JSON path to data array
}

// Usage
const adapter = new APIAdapter();
await adapter.connect({
    name: 'analytics-api',
    type: 'api',
    endpoint: 'https://api.example.com/analytics',
    authType: 'bearer',
    authValue: 'your-token',
    dataPath: 'data.results',
    refreshInterval: 5
});

const data = await adapter.fetchData();
```

**Capabilities:**
- `supportsRealtime`: true
- `supportsFiltering`: true
- `supportsAggregation`: false
- `maxRowsPerQuery`: 10,000

**Methods:**
- `refresh()`: Force refresh data from API

### GoogleSheetsAdapter

Connects to Google Spreadsheets via OAuth.

```typescript
import { GoogleSheetsAdapter, GoogleSheetsConfig } from '@/adapters';

interface GoogleSheetsConfig extends AdapterConfig {
    spreadsheetId: string;
    sheetName?: string;
    range?: string;
    hasHeaderRow: boolean;
    refreshInterval?: number; // minutes
}

interface GoogleAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}

// Usage
const adapter = new GoogleSheetsAdapter();

// Step 1: Set OAuth client ID
adapter.setClientId('your-client-id');

// Step 2: Get OAuth URL for user authentication
const authUrl = adapter.getOAuthUrl('https://your-app.com/callback');

// Step 3: After OAuth callback, set tokens
adapter.setTokens({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: Date.now() + 3600000
});

// Step 4: Connect
await adapter.connect({
    name: 'my-sheet',
    type: 'cloud',
    spreadsheetId: 'sheet-id-here',
    sheetName: 'Analytics',
    hasHeaderRow: true
});

const data = await adapter.fetchData();
```

**Additional Methods:**
- `getOAuthUrl(redirectUri)`: Get OAuth authorization URL
- `setClientId(clientId)`: Set OAuth client ID
- `setTokens(tokens)`: Set OAuth tokens
- `getTokens()`: Get current tokens
- `isTokenExpired()`: Check if token is expired
- `getAvailableSheets()`: List sheets in spreadsheet
- `getSpreadsheetTitle()`: Get spreadsheet title
- `refresh()`: Force refresh data

### PostgreSQLAdapter

Connects to PostgreSQL via backend proxy.

```typescript
import { PostgreSQLAdapter, PostgreSQLConfig } from '@/adapters';

interface PostgreSQLConfig extends AdapterConfig {
    proxyUrl: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    schema?: string;
    tableName?: string;
    customQuery?: string;
    refreshInterval?: number;
}

// Usage
const adapter = new PostgreSQLAdapter();
await adapter.connect({
    name: 'game-analytics',
    type: 'database',
    proxyUrl: 'https://your-proxy.com',
    host: 'db.example.com',
    port: 5432,
    database: 'analytics',
    username: 'reader',
    password: 'password',
    ssl: true,
    tableName: 'events'
});

// Execute custom query (SELECT only)
const result = await adapter.executeQuery('SELECT * FROM events LIMIT 100');
```

**Additional Methods:**
- `getAvailableTables()`: List tables in schema
- `getTableColumns(tableName)`: Get column info for table
- `executeQuery(sql)`: Execute custom SELECT query
- `refresh()`: Force refresh data

**Security Notes:**
- Only SELECT and WITH queries allowed
- Column and table names are validated
- Uses parameterized queries to prevent SQL injection

### SupabaseAdapter

Connects to Supabase databases via REST API.

```typescript
import { SupabaseAdapter, SupabaseConfig } from '@/adapters';

interface SupabaseConfig extends AdapterConfig {
    projectUrl: string;
    apiKey: string;
    tableName: string;
    schema?: string;
    selectColumns?: string[];
    refreshInterval?: number;
}

// Usage
const adapter = new SupabaseAdapter();
await adapter.connect({
    name: 'supabase-data',
    type: 'database',
    projectUrl: 'https://xxx.supabase.co',
    apiKey: 'your-api-key',
    tableName: 'game_events'
});

// Execute RPC function
const rpcResult = await adapter.executeRpc('get_user_stats', { user_id: '123' });

// Subscribe to changes
const unsubscribe = adapter.subscribeToChanges((payload) => {
    console.log('Data changed:', payload);
});

// Cleanup
unsubscribe();
```

**Additional Methods:**
- `getAvailableTables()`: List tables
- `getTableColumns(tableName)`: Get column info
- `executeRpc(functionName, params)`: Call Supabase RPC function
- `subscribeToChanges(callback)`: Subscribe to data changes
- `refresh()`: Force refresh

### WebhookAdapter

Receives real-time data via webhooks.

```typescript
import { WebhookAdapter, WebhookConfig, WebhookEvent } from '@/adapters';

interface WebhookConfig extends AdapterConfig {
    receiverUrl: string;
    endpointId?: string;
    secretKey?: string;
    maxBufferSize?: number;
    expectedSchema?: Record<string, ColumnType>;
    autoDetectSchema?: boolean;
}

interface WebhookEvent {
    id: string;
    timestamp: string;
    source: string;
    eventType: string;
    payload: Record<string, unknown>;
    validated: boolean;
}

// Usage
const adapter = new WebhookAdapter();
await adapter.connect({
    name: 'webhook-events',
    type: 'api',
    receiverUrl: 'https://your-receiver.com',
    maxBufferSize: 1000,
    autoDetectSchema: true
});

// Get webhook URL to configure in external service
const webhookUrl = adapter.getWebhookUrl();
console.log('Configure your service to send events to:', webhookUrl);

// Listen for events
const unsubscribe = adapter.addEventListener((event: WebhookEvent) => {
    console.log('Received event:', event);
});

// Get recent events
const recentEvents = adapter.getRecentEvents(10);

// Manual event push (for testing)
adapter.pushEvent({ user_id: '123', action: 'purchase' }, 'test');

// Cleanup
unsubscribe();
await adapter.disconnect();
```

**Additional Methods:**
- `getWebhookUrl()`: Get URL for external service configuration
- `getEndpointStatus()`: Get endpoint statistics
- `getRecentEvents(limit)`: Get recent buffered events
- `clearBuffer()`: Clear event buffer
- `addEventListener(callback)`: Listen for incoming events
- `isConnected()`: Check connection status
- `pushEvent(payload, eventType)`: Manually push event (testing)

## Adapter Registry

The registry manages adapter instances:

```typescript
import { adapterRegistry, BaseAdapter } from '@/adapters';

// Register a custom adapter
adapterRegistry.register(myAdapter);

// Get adapter by name
const adapter = adapterRegistry.get('my_adapter');

// Get all adapters
const allAdapters = adapterRegistry.getAll();

// Get adapters by type
const dbAdapters = adapterRegistry.getByType('database');
```

## Creating Custom Adapters

Example of creating a custom adapter:

```typescript
import {
    BaseAdapter,
    AdapterConfig,
    SchemaInfo,
    NormalizedData,
    DataQuery,
    AdapterCapabilities,
    adapterRegistry
} from '@/adapters';

interface MyAdapterConfig extends AdapterConfig {
    connectionString: string;
    table: string;
}

export class MyCustomAdapter extends BaseAdapter {
    name = 'my_custom_adapter';
    type = 'database' as const;

    private config: MyAdapterConfig | null = null;
    private data: Record<string, unknown>[] = [];

    async connect(config: MyAdapterConfig): Promise<void> {
        this.config = config;
        // Initialize connection
        this.data = await this.fetchFromSource();
    }

    async disconnect(): Promise<void> {
        this.config = null;
        this.data = [];
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.fetchFromSource();
            return true;
        } catch {
            return false;
        }
    }

    async fetchSchema(): Promise<SchemaInfo> {
        if (this.data.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        return {
            columns: Object.keys(this.data[0]).map(name => ({
                name,
                type: this.inferType(this.data.slice(0, 10).map(r => r[name])),
                nullable: true,
                sampleValues: this.data.slice(0, 5).map(r => r[name])
            })),
            rowCount: this.data.length,
            sampleData: this.data.slice(0, 10)
        };
    }

    async fetchData(query?: DataQuery): Promise<NormalizedData> {
        let result = [...this.data];

        // Apply filters
        if (query?.filters) {
            result = this.applyFilters(result, query.filters);
        }

        // Apply pagination
        if (query?.offset) result = result.slice(query.offset);
        if (query?.limit) result = result.slice(0, query.limit);

        return {
            columns: Object.keys(this.data[0] || {}),
            rows: result,
            metadata: {
                source: this.name,
                fetchedAt: new Date().toISOString(),
                rowCount: result.length
            }
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: false,
            supportsFiltering: true,
            supportsAggregation: false,
            maxRowsPerQuery: 50000
        };
    }

    private async fetchFromSource(): Promise<Record<string, unknown>[]> {
        // Implement data fetching logic
        return [];
    }

    private applyFilters(
        data: Record<string, unknown>[],
        filters: QueryFilter[]
    ): Record<string, unknown>[] {
        return data.filter(row =>
            filters.every(f => {
                const value = row[f.column];
                switch (f.operator) {
                    case '=': return value === f.value;
                    case '!=': return value !== f.value;
                    case '>': return (value as number) > (f.value as number);
                    default: return true;
                }
            })
        );
    }

    private inferType(values: unknown[]): ColumnInfo['type'] {
        const nonNull = values.filter(v => v != null);
        if (nonNull.length === 0) return 'unknown';
        const first = nonNull[0];
        if (typeof first === 'number') return 'number';
        if (typeof first === 'boolean') return 'boolean';
        return 'string';
    }
}

// Register the adapter
adapterRegistry.register(new MyCustomAdapter());
```

## Best Practices

1. **Always call disconnect()** when done to clean up resources
2. **Handle errors gracefully** - wrap operations in try-catch
3. **Use testConnection()** before full connection to validate credentials
4. **Check capabilities** before using features like filtering or aggregation
5. **Respect maxRowsPerQuery** to avoid memory issues
6. **Use refresh intervals** for APIs to reduce load
7. **Validate input** for security, especially for database adapters
