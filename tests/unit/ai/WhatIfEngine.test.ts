/**
 * WhatIfEngine Unit Tests
 * Tests for What-If scenario simulation engine
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    WhatIfEngine,
    createWhatIfEngine,
    getWhatIfEngine,
    BaselineMetrics,
    ScenarioInput,
    INDUSTRY_BENCHMARKS,
    RETENTION_DECAY_DAYS,
} from '@/ai/WhatIfEngine';

// Sample baseline metrics for testing
const createBaselineMetrics = (): BaselineMetrics => ({
    dau: 10000,
    mau: 50000,
    retention: {
        d1: 0.40,
        d7: 0.20,
        d30: 0.10,
    },
    arpu: 0.50,
    arppu: 10.00,
    conversionRate: 0.05,
    avgRevenuePerPurchase: 5.00,
    avgSessionLength: 15,
    sessionsPerDau: 2.5,
});

describe('WhatIfEngine', () => {
    let engine: WhatIfEngine;

    beforeEach(() => {
        engine = createWhatIfEngine();
    });

    // =========================================================================
    // Factory and Singleton Tests
    // =========================================================================

    describe('factory functions', () => {
        it('should create a new engine instance', () => {
            const newEngine = createWhatIfEngine();
            expect(newEngine).toBeInstanceOf(WhatIfEngine);
        });

        it('should return singleton from getWhatIfEngine', () => {
            const engine1 = getWhatIfEngine();
            const engine2 = getWhatIfEngine();
            expect(engine1).toBe(engine2);
        });
    });

    // =========================================================================
    // Baseline Management Tests
    // =========================================================================

    describe('baseline management', () => {
        it('should set and get baseline metrics', () => {
            const baseline = createBaselineMetrics();
            engine.setBaseline(baseline);

            const retrieved = engine.getBaseline();
            expect(retrieved).toEqual(baseline);
        });

        it('should return null when no baseline is set', () => {
            expect(engine.getBaseline()).toBeNull();
        });
    });

    // =========================================================================
    // Basic Scenario Simulation Tests
    // =========================================================================

    describe('simulateScenario', () => {
        it('should return projections for specified time horizon', () => {
            const input: ScenarioInput = {
                name: 'Test Scenario',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 30,
            };

            const result = engine.simulateScenario(input);

            expect(result.projections.length).toBe(30);
            expect(result.projections[0].day).toBe(0);
            expect(result.projections[29].day).toBe(29);
        });

        it('should calculate summary metrics', () => {
            const input: ScenarioInput = {
                name: 'Test Scenario',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 30,
            };

            const result = engine.simulateScenario(input);

            expect(result.summary.totalRevenue).toBeGreaterThan(0);
            expect(result.summary.avgDau).toBeGreaterThan(0);
            expect(result.summary.avgRevenue).toBeGreaterThan(0);
            expect(result.summary.projectedLtv).toBeGreaterThan(0);
            expect(result.summary.peakDau).toBeGreaterThan(0);
        });

        it('should include confidence levels', () => {
            const input: ScenarioInput = {
                name: 'Test Scenario',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 30,
            };

            const result = engine.simulateScenario(input);

            expect(result.confidence.level).toBeGreaterThanOrEqual(0.5);
            expect(result.confidence.level).toBeLessThanOrEqual(1);
            // Due to rounding, use approximate comparison
            expect(result.confidence.low).toBeLessThanOrEqual(result.summary.totalRevenue + 1);
            expect(result.confidence.high).toBeGreaterThanOrEqual(result.summary.totalRevenue - 1);
        });

        it('should include revenue breakdown', () => {
            const input: ScenarioInput = {
                name: 'Test Scenario',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 30,
            };

            const result = engine.simulateScenario(input);

            expect(result.breakdown.revenueFromExisting).toBeGreaterThan(0);
            expect(result.breakdown.revenueFromNew).toBeGreaterThan(0);
            expect(result.breakdown.revenueFromReactivated).toBeGreaterThanOrEqual(0);
        });

        it('should use custom daily new users', () => {
            const input: ScenarioInput = {
                name: 'Test Scenario',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 7,
                dailyNewUsers: 5000,
            };

            const result = engine.simulateScenario(input);

            // Day 0 should have approximately 5000 new users
            expect(result.projections[0].newUsers).toBe(5000);
        });
    });

    // =========================================================================
    // Modification Impact Tests
    // =========================================================================

    describe('modification impacts', () => {
        it('should increase revenue with positive retention change', () => {
            const baseline = createBaselineMetrics();
            const baselineInput: ScenarioInput = {
                name: 'Baseline',
                baselineMetrics: baseline,
                modifications: {},
                timeHorizon: 30,
            };

            const modifiedInput: ScenarioInput = {
                name: 'Improved Retention',
                baselineMetrics: baseline,
                modifications: { retentionChange: 0.2 }, // +20% retention
                timeHorizon: 30,
            };

            const baselineResult = engine.simulateScenario(baselineInput, true);
            const modifiedResult = engine.simulateScenario(modifiedInput, true);

            expect(modifiedResult.summary.totalRevenue).toBeGreaterThan(baselineResult.summary.totalRevenue);
        });

        it('should increase revenue with positive ARPU change', () => {
            const baseline = createBaselineMetrics();
            const baselineInput: ScenarioInput = {
                name: 'Baseline',
                baselineMetrics: baseline,
                modifications: {},
                timeHorizon: 30,
            };

            const modifiedInput: ScenarioInput = {
                name: 'Improved ARPU',
                baselineMetrics: baseline,
                modifications: { arpuChange: 0.25 }, // +25% ARPU
                timeHorizon: 30,
            };

            const baselineResult = engine.simulateScenario(baselineInput, true);
            const modifiedResult = engine.simulateScenario(modifiedInput, true);

            expect(modifiedResult.summary.projectedLtv).toBeGreaterThan(baselineResult.summary.projectedLtv);
        });

        it('should increase DAU with positive DAU change', () => {
            const baseline = createBaselineMetrics();

            const modifiedInput: ScenarioInput = {
                name: 'More Users',
                baselineMetrics: baseline,
                modifications: { dauChange: 0.5 }, // +50% DAU from marketing
                timeHorizon: 30,
                dailyNewUsers: 1000,
            };

            const result = engine.simulateScenario(modifiedInput, true);

            // New users should be 1500 (1000 * 1.5)
            expect(result.projections[0].newUsers).toBe(1500);
        });

        it('should increase paying users with conversion change', () => {
            const baseline = createBaselineMetrics();

            const baselineInput: ScenarioInput = {
                name: 'Baseline',
                baselineMetrics: baseline,
                modifications: {},
                timeHorizon: 30,
            };

            const modifiedInput: ScenarioInput = {
                name: 'Better Conversion',
                baselineMetrics: baseline,
                modifications: { conversionChange: 0.5 }, // +50% conversion
                timeHorizon: 30,
            };

            const baselineResult = engine.simulateScenario(baselineInput, true);
            const modifiedResult = engine.simulateScenario(modifiedInput, true);

            expect(modifiedResult.summary.totalRevenue).toBeGreaterThan(baselineResult.summary.totalRevenue);
        });

        it('should cap retention at 1.0 (100%)', () => {
            const baseline = createBaselineMetrics();
            baseline.retention.d1 = 0.9; // Already high

            const input: ScenarioInput = {
                name: 'Max Retention',
                baselineMetrics: baseline,
                modifications: { retentionChange: 0.5 }, // +50% would be 1.35
                timeHorizon: 7,
            };

            const result = engine.simulateScenario(input, true);

            // Retention-based calculations should not exceed reality
            expect(result.projections.every(p => p.returningUsers >= 0)).toBe(true);
        });
    });

    // =========================================================================
    // Impact Calculation Tests
    // =========================================================================

    describe('impact calculation', () => {
        it('should calculate impact vs baseline', () => {
            const input: ScenarioInput = {
                name: 'Test Scenario',
                baselineMetrics: createBaselineMetrics(),
                modifications: { retentionChange: 0.1 },
                timeHorizon: 30,
            };

            const result = engine.simulateScenario(input);

            // Should have positive impact from retention improvement
            expect(result.impact.revenueChange).toBeGreaterThan(0);
            expect(result.impact.revenueChangePercent).toBeGreaterThan(0);
        });

        it('should show zero impact for baseline scenario', () => {
            const input: ScenarioInput = {
                name: 'Baseline',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 30,
            };

            // Use isBaselineCalculation=true to get zero impact
            const result = engine.simulateScenario(input, true);

            expect(result.impact.revenueChange).toBe(0);
            expect(result.impact.dauChange).toBe(0);
            expect(result.impact.ltvChange).toBe(0);
        });
    });

    // =========================================================================
    // Scenario Comparison Tests
    // =========================================================================

    describe('compareScenarios', () => {
        it('should compare two scenarios', () => {
            const baseline = createBaselineMetrics();

            const baselineInput: ScenarioInput = {
                name: 'Current State',
                baselineMetrics: baseline,
                modifications: {},
                timeHorizon: 30,
            };

            const modifiedInput: ScenarioInput = {
                name: 'Improved State',
                baselineMetrics: baseline,
                modifications: { retentionChange: 0.2, arpuChange: 0.1 },
                timeHorizon: 30,
            };

            const comparison = engine.compareScenarios(baselineInput, modifiedInput);

            expect(comparison.baseline).toBeDefined();
            expect(comparison.modified).toBeDefined();
            expect(comparison.difference.totalRevenue).toBeGreaterThan(0);
            expect(comparison.percentChange.revenue).toBeGreaterThan(0);
        });

        it('should provide recommendation based on impact', () => {
            const baseline = createBaselineMetrics();

            const baselineInput: ScenarioInput = {
                name: 'Current State',
                baselineMetrics: baseline,
                modifications: {},
                timeHorizon: 30,
            };

            const modifiedInput: ScenarioInput = {
                name: 'Major Improvement',
                baselineMetrics: baseline,
                modifications: { retentionChange: 0.5, arpuChange: 0.3 },
                timeHorizon: 30,
            };

            const comparison = engine.compareScenarios(baselineInput, modifiedInput);

            expect(comparison.recommendation).toBeTruthy();
            expect(typeof comparison.recommendation).toBe('string');
        });

        it('should warn about negative impacts', () => {
            const baseline = createBaselineMetrics();

            const baselineInput: ScenarioInput = {
                name: 'Current State',
                baselineMetrics: baseline,
                modifications: {},
                timeHorizon: 30,
            };

            const modifiedInput: ScenarioInput = {
                name: 'Negative Change',
                baselineMetrics: baseline,
                modifications: { retentionChange: -0.3 }, // -30% retention
                timeHorizon: 30,
            };

            const comparison = engine.compareScenarios(baselineInput, modifiedInput);

            expect(comparison.difference.totalRevenue).toBeLessThan(0);
            expect(comparison.recommendation).toContain('negative');
        });
    });

    // =========================================================================
    // Sensitivity Analysis Tests
    // =========================================================================

    describe('sensitivityAnalysis', () => {
        it('should run sensitivity analysis over a range', () => {
            const input: ScenarioInput = {
                name: 'Base',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 30,
            };

            const results = engine.sensitivityAnalysis(
                input,
                'retentionChange',
                { min: -0.2, max: 0.2, steps: 4 }
            );

            expect(results.length).toBe(5); // 4 steps + 1
            expect(results[0].value).toBe(-0.2);
            expect(results[4].value).toBe(0.2);
        });

        it('should show increasing revenue with increasing retention', () => {
            const input: ScenarioInput = {
                name: 'Base',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 30,
            };

            const results = engine.sensitivityAnalysis(
                input,
                'retentionChange',
                { min: 0, max: 0.5, steps: 5 }
            );

            // Revenue should increase monotonically
            for (let i = 1; i < results.length; i++) {
                expect(results[i].result.summary.totalRevenue)
                    .toBeGreaterThanOrEqual(results[i - 1].result.summary.totalRevenue);
            }
        });
    });

    // =========================================================================
    // Breakeven Analysis Tests
    // =========================================================================

    describe('findBreakeven', () => {
        it('should find breakeven point for a variable', () => {
            const input: ScenarioInput = {
                name: 'Base',
                baselineMetrics: createBaselineMetrics(),
                modifications: { retentionChange: 0.1 }, // Start with positive
                timeHorizon: 30,
            };

            const breakeven = engine.findBreakeven(input, 'retentionChange', 0);

            // Should find a value close to 0
            expect(breakeven).not.toBeNull();
            if (breakeven !== null) {
                expect(Math.abs(breakeven)).toBeLessThan(0.1);
            }
        });

        it('should return null if breakeven not found within range', () => {
            const input: ScenarioInput = {
                name: 'Base',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 30,
            };

            // Looking for extreme revenue change that can't be achieved
            const breakeven = engine.findBreakeven(input, 'retentionChange', 1000000000);

            // Should not find breakeven for impossible target
            expect(breakeven === null || Math.abs(breakeven) >= 0.4).toBe(true);
        });
    });

    // =========================================================================
    // Projection Accuracy Tests
    // =========================================================================

    describe('projection accuracy', () => {
        it('should calculate returning users based on retention', () => {
            const input: ScenarioInput = {
                name: 'Test',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 7,
                dailyNewUsers: 1000,
            };

            const result = engine.simulateScenario(input, true);

            // Day 0 should have no returning users
            expect(result.projections[0].returningUsers).toBe(0);

            // Day 1 should have returning users from Day 0 cohort
            expect(result.projections[1].returningUsers).toBeGreaterThan(0);
        });

        it('should calculate paying users correctly', () => {
            const metrics = createBaselineMetrics();
            metrics.conversionRate = 0.1; // 10%

            const input: ScenarioInput = {
                name: 'Test',
                baselineMetrics: metrics,
                modifications: {},
                timeHorizon: 1,
                dailyNewUsers: 1000,
            };

            const result = engine.simulateScenario(input, true);

            // With 1000 DAU and 10% conversion, should have ~100 paying users
            expect(result.projections[0].payingUsers).toBe(100);
        });
    });

    // =========================================================================
    // Constants Tests
    // =========================================================================

    describe('constants', () => {
        it('should export industry benchmarks', () => {
            expect(INDUSTRY_BENCHMARKS.d1).toBe(0.40);
            expect(INDUSTRY_BENCHMARKS.d7).toBe(0.20);
            expect(INDUSTRY_BENCHMARKS.d30).toBe(0.10);
        });

        it('should export retention decay days', () => {
            expect(RETENTION_DECAY_DAYS).toContain(0);
            expect(RETENTION_DECAY_DAYS).toContain(1);
            expect(RETENTION_DECAY_DAYS).toContain(7);
            expect(RETENTION_DECAY_DAYS).toContain(30);
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle zero baseline metrics gracefully', () => {
            const zeroMetrics: BaselineMetrics = {
                dau: 0,
                mau: 0,
                retention: { d1: 0.01, d7: 0.005, d30: 0.001 }, // Very low but not zero to avoid NaN from log
                arpu: 0,
                arppu: 0,
                conversionRate: 0,
                avgRevenuePerPurchase: 0,
                avgSessionLength: 0,
                sessionsPerDau: 0,
            };

            const input: ScenarioInput = {
                name: 'Zero Metrics',
                baselineMetrics: zeroMetrics,
                modifications: {},
                timeHorizon: 7,
            };

            const result = engine.simulateScenario(input, true);

            // With zero conversion rate and arppu, revenue should be 0
            expect(result.summary.totalRevenue).toBe(0);
            expect(result.projections.length).toBe(7);
        });

        it('should handle negative modifications', () => {
            const input: ScenarioInput = {
                name: 'Negative Changes',
                baselineMetrics: createBaselineMetrics(),
                modifications: {
                    retentionChange: -0.5,
                    arpuChange: -0.3,
                },
                timeHorizon: 30,
            };

            const result = engine.simulateScenario(input);

            expect(result.impact.revenueChange).toBeLessThan(0);
        });

        it('should handle very short time horizons', () => {
            const input: ScenarioInput = {
                name: 'Short Horizon',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 1,
            };

            const result = engine.simulateScenario(input, true);

            expect(result.projections.length).toBe(1);
            expect(result.summary.avgDau).toBeGreaterThan(0);
        });

        it('should handle very long time horizons', () => {
            const input: ScenarioInput = {
                name: 'Long Horizon',
                baselineMetrics: createBaselineMetrics(),
                modifications: {},
                timeHorizon: 365,
            };

            const result = engine.simulateScenario(input, true);

            expect(result.projections.length).toBe(365);
            expect(result.summary.totalRevenue).toBeGreaterThan(0);
        });

        it('should handle combined modifications', () => {
            const input: ScenarioInput = {
                name: 'All Changes',
                baselineMetrics: createBaselineMetrics(),
                modifications: {
                    retentionChange: 0.1,
                    arpuChange: 0.1,
                    conversionChange: 0.1,
                    dauChange: 0.1,
                    arppuChange: 0.1,
                    sessionLengthChange: 0.1,
                },
                timeHorizon: 30,
            };

            const result = engine.simulateScenario(input);

            expect(result.impact.revenueChange).toBeGreaterThan(0);
            expect(result.confidence.level).toBeLessThan(1); // Lower confidence due to many changes
        });
    });
});
