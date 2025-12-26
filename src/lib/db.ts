/**
 * Unified IndexedDB Module
 * Single source of truth for database initialization
 * Phase 5: Advanced AI & Automation
 */

export const DB_NAME = 'game-insights-db';
export const DB_VERSION = 6;

let db: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Get database connection (singleton with promise caching)
 */
export async function getDatabase(): Promise<IDBDatabase> {
    // Return existing connection if valid
    if (db) {
        try {
            // Test if connection is still alive
            db.transaction(['gameData'], 'readonly');
            return db;
        } catch {
            db = null;
            dbPromise = null;
        }
    }

    // Return existing promise if initialization in progress
    if (dbPromise) {
        return dbPromise;
    }

    // Create new connection
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            dbPromise = null;
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;

            // Handle connection close/error
            db.onclose = () => {
                db = null;
                dbPromise = null;
            };

            db.onerror = () => {
                console.error('Database error');
            };

            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Version 1: Game data stores
            if (!database.objectStoreNames.contains('gameData')) {
                const dataStore = database.createObjectStore('gameData', { keyPath: 'id' });
                dataStore.createIndex('name', 'name', { unique: false });
                dataStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
            }

            if (!database.objectStoreNames.contains('gameProfiles')) {
                const profileStore = database.createObjectStore('gameProfiles', { keyPath: 'id' });
                profileStore.createIndex('name', 'name', { unique: true });
            }

            // Version 2: Integration stores
            if (!database.objectStoreNames.contains('integrations')) {
                const integrationStore = database.createObjectStore('integrations', { keyPath: 'id' });
                integrationStore.createIndex('type', 'config.type', { unique: false });
                integrationStore.createIndex('status', 'status', { unique: false });
                integrationStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Version 3: Template stores (Phase 4)
            if (!database.objectStoreNames.contains('templates')) {
                const templateStore = database.createObjectStore('templates', { keyPath: 'id' });
                templateStore.createIndex('category', 'category', { unique: false });
                templateStore.createIndex('featured', 'featured', { unique: false });
                templateStore.createIndex('downloads', 'downloads', { unique: false });
                templateStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            if (!database.objectStoreNames.contains('templateReviews')) {
                const reviewStore = database.createObjectStore('templateReviews', { keyPath: 'id' });
                reviewStore.createIndex('templateId', 'templateId', { unique: false });
            }

            if (!database.objectStoreNames.contains('plugins')) {
                const pluginStore = database.createObjectStore('plugins', { keyPath: 'id' });
                pluginStore.createIndex('type', 'type', { unique: false });
                pluginStore.createIndex('enabled', 'enabled', { unique: false });
            }

            if (!database.objectStoreNames.contains('benchmarks')) {
                const benchmarkStore = database.createObjectStore('benchmarks', { keyPath: 'id' });
                benchmarkStore.createIndex('category', 'category', { unique: false });
                benchmarkStore.createIndex('gameType', 'gameType', { unique: false });
            }

            // Version 4: Integration Recipes (Phase 4)
            if (!database.objectStoreNames.contains('recipes')) {
                const recipeStore = database.createObjectStore('recipes', { keyPath: 'id' });
                recipeStore.createIndex('integrationType', 'integrationType', { unique: false });
                recipeStore.createIndex('difficulty', 'difficulty', { unique: false });
            }

            // Version 5: Alert system (Phase 5)
            if (!database.objectStoreNames.contains('alerts')) {
                const alertStore = database.createObjectStore('alerts', { keyPath: 'id' });
                alertStore.createIndex('type', 'type', { unique: false });
                alertStore.createIndex('severity', 'severity', { unique: false });
                alertStore.createIndex('status', 'status', { unique: false });
                alertStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            if (!database.objectStoreNames.contains('alertRules')) {
                const ruleStore = database.createObjectStore('alertRules', { keyPath: 'id' });
                ruleStore.createIndex('metric', 'metric', { unique: false });
                ruleStore.createIndex('enabled', 'enabled', { unique: false });
            }

            // Version 6: Experiments store (Phase 6)
            if (!database.objectStoreNames.contains('experiments')) {
                const experimentStore = database.createObjectStore('experiments', { keyPath: 'id' });
                experimentStore.createIndex('status', 'status', { unique: false });
                experimentStore.createIndex('type', 'type', { unique: false });
                experimentStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Custom dashboards (Phase 6)
            if (!database.objectStoreNames.contains('dashboards')) {
                const dashboardStore = database.createObjectStore('dashboards', { keyPath: 'id' });
                dashboardStore.createIndex('name', 'name', { unique: false });
                dashboardStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Custom funnels (Phase 6)
            if (!database.objectStoreNames.contains('funnels')) {
                const funnelStore = database.createObjectStore('funnels', { keyPath: 'id' });
                funnelStore.createIndex('name', 'name', { unique: false });
                funnelStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Multi-game management (Phase 6)
            if (!database.objectStoreNames.contains('games')) {
                const gamesStore = database.createObjectStore('games', { keyPath: 'id' });
                gamesStore.createIndex('name', 'name', { unique: false });
                gamesStore.createIndex('genre', 'genre', { unique: false });
                gamesStore.createIndex('isActive', 'isActive', { unique: false });
                gamesStore.createIndex('isPinned', 'isPinned', { unique: false });
            }

            if (!database.objectStoreNames.contains('gameSettings')) {
                database.createObjectStore('gameSettings', { keyPath: 'gameId' });
            }
        };
    });

    return dbPromise;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        dbPromise = null;
    }
}

/**
 * Generic CRUD helper for any object store
 */
export async function dbPut<T>(storeName: string, data: T): Promise<void> {
    const database = await getDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function dbGetAll<T>(storeName: string): Promise<T[]> {
    const database = await getDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function dbGet<T>(storeName: string, id: string): Promise<T | undefined> {
    const database = await getDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function dbDelete(storeName: string, id: string): Promise<void> {
    const database = await getDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function dbGetByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey
): Promise<T[]> {
    const database = await getDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
