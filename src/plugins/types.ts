/**
 * Plugin System Types
 * Extensibility architecture for Game Insights
 * Phase 4: Community & Ecosystem
 */

import type { GameCategory } from '../types';
import type { BaseAdapter, AdapterConfig, NormalizedData } from '../adapters/BaseAdapter';

// ============================================================================
// Core Plugin Types
// ============================================================================

export type PluginType = 'chart' | 'adapter' | 'insight' | 'export';

export type PluginStatus = 'installed' | 'enabled' | 'disabled' | 'error';

export interface PluginMetadata {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    authorUrl?: string;
    homepage?: string;
    repository?: string;
    license: string;
    type: PluginType;
    tags: string[];
    keywords?: string[];

    // Compatibility
    minAppVersion?: string;
    maxAppVersion?: string;
    dependencies?: string[];

    // Stats
    downloads?: number;
    rating?: number;
}

export interface Plugin<T = unknown> {
    metadata: PluginMetadata;
    status: PluginStatus;
    config?: T;
    installedAt: string;
    updatedAt: string;
    error?: string;
}

// ============================================================================
// Chart Plugin
// ============================================================================

export interface ChartPluginConfig {
    // Component settings
    defaultHeight?: number;
    minHeight?: number;
    maxHeight?: number;
    supportsInteraction?: boolean;
    supportsLegend?: boolean;

    // Data settings
    maxDataPoints?: number;
    aggregationMethods?: ('sum' | 'avg' | 'count' | 'min' | 'max')[];
}

export interface ChartPluginDefinition {
    type: string; // Unique chart type identifier
    name: string;
    description: string;
    icon?: string;

    // Rendering
    component: React.ComponentType<ChartPluginProps>;

    // Data requirements
    requiredColumns: {
        x?: string[];  // Semantic types for X axis
        y?: string[];  // Semantic types for Y axis
        group?: string[]; // Semantic types for grouping
    };

    // Recommendations
    recommendedFor: GameCategory[];
    priority: number; // 1-10, higher = more important

    // Config
    config?: ChartPluginConfig;
}

export interface ChartPluginProps {
    data: NormalizedData;
    xColumn: string;
    yColumn: string;
    groupColumn?: string;
    title?: string;
    subtitle?: string;
    height?: number;
    colors?: string[];
    interactive?: boolean;
    onDataPointClick?: (point: unknown) => void;
}

// ============================================================================
// Adapter Plugin
// ============================================================================

export interface AdapterPluginConfig {
    // Connection settings
    defaultTimeout?: number;
    retryAttempts?: number;
    retryDelay?: number;

    // Capabilities
    supportsRealtime?: boolean;
    supportsFiltering?: boolean;
    supportsAggregation?: boolean;
    maxRowsPerQuery?: number;
}

export interface AdapterPluginDefinition {
    type: string; // Unique adapter type identifier
    name: string;
    description: string;
    icon?: string;

    // Authentication
    authMethods: ('apikey' | 'oauth' | 'basic' | 'bearer' | 'none')[];

    // Factory
    createAdapter: (config: AdapterConfig) => BaseAdapter;

    // Configuration UI
    configFields: ConfigField[];

    // Docs
    docsUrl?: string;
    setupGuide?: string;

    // Config
    config?: AdapterPluginConfig;
}

export interface ConfigField {
    name: string;
    label: string;
    type: 'text' | 'password' | 'number' | 'select' | 'checkbox' | 'textarea';
    required: boolean;
    placeholder?: string;
    defaultValue?: unknown;
    options?: { value: string; label: string }[];
    helpText?: string;
    validation?: {
        pattern?: string;
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
    };
}

// ============================================================================
// Insight Plugin
// ============================================================================

export interface InsightPluginConfig {
    // Analysis settings
    minDataPoints?: number;
    confidenceThreshold?: number;

    // Rate limiting
    maxInsightsPerRun?: number;
}

export interface InsightPluginDefinition {
    type: string; // Unique insight type identifier
    name: string;
    description: string;
    icon?: string;

    // Analysis function
    analyze: (context: InsightContext) => Promise<InsightResult[]>;

    // Requirements
    requiredColumns: string[]; // Semantic types needed
    optionalColumns?: string[];

    // Recommendations
    recommendedFor: GameCategory[];
    category: 'retention' | 'monetization' | 'engagement' | 'progression' | 'quality';

    // Config
    config?: InsightPluginConfig;
}

export interface InsightContext {
    data: NormalizedData;
    columnMeanings: Array<{ column: string; semantic: string; confidence: number }>;
    gameType: GameCategory;
    metrics?: Record<string, number>;
    previousInsights?: InsightResult[];
}

export interface InsightResult {
    id: string;
    type: 'positive' | 'negative' | 'warning' | 'opportunity' | 'neutral';
    title: string;
    description: string;
    recommendation?: string;
    priority: number; // 1-10
    confidence: number; // 0-1
    category: string;
    data?: Record<string, unknown>;
}

// ============================================================================
// Export Plugin
// ============================================================================

export interface ExportPluginConfig {
    // Format settings
    defaultFilename?: string;
    mimeType?: string;
    fileExtension?: string;

    // Options
    supportsFiltering?: boolean;
    supportsFormatting?: boolean;
}

export interface ExportPluginDefinition {
    type: string; // Unique export type identifier
    name: string;
    description: string;
    icon?: string;
    format: string; // e.g., 'csv', 'xlsx', 'pdf', 'png'

    // Export function
    export: (context: ExportContext) => Promise<ExportResult>;

    // UI
    configFields?: ConfigField[];

    // Config
    config?: ExportPluginConfig;
}

export interface ExportContext {
    data: NormalizedData;
    charts?: Array<{ id: string; title: string; type: string }>;
    insights?: InsightResult[];
    metadata?: Record<string, unknown>;
    options?: Record<string, unknown>;
}

export interface ExportResult {
    success: boolean;
    filename: string;
    data: Blob | string;
    mimeType: string;
    size: number;
    error?: string;
}

// ============================================================================
// Plugin Registry Events
// ============================================================================

export type PluginEventType =
    | 'plugin:installed'
    | 'plugin:enabled'
    | 'plugin:disabled'
    | 'plugin:uninstalled'
    | 'plugin:error'
    | 'plugin:updated';

export interface PluginEvent {
    type: PluginEventType;
    pluginId: string;
    pluginType: PluginType;
    timestamp: string;
    data?: unknown;
}

export type PluginEventHandler = (event: PluginEvent) => void;

// ============================================================================
// Plugin Package Format
// ============================================================================

export interface PluginPackage {
    metadata: PluginMetadata;
    definition: ChartPluginDefinition | AdapterPluginDefinition | InsightPluginDefinition | ExportPluginDefinition;
    readme?: string;
    changelog?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isChartPlugin(def: unknown): def is ChartPluginDefinition {
    return typeof def === 'object' && def !== null && 'component' in def && 'requiredColumns' in def;
}

export function isAdapterPlugin(def: unknown): def is AdapterPluginDefinition {
    return typeof def === 'object' && def !== null && 'createAdapter' in def && 'authMethods' in def;
}

export function isInsightPlugin(def: unknown): def is InsightPluginDefinition {
    return typeof def === 'object' && def !== null && 'analyze' in def && 'category' in def;
}

export function isExportPlugin(def: unknown): def is ExportPluginDefinition {
    return typeof def === 'object' && def !== null && 'export' in def && 'format' in def;
}
