/**
 * Plugin System Store
 * Manages plugins for extending Game Insights functionality
 * Phase 4: Community & Ecosystem
 */

import { dbPut, dbGetAll, dbGet, dbDelete, dbGetByIndex, generateId } from './db';

// ============================================================================
// Types
// ============================================================================

export type PluginType =
    | 'chart'      // New visualization types
    | 'adapter'    // New data sources
    | 'insight'    // Custom analysis
    | 'export'     // New output formats
    | 'theme'      // UI themes
    | 'widget';    // Dashboard widgets

export type PluginStatus =
    | 'installed'
    | 'enabled'
    | 'disabled'
    | 'error'
    | 'updating';

export interface PluginAuthor {
    name: string;
    email?: string;
    url?: string;
    verified?: boolean;
}

export interface PluginDependency {
    id: string;
    version: string;
    optional?: boolean;
}

export interface PluginPermission {
    type: 'data_read' | 'data_write' | 'network' | 'storage' | 'ui';
    description: string;
    required: boolean;
}

export interface PluginConfig {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'select';
        label: string;
        description?: string;
        default: unknown;
        options?: Array<{ value: string; label: string }>;
        required?: boolean;
    };
}

export interface Plugin {
    id: string;
    name: string;
    description: string;
    version: string;
    type: PluginType;
    author: PluginAuthor;

    // Status
    status: PluginStatus;
    enabled: boolean;
    errorMessage?: string;

    // Configuration
    config: PluginConfig;
    settings: Record<string, unknown>;

    // Metadata
    icon?: string;
    homepage?: string;
    repository?: string;
    license?: string;
    tags: string[];
    keywords: string[];

    // Dependencies
    dependencies: PluginDependency[];
    permissions: PluginPermission[];

    // Code
    entryPoint?: string;
    source?: string;

    // Community
    downloads: number;
    rating: number;
    reviewCount: number;

    // Timestamps
    installedAt: string;
    updatedAt: string;
    lastUsedAt?: string;
}

// ============================================================================
// Plugin Interfaces (for plugin developers)
// ============================================================================

/**
 * Base interface all plugins must implement
 */
export interface PluginBase {
    id: string;
    name: string;
    version: string;
    type: PluginType;

    // Lifecycle
    initialize(): Promise<void>;
    destroy(): Promise<void>;

    // Optional hooks
    onDataChange?(data: unknown): void;
    onSettingsChange?(settings: Record<string, unknown>): void;
}

/**
 * Chart plugin interface
 */
export interface ChartPlugin extends PluginBase {
    type: 'chart';
    chartType: string;
    component: React.ComponentType<ChartPluginProps>;
    requiredColumns: string[];
    recommendedFor: string[];
    defaultOptions?: Record<string, unknown>;
}

export interface ChartPluginProps {
    data: Record<string, unknown>[];
    columns: { x?: string; y?: string; series?: string };
    options?: Record<string, unknown>;
    width?: number;
    height?: number;
}

/**
 * Adapter plugin interface
 */
