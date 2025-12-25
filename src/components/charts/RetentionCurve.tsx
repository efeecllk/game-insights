/**
 * Base Chart Component - Implements Liskov Substitution Principle
 * All chart components can be used interchangeably
 */

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { RetentionData, ChartConfig } from '../../types';
import { ChartRegistry, BaseChartProps } from '../../lib/chartRegistry';

interface RetentionCurveProps {
    data: RetentionData;
    config?: Partial<ChartConfig>;
    className?: string;
}

export function RetentionCurve({ data, config, className }: RetentionCurveProps) {
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
                const dataPoint = p[0];
                const benchmarkPoint = p[1];
                return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${dataPoint.name}</div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #8b5cf6;">Your Game: ${dataPoint.value}%</span>
            </div>
            ${benchmarkPoint ? `<div style="color: #71717a; margin-top: 4px;">Benchmark: ${benchmarkPoint.value}%</div>` : ''}
          </div>
        `;
            },
        },
        legend: {
            show: config?.showLegend ?? true,
            top: 0,
            right: 0,
            textStyle: { color: '#a1a1aa' },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: data.days,
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
            axisLabel: { color: '#71717a', fontSize: 12 },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLine: { show: false },
            axisLabel: { color: '#71717a', fontSize: 12, formatter: '{value}%' },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
        },
        series: [
            {
                name: 'Retention',
                type: 'line',
                data: data.values,
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    width: 3,
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                            { offset: 0, color: '#8b5cf6' },
                            { offset: 1, color: '#6366f1' },
                        ],
                    },
                },
                itemStyle: {
                    color: '#8b5cf6',
                    borderColor: '#1a1a24',
                    borderWidth: 3,
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                            { offset: 1, color: 'rgba(139, 92, 246, 0)' },
                        ],
                    },
                },
            },
            ...(data.benchmark ? [{
                name: 'Benchmark',
                type: 'line' as const,
                data: data.benchmark,
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    type: 'dashed' as const,
                    color: '#71717a',
                },
            }] : []),
        ],
        animationDuration: 1500,
        animationEasing: 'cubicOut',
    };

    return (
        <div className={`bg-bg-card rounded-card p-6 border border-white/[0.06] ${className ?? ''}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        {config?.title ?? 'User Retention'}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        {config?.subtitle ?? 'Track how players return over time'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">vs Benchmark</span>
                    <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                </div>
            </div>

            <ReactECharts
                option={option}
                style={{ height: config?.height ?? 300, width: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
}

// Register chart in registry
ChartRegistry.register('retention_curve', RetentionCurve as React.ComponentType<BaseChartProps<unknown>>, {
    name: 'Retention Curve',
    description: 'Shows player retention over days since install',
    category: 'engagement',
    requiredDataFields: ['days', 'values'],
    recommendedFor: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg'],
});

export default RetentionCurve;
