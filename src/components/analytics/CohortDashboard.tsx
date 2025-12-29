/**
 * CohortDashboard Component
 * Displays cohort analysis with retention heatmap, comparison, and insights
 */

import { useState, useMemo } from 'react';
import {
    Users,
    TrendingUp,
    TrendingDown,
    Calendar,
    Trophy,
    AlertTriangle,
    ChevronDown,
    Percent,
    DollarSign,
    BarChart3,
    Lightbulb,
    ArrowRight,
} from 'lucide-react';
import {
    CohortAnalysisResult,
    CohortData,
    CohortDefinition,
    CohortDimension,
} from '../../ai/CohortAnalyzer';

interface CohortDashboardProps {
    cohortAnalysis?: CohortAnalysisResult;
    availableDimensions?: CohortDefinition[];
    onDimensionChange?: (dimension: CohortDefinition) => void;
    className?: string;
}

// Retention heatmap color scale
function getRetentionColor(value: number): string {
    if (value === 0) return 'bg-th-bg-elevated';
    if (value >= 40) return 'bg-green-500';
    if (value >= 30) return 'bg-green-400';
    if (value >= 20) return 'bg-emerald-400';
    if (value >= 15) return 'bg-yellow-400';
    if (value >= 10) return 'bg-amber-400';
    if (value >= 5) return 'bg-orange-400';
    return 'bg-red-400';
}

function getRetentionTextColor(value: number): string {
    if (value === 0) return 'text-th-text-muted';
    if (value >= 20) return 'text-white';
    return 'text-gray-900';
}

// Format large numbers
function formatNumber(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
}

