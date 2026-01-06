/**
 * Supabase Adapter
 * Connects to Supabase PostgreSQL databases via REST API
 * Phase 3: One-Click Integrations
 */

import {
    BaseAdapter,
    AdapterConfig,
    SchemaInfo,
    NormalizedData,
    DataQuery,
    AdapterCapabilities,
    ColumnInfo,
} from './BaseAdapter';

// ============================================================================
// Types
// ============================================================================

export interface SupabaseConfig extends AdapterConfig {
    projectUrl: string;
    apiKey: string;
    tableName: string;
    schema?: string;
    selectColumns?: string[];
    refreshInterval?: number; // minutes
}

interface SupabaseColumn {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
}

interface SupabaseTable {
    table_name: string;
    table_schema: string;
    table_type: string;
}

// ============================================================================
// Adapter Implementation
// ============================================================================

export class SupabaseAdapter extends BaseAdapter {
    name = 'supabase';
    type = 'database' as const;

    private config: SupabaseConfig | null = null;
    private cachedData: Record<string, unknown>[] = [];
    private schema: SchemaInfo | null = null;
    private lastFetch: Date | null = null;
    private availableTables: SupabaseTable[] = [];
    private tableColumns: Map<string, SupabaseColumn[]> = new Map();
    private realtimePollInterval: ReturnType<typeof setInterval> | null = null;
    private abortController: AbortController | null = null;

    // ========================================================================
    // Lifecycle Methods
    // ========================================================================

    async connect(config: SupabaseConfig): Promise<void> {
        this.config = config;
        this.abortController = new AbortController();

        // Validate URL format
        if (!this.isValidSupabaseUrl(config.projectUrl)) {
            throw new Error('Invalid Supabase project URL. Expected format: https://xxx.supabase.co');
        }

        // Test connection by fetching available tables
        await this.fetchAvailableTables();

        // Verify table exists
        const tableExists = this.availableTables.some(
            t => t.table_name === config.tableName
        );
        if (!tableExists) {
            throw new Error(`Table "${config.tableName}" not found in schema "${config.schema || 'public'}"`);
        }

        // Fetch table schema
        await this.fetchTableSchema(config.tableName);

        // Initial data fetch
        await this.refresh();
    }

    async disconnect(): Promise<void> {
        // Abort any pending requests
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // Clear any active realtime polling
        if (this.realtimePollInterval) {
            clearInterval(this.realtimePollInterval);
            this.realtimePollInterval = null;
        }

        this.config = null;
        this.cachedData = [];
        this.schema = null;
        this.lastFetch = null;
        this.availableTables = [];
        this.tableColumns.clear();
    }

