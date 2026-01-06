/**
 * OpenAI Service - API wrapper for AI operations
 * Handles column analysis and insight generation
 */

export interface ColumnMapping {
    original: string;
    canonical: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'json';
    role: 'identifier' | 'timestamp' | 'metric' | 'dimension' | 'noise' | 'unknown';
    confidence: number;
    reasoning: string;
}

export interface SchemaAnalysisResult {
    columns: ColumnMapping[];
    gameType: string;
    suggestedCharts: string[];
    warnings: string[];
    dataQuality: number;
}

export interface OpenAIConfig {
    apiKey: string;
    model?: string;
    signal?: AbortSignal;
}

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Analyze column headers using LLM
 */
export async function analyzeColumns(
    headers: string[],
    sampleData: Record<string, unknown>[],
    config: OpenAIConfig
): Promise<SchemaAnalysisResult> {
    const prompt = buildAnalysisPrompt(headers, sampleData);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model || DEFAULT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are a game analytics expert. Analyze dataset columns and respond ONLY with valid JSON.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' }
            }),
            signal: config.signal,
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No response from OpenAI');
        }

        return JSON.parse(content) as SchemaAnalysisResult;
    } catch (error) {
        console.error('Column analysis failed:', error);
        throw error;
    }
}

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(
    headers: string[],
    sampleData: Record<string, unknown>[]
): string {
    return `
Analyze these column headers and sample data from a game analytics dataset.

HEADERS: ${headers.join(', ')}

SAMPLE DATA (first 3 rows):
${JSON.stringify(sampleData.slice(0, 3), null, 2)}

Respond with this exact JSON structure:
{
  "columns": [
    {
      "original": "original_column_name",
      "canonical": "standardized_name",
      "type": "string|number|date|boolean|json",
      "role": "identifier|timestamp|metric|dimension|noise|unknown",
      "confidence": 0.95,
      "reasoning": "Brief explanation"
    }
  ],
  "gameType": "puzzle|idle|battle_royale|match3_meta|gacha_rpg|other",
  "suggestedCharts": ["retention_curve", "level_funnel"],
  "warnings": ["Any data quality issues"],
  "dataQuality": 0.85
}

CANONICAL NAMES to use:
- user_id, session_id (identifiers)
- timestamp, event_time (time)
- event_type, action (events)
- revenue, purchase_amount (money)
- level, stage, chapter (progression)
- country, region (geography)
- platform, os, device_model (device)
- app_version (version)

ROLES:
- identifier: unique IDs (user, session, device)
- timestamp: date/time columns
- metric: numbers to aggregate (revenue, score)
- dimension: categories to group by (country, level)
- noise: debug/internal data to filter
- unknown: unclear purpose
`;
}

/**
 * Validate API key by making a minimal request
 */
export async function validateApiKey(apiKey: string, signal?: AbortSignal): Promise<boolean> {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            signal,
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Generate insights from processed data
 */
export async function generateInsights(
    summary: string,
    config: OpenAIConfig
): Promise<string[]> {
    const prompt = `
Based on this game analytics summary:
${summary}

Generate 3-5 actionable insights that are:
1. Specific (include numbers)
2. Actionable (what to do)
3. Prioritized (most impactful first)

Respond with JSON: { "insights": ["insight1", "insight2", ...] }
`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model || DEFAULT_MODEL,
                messages: [
                    { role: 'system', content: 'You are a game analytics expert.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                response_format: { type: 'json_object' }
            }),
            signal: config.signal,
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = JSON.parse(data.choices[0]?.message?.content || '{}');
        return content.insights || [];
    } catch (error) {
        console.error('Insight generation failed:', error);
        return [];
    }
}
