/**
 * Industry Types - Core type definitions for multi-industry analytics
 *
 * This module defines the foundational types for the industry-agnostic
 * analytics system. Each industry (gaming, saas, ecommerce, etc.) is
 * represented by an IndustryPack that contains all the configuration
 * needed for industry-specific analysis.
 */

/**
 * Supported industry types
 */
export type IndustryType =
  | 'gaming'
  | 'saas'
  | 'ecommerce'
  | 'edtech'
  | 'media'
  | 'fintech'
  | 'healthcare'
  | 'custom';

/**
 * Sub-category within an industry
 * Example: gaming has puzzle, idle, battle_royale, etc.
 */
export interface IndustrySubCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

/**
 * Semantic type definition for column detection
 */
export interface IndustrySemanticType {
  /** The semantic type identifier (e.g., 'user_id', 'mrr', 'level') */
  type: string;
  /** Patterns to match column names */
  patterns: string[];
  /** Detection priority (higher = more important for industry detection) */
  priority: number;
  /** Optional description */
  description?: string;
  /** Expected data type */
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
}

/**
 * Detection indicator for industry classification
 */
export interface DetectionIndicator {
  /** Semantic types that indicate this industry */
  types: string[];
  /** Weight for scoring (1-10) */
  weight: number;
  /** Minimum count required */
  minCount?: number;
  /** Description of why this indicates the industry */
  reason?: string;
}

/**
 * Formula for metric calculation
 */
export interface MetricFormula {
  /** Expression with $column references */
  expression: string;
  /** Required semantic types */
  requiredTypes?: string[];
  /** Optional fallback expression */
  fallback?: string;
}

/**
 * Metric definition
 */
export interface MetricDefinition {
  id: string;
  name: string;
  description?: string;
  formula: MetricFormula;
  format: 'number' | 'percentage' | 'currency' | 'duration' | 'decimal';
  category: 'kpi' | 'engagement' | 'monetization' | 'retention' | 'funnel' | 'custom';
  /** Good/bad thresholds for visualization */
  thresholds?: {
    good?: number;
    warning?: number;
    bad?: number;
  };
  /** Industry-specific tags */
  tags?: string[];
  /** Only applicable to certain sub-categories */
  subCategories?: string[];
}

/**
 * Funnel step definition
 */
export interface FunnelStep {
  id: string;
  name: string;
  semanticType: string;
  /** Event name patterns to match */
  eventPatterns?: string[];
  /** Optional condition for this step */
  condition?: string;
}

/**
 * Pre-defined funnel template
 */
export interface FunnelTemplate {
  id: string;
  name: string;
  description?: string;
  steps: FunnelStep[];
  /** Only applicable to certain sub-categories */
  subCategories?: string[];
}

/**
 * Chart type configuration
 */
export interface ChartTypeConfig {
  type: 'retention' | 'funnel' | 'line' | 'bar' | 'area' | 'pie' | 'heatmap' | 'scatter' | 'cohort';
  name: string;
  description?: string;
  /** Metrics this chart can display */
  metrics: string[];
  /** Default dimensions */
  defaultDimensions?: string[];
  /** Sub-categories this applies to */
  subCategories?: string[];
}

/**
 * Chart configuration for the industry
 */
export interface ChartConfig {
  types: ChartTypeConfig[];
  defaultCharts?: string[];
}

/**
 * Insight template for AI-generated insights
 */
export interface InsightTemplate {
  id: string;
  name: string;
  /** Template string with {{metric}} placeholders */
  template: string;
  /** Metrics required for this insight */
  requiredMetrics: string[];
  /** Priority for display (higher = more important) */
  priority: number;
  /** Category of insight */
  category: 'positive' | 'negative' | 'neutral' | 'actionable';
}

/**
 * Terminology mapping for industry-specific language
 */
export interface TerminologyMap {
  /** What users are called */
  user?: { singular: string; plural: string };
  /** What sessions are called */
  session?: { singular: string; plural: string };
  /** What conversions are called */
  conversion?: { singular: string; plural: string };
  /** What revenue is called */
  revenue?: { singular: string; plural: string };
  /** Custom terminology entries */
  [key: string]: { singular: string; plural: string } | undefined;
}

/**
 * Theme configuration for industry
 */
export interface IndustryTheme {
  primaryColor: string;
  accentColor: string;
  chartColors: string[];
  icon?: string;
}

/**
 * Complete Industry Pack definition
 */
export interface IndustryPack {
  /** Unique identifier */
  id: IndustryType;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Semantic version */
  version: string;

  /** Sub-categories within this industry */
  subCategories: IndustrySubCategory[];

  /** Semantic types for column detection */
  semanticTypes: IndustrySemanticType[];

  /** Detection indicators for industry classification */
  detectionIndicators: DetectionIndicator[];

  /** Metric definitions */
  metrics: MetricDefinition[];

  /** Pre-defined funnels */
  funnels: FunnelTemplate[];

  /** Chart configurations */
  chartConfigs: ChartConfig;

  /** Insight templates */
  insightTemplates: InsightTemplate[];

  /** Terminology mapping */
  terminology: TerminologyMap;

  /** Theme configuration */
  theme: IndustryTheme;

  /** Optional metadata */
  metadata?: {
    author?: string;
    license?: string;
    homepage?: string;
    repository?: string;
  };
}

/**
 * Detection result from IndustryDetector
 */
export interface DetectionResult {
  primary: {
    industry: IndustryType;
    subCategory?: string;
    confidence: number;
    reasons: string[];
  };
  alternatives: Array<{
    industry: IndustryType;
    subCategory?: string;
    confidence: number;
    reasons: string[];
  }>;
  isAmbiguous: boolean;
  detectedSemanticTypes: Array<{
    column: string;
    type: string;
    confidence: number;
  }>;
}

/**
 * Column meaning from schema analysis
 */
export interface ColumnMeaning {
  column: string;
  meaning: string;
  confidence: number;
  dataType?: string;
}

/**
 * Registry event types
 */
export type RegistryEventType = 'registered' | 'unregistered' | 'updated';

export interface RegistryEvent {
  type: RegistryEventType;
  packId: string;
  pack?: IndustryPack;
}

export type RegistryListener = (event: RegistryEvent) => void;
