/**
 * SpenderTiersChart Component - Obsidian Analytics Design
 *
 * Visualizes user spending segments (Whales/Dolphins/Minnows/Non-Payers):
 * - Stacked bar or treemap visualization
 * - Revenue contribution by tier
 * - User count and percentage breakdown
 * - Derived from actual uploaded data
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { echarts } from '@/lib/echarts';
import { DollarSign, Users, Crown, Fish, Sparkles } from 'lucide-react';
import { DataSourceIndicator, DataSourceType } from './DataSourceIndicator';

export interface SpenderTier {
    tier: string;
    users: number;
    revenue: number;
    percentage: number;
}

interface SpenderTiersChartProps {
    tiers: SpenderTier[];
    totalUsers: number;
    totalRevenue: number;
    sourceColumns?: string[];
    className?: string;
}

// Tier configuration
const TIER_CONFIG: Record<string, {
    color: string;
    icon: React.ElementType;
    description: string;
}> = {
    'Whale ($100+)': {
        color: '#DA7756',
        icon: Crown,
        description: 'High-value players who spend $100+',
    },
    'Dolphin ($20-100)': {
        color: '#C15F3C',
        icon: Fish,
        description: 'Medium spenders between $20-$100',
    },
    'Minnow ($1-20)': {
        color: '#E5A84B',
        icon: Sparkles,
        description: 'Light spenders under $20',
    },
    'Non-Payer': {
        color: '#8F8B82',
        icon: Users,
        description: 'Free-to-play users',
    },
};

// Format utilities
function formatCurrency(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
}

export const SpenderTiersChart = memo(function SpenderTiersChart({
    tiers,
    totalUsers,
    totalRevenue,
    sourceColumns,
    className = '',
}: SpenderTiersChartProps) {
    // Determine data source type
    const sourceType: DataSourceType = tiers.length > 0 ? 'uploaded' : 'unavailable';

    // Calculate derived metrics
    const payingUsers = useMemo(() => {
        return tiers.filter(t => t.tier !== 'Non-Payer').reduce((sum, t) => sum + t.users, 0);
    }, [tiers]);

    const conversionRate = totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0;

    // Chart option for stacked bar chart
    const chartOption = useMemo(() => {
        if (tiers.length === 0) return null;

        const sortedTiers = [...tiers].sort((a, b) => {
            const order = ['Whale ($100+)', 'Dolphin ($20-100)', 'Minnow ($1-20)', 'Non-Payer'];
            return order.indexOf(a.tier) - order.indexOf(b.tier);
        });

        // Only show paying tiers in revenue chart
        const payingTiers = sortedTiers.filter(t => t.tier !== 'Non-Payer');

        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(31, 30, 27, 0.98)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                textStyle: { color: '#FAF9F6', fontFamily: 'DM Sans' },
                padding: [12, 16],
                extraCssText: 'border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.3);',
                formatter: (params: { name: string; value: number; percent: number }) => {
                    const tier = payingTiers.find(t => t.tier === params.name);
                    if (!tier) return '';
                    return `
                        <div class="font-medium">${params.name}</div>
                        <div class="text-slate-400 text-sm mt-1">
                            Revenue: ${formatCurrency(tier.revenue)}<br/>
                            Users: ${formatNumber(tier.users)}<br/>
                            ${params.percent.toFixed(1)}% of payer revenue
                        </div>
                    `;
                },
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: { color: '#C8C4BA', fontSize: 11, fontFamily: 'DM Sans' },
            },
            series: [{
                type: 'pie',
                radius: ['45%', '75%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#1f1e1b',
                    borderWidth: 2,
                },
                label: {
                    show: false,
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: '#fff',
                    },
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
                labelLine: {
                    show: false,
                },
                data: payingTiers.map(tier => ({
                    name: tier.tier,
                    value: tier.revenue,
                    itemStyle: {
                        color: TIER_CONFIG[tier.tier]?.color || '#8F8B82',
                    },
                })),
            }],
        };
    }, [tiers]);

    // No data state
    if (tiers.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-th-bg-surface rounded-2xl border border-th-border p-6 ${className}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E5A84B]/10 border border-[#E5A84B]/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-[#E5A84B]" />
                        </div>
                        <h3 className="font-semibold text-th-text-primary">Spender Segments</h3>
                    </div>
                    <DataSourceIndicator sourceType="unavailable" />
                </div>
                <div className="text-center py-8">
                    <p className="text-th-text-secondary">
                        Upload data with user_id and revenue columns to see spender tiers.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-th-bg-surface rounded-2xl border border-th-border overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="p-4 border-b border-th-border-subtle">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E5A84B]/10 border border-[#E5A84B]/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-[#E5A84B]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-th-text-primary">Spender Segments</h3>
                            <p className="text-sm text-th-text-secondary">Revenue by user tier</p>
                        </div>
                    </div>
                    <DataSourceIndicator
                        sourceType={sourceType}
                        columns={sourceColumns}
                    />
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-th-border-subtle">
                <div className="text-center">
                    <p className="text-2xl font-bold text-th-text-primary">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-th-text-muted">Total Revenue</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-th-text-primary">{formatNumber(payingUsers)}</p>
                    <p className="text-xs text-th-text-muted">Paying Users</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-[#DA7756]">{conversionRate.toFixed(1)}%</p>
                    <p className="text-xs text-th-text-muted">Conversion Rate</p>
                </div>
            </div>

            {/* Chart */}
            {chartOption && (
                <div className="p-4">
                    <ReactEChartsCore
                        echarts={echarts}
                        option={chartOption}
                        style={{ height: 220 }}
                        opts={{ renderer: 'canvas' }}
                        notMerge={true}
                    />
                </div>
            )}

            {/* Tier Breakdown */}
            <div className="px-4 pb-4">
                <div className="space-y-2">
                    {tiers.map((tier, idx) => {
                        const config = TIER_CONFIG[tier.tier] || TIER_CONFIG['Non-Payer'];
                        const Icon = config.icon;
                        const revenuePercent = totalRevenue > 0 ? (tier.revenue / totalRevenue) * 100 : 0;

                        return (
                            <motion.div
                                key={tier.tier}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-3 p-2 rounded-lg bg-th-bg-elevated border border-th-border-subtle"
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${config.color}20` }}
                                >
                                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-th-text-primary truncate">
                                            {tier.tier}
                                        </span>
                                        <span className="text-sm text-th-text-secondary">
                                            {formatNumber(tier.users)} users ({tier.percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="mt-1 h-1.5 bg-th-bg-elevated rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${revenuePercent}%` }}
                                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: config.color }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-th-text-muted">
                                            {formatCurrency(tier.revenue)}
                                        </span>
                                        <span className="text-xs text-th-text-muted">
                                            {revenuePercent.toFixed(1)}% of revenue
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
});

export default SpenderTiersChart;
