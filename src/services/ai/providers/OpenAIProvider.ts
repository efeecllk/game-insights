import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseAIProvider } from './BaseProvider';

export class OpenAIProvider extends BaseAIProvider {
  private chatModel: ChatOpenAI;
  private apiKey: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    super('openai', model);
    this.apiKey = apiKey;
    this.chatModel = new ChatOpenAI({
      apiKey: this.apiKey,
      model: this.model,
      temperature: 0.7,
    });
  }

  getChatModel(): BaseChatModel {
    return this.chatModel;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chatModel.invoke([
        { role: 'user', content: 'Say "connected" in one word.' },
      ]);
      this._isConnected = !!response.content;
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
    this.chatModel = new ChatOpenAI({
      apiKey: this.apiKey,
      model: this.model,
      temperature: 0.7,
    });
  }

  /**
   * Update configuration
   */
  configure(options: { temperature?: number; maxTokens?: number }): void {
    this.chatModel = new ChatOpenAI({
      apiKey: this.apiKey,
      model: this.model,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens,
    });
  }
}
