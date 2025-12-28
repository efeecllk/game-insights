/**
 * Funnels Page - Conversion Funnel Analysis
 * Interactive funnel builder and visualization
 */

import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Filter, Plus, Trash2, ArrowRight, TrendingDown, Users } from 'lucide-react';
import { useGame } from '../context/GameContext';

// Sample funnel templates by game type
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

interface FunnelStep {
    step: string;
    users: number;
    color: string;
}

export function FunnelsPage() {
    const { selectedGame } = useGame();
    const [steps, setSteps] = useState<FunnelStep[]>(funnelTemplates[selectedGame] || funnelTemplates.puzzle);
    const [showBuilder, setShowBuilder] = useState(false);

    const handleAddStep = () => {
        const lastStep = steps[steps.length - 1];
        setSteps([...steps, {
            step: `New Step ${steps.length + 1}`,
            users: Math.floor(lastStep.users * 0.5),
            color: '#6366f1'
        }]);
    };

    const handleRemoveStep = (index: number) => {
        if (steps.length > 2) {
            setSteps(steps.filter((_, i) => i !== index));
        }
    };

    const handleResetToTemplate = () => {
        setSteps(funnelTemplates[selectedGame] || funnelTemplates.puzzle);
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
                    <p className="text-th-text-muted mt-1">Conversion funnel analysis</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleResetToTemplate}
                        className="px-4 py-2 text-sm font-medium text-th-text-secondary bg-th-bg-elevated rounded-lg hover:bg-th-interactive-hover"
                    >
                        Reset to Default
                    </button>
                    <button
                        onClick={() => setShowBuilder(!showBuilder)}
                        className="px-4 py-2 text-sm font-medium text-white bg-th-accent-primary rounded-lg hover:bg-th-accent-primary-hover flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Edit Funnel
                    </button>
                </div>
            </div>

            {/* Funnel Builder */}
            {showBuilder && (
                <div className="bg-th-bg-surface rounded-card border border-th-border p-4">
                    <h3 className="font-medium text-th-text-primary mb-4">Funnel Steps</h3>
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
                                        setSteps(newSteps);
                                    }}
                                    className="flex-1 px-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <input
                                    type="number"
                                    value={step.users}
                                    onChange={(e) => {
                                        const newSteps = [...steps];
                                        newSteps[index].users = parseInt(e.target.value) || 0;
                                        setSteps(newSteps);
                                    }}
                                    className="w-24 px-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
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
            )}

            {/* Funnel Visualization */}
            <div className="bg-th-bg-surface rounded-card border border-th-border p-6">
                <FunnelVisualization steps={steps} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Users"
                    value={steps[0]?.users.toLocaleString() || '0'}
                    icon={Users}
                    color="text-blue-600"
                />
                <StatsCard
                    title="Conversion Rate"
                    value={`${((steps[steps.length - 1]?.users / steps[0]?.users) * 100).toFixed(1)}%`}
                    icon={TrendingDown}
                    color="text-green-600"
                />
                <StatsCard
                    title="Biggest Drop"
                    value={getBiggestDrop(steps)}
                    icon={ArrowRight}
                    color="text-th-error"
                />
                <StatsCard
                    title="Steps"
                    value={steps.length.toString()}
                    icon={Filter}
                    color="text-th-accent-primary"
                />
            </div>

            {/* Drop-off Analysis */}
            <div className="bg-th-bg-surface rounded-card border border-th-border p-6">
                <h3 className="font-medium text-th-text-primary mb-4">Drop-off Analysis</h3>
                <div className="space-y-3">
                    {steps.slice(0, -1).map((step, index) => {
                        const nextStep = steps[index + 1];
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
    );
}

function FunnelVisualization({ steps }: { steps: FunnelStep[] }) {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: { name: string; value: number }) => {
                const percent = ((params.value / steps[0].users) * 100).toFixed(1);
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
                max: steps[0]?.users || 10000,
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                gap: 4,
                label: {
                    show: true,
                    position: 'inside',
                    formatter: (params: { name: string; value: number }) => {
                        const percent = ((params.value / steps[0].users) * 100).toFixed(0);
                        return `${params.name}\n${params.value.toLocaleString()} (${percent}%)`;
                    },
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                },
                labelLine: { show: false },
                itemStyle: { borderWidth: 0 },
                emphasis: {
                    label: { fontSize: 14 }
                },
                data: steps.map(s => ({
                    name: s.step,
                    value: s.users,
                    itemStyle: { color: s.color }
                }))
            }
        ]
    };

    return <ReactECharts option={option} style={{ height: 400 }} />;
}

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

function getBiggestDrop(steps: FunnelStep[]): string {
    let maxDrop = 0;
    let maxDropStep = '';

    for (let i = 0; i < steps.length - 1; i++) {
        const drop = steps[i].users - steps[i + 1].users;
        if (drop > maxDrop) {
            maxDrop = drop;
            maxDropStep = `${steps[i].step} → ${steps[i + 1].step}`;
        }
    }

    return maxDropStep.length > 20 ? maxDropStep.slice(0, 20) + '...' : maxDropStep;
}

export default FunnelsPage;