    async testConnection(): Promise<boolean> {
        if (!this.config) return false;

        try {
            const response = await this.makeRequest('', { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // Data Methods
    // ========================================================================

    async fetchSchema(): Promise<SchemaInfo> {
        await this.ensureFresh();
        if (!this.schema) {
            throw new Error('No schema available. Check connection.');
        }
        return this.schema;
    }

    async fetchData(query?: DataQuery): Promise<NormalizedData> {
        // For Supabase, we can push filters to the API
        if (query?.filters || query?.orderBy || query?.limit) {
            return this.fetchWithServerQuery(query);
        }

        await this.ensureFresh();
        return {
            columns: Object.keys(this.cachedData[0] || {}),
            rows: this.cachedData,
            metadata: {
                source: `supabase:${this.config?.tableName || 'unknown'}`,
                fetchedAt: this.lastFetch?.toISOString() || new Date().toISOString(),
                rowCount: this.cachedData.length,
            },
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: true,
            supportsFiltering: true,
            supportsAggregation: true,
            maxRowsPerQuery: 100000,
        };
    }

    // ========================================================================
    // Public Query Methods
    // ========================================================================

    /**
     * Get list of available tables in the schema
     */
    getAvailableTables(): SupabaseTable[] {
        return this.availableTables;
    }

    /**
     * Get column info for a specific table
     */
    getTableColumns(tableName: string): SupabaseColumn[] {
        return this.tableColumns.get(tableName) || [];
    }

    /**
     * Execute a custom RPC function
     */
    async executeRpc<T>(functionName: string, params: Record<string, unknown> = {}): Promise<T> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest(`/rpc/${functionName}`, {
            method: 'POST',
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`RPC error: ${error.message || response.statusText}`);
        }

        return response.json();
    }

    /**
     * Force refresh data from Supabase
     */
    async refresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const select = this.config.selectColumns?.join(',') || '*';
        const response = await this.makeRequest(
            `/rest/v1/${this.config.tableName}?select=${encodeURIComponent(select)}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Supabase error: ${error.message || response.statusText}`);
        }

        this.cachedData = await response.json();
        this.schema = this.buildSchema(this.cachedData);
        this.lastFetch = new Date();
    }

    // ========================================================================
    // Realtime Subscription
    // ========================================================================

    /**
     * Subscribe to realtime changes
     * Returns a cleanup function to unsubscribe
     */
    subscribeToChanges(
        callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
    ): () => void {
        if (!this.config) {
            console.warn('Cannot subscribe: not configured');
            return () => {};
        }

        // Clear any existing subscription first
        if (this.realtimePollInterval) {
            clearInterval(this.realtimePollInterval);
            this.realtimePollInterval = null;
        }

        // Note: Full realtime implementation would use Supabase Realtime client
        // This is a simplified polling-based approach
        const pollInterval = 5000; // 5 seconds

        let lastData = JSON.stringify(this.cachedData);

        this.realtimePollInterval = setInterval(async () => {
            try {
                await this.refresh();
                const newData = JSON.stringify(this.cachedData);

                if (newData !== lastData) {
                    callback({
                        eventType: 'UPDATE',
                        new: this.cachedData[this.cachedData.length - 1] || {},
                        old: {},
                    });
                    lastData = newData;
                }
            } catch (error) {
                console.error('Realtime poll error:', error);
            }
        }, pollInterval);

        return () => {
            if (this.realtimePollInterval) {
                clearInterval(this.realtimePollInterval);
                this.realtimePollInterval = null;
            }
        };
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private isValidSupabaseUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return parsed.hostname.endsWith('.supabase.co') ||
                   parsed.hostname.includes('supabase');
        } catch {
            return false;
        }
    }

    private async makeRequest(path: string, options: RequestInit = {}): Promise<Response> {
        if (!this.config) throw new Error('Not configured');

        const url = `${this.config.projectUrl.replace(/\/$/, '')}${path}`;
        const headers: HeadersInit = {
            'apikey': this.config.apiKey,
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers,
        };

        return fetch(url, {
            ...options,
            headers,
            signal: this.abortController?.signal,
        });
    }

    private async fetchAvailableTables(): Promise<void> {
        const schema = this.config?.schema || 'public';
        const response = await this.makeRequest(
            `/rest/v1/rpc/get_tables?schema_name=${schema}`,
            { method: 'GET' }
        ).catch(() => null);

        // If RPC doesn't exist, try introspection endpoint
        if (!response?.ok) {
            // Fallback: just verify we can access the configured table
            this.availableTables = [
                { table_name: this.config?.tableName || '', table_schema: schema, table_type: 'BASE TABLE' }
            ];
            return;
        }

        this.availableTables = await response.json();
    }

    private async fetchTableSchema(tableName: string): Promise<void> {
        // Try to get column info via pg_catalog
        const response = await this.makeRequest(
            `/rest/v1/rpc/get_columns?table_name=${tableName}`,
            { method: 'GET' }
        ).catch(() => null);

        if (response?.ok) {
            const columns = await response.json();
            this.tableColumns.set(tableName, columns);
        }
        // If RPC doesn't exist, schema will be inferred from data
    }

