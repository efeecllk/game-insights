/**
 * What-If Simulator Component - Obsidian Analytics Design
 *
 * Interactive scenario simulation with:
 * - Parameter sliders with real-time feedback
 * - Revenue projection charts
 * - Impact comparison cards
 */

import { useState, useMemo, useCallback } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Save,
    RotateCcw,
    DollarSign,
    Users,
    Percent,
    Calendar,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
    createWhatIfEngine,
    type BaselineMetrics,
    type ScenarioModification,
    type ScenarioResult,
    type ScenarioInput,
} from '../../ai/WhatIfEngine';

// ============================================================================
// Types
// ============================================================================

interface WhatIfSimulatorProps {
    baselineMetrics?: BaselineMetrics;
    onSave?: (scenario: { name: string; input: ScenarioInput; result: ScenarioResult }) => void;
    className?: string;
}

interface SliderConfig {
    key: keyof ScenarioModification;
    label: string;
    icon: React.ElementType;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
}

// ============================================================================
// Default Baseline
// ============================================================================

const DEFAULT_BASELINE: BaselineMetrics = {
    dau: 10000,
    mau: 50000,
    retention: { d1: 0.40, d7: 0.20, d30: 0.10 },
    arpu: 0.50,
    arppu: 15.00,
    conversionRate: 0.03,
    avgRevenuePerPurchase: 4.99,
    avgSessionLength: 12,
    sessionsPerDau: 2.5,
};

// ============================================================================
// Slider Configuration
// ============================================================================

