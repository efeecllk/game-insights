# Phase 1: Foundation & Core Abstractions

## Objective
Create the industry abstraction layer that will serve as the foundation for multi-industry support. This phase establishes the core interfaces, registry system, and detection mechanism without modifying existing game-specific code.

---

## Duration
**Estimated: 2 weeks**

---

## Tasks

### Task 1.1: Create Industry Directory Structure
Create the new directory structure for industry-related code.

**Files to create:**
```
src/industry/
├── types.ts                 # Core type definitions
├── IndustryRegistry.ts      # Central pack management
├── IndustryDetector.ts      # Detection logic
├── SemanticTypeRegistry.ts  # Extended semantic type management
├── MetricRegistry.ts        # Metric definition management
├── index.ts                 # Public exports
└── packs/
    └── index.ts             # Pack loader
```

**Acceptance Criteria:**
- [ ] Directory structure exists
- [ ] All files compile without errors
- [ ] Exports are accessible via `@/industry`

---

### Task 1.2: Define Core Type Interfaces

**File: `src/industry/types.ts`**

```typescript
// Industry Types
export type IndustryType =
  | 'gaming'
  | 'saas'
  | 'ecommerce'
  | 'fintech'
  | 'healthcare'
  | 'media'
  | 'education'
  | 'custom';

export type IndustrySubCategory = string;

export interface ProductCategory {
  industry: IndustryType;
  subCategory: IndustrySubCategory;
  displayName: string;
  icon: string;
}

// Semantic Types
export type SemanticCategory =
  | 'identifier'
  | 'timestamp'
  | 'revenue'
  | 'engagement'
  | 'progression'
  | 'demographic'
  | 'quality'
  | 'custom';

export interface IndustrySemanticType {
  type: string;
  patterns: RegExp[];
  industry: IndustryType | 'universal';
  category: SemanticCategory;
  description: string;
  aliases?: string[];
  inferenceRules?: InferenceRule[];
}

export interface InferenceRule {
  condition: (values: unknown[]) => boolean;
  confidence: number;
}

// Detection
export interface DetectionIndicator {
  signals: string[];
  weight: number;
  required?: boolean;
}

export interface IndustryDetectionResult {
  industry: IndustryType;
  subCategory: IndustrySubCategory;
  confidence: number;
  reasons: string[];
  alternativeSuggestions?: Array<{
    industry: IndustryType;
    subCategory: IndustrySubCategory;
    confidence: number;
  }>;
}

// Metrics
export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  formula: string | MetricCalculator;
  requiredSemantics: string[];
  category: 'kpi' | 'derived' | 'aggregate';
  formatting: MetricFormatting;
  benchmarks?: BenchmarkRange;
}

export interface MetricFormatting {
  type: 'number' | 'percentage' | 'currency' | 'duration';
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export interface BenchmarkRange {
  poor?: number;
  average?: number;
  good?: number;
  excellent?: number;
}

export type MetricCalculator = (
  data: NormalizedData,
  columnMap: Map<string, string>
) => number | null;

// Funnels
export interface FunnelTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'conversion' | 'progression' | 'onboarding' | 'custom';
  steps: FunnelStepTemplate[];
  industrySubCategories?: IndustrySubCategory[];
}

export interface FunnelStepTemplate {
  name: string;
  eventMatch?: string[];
  semanticType?: string;
  condition?: string;
}

// Charts
export interface ChartConfiguration {
  id: string;
  type: string;
  name: string;
  subtitle: string;
  requiredSemantics: string[];
  recommendedFor: IndustrySubCategory[];
  priority: number;
}

export interface ChartTitleConfig {
  title: string;
  subtitle: string;
}

// Insights
export interface InsightTemplate {
  id: string;
  requires: string[];
  category: InsightCategory;
  priority: number;
  condition: (metrics: Record<string, number>) => boolean;
  generate: (metrics: Record<string, number>) => InsightOutput;
}

export type InsightCategory =
  | 'retention'
  | 'monetization'
  | 'engagement'
  | 'progression'
  | 'quality'
  | 'acquisition'
  | 'conversion';

export interface InsightOutput {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  action?: string;
}

// Terminology
export interface TerminologyMap {
  user: string;
  session: string;
  conversion: string;
  retention: string;
  revenue: string;
  churn: string;
  level?: string;
  score?: string;
  [key: string]: string | undefined;
}

// Theme
export interface IndustryTheme {
  primaryColor: string;
  accentColor: string;
  chartColors: string[];
  icon: string;
  logo?: string;
}

// Complete Industry Pack
export interface IndustryPack {
  // Identification
  id: IndustryType;
  name: string;
  description: string;
  version: string;

  // Sub-categories
  subCategories: IndustrySubCategoryDefinition[];

  // Semantic types
  semanticTypes: IndustrySemanticType[];

  // Detection indicators
  indicators: Map<IndustrySubCategory, DetectionIndicator[]>;

  // Metrics
  metrics: MetricDefinition[];

  // Funnels
  funnelTemplates: FunnelTemplate[];

  // Charts
  chartConfigs: ChartConfiguration[];
  chartTitles: Map<IndustrySubCategory, Record<string, ChartTitleConfig>>;

  // Insights
  insightTemplates: InsightTemplate[];
  tips: Map<IndustrySubCategory, string[]>;

  // UI
  terminology: TerminologyMap;
  sidebarPriorities: Map<IndustrySubCategory, Record<string, number>>;
  theme: IndustryTheme;

  // Optional custom components
  customComponents?: {
    dashboard?: React.ComponentType;
    settings?: React.ComponentType;
  };
}

export interface IndustrySubCategoryDefinition {
  id: IndustrySubCategory;
  name: string;
  description: string;
  icon: string;
}
```

