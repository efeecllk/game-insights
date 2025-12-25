/**
 * Question Answering Prompts
 * System and user prompts for natural language data queries
 */

import { GameCategory } from '../../../types';
import { QAContext, QAResponse } from '../types';

// ============ SYSTEM PROMPT ============

export const QA_SYSTEM_PROMPT = `You are a data analyst assistant for a game analytics platform. You help users understand their game data by answering natural language questions.

Your capabilities:
1. Interpret questions about metrics, trends, and player behavior
2. Generate query logic to answer questions (filters, aggregations, groupings)
3. Explain findings in plain language with supporting data
4. Suggest related questions for deeper analysis

Rules:
- If a question cannot be answered with available data, explain what's missing
- Always show confidence levels for interpretations
- Be concise but informative
- Reference specific column names when relevant
- Suggest 2-3 related follow-up questions

You respond ONLY with valid JSON matching the specified schema.`;

// ============ SUGGESTED QUESTIONS BY GAME TYPE ============

export const SUGGESTED_QUESTIONS: Record<GameCategory, string[]> = {
    puzzle: [
        "What's my D7 retention this week?",
        "Which level has the highest failure rate?",
        "How much revenue did boosters generate?",
        "Compare iOS vs Android retention",
        "What's the average session length?",
        "At what level do most players quit?",
    ],
    idle: [
        "How many users reached prestige 2?",
        "What's the average offline time?",
        "Which upgrades are most purchased?",
        "What's the currency inflation rate?",
        "How long until first prestige on average?",
    ],
    battle_royale: [
        "What's the average kills per match?",
        "How long do matches typically last?",
        "What's the most used weapon?",
        "What percentage of players get a kill?",
        "Compare engagement by platform",
    ],
    match3_meta: [
        "What's the story completion rate?",
        "How much revenue comes from decoration purchases?",
        "Which levels have the highest booster usage?",
        "What's the meta engagement rate?",
    ],
    gacha_rpg: [
        "What's the SSR pull rate?",
        "How much did the latest banner earn?",
        "What percentage of users hit pity?",
        "Who are my top spenders?",
        "What's the average pulls per user?",
    ],
    custom: [
        "What's my total user count?",
        "What's the overall revenue?",
        "How is engagement trending?",
        "What's my best performing metric?",
    ],
};

// ============ BUILD USER PROMPT ============

export function buildQAUserPrompt(question: string, context: QAContext): string {
    const columnsInfo = context.columns
        .map(c => `${c.name} (${c.semanticType})`)
        .join(', ');

    const sampleData = context.sampleRows.length > 0
        ? JSON.stringify(context.sampleRows.slice(0, 2), null, 2)
        : 'No sample data available';

    return `Answer this question about the game data:

"${question}"

## Available Data
Game Type: ${context.gameType}
Columns: ${columnsInfo}

Sample values:
${sampleData}

Data statistics:
- Total rows: ${context.rowCount.toLocaleString()}
${context.dateRange ? `- Date range: ${context.dateRange.start} to ${context.dateRange.end}` : ''}
- Available metrics: ${context.availableMetrics.join(', ') || 'None pre-calculated'}

## Response Format
Respond with this exact JSON structure:
{
  "answer": "Clear, plain language answer to the question with specific numbers",
  "methodology": "Brief explanation of how you arrived at this answer",
  "queryLogic": {
    "filters": [{ "column": "column_name", "operator": "=|!=|>|<|>=|<=|contains", "value": "value" }],
    "aggregations": [{ "column": "column_name", "function": "sum|avg|count|max|min" }],
    "groupBy": ["column1", "column2"]
  },
  "dataPoints": [
    { "label": "Metric name", "value": "123 or 45%", "context": "Brief explanation" }
  ],
  "confidence": 0.85,
  "relatedQuestions": ["Follow-up question 1?", "Follow-up question 2?"],
  "limitations": "Any caveats or limitations of this answer"
}

If the question cannot be answered with the available data, set confidence to 0 and explain in "limitations".`;
}

// ============ QUESTION PATTERNS ============

interface QuestionPattern {
    pattern: RegExp;
    type: 'retention' | 'revenue' | 'engagement' | 'comparison' | 'trend' | 'funnel' | 'count';
    extractors?: { group: number; name: string }[];
}

export const QUESTION_PATTERNS: QuestionPattern[] = [
    // Retention questions
    { pattern: /what('?s| is) (my |the )?retention/i, type: 'retention' },
    { pattern: /how many users? (returned|came back)/i, type: 'retention' },
    { pattern: /d(\d+) retention/i, type: 'retention', extractors: [{ group: 1, name: 'day' }] },

    // Revenue questions
    { pattern: /how much revenue/i, type: 'revenue' },
    { pattern: /total revenue/i, type: 'revenue' },
    { pattern: /(arpu|arppu|ltv)/i, type: 'revenue' },
    { pattern: /how much (did|does) .+ (earn|make|generate)/i, type: 'revenue' },

    // Engagement questions
    { pattern: /how many (users?|players?)/i, type: 'count' },
    { pattern: /(dau|mau|wau)/i, type: 'engagement' },
    { pattern: /average session/i, type: 'engagement' },
    { pattern: /how (long|often)/i, type: 'engagement' },

    // Comparison questions
    { pattern: /compare (.+) (vs|versus|to|with|and) (.+)/i, type: 'comparison' },
    { pattern: /(.+) by (country|platform|version|device)/i, type: 'comparison' },
    { pattern: /difference between/i, type: 'comparison' },

    // Trend questions
    { pattern: /(trend|over time|last (week|month|year))/i, type: 'trend' },
    { pattern: /how (has|is) .+ (changed|changing|trending)/i, type: 'trend' },

    // Funnel questions
    { pattern: /which (level|stage|step) has (highest|most|lowest)/i, type: 'funnel' },
    { pattern: /(completion|conversion|drop.?off) rate/i, type: 'funnel' },
    { pattern: /where do (users?|players?) (quit|leave|churn)/i, type: 'funnel' },
];

export function detectQuestionType(question: string): QuestionPattern['type'] | 'unknown' {
    for (const { pattern, type } of QUESTION_PATTERNS) {
        if (pattern.test(question)) {
            return type;
        }
    }
    return 'unknown';
}

// ============ RESPONSE VALIDATION ============

export function validateQAResponse(response: unknown): QAResponse | null {
    if (!response || typeof response !== 'object') return null;

    const obj = response as Record<string, unknown>;

    if (typeof obj.answer !== 'string') return null;

    return {
        answer: obj.answer,
        methodology: typeof obj.methodology === 'string' ? obj.methodology : undefined,
        queryLogic: obj.queryLogic as QAResponse['queryLogic'],
        dataPoints: Array.isArray(obj.dataPoints)
            ? obj.dataPoints.filter(
                (dp): dp is QAResponse['dataPoints'][0] =>
                    dp && typeof dp === 'object' &&
                    typeof (dp as Record<string, unknown>).label === 'string' &&
                    typeof (dp as Record<string, unknown>).value === 'string'
            )
            : [],
        confidence: typeof obj.confidence === 'number'
            ? Math.max(0, Math.min(1, obj.confidence))
            : 0.5,
        relatedQuestions: Array.isArray(obj.relatedQuestions)
            ? obj.relatedQuestions.filter((q): q is string => typeof q === 'string')
            : [],
        limitations: typeof obj.limitations === 'string' ? obj.limitations : undefined,
    };
}
