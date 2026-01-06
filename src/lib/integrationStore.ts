/**
 * Integration Store
 * Manages data source integrations with IndexedDB persistence
 * Phase 3: One-Click Integrations
 */

import {
    dbPut,
    dbGetAll,
    dbGet,
    dbDelete,
    dbGetByIndex,
    generateId,
} from './db';

// ============================================================================
// Types
// ============================================================================

export type IntegrationType =
    | 'google_sheets'
    | 'firebase'
    | 'supabase'
    | 'postgresql'
    | 'mongodb'
    | 'mysql'
    | 'playfab'
    | 'unity'
    | 'webhook'
    | 'rest_api';

export type IntegrationStatus =
    | 'connected'
    | 'disconnected'
    | 'error'
    | 'syncing'
    | 'paused';

export type SyncStrategy =
    | { type: 'manual' }
    | { type: 'scheduled'; intervalMinutes: number }
    | { type: 'realtime'; method: 'websocket' | 'polling'; pollIntervalSeconds?: number }
    | { type: 'webhook' };

export type AuthMethod =
    | { type: 'oauth'; provider: 'google' | 'unity' | 'firebase'; accessToken?: string; refreshToken?: string; expiresAt?: number }
    | { type: 'apikey'; key: string; headerName?: string }
    | { type: 'bearer'; token: string }
    | { type: 'serviceAccount'; credentials: Record<string, unknown> }
    | { type: 'basic'; username: string; password: string }
    | { type: 'connection'; connectionString: string }
    | { type: 'none' };

export interface IntegrationConfig {
    // Common fields
    name: string;
    type: IntegrationType;
    auth: AuthMethod;
    syncStrategy: SyncStrategy;

    // Type-specific config
    googleSheets?: {
        spreadsheetId: string;
        sheetName?: string;
        range?: string;
        hasHeaderRow: boolean;
    };

    supabase?: {
        projectUrl: string;
        tableName: string;
        selectColumns?: string[];
        filters?: Array<{ column: string; operator: string; value: unknown }>;
    };

    postgresql?: {
        host: string;
        port: number;
        database: string;
        schema?: string;
        tableName?: string;
        query?: string;
        ssl: boolean;
    };

    webhook?: {
        endpointPath: string;
        secretKey?: string;
        expectedSchema?: Record<string, string>;
    };

    firebase?: {
        projectId: string;
        collection?: string;
        eventTypes?: string[];
        userProperties?: string[];
        bigQueryDatasetId?: string;
        dateRange?: { start: string; end: string };
    };

    playfab?: {
        titleId: string;
        segmentId?: string;
        dataTypes?: ('player_data' | 'playstream_events' | 'leaderboards' | 'virtual_currency' | 'catalog_items' | 'player_statistics' | 'title_data')[];
        eventTypes?: string[];
        dateRange?: { start: string; end: string };
    };
}

export interface Integration {
    id: string;
    config: IntegrationConfig;
    status: IntegrationStatus;
    createdAt: string;
    updatedAt: string;
    lastSyncAt?: string;
    lastError?: string;
    metadata: {
        rowCount?: number;
        columnCount?: number;
        dataFreshness?: string;
        syncDuration?: number; // ms
    };
}

export interface SyncResult {
    success: boolean;
    rowCount: number;
    duration: number;
    error?: string;
    warnings?: string[];
}

// ============================================================================
// Integration Catalog (Available Integrations)
// ============================================================================

