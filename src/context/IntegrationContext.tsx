/**
 * Integration Context
 * Global state management for data source integrations
 * Phase 3: One-Click Integrations
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import {
    Integration,
    IntegrationConfig,
    IntegrationStatus,
    IntegrationType,
    SyncResult,
    getAllIntegrations,
    saveIntegration,
    deleteIntegration as deleteFromStore,
    createIntegration,
    updateIntegrationStatus,
    updateIntegrationSyncResult,
} from '../lib/integrationStore';

// ============================================================================
// Types
// ============================================================================

interface IntegrationContextType {
    // State
    integrations: Integration[];
    activeIntegration: Integration | null;
    isLoading: boolean;
    isReady: boolean;

    // Actions
    setActiveIntegration: (integration: Integration | null) => void;
    addIntegration: (config: IntegrationConfig) => Promise<Integration>;
    removeIntegration: (id: string) => Promise<void>;
    updateStatus: (id: string, status: IntegrationStatus, error?: string) => Promise<void>;
    recordSync: (id: string, result: SyncResult) => Promise<void>;
    refreshIntegration: (id: string) => Promise<void>;
    pauseIntegration: (id: string) => Promise<void>;
    resumeIntegration: (id: string) => Promise<void>;

    // Queries
    getIntegrationById: (id: string) => Integration | undefined;
    getIntegrationsByType: (type: IntegrationType) => Integration[];
    getConnectedIntegrations: () => Integration[];
    getErrorIntegrations: () => Integration[];
}

// ============================================================================
// Context
// ============================================================================

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function IntegrationProvider({ children }: { children: ReactNode }) {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);

    // Load integrations on mount
    useEffect(() => {
        async function loadIntegrations() {
            try {
                const data = await getAllIntegrations();
                setIntegrations(data);

                // Auto-select first connected integration
                const connected = data.find(i => i.status === 'connected');
                if (connected) {
                    setActiveIntegration(connected);
                }
            } catch (error) {
                console.error('Failed to load integrations:', error);
            } finally {
                setIsLoading(false);
                setIsReady(true);
            }
        }
        loadIntegrations();
    }, []);

    // Add new integration
    const addIntegration = useCallback(async (config: IntegrationConfig): Promise<Integration> => {
        const integration = createIntegration(config);
        await saveIntegration(integration);
        setIntegrations(prev => [...prev, integration]);
        return integration;
    }, []);

    // Remove integration
    const removeIntegration = useCallback(async (id: string): Promise<void> => {
        await deleteFromStore(id);
        setIntegrations(prev => prev.filter(i => i.id !== id));
        if (activeIntegration?.id === id) {
            setActiveIntegration(null);
        }
    }, [activeIntegration]);

    // Update integration status
    const updateStatus = useCallback(async (
        id: string,
        status: IntegrationStatus,
        error?: string
    ): Promise<void> => {
        setIntegrations(prev => prev.map(i => {
            if (i.id !== id) return i;
            const updated = updateIntegrationStatus(i, status, error);
            saveIntegration(updated); // Persist async
            return updated;
        }));
    }, []);

    // Record sync result
    const recordSync = useCallback(async (id: string, result: SyncResult): Promise<void> => {
        setIntegrations(prev => prev.map(i => {
            if (i.id !== id) return i;
            const updated = updateIntegrationSyncResult(i, result);
            saveIntegration(updated); // Persist async
            return updated;
        }));
    }, []);

    // Refresh integration (trigger sync)
    const refreshIntegration = useCallback(async (id: string): Promise<void> => {
        await updateStatus(id, 'syncing');
        // Note: Actual sync logic will be handled by adapters
        // This just triggers the status change
    }, [updateStatus]);

    // Pause integration
    const pauseIntegration = useCallback(async (id: string): Promise<void> => {
        await updateStatus(id, 'paused');
    }, [updateStatus]);

    // Resume integration
    const resumeIntegration = useCallback(async (id: string): Promise<void> => {
        const integration = integrations.find(i => i.id === id);
        if (integration?.lastSyncAt) {
            await updateStatus(id, 'connected');
        } else {
            await updateStatus(id, 'disconnected');
        }
    }, [integrations, updateStatus]);

    // Query helpers
    const getIntegrationById = useCallback((id: string): Integration | undefined => {
        return integrations.find(i => i.id === id);
    }, [integrations]);

    const getIntegrationsByType = useCallback((type: IntegrationType): Integration[] => {
        return integrations.filter(i => i.config.type === type);
    }, [integrations]);

    const getConnectedIntegrations = useCallback((): Integration[] => {
        return integrations.filter(i => i.status === 'connected');
    }, [integrations]);

    const getErrorIntegrations = useCallback((): Integration[] => {
        return integrations.filter(i => i.status === 'error');
    }, [integrations]);

    return (
        <IntegrationContext.Provider
            value={{
                integrations,
                activeIntegration,
                isLoading,
                isReady,
                setActiveIntegration,
                addIntegration,
                removeIntegration,
                updateStatus,
                recordSync,
                refreshIntegration,
                pauseIntegration,
                resumeIntegration,
                getIntegrationById,
                getIntegrationsByType,
                getConnectedIntegrations,
                getErrorIntegrations,
            }}
        >
            {children}
        </IntegrationContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useIntegrations() {
    const context = useContext(IntegrationContext);
    if (!context) {
        throw new Error('useIntegrations must be used within an IntegrationProvider');
    }
    return context;
}

// ============================================================================
// Integration Sync Hook (for individual integrations)
// ============================================================================

export function useIntegrationSync(integrationId: string | null) {
    const { getIntegrationById, updateStatus, recordSync } = useIntegrations();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastResult, setLastResult] = useState<SyncResult | null>(null);

    const integration = integrationId ? getIntegrationById(integrationId) : undefined;

    const sync = useCallback(async (
        syncFn: () => Promise<{ rowCount: number; warnings?: string[] }>
    ) => {
        if (!integrationId) return;

        setIsSyncing(true);
        await updateStatus(integrationId, 'syncing');

        const startTime = Date.now();
        try {
            const { rowCount, warnings } = await syncFn();
            const result: SyncResult = {
                success: true,
                rowCount,
                duration: Date.now() - startTime,
                warnings,
            };
            await recordSync(integrationId, result);
            setLastResult(result);
        } catch (error) {
            const result: SyncResult = {
                success: false,
                rowCount: 0,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            await recordSync(integrationId, result);
            setLastResult(result);
        } finally {
            setIsSyncing(false);
        }
    }, [integrationId, updateStatus, recordSync]);

    return {
        integration,
        isSyncing,
        lastResult,
        sync,
    };
}
