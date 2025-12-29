/**
 * Plugin Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    installPlugin,
    getAllPlugins,
    getPlugin,
    updatePlugin,
    uninstallPlugin,
    getPluginsByType,
    getEnabledPlugins,
    enablePlugin,
    disablePlugin,
    updatePluginSettings,
    setPluginError,
    clearPluginError,
    registerPlugin,
    unregisterPlugin,
    getRegisteredPlugin,
    getRegisteredPluginsByType,
    subscribeToPluginEvents,
    validatePlugin,
    checkDependencies,
    PLUGIN_CATALOG,
    PLUGIN_TYPES,
    type Plugin,
    type PluginType,
    type PluginBase,
} from '../../../src/lib/pluginStore';

// Mock the db module
vi.mock('../../../src/lib/db', () => ({
    dbPut: vi.fn().mockResolvedValue(undefined),
    dbGetAll: vi.fn().mockResolvedValue([]),
    dbGet: vi.fn().mockResolvedValue(undefined),
    dbDelete: vi.fn().mockResolvedValue(undefined),
    dbGetByIndex: vi.fn().mockResolvedValue([]),
    generateId: vi.fn().mockReturnValue('plugin-id-123'),
}));

import { dbPut, dbGetAll, dbGet, dbDelete, dbGetByIndex } from '../../../src/lib/db';

describe('pluginStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('installPlugin', () => {
        const samplePluginInput = {
            name: 'Test Plugin',
            description: 'A test plugin',
            version: '1.0.0',
            type: 'chart' as PluginType,
            author: { name: 'Test Author' },
            enabled: false,
            config: {},
            settings: {},
            tags: ['test'],
            keywords: ['chart'],
            dependencies: [],
            permissions: [],
        };

        it('should install a plugin with generated ID', async () => {
            const plugin = await installPlugin(samplePluginInput);

            expect(plugin.id).toBe('plugin-id-123');
            expect(plugin.name).toBe('Test Plugin');
            expect(plugin.status).toBe('installed');
            expect(plugin.enabled).toBe(true);
        });

        it('should initialize stats to zero', async () => {
            const plugin = await installPlugin(samplePluginInput);

            expect(plugin.downloads).toBe(0);
            expect(plugin.rating).toBe(0);
            expect(plugin.reviewCount).toBe(0);
        });

        it('should set timestamps', async () => {
            const plugin = await installPlugin(samplePluginInput);

            expect(plugin.installedAt).toBeDefined();
            expect(plugin.updatedAt).toBeDefined();
        });

        it('should save plugin to database', async () => {
            await installPlugin(samplePluginInput);

            expect(dbPut).toHaveBeenCalledWith('plugins', expect.objectContaining({
                name: 'Test Plugin',
            }));
        });
    });

    describe('getAllPlugins', () => {
        it('should return all plugins from database', async () => {
            const mockPlugins = [
                { id: '1', name: 'Plugin 1' },
                { id: '2', name: 'Plugin 2' },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(mockPlugins as any);

            const plugins = await getAllPlugins();
            expect(plugins).toEqual(mockPlugins);
            expect(dbGetAll).toHaveBeenCalledWith('plugins');
        });
    });

    describe('getPlugin', () => {
        it('should return plugin by ID', async () => {
            const mockPlugin = { id: 'plugin-1', name: 'Test' };
            vi.mocked(dbGet).mockResolvedValueOnce(mockPlugin as any);

            const plugin = await getPlugin('plugin-1');
            expect(plugin).toEqual(mockPlugin);
            expect(dbGet).toHaveBeenCalledWith('plugins', 'plugin-1');
        });

        it('should return undefined for non-existent plugin', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);

            const plugin = await getPlugin('non-existent');
            expect(plugin).toBeUndefined();
        });
    });

    describe('updatePlugin', () => {
        it('should update plugin with new data', async () => {
            const existing = {
                id: 'plugin-1',
                name: 'Old Name',
                installedAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);

            const updated = await updatePlugin('plugin-1', { name: 'New Name' });

            expect(updated?.name).toBe('New Name');
            expect(updated?.installedAt).toBe('2024-01-01T00:00:00Z');
            expect(dbPut).toHaveBeenCalled();
        });

        it('should return undefined if plugin not found', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);

            const updated = await updatePlugin('non-existent', { name: 'Test' });
            expect(updated).toBeUndefined();
        });

        it('should update the updatedAt timestamp', async () => {
            const existing = {
                id: 'plugin-1',
                updatedAt: '2024-01-01T00:00:00Z',
            };
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);

            const updated = await updatePlugin('plugin-1', {});

            expect(updated?.updatedAt).not.toBe('2024-01-01T00:00:00Z');
        });
    });

    describe('uninstallPlugin', () => {
        it('should delete plugin from database', async () => {
            await uninstallPlugin('plugin-1');
            expect(dbDelete).toHaveBeenCalledWith('plugins', 'plugin-1');
        });
    });

    describe('getPluginsByType', () => {
        it('should return plugins filtered by type', async () => {
            const mockPlugins = [
                { id: '1', type: 'chart' },
                { id: '2', type: 'chart' },
            ];
            vi.mocked(dbGetByIndex).mockResolvedValueOnce(mockPlugins as any);

            const plugins = await getPluginsByType('chart');
            expect(plugins).toEqual(mockPlugins);
            expect(dbGetByIndex).toHaveBeenCalledWith('plugins', 'type', 'chart');
        });
    });

    describe('getEnabledPlugins', () => {
        it('should return only enabled plugins without errors', async () => {
            const mockPlugins = [
                { id: '1', enabled: true, status: 'enabled' },
                { id: '2', enabled: false, status: 'disabled' },
                { id: '3', enabled: true, status: 'error' },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(mockPlugins as any);

            const plugins = await getEnabledPlugins();
            expect(plugins.length).toBe(1);
            expect(plugins[0].id).toBe('1');
        });
    });

    describe('enablePlugin', () => {
        it('should set enabled to true and status to enabled', async () => {
            const existing = { id: 'plugin-1', enabled: false, status: 'disabled' };
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);

            const updated = await enablePlugin('plugin-1');

            expect(updated?.enabled).toBe(true);
            expect(updated?.status).toBe('enabled');
        });
    });

    describe('disablePlugin', () => {
        it('should set enabled to false and status to disabled', async () => {
            const existing = { id: 'plugin-1', enabled: true, status: 'enabled' };
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);

            const updated = await disablePlugin('plugin-1');

            expect(updated?.enabled).toBe(false);
            expect(updated?.status).toBe('disabled');
        });
    });

    describe('updatePluginSettings', () => {
        it('should merge new settings with existing', async () => {
            const existing = {
                id: 'plugin-1',
                settings: { theme: 'dark', size: 'large' },
                updatedAt: '2024-01-01T00:00:00Z',
            };
            // First call for getPlugin in updatePluginSettings
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);
            // Second call for getPlugin in updatePlugin
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);

            await updatePluginSettings('plugin-1', { theme: 'light' });

            expect(dbPut).toHaveBeenCalledWith('plugins', expect.objectContaining({
                settings: { theme: 'light', size: 'large' },
            }));
        });

        it('should update lastUsedAt timestamp', async () => {
            const existing = { id: 'plugin-1', settings: {}, updatedAt: '2024-01-01T00:00:00Z' };
            // First call for getPlugin in updatePluginSettings
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);
            // Second call for getPlugin in updatePlugin
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);

            await updatePluginSettings('plugin-1', {});

            expect(dbPut).toHaveBeenCalledWith('plugins', expect.objectContaining({
                lastUsedAt: expect.any(String),
            }));
        });

        it('should return undefined if plugin not found', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);

            const result = await updatePluginSettings('non-existent', {});
            expect(result).toBeUndefined();
        });
    });

    describe('setPluginError', () => {
        it('should set status to error and disable plugin', async () => {
            const existing = { id: 'plugin-1', status: 'enabled', enabled: true };
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);

            const updated = await setPluginError('plugin-1', 'Something went wrong');

            expect(updated?.status).toBe('error');
            expect(updated?.enabled).toBe(false);
            expect(updated?.errorMessage).toBe('Something went wrong');
        });
    });

    describe('clearPluginError', () => {
        it('should reset status to installed and clear error message', async () => {
            const existing = { id: 'plugin-1', status: 'error', errorMessage: 'Error' };
            vi.mocked(dbGet).mockResolvedValueOnce(existing as any);

            const updated = await clearPluginError('plugin-1');

            expect(updated?.status).toBe('installed');
            expect(updated?.errorMessage).toBeUndefined();
        });
    });

    describe('Plugin Registry (Runtime)', () => {
        const createMockPlugin = (id: string, type: PluginType = 'chart'): PluginBase & { type: PluginType } => ({
            id,
            name: `Plugin ${id}`,
            version: '1.0.0',
            type,
            initialize: vi.fn().mockResolvedValue(undefined),
            destroy: vi.fn().mockResolvedValue(undefined),
        });

        afterEach(async () => {
            // Clean up registered plugins
            try {
                await unregisterPlugin('test-plugin');
            } catch {
                // Ignore cleanup errors
            }
        });

        it('should register a plugin and call initialize', async () => {
            const mockPlugin = createMockPlugin('test-plugin');
            await registerPlugin(mockPlugin);

            expect(mockPlugin.initialize).toHaveBeenCalled();
        });

        it('should get a registered plugin by ID', async () => {
            const mockPlugin = createMockPlugin('test-plugin');
            await registerPlugin(mockPlugin);

            const retrieved = getRegisteredPlugin('test-plugin');
            expect(retrieved?.id).toBe('test-plugin');
        });

        it('should return undefined for non-registered plugin', () => {
            const plugin = getRegisteredPlugin('non-existent');
            expect(plugin).toBeUndefined();
        });

        it('should get registered plugins by type', async () => {
            const mockPlugin = createMockPlugin('test-plugin', 'chart');
            await registerPlugin(mockPlugin);

            const plugins = getRegisteredPluginsByType('chart');
            expect(plugins.length).toBeGreaterThanOrEqual(1);
        });

        it('should unregister a plugin and call destroy', async () => {
            const mockPlugin = createMockPlugin('test-plugin');
            await registerPlugin(mockPlugin);
            await unregisterPlugin('test-plugin');

            expect(mockPlugin.destroy).toHaveBeenCalled();
            const retrieved = getRegisteredPlugin('test-plugin');
            expect(retrieved).toBeUndefined();
        });

        it('should emit events when registering plugins', async () => {
            const callback = vi.fn();
            const unsubscribe = subscribeToPluginEvents('*', callback);

            const mockPlugin = createMockPlugin('test-plugin');
            await registerPlugin(mockPlugin);

            expect(callback).toHaveBeenCalledWith({ type: 'registered', pluginId: 'test-plugin' });

            unsubscribe();
        });

        it('should emit events when unregistering plugins', async () => {
            const mockPlugin = createMockPlugin('test-plugin');
            await registerPlugin(mockPlugin);

            const callback = vi.fn();
            const unsubscribe = subscribeToPluginEvents('*', callback);

            await unregisterPlugin('test-plugin');

            expect(callback).toHaveBeenCalledWith({ type: 'unregistered', pluginId: 'test-plugin' });

            unsubscribe();
        });

        it('should unsubscribe from events', async () => {
            const callback = vi.fn();
            const unsubscribe = subscribeToPluginEvents('*', callback);
            unsubscribe();

            const mockPlugin = createMockPlugin('test-plugin');
            await registerPlugin(mockPlugin);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('validatePlugin', () => {
        it('should validate a correct plugin', () => {
            const plugin = {
                name: 'Valid Plugin',
                version: '1.0.0',
                type: 'chart',
                author: { name: 'Test Author' },
            };

            const result = validatePlugin(plugin);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should reject plugin with short name', () => {
            const plugin = {
                name: 'A',
                version: '1.0.0',
                type: 'chart',
                author: { name: 'Test' },
            };

            const result = validatePlugin(plugin);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('name'))).toBe(true);
        });

        it('should reject plugin with invalid version format', () => {
            const plugin = {
                name: 'Test Plugin',
                version: 'invalid',
                type: 'chart',
                author: { name: 'Test' },
            };

            const result = validatePlugin(plugin);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('version'))).toBe(true);
        });

        it('should reject plugin with invalid type', () => {
            const plugin = {
                name: 'Test Plugin',
                version: '1.0.0',
                type: 'invalid_type',
                author: { name: 'Test' },
            };

            const result = validatePlugin(plugin);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('type'))).toBe(true);
        });

        it('should reject plugin without author name', () => {
            const plugin = {
                name: 'Test Plugin',
                version: '1.0.0',
                type: 'chart',
                author: {},
            };

            const result = validatePlugin(plugin as any);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('author'))).toBe(true);
        });
    });

    describe('checkDependencies', () => {
        it('should return satisfied when no dependencies', async () => {
            const plugin = { dependencies: [] } as any;
            vi.mocked(dbGetAll).mockResolvedValueOnce([]);

            const result = await checkDependencies(plugin);
            expect(result.satisfied).toBe(true);
            expect(result.missing.length).toBe(0);
        });

        it('should return missing required dependencies', async () => {
            const plugin = {
                dependencies: [
                    { id: 'dep-1', version: '1.0.0', optional: false },
                    { id: 'dep-2', version: '1.0.0', optional: false },
                ],
            } as any;
            vi.mocked(dbGetAll).mockResolvedValueOnce([{ id: 'dep-1' }] as any);

            const result = await checkDependencies(plugin);
            expect(result.satisfied).toBe(false);
            expect(result.missing).toContain('dep-2');
        });

        it('should not count optional dependencies as missing', async () => {
            const plugin = {
                dependencies: [
                    { id: 'optional-dep', version: '1.0.0', optional: true },
                ],
            } as any;
            vi.mocked(dbGetAll).mockResolvedValueOnce([]);

            const result = await checkDependencies(plugin);
            expect(result.satisfied).toBe(true);
        });
    });

    describe('PLUGIN_CATALOG', () => {
        it('should have multiple plugins in catalog', () => {
            expect(PLUGIN_CATALOG.length).toBeGreaterThan(0);
        });

        it('should have required fields for each catalog item', () => {
            PLUGIN_CATALOG.forEach(plugin => {
                expect(plugin.name).toBeDefined();
                expect(plugin.description).toBeDefined();
                expect(plugin.version).toBeDefined();
                expect(plugin.type).toBeDefined();
                expect(plugin.author).toBeDefined();
            });
        });
    });

    describe('PLUGIN_TYPES', () => {
        it('should have 6 plugin types', () => {
            expect(PLUGIN_TYPES.length).toBe(6);
        });

        it('should include all expected types', () => {
            const ids = PLUGIN_TYPES.map(t => t.id);
            expect(ids).toContain('chart');
            expect(ids).toContain('adapter');
            expect(ids).toContain('insight');
            expect(ids).toContain('export');
            expect(ids).toContain('theme');
            expect(ids).toContain('widget');
        });
    });
});