**Acceptance Criteria:**
- [ ] All interfaces defined and documented
- [ ] Types are exported and usable
- [ ] No circular dependencies

---

### Task 1.3: Implement Industry Registry

**File: `src/industry/IndustryRegistry.ts`**

```typescript
import { IndustryPack, IndustryType, IndustrySemanticType, DetectionIndicator } from './types';

type RegistryEventType = 'pack:registered' | 'pack:unregistered' | 'pack:updated';

interface RegistryEvent {
  type: RegistryEventType;
  packId: IndustryType;
  timestamp: number;
}

type RegistryEventHandler = (event: RegistryEvent) => void;

class IndustryRegistryClass {
  private packs: Map<IndustryType, IndustryPack> = new Map();
  private eventHandlers: Set<RegistryEventHandler> = new Set();
  private initialized: boolean = false;

  /**
   * Initialize registry with built-in packs
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load built-in packs (lazy import)
    const { loadBuiltInPacks } = await import('./packs');
    const builtInPacks = await loadBuiltInPacks();

    for (const pack of builtInPacks) {
      this.register(pack, { silent: true });
    }

    this.initialized = true;
  }

  /**
   * Register an industry pack
   */
  register(pack: IndustryPack, options?: { silent?: boolean }): void {
    this.validatePack(pack);
    this.packs.set(pack.id, pack);

    if (!options?.silent) {
      this.emit({ type: 'pack:registered', packId: pack.id, timestamp: Date.now() });
    }
  }

  /**
   * Unregister an industry pack
   */
  unregister(industryId: IndustryType): boolean {
    const result = this.packs.delete(industryId);
    if (result) {
      this.emit({ type: 'pack:unregistered', packId: industryId, timestamp: Date.now() });
    }
    return result;
  }

  /**
   * Get an industry pack by ID
   */
  get(industryId: IndustryType): IndustryPack | undefined {
    return this.packs.get(industryId);
  }

  /**
   * Get all registered packs
   */
  getAll(): IndustryPack[] {
    return Array.from(this.packs.values());
  }

  /**
   * Get all industry IDs
   */
  getIndustryIds(): IndustryType[] {
    return Array.from(this.packs.keys());
  }

  /**
   * Get all semantic types across all industries
   */
  getAllSemanticTypes(): IndustrySemanticType[] {
    const types: IndustrySemanticType[] = [];
    const seen = new Set<string>();

    for (const pack of this.packs.values()) {
      for (const semType of pack.semanticTypes) {
        if (!seen.has(semType.type)) {
          types.push(semType);
          seen.add(semType.type);
        }
      }
    }

    return types;
  }

  /**
   * Get semantic types for a specific industry
   */
  getSemanticTypesForIndustry(industryId: IndustryType): IndustrySemanticType[] {
    const pack = this.packs.get(industryId);
    return pack?.semanticTypes ?? [];
  }

  /**
   * Get merged detection indicators
   */
  getDetectionIndicators(): Map<string, DetectionIndicator[]> {
    const indicators = new Map<string, DetectionIndicator[]>();

    for (const pack of this.packs.values()) {
      for (const [subCategory, indicatorList] of pack.indicators) {
        const key = `${pack.id}:${subCategory}`;
        indicators.set(key, indicatorList);
      }
    }

    return indicators;
  }

  /**
   * Find pack by semantic type
   */
  findPackBySemanticType(semanticType: string): IndustryPack | undefined {
    for (const pack of this.packs.values()) {
      if (pack.semanticTypes.some(t => t.type === semanticType)) {
        return pack;
      }
    }
    return undefined;
  }

  /**
   * Event subscription
   */
  addEventListener(handler: RegistryEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Validate pack structure
   */
  private validatePack(pack: IndustryPack): void {
    if (!pack.id) throw new Error('Pack must have an id');
    if (!pack.name) throw new Error('Pack must have a name');
    if (!pack.subCategories?.length) throw new Error('Pack must have at least one sub-category');
    if (!pack.semanticTypes?.length) throw new Error('Pack must have semantic types');
    if (!pack.indicators?.size) throw new Error('Pack must have detection indicators');
  }

  private emit(event: RegistryEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Registry event handler error:', error);
      }
    });
  }
}

export const industryRegistry = new IndustryRegistryClass();
```

