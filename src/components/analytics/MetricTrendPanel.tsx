/**
 * MetricTrendPanel Component
 * Displays metric trends with drill-down capability and time series charts
 */

import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Target,
    Activity,
    ChevronDown,
    ChevronRight,
    BarChart3,
    LineChart,
    Calendar,
    Layers,
    Percent,
    Zap,
} from 'lucide-react';
import { CalculatedMetrics } from '../../ai/MetricCalculator';

interface MetricTrendPanelProps {
    metrics?: CalculatedMetrics;
    className?: string;
}

type MetricCategory = 'retention' | 'engagement' | 'monetization' | 'progression' | 'all';

interface MetricItem {
    key: string;
    label: string;
    value: number;
    format: 'number' | 'currency' | 'percent';
    category: MetricCategory;
    icon: React.ElementType;
    color: string;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    benchmark?: number;
}

// Category colors
const CATEGORY_COLORS: Record<MetricCategory, { bg: string; text: string; chart: string }> = {
    retention: { bg: 'bg-green-500/10', text: 'text-green-500', chart: '#22c55e' },
    engagement: { bg: 'bg-blue-500/10', text: 'text-blue-500', chart: '#3b82f6' },
    monetization: { bg: 'bg-amber-500/10', text: 'text-amber-500', chart: '#f59e0b' },
    progression: { bg: 'bg-violet-500/10', text: 'text-violet-500', chart: '#8b5cf6' },
    all: { bg: 'bg-gray-500/10', text: 'text-gray-500', chart: '#6b7280' },
};

const CATEGORY_LABELS: Record<MetricCategory, string> = {
    retention: 'Retention',
    engagement: 'Engagement',
    monetization: 'Monetization',
    progression: 'Progression',
    all: 'All Metrics',
};

// Format functions
function formatValue(value: number, format: 'number' | 'currency' | 'percent'): string {
    switch (format) {
        case 'currency':
            if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
            if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
            return `$${value.toFixed(2)}`;
        case 'percent':
            return `${value.toFixed(1)}%`;
        case 'number':
        default:
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
            return value.toFixed(value % 1 === 0 ? 0 : 1);
    }
}

// Industry benchmarks for context
const BENCHMARKS: Record<string, { good: number; great: number }> = {
    'd1_retention': { good: 35, great: 45 },
    'd7_retention': { good: 15, great: 25 },
    'd30_retention': { good: 5, great: 10 },
    'conversion_rate': { good: 2, great: 5 },
    'dau_mau_ratio': { good: 20, great: 30 },
    'arpu': { good: 0.5, great: 2 },
};

function getBenchmarkStatus(key: string, value: number): 'great' | 'good' | 'needs_work' | null {
    const benchmark = BENCHMARKS[key];
    if (!benchmark) return null;
    if (value >= benchmark.great) return 'great';
    if (value >= benchmark.good) return 'good';
    return 'needs_work';
}

