/**
 * PackDevKit - Developer kit for creating custom industry packs
 *
 * Provides a fluent builder API for creating industry packs
 * with validation and type safety.
 */

import {
  IndustryPack,
  IndustryType,
  IndustrySemanticType,
  MetricDefinition,
  FunnelTemplate,
  ChartTypeConfig,
  InsightTemplate,
  TerminologyMap,
  IndustryTheme,
  IndustrySubCategory,
} from './types';

/**
 * Builder for creating industry packs with fluent API
 */
export class PackDevKit {
  private pack: Partial<IndustryPack>;

  constructor(id: IndustryType | string, name: string) {
    this.pack = {
      id: id as IndustryType,
      name,
      version: '1.0.0',
      subCategories: [],
      semanticTypes: [],
      detectionIndicators: [],
      metrics: [],
      funnels: [],
      chartConfigs: { types: [], defaultCharts: [] },
      insightTemplates: [],
      terminology: {},
      theme: {
        primaryColor: '#8b5cf6',
        accentColor: '#6366f1',
        chartColors: [],
      },
    };
  }

  /**
   * Set pack description
   */
  describe(description: string): this {
    this.pack.description = description;
    return this;
  }

  /**
   * Set pack version
   */
  version(version: string): this {
    this.pack.version = version;
    return this;
  }

  /**
   * Add a sub-category
   */
  addSubCategory(id: string, name: string, description?: string): this {
    this.pack.subCategories!.push({ id, name, description });
    return this;
  }

  /**
   * Add multiple sub-categories
   */
  addSubCategories(categories: IndustrySubCategory[]): this {
    this.pack.subCategories!.push(...categories);
    return this;
  }

  /**
   * Add a semantic type for column detection
   */
  addSemanticType(
    type: string,
    patterns: string[],
    options?: { priority?: number; description?: string; dataType?: IndustrySemanticType['dataType'] }
  ): this {
    this.pack.semanticTypes!.push({
      type,
      patterns,
      priority: options?.priority ?? 5,
      description: options?.description,
      dataType: options?.dataType,
    });
    return this;
  }

  /**
   * Add multiple semantic types
   */
  addSemanticTypes(types: IndustrySemanticType[]): this {
    this.pack.semanticTypes!.push(...types);
    return this;
  }

  /**
   * Add a detection indicator
   */
  addIndicator(types: string[], weight: number, reason?: string): this {
    this.pack.detectionIndicators!.push({
      types,
      weight,
      reason,
    });
    return this;
  }

  /**
   * Add a metric definition
   */
  addMetric(metric: MetricDefinition): this {
    this.pack.metrics!.push(metric);
    return this;
  }

  /**
   * Add a simple KPI metric
   */
  addKPI(
    id: string,
    name: string,
    expression: string,
    format: MetricDefinition['format'] = 'number',
    options?: { description?: string; thresholds?: MetricDefinition['thresholds'] }
  ): this {
    this.pack.metrics!.push({
      id,
      name,
      description: options?.description,
      formula: { expression },
      format,
      category: 'kpi',
      thresholds: options?.thresholds,
    });
    return this;
  }

  /**
   * Add a funnel
   */
  addFunnel(funnel: FunnelTemplate): this {
    this.pack.funnels!.push(funnel);
    return this;
  }

  /**
   * Create a funnel builder
   */
  createFunnel(id: string, name: string): FunnelBuilder {
    return new FunnelBuilder(this, id, name);
  }

  /**
   * Add a chart type configuration
   */
  addChartType(config: ChartTypeConfig): this {
    this.pack.chartConfigs!.types.push(config);
    return this;
  }

  /**
   * Set default charts
   */
  setDefaultCharts(chartIds: string[]): this {
    this.pack.chartConfigs!.defaultCharts = chartIds;
    return this;
  }

  /**
   * Add an insight template
   */
  addInsight(insight: InsightTemplate): this {
    this.pack.insightTemplates!.push(insight);
    return this;
  }

  /**
   * Set terminology mapping
   */
  setTerminology(terminology: TerminologyMap): this {
    this.pack.terminology = terminology;
    return this;
  }

  /**
   * Add a terminology entry
   */
  addTerm(key: string, singular: string, plural: string): this {
    this.pack.terminology![key] = { singular, plural };
    return this;
  }

  /**
   * Set theme
   */
  setTheme(theme: Partial<IndustryTheme>): this {
    this.pack.theme = {
      ...this.pack.theme!,
      ...theme,
    };
    return this;
  }

  /**
   * Set metadata
   */
  setMetadata(metadata: IndustryPack['metadata']): this {
    this.pack.metadata = metadata;
    return this;
  }

