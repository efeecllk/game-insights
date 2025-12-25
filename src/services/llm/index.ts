/**
 * LLM Service Module Exports
 */

// Main service
export { LLMService, createLLMService, getLLMService, hasLLMService } from './LLMService';

// Types
export type {
    LLMConfig,
    LLMProvider,
    CompletionRequest,
    CompletionResponse,
    InsightContext,
    LLMInsight,
    InsightGenerationResult,
    QAContext,
    QAResponse,
    QueryLogic,
    QADataPoint,
} from './types';

export { LLMError, LLMErrorCode } from './types';

// Providers
export { OpenAIProvider } from './providers/OpenAIProvider';

// Prompts
export { INSIGHT_SYSTEM_PROMPT, GAME_TYPE_CONTEXT, buildInsightUserPrompt } from './prompts/insightPrompts';
export { QA_SYSTEM_PROMPT, SUGGESTED_QUESTIONS, buildQAUserPrompt, detectQuestionType } from './prompts/qaPrompts';
