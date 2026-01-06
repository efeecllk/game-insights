/**
 * Advanced Toggle Component
 *
 * Progressive disclosure component that hides advanced features
 * behind an expandable section.
 */

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings2 } from 'lucide-react';

interface AdvancedToggleProps {
    /** Content to show when expanded */
    children: ReactNode;
    /** Label for the toggle button */
    label?: string;
    /** Whether to start expanded */
    defaultExpanded?: boolean;
    /** Storage key for persisting state */
    storageKey?: string;
    /** Compact styling */
    compact?: boolean;
}

export function AdvancedToggle({
    children,
    label = 'Show Advanced Options',
    defaultExpanded = false,
    storageKey,
    compact = false,
}: AdvancedToggleProps) {
    const [isExpanded, setIsExpanded] = useState(() => {
        if (storageKey) {
            const stored = localStorage.getItem(`advanced-toggle-${storageKey}`);
            return stored === 'true';
        }
        return defaultExpanded;
    });

    const handleToggle = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        if (storageKey) {
            localStorage.setItem(`advanced-toggle-${storageKey}`, String(newState));
        }
    };

    if (compact) {
        return (
            <div>
                <button
                    onClick={handleToggle}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors py-2"
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                    <span>{isExpanded ? 'Hide Advanced' : label}</span>
                </button>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Toggle Button */}
            <motion.button
                onClick={handleToggle}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 border border-white/[0.06] flex items-center justify-center">
                        <Settings2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                        {isExpanded ? 'Hide Advanced Options' : label}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-500 group-hover:text-slate-400 transition-colors"
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </motion.button>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 space-y-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdvancedToggle;
