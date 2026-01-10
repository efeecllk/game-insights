/**
 * Attribution Analytics Page - Obsidian Analytics Design
 *
 * Premium attribution dashboard with:
 * - Glassmorphism containers
 * - Warm orange accent theme
 * - Animated entrance effects
 * - Enhanced data visualizations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { echarts } from '@/lib/echarts';
import {
    Target,
    TrendingUp,
    DollarSign,
    Users,
    ArrowRight,
    Database,
    ChevronDown,
    Sparkles,
    BarChart3,
    GitBranch,
} from 'lucide-react';
import { useGameData } from '../hooks/useGameData';
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

// ============================================================================
// Types
// ============================================================================

type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';

interface Channel {
    id: string;
    name: string;
    icon: string;
    color: string;
    installs: number;
    cost: number;
    revenue: number;
    conversions: number;
    attribution: Record<AttributionModel, number>;
}

// ============================================================================
// Mock Data
// ============================================================================

const CHANNELS: Channel[] = [
    {
        id: 'organic',
        name: 'Organic Search',
        icon: '🔍',
        color: '#DA7756',
        installs: 12500,
        cost: 0,
        revenue: 18750,
        conversions: 625,
        attribution: { first_touch: 28, last_touch: 22, linear: 25, time_decay: 24, position_based: 26 },
    },
    {
        id: 'facebook',
        name: 'Facebook Ads',
        icon: '📘',
        color: '#8F8B82',
        installs: 8200,
        cost: 12300,
        revenue: 24600,
        conversions: 410,
        attribution: { first_touch: 22, last_touch: 28, linear: 24, time_decay: 26, position_based: 24 },
    },
    {
        id: 'google',
        name: 'Google Ads',
        icon: '🔎',
        color: '#E25C5C',
        installs: 6800,
        cost: 10200,
        revenue: 20400,
        conversions: 340,
        attribution: { first_touch: 18, last_touch: 20, linear: 19, time_decay: 19, position_based: 18 },
    },
    {
        id: 'apple_search',
        name: 'Apple Search Ads',
        icon: '🍎',
        color: '#C15F3C',
        installs: 4500,
        cost: 6750,
        revenue: 11250,
        conversions: 225,
        attribution: { first_touch: 12, last_touch: 14, linear: 13, time_decay: 13, position_based: 13 },
    },
    {
        id: 'influencer',
        name: 'Influencer',
        icon: '⭐',
        color: '#E5A84B',
        installs: 3200,
        cost: 4800,
        revenue: 9600,
        conversions: 160,
        attribution: { first_touch: 10, last_touch: 8, linear: 9, time_decay: 9, position_based: 10 },
    },
    {
        id: 'referral',
        name: 'Referral',
        icon: '🤝',
        color: '#DA7756',
        installs: 2800,
        cost: 1400,
        revenue: 8400,
        conversions: 140,
        attribution: { first_touch: 7, last_touch: 5, linear: 7, time_decay: 6, position_based: 6 },
    },
    {
        id: 'email',
        name: 'Email',
        icon: '📧',
        color: '#A68B5B',
        installs: 1500,
        cost: 750,
        revenue: 4500,
        conversions: 75,
        attribution: { first_touch: 3, last_touch: 3, linear: 3, time_decay: 3, position_based: 3 },
    },
];

const MODEL_INFO: Record<AttributionModel, { name: string; description: string }> = {
    first_touch: {
        name: 'First Touch',
        description: '100% credit to the first touchpoint that introduced the user.',
    },
    last_touch: {
        name: 'Last Touch',
        description: '100% credit to the last touchpoint before conversion.',
    },
    linear: {
        name: 'Linear',
        description: 'Equal credit distributed across all touchpoints.',
    },
    time_decay: {
        name: 'Time Decay',
        description: 'More credit to touchpoints closer to conversion.',
    },
    position_based: {
        name: 'Position Based',
        description: '40% to first & last, 20% distributed to middle touchpoints.',
    },
};

// ============================================================================
// Attribution Page Component
// ============================================================================

export function AttributionPage() {
    const { dataProvider, hasRealData } = useGameData();
    const [selectedModel, setSelectedModel] = useState<AttributionModel>('linear');
    const [dateRange, setDateRange] = useState('30d');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Generate channels from real data or use demo data
    const channels = useMemo((): Channel[] => {
        if (!hasRealData) return CHANNELS;

        const realChannels = dataProvider.getAttributionChannels();

        if (realChannels.length > 0) {
            const channelIcons: Record<string, string> = {
                organic: '🔍',
                facebook: '📘',
                google: '🔎',
                apple: '🍎',
                influencer: '⭐',
                referral: '🤝',
                email: '📧',
                direct: '🌐',
                tiktok: '🎵',
                twitter: '🐦',
            };

            const channelColors: Record<string, string> = {
                organic: '#DA7756',
                facebook: '#8F8B82',
                google: '#E25C5C',
                apple: '#C15F3C',
                influencer: '#E5A84B',
                referral: '#DA7756',
                email: '#A68B5B',
                direct: '#8F8B82',
                tiktok: '#000000',
                twitter: '#A68B5B',
            };

            return realChannels.map((ch, idx) => {
                const key = ch.name.toLowerCase().replace(/\s+/g, '_');
                const baseKey = Object.keys(channelIcons).find(k => key.includes(k)) || 'direct';

                return {
                    id: key,
                    name: ch.name,
                    icon: channelIcons[baseKey] || '📊',
                    color: channelColors[baseKey] || `hsl(${idx * 45}, 70%, 50%)`,
                    installs: ch.users,
                    cost: Math.round(ch.revenue * 0.3),
                    revenue: ch.revenue,
                    conversions: Math.round(ch.users * 0.05),
                    attribution: {
                        first_touch: ch.percentage,
                        last_touch: ch.percentage * 0.9,
                        linear: ch.percentage * 0.95,
                        time_decay: ch.percentage * 0.92,
                        position_based: ch.percentage * 0.97,
                    },
                };
            });
        }

        return CHANNELS;
    }, [hasRealData, dataProvider]);

    // Calculate totals
    const totals = useMemo(() => {
        return channels.reduce(
            (acc, ch) => ({
                installs: acc.installs + ch.installs,
                cost: acc.cost + ch.cost,
                revenue: acc.revenue + ch.revenue,
                conversions: acc.conversions + ch.conversions,
            }),
            { installs: 0, cost: 0, revenue: 0, conversions: 0 }
        );
    }, [channels]);

    // Sort channels by attribution for selected model
    const sortedChannels = useMemo(() => {
        return [...channels].sort(
            (a, b) => b.attribution[selectedModel] - a.attribution[selectedModel]
        );
    }, [channels, selectedModel]);

    // Chart data for attribution breakdown
    const pieChartOption = useMemo(() => ({
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {d}%',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#FAF9F6' },
        },
        series: [
            {
                type: 'pie',
                radius: ['45%', '70%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#0f172a',
                    borderWidth: 3,
                },
                label: {
                    show: true,
                    color: '#C8C4BA',
                    fontSize: 11,
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                    },
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(218, 119, 86, 0.3)',
                    },
                },
                data: sortedChannels.map(ch => ({
                    name: ch.name,
                    value: ch.attribution[selectedModel],
                    itemStyle: { color: ch.color },
                })),
            },
        ],
    }), [sortedChannels, selectedModel]);

    // ROAS chart
    const roasChartOption = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#FAF9F6' },
        },
        grid: { left: 60, right: 20, top: 20, bottom: 40 },
        xAxis: {
            type: 'category',
            data: channels.filter(ch => ch.cost > 0).map(ch => ch.name),
            axisLabel: { color: '#8F8B82', fontSize: 10, rotate: 15 },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#8F8B82', formatter: '{value}x' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        },
        series: [
            {
                type: 'bar',
                data: channels.filter(ch => ch.cost > 0).map(ch => ({
                    value: (ch.revenue / ch.cost).toFixed(2),
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: ch.color },
                                { offset: 1, color: `${ch.color}66` },
                            ],
                        },
                        borderRadius: [6, 6, 0, 0],
                    },
                })),
                barWidth: '50%',
            },
        ],
    }), [channels]);

    const dateRangeLabel: Record<string, string> = {
        '7d': 'Last 7 days',
        '30d': 'Last 30 days',
        '90d': 'Last 90 days',
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
                                <div className="w-12 h-12 bg-th-accent-primary-muted border border-th-accent-primary/20 rounded-xl flex items-center justify-center">
                                    <Target className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-display font-bold text-th-text-primary">
                                        Attribution Analytics
                                    </h1>
                                    {hasRealData && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[#DA7756]/10 border border-[#DA7756]/20 text-[#DA7756] rounded-full">
                                            <Database className="w-3 h-3" />
                                            Live
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    {hasRealData
                                        ? 'Attribution analysis from your uploaded data'
                                        : 'Understand where your users come from and which channels drive value'}
                                </p>
                            </div>
                        </div>

                        {/* Date Range Selector */}
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-white/[0.03] border border-slate-700 rounded-lg hover:bg-white/[0.06] hover:border-slate-600 transition-colors"
                            >
                                {dateRangeLabel[dateRange]}
                                <ChevronDown className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                            </motion.button>
                            <AnimatePresence>
                                {showDatePicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-44 bg-slate-900/95  border border-slate-700 rounded-xl shadow-lg overflow-hidden z-50"
                                    >
                                        {Object.entries(dateRangeLabel).map(([value, label]) => (
                                            <button
                                                key={value}
                                                onClick={() => {
                                                    setDateRange(value);
                                                    setShowDatePicker(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors ${
                                                    dateRange === value ? 'bg-[#DA7756]/10 text-[#DA7756]' : 'text-slate-300'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    icon={Users}
                    label="Total Installs"
                    value={totals.installs.toLocaleString()}
                    change="+12.5%"
                    positive
                    color="orange"
                    index={0}
                />
                <KPICard
                    icon={DollarSign}
                    label="Ad Spend"
                    value={`$${(totals.cost / 1000).toFixed(1)}K`}
                    change="+8.2%"
                    positive={false}
                    color="blue"
                    index={1}
                />
                <KPICard
                    icon={TrendingUp}
                    label="Revenue"
                    value={`$${(totals.revenue / 1000).toFixed(1)}K`}
                    change="+15.3%"
                    positive
                    color="warmOrange"
                    index={2}
                />
                <KPICard
                    icon={Target}
                    label="Blended ROAS"
                    value={`${(totals.revenue / totals.cost).toFixed(2)}x`}
                    change="+6.7%"
                    positive
                    color="violet"
                    index={3}
                />
            </div>

            {/* Attribution Model Selector */}
            <motion.div variants={itemVariants}>
                <Card variant="default" padding="lg">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#DA7756]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Attribution Model</h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {MODEL_INFO[selectedModel].description}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-slate-800 rounded-xl">
                            {(Object.keys(MODEL_INFO) as AttributionModel[]).map((model) => (
                                <motion.button
                                    key={model}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedModel(model)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        selectedModel === model
                                            ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                            : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.03]'
                                    }`}
                                >
                                    {MODEL_INFO[model].name}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attribution Pie Chart */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-slate-800">
                            <h4 className="text-sm font-medium text-slate-400 mb-4">Credit Distribution</h4>
                            <ReactECharts option={pieChartOption} style={{ height: 280 }} />
                        </div>

                        {/* Channel Table */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-slate-800">
                            <h4 className="text-sm font-medium text-slate-400 mb-4">Channel Breakdown</h4>
                            <div className="space-y-2">
                                {sortedChannels.map((channel, index) => (
                                    <motion.div
                                        key={channel.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-slate-800 hover:border-slate-700 transition-colors group"
                                    >
                                        <span className="text-xl">{channel.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white text-sm">
                                                {channel.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {channel.installs.toLocaleString()} installs
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-white">
                                                {channel.attribution[selectedModel]}%
                                            </div>
                                            <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${channel.attribution[selectedModel]}%` }}
                                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: channel.color }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* ROAS by Channel & Top Converting Paths */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#8F8B82]/10 border border-[#8F8B82]/20 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-[#8F8B82]" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">ROAS by Channel</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-slate-800">
                            <ReactECharts option={roasChartOption} style={{ height: 250 }} />
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/20 flex items-center justify-center">
                                <GitBranch className="w-5 h-5 text-[#C15F3C]" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Top Converting Paths</h3>
                        </div>
                        <div className="space-y-3">
                            <ConversionPath
                                path={['Google Ads', 'Organic', 'Direct']}
                                conversions={245}
                                percentage={18.5}
                                index={0}
                            />
                            <ConversionPath
                                path={['Facebook Ads', 'Influencer', 'Direct']}
                                conversions={198}
                                percentage={14.9}
                                index={1}
                            />
                            <ConversionPath
                                path={['Organic']}
                                conversions={156}
                                percentage={11.8}
                                index={2}
                            />
                            <ConversionPath
                                path={['Apple Search', 'Direct']}
                                conversions={134}
                                percentage={10.1}
                                index={3}
                            />
                            <ConversionPath
                                path={['Referral', 'Organic', 'Direct']}
                                conversions={112}
                                percentage={8.4}
                                index={4}
                            />
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Channel Performance Table */}
            <motion.div variants={itemVariants}>
                <Card variant="default" padding="none" className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800">
                        <h3 className="text-lg font-semibold text-white">Channel Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Channel
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Installs
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Cost
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        CPI
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        ROAS
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Conv. Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {channels.map((channel, index) => (
                                    <motion.tr
                                        key={channel.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span>{channel.icon}</span>
                                                <span className="font-medium text-white">{channel.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-300">
                                            {channel.installs.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-300">
                                            {channel.cost > 0 ? `$${channel.cost.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-300">
                                            ${channel.revenue.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-300">
                                            {channel.cost > 0 ? `$${(channel.cost / channel.installs).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {channel.cost > 0 ? (
                                                <span className={`font-medium px-2 py-0.5 rounded-full text-sm ${
                                                    channel.revenue / channel.cost >= 2
                                                        ? 'bg-[#DA7756]/10 text-[#DA7756]'
                                                        : channel.revenue / channel.cost >= 1
                                                        ? 'bg-[#E5A84B]/10 text-[#E5A84B]'
                                                        : 'bg-[#E25C5C]/10 text-[#E25C5C]'
                                                }`}>
                                                    {(channel.revenue / channel.cost).toFixed(2)}x
                                                </span>
                                            ) : (
                                                <span className="text-[#DA7756]">∞</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-300">
                                            {((channel.conversions / channel.installs) * 100).toFixed(1)}%
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}

// ============================================================================
// Supporting Components
// ============================================================================

function KPICard({
    icon: Icon,
    label,
    value,
    change,
    positive,
    color,
    index,
}: {
    icon: typeof Users;
    label: string;
    value: string;
    change: string;
    positive: boolean;
    color: 'orange' | 'blue' | 'warmOrange' | 'violet';
    index: number;
}) {
    const colorStyles = {
        orange: {
            bg: 'bg-[#DA7756]/15',
            border: 'border-[#DA7756]/20',
            icon: 'text-[#DA7756]',
        },
        blue: {
            bg: 'bg-[#8F8B82]/15',
            border: 'border-[#8F8B82]/20',
            icon: 'text-[#8F8B82]',
        },
        warmOrange: {
            bg: 'bg-[#C15F3C]/15',
            border: 'border-[#C15F3C]/20',
            icon: 'text-[#C15F3C]',
        },
        violet: {
            bg: 'bg-[#C15F3C]/15',
            border: 'border-[#C15F3C]/20',
            icon: 'text-[#C15F3C]',
        },
    };

    const style = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="default" padding="md" className="group hover:border-th-border-strong transition-colors">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${style.icon}`} />
                    </div>
                    <span className="text-sm text-slate-500">{label}</span>
                </div>
                <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                        positive
                            ? 'bg-[#DA7756]/10 text-[#DA7756]'
                            : 'bg-[#E25C5C]/10 text-[#E25C5C]'
                    }`}>
                        {change}
                    </span>
                </div>
            </Card>
        </motion.div>
    );
}

function ConversionPath({
    path,
    conversions,
    percentage,
    index,
}: {
    path: string[];
    conversions: number;
    percentage: number;
    index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-slate-800 hover:border-slate-700 transition-colors group"
        >
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                {path.map((step, i) => (
                    <span key={i} className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/[0.05] border border-slate-700 rounded-lg text-xs font-medium text-slate-300 whitespace-nowrap group-hover:border-[#DA7756]/20 transition-colors">
                            {step}
                        </span>
                        {i < path.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        )}
                    </span>
                ))}
            </div>
            <div className="text-right flex-shrink-0">
                <div className="font-medium text-white">{conversions}</div>
                <div className="text-xs text-slate-500">{percentage}%</div>
            </div>
        </motion.div>
    );
}

export default AttributionPage;
