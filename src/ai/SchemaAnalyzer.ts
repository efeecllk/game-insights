/**
 * AI Schema Analyzer
 * Analyzes data schema and detects column meanings using AI/heuristics
 */

import { SchemaInfo, ColumnInfo } from '../adapters/BaseAdapter';

export interface ColumnMeaning {
    column: string;
    detectedType: ColumnInfo['type'];
    semanticType: SemanticType;
    confidence: number;
}

export type SemanticType =
    | 'user_id' | 'session_id' | 'event_name' | 'timestamp'
    | 'revenue' | 'currency' | 'price' | 'quantity'
    | 'level' | 'score' | 'xp' | 'rank'
    | 'country' | 'platform' | 'device' | 'version'
    | 'retention_day' | 'cohort' | 'segment'
    | 'dau' | 'mau' | 'arpu' | 'ltv'
    | 'item_id' | 'item_name' | 'category'
    | 'funnel_step' | 'conversion'
    | 'error_type' | 'error_message'
    // Puzzle/Match3 specific
    | 'moves' | 'booster' | 'lives'
    // Idle specific
    | 'prestige' | 'offline_reward' | 'upgrade'
    // Gacha specific
    | 'rarity' | 'banner' | 'pull_type'
    // Battle Royale specific
    | 'kills' | 'placement' | 'damage' | 'survival_time'
    | 'unknown';

// Known patterns for column detection
const COLUMN_PATTERNS: Record<SemanticType, RegExp[]> = {
    // User identification
    user_id: [/user.*id/i, /player.*id/i, /uid/i, /^id$/i, /^userId$/i],
    session_id: [/session.*id/i, /^sid$/i, /match.*id/i],
    event_name: [/event.*name/i, /event.*type/i, /action/i, /^eventName$/i],
    timestamp: [/timestamp/i, /^date$/i, /^time$/i, /created.*at/i, /^ts$/i, /eventTime/i, /install.*date/i],

    // Monetization
    revenue: [/revenue/i, /income/i, /earnings/i, /^rev$/i, /iap.*revenue/i],
    currency: [/currency/i, /^cur$/i, /gold/i, /gems/i, /coins/i, /gemsSpent/i, /goldEarned/i],
    price: [/price/i, /amount/i, /cost/i, /price.*usd/i],
    quantity: [/quantity/i, /^count$/i, /^qty$/i],

    // Progression
    level: [/^level$/i, /^lvl$/i, /player.*level/i, /upgrade.*level/i],
    score: [/score/i, /points/i],
    xp: [/^xp$/i, /experience/i, /^exp$/i],
    rank: [/^rank$/i, /tier/i, /league/i],

    // Demographics
    country: [/^country$/i, /^region$/i, /geo/i],
    platform: [/platform/i, /^os$/i, /device.*type/i],
    device: [/device/i, /model/i],
    version: [/version/i, /^ver$/i, /app.*version/i],

    // Retention & Cohort
    retention_day: [/retention/i, /^d\d+$/i, /retention_d\d+/i],
    cohort: [/cohort/i],
    segment: [/segment/i, /group/i, /bucket/i],

    // Metrics
    dau: [/^dau$/i, /daily.*active/i],
    mau: [/^mau$/i, /monthly.*active/i],
    arpu: [/^arpu$/i, /revenue.*per.*user/i],
    ltv: [/^ltv$/i, /lifetime.*value/i],

    // Items
    item_id: [/item.*id/i, /product.*id/i, /sku/i, /transaction.*id/i],
    item_name: [/item.*name/i, /product.*name/i],
    category: [/category/i, /^type$/i, /^mode$/i, /upgradeType/i],

    // Funnel
    funnel_step: [/step/i, /stage/i, /funnel/i],
    conversion: [/conversion/i, /converted/i],

    // Errors
    error_type: [/error.*type/i, /error.*code/i],
    error_message: [/error.*message/i, /error.*msg/i, /exception/i],

    // PUZZLE/MATCH3 SPECIFIC
    moves: [/moves/i, /attempts/i, /moves.*left/i],
    booster: [/booster/i, /powerup/i, /helper/i, /boosters.*used/i],
    lives: [/lives/i, /hearts/i, /energy/i],

    // IDLE SPECIFIC
    prestige: [/prestige/i, /rebirth/i, /ascend/i],
    offline_reward: [/offline/i, /idle/i, /away/i, /offlineMinutes/i],
    upgrade: [/upgrade/i, /enhance/i, /improve/i],

    // GACHA SPECIFIC
    rarity: [/rarity/i, /^ssr$/i, /^sr$/i, /^r$/i, /legendary/i, /epic/i, /rare/i],
    banner: [/banner/i, /summon/i, /bannerName/i],
    pull_type: [/pull/i, /gacha/i, /pullType/i],

    // BATTLE ROYALE SPECIFIC
    kills: [/kills/i, /eliminations/i, /frags/i],
    placement: [/placement/i, /position/i, /standing/i],
    damage: [/damage/i, /dmg/i],
    survival_time: [/survival/i, /alive/i, /survivalTime/i],

    unknown: [],
};

