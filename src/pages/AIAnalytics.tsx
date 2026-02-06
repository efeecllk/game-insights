/**
 * AI Analytics Page
 *
 * Shows pipeline results: insights, metrics, anomalies, and Q&A.
 * Uses useAnalytics() which auto-runs DataPipeline on data load.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    Sparkles,
    Info,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Lightbulb,
    Users,
    DollarSign,
    Activity,
    Loader2,
    MessageSquare,
    Send,
    ChevronDown,
    BarChart3,
    Target,
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';
import { Card } from '../components/ui/Card';
import type { Insight } from '../ai/InsightGenerator';
import type { Anomaly } from '../ai/AnomalyDetector';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
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

// Insight type → icon mapping
const insightIcons: Record<Insight['type'], typeof TrendingUp> = {
    positive: TrendingUp,
    negative: TrendingDown,
    warning: AlertTriangle,
    neutral: Info,
    opportunity: Lightbulb,
};

const insightColors: Record<Insight['type'], { bg: string; border: string; text: string }> = {
    positive: { bg: 'bg-[#7A8B5B]/10', border: 'border-[#7A8B5B]/20', text: 'text-[#7A8B5B]' },
    negative: { bg: 'bg-[#c25d5d]/10', border: 'border-[#c25d5d]/20', text: 'text-[#c25d5d]' },
    warning: { bg: 'bg-[#E5A84B]/10', border: 'border-[#E5A84B]/20', text: 'text-[#E5A84B]' },
    neutral: { bg: 'bg-th-bg-elevated/50', border: 'border-th-border-subtle', text: 'text-th-text-secondary' },
    opportunity: { bg: 'bg-[#DA7756]/10', border: 'border-[#DA7756]/20', text: 'text-[#DA7756]' },
};

const severityColors: Record<string, string> = {
    critical: 'text-[#c25d5d]',
    high: 'text-[#DA7756]',
    medium: 'text-[#E5A84B]',
    low: 'text-th-text-muted',
};

function formatNumber(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
}

function formatCurrency(value: number): string {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
}

// ── Insight Card ──────────────────────────────────────────
function InsightCard({ insight, index }: { insight: Insight; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const Icon = insightIcons[insight.type] || Info;
    const colors = insightColors[insight.type] || insightColors.neutral;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <div
                className={`${colors.bg} border ${colors.border} rounded-xl p-4 cursor-pointer transition-colors hover:brightness-110`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-th-text-primary">{insight.title}</h4>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} capitalize`}>
                                {insight.businessImpact}
                            </span>
                        </div>
                        <p className="text-xs text-th-text-muted line-clamp-2">{insight.description}</p>

                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-3 pt-3 border-t border-th-border-subtle space-y-2">
                                        {insight.recommendation && (
                                            <div className="flex items-start gap-2">
                                                <Target className="w-3.5 h-3.5 text-th-accent-primary mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-th-text-secondary">{insight.recommendation}</p>
                                            </div>
                                        )}
                                        {insight.evidence && insight.evidence.length > 0 && (
                                            <div className="space-y-1">
                                                {insight.evidence.map((e, i) => (
                                                    <p key={i} className="text-xs text-th-text-muted pl-5">• {e}</p>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-th-text-muted pt-1">
                                            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                                            <span>Priority: {insight.priority}/10</span>
                                            <span className="capitalize">{insight.category}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-th-text-muted transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>
        </motion.div>
    );
}

// ── Anomaly Row ──────────────────────────────────────────
function AnomalyRow({ anomaly, index }: { anomaly: Anomaly; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-th-bg-elevated/30 hover:bg-th-bg-elevated/50 transition-colors"
        >
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${severityColors[anomaly.severity] || 'text-th-text-muted'}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-th-text-primary truncate">{anomaly.description}</p>
                <p className="text-xs text-th-text-muted">
                    {anomaly.metric} — {anomaly.percentChange > 0 ? '+' : ''}{anomaly.percentChange.toFixed(1)}% from expected
                </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${severityColors[anomaly.severity] || 'text-th-text-muted'}`}>
                {anomaly.severity}
            </span>
        </motion.div>
    );
}

// ── Q&A Section ──────────────────────────────────────────
function QASection({ askQuestion }: { askQuestion: (q: string) => Promise<unknown> }) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [asking, setAsking] = useState(false);

    const suggestedQuestions = [
        'What are the top performing segments?',
        'Which metrics need attention?',
        'What is the retention trend?',
    ];

    const handleAsk = async (q: string) => {
        if (!q.trim()) return;
        setAsking(true);
        setAnswer(null);
        try {
            const result = await askQuestion(q.trim()) as { answer?: string } | null;
            setAnswer(result?.answer || 'No answer could be generated for this question.');
        } catch {
            setAnswer('Failed to process question. Try again.');
        }
        setAsking(false);
    };

    return (
        <Card variant="default" padding="md">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-th-accent-primary" />
                <h3 className="font-display font-semibold text-th-text-primary">Ask About Your Data</h3>
            </div>

            {/* Suggested questions */}
            <div className="flex flex-wrap gap-2 mb-4">
                {suggestedQuestions.map((q) => (
                    <button
                        key={q}
                        onClick={() => { setQuestion(q); handleAsk(q); }}
                        className="px-3 py-1.5 text-xs bg-th-bg-elevated/50 hover:bg-th-bg-elevated text-th-text-secondary hover:text-th-text-primary rounded-lg border border-th-border-subtle hover:border-th-accent-primary/30 transition-all"
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk(question)}
                    placeholder="Ask a question about your data..."
                    className="flex-1 px-3 py-2 bg-th-bg-elevated/30 border border-th-border-subtle rounded-lg text-sm text-th-text-primary placeholder-th-text-muted focus:outline-none focus:ring-2 focus:ring-th-accent-primary/50 focus:border-th-accent-primary/50 transition-all"
                />
                <button
                    onClick={() => handleAsk(question)}
                    disabled={asking || !question.trim()}
                    className="px-3 py-2 bg-th-accent-primary text-th-text-inverse rounded-lg hover:bg-th-accent-primary-hover transition-colors disabled:opacity-50"
                >
                    {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>

            {/* Answer */}
            <AnimatePresence>
                {answer && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 p-4 bg-th-bg-elevated/30 border border-th-border-subtle rounded-lg"
                    >
                        <p className="text-sm text-th-text-secondary whitespace-pre-wrap">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

// ── Main Page ────────────────────────────────────────────
export function AIAnalyticsPage() {
    const { hasRealData, activeGameData } = useGameData();
    const { result, isProcessing, isLoading, error, askQuestion } = useAnalytics();

    // Sort insights by priority (highest first)
    const sortedInsights = useMemo(() => {
        if (!result?.insights) return [];
        return [...result.insights].sort((a, b) => b.priority - a.priority);
    }, [result?.insights]);

    // Sort anomalies by severity
    const sortedAnomalies = useMemo(() => {
        if (!result?.anomalies) return [];
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return [...result.anomalies].sort(
            (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
        );
    }, [result?.anomalies]);

    const metrics = result?.metrics?.summary;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <Card variant="elevated" padding="md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-th-accent-primary/10 border border-th-accent-primary/20 flex items-center justify-center">
                                <Bot className="w-6 h-6 text-th-accent-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-display font-bold text-th-text-primary">
                                        AI Analytics
                                    </h1>
                                    <DataModeIndicator />
                                </div>
                                <p className="text-sm text-th-text-muted mt-0.5">
                                    {result
                                        ? `${sortedInsights.length} insights • ${sortedAnomalies.length} anomalies detected`
                                        : 'AI-powered insights from your data'}
                                </p>
                            </div>
                        </div>
                        {result && (
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-th-text-muted">Game Type</p>
                                <p className="text-sm font-medium text-th-text-primary capitalize">
                                    {result.gameType.replace('_', ' ')}
                                </p>
                                <p className="text-xs text-th-text-muted mt-0.5">
                                    {(result.gameTypeConfidence * 100).toFixed(0)}% confidence
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>

            {/* Loading / Processing State */}
            {(isLoading || isProcessing) && hasRealData && (
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg" className="text-center">
                        <Loader2 className="w-8 h-8 text-th-accent-primary animate-spin mx-auto mb-3" />
                        <h3 className="text-sm font-medium text-th-text-primary">
                            {isProcessing ? 'Running AI analysis pipeline...' : 'Loading data...'}
                        </h3>
                        <p className="text-xs text-th-text-muted mt-1">
                            Detecting patterns, calculating metrics, and generating insights
                        </p>
                    </Card>
                </motion.div>
            )}

            {/* Error State */}
            {error && (
                <motion.div variants={itemVariants}>
                    <div className="bg-[#c25d5d]/10 border border-[#c25d5d]/20 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#c25d5d]" />
                            <p className="text-sm text-[#c25d5d]">{error}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* No data state */}
            {!hasRealData && !isLoading && (
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg" className="text-center">
                        <Sparkles className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                        <h2 className="text-lg font-display font-semibold text-th-text-primary mb-2">
                            Upload data to get started
                        </h2>
                        <p className="text-sm text-th-text-muted max-w-md mx-auto">
                            Upload a CSV, Excel, or JSON file and the AI pipeline will automatically
                            analyze your data, detect patterns, and generate actionable insights.
                        </p>
                    </Card>
                </motion.div>
            )}

            {/* ── Results ── */}
            {result && !isProcessing && (
                <>
                    {/* Metrics Summary Cards */}
                    {metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <motion.div variants={itemVariants}>
                                <Card variant="default" padding="md">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users className="w-4 h-4 text-[#DA7756]" />
                                        <span className="text-xs text-th-text-muted">Total Users</span>
                                    </div>
                                    <p className="text-xl font-display font-bold text-th-text-primary">
                                        {formatNumber(metrics.totalUsers)}
                                    </p>
                                </Card>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Card variant="default" padding="md">
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign className="w-4 h-4 text-[#7A8B5B]" />
                                        <span className="text-xs text-th-text-muted">Total Revenue</span>
                                    </div>
                                    <p className="text-xl font-display font-bold text-th-text-primary">
                                        {formatCurrency(metrics.totalRevenue)}
                                    </p>
                                </Card>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Card variant="default" padding="md">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity className="w-4 h-4 text-[#C15F3C]" />
                                        <span className="text-xs text-th-text-muted">ARPU</span>
                                    </div>
                                    <p className="text-xl font-display font-bold text-th-text-primary">
                                        {formatCurrency(metrics.arpu)}
                                    </p>
                                </Card>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Card variant="default" padding="md">
                                    <div className="flex items-center gap-2 mb-1">
                                        <BarChart3 className="w-4 h-4 text-[#E5A84B]" />
                                        <span className="text-xs text-th-text-muted">D1 Retention</span>
                                    </div>
                                    <p className="text-xl font-display font-bold text-th-text-primary">
                                        {metrics.d1Retention != null ? `${metrics.d1Retention.toFixed(1)}%` : '—'}
                                    </p>
                                </Card>
                            </motion.div>
                        </div>
                    )}

                    {/* Dataset Info Bar */}
                    {activeGameData && (
                        <motion.div variants={itemVariants}>
                            <div className="flex items-center gap-4 px-4 py-3 bg-th-bg-surface border border-th-border-subtle rounded-xl text-xs text-th-text-muted">
                                <span>{activeGameData.rowCount.toLocaleString()} rows</span>
                                <span>{activeGameData.columnMappings.length} columns</span>
                                <span>Quality: {result.qualityBefore}/100</span>
                                {result.pipelineStats && (
                                    <span>Sampled: {result.pipelineStats.sampledRows.toLocaleString()} rows</span>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Insights */}
                    {sortedInsights.length > 0 && (
                        <motion.div variants={itemVariants} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-th-accent-primary" />
                                <h2 className="text-lg font-display font-semibold text-th-text-primary">
                                    Insights
                                </h2>
                                <span className="text-xs text-th-text-muted">({sortedInsights.length})</span>
                            </div>
                            <div className="space-y-2">
                                {sortedInsights.map((insight, i) => (
                                    <InsightCard key={insight.id} insight={insight} index={i} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Anomalies */}
                    {sortedAnomalies.length > 0 && (
                        <motion.div variants={itemVariants}>
                            <Card variant="default" padding="md">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle className="w-5 h-5 text-[#E5A84B]" />
                                    <h3 className="font-display font-semibold text-th-text-primary">
                                        Anomalies
                                    </h3>
                                    {result.anomalyStats && (
                                        <span className="text-xs text-th-text-muted ml-auto">
                                            {result.anomalyStats.critical} critical • {result.anomalyStats.high} high
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {sortedAnomalies.slice(0, 10).map((anomaly, i) => (
                                        <AnomalyRow key={anomaly.id} anomaly={anomaly} index={i} />
                                    ))}
                                    {sortedAnomalies.length > 10 && (
                                        <p className="text-xs text-th-text-muted text-center pt-2">
                                            + {sortedAnomalies.length - 10} more anomalies
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Chart Recommendations */}
                    {result.chartRecommendations?.length > 0 && (
                        <motion.div variants={itemVariants}>
                            <Card variant="default" padding="md">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-5 h-5 text-th-accent-primary" />
                                    <h3 className="font-display font-semibold text-th-text-primary">
                                        Recommended Visualizations
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {result.chartRecommendations.slice(0, 6).map((chart, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="p-3 rounded-lg bg-th-bg-elevated/30 border border-th-border-subtle"
                                        >
                                            <p className="text-sm font-medium text-th-text-primary">{chart.title}</p>
                                            <p className="text-xs text-th-text-muted mt-1">{chart.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-th-accent-primary/10 text-th-accent-primary capitalize">
                                                    {chart.chartType}
                                                </span>
                                                <span className="text-xs text-th-text-muted">
                                                    Confidence: {(chart.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Pipeline Stats */}
                    {result.pipelineStats && (
                        <motion.div variants={itemVariants}>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-[#7A8B5B]" />
                                <span className="text-xs text-th-text-muted">
                                    Pipeline completed in {(result.pipelineStats.processingTimeMs / 1000).toFixed(1)}s
                                    — {result.pipelineStats.sampledRows.toLocaleString()} rows analyzed
                                    {result.pipelineStats.llmUsed && ' • LLM enhanced'}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Q&A Section */}
                    <motion.div variants={itemVariants}>
                        <QASection askQuestion={askQuestion} />
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}

export default AIAnalyticsPage;
