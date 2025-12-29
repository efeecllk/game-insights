/**
 * PlayFab Adapter
 * Connects to Microsoft PlayFab game services for player data and analytics
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

export interface PlayFabConfig extends AdapterConfig {
    /** PlayFab Title ID */
    titleId: string;
    /** PlayFab Secret Key (server-side only) */
    secretKey: string;
    /** Data types to fetch */
    dataTypes?: PlayFabDataType[];
    /** PlayStream event types to include */
    eventTypes?: string[];
    /** Date range filter for events */
    dateRange?: {
        start: string; // ISO date string
        end: string;   // ISO date string
    };
    /** Player segment ID filter */
    segmentId?: string;
    /** Maximum results per query */
    maxResults?: number;
    /** Refresh interval in minutes */
    refreshInterval?: number;
}

export type PlayFabDataType =
    | 'player_data'
    | 'playstream_events'
    | 'leaderboards'
    | 'virtual_currency'
    | 'catalog_items'
    | 'player_statistics'
    | 'title_data';

export interface PlayFabPlayer {
    PlayFabId: string;
    DisplayName?: string;
    Created: string;
    LastLogin?: string;
    BannedUntil?: string;
    AvatarUrl?: string;
    TitlePlayerAccount?: {
        Id: string;
        Type: string;
    };
    LinkedAccounts?: Array<{
        Platform: string;
        PlatformUserId: string;
    }>;
}

export interface PlayFabPlayerProfile extends PlayFabPlayer {
    Statistics?: Array<{
        StatisticName: string;
        Value: number;
        Version: number;
    }>;
    VirtualCurrencyBalances?: Record<string, number>;
    TotalValueToDateInUSD?: number;
    Locations?: Array<{
        ContinentCode: string;
        CountryCode: string;
        City?: string;
    }>;
    Memberships?: Array<{
        MembershipId: string;
        MembershipExpiration?: string;
        IsActive: boolean;
    }>;
}

export interface PlayStreamEvent {
    EventId: string;
    EventName: string;
    Timestamp: string;
    EventNamespace: string;
    EntityType: string;
    EntityId: string;
    TitleId: string;
    Source: string;
    EventData: Record<string, unknown>;
}

export interface PlayFabLeaderboard {
    StatisticName: string;
    Version: number;
    Entries: Array<{
        PlayFabId: string;
        DisplayName?: string;
        Position: number;
        StatValue: number;
        Profile?: PlayFabPlayer;
    }>;
}

export interface PlayFabCatalogItem {
    ItemId: string;
    ItemClass?: string;
    CatalogVersion?: string;
    DisplayName?: string;
    Description?: string;
    VirtualCurrencyPrices?: Record<string, number>;
    RealCurrencyPrices?: Record<string, number>;
    Tags?: string[];
    CustomData?: string;
    Consumable?: {
        UsageCount?: number;
        UsagePeriod?: number;
    };
    Bundle?: {
        BundledItems?: string[];
        BundledResultTables?: string[];
        BundledVirtualCurrencies?: Record<string, number>;
    };
}

export interface PlayFabVirtualCurrency {
    CurrencyCode: string;
    DisplayName: string;
    InitialDeposit: number;
    RechargeRate: number;
    RechargeMax: number;
}

// Internal types for API responses
interface PlayFabResponse<T> {
    code: number;
    status: string;
    data: T;
}

interface GetPlayersInSegmentResult {
    ProfilesInSegment: number;
    ContinuationToken?: string;
    PlayerProfiles: PlayFabPlayerProfile[];
}

interface GetPlayStreamEventsResult {
    Events: PlayStreamEvent[];
    ContinuationToken?: string;
}

interface GetLeaderboardResult {
    Leaderboard: PlayFabLeaderboard['Entries'];
    Version: number;
}

interface GetCatalogItemsResult {
    Catalog: PlayFabCatalogItem[];
}

// ============================================================================
// Adapter Implementation
// ============================================================================

export class PlayFabAdapter extends BaseAdapter {
    name = 'playfab';
    type = 'cloud' as const;

    private config: PlayFabConfig | null = null;
    private cachedData: Record<string, unknown>[] = [];
    private schema: SchemaInfo | null = null;
    private lastFetch: Date | null = null;

