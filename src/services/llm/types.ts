/**
 * LLM Service Types
 * Core interfaces for LLM integration
 */

import { GameCategory } from '../../types';
import { ColumnMeaning } from '../../ai/SchemaAnalyzer';
import { CalculatedMetrics } from '../../ai/MetricCalculator';
import { Anomaly } from '../../ai/AnomalyDetector';

// ============ PROVIDER TYPES ============

export type LLMProvider = 'openai' | 'anthropic';

export interface LLMConfig {
    provider: LLMProvider;
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    cacheEnabled?: boolean;
    cacheTTLMs?: number;
    rateLimitPerMinute?: number;
}

export interface CompletionRequest {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxResponseTokens?: number;
    responseFormat?: 'json' | 'text';
}

export interface CompletionResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cached: boolean;
    model: string;
    durationMs: number;
}

// ============ INSIGHT TYPES ============

export interface InsightContext {
    gameType: GameCategory;
    columnMeanings: ColumnMeaning[];
    metrics?: CalculatedMetrics;
    anomalies?: Anomaly[];
    dataSnapshot: {
        totalUsers: number;
        totalRevenue: number;
        rowCount: number;
        dateRange?: { start: string; end: string };
    };
    aggregations?: Record<string, unknown>;
}

export interface LLMInsight {
    type: 'positive' | 'negative' | 'neutral' | 'warning' | 'opportunity';
    category: 'retention' | 'monetization' | 'engagement' | 'progression' | 'quality';
    title: string;
    description: string;
    metric?: string;
    value?: number | string;
    change?: number;
    priority: number; // 1-10
    recommendation?: string;
    confidence: number; // 0-1
    evidence?: string[];
}

export interface InsightGenerationResult {
    insights: LLMInsight[];
    summary: string;
    topPriority?: string;
    generatedAt: string;
    llmUsed: boolean;
    tokensUsed: number;
}

// ============ Q&A TYPES ============

export interface QAContext {
    columns: { name: string; semanticType: string }[];
    sampleRows: Record<string, unknown>[];
    rowCount: number;
    dateRange?: { start: string; end: string };
    availableMetrics: string[];
    gameType: GameCategory;
}

export interface QueryLogic {
    filters?: { column: string; operator: string; value: unknown }[];
    aggregations?: { column: string; function: 'sum' | 'avg' | 'count' | 'max' | 'min' }[];
    groupBy?: string[];
}

export interface QADataPoint {
    label: string;
    value: string;
    context?: string;
}

export interface QAResponse {
    answer: string;
    methodology?: string;
    queryLogic?: QueryLogic;
    dataPoints: QADataPoint[];
    confidence: number;
    relatedQuestions: string[];
    limitations?: string;
}

// ============ ERROR TYPES ============

export enum LLMErrorCode {
    API_KEY_INVALID = 'API_KEY_INVALID',
    API_KEY_MISSING = 'API_KEY_MISSING',
    RATE_LIMITED = 'RATE_LIMITED',
    TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
    PARSE_FAILED = 'PARSE_FAILED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    PROVIDER_ERROR = 'PROVIDER_ERROR',
    TIMEOUT = 'TIMEOUT',
}

export class LLMError extends Error {
    constructor(
        message: string,
        public code: LLMErrorCode,
        public recoverable: boolean = true
    ) {
        super(message);
        this.name = 'LLMError';
    }
}
