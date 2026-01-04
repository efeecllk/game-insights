/**
 * PackExporter and PackDevKit Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PackExporter, ExportedPack, ImportValidation } from '../../../src/industry/PackExporter';
import { PackDevKit, createPack, extendPack } from '../../../src/industry/PackDevKit';
import { IndustryPack, IndustryType } from '../../../src/industry/types';

// Helper to create a minimal valid pack
const createTestPack = (id: IndustryType = 'gaming'): IndustryPack => ({
  id,
  name: 'Test Pack',
  version: '1.0.0',
  description: 'A test pack',
  icon: 'TestIcon',
  subCategories: [{ id: 'default', name: 'Default', description: 'Default sub-category' }],
  semanticTypes: [
    { type: 'user_id', category: 'core', patterns: ['user_id', 'player_id'], priority: 10 },
    { type: 'level', category: 'game', patterns: ['level', 'stage'], priority: 8 },
  ],
  detectionIndicators: [
    { types: ['user_id', 'level'], weight: 2.0, reason: 'Found game data' },
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
  ],
  funnels: [
    {
      id: 'tutorial',
      name: 'Tutorial Funnel',
      description: 'Tutorial completion',
      steps: [
        { id: 'start', name: 'Started', semanticType: 'tutorial_start' },
        { id: 'complete', name: 'Completed', semanticType: 'tutorial_complete' },
      ],
    },
  ],
  charts: [],
  chartConfigs: { types: [], defaultCharts: [] },
  insightTemplates: [
    {
      id: 'retention_insight',
      name: 'Retention Insight',
      template: 'Retention is {{value}}%',
      requiredMetrics: ['retention'],
      priority: 1,
      category: 'retention',
    },
  ],
  terminology: {
    user: { singular: 'Player', plural: 'Players' },
    session: { singular: 'Session', plural: 'Sessions' },
  },
  theme: {
    primaryColor: '#8b5cf6',
    accentColor: '#6366f1',
    chartColors: ['#8b5cf6', '#6366f1', '#ec4899'],
  },
  metadata: {
    author: 'Test Author',
    homepage: 'https://test.com',
  },
});

describe('PackExporter', () => {
  describe('exportPack', () => {
    it('should export pack to JSON string', async () => {
      const pack = createTestPack();
      const exported = await PackExporter.exportPack(pack);

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported) as ExportedPack;
      expect(parsed.metadata).toBeDefined();
      expect(parsed.pack).toBeDefined();
      expect(parsed.checksum).toBeDefined();
    });

    it('should include metadata with export timestamp', async () => {
      const pack = createTestPack();
      const exported = await PackExporter.exportPack(pack);
      const parsed = JSON.parse(exported) as ExportedPack;

      expect(parsed.metadata.exportedAt).toBeDefined();
      expect(new Date(parsed.metadata.exportedAt)).toBeInstanceOf(Date);
      expect(parsed.metadata.exportVersion).toBe('1.0.0');
    });

    it('should use custom metadata when provided', async () => {
      const pack = createTestPack();
      const exported = await PackExporter.exportPack(pack, {
        author: 'Custom Author',
        description: 'Custom description',
        tags: ['test', 'custom'],
      });
      const parsed = JSON.parse(exported) as ExportedPack;

      expect(parsed.metadata.author).toBe('Custom Author');
      expect(parsed.metadata.description).toBe('Custom description');
      expect(parsed.metadata.tags).toEqual(['test', 'custom']);
    });

    it('should generate consistent checksum for same data', async () => {
      const pack = createTestPack();

      const exported1 = await PackExporter.exportPack(pack);
      const exported2 = await PackExporter.exportPack(pack);

      const parsed1 = JSON.parse(exported1) as ExportedPack;
      const parsed2 = JSON.parse(exported2) as ExportedPack;

      expect(parsed1.checksum).toBe(parsed2.checksum);
    });
  });

  describe('importPack', () => {
    it('should import a valid pack', async () => {
      const pack = createTestPack();
      const exported = await PackExporter.exportPack(pack);
      const result = await PackExporter.importPack(exported);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.pack).toBeDefined();
      expect(result.pack?.id).toBe('gaming');
    });

    it('should reject invalid JSON', async () => {
      const result = await PackExporter.importPack('not valid json');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Parse error'))).toBe(true);
    });

    it('should reject missing metadata', async () => {
      const result = await PackExporter.importPack('{"pack": {}}');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('missing metadata'))).toBe(true);
    });

    it('should reject missing pack', async () => {
      const result = await PackExporter.importPack('{"metadata": {}}');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('missing'))).toBe(true);
    });

    it('should warn on checksum mismatch', async () => {
      const pack = createTestPack();
      const exported = await PackExporter.exportPack(pack);
      const parsed = JSON.parse(exported);

      // Modify the checksum
      parsed.checksum = 'invalid_checksum';

      const result = await PackExporter.importPack(JSON.stringify(parsed));

      expect(result.warnings.some(w => w.includes('Checksum mismatch'))).toBe(true);
    });

    it('should validate required pack fields', async () => {
      const invalidPack = {
        metadata: { exportedAt: new Date().toISOString(), exportVersion: '1.0.0' },
        pack: { name: 'Test', version: '1.0.0' }, // missing id
        checksum: 'test',
      };

      const result = await PackExporter.importPack(JSON.stringify(invalidPack));

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
    });

    it('should validate semanticTypes is array', async () => {
      const invalidPack = {
        metadata: { exportedAt: new Date().toISOString(), exportVersion: '1.0.0' },
        pack: {
          id: 'gaming',
          name: 'Test',
          version: '1.0.0',
          subCategories: [],
          semanticTypes: 'not an array',
          metrics: [],
        },
        checksum: 'test',
      };

      const result = await PackExporter.importPack(JSON.stringify(invalidPack));

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('semanticTypes'))).toBe(true);
    });

    it('should detect duplicate semantic types', async () => {
      const invalidPack = {
        metadata: { exportedAt: new Date().toISOString(), exportVersion: '1.0.0' },
        pack: {
          id: 'gaming',
          name: 'Test',
          version: '1.0.0',
          subCategories: [],
          semanticTypes: [
            { type: 'user_id', patterns: ['user_id'], priority: 10 },
            { type: 'user_id', patterns: ['player_id'], priority: 10 }, // duplicate
          ],
          metrics: [],
        },
        checksum: 'test',
      };

      const result = await PackExporter.importPack(JSON.stringify(invalidPack));

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('duplicate'))).toBe(true);
    });

    it('should warn on missing theme', async () => {
      const packWithoutTheme = {
        metadata: { exportedAt: new Date().toISOString(), exportVersion: '1.0.0' },
        pack: {
          id: 'gaming',
          name: 'Test',
          version: '1.0.0',
          subCategories: [],
          semanticTypes: [],
          metrics: [],
        },
        checksum: 'test',
      };

      const result = await PackExporter.importPack(JSON.stringify(packWithoutTheme));

      expect(result.warnings.some(w => w.includes('theme'))).toBe(true);
    });
  });

  describe('mergePacks', () => {
    it('should merge base pack with overlay', () => {
      const base = createTestPack();
      const overlay: Partial<IndustryPack> = {
        name: 'Custom Pack',
        semanticTypes: [
          { type: 'custom_field', category: 'custom', patterns: ['custom'], priority: 5 },
        ],
        terminology: {
          custom: { singular: 'Custom', plural: 'Customs' },
        },
      };

      const merged = PackExporter.mergePacks(base, overlay);

      expect(merged.name).toBe('Custom Pack');
      expect(merged.id).toBe('gaming'); // preserved from base
      expect(merged.semanticTypes.length).toBe(3); // base + new
      expect(merged.terminology.custom).toBeDefined();
      expect(merged.terminology.user).toBeDefined(); // preserved from base
    });

    it('should not add duplicate sub-categories', () => {
      const base = createTestPack();
      const overlay: Partial<IndustryPack> = {
        subCategories: [
          { id: 'default', name: 'Different Default', description: 'Duplicate' },
          { id: 'new', name: 'New Category', description: 'New' },
        ],
      };

      const merged = PackExporter.mergePacks(base, overlay);

      // Should have base 'default' + new 'new', not duplicate 'default'
      expect(merged.subCategories.length).toBe(2);
      expect(merged.subCategories.find(sc => sc.id === 'default')?.name).toBe('Default');
    });

    it('should not add duplicate metrics', () => {
      const base = createTestPack();
      const overlay: Partial<IndustryPack> = {
        metrics: [
          {
            id: 'dau', // duplicate
            name: 'Different DAU',
            description: 'Different',
            category: 'engagement',
            unit: 'users',
            formula: { expression: 'different' },
            benchmark: { good: 1, average: 0, bad: 0 },
          },
          {
            id: 'new_metric',
            name: 'New Metric',
            description: 'New',
            category: 'engagement',
            unit: 'count',
            formula: { expression: 'new' },
            benchmark: { good: 1, average: 0, bad: 0 },
          },
        ],
      };

      const merged = PackExporter.mergePacks(base, overlay);

      expect(merged.metrics.length).toBe(2);
      expect(merged.metrics.find(m => m.id === 'dau')?.name).toBe('Daily Active Users');
    });

    it('should merge theme objects', () => {
      const base = createTestPack();
      const overlay: Partial<IndustryPack> = {
        theme: {
          primaryColor: '#ff0000',
        },
      };

      const merged = PackExporter.mergePacks(base, overlay);

      expect(merged.theme.primaryColor).toBe('#ff0000');
      expect(merged.theme.accentColor).toBe('#6366f1'); // preserved from base
    });
  });
});

describe('PackDevKit', () => {
  describe('builder pattern', () => {
    it('should create pack with fluent API', () => {
      const pack = createPack('gaming', 'Gaming Pack')
        .describe('A gaming analytics pack')
        .version('2.0.0')
        .addSubCategory('puzzle', 'Puzzle Games', 'Match-3 and puzzle games')
        .addSemanticType('level', ['level', 'stage'], { priority: 8 })
        .addSemanticType('score', ['score', 'points'], { priority: 7 })
        .addIndicator(['level', 'score'], 2.0, 'Found game data')
        .addTerm('user', 'Player', 'Players')
        .setTheme({ primaryColor: '#8b5cf6' })
        .buildUnsafe();

      expect(pack.id).toBe('gaming');
      expect(pack.name).toBe('Gaming Pack');
      expect(pack.version).toBe('2.0.0');
      expect(pack.subCategories).toHaveLength(1);
      expect(pack.semanticTypes).toHaveLength(2);
      expect(pack.detectionIndicators).toHaveLength(1);
      expect(pack.terminology.user.singular).toBe('Player');
    });

    it('should set description', () => {
      const pack = createPack('gaming', 'Gaming')
        .describe('My gaming pack')
        .buildUnsafe();

      expect(pack.description).toBe('My gaming pack');
    });

    it('should add multiple sub-categories', () => {
      const pack = createPack('gaming', 'Gaming')
        .addSubCategories([
          { id: 'puzzle', name: 'Puzzle', description: 'Puzzle games' },
          { id: 'idle', name: 'Idle', description: 'Idle games' },
        ])
        .buildUnsafe();

      expect(pack.subCategories).toHaveLength(2);
    });

    it('should add multiple semantic types', () => {
      const pack = createPack('gaming', 'Gaming')
        .addSemanticTypes([
          { type: 'level', category: 'game', patterns: ['level'], priority: 8 },
          { type: 'score', category: 'game', patterns: ['score'], priority: 7 },
        ])
        .buildUnsafe();

      expect(pack.semanticTypes).toHaveLength(2);
    });

    it('should add KPI metric with shorthand', () => {
      const pack = createPack('gaming', 'Gaming')
        .addKPI('dau', 'Daily Active Users', 'count(distinct user_id)', 'number', {
          description: 'Unique users per day',
        })
        .buildUnsafe();

      expect(pack.metrics).toHaveLength(1);
      expect(pack.metrics[0].id).toBe('dau');
      expect(pack.metrics[0].category).toBe('kpi');
    });

    it('should add full metric', () => {
      const pack = createPack('gaming', 'Gaming')
        .addMetric({
          id: 'retention_d1',
          name: 'D1 Retention',
          description: 'Day 1 retention rate',
          category: 'retention',
          unit: 'percent',
          formula: { expression: 'd1_users / d0_users * 100', requiredTypes: ['user_id'] },
          benchmark: { good: 40, average: 30, bad: 20 },
        })
        .buildUnsafe();

      expect(pack.metrics[0].category).toBe('retention');
    });

    it('should add funnel', () => {
      const pack = createPack('gaming', 'Gaming')
        .addFunnel({
          id: 'tutorial',
          name: 'Tutorial Funnel',
          steps: [
            { id: 'start', name: 'Started', semanticType: 'tutorial_start' },
            { id: 'complete', name: 'Completed', semanticType: 'tutorial_complete' },
          ],
        })
        .buildUnsafe();

      expect(pack.funnels).toHaveLength(1);
      expect(pack.funnels[0].steps).toHaveLength(2);
    });

    it('should add chart type', () => {
      const pack = createPack('gaming', 'Gaming')
        .addChartType({
          type: 'retention_curve',
          name: 'Retention Curve',
          description: 'Shows retention over time',
        })
        .setDefaultCharts(['retention_curve'])
        .buildUnsafe();

      expect(pack.chartConfigs.types).toHaveLength(1);
      expect(pack.chartConfigs.defaultCharts).toEqual(['retention_curve']);
    });

    it('should add insight template', () => {
      const pack = createPack('gaming', 'Gaming')
        .addInsight({
          id: 'retention_low',
          name: 'Low Retention Alert',
          template: 'D1 retention is {{value}}%, below the {{benchmark}}% benchmark',
          requiredMetrics: ['retention_d1'],
          priority: 1,
          category: 'retention',
        })
        .buildUnsafe();

      expect(pack.insightTemplates).toHaveLength(1);
    });

    it('should set full terminology', () => {
      const pack = createPack('gaming', 'Gaming')
        .setTerminology({
          user: { singular: 'Player', plural: 'Players' },
          session: { singular: 'Session', plural: 'Sessions' },
          event: { singular: 'Action', plural: 'Actions' },
        })
        .buildUnsafe();

      expect(Object.keys(pack.terminology)).toHaveLength(3);
    });

    it('should set metadata', () => {
      const pack = createPack('gaming', 'Gaming')
        .setMetadata({
          author: 'Test Author',
          homepage: 'https://test.com',
          license: 'MIT',
        })
        .buildUnsafe();

      expect(pack.metadata?.author).toBe('Test Author');
    });
  });

  describe('FunnelBuilder', () => {
    it('should create funnel with fluent API', () => {
      const pack = createPack('gaming', 'Gaming')
        .createFunnel('purchase', 'Purchase Funnel')
        .describe('User purchase flow')
        .addStep('view', 'View Item', 'item_view')
        .addStep('add', 'Add to Cart', 'add_to_cart')
        .addStep('purchase', 'Purchase', 'purchase')
        .forSubCategories(['puzzle', 'idle'])
        .build()
        .buildUnsafe();

      expect(pack.funnels).toHaveLength(1);
      expect(pack.funnels[0].id).toBe('purchase');
      expect(pack.funnels[0].steps).toHaveLength(3);
      expect(pack.funnels[0].subCategories).toEqual(['puzzle', 'idle']);
    });

    it('should add step with event patterns', () => {
      const pack = createPack('gaming', 'Gaming')
        .createFunnel('tutorial', 'Tutorial')
        .addStep('start', 'Started', 'tutorial_start', {
          eventPatterns: ['tutorial_start', 'onboarding_start'],
        })
        .build()
        .buildUnsafe();

      expect(pack.funnels[0].steps[0].eventPatterns).toHaveLength(2);
    });
  });

  describe('validation', () => {
    it('should validate required fields', () => {
      // Using buildUnsafe to bypass validation
      const builder = new PackDevKit('' as IndustryType, '');
      const validation = builder.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Pack ID is required');
      expect(validation.errors).toContain('Pack name is required');
    });

    it('should warn about empty arrays', () => {
      const builder = createPack('gaming', 'Gaming');
      const validation = builder.validate();

      expect(validation.warnings.some(w => w.includes('sub-categories'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('semantic types'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('metrics'))).toBe(true);
    });

    it('should detect duplicate semantic types', () => {
      const builder = createPack('gaming', 'Gaming')
        .addSemanticType('level', ['level'], { priority: 8 })
        .addSemanticType('level', ['stage'], { priority: 8 }); // duplicate

      const validation = builder.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Duplicate semantic type'))).toBe(true);
    });

    it('should detect duplicate metrics', () => {
      const builder = createPack('gaming', 'Gaming')
        .addKPI('dau', 'DAU', 'count(user_id)')
        .addKPI('dau', 'DAU2', 'count(user_id)'); // duplicate

      const validation = builder.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Duplicate metric'))).toBe(true);
    });

    it('should throw on build() with invalid pack', () => {
      const builder = new PackDevKit('' as IndustryType, '');

      expect(() => builder.build()).toThrow('Pack validation failed');
    });

    it('should not throw on buildUnsafe() with invalid pack', () => {
      const builder = new PackDevKit('' as IndustryType, '');

      expect(() => builder.buildUnsafe()).not.toThrow();
    });
  });

  describe('extendPack', () => {
    it('should extend existing pack', () => {
      const base = createTestPack();
      const extended = extendPack(base, {
        name: 'Extended Gaming Pack',
        semanticTypes: [
          { type: 'custom', category: 'custom', patterns: ['custom'], priority: 5 },
        ],
      });

      expect(extended.name).toBe('Extended Gaming Pack');
      expect(extended.version).toBe('1.0.0-custom');
      expect(extended.semanticTypes.length).toBe(3); // base 2 + new 1
    });

    it('should preserve base pack arrays', () => {
      const base = createTestPack();
      const extended = extendPack(base, {});

      expect(extended.semanticTypes.length).toBe(base.semanticTypes.length);
      expect(extended.metrics.length).toBe(base.metrics.length);
      expect(extended.funnels.length).toBe(base.funnels.length);
    });

    it('should merge terminology', () => {
      const base = createTestPack();
      const extended = extendPack(base, {
        terminology: {
          custom: { singular: 'Custom', plural: 'Customs' },
        },
      });

      expect(extended.terminology.user).toBeDefined();
      expect(extended.terminology.custom).toBeDefined();
    });

    it('should merge theme', () => {
      const base = createTestPack();
      const extended = extendPack(base, {
        theme: {
          primaryColor: '#ff0000',
        },
      });

      expect(extended.theme.primaryColor).toBe('#ff0000');
      expect(extended.theme.accentColor).toBe('#6366f1');
    });

    it('should merge chart configs', () => {
      const base = createTestPack();
      const extended = extendPack(base, {
        chartConfigs: {
          types: [{ type: 'custom', name: 'Custom Chart', description: 'Custom' }],
          defaultCharts: ['custom'],
        },
      });

      expect(extended.chartConfigs.types.length).toBe(1);
      expect(extended.chartConfigs.defaultCharts).toEqual(['custom']);
    });
  });
});
