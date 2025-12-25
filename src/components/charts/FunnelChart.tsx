/**
 * Funnel Chart Component
 * Shows progression/conversion funnel with drop-off indicators
 */

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { FunnelStep, ChartConfig } from '../../types';
import { ChartRegistry, BaseChartProps } from '../../lib/chartRegistry';

interface FunnelChartProps {
    data: FunnelStep[];
    config?: Partial<ChartConfig>;
    className?: string;
}

export function FunnelChart({ data, config, className }: FunnelChartProps) {
    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: '#252532',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            textStyle: { color: '#fff' },
            formatter: (params: unknown) => {
                const p = params as { name: string; value: number; data: FunnelStep };
                return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${p.name}</div>
            <div style="color: #8b5cf6;">${p.data.percentage}% of users</div>
            ${p.data.dropOff ? `<div style="color: #ef4444; margin-top: 4px;">-${p.data.dropOff}% drop-off</div>` : ''}
          </div>
        `;
            },
        },
        series: [
            {
                name: 'Funnel',
                type: 'funnel',
                left: '10%',
                top: 60,
                bottom: 20,
                width: '80%',
                min: 0,
                max: 100,
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                gap: 2,
                label: {
                    show: true,
                    position: 'inside',
                    formatter: (params: unknown) => {
                        const p = params as { name: string; data: FunnelStep };
                        return `${p.name}\n${p.data.percentage}%`;
                    },
                    color: '#fff',
                    fontSize: 12,
                },
                itemStyle: {
                    borderColor: '#1a1a24',
                    borderWidth: 1,
                },
                emphasis: {
                    label: {
                        fontSize: 14,
                        fontWeight: 'bold',
                    },
                },
                data: data.map((step, index) => ({
                    name: step.name,
                    value: step.percentage,
                    percentage: step.percentage,
                    dropOff: step.dropOff,
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 1, y2: 0,
                            colorStops: [
                                { offset: 0, color: `hsl(${260 - index * 15}, 70%, 60%)` },
                                { offset: 1, color: `hsl(${260 - index * 15}, 70%, 50%)` },
                            ],
                        },
                    },
                })),
            },
        ],
        animationDuration: 1500,
        animationEasing: 'cubicOut',
    };

    return (
        <div className={`bg-bg-card rounded-card p-6 border border-white/[0.06] ${className ?? ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        {config?.title ?? 'Progression Funnel'}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        {config?.subtitle ?? 'Track player drop-off at each stage'}
                    </p>
                </div>
            </div>

            <ReactECharts
                option={option}
                style={{ height: config?.height ?? 350, width: '100%' }}
                opts={{ renderer: 'canvas' }}
            />

            {/* Drop-off highlights */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                {data.slice(0, 3).map((step) => (
                    <div key={step.name}>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">{step.name}</p>
                        <p className="text-xl font-semibold text-white mt-1">{step.percentage}%</p>
                        {step.dropOff !== undefined && step.dropOff > 0 && (
                            <p className="text-xs text-red-500 mt-1">-{step.dropOff}% drop</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Register chart
ChartRegistry.register('level_funnel', FunnelChart as React.ComponentType<BaseChartProps<unknown>>, {
    name: 'Level Funnel',
    description: 'Shows progression through levels with drop-off rates',
    category: 'progression',
    requiredDataFields: ['name', 'value', 'percentage'],
    recommendedFor: ['puzzle', 'match3_meta', 'gacha_rpg'],
});

export default FunnelChart;
