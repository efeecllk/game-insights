/**
 * Adapter Factory
 * Creates adapter instances from Integration configurations
 * Phase 3: One-Click Integrations
 */

import { BaseAdapter } from '../adapters/BaseAdapter';
import { GoogleSheetsAdapter } from '../adapters/GoogleSheetsAdapter';
import { SupabaseAdapter } from '../adapters/SupabaseAdapter';
import { PostgreSQLAdapter } from '../adapters/PostgreSQLAdapter';
import { WebhookAdapter } from '../adapters/WebhookAdapter';
import { APIAdapter } from '../adapters/APIAdapter';
import { Integration } from './integrationStore';

// ============================================================================
// Types
// ============================================================================

export interface AdapterInstance {
    adapter: BaseAdapter;
    integration: Integration;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an adapter instance from an Integration configuration
 */
export function createAdapter(integration: Integration): BaseAdapter {
    const { type } = integration.config;

    switch (type) {
        case 'google_sheets':
            return new GoogleSheetsAdapter();

        case 'supabase':
            return new SupabaseAdapter();

        case 'postgresql':
            return new PostgreSQLAdapter();

        case 'webhook':
            return new WebhookAdapter();

        case 'rest_api':
            return new APIAdapter();

        case 'firebase':
        case 'mongodb':
        case 'mysql':
        case 'playfab':
        case 'unity':
            throw new Error(`Adapter for "${type}" is not yet implemented`);

        default:
            throw new Error(`Unknown integration type: ${type}`);
    }
}

/**
 * Connect an adapter using the integration's configuration
 */
export async function connectAdapter(
    adapter: BaseAdapter,
    integration: Integration
): Promise<void> {
    const config = buildAdapterConfig(integration);
    // Type assertion is safe here because buildAdapterConfig constructs
    // the correct config type for each adapter based on integration type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await adapter.connect(config as any);
}

/**
 * Build adapter-specific configuration from Integration
 */
function buildAdapterConfig(integration: Integration): Record<string, unknown> {
    const { type, name, auth } = integration.config;
    const base = { name, type };

    switch (type) {
        case 'google_sheets':
            return {
                ...base,
                spreadsheetId: integration.config.googleSheets?.spreadsheetId || '',
                sheetName: integration.config.googleSheets?.sheetName,
                range: integration.config.googleSheets?.range,
                hasHeaderRow: integration.config.googleSheets?.hasHeaderRow ?? true,
            };

        case 'supabase':
            return {
                ...base,
                projectUrl: integration.config.supabase?.projectUrl || '',
                apiKey: auth.type === 'apikey' ? auth.key : '',
                tableName: integration.config.supabase?.tableName || '',
                selectColumns: integration.config.supabase?.selectColumns,
            };

        case 'postgresql':
            return {
                ...base,
                proxyUrl: '/api/postgres', // Default proxy endpoint
                host: integration.config.postgresql?.host || '',
                port: integration.config.postgresql?.port || 5432,
                database: integration.config.postgresql?.database || '',
                username: auth.type === 'basic' ? auth.username : '',
                password: auth.type === 'basic' ? auth.password : '',
                ssl: integration.config.postgresql?.ssl ?? true,
                schema: integration.config.postgresql?.schema,
                tableName: integration.config.postgresql?.tableName,
                customQuery: integration.config.postgresql?.query,
            };

        case 'webhook':
            return {
                ...base,
                receiverUrl: '/api/webhooks', // Default receiver endpoint
                endpointId: integration.id,
                secretKey: auth.type === 'apikey' ? auth.key : undefined,
                maxBufferSize: 1000,
                autoDetectSchema: true,
            };

        case 'rest_api':
            return {
                ...base,
                endpoint: '', // Would need to be configured
                authType: auth.type === 'bearer' ? 'bearer' : auth.type,
                authValue: auth.type === 'apikey' ? auth.key : auth.type === 'bearer' ? auth.token : undefined,
            };

        default:
            return base;
    }
}

// ============================================================================
// Adapter Registry (Runtime)
// ============================================================================

const activeAdapters = new Map<string, BaseAdapter>();

/**
 * Get or create an adapter instance for an integration
 */
export async function getAdapterForIntegration(
    integration: Integration
): Promise<BaseAdapter> {
    // Check if we have an active adapter
    const existing = activeAdapters.get(integration.id);
    if (existing) {
        return existing;
    }

    // Create new adapter
    const adapter = createAdapter(integration);
    await connectAdapter(adapter, integration);

    // Store for reuse
    activeAdapters.set(integration.id, adapter);

    return adapter;
}

/**
 * Disconnect and remove an adapter instance
 */
export async function disconnectAdapter(integrationId: string): Promise<void> {
    const adapter = activeAdapters.get(integrationId);
    if (adapter) {
        await adapter.disconnect();
        activeAdapters.delete(integrationId);
    }
}

/**
 * Disconnect all active adapters
 */
export async function disconnectAllAdapters(): Promise<void> {
    const disconnectPromises = Array.from(activeAdapters.entries()).map(
        async ([id, adapter]) => {
            try {
                await adapter.disconnect();
            } catch (error) {
                console.error(`Failed to disconnect adapter ${id}:`, error);
            }
        }
    );

    await Promise.all(disconnectPromises);
    activeAdapters.clear();
}

/**
 * Get all active adapter IDs
 */
export function getActiveAdapterIds(): string[] {
    return Array.from(activeAdapters.keys());
}

/**
 * Check if an adapter is currently active
 */
export function isAdapterActive(integrationId: string): boolean {
    return activeAdapters.has(integrationId);
}
