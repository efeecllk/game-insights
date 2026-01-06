/**
 * Funnel Chart - Obsidian Analytics Design
 *
 * Premium funnel visualization with:
 * - Warm gradient color scheme (Claude palette)
 * - Refined tooltip design
 * - Drop-off indicators with premium styling
 */

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { FunnelStep, ChartConfig } from '../../types';
import { ChartRegistry, BaseChartProps } from '../../lib/chartRegistry';

interface FunnelChartProps {
    data: FunnelStep[];
    config?: Partial<ChartConfig>;
    className?: string;
    /** When true, renders without container (for use inside ChartContainer) */
    bare?: boolean;
}

// Warm gradient color palette (terracotta theme)
const FUNNEL_COLORS = [
    ['#DA7756', '#B84E32'], // terracotta - primary
    ['#C15F3C', '#A34D2A'], // darker terracotta
    ['#E5A84B', '#C4903A'], // amber/gold
    ['#A68B5B', '#8A7349'], // warm tan
    ['#8B7355', '#715D45'], // brown
    ['#B89B7D', '#9A8167'], // light brown
];

export function FunnelChart({ data, config, className, bare = false }: FunnelChartProps) {
    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(218, 119, 86, 0.2)',
            borderWidth: 1,
            padding: [12, 16],
            textStyle: {
                color: '#e2e8f0',
                fontFamily: 'DM Sans, system-ui, sans-serif',
            },
            formatter: (params: unknown) => {
                const p = params as { name: string; value: number; data: FunnelStep };
                return `
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px;">${p.name}</div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="color: #DA7756; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600;">${p.data.percentage}%</span>
                        <span style="color: #94a3b8;">of users</span>
                    </div>
                    ${p.data.dropOff ? `
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: #f87171;">↓ ${p.data.dropOff}%</span>
                            <span style="color: #64748b; font-size: 11px;">drop-off</span>
                        </div>
                    ` : ''}
                `;
            },
            extraCssText: 'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); border-radius: 12px;',
        },
        series: [
            {
                name: 'Funnel',
                type: 'funnel',
                left: '10%',
                top: 40,
                bottom: 20,
                width: '80%',
                min: 0,
                max: 100,
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                gap: 3,
                label: {
                    show: true,
                    position: 'inside',
                    formatter: (params: unknown) => {
                        const p = params as { name: string; data: FunnelStep };
                        return `{name|${p.name}}\n{value|${p.data.percentage}%}`;
                    },
                    rich: {
                        name: {
                            fontSize: 11,
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontFamily: 'DM Sans, system-ui, sans-serif',
                        },
                        value: {
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#fff',
                            fontFamily: 'JetBrains Mono, monospace',
                            padding: [4, 0, 0, 0],
                        },
                    },
                },
                itemStyle: {
                    borderColor: 'rgba(15, 23, 42, 0.8)',
                    borderWidth: 2,
                },
                emphasis: {
                    label: {
                        fontSize: 14,
                    },
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(218, 119, 86, 0.3)',
                    },
                },
                data: data.map((step, index) => {
                    const colors = FUNNEL_COLORS[index % FUNNEL_COLORS.length];
                    return {
                        name: step.name,
                        value: step.percentage,
                        percentage: step.percentage,
                        dropOff: step.dropOff,
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 1, y2: 1,
                                colorStops: [
                                    { offset: 0, color: colors[0] },
                                    { offset: 1, color: colors[1] },
                                ],
                            },
                        },
                    };
                }),
            },
        ],
        animationDuration: 1200,
        animationEasing: 'cubicOut',
    };

    const chart = (
        <ReactECharts
            option={option}
            style={{ height: config?.height ?? 300, width: '100%' }}
            opts={{ renderer: 'canvas' }}
        />
    );

    const dropOffStats = (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/[0.04]">
            {data.slice(0, 3).map((step, index) => {
                const colors = FUNNEL_COLORS[index % FUNNEL_COLORS.length];
                return (
                    <div key={step.name} className="group">
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="w-2 h-2 rounded-sm"
                                style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                            />
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{step.name}</p>
                        </div>
                        <p className="text-xl font-bold text-white font-mono tracking-tight">{step.percentage}%</p>
                        {step.dropOff !== undefined && step.dropOff > 0 && (
                            <p className="text-[11px] text-rose-400 mt-0.5 font-medium">
                                <span className="opacity-60">↓</span> {step.dropOff}% drop
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // Bare mode for use inside ChartContainer
    if (bare) {
        return (
            <div>
                {chart}
                {dropOffStats}
            </div>
        );
    }

    // Standalone mode with its own container
    return (
        <div className={`relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06] overflow-hidden ${className ?? ''}`}>
            {/* Noise texture */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            {config?.title ?? 'Progression Funnel'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {config?.subtitle ?? 'Track drop-off at each stage'}
                        </p>
                    </div>
                </div>

                {chart}
                {dropOffStats}
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
