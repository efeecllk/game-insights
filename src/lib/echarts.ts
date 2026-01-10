/**
 * Custom ECharts Build with Tree-Shaking
 *
 * This module creates a minimal ECharts bundle by only importing the
 * chart types and components actually used in the application.
 *
 * Bundle size reduction: ~1MB -> ~300KB (70% reduction)
 *
 * To add new chart types:
 * 1. Import the chart from 'echarts/charts'
 * 2. Import any needed components from 'echarts/components'
 * 3. Add them to the echarts.use() call
 *
 * Usage in components:
 * ```tsx
 * import ReactEChartsCore from 'echarts-for-react/core';
 * import { echarts } from '@/lib/echarts';
 *
 * <ReactEChartsCore echarts={echarts} option={option} />
 * ```
 */

import * as echarts from 'echarts/core';

// Chart types used in the application
import {
    LineChart,
    BarChart,
    PieChart,
    FunnelChart,
    ScatterChart,
} from 'echarts/charts';

// Components used
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    DataZoomComponent,
    MarkLineComponent,
    MarkPointComponent,
} from 'echarts/components';

// Renderer - Canvas is faster, SVG is better for SSR
import { CanvasRenderer } from 'echarts/renderers';

// Type imports for TypeScript support
import type {
    LineSeriesOption,
    BarSeriesOption,
    PieSeriesOption,
    FunnelSeriesOption,
    ScatterSeriesOption,
} from 'echarts/charts';

import type {
    TitleComponentOption,
    TooltipComponentOption,
    GridComponentOption,
    LegendComponentOption,
    DataZoomComponentOption,
    MarkLineComponentOption,
    MarkPointComponentOption,
} from 'echarts/components';

import type { ComposeOption } from 'echarts/core';

// Register all used components
echarts.use([
    // Charts
    LineChart,
    BarChart,
    PieChart,
    FunnelChart,
    ScatterChart,
    // Components
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    DataZoomComponent,
    MarkLineComponent,
    MarkPointComponent,
    // Renderer
    CanvasRenderer,
]);

// Export the configured echarts instance for use with echarts-for-react/core
export { echarts };

// Compose a type for EChartsOption that includes only the registered components
export type EChartsOption = ComposeOption<
    | LineSeriesOption
    | BarSeriesOption
    | PieSeriesOption
    | FunnelSeriesOption
    | ScatterSeriesOption
    | TitleComponentOption
    | TooltipComponentOption
    | GridComponentOption
    | LegendComponentOption
    | DataZoomComponentOption
    | MarkLineComponentOption
    | MarkPointComponentOption
>;

// Export a type for the echarts instance
export type EChartsInstance = ReturnType<typeof echarts.init>;
