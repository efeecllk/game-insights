/**
 * Benchmark Store
 * Community aggregated metrics and comparisons
 * Phase 4: Community & Ecosystem
 */

import { dbPut, dbGetAll, dbGet, dbDelete, dbGetByIndex, generateId } from './db';
import type { GameCategory } from '../types';

// ============================================================================
// Types
// ============================================================================

export type BenchmarkCategory =
    | 'retention'
    | 'monetization'
    | 'engagement'
    | 'progression';

export type BenchmarkPlatform = 'ios' | 'android' | 'web' | 'pc' | 'console' | 'all';

export type MonetizationModel = 'free' | 'freemium' | 'premium' | 'subscription' | 'ads';

export interface BenchmarkMetric {
    name: string;
    value: number;
    unit: 'percentage' | 'currency' | 'seconds' | 'count' | 'ratio';
    percentile?: number; // Your position in community (0-100)
    trend?: 'up' | 'down' | 'stable';
    sampleSize: number;
}

export interface BenchmarkData {
    id: string;
    category: BenchmarkCategory;
    gameType: GameCategory;
    platform: BenchmarkPlatform;
    monetizationModel: MonetizationModel;

    // Metrics
    metrics: BenchmarkMetric[];

    // Statistics
    sampleSize: number;
    lastUpdated: string;

    // Segmentation
    gameAgeRange?: { min: number; max: number }; // Days since launch
    dauRange?: { min: number; max: number };
}

export interface RetentionBenchmarks {
    d1: { median: number; p25: number; p75: number; p90: number };
    d3: { median: number; p25: number; p75: number; p90: number };
    d7: { median: number; p25: number; p75: number; p90: number };
    d14: { median: number; p25: number; p75: number; p90: number };
    d30: { median: number; p25: number; p75: number; p90: number };
}

export interface MonetizationBenchmarks {
    arpu: { median: number; p25: number; p75: number; p90: number };
    arppu: { median: number; p25: number; p75: number; p90: number };
    conversionRate: { median: number; p25: number; p75: number; p90: number };
    ltv30: { median: number; p25: number; p75: number; p90: number };
}

export interface EngagementBenchmarks {
    dauMauRatio: { median: number; p25: number; p75: number; p90: number };
    avgSessionLength: { median: number; p25: number; p75: number; p90: number };
    sessionsPerDay: { median: number; p25: number; p75: number; p90: number };
    avgPlaytimePerDay: { median: number; p25: number; p75: number; p90: number };
}

export interface BenchmarkComparison {
    metric: string;
    yourValue: number;
    communityMedian: number;
    percentile: number;
    rating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
    insight: string;
}

export interface UserContribution {
    id: string;
    userId: string;
    gameType: GameCategory;
    platform: BenchmarkPlatform;
    monetizationModel: MonetizationModel;

    // Anonymized aggregates only
    retention: { d1?: number; d7?: number; d30?: number };
    monetization: { arpu?: number; conversionRate?: number };
    engagement: { dauMauRatio?: number; avgSessionLength?: number };

    contributedAt: string;
    gameAgeDays?: number;
}

// ============================================================================
// Benchmark Data (Community Aggregates)
// ============================================================================

/**
 * Default benchmark data from industry standards
 * These would be updated from community contributions
 */
