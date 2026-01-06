/**
 * Segment Chart (Donut) - Obsidian Analytics Design
 *
 * Premium donut chart with:
 * - Warm color palette (Claude palette)
 * - Refined legend and tooltips
 * - Glow effects on hover
 *
 * Performance Optimizations:
 * - React.memo to prevent unnecessary re-renders
 */

import { memo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { SegmentData, ChartConfig } from '../../types';
import { ChartRegistry, BaseChartProps } from '../../lib/chartRegistry';

interface SegmentChartProps {
    data: SegmentData[];
    config?: Partial<ChartConfig>;
    className?: string;
    /** When true, renders without container (for use inside ChartContainer) */
    bare?: boolean;
}

// Warm color palette (terracotta theme)
const SEGMENT_COLORS = [
    '#DA7756', // terracotta - primary
    '#C15F3C', // darker terracotta
    '#E5A84B', // amber/gold
    '#A68B5B', // warm tan
    '#8B7355', // brown
    '#B89B7D', // light brown
];

function SegmentChartComponent({ data, config, className, bare = false }: SegmentChartProps) {
    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(218, 119, 86, 0.2)',
            borderWidth: 1,
            padding: [12, 16],
            textStyle: {
                color: '#FAF9F6',
                fontFamily: 'DM Sans, system-ui, sans-serif',
            },
            formatter: (params: unknown) => {
                const p = params as { name: string; value: number; percent: number; color: string };
                return `
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8F8B82; margin-bottom: 8px;">${p.name}</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 8px; height: 8px; border-radius: 2px; background: ${p.color};"></span>
                        <span style="color: #FAF9F6; font-family: 'JetBrains Mono', monospace; font-weight: 600;">${p.percent.toFixed(1)}%</span>
                    </div>
                `;
            },
            extraCssText: 'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); border-radius: 12px;',
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: {
                color: '#C8C4BA',
                fontSize: 11,
                fontFamily: 'DM Sans, system-ui, sans-serif',
            },
            itemGap: 16,
            itemWidth: 12,
            itemHeight: 12,
            icon: 'roundRect',
        },
        series: [
            {
                name: 'Segments',
                type: 'pie',
                radius: ['55%', '80%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: 'rgba(15, 23, 42, 0.9)',
                    borderWidth: 3,
                },
                label: {
                    show: false,
                },
                emphasis: {
                    scale: true,
                    scaleSize: 8,
                    itemStyle: {
                        shadowBlur: 30,
                        shadowColor: 'rgba(218, 119, 86, 0.4)',
                    },
                },
                labelLine: {
                    show: false,
                },
                data: data.map((segment, index) => ({
                    name: segment.name,
                    value: segment.value,
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 1, y2: 1,
                            colorStops: [
                                { offset: 0, color: SEGMENT_COLORS[index % SEGMENT_COLORS.length] },
                                { offset: 1, color: adjustColor(SEGMENT_COLORS[index % SEGMENT_COLORS.length], -20) },
                            ],
                        },
                    },
                })),
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

    // Bare mode for use inside ChartContainer
    if (bare) {
        return chart;
    }

    // Standalone mode with its own container
    return (
        <div className={`relative bg-slate-900  rounded-2xl p-5 border border-slate-800 overflow-hidden ${className ?? ''}`}>
            {/* Noise texture */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

            <div className="relative">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white">
                        {config?.title ?? 'Distribution'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {config?.subtitle ?? 'Segment breakdown'}
                    </p>
                </div>

                {chart}
            </div>
        </div>
    );
}

// Helper to darken/lighten hex color
function adjustColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Memoized component to prevent unnecessary re-renders
export const SegmentChart = memo(SegmentChartComponent);

// Register chart
ChartRegistry.register('spender_segments', SegmentChart as React.ComponentType<BaseChartProps<unknown>>, {
    name: 'Spender Segments',
    description: 'Shows distribution of player segments',
    category: 'monetization',
    requiredDataFields: ['name', 'value', 'percentage'],
    recommendedFor: ['gacha_rpg', 'idle', 'match3_meta'],
});

export default SegmentChart;
