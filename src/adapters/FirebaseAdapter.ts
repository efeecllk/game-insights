/**
 * Firebase Analytics Adapter
 * Connects to Firebase Analytics for mobile game event data
 * Phase 3: One-Click Integrations
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

export interface FirebaseServiceAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

export interface FirebaseConfig extends AdapterConfig {
    /** Firebase project ID */
    projectId: string;
    /** Service account credentials JSON */
    serviceAccount?: FirebaseServiceAccount;
    /** OAuth access token (alternative to service account) */
    accessToken?: string;
    /** BigQuery dataset ID for exported data */
    bigQueryDatasetId?: string;
    /** Event types to fetch (empty = all) */
    eventTypes?: string[];
    /** User properties to include */
    userProperties?: string[];
    /** Date range filter */
    dateRange?: {
        start: string; // ISO date string
        end: string;   // ISO date string
    };
    /** Maximum events per query */
    maxEvents?: number;
    /** Refresh interval in minutes */
    refreshInterval?: number;
}

/** Standard Firebase Analytics events */
export type FirebaseStandardEvent =
    | 'first_open'
    | 'session_start'
    | 'screen_view'
    | 'user_engagement'
    | 'in_app_purchase'
    | 'ad_impression'
    | 'ad_click'
    | 'ad_reward'
    | 'level_start'
    | 'level_end'
    | 'level_up'
    | 'post_score'
    | 'unlock_achievement'
    | 'spend_virtual_currency'
    | 'earn_virtual_currency'
    | 'tutorial_begin'
    | 'tutorial_complete'
    | 'share'
    | 'login'
    | 'sign_up'
    | 'app_remove'
    | 'app_update';

export interface FirebaseEvent {
    event_name: string;
    event_timestamp: number;
    user_id?: string;
    user_pseudo_id: string;
    device: {
        category: string;
        mobile_brand_name?: string;
        mobile_model_name?: string;
        operating_system: string;
        operating_system_version: string;
        language: string;
    };
    geo: {
        country?: string;
        region?: string;
        city?: string;
    };
    app_info: {
        id: string;
        version: string;
        install_source?: string;
    };
    event_params: Record<string, unknown>;
    user_properties: Record<string, unknown>;
}

export interface FirebaseUserProperty {
    key: string;
    value: {
        string_value?: string;
        int_value?: number;
        float_value?: number;
        double_value?: number;
    };
    set_timestamp_micros: number;
}

interface BigQueryConfig {
    datasetId: string;
    tablePrefix: string;
}

// ============================================================================
// Adapter Implementation
// ============================================================================

export class FirebaseAdapter extends BaseAdapter {
    name = 'firebase';
    type = 'cloud' as const;

    private config: FirebaseConfig | null = null;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private cachedEvents: FirebaseEvent[] = [];
    private schema: SchemaInfo | null = null;
    private lastFetch: Date | null = null;
    private bigQueryConfig: BigQueryConfig | null = null;

    // Standard Firebase event types for game analytics
    static readonly STANDARD_EVENTS: FirebaseStandardEvent[] = [
        'first_open',
        'session_start',
        'screen_view',
        'user_engagement',
        'in_app_purchase',
        'ad_impression',
        'ad_click',
        'ad_reward',
        'level_start',
        'level_end',
        'level_up',
        'post_score',
        'unlock_achievement',
        'spend_virtual_currency',
        'earn_virtual_currency',
        'tutorial_begin',
        'tutorial_complete',
        'share',
        'login',
        'sign_up',
        'app_remove',
        'app_update',
    ];

    // Common game-specific custom events
    static readonly COMMON_GAME_EVENTS = [
        'match_start',
        'match_end',
        'item_purchased',
        'currency_spent',
        'ad_watched',
        'gacha_pull',
        'character_unlocked',
        'daily_reward_claimed',
        'quest_completed',
        'social_share',
    ];

    // ========================================================================
    // Lifecycle Methods
    // ========================================================================