**Acceptance Criteria:**
- [ ] Registry can register/unregister packs
- [ ] Registry provides access to all semantic types
- [ ] Event system works correctly
- [ ] Validation prevents invalid packs

---

### Task 1.4: Implement Industry Detector

**File: `src/industry/IndustryDetector.ts`**

```typescript
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';
import { industryRegistry } from './IndustryRegistry';
import {
  IndustryType,
  IndustrySubCategory,
  IndustryDetectionResult,
  DetectionIndicator
} from './types';

export class IndustryDetector {
  /**
   * Detect industry and sub-category from column meanings
   */
  detect(meanings: ColumnMeaning[]): IndustryDetectionResult {
    const semanticTypes = new Set(meanings.map(m => m.semanticType));
    const scores = new Map<string, { score: number; reasons: string[] }>();

    // Get all indicators from registered packs
    const indicators = industryRegistry.getDetectionIndicators();

    // Calculate scores for each industry:subCategory combination
    for (const [key, indicatorList] of indicators) {
      let totalScore = 0;
      const reasons: string[] = [];
      let hasRequiredMissing = false;

      for (const indicator of indicatorList) {
        const matches = indicator.signals.filter(s => semanticTypes.has(s));

        if (indicator.required && matches.length === 0) {
          hasRequiredMissing = true;
          break;
        }

        if (matches.length > 0) {
          totalScore += indicator.weight * matches.length;
          reasons.push(`Found ${matches.join(', ')} (weight: ${indicator.weight})`);
        }
      }

      if (!hasRequiredMissing) {
        scores.set(key, { score: totalScore, reasons });
      }
    }

    // Find top matches
    const sorted = [...scores.entries()].sort((a, b) => b[1].score - a[1].score);

    if (sorted.length === 0 || sorted[0][1].score === 0) {
      return {
        industry: 'custom',
        subCategory: 'custom',
        confidence: 0.3,
        reasons: ['No clear industry pattern detected. Using custom analysis.'],
      };
    }

    const [topKey, topResult] = sorted[0];
    const [industry, subCategory] = topKey.split(':') as [IndustryType, IndustrySubCategory];

    // Calculate confidence
    const maxPossible = this.calculateMaxPossibleScore(indicators.get(topKey) || []);
    const confidence = Math.min((topResult.score / maxPossible) * 0.7 + 0.3, 0.95);

    // Determine if result is ambiguous
    const [, secondResult] = sorted[1] || [null, { score: 0 }];
    const isAmbiguous = secondResult.score > topResult.score * 0.8;

    // Get alternative suggestions
    const alternativeSuggestions = sorted.slice(1, 4)
      .filter(([, result]) => result.score > 0)
      .map(([key, result]) => {
        const [ind, sub] = key.split(':') as [IndustryType, IndustrySubCategory];
        const maxScore = this.calculateMaxPossibleScore(indicators.get(key) || []);
        return {
          industry: ind,
          subCategory: sub,
          confidence: Math.min((result.score / maxScore) * 0.6 + 0.2, 0.85),
        };
      });

    return {
      industry,
      subCategory,
      confidence: isAmbiguous ? confidence * 0.9 : confidence,
      reasons: topResult.reasons,
      alternativeSuggestions: alternativeSuggestions.length > 0 ? alternativeSuggestions : undefined,
    };
  }

  /**
   * Suggest industries based on partial column data
   */
  suggestIndustries(columnNames: string[]): Array<{
    industry: IndustryType;
    subCategory: IndustrySubCategory;
    matchedPatterns: string[];
    score: number;
  }> {
    const suggestions: Array<{
      industry: IndustryType;
      subCategory: IndustrySubCategory;
      matchedPatterns: string[];
      score: number;
    }> = [];

    for (const pack of industryRegistry.getAll()) {
      for (const [subCategory, indicators] of pack.indicators) {
        const matchedPatterns: string[] = [];
        let score = 0;

        for (const indicator of indicators) {
          for (const signal of indicator.signals) {
            const semType = pack.semanticTypes.find(t => t.type === signal);
            if (semType) {
              for (const pattern of semType.patterns) {
                for (const colName of columnNames) {
                  if (pattern.test(colName)) {
                    matchedPatterns.push(`${colName} → ${signal}`);
                    score += indicator.weight;
                    break;
                  }
                }
              }
            }
          }
        }

        if (matchedPatterns.length > 0) {
          suggestions.push({
            industry: pack.id,
            subCategory,
            matchedPatterns,
            score,
          });
        }
      }
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }

  private calculateMaxPossibleScore(indicators: DetectionIndicator[]): number {
    return indicators.reduce((sum, i) => sum + i.weight * i.signals.length, 0);
  }
}

export const industryDetector = new IndustryDetector();
```

