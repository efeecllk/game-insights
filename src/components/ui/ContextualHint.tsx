/**
 * Contextual Hint Component
 *
 * Provides inline hints and tips for complex features.
 * Can be dismissed and remembers user preferences.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ChevronRight } from 'lucide-react';

interface ContextualHintProps {
    /** Unique ID for storing dismissal state */
    id: string;
    /** The hint message to display */
    message: string;
    /** Optional action button text */
    actionText?: string;
    /** Optional action callback */
    onAction?: () => void;
    /** Whether the hint can be dismissed */
    dismissible?: boolean;
    /** Variant styling */
    variant?: 'info' | 'tip' | 'warning';
    /** Compact mode for inline use */
    compact?: boolean;
}

const STORAGE_KEY = 'game-insights-dismissed-hints';

function getDismissedHints(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function setDismissedHint(id: string) {
    try {
        const dismissed = getDismissedHints();
        if (!dismissed.includes(id)) {
            dismissed.push(id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
        }
    } catch {
        // Ignore storage errors
    }
}

export function ContextualHint({
    id,
    message,
    actionText,
    onAction,
    dismissible = true,
    variant = 'tip',
    compact = false,
}: ContextualHintProps) {
    const [isDismissed, setIsDismissed] = useState(() => getDismissedHints().includes(id));

    if (isDismissed) {
        return null;
    }

    const handleDismiss = () => {
        setDismissedHint(id);
        setIsDismissed(true);
    };

    const variantStyles = {
        info: {
            bg: 'from-blue-500/10 to-blue-600/5',
            border: 'border-blue-500/20',
            icon: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            text: 'text-blue-300',
        },
        tip: {
            bg: 'from-[#DA7756]/10 to-[#C15F3C]/5',
            border: 'border-[#DA7756]/20',
            icon: 'text-[#DA7756] bg-[#DA7756]/10 border-[#DA7756]/20',
            text: 'text-[#DA7756]',
        },
        warning: {
            bg: 'from-amber-500/10 to-amber-600/5',
            border: 'border-amber-500/20',
            icon: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            text: 'text-amber-300',
        },
    };

    const styles = variantStyles[variant];

    if (compact) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r ${styles.bg} border ${styles.border}`}
                >
                    <Lightbulb className={`w-3.5 h-3.5 ${styles.text} flex-shrink-0`} />
                    <span className="text-xs text-slate-300 flex-1">{message}</span>
                    {actionText && onAction && (
                        <button
                            onClick={onAction}
                            className={`text-xs font-medium ${styles.text} hover:underline flex items-center gap-0.5`}
                        >
                            {actionText}
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            aria-label="Dismiss hint"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`relative bg-gradient-to-br ${styles.bg} backdrop-blur-xl rounded-xl p-4 border ${styles.border} overflow-hidden`}
            >
                {/* Background texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                <div className="relative flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${styles.icon} border flex items-center justify-center flex-shrink-0`}>
                        <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">{message}</p>
                        {actionText && onAction && (
                            <button
                                onClick={onAction}
                                className={`mt-2 text-sm font-medium ${styles.text} hover:underline inline-flex items-center gap-1`}
                            >
                                {actionText}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/[0.05]"
                            aria-label="Dismiss hint"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Hook to reset all dismissed hints (useful for testing/settings)
 */
export function useResetHints() {
    return {
        resetAll: () => {
            localStorage.removeItem(STORAGE_KEY);
        },
        reset: (id: string) => {
            const dismissed = getDismissedHints().filter(h => h !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
        },
    };
}

export default ContextualHint;
