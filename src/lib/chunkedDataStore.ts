/**
 * Chunked Data Store
 * Stores large datasets in chunks for efficient memory usage
 * Supports streaming read/write operations
 */

import { getDatabase, generateId } from './db';
import type { ChunkData } from './importers/streamingCsvImporter';

// Chunk store name (uses gameData store with special structure)
const CHUNK_PREFIX = 'chunk_';

export interface DatasetMetadata {
    id: string;
    name: string;
    fileName: string;
    fileSize: number;
    rowCount: number;
    columns: string[];
    chunkCount: number;
    chunkSize: number;
    createdAt: string;
    gameType?: string;
    /** Is this a chunked dataset? */
    isChunked: boolean;
}

export interface DataChunk {
    id: string;
    datasetId: string;
    index: number;
    rows: Record<string, unknown>[];
    rowCount: number;
}

/**
 * Initialize chunk store (add to existing DB if not exists)
 * Note: Currently uses gameData store with prefixed keys
 * A dedicated dataChunks store will be added in a future DB version
 */
export async function ensureChunkStore(): Promise<void> {
    const db = await getDatabase();

    // Check if dataChunks store exists
    if (!db.objectStoreNames.contains('dataChunks')) {
        // Need to close and reopen with new version
        // For now, we'll use gameData store with prefixed keys
        console.log('Using gameData store for chunks (dataChunks store will be added in next DB version)');
    }
}

/**
 * Save a chunk to IndexedDB
 */
export async function saveChunk(datasetId: string, chunk: ChunkData): Promise<string> {
    const db = await getDatabase();
    const chunkId = `${CHUNK_PREFIX}${datasetId}_${chunk.index}`;

    const chunkRecord: DataChunk = {
        id: chunkId,
        datasetId,
        index: chunk.index,
        rows: chunk.rows,
        rowCount: chunk.rows.length
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['gameData'], 'readwrite');
        const store = transaction.objectStore('gameData');
        const request = store.put(chunkRecord);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(chunkId);
    });
}

/**
 * Get a specific chunk
 */
export async function getChunk(datasetId: string, index: number): Promise<DataChunk | null> {
    const db = await getDatabase();
    const chunkId = `${CHUNK_PREFIX}${datasetId}_${index}`;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['gameData'], 'readonly');
        const store = transaction.objectStore('gameData');
        const request = store.get(chunkId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Get all chunks for a dataset
 */
export async function getAllChunks(datasetId: string, chunkCount: number): Promise<DataChunk[]> {
    const chunks: DataChunk[] = [];

    for (let i = 0; i < chunkCount; i++) {
        const chunk = await getChunk(datasetId, i);
        if (chunk) {
            chunks.push(chunk);
        }
    }

    return chunks.sort((a, b) => a.index - b.index);
}

/**
 * Stream chunks with callback (memory efficient)
 */
export async function streamChunks(
    datasetId: string,
    chunkCount: number,
    onChunk: (chunk: DataChunk, index: number) => Promise<void>
): Promise<void> {
    for (let i = 0; i < chunkCount; i++) {
        const chunk = await getChunk(datasetId, i);
        if (chunk) {
            await onChunk(chunk, i);
        }
    }
}

/**
 * Get sample data from chunks (first N rows)
 */
export async function getSampleData(
    datasetId: string,
    chunkCount: number,
    sampleSize: number = 1000
): Promise<Record<string, unknown>[]> {
    const sample: Record<string, unknown>[] = [];

    for (let i = 0; i < chunkCount && sample.length < sampleSize; i++) {
        const chunk = await getChunk(datasetId, i);
        if (chunk) {
            const needed = sampleSize - sample.length;
            sample.push(...chunk.rows.slice(0, needed));
        }
    }

    return sample;
}

/**
 * Delete all chunks for a dataset
 */
export async function deleteChunks(datasetId: string, chunkCount: number): Promise<void> {
    const db = await getDatabase();

    const transaction = db.transaction(['gameData'], 'readwrite');
    const store = transaction.objectStore('gameData');

    const deletePromises: Promise<void>[] = [];

    for (let i = 0; i < chunkCount; i++) {
        const chunkId = `${CHUNK_PREFIX}${datasetId}_${i}`;
        deletePromises.push(
            new Promise((resolve, reject) => {
                const request = store.delete(chunkId);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            })
        );
    }

    await Promise.all(deletePromises);
}

/**
 * Save dataset with chunked storage
 */
export async function saveChunkedDataset(
    file: File,
    columns: string[],
    rowCount: number,
    chunkCount: number,
    gameType?: string
): Promise<DatasetMetadata> {
    const id = generateId();
    const metadata: DatasetMetadata = {
        id,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        fileName: file.name,
        fileSize: file.size,
        rowCount,
        columns,
        chunkCount,
        chunkSize: Math.ceil(rowCount / chunkCount),
        createdAt: new Date().toISOString(),
        gameType,
        isChunked: true
    };

    // Save metadata to gameData store
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['gameData'], 'readwrite');
        const store = transaction.objectStore('gameData');
        const request = store.put({
            ...metadata,
            // Don't store rawData for chunked datasets
            rawData: null,
            columnMappings: columns.map(col => ({
                originalName: col,
                canonicalName: col,
                role: 'unknown',
                dataType: 'string'
            })),
            type: gameType || 'custom',
            uploadedAt: metadata.createdAt
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(metadata);
    });
}

/**
 * Get dataset info (metadata only, no data)
 */
export async function getDatasetInfo(id: string): Promise<DatasetMetadata | null> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['gameData'], 'readonly');
        const store = transaction.objectStore('gameData');
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const result = request.result;
            if (!result) {
                resolve(null);
                return;
            }

            resolve({
                id: result.id,
                name: result.name,
                fileName: result.fileName,
                fileSize: result.fileSize || 0,
                rowCount: result.rowCount,
                columns: result.columns || result.columnMappings?.map((m: { originalName: string }) => m.originalName) || [],
                chunkCount: result.chunkCount || 1,
                chunkSize: result.chunkSize || result.rowCount,
                createdAt: result.uploadedAt || result.createdAt,
                gameType: result.type,
                isChunked: result.isChunked || false
            });
        };
    });
}

/**
 * Calculate storage usage
 */
export async function getStorageUsage(): Promise<{
    used: number;
    quota: number;
    percent: number;
}> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
            used: estimate.usage || 0,
            quota: estimate.quota || 0,
            percent: estimate.quota ? Math.round((estimate.usage || 0) / estimate.quota * 100) : 0
        };
    }

    // Fallback: rough estimate
    return {
        used: 0,
        quota: 0,
        percent: 0
    };
}

/**
 * Request persistent storage (prevents browser from evicting data)
 */
export async function requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
        return navigator.storage.persist();
    }
    return false;
}

export default {
    saveChunk,
    getChunk,
    getAllChunks,
    streamChunks,
    getSampleData,
    deleteChunks,
    saveChunkedDataset,
    getDatasetInfo,
    getStorageUsage,
    requestPersistentStorage
};
