/**
 * MetricTrendPanel - Obsidian Analytics Design
 *
 * Displays metric trends with:
 * - Glassmorphism containers
 * - Orange accent colors
 * - Framer Motion animations
 * - Premium chart styling
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Target,
    Activity,
    ChevronRight,
    BarChart3,
    LineChart,
    Calendar,
    Layers,
    Percent,
    Zap,
    Sparkles,
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

// Category colors - Obsidian theme
const CATEGORY_COLORS: Record<MetricCategory, { bg: string; text: string; chart: string; border: string }> = {
    retention: { bg: 'bg-[#DA7756]/10', text: 'text-[#DA7756]', chart: '#DA7756', border: 'border-[#DA7756]/20' },
    engagement: { bg: 'bg-[#8F8B82]/10', text: 'text-[#8F8B82]', chart: '#8F8B82', border: 'border-[#8F8B82]/20' },
    monetization: { bg: 'bg-[#E5A84B]/10', text: 'text-[#E5A84B]', chart: '#E5A84B', border: 'border-[#E5A84B]/20' },
    progression: { bg: 'bg-[#C15F3C]/10', text: 'text-[#C15F3C]', chart: '#C15F3C', border: 'border-[#C15F3C]/20' },
    all: { bg: 'bg-[#8F8B82]/10', text: 'text-[#8F8B82]', chart: '#8F8B82', border: 'border-[#8F8B82]/20' },
};

const CATEGORY_LABELS: Record<MetricCategory, string> = {
    retention: 'Retention',
    engagement: 'Engagement',
    monetization: 'Monetization',
    progression: 'Progression',
    all: 'All Metrics',
};

// Animation variants
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
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
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
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
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
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#FAF9F6' },
            formatter: (params: { name: string; value: number }[]) => {
                const p = params[0];
                return `${p.name}<br/>${metric.label}: ${formatValue(p.value, metric.format)}`;
            },
        },
    } : null;

    return (
        <motion.div
            layout
            className={`bg-slate-900  rounded-xl border overflow-hidden transition-all ${
                isExpanded ? 'border-[#DA7756]/30 ring-1 ring-[#DA7756]/20' : 'border-slate-700'
            }`}
        >
            {/* Header */}
            <motion.div
                className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={onToggle}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${categoryColor.bg} border ${categoryColor.border} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${categoryColor.text}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{metric.label}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${categoryColor.bg} ${categoryColor.text}`}>
                                    {CATEGORY_LABELS[metric.category]}
                                </span>
                                {benchmarkStatus && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                        benchmarkStatus === 'great' ? 'bg-[#DA7756]/10 text-[#DA7756]' :
                                        benchmarkStatus === 'good' ? 'bg-[#8F8B82]/10 text-[#8F8B82]' :
                                        'bg-[#E5A84B]/10 text-[#E5A84B]'
                                    }`}>
                                        {benchmarkStatus === 'great' ? 'Great' :
                                         benchmarkStatus === 'good' ? 'Good' : 'Needs Work'}
                                    </span>
                                )}
                            </div>
                            {metric.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{metric.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                                {formatValue(metric.value, metric.format)}
                            </p>
                            {metric.trend && (
                                <div className={`flex items-center justify-end gap-1 text-xs ${
                                    metric.trend === 'up' ? 'text-[#DA7756]' :
                                    metric.trend === 'down' ? 'text-[#E25C5C]' : 'text-slate-400'
                                }`}>
                                    {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                                     metric.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                                    <span>{metric.trend === 'up' ? 'Trending up' : metric.trend === 'down' ? 'Trending down' : 'Stable'}</span>
                                </div>
                            )}
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                            <ChevronRight className="w-5 h-5 text-slate-500" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-800"
                    >
                        {chartOption && (
                            <div className="p-4">
                                <ReactECharts option={chartOption} style={{ height: 200 }} />
                            </div>
                        )}
                        <div className="px-4 pb-4">
                            <div className="bg-white/[0.02] border border-slate-800 rounded-xl p-4">
                                <h4 className="text-sm font-medium text-slate-300 mb-2">About this metric</h4>
                                <p className="text-sm text-slate-400">
                                    {metric.description || `${metric.label} shows key performance indicator for your game analytics.`}
                                </p>
                                {benchmarkStatus && (
                                    <div className="mt-3 pt-3 border-t border-slate-800">
                                        <p className="text-xs text-slate-500">
                                            <strong className="text-slate-400">Industry benchmark:</strong> Good is {formatValue(BENCHMARKS[metric.key]?.good || 0, metric.format)},
                                            Great is {formatValue(BENCHMARKS[metric.key]?.great || 0, metric.format)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
            textStyle: { color: 'rgba(255,255,255,0.6)' },
            top: 0,
        },
        xAxis: {
            type: 'category',
            data: days,
            name: 'Day',
            nameLocation: 'middle',
            nameGap: 25,
            nameTextStyle: { color: 'rgba(255,255,255,0.5)' },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)' },
        },
        yAxis: {
            type: 'value',
            name: 'Retention %',
            nameTextStyle: { color: 'rgba(255,255,255,0.5)' },
            max: 100,
            axisLine: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)', formatter: '{value}%' },
        },
        series: [
            {
                name: 'Classic',
                type: 'line',
                data: days.map(d => retention.classic[d] || 0),
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { color: '#DA7756', width: 3 },
                itemStyle: { color: '#DA7756' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(218, 119, 86, 0.3)' },
                            { offset: 1, color: 'rgba(218, 119, 86, 0.05)' },
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
                lineStyle: { color: '#C15F3C', width: 2, type: 'dashed' },
                itemStyle: { color: '#C15F3C' },
            },
        ],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#FAF9F6' },
        },
    };

    return (
        <motion.div
            variants={itemVariants}
            className="bg-slate-900  rounded-2xl border border-slate-700 p-6"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#DA7756]" />
                </div>
                <h3 className="font-semibold text-white">Retention Curve</h3>
            </div>
            <ReactECharts option={option} style={{ height: 280 }} />
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#DA7756]" />
                    <span className="text-slate-400">Classic (exact day)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#C15F3C]" />
                    <span className="text-slate-400">Rolling (day or after)</span>
                </div>
            </div>
        </motion.div>
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
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)', rotate: 45, fontSize: 10 },
        },
        yAxis: {
            type: 'value',
            name: 'Completion %',
            nameTextStyle: { color: 'rgba(255,255,255,0.5)' },
            max: 100,
            axisLine: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)', formatter: '{value}%' },
        },
        series: [{
            type: 'bar',
            data: levels.map(l => ({
                value: l.rate,
                itemStyle: {
                    color: progression.difficultySpikes.includes(l.name) ? '#E25C5C' : '#C15F3C',
                },
            })),
            barMaxWidth: 40,
        }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#FAF9F6' },
            formatter: (params: { name: string; value: number }[]) => {
                const p = params[0];
                const isSpike = progression.difficultySpikes.includes(p.name);
                return `${p.name}<br/>Completion: ${p.value.toFixed(1)}%${isSpike ? '<br/><span style="color:#E25C5C">Difficulty Spike</span>' : ''}`;
            },
        },
    };

    return (
        <motion.div
            variants={itemVariants}
            className="bg-slate-900  rounded-2xl border border-slate-700 p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/20 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-[#C15F3C]" />
                    </div>
                    <h3 className="font-semibold text-white">Level Progression</h3>
                </div>
                {progression.difficultySpikes.length > 0 && (
                    <span className="px-3 py-1 text-xs rounded-full bg-[#E25C5C]/10 border border-[#E25C5C]/20 text-[#E25C5C]">
                        {progression.difficultySpikes.length} difficulty spike{progression.difficultySpikes.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <ReactECharts option={option} style={{ height: 280 }} />
            <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-400">
                    Avg Level: <strong className="text-white">{progression.avgLevel.toFixed(1)}</strong>
                </span>
                <span className="text-slate-400">
                    Max Level: <strong className="text-white">{progression.maxLevelReached}</strong>
                </span>
            </div>
        </motion.div>
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
                    color: '#DA7756',
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
                    color: '#DA7756',
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
                    color: '#DA7756',
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
                color: '#DA7756',
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
                color: '#8F8B82',
                description: 'Average number of unique users active per day',
            });
            items.push({
                key: 'mau',
                label: 'Monthly Active Users',
                value: metrics.engagement.mau,
                format: 'number',
                category: 'engagement',
                icon: Users,
                color: '#8F8B82',
                description: 'Unique users active in the last 30 days',
            });
            items.push({
                key: 'dau_mau_ratio',
                label: 'Stickiness (DAU/MAU)',
                value: metrics.engagement.dauMauRatio * 100,
                format: 'percent',
                category: 'engagement',
                icon: Zap,
                color: '#8F8B82',
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
                    color: '#8F8B82',
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
                color: '#E5A84B',
                description: 'Total revenue generated in the dataset',
            });
            items.push({
                key: 'arpu',
                label: 'ARPU',
                value: metrics.monetization.arpu,
                format: 'currency',
                category: 'monetization',
                icon: DollarSign,
                color: '#E5A84B',
                description: 'Average Revenue Per User across all users',
            });
            items.push({
                key: 'arppu',
                label: 'ARPPU',
                value: metrics.monetization.arppu,
                format: 'currency',
                category: 'monetization',
                icon: DollarSign,
                color: '#E5A84B',
                description: 'Average Revenue Per Paying User (excludes non-payers)',
            });
            items.push({
                key: 'conversion_rate',
                label: 'Conversion Rate',
                value: metrics.monetization.conversionRate,
                format: 'percent',
                category: 'monetization',
                icon: Percent,
                color: '#E5A84B',
                description: 'Percentage of users who made at least one purchase',
            });
            items.push({
                key: 'ltv_projection',
                label: 'LTV Projection',
                value: metrics.monetization.ltvProjection,
                format: 'currency',
                category: 'monetization',
                icon: TrendingUp,
                color: '#E5A84B',
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
                color: '#C15F3C',
                description: 'Average level reached by all users',
            });
            items.push({
                key: 'max_level',
                label: 'Max Level Reached',
                value: metrics.progression.maxLevelReached,
                format: 'number',
                category: 'progression',
                icon: Target,
                color: '#C15F3C',
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
            <div className={`bg-slate-900  rounded-2xl border border-slate-700 p-8 ${className ?? ''}`}>
                <div className="text-center">
                    <div className="w-16 h-16 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-[#DA7756]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Metrics Available</h3>
                    <p className="text-slate-400">
                        Upload data with user IDs, timestamps, and events to calculate metrics.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`space-y-6 ${className ?? ''}`}
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                        <LineChart className="w-6 h-6 text-[#DA7756]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Metric Analysis</h2>
                        <p className="text-sm text-slate-400">{metricItems.length} metrics calculated</p>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-1 bg-white/[0.03] border border-slate-700 rounded-xl p-1">
                    {availableCategories.map(cat => (
                        <motion.button
                            key={cat}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 text-sm rounded-lg transition-all ${
                                selectedCategory === cat
                                    ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            {CATEGORY_LABELS[cat]}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Retention Curve (special chart) */}
            {metrics.retention && (selectedCategory === 'all' || selectedCategory === 'retention') && (
                <RetentionCurveChart retention={metrics.retention} />
            )}

            {/* Progression Chart (special chart) */}
            {metrics.progression && (selectedCategory === 'all' || selectedCategory === 'progression') && (
                <ProgressionChart progression={metrics.progression} />
            )}

            {/* Metric Cards */}
            <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#DA7756]" />
                    <h3 className="font-semibold text-white">Detailed Metrics</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {filteredMetrics.map((metric, index) => (
                            <motion.div
                                key={metric.key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <MetricCard
                                    metric={metric}
                                    isExpanded={expandedMetric === metric.key}
                                    onToggle={() => setExpandedMetric(
                                        expandedMetric === metric.key ? null : metric.key
                                    )}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Data Range Footer */}
            {metrics.dataRange && (
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between text-sm text-slate-400 bg-white/[0.02] border border-slate-800 rounded-xl px-4 py-3"
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#DA7756]" />
                        <span>Data range: {metrics.dataRange.start} to {metrics.dataRange.end}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Confidence: <span className="text-[#DA7756] font-medium">{(metrics.confidence * 100).toFixed(0)}%</span></span>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

export default MetricTrendPanel;
