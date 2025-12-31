# Phase 7: Testing & Documentation

## Overview

Ensure platform quality with comprehensive testing and create documentation for users, developers, and contributors. This phase establishes testing infrastructure, writes guides for each industry, and provides migration support for existing users.

**Duration**: 2 weeks
**Dependencies**: Phase 1-6 (All features complete)

---

## Objectives

1. Build comprehensive test suite (unit, integration, e2e)
2. Create user documentation for each industry
3. Write API and developer documentation
4. Build migration guide from Game Insights
5. Establish performance benchmarks
6. Create contributor guidelines

---

## Task 7.1: Testing Infrastructure

### File: `vitest.config.ts` (Update)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### File: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB
import 'fake-indexeddb/auto';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock crypto.subtle for checksum tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

## Task 7.2: Unit Tests

### File: `src/industry/__tests__/IndustryRegistry.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { IndustryRegistry } from '../IndustryRegistry';
import { IndustryPack } from '../types';

describe('IndustryRegistry', () => {
  let registry: IndustryRegistry;

  const mockPack: IndustryPack = {
    id: 'test',
    name: 'Test Industry',
    version: '1.0.0',
    subCategories: [{ id: 'default', name: 'Default' }],
    semanticTypes: [],
    detectionIndicators: [],
    metrics: [],
    funnels: [],
    chartConfigs: { types: [] },
    insightTemplates: [],
    terminology: {},
    theme: {
      primaryColor: '#000',
      accentColor: '#111',
      chartColors: [],
    },
  };

  beforeEach(() => {
    // Get fresh instance
    registry = IndustryRegistry.getInstance();
    // Clear any existing packs
    registry.getAllPacks().forEach((pack) => {
      registry.unregisterPack(pack.id);
    });
  });

  describe('registerPack', () => {
    it('should register a new industry pack', () => {
      registry.registerPack(mockPack);
      expect(registry.getPack('test')).toEqual(mockPack);
    });

    it('should throw error for duplicate pack id', () => {
      registry.registerPack(mockPack);
      expect(() => registry.registerPack(mockPack)).toThrow();
    });

    it('should emit register event', () => {
      const listener = vi.fn();
      registry.subscribe(listener);

      registry.registerPack(mockPack);

      expect(listener).toHaveBeenCalledWith({
        type: 'registered',
        packId: 'test',
      });
    });
  });

  describe('unregisterPack', () => {
    it('should remove a registered pack', () => {
      registry.registerPack(mockPack);
      registry.unregisterPack('test');
      expect(registry.getPack('test')).toBeUndefined();
    });

    it('should emit unregister event', () => {
      registry.registerPack(mockPack);
      const listener = vi.fn();
      registry.subscribe(listener);

      registry.unregisterPack('test');

      expect(listener).toHaveBeenCalledWith({
        type: 'unregistered',
        packId: 'test',
      });
    });
  });

  describe('getAllPacks', () => {
    it('should return all registered packs', () => {
      registry.registerPack(mockPack);
      registry.registerPack({ ...mockPack, id: 'test2', name: 'Test 2' });

      const packs = registry.getAllPacks();
      expect(packs).toHaveLength(2);
    });
  });
});
```

### File: `src/industry/__tests__/IndustryDetector.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { IndustryDetector } from '../IndustryDetector';
import { IndustryRegistry } from '../IndustryRegistry';
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';

