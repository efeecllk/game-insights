/**
 * OpenAI Provider
 * Handles communication with OpenAI API
 */

import {
    CompletionRequest,
    CompletionResponse,
    LLMError,
    LLMErrorCode,
} from '../types';

export interface OpenAIProviderConfig {
    apiKey: string;
    model?: string;
    baseUrl?: string;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const API_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIProvider {
    readonly name = 'openai';
    readonly maxTokens = 128000; // GPT-4o context limit

    private apiKey: string;
    private model: string;
    private baseUrl: string;

    constructor(config: OpenAIProviderConfig) {
        if (!config.apiKey) {
            throw new LLMError('API key is required', LLMErrorCode.API_KEY_MISSING, false);
        }
        this.apiKey = config.apiKey;
        this.model = config.model || DEFAULT_MODEL;
        this.baseUrl = config.baseUrl || API_BASE_URL;
    }

    /**
     * Send a completion request to OpenAI
     */
    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: request.systemPrompt },
                        { role: 'user', content: request.userPrompt },
                    ],
                    temperature: request.temperature ?? 0.3,
                    max_tokens: request.maxResponseTokens ?? 2000,
                    response_format: request.responseFormat === 'json'
                        ? { type: 'json_object' }
                        : undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const errorMessage = error.error?.message || `HTTP ${response.status}`;

                if (response.status === 401) {
                    throw new LLMError(
                        'Invalid API key',
                        LLMErrorCode.API_KEY_INVALID,
                        false
                    );
                }

                if (response.status === 429) {
                    throw new LLMError(
                        'Rate limit exceeded',
                        LLMErrorCode.RATE_LIMITED,
                        true
                    );
                }

                throw new LLMError(
                    `OpenAI API error: ${errorMessage}`,
                    LLMErrorCode.PROVIDER_ERROR,
                    response.status >= 500
                );
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content;

            if (!content) {
                throw new LLMError(
                    'Empty response from OpenAI',
                    LLMErrorCode.PROVIDER_ERROR,
                    true
                );
            }

            return {
                content,
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0,
                },
                cached: false,
                model: data.model || this.model,
                durationMs: Date.now() - startTime,
            };
        } catch (error) {
            if (error instanceof LLMError) throw error;

            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new LLMError(
                    'Network error - check your connection',
                    LLMErrorCode.NETWORK_ERROR,
                    true
                );
            }

            throw new LLMError(
                `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
                LLMErrorCode.PROVIDER_ERROR,
                true
            );
        }
    }

    /**
     * Check if the API key is valid
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get current model name
     */
    getModel(): string {
        return this.model;
    }

    /**
     * Update model
     */
    setModel(model: string): void {
        this.model = model;
    }
}
