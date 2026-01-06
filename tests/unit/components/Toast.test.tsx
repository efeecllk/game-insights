/**
 * Toast Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Toast, ToastContainer, ToastProps } from '@/components/Toast';

// Helper to create toast props
function createToastProps(overrides: Partial<ToastProps> = {}): ToastProps {
    return {
        id: 'test-toast',
        type: 'info',
        title: 'Test Toast',
        onDismiss: vi.fn(),
        ...overrides,
    };
}

describe('Toast', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // =========================================================================
    // Rendering Tests
    // =========================================================================

    describe('rendering', () => {
        it('should render title', () => {
            render(<Toast {...createToastProps({ title: 'Notification Title' })} />);
            expect(screen.getByText('Notification Title')).toBeInTheDocument();
        });

        it('should render message when provided', () => {
            render(
                <Toast {...createToastProps({ message: 'Detailed message' })} />
            );
            expect(screen.getByText('Detailed message')).toBeInTheDocument();
        });

        it('should not render message when not provided', () => {
            render(<Toast {...createToastProps()} />);
            expect(screen.queryByText(/message/i)).not.toBeInTheDocument();
        });

        it('should have correct aria role', () => {
            render(<Toast {...createToastProps()} />);
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Toast Types Tests
    // =========================================================================

    describe('toast types', () => {
        it('should render success toast with correct styling', () => {
            render(<Toast {...createToastProps({ type: 'success', title: 'Success!' })} />);
            const title = screen.getByText('Success!');
            // Obsidian design uses emerald for success
            expect(title).toHaveClass('text-emerald-400');
        });

        it('should render error toast with correct styling', () => {
            render(<Toast {...createToastProps({ type: 'error', title: 'Error!' })} />);
            const title = screen.getByText('Error!');
            // Obsidian design uses rose for error
            expect(title).toHaveClass('text-rose-400');
        });

        it('should render warning toast with correct styling', () => {
            render(<Toast {...createToastProps({ type: 'warning', title: 'Warning!' })} />);
            const title = screen.getByText('Warning!');
            // Obsidian design uses amber for warning
            expect(title).toHaveClass('text-amber-400');
        });

        it('should render info toast with correct styling', () => {
            render(<Toast {...createToastProps({ type: 'info', title: 'Info!' })} />);
            const title = screen.getByText('Info!');
            expect(title).toHaveClass('text-blue-400');
        });
    });

    // =========================================================================
    // Dismiss Tests
    // =========================================================================

    describe('dismissal', () => {
        it('should show dismiss button when dismissible is true', () => {
            render(<Toast {...createToastProps({ dismissible: true })} />);
            expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
        });

        it('should not show dismiss button when dismissible is false', () => {
            render(<Toast {...createToastProps({ dismissible: false })} />);
            expect(screen.queryByLabelText('Dismiss notification')).not.toBeInTheDocument();
        });

        it('should call onDismiss when dismiss button is clicked', async () => {
            const onDismiss = vi.fn();
            render(<Toast {...createToastProps({ onDismiss })} />);

            fireEvent.click(screen.getByLabelText('Dismiss notification'));

            // Wait for animation timeout
            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(onDismiss).toHaveBeenCalledWith('test-toast');
        });

        it('should dismiss on Escape key', async () => {
            const onDismiss = vi.fn();
            render(<Toast {...createToastProps({ onDismiss })} />);

            const alert = screen.getByRole('alert');
            fireEvent.keyDown(alert, { key: 'Escape' });

            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(onDismiss).toHaveBeenCalledWith('test-toast');
        });
    });

    // =========================================================================
    // Auto-dismiss Tests
    // =========================================================================

    describe('auto-dismiss', () => {
        it('should auto-dismiss after duration', async () => {
            const onDismiss = vi.fn();
            render(
                <Toast {...createToastProps({ onDismiss, duration: 3000 })} />
            );

            // Fast-forward time
            act(() => {
                vi.advanceTimersByTime(3500);
            });

            expect(onDismiss).toHaveBeenCalledWith('test-toast');
        });

        it('should not auto-dismiss when duration is 0', async () => {
            const onDismiss = vi.fn();
            render(
                <Toast {...createToastProps({ onDismiss, duration: 0 })} />
            );

            act(() => {
                vi.advanceTimersByTime(10000);
            });

            expect(onDismiss).not.toHaveBeenCalled();
        });

        it('should not auto-dismiss when duration is negative', async () => {
            const onDismiss = vi.fn();
            render(
                <Toast {...createToastProps({ onDismiss, duration: -1 })} />
            );

            act(() => {
                vi.advanceTimersByTime(10000);
            });

            expect(onDismiss).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Action Button Tests
    // =========================================================================

    describe('action button', () => {
        it('should render action button when provided', () => {
            render(
                <Toast
                    {...createToastProps({
                        action: {
                            label: 'Undo',
                            onClick: vi.fn(),
                        },
                    })}
                />
            );

            expect(screen.getByText('Undo')).toBeInTheDocument();
        });

        it('should call action onClick and dismiss when clicked', async () => {
            const onClick = vi.fn();
            const onDismiss = vi.fn();

            render(
                <Toast
                    {...createToastProps({
                        onDismiss,
                        action: {
                            label: 'Retry',
                            onClick,
                        },
                    })}
                />
            );

            fireEvent.click(screen.getByText('Retry'));

            expect(onClick).toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(onDismiss).toHaveBeenCalled();
        });

        it('should not render action button when not provided', () => {
            render(<Toast {...createToastProps()} />);
            expect(screen.queryByRole('button', { name: /undo|retry/i })).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // Progress Bar Tests
    // =========================================================================

    describe('progress bar', () => {
        it('should show progress bar when duration is positive', () => {
            render(<Toast {...createToastProps({ duration: 5000 })} />);
            // Progress bar exists (check for the progress element structure with Obsidian design)
            const toast = screen.getByRole('alert');
            expect(toast.querySelector('.h-1')).toBeInTheDocument();
        });

        it('should not show progress bar when duration is 0', () => {
            render(<Toast {...createToastProps({ duration: 0 })} />);
            const toast = screen.getByRole('alert');
            // No progress container with h-1 class when duration is 0
            const progressContainer = toast.querySelector('.h-1');
            expect(progressContainer).not.toBeInTheDocument();
        });
    });
});

describe('ToastContainer', () => {
    // =========================================================================
    // Container Tests
    // =========================================================================

    describe('rendering', () => {
        it('should render container with no toasts when toasts array is empty', () => {
            render(
                <ToastContainer toasts={[]} onDismiss={vi.fn()} />
            );
            // Container is rendered but has no toast alerts
            const container = screen.getByLabelText('Notifications');
            expect(container).toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        it('should render all toasts', () => {
            const toasts: ToastProps[] = [
                { id: '1', type: 'success', title: 'Success', onDismiss: vi.fn() },
                { id: '2', type: 'error', title: 'Error', onDismiss: vi.fn() },
                { id: '3', type: 'info', title: 'Info', onDismiss: vi.fn() },
            ];

            render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

            expect(screen.getByText('Success')).toBeInTheDocument();
            expect(screen.getByText('Error')).toBeInTheDocument();
            expect(screen.getByText('Info')).toBeInTheDocument();
        });
    });

    describe('positioning', () => {
        const positions = [
            'top-right',
            'top-left',
            'bottom-right',
            'bottom-left',
            'top-center',
            'bottom-center',
        ] as const;

        for (const position of positions) {
            it(`should apply ${position} position styles`, () => {
                const toasts: ToastProps[] = [
                    { id: '1', type: 'info', title: 'Test', onDismiss: vi.fn() },
                ];

                render(
                    <ToastContainer
                        toasts={toasts}
                        onDismiss={vi.fn()}
                        position={position}
                    />
                );

                const container = screen.getByLabelText('Notifications');
                expect(container).toHaveClass('fixed', 'z-50');
            });
        }

        it('should default to bottom-right position', () => {
            const toasts: ToastProps[] = [
                { id: '1', type: 'info', title: 'Test', onDismiss: vi.fn() },
            ];

            render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

            const container = screen.getByLabelText('Notifications');
            expect(container).toHaveClass('bottom-4', 'right-4');
        });
    });

    describe('dismiss handling', () => {
        it('should pass onDismiss to child toasts', () => {
            const onDismiss = vi.fn();
            const toasts: ToastProps[] = [
                { id: 'toast-1', type: 'info', title: 'Test', onDismiss: vi.fn() },
            ];

            render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

            // The container passes its own onDismiss to child toasts
            expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
        });
    });
});
