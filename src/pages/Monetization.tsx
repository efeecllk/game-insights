/**
 * Monetization Page - Obsidian Analytics Design
 *
 * Premium revenue analytics with:
 * - Glassmorphism containers
 * - Warm orange accent theme
 * - Animated entrance effects
 * - Enhanced chart styling
 * - Noise texture backgrounds
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { DollarSign, TrendingUp, Users, CreditCard, Calendar, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';
import { Card } from '../components/ui/Card';

// Sample revenue data by game type
const revenueData = {
    puzzle: {
        daily: [1200, 1450, 1100, 1800, 2200, 1900, 2100, 2400, 1850, 2000, 2300, 2150, 1950, 2500],
        arpu: 0.45,
        arppu: 8.50,
        conversionRate: 5.3,
        whales: 42,
        spenderTiers: [
            { tier: '$0 (F2P)', users: 85000, color: '#475569' },
            { tier: '$1-10', users: 4200, color: '#DA7756' },
            { tier: '$10-50', users: 850, color: '#fbbf24' },
            { tier: '$50-100', users: 180, color: '#f97316' },
            { tier: '$100+', users: 42, color: '#ef4444' },
        ],
        topProducts: [
            { name: 'Coin Pack 500', revenue: 4500, sales: 900 },
            { name: 'Starter Bundle', revenue: 3200, sales: 640 },
            { name: 'No Ads', revenue: 2800, sales: 280 },
            { name: 'VIP Pass', revenue: 2100, sales: 140 },
            { name: 'Mega Pack', revenue: 1800, sales: 36 },
        ]
    },
    gacha_rpg: {
        daily: [8500, 12000, 9800, 45000, 22000, 15000, 18000, 11000, 9500, 35000, 28000, 14000, 16000, 21000],
        arpu: 2.80,
        arppu: 45.00,
        conversionRate: 6.2,
        whales: 180,
        spenderTiers: [
            { tier: '$0 (F2P)', users: 120000, color: '#475569' },
            { tier: '$1-50', users: 8500, color: '#DA7756' },
            { tier: '$50-200', users: 2100, color: '#fbbf24' },
            { tier: '$200-500', users: 650, color: '#f97316' },
            { tier: '$500+', users: 180, color: '#ef4444' },
        ],
        topProducts: [
            { name: 'Crystal Pack x100', revenue: 28000, sales: 5600 },
            { name: 'Limited Banner', revenue: 45000, sales: 900 },
            { name: 'Monthly Pass', revenue: 12000, sales: 1200 },
            { name: 'Starter Pack', revenue: 8500, sales: 1700 },
            { name: 'Stamina Refill', revenue: 4200, sales: 4200 },
        ]
    },
    battle_royale: {
        daily: [5200, 5800, 4900, 6500, 12000, 15000, 8500, 7200, 6100, 5900, 6800, 7500, 8200, 9000],
        arpu: 0.85,
        arppu: 15.00,
        conversionRate: 5.7,
        whales: 95,
        spenderTiers: [
            { tier: '$0 (F2P)', users: 180000, color: '#475569' },
            { tier: '$1-20', users: 12000, color: '#DA7756' },
            { tier: '$20-50', users: 3500, color: '#fbbf24' },
            { tier: '$50-100', users: 850, color: '#f97316' },
            { tier: '$100+', users: 95, color: '#ef4444' },
        ],
        topProducts: [
            { name: 'Battle Pass', revenue: 45000, sales: 4500 },
            { name: 'Skin Bundle', revenue: 18000, sales: 900 },
            { name: 'Season Pass', revenue: 12000, sales: 800 },
            { name: 'Emote Pack', revenue: 5400, sales: 1080 },
            { name: 'XP Boost', revenue: 3200, sales: 640 },
        ]
    },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
        },
    },
};

export function MonetizationPage() {
    const { selectedGame } = useGame();
    const { dataProvider, hasRealData } = useGameData();
    const [_dateRange] = useState('last14days');

    // Get real or demo data based on data availability
    const { data, dates, totalRevenue, avgDaily } = useMemo(() => {
        // Default demo data for the selected game
        const demoData = revenueData[selectedGame as keyof typeof revenueData] || revenueData.puzzle;

        // Generate date labels for the last 14 days
        const dateLabels = Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        if (!hasRealData) {
            const total = demoData.daily.reduce((a, b) => a + b, 0);
            return {
                data: demoData,
                dates: dateLabels,
                totalRevenue: total,
                avgDaily: total / demoData.daily.length,
                spenderTiers: demoData.spenderTiers,
                revenueTimeSeries: demoData.daily,
            };
        }

        // Use real data from provider
        const realSpenderTiers = dataProvider.getSpenderTiers();
        const realTimeSeries = dataProvider.getRevenueTimeSeries('daily');
        const realArpu = dataProvider.calculateARPU();
        const realTotalRevenue = dataProvider.getTotalRevenue();
        const realPayerConversion = dataProvider.getPayerConversion() * 100;

        // Transform spender tiers for chart
        const tierColors = ['#475569', '#DA7756', '#fbbf24', '#f97316', '#ef4444'];
        const transformedTiers = realSpenderTiers.map((tier, index) => ({
            tier: tier.tier,
            users: tier.users,
            color: tierColors[index] || tierColors[0],
        }));

        // Transform time series for chart
        const chartData = realTimeSeries.slice(-14).map(d => d.value);
        const chartDates = realTimeSeries.slice(-14).map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Calculate whale count (users in highest tier)
        const whaleCount = realSpenderTiers.length > 0 ? realSpenderTiers[0].users : 0;

        // Calculate ARPPU (revenue from paying users / paying users)
        const payingUsers = realSpenderTiers
            .filter((_, i) => i < realSpenderTiers.length - 1) // Exclude non-payers
            .reduce((sum, t) => sum + t.users, 0);
        const payerRevenue = realSpenderTiers
            .filter((_, i) => i < realSpenderTiers.length - 1)
            .reduce((sum, t) => sum + t.revenue, 0);
        const arppu = payingUsers > 0 ? payerRevenue / payingUsers : 0;

        return {
            data: {
                daily: chartData.length > 0 ? chartData : demoData.daily,
                arpu: realArpu || demoData.arpu,
                arppu: arppu || demoData.arppu,
                conversionRate: realPayerConversion || demoData.conversionRate,
                whales: whaleCount || demoData.whales,
                spenderTiers: transformedTiers.length > 0 ? transformedTiers : demoData.spenderTiers,
                topProducts: demoData.topProducts, // Keep demo products until we have real product data
            },
            dates: chartDates.length > 0 ? chartDates : dateLabels,
            totalRevenue: realTotalRevenue || demoData.daily.reduce((a, b) => a + b, 0),
            avgDaily: chartData.length > 0 ? chartData.reduce((a, b) => a + b, 0) / chartData.length : demoData.daily.reduce((a, b) => a + b, 0) / demoData.daily.length,
            spenderTiers: transformedTiers.length > 0 ? transformedTiers : demoData.spenderTiers,
            revenueTimeSeries: chartData.length > 0 ? chartData : demoData.daily,
        };
    }, [selectedGame, hasRealData, dataProvider]);

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
                            {/* Icon with glow */}
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <div className="absolute inset-0 bg-[#DA7756]/30 rounded-xl blur-lg" />
                                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#DA7756]/20 to-[#DA7756]/10 border border-[#DA7756]/30 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                        Monetization
                                    </h1>
                                    <DataModeIndicator />
                                </div>
                                <p className="text-slate-500 text-sm mt-0.5">Revenue and transaction analytics</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.06] hover:border-white/[0.12] transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            Last 14 days
                        </motion.button>
                    </div>
                </Card>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={`$${totalRevenue.toLocaleString()}`}
                    subtitle="Last 14 days"
                    icon={DollarSign}
                    color="orange"
                    index={0}
                />
                <KPICard
                    title="Avg Daily"
                    value={`$${avgDaily.toFixed(0)}`}
                    subtitle="Per day"
                    icon={TrendingUp}
                    color="sky"
                    index={1}
                />
                <KPICard
                    title="ARPU"
                    value={`$${data.arpu}`}
                    subtitle="All users"
                    icon={Users}
                    color="violet"
                    index={2}
                />
                <KPICard
                    title="ARPPU"
                    value={`$${data.arppu}`}
                    subtitle="Paying users"
                    icon={CreditCard}
                    color="amber"
                    index={3}
                />
                <KPICard
                    title="Conversion"
                    value={`${data.conversionRate}%`}
                    subtitle="Payer rate"
                    icon={Sparkles}
                    color="secondary"
                    index={4}
                />
            </div>

            {/* Revenue Chart */}
            <motion.div variants={itemVariants}>
                <Card variant="default" padding="lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#DA7756]" />
                        </div>
                        <h3 className="font-display font-semibold text-white">Daily Revenue</h3>
                    </div>
                    <RevenueChart dates={dates} values={data.daily} />
                </Card>
            </motion.div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spender Tiers */}
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#C15F3C]/10 border border-[#C15F3C]/20 flex items-center justify-center">
                                <Users className="w-4 h-4 text-[#C15F3C]" />
                            </div>
                            <h3 className="font-display font-semibold text-white">Spender Tiers</h3>
                        </div>
                        <SpenderTiersChart data={data.spenderTiers} />
                    </Card>
                </motion.div>

                {/* Top Products */}
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="font-display font-semibold text-white">Top Products</h3>
                        </div>
                        <div className="space-y-3">
                            {data.topProducts.map((product, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xs font-medium text-slate-500 group-hover:text-[#DA7756] group-hover:border-[#DA7756]/20 transition-colors">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm text-slate-300">{product.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-white">${product.revenue.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500">{product.sales.toLocaleString()} sales</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Whale Alert */}
            <motion.div variants={itemVariants}>
                <Card variant="default" padding="lg" className="border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
                    <div className="flex items-center gap-3 mb-3">
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.3 }}
                            className="text-3xl"
                        >
                            🐋
                        </motion.span>
                        <h3 className="font-display font-semibold text-white">Whale Watch</h3>
                    </div>
                    <p className="text-slate-400">
                        You have{' '}
                        <span className="font-bold text-rose-400">{data.whales}</span>{' '}
                        whale users ($100+ spent). They contribute approximately{' '}
                        <span className="font-bold text-white">
                            {((data.whales * 150) / totalRevenue * 100).toFixed(0)}%
                        </span>{' '}
                        of total revenue.
                    </p>
                </Card>
            </motion.div>
        </motion.div>
    );
}