describe('IndustryDetector', () => {
  let detector: IndustryDetector;
  let registry: IndustryRegistry;

  beforeEach(() => {
    registry = IndustryRegistry.getInstance();
    detector = new IndustryDetector(registry);

    // Load test packs
    // (In real tests, load actual gaming, saas, ecommerce packs)
  });

  describe('detect', () => {
    it('should detect gaming industry from game-specific columns', () => {
      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.95 },
        { column: 'level', meaning: 'level', confidence: 0.9 },
        { column: 'score', meaning: 'score', confidence: 0.85 },
        { column: 'moves_used', meaning: 'moves', confidence: 0.8 },
        { column: 'lives', meaning: 'lives', confidence: 0.75 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('gaming');
      expect(result.primary.confidence).toBeGreaterThan(0.7);
    });

    it('should detect SaaS industry from subscription columns', () => {
      const columns: ColumnMeaning[] = [
        { column: 'account_id', meaning: 'account_id', confidence: 0.95 },
        { column: 'mrr', meaning: 'mrr', confidence: 0.9 },
        { column: 'subscription_tier', meaning: 'subscription_tier', confidence: 0.85 },
        { column: 'trial_start', meaning: 'trial_start', confidence: 0.8 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('saas');
      expect(result.primary.confidence).toBeGreaterThan(0.7);
    });

    it('should detect e-commerce from order columns', () => {
      const columns: ColumnMeaning[] = [
        { column: 'order_id', meaning: 'order_id', confidence: 0.95 },
        { column: 'cart_value', meaning: 'cart_value', confidence: 0.9 },
        { column: 'product_id', meaning: 'product_id', confidence: 0.85 },
        { column: 'shipping_cost', meaning: 'shipping_cost', confidence: 0.8 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.industry).toBe('ecommerce');
      expect(result.primary.confidence).toBeGreaterThan(0.7);
    });

    it('should flag ambiguous data with multiple industry signals', () => {
      const columns: ColumnMeaning[] = [
        { column: 'user_id', meaning: 'user_id', confidence: 0.95 },
        { column: 'revenue', meaning: 'revenue', confidence: 0.9 },
        { column: 'timestamp', meaning: 'timestamp', confidence: 0.85 },
      ];

      const result = detector.detect(columns);

      expect(result.isAmbiguous).toBe(true);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should provide detection reasons', () => {
      const columns: ColumnMeaning[] = [
        { column: 'level', meaning: 'level', confidence: 0.9 },
        { column: 'score', meaning: 'score', confidence: 0.85 },
      ];

      const result = detector.detect(columns);

      expect(result.primary.reasons).toContain(expect.stringContaining('level'));
    });
  });
});
```

### File: `src/generators/__tests__/SyntheticDataGenerator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  createDataGenerator,
  GamingDataGenerator,
  SaaSDataGenerator,
  EcommerceDataGenerator,
} from '../SyntheticDataGenerator';

describe('SyntheticDataGenerator', () => {
  const baseConfig = {
    rowCount: 100,
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-03-31'),
    },
  };

  describe('GamingDataGenerator', () => {
    it('should generate gaming data with required fields', () => {
      const generator = new GamingDataGenerator({
        ...baseConfig,
        industry: 'gaming',
      });

      const data = generator.generate();

      expect(data).toHaveLength(100);
      expect(data[0]).toHaveProperty('user_id');
      expect(data[0]).toHaveProperty('event_name');
      expect(data[0]).toHaveProperty('level');
      expect(data[0]).toHaveProperty('score');
    });

    it('should generate consistent data with seed', () => {
      const config = { ...baseConfig, industry: 'gaming' as const, seed: 42 };

      const generator1 = new GamingDataGenerator(config);
      const generator2 = new GamingDataGenerator(config);

      const data1 = generator1.generate();
      const data2 = generator2.generate();

      expect(data1[0].user_id).toBe(data2[0].user_id);
    });
  });

  describe('SaaSDataGenerator', () => {
    it('should generate SaaS data with required fields', () => {
      const generator = new SaaSDataGenerator({
        ...baseConfig,
        industry: 'saas',
      });

      const data = generator.generate();

      expect(data).toHaveLength(100);
      expect(data[0]).toHaveProperty('account_id');
      expect(data[0]).toHaveProperty('plan');
      expect(data[0]).toHaveProperty('mrr');
    });
  });

  describe('EcommerceDataGenerator', () => {
    it('should generate e-commerce data with required fields', () => {
      const generator = new EcommerceDataGenerator({
        ...baseConfig,
        industry: 'ecommerce',
      });

      const data = generator.generate();

      expect(data).toHaveLength(100);
      expect(data[0]).toHaveProperty('customer_id');
      expect(data[0]).toHaveProperty('event_type');
      expect(data[0]).toHaveProperty('product_id');
    });
  });

  describe('createDataGenerator factory', () => {
    it('should create correct generator for each industry', () => {
      const gamingGen = createDataGenerator({ ...baseConfig, industry: 'gaming' });
      const saasGen = createDataGenerator({ ...baseConfig, industry: 'saas' });
      const ecomGen = createDataGenerator({ ...baseConfig, industry: 'ecommerce' });

      expect(gamingGen).toBeInstanceOf(GamingDataGenerator);
      expect(saasGen).toBeInstanceOf(SaaSDataGenerator);
      expect(ecomGen).toBeInstanceOf(EcommerceDataGenerator);
    });

    it('should throw for unknown industry', () => {
      expect(() =>
        createDataGenerator({ ...baseConfig, industry: 'unknown' as any })
      ).toThrow();
    });
  });
});
```

---

## Task 7.3: Integration Tests

### File: `src/test/integration/dataPipeline.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { DataPipeline } from '@/ai/DataPipeline';
import { IndustryRegistry } from '@/industry/IndustryRegistry';
import { createDataGenerator } from '@/generators/SyntheticDataGenerator';
import { loadGamingPack } from '@/industry/packs/gaming';
import { loadSaaSPack } from '@/industry/packs/saas';
import { loadEcommercePack } from '@/industry/packs/ecommerce';

describe('Data Pipeline Integration', () => {
  let pipeline: DataPipeline;
  let registry: IndustryRegistry;

  beforeAll(async () => {
    // Initialize registry with all packs
    registry = IndustryRegistry.getInstance();
    registry.registerPack(loadGamingPack());
    registry.registerPack(loadSaaSPack());
    registry.registerPack(loadEcommercePack());

    pipeline = new DataPipeline();
  });

  it('should correctly process and detect gaming data', async () => {
    const generator = createDataGenerator({
      industry: 'gaming',
      rowCount: 1000,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
    });

    const data = generator.generate();
    const result = await pipeline.process(data);

    expect(result.detectedIndustry).toBe('gaming');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.schemaAnalysis.columnMeanings).toContainEqual(
      expect.objectContaining({ meaning: 'level' })
    );
  });

  it('should correctly process and detect SaaS data', async () => {
    const generator = createDataGenerator({
      industry: 'saas',
      rowCount: 1000,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
    });

    const data = generator.generate();
    const result = await pipeline.process(data);

    expect(result.detectedIndustry).toBe('saas');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should correctly process and detect e-commerce data', async () => {
    const generator = createDataGenerator({
      industry: 'ecommerce',
      rowCount: 1000,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
    });

    const data = generator.generate();
    const result = await pipeline.process(data);

    expect(result.detectedIndustry).toBe('ecommerce');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should handle large datasets efficiently', async () => {
    const generator = createDataGenerator({
      industry: 'gaming',
      rowCount: 100000,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
    });

    const data = generator.generate();

    const startTime = performance.now();
    const result = await pipeline.process(data);
    const duration = performance.now() - startTime;

    expect(result.detectedIndustry).toBe('gaming');
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});
```

### File: `src/test/integration/pluginSystem.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginManager } from '@/plugins/PluginManager';
import { PackExporter } from '@/plugins/PackExporter';
import { IndustryPack } from '@/industry/types';

describe('Plugin System Integration', () => {
  let pluginManager: PluginManager;

  const testPack: IndustryPack = {
    id: 'test-plugin',
    name: 'Test Plugin Pack',
    version: '1.0.0',
    subCategories: [{ id: 'default', name: 'Default' }],
    semanticTypes: [
      { type: 'test_id', patterns: ['test_id', 'testid'], priority: 5 },
    ],
    detectionIndicators: [],
    metrics: [
      {
        id: 'test_metric',
        name: 'Test Metric',
        formula: { expression: 'COUNT($test_id)' },
        format: 'number',
        category: 'kpi',
      },
    ],
    funnels: [],
    chartConfigs: { types: [] },
    insightTemplates: [],
    terminology: { user: { singular: 'Tester', plural: 'Testers' } },
    theme: {
      primaryColor: '#ff0000',
      accentColor: '#00ff00',
      chartColors: ['#ff0000'],
    },
  };

  beforeEach(async () => {
    pluginManager = PluginManager.getInstance();
    await pluginManager.initialize();
  });

  afterEach(async () => {
    // Cleanup installed plugins
    const plugins = pluginManager.getInstalledPlugins();
    for (const plugin of plugins) {
      await pluginManager.uninstallPlugin(plugin.manifest.id);
    }
  });

  it('should export and import a pack correctly', async () => {
    // Export pack
    const exported = await PackExporter.exportPack(testPack);
    expect(exported).toBeTruthy();

    // Import pack
    const imported = await PackExporter.importPack(exported);
    expect(imported.pack.id).toBe(testPack.id);
    expect(imported.pack.name).toBe(testPack.name);
    expect(imported.pack.semanticTypes).toHaveLength(1);
  });

  it('should install, enable, disable, and uninstall a plugin', async () => {
    const manifest = {
      id: 'com.test.plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      type: 'industry-pack' as const,
    };

    // Install
    const installed = await pluginManager.installPlugin(manifest, testPack);
    expect(installed.state).toBe('installed');

    // Enable
    await pluginManager.enablePlugin(manifest.id);
    let plugin = pluginManager.getPlugin(manifest.id);
    expect(plugin?.state).toBe('enabled');

    // Disable
    await pluginManager.disablePlugin(manifest.id);
    plugin = pluginManager.getPlugin(manifest.id);
    expect(plugin?.state).toBe('disabled');

    // Uninstall
    await pluginManager.uninstallPlugin(manifest.id);
    plugin = pluginManager.getPlugin(manifest.id);
    expect(plugin).toBeUndefined();
  });

  it('should emit events on plugin lifecycle changes', async () => {
    const events: any[] = [];
    const unsubscribe = pluginManager.subscribe((event) => events.push(event));

    const manifest = {
      id: 'com.test.events',
      name: 'Test Events',
      version: '1.0.0',
      type: 'industry-pack' as const,
    };

    await pluginManager.installPlugin(manifest, testPack);
    await pluginManager.enablePlugin(manifest.id);
    await pluginManager.disablePlugin(manifest.id);
    await pluginManager.uninstallPlugin(manifest.id);

    expect(events).toContainEqual({ type: 'installed', pluginId: manifest.id });
    expect(events).toContainEqual({ type: 'enabled', pluginId: manifest.id });
    expect(events).toContainEqual({ type: 'disabled', pluginId: manifest.id });
    expect(events).toContainEqual({ type: 'uninstalled', pluginId: manifest.id });

    unsubscribe();
  });
});
```

---

## Task 7.4: E2E Tests with Playwright

### File: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### File: `e2e/upload-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Upload Flow', () => {
  test('should upload a CSV file and detect industry', async ({ page }) => {
    await page.goto('/upload');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/gaming-sample.csv');

    // Wait for detection
    await expect(page.locator('text=Detection Results')).toBeVisible({ timeout: 10000 });

    // Verify gaming detection
    await expect(page.locator('text=Gaming')).toBeVisible();

    // Confirm and continue
    await page.click('button:has-text("Continue")');

    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should allow manual industry override', async ({ page }) => {
    await page.goto('/upload');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/ambiguous-sample.csv');

    // Wait for detection
    await expect(page.locator('text=Detection Results')).toBeVisible({ timeout: 10000 });

    // Open industry selector
    await page.click('[data-testid="industry-selector"]');

    // Select SaaS
    await page.click('text=SaaS');

    // Verify selection changed
    await expect(page.locator('text=Manual')).toBeVisible();

    // Continue
    await page.click('button:has-text("Continue")');

    // Verify SaaS terminology in dashboard
    await expect(page.locator('text=Customers')).toBeVisible();
  });
});

