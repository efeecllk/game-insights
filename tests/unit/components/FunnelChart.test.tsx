/**
 * FunnelChart Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FunnelChart } from '../../../src/components/charts/FunnelChart';
import type { FunnelStep } from '../../../src/types';

// Mock ReactECharts since it requires canvas
vi.mock('echarts-for-react', () => ({
    default: vi.fn(({ option, style }) => (
        <div data-testid="echarts-mock" style={style}>
            <span data-testid="chart-type">{option.series?.[0]?.type}</span>
            <span data-testid="chart-data-length">{option.series?.[0]?.data?.length}</span>
        </div>
    )),
}));

describe('FunnelChart', () => {
    const defaultData: FunnelStep[] = [
        { name: 'Level 1', value: 100, percentage: 100 },
        { name: 'Level 5', value: 75, percentage: 75, dropOff: 25 },
        { name: 'Level 10', value: 50, percentage: 50, dropOff: 25 },
        { name: 'Level 20', value: 25, percentage: 25, dropOff: 25 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render the component', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByText('Progression Funnel')).toBeInTheDocument();
        });

        it('should render default title', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByText('Progression Funnel')).toBeInTheDocument();
        });

        it('should render default subtitle', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByText('Track drop-off at each stage')).toBeInTheDocument();
        });

        it('should render custom title from config', () => {
            render(
                <FunnelChart
                    data={defaultData}
                    config={{ title: 'Custom Funnel', type: 'level_funnel' }}
                />
            );

            expect(screen.getByText('Custom Funnel')).toBeInTheDocument();
        });

        it('should render custom subtitle from config', () => {
            render(
                <FunnelChart
                    data={defaultData}
                    config={{ title: 'Funnel', subtitle: 'Custom subtitle', type: 'level_funnel' }}
                />
            );

            expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
        });

        it('should render ECharts component', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
        });

        it('should pass funnel chart type to ECharts', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByTestId('chart-type')).toHaveTextContent('funnel');
        });

        it('should pass correct data length to ECharts', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByTestId('chart-data-length')).toHaveTextContent('4');
        });
    });

    describe('drop-off highlights', () => {
        it('should render drop-off highlights for first 3 steps', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByText('Level 1')).toBeInTheDocument();
            expect(screen.getByText('Level 5')).toBeInTheDocument();
            expect(screen.getByText('Level 10')).toBeInTheDocument();
        });

        it('should display percentage values in highlights', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByText('100%')).toBeInTheDocument();
            expect(screen.getByText('75%')).toBeInTheDocument();
            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        it('should display drop-off indicators', () => {
            render(<FunnelChart data={defaultData} />);

            // Obsidian design renders drop-off as "{value}% drop" (no minus sign)
            const dropOffElements = screen.getAllByText(/\d+% drop/);
            expect(dropOffElements.length).toBeGreaterThan(0);
        });

        it('should not display drop-off for steps without drop-off', () => {
            const dataWithoutDropOff: FunnelStep[] = [
                { name: 'Step 1', value: 100, percentage: 100 },
                { name: 'Step 2', value: 80, percentage: 80 },
                { name: 'Step 3', value: 60, percentage: 60 },
            ];

            render(<FunnelChart data={dataWithoutDropOff} />);

            // No drop-off indicators should be present
            expect(screen.queryByText(/\d+% drop/)).not.toBeInTheDocument();
        });

        it('should not display drop-off when value is 0', () => {
            const dataWithZeroDropOff: FunnelStep[] = [
                { name: 'Step 1', value: 100, percentage: 100, dropOff: 0 },
                { name: 'Step 2', value: 100, percentage: 100, dropOff: 0 },
                { name: 'Step 3', value: 100, percentage: 100, dropOff: 0 },
            ];

            render(<FunnelChart data={dataWithZeroDropOff} />);

            // No drop-off indicators should be present
            expect(screen.queryByText(/\d+% drop/)).not.toBeInTheDocument();
        });
    });

    describe('chart configuration', () => {
        it('should use default height when not specified', () => {
            render(<FunnelChart data={defaultData} />);

            const chart = screen.getByTestId('echarts-mock');
            // Obsidian design uses 300px default height
            expect(chart).toHaveStyle({ height: '300px' });
        });

        it('should use custom height from config', () => {
            render(
                <FunnelChart
                    data={defaultData}
                    config={{ height: 500, type: 'level_funnel', title: 'Funnel' }}
                />
            );

            const chart = screen.getByTestId('echarts-mock');
            expect(chart).toHaveStyle({ height: '500px' });
        });

        it('should apply custom className', () => {
            const { container } = render(
                <FunnelChart data={defaultData} className="custom-class" />
            );

            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have base card styling', () => {
            const { container } = render(<FunnelChart data={defaultData} />);

            // Obsidian design uses glassmorphism styling
            expect(container.firstChild).toHaveClass('rounded-2xl');
            expect(container.firstChild).toHaveClass('backdrop-blur-xl');
        });
    });

    describe('data handling', () => {
        it('should handle empty data array', () => {
            render(<FunnelChart data={[]} />);

            expect(screen.getByText('Progression Funnel')).toBeInTheDocument();
            expect(screen.getByTestId('chart-data-length')).toHaveTextContent('0');
        });

        it('should handle single data point', () => {
            const singleData: FunnelStep[] = [
                { name: 'Only Step', value: 100, percentage: 100 },
            ];

            render(<FunnelChart data={singleData} />);

            expect(screen.getByText('Only Step')).toBeInTheDocument();
            expect(screen.getByTestId('chart-data-length')).toHaveTextContent('1');
        });

        it('should handle data with many steps', () => {
            const manySteps: FunnelStep[] = Array.from({ length: 10 }, (_, i) => ({
                name: `Step ${i + 1}`,
                value: 100 - i * 10,
                percentage: 100 - i * 10,
                dropOff: i > 0 ? 10 : undefined,
            }));

            render(<FunnelChart data={manySteps} />);

            expect(screen.getByTestId('chart-data-length')).toHaveTextContent('10');
        });

        it('should only show first 3 steps in highlights', () => {
            const manySteps: FunnelStep[] = Array.from({ length: 5 }, (_, i) => ({
                name: `Step ${i + 1}`,
                value: 100 - i * 20,
                percentage: 100 - i * 20,
            }));

            render(<FunnelChart data={manySteps} />);

            // Should show Steps 1, 2, 3 in highlights but not 4 or 5
            expect(screen.getByText('Step 1')).toBeInTheDocument();
            expect(screen.getByText('Step 2')).toBeInTheDocument();
            expect(screen.getByText('Step 3')).toBeInTheDocument();
        });
    });

    describe('styling', () => {
        it('should have uppercase tracking for step labels', () => {
            render(<FunnelChart data={defaultData} />);

            const stepLabels = document.querySelectorAll('.uppercase.tracking-wider');
            expect(stepLabels.length).toBeGreaterThan(0);
        });

        it('should have red color for drop-off text', () => {
            render(<FunnelChart data={defaultData} />);

            const dropOffText = screen.getAllByText(/\d+% drop/)[0];
            // Obsidian design uses rose-400 instead of red-500
            expect(dropOffText).toHaveClass('text-rose-400');
        });

        it('should have border separator for highlights section', () => {
            const { container } = render(<FunnelChart data={defaultData} />);

            const highlightsSection = container.querySelector('.border-t');
            expect(highlightsSection).toBeInTheDocument();
        });

        it('should use grid layout for highlights', () => {
            const { container } = render(<FunnelChart data={defaultData} />);

            const grid = container.querySelector('.grid.grid-cols-3');
            expect(grid).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have heading for title', () => {
            render(<FunnelChart data={defaultData} />);

            const heading = screen.getByRole('heading', { level: 3 });
            expect(heading).toHaveTextContent('Progression Funnel');
        });

        it('should have descriptive subtitle', () => {
            render(<FunnelChart data={defaultData} />);

            expect(screen.getByText('Track drop-off at each stage')).toBeInTheDocument();
        });
    });
});
