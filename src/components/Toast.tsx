/**
 * Toast Component - Obsidian Analytics Design
 *
 * Premium toast notifications with:
 * - Glassmorphism containers
 * - Color-coded status variants
 * - Animated entrance/exit
 * - Progress bar countdown
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        container: 'border-[#DA7756]/30',
        icon: 'text-[#DA7756]',
        title: 'text-[#DA7756]',
        progress: 'bg-[#DA7756]',
    },
    error: {
        container: 'border-[#E25C5C]/30',
        icon: 'text-[#E25C5C]',
        title: 'text-[#E25C5C]',
        progress: 'bg-[#E25C5C]',
    },
    warning: {
        container: 'border-[#E5A84B]/30',
        icon: 'text-[#E5A84B]',
        title: 'text-[#E5A84B]',
        progress: 'bg-[#E5A84B]',
    },
    info: {
        container: 'border-[#8F8B82]/30',
        icon: 'text-[#8F8B82]',
        title: 'text-[#8F8B82]',
        progress: 'bg-[#8F8B82]',
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
    const [progress, setProgress] = useState(100);

    const styles = TOAST_STYLES[type];
    const Icon = TOAST_ICONS[type];

    const handleDismiss = useCallback(() => {
        onDismiss(id);
    }, [id, onDismiss]);

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
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className={`
                relative overflow-hidden
                w-full max-w-sm
                rounded-xl border shadow-lg
                bg-slate-900
                ${styles.container}
            `}
        >
            {/* Main Content */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon with glow */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                        className={`flex-shrink-0 ${styles.icon}`}
                    >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                    </motion.div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${styles.title}`}>
                            {title}
                        </p>
                        {message && (
                            <p className="text-sm text-slate-400 mt-1">
                                {message}
                            </p>
                        )}

                        {/* Action Button */}
                        {action && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
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
                            </motion.button>
                        )}
                    </div>

                    {/* Dismiss Button */}
                    {dismissible && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleDismiss}
                            className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.06]">
                    <motion.div
                        initial={{ width: '100%' }}
                        className={`h-full ${styles.progress}`}
                        style={{ width: `${progress}%` }}
                        aria-hidden="true"
                    />
                </div>
            )}
        </motion.div>
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
    return (
        <div
            className={`fixed z-50 flex flex-col gap-3 ${POSITION_STYLES[position]}`}
            aria-label="Notifications"
        >
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
}

export default Toast;
