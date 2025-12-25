/**
 * Question Answering
 * Natural language interface for data exploration
 */

import { NormalizedData } from '../adapters/BaseAdapter';
import { ColumnMeaning } from './SchemaAnalyzer';
import { GameCategory } from '../types';
import {
    LLMService,
    getLLMService,
    QAContext,
} from '../services/llm';
import { detectQuestionType, SUGGESTED_QUESTIONS } from '../services/llm/prompts/qaPrompts';

// ============ TYPES ============

export interface Question {
    text: string;
    context?: {
        selectedColumns?: string[];
        timeRange?: { start: string; end: string };
        filters?: { column: string; operator: string; value: unknown }[];
    };
}

export interface Answer {
    text: string;
    value?: number | string;
    breakdown?: Record<string, number>;
    visualization?: {
        type: 'line' | 'bar' | 'pie' | 'table' | 'kpi';
        data: unknown;
    };
    confidence: number;
    suggestedFollowups: string[];
    source: 'llm' | 'computed' | 'cached';
}

export interface QuestionResult {
    question: Question;
    answer: Answer;
    executionTimeMs: number;
}

// ============ DIRECT ANSWER PATTERNS ============

interface DirectAnswerPattern {
    pattern: RegExp;
    compute: (
        data: NormalizedData,
        meanings: ColumnMeaning[],
        match: RegExpMatchArray
    ) => Answer | null;
}