**Acceptance Criteria:**
- [ ] Detection returns correct industry for known patterns
- [ ] Confidence score is reasonable (0.3-0.95 range)
- [ ] Alternative suggestions provided when ambiguous
- [ ] Graceful fallback to 'custom' when unknown

---

### Task 1.5: Create Semantic Type Registry

**File: `src/industry/SemanticTypeRegistry.ts`**

```typescript
import { IndustrySemanticType, IndustryType } from './types';
import { industryRegistry } from './IndustryRegistry';

interface CustomSemanticType extends IndustrySemanticType {
  createdBy: 'user' | 'system';
  createdAt: string;
}

class SemanticTypeRegistryClass {
  private customTypes: Map<string, CustomSemanticType> = new Map();

  /**
   * Get all semantic types (built-in + custom)
   */
  getAll(): IndustrySemanticType[] {
    const builtIn = industryRegistry.getAllSemanticTypes();
    const custom = Array.from(this.customTypes.values());
    return [...builtIn, ...custom];
  }

  /**
   * Get semantic types by industry
   */
  getByIndustry(industry: IndustryType | 'universal'): IndustrySemanticType[] {
    return this.getAll().filter(t =>
      t.industry === industry || t.industry === 'universal'
    );
  }

  /**
   * Get semantic type by name
   */
  get(typeName: string): IndustrySemanticType | undefined {
    // Check custom first
    if (this.customTypes.has(typeName)) {
      return this.customTypes.get(typeName);
    }

    // Check built-in
    return industryRegistry.getAllSemanticTypes().find(t => t.type === typeName);
  }

  /**
   * Add a custom semantic type
   */
  addCustom(type: Omit<IndustrySemanticType, 'industry'> & { industry?: IndustryType }): void {
    const customType: CustomSemanticType = {
      ...type,
      industry: type.industry ?? 'universal',
      createdBy: 'user',
      createdAt: new Date().toISOString(),
    };

    this.customTypes.set(type.type, customType);
  }

  /**
   * Remove a custom semantic type
   */
  removeCustom(typeName: string): boolean {
    return this.customTypes.delete(typeName);
  }

  /**
   * Match a column name against all patterns
   */
  matchColumn(columnName: string): IndustrySemanticType | undefined {
    for (const semType of this.getAll()) {
      for (const pattern of semType.patterns) {
        if (pattern.test(columnName)) {
          return semType;
        }
      }
    }
    return undefined;
  }

  /**
   * Export custom types (for sharing/backup)
   */
  exportCustomTypes(): CustomSemanticType[] {
    return Array.from(this.customTypes.values());
  }

  /**
   * Import custom types
   */
  importCustomTypes(types: CustomSemanticType[]): void {
    for (const type of types) {
      this.customTypes.set(type.type, type);
    }
  }
}

export const semanticTypeRegistry = new SemanticTypeRegistryClass();
```

**Acceptance Criteria:**
- [ ] Registry provides unified access to all semantic types
- [ ] Custom types can be added/removed
- [ ] Pattern matching works correctly
- [ ] Export/import functionality works

---

### Task 1.6: Create Metric Registry

**File: `src/industry/MetricRegistry.ts`**

