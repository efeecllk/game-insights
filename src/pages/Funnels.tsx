/**
 * Funnels Page - Conversion Funnel Analysis
 * Displays AI-detected funnels from uploaded data with manual builder fallback
 */

import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    Filter,
    Plus,
    Trash2,
    Users,
    Sparkles,
    AlertTriangle,
    Lightbulb,
    ChevronDown,
    ChevronRight,
    Target,
    BarChart3,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { DetectedFunnel } from '../ai/FunnelDetector';

// Sample funnel templates by game type (fallback when no data)
const funnelTemplates = {
    puzzle: [
        { step: 'Tutorial Start', users: 10000, color: '#8b5cf6' },
        { step: 'Tutorial Complete', users: 7800, color: '#7c3aed' },
        { step: 'Level 5', users: 5200, color: '#6d28d9' },
        { step: 'Level 10', users: 2800, color: '#5b21b6' },
        { step: 'First Purchase', users: 420, color: '#4c1d95' },
    ],
    idle: [
        { step: 'First Open', users: 10000, color: '#06b6d4' },
        { step: 'First Upgrade', users: 8500, color: '#0891b2' },
        { step: 'First Prestige', users: 2100, color: '#0e7490' },
        { step: 'Second Prestige', users: 850, color: '#155e75' },
        { step: 'VIP Purchase', users: 180, color: '#164e63' },
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
        { step: 'Step 1', users: 10000, color: '#6366f1' },
        { step: 'Step 2', users: 7500, color: '#4f46e5' },
        { step: 'Step 3', users: 4500, color: '#4338ca' },
        { step: 'Step 4', users: 2000, color: '#3730a3' },
        { step: 'Step 5', users: 500, color: '#312e81' },
    ],
};

interface ManualFunnelStep {
    step: string;
    users: number;
    color: string;
}

