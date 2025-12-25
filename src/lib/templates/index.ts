/**
 * Game Engine Templates
 * Pre-built column mappings and configurations for common game engine exports
 */

import type { GameCategory } from '../../types';

export interface ColumnTemplate {
    name: string;
    aliases: string[];
    semanticType: string;
    required: boolean;
}

export interface EngineTemplate {
    id: string;
    name: string;
    description: string;
    engine: string;
    columns: ColumnTemplate[];
    suggestedGameType: GameCategory;
    eventTypes?: string[];
    sampleFileName?: string;
}

/**
 * Unity Analytics Template
 */
export const unityAnalyticsTemplate: EngineTemplate = {
    id: 'unity-analytics',
    name: 'Unity Analytics',
    description: 'Standard Unity Analytics event export',
    engine: 'Unity',
    suggestedGameType: 'custom',
    columns: [
        { name: 'user_id', aliases: ['userId', 'playerId', 'player_id'], semanticType: 'user_id', required: true },
        { name: 'session_id', aliases: ['sessionId', 'session'], semanticType: 'session_id', required: false },
        { name: 'event_name', aliases: ['eventName', 'event', 'name'], semanticType: 'event_name', required: true },
        { name: 'timestamp', aliases: ['ts', 'time', 'datetime', 'event_time'], semanticType: 'timestamp', required: true },
        { name: 'platform', aliases: ['os', 'device_platform'], semanticType: 'platform', required: false },
        { name: 'app_version', aliases: ['version', 'appVersion', 'build'], semanticType: 'version', required: false },
        { name: 'country', aliases: ['geo_country', 'location'], semanticType: 'country', required: false },
        { name: 'device_model', aliases: ['deviceModel', 'model'], semanticType: 'device', required: false },
    ],
    eventTypes: [
        'app_start', 'app_stop', 'session_start', 'session_end',
        'level_start', 'level_complete', 'level_fail',
        'purchase', 'ad_impression', 'tutorial_complete'
    ],
    sampleFileName: 'unity_analytics_export.csv'
};

/**
 * Firebase Analytics Template
 */
export const firebaseAnalyticsTemplate: EngineTemplate = {
    id: 'firebase-analytics',
    name: 'Firebase Analytics',
    description: 'Firebase/Google Analytics for Games export',
    engine: 'Firebase',
    suggestedGameType: 'custom',
    columns: [
        { name: 'user_pseudo_id', aliases: ['user_id', 'userId'], semanticType: 'user_id', required: true },
        { name: 'event_name', aliases: ['eventName'], semanticType: 'event_name', required: true },
        { name: 'event_timestamp', aliases: ['timestamp', 'event_time'], semanticType: 'timestamp', required: true },
        { name: 'user_first_touch_timestamp', aliases: ['first_open_time'], semanticType: 'install_date', required: false },
        { name: 'platform', aliases: ['device.category'], semanticType: 'platform', required: false },
        { name: 'geo.country', aliases: ['country', 'geo_country'], semanticType: 'country', required: false },
        { name: 'app_info.version', aliases: ['version', 'app_version'], semanticType: 'version', required: false },
        { name: 'device.mobile_brand_name', aliases: ['device_brand'], semanticType: 'device', required: false },
        { name: 'event_value_in_usd', aliases: ['value', 'revenue'], semanticType: 'revenue', required: false },
    ],
    eventTypes: [
        'first_open', 'session_start', 'screen_view',
        'level_start', 'level_end', 'level_up',
        'spend_virtual_currency', 'earn_virtual_currency',
        'in_app_purchase', 'ad_impression'
    ],
    sampleFileName: 'firebase_export.json'
};

/**
 * GameAnalytics Template
 */
export const gameAnalyticsTemplate: EngineTemplate = {
    id: 'gameanalytics',
    name: 'GameAnalytics',
    description: 'GameAnalytics event export',
    engine: 'GameAnalytics',
    suggestedGameType: 'custom',
    columns: [
        { name: 'user_id', aliases: ['userId'], semanticType: 'user_id', required: true },
        { name: 'session_id', aliases: ['sessionId'], semanticType: 'session_id', required: false },
        { name: 'event', aliases: ['event_type', 'category'], semanticType: 'event_name', required: true },
        { name: 'ts', aliases: ['timestamp', 'client_ts'], semanticType: 'timestamp', required: true },
        { name: 'platform', aliases: ['os'], semanticType: 'platform', required: false },
        { name: 'build', aliases: ['version'], semanticType: 'version', required: false },
        { name: 'country_code', aliases: ['country'], semanticType: 'country', required: false },
        { name: 'manufacturer', aliases: ['device'], semanticType: 'device', required: false },
        { name: 'amount', aliases: ['value', 'revenue'], semanticType: 'revenue', required: false },
    ],
    eventTypes: [
        'user', 'session_end', 'business', 'resource',
        'progression', 'design', 'error'
    ]
};

/**
 * PlayFab Template
 */
