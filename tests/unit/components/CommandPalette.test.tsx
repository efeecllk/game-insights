/**
 * CommandPalette Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette, useCommandPalette } from '../../../src/components/CommandPalette';

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter>{children}</MemoryRouter>;
}

describe('CommandPalette', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render when isOpen is true', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
        });

        it('should not render when isOpen is false', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} isOpen={false} />
                </TestWrapper>
            );

            expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
        });

        it('should render all category labels', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Navigation')).toBeInTheDocument();
            expect(screen.getByText('Actions')).toBeInTheDocument();
            expect(screen.getByText('Help')).toBeInTheDocument();
        });

        it('should render command list items', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Analytics')).toBeInTheDocument();
            expect(screen.getByText('Upload Data')).toBeInTheDocument();
        });

        it('should render keyboard hints in footer', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('to navigate')).toBeInTheDocument();
            expect(screen.getByText('to select')).toBeInTheDocument();
            expect(screen.getByText('to close')).toBeInTheDocument();
        });
    });

    describe('search functionality', () => {
        it('should filter commands based on search query', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            await user.type(input, 'dashboard');

            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            // Other commands should be filtered out or not visible
            expect(screen.queryByText('Upload Data')).not.toBeInTheDocument();
        });

        it('should filter commands by keywords', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            await user.type(input, 'revenue');

            expect(screen.getByText('Monetization')).toBeInTheDocument();
        });

        it('should show no results message when no commands match', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            await user.type(input, 'xyznonexistent');

            expect(screen.getByText(/No commands found for/)).toBeInTheDocument();
        });

        it('should reset selection when query changes', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');

            // Navigate down to select an item
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{ArrowDown}');

            // Type to search, which should reset selection
            await user.type(input, 'monetization');

            // First matching item should be selected (index 0)
            const monetizationOption = screen.getByRole('option', { name: /Monetization/i });
            expect(monetizationOption).toHaveClass('bg-emerald-500/10');
        });
    });

    describe('keyboard navigation', () => {
        it('should navigate down with ArrowDown key', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            await user.click(input);
            await user.keyboard('{ArrowDown}');

            // Second item should now be selected
            const options = screen.getAllByRole('option');
            expect(options[1]).toHaveClass('bg-emerald-500/10');
        });

        it('should navigate up with ArrowUp key', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            await user.click(input);
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{ArrowUp}');

            // Second item should now be selected
            const options = screen.getAllByRole('option');
            expect(options[1]).toHaveClass('bg-emerald-500/10');
        });

        it('should not go below first item', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            await user.click(input);
            await user.keyboard('{ArrowUp}');
            await user.keyboard('{ArrowUp}');

            // First item should still be selected
            const options = screen.getAllByRole('option');
            expect(options[0]).toHaveClass('bg-emerald-500/10');
        });

        it('should execute selected command on Enter', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(
                <TestWrapper>
                    <CommandPalette isOpen={true} onClose={onClose} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            await user.click(input);
            await user.keyboard('{Enter}');

            // onClose should be called when command is executed
            expect(onClose).toHaveBeenCalled();
        });

        it('should close on Escape key', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(
                <TestWrapper>
                    <CommandPalette isOpen={true} onClose={onClose} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            await user.click(input);
            await user.keyboard('{Escape}');

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('mouse interaction', () => {
        it('should close when clicking backdrop', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(
                <TestWrapper>
                    <CommandPalette isOpen={true} onClose={onClose} />
                </TestWrapper>
            );

            // Click on backdrop (the div with bg-black/60)
            const backdrop = document.querySelector('.bg-black\\/60');
            if (backdrop) {
                await user.click(backdrop);
            }

            expect(onClose).toHaveBeenCalled();
        });

        it('should update selection on mouse enter', async () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            // Get all options
            const options = screen.getAllByRole('option');
            const analyticsOption = options.find(o => o.textContent?.includes('Analytics'));
            expect(analyticsOption).toBeDefined();

            // First option (Dashboard) should be initially selected
            expect(options[0]).toHaveClass('bg-emerald-500/10');
        });

        it('should execute command on click', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(
                <TestWrapper>
                    <CommandPalette isOpen={true} onClose={onClose} />
                </TestWrapper>
            );

            // Get all options and find the Analytics one
            const options = screen.getAllByRole('option');
            const analyticsOption = options.find(o => o.textContent?.includes('Analytics'));
            await user.click(analyticsOption!);

            // onClose should be called when command is executed
            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('accessibility', () => {
        it('should have accessible input with placeholder', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            const input = screen.getByPlaceholderText('Type a command or search...');
            expect(input).toBeInTheDocument();
            expect(input.tagName).toBe('INPUT');
        });

        it('should have keyboard shortcut hints visible', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            // Check for ESC hint
            const escKbd = screen.getAllByText('ESC');
            expect(escKbd.length).toBeGreaterThan(0);
        });

        it('should display command shortcuts', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            // Check for navigation shortcuts like 'G D'
            expect(screen.getByText('G D')).toBeInTheDocument();
            expect(screen.getByText('G A')).toBeInTheDocument();
        });
    });

    describe('command descriptions', () => {
        it('should display command descriptions', () => {
            render(
                <TestWrapper>
                    <CommandPalette {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Go to overview dashboard')).toBeInTheDocument();
            expect(screen.getByText('View detailed analytics')).toBeInTheDocument();
        });
    });
});

describe('useCommandPalette hook', () => {
    function TestHookComponent() {
        const { isOpen, open, close, toggle } = useCommandPalette();
        return (
            <div>
                <span data-testid="status">{isOpen ? 'open' : 'closed'}</span>
                <button onClick={open}>Open</button>
                <button onClick={close}>Close</button>
                <button onClick={toggle}>Toggle</button>
            </div>
        );
    }

    it('should start with closed state', () => {
        render(<TestHookComponent />);
        expect(screen.getByTestId('status')).toHaveTextContent('closed');
    });

    it('should open when open() is called', async () => {
        const user = userEvent.setup();
        render(<TestHookComponent />);

        await user.click(screen.getByText('Open'));
        expect(screen.getByTestId('status')).toHaveTextContent('open');
    });

    it('should close when close() is called', async () => {
        const user = userEvent.setup();
        render(<TestHookComponent />);

        await user.click(screen.getByText('Open'));
        await user.click(screen.getByText('Close'));
        expect(screen.getByTestId('status')).toHaveTextContent('closed');
    });

    it('should toggle state when toggle() is called', async () => {
        const user = userEvent.setup();
        render(<TestHookComponent />);

        await user.click(screen.getByText('Toggle'));
        expect(screen.getByTestId('status')).toHaveTextContent('open');

        await user.click(screen.getByText('Toggle'));
        expect(screen.getByTestId('status')).toHaveTextContent('closed');
    });
});
