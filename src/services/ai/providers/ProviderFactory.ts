import type { AIProvider, AIConfig } from '../types';
import type { BaseAIProvider } from './BaseProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OllamaProvider } from './OllamaProvider';

/**
 * Factory for creating AI providers based on configuration
 */
export class ProviderFactory {
  /**
   * Create a provider instance based on the provider type and configuration
   */
  static create(config: AIConfig): BaseAIProvider {
    const { provider, apiKeys, models, ollamaEndpoint } = config;

    switch (provider) {
      case 'openai': {
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key is required');
        }
        return new OpenAIProvider(apiKeys.openai, models.openai);
      }

      case 'anthropic': {
        if (!apiKeys.anthropic) {
          throw new Error('Anthropic API key is required');
        }
        return new AnthropicProvider(apiKeys.anthropic, models.anthropic);
      }

      case 'ollama': {
        return new OllamaProvider(ollamaEndpoint, models.ollama);
      }

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Create a specific provider type
   */
  static createProvider(
    type: AIProvider,
    apiKey: string | undefined,
    model: string,
    endpoint?: string
  ): BaseAIProvider {
    switch (type) {
      case 'openai': {
        if (!apiKey) {
          throw new Error('OpenAI API key is required');
        }
        return new OpenAIProvider(apiKey, model);
      }

      case 'anthropic': {
        if (!apiKey) {
          throw new Error('Anthropic API key is required');
        }
        return new AnthropicProvider(apiKey, model);
      }

      case 'ollama': {
        return new OllamaProvider(endpoint || 'http://localhost:11434', model);
      }

      default:
        throw new Error(`Unknown provider: ${type}`);
    }
  }

  /**
   * Check if a provider can be created with the given configuration
   */
  static canCreate(config: AIConfig): boolean {
    const { provider, apiKeys } = config;

    switch (provider) {
      case 'openai':
        return !!apiKeys.openai;
      case 'anthropic':
        return !!apiKeys.anthropic;
      case 'ollama':
        return true; // Ollama doesn't require API key
      default:
        return false;
    }
  }

  /**
   * Get the required credentials for a provider
   */
  static getRequirements(provider: AIProvider): string[] {
    switch (provider) {
      case 'openai':
        return ['OpenAI API Key'];
      case 'anthropic':
        return ['Anthropic API Key'];
      case 'ollama':
        return ['Ollama Server Running'];
      default:
        return [];
    }
  }
}
