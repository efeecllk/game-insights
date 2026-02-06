/**
 * Adapter Module Exports
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
