/**
 * useDashboards Hook
 * Provides dashboard data for the sidebar and other components
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Dashboard,
    getAllDashboards,
    saveDashboard,
    deleteDashboard,
    createDashboard,
    initializeDefaultDashboards
} from '../lib/dashboardStore';

interface UseDashboardsReturn {
    dashboards: Dashboard[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    createNew: (name: string) => Promise<Dashboard>;
    remove: (id: string) => Promise<void>;
    update: (dashboard: Dashboard) => Promise<void>;
}

export function useDashboards(): UseDashboardsReturn {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboards = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Initialize default dashboards if none exist
            await initializeDefaultDashboards();

            const allDashboards = await getAllDashboards();
            // Sort by createdAt (newest first) but keep defaults at top
            const sorted = allDashboards.sort((a, b) => {
                // Default dashboards go first
                if (a.isDefault && !b.isDefault) return -1;
                if (!a.isDefault && b.isDefault) return 1;
                // Then sort by lastViewedAt or createdAt
                const aDate = a.lastViewedAt || a.createdAt;
                const bDate = b.lastViewedAt || b.createdAt;
                return new Date(bDate).getTime() - new Date(aDate).getTime();
            });
            setDashboards(sorted);
        } catch (err) {
            console.error('Failed to load dashboards:', err);
            setError('Failed to load dashboards');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboards();
    }, [loadDashboards]);

    const createNew = useCallback(async (name: string): Promise<Dashboard> => {
        const dashboard = createDashboard(name);
        await saveDashboard(dashboard);
        await loadDashboards();
        return dashboard;
    }, [loadDashboards]);

    const remove = useCallback(async (id: string): Promise<void> => {
        await deleteDashboard(id);
        await loadDashboards();
    }, [loadDashboards]);

    const update = useCallback(async (dashboard: Dashboard): Promise<void> => {
        await saveDashboard(dashboard);
        await loadDashboards();
    }, [loadDashboards]);

    return {
        dashboards,
        loading,
        error,
        refresh: loadDashboards,
        createNew,
        remove,
        update,
    };
}
