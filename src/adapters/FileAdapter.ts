/**
 * File Adapter - CSV/JSON Upload
 * Handles local file uploads and parsing
 */

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
                        case 'contains': return String(value).includes(String(filter.value));
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
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: Record<string, unknown> = {};
            headers.forEach((header, i) => {
                row[header] = this.parseValue(values[i]);
            });
            return row;
        });
    }

    private parseJSON(content: string): Record<string, unknown>[] {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [parsed];
    }

    private parseValue(value: string): unknown {
        if (value === '' || value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(Number(value))) return Number(value);
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
