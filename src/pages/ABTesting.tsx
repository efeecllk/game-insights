/**
 * A/B Testing Dashboard
 * Phase 2: Page-by-Page Functionality (updated)
 */

import { useState, useEffect, useMemo } from 'react';
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

    // Check if uploaded data has experiment/variant columns (for future real data integration)
    // Note: This will be used when we integrate real experiment data from uploads
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
            // Generate mock results for demo
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <FlaskConical className="w-7 h-7 text-accent-primary" />
                            A/B Testing
                        </h1>
                        <DataModeIndicator />
                    </div>
                    <p className="text-zinc-500 mt-1">Run experiments and optimize your game</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('insights')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                    >
                        <Sparkles className="w-4 h-4 text-chart-orange" />
                        AI Insights
                    </button>
                    <button
                        onClick={() => setView('calculator')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                    >
                        <Calculator className="w-4 h-4" />
                        Sample Calculator
                    </button>
                    <button
                        onClick={() => setView('create')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Experiment
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    label="Total Experiments"
                    value={stats.total}
                    icon={FlaskConical}
                    active={statusFilter === 'all'}
                    onClick={() => setStatusFilter('all')}
                />
                <StatCard
                    label="Running"
                    value={stats.running}
                    icon={Play}
                    color="green"
                    active={statusFilter === 'running'}
                    onClick={() => setStatusFilter('running')}
                />
                <StatCard
                    label="Completed"
                    value={stats.completed}
                    icon={CheckCircle}
                    color="blue"
                    active={statusFilter === 'completed'}
                    onClick={() => setStatusFilter('completed')}
                />
                <StatCard
                    label="Drafts"
                    value={stats.draft}
                    icon={Settings}
                    color="yellow"
                    active={statusFilter === 'draft'}
                    onClick={() => setStatusFilter('draft')}
                />
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                </div>
            ) : view === 'list' ? (
                <ExperimentList
                    experiments={filteredExperiments}
                    onSelect={handleSelectExperiment}
                    onStart={handleStartExperiment}
                    onPause={handlePauseExperiment}
                    onComplete={handleCompleteExperiment}
                    onArchive={handleArchiveExperiment}
                    onDelete={handleDeleteExperiment}
                />
            ) : view === 'detail' && selectedExperiment ? (
                <ExperimentDetail
                    experiment={selectedExperiment}
                    onBack={() => setView('list')}
                    onStart={() => handleStartExperiment(selectedExperiment.id)}
                    onPause={() => handlePauseExperiment(selectedExperiment.id)}
                    onComplete={(winner) => handleCompleteExperiment(selectedExperiment.id, winner)}
                />
            ) : view === 'create' ? (
                <ExperimentCreate
                    onSave={handleCreateExperiment}
                    onCancel={() => setView('list')}
                />
            ) : view === 'calculator' ? (
                <SampleSizeCalculator onBack={() => setView('list')} />
            ) : view === 'insights' ? (
                <AggregateInsightsView experiments={experiments} onBack={() => setView('list')} />
            ) : null}
        </div>
    );
}

// ============================================================================
// Stat Card Component
// ============================================================================

