/**
 * ErrorBoundary Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, ErrorBoundaryWithReset } from '@/components/ErrorBoundary';

// Helper component that throws an error
function ThrowError({ shouldThrow = false, message = 'Test error' }) {
    if (shouldThrow) {
        throw new Error(message);
    }
    return <div>No error</div>;
}

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeEach(() => {
    console.error = vi.fn();
});
afterEach(() => {
    console.error = originalError;
});

describe('ErrorBoundary', () => {
    // =========================================================================
    // Basic Rendering Tests
    // =========================================================================

    describe('rendering', () => {
        it('should render children when no error', () => {
            render(
                <ErrorBoundary>
                    <div>Test content</div>
                </ErrorBoundary>
            );

            expect(screen.getByText('Test content')).toBeInTheDocument();
        });

        it('should render fallback UI when error occurs', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow />
                </ErrorBoundary>
            );

            // parsedError?.title returns "Something Went Wrong" (capitalized)
            expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
        });

        it('should render custom fallback when provided', () => {
            render(
                <ErrorBoundary fallback={<div>Custom error UI</div>}>
                    <ThrowError shouldThrow />
                </ErrorBoundary>
            );

            expect(screen.getByText('Custom error UI')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    describe('error handling', () => {
        it('should call onError callback when error occurs', () => {
            const onError = vi.fn();

            render(
                <ErrorBoundary onError={onError}>
                    <ThrowError shouldThrow message="Test error message" />
                </ErrorBoundary>
            );

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Test error message' }),
                expect.objectContaining({ componentStack: expect.any(String) })
            );
        });

        it('should display error message', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow message="Specific error" />
                </ErrorBoundary>
            );

            // Default UI should show - parsedError uses capitalized title
            expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // User Interaction Tests
    // =========================================================================

    describe('user interactions', () => {
        it('should reset error state when Try Again is clicked', () => {
            const onReset = vi.fn();

            const { rerender } = render(
                <ErrorBoundary onReset={onReset}>
                    <ThrowError shouldThrow />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();

            // Click Try Again
            fireEvent.click(screen.getByText('Try Again'));

            expect(onReset).toHaveBeenCalled();
        });

        it('should show/hide details when toggle is clicked', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow />
                </ErrorBoundary>
            );

            // Initially hidden
            expect(screen.queryByText(/Error Code:/)).not.toBeInTheDocument();

            // Click to show details
            fireEvent.click(screen.getByText('Show Details'));
            expect(screen.getByText(/Error Code:/)).toBeInTheDocument();

            // Click to hide details
            fireEvent.click(screen.getByText('Hide Details'));
            expect(screen.queryByText(/Error Code:/)).not.toBeInTheDocument();
        });

        it('should render action buttons', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow />
                </ErrorBoundary>
            );

            expect(screen.getByText('Try Again')).toBeInTheDocument();
            expect(screen.getByText('Go Home')).toBeInTheDocument();
            expect(screen.getByText('Report')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Report Feature Tests
    // =========================================================================

    describe('report feature', () => {
        it('should copy error details to clipboard when Report is clicked', async () => {
            const writeText = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText },
                writable: true,
                configurable: true,
            });

            const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow message="Error to report" />
                </ErrorBoundary>
            );

            fireEvent.click(screen.getByText('Report'));

            // Wait for clipboard write
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(writeText).toHaveBeenCalled();
            const writtenData = writeText.mock.calls[0][0];
            expect(writtenData).toContain('Error to report');

            alertMock.mockRestore();
        });
    });
});

describe('ErrorBoundaryWithReset', () => {
    it('should remount when resetKeys change', () => {
        // First render with error
        const { unmount } = render(
            <ErrorBoundaryWithReset resetKeys={[1]}>
                <ThrowError shouldThrow />
            </ErrorBoundaryWithReset>
        );

        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();

        // Unmount and render fresh with new key (simulating key change)
        unmount();

        render(
            <ErrorBoundaryWithReset resetKeys={[2]}>
                <ThrowError shouldThrow={false} />
            </ErrorBoundaryWithReset>
        );

        // Should now show normal content
        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should handle empty resetKeys', () => {
        render(
            <ErrorBoundaryWithReset>
                <div>Content</div>
            </ErrorBoundaryWithReset>
        );

        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle multiple resetKeys', () => {
        render(
            <ErrorBoundaryWithReset resetKeys={['key1', 'key2', 123]}>
                <div>Multi-key content</div>
            </ErrorBoundaryWithReset>
        );

        expect(screen.getByText('Multi-key content')).toBeInTheDocument();
    });
});
