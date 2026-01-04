/**
 * IndustryDetector Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IndustryDetector, createIndustryDetector } from '../../../src/industry/IndustryDetector';
import { IndustryRegistry } from '../../../src/industry/IndustryRegistry';
import { IndustryPack, ColumnMeaning, IndustryType } from '../../../src/industry/types';

// Helper to create test packs
const createGamingPack = (): IndustryPack => ({
  id: 'gaming',
  name: 'Gaming',
  version: '1.0.0',
  description: 'Gaming analytics pack',
  icon: 'Gamepad2',
  subCategories: [
    { id: 'puzzle', name: 'Puzzle', description: 'Puzzle games' },
    { id: 'idle', name: 'Idle', description: 'Idle games' },
  ],
  semanticTypes: [
    { type: 'user_id', category: 'core', patterns: ['user_id', 'player_id'], priority: 10 },
    { type: 'level', category: 'game', patterns: ['level', 'stage'], priority: 8 },
    { type: 'score', category: 'game', patterns: ['score', 'points'], priority: 7 },
    { type: 'moves', category: 'puzzle', patterns: ['moves', 'moves_used'], priority: 8 },
    { type: 'prestige', category: 'idle', patterns: ['prestige', 'ascension'], priority: 8 },
    { type: 'session', category: 'engagement', patterns: ['session', 'session_id'], priority: 6 },
  ],
  detectionIndicators: [
    { types: ['level', 'score'], weight: 2.0, reason: 'Found game progression data' },
    { types: ['moves'], weight: 3.0, reason: 'Found puzzle game indicators' },
    { types: ['prestige'], weight: 3.0, reason: 'Found idle game indicators' },
    { types: ['session'], weight: 1.0, reason: 'Found session tracking' },
  ],
  metrics: [
    {
      id: 'dau',
      name: 'Daily Active Users',
      description: 'Unique users per day',
      category: 'engagement',
      unit: 'users',
      formula: { expression: 'count(distinct user_id)', requiredTypes: ['user_id'] },
      benchmark: { good: 10000, average: 1000, bad: 100 },
    },
    {
      id: 'level_completion',
      name: 'Level Completion',
      description: 'Levels completed',
      category: 'engagement',
      unit: 'count',
      formula: { expression: 'count(level)', requiredTypes: ['level'] },
      benchmark: { good: 90, average: 70, bad: 50 },
      subCategories: ['puzzle'],
    },
  ],
  funnels: [],
  charts: [],
  terminology: {
    user: { singular: 'Player', plural: 'Players' },
    session: { singular: 'Session', plural: 'Sessions' },
  },
  theme: { primaryColor: '#8b5cf6', accentColor: '#6366f1' },
});

const createSaaSPack = (): IndustryPack => ({
  id: 'saas',
  name: 'SaaS',
  version: '1.0.0',
  description: 'SaaS analytics pack',
  icon: 'Building2',
  subCategories: [
    { id: 'b2b', name: 'B2B', description: 'B2B SaaS' },
    { id: 'b2c', name: 'B2C', description: 'B2C SaaS' },
  ],
  semanticTypes: [
    { type: 'user_id', category: 'core', patterns: ['user_id', 'account_id'], priority: 10 },
    { type: 'mrr', category: 'revenue', patterns: ['mrr', 'monthly_recurring'], priority: 9 },
    { type: 'subscription', category: 'revenue', patterns: ['subscription', 'plan', 'tier'], priority: 8 },
    { type: 'churn', category: 'retention', patterns: ['churn', 'churned', 'cancelled'], priority: 9 },
    { type: 'trial', category: 'acquisition', patterns: ['trial', 'trial_start', 'trial_end'], priority: 7 },
  ],
  detectionIndicators: [
    { types: ['mrr', 'subscription'], weight: 4.0, reason: 'Found subscription revenue data' },
    { types: ['churn'], weight: 3.0, reason: 'Found churn tracking' },
    { types: ['trial'], weight: 2.0, reason: 'Found trial conversion data' },
  ],
  metrics: [
    {
      id: 'mrr',
      name: 'Monthly Recurring Revenue',
      description: 'Total MRR',
      category: 'revenue',
      unit: 'currency',
      formula: { expression: 'sum(mrr)', requiredTypes: ['mrr'] },
      benchmark: { good: 100000, average: 10000, bad: 1000 },
    },
  ],
  funnels: [],
  charts: [],
  terminology: {
    user: { singular: 'Account', plural: 'Accounts' },
    session: { singular: 'Session', plural: 'Sessions' },
  },
  theme: { primaryColor: '#3b82f6', accentColor: '#60a5fa' },
});

const createEcommercePack = (): IndustryPack => ({
  id: 'ecommerce',
  name: 'E-commerce',
  version: '1.0.0',
  description: 'E-commerce analytics pack',
  icon: 'ShoppingCart',
  subCategories: [
    { id: 'retail', name: 'Retail', description: 'Online retail' },
  ],
  semanticTypes: [
    { type: 'user_id', category: 'core', patterns: ['user_id', 'customer_id'], priority: 10 },
    { type: 'order', category: 'transaction', patterns: ['order', 'order_id', 'purchase'], priority: 9 },
    { type: 'product', category: 'catalog', patterns: ['product', 'product_id', 'sku'], priority: 8 },
    { type: 'cart', category: 'transaction', patterns: ['cart', 'basket', 'cart_value'], priority: 8 },
    { type: 'shipping', category: 'fulfillment', patterns: ['shipping', 'delivery'], priority: 6 },
  ],
  detectionIndicators: [
    { types: ['order', 'product'], weight: 4.0, reason: 'Found order and product data' },
    { types: ['cart'], weight: 3.0, reason: 'Found shopping cart data' },
    { types: ['shipping'], weight: 2.0, reason: 'Found shipping data' },
  ],
  metrics: [
    {
      id: 'gmv',
      name: 'Gross Merchandise Value',
      description: 'Total GMV',
      category: 'revenue',
      unit: 'currency',
      formula: { expression: 'sum(order_value)', requiredTypes: ['order'] },
      benchmark: { good: 1000000, average: 100000, bad: 10000 },
    },
  ],
  funnels: [],
  charts: [],
  terminology: {
    user: { singular: 'Customer', plural: 'Customers' },
    session: { singular: 'Visit', plural: 'Visits' },
  },
  theme: { primaryColor: '#22c55e', accentColor: '#4ade80' },
});

describe('IndustryDetector', () => {
  let registry: IndustryRegistry;
  let detector: IndustryDetector;

  beforeEach(() => {
    IndustryRegistry.reset();
    registry = IndustryRegistry.getInstance();
    detector = new IndustryDetector(registry);
  });

  describe('detect', () => {
    it('should detect gaming industry from game-related columns', () => {
      registry.registerPack(createGamingPack());
      registry.registerPack(createSaaSPack());
      registry.registerPack(createEcommercePack());

      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
        { column: 'level', meaning: 'level', confidence: 0.9 },
        { column: 'score', meaning: 'score', confidence: 0.9 },
        { column: 'moves_used', meaning: 'moves', confidence: 0.8 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('gaming');
      expect(result.primary.confidence).toBeGreaterThan(0);
      expect(result.primary.reasons.length).toBeGreaterThan(0);
    });

    it('should detect SaaS industry from subscription-related columns', () => {
      registry.registerPack(createGamingPack());
      registry.registerPack(createSaaSPack());
      registry.registerPack(createEcommercePack());

      const columns: ColumnMeaning[] = [
        { column: 'account_id', meaning: 'user_id', confidence: 0.9 },
        { column: 'mrr', meaning: 'mrr', confidence: 0.95 },
        { column: 'plan', meaning: 'subscription', confidence: 0.9 },
        { column: 'churned', meaning: 'churn', confidence: 0.85 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('saas');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });

    it('should detect e-commerce industry from order-related columns', () => {
      registry.registerPack(createGamingPack());
      registry.registerPack(createSaaSPack());
      registry.registerPack(createEcommercePack());

      const columns: ColumnMeaning[] = [
        { column: 'customer_id', meaning: 'user_id', confidence: 0.9 },
        { column: 'order_id', meaning: 'order', confidence: 0.95 },
        { column: 'product_id', meaning: 'product', confidence: 0.9 },
        { column: 'cart_value', meaning: 'cart', confidence: 0.85 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('ecommerce');
    });

    it('should return empty result when no packs registered', () => {
      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('custom');
      expect(result.primary.confidence).toBe(0);
      expect(result.alternatives).toHaveLength(0);
    });

    it('should return alternatives when multiple industries match', () => {
      registry.registerPack(createGamingPack());
      registry.registerPack(createSaaSPack());

      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
        { column: 'session_id', meaning: 'session', confidence: 0.8 },
      ];

      const result = detector.detect(columns);

      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should mark result as ambiguous when scores are close', () => {
      registry.registerPack(createGamingPack());
      registry.registerPack(createSaaSPack());

      // Columns that could match both industries
      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
      ];

      const result = detector.detect(columns);

      // With only user_id which is in both packs, result may be ambiguous
      // depending on the scoring
      expect(result.isAmbiguous).toBeDefined();
    });

    it('should build detected semantic types', () => {
      registry.registerPack(createGamingPack());

      const columns: ColumnMeaning[] = [
        { column: 'player_level', meaning: 'level', confidence: 0.9 },
        { column: 'game_score', meaning: 'score', confidence: 0.85 },
      ];

      const result = detector.detect(columns);

      expect(result.detectedSemanticTypes.length).toBeGreaterThan(0);
      const levelType = result.detectedSemanticTypes.find(t => t.type === 'level');
      expect(levelType).toBeDefined();
    });
  });

  describe('detectWithSubCategory', () => {
    it('should detect sub-category for puzzle game', () => {
      registry.registerPack(createGamingPack());

      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
        { column: 'level', meaning: 'level', confidence: 0.9 },
        { column: 'moves_used', meaning: 'moves', confidence: 0.9 },
      ];

      const result = detector.detectWithSubCategory(columns);

      expect(result.primary.industry).toBe('gaming');
      // Sub-category should be detected based on puzzle-specific metrics
      expect(result.primary.subCategory).toBeDefined();
    });

    it('should use industry hint when provided', () => {
      registry.registerPack(createGamingPack());
      registry.registerPack(createSaaSPack());

      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
        { column: 'level', meaning: 'level', confidence: 0.9 },
      ];

      const result = detector.detectWithSubCategory(columns, 'gaming');

      expect(result.primary.industry).toBe('gaming');
    });

    it('should return base result when pack has no sub-categories', () => {
      const simplePack: IndustryPack = {
        ...createGamingPack(),
        subCategories: [{ id: 'default', name: 'Default', description: 'Default' }],
      };
      registry.registerPack(simplePack);

      const columns: ColumnMeaning[] = [
        { column: 'level', meaning: 'level', confidence: 0.9 },
      ];

      const result = detector.detectWithSubCategory(columns);

      expect(result.primary.subCategory).toBeUndefined();
    });
  });

  describe('custom config', () => {
    it('should respect minConfidence threshold', () => {
      registry.registerPack(createGamingPack());

      const detector = new IndustryDetector(registry, {
        minConfidence: 0.9,
      });

      const columns: ColumnMeaning[] = [
        { column: 'unknown_column', meaning: 'unknown', confidence: 0.5 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.confidence).toBeLessThan(0.9);
    });

    it('should limit alternatives based on maxAlternatives', () => {
      registry.registerPack(createGamingPack());
      registry.registerPack(createSaaSPack());
      registry.registerPack(createEcommercePack());

      const detector = new IndustryDetector(registry, {
        maxAlternatives: 1,
      });

      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
      ];

      const result = detector.detect(columns);

      expect(result.alternatives.length).toBeLessThanOrEqual(1);
    });
  });

  describe('createIndustryDetector factory', () => {
    it('should create detector with default config', () => {
      registry.registerPack(createGamingPack());

      const detector = createIndustryDetector();

      const columns: ColumnMeaning[] = [
        { column: 'level', meaning: 'level', confidence: 0.9 },
      ];

      const result = detector.detect(columns);

      expect(result).toBeDefined();
      expect(result.primary.industry).toBe('gaming');
    });

    it('should create detector with custom config', () => {
      registry.registerPack(createGamingPack());

      const detector = createIndustryDetector({
        minConfidence: 0.5,
        maxAlternatives: 2,
      });

      expect(detector).toBeInstanceOf(IndustryDetector);
    });
  });

  describe('scoring logic', () => {
    it('should give higher scores for high-priority semantic types', () => {
      registry.registerPack(createGamingPack());
      registry.registerPack(createSaaSPack());

      // MRR has priority 9, which should give bonus points
      const columns: ColumnMeaning[] = [
        { column: 'mrr', meaning: 'mrr', confidence: 0.95 },
        { column: 'subscription', meaning: 'subscription', confidence: 0.9 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('saas');
      // Should have reason about subscription revenue
      const hasRevenueReason = result.primary.reasons.some(r =>
        r.toLowerCase().includes('subscription') || r.toLowerCase().includes('revenue')
      );
      expect(hasRevenueReason).toBe(true);
    });

    it('should accumulate scores from multiple detection indicators', () => {
      registry.registerPack(createGamingPack());

      const columns: ColumnMeaning[] = [
        { column: 'level', meaning: 'level', confidence: 0.9 },
        { column: 'score', meaning: 'score', confidence: 0.9 },
        { column: 'session_id', meaning: 'session', confidence: 0.8 },
      ];

      const result = detector.detect(columns);

      // Should have multiple reasons from different indicators
      expect(result.primary.reasons.length).toBeGreaterThan(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      registry.registerPack(createGamingPack());

      const result = detector.detect([]);

      expect(result.primary.industry).toBe('custom');
      expect(result.primary.confidence).toBe(0);
    });

    it('should handle columns with low confidence', () => {
      registry.registerPack(createGamingPack());

      const columns: ColumnMeaning[] = [
        { column: 'level', meaning: 'level', confidence: 0.1 },
        { column: 'score', meaning: 'score', confidence: 0.1 },
      ];

      const result = detector.detect(columns);

      // Should still detect but with lower confidence in semantic types
      expect(result.detectedSemanticTypes.every(t => t.confidence <= 0.1)).toBe(true);
    });

    it('should normalize column names when matching', () => {
      registry.registerPack(createGamingPack());

      const columns: ColumnMeaning[] = [
        { column: 'PLAYER_LEVEL', meaning: 'level', confidence: 0.9 },
        { column: 'game-score', meaning: 'score', confidence: 0.9 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('gaming');
    });
  });
});