export const DEFAULT_BENCHMARKS: Record<GameCategory, {
    retention: RetentionBenchmarks;
    monetization: MonetizationBenchmarks;
    engagement: EngagementBenchmarks;
}> = {
    puzzle: {
        retention: {
            d1: { median: 35, p25: 25, p75: 45, p90: 55 },
            d3: { median: 20, p25: 12, p75: 28, p90: 38 },
            d7: { median: 12, p25: 7, p75: 18, p90: 25 },
            d14: { median: 8, p25: 4, p75: 12, p90: 18 },
            d30: { median: 5, p25: 2, p75: 8, p90: 12 },
        },
        monetization: {
            arpu: { median: 0.08, p25: 0.03, p75: 0.15, p90: 0.30 },
            arppu: { median: 8.50, p25: 4.00, p75: 15.00, p90: 25.00 },
            conversionRate: { median: 2.5, p25: 1.0, p75: 4.0, p90: 6.0 },
            ltv30: { median: 0.35, p25: 0.15, p75: 0.60, p90: 1.00 },
        },
        engagement: {
            dauMauRatio: { median: 15, p25: 10, p75: 22, p90: 30 },
            avgSessionLength: { median: 8, p25: 4, p75: 12, p90: 18 },
            sessionsPerDay: { median: 3, p25: 2, p75: 5, p90: 7 },
            avgPlaytimePerDay: { median: 25, p25: 12, p75: 40, p90: 60 },
        },
    },
    idle: {
        retention: {
            d1: { median: 40, p25: 30, p75: 50, p90: 60 },
            d3: { median: 25, p25: 15, p75: 35, p90: 45 },
            d7: { median: 18, p25: 10, p75: 25, p90: 35 },
            d14: { median: 12, p25: 6, p75: 18, p90: 25 },
            d30: { median: 8, p25: 4, p75: 12, p90: 18 },
        },
        monetization: {
            arpu: { median: 0.12, p25: 0.05, p75: 0.22, p90: 0.40 },
            arppu: { median: 12.00, p25: 6.00, p75: 20.00, p90: 35.00 },
            conversionRate: { median: 3.0, p25: 1.5, p75: 5.0, p90: 8.0 },
            ltv30: { median: 0.50, p25: 0.20, p75: 0.90, p90: 1.50 },
        },
        engagement: {
            dauMauRatio: { median: 20, p25: 12, p75: 28, p90: 38 },
            avgSessionLength: { median: 5, p25: 2, p75: 10, p90: 15 },
            sessionsPerDay: { median: 5, p25: 3, p75: 8, p90: 12 },
            avgPlaytimePerDay: { median: 30, p25: 15, p75: 50, p90: 80 },
        },
    },
    battle_royale: {
        retention: {
            d1: { median: 30, p25: 20, p75: 40, p90: 50 },
            d3: { median: 18, p25: 10, p75: 26, p90: 35 },
            d7: { median: 10, p25: 5, p75: 16, p90: 24 },
            d14: { median: 6, p25: 3, p75: 10, p90: 16 },
            d30: { median: 4, p25: 2, p75: 7, p90: 11 },
        },
        monetization: {
            arpu: { median: 0.15, p25: 0.06, p75: 0.30, p90: 0.55 },
            arppu: { median: 18.00, p25: 8.00, p75: 30.00, p90: 50.00 },
            conversionRate: { median: 2.0, p25: 0.8, p75: 3.5, p90: 5.5 },
            ltv30: { median: 0.60, p25: 0.25, p75: 1.10, p90: 1.80 },
        },
        engagement: {
            dauMauRatio: { median: 12, p25: 7, p75: 18, p90: 25 },
            avgSessionLength: { median: 20, p25: 12, p75: 30, p90: 45 },
            sessionsPerDay: { median: 2, p25: 1, p75: 4, p90: 6 },
            avgPlaytimePerDay: { median: 45, p25: 25, p75: 70, p90: 100 },
        },
    },
    match3_meta: {
        retention: {
            d1: { median: 38, p25: 28, p75: 48, p90: 58 },
            d3: { median: 22, p25: 14, p75: 32, p90: 42 },
            d7: { median: 14, p25: 8, p75: 20, p90: 28 },
            d14: { median: 9, p25: 5, p75: 14, p90: 20 },
            d30: { median: 6, p25: 3, p75: 10, p90: 15 },
        },
        monetization: {
            arpu: { median: 0.10, p25: 0.04, p75: 0.20, p90: 0.38 },
            arppu: { median: 10.00, p25: 5.00, p75: 18.00, p90: 30.00 },
            conversionRate: { median: 3.0, p25: 1.2, p75: 5.0, p90: 7.5 },
            ltv30: { median: 0.45, p25: 0.18, p75: 0.80, p90: 1.30 },
        },
        engagement: {
            dauMauRatio: { median: 18, p25: 11, p75: 25, p90: 33 },
            avgSessionLength: { median: 10, p25: 5, p75: 15, p90: 22 },
            sessionsPerDay: { median: 4, p25: 2, p75: 6, p90: 9 },
            avgPlaytimePerDay: { median: 35, p25: 18, p75: 55, p90: 85 },
        },
    },
    gacha_rpg: {
        retention: {
            d1: { median: 42, p25: 32, p75: 52, p90: 62 },
            d3: { median: 28, p25: 18, p75: 38, p90: 48 },
            d7: { median: 20, p25: 12, p75: 28, p90: 38 },
            d14: { median: 14, p25: 8, p75: 20, p90: 28 },
            d30: { median: 10, p25: 5, p75: 15, p90: 22 },
        },
        monetization: {
            arpu: { median: 0.25, p25: 0.10, p75: 0.50, p90: 0.90 },
            arppu: { median: 25.00, p25: 12.00, p75: 45.00, p90: 80.00 },
            conversionRate: { median: 4.0, p25: 2.0, p75: 7.0, p90: 10.0 },
            ltv30: { median: 1.00, p25: 0.40, p75: 1.80, p90: 3.00 },
        },
        engagement: {
            dauMauRatio: { median: 25, p25: 15, p75: 35, p90: 45 },
            avgSessionLength: { median: 15, p25: 8, p75: 25, p90: 40 },
            sessionsPerDay: { median: 4, p25: 2, p75: 6, p90: 10 },
            avgPlaytimePerDay: { median: 55, p25: 30, p75: 90, p90: 130 },
        },
    },
    custom: {
        retention: {
            d1: { median: 35, p25: 25, p75: 45, p90: 55 },
            d3: { median: 20, p25: 12, p75: 28, p90: 38 },
            d7: { median: 12, p25: 7, p75: 18, p90: 25 },
            d14: { median: 8, p25: 4, p75: 12, p90: 18 },
            d30: { median: 5, p25: 2, p75: 8, p90: 12 },
        },
        monetization: {
            arpu: { median: 0.10, p25: 0.04, p75: 0.20, p90: 0.40 },
            arppu: { median: 10.00, p25: 5.00, p75: 18.00, p90: 30.00 },
            conversionRate: { median: 2.5, p25: 1.0, p75: 4.5, p90: 7.0 },
            ltv30: { median: 0.40, p25: 0.15, p75: 0.75, p90: 1.20 },
        },
        engagement: {
            dauMauRatio: { median: 15, p25: 10, p75: 22, p90: 30 },
            avgSessionLength: { median: 10, p25: 5, p75: 15, p90: 25 },
            sessionsPerDay: { median: 3, p25: 2, p75: 5, p90: 8 },
            avgPlaytimePerDay: { median: 30, p25: 15, p75: 50, p90: 80 },
        },
    },
};

