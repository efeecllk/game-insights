/**
 * Natural Language Query Interface - Obsidian Analytics Design
 *
 * AI-powered data queries with:
 * - Glassmorphism containers
 * - Animated query results
 * - Premium orange accents
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
    MessageSquare,
    Send,
    Sparkles,
    Download,
    Share2,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface QueryResult {
    id: string;
    query: string;
    timestamp: string;
    response: {
        type: 'text' | 'chart' | 'table' | 'mixed';
        summary: string;
        data?: unknown;
        chartType?: 'bar' | 'line' | 'pie' | 'area';
        confidence: number;
    };
    suggestions: string[];
}

// ============================================================================
// Mock Query Processor
// ============================================================================

async function processQuery(query: string): Promise<QueryResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const lowerQuery = query.toLowerCase();
    const id = `q_${Date.now()}`;

    // Mock responses based on query keywords
    if (lowerQuery.includes('revenue') && lowerQuery.includes('country')) {
        return {
            id,
            query,
            timestamp: new Date().toISOString(),
            response: {
                type: 'chart',
                summary: 'Here\'s the revenue breakdown by country for the last 30 days. The United States leads with 45% of total revenue, followed by the UK at 16%.',
                chartType: 'pie',
                data: [
                    { name: 'United States', value: 2450, color: '#DA7756' },
                    { name: 'United Kingdom', value: 890, color: '#C15F3C' },
                    { name: 'Germany', value: 670, color: '#A68B5B' },
                    { name: 'Japan', value: 520, color: '#E5A84B' },
                    { name: 'Others', value: 920, color: '#64748b' },
                ],
                confidence: 0.95,
            },
            suggestions: [
                'How does this compare to last month?',
                'Which country has the best conversion rate?',
                'Show revenue trend by country',
            ],
        };
    }

    if (lowerQuery.includes('retention') || lowerQuery.includes('d7') || lowerQuery.includes('d1')) {
        return {
            id,
            query,
            timestamp: new Date().toISOString(),
            response: {
                type: 'chart',
                summary: 'D7 retention is currently at 18.5%, which is 2.3% above your benchmark. The trend has been improving over the past 2 weeks.',
                chartType: 'line',
                data: {
                    dates: ['Dec 1', 'Dec 8', 'Dec 15', 'Dec 22', 'Dec 29'],
                    values: [16.2, 17.1, 17.8, 18.2, 18.5],
                },
                confidence: 0.92,
            },
            suggestions: [
                'What\'s driving the improvement?',
                'Compare retention by platform',
                'Show D1 vs D7 vs D30 retention',
            ],
        };
    }

    if (lowerQuery.includes('churn') || lowerQuery.includes('risk')) {
        return {
            id,
            query,
            timestamp: new Date().toISOString(),
            response: {
                type: 'mixed',
                summary: 'Currently 1,234 users (8.5%) are at high risk of churning in the next 7 days. Most at-risk users haven\'t played in 3+ days and have low session counts.',
                data: {
                    atRisk: 1234,
                    percentage: 8.5,
                    topReasons: [
                        'Inactive for 3+ days',
                        'Low session count',
                        'No purchases',
                        'Tutorial incomplete',
                    ],
                },
                confidence: 0.88,
            },
            suggestions: [
                'Who are the high-value at-risk users?',
                'What actions can reduce churn?',
                'Show churn by cohort',
            ],
        };
    }

    if (lowerQuery.includes('level') || lowerQuery.includes('stuck')) {
        return {
            id,
            query,
            timestamp: new Date().toISOString(),
            response: {
                type: 'chart',
                summary: 'Level 15 has the highest failure rate at 72%, followed by Level 23 (65%) and Level 31 (58%). Consider adding hints or adjusting difficulty.',
                chartType: 'bar',
                data: {
                    levels: ['Level 15', 'Level 23', 'Level 31', 'Level 42', 'Level 50'],
                    failRates: [72, 65, 58, 52, 48],
                },
                confidence: 0.94,
            },
            suggestions: [
                'How many users quit after failing Level 15?',
                'What\'s the average attempts per level?',
                'Show level progression funnel',
            ],
        };
    }

    // Default response
    return {
        id,
        query,
        timestamp: new Date().toISOString(),
        response: {
            type: 'text',
            summary: `I analyzed your data for "${query}". Based on the last 30 days, your key metrics show healthy trends. DAU is up 12% and revenue is growing steadily. Would you like me to dive deeper into any specific area?`,
            confidence: 0.75,
        },
        suggestions: [
            'Show me revenue trends',
            'What\'s my retention rate?',
            'Which levels have high churn?',
        ],
    };
}

// ============================================================================
// Natural Language Query Component
// ============================================================================

export function NaturalLanguageQuery() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<QueryResult[]>([]);
    const [showExamples, setShowExamples] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    const exampleQueries = [
        'What was revenue last week by country?',
        'Show me D7 retention trend',
        'Which level has the highest churn?',
        'How many users are at risk of churning?',
        'What\'s my conversion rate by platform?',
        'Compare whales vs dolphins',
    ];

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() || isLoading) return;

        setShowExamples(false);
        setIsLoading(true);

        try {
            const result = await processQuery(query);
            setResults(prev => [result, ...prev]);
            setQuery('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExampleClick = (example: string) => {
        setQuery(example);
        inputRef.current?.focus();
    };

    const handleSuggestionClick = async (suggestion: string) => {
        setQuery(suggestion);
        setIsLoading(true);
        try {
            const result = await processQuery(suggestion);
            setResults(prev => [result, ...prev]);
            setQuery('');
        } finally {
            setIsLoading(false);
        }
    };

    // Scroll to new results
    useEffect(() => {
        if (results.length > 0 && resultsRef.current) {
            resultsRef.current.scrollTop = 0;
        }
    }, [results]);

    return (
        <div className="bg-slate-900  rounded-2xl border border-slate-700 overflow-hidden h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-xl blur-lg" />
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/20 border border-[#DA7756]/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#DA7756]" />
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-white">Ask Game Insights</h3>
                    <p className="text-sm text-slate-400">Query your data in plain English</p>
                </div>
            </div>

            {/* Results Area */}
            <div ref={resultsRef} className="flex-1 overflow-y-auto p-6">
                {showExamples && results.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center"
                    >
                        <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
                        <h4 className="text-lg font-medium text-white mb-2">
                            Ask anything about your game
                        </h4>
                        <p className="text-sm text-slate-400 mb-6 max-w-md">
                            Try asking about revenue, retention, user behavior, or any metric you're curious about.
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-w-lg">
                            {exampleQueries.map((example) => (
                                <motion.button
                                    key={example}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleExampleClick(example)}
                                    className="flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-400 bg-white/[0.03] hover:bg-white/[0.06] border border-slate-800 rounded-xl transition-colors"
                                >
                                    <ChevronRight className="w-3 h-3 text-[#DA7756] flex-shrink-0" />
                                    <span className="truncate">{example}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 p-4 bg-white/[0.03] border border-slate-800 rounded-xl"
                                >
                                    <Loader2 className="w-5 h-5 text-[#DA7756] animate-spin" />
                                    <span className="text-sm text-slate-400">Analyzing your data...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {results.map((result) => (
                            <QueryResultCard
                                key={result.id}
                                result={result}
                                onSuggestionClick={handleSuggestionClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask a question about your game data..."
                            disabled={isLoading}
                            className="w-full pl-4 pr-12 py-3 bg-white/[0.03] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 disabled:opacity-50 transition-all"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={!query.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#DA7756] text-white rounded-lg hover:bg-[#C15F3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </form>
        </div>
    );
}

// ============================================================================
// Query Result Card
// ============================================================================

function QueryResultCard({
    result,
    onSuggestionClick,
}: {
    result: QueryResult;
    onSuggestionClick: (suggestion: string) => void;
}) {
    const time = new Date(result.timestamp);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Query */}
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-slate-800 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1">
                    <p className="text-white">{result.query}</p>
                    <span className="text-xs text-slate-500">
                        {time.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Response */}
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#DA7756]/20 border border-[#DA7756]/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#DA7756]" />
                </div>
                <div className="flex-1 space-y-3">
                    <p className="text-white">{result.response.summary}</p>

                    {/* Chart Visualization */}
                    {result.response.type === 'chart' && result.response.data !== undefined && (
                        <div className="bg-white/[0.02] border border-slate-800 rounded-xl p-4">
                            <ResultChart
                                type={result.response.chartType!}
                                data={result.response.data}
                            />
                        </div>
                    )}

                    {/* Mixed Content */}
                    {result.response.type === 'mixed' && result.response.data !== undefined && (
                        <MixedContent data={result.response.data as { atRisk: number; percentage: number; topReasons: string[] }} />
                    )}

                    {/* Confidence & Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500">
                                {Math.round(result.response.confidence * 100)}% confidence
                            </span>
                            <div className="flex items-center gap-1">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-1 hover:bg-white/[0.06] rounded transition-colors"
                                >
                                    <ThumbsUp className="w-3.5 h-3.5 text-slate-500 hover:text-[#DA7756]" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-1 hover:bg-white/[0.06] rounded transition-colors"
                                >
                                    <ThumbsDown className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400" />
                                </motion.button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4 text-slate-500" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
                            >
                                <Share2 className="w-4 h-4 text-slate-500" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Suggestions */}
                    {result.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {result.suggestions.map((suggestion) => (
                                <motion.button
                                    key={suggestion}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSuggestionClick(suggestion)}
                                    className="px-3 py-1.5 text-xs text-slate-400 bg-white/[0.03] hover:bg-white/[0.06] border border-slate-800 rounded-full transition-colors"
                                >
                                    {suggestion}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Result Chart Component
// ============================================================================

function ResultChart({ type, data }: { type: 'bar' | 'line' | 'pie' | 'area'; data: unknown }) {
    const option = (() => {
        if (type === 'pie' && Array.isArray(data)) {
            return {
                tooltip: { trigger: 'item', formatter: '{b}: ${c} ({d}%)' },
                series: [{
                    type: 'pie',
                    radius: ['40%', '65%'],
                    data: (data as { name: string; value: number; color: string }[]).map(d => ({
                        name: d.name,
                        value: d.value,
                        itemStyle: { color: d.color },
                    })),
                    label: { color: '#94a3b8', fontSize: 11 },
                }],
            };
        }

        if (type === 'line' && typeof data === 'object' && data !== null) {
            const d = data as { dates: string[]; values: number[] };
            return {
                tooltip: { trigger: 'axis' },
                grid: { left: 40, right: 20, top: 20, bottom: 30 },
                xAxis: {
                    type: 'category',
                    data: d.dates,
                    axisLabel: { color: '#64748b', fontSize: 10 },
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { color: '#64748b', formatter: '{value}%' },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
                },
                series: [{
                    type: 'line',
                    data: d.values,
                    smooth: true,
                    areaStyle: { color: 'rgba(218, 119, 86, 0.1)' },
                    lineStyle: { color: '#DA7756' },
                    itemStyle: { color: '#DA7756' },
                }],
            };
        }

        if (type === 'bar' && typeof data === 'object' && data !== null) {
            const d = data as { levels: string[]; failRates: number[] };
            return {
                tooltip: { trigger: 'axis' },
                grid: { left: 50, right: 20, top: 20, bottom: 30 },
                xAxis: {
                    type: 'category',
                    data: d.levels,
                    axisLabel: { color: '#64748b', fontSize: 10 },
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { color: '#64748b', formatter: '{value}%' },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
                },
                series: [{
                    type: 'bar',
                    data: d.failRates.map((v) => ({
                        value: v,
                        itemStyle: { color: v > 60 ? '#f43f5e' : v > 50 ? '#f59e0b' : '#DA7756' },
                    })),
                    barWidth: '50%',
                }],
            };
        }

        return {};
    })();

    return <ReactECharts option={option} style={{ height: 200 }} />;
}

// ============================================================================
// Mixed Content Component
// ============================================================================

function MixedContent({ data }: { data: { atRisk: number; percentage: number; topReasons: string[] } }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-rose-500/20 rounded-xl p-4">
                <div className="text-3xl font-bold text-rose-400">{data.atRisk.toLocaleString()}</div>
                <div className="text-sm text-slate-400">Users at Risk</div>
                <div className="text-xs text-rose-400 mt-1">{data.percentage}% of active users</div>
            </div>
            <div className="bg-white/[0.02] border border-slate-800 rounded-xl p-4">
                <div className="text-sm font-medium text-white mb-2">Top Risk Factors</div>
                <ul className="space-y-1">
                    {data.topReasons.map((reason, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            {reason}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default NaturalLanguageQuery;
