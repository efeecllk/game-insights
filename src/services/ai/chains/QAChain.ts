/**
 * QAChain - Conversational Q&A for game analytics
 *
 * Handles natural language questions about game data with context awareness
 */

import type { GameCategory } from '@/types';
import type { AIInsight, ChatMessage, ToolCallResult } from '../types';
import type { BaseAIProvider } from '../providers';
import { QA_SYSTEM_PROMPT, buildChatContext, generateSuggestions } from '../prompts/qaPrompts';

export interface QAChainInput {
  projectId: string;
  gameType: GameCategory;
  message: string;
  insights?: AIInsight[];
  chatHistory?: ChatMessage[];
  currentPage?: string;
}

export interface QAChainOutput {
  response: string;
  suggestions: string[];
  toolCalls?: ToolCallResult[];
  processingTime: number;
}

/**
 * Chain for Q&A conversation about game data
 */
export class QAChain {
  private provider: BaseAIProvider;

  constructor(provider: BaseAIProvider) {
    this.provider = provider;
  }

  /**
   * Process a user message and generate a response
   */
  async run(input: QAChainInput): Promise<QAChainOutput> {
    const startTime = Date.now();
    const { gameType, message, insights = [], chatHistory = [], currentPage } = input;

    // Build context
    const context = buildChatContext({
      gameType,
      insights,
      currentPage,
      recentMessages: chatHistory.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    // Build messages for the conversation
    const systemPrompt = `${QA_SYSTEM_PROMPT}\n\n${context}`;

    const conversationMessages = chatHistory.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Add the new user message
    conversationMessages.push({
      role: 'user' as const,
      content: message,
    });

    try {
      // Generate response
      const response = await this.generateResponse(systemPrompt, conversationMessages);

      // Parse for tool calls
      const toolCalls = this.parseForToolCalls(response, message);

      // Generate contextual suggestions
      const suggestions = generateSuggestions({
        insights,
        gameType,
        currentPage,
      });

      return {
        response,
        suggestions,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('QAChain error:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        suggestions: generateSuggestions({ insights, gameType, currentPage }),
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate a response using the provider
   */
  private async generateResponse(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  ): Promise<string> {
    // For now, use a simple generate approach
    // In a more advanced implementation, this would use proper chat history
    const lastUserMessage =
      messages
        .slice()
        .reverse()
        .find((m: { role: 'user' | 'assistant' | 'system'; content: string }) => m.role === 'user')
        ?.content || '';

    // Build a condensed history for context
    const historyContext =
      messages.length > 1
        ? messages
            .slice(0, -1)
            .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n')
        : '';

    const fullPrompt = historyContext
      ? `Previous conversation:\n${historyContext}\n\nUser: ${lastUserMessage}\n\nAssistant:`
      : lastUserMessage;

    return this.provider.generate(fullPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  /**
   * Parse the response for potential tool call requests
   */
  private parseForToolCalls(_response: string, userMessage: string): ToolCallResult[] {
    const toolCalls: ToolCallResult[] = [];

    // Check for navigation requests
    const navPatterns = [
      /navigate to (?:the )?(\w+)/i,
      /go to (?:the )?(\w+)/i,
      /open (?:the )?(\w+)/i,
      /show (?:me )?(?:the )?(\w+)/i,
    ];

    const pageMap: Record<string, string> = {
      overview: '/',
      dashboard: '/',
      analytics: '/analytics',
      monetization: '/monetization',
      funnels: '/funnels',
      realtime: '/realtime',
      settings: '/settings',
      predictions: '/predictions',
      ml: '/ml-studio',
      studio: '/ml-studio',
      ai: '/ai-analytics',
      insights: '/ai-analytics',
    };

    for (const pattern of navPatterns) {
      const match = userMessage.toLowerCase().match(pattern);
      if (match) {
        const page = match[1].toLowerCase();
        const path = pageMap[page];
        if (path) {
          toolCalls.push({
            tool: 'navigation',
            input: { page: path },
            output: { navigatedTo: path },
            success: true,
          });
        }
      }
    }

    // Check for segment creation intent
    if (
      (userMessage.toLowerCase().includes('create') ||
        userMessage.toLowerCase().includes('make')) &&
      userMessage.toLowerCase().includes('segment')
    ) {
      toolCalls.push({
        tool: 'segment',
        input: { source: 'chat' },
        output: { suggested: true },
        success: true,
      });
    }

    // Check for alert creation intent
    if (
      (userMessage.toLowerCase().includes('set') ||
        userMessage.toLowerCase().includes('create')) &&
      userMessage.toLowerCase().includes('alert')
    ) {
      toolCalls.push({
        tool: 'alert',
        input: { source: 'chat' },
        output: { suggested: true },
        success: true,
      });
    }

    return toolCalls;
  }

  /**
   * Stream the response for real-time updates
   */
  async *runStream(input: QAChainInput): AsyncGenerator<string, QAChainOutput, unknown> {
    const startTime = Date.now();
    const { gameType, insights = [], chatHistory = [], currentPage, message } = input;

    const context = buildChatContext({
      gameType,
      insights,
      currentPage,
      recentMessages: chatHistory.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const systemPrompt = `${QA_SYSTEM_PROMPT}\n\n${context}`;

    let fullResponse = '';

    try {
      for await (const chunk of this.provider.generateStream(message, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1000,
      })) {
        fullResponse += chunk;
        yield chunk;
      }

      const toolCalls = this.parseForToolCalls(fullResponse, message);
      const suggestions = generateSuggestions({ insights, gameType, currentPage });

      return {
        response: fullResponse,
        suggestions,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('QAChain stream error:', error);
      return {
        response: fullResponse || 'Error generating response',
        suggestions: generateSuggestions({ insights, gameType, currentPage }),
        processingTime: Date.now() - startTime,
      };
    }
  }
}
