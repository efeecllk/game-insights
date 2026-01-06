/**
 * What-If Analysis Page
 * Scenario simulation for revenue and metric projections
 * Phase 2: Page-by-Page Functionality (updated with Obsidian design)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb,
    Trash2,
    Star,
    StarOff,
    Copy,
    Download,
    Database,
    Sparkles,
    TrendingUp,
    TrendingDown,
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
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: { duration: 0.2 },
    },
};

// ============================================================================
// Noise texture for glassmorphism
// ============================================================================


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
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full" />
                <div className="absolute top-1/3 -left-32 w-72 h-72 bg-orange-500/5 rounded-full" />
                <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-yellow-500/5 rounded-full" />
            </div>

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative p-6 border-b border-slate-800"
                
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20"
                    >
                        <Lightbulb className="w-6 h-6 text-amber-400" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-orange-200 to-yellow-200 bg-clip-text text-transparent flex items-center gap-3">
                            What-If Analysis
                            <DataModeIndicator />
                        </h1>
                        <p className="text-slate-400 mt-0.5 text-sm">
                            {hasRealData
                                ? 'Simulate scenarios using your real data as baseline'
                                : 'Simulate revenue and metric projections with demo data'}
                        </p>
                    </div>
                </div>
                {hasRealData && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-3 flex items-center gap-2 text-xs text-[#DA7756]"
                    >
                        <Database className="w-3.5 h-3.5" />
                        Baseline metrics calculated from your uploaded data
                    </motion.div>
                )}
            </motion.div>

            <div className="flex relative">
                {/* Sidebar - Saved Scenarios */}
                <motion.aside
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-80 min-h-[calc(100vh-88px)] bg-gradient-to-b from-slate-900/80 to-slate-950/80  border-r border-slate-800 p-4 flex flex-col relative"
                    
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Saved Scenarios
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExport}
                            disabled={scenarios.length === 0}
                            className="p-2 text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-white/5"
                            title="Export all scenarios"
                        >
                            <Download className="w-4 h-4" />
                        </motion.button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-10 h-10 border-2 border-amber-500/20 rounded-full" />
                                <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-amber-400 rounded-full animate-spin" />
                            </div>
                        </div>
                    ) : scenarios.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-800 flex items-center justify-center">
                                <Lightbulb className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">
                                No saved scenarios yet
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                                Use the simulator to create scenarios
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                        >
                            {/* Favorites */}
                            <AnimatePresence>
                                {favoriteScenarios.length > 0 && (
                                    <motion.div variants={itemVariants}>
                                        <h3 className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Star className="w-3 h-3 fill-amber-400" />
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
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Regular Scenarios */}
                            <AnimatePresence>
                                {regularScenarios.length > 0 && (
                                    <motion.div variants={itemVariants}>
                                        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.aside>

                {/* Main Content */}
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex-1 p-6"
                >
                    <WhatIfSimulator
                        baselineMetrics={selectedScenario?.baselineMetrics || realBaseline}
                        onSave={handleSaveScenario}
                    />
                </motion.main>
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
    const isPositive = impactPercent > 0;
    const isNeutral = Math.abs(impactPercent) <= 5;

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                    ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-800/40 hover:from-slate-800/60 hover:to-slate-900/60 border border-slate-800 hover:border-white/[0.1]'
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
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                    </div>
                    {impact && (
                        <div className={`text-xs mt-1.5 flex items-center gap-1 ${
                            isNeutral ? 'text-slate-400' :
                            isPositive ? 'text-[#DA7756]' : 'text-rose-400'
                        }`}>
                            {!isNeutral && (
                                isPositive
                                    ? <TrendingUp className="w-3 h-3" />
                                    : <TrendingDown className="w-3 h-3" />
                            )}
                            {impactPercent >= 0 ? '+' : ''}{impactPercent.toFixed(1)}% revenue
                        </div>
                    )}
                    <div className="text-[10px] text-slate-500 mt-1.5">
                        {new Date(scenario.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </div>
                </div>

                <AnimatePresence>
                    {showActions && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-0.5"
                        >
                            <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(scenario.id); }}
                                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                                title={scenario.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                {scenario.isFavorite ? (
                                    <StarOff className="w-3.5 h-3.5" />
                                ) : (
                                    <Star className="w-3.5 h-3.5" />
                                )}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onDuplicate(scenario.id); }}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                title="Duplicate"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default WhatIfPage;
