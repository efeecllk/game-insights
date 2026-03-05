/**
 * Monetization Page - Obsidian Analytics Design
 *
 * Revenue analytics computed entirely from uploaded data:
 * - Total revenue, ARPU, ARPPU, payer conversion
 * - Daily revenue time series chart
 * - Spender tier breakdown (whale/dolphin/minnow)
 * - Top products by revenue (from product/item columns)
 * - Whale watch summary
 *
 * Shows a helpful empty state when no revenue columns exist.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { DollarSign, TrendingUp, Users, CreditCard, Calendar, Sparkles, AlertTriangle } from 'lucide-react';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';
import { Card } from '../components/ui/Card';

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

interface ProductEntry {
    name: string;
    revenue: number;
    sales: number;
}

interface SpenderTierDisplay {
    tier: string;
    users: number;
    color: string;
}

interface MonetizationData {
    daily: number[];
    arpu: number;
    arppu: number;
    conversionRate: number;
    whaleCount: number;
    whaleRevenue: number;
    whaleRevenuePercent: number;
    spenderTiers: SpenderTierDisplay[];
    topProducts: ProductEntry[];
}

/**
 * Detect whether the uploaded dataset has any revenue-related columns.
 */
function hasRevenueColumns(columns: Array<{ originalName: string; role: string }>): boolean {
    const revenueRoles = ['metric'];
    const revenueKeywords = ['revenue', 'price', 'amount', 'purchase', 'iap', 'ltv', 'spend', 'payment', 'transaction'];

    return columns.some(col => {
        const lower = col.originalName.toLowerCase();
        if (revenueRoles.includes(col.role) && revenueKeywords.some(kw => lower.includes(kw))) {
            return true;
        }
        // Also accept columns that the data provider detects as revenue
        return revenueKeywords.some(kw => lower.includes(kw));
    });
}

