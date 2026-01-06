/**
 * ExperimentInsights Component - Obsidian Analytics Design
 *
 * AI-powered experiment analysis with:
 * - Health scores and risk assessments
 * - Smart recommendations
 * - Aggregate insights for multiple experiments
 */

import { useMemo } from 'react';
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Lightbulb,
    AlertCircle,
    CheckCircle,
    Clock,
    Target,
    Activity,
    BarChart2,
    Users,
    Percent,
    Info,
    Brain,
} from 'lucide-react';
import type { Experiment } from '@/lib/experimentStore';
import {
    analyzeExperiment,
    generateAggregateInsights,
    type ExperimentIntelligence,
    type ExperimentRisk,
    type ExperimentInsight,
    type ExperimentRecommendation,
    type AggregateInsights,
    type RiskLevel,
} from '@/lib/experimentIntelligence';

// ============================================================================
// Types
// ============================================================================

interface ExperimentInsightsProps {
    /** Single experiment to analyze */
    experiment?: Experiment;
    /** Multiple experiments for aggregate insights */
    experiments?: Experiment[];
    /** Show aggregate view */
    showAggregate?: boolean;
    /** Compact mode */
    compact?: boolean;
}

interface RiskCardProps {
    risk: ExperimentRisk;
}

interface InsightCardProps {
    insight: ExperimentInsight;
}

interface RecommendationCardProps {
    recommendation: ExperimentRecommendation;
}

// ============================================================================
// Helper Components
// ============================================================================

const levelColors: Record<RiskLevel, string> = {
    low: 'text-chart-green',
    medium: 'text-chart-orange',
    high: 'text-chart-pink',
    critical: 'text-red-500',
};

const levelBgColors: Record<RiskLevel, string> = {
    low: 'bg-chart-green/10',
    medium: 'bg-chart-orange/10',
    high: 'bg-chart-pink/10',
    critical: 'bg-red-500/10',
};

const insightTypeColors = {
    positive: 'text-chart-green',
    negative: 'text-chart-pink',
    neutral: 'text-text-secondary',
    warning: 'text-chart-orange',
};

