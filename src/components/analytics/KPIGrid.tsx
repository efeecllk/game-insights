/**
 * KPIGrid Component - Obsidian Analytics Design
 *
 * Premium KPI dashboard with:
 * - Glassmorphism cards with color-coded accents
 * - Animated hover states with glow effects
 * - Staggered entrance animations
 * - Trend indicators with pulse effects
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Repeat, Activity, Zap } from 'lucide-react';
import { CalculatedMetrics } from '../../ai/MetricCalculator';

// ============================================================================
// Types
// ============================================================================

interface KPIGridProps {
    metrics?: CalculatedMetrics;
    className?: string;
}

interface KPICardProps {
    label: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    tooltip?: string;
    color?: 'primary' | 'secondary' | 'blue' | 'violet' | 'amber' | 'rose';
    index?: number;
}

// ============================================================================
// Color Styles
// ============================================================================

const COLOR_STYLES = {
    primary: {
        bg: 'from-[#DA7756]/20 to-[#DA7756]/5',
        border: 'border-[#DA7756]/20',
        icon: 'text-[#DA7756]',
        glow: 'bg-[#DA7756]/20',
        hoverBorder: 'hover:border-[#DA7756]/40',
    },
    secondary: {
        bg: 'from-[#C15F3C]/20 to-[#C15F3C]/5',
        border: 'border-[#C15F3C]/20',
        icon: 'text-[#C15F3C]',
        glow: 'bg-[#C15F3C]/20',
        hoverBorder: 'hover:border-[#C15F3C]/40',
    },
    blue: {
        bg: 'from-[#A68B5B]/20 to-[#A68B5B]/5',
        border: 'border-[#A68B5B]/20',
        icon: 'text-[#A68B5B]',
        glow: 'bg-[#A68B5B]/20',
        hoverBorder: 'hover:border-[#A68B5B]/40',
    },
    violet: {
        bg: 'from-[#C15F3C]/20 to-[#C15F3C]/5',
        border: 'border-[#C15F3C]/20',
        icon: 'text-[#C15F3C]',
        glow: 'bg-[#C15F3C]/20',
        hoverBorder: 'hover:border-[#C15F3C]/40',
    },
    amber: {
        bg: 'from-[#E5A84B]/20 to-[#E5A84B]/5',
        border: 'border-[#E5A84B]/20',
        icon: 'text-[#E5A84B]',
        glow: 'bg-[#E5A84B]/20',
        hoverBorder: 'hover:border-[#E5A84B]/40',
    },
    rose: {
        bg: 'from-[#E25C5C]/20 to-[#E25C5C]/5',
        border: 'border-[#E25C5C]/20',
        icon: 'text-[#E25C5C]',
        glow: 'bg-[#E25C5C]/20',
        hoverBorder: 'hover:border-[#E25C5C]/40',
    },
};

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
        },
    },
};

// ============================================================================
// KPI Card Component
// ============================================================================

const KPICard = memo(function KPICard({ label, value, change, icon, tooltip, color = 'primary', index = 0 }: KPICardProps) {
    const isPositive = change !== undefined && change >= 0;
    const hasChange = change !== undefined && !isNaN(change);
    const styles = COLOR_STYLES[color];

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
                group relative overflow-hidden
                bg-slate-900
                 rounded-xl
                border ${styles.border} ${styles.hoverBorder}
                p-5 transition-all duration-300
                hover:shadow-lg hover:shadow-black/20
            `}
            title={tooltip}
        >
            {/* Background glow effect */}
            <div className={`absolute -top-8 -right-8 w-24 h-24 ${styles.glow} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Content */}
            <div className="relative">
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                    {/* Icon */}
                    <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${styles.bg} border ${styles.border} flex items-center justify-center`}>
                        <div className={`${styles.icon}`}>
                            {icon}
                        </div>
                    </div>

                    {/* Change indicator */}
                    {hasChange && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                isPositive
                                    ? 'bg-[#7A8B5B]/10 text-[#7A8B5B] border border-[#7A8B5B]/20'
                                    : 'bg-[#E25C5C]/10 text-[#E25C5C] border border-[#E25C5C]/20'
                            }`}
                        >
                            {isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{isPositive ? '+' : ''}{(change * 100).toFixed(1)}%</span>
                        </motion.div>
                    )}
                </div>

                {/* Value */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                    className="text-2xl font-bold text-white mb-1 tracking-tight"
                >
                    {value}
                </motion.div>

                {/* Label */}
                <div className="text-sm text-slate-400">{label}</div>
            </div>
        </motion.div>
    );
});

// ============================================================================
// Format Utilities
// ============================================================================

function formatNumber(num: number, decimals = 0): string {
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toFixed(decimals);
}

function formatCurrency(num: number): string {
    if (num >= 1_000_000) {
        return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
        return `$${(num / 1_000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
}

function formatPercent(num: number): string {
    return `${num.toFixed(1)}%`;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function KPIGridSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="bg-slate-900  rounded-xl border border-slate-800 p-5"
                >
                    <div className="animate-pulse">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-11 h-11 bg-white/[0.06] rounded-xl" />
                            <div className="w-16 h-6 bg-white/[0.06] rounded-full" />
                        </div>
                        <div className="h-8 bg-white/[0.06] rounded-lg mb-2 w-20" />
                        <div className="h-4 bg-white/[0.06] rounded w-28" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export const KPIGrid = memo(function KPIGrid({ metrics, className }: KPIGridProps) {
    // Memoize KPI card data to prevent recalculation on every render
    const kpis = useMemo<KPICardProps[]>(() => {
        const result: KPICardProps[] = [];
        if (!metrics) return result;
        // Engagement metrics
        if (metrics.engagement?.dau !== undefined) {
            result.push({
                label: 'Daily Active Users',
                value: formatNumber(metrics.engagement.dau),
                icon: <Users className="w-5 h-5" />,
                tooltip: 'Unique users active today',
                color: 'primary',
            });
        }

        if (metrics.engagement?.dauMauRatio !== undefined) {
            result.push({
                label: 'Stickiness (DAU/MAU)',
                value: formatPercent(metrics.engagement.dauMauRatio * 100),
                icon: <Activity className="w-5 h-5" />,
                tooltip: 'How often users return',
                color: 'blue',
            });
        }

        if (metrics.engagement?.avgSessionsPerUser !== undefined) {
            result.push({
                label: 'Sessions / User',
                value: metrics.engagement.avgSessionsPerUser.toFixed(1),
                icon: <Repeat className="w-5 h-5" />,
                tooltip: 'Average sessions per user',
                color: 'secondary',
            });
        }

        // Retention metrics
        if (metrics.retention?.classic?.['D1'] !== undefined) {
            result.push({
                label: 'Day 1 Retention',
                value: formatPercent(metrics.retention.classic['D1']),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Users who return on day 1',
                color: 'violet',
            });
        }

        if (metrics.retention?.classic?.['D7'] !== undefined) {
            result.push({
                label: 'Day 7 Retention',
                value: formatPercent(metrics.retention.classic['D7']),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Users who return on day 7',
                color: 'violet',
            });
        }

        // Monetization metrics
        if (metrics.monetization?.totalRevenue !== undefined) {
            result.push({
                label: 'Total Revenue',
                value: formatCurrency(metrics.monetization.totalRevenue),
                icon: <DollarSign className="w-5 h-5" />,
                tooltip: 'Total revenue in dataset',
                color: 'amber',
            });
        }

        if (metrics.monetization?.arpu !== undefined) {
            result.push({
                label: 'ARPU',
                value: formatCurrency(metrics.monetization.arpu),
                icon: <DollarSign className="w-5 h-5" />,
                tooltip: 'Average Revenue Per User',
                color: 'amber',
            });
        }

        if (metrics.monetization?.conversionRate !== undefined) {
            result.push({
                label: 'Conversion Rate',
                value: formatPercent(metrics.monetization.conversionRate),
                icon: <Zap className="w-5 h-5" />,
                tooltip: 'Percentage of paying users',
                color: 'rose',
            });
        }

        // Progression metrics
        if (metrics.progression?.avgLevel !== undefined) {
            result.push({
                label: 'Avg Level',
                value: metrics.progression.avgLevel.toFixed(1),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Average player level',
                color: 'secondary',
            });
        }

        if (metrics.progression?.maxLevelReached !== undefined) {
            result.push({
                label: 'Max Level',
                value: metrics.progression.maxLevelReached.toString(),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Highest level reached',
                color: 'violet',
            });
        }

        return result;
    }, [metrics]);

    // If no metrics, show skeleton
    if (kpis.length === 0) {
        return <KPIGridSkeleton />;
    }

    // Show first 4 KPIs
    const displayKpis = kpis.slice(0, 4);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className ?? ''}`}
        >
            {displayKpis.map((kpi, index) => (
                <KPICard key={index} {...kpi} index={index} />
            ))}
        </motion.div>
    );
});

export default KPIGrid;