test.describe('Demo Mode', () => {
  test('should load demo data for gaming', async ({ page }) => {
    await page.goto('/quick-start');

    // Click gaming demo
    await page.click('[data-testid="demo-gaming"]');

    // Wait for data generation
    await expect(page.locator('text=Demo Mode')).toBeVisible({ timeout: 10000 });

    // Verify dashboard loads with gaming metrics
    await expect(page.locator('text=Players')).toBeVisible();
    await expect(page.locator('text=Level')).toBeVisible();
  });

  test('should exit demo mode correctly', async ({ page }) => {
    await page.goto('/quick-start');
    await page.click('[data-testid="demo-gaming"]');
    await expect(page.locator('text=Demo Mode')).toBeVisible({ timeout: 10000 });

    // Exit demo
    await page.click('text=Exit Demo');

    // Demo banner should disappear
    await expect(page.locator('text=Demo Mode')).not.toBeVisible();
  });
});
```

---

## Task 7.5: User Documentation

### File: `docs/user-guide/getting-started.md`

```markdown
# Getting Started with ProductInsights

Welcome to ProductInsights, the AI-powered analytics platform that automatically
understands your data and provides industry-specific insights.

## Quick Start

### Option 1: Upload Your Data

1. Click "Upload Data" on the home screen
2. Drag and drop your CSV, JSON, Excel, or SQLite file
3. Wait for automatic industry detection
4. Confirm or adjust the detected industry
5. Explore your dashboard!

