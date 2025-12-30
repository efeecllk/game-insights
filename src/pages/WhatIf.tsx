/**
 * What-If Analysis Page
 * Scenario simulation for revenue and metric projections
 * Phase 2: Page-by-Page Functionality (updated)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Lightbulb,
    Trash2,
    Star,
    StarOff,
    Copy,
    Download,
    Database,
} from 'lucide-react';
import { WhatIfSimulator } from '../components/analytics/WhatIfSimulator';
import {
    getAllScenarios,
    saveScenario,
    deleteScenario,
    toggleFavorite,
    duplicateScenario,
    exportScenarios,
    type SavedScenario,
} from '../lib/scenarioStore';
import type { ScenarioInput, ScenarioResult } from '../ai/WhatIfEngine';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';

// ============================================================================
// Component
// ============================================================================

export function WhatIfPage() {
    useTranslation(); // Initialize i18n context
    const { hasRealData, dataProvider } = useGameData();
    const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<SavedScenario | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Calculate baseline metrics from real data when available
    const realBaseline = useMemo(() => {
        if (!hasRealData) return undefined;

        const sessionMetrics = dataProvider.getSessionMetrics();
        const totalRevenue = dataProvider.getTotalRevenue();
        const dau = dataProvider.getDAU();
        const payerConversion = dataProvider.getPayerConversion();
        const payingUsers = dau * (payerConversion / 100);

        return {
            dau,
            mau: dataProvider.getMAU(),
            retention: {
                d1: dataProvider.getRetentionDay(1),
                d7: dataProvider.getRetentionDay(7),
                d30: dataProvider.getRetentionDay(30),
            },
            arpu: dataProvider.calculateARPU(),
            arppu: payingUsers > 0 ? totalRevenue / payingUsers : 0,
            conversionRate: payerConversion,
            avgRevenuePerPurchase: 5.0, // Default, would need transaction data
            avgSessionLength: dataProvider.getAvgSessionLength(),
            sessionsPerDau: sessionMetrics.sessionsPerUser,
        };
    }, [hasRealData, dataProvider]);

    // Load scenarios on mount
    useEffect(() => {
        loadScenarios();
    }, []);

    const loadScenarios = async () => {
        setIsLoading(true);
        try {
            const data = await getAllScenarios();
            setScenarios(data);
        } catch (error) {
            console.error('Failed to load scenarios:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveScenario = useCallback(async (data: {
        name: string;
        input: ScenarioInput;
        result: ScenarioResult;
    }) => {
        try {
            const saved = await saveScenario({
                name: data.name,
                baselineMetrics: data.input.baselineMetrics,
                modifications: data.input.modifications,
                timeHorizon: data.input.timeHorizon,
                dailyNewUsers: data.input.dailyNewUsers || 1000,
                result: data.result,
                tags: [],
                isFavorite: false,
            });
            setScenarios(prev => [saved, ...prev]);
        } catch (error) {
            console.error('Failed to save scenario:', error);
        }
    }, []);

    const handleDeleteScenario = useCallback(async (id: string) => {
        try {
            await deleteScenario(id);
            setScenarios(prev => prev.filter(s => s.id !== id));
            if (selectedScenario?.id === id) {
                setSelectedScenario(null);
            }
        } catch (error) {
            console.error('Failed to delete scenario:', error);
        }
    }, [selectedScenario]);

    const handleToggleFavorite = useCallback(async (id: string) => {
        try {
            const updated = await toggleFavorite(id);
            if (updated) {
                setScenarios(prev =>
                    prev.map(s => s.id === id ? updated : s)
                );
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    }, []);

    const handleDuplicate = useCallback(async (id: string) => {
        try {
            const duplicated = await duplicateScenario(id);
            if (duplicated) {
                setScenarios(prev => [duplicated, ...prev]);
            }
        } catch (error) {
            console.error('Failed to duplicate scenario:', error);
        }
    }, []);

    const handleExport = useCallback(async () => {
        try {
            const json = await exportScenarios();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `what-if-scenarios-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export scenarios:', error);
        }
    }, []);

    const handleLoadScenario = useCallback((scenario: SavedScenario) => {
        setSelectedScenario(scenario);
    }, []);

    // Separate favorites and regular scenarios
    const favoriteScenarios = scenarios.filter(s => s.isFavorite);
    const regularScenarios = scenarios.filter(s => !s.isFavorite);

    return (
        <div className="min-h-screen bg-bg-darkest">
            {/* Page Header */}
            <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Lightbulb className="w-7 h-7 text-chart-orange" />
                        What-If Analysis
                    </h1>
                    <DataModeIndicator />
                </div>
                <p className="text-zinc-500 mt-1">
                    {hasRealData
                        ? 'Simulate scenarios using your real data as baseline'
                        : 'Simulate revenue and metric projections with demo data'}
                </p>
                {hasRealData && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                        <Database className="w-3.5 h-3.5" />
                        Baseline metrics calculated from your uploaded data
                    </div>
                )}
            </div>
            <div className="flex">
                {/* Sidebar - Saved Scenarios */}
                <aside className="w-80 min-h-screen bg-bg-dark border-r border-white/[0.06] p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Saved Scenarios</h2>
                        <button
                            onClick={handleExport}
                            disabled={scenarios.length === 0}
                            className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Export all scenarios"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary" />
                        </div>
                    ) : scenarios.length === 0 ? (
                        <div className="text-center py-8">
                            <Lightbulb className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                            <p className="text-zinc-400 text-sm">
                                No saved scenarios yet.
                            </p>
                            <p className="text-zinc-500 text-xs mt-1">
                                Use the simulator to create scenarios.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1 overflow-y-auto">
                            {/* Favorites */}
                            {favoriteScenarios.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                                        Favorites
                                    </h3>
                                    <div className="space-y-2">
                                        {favoriteScenarios.map(scenario => (
                                            <ScenarioCard
                                                key={scenario.id}
                                                scenario={scenario}
                                                isSelected={selectedScenario?.id === scenario.id}
                                                onSelect={handleLoadScenario}
                                                onDelete={handleDeleteScenario}
                                                onToggleFavorite={handleToggleFavorite}
                                                onDuplicate={handleDuplicate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Regular Scenarios */}
                            {regularScenarios.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                                        All Scenarios
                                    </h3>
                                    <div className="space-y-2">
                                        {regularScenarios.map(scenario => (
                                            <ScenarioCard
                                                key={scenario.id}
                                                scenario={scenario}
                                                isSelected={selectedScenario?.id === scenario.id}
                                                onSelect={handleLoadScenario}
                                                onDelete={handleDeleteScenario}
                                                onToggleFavorite={handleToggleFavorite}
                                                onDuplicate={handleDuplicate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    <WhatIfSimulator
                        baselineMetrics={selectedScenario?.baselineMetrics || realBaseline}
                        onSave={handleSaveScenario}
                    />
                </main>
            </div>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ScenarioCardProps {
    scenario: SavedScenario;
    isSelected: boolean;
    onSelect: (scenario: SavedScenario) => void;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onDuplicate: (id: string) => void;
}

function ScenarioCard({
    scenario,
    isSelected,
    onSelect,
    onDelete,
    onToggleFavorite,
    onDuplicate,
}: ScenarioCardProps) {
    const [showActions, setShowActions] = useState(false);

    const impact = scenario.result?.impact;
    const impactPercent = impact?.revenueChangePercent ?? 0;
    const impactColor = impactPercent > 5 ? 'text-green-400' :
                        impactPercent < -5 ? 'text-red-400' : 'text-zinc-400';

    return (
        <div
            className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-accent-primary/20 border border-accent-primary/30'
                    : 'bg-bg-card hover:bg-bg-card-hover border border-transparent'
            }`}
            onClick={() => onSelect(scenario)}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white truncate">
                            {scenario.name}
                        </h4>
                        {scenario.isFavorite && (
                            <Star className="w-3 h-3 text-yellow-400 fill-current flex-shrink-0" />
                        )}
                    </div>
                    {impact && (
                        <div className={`text-xs ${impactColor} mt-1`}>
                            {impactPercent >= 0 ? '+' : ''}{impactPercent.toFixed(1)}% revenue
                        </div>
                    )}
                    <div className="text-xs text-zinc-500 mt-1">
                        {new Date(scenario.updatedAt).toLocaleDateString()}
                    </div>
                </div>

                {showActions && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(scenario.id); }}
                            className="p-1 text-zinc-400 hover:text-yellow-400"
                            title={scenario.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {scenario.isFavorite ? (
                                <StarOff className="w-3.5 h-3.5" />
                            ) : (
                                <Star className="w-3.5 h-3.5" />
                            )}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(scenario.id); }}
                            className="p-1 text-zinc-400 hover:text-white"
                            title="Duplicate"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }}
                            className="p-1 text-zinc-400 hover:text-red-400"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WhatIfPage;
