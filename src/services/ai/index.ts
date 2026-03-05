// Main service
export { AIService, getAIService } from './AIService';

// Configuration
export {
  loadAIConfig,
  saveAIConfig,
  updateAIConfig,
  getApiKey,
  setApiKey,
  getModel,
  isProviderConfigured,
  getAvailableModels,
  clearAIConfig,
} from './config';

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
  QAChain,
  type InsightChainInput,
  type InsightChainOutput,
  type Recommendation,
  type RecommendationChainInput,
  type RecommendationChainOutput,
  type AnalysisInput,
  type AnalysisOutput,
  type AnalysisSummary,
  type QAChainInput,
  type QAChainOutput,
} from './chains';

// Prompts
export {
  INSIGHT_SYSTEM_PROMPT,
  getGameTypeContext,
  buildInsightPrompt,
  categoryPrompts,
  buildRecommendationPrompt,
  QA_SYSTEM_PROMPT,
  buildChatContext,
  generateSuggestions,
  buildToolRequestPrompt,
  parseToolCalls,
} from './prompts';

// Tools
export {
  createSegmentFromInsight,
  exportSegmentDefinition,
  validateSegmentFilters,
  createAlertFromInsight,
  formatAlertDescription,
  checkAlertCondition,
  exportAlertDefinition,
  insightToMarkdown,
  insightsToMarkdown,
  insightsToJSON,
  insightsToCSV,
  insightsToHTML,
  downloadInsights,
  type SegmentCreationInput,
  type SegmentCreationResult,
  type AlertCreationInput,
  type AlertCreationResult,
  type ExportFormat,
  type ExportOptions,
} from './tools';

// Memory
export { ProjectMemory } from './memory/ProjectMemory';
export { MemoryManager, getProjectMemory } from './memory/MemoryManager';
