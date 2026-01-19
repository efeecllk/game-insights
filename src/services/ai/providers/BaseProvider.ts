import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIProvider, ProviderStatus } from '../types';

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface StreamGenerateOptions extends GenerateOptions {
  onToken?: (token: string) => void;
}

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
   * Generate a text response
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const model = this.getChatModel();
    if (!model) {
      throw new Error('This provider does not support the default generate implementation');
    }
    const messages = [];

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

    const response = await model.invoke(messages);
    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);
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
    const messages = [];

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

    // Try to extract JSON from the response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim();

    try {
      return JSON.parse(jsonString) as T;
    } catch {
      // Try to find JSON object in the response
      const objectMatch = jsonString.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]) as T;
      }
      throw new Error(`Failed to parse JSON response: ${response.substring(0, 100)}...`);
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
