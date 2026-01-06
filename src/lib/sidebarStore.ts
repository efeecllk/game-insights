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
    updatedAt: string;
}

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_SETTINGS_STORE = 'sidebarSettings';
const SETTINGS_ID = 'default';

/**
 * Default sidebar order - ensures Overview is first and Upload Data is near the top
 * This order reflects the simplified navigation structure with sections
 */
export const DEFAULT_SIDEBAR_ORDER: string[] = [
    // Primary nav items
    'Overview',
    'Upload Data',
    'AI Analytics',
    'Funnels',
    'Monetization',
    // More analytics
    'Realtime',
    'Dashboards',
    'Engagement',
    'Attribution',
    'User Analysis',
    // Advanced tools
    'Predictions',
    'A/B Testing',
    'What-If',
    'ML Studio',
    // Settings
    'Games',
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
        updatedAt: now,
    };

    return dbPut(SIDEBAR_SETTINGS_STORE, updatedSettings);
}

/**
 * Reset sidebar settings to default
 */
export async function resetSidebarSettings(): Promise<void> {
    const settings: SidebarSettings = {
        id: SETTINGS_ID,
        useCustomOrder: false,
        customOrder: [...DEFAULT_SIDEBAR_ORDER],
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
        return existing;
    }

    const settings: SidebarSettings = {
        id: SETTINGS_ID,
        useCustomOrder: false,
        customOrder: [...DEFAULT_SIDEBAR_ORDER],
        updatedAt: new Date().toISOString(),
    };

    await dbPut(SIDEBAR_SETTINGS_STORE, settings);
    return settings;
}

// ============================================================================
// React Hook for Sidebar Settings
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface UseSidebarSettingsReturn {
    settings: SidebarSettings | null;
    loading: boolean;
    useCustomOrder: boolean;
    customOrder: string[];
    setUseCustomOrder: (value: boolean) => Promise<void>;
    setCustomOrder: (order: string[]) => Promise<void>;
    moveItem: (fromIndex: number, toIndex: number) => Promise<void>;
    resetToDefault: () => Promise<void>;
    refreshSettings: () => Promise<void>;
}

export function useSidebarSettings(): UseSidebarSettingsReturn {
    const [settings, setSettings] = useState<SidebarSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const loadSettings = useCallback(async () => {
        try {
            const loaded = await initializeSidebarSettings();
            setSettings(loaded);
        } catch (error) {
            console.error('Failed to load sidebar settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const setUseCustomOrder = useCallback(async (value: boolean) => {
        await saveSidebarSettings({ useCustomOrder: value });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
        }
    }, []);

    const setCustomOrder = useCallback(async (order: string[]) => {
        await saveSidebarSettings({ customOrder: order, useCustomOrder: true });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
        }
    }, []);

    const moveItem = useCallback(async (fromIndex: number, toIndex: number) => {
        if (!settings) return;

        const newOrder = [...settings.customOrder];
        const [removed] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, removed);

        await saveSidebarSettings({ customOrder: newOrder, useCustomOrder: true });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
        }
    }, [settings]);

    const resetToDefault = useCallback(async () => {
        await resetSidebarSettings();
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
        }
    }, []);

    const refreshSettings = useCallback(async () => {
        setLoading(true);
        await loadSettings();
    }, [loadSettings]);

    return {
        settings,
        loading,
        useCustomOrder: settings?.useCustomOrder ?? false,
        customOrder: settings?.customOrder ?? DEFAULT_SIDEBAR_ORDER,
        setUseCustomOrder,
        setCustomOrder,
        moveItem,
        resetToDefault,
        refreshSettings,
    };
}
