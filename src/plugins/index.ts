/**
 * Plugin System Exports
 * Phase 4: Community & Ecosystem
 */

// Types
export type {
    PluginType,
    PluginStatus,
    Plugin,
    PluginMetadata,
    PluginEvent,
    PluginEventType,
    PluginEventHandler,
    PluginPackage,
    // Chart plugin types
    ChartPluginDefinition,
    ChartPluginConfig,
    ChartPluginProps,
    // Adapter plugin types
    AdapterPluginDefinition,
    AdapterPluginConfig,
    ConfigField,
    // Insight plugin types
    InsightPluginDefinition,
    InsightPluginConfig,
    InsightContext,
    InsightResult,
    // Export plugin types
    ExportPluginDefinition,
    ExportPluginConfig,
    ExportContext,
    ExportResult,
} from './types';

// Type guards
export {
    isChartPlugin,
    isAdapterPlugin,
    isInsightPlugin,
    isExportPlugin,
} from './types';

// Registry
export {
    pluginRegistry,
    registerChartPlugin,
    registerAdapterPlugin,
    registerInsightPlugin,
    registerExportPlugin,
} from './registry';
