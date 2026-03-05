import type {
  AIConfig,
  AIProvider,
  ProviderStatus,
  InsightGenerationRequest,
  InsightGenerationResponse,
  AIInsight,
  ChatRequest,
  ChatResponse,
  ChatMessage,
} from './types';
import { loadAIConfig, saveAIConfig } from './config';
import { ProviderFactory, type BaseAIProvider, type GenerateOptions } from './providers';
import { INSIGHT_SYSTEM_PROMPT, buildInsightPrompt } from './prompts/insightPrompts';
import { QA_SYSTEM_PROMPT } from './prompts/qaPrompts';

/**
 * Main AI Service facade that orchestrates all AI functionality
 */
export class AIService {
  private static instance: AIService | null = null;
  private config: AIConfig;
  private provider: BaseAIProvider | null = null;
  private statusCache: ProviderStatus | null = null;
  private statusCacheTime: number = 0;
  private readonly STATUS_CACHE_TTL = 30000; // 30 seconds

  private constructor() {
    this.config = loadAIConfig();
    this.initializeProvider();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    AIService.instance = null;
  }

  /**
   * Initialize or reinitialize the provider
   */
  private initializeProvider(): void {
    try {
      if (ProviderFactory.canCreate(this.config)) {
        this.provider = ProviderFactory.create(this.config);
      } else {
        this.provider = null;
      }
    } catch (error) {
      console.error('Failed to initialize AI provider:', error);
      this.provider = null;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  updateConfig(updates: Partial<AIConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      apiKeys: {
        ...this.config.apiKeys,
        ...updates.apiKeys,
      },
      models: {
        ...this.config.models,
        ...updates.models,
      },
      triggers: {
        ...this.config.triggers,
        ...updates.triggers,
      },
    };
    saveAIConfig(this.config);
    this.initializeProvider();
    this.statusCache = null;
  }

  /**
   * Set the active provider
   */
  setProvider(provider: AIProvider): void {
    this.updateConfig({ provider });
  }

  /**
   * Set an API key
   */
  setApiKey(provider: 'openai' | 'anthropic', key: string): void {
    this.updateConfig({
      apiKeys: {
        ...this.config.apiKeys,
        [provider]: key,
      },
    });
  }

  /**
   * Set the model for a provider
   */
  setModel(provider: AIProvider, model: string): void {
    this.updateConfig({
      models: {
        ...this.config.models,
        [provider]: model,
      },
    });
  }

  /**
   * Check if the service is configured and ready
   */
  isConfigured(): boolean {
    return ProviderFactory.canCreate(this.config);
  }

  /**
   * Get the current provider status
   */
  async getStatus(forceRefresh = false): Promise<ProviderStatus> {
    const now = Date.now();

    // Return cached status if valid
    if (
      !forceRefresh &&
      this.statusCache &&
      now - this.statusCacheTime < this.STATUS_CACHE_TTL
    ) {
      return this.statusCache;
    }

    if (!this.provider) {
      return {
        provider: this.config.provider,
        connected: false,
        model: this.config.models[this.config.provider],
        lastChecked: new Date().toISOString(),
        error: 'Provider not configured',
      };
    }

    this.statusCache = await this.provider.getStatus();
    this.statusCacheTime = now;
    return this.statusCache;
  }

  /**
   * Test the connection to the current provider
   */
  async testConnection(): Promise<boolean> {
    const status = await this.getStatus(true);
    return status.connected;
  }

  /**
   * Generate text using the configured provider
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }
    return this.provider.generate(prompt, options);
  }

  /**
   * Generate streaming text
   */
  async *generateStream(
    prompt: string,
    options?: GenerateOptions & { onToken?: (token: string) => void }
  ): AsyncGenerator<string, void, unknown> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }
    yield* this.provider.generateStream(prompt, options);
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T>(prompt: string, options?: GenerateOptions): Promise<T> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }
    return this.provider.generateJSON<T>(prompt, options);
  }

  /**
   * Generate insights from data
   * This will be enhanced in Phase 2 with proper chains
   */
  async generateInsights(request: InsightGenerationRequest): Promise<InsightGenerationResponse> {
    const startTime = Date.now();

    if (!this.provider) {
      // Return empty response if not configured
      return {
        insights: [],
        processingTime: Date.now() - startTime,
      };
    }

    // Reuse the shared prompt definitions from prompts/insightPrompts
    const systemPrompt = INSIGHT_SYSTEM_PROMPT;

    const prompt = buildInsightPrompt({
      gameType: request.gameType,
      columns: request.columns,
      sampleData: request.data.slice(0, 5),
      existingMetrics: request.existingMetrics,
    });

    try {
      const response = await this.generateJSON<{ insights: Partial<AIInsight>[] }>(prompt, {
        systemPrompt,
        temperature: 0.7,
      });

      const insights: AIInsight[] = response.insights.map((insight, index) => ({
        id: `insight-${Date.now()}-${index}`,
        projectId: request.projectId,
        gameType: request.gameType,
        generatedAt: new Date().toISOString(),
        source: 'ai' as const,
        provider: this.config.provider,
        model: this.config.models[this.config.provider],
        type: insight.type || 'neutral',
        category: insight.category || 'engagement',
        title: insight.title || 'Untitled Insight',
        description: insight.description || '',
        recommendation: insight.recommendation || '',
        priority: insight.priority || 5,
        confidence: insight.confidence || 0.7,
        businessImpact: insight.businessImpact || 'medium',
        revenueImpact: insight.revenueImpact,
        evidence: insight.evidence || [],
        tags: insight.tags || [],
      }));

      return {
        insights,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return {
        insights: [],
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Chat with the AI about the data
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }

    // Reuse the shared QA system prompt, with minimal request-specific context appended
    const systemPrompt = `${QA_SYSTEM_PROMPT}

Context: Page=${request.context?.currentPage || 'Unknown'}, Insights=${request.context?.insights?.length || 0}.`;

    try {
      const response = await this.generate(request.message, {
        systemPrompt,
        temperature: 0.7,
      });

      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        projectId: request.projectId,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      return { message };
    } catch (error) {
      console.error('Chat generation failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        projectId: request.projectId,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      return { message };
    }
  }

  /**
   * Get the active provider name
   */
  getActiveProvider(): AIProvider {
    return this.config.provider;
  }

  /**
   * Get the active model name
   */
  getActiveModel(): string {
    return this.config.models[this.config.provider];
  }
}

// Export singleton getter for convenience
export function getAIService(): AIService {
  return AIService.getInstance();
}
