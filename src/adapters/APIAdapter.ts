/**
 * API Adapter - REST API Integration
 * Connects to external REST APIs for data fetching
 */

import { BaseAdapter, AdapterConfig, SchemaInfo, NormalizedData, DataQuery, AdapterCapabilities, ColumnInfo } from './BaseAdapter';

export interface APIAdapterConfig extends AdapterConfig {
    endpoint: string;
    authType: 'none' | 'bearer' | 'apikey' | 'basic';
    authValue?: string;
    apiKeyHeader?: string;  // For API key auth
    headers?: Record<string, string>;
    refreshInterval?: number; // minutes
    dataPath?: string; // JSON path to data array, e.g., "data.results"
}

export class APIAdapter extends BaseAdapter {
    name = 'api';
    type = 'api' as const;

    private config: APIAdapterConfig | null = null;
    private cachedData: Record<string, unknown>[] = [];
    private schema: SchemaInfo | null = null;
    private lastFetch: Date | null = null;

    async connect(config: APIAdapterConfig): Promise<void> {
        this.config = config;
        await this.refresh();
    }

    async disconnect(): Promise<void> {
        this.config = null;
        this.cachedData = [];
        this.schema = null;
        this.lastFetch = null;
    }

    async testConnection(): Promise<boolean> {
        if (!this.config) return false;

        try {
            const response = await fetch(this.config.endpoint, {
                method: 'HEAD',
                headers: this.buildHeaders(),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async fetchSchema(): Promise<SchemaInfo> {
        await this.ensureFresh();
        if (!this.schema) {
            throw new Error('No schema available. Check connection.');
        }
        return this.schema;
    }

    async fetchData(query?: DataQuery): Promise<NormalizedData> {
        await this.ensureFresh();

        let result = [...this.cachedData];

        // Apply filters
        if (query?.filters) {
            result = result.filter(row => {
                return query.filters!.every(filter => {
                    const value = row[filter.column];
                    switch (filter.operator) {
                        case '=': return value === filter.value;
                        case '!=': return value !== filter.value;
                        case '>': return (value as number) > (filter.value as number);
                        case '<': return (value as number) < (filter.value as number);
                        case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                        case 'in': return (filter.value as unknown[]).includes(value);
                        default: return true;
                    }
                });
            });
        }

        // Apply ordering
        if (query?.orderBy) {
            const { column, direction } = query.orderBy;
            result.sort((a, b) => {
                const aVal = a[column] as string | number;
                const bVal = b[column] as string | number;
                const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return direction === 'desc' ? -cmp : cmp;
            });
        }

        // Apply limit/offset
        if (query?.offset) result = result.slice(query.offset);
        if (query?.limit) result = result.slice(0, query.limit);

        return {
            columns: Object.keys(this.cachedData[0] || {}),
            rows: result,
            metadata: {
                source: this.config?.endpoint || 'api',
                fetchedAt: this.lastFetch?.toISOString() || new Date().toISOString(),
                rowCount: result.length,
            }
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: true,
            supportsFiltering: true,
            supportsAggregation: false,
            maxRowsPerQuery: 10000,
        };
    }

    // Force refresh data from API
    async refresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const response = await fetch(this.config.endpoint, {
            method: 'GET',
            headers: this.buildHeaders(),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        let data = await response.json();

        // Navigate to data path if specified
        if (this.config.dataPath) {
            const paths = this.config.dataPath.split('.');
            for (const path of paths) {
                data = data[path];
            }
        }

        this.cachedData = Array.isArray(data) ? data : [data];
        this.schema = this.analyzeSchema(this.cachedData);
        this.lastFetch = new Date();
    }

    private buildHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...this.config?.headers,
        };

        if (this.config?.authType === 'bearer' && this.config.authValue) {
            headers['Authorization'] = `Bearer ${this.config.authValue}`;
        } else if (this.config?.authType === 'apikey' && this.config.authValue) {
            const headerName = this.config.apiKeyHeader || 'X-API-Key';
            headers[headerName] = this.config.authValue;
        } else if (this.config?.authType === 'basic' && this.config.authValue) {
            headers['Authorization'] = `Basic ${btoa(this.config.authValue)}`;
        }

        return headers;
    }

    private async ensureFresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const refreshMs = (this.config.refreshInterval || 5) * 60 * 1000;
        if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > refreshMs) {
            await this.refresh();
        }
    }

    private analyzeSchema(data: Record<string, unknown>[]): SchemaInfo {
        if (data.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        const columns: ColumnInfo[] = Object.keys(data[0]).map(name => {
            const sampleValues = data.slice(0, 10).map(row => row[name]);
            return {
                name,
                type: this.inferType(sampleValues),
                nullable: sampleValues.some(v => v === null || v === undefined),
                sampleValues,
            };
        });

        return { columns, rowCount: data.length, sampleData: data.slice(0, 10) };
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

export default APIAdapter;
