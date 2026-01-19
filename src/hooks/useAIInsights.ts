/**
 * useAIInsights Hook
 *
 * Specialized hook for working with AI-generated insights
 */

import { useMemo, useCallback } from 'react';
import { useAI } from '@/context/AIContext';
import type { AIInsight, InsightCategory, InsightType, BusinessImpact } from '@/services/ai/types';

interface UseAIInsightsOptions {
  projectId?: string;
  category?: InsightCategory;
  type?: InsightType;
  impact?: BusinessImpact;
  actioned?: boolean;
}

interface UseAIInsightsReturn {
  // Filtered insights
  insights: AIInsight[];

  // Counts by category
  countByCategory: Record<InsightCategory, number>;

  // Counts by type
  countByType: Record<InsightType, number>;

  // Statistics
  totalCount: number;
  actionedCount: number;
  highPriorityCount: number;
  averageConfidence: number;

  // Grouped insights
  positiveInsights: AIInsight[];
  negativeInsights: AIInsight[];
  warningInsights: AIInsight[];
  opportunityInsights: AIInsight[];

  // Actions
  markActioned: (insightId: string, actionType: 'segment' | 'alert' | 'exported') => void;
  clearAll: () => void;

  // Generation state
  isGenerating: boolean;
  progress: { step: string; progress: number } | null;
}

export function useAIInsights(options: UseAIInsightsOptions = {}): UseAIInsightsReturn {
  const { projectId, category, type, impact, actioned } = options;
  const {
    insights: allInsights,
    isGenerating,
    generationProgress,
    markInsightActioned,
    clearInsights,
  } = useAI();

  // Filter insights based on options
  const insights = useMemo(() => {
    let filtered = allInsights;

    if (projectId) {
      filtered = filtered.filter((i) => i.projectId === projectId);
    }
    if (category) {
      filtered = filtered.filter((i) => i.category === category);
    }
    if (type) {
      filtered = filtered.filter((i) => i.type === type);
    }
    if (impact) {
      filtered = filtered.filter((i) => i.businessImpact === impact);
    }
    if (actioned !== undefined) {
      filtered = filtered.filter((i) => i.actioned === actioned);
    }

    // Sort by priority (descending) then by date (most recent first)
    return filtered.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    });
  }, [allInsights, projectId, category, type, impact, actioned]);

  // Count by category
  const countByCategory = useMemo(() => {
    const counts: Record<InsightCategory, number> = {
      retention: 0,
      monetization: 0,
      engagement: 0,
      progression: 0,
      quality: 0,
    };
    for (const insight of insights) {
      counts[insight.category]++;
    }
    return counts;
  }, [insights]);

  // Count by type
  const countByType = useMemo(() => {
    const counts: Record<InsightType, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      warning: 0,
      opportunity: 0,
    };
    for (const insight of insights) {
      counts[insight.type]++;
    }
    return counts;
  }, [insights]);

  // Statistics
  const totalCount = insights.length;
  const actionedCount = insights.filter((i) => i.actioned).length;
  const highPriorityCount = insights.filter((i) => i.priority >= 8).length;
  const averageConfidence =
    insights.length > 0
      ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
      : 0;

  // Grouped by type
  const positiveInsights = useMemo(
    () => insights.filter((i) => i.type === 'positive'),
    [insights]
  );
  const negativeInsights = useMemo(
    () => insights.filter((i) => i.type === 'negative'),
    [insights]
  );
  const warningInsights = useMemo(
    () => insights.filter((i) => i.type === 'warning'),
    [insights]
  );
  const opportunityInsights = useMemo(
    () => insights.filter((i) => i.type === 'opportunity'),
    [insights]
  );

  // Actions
  const markActioned = useCallback(
    (insightId: string, actionType: 'segment' | 'alert' | 'exported') => {
      markInsightActioned(insightId, actionType);
    },
    [markInsightActioned]
  );

  const clearAll = useCallback(() => {
    clearInsights(projectId);
  }, [clearInsights, projectId]);

  return {
    insights,
    countByCategory,
    countByType,
    totalCount,
    actionedCount,
    highPriorityCount,
    averageConfidence,
    positiveInsights,
    negativeInsights,
    warningInsights,
    opportunityInsights,
    markActioned,
    clearAll,
    isGenerating,
    progress: generationProgress,
  };
}
