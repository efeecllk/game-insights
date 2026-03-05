import { AIConfig, AIProvider, DEFAULT_AI_CONFIG } from './types';

const AI_CONFIG_KEY = 'game-insights-ai-config';

/**
 * Read a VITE_ environment variable (returns undefined if unavailable).
 * Works in both Vite dev server and production builds.
 */
function envVar(name: string): string | undefined {
  try {
    // import.meta.env is injected by Vite at build time
    const value = (import.meta as unknown as { env?: Record<string, string> }).env?.[name];
    return value && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Load AI configuration from localStorage, with VITE_ env-var fallbacks
 * for API keys so developers can set keys in .env without manual UI config.
 */
export function loadAIConfig(): AIConfig {
  try {
    const stored = localStorage.getItem(AI_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AIConfig>;
      const config: AIConfig = {
        ...DEFAULT_AI_CONFIG,
        ...parsed,
        apiKeys: {
          ...DEFAULT_AI_CONFIG.apiKeys,
          ...parsed.apiKeys,
        },
        models: {
          ...DEFAULT_AI_CONFIG.models,
          ...parsed.models,
        },
        triggers: {
          ...DEFAULT_AI_CONFIG.triggers,
          ...parsed.triggers,
        },
      };

      // Fall back to VITE_ env vars when localStorage has no key stored
      if (!config.apiKeys.openai) {
        config.apiKeys.openai = envVar('VITE_OPENAI_API_KEY');
      }
      if (!config.apiKeys.anthropic) {
        config.apiKeys.anthropic = envVar('VITE_ANTHROPIC_API_KEY');
      }
      if (config.ollamaEndpoint === DEFAULT_AI_CONFIG.ollamaEndpoint) {
        config.ollamaEndpoint = envVar('VITE_OLLAMA_URL') ?? config.ollamaEndpoint;
      }

      return config;
    }
  } catch (error) {
    console.error('Failed to load AI config:', error);
  }

  // No stored config — build from defaults + env vars
  const config = { ...DEFAULT_AI_CONFIG };
  config.apiKeys = {
    openai: envVar('VITE_OPENAI_API_KEY'),
    anthropic: envVar('VITE_ANTHROPIC_API_KEY'),
  };
  config.ollamaEndpoint = envVar('VITE_OLLAMA_URL') ?? config.ollamaEndpoint;
  return config;
}

/**
 * Save AI configuration to localStorage
 */
export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save AI config:', error);
  }
}

/**
 * Update partial AI configuration
 */
export function updateAIConfig(updates: Partial<AIConfig>): AIConfig {
  const current = loadAIConfig();
  const updated: AIConfig = {
    ...current,
    ...updates,
    apiKeys: {
      ...current.apiKeys,
      ...updates.apiKeys,
    },
    models: {
      ...current.models,
      ...updates.models,
    },
    triggers: {
      ...current.triggers,
      ...updates.triggers,
    },
  };
  saveAIConfig(updated);
  return updated;
}

/**
 * Get the API key for a specific provider
 */
export function getApiKey(provider: AIProvider): string | undefined {
  const config = loadAIConfig();
  switch (provider) {
    case 'openai':
      return config.apiKeys.openai;
    case 'anthropic':
      return config.apiKeys.anthropic;
    case 'ollama':
      return undefined; // Ollama doesn't need API key
    default:
      return undefined;
  }
}

/**
 * Set the API key for a specific provider
 */
export function setApiKey(provider: AIProvider, key: string | undefined): void {
  const config = loadAIConfig();
  if (provider === 'openai') {
    config.apiKeys.openai = key;
  } else if (provider === 'anthropic') {
    config.apiKeys.anthropic = key;
  }
  saveAIConfig(config);
}

/**
 * Get the model for a specific provider
 */
export function getModel(provider: AIProvider): string {
  const config = loadAIConfig();
  return config.models[provider];
}

/**
 * Check if a provider is configured with required credentials
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  const config = loadAIConfig();
  switch (provider) {
    case 'openai':
      return !!config.apiKeys.openai;
    case 'anthropic':
      return !!config.apiKeys.anthropic;
    case 'ollama':
      return true; // Ollama just needs the endpoint
    default:
      return false;
  }
}

/**
 * Get list of available models for each provider
 */
export function getAvailableModels(provider: AIProvider): string[] {
  switch (provider) {
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
    case 'anthropic':
      return [
        'claude-sonnet-4-6',
        'claude-haiku-4-5-20251001',
        'claude-3-5-sonnet-20241022',
        'claude-3-haiku-20240307',
      ];
    case 'ollama':
      return ['llama3.1', 'llama3', 'mistral', 'mixtral', 'codellama', 'phi3'];
    default:
      return [];
  }
}

/**
 * Clear all AI configuration
 */
export function clearAIConfig(): void {
  localStorage.removeItem(AI_CONFIG_KEY);
}
