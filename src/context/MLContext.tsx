/**
 * ML Context - Global state for ML predictions
 * Phase 3: AI/ML Integration
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
    useMemo,
} from 'react';
import { useData } from './DataContext';
import {
    mlService,
    type MLPredictions,
    type ChurnPredictionResult,
    type LTVPredictionResult,
    type RetentionPoint,
    type SegmentedUsers,
    type ModelStatus,
} from '../ai/ml/MLService';
import type { RevenueForecast, Anomaly } from '../ai/ml/types';

// ============================================================================
// Types
// ============================================================================

interface MLContextValue {
    // Status
    isReady: boolean;
    isTraining: boolean;
    status: ModelStatus;
    error: string | null;

    // Predictions
    churnPredictions: ChurnPredictionResult[];
    ltvPredictions: LTVPredictionResult[];
    revenueForecast: RevenueForecast[];
    retentionForecast: RetentionPoint[];
    segments: SegmentedUsers | null;
    anomalies: Anomaly[];

    // Filtered predictions
    atRiskUsers: ChurnPredictionResult[];
    whaleUsers: LTVPredictionResult[];

    // Actions
    trainModels: () => Promise<void>;
    refreshPredictions: () => void;
}

// ============================================================================
// Context
// ============================================================================

const MLContext = createContext<MLContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface MLProviderProps {
    children: ReactNode;
}

export function MLProvider({ children }: MLProviderProps) {
    const { activeGameData, isReady: dataIsReady } = useData();

    const [isTraining, setIsTraining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<MLPredictions | null>(null);
    const [status, setStatus] = useState<ModelStatus>(mlService.getStatus());

    // Check for existing training when data changes - DO NOT auto-train
    // Auto-training was causing performance issues on data load
    // Users can manually trigger training via the ML Studio page
    useEffect(() => {
        if (!dataIsReady || !activeGameData) return;

        // Check if already trained on this data
        const currentStatus = mlService.getStatus();
        if (currentStatus.lastTrainedDataId === activeGameData.id) {
            // Already trained on this data, just refresh predictions
            setPredictions(mlService.getAllPredictions());
            setStatus(currentStatus);
        }
        // Note: Removed auto-training - user must trigger manually for performance
    }, [activeGameData?.id, dataIsReady]);

    // Train models on current data
    const trainModels = useCallback(async () => {
        if (!activeGameData) {
            setError('No data available for training');
            return;
        }

        if (activeGameData.rawData.length < 100) {
            setError('Insufficient data: need at least 100 rows for ML training');
            return;
        }

        setIsTraining(true);
        setError(null);

        try {
            await mlService.initialize();
            await mlService.trainOnData(activeGameData);

            // Get predictions after training
            const newPredictions = mlService.getAllPredictions();
            setPredictions(newPredictions);
            setStatus(mlService.getStatus());
        } catch (err) {
            console.error('ML training failed:', err);
            setError(err instanceof Error ? err.message : 'Training failed');
        } finally {
            setIsTraining(false);
        }
    }, [activeGameData]);

    // Refresh predictions without retraining
    const refreshPredictions = useCallback(() => {
        if (mlService.getStatus().isInitialized) {
            setPredictions(mlService.getAllPredictions());
            setStatus(mlService.getStatus());
        }
    }, []);

    // Derived values
    const atRiskUsers = useMemo(() => {
        if (!predictions?.churn) return [];
        return predictions.churn
            .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical')
            .slice(0, 20);
    }, [predictions?.churn]);

    const whaleUsers = useMemo(() => {
        if (!predictions?.ltv) return [];
        return predictions.ltv
            .filter(p => p.segment === 'whale')
            .slice(0, 20);
    }, [predictions?.ltv]);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo<MLContextValue>(() => ({
        isReady: predictions !== null && !isTraining,
        isTraining,
        status,
        error,
        churnPredictions: predictions?.churn ?? [],
        ltvPredictions: predictions?.ltv ?? [],
        revenueForecast: predictions?.revenue ?? [],
        retentionForecast: predictions?.retention ?? [],
        segments: predictions?.segments ?? null,
        anomalies: predictions?.anomalies ?? [],
        atRiskUsers,
        whaleUsers,
        trainModels,
        refreshPredictions,
    }), [
        predictions,
        isTraining,
        status,
        error,
        atRiskUsers,
        whaleUsers,
        trainModels,
        refreshPredictions,
    ]);

    return (
        <MLContext.Provider value={value}>
            {children}
        </MLContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useML(): MLContextValue {
    const context = useContext(MLContext);
    if (!context) {
        throw new Error('useML must be used within an MLProvider');
    }
    return context;
}

// ============================================================================
// Optional Hook (safe to use outside provider)
// ============================================================================

export function useMLOptional(): MLContextValue | null {
    return useContext(MLContext) ?? null;
}