function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: typeof DollarSign;
    color: 'orange' | 'sky' | 'violet' | 'amber' | 'secondary';
    index?: number;
}) {
    const colorStyles = {
        orange: {
            bg: 'from-[#DA7756]/20 to-[#DA7756]/5',
            border: 'border-[#DA7756]/20 group-hover:border-[#DA7756]/30',
            icon: 'text-[#DA7756]',
            glow: 'bg-[#DA7756]/20',
        },
        sky: {
            bg: 'from-[#A68B5B]/20 to-[#A68B5B]/5',
            border: 'border-[#A68B5B]/20 group-hover:border-[#A68B5B]/30',
            icon: 'text-[#A68B5B]',
            glow: 'bg-[#A68B5B]/20',
        },
        violet: {
            bg: 'from-[#C15F3C]/20 to-[#C15F3C]/5',
            border: 'border-[#C15F3C]/20 group-hover:border-[#C15F3C]/30',
            icon: 'text-[#C15F3C]',
            glow: 'bg-[#C15F3C]/20',
        },
        amber: {
            bg: 'from-amber-500/20 to-amber-500/5',
            border: 'border-amber-500/20 group-hover:border-amber-500/30',
            icon: 'text-amber-400',
            glow: 'bg-amber-500/20',
        },
        secondary: {
            bg: 'from-[#C15F3C]/20 to-[#C15F3C]/5',
            border: 'border-[#C15F3C]/20 group-hover:border-[#C15F3C]/30',
            icon: 'text-[#C15F3C]',
            glow: 'bg-[#C15F3C]/20',
        },
    };

    const styles = colorStyles[color];

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            className="relative group"
        >
            {/* Glow effect */}
            <div className={`absolute -inset-0.5 ${styles.glow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

            <div className={`relative bg-gradient-to-br ${styles.bg} backdrop-blur-xl rounded-2xl p-4 border ${styles.border} transition-all duration-300 overflow-hidden`}>
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${styles.icon}`} />
                        <span className="text-sm text-slate-500">{title}</span>
                    </div>
                    <div className="text-2xl font-display font-bold text-white">{value}</div>
                    <div className="text-xs text-slate-600 mt-1">{subtitle}</div>
                </div>
            </div>
        </motion.div>
    );
}

