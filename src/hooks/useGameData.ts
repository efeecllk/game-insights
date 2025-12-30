/**
 * useGameData Hook - Central Data Access Point
 * Provides unified access to game data across all pages
 * Phase 1: Core Data Integration
 */

import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useGame } from '@/context/GameContext';
import { createSmartDataProvider, IDataProvider } from '@/lib/dataProviders';
import { ColumnMapping, GameData } from '@/lib/dataStore';

// Quality issue types
export interface QualityIssue {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    column?: string;
    affectedRows?: number;
}

// Analysis result from AI pipeline
export interface AnalysisResult {
    schema?: {
        columns: Array<{
            name: string;
            semanticType: string;
            dataType: string;
            confidence: number;
        }>;
    };
    funnels?: {
        detected: Array<{
            name: string;
            steps: Array<{
                name: string;
                condition: Record<string, unknown>;
            }>;
        }>;
    };
    predictions?: {
        churnRisk: Array<{
            userId: string;
            probability: number;
            riskLevel: 'high' | 'medium' | 'low';
        }>;
    };
    quality?: {
        score: number;
        issues: QualityIssue[];
    };
}

export interface UseGameDataReturn {
    // Raw data access
    rawData: Record<string, unknown>[];
    columns: ColumnMapping[];
    rowCount: number;

    // Derived data (memoized)
    dataProvider: IDataProvider;
    analysisResult: AnalysisResult | null;

    // State
    hasRealData: boolean;
    isLoading: boolean;
    dataMode: 'real' | 'demo';

    // Quality
    qualityScore: number;
    qualityIssues: QualityIssue[];

    // Active game data reference
    activeGameData: GameData | null;
}

/**
 * Calculate quality score based on data characteristics
 */
function calculateQualityScore(gameData: GameData | null): { score: number; issues: QualityIssue[] } {
    if (!gameData || !gameData.rawData || gameData.rawData.length === 0) {
        return { score: 100, issues: [] };
    }

    const issues: QualityIssue[] = [];
    let score = 100;
    const rows = gameData.rawData;
    const columns = gameData.columnMappings || [];

    // Check for missing values
    for (const col of columns) {
        const colName = col.originalName;
        const nullCount = rows.filter(r => r[colName] == null || r[colName] === '').length;
        const nullPercent = (nullCount / rows.length) * 100;

        if (nullPercent > 50) {
            issues.push({
                id: `null-${colName}`,
                severity: 'critical',
                message: `Column "${colName}" has ${nullPercent.toFixed(0)}% missing values`,
                column: colName,
                affectedRows: nullCount,
            });
            score -= 15;
        } else if (nullPercent > 20) {
            issues.push({
                id: `null-${colName}`,
                severity: 'warning',
                message: `Column "${colName}" has ${nullPercent.toFixed(0)}% missing values`,
                column: colName,
                affectedRows: nullCount,
            });
            score -= 5;
        }
    }

    // Check for duplicate rows
    const rowStrings = rows.map(r => JSON.stringify(r));
    const uniqueRows = new Set(rowStrings).size;
    const duplicatePercent = ((rows.length - uniqueRows) / rows.length) * 100;

    if (duplicatePercent > 30) {
        issues.push({
            id: 'duplicates',
            severity: 'warning',
            message: `${duplicatePercent.toFixed(0)}% of rows appear to be duplicates`,
            affectedRows: rows.length - uniqueRows,
        });
        score -= 10;
    }

    // Check for unmapped columns
    const unmappedColumns = columns.filter(c => c.role === 'unknown' || c.role === 'noise');
    if (unmappedColumns.length > columns.length * 0.5) {
        issues.push({
            id: 'unmapped',
            severity: 'info',
            message: `${unmappedColumns.length} columns couldn't be automatically mapped`,
        });
        score -= 5;
    }

    // Check for key columns
    const hasUserId = columns.some(c => c.role === 'identifier');
    const hasTimestamp = columns.some(c => c.role === 'timestamp');

    if (!hasUserId) {
        issues.push({
            id: 'no-user-id',
            severity: 'warning',
            message: 'No user identifier column detected',
        });
        score -= 10;
    }

    if (!hasTimestamp) {
        issues.push({
            id: 'no-timestamp',
            severity: 'info',
            message: 'No timestamp column detected - time-based analysis may be limited',
        });
        score -= 5;
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        issues,
    };
}

/**
 * Central hook for accessing game data
 * Use this instead of directly accessing DataContext for consistent data handling
 */
export function useGameData(): UseGameDataReturn {
    const { activeGameData, isLoading } = useData();
    const { selectedGame } = useGame();

    // Memoize data provider creation
    const dataProvider = useMemo(() =>
        createSmartDataProvider(selectedGame, activeGameData),
        [selectedGame, activeGameData]
    );

    // Calculate quality metrics
    const { score: qualityScore, issues: qualityIssues } = useMemo(() =>
        calculateQualityScore(activeGameData),
        [activeGameData]
    );

    // Build analysis result from available data
    const analysisResult: AnalysisResult | null = useMemo(() => {
        if (!activeGameData) return null;

        return {
            schema: {
                columns: activeGameData.columnMappings?.map(c => ({
                    name: c.originalName,
                    semanticType: c.role,
                    dataType: c.dataType,
                    confidence: 0.8, // Default confidence
                })) || [],
            },
            quality: {
                score: qualityScore,
                issues: qualityIssues,
            },
        };
    }, [activeGameData, qualityScore, qualityIssues]);

    return {
        // Raw data access
        rawData: activeGameData?.rawData ?? [],
        columns: activeGameData?.columnMappings ?? [],
        rowCount: activeGameData?.rowCount ?? 0,

        // Derived data
        dataProvider,
        analysisResult,

        // State
        hasRealData: !!activeGameData && (activeGameData.rawData?.length ?? 0) > 0,
        isLoading,
        dataMode: activeGameData ? 'real' : 'demo',

        // Quality
        qualityScore,
        qualityIssues,

        // Reference
        activeGameData,
    };
}

/**
 * Helper hook to check if specific column types exist in the data
 */
export function useHasColumnType(role: string): boolean {
    const { columns } = useGameData();
    return columns.some(c => c.role === role);
}

/**
 * Helper hook to get columns by role
 */
export function useColumnsByRole(role: string): ColumnMapping[] {
    const { columns } = useGameData();
    return useMemo(() => columns.filter(c => c.role === role), [columns, role]);
}
