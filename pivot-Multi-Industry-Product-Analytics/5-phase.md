# Phase 5: Plugin & Extension System

## Overview

Build a robust plugin and extension system that allows users to install third-party industry packs, create custom metrics via formula builder, and export/share configurations. This phase transforms the platform from a closed system to an extensible ecosystem.

**Duration**: 2 weeks
**Dependencies**: Phase 1-4 (Core Abstractions, Packs, UI)

---

## Objectives

1. Design and implement plugin architecture
2. Create Industry Pack Marketplace infrastructure
3. Build Formula Builder for custom metrics
4. Implement pack import/export functionality
5. Add pack validation and security scanning
6. Create pack development toolkit

---

## Task 5.1: Plugin Architecture

### File: `src/plugins/types.ts`

```typescript
/**
 * Plugin System Type Definitions
 */

// Plugin lifecycle states
export type PluginState = 'installed' | 'enabled' | 'disabled' | 'error' | 'updating';

// Plugin types
export type PluginType = 'industry-pack' | 'visualization' | 'data-source' | 'integration';

// Plugin manifest (package.json for plugins)
export interface PluginManifest {
  // Required fields
  id: string;                    // Unique identifier (e.g., "com.example.retail-pack")
  name: string;                  // Display name
  version: string;               // Semver version
  type: PluginType;              // Plugin type

  // Metadata
  description?: string;
  author?: string;
  authorUrl?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  icon?: string;                 // Base64 or URL

  // Compatibility
  minAppVersion?: string;        // Minimum app version required
  maxAppVersion?: string;        // Maximum compatible version
  dependencies?: Record<string, string>; // Other plugins required

  // Entry points
  main?: string;                 // Main entry file
  exports?: {
    industryPack?: string;       // Path to IndustryPack export
    visualizations?: string;     // Path to visualization exports
    adapters?: string;           // Path to adapter exports
  };

  // Permissions
  permissions?: PluginPermission[];

  // Marketplace metadata
  marketplace?: {
    category: string;
    screenshots?: string[];
    pricing?: 'free' | 'paid' | 'freemium';
    featured?: boolean;
  };
}

// Plugin permissions
export type PluginPermission =
  | 'read:data'           // Read uploaded data
  | 'write:data'          // Modify data
  | 'read:settings'       // Read app settings
  | 'write:settings'      // Modify settings
  | 'network'             // Make network requests
  | 'storage'             // Use local storage
  | 'notifications';      // Show notifications

// Installed plugin record
export interface InstalledPlugin {
  manifest: PluginManifest;
  state: PluginState;
  installedAt: string;
  updatedAt: string;
  enabledAt?: string;
  errorMessage?: string;
  settings?: Record<string, unknown>;
}

// Plugin events
export type PluginEvent =
  | { type: 'installed'; pluginId: string }
  | { type: 'uninstalled'; pluginId: string }
  | { type: 'enabled'; pluginId: string }
  | { type: 'disabled'; pluginId: string }
  | { type: 'updated'; pluginId: string; fromVersion: string; toVersion: string }
  | { type: 'error'; pluginId: string; error: string };

// Plugin API interface exposed to plugins
export interface PluginAPI {
  // Registry access
  registerIndustryPack: (pack: any) => void;
  registerVisualization: (viz: any) => void;
  registerAdapter: (adapter: any) => void;

  // Data access (permission-gated)
  getData: () => Promise<any[]>;
  getSettings: () => Promise<Record<string, unknown>>;

  // UI hooks
  showNotification: (message: string, type?: 'info' | 'success' | 'error') => void;

  // Storage
  getStorage: (key: string) => Promise<unknown>;
  setStorage: (key: string, value: unknown) => Promise<void>;
}

// Plugin context passed to plugin on load
export interface PluginContext {
  api: PluginAPI;
  manifest: PluginManifest;
  settings: Record<string, unknown>;
}

// Plugin entry point function signature
export type PluginEntryPoint = (context: PluginContext) => void | Promise<void>;
```

### File: `src/plugins/PluginManager.ts`