// Metric card component
function MetricCard({
    metric,
    isExpanded,
    onToggle,
    chartData,
}: {
    metric: MetricItem;
    isExpanded: boolean;
    onToggle: () => void;
    chartData?: { labels: string[]; values: number[] };
}) {
    const categoryColor = CATEGORY_COLORS[metric.category];
    const Icon = metric.icon;
    const benchmarkStatus = getBenchmarkStatus(metric.key, metric.value);

    const chartOption = chartData ? {
        grid: { top: 10, right: 10, bottom: 20, left: 40 },
        xAxis: {
            type: 'category',
            data: chartData.labels,
            axisLine: { lineStyle: { color: '#374151' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        series: [{
            type: 'line',
            data: chartData.values,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: categoryColor.chart, width: 2 },
            itemStyle: { color: categoryColor.chart },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: `${categoryColor.chart}40` },
                        { offset: 1, color: `${categoryColor.chart}05` },
                    ],
                },
            },
        }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            textStyle: { color: '#f3f4f6' },
            formatter: (params: { name: string; value: number }[]) => {
                const p = params[0];
                return `${p.name}<br/>${metric.label}: ${formatValue(p.value, metric.format)}`;
            },
        },
    } : null;

    return (
        <div className={`bg-th-bg-surface rounded-xl border border-th-border overflow-hidden ${
            isExpanded ? 'ring-1 ring-th-accent-primary/30' : ''
        }`}>
            {/* Header */}
            <div
                className="p-4 cursor-pointer hover:bg-th-interactive-hover transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${categoryColor.bg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${categoryColor.text}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-th-text-primary">{metric.label}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${categoryColor.bg} ${categoryColor.text}`}>
                                    {CATEGORY_LABELS[metric.category]}
                                </span>
                                {benchmarkStatus && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                        benchmarkStatus === 'great' ? 'bg-green-500/10 text-green-500' :
                                        benchmarkStatus === 'good' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-amber-500/10 text-amber-500'
                                    }`}>
                                        {benchmarkStatus === 'great' ? 'Great' :
                                         benchmarkStatus === 'good' ? 'Good' : 'Needs Work'}
                                    </span>
                                )}
                            </div>
                            {metric.description && (
                                <p className="text-xs text-th-text-muted mt-0.5">{metric.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-th-text-primary">
                                {formatValue(metric.value, metric.format)}
                            </p>
                            {metric.trend && (
                                <div className={`flex items-center justify-end gap-1 text-xs ${
                                    metric.trend === 'up' ? 'text-green-500' :
                                    metric.trend === 'down' ? 'text-red-500' : 'text-th-text-muted'
                                }`}>
                                    {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                                     metric.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                                    <span>{metric.trend === 'up' ? 'Trending up' : metric.trend === 'down' ? 'Trending down' : 'Stable'}</span>
                                </div>
                            )}
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
                    {/* Chart */}
                    {chartOption && (
                        <div className="p-4">
                            <ReactECharts option={chartOption} style={{ height: 200 }} />
                        </div>
                    )}

                    {/* Details */}
                    <div className="px-4 pb-4">
                        <div className="bg-th-bg-elevated/50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-th-text-secondary mb-2">About this metric</h4>
                            <p className="text-sm text-th-text-muted">
                                {metric.description || `${metric.label} shows key performance indicator for your game analytics.`}
                            </p>
                            {benchmarkStatus && (
                                <div className="mt-3 pt-3 border-t border-th-border/50">
                                    <p className="text-xs text-th-text-muted">
                                        <strong>Industry benchmark:</strong> Good is {formatValue(BENCHMARKS[metric.key]?.good || 0, metric.format)},
                                        Great is {formatValue(BENCHMARKS[metric.key]?.great || 0, metric.format)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Retention curve chart
function RetentionCurveChart({ retention }: { retention: CalculatedMetrics['retention'] }) {
    if (!retention) return null;

    const days = Object.keys(retention.classic).sort((a, b) => {
        const numA = parseInt(a.replace('D', ''));
        const numB = parseInt(b.replace('D', ''));
        return numA - numB;
    });

    const option = {
        grid: { top: 30, right: 30, bottom: 40, left: 50 },
        legend: {
            data: ['Classic', 'Rolling'],
            textStyle: { color: '#9ca3af' },
            top: 0,
        },
        xAxis: {
            type: 'category',
            data: days,
            name: 'Day',
            nameLocation: 'middle',
            nameGap: 25,
            nameTextStyle: { color: '#9ca3af' },
            axisLine: { lineStyle: { color: '#374151' } },
            axisLabel: { color: '#9ca3af' },
        },
        yAxis: {
            type: 'value',
            name: 'Retention %',
            nameTextStyle: { color: '#9ca3af' },
            max: 100,
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
            axisLabel: { color: '#9ca3af', formatter: '{value}%' },
        },
        series: [
            {
                name: 'Classic',
                type: 'line',
                data: days.map(d => retention.classic[d] || 0),
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { color: '#22c55e', width: 3 },
                itemStyle: { color: '#22c55e' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
                            { offset: 1, color: 'rgba(34, 197, 94, 0.05)' },
                        ],
                    },
                },
            },
            {
                name: 'Rolling',
                type: 'line',
                data: days.map(d => retention.rolling[d] || 0),
                smooth: true,
                symbol: 'diamond',
                symbolSize: 8,
                lineStyle: { color: '#3b82f6', width: 2, type: 'dashed' },
                itemStyle: { color: '#3b82f6' },
            },
        ],
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            textStyle: { color: '#f3f4f6' },
        },
    };

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-th-text-primary">Retention Curve</h3>
            </div>
            <ReactECharts option={option} style={{ height: 280 }} />
            <div className="mt-3 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-th-text-muted">Classic (exact day)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-th-text-muted">Rolling (day or after)</span>
                </div>
            </div>
        </div>
    );
}

// Level progression chart
function ProgressionChart({ progression }: { progression: CalculatedMetrics['progression'] }) {
    if (!progression) return null;

    const levels = Object.entries(progression.levelCompletionRates)
        .map(([name, rate]) => ({ name, rate, num: parseInt(name.replace('Level ', '')) }))
        .sort((a, b) => a.num - b.num)
        .slice(0, 20);

    const option = {
        grid: { top: 20, right: 20, bottom: 40, left: 50 },
        xAxis: {
            type: 'category',
            data: levels.map(l => l.name),
            axisLine: { lineStyle: { color: '#374151' } },
            axisLabel: { color: '#9ca3af', rotate: 45, fontSize: 10 },
        },
        yAxis: {
            type: 'value',
            name: 'Completion %',
            nameTextStyle: { color: '#9ca3af' },
            max: 100,
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
            axisLabel: { color: '#9ca3af', formatter: '{value}%' },
        },
        series: [{
            type: 'bar',
            data: levels.map(l => ({
                value: l.rate,
                itemStyle: {
                    color: progression.difficultySpikes.includes(l.name) ? '#ef4444' : '#8b5cf6',
                },
            })),
            barMaxWidth: 40,
        }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            textStyle: { color: '#f3f4f6' },
            formatter: (params: { name: string; value: number }[]) => {
                const p = params[0];
                const isSpike = progression.difficultySpikes.includes(p.name);
                return `${p.name}<br/>Completion: ${p.value.toFixed(1)}%${isSpike ? '<br/><span style="color:#ef4444">Difficulty Spike</span>' : ''}`;
            },
        },
    };

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-violet-500" />
                    <h3 className="font-semibold text-th-text-primary">Level Progression</h3>
                </div>
                {progression.difficultySpikes.length > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-500">
                        {progression.difficultySpikes.length} difficulty spike{progression.difficultySpikes.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <ReactECharts option={option} style={{ height: 280 }} />
            <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-th-text-muted">
                    Avg Level: <strong className="text-th-text-primary">{progression.avgLevel.toFixed(1)}</strong>
                </span>
                <span className="text-th-text-muted">
                    Max Level: <strong className="text-th-text-primary">{progression.maxLevelReached}</strong>
                </span>
            </div>
        </div>
    );
}

export function MetricTrendPanel({ metrics, className }: MetricTrendPanelProps) {
    const [selectedCategory, setSelectedCategory] = useState<MetricCategory>('all');
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    // Build metric items from calculated metrics
    const metricItems = useMemo<MetricItem[]>(() => {
        if (!metrics) return [];

        const items: MetricItem[] = [];

        // Retention metrics
        if (metrics.retention) {
            if (metrics.retention.classic['D1'] !== undefined) {
                items.push({
                    key: 'd1_retention',
                    label: 'Day 1 Retention',
                    value: metrics.retention.classic['D1'],
                    format: 'percent',
                    category: 'retention',
                    icon: Target,
                    color: '#22c55e',
                    description: 'Percentage of users who return exactly on day 1 after first activity',
                });
            }
            if (metrics.retention.classic['D7'] !== undefined) {
                items.push({
                    key: 'd7_retention',
                    label: 'Day 7 Retention',
                    value: metrics.retention.classic['D7'],
                    format: 'percent',
                    category: 'retention',
                    icon: Target,
                    color: '#22c55e',
                    description: 'Percentage of users who return exactly on day 7 after first activity',
                });
            }
            if (metrics.retention.classic['D30'] !== undefined) {
                items.push({
                    key: 'd30_retention',
                    label: 'Day 30 Retention',
                    value: metrics.retention.classic['D30'],
                    format: 'percent',
                    category: 'retention',
                    icon: Target,
                    color: '#22c55e',
                    description: 'Percentage of users who return exactly on day 30 after first activity',
                });
            }
            items.push({
                key: 'return_rate',
                label: 'Return Rate',
                value: metrics.retention.returnRate,
                format: 'percent',
                category: 'retention',
                icon: Activity,
                color: '#22c55e',
                description: 'Percentage of users who returned at least once after first session',
            });
        }

        // Engagement metrics
        if (metrics.engagement) {
            items.push({
                key: 'dau',
                label: 'Daily Active Users',
                value: metrics.engagement.dau,
                format: 'number',
                category: 'engagement',
                icon: Users,
                color: '#3b82f6',
                description: 'Average number of unique users active per day',
            });
            items.push({
                key: 'mau',
                label: 'Monthly Active Users',
                value: metrics.engagement.mau,
                format: 'number',
                category: 'engagement',
                icon: Users,
                color: '#3b82f6',
                description: 'Unique users active in the last 30 days',
            });
            items.push({
                key: 'dau_mau_ratio',
                label: 'Stickiness (DAU/MAU)',
                value: metrics.engagement.dauMauRatio * 100,
                format: 'percent',
                category: 'engagement',
                icon: Zap,
                color: '#3b82f6',
                description: 'How frequently users return. Higher is better.',
            });
            if (metrics.engagement.avgSessionsPerUser > 0) {
                items.push({
                    key: 'sessions_per_user',
                    label: 'Sessions per User',
                    value: metrics.engagement.avgSessionsPerUser,
                    format: 'number',
                    category: 'engagement',
                    icon: Activity,
                    color: '#3b82f6',
                    description: 'Average number of sessions per user',
                });
            }
        }

        // Monetization metrics
        if (metrics.monetization) {
            items.push({
                key: 'total_revenue',
                label: 'Total Revenue',
                value: metrics.monetization.totalRevenue,
                format: 'currency',
                category: 'monetization',
                icon: DollarSign,
                color: '#f59e0b',
                description: 'Total revenue generated in the dataset',
            });
            items.push({
                key: 'arpu',
                label: 'ARPU',
                value: metrics.monetization.arpu,
                format: 'currency',
                category: 'monetization',
                icon: DollarSign,
                color: '#f59e0b',
                description: 'Average Revenue Per User across all users',
            });
            items.push({
                key: 'arppu',
                label: 'ARPPU',
                value: metrics.monetization.arppu,
                format: 'currency',
                category: 'monetization',
                icon: DollarSign,
                color: '#f59e0b',
                description: 'Average Revenue Per Paying User (excludes non-payers)',
            });
            items.push({
                key: 'conversion_rate',
                label: 'Conversion Rate',
                value: metrics.monetization.conversionRate,
                format: 'percent',
                category: 'monetization',
                icon: Percent,
                color: '#f59e0b',
                description: 'Percentage of users who made at least one purchase',
            });
            items.push({
                key: 'ltv_projection',
                label: 'LTV Projection',
                value: metrics.monetization.ltvProjection,
                format: 'currency',
                category: 'monetization',
                icon: TrendingUp,
                color: '#f59e0b',
                description: 'Projected lifetime value based on retention and ARPU',
            });
        }

        // Progression metrics
        if (metrics.progression) {
            items.push({
                key: 'avg_level',
                label: 'Average Level',
                value: metrics.progression.avgLevel,
                format: 'number',
                category: 'progression',
                icon: Layers,
                color: '#8b5cf6',
                description: 'Average level reached by all users',
            });
            items.push({
                key: 'max_level',
                label: 'Max Level Reached',
                value: metrics.progression.maxLevelReached,
                format: 'number',
                category: 'progression',
                icon: Target,
                color: '#8b5cf6',
                description: 'Highest level any user has reached',
            });
        }

        return items;
    }, [metrics]);

    // Filter by category
    const filteredMetrics = useMemo(() => {
        if (selectedCategory === 'all') return metricItems;
        return metricItems.filter(m => m.category === selectedCategory);
    }, [metricItems, selectedCategory]);

    // Get available categories
    const availableCategories = useMemo(() => {
        const cats = new Set(metricItems.map(m => m.category));
        return ['all', ...Array.from(cats)] as MetricCategory[];
    }, [metricItems]);

    // No metrics state
    if (!metrics || metricItems.length === 0) {
        return (
            <div className={`bg-th-bg-surface rounded-card border border-th-border p-8 ${className ?? ''}`}>
                <div className="text-center">
                    <div className="w-12 h-12 bg-th-accent-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-6 h-6 text-th-accent-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-th-text-primary mb-2">No Metrics Available</h3>
                    <p className="text-th-text-muted">
                        Upload data with user IDs, timestamps, and events to calculate metrics.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className ?? ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                        <LineChart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-th-text-primary">Metric Analysis</h2>
                        <p className="text-sm text-th-text-muted">{metricItems.length} metrics calculated</p>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-1">
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                selectedCategory === cat
                                    ? 'bg-th-accent-primary text-white'
                                    : 'bg-th-bg-elevated text-th-text-secondary hover:bg-th-interactive-hover'
                            }`}
                        >
                            {CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Retention Curve (special chart) */}
            {metrics.retention && (selectedCategory === 'all' || selectedCategory === 'retention') && (
                <RetentionCurveChart retention={metrics.retention} />
            )}

            {/* Progression Chart (special chart) */}
            {metrics.progression && (selectedCategory === 'all' || selectedCategory === 'progression') && (
                <ProgressionChart progression={metrics.progression} />
            )}

            {/* Metric Cards */}
            <div className="space-y-3">
                <h3 className="font-semibold text-th-text-primary">Detailed Metrics</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredMetrics.map(metric => (
                        <MetricCard
                            key={metric.key}
                            metric={metric}
                            isExpanded={expandedMetric === metric.key}
                            onToggle={() => setExpandedMetric(
                                expandedMetric === metric.key ? null : metric.key
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Data Range Footer */}
            {metrics.dataRange && (
                <div className="flex items-center justify-between text-sm text-th-text-muted bg-th-bg-elevated/30 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Data range: {metrics.dataRange.start} to {metrics.dataRange.end}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Confidence: {(metrics.confidence * 100).toFixed(0)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MetricTrendPanel;
