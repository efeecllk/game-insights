/**
 * File Adapter - CSV/JSON Upload
 * Handles local file uploads and parsing
 */

import Papa from 'papaparse';
import { BaseAdapter, AdapterConfig, SchemaInfo, NormalizedData, DataQuery, AdapterCapabilities, ColumnInfo } from './BaseAdapter';

interface FileAdapterConfig extends AdapterConfig {
    file: File;
    fileType: 'csv' | 'json';
}

export class FileAdapter extends BaseAdapter {
    name = 'file';
    type = 'file' as const;

    private data: Record<string, unknown>[] = [];
    private schema: SchemaInfo | null = null;

    async connect(config: FileAdapterConfig): Promise<void> {
        const content = await this.readFile(config.file);

        if (config.fileType === 'csv') {
            this.data = this.parseCSV(content);
        } else {
            this.data = this.parseJSON(content);
        }

        this.schema = this.analyzeSchema(this.data);
    }

    async disconnect(): Promise<void> {
        this.data = [];
        this.schema = null;
    }

    async testConnection(): Promise<boolean> {
        return this.data.length > 0;
    }

    async fetchSchema(): Promise<SchemaInfo> {
        if (!this.schema) {
            throw new Error('Not connected. Call connect() first.');
        }
        return this.schema;
    }

    async fetchData(query?: DataQuery): Promise<NormalizedData> {
        let result = [...this.data];

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
                        case '>=': return (value as number) >= (filter.value as number);
                        case '<=': return (value as number) <= (filter.value as number);
                        case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                        case 'in': return (filter.value as unknown[]).includes(value);
                        default: return true;
                    }
                });
            });
        }

        // Apply limit/offset
        if (query?.offset) {
            result = result.slice(query.offset);
        }
        if (query?.limit) {
            result = result.slice(0, query.limit);
        }

        // Select columns
        if (query?.columns) {
            result = result.map(row => {
                const filtered: Record<string, unknown> = {};
                query.columns!.forEach(col => {
                    filtered[col] = row[col];
                });
                return filtered;
            });
        }

        return {
            columns: query?.columns || Object.keys(this.data[0] || {}),
            rows: result,
            metadata: {
                source: 'file',
                fetchedAt: new Date().toISOString(),
                rowCount: result.length,
            }
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: false,
            supportsFiltering: true,
            supportsAggregation: false,
            maxRowsPerQuery: 100000,
        };
    }

    // Private methods
    private readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    private parseCSV(content: string): Record<string, unknown>[] {
        const result = Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
        });

        return (result.data as Record<string, string>[]).map(row => {
            const parsed: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(row)) {
                parsed[key.trim()] = this.parseValue(value);
            }
            return parsed;
        });
    }

    private parseJSON(content: string): Record<string, unknown>[] {
        let parsed: unknown;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
        }

        if (Array.isArray(parsed)) {
            const objects = parsed.filter(
                (item): item is Record<string, unknown> => typeof item === 'object' && item !== null
            );
            if (objects.length === 0) {
                throw new Error('JSON array contains no valid objects');
            }
            return objects;
        }

        if (typeof parsed === 'object' && parsed !== null) {
            return [parsed as Record<string, unknown>];
        }

        throw new Error('JSON must be an array of objects or a single object');
    }

    private parseValue(value: string): unknown {
        if (value === '' || value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        const num = Number(value);
        if (!isNaN(num) && isFinite(num)) return num;
        return value;
    }

    private analyzeSchema(data: Record<string, unknown>[]): SchemaInfo {
        if (data.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        const columns: ColumnInfo[] = Object.keys(data[0]).map(name => {
            const sampleValues = data.slice(0, 10).map(row => row[name]);
            const type = this.inferType(sampleValues);
            const nullable = sampleValues.some(v => v === null || v === undefined);

            return { name, type, nullable, sampleValues };
        });

        return {
            columns,
            rowCount: data.length,
            sampleData: data.slice(0, 10),
        };
    }

    private inferType(values: unknown[]): ColumnInfo['type'] {
        const nonNull = values.filter(v => v !== null && v !== undefined);
        if (nonNull.length === 0) return 'unknown';

        const first = nonNull[0];
        if (typeof first === 'number') return 'number';
        if (typeof first === 'boolean') return 'boolean';
        if (typeof first === 'string') {
            // Check if date
            if (!isNaN(Date.parse(first)) && first.includes('-')) return 'date';
            return 'string';
        }
        return 'unknown';
    }
}

export default FileAdapter;