export interface IntegrationCatalogItem {
    type: IntegrationType;
    name: string;
    description: string;
    icon: string;
    tier: 1 | 2 | 3 | 4;
    complexity: 'low' | 'medium' | 'high';
    authMethods: AuthMethod['type'][];
    features: string[];
    docsUrl?: string;
}

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
    {
        type: 'google_sheets',
        name: 'Google Sheets',
        description: 'Import data from Google Spreadsheets with automatic sync',
        icon: '📊',
        tier: 1,
        complexity: 'low',
        authMethods: ['oauth'],
        features: ['Auto-detect range', 'Scheduled sync', 'Multi-sheet support'],
        docsUrl: 'https://developers.google.com/sheets/api',
    },
    {
        type: 'firebase',
        name: 'Firebase Analytics',
        description: 'Connect to Firebase for mobile game analytics',
        icon: '🔥',
        tier: 1,
        complexity: 'medium',
        authMethods: ['oauth', 'serviceAccount'],
        features: ['Event stream', 'User properties', 'Real-time'],
        docsUrl: 'https://firebase.google.com/docs/analytics',
    },
    {
        type: 'supabase',
        name: 'Supabase',
        description: 'Connect to your Supabase PostgreSQL database',
        icon: '⚡',
        tier: 2,
        complexity: 'low',
        authMethods: ['apikey'],
        features: ['Table browser', 'Real-time sync', 'Query builder'],
        docsUrl: 'https://supabase.com/docs',
    },
    {
        type: 'postgresql',
        name: 'PostgreSQL',
        description: 'Direct connection to PostgreSQL databases',
        icon: '🐘',
        tier: 2,
        complexity: 'medium',
        authMethods: ['basic', 'connection'],
        features: ['Schema browser', 'Custom queries', 'SSL support'],
    },
    {
        type: 'mongodb',
        name: 'MongoDB',
        description: 'Connect to MongoDB collections',
        icon: '🍃',
        tier: 2,
        complexity: 'medium',
        authMethods: ['connection', 'basic'],
        features: ['Collection browser', 'Aggregation pipelines'],
    },
    {
        type: 'mysql',
        name: 'MySQL',
        description: 'Direct connection to MySQL databases',
        icon: '🐬',
        tier: 2,
        complexity: 'medium',
        authMethods: ['basic', 'connection'],
        features: ['Schema browser', 'Custom queries'],
    },
    {
        type: 'playfab',
        name: 'PlayFab',
        description: 'Microsoft PlayFab game services integration',
        icon: '🎮',
        tier: 3,
        complexity: 'medium',
        authMethods: ['apikey'],
        features: ['Player data', 'PlayStream events', 'Economy'],
        docsUrl: 'https://docs.microsoft.com/gaming/playfab',
    },
    {
        type: 'unity',
        name: 'Unity Gaming Services',
        description: 'Unity Analytics and Cloud Services',
        icon: '🎯',
        tier: 3,
        complexity: 'medium',
        authMethods: ['oauth', 'apikey'],
        features: ['Analytics events', 'Cloud Save', 'Remote Config'],
        docsUrl: 'https://docs.unity.com/ugs',
    },
    {
        type: 'webhook',
        name: 'Webhook',
        description: 'Receive real-time data via webhooks',
        icon: '🔗',
        tier: 1,
        complexity: 'low',
        authMethods: ['apikey', 'none'],
        features: ['Real-time events', 'Schema auto-detect', 'Buffering'],
    },
    {
        type: 'rest_api',
        name: 'REST API',
        description: 'Connect to any REST API endpoint',
        icon: '🌐',
        tier: 1,
        complexity: 'low',
        authMethods: ['none', 'bearer', 'apikey', 'basic'],
        features: ['Custom endpoints', 'Headers', 'Data path navigation'],
    },
];

// ============================================================================
// IndexedDB Operations (using unified db module)
// ============================================================================

const STORE_NAME = 'integrations';

// ============================================================================
// CRUD Operations
// ============================================================================

export async function saveIntegration(integration: Integration): Promise<void> {
    return dbPut(STORE_NAME, integration);
}

export async function getAllIntegrations(): Promise<Integration[]> {
    return dbGetAll(STORE_NAME);
}

export async function getIntegration(id: string): Promise<Integration | undefined> {
    return dbGet(STORE_NAME, id);
}

export async function deleteIntegration(id: string): Promise<void> {
    return dbDelete(STORE_NAME, id);
}

export async function getIntegrationsByType(type: IntegrationType): Promise<Integration[]> {
    return dbGetByIndex(STORE_NAME, 'type', type);
}

export async function getIntegrationsByStatus(status: IntegrationStatus): Promise<Integration[]> {
    return dbGetByIndex(STORE_NAME, 'status', status);
}

// ============================================================================
// Helper Functions
// ============================================================================

export function createIntegration(config: IntegrationConfig): Integration {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        config,
        status: 'disconnected',
        createdAt: now,
        updatedAt: now,
        metadata: {},
    };
}

export function updateIntegrationStatus(
    integration: Integration,
    status: IntegrationStatus,
    error?: string
): Integration {
    return {
        ...integration,
        status,
        lastError: error,
        updatedAt: new Date().toISOString(),
    };
}

export function updateIntegrationSyncResult(
    integration: Integration,
    result: SyncResult
): Integration {
    return {
        ...integration,
        status: result.success ? 'connected' : 'error',
        lastSyncAt: new Date().toISOString(),
        lastError: result.error,
        updatedAt: new Date().toISOString(),
        metadata: {
            ...integration.metadata,
            rowCount: result.rowCount,
            syncDuration: result.duration,
            dataFreshness: new Date().toISOString(),
        },
    };
}

export function getCatalogItem(type: IntegrationType): IntegrationCatalogItem | undefined {
    return INTEGRATION_CATALOG.find(item => item.type === type);
}

export function getIntegrationDisplayName(integration: Integration): string {
    return integration.config.name || getCatalogItem(integration.config.type)?.name || 'Unknown';
}

export function getIntegrationIcon(type: IntegrationType): string {
    return getCatalogItem(type)?.icon || '📁';
}

export function formatLastSync(lastSyncAt?: string): string {
    if (!lastSyncAt) return 'Never';

    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return date.toLocaleDateString();
}

export function getStatusColor(status: IntegrationStatus): string {
    switch (status) {
        case 'connected': return 'text-[#7A8B5B]';
        case 'syncing': return 'text-[#DA7756]';
        case 'paused': return 'text-[#E5A84B]';
        case 'error': return 'text-[#E25C5C]';
        case 'disconnected': return 'text-zinc-500';
        default: return 'text-zinc-500';
    }
}

export function getStatusIcon(status: IntegrationStatus): string {
    switch (status) {
        case 'connected': return '🟢';
        case 'syncing': return '🔄';
        case 'paused': return '⏸️';
        case 'error': return '🔴';
        case 'disconnected': return '⚪';
        default: return '⚪';
    }
}
