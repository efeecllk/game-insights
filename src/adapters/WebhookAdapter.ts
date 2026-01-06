/**
 * Webhook Adapter
 * Receives real-time data via webhooks with buffering and validation
 * Phase 3: One-Click Integrations
 *
 * Note: This adapter works with a webhook receiver service that forwards
 * events to the browser via WebSocket or Server-Sent Events.
 */

import {
    BaseAdapter,
    AdapterConfig,
    SchemaInfo,
    NormalizedData,
    DataQuery,
    AdapterCapabilities,
    ColumnInfo,
} from './BaseAdapter';

// ============================================================================
// Types
// ============================================================================

export interface WebhookConfig extends AdapterConfig {
    // Webhook receiver service URL
    receiverUrl: string;

    // Unique identifier for this webhook endpoint
    endpointId?: string;

    // Optional secret for webhook validation
    secretKey?: string;

    // Maximum events to buffer
    maxBufferSize?: number;

    // Expected event schema (for validation)
    expectedSchema?: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'unknown'>;

    // Whether to auto-detect schema from first event
    autoDetectSchema?: boolean;
}

export interface WebhookEvent {
    id: string;
    timestamp: string;
    source: string;
    eventType: string;
    payload: Record<string, unknown>;
    validated: boolean;
}

interface WebhookEndpoint {
    id: string;
    url: string;
    createdAt: string;
    eventsReceived: number;
    lastEventAt?: string;
    status: 'active' | 'inactive' | 'error';
}

type EventCallback = (event: WebhookEvent) => void;

// ============================================================================
// Adapter Implementation
// ============================================================================

export class WebhookAdapter extends BaseAdapter {
    name = 'webhook';
    type = 'api' as const;

    private config: WebhookConfig | null = null;
    private endpoint: WebhookEndpoint | null = null;
    private eventBuffer: WebhookEvent[] = [];
    private schema: SchemaInfo | null = null;
    private eventSource: EventSource | null = null;
    private listeners: Set<EventCallback> = new Set();
    private connected: boolean = false;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 5;
    private readonly baseReconnectDelay: number = 1000;
    private abortController: AbortController | null = null;

    // ========================================================================
    // Lifecycle Methods
    // ========================================================================

    async connect(config: WebhookConfig): Promise<void> {
        this.config = config;
        this.abortController = new AbortController();

        // Create or retrieve webhook endpoint
        if (config.endpointId) {
            await this.getEndpoint(config.endpointId);
        } else {
            await this.createEndpoint();
        }

        // Start listening for events
        await this.startEventStream();
        this.connected = true;
    }

    async disconnect(): Promise<void> {
        // Abort any pending requests
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        this.stopEventStream();

        // Clear all listeners to prevent memory leaks
        this.listeners.clear();

        this.config = null;
        this.endpoint = null;
        this.eventBuffer = [];
        this.schema = null;
        this.connected = false;
        this.reconnectAttempts = 0;
    }

    async testConnection(): Promise<boolean> {
        if (!this.config || !this.endpoint) return false;

        try {
            const response = await fetch(
                `${this.config.receiverUrl}/api/webhooks/${this.endpoint.id}/status`,
                { signal: this.abortController?.signal }
            );
            return response.ok;
        } catch (error) {
            // Don't treat abort as connection failure
            if (error instanceof Error && error.name === 'AbortError') {
                return false;
            }
            return false;
        }
    }

    // ========================================================================
    // Data Methods
    // ========================================================================

    async fetchSchema(): Promise<SchemaInfo> {
        if (!this.schema) {
            // Build schema from buffered events
            this.schema = this.buildSchemaFromEvents();
        }
        return this.schema;
    }

