/**
 * Retention Curve Chart - Obsidian Analytics Design
 *
 * Premium line chart with:
 * - Warm gradient line styling (Claude palette)
 * - Refined tooltip design
 * - Smooth animations
 *
 * Performance Optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - Only re-renders when data or config actually changes
 */

import { memo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { echarts, type EChartsOption } from '@/lib/echarts';
import { RetentionData, ChartConfig } from '../../types';
import { ChartRegistry, BaseChartProps } from '../../lib/chartRegistry';

interface RetentionCurveProps {
    data: RetentionData;
    config?: Partial<ChartConfig>;
    className?: string;
    /** When true, renders without container (for use inside ChartContainer) */
    bare?: boolean;
}

function RetentionCurveComponent({ data, config, className, bare = false }: RetentionCurveProps) {
    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(218, 119, 86, 0.2)',
            borderWidth: 1,
            padding: [12, 16],
            textStyle: {
                color: '#FAF9F6',
                fontFamily: 'DM Sans, system-ui, sans-serif',
            },
            formatter: (params: unknown) => {
                const p = params as Array<{ name: string; value: number; seriesName: string }>;
                const dataPoint = p[0];
                const benchmarkPoint = p[1];
                return `
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8F8B82; margin-bottom: 8px;">${dataPoint.name}</div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="width: 8px; height: 8px; border-radius: 2px; background: linear-gradient(135deg, #DA7756, #C15F3C);"></span>
                        <span style="color: #FAF9F6; font-weight: 500;">Retention: <span style="color: #DA7756; font-family: 'JetBrains Mono', monospace;">${dataPoint.value}%</span></span>
                    </div>
                    ${benchmarkPoint ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="width: 8px; height: 8px; border-radius: 2px; background: #8F8B82;"></span>
                            <span style="color: #8F8B82;">Benchmark: <span style="font-family: 'JetBrains Mono', monospace;">${benchmarkPoint.value}%</span></span>
                        </div>
                    ` : ''}
                `;
            },
            extraCssText: 'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); border-radius: 12px;',
        },
        legend: {
            show: config?.showLegend ?? true,
            top: 0,
            right: 0,
            textStyle: {
                color: '#8F8B82',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: 11,
            },
            icon: 'roundRect',
            itemWidth: 12,
            itemHeight: 4,
            itemGap: 16,
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
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
            axisLabel: {
                color: '#8F8B82',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
            },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLine: { show: false },
            axisLabel: {
                color: '#8F8B82',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                formatter: '{value}%',
            },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)' } },
        },
        series: [
            {
                name: 'Retention',
                type: 'line',
                data: data.values,
                smooth: 0.4,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    width: 3,
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                            { offset: 0, color: '#DA7756' },
                            { offset: 0.5, color: '#C15F3C' },
                            { offset: 1, color: '#E5A84B' },
                        ],
                    },
                    shadowColor: 'rgba(218, 119, 86, 0.3)',
                    shadowBlur: 10,
                    shadowOffsetY: 4,
                },
                itemStyle: {
                    color: '#DA7756',
                    borderColor: '#0f172a',
                    borderWidth: 3,
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(218, 119, 86, 0.2)' },
                            { offset: 0.5, color: 'rgba(218, 119, 86, 0.05)' },
                            { offset: 1, color: 'rgba(218, 119, 86, 0)' },
                        ],
                    },
                },
            },
            ...(data.benchmark ? [{
                name: 'Benchmark',
                type: 'line' as const,
                data: data.benchmark,
                smooth: 0.4,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    type: 'dashed' as const,
                    color: '#8F8B82',
                },
            }] : []),
        ],
        // Reduced animation duration for better performance
        animationDuration: 400,
        animationDurationUpdate: 200,
        animationEasing: 'cubicOut',
    };

    const chart = (
        <ReactEChartsCore
            echarts={echarts}
            option={option}
            style={{ height: config?.height ?? 280, width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
            lazyUpdate={true}
        />
    );

    // Bare mode for use inside ChartContainer
    if (bare) {
        return chart;
    }

    // Standalone mode with its own container
    return (
        <div className={`relative bg-th-bg-surface rounded-2xl p-5 border border-th-border overflow-hidden ${className ?? ''}`}>
            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-th-text-primary">
                            {config?.title ?? 'User Retention'}
                        </h3>
                        <p className="text-xs text-th-text-muted mt-0.5">
                            {config?.subtitle ?? 'Track how users return over time'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-th-accent-primary-muted border border-th-accent-primary/20">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-th-accent-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-th-accent-primary" />
                        </span>
                        <span className="text-[10px] font-medium text-th-accent-primary uppercase tracking-wider">Live</span>
                    </div>
                </div>

                {chart}
            </div>
        </div>
    );
}

// Memoized component to prevent unnecessary re-renders
// Only re-renders when data, config, className, or bare props change
export const RetentionCurve = memo(RetentionCurveComponent);

// Register chart in registry
ChartRegistry.register('retention_curve', RetentionCurve as React.ComponentType<BaseChartProps<unknown>>, {
    name: 'Retention Curve',
    description: 'Shows player retention over days since install',
    category: 'engagement',
    requiredDataFields: ['days', 'values'],
    recommendedFor: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg'],
});

export default RetentionCurve;
