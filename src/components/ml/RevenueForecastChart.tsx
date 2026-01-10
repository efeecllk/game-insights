/**
 * Revenue Forecast Chart - Obsidian Analytics Design
 *
 * Premium ML forecast visualization with:
 * - Confidence interval bands
 * - Trend indicators
 * - Dark theme chart styling
 */

import ReactEChartsCore from 'echarts-for-react/lib/core';
import { echarts } from '@/lib/echarts';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import type { RevenueForecast } from '../../ai/ml/types';

interface RevenueForecastChartProps {
    forecast: RevenueForecast[];
    showConfidenceInterval?: boolean;
    height?: number;
}

export function RevenueForecastChart({
    forecast,
    showConfidenceInterval = true,
    height = 300,
}: RevenueForecastChartProps) {
    if (forecast.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-zinc-500">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>No forecast data available</span>
            </div>
        );
    }

    // Generate date labels
    const today = new Date();
    const dates = forecast.map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i + 1);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Extract data
    const values = forecast.map(f => f.value);
    const lowBound = forecast.map(f => f.range?.low ?? f.value * 0.7);
    const highBound = forecast.map(f => f.range?.high ?? f.value * 1.3);

    // Calculate totals
    const totalForecast = values.reduce((a, b) => a + b, 0);
    const avgDaily = totalForecast / values.length;
    const trend = forecast[0]?.trend ?? 'stable';

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: (params: Array<{ name: string; value: number; seriesName: string; dataIndex: number }> | { name: string; value: number; seriesName: string; dataIndex: number }) => {
                const paramArray = Array.isArray(params) ? params : [params];
                if (paramArray.length === 0) return '';
                const point = paramArray[0];
                const forecastData = forecast[point.dataIndex];
                return `
                    <div style="padding: 4px 0">
                        <div style="font-weight: 600; margin-bottom: 4px">${point.name}</div>
                        <div style="color: #DA7756">Forecast: $${point.value.toLocaleString()}</div>
                        ${forecastData?.range ? `
                            <div style="color: #8F8B82; font-size: 11px">
                                Range: $${forecastData.range.low.toLocaleString()} - $${forecastData.range.high.toLocaleString()}
                            </div>
                        ` : ''}
                        <div style="color: #8F8B82; font-size: 11px; margin-top: 4px">
                            Confidence: ${((forecastData?.confidence ?? 0.5) * 100).toFixed(0)}%
                        </div>
                    </div>
                `;
            },
        },
        grid: { left: 60, right: 20, top: 30, bottom: 40 },
        xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: {
                color: '#8F8B82',
                fontSize: 10,
                rotate: 45,
                interval: Math.floor(dates.length / 7),
            },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: {
                color: '#8F8B82',
                formatter: (val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`,
            },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        series: [
            // Confidence interval area
            ...(showConfidenceInterval ? [
                {
                    name: 'Upper Bound',
                    type: 'line',
                    data: highBound,
                    lineStyle: { opacity: 0 },
                    areaStyle: { opacity: 0 },
                    stack: 'confidence',
                    symbol: 'none',
                },
                {
                    name: 'Lower Bound',
                    type: 'line',
                    data: lowBound.map((v, i) => highBound[i] - v),
                    lineStyle: { opacity: 0 },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(218, 119, 86, 0.1)' },
                                { offset: 1, color: 'rgba(218, 119, 86, 0.02)' },
                            ],
                        },
                    },
                    stack: 'confidence',
                    symbol: 'none',
                },
            ] : []),
            // Main forecast line
            {
                name: 'Forecast',
                type: 'line',
                data: values,
                smooth: true,
                symbol: 'circle',
                symbolSize: 4,
                lineStyle: {
                    color: '#DA7756',
                    width: 2,
                },
                itemStyle: { color: '#DA7756' },
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
            },
        ],
    };

    return (
        <div>
            {/* Summary stats */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-2xl font-bold text-white">
                        ${totalForecast.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-zinc-500">
                        {forecast.length}-day forecast
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm text-zinc-400">Avg Daily</div>
                        <div className="font-medium text-white">
                            ${avgDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                        trend === 'growing' ? 'bg-[#E5A84B]/20 text-[#E5A84B]' :
                        trend === 'declining' ? 'bg-[#E25C5C]/20 text-[#E25C5C]' :
                        'bg-zinc-700 text-zinc-400'
                    }`}>
                        {trend === 'growing' ? <TrendingUp className="w-4 h-4" /> :
                         trend === 'declining' ? <TrendingDown className="w-4 h-4" /> :
                         <Minus className="w-4 h-4" />}
                        <span className="text-sm font-medium capitalize">{trend}</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ReactECharts option={option} style={{ height }} />

            {/* Factors */}
            {forecast[0]?.factors && forecast[0].factors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="text-xs font-medium text-zinc-500 mb-2">
                        Key Factors
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {forecast[0].factors.slice(0, 3).map((factor, i) => (
                            <div
                                key={i}
                                className={`px-2 py-1 rounded text-xs ${
                                    factor.impact > 0
                                        ? 'bg-[#E5A84B]/10 text-[#E5A84B]'
                                        : 'bg-[#E25C5C]/10 text-[#E25C5C]'
                                }`}
                            >
                                {factor.name}: {factor.description}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RevenueForecastChart;
