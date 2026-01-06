/**
 * Theme-Aware Chart Configuration
 * Provides consistent theming for ECharts across the application
 */

export interface ChartThemeColors {
  text: string;
  textMuted: string;
  grid: string;
  tooltip: {
    bg: string;
    border: string;
    text: string;
  };
  series: string[];
  area: {
    offset: number;
    color: string;
  }[];
}

export function getChartTheme(isDark: boolean): ChartThemeColors {
  if (isDark) {
    return {
      text: '#a1a1aa',
      textMuted: '#71717a',
      grid: 'rgba(255,255,255,0.04)',
      tooltip: {
        bg: '#242430',
        border: 'rgba(255,255,255,0.1)',
        text: '#f4f4f5',
      },
      series: [
        '#a78bfa', // primary violet
        '#818cf8', // indigo
        '#f472b6', // pink
        '#5B9BD5', // Claude blue
        '#DA7756', // Claude orange
        '#C15F3C', // Claude secondary
        '#f87171', // red
        '#c084fc', // purple
      ],
      area: [
        { offset: 0, color: 'rgba(167, 139, 250, 0.15)' },
        { offset: 1, color: 'rgba(167, 139, 250, 0)' },
      ],
    };
  }

  return {
    text: '#6b7280',
    textMuted: '#9ca3af',
    grid: '#f3f4f6',
    tooltip: {
      bg: '#ffffff',
      border: '#e5e7eb',
      text: '#374151',
    },
    series: [
      '#8b5cf6', // primary violet
      '#6366f1', // indigo
      '#ec4899', // pink
      '#5B9BD5', // Claude blue
      '#DA7756', // Claude orange
      '#C15F3C', // Claude secondary
      '#ef4444', // red
      '#a855f7', // purple
    ],
    area: [
      { offset: 0, color: 'rgba(139, 92, 246, 0.1)' },
      { offset: 1, color: 'rgba(139, 92, 246, 0)' },
    ],
  };
}

// Base chart options factory
export function createBaseChartOptions(isDark: boolean) {
  const theme = getChartTheme(isDark);

  return {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: theme.tooltip.bg,
      borderColor: theme.tooltip.border,
      borderWidth: 1,
      textStyle: {
        color: theme.tooltip.text,
        fontFamily: 'DM Sans, system-ui, sans-serif',
        fontSize: 12,
      },
      padding: [8, 12],
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 30,
      containLabel: false,
    },
    xAxis: {
      type: 'category' as const,
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: {
        color: theme.text,
        fontSize: 11,
        fontFamily: 'DM Sans, system-ui, sans-serif',
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      axisLabel: {
        color: theme.text,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    color: theme.series,
  };
}

// Line chart preset
export function createLineChartOptions(
  isDark: boolean,
  options?: {
    smooth?: boolean | number;
    showArea?: boolean;
    seriesIndex?: number;
  }
) {
  const theme = getChartTheme(isDark);
  const { smooth = 0.3, showArea = true, seriesIndex = 0 } = options || {};

  return {
    smooth,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      color: theme.series[seriesIndex],
      width: 2,
    },
    itemStyle: {
      color: theme.series[seriesIndex],
      borderColor: isDark ? '#16161e' : '#ffffff',
      borderWidth: 2,
    },
    ...(showArea && {
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: theme.area,
        },
      },
    }),
  };
}

// Bar chart preset
export function createBarChartOptions(
  isDark: boolean,
  options?: {
    seriesIndex?: number;
    borderRadius?: number;
  }
) {
  const theme = getChartTheme(isDark);
  const { seriesIndex = 0, borderRadius = 4 } = options || {};

  return {
    itemStyle: {
      color: theme.series[seriesIndex],
      borderRadius: [borderRadius, borderRadius, 0, 0],
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: `${theme.series[seriesIndex]}40`,
      },
    },
  };
}

export default getChartTheme;
