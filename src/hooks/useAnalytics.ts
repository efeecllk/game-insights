/**
 * useAnalytics Hook
 * Manages analytics state and runs the data pipeline
 */

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { dataPipeline, PipelineResult, PipelineConfig } from '../ai/DataPipeline';
import { NormalizedData } from '../adapters/BaseAdapter';
import { questionAnswering, QuestionResult } from '../ai/QuestionAnswering';
import { cohortAnalyzer, CohortDefinition } from '../ai/CohortAnalyzer';
import { GameCategory } from '../types';
import {
    getStoredAnomalyConfig,
    getStoredAnomalyThresholds,
} from '../components/settings';

export interface AnalyticsState {
    isLoading: boolean;
    isProcessing: boolean;
    error: string | null;
    result: PipelineResult | null;
    gameType: GameCategory;
    dataName: string;
}

export interface UseAnalyticsReturn extends AnalyticsState {
    runAnalysis: (config?: Partial<PipelineConfig>) => Promise<void>;
    askQuestion: (question: string) => Promise<QuestionResult | null>;
    changeCohortDimension: (dimension: CohortDefinition) => void;
    clearError: () => void;
}

const DEFAULT_CONFIG: Partial<PipelineConfig> = {
    sampleSize: 5000,
    autoClean: true,
    calculateMetrics: true,
    detectAnomalies: true,
    analyzeCohorts: true,
    detectFunnels: true,
    useLLM: false, // Start without LLM, can be enabled in settings
};

export function useAnalytics(): UseAnalyticsReturn {
    const { activeGameData, isReady } = useData();

    const [state, setState] = useState<AnalyticsState>({
        isLoading: true,
        isProcessing: false,
        error: null,
        result: null,
        gameType: 'custom',
        dataName: '',
    });

    // Convert raw data to NormalizedData format
    const normalizeData = useCallback((rawData: Record<string, unknown>[], sourceName: string = 'upload'): NormalizedData => {
        if (!rawData || rawData.length === 0) {
            return {
                columns: [],
                rows: [],
                metadata: {
                    source: sourceName,
                    fetchedAt: new Date().toISOString(),
                    rowCount: 0,
                },
            };
        }

        const columns = Object.keys(rawData[0]);
        return {
            columns,
            rows: rawData,
            metadata: {
                source: sourceName,
                fetchedAt: new Date().toISOString(),
                rowCount: rawData.length,
            },
        };
    }, []);

    // Run analysis on data
    const runAnalysis = useCallback(async (config?: Partial<PipelineConfig>) => {
        if (!activeGameData?.rawData) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'No data available for analysis',
            }));
            return;
        }

        setState(prev => ({ ...prev, isProcessing: true, error: null }));

        try {
            const normalizedData = normalizeData(activeGameData.rawData);

            // Get stored anomaly configuration
            const storedAnomalyConfig = getStoredAnomalyConfig();
            const storedThresholds = getStoredAnomalyThresholds();
            const anomalyConfig = {
                ...storedAnomalyConfig,
                thresholds: storedThresholds,
            };

            const fullConfig = {
                ...DEFAULT_CONFIG,
                ...config,
                anomalyConfig,
            };

            const result = await dataPipeline.run(normalizedData, fullConfig);

            setState(prev => ({
                ...prev,
                isLoading: false,
                isProcessing: false,
                result,
                gameType: result.gameType,
                dataName: activeGameData.name,
            }));
        } catch (error) {
            console.error('Analytics pipeline failed:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                isProcessing: false,
                error: error instanceof Error ? error.message : 'Analysis failed',
            }));
        }
    }, [activeGameData, normalizeData]);

    // Ask a question about the data
    const askQuestion = useCallback(async (question: string): Promise<QuestionResult | null> => {
        if (!activeGameData?.rawData || !state.result) {
            return null;
        }

        try {
            const normalizedData = normalizeData(activeGameData.rawData);
            return await questionAnswering.ask(
                question,
                normalizedData,
                state.result.columnMeanings,
                state.result.gameType
            );
        } catch (error) {
            console.error('Question answering failed:', error);
            return null;
        }
    }, [activeGameData, state.result, normalizeData]);

    // Change cohort dimension and re-analyze
    const changeCohortDimension = useCallback((dimension: CohortDefinition) => {
        if (!activeGameData?.rawData || !state.result) {
            return;
        }

        try {
            const normalizedData = normalizeData(activeGameData.rawData);
            const newCohortAnalysis = cohortAnalyzer.analyze(
                normalizedData,
                state.result.columnMeanings,
                dimension
            );

            setState(prev => ({
                ...prev,
                result: prev.result ? {
                    ...prev.result,
                    cohortAnalysis: newCohortAnalysis,
                } : null,
            }));
        } catch (error) {
            console.error('Cohort dimension change failed:', error);
        }
    }, [activeGameData, state.result, normalizeData]);

    // Clear error state
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // Auto-run analysis when data changes
    useEffect(() => {
        if (isReady && activeGameData?.rawData) {
            runAnalysis();
        } else if (isReady && !activeGameData) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: null,
                result: null,
            }));
        }
    }, [isReady, activeGameData?.id, runAnalysis]);

    return {
        ...state,
        runAnalysis,
        askQuestion,
        changeCohortDimension,
        clearError,
    };
}