### Option 2: Connect a Live Data Source

1. Go to "Data Sources" in the sidebar
2. Choose your data source type:
   - PostgreSQL
   - Supabase
   - Firebase
   - Google Sheets
   - REST API
3. Enter your connection credentials
4. Select tables to analyze

### Option 3: Try Demo Mode

1. Go to "Quick Start"
2. Select an industry demo:
   - Gaming
   - SaaS
   - E-commerce
3. Explore with sample data

## Understanding Your Dashboard

### Key Metrics

The dashboard shows industry-specific KPIs:

- **Gaming**: DAU, ARPDAU, Retention, Level Completion
- **SaaS**: MRR, ARR, Churn Rate, Trial Conversion
- **E-commerce**: GMV, AOV, Cart Abandonment, Repeat Purchase

### Terminology

Labels adapt to your industry:

| Concept | Gaming | SaaS | E-commerce |
|---------|--------|------|------------|
| User | Player | Customer | Shopper |
| Session | Session | Visit | Visit |
| Revenue | Revenue | MRR | GMV |

### Charts and Visualizations

Charts are automatically selected based on your data and industry:

- Retention curves for user engagement
- Funnel analysis for conversion tracking
- Revenue trends over time
- Cohort analysis for behavior patterns

## Customization

### Override Industry Detection

