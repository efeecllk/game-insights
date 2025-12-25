/**
 * ChartRenderer Component
 * Renders charts based on ChartRecommendation from AI
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

// Chart colors from theme
const CHART_COLORS = [
    '#8b5cf6', // violet
    '#6366f1', // indigo
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#10b981', // green
    '#f97316', // orange
];

function buildLineOrAreaChart(
    recommendation: ChartRecommendation,
    data: NormalizedData,
    _columnMeanings: ColumnMeaning[],
    isArea: boolean
): EChartsOption {
    const xCol = recommendation.columns[0];
    const yCol = recommendation.columns[1] || recommendation.columns[0];

    // Get x-axis values
    const xValues = data.rows.map(row => String(row[xCol] ?? ''));
    const yValues = data.rows.map(row => {
        const val = row[yCol];
        return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    });

    return {
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#374151' },
        },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: xValues.slice(0, 50), // Limit for performance
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280', fontSize: 11, rotate: xValues.length > 10 ? 45 : 0 },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#6b7280', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        series: [{
            name: recommendation.title,
            type: 'line',
            data: yValues.slice(0, 50),
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: CHART_COLORS[0], width: 2 },
            itemStyle: { color: CHART_COLORS[0] },
            ...(isArea ? {
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(139, 92, 246, 0.2)' },
                            { offset: 1, color: 'rgba(139, 92, 246, 0)' },
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

    // Aggregate data if needed
    const aggregated = new Map<string, number>();
    for (const row of data.rows) {
        const key = String(row[xCol] ?? 'Unknown');
        const val = typeof row[yCol] === 'number' ? row[yCol] : parseFloat(String(row[yCol])) || 0;
        aggregated.set(key, (aggregated.get(key) || 0) + val);
    }

    const categories = Array.from(aggregated.keys()).slice(0, 20);
    const values = categories.map(k => aggregated.get(k) || 0);

    return {
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#374151' },
        },
        grid: { left: 50, right: 20, top: 20, bottom: 60 },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280', fontSize: 11, rotate: categories.length > 5 ? 45 : 0 },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#6b7280', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
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

    // Aggregate by category
    const aggregated = new Map<string, number>();
    for (const row of data.rows) {
        const key = String(row[categoryCol] ?? 'Unknown');
        const val = typeof row[valueCol] === 'number' ? row[valueCol] : 1; // Count if no value
        aggregated.set(key, (aggregated.get(key) || 0) + val);
    }

    const pieData = Array.from(aggregated.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    return {
        tooltip: {
            trigger: 'item',
            backgroundColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#374151' },
            formatter: '{b}: {c} ({d}%)',
        },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: { color: '#6b7280', fontSize: 11 },
        },
        series: [{
            type: 'pie',
            radius: isDonut ? ['40%', '70%'] : '70%',
            center: ['40%', '50%'],
            data: pieData,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.2)',
                },
            },
            itemStyle: {
                borderRadius: 4,
                borderColor: '#fff',
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

    // Aggregate by step
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
            trigger: 'item',
            backgroundColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#374151' },
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
            },
            itemStyle: {
                borderColor: '#fff',
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

    // Create histogram bins
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
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#374151' },
        },
        grid: { left: 50, right: 20, top: 20, bottom: 60 },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280', fontSize: 10, rotate: 45 },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#6b7280', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
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
        .slice(0, 500); // Limit for performance

    return {
        tooltip: {
            trigger: 'item',
            backgroundColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#374151' },
            formatter: (params: any) => `${xCol}: ${params.data[0]}<br/>${yCol}: ${params.data[1]}`,
        },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#6b7280', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        series: [{
            type: 'scatter',
            data: scatterData,
            symbolSize: 8,
            itemStyle: {
                color: CHART_COLORS[0],
                opacity: 0.7,
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
        <div className={`bg-white rounded-xl border border-gray-200 ${className ?? ''}`}>
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{recommendation.description}</p>
            </div>
            <div className="p-4">
                <ReactECharts
                    option={option}
                    style={{ height, width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                />
            </div>
        </div>
    );
}

export default ChartRenderer;
