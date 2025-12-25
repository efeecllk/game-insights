/**
 * Insight Generation Prompts
 * System and user prompts for LLM-powered insight generation
 */

import { GameCategory } from '../../../types';
import { InsightContext } from '../types';

// ============ SYSTEM PROMPT ============

export const INSIGHT_SYSTEM_PROMPT = `You are an expert game analytics consultant specializing in mobile game performance optimization. You analyze game data to identify actionable insights that drive player engagement, retention, and monetization.

Your analysis style:
- Data-driven: Always reference specific numbers and trends
- Actionable: Every insight should suggest a concrete next step
- Prioritized: Focus on high-impact findings first
- Game-aware: Consider the specific game type's unique dynamics
- Concise: Keep insights brief but informative

You respond ONLY with valid JSON matching the specified schema. Do not include any text outside the JSON.`;

// ============ GAME TYPE CONTEXT ============

export const GAME_TYPE_CONTEXT: Record<GameCategory, string> = {
    puzzle: `This is a PUZZLE game. Focus on:
- Level progression velocity and completion rates
- Difficulty spikes and player frustration points
- Booster/power-up economy and usage patterns
- Session frequency and duration
- IAP conversion at stuck points
Key metrics: Level completion rate, attempts-per-level, booster usage ratio, session duration`,

    idle: `This is an IDLE/INCREMENTAL game. Focus on:
- Prestige cycle timing and progression
- Offline reward balance vs active play
- Upgrade path diversity and choices
- Currency inflation over time
- Active vs passive time split
Key metrics: Time-to-prestige, offline/online ratio, upgrade diversity, currency generation rate`,

    battle_royale: `This is a BATTLE ROYALE game. Focus on:
- Match quality and fairness perception
- Skill-based matchmaking effectiveness
- Time-to-first-action metrics
- Landing/drop patterns and hot zones
- Weapon/loadout meta balance
Key metrics: Average placement, kills-per-match, survival time, weapon usage distribution`,

    match3_meta: `This is a MATCH-3 with META LAYER game. Focus on:
- Balance between match-3 and meta progression
- Decoration/story economy
- Level difficulty curve and pacing
- Booster dependency and attach rates
Key metrics: Story completion rate, decoration purchases, hard level conversion, booster attach rate`,

    gacha_rpg: `This is a GACHA/RPG game. Focus on:
- Banner performance and timing
- Pity system utilization patterns
- Spender tier distribution (whale, dolphin, minnow)
- Character/unit collection depth
- Pull rates and satisfaction
Key metrics: Pull-per-user, pity hit rate, SSR acquisition rate, spend concentration`,

    custom: `This is a CUSTOM/OTHER game type. Analyze based on available data patterns without game-specific assumptions. Look for general engagement, retention, and monetization patterns.`,
};

// ============ BUILD USER PROMPT ============