export interface AdapterPlugin extends PluginBase {
    type: 'adapter';
    sourceType: string;
    connect(config: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    fetchData(query?: Record<string, unknown>): Promise<unknown[]>;
    getSchema(): Promise<{ columns: Array<{ name: string; type: string }> }>;
}

/**
 * Insight plugin interface
 */
export interface InsightPlugin extends PluginBase {
    type: 'insight';
    analyze(data: unknown[], context: Record<string, unknown>): Promise<InsightResult[]>;
}

export interface InsightResult {
    id: string;
    type: 'positive' | 'negative' | 'warning' | 'opportunity' | 'neutral';
    title: string;
    description: string;
    metrics?: Record<string, number>;
    actions?: Array<{ label: string; action: string }>;
    confidence: number;
}

/**
 * Export plugin interface
 */
export interface ExportPlugin extends PluginBase {
    type: 'export';
    format: string;
    mimeType: string;
    fileExtension: string;
    export(data: unknown[], options?: Record<string, unknown>): Promise<Blob>;
}

// ============================================================================
// Store Name
// ============================================================================

const STORE_NAME = 'plugins';

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Install a new plugin
 */
export async function installPlugin(
    plugin: Omit<Plugin, 'id' | 'status' | 'installedAt' | 'updatedAt' | 'downloads' | 'rating' | 'reviewCount'>
): Promise<Plugin> {
    const now = new Date().toISOString();
    const newPlugin: Plugin = {
        ...plugin,
        id: generateId(),
        status: 'installed',
        enabled: true,
        downloads: 0,
        rating: 0,
        reviewCount: 0,
        installedAt: now,
        updatedAt: now,
    };

    await dbPut(STORE_NAME, newPlugin);
    return newPlugin;
}

/**
 * Get all installed plugins
 */
export async function getAllPlugins(): Promise<Plugin[]> {
    return dbGetAll<Plugin>(STORE_NAME);
}

/**
 * Get plugin by ID
 */
export async function getPlugin(id: string): Promise<Plugin | undefined> {
    return dbGet<Plugin>(STORE_NAME, id);
}

/**
 * Update plugin
 */
export async function updatePlugin(
    id: string,
    updates: Partial<Omit<Plugin, 'id' | 'installedAt'>>
): Promise<Plugin | undefined> {
    const existing = await getPlugin(id);
    if (!existing) return undefined;

    const updated: Plugin = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    await dbPut(STORE_NAME, updated);
    return updated;
}

/**
 * Uninstall plugin
 */
export async function uninstallPlugin(id: string): Promise<void> {
    await dbDelete(STORE_NAME, id);
}

/**
 * Get plugins by type
 */
export async function getPluginsByType(type: PluginType): Promise<Plugin[]> {
    return dbGetByIndex<Plugin>(STORE_NAME, 'type', type);
}

/**
 * Get enabled plugins
 */
export async function getEnabledPlugins(): Promise<Plugin[]> {
    const all = await getAllPlugins();
    return all.filter(p => p.enabled && p.status !== 'error');
}

/**
 * Enable plugin
 */
export async function enablePlugin(id: string): Promise<Plugin | undefined> {
    return updatePlugin(id, { enabled: true, status: 'enabled' });
}

/**
 * Disable plugin
 */
export async function disablePlugin(id: string): Promise<Plugin | undefined> {
    return updatePlugin(id, { enabled: false, status: 'disabled' });
}

/**
 * Update plugin settings
 */
export async function updatePluginSettings(
    id: string,
    settings: Record<string, unknown>
): Promise<Plugin | undefined> {
    const plugin = await getPlugin(id);
    if (!plugin) return undefined;

    return updatePlugin(id, {
        settings: { ...plugin.settings, ...settings },
        lastUsedAt: new Date().toISOString(),
    });
}

/**
 * Set plugin error
 */
export async function setPluginError(id: string, errorMessage: string): Promise<Plugin | undefined> {
    return updatePlugin(id, { status: 'error', errorMessage, enabled: false });
}

/**
 * Clear plugin error
 */
export async function clearPluginError(id: string): Promise<Plugin | undefined> {
    return updatePlugin(id, { status: 'installed', errorMessage: undefined });
}

// ============================================================================
// Plugin Registry (Runtime)
// ============================================================================

type RegisteredPlugin = ChartPlugin | AdapterPlugin | InsightPlugin | ExportPlugin;

const pluginRegistry = new Map<string, RegisteredPlugin>();
const pluginListeners = new Map<string, Set<(event: PluginEvent) => void>>();

export type PluginEvent =
    | { type: 'registered'; pluginId: string }
    | { type: 'unregistered'; pluginId: string }
    | { type: 'enabled'; pluginId: string }
    | { type: 'disabled'; pluginId: string }
    | { type: 'error'; pluginId: string; error: Error };

/**
 * Register a plugin in the runtime registry
 */
export async function registerPlugin(plugin: RegisteredPlugin): Promise<void> {
    try {
        await plugin.initialize();
        pluginRegistry.set(plugin.id, plugin);
        emitPluginEvent({ type: 'registered', pluginId: plugin.id });
    } catch (error) {
        emitPluginEvent({ type: 'error', pluginId: plugin.id, error: error as Error });
        throw error;
    }
}

/**
 * Unregister a plugin from the runtime registry
 */
export async function unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = pluginRegistry.get(pluginId);
    if (plugin) {
        try {
            await plugin.destroy();
        } catch {
            // Ignore destruction errors
        }
        pluginRegistry.delete(pluginId);
        emitPluginEvent({ type: 'unregistered', pluginId });
    }
}

