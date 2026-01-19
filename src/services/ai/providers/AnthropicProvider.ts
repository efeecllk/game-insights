/**
 * AnthropicProvider - Direct HTTP implementation for browser compatibility
 *
 * Uses fetch API directly to avoid SDK compatibility issues in the browser.
 */

import { BaseAIProvider, type GenerateOptions } from './BaseProvider';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider extends BaseAIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string, model: string = 'claude-3-haiku-20240307') {
    super('anthropic', model);
    this.apiKey = apiKey;
  }

  // AnthropicProvider doesn't use LangChain, so getChatModel returns null
  getChatModel(): null {
    return null;
  }

  /**
   * Generate text using the Anthropic API directly
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: AnthropicMessage[] = [{ role: 'user', content: prompt }];

    const response = await this.makeRequest(messages, options);
    return response.content[0]?.text || '';
  }

  /**
   * Generate streaming text
   */
  async *generateStream(
    prompt: string,
    options?: GenerateOptions & { onToken?: (token: string) => void }
  ): AsyncGenerator<string, void, unknown> {
    const messages: AnthropicMessage[] = [{ role: 'user', content: prompt }];

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: options?.systemPrompt || '',
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const token = parsed.delta.text;
              options?.onToken?.(token);
              yield token;
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T>(prompt: string, options?: GenerateOptions): Promise<T> {
    const jsonPrompt = `${prompt}

IMPORTANT: You must respond with valid JSON only. No markdown, no explanation, just the JSON object.`;

    const response = await this.generate(jsonPrompt, {
      ...options,
      systemPrompt: `${options?.systemPrompt || ''}

You are a JSON generation assistant. Always respond with valid JSON only. No markdown code blocks, no explanation - just the raw JSON object or array.`,
    });

    // Clean up response - remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', cleaned);
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }

  /**
   * Test the connection to Anthropic
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generate('Say "connected" in one word.');
      this._isConnected = !!response;
      this.lastError = undefined;
      return this._isConnected;
    } catch (error) {
      this._isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  /**
   * Update the model being used
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Update configuration (no-op for direct HTTP implementation)
   */
  configure(_options: { temperature?: number; maxTokens?: number }): void {
    // Configuration is passed per-request in this implementation
  }

  /**
   * Make a request to the Anthropic API
   */
  private async makeRequest(
    messages: AnthropicMessage[],
    options?: GenerateOptions
  ): Promise<AnthropicResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: options?.systemPrompt || '',
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    return response.json();
  }
}
