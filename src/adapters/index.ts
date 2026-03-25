/**
 * Adapter module exports.
 *
 * This is the narrow public surface for built-in adapters and shared adapter
 * base types. Keep the list explicit so the module stays predictable.
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

// File & API
export { FileAdapter } from './FileAdapter';
export { APIAdapter } from './APIAdapter';
export type { APIAdapterConfig } from './APIAdapter';