export const playFabTemplate: EngineTemplate = {
    id: 'playfab',
    name: 'PlayFab',
    description: 'PlayFab PlayStream event export',
    engine: 'PlayFab',
    suggestedGameType: 'custom',
    columns: [
        { name: 'PlayerId', aliases: ['player_id', 'EntityId'], semanticType: 'user_id', required: true },
        { name: 'EventName', aliases: ['event_name', 'Name'], semanticType: 'event_name', required: true },
        { name: 'Timestamp', aliases: ['EventTimestamp', 'ts'], semanticType: 'timestamp', required: true },
        { name: 'TitleId', aliases: ['title_id'], semanticType: 'game_id', required: false },
        { name: 'Platform', aliases: ['DeviceType'], semanticType: 'platform', required: false },
        { name: 'Location.CountryCode', aliases: ['country'], semanticType: 'country', required: false },
    ],
    eventTypes: [
        'player_logged_in', 'player_created', 'player_statistic_changed',
        'player_virtual_currency_balance_changed', 'player_inventory_item_added',
        'player_real_money_purchase', 'player_started_session'
    ]
};

/**
 * Godot Custom Analytics Template
 */
export const godotTemplate: EngineTemplate = {
    id: 'godot',
    name: 'Godot Custom Analytics',
    description: 'Common patterns for Godot game analytics',
    engine: 'Godot',
    suggestedGameType: 'custom',
    columns: [
        { name: 'player_id', aliases: ['user_id', 'id'], semanticType: 'user_id', required: true },
        { name: 'event', aliases: ['event_type', 'type'], semanticType: 'event_name', required: true },
        { name: 'timestamp', aliases: ['time', 'ts'], semanticType: 'timestamp', required: true },
        { name: 'level', aliases: ['current_level', 'stage'], semanticType: 'level', required: false },
        { name: 'score', aliases: ['points'], semanticType: 'score', required: false },
        { name: 'session_time', aliases: ['playtime', 'duration'], semanticType: 'session_duration', required: false },
    ],
    eventTypes: ['level_start', 'level_complete', 'game_over', 'purchase', 'achievement']
};

/**
 * Generic Mobile Game Template
 */
export const mobileGameTemplate: EngineTemplate = {
    id: 'mobile-generic',
    name: 'Generic Mobile Game',
    description: 'Common patterns for mobile game analytics',
    engine: 'Generic',
    suggestedGameType: 'custom',
    columns: [
        { name: 'user_id', aliases: ['player_id', 'userId', 'playerId', 'id'], semanticType: 'user_id', required: true },
        { name: 'event', aliases: ['event_name', 'event_type', 'action'], semanticType: 'event_name', required: true },
        { name: 'timestamp', aliases: ['time', 'ts', 'datetime', 'date'], semanticType: 'timestamp', required: true },
        { name: 'session_id', aliases: ['sessionId', 'session'], semanticType: 'session_id', required: false },
        { name: 'level', aliases: ['current_level', 'stage', 'wave'], semanticType: 'level', required: false },
        { name: 'score', aliases: ['points', 'xp'], semanticType: 'score', required: false },
        { name: 'revenue', aliases: ['amount', 'price', 'value', 'usd'], semanticType: 'revenue', required: false },
        { name: 'currency', aliases: ['coins', 'gems', 'gold'], semanticType: 'currency', required: false },
        { name: 'platform', aliases: ['os', 'device_os'], semanticType: 'platform', required: false },
        { name: 'country', aliases: ['geo', 'region', 'locale'], semanticType: 'country', required: false },
    ],
    eventTypes: [
        'session_start', 'session_end',
        'level_start', 'level_complete', 'level_fail',
        'purchase', 'ad_view', 'tutorial_step'
    ]
};

/**
 * All available templates
 */
export const engineTemplates: EngineTemplate[] = [
    unityAnalyticsTemplate,
    firebaseAnalyticsTemplate,
    gameAnalyticsTemplate,
    playFabTemplate,
    godotTemplate,
    mobileGameTemplate
];

/**
 * Find best matching template for given columns
 */
export function detectTemplate(columns: string[]): EngineTemplate | null {
    const columnLower = columns.map(c => c.toLowerCase());

    let bestMatch: EngineTemplate | null = null;
    let bestScore = 0;

    for (const template of engineTemplates) {
        let score = 0;

        for (const col of template.columns) {
            const allNames = [col.name, ...col.aliases].map(n => n.toLowerCase());

            for (const name of allNames) {
                if (columnLower.includes(name)) {
                    score += col.required ? 3 : 1;
                    break;
                }
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = template;
        }
    }

    // Require at least 3 points (1 required column) to match
    return bestScore >= 3 ? bestMatch : null;
}

/**
 * Apply template mappings to columns
 */
export function applyTemplate(
    columns: string[],
    template: EngineTemplate
): Map<string, string> {
    const mappings = new Map<string, string>();
    const columnLower = columns.map(c => c.toLowerCase());

    for (const col of template.columns) {
        const allNames = [col.name, ...col.aliases].map(n => n.toLowerCase());

        for (let i = 0; i < columnLower.length; i++) {
            if (allNames.includes(columnLower[i])) {
                mappings.set(columns[i], col.semanticType);
                break;
            }
        }
    }

    return mappings;
}
