/**
 * DAUTrendChart Component - Obsidian Analytics Design
 *
 * Shows Daily Active Users trend over time:
 * - Line chart with area fill
 * - Period selector (7d, 30d, 90d)
 * - Calculated from actual uploaded data
 * - Shows trend direction and statistics
 */

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { echarts } from '@/lib/echarts';
import { Users, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import { DataSourceIndicator, DataSourceType } from './DataSourceIndicator';

export interface DAUDataPoint {
    date: string;
    users: number;
}

interface DAUTrendChartProps {
    data: DAUDataPoint[];
    currentDAU?: number;
    currentMAU?: number;
    sourceColumns?: string[];
    className?: string;
}

type Period = '7d' | '30d' | '90d' | 'all';

function formatNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
}

function formatDate(dateStr: string, short: boolean = false): string {
    const date = new Date(dateStr);
    if (short) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateTrend(data: DAUDataPoint[]): { direction: 'up' | 'down' | 'neutral'; percent: number } {
    if (data.length < 2) return { direction: 'neutral', percent: 0 };

    const recentHalf = data.slice(Math.floor(data.length / 2));
    const olderHalf = data.slice(0, Math.floor(data.length / 2));

    const recentAvg = recentHalf.reduce((sum, d) => sum + d.users, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, d) => sum + d.users, 0) / olderHalf.length;

    if (olderAvg === 0) return { direction: 'neutral', percent: 0 };

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (percentChange > 2) return { direction: 'up', percent: Math.abs(percentChange) };
    if (percentChange < -2) return { direction: 'down', percent: Math.abs(percentChange) };
    return { direction: 'neutral', percent: Math.abs(percentChange) };
}