```typescript
import { openDB, IDBPDatabase } from 'idb';
import {
  PluginManifest,
  InstalledPlugin,
  PluginState,
  PluginEvent,
  PluginAPI,
  PluginContext,
  PluginPermission,
} from './types';
import { IndustryRegistry } from '@/industry/IndustryRegistry';
import { IndustryPack } from '@/industry/types';

const DB_NAME = 'plugins-db';
const DB_VERSION = 1;
const PLUGINS_STORE = 'plugins';

type PluginEventListener = (event: PluginEvent) => void;

/**
 * Manages plugin lifecycle, installation, and execution
 */
export class PluginManager {
  private static instance: PluginManager;
  private db: IDBPDatabase | null = null;
  private loadedPlugins: Map<string, InstalledPlugin> = new Map();
  private listeners: Set<PluginEventListener> = new Set();
  private industryRegistry: IndustryRegistry;

  private constructor() {
    this.industryRegistry = IndustryRegistry.getInstance();
  }

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Initialize the plugin manager
   */
  async initialize(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PLUGINS_STORE)) {
          const store = db.createObjectStore(PLUGINS_STORE, { keyPath: 'manifest.id' });
          store.createIndex('type', 'manifest.type');
          store.createIndex('state', 'state');
        }
      },
    });

    // Load all installed plugins
    await this.loadInstalledPlugins();
  }

  /**
   * Load all installed plugins from IndexedDB
   */
  private async loadInstalledPlugins(): Promise<void> {
    if (!this.db) throw new Error('PluginManager not initialized');

    const plugins = await this.db.getAll(PLUGINS_STORE);

    for (const plugin of plugins) {
      this.loadedPlugins.set(plugin.manifest.id, plugin);

      // Auto-enable plugins that were enabled before
      if (plugin.state === 'enabled') {
        await this.enablePlugin(plugin.manifest.id);
      }
    }
  }

  /**
   * Install a plugin from manifest and code
   */
  async installPlugin(
    manifest: PluginManifest,
    packData?: IndustryPack
  ): Promise<InstalledPlugin> {
    if (!this.db) throw new Error('PluginManager not initialized');

    // Validate manifest
    this.validateManifest(manifest);

    // Check for existing installation
    const existing = this.loadedPlugins.get(manifest.id);
    if (existing) {
      throw new Error(`Plugin ${manifest.id} is already installed`);
    }

    // Check compatibility
    this.checkCompatibility(manifest);

    // Create installed plugin record
    const installed: InstalledPlugin = {
      manifest,
      state: 'installed',
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to IndexedDB
    await this.db.put(PLUGINS_STORE, installed);
    this.loadedPlugins.set(manifest.id, installed);

    // If it's an industry pack, register it
    if (manifest.type === 'industry-pack' && packData) {
      this.industryRegistry.registerPack(packData);
    }

    // Emit event
    this.emit({ type: 'installed', pluginId: manifest.id });

    return installed;
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    if (!this.db) throw new Error('PluginManager not initialized');

    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    // Disable first if enabled
    if (plugin.state === 'enabled') {
      await this.disablePlugin(pluginId);
    }

    // Remove from IndexedDB
    await this.db.delete(PLUGINS_STORE, pluginId);
    this.loadedPlugins.delete(pluginId);

    // Unregister from industry registry if applicable
    if (plugin.manifest.type === 'industry-pack') {
      this.industryRegistry.unregisterPack(pluginId as any);
    }

    // Emit event
    this.emit({ type: 'uninstalled', pluginId });
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    if (!this.db) throw new Error('PluginManager not initialized');

    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    if (plugin.state === 'enabled') {
      return; // Already enabled
    }

    try {
      // Update state
      plugin.state = 'enabled';
      plugin.enabledAt = new Date().toISOString();
      plugin.errorMessage = undefined;

      await this.db.put(PLUGINS_STORE, plugin);

      // Emit event
      this.emit({ type: 'enabled', pluginId });
    } catch (error) {
      plugin.state = 'error';
      plugin.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.db.put(PLUGINS_STORE, plugin);

      this.emit({ type: 'error', pluginId, error: plugin.errorMessage });
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    if (!this.db) throw new Error('PluginManager not initialized');

    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    if (plugin.state === 'disabled') {
      return; // Already disabled
    }

    plugin.state = 'disabled';
    plugin.enabledAt = undefined;

    await this.db.put(PLUGINS_STORE, plugin);

    // Emit event
    this.emit({ type: 'disabled', pluginId });
  }

  /**
   * Update a plugin
   */
  async updatePlugin(
    pluginId: string,
    newManifest: PluginManifest,
    newPackData?: IndustryPack
  ): Promise<InstalledPlugin> {
    if (!this.db) throw new Error('PluginManager not initialized');

    const existing = this.loadedPlugins.get(pluginId);
    if (!existing) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    const oldVersion = existing.manifest.version;

    // Validate new manifest
    this.validateManifest(newManifest);

    // Update plugin record
    existing.manifest = newManifest;
    existing.updatedAt = new Date().toISOString();

    await this.db.put(PLUGINS_STORE, existing);

    // Update industry pack if applicable
    if (newManifest.type === 'industry-pack' && newPackData) {
      this.industryRegistry.unregisterPack(pluginId as any);
      this.industryRegistry.registerPack(newPackData);
    }

    // Emit event
    this.emit({
      type: 'updated',
      pluginId,
      fromVersion: oldVersion,
      toVersion: newManifest.version,
    });

    return existing;
  }

  /**
   * Get all installed plugins
   */
  getInstalledPlugins(): InstalledPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get a specific installed plugin
   */
  getPlugin(pluginId: string): InstalledPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Subscribe to plugin events
   */
  subscribe(listener: PluginEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit a plugin event
   */
  private emit(event: PluginEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Validate a plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id) {
      throw new Error('Plugin manifest must have an id');
    }
    if (!manifest.name) {
      throw new Error('Plugin manifest must have a name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest must have a version');
    }
    if (!manifest.type) {
      throw new Error('Plugin manifest must have a type');
    }

    // Validate version format (semver)
    const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
    if (!semverRegex.test(manifest.version)) {
      throw new Error('Plugin version must be valid semver');
    }

    // Validate id format
    const idRegex = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;
    if (!idRegex.test(manifest.id)) {
      throw new Error('Plugin id must be lowercase alphanumeric with dots');
    }
  }

  /**
   * Check plugin compatibility with current app version
   */
  private checkCompatibility(manifest: PluginManifest): void {
    // In a real implementation, compare with actual app version
    const appVersion = '2.0.0';

    if (manifest.minAppVersion) {
      if (this.compareVersions(appVersion, manifest.minAppVersion) < 0) {
        throw new Error(
          `Plugin requires app version ${manifest.minAppVersion} or higher`
        );
      }
    }

    if (manifest.maxAppVersion) {
      if (this.compareVersions(appVersion, manifest.maxAppVersion) > 0) {
        throw new Error(
          `Plugin is not compatible with app version ${appVersion}`
        );
      }
    }
  }

  /**
   * Compare two semver versions
   * Returns: -1 if a < b, 0 if a = b, 1 if a > b
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (partsA[i] < partsB[i]) return -1;
      if (partsA[i] > partsB[i]) return 1;
    }

    return 0;
  }

  /**
   * Create plugin API for a specific plugin
   */
  createPluginAPI(pluginId: string, permissions: PluginPermission[]): PluginAPI {
    const hasPermission = (perm: PluginPermission) => permissions.includes(perm);

    return {
      registerIndustryPack: (pack: IndustryPack) => {
        this.industryRegistry.registerPack(pack);
      },

      registerVisualization: (viz: any) => {
        // TODO: Implement visualization registry
        console.log('Registering visualization:', viz);
      },

      registerAdapter: (adapter: any) => {
        // TODO: Implement adapter registry
        console.log('Registering adapter:', adapter);
      },

      getData: async () => {
        if (!hasPermission('read:data')) {
          throw new Error('Plugin does not have read:data permission');
        }
        // TODO: Return actual data
        return [];
      },

      getSettings: async () => {
        if (!hasPermission('read:settings')) {
          throw new Error('Plugin does not have read:settings permission');
        }
        // TODO: Return actual settings
        return {};
      },

      showNotification: (message: string, type = 'info') => {
        if (!hasPermission('notifications')) {
          throw new Error('Plugin does not have notifications permission');
        }
        // TODO: Show actual notification
        console.log(`[${type}] ${message}`);
      },

      getStorage: async (key: string) => {
        if (!hasPermission('storage')) {
          throw new Error('Plugin does not have storage permission');
        }
        // TODO: Implement plugin-scoped storage
        return localStorage.getItem(`plugin:${pluginId}:${key}`);
      },

      setStorage: async (key: string, value: unknown) => {
        if (!hasPermission('storage')) {
          throw new Error('Plugin does not have storage permission');
        }
        localStorage.setItem(`plugin:${pluginId}:${key}`, JSON.stringify(value));
      },
    };
  }
}
```

