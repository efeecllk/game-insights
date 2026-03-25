/**
 * Sidebar Store
 * User-customizable sidebar ordering with IndexedDB persistence
 */

import { dbPut, dbGet } from './db';

// ============================================================================
// Types
// ============================================================================

export interface SidebarSettings {
    id: string; // Always 'default' for singleton pattern
    useCustomOrder: boolean;
    customOrder: string[]; // Array of nav item labels in desired order
    collapsed: boolean; // Whether sidebar is in collapsed state
    pinned: string[]; // Array of pinned/favorite item labels
    updatedAt: string;
}

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_SETTINGS_STORE = 'sidebarSettings';
const SETTINGS_ID = 'default';

/**
 * Default sidebar order - prioritizes user workflow with Upload Data first
 * First-time users need to upload data before they can use the dashboard
 * Simplified navigation structure (reduced from 17 to 14 items)
 */
export const DEFAULT_SIDEBAR_ORDER: string[] = [
    // Primary nav items (4) - Always visible, essential features
    'Upload Data',
    'Dashboard',
    'Analytics',
    'Revenue',
    // More analytics (4) - Collapsed by default
    'Funnels',
    'Realtime',
    'Dashboards',
    'Attribution',
    // Advanced tools (4) - Collapsed by default
    'Predictions',
    'A/B Testing',
    'What-If',
    'ML Studio',
    // Settings (2) - Minimal
    'Templates',
    'Settings',
];

// ============================================================================
// Store Operations
// ============================================================================

/**
 * Get sidebar settings from IndexedDB
 */
export async function getSidebarSettings(): Promise<SidebarSettings | undefined> {
    return dbGet<SidebarSettings>(SIDEBAR_SETTINGS_STORE, SETTINGS_ID);
}

/**
 * Save sidebar settings to IndexedDB
 */
export async function saveSidebarSettings(settings: Partial<SidebarSettings>): Promise<void> {
    const existing = await getSidebarSettings();
    const now = new Date().toISOString();

    const updatedSettings: SidebarSettings = {
        id: SETTINGS_ID,
        useCustomOrder: settings.useCustomOrder ?? existing?.useCustomOrder ?? false,
        customOrder: settings.customOrder ?? existing?.customOrder ?? [...DEFAULT_SIDEBAR_ORDER],
        collapsed: settings.collapsed ?? existing?.collapsed ?? false,
        pinned: settings.pinned ?? existing?.pinned ?? [],
        updatedAt: now,
    };

    return dbPut(SIDEBAR_SETTINGS_STORE, updatedSettings);
}

/**
 * Reset sidebar settings to default
 */
export async function resetSidebarSettings(): Promise<void> {
    const existing = await getSidebarSettings();
    const settings: SidebarSettings = {
        id: SETTINGS_ID,
        useCustomOrder: false,
        customOrder: [...DEFAULT_SIDEBAR_ORDER],
        collapsed: existing?.collapsed ?? false, // Preserve collapsed state on reset
        pinned: [], // Reset pinned items
        updatedAt: new Date().toISOString(),
    };

    return dbPut(SIDEBAR_SETTINGS_STORE, settings);
}

/**
 * Initialize sidebar settings if they don't exist
 */
export async function initializeSidebarSettings(): Promise<SidebarSettings> {
    const existing = await getSidebarSettings();
    if (existing) {
        // Migrate existing settings that don't have new fields
        if (existing.collapsed === undefined || existing.pinned === undefined) {
            const migrated: SidebarSettings = {
                ...existing,
                collapsed: existing.collapsed ?? false,
                pinned: existing.pinned ?? [],
                updatedAt: new Date().toISOString(),
            };
            await dbPut(SIDEBAR_SETTINGS_STORE, migrated);
            return migrated;
        }
        return existing;
    }

    const settings: SidebarSettings = {
        id: SETTINGS_ID,
        useCustomOrder: false,
        customOrder: [...DEFAULT_SIDEBAR_ORDER],
        collapsed: false,
        pinned: [],
        updatedAt: new Date().toISOString(),
    };

    await dbPut(SIDEBAR_SETTINGS_STORE, settings);
    return settings;
}