/**
 * Get a registered plugin
 */
export function getRegisteredPlugin<T extends RegisteredPlugin>(id: string): T | undefined {
    return pluginRegistry.get(id) as T | undefined;
}

/**
 * Get all registered plugins of a type
 */
export function getRegisteredPluginsByType<T extends RegisteredPlugin>(type: PluginType): T[] {
    return Array.from(pluginRegistry.values()).filter(p => p.type === type) as T[];
}

/**
 * Subscribe to plugin events
 */
export function subscribeToPluginEvents(
    pluginId: string | '*',
    callback: (event: PluginEvent) => void
): () => void {
    const listeners = pluginListeners.get(pluginId) || new Set();
    listeners.add(callback);
    pluginListeners.set(pluginId, listeners);

    return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
            pluginListeners.delete(pluginId);
        }
    };
}

/**
 * Emit plugin event
 */
function emitPluginEvent(event: PluginEvent): void {
    // Emit to specific plugin listeners
    const specificListeners = pluginListeners.get(event.pluginId);
    if (specificListeners) {
        specificListeners.forEach(cb => cb(event));
    }

    // Emit to wildcard listeners
    const wildcardListeners = pluginListeners.get('*');
    if (wildcardListeners) {
        wildcardListeners.forEach(cb => cb(event));
    }
}

// ============================================================================
// Built-in Plugin Catalog
// ============================================================================

export const PLUGIN_CATALOG: Array<Omit<Plugin, 'id' | 'status' | 'installedAt' | 'updatedAt' | 'enabled' | 'settings' | 'downloads' | 'rating' | 'reviewCount'>> = [
    {
        name: 'Cohort Heatmap',
        description: 'Visualize retention cohorts as a heatmap with customizable time periods',
        version: '1.0.0',
        type: 'chart',
        author: { name: 'Game Insights', verified: true },
        icon: 'grid',
        tags: ['retention', 'cohort', 'visualization'],
        keywords: ['heatmap', 'cohort', 'retention analysis'],
        dependencies: [],
        permissions: [{ type: 'data_read', description: 'Read game data for analysis', required: true }],
        config: {
            timeUnit: {
                type: 'select',
                label: 'Time Unit',
                default: 'day',
                options: [
                    { value: 'day', label: 'Days' },
                    { value: 'week', label: 'Weeks' },
                    { value: 'month', label: 'Months' },
                ],
            },
            showPercentages: {
                type: 'boolean',
                label: 'Show Percentages',
                default: true,
            },
        },
        license: 'MIT',
    },
    {
        name: 'Sankey Flow',
        description: 'Visualize user flows and funnels as interactive Sankey diagrams',
        version: '1.0.0',
        type: 'chart',
        author: { name: 'Game Insights', verified: true },
        icon: 'gitBranch',
        tags: ['funnel', 'flow', 'visualization'],
        keywords: ['sankey', 'flow', 'user journey'],
        dependencies: [],
        permissions: [{ type: 'data_read', description: 'Read game data for analysis', required: true }],
        config: {
            nodeWidth: {
                type: 'number',
                label: 'Node Width',
                default: 20,
            },
            nodePadding: {
                type: 'number',
                label: 'Node Padding',
                default: 10,
            },
        },
        license: 'MIT',
    },
    {
        name: 'PDF Export',
        description: 'Export dashboards and reports as PDF documents',
        version: '1.0.0',
        type: 'export',
        author: { name: 'Game Insights', verified: true },
        icon: 'fileText',
        tags: ['export', 'pdf', 'reports'],
        keywords: ['pdf', 'export', 'document'],
        dependencies: [],
        permissions: [
            { type: 'data_read', description: 'Read data for export', required: true },
            { type: 'ui', description: 'Access UI for rendering', required: true },
        ],
        config: {
            pageSize: {
                type: 'select',
                label: 'Page Size',
                default: 'a4',
                options: [
                    { value: 'a4', label: 'A4' },
                    { value: 'letter', label: 'Letter' },
                    { value: 'legal', label: 'Legal' },
                ],
            },
            orientation: {
                type: 'select',
                label: 'Orientation',
                default: 'landscape',
                options: [
                    { value: 'portrait', label: 'Portrait' },
                    { value: 'landscape', label: 'Landscape' },
                ],
            },
        },
        license: 'MIT',
    },
    {
        name: 'Churn Predictor',
        description: 'AI-powered churn prediction based on player behavior patterns',
        version: '1.0.0',
        type: 'insight',
        author: { name: 'Game Insights', verified: true },
        icon: 'userMinus',
        tags: ['ai', 'prediction', 'churn'],
        keywords: ['churn', 'prediction', 'machine learning'],
        dependencies: [],
        permissions: [{ type: 'data_read', description: 'Read player data for analysis', required: true }],
        config: {
            lookbackDays: {
                type: 'number',
                label: 'Lookback Period (days)',
                default: 30,
            },
            threshold: {
                type: 'number',
                label: 'Churn Probability Threshold',
                default: 0.7,
            },
        },
        license: 'MIT',
    },
    {
        name: 'Dark Pro Theme',
        description: 'A professional dark theme with enhanced contrast and readability',
        version: '1.0.0',
        type: 'theme',
        author: { name: 'Game Insights', verified: true },
        icon: 'moon',
        tags: ['theme', 'dark', 'ui'],
        keywords: ['theme', 'dark mode', 'styling'],
        dependencies: [],
        permissions: [{ type: 'ui', description: 'Modify UI appearance', required: true }],
        config: {
            accentColor: {
                type: 'select',
                label: 'Accent Color',
                default: 'terracotta',
                options: [
                    { value: 'terracotta', label: 'Terracotta' },
                    { value: 'gold', label: 'Gold' },
                    { value: 'rust', label: 'Rust' },
                    { value: 'tan', label: 'Tan' },
                ],
            },
        },
        license: 'MIT',
    },
];

