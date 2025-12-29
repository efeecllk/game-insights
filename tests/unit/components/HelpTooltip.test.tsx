/**
 * HelpTooltip Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpTooltip, InlineHelp, getMetricInfo } from '../../../src/components/HelpTooltip';

describe('HelpTooltip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render children content', () => {
            render(
                <HelpTooltip term="dau">
                    <span>DAU Value</span>
                </HelpTooltip>
            );

            expect(screen.getByText('DAU Value')).toBeInTheDocument();
        });

        it('should render help icon button', () => {
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            expect(screen.getByRole('button', { name: /help for/i })).toBeInTheDocument();
        });

        it('should not render help icon for unknown terms', () => {
            render(
                <HelpTooltip term="unknown_metric">
                    <span>Unknown</span>
                </HelpTooltip>
            );

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('should render only children when term not found', () => {
            render(
                <HelpTooltip term="nonexistent">
                    <span>Some content</span>
                </HelpTooltip>
            );

            expect(screen.getByText('Some content')).toBeInTheDocument();
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('should return null when term not found and no children', () => {
            const { container } = render(<HelpTooltip term="nonexistent" />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('tooltip display', () => {
        it('should show tooltip on click', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button', { name: /help for/i });
            await user.click(helpButton);

            expect(screen.getByRole('tooltip')).toBeInTheDocument();
            expect(screen.getByText('Daily Active Users (DAU)')).toBeInTheDocument();
        });

        it('should display metric description', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="d1_retention">
                    <span>D1</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button', { name: /help for/i });
            await user.click(helpButton);

            expect(screen.getByText(/percentage of new users who return/i)).toBeInTheDocument();
        });

        it('should display formula when available', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="arpu">
                    <span>ARPU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button', { name: /help for/i });
            await user.click(helpButton);

            expect(screen.getByText('Formula')).toBeInTheDocument();
            expect(screen.getByText('Total Revenue / Total Users')).toBeInTheDocument();
        });

        it('should display benchmark when available', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="d1_retention">
                    <span>D1</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button', { name: /help for/i });
            await user.click(helpButton);

            expect(screen.getByText('Benchmark')).toBeInTheDocument();
            expect(screen.getByText(/Good: 35-40%/)).toBeInTheDocument();
        });

        it('should toggle tooltip on multiple clicks', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button', { name: /help for/i });

            await user.click(helpButton);
            expect(screen.getByRole('tooltip')).toBeInTheDocument();

            await user.click(helpButton);
            expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        });
    });

    describe('close functionality', () => {
        it('should close tooltip on Escape key', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button', { name: /help for/i });
            await user.click(helpButton);

            expect(screen.getByRole('tooltip')).toBeInTheDocument();

            fireEvent.keyDown(document, { key: 'Escape' });

            await waitFor(() => {
                expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
            });
        });

        it('should close tooltip on click outside', async () => {
            const user = userEvent.setup();
            render(
                <div>
                    <HelpTooltip term="dau">
                        <span>DAU</span>
                    </HelpTooltip>
                    <button>Outside Button</button>
                </div>
            );

            const helpButton = screen.getByRole('button', { name: /help for/i });
            await user.click(helpButton);

            expect(screen.getByRole('tooltip')).toBeInTheDocument();

            // Click outside
            fireEvent.mouseDown(screen.getByText('Outside Button'));

            await waitFor(() => {
                expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
            });
        });

        it('should not close tooltip when clicking inside tooltip', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button', { name: /help for/i });
            await user.click(helpButton);

            const tooltip = screen.getByRole('tooltip');
            fireEvent.mouseDown(tooltip);

            // Tooltip should still be visible
            expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have aria-label on help button', () => {
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            expect(helpButton).toHaveAttribute('aria-label', 'Help for Daily Active Users (DAU)');
        });

        it('should have aria-expanded attribute', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            expect(helpButton).toHaveAttribute('aria-expanded', 'false');

            await user.click(helpButton);
            expect(helpButton).toHaveAttribute('aria-expanded', 'true');
        });

        it('should have role="tooltip" on tooltip content', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            await user.click(helpButton);

            expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });

        it('should be focusable via keyboard', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="dau">
                    <span>DAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            await user.tab();
            expect(helpButton).toHaveFocus();
        });
    });

    describe('various metrics', () => {
        it('should display MAU information', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="mau">
                    <span>MAU</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            await user.click(helpButton);

            expect(screen.getByText('Monthly Active Users (MAU)')).toBeInTheDocument();
        });

        it('should display LTV information', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="ltv">
                    <span>LTV</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            await user.click(helpButton);

            expect(screen.getByText('Lifetime Value (LTV)')).toBeInTheDocument();
        });

        it('should display churn rate information', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="churn_rate">
                    <span>Churn</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            await user.click(helpButton);

            expect(screen.getByText('Churn Rate')).toBeInTheDocument();
        });

        it('should normalize term with hyphens', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="d1-retention">
                    <span>D1</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            await user.click(helpButton);

            expect(screen.getByText('Day 1 Retention')).toBeInTheDocument();
        });

        it('should normalize term with spaces', async () => {
            const user = userEvent.setup();
            render(
                <HelpTooltip term="session length">
                    <span>Session</span>
                </HelpTooltip>
            );

            const helpButton = screen.getByRole('button');
            await user.click(helpButton);

            expect(screen.getByText('Average Session Length')).toBeInTheDocument();
        });
    });
});

describe('InlineHelp', () => {
    it('should render metric name with tooltip styling', () => {
        render(<InlineHelp term="dau" />);

        expect(screen.getByText('Daily Active Users (DAU)')).toBeInTheDocument();
        expect(screen.getByText('Daily Active Users (DAU)')).toHaveClass('cursor-help');
    });

    it('should have title attribute with description', () => {
        render(<InlineHelp term="dau" />);

        const element = screen.getByText('Daily Active Users (DAU)');
        expect(element).toHaveAttribute('title');
        expect(element.getAttribute('title')).toContain('unique users');
    });

    it('should return null for unknown terms', () => {
        const { container } = render(<InlineHelp term="unknown" />);
        expect(container.firstChild).toBeNull();
    });

    it('should have dotted border styling', () => {
        render(<InlineHelp term="arpu" />);

        const element = screen.getByText('Average Revenue Per User (ARPU)');
        expect(element).toHaveClass('border-dotted');
    });
});

describe('getMetricInfo', () => {
    it('should return metric info for valid term', () => {
        const info = getMetricInfo('dau');

        expect(info).toBeDefined();
        expect(info?.name).toBe('Daily Active Users (DAU)');
        expect(info?.description).toContain('unique users');
    });

    it('should return undefined for invalid term', () => {
        const info = getMetricInfo('nonexistent');
        expect(info).toBeUndefined();
    });

    it('should normalize term with hyphens', () => {
        const info = getMetricInfo('d7-retention');

        expect(info).toBeDefined();
        expect(info?.name).toBe('Day 7 Retention');
    });

    it('should normalize term with spaces', () => {
        const info = getMetricInfo('conversion rate');

        expect(info).toBeDefined();
        expect(info?.name).toBe('Conversion Rate');
    });

    it('should be case insensitive', () => {
        const info = getMetricInfo('ARPU');

        expect(info).toBeDefined();
        expect(info?.name).toBe('Average Revenue Per User (ARPU)');
    });

    it('should include formula when available', () => {
        const info = getMetricInfo('stickiness');

        expect(info?.formula).toBe('DAU / MAU × 100');
    });

    it('should include benchmark when available', () => {
        const info = getMetricInfo('d30_retention');

        expect(info?.benchmark).toContain('5-8%');
    });
});
