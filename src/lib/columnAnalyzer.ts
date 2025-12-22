/**
 * Column Analyzer - LLM-first with fuzzy matching fallback
 */

import { analyzeColumns, ColumnMapping, SchemaAnalysisResult, OpenAIConfig } from '../services/openai';

/**
 * Column aliases for fuzzy matching fallback
 */
const COLUMN_ALIASES: Record<string, string[]> = {
    user_id: ['user_id', 'userid', 'uid', 'player_id', 'playerid', 'player', 'account_id'],
    session_id: ['session_id', 'sessionid', 'session', 'game_session'],
    timestamp: ['timestamp', 'time', 'ts', 'datetime', 'created_at', 'event_time', 'date'],
    event_type: ['event_type', 'eventtype', 'event', 'action', 'event_name', 'type'],
    revenue: ['revenue', 'money', 'amount', 'price', 'iap_revenue', 'purchase_amount', 'usd'],
    level: ['level', 'lvl', 'stage', 'chapter', 'level_id', 'wave'],
    country: ['country', 'geo', 'region', 'location', 'country_code', 'nation'],
    platform: ['platform', 'os', 'device_os', 'operating_system'],
    device_model: ['device_model', 'device', 'model', 'device_type'],
    app_version: ['app_version', 'version', 'build', 'app_ver'],
};

/**
 * Main analyzer function - LLM first, fuzzy fallback
 */
export async function analyzeSchema(
    data: Record<string, unknown>[],
    config?: OpenAIConfig
): Promise<SchemaAnalysisResult> {
    const headers = Object.keys(data[0] || {});

    // If OpenAI key provided, use LLM analysis
    if (config?.apiKey) {
        try {
            const llmResult = await analyzeColumns(headers, data, config);

            // Validate with fuzzy matching for low confidence columns
            const validatedColumns = validateWithFuzzy(llmResult.columns);

            return { ...llmResult, columns: validatedColumns };
        } catch (error) {
            console.warn('LLM analysis failed, falling back to fuzzy matching:', error);
            // Fall through to fuzzy-only analysis
        }
    }

    // Fallback: fuzzy matching only
    return fuzzyOnlyAnalysis(data);
}

/**
 * Validate LLM results with fuzzy matching
 */
function validateWithFuzzy(columns: ColumnMapping[]): ColumnMapping[] {
    return columns.map(col => {
        if (col.confidence >= 0.8) {
            return col; // High confidence, keep as-is
        }

        // Try fuzzy matching
        const fuzzyResult = fuzzyMatch(col.original);

        if (fuzzyResult && fuzzyResult.confidence > col.confidence) {
            return {
                ...col,
                canonical: fuzzyResult.canonical,
                confidence: Math.max(col.confidence, fuzzyResult.confidence * 0.9), // Slight penalty
                reasoning: `${col.reasoning} (validated by pattern matching)`
            };
        }

        return col;
    });
}

/**
 * Fuzzy match a column name to canonical names
 */
function fuzzyMatch(original: string): { canonical: string; confidence: number } | null {
    const cleaned = original.toLowerCase().replace(/[-_\s]+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Direct match
    for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
        if (aliases.includes(cleaned)) {
            return { canonical, confidence: 1.0 };
        }
    }

    // Partial match
    for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
        for (const alias of aliases) {
            if (cleaned.includes(alias) || alias.includes(cleaned)) {
                const similarity = Math.min(cleaned.length, alias.length) / Math.max(cleaned.length, alias.length);
                if (similarity > 0.6) {
                    return { canonical, confidence: similarity };
                }
            }
        }
    }

    return null;
}

/**
 * Fuzzy-only analysis when LLM not available
 */
function fuzzyOnlyAnalysis(data: Record<string, unknown>[]): SchemaAnalysisResult {
    const headers = Object.keys(data[0] || {});

    const columns: ColumnMapping[] = headers.map(header => {
        const fuzzyResult = fuzzyMatch(header);
        const sampleValue = data[0]?.[header];
        const inferredType = inferType(sampleValue);

        if (fuzzyResult) {
            return {
                original: header,
                canonical: fuzzyResult.canonical,
                type: inferredType,
                role: getRoleFromCanonical(fuzzyResult.canonical),
                confidence: fuzzyResult.confidence * 0.8, // Penalty for no LLM
                reasoning: 'Matched by pattern'
            };
        }

        // Unknown column
        return {
            original: header,
            canonical: header.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            type: inferredType,
            role: isNoise(header) ? 'noise' : 'unknown',
            confidence: 0.3,
            reasoning: 'No pattern match found'
        };
    });

    return {
        columns,
        gameType: 'other',
        suggestedCharts: ['retention_curve', 'revenue_timeline'],
        warnings: ['Analysis done without AI - results may be less accurate'],
        dataQuality: 0.5
    };
}

/**
 * Infer JavaScript type from value
 */
function inferType(value: unknown): 'string' | 'number' | 'date' | 'boolean' | 'json' {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object' && value !== null) return 'json';
    if (typeof value === 'string') {
        // Check if date
        if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{10,13}$/.test(value)) {
            return 'date';
        }
        // Check if number
        if (!isNaN(Number(value)) && value.trim() !== '') {
            return 'number';
        }
    }
    return 'string';
}

/**
 * Get role from canonical name
 */
function getRoleFromCanonical(canonical: string): ColumnMapping['role'] {
    const roles: Record<string, ColumnMapping['role']> = {
        user_id: 'identifier',
        session_id: 'identifier',
        timestamp: 'timestamp',
        event_type: 'dimension',
        revenue: 'metric',
        level: 'dimension',
        country: 'dimension',
        platform: 'dimension',
        device_model: 'dimension',
        app_version: 'dimension',
    };
    return roles[canonical] || 'unknown';
}

/**
 * Check if column name looks like noise/debug
 */
function isNoise(header: string): boolean {
    const noisePatterns = ['debug', 'test', 'internal', '_id', 'hash', 'token', 'secret'];
    const lowerHeader = header.toLowerCase();
    return noisePatterns.some(p => lowerHeader.includes(p));
}

export type { ColumnMapping, SchemaAnalysisResult };
