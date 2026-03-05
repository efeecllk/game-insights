import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIProvider, ProviderStatus } from '../types';

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeoutMs?: number;
}

export interface StreamGenerateOptions extends GenerateOptions {
  onToken?: (token: string) => void;
}

/** Default timeout for non-streaming requests (30s) */
const DEFAULT_TIMEOUT_MS = 30_000;
/** Default timeout for streaming requests (60s) */
const DEFAULT_STREAM_TIMEOUT_MS = 60_000;
/** Max retries for transient failures */
const MAX_RETRIES = 2;
/** Retriable HTTP status codes */
const RETRIABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retriable (rate limit or transient server error)
 */
function isRetriableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message;
    // Check for HTTP status codes in error messages
    for (const code of RETRIABLE_STATUS_CODES) {
      if (msg.includes(String(code))) return true;
    }
    // Network errors
    if (msg.includes('fetch failed') || msg.includes('network') || msg.includes('ECONNRESET')) {
      return true;
    }
  }
  return false;
}

/**
 * Create an AbortSignal that times out after the given duration
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/**
 * Extract the first balanced JSON object from a string using bracket counting.
 * More reliable than greedy regex for LLM responses with surrounding text.
 */
function extractFirstJSONObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export { DEFAULT_TIMEOUT_MS, DEFAULT_STREAM_TIMEOUT_MS };

export abstract class BaseAIProvider {
  protected provider: AIProvider;
  protected model: string;
  protected _isConnected: boolean = false;
  protected lastError?: string;

  constructor(provider: AIProvider, model: string) {
    this.provider = provider;
    this.model = model;
  }

  /**
   * Get the underlying LangChain chat model (optional - some providers use direct HTTP)
   */
  abstract getChatModel(): BaseChatModel | null;

  /**
   * Test the connection to the provider
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Retry wrapper with exponential backoff for transient failures
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries && isRetriableError(error)) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000);
          console.warn(
            `[${this.provider}] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`,
            error instanceof Error ? error.message : error
          );
          await sleep(delayMs);
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  }

  /**
   * Create a fetch wrapper with timeout support
   */
  protected fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs?: number
  ): Promise<Response> {
    const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const signal = createTimeoutSignal(timeout);
    return fetch(url, { ...init, signal });
  }

  /**
   * Generate a text response
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const model = this.getChatModel();
    if (!model) {
      throw new Error('This provider does not support the default generate implementation');
    }
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (options?.systemPrompt) {
      messages.push({
        role: 'system' as const,
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: 'user' as const,
      content: prompt,
    });

    return this.withRetry(async () => {
      const response = await model.invoke(messages);
      return typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
    });
  }

  /**
   * Generate a streaming text response
   */
  async *generateStream(
    prompt: string,
    options?: StreamGenerateOptions
  ): AsyncGenerator<string, void, unknown> {
    const model = this.getChatModel();
    if (!model) {
      throw new Error('This provider does not support the default generateStream implementation');
    }
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (options?.systemPrompt) {
      messages.push({
        role: 'system' as const,
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: 'user' as const,
      content: prompt,
    });

    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      const content =
        typeof chunk.content === 'string' ? chunk.content : JSON.stringify(chunk.content);
      if (options?.onToken) {
        options.onToken(content);
      }
      yield content;
    }
  }

  /**
   * Generate a structured JSON response
   */
  async generateJSON<T>(prompt: string, options?: GenerateOptions): Promise<T> {
    const response = await this.generate(prompt, options);
    return BaseAIProvider.parseJSONResponse<T>(response);
  }

  /**
   * Parse a JSON response from an LLM, handling code blocks and nested objects.
   * Extracted as static so chains can reuse it.
   */
  static parseJSONResponse<T>(response: string): T {
    // 1. Try to extract from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim();

    try {
      return JSON.parse(jsonString) as T;
    } catch {
      // 2. Find the first balanced JSON object using bracket counting
      //    (avoids the old greedy regex that broke on multi-object responses)
      const extracted = extractFirstJSONObject(jsonString);
      if (extracted) {
        return JSON.parse(extracted) as T;
      }
      throw new Error(`Failed to parse JSON response: ${response.substring(0, 200)}...`);
    }
  }

  /**
   * Get the current provider status
   */
  async getStatus(): Promise<ProviderStatus> {
    const connected = await this.testConnection();
    return {
      provider: this.provider,
      connected,
      model: this.model,
      lastChecked: new Date().toISOString(),
      error: this.lastError,
    };
  }

  /**
   * Check if the provider is connected
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get the provider name
   */
  get providerName(): AIProvider {
    return this.provider;
  }

  /**
   * Get the model name
   */
  get modelName(): string {
    return this.model;
  }
}
