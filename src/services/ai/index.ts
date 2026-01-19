// Main service
export { AIService, getAIService } from './AIService';

// Configuration
export { loadAIConfig, saveAIConfig, updateAIConfig, getApiKey, setApiKey } from './config';

// Types
export * from './types';

// Providers
export {
  BaseAIProvider,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  ProviderFactory,
  type GenerateOptions,
  type StreamGenerateOptions,
} from './providers';

// Chains
export {
  InsightChain,
  RecommendationChain,
  AnalysisChain,
  type InsightChainInput,
  type InsightChainOutput,
  type Recommendation,
  type AnalysisInput,
  type AnalysisOutput,
  type AnalysisSummary,
} from './chains';

// Prompts
export {
  INSIGHT_SYSTEM_PROMPT,
  getGameTypeContext,
  buildInsightPrompt,
} from './prompts';

// Tools
export {
  createSegmentFromInsight,
  createAlertFromInsight,
  downloadInsights,
  insightsToMarkdown,
  type SegmentCreationInput,
  type AlertCreationInput,
  type ExportFormat,
  type ExportOptions,
} from './tools';
