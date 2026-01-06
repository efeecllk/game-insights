/**
 * ChartRenderer Component - Obsidian Analytics Design
 *
 * Premium chart rendering with:
 * - Dark theme with Claude warm orange accents
 * - Glassmorphism containers
 * - Refined tooltips and labels
 */

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ChartRecommendation } from '../../ai/ChartSelector';
import { NormalizedData } from '../../adapters/BaseAdapter';
import { ColumnMeaning } from '../../ai/SchemaAnalyzer';

interface ChartRendererProps {
    recommendation: ChartRecommendation;
    data: NormalizedData;
    columnMeanings: ColumnMeaning[];
    height?: number;
    className?: string;
}

// Obsidian chart colors - warm terracotta palette
const CHART_COLORS = [
    '#DA7756', // terracotta - primary
    '#C15F3C', // darker terracotta
    '#E5A84B', // amber/gold
    '#A68B5B', // warm tan
    '#8B7355', // brown
    '#B89B7D', // light brown
];

// Common tooltip styling for dark theme
const TOOLTIP_STYLE = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    textStyle: {
        color: '#f1f5f9',
        fontFamily: 'DM Sans',
    },
    padding: [12, 16],
    extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);',
};

// Common axis styling for dark theme
const AXIS_STYLE = {
    axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
    axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'DM Sans' },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)' } },
};

function buildLineOrAreaChart(
    recommendation: ChartRecommendation,
    data: NormalizedData,
    _columnMeanings: ColumnMeaning[],
    isArea: boolean
): EChartsOption {
    const xCol = recommendation.columns[0];
    const yCol = recommendation.columns[1] || recommendation.columns[0];

    const xValues = data.rows.map(row => String(row[xCol] ?? ''));
    const yValues = data.rows.map(row => {
        const val = row[yCol];
        return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    });

    return {
        tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: xValues.slice(0, 50),
            ...AXIS_STYLE,
            axisLabel: { ...AXIS_STYLE.axisLabel, rotate: xValues.length > 10 ? 45 : 0 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' },
            splitLine: AXIS_STYLE.splitLine,
        },
        series: [{
            name: recommendation.title,
            type: 'line',
            data: yValues.slice(0, 50),
            smooth: 0.3,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: CHART_COLORS[0], width: 2 },
            itemStyle: {
                color: CHART_COLORS[0],
                borderColor: '#0f172a',
                borderWidth: 2,
            },
            ...(isArea ? {
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
            } : {}),
        }],
    };
}

function buildBarChart(
    recommendation: ChartRecommendation,
    data: NormalizedData
): EChartsOption {
    const xCol = recommendation.columns[0];
    const yCol = recommendation.columns[1] || recommendation.columns[0];

    const aggregated = new Map<string, number>();
    for (const row of data.rows) {
        const key = String(row[xCol] ?? 'Unknown');
        const val = typeof row[yCol] === 'number' ? row[yCol] : parseFloat(String(row[yCol])) || 0;
        aggregated.set(key, (aggregated.get(key) || 0) + val);
    }

    const categories = Array.from(aggregated.keys()).slice(0, 20);
    const values = categories.map(k => aggregated.get(k) || 0);

    return {
        tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 60 },
        xAxis: {
            type: 'category',
            data: categories,
            ...AXIS_STYLE,
            axisLabel: { ...AXIS_STYLE.axisLabel, rotate: categories.length > 5 ? 45 : 0 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' },
            splitLine: AXIS_STYLE.splitLine,
        },
        series: [{
            name: recommendation.title,
            type: 'bar',
            data: values,
            barWidth: '60%',
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: CHART_COLORS[0] },
                        { offset: 1, color: CHART_COLORS[1] },
                    ],
                },
                borderRadius: [4, 4, 0, 0],
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 12,
                    shadowColor: 'rgba(218, 119, 86, 0.4)',
                },
            },
        }],
    };
}

function buildPieOrDonutChart(
    recommendation: ChartRecommendation,
    data: NormalizedData,
    isDonut: boolean
): EChartsOption {
    const categoryCol = recommendation.columns[0];
    const valueCol = recommendation.columns[1] || recommendation.columns[0];

    const aggregated = new Map<string, number>();
    for (const row of data.rows) {
        const key = String(row[categoryCol] ?? 'Unknown');
        const val = typeof row[valueCol] === 'number' ? row[valueCol] : 1;
        aggregated.set(key, (aggregated.get(key) || 0) + val);
    }

    const pieData = Array.from(aggregated.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    return {
        tooltip: {
            ...TOOLTIP_STYLE,
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)',
        },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: { color: '#94a3b8', fontSize: 11, fontFamily: 'DM Sans' },
        },
        series: [{
            type: 'pie',
            radius: isDonut ? ['40%', '70%'] : '70%',
            center: ['40%', '50%'],
            data: pieData,
            emphasis: {
                itemStyle: {
                    shadowBlur: 20,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            },
            itemStyle: {
                borderRadius: 4,
                borderColor: '#0f172a',
                borderWidth: 2,
            },
            label: { show: false },
        }],
        color: CHART_COLORS,
    };
}

