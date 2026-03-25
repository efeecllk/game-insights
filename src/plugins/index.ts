/**
 * Plugin System Exports
 *
 * This barrel is intentionally limited to the plugin types, guards, and
 * registry used by the app. More specialized plugin implementation details
 * should stay in their own modules.
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
