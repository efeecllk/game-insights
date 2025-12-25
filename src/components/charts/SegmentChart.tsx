/**
 * Segment Chart Component (Pie/Donut)
 * Shows distribution of segments/categories
 */

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { SegmentData, ChartConfig } from '../../types';
import { ChartRegistry, BaseChartProps } from '../../lib/chartRegistry';

interface SegmentChartProps {
    data: SegmentData[];
    config?: Partial<ChartConfig>;
    className?: string;
}

export function SegmentChart({ data, config, className }: SegmentChartProps) {
    const defaultColors = ['#8b5cf6', '#6366f1', '#ec4899', '#22d3ee', '#f97316', '#22c55e'];

    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: '#252532',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            textStyle: { color: '#fff' },
            formatter: (params: unknown) => {
                const p = params as { name: string; value: number; percent: number };
                return `
          <div style="padding: 8px;">
            <div style="font-weight: 600;">${p.name}</div>
            <div style="color: #8b5cf6;">${p.percent.toFixed(1)}%</div>
          </div>
        `;
            },
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: { color: '#a1a1aa', fontSize: 12 },
            itemGap: 12,
        },
        series: [
            {
                name: 'Segments',
                type: 'pie',
                radius: ['50%', '75%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#1a1a24',
                    borderWidth: 2,
                },
                label: {
                    show: false,
                },
                emphasis: {
                    scale: true,
                    scaleSize: 10,
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(139, 92, 246, 0.5)',
                    },
                },
                labelLine: {
                    show: false,
                },
                data: data.map((segment, index) => ({
                    name: segment.name,
                    value: segment.value,
                    itemStyle: {
                        color: segment.color ?? defaultColors[index % defaultColors.length],
                    },
                })),
            },
        ],
        animationDuration: 1500,
        animationEasing: 'cubicOut',
    };

    return (
        <div className={`bg-bg-card rounded-card p-6 border border-white/[0.06] ${className ?? ''}`}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">
                    {config?.title ?? 'Distribution'}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                    {config?.subtitle ?? 'Segment breakdown'}
                </p>
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
ChartRegistry.register('spender_segments', SegmentChart as React.ComponentType<BaseChartProps<unknown>>, {
    name: 'Spender Segments',
    description: 'Shows distribution of player segments',
    category: 'monetization',
    requiredDataFields: ['name', 'value', 'percentage'],
    recommendedFor: ['gacha_rpg', 'idle', 'match3_meta'],
});

export default SegmentChart;