// Cohort summary card
function CohortSummaryCard({
    icon: Icon,
    label,
    value,
    subValue,
    trend,
    iconColor,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    iconColor: string;
}) {
    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        trend === 'up' ? 'bg-green-500/10 text-green-500' :
                        trend === 'down' ? 'bg-red-500/10 text-red-500' :
                        'bg-th-bg-elevated text-th-text-muted'
                    }`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                         trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="text-sm text-th-text-muted">{label}</p>
                <p className="text-2xl font-semibold text-th-text-primary mt-1">{value}</p>
                {subValue && <p className="text-xs text-th-text-muted mt-1">{subValue}</p>}
            </div>
        </div>
    );
}

// Best/Worst cohort highlight
function CohortHighlight({
    type,
    cohort,
}: {
    type: 'best' | 'worst';
    cohort: { id: string; name: string; metric: string; value: number } | null;
}) {
    if (!cohort) return null;

    const isBest = type === 'best';
    const Icon = isBest ? Trophy : AlertTriangle;
    const bgColor = isBest ? 'bg-green-500/10' : 'bg-amber-500/10';
    const borderColor = isBest ? 'border-green-500/30' : 'border-amber-500/30';
    const iconColor = isBest ? 'text-green-500' : 'text-amber-500';
    const label = isBest ? 'Top Performer' : 'Needs Attention';

    return (
        <div className={`rounded-xl border p-4 ${bgColor} ${borderColor}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBest ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${iconColor}`}>{label}</p>
                    <p className="text-th-text-primary font-semibold truncate">{cohort.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-th-text-primary">{cohort.value.toFixed(1)}%</p>
                    <p className="text-xs text-th-text-muted">{cohort.metric}</p>
                </div>
            </div>
        </div>
    );
}

// Retention heatmap component
function RetentionHeatmap({
    matrix,
}: {
    matrix: { labels: string[]; days: string[]; matrix: number[][] };
}) {
    if (matrix.labels.length === 0) {
        return (
            <div className="bg-th-bg-surface rounded-xl border border-th-border p-8 text-center">
                <BarChart3 className="w-12 h-12 text-th-text-muted mx-auto mb-3" />
                <p className="text-th-text-muted">No retention data available</p>
            </div>
        );
    }

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
            <div className="p-4 border-b border-th-border">
                <h3 className="font-semibold text-th-text-primary">Retention Matrix</h3>
                <p className="text-sm text-th-text-muted mt-1">Cohort retention over time</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                    <thead>
                        <tr className="bg-th-bg-elevated/50">
                            <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary sticky left-0 bg-th-bg-elevated/50">
                                Cohort
                            </th>
                            {matrix.days.map(day => (
                                <th key={day} className="text-center py-3 px-3 text-sm font-medium text-th-text-secondary min-w-[60px]">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.labels.map((label, rowIdx) => (
                            <tr key={label} className="border-t border-th-border/50">
                                <td className="py-2 px-4 text-sm text-th-text-primary font-medium sticky left-0 bg-th-bg-surface">
                                    {label}
                                </td>
                                {matrix.matrix[rowIdx]?.map((value, colIdx) => (
                                    <td key={colIdx} className="py-2 px-2 text-center">
                                        <div
                                            className={`mx-auto w-12 h-8 rounded-md flex items-center justify-center text-xs font-medium ${getRetentionColor(value)} ${getRetentionTextColor(value)}`}
                                            title={`${label} - ${matrix.days[colIdx]}: ${value}%`}
                                        >
                                            {value > 0 ? `${value.toFixed(0)}%` : '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Legend */}
            <div className="px-4 py-3 bg-th-bg-elevated/30 border-t border-th-border flex items-center gap-4 text-xs text-th-text-muted">
                <span>Retention:</span>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-red-400" />
                        <span>&lt;5%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-orange-400" />
                        <span>5-10%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-amber-400" />
                        <span>10-15%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-yellow-400" />
                        <span>15-20%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-emerald-400" />
                        <span>20-30%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-green-500" />
                        <span>&gt;30%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Individual cohort card
function CohortCard({ cohort, avgRetention }: { cohort: CohortData; avgRetention: Record<string, number> }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const d7Retention = cohort.metrics.retention['D7'] ?? 0;
    const avgD7 = avgRetention['D7'] ?? 0;
    const performanceVsAvg = avgD7 > 0 ? ((d7Retention - avgD7) / avgD7) * 100 : 0;

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
            <div
                className="p-4 cursor-pointer hover:bg-th-interactive-hover transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-th-accent-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-th-accent-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-th-text-primary">{cohort.value}</p>
                            <p className="text-sm text-th-text-muted">{formatNumber(cohort.userCount)} users</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-lg font-semibold text-th-text-primary">{d7Retention.toFixed(1)}%</p>
                            <p className="text-xs text-th-text-muted">D7 Retention</p>
                        </div>
                        {performanceVsAvg !== 0 && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                performanceVsAvg > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                                {performanceVsAvg > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(performanceVsAvg).toFixed(0)}% vs avg
                            </div>
                        )}
                        <ChevronDown className={`w-5 h-5 text-th-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-th-border/50 pt-4">
                    {/* Retention breakdown */}
                    <div>
                        <p className="text-sm font-medium text-th-text-secondary mb-2">Retention by Day</p>
                        <div className="grid grid-cols-5 gap-2">
                            {['D1', 'D3', 'D7', 'D14', 'D30'].map(day => {
                                const value = cohort.metrics.retention[day] ?? 0;
                                return (
                                    <div key={day} className="bg-th-bg-elevated rounded-lg p-3 text-center">
                                        <p className="text-xs text-th-text-muted">{day}</p>
                                        <p className="text-lg font-semibold text-th-text-primary mt-1">
                                            {value > 0 ? `${value.toFixed(1)}%` : '-'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-th-bg-elevated rounded-lg p-3">
                            <div className="flex items-center gap-2 text-th-text-muted mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs">Total Revenue</span>
                            </div>
                            <p className="text-lg font-semibold text-th-text-primary">
                                ${formatNumber(cohort.metrics.totalRevenue)}
                            </p>
                        </div>
                        <div className="bg-th-bg-elevated rounded-lg p-3">
                            <div className="flex items-center gap-2 text-th-text-muted mb-1">
                                <Percent className="w-4 h-4" />
                                <span className="text-xs">Conversion Rate</span>
                            </div>
                            <p className="text-lg font-semibold text-th-text-primary">
                                {cohort.metrics.conversionRate.toFixed(2)}%
                            </p>
                        </div>
                        <div className="bg-th-bg-elevated rounded-lg p-3">
                            <div className="flex items-center gap-2 text-th-text-muted mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-xs">Cohort Size</span>
                            </div>
                            <p className="text-lg font-semibold text-th-text-primary">
                                {formatNumber(cohort.userCount)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Dimension selector
function DimensionSelector({
    current,
    available,
    onChange,
}: {
    current: CohortDefinition;
    available: CohortDefinition[];
    onChange: (d: CohortDefinition) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const dimensionIcons: Record<CohortDimension, React.ElementType> = {
        install_date: Calendar,
        first_purchase_date: DollarSign,
        platform: BarChart3,
        country: Users,
        acquisition_source: ArrowRight,
        custom: BarChart3,
    };

    const Icon = dimensionIcons[current.dimension] || BarChart3;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary hover:bg-th-interactive-hover transition-colors"
            >
                <Icon className="w-4 h-4 text-th-accent-primary" />
                <span className="font-medium">{current.name}</span>
                <ChevronDown className={`w-4 h-4 text-th-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && available.length > 1 && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-th-bg-surface border border-th-border rounded-lg shadow-lg z-10">
                    {available.map((dim, idx) => {
                        const DimIcon = dimensionIcons[dim.dimension] || BarChart3;
                        const isSelected = dim.dimension === current.dimension;
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    onChange(dim);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-th-interactive-hover transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                    isSelected ? 'bg-th-accent-primary/10' : ''
                                }`}
                            >
                                <DimIcon className={`w-4 h-4 ${isSelected ? 'text-th-accent-primary' : 'text-th-text-muted'}`} />
                                <span className={`font-medium ${isSelected ? 'text-th-accent-primary' : 'text-th-text-primary'}`}>
                                    {dim.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function CohortDashboard({
    cohortAnalysis,
    availableDimensions,
    onDimensionChange,
    className,
}: CohortDashboardProps) {
    const [showAllCohorts, setShowAllCohorts] = useState(false);

    // Calculate summary stats
    const stats = useMemo(() => {
        if (!cohortAnalysis || cohortAnalysis.cohorts.length === 0) {
            return null;
        }

        const { cohorts, comparison } = cohortAnalysis;
        const totalUsers = cohorts.reduce((sum, c) => sum + c.userCount, 0);
        const totalRevenue = cohorts.reduce((sum, c) => sum + c.metrics.totalRevenue, 0);

        // Determine retention trend
        let retentionTrend: 'up' | 'down' | 'neutral' = 'neutral';
        if (cohorts.length >= 2) {
            const firstD7 = cohorts[0].metrics.retention['D7'] ?? 0;
            const lastD7 = cohorts[cohorts.length - 1].metrics.retention['D7'] ?? 0;
            if (lastD7 > firstD7 + 2) retentionTrend = 'up';
            else if (lastD7 < firstD7 - 2) retentionTrend = 'down';
        }

        return {
            totalCohorts: cohorts.length,
            totalUsers,
            totalRevenue,
            avgD7Retention: comparison.avgRetention['D7'] ?? 0,
            retentionTrend,
        };
    }, [cohortAnalysis]);

    // No data state
    if (!cohortAnalysis || cohortAnalysis.cohorts.length === 0) {
        return (
            <div className={`bg-th-bg-surface rounded-card border border-th-border p-8 ${className ?? ''}`}>
                <div className="text-center">
                    <div className="w-12 h-12 bg-th-accent-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-th-accent-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-th-text-primary mb-2">No Cohort Data</h3>
                    <p className="text-th-text-muted">
                        Upload data with user IDs and timestamps to enable cohort analysis.
                    </p>
                </div>
            </div>
        );
    }

    const { cohorts, comparison, retentionMatrix, definition } = cohortAnalysis;
    const displayedCohorts = showAllCohorts ? cohorts : cohorts.slice(0, 5);

    return (
        <div className={`space-y-6 ${className ?? ''}`}>
            {/* Header with dimension selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-th-text-primary">Cohort Analysis</h2>
                        <p className="text-sm text-th-text-muted">Compare user cohorts by {definition.dimension.replace(/_/g, ' ')}</p>
                    </div>
                </div>
                {availableDimensions && availableDimensions.length > 0 && onDimensionChange && (
                    <DimensionSelector
                        current={definition}
                        available={availableDimensions}
                        onChange={onDimensionChange}
                    />
                )}
            </div>

            {/* Summary Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <CohortSummaryCard
                        icon={Users}
                        label="Total Cohorts"
                        value={stats.totalCohorts}
                        iconColor="bg-indigo-500"
                    />
                    <CohortSummaryCard
                        icon={Users}
                        label="Total Users"
                        value={formatNumber(stats.totalUsers)}
                        iconColor="bg-blue-500"
                    />
                    <CohortSummaryCard
                        icon={Percent}
                        label="Avg D7 Retention"
                        value={`${stats.avgD7Retention.toFixed(1)}%`}
                        trend={stats.retentionTrend}
                        iconColor="bg-emerald-500"
                    />
                    <CohortSummaryCard
                        icon={DollarSign}
                        label="Total Revenue"
                        value={`$${formatNumber(stats.totalRevenue)}`}
                        iconColor="bg-green-500"
                    />
                </div>
            )}

            {/* Best & Worst Cohorts */}
            {(comparison.bestCohort || comparison.worstCohort) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CohortHighlight type="best" cohort={comparison.bestCohort} />
                    <CohortHighlight type="worst" cohort={comparison.worstCohort} />
                </div>
            )}

            {/* Insights */}
            {comparison.insights.length > 0 && (
                <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        <h3 className="font-semibold text-th-text-primary">Cohort Insights</h3>
                    </div>
                    <ul className="space-y-2">
                        {comparison.insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-th-text-secondary">
                                <span className="text-th-accent-primary mt-0.5">•</span>
                                {insight}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Retention Heatmap */}
            <RetentionHeatmap matrix={retentionMatrix} />

            {/* Cohort List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-th-text-primary">All Cohorts</h3>
                    {cohorts.length > 5 && (
                        <button
                            onClick={() => setShowAllCohorts(!showAllCohorts)}
                            className="text-sm text-th-accent-primary hover:underline"
                        >
                            {showAllCohorts ? 'Show Less' : `Show All (${cohorts.length})`}
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {displayedCohorts.map(cohort => (
                        <CohortCard
                            key={cohort.id}
                            cohort={cohort}
                            avgRetention={comparison.avgRetention}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CohortDashboard;
