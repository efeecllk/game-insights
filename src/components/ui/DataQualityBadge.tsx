/**
 * Data Quality Badge - Obsidian Analytics Design
 *
 * Premium quality indicators with:
 * - Glassmorphism tooltips
 * - Animated color transitions
 * - Score-based styling
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        if (score >= 90) return 'warmOrange';
        if (score >= 70) return 'amber';
        if (score >= 50) return 'deepOrange';
        return 'rose';
    };

    const color = getScoreColor();
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    const colorClasses = {
        warmOrange: 'bg-[#DA7756]/10 text-[#DA7756] border-[#DA7756]/20 hover:bg-[#DA7756]/15',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15',
        deepOrange: 'bg-[#C15F3C]/10 text-[#C15F3C] border-[#C15F3C]/20 hover:bg-[#C15F3C]/15',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/15',
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
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`inline-flex items-center rounded-lg border font-medium cursor-help transition-colors ${colorClasses[color]} ${sizeClasses[size]}`}
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
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && issues.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute z-50 top-full left-0 mt-2 w-72 bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-950/98 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-3"
                        role="tooltip"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-white">Data Quality Issues</h4>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowTooltip(false)}
                                className="text-slate-500 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-3.5 h-3.5" />
                            </motion.button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {issues.map((issue) => (
                                <motion.div
                                    key={issue.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-2 text-xs"
                                >
                                    {issue.severity === 'critical' && (
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    {issue.severity === 'warning' && (
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    {issue.severity === 'info' && (
                                        <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="text-slate-300">{issue.message}</p>
                                        {issue.column && (
                                            <p className="text-slate-500">Column: {issue.column}</p>
                                        )}
                                        {issue.affectedRows && (
                                            <p className="text-slate-500">
                                                Affected rows: {issue.affectedRows.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {issues.length === 0 && (
                            <p className="text-xs text-slate-500">No issues found</p>
                        )}

                        <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                                {criticalIssues.length} critical, {warningIssues.length} warnings
                            </span>
                            <span className={`font-medium ${
                                score >= 90 ? 'text-[#DA7756]' :
                                score >= 70 ? 'text-amber-400' :
                                score >= 50 ? 'text-[#C15F3C]' :
                                'text-rose-400'
                            }`}>
                                Score: {score}%
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Compact version for inline use
 */
export function DataQualityDot({ score }: { score: number }) {
    const color = score >= 90 ? 'bg-[#DA7756]' :
                  score >= 70 ? 'bg-amber-400' :
                  score >= 50 ? 'bg-[#C15F3C]' :
                  'bg-rose-400';

    return (
        <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
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

    const barColor = score >= 90 ? 'bg-[#DA7756]' :
                     score >= 70 ? 'bg-amber-500' :
                     score >= 50 ? 'bg-[#C15F3C]' :
                     'bg-rose-500';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Data Quality</span>
                <span className="font-medium text-white">{score}%</span>
            </div>

            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${barColor}`}
                />
            </div>

            {showDetails && issues.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    {criticalCount > 0 && (
                        <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            {criticalCount} critical
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
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
