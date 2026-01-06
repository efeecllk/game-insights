/**
 * KPIGrid Component - Obsidian Analytics Design
 *
 * Premium KPI dashboard with:
 * - Glassmorphism cards with color-coded accents
 * - Animated hover states with glow effects
 * - Staggered entrance animations
 * - Trend indicators with pulse effects
 */

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
        bg: 'from-[#5B9BD5]/20 to-[#5B9BD5]/5',
        border: 'border-[#5B9BD5]/20',
        icon: 'text-[#5B9BD5]',
        glow: 'bg-[#5B9BD5]/20',
        hoverBorder: 'hover:border-[#5B9BD5]/40',
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
        bg: 'from-rose-500/20 to-rose-500/5',
        border: 'border-rose-500/20',
        icon: 'text-rose-400',
        glow: 'bg-rose-500/20',
        hoverBorder: 'hover:border-rose-500/40',
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

function KPICard({ label, value, change, icon, tooltip, color = 'primary', index = 0 }: KPICardProps) {
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
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
}

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

export function KPIGrid({ metrics, className }: KPIGridProps) {
    // Build KPI cards from metrics
    const kpis: KPICardProps[] = [];

    if (metrics) {
        // Engagement metrics
        if (metrics.engagement?.dau !== undefined) {
            kpis.push({
                label: 'Daily Active Users',
                value: formatNumber(metrics.engagement.dau),
                icon: <Users className="w-5 h-5" />,
                tooltip: 'Unique users active today',
                color: 'primary',
            });
        }

        if (metrics.engagement?.dauMauRatio !== undefined) {
            kpis.push({
                label: 'Stickiness (DAU/MAU)',
                value: formatPercent(metrics.engagement.dauMauRatio * 100),
                icon: <Activity className="w-5 h-5" />,
                tooltip: 'How often users return',
                color: 'blue',
            });
        }

        if (metrics.engagement?.avgSessionsPerUser !== undefined) {
            kpis.push({
                label: 'Sessions / User',
                value: metrics.engagement.avgSessionsPerUser.toFixed(1),
                icon: <Repeat className="w-5 h-5" />,
                tooltip: 'Average sessions per user',
                color: 'secondary',
            });
        }

        // Retention metrics
        if (metrics.retention?.classic?.['D1'] !== undefined) {
            kpis.push({
                label: 'Day 1 Retention',
                value: formatPercent(metrics.retention.classic['D1']),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Users who return on day 1',
                color: 'violet',
            });
        }

        if (metrics.retention?.classic?.['D7'] !== undefined) {
            kpis.push({
                label: 'Day 7 Retention',
                value: formatPercent(metrics.retention.classic['D7']),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Users who return on day 7',
                color: 'violet',
            });
        }

        // Monetization metrics
        if (metrics.monetization?.totalRevenue !== undefined) {
            kpis.push({
                label: 'Total Revenue',
                value: formatCurrency(metrics.monetization.totalRevenue),
                icon: <DollarSign className="w-5 h-5" />,
                tooltip: 'Total revenue in dataset',
                color: 'amber',
            });
        }

        if (metrics.monetization?.arpu !== undefined) {
            kpis.push({
                label: 'ARPU',
                value: formatCurrency(metrics.monetization.arpu),
                icon: <DollarSign className="w-5 h-5" />,
                tooltip: 'Average Revenue Per User',
                color: 'amber',
            });
        }

        if (metrics.monetization?.conversionRate !== undefined) {
            kpis.push({
                label: 'Conversion Rate',
                value: formatPercent(metrics.monetization.conversionRate),
                icon: <Zap className="w-5 h-5" />,
                tooltip: 'Percentage of paying users',
                color: 'rose',
            });
        }

        // Progression metrics
        if (metrics.progression?.avgLevel !== undefined) {
            kpis.push({
                label: 'Avg Level',
                value: metrics.progression.avgLevel.toFixed(1),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Average player level',
                color: 'secondary',
            });
        }

        if (metrics.progression?.maxLevelReached !== undefined) {
            kpis.push({
                label: 'Max Level',
                value: metrics.progression.maxLevelReached.toString(),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Highest level reached',
                color: 'violet',
            });
        }
    }

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
}

export default KPIGrid;