export const DAUTrendChart = memo(function DAUTrendChart({
    data,
    currentDAU,
    currentMAU,
    sourceColumns,
    className = '',
}: DAUTrendChartProps) {
    const [period, setPeriod] = useState<Period>('30d');

    // Filter data by period
    const filteredData = useMemo(() => {
        if (data.length === 0) return [];

        const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

        if (period === 'all') return sorted;

        const now = new Date();
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        return sorted.filter(d => new Date(d.date) >= cutoff);
    }, [data, period]);

    // Determine data source type
    const sourceType: DataSourceType = filteredData.length > 0 ? 'uploaded' : 'unavailable';

    // Calculate statistics
    const stats = useMemo(() => {
        if (filteredData.length === 0) return null;

        const values = filteredData.map(d => d.users);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const trend = calculateTrend(filteredData);

        return { avg, max, min, trend };
    }, [filteredData]);

    // Chart option
    const chartOption = useMemo(() => {
        if (filteredData.length === 0) return null;

        return {
            grid: { top: 20, right: 20, bottom: 30, left: 50 },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(15, 23, 42, 0.98)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                textStyle: { color: '#FAF9F6', fontFamily: 'DM Sans' },
                padding: [12, 16],
                extraCssText: 'border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.3);',
                formatter: (params: { name: string; value: number }[]) => {
                    const p = params[0];
                    return `
                        <div class="font-medium">${formatDate(p.name)}</div>
                        <div class="text-lg font-bold mt-1">${formatNumber(p.value)} users</div>
                    `;
                },
            },
            xAxis: {
                type: 'category',
                data: filteredData.map(d => d.date),
                axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
                axisLabel: {
                    color: '#8F8B82',
                    fontSize: 10,
                    fontFamily: 'DM Sans',
                    formatter: (value: string) => formatDate(value, true),
                    interval: Math.floor(filteredData.length / 6),
                },
                axisTick: { show: false },
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: {
                    color: '#8F8B82',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    formatter: (value: number) => formatNumber(value),
                },
                splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)', type: 'dashed' } },
            },
            series: [{
                type: 'line',
                data: filteredData.map(d => d.users),
                smooth: 0.3,
                symbol: 'circle',
                symbolSize: filteredData.length > 30 ? 0 : 6,
                showSymbol: filteredData.length <= 30,
                lineStyle: { color: '#DA7756', width: 2 },
                itemStyle: {
                    color: '#DA7756',
                    borderColor: '#0f172a',
                    borderWidth: 2,
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(218, 119, 86, 0.3)' },
                            { offset: 1, color: 'rgba(218, 119, 86, 0)' },
                        ],
                    },
                },
            }],
        };
    }, [filteredData]);

    // Calculate stickiness (DAU/MAU ratio)
    const stickiness = currentDAU && currentMAU && currentMAU > 0
        ? (currentDAU / currentMAU) * 100
        : null;

    // No data state
    if (data.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900 rounded-2xl border border-slate-700 p-6 ${className}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#DA7756]" />
                        </div>
                        <h3 className="font-semibold text-white">Daily Active Users</h3>
                    </div>
                    <DataSourceIndicator sourceType="unavailable" />
                </div>
                <div className="text-center py-8">
                    <p className="text-slate-400">
                        Upload data with user_id and timestamp columns to see DAU trends.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#DA7756]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Daily Active Users</h3>
                            <p className="text-sm text-slate-400">
                                {filteredData.length} days of data
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Period selector */}
                        <div className="flex gap-1 bg-white/[0.03] border border-slate-700 rounded-lg p-1">
                            {(['7d', '30d', '90d', 'all'] as Period[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-2 py-1 text-xs rounded transition-all ${
                                        period === p
                                            ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {p === 'all' ? 'All' : p}
                                </button>
                            ))}
                        </div>

                        <DataSourceIndicator
                            sourceType={sourceType}
                            columns={sourceColumns}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-800">
                <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                        {currentDAU ? formatNumber(currentDAU) : stats ? formatNumber(Math.round(stats.avg)) : '-'}
                    </p>
                    <p className="text-xs text-slate-400">Current DAU</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                        {currentMAU ? formatNumber(currentMAU) : '-'}
                    </p>
                    <p className="text-xs text-slate-400">MAU</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-[#E5A84B]">
                        {stickiness ? `${stickiness.toFixed(1)}%` : '-'}
                    </p>
                    <p className="text-xs text-slate-400">Stickiness</p>
                </div>
                <div className="text-center">
                    {stats?.trend && (
                        <div className="flex items-center justify-center gap-1">
                            {stats.trend.direction === 'up' ? (
                                <TrendingUp className="w-5 h-5 text-[#DA7756]" />
                            ) : stats.trend.direction === 'down' ? (
                                <TrendingDown className="w-5 h-5 text-[#E25C5C]" />
                            ) : (
                                <Activity className="w-5 h-5 text-slate-400" />
                            )}
                            <span className={`text-2xl font-bold ${
                                stats.trend.direction === 'up' ? 'text-[#DA7756]' :
                                stats.trend.direction === 'down' ? 'text-[#E25C5C]' :
                                'text-slate-400'
                            }`}>
                                {stats.trend.percent > 0 ? `${stats.trend.percent.toFixed(1)}%` : '-'}
                            </span>
                        </div>
                    )}
                    <p className="text-xs text-slate-400">Trend</p>
                </div>
            </div>

            {/* Chart */}
            {chartOption && (
                <div className="p-4">
                    <ReactEChartsCore
                        echarts={echarts}
                        option={chartOption}
                        style={{ height: 240 }}
                        opts={{ renderer: 'canvas' }}
                        notMerge={true}
                    />
                </div>
            )}

            {/* Stats footer */}
            {stats && (
                <div className="px-4 pb-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 bg-white/[0.02] border border-slate-800 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-4">
                            <span>
                                Peak: <span className="text-slate-300">{formatNumber(stats.max)}</span>
                            </span>
                            <span>
                                Low: <span className="text-slate-300">{formatNumber(stats.min)}</span>
                            </span>
                            <span>
                                Avg: <span className="text-slate-300">{formatNumber(Math.round(stats.avg))}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {filteredData.length > 0 && (
                                <span>
                                    {formatDate(filteredData[0].date, true)} - {formatDate(filteredData[filteredData.length - 1].date, true)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
});

export default DAUTrendChart;