// Funnel type colors
const FUNNEL_TYPE_COLORS: Record<DetectedFunnel['type'], string[]> = {
    progression: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
    conversion: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
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
}: {
    funnel: DetectedFunnel;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const colors = FUNNEL_TYPE_COLORS[funnel.type];

    const option = {
        tooltip: {
            trigger: 'item',
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
        <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
            {/* Header */}
            <div
                className="p-4 cursor-pointer hover:bg-th-interactive-hover transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Filter className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-th-text-primary">{funnel.name}</h3>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-th-accent-primary/10 text-th-accent-primary">
                                    {FUNNEL_TYPE_LABELS[funnel.type]}
                                </span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    AI Detected
                                </span>
                            </div>
                            <p className="text-sm text-th-text-muted mt-0.5">
                                {formatNumber(funnel.totalUsers)} users • {funnel.steps.length} steps
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-th-text-primary">{funnel.completionRate.toFixed(1)}%</p>
                            <p className="text-xs text-th-text-muted">Completion</p>
                        </div>
                        {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-th-text-muted" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-th-text-muted" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-th-border">
                    {/* Funnel Chart */}
                    <div className="p-4">
                        <ReactECharts option={option} style={{ height: 280 }} />
                    </div>

                    {/* Step Details */}
                    <div className="px-4 pb-4">
                        <h4 className="text-sm font-medium text-th-text-secondary mb-3">Step-by-Step Breakdown</h4>
                        <div className="space-y-2">
                            {funnel.steps.map((step, index) => {
                                const isBottleneck = funnel.bottleneck?.step === step.name;
                                return (
                                    <div
                                        key={step.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${
                                            isBottleneck ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-th-bg-elevated/50'
                                        }`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                                            style={{ backgroundColor: colors[index % colors.length] }}
                                        >
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-th-text-primary truncate">{step.name}</p>
                                                {isBottleneck && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-500 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Bottleneck
                                                    </span>
                                                )}
                                            </div>
                                            {step.eventName && (
                                                <p className="text-xs text-th-text-muted truncate">Events: {step.eventName}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-th-text-primary">{formatNumber(step.userCount)}</p>
                                            <p className="text-xs text-th-text-muted">{step.percentage.toFixed(1)}%</p>
                                        </div>
                                        {index > 0 && (
                                            <div className={`text-right min-w-[60px] ${step.dropOffRate > 30 ? 'text-red-500' : 'text-th-text-muted'}`}>
                                                <p className="text-sm font-medium">-{step.dropOffRate.toFixed(0)}%</p>
                                                <p className="text-xs">drop</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottleneck Recommendations */}
                    {funnel.bottleneck && (
                        <div className="px-4 pb-4">
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                    <h4 className="font-medium text-th-text-primary">Optimization Recommendations</h4>
                                </div>
                                <p className="text-sm text-th-text-secondary mb-3">
                                    <strong>{funnel.bottleneck.step}</strong> has a {funnel.bottleneck.dropOffRate.toFixed(1)}% drop-off rate.
                                </p>
                                <ul className="space-y-1.5">
                                    {funnel.bottleneck.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-th-text-muted">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
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
            color: '#6366f1'
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
        <div className="bg-th-bg-surface rounded-card border border-th-border p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-th-text-primary">Manual Funnel Builder</h3>
                <button
                    onClick={handleReset}
                    className="text-sm text-th-text-muted hover:text-th-text-secondary"
                >
                    Reset to Template
                </button>
            </div>
            <div className="space-y-2">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <span className="text-sm text-th-text-muted w-6">{index + 1}</span>
                        <input
                            type="text"
                            value={step.step}
                            onChange={(e) => {
                                const newSteps = [...steps];
                                newSteps[index].step = e.target.value;
                                onStepsChange(newSteps);
                            }}
                            className="flex-1 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <input
                            type="number"
                            value={step.users}
                            onChange={(e) => {
                                const newSteps = [...steps];
                                newSteps[index].users = parseInt(e.target.value) || 0;
                                onStepsChange(newSteps);
                            }}
                            className="w-24 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <button
                            onClick={() => handleRemoveStep(index)}
                            className="p-2 text-th-text-muted hover:text-th-error"
                            disabled={steps.length <= 2}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={handleAddStep}
                className="mt-3 text-sm text-th-accent-primary hover:text-th-accent-primary-hover flex items-center gap-1"
            >
                <Plus className="w-4 h-4" /> Add Step
            </button>
        </div>
    );
}

// Stats card
function StatsCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: typeof Users; color: string }) {
    return (
        <div className="bg-th-bg-surface rounded-card border border-th-border p-4">
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-th-text-muted">{title}</span>
            </div>
            <div className="text-2xl font-bold text-th-text-primary">{value}</div>
        </div>
    );
}

export function FunnelsPage() {
    const { selectedGame } = useGame();
    const { result } = useAnalytics();

    // State for manual builder
    const [manualSteps, setManualSteps] = useState<ManualFunnelStep[]>(
        funnelTemplates[selectedGame] || funnelTemplates.puzzle
    );
    const [showManualBuilder, setShowManualBuilder] = useState(false);
    const [expandedFunnelId, setExpandedFunnelId] = useState<string | null>(null);

    // Get detected funnels from pipeline
    const detectedFunnels = result?.funnels || [];
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-th-text-primary flex items-center gap-2">
                        <Filter className="w-6 h-6 text-th-accent-primary" />
                        Funnels
                    </h1>
                    <p className="text-th-text-muted mt-1">
                        {hasDetectedFunnels
                            ? `${detectedFunnels.length} AI-detected funnel${detectedFunnels.length > 1 ? 's' : ''} from your data`
                            : 'Build and analyze conversion funnels'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {hasDetectedFunnels && (
                        <button
                            onClick={() => setShowManualBuilder(!showManualBuilder)}
                            className="px-4 py-2 text-sm font-medium text-th-text-secondary bg-th-bg-elevated rounded-lg hover:bg-th-interactive-hover flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {showManualBuilder ? 'Hide Builder' : 'Custom Funnel'}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Funnels"
                    value={stats.totalFunnels.toString()}
                    icon={Filter}
                    color="text-th-accent-primary"
                />
                <StatsCard
                    title="Total Users"
                    value={formatNumber(stats.totalUsers)}
                    icon={Users}
                    color="text-blue-500"
                />
                <StatsCard
                    title="Avg Completion"
                    value={`${stats.avgCompletion.toFixed(1)}%`}
                    icon={Target}
                    color="text-green-500"
                />
                <StatsCard
                    title="Bottlenecks Found"
                    value={stats.bottlenecks.toString()}
                    icon={AlertTriangle}
                    color="text-amber-500"
                />
            </div>

            {/* AI-Detected Funnels */}
            {hasDetectedFunnels && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-th-accent-primary" />
                        <h2 className="text-lg font-semibold text-th-text-primary">AI-Detected Funnels</h2>
                    </div>
                    <div className="space-y-4">
                        {detectedFunnels.map(funnel => (
                            <DetectedFunnelCard
                                key={funnel.id}
                                funnel={funnel}
                                isExpanded={expandedFunnelId === funnel.id}
                                onToggle={() => setExpandedFunnelId(
                                    expandedFunnelId === funnel.id ? null : funnel.id
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Manual Builder (shown when no detected funnels OR user clicks to show it) */}
            {(!hasDetectedFunnels || showManualBuilder) && (
                <div className="space-y-4">
                    {hasDetectedFunnels && (
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-th-text-muted" />
                            <h2 className="text-lg font-semibold text-th-text-primary">Custom Funnel</h2>
                        </div>
                    )}

                    <ManualFunnelBuilder
                        steps={manualSteps}
                        onStepsChange={setManualSteps}
                        gameType={selectedGame}
                    />

                    {/* Manual Funnel Visualization */}
                    <div className="bg-th-bg-surface rounded-card border border-th-border p-6">
                        <ReactECharts option={manualFunnelOption} style={{ height: 400 }} />
                    </div>

                    {/* Drop-off Analysis for manual funnel */}
                    <div className="bg-th-bg-surface rounded-card border border-th-border p-6">
                        <h3 className="font-medium text-th-text-primary mb-4">Drop-off Analysis</h3>
                        <div className="space-y-3">
                            {manualSteps.slice(0, -1).map((step, index) => {
                                const nextStep = manualSteps[index + 1];
                                const dropOff = step.users - nextStep.users;
                                const dropOffPercent = (dropOff / step.users) * 100;

                                return (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-th-text-secondary">
                                                    {step.step} → {nextStep.step}
                                                </span>
                                                <span className="text-sm font-medium text-th-error">
                                                    -{dropOff.toLocaleString()} ({dropOffPercent.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-th-bg-elevated rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-400 rounded-full"
                                                    style={{ width: `${dropOffPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* No Data State */}
            {!hasDetectedFunnels && !showManualBuilder && (
                <div className="bg-th-bg-surface rounded-card border border-th-border p-8 text-center">
                    <div className="w-12 h-12 bg-th-accent-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-6 h-6 text-th-accent-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-th-text-primary mb-2">No Funnels Detected</h3>
                    <p className="text-th-text-muted mb-4">
                        Upload data with user progression or event data to auto-detect funnels,
                        or use the manual builder below.
                    </p>
                </div>
            )}
        </div>
    );
}

export default FunnelsPage;