If automatic detection isn't accurate:

1. Click the industry selector in the sidebar
2. Choose the correct industry
3. Select a sub-category if applicable

### Create Custom Metrics

1. Go to Plugins > Custom Metrics
2. Click "Create Custom Metric"
3. Define your formula using available functions
4. Save and view on your dashboard

## Data Privacy

- All data stays on your device by default
- No server uploads required
- IndexedDB storage for persistence
- Optional cloud sync (coming soon)

## Need Help?

- [User Guide](/docs/user-guide/)
- [API Documentation](/docs/api/)
- [GitHub Issues](https://github.com/your-repo/issues)
```

### File: `docs/user-guide/industries/gaming.md`

```markdown
# Gaming Analytics Guide

ProductInsights provides specialized analytics for mobile and casual games.

## Supported Game Types

- **Puzzle**: Level-based progression, boosters, lives
- **Idle/Incremental**: Offline earnings, prestige systems
- **Battle Royale**: Match results, weapon meta, rank distribution
- **Match-3 Meta**: Decoration, story progression
- **Gacha RPG**: Banner pulls, character collection, equipment

## Key Metrics

### Engagement

- **DAU/MAU Ratio**: Stickiness indicator
- **Session Duration**: Average play time
- **Sessions per Day**: Frequency of play
- **Retention (D1/D7/D30)**: Player return rates

### Monetization

- **ARPDAU**: Average Revenue Per Daily Active User
- **ARPPU**: Average Revenue Per Paying User
- **Conversion Rate**: % of players who make a purchase
- **Payer Segmentation**: Non-spenders, Minnows, Dolphins, Whales

### Progression

- **Level Completion Rate**: % completing each level
- **Fail Rate**: % failing each level
- **Booster Usage**: Power-up consumption patterns
- **Difficulty Curve**: Progression balance analysis

## Pre-built Funnels

1. **Tutorial Funnel**: Start → Complete Tutorial → First Level → D1 Return
2. **Purchase Funnel**: View Store → Add to Cart → Purchase → Return Purchase
3. **Engagement Funnel**: Install → D1 Active → D7 Active → D30 Active

## Column Detection

ProductInsights automatically recognizes these gaming columns:

| Column Pattern | Detected As |
|----------------|-------------|
| level, stage, wave | Level |
| score, points | Score |
| lives, hearts | Lives |
| moves, turns | Moves |
| booster, powerup | Booster |
| gems, coins, currency | Virtual Currency |
| banner, gacha, pull | Banner |

## Best Practices

### Data Structure

For best results, include:

```csv
user_id,timestamp,event_name,level,score,revenue
user_123,2024-01-15 10:30:00,level_complete,15,5000,0
user_123,2024-01-15 10:35:00,purchase,15,5000,4.99
```

### Retention Analysis

Upload at least 30 days of data for meaningful D30 retention.

### Cohort Analysis

Include install_date to enable cohort comparisons.

## Example Dashboards

See the [Gaming Demo](/quick-start?demo=gaming) for a fully populated dashboard.
```

### File: `docs/user-guide/industries/saas.md`

```markdown
# SaaS Analytics Guide

ProductInsights provides specialized analytics for subscription software products.

## Supported Sub-categories

- **B2B SaaS**: Enterprise customers, account-based metrics
- **B2C SaaS**: Consumer subscriptions, individual users
- **API Products**: Usage-based billing, developer metrics
- **Marketplace**: Multi-tenant platforms

## Key Metrics

### Revenue

- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Recurring Revenue
- **NRR**: Net Revenue Retention
- **GRR**: Gross Revenue Retention
- **LTV**: Customer Lifetime Value
- **CAC**: Customer Acquisition Cost
- **LTV:CAC Ratio**: Unit economics health

### Subscriptions

- **Trial Conversion**: Free trial → Paid conversion rate
- **Churn Rate**: Monthly customer/revenue churn
- **Expansion Revenue**: Upgrades and add-ons
- **Contraction**: Downgrades

### Engagement

- **Active Users**: Daily/Weekly/Monthly active
- **Feature Adoption**: % using key features
- **Time to Value**: Days to first key action
- **NPS Score**: Net Promoter Score

## Pre-built Funnels

1. **Trial to Paid**: Signup → Trial Start → Activation → Payment
2. **Onboarding**: Signup → Profile Complete → First Action → Invite Team
3. **Expansion**: Base Plan → Feature Discovery → Upgrade Intent → Expansion

## Column Detection

ProductInsights automatically recognizes these SaaS columns:

| Column Pattern | Detected As |
|----------------|-------------|
| mrr, monthly_revenue | MRR |
| arr, annual_revenue | ARR |
| plan, tier, subscription | Subscription Tier |
| trial_start, trial_end | Trial Dates |
| churn_date, cancelled_at | Churn Date |
| seats, licenses | Seat Count |

## Best Practices

### MRR Tracking

Include plan changes with timestamps:

```csv
account_id,timestamp,event,plan,mrr,seats
acc_123,2024-01-01,subscription_start,starter,29,5
acc_123,2024-02-15,plan_upgrade,professional,99,10
```

### Cohort Analysis

Group by signup_month for subscription cohort analysis.

### Feature Tracking

Log feature_used events for adoption metrics:

```csv
account_id,user_id,timestamp,event,feature
acc_123,user_456,2024-01-15,feature_used,api_integration
```

## Example Dashboards

See the [SaaS Demo](/quick-start?demo=saas) for a fully populated dashboard.
```

---

## Task 7.6: API Documentation

### File: `docs/api/industry-pack.md`

```markdown
# Industry Pack API

## Overview

Industry Packs are self-contained configurations that define how ProductInsights
analyzes data for a specific industry vertical.

## IndustryPack Interface

```typescript
interface IndustryPack {
  // Identification
  id: IndustryType;
  name: string;
  description?: string;
  version: string;

  // Sub-categories
  subCategories: IndustrySubCategory[];

  // Schema Analysis
  semanticTypes: IndustrySemanticType[];

  // Detection
  detectionIndicators: DetectionIndicator[];

  // Metrics & Funnels
  metrics: MetricDefinition[];
  funnels: FunnelTemplate[];

  // Visualization
  chartConfigs: ChartConfig;
  insightTemplates: InsightTemplate[];

  // UI Customization
  terminology: TerminologyMap;
  theme: IndustryTheme;
}
```

## Creating a Custom Pack

### Using PackDevKit

```typescript
import { PackDevKit } from '@/plugins/PackDevKit';

const pack = new PackDevKit('hospitality', 'Hospitality')
  .describe('Analytics for hotels and restaurants')
  .version('1.0.0')

  // Add sub-categories
  .addSubCategory('hotel', 'Hotel', 'Booking and stays')
  .addSubCategory('restaurant', 'Restaurant', 'Reservations and orders')

  // Add semantic types
  .addSemanticType('booking_id', ['booking', 'reservation', 'booking_id'])
  .addSemanticType('check_in', ['checkin', 'check_in', 'arrival'])
  .addSemanticType('room_type', ['room_type', 'room_class', 'accommodation'])

  // Add detection indicators
  .addIndicator(['booking_id', 'check_in'], 5) // Strong signal
  .addIndicator(['room_type'], 3) // Medium signal

  // Add metrics
  .addMetric({
    id: 'occupancy_rate',
    name: 'Occupancy Rate',
    description: 'Percentage of rooms occupied',
    formula: { expression: 'RATIO(COUNT($booking_id), $total_rooms) * 100' },
    format: 'percentage',
    category: 'kpi',
  })

  // Add funnel
  .addFunnel({
    id: 'booking_funnel',
    name: 'Booking Funnel',
    steps: [
      { id: 'search', name: 'Search', semanticType: 'search' },
      { id: 'view', name: 'View Room', semanticType: 'room_view' },
      { id: 'book', name: 'Book', semanticType: 'booking_id' },
    ],
  })

  // Set terminology
  .setTerminology({
    user: { singular: 'Guest', plural: 'Guests' },
    session: { singular: 'Stay', plural: 'Stays' },
    conversion: { singular: 'Booking', plural: 'Bookings' },
  })

  // Set theme
  .setTheme({
    primaryColor: '#0ea5e9',
    accentColor: '#0284c7',
  })

  .build();
```

### Manual Definition

```typescript
const pack: IndustryPack = {
  id: 'hospitality' as any,
  name: 'Hospitality',
  version: '1.0.0',
  subCategories: [
    { id: 'hotel', name: 'Hotel' },
    { id: 'restaurant', name: 'Restaurant' },
  ],
  semanticTypes: [
    { type: 'booking_id', patterns: ['booking', 'reservation'], priority: 5 },
  ],
  detectionIndicators: [
    { types: ['booking_id', 'check_in'], weight: 5 },
  ],
  metrics: [
    {
      id: 'occupancy_rate',
      name: 'Occupancy Rate',
      formula: { expression: 'RATIO(COUNT($booking_id), $total_rooms) * 100' },
      format: 'percentage',
      category: 'kpi',
    },
  ],
  funnels: [],
  chartConfigs: { types: [] },
  insightTemplates: [],
  terminology: {},
  theme: {
    primaryColor: '#0ea5e9',
    accentColor: '#0284c7',
    chartColors: [],
  },
};
```

## Registering a Pack

```typescript
import { IndustryRegistry } from '@/industry/IndustryRegistry';

const registry = IndustryRegistry.getInstance();
registry.registerPack(pack);
```

## Exporting a Pack

```typescript
import { PackExporter } from '@/plugins/PackExporter';

const json = await PackExporter.exportPack(pack, {
  author: 'Your Name',
  description: 'Custom hospitality analytics pack',
});

// Download as file
PackExporter.downloadPack(json, 'hospitality.pack.json');
```

## Importing a Pack

```typescript
const imported = await PackExporter.importPack(jsonString);
registry.registerPack(imported.pack);
```

## API Reference

### IndustryRegistry

| Method | Description |
|--------|-------------|
| `getInstance()` | Get singleton instance |
| `registerPack(pack)` | Register a new pack |
| `unregisterPack(id)` | Remove a pack |
| `getPack(id)` | Get pack by ID |
| `getAllPacks()` | Get all registered packs |
| `subscribe(listener)` | Subscribe to events |

### IndustryDetector

| Method | Description |
|--------|-------------|
| `detect(columns)` | Detect industry from columns |

### PackExporter

| Method | Description |
|--------|-------------|
| `exportPack(pack, metadata?)` | Export to JSON |
| `importPack(json)` | Import from JSON |
| `downloadPack(json, filename)` | Download as file |
```

---

## Task 7.7: Migration Guide

### File: `docs/migration/from-game-insights.md`

```markdown
# Migration Guide: Game Insights → ProductInsights

This guide helps existing Game Insights users migrate to ProductInsights v2.0.

## What's Changed

### Terminology

| Old | New |
|-----|-----|
| GameContext | ProductContext |
| GameCategory | ProductCategory |
| GameTypeDetector | IndustryDetector |
| useGame() | useProduct() |

### Data Model

```typescript
// Old
interface GameData {
  id: string;
  name: string;
  type: GameCategory; // puzzle, idle, etc.
  uploadedAt: string;
  rawData: Record<string, unknown>[];
}

// New
interface ProductData {
  id: string;
  name: string;
  industry: IndustryType;      // gaming, saas, ecommerce
  subCategory: IndustrySubCategory; // puzzle, b2b, retail
  type?: GameCategory;          // Legacy support
  uploadedAt: string;
  rawData: Record<string, unknown>[];
}
```

## Automatic Migration

ProductInsights automatically migrates your existing data:

1. **IndexedDB Schema**: Upgraded from v3 to v4
2. **Game Types**: Mapped to industry sub-categories
3. **Contexts**: Legacy hooks continue working

## Breaking Changes

### 1. Context Provider

```tsx
// Old
import { GameProvider } from '@/context/GameContext';

function App() {
  return (
    <GameProvider>
      <YourApp />
    </GameProvider>
  );
}

// New
import { ProductProvider } from '@/context/ProductContext';

function App() {
  return (
    <ProductProvider>
      <YourApp />
    </ProductProvider>
  );
}
```

### 2. Hook Usage

```typescript
// Old (still works with deprecation warning)
const { selectedGame, setGame } = useGame();

// New (recommended)
const {
  selectedIndustry,
  selectedSubCategory,
  setIndustry
} = useProduct();
```

### 3. Type Imports

```typescript
// Old
import { GameCategory } from '@/types';

// New
import { IndustryType, IndustrySubCategory } from '@/industry/types';
```

## Game Type Mapping

Your existing game types map to:

| Old GameCategory | New Industry | New SubCategory |
|------------------|--------------|-----------------|
| puzzle | gaming | puzzle |
| idle | gaming | idle |
| battle_royale | gaming | battle_royale |
| match3_meta | gaming | match3 |
| gacha_rpg | gaming | gacha |

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
pnpm update
```

### Step 2: Replace Context Provider

Update your `App.tsx`:

```tsx
// Replace GameProvider with ProductProvider
import { ProductProvider } from '@/context/ProductContext';
```

### Step 3: Update Hook Calls

Find and replace in your codebase:

```bash
# Find usages
grep -r "useGame" src/
```

### Step 4: Update Type Imports

```typescript
// Update imports
import { IndustryType } from '@/industry/types';
```

### Step 5: Test

```bash
pnpm test
pnpm build
```

## Backward Compatibility

The following legacy features still work:

- `useGame()` hook (with deprecation warning)
- `GameCategory` type (alias to gaming sub-categories)
- Existing CSV uploads (auto-detected as gaming)

## Need Help?

- [GitHub Issues](https://github.com/your-repo/issues)
- [Migration FAQ](/docs/migration/faq)
```

---

## Task 7.8: Performance Benchmarks

### File: `src/test/benchmarks/performance.bench.ts`

```typescript
import { bench, describe } from 'vitest';
import { DataPipeline } from '@/ai/DataPipeline';
import { IndustryDetector } from '@/industry/IndustryDetector';
import { SchemaAnalyzer } from '@/ai/SchemaAnalyzer';
import { createDataGenerator } from '@/generators/SyntheticDataGenerator';

describe('Performance Benchmarks', () => {
  const generateData = (rows: number) =>
    createDataGenerator({
      industry: 'gaming',
      rowCount: rows,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
    }).generate();

  describe('Schema Analysis', () => {
    const analyzer = new SchemaAnalyzer();

    bench('1K rows', async () => {
      const data = generateData(1000);
      await analyzer.analyze(data);
    });

    bench('10K rows', async () => {
      const data = generateData(10000);
      await analyzer.analyze(data);
    });

    bench('100K rows', async () => {
      const data = generateData(100000);
      await analyzer.analyze(data);
    });
  });

  describe('Industry Detection', () => {
    const detector = new IndustryDetector();
    const analyzer = new SchemaAnalyzer();

    bench('Detection from 20 columns', async () => {
      const data = generateData(1000);
      const schema = await analyzer.analyze(data);
      detector.detect(schema.columnMeanings);
    });
  });

  describe('Full Pipeline', () => {
    const pipeline = new DataPipeline();

    bench('1K rows', async () => {
      const data = generateData(1000);
      await pipeline.process(data);
    });

    bench('10K rows', async () => {
      const data = generateData(10000);
      await pipeline.process(data);
    });

    bench('100K rows', async () => {
      const data = generateData(100000);
      await pipeline.process(data);
    });
  });

  describe('Data Generation', () => {
    bench('Generate 1K gaming rows', () => {
      generateData(1000);
    });

    bench('Generate 10K gaming rows', () => {
      generateData(10000);
    });

    bench('Generate 100K gaming rows', () => {
      generateData(100000);
    });
  });
});
```

### Expected Benchmark Results

| Operation | 1K rows | 10K rows | 100K rows | Target |
|-----------|---------|----------|-----------|--------|
| Schema Analysis | <50ms | <200ms | <1s | <1s for 100K |
| Industry Detection | <10ms | <10ms | <10ms | <100ms |
| Full Pipeline | <100ms | <500ms | <3s | <5s for 100K |
| Data Generation | <20ms | <100ms | <500ms | <1s for 100K |

---

## Deliverables Summary

| Component | Status | Description |
|-----------|--------|-------------|
| Test Setup | New | Vitest configuration with mocks |
| Unit Tests | New | Registry, Detector, Generator tests |
| Integration Tests | New | Pipeline, Plugin system tests |
| E2E Tests | New | Playwright tests for key flows |
| User Guide | New | Getting started documentation |
| Industry Guides | New | Gaming, SaaS specific guides |
| API Docs | New | Industry Pack API reference |
| Migration Guide | New | Game Insights → ProductInsights |
| Benchmarks | New | Performance test suite |

---

## Test Coverage Targets

| Module | Target | Current |
|--------|--------|---------|
| industry/ | 90% | - |
| plugins/ | 85% | - |
| generators/ | 90% | - |
| ai/ | 80% | - |
| adapters/ | 75% | - |
| components/ | 70% | - |
| **Overall** | **80%** | - |

---

## Documentation Checklist

- [ ] Getting Started guide complete
- [ ] Gaming industry guide complete
- [ ] SaaS industry guide complete
- [ ] E-commerce industry guide complete
- [ ] API reference complete
- [ ] Migration guide complete
- [ ] Contributing guidelines complete
- [ ] Changelog updated

---

## Launch Checklist

- [ ] All tests passing
- [ ] Coverage targets met
- [ ] Performance benchmarks met
- [ ] Documentation reviewed
- [ ] Migration path tested
- [ ] Demo mode working
- [ ] Sample datasets accessible
- [ ] Plugin system functional

---

## Post-Launch

### Phase 8+ (Future)

1. **EdTech Pack**: Course completion, assessment metrics
2. **Media/Streaming Pack**: Watch time, content engagement
3. **Fintech Pack**: Transaction analytics, compliance
4. **Healthcare Pack**: Patient engagement (HIPAA considerations)
5. **Cloud Sync**: Optional data backup and sharing
6. **Collaboration**: Multi-user dashboards
7. **AI Insights**: GPT-powered recommendations
