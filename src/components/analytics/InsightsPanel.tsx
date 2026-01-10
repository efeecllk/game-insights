/**
 * InsightsPanel Component - Obsidian Analytics Design
 *
 * Premium AI insights panel with:
 * - Glassmorphism containers
 * - Color-coded insight cards
 * - Animated tab transitions
 * - Interactive Q&A interface
 */

import { useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Info,
    Send,
    Loader2,
    MessageCircle,
    Sparkles,
} from 'lucide-react';
import { Insight } from '../../ai/InsightGenerator';
import { Anomaly } from '../../ai/AnomalyDetector';
import { QuestionResult } from '../../ai/QuestionAnswering';
import { GameCategory } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface InsightsPanelProps {
    insights: Insight[];
    anomalies?: Anomaly[];
    gameType: GameCategory;
    suggestedQuestions?: string[];
    onAskQuestion: (question: string) => Promise<QuestionResult | null>;
    className?: string;
}

type InsightType = Insight['type'];

// ============================================================================
// Insight Styles
// ============================================================================

const INSIGHT_STYLES: Record<InsightType, {
    icon: React.ElementType;
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
}> = {
    positive: {
        icon: TrendingUp,
        bg: 'from-[#DA7756]/10 to-[#DA7756]/5',
        border: 'border-[#DA7756]/20',
        iconBg: 'bg-[#DA7756]/10',
        iconColor: 'text-[#DA7756]',
    },
    negative: {
        icon: TrendingDown,
        bg: 'from-[#E25C5C]/10 to-[#E25C5C]/5',
        border: 'border-[#E25C5C]/20',
        iconBg: 'bg-[#E25C5C]/10',
        iconColor: 'text-[#E25C5C]',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'from-[#E5A84B]/10 to-[#E5A84B]/5',
        border: 'border-[#E5A84B]/20',
        iconBg: 'bg-[#E5A84B]/10',
        iconColor: 'text-[#E5A84B]',
    },
    opportunity: {
        icon: Lightbulb,
        bg: 'from-[#C15F3C]/10 to-[#C15F3C]/5',
        border: 'border-[#C15F3C]/20',
        iconBg: 'bg-[#C15F3C]/10',
        iconColor: 'text-[#C15F3C]',
    },
    neutral: {
        icon: Info,
        bg: 'from-[#8F8B82]/10 to-[#8F8B82]/5',
        border: 'border-[#8F8B82]/20',
        iconBg: 'bg-[#8F8B82]/10',
        iconColor: 'text-[#8F8B82]',
    },
};

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
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// ============================================================================
// Insight Card Component
// ============================================================================

