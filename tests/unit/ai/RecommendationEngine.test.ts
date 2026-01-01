/**
 * RecommendationEngine Unit Tests
 * Tests for AI-generated recommendations
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import {
    RecommendationEngine,
    recommendationEngine,
} from '@/ai/RecommendationEngine';
import { GameCategory } from '@/types';

// Helper to create recommendation context
function createContext(overrides: Record<string, unknown> = {}): Parameters<typeof recommendationEngine.generateRecommendations>[0] {
    return {
        dau: 10000,
        mau: 50000,
        d1Retention: 0.40,
        d7Retention: 0.20,
        d30Retention: 0.10,
        arpu: 0.50,
        arppu: 10.00,
        payerConversionRate: 0.05,
        avgSessionLength: 600,
        avgSessionsPerDay: 2.5,
        dauTrend: 0,
        revenueTrend: 0,
        retentionTrend: 0,
        gameType: 'puzzle' as GameCategory,
        avgLevel: 15,
        atRiskUsers: 500,
        atRiskPercentage: 5,
        highValueUsers: 200,
        nonPayersEngaged: 3000,
        benchmarks: {},
        ...overrides,
    };
}

describe('RecommendationEngine', () => {
    // =========================================================================
    // Basic Generation Tests
    // =========================================================================

    describe('generateRecommendations', () => {
        it('should return array of recommendations', () => {
            const engine = new RecommendationEngine();
            const context = createContext();

            const recommendations = engine.generateRecommendations(context);

            expect(Array.isArray(recommendations)).toBe(true);
        });

        it('should return recommendations with required fields', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.20 }); // Low retention to trigger

            const recommendations = engine.generateRecommendations(context);

            if (recommendations.length > 0) {
                const rec = recommendations[0];
                expect(rec.id).toBeDefined();
                expect(rec.category).toBeDefined();
                expect(rec.priority).toBeDefined();
                expect(rec.title).toBeDefined();
                expect(rec.description).toBeDefined();
                expect(rec.actions).toBeDefined();
                expect(rec.confidence).toBeDefined();
            }
        });

        it('should generate recommendations with actions', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.15 }); // Very low to trigger

            const recommendations = engine.generateRecommendations(context);
            const hasActions = recommendations.some(r => r.actions.length > 0);

            expect(hasActions).toBe(true);
        });

        it('should include impact estimates', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);
            const withImpact = recommendations.filter(r => r.impact !== undefined);

            if (withImpact.length > 0) {
                const impact = withImpact[0].impact;
                expect(impact.metric).toBeDefined();
                expect(impact.currentValue).toBeDefined();
                expect(impact.projectedValue).toBeDefined();
            }
        });

        it('should include createdAt timestamp', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            for (const rec of recommendations) {
                expect(rec.createdAt).toBeDefined();
                expect(new Date(rec.createdAt).getTime()).not.toBeNaN();
            }
        });

        it('should include related metrics', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            for (const rec of recommendations) {
                expect(Array.isArray(rec.relatedMetrics)).toBe(true);
            }
        });
    });

    // =========================================================================
    // Retention Recommendations Tests
    // =========================================================================

    describe('retention recommendations', () => {
        it('should generate recommendation for low D1 retention', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.25 }); // Below 35% threshold

            const recommendations = engine.generateRecommendations(context);
            const retentionRecs = recommendations.filter(r => r.category === 'retention');

            expect(retentionRecs.length).toBeGreaterThan(0);
        });

        it('should set critical priority for very low D1 retention', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.15 }); // Very low (< 25%)

            const recommendations = engine.generateRecommendations(context);
            const criticalRecs = recommendations.filter(r => r.priority === 'critical');

            expect(criticalRecs.length).toBeGreaterThan(0);
        });

        it('should set high priority for moderately low D1 retention', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.30 }); // Below 35% but above 25%

            const recommendations = engine.generateRecommendations(context);
            const d1Rec = recommendations.find(r => r.title.includes('First-Day'));

            expect(d1Rec?.priority).toBe('high');
        });

        it('should not generate D1 recommendation for healthy retention', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.50 }); // Healthy (> 35%)

            const recommendations = engine.generateRecommendations(context);
            const d1Recs = recommendations.filter(
                r => r.category === 'retention' && r.title.includes('First-Day')
            );

            expect(d1Recs.length).toBe(0);
        });

        it('should detect D7 drop-off issues', () => {
            const engine = new RecommendationEngine();
            // D7/D1 ratio < 35%
            const context = createContext({ d1Retention: 0.50, d7Retention: 0.10 });

            const recommendations = engine.generateRecommendations(context);
            const d7Rec = recommendations.find(r => r.title.includes('Content Gap'));

            expect(d7Rec).toBeDefined();
        });
    });

    // =========================================================================
    // Monetization Recommendations Tests
    // =========================================================================

    describe('monetization recommendations', () => {
        it('should generate recommendation for low conversion rate', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ payerConversionRate: 0.01 }); // 1% conversion

            const recommendations = engine.generateRecommendations(context);
            const monetizationRecs = recommendations.filter(r => r.category === 'monetization');

            expect(monetizationRecs.length).toBeGreaterThan(0);
        });

        it('should set critical priority for very low conversion', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ payerConversionRate: 0.005 }); // 0.5% conversion

            const recommendations = engine.generateRecommendations(context);
            const conversionRec = recommendations.find(r => r.title.includes('Conversion'));

            expect(conversionRec?.priority).toBe('critical');
        });

        it('should generate recommendations for engaged non-payers', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ nonPayersEngaged: 100 }); // > 50 threshold

            const recommendations = engine.generateRecommendations(context);
            const nonPayerRec = recommendations.find(r => r.title.includes('Non-Payers'));

            expect(nonPayerRec).toBeDefined();
        });

        it('should generate recommendations based on game type', () => {
            const engine = new RecommendationEngine();

            const puzzleContext = createContext({ gameType: 'puzzle', d1Retention: 0.20 });
            const gachaContext = createContext({ gameType: 'gacha_rpg', d1Retention: 0.20 });

            const puzzleRecs = engine.generateRecommendations(puzzleContext);
            const gachaRecs = engine.generateRecommendations(gachaContext);

            // Both should generate recommendations
            expect(puzzleRecs.length).toBeGreaterThan(0);
            expect(gachaRecs.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Progression Recommendations Tests
    // =========================================================================

    describe('progression recommendations', () => {
        it('should generate recommendation for level bottleneck', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ topDropoffLevel: 10 }); // Early level bottleneck

            const recommendations = engine.generateRecommendations(context);
            const levelRec = recommendations.find(r => r.category === 'progression');

            expect(levelRec).toBeDefined();
        });

        it('should not trigger for late-game bottlenecks', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ topDropoffLevel: 50 }); // >= 20 threshold

            const recommendations = engine.generateRecommendations(context);
            const levelRec = recommendations.find(r => r.title.includes('Progression Blocker'));

            expect(levelRec).toBeUndefined();
        });
    });

    // =========================================================================
    // Engagement Recommendations Tests
    // =========================================================================

    describe('engagement recommendations', () => {
        it('should generate recommendation for short session length', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ avgSessionLength: 3 }); // < 5 minutes

            const recommendations = engine.generateRecommendations(context);
            const sessionRec = recommendations.find(r => r.title.includes('Session Length'));

            expect(sessionRec).toBeDefined();
        });

        it('should not trigger for healthy session length', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ avgSessionLength: 15 }); // > 5 minutes

            const recommendations = engine.generateRecommendations(context);
            const sessionRec = recommendations.find(r => r.title.includes('Session Length'));

            expect(sessionRec).toBeUndefined();
        });
    });

    // =========================================================================
    // Priority Sorting Tests
    // =========================================================================

    describe('priority sorting', () => {
        it('should sort recommendations by priority', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                d1Retention: 0.10, // Critical
                payerConversionRate: 0.01, // Low
            });

            const recommendations = engine.generateRecommendations(context);

            if (recommendations.length >= 2) {
                const priorityOrder: Record<string, number> = {
                    critical: 0,
                    high: 1,
                    medium: 2,
                    low: 3,
                };

                for (let i = 0; i < recommendations.length - 1; i++) {
                    const current = priorityOrder[recommendations[i].priority];
                    const next = priorityOrder[recommendations[i + 1].priority];
                    expect(current).toBeLessThanOrEqual(next);
                }
            }
        });

        it('should put critical recommendations first', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                d1Retention: 0.10, // Critical priority
                nonPayersEngaged: 100, // Medium priority
            });

            const recommendations = engine.generateRecommendations(context);

            if (recommendations.length > 0) {
                expect(recommendations[0].priority).toBe('critical');
            }
        });
    });

    // =========================================================================
    // Churn-Based Recommendations Tests
    // =========================================================================

    describe('churn-based recommendations', () => {
        it('should generate recommendation for high at-risk percentage', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                atRiskUsers: 2000,
                atRiskPercentage: 0.20, // 20% at risk (> 15% threshold)
            });

            const recommendations = engine.generateRecommendations(context);
            const churnRec = recommendations.find(r => r.title.includes('Churn'));

            expect(churnRec).toBeDefined();
        });

        it('should set critical priority for very high churn risk', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                atRiskUsers: 5000,
                atRiskPercentage: 0.30, // 30% at risk (> 25% threshold)
            });

            const recommendations = engine.generateRecommendations(context);
            const churnRec = recommendations.find(r => r.title.includes('Churn'));

            expect(churnRec?.priority).toBe('critical');
        });

        it('should not trigger for low at-risk percentage', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                atRiskPercentage: 0.05, // 5% (< 15% threshold)
            });

            const recommendations = engine.generateRecommendations(context);
            const churnRec = recommendations.find(r => r.title.includes('Churn'));

            expect(churnRec).toBeUndefined();
        });
    });

    // =========================================================================
    // Impact Calculation Tests
    // =========================================================================

    describe('impact calculation', () => {
        it('should calculate revenue impact', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                d1Retention: 0.20,
                dau: 10000,
                arpu: 0.50,
            });

            const recommendations = engine.generateRecommendations(context);
            const withRevenueImpact = recommendations.filter(
                r => r.impact?.revenueImpact !== undefined
            );

            if (withRevenueImpact.length > 0) {
                const impact = withRevenueImpact[0].impact;
                expect(impact.revenueImpact?.monthly).toBeGreaterThanOrEqual(0);
                expect(impact.revenueImpact?.yearly).toBeGreaterThanOrEqual(0);
            }
        });

        it('should include confidence range', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            for (const rec of recommendations) {
                if (rec.impact) {
                    expect(rec.impact.confidenceRange).toBeDefined();
                    expect(rec.impact.confidenceRange.length).toBe(2);
                    expect(rec.impact.confidenceRange[0]).toBeLessThanOrEqual(rec.impact.confidenceRange[1]);
                }
            }
        });

        it('should calculate projected value', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            for (const rec of recommendations) {
                if (rec.impact) {
                    expect(rec.impact.projectedValue).toBeDefined();
                    expect(typeof rec.impact.projectedValue).toBe('number');
                }
            }
        });
    });

    // =========================================================================
    // Game Type Specific Tests
    // =========================================================================

    describe('game type specific', () => {
        it('should handle puzzle game type', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ gameType: 'puzzle', d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
        });

        it('should handle gacha_rpg game type', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ gameType: 'gacha_rpg', d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
        });

        it('should handle idle game type', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ gameType: 'idle', d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
        });

        it('should handle battle_royale game type', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ gameType: 'battle_royale', d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
        });

        it('should handle match3_meta game type', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ gameType: 'match3_meta', d1Retention: 0.20 });

            const recommendations = engine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle zero values', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                dau: 0,
                mau: 0,
                d1Retention: 0,
                arpu: 0,
            });

            // Should not throw
            const recommendations = engine.generateRecommendations(context);
            expect(recommendations).toBeDefined();
        });

        it('should handle perfect metrics', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                d1Retention: 0.80,
                d7Retention: 0.60,
                d30Retention: 0.40,
                payerConversionRate: 0.20,
                avgSessionLength: 20,
                atRiskPercentage: 0.01,
            });

            const recommendations = engine.generateRecommendations(context);

            // Should have fewer recommendations for healthy metrics
            expect(recommendations.length).toBeLessThan(5);
        });

        it('should handle negative trends', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                dauTrend: -1,
                revenueTrend: -1,
                retentionTrend: -1,
            });

            const recommendations = engine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
        });

        it('should handle very large numbers', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                dau: 1000000,
                mau: 5000000,
                d1Retention: 0.20,
            });

            const recommendations = engine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
        });

        it('should handle undefined topDropoffLevel', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ topDropoffLevel: undefined });

            const recommendations = engine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
        });
    });

    // =========================================================================
    // Action Types Tests
    // =========================================================================

    describe('action types', () => {
        it('should have valid action types', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.15 });

            const recommendations = engine.generateRecommendations(context);

            for (const rec of recommendations) {
                for (const action of rec.actions) {
                    expect(['implement', 'investigate', 'monitor', 'experiment']).toContain(action.type);
                }
            }
        });

        it('should have valid effort levels', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.15 });

            const recommendations = engine.generateRecommendations(context);

            for (const rec of recommendations) {
                for (const action of rec.actions) {
                    expect(['low', 'medium', 'high']).toContain(action.effort);
                }
            }
        });

        it('should have timeframes for actions', () => {
            const engine = new RecommendationEngine();
            const context = createContext({ d1Retention: 0.15 });

            const recommendations = engine.generateRecommendations(context);

            for (const rec of recommendations) {
                for (const action of rec.actions) {
                    expect(action.timeframe).toBeDefined();
                    expect(typeof action.timeframe).toBe('string');
                }
            }
        });
    });

    // =========================================================================
    // createContext Method Tests
    // =========================================================================

    describe('createContext method', () => {
        it('should create context from metrics', () => {
            const engine = new RecommendationEngine();
            const metrics = {
                dau: 5000,
                mau: 25000,
                d1_retention: 0.35,
                d7_retention: 0.15,
            };

            const context = engine.createContext(metrics, 'puzzle');

            expect(context.dau).toBe(5000);
            expect(context.mau).toBe(25000);
            expect(context.d1Retention).toBe(0.35);
            expect(context.gameType).toBe('puzzle');
        });

        it('should handle missing metrics with defaults', () => {
            const engine = new RecommendationEngine();
            const metrics = {};

            const context = engine.createContext(metrics, 'idle');

            expect(context.dau).toBe(0);
            expect(context.mau).toBe(0);
            expect(context.d1Retention).toBe(0);
            expect(context.gameType).toBe('idle');
        });
    });

    // =========================================================================
    // Singleton Export Tests
    // =========================================================================

    describe('singleton export', () => {
        it('should export recommendationEngine singleton', () => {
            expect(recommendationEngine).toBeInstanceOf(RecommendationEngine);
        });

        it('should be a working instance', () => {
            const context = createContext({ d1Retention: 0.20 });
            const recommendations = recommendationEngine.generateRecommendations(context);

            expect(recommendations).toBeDefined();
        });
    });

    // =========================================================================
    // Category Coverage Tests
    // =========================================================================

    describe('category coverage', () => {
        it('should have recommendations for all categories when triggered', () => {
            const engine = new RecommendationEngine();
            const context = createContext({
                d1Retention: 0.15, // retention
                d7Retention: 0.03, // retention (d7 drop)
                payerConversionRate: 0.005, // monetization
                nonPayersEngaged: 100, // monetization
                topDropoffLevel: 5, // progression
                avgSessionLength: 2, // engagement
                atRiskPercentage: 0.30, // retention (churn)
            });

            const recommendations = engine.generateRecommendations(context);
            const categories = [...new Set(recommendations.map(r => r.category))];

            expect(categories.length).toBeGreaterThan(1);
        });
    });
});
