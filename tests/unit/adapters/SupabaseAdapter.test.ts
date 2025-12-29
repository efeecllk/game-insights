/**
 * SupabaseAdapter Unit Tests
 * Tests for Supabase database adapter including connection, schema, and data fetching
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Restore the real URL class - the global setup mocks it which breaks URL validation
// This needs to be done before importing the adapter
const NativeURL = class URL {
    hash: string = '';
    host: string = '';
    hostname: string = '';
    href: string = '';
    origin: string = '';
    password: string = '';
    pathname: string = '';
    port: string = '';
    protocol: string = '';
    search: string = '';
    searchParams: URLSearchParams = new URLSearchParams();
    username: string = '';

    constructor(url: string, base?: string) {
        const fullUrl = base ? new URL(url, base).href : url;

        // Simple URL parsing for tests
        // eslint-disable-next-line security/detect-unsafe-regex
        const match = fullUrl.match(/^(https?:)\/\/([^/:]+)(?::(\d+))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
        if (!match) throw new TypeError(`Invalid URL: ${url}`);

        this.protocol = match[1];
        this.hostname = match[2];
        this.host = match[3] ? `${match[2]}:${match[3]}` : match[2];
        this.port = match[3] || '';
        this.pathname = match[4] || '/';
        this.search = match[5] || '';
        this.hash = match[6] || '';
        this.origin = `${this.protocol}//${this.host}`;
        this.href = fullUrl;
    }

    toString() { return this.href; }
    toJSON() { return this.href; }

    static createObjectURL = vi.fn(() => 'mock-url');
    static revokeObjectURL = vi.fn();
};

vi.stubGlobal('URL', NativeURL);

import { SupabaseAdapter, SupabaseConfig } from '@/adapters/SupabaseAdapter';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SupabaseAdapter', () => {
    let adapter: SupabaseAdapter;
    let validConfig: SupabaseConfig;

    /**
     * Helper to mock a successful connection sequence
     * Supabase connect() requires: tables -> columns -> data
     */
    const mockSuccessfulConnection = (
        tableData: Record<string, unknown>[] = [{ id: 1, name: 'test' }],
        tableName = 'game_events'
    ) => {
        // Mock tables fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { table_name: tableName, table_schema: 'public', table_type: 'BASE TABLE' },
            ],
        });

        // Mock columns fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
                { column_name: 'name', data_type: 'varchar', is_nullable: 'YES', column_default: null },
            ],
        });

        // Mock data fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => tableData,
        });
    };

    beforeEach(() => {
        adapter = new SupabaseAdapter();
        validConfig = {
            name: 'test-supabase',
            type: 'database',
            projectUrl: 'https://testproject.supabase.co',
            apiKey: 'test-api-key-123',
            tableName: 'game_events',
            schema: 'public',
        };
        // Reset and clear all mocks to ensure clean state
        vi.resetAllMocks();
    });

    afterEach(async () => {
        await adapter.disconnect();
    });

    // =========================================================================
    // Basic Properties Tests
    // =========================================================================

    describe('basic properties', () => {
        it('should have correct name', () => {
            expect(adapter.name).toBe('supabase');
        });

        it('should have correct type', () => {
            expect(adapter.type).toBe('database');
        });

        it('should return correct capabilities', () => {
            const capabilities = adapter.getCapabilities();
            expect(capabilities.supportsRealtime).toBe(true);
            expect(capabilities.supportsFiltering).toBe(true);
            expect(capabilities.supportsAggregation).toBe(true);
            expect(capabilities.maxRowsPerQuery).toBe(100000);
        });
    });

    // =========================================================================
    // Connection Tests
    // =========================================================================

    describe('connect', () => {
        it('should connect successfully with valid config', async () => {
            mockSuccessfulConnection();
            await expect(adapter.connect(validConfig)).resolves.not.toThrow();
        });

        it('should throw error for invalid Supabase URL', async () => {
            const invalidConfig = {
                ...validConfig,
                projectUrl: 'https://invalid-url.com',
            };

            await expect(adapter.connect(invalidConfig)).rejects.toThrow(
                'Invalid Supabase project URL'
            );
        });

        it('should throw error when table does not exist', async () => {
            // Mock tables fetch - return different table
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { table_name: 'other_table', table_schema: 'public', table_type: 'BASE TABLE' },
                ],
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow(
                'Table "game_events" not found'
            );
        });

        it('should accept URL containing supabase in hostname', async () => {
            const config = {
                ...validConfig,
                projectUrl: 'https://my-instance.supabase.co',
            };

            mockSuccessfulConnection();

            await expect(adapter.connect(config)).resolves.not.toThrow();
        });

        it('should accept URL with supabase in path', async () => {
            const config = {
                ...validConfig,
                projectUrl: 'https://mysupabaseproxy.example.co',
            };

            mockSuccessfulConnection();

            await expect(adapter.connect(config)).resolves.not.toThrow();
        });
    });

    describe('disconnect', () => {
        it('should disconnect and clear state', async () => {
            mockSuccessfulConnection();
            await adapter.connect(validConfig);

            await adapter.disconnect();

            // After disconnect, testConnection should fail
            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });

        it('should clear realtime polling on disconnect', async () => {
            const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

            mockSuccessfulConnection();
            await adapter.connect(validConfig);

            // Subscribe to create polling
            const unsubscribe = adapter.subscribeToChanges(() => {});

            await adapter.disconnect();

            expect(clearIntervalSpy).toHaveBeenCalled();
            unsubscribe(); // Clean up
        });
    });

    describe('testConnection', () => {
        it('should return true when connection is valid', async () => {
            mockSuccessfulConnection();
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({ ok: true });

            const result = await adapter.testConnection();
            expect(result).toBe(true);
        });

        it('should return false when not configured', async () => {
            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });

        it('should return false when request fails', async () => {
            mockSuccessfulConnection();
            await adapter.connect(validConfig);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });
    });

    // =========================================================================
    // Schema Tests
    // =========================================================================

    describe('fetchSchema', () => {
        it('should return schema from cached data', async () => {
            mockSuccessfulConnection([
                { id: 1, name: 'test', value: 100, active: true },
                { id: 2, name: 'test2', value: 200, active: false },
            ]);

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns).toHaveLength(4);
            expect(schema.columns.map(c => c.name)).toEqual(['id', 'name', 'value', 'active']);
            expect(schema.rowCount).toBe(2);
        });

        it('should infer column types correctly', async () => {
            mockSuccessfulConnection([{
                id: 1,
                name: 'test',
                value: 100,
                active: true,
                created_at: '2024-01-01T00:00:00Z'
            }]);

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            const idCol = schema.columns.find(c => c.name === 'id');
            const nameCol = schema.columns.find(c => c.name === 'name');
            const valueCol = schema.columns.find(c => c.name === 'value');
            const activeCol = schema.columns.find(c => c.name === 'active');
            const createdCol = schema.columns.find(c => c.name === 'created_at');

            expect(idCol?.type).toBe('number');
            expect(nameCol?.type).toBe('string');
            expect(valueCol?.type).toBe('number');
            expect(activeCol?.type).toBe('boolean');
            expect(createdCol?.type).toBe('date');
        });

        it('should throw error when not connected', async () => {
            await expect(adapter.fetchSchema()).rejects.toThrow('Not configured');
        });

        it('should return empty schema for empty data', async () => {
            mockSuccessfulConnection([]);

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns).toHaveLength(0);
            expect(schema.rowCount).toBe(0);
        });
    });

    // =========================================================================
    // Data Fetch Tests
    // =========================================================================

    describe('fetchData', () => {
        it('should fetch data without query', async () => {
            const mockData = [
                { id: 1, name: 'player1', score: 100 },
                { id: 2, name: 'player2', score: 200 },
            ];

            mockSuccessfulConnection(mockData);
            await adapter.connect(validConfig);

            const result = await adapter.fetchData();

            expect(result.rows).toEqual(mockData);
            expect(result.columns).toEqual(['id', 'name', 'score']);
            expect(result.metadata.rowCount).toBe(2);
            expect(result.metadata.source).toContain('supabase:');
        });

        it('should apply server-side filters', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            // Mock filtered query
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 2, name: 'test', score: 150 }],
            });

            const result = await adapter.fetchData({
                filters: [{ column: 'score', operator: '>', value: 100 }],
            });

            expect(result.rows).toHaveLength(1);

            // Verify the fetch was called with correct filter params
            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            expect(lastCall[0]).toContain('score=gt.100');
        });

        it('should apply ordering via server query', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { id: 2, score: 200 },
                    { id: 1, score: 100 },
                ],
            });

            await adapter.fetchData({
                orderBy: { column: 'score', direction: 'desc' },
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            expect(lastCall[0]).toContain('order=score.desc');
        });

        it('should apply pagination via server query', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 3 }],
            });

            await adapter.fetchData({
                limit: 10,
                offset: 20,
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            expect(lastCall[0]).toContain('limit=10');
            expect(lastCall[0]).toContain('offset=20');
        });

        it('should throw error on query failure', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Bad Request',
                json: async () => ({ message: 'Invalid query' }),
            });

            await expect(
                adapter.fetchData({
                    filters: [{ column: 'invalid', operator: '=', value: 'test' }],
                })
            ).rejects.toThrow('Supabase query error');
        });

        it('should validate filter column names to prevent injection', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            await expect(
                adapter.fetchData({
                    filters: [{ column: 'id; DROP TABLE users;--', operator: '=', value: 1 }],
                })
            ).rejects.toThrow('Invalid column name');
        });
    });

    // =========================================================================
    // Query Building Tests
    // =========================================================================

    describe('query building', () => {
        it('should map operators correctly', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            const operators: Array<{ op: string; expected: string }> = [
                { op: '=', expected: 'eq' },
                { op: '!=', expected: 'neq' },
                { op: '>', expected: 'gt' },
                { op: '<', expected: 'lt' },
                { op: '>=', expected: 'gte' },
                { op: '<=', expected: 'lte' },
                { op: 'contains', expected: 'ilike' },
            ];

            for (const { op, expected } of operators) {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => [],
                });

                await adapter.fetchData({
                    filters: [{ column: 'score', operator: op as '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in', value: 100 }],
                });

                const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
                expect(lastCall[0]).toContain(`score=${expected}.`);
            }
        });

        it('should handle contains operator with wildcards', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            await adapter.fetchData({
                filters: [{ column: 'name', operator: 'contains', value: 'test' }],
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            expect(lastCall[0]).toContain('name=ilike.*test*');
        });

        it('should validate limit within bounds', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            // Try to exceed max limit
            await adapter.fetchData({
                limit: 999999,
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            expect(lastCall[0]).toContain('limit=100000');
        });
    });

    // =========================================================================
    // RPC Execution Tests
    // =========================================================================

    describe('executeRpc', () => {
        it('should execute RPC function successfully', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ result: 'success' }),
            });

            const result = await adapter.executeRpc('my_function', { param: 'value' });

            expect(result).toEqual({ result: 'success' });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            expect(lastCall[0]).toContain('/rpc/my_function');
        });

        it('should throw error on RPC failure', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Function not found',
                json: async () => ({ message: 'Function does not exist' }),
            });

            await expect(
                adapter.executeRpc('nonexistent_function')
            ).rejects.toThrow('RPC error');
        });

        it('should throw error when not configured', async () => {
            await expect(
                adapter.executeRpc('my_function')
            ).rejects.toThrow('Not configured');
        });
    });

    // =========================================================================
    // Realtime Subscription Tests
    // =========================================================================

    describe('subscribeToChanges', () => {
        it('should set up polling subscription', async () => {
            const setIntervalSpy = vi.spyOn(global, 'setInterval');

            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            const callback = vi.fn();
            const unsubscribe = adapter.subscribeToChanges(callback);

            expect(setIntervalSpy).toHaveBeenCalled();

            unsubscribe();
        });

        it('should return cleanup function', async () => {
            const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            const unsubscribe = adapter.subscribeToChanges(() => {});
            unsubscribe();

            expect(clearIntervalSpy).toHaveBeenCalled();
        });

        it('should return noop when not configured', () => {
            const callback = vi.fn();
            const unsubscribe = adapter.subscribeToChanges(callback);

            expect(typeof unsubscribe).toBe('function');
            unsubscribe(); // Should not throw
        });
    });

    // =========================================================================
    // Refresh Tests
    // =========================================================================

    describe('refresh', () => {
        it('should refresh data from server', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 1 }, { id: 2 }],
            });

            await adapter.refresh();

            const data = await adapter.fetchData();
            expect(data.rows).toHaveLength(2);
        });

        it('should throw error when not configured', async () => {
            await expect(adapter.refresh()).rejects.toThrow('Not configured');
        });

        it('should use selectColumns when specified', async () => {
            const configWithColumns = {
                ...validConfig,
                selectColumns: ['id', 'name'],
            };

            mockSuccessfulConnection([{ id: 1, name: 'test' }]);

            await adapter.connect(configWithColumns);

            const calls = mockFetch.mock.calls;
            const dataFetchCall = calls.find(call =>
                call[0].includes('/rest/v1/game_events')
            );
            expect(dataFetchCall?.[0]).toContain('select=id%2Cname');
        });
    });

    // =========================================================================
    // Available Tables Tests
    // =========================================================================

    describe('getAvailableTables', () => {
        it('should return available tables', async () => {
            // Mock tables fetch with multiple tables
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { table_name: 'game_events', table_schema: 'public', table_type: 'BASE TABLE' },
                    { table_name: 'users', table_schema: 'public', table_type: 'BASE TABLE' },
                ],
            });

            // Mock columns fetch
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
                ],
            });

            // Mock data fetch
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 1 }],
            });

            await adapter.connect(validConfig);

            const tables = adapter.getAvailableTables();
            expect(tables).toHaveLength(2);
            expect(tables[0].table_name).toBe('game_events');
        });
    });

    describe('getTableColumns', () => {
        it('should return empty array for unknown table', async () => {
            mockSuccessfulConnection([{ id: 1 }]);
            await adapter.connect(validConfig);

            const columns = adapter.getTableColumns('unknown_table');
            expect(columns).toEqual([]);
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    describe('error handling', () => {
        it('should handle network errors gracefully', async () => {
            // Mock tables fetch to fail with network error
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(adapter.connect(validConfig)).rejects.toThrow();
        });

        it('should handle malformed JSON response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => { throw new Error('Invalid JSON'); },
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow();
        });
    });
});
