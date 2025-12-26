/**
 * Game Store
 * Multi-game management for Phase 6
 */

import { dbPut, dbGetAll, dbGet, dbDelete, generateId } from './db';

// ============================================================================
// Types
// ============================================================================

export type GameGenre =
    | 'puzzle'
    | 'idle'
    | 'battle_royale'
    | 'match3_meta'
    | 'gacha_rpg'
    | 'casino'
    | 'simulation'
    | 'strategy'
    | 'sports'
    | 'racing'
    | 'action'
    | 'other';

export type GamePlatform = 'ios' | 'android' | 'web' | 'steam' | 'console' | 'cross_platform';

export interface Game {
    id: string;
    name: string;
    icon: string;
    genre: GameGenre;
    platform: GamePlatform;
    description?: string;
    bundleId?: string;
    appStoreUrl?: string;
    playStoreUrl?: string;

    // Settings
    timezone: string;
    currency: string;

    // Tracking
    isActive: boolean;
    isPinned: boolean;
    lastAccessedAt?: string;

    // Metadata
    createdAt: string;
    updatedAt: string;
}

export interface GameSettings {
    gameId: string;

    // Dashboard preferences
    defaultDashboardId?: string;
    dateRange: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days';

    // Notification settings
    alertsEnabled: boolean;
    dailyReportEnabled: boolean;
    weeklyReportEnabled: boolean;
    alertThresholds: {
        dauDropPercent: number;
        revenueDropPercent: number;
        retentionDropPercent: number;
    };

    // Integration settings
    connectedSources: string[];
}

// ============================================================================
// Store Operations
// ============================================================================

const GAMES_STORE = 'games';
const GAME_SETTINGS_STORE = 'gameSettings';

export async function saveGame(game: Game): Promise<void> {
    game.updatedAt = new Date().toISOString();
    return dbPut(GAMES_STORE, game);
}

export async function getGame(id: string): Promise<Game | undefined> {
    return dbGet(GAMES_STORE, id);
}

export async function getAllGames(): Promise<Game[]> {
    return dbGetAll(GAMES_STORE);
}

export async function deleteGame(id: string): Promise<void> {
    await dbDelete(GAMES_STORE, id);
    // Also delete settings
    await dbDelete(GAME_SETTINGS_STORE, id);
}

export async function saveGameSettings(settings: GameSettings): Promise<void> {
    return dbPut(GAME_SETTINGS_STORE, settings);
}

export async function getGameSettings(gameId: string): Promise<GameSettings | undefined> {
    return dbGet(GAME_SETTINGS_STORE, gameId);
}

// ============================================================================
// Game Creation
// ============================================================================

export function createGame(name: string, genre: GameGenre, options: Partial<Game> = {}): Game {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        name,
        icon: getGenreIcon(genre),
        genre,
        platform: options.platform || 'cross_platform',
        description: options.description,
        bundleId: options.bundleId,
        appStoreUrl: options.appStoreUrl,
        playStoreUrl: options.playStoreUrl,
        timezone: options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        currency: options.currency || 'USD',
        isActive: true,
        isPinned: options.isPinned || false,
        createdAt: now,
        updatedAt: now,
    };
}

export function createDefaultGameSettings(gameId: string): GameSettings {
    return {
        gameId,
        dateRange: 'last_7_days',
        alertsEnabled: true,
        dailyReportEnabled: false,
        weeklyReportEnabled: true,
        alertThresholds: {
            dauDropPercent: 20,
            revenueDropPercent: 30,
            retentionDropPercent: 15,
        },
        connectedSources: [],
    };
}

// ============================================================================
// Helpers
// ============================================================================

export function getGenreIcon(genre: GameGenre): string {
    const icons: Record<GameGenre, string> = {
        puzzle: '🧩',
        idle: '⏰',
        battle_royale: '🎯',
        match3_meta: '🍬',
        gacha_rpg: '⚔️',
        casino: '🎰',
        simulation: '🏗️',
        strategy: '♟️',
        sports: '⚽',
        racing: '🏎️',
        action: '💥',
        other: '🎮',
    };
    return icons[genre];
}

export function getGenreLabel(genre: GameGenre): string {
    const labels: Record<GameGenre, string> = {
        puzzle: 'Puzzle',
        idle: 'Idle / Clicker',
        battle_royale: 'Battle Royale',
        match3_meta: 'Match-3 + Meta',
        gacha_rpg: 'Gacha / RPG',
        casino: 'Casino / Slots',
        simulation: 'Simulation',
        strategy: 'Strategy',
        sports: 'Sports',
        racing: 'Racing',
        action: 'Action',
        other: 'Other',
    };
    return labels[genre];
}

export function getPlatformLabel(platform: GamePlatform): string {
    const labels: Record<GamePlatform, string> = {
        ios: 'iOS',
        android: 'Android',
        web: 'Web',
        steam: 'Steam',
        console: 'Console',
        cross_platform: 'Cross-Platform',
    };
    return labels[platform];
}

export const GENRE_OPTIONS: { value: GameGenre; label: string; icon: string }[] = [
    { value: 'puzzle', label: 'Puzzle', icon: '🧩' },
    { value: 'idle', label: 'Idle / Clicker', icon: '⏰' },
    { value: 'battle_royale', label: 'Battle Royale', icon: '🎯' },
    { value: 'match3_meta', label: 'Match-3 + Meta', icon: '🍬' },
    { value: 'gacha_rpg', label: 'Gacha / RPG', icon: '⚔️' },
    { value: 'casino', label: 'Casino / Slots', icon: '🎰' },
    { value: 'simulation', label: 'Simulation', icon: '🏗️' },
    { value: 'strategy', label: 'Strategy', icon: '♟️' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'racing', label: 'Racing', icon: '🏎️' },
    { value: 'action', label: 'Action', icon: '💥' },
    { value: 'other', label: 'Other', icon: '🎮' },
];

export const PLATFORM_OPTIONS: { value: GamePlatform; label: string }[] = [
    { value: 'ios', label: 'iOS' },
    { value: 'android', label: 'Android' },
    { value: 'web', label: 'Web' },
    { value: 'steam', label: 'Steam' },
    { value: 'console', label: 'Console' },
    { value: 'cross_platform', label: 'Cross-Platform' },
];

// ============================================================================
// Sample Games
// ============================================================================

export const SAMPLE_GAMES: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'Puzzle Saga',
        icon: '🧩',
        genre: 'puzzle',
        platform: 'cross_platform',
        description: 'A classic match-3 puzzle game with thousands of levels',
        timezone: 'America/New_York',
        currency: 'USD',
        isActive: true,
        isPinned: true,
    },
    {
        name: 'Idle Empire',
        icon: '⏰',
        genre: 'idle',
        platform: 'cross_platform',
        description: 'Build your empire while you sleep',
        timezone: 'America/New_York',
        currency: 'USD',
        isActive: true,
        isPinned: false,
    },
    {
        name: 'Battle Zone',
        icon: '🎯',
        genre: 'battle_royale',
        platform: 'cross_platform',
        description: '100-player battle royale action',
        timezone: 'America/New_York',
        currency: 'USD',
        isActive: true,
        isPinned: false,
    },
];

export async function initializeSampleGames(): Promise<void> {
    const existing = await getAllGames();
    if (existing.length > 0) return;

    const now = new Date().toISOString();
    for (const gameDef of SAMPLE_GAMES) {
        const game: Game = {
            id: generateId(),
            ...gameDef,
            createdAt: now,
            updatedAt: now,
        };
        await saveGame(game);
        await saveGameSettings(createDefaultGameSettings(game.id));
    }
}
