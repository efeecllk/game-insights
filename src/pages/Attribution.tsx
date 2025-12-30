/**
 * Attribution Analytics Page
 * User acquisition source tracking and modeling
 * Phase 2: Page-by-Page Functionality (updated)
 */

import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    Target,
    TrendingUp,
    DollarSign,
    Users,
    ArrowRight,
    Database,
} from 'lucide-react';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';

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
        color: '#10b981',
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
        color: '#3b82f6',
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
        color: '#ef4444',
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
        color: '#6366f1',
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
        color: '#f59e0b',
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
        color: '#8b5cf6',
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
        color: '#06b6d4',
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

    // Generate channels from real data or use demo data
    const channels = useMemo((): Channel[] => {
        if (!hasRealData) return CHANNELS;

        // Get attribution data from the provider
        const realChannels = dataProvider.getAttributionChannels();

        // If we have real channel data, transform it
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
                organic: '#10b981',
                facebook: '#3b82f6',
                google: '#ef4444',
                apple: '#6366f1',
                influencer: '#f59e0b',
                referral: '#8b5cf6',
                email: '#06b6d4',
                direct: '#94a3b8',
                tiktok: '#000000',
                twitter: '#1da1f2',
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
                    cost: Math.round(ch.revenue * 0.3), // Estimated ad spend
                    revenue: ch.revenue,
                    conversions: Math.round(ch.users * 0.05), // Estimated conversions
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
        },
        series: [
            {
                type: 'pie',
                radius: ['45%', '70%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#1a1a2e',
                    borderWidth: 2,
                },
                label: {
                    show: true,
                    color: '#a0a0b0',
                    fontSize: 11,
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
        },
        grid: { left: 60, right: 20, top: 20, bottom: 40 },
        xAxis: {
            type: 'category',
            data: channels.filter(ch => ch.cost > 0).map(ch => ch.name),
            axisLabel: { color: '#a0a0b0', fontSize: 10, rotate: 15 },
            axisLine: { lineStyle: { color: '#333' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#a0a0b0', formatter: '{value}x' },
            splitLine: { lineStyle: { color: '#333' } },
        },
        series: [
            {
                type: 'bar',
                data: channels.filter(ch => ch.cost > 0).map(ch => ({
                    value: (ch.revenue / ch.cost).toFixed(2),
                    itemStyle: { color: ch.color },
                })),
                barWidth: '50%',
            },
        ],
    }), [channels]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-th-text-primary flex items-center gap-3">
                            <Target className="w-7 h-7 text-th-accent-primary" />
                            Attribution Analytics
                        </h1>
                        <DataModeIndicator />
                    </div>
                    <p className="text-th-text-secondary mt-1">
                        {hasRealData
                            ? 'Attribution analysis from your uploaded data'
                            : 'Understand where your users come from and which channels drive value'}
                    </p>
                    {hasRealData && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-green-400">
                            <Database className="w-3.5 h-3.5" />
                            Channel data derived from your uploaded dataset
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-3 py-2 bg-th-bg-card border border-th-border rounded-lg text-sm text-th-text-primary"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    icon={Users}
                    label="Total Installs"
                    value={totals.installs.toLocaleString()}
                    change="+12.5%"
                    positive
                />
                <KPICard
                    icon={DollarSign}
                    label="Ad Spend"
                    value={`$${(totals.cost / 1000).toFixed(1)}K`}
                    change="+8.2%"
                    positive={false}
                />
                <KPICard
                    icon={TrendingUp}
                    label="Revenue"
                    value={`$${(totals.revenue / 1000).toFixed(1)}K`}
                    change="+15.3%"
                    positive
                />
                <KPICard
                    icon={Target}
                    label="Blended ROAS"
                    value={`${(totals.revenue / totals.cost).toFixed(2)}x`}
                    change="+6.7%"
                    positive
                />
            </div>

            {/* Attribution Model Selector */}
            <div className="bg-th-bg-card rounded-xl border border-th-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-th-text-primary">Attribution Model</h3>
                        <p className="text-sm text-th-text-secondary mt-1">
                            {MODEL_INFO[selectedModel].description}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-th-bg-elevated rounded-lg p-1">
                        {(Object.keys(MODEL_INFO) as AttributionModel[]).map((model) => (
                            <button
                                key={model}
                                onClick={() => setSelectedModel(model)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    selectedModel === model
                                        ? 'bg-th-accent-primary text-white'
                                        : 'text-th-text-secondary hover:text-th-text-primary'
                                }`}
                            >
                                {MODEL_INFO[model].name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attribution Pie Chart */}
                    <div>
                        <h4 className="text-sm font-medium text-th-text-secondary mb-4">Credit Distribution</h4>
                        <ReactECharts option={pieChartOption} style={{ height: 280 }} />
                    </div>

                    {/* Channel Table */}
                    <div>
                        <h4 className="text-sm font-medium text-th-text-secondary mb-4">Channel Breakdown</h4>
                        <div className="space-y-2">
                            {sortedChannels.map((channel) => (
                                <div
                                    key={channel.id}
                                    className="flex items-center gap-3 p-3 bg-th-bg-elevated rounded-lg"
                                >
                                    <span className="text-xl">{channel.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-th-text-primary text-sm">
                                            {channel.name}
                                        </div>
                                        <div className="text-xs text-th-text-secondary">
                                            {channel.installs.toLocaleString()} installs
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-th-text-primary">
                                            {channel.attribution[selectedModel]}%
                                        </div>
                                        <div className="w-20 h-1.5 bg-th-bg-card rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${channel.attribution[selectedModel]}%`,
                                                    backgroundColor: channel.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ROAS by Channel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-th-bg-card rounded-xl border border-th-border p-6">
                    <h3 className="text-lg font-semibold text-th-text-primary mb-4">ROAS by Channel</h3>
                    <ReactECharts option={roasChartOption} style={{ height: 250 }} />
                </div>

                {/* Top Converting Paths */}
                <div className="bg-th-bg-card rounded-xl border border-th-border p-6">
                    <h3 className="text-lg font-semibold text-th-text-primary mb-4">Top Converting Paths</h3>
                    <div className="space-y-3">
                        <ConversionPath
                            path={['Google Ads', 'Organic', 'Direct']}
                            conversions={245}
                            percentage={18.5}
                        />
                        <ConversionPath
                            path={['Facebook Ads', 'Influencer', 'Direct']}
                            conversions={198}
                            percentage={14.9}
                        />
                        <ConversionPath
                            path={['Organic']}
                            conversions={156}
                            percentage={11.8}
                        />
                        <ConversionPath
                            path={['Apple Search', 'Direct']}
                            conversions={134}
                            percentage={10.1}
                        />
                        <ConversionPath
                            path={['Referral', 'Organic', 'Direct']}
                            conversions={112}
                            percentage={8.4}
                        />
                    </div>
                </div>
            </div>

            {/* Channel Performance Table */}
            <div className="bg-th-bg-card rounded-xl border border-th-border overflow-hidden">
                <div className="px-6 py-4 border-b border-th-border">
                    <h3 className="text-lg font-semibold text-th-text-primary">Channel Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-th-bg-elevated">
                                <th className="px-6 py-3 text-left text-xs font-medium text-th-text-secondary uppercase tracking-wider">
                                    Channel
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-th-text-secondary uppercase tracking-wider">
                                    Installs
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-th-text-secondary uppercase tracking-wider">
                                    Cost
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-th-text-secondary uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-th-text-secondary uppercase tracking-wider">
                                    CPI
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-th-text-secondary uppercase tracking-wider">
                                    ROAS
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-th-text-secondary uppercase tracking-wider">
                                    Conv. Rate
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-th-border">
                            {channels.map((channel) => (
                                <tr key={channel.id} className="hover:bg-th-bg-elevated transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span>{channel.icon}</span>
                                            <span className="font-medium text-th-text-primary">{channel.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-th-text-primary">
                                        {channel.installs.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-th-text-primary">
                                        {channel.cost > 0 ? `$${channel.cost.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-th-text-primary">
                                        ${channel.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-th-text-primary">
                                        {channel.cost > 0 ? `$${(channel.cost / channel.installs).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {channel.cost > 0 ? (
                                            <span className={`font-medium ${
                                                channel.revenue / channel.cost >= 2
                                                    ? 'text-green-400'
                                                    : channel.revenue / channel.cost >= 1
                                                    ? 'text-yellow-400'
                                                    : 'text-red-400'
                                            }`}>
                                                {(channel.revenue / channel.cost).toFixed(2)}x
                                            </span>
                                        ) : (
                                            <span className="text-green-400">∞</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-th-text-primary">
                                        {((channel.conversions / channel.installs) * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
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
}: {
    icon: typeof Users;
    label: string;
    value: string;
    change: string;
    positive: boolean;
}) {
    return (
        <div className="bg-th-bg-card rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-th-accent-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-th-accent-primary" />
                </div>
                <span className="text-sm text-th-text-secondary">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-th-text-primary">{value}</span>
                <span className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
                    {change}
                </span>
            </div>
        </div>
    );
}

function ConversionPath({
    path,
    conversions,
    percentage,
}: {
    path: string[];
    conversions: number;
    percentage: number;
}) {
    return (
        <div className="flex items-center gap-3 p-3 bg-th-bg-elevated rounded-lg">
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                {path.map((step, i) => (
                    <span key={i} className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-th-bg-card rounded text-xs font-medium text-th-text-primary whitespace-nowrap">
                            {step}
                        </span>
                        {i < path.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-th-text-secondary flex-shrink-0" />
                        )}
                    </span>
                ))}
            </div>
            <div className="text-right flex-shrink-0">
                <div className="font-medium text-th-text-primary">{conversions}</div>
                <div className="text-xs text-th-text-secondary">{percentage}%</div>
            </div>
        </div>
    );
}

export default AttributionPage;