```typescript
import { MetricDefinition, IndustryType, MetricCalculator } from './types';
import { industryRegistry } from './IndustryRegistry';
import { NormalizedData } from '@/adapters/BaseAdapter';

interface CustomMetricDefinition extends MetricDefinition {
  createdBy: 'user' | 'system';
  industry?: IndustryType;
}

class MetricRegistryClass {
  private customMetrics: Map<string, CustomMetricDefinition> = new Map();

  /**
   * Get all metrics for an industry
   */
  getForIndustry(industry: IndustryType): MetricDefinition[] {
    const pack = industryRegistry.get(industry);
    const builtIn = pack?.metrics ?? [];
    const custom = Array.from(this.customMetrics.values())
      .filter(m => !m.industry || m.industry === industry);

    return [...builtIn, ...custom];
  }

  /**
   * Get a specific metric
   */
  get(metricId: string): MetricDefinition | undefined {
    // Check custom first
    if (this.customMetrics.has(metricId)) {
      return this.customMetrics.get(metricId);
    }

    // Check all packs
    for (const pack of industryRegistry.getAll()) {
      const metric = pack.metrics.find(m => m.id === metricId);
      if (metric) return metric;
    }

    return undefined;
  }

  /**
   * Calculate a metric value
   */
  calculate(
    metricId: string,
    data: NormalizedData,
    columnMap: Map<string, string>
  ): number | null {
    const metric = this.get(metricId);
    if (!metric) return null;

    if (typeof metric.formula === 'function') {
      return metric.formula(data, columnMap);
    }

    // Parse and evaluate string formula
    return this.evaluateFormula(metric.formula, data, columnMap);
  }

  /**
   * Add a custom metric
   */
  addCustom(metric: CustomMetricDefinition): void {
    this.customMetrics.set(metric.id, metric);
  }

  /**
   * Remove a custom metric
   */
  removeCustom(metricId: string): boolean {
    return this.customMetrics.delete(metricId);
  }

  /**
   * Evaluate a formula string
   * Supports: SUM, COUNT, AVG, MIN, MAX, DISTINCT
   */
  private evaluateFormula(
    formula: string,
    data: NormalizedData,
    columnMap: Map<string, string>
  ): number | null {
    try {
      // Simple formula parser
      // Example: "SUM(revenue) / COUNT(DISTINCT user_id)"
      let expression = formula;

      // Replace column references
      for (const [alias, colName] of columnMap) {
        expression = expression.replace(new RegExp(alias, 'g'), `data["${colName}"]`);
      }

      // Replace aggregation functions
      const rows = data.rows;

      expression = expression.replace(
        /SUM\(([^)]+)\)/gi,
        (_, col) => rows.reduce((sum, row) => sum + (Number(row[col]) || 0), 0).toString()
      );

      expression = expression.replace(
        /COUNT\(DISTINCT ([^)]+)\)/gi,
        (_, col) => new Set(rows.map(r => r[col])).size.toString()
      );

      expression = expression.replace(
        /COUNT\(([^)]+)\)/gi,
        (_, col) => rows.filter(r => r[col] != null).length.toString()
      );

      expression = expression.replace(
        /AVG\(([^)]+)\)/gi,
        (_, col) => {
          const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
          return (vals.reduce((a, b) => a + b, 0) / vals.length).toString();
        }
      );

      // Evaluate the expression (basic arithmetic only)
      // Note: In production, use a proper expression parser
      return Function(`"use strict"; return (${expression})`)();
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return null;
    }
  }
}

export const metricRegistry = new MetricRegistryClass();
```

**Acceptance Criteria:**
- [ ] Metrics can be retrieved by industry
- [ ] Custom metrics can be defined
- [ ] Formula evaluation works for basic expressions
- [ ] Calculation returns correct values

---

### Task 1.7: Create Index Exports

**File: `src/industry/index.ts`**

```typescript
// Types
export * from './types';

// Registry
export { industryRegistry } from './IndustryRegistry';
export { semanticTypeRegistry } from './SemanticTypeRegistry';
export { metricRegistry } from './MetricRegistry';

// Detector
export { IndustryDetector, industryDetector } from './IndustryDetector';

// Pack loader
export { loadBuiltInPacks } from './packs';
```

**File: `src/industry/packs/index.ts`**

```typescript
import { IndustryPack } from '../types';

// Lazy load packs for code splitting
export async function loadBuiltInPacks(): Promise<IndustryPack[]> {
  const packs: IndustryPack[] = [];

  // Gaming pack will be added in Phase 2
  // For now, return empty array

  return packs;
}

export function getAvailablePackIds(): string[] {
  return ['gaming', 'saas', 'ecommerce'];
}
```