// ============================================================================
// IndexedDB Operations
// ============================================================================

const STORE_NAME = 'benchmarks';
const CONTRIBUTIONS_STORE = 'benchmarkContributions';

export async function saveBenchmark(benchmark: BenchmarkData): Promise<void> {
    return dbPut(STORE_NAME, benchmark);
}

export async function getAllBenchmarks(): Promise<BenchmarkData[]> {
    return dbGetAll(STORE_NAME);
}

export async function getBenchmark(id: string): Promise<BenchmarkData | undefined> {
    return dbGet(STORE_NAME, id);
}

export async function deleteBenchmark(id: string): Promise<void> {
    return dbDelete(STORE_NAME, id);
}

export async function getBenchmarksByGameType(gameType: GameCategory): Promise<BenchmarkData[]> {
    return dbGetByIndex(STORE_NAME, 'gameType', gameType);
}

export async function getBenchmarksByCategory(category: BenchmarkCategory): Promise<BenchmarkData[]> {
    return dbGetByIndex(STORE_NAME, 'category', category);
}

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Compare your metrics against community benchmarks
 */
export function compareMetrics(
    yourMetrics: {
        retention?: { d1?: number; d7?: number; d30?: number };
        monetization?: { arpu?: number; conversionRate?: number };
        engagement?: { dauMauRatio?: number; avgSessionLength?: number };
    },
    gameType: GameCategory
): BenchmarkComparison[] {
    const benchmarks = DEFAULT_BENCHMARKS[gameType] || DEFAULT_BENCHMARKS.custom;
    const comparisons: BenchmarkComparison[] = [];

    // Retention comparisons
    if (yourMetrics.retention?.d1 !== undefined) {
        const bench = benchmarks.retention.d1;
        comparisons.push(createComparison('D1 Retention', yourMetrics.retention.d1, bench, '%'));
    }
    if (yourMetrics.retention?.d7 !== undefined) {
        const bench = benchmarks.retention.d7;
        comparisons.push(createComparison('D7 Retention', yourMetrics.retention.d7, bench, '%'));
    }
    if (yourMetrics.retention?.d30 !== undefined) {
        const bench = benchmarks.retention.d30;
        comparisons.push(createComparison('D30 Retention', yourMetrics.retention.d30, bench, '%'));
    }

    // Monetization comparisons
    if (yourMetrics.monetization?.arpu !== undefined) {
        const bench = benchmarks.monetization.arpu;
        comparisons.push(createComparison('ARPU', yourMetrics.monetization.arpu, bench, '$'));
    }
    if (yourMetrics.monetization?.conversionRate !== undefined) {
        const bench = benchmarks.monetization.conversionRate;
        comparisons.push(createComparison('Conversion Rate', yourMetrics.monetization.conversionRate, bench, '%'));
    }

    // Engagement comparisons
    if (yourMetrics.engagement?.dauMauRatio !== undefined) {
        const bench = benchmarks.engagement.dauMauRatio;
        comparisons.push(createComparison('DAU/MAU', yourMetrics.engagement.dauMauRatio, bench, '%'));
    }
    if (yourMetrics.engagement?.avgSessionLength !== undefined) {
        const bench = benchmarks.engagement.avgSessionLength;
        comparisons.push(createComparison('Avg Session Length', yourMetrics.engagement.avgSessionLength, bench, 'min'));
    }

    return comparisons;
}

