/**
 * IndexedDB Data Store
 * Persists uploaded game data and custom profiles
 */

import { getDatabase, dbPut, dbGetAll, dbGet, dbDelete, generateId as dbGenerateId } from './db';

export interface GameData {
    id: string;
    name: string;
    type: 'puzzle' | 'idle' | 'battle_royale' | 'match3_meta' | 'gacha_rpg' | 'custom';
    uploadedAt: string;
    fileName: string;
    columnMappings: ColumnMapping[];
    rawData: Record<string, unknown>[];
    rowCount: number;
}

export interface ColumnMapping {
    originalName: string;
    canonicalName: string;
    role: 'identifier' | 'timestamp' | 'metric' | 'dimension' | 'noise' | 'unknown';
    dataType: 'string' | 'number' | 'boolean' | 'date';
}

export interface GameProfile {
    id: string;
    name: string;
    icon: string;
    type: GameData['type'];
    createdAt: string;
    dataId?: string;
}

/**
 * Initialize IndexedDB - now uses unified db module
 */
export async function initDB(): Promise<IDBDatabase> {
    return getDatabase();
}

/**
 * Save game data to IndexedDB
 */
export async function saveGameData(data: GameData): Promise<void> {
    return dbPut('gameData', data);
}

/**
 * Get all game data entries
 */
export async function getAllGameData(): Promise<GameData[]> {
    return dbGetAll('gameData');
}

/**
 * Get game data by ID
 */
export async function getGameData(id: string): Promise<GameData | undefined> {
    return dbGet('gameData', id);
}

/**
 * Delete game data by ID
 */
export async function deleteGameData(id: string): Promise<void> {
    return dbDelete('gameData', id);
}

/**
 * Save game profile
 */
export async function saveGameProfile(profile: GameProfile): Promise<void> {
    return dbPut('gameProfiles', profile);
}

/**
 * Get all game profiles
 */
export async function getAllGameProfiles(): Promise<GameProfile[]> {
    return dbGetAll('gameProfiles');
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return dbGenerateId();
}