  /**
   * Validate the pack
   */
  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!this.pack.id) errors.push('Pack ID is required');
    if (!this.pack.name) errors.push('Pack name is required');

    // Empty checks
    if (!this.pack.subCategories?.length) {
      warnings.push('No sub-categories defined');
    }
    if (!this.pack.semanticTypes?.length) {
      warnings.push('No semantic types defined - detection will not work');
    }
    if (!this.pack.metrics?.length) {
      warnings.push('No metrics defined');
    }
    if (!this.pack.detectionIndicators?.length) {
      warnings.push('No detection indicators - industry cannot be auto-detected');
    }

    // Check for duplicate IDs
    const semanticTypeIds = this.pack.semanticTypes?.map((st) => st.type) || [];
    const duplicateTypes = semanticTypeIds.filter(
      (id, i) => semanticTypeIds.indexOf(id) !== i
    );
    duplicateTypes.forEach((id) =>
      errors.push(`Duplicate semantic type: ${id}`)
    );

    const metricIds = this.pack.metrics?.map((m) => m.id) || [];
    const duplicateMetrics = metricIds.filter((id, i) => metricIds.indexOf(id) !== i);
    duplicateMetrics.forEach((id) => errors.push(`Duplicate metric: ${id}`));

    // Theme validation
    if (!this.pack.theme?.chartColors?.length) {
      warnings.push('No chart colors defined');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Build the pack
   * @throws Error if validation fails
   */
  build(): IndustryPack {
    const validation = this.validate();

    if (!validation.isValid) {
      throw new Error(`Pack validation failed:\n${validation.errors.join('\n')}`);
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn('Pack warnings:', validation.warnings);
    }

    return this.pack as IndustryPack;
  }

  /**
   * Build without strict validation
   */
  buildUnsafe(): IndustryPack {
    return this.pack as IndustryPack;
  }

  /**
   * Internal: Add funnel from builder
   */
  _addFunnel(funnel: FunnelTemplate): void {
    this.pack.funnels!.push(funnel);
  }
}

/**
 * Funnel builder for fluent funnel creation
 */
class FunnelBuilder {
  private parent: PackDevKit;
  private funnel: FunnelTemplate;

  constructor(parent: PackDevKit, id: string, name: string) {
    this.parent = parent;
    this.funnel = {
      id,
      name,
      steps: [],
    };
  }

  /**
   * Set funnel description
   */
  describe(description: string): this {
    this.funnel.description = description;
    return this;
  }

  /**
   * Add a funnel step
   */
  addStep(
    id: string,
    name: string,
    semanticType: string,
    options?: { eventPatterns?: string[]; condition?: string }
  ): this {
    this.funnel.steps.push({
      id,
      name,
      semanticType,
      eventPatterns: options?.eventPatterns,
      condition: options?.condition,
    });
    return this;
  }

  /**
   * Limit funnel to specific sub-categories
   */
  forSubCategories(subCategories: string[]): this {
    this.funnel.subCategories = subCategories;
    return this;
  }

  /**
   * Build and add funnel to pack
   */
  build(): PackDevKit {
    this.parent._addFunnel(this.funnel);
    return this.parent;
  }
}

/**
 * Create a new pack builder
 */
export function createPack(id: IndustryType | string, name: string): PackDevKit {
  return new PackDevKit(id, name);
}

/**
 * Extend an existing pack with customizations
 */
export function extendPack(basePack: IndustryPack, customizations: Partial<IndustryPack>): IndustryPack {
  return {
    ...basePack,
    ...customizations,
    id: customizations.id || basePack.id,
    version: customizations.version || `${basePack.version}-custom`,

    // Merge arrays
    subCategories: [
      ...basePack.subCategories,
      ...(customizations.subCategories || []),
    ],
    semanticTypes: [
      ...basePack.semanticTypes,
      ...(customizations.semanticTypes || []),
    ],
    detectionIndicators: [
      ...basePack.detectionIndicators,
      ...(customizations.detectionIndicators || []),
    ],
    metrics: [
      ...basePack.metrics,
      ...(customizations.metrics || []),
    ],
    funnels: [
      ...basePack.funnels,
      ...(customizations.funnels || []),
    ],
    insightTemplates: [
      ...basePack.insightTemplates,
      ...(customizations.insightTemplates || []),
    ],

    // Merge objects
    terminology: {
      ...basePack.terminology,
      ...customizations.terminology,
    },
    theme: {
      ...basePack.theme,
      ...customizations.theme,
    },
    chartConfigs: {
      types: [
        ...basePack.chartConfigs.types,
        ...(customizations.chartConfigs?.types || []),
      ],
      defaultCharts: customizations.chartConfigs?.defaultCharts || basePack.chartConfigs.defaultCharts,
    },
  };
}

export default PackDevKit;
