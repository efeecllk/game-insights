/**
 * Error Boundary Component
 * Phase 8: Catches React errors with user-friendly fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { parseError, logError, ParsedError } from '../lib/errorHandler';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    parsedError: ParsedError | null;
    showDetails: boolean;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            parsedError: null,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
            parsedError: parseError(error),
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error for debugging
        logError(error, {
            componentStack: errorInfo.componentStack,
        });

        // Update state with error info
        this.setState({ errorInfo });

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.props.onReset?.();
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            parsedError: null,
            showDetails: false,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleReport = () => {
        const { error, errorInfo, parsedError } = this.state;

        // Build report data
        const reportData = {
            error: {
                message: error?.message,
                stack: error?.stack,
            },
            errorInfo: {
                componentStack: errorInfo?.componentStack,
            },
            parsed: {
                code: parsedError?.code,
                title: parsedError?.title,
            },
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        };

        // Copy to clipboard for user to paste in bug report
        const reportText = JSON.stringify(reportData, null, 2);
        navigator.clipboard.writeText(reportText).then(() => {
            alert('Error details copied to clipboard. Please paste this in your bug report.');
        }).catch(() => {
            // Fallback: open mailto link
            const subject = encodeURIComponent(`Bug Report: ${parsedError?.title || 'Error'}`);
            const body = encodeURIComponent(`Error Details:\n\n${reportText}`);
            window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
        });
    };

    toggleDetails = () => {
        this.setState((prev) => ({ showDetails: !prev.showDetails }));
    };

    render() {
        const { hasError, error, errorInfo, parsedError, showDetails } = this.state;
        const { children, fallback } = this.props;

        if (!hasError) {
            return children;
        }

        // Use custom fallback if provided
        if (fallback) {
            return fallback;
        }

        // Default error UI
        return (
            <div className="min-h-[400px] flex items-center justify-center p-6">
                <div className="max-w-lg w-full bg-th-bg-surface rounded-2xl border border-th-border p-8 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-th-text-primary mb-2">
                        {parsedError?.title || 'Something went wrong'}
                    </h2>

                    {/* Message */}
                    <p className="text-th-text-muted mb-6">
                        {parsedError?.message || 'An unexpected error occurred. Please try again.'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                        <button
                            onClick={this.handleRetry}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-th-accent-primary hover:bg-th-accent-primary-hover text-white font-medium rounded-xl transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-th-bg-elevated hover:bg-th-interactive-hover text-th-text-primary font-medium rounded-xl border border-th-border transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </button>
                        <button
                            onClick={this.handleReport}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-th-text-muted hover:text-th-text-primary transition-colors"
                        >
                            <Bug className="w-4 h-4" />
                            Report
                        </button>
                    </div>

                    {/* Error Details Toggle */}
                    <button
                        onClick={this.toggleDetails}
                        className="inline-flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                    >
                        {showDetails ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                Hide Details
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                Show Details
                            </>
                        )}
                    </button>

                    {/* Error Details */}
                    {showDetails && (
                        <div className="mt-4 p-4 bg-th-bg-elevated rounded-xl text-left overflow-auto max-h-64">
                            <p className="text-xs text-th-text-muted mb-2 font-mono">
                                Error Code: {parsedError?.code || 'UNKNOWN'}
                            </p>
                            {error && (
                                <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap break-words">
                                    {error.message}
                                    {error.stack && (
                                        <span className="text-th-text-muted block mt-2">
                                            {error.stack}
                                        </span>
                                    )}
                                </pre>
                            )}
                            {errorInfo?.componentStack && (
                                <details className="mt-4">
                                    <summary className="text-xs text-th-text-muted cursor-pointer hover:text-th-text-secondary">
                                        Component Stack
                                    </summary>
                                    <pre className="text-xs text-th-text-muted font-mono whitespace-pre-wrap mt-2">
                                        {errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

// ============================================================================
// Functional Wrapper with Reset Key
// ============================================================================

interface ErrorBoundaryWrapperProps extends Omit<ErrorBoundaryProps, 'onReset'> {
    resetKeys?: unknown[];
}

export function ErrorBoundaryWithReset({
    children,
    resetKeys = [],
    ...props
}: ErrorBoundaryWrapperProps) {
    // Use reset keys to force remount of error boundary
    const key = resetKeys.map((k) => String(k)).join('-');

    return (
        <ErrorBoundary key={key} {...props}>
            {children}
        </ErrorBoundary>
    );
}

export default ErrorBoundary;