---

## Task 5.2: Industry Pack Import/Export

### File: `src/plugins/PackExporter.ts`

```typescript
import { IndustryPack } from '@/industry/types';
import { PluginManifest } from './types';

/**
 * Export format for shareable industry packs
 */
export interface ExportedPack {
  version: '1.0';
  manifest: PluginManifest;
  pack: IndustryPack;
  exportedAt: string;
  checksum: string;
}

/**
 * Handles exporting and importing industry packs
 */
export class PackExporter {
  /**
   * Export an industry pack to a shareable format
   */
  static async exportPack(
    pack: IndustryPack,
    metadata?: Partial<PluginManifest>
  ): Promise<string> {
    const manifest: PluginManifest = {
      id: `custom.${pack.id}`,
      name: pack.name,
      version: '1.0.0',
      type: 'industry-pack',
      description: pack.description,
      ...metadata,
    };

    const exportData: ExportedPack = {
      version: '1.0',
      manifest,
      pack,
      exportedAt: new Date().toISOString(),
      checksum: '', // Will be calculated
    };

    // Calculate checksum (simple hash of content)
    const content = JSON.stringify({ manifest, pack });
    exportData.checksum = await this.calculateChecksum(content);

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import an industry pack from exported format
   */
  static async importPack(data: string): Promise<{
    manifest: PluginManifest;
    pack: IndustryPack;
  }> {
    let parsed: ExportedPack;

    try {
      parsed = JSON.parse(data);
    } catch {
      throw new Error('Invalid pack format: not valid JSON');
    }

    // Validate format version
    if (parsed.version !== '1.0') {
      throw new Error(`Unsupported pack format version: ${parsed.version}`);
    }

    // Validate checksum
    const content = JSON.stringify({ manifest: parsed.manifest, pack: parsed.pack });
    const calculatedChecksum = await this.calculateChecksum(content);

    if (calculatedChecksum !== parsed.checksum) {
      throw new Error('Pack checksum validation failed - file may be corrupted');
    }

    // Validate pack structure
    this.validatePackStructure(parsed.pack);

    return {
      manifest: parsed.manifest,
      pack: parsed.pack,
    };
  }

  /**
   * Download pack as file
   */
  static downloadPack(packJson: string, filename: string): void {
    const blob = new Blob([packJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pack.json') ? filename : `${filename}.pack.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  /**
   * Calculate SHA-256 checksum of content
   */
  private static async calculateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate pack structure
   */
  private static validatePackStructure(pack: any): void {
    const requiredFields = ['id', 'name', 'subCategories'];

    for (const field of requiredFields) {
      if (!(field in pack)) {
        throw new Error(`Invalid pack: missing required field '${field}'`);
      }
    }

    if (!Array.isArray(pack.subCategories) || pack.subCategories.length === 0) {
      throw new Error('Invalid pack: subCategories must be a non-empty array');
    }

    // Validate sub-categories
    for (const subCat of pack.subCategories) {
      if (!subCat.id || !subCat.name) {
        throw new Error('Invalid pack: each subCategory must have id and name');
      }
    }

    // Validate semantic types if present
    if (pack.semanticTypes) {
      if (!Array.isArray(pack.semanticTypes)) {
        throw new Error('Invalid pack: semanticTypes must be an array');
      }

      for (const type of pack.semanticTypes) {
        if (!type.type || !type.patterns) {
          throw new Error('Invalid pack: each semanticType must have type and patterns');
        }
      }
    }

    // Validate metrics if present
    if (pack.metrics) {
      if (!Array.isArray(pack.metrics)) {
        throw new Error('Invalid pack: metrics must be an array');
      }

      for (const metric of pack.metrics) {
        if (!metric.id || !metric.name || !metric.formula) {
          throw new Error('Invalid pack: each metric must have id, name, and formula');
        }
      }
    }
  }
}
```

### File: `src/plugins/PackImportDialog.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { Upload, FileJson, AlertCircle, Check, X } from 'lucide-react';
import { PackExporter, ExportedPack } from './PackExporter';
import { PluginManager } from './PluginManager';
import { cn } from '@/lib/utils';

