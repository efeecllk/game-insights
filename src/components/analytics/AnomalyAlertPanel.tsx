/**
 * AnomalyAlertPanel - Obsidian Analytics Design
 *
 * Displays detected anomalies with:
 * - Glassmorphism containers
 * - Emerald accent colors
 * - Framer Motion animations
 * - Color-coded severity badges
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Activity,
    ChevronRight,
    Filter,
    Clock,
    Percent,
    AlertCircle,
    CheckCircle2,
    Lightbulb,
    Eye,
    EyeOff,
    Sparkles,
} from 'lucide-react';
import { Anomaly, AnomalySeverity, AnomalyType } from '../../ai/AnomalyDetector';

interface AnomalyAlertPanelProps {
    anomalies: Anomaly[];
    anomalyStats?: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    className?: string;
    onDismiss?: (id: string) => void;
    onAcknowledge?: (id: string) => void;
}

type SortOption = 'severity' | 'timestamp' | 'percentChange';
type FilterSeverity = AnomalySeverity | 'all';

// Obsidian theme severity config
const SEVERITY_CONFIG: Record<AnomalySeverity, {
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeBg: string;
    glowColor: string;
    icon: React.ElementType;
}> = {
    critical: {
        label: 'Critical',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        textColor: 'text-rose-400',
        badgeBg: 'bg-rose-500',
        glowColor: 'shadow-rose-500/20',
        icon: AlertCircle,
    },
    high: {
        label: 'High',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        textColor: 'text-orange-400',
        badgeBg: 'bg-orange-500',
        glowColor: 'shadow-orange-500/20',
        icon: AlertTriangle,
    },
    medium: {
        label: 'Medium',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        badgeBg: 'bg-amber-500',
        glowColor: 'shadow-amber-500/20',
        icon: AlertTriangle,
    },
    low: {
        label: 'Low',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        badgeBg: 'bg-blue-500',
        glowColor: 'shadow-blue-500/20',
        icon: Activity,
    },
};

const TYPE_ICONS: Record<AnomalyType, React.ElementType> = {
    spike: TrendingUp,
    drop: TrendingDown,
    trend_change: Activity,
    pattern_break: AlertTriangle,
};

const TYPE_LABELS: Record<AnomalyType, string> = {
    spike: 'Spike',
    drop: 'Drop',
    trend_change: 'Trend Change',
    pattern_break: 'Pattern Break',
};

// Animation variants
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
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: { duration: 0.2 },
    },
};

function SeverityBadge({ severity, count }: { severity: AnomalySeverity; count: number }) {
    const config = SEVERITY_CONFIG[severity];
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}
        >
            <span className={`w-2 h-2 rounded-full ${config.badgeBg} animate-pulse`} />
            <span className={`text-sm font-medium ${config.textColor}`}>
                {count} {config.label}
            </span>
        </motion.div>
    );
}

function AnomalyCard({
    anomaly,
    isExpanded,
    onToggle,
    onDismiss,
    onAcknowledge,
    isDismissed,
}: {
    anomaly: Anomaly;
    isExpanded: boolean;
    onToggle: () => void;
    onDismiss?: () => void;
    onAcknowledge?: () => void;
    isDismissed?: boolean;
}) {
    const severityConfig = SEVERITY_CONFIG[anomaly.severity];
    const TypeIcon = TYPE_ICONS[anomaly.type];
    const SeverityIcon = severityConfig.icon;

    if (isDismissed) return null;

    return (
        <motion.div
            variants={cardVariants}
            layout
            className={`rounded-xl border transition-all ${severityConfig.bgColor} ${severityConfig.borderColor} overflow-hidden ${
                isExpanded ? `ring-1 ${severityConfig.borderColor.replace('border-', 'ring-')} shadow-lg ${severityConfig.glowColor}` : ''
            }`}
        >
            {/* Header */}
            <motion.div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={onToggle}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
                <div className={`mt-0.5 ${severityConfig.textColor}`}>
                    <SeverityIcon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{anomaly.metric}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${severityConfig.bgColor} border ${severityConfig.borderColor} ${severityConfig.textColor} font-medium`}>
                            {severityConfig.label}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center gap-1">
                            <TypeIcon className="w-3 h-3" />
                            {TYPE_LABELS[anomaly.type]}
                        </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{anomaly.description}</p>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${anomaly.percentChange > 0 ? 'text-[#DA7756]' : 'text-rose-400'}`}>
                        {anomaly.percentChange > 0 ? '+' : ''}{anomaly.percentChange.toFixed(1)}%
                    </span>
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-white/[0.06]"
                    >
                        <div className="px-4 pb-4 pt-4 space-y-4 ml-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                                    <div className="text-xs text-slate-500 mb-1">Actual Value</div>
                                    <div className="text-lg font-semibold text-white">
                                        {typeof anomaly.value === 'number' ? anomaly.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : anomaly.value}
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                                    <div className="text-xs text-slate-500 mb-1">Expected Value</div>
                                    <div className="text-lg font-semibold text-white">
                                        ~{anomaly.expectedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                                    <div className="text-xs text-slate-500 mb-1">Deviation</div>
                                    <div className="text-lg font-semibold text-white">
                                        {anomaly.deviation.toFixed(2)}σ
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                                    <div className="text-xs text-slate-500 mb-1">Detected</div>
                                    <div className="text-sm font-medium text-white">
                                        {new Date(anomaly.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* Possible Causes */}
                            {anomaly.possibleCauses && anomaly.possibleCauses.length > 0 && (
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                                        <Lightbulb className="w-4 h-4 text-amber-400" />
                                        Possible Causes
                                    </div>
                                    <ul className="space-y-2">
                                        {anomaly.possibleCauses.map((cause, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
                                                <span className="text-[#DA7756] mt-1">•</span>
                                                {cause}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2">
                                {onAcknowledge && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAcknowledge();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm bg-[#DA7756]/10 border border-[#DA7756]/30 text-[#DA7756] rounded-xl hover:bg-[#DA7756]/20 transition-colors"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Acknowledge
                                    </motion.button>
                                )}
                                {onDismiss && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDismiss();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-400 rounded-xl hover:bg-white/[0.06] transition-colors"
                                    >
                                        <EyeOff className="w-4 h-4" />
                                        Dismiss
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function AnomalyAlertPanel({
    anomalies,
    anomalyStats,
    className,
    onDismiss,
    onAcknowledge,
}: AnomalyAlertPanelProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
    const [sortBy, setSortBy] = useState<SortOption>('severity');
    const [showFilters, setShowFilters] = useState(false);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [showDismissed, setShowDismissed] = useState(false);

    // Calculate stats if not provided
    const stats = useMemo(() => {
        if (anomalyStats) return anomalyStats;
        return {
            total: anomalies.length,
            critical: anomalies.filter(a => a.severity === 'critical').length,
            high: anomalies.filter(a => a.severity === 'high').length,
            medium: anomalies.filter(a => a.severity === 'medium').length,
            low: anomalies.filter(a => a.severity === 'low').length,
        };
    }, [anomalies, anomalyStats]);

    // Get unique metrics for filtering
    const uniqueMetrics = useMemo(() => {
        return Array.from(new Set(anomalies.map(a => a.metric)));
    }, [anomalies]);

    // Filter and sort anomalies
    const filteredAnomalies = useMemo(() => {
        let filtered = [...anomalies];

        // Filter by severity
        if (filterSeverity !== 'all') {
            filtered = filtered.filter(a => a.severity === filterSeverity);
        }

        // Filter out dismissed unless showing dismissed
        if (!showDismissed) {
            filtered = filtered.filter(a => !dismissedIds.has(a.id));
        }

        // Sort
        const severityOrder: Record<AnomalySeverity, number> = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
        };

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'severity':
                    return severityOrder[a.severity] - severityOrder[b.severity];
                case 'timestamp':
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                case 'percentChange':
                    return Math.abs(b.percentChange) - Math.abs(a.percentChange);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [anomalies, filterSeverity, sortBy, dismissedIds, showDismissed]);

    const handleDismiss = (id: string) => {
        setDismissedIds(prev => new Set(prev).add(id));
        onDismiss?.(id);
    };

    const handleAcknowledge = (id: string) => {
        onAcknowledge?.(id);
    };

    // No anomalies state
    if (anomalies.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 ${className ?? ''}`}
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-[#DA7756]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Anomalies Detected</h3>
                    <p className="text-slate-400">
                        Your metrics are within normal ranges. We'll alert you when something unusual happens.
                    </p>
                </div>
            </motion.div>
        );
    }

    const hasCritical = stats.critical > 0;
    const hasHigh = stats.high > 0;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden ${className ?? ''}`}
        >
            {/* Header */}
            <motion.div
                variants={itemVariants}
                className={`p-6 border-b ${hasCritical ? 'bg-rose-500/5 border-rose-500/20' : hasHigh ? 'bg-orange-500/5 border-orange-500/20' : 'border-white/[0.06]'}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className={`absolute inset-0 ${hasCritical ? 'bg-rose-500/20' : hasHigh ? 'bg-orange-500/20' : 'bg-amber-500/20'} rounded-xl blur-lg`} />
                            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${hasCritical ? 'bg-rose-500/10 border border-rose-500/20' : hasHigh ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                                <AlertTriangle className={`w-6 h-6 ${hasCritical ? 'text-rose-400' : hasHigh ? 'text-orange-400' : 'text-amber-400'}`} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Anomaly Alerts</h2>
                            <p className="text-sm text-slate-400">
                                {stats.total} anomal{stats.total === 1 ? 'y' : 'ies'} detected across {uniqueMetrics.length} metric{uniqueMetrics.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                            showFilters ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30' : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </motion.button>
                </div>

                {/* Severity Summary */}
                <div className="flex flex-wrap gap-2">
                    {stats.critical > 0 && <SeverityBadge severity="critical" count={stats.critical} />}
                    {stats.high > 0 && <SeverityBadge severity="high" count={stats.high} />}
                    {stats.medium > 0 && <SeverityBadge severity="medium" count={stats.medium} />}
                    {stats.low > 0 && <SeverityBadge severity="low" count={stats.low} />}
                </div>
            </motion.div>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-white/[0.06]"
                    >
                        <div className="p-4 bg-white/[0.02] space-y-4">
                            <div className="flex flex-wrap gap-6">
                                {/* Severity Filter */}
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-400">Severity:</span>
                                    <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
                                        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(severity => (
                                            <motion.button
                                                key={severity}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFilterSeverity(severity)}
                                                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                                                    filterSeverity === severity
                                                        ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-400">Sort by:</span>
                                    <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
                                        {([
                                            { value: 'severity', label: 'Severity', icon: AlertTriangle },
                                            { value: 'timestamp', label: 'Time', icon: Clock },
                                            { value: 'percentChange', label: 'Change', icon: Percent },
                                        ] as const).map(option => (
                                            <motion.button
                                                key={option.value}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSortBy(option.value)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
                                                    sortBy === option.value
                                                        ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <option.icon className="w-3.5 h-3.5" />
                                                {option.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Show Dismissed Toggle */}
                            {dismissedIds.size > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => setShowDismissed(!showDismissed)}
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    {showDismissed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    {showDismissed ? 'Hide' : 'Show'} {dismissedIds.size} dismissed
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Anomaly List */}
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {filteredAnomalies.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-slate-400">No anomalies match the current filters</p>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {filteredAnomalies.map((anomaly, index) => (
                            <motion.div
                                key={anomaly.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <AnomalyCard
                                    anomaly={anomaly}
                                    isExpanded={expandedId === anomaly.id}
                                    onToggle={() => setExpandedId(expandedId === anomaly.id ? null : anomaly.id)}
                                    onDismiss={() => handleDismiss(anomaly.id)}
                                    onAcknowledge={() => handleAcknowledge(anomaly.id)}
                                    isDismissed={dismissedIds.has(anomaly.id) && !showDismissed}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Footer */}
            {filteredAnomalies.length > 0 && (
                <motion.div
                    variants={itemVariants}
                    className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]"
                >
                    <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>
                            Showing {filteredAnomalies.length} of {anomalies.length - dismissedIds.size} anomalies
                        </span>
                        {dismissedIds.size > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setDismissedIds(new Set())}
                                className="text-[#DA7756] hover:text-[#C15F3C] transition-colors"
                            >
                                Restore all dismissed
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

export default AnomalyAlertPanel;
