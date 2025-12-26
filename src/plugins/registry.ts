/**
 * Plugin Registry
 * Central management for all plugins
 * Phase 4: Community & Ecosystem
 */

import { dbPut, dbGetAll, dbDelete, generateId } from '../lib/db';
import type {
    Plugin,
    PluginMetadata,
    PluginType,
    PluginStatus,
    PluginEvent,
    PluginEventType,
    PluginEventHandler,
    ChartPluginDefinition,
    AdapterPluginDefinition,
    InsightPluginDefinition,
    ExportPluginDefinition,
} from './types';

// ============================================================================
// Types
// ============================================================================

type AnyPluginDefinition =
    | ChartPluginDefinition
    | AdapterPluginDefinition
    | InsightPluginDefinition
    | ExportPluginDefinition;

interface RegisteredPlugin {
    plugin: Plugin;
    definition: AnyPluginDefinition;
}

// ============================================================================
// Plugin Registry Class
// ============================================================================

class PluginRegistry {
    private plugins: Map<string, RegisteredPlugin> = new Map();
    private eventHandlers: Set<PluginEventHandler> = new Set();
    private initialized: boolean = false;

    // ========================================================================
    // Initialization
    // ========================================================================

    async initialize(): Promise<void> {
        if (this.initialized) return;

        // Load plugins from IndexedDB
        const savedPlugins = await dbGetAll<Plugin>('plugins');

        for (const plugin of savedPlugins) {
            // Only load metadata, definitions are loaded on-demand
            this.plugins.set(plugin.metadata.id, {
                plugin,
                definition: null as unknown as AnyPluginDefinition, // Loaded lazily
            });
        }

        this.initialized = true;
    }

    // ========================================================================
    // Plugin Registration
    // ========================================================================

    async register(
        definition: AnyPluginDefinition,
        metadata: Omit<PluginMetadata, 'id'>
    ): Promise<string> {
        const id = generateId();
        const now = new Date().toISOString();

        const fullMetadata: PluginMetadata = {
            ...metadata,
            id,
        };

        const plugin: Plugin = {
            metadata: fullMetadata,
            status: 'installed',
            installedAt: now,
            updatedAt: now,
        };

        // Save to memory
        this.plugins.set(id, { plugin, definition });

        // Save to IndexedDB
        await dbPut('plugins', plugin);

        // Emit event
        this.emit({
            type: 'plugin:installed',
            pluginId: id,
            pluginType: metadata.type,
            timestamp: now,
        });

        return id;
    }

    async unregister(pluginId: string): Promise<boolean> {
        const registered = this.plugins.get(pluginId);
        if (!registered) return false;

        // Remove from memory
        this.plugins.delete(pluginId);

        // Remove from IndexedDB
        await dbDelete('plugins', pluginId);

        // Emit event
        this.emit({
            type: 'plugin:uninstalled',
            pluginId,
            pluginType: registered.plugin.metadata.type,
            timestamp: new Date().toISOString(),
        });

        return true;
    }

    // ========================================================================
    // Plugin Status Management
    // ========================================================================

    async enable(pluginId: string): Promise<boolean> {
        return this.setStatus(pluginId, 'enabled');
    }

    async disable(pluginId: string): Promise<boolean> {
        return this.setStatus(pluginId, 'disabled');
    }

    private async setStatus(pluginId: string, status: PluginStatus): Promise<boolean> {
        const registered = this.plugins.get(pluginId);
        if (!registered) return false;

        const oldStatus = registered.plugin.status;
        registered.plugin.status = status;
        registered.plugin.updatedAt = new Date().toISOString();

        // Save to IndexedDB
        await dbPut('plugins', registered.plugin);

        // Emit event
        const eventType: PluginEventType =
            status === 'enabled' ? 'plugin:enabled' :
                status === 'disabled' ? 'plugin:disabled' :
                    status === 'error' ? 'plugin:error' : 'plugin:updated';

        this.emit({
            type: eventType,
            pluginId,
            pluginType: registered.plugin.metadata.type,
            timestamp: new Date().toISOString(),
            data: { oldStatus, newStatus: status },
        });

        return true;
    }

    async setError(pluginId: string, error: string): Promise<boolean> {
        const registered = this.plugins.get(pluginId);
        if (!registered) return false;

        registered.plugin.status = 'error';
        registered.plugin.error = error;
        registered.plugin.updatedAt = new Date().toISOString();

        await dbPut('plugins', registered.plugin);

        this.emit({
            type: 'plugin:error',
            pluginId,
            pluginType: registered.plugin.metadata.type,
            timestamp: new Date().toISOString(),
            data: { error },
        });

        return true;
    }

    // ========================================================================
    // Plugin Retrieval
    // ========================================================================

    get(pluginId: string): RegisteredPlugin | undefined {
        return this.plugins.get(pluginId);
    }

    getPlugin(pluginId: string): Plugin | undefined {
        return this.plugins.get(pluginId)?.plugin;
    }

    getDefinition(pluginId: string): AnyPluginDefinition | undefined {
        return this.plugins.get(pluginId)?.definition;
    }

