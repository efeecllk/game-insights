/**
 * Prompt templates for insight generation
 */

import type { GameCategory } from '@/types';
import type { InsightCategory, ColumnInfo } from '../types';

/**
 * System prompt for insight generation
 */
export const INSIGHT_SYSTEM_PROMPT = `You are a senior game analytics expert specialized in mobile game data analysis.
Your task is to analyze game data and generate actionable insights that drive business decisions.

IMPORTANT GUIDELINES:
1. Focus on actionable recommendations that can improve key metrics
2. Prioritize insights by potential business impact
3. Be specific with numbers and percentages when evidence supports it
4. Consider the game type context when making recommendations
5. Flag both opportunities and risks

OUTPUT FORMAT:
Return a valid JSON object with an "insights" array containing insight objects.
Each insight must have:
- type: "positive" | "negative" | "neutral" | "warning" | "opportunity"
- category: "retention" | "monetization" | "engagement" | "progression" | "quality"
- title: Brief, descriptive title (max 60 chars)
- description: Detailed explanation of the finding
- recommendation: Specific action to take
- priority: 1-10 (10 is highest)
- confidence: 0-1 (how confident in the insight)
- businessImpact: "high" | "medium" | "low"
- evidence: Array of supporting data points
- tags: Array of relevant tags (e.g., "Revenue +12%", "Quick Win", "Churn Risk")

Optional fields:
- revenueImpact: { type: "increase" | "decrease", percentage: number, estimated: number }
- metricName: Name of the key metric this insight relates to`;

/**
 * Get game-type specific context for prompts
 */
export function getGameTypeContext(gameType: GameCategory): string {
  const contexts: Record<GameCategory, string> = {
    puzzle: `This is a PUZZLE GAME. Key metrics to focus on:
- Level completion rates and difficulty curves
- Booster/power-up usage and economy
- Session length and daily play patterns
- Level-based retention (level X drop-off points)
- Ad frequency and placement effectiveness`,

    idle: `This is an IDLE/INCREMENTAL GAME. Key metrics to focus on:
- Prestige/reset cycle efficiency
- Offline earnings optimization
- Active vs passive play balance
- Currency inflation and economy health
- Long-term progression pacing`,

    battle_royale: `This is a BATTLE ROYALE GAME. Key metrics to focus on:
- Match completion rates
- Rank distribution and skill matching
- Weapon/loadout meta analysis
- Squad vs solo performance
- Match duration optimization`,

    match3_meta: `This is a MATCH-3 WITH META GAME. Key metrics to focus on:
- Core loop vs meta engagement balance
- Story/decoration progression
- Social feature adoption
- Limited-time event performance
- Monetization through lives/moves`,

    gacha_rpg: `This is a GACHA RPG GAME. Key metrics to focus on:
- Banner/summon conversion rates
- Pity system effectiveness
- Hero/character collection rates
- Spender tier distribution (whale/dolphin/minnow)
- Power creep and character balance`,

    custom: `This is a CUSTOM/GENERAL game type. Analyze broadly across:
- User retention metrics
- Monetization patterns
- Engagement indicators
- Progression systems
- Quality and performance`,
  };

  return contexts[gameType] || contexts.custom;
}

/**
 * Build insight generation prompt
 */
export function buildInsightPrompt(params: {
  gameType: GameCategory;
  columns: ColumnInfo[];
  sampleData: Record<string, unknown>[];
  existingMetrics?: Record<string, number>;
  focusCategory?: InsightCategory;
}): string {
  const { gameType, columns, sampleData, existingMetrics, focusCategory } = params;

  const columnList = columns
    .map((c) => `- ${c.name} (${c.semanticType || c.type})${c.sampleValues ? `: [${c.sampleValues.slice(0, 3).join(', ')}]` : ''}`)
    .join('\n');

  let prompt = `Analyze this game data and generate 3-5 actionable insights.

GAME TYPE: ${gameType.toUpperCase()}
${getGameTypeContext(gameType)}

DATA SCHEMA:
${columnList}

SAMPLE DATA (first ${Math.min(5, sampleData.length)} rows):
${JSON.stringify(sampleData.slice(0, 5), null, 2)}`;

  if (existingMetrics && Object.keys(existingMetrics).length > 0) {
    prompt += `\n\nCALCULATED METRICS:
${Object.entries(existingMetrics)
  .map(([key, value]) => `- ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
  .join('\n')}`;
  }

  if (focusCategory) {
    prompt += `\n\nFOCUS AREA: Prioritize ${focusCategory.toUpperCase()} insights.`;
  }

  prompt += `\n\nGenerate insights in the specified JSON format. Be specific and actionable.`;

  return prompt;
}

/**
 * Category-specific prompts for targeted analysis
 */
export const categoryPrompts: Record<InsightCategory, string> = {
  retention: `Focus on retention analysis:
- Day 1, Day 7, Day 30 retention patterns
- Churn prediction signals
- Re-engagement opportunities
- Session frequency and depth
- Player lifecycle stages`,

  monetization: `Focus on monetization analysis:
- Revenue per user segments
- Conversion funnel optimization
- Price elasticity signals
- Offer timing and targeting
- Spender tier movement`,

  engagement: `Focus on engagement analysis:
- Daily/weekly active user trends
- Feature adoption rates
- Social interaction patterns
- Content consumption velocity
- Peak activity windows`,

  progression: `Focus on progression analysis:
- Content velocity and pacing
- Difficulty curve optimization
- Unlock rate analysis
- Power progression balance
- Content completion rates`,

  quality: `Focus on quality analysis:
- Performance metrics (load times, crashes)
- Bug impact assessment
- UX friction points
- Feature satisfaction signals
- Technical debt indicators`,
};

/**
 * Build category-specific recommendation prompt
 */
export function buildRecommendationPrompt(params: {
  category: InsightCategory;
  currentInsights: { title: string; description: string }[];
  gameType: GameCategory;
}): string {
  const { category, currentInsights, gameType } = params;

  return `Based on these existing insights about a ${gameType} game:

${currentInsights.map((i, idx) => `${idx + 1}. ${i.title}: ${i.description}`).join('\n')}

${categoryPrompts[category]}

Generate 2-3 additional specific recommendations for the ${category} category.
Format as JSON with the same insight structure.`;
}
