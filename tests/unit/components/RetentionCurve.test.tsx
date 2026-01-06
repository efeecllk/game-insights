/**
 * RetentionCurve Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RetentionCurve } from '../../../src/components/charts/RetentionCurve';
import type { RetentionData } from '../../../src/types';

// Mock ReactECharts since it requires canvas
vi.mock('echarts-for-react', () => ({
    default: vi.fn(({ option, style }) => (
        <div data-testid="echarts-mock" style={style}>
            <span data-testid="chart-type">{option.series?.[0]?.type}</span>
            <span data-testid="series-count">{option.series?.length}</span>
            <span data-testid="x-axis-data">{JSON.stringify(option.xAxis?.data)}</span>
            <span data-testid="y-axis-max">{option.yAxis?.max}</span>
            <span data-testid="legend-show">{String(option.legend?.show)}</span>
        </div>
    )),
}));

describe('RetentionCurve', () => {
    const defaultData: RetentionData = {
        days: ['D1', 'D3', 'D7', 'D14', 'D30'],
        values: [42, 28, 18, 12, 8],
    };

    const dataWithBenchmark: RetentionData = {
        days: ['D1', 'D3', 'D7', 'D14', 'D30'],
        values: [42, 28, 18, 12, 8],
        benchmark: [40, 25, 15, 10, 6],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render the component', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByText('User Retention')).toBeInTheDocument();
        });

        it('should render default title', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByText('User Retention')).toBeInTheDocument();
        });

        it('should render default subtitle', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByText('Track how users return over time')).toBeInTheDocument();
        });

        it('should render custom title from config', () => {
            render(
                <RetentionCurve
                    data={defaultData}
                    config={{ title: 'Custom Retention', type: 'retention_curve' }}
                />
            );

            expect(screen.getByText('Custom Retention')).toBeInTheDocument();
        });

        it('should render custom subtitle from config', () => {
            render(
                <RetentionCurve
                    data={defaultData}
                    config={{
                        title: 'Retention',
                        subtitle: 'Custom subtitle',
                        type: 'retention_curve',
                    }}
                />
            );

            expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
        });

        it('should render ECharts component', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
        });

        it('should render live indicator', () => {
            render(<RetentionCurve data={defaultData} />);

            // Obsidian design uses 'Live' badge instead of benchmark indicator
            expect(screen.getByText('Live')).toBeInTheDocument();
        });

        it('should render pulsing indicator dot', () => {
            const { container } = render(<RetentionCurve data={defaultData} />);

            // Obsidian design uses animate-ping for the pulsing live dot
            const pulsingDot = container.querySelector('.animate-ping');
            expect(pulsingDot).toBeInTheDocument();
        });
    });

    describe('chart configuration', () => {
        it('should pass line chart type to ECharts', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByTestId('chart-type')).toHaveTextContent('line');
        });

        it('should pass days as x-axis data', () => {
            render(<RetentionCurve data={defaultData} />);

            const xAxisData = screen.getByTestId('x-axis-data');
            expect(xAxisData).toHaveTextContent('["D1","D3","D7","D14","D30"]');
        });

        it('should set y-axis max to 100', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByTestId('y-axis-max')).toHaveTextContent('100');
        });

        it('should render single series without benchmark', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByTestId('series-count')).toHaveTextContent('1');
        });

        it('should render two series with benchmark', () => {
            render(<RetentionCurve data={dataWithBenchmark} />);

            expect(screen.getByTestId('series-count')).toHaveTextContent('2');
        });

        it('should show legend by default', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByTestId('legend-show')).toHaveTextContent('true');
        });

        it('should hide legend when config specifies', () => {
            render(
                <RetentionCurve
                    data={defaultData}
                    config={{ showLegend: false, type: 'retention_curve', title: 'Retention' }}
                />
            );

            expect(screen.getByTestId('legend-show')).toHaveTextContent('false');
        });
    });

    describe('height configuration', () => {
        it('should use default height when not specified', () => {
            render(<RetentionCurve data={defaultData} />);

            const chart = screen.getByTestId('echarts-mock');
            // Obsidian design uses 280px default height
            expect(chart).toHaveStyle({ height: '280px' });
        });

        it('should use custom height from config', () => {
            render(
                <RetentionCurve
                    data={defaultData}
                    config={{ height: 400, type: 'retention_curve', title: 'Retention' }}
                />
            );

            const chart = screen.getByTestId('echarts-mock');
            expect(chart).toHaveStyle({ height: '400px' });
        });
    });

    describe('styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <RetentionCurve data={defaultData} className="custom-class" />
            );

            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have base card styling', () => {
            const { container } = render(<RetentionCurve data={defaultData} />);

            // Obsidian design uses glassmorphism styling
            expect(container.firstChild).toHaveClass('rounded-2xl');
            expect(container.firstChild).toHaveClass('backdrop-blur-xl');
        });

        it('should have proper padding', () => {
            const { container } = render(<RetentionCurve data={defaultData} />);

            // Obsidian design uses p-5
            expect(container.firstChild).toHaveClass('p-5');
        });

        it('should have border styling', () => {
            const { container } = render(<RetentionCurve data={defaultData} />);

            expect(container.firstChild).toHaveClass('border');
        });
    });

    describe('data handling', () => {
        it('should handle empty days array', () => {
            const emptyData: RetentionData = {
                days: [],
                values: [],
            };

            render(<RetentionCurve data={emptyData} />);

            expect(screen.getByTestId('x-axis-data')).toHaveTextContent('[]');
        });

        it('should handle single data point', () => {
            const singleData: RetentionData = {
                days: ['D1'],
                values: [45],
            };

            render(<RetentionCurve data={singleData} />);

            expect(screen.getByTestId('x-axis-data')).toHaveTextContent('["D1"]');
        });

        it('should handle extended retention period', () => {
            const extendedData: RetentionData = {
                days: ['D1', 'D3', 'D7', 'D14', 'D30', 'D60', 'D90'],
                values: [50, 35, 25, 18, 12, 8, 5],
            };

            render(<RetentionCurve data={extendedData} />);

            expect(screen.getByTestId('x-axis-data')).toHaveTextContent('D90');
        });

        it('should handle benchmark data correctly', () => {
            render(<RetentionCurve data={dataWithBenchmark} />);

            // Should have both series
            expect(screen.getByTestId('series-count')).toHaveTextContent('2');
        });
    });

    describe('cohort display', () => {
        it('should render title and subtitle in header section', () => {
            render(<RetentionCurve data={defaultData} />);

            const header = screen.getByText('User Retention').closest('div');
            expect(header).toBeInTheDocument();
        });

        it('should display live indicator badge', () => {
            render(<RetentionCurve data={defaultData} />);

            // Obsidian design uses 'Live' badge instead of benchmark indicator
            expect(screen.getByText('Live')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have heading for title', () => {
            render(<RetentionCurve data={defaultData} />);

            const heading = screen.getByRole('heading', { level: 3 });
            expect(heading).toHaveTextContent('User Retention');
        });

        it('should have descriptive subtitle', () => {
            render(<RetentionCurve data={defaultData} />);

            expect(screen.getByText('Track how users return over time')).toBeInTheDocument();
        });
    });

    describe('chart series configuration', () => {
        it('should render retention series as primary', () => {
            render(<RetentionCurve data={defaultData} />);

            // Series count should be 1 without benchmark
            expect(screen.getByTestId('series-count')).toHaveTextContent('1');
        });

        it('should add benchmark as secondary series', () => {
            render(<RetentionCurve data={dataWithBenchmark} />);

            // Series count should be 2 with benchmark
            expect(screen.getByTestId('series-count')).toHaveTextContent('2');
        });
    });

    describe('full width chart', () => {
        it('should have full width style', () => {
            render(<RetentionCurve data={defaultData} />);

            const chart = screen.getByTestId('echarts-mock');
            expect(chart).toHaveStyle({ width: '100%' });
        });
    });

    describe('animation', () => {
        it('should render chart with animation settings', () => {
            render(<RetentionCurve data={defaultData} />);

            // Chart should be rendered (animation is internal to ECharts)
            expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
        });
    });
});
