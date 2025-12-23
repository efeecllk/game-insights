/**
 * AI Analysis Test Script
 * Tests SchemaAnalyzer, GameTypeDetector, ChartSelector, InsightGenerator
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface ColumnInfo {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
    nullable: boolean;
    sampleValues: unknown[];
}

interface SchemaInfo {
    columns: ColumnInfo[];
    rowCount: number;
    sampleData: Record<string, unknown>[];
}

type SemanticType =
    | 'user_id' | 'session_id' | 'event_name' | 'timestamp'
    | 'revenue' | 'currency' | 'price' | 'quantity'
    | 'level' | 'score' | 'xp' | 'rank'
    | 'country' | 'platform' | 'device' | 'version'
    | 'retention_day' | 'cohort' | 'segment'
    | 'dau' | 'mau' | 'arpu' | 'ltv'
    | 'item_id' | 'item_name' | 'category'
    | 'funnel_step' | 'conversion'
    | 'error_type' | 'error_message'
    | 'moves' | 'booster' | 'lives'
    | 'prestige' | 'offline_reward' | 'upgrade'
    | 'rarity' | 'banner' | 'pull_type'
    | 'kills' | 'placement' | 'damage' | 'survival_time'
    | 'unknown';

interface ColumnMeaning {
    column: string;
    detectedType: ColumnInfo['type'];
    semanticType: SemanticType;
    confidence: number;
}

type GameCategory = 'puzzle' | 'idle' | 'battle_royale' | 'match3_meta' | 'gacha_rpg' | 'custom';

// Column patterns - UPDATED
const COLUMN_PATTERNS: Record<SemanticType, RegExp[]> = {
    user_id: [/user.*id/i, /player.*id/i, /uid/i, /^id$/i, /^userId$/i],
    session_id: [/session.*id/i, /^sid$/i, /match.*id/i],
    event_name: [/event.*name/i, /event.*type/i, /action/i, /^eventName$/i],
    timestamp: [/timestamp/i, /^date$/i, /^time$/i, /created.*at/i, /^ts$/i, /eventTime/i, /install.*date/i],
    revenue: [/revenue/i, /income/i, /earnings/i, /^rev$/i, /iap.*revenue/i],
    currency: [/currency/i, /^cur$/i, /gold/i, /gems/i, /coins/i, /gemsSpent/i, /goldEarned/i],
    price: [/price/i, /amount/i, /cost/i, /price.*usd/i],
    quantity: [/quantity/i, /^count$/i, /^qty$/i],
    level: [/^level$/i, /^lvl$/i, /player.*level/i],
    score: [/score/i, /points/i],
    xp: [/^xp$/i, /experience/i, /^exp$/i],
    rank: [/^rank$/i, /tier/i, /league/i],
    country: [/^country$/i, /^region$/i, /geo/i],
    platform: [/platform/i, /^os$/i, /device.*type/i],
    device: [/device/i, /model/i],
    version: [/version/i, /^ver$/i, /app.*version/i],
    retention_day: [/retention/i, /^d\d+$/i, /retention_d\d+/i],
    cohort: [/cohort/i],
    segment: [/segment/i, /group/i, /bucket/i],
    dau: [/^dau$/i, /daily.*active/i],
    mau: [/^mau$/i, /monthly.*active/i],
    arpu: [/^arpu$/i, /revenue.*per.*user/i],
    ltv: [/^ltv$/i, /lifetime.*value/i],
    item_id: [/item.*id/i, /product.*id/i, /sku/i, /transaction.*id/i],
    item_name: [/item.*name/i, /product.*name/i],
    category: [/category/i, /^type$/i, /^mode$/i, /upgradeType/i],
    funnel_step: [/step/i, /stage/i, /funnel/i],
    conversion: [/conversion/i, /converted/i],
    error_type: [/error.*type/i, /error.*code/i],
    error_message: [/error.*message/i, /error.*msg/i, /exception/i],
    // PUZZLE
    moves: [/moves/i, /attempts/i, /moves.*left/i],
    booster: [/booster/i, /powerup/i, /helper/i, /boosters.*used/i],
    lives: [/lives/i, /hearts/i, /energy/i],
    // IDLE
    prestige: [/prestige/i, /rebirth/i, /ascend/i],
    offline_reward: [/offline/i, /idle/i, /offlineMinutes/i],
    upgrade: [/upgrade/i, /enhance/i, /improve/i],
    // GACHA
    rarity: [/rarity/i, /^ssr$/i, /^sr$/i, /legendary/i, /epic/i],
    banner: [/banner/i, /summon/i, /bannerName/i],
    pull_type: [/pull/i, /gacha/i, /pullType/i],
    // BATTLE ROYALE
    kills: [/kills/i, /eliminations/i, /frags/i],
    placement: [/placement/i, /position/i, /standing/i],
    damage: [/damage/i, /dmg/i],
    survival_time: [/survival/i, /alive/i, /survivalTime/i],
    unknown: [],
};

// Game indicators - UPDATED
const GAME_INDICATORS: Record<GameCategory, { signals: SemanticType[]; weight: number }[]> = {
    puzzle: [
        { signals: ['moves', 'booster'], weight: 5 },
        { signals: ['level', 'score'], weight: 3 },
        { signals: ['lives'], weight: 3 },
        { signals: ['session_id'], weight: 1 },
    ],
    idle: [
        { signals: ['prestige'], weight: 5 },
        { signals: ['offline_reward'], weight: 5 },
        { signals: ['upgrade'], weight: 4 },
        { signals: ['currency'], weight: 3 },
        { signals: ['level'], weight: 1 },
    ],
    battle_royale: [
        { signals: ['placement', 'kills'], weight: 5 },
        { signals: ['damage', 'survival_time'], weight: 4 },
        { signals: ['rank'], weight: 3 },
        { signals: ['user_id'], weight: 1 },
    ],
    match3_meta: [
        { signals: ['moves', 'booster'], weight: 5 },
        { signals: ['level', 'score'], weight: 3 },
        { signals: ['item_id', 'category'], weight: 2 },
        { signals: ['revenue', 'price'], weight: 1 },
    ],
    gacha_rpg: [
        { signals: ['pull_type', 'banner'], weight: 5 },
        { signals: ['rarity'], weight: 5 },
        { signals: ['currency'], weight: 3 },
        { signals: ['level', 'xp'], weight: 2 },
        { signals: ['rank'], weight: 1 },
    ],
    custom: [],
};

// Parse CSV
function parseCSV(content: string): Record<string, unknown>[] {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    return lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, unknown> = {};
        headers.forEach((header, i) => {
            const val = values[i];
            if (val === '' || val === 'null') row[header] = null;
            else if (val === 'true') row[header] = true;
            else if (val === 'false') row[header] = false;
            else if (!isNaN(Number(val)) && val !== '') row[header] = Number(val);
            else row[header] = val;
        });
        return row;
    });
}

// Analyze schema
function analyzeSchema(data: Record<string, unknown>[]): SchemaInfo {
    if (data.length === 0) return { columns: [], rowCount: 0, sampleData: [] };

    const columns: ColumnInfo[] = Object.keys(data[0]).map(name => {
        const sampleValues = data.slice(0, 10).map(row => row[name]);
        const nonNull = sampleValues.filter(v => v !== null && v !== undefined);
        let type: ColumnInfo['type'] = 'unknown';

        if (nonNull.length > 0) {
            const first = nonNull[0];
            if (typeof first === 'number') type = 'number';
            else if (typeof first === 'boolean') type = 'boolean';
            else if (typeof first === 'string') {
                if (!isNaN(Date.parse(first)) && first.includes('-')) type = 'date';
                else type = 'string';
            }
        }

        return {
            name,
            type,
            nullable: sampleValues.some(v => v === null || v === undefined),
            sampleValues
        };
    });

    return { columns, rowCount: data.length, sampleData: data.slice(0, 10) };
}

// Analyze column meanings
function analyzeColumnMeanings(schema: SchemaInfo): ColumnMeaning[] {
    return schema.columns.map(col => {
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
        return {
            column: col.name,
            detectedType: col.type,
            semanticType: 'unknown' as SemanticType,
            confidence: 0,
        };
    });
}

// Detect game type
function detectGameType(meanings: ColumnMeaning[]): { gameType: GameCategory; confidence: number; reasons: string[] } {
    const semanticTypes = new Set(meanings.map(m => m.semanticType));
    const scores: Record<GameCategory, number> = {
        puzzle: 0, idle: 0, battle_royale: 0, match3_meta: 0, gacha_rpg: 0, custom: 0,
    };
    const reasons: Record<GameCategory, string[]> = {
        puzzle: [], idle: [], battle_royale: [], match3_meta: [], gacha_rpg: [], custom: [],
    };

    for (const [gameType, indicators] of Object.entries(GAME_INDICATORS)) {
        for (const { signals, weight } of indicators) {
            const matches = signals.filter(s => semanticTypes.has(s));
            if (matches.length > 0) {
                scores[gameType as GameCategory] += weight * matches.length;
                reasons[gameType as GameCategory].push(`Found ${matches.join(', ')} (weight: ${weight})`);
            }
        }
    }

    const entries = Object.entries(scores) as [GameCategory, number][];
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const [topType, topScore] = sorted[0];
    const [, secondScore] = sorted[1] || ['custom', 0];

    if (topScore === 0 || topScore - secondScore < 2) {
        return { gameType: 'custom', confidence: 0.3, reasons: ['No clear pattern detected'] };
    }

    const maxPossible = Math.max(...Object.values(GAME_INDICATORS).map(
        inds => inds.reduce((sum, i) => sum + i.weight * i.signals.length, 0)
    ));

    return {
        gameType: topType,
        confidence: Math.min((topScore / maxPossible) + 0.3, 0.95),
        reasons: reasons[topType],
    };
}

// Test datasets
const datasets = [
    { name: 'puzzle_game_events.csv', expected: 'puzzle' },
    { name: 'idle_clicker_events.csv', expected: 'idle' },
    { name: 'battle_royale_matches.json', expected: 'battle_royale' },
    { name: 'gacha_rpg_pulls.json', expected: 'gacha_rpg' },
    { name: 'iap_transactions.csv', expected: 'monetization' },
    { name: 'user_cohorts.csv', expected: 'cohort analysis' },
];

console.log('═'.repeat(80));
console.log('                    AI ANALYSIS TEST RESULTS');
console.log('═'.repeat(80));

const results: { name: string; columns: ColumnMeaning[]; detection: ReturnType<typeof detectGameType> }[] = [];

for (const dataset of datasets) {
    const filePath = path.join(__dirname, 'sample-data', dataset.name);
    const content = fs.readFileSync(filePath, 'utf-8');

    let data: Record<string, unknown>[];
    if (dataset.name.endsWith('.json')) {
        data = JSON.parse(content);
    } else {
        data = parseCSV(content);
    }

    const schema = analyzeSchema(data);
    const meanings = analyzeColumnMeanings(schema);
    const detection = detectGameType(meanings);

    results.push({ name: dataset.name, columns: meanings, detection });

    console.log(`\n📊 ${dataset.name}`);
    console.log('─'.repeat(60));
    console.log(`Rows: ${data.length}`);
    console.log(`\nDetected Columns:`);

    meanings.forEach(m => {
        const icon = m.semanticType !== 'unknown' ? '✓' : '?';
        console.log(`  ${icon} ${m.column}: ${m.semanticType} (${m.detectedType})`);
    });

    console.log(`\n🎮 Game Type Detection:`);
    console.log(`  Result: ${detection.gameType.toUpperCase()}`);
    console.log(`  Confidence: ${(detection.confidence * 100).toFixed(0)}%`);
    console.log(`  Expected: ${dataset.expected}`);
    console.log(`  Match: ${detection.gameType === dataset.expected || dataset.expected.includes(detection.gameType) ? '✅' : '⚠️'}`);

    if (detection.reasons.length > 0) {
        console.log(`  Reasons:`);
        detection.reasons.forEach(r => console.log(`    - ${r}`));
    }
}

console.log('\n' + '═'.repeat(80));
console.log('                         SUMMARY');
console.log('═'.repeat(80));

const summary = results.map(r => ({
    Dataset: r.name.replace('.csv', '').replace('.json', ''),
    Detected: r.detection.gameType,
    Confidence: `${(r.detection.confidence * 100).toFixed(0)}%`,
    Columns: r.columns.filter(c => c.semanticType !== 'unknown').length,
    Total: r.columns.length,
}));

console.table(summary);
