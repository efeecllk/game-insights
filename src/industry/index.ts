/**
 * Industry Module - Multi-industry analytics abstraction layer
 *
 * This module provides the foundation for industry-agnostic analytics.
 * It defines types, registry, and detection for different industry packs.
 */

// Core types
export * from './types';

// Registry
export { IndustryRegistry, getIndustryRegistry } from './IndustryRegistry';

// Detection
export { IndustryDetector, createIndustryDetector } from './IndustryDetector';
export type { DetectorConfig } from './IndustryDetector';

// Pack import/export
export { PackExporter } from './PackExporter';
export type { PackExportMetadata, ExportedPack, ImportValidation } from './PackExporter';

// Pack development kit
export { PackDevKit, createPack, extendPack } from './PackDevKit';

// Industry packs
export * from './packs';
