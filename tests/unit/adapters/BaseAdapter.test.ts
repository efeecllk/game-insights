/**
 * BaseAdapter Unit Tests
 * Tests for base adapter interface and registry
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    BaseAdapter,
    adapterRegistry,
    type AdapterConfig,
    type SchemaInfo,
    type NormalizedData,
    type DataQuery,
    type AdapterCapabilities,
    type AdapterType,
} from '@/adapters/BaseAdapter';

// Mock adapter implementation
class MockAdapter extends BaseAdapter {
    name = 'mock';
    type: AdapterType = 'api';

    private connected = false;
    private mockData: Record<string, unknown>[] = [];

    setMockData(data: Record<string, unknown>[]): void {
        this.mockData = data;
    }

    async connect(_config: AdapterConfig): Promise<void> {
        this.connected = true;
    }

    async disconnect(): Promise<void> {
        this.connected = false;
    }

    async testConnection(): Promise<boolean> {
        return this.connected;
    }

    async fetchSchema(): Promise<SchemaInfo> {
        return {
            columns: [
                { name: 'id', type: 'number', nullable: false, sampleValues: [1, 2, 3] },
                { name: 'name', type: 'string', nullable: false, sampleValues: ['a', 'b', 'c'] },
            ],
            rowCount: this.mockData.length,
            sampleData: this.mockData.slice(0, 5),
        };
    }

    async fetchData(_query?: DataQuery): Promise<NormalizedData> {
        return {
            columns: Object.keys(this.mockData[0] || {}),
            rows: this.mockData,
            metadata: {
                source: 'mock',
                fetchedAt: new Date().toISOString(),
                rowCount: this.mockData.length,
            },
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: false,
            supportsFiltering: true,
            supportsAggregation: false,
            maxRowsPerQuery: 1000,
        };
    }
}

describe('BaseAdapter', () => {
    // =========================================================================
    // Interface Implementation Tests
    // =========================================================================

    describe('abstract implementation', () => {
        it('should allow creating concrete implementations', () => {
            const adapter = new MockAdapter();

            expect(adapter.name).toBe('mock');
            expect(adapter.type).toBe('api');
        });

        it('should implement connect method', async () => {
            const adapter = new MockAdapter();

            await adapter.connect({ name: 'test', type: 'api' });
            const connected = await adapter.testConnection();

            expect(connected).toBe(true);
        });

        it('should implement disconnect method', async () => {
            const adapter = new MockAdapter();

            await adapter.connect({ name: 'test', type: 'api' });
            await adapter.disconnect();
            const connected = await adapter.testConnection();

            expect(connected).toBe(false);
        });

        it('should implement fetchSchema method', async () => {
            const adapter = new MockAdapter();
            adapter.setMockData([{ id: 1, name: 'test' }]);

            const schema = await adapter.fetchSchema();

            expect(schema.columns).toBeDefined();
            expect(schema.rowCount).toBeDefined();
            expect(schema.sampleData).toBeDefined();
        });

        it('should implement fetchData method', async () => {
            const adapter = new MockAdapter();
            adapter.setMockData([{ id: 1, name: 'test' }]);

            const data = await adapter.fetchData();

            expect(data.columns).toBeDefined();
            expect(data.rows).toBeDefined();
            expect(data.metadata).toBeDefined();
        });

        it('should implement getCapabilities method', () => {
            const adapter = new MockAdapter();

            const capabilities = adapter.getCapabilities();

            expect(capabilities.supportsRealtime).toBeDefined();
            expect(capabilities.supportsFiltering).toBeDefined();
            expect(capabilities.supportsAggregation).toBeDefined();
            expect(capabilities.maxRowsPerQuery).toBeDefined();
        });
    });

    // =========================================================================
    // Schema Info Tests
    // =========================================================================

    describe('schema info', () => {
        it('should return column information', async () => {
            const adapter = new MockAdapter();

            const schema = await adapter.fetchSchema();

            expect(schema.columns.length).toBeGreaterThan(0);
            for (const column of schema.columns) {
                expect(column.name).toBeDefined();
                expect(column.type).toBeDefined();
                expect(column.nullable).toBeDefined();
                expect(column.sampleValues).toBeDefined();
            }
        });

        it('should include row count', async () => {
            const adapter = new MockAdapter();
            adapter.setMockData([{ id: 1 }, { id: 2 }, { id: 3 }]);

            const schema = await adapter.fetchSchema();

            expect(schema.rowCount).toBe(3);
        });

        it('should include sample data', async () => {
            const adapter = new MockAdapter();
            adapter.setMockData([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);

            const schema = await adapter.fetchSchema();

            expect(schema.sampleData.length).toBeLessThanOrEqual(5);
        });
    });

    // =========================================================================
    // Normalized Data Tests
    // =========================================================================

    describe('normalized data', () => {
        it('should return columns array', async () => {
            const adapter = new MockAdapter();
            adapter.setMockData([{ id: 1, name: 'test', value: 100 }]);

            const data = await adapter.fetchData();

            expect(data.columns).toContain('id');
            expect(data.columns).toContain('name');
            expect(data.columns).toContain('value');
        });

        it('should return rows', async () => {
            const adapter = new MockAdapter();
            adapter.setMockData([{ id: 1 }, { id: 2 }]);

            const data = await adapter.fetchData();

            expect(data.rows.length).toBe(2);
        });

        it('should include metadata', async () => {
            const adapter = new MockAdapter();
            adapter.setMockData([{ id: 1 }]);

            const data = await adapter.fetchData();

            expect(data.metadata.source).toBeDefined();
            expect(data.metadata.fetchedAt).toBeDefined();
            expect(data.metadata.rowCount).toBe(1);
        });
    });
});

describe('AdapterRegistry', () => {
    beforeEach(() => {
        // Clear registry by getting all and checking if mock exists
        // Note: In a real scenario, we'd want a clear method on the registry
    });

    // =========================================================================
    // Registration Tests
    // =========================================================================

    describe('register', () => {
        it('should register an adapter', () => {
            const adapter = new MockAdapter();
            adapter.name = 'test-registry-adapter';

            adapterRegistry.register(adapter);

            expect(adapterRegistry.get('test-registry-adapter')).toBe(adapter);
        });

        it('should allow multiple adapters', () => {
            const adapter1 = new MockAdapter();
            adapter1.name = 'adapter-1';

            const adapter2 = new MockAdapter();
            adapter2.name = 'adapter-2';

            adapterRegistry.register(adapter1);
            adapterRegistry.register(adapter2);

            expect(adapterRegistry.get('adapter-1')).toBe(adapter1);
            expect(adapterRegistry.get('adapter-2')).toBe(adapter2);
        });
    });

    // =========================================================================
    // Get Tests
    // =========================================================================

    describe('get', () => {
        it('should return adapter by name', () => {
            const adapter = new MockAdapter();
            adapter.name = 'get-test-adapter';
            adapterRegistry.register(adapter);

            const result = adapterRegistry.get('get-test-adapter');

            expect(result).toBe(adapter);
        });

        it('should return undefined for unknown name', () => {
            const result = adapterRegistry.get('non-existent-adapter-xyz');

            expect(result).toBeUndefined();
        });
    });

    // =========================================================================
    // GetAll Tests
    // =========================================================================

    describe('getAll', () => {
        it('should return all registered adapters', () => {
            const adapters = adapterRegistry.getAll();

            expect(Array.isArray(adapters)).toBe(true);
        });
    });

    // =========================================================================
    // GetByType Tests
    // =========================================================================

    describe('getByType', () => {
        it('should filter adapters by type', () => {
            const apiAdapter = new MockAdapter();
            apiAdapter.name = 'type-api-adapter';
            apiAdapter.type = 'api';

            const fileAdapter = new MockAdapter();
            fileAdapter.name = 'type-file-adapter';
            fileAdapter.type = 'file';

            adapterRegistry.register(apiAdapter);
            adapterRegistry.register(fileAdapter);

            const apiAdapters = adapterRegistry.getByType('api');

            expect(apiAdapters.some(a => a.name === 'type-api-adapter')).toBe(true);
        });

        it('should return empty array for unknown type', () => {
            // No cloud adapters registered in this test
            const cloudAdapters = adapterRegistry.getByType('cloud');

            expect(Array.isArray(cloudAdapters)).toBe(true);
        });
    });
});

describe('Type Definitions', () => {
    // =========================================================================
    // AdapterConfig Tests
    // =========================================================================

    describe('AdapterConfig', () => {
        it('should accept valid config', () => {
            const config: AdapterConfig = {
                name: 'test',
                type: 'api',
            };

            expect(config.name).toBe('test');
            expect(config.type).toBe('api');
        });
    });

    // =========================================================================
    // DataQuery Tests
    // =========================================================================

    describe('DataQuery', () => {
        it('should accept query with columns', () => {
            const query: DataQuery = {
                columns: ['id', 'name'],
            };

            expect(query.columns).toContain('id');
        });

        it('should accept query with filters', () => {
            const query: DataQuery = {
                filters: [
                    { column: 'status', operator: '=', value: 'active' },
                ],
            };

            expect(query.filters?.length).toBe(1);
        });

        it('should accept query with pagination', () => {
            const query: DataQuery = {
                limit: 100,
                offset: 50,
            };

            expect(query.limit).toBe(100);
            expect(query.offset).toBe(50);
        });

        it('should accept query with ordering', () => {
            const query: DataQuery = {
                orderBy: { column: 'createdAt', direction: 'desc' },
            };

            expect(query.orderBy?.column).toBe('createdAt');
            expect(query.orderBy?.direction).toBe('desc');
        });
    });
});