function createComparison(
    metric: string,
    yourValue: number,
    bench: { median: number; p25: number; p75: number; p90: number },
    _unit: string // Reserved for future formatting
): BenchmarkComparison {
    // Calculate percentile
    let percentile: number;
    if (yourValue >= bench.p90) {
        percentile = 90 + (10 * (yourValue - bench.p90) / (bench.p90 * 0.5));
        percentile = Math.min(99, percentile);
    } else if (yourValue >= bench.p75) {
        percentile = 75 + (15 * (yourValue - bench.p75) / (bench.p90 - bench.p75));
    } else if (yourValue >= bench.median) {
        percentile = 50 + (25 * (yourValue - bench.median) / (bench.p75 - bench.median));
    } else if (yourValue >= bench.p25) {
        percentile = 25 + (25 * (yourValue - bench.p25) / (bench.median - bench.p25));
    } else {
        percentile = 25 * (yourValue / bench.p25);
    }
    percentile = Math.max(1, Math.min(99, Math.round(percentile)));

    // Determine rating
    let rating: BenchmarkComparison['rating'];
    if (percentile >= 90) rating = 'excellent';
    else if (percentile >= 75) rating = 'good';
    else if (percentile >= 50) rating = 'average';
    else if (percentile >= 25) rating = 'below_average';
    else rating = 'poor';

    // Generate insight
    const diff = yourValue - bench.median;
    const diffPercent = ((diff / bench.median) * 100).toFixed(1);
    const direction = diff >= 0 ? 'above' : 'below';
    const absPercent = Math.abs(parseFloat(diffPercent));

    let insight: string;
    if (rating === 'excellent') {
        insight = `Outstanding! Your ${metric} is in the top 10% of games.`;
    } else if (rating === 'good') {
        insight = `Great performance! ${absPercent}% ${direction} median.`;
    } else if (rating === 'average') {
        insight = `On par with industry. Consider optimizing for competitive edge.`;
    } else if (rating === 'below_average') {
        insight = `${absPercent}% ${direction} median. Focus area for improvement.`;
    } else {
        insight = `Significant gap vs peers. Prioritize ${metric.toLowerCase()} optimization.`;
    }

    return {
        metric,
        yourValue,
        communityMedian: bench.median,
        percentile,
        rating,
        insight,
    };
}

/**
 * Get benchmarks for a specific game type
 */
export function getBenchmarksForGameType(gameType: GameCategory): {
    retention: RetentionBenchmarks;
    monetization: MonetizationBenchmarks;
    engagement: EngagementBenchmarks;
} {
    return DEFAULT_BENCHMARKS[gameType] || DEFAULT_BENCHMARKS.custom;
}

/**
 * Contribute anonymized metrics to the community
 */
export async function contributeMetrics(contribution: Omit<UserContribution, 'id' | 'contributedAt'>): Promise<string> {
    const id = generateId();
    const userContribution: UserContribution = {
        ...contribution,
        id,
        contributedAt: new Date().toISOString(),
    };

    await dbPut(CONTRIBUTIONS_STORE, userContribution);
    return id;
}

/**
 * Get rating color for UI display
 */
export function getRatingColor(rating: BenchmarkComparison['rating']): string {
    switch (rating) {
        case 'excellent': return 'text-[#7A8B5B]';
        case 'good': return 'text-[#DA7756]';
        case 'average': return 'text-[#E5A84B]';
        case 'below_average': return 'text-[#C15F3C]';
        case 'poor': return 'text-[#E25C5C]';
        default: return 'text-[#8F8B82]';
    }
}

/**
 * Get rating icon for UI display
 */
export function getRatingIcon(rating: BenchmarkComparison['rating']): string {
    switch (rating) {
        case 'excellent': return '🏆';
        case 'good': return '👍';
        case 'average': return '📊';
        case 'below_average': return '📉';
        case 'poor': return '⚠️';
        default: return '❓';
    }
}