**Acceptance Criteria:**
- [ ] All exports work correctly
- [ ] No circular dependencies
- [ ] Type definitions are properly exported

---

### Task 1.8: Add Path Alias

**File: Update `tsconfig.json`**

Add path alias for industry module:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/industry": ["./src/industry"],
      "@/industry/*": ["./src/industry/*"]
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Path alias works in imports
- [ ] IDE autocomplete works

---

### Task 1.9: Write Unit Tests

**File: `src/industry/__tests__/IndustryRegistry.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { industryRegistry } from '../IndustryRegistry';
import { IndustryPack } from '../types';

const mockPack: IndustryPack = {
  id: 'test',
  name: 'Test Pack',
  description: 'For testing',
  version: '1.0.0',
  subCategories: [{ id: 'default', name: 'Default', description: 'Default', icon: '📊' }],
  semanticTypes: [
    { type: 'test_id', patterns: [/test/i], industry: 'test' as any, category: 'identifier', description: 'Test' }
  ],
  indicators: new Map([['default', [{ signals: ['test_id'], weight: 5 }]]]),
  metrics: [],
  funnelTemplates: [],
  chartConfigs: [],
  chartTitles: new Map(),
  insightTemplates: [],
  tips: new Map(),
  terminology: { user: 'user', session: 'session', conversion: 'conversion', retention: 'retention', revenue: 'revenue', churn: 'churn' },
  sidebarPriorities: new Map(),
  theme: { primaryColor: '#000', accentColor: '#fff', chartColors: [], icon: '📊' },
};

describe('IndustryRegistry', () => {
  beforeEach(() => {
    // Reset registry
    industryRegistry.unregister('test' as any);
  });

  it('should register a pack', () => {
    industryRegistry.register(mockPack);
    expect(industryRegistry.get('test' as any)).toBeDefined();
  });

  it('should unregister a pack', () => {
    industryRegistry.register(mockPack);
    industryRegistry.unregister('test' as any);
    expect(industryRegistry.get('test' as any)).toBeUndefined();
  });

  it('should emit events on registration', () => {
    const events: any[] = [];
    industryRegistry.addEventListener(e => events.push(e));
    industryRegistry.register(mockPack);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('pack:registered');
  });
});
```

**File: `src/industry/__tests__/IndustryDetector.test.ts`**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { industryDetector } from '../IndustryDetector';
import { industryRegistry } from '../IndustryRegistry';
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';

describe('IndustryDetector', () => {
  beforeAll(async () => {
    await industryRegistry.initialize();
  });

  it('should return custom when no patterns match', () => {
    const meanings: ColumnMeaning[] = [
      { column: 'unknown', detectedType: 'string', semanticType: 'unknown', confidence: 0.5 }
    ];

    const result = industryDetector.detect(meanings);
    expect(result.industry).toBe('custom');
  });

  it('should have confidence in valid range', () => {
    const meanings: ColumnMeaning[] = [];
    const result = industryDetector.detect(meanings);
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });
});
```

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Coverage > 80% for core modules
- [ ] Edge cases handled

---

## Dependencies

- None (this is the foundation phase)

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/industry/types.ts` | Core type definitions |
| `src/industry/IndustryRegistry.ts` | Pack management |
| `src/industry/IndustryDetector.ts` | Industry detection |
| `src/industry/SemanticTypeRegistry.ts` | Semantic type management |
| `src/industry/MetricRegistry.ts` | Metric definitions |
| `src/industry/index.ts` | Public exports |
| `src/industry/packs/index.ts` | Pack loader |
| `src/industry/__tests__/*.ts` | Unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `tsconfig.json` | Add path alias |

---

## Acceptance Criteria (Phase Complete)

- [ ] All new files created and compile without errors
- [ ] Industry registry can register/unregister packs
- [ ] Industry detector returns valid results
- [ ] Semantic type registry manages types correctly
- [ ] Metric registry can define and calculate metrics
- [ ] All unit tests pass
- [ ] No breaking changes to existing code
- [ ] Documentation complete for all public APIs

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Circular dependencies | Use index exports carefully |
| Performance with many packs | Lazy loading, caching |
| Type complexity | Strong documentation |

---

## Next Phase

Phase 2 will migrate existing game-specific code into the Gaming Industry Pack, using the foundation created in this phase.
