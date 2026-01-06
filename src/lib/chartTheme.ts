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
    // Dark mode: warm dark backgrounds (#1A1918, #262524)
    return {
      text: '#C8C4BA', // --color-text-secondary in dark
      textMuted: '#8F8B82', // --color-text-muted in dark
      grid: 'rgba(250, 249, 246, 0.04)', // subtle warm white grid
      tooltip: {
        bg: '#262524', // --color-bg-surface in dark
        border: 'rgba(250, 249, 246, 0.08)', // --color-border-default in dark
        text: '#FAF9F6', // --color-text-primary in dark
      },
      series: [
        '#DA7756', // terracotta - primary
        '#C15F3C', // darker terracotta
        '#E5A84B', // amber/gold
        '#A68B5B', // warm tan
        '#8B7355', // brown
        '#B89B7D', // light brown
        '#E25C5C', // warm red
        '#8F8B82', // warm gray
      ],
      area: [
        { offset: 0, color: 'rgba(218, 119, 86, 0.15)' },
        { offset: 1, color: 'rgba(218, 119, 86, 0)' },
      ],
    };
  }

  // Light mode: warm cream backgrounds (#F5F5F0, #FAF9F7)
  return {
    text: '#4A4641', // --color-text-secondary in light
    textMuted: '#8F8B82', // --color-text-muted in light
    grid: '#EAE8E1', // --color-border-subtle in light
    tooltip: {
      bg: '#FFFFFF', // --color-bg-surface in light
      border: '#DBD8CE', // --color-border-default in light
      text: '#1A1918', // --color-text-primary in light
    },
    series: [
      '#C15F3C', // darker terracotta for better contrast on light
      '#DA7756', // terracotta
      '#C98A2E', // darker amber for light mode
      '#8B7355', // brown
      '#A68B5B', // warm tan
      '#B89B7D', // light brown
      '#C94141', // warm red (light mode version)
      '#6B7280', // neutral gray
    ],
    area: [
      { offset: 0, color: 'rgba(193, 95, 60, 0.1)' },
      { offset: 1, color: 'rgba(193, 95, 60, 0)' },
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
      borderColor: isDark ? '#1A1918' : '#FFFFFF',
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