export class SchemaAnalyzer {
    /**
     * Analyze schema and detect column meanings
     */
    analyze(schema: SchemaInfo): ColumnMeaning[] {
        return schema.columns.map(col => this.analyzeColumn(col));
    }

    /**
     * Get suggested metrics based on detected columns
     */
    getSuggestedMetrics(meanings: ColumnMeaning[]): string[] {
        const metrics: string[] = [];
        const types = new Set(meanings.map(m => m.semanticType));

        if (types.has('revenue')) metrics.push('Total Revenue', 'ARPU', 'ARPPU');
        if (types.has('user_id')) metrics.push('DAU', 'MAU', 'New Users');
        if (types.has('session_id')) metrics.push('Sessions', 'Avg Session Length');
        if (types.has('retention_day')) metrics.push('Day 1 Retention', 'Day 7 Retention');
        if (types.has('level')) metrics.push('Level Distribution', 'Progression Speed');
        if (types.has('funnel_step')) metrics.push('Funnel Conversion', 'Drop-off Rate');
        if (types.has('error_type')) metrics.push('Error Rate', 'Crash-Free Users');

        return metrics.length > 0 ? metrics : ['Row Count', 'Unique Values'];
    }

    private analyzeColumn(col: ColumnInfo): ColumnMeaning {
        // Check patterns
        for (const [semantic, patterns] of Object.entries(COLUMN_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(col.name)) {
                    return {
                        column: col.name,
                        detectedType: col.type,
                        semanticType: semantic as SemanticType,
                        confidence: 0.85,
                    };
                }
            }
        }

        // Infer from data type and sample values
        return this.inferFromValues(col);
    }

    private inferFromValues(col: ColumnInfo): ColumnMeaning {
        const { name, type, sampleValues } = col;

        // Date columns
        if (type === 'date') {
            return { column: name, detectedType: type, semanticType: 'timestamp', confidence: 0.7 };
        }

        // Currency-like numbers
        if (type === 'number') {
            const hasDecimals = sampleValues.some(v =>
                typeof v === 'number' && v !== Math.floor(v)
            );
            if (hasDecimals && name.length <= 3) {
                return { column: name, detectedType: type, semanticType: 'price', confidence: 0.5 };
            }
        }

        // Country codes
        if (type === 'string') {
            const allTwoChars = sampleValues.every(v =>
                typeof v === 'string' && v.length === 2
            );
            if (allTwoChars) {
                return { column: name, detectedType: type, semanticType: 'country', confidence: 0.6 };
            }
        }

        return { column: name, detectedType: type, semanticType: 'unknown', confidence: 0 };
    }
}

export const schemaAnalyzer = new SchemaAnalyzer();
