/**
 * Adapter Module Exports
 * Phase 3: One-Click Integrations
 */

// Base
export {
    BaseAdapter,
    adapterRegistry
} from './BaseAdapter';

export type {
    AdapterConfig,
    AdapterType,
    SchemaInfo,
    ColumnInfo,
    NormalizedData,
    DataQuery,
    QueryFilter,
    AdapterCapabilities
} from './BaseAdapter';

// File & API (Phase 1)
export { FileAdapter } from './FileAdapter';
export { APIAdapter } from './APIAdapter';
export type { APIAdapterConfig } from './APIAdapter';

// Cloud Integrations (Phase 3)
export { GoogleSheetsAdapter } from './GoogleSheetsAdapter';
export type { GoogleSheetsConfig, GoogleAuthTokens } from './GoogleSheetsAdapter';

export { SupabaseAdapter } from './SupabaseAdapter';
export type { SupabaseConfig } from './SupabaseAdapter';

export { PostgreSQLAdapter } from './PostgreSQLAdapter';
export type { PostgreSQLConfig } from './PostgreSQLAdapter';

export { WebhookAdapter } from './WebhookAdapter';
export type { WebhookConfig, WebhookEvent } from './WebhookAdapter';
