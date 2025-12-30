/**
 * Data Quality Badge
 * Displays data quality score with issue details on hover
 * Phase 1: Core Data Integration
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { QualityIssue } from '../../hooks/useGameData';

interface DataQualityBadgeProps {
    score: number; // 0-100
    issues: QualityIssue[];
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function DataQualityBadge({
    score,
    issues,
    showLabel = true,
    size = 'md',
}: DataQualityBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const getScoreColor = () => {
        if (score >= 90) return 'green';
        if (score >= 70) return 'yellow';
        if (score >= 50) return 'orange';
        return 'red';
    };

    const color = getScoreColor();
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    const colorClasses = {
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
        yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const sizeClasses = {
        sm: 'px-1.5 py-0.5 text-xs gap-1',
        md: 'px-2 py-1 text-xs gap-1.5',
        lg: 'px-3 py-1.5 text-sm gap-2',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };

    return (
        <div className="relative inline-block">
            <button
                className={`inline-flex items-center rounded-md border font-medium cursor-help ${colorClasses[color]} ${sizeClasses[size]}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                aria-label={`Data quality score: ${score}%. ${issues.length} issues found.`}
            >
                {score >= 90 ? (
                    <CheckCircle className={iconSizes[size]} />
                ) : criticalIssues.length > 0 ? (
                    <AlertCircle className={iconSizes[size]} />
                ) : (
                    <AlertTriangle className={iconSizes[size]} />
                )}
                {showLabel && <span>{score}% Quality</span>}
                {!showLabel && <span>{score}%</span>}
            </button>

            {/* Tooltip */}
            {showTooltip && issues.length > 0 && (
                <div
                    className="absolute z-50 top-full left-0 mt-2 w-72 bg-th-bg-surface border border-th-border-subtle rounded-lg shadow-lg p-3"
                    role="tooltip"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-th-text-primary">Data Quality Issues</h4>
                        <button
                            onClick={() => setShowTooltip(false)}
                            className="text-th-text-muted hover:text-th-text-primary"
                            aria-label="Close"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {issues.map((issue) => (
                            <div
                                key={issue.id}
                                className="flex items-start gap-2 text-xs"
                            >
                                {issue.severity === 'critical' && (
                                    <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                )}
                                {issue.severity === 'warning' && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                )}
                                {issue.severity === 'info' && (
                                    <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-th-text-secondary">{issue.message}</p>
                                    {issue.column && (
                                        <p className="text-th-text-muted">Column: {issue.column}</p>
                                    )}
                                    {issue.affectedRows && (
                                        <p className="text-th-text-muted">
                                            Affected rows: {issue.affectedRows.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {issues.length === 0 && (
                        <p className="text-xs text-th-text-muted">No issues found</p>
                    )}

                    <div className="mt-3 pt-2 border-t border-th-border-subtle flex items-center justify-between text-xs">
                        <span className="text-th-text-muted">
                            {criticalIssues.length} critical, {warningIssues.length} warnings
                        </span>
                        <span className={`font-medium ${
                            score >= 90 ? 'text-green-400' :
                            score >= 70 ? 'text-yellow-400' :
                            score >= 50 ? 'text-orange-400' :
                            'text-red-400'
                        }`}>
                            Score: {score}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Compact version for inline use
 */
export function DataQualityDot({ score }: { score: number }) {
    const color = score >= 90 ? 'bg-green-400' :
                  score >= 70 ? 'bg-yellow-400' :
                  score >= 50 ? 'bg-orange-400' :
                  'bg-red-400';

    return (
        <span
            className={`inline-block w-2 h-2 rounded-full ${color}`}
            title={`Data quality: ${score}%`}
            aria-label={`Data quality: ${score}%`}
        />
    );
}

/**
 * Full width quality bar for detailed view
 */
export function DataQualityBar({
    score,
    issues,
    showDetails = false,
}: {
    score: number;
    issues: QualityIssue[];
    showDetails?: boolean;
}) {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    const barColor = score >= 90 ? 'bg-green-500' :
                     score >= 70 ? 'bg-yellow-500' :
                     score >= 50 ? 'bg-orange-500' :
                     'bg-red-500';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="text-th-text-muted">Data Quality</span>
                <span className="font-medium text-th-text-primary">{score}%</span>
            </div>

            <div className="h-1.5 bg-th-bg-elevated rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} transition-all duration-300`}
                    style={{ width: `${score}%` }}
                />
            </div>

            {showDetails && issues.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-th-text-muted">
                    {criticalCount > 0 && (
                        <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            {criticalCount} critical
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-yellow-400" />
                            {warningCount} warnings
                        </span>
                    )}
                    {infoCount > 0 && (
                        <span className="flex items-center gap-1">
                            <Info className="w-3 h-3 text-blue-400" />
                            {infoCount} info
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default DataQualityBadge;
