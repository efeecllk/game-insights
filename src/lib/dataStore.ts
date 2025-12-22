/**
 * IndexedDB Data Store
 * Persists uploaded game data and custom profiles
 */

const DB_NAME = 'game-insights-db';
const DB_VERSION = 1;

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

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Game data store
            if (!database.objectStoreNames.contains('gameData')) {
                const dataStore = database.createObjectStore('gameData', { keyPath: 'id' });
                dataStore.createIndex('name', 'name', { unique: false });
                dataStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
            }

            // Game profiles store
            if (!database.objectStoreNames.contains('gameProfiles')) {
                const profileStore = database.createObjectStore('gameProfiles', { keyPath: 'id' });
                profileStore.createIndex('name', 'name', { unique: true });
            }
        };
    });
}

/**
 * Save game data to IndexedDB
 */
export async function saveGameData(data: GameData): Promise<void> {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(['gameData'], 'readwrite');
        const store = transaction.objectStore('gameData');
        const request = store.put(data);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get all game data entries
 */
export async function getAllGameData(): Promise<GameData[]> {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(['gameData'], 'readonly');
        const store = transaction.objectStore('gameData');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Get game data by ID
 */
export async function getGameData(id: string): Promise<GameData | undefined> {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(['gameData'], 'readonly');
        const store = transaction.objectStore('gameData');
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Delete game data by ID
 */
export async function deleteGameData(id: string): Promise<void> {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(['gameData'], 'readwrite');
        const store = transaction.objectStore('gameData');
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Save game profile
 */
export async function saveGameProfile(profile: GameProfile): Promise<void> {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(['gameProfiles'], 'readwrite');
        const store = transaction.objectStore('gameProfiles');
        const request = store.put(profile);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get all game profiles
 */
export async function getAllGameProfiles(): Promise<GameProfile[]> {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(['gameProfiles'], 'readonly');
        const store = transaction.objectStore('gameProfiles');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
