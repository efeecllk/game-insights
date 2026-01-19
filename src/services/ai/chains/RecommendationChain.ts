/**
 * RecommendationChain - Generate category-specific recommendations
 *
 * Takes existing insights and generates more detailed recommendations
 * for a specific category (retention, monetization, etc.)
 */

import { z } from 'zod';
import type { GameCategory } from '@/types';
import type { AIInsight, InsightCategory } from '../types';
import type { BaseAIProvider } from '../providers';
import { buildRecommendationPrompt, categoryPrompts } from '../prompts/insightPrompts';

const RecommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  actionSteps: z.array(z.string()),
  expectedOutcome: z.string(),
  timeToImplement: z.enum(['hours', 'days', 'weeks', 'months']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  metrics: z.array(z.string()).optional(),
});

const RecommendationResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema),
});

export interface Recommendation {
  id: string;
  insightId?: string;
  category: InsightCategory;
  title: string;
  description: string;
  actionSteps: string[];
  expectedOutcome: string;
  timeToImplement: 'hours' | 'days' | 'weeks' | 'months';
  difficulty: 'easy' | 'medium' | 'hard';
  metrics?: string[];
  createdAt: string;
}

export interface RecommendationChainInput {
  category: InsightCategory;
  gameType: GameCategory;
  existingInsights?: AIInsight[];
  context?: string;
}

export interface RecommendationChainOutput {
  recommendations: Recommendation[];
  processingTime: number;
}

/**
 * Chain for generating detailed recommendations
 */
export class RecommendationChain {
  private provider: BaseAIProvider;

  constructor(provider: BaseAIProvider) {
    this.provider = provider;
  }

  /**
   * Generate recommendations for a specific category
   */
  async run(input: RecommendationChainInput): Promise<RecommendationChainOutput> {
    const startTime = Date.now();
    const { category, gameType, existingInsights, context } = input;

    const systemPrompt = `You are a game analytics consultant specializing in ${category} optimization.
Generate specific, actionable recommendations that a game team can implement.

${categoryPrompts[category]}

OUTPUT FORMAT:
Return a JSON object with a "recommendations" array. Each recommendation must have:
- title: Brief, actionable title
- description: Detailed explanation
- actionSteps: Array of specific steps to implement
- expectedOutcome: What improvement to expect
- timeToImplement: "hours" | "days" | "weeks" | "months"
- difficulty: "easy" | "medium" | "hard"
- metrics: Array of metrics to track (optional)`;

    const insightSummaries = existingInsights?.map((i) => ({
      title: i.title,
      description: i.description,
    })) || [];

    let prompt: string;
    if (insightSummaries.length > 0) {
      prompt = buildRecommendationPrompt({
        category,
        currentInsights: insightSummaries,
        gameType,
      });
    } else {
      prompt = `Generate 3 actionable ${category} recommendations for a ${gameType} game.
${context ? `Additional context: ${context}` : ''}

Be specific and practical. Include concrete steps and expected outcomes.`;
    }

    try {
      const rawResponse = await this.provider.generate(prompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500,
      });

      const parsed = this.parseResponse(rawResponse);
      const validated = this.validateRecommendations(parsed);

      const recommendations: Recommendation[] = validated.map((rec, index) => ({
        id: `rec-${Date.now()}-${index}`,
        category,
        title: rec.title,
        description: rec.description,
        actionSteps: rec.actionSteps,
        expectedOutcome: rec.expectedOutcome,
        timeToImplement: rec.timeToImplement,
        difficulty: rec.difficulty,
        metrics: rec.metrics,
        createdAt: new Date().toISOString(),
      }));

      return {
        recommendations,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('RecommendationChain error:', error);
      return {
        recommendations: [],
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate recommendations for a specific insight
   */
  async runForInsight(insight: AIInsight, gameType: GameCategory): Promise<Recommendation[]> {
    const systemPrompt = `You are a game analytics consultant.
Based on this insight, generate 2-3 specific recommendations to address it.

INSIGHT:
Title: ${insight.title}
Description: ${insight.description}
Category: ${insight.category}
Type: ${insight.type}
Business Impact: ${insight.businessImpact}

OUTPUT FORMAT:
Return a JSON object with a "recommendations" array. Each must have:
- title, description, actionSteps, expectedOutcome, timeToImplement, difficulty`;

    const prompt = `Generate specific recommendations to address this ${insight.category} insight for a ${gameType} game.
Current recommendation: ${insight.recommendation}

Expand this into detailed, actionable steps.`;

    try {
      const rawResponse = await this.provider.generate(prompt, {
        systemPrompt,
        temperature: 0.7,
      });

      const parsed = this.parseResponse(rawResponse);
      const validated = this.validateRecommendations(parsed);

      return validated.map((rec, index) => ({
        id: `rec-${insight.id}-${index}`,
        insightId: insight.id,
        category: insight.category,
        title: rec.title,
        description: rec.description,
        actionSteps: rec.actionSteps,
        expectedOutcome: rec.expectedOutcome,
        timeToImplement: rec.timeToImplement,
        difficulty: rec.difficulty,
        metrics: rec.metrics,
        createdAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('RecommendationChain error for insight:', error);
      return [];
    }
  }

  private parseResponse(response: string): unknown {
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim();

    try {
      return JSON.parse(jsonString);
    } catch {
      const objectMatch = jsonString.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      throw new Error('Failed to parse JSON from response');
    }
  }

  private validateRecommendations(parsed: unknown): z.infer<typeof RecommendationSchema>[] {
    try {
      const result = RecommendationResponseSchema.safeParse(parsed);
      if (result.success) {
        return result.data.recommendations;
      }

      if (Array.isArray(parsed)) {
        const valid: z.infer<typeof RecommendationSchema>[] = [];
        for (const item of parsed) {
          const itemResult = RecommendationSchema.safeParse(item);
          if (itemResult.success) {
            valid.push(itemResult.data);
          }
        }
        return valid;
      }

      return [];
    } catch {
      return [];
    }
  }
}
