/**
 * Funnels Page - Obsidian Analytics Design
 *
 * Premium funnel analysis with:
 * - Glassmorphism containers
 * - Emerald accent theme
 * - Animated entrance effects
 * - Refined funnel visualizations
 */

import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Filter,
    Plus,
    Trash2,
    Users,
    Sparkles,
    AlertTriangle,
    Lightbulb,
    ChevronDown,
    Target,
    BarChart3,
    TrendingDown,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';
import { DetectedFunnel } from '../ai/FunnelDetector';
import { Card } from '../components/ui/Card';

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

// Sample funnel templates by game type (fallback when no data)
const funnelTemplates = {
    puzzle: [
        { step: 'Tutorial Start', users: 10000, color: '#10b981' },
        { step: 'Tutorial Complete', users: 7800, color: '#059669' },
        { step: 'Level 5', users: 5200, color: '#047857' },
        { step: 'Level 10', users: 2800, color: '#065f46' },
        { step: 'First Purchase', users: 420, color: '#064e3b' },
    ],
    idle: [
        { step: 'First Open', users: 10000, color: '#14b8a6' },
        { step: 'First Upgrade', users: 8500, color: '#0d9488' },
        { step: 'First Prestige', users: 2100, color: '#0f766e' },
        { step: 'Second Prestige', users: 850, color: '#115e59' },
        { step: 'VIP Purchase', users: 180, color: '#134e4a' },
    ],
    battle_royale: [
        { step: 'First Match', users: 10000, color: '#ef4444' },
        { step: 'First Kill', users: 6500, color: '#dc2626' },
        { step: 'First Win', users: 1800, color: '#b91c1c' },
        { step: 'Ranked Mode', users: 950, color: '#991b1b' },
        { step: 'Battle Pass', users: 420, color: '#7f1d1d' },
    ],
    match3_meta: [
        { step: 'Tutorial', users: 10000, color: '#f59e0b' },
        { step: 'First Decoration', users: 7200, color: '#d97706' },
        { step: 'Chapter 5', users: 3800, color: '#b45309' },
        { step: 'Chapter 10', users: 1500, color: '#92400e' },
        { step: 'Premium Decor', users: 280, color: '#78350f' },
    ],
    gacha_rpg: [
        { step: 'First Login', users: 10000, color: '#10b981' },
        { step: 'First Pull', users: 8200, color: '#059669' },
        { step: 'SSR Obtained', users: 4100, color: '#047857' },
        { step: 'First Purchase', users: 1200, color: '#065f46' },
        { step: 'Whale ($100+)', users: 180, color: '#064e3b' },
    ],
    custom: [
        { step: 'Step 1', users: 10000, color: '#10b981' },
        { step: 'Step 2', users: 7500, color: '#059669' },
        { step: 'Step 3', users: 4500, color: '#047857' },
        { step: 'Step 4', users: 2000, color: '#065f46' },
        { step: 'Step 5', users: 500, color: '#064e3b' },
    ],
};

interface ManualFunnelStep {
    step: string;
    users: number;
    color: string;
}

// Funnel type colors - Emerald theme
const FUNNEL_TYPE_COLORS: Record<DetectedFunnel['type'], string[]> = {
    progression: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
    conversion: ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a'],
    onboarding: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
    custom: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
};

const FUNNEL_TYPE_LABELS: Record<DetectedFunnel['type'], string> = {
    progression: 'Progression',
    conversion: 'Conversion',
    onboarding: 'Onboarding',
    custom: 'Custom',
};

// Format numbers
function formatNumber(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
}

