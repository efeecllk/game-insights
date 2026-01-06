/**
 * Theme-Aware Chart Configuration
 * Provides consistent theming for ECharts across the application
 */

import { useMemo } from 'react';

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
    // Dark mode: Exact Claude dark theme colors
    return {
      text: '#b8b5ad', // --color-text-secondary (Claude dark)
      textMuted: '#9a9893', // --color-text-muted (Claude dark)
      grid: 'rgba(255, 255, 255, 0.05)', // Very subtle grid
      tooltip: {
        bg: '#1f1e1b', // --color-bg-surface (Claude dark)
        border: 'rgba(255, 255, 255, 0.1)', // --color-border-default
        text: '#eeeeee', // --color-text-primary (Claude dark)
      },
      series: [
        '#ae5630', // Claude orange - primary
        '#C15F3C', // Crail
        '#c9a554', // Warm gold
        '#a68b5b', // Tan
        '#8b7355', // Brown
        '#b89b7d', // Light brown
        '#c25d5d', // Muted red
        '#9a9893', // Warm gray
      ],
      area: [
        { offset: 0, color: 'rgba(174, 86, 48, 0.12)' },
        { offset: 1, color: 'rgba(174, 86, 48, 0)' },
      ],
    };
  }

  // Light mode: Exact Claude light theme colors
  return {
    text: '#4a4845', // --color-text-secondary (Claude light)
    textMuted: '#6b6a68', // --color-text-muted (Claude light)
    grid: 'rgba(0, 0, 0, 0.06)', // Very subtle grid
    tooltip: {
      bg: '#FFFFFF', // --color-bg-surface (Claude light)
      border: 'rgba(0, 0, 0, 0.1)', // --color-border-default
      text: '#1a1a18', // --color-text-primary (Claude light)
    },
    series: [
      '#ae5630', // Claude orange - primary
      '#9a4a2a', // Darker orange
      '#b08d3e', // Warm gold
      '#8b7355', // Brown
      '#6b5d4a', // Dark brown
      '#a08970', // Tan
      '#b54a4a', // Muted red
      '#6b6a68', // Warm gray
    ],
    area: [
      { offset: 0, color: 'rgba(174, 86, 48, 0.08)' },
      { offset: 1, color: 'rgba(174, 86, 48, 0)' },
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
      borderColor: isDark ? '#2b2a27' : '#FFFFFF',
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

/**
 * React hook to get chart theme based on current app theme
 * Usage: const chartTheme = useChartTheme();
 */
export function useChartTheme() {
  // Read the resolved theme from document
  const isDark = useMemo(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }, []);

  return useMemo(() => getChartTheme(isDark), [isDark]);
}

/**
 * Hook to get base chart options with current theme
 */
export function useBaseChartOptions() {
  const isDark = useMemo(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }, []);

  return useMemo(() => createBaseChartOptions(isDark), [isDark]);
}

export default getChartTheme;
