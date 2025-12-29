/**
 * PostgreSQLAdapter Unit Tests
 * Tests for PostgreSQL database adapter including connection, schema, and query building
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PostgreSQLAdapter, PostgreSQLConfig } from '@/adapters/PostgreSQLAdapter';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PostgreSQLAdapter', () => {
    let adapter: PostgreSQLAdapter;
    let validConfig: PostgreSQLConfig;

    beforeEach(() => {
        adapter = new PostgreSQLAdapter();
        validConfig = {
            name: 'test-postgres',
            type: 'database',
            proxyUrl: 'https://proxy.example.com',
            host: 'localhost',
            port: 5432,
            database: 'game_analytics',
            username: 'admin',
            password: 'secret123',
            ssl: true,
            schema: 'public',
            tableName: 'game_events',
        };
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await adapter.disconnect();
    });

    // =========================================================================
    // Basic Properties Tests
    // =========================================================================

    describe('basic properties', () => {
        it('should have correct name', () => {
            expect(adapter.name).toBe('postgresql');
        });

        it('should have correct type', () => {
            expect(adapter.type).toBe('database');
        });

        it('should return correct capabilities', () => {
            const capabilities = adapter.getCapabilities();
            expect(capabilities.supportsRealtime).toBe(false);
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
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: { connectionId: 'conn-123' },
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ table_name: 'game_events', table_schema: 'public', table_type: 'BASE TABLE' }],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null },
                    ],
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1, name: 'test' }],
                }),
            });

            await expect(adapter.connect(validConfig)).resolves.not.toThrow();
        });

        it('should throw error when connection fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: false,
                    error: 'Connection refused',
                }),
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow('Connection refused');
        });

        it('should throw error on proxy error response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow('Proxy error');
        });
    });

    describe('disconnect', () => {
        it('should disconnect and clear state', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [{ id: 1 }] }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            await adapter.disconnect();

            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });

        it('should handle disconnect errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(adapter.disconnect()).resolves.not.toThrow();
        });
    });

    describe('testConnection', () => {
        it('should return true when connection test succeeds', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connected: true } }),
            });

            const result = await adapter.testConnection();
            expect(result).toBe(true);
        });

        it('should return false when not configured', async () => {
            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });

        it('should return false on connection test failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: false, data: { connected: false } }),
            });

            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });
    });

    // =========================================================================
    // Schema Tests
    // =========================================================================

    describe('fetchSchema', () => {
        it('should return schema from cached data', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null, character_maximum_length: null },
                        { column_name: 'name', data_type: 'varchar', is_nullable: 'YES', column_default: null, character_maximum_length: 255 },
                    ],
                }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        { id: 1, name: 'test1' },
                        { id: 2, name: 'test2' },
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns).toHaveLength(2);
            expect(schema.rowCount).toBe(2);
        });

        it('should map PostgreSQL types correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        { column_name: 'id', data_type: 'bigint', is_nullable: 'NO', column_default: null, character_maximum_length: null },
                        { column_name: 'active', data_type: 'boolean', is_nullable: 'YES', column_default: null, character_maximum_length: null },
                        { column_name: 'created', data_type: 'timestamp with time zone', is_nullable: 'NO', column_default: null, character_maximum_length: null },
                    ],
                }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1, active: true, created: '2024-01-01T00:00:00Z' }],
                }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns.find(c => c.name === 'id')?.type).toBe('number');
            expect(schema.columns.find(c => c.name === 'active')?.type).toBe('boolean');
            expect(schema.columns.find(c => c.name === 'created')?.type).toBe('date');
        });

        it('should throw error when not connected', async () => {
            await expect(adapter.fetchSchema()).rejects.toThrow('Not configured');
        });
    });

    // =========================================================================
    // Data Fetch Tests
    // =========================================================================

    describe('fetchData', () => {
        const setupConnection = async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1, name: 'test', score: 100 }],
                }),
            });

            await adapter.connect(validConfig);
        };

        it('should fetch data without query', async () => {
            await setupConnection();

            const result = await adapter.fetchData();

            expect(result.rows).toHaveLength(1);
            expect(result.metadata.source).toContain('postgresql:');
        });

        it('should fetch data with filters', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 2, name: 'test2', score: 200 }],
                }),
            });

            const result = await adapter.fetchData({
                filters: [{ column: 'score', operator: '>', value: 150 }],
            });

            expect(result.rows).toHaveLength(1);
        });

        it('should build correct SQL for filters', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.fetchData({
                filters: [
                    { column: 'score', operator: '>=', value: 100 },
                    { column: 'name', operator: 'contains', value: 'test' },
                ],
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            const body = JSON.parse(lastCall[1].body);

            expect(body.sql).toContain('"score" >= 100');
            expect(body.sql).toContain('"name" ILIKE');
        });

        it('should apply ordering correctly', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.fetchData({
                orderBy: { column: 'score', direction: 'desc' },
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            const body = JSON.parse(lastCall[1].body);

            expect(body.sql).toContain('ORDER BY "score" DESC');
        });

        it('should apply pagination correctly', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.fetchData({
                limit: 50,
                offset: 100,
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            const body = JSON.parse(lastCall[1].body);

            expect(body.sql).toContain('LIMIT 50');
            expect(body.sql).toContain('OFFSET 100');
        });

        it('should validate column names to prevent SQL injection', async () => {
            await setupConnection();

            // The adapter should reject malformed column names
            // This test verifies the adapter validates column input
            await expect(
                adapter.fetchData({
                    filters: [{ column: 'id; DROP TABLE users;--', operator: '=', value: 1 }],
                })
            ).rejects.toThrow('Invalid column name');
        });

        it('should validate orderBy column names', async () => {
            await setupConnection();

            await expect(
                adapter.fetchData({
                    orderBy: { column: 'id; DROP TABLE users', direction: 'asc' },
                })
            ).rejects.toThrow('Invalid column name');
        });
    });

    // =========================================================================
    // Execute Query Tests
    // =========================================================================

    describe('executeQuery', () => {
        const setupConnection = async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.connect(validConfig);
        };

        it('should execute SELECT query', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1, name: 'test' }],
                }),
            });

            const result = await adapter.executeQuery('SELECT * FROM users');

            expect(result.rows).toHaveLength(1);
        });

        it('should execute WITH (CTE) query', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ total: 100 }],
                }),
            });

            const result = await adapter.executeQuery(
                'WITH cte AS (SELECT * FROM users) SELECT COUNT(*) as total FROM cte'
            );

            expect(result.rows).toHaveLength(1);
        });

        it('should reject non-SELECT queries', async () => {
            await setupConnection();

            await expect(
                adapter.executeQuery('DELETE FROM users WHERE id = 1')
            ).rejects.toThrow('Only SELECT queries are allowed');
        });

        it('should reject UPDATE queries', async () => {
            await setupConnection();

            await expect(
                adapter.executeQuery('UPDATE users SET name = "test"')
            ).rejects.toThrow('Only SELECT queries are allowed');
        });

        it('should reject INSERT queries', async () => {
            await setupConnection();

            await expect(
                adapter.executeQuery('INSERT INTO users (name) VALUES ("test")')
            ).rejects.toThrow('Only SELECT queries are allowed');
        });

        it('should throw error when not connected', async () => {
            await expect(
                adapter.executeQuery('SELECT * FROM users')
            ).rejects.toThrow('Not connected');
        });

        it('should throw error on query failure', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: false,
                    error: 'Syntax error',
                }),
            });

            await expect(
                adapter.executeQuery('SELECT * FROM nonexistent_table')
            ).rejects.toThrow('Syntax error');
        });
    });

    // =========================================================================
    // Refresh Tests
    // =========================================================================

    describe('refresh', () => {
        it('should refresh data from server', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1 }],
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1 }, { id: 2 }, { id: 3 }],
                }),
            });

            await adapter.refresh();

            const data = await adapter.fetchData();
            expect(data.rows).toHaveLength(3);
        });

        it('should use custom query when provided', async () => {
            const configWithQuery = {
                ...validConfig,
                customQuery: 'SELECT id, name FROM users WHERE active = true',
                tableName: undefined,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1, name: 'active_user' }],
                }),
            });

            await adapter.connect(configWithQuery);

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            const body = JSON.parse(lastCall[1].body);

            expect(body.sql).toBe('SELECT id, name FROM users WHERE active = true');
        });

        it('should throw error when not connected', async () => {
            await expect(adapter.refresh()).rejects.toThrow('Not connected');
        });

        it('should throw error when no table or query configured', async () => {
            const configWithoutTable = {
                ...validConfig,
                tableName: undefined,
                customQuery: undefined,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            // The connect will try to refresh which should fail
            await expect(adapter.connect(configWithoutTable)).rejects.toThrow(
                'No table or query configured'
            );
        });
    });

    // =========================================================================
    // Available Tables Tests
    // =========================================================================

    describe('getAvailableTables', () => {
        it('should return available tables', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        { table_name: 'game_events', table_schema: 'public', table_type: 'BASE TABLE' },
                        { table_name: 'users', table_schema: 'public', table_type: 'BASE TABLE' },
                        { table_name: 'sessions', table_schema: 'public', table_type: 'VIEW' },
                    ],
                }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1 }],
                }),
            });

            await adapter.connect(validConfig);

            const tables = adapter.getAvailableTables();

            expect(tables).toHaveLength(3);
            expect(tables.map(t => t.table_name)).toContain('game_events');
            expect(tables.map(t => t.table_name)).toContain('users');
        });
    });

    describe('getTableColumns', () => {
        it('should return columns for a table', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval()', character_maximum_length: null },
                        { column_name: 'name', data_type: 'varchar', is_nullable: 'YES', column_default: null, character_maximum_length: 255 },
                    ],
                }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [{ id: 1, name: 'test' }],
                }),
            });

            await adapter.connect(validConfig);

            const columns = adapter.getTableColumns('game_events');

            expect(columns).toHaveLength(2);
            expect(columns[0].column_name).toBe('id');
            expect(columns[1].column_name).toBe('name');
        });

        it('should return empty array for unknown table', () => {
            const columns = adapter.getTableColumns('unknown_table');
            expect(columns).toEqual([]);
        });
    });

    // =========================================================================
    // SQL Injection Prevention Tests
    // =========================================================================

    describe('SQL injection prevention', () => {
        const setupConnection = async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.connect(validConfig);
        };

        it('should reject invalid schema names', async () => {
            const invalidConfig = {
                ...validConfig,
                schema: 'public; DROP TABLE users',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });

            await expect(adapter.connect(invalidConfig)).rejects.toThrow('Invalid schema name');
        });

        it('should reject invalid table names in config', async () => {
            const invalidConfig = {
                ...validConfig,
                tableName: 'users; DROP DATABASE',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { connectionId: 'conn-123' } }),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await expect(adapter.connect(invalidConfig)).rejects.toThrow('Invalid table name');
        });

        it('should reject filter columns with special characters', async () => {
            await setupConnection();

            await expect(
                adapter.fetchData({
                    filters: [{ column: "name'; DROP TABLE users;--", operator: '=', value: 'test' }],
                })
            ).rejects.toThrow('Invalid column name');
        });

        it('should escape string values in filters', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.fetchData({
                filters: [{ column: 'name', operator: '=', value: "O'Brien" }],
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            const body = JSON.parse(lastCall[1].body);

            expect(body.sql).toContain("'O''Brien'");
        });

        it('should escape LIKE patterns correctly', async () => {
            await setupConnection();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [] }),
            });

            await adapter.fetchData({
                filters: [{ column: 'name', operator: 'contains', value: '100%_test' }],
            });

            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            const body = JSON.parse(lastCall[1].body);

            expect(body.sql).toContain('\\%');
            expect(body.sql).toContain('\\_');
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    describe('error handling', () => {
        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(adapter.connect(validConfig)).rejects.toThrow();
        });

        it('should handle proxy response errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable',
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow('Proxy error');
        });

        it('should handle malformed proxy responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ invalid: 'response' }),
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow();
        });
    });
});