    // PlayFab API base URL
    private static readonly API_BASE = 'playfabapi.com';

    // Common PlayStream event types for games
    static readonly COMMON_EVENT_TYPES = [
        'player_logged_in',
        'player_registered',
        'player_inventory_item_added',
        'player_virtual_currency_balance_changed',
        'player_statistic_changed',
        'player_redeemed_coupon',
        'player_consumed_item',
        'player_triggered_action_executed_cloudscript',
        'player_purchased_item',
        'player_real_money_purchase',
        'player_joined_game',
        'player_left_game',
        'matchmaker_game_started',
        'matchmaker_game_ended',
    ];

    // ========================================================================
    // Lifecycle Methods
    // ========================================================================

    async connect(config: PlayFabConfig): Promise<void> {
        this.config = config;

        // Validate configuration
        if (!config.titleId) {
            throw new Error('PlayFab Title ID is required');
        }

        if (!config.secretKey) {
            throw new Error('PlayFab Secret Key is required');
        }

        // Validate title ID format (should be alphanumeric)
        if (!/^[A-Za-z0-9]+$/.test(config.titleId)) {
            throw new Error('Invalid Title ID format');
        }

        // Test connection
        const connected = await this.testConnection();
        if (!connected) {
            throw new Error('Failed to connect to PlayFab. Check your Title ID and Secret Key.');
        }

        // Set default data types if not specified
        if (!config.dataTypes || config.dataTypes.length === 0) {
            config.dataTypes = ['player_data', 'playstream_events'];
        }

        await this.refresh();
    }

    async disconnect(): Promise<void> {
        this.config = null;
        this.cachedData = [];
        this.schema = null;
        this.lastFetch = null;
    }