const DIRECT_PATTERNS: DirectAnswerPattern[] = [
    // "how many users" / "total users" / "unique users"
    {
        pattern: /how many (users?|players?)/i,
        compute: (data, meanings) => {
            const userCol = meanings.find(m => m.semanticType === 'user_id')?.column;
            if (!userCol) return null;

            const uniqueUsers = new Set(data.rows.map(row => row[userCol])).size;
            return {
                text: `There are ${uniqueUsers.toLocaleString()} unique users in the dataset.`,
                value: uniqueUsers,
                confidence: 1,
                suggestedFollowups: [
                    'How many sessions did they have?',
                    'What is the retention rate?',
                    'How much revenue did they generate?',
                ],
                source: 'computed',
            };
        },
    },
    // "total revenue" / "how much revenue"
    {
        pattern: /total revenue|how much revenue/i,
        compute: (data, meanings) => {
            const revenueCol = meanings.find(m => m.semanticType === 'revenue')?.column;
            if (!revenueCol) return null;

            const total = data.rows.reduce((sum, row) => {
                const val = Number(row[revenueCol]);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);

            return {
                text: `Total revenue is $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
                value: total,
                confidence: 1,
                suggestedFollowups: [
                    'What is the ARPU?',
                    'How is revenue distributed by platform?',
                    'What is the revenue trend over time?',
                ],
                source: 'computed',
            };
        },
    },
    // "arpu" / "average revenue per user"
    {
        pattern: /arpu|average revenue per user/i,
        compute: (data, meanings) => {
            const revenueCol = meanings.find(m => m.semanticType === 'revenue')?.column;
            const userCol = meanings.find(m => m.semanticType === 'user_id')?.column;
            if (!revenueCol || !userCol) return null;

            const totalRevenue = data.rows.reduce((sum, row) => {
                const val = Number(row[revenueCol]);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
            const uniqueUsers = new Set(data.rows.map(row => row[userCol])).size;
            const arpu = uniqueUsers > 0 ? totalRevenue / uniqueUsers : 0;

            return {
                text: `Average Revenue Per User (ARPU) is $${arpu.toFixed(2)}.`,
                value: arpu,
                confidence: 1,
                suggestedFollowups: [
                    'What is the ARPPU (paying users only)?',
                    'How does ARPU compare by platform?',
                    'What is the conversion rate?',
                ],
                source: 'computed',
            };
        },
    },
    // "how many levels" / "max level"
    {
        pattern: /how many levels|max level|highest level/i,
        compute: (data, meanings) => {
            const levelCol = meanings.find(m => m.semanticType === 'level')?.column;
            if (!levelCol) return null;

            const levels = data.rows
                .map(row => Number(row[levelCol]))
                .filter(l => !isNaN(l) && l > 0);

            if (levels.length === 0) return null;

            const maxLevel = Math.max(...levels);

            return {
                text: `The highest level reached is ${maxLevel}.`,
                value: maxLevel,
                confidence: 1,
                suggestedFollowups: [
                    'What is the average level?',
                    'Where do players typically stop?',
                    'Which level has the highest drop-off?',
                ],
                source: 'computed',
            };
        },
    },
    // "average level"
    {
        pattern: /average level/i,
        compute: (data, meanings) => {
            const levelCol = meanings.find(m => m.semanticType === 'level')?.column;
            if (!levelCol) return null;

            const levels = data.rows
                .map(row => Number(row[levelCol]))
                .filter(l => !isNaN(l) && l > 0);

            if (levels.length === 0) return null;

            const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

            return {
                text: `The average level is ${avgLevel.toFixed(1)}.`,
                value: avgLevel,
                confidence: 1,
                suggestedFollowups: [
                    'What is the max level reached?',
                    'What is the level distribution?',
                ],
                source: 'computed',
            };
        },
    },
    // "row count" / "how many rows" / "data size"
    {
        pattern: /how many rows|row count|data size|how much data/i,
        compute: (data) => {
            return {
                text: `The dataset contains ${data.rows.length.toLocaleString()} rows.`,
                value: data.rows.length,
                confidence: 1,
                suggestedFollowups: [
                    'What columns are available?',
                    'What is the date range?',
                ],
                source: 'computed',
            };
        },
    },
];

// ============ QUESTION ANSWERING CLASS ============

export class QuestionAnswering {
    private llmService: LLMService | null = null;
    private questionHistory: Question[] = [];

    constructor(llmService?: LLMService) {
        this.llmService = llmService || null;
    }

    /**
     * Answer a question about the data
     */
    async ask(
        question: string,
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        gameType: GameCategory
    ): Promise<QuestionResult> {
        const startTime = Date.now();
        const questionObj: Question = { text: question };

        // Store in history
        this.questionHistory.push(questionObj);

        // Try direct computation first
        const directAnswer = this.tryDirectAnswer(question, data, columnMeanings);
        if (directAnswer) {
            return {
                question: questionObj,
                answer: directAnswer,
                executionTimeMs: Date.now() - startTime,
            };
        }

        // Use LLM for complex questions
        const llm = this.llmService || getLLMService();
        if (llm) {
            try {
                const context = this.buildQAContext(data, columnMeanings, gameType);
                const llmResponse = await llm.answerQuestion(question, context);

                // Execute query logic if provided
                let enhancedAnswer = llmResponse;
                if (llmResponse.queryLogic) {
                    const queryResult = this.executeQuery(llmResponse.queryLogic, data, columnMeanings);
                    if (queryResult !== null) {
                        enhancedAnswer = {
                            ...llmResponse,
                            dataPoints: [
                                ...llmResponse.dataPoints,
                                { label: 'Computed Result', value: String(queryResult) },
                            ],
                        };
                    }
                }

                return {
                    question: questionObj,
                    answer: {
                        text: enhancedAnswer.answer,
                        confidence: enhancedAnswer.confidence,
                        suggestedFollowups: enhancedAnswer.relatedQuestions,
                        source: 'llm',
                    },
                    executionTimeMs: Date.now() - startTime,
                };
            } catch (error) {
                console.error('LLM Q&A failed:', error);
            }
        }

        // Fallback: return helpful message
        return {
            question: questionObj,
            answer: {
                text: this.getFallbackAnswer(question, columnMeanings),
                confidence: 0,
                suggestedFollowups: this.getSuggestedQuestions(gameType),
                source: 'computed',
            },
            executionTimeMs: Date.now() - startTime,
        };
    }

    /**
     * Try to answer using direct computation
     */
    private tryDirectAnswer(
        question: string,
        data: NormalizedData,
        meanings: ColumnMeaning[]
    ): Answer | null {
        for (const { pattern, compute } of DIRECT_PATTERNS) {
            const match = question.match(pattern);
            if (match) {
                const answer = compute(data, meanings, match);
                if (answer) return answer;
            }
        }
        return null;
    }

    /**
     * Build context for LLM Q&A
     */
    private buildQAContext(
        data: NormalizedData,
        meanings: ColumnMeaning[],
        gameType: GameCategory
    ): QAContext {
        // Get date range
        const timestampCol = meanings.find(m => m.semanticType === 'timestamp')?.column;
        let dateRange: { start: string; end: string } | undefined;

        if (timestampCol) {
            const dates = data.rows
                .map(row => {
                    const val = row[timestampCol];
                    if (!val) return null;
                    const date = new Date(val as string | number);
                    return isNaN(date.getTime()) ? null : date;
                })
                .filter((d): d is Date => d !== null)
                .sort((a, b) => a.getTime() - b.getTime());

            if (dates.length > 0) {
                dateRange = {
                    start: dates[0].toISOString().split('T')[0],
                    end: dates[dates.length - 1].toISOString().split('T')[0],
                };
            }
        }

        // Get sample rows
        const sampleRows = data.rows.slice(0, 5);

        return {
            columns: meanings.map(m => ({
                name: m.column,
                semanticType: m.semanticType,
            })),
            sampleRows,
            rowCount: data.rows.length,
            dateRange,
            availableMetrics: meanings
                .filter(m => ['revenue', 'level', 'dau', 'retention_day', 'score'].includes(m.semanticType))
                .map(m => m.semanticType),
            gameType,
        };
    }

    /**
     * Execute query logic from LLM response
     */
    private executeQuery(
        queryLogic: {
            filters?: { column: string; operator: string; value: unknown }[];
            aggregations?: { column: string; function: 'sum' | 'avg' | 'count' | 'max' | 'min' }[];
            groupBy?: string[];
        },
        data: NormalizedData,
        _meanings: ColumnMeaning[]
    ): unknown {
        let rows = [...data.rows];

        // Apply filters
        if (queryLogic.filters) {
            for (const filter of queryLogic.filters) {
                rows = rows.filter(row => {
                    const val = row[filter.column];
                    switch (filter.operator) {
                        case '=':
                        case '==':
                            return val == filter.value;
                        case '!=':
                            return val != filter.value;
                        case '>':
                            return Number(val) > Number(filter.value);
                        case '<':
                            return Number(val) < Number(filter.value);
                        case '>=':
                            return Number(val) >= Number(filter.value);
                        case '<=':
                            return Number(val) <= Number(filter.value);
                        case 'contains':
                            return String(val).includes(String(filter.value));
                        default:
                            return true;
                    }
                });
            }
        }

        // Apply aggregations
        if (queryLogic.aggregations && queryLogic.aggregations.length > 0) {
            const agg = queryLogic.aggregations[0]; // Take first aggregation
            const values = rows.map(row => Number(row[agg.column])).filter(v => !isNaN(v));

            if (values.length === 0) return null;

            switch (agg.function) {
                case 'sum':
                    return values.reduce((a, b) => a + b, 0);
                case 'avg':
                    return values.reduce((a, b) => a + b, 0) / values.length;
                case 'count':
                    return values.length;
                case 'max':
                    return Math.max(...values);
                case 'min':
                    return Math.min(...values);
            }
        }

        return rows.length;
    }

    /**
     * Generate fallback answer when LLM is unavailable
     */
    private getFallbackAnswer(question: string, meanings: ColumnMeaning[]): string {
        const questionType = detectQuestionType(question);
        const availableTypes = meanings.map(m => m.semanticType);

        const suggestions = [];

        if (questionType === 'retention' && !availableTypes.includes('retention_day')) {
            suggestions.push('retention data (retention_day column)');
        }
        if (questionType === 'revenue' && !availableTypes.includes('revenue')) {
            suggestions.push('revenue data');
        }
        if (questionType === 'engagement' && !availableTypes.includes('user_id')) {
            suggestions.push('user identification data');
        }

        if (suggestions.length > 0) {
            return `I cannot answer this question because the dataset is missing ${suggestions.join(' and ')}. Try a different question or upload additional data.`;
        }

        return 'I need more context to answer this question. Try rephrasing or ask one of the suggested questions below.';
    }

    /**
     * Get suggested questions for game type
     */
    getSuggestedQuestions(gameType: GameCategory): string[] {
        return SUGGESTED_QUESTIONS[gameType] || SUGGESTED_QUESTIONS.custom;
    }

    /**
     * Get question history
     */
    getHistory(): Question[] {
        return [...this.questionHistory];
    }

    /**
     * Clear question history
     */
    clearHistory(): void {
        this.questionHistory = [];
    }

    /**
     * Set LLM service
     */
    setLLMService(service: LLMService | null): void {
        this.llmService = service;
    }
}

export const questionAnswering = new QuestionAnswering();
