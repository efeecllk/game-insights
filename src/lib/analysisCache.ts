/**
 * Analysis Cache - Caches AI analysis results in IndexedDB
 * Prevents re-analysis on page navigation
 * Phase 1: Core Data Integration
 */

import { dbGet, dbPut, dbDelete, dbGetAll } from './db';
import { AnalysisResult } from '@/hooks/useGameData';

export interface CachedAnalysis {
    id: string;
    dataId: string;
    timestamp: number;
    result: AnalysisResult;
    version: string;
    dataHash?: string; // Hash of data for cache invalidation
}

const CACHE_STORE = 'analysisCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_VERSION = '1.0';

/**
 * Generate a simple hash for cache invalidation
 */
function generateDataHash(data: Record<string, unknown>[]): string {
    if (!data || data.length === 0) return '';

    // Use first row, last row, and row count for quick comparison
    const sample = {
        first: data[0],
        last: data[data.length - 1],
        count: data.length,
    };

    return btoa(JSON.stringify(sample)).slice(0, 32);
}

/**
 * Get cached analysis result for a data ID
 * Returns null if cache is expired or invalid
 */
export async function getCachedAnalysis(dataId: string): Promise<AnalysisResult | null> {
    try {
        const cached = await dbGet<CachedAnalysis>(CACHE_STORE, dataId);

        if (!cached) {
            return null;
        }

        // Check if cache is expired
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            // Clean up expired cache
            await dbDelete(CACHE_STORE, dataId);
            return null;
        }

        // Check version compatibility
        if (cached.version !== CACHE_VERSION) {
            await dbDelete(CACHE_STORE, dataId);
            return null;
        }

        return cached.result;
    } catch (error) {
        console.error('Failed to get cached analysis:', error);
        return null;
    }
}

/**
 * Get cached analysis with data validation
 * Also checks if the data has changed since caching
 */
export async function getCachedAnalysisWithValidation(
    dataId: string,
    currentData: Record<string, unknown>[]
): Promise<AnalysisResult | null> {
    try {
        const cached = await dbGet<CachedAnalysis>(CACHE_STORE, dataId);

        if (!cached) {
            return null;
        }

        // Check if data has changed
        const currentHash = generateDataHash(currentData);
        if (cached.dataHash && cached.dataHash !== currentHash) {
            // Data has changed, invalidate cache
            await dbDelete(CACHE_STORE, dataId);
            return null;
        }

        // Check if cache is expired
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            await dbDelete(CACHE_STORE, dataId);
            return null;
        }

        return cached.result;
    } catch (error) {
        console.error('Failed to get cached analysis:', error);
        return null;
    }
}

/**
 * Save analysis result to cache
 */
export async function setCachedAnalysis(
    dataId: string,
    result: AnalysisResult,
    data?: Record<string, unknown>[]
): Promise<void> {
    try {
        const cached: CachedAnalysis = {
            id: dataId,
            dataId,
            timestamp: Date.now(),
            result,
            version: CACHE_VERSION,
            dataHash: data ? generateDataHash(data) : undefined,
        };

        await dbPut(CACHE_STORE, cached);
    } catch (error) {
        console.error('Failed to cache analysis:', error);
        // Don't throw - caching failure shouldn't break the app
    }
}

/**
 * Invalidate cache for a specific data ID
 */
export async function invalidateCache(dataId: string): Promise<void> {
    try {
        await dbDelete(CACHE_STORE, dataId);
    } catch (error) {
        console.error('Failed to invalidate cache:', error);
    }
}

/**
 * Clear all cached analyses
 */
export async function clearAllCaches(): Promise<void> {
    try {
        const allCaches = await dbGetAll<CachedAnalysis>(CACHE_STORE);
        await Promise.all(allCaches.map(c => dbDelete(CACHE_STORE, c.id)));
    } catch (error) {
        console.error('Failed to clear caches:', error);
    }
}

/**
 * Clean up expired caches (call periodically)
 */
export async function cleanupExpiredCaches(): Promise<number> {
    try {
        const allCaches = await dbGetAll<CachedAnalysis>(CACHE_STORE);
        const now = Date.now();
        let cleaned = 0;

        for (const cache of allCaches) {
            if (now - cache.timestamp > CACHE_TTL || cache.version !== CACHE_VERSION) {
                await dbDelete(CACHE_STORE, cache.id);
                cleaned++;
            }
        }

        return cleaned;
    } catch (error) {
        console.error('Failed to cleanup caches:', error);
        return 0;
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
    totalCaches: number;
    expiredCaches: number;
    avgAge: number;
}> {
    try {
        const allCaches = await dbGetAll<CachedAnalysis>(CACHE_STORE);
        const now = Date.now();

        const expiredCaches = allCaches.filter(c =>
            now - c.timestamp > CACHE_TTL || c.version !== CACHE_VERSION
        ).length;

        const avgAge = allCaches.length > 0
            ? allCaches.reduce((sum, c) => sum + (now - c.timestamp), 0) / allCaches.length
            : 0;

        return {
            totalCaches: allCaches.length,
            expiredCaches,
            avgAge: avgAge / (1000 * 60 * 60), // Convert to hours
        };
    } catch (error) {
        console.error('Failed to get cache stats:', error);
        return { totalCaches: 0, expiredCaches: 0, avgAge: 0 };
    }
}