    async fetchData(query?: DataQuery): Promise<NormalizedData> {
        let events = [...this.eventBuffer];

        // Apply filters
        if (query?.filters) {
            events = events.filter(event => {
                return query.filters!.every(filter => {
                    const value = event.payload[filter.column];
                    switch (filter.operator) {
                        case '=': return value === filter.value;
                        case '!=': return value !== filter.value;
                        case '>': return (value as number) > (filter.value as number);
                        case '<': return (value as number) < (filter.value as number);
                        case 'contains':
                            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                        case 'in': return (filter.value as unknown[]).includes(value);
                        default: return true;
                    }
                });
            });
        }

        // Apply ordering
        if (query?.orderBy) {
            const { column, direction } = query.orderBy;
            events.sort((a, b) => {
                const aVal = column === 'timestamp' ? a.timestamp : a.payload[column] as string | number;
                const bVal = column === 'timestamp' ? b.timestamp : b.payload[column] as string | number;
                const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return direction === 'desc' ? -cmp : cmp;
            });
        }

        // Apply pagination
        if (query?.offset) events = events.slice(query.offset);
        if (query?.limit) events = events.slice(0, query.limit);

        // Flatten events to rows
        const rows = events.map(e => ({
            _event_id: e.id,
            _timestamp: e.timestamp,
            _event_type: e.eventType,
            _source: e.source,
            ...e.payload,
        }));

        return {
            columns: Object.keys(rows[0] || {}),
            rows,
            metadata: {
                source: `webhook:${this.endpoint?.id || 'unknown'}`,
                fetchedAt: new Date().toISOString(),
                rowCount: rows.length,
            },
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: true,
            supportsFiltering: true,
            supportsAggregation: false,
            maxRowsPerQuery: 10000,
        };
    }

    // ========================================================================
    // Webhook-Specific Methods
    // ========================================================================

    /**
     * Get the webhook URL to configure in external services
     */
    getWebhookUrl(): string | null {
        if (!this.config || !this.endpoint) return null;
        return `${this.config.receiverUrl}/webhook/${this.endpoint.id}`;
    }

    /**
     * Get endpoint status and statistics
     */
    getEndpointStatus(): WebhookEndpoint | null {
        return this.endpoint;
    }

    /**
     * Get recent events
     */
    getRecentEvents(limit: number = 10): WebhookEvent[] {
        return this.eventBuffer.slice(-limit);
    }

    /**
     * Clear event buffer
     */
    clearBuffer(): void {
        this.eventBuffer = [];
    }

    /**
     * Add event listener for real-time events
     */
    addEventListener(callback: EventCallback): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Check if currently connected and receiving events
     */
    isConnected(): boolean {
        return this.connected && this.eventSource?.readyState === EventSource.OPEN;
    }