function buildFunnelChart(
    recommendation: ChartRecommendation,
    data: NormalizedData
): EChartsOption {
    const stepCol = recommendation.columns[0];
    const valueCol = recommendation.columns[1] || recommendation.columns[0];

    const aggregated = new Map<string, number>();
    for (const row of data.rows) {
        const key = String(row[stepCol] ?? 'Unknown');
        const val = typeof row[valueCol] === 'number' ? row[valueCol] : 1;
        aggregated.set(key, (aggregated.get(key) || 0) + val);
    }

    const funnelData = Array.from(aggregated.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        tooltip: {
            ...TOOLTIP_STYLE,
            trigger: 'item',
            formatter: '{b}: {c}',
        },
        series: [{
            type: 'funnel',
            left: '10%',
            top: 20,
            bottom: 20,
            width: '80%',
            minSize: '20%',
            maxSize: '100%',
            sort: 'descending',
            gap: 2,
            label: {
                show: true,
                position: 'inside',
                color: '#fff',
                fontSize: 12,
                fontFamily: 'DM Sans',
            },
            itemStyle: {
                borderColor: '#0f172a',
                borderWidth: 1,
            },
            emphasis: {
                label: { fontSize: 14 },
            },
            data: funnelData,
        }],
        color: CHART_COLORS,
    };
}

function buildHistogramChart(
    recommendation: ChartRecommendation,
    data: NormalizedData
): EChartsOption {
    const valueCol = recommendation.columns[0];
    const values = data.rows
        .map(row => {
            const val = row[valueCol];
            return typeof val === 'number' ? val : parseFloat(String(val));
        })
        .filter(v => !isNaN(v));

    if (values.length === 0) {
        return buildBarChart(recommendation, data);
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binWidth = (max - min) / binCount || 1;

    const bins = new Array(binCount).fill(0);
    for (const val of values) {
        const binIndex = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
        bins[binIndex]++;
    }

    const categories = bins.map((_, i) => {
        const start = min + i * binWidth;
        const end = start + binWidth;
        return `${start.toFixed(0)}-${end.toFixed(0)}`;
    });

    return {
        tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 60 },
        xAxis: {
            type: 'category',
            data: categories,
            ...AXIS_STYLE,
            axisLabel: { ...AXIS_STYLE.axisLabel, fontSize: 10, rotate: 45 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' },
            splitLine: AXIS_STYLE.splitLine,
        },
        series: [{
            name: 'Count',
            type: 'bar',
            data: bins,
            barWidth: '90%',
            itemStyle: {
                color: CHART_COLORS[0],
                borderRadius: [2, 2, 0, 0],
            },
        }],
    };
}

function buildScatterChart(
    recommendation: ChartRecommendation,
    data: NormalizedData
): EChartsOption {
    const xCol = recommendation.columns[0];
    const yCol = recommendation.columns[1] || recommendation.columns[0];

    const scatterData = data.rows
        .map(row => {
            const x = typeof row[xCol] === 'number' ? row[xCol] : parseFloat(String(row[xCol]));
            const y = typeof row[yCol] === 'number' ? row[yCol] : parseFloat(String(row[yCol]));
            return [x, y];
        })
        .filter(([x, y]) => !isNaN(x) && !isNaN(y))
        .slice(0, 500);

    return {
        tooltip: {
            ...TOOLTIP_STYLE,
            trigger: 'item',
            formatter: (params: unknown) => {
                const p = params as { data: [number, number] };
                return `${xCol}: ${p.data[0]}<br/>${yCol}: ${p.data[1]}`;
            },
        },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'value',
            ...AXIS_STYLE,
            axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' },
            splitLine: AXIS_STYLE.splitLine,
        },
        series: [{
            type: 'scatter',
            data: scatterData,
            symbolSize: 8,
            itemStyle: {
                color: CHART_COLORS[0],
                opacity: 0.8,
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(218, 119, 86, 0.5)',
                },
            },
        }],
    };
}

function buildChartOption(
    recommendation: ChartRecommendation,
    data: NormalizedData,
    columnMeanings: ColumnMeaning[]
): EChartsOption {
    switch (recommendation.chartType) {
        case 'line':
            return buildLineOrAreaChart(recommendation, data, columnMeanings, false);
        case 'area':
            return buildLineOrAreaChart(recommendation, data, columnMeanings, true);
        case 'bar':
            return buildBarChart(recommendation, data);
        case 'pie':
            return buildPieOrDonutChart(recommendation, data, false);
        case 'donut':
            return buildPieOrDonutChart(recommendation, data, true);
        case 'funnel':
            return buildFunnelChart(recommendation, data);
        case 'histogram':
            return buildHistogramChart(recommendation, data);
        case 'scatter':
            return buildScatterChart(recommendation, data);
        default:
            return buildBarChart(recommendation, data);
    }
}

export function ChartRenderer({
    recommendation,
    data,
    columnMeanings,
    height = 300,
    className,
}: ChartRendererProps) {
    const option = buildChartOption(recommendation, data, columnMeanings);

    return (
        <div className={`relative group ${className ?? ''}`}>
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DA7756]/0 via-[#DA7756]/5 to-[#DA7756]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Card container */}
            <div className="relative bg-slate-900  rounded-2xl border border-slate-800 overflow-hidden">
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                <div className="relative">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="font-display font-semibold text-white">{recommendation.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{recommendation.description}</p>
                    </div>

                    {/* Chart */}
                    <div className="p-4">
                        <ReactECharts
                            option={option}
                            style={{ height, width: '100%' }}
                            opts={{ renderer: 'canvas' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChartRenderer;
