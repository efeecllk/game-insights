/**
 * LLM Service
 * Main service for LLM-powered analytics features
 */

import { OpenAIProvider } from './providers/OpenAIProvider';
import {
    LLMConfig,
    InsightContext,
    LLMInsight,
    InsightGenerationResult,
    QAContext,
    QAResponse,
    CompletionResponse,
    LLMError,
    LLMErrorCode,
} from './types';
import {
    INSIGHT_SYSTEM_PROMPT,
    buildInsightUserPrompt,
    validateInsightResponse,
} from './prompts/insightPrompts';
import {
    QA_SYSTEM_PROMPT,
    buildQAUserPrompt,
    validateQAResponse,
    SUGGESTED_QUESTIONS,
} from './prompts/qaPrompts';
import { GameCategory } from '../../types';

// ============ CACHE IMPLEMENTATION ============

interface CacheEntry {
    response: string;
    timestamp: number;
    tokens: number;
}

class ResponseCache {
    private cache = new Map<string, CacheEntry>();
    private ttlMs: number;

    constructor(ttlMs: number = 30 * 60 * 1000) { // 30 minutes default
        this.ttlMs = ttlMs;
    }

    private hash(input: string): string {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    get(key: string): string | null {
        const hash = this.hash(key);
        const entry = this.cache.get(hash);

        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(hash);
            return null;
        }

        return entry.response;
    }

    set(key: string, response: string, tokens: number): void {
        const hash = this.hash(key);
        this.cache.set(hash, {
            response,
            timestamp: Date.now(),
            tokens,
        });
    }

    clear(): void {
        this.cache.clear();
    }

    getStats(): { entries: number; totalTokens: number } {
        let totalTokens = 0;
        for (const entry of this.cache.values()) {
            totalTokens += entry.tokens;
        }
        return {
            entries: this.cache.size,
            totalTokens,
        };
    }
}

// ============ RATE LIMITER ============

class RateLimiter {
    private requests: number[] = [];
    private maxPerMinute: number;

    constructor(maxPerMinute: number = 20) {
        this.maxPerMinute = maxPerMinute;
    }

    async acquire(): Promise<void> {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        this.requests = this.requests.filter(t => t > oneMinuteAgo);

        if (this.requests.length >= this.maxPerMinute) {
            const oldestRequest = this.requests[0];
            const waitTime = oldestRequest + 60000 - now;

            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.acquire();
            }
        }

        this.requests.push(now);
    }

    canProceed(): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        this.requests = this.requests.filter(t => t > oneMinuteAgo);
        return this.requests.length < this.maxPerMinute;
    }

    getStatus(): { remaining: number; resetsIn: number } {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        this.requests = this.requests.filter(t => t > oneMinuteAgo);

        return {
            remaining: this.maxPerMinute - this.requests.length,
            resetsIn: this.requests.length > 0
                ? Math.max(0, this.requests[0] + 60000 - now)
                : 0,
        };
    }
}

// ============ LLM SERVICE ============

export class LLMService {
    private provider: OpenAIProvider;
    private cache: ResponseCache;
    private rateLimiter: RateLimiter;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;

        // Initialize provider
        this.provider = new OpenAIProvider({
            apiKey: config.apiKey,
            model: config.model,
        });

        // Initialize cache
        this.cache = new ResponseCache(config.cacheTTLMs);