    async testConnection(): Promise<boolean> {
        if (!this.config) return false;

        try {
            // Test by fetching title data
            const response = await this.makeRequest('Server', 'GetTitleData', {
                Keys: ['_test_connection'],
            });
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

        let data = this.cachedData;

        // Apply client-side filters if provided
        if (query?.filters) {
            data = this.applyFilters(data, query.filters);
        }

        // Apply ordering
        if (query?.orderBy) {
            data = this.applyOrdering(data, query.orderBy);
        }

        // Apply pagination
        if (query?.offset || query?.limit) {
            const start = query.offset || 0;
            const end = query.limit ? start + query.limit : undefined;
            data = data.slice(start, end);
        }

        return {
            columns: Object.keys(data[0] || {}),
            rows: data,
            metadata: {
                source: `playfab:${this.config?.titleId || 'unknown'}`,
                fetchedAt: this.lastFetch?.toISOString() || new Date().toISOString(),
                rowCount: data.length,
            },
        };
    }

    getCapabilities(): AdapterCapabilities {
        return {
            supportsRealtime: false, // PlayStream can be polled but isn't truly realtime
            supportsFiltering: true,
            supportsAggregation: false, // Would need custom processing
            maxRowsPerQuery: 10000,
        };
    }

    // ========================================================================
    // PlayFab-Specific Methods
    // ========================================================================

    /**
     * Get player data for a specific player
     */
    async getPlayerData(playFabId: string): Promise<Record<string, unknown>> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest('Server', 'GetUserData', {
            PlayFabId: playFabId,
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch player data: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data?.Data || {};
    }

    /**
     * Get player profile with statistics
     */
    async getPlayerProfile(playFabId: string): Promise<PlayFabPlayerProfile | null> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest('Server', 'GetPlayerProfile', {
            PlayFabId: playFabId,
            ProfileConstraints: {
                ShowDisplayName: true,
                ShowCreated: true,
                ShowLastLogin: true,
                ShowLinkedAccounts: true,
                ShowStatistics: true,
                ShowLocations: true,
                ShowMemberships: true,
                ShowTotalValueToDateInUsd: true,
            },
        });

        if (!response.ok) {
            return null;
        }

        const result = await response.json();
        return result.data?.PlayerProfile || null;
    }

    /**
     * Get players in a segment
     */
    async getPlayersInSegment(
        segmentId: string,
        maxResults: number = 100
    ): Promise<PlayFabPlayerProfile[]> {
        if (!this.config) throw new Error('Not configured');

        const players: PlayFabPlayerProfile[] = [];
        let continuationToken: string | undefined;

        do {
            const response = await this.makeRequest('Server', 'GetPlayersInSegment', {
                SegmentId: segmentId,
                MaxBatchSize: Math.min(maxResults - players.length, 10000),
                ContinuationToken: continuationToken,
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch segment players: ${response.statusText}`);
            }

            const result: PlayFabResponse<GetPlayersInSegmentResult> = await response.json();
            players.push(...(result.data?.PlayerProfiles || []));
            continuationToken = result.data?.ContinuationToken;
        } while (continuationToken && players.length < maxResults);

        return players;
    }

    /**
     * Get PlayStream events
     */
    async getPlayStreamEvents(
        startTime?: string,
        endTime?: string,
        eventName?: string
    ): Promise<PlayStreamEvent[]> {
        if (!this.config) throw new Error('Not configured');

        const events: PlayStreamEvent[] = [];
        let continuationToken: string | undefined;

        const maxEvents = this.config.maxResults || 10000;

        // Build the request body
        const requestBody: Record<string, unknown> = {};

        if (startTime) {
            requestBody.StartTime = startTime;
        }
        if (endTime) {
            requestBody.EndTime = endTime;
        }
        if (eventName) {
            requestBody.EventName = eventName;
        }

        do {
            const response = await this.makeRequest('Server', 'GetPlayStreamEvents', {
                ...requestBody,
                ContinuationToken: continuationToken,
            });

            if (!response.ok) {
                // PlayStream Events API may not be available in all tiers
                console.warn('Failed to fetch PlayStream events:', response.statusText);
                break;
            }

            const result: PlayFabResponse<GetPlayStreamEventsResult> = await response.json();
            events.push(...(result.data?.Events || []));
            continuationToken = result.data?.ContinuationToken;
        } while (continuationToken && events.length < maxEvents);

        return events;
    }

    /**
     * Get leaderboard data
     */
    async getLeaderboard(
        statisticName: string,
        maxResults: number = 100,
        startPosition: number = 0
    ): Promise<PlayFabLeaderboard> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest('Server', 'GetLeaderboard', {
            StatisticName: statisticName,
            StartPosition: startPosition,
            MaxResultsCount: Math.min(maxResults, 100),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
        }

        const result: PlayFabResponse<GetLeaderboardResult> = await response.json();

        return {
            StatisticName: statisticName,
            Version: result.data?.Version || 0,
            Entries: result.data?.Leaderboard || [],
        };
    }

    /**
     * Get leaderboard around a specific player
     */
    async getLeaderboardAroundPlayer(
        statisticName: string,
        playFabId: string,
        maxResults: number = 20
    ): Promise<PlayFabLeaderboard> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest('Server', 'GetLeaderboardAroundUser', {
            StatisticName: statisticName,
            PlayFabId: playFabId,
            MaxResultsCount: Math.min(maxResults, 100),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch leaderboard around player: ${response.statusText}`);
        }

        const result: PlayFabResponse<GetLeaderboardResult> = await response.json();

        return {
            StatisticName: statisticName,
            Version: result.data?.Version || 0,
            Entries: result.data?.Leaderboard || [],
        };
    }

    /**
     * Get catalog items
     */
    async getCatalogItems(catalogVersion?: string): Promise<PlayFabCatalogItem[]> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest('Server', 'GetCatalogItems', {
            CatalogVersion: catalogVersion,
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch catalog: ${response.statusText}`);
        }

        const result: PlayFabResponse<GetCatalogItemsResult> = await response.json();
        return result.data?.Catalog || [];
    }

    /**
     * Get virtual currency definitions
     */
    async getVirtualCurrencies(): Promise<PlayFabVirtualCurrency[]> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest('Admin', 'GetTitleInternalData', {
            Keys: ['VirtualCurrencies'],
        });

        if (!response.ok) {
            // Virtual currency config may require Admin API
            return [];
        }

        const result = await response.json();
        const vcData = result.data?.Data?.VirtualCurrencies;

        if (!vcData) return [];

        try {
            return JSON.parse(vcData);
        } catch {
            return [];
        }
    }

    /**
     * Get player statistics
     */
    async getPlayerStatistics(playFabId: string): Promise<Record<string, number>> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest('Server', 'GetPlayerStatistics', {
            PlayFabId: playFabId,
        });

        if (!response.ok) {
            return {};
        }

        const result = await response.json();
        const stats: Record<string, number> = {};

        for (const stat of result.data?.Statistics || []) {
            stats[stat.StatisticName] = stat.Value;
        }

        return stats;
    }

    /**
     * Get title data (game configuration)
     */
    async getTitleData(keys?: string[]): Promise<Record<string, string>> {
        if (!this.config) throw new Error('Not configured');

        const response = await this.makeRequest('Server', 'GetTitleData', {
            Keys: keys,
        });

        if (!response.ok) {
            return {};
        }

        const result = await response.json();
        return result.data?.Data || {};
    }

    /**
     * Force refresh data from PlayFab
     */
    async refresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const allData: Record<string, unknown>[] = [];
        const dataTypes = this.config.dataTypes || ['player_data', 'playstream_events'];

        for (const dataType of dataTypes) {
            switch (dataType) {
                case 'player_data':
                    if (this.config.segmentId) {
                        const players = await this.getPlayersInSegment(
                            this.config.segmentId,
                            this.config.maxResults
                        );
                        allData.push(...players.map(p => this.flattenPlayerProfile(p)));
                    }
                    break;

                case 'playstream_events': {
                    const events = await this.getPlayStreamEvents(
                        this.config.dateRange?.start,
                        this.config.dateRange?.end,
                        this.config.eventTypes?.[0]
                    );
                    allData.push(...events.map(e => this.flattenEvent(e)));
                    break;
                }

                case 'leaderboards':
                    // Would need specific leaderboard names from config
                    break;

                case 'catalog_items': {
                    const items = await this.getCatalogItems();
                    allData.push(...items.map(i => this.flattenCatalogItem(i)));
                    break;
                }

                case 'virtual_currency': {
                    const currencies = await this.getVirtualCurrencies();
                    allData.push(...currencies.map(c => ({ ...c, _type: 'virtual_currency' })));
                    break;
                }

                case 'title_data': {
                    const titleData = await this.getTitleData();
                    allData.push(...Object.entries(titleData).map(([key, value]) => ({
                        key,
                        value,
                        _type: 'title_data',
                    })));
                    break;
                }
            }
        }

        // If no segment specified and player_data requested, generate sample data
        if (allData.length === 0 && dataTypes.includes('player_data')) {
            allData.push(...this.generateSampleData());
        }

        this.cachedData = allData;
        this.schema = this.buildSchema(allData);
        this.lastFetch = new Date();
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private async makeRequest(
        apiType: 'Server' | 'Admin' | 'Client',
        endpoint: string,
        body: Record<string, unknown>
    ): Promise<Response> {
        if (!this.config) throw new Error('Not configured');

        const url = `https://${this.config.titleId}.${PlayFabAdapter.API_BASE}/${apiType}/${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'X-SecretKey': this.config.secretKey,
        };

        return fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
    }

    private flattenPlayerProfile(player: PlayFabPlayerProfile): Record<string, unknown> {
        const stats: Record<string, number> = {};
        player.Statistics?.forEach(s => {
            stats[`stat_${s.StatisticName}`] = s.Value;
        });

        return {
            _type: 'player',
            playfab_id: player.PlayFabId,
            display_name: player.DisplayName,
            created: player.Created,
            last_login: player.LastLogin,
            banned_until: player.BannedUntil,
            avatar_url: player.AvatarUrl,
            total_value_usd: player.TotalValueToDateInUSD,
            country: player.Locations?.[0]?.CountryCode,
            city: player.Locations?.[0]?.City,
            linked_accounts: player.LinkedAccounts?.map(a => a.Platform).join(','),
            ...stats,
            ...player.VirtualCurrencyBalances,
        };
    }

    private flattenEvent(event: PlayStreamEvent): Record<string, unknown> {
        return {
            _type: 'event',
            event_id: event.EventId,
            event_name: event.EventName,
            timestamp: event.Timestamp,
            event_namespace: event.EventNamespace,
            entity_type: event.EntityType,
            entity_id: event.EntityId,
            source: event.Source,
            ...this.flattenEventData(event.EventData),
        };
    }

    private flattenEventData(data: Record<string, unknown>): Record<string, unknown> {
        const flattened: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const nested = this.flattenEventData(value as Record<string, unknown>);
                for (const [nestedKey, nestedValue] of Object.entries(nested)) {
                    flattened[`${key}_${nestedKey}`] = nestedValue;
                }
            } else {
                flattened[`data_${key}`] = value;
            }
        }

        return flattened;
    }

