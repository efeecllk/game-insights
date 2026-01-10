/**
 * Toast Context
 * Phase 8: Toast notification provider with queue management
 */

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { ToastContainer, ToastType, ToastProps } from '../components/Toast';
import { parseError, ParsedError, RecoveryAction } from '../lib/errorHandler';

// ============================================================================
// Types
// ============================================================================

interface ToastOptions {
    title: string;
    message?: string;
    type?: ToastType;
    duration?: number;
    dismissible?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    // Basic toast methods
    toast: (options: ToastOptions) => string;
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;

    // Error handling
    showError: (error: unknown, onRetry?: () => void) => ParsedError;

    // Toast management
    dismiss: (id: string) => void;
    dismissAll: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface ToastProviderProps {
    children: ReactNode;
    maxToasts?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({
    children,
    maxToasts = 5,
    position = 'bottom-right',
}: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    // Generate unique ID
    const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Dismiss a single toast
    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Dismiss all toasts
    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    // Add a new toast
    const addToast = useCallback((options: ToastOptions): string => {
        const id = generateId();

        const newToast: ToastProps = {
            id,
            type: options.type || 'info',
            title: options.title,
            message: options.message,
            duration: options.duration ?? 5000,
            dismissible: options.dismissible ?? true,
            action: options.action,
            onDismiss: dismiss,
        };

        setToasts((prev) => {
            // Remove oldest if at max
            const updated = prev.length >= maxToasts ? prev.slice(1) : prev;
            return [...updated, newToast];
        });

        return id;
    }, [dismiss, maxToasts]);

    // Convenience methods
    const toast = useCallback((options: ToastOptions) => addToast(options), [addToast]);

    const success = useCallback((title: string, message?: string) =>
        addToast({ title, message, type: 'success' }), [addToast]);

    const error = useCallback((title: string, message?: string) =>
        addToast({ title, message, type: 'error', duration: 8000 }), [addToast]);

    const warning = useCallback((title: string, message?: string) =>
        addToast({ title, message, type: 'warning', duration: 6000 }), [addToast]);

    const info = useCallback((title: string, message?: string) =>
        addToast({ title, message, type: 'info' }), [addToast]);

    // Handle parsed errors with recovery actions
    const showError = useCallback((err: unknown, onRetry?: () => void): ParsedError => {
        const parsed = parseError(err);

        // Build action from recovery actions
        let action: ToastOptions['action'];
        const primaryAction = parsed.recoveryActions.find((a: RecoveryAction) => a.primary);

        if (primaryAction && primaryAction.action === 'retry' && onRetry) {
            action = {
                label: primaryAction.label,
                onClick: onRetry,
            };
        }

        addToast({
            title: parsed.title,
            message: parsed.message,
            type: 'error',
            duration: 8000,
            action,
        });

        // Log for debugging
        console.error('[Toast Error]', parsed);

        return parsed;
    }, [addToast]);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo<ToastContextType>(() => ({
        toast,
        success,
        error,
        warning,
        info,
        showError,
        dismiss,
        dismissAll,
    }), [toast, success, error, warning, info, showError, dismiss, dismissAll]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} position={position} />
        </ToastContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export default ToastProvider;
