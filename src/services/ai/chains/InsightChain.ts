/**
 * InsightChain - LangChain-based insight generation
 *
 * Orchestrates the AI provider to generate actionable insights from game data
 */

import { z } from 'zod';
import type { GameCategory } from '@/types';
import type {
  AIInsight,
  InsightCategory,
  InsightType,
  BusinessImpact,
  ColumnInfo,
  RevenueImpact,
} from '../types';
import type { BaseAIProvider } from '../providers';
import { INSIGHT_SYSTEM_PROMPT, buildInsightPrompt } from '../prompts/insightPrompts';

// Zod schema for validating LLM output
const RevenueImpactSchema = z.object({
  type: z.enum(['increase', 'decrease']),
  percentage: z.number(),
  estimated: z.number().optional(),
});

const InsightSchema = z.object({
  type: z.enum(['positive', 'negative', 'neutral', 'warning', 'opportunity']),
  category: z.enum(['retention', 'monetization', 'engagement', 'progression', 'quality']),
  title: z.string().max(100),
  description: z.string(),
  recommendation: z.string(),
  priority: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
  businessImpact: z.enum(['high', 'medium', 'low']),
  evidence: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  revenueImpact: RevenueImpactSchema.optional(),
  metricName: z.string().optional(),
});

const InsightResponseSchema = z.object({
  insights: z.array(InsightSchema),
});

export interface InsightChainInput {
  projectId: string;
  gameType: GameCategory;
  columns: ColumnInfo[];
  data: Record<string, unknown>[];
  existingMetrics?: Record<string, number>;
  focusCategory?: InsightCategory;
  maxInsights?: number;
}

export interface InsightChainOutput {
  insights: AIInsight[];
  rawResponse?: string;
  tokensUsed?: number;
  processingTime: number;
}

/**
 * Chain for generating insights from game data
 */
export class InsightChain {
  private provider: BaseAIProvider;

  constructor(provider: BaseAIProvider) {
    this.provider = provider;
  }

  /**
   * Run the insight generation chain
   */
  async run(input: InsightChainInput): Promise<InsightChainOutput> {
    const startTime = Date.now();
    const { projectId, gameType, columns, data, existingMetrics, focusCategory, maxInsights = 5 } = input;

    // Build the prompt
    const prompt = buildInsightPrompt({
      gameType,
      columns,
      sampleData: data.slice(0, 10), // Use first 10 rows as sample
      existingMetrics,
      focusCategory,
    });

    try {
      // Generate response from LLM
      const rawResponse = await this.provider.generate(prompt, {
        systemPrompt: INSIGHT_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 2000,
      });

      // Parse and validate the response
      const parsed = this.parseResponse(rawResponse);
      const validatedInsights = this.validateInsights(parsed);

      // Transform to full AIInsight objects
      const insights: AIInsight[] = validatedInsights.slice(0, maxInsights).map((insight, index) => ({
        id: `insight-${Date.now()}-${index}`,
        projectId,
        gameType,
        generatedAt: new Date().toISOString(),
        source: 'ai' as const,
        provider: this.provider.providerName,
        model: this.provider.modelName,
        type: insight.type as InsightType,
        category: insight.category as InsightCategory,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        priority: insight.priority,
        confidence: insight.confidence,
        businessImpact: insight.businessImpact as BusinessImpact,
        revenueImpact: insight.revenueImpact as RevenueImpact | undefined,
        evidence: insight.evidence || [],
        tags: insight.tags || this.generateTags(insight),
        metricName: insight.metricName,
      }));

      return {
        insights,
        rawResponse,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('InsightChain error:', error);
      return {
        insights: [],
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Parse the LLM response to extract JSON
   */
  private parseResponse(response: string): unknown {
    // Try to find JSON in the response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim();

    try {
      return JSON.parse(jsonString);
    } catch {
      // Try to find a JSON object in the response
      const objectMatch = jsonString.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      throw new Error('Failed to parse JSON from response');
    }
  }

  /**
   * Validate parsed insights against schema
   */
  private validateInsights(parsed: unknown): z.infer<typeof InsightSchema>[] {
    try {
      const result = InsightResponseSchema.safeParse(parsed);
      if (result.success) {
        return result.data.insights;
      }

      // Try to parse as array directly
      if (Array.isArray(parsed)) {
        const validInsights: z.infer<typeof InsightSchema>[] = [];
        for (const item of parsed) {
          const itemResult = InsightSchema.safeParse(item);
          if (itemResult.success) {
            validInsights.push(itemResult.data);
          }
        }
        return validInsights;
      }

      console.warn('Insight validation failed:', result.error);
      return [];
    } catch (error) {
      console.error('Insight validation error:', error);
      return [];
    }
  }

  /**
   * Generate tags based on insight properties
   */
  private generateTags(insight: z.infer<typeof InsightSchema>): string[] {
    const tags: string[] = [];

    // Add revenue impact tag
    if (insight.revenueImpact) {
      const sign = insight.revenueImpact.type === 'increase' ? '+' : '-';
      tags.push(`Revenue ${sign}${insight.revenueImpact.percentage}%`);
    }

    // Add priority tag
    if (insight.priority >= 8) {
      tags.push('High Priority');
    } else if (insight.priority <= 3) {
      tags.push('Quick Win');
    }

    // Add type-based tag
    if (insight.type === 'warning') {
      tags.push('Risk Alert');
    } else if (insight.type === 'opportunity') {
      tags.push('Opportunity');
    }

    // Add business impact tag
    if (insight.businessImpact === 'high') {
      tags.push('High Impact');
    }

    return tags;
  }

  /**
   * Stream insight generation (for real-time UI updates)
   */
  async *runStream(input: InsightChainInput): AsyncGenerator<string, InsightChainOutput, unknown> {
    const startTime = Date.now();
    const { projectId, gameType, columns, data, existingMetrics, focusCategory, maxInsights = 5 } = input;

    const prompt = buildInsightPrompt({
      gameType,
      columns,
      sampleData: data.slice(0, 10),
      existingMetrics,
      focusCategory,
    });

    let fullResponse = '';

    try {
      for await (const chunk of this.provider.generateStream(prompt, {
        systemPrompt: INSIGHT_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 2000,
      })) {
        fullResponse += chunk;
        yield chunk;
      }

      const parsed = this.parseResponse(fullResponse);
      const validatedInsights = this.validateInsights(parsed);

      const insights: AIInsight[] = validatedInsights.slice(0, maxInsights).map((insight, index) => ({
        id: `insight-${Date.now()}-${index}`,
        projectId,
        gameType,
        generatedAt: new Date().toISOString(),
        source: 'ai' as const,
        provider: this.provider.providerName,
        model: this.provider.modelName,
        type: insight.type as InsightType,
        category: insight.category as InsightCategory,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        priority: insight.priority,
        confidence: insight.confidence,
        businessImpact: insight.businessImpact as BusinessImpact,
        revenueImpact: insight.revenueImpact as RevenueImpact | undefined,
        evidence: insight.evidence || [],
        tags: insight.tags || this.generateTags(insight),
        metricName: insight.metricName,
      }));

      return {
        insights,
        rawResponse: fullResponse,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('InsightChain stream error:', error);
      return {
        insights: [],
        processingTime: Date.now() - startTime,
      };
    }
  }
}
