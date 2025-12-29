/**
 * Toast Component
 * Phase 8: Accessible toast notifications with auto-dismiss
 */

import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    dismissible?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
    onDismiss: (id: string) => void;
}

// ============================================================================
// Toast Icons & Styles
// ============================================================================

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const TOAST_STYLES: Record<ToastType, {
    container: string;
    icon: string;
    title: string;
    progress: string;
}> = {
    success: {
        container: 'bg-th-bg-surface border-green-500/30',
        icon: 'text-green-500',
        title: 'text-green-400',
        progress: 'bg-green-500',
    },
    error: {
        container: 'bg-th-bg-surface border-red-500/30',
        icon: 'text-red-500',
        title: 'text-red-400',
        progress: 'bg-red-500',
    },
    warning: {
        container: 'bg-th-bg-surface border-yellow-500/30',
        icon: 'text-yellow-500',
        title: 'text-yellow-400',
        progress: 'bg-yellow-500',
    },
    info: {
        container: 'bg-th-bg-surface border-blue-500/30',
        icon: 'text-blue-500',
        title: 'text-blue-400',
        progress: 'bg-blue-500',
    },
};

// ============================================================================
// Toast Component
// ============================================================================

export function Toast({
    id,
    type,
    title,
    message,
    duration = 5000,
    dismissible = true,
    action,
    onDismiss,
}: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [progress, setProgress] = useState(100);

    const styles = TOAST_STYLES[type];
    const Icon = TOAST_ICONS[type];

    const handleDismiss = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => {
            onDismiss(id);
        }, 200);
    }, [id, onDismiss]);

    // Enter animation
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    // Auto-dismiss with progress
    useEffect(() => {
        if (duration <= 0) return;

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                handleDismiss();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration, handleDismiss]);

    // Handle keyboard dismiss
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && dismissible) {
            handleDismiss();
        }
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className={`
                relative overflow-hidden
                w-full max-w-sm
                rounded-xl border shadow-lg
                transition-all duration-200 ease-out
                ${styles.container}
                ${isVisible && !isLeaving
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-4 opacity-0'
                }
            `}
        >
            {/* Main Content */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${styles.icon}`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                        <p className={`font-medium ${styles.title}`}>
                            {title}
                        </p>
                        {message && (
                            <p className="text-sm text-th-text-muted mt-1">
                                {message}
                            </p>
                        )}

                        {/* Action Button */}
                        {action && (
                            <button
                                onClick={() => {
                                    action.onClick();
                                    handleDismiss();
                                }}
                                className={`
                                    mt-2 text-sm font-medium
                                    ${styles.icon}
                                    hover:underline focus:outline-none focus:underline
                                `}
                            >
                                {action.label}
                            </button>
                        )}
                    </div>

                    {/* Dismiss Button */}
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 p-1 rounded-lg text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover transition-colors focus:outline-none focus:ring-2 focus:ring-th-accent-primary"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-th-border">
                    <div
                        className={`h-full transition-all duration-50 ${styles.progress}`}
                        style={{ width: `${progress}%` }}
                        aria-hidden="true"
                    />
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Toast Container
// ============================================================================

interface ToastContainerProps {
    toasts: ToastProps[];
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const POSITION_STYLES: Record<NonNullable<ToastContainerProps['position']>, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export function ToastContainer({
    toasts,
    onDismiss,
    position = 'bottom-right',
}: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div
            className={`fixed z-50 flex flex-col gap-3 ${POSITION_STYLES[position]}`}
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

export default Toast;
