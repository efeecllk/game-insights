/**
 * SparklineChart - Mini trend chart for insight cards
 */

import { useMemo } from 'react';
import type { MetricDataPoint } from '@/services/ai/types';

interface SparklineChartProps {
  data: MetricDataPoint[];
  trend?: 'up' | 'down' | 'neutral';
  height?: number;
  showLabels?: boolean;
}

export function SparklineChart({
  data,
  trend = 'neutral',
  height = 40,
  showLabels = false,
}: SparklineChartProps) {
  const { path, minValue, maxValue, gradient } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', minValue: 0, maxValue: 0, gradient: 'neutral' };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Calculate path
    const width = 200;
    const chartHeight = height - 8; // Padding
    const stepX = width / (data.length - 1);

    const points = data.map((d, i) => {
      const x = i * stepX;
      const y = chartHeight - ((d.value - min) / range) * chartHeight + 4;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    // Determine gradient based on trend
    let gradientId = 'sparkline-neutral';
    if (trend === 'up') {
      gradientId = 'sparkline-up';
    } else if (trend === 'down') {
      gradientId = 'sparkline-down';
    }

    return {
      path: points.join(' '),
      minValue: min,
      maxValue: max,
      gradient: gradientId,
    };
  }, [data, height, trend]);

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-th-text-muted"
        style={{ height }}
      >
        Not enough data
      </div>
    );
  }

  const trendColors = {
    up: {
      stroke: '#7d8b6a', // success
      fill: 'rgba(125, 139, 106, 0.2)',
    },
    down: {
      stroke: '#c25d5d', // error
      fill: 'rgba(194, 93, 93, 0.2)',
    },
    neutral: {
      stroke: '#ae5630', // accent
      fill: 'rgba(174, 86, 48, 0.2)',
    },
  };

  const colors = trendColors[trend];

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox={`0 0 200 ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="sparkline-up" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7d8b6a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7d8b6a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sparkline-down" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c25d5d" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c25d5d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sparkline-neutral" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ae5630" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ae5630" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={`${path} L 200 ${height} L 0 ${height} Z`}
          fill={`url(#${gradient})`}
          strokeWidth="0"
        />

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End point dot */}
        {data.length > 0 && (
          <circle
            cx="200"
            cy={
              height -
              8 -
              ((data[data.length - 1].value - minValue) / (maxValue - minValue || 1)) *
                (height - 8) +
              4
            }
            r="3"
            fill={colors.stroke}
          />
        )}
      </svg>

      {/* Labels */}
      {showLabels && (
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-th-text-muted">
          <span>{data[0]?.date?.split('-').slice(1).join('/')}</span>
          <span>{data[data.length - 1]?.date?.split('-').slice(1).join('/')}</span>
        </div>
      )}
    </div>
  );
}

export default SparklineChart;
