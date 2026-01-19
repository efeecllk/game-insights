/**
 * AnalysisChain - Full data analysis orchestration
 *
 * Coordinates multiple chains to provide comprehensive analysis:
 * 1. Initial insight generation
 * 2. Category-specific deep dives
 * 3. Recommendation synthesis
 */

import type { GameCategory } from '@/types';
import type { AIInsight, InsightCategory, ColumnInfo } from '../types';
import type { BaseAIProvider } from '../providers';
import { InsightChain } from './InsightChain';
import { RecommendationChain, type Recommendation } from './RecommendationChain';

export interface AnalysisInput {
  projectId: string;
  gameType: GameCategory;
  columns: ColumnInfo[];
  data: Record<string, unknown>[];
  existingMetrics?: Record<string, number>;
  options?: {
    maxInsights?: number;
    includeRecommendations?: boolean;
    focusCategories?: InsightCategory[];
    deepDiveCategory?: InsightCategory;
  };
}

export interface AnalysisOutput {
  insights: AIInsight[];
  recommendations: Recommendation[];
  summary: AnalysisSummary;
  processingTime: number;
}

export interface AnalysisSummary {
  totalInsights: number;
  byCategory: Record<InsightCategory, number>;
  byType: Record<string, number>;
  topPriorityInsights: AIInsight[];
  keyMetrics: string[];
  overallHealth: 'good' | 'moderate' | 'needs-attention';
}

/**
 * Orchestrates full data analysis with multiple chains
 */
export class AnalysisChain {
  private insightChain: InsightChain;
  private recommendationChain: RecommendationChain;

  constructor(provider: BaseAIProvider) {
    this.insightChain = new InsightChain(provider);
    this.recommendationChain = new RecommendationChain(provider);
  }

  /**
   * Run full analysis pipeline
   */
  async run(input: AnalysisInput): Promise<AnalysisOutput> {
    const startTime = Date.now();
    const { projectId, gameType, columns, data, existingMetrics, options = {} } = input;
    const {
      maxInsights = 10,
      includeRecommendations = true,
      focusCategories,
      deepDiveCategory,
    } = options;

    let allInsights: AIInsight[] = [];
    let allRecommendations: Recommendation[] = [];

    // Step 1: Generate initial insights
    const initialResult = await this.insightChain.run({
      projectId,
      gameType,
      columns,
      data,
      existingMetrics,
      maxInsights: focusCategories ? Math.floor(maxInsights / 2) : maxInsights,
    });
    allInsights = [...initialResult.insights];

    // Step 2: Generate focused insights for specific categories
    if (focusCategories && focusCategories.length > 0) {
      const insightsPerCategory = Math.floor((maxInsights - allInsights.length) / focusCategories.length);

      for (const category of focusCategories) {
        const focusedResult = await this.insightChain.run({
          projectId,
          gameType,
          columns,
          data,
          existingMetrics,
          focusCategory: category,
          maxInsights: insightsPerCategory,
        });
        allInsights = [...allInsights, ...focusedResult.insights];
      }
    }

    // Deduplicate insights by title similarity
    allInsights = this.deduplicateInsights(allInsights);

    // Step 3: Generate recommendations if requested
    if (includeRecommendations) {
      // Generate recommendations for top priority insights
      const topInsights = allInsights
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);

      for (const insight of topInsights) {
        const recs = await this.recommendationChain.runForInsight(insight, gameType);
        allRecommendations = [...allRecommendations, ...recs];
      }

      // Generate category-specific recommendations if deep dive requested
      if (deepDiveCategory) {
        const categoryInsights = allInsights.filter((i) => i.category === deepDiveCategory);
        const categoryResult = await this.recommendationChain.run({
          category: deepDiveCategory,
          gameType,
          existingInsights: categoryInsights,
        });
        allRecommendations = [...allRecommendations, ...categoryResult.recommendations];
      }
    }

    // Step 4: Generate summary
    const summary = this.generateSummary(allInsights);

    return {
      insights: allInsights,
      recommendations: allRecommendations,
      summary,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Run analysis with progress callbacks
   */
  async runWithProgress(
    input: AnalysisInput,
    onProgress: (step: string, progress: number) => void
  ): Promise<AnalysisOutput> {
    const startTime = Date.now();
    const { projectId, gameType, columns, data, existingMetrics, options = {} } = input;
    const { maxInsights = 10, includeRecommendations = true } = options;

    let allInsights: AIInsight[] = [];
    let allRecommendations: Recommendation[] = [];

    // Step 1: Initial insights
    onProgress('Generating initial insights...', 10);
    const initialResult = await this.insightChain.run({
      projectId,
      gameType,
      columns,
      data,
      existingMetrics,
      maxInsights,
    });
    allInsights = initialResult.insights;
    onProgress('Initial insights complete', 40);

    // Step 2: Recommendations
    if (includeRecommendations && allInsights.length > 0) {
      onProgress('Generating recommendations...', 50);
      const topInsights = allInsights
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 2);

      for (let i = 0; i < topInsights.length; i++) {
        const recs = await this.recommendationChain.runForInsight(topInsights[i], gameType);
        allRecommendations = [...allRecommendations, ...recs];
        onProgress(`Recommendations ${i + 1}/${topInsights.length}`, 50 + ((i + 1) / topInsights.length) * 40);
      }
    }

    // Step 3: Summary
    onProgress('Generating summary...', 95);
    const summary = this.generateSummary(allInsights);
    onProgress('Analysis complete', 100);

    return {
      insights: allInsights,
      recommendations: allRecommendations,
      summary,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Remove duplicate insights based on title similarity
   */
  private deduplicateInsights(insights: AIInsight[]): AIInsight[] {
    const seen = new Set<string>();
    return insights.filter((insight) => {
      const normalizedTitle = insight.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(normalizedTitle)) {
        return false;
      }
      seen.add(normalizedTitle);
      return true;
    });
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(insights: AIInsight[]): AnalysisSummary {
    const byCategory: Record<InsightCategory, number> = {
      retention: 0,
      monetization: 0,
      engagement: 0,
      progression: 0,
      quality: 0,
    };

    const byType: Record<string, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      warning: 0,
      opportunity: 0,
    };

    const keyMetricsSet = new Set<string>();

    for (const insight of insights) {
      byCategory[insight.category]++;
      byType[insight.type]++;
      if (insight.metricName) {
        keyMetricsSet.add(insight.metricName);
      }
    }

    const topPriorityInsights = [...insights]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);

    // Determine overall health based on insight types
    const negativeRatio = (byType.negative + byType.warning) / Math.max(insights.length, 1);
    let overallHealth: 'good' | 'moderate' | 'needs-attention';
    if (negativeRatio > 0.5) {
      overallHealth = 'needs-attention';
    } else if (negativeRatio > 0.25) {
      overallHealth = 'moderate';
    } else {
      overallHealth = 'good';
    }

    return {
      totalInsights: insights.length,
      byCategory,
      byType,
      topPriorityInsights,
      keyMetrics: Array.from(keyMetricsSet),
      overallHealth,
    };
  }
}