const InsightCard = memo(function InsightCard({ insight, index }: { insight: Insight; index: number }) {
    const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.neutral;
    const Icon = style.icon;

    // Business impact badge colors
    const impactColors = {
        high: 'bg-[#E25C5C]/10 text-[#E25C5C] border-[#E25C5C]/20',
        medium: 'bg-[#E5A84B]/10 text-[#E5A84B] border-[#E5A84B]/20',
        low: 'bg-[#8F8B82]/10 text-[#8F8B82] border-[#8F8B82]/20',
    };

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    };

    return (
        <motion.div
            variants={itemVariants}
            custom={index}
            className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-xl p-4 hover:border-slate-600 transition-all`}
        >
            <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${style.iconBg} border ${style.border} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    {/* Header with badges */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-white">{insight.title}</h4>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {insight.businessImpact && (
                                <span className={`px-1.5 py-0.5 text-[10px] uppercase font-semibold rounded border ${impactColors[insight.businessImpact]}`}>
                                    {insight.businessImpact}
                                </span>
                            )}
                            {insight.source === 'llm' && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-[#C15F3C]/10 text-[#C15F3C] border border-[#C15F3C]/20 rounded font-medium">
                                    AI
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{insight.description}</p>

                    {/* Recommendation */}
                    {insight.recommendation && (
                        <div className="mt-2 p-2 bg-white/[0.03] border border-slate-700/50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Recommendation</p>
                            <p className="text-sm text-slate-300">{insight.recommendation}</p>
                        </div>
                    )}

                    {/* Revenue Impact */}
                    {insight.revenueImpact && insight.revenueImpact.estimatedValue > 0 && (
                        <div className="mt-2 p-2 bg-[#7A8B5B]/10 border border-[#7A8B5B]/20 rounded-lg">
                            <p className="text-xs text-[#7A8B5B] uppercase tracking-wide mb-0.5">Potential Revenue Impact</p>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-semibold text-[#7A8B5B]">
                                    {formatCurrency(insight.revenueImpact.estimatedValue)}
                                </span>
                                <span className="text-xs text-slate-400">
                                    /{insight.revenueImpact.timeframe}
                                </span>
                                {insight.revenueImpact.estimatedPercentage > 0 && (
                                    <span className="text-xs text-[#7A8B5B]">
                                        (+{insight.revenueImpact.estimatedPercentage.toFixed(1)}%)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metric value and confidence */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {insight.value !== undefined && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/[0.05] border border-slate-700 rounded-lg text-xs font-medium text-white">
                                {insight.metric}: {typeof insight.value === 'number' ? insight.value.toFixed(1) : String(insight.value)}
                            </span>
                        )}
                        {insight.confidence !== undefined && insight.confidence > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/[0.03] border border-slate-800 rounded-lg text-xs text-slate-400">
                                {Math.round(insight.confidence * 100)}% confidence
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

// ============================================================================
// Anomaly Card Component
// ============================================================================

const AnomalyCard = memo(function AnomalyCard({ anomaly, index }: { anomaly: Anomaly; index: number }) {
    const severityStyles = {
        critical: {
            bg: 'from-[#E25C5C]/10 to-[#E25C5C]/5',
            border: 'border-[#E25C5C]/30',
            badge: 'bg-[#E25C5C]/20 text-[#E25C5C] border-[#E25C5C]/30',
        },
        high: {
            bg: 'from-orange-500/10 to-orange-500/5',
            border: 'border-orange-500/30',
            badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        },
        medium: {
            bg: 'from-[#E5A84B]/10 to-[#E5A84B]/5',
            border: 'border-[#E5A84B]/30',
            badge: 'bg-[#E5A84B]/20 text-[#E5A84B] border-[#E5A84B]/30',
        },
        low: {
            bg: 'from-[#8F8B82]/10 to-[#8F8B82]/5',
            border: 'border-[#8F8B82]/30',
            badge: 'bg-[#8F8B82]/20 text-[#8F8B82] border-[#8F8B82]/30',
        },
    };

    const style = severityStyles[anomaly.severity];

    return (
        <motion.div
            variants={itemVariants}
            custom={index}
            className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-xl p-4`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#E5A84B]" />
                    <span className="font-medium text-white">{anomaly.metric}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${style.badge}`}>
                    {anomaly.severity}
                </span>
            </div>
            <p className="text-sm text-slate-300">{anomaly.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span className="px-2 py-1 bg-white/[0.03] rounded-lg border border-slate-800">
                    Value: {typeof anomaly.value === 'number' ? anomaly.value.toFixed(2) : anomaly.value}
                </span>
                <span className="px-2 py-1 bg-white/[0.03] rounded-lg border border-slate-800">
                    Expected: ~{anomaly.expectedValue.toFixed(2)}
                </span>
                <span className={`px-2 py-1 rounded-lg border ${
                    anomaly.percentChange > 0
                        ? 'bg-[#DA7756]/10 border-[#DA7756]/20 text-[#DA7756]'
                        : 'bg-[#E25C5C]/10 border-[#E25C5C]/20 text-[#E25C5C]'
                }`}>
                    {anomaly.percentChange > 0 ? '+' : ''}{anomaly.percentChange.toFixed(1)}%
                </span>
            </div>
        </motion.div>
    );
});

// ============================================================================
// Main Component
// ============================================================================

export const InsightsPanel = memo(function InsightsPanel({
    insights,
    anomalies,
    suggestedQuestions,
    onAskQuestion,
    className,
}: InsightsPanelProps) {
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [qaResult, setQaResult] = useState<QuestionResult | null>(null);
    const [activeTab, setActiveTab] = useState<'insights' | 'anomalies' | 'qa'>('insights');

    const handleAsk = useCallback(async () => {
        if (!question.trim() || isAsking) return;

        setIsAsking(true);
        try {
            const result = await onAskQuestion(question.trim());
            setQaResult(result);
            setQuestion('');
        } finally {
            setIsAsking(false);
        }
    }, [question, isAsking, onAskQuestion]);

    const handleSuggestedQuestion = useCallback((q: string) => {
        setQuestion(q);
    }, []);

    // Memoize expensive computations
    const sortedInsights = useMemo(
        () => [...insights].sort((a, b) => (b.priority || 0) - (a.priority || 0)),
        [insights]
    );

    const criticalAnomalies = useMemo(
        () => anomalies?.filter(a => a.severity === 'critical' || a.severity === 'high') || [],
        [anomalies]
    );

    const tabs = [
        { id: 'insights' as const, label: 'Insights', icon: Sparkles, count: insights.length },
        ...(anomalies && anomalies.length > 0
            ? [{ id: 'anomalies' as const, label: 'Anomalies', icon: AlertTriangle, count: anomalies.length, critical: criticalAnomalies.length }]
            : []),
        { id: 'qa' as const, label: 'Ask AI', icon: MessageCircle },
    ];

    return (
        <div className={`bg-slate-900  rounded-2xl border border-slate-800 overflow-hidden ${className ?? ''}`}>
            {/* Header with Tabs */}
            <div className="border-b border-slate-800 px-4">
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative py-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                                    isActive
                                        ? 'text-[#DA7756]'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                                        isActive
                                            ? 'bg-[#DA7756]/20 text-[#DA7756]'
                                            : 'bg-white/[0.05] text-slate-400'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                                {'critical' in tab && typeof tab.critical === 'number' && tab.critical > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#E25C5C]/20 text-[#E25C5C] rounded-full">
                                        {tab.critical}
                                    </span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DA7756]"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'insights' && (
                        <motion.div
                            key="insights"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            {sortedInsights.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-[#C15F3C]/10 border border-[#C15F3C]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Sparkles className="w-6 h-6 text-[#C15F3C]" />
                                    </div>
                                    <p className="text-slate-400">
                                        No insights generated yet. Try uploading more data.
                                    </p>
                                </div>
                            ) : (
                                sortedInsights.slice(0, 5).map((insight, index) => (
                                    <InsightCard key={insight.id || index} insight={insight} index={index} />
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'anomalies' && (
                        <motion.div
                            key="anomalies"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            {!anomalies || anomalies.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <AlertTriangle className="w-6 h-6 text-[#DA7756]" />
                                    </div>
                                    <p className="text-slate-400">
                                        No anomalies detected in your data.
                                    </p>
                                </div>
                            ) : (
                                anomalies.slice(0, 5).map((anomaly, index) => (
                                    <AnomalyCard key={index} anomaly={anomaly} index={index} />
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'qa' && (
                        <motion.div
                            key="qa"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* Q&A Result */}
                            {qaResult && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-[#C15F3C]/10 to-[#C15F3C]/5 border border-[#C15F3C]/20 rounded-xl p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-[#C15F3C] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">{qaResult.question.text}</p>
                                            <p className="text-white">{qaResult.answer.text}</p>
                                            {qaResult.answer.value !== undefined && (
                                                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-[#C15F3C]/10 border border-[#C15F3C]/20 rounded-lg text-sm font-medium text-[#C15F3C]">
                                                    {String(qaResult.answer.value)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Question Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                    placeholder="Ask a question about your data..."
                                    className="flex-1 px-4 py-3 bg-white/[0.03] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                                    disabled={isAsking}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAsk}
                                    disabled={!question.trim() || isAsking}
                                    className="px-4 py-3 bg-[#DA7756] hover:bg-[#C15F3C] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isAsking ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </motion.button>
                            </div>

                            {/* Suggested Questions */}
                            {suggestedQuestions && suggestedQuestions.length > 0 && (
                                <div>
                                    <p className="text-sm text-slate-400 mb-2">Try asking:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedQuestions.slice(0, 4).map((q, index) => (
                                            <motion.button
                                                key={index}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleSuggestedQuestion(q)}
                                                className="px-3 py-1.5 text-sm bg-white/[0.03] border border-slate-700 text-slate-300 rounded-full hover:bg-white/[0.06] hover:border-slate-600 transition-all"
                                            >
                                                {q}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

export default InsightsPanel;
