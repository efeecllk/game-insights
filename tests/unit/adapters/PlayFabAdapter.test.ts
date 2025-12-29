/**
 * PlayFabAdapter Unit Tests
 * Tests for PlayFab adapter including title auth, player data, events, and economy
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlayFabAdapter, PlayFabConfig, PlayFabPlayerProfile, PlayStreamEvent, PlayFabCatalogItem } from '@/adapters/PlayFabAdapter';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PlayFabAdapter', () => {
    let adapter: PlayFabAdapter;
    let validConfig: PlayFabConfig;

    beforeEach(() => {
        adapter = new PlayFabAdapter();
        validConfig = {
            name: 'test-playfab',
            type: 'cloud',
            titleId: 'ABCD1',
            secretKey: 'SECRET123456789',
            dataTypes: ['player_data', 'playstream_events'],
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
            expect(adapter.name).toBe('playfab');
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
            expect(PlayFabAdapter.COMMON_EVENT_TYPES).toContain('player_logged_in');
            expect(PlayFabAdapter.COMMON_EVENT_TYPES).toContain('player_purchased_item');
            expect(PlayFabAdapter.COMMON_EVENT_TYPES).toContain('player_virtual_currency_balance_changed');
        });
    });

    // =========================================================================
    // Connection Tests
    // =========================================================================

    describe('connect', () => {
        it('should throw error when titleId is missing', async () => {
            const invalidConfig = {
                ...validConfig,
                titleId: '',
            };

            await expect(adapter.connect(invalidConfig)).rejects.toThrow(
                'PlayFab Title ID is required'
            );
        });

        it('should throw error when secretKey is missing', async () => {
            const invalidConfig = {
                ...validConfig,
                secretKey: '',
            };

            await expect(adapter.connect(invalidConfig)).rejects.toThrow(
                'PlayFab Secret Key is required'
            );
        });

        it('should throw error for invalid titleId format', async () => {
            const invalidConfig = {
                ...validConfig,
                titleId: 'invalid-id!@#',
            };

            await expect(adapter.connect(invalidConfig)).rejects.toThrow(
                'Invalid Title ID format'
            );
        });

        it('should connect successfully with valid config', async () => {
            // Mock GetTitleData for connection test
            mockFetch.mockResolvedValueOnce({ ok: true });

            // Mock GetPlayStreamEvents
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    status: 'OK',
                    data: { Events: [] },
                }),
            });

            await expect(adapter.connect(validConfig)).resolves.not.toThrow();
        });

        it('should throw error when connection test fails', async () => {
            mockFetch.mockResolvedValueOnce({ ok: false });

            await expect(adapter.connect(validConfig)).rejects.toThrow(
                'Failed to connect to PlayFab'
            );
        });

        it('should set default data types when not specified', async () => {
            const configNoDataTypes = {
                ...validConfig,
                dataTypes: undefined,
            };

            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(configNoDataTypes);

            // Should have connected - will use default data types
            const result = await adapter.testConnection();
            mockFetch.mockResolvedValueOnce({ ok: true });
            expect(await adapter.testConnection()).toBe(true);
        });
    });

    describe('disconnect', () => {
        it('should clear state on disconnect', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            await adapter.disconnect();

            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });
    });

    describe('testConnection', () => {
        it('should return true when connected', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({ ok: true });

            const result = await adapter.testConnection();
            expect(result).toBe(true);
        });

        it('should return false when not configured', async () => {
            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });

        it('should return false on API failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

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
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns.length).toBeGreaterThan(0);
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
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);
        };

        it('should fetch data without query', async () => {
            await setupConnection();

            const result = await adapter.fetchData();

            expect(result.rows.length).toBeGreaterThan(0);
            expect(result.metadata.source).toContain('playfab:');
        });

        it('should apply equality filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: '=', value: 'player' }],
            });

            result.rows.forEach(row => {
                expect((row as Record<string, unknown>)._type).toBe('player');
            });
        });

        it('should apply inequality filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: '_type', operator: '!=', value: 'event' }],
            });

            result.rows.forEach(row => {
                expect((row as Record<string, unknown>)._type).not.toBe('event');
            });
        });

        it('should apply greater than filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'stat_level', operator: '>', value: 50 }],
            });

            result.rows.forEach(row => {
                const level = (row as Record<string, unknown>).stat_level as number | undefined;
                if (level !== undefined) {
                    expect(level).toBeGreaterThan(50);
                }
            });
        });

        it('should apply contains filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'display_name', operator: 'contains', value: 'Player' }],
            });

            result.rows.forEach(row => {
                const name = (row as Record<string, unknown>).display_name as string | undefined;
                if (name) {
                    expect(name.toLowerCase()).toContain('player');
                }
            });
        });

        it('should apply ordering', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                orderBy: { column: 'stat_level', direction: 'desc' },
            });

            for (let i = 1; i < result.rows.length; i++) {
                const prevLevel = (result.rows[i - 1] as Record<string, unknown>).stat_level as number | undefined;
                const currLevel = (result.rows[i] as Record<string, unknown>).stat_level as number | undefined;
                if (prevLevel !== undefined && currLevel !== undefined) {
                    expect(prevLevel).toBeGreaterThanOrEqual(currLevel);
                }
            }
        });

        it('should apply pagination', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                limit: 10,
                offset: 5,
            });

            expect(result.rows.length).toBeLessThanOrEqual(10);
        });
    });

    // =========================================================================
    // Player Data Tests
    // =========================================================================

    describe('getPlayerData', () => {
        it('should fetch player data', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        Data: {
                            level: { Value: '10' },
                            score: { Value: '1000' },
                        },
                    },
                }),
            });

            const data = await adapter.getPlayerData('PLAYER001');

            expect(data).toBeDefined();
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(adapter.getPlayerData('INVALID')).rejects.toThrow(
                'Failed to fetch player data'
            );
        });
    });

    describe('getPlayerProfile', () => {
        it('should fetch player profile with statistics', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        PlayerProfile: {
                            PlayFabId: 'PLAYER001',
                            DisplayName: 'TestPlayer',
                            Created: '2024-01-01T00:00:00Z',
                            Statistics: [
                                { StatisticName: 'level', Value: 10, Version: 1 },
                            ],
                        },
                    },
                }),
            });

            const profile = await adapter.getPlayerProfile('PLAYER001');

            expect(profile).toBeDefined();
            expect(profile?.DisplayName).toBe('TestPlayer');
        });

        it('should return null when profile not found', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({ ok: false });

            const profile = await adapter.getPlayerProfile('NONEXISTENT');

            expect(profile).toBeNull();
        });
    });

    // =========================================================================
    // Player Segment Tests
    // =========================================================================

    describe('getPlayersInSegment', () => {
        it('should fetch players in segment', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        ProfilesInSegment: 2,
                        PlayerProfiles: [
                            { PlayFabId: 'PLAYER001', DisplayName: 'Player1', Created: '2024-01-01' },
                            { PlayFabId: 'PLAYER002', DisplayName: 'Player2', Created: '2024-01-02' },
                        ],
                    },
                }),
            });

            const players = await adapter.getPlayersInSegment('segment-123', 100);

            expect(players).toHaveLength(2);
            expect(players[0].PlayFabId).toBe('PLAYER001');
        });

        it('should handle pagination with continuation token', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            // First page
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        ProfilesInSegment: 3,
                        PlayerProfiles: [
                            { PlayFabId: 'PLAYER001', DisplayName: 'Player1', Created: '2024-01-01' },
                        ],
                        ContinuationToken: 'token-123',
                    },
                }),
            });

            // Second page
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        ProfilesInSegment: 3,
                        PlayerProfiles: [
                            { PlayFabId: 'PLAYER002', DisplayName: 'Player2', Created: '2024-01-02' },
                        ],
                        ContinuationToken: null,
                    },
                }),
            });

            const players = await adapter.getPlayersInSegment('segment-123', 100);

            expect(players).toHaveLength(2);
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Forbidden',
            });

            await expect(
                adapter.getPlayersInSegment('invalid-segment')
            ).rejects.toThrow('Failed to fetch segment players');
        });
    });

    // =========================================================================
    // PlayStream Events Tests
    // =========================================================================

    describe('getPlayStreamEvents', () => {
        it('should fetch PlayStream events', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        Events: [
                            {
                                EventId: 'EVT001',
                                EventName: 'player_logged_in',
                                Timestamp: '2024-01-15T10:00:00Z',
                                EventNamespace: 'com.playfab',
                                EntityType: 'player',
                                EntityId: 'PLAYER001',
                                TitleId: 'ABCD1',
                                Source: 'PlayFab',
                                EventData: {},
                            },
                        ],
                    },
                }),
            });

            const events = await adapter.getPlayStreamEvents(
                '2024-01-01',
                '2024-01-31',
                'player_logged_in'
            );

            expect(events).toHaveLength(1);
            expect(events[0].EventName).toBe('player_logged_in');
        });

        it('should handle empty events gracefully', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: false, // API unavailable
            });

            const events = await adapter.getPlayStreamEvents();

            expect(events).toEqual([]);
        });
    });

    // =========================================================================
    // Leaderboard Tests
    // =========================================================================

    describe('getLeaderboard', () => {
        it('should fetch leaderboard data', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        Version: 1,
                        Leaderboard: [
                            { PlayFabId: 'P001', DisplayName: 'Top1', Position: 0, StatValue: 1000 },
                            { PlayFabId: 'P002', DisplayName: 'Top2', Position: 1, StatValue: 900 },
                        ],
                    },
                }),
            });

            const leaderboard = await adapter.getLeaderboard('highscore', 10);

            expect(leaderboard.StatisticName).toBe('highscore');
            expect(leaderboard.Entries).toHaveLength(2);
            expect(leaderboard.Entries[0].StatValue).toBe(1000);
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(
                adapter.getLeaderboard('invalid_stat')
            ).rejects.toThrow('Failed to fetch leaderboard');
        });
    });

    describe('getLeaderboardAroundPlayer', () => {
        it('should fetch leaderboard around a player', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        Version: 1,
                        Leaderboard: [
                            { PlayFabId: 'P050', Position: 49, StatValue: 550 },
                            { PlayFabId: 'P051', Position: 50, StatValue: 500 },
                            { PlayFabId: 'P052', Position: 51, StatValue: 450 },
                        ],
                    },
                }),
            });

            const leaderboard = await adapter.getLeaderboardAroundPlayer('highscore', 'P051', 3);

            expect(leaderboard.Entries).toHaveLength(3);
        });
    });

    // =========================================================================
    // Catalog Tests
    // =========================================================================

    describe('getCatalogItems', () => {
        it('should fetch catalog items', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        Catalog: [
                            {
                                ItemId: 'sword_001',
                                DisplayName: 'Iron Sword',
                                ItemClass: 'weapon',
                                VirtualCurrencyPrices: { GC: 100 },
                            },
                            {
                                ItemId: 'potion_001',
                                DisplayName: 'Health Potion',
                                ItemClass: 'consumable',
                                VirtualCurrencyPrices: { GC: 50 },
                            },
                        ],
                    },
                }),
            });

            const items = await adapter.getCatalogItems();

            expect(items).toHaveLength(2);
            expect(items[0].ItemId).toBe('sword_001');
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Error',
            });

            await expect(adapter.getCatalogItems()).rejects.toThrow(
                'Failed to fetch catalog'
            );
        });
    });

    // =========================================================================
    // Virtual Currency Tests
    // =========================================================================

    describe('getVirtualCurrencies', () => {
        it('should fetch virtual currency definitions', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        Data: {
                            VirtualCurrencies: JSON.stringify([
                                { CurrencyCode: 'GC', DisplayName: 'Gold Coins', InitialDeposit: 100, RechargeRate: 0, RechargeMax: 0 },
                                { CurrencyCode: 'PC', DisplayName: 'Premium Coins', InitialDeposit: 0, RechargeRate: 0, RechargeMax: 0 },
                            ]),
                        },
                    },
                }),
            });

            const currencies = await adapter.getVirtualCurrencies();

            expect(currencies).toHaveLength(2);
            expect(currencies[0].CurrencyCode).toBe('GC');
        });

        it('should return empty array on API failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({ ok: false });

            const currencies = await adapter.getVirtualCurrencies();

            expect(currencies).toEqual([]);
        });
    });

    // =========================================================================
    // Player Statistics Tests
    // =========================================================================

    describe('getPlayerStatistics', () => {
        it('should fetch player statistics', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        Statistics: [
                            { StatisticName: 'level', Value: 25 },
                            { StatisticName: 'score', Value: 5000 },
                        ],
                    },
                }),
            });

            const stats = await adapter.getPlayerStatistics('PLAYER001');

            expect(stats.level).toBe(25);
            expect(stats.score).toBe(5000);
        });

        it('should return empty object on API failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({ ok: false });

            const stats = await adapter.getPlayerStatistics('INVALID');

            expect(stats).toEqual({});
        });
    });

    // =========================================================================
    // Title Data Tests
    // =========================================================================

    describe('getTitleData', () => {
        it('should fetch title data', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: {
                        Data: {
                            game_version: '1.2.3',
                            maintenance_mode: 'false',
                        },
                    },
                }),
            });

            const titleData = await adapter.getTitleData(['game_version', 'maintenance_mode']);

            expect(titleData.game_version).toBe('1.2.3');
            expect(titleData.maintenance_mode).toBe('false');
        });

        it('should return empty object on API failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({ ok: false });

            const titleData = await adapter.getTitleData();

            expect(titleData).toEqual({});
        });
    });

    // =========================================================================
    // Refresh Tests
    // =========================================================================

    describe('refresh', () => {
        it('should refresh data', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    code: 200,
                    data: { Events: [] },
                }),
            });

            await expect(adapter.refresh()).resolves.not.toThrow();
        });

        it('should throw error when not configured', async () => {
            await expect(adapter.refresh()).rejects.toThrow('Not configured');
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

        it('should handle malformed API responses', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}), // Missing data field
            });

            // Should not throw - should handle gracefully
            await expect(adapter.connect(validConfig)).resolves.not.toThrow();
        });
    });
});
