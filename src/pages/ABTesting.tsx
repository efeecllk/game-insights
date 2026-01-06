/**
 * A/B Testing Dashboard - Obsidian Analytics Design
 *
 * Premium experimentation platform with:
 * - Glassmorphism containers
 * - Warm orange accent theme (Claude palette)
 * - Animated entrance effects
 * - Refined stat cards
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FlaskConical,
    Plus,
    Play,
    Pause,
    CheckCircle,
    Archive,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    Clock,
    Calculator,
    ChevronRight,
    AlertCircle,
    Trophy,
    BarChart3,
    Settings,
    Trash2,
    Brain,
    Sparkles,
} from 'lucide-react';
import { ExperimentInsights } from '../components/analytics/ExperimentInsights';
import {
    Experiment,
    ExperimentStatus,
    Variant,
    VariantResult,
    getAllExperiments,
    saveExperiment,
    deleteExperiment,
    createExperiment,
    startExperiment,
    pauseExperiment,
    completeExperiment,
    archiveExperiment,
    calculateSampleSize,
    estimateDuration,
    calculateBayesianProbability,
    initializeSampleExperiments,
    generateMockResults,
} from '../lib/experimentStore';
import { generateId } from '../lib/db';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// ============================================================================
// Main Page Component
// ============================================================================

export function ABTestingPage() {
    const { columns } = useGameData();
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
    const [view, setView] = useState<'list' | 'detail' | 'create' | 'calculator' | 'insights'>('list');
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'all'>('all');

    void columns.some(c =>
        c.role === 'dimension' && (
            c.originalName.toLowerCase().includes('variant') ||
            c.originalName.toLowerCase().includes('ab_test') ||
            c.originalName.toLowerCase().includes('experiment') ||
            c.originalName.toLowerCase().includes('group')
        )
    );

    async function loadExperiments() {
        setLoading(true);
        await initializeSampleExperiments();
        const exps = await getAllExperiments();
        setExperiments(exps);
        setLoading(false);
    }

    useEffect(() => {
        loadExperiments();
    }, []);

    const filteredExperiments = useMemo(() => {
        if (statusFilter === 'all') return experiments;
        return experiments.filter(e => e.status === statusFilter);
    }, [experiments, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: experiments.length,
            running: experiments.filter(e => e.status === 'running').length,
            completed: experiments.filter(e => e.status === 'completed').length,
            draft: experiments.filter(e => e.status === 'draft').length,
        };
    }, [experiments]);

    async function handleStartExperiment(id: string) {
        const exp = await startExperiment(id);
        if (exp) {
            exp.results = generateMockResults(exp);
            await saveExperiment(exp);
            await loadExperiments();
            if (selectedExperiment?.id === id) {
                setSelectedExperiment(exp);
            }
        }
    }

    async function handlePauseExperiment(id: string) {
        await pauseExperiment(id);
        await loadExperiments();
    }

    async function handleCompleteExperiment(id: string, winner?: string) {
        await completeExperiment(id, winner);
        await loadExperiments();
    }

    async function handleArchiveExperiment(id: string) {
        await archiveExperiment(id);
        await loadExperiments();
    }

    async function handleDeleteExperiment(id: string) {
        await deleteExperiment(id);
        await loadExperiments();
        if (selectedExperiment?.id === id) {
            setSelectedExperiment(null);
            setView('list');
        }
    }

    async function handleCreateExperiment(experiment: Experiment) {
        await saveExperiment(experiment);
        await loadExperiments();
        setView('list');
    }

    function handleSelectExperiment(exp: Experiment) {
        setSelectedExperiment(exp);
        setView('detail');
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <Card variant="elevated" padding="md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#DA7756]/30 to-[#C15F3C]/20 rounded-xl blur-lg" />
                                <div className="relative w-12 h-12 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 rounded-xl flex items-center justify-center">
                                    <FlaskConical className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                        A/B Testing
                                    </h1>
                                    <DataModeIndicator />
                                </div>
                                <p className="text-slate-500 text-sm mt-0.5">Run experiments and optimize your game</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Sparkles className="w-4 h-4 text-amber-400" />}
                                onClick={() => setView('insights')}
                            >
                                AI Insights
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Calculator className="w-4 h-4" />}
                                onClick={() => setView('calculator')}
                            >
                                Calculator
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => setView('create')}
                            >
                                New Experiment
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    label="Total Experiments"
                    value={stats.total}
                    icon={FlaskConical}
                    active={statusFilter === 'all'}
                    onClick={() => setStatusFilter('all')}
                    color="orange"
                    index={0}
                />
                <StatCard
                    label="Running"
                    value={stats.running}
                    icon={Play}
                    color="success"
                    active={statusFilter === 'running'}
                    onClick={() => setStatusFilter('running')}
                    index={1}
                />
                <StatCard
                    label="Completed"
                    value={stats.completed}
                    icon={CheckCircle}
                    color="blue"
                    active={statusFilter === 'completed'}
                    onClick={() => setStatusFilter('completed')}
                    index={2}
                />
                <StatCard
                    label="Drafts"
                    value={stats.draft}
                    icon={Settings}
                    color="amber"
                    active={statusFilter === 'draft'}
                    onClick={() => setStatusFilter('draft')}
                    index={3}
                />
            </div>

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center h-64"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#DA7756]/20 rounded-full" />
                            <div className="relative w-12 h-12 border-2 border-[#DA7756]/30 border-t-[#DA7756] rounded-full animate-spin" />
                        </div>
                    </motion.div>
                ) : view === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <ExperimentList
                            experiments={filteredExperiments}
                            onSelect={handleSelectExperiment}
                            onStart={handleStartExperiment}
                            onPause={handlePauseExperiment}
                            onComplete={handleCompleteExperiment}
                            onArchive={handleArchiveExperiment}
                            onDelete={handleDeleteExperiment}
                        />
                    </motion.div>
                ) : view === 'detail' && selectedExperiment ? (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <ExperimentDetail
                            experiment={selectedExperiment}
                            onBack={() => setView('list')}
                            onStart={() => handleStartExperiment(selectedExperiment.id)}
                            onPause={() => handlePauseExperiment(selectedExperiment.id)}
                            onComplete={(winner) => handleCompleteExperiment(selectedExperiment.id, winner)}
                        />
                    </motion.div>
                ) : view === 'create' ? (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <ExperimentCreate
                            onSave={handleCreateExperiment}
                            onCancel={() => setView('list')}
                        />
                    </motion.div>
                ) : view === 'calculator' ? (
                    <motion.div
                        key="calculator"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <SampleSizeCalculator onBack={() => setView('list')} />
                    </motion.div>
                ) : view === 'insights' ? (
                    <motion.div
                        key="insights"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <AggregateInsightsView experiments={experiments} onBack={() => setView('list')} />
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Stat Card Component
// ============================================================================

function StatCard({
    label,
    value,
    icon: Icon,
    color = 'orange',
    active,
    onClick,
    index,
}: {
    label: string;
    value: number;
    icon: typeof FlaskConical;
    color?: 'orange' | 'success' | 'blue' | 'amber';
    active?: boolean;
    onClick?: () => void;
    index: number;
}) {
    const colorStyles = {
        orange: {
            bg: 'from-[#DA7756]/20 to-[#DA7756]/5',
            border: 'border-[#DA7756]/20',
            icon: 'text-[#DA7756]',
            glow: 'bg-[#DA7756]/20',
        },
        success: {
            bg: 'from-[#7A8B5B]/20 to-[#7A8B5B]/5',
            border: 'border-[#7A8B5B]/20',
            icon: 'text-[#7A8B5B]',
            glow: 'bg-[#7A8B5B]/20',
        },
        blue: {
            bg: 'from-[#8F8B82]/20 to-[#8F8B82]/5',
            border: 'border-[#8F8B82]/20',
            icon: 'text-[#8F8B82]',
            glow: 'bg-[#8F8B82]/20',
        },
        amber: {
            bg: 'from-amber-500/20 to-amber-500/5',
            border: 'border-amber-500/20',
            icon: 'text-amber-400',
            glow: 'bg-amber-500/20',
        },
    };

    const style = colorStyles[color];

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${
                active
                    ? 'bg-slate-900 border-[#DA7756]/50 ring-1 ring-[#DA7756]/20'
                    : 'bg-gradient-to-br from-slate-900/50 via-slate-900/30 to-slate-950/50 border-slate-800 hover:border-slate-600'
            } border`}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className={`absolute inset-0 ${style.glow} rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${style.icon}`} />
                    </div>
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                </div>
            </div>
        </motion.button>
    );
}

// ============================================================================
// Experiment List
// ============================================================================

function ExperimentList({
    experiments,
    onSelect,
    onStart,
    onPause,
    onComplete,
    onArchive,
    onDelete,
}: {
    experiments: Experiment[];
    onSelect: (exp: Experiment) => void;
    onStart: (id: string) => void;
    onPause: (id: string) => void;
    onComplete: (id: string, winner?: string) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    if (experiments.length === 0) {
        return (
            <Card variant="default" padding="lg" className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="relative inline-block mb-4"
                >
                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-xl" />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 rounded-xl flex items-center justify-center mx-auto">
                        <FlaskConical className="w-6 h-6 text-[#DA7756]" />
                    </div>
                </motion.div>
                <h3 className="text-lg font-semibold text-white mb-2">No experiments yet</h3>
                <p className="text-slate-500">Create your first A/B test to start optimizing</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {experiments.map((exp, index) => (
                <ExperimentCard
                    key={exp.id}
                    experiment={exp}
                    onClick={() => onSelect(exp)}
                    onStart={() => onStart(exp.id)}
                    onPause={() => onPause(exp.id)}
                    onComplete={() => onComplete(exp.id)}
                    onArchive={() => onArchive(exp.id)}
                    onDelete={() => onDelete(exp.id)}
                    index={index}
                />
            ))}
        </div>
    );
}

// ============================================================================
// Experiment Card
// ============================================================================

function ExperimentCard({
    experiment,
    onClick,
    onStart,
    onPause,
    onComplete,
    onArchive,
    onDelete,
    index,
}: {
    experiment: Experiment;
    onClick: () => void;
    onStart: () => void;
    onPause: () => void;
    onComplete: () => void;
    onArchive: () => void;
    onDelete: () => void;
    index: number;
}) {
    const statusConfig = {
        draft: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Settings, label: 'Draft' },
        running: { color: 'bg-[#7A8B5B]/10 text-[#7A8B5B] border-[#7A8B5B]/20', icon: Play, label: 'Running' },
        paused: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Pause, label: 'Paused' },
        completed: { color: 'bg-[#8F8B82]/10 text-[#8F8B82] border-[#8F8B82]/20', icon: CheckCircle, label: 'Completed' },
        archived: { color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: Archive, label: 'Archived' },
    };

    const config = statusConfig[experiment.status];
    const StatusIcon = config.icon;

    let progress = 0;
    let totalSamples = 0;
    if (experiment.results) {
        totalSamples = experiment.results.reduce((sum, r) => sum + r.sampleSize, 0);
        progress = Math.min(100, (totalSamples / experiment.requiredSampleSize) * 100);
    }

    const leadingVariant = experiment.results?.reduce((best, current) => {
        if (!best) return current;
        return current.conversionRate > best.conversionRate ? current : best;
    }, null as VariantResult | null);

    const leadingVariantName = leadingVariant
        ? experiment.variants.find(v => v.id === leadingVariant.variantId)?.name
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="default" padding="none" className="group hover:border-slate-600 transition-all overflow-hidden">
                <div className="p-6 cursor-pointer" onClick={onClick}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{experiment.name}</h3>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${config.color}`}>
                                    <StatusIcon className="w-3 h-3 inline mr-1" />
                                    {config.label}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">{experiment.description}</p>

                            <div className="flex items-center gap-6 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {experiment.variants.length} variants
                                </span>
                                <span className="flex items-center gap-1">
                                    <Target className="w-4 h-4" />
                                    {experiment.targetAudience}
                                </span>
                                {experiment.startDate && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Started {new Date(experiment.startDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#DA7756] transition-colors" />
                    </div>

                    {experiment.status === 'running' && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-400">
                                    {totalSamples.toLocaleString()} / {experiment.requiredSampleSize.toLocaleString()} samples
                                </span>
                                {leadingVariantName && leadingVariant && (
                                    <span className="text-[#DA7756] flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" />
                                        {leadingVariantName} leading (+{(leadingVariant.improvement * 100).toFixed(1)}%)
                                    </span>
                                )}
                            </div>
                            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="h-full bg-[#DA7756] rounded-full"
                                />
                            </div>
                        </div>
                    )}

                    {experiment.status === 'completed' && experiment.winner && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center gap-2 text-[#DA7756] bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-xl px-4 py-2"
                        >
                            <Trophy className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Winner: {experiment.variants.find(v => v.id === experiment.winner)?.name}
                            </span>
                        </motion.div>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-slate-800 flex items-center gap-2 bg-white/[0.01]">
                    {experiment.status === 'draft' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); onStart(); }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7A8B5B]/10 text-[#7A8B5B] border border-[#7A8B5B]/20 hover:bg-[#7A8B5B]/20 transition-colors text-sm"
                            >
                                <Play className="w-4 h-4" />
                                Start
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </motion.button>
                        </>
                    )}
                    {experiment.status === 'running' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); onPause(); }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors text-sm"
                            >
                                <Pause className="w-4 h-4" />
                                Pause
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8F8B82]/10 text-[#8F8B82] border border-[#8F8B82]/20 hover:bg-[#8F8B82]/20 transition-colors text-sm"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                            </motion.button>
                        </>
                    )}
                    {experiment.status === 'paused' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); onStart(); }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7A8B5B]/10 text-[#7A8B5B] border border-[#7A8B5B]/20 hover:bg-[#7A8B5B]/20 transition-colors text-sm"
                            >
                                <Play className="w-4 h-4" />
                                Resume
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8F8B82]/10 text-[#8F8B82] border border-[#8F8B82]/20 hover:bg-[#8F8B82]/20 transition-colors text-sm"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                            </motion.button>
                        </>
                    )}
                    {experiment.status === 'completed' && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); onArchive(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors text-sm"
                        >
                            <Archive className="w-4 h-4" />
                            Archive
                        </motion.button>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}

// ============================================================================
// Experiment Detail View
// ============================================================================

function ExperimentDetail({
    experiment,
    onBack,
    onStart,
    onPause,
    onComplete,
}: {
    experiment: Experiment;
    onBack: () => void;
    onStart: () => void;
    onPause: () => void;
    onComplete: (winner?: string) => void;
}) {
    const [selectedWinner, setSelectedWinner] = useState<string | null>(experiment.winner || null);

    const bayesian = useMemo(() => {
        if (!experiment.results || experiment.results.length < 2) return null;

        const control = experiment.results.find(r => {
            const v = experiment.variants.find(v => v.id === r.variantId);
            return v?.isControl;
        });
        const treatment = experiment.results.find(r => {
            const v = experiment.variants.find(v => v.id === r.variantId);
            return !v?.isControl;
        });

        if (!control || !treatment) return null;

        return calculateBayesianProbability(
            control.conversions,
            control.sampleSize,
            treatment.conversions,
            treatment.sampleSize
        );
    }, [experiment]);

    return (
        <div className="space-y-6">
            <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -5 }}
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to experiments
            </motion.button>

            <Card variant="elevated" padding="md">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{experiment.name}</h2>
                        <p className="text-slate-400 mt-1">{experiment.description}</p>
                        {experiment.hypothesis && (
                            <p className="text-sm text-slate-500 mt-2 italic">
                                Hypothesis: {experiment.hypothesis}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {experiment.status === 'draft' && (
                            <Button variant="primary" icon={<Play className="w-4 h-4" />} onClick={onStart}>
                                Start Experiment
                            </Button>
                        )}
                        {experiment.status === 'running' && (
                            <>
                                <Button variant="secondary" icon={<Pause className="w-4 h-4" />} onClick={onPause}>
                                    Pause
                                </Button>
                                <Button variant="primary" icon={<CheckCircle className="w-4 h-4" />} onClick={() => onComplete(selectedWinner || undefined)}>
                                    Complete
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Target Audience', value: experiment.targetAudience },
                    { label: 'Traffic Allocation', value: `${experiment.trafficAllocation}%` },
                    { label: 'Required Sample', value: experiment.requiredSampleSize.toLocaleString() },
                    { label: 'Est. Duration', value: `${experiment.estimatedDuration || '—'} days` },
                ].map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card variant="default" padding="md">
                            <p className="text-sm text-slate-500 mb-1">{item.label}</p>
                            <p className="text-white font-medium">{item.value}</p>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {experiment.results && experiment.results.length > 0 ? (
                <Card variant="default" padding="none">
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#DA7756]" />
                            Results
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {experiment.variants.map((variant, index) => {
                                const result = experiment.results?.find(r => r.variantId === variant.id);
                                if (!result) return null;

                                const isWinner = experiment.winner === variant.id || selectedWinner === variant.id;
                                const isLeading = !variant.isControl && result.improvement > 0 && result.isSignificant;

                                return (
                                    <motion.div
                                        key={variant.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                            isWinner
                                                ? 'border-[#DA7756]/50 bg-[#DA7756]/5'
                                                : 'border-slate-800 hover:border-slate-600'
                                        }`}
                                        onClick={() => !experiment.winner && setSelectedWinner(variant.id)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-white font-medium">{variant.name}</span>
                                                {variant.isControl && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-slate-500/20 text-slate-400 border border-slate-500/20">
                                                        Control
                                                    </span>
                                                )}
                                                {isWinner && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/20 flex items-center gap-1">
                                                        <Trophy className="w-3 h-3" />
                                                        Winner
                                                    </span>
                                                )}
                                                {isLeading && !isWinner && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-[#C15F3C]/20 text-[#C15F3C] border border-[#C15F3C]/20">
                                                        Leading
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-slate-500">
                                                {result.sampleSize.toLocaleString()} users
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Conversion Rate</p>
                                                <p className="text-xl font-bold text-white">
                                                    {(result.conversionRate * 100).toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Improvement</p>
                                                <p className={`text-xl font-bold flex items-center gap-1 ${
                                                    result.improvement > 0 ? 'text-[#DA7756]' :
                                                    result.improvement < 0 ? 'text-rose-400' : 'text-slate-400'
                                                }`}>
                                                    {result.improvement > 0 ? <TrendingUp className="w-5 h-5" /> :
                                                     result.improvement < 0 ? <TrendingDown className="w-5 h-5" /> : null}
                                                    {result.improvement > 0 ? '+' : ''}{(result.improvement * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Confidence</p>
                                                <p className="text-xl font-bold text-white">
                                                    {((1 - result.pValue) * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Significant</p>
                                                <p className={`text-xl font-bold ${result.isSignificant ? 'text-[#DA7756]' : 'text-slate-500'}`}>
                                                    {result.isSignificant ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                                <span>{(result.confidenceInterval[0] * 100).toFixed(2)}%</span>
                                                <span>95% CI</span>
                                                <span>{(result.confidenceInterval[1] * 100).toFixed(2)}%</span>
                                            </div>
                                            <div className="h-2 bg-white/[0.05] rounded-full relative">
                                                <div
                                                    className="absolute h-full bg-[#DA7756]/30 rounded-full"
                                                    style={{
                                                        left: `${Math.max(0, result.confidenceInterval[0] * 100 / 0.3)}%`,
                                                        width: `${Math.min(100, (result.confidenceInterval[1] - result.confidenceInterval[0]) * 100 / 0.3)}%`,
                                                    }}
                                                />
                                                <div
                                                    className="absolute w-2 h-2 bg-[#DA7756] rounded-full top-0"
                                                    style={{
                                                        left: `${Math.min(100, result.conversionRate * 100 / 0.3)}%`,
                                                        transform: 'translateX(-50%)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {bayesian && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-6 p-4 bg-[#DA7756]/5 rounded-xl border border-[#DA7756]/20"
                            >
                                <h4 className="text-sm font-medium text-white mb-3">Bayesian Analysis</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400 mb-1">Control wins</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-3 bg-white/[0.05] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${bayesian.controlProbability * 100}%` }}
                                                    className="h-full bg-slate-500 rounded-full"
                                                />
                                            </div>
                                            <span className="text-white font-medium text-sm">
                                                {(bayesian.controlProbability * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400 mb-1">Treatment wins</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-3 bg-white/[0.05] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${bayesian.treatmentProbability * 100}%` }}
                                                    className="h-full bg-[#DA7756] rounded-full"
                                                />
                                            </div>
                                            <span className="text-white font-medium text-sm">
                                                {(bayesian.treatmentProbability * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </Card>
            ) : (
                <Card variant="default" padding="lg" className="text-center">
                    <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-slate-500/20 rounded-xl" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-500/30 rounded-xl flex items-center justify-center mx-auto">
                            <AlertCircle className="w-6 h-6 text-slate-400" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No results yet</h3>
                    <p className="text-slate-500">Start the experiment to begin collecting data</p>
                </Card>
            )}

            {(experiment.status === 'running' || experiment.status === 'completed') && experiment.results && (
                <Card variant="default" padding="none">
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Brain className="w-5 h-5 text-amber-400" />
                            AI Intelligence
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Automated analysis and recommendations
                        </p>
                    </div>
                    <div className="p-6">
                        <ExperimentInsights experiment={experiment} />
                    </div>
                </Card>
            )}

            {experiment.status === 'completed' && experiment.conclusionNotes && (
                <Card variant="default" padding="md">
                    <h3 className="text-lg font-semibold text-white mb-3">Conclusion</h3>
                    <p className="text-slate-400">{experiment.conclusionNotes}</p>
                </Card>
            )}
        </div>
    );
}

// ============================================================================
// Create Experiment Form
// ============================================================================

function ExperimentCreate({
    onSave,
    onCancel,
}: {
    onSave: (experiment: Experiment) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [targetAudience, setTargetAudience] = useState('All Users');
    const [baselineRate, setBaselineRate] = useState(5);
    const [mde, setMde] = useState(20);
    const [variants, setVariants] = useState<Variant[]>([
        { id: generateId(), name: 'Control', description: 'Original experience', trafficPercent: 50, isControl: true },
        { id: generateId(), name: 'Treatment', description: 'New experience', trafficPercent: 50, isControl: false },
    ]);

    const sampleSize = useMemo(() => {
        return calculateSampleSize(baselineRate / 100, mde / 100);
    }, [baselineRate, mde]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const experiment = createExperiment(name, description, {
            hypothesis,
            targetAudience,
            variants,
            baselineConversionRate: baselineRate / 100,
            minimumDetectableEffect: mde / 100,
            requiredSampleSize: sampleSize.total,
            estimatedDuration: estimateDuration(sampleSize.total, 500),
        });

        onSave(experiment);
    }

    function addVariant() {
        const newPercent = Math.floor(100 / (variants.length + 1));
        const updatedVariants = variants.map(v => ({
            ...v,
            trafficPercent: newPercent,
        }));
        updatedVariants.push({
            id: generateId(),
            name: `Variant ${String.fromCharCode(65 + variants.length)}`,
            description: '',
            trafficPercent: 100 - newPercent * variants.length,
            isControl: false,
        });
        setVariants(updatedVariants);
    }

    function removeVariant(id: string) {
        if (variants.length <= 2) return;
        const filtered = variants.filter(v => v.id !== id);
        const perVariant = Math.floor(100 / filtered.length);
        const updated = filtered.map((v, i) => ({
            ...v,
            trafficPercent: i === filtered.length - 1 ? 100 - perVariant * (filtered.length - 1) : perVariant,
        }));
        setVariants(updated);
    }

    return (
        <div className="space-y-6">
            <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -5 }}
                onClick={onCancel}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to experiments
            </motion.button>

            <Card variant="default" padding="none">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-semibold text-white">Create New Experiment</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Experiment Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                                placeholder="e.g., Onboarding Flow Test"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Target Audience
                            </label>
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                            >
                                <option value="All Users">All Users</option>
                                <option value="New Users">New Users</option>
                                <option value="Returning Users">Returning Users</option>
                                <option value="Non-Payers">Non-Payers</option>
                                <option value="Payers">Payers</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all resize-none"
                            placeholder="What are you testing?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Hypothesis
                        </label>
                        <textarea
                            value={hypothesis}
                            onChange={(e) => setHypothesis(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all resize-none"
                            placeholder="What do you expect to happen?"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-slate-400">Variants</label>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="text-sm text-[#DA7756] hover:text-[#C15F3C] transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Variant
                            </button>
                        </div>
                        <div className="space-y-3">
                            {variants.map((variant) => (
                                <motion.div
                                    key={variant.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-slate-800"
                                >
                                    <input
                                        type="text"
                                        value={variant.name}
                                        onChange={(e) => setVariants(variants.map(v =>
                                            v.id === variant.id ? { ...v, name: e.target.value } : v
                                        ))}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                                        placeholder="Variant name"
                                    />
                                    <input
                                        type="text"
                                        value={variant.description}
                                        onChange={(e) => setVariants(variants.map(v =>
                                            v.id === variant.id ? { ...v, description: e.target.value } : v
                                        ))}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                                        placeholder="Description"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={variant.trafficPercent}
                                            onChange={(e) => setVariants(variants.map(v =>
                                                v.id === variant.id ? { ...v, trafficPercent: parseInt(e.target.value) || 0 } : v
                                            ))}
                                            className="w-16 px-3 py-2 rounded-lg bg-white/[0.03] border border-slate-700 text-white text-center focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                                            min={1}
                                            max={99}
                                        />
                                        <span className="text-slate-500">%</span>
                                    </div>
                                    {variant.isControl && (
                                        <span className="px-2 py-1 rounded text-xs bg-slate-500/20 text-slate-400 border border-slate-500/20">
                                            Control
                                        </span>
                                    )}
                                    {!variant.isControl && variants.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(variant.id)}
                                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Baseline Conversion Rate (%)
                            </label>
                            <input
                                type="number"
                                value={baselineRate}
                                onChange={(e) => setBaselineRate(parseFloat(e.target.value) || 0)}
                                step={0.1}
                                min={0.1}
                                max={100}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Minimum Detectable Effect (%)
                            </label>
                            <input
                                type="number"
                                value={mde}
                                onChange={(e) => setMde(parseFloat(e.target.value) || 0)}
                                step={1}
                                min={1}
                                max={100}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                            />
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-[#DA7756]/5 rounded-xl border border-[#DA7756]/20"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Calculator className="w-5 h-5 text-[#DA7756]" />
                            <span className="text-white font-medium">Sample Size Required</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {sampleSize.total.toLocaleString()} users
                        </p>
                        <p className="text-sm text-slate-400">
                            ({sampleSize.perVariant.toLocaleString()} per variant)
                        </p>
                    </motion.div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <Button variant="secondary" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button variant="primary" disabled={!name}>
                            Create Experiment
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

// ============================================================================
// Sample Size Calculator
// ============================================================================

function SampleSizeCalculator({ onBack }: { onBack: () => void }) {
    const [baselineRate, setBaselineRate] = useState(5);
    const [mde, setMde] = useState(20);
    const [power, setPower] = useState(80);
    const [significance, setSignificance] = useState(95);
    const [dailyTraffic, setDailyTraffic] = useState(500);
    const [trafficAllocation, setTrafficAllocation] = useState(100);

    const result = useMemo(() => {
        const size = calculateSampleSize(
            baselineRate / 100,
            mde / 100,
            power / 100,
            1 - significance / 100
        );
        const duration = estimateDuration(size.total, dailyTraffic, trafficAllocation);
        return { ...size, duration };
    }, [baselineRate, mde, power, significance, dailyTraffic, trafficAllocation]);

    return (
        <div className="space-y-6">
            <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -5 }}
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to experiments
            </motion.button>

            <Card variant="default" padding="none">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-[#DA7756]" />
                        Sample Size Calculator
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Calculate how many users you need for a statistically significant result
                    </p>
                </div>

                <div className="p-6 grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {[
                            { label: 'Baseline Conversion Rate', value: baselineRate, setValue: setBaselineRate, min: 0.1, max: 50, step: 0.1, desc: 'Your current conversion rate' },
                            { label: 'Minimum Detectable Effect', value: mde, setValue: setMde, min: 1, max: 100, step: 1, desc: 'Smallest improvement you want to detect' },
                            { label: 'Statistical Power', value: power, setValue: setPower, min: 50, max: 99, step: 1, desc: 'Probability of detecting a real effect (typically 80%)' },
                            { label: 'Significance Level', value: significance, setValue: setSignificance, min: 80, max: 99, step: 1, desc: 'Confidence level (typically 95%)' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    {item.label}
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        value={item.value}
                                        onChange={(e) => item.setValue(parseFloat(e.target.value))}
                                        min={item.min}
                                        max={item.max}
                                        step={item.step}
                                        className="flex-1 accent-[#DA7756]"
                                    />
                                    <span className="text-white font-medium w-16 text-right">{item.value}%</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                            </motion.div>
                        ))}

                        <div className="border-t border-slate-800 pt-6">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Daily Traffic
                            </label>
                            <input
                                type="number"
                                value={dailyTraffic}
                                onChange={(e) => setDailyTraffic(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                                placeholder="500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Traffic Allocation
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    value={trafficAllocation}
                                    onChange={(e) => setTrafficAllocation(parseFloat(e.target.value))}
                                    min={10}
                                    max={100}
                                    step={5}
                                    className="flex-1 accent-[#DA7756]"
                                />
                                <span className="text-white font-medium w-16 text-right">{trafficAllocation}%</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">% of users in experiment</p>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] rounded-2xl p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white">Results</h3>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-[#DA7756]/10 rounded-xl border border-[#DA7756]/20"
                        >
                            <p className="text-sm text-slate-400 mb-1">Required Sample Size</p>
                            <p className="text-3xl font-bold text-white">
                                {result.total.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-500">
                                {result.perVariant.toLocaleString()} per variant
                            </p>
                        </motion.div>

                        <div className="p-4 bg-white/[0.02] rounded-xl border border-slate-800">
                            <p className="text-sm text-slate-400 mb-1">Estimated Duration</p>
                            <p className="text-3xl font-bold text-white">
                                {result.duration} days
                            </p>
                            <p className="text-sm text-slate-500">
                                At {dailyTraffic} users/day ({trafficAllocation}% allocation)
                            </p>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Expected treatment rate</span>
                                <span className="text-white">
                                    {(baselineRate * (1 + mde / 100)).toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Absolute difference</span>
                                <span className="text-white">
                                    {(baselineRate * mde / 100).toFixed(2)}pp
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">False positive rate</span>
                                <span className="text-white">{(100 - significance)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">False negative rate</span>
                                <span className="text-white">{(100 - power)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// Aggregate Insights View
// ============================================================================

function AggregateInsightsView({
    experiments,
    onBack,
}: {
    experiments: Experiment[];
    onBack: () => void;
}) {
    return (
        <div className="space-y-6">
            <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -5 }}
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to experiments
            </motion.button>

            <Card variant="default" padding="none">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Brain className="w-5 h-5 text-amber-400" />
                        AI-Powered Experimentation Insights
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Aggregate learnings and patterns across all your experiments
                    </p>
                </div>

                <div className="p-6">
                    {experiments.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-slate-500/20 rounded-xl" />
                                <div className="relative w-12 h-12 bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-500/30 rounded-xl flex items-center justify-center mx-auto">
                                    <FlaskConical className="w-6 h-6 text-slate-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No experiments to analyze</h3>
                            <p className="text-slate-500">Create and run some experiments to see AI insights</p>
                        </div>
                    ) : (
                        <ExperimentInsights
                            experiments={experiments}
                            showAggregate={true}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}

export default ABTestingPage;
