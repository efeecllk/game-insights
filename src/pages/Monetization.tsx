/**
 * Monetization Page - Revenue Analytics
 * Revenue charts, ARPU, spender tiers
 * Phase 2: Page-by-Page Functionality
 */

import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { DollarSign, TrendingUp, Users, CreditCard, Calendar } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';

// Sample revenue data by game type
const revenueData = {
    puzzle: {
        daily: [1200, 1450, 1100, 1800, 2200, 1900, 2100, 2400, 1850, 2000, 2300, 2150, 1950, 2500],
        arpu: 0.45,
        arppu: 8.50,
        conversionRate: 5.3,
        whales: 42,
        spenderTiers: [
            { tier: '$0 (F2P)', users: 85000, color: 'var(--color-border-subtle)' },
            { tier: '$1-10', users: 4200, color: '#86efac' },
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
            { tier: '$0 (F2P)', users: 120000, color: 'var(--color-border-subtle)' },
            { tier: '$1-50', users: 8500, color: '#86efac' },
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
            { tier: '$0 (F2P)', users: 180000, color: 'var(--color-border-subtle)' },
            { tier: '$1-20', users: 12000, color: '#86efac' },
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
        const tierColors = ['var(--color-border-subtle)', '#86efac', '#fbbf24', '#f97316', '#ef4444'];
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-th-text-primary flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-th-success" />
                            Monetization
                        </h1>
                        <DataModeIndicator />
                    </div>
                    <p className="text-th-text-muted mt-1">Revenue and transaction analytics</p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-th-text-secondary bg-th-bg-elevated rounded-lg hover:bg-th-interactive-hover flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Last 14 days
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={`$${totalRevenue.toLocaleString()}`}
                    subtitle="Last 14 days"
                    icon={DollarSign}
                    color="text-th-success"
                />
                <KPICard
                    title="Avg Daily"
                    value={`$${avgDaily.toFixed(0)}`}
                    subtitle="Per day"
                    icon={TrendingUp}
                    color="text-blue-600"
                />
                <KPICard
                    title="ARPU"
                    value={`$${data.arpu}`}
                    subtitle="All users"
                    icon={Users}
                    color="text-th-accent-primary"
                />
                <KPICard
                    title="ARPPU"
                    value={`$${data.arppu}`}
                    subtitle="Paying users"
                    icon={CreditCard}
                    color="text-orange-600"
                />
                <KPICard
                    title="Conversion"
                    value={`${data.conversionRate}%`}
                    subtitle="Payer rate"
                    icon={TrendingUp}
                    color="text-emerald-600"
                />
            </div>

            {/* Revenue Chart */}
            <div className="bg-th-bg-surface rounded-card border border-th-border p-6">
                <h3 className="font-medium text-th-text-primary mb-4">Daily Revenue</h3>
                <RevenueChart dates={dates} values={data.daily} />
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spender Tiers */}
                <div className="bg-th-bg-surface rounded-card border border-th-border p-6">
                    <h3 className="font-medium text-th-text-primary mb-4">Spender Tiers</h3>
                    <SpenderTiersChart data={data.spenderTiers} />
                </div>

                {/* Top Products */}
                <div className="bg-th-bg-surface rounded-card border border-th-border p-6">
                    <h3 className="font-medium text-th-text-primary mb-4">Top Products</h3>
                    <div className="space-y-3">
                        {data.topProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-th-text-muted w-5">{index + 1}</span>
                                    <span className="text-sm text-th-text-primary">{product.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-th-text-primary">${product.revenue.toLocaleString()}</div>
                                    <div className="text-xs text-th-text-muted">{product.sales.toLocaleString()} sales</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Whale Alert */}
            <div className="bg-th-error-muted rounded-card border border-th-error/20 p-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🐋</span>
                    <h3 className="font-medium text-th-text-primary">Whale Watch</h3>
                </div>
                <p className="text-th-text-secondary">
                    You have <span className="font-bold text-th-error">{data.whales}</span> whale users ($100+ spent).
                    They contribute approximately <span className="font-bold">{((data.whales * 150) / totalRevenue * 100).toFixed(0)}%</span> of total revenue.
                </p>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon: Icon, color }: {
    title: string;
    value: string;
    subtitle: string;
    icon: typeof DollarSign;
    color: string;
}) {
    return (
        <div className="bg-th-bg-surface rounded-card border border-th-border p-4">
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-th-text-muted">{title}</span>
            </div>
            <div className="text-2xl font-bold text-th-text-primary">{value}</div>
            <div className="text-xs text-th-text-muted mt-1">{subtitle}</div>
        </div>
    );
}

function RevenueChart({ dates, values }: { dates: string[]; values: number[] }) {
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params: Array<{ name: string; value: number }>) =>
                `${params[0].name}<br/>Revenue: $${params[0].value.toLocaleString()}`
        },
        grid: { left: 60, right: 20, top: 20, bottom: 40 },
        xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: 'var(--color-border-subtle)' } },
            axisLabel: { color: 'var(--color-text-muted)', fontSize: 11, rotate: 45 },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: 'var(--color-text-muted)', formatter: (val: number) => `$${val / 1000}k` },
            splitLine: { lineStyle: { color: 'var(--color-border-subtle)' } }
        },
        series: [{
            type: 'bar',
            data: values,
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#10b981' },
                        { offset: 1, color: '#059669' }
                    ]
                },
                borderRadius: [4, 4, 0, 0]
            },
            emphasis: { itemStyle: { color: '#047857' } }
        }]
    };

    return <ReactECharts option={option} style={{ height: 300 }} />;
}

function SpenderTiersChart({ data }: { data: Array<{ tier: string; users: number; color: string }> }) {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: { name: string; value: number; percent: number }) =>
                `${params.name}<br/>Users: ${params.value.toLocaleString()}<br/>Percent: ${params.percent}%`
        },
        legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11 } },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
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
