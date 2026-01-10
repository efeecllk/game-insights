/**
 * Sample Data Generator
 *
 * Provides example datasets for users to test the application
 * without uploading their own data.
 */

import type { ImportResult } from './importers';

export interface SampleDataset {
    id: string;
    name: string;
    description: string;
    gameType: string;
    rowCount: number;
    columns: string[];
}

/**
 * Available sample datasets
 */
export const sampleDatasets: SampleDataset[] = [
    {
        id: 'puzzle_game',
        name: 'Puzzle Game Analytics',
        description: 'Level progression, booster usage, and monetization data from a match-3 puzzle game',
        gameType: 'puzzle',
        rowCount: 500,
        columns: ['user_id', 'timestamp', 'event_type', 'level', 'score', 'boosters_used', 'revenue', 'platform', 'country'],
    },
    {
        id: 'idle_game',
        name: 'Idle Game Analytics',
        description: 'Prestige mechanics, offline progression, and session data from an idle clicker',
        gameType: 'idle',
        rowCount: 500,
        columns: ['user_id', 'timestamp', 'event_type', 'prestige_count', 'offline_earnings', 'session_length', 'revenue', 'platform'],
    },
    {
        id: 'gacha_rpg',
        name: 'Gacha RPG Analytics',
        description: 'Banner pulls, hero collection, and spender tier data from a gacha game',
        gameType: 'gacha_rpg',
        rowCount: 500,
        columns: ['user_id', 'timestamp', 'event_type', 'banner_id', 'pull_count', 'hero_rarity', 'revenue', 'spender_tier', 'country'],
    },
];

/**
 * Generate random user IDs
 */
