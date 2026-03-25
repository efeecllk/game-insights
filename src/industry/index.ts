/**
 * Industry Module - Multi-industry analytics abstraction layer
 *
 * This module provides the foundation for industry-agnostic analytics.
 * It defines types, registry, detection, and the built-in pack surface.
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

// Built-in industry packs
export {
  GamingPack,
  loadGamingPack,
  SaaSPack,
  loadSaaSPack,
  EcommercePack,
  loadEcommercePack,
  FintechPack,
  loadFintechPack,
  registerBuiltInPacks,
  getBuiltInPacks,
} from './packs';
