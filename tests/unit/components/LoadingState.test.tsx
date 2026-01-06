/**
 * LoadingState Component Tests
 * Phase 7: Testing & Quality Assurance
 *
 * Tests the redesigned LoadingState component with dark theme styling
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '../../../src/components/analytics/LoadingState';

describe('LoadingState', () => {
    describe('rendering', () => {
        it('should render title', () => {
            render(<LoadingState />);

            expect(screen.getByText('Analyzing Your Data')).toBeInTheDocument();
        });

        it('should render default description without row count', () => {
            render(<LoadingState />);

            expect(screen.getByText('AI is processing your data to generate insights')).toBeInTheDocument();
        });

        it('should render row count in description when provided', () => {
            render(<LoadingState rowCount={1000} />);

            expect(screen.getByText('Processing 1,000 rows...')).toBeInTheDocument();
        });

        it('should render all stages', () => {
            render(<LoadingState />);

            expect(screen.getByText('Sampling data...')).toBeInTheDocument();
            expect(screen.getByText('Analyzing patterns...')).toBeInTheDocument();
            expect(screen.getByText('Detecting anomalies...')).toBeInTheDocument();
            expect(screen.getByText('Generating insights...')).toBeInTheDocument();
        });
    });

    describe('stage highlighting', () => {
        it('should highlight sampling stage by default', () => {
            render(<LoadingState />);

            const samplingStage = screen.getByText('Sampling data...');
            // Current stage uses emerald in Obsidian design
            expect(samplingStage).toHaveClass('text-emerald-400');
        });

        it('should highlight analyzing stage when specified', () => {
            render(<LoadingState stage="analyzing" />);

            // Sampling should be complete (teal in Obsidian design)
            const samplingStage = screen.getByText('Sampling data...');
            expect(samplingStage).toHaveClass('text-teal-400');

            // Analyzing should be current
            const analyzingStage = screen.getByText('Analyzing patterns...');
            expect(analyzingStage).toHaveClass('text-emerald-400');
        });

        it('should highlight detecting stage when specified', () => {
            render(<LoadingState stage="detecting" />);

            // Previous stages should be complete (teal)
            expect(screen.getByText('Sampling data...')).toHaveClass('text-teal-400');
            expect(screen.getByText('Analyzing patterns...')).toHaveClass('text-teal-400');

            // Detecting should be current
            expect(screen.getByText('Detecting anomalies...')).toHaveClass('text-emerald-400');
        });

        it('should highlight generating stage when specified', () => {
            render(<LoadingState stage="generating" />);

            // All previous stages should be complete (teal)
            expect(screen.getByText('Sampling data...')).toHaveClass('text-teal-400');
            expect(screen.getByText('Analyzing patterns...')).toHaveClass('text-teal-400');
            expect(screen.getByText('Detecting anomalies...')).toHaveClass('text-teal-400');

            // Generating should be current
            expect(screen.getByText('Generating insights...')).toHaveClass('text-emerald-400');
        });

        it('should show pending stages in muted color', () => {
            render(<LoadingState stage="sampling" />);

            // Stages after sampling should be muted (slate in Obsidian design)
            expect(screen.getByText('Analyzing patterns...')).toHaveClass('text-slate-500');
            expect(screen.getByText('Detecting anomalies...')).toHaveClass('text-slate-500');
            expect(screen.getByText('Generating insights...')).toHaveClass('text-slate-500');
        });
    });

    describe('progress bar', () => {
        it('should always show progress bar with progress indicator', () => {
            render(<LoadingState progress={0} />);

            expect(screen.getByText('Progress')).toBeInTheDocument();
            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('should show progress bar when progress is greater than 0', () => {
            render(<LoadingState progress={50} />);

            expect(screen.getByText('Progress')).toBeInTheDocument();
            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        it('should show correct progress percentage', () => {
            render(<LoadingState progress={75} />);

            expect(screen.getByText('75%')).toBeInTheDocument();
        });

        it('should round progress percentage', () => {
            render(<LoadingState progress={33.7} />);

            expect(screen.getByText('34%')).toBeInTheDocument();
        });

        it('should show 100% progress', () => {
            render(<LoadingState progress={100} />);

            expect(screen.getByText('100%')).toBeInTheDocument();
        });
    });

    describe('defaults', () => {
        it('should default to sampling stage', () => {
            render(<LoadingState />);

            const samplingStage = screen.getByText('Sampling data...');
            // Current stage uses emerald in Obsidian design
            expect(samplingStage).toHaveClass('text-emerald-400');
        });

        it('should default to 0 progress', () => {
            render(<LoadingState />);

            expect(screen.getByText('0%')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have descriptive content', () => {
            render(<LoadingState />);

            // Should have a heading
            expect(screen.getByText('Analyzing Your Data')).toBeInTheDocument();

            // Should have a description
            expect(screen.getByText('AI is processing your data to generate insights')).toBeInTheDocument();
        });

        it('should show visual progress indication', () => {
            render(<LoadingState progress={50} />);

            // Progress text should be visible
            expect(screen.getByText('Progress')).toBeInTheDocument();
            expect(screen.getByText('50%')).toBeInTheDocument();
        });
    });
});
