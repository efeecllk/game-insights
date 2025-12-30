/**
 * KPI Card Component - Design System v2
 * Theme-aware with glassmorphism effects and animations
 */

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    change?: number;
    changeType: 'up' | 'down' | 'neutral';
    animate?: boolean;
    staggerIndex?: number;
}

export function KPICard({
    icon: Icon,
    label,
    value,
    change,
    changeType,
    animate = true,
    staggerIndex = 0,
}: KPICardProps) {
    const TrendIcon = changeType === 'up' ? TrendingUp : changeType === 'down' ? TrendingDown : Minus;

    const trendStyles = {
        up: 'bg-th-success-muted text-th-success',
        down: 'bg-th-error-muted text-th-error',
        neutral: 'bg-th-bg-elevated text-th-text-muted',
    };

    return (
        <div
            className={`
                bg-th-bg-surface rounded-2xl p-5
                border border-th-border
                hover:border-th-accent-primary/30
                transition-all duration-250
                group
                hover:shadow-[0_0_20px_rgba(167,139,250,0.1)]
                hover:-translate-y-0.5
                ${animate ? `animate-fade-in-up stagger-${staggerIndex}` : ''}
            `}
        >
            <div className="flex items-start justify-between">
                {/* Icon container with glow effect on hover */}
                <div className="w-11 h-11 rounded-xl bg-th-accent-primary-muted flex items-center justify-center group-hover:shadow-[0_0_16px_rgba(167,139,250,0.2)] transition-shadow duration-300">
                    <Icon className="w-5 h-5 text-th-accent-primary" aria-hidden="true" />
                </div>

                {/* Change badge */}
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${trendStyles[changeType]}`}>
                        <TrendIcon className="w-3 h-3" aria-hidden="true" />
                        <span className="font-mono">
                            {changeType === 'up' ? '+' : ''}{change}%
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <p className="text-sm text-th-text-muted font-medium">{label}</p>
                <p className="text-2xl font-display font-semibold text-th-text-primary mt-1 kpi-value">
                    {value}
                </p>
            </div>
        </div>
    );
}

// Compact variant for grids
interface KPICardCompactProps {
    label: string;
    value: string | number;
    change?: number;
    changeType?: 'up' | 'down' | 'neutral';
    icon?: LucideIcon;
}

export function KPICardCompact({
    label,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
}: KPICardCompactProps) {
    const TrendIcon = changeType === 'up' ? TrendingUp : changeType === 'down' ? TrendingDown : Minus;

    return (
        <div className="p-4 hover:bg-th-interactive-hover transition-colors cursor-pointer rounded-xl">
            <div className="flex items-center gap-2 text-sm text-th-text-muted mb-2">
                {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                <span>{label}</span>
            </div>
            <div className="text-2xl font-display font-bold text-th-text-primary kpi-value">{value}</div>
            {change !== undefined && (
                <div className={`flex items-center gap-1 text-sm mt-1 ${
                    changeType === 'up' ? 'text-th-success' :
                    changeType === 'down' ? 'text-th-error' :
                    'text-th-text-muted'
                }`}>
                    <TrendIcon className="w-3 h-3" aria-hidden="true" />
                    <span className="font-mono text-xs">
                        {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                </div>
            )}
        </div>
    );
}

export default KPICard;
