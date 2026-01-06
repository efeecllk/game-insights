/**
 * KPI Card Component - Obsidian Analytics Design
 *
 * Premium glassmorphism cards with:
 * - Layered depth and subtle gradients
 * - Luminous accent glows on hover
 * - Micro-interaction animations
 * - Refined typography hierarchy
 */

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    change?: number;
    changeType: 'up' | 'down' | 'neutral';
    index?: number;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: index * 0.08,
        },
    }),
};

export function KPICard({
    icon: Icon,
    label,
    value,
    change,
    changeType,
    index = 0,
}: KPICardProps) {
    const TrendIcon = changeType === 'up' ? TrendingUp : changeType === 'down' ? TrendingDown : Minus;

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            className="relative group"
        >
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DA7756]/0 via-[#DA7756]/10 to-[#DA7756]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Card container */}
            <div className="relative bg-th-bg-surface  rounded-2xl p-5 border border-th-border group-hover:border-th-accent-primary/20 transition-all duration-300 overflow-hidden shadow-theme-sm">
                {/* Gradient shine on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-th-interactive-hover to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative flex items-start justify-between">
                    {/* Icon with glow */}
                    <motion.div
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <div className="absolute inset-0 bg-th-accent-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative w-11 h-11 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-th-accent-primary" aria-hidden="true" />
                        </div>
                    </motion.div>

                    {/* Trend badge */}
                    {change !== undefined && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.08 + 0.2, type: 'spring' }}
                            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full  ${
                                changeType === 'up'
                                    ? 'bg-th-success-muted text-th-success border border-th-success/20'
                                    : changeType === 'down'
                                    ? 'bg-th-error-muted text-th-error border border-th-error/20'
                                    : 'bg-th-info-muted text-th-info border border-th-info/20'
                            }`}
                        >
                            <TrendIcon className="w-3 h-3" aria-hidden="true" />
                            <span className="font-mono text-[11px]">
                                {changeType === 'up' ? '+' : ''}{change}%
                            </span>
                        </motion.div>
                    )}
                </div>

                <div className="relative mt-4">
                    <p className="text-xs uppercase tracking-wider text-th-text-muted font-medium">{label}</p>
                    <motion.p
                        className="text-2xl font-display font-bold text-th-text-primary mt-1.5 tracking-tight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.08 + 0.1 }}
                    >
                        {value}
                    </motion.p>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#DA7756]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
        </motion.div>
    );
}

// Compact variant for dense grids
interface KPICardCompactProps {
    label: string;
    value: string | number;
    change?: number;
    changeType?: 'up' | 'down' | 'neutral';
    icon?: LucideIcon;
    index?: number;
}

export function KPICardCompact({
    label,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    index = 0,
}: KPICardCompactProps) {
    const TrendIcon = changeType === 'up' ? TrendingUp : changeType === 'down' ? TrendingDown : Minus;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
            className="p-4 hover:bg-th-interactive-hover transition-colors cursor-pointer rounded-xl group"
        >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-th-text-muted mb-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-th-text-disabled group-hover:text-th-accent-primary/60 transition-colors" aria-hidden="true" />}
                <span className="font-medium">{label}</span>
            </div>
            <div className="text-2xl font-display font-bold text-th-text-primary tracking-tight">{value}</div>
            {change !== undefined && (
                <div className={`flex items-center gap-1 text-sm mt-1.5 ${
                    changeType === 'up' ? 'text-th-success' :
                    changeType === 'down' ? 'text-th-error' :
                    'text-th-text-muted'
                }`}>
                    <TrendIcon className="w-3 h-3" aria-hidden="true" />
                    <span className="font-mono text-[11px]">
                        {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                </div>
            )}
        </motion.div>
    );
}

export default KPICard;
