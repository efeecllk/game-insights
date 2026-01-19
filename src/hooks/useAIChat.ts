/**
 * useAIChat Hook
 *
 * Specialized hook for the AI chat interface
 */

import { useState, useMemo, useCallback } from 'react';
import { useAI } from '@/context/AIContext';
import type { ChatMessage, ChatSession } from '@/services/ai/types';

interface UseAIChatOptions {
  projectId: string;
}

interface UseAIChatReturn {
  // Session data
  session: ChatSession | null;
  messages: ChatMessage[];

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  sendMessage: (message: string) => Promise<ChatMessage | null>;
  clearSession: () => void;

  // Suggestions
  suggestions: string[];
}

const DEFAULT_SUGGESTIONS = [
  'What are the main issues in my data?',
  'Why is retention dropping?',
  'Show me monetization opportunities',
  'What metrics should I focus on?',
  'How can I improve engagement?',
];

export function useAIChat({ projectId }: UseAIChatOptions): UseAIChatReturn {
  const { chatSessions, sendChatMessage, clearChatSession, insights, isConnected } = useAI();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get session for this project
  const session = useMemo(
    () => chatSessions.find((s) => s.projectId === projectId) || null,
    [chatSessions, projectId]
  );

  // Get messages
  const messages = useMemo(() => session?.messages || [], [session]);

  // Generate contextual suggestions based on insights
  const suggestions = useMemo(() => {
    const projectInsights = insights.filter((i) => i.projectId === projectId);

    if (projectInsights.length === 0) {
      return DEFAULT_SUGGESTIONS;
    }

    const dynamicSuggestions: string[] = [];

    // Add insight-based suggestions
    const warningInsights = projectInsights.filter((i) => i.type === 'warning');
    if (warningInsights.length > 0) {
      dynamicSuggestions.push(`Tell me more about "${warningInsights[0].title}"`);
    }

    const opportunityInsights = projectInsights.filter((i) => i.type === 'opportunity');
    if (opportunityInsights.length > 0) {
      dynamicSuggestions.push(`How can I act on "${opportunityInsights[0].title}"?`);
    }

    // Add category-based suggestions
    const categories = [...new Set(projectInsights.map((i) => i.category))];
    if (categories.includes('retention')) {
      dynamicSuggestions.push('What is driving churn?');
    }
    if (categories.includes('monetization')) {
      dynamicSuggestions.push('How can I increase ARPU?');
    }
    if (categories.includes('engagement')) {
      dynamicSuggestions.push('What content keeps users engaged?');
    }

    // Fill with defaults if needed
    const allSuggestions = [...dynamicSuggestions, ...DEFAULT_SUGGESTIONS];
    return allSuggestions.slice(0, 5);
  }, [insights, projectId]);

  // Send message
  const sendMessage = useCallback(
    async (message: string): Promise<ChatMessage | null> => {
      if (!isConnected) {
        setError('AI provider not connected. Please check your settings.');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await sendChatMessage(projectId, message);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, sendChatMessage, isConnected]
  );

  // Clear session
  const clearSession = useCallback(() => {
    clearChatSession(projectId);
    setError(null);
  }, [clearChatSession, projectId]);

  return {
    session,
    messages,
    isLoading,
    error,
    sendMessage,
    clearSession,
    suggestions,
  };
}
