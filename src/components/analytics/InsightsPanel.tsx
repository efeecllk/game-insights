/**
 * InsightsPanel Component - Obsidian Analytics Design
 *
 * Premium AI insights panel with:
 * - Glassmorphism containers
 * - Color-coded insight cards
 * - Animated tab transitions
 * - Interactive Q&A interface
 */

import { useState } from 'react';
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
        bg: 'from-rose-500/10 to-rose-500/5',
        border: 'border-rose-500/20',
        iconBg: 'bg-rose-500/10',
        iconColor: 'text-rose-400',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'from-amber-500/10 to-amber-500/5',
        border: 'border-amber-500/20',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
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

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
    const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.neutral;
    const Icon = style.icon;

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
                    <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{insight.description}</p>
                    {insight.recommendation && (
                        <p className="text-sm text-slate-400 mt-2 italic">
                            Recommendation: {insight.recommendation}
                        </p>
                    )}
                    {insight.value !== undefined && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] border border-slate-700 rounded-lg text-sm font-medium text-white">
                            {insight.metric}: {String(insight.value)}
                        </div>
                    )}
                </div>
                {insight.source === 'llm' && (
                    <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-[#C15F3C]/10 text-[#C15F3C] border border-[#C15F3C]/20 rounded-full font-medium">
                        AI
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// ============================================================================
// Anomaly Card Component
// ============================================================================

function AnomalyCard({ anomaly, index }: { anomaly: Anomaly; index: number }) {
    const severityStyles = {
        critical: {
            bg: 'from-rose-500/10 to-rose-500/5',
            border: 'border-rose-500/30',
            badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        },
        high: {
            bg: 'from-orange-500/10 to-orange-500/5',
            border: 'border-orange-500/30',
            badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        },
        medium: {
            bg: 'from-amber-500/10 to-amber-500/5',
            border: 'border-amber-500/30',
            badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
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
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
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
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                    {anomaly.percentChange > 0 ? '+' : ''}{anomaly.percentChange.toFixed(1)}%
                </span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function InsightsPanel({
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

    const handleAsk = async () => {
        if (!question.trim() || isAsking) return;

        setIsAsking(true);
        try {
            const result = await onAskQuestion(question.trim());
            setQaResult(result);
            setQuestion('');
        } finally {
            setIsAsking(false);
        }
    };

    const handleSuggestedQuestion = (q: string) => {
        setQuestion(q);
    };

    const sortedInsights = [...insights].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const criticalAnomalies = anomalies?.filter(a => a.severity === 'critical' || a.severity === 'high') || [];

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
                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-rose-500/20 text-rose-400 rounded-full">
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
}

export default InsightsPanel;