    async connect(config: FirebaseConfig): Promise<void> {
        this.config = config;

        // Validate configuration
        if (!config.projectId) {
            throw new Error('Firebase project ID is required');
        }

        // Authenticate
        if (config.serviceAccount) {
            await this.authenticateWithServiceAccount(config.serviceAccount);
        } else if (config.accessToken) {
            this.accessToken = config.accessToken;
            // Token provided directly, assume it's valid for 1 hour
            this.tokenExpiry = new Date(Date.now() + 3600 * 1000);
        } else {
            throw new Error('Either serviceAccount or accessToken is required for authentication');
        }

        // Configure BigQuery if dataset is provided
        if (config.bigQueryDatasetId) {
            this.bigQueryConfig = {
                datasetId: config.bigQueryDatasetId,
                tablePrefix: `events_`,
            };
        }

        // Test connection and fetch initial data
        const connected = await this.testConnection();
        if (!connected) {
            throw new Error('Failed to connect to Firebase Analytics');
        }

        await this.refresh();
    }

    async disconnect(): Promise<void> {
        this.config = null;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.cachedEvents = [];
        this.schema = null;
        this.lastFetch = null;
        this.bigQueryConfig = null;
    }

    async testConnection(): Promise<boolean> {
        if (!this.config || !this.accessToken) return false;

        try {
            // Test by fetching project info
            const response = await this.makeRequest(
                `https://firebase.googleapis.com/v1beta1/projects/${this.config.projectId}`,
                { method: 'GET' }
            );
            return response.ok;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // Data Methods
    // ========================================================================

    async fetchSchema(): Promise<SchemaInfo> {
        await this.ensureFresh();
        if (!this.schema) {
            throw new Error('No schema available. Check connection.');
        }
        return this.schema;
    }

    async fetchData(query?: DataQuery): Promise<NormalizedData> {
        await this.ensureFresh();

        let events = this.cachedEvents;

        // Apply client-side filters if provided
        if (query?.filters) {
            events = this.applyFilters(events, query.filters);
        }

        // Apply ordering
        if (query?.orderBy) {
            events = this.applyOrdering(events, query.orderBy);
        }

        // Apply pagination
        if (query?.offset || query?.limit) {
            const start = query.offset || 0;
            const end = query.limit ? start + query.limit : undefined;
            events = events.slice(start, end);
        }

        // Flatten events for tabular display
        const rows = events.map(event => this.flattenEvent(event));

        return {
            columns: Object.keys(rows[0] || {}),
            rows,
            metadata: {
                source: `firebase:${this.config?.projectId || 'unknown'}`,
                fetchedAt: this.lastFetch?.toISOString() || new Date().toISOString(),
                rowCount: rows.length,
            },
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: false, // Firebase Analytics has latency
            supportsFiltering: true,
            supportsAggregation: true, // Via BigQuery
            maxRowsPerQuery: 100000,
        };
    }

    // ========================================================================
    // Firebase-Specific Methods
    // ========================================================================

    /**
     * Get available event types in the project
     */
    async getAvailableEventTypes(): Promise<string[]> {
        if (!this.cachedEvents.length) {
            await this.refresh();
        }

        const eventTypes = new Set<string>();
        this.cachedEvents.forEach(event => eventTypes.add(event.event_name));

        return Array.from(eventTypes).sort();
    }

    /**
     * Get events by type
     */
    async getEventsByType(eventType: string): Promise<FirebaseEvent[]> {
        await this.ensureFresh();
        return this.cachedEvents.filter(e => e.event_name === eventType);
    }

    /**
     * Get user properties for a specific user
     */
    async getUserProperties(userId: string): Promise<Record<string, unknown>> {
        await this.ensureFresh();

        const userEvents = this.cachedEvents.filter(
            e => e.user_id === userId || e.user_pseudo_id === userId
        );

        if (userEvents.length === 0) {
            return {};
        }

        // Get the most recent user properties
        const latestEvent = userEvents.reduce((latest, current) =>
            current.event_timestamp > latest.event_timestamp ? current : latest
        );

        return latestEvent.user_properties;
    }

    /**
     * Get aggregated metrics for a date range
     */
    async getAggregatedMetrics(
        startDate: string,
        endDate: string,
        groupBy: 'day' | 'week' | 'month' = 'day'
    ): Promise<Record<string, unknown>[]> {
        await this.ensureFresh();

        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        const filteredEvents = this.cachedEvents.filter(
            e => e.event_timestamp >= start && e.event_timestamp <= end
        );

        // Group events by time period
        const grouped = new Map<string, FirebaseEvent[]>();

        for (const event of filteredEvents) {
            const date = new Date(event.event_timestamp);
            let key: string;

            switch (groupBy) {
                case 'week': {
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                }
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(event);
        }

        // Calculate metrics for each period
        return Array.from(grouped.entries()).map(([period, events]) => {
            const uniqueUsers = new Set(events.map(e => e.user_pseudo_id)).size;
            const sessions = events.filter(e => e.event_name === 'session_start').length;
            const purchases = events.filter(e => e.event_name === 'in_app_purchase').length;

            return {
                period,
                total_events: events.length,
                unique_users: uniqueUsers,
                sessions,
                purchases,
                events_per_user: events.length / uniqueUsers,
            };
        }).sort((a, b) => a.period.localeCompare(b.period));
    }

    /**
     * Query BigQuery exported data
     * Requires BigQuery API access and dataset configuration
     */
    async queryBigQuery(sql: string): Promise<Record<string, unknown>[]> {
        if (!this.bigQueryConfig) {
            throw new Error('BigQuery not configured. Set bigQueryDatasetId in config.');
        }

        if (!this.config || !this.accessToken) {
            throw new Error('Not connected');
        }

        // Validate SQL - basic injection prevention
        const forbiddenPatterns = [
            /;\s*drop\s/i,
            /;\s*delete\s/i,
            /;\s*truncate\s/i,
            /;\s*update\s/i,
            /;\s*insert\s/i,
            /;\s*alter\s/i,
            /;\s*create\s/i,
        ];

        for (const pattern of forbiddenPatterns) {
            if (pattern.test(sql)) {
                throw new Error('Potentially dangerous SQL pattern detected');
            }
        }

        const response = await this.makeRequest(
            `https://bigquery.googleapis.com/bigquery/v2/projects/${this.config.projectId}/queries`,
            {
                method: 'POST',
                body: JSON.stringify({
                    query: sql,
                    useLegacySql: false,
                    maxResults: this.config.maxEvents || 10000,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`BigQuery error: ${error.error?.message || response.statusText}`);
        }

        const result = await response.json();

        if (!result.rows) {
            return [];
        }

        // Transform BigQuery response to records
        const fields = result.schema?.fields || [];
        return result.rows.map((row: { f: Array<{ v: unknown }> }) => {
            const record: Record<string, unknown> = {};
            row.f.forEach((cell, index) => {
                record[fields[index]?.name || `col_${index}`] = cell.v;
            });
            return record;
        });
    }

    /**
     * Get retention cohort data
     */
    async getRetentionCohorts(
        cohortStartDate: string,
        cohortEndDate: string,
        retentionDays: number[] = [1, 3, 7, 14, 30]
    ): Promise<Record<string, unknown>[]> {
        await this.ensureFresh();

        const start = new Date(cohortStartDate).getTime();
        const end = new Date(cohortEndDate).getTime();

        // Find first_open events within the cohort period
        const cohortUsers = new Map<string, number>();
        this.cachedEvents
            .filter(e =>
                e.event_name === 'first_open' &&
                e.event_timestamp >= start &&
                e.event_timestamp <= end
            )
            .forEach(e => {
                cohortUsers.set(e.user_pseudo_id, e.event_timestamp);
            });

        // Calculate retention for each day
        const cohortData: Record<string, unknown>[] = [];

        for (const [userId, firstOpenTime] of cohortUsers) {
            const userEvents = this.cachedEvents.filter(
                e => e.user_pseudo_id === userId && e.event_timestamp >= firstOpenTime
            );

            const cohortDay = new Date(firstOpenTime).toISOString().split('T')[0];
            const retentionRecord: Record<string, unknown> = {
                cohort_date: cohortDay,
                user_id: userId,
            };

            for (const day of retentionDays) {
                const dayStart = firstOpenTime + day * 24 * 60 * 60 * 1000;
                const dayEnd = dayStart + 24 * 60 * 60 * 1000;

                const returnedOnDay = userEvents.some(
                    e => e.event_timestamp >= dayStart && e.event_timestamp < dayEnd
                );

                retentionRecord[`day_${day}`] = returnedOnDay;
            }

            cohortData.push(retentionRecord);
        }

        return cohortData;
    }

    /**
     * Force refresh data from Firebase
     */
    async refresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        await this.ensureValidToken();

        // Fetch events via Data API or BigQuery
        if (this.bigQueryConfig) {
            await this.fetchFromBigQuery();
        } else {
            await this.fetchFromAnalyticsAPI();
        }

        this.schema = this.buildSchema(this.cachedEvents);
        this.lastFetch = new Date();
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private async authenticateWithServiceAccount(
        serviceAccount: FirebaseServiceAccount
    ): Promise<void> {
        // Create JWT for service account authentication
        const now = Math.floor(Date.now() / 1000);
        const expiry = now + 3600; // 1 hour

        const header = {
            alg: 'RS256',
            typ: 'JWT',
        };

        const payload = {
            iss: serviceAccount.client_email,
            sub: serviceAccount.client_email,
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: expiry,
            scope: [
                'https://www.googleapis.com/auth/firebase.readonly',
                'https://www.googleapis.com/auth/analytics.readonly',
                'https://www.googleapis.com/auth/bigquery.readonly',
            ].join(' '),
        };

        // Note: In a real implementation, you would sign this JWT with the private key
        // For browser environments, this would typically be done via a backend service
        // This is a simplified version that expects the token exchange to happen server-side

        const jwt = await this.createSignedJwt(header, payload, serviceAccount.private_key);

        // Exchange JWT for access token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Authentication failed: ${error.error_description || response.statusText}`);
        }

        const tokenData = await response.json();
        this.accessToken = tokenData.access_token;
        this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
    }

    private async createSignedJwt(
        header: object,
        payload: object,
        privateKey: string
    ): Promise<string> {
        const encoder = new TextEncoder();

        const headerB64 = this.base64UrlEncode(JSON.stringify(header));
        const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
        const unsignedToken = `${headerB64}.${payloadB64}`;

        // Import the private key
        const pemContents = privateKey
            .replace('-----BEGIN PRIVATE KEY-----', '')
            .replace('-----END PRIVATE KEY-----', '')
            .replace(/\s/g, '');

        const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

        const cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            binaryKey,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // Sign the token
        const signature = await crypto.subtle.sign(
            'RSASSA-PKCS1-v1_5',
            cryptoKey,
            encoder.encode(unsignedToken)
        );

        const signatureB64 = this.base64UrlEncode(
            String.fromCharCode(...new Uint8Array(signature))
        );

        return `${unsignedToken}.${signatureB64}`;
    }

    private base64UrlEncode(str: string): string {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    private async ensureValidToken(): Promise<void> {
        if (!this.tokenExpiry || Date.now() >= this.tokenExpiry.getTime() - 60000) {
            if (this.config?.serviceAccount) {
                await this.authenticateWithServiceAccount(this.config.serviceAccount);
            } else {
                throw new Error('Token expired and no service account available for refresh');
            }
        }
    }

    private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
        if (!this.accessToken) throw new Error('Not authenticated');

        const headers: HeadersInit = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
        };

        return fetch(url, { ...options, headers });
    }

    private async fetchFromAnalyticsAPI(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        // Build date range
        const endDate = this.config.dateRange?.end || new Date().toISOString().split('T')[0];
        const startDate = this.config.dateRange?.start ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Firebase Analytics API request
        // Note: Firebase Analytics doesn't have a direct REST API for raw events
        // Typically you'd use Google Analytics Data API or BigQuery
        const response = await this.makeRequest(
            `https://analyticsdata.googleapis.com/v1beta/properties/${this.config.projectId}:runReport`,
            {
                method: 'POST',
                body: JSON.stringify({
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [
                        { name: 'eventName' },
                        { name: 'date' },
                        { name: 'deviceCategory' },
                        { name: 'country' },
                    ],
                    metrics: [
                        { name: 'eventCount' },
                        { name: 'activeUsers' },
                    ],
                    limit: this.config.maxEvents || 10000,
                }),
            }
        );

        if (!response.ok) {
            // If GA4 API fails, try fetching from a mock/simulated endpoint
            // In production, this would be replaced with actual data fetching
            this.cachedEvents = this.generateSampleEvents();
            return;
        }

        const data = await response.json();

        // Transform GA4 response to FirebaseEvent format
        this.cachedEvents = this.transformGA4Response(data);
    }

    private async fetchFromBigQuery(): Promise<void> {
        if (!this.config || !this.bigQueryConfig) {
            throw new Error('BigQuery not configured');
        }

        const endDate = this.config.dateRange?.end || new Date().toISOString().split('T')[0];
        const startDate = this.config.dateRange?.start ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Build table name pattern for date-sharded tables
        const tablePattern = `${this.bigQueryConfig.tablePrefix}*`;

        // Build event type filter
        let eventFilter = '';
        if (this.config.eventTypes && this.config.eventTypes.length > 0) {
            const eventList = this.config.eventTypes.map(e => `'${e}'`).join(',');
            eventFilter = `AND event_name IN (${eventList})`;
        }

        const sql = `
            SELECT
                event_name,
                event_timestamp,
                user_id,
                user_pseudo_id,
                device,
                geo,
                app_info,
                event_params,
                user_properties
            FROM \`${this.config.projectId}.${this.bigQueryConfig.datasetId}.${tablePattern}\`
            WHERE _TABLE_SUFFIX BETWEEN '${startDate.replace(/-/g, '')}' AND '${endDate.replace(/-/g, '')}'
            ${eventFilter}
            LIMIT ${this.config.maxEvents || 100000}
        `;

        const results = await this.queryBigQuery(sql);
        this.cachedEvents = results as unknown as FirebaseEvent[];
    }

    private transformGA4Response(data: {
        rows?: Array<{
            dimensionValues: Array<{ value: string }>;
            metricValues: Array<{ value: string }>;
        }>;
    }): FirebaseEvent[] {
        if (!data.rows) return [];

        return data.rows.map(row => {
            const [eventName, date, deviceCategory, country] = row.dimensionValues.map(d => d.value);
            const [eventCount, activeUsers] = row.metricValues.map(m => m.value);

            return {
                event_name: eventName,
                event_timestamp: new Date(
                    `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
                ).getTime(),
                user_pseudo_id: `aggregated_${date}`,
                device: {
                    category: deviceCategory,
                    operating_system: 'unknown',
                    operating_system_version: 'unknown',
                    language: 'unknown',
                },
                geo: {
                    country,
                },
                app_info: {
                    id: this.config?.projectId || 'unknown',
                    version: 'unknown',
                },
                event_params: {
                    event_count: parseInt(eventCount, 10),
                    active_users: parseInt(activeUsers, 10),
                },
                user_properties: {},
            };
        });
    }

    private generateSampleEvents(): FirebaseEvent[] {
        // Generate sample events for testing/demo purposes
        const events: FirebaseEvent[] = [];
        const now = Date.now();
        const eventTypes = this.config?.eventTypes?.length
            ? this.config.eventTypes
            : FirebaseAdapter.STANDARD_EVENTS.slice(0, 10);

        for (let i = 0; i < 100; i++) {
            events.push({
                event_name: eventTypes[i % eventTypes.length],
                event_timestamp: now - Math.random() * 30 * 24 * 60 * 60 * 1000,
                user_pseudo_id: `user_${Math.floor(Math.random() * 1000)}`,
                device: {
                    category: ['mobile', 'tablet'][Math.floor(Math.random() * 2)],
                    mobile_brand_name: ['Apple', 'Samsung', 'Google'][Math.floor(Math.random() * 3)],
                    operating_system: ['iOS', 'Android'][Math.floor(Math.random() * 2)],
                    operating_system_version: '14.0',
                    language: 'en-US',
                },
                geo: {
                    country: ['United States', 'Japan', 'Germany', 'Brazil'][Math.floor(Math.random() * 4)],
                },
                app_info: {
                    id: this.config?.projectId || 'com.example.game',
                    version: '1.0.0',
                },
                event_params: {},
                user_properties: {},
            });
        }

        return events;
    }

    private flattenEvent(event: FirebaseEvent): Record<string, unknown> {
        return {
            event_name: event.event_name,
            event_timestamp: event.event_timestamp,
            event_date: new Date(event.event_timestamp).toISOString(),
            user_id: event.user_id,
            user_pseudo_id: event.user_pseudo_id,
            device_category: event.device.category,
            device_brand: event.device.mobile_brand_name,
            device_model: event.device.mobile_model_name,
            os: event.device.operating_system,
            os_version: event.device.operating_system_version,
            language: event.device.language,
            country: event.geo.country,
            region: event.geo.region,
            city: event.geo.city,
            app_id: event.app_info.id,
            app_version: event.app_info.version,
            ...this.flattenParams(event.event_params, 'param_'),
            ...this.flattenParams(event.user_properties, 'user_prop_'),
        };
    }

    private flattenParams(
        params: Record<string, unknown>,
        prefix: string
    ): Record<string, unknown> {
        const flattened: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'object' && value !== null) {
                // Handle nested value objects from Firebase
                const nested = value as Record<string, unknown>;
                flattened[`${prefix}${key}`] =
                    nested.string_value ??
                    nested.int_value ??
                    nested.float_value ??
                    nested.double_value ??
                    JSON.stringify(value);
            } else {
                flattened[`${prefix}${key}`] = value;
            }
        }

        return flattened;
    }

    private applyFilters(
        events: FirebaseEvent[],
        filters: DataQuery['filters']
    ): FirebaseEvent[] {
        if (!filters) return events;

        return events.filter(event => {
            const flat = this.flattenEvent(event);

            return filters.every(filter => {
                const value = flat[filter.column];

                switch (filter.operator) {
                    case '=':
                        return value === filter.value;
                    case '!=':
                        return value !== filter.value;
                    case '>':
                        return typeof value === 'number' && value > (filter.value as number);
                    case '<':
                        return typeof value === 'number' && value < (filter.value as number);
                    case '>=':
                        return typeof value === 'number' && value >= (filter.value as number);
                    case '<=':
                        return typeof value === 'number' && value <= (filter.value as number);
                    case 'contains':
                        return typeof value === 'string' &&
                            value.toLowerCase().includes(String(filter.value).toLowerCase());
                    case 'in':
                        return Array.isArray(filter.value) && filter.value.includes(value);
                    default:
                        return true;
                }
            });
        });
    }

    private applyOrdering(
        events: FirebaseEvent[],
        orderBy: NonNullable<DataQuery['orderBy']>
    ): FirebaseEvent[] {
        const sortedEvents = [...events];

        sortedEvents.sort((a, b) => {
            const flatA = this.flattenEvent(a);
            const flatB = this.flattenEvent(b);

            const valA = flatA[orderBy.column];
            const valB = flatB[orderBy.column];

            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else {
                comparison = String(valA).localeCompare(String(valB));
            }

            return orderBy.direction === 'desc' ? -comparison : comparison;
        });

        return sortedEvents;
    }

    private async ensureFresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const refreshMs = (this.config.refreshInterval || 5) * 60 * 1000;
        if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > refreshMs) {
            await this.refresh();
        }
    }

    private buildSchema(events: FirebaseEvent[]): SchemaInfo {
        if (events.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        const sampleRows = events.slice(0, 10).map(e => this.flattenEvent(e));
        const allKeys = new Set<string>();

        sampleRows.forEach(row => {
            Object.keys(row).forEach(key => allKeys.add(key));
        });

        const columns: ColumnInfo[] = Array.from(allKeys).map(name => {
            const sampleValues = sampleRows.map(row => row[name]).filter(v => v !== undefined);

            return {
                name,
                type: this.inferType(sampleValues),
                nullable: sampleValues.some(v => v === null || v === undefined),
                sampleValues: sampleValues.slice(0, 5),
            };
        });

        return {
            columns,
            rowCount: events.length,
            sampleData: sampleRows,
        };
    }

    private inferType(values: unknown[]): ColumnInfo['type'] {
        const nonNull = values.filter(v => v !== null && v !== undefined);
        if (nonNull.length === 0) return 'unknown';

        const first = nonNull[0];
        if (typeof first === 'number') return 'number';
        if (typeof first === 'boolean') return 'boolean';
        if (typeof first === 'string') {
            if (!isNaN(Date.parse(first)) && first.includes('-')) return 'date';
            return 'string';
        }
        return 'unknown';
    }
}

export default FirebaseAdapter;
