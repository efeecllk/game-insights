import { useState, useEffect, useCallback } from 'react';

import {
    SidebarSettings,
    getSidebarSettings,
    initializeSidebarSettings,
    resetSidebarSettings,
    saveSidebarSettings,
    DEFAULT_SIDEBAR_ORDER,
} from '../lib/sidebarStore';

const SIDEBAR_SETTINGS_UPDATED_EVENT = 'sidebar-settings-updated';

function notifySidebarSettingsUpdated(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SIDEBAR_SETTINGS_UPDATED_EVENT));
    }
}

interface UseSidebarSettingsReturn {
    settings: SidebarSettings | null;
    loading: boolean;
    useCustomOrder: boolean;
    customOrder: string[];
    collapsed: boolean;
    pinned: string[];
    setUseCustomOrder: (value: boolean) => Promise<void>;
    setCustomOrder: (order: string[]) => Promise<void>;
    setCollapsed: (value: boolean) => Promise<void>;
    toggleCollapsed: () => Promise<void>;
    togglePinned: (label: string) => Promise<void>;
    isPinned: (label: string) => boolean;
    moveItem: (fromIndex: number, toIndex: number) => Promise<void>;
    reorderItems: (newOrder: string[]) => Promise<void>;
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

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleSettingsUpdated = () => {
            void loadSettings();
        };

        window.addEventListener(SIDEBAR_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
        return () => {
            window.removeEventListener(SIDEBAR_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
        };
    }, [loadSettings]);

    const setUseCustomOrder = useCallback(async (value: boolean) => {
        await saveSidebarSettings({ useCustomOrder: value });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
            notifySidebarSettingsUpdated();
        }
    }, []);

    const setCustomOrder = useCallback(async (order: string[]) => {
        await saveSidebarSettings({ customOrder: order, useCustomOrder: true });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
            notifySidebarSettingsUpdated();
        }
    }, []);

    const setCollapsed = useCallback(async (value: boolean) => {
        await saveSidebarSettings({ collapsed: value });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
            notifySidebarSettingsUpdated();
        }
    }, []);

    const toggleCollapsed = useCallback(async () => {
        const newValue = !(settings?.collapsed ?? false);
        await setCollapsed(newValue);
    }, [settings?.collapsed, setCollapsed]);

    const togglePinned = useCallback(async (label: string) => {
        if (!settings) return;

        const currentPinned = settings.pinned ?? [];
        const isPinned = currentPinned.includes(label);
        const newPinned = isPinned
            ? currentPinned.filter((item) => item !== label)
            : [...currentPinned, label];

        await saveSidebarSettings({ pinned: newPinned });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
            notifySidebarSettingsUpdated();
        }
    }, [settings]);

    const isPinned = useCallback((label: string) => {
        return settings?.pinned?.includes(label) ?? false;
    }, [settings?.pinned]);

    const moveItem = useCallback(async (fromIndex: number, toIndex: number) => {
        if (!settings) return;

        const newOrder = [...settings.customOrder];
        const [removed] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, removed);

        await saveSidebarSettings({ customOrder: newOrder, useCustomOrder: true });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
            notifySidebarSettingsUpdated();
        }
    }, [settings]);

    const reorderItems = useCallback(async (newOrder: string[]) => {
        await saveSidebarSettings({ customOrder: newOrder, useCustomOrder: true });
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
            notifySidebarSettingsUpdated();
        }
    }, []);

    const resetToDefault = useCallback(async () => {
        await resetSidebarSettings();
        const updated = await getSidebarSettings();
        if (updated) {
            setSettings(updated);
            notifySidebarSettingsUpdated();
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
        collapsed: settings?.collapsed ?? false,
        pinned: settings?.pinned ?? [],
        setUseCustomOrder,
        setCustomOrder,
        setCollapsed,
        toggleCollapsed,
        togglePinned,
        isPinned,
        moveItem,
        reorderItems,
        resetToDefault,
        refreshSettings,
    };
}