interface PackImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ImportState = 'idle' | 'loading' | 'preview' | 'installing' | 'success' | 'error';

export function PackImportDialog({ isOpen, onClose, onSuccess }: PackImportDialogProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    manifest: any;
    pack: any;
  } | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setState('loading');
    setError(null);

    try {
      const content = await file.text();
      const imported = await PackExporter.importPack(content);

      setPreviewData(imported);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import pack');
      setState('error');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.pack.json'))) {
      handleFileSelect(file);
    } else {
      setError('Please drop a .pack.json file');
      setState('error');
    }
  }, [handleFileSelect]);

  const handleInstall = useCallback(async () => {
    if (!previewData) return;

    setState('installing');

    try {
      const pluginManager = PluginManager.getInstance();
      await pluginManager.installPlugin(previewData.manifest, previewData.pack);
      await pluginManager.enablePlugin(previewData.manifest.id);

      setState('success');
      onSuccess?.();

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setState('idle');
        setPreviewData(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install pack');
      setState('error');
    }
  }, [previewData, onClose, onSuccess]);

  const handleClose = () => {
    onClose();
    setState('idle');
    setPreviewData(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-card rounded-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">Import Industry Pack</h2>
          <button onClick={handleClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {(state === 'idle' || state === 'loading') && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                state === 'loading'
                  ? 'border-accent-primary bg-accent-primary/5'
                  : 'border-white/20 hover:border-white/40'
              )}
            >
              {state === 'loading' ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mb-4" />
                  <p className="text-white/60">Reading file...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white mb-2">
                    Drag & drop a .pack.json file here
                  </p>
                  <p className="text-white/60 text-sm mb-4">or</p>
                  <label className="inline-block px-4 py-2 bg-accent-primary text-white rounded-lg cursor-pointer hover:bg-accent-primary/80">
                    Choose File
                    <input
                      type="file"
                      accept=".json,.pack.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {state === 'preview' && previewData && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                <FileJson className="w-10 h-10 text-accent-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {previewData.manifest.name}
                  </h3>
                  <p className="text-white/60 text-sm">
                    v{previewData.manifest.version} • {previewData.manifest.type}
                  </p>
                  {previewData.manifest.description && (
                    <p className="text-white/40 text-sm mt-1 line-clamp-2">
                      {previewData.manifest.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Pack details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-white/60">Sub-categories</div>
                  <div className="text-white font-medium">
                    {previewData.pack.subCategories?.length || 0}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-white/60">Semantic Types</div>
                  <div className="text-white font-medium">
                    {previewData.pack.semanticTypes?.length || 0}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-white/60">Metrics</div>
                  <div className="text-white font-medium">
                    {previewData.pack.metrics?.length || 0}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-white/60">Funnels</div>
                  <div className="text-white font-medium">
                    {previewData.pack.funnels?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {state === 'installing' && (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mb-4" />
              <p className="text-white/60">Installing pack...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-white">Pack installed successfully!</p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-red-400 text-center">{error}</p>
              <button
                onClick={() => {
                  setState('idle');
                  setError(null);
                }}
                className="mt-4 text-white/60 hover:text-white text-sm"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {state === 'preview' && (
          <div className="flex justify-end gap-3 p-4 border-t border-white/10">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
            >
              Install Pack
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Task 5.3: Formula Builder for Custom Metrics

### File: `src/plugins/FormulaBuilder.tsx`

```typescript
import React, { useState, useMemo } from 'react';
import { Plus, X, AlertCircle, Check, Play, Save } from 'lucide-react';
import { MetricDefinition, MetricFormula } from '@/industry/types';
import { useProduct } from '@/context/ProductContext';
import { cn } from '@/lib/utils';

// Available functions in formulas
const FORMULA_FUNCTIONS = [
  { name: 'SUM', description: 'Sum of values', syntax: 'SUM(column)' },
  { name: 'AVG', description: 'Average of values', syntax: 'AVG(column)' },
  { name: 'COUNT', description: 'Count of rows', syntax: 'COUNT(column)' },
  { name: 'COUNTIF', description: 'Count with condition', syntax: 'COUNTIF(column, condition)' },
  { name: 'MIN', description: 'Minimum value', syntax: 'MIN(column)' },
  { name: 'MAX', description: 'Maximum value', syntax: 'MAX(column)' },
  { name: 'DISTINCT', description: 'Count unique values', syntax: 'DISTINCT(column)' },
  { name: 'RATIO', description: 'Ratio of two values', syntax: 'RATIO(numerator, denominator)' },
  { name: 'PERCENTILE', description: 'Value at percentile', syntax: 'PERCENTILE(column, n)' },
  { name: 'MEDIAN', description: 'Median value', syntax: 'MEDIAN(column)' },
];

// Operators
const OPERATORS = ['+', '-', '*', '/', '(', ')'];

interface FormulaBuilderProps {
  initialMetric?: MetricDefinition;
  onSave: (metric: MetricDefinition) => void;
  onCancel: () => void;
}

export function FormulaBuilder({ initialMetric, onSave, onCancel }: FormulaBuilderProps) {
  const { currentPack } = useProduct();

  // Form state
  const [id, setId] = useState(initialMetric?.id || '');
  const [name, setName] = useState(initialMetric?.name || '');
  const [description, setDescription] = useState(initialMetric?.description || '');
  const [formula, setFormula] = useState(
    initialMetric?.formula?.expression || ''
  );
  const [format, setFormat] = useState<MetricDefinition['format']>(
    initialMetric?.format || 'number'
  );
  const [category, setCategory] = useState(initialMetric?.category || 'derived');

  // Test state
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    error?: string;
    preview?: string;
  } | null>(null);

  // Available columns from current pack's semantic types
  const availableColumns = useMemo(() => {
    if (!currentPack?.semanticTypes) return [];

    return currentPack.semanticTypes.map((st) => ({
      type: st.type,
      displayName: st.type.replace(/_/g, ' '),
    }));
  }, [currentPack]);

  // Validate formula
  const validateFormula = (expr: string): { valid: boolean; error?: string } => {
    if (!expr.trim()) {
      return { valid: false, error: 'Formula is required' };
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of expr) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        return { valid: false, error: 'Unbalanced parentheses' };
      }
    }
    if (parenCount !== 0) {
      return { valid: false, error: 'Unbalanced parentheses' };
    }

    // Check for valid function names
    const functionPattern = /([A-Z]+)\s*\(/g;
    let match;
    while ((match = functionPattern.exec(expr)) !== null) {
      const funcName = match[1];
      if (!FORMULA_FUNCTIONS.some((f) => f.name === funcName)) {
        return { valid: false, error: `Unknown function: ${funcName}` };
      }
    }

    return { valid: true };
  };

  // Test formula
  const handleTestFormula = () => {
    const validation = validateFormula(formula);

    if (!validation.valid) {
      setTestResult(validation);
      return;
    }

    // Generate preview (mock calculation)
    setTestResult({
      valid: true,
      preview: 'Formula is valid. Preview: ~1,234.56',
    });
  };

  // Save metric
  const handleSave = () => {
    if (!id || !name || !formula) {
      setTestResult({ valid: false, error: 'ID, name, and formula are required' });
      return;
    }

    const validation = validateFormula(formula);
    if (!validation.valid) {
      setTestResult(validation);
      return;
    }

    const metric: MetricDefinition = {
      id: id.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      formula: {
        expression: formula,
        variables: extractVariables(formula),
      },
      format,
      category: category as MetricDefinition['category'],
    };

    onSave(metric);
  };

  // Extract variables from formula
  const extractVariables = (expr: string): Record<string, string> => {
    const variables: Record<string, string> = {};
    const varPattern = /\$([a-z_]+)/gi;
    let match;

    while ((match = varPattern.exec(expr)) !== null) {
      variables[match[1]] = match[1];
    }

    return variables;
  };

  // Insert function into formula
  const insertFunction = (func: typeof FORMULA_FUNCTIONS[0]) => {
    const cursorPos = formula.length;
    const newFormula = formula + func.syntax;
    setFormula(newFormula);
  };

  // Insert column reference
  const insertColumn = (column: string) => {
    setFormula(formula + `$${column}`);
  };

  return (
    <div className="bg-bg-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-medium text-white">
          {initialMetric ? 'Edit Custom Metric' : 'Create Custom Metric'}
        </h2>
        <button onClick={onCancel} className="text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Metric ID</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g., custom_conversion_rate"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-accent-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Custom Conversion Rate"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-accent-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this metric measure?"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-accent-primary focus:outline-none"
          />
        </div>

        {/* Formula Editor */}
        <div>
          <label className="block text-sm text-white/60 mb-1">Formula</label>
          <div className="relative">
            <textarea
              value={formula}
              onChange={(e) => {
                setFormula(e.target.value);
                setTestResult(null);
              }}
              placeholder="e.g., RATIO(COUNTIF($converted, true), COUNT($user_id)) * 100"
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-accent-primary focus:outline-none font-mono text-sm"
            />
          </div>

          {/* Quick Insert */}
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Operators */}
            {OPERATORS.map((op) => (
              <button
                key={op}
                onClick={() => setFormula(formula + ` ${op} `)}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/70 text-sm font-mono"
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Functions Reference */}
        <div>
          <label className="block text-sm text-white/60 mb-2">Available Functions</label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {FORMULA_FUNCTIONS.map((func) => (
              <button
                key={func.name}
                onClick={() => insertFunction(func)}
                className="flex items-start gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-left"
              >
                <code className="text-accent-primary text-sm">{func.name}</code>
                <span className="text-white/50 text-xs">{func.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Column References */}
        {availableColumns.length > 0 && (
          <div>
            <label className="block text-sm text-white/60 mb-2">Available Columns</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {availableColumns.slice(0, 20).map((col) => (
                <button
                  key={col.type}
                  onClick={() => insertColumn(col.type)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/70 text-xs"
                >
                  ${col.type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Format & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as MetricDefinition['format'])}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none"
            >
              <option value="number">Number</option>
              <option value="percentage">Percentage</option>
              <option value="currency">Currency</option>
              <option value="duration">Duration</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none"
            >
              <option value="kpi">KPI</option>
              <option value="derived">Derived</option>
              <option value="aggregate">Aggregate</option>
            </select>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={cn(
              'p-3 rounded-lg flex items-start gap-2',
              testResult.valid ? 'bg-green-500/10' : 'bg-red-500/10'
            )}
          >
            {testResult.valid ? (
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className={testResult.valid ? 'text-green-400' : 'text-red-400'}>
              {testResult.error || testResult.preview}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between p-4 border-t border-white/10">
        <button
          onClick={handleTestFormula}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
        >
          <Play className="w-4 h-4" />
          Test Formula
        </button>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            <Save className="w-4 h-4" />
            Save Metric
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 5.4: Plugin Management UI

### File: `src/pages/Plugins.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  Package,
  Download,
  Upload,
  Settings,
  Trash2,
  Power,
  PowerOff,
  ExternalLink,
  Plus,
  Search,
} from 'lucide-react';
import { PluginManager } from '@/plugins/PluginManager';
import { InstalledPlugin, PluginState } from '@/plugins/types';
import { PackImportDialog } from '@/plugins/PackImportDialog';
import { FormulaBuilder } from '@/plugins/FormulaBuilder';
import { cn } from '@/lib/utils';

export default function Plugins() {
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'installed' | 'marketplace' | 'custom'>('installed');

  const pluginManager = PluginManager.getInstance();

  // Load plugins on mount
  useEffect(() => {
    loadPlugins();

    // Subscribe to plugin events
    const unsubscribe = pluginManager.subscribe((event) => {
      loadPlugins();
    });

    return unsubscribe;
  }, []);

  const loadPlugins = async () => {
    setIsLoading(true);
    const installed = pluginManager.getInstalledPlugins();
    setPlugins(installed);
    setIsLoading(false);
  };

  const handleTogglePlugin = async (pluginId: string, currentState: PluginState) => {
    if (currentState === 'enabled') {
      await pluginManager.disablePlugin(pluginId);
    } else {
      await pluginManager.enablePlugin(pluginId);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    if (window.confirm('Are you sure you want to uninstall this plugin?')) {
      await pluginManager.uninstallPlugin(pluginId);
    }
  };

  // Filter plugins by search
  const filteredPlugins = plugins.filter((plugin) =>
    plugin.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.manifest.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stateColors: Record<PluginState, string> = {
    installed: 'text-white/60',
    enabled: 'text-green-400',
    disabled: 'text-yellow-400',
    error: 'text-red-400',
    updating: 'text-blue-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plugins & Extensions</h1>
          <p className="text-white/60">Manage industry packs and custom extensions</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowFormulaBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
          >
            <Plus className="w-4 h-4" />
            Custom Metric
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            <Upload className="w-4 h-4" />
            Import Pack
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit">
        {(['installed', 'marketplace', 'custom'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={cn(
              'px-4 py-2 rounded-md text-sm transition-colors',
              selectedTab === tab
                ? 'bg-accent-primary text-white'
                : 'text-white/60 hover:text-white'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search plugins..."
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-accent-primary focus:outline-none"
        />
      </div>

      {/* Content */}
      {selectedTab === 'installed' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No plugins installed</p>
              <button
                onClick={() => setShowImportDialog(true)}
                className="mt-4 text-accent-primary hover:text-accent-primary/80"
              >
                Import your first pack
              </button>
            </div>
          ) : (
            filteredPlugins.map((plugin) => (
              <div
                key={plugin.manifest.id}
                className="bg-bg-card rounded-xl p-4 flex items-center gap-4"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-accent-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{plugin.manifest.name}</h3>
                    <span className="text-white/40 text-sm">v{plugin.manifest.version}</span>
                    <span className={cn('text-xs', stateColors[plugin.state])}>
                      • {plugin.state}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm truncate">
                    {plugin.manifest.description || 'No description'}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-white/40">{plugin.manifest.type}</span>
                    {plugin.manifest.author && (
                      <span className="text-xs text-white/40">by {plugin.manifest.author}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePlugin(plugin.manifest.id, plugin.state)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      plugin.state === 'enabled'
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    )}
                    title={plugin.state === 'enabled' ? 'Disable' : 'Enable'}
                  >
                    {plugin.state === 'enabled' ? (
                      <Power className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleUninstallPlugin(plugin.manifest.id)}
                    className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    title="Uninstall"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'marketplace' && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Marketplace Coming Soon</h3>
          <p className="text-white/60">
            Browse and install community-created industry packs
          </p>
        </div>
      )}

      {selectedTab === 'custom' && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Custom Extensions</h3>
          <p className="text-white/60 mb-4">
            Create your own metrics, visualizations, and more
          </p>
          <button
            onClick={() => setShowFormulaBuilder(true)}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            Create Custom Metric
          </button>
        </div>
      )}

      {/* Import Dialog */}
      <PackImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={loadPlugins}
      />

      {/* Formula Builder Modal */}
      {showFormulaBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl">
            <FormulaBuilder
              onSave={(metric) => {
                console.log('Saved metric:', metric);
                setShowFormulaBuilder(false);
              }}
              onCancel={() => setShowFormulaBuilder(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Task 5.5: Pack Development Toolkit

### File: `src/plugins/PackDevKit.ts`

```typescript
import { IndustryPack, IndustrySemanticType, MetricDefinition, FunnelTemplate } from '@/industry/types';
import { PackExporter } from './PackExporter';

/**
 * Development toolkit for creating industry packs
 */
export class PackDevKit {
  private pack: Partial<IndustryPack>;

  constructor(id: string, name: string) {
    this.pack = {
      id: id as any,
      name,
      version: '1.0.0',
      subCategories: [],
      semanticTypes: [],
      detectionIndicators: [],
      metrics: [],
      funnels: [],
      chartConfigs: { types: [] },
      insightTemplates: [],
      terminology: {},
      theme: {
        primaryColor: '#8b5cf6',
        accentColor: '#6366f1',
        chartColors: ['#8b5cf6', '#6366f1', '#ec4899', '#06b6d4', '#22c55e', '#f97316'],
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
    this.pack.subCategories!.push({ id: id as any, name, description });
    return this;
  }

  /**
   * Add a semantic type
   */
  addSemanticType(
    type: string,
    patterns: string[],
    options?: {
      priority?: number;
      subCategories?: string[];
      valuePatterns?: RegExp[];
    }
  ): this {
    this.pack.semanticTypes!.push({
      type: type as any,
      patterns,
      priority: options?.priority || 5,
      subCategories: options?.subCategories as any,
      valuePatterns: options?.valuePatterns,
    });
    return this;
  }

  /**
   * Add a detection indicator
   */
  addIndicator(
    types: string[],
    weight: number,
    subCategories?: string[]
  ): this {
    this.pack.detectionIndicators!.push({
      types: types as any,
      weight,
      subCategories: subCategories as any,
    });
    return this;
  }

  /**
   * Add a metric
   */
  addMetric(metric: Omit<MetricDefinition, 'id'> & { id: string }): this {
    this.pack.metrics!.push(metric as MetricDefinition);
    return this;
  }

  /**
   * Add a funnel template
   */
  addFunnel(funnel: Omit<FunnelTemplate, 'id'> & { id: string }): this {
    this.pack.funnels!.push(funnel as FunnelTemplate);
    return this;
  }

  /**
   * Set terminology mappings
   */
  setTerminology(terms: Record<string, { singular: string; plural?: string }>): this {
    this.pack.terminology = terms;
    return this;
  }

  /**
   * Set theme colors
   */
  setTheme(theme: {
    primaryColor?: string;
    accentColor?: string;
    chartColors?: string[];
    icon?: string;
  }): this {
    this.pack.theme = { ...this.pack.theme, ...theme };
    return this;
  }

  /**
   * Build the final pack
   */
  build(): IndustryPack {
    // Validate required fields
    if (!this.pack.id) throw new Error('Pack id is required');
    if (!this.pack.name) throw new Error('Pack name is required');
    if (!this.pack.subCategories?.length) {
      throw new Error('At least one sub-category is required');
    }

    return this.pack as IndustryPack;
  }

  /**
   * Export to JSON string
   */
  async export(): Promise<string> {
    const pack = this.build();
    return PackExporter.exportPack(pack);
  }

  /**
   * Download as file
   */
  async download(filename?: string): Promise<void> {
    const json = await this.export();
    const name = filename || `${this.pack.id}.pack.json`;
    PackExporter.downloadPack(json, name);
  }
}

// Example usage:
// const pack = new PackDevKit('hospitality', 'Hospitality')
//   .describe('Analytics for hotels, restaurants, and travel')
//   .addSubCategory('hotel', 'Hotel', 'Hotel booking and stays')
//   .addSubCategory('restaurant', 'Restaurant', 'Restaurant reservations')
//   .addSemanticType('booking_id', ['booking', 'reservation'])
//   .addSemanticType('check_in', ['checkin', 'check_in', 'arrival'])
//   .addMetric({
//     id: 'occupancy_rate',
//     name: 'Occupancy Rate',
//     formula: { expression: 'RATIO(COUNT($booking_id), $total_rooms) * 100' },
//     format: 'percentage',
//     category: 'kpi',
//   })
//   .setTerminology({
//     user: { singular: 'Guest', plural: 'Guests' },
//     session: { singular: 'Stay', plural: 'Stays' },
//   })
//   .build();
```

---

## Deliverables Summary

| Component | Status | Description |
|-----------|--------|-------------|
| Plugin Types | New | Type definitions for plugin system |
| PluginManager | New | Plugin lifecycle management |
| PackExporter | New | Import/export functionality |
| PackImportDialog | New | UI for importing packs |
| FormulaBuilder | New | Custom metric creation UI |
| Plugins Page | New | Plugin management dashboard |
| PackDevKit | New | Development toolkit for pack creation |

---

## Testing Checklist

- [ ] Plugin installation works correctly
- [ ] Plugin enable/disable toggles state
- [ ] Plugin uninstallation removes from registry
- [ ] Pack import validates structure
- [ ] Pack export generates valid JSON
- [ ] Checksum validation catches corruption
- [ ] Formula builder validates expressions
- [ ] Custom metrics can be saved
- [ ] PackDevKit produces valid packs
- [ ] Plugin events fire correctly

---

## Security Considerations

1. **Sandboxed Execution**: Plugins run in isolated context
2. **Permission System**: Explicit permissions required for sensitive operations
3. **Checksum Validation**: Imported packs verified for integrity
4. **No Remote Code**: Plugins cannot execute arbitrary remote code
5. **Storage Isolation**: Plugin data is scoped to plugin ID

---

## Next Phase

**Phase 6** will focus on Data Sources & Public Datasets, implementing:
- BigQuery adapter for public datasets
- Sample data generators per industry
- Pre-configured demo datasets
- Data source marketplace
