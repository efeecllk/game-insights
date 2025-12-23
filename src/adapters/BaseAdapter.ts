/**
 * Base Adapter Interface
 * All data source adapters implement this interface
 */

export interface AdapterConfig {
    name: string;
    type: AdapterType;
}

export type AdapterType = 'file' | 'api' | 'database' | 'cloud';

export interface SchemaInfo {
    columns: ColumnInfo[];
    rowCount: number;
    sampleData: Record<string, unknown>[];
}

export interface ColumnInfo {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
    nullable: boolean;
    sampleValues: unknown[];
}

export interface DataQuery {
    columns?: string[];
    filters?: QueryFilter[];
    limit?: number;
    offset?: number;
    orderBy?: { column: string; direction: 'asc' | 'desc' };
}

export interface QueryFilter {
    column: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
    value: unknown;
}

export interface NormalizedData {
    columns: string[];
    rows: Record<string, unknown>[];
    metadata: {
        source: string;
        fetchedAt: string;
        rowCount: number;
    };
}

export interface AdapterCapabilities {
    supportsRealtime: boolean;
    supportsFiltering: boolean;
    supportsAggregation: boolean;
    maxRowsPerQuery: number;
}

/**
 * Abstract Base Adapter
 */
export abstract class BaseAdapter {
    abstract name: string;
    abstract type: AdapterType;

    abstract connect(config: AdapterConfig): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract testConnection(): Promise<boolean>;

    abstract fetchSchema(): Promise<SchemaInfo>;
    abstract fetchData(query?: DataQuery): Promise<NormalizedData>;

    abstract getCapabilities(): AdapterCapabilities;
}

/**
 * Adapter Registry
 */
class AdapterRegistry {
    private adapters: Map<string, BaseAdapter> = new Map();

    register(adapter: BaseAdapter): void {
        this.adapters.set(adapter.name, adapter);
    }

    get(name: string): BaseAdapter | undefined {
        return this.adapters.get(name);
    }

    getAll(): BaseAdapter[] {
        return Array.from(this.adapters.values());
    }

    getByType(type: AdapterType): BaseAdapter[] {
        return this.getAll().filter(a => a.type === type);
    }
}

export const adapterRegistry = new AdapterRegistry();