        // Initialize rate limiter
        this.rateLimiter = new RateLimiter(config.rateLimitPerMinute);
    }

    /**
     * Check if service is ready
     */
    async isAvailable(): Promise<boolean> {
        return this.provider.isAvailable();
    }

    /**
     * Generate insights from data context
     */
    async generateInsights(context: InsightContext): Promise<InsightGenerationResult> {
        const userPrompt = buildInsightUserPrompt(context);

        // Check cache
        if (this.config.cacheEnabled !== false) {
            const cached = this.cache.get(userPrompt);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const validated = validateInsightResponse(parsed);
                    if (validated) {
                        return {
                            insights: validated.insights.map(i => ({
                                ...i,
                                type: i.type as LLMInsight['type'],
                                category: i.category as LLMInsight['category'],
                            })),
                            summary: validated.summary,
                            topPriority: validated.topPriority,
                            generatedAt: new Date().toISOString(),
                            llmUsed: false, // Cached
                            tokensUsed: 0,
                        };
                    }
                } catch {
                    // Cache parse error, continue to LLM
                }
            }
        }

        // Rate limit check
        if (!this.rateLimiter.canProceed()) {
            await this.rateLimiter.acquire();
        }

        // Call LLM
        let response: CompletionResponse;
        try {
            response = await this.provider.complete({
                systemPrompt: INSIGHT_SYSTEM_PROMPT,
                userPrompt,
                temperature: 0.3,
                responseFormat: 'json',
                maxResponseTokens: 2000,
            });
        } catch (error) {
            if (error instanceof LLMError) throw error;
            throw new LLMError(
                'Failed to generate insights',
                LLMErrorCode.PROVIDER_ERROR,
                true
            );
        }

        // Parse response
        let parsed: unknown;
        try {
            parsed = JSON.parse(response.content);
        } catch {
            throw new LLMError(
                'Failed to parse LLM response as JSON',
                LLMErrorCode.PARSE_FAILED,
                true
            );
        }

        const validated = validateInsightResponse(parsed);
        if (!validated) {
            throw new LLMError(
                'LLM response did not match expected schema',
                LLMErrorCode.PARSE_FAILED,
                true
            );
        }

        // Cache successful response
        if (this.config.cacheEnabled !== false) {
            this.cache.set(userPrompt, response.content, response.usage.totalTokens);
        }

        return {
            insights: validated.insights.map(i => ({
                ...i,
                type: i.type as LLMInsight['type'],
                category: i.category as LLMInsight['category'],
            })),
            summary: validated.summary,
            topPriority: validated.topPriority,
            generatedAt: new Date().toISOString(),
            llmUsed: true,
            tokensUsed: response.usage.totalTokens,
        };
    }

    /**
     * Answer a question about the data
     */
    async answerQuestion(question: string, context: QAContext): Promise<QAResponse> {
        const userPrompt = buildQAUserPrompt(question, context);

        // Check cache
        if (this.config.cacheEnabled !== false) {
            const cached = this.cache.get(userPrompt);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const validated = validateQAResponse(parsed);
                    if (validated) {
                        return validated;
                    }
                } catch {
                    // Cache parse error, continue to LLM
                }
            }
        }

        // Rate limit check
        if (!this.rateLimiter.canProceed()) {
            await this.rateLimiter.acquire();
        }

        // Call LLM
        let response: CompletionResponse;
        try {
            response = await this.provider.complete({
                systemPrompt: QA_SYSTEM_PROMPT,
                userPrompt,
                temperature: 0.4,
                responseFormat: 'json',
                maxResponseTokens: 1500,
            });
        } catch (error) {
            if (error instanceof LLMError) throw error;
            throw new LLMError(
                'Failed to answer question',
                LLMErrorCode.PROVIDER_ERROR,
                true
            );
        }

        // Parse response
        let parsed: unknown;
        try {
            parsed = JSON.parse(response.content);
        } catch {
            throw new LLMError(
                'Failed to parse Q&A response as JSON',
                LLMErrorCode.PARSE_FAILED,
                true
            );
        }

        const validated = validateQAResponse(parsed);
        if (!validated) {
            throw new LLMError(
                'Q&A response did not match expected schema',
                LLMErrorCode.PARSE_FAILED,
                true
            );
        }

        // Cache successful response
        if (this.config.cacheEnabled !== false) {
            this.cache.set(userPrompt, response.content, response.usage.totalTokens);
        }

        return validated;
    }

    /**
     * Get suggested questions for a game type
     */
    getSuggestedQuestions(gameType: GameCategory): string[] {
        return SUGGESTED_QUESTIONS[gameType] || SUGGESTED_QUESTIONS.custom;
    }

    /**
     * Get current rate limit status
     */
    getRateLimitStatus(): { remaining: number; resetsIn: number } {
        return this.rateLimiter.getStatus();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { entries: number; totalTokens: number } {
        return this.cache.getStats();
    }

    /**
     * Clear the response cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<LLMConfig>): void {
        if (config.apiKey) {
            this.provider = new OpenAIProvider({
                apiKey: config.apiKey,
                model: config.model || this.config.model,
            });
        }

        if (config.model) {
            this.provider.setModel(config.model);
        }

        if (config.cacheTTLMs !== undefined) {
            this.cache = new ResponseCache(config.cacheTTLMs);
        }

        if (config.rateLimitPerMinute !== undefined) {
            this.rateLimiter = new RateLimiter(config.rateLimitPerMinute);
        }

        this.config = { ...this.config, ...config };
    }
}

// ============ FACTORY ============

let llmServiceInstance: LLMService | null = null;

export function createLLMService(config: LLMConfig): LLMService {
    llmServiceInstance = new LLMService(config);
    return llmServiceInstance;
}

export function getLLMService(): LLMService | null {
    return llmServiceInstance;
}

export function hasLLMService(): boolean {
    return llmServiceInstance !== null;
}
