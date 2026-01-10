/**
 * Type declarations for echarts-for-react submodules
 *
 * The core and lib modules allow passing a custom echarts instance for tree-shaking.
 * This enables using only the chart types needed in the application.
 */

declare module 'echarts-for-react/lib/core' {
    import { PureComponent, HTMLAttributes } from 'react';

    export interface EChartsReactCoreProps extends HTMLAttributes<HTMLDivElement> {
        /** Custom echarts instance for tree-shaking */
        echarts: typeof import('echarts/core');
        /** ECharts option configuration */
        option: Record<string, unknown>;
        /** Theme name or object */
        theme?: string | Record<string, unknown>;
        /** Whether to not merge with previous option */
        notMerge?: boolean;
        /** Keys to replace instead of merge */
        replaceMerge?: string | string[];
        /** Lazy update option */
        lazyUpdate?: boolean;
        /** Show loading mask */
        showLoading?: boolean;
        /** Loading option */
        loadingOption?: Record<string, unknown>;
        /** ECharts init opts */
        opts?: {
            devicePixelRatio?: number;
            renderer?: 'canvas' | 'svg';
            width?: number | string | null;
            height?: number | string | null;
            locale?: string;
        };
        /** Callback when chart is ready */
        onChartReady?: (instance: unknown) => void;
        /** Event bindings */
        onEvents?: Record<string, (params: unknown, instance: unknown) => void>;
        /** Custom should update check */
        shouldSetOption?: (prevProps: EChartsReactCoreProps, props: EChartsReactCoreProps) => boolean;
        /** Auto resize on container change */
        autoResize?: boolean;
    }

    export default class EChartsReactCore extends PureComponent<EChartsReactCoreProps> {
        /** Get the echarts instance */
        getEchartsInstance(): unknown;
    }
}
