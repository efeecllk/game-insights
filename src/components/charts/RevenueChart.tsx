/**
 * Revenue Timeline Chart Component
 * Shows revenue over time with area gradient
 */

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { TimeSeriesData, ChartConfig } from '../../types';
import { ChartRegistry, BaseChartProps } from '../../lib/chartRegistry';

interface RevenueChartProps {
    data: TimeSeriesData[];
    config?: Partial<ChartConfig>;
    className?: string;
}

export function RevenueChart({ data, config, className }: RevenueChartProps) {
    const series = data[0];
    const totalRevenue = series?.data.reduce((sum, d) => sum + d.value, 0) ?? 0;
    const avgRevenue = series?.data.length ? totalRevenue / series.data.length : 0;

    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#252532',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            textStyle: { color: '#fff' },
            formatter: (params: unknown) => {
                const p = params as Array<{ name: string; value: number }>;
                return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${p[0].name}</div>
            <div style="color: #22c55e;">$${p[0].value.toLocaleString()}</div>
          </div>
        `;
            },
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
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
            axisLabel: { color: '#71717a', fontSize: 12 },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: {
                color: '#71717a',
                fontSize: 12,
                formatter: (value: number) => `$${(value / 1000).toFixed(0)}K`,
            },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
        },
        series: [
            {
                name: series?.name ?? 'Revenue',
                type: 'bar',
                data: series?.data.map((d) => d.value) ?? [],
                barWidth: '60%',
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#22c55e' },
                            { offset: 1, color: 'rgba(34, 197, 94, 0.3)' },
                        ],
                    },
                },
                emphasis: {
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#4ade80' },
                                { offset: 1, color: 'rgba(74, 222, 128, 0.5)' },
                            ],
                        },
                    },
                },
            },
        ],
        animationDuration: 1500,
        animationEasing: 'cubicOut',
    };

    return (
        <div className={`bg-bg-card rounded-card p-6 border border-white/[0.06] ${className ?? ''}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        {config?.title ?? 'Revenue'}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        {config?.subtitle ?? 'Track earnings over time'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-green-500">
                        ${totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">
                        Avg: ${avgRevenue.toLocaleString()}/day
                    </p>
                </div>
            </div>

            <ReactECharts
                option={option}
                style={{ height: config?.height ?? 250, width: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
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