function generateUserId(): string {
    return `user_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Generate random timestamp within last 30 days
 */
function generateTimestamp(): string {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const randomTime = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
    return new Date(randomTime).toISOString();
}

/**
 * Pick random item from array
 */
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate puzzle game sample data
 */
function generatePuzzleData(rowCount: number): Record<string, unknown>[] {
    const users = Array.from({ length: 100 }, generateUserId);
    const platforms = ['iOS', 'Android'];
    const countries = ['US', 'UK', 'DE', 'JP', 'KR', 'BR', 'IN'];
    const eventTypes = ['level_start', 'level_complete', 'level_fail', 'booster_used', 'purchase', 'session_start'];

    return Array.from({ length: rowCount }, () => {
        const eventType = pickRandom(eventTypes);
        const isPurchase = eventType === 'purchase';

        return {
            user_id: pickRandom(users),
            timestamp: generateTimestamp(),
            event_type: eventType,
            level: Math.floor(Math.random() * 100) + 1,
            score: Math.floor(Math.random() * 50000),
            boosters_used: eventType === 'booster_used' ? Math.floor(Math.random() * 3) + 1 : 0,
            revenue: isPurchase ? [0.99, 1.99, 4.99, 9.99, 19.99][Math.floor(Math.random() * 5)] : 0,
            platform: pickRandom(platforms),
            country: pickRandom(countries),
        };
    });
}

/**
 * Generate idle game sample data
 */
function generateIdleData(rowCount: number): Record<string, unknown>[] {
    const users = Array.from({ length: 100 }, generateUserId);
    const platforms = ['iOS', 'Android', 'Steam'];
    const eventTypes = ['session_start', 'session_end', 'prestige', 'purchase', 'offline_claim', 'upgrade'];

    return Array.from({ length: rowCount }, () => {
        const eventType = pickRandom(eventTypes);
        const isPurchase = eventType === 'purchase';

        return {
            user_id: pickRandom(users),
            timestamp: generateTimestamp(),
            event_type: eventType,
            prestige_count: Math.floor(Math.random() * 20),
            offline_earnings: eventType === 'offline_claim' ? Math.floor(Math.random() * 1000000) : 0,
            session_length: eventType === 'session_end' ? Math.floor(Math.random() * 1800) + 60 : 0,
            revenue: isPurchase ? [0.99, 2.99, 4.99, 9.99, 24.99][Math.floor(Math.random() * 5)] : 0,
            platform: pickRandom(platforms),
        };
    });
}

/**
 * Generate gacha RPG sample data
 */
function generateGachaData(rowCount: number): Record<string, unknown>[] {
    const users = Array.from({ length: 100 }, generateUserId);
    const countries = ['US', 'JP', 'KR', 'CN', 'TW', 'DE', 'UK'];
    const banners = ['luna_banner', 'kai_banner', 'nova_banner', 'limited_collab', 'standard'];
    const rarities = ['R', 'SR', 'SSR', 'UR'];
    const spenderTiers = ['F2P', 'Minnow', 'Dolphin', 'Whale'];
    const eventTypes = ['gacha_pull', 'purchase', 'quest_complete', 'pvp_battle', 'login'];

    return Array.from({ length: rowCount }, () => {
        const eventType = pickRandom(eventTypes);
        const isPurchase = eventType === 'purchase';
        const isGacha = eventType === 'gacha_pull';

        return {
            user_id: pickRandom(users),
            timestamp: generateTimestamp(),
            event_type: eventType,
            banner_id: isGacha ? pickRandom(banners) : null,
            pull_count: isGacha ? [1, 10][Math.floor(Math.random() * 2)] : 0,
            hero_rarity: isGacha ? pickRandom(rarities) : null,
            revenue: isPurchase ? [0.99, 4.99, 9.99, 29.99, 99.99][Math.floor(Math.random() * 5)] : 0,
            spender_tier: pickRandom(spenderTiers),
            country: pickRandom(countries),
        };
    });
}

/**
 * Generate sample data for a specific dataset
 */
export function generateSampleData(datasetId: string): ImportResult {
    const dataset = sampleDatasets.find((d) => d.id === datasetId);
    if (!dataset) {
        throw new Error(`Unknown dataset: ${datasetId}`);
    }

    let data: Record<string, unknown>[];

    switch (datasetId) {
        case 'puzzle_game':
            data = generatePuzzleData(dataset.rowCount);
            break;
        case 'idle_game':
            data = generateIdleData(dataset.rowCount);
            break;
        case 'gacha_rpg':
            data = generateGachaData(dataset.rowCount);
            break;
        default:
            data = generatePuzzleData(dataset.rowCount);
    }

    return {
        success: true,
        data,
        columns: dataset.columns,
        rowCount: dataset.rowCount,
        errors: [],
        warnings: ['This is sample data generated for demonstration purposes'],
        metadata: {
            source: 'file' as const,
            format: 'sample',
            fileName: `${dataset.name}.csv`,
            processingTimeMs: 0,
            importedAt: new Date().toISOString(),
        },
    };
}

/**
 * Expected columns for each game type - useful for guidance
 */
export const expectedColumnsByGameType: Record<string, { required: string[]; optional: string[] }> = {
    puzzle: {
        required: ['user_id', 'timestamp', 'event_type'],
        optional: ['level', 'score', 'moves_used', 'boosters_used', 'revenue', 'platform', 'country', 'session_id'],
    },
    idle: {
        required: ['user_id', 'timestamp', 'event_type'],
        optional: ['prestige_count', 'offline_earnings', 'session_length', 'currency_earned', 'revenue', 'platform'],
    },
    battle_royale: {
        required: ['user_id', 'timestamp', 'event_type'],
        optional: ['match_id', 'rank', 'kills', 'damage_dealt', 'weapon_used', 'revenue', 'platform', 'region'],
    },
    match3_meta: {
        required: ['user_id', 'timestamp', 'event_type'],
        optional: ['level', 'chapter', 'story_progress', 'decoration_placed', 'revenue', 'platform', 'country'],
    },
    gacha_rpg: {
        required: ['user_id', 'timestamp', 'event_type'],
        optional: ['banner_id', 'pull_count', 'hero_rarity', 'hero_id', 'spender_tier', 'revenue', 'country'],
    },
    custom: {
        required: ['user_id', 'timestamp'],
        optional: ['event_type', 'revenue', 'platform', 'country', 'session_id'],
    },
};
