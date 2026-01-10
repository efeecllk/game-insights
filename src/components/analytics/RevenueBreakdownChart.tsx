/**
 * RevenueBreakdownChart Component - Obsidian Analytics Design
 *
 * Shows revenue breakdown by different dimensions:
 * - By source/channel (organic, paid ads, etc.)
 * - By country/region
 * - By platform (iOS, Android, Web)
 * - By product category
 *
 * Derived from actual uploaded data with column detection.
 */

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { echarts } from '@/lib/echarts';
import { PieChart, BarChart2, Globe, Smartphone, Tag, ChevronDown } from 'lucide-react';
import { DataSourceIndicator, DataSourceType } from './DataSourceIndicator';

export interface RevenueBreakdown {
    dimension: string;
    value: number;
    percentage: number;
    userCount?: number;
}

export type BreakdownDimension = 'source' | 'country' | 'platform' | 'product' | 'custom';

interface RevenueBreakdownChartProps {
    breakdowns: Record<BreakdownDimension, RevenueBreakdown[]>;
    totalRevenue: number;
    sourceColumns?: Record<BreakdownDimension, string>;
    defaultDimension?: BreakdownDimension;
    className?: string;
}

const DIMENSION_CONFIG: Record<BreakdownDimension, {
    label: string;
    icon: React.ElementType;
    color: string;
}> = {
    source: { label: 'By Source', icon: BarChart2, color: '#DA7756' },
    country: { label: 'By Country', icon: Globe, color: '#C15F3C' },
    platform: { label: 'By Platform', icon: Smartphone, color: '#E5A84B' },
    product: { label: 'By Product', icon: Tag, color: '#8F8B82' },
    custom: { label: 'Custom', icon: PieChart, color: '#A68B5B' },
};

const CHART_COLORS = [
    '#DA7756',
    '#C15F3C',
    '#E5A84B',
    '#A68B5B',
    '#8B7355',
    '#B89B7D',
    '#8F8B82',
    '#7A8B5B',
];

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