// Detected funnel card component
function DetectedFunnelCard({
    funnel,
    isExpanded,
    onToggle,
    index,
}: {
    funnel: DetectedFunnel;
    isExpanded: boolean;
    onToggle: () => void;
    index: number;
}) {
    const colors = FUNNEL_TYPE_COLORS[funnel.type];

    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: (params: { name: string; value: number }) => {
                const percent = funnel.steps[0]?.userCount > 0
                    ? ((params.value / funnel.steps[0].userCount) * 100).toFixed(1)
                    : '0';
                return `${params.name}<br/>Users: ${formatNumber(params.value)}<br/>Rate: ${percent}%`;
            }
        },
        series: [
            {
                type: 'funnel',
                left: '5%',
                top: 10,
                bottom: 10,
                width: '90%',
                min: 0,
                max: funnel.steps[0]?.userCount || 100,
                minSize: '10%',
                maxSize: '100%',
                sort: 'descending',
                gap: 2,
                label: {
                    show: true,
                    position: 'inside',
                    formatter: (params: { name: string; value: number }) => {
                        return `${params.name}\n${formatNumber(params.value)}`;
                    },
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 500,
                },
                labelLine: { show: false },
                itemStyle: { borderWidth: 0 },
                data: funnel.steps.map((s, idx) => ({
                    name: s.name,
                    value: s.userCount,
                    itemStyle: { color: colors[idx % colors.length] }
                }))
            }
        ]
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="elevated" padding="none" className="overflow-hidden">
                {/* Header */}
                <motion.div
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                    className="p-4 cursor-pointer transition-colors"
                    onClick={onToggle}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-lg" />
                                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center">
                                    <Filter className="w-5 h-5 text-emerald-400" />
                                </div>
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-white">{funnel.name}</h3>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                        {FUNNEL_TYPE_LABELS[funnel.type]}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        AI Detected
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {formatNumber(funnel.totalUsers)} users • {funnel.steps.length} steps
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-2xl font-bold text-white">{funnel.completionRate.toFixed(1)}%</p>
                                <p className="text-xs text-slate-500">Completion</p>
                            </div>
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <ChevronDown className="w-5 h-5 text-slate-500" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="overflow-hidden"
                        >
                            <div className="border-t border-white/[0.06]">
                                {/* Funnel Chart */}
                                <div className="p-4">
                                    <ReactECharts option={option} style={{ height: 280 }} />
                                </div>

                                {/* Step Details */}
                                <div className="px-4 pb-4">
                                    <h4 className="text-sm font-medium text-slate-400 mb-3">Step-by-Step Breakdown</h4>
                                    <div className="space-y-2">
                                        {funnel.steps.map((step, stepIndex) => {
                                            const isBottleneck = funnel.bottleneck?.step === step.name;
                                            return (
                                                <motion.div
                                                    key={step.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: stepIndex * 0.05 }}
                                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                                        isBottleneck
                                                            ? 'bg-amber-500/10 border border-amber-500/30'
                                                            : 'bg-white/[0.02]'
                                                    }`}
                                                >
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                                                        style={{ backgroundColor: colors[stepIndex % colors.length] }}
                                                    >
                                                        {stepIndex + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-white truncate">{step.name}</p>
                                                            {isBottleneck && (
                                                                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-500 flex items-center gap-1">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    Bottleneck
                                                                </span>
                                                            )}
                                                        </div>
                                                        {step.eventName && (
                                                            <p className="text-xs text-slate-500 truncate">Events: {step.eventName}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-white">{formatNumber(step.userCount)}</p>
                                                        <p className="text-xs text-slate-500">{step.percentage.toFixed(1)}%</p>
                                                    </div>
                                                    {stepIndex > 0 && (
                                                        <div className={`text-right min-w-[60px] ${step.dropOffRate > 30 ? 'text-rose-400' : 'text-slate-500'}`}>
                                                            <p className="text-sm font-medium">-{step.dropOffRate.toFixed(0)}%</p>
                                                            <p className="text-xs">drop</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bottleneck Recommendations */}
                                {funnel.bottleneck && (
                                    <div className="px-4 pb-4">
                                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Lightbulb className="w-5 h-5 text-amber-500" />
                                                <h4 className="font-medium text-white">Optimization Recommendations</h4>
                                            </div>
                                            <p className="text-sm text-slate-400 mb-3">
                                                <strong className="text-white">{funnel.bottleneck.step}</strong> has a {funnel.bottleneck.dropOffRate.toFixed(1)}% drop-off rate.
                                            </p>
                                            <ul className="space-y-1.5">
                                                {funnel.bottleneck.recommendations.map((rec, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                                                        <span className="text-amber-500 mt-0.5">•</span>
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}

// Manual funnel builder (fallback)
function ManualFunnelBuilder({
    steps,
    onStepsChange,
    gameType,
}: {
    steps: ManualFunnelStep[];
    onStepsChange: (steps: ManualFunnelStep[]) => void;
    gameType: string;
}) {
    const handleAddStep = () => {
        const lastStep = steps[steps.length - 1];
        onStepsChange([...steps, {
            step: `New Step ${steps.length + 1}`,
            users: Math.floor(lastStep.users * 0.5),
            color: '#10b981'
        }]);
    };

    const handleRemoveStep = (index: number) => {
        if (steps.length > 2) {
            onStepsChange(steps.filter((_, i) => i !== index));
        }
    };

    const handleReset = () => {
        onStepsChange(funnelTemplates[gameType as keyof typeof funnelTemplates] || funnelTemplates.puzzle);
    };

    return (
        <Card variant="default" padding="md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">Manual Funnel Builder</h3>
                <button
                    onClick={handleReset}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                    Reset to Template
                </button>
            </div>
            <div className="space-y-2">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3"
                    >
                        <span className="text-sm text-slate-500 w-6">{index + 1}</span>
                        <input
                            type="text"
                            value={step.step}
                            onChange={(e) => {
                                const newSteps = [...steps];
                                newSteps[index].step = e.target.value;
                                onStepsChange(newSteps);
                            }}
                            className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                        <input
                            type="number"
                            value={step.users}
                            onChange={(e) => {
                                const newSteps = [...steps];
                                newSteps[index].users = parseInt(e.target.value) || 0;
                                onStepsChange(newSteps);
                            }}
                            className="w-24 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                        <button
                            onClick={() => handleRemoveStep(index)}
                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                            disabled={steps.length <= 2}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </div>
            <button
                onClick={handleAddStep}
                className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Step
            </button>
        </Card>
    );
}

// Stats card
function StatsCard({
    title,
    value,
    icon: Icon,
    color,
    index,
}: {
    title: string;
    value: string;
    icon: typeof Users;
    color: 'emerald' | 'blue' | 'teal' | 'amber';
    index: number;
}) {
    const colorStyles = {
        emerald: {
            bg: 'from-emerald-500/20 to-emerald-500/5',
            border: 'border-emerald-500/20',
            icon: 'text-emerald-400',
            glow: 'bg-emerald-500/20',
        },
        blue: {
            bg: 'from-blue-500/20 to-blue-500/5',
            border: 'border-blue-500/20',
            icon: 'text-blue-400',
            glow: 'bg-blue-500/20',
        },
        teal: {
            bg: 'from-teal-500/20 to-teal-500/5',
            border: 'border-teal-500/20',
            icon: 'text-teal-400',
            glow: 'bg-teal-500/20',
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="default" padding="md" className="group hover:border-white/[0.12] transition-all">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`absolute inset-0 ${style.glow} rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${style.icon}`} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{value}</div>
                        <div className="text-sm text-slate-500">{title}</div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

export function FunnelsPage() {
    const { selectedGame } = useGame();
    const { result } = useAnalytics();
    const { hasRealData } = useGameData();

    // State for manual builder
    const [manualSteps, setManualSteps] = useState<ManualFunnelStep[]>(
        funnelTemplates[selectedGame] || funnelTemplates.puzzle
    );
    const [showManualBuilder, setShowManualBuilder] = useState(false);
    const [expandedFunnelId, setExpandedFunnelId] = useState<string | null>(null);

    // Get detected funnels from pipeline (real data) or use empty array
    const detectedFunnels = useMemo(() => {
        if (!hasRealData) return [];
        return result?.funnels || [];
    }, [result?.funnels, hasRealData]);
    const hasDetectedFunnels = detectedFunnels.length > 0;

    // Calculate overall stats
    const stats = useMemo(() => {
        if (hasDetectedFunnels) {
            const totalUsers = detectedFunnels.reduce((sum, f) => sum + f.totalUsers, 0);
            const avgCompletion = detectedFunnels.reduce((sum, f) => sum + f.completionRate, 0) / detectedFunnels.length;
            const bottlenecks = detectedFunnels.filter(f => f.bottleneck).length;

            return {
                totalFunnels: detectedFunnels.length,
                totalUsers,
                avgCompletion,
                bottlenecks,
            };
        }

        // Fallback to manual funnel stats
        const conversionRate = manualSteps.length > 0
            ? (manualSteps[manualSteps.length - 1].users / manualSteps[0].users) * 100
            : 0;

        return {
            totalFunnels: 1,
            totalUsers: manualSteps[0]?.users || 0,
            avgCompletion: conversionRate,
            bottlenecks: 0,
        };
    }, [detectedFunnels, hasDetectedFunnels, manualSteps]);

    // Manual funnel visualization option
    const manualFunnelOption = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: (params: { name: string; value: number }) => {
                const percent = ((params.value / manualSteps[0].users) * 100).toFixed(1);
                return `${params.name}<br/>Users: ${params.value.toLocaleString()}<br/>Rate: ${percent}%`;
            }
        },
        series: [
            {
                type: 'funnel',
                left: '10%',
                top: 20,
                bottom: 20,
                width: '80%',
                min: 0,
                max: manualSteps[0]?.users || 10000,
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                gap: 4,
                label: {
                    show: true,
                    position: 'inside',
                    formatter: (params: { name: string; value: number }) => {
                        const percent = ((params.value / manualSteps[0].users) * 100).toFixed(0);
                        return `${params.name}\n${params.value.toLocaleString()} (${percent}%)`;
                    },
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                },
                labelLine: { show: false },
                itemStyle: { borderWidth: 0 },
                data: manualSteps.map(s => ({
                    name: s.step,
                    value: s.users,
                    itemStyle: { color: s.color }
                }))
            }
        ]
    };

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
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 rounded-xl blur-lg" />
                                <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                                    <Filter className="w-6 h-6 text-emerald-400" />
                                </div>
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                        Funnels
                                    </h1>
                                    <DataModeIndicator />
                                </div>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    {hasDetectedFunnels
                                        ? `${detectedFunnels.length} AI-detected funnel${detectedFunnels.length > 1 ? 's' : ''} from your data`
                                        : 'Build and analyze conversion funnels'}
                                </p>
                            </div>
                        </div>
                        {hasDetectedFunnels && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowManualBuilder(!showManualBuilder)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.06] hover:border-white/[0.12] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                {showManualBuilder ? 'Hide Builder' : 'Custom Funnel'}
                            </motion.button>
                        )}
                    </div>
                </Card>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Funnels"
                    value={stats.totalFunnels.toString()}
                    icon={Filter}
                    color="emerald"
                    index={0}
                />
                <StatsCard
                    title="Total Users"
                    value={formatNumber(stats.totalUsers)}
                    icon={Users}
                    color="blue"
                    index={1}
                />
                <StatsCard
                    title="Avg Completion"
                    value={`${stats.avgCompletion.toFixed(1)}%`}
                    icon={Target}
                    color="teal"
                    index={2}
                />
                <StatsCard
                    title="Bottlenecks Found"
                    value={stats.bottlenecks.toString()}
                    icon={AlertTriangle}
                    color="amber"
                    index={3}
                />
            </div>

            {/* AI-Detected Funnels */}
            {hasDetectedFunnels && (
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-semibold text-white">AI-Detected Funnels</h2>
                    </div>
                    <div className="space-y-4">
                        {detectedFunnels.map((funnel, index) => (
                            <DetectedFunnelCard
                                key={funnel.id}
                                funnel={funnel}
                                isExpanded={expandedFunnelId === funnel.id}
                                onToggle={() => setExpandedFunnelId(
                                    expandedFunnelId === funnel.id ? null : funnel.id
                                )}
                                index={index}
                            />
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Manual Builder (shown when no detected funnels OR user clicks to show it) */}
            {(!hasDetectedFunnels || showManualBuilder) && (
                <motion.div variants={itemVariants} className="space-y-4">
                    {hasDetectedFunnels && (
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-white">Custom Funnel</h2>
                        </div>
                    )}

                    <ManualFunnelBuilder
                        steps={manualSteps}
                        onStepsChange={setManualSteps}
                        gameType={selectedGame}
                    />

                    {/* Manual Funnel Visualization */}
                    <Card variant="default" padding="md">
                        <ReactECharts option={manualFunnelOption} style={{ height: 400 }} />
                    </Card>

                    {/* Drop-off Analysis for manual funnel */}
                    <Card variant="default" padding="md">
                        <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-rose-400" />
                            Drop-off Analysis
                        </h3>
                        <div className="space-y-3">
                            {manualSteps.slice(0, -1).map((step, index) => {
                                const nextStep = manualSteps[index + 1];
                                const dropOff = step.users - nextStep.users;
                                const dropOffPercent = (dropOff / step.users) * 100;

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-slate-400">
                                                    {step.step} → {nextStep.step}
                                                </span>
                                                <span className="text-sm font-medium text-rose-400">
                                                    -{dropOff.toLocaleString()} ({dropOffPercent.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${dropOffPercent}%` }}
                                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                                    className="h-full bg-rose-400/60 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* No Data State */}
            {!hasDetectedFunnels && !showManualBuilder && (
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg" className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="relative inline-block mb-4"
                        >
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-xl" />
                            <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto">
                                <Filter className="w-6 h-6 text-emerald-400" />
                            </div>
                        </motion.div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Funnels Detected</h3>
                        <p className="text-slate-500 mb-4">
                            Upload data with user progression or event data to auto-detect funnels,
                            or use the manual builder below.
                        </p>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}

export default FunnelsPage;
