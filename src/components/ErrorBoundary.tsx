/**
 * Error Boundary Component - Obsidian Analytics Design
 *
 * Premium error fallback UI with:
 * - Glassmorphism containers
 * - Rose accent for errors
 * - Animated action buttons
 * - Expandable technical details
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

        // Default error UI - Obsidian Analytics Design
        return (
            <div className="min-h-[400px] flex items-center justify-center p-6">
                <div className="max-w-lg w-full bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 text-center shadow-2xl">
                    {/* Icon with glow */}
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 bg-rose-500/20 rounded-2xl blur-xl" />
                        <div className="relative w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-rose-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white mb-2">
                        {parsedError?.title || 'Something went wrong'}
                    </h2>

                    {/* Message */}
                    <p className="text-slate-400 mb-6">
                        {parsedError?.message || 'An unexpected error occurred. Please try again.'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                        <button
                            onClick={this.handleRetry}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/40 text-emerald-400 font-medium rounded-xl transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] text-white font-medium rounded-xl transition-all"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </button>
                        <button
                            onClick={this.handleReport}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <Bug className="w-4 h-4" />
                            Report
                        </button>
                    </div>

                    {/* Error Details Toggle */}
                    <button
                        onClick={this.toggleDetails}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
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
                        <div className="mt-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-left overflow-auto max-h-64">
                            <p className="text-xs text-slate-500 mb-2 font-mono">
                                Error Code: {parsedError?.code || 'UNKNOWN'}
                            </p>
                            {error && (
                                <pre className="text-xs text-rose-400 font-mono whitespace-pre-wrap break-words">
                                    {error.message}
                                    {error.stack && (
                                        <span className="text-slate-600 block mt-2">
                                            {error.stack}
                                        </span>
                                    )}
                                </pre>
                            )}
                            {errorInfo?.componentStack && (
                                <details className="mt-4">
                                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                                        Component Stack
                                    </summary>
                                    <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap mt-2">
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
