/**
 * IndustryRegistry - Singleton registry for industry packs
 *
 * Manages registration, retrieval, and lifecycle of industry packs.
 * Provides pub/sub for pack changes to enable reactive updates.
 */

import {
  IndustryPack,
  IndustryType,
  RegistryEvent,
  RegistryListener,
  IndustrySemanticType,
  MetricDefinition,
  FunnelTemplate,
} from './types';

export class IndustryRegistry {
  private static instance: IndustryRegistry;
  private packs: Map<IndustryType, IndustryPack> = new Map();
  private listeners: Set<RegistryListener> = new Set();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): IndustryRegistry {
    if (!IndustryRegistry.instance) {
      IndustryRegistry.instance = new IndustryRegistry();
    }
    return IndustryRegistry.instance;
  }

  /**
   * Reset the registry (mainly for testing)
   */
  static reset(): void {
    if (IndustryRegistry.instance) {
      IndustryRegistry.instance.packs.clear();
      IndustryRegistry.instance.listeners.clear();
    }
  }

  /**
   * Register a new industry pack
   * @throws Error if pack with same ID already exists
   */
  registerPack(pack: IndustryPack): void {
    if (this.packs.has(pack.id)) {
      throw new Error(`Industry pack "${pack.id}" is already registered`);
    }

    this.validatePack(pack);
    this.packs.set(pack.id, pack);

    this.emit({
      type: 'registered',
      packId: pack.id,
      pack,
    });
  }

  /**
   * Unregister an industry pack
   */
  unregisterPack(id: IndustryType | string): boolean {
    const packId = id as IndustryType;
    const existed = this.packs.has(packId);

    if (existed) {
      this.packs.delete(packId);
      this.emit({
        type: 'unregistered',
        packId: id,
      });
    }

    return existed;
  }

  /**
   * Update an existing pack
   */
  updatePack(pack: IndustryPack): void {
    if (!this.packs.has(pack.id)) {
      throw new Error(`Industry pack "${pack.id}" not found`);
    }

    this.validatePack(pack);
    this.packs.set(pack.id, pack);

    this.emit({
      type: 'updated',
      packId: pack.id,
      pack,
    });
  }

  /**
   * Get a pack by ID
   */
  getPack(id: IndustryType | string): IndustryPack | undefined {
    return this.packs.get(id as IndustryType);
  }

  /**
   * Get all registered packs
   */
  getAllPacks(): IndustryPack[] {
    return Array.from(this.packs.values());
  }

  /**
   * Get all registered industry types
   */
  getRegisteredIndustries(): IndustryType[] {
    return Array.from(this.packs.keys());
  }

  /**
   * Check if a pack is registered
   */
  hasPack(id: IndustryType | string): boolean {
    return this.packs.has(id as IndustryType);
  }

  /**
   * Get all semantic types across all packs
   */
  getAllSemanticTypes(): IndustrySemanticType[] {
    const types: IndustrySemanticType[] = [];
    for (const pack of this.packs.values()) {
      types.push(...pack.semanticTypes);
    }
    return types;
  }

  /**
   * Get semantic types for a specific industry
   */
  getSemanticTypes(industryId: IndustryType): IndustrySemanticType[] {
    const pack = this.packs.get(industryId);
    return pack?.semanticTypes || [];
  }

  /**
   * Get metrics for a specific industry
   */
  getMetrics(industryId: IndustryType, subCategory?: string): MetricDefinition[] {
    const pack = this.packs.get(industryId);
    if (!pack) return [];

    if (subCategory) {
      return pack.metrics.filter(
        (m) => !m.subCategories || m.subCategories.includes(subCategory)
      );
    }

    return pack.metrics;
  }

  /**
   * Get funnels for a specific industry
   */
  getFunnels(industryId: IndustryType, subCategory?: string): FunnelTemplate[] {
    const pack = this.packs.get(industryId);
    if (!pack) return [];

    if (subCategory) {
      return pack.funnels.filter(
        (f) => !f.subCategories || f.subCategories.includes(subCategory)
      );
    }

    return pack.funnels;
  }

  /**
   * Get terminology for an industry
   */
  getTerminology(industryId: IndustryType, key: string): { singular: string; plural: string } | undefined {
    const pack = this.packs.get(industryId);
    return pack?.terminology[key];
  }

  /**
   * Get theme for an industry
   */
  getTheme(industryId: IndustryType) {
    const pack = this.packs.get(industryId);
    return pack?.theme;
  }

  /**
   * Subscribe to registry events
   */
  subscribe(listener: RegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: RegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in registry listener:', error);
      }
    }
  }

  /**
   * Validate a pack before registration
   */
  private validatePack(pack: IndustryPack): void {
    if (!pack.id) {
      throw new Error('Pack must have an id');
    }
    if (!pack.name) {
      throw new Error('Pack must have a name');
    }
    if (!pack.version) {
      throw new Error('Pack must have a version');
    }
    if (!Array.isArray(pack.subCategories)) {
      throw new Error('Pack must have subCategories array');
    }
    if (!Array.isArray(pack.semanticTypes)) {
      throw new Error('Pack must have semanticTypes array');
    }
    if (!Array.isArray(pack.metrics)) {
      throw new Error('Pack must have metrics array');
    }

    // Validate semantic types have unique identifiers
    const typeIds = new Set<string>();
    for (const type of pack.semanticTypes) {
      if (typeIds.has(type.type)) {
        throw new Error(`Duplicate semantic type: ${type.type}`);
      }
      typeIds.add(type.type);
    }

    // Validate metrics have unique identifiers
    const metricIds = new Set<string>();
    for (const metric of pack.metrics) {
      if (metricIds.has(metric.id)) {
        throw new Error(`Duplicate metric id: ${metric.id}`);
      }
      metricIds.add(metric.id);
    }
  }

  /**
   * Find semantic type by pattern match
   */
  findSemanticType(columnName: string, industryId?: IndustryType): {
    type: IndustrySemanticType;
    industry: IndustryType;
    confidence: number;
  } | undefined {
    const normalizedName = columnName.toLowerCase().replace(/[_\-\s]/g, '');
    const packsToSearch = industryId
      ? [this.packs.get(industryId)].filter(Boolean)
      : this.getAllPacks();

    let bestMatch: {
      type: IndustrySemanticType;
      industry: IndustryType;
      confidence: number;
    } | undefined;

    for (const pack of packsToSearch) {
      if (!pack) continue;

      for (const semanticType of pack.semanticTypes) {
        for (const pattern of semanticType.patterns) {
          const normalizedPattern = pattern.toLowerCase().replace(/[_\-\s]/g, '');

          // Exact match
          if (normalizedName === normalizedPattern) {
            const confidence = 1.0;
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = { type: semanticType, industry: pack.id, confidence };
            }
          }
          // Contains match
          else if (normalizedName.includes(normalizedPattern) || normalizedPattern.includes(normalizedName)) {
            const confidence = 0.7;
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = { type: semanticType, industry: pack.id, confidence };
            }
          }
        }
      }
    }

    return bestMatch;
  }
}

// Export singleton getter for convenience
export const getIndustryRegistry = () => IndustryRegistry.getInstance();