function StatCard({
    label,
    value,
    icon: Icon,
    color = 'purple',
    active,
    onClick,
}: {
    label: string;
    value: number;
    icon: typeof FlaskConical;
    color?: 'purple' | 'green' | 'blue' | 'yellow';
    active?: boolean;
    onClick?: () => void;
}) {
    const colors = {
        purple: 'bg-accent-primary/10 text-accent-primary',
        green: 'bg-green-500/10 text-green-500',
        blue: 'bg-blue-500/10 text-blue-500',
        yellow: 'bg-yellow-500/10 text-yellow-500',
    };

    return (
        <button
            onClick={onClick}
            className={`bg-bg-card rounded-card p-4 border transition-all text-left ${
                active ? 'border-accent-primary ring-1 ring-accent-primary/50' : 'border-white/[0.06] hover:border-white/10'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-zinc-500">{label}</p>
                </div>
            </div>
        </button>
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
            <div className="bg-bg-card rounded-card p-12 border border-white/[0.06] text-center">
                <FlaskConical className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No experiments yet</h3>
                <p className="text-zinc-500">Create your first A/B test to start optimizing</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {experiments.map((exp) => (
                <ExperimentCard
                    key={exp.id}
                    experiment={exp}
                    onClick={() => onSelect(exp)}
                    onStart={() => onStart(exp.id)}
                    onPause={() => onPause(exp.id)}
                    onComplete={() => onComplete(exp.id)}
                    onArchive={() => onArchive(exp.id)}
                    onDelete={() => onDelete(exp.id)}
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
}: {
    experiment: Experiment;
    onClick: () => void;
    onStart: () => void;
    onPause: () => void;
    onComplete: () => void;
    onArchive: () => void;
    onDelete: () => void;
}) {
    const statusConfig = {
        draft: { color: 'bg-zinc-500/10 text-zinc-400', icon: Settings, label: 'Draft' },
        running: { color: 'bg-green-500/10 text-green-500', icon: Play, label: 'Running' },
        paused: { color: 'bg-yellow-500/10 text-yellow-500', icon: Pause, label: 'Paused' },
        completed: { color: 'bg-blue-500/10 text-blue-500', icon: CheckCircle, label: 'Completed' },
        archived: { color: 'bg-zinc-500/10 text-zinc-500', icon: Archive, label: 'Archived' },
    };

    const config = statusConfig[experiment.status];
    const StatusIcon = config.icon;

    // Calculate progress for running experiments
    let progress = 0;
    let totalSamples = 0;
    if (experiment.results) {
        totalSamples = experiment.results.reduce((sum, r) => sum + r.sampleSize, 0);
        progress = Math.min(100, (totalSamples / experiment.requiredSampleSize) * 100);
    }

    // Find leading variant
    const leadingVariant = experiment.results?.reduce((best, current) => {
        if (!best) return current;
        return current.conversionRate > best.conversionRate ? current : best;
    }, null as VariantResult | null);

    const leadingVariantName = leadingVariant
        ? experiment.variants.find(v => v.id === leadingVariant.variantId)?.name
        : null;

    return (
        <div className="bg-bg-card rounded-card border border-white/[0.06] hover:border-white/10 transition-all">
            <div className="p-6 cursor-pointer" onClick={onClick}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{experiment.name}</h3>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}>
                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                {config.label}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3">{experiment.description}</p>

                        <div className="flex items-center gap-6 text-sm text-zinc-500">
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

                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                </div>

                {/* Progress bar for running experiments */}
                {experiment.status === 'running' && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-zinc-400">
                                {totalSamples.toLocaleString()} / {experiment.requiredSampleSize.toLocaleString()} samples
                            </span>
                            {leadingVariantName && leadingVariant && (
                                <span className="text-green-500 flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {leadingVariantName} leading (+{(leadingVariant.improvement * 100).toFixed(1)}%)
                                </span>
                            )}
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent-primary rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Winner badge for completed experiments */}
                {experiment.status === 'completed' && experiment.winner && (
                    <div className="mt-4 flex items-center gap-2 text-green-500 bg-green-500/10 rounded-xl px-4 py-2">
                        <Trophy className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            Winner: {experiment.variants.find(v => v.id === experiment.winner)?.name}
                        </span>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="px-6 py-3 border-t border-white/[0.06] flex items-center gap-2">
                {experiment.status === 'draft' && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onStart(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors text-sm"
                        >
                            <Play className="w-4 h-4" />
                            Start
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </>
                )}
                {experiment.status === 'running' && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onPause(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors text-sm"
                        >
                            <Pause className="w-4 h-4" />
                            Pause
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Complete
                        </button>
                    </>
                )}
                {experiment.status === 'paused' && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onStart(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors text-sm"
                        >
                            <Play className="w-4 h-4" />
                            Resume
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Complete
                        </button>
                    </>
                )}
                {experiment.status === 'completed' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onArchive(); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 transition-colors text-sm"
                    >
                        <Archive className="w-4 h-4" />
                        Archive
                    </button>
                )}
            </div>
        </div>
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

    // Calculate Bayesian probability if we have results
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
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to experiments
            </button>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">{experiment.name}</h2>
                    <p className="text-zinc-400 mt-1">{experiment.description}</p>
                    {experiment.hypothesis && (
                        <p className="text-sm text-zinc-500 mt-2 italic">
                            Hypothesis: {experiment.hypothesis}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {experiment.status === 'draft' && (
                        <button
                            onClick={onStart}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Start Experiment
                        </button>
                    )}
                    {experiment.status === 'running' && (
                        <>
                            <button
                                onClick={onPause}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors"
                            >
                                <Pause className="w-4 h-4" />
                                Pause
                            </button>
                            <button
                                onClick={() => onComplete(selectedWinner || undefined)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Experiment Info */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-bg-card rounded-card p-4 border border-white/[0.06]">
                    <p className="text-sm text-zinc-500 mb-1">Target Audience</p>
                    <p className="text-white font-medium">{experiment.targetAudience}</p>
                </div>
                <div className="bg-bg-card rounded-card p-4 border border-white/[0.06]">
                    <p className="text-sm text-zinc-500 mb-1">Traffic Allocation</p>
                    <p className="text-white font-medium">{experiment.trafficAllocation}%</p>
                </div>
                <div className="bg-bg-card rounded-card p-4 border border-white/[0.06]">
                    <p className="text-sm text-zinc-500 mb-1">Required Sample</p>
                    <p className="text-white font-medium">{experiment.requiredSampleSize.toLocaleString()}</p>
                </div>
                <div className="bg-bg-card rounded-card p-4 border border-white/[0.06]">
                    <p className="text-sm text-zinc-500 mb-1">Est. Duration</p>
                    <p className="text-white font-medium">{experiment.estimatedDuration || '—'} days</p>
                </div>
            </div>

            {/* Variant Results */}
            {experiment.results && experiment.results.length > 0 ? (
                <div className="bg-bg-card rounded-card border border-white/[0.06]">
                    <div className="p-6 border-b border-white/[0.06]">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-accent-primary" />
                            Results
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid gap-4">
                            {experiment.variants.map((variant) => {
                                const result = experiment.results?.find(r => r.variantId === variant.id);
                                if (!result) return null;

                                const isWinner = experiment.winner === variant.id ||
                                    (selectedWinner === variant.id);
                                const isLeading = !variant.isControl &&
                                    result.improvement > 0 &&
                                    result.isSignificant;

                                return (
                                    <div
                                        key={variant.id}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                            isWinner
                                                ? 'border-green-500 bg-green-500/5'
                                                : 'border-white/[0.06] hover:border-white/10'
                                        }`}
                                        onClick={() => !experiment.winner && setSelectedWinner(variant.id)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-white font-medium">{variant.name}</span>
                                                {variant.isControl && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-zinc-500/20 text-zinc-400">
                                                        Control
                                                    </span>
                                                )}
                                                {isWinner && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-500 flex items-center gap-1">
                                                        <Trophy className="w-3 h-3" />
                                                        Winner
                                                    </span>
                                                )}
                                                {isLeading && !isWinner && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-accent-primary/20 text-accent-primary">
                                                        Leading
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-zinc-500">
                                                {result.sampleSize.toLocaleString()} users
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-sm text-zinc-500 mb-1">Conversion Rate</p>
                                                <p className="text-xl font-bold text-white">
                                                    {(result.conversionRate * 100).toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-zinc-500 mb-1">Improvement</p>
                                                <p className={`text-xl font-bold flex items-center gap-1 ${
                                                    result.improvement > 0 ? 'text-green-500' :
                                                    result.improvement < 0 ? 'text-red-500' : 'text-zinc-400'
                                                }`}>
                                                    {result.improvement > 0 ? <TrendingUp className="w-5 h-5" /> :
                                                     result.improvement < 0 ? <TrendingDown className="w-5 h-5" /> : null}
                                                    {result.improvement > 0 ? '+' : ''}{(result.improvement * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-zinc-500 mb-1">Confidence</p>
                                                <p className="text-xl font-bold text-white">
                                                    {((1 - result.pValue) * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-zinc-500 mb-1">Significant</p>
                                                <p className={`text-xl font-bold ${result.isSignificant ? 'text-green-500' : 'text-zinc-500'}`}>
                                                    {result.isSignificant ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Confidence interval visualization */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                                                <span>{(result.confidenceInterval[0] * 100).toFixed(2)}%</span>
                                                <span>95% CI</span>
                                                <span>{(result.confidenceInterval[1] * 100).toFixed(2)}%</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full relative">
                                                <div
                                                    className="absolute h-full bg-accent-primary/50 rounded-full"
                                                    style={{
                                                        left: `${Math.max(0, result.confidenceInterval[0] * 100 / 0.3)}%`,
                                                        width: `${Math.min(100, (result.confidenceInterval[1] - result.confidenceInterval[0]) * 100 / 0.3)}%`,
                                                    }}
                                                />
                                                <div
                                                    className="absolute w-2 h-2 bg-accent-primary rounded-full top-0"
                                                    style={{
                                                        left: `${Math.min(100, result.conversionRate * 100 / 0.3)}%`,
                                                        transform: 'translateX(-50%)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bayesian probability */}
                        {bayesian && (
                            <div className="mt-6 p-4 bg-accent-primary/5 rounded-xl border border-accent-primary/20">
                                <h4 className="text-sm font-medium text-white mb-3">Bayesian Analysis</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-400 mb-1">Control wins</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-zinc-500 rounded-full"
                                                    style={{ width: `${bayesian.controlProbability * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-white font-medium text-sm">
                                                {(bayesian.controlProbability * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-400 mb-1">Treatment wins</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-primary rounded-full"
                                                    style={{ width: `${bayesian.treatmentProbability * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-white font-medium text-sm">
                                                {(bayesian.treatmentProbability * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-bg-card rounded-card p-12 border border-white/[0.06] text-center">
                    <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No results yet</h3>
                    <p className="text-zinc-500">Start the experiment to begin collecting data</p>
                </div>
            )}

            {/* AI Insights Panel */}
            {(experiment.status === 'running' || experiment.status === 'completed') && experiment.results && (
                <div className="bg-bg-card rounded-card border border-white/[0.06]">
                    <div className="p-6 border-b border-white/[0.06]">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Brain className="w-5 h-5 text-chart-orange" />
                            AI Intelligence
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1">
                            Automated analysis and recommendations
                        </p>
                    </div>
                    <div className="p-6">
                        <ExperimentInsights experiment={experiment} />
                    </div>
                </div>
            )}

            {/* Conclusion notes for completed experiments */}
            {experiment.status === 'completed' && experiment.conclusionNotes && (
                <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                    <h3 className="text-lg font-semibold text-white mb-3">Conclusion</h3>
                    <p className="text-zinc-400">{experiment.conclusionNotes}</p>
                </div>
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
            <button
                onClick={onCancel}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to experiments
            </button>

            <div className="bg-bg-card rounded-card border border-white/[0.06]">
                <div className="p-6 border-b border-white/[0.06]">
                    <h2 className="text-xl font-semibold text-white">Create New Experiment</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Experiment Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary"
                                placeholder="e.g., Onboarding Flow Test"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Target Audience
                            </label>
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-primary"
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
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary resize-none"
                            placeholder="What are you testing?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Hypothesis
                        </label>
                        <textarea
                            value={hypothesis}
                            onChange={(e) => setHypothesis(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary resize-none"
                            placeholder="What do you expect to happen?"
                        />
                    </div>

                    {/* Variants */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-zinc-400">Variants</label>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Variant
                            </button>
                        </div>
                        <div className="space-y-3">
                            {variants.map((variant) => (
                                <div
                                    key={variant.id}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                                >
                                    <input
                                        type="text"
                                        value={variant.name}
                                        onChange={(e) => setVariants(variants.map(v =>
                                            v.id === variant.id ? { ...v, name: e.target.value } : v
                                        ))}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary"
                                        placeholder="Variant name"
                                    />
                                    <input
                                        type="text"
                                        value={variant.description}
                                        onChange={(e) => setVariants(variants.map(v =>
                                            v.id === variant.id ? { ...v, description: e.target.value } : v
                                        ))}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary"
                                        placeholder="Description"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={variant.trafficPercent}
                                            onChange={(e) => setVariants(variants.map(v =>
                                                v.id === variant.id ? { ...v, trafficPercent: parseInt(e.target.value) || 0 } : v
                                            ))}
                                            className="w-16 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-center focus:outline-none focus:border-accent-primary"
                                            min={1}
                                            max={99}
                                        />
                                        <span className="text-zinc-500">%</span>
                                    </div>
                                    {variant.isControl && (
                                        <span className="px-2 py-1 rounded text-xs bg-zinc-500/20 text-zinc-400">
                                            Control
                                        </span>
                                    )}
                                    {!variant.isControl && variants.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(variant.id)}
                                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sample Size Settings */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Baseline Conversion Rate (%)
                            </label>
                            <input
                                type="number"
                                value={baselineRate}
                                onChange={(e) => setBaselineRate(parseFloat(e.target.value) || 0)}
                                step={0.1}
                                min={0.1}
                                max={100}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Minimum Detectable Effect (%)
                            </label>
                            <input
                                type="number"
                                value={mde}
                                onChange={(e) => setMde(parseFloat(e.target.value) || 0)}
                                step={1}
                                min={1}
                                max={100}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-primary"
                            />
                        </div>
                    </div>

                    {/* Sample Size Result */}
                    <div className="p-4 bg-accent-primary/5 rounded-xl border border-accent-primary/20">
                        <div className="flex items-center gap-3 mb-2">
                            <Calculator className="w-5 h-5 text-accent-primary" />
                            <span className="text-white font-medium">Sample Size Required</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {sampleSize.total.toLocaleString()} users
                        </p>
                        <p className="text-sm text-zinc-400">
                            ({sampleSize.perVariant.toLocaleString()} per variant)
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name}
                            className="px-6 py-2.5 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Experiment
                        </button>
                    </div>
                </form>
            </div>
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
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to experiments
            </button>

            <div className="bg-bg-card rounded-card border border-white/[0.06]">
                <div className="p-6 border-b border-white/[0.06]">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-accent-primary" />
                        Sample Size Calculator
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Calculate how many users you need for a statistically significant result
                    </p>
                </div>

                <div className="p-6 grid grid-cols-2 gap-8">
                    {/* Inputs */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Baseline Conversion Rate
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    value={baselineRate}
                                    onChange={(e) => setBaselineRate(parseFloat(e.target.value))}
                                    min={0.1}
                                    max={50}
                                    step={0.1}
                                    className="flex-1 accent-accent-primary"
                                />
                                <span className="text-white font-medium w-16 text-right">{baselineRate}%</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Your current conversion rate</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Minimum Detectable Effect
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    value={mde}
                                    onChange={(e) => setMde(parseFloat(e.target.value))}
                                    min={1}
                                    max={100}
                                    step={1}
                                    className="flex-1 accent-accent-primary"
                                />
                                <span className="text-white font-medium w-16 text-right">{mde}%</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Smallest improvement you want to detect</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Statistical Power
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    value={power}
                                    onChange={(e) => setPower(parseFloat(e.target.value))}
                                    min={50}
                                    max={99}
                                    step={1}
                                    className="flex-1 accent-accent-primary"
                                />
                                <span className="text-white font-medium w-16 text-right">{power}%</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Probability of detecting a real effect (typically 80%)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Significance Level
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    value={significance}
                                    onChange={(e) => setSignificance(parseFloat(e.target.value))}
                                    min={80}
                                    max={99}
                                    step={1}
                                    className="flex-1 accent-accent-primary"
                                />
                                <span className="text-white font-medium w-16 text-right">{significance}%</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Confidence level (typically 95%)</p>
                        </div>

                        <div className="border-t border-white/[0.06] pt-6">
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Daily Traffic
                            </label>
                            <input
                                type="number"
                                value={dailyTraffic}
                                onChange={(e) => setDailyTraffic(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-primary"
                                placeholder="500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
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
                                    className="flex-1 accent-accent-primary"
                                />
                                <span className="text-white font-medium w-16 text-right">{trafficAllocation}%</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">% of users in experiment</p>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="bg-white/5 rounded-2xl p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white">Results</h3>

                        <div className="p-4 bg-accent-primary/10 rounded-xl border border-accent-primary/20">
                            <p className="text-sm text-zinc-400 mb-1">Required Sample Size</p>
                            <p className="text-3xl font-bold text-white">
                                {result.total.toLocaleString()}
                            </p>
                            <p className="text-sm text-zinc-500">
                                {result.perVariant.toLocaleString()} per variant
                            </p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-sm text-zinc-400 mb-1">Estimated Duration</p>
                            <p className="text-3xl font-bold text-white">
                                {result.duration} days
                            </p>
                            <p className="text-sm text-zinc-500">
                                At {dailyTraffic} users/day ({trafficAllocation}% allocation)
                            </p>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Expected treatment rate</span>
                                <span className="text-white">
                                    {(baselineRate * (1 + mde / 100)).toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Absolute difference</span>
                                <span className="text-white">
                                    {(baselineRate * mde / 100).toFixed(2)}pp
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">False positive rate</span>
                                <span className="text-white">{(100 - significance)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">False negative rate</span>
                                <span className="text-white">{(100 - power)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to experiments
            </button>

            <div className="bg-bg-card rounded-card border border-white/[0.06]">
                <div className="p-6 border-b border-white/[0.06]">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Brain className="w-5 h-5 text-chart-orange" />
                        AI-Powered Experimentation Insights
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Aggregate learnings and patterns across all your experiments
                    </p>
                </div>

                <div className="p-6">
                    {experiments.length === 0 ? (
                        <div className="text-center py-12">
                            <FlaskConical className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">No experiments to analyze</h3>
                            <p className="text-zinc-500">Create and run some experiments to see AI insights</p>
                        </div>
                    ) : (
                        <ExperimentInsights
                            experiments={experiments}
                            showAggregate={true}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default ABTestingPage;
