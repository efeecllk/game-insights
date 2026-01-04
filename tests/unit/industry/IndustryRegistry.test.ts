/**
 * IndustryRegistry Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IndustryRegistry, getIndustryRegistry } from '../../../src/industry/IndustryRegistry';
import { IndustryPack, IndustryType, RegistryEvent } from '../../../src/industry/types';

// Create a minimal valid pack for testing
const createTestPack = (id: IndustryType, name: string = 'Test Pack'): IndustryPack => ({
  id,
  name,
  version: '1.0.0',
  description: `Test ${name} pack`,
  icon: 'TestIcon',
  subCategories: [{ id: 'default', name: 'Default', description: 'Default sub-category' }],
  semanticTypes: [
    {
      type: 'test_field',
      category: 'core',
      patterns: ['test', 'test_field'],
      priority: 5,
    },
  ],
  detectionIndicators: [
    {
      types: ['test_field'],
      weight: 1.0,
      reason: 'Test indicator',
    },
  ],
  metrics: [
    {
      id: 'test_metric',
      name: 'Test Metric',
      description: 'A test metric',
      category: 'engagement',
      unit: 'count',
      formula: {
        expression: 'count(test_field)',
        requiredTypes: ['test_field'],
      },
      benchmark: { good: 100, average: 50, bad: 10 },
    },
  ],
  funnels: [],
  charts: [],
  terminology: {
    user: { singular: 'User', plural: 'Users' },
  },
  theme: {
    primaryColor: '#8b5cf6',
    accentColor: '#6366f1',
  },
});

describe('IndustryRegistry', () => {
  beforeEach(() => {
    IndustryRegistry.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = IndustryRegistry.getInstance();
      const instance2 = IndustryRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should return same instance via getIndustryRegistry helper', () => {
      const instance1 = IndustryRegistry.getInstance();
      const instance2 = getIndustryRegistry();

      expect(instance1).toBe(instance2);
    });
  });

  describe('registerPack', () => {
    it('should register a valid pack', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      expect(registry.hasPack('gaming')).toBe(true);
      expect(registry.getPack('gaming')).toBe(pack);
    });

    it('should throw error for duplicate pack registration', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      expect(() => registry.registerPack(pack)).toThrow('already registered');
    });

    it('should emit registered event', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');
      const listener = vi.fn();

      registry.subscribe(listener);
      registry.registerPack(pack);

      expect(listener).toHaveBeenCalledWith({
        type: 'registered',
        packId: 'gaming',
        pack,
      });
    });

    it('should validate pack has required fields', () => {
      const registry = IndustryRegistry.getInstance();

      expect(() => registry.registerPack({ id: '' } as IndustryPack)).toThrow('must have an id');
      expect(() => registry.registerPack({ id: 'gaming', name: '' } as IndustryPack)).toThrow('must have a name');
      expect(() => registry.registerPack({ id: 'gaming', name: 'Test', version: '' } as IndustryPack)).toThrow('must have a version');
    });

    it('should validate semantic types are unique', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');
      pack.semanticTypes.push({
        type: 'test_field',
        category: 'core',
        patterns: ['duplicate'],
        priority: 5,
      });

      expect(() => registry.registerPack(pack)).toThrow('Duplicate semantic type');
    });

    it('should validate metric ids are unique', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');
      pack.metrics.push({
        id: 'test_metric',
        name: 'Duplicate Metric',
        description: 'Duplicate',
        category: 'engagement',
        unit: 'count',
        formula: { expression: 'count(x)', requiredTypes: [] },
        benchmark: { good: 1, average: 0, bad: 0 },
      });

      expect(() => registry.registerPack(pack)).toThrow('Duplicate metric id');
    });
  });

  describe('unregisterPack', () => {
    it('should unregister an existing pack', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);
      const result = registry.unregisterPack('gaming');

      expect(result).toBe(true);
      expect(registry.hasPack('gaming')).toBe(false);
    });

    it('should return false for non-existing pack', () => {
      const registry = IndustryRegistry.getInstance();

      const result = registry.unregisterPack('gaming');

      expect(result).toBe(false);
    });

    it('should emit unregistered event', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');
      const listener = vi.fn();

      registry.registerPack(pack);
      registry.subscribe(listener);
      registry.unregisterPack('gaming');

      expect(listener).toHaveBeenCalledWith({
        type: 'unregistered',
        packId: 'gaming',
      });
    });
  });

  describe('updatePack', () => {
    it('should update an existing pack', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      const updatedPack = { ...pack, version: '2.0.0' };
      registry.updatePack(updatedPack);

      expect(registry.getPack('gaming')?.version).toBe('2.0.0');
    });

    it('should throw error for non-existing pack', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      expect(() => registry.updatePack(pack)).toThrow('not found');
    });

    it('should emit updated event', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');
      const listener = vi.fn();

      registry.registerPack(pack);
      registry.subscribe(listener);

      const updatedPack = { ...pack, version: '2.0.0' };
      registry.updatePack(updatedPack);

      expect(listener).toHaveBeenCalledWith({
        type: 'updated',
        packId: 'gaming',
        pack: updatedPack,
      });
    });
  });

  describe('getPack', () => {
    it('should return pack by id', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      expect(registry.getPack('gaming')).toBe(pack);
    });

    it('should return undefined for non-existing pack', () => {
      const registry = IndustryRegistry.getInstance();

      expect(registry.getPack('gaming')).toBeUndefined();
    });
  });

  describe('getAllPacks', () => {
    it('should return all registered packs', () => {
      const registry = IndustryRegistry.getInstance();
      const gamingPack = createTestPack('gaming');
      const saasPack = createTestPack('saas', 'SaaS Pack');

      registry.registerPack(gamingPack);
      registry.registerPack(saasPack);

      const packs = registry.getAllPacks();

      expect(packs).toHaveLength(2);
      expect(packs).toContain(gamingPack);
      expect(packs).toContain(saasPack);
    });

    it('should return empty array when no packs registered', () => {
      const registry = IndustryRegistry.getInstance();

      expect(registry.getAllPacks()).toEqual([]);
    });
  });

  describe('getRegisteredIndustries', () => {
    it('should return all registered industry types', () => {
      const registry = IndustryRegistry.getInstance();

      registry.registerPack(createTestPack('gaming'));
      registry.registerPack(createTestPack('saas'));

      const industries = registry.getRegisteredIndustries();

      expect(industries).toContain('gaming');
      expect(industries).toContain('saas');
    });
  });

  describe('getAllSemanticTypes', () => {
    it('should return semantic types from all packs', () => {
      const registry = IndustryRegistry.getInstance();
      const gamingPack = createTestPack('gaming');
      const saasPack = createTestPack('saas', 'SaaS');
      saasPack.semanticTypes = [
        { type: 'mrr', category: 'revenue', patterns: ['mrr', 'monthly_recurring'], priority: 9 },
      ];

      registry.registerPack(gamingPack);
      registry.registerPack(saasPack);

      const types = registry.getAllSemanticTypes();

      expect(types).toHaveLength(2);
      expect(types.map((t) => t.type)).toContain('test_field');
      expect(types.map((t) => t.type)).toContain('mrr');
    });
  });

  describe('getSemanticTypes', () => {
    it('should return semantic types for specific industry', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      const types = registry.getSemanticTypes('gaming');

      expect(types).toHaveLength(1);
      expect(types[0].type).toBe('test_field');
    });

    it('should return empty array for non-existing industry', () => {
      const registry = IndustryRegistry.getInstance();

      expect(registry.getSemanticTypes('gaming')).toEqual([]);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics for specific industry', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      const metrics = registry.getMetrics('gaming');

      expect(metrics).toHaveLength(1);
      expect(metrics[0].id).toBe('test_metric');
    });

    it('should filter metrics by sub-category', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');
      pack.metrics.push({
        id: 'puzzle_metric',
        name: 'Puzzle Metric',
        description: 'Puzzle specific',
        category: 'engagement',
        unit: 'count',
        formula: { expression: 'count(x)', requiredTypes: [] },
        benchmark: { good: 1, average: 0, bad: 0 },
        subCategories: ['puzzle'],
      });

      registry.registerPack(pack);

      const allMetrics = registry.getMetrics('gaming');
      const puzzleMetrics = registry.getMetrics('gaming', 'puzzle');

      expect(allMetrics).toHaveLength(2);
      expect(puzzleMetrics).toHaveLength(2); // test_metric (no subcategory filter) + puzzle_metric
    });
  });

  describe('getFunnels', () => {
    it('should return funnels for specific industry', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');
      pack.funnels = [
        {
          id: 'tutorial_funnel',
          name: 'Tutorial Funnel',
          description: 'Tutorial completion',
          steps: [],
        },
      ];

      registry.registerPack(pack);

      const funnels = registry.getFunnels('gaming');

      expect(funnels).toHaveLength(1);
      expect(funnels[0].id).toBe('tutorial_funnel');
    });
  });

  describe('getTerminology', () => {
    it('should return terminology for specific industry', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      const term = registry.getTerminology('gaming', 'user');

      expect(term).toEqual({ singular: 'User', plural: 'Users' });
    });

    it('should return undefined for non-existing key', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      expect(registry.getTerminology('gaming', 'nonexistent')).toBeUndefined();
    });
  });

  describe('getTheme', () => {
    it('should return theme for specific industry', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      const theme = registry.getTheme('gaming');

      expect(theme).toEqual({
        primaryColor: '#8b5cf6',
        accentColor: '#6366f1',
      });
    });
  });

  describe('subscribe', () => {
    it('should allow subscribing to events', () => {
      const registry = IndustryRegistry.getInstance();
      const listener = vi.fn();

      const unsubscribe = registry.subscribe(listener);
      registry.registerPack(createTestPack('gaming'));

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it('should allow unsubscribing from events', () => {
      const registry = IndustryRegistry.getInstance();
      const listener = vi.fn();

      const unsubscribe = registry.subscribe(listener);
      unsubscribe();

      registry.registerPack(createTestPack('gaming'));

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const registry = IndustryRegistry.getInstance();
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      registry.subscribe(errorListener);
      registry.subscribe(normalListener);

      registry.registerPack(createTestPack('gaming'));

      expect(normalListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('findSemanticType', () => {
    it('should find exact match semantic type', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      const result = registry.findSemanticType('test_field');

      expect(result).toBeDefined();
      expect(result?.type.type).toBe('test_field');
      expect(result?.confidence).toBe(1.0);
    });

    it('should find partial match semantic type', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      const result = registry.findSemanticType('my_test_field_column');

      expect(result).toBeDefined();
      expect(result?.type.type).toBe('test_field');
      expect(result?.confidence).toBe(0.7);
    });

    it('should return undefined for no match', () => {
      const registry = IndustryRegistry.getInstance();
      const pack = createTestPack('gaming');

      registry.registerPack(pack);

      const result = registry.findSemanticType('completely_different_column');

      expect(result).toBeUndefined();
    });

    it('should search within specific industry', () => {
      const registry = IndustryRegistry.getInstance();
      const gamingPack = createTestPack('gaming');
      const saasPack = createTestPack('saas');
      saasPack.semanticTypes = [
        { type: 'mrr', category: 'revenue', patterns: ['mrr'], priority: 9 },
      ];

      registry.registerPack(gamingPack);
      registry.registerPack(saasPack);

      const result = registry.findSemanticType('mrr', 'gaming');

      expect(result).toBeUndefined(); // mrr not in gaming pack
    });
  });

  describe('reset', () => {
    it('should clear all packs and listeners', () => {
      const registry = IndustryRegistry.getInstance();
      const listener = vi.fn();

      registry.registerPack(createTestPack('gaming'));
      registry.subscribe(listener);

      IndustryRegistry.reset();

      expect(registry.getAllPacks()).toEqual([]);

      // Verify listener was removed by registering a new pack
      registry.registerPack(createTestPack('saas'));
      expect(listener).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'registered', packId: 'saas' }));
    });
  });
});
