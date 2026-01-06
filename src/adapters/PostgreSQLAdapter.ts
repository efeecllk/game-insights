/**
 * PostgreSQL Adapter
 * Connects to PostgreSQL databases via a backend proxy
 * Phase 3: One-Click Integrations
 *
 * Note: Direct browser-to-PostgreSQL connections are not possible due to
 * browser security restrictions. This adapter communicates with a backend
 * proxy service that handles the actual database connection.
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

export interface PostgreSQLConfig extends AdapterConfig {
    // Connection via proxy service
    proxyUrl: string;

    // Connection details (encrypted and sent to proxy)
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    schema?: string;

    // Query options
    tableName?: string;
    customQuery?: string;
    refreshInterval?: number; // minutes
}

interface PostgreSQLTableInfo {
    table_name: string;
    table_schema: string;
    table_type: string;
    row_count?: number;
}

interface PostgreSQLColumnInfo {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    character_maximum_length: number | null;
}

interface ProxyResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    rowCount?: number;
    duration?: number;
}

// ============================================================================
// Adapter Implementation
// ============================================================================

export class PostgreSQLAdapter extends BaseAdapter {
    name = 'postgresql';
    type = 'database' as const;

    private config: PostgreSQLConfig | null = null;
    private connectionId: string | null = null;
    private cachedData: Record<string, unknown>[] = [];
    private schema: SchemaInfo | null = null;
    private lastFetch: Date | null = null;
    private availableTables: PostgreSQLTableInfo[] = [];
    private tableColumns: Map<string, PostgreSQLColumnInfo[]> = new Map();
    private abortController: AbortController | null = null;

    // ========================================================================
    // Lifecycle Methods
    // ========================================================================

    async connect(config: PostgreSQLConfig): Promise<void> {
        this.config = config;
        this.abortController = new AbortController();

        // Establish connection through proxy
        const response = await this.proxyRequest<{ connectionId: string }>('connect', {
            host: config.host,
            port: config.port,
            database: config.database,
            username: config.username,
            password: config.password,
            ssl: config.ssl,
        });

        if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to connect to PostgreSQL');
        }

        this.connectionId = response.data.connectionId;

        // Fetch available tables
        await this.fetchAvailableTables();

        // Fetch schema for configured table
        if (config.tableName) {
            await this.fetchTableSchema(config.tableName);
        }

        // Initial data fetch
        await this.refresh();
    }

    async disconnect(): Promise<void> {
        // Abort any pending requests
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        if (this.connectionId && this.config) {
            await this.proxyRequest('disconnect', {
                connectionId: this.connectionId,
            }).catch(() => {}); // Ignore disconnect errors
        }

        this.config = null;
        this.connectionId = null;
        this.cachedData = [];
        this.schema = null;
        this.lastFetch = null;
        this.availableTables = [];
        this.tableColumns.clear();
    }

    async testConnection(): Promise<boolean> {
        if (!this.config) return false;

        try {
            const response = await this.proxyRequest<{ connected: boolean }>('test', {
                host: this.config.host,
                port: this.config.port,
                database: this.config.database,
                username: this.config.username,
                password: this.config.password,
                ssl: this.config.ssl,
            });
            return response.success && response.data?.connected === true;
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
        if (query?.filters || query?.orderBy || query?.limit) {
            return this.executeQuery(this.buildSelectQuery(query));
        }

        await this.ensureFresh();
        return {
            columns: Object.keys(this.cachedData[0] || {}),
            rows: this.cachedData,
            metadata: {
                source: `postgresql:${this.config?.database || 'unknown'}/${this.config?.tableName || 'query'}`,
                fetchedAt: this.lastFetch?.toISOString() || new Date().toISOString(),
                rowCount: this.cachedData.length,
            },
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: false, // Would require websocket connection to proxy
            supportsFiltering: true,
            supportsAggregation: true,
            maxRowsPerQuery: 100000,
        };
    }

    // ========================================================================
    // Public Query Methods
    // ========================================================================

    /**
     * Get list of available tables
     */
    getAvailableTables(): PostgreSQLTableInfo[] {
        return this.availableTables;
    }

    /**
     * Get column info for a specific table
     */
    getTableColumns(tableName: string): PostgreSQLColumnInfo[] {
        return this.tableColumns.get(tableName) || [];
    }

    /**
     * Execute a custom SQL query (read-only)
     */
    async executeQuery(sql: string): Promise<NormalizedData> {
        if (!this.config || !this.connectionId) {
            throw new Error('Not connected');
        }

        // Safety check: only allow SELECT queries
        const normalizedSql = sql.trim().toUpperCase();
        if (!normalizedSql.startsWith('SELECT') && !normalizedSql.startsWith('WITH')) {
            throw new Error('Only SELECT queries are allowed for safety');
        }

        const response = await this.proxyRequest<Record<string, unknown>[]>('query', {
            connectionId: this.connectionId,
            sql,
        });

        if (!response.success) {
            throw new Error(response.error || 'Query failed');
        }

        const data = response.data || [];

        return {
            columns: Object.keys(data[0] || {}),
            rows: data,
            metadata: {
                source: `postgresql:${this.config.database}`,
                fetchedAt: new Date().toISOString(),
                rowCount: data.length,
            },
        };
    }

    /**
     * Force refresh data
     */
    async refresh(): Promise<void> {
        if (!this.config || !this.connectionId) {
            throw new Error('Not connected');
        }

        let sql: string;

        if (this.config.customQuery) {
            sql = this.config.customQuery;
        } else if (this.config.tableName) {
            const schemaPrefix = this.config.schema ? `"${this.config.schema}".` : '';
            sql = `SELECT * FROM ${schemaPrefix}"${this.config.tableName}" LIMIT 10000`;
        } else {
            throw new Error('No table or query configured');
        }

        const result = await this.executeQuery(sql);
        this.cachedData = result.rows;
        this.schema = this.buildSchema(this.cachedData);
        this.lastFetch = new Date();
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private async proxyRequest<T>(action: string, params: Record<string, unknown>): Promise<ProxyResponse<T>> {
        if (!this.config) {
            throw new Error('Not configured');
        }

        const response = await fetch(`${this.config.proxyUrl}/api/postgres/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
            signal: this.abortController?.signal,
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Proxy error: ${response.status} ${response.statusText}`,
            };
        }

        return response.json();
    }

    /**
     * Validate SQL identifier (schema name, table name, column name)
     * Only allows alphanumeric characters and underscores
     */
    private isValidIdentifier(name: string): boolean {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    /**
     * Escape LIKE pattern special characters
     */
    private escapeLikePattern(value: string): string {
        return value
            .replace(/\\/g, '\\\\')
            .replace(/%/g, '\\%')
            .replace(/_/g, '\\_')
            .replace(/'/g, "''");
    }

    private async fetchAvailableTables(): Promise<void> {
        if (!this.connectionId) return;

        const schema = this.config?.schema || 'public';

        // Validate schema name to prevent SQL injection
        if (!this.isValidIdentifier(schema)) {
            throw new Error(`Invalid schema name: ${schema}`);
        }

        const response = await this.proxyRequest<PostgreSQLTableInfo[]>('query', {
            connectionId: this.connectionId,
            sql: `
                SELECT
                    table_name,
                    table_schema,
                    table_type
                FROM information_schema.tables
                WHERE table_schema = $1
                AND table_type IN ('BASE TABLE', 'VIEW')
                ORDER BY table_name
            `,
            params: [schema],
        });

        if (response.success && response.data) {
            this.availableTables = response.data;
        }
    }

    private async fetchTableSchema(tableName: string): Promise<void> {
        if (!this.connectionId) return;

        const schema = this.config?.schema || 'public';

        // Validate identifiers to prevent SQL injection
        if (!this.isValidIdentifier(schema)) {
            throw new Error(`Invalid schema name: ${schema}`);
        }
        if (!this.isValidIdentifier(tableName)) {
            throw new Error(`Invalid table name: ${tableName}`);
        }

        const response = await this.proxyRequest<PostgreSQLColumnInfo[]>('query', {
            connectionId: this.connectionId,
            sql: `
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = $1
                AND table_name = $2
                ORDER BY ordinal_position
            `,
            params: [schema, tableName],
        });

        if (response.success && response.data) {
            this.tableColumns.set(tableName, response.data);
        }
    }

    private buildSelectQuery(query: DataQuery): string {
        if (!this.config?.tableName) {
            throw new Error('No table configured for query building');
        }

        // Validate table and schema names
        if (this.config.schema && !this.isValidIdentifier(this.config.schema)) {
            throw new Error(`Invalid schema name: ${this.config.schema}`);
        }
        if (!this.isValidIdentifier(this.config.tableName)) {
            throw new Error(`Invalid table name: ${this.config.tableName}`);
        }

        const schemaPrefix = this.config.schema ? `"${this.config.schema}".` : '';
        const table = `${schemaPrefix}"${this.config.tableName}"`;

        // Validate and quote column names
        let columns = '*';
        if (query.columns && query.columns.length > 0) {
            for (const c of query.columns) {
                if (!this.isValidIdentifier(c)) {
                    throw new Error(`Invalid column name: ${c}`);
                }
            }
            columns = query.columns.map(c => `"${c}"`).join(', ');
        }

        let sql = `SELECT ${columns} FROM ${table}`;

        // WHERE clause with validated column names
        if (query.filters && query.filters.length > 0) {
            const conditions = query.filters.map(f => {
                // Validate column name
                if (!this.isValidIdentifier(f.column)) {
                    throw new Error(`Invalid column name in filter: ${f.column}`);
                }
                const col = `"${f.column}"`;
                const val = typeof f.value === 'string' ? `'${f.value.replace(/'/g, "''")}'` : f.value;

                switch (f.operator) {
                    case '=': return `${col} = ${val}`;
                    case '!=': return `${col} != ${val}`;
                    case '>': return `${col} > ${val}`;
                    case '<': return `${col} < ${val}`;
                    case '>=': return `${col} >= ${val}`;
                    case '<=': return `${col} <= ${val}`;
                    case 'contains':
                        // Use proper LIKE escaping
                        return `${col} ILIKE '%${this.escapeLikePattern(String(f.value))}%' ESCAPE '\\'`;
                    case 'in': {
                        const values = (f.value as unknown[])
                            .map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v)
                            .join(', ');
                        return `${col} IN (${values})`;
                    }
                    default: return `${col} = ${val}`;
                }
            });
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        // ORDER BY with validated column name
        if (query.orderBy) {
            if (!this.isValidIdentifier(query.orderBy.column)) {
                throw new Error(`Invalid column name in orderBy: ${query.orderBy.column}`);
            }
            const dir = query.orderBy.direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            sql += ` ORDER BY "${query.orderBy.column}" ${dir}`;
        }

        // LIMIT and OFFSET with validation
        if (query.limit) {
            const limit = Math.max(0, Math.min(Math.floor(Number(query.limit)), 100000));
            sql += ` LIMIT ${limit}`;
        }
        if (query.offset) {
            const offset = Math.max(0, Math.floor(Number(query.offset)));
            sql += ` OFFSET ${offset}`;
        }

        return sql;
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

        const tableName = this.config?.tableName || '';
        const columns: ColumnInfo[] = Object.keys(data[0]).map(name => {
            const sampleValues = data.slice(0, 10).map(row => row[name]);
            const pgCol = this.tableColumns.get(tableName)?.find(c => c.column_name === name);

            return {
                name,
                type: pgCol ? this.mapPostgresType(pgCol.data_type) : this.inferType(sampleValues),
                nullable: pgCol?.is_nullable === 'YES' || sampleValues.some(v => v === null),
                sampleValues,
            };
        });

        return { columns, rowCount: data.length, sampleData: data.slice(0, 10) };
    }

    private mapPostgresType(pgType: string): ColumnInfo['type'] {
        const typeMap: Record<string, ColumnInfo['type']> = {
            'integer': 'number',
            'bigint': 'number',
            'smallint': 'number',
            'decimal': 'number',
            'numeric': 'number',
            'real': 'number',
            'double precision': 'number',
            'serial': 'number',
            'bigserial': 'number',
            'boolean': 'boolean',
            'bool': 'boolean',
            'timestamp without time zone': 'date',
            'timestamp with time zone': 'date',
            'date': 'date',
            'time': 'string',
            'text': 'string',
            'character varying': 'string',
            'varchar': 'string',
            'char': 'string',
            'uuid': 'string',
            'json': 'unknown',
            'jsonb': 'unknown',
            'array': 'unknown',
        };

        const normalized = pgType.toLowerCase();
        for (const [key, value] of Object.entries(typeMap)) {
            if (normalized.includes(key)) return value;
        }
        return 'string';
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

export default PostgreSQLAdapter;
