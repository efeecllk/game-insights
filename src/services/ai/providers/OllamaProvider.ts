import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseAIProvider, type GenerateOptions, type StreamGenerateOptions } from './BaseProvider';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

interface OllamaStreamChunk {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Provider for local Ollama models
 * Uses direct HTTP calls instead of LangChain since Ollama has a simple API
 */
export class OllamaProvider extends BaseAIProvider {
  private endpoint: string;

  constructor(endpoint: string = 'http://localhost:11434', model: string = 'llama3') {
    super('ollama', model);
    this.endpoint = endpoint;
  }

  getChatModel(): BaseChatModel {
    // Ollama doesn't have a LangChain integration we want to use
    // We'll implement the methods directly
    throw new Error('OllamaProvider uses direct HTTP API, not LangChain model');
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { models: { name: string }[] };
      this._isConnected = Array.isArray(data.models);
      this.lastError = undefined;
      return this._isConnected;
    } catch (error) {
      this._isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Failed to connect to Ollama';
      return false;
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: OllamaMessage[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = (await response.json()) as OllamaResponse;
    return data.message.content;
  }

  async *generateStream(
    prompt: string,
    options?: StreamGenerateOptions
  ): AsyncGenerator<string, void, unknown> {
    const messages: OllamaMessage[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response stream');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as OllamaStreamChunk;
            const content = data.message.content;
            if (content) {
              if (options?.onToken) {
                options.onToken(content);
              }
              yield content;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Update the model being used
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Update the endpoint
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { models: { name: string }[] };
      return data.models.map((m) => m.name);
    } catch {
      return [];
    }
  }
}