export const RevenueBreakdownChart = memo(function RevenueBreakdownChart({
    breakdowns,
    totalRevenue,
    sourceColumns,
    defaultDimension = 'source',
    className = '',
}: RevenueBreakdownChartProps) {
    // Find first available dimension
    const availableDimensions = useMemo(() => {
        return (Object.keys(breakdowns) as BreakdownDimension[]).filter(
            dim => breakdowns[dim] && breakdowns[dim].length > 0
        );
    }, [breakdowns]);

    const [selectedDimension, setSelectedDimension] = useState<BreakdownDimension>(
        availableDimensions.includes(defaultDimension)
            ? defaultDimension
            : availableDimensions[0] || 'source'
    );

    const [showDimensionDropdown, setShowDimensionDropdown] = useState(false);

    const currentData = breakdowns[selectedDimension] || [];
    const currentConfig = DIMENSION_CONFIG[selectedDimension];

    // Determine data source type
    const sourceType: DataSourceType = currentData.length > 0 ? 'uploaded' : 'unavailable';

    // Chart option
    const chartOption = useMemo(() => {
        if (currentData.length === 0) return null;

        const sortedData = [...currentData].sort((a, b) => b.value - a.value).slice(0, 8);

        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(15, 23, 42, 0.98)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                textStyle: { color: '#FAF9F6', fontFamily: 'DM Sans' },
                padding: [12, 16],
                extraCssText: 'border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.3);',
                formatter: (params: { name: string; value: number; percent: number; data: { userCount?: number } }) => {
                    return `
                        <div class="font-medium">${params.name}</div>
                        <div class="text-slate-400 text-sm mt-1">
                            Revenue: ${formatCurrency(params.value)}<br/>
                            ${params.percent.toFixed(1)}% of total
                            ${params.data.userCount ? `<br/>Users: ${formatNumber(params.data.userCount)}` : ''}
                        </div>
                    `;
                },
            },
            legend: {
                show: sortedData.length <= 6,
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: { color: '#C8C4BA', fontSize: 11, fontFamily: 'DM Sans' },
            },
            series: [{
                type: 'pie',
                radius: sortedData.length <= 6 ? ['40%', '70%'] : ['35%', '65%'],
                center: sortedData.length <= 6 ? ['35%', '50%'] : ['50%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#0f172a',
                    borderWidth: 2,
                },
                label: {
                    show: sortedData.length > 6,
                    position: 'outside',
                    color: '#C8C4BA',
                    fontSize: 11,
                    formatter: '{b}: {d}%',
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
                    show: sortedData.length > 6,
                    lineStyle: { color: 'rgba(255,255,255,0.2)' },
                },
                data: sortedData.map((item, idx) => ({
                    name: item.dimension,
                    value: item.value,
                    userCount: item.userCount,
                    itemStyle: {
                        color: CHART_COLORS[idx % CHART_COLORS.length],
                    },
                })),
            }],
        };
    }, [currentData]);

    // No data at all
    if (availableDimensions.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900 rounded-2xl border border-slate-700 p-6 ${className}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                            <PieChart className="w-5 h-5 text-[#DA7756]" />
                        </div>
                        <h3 className="font-semibold text-white">Revenue Breakdown</h3>
                    </div>
                    <DataSourceIndicator sourceType="unavailable" />
                </div>
                <div className="text-center py-8">
                    <p className="text-slate-400">
                        Upload data with revenue and category columns (source, country, platform, or product) to see breakdown.
                    </p>
                </div>
            </motion.div>
        );
    }

    const Icon = currentConfig.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden ${className}`}
        >
            {/* Header with dimension selector */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${currentConfig.color}20`, border: `1px solid ${currentConfig.color}30` }}
                        >
                            <Icon className="w-5 h-5" style={{ color: currentConfig.color }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Revenue Breakdown</h3>
                            <p className="text-sm text-slate-400">{formatCurrency(totalRevenue)} total</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dimension selector */}
                        {availableDimensions.length > 1 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDimensionDropdown(!showDimensionDropdown)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/[0.03] border border-slate-700 rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    <span className="text-white">{currentConfig.label}</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDimensionDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {showDimensionDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 top-full mt-1 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden"
                                        >
                                            {availableDimensions.map(dim => {
                                                const config = DIMENSION_CONFIG[dim];
                                                const DimIcon = config.icon;
                                                return (
                                                    <button
                                                        key={dim}
                                                        onClick={() => {
                                                            setSelectedDimension(dim);
                                                            setShowDimensionDropdown(false);
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.05] transition-colors ${
                                                            selectedDimension === dim ? 'bg-white/[0.05] text-white' : 'text-slate-300'
                                                        }`}
                                                    >
                                                        <DimIcon className="w-4 h-4" style={{ color: config.color }} />
                                                        {config.label}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <DataSourceIndicator
                            sourceType={sourceType}
                            columns={sourceColumns ? [sourceColumns[selectedDimension]] : undefined}
                        />
                    </div>
                </div>
            </div>

            {/* Chart */}
            {chartOption && (
                <div className="p-4">
                    <ReactEChartsCore
                        echarts={echarts}
                        option={chartOption}
                        style={{ height: 260 }}
                        opts={{ renderer: 'canvas' }}
                        notMerge={true}
                    />
                </div>
            )}

            {/* Top items breakdown */}
            {currentData.length > 0 && (
                <div className="px-4 pb-4">
                    <p className="text-xs text-slate-500 mb-2">Top Contributors</p>
                    <div className="space-y-1">
                        {currentData.slice(0, 5).map((item, idx) => (
                            <motion.div
                                key={item.dimension}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                />
                                <span className="flex-1 text-sm text-slate-300 truncate">
                                    {item.dimension}
                                </span>
                                <span className="text-sm text-slate-400">
                                    {formatCurrency(item.value)}
                                </span>
                                <span className="text-xs text-slate-500 w-12 text-right">
                                    {item.percentage.toFixed(1)}%
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
});

export default RevenueBreakdownChart;
