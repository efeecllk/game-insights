/**
 * ML Insights Panel - Obsidian Analytics Design
 *
 * Premium AI insights with:
 * - Risk alerts and recommendations
 * - Segment identification
 * - Revenue trend analysis
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Brain,
    AlertTriangle,
    TrendingUp,
    Users,
    Zap,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { useML } from '../../context/MLContext';

interface MLInsightsPanelProps {
    compact?: boolean;
}

export function MLInsightsPanel({ compact = false }: MLInsightsPanelProps) {
    const {
        isReady,
        isTraining,
        atRiskUsers,
        segments,
        revenueForecast,
        churnPredictions,
    } = useML();

    const [isExpanded, setIsExpanded] = useState(!compact);

    // Generate insights
    const insights = [];

    // Churn risk insight
    if (atRiskUsers.length > 0) {
        insights.push({
            type: 'warning' as const,
            icon: AlertTriangle,
            title: `${atRiskUsers.length} users at high churn risk`,
            description: 'These users show declining engagement patterns',
            action: 'View in Predictions',
            link: '/predictions',
        });
    }

    // Whale identification
    const whaleCount = segments?.predefined?.whale?.length ?? 0;
    if (whaleCount > 0) {
        insights.push({
            type: 'positive' as const,
            icon: Users,
            title: `${whaleCount} whale users identified`,
            description: 'High-value users contributing significant revenue',
            action: 'View Segments',
            link: '/predictions',
        });
    }

    // Revenue trend
    if (revenueForecast.length > 0) {
        const trend = revenueForecast[0]?.trend;
        if (trend === 'growing') {
            insights.push({
                type: 'positive' as const,
                icon: TrendingUp,
                title: 'Revenue trending upward',
                description: 'Positive momentum detected in revenue patterns',
                action: 'View Forecast',
                link: '/predictions',
            });
        } else if (trend === 'declining') {
            insights.push({
                type: 'warning' as const,
                icon: TrendingUp,
                title: 'Revenue trending downward',
                description: 'Consider investigating potential causes',
                action: 'View Forecast',
                link: '/predictions',
            });
        }
    }

    // High churn rate alert
    const highRiskCount = churnPredictions.filter(
        p => p.riskLevel === 'high' || p.riskLevel === 'critical'
    ).length;
    const totalUsers = churnPredictions.length;
    const churnRiskPercent = totalUsers > 0 ? (highRiskCount / totalUsers) * 100 : 0;

    if (churnRiskPercent > 20) {
        insights.push({
            type: 'alert' as const,
            icon: Zap,
            title: `${churnRiskPercent.toFixed(0)}% of users at risk`,
            description: 'Higher than typical churn risk levels',
            action: 'Take Action',
            link: '/predictions',
        });
    }

    // Loading state
    if (isTraining) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-[#DA7756] animate-spin" />
                    <div>
                        <div className="font-medium text-white">Training ML Models</div>
                        <div className="text-sm text-zinc-500">
                            Analyzing your data for insights...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Not ready state
    if (!isReady) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-zinc-500" />
                    <div>
                        <div className="font-medium text-zinc-400">ML Insights</div>
                        <div className="text-sm text-zinc-500">
                            Upload data to enable AI-powered insights
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No insights
    if (insights.length === 0) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-[#7A8B5B]" />
                    <div>
                        <div className="font-medium text-white">All Clear</div>
                        <div className="text-sm text-zinc-500">
                            No critical insights at this time
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Compact mode
    if (compact && !isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-xl p-4 text-left hover:bg-[#DA7756]/15 transition-colors"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-[#DA7756]" />
                        <div>
                            <div className="font-medium text-white">
                                {insights.length} ML Insights
                            </div>
                            <div className="text-sm text-zinc-500">
                                Click to expand
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                </div>
            </button>
        );
    }

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#DA7756]" />
                    <span className="font-medium text-white">ML Insights</span>
                    <span className="px-2 py-0.5 bg-[#DA7756]/20 text-[#DA7756] text-xs rounded-full">
                        {insights.length}
                    </span>
                </div>
                {compact && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        Collapse
                    </button>
                )}
            </div>

            {/* Insights list */}
            <div className="divide-y divide-zinc-800">
                {insights.map((insight, i) => (
                    <InsightRow key={i} insight={insight} />
                ))}
            </div>
        </div>
    );
}

interface InsightRowProps {
    insight: {
        type: 'warning' | 'positive' | 'alert';
        icon: typeof AlertTriangle;
        title: string;
        description: string;
        action: string;
        link: string;
    };
}

function InsightRow({ insight }: InsightRowProps) {
    const { icon: Icon, title, description, action, link, type } = insight;

    const colors = {
        warning: 'text-orange-400 bg-orange-500/10',
        positive: 'text-[#7A8B5B] bg-[#7A8B5B]/10',
        alert: 'text-red-400 bg-red-500/10',
    };

    return (
        <Link
            to={link}
            className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors[type]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <div className="font-medium text-white text-sm">{title}</div>
                    <div className="text-xs text-zinc-500">{description}</div>
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
                <span>{action}</span>
                <ChevronRight className="w-4 h-4" />
            </div>
        </Link>
    );
}

export default MLInsightsPanel;
