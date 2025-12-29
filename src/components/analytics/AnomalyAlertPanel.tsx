/**
 * AnomalyAlertPanel Component
 * Displays detected anomalies with filtering, sorting, and detailed views
 */

import { useState, useMemo } from 'react';
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Activity,
    ChevronDown,
    ChevronRight,
    Filter,
    Clock,
    Percent,
    AlertCircle,
    CheckCircle2,
    Lightbulb,
    Eye,
    EyeOff,
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

const SEVERITY_CONFIG: Record<AnomalySeverity, {
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeBg: string;
    icon: React.ElementType;
}> = {
    critical: {
        label: 'Critical',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-500',
        badgeBg: 'bg-red-500',
        icon: AlertCircle,
    },
    high: {
        label: 'High',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        textColor: 'text-orange-500',
        badgeBg: 'bg-orange-500',
        icon: AlertTriangle,
    },
    medium: {
        label: 'Medium',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-500',
        badgeBg: 'bg-amber-500',
        icon: AlertTriangle,
    },
    low: {
        label: 'Low',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-500',
        badgeBg: 'bg-blue-500',
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

function SeverityBadge({ severity, count }: { severity: AnomalySeverity; count: number }) {
    const config = SEVERITY_CONFIG[severity];
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
            <span className={`w-2 h-2 rounded-full ${config.badgeBg}`} />
            <span className={`text-sm font-medium ${config.textColor}`}>
                {count} {config.label}
            </span>
        </div>
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
        <div
            className={`rounded-lg border transition-all ${severityConfig.bgColor} ${severityConfig.borderColor} ${
                isExpanded ? 'ring-1 ring-offset-1 ring-offset-transparent' : ''
            } ${isExpanded ? severityConfig.borderColor.replace('border-', 'ring-') : ''}`}
        >
            {/* Header */}
            <div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={onToggle}
            >
                <div className={`mt-0.5 ${severityConfig.textColor}`}>
                    <SeverityIcon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-th-text-primary">{anomaly.metric}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${severityConfig.bgColor} ${severityConfig.textColor} font-medium`}>
                            {severityConfig.label}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-th-bg-elevated text-th-text-muted flex items-center gap-1">
                            <TypeIcon className="w-3 h-3" />
                            {TYPE_LABELS[anomaly.type]}
                        </span>
                    </div>
                    <p className="text-sm text-th-text-secondary mt-1 line-clamp-2">{anomaly.description}</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${anomaly.percentChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {anomaly.percentChange > 0 ? '+' : ''}{anomaly.percentChange.toFixed(1)}%
                    </span>
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-th-text-muted" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-th-text-muted" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-th-border/50 pt-4 ml-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-th-bg-surface/50 rounded-lg p-3">
                            <div className="text-xs text-th-text-muted mb-1">Actual Value</div>
                            <div className="text-lg font-semibold text-th-text-primary">
                                {typeof anomaly.value === 'number' ? anomaly.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : anomaly.value}
                            </div>
                        </div>
                        <div className="bg-th-bg-surface/50 rounded-lg p-3">
                            <div className="text-xs text-th-text-muted mb-1">Expected Value</div>
                            <div className="text-lg font-semibold text-th-text-primary">
                                ~{anomaly.expectedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="bg-th-bg-surface/50 rounded-lg p-3">
                            <div className="text-xs text-th-text-muted mb-1">Deviation</div>
                            <div className="text-lg font-semibold text-th-text-primary">
                                {anomaly.deviation.toFixed(2)}σ
                            </div>
                        </div>
                        <div className="bg-th-bg-surface/50 rounded-lg p-3">
                            <div className="text-xs text-th-text-muted mb-1">Detected</div>
                            <div className="text-sm font-medium text-th-text-primary">
                                {new Date(anomaly.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Possible Causes */}
                    {anomaly.possibleCauses && anomaly.possibleCauses.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-th-text-secondary mb-2">
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                Possible Causes
                            </div>
                            <ul className="space-y-1.5">
                                {anomaly.possibleCauses.map((cause, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-th-text-muted">
                                        <span className="text-th-text-muted mt-1">•</span>
                                        {cause}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                        {onAcknowledge && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAcknowledge();
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Acknowledge
                            </button>
                        )}
                        {onDismiss && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss();
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-th-bg-elevated text-th-text-muted rounded-lg hover:bg-th-interactive-hover transition-colors"
                            >
                                <EyeOff className="w-4 h-4" />
                                Dismiss
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
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
            <div className={`bg-th-bg-surface rounded-card border border-th-border p-8 ${className ?? ''}`}>
                <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-th-text-primary mb-2">No Anomalies Detected</h3>
                    <p className="text-th-text-muted">
                        Your metrics are within normal ranges. We'll alert you when something unusual happens.
                    </p>
                </div>
            </div>
        );
    }

    const hasCritical = stats.critical > 0;
    const hasHigh = stats.high > 0;

    return (
        <div className={`bg-th-bg-surface rounded-card border border-th-border overflow-hidden ${className ?? ''}`}>
            {/* Header */}
            <div className={`p-4 border-b ${hasCritical ? 'bg-red-500/5 border-red-500/20' : hasHigh ? 'bg-orange-500/5 border-orange-500/20' : 'border-th-border'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasCritical ? 'bg-red-500/20' : hasHigh ? 'bg-orange-500/20' : 'bg-amber-500/20'}`}>
                            <AlertTriangle className={`w-5 h-5 ${hasCritical ? 'text-red-500' : hasHigh ? 'text-orange-500' : 'text-amber-500'}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-th-text-primary">Anomaly Alerts</h2>
                            <p className="text-sm text-th-text-muted">
                                {stats.total} anomal{stats.total === 1 ? 'y' : 'ies'} detected across {uniqueMetrics.length} metric{uniqueMetrics.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            showFilters ? 'bg-th-accent-primary text-white' : 'bg-th-bg-elevated text-th-text-secondary hover:bg-th-interactive-hover'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {/* Severity Summary */}
                <div className="flex flex-wrap gap-2">
                    {stats.critical > 0 && <SeverityBadge severity="critical" count={stats.critical} />}
                    {stats.high > 0 && <SeverityBadge severity="high" count={stats.high} />}
                    {stats.medium > 0 && <SeverityBadge severity="medium" count={stats.medium} />}
                    {stats.low > 0 && <SeverityBadge severity="low" count={stats.low} />}
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="p-4 bg-th-bg-elevated/50 border-b border-th-border space-y-3">
                    <div className="flex flex-wrap gap-4">
                        {/* Severity Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-th-text-muted">Severity:</span>
                            <div className="flex gap-1">
                                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(severity => (
                                    <button
                                        key={severity}
                                        onClick={() => setFilterSeverity(severity)}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterSeverity === severity
                                                ? 'bg-th-accent-primary text-white'
                                                : 'bg-th-bg-surface text-th-text-secondary hover:bg-th-interactive-hover'
                                        }`}
                                    >
                                        {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-th-text-muted">Sort by:</span>
                            <div className="flex gap-1">
                                {([
                                    { value: 'severity', label: 'Severity', icon: AlertTriangle },
                                    { value: 'timestamp', label: 'Time', icon: Clock },
                                    { value: 'percentChange', label: 'Change', icon: Percent },
                                ] as const).map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSortBy(option.value)}
                                        className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-lg transition-colors ${
                                            sortBy === option.value
                                                ? 'bg-th-accent-primary text-white'
                                                : 'bg-th-bg-surface text-th-text-secondary hover:bg-th-interactive-hover'
                                        }`}
                                    >
                                        <option.icon className="w-3.5 h-3.5" />
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Show Dismissed Toggle */}
                    {dismissedIds.size > 0 && (
                        <button
                            onClick={() => setShowDismissed(!showDismissed)}
                            className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                        >
                            {showDismissed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {showDismissed ? 'Hide' : 'Show'} {dismissedIds.size} dismissed
                        </button>
                    )}
                </div>
            )}

            {/* Anomaly List */}
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {filteredAnomalies.length === 0 ? (
                    <div className="text-center py-8 text-th-text-muted">
                        No anomalies match the current filters
                    </div>
                ) : (
                    filteredAnomalies.map(anomaly => (
                        <AnomalyCard
                            key={anomaly.id}
                            anomaly={anomaly}
                            isExpanded={expandedId === anomaly.id}
                            onToggle={() => setExpandedId(expandedId === anomaly.id ? null : anomaly.id)}
                            onDismiss={() => handleDismiss(anomaly.id)}
                            onAcknowledge={() => handleAcknowledge(anomaly.id)}
                            isDismissed={dismissedIds.has(anomaly.id) && !showDismissed}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            {filteredAnomalies.length > 0 && (
                <div className="px-4 py-3 bg-th-bg-elevated/30 border-t border-th-border">
                    <div className="flex items-center justify-between text-sm text-th-text-muted">
                        <span>
                            Showing {filteredAnomalies.length} of {anomalies.length - dismissedIds.size} anomalies
                        </span>
                        {dismissedIds.size > 0 && (
                            <button
                                onClick={() => setDismissedIds(new Set())}
                                className="text-th-accent-primary hover:underline"
                            >
                                Restore all dismissed
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnomalyAlertPanel;
