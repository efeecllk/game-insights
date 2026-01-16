/**
 * CohortDashboard Component - Obsidian Analytics Design
 *
 * Premium cohort analysis with:
 * - Glassmorphism cards and containers
 * - Animated retention heatmap
 * - Color-coded summary cards
 * - Smooth transitions and hover effects
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// ============================================================================
// Types
// ============================================================================

interface CohortDashboardProps {
    cohortAnalysis?: CohortAnalysisResult;
    availableDimensions?: CohortDefinition[];
    onDimensionChange?: (dimension: CohortDefinition) => void;
    className?: string;
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// ============================================================================
// Utility Functions
// ============================================================================

function getRetentionColor(value: number): string {
    if (value === 0) return 'bg-white/[0.03]';
    if (value >= 40) return 'bg-[#DA7756]';
    if (value >= 30) return 'bg-[#DA7756]/80';
    if (value >= 20) return 'bg-[#C15F3C]';
    if (value >= 15) return 'bg-[#E5A84B]';
    if (value >= 10) return 'bg-orange-400';
    if (value >= 5) return 'bg-[#E25C5C]';
    return 'bg-[#E25C5C]';
}

function getRetentionTextColor(value: number): string {
    if (value === 0) return 'text-th-text-muted';
    if (value >= 20) return 'text-th-text-primary';
    return 'text-th-text-inverse';
}

function formatNumber(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
}

// ============================================================================
// Summary Card Component
// ============================================================================

function CohortSummaryCard({
    icon: Icon,
    label,
    value,
    subValue,
    trend,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    color: 'primary' | 'blue' | 'violet' | 'amber';
}) {
    const colorStyles = {
        primary: { bg: 'from-[#DA7756]/20 to-[#DA7756]/5', border: 'border-[#DA7756]/20', icon: 'bg-[#DA7756]' },
        blue: { bg: 'from-[#8F8B82]/20 to-[#8F8B82]/5', border: 'border-[#8F8B82]/20', icon: 'bg-[#8F8B82]' },
        violet: { bg: 'from-[#C15F3C]/20 to-[#C15F3C]/5', border: 'border-[#C15F3C]/20', icon: 'bg-[#C15F3C]' },
        amber: { bg: 'from-[#E5A84B]/20 to-[#E5A84B]/5', border: 'border-[#E5A84B]/20', icon: 'bg-[#E5A84B]' },
    };

    const styles = colorStyles[color];

    return (
        <motion.div
            variants={itemVariants}
            className={`
                bg-th-bg-surface
                 rounded-xl
                border border-th-border-subtle
                p-4 hover:border-th-border-strong transition-all
            `}
        >
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${styles.icon} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-th-text-primary" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        trend === 'up' ? 'bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/20' :
                        trend === 'down' ? 'bg-[#E25C5C]/10 text-[#E25C5C] border border-[#E25C5C]/20' :
                        'bg-white/[0.03] text-th-text-secondary border border-th-border-subtle'
                    }`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                         trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="text-sm text-th-text-secondary">{label}</p>
                <p className="text-2xl font-bold text-th-text-primary mt-1">{value}</p>
                {subValue && <p className="text-xs text-th-text-muted mt-1">{subValue}</p>}
            </div>
        </motion.div>
    );
}

// ============================================================================
// Cohort Highlight Component
// ============================================================================

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

    return (
        <motion.div
            variants={itemVariants}
            className={`
                rounded-xl border p-4
                ${isBest
                    ? 'bg-gradient-to-br from-[#DA7756]/10 to-[#DA7756]/5 border-[#DA7756]/20'
                    : 'bg-gradient-to-br from-[#E5A84B]/10 to-[#E5A84B]/5 border-[#E5A84B]/20'
                }
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isBest ? 'bg-[#DA7756]/20' : 'bg-[#E5A84B]/20'
                }`}>
                    <Icon className={`w-5 h-5 ${isBest ? 'text-[#DA7756]' : 'text-[#E5A84B]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isBest ? 'text-[#DA7756]' : 'text-[#E5A84B]'}`}>
                        {isBest ? 'Top Performer' : 'Needs Attention'}
                    </p>
                    <p className="text-th-text-primary font-semibold truncate">{cohort.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-th-text-primary">{cohort.value.toFixed(1)}%</p>
                    <p className="text-xs text-th-text-secondary">{cohort.metric}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Retention Heatmap Component
// ============================================================================

function RetentionHeatmap({
    matrix,
}: {
    matrix: { labels: string[]; days: string[]; matrix: number[][] };
}) {
    if (matrix.labels.length === 0) {
        return (
            <motion.div
                variants={itemVariants}
                className="bg-th-bg-surface  rounded-xl border border-th-border-subtle p-8 text-center"
            >
                <BarChart3 className="w-12 h-12 text-th-text-muted mx-auto mb-3" />
                <p className="text-th-text-secondary">No retention data available</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={itemVariants}
            className="bg-th-bg-surface  rounded-xl border border-th-border-subtle overflow-hidden"
        >
            <div className="p-4 border-b border-th-border-subtle">
                <h3 className="font-semibold text-th-text-primary">Retention Matrix</h3>
                <p className="text-sm text-th-text-secondary mt-1">Cohort retention over time</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                    <thead>
                        <tr className="bg-white/[0.02]">
                            <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary sticky left-0 bg-th-bg-surface ">
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
                            <tr key={label} className="border-t border-th-border-subtle">
                                <td className="py-2 px-4 text-sm text-th-text-primary font-medium sticky left-0 bg-th-bg-surface ">
                                    {label}
                                </td>
                                {matrix.matrix[rowIdx]?.map((value, colIdx) => (
                                    <td key={colIdx} className="py-2 px-2 text-center">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: rowIdx * 0.05 + colIdx * 0.02 }}
                                            className={`mx-auto w-12 h-8 rounded-md flex items-center justify-center text-xs font-medium ${getRetentionColor(value)} ${getRetentionTextColor(value)}`}
                                            title={`${label} - ${matrix.days[colIdx]}: ${value}%`}
                                        >
                                            {value > 0 ? `${value.toFixed(0)}%` : '-'}
                                        </motion.div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Legend */}
            <div className="px-4 py-3 bg-white/[0.02] border-t border-th-border-subtle flex items-center gap-4 text-xs text-th-text-secondary">
                <span>Retention:</span>
                <div className="flex items-center gap-2">
                    {[
                        { color: 'bg-[#E25C5C]', label: '<5%' },
                        { color: 'bg-orange-400', label: '5-10%' },
                        { color: 'bg-[#E5A84B]', label: '10-15%' },
                        { color: 'bg-[#C15F3C]', label: '15-30%' },
                        { color: 'bg-[#DA7756]', label: '>30%' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1">
                            <div className={`w-4 h-4 rounded ${color}`} />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Cohort Card Component
// ============================================================================

function CohortCard({ cohort, avgRetention }: { cohort: CohortData; avgRetention: Record<string, number> }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const d7Retention = cohort.metrics.retention['D7'] ?? 0;
    const avgD7 = avgRetention['D7'] ?? 0;
    const performanceVsAvg = avgD7 > 0 ? ((d7Retention - avgD7) / avgD7) * 100 : 0;

    return (
        <motion.div
            variants={itemVariants}
            className="bg-th-bg-surface  rounded-xl border border-th-border-subtle overflow-hidden"
        >
            <div
                className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#C15F3C]" />
                        </div>
                        <div>
                            <p className="font-medium text-th-text-primary">{cohort.value}</p>
                            <p className="text-sm text-th-text-secondary">{formatNumber(cohort.userCount)} users</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-lg font-semibold text-th-text-primary">{d7Retention.toFixed(1)}%</p>
                            <p className="text-xs text-th-text-secondary">D7 Retention</p>
                        </div>
                        {performanceVsAvg !== 0 && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                performanceVsAvg > 0
                                    ? 'bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/20'
                                    : 'bg-[#E25C5C]/10 text-[#E25C5C] border border-[#E25C5C]/20'
                            }`}>
                                {performanceVsAvg > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(performanceVsAvg).toFixed(0)}% vs avg
                            </div>
                        )}
                        <ChevronDown className={`w-5 h-5 text-th-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-4 border-t border-th-border-subtle pt-4">
                            {/* Retention breakdown */}
                            <div>
                                <p className="text-sm font-medium text-th-text-secondary mb-2">Retention by Day</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {['D1', 'D3', 'D7', 'D14', 'D30'].map(day => {
                                        const value = cohort.metrics.retention[day] ?? 0;
                                        return (
                                            <div key={day} className="bg-white/[0.03] rounded-lg p-3 text-center border border-th-border-subtle">
                                                <p className="text-xs text-th-text-secondary">{day}</p>
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
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-th-border-subtle">
                                    <div className="flex items-center gap-2 text-th-text-secondary mb-1">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="text-xs">Total Revenue</span>
                                    </div>
                                    <p className="text-lg font-semibold text-th-text-primary">
                                        ${formatNumber(cohort.metrics.totalRevenue)}
                                    </p>
                                </div>
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-th-border-subtle">
                                    <div className="flex items-center gap-2 text-th-text-secondary mb-1">
                                        <Percent className="w-4 h-4" />
                                        <span className="text-xs">Conversion Rate</span>
                                    </div>
                                    <p className="text-lg font-semibold text-th-text-primary">
                                        {cohort.metrics.conversionRate.toFixed(2)}%
                                    </p>
                                </div>
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-th-border-subtle">
                                    <div className="flex items-center gap-2 text-th-text-secondary mb-1">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs">Cohort Size</span>
                                    </div>
                                    <p className="text-lg font-semibold text-th-text-primary">
                                        {formatNumber(cohort.userCount)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Dimension Selector Component
// ============================================================================

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
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-th-border rounded-xl text-th-text-primary hover:bg-white/[0.06] hover:border-th-border-strong transition-all"
            >
                <Icon className="w-4 h-4 text-[#DA7756]" />
                <span className="font-medium">{current.name}</span>
                <ChevronDown className={`w-4 h-4 text-th-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && available.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-th-bg-surface/95  border border-th-border rounded-xl shadow-xl z-10 overflow-hidden"
                    >
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
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors ${
                                        isSelected ? 'bg-[#DA7756]/10' : ''
                                    }`}
                                >
                                    <DimIcon className={`w-4 h-4 ${isSelected ? 'text-[#DA7756]' : 'text-th-text-secondary'}`} />
                                    <span className={`font-medium ${isSelected ? 'text-[#DA7756]' : 'text-th-text-primary'}`}>
                                        {dim.name}
                                    </span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-th-bg-surface  rounded-2xl border border-th-border-subtle p-8 ${className ?? ''}`}
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-[#C15F3C]/10 border border-[#C15F3C]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-[#C15F3C]" />
                    </div>
                    <h3 className="text-lg font-semibold text-th-text-primary mb-2">No Cohort Data</h3>
                    <p className="text-th-text-secondary">
                        Upload data with user IDs and timestamps to enable cohort analysis.
                    </p>
                </div>
            </motion.div>
        );
    }

    const { cohorts, comparison, retentionMatrix, definition } = cohortAnalysis;
    const displayedCohorts = showAllCohorts ? cohorts : cohorts.slice(0, 5);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`space-y-6 ${className ?? ''}`}
        >
            {/* Header with dimension selector */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#DA7756] to-[#C15F3C] rounded-xl flex items-center justify-center ">
                        <Users className="w-6 h-6 text-th-text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-th-text-primary">Cohort Analysis</h2>
                        <p className="text-sm text-th-text-secondary">Compare user cohorts by {definition.dimension.replace(/_/g, ' ')}</p>
                    </div>
                </div>
                {availableDimensions && availableDimensions.length > 0 && onDimensionChange && (
                    <DimensionSelector
                        current={definition}
                        available={availableDimensions}
                        onChange={onDimensionChange}
                    />
                )}
            </motion.div>

            {/* Summary Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <CohortSummaryCard
                        icon={Users}
                        label="Total Cohorts"
                        value={stats.totalCohorts}
                        color="violet"
                    />
                    <CohortSummaryCard
                        icon={Users}
                        label="Total Users"
                        value={formatNumber(stats.totalUsers)}
                        color="blue"
                    />
                    <CohortSummaryCard
                        icon={Percent}
                        label="Avg D7 Retention"
                        value={`${stats.avgD7Retention.toFixed(1)}%`}
                        trend={stats.retentionTrend}
                        color="primary"
                    />
                    <CohortSummaryCard
                        icon={DollarSign}
                        label="Total Revenue"
                        value={`$${formatNumber(stats.totalRevenue)}`}
                        color="amber"
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
                <motion.div
                    variants={itemVariants}
                    className="bg-th-bg-surface  rounded-xl border border-th-border-subtle p-4"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E5A84B]/10 border border-[#E5A84B]/20 flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 text-[#E5A84B]" />
                        </div>
                        <h3 className="font-semibold text-th-text-primary">Cohort Insights</h3>
                    </div>
                    <ul className="space-y-2">
                        {comparison.insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-th-text-secondary">
                                <span className="text-[#DA7756] mt-0.5">•</span>
                                {insight}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {/* Retention Heatmap */}
            <RetentionHeatmap matrix={retentionMatrix} />

            {/* Cohort List */}
            <div className="space-y-3">
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <h3 className="font-semibold text-th-text-primary">All Cohorts</h3>
                    {cohorts.length > 5 && (
                        <button
                            onClick={() => setShowAllCohorts(!showAllCohorts)}
                            className="text-sm text-[#DA7756] hover:text-[#C15F3C] transition-colors"
                        >
                            {showAllCohorts ? 'Show Less' : `Show All (${cohorts.length})`}
                        </button>
                    )}
                </motion.div>
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
        </motion.div>
    );
}

export default CohortDashboard;