    private flattenCatalogItem(item: PlayFabCatalogItem): Record<string, unknown> {
        return {
            _type: 'catalog_item',
            item_id: item.ItemId,
            item_class: item.ItemClass,
            catalog_version: item.CatalogVersion,
            display_name: item.DisplayName,
            description: item.Description,
            tags: item.Tags?.join(','),
            is_consumable: !!item.Consumable,
            is_bundle: !!item.Bundle,
            ...Object.entries(item.VirtualCurrencyPrices || {}).reduce((acc, [key, value]) => {
                acc[`price_${key}`] = value;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    private generateSampleData(): Record<string, unknown>[] {
        // Generate sample player data for testing/demo purposes
        const data: Record<string, unknown>[] = [];

        for (let i = 0; i < 50; i++) {
            data.push({
                _type: 'player',
                playfab_id: `PLAYER${String(i + 1).padStart(6, '0')}`,
                display_name: `Player${i + 1}`,
                created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                last_login: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                total_value_usd: Math.floor(Math.random() * 100),
                country: ['US', 'JP', 'DE', 'GB', 'BR'][Math.floor(Math.random() * 5)],
                stat_level: Math.floor(Math.random() * 100),
                stat_score: Math.floor(Math.random() * 10000),
                stat_wins: Math.floor(Math.random() * 500),
                GC: Math.floor(Math.random() * 10000), // Gold coins
                PC: Math.floor(Math.random() * 100),   // Premium currency
            });
        }

        // Add sample events
        const eventTypes = ['player_logged_in', 'player_purchased_item', 'player_statistic_changed'];
        for (let i = 0; i < 100; i++) {
            data.push({
                _type: 'event',
                event_id: `EVT${String(i + 1).padStart(8, '0')}`,
                event_name: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                entity_type: 'player',
                entity_id: `PLAYER${String(Math.floor(Math.random() * 50) + 1).padStart(6, '0')}`,
                source: 'PlayFab',
            });
        }

        return data;
    }

    private applyFilters(
        data: Record<string, unknown>[],
        filters: DataQuery['filters']
    ): Record<string, unknown>[] {
        if (!filters) return data;

        return data.filter(row => {
            return filters.every(filter => {
                const value = row[filter.column];

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
        data: Record<string, unknown>[],
        orderBy: NonNullable<DataQuery['orderBy']>
    ): Record<string, unknown>[] {
        const sortedData = [...data];

        sortedData.sort((a, b) => {
            const valA = a[orderBy.column];
            const valB = b[orderBy.column];

            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else if (valA instanceof Date && valB instanceof Date) {
                comparison = valA.getTime() - valB.getTime();
            } else {
                comparison = String(valA || '').localeCompare(String(valB || ''));
            }

            return orderBy.direction === 'desc' ? -comparison : comparison;
        });

        return sortedData;
    }

    private async ensureFresh(): Promise<void> {
        if (!this.config) throw new Error('Not configured');

        const refreshMs = (this.config.refreshInterval || 5) * 60 * 1000;
        if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > refreshMs) {
            await this.refresh();
        }
    }

    private buildSchema(data: Record<string, unknown>[]): SchemaInfo {
        if (data.length === 0) {
            return { columns: [], rowCount: 0, sampleData: [] };
        }

        const allKeys = new Set<string>();
        data.slice(0, 100).forEach(row => {
            Object.keys(row).forEach(key => allKeys.add(key));
        });

        const columns: ColumnInfo[] = Array.from(allKeys).map(name => {
            const sampleValues = data.slice(0, 10).map(row => row[name]).filter(v => v !== undefined);

            return {
                name,
                type: this.inferType(sampleValues),
                nullable: sampleValues.some(v => v === null || v === undefined),
                sampleValues: sampleValues.slice(0, 5),
            };
        });

        return {
            columns,
            rowCount: data.length,
            sampleData: data.slice(0, 10) as Record<string, unknown>[],
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

export default PlayFabAdapter;