function RevenueChart({ dates, values }: { dates: string[]; values: number[] }) {
    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            textStyle: {
                color: '#f1f5f9',
                fontFamily: 'DM Sans',
            },
            padding: [12, 16],
            extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;',
            formatter: (params: Array<{ name: string; value: number }>) =>
                `<div style="font-weight: 500">${params[0].name}</div><div style="color: #DA7756; margin-top: 4px">$${params[0].value.toLocaleString()}</div>`
        },
        grid: { left: 60, right: 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                fontFamily: 'DM Sans',
                rotate: 45,
            },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                formatter: (val: number) => `$${val / 1000}k`,
            },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)' } }
        },
        series: [{
            type: 'bar',
            data: values,
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#DA7756' },
                        { offset: 1, color: '#C56545' }
                    ]
                },
                borderRadius: [6, 6, 0, 0]
            },
            emphasis: {
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#E8937A' },
                            { offset: 1, color: '#DA7756' }
                        ]
                    }
                }
            }
        }]
    };

    return <ReactECharts option={option} style={{ height: 300 }} />;
}

function SpenderTiersChart({ data }: { data: Array<{ tier: string; users: number; color: string }> }) {
    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            textStyle: {
                color: '#f1f5f9',
                fontFamily: 'DM Sans',
            },
            padding: [12, 16],
            extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;',
            formatter: (params: { name: string; value: number; percent: number }) =>
                `<div style="font-weight: 500">${params.name}</div><div style="margin-top: 4px">${params.value.toLocaleString()} users</div><div style="color: #DA7756">${params.percent.toFixed(1)}%</div>`
        },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: {
                fontSize: 11,
                color: '#94a3b8',
                fontFamily: 'DM Sans',
            },
            itemWidth: 12,
            itemHeight: 12,
            itemGap: 12,
        },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            label: { show: false },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#fff',
                },
                scaleSize: 8,
            },
            itemStyle: {
                borderRadius: 4,
                borderColor: '#0f172a',
                borderWidth: 2,
            },
            data: data.map(d => ({
                name: d.tier,
                value: d.users,
                itemStyle: { color: d.color }
            }))
        }]
    };

    return <ReactECharts option={option} style={{ height: 250 }} />;
}

export default MonetizationPage;
