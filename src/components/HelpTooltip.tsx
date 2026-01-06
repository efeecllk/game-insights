/**
 * Help Tooltip - Obsidian Analytics Design
 *
 * Contextual help tooltips with:
 * - Glassmorphism containers
 * - Animated reveal
 * - Metric explanations
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ExternalLink } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface HelpTooltipProps {
    term: string;
    children?: React.ReactNode;
}

interface MetricInfo {
    name: string;
    description: string;
    formula?: string;
    benchmark?: string;
    learnMoreUrl?: string;
}

// ============================================================================
// Metric Definitions
// ============================================================================

const METRIC_GLOSSARY: Record<string, MetricInfo> = {
    dau: {
        name: 'Daily Active Users (DAU)',
        description: 'The number of unique users who engaged with your game on a given day.',
        formula: 'Count of unique user IDs with any event on the day',
        benchmark: 'Healthy games aim for DAU/MAU ratio > 20%',
    },
    mau: {
        name: 'Monthly Active Users (MAU)',
        description: 'The number of unique users who engaged with your game in the last 30 days.',
        formula: 'Count of unique user IDs with any event in 30-day window',
    },
    d1_retention: {
        name: 'Day 1 Retention',
        description: 'The percentage of new users who return to your game the day after they first played.',
        formula: 'Users active on Day 1 / Users installed on Day 0',
        benchmark: 'Good: 35-40%, Great: 40-50%',
    },
    d7_retention: {
        name: 'Day 7 Retention',
        description: 'The percentage of new users who return to your game 7 days after first playing.',
        formula: 'Users active on Day 7 / Users installed on Day 0',
        benchmark: 'Good: 15-20%, Great: 20-25%',
    },
    d30_retention: {
        name: 'Day 30 Retention',
        description: 'The percentage of new users who return to your game 30 days after first playing.',
        formula: 'Users active on Day 30 / Users installed on Day 0',
        benchmark: 'Good: 5-8%, Great: 8-12%',
    },
    arpu: {
        name: 'Average Revenue Per User (ARPU)',
        description: 'The average revenue generated per user, including non-paying users.',
        formula: 'Total Revenue / Total Users',
        benchmark: 'Varies significantly by genre and platform',
    },
    arppu: {
        name: 'Average Revenue Per Paying User (ARPPU)',
        description: 'The average revenue generated per paying user.',
        formula: 'Total Revenue / Number of Paying Users',
        benchmark: 'Typically 10-50x higher than ARPU',
    },
    ltv: {
        name: 'Lifetime Value (LTV)',
        description: 'The predicted total revenue a user will generate over their entire relationship with your game.',
        formula: 'ARPU × Average Lifetime (or sum of predicted future revenue)',
        benchmark: 'Should exceed your CAC by at least 3x',
    },
    conversion_rate: {
        name: 'Conversion Rate',
        description: 'The percentage of users who make at least one purchase.',
        formula: 'Paying Users / Total Users × 100',
        benchmark: 'Casual: 1-3%, Mid-core: 3-5%, Hardcore: 5-8%',
    },
    churn_rate: {
        name: 'Churn Rate',
        description: 'The percentage of users who stop playing your game over a given period.',
        formula: 'Users Lost / Users at Start of Period × 100',
        benchmark: 'Lower is better. <5% monthly is excellent.',
    },
    session_length: {
        name: 'Average Session Length',
        description: 'The average time a user spends playing in a single session.',
        formula: 'Total Session Duration / Number of Sessions',
        benchmark: 'Varies by genre: Casual 3-5 min, Mid-core 10-20 min',
    },
    sessions_per_day: {
        name: 'Sessions Per Day',
        description: 'The average number of times a user opens your game per day.',
        formula: 'Total Sessions / DAU',
        benchmark: 'Engaged users: 3-5 sessions/day',
    },
    stickiness: {
        name: 'Stickiness (DAU/MAU)',
        description: 'A measure of how often monthly users engage daily. Higher is better.',
        formula: 'DAU / MAU × 100',
        benchmark: 'Good: 20-30%, Great: 30-50%',
    },
};

// ============================================================================
// Help Tooltip Component
// ============================================================================

export function HelpTooltip({ term, children }: HelpTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const info = METRIC_GLOSSARY[term.toLowerCase().replace(/[- ]/g, '_')];

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(e: MouseEvent) {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!info) {
        // If term not found, just render children or a simple tooltip trigger
        return children ? <>{children}</> : null;
    }

    return (
        <span className="relative inline-flex items-center">
            {children}
            <motion.button
                ref={buttonRef}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="ml-1 p-0.5 rounded-full hover:bg-white/[0.06] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                aria-label={`Help for ${info.name}`}
                aria-expanded={isOpen}
            >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 transition-colors" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={tooltipRef}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        role="tooltip"
                        className="absolute z-50 left-0 top-full mt-2 w-72 p-4 bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-950/98 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl"
                    >
                        {/* Arrow */}
                        <div className="absolute -top-2 left-4 w-4 h-4 bg-slate-900 border-l border-t border-white/[0.08] transform rotate-45" />

                        {/* Content */}
                        <div className="relative">
                            <h4 className="font-semibold text-white text-sm mb-2">
                                {info.name}
                            </h4>
                            <p className="text-sm text-slate-300 mb-3">
                                {info.description}
                            </p>

                            {info.formula && (
                                <div className="mb-3">
                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Formula
                                    </span>
                                    <p className="text-xs text-white font-mono bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-lg mt-1">
                                        {info.formula}
                                    </p>
                                </div>
                            )}

                            {info.benchmark && (
                                <div className="mb-3">
                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Benchmark
                                    </span>
                                    <p className="text-xs text-white mt-1">
                                        {info.benchmark}
                                    </p>
                                </div>
                            )}

                            {info.learnMoreUrl && (
                                <a
                                    href={info.learnMoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline transition-colors"
                                >
                                    Learn more <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}

// ============================================================================
// Simple Inline Help
// ============================================================================

export function InlineHelp({ term }: { term: string }) {
    const info = METRIC_GLOSSARY[term.toLowerCase().replace(/[- ]/g, '_')];

    if (!info) return null;

    return (
        <span
            className="text-slate-300 hover:text-emerald-400 cursor-help border-b border-dotted border-current transition-colors"
            title={info.description}
        >
            {info.name}
        </span>
    );
}

// ============================================================================
// Get metric info (for use in other components)
// ============================================================================

export function getMetricInfo(term: string): MetricInfo | undefined {
    return METRIC_GLOSSARY[term.toLowerCase().replace(/[- ]/g, '_')];
}

export default HelpTooltip;
