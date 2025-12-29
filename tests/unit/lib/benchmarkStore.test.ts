/**
 * Benchmark Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    saveBenchmark,
    getAllBenchmarks,
    getBenchmark,
    deleteBenchmark,
    getBenchmarksByGameType,
    getBenchmarksByCategory,
    compareMetrics,
    getBenchmarksForGameType,
    contributeMetrics,
    getRatingColor,
    getRatingIcon,
    DEFAULT_BENCHMARKS,
    type BenchmarkData,
    type BenchmarkComparison,
} from '../../../src/lib/benchmarkStore';

// Mock the db module
vi.mock('../../../src/lib/db', () => ({
    dbPut: vi.fn().mockResolvedValue(undefined),
    dbGetAll: vi.fn().mockResolvedValue([]),
    dbGet: vi.fn().mockResolvedValue(undefined),
    dbDelete: vi.fn().mockResolvedValue(undefined),
    dbGetByIndex: vi.fn().mockResolvedValue([]),
    generateId: vi.fn().mockReturnValue('benchmark-id-123'),
}));

import { dbPut, dbGetAll, dbGet, dbDelete, dbGetByIndex } from '../../../src/lib/db';

describe('benchmarkStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('IndexedDB operations', () => {
        const mockBenchmark: BenchmarkData = {
            id: 'bench-1',
            category: 'retention',
            gameType: 'puzzle',
            platform: 'ios',
            monetizationModel: 'freemium',
            metrics: [
                { name: 'D1 Retention', value: 40, unit: 'percentage', sampleSize: 1000 },
            ],
            sampleSize: 1000,
            lastUpdated: '2024-01-01T00:00:00Z',
        };

        it('should save benchmark to database', async () => {
            await saveBenchmark(mockBenchmark);
            expect(dbPut).toHaveBeenCalledWith('benchmarks', mockBenchmark);
        });

        it('should get all benchmarks', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockBenchmark]);
            const benchmarks = await getAllBenchmarks();
            expect(benchmarks).toEqual([mockBenchmark]);
            expect(dbGetAll).toHaveBeenCalledWith('benchmarks');
        });

        it('should get benchmark by ID', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(mockBenchmark);
            const benchmark = await getBenchmark('bench-1');
            expect(benchmark).toEqual(mockBenchmark);
            expect(dbGet).toHaveBeenCalledWith('benchmarks', 'bench-1');
        });

        it('should return undefined for non-existent benchmark', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);
            const benchmark = await getBenchmark('non-existent');
            expect(benchmark).toBeUndefined();
        });

        it('should delete benchmark', async () => {
            await deleteBenchmark('bench-1');
            expect(dbDelete).toHaveBeenCalledWith('benchmarks', 'bench-1');
        });

        it('should get benchmarks by game type', async () => {
            vi.mocked(dbGetByIndex).mockResolvedValueOnce([mockBenchmark]);
            const benchmarks = await getBenchmarksByGameType('puzzle');
            expect(benchmarks).toEqual([mockBenchmark]);
            expect(dbGetByIndex).toHaveBeenCalledWith('benchmarks', 'gameType', 'puzzle');
        });

        it('should get benchmarks by category', async () => {
            vi.mocked(dbGetByIndex).mockResolvedValueOnce([mockBenchmark]);
            const benchmarks = await getBenchmarksByCategory('retention');
            expect(benchmarks).toEqual([mockBenchmark]);
            expect(dbGetByIndex).toHaveBeenCalledWith('benchmarks', 'category', 'retention');
        });
    });

    describe('DEFAULT_BENCHMARKS', () => {
        it('should have benchmarks for all game types', () => {
            expect(DEFAULT_BENCHMARKS.puzzle).toBeDefined();
            expect(DEFAULT_BENCHMARKS.idle).toBeDefined();
            expect(DEFAULT_BENCHMARKS.battle_royale).toBeDefined();
            expect(DEFAULT_BENCHMARKS.match3_meta).toBeDefined();
            expect(DEFAULT_BENCHMARKS.gacha_rpg).toBeDefined();
            expect(DEFAULT_BENCHMARKS.custom).toBeDefined();
        });

        it('should have retention benchmarks for each game type', () => {
            Object.values(DEFAULT_BENCHMARKS).forEach(benchmarks => {
                expect(benchmarks.retention).toBeDefined();
                expect(benchmarks.retention.d1).toBeDefined();
                expect(benchmarks.retention.d7).toBeDefined();
                expect(benchmarks.retention.d30).toBeDefined();
            });
        });

        it('should have monetization benchmarks for each game type', () => {
            Object.values(DEFAULT_BENCHMARKS).forEach(benchmarks => {
                expect(benchmarks.monetization).toBeDefined();
                expect(benchmarks.monetization.arpu).toBeDefined();
                expect(benchmarks.monetization.arppu).toBeDefined();
                expect(benchmarks.monetization.conversionRate).toBeDefined();
            });
        });

        it('should have engagement benchmarks for each game type', () => {
            Object.values(DEFAULT_BENCHMARKS).forEach(benchmarks => {
                expect(benchmarks.engagement).toBeDefined();
                expect(benchmarks.engagement.dauMauRatio).toBeDefined();
                expect(benchmarks.engagement.avgSessionLength).toBeDefined();
            });
        });

        it('should have percentile data for all metrics', () => {
            const puzzle = DEFAULT_BENCHMARKS.puzzle;
            expect(puzzle.retention.d1.median).toBeDefined();
            expect(puzzle.retention.d1.p25).toBeDefined();
            expect(puzzle.retention.d1.p75).toBeDefined();
            expect(puzzle.retention.d1.p90).toBeDefined();
        });
    });

    describe('compareMetrics', () => {
        it('should compare D1 retention against benchmarks', () => {
            const metrics = { retention: { d1: 45 } };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons.length).toBe(1);
            expect(comparisons[0].metric).toBe('D1 Retention');
            expect(comparisons[0].yourValue).toBe(45);
        });

        it('should compare D7 retention against benchmarks', () => {
            const metrics = { retention: { d7: 15 } };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons.length).toBe(1);
            expect(comparisons[0].metric).toBe('D7 Retention');
        });

        it('should compare D30 retention against benchmarks', () => {
            const metrics = { retention: { d30: 8 } };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons.length).toBe(1);
            expect(comparisons[0].metric).toBe('D30 Retention');
        });

        it('should compare ARPU against benchmarks', () => {
            const metrics = { monetization: { arpu: 0.15 } };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons.length).toBe(1);
            expect(comparisons[0].metric).toBe('ARPU');
        });

        it('should compare conversion rate against benchmarks', () => {
            const metrics = { monetization: { conversionRate: 4 } };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons.length).toBe(1);
            expect(comparisons[0].metric).toBe('Conversion Rate');
        });

        it('should compare DAU/MAU ratio against benchmarks', () => {
            const metrics = { engagement: { dauMauRatio: 20 } };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons.length).toBe(1);
            expect(comparisons[0].metric).toBe('DAU/MAU');
        });

        it('should compare average session length against benchmarks', () => {
            const metrics = { engagement: { avgSessionLength: 10 } };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons.length).toBe(1);
            expect(comparisons[0].metric).toBe('Avg Session Length');
        });

        it('should compare multiple metrics at once', () => {
            const metrics = {
                retention: { d1: 45, d7: 15 },
                monetization: { arpu: 0.1 },
            };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons.length).toBe(3);
        });

        it('should calculate correct percentile for excellent performance', () => {
            const metrics = { retention: { d1: 60 } }; // Well above p90
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons[0].percentile).toBeGreaterThanOrEqual(90);
            expect(comparisons[0].rating).toBe('excellent');
        });

        it('should calculate correct percentile for good performance', () => {
            const metrics = { retention: { d1: 46 } }; // Above median, near p75
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons[0].percentile).toBeGreaterThanOrEqual(75);
            expect(comparisons[0].rating).toBe('good');
        });

        it('should calculate correct percentile for average performance', () => {
            const metrics = { retention: { d1: 35 } }; // At median
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons[0].percentile).toBeGreaterThanOrEqual(50);
            expect(comparisons[0].rating).toBe('average');
        });

        it('should calculate correct percentile for below average performance', () => {
            const metrics = { retention: { d1: 28 } }; // Below median
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons[0].percentile).toBeGreaterThanOrEqual(25);
            expect(comparisons[0].percentile).toBeLessThan(50);
            expect(comparisons[0].rating).toBe('below_average');
        });

        it('should calculate correct percentile for poor performance', () => {
            const metrics = { retention: { d1: 10 } }; // Well below p25
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons[0].percentile).toBeLessThan(25);
            expect(comparisons[0].rating).toBe('poor');
        });

        it('should generate appropriate insight for each rating', () => {
            const metrics = { retention: { d1: 60 } };
            const comparisons = compareMetrics(metrics, 'puzzle');

            expect(comparisons[0].insight).toBeDefined();
            expect(comparisons[0].insight.length).toBeGreaterThan(0);
        });

        it('should use custom benchmarks for unknown game type', () => {
            const metrics = { retention: { d1: 35 } };
            const comparisons = compareMetrics(metrics, 'custom');

            expect(comparisons.length).toBe(1);
            expect(comparisons[0].communityMedian).toBe(DEFAULT_BENCHMARKS.custom.retention.d1.median);
        });
    });

    describe('getBenchmarksForGameType', () => {
        it('should return benchmarks for puzzle', () => {
            const benchmarks = getBenchmarksForGameType('puzzle');
            expect(benchmarks).toEqual(DEFAULT_BENCHMARKS.puzzle);
        });

        it('should return benchmarks for gacha_rpg', () => {
            const benchmarks = getBenchmarksForGameType('gacha_rpg');
            expect(benchmarks).toEqual(DEFAULT_BENCHMARKS.gacha_rpg);
        });

        it('should return custom benchmarks for unknown game type', () => {
            const benchmarks = getBenchmarksForGameType('unknown' as any);
            expect(benchmarks).toEqual(DEFAULT_BENCHMARKS.custom);
        });
    });

    describe('contributeMetrics', () => {
        it('should create a contribution with generated ID', async () => {
            const contribution = {
                userId: 'user-1',
                gameType: 'puzzle' as const,
                platform: 'ios' as const,
                monetizationModel: 'freemium' as const,
                retention: { d1: 40 },
                monetization: {},
                engagement: {},
            };

            const id = await contributeMetrics(contribution);

            expect(id).toBe('benchmark-id-123');
            expect(dbPut).toHaveBeenCalledWith('benchmarkContributions', expect.objectContaining({
                id: 'benchmark-id-123',
                userId: 'user-1',
                contributedAt: expect.any(String),
            }));
        });

        it('should include all provided metrics', async () => {
            const contribution = {
                userId: 'user-1',
                gameType: 'puzzle' as const,
                platform: 'ios' as const,
                monetizationModel: 'freemium' as const,
                retention: { d1: 40, d7: 15, d30: 8 },
                monetization: { arpu: 0.1, conversionRate: 3 },
                engagement: { dauMauRatio: 18, avgSessionLength: 10 },
            };

            await contributeMetrics(contribution);

            expect(dbPut).toHaveBeenCalledWith('benchmarkContributions', expect.objectContaining({
                retention: { d1: 40, d7: 15, d30: 8 },
                monetization: { arpu: 0.1, conversionRate: 3 },
            }));
        });

        it('should include optional gameAgeDays', async () => {
            const contribution = {
                userId: 'user-1',
                gameType: 'puzzle' as const,
                platform: 'ios' as const,
                monetizationModel: 'freemium' as const,
                retention: {},
                monetization: {},
                engagement: {},
                gameAgeDays: 365,
            };

            await contributeMetrics(contribution);

            expect(dbPut).toHaveBeenCalledWith('benchmarkContributions', expect.objectContaining({
                gameAgeDays: 365,
            }));
        });
    });

    describe('getRatingColor', () => {
        it('should return green for excellent', () => {
            expect(getRatingColor('excellent')).toBe('text-green-500');
        });

        it('should return blue for good', () => {
            expect(getRatingColor('good')).toBe('text-blue-500');
        });

        it('should return yellow for average', () => {
            expect(getRatingColor('average')).toBe('text-yellow-500');
        });

        it('should return orange for below_average', () => {
            expect(getRatingColor('below_average')).toBe('text-orange-500');
        });

        it('should return red for poor', () => {
            expect(getRatingColor('poor')).toBe('text-red-500');
        });

        it('should return gray for unknown rating', () => {
            expect(getRatingColor('unknown' as any)).toBe('text-gray-500');
        });
    });

    describe('getRatingIcon', () => {
        it('should return trophy emoji for excellent', () => {
            expect(getRatingIcon('excellent')).toBe('🏆');
        });

        it('should return thumbs up emoji for good', () => {
            expect(getRatingIcon('good')).toBe('👍');
        });

        it('should return chart emoji for average', () => {
            expect(getRatingIcon('average')).toBe('📊');
        });

        it('should return trending down emoji for below_average', () => {
            expect(getRatingIcon('below_average')).toBe('📉');
        });

        it('should return warning emoji for poor', () => {
            expect(getRatingIcon('poor')).toBe('⚠️');
        });
    });

    describe('Benchmark data integrity', () => {
        it('should have increasing percentiles for retention', () => {
            Object.values(DEFAULT_BENCHMARKS).forEach(benchmarks => {
                const d1 = benchmarks.retention.d1;
                expect(d1.p25).toBeLessThan(d1.median);
                expect(d1.median).toBeLessThan(d1.p75);
                expect(d1.p75).toBeLessThan(d1.p90);
            });
        });

        it('should have positive values for all benchmarks', () => {
            Object.values(DEFAULT_BENCHMARKS).forEach(benchmarks => {
                Object.values(benchmarks.retention).forEach(metric => {
                    expect(metric.median).toBeGreaterThan(0);
                    expect(metric.p25).toBeGreaterThan(0);
                    expect(metric.p75).toBeGreaterThan(0);
                    expect(metric.p90).toBeGreaterThan(0);
                });
            });
        });

        it('should have gacha_rpg with higher benchmarks than puzzle', () => {
            // Gacha games typically have better retention
            expect(DEFAULT_BENCHMARKS.gacha_rpg.retention.d1.median)
                .toBeGreaterThan(DEFAULT_BENCHMARKS.puzzle.retention.d1.median);
        });
    });
});