export function MonetizationPage() {
    const { dataProvider, hasRealData, rawData, columns } = useGameData();

    // Determine whether we have revenue data at all
    const hasRevenue = useMemo(() => {
        if (!hasRealData) return false;
        // Check column mappings for revenue-related columns
        if (hasRevenueColumns(columns)) return true;
        // Also check if the data provider can compute any revenue
        const totalRev = dataProvider.getTotalRevenue();
        return totalRev > 0;
    }, [hasRealData, columns, dataProvider]);

    // Compute all monetization metrics from real data
    const { data, dates, totalRevenue, avgDaily } = useMemo(() => {
        if (!hasRealData || !hasRevenue) {
            return {
                data: null as MonetizationData | null,
                dates: [] as string[],
                totalRevenue: 0,
                avgDaily: 0,
            };
        }

        // Revenue time series
        const realTimeSeries = dataProvider.getRevenueTimeSeries('daily');
        const chartData = realTimeSeries.map(d => d.value);
        const chartDates = realTimeSeries.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // KPIs
        const realTotalRevenue = dataProvider.getTotalRevenue();
        const realArpu = dataProvider.calculateARPU();
        const realPayerConversion = dataProvider.getPayerConversion() * 100;

        // Spender tiers
        const tierColors = ['#E25C5C', '#C15F3C', '#DA7756', '#5C5954'];
        const realSpenderTiers = dataProvider.getSpenderTiers();
        const transformedTiers: SpenderTierDisplay[] = realSpenderTiers.map((tier, index) => ({
            tier: tier.tier,
            users: tier.users,
            color: tierColors[index] || tierColors[tierColors.length - 1],
        }));

        // Whale stats from spender tiers
        const whaleTier = realSpenderTiers.find(t => t.tier.toLowerCase().includes('whale'));
        const whaleCount = whaleTier?.users ?? 0;
        const whaleRevenue = whaleTier?.revenue ?? 0;
        const whaleRevenuePercent = realTotalRevenue > 0 ? (whaleRevenue / realTotalRevenue) * 100 : 0;

        // ARPPU: total revenue / paying users
        const payingUsers = realSpenderTiers
            .filter(t => !t.tier.toLowerCase().includes('non'))
            .reduce((sum, t) => sum + t.users, 0);
        const arppu = payingUsers > 0 ? realTotalRevenue / payingUsers : 0;

        // Top products: derive from raw data if product/item/sku columns exist
        const topProducts = computeTopProducts(rawData, columns);

        const dailyAvg = chartData.length > 0
            ? chartData.reduce((a, b) => a + b, 0) / chartData.length
            : 0;

        return {
            data: {
                daily: chartData,
                arpu: realArpu,
                arppu,
                conversionRate: realPayerConversion,
                whaleCount,
                whaleRevenue,
                whaleRevenuePercent,
                spenderTiers: transformedTiers,
                topProducts,
            } as MonetizationData,
            dates: chartDates,
            totalRevenue: realTotalRevenue,
            avgDaily: dailyAvg,
        };
    }, [hasRealData, hasRevenue, dataProvider, rawData, columns]);

    // No data uploaded at all
    if (!hasRealData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center mb-6">
                    <DollarSign className="w-8 h-8 text-[#DA7756]" />
                </div>
                <h2 className="text-xl font-display font-bold text-th-text-primary mb-2">
                    No Data Uploaded
                </h2>
                <p className="text-th-text-muted max-w-md">
                    Upload a dataset with revenue or purchase columns to see monetization analytics.
                    Supported columns include revenue, purchase_amount, iap_revenue, price, and transaction values.
                </p>
            </div>
        );
    }

    // Data uploaded but no revenue columns detected
    if (!hasRevenue || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-[#c9a554]/10 border border-[#c9a554]/20 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-[#c9a554]" />
                </div>
                <h2 className="text-xl font-display font-bold text-th-text-primary mb-2">
                    No Revenue Data Found
                </h2>
                <p className="text-th-text-muted max-w-md mb-4">
                    Your uploaded dataset does not contain recognizable revenue or purchase columns.
                    To use this page, include columns like:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {['revenue', 'purchase_amount', 'iap_revenue', 'price', 'ad_revenue', 'ltv'].map(col => (
                        <span key={col} className="px-3 py-1 text-xs font-mono bg-th-bg-elevated/30 border border-th-border-subtle rounded-lg text-th-text-secondary">
                            {col}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

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
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-display font-bold text-th-text-primary">
                                        Monetization
                                    </h1>
                                    <DataModeIndicator />
                                </div>
                                <p className="text-th-text-muted text-sm mt-0.5">Revenue and transaction analytics</p>
                            </div>
                        </div>
                        {dates.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-th-text-secondary bg-th-bg-elevated/30 border border-th-border-subtle rounded-lg">
                                <Calendar className="w-4 h-4" />
                                {dates.length} day{dates.length !== 1 ? 's' : ''} of data
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={`$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    subtitle="All time"
                    icon={DollarSign}
                    color="orange"
                />
                <KPICard
                    title="Avg Daily"
                    value={`$${avgDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    subtitle="Per day"
                    icon={TrendingUp}
                    color="sky"
                />
                <KPICard
                    title="ARPU"
                    value={`$${data.arpu.toFixed(2)}`}
                    subtitle="All users"
                    icon={Users}
                    color="violet"
                />
                <KPICard
                    title="ARPPU"
                    value={`$${data.arppu.toFixed(2)}`}
                    subtitle="Paying users"
                    icon={CreditCard}
                    color="amber"
                />
                <KPICard
                    title="Conversion"
                    value={`${data.conversionRate.toFixed(1)}%`}
                    subtitle="Payer rate"
                    icon={Sparkles}
                    color="secondary"
                />
            </div>

            {/* Revenue Chart */}
            {data.daily.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-[#DA7756]" />
                            </div>
                            <h3 className="font-display font-semibold text-th-text-primary">Daily Revenue</h3>
                        </div>
                        <RevenueChart dates={dates} values={data.daily} />
                    </Card>
                </motion.div>
            )}

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spender Tiers */}
                {data.spenderTiers.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Card variant="default" padding="lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#C15F3C]/10 border border-[#C15F3C]/20 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-[#C15F3C]" />
                                </div>
                                <h3 className="font-display font-semibold text-th-text-primary">Spender Tiers</h3>
                            </div>
                            <SpenderTiersChart data={data.spenderTiers} />
                        </Card>
                    </motion.div>
                )}

                {/* Top Products */}
                {data.topProducts.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Card variant="default" padding="lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#E5A84B]/10 border border-[#E5A84B]/20 flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-[#E5A84B]" />
                                </div>
                                <h3 className="font-display font-semibold text-th-text-primary">Top Products</h3>
                            </div>
                            <div className="space-y-3">
                                {data.topProducts.map((product, index) => (
                                    <motion.div
                                        key={product.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-th-bg-elevated/20 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-lg bg-th-bg-elevated/30 border border-th-border-subtle flex items-center justify-center text-xs font-medium text-th-text-muted group-hover:text-[#DA7756] group-hover:border-[#DA7756]/20 transition-colors">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm text-th-text-secondary">{product.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-th-text-primary">${product.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                            <div className="text-xs text-th-text-muted">{product.sales.toLocaleString()} transactions</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Whale Alert */}
            {data.whaleCount > 0 && (
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg" className="border-[#E25C5C]/20 bg-gradient-to-br from-[#E25C5C]/5 to-transparent">
                        <div className="flex items-center gap-3 mb-3">
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.3 }}
                                className="text-3xl"
                            >
                                🐋
                            </motion.span>
                            <h3 className="font-display font-semibold text-th-text-primary">Whale Watch</h3>
                        </div>
                        <p className="text-th-text-secondary">
                            You have{' '}
                            <span className="font-bold text-[#E25C5C]">{data.whaleCount.toLocaleString()}</span>{' '}
                            whale users ($100+ spent). They contribute{' '}
                            <span className="font-bold text-th-text-primary">
                                {data.whaleRevenuePercent.toFixed(1)}%
                            </span>{' '}
                            of total revenue (${data.whaleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}).
                        </p>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}

/**
 * Compute top products from raw data by looking for product/item/sku columns
 * paired with a revenue/price/amount column.
 */
function computeTopProducts(
    rawData: Record<string, unknown>[],
    columns: Array<{ originalName: string; role: string }>
): ProductEntry[] {
    if (!rawData || rawData.length === 0) return [];

    const productKeywords = ['product', 'item', 'sku', 'bundle', 'pack', 'offer'];
    const revenueKeywords = ['revenue', 'price', 'amount', 'purchase', 'spend', 'payment', 'cost'];

    // Find product column
    const productCol = columns.find(col =>
        productKeywords.some(kw => col.originalName.toLowerCase().includes(kw))
    )?.originalName;

    // Find revenue column
    const revenueCol = columns.find(col =>
        revenueKeywords.some(kw => col.originalName.toLowerCase().includes(kw))
    )?.originalName;

    if (!productCol || !revenueCol) return [];

    // Aggregate revenue and count per product
    const productMap = new Map<string, { revenue: number; count: number }>();

    for (const row of rawData) {
        const product = String(row[productCol] ?? '').trim();
        const revenue = Number(row[revenueCol]) || 0;

        if (!product || revenue <= 0) continue;

        const existing = productMap.get(product) || { revenue: 0, count: 0 };
        existing.revenue += revenue;
        existing.count += 1;
        productMap.set(product, existing);
    }

    return Array.from(productMap.entries())
        .map(([name, stats]) => ({
            name,
            revenue: Math.round(stats.revenue * 100) / 100,
            sales: stats.count,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
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
}) {
    const colorStyles = {
        orange: {
            bg: 'bg-[#DA7756]/15',
            border: 'border-[#DA7756]/20',
            icon: 'text-[#DA7756]',
        },
        sky: {
            bg: 'bg-[#A68B5B]/15',
            border: 'border-[#A68B5B]/20',
            icon: 'text-[#A68B5B]',
        },
        violet: {
            bg: 'bg-[#C15F3C]/15',
            border: 'border-[#C15F3C]/20',
            icon: 'text-[#C15F3C]',
        },
        amber: {
            bg: 'bg-[#E5A84B]/15',
            border: 'border-[#E5A84B]/20',
            icon: 'text-[#E5A84B]',
        },
        secondary: {
            bg: 'bg-[#C15F3C]/15',
            border: 'border-[#C15F3C]/20',
            icon: 'text-[#C15F3C]',
        },
    };

    const styles = colorStyles[color];

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            className="relative group"
        >
            <div className={`${styles.bg} rounded-2xl p-4 border ${styles.border} group-hover:border-th-border-strong transition-colors duration-200 overflow-hidden`}>
                <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${styles.icon}`} />
                    <span className="text-sm text-th-text-muted">{title}</span>
                </div>
                <div className="text-2xl font-display font-bold text-th-text-primary">{value}</div>
                <div className="text-xs text-th-text-muted mt-1">{subtitle}</div>
            </div>
        </motion.div>
    );
}

function RevenueChart({ dates, values }: { dates: string[]; values: number[] }) {
    // Determine smart y-axis formatter based on magnitude
    const maxVal = Math.max(...values, 1);
    const formatYAxis = (val: number) => {
        if (maxVal >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (maxVal >= 1000) return `$${(val / 1000).toFixed(1)}k`;
        return `$${val}`;
    };

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            textStyle: {
                color: '#FAF9F6',
                fontFamily: 'DM Sans',
            },
            padding: [12, 16],
            extraCssText: 'border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.3);',
            formatter: (params: Array<{ name: string; value: number }>) =>
                `<div style="font-weight: 500">${params[0].name}</div><div style="color: #DA7756; margin-top: 4px">$${params[0].value.toLocaleString()}</div>`
        },
        grid: { left: 60, right: 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
            axisLabel: {
                color: '#8F8B82',
                fontSize: 11,
                fontFamily: 'DM Sans',
                rotate: dates.length > 14 ? 45 : 0,
            },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: {
                color: '#8F8B82',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                formatter: formatYAxis,
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
                        { offset: 1, color: '#C15F3C' }
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
                            { offset: 0, color: '#DA7756' },
                            { offset: 1, color: '#DA7756' }
                        ]
                    }
                }
            }
        }]
    };

    return <ReactECharts option={option} style={{ height: 300 }} />;
}

function SpenderTiersChart({ data }: { data: SpenderTierDisplay[] }) {
    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            textStyle: {
                color: '#FAF9F6',
                fontFamily: 'DM Sans',
            },
            padding: [12, 16],
            extraCssText: 'border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.3);',
            formatter: (params: { name: string; value: number; percent: number }) =>
                `<div style="font-weight: 500">${params.name}</div><div style="margin-top: 4px">${params.value.toLocaleString()} users</div><div style="color: #DA7756">${params.percent.toFixed(1)}%</div>`
        },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: {
                fontSize: 11,
                color: '#C8C4BA',
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
