/**
 * Churn Risk Table - Obsidian Analytics Design
 *
 * Premium churn risk display with:
 * - Risk level badges
 * - Prevention action buttons
 * - Expandable user details
 */

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, User, Clock, TrendingDown } from 'lucide-react';
import type { ChurnPredictionResult } from '../../ai/ml/MLService';

interface ChurnRiskTableProps {
    users: ChurnPredictionResult[];
    onActionClick?: (userId: string, action: string) => void;
    maxRows?: number;
}

export function ChurnRiskTable({ users, onActionClick, maxRows = 10 }: ChurnRiskTableProps) {
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const displayUsers = showAll ? users : users.slice(0, maxRows);

    if (users.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No high-risk users identified</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between text-xs text-zinc-500 px-3 py-2 bg-zinc-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span>{users.length} users at risk</span>
                </div>
                <span>Sorted by risk level</span>
            </div>

            {/* User rows */}
            {displayUsers.map(user => (
                <ChurnUserRow
                    key={user.userId}
                    user={user}
                    isExpanded={expandedUser === user.userId}
                    onToggle={() => setExpandedUser(
                        expandedUser === user.userId ? null : user.userId
                    )}
                    onActionClick={onActionClick}
                />
            ))}

            {/* Show more button */}
            {users.length > maxRows && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    {showAll ? 'Show less' : `Show ${users.length - maxRows} more`}
                </button>
            )}
        </div>
    );
}

interface ChurnUserRowProps {
    user: ChurnPredictionResult;
    isExpanded: boolean;
    onToggle: () => void;
    onActionClick?: (userId: string, action: string) => void;
}

function ChurnUserRow({ user, isExpanded, onToggle, onActionClick }: ChurnUserRowProps) {
    const riskColors = {
        critical: 'bg-red-500/20 text-red-400 border-red-500/30',
        high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        low: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    const riskColor = riskColors[user.riskLevel];

    return (
        <div className={`rounded-lg border ${riskColor} transition-all`}>
            {/* Main row */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                        <div className="font-medium text-white text-sm">
                            {user.userId.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-zinc-500">
                            {user.daysUntilChurn
                                ? `May churn in ~${user.daysUntilChurn} days`
                                : 'At risk of churning'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Risk score */}
                    <div className="text-right">
                        <div className="font-bold text-lg">
                            {(user.value * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs uppercase tracking-wide">
                            {user.riskLevel}
                        </div>
                    </div>

                    {/* Expand icon */}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-current/10">
                    {/* Factors */}
                    {user.factors && user.factors.length > 0 && (
                        <div className="pt-3">
                            <div className="text-xs font-medium text-zinc-400 mb-2">
                                Risk Factors
                            </div>
                            <div className="space-y-1">
                                {user.factors.map((factor, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        {factor.impact > 0.5 ? (
                                            <TrendingDown className="w-3 h-3 text-red-400" />
                                        ) : (
                                            <Clock className="w-3 h-3 text-yellow-400" />
                                        )}
                                        <span className="text-zinc-300">{factor.name}</span>
                                        <span className="text-zinc-500">—</span>
                                        <span className="text-zinc-400 text-xs">
                                            {factor.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Prevention actions */}
                    {user.preventionActions && user.preventionActions.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-zinc-400 mb-2">
                                Recommended Actions
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {user.preventionActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onActionClick?.(user.userId, action)}
                                        className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confidence */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>Confidence:</span>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-zinc-500"
                                style={{ width: `${user.confidence * 100}%` }}
                            />
                        </div>
                        <span>{(user.confidence * 100).toFixed(0)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChurnRiskTable;
