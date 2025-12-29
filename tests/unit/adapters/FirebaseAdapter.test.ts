/**
 * FirebaseAdapter Unit Tests
 * Tests for Firebase Analytics adapter including service account auth, event streaming, and BigQuery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebaseAdapter, FirebaseConfig, FirebaseServiceAccount, FirebaseEvent } from '@/adapters/FirebaseAdapter';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.subtle for JWT signing
const mockSign = vi.fn().mockResolvedValue(new ArrayBuffer(256));
const mockImportKey = vi.fn().mockResolvedValue({});

vi.stubGlobal('crypto', {
    subtle: {
        importKey: mockImportKey,
        sign: mockSign,
    },
});

describe('FirebaseAdapter', () => {
    let adapter: FirebaseAdapter;
    let validConfig: FirebaseConfig;
    let validServiceAccount: FirebaseServiceAccount;

    beforeEach(() => {
        adapter = new FirebaseAdapter();
        validServiceAccount = {
            type: 'service_account',
            project_id: 'test-project',
            private_key_id: 'key-123',
            private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ\n-----END PRIVATE KEY-----',
            client_email: 'test@test-project.iam.gserviceaccount.com',
            client_id: '123456789',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test',
        };
        validConfig = {
            name: 'test-firebase',
            type: 'cloud',
            projectId: 'test-project-123',
            accessToken: 'valid-access-token',
            eventTypes: ['first_open', 'session_start', 'in_app_purchase'],
            dateRange: {
                start: '2024-01-01',
                end: '2024-01-31',
            },
            maxEvents: 1000,
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
            expect(adapter.name).toBe('firebase');
        });

        it('should have correct type', () => {
            expect(adapter.type).toBe('cloud');
        });

        it('should return correct capabilities', () => {
            const capabilities = adapter.getCapabilities();
            expect(capabilities.supportsRealtime).toBe(false);
            expect(capabilities.supportsFiltering).toBe(true);
            expect(capabilities.supportsAggregation).toBe(true);
            expect(capabilities.maxRowsPerQuery).toBe(100000);
        });

        it('should expose standard events', () => {
            expect(FirebaseAdapter.STANDARD_EVENTS).toContain('first_open');
            expect(FirebaseAdapter.STANDARD_EVENTS).toContain('session_start');
            expect(FirebaseAdapter.STANDARD_EVENTS).toContain('in_app_purchase');
            expect(FirebaseAdapter.STANDARD_EVENTS).toContain('level_up');
        });

        it('should expose common game events', () => {
            expect(FirebaseAdapter.COMMON_GAME_EVENTS).toContain('match_start');
            expect(FirebaseAdapter.COMMON_GAME_EVENTS).toContain('gacha_pull');
            expect(FirebaseAdapter.COMMON_GAME_EVENTS).toContain('daily_reward_claimed');
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
                'Firebase project ID is required'
            );
        });

        it('should throw error when no authentication provided', async () => {
            const noAuthConfig = {
                ...validConfig,
                accessToken: undefined,
                serviceAccount: undefined,
            };

            await expect(adapter.connect(noAuthConfig)).rejects.toThrow(
                'Either serviceAccount or accessToken is required'
            );
        });

        it('should connect with access token', async () => {
            // Mock project info check
            mockFetch.mockResolvedValueOnce({ ok: true });

            // Mock analytics data fetch
            mockFetch.mockResolvedValueOnce({
                ok: false, // Fallback to sample data
            });

            await expect(adapter.connect(validConfig)).resolves.not.toThrow();
        });

        it('should throw error when connection test fails', async () => {
            mockFetch.mockResolvedValueOnce({ ok: false });

            await expect(adapter.connect(validConfig)).rejects.toThrow(
                'Failed to connect to Firebase Analytics'
            );
        });

        it('should connect with service account', async () => {
            const configWithServiceAccount = {
                ...validConfig,
                accessToken: undefined,
                serviceAccount: validServiceAccount,
            };

            // Mock token exchange
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'exchanged-token',
                    expires_in: 3600,
                }),
            });

            // Mock project info check
            mockFetch.mockResolvedValueOnce({ ok: true });

            // Mock analytics data fetch
            mockFetch.mockResolvedValueOnce({ ok: false });

            await expect(adapter.connect(configWithServiceAccount)).resolves.not.toThrow();
        });
    });

    describe('disconnect', () => {
        it('should clear state on disconnect', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            await adapter.disconnect();

            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });
    });

    describe('testConnection', () => {
        it('should return true when connected', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

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
            mockFetch.mockResolvedValueOnce({ ok: false });

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
        it('should return schema from cached events', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false }); // Uses sample data

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns.length).toBeGreaterThan(0);
            expect(schema.columns.map(c => c.name)).toContain('event_name');
            expect(schema.columns.map(c => c.name)).toContain('event_timestamp');
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
            mockFetch.mockResolvedValueOnce({ ok: false }); // Uses sample data

            await adapter.connect(validConfig);
        };

        it('should fetch data without query', async () => {
            await setupConnection();

            const result = await adapter.fetchData();

            expect(result.rows.length).toBeGreaterThan(0);
            expect(result.metadata.source).toContain('firebase:');
        });

        it('should apply filters', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'event_name', operator: '=', value: 'first_open' }],
            });

            result.rows.forEach(row => {
                expect((row as Record<string, unknown>).event_name).toBe('first_open');
            });
        });

        it('should apply ordering', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                orderBy: { column: 'event_timestamp', direction: 'desc' },
            });

            if (result.rows.length > 1) {
                const first = (result.rows[0] as Record<string, unknown>).event_timestamp as number;
                const second = (result.rows[1] as Record<string, unknown>).event_timestamp as number;
                expect(first).toBeGreaterThanOrEqual(second);
            }
        });

        it('should apply pagination', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                limit: 5,
                offset: 0,
            });

            expect(result.rows.length).toBeLessThanOrEqual(5);
        });

        it('should handle contains filter', async () => {
            await setupConnection();

            const result = await adapter.fetchData({
                filters: [{ column: 'country', operator: 'contains', value: 'United' }],
            });

            result.rows.forEach(row => {
                const country = (row as Record<string, unknown>).country as string;
                if (country) {
                    expect(country.toLowerCase()).toContain('united');
                }
            });
        });

        it('should handle in filter', async () => {
            await setupConnection();

            const allowedEvents = ['first_open', 'session_start'];
            const result = await adapter.fetchData({
                filters: [{ column: 'event_name', operator: 'in', value: allowedEvents }],
            });

            result.rows.forEach(row => {
                expect(allowedEvents).toContain((row as Record<string, unknown>).event_name);
            });
        });
    });

    // =========================================================================
    // Firebase-Specific Methods Tests
    // =========================================================================

    describe('getAvailableEventTypes', () => {
        it('should return unique event types from cached data', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const eventTypes = await adapter.getAvailableEventTypes();

            expect(eventTypes.length).toBeGreaterThan(0);
            expect(new Set(eventTypes).size).toBe(eventTypes.length); // All unique
        });
    });

    describe('getEventsByType', () => {
        it('should return events filtered by type', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const events = await adapter.getEventsByType('first_open');

            events.forEach(event => {
                expect(event.event_name).toBe('first_open');
            });
        });
    });

    describe('getUserProperties', () => {
        it('should return user properties for a user', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const events = await adapter.getEventsByType('first_open');
            if (events.length > 0) {
                const properties = await adapter.getUserProperties(events[0].user_pseudo_id);
                expect(typeof properties).toBe('object');
            }
        });

        it('should return empty object for unknown user', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const properties = await adapter.getUserProperties('nonexistent-user');
            expect(properties).toEqual({});
        });
    });

    describe('getAggregatedMetrics', () => {
        it('should return aggregated metrics by day', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const metrics = await adapter.getAggregatedMetrics(
                '2024-01-01',
                '2024-01-31',
                'day'
            );

            if (metrics.length > 0) {
                expect(metrics[0]).toHaveProperty('period');
                expect(metrics[0]).toHaveProperty('total_events');
                expect(metrics[0]).toHaveProperty('unique_users');
            }
        });

        it('should return aggregated metrics by week', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const metrics = await adapter.getAggregatedMetrics(
                '2024-01-01',
                '2024-01-31',
                'week'
            );

            expect(Array.isArray(metrics)).toBe(true);
        });

        it('should return aggregated metrics by month', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const metrics = await adapter.getAggregatedMetrics(
                '2024-01-01',
                '2024-12-31',
                'month'
            );

            expect(Array.isArray(metrics)).toBe(true);
        });
    });

    describe('getRetentionCohorts', () => {
        it('should return retention cohort data', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const cohorts = await adapter.getRetentionCohorts(
                '2024-01-01',
                '2024-01-07',
                [1, 3, 7]
            );

            expect(Array.isArray(cohorts)).toBe(true);
            if (cohorts.length > 0) {
                expect(cohorts[0]).toHaveProperty('cohort_date');
                expect(cohorts[0]).toHaveProperty('user_id');
            }
        });
    });

    // =========================================================================
    // BigQuery Tests
    // =========================================================================

    describe('queryBigQuery', () => {
        it('should throw error when BigQuery not configured', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            await expect(
                adapter.queryBigQuery('SELECT * FROM events')
            ).rejects.toThrow('BigQuery not configured');
        });

        it('should execute BigQuery query when configured', async () => {
            const configWithBQ = {
                ...validConfig,
                bigQueryDatasetId: 'analytics_123456789',
            };

            // Mock connection test
            mockFetch.mockResolvedValueOnce({ ok: true });
            // Mock BQ job creation during connect refresh
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    rows: [],
                    schema: { fields: [] },
                }),
            });

            await adapter.connect(configWithBQ);

            const mockBQResponse = {
                rows: [
                    { f: [{ v: 'event1' }, { v: 100 }] },
                    { f: [{ v: 'event2' }, { v: 200 }] },
                ],
                schema: {
                    fields: [
                        { name: 'event_name' },
                        { name: 'count' },
                    ],
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockBQResponse,
            });

            const result = await adapter.queryBigQuery('SELECT event_name, COUNT(*) as count FROM events GROUP BY event_name');

            expect(result).toHaveLength(2);
            expect(result[0].event_name).toBe('event1');
        });

        it('should reject dangerous SQL patterns', async () => {
            const configWithBQ = {
                ...validConfig,
                bigQueryDatasetId: 'analytics_123456789',
            };

            // Mock connection test
            mockFetch.mockResolvedValueOnce({ ok: true });
            // Mock BQ job during connect refresh
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    rows: [],
                    schema: { fields: [] },
                }),
            });

            await adapter.connect(configWithBQ);

            // Test that dangerous patterns are rejected before making the API call
            await expect(
                adapter.queryBigQuery('SELECT * FROM events; drop table users')
            ).rejects.toThrow('Potentially dangerous SQL pattern');
        });

        it('should handle BigQuery API errors', async () => {
            const configWithBQ = {
                ...validConfig,
                bigQueryDatasetId: 'analytics_123456789',
            };

            // Mock connection test
            mockFetch.mockResolvedValueOnce({ ok: true });
            // Mock BQ job during connect refresh
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    rows: [],
                    schema: { fields: [] },
                }),
            });

            await adapter.connect(configWithBQ);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Query failed',
                json: async () => ({
                    error: { message: 'Invalid query' },
                }),
            });

            await expect(
                adapter.queryBigQuery('SELECT invalid FROM nonexistent')
            ).rejects.toThrow('BigQuery error');
        });
    });

    // =========================================================================
    // Refresh Tests
    // =========================================================================

    describe('refresh', () => {
        it('should refresh data from API', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const initialData = await adapter.fetchData();

            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.refresh();

            const refreshedData = await adapter.fetchData();

            expect(refreshedData.rows.length).toBeGreaterThan(0);
        });

        it('should throw error when not configured', async () => {
            await expect(adapter.refresh()).rejects.toThrow('Not configured');
        });
    });

    // =========================================================================
    // Event Flattening Tests
    // =========================================================================

    describe('event flattening', () => {
        it('should flatten events correctly', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const result = await adapter.fetchData();

            if (result.rows.length > 0) {
                const row = result.rows[0] as Record<string, unknown>;
                expect(row).toHaveProperty('event_name');
                expect(row).toHaveProperty('event_timestamp');
                expect(row).toHaveProperty('device_category');
                expect(row).toHaveProperty('country');
            }
        });
    });

    // =========================================================================
    // Authentication Flow Tests
    // =========================================================================

    describe('service account authentication', () => {
        it('should handle authentication failure', async () => {
            const configWithServiceAccount = {
                ...validConfig,
                accessToken: undefined,
                serviceAccount: validServiceAccount,
            };

            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error_description: 'Invalid credentials',
                }),
            });

            await expect(adapter.connect(configWithServiceAccount)).rejects.toThrow(
                'Authentication failed'
            );
        });
    });

    // =========================================================================
    // GA4 Response Transformation Tests
    // =========================================================================

    describe('GA4 response transformation', () => {
        it('should transform GA4 report response to events', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            // Mock GA4 response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    rows: [
                        {
                            dimensionValues: [
                                { value: 'first_open' },
                                { value: '20240115' },
                                { value: 'mobile' },
                                { value: 'United States' },
                            ],
                            metricValues: [
                                { value: '100' },
                                { value: '50' },
                            ],
                        },
                    ],
                }),
            });

            await adapter.connect(validConfig);

            const result = await adapter.fetchData();

            expect(result.rows.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Type Inference Tests
    // =========================================================================

    describe('type inference', () => {
        it('should infer types correctly from sample values', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            mockFetch.mockResolvedValueOnce({ ok: false });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            const timestampCol = schema.columns.find(c => c.name === 'event_timestamp');
            expect(timestampCol?.type).toBe('number');

            const eventNameCol = schema.columns.find(c => c.name === 'event_name');
            expect(eventNameCol?.type).toBe('string');
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
                json: vi.fn().mockResolvedValue({ rows: null }),
            });

            // Should not throw - should fall back to sample data
            await expect(adapter.connect(validConfig)).resolves.not.toThrow();
        });
    });
});