const SLIDERS: SliderConfig[] = [
    {
        key: 'retentionChange',
        label: 'Retention',
        icon: Users,
        min: -0.5,
        max: 0.5,
        step: 0.01,
        format: (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
    },
    {
        key: 'conversionChange',
        label: 'Conversion',
        icon: Percent,
        min: -0.5,
        max: 1.0,
        step: 0.01,
        format: (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
    },
    {
        key: 'arpuChange',
        label: 'ARPU',
        icon: DollarSign,
        min: -0.5,
        max: 1.0,
        step: 0.01,
        format: (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
    },
    {
        key: 'dauChange',
        label: 'New Users',
        icon: TrendingUp,
        min: -0.5,
        max: 1.0,
        step: 0.01,
        format: (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
    },
];

// ============================================================================
// Component
// ============================================================================

export function WhatIfSimulator({
    baselineMetrics = DEFAULT_BASELINE,
    onSave,
    className = '',
}: WhatIfSimulatorProps) {
    // State
    const [modifications, setModifications] = useState<ScenarioModification>({});
    const [timeHorizon, setTimeHorizon] = useState(30);
    const [dailyNewUsers] = useState(1000);
    const [scenarioName, setScenarioName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Engine
    const engine = useMemo(() => createWhatIfEngine(), []);

    // Results
    const { baselineResult, modifiedResult } = useMemo(() => {
        const baselineInput: ScenarioInput = {
            name: 'Baseline',
            baselineMetrics,
            modifications: {},
            timeHorizon,
            dailyNewUsers,
        };

        const modifiedInput: ScenarioInput = {
            name: 'Modified',
            baselineMetrics,
            modifications,
            timeHorizon,
            dailyNewUsers,
        };

        return {
            baselineResult: engine.simulateScenario(baselineInput),
            modifiedResult: engine.simulateScenario(modifiedInput),
        };
    }, [engine, baselineMetrics, modifications, timeHorizon, dailyNewUsers]);

    // Chart options
    const chartOption: EChartsOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#252532',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
        },
        legend: {
            data: ['Baseline', 'Modified'],
            top: 0,
            textStyle: { color: '#a1a1aa' },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: baselineResult.projections.map(p => `Day ${p.day}`),
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
            axisLabel: { color: '#71717a' },
        },
        yAxis: [
            {
                type: 'value',
                name: 'Revenue',
                axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
                axisLabel: { color: '#71717a', formatter: '${value}' },
                splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
            },
        ],
        series: [
            {
                name: 'Baseline',
                type: 'line',
                data: baselineResult.projections.map(p => p.revenue),
                smooth: true,
                lineStyle: { color: '#71717a', width: 2 },
                areaStyle: { color: 'rgba(113, 113, 122, 0.1)' },
            },
            {
                name: 'Modified',
                type: 'line',
                data: modifiedResult.projections.map(p => p.revenue),
                smooth: true,
                lineStyle: { color: '#DA7756', width: 2 },
                areaStyle: { color: 'rgba(218, 119, 86, 0.1)' },
            },
        ],
    }), [baselineResult, modifiedResult]);

    // Handlers
    const handleSliderChange = useCallback((key: keyof ScenarioModification, value: number) => {
        setModifications(prev => ({
            ...prev,
            [key]: value === 0 ? undefined : value,
        }));
    }, []);

    const handleReset = useCallback(() => {
        setModifications({});
    }, []);

    const handleSave = useCallback(() => {
        if (!onSave || !scenarioName.trim()) return;

        const input: ScenarioInput = {
            name: scenarioName,
            baselineMetrics,
            modifications,
            timeHorizon,
            dailyNewUsers,
        };

        onSave({ name: scenarioName, input, result: modifiedResult });
        setShowSaveDialog(false);
        setScenarioName('');
    }, [onSave, scenarioName, baselineMetrics, modifications, timeHorizon, dailyNewUsers, modifiedResult]);

    // Impact indicator
    const impact = modifiedResult.impact;
    const impactType = impact.revenueChangePercent > 5 ? 'positive' :
                       impact.revenueChangePercent < -5 ? 'negative' : 'neutral';

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">What-If Simulator</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Adjust metrics to see projected impact
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    {onSave && (
                        <button
                            onClick={() => setShowSaveDialog(true)}
                            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-accent-primary/90 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save Scenario
                        </button>
                    )}
                </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-4">
                {SLIDERS.map((slider) => {
                    const value = modifications[slider.key] ?? 0;
                    const Icon = slider.icon;

                    return (
                        <div key={slider.key} className="bg-bg-card rounded-xl p-4 border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-zinc-400" />
                                    <span className="text-sm font-medium text-white">{slider.label}</span>
                                </div>
                                <span className={`text-sm font-mono ${
                                    value > 0 ? 'text-[#7A8B5B]' :
                                    value < 0 ? 'text-red-400' : 'text-zinc-400'
                                }`}>
                                    {slider.format(value)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={slider.min}
                                max={slider.max}
                                step={slider.step}
                                value={value}
                                onChange={(e) => handleSliderChange(slider.key, parseFloat(e.target.value))}
                                className="w-full accent-accent-primary"
                            />
                        </div>
                    );
                })}
            </div>

            {/* Time Horizon */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Projection:</span>
                </div>
                {[30, 60, 90].map((days) => (
                    <button
                        key={days}
                        onClick={() => setTimeHorizon(days)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                            timeHorizon === days
                                ? 'bg-accent-primary text-white'
                                : 'bg-bg-elevated text-zinc-400 hover:text-white'
                        }`}
                    >
                        {days} days
                    </button>
                ))}
            </div>

            {/* Impact Summary */}
            <div className="grid grid-cols-4 gap-4">
                <ImpactCard
                    label="Revenue Impact"
                    value={`$${Math.abs(impact.revenueChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    change={impact.revenueChangePercent}
                    type={impactType}
                />
                <ImpactCard
                    label="Avg DAU Impact"
                    value={Math.abs(impact.dauChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    change={impact.dauChangePercent}
                    type={impact.dauChangePercent > 0 ? 'positive' : impact.dauChangePercent < 0 ? 'negative' : 'neutral'}
                />
                <ImpactCard
                    label="LTV Impact"
                    value={`$${Math.abs(impact.ltvChange).toFixed(2)}`}
                    change={impact.ltvChangePercent}
                    type={impact.ltvChangePercent > 0 ? 'positive' : impact.ltvChangePercent < 0 ? 'negative' : 'neutral'}
                />
                <ImpactCard
                    label="Confidence"
                    value={`${(modifiedResult.confidence.level * 100).toFixed(0)}%`}
                    subtext={`$${modifiedResult.confidence.low.toLocaleString(undefined, { maximumFractionDigits: 0 })} - $${modifiedResult.confidence.high.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                />
            </div>

            {/* Chart */}
            <div className="bg-bg-card rounded-xl p-4 border border-white/[0.06]">
                <h3 className="text-sm font-medium text-white mb-4">Revenue Projection</h3>
                <ReactECharts option={chartOption} style={{ height: 300 }} />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
                <SummaryCard title="Baseline" result={baselineResult} variant="muted" />
                <SummaryCard title="Modified Scenario" result={modifiedResult} variant="accent" />
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-bg-card rounded-xl p-6 w-96 border border-white/[0.1]">
                        <h3 className="text-lg font-semibold text-white mb-4">Save Scenario</h3>
                        <input
                            type="text"
                            value={scenarioName}
                            onChange={(e) => setScenarioName(e.target.value)}
                            placeholder="Scenario name"
                            className="w-full px-4 py-3 bg-bg-elevated border border-white/[0.1] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary"
                            autoFocus
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="flex-1 px-4 py-2 bg-bg-elevated text-zinc-300 rounded-lg hover:bg-bg-elevated/80"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!scenarioName.trim()}
                                className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg disabled:opacity-50 hover:bg-accent-primary/90"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ImpactCardProps {
    label: string;
    value: string;
    change?: number;
    type?: 'positive' | 'negative' | 'neutral';
    subtext?: string;
}

function ImpactCard({ label, value, change, type = 'neutral', subtext }: ImpactCardProps) {
    const Icon = type === 'positive' ? TrendingUp : type === 'negative' ? TrendingDown : Minus;
    const colorClass = type === 'positive' ? 'text-[#7A8B5B]' :
                       type === 'negative' ? 'text-red-400' : 'text-zinc-400';

    return (
        <div className="bg-bg-card rounded-xl p-4 border border-white/[0.06]">
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className="flex items-center gap-2">
                <span className={`text-xl font-semibold ${colorClass}`}>{value}</span>
                {change !== undefined && (
                    <div className={`flex items-center text-sm ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                        <span>{Math.abs(change).toFixed(1)}%</span>
                    </div>
                )}
            </div>
            {subtext && <div className="text-xs text-zinc-500 mt-1">{subtext}</div>}
        </div>
    );
}

interface SummaryCardProps {
    title: string;
    result: ScenarioResult;
    variant: 'muted' | 'accent';
}

function SummaryCard({ title, result, variant }: SummaryCardProps) {
    const borderClass = variant === 'accent' ? 'border-accent-primary/30' : 'border-white/[0.06]';

    return (
        <div className={`bg-bg-card rounded-xl p-4 border ${borderClass}`}>
            <h4 className="text-sm font-medium text-white mb-3">{title}</h4>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <div className="text-xs text-zinc-500">Total Revenue</div>
                    <div className="text-lg font-semibold text-white">
                        ${result.summary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-zinc-500">Avg DAU</div>
                    <div className="text-lg font-semibold text-white">
                        {result.summary.avgDau.toLocaleString()}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-zinc-500">Projected LTV</div>
                    <div className="text-lg font-semibold text-white">
                        ${result.summary.projectedLtv.toFixed(2)}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-zinc-500">Peak Revenue</div>
                    <div className="text-lg font-semibold text-white">
                        ${result.summary.peakRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WhatIfSimulator;
