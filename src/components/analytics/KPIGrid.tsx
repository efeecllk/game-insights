/**
 * KPIGrid Component
 * Displays calculated metrics as KPI cards
 */

import { TrendingUp, TrendingDown, Users, DollarSign, Target, Repeat, Activity } from 'lucide-react';
import { CalculatedMetrics } from '../../ai/MetricCalculator';

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
    color?: 'violet' | 'green' | 'blue' | 'orange';
}

function KPICard({ label, value, change, icon, tooltip, color = 'violet' }: KPICardProps) {
    const isPositive = change !== undefined && change >= 0;
    const hasChange = change !== undefined && !isNaN(change);

    const colorClasses = {
        violet: 'bg-violet-50 text-violet-600',
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow" title={tooltip}>
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    {icon}
                </div>
                {hasChange && (
                    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isPositive ? '+' : ''}{(change * 100).toFixed(1)}%</span>
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </div>
    );
}

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
                color: 'violet',
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
                color: 'blue',
            });
        }

        // Retention metrics
        if (metrics.retention?.classic?.['D1'] !== undefined) {
            kpis.push({
                label: 'Day 1 Retention',
                value: formatPercent(metrics.retention.classic['D1']),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Users who return on day 1',
                color: 'green',
            });
        }

        if (metrics.retention?.classic?.['D7'] !== undefined) {
            kpis.push({
                label: 'Day 7 Retention',
                value: formatPercent(metrics.retention.classic['D7']),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Users who return on day 7',
                color: 'green',
            });
        }

        // Monetization metrics
        if (metrics.monetization?.totalRevenue !== undefined) {
            kpis.push({
                label: 'Total Revenue',
                value: formatCurrency(metrics.monetization.totalRevenue),
                icon: <DollarSign className="w-5 h-5" />,
                tooltip: 'Total revenue in dataset',
                color: 'orange',
            });
        }

        if (metrics.monetization?.arpu !== undefined) {
            kpis.push({
                label: 'ARPU',
                value: formatCurrency(metrics.monetization.arpu),
                icon: <DollarSign className="w-5 h-5" />,
                tooltip: 'Average Revenue Per User',
                color: 'orange',
            });
        }

        if (metrics.monetization?.conversionRate !== undefined) {
            kpis.push({
                label: 'Conversion Rate',
                value: formatPercent(metrics.monetization.conversionRate),
                icon: <TrendingUp className="w-5 h-5" />,
                tooltip: 'Percentage of paying users',
                color: 'orange',
            });
        }

        // Progression metrics
        if (metrics.progression?.avgLevel !== undefined) {
            kpis.push({
                label: 'Avg Level',
                value: metrics.progression.avgLevel.toFixed(1),
                icon: <Target className="w-5 h-5" />,
                tooltip: 'Average player level',
                color: 'violet',
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

    // If no metrics, show placeholder cards
    if (kpis.length === 0) {
        return (
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className ?? ''}`}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="animate-pulse">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3" />
                            <div className="h-8 bg-gray-100 rounded mb-2 w-20" />
                            <div className="h-4 bg-gray-100 rounded w-24" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Show first 4 KPIs (or 8 for wider screens)
    const displayKpis = kpis.slice(0, 4);

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className ?? ''}`}>
            {displayKpis.map((kpi, index) => (
                <KPICard key={index} {...kpi} />
            ))}
        </div>
    );
}

export default KPIGrid;