    getAll(): Plugin[] {
        return Array.from(this.plugins.values()).map(r => r.plugin);
    }

    getByType(type: PluginType): Plugin[] {
        return this.getAll().filter(p => p.metadata.type === type);
    }

    getEnabled(): Plugin[] {
        return this.getAll().filter(p => p.status === 'enabled');
    }

    getEnabledByType(type: PluginType): Plugin[] {
        return this.getEnabled().filter(p => p.metadata.type === type);
    }

    // ========================================================================
    // Type-Specific Getters
    // ========================================================================

    getChartPlugins(): Array<{ plugin: Plugin; definition: ChartPluginDefinition }> {
        return Array.from(this.plugins.values())
            .filter(r => r.plugin.metadata.type === 'chart' && r.plugin.status === 'enabled')
            .map(r => ({
                plugin: r.plugin,
                definition: r.definition as ChartPluginDefinition,
            }));
    }

    getAdapterPlugins(): Array<{ plugin: Plugin; definition: AdapterPluginDefinition }> {
        return Array.from(this.plugins.values())
            .filter(r => r.plugin.metadata.type === 'adapter' && r.plugin.status === 'enabled')
            .map(r => ({
                plugin: r.plugin,
                definition: r.definition as AdapterPluginDefinition,
            }));
    }

    getInsightPlugins(): Array<{ plugin: Plugin; definition: InsightPluginDefinition }> {
        return Array.from(this.plugins.values())
            .filter(r => r.plugin.metadata.type === 'insight' && r.plugin.status === 'enabled')
            .map(r => ({
                plugin: r.plugin,
                definition: r.definition as InsightPluginDefinition,
            }));
    }

    getExportPlugins(): Array<{ plugin: Plugin; definition: ExportPluginDefinition }> {
        return Array.from(this.plugins.values())
            .filter(r => r.plugin.metadata.type === 'export' && r.plugin.status === 'enabled')
            .map(r => ({
                plugin: r.plugin,
                definition: r.definition as ExportPluginDefinition,
            }));
    }

    // ========================================================================
    // Search & Discovery
    // ========================================================================

    search(query: string): Plugin[] {
        const lower = query.toLowerCase();
        return this.getAll().filter(p =>
            p.metadata.name.toLowerCase().includes(lower) ||
            p.metadata.description.toLowerCase().includes(lower) ||
            p.metadata.tags.some(t => t.toLowerCase().includes(lower)) ||
            p.metadata.keywords?.some(k => k.toLowerCase().includes(lower))
        );
    }

    getByTag(tag: string): Plugin[] {
        const lower = tag.toLowerCase();
        return this.getAll().filter(p =>
            p.metadata.tags.some(t => t.toLowerCase() === lower)
        );
    }

    // ========================================================================
    // Event System
    // ========================================================================

    addEventListener(handler: PluginEventHandler): () => void {
        this.eventHandlers.add(handler);
        return () => this.eventHandlers.delete(handler);
    }

    private emit(event: PluginEvent): void {
        this.eventHandlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                console.error('Plugin event handler error:', error);
            }
        });
    }

    // ========================================================================
    // Statistics
    // ========================================================================

    getStats(): {
        total: number;
        byType: Record<PluginType, number>;
        byStatus: Record<PluginStatus, number>;
    } {
        const plugins = this.getAll();

        const byType: Record<PluginType, number> = {
            chart: 0,
            adapter: 0,
            insight: 0,
            export: 0,
        };

        const byStatus: Record<PluginStatus, number> = {
            installed: 0,
            enabled: 0,
            disabled: 0,
            error: 0,
        };

        for (const plugin of plugins) {
            byType[plugin.metadata.type]++;
            byStatus[plugin.status]++;
        }

        return {
            total: plugins.length,
            byType,
            byStatus,
        };
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const pluginRegistry = new PluginRegistry();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Decorator for registering chart plugins
 */
export function registerChartPlugin(metadata: Omit<PluginMetadata, 'id' | 'type'>) {
    return function (definition: ChartPluginDefinition) {
        pluginRegistry.register(definition, { ...metadata, type: 'chart' });
        return definition;
    };
}

/**
 * Decorator for registering adapter plugins
 */
export function registerAdapterPlugin(metadata: Omit<PluginMetadata, 'id' | 'type'>) {
    return function (definition: AdapterPluginDefinition) {
        pluginRegistry.register(definition, { ...metadata, type: 'adapter' });
        return definition;
    };
}

/**
 * Decorator for registering insight plugins
 */
export function registerInsightPlugin(metadata: Omit<PluginMetadata, 'id' | 'type'>) {
    return function (definition: InsightPluginDefinition) {
        pluginRegistry.register(definition, { ...metadata, type: 'insight' });
        return definition;
    };
}

/**
 * Decorator for registering export plugins
 */
export function registerExportPlugin(metadata: Omit<PluginMetadata, 'id' | 'type'>) {
    return function (definition: ExportPluginDefinition) {
        pluginRegistry.register(definition, { ...metadata, type: 'export' });
        return definition;
    };
}
