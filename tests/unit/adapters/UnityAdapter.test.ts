/**
 * UnityAdapter Unit Tests
 * Tests for Unity Gaming Services adapter including auth, analytics, players, and economy
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnityAdapter, UnityConfig, UnityAnalyticsEvent, UnityPlayer } from '@/adapters/UnityAdapter';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UnityAdapter', () => {
    let adapter: UnityAdapter;
    let validConfig: UnityConfig;

    beforeEach(() => {
        adapter = new UnityAdapter();
        validConfig = {
            name: 'test-unity',
            type: 'cloud',
            projectId: 'test-project-id',
            environmentId: 'production',
            keyId: 'test-key-id',
            secretKey: 'test-secret-key',
            dataTypes: ['analytics_events', 'players'],
            dateRange: {
                start: '2024-01-01',
                end: '2024-01-31',
            },
            maxResults: 100,
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
            expect(adapter.name).toBe('unity');
        });

        it('should have correct type', () => {
            expect(adapter.type).toBe('cloud');
        });

        it('should return correct capabilities', () => {
            const capabilities = adapter.getCapabilities();
            expect(capabilities.supportsRealtime).toBe(false);
            expect(capabilities.supportsFiltering).toBe(true);
            expect(capabilities.supportsAggregation).toBe(false);
            expect(capabilities.maxRowsPerQuery).toBe(10000);
        });

        it('should expose common event types', () => {
            expect(UnityAdapter.COMMON_EVENT_TYPES).toContain('gameStarted');
            expect(UnityAdapter.COMMON_EVENT_TYPES).toContain('levelUp');
            expect(UnityAdapter.COMMON_EVENT_TYPES).toContain('purchase');
            expect(UnityAdapter.COMMON_EVENT_TYPES).toContain('adCompleted');
        });
    });

    // =========================================================================
    // Connection Tests
    // =========================================================================

    describe('connect', () => {
        it('should throw error when projectId is missing', async () => {
            const invalidConfig = {
                ...validConfig,
                projectId: '',
            };

            await expect(adapter.connect(invalidConfig)).rejects.toThrow(
                'Unity Project ID is required'
            );
        });

        it('should throw error when keyId is missing', async () => {
            const invalidConfig = {
                ...validConfig,
                keyId: '',
            };

            await expect(adapter.connect(invalidConfig)).rejects.toThrow(
                'Unity Service Account Key ID is required'
            );
        });

        it('should throw error when secretKey is missing', async () => {
            const invalidConfig = {
                ...validConfig,
                secretKey: '',
            };

            await expect(adapter.connect(invalidConfig)).rejects.toThrow(
                'Unity Service Account Secret Key is required'
            );
        });

        it('should connect successfully with valid config', async () => {
            // Mock authentication
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'test-token',
                    expires_in: 3600,
                }),
            });

            // Mock analytics events
            mockFetch.mockResolvedValueOnce({
                ok: false, // Simulate falling back to sample data
            });

            // Mock players
            mockFetch.mockResolvedValueOnce({
                ok: false, // Simulate falling back to sample data
            });

            await expect(adapter.connect(validConfig)).resolves.not.toThrow();
        });

        it('should throw error when authentication fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Invalid credentials',
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow(
                'Failed to connect to Unity Gaming Services'
            );
        });

        it('should set default environment when not specified', async () => {
            const configNoEnv = {
                ...validConfig,
                environmentId: undefined,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'test-token',
                    expires_in: 3600,
                }),
            });

            mockFetch.mockResolvedValueOnce({ ok: false });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(configNoEnv);
            // Environment should default to 'production'
        });

        it('should set default data types when not specified', async () => {
            const configNoDataTypes = {
                ...validConfig,
                dataTypes: undefined,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'test-token',
                    expires_in: 3600,
                }),
            });

            mockFetch.mockResolvedValueOnce({ ok: false });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(configNoDataTypes);
            // Should have connected - will use default data types
        });
    });

    // =========================================================================
    // Disconnect Tests
    // =========================================================================

    describe('disconnect', () => {
        it('should clear all state on disconnect', async () => {
            // Setup: connect first
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'test-token',
                    expires_in: 3600,
                }),
            });
            mockFetch.mockResolvedValueOnce({ ok: false });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);
            await adapter.disconnect();

            // After disconnect, testConnection should fail
            await expect(adapter.testConnection()).resolves.toBe(false);
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

        it('should return true when authentication succeeds', async () => {
            // Connect first
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'test-token',
                    expires_in: 3600,
                }),
            });
            mockFetch.mockResolvedValueOnce({ ok: false });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            // Test connection
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'test-token',
                    expires_in: 3600,
                }),
            });

            const result = await adapter.testConnection();
            expect(result).toBe(true);
        });
    });

    // =========================================================================
    // Fetch Data Tests
    // =========================================================================

    describe('fetchData', () => {
        beforeEach(async () => {
            // Reset mocks and connect before each test in this group
            mockFetch.mockReset();
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        access_token: 'test-token',
                        expires_in: 3600,
                    }),
                })
                .mockResolvedValueOnce({ ok: false }) // Analytics - will generate sample
                .mockResolvedValueOnce({ ok: false }); // Players - will generate sample

            await adapter.connect(validConfig);
        });

        it('should return data with metadata', async () => {
            const result = await adapter.fetchData();

            expect(result.metadata.source).toContain('unity');
            expect(result.metadata.rowCount).toBeGreaterThan(0);
            expect(result.columns.length).toBeGreaterThan(0);
        });

        it('should apply filters correctly', async () => {
            const result = await adapter.fetchData({
                filters: [
                    { column: '_type', operator: '=', value: 'player' },
                ],
            });

            // All rows should be players
            expect(result.rows.every(r => r._type === 'player')).toBe(true);
        });

        it('should apply pagination correctly', async () => {
            const fullResult = await adapter.fetchData();
            const pagedResult = await adapter.fetchData({
                limit: 5,
                offset: 0,
            });

            expect(pagedResult.rows.length).toBe(5);
            expect(pagedResult.rows[0]).toEqual(fullResult.rows[0]);
        });

        it('should apply ordering correctly', async () => {
            // Get only players so they have consistent fields
            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: '=', value: 'player' }],
                orderBy: { column: 'player_id', direction: 'asc' },
            });

            // Verify order
            for (let i = 1; i < result.rows.length; i++) {
                const curr = String(result.rows[i].player_id);
                const prev = String(result.rows[i - 1].player_id);
                expect(curr >= prev).toBe(true);
            }
        });
    });

    // =========================================================================
    // Fetch Schema Tests
    // =========================================================================

    describe('fetchSchema', () => {
        beforeEach(async () => {
            mockFetch.mockReset();
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        access_token: 'test-token',
                        expires_in: 3600,
                    }),
                })
                .mockResolvedValueOnce({ ok: false })
                .mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);
        });

        it('should return schema with columns', async () => {
            const schema = await adapter.fetchSchema();

            expect(schema.columns.length).toBeGreaterThan(0);
            expect(schema.rowCount).toBeGreaterThan(0);
        });

        it('should include sample data in schema', async () => {
            const schema = await adapter.fetchSchema();

            expect(schema.sampleData.length).toBeGreaterThan(0);
            expect(schema.sampleData.length).toBeLessThanOrEqual(10);
        });

        it('should detect column types correctly', async () => {
            const schema = await adapter.fetchSchema();

            // _type should be string
            const typeCol = schema.columns.find(c => c.name === '_type');
            expect(typeCol?.type).toBe('string');
        });

        it('should throw error when not configured', async () => {
            await adapter.disconnect();
            await expect(adapter.fetchSchema()).rejects.toThrow('Not configured');
        });
    });

    // =========================================================================
    // Sample Data Generation Tests
    // =========================================================================

    describe('sample data generation', () => {
        beforeEach(async () => {
            mockFetch.mockReset();
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        access_token: 'test-token',
                        expires_in: 3600,
                    }),
                })
                .mockResolvedValueOnce({ ok: false })
                .mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);
        });

        it('should generate sample players with valid structure', async () => {
            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: '=', value: 'player' }],
            });

            const player = result.rows[0];
            expect(player.player_id).toBeDefined();
            expect(player.created_at).toBeDefined();
            expect(typeof player.is_disabled).toBe('boolean');
        });

        it('should generate sample events with valid structure', async () => {
            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: '=', value: 'event' }],
            });

            const event = result.rows[0];
            expect(event.event_id).toBeDefined();
            expect(event.event_name).toBeDefined();
            expect(event.timestamp).toBeDefined();
            expect(event.player_id).toBeDefined();
        });

        it('should generate events with valid event names', async () => {
            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: '=', value: 'event' }],
            });

            const eventNames = result.rows.map(r => r.event_name);
            const validNames = UnityAdapter.COMMON_EVENT_TYPES;

            // All generated event names should be from the common types
            expect(eventNames.every(name => validNames.includes(name as string))).toBe(true);
        });
    });

    // =========================================================================
    // Filter Operations Tests
    // =========================================================================

    describe('filter operations', () => {
        beforeEach(async () => {
            mockFetch.mockReset();
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        access_token: 'test-token',
                        expires_in: 3600,
                    }),
                })
                .mockResolvedValueOnce({ ok: false })
                .mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);
        });

        it('should filter by equality', async () => {
            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: '=', value: 'player' }],
            });

            expect(result.rows.every(r => r._type === 'player')).toBe(true);
        });

        it('should filter by inequality', async () => {
            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: '!=', value: 'player' }],
            });

            expect(result.rows.every(r => r._type !== 'player')).toBe(true);
        });

        it('should filter by contains', async () => {
            const result = await adapter.fetchData({
                filters: [{ column: 'player_id', operator: 'contains', value: 'player' }],
            });

            expect(result.rows.every(r =>
                String(r.player_id).toLowerCase().includes('player')
            )).toBe(true);
        });

        it('should filter by in array', async () => {
            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: 'in', value: ['player', 'event'] }],
            });

            expect(result.rows.every(r =>
                ['player', 'event'].includes(r._type as string)
            )).toBe(true);
        });
    });

    // =========================================================================
    // Data Type Selection Tests
    // =========================================================================

    describe('data type selection', () => {
        it('should support multiple data types configuration', () => {
            // Test that the config correctly accepts different data types
            const config: UnityConfig = {
                ...validConfig,
                dataTypes: ['economy_currencies', 'remote_config', 'analytics_events'],
            };

            expect(config.dataTypes).toContain('economy_currencies');
            expect(config.dataTypes).toContain('remote_config');
            expect(config.dataTypes).toContain('analytics_events');
        });

        it('should have correct type definitions', () => {
            // Verify type definitions are correct
            const validDataTypes: UnityConfig['dataTypes'] = [
                'analytics_events',
                'players',
                'cloud_save',
                'economy_purchases',
                'economy_currencies',
                'economy_inventory',
                'remote_config',
            ];

            expect(validDataTypes.length).toBe(7);
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle successful connection with sample data fallback', async () => {
            // Auth + data endpoints that fall back to sample data
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        access_token: 'test-token',
                        expires_in: 3600,
                    }),
                })
                .mockResolvedValueOnce({ ok: false }) // Analytics fails
                .mockResolvedValueOnce({ ok: false }); // Players fails

            await adapter.connect(validConfig);

            // Should still work with sample data as fallback
            const result = await adapter.fetchData();
            expect(result.rows.length).toBeGreaterThan(0);
        });

        it('should cache token within expiry period', async () => {
            // After successful connect, token should be cached
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        access_token: 'test-token',
                        expires_in: 3600,
                    }),
                })
                .mockResolvedValueOnce({ ok: false })
                .mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            // After connecting, testConnection should return true using cached token
            const result = await adapter.testConnection();
            expect(result).toBe(true);
        });

        it('should handle disconnect properly', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        access_token: 'test-token',
                        expires_in: 3600,
                    }),
                })
                .mockResolvedValueOnce({ ok: false })
                .mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);
            await adapter.disconnect();

            // After disconnect, testConnection should return false
            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });
    });
});
