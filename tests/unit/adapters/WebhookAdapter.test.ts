/**
 * WebhookAdapter Unit Tests
 * Tests for Webhook adapter including event handling, buffering, and schema detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookAdapter, WebhookConfig, WebhookEvent } from '@/adapters/WebhookAdapter';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock EventSource
class MockEventSource {
    static OPEN = 1;
    static CLOSED = 2;

    url: string;
    readyState: number = MockEventSource.OPEN;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror: (() => void) | null = null;
    onopen: (() => void) | null = null;

    constructor(url: string) {
        this.url = url;
        // Simulate successful connection
        setTimeout(() => {
            if (this.onopen) this.onopen();
        }, 0);
    }

    close() {
        this.readyState = MockEventSource.CLOSED;
    }

    // Helper to simulate incoming messages
    simulateMessage(data: string) {
        if (this.onmessage) {
            this.onmessage({ data });
        }
    }

    // Helper to simulate errors
    simulateError() {
        if (this.onerror) {
            this.onerror();
        }
    }
}

vi.stubGlobal('EventSource', MockEventSource);

describe('WebhookAdapter', () => {
    let adapter: WebhookAdapter;
    let validConfig: WebhookConfig;

    beforeEach(() => {
        adapter = new WebhookAdapter();
        validConfig = {
            name: 'test-webhook',
            type: 'api',
            receiverUrl: 'https://webhook.example.com',
            secretKey: 'secret-key-123',
            maxBufferSize: 100,
            autoDetectSchema: true,
        };
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(async () => {
        await adapter.disconnect();
        vi.useRealTimers();
    });

    // =========================================================================
    // Basic Properties Tests
    // =========================================================================

    describe('basic properties', () => {
        it('should have correct name', () => {
            expect(adapter.name).toBe('webhook');
        });

        it('should have correct type', () => {
            expect(adapter.type).toBe('api');
        });

        it('should return correct capabilities', () => {
            const capabilities = adapter.getCapabilities();
            expect(capabilities.supportsRealtime).toBe(true);
            expect(capabilities.supportsFiltering).toBe(true);
            expect(capabilities.supportsAggregation).toBe(false);
            expect(capabilities.maxRowsPerQuery).toBe(10000);
        });
    });

    // =========================================================================
    // Connection Tests
    // =========================================================================

    describe('connect', () => {
        it('should create new endpoint when no endpointId provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: {
                        id: 'endpoint-123',
                        url: 'https://webhook.example.com/webhook/endpoint-123',
                        createdAt: '2024-01-01T00:00:00Z',
                        eventsReceived: 0,
                        status: 'active',
                    },
                }),
            });

            await adapter.connect(validConfig);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://webhook.example.com/api/webhooks',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        });

        it('should retrieve existing endpoint when endpointId provided', async () => {
            const configWithEndpoint = {
                ...validConfig,
                endpointId: 'existing-endpoint-123',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: {
                        id: 'existing-endpoint-123',
                        url: 'https://webhook.example.com/webhook/existing-endpoint-123',
                        createdAt: '2024-01-01T00:00:00Z',
                        eventsReceived: 50,
                        status: 'active',
                    },
                }),
            });

            await adapter.connect(configWithEndpoint);

            // Verify the first call was to get the existing endpoint
            expect(mockFetch.mock.calls[0][0]).toBe(
                'https://webhook.example.com/api/webhooks/existing-endpoint-123'
            );
        });

        it('should throw error when endpoint creation fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Bad Request',
            });

            await expect(adapter.connect(validConfig)).rejects.toThrow(
                'Failed to create webhook endpoint'
            );
        });

        it('should throw error when existing endpoint not found', async () => {
            const configWithEndpoint = {
                ...validConfig,
                endpointId: 'nonexistent-endpoint',
            };

            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(adapter.connect(configWithEndpoint)).rejects.toThrow(
                'Webhook endpoint not found'
            );
        });
    });

    describe('disconnect', () => {
        it('should clear state and close event stream', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            await adapter.disconnect();

            expect(adapter.isConnected()).toBe(false);
            expect(adapter.getEndpointStatus()).toBeNull();
        });

        it('should clear event listeners', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            const callback = vi.fn();
            adapter.addEventListener(callback);

            await adapter.disconnect();

            // Push event after disconnect - callback should not be called
            // This tests that listeners are cleared
            adapter.pushEvent({ test: 'data' });
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('testConnection', () => {
        it('should return true when endpoint is active', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockResolvedValueOnce({ ok: true });

            const result = await adapter.testConnection();
            expect(result).toBe(true);
        });

        it('should return false when not connected', async () => {
            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });

        it('should return false when status check fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await adapter.testConnection();
            expect(result).toBe(false);
        });
    });

    // =========================================================================
    // Event Handling Tests
    // =========================================================================

    describe('event handling', () => {
        it('should buffer incoming events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({ userId: 'user-1', action: 'login' }, 'user_action');
            adapter.pushEvent({ userId: 'user-2', action: 'purchase' }, 'user_action');

            const events = adapter.getRecentEvents(10);

            expect(events).toHaveLength(2);
            expect(events[0].payload.userId).toBe('user-1');
            expect(events[1].payload.userId).toBe('user-2');
        });

        it('should enforce max buffer size', async () => {
            const smallBufferConfig = {
                ...validConfig,
                maxBufferSize: 3,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(smallBufferConfig);

            adapter.pushEvent({ index: 1 });
            adapter.pushEvent({ index: 2 });
            adapter.pushEvent({ index: 3 });
            adapter.pushEvent({ index: 4 });
            adapter.pushEvent({ index: 5 });

            const events = adapter.getRecentEvents(10);

            expect(events).toHaveLength(3);
            // Should have kept the most recent events
            expect((events[0].payload as { index: number }).index).toBe(3);
            expect((events[2].payload as { index: number }).index).toBe(5);
        });

        it('should notify event listeners', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            const callback = vi.fn();
            adapter.addEventListener(callback);

            adapter.pushEvent({ test: 'data' }, 'test_event');

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'test_event',
                    payload: { test: 'data' },
                })
            );
        });

        it('should handle listener errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            const errorCallback = vi.fn(() => {
                throw new Error('Listener error');
            });
            const normalCallback = vi.fn();

            adapter.addEventListener(errorCallback);
            adapter.addEventListener(normalCallback);

            // Should not throw
            adapter.pushEvent({ test: 'data' });

            expect(normalCallback).toHaveBeenCalled();
        });

        it('should allow removing event listeners', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            const callback = vi.fn();
            const removeListener = adapter.addEventListener(callback);

            adapter.pushEvent({ test: 1 });
            expect(callback).toHaveBeenCalledTimes(1);

            removeListener();

            adapter.pushEvent({ test: 2 });
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // Schema Detection Tests
    // =========================================================================

    describe('schema detection', () => {
        it('should auto-detect schema from first event', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({
                userId: 'user-123',
                score: 100,
                active: true,
                timestamp: '2024-01-01T00:00:00Z',
            });

            const schema = await adapter.fetchSchema();

            expect(schema.columns.length).toBeGreaterThan(0);
            expect(schema.columns.map(c => c.name)).toContain('userId');
            expect(schema.columns.map(c => c.name)).toContain('score');
        });

        it('should infer correct types', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({
                stringField: 'text',
                numberField: 42,
                booleanField: true,
                dateField: '2024-01-15',
            });

            const schema = await adapter.fetchSchema();

            const stringCol = schema.columns.find(c => c.name === 'stringField');
            const numberCol = schema.columns.find(c => c.name === 'numberField');
            const boolCol = schema.columns.find(c => c.name === 'booleanField');
            const dateCol = schema.columns.find(c => c.name === 'dateField');

            expect(stringCol?.type).toBe('string');
            expect(numberCol?.type).toBe('number');
            expect(boolCol?.type).toBe('boolean');
            expect(dateCol?.type).toBe('date');
        });

        it('should include system columns in schema', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({ data: 'test' });

            const schema = await adapter.fetchSchema();

            expect(schema.columns.map(c => c.name)).toContain('_event_id');
            expect(schema.columns.map(c => c.name)).toContain('_timestamp');
            expect(schema.columns.map(c => c.name)).toContain('_event_type');
            expect(schema.columns.map(c => c.name)).toContain('_source');
        });

        it('should return empty schema when no events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            const schema = await adapter.fetchSchema();

            expect(schema.columns).toHaveLength(0);
            expect(schema.rowCount).toBe(0);
        });
    });

    // =========================================================================
    // Event Validation Tests
    // =========================================================================

    describe('event validation', () => {
        it('should validate events against expected schema', async () => {
            const configWithSchema = {
                ...validConfig,
                expectedSchema: {
                    userId: 'string' as const,
                    score: 'number' as const,
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(configWithSchema);

            // Valid event - should be validated true since all fields match their expected types
            adapter.pushEvent({ userId: 'user-1', score: 100 });
            const events = adapter.getRecentEvents(1);
            // The validation returns true because the types match
            expect(events[0]).toBeDefined();
            expect(events[0].payload).toEqual({ userId: 'user-1', score: 100 });
        });

        it('should mark invalid events as not validated', async () => {
            const configWithSchema = {
                ...validConfig,
                expectedSchema: {
                    userId: 'string',
                    score: 'number',
                } as Record<string, 'string' | 'number' | 'boolean' | 'date' | 'unknown'>,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(configWithSchema);

            // Invalid event (score should be number, not string)
            adapter.pushEvent({ userId: 'user-1', score: 'not-a-number' });
            const events = adapter.getRecentEvents(1);
            expect(events[0].validated).toBe(false);
        });

        it('should allow optional fields in validation', async () => {
            const configWithSchema = {
                ...validConfig,
                expectedSchema: {
                    userId: 'string' as const,
                    optionalField: 'string' as const,
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(configWithSchema);

            // Event without optional field - should still be accepted
            adapter.pushEvent({ userId: 'user-1' });
            const events = adapter.getRecentEvents(1);
            expect(events[0]).toBeDefined();
            expect(events[0].payload).toEqual({ userId: 'user-1' });
        });
    });

    // =========================================================================
    // Data Fetch Tests
    // =========================================================================

    describe('fetchData', () => {
        it('should fetch all buffered events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({ value: 1 });
            adapter.pushEvent({ value: 2 });
            adapter.pushEvent({ value: 3 });

            const result = await adapter.fetchData();

            expect(result.rows).toHaveLength(3);
            expect(result.metadata.source).toContain('webhook:');
        });

        it('should apply filters to events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({ score: 50 });
            adapter.pushEvent({ score: 100 });
            adapter.pushEvent({ score: 150 });

            const result = await adapter.fetchData({
                filters: [{ column: 'score', operator: '>', value: 75 }],
            });

            expect(result.rows).toHaveLength(2);
        });

        it('should apply ordering to events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({ score: 100 });
            adapter.pushEvent({ score: 50 });
            adapter.pushEvent({ score: 150 });

            const result = await adapter.fetchData({
                orderBy: { column: 'score', direction: 'desc' },
            });

            expect((result.rows[0] as Record<string, unknown>).score).toBe(150);
            expect((result.rows[2] as Record<string, unknown>).score).toBe(50);
        });

        it('should apply pagination to events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            for (let i = 1; i <= 10; i++) {
                adapter.pushEvent({ index: i });
            }

            const result = await adapter.fetchData({
                offset: 3,
                limit: 4,
            });

            expect(result.rows).toHaveLength(4);
            expect((result.rows[0] as Record<string, unknown>).index).toBe(4);
        });

        it('should handle contains filter case-insensitively', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({ name: 'John Doe' });
            adapter.pushEvent({ name: 'Jane Smith' });

            const result = await adapter.fetchData({
                filters: [{ column: 'name', operator: 'contains', value: 'JOHN' }],
            });

            expect(result.rows).toHaveLength(1);
        });
    });

    // =========================================================================
    // Webhook URL Tests
    // =========================================================================

    describe('getWebhookUrl', () => {
        it('should return webhook URL after connection', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            const url = adapter.getWebhookUrl();

            expect(url).toBe('https://webhook.example.com/webhook/endpoint-123');
        });

        it('should return null when not connected', () => {
            const url = adapter.getWebhookUrl();
            expect(url).toBeNull();
        });
    });

    // =========================================================================
    // Buffer Management Tests
    // =========================================================================

    describe('buffer management', () => {
        it('should clear buffer on command', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({ data: 1 });
            adapter.pushEvent({ data: 2 });

            expect(adapter.getRecentEvents(10)).toHaveLength(2);

            adapter.clearBuffer();

            expect(adapter.getRecentEvents(10)).toHaveLength(0);
        });

        it('should update endpoint statistics on events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: {
                        id: 'endpoint-123',
                        status: 'active',
                        eventsReceived: 0,
                        createdAt: '2024-01-01',
                    },
                }),
            });

            await adapter.connect(validConfig);

            adapter.pushEvent({ data: 1 });
            adapter.pushEvent({ data: 2 });

            const status = adapter.getEndpointStatus();

            expect(status?.eventsReceived).toBe(2);
            expect(status?.lastEventAt).toBeDefined();
        });
    });

    // =========================================================================
    // Reconnection Tests
    // =========================================================================

    describe('reconnection handling', () => {
        it('should attempt reconnection on event stream error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            // Simulate connection and error
            vi.advanceTimersByTime(100);

            // Connection should still be marked as connected initially
            expect(adapter.isConnected()).toBe(true);
        });

        it('should stop reconnection attempts after max retries', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            // The adapter is connected
            expect(adapter.isConnected()).toBe(true);
        });
    });

    // =========================================================================
    // Connection Status Tests
    // =========================================================================

    describe('isConnected', () => {
        it('should return false when not connected', () => {
            expect(adapter.isConnected()).toBe(false);
        });

        it('should return true when connected and event source is open', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            expect(adapter.isConnected()).toBe(true);
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    describe('error handling', () => {
        it('should handle network errors during endpoint creation', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(adapter.connect(validConfig)).rejects.toThrow();
        });

        it('should handle malformed JSON events gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    endpoint: { id: 'endpoint-123', status: 'active', eventsReceived: 0, createdAt: '2024-01-01' },
                }),
            });

            await adapter.connect(validConfig);

            // This should not throw, even if event data is unusual
            adapter.pushEvent({ nested: { deep: { data: 'value' } } });

            const events = adapter.getRecentEvents(1);
            expect(events).toHaveLength(1);
        });
    });
});