// ============================================================================
// Plugin Helpers
// ============================================================================

export const PLUGIN_TYPES: { id: PluginType; label: string; description: string; icon: string }[] = [
    { id: 'chart', label: 'Charts', description: 'New visualization types', icon: 'BarChart3' },
    { id: 'adapter', label: 'Adapters', description: 'New data sources', icon: 'Database' },
    { id: 'insight', label: 'Insights', description: 'Custom analysis', icon: 'Lightbulb' },
    { id: 'export', label: 'Exports', description: 'New output formats', icon: 'Download' },
    { id: 'theme', label: 'Themes', description: 'UI themes', icon: 'Palette' },
    { id: 'widget', label: 'Widgets', description: 'Dashboard widgets', icon: 'LayoutGrid' },
];

/**
 * Check if dependencies are satisfied
 */
export async function checkDependencies(plugin: Plugin): Promise<{ satisfied: boolean; missing: string[] }> {
    const installed = await getAllPlugins();
    const installedIds = new Set(installed.map(p => p.id));
    const missing: string[] = [];

    for (const dep of plugin.dependencies) {
        if (!dep.optional && !installedIds.has(dep.id)) {
            missing.push(dep.id);
        }
    }

    return {
        satisfied: missing.length === 0,
        missing,
    };
}

/**
 * Validate plugin structure
 */
export function validatePlugin(plugin: Partial<Plugin>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!plugin.name || plugin.name.length < 2) {
        errors.push('Plugin name is required (min 2 characters)');
    }
    if (!plugin.version || !/^\d+\.\d+\.\d+$/.test(plugin.version)) {
        errors.push('Plugin version must be in semver format (e.g., 1.0.0)');
    }
    if (!plugin.type || !PLUGIN_TYPES.some(t => t.id === plugin.type)) {
        errors.push('Plugin type is required and must be valid');
    }
    if (!plugin.author?.name) {
        errors.push('Plugin author name is required');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