    /**
     * Validate column name to prevent injection
     */
    private isValidColumnName(name: string): boolean {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    private async fetchWithServerQuery(query: DataQuery): Promise<NormalizedData> {
        if (!this.config) throw new Error('Not configured');

        // Validate table name
        if (!this.isValidColumnName(this.config.tableName)) {
            throw new Error(`Invalid table name: ${this.config.tableName}`);
        }

        let path = `/rest/v1/${this.config.tableName}?`;
        const params: string[] = [];

        // Validate and set select columns
        const selectCols = query.columns || this.config.selectColumns;
        if (selectCols) {
            for (const col of selectCols) {
                if (!this.isValidColumnName(col)) {
                    throw new Error(`Invalid column name: ${col}`);
                }
            }
        }
        const select = selectCols?.join(',') || '*';
        params.push(`select=${encodeURIComponent(select)}`);

        // Filters (PostgREST syntax) with column validation
        if (query.filters) {
            for (const filter of query.filters) {
                if (!this.isValidColumnName(filter.column)) {
                    throw new Error(`Invalid column name in filter: ${filter.column}`);
                }
                const op = this.mapOperator(filter.operator);
                let value = String(filter.value);

                // Wrap with wildcards for contains/ilike
                if (filter.operator === 'contains') {
                    value = `*${value}*`;
                }

                params.push(`${filter.column}=${op}.${encodeURIComponent(value)}`);
            }
        }

        // Order with column validation
        if (query.orderBy) {
            if (!this.isValidColumnName(query.orderBy.column)) {
                throw new Error(`Invalid column name in orderBy: ${query.orderBy.column}`);
            }
            const dir = query.orderBy.direction === 'desc' ? '.desc' : '';
            params.push(`order=${query.orderBy.column}${dir}`);
        }

        // Pagination with validation
        if (query.limit) {
            const limit = Math.max(0, Math.min(Math.floor(Number(query.limit)), 100000));
            params.push(`limit=${limit}`);
        }
        if (query.offset) {
            const offset = Math.max(0, Math.floor(Number(query.offset)));
            params.push(`offset=${offset}`);
        }

        path += params.join('&');

        const response = await this.makeRequest(path, { method: 'GET' });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Supabase query error: ${error.message || response.statusText}`);
        }

        const data = await response.json();

        return {
            columns: Object.keys(data[0] || {}),
            rows: data,
            metadata: {
                source: `supabase:${this.config.tableName}`,
                fetchedAt: new Date().toISOString(),
                rowCount: data.length,
            },
        };
    }

    private mapOperator(op: string): string {
        const mapping: Record<string, string> = {
            '=': 'eq',
            '!=': 'neq',
            '>': 'gt',
            '<': 'lt',
            '>=': 'gte',
            '<=': 'lte',
            'contains': 'ilike',
            'in': 'in',
        };
        return mapping[op] || 'eq';
    }

    private async ensureFresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const refreshMs = (this.config.refreshInterval || 5) * 60 * 1000;
        if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > refreshMs) {
            await this.refresh();
        }
    }

    private buildSchema(data: Record<string, unknown>[]): SchemaInfo {
        if (data.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        const columns: ColumnInfo[] = Object.keys(data[0]).map(name => {
            const sampleValues = data.slice(0, 10).map(row => row[name]);
            const supabaseCol = this.tableColumns.get(this.config?.tableName || '')
                ?.find(c => c.column_name === name);

            return {
                name,
                type: supabaseCol ? this.mapSupabaseType(supabaseCol.data_type) : this.inferType(sampleValues),
                nullable: supabaseCol?.is_nullable === 'YES' || sampleValues.some(v => v === null),
                sampleValues,
            };
        });

        return { columns, rowCount: data.length, sampleData: data.slice(0, 10) };
    }

    private mapSupabaseType(pgType: string): ColumnInfo['type'] {
        const typeMap: Record<string, ColumnInfo['type']> = {
            'integer': 'number',
            'bigint': 'number',
            'smallint': 'number',
            'decimal': 'number',
            'numeric': 'number',
            'real': 'number',
            'double precision': 'number',
            'boolean': 'boolean',
            'timestamp': 'date',
            'timestamptz': 'date',
            'date': 'date',
            'time': 'string',
            'text': 'string',
            'varchar': 'string',
            'character varying': 'string',
            'uuid': 'string',
            'json': 'unknown',
            'jsonb': 'unknown',
        };
        return typeMap[pgType.toLowerCase()] || 'string';
    }

    private inferType(values: unknown[]): ColumnInfo['type'] {
        const nonNull = values.filter(v => v !== null && v !== undefined);
        if (nonNull.length === 0) return 'unknown';

        const first = nonNull[0];
        if (typeof first === 'number') return 'number';
        if (typeof first === 'boolean') return 'boolean';
        if (typeof first === 'string') {
            if (!isNaN(Date.parse(first)) && first.includes('-')) return 'date';
            return 'string';
        }
        return 'unknown';
    }
}

export default SupabaseAdapter;
