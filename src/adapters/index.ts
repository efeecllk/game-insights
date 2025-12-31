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

export { FirebaseAdapter } from './FirebaseAdapter';
export type {
    FirebaseConfig,
    FirebaseServiceAccount,
    FirebaseEvent,
    FirebaseUserProperty,
    FirebaseStandardEvent
} from './FirebaseAdapter';

export { PlayFabAdapter } from './PlayFabAdapter';
export type {
    PlayFabConfig,
    PlayFabDataType,
    PlayFabPlayer,
    PlayFabPlayerProfile,
    PlayStreamEvent,
    PlayFabLeaderboard,
    PlayFabCatalogItem,
    PlayFabVirtualCurrency
} from './PlayFabAdapter';

export { UnityAdapter } from './UnityAdapter';
export type {
    UnityConfig,
    UnityDataType,
    UnityAnalyticsEvent,
    UnityPlayer,
    UnityCloudSaveItem,
    UnityEconomyPurchase,
    UnityEconomyCurrency,
    UnityEconomyBalance,
    UnityInventoryItem,
    UnityRemoteConfigValue
} from './UnityAdapter';
