/**
 * APIAdapter Unit Tests
 * Tests for REST API data adapter
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { APIAdapter, type APIAdapterConfig } from '@/adapters/APIAdapter';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper to create mock response
function createMockResponse(data: unknown, ok = true, status = 200): Response {
    return {
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        json: vi.fn().mockResolvedValue(data),
        headers: new Headers(),
    } as unknown as Response;
}

describe('APIAdapter', () => {
    let adapter: APIAdapter;

    beforeEach(() => {
        adapter = new APIAdapter();
        mockFetch.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // =========================================================================
    // Constructor and Properties Tests
    // =========================================================================

    describe('properties', () => {
        it('should have correct name', () => {
            expect(adapter.name).toBe('api');
        });

        it('should have correct type', () => {
            expect(adapter.type).toBe('api');
        });
    });

    // =========================================================================
    // Connect Tests
    // =========================================================================

    describe('connect', () => {
        it('should connect and fetch initial data', async () => {
            const mockData = [{ id: 1, name: 'test' }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test-api',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('should handle connection errors', async () => {
            mockFetch.mockResolvedValueOnce(createMockResponse(null, false, 500));

            const config: APIAdapterConfig = {
                name: 'test-api',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await expect(adapter.connect(config)).rejects.toThrow('API error');
        });
    });

    // =========================================================================
    // Disconnect Tests
    // =========================================================================

    describe('disconnect', () => {
        it('should clear connection state', async () => {
            const mockData = [{ id: 1 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            await adapter.disconnect();

            // Should not be connected after disconnect
            const connected = await adapter.testConnection();
            expect(connected).toBe(false);
        });
    });

    // =========================================================================
    // Test Connection Tests
    // =========================================================================

    describe('testConnection', () => {
        it('should return false when not configured', async () => {
            const result = await adapter.testConnection();

            expect(result).toBe(false);
        });

        it('should return true for successful connection test', async () => {
            const mockData = [{ id: 1 }];
            mockFetch
                .mockResolvedValueOnce(createMockResponse(mockData))
                .mockResolvedValueOnce(createMockResponse(null, true));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.testConnection();

            expect(result).toBe(true);
        });

        it('should return false for failed connection test', async () => {
            const mockData = [{ id: 1 }];
            mockFetch
                .mockResolvedValueOnce(createMockResponse(mockData))
                .mockResolvedValueOnce(createMockResponse(null, false, 401));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.testConnection();

            expect(result).toBe(false);
        });
    });

    // =========================================================================
    // Fetch Schema Tests
    // =========================================================================

    describe('fetchSchema', () => {
        it('should return schema after connection', async () => {
            const mockData = [
                { id: 1, name: 'Alice', active: true },
                { id: 2, name: 'Bob', active: false },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const schema = await adapter.fetchSchema();

            expect(schema.columns.length).toBe(3);
            expect(schema.rowCount).toBe(2);
            expect(schema.sampleData.length).toBeLessThanOrEqual(10);
        });

        it('should infer column types correctly', async () => {
            const mockData = [
                { id: 1, name: 'test', active: true, date: '2024-01-15' },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const schema = await adapter.fetchSchema();

            const idCol = schema.columns.find(c => c.name === 'id');
            const nameCol = schema.columns.find(c => c.name === 'name');
            const activeCol = schema.columns.find(c => c.name === 'active');
            const dateCol = schema.columns.find(c => c.name === 'date');

            expect(idCol?.type).toBe('number');
            expect(nameCol?.type).toBe('string');
            expect(activeCol?.type).toBe('boolean');
            expect(dateCol?.type).toBe('date');
        });

        it('should throw when not connected', async () => {
            await expect(adapter.fetchSchema()).rejects.toThrow();
        });
    });

    // =========================================================================
    // Fetch Data Tests
    // =========================================================================

    describe('fetchData', () => {
        it('should return all data without query', async () => {
            const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData();

            expect(result.rows.length).toBe(3);
        });

        it('should apply equality filter', async () => {
            const mockData = [
                { id: 1, status: 'active' },
                { id: 2, status: 'inactive' },
                { id: 3, status: 'active' },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({
                filters: [{ column: 'status', operator: '=', value: 'active' }],
            });

            expect(result.rows.length).toBe(2);
            expect(result.rows.every(r => r.status === 'active')).toBe(true);
        });

        it('should apply not-equal filter', async () => {
            const mockData = [
                { id: 1, status: 'active' },
                { id: 2, status: 'inactive' },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({
                filters: [{ column: 'status', operator: '!=', value: 'active' }],
            });

            expect(result.rows.length).toBe(1);
            expect(result.rows[0].status).toBe('inactive');
        });

        it('should apply greater-than filter', async () => {
            const mockData = [
                { id: 1, value: 50 },
                { id: 2, value: 100 },
                { id: 3, value: 150 },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({
                filters: [{ column: 'value', operator: '>', value: 75 }],
            });

            expect(result.rows.length).toBe(2);
        });

        it('should apply less-than filter', async () => {
            const mockData = [
                { id: 1, value: 50 },
                { id: 2, value: 100 },
                { id: 3, value: 150 },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({
                filters: [{ column: 'value', operator: '<', value: 100 }],
            });

            expect(result.rows.length).toBe(1);
        });

        it('should apply contains filter', async () => {
            const mockData = [
                { id: 1, name: 'Alice Johnson' },
                { id: 2, name: 'Bob Smith' },
                { id: 3, name: 'Charlie Johnson' },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({
                filters: [{ column: 'name', operator: 'contains', value: 'Johnson' }],
            });

            expect(result.rows.length).toBe(2);
        });

        it('should apply in filter', async () => {
            const mockData = [
                { id: 1, status: 'active' },
                { id: 2, status: 'pending' },
                { id: 3, status: 'inactive' },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({
                filters: [{ column: 'status', operator: 'in', value: ['active', 'pending'] }],
            });

            expect(result.rows.length).toBe(2);
        });

        it('should apply limit', async () => {
            const mockData = Array.from({ length: 100 }, (_, i) => ({ id: i }));
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({ limit: 10 });

            expect(result.rows.length).toBe(10);
        });

        it('should apply offset', async () => {
            const mockData = Array.from({ length: 100 }, (_, i) => ({ id: i }));
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({ offset: 50, limit: 10 });

            expect(result.rows[0].id).toBe(50);
        });

        it('should apply ascending order', async () => {
            const mockData = [{ id: 3 }, { id: 1 }, { id: 2 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({
                orderBy: { column: 'id', direction: 'asc' },
            });

            expect(result.rows[0].id).toBe(1);
            expect(result.rows[2].id).toBe(3);
        });

        it('should apply descending order', async () => {
            const mockData = [{ id: 1 }, { id: 3 }, { id: 2 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData({
                orderBy: { column: 'id', direction: 'desc' },
            });

            expect(result.rows[0].id).toBe(3);
            expect(result.rows[2].id).toBe(1);
        });

        it('should include metadata', async () => {
            const mockData = [{ id: 1 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData();

            expect(result.metadata.source).toBe('https://api.example.com/data');
            expect(result.metadata.fetchedAt).toBeDefined();
            expect(result.metadata.rowCount).toBe(1);
        });
    });

    // =========================================================================
    // Capabilities Tests
    // =========================================================================

    describe('getCapabilities', () => {
        it('should return correct capabilities', () => {
            const capabilities = adapter.getCapabilities();

            expect(capabilities.supportsRealtime).toBe(true);
            expect(capabilities.supportsFiltering).toBe(true);
            expect(capabilities.supportsAggregation).toBe(false);
            expect(capabilities.maxRowsPerQuery).toBe(10000);
        });
    });

    // =========================================================================
    // Authentication Tests
    // =========================================================================

    describe('authentication', () => {
        it('should add bearer token header', async () => {
            const mockData = [{ id: 1 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'bearer',
                authValue: 'my-token',
            };

            await adapter.connect(config);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer my-token',
                    }),
                })
            );
        });

        it('should add API key header', async () => {
            const mockData = [{ id: 1 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'apikey',
                authValue: 'my-api-key',
                apiKeyHeader: 'X-Custom-Key',
            };

            await adapter.connect(config);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom-Key': 'my-api-key',
                    }),
                })
            );
        });

        it('should use default API key header', async () => {
            const mockData = [{ id: 1 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'apikey',
                authValue: 'my-api-key',
            };

            await adapter.connect(config);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-API-Key': 'my-api-key',
                    }),
                })
            );
        });

        it('should add basic auth header', async () => {
            const mockData = [{ id: 1 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'basic',
                authValue: 'user:password',
            };

            await adapter.connect(config);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });

        it('should add custom headers', async () => {
            const mockData = [{ id: 1 }];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
                headers: {
                    'X-Custom-Header': 'custom-value',
                },
            };

            await adapter.connect(config);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom-Header': 'custom-value',
                    }),
                })
            );
        });
    });

    // =========================================================================
    // Data Path Tests
    // =========================================================================

    describe('dataPath', () => {
        it('should navigate to nested data', async () => {
            const mockResponse = {
                data: {
                    results: [{ id: 1 }, { id: 2 }],
                },
            };
            mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
                dataPath: 'data.results',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData();

            expect(result.rows.length).toBe(2);
        });

        it('should handle single object response', async () => {
            const mockResponse = { id: 1, name: 'test' };
            mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const result = await adapter.fetchData();

            expect(result.rows.length).toBe(1);
            expect(result.rows[0].id).toBe(1);
        });
    });

    // =========================================================================
    // Refresh Tests
    // =========================================================================

    describe('refresh', () => {
        it('should throw when not configured', async () => {
            await expect(adapter.refresh()).rejects.toThrow('Not configured');
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle empty response array', async () => {
            mockFetch.mockResolvedValueOnce(createMockResponse([]));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const schema = await adapter.fetchSchema();

            expect(schema.columns.length).toBe(0);
            expect(schema.rowCount).toBe(0);
        });

        it('should handle nullable values in schema', async () => {
            const mockData = [
                { id: 1, optional: 'value' },
                { id: 2, optional: null },
            ];
            mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

            const config: APIAdapterConfig = {
                name: 'test',
                type: 'api',
                endpoint: 'https://api.example.com/data',
                authType: 'none',
            };

            await adapter.connect(config);
            const schema = await adapter.fetchSchema();

            const optionalCol = schema.columns.find(c => c.name === 'optional');
            expect(optionalCol?.nullable).toBe(true);
        });
    });
});
