/**
 * Revenue Chart - Obsidian Analytics Design
 *
 * Premium bar chart with:
 * - Warm gradient bars with glow (Claude palette)
 * - Refined tooltips and labels
 * - Summary statistics
 */

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { TimeSeriesData, ChartConfig } from '../../types';
import { ChartRegistry, BaseChartProps } from '../../lib/chartRegistry';

interface RevenueChartProps {
    data: TimeSeriesData[];
    config?: Partial<ChartConfig>;
    className?: string;
    /** When true, renders without container (for use inside ChartContainer) */
    bare?: boolean;
}

export function RevenueChart({ data, config, className, bare = false }: RevenueChartProps) {
    const series = data[0];
    const totalRevenue = series?.data.reduce((sum, d) => sum + d.value, 0) ?? 0;
    const avgRevenue = series?.data.length ? totalRevenue / series.data.length : 0;

    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(218, 119, 86, 0.2)',
            borderWidth: 1,
            padding: [12, 16],
            textStyle: {
                color: '#e2e8f0',
                fontFamily: 'DM Sans, system-ui, sans-serif',
            },
            formatter: (params: unknown) => {
                const p = params as Array<{ name: string; value: number }>;
                return `
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px;">${p[0].name}</div>
                    <div style="color: #DA7756; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600;">$${p[0].value.toLocaleString()}</div>
                `;
            },
            extraCssText: 'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); border-radius: 12px;',
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '10%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: series?.data.map((d) => d.timestamp) ?? [],
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
            },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                formatter: (value: number) => `$${(value / 1000).toFixed(0)}K`,
            },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)' } },
        },
        series: [
            {
                name: series?.name ?? 'Revenue',
                type: 'bar',
                data: series?.data.map((d) => d.value) ?? [],
                barWidth: '55%',
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#DA7756' },
                            { offset: 0.7, color: '#B84E32' },
                            { offset: 1, color: 'rgba(184, 78, 50, 0.3)' },
                        ],
                    },
                    shadowColor: 'rgba(218, 119, 86, 0.3)',
                    shadowBlur: 8,
                    shadowOffsetY: 4,
                },
                emphasis: {
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#E8957A' },
                                { offset: 1, color: 'rgba(232, 149, 122, 0.5)' },
                            ],
                        },
                        shadowBlur: 20,
                        shadowColor: 'rgba(218, 119, 86, 0.5)',
                    },
                },
            },
        ],
        animationDuration: 1200,
        animationEasing: 'cubicOut',
    };

    const chart = (
        <ReactECharts
            option={option}
            style={{ height: config?.height ?? 220, width: '100%' }}
            opts={{ renderer: 'canvas' }}
        />
    );

    const stats = (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
            <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">Total Revenue</p>
                <p className="text-xl font-bold text-[#E8957A] font-mono tracking-tight">
                    ${totalRevenue.toLocaleString()}
                </p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">Daily Average</p>
                <p className="text-sm font-semibold text-slate-300 font-mono">
                    ${avgRevenue.toLocaleString()}/day
                </p>
            </div>
        </div>
    );

    // Bare mode for use inside ChartContainer
    if (bare) {
        return (
            <div>
                {chart}
                {stats}
            </div>
        );
    }

    // Standalone mode with its own container
    return (
        <div className={`relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06] overflow-hidden ${className ?? ''}`}>
            {/* Noise texture */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            {config?.title ?? 'Revenue'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {config?.subtitle ?? 'Track earnings over time'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-[#E8957A] font-mono">
                            ${totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                            Avg: ${avgRevenue.toLocaleString()}/day
                        </p>
                    </div>
                </div>

                {chart}
            </div>
        </div>
    );
}

// Register chart
ChartRegistry.register('revenue_timeline', RevenueChart as React.ComponentType<BaseChartProps<unknown>>, {
    name: 'Revenue Timeline',
    description: 'Shows revenue over time with totals',
    category: 'monetization',
    requiredDataFields: ['timestamp', 'value'],
    recommendedFor: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg'],
});

export default RevenueChart;