function RiskCard({ risk }: RiskCardProps) {
    const Icon = risk.level === 'critical' || risk.level === 'high'
        ? AlertTriangle
        : AlertCircle;

    return (
        <div className={`p-3 rounded-lg ${levelBgColors[risk.level]} border border-transparent`}>
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${levelColors[risk.level]}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${levelColors[risk.level]}`}>
                            {risk.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-bg-card text-text-secondary">
                            {risk.level}
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{risk.message}</p>
                    {risk.details && (
                        <p className="text-xs text-text-tertiary mt-1">{risk.details}</p>
                    )}
                    {risk.recommendation && (
                        <p className="text-xs text-text-tertiary mt-2 italic">
                            💡 {risk.recommendation}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function InsightCard({ insight }: InsightCardProps) {
    const Icon = insight.type === 'positive' ? TrendingUp :
                 insight.type === 'negative' ? TrendingDown :
                 insight.type === 'warning' ? AlertCircle :
                 Lightbulb;

    return (
        <div className="p-3 rounded-lg bg-bg-card border border-border-default">
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${insightTypeColors[insight.type]}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                            {insight.title}
                        </span>
                        {insight.metric && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary">
                                {insight.metric}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{insight.message}</p>
                    {insight.impact !== undefined && (
                        <p className={`text-xs mt-1 ${insight.impact > 0 ? 'text-chart-green' : insight.impact < 0 ? 'text-chart-pink' : 'text-text-tertiary'}`}>
                            Impact: {insight.impact > 0 ? '+' : ''}{(insight.impact * 100).toFixed(1)}%
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
    const actionIcons = {
        continue: Clock,
        stop_winner: CheckCircle,
        stop_no_effect: AlertCircle,
        extend: Activity,
        investigate: Target,
    };

    const actionColors = {
        continue: 'text-chart-cyan',
        stop_winner: 'text-chart-green',
        stop_no_effect: 'text-chart-orange',
        extend: 'text-chart-purple',
        investigate: 'text-chart-pink',
    };

    const Icon = actionIcons[recommendation.action];

    return (
        <div className="p-4 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent-primary/20">
                    <Icon className={`w-5 h-5 ${actionColors[recommendation.action]}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                            Recommended Action
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-bg-card ${actionColors[recommendation.action]}`}>
                            {recommendation.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-2">{recommendation.reason}</p>

                    {recommendation.details.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-text-tertiary mb-1">Details:</p>
                            <ul className="space-y-1">
                                {recommendation.details.map((detail: string, i: number) => (
                                    <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                        <span className="text-accent-primary">•</span>
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border-subtle">
                        <span className="text-xs text-text-tertiary">
                            Confidence: <span className="text-text-secondary font-medium">{(recommendation.confidence * 100).toFixed(0)}%</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthScore({ score, label }: { score: number; label: string }) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-chart-green';
        if (s >= 60) return 'text-chart-cyan';
        if (s >= 40) return 'text-chart-orange';
        return 'text-chart-pink';
    };

    const getScoreBg = (s: number) => {
        if (s >= 80) return 'bg-chart-green';
        if (s >= 60) return 'bg-chart-cyan';
        if (s >= 40) return 'bg-chart-orange';
        return 'bg-chart-pink';
    };

    return (
        <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
            </div>
            <div className="text-xs text-text-tertiary mt-1">{label}</div>
            <div className="mt-2 h-1 w-16 mx-auto bg-bg-elevated rounded-full overflow-hidden">
                <div
                    className={`h-full ${getScoreBg(score)} transition-all duration-500`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function ExperimentInsights({
    experiment,
    experiments = [],
    showAggregate = false,
    compact = false,
}: ExperimentInsightsProps) {
    // Analyze single experiment
    const intelligence = useMemo<ExperimentIntelligence | null>(() => {
        if (!experiment) return null;
        return analyzeExperiment(experiment);
    }, [experiment]);

    // Generate aggregate insights
    const aggregateInsights = useMemo<AggregateInsights | null>(() => {
        if (!showAggregate || experiments.length === 0) return null;
        return generateAggregateInsights(experiments);
    }, [experiments, showAggregate]);

    // Render aggregate view
    if (showAggregate && aggregateInsights) {
        return (
            <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-bg-card border border-border-default text-center">
                        <BarChart2 className="w-5 h-5 mx-auto text-chart-purple mb-2" />
                        <div className="text-2xl font-bold text-text-primary">
                            {aggregateInsights.totalExperiments}
                        </div>
                        <div className="text-xs text-text-secondary">Total Experiments</div>
                    </div>
                    <div className="p-4 rounded-lg bg-bg-card border border-border-default text-center">
                        <Percent className="w-5 h-5 mx-auto text-chart-green mb-2" />
                        <div className="text-2xl font-bold text-chart-green">
                            {(aggregateInsights.avgWinRate * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-text-secondary">Win Rate</div>
                    </div>
                    <div className="p-4 rounded-lg bg-bg-card border border-border-default text-center">
                        <TrendingUp className="w-5 h-5 mx-auto text-chart-cyan mb-2" />
                        <div className="text-2xl font-bold text-chart-cyan">
                            {aggregateInsights.avgEffectSize >= 0 ? '+' : ''}{(aggregateInsights.avgEffectSize * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-text-secondary">Avg Effect Size</div>
                    </div>
                    <div className="p-4 rounded-lg bg-bg-card border border-border-default text-center">
                        <Users className="w-5 h-5 mx-auto text-chart-orange mb-2" />
                        <div className="text-2xl font-bold text-text-primary">
                            {aggregateInsights.activeExperiments}
                        </div>
                        <div className="text-xs text-text-secondary">Active Experiments</div>
                    </div>
                </div>

                {/* Recent Winners */}
                {aggregateInsights.recentWinners.length > 0 && (
                    <div className="p-4 rounded-lg bg-bg-card border border-border-default">
                        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-chart-green" />
                            Recent Winners
                        </h3>
                        <div className="space-y-2">
                            {aggregateInsights.recentWinners.map((winner, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded bg-bg-elevated">
                                    <span className="text-sm text-text-primary">{winner.name}</span>
                                    <span className="text-sm text-chart-green">
                                        +{(winner.improvement * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Common Risks */}
                {aggregateInsights.commonRisks.length > 0 && (
                    <div className="p-4 rounded-lg bg-bg-card border border-border-default">
                        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-chart-pink" />
                            Common Issues ({aggregateInsights.commonRisks.reduce((sum, r) => sum + r.count, 0)} total)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {aggregateInsights.commonRisks.map((risk, i: number) => (
                                <span
                                    key={i}
                                    className="text-xs px-2 py-1 rounded-full bg-chart-pink/10 text-chart-pink"
                                >
                                    {risk.type.replace(/_/g, ' ')} ({risk.count})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {aggregateInsights.recommendations.length > 0 && (
                    <div className="p-4 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
                        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                            <Brain className="w-4 h-4 text-accent-primary" />
                            Recommendations
                        </h3>
                        <ul className="space-y-2">
                            {aggregateInsights.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-chart-orange mt-0.5 flex-shrink-0" />
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    // Single experiment view
    if (!intelligence) {
        return (
            <div className="p-8 text-center text-text-secondary">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select an experiment to see AI-powered insights</p>
            </div>
        );
    }

    // Calculate data quality score from boolean flags
    const dataQualityScore = (
        (intelligence.dataQuality.sampleRatioMismatch ? 0 : 1) +
        (intelligence.dataQuality.sufficientSampleSize ? 1 : 0) +
        (intelligence.dataQuality.stableMetrics ? 1 : 0)
    ) / 3 * 100;

    const dataQualityIssues: string[] = [];
    if (!intelligence.dataQuality.sampleRatioMismatch) {
        dataQualityIssues.push('Sample ratio mismatch detected');
    }
    if (!intelligence.dataQuality.sufficientSampleSize) {
        dataQualityIssues.push('Insufficient sample size');
    }
    if (!intelligence.dataQuality.stableMetrics) {
        dataQualityIssues.push('Unstable metrics');
    }

    if (compact) {
        // Compact view - just health scores and primary recommendation
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-around p-4 rounded-lg bg-bg-card border border-border-default">
                    <HealthScore score={intelligence.healthScore} label="Health" />
                    <HealthScore score={Math.round(dataQualityScore)} label="Data Quality" />
                </div>

                {intelligence.recommendation && (
                    <RecommendationCard recommendation={intelligence.recommendation} />
                )}

                {intelligence.risks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {intelligence.risks.slice(0, 3).map((risk: ExperimentRisk, i: number) => (
                            <span
                                key={i}
                                className={`text-xs px-2 py-1 rounded-full ${levelBgColors[risk.level]} ${levelColors[risk.level]}`}
                            >
                                {risk.type.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Calculate risk score
    const riskScore = 100 - (intelligence.risks.filter((r: ExperimentRisk) => r.level === 'high' || r.level === 'critical').length * 25);

    // Full view
    return (
        <div className="space-y-6">
            {/* Health Overview */}
            <div className="p-4 rounded-lg bg-bg-card border border-border-default">
                <h3 className="text-sm font-medium text-text-primary mb-4">Experiment Health</h3>
                <div className="flex items-center justify-around">
                    <HealthScore score={intelligence.healthScore} label="Overall Health" />
                    <div className="h-12 w-px bg-border-default" />
                    <HealthScore score={Math.round(dataQualityScore)} label="Data Quality" />
                    <div className="h-12 w-px bg-border-default" />
                    <HealthScore
                        score={Math.max(0, riskScore)}
                        label="Risk Score"
                    />
                </div>

                {/* Data Quality Issues */}
                {dataQualityIssues.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                        <p className="text-xs font-medium text-text-tertiary mb-2">Data Quality Issues:</p>
                        <div className="flex flex-wrap gap-1">
                            {dataQualityIssues.map((issue: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded bg-chart-orange/10 text-chart-orange">
                                    {issue}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recommendation */}
            {intelligence.recommendation && (
                <RecommendationCard recommendation={intelligence.recommendation} />
            )}

            {/* Risks */}
            {intelligence.risks.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-chart-pink" />
                        Risk Analysis ({intelligence.risks.length})
                    </h3>
                    <div className="space-y-2">
                        {intelligence.risks.map((risk: ExperimentRisk, i: number) => (
                            <RiskCard key={i} risk={risk} />
                        ))}
                    </div>
                </div>
            )}

            {/* Insights */}
            {intelligence.insights.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-chart-orange" />
                        AI Insights ({intelligence.insights.length})
                    </h3>
                    <div className="space-y-2">
                        {intelligence.insights.map((insight: ExperimentInsight, i: number) => (
                            <InsightCard key={i} insight={insight} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExperimentInsights;