export function buildInsightUserPrompt(context: InsightContext): string {
    const { gameType, columnMeanings, metrics, anomalies, dataSnapshot, aggregations } = context;

    const availableColumns = columnMeanings
        .filter(m => m.semanticType !== 'unknown')
        .map(m => `${m.column} (${m.semanticType})`)
        .join(', ');

    let metricsSection = '';
    if (metrics) {
        const parts: string[] = [];

        if (metrics.retention) {
            parts.push(`Retention: ${Object.entries(metrics.retention.classic)
                .map(([k, v]) => `${k}=${v}%`)
                .join(', ')}`);
        }

        if (metrics.engagement) {
            parts.push(`DAU: ${metrics.engagement.dau.toLocaleString()}, MAU: ${metrics.engagement.mau.toLocaleString()}, Stickiness: ${(metrics.engagement.dauMauRatio * 100).toFixed(1)}%`);
        }

        if (metrics.monetization) {
            parts.push(`Revenue: $${metrics.monetization.totalRevenue.toLocaleString()}, ARPU: $${metrics.monetization.arpu.toFixed(2)}, Conversion: ${metrics.monetization.conversionRate.toFixed(2)}%`);
        }

        if (metrics.progression) {
            parts.push(`Max Level: ${metrics.progression.maxLevelReached}, Avg Level: ${metrics.progression.avgLevel.toFixed(1)}`);
            if (metrics.progression.difficultySpikes.length > 0) {
                parts.push(`Difficulty spikes at: ${metrics.progression.difficultySpikes.join(', ')}`);
            }
        }

        metricsSection = parts.join('\n');
    }

    let anomalySection = '';
    if (anomalies && anomalies.length > 0) {
        const topAnomalies = anomalies.slice(0, 5);
        anomalySection = `DETECTED ANOMALIES:
${topAnomalies.map(a => `- ${a.metric}: ${a.description} (${a.severity})`).join('\n')}`;
    }

    return `Analyze this ${gameType.toUpperCase()} game data and generate actionable insights.

${GAME_TYPE_CONTEXT[gameType]}

## Data Summary
- Total Users: ${dataSnapshot.totalUsers.toLocaleString()}
- Total Revenue: $${dataSnapshot.totalRevenue.toLocaleString()}
- Row Count: ${dataSnapshot.rowCount.toLocaleString()}
${dataSnapshot.dateRange ? `- Date Range: ${dataSnapshot.dateRange.start} to ${dataSnapshot.dateRange.end}` : ''}

## Available Data Columns
${availableColumns}

${metricsSection ? `## Calculated Metrics\n${metricsSection}` : ''}

${anomalySection}

${aggregations ? `## Additional Aggregations\n${JSON.stringify(aggregations, null, 2)}` : ''}

## Response Format
Respond with this exact JSON structure:
{
  "insights": [
    {
      "type": "positive|negative|neutral|warning|opportunity",
      "category": "retention|monetization|engagement|progression|quality",
      "title": "Brief title (max 60 chars)",
      "description": "1-2 sentence finding with specific numbers",
      "metric": "relevant_metric_name",
      "value": "the key number or percentage",
      "change": -5.2,
      "priority": 8,
      "recommendation": "Specific actionable step to take",
      "confidence": 0.85,
      "evidence": ["Supporting data point 1", "Supporting data point 2"]
    }
  ],
  "summary": "2-3 sentence executive summary of the game's health",
  "topPriority": "The single most important action to take right now"
}

Generate 5-8 insights, prioritized by potential impact. Include at least one insight for retention, monetization, and engagement if data is available.`;
}

// ============ RESPONSE SCHEMA ============

export interface InsightResponseSchema {
    insights: {
        type: 'positive' | 'negative' | 'neutral' | 'warning' | 'opportunity';
        category: 'retention' | 'monetization' | 'engagement' | 'progression' | 'quality';
        title: string;
        description: string;
        metric?: string;
        value?: string | number;
        change?: number;
        priority: number;
        recommendation?: string;
        confidence: number;
        evidence?: string[];
    }[];
    summary: string;
    topPriority?: string;
}

// ============ RESPONSE VALIDATION ============

export function validateInsightResponse(response: unknown): InsightResponseSchema | null {
    if (!response || typeof response !== 'object') return null;

    const obj = response as Record<string, unknown>;

    if (!Array.isArray(obj.insights)) return null;

    // Validate each insight
    const validInsights = obj.insights
        .filter((insight): insight is InsightResponseSchema['insights'][0] => {
            if (!insight || typeof insight !== 'object') return false;
            const i = insight as Record<string, unknown>;
            return (
                typeof i.type === 'string' &&
                typeof i.title === 'string' &&
                typeof i.description === 'string' &&
                typeof i.priority === 'number' &&
                typeof i.confidence === 'number'
            );
        })
        .map(insight => ({
            ...insight,
            // Ensure type is valid
            type: ['positive', 'negative', 'neutral', 'warning', 'opportunity'].includes(insight.type)
                ? insight.type
                : 'neutral',
            // Ensure category is valid
            category: ['retention', 'monetization', 'engagement', 'progression', 'quality'].includes(insight.category)
                ? insight.category
                : 'engagement',
            // Clamp priority
            priority: Math.max(1, Math.min(10, insight.priority)),
            // Clamp confidence
            confidence: Math.max(0, Math.min(1, insight.confidence)),
        }));

    if (validInsights.length === 0) return null;

    return {
        insights: validInsights,
        summary: typeof obj.summary === 'string' ? obj.summary : 'Analysis complete.',
        topPriority: typeof obj.topPriority === 'string' ? obj.topPriority : undefined,
    };
}
