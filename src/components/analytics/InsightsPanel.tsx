/**
 * InsightsPanel Component
 * Displays AI insights and Q&A interface
 */

import { useState } from 'react';
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

interface InsightsPanelProps {
    insights: Insight[];
    anomalies?: Anomaly[];
    gameType: GameCategory;
    suggestedQuestions?: string[];
    onAskQuestion: (question: string) => Promise<QuestionResult | null>;
    className?: string;
}

type InsightType = Insight['type'];

const INSIGHT_STYLES: Record<InsightType, { icon: React.ElementType; bgColor: string; borderColor: string; iconColor: string }> = {
    positive: { icon: TrendingUp, bgColor: 'bg-green-50', borderColor: 'border-green-200', iconColor: 'text-green-600' },
    negative: { icon: TrendingDown, bgColor: 'bg-red-50', borderColor: 'border-red-200', iconColor: 'text-red-600' },
    warning: { icon: AlertTriangle, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', iconColor: 'text-amber-600' },
    opportunity: { icon: Lightbulb, bgColor: 'bg-violet-50', borderColor: 'border-violet-200', iconColor: 'text-violet-600' },
    neutral: { icon: Info, bgColor: 'bg-gray-50', borderColor: 'border-gray-200', iconColor: 'text-gray-600' },
};

function InsightCard({ insight }: { insight: Insight }) {
    const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.neutral;
    const Icon = style.icon;

    return (
        <div className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4`}>
            <div className="flex items-start gap-3">
                <div className={`${style.iconColor} mt-0.5`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                    {insight.recommendation && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                            Recommendation: {insight.recommendation}
                        </p>
                    )}
                    {insight.value !== undefined && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-sm font-medium text-gray-700">
                            {insight.metric}: {String(insight.value)}
                        </div>
                    )}
                </div>
                {insight.source === 'llm' && (
                    <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full">
                        AI
                    </span>
                )}
            </div>
        </div>
    );
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
    const severityColors = {
        critical: 'bg-red-100 border-red-300 text-red-800',
        high: 'bg-orange-100 border-orange-300 text-orange-800',
        medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
        low: 'bg-blue-100 border-blue-300 text-blue-800',
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-gray-900">{anomaly.metric}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${severityColors[anomaly.severity]}`}>
                    {anomaly.severity}
                </span>
            </div>
            <p className="text-sm text-gray-600">{anomaly.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Value: {typeof anomaly.value === 'number' ? anomaly.value.toFixed(2) : anomaly.value}</span>
                <span>Expected: ~{anomaly.expectedValue.toFixed(2)}</span>
                <span>Change: {anomaly.percentChange > 0 ? '+' : ''}{anomaly.percentChange.toFixed(1)}%</span>
            </div>
        </div>
    );
}

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

    return (
        <div className={`bg-white rounded-xl border border-gray-200 ${className ?? ''}`}>
            {/* Header with Tabs */}
            <div className="border-b border-gray-200 px-4">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'insights'
                                ? 'border-violet-600 text-violet-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        Insights ({insights.length})
                    </button>
                    {anomalies && anomalies.length > 0 && (
                        <button
                            onClick={() => setActiveTab('anomalies')}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'anomalies'
                                    ? 'border-violet-600 text-violet-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <AlertTriangle className="w-4 h-4 inline mr-2" />
                            Anomalies ({anomalies.length})
                            {criticalAnomalies.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                    {criticalAnomalies.length}
                                </span>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('qa')}
                        className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'qa'
                                ? 'border-violet-600 text-violet-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <MessageCircle className="w-4 h-4 inline mr-2" />
                        Ask AI
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {activeTab === 'insights' && (
                    <div className="space-y-3">
                        {sortedInsights.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No insights generated yet. Try uploading more data.
                            </p>
                        ) : (
                            sortedInsights.slice(0, 5).map((insight, index) => (
                                <InsightCard key={insight.id || index} insight={insight} />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'anomalies' && (
                    <div className="space-y-3">
                        {!anomalies || anomalies.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No anomalies detected in your data.
                            </p>
                        ) : (
                            anomalies.slice(0, 5).map((anomaly, index) => (
                                <AnomalyCard key={index} anomaly={anomaly} />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'qa' && (
                    <div className="space-y-4">
                        {/* Q&A Result */}
                        {qaResult && (
                            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">{qaResult.question.text}</p>
                                        <p className="text-gray-900">{qaResult.answer.text}</p>
                                        {qaResult.answer.value !== undefined && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-sm font-medium text-violet-700">
                                                {String(qaResult.answer.value)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Question Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                placeholder="Ask a question about your data..."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                disabled={isAsking}
                            />
                            <button
                                onClick={handleAsk}
                                disabled={!question.trim() || isAsking}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isAsking ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {/* Suggested Questions */}
                        {suggestedQuestions && suggestedQuestions.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Try asking:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedQuestions.slice(0, 4).map((q, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSuggestedQuestion(q)}
                                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InsightsPanel;
