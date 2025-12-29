/**
 * KeyboardShortcuts Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ShortcutsModal, useKeyboardShortcuts } from '../../../src/components/KeyboardShortcuts';

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter>{children}</MemoryRouter>;
}

describe('ShortcutsModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render when isOpen is true', () => {
            render(<ShortcutsModal {...defaultProps} />);

            expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
        });

        it('should not render when isOpen is false', () => {
            render(<ShortcutsModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
        });

        it('should render Navigation category', () => {
            render(<ShortcutsModal {...defaultProps} />);

            expect(screen.getByText('Navigation')).toBeInTheDocument();
        });

        it('should render Actions category', () => {
            render(<ShortcutsModal {...defaultProps} />);

            expect(screen.getByText('Actions')).toBeInTheDocument();
        });

        it('should render General category', () => {
            render(<ShortcutsModal {...defaultProps} />);

            expect(screen.getByText('General')).toBeInTheDocument();
        });

        it('should display navigation shortcuts', () => {
            render(<ShortcutsModal {...defaultProps} />);

            expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Go to Analytics')).toBeInTheDocument();
            expect(screen.getByText('Go to Retention')).toBeInTheDocument();
            expect(screen.getByText('Go to Monetization')).toBeInTheDocument();
            expect(screen.getByText('Go to Predictions')).toBeInTheDocument();
        });

        it('should display action shortcuts', () => {
            render(<ShortcutsModal {...defaultProps} />);

            expect(screen.getByText('Open command palette')).toBeInTheDocument();
            expect(screen.getByText('Quick search')).toBeInTheDocument();
            expect(screen.getByText('Upload data')).toBeInTheDocument();
            expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument();
        });

        it('should display general shortcuts', () => {
            render(<ShortcutsModal {...defaultProps} />);

            expect(screen.getByText('Close modal or cancel')).toBeInTheDocument();
            expect(screen.getByText('Navigate lists')).toBeInTheDocument();
            expect(screen.getByText('Select item')).toBeInTheDocument();
            expect(screen.getByText('Move to next element')).toBeInTheDocument();
        });

        it('should render shortcut keys in kbd elements', () => {
            render(<ShortcutsModal {...defaultProps} />);

            // Check for key elements
            const kbdElements = document.querySelectorAll('kbd');
            expect(kbdElements.length).toBeGreaterThan(0);
        });

        it('should display footer with toggle hint', () => {
            render(<ShortcutsModal {...defaultProps} />);

            expect(screen.getByText(/Press/)).toBeInTheDocument();
            expect(screen.getByText(/to toggle this dialog/)).toBeInTheDocument();
        });
    });

    describe('close functionality', () => {
        it('should call onClose when clicking backdrop', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<ShortcutsModal isOpen={true} onClose={onClose} />);

            // Click on backdrop
            const backdrop = document.querySelector('.bg-black\\/60');
            if (backdrop) {
                await user.click(backdrop);
            }

            expect(onClose).toHaveBeenCalled();
        });

        it('should call onClose when clicking close button', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<ShortcutsModal isOpen={true} onClose={onClose} />);

            const closeButton = screen.getByRole('button', { name: /close/i });
            await user.click(closeButton);

            expect(onClose).toHaveBeenCalled();
        });

        it('should call onClose when pressing Escape key', () => {
            const onClose = vi.fn();
            render(<ShortcutsModal isOpen={true} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalled();
        });

        it('should not call onClose on Escape when modal is closed', () => {
            const onClose = vi.fn();
            render(<ShortcutsModal isOpen={false} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe('accessibility', () => {
        it('should have a close button with accessible label', () => {
            render(<ShortcutsModal {...defaultProps} />);

            // Close button has aria-label for accessibility
            const closeButton = screen.getByRole('button', { name: /close/i });
            expect(closeButton).toHaveAttribute('aria-label', 'Close keyboard shortcuts dialog');
        });

        it('should have proper heading hierarchy', () => {
            render(<ShortcutsModal {...defaultProps} />);

            const mainHeading = screen.getByRole('heading', { level: 2, name: 'Keyboard Shortcuts' });
            expect(mainHeading).toBeInTheDocument();

            const categoryHeadings = screen.getAllByRole('heading', { level: 3 });
            expect(categoryHeadings.length).toBe(3);
        });

        it('should render shortcut keys with proper formatting', () => {
            render(<ShortcutsModal {...defaultProps} />);

            // Check that "then" text is displayed between multi-key shortcuts
            const thenElements = screen.getAllByText('then');
            expect(thenElements.length).toBeGreaterThan(0);
        });
    });
});

describe('useKeyboardShortcuts hook', () => {
    let mockOnOpenCommandPalette: ReturnType<typeof vi.fn>;
    let mockOnOpenShortcuts: ReturnType<typeof vi.fn>;

    function TestComponent() {
        mockOnOpenCommandPalette = vi.fn();
        mockOnOpenShortcuts = vi.fn();

        useKeyboardShortcuts({
            onOpenCommandPalette: mockOnOpenCommandPalette,
            onOpenShortcuts: mockOnOpenShortcuts,
        });

        return <div data-testid="test-component">Test</div>;
    }

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should open shortcuts on ? key', () => {
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        );

        fireEvent.keyDown(document, { key: '?' });

        expect(mockOnOpenShortcuts).toHaveBeenCalled();
    });

    it('should open command palette on / key', () => {
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        );

        fireEvent.keyDown(document, { key: '/' });

        expect(mockOnOpenCommandPalette).toHaveBeenCalled();
    });

    it('should ignore shortcuts when typing in input', () => {
        render(
            <TestWrapper>
                <div>
                    <TestComponent />
                    <input data-testid="test-input" />
                </div>
            </TestWrapper>
        );

        const input = screen.getByTestId('test-input');
        fireEvent.keyDown(input, { key: '?' });

        expect(mockOnOpenShortcuts).not.toHaveBeenCalled();
    });

    it('should ignore shortcuts when typing in textarea', () => {
        render(
            <TestWrapper>
                <div>
                    <TestComponent />
                    <textarea data-testid="test-textarea" />
                </div>
            </TestWrapper>
        );

        const textarea = screen.getByTestId('test-textarea');
        fireEvent.keyDown(textarea, { key: '/' });

        expect(mockOnOpenCommandPalette).not.toHaveBeenCalled();
    });
});
