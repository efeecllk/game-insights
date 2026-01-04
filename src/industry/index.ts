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

// Industry packs will be exported from ./packs/