    /**
     * Manually push an event (for testing)
     */
    pushEvent(payload: Record<string, unknown>, eventType: string = 'custom'): void {
        const event = this.createEvent(payload, eventType, 'manual');
        this.handleIncomingEvent(event);
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private async createEndpoint(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const response = await fetch(`${this.config.receiverUrl}/api/webhooks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secretKey: this.config.secretKey,
                schema: this.config.expectedSchema,
            }),
            signal: this.abortController?.signal,
        });

        if (!response.ok) {
            throw new Error(`Failed to create webhook endpoint: ${response.statusText}`);
        }

        const data = await response.json();
        this.endpoint = data.endpoint;
    }

    private async getEndpoint(endpointId: string): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const response = await fetch(
            `${this.config.receiverUrl}/api/webhooks/${endpointId}`,
            { signal: this.abortController?.signal }
        );

        if (!response.ok) {
            throw new Error(`Webhook endpoint not found: ${endpointId}`);
        }

        const data = await response.json();
        this.endpoint = data.endpoint;
    }

    private async startEventStream(): Promise<void> {
        if (!this.config || !this.endpoint) {
            throw new Error('No endpoint configured');
        }

        const url = `${this.config.receiverUrl}/api/webhooks/${this.endpoint.id}/events`;

        this.eventSource = new EventSource(url);

        this.eventSource.onmessage = (msg) => {
            try {
                const event: WebhookEvent = JSON.parse(msg.data);
                this.handleIncomingEvent(event);
            } catch (error) {
                console.error('Failed to parse webhook event:', error);
            }
        };

        this.eventSource.onerror = () => {
            console.error('Webhook event stream error');

            // Check if we should attempt reconnection
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.connected = false;
                return;
            }

            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
            this.reconnectAttempts++;

            // Clear any existing reconnect timeout before setting a new one
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }

            // Attempt reconnection after delay
            this.reconnectTimeout = setTimeout(() => {
                this.reconnectTimeout = null;
                if (this.config && this.endpoint && this.connected) {
                    this.startEventStream().catch(console.error);
                }
            }, delay);
        };

        this.eventSource.onopen = () => {
            console.log('Webhook event stream connected');
            // Reset reconnect attempts on successful connection
            this.reconnectAttempts = 0;
        };
    }

    private stopEventStream(): void {
        // Clear any pending reconnection timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    private handleIncomingEvent(event: WebhookEvent): void {
        // Validate event against schema
        const validated = this.validateEvent(event);
        event.validated = validated;

        // Add to buffer (with size limit)
        const maxSize = this.config?.maxBufferSize || 1000;
        if (this.eventBuffer.length >= maxSize) {
            this.eventBuffer.shift(); // Remove oldest
        }
        this.eventBuffer.push(event);

        // Update schema if auto-detecting
        if (this.config?.autoDetectSchema && this.eventBuffer.length === 1) {
            this.schema = this.buildSchemaFromEvents();
        }

        // Notify listeners
        this.listeners.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Event listener error:', error);
            }
        });

        // Update endpoint stats
        if (this.endpoint) {
            this.endpoint.eventsReceived++;
            this.endpoint.lastEventAt = event.timestamp;
        }
    }

    private validateEvent(event: WebhookEvent): boolean {
        if (!this.config?.expectedSchema) {
            return true; // No schema to validate against
        }

        for (const [key, expectedType] of Object.entries(this.config.expectedSchema)) {
            const value = event.payload[key];

            if (value === undefined) {
                continue; // Optional field
            }

            const actualType = this.getValueType(value);
            if (actualType !== expectedType && expectedType !== 'unknown') {
                return false;
            }
        }

        return true;
    }

    private getValueType(value: unknown): ColumnInfo['type'] {
        if (value === null || value === undefined) return 'unknown';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'string') {
            if (!isNaN(Date.parse(value)) && value.includes('-')) return 'date';
            return 'string';
        }
        return 'unknown';
    }

    private createEvent(
        payload: Record<string, unknown>,
        eventType: string,
        source: string
    ): WebhookEvent {
        return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            source,
            eventType,
            payload,
            validated: false,
        };
    }

    private buildSchemaFromEvents(): SchemaInfo {
        if (this.eventBuffer.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        // Merge all payload keys
        const allKeys = new Set<string>();
        allKeys.add('_event_id');
        allKeys.add('_timestamp');
        allKeys.add('_event_type');
        allKeys.add('_source');

        this.eventBuffer.forEach(event => {
            Object.keys(event.payload).forEach(key => allKeys.add(key));
        });

        const columns: ColumnInfo[] = [...allKeys].map(name => {
            const sampleValues = this.eventBuffer.slice(0, 10).map(event => {
                if (name === '_event_id') return event.id;
                if (name === '_timestamp') return event.timestamp;
                if (name === '_event_type') return event.eventType;
                if (name === '_source') return event.source;
                return event.payload[name];
            });

            return {
                name,
                type: this.inferColumnType(sampleValues),
                nullable: sampleValues.some(v => v === null || v === undefined),
                sampleValues,
            };
        });

        const sampleData = this.eventBuffer.slice(0, 10).map(e => ({
            _event_id: e.id,
            _timestamp: e.timestamp,
            _event_type: e.eventType,
            _source: e.source,
            ...e.payload,
        }));

        return { columns, rowCount: this.eventBuffer.length, sampleData };
    }

    private inferColumnType(values: unknown[]): ColumnInfo['type'] {
        const nonNull = values.filter(v => v !== null && v !== undefined);
        if (nonNull.length === 0) return 'unknown';

        const types = new Set(nonNull.map(v => this.getValueType(v)));

        if (types.size === 1) {
            return [...types][0];
        }

        return 'string'; // Default to string for mixed types
    }
}

export default WebhookAdapter;
