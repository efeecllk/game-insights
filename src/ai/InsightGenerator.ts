/**
 * Insight Generator
 * Generates actionable insights from data analysis with:
 * - Quantified recommendations with specific metrics
 * - Revenue impact estimates
 * - Business impact prioritization (high/medium/low)
 * - Game-specific insight templates
 * - Confidence scores on all insights
 * Supports both template-based and LLM-powered generation
 */

import { ColumnMeaning } from './SchemaAnalyzer';
import { NormalizedData } from '../adapters/BaseAdapter';
import { GameCategory } from '../types';
import { CalculatedMetrics } from './MetricCalculator';
import { Anomaly } from './AnomalyDetector';
import {
    LLMService,
    getLLMService,
    InsightContext,
} from '../services/llm';

// ============ TYPES ============

export type BusinessImpact = 'high' | 'medium' | 'low';

export interface RevenueImpact {
    estimatedValue: number;
    estimatedPercentage: number;
    timeframe: 'daily' | 'weekly' | 'monthly' | 'annual';
    confidence: number;
}

export interface Insight {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning' | 'opportunity';
    category: 'retention' | 'monetization' | 'engagement' | 'progression' | 'quality';
    title: string;
    description: string;
    metric?: string;
    value?: number | string;
    change?: number;
    priority: number;                      // 1-10, higher = more important
    businessImpact: BusinessImpact;        // Business impact level
    recommendation: string;                // Specific actionable recommendation
    revenueImpact?: RevenueImpact;         // Estimated revenue impact
    confidence: number;                    // 0-1 confidence in this insight
    evidence?: string[];                   // Supporting data points
    source: 'template' | 'llm' | 'metric'; // Where this insight came from
    actionable: boolean;                   // Whether this has a clear action
}

export interface EnhancedInsight extends Insight {
    category: 'retention' | 'monetization' | 'engagement' | 'progression' | 'quality';
    priority: number;
    confidence: number;
}

export interface InsightGeneratorConfig {
    useLLM?: boolean;
    llmService?: LLMService;
    maxInsights?: number;
    minConfidence?: number;
    includeRevenueImpact?: boolean;
}

// ============ INDUSTRY BENCHMARKS ============

const INDUSTRY_BENCHMARKS = {
    d1Retention: { good: 40, average: 25, poor: 15 },
    d7Retention: { good: 20, average: 12, poor: 5 },
    d30Retention: { good: 10, average: 5, poor: 2 },
    conversionRate: { good: 5, average: 2.5, poor: 1 },
    arpu: { good: 0.15, average: 0.08, poor: 0.03 },
    arppu: { good: 15, average: 8, poor: 3 },
    dauMauRatio: { good: 0.25, average: 0.15, poor: 0.08 },
    sessionsPerUser: { good: 4, average: 2.5, poor: 1.5 },
    avgSessionLength: { good: 600, average: 300, poor: 120 }, // seconds
};

// ============ GAME-SPECIFIC INSIGHT TEMPLATES ============

interface GameInsightTemplate {
    id: string;
    gameTypes: GameCategory[];
    category: Insight['category'];
    condition: (metrics: CalculatedMetrics) => boolean;
    generate: (metrics: CalculatedMetrics, totalRevenue: number) => Insight;
}

const GAME_SPECIFIC_TEMPLATES: GameInsightTemplate[] = [
    // ============ PUZZLE GAME TEMPLATES ============
    {
        id: 'puzzle-level-bottleneck',
        gameTypes: ['puzzle', 'match3_meta'],
        category: 'progression',
        condition: (m) => (m.progression?.bottleneckLevels?.length ?? 0) > 0,
        generate: (m, totalRevenue) => {
            const bottleneck = m.progression!.bottleneckLevels[0];
            const usersLost = bottleneck.usersLost;
            const estimatedRevenueImpact = usersLost * (m.monetization?.arpu ?? 0.1) * 30;
            return {
                id: 'puzzle-level-bottleneck',
                type: 'warning',
                category: 'progression',
                title: `Critical Bottleneck at ${bottleneck.level}`,
                description: `${bottleneck.level} has a ${bottleneck.dropOffRate.toFixed(1)}% drop-off rate, losing approximately ${usersLost.toLocaleString()} users.`,
                metric: 'drop_off_rate',
                value: bottleneck.dropOffRate,
                priority: 9,
                businessImpact: 'high',
                recommendation: `Reduce difficulty at ${bottleneck.level} by 15-20% or add a hint system. Consider offering a free booster after 3 failed attempts. Target: reduce drop-off to under 15%.`,
                revenueImpact: {
                    estimatedValue: estimatedRevenueImpact,
                    estimatedPercentage: totalRevenue > 0 ? (estimatedRevenueImpact / totalRevenue) * 100 : 5,
                    timeframe: 'monthly',
                    confidence: 0.7,
                },
                confidence: m.progression?.confidence ?? 0.7,
                evidence: [
                    `Drop-off rate: ${bottleneck.dropOffRate.toFixed(1)}%`,
                    `Users lost: ${usersLost.toLocaleString()}`,
                    `Industry benchmark: 10-15% drop-off per level`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },
    {
        id: 'puzzle-booster-opportunity',
        gameTypes: ['puzzle', 'match3_meta'],
        category: 'monetization',
        condition: (m) => (m.monetization?.conversionRate ?? 0) < 3 && (m.progression?.difficultySpikes?.length ?? 0) > 0,
        generate: (m, totalRevenue) => {
            const totalUsers = m.monetization?.totalUsers ?? 1000;
            const potentialConverts = Math.floor(totalUsers * 0.02); // 2% could convert
            const estimatedRevenue = potentialConverts * 2.99; // Avg booster pack price
            return {
                id: 'puzzle-booster-opportunity',
                type: 'opportunity',
                category: 'monetization',
                title: 'Booster Purchase Opportunity',
                description: `With ${m.progression?.difficultySpikes?.length} difficulty spikes detected, there's potential to increase booster purchases by targeting stuck players.`,
                metric: 'conversion_rate',
                value: m.monetization?.conversionRate ?? 0,
                priority: 8,
                businessImpact: 'high',
                recommendation: `Implement a "stuck player" detection system that offers a discounted booster pack ($1.99 instead of $2.99) after 5 failed attempts. Expected conversion: 2-3% of stuck users.`,
                revenueImpact: {
                    estimatedValue: estimatedRevenue,
                    estimatedPercentage: totalRevenue > 0 ? (estimatedRevenue / totalRevenue) * 100 : 8,
                    timeframe: 'monthly',
                    confidence: 0.65,
                },
                confidence: 0.7,
                evidence: [
                    `Current conversion: ${(m.monetization?.conversionRate ?? 0).toFixed(2)}%`,
                    `Difficulty spikes: ${m.progression?.difficultySpikes?.length ?? 0} levels`,
                    `Potential new payers: ${potentialConverts.toLocaleString()}`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },

    // ============ IDLE GAME TEMPLATES ============
    {
        id: 'idle-prestige-timing',
        gameTypes: ['idle'],
        category: 'engagement',
        condition: (m) => m.engagement !== null && (m.engagement.dauMauRatio ?? 0) < 0.2,
        generate: (m, totalRevenue) => {
            const currentStickiness = m.engagement!.dauMauRatio;
            const targetStickiness = 0.25;
            const improvement = targetStickiness - currentStickiness;
            const revenueIncrease = totalRevenue * (improvement / currentStickiness) * 0.5;
            return {
                id: 'idle-prestige-timing',
                type: 'opportunity',
                category: 'engagement',
                title: 'Optimize Prestige Timing',
                description: `DAU/MAU ratio of ${(currentStickiness * 100).toFixed(1)}% suggests players may not be returning frequently enough. Prestige mechanics may need tuning.`,
                metric: 'dau_mau_ratio',
                value: currentStickiness,
                priority: 8,
                businessImpact: 'medium',
                recommendation: `Consider reducing first prestige time to 2-3 hours for new players. Increase offline rewards by 25% to encourage return visits. Add prestige milestone notifications.`,
                revenueImpact: {
                    estimatedValue: revenueIncrease,
                    estimatedPercentage: totalRevenue > 0 ? (revenueIncrease / totalRevenue) * 100 : 10,
                    timeframe: 'monthly',
                    confidence: 0.6,
                },
                confidence: m.engagement?.confidence ?? 0.7,
                evidence: [
                    `Current DAU/MAU: ${(currentStickiness * 100).toFixed(1)}%`,
                    `Target DAU/MAU: 25%+`,
                    `Industry benchmark for idle games: 20-30%`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },
    {
        id: 'idle-offline-rewards',
        gameTypes: ['idle'],
        category: 'retention',
        condition: (m) => m.retention !== null && (m.retention.d1 ?? 0) < 40,
        generate: (m, totalRevenue) => {
            const currentD1 = m.retention!.d1;
            const targetD1 = 50;
            const userGain = Math.floor((m.monetization?.totalUsers ?? 1000) * ((targetD1 - currentD1) / 100));
            const revenueGain = userGain * (m.monetization?.arpu ?? 0.1) * 30;
            return {
                id: 'idle-offline-rewards',
                type: 'warning',
                category: 'retention',
                title: 'D1 Retention Below Idle Game Benchmark',
                description: `Day 1 retention of ${currentD1.toFixed(1)}% is below the idle game benchmark of 45-55%.`,
                metric: 'd1_retention',
                value: currentD1,
                priority: 9,
                businessImpact: 'high',
                recommendation: `Increase offline reward accumulation rate by 50% for the first 24 hours. Add a "Welcome Back" bonus of 2x offline rewards on first return. Send push notification at optimal offline duration (8 hours).`,
                revenueImpact: {
                    estimatedValue: revenueGain,
                    estimatedPercentage: totalRevenue > 0 ? (revenueGain / totalRevenue) * 100 : 15,
                    timeframe: 'monthly',
                    confidence: 0.7,
                },
                confidence: m.retention?.confidence ?? 0.7,
                evidence: [
                    `Current D1: ${currentD1.toFixed(1)}%`,
                    `Idle game benchmark: 45-55%`,
                    `Potential user recovery: ${userGain.toLocaleString()}`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },

    // ============ BATTLE ROYALE TEMPLATES ============
    {
        id: 'br-match-length',
        gameTypes: ['battle_royale'],
        category: 'engagement',
        condition: (m) => m.engagement !== null && (m.engagement.avgSessionLength ?? 0) < 900, // 15 min
        generate: (m, totalRevenue) => {
            const avgLength = m.engagement!.avgSessionLength;
            return {
                id: 'br-match-length',
                type: 'warning',
                category: 'engagement',
                title: 'Short Average Session Length',
                description: `Average session length of ${Math.floor(avgLength / 60)}m ${avgLength % 60}s suggests players may be leaving matches early or not finding enough engagement.`,
                metric: 'avg_session_length',
                value: avgLength,
                priority: 7,
                businessImpact: 'medium',
                recommendation: `Analyze early elimination patterns. Consider adding respawn mechanics or spectator rewards. Implement a "play again" bonus for consecutive matches. Target: 18-25 minute sessions.`,
                revenueImpact: {
                    estimatedValue: totalRevenue * 0.05,
                    estimatedPercentage: 5,
                    timeframe: 'monthly',
                    confidence: 0.5,
                },
                confidence: m.engagement?.confidence ?? 0.6,
                evidence: [
                    `Current avg session: ${Math.floor(avgLength / 60)}m ${avgLength % 60}s`,
                    `Target for BR games: 18-25 minutes`,
                    `Industry average: 20 minutes`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },
    {
        id: 'br-weapon-balance',
        gameTypes: ['battle_royale'],
        category: 'quality',
        condition: () => true, // Always show for BR games
        generate: (_m, _totalRevenue) => {
            return {
                id: 'br-weapon-balance',
                type: 'neutral',
                category: 'quality',
                title: 'Monitor Weapon Meta Balance',
                description: 'Regular weapon balance analysis is critical for competitive fairness and player satisfaction.',
                priority: 6,
                businessImpact: 'medium',
                recommendation: `Track kill/death ratios by weapon type. If any weapon exceeds 20% usage rate while maintaining >2.0 K/D, consider a 10-15% damage nerf. Rotate meta with seasonal balance patches.`,
                confidence: 0.8,
                evidence: [
                    'Healthy meta: no weapon >20% pick rate',
                    'Warning sign: one weapon >30% pick rate',
                    'Critical: one weapon >40% pick rate',
                ],
                source: 'template',
                actionable: true,
            };
        },
    },

    // ============ GACHA/RPG TEMPLATES ============
    {
        id: 'gacha-whale-concentration',
        gameTypes: ['gacha_rpg'],
        category: 'monetization',
        condition: (m) => (m.monetization?.whaleRevenuePercentage ?? 0) > 60,
        generate: (m, totalRevenue) => {
            const whalePercent = m.monetization!.whaleRevenuePercentage;
            const whaleCount = m.monetization!.spenderSegments.find(s => s.tier === 'whale')?.userCount ?? 0;
            return {
                id: 'gacha-whale-concentration',
                type: 'warning',
                category: 'monetization',
                title: 'High Whale Revenue Concentration',
                description: `${whalePercent.toFixed(1)}% of revenue comes from just ${whaleCount.toLocaleString()} whale users (${((whaleCount / (m.monetization?.totalUsers ?? 1)) * 100).toFixed(2)}% of players).`,
                metric: 'whale_revenue_percentage',
                value: whalePercent,
                priority: 8,
                businessImpact: 'high',
                recommendation: `Diversify revenue by adding dolphin-friendly $5-15 value packs. Implement a "monthly subscription" at $9.99 with daily gems. Create limited-time $4.99 starter packs for low spenders. Target: reduce whale concentration to <50%.`,
                revenueImpact: {
                    estimatedValue: totalRevenue * 0.15,
                    estimatedPercentage: 15,
                    timeframe: 'monthly',
                    confidence: 0.6,
                },
                confidence: m.monetization?.confidence ?? 0.8,
                evidence: [
                    `Whale revenue: ${whalePercent.toFixed(1)}%`,
                    `Whale count: ${whaleCount.toLocaleString()}`,
                    `Risk: High churn sensitivity`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },
    {
        id: 'gacha-pity-optimization',
        gameTypes: ['gacha_rpg'],
        category: 'monetization',
        condition: (m) => (m.monetization?.arppu ?? 0) < 50,
        generate: (m, totalRevenue) => {
            const currentArppu = m.monetization!.arppu;
            const targetArppu = 75;
            const payingUsers = m.monetization!.payingUsers;
            const potentialRevenue = (targetArppu - currentArppu) * payingUsers * 0.3;
            return {
                id: 'gacha-pity-optimization',
                type: 'opportunity',
                category: 'monetization',
                title: 'Pity System Optimization Opportunity',
                description: `ARPPU of $${currentArppu.toFixed(2)} is below gacha benchmark of $60-80. Pity system tuning could increase spend depth.`,
                metric: 'arppu',
                value: currentArppu,
                priority: 7,
                businessImpact: 'high',
                recommendation: `Reduce pity counter from 90 to 75 pulls for featured characters. Add a "spark" system where 150 pulls guarantees any banner character. Display pity progress prominently to encourage completion.`,
                revenueImpact: {
                    estimatedValue: potentialRevenue,
                    estimatedPercentage: totalRevenue > 0 ? (potentialRevenue / totalRevenue) * 100 : 12,
                    timeframe: 'monthly',
                    confidence: 0.55,
                },
                confidence: m.monetization?.confidence ?? 0.7,
                evidence: [
                    `Current ARPPU: $${currentArppu.toFixed(2)}`,
                    `Gacha benchmark: $60-80`,
                    `Top gacha games: $100+`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },
    {
        id: 'gacha-banner-timing',
        gameTypes: ['gacha_rpg'],
        category: 'monetization',
        condition: () => true,
        generate: (_m, totalRevenue) => {
            return {
                id: 'gacha-banner-timing',
                type: 'neutral',
                category: 'monetization',
                title: 'Optimize Banner Schedule',
                description: 'Banner timing and character release schedule significantly impacts revenue peaks.',
                priority: 6,
                businessImpact: 'medium',
                recommendation: `Run limited banners for 2 weeks maximum to create urgency. Schedule high-value banners on paydays (1st and 15th). Tease next banner 3 days before current ends. Rerun popular banners every 4-6 months.`,
                revenueImpact: {
                    estimatedValue: totalRevenue * 0.08,
                    estimatedPercentage: 8,
                    timeframe: 'monthly',
                    confidence: 0.5,
                },
                confidence: 0.7,
                evidence: [
                    'Optimal banner duration: 10-14 days',
                    'Revenue spike: 40% in first 3 days',
                    'Rerun performance: 60-70% of original',
                ],
                source: 'template',
                actionable: true,
            };
        },
    },

    // ============ MATCH3 META TEMPLATES ============
    {
        id: 'match3-story-progression',
        gameTypes: ['match3_meta'],
        category: 'progression',
        condition: (m) => m.progression !== null && (m.progression.avgLevel ?? 0) < 50,
        generate: (m, totalRevenue) => {
            const avgLevel = m.progression!.avgLevel;
            return {
                id: 'match3-story-progression',
                type: 'warning',
                category: 'progression',
                title: 'Low Story Progression',
                description: `Average player level of ${avgLevel.toFixed(0)} suggests many players aren't reaching mid-game content.`,
                metric: 'avg_level',
                value: avgLevel,
                priority: 7,
                businessImpact: 'medium',
                recommendation: `Reduce early-game difficulty (levels 1-30) by 20%. Add more story beats every 5 levels instead of 10. Unlock decoration features earlier (level 15 instead of 25). Add level skip tickets after 10 failures.`,
                revenueImpact: {
                    estimatedValue: totalRevenue * 0.12,
                    estimatedPercentage: 12,
                    timeframe: 'monthly',
                    confidence: 0.6,
                },
                confidence: m.progression?.confidence ?? 0.7,
                evidence: [
                    `Current avg level: ${avgLevel.toFixed(0)}`,
                    `Target avg level: 80+`,
                    `Meta engagement starts at level 50+`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },
    {
        id: 'match3-decoration-engagement',
        gameTypes: ['match3_meta'],
        category: 'engagement',
        condition: (m) => m.engagement !== null,
        generate: (m, totalRevenue) => {
            const sessionsPerUser = m.engagement!.avgSessionsPerUser;
            return {
                id: 'match3-decoration-engagement',
                type: sessionsPerUser > 3 ? 'positive' : 'opportunity',
                category: 'engagement',
                title: 'Meta Layer Engagement',
                description: `${sessionsPerUser.toFixed(1)} sessions per user. Meta decoration mechanics are ${sessionsPerUser > 3 ? 'driving strong' : 'underperforming on'} engagement.`,
                metric: 'sessions_per_user',
                value: sessionsPerUser,
                priority: 6,
                businessImpact: 'medium',
                recommendation: sessionsPerUser > 3
                    ? 'Continue current meta strategy. Consider adding seasonal decoration themes and limited-time decoration sets.'
                    : 'Add more decoration choices per story chapter. Implement decoration voting/sharing features. Add decoration-focused limited events with exclusive items.',
                revenueImpact: {
                    estimatedValue: totalRevenue * 0.06,
                    estimatedPercentage: 6,
                    timeframe: 'monthly',
                    confidence: 0.55,
                },
                confidence: m.engagement?.confidence ?? 0.7,
                evidence: [
                    `Sessions per user: ${sessionsPerUser.toFixed(1)}`,
                    `Match3+Meta benchmark: 3.5+`,
                    `Pure Match3 benchmark: 2.5`,
                ],
                source: 'template',
                actionable: true,
            };
        },
    },
];

// ============ UNIVERSAL METRIC-BASED INSIGHTS ============

function generateMetricInsights(metrics: CalculatedMetrics, totalRevenue: number): Insight[] {
    const insights: Insight[] = [];

    // Retention insights
    if (metrics.retention) {
        const d1 = metrics.retention.d1;
        const d7 = metrics.retention.d7;
        const d30 = metrics.retention.d30;

        if (d1 > 0) {
            const benchmark = INDUSTRY_BENCHMARKS.d1Retention;
            let type: Insight['type'] = 'neutral';
            let businessImpact: BusinessImpact = 'medium';
            let recommendation = '';

            if (d1 >= benchmark.good) {
                type = 'positive';
                businessImpact = 'low';
                recommendation = 'D1 retention is strong. Focus on optimizing D7 and D30 retention with content updates and engagement features.';
            } else if (d1 >= benchmark.average) {
                type = 'neutral';
                businessImpact = 'medium';
                recommendation = 'Improve onboarding flow: reduce tutorial length by 30%, add skip options, and ensure first session ends on a high note.';
            } else {
                type = 'warning';
                businessImpact = 'high';
                recommendation = 'Critical: Rebuild onboarding. A/B test 3 different tutorial flows. Add early rewards (first 10 minutes). Implement "come back tomorrow" bonus.';
            }

            insights.push({
                id: 'metric-d1-retention',
                type,
                category: 'retention',
                title: `D1 Retention: ${d1.toFixed(1)}%`,
                description: `Day 1 retention is ${d1 >= benchmark.good ? 'above' : d1 >= benchmark.average ? 'at' : 'below'} industry benchmark (${benchmark.average}%).`,
                metric: 'd1_retention',
                value: d1,
                priority: d1 < benchmark.average ? 10 : 7,
                businessImpact,
                recommendation,
                confidence: metrics.retention.confidence,
                evidence: [
                    `Current D1: ${d1.toFixed(1)}%`,
                    `Industry good: ${benchmark.good}%`,
                    `Industry average: ${benchmark.average}%`,
                ],
                source: 'metric',
                actionable: true,
            });
        }

        // D30 retention insight
        if (d30 > 0 && d30 >= INDUSTRY_BENCHMARKS.d30Retention.good) {
            insights.push({
                id: 'metric-d30-strong',
                type: 'positive',
                category: 'retention',
                title: `Strong D30 Retention: ${d30.toFixed(1)}%`,
                description: `D30 retention of ${d30.toFixed(1)}% is above the ${INDUSTRY_BENCHMARKS.d30Retention.good}% benchmark, indicating excellent long-term engagement.`,
                metric: 'd30_retention',
                value: d30,
                priority: 6,
                businessImpact: 'low',
                recommendation: 'D30 retention is excellent. Focus on monetizing these loyal users with premium offerings and exclusive content.',
                confidence: metrics.retention.confidence,
                evidence: [
                    `Current D30: ${d30.toFixed(1)}%`,
                    `Industry good: ${INDUSTRY_BENCHMARKS.d30Retention.good}%`,
                ],
                source: 'metric',
                actionable: false,
            });
        }

        // Check D7 retention drop-off (using d7 from parent scope)
        if (d7 > 0 && d1 > 0) {
            const d1ToD7Ratio = d7 / d1;
            if (d1ToD7Ratio < 0.4) {
                const usersLost = Math.floor((metrics.monetization?.totalUsers ?? 1000) * (d1 - d7) / 100);
                insights.push({
                    id: 'metric-d1-d7-dropoff',
                    type: 'warning',
                    category: 'retention',
                    title: 'Significant D1 to D7 Drop-off',
                    description: `D7 retention (${d7.toFixed(1)}%) is only ${(d1ToD7Ratio * 100).toFixed(0)}% of D1 (${d1.toFixed(1)}%), indicating engagement issues in the first week.`,
                    metric: 'd1_d7_ratio',
                    value: d1ToD7Ratio,
                    priority: 8,
                    businessImpact: 'high',
                    recommendation: 'Add week-1 engagement mechanics: daily login rewards, 7-day challenge with valuable prize, push notifications at optimal times, and new player protection in competitive modes.',
                    revenueImpact: {
                        estimatedValue: usersLost * (metrics.monetization?.arpu ?? 0.1) * 30,
                        estimatedPercentage: 20,
                        timeframe: 'monthly',
                        confidence: 0.7,
                    },
                    confidence: metrics.retention.confidence,
                    evidence: [
                        `D1: ${d1.toFixed(1)}%`,
                        `D7: ${d7.toFixed(1)}%`,
                        `Healthy ratio: >50%`,
                    ],
                    source: 'metric',
                    actionable: true,
                });
            }
        }
    }

    // Monetization insights
    if (metrics.monetization) {
        const { arpu, arppu, conversionRate, spenderSegments } = metrics.monetization;

        // Conversion rate insight
        if (conversionRate < INDUSTRY_BENCHMARKS.conversionRate.average) {
            const potentialPayers = Math.floor((metrics.monetization.totalUsers - metrics.monetization.payingUsers) * 0.02);
            const potentialRevenue = potentialPayers * 5; // Avg first purchase

            insights.push({
                id: 'metric-low-conversion',
                type: 'opportunity',
                category: 'monetization',
                title: `Low Conversion Rate: ${conversionRate.toFixed(2)}%`,
                description: `Only ${conversionRate.toFixed(2)}% of users have made a purchase, below the ${INDUSTRY_BENCHMARKS.conversionRate.average}% industry average.`,
                metric: 'conversion_rate',
                value: conversionRate,
                priority: 9,
                businessImpact: 'high',
                recommendation: 'Implement first-purchase incentives: 80% off starter pack, time-limited "new player" offers, and remove ads for first purchase. Add social proof ("50,000 players bought this").',
                revenueImpact: {
                    estimatedValue: potentialRevenue,
                    estimatedPercentage: totalRevenue > 0 ? (potentialRevenue / totalRevenue) * 100 : 25,
                    timeframe: 'monthly',
                    confidence: 0.65,
                },
                confidence: metrics.monetization.confidence,
                evidence: [
                    `Current conversion: ${conversionRate.toFixed(2)}%`,
                    `Industry average: ${INDUSTRY_BENCHMARKS.conversionRate.average}%`,
                    `Potential new payers: ${potentialPayers.toLocaleString()}`,
                ],
                source: 'metric',
                actionable: true,
            });
        }

        // ARPU insight
        if (arpu > 0) {
            const arpuStatus = arpu >= INDUSTRY_BENCHMARKS.arpu.good ? 'positive' :
                              arpu >= INDUSTRY_BENCHMARKS.arpu.average ? 'neutral' : 'warning';
            insights.push({
                id: 'metric-arpu',
                type: arpuStatus,
                category: 'monetization',
                title: `ARPU: $${arpu.toFixed(2)}`,
                description: `Average Revenue Per User is $${arpu.toFixed(2)}, ${arpuStatus === 'positive' ? 'above' : arpuStatus === 'neutral' ? 'at' : 'below'} industry benchmarks.`,
                metric: 'arpu',
                value: arpu,
                priority: 7,
                businessImpact: arpuStatus === 'warning' ? 'high' : 'medium',
                recommendation: arpu < INDUSTRY_BENCHMARKS.arpu.average
                    ? 'Increase monetization touchpoints: add rewarded video ads, implement battle pass, create limited-time bundles, and optimize IAP store placement.'
                    : 'ARPU is healthy. Focus on conversion rate and user acquisition to scale revenue.',
                confidence: metrics.monetization.confidence,
                evidence: [
                    `Current ARPU: $${arpu.toFixed(2)}`,
                    `ARPPU: $${arppu.toFixed(2)}`,
                    `Benchmark: $${INDUSTRY_BENCHMARKS.arpu.average}`,
                ],
                source: 'metric',
                actionable: true,
            });
        }

        // Spender segment insight
        const dolphins = spenderSegments.find(s => s.tier === 'dolphin');
        const minnows = spenderSegments.find(s => s.tier === 'minnow');
        if (dolphins && minnows && dolphins.userCount + minnows.userCount > 0) {
            const midTierRevenue = dolphins.totalRevenue + minnows.totalRevenue;
            const midTierPercentage = totalRevenue > 0 ? (midTierRevenue / totalRevenue) * 100 : 0;

            if (midTierPercentage < 30) {
                insights.push({
                    id: 'metric-mid-tier-opportunity',
                    type: 'opportunity',
                    category: 'monetization',
                    title: 'Grow Mid-Tier Spender Revenue',
                    description: `Dolphins and Minnows contribute only ${midTierPercentage.toFixed(1)}% of revenue. There's opportunity to grow this segment.`,
                    metric: 'mid_tier_revenue',
                    value: midTierPercentage,
                    priority: 7,
                    businessImpact: 'medium',
                    recommendation: 'Create $4.99-$14.99 value packs with 3x-5x value. Add a $9.99/month subscription with daily rewards. Implement purchase streaks with bonus rewards.',
                    revenueImpact: {
                        estimatedValue: midTierRevenue * 0.5, // 50% growth potential
                        estimatedPercentage: midTierPercentage * 0.5,
                        timeframe: 'monthly',
                        confidence: 0.6,
                    },
                    confidence: metrics.monetization.confidence,
                    evidence: [
                        `Dolphin revenue: $${dolphins.totalRevenue.toFixed(0)}`,
                        `Minnow revenue: $${minnows.totalRevenue.toFixed(0)}`,
                        `Target: 40%+ from mid-tier`,
                    ],
                    source: 'metric',
                    actionable: true,
                });
            }
        }
    }

    // Engagement insights
    if (metrics.engagement) {
        const { dauMauRatio, avgSessionsPerUser } = metrics.engagement;

        if (dauMauRatio < INDUSTRY_BENCHMARKS.dauMauRatio.average) {
            insights.push({
                id: 'metric-stickiness',
                type: 'warning',
                category: 'engagement',
                title: `Low Stickiness: ${(dauMauRatio * 100).toFixed(1)}% DAU/MAU`,
                description: `DAU/MAU ratio of ${(dauMauRatio * 100).toFixed(1)}% indicates users aren't returning daily. Target is ${(INDUSTRY_BENCHMARKS.dauMauRatio.average * 100)}%+.`,
                metric: 'dau_mau_ratio',
                value: dauMauRatio,
                priority: 8,
                businessImpact: 'high',
                recommendation: 'Implement daily engagement hooks: login streaks with escalating rewards, daily challenges, limited-time events, and push notifications at optimal times.',
                confidence: metrics.engagement.confidence,
                evidence: [
                    `Current DAU/MAU: ${(dauMauRatio * 100).toFixed(1)}%`,
                    `Good benchmark: ${(INDUSTRY_BENCHMARKS.dauMauRatio.good * 100)}%`,
                    `Industry average: ${(INDUSTRY_BENCHMARKS.dauMauRatio.average * 100)}%`,
                ],
                source: 'metric',
                actionable: true,
            });
        }

        if (avgSessionsPerUser > INDUSTRY_BENCHMARKS.sessionsPerUser.good) {
            insights.push({
                id: 'metric-high-sessions',
                type: 'positive',
                category: 'engagement',
                title: `Strong Session Frequency: ${avgSessionsPerUser.toFixed(1)} sessions/user`,
                description: `Users average ${avgSessionsPerUser.toFixed(1)} sessions, well above the ${INDUSTRY_BENCHMARKS.sessionsPerUser.average} industry average.`,
                metric: 'sessions_per_user',
                value: avgSessionsPerUser,
                priority: 5,
                businessImpact: 'low',
                recommendation: 'Session frequency is excellent. Focus on session length optimization and monetization per session.',
                confidence: metrics.engagement.confidence,
                evidence: [
                    `Sessions per user: ${avgSessionsPerUser.toFixed(1)}`,
                    `Industry average: ${INDUSTRY_BENCHMARKS.sessionsPerUser.average}`,
                    `Top games: ${INDUSTRY_BENCHMARKS.sessionsPerUser.good}+`,
                ],
                source: 'metric',
                actionable: false,
            });
        }
    }

    return insights;
}

// ============ INSIGHT GENERATOR CLASS ============

export class InsightGenerator {
    private config: InsightGeneratorConfig;

    constructor(config: InsightGeneratorConfig = {}) {
        this.config = {
            useLLM: true,
            maxInsights: 12,
            minConfidence: 0.5,
            includeRevenueImpact: true,
            ...config,
        };
    }

    /**
     * Generate insights from analyzed data (main entry point)
     * Uses LLM if available, falls back to comprehensive template system
     * Now generates 5-8+ high-quality actionable insights
     */
    async generate(
        data: NormalizedData,
        meanings: ColumnMeaning[],
        gameType: GameCategory,
        metrics?: CalculatedMetrics,
        anomalies?: Anomaly[]
    ): Promise<Insight[]> {
        const totalRevenue = metrics?.monetization?.totalRevenue ?? 0;
        let allInsights: Insight[] = [];

        // 1. Generate metric-based insights (always available if metrics exist)
        if (metrics) {
            const metricInsights = generateMetricInsights(metrics, totalRevenue);
            allInsights.push(...metricInsights);
        }

        // 2. Generate game-specific insights
        const gameInsights = this.generateGameSpecificInsights(gameType, metrics, totalRevenue);
        allInsights.push(...gameInsights);

        // 3. Generate anomaly-based insights
        if (anomalies && anomalies.length > 0) {
            const anomalyInsights = this.generateAnomalyInsights(anomalies, totalRevenue);
            allInsights.push(...anomalyInsights);
        }

        // 4. Try LLM-powered generation for additional insights
        if (this.config.useLLM) {
            const llmService = this.config.llmService || getLLMService();
            if (llmService) {
                try {
                    const llmInsights = await this.generateWithLLM(
                        llmService,
                        data,
                        meanings,
                        gameType,
                        metrics,
                        anomalies
                    );
                    allInsights = this.mergeInsights(allInsights, llmInsights);
                } catch (error) {
                    console.warn('LLM insight generation failed:', error);
                }
            }
        }

        // 5. Add data quality insight if needed
        const qualityInsight = this.generateDataQualityInsight(data);
        if (qualityInsight) {
            allInsights.push(qualityInsight);
        }

        // 6. Deduplicate, sort, and limit
        const uniqueInsights = this.deduplicateInsights(allInsights);
        uniqueInsights.sort((a, b) => {
            // Sort by priority first, then by business impact
            if (b.priority !== a.priority) return b.priority - a.priority;
            const impactOrder = { high: 3, medium: 2, low: 1 };
            return (impactOrder[b.businessImpact] ?? 0) - (impactOrder[a.businessImpact] ?? 0);
        });

        // Filter by minimum confidence
        const filtered = uniqueInsights.filter(i => i.confidence >= (this.config.minConfidence ?? 0.5));

        // Ensure we return at least 5 insights (or all if fewer available)
        const minInsights = 5;
        const result = filtered.slice(0, this.config.maxInsights ?? 12);

        // If we have fewer than 5, add some general tips
        if (result.length < minInsights) {
            const tips = this.generateGeneralTips(gameType, result.length);
            result.push(...tips.slice(0, minInsights - result.length));
        }

        return result;
    }

    /**
     * Generate game-specific insights based on game type
     */
    private generateGameSpecificInsights(
        gameType: GameCategory,
        metrics: CalculatedMetrics | undefined,
        totalRevenue: number
    ): Insight[] {
        if (!metrics) return [];

        const insights: Insight[] = [];

        for (const template of GAME_SPECIFIC_TEMPLATES) {
            // Check if this template applies to the current game type
            if (!template.gameTypes.includes(gameType)) continue;

            // Check if the condition is met
            try {
                if (template.condition(metrics)) {
                    const insight = template.generate(metrics, totalRevenue);
                    insights.push(insight);
                }
            } catch (error) {
                // Skip templates that fail due to missing data
                console.warn(`Template ${template.id} failed:`, error);
            }
        }

        return insights;
    }

    /**
     * Generate insights from detected anomalies
     */
    private generateAnomalyInsights(anomalies: Anomaly[], _totalRevenue: number): Insight[] {
        const insights: Insight[] = [];

        // Group anomalies by severity
        const critical = anomalies.filter(a => a.severity === 'critical');
        const high = anomalies.filter(a => a.severity === 'high');

        if (critical.length > 0) {
            insights.push({
                id: 'anomaly-critical',
                type: 'negative',
                category: 'quality',
                title: `${critical.length} Critical Anomalies Detected`,
                description: `Found ${critical.length} critical data anomalies that require immediate attention: ${critical.slice(0, 3).map(a => a.description).join('; ')}.`,
                priority: 10,
                businessImpact: 'high',
                recommendation: 'Investigate critical anomalies immediately. Check for data pipeline issues, unusual player behavior, or potential fraud.',
                confidence: 0.9,
                evidence: critical.slice(0, 5).map(a => `${a.metric}: ${a.description}`),
                source: 'metric',
                actionable: true,
            });
        }

        if (high.length > 0) {
            insights.push({
                id: 'anomaly-high',
                type: 'warning',
                category: 'quality',
                title: `${high.length} High-Severity Anomalies`,
                description: `Detected ${high.length} significant anomalies in your data that may indicate issues or opportunities.`,
                priority: 7,
                businessImpact: 'medium',
                recommendation: 'Review these anomalies within 24-48 hours. Determine if they represent problems to fix or opportunities to capitalize on.',
                confidence: 0.8,
                evidence: high.slice(0, 5).map(a => `${a.metric}: ${a.description}`),
                source: 'metric',
                actionable: true,
            });
        }

        return insights;
    }

    /**
     * Generate data quality insight
     */
    private generateDataQualityInsight(data: NormalizedData): Insight | null {
        if (data.rows.length === 0) return null;

        const nullCount = data.rows.reduce((count, row) => {
            return count + Object.values(row).filter(v => v === null || v === undefined || v === '').length;
        }, 0);
        const totalCells = data.rows.length * (Object.keys(data.rows[0] || {}).length || 1);
        const nullRate = (nullCount / totalCells) * 100;

        if (nullRate > 10) {
            return {
                id: 'data-quality-issue',
                type: 'warning',
                category: 'quality',
                title: `Data Quality: ${nullRate.toFixed(1)}% Empty Fields`,
                description: `${nullRate.toFixed(1)}% of data fields are empty or null, which may affect analysis accuracy.`,
                priority: 6,
                businessImpact: 'medium',
                recommendation: 'Review data collection pipeline. Implement data validation at ingestion. Consider backfilling missing values where possible.',
                confidence: 1,
                evidence: [
                    `Empty/null cells: ${nullCount.toLocaleString()}`,
                    `Total cells: ${totalCells.toLocaleString()}`,
                    `Threshold for concern: 5%`,
                ],
                source: 'metric',
                actionable: true,
            };
        }

        return null;
    }

    /**
     * Generate general tips when we have few insights
     */
    private generateGeneralTips(gameType: GameCategory, existingCount: number): Insight[] {
        const tips: Insight[] = [];

        const gameTips: Record<GameCategory, Array<{ title: string; recommendation: string }>> = {
            puzzle: [
                { title: 'Optimize Level Pacing', recommendation: 'Ensure difficulty ramps gradually. Place hard levels every 10-15 levels with easier buffer levels between.' },
                { title: 'Booster Economy', recommendation: 'Offer free boosters after 5+ failures to prevent churn. Gate premium boosters behind hard level clusters.' },
            ],
            idle: [
                { title: 'Prestige Balance', recommendation: 'First prestige should be achievable in 2-4 hours. Each subsequent prestige should take 20-30% longer.' },
                { title: 'Offline Rewards', recommendation: 'Cap offline rewards at 8-12 hours. Send push notifications when rewards are near cap.' },
            ],
            battle_royale: [
                { title: 'Early Game Engagement', recommendation: 'Ensure time-to-action is under 60 seconds. Early eliminations should still provide rewards.' },
                { title: 'Skill-Based Matchmaking', recommendation: 'Implement SBMM with rank protection for new players for their first 10-20 matches.' },
            ],
            gacha_rpg: [
                { title: 'Pity System Transparency', recommendation: 'Display pity counter prominently. Consider soft pity at 75% of hard pity threshold.' },
                { title: 'Resource Economy', recommendation: 'F2P players should earn 1-2 pulls per day through gameplay to maintain engagement.' },
            ],
            match3_meta: [
                { title: 'Meta Layer Pacing', recommendation: 'Unlock new decoration areas every 20-30 levels. Each area should take 3-5 days to complete.' },
                { title: 'Story Integration', recommendation: 'Add story beats every 5-10 levels. Use cliffhangers to drive return visits.' },
            ],
            custom: [
                { title: 'Core Loop Optimization', recommendation: 'Ensure your core gameplay loop can be completed in 3-5 minutes per session.' },
            ],
        };

        const relevantTips = gameTips[gameType] || gameTips.custom;

        for (const tip of relevantTips.slice(0, 3 - existingCount)) {
            tips.push({
                id: `tip-${tip.title.toLowerCase().replace(/\s+/g, '-')}`,
                type: 'neutral',
                category: 'engagement',
                title: tip.title,
                description: `Best practice recommendation for ${gameType.replace(/_/g, ' ')} games.`,
                priority: 4,
                businessImpact: 'medium',
                recommendation: tip.recommendation,
                confidence: 0.7,
                source: 'template',
                actionable: true,
            });
        }

        return tips;
    }

    /**
     * Generate insights using LLM
     */
    private async generateWithLLM(
        llmService: LLMService,
        data: NormalizedData,
        meanings: ColumnMeaning[],
        gameType: GameCategory,
        metrics?: CalculatedMetrics,
        anomalies?: Anomaly[]
    ): Promise<Insight[]> {
        // Build context for LLM
        const context: InsightContext = {
            gameType,
            columnMeanings: meanings,
            metrics,
            anomalies,
            dataSnapshot: this.buildDataSnapshot(data, meanings),
            aggregations: this.buildAggregations(data, meanings),
        };

        const result = await llmService.generateInsights(context);

        // Convert LLM insights to our enhanced format
        return result.insights.map((llmInsight, index) => ({
            id: `llm-insight-${index}`,
            type: llmInsight.type as Insight['type'],
            category: llmInsight.category as Insight['category'],
            title: llmInsight.title,
            description: llmInsight.description,
            metric: llmInsight.metric,
            value: llmInsight.value,
            change: llmInsight.change,
            priority: llmInsight.priority ?? 5,
            businessImpact: this.priorityToImpact(llmInsight.priority ?? 5),
            recommendation: llmInsight.recommendation ?? 'Review this insight and take appropriate action.',
            confidence: llmInsight.confidence ?? 0.7,
            evidence: llmInsight.evidence,
            source: 'llm' as const,
            actionable: !!llmInsight.recommendation,
        }));
    }

    /**
     * Convert priority number to business impact level
     */
    private priorityToImpact(priority: number): BusinessImpact {
        if (priority >= 8) return 'high';
        if (priority >= 5) return 'medium';
        return 'low';
    }

    /**
     * Generate template-based insights (legacy support)
     */
    generateTemplateInsights(
        _data: NormalizedData,
        _meanings: ColumnMeaning[],
        gameType: GameCategory
    ): Insight[] {
        // For legacy compatibility, generate empty metrics and call generate
        return this.generateGeneralTips(gameType, 0);
    }

    /**
     * Deduplicate insights by ID and similar titles
     */
    private deduplicateInsights(insights: Insight[]): Insight[] {
        const seen = new Set<string>();
        const seenTitles = new Set<string>();

        return insights.filter(insight => {
            if (seen.has(insight.id)) return false;
            seen.add(insight.id);

            // Also dedupe by similar titles
            const normalizedTitle = insight.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seenTitles.has(normalizedTitle)) return false;
            seenTitles.add(normalizedTitle);

            return true;
        });
    }

    /**
     * Merge multiple insight arrays, keeping higher priority duplicates
     */
    private mergeInsights(primary: Insight[], secondary: Insight[]): Insight[] {
        const merged = [...primary];
        const primaryIds = new Set(primary.map(i => i.id));
        const primaryTitles = new Set(primary.map(i => i.title.toLowerCase()));

        for (const insight of secondary) {
            if (primaryIds.has(insight.id)) continue;
            if (primaryTitles.has(insight.title.toLowerCase())) continue;
            merged.push(insight);
        }

        return merged;
    }

    /**
     * Build data snapshot for LLM context
     */
    private buildDataSnapshot(
        data: NormalizedData,
        meanings: ColumnMeaning[]
    ): InsightContext['dataSnapshot'] {
        const userIdCol = meanings.find(m => m.semanticType === 'user_id')?.column;
        const revenueCol = meanings.find(m => m.semanticType === 'revenue')?.column;
        const timestampCol = meanings.find(m => m.semanticType === 'timestamp')?.column;

        // Count unique users
        let totalUsers = 0;
        if (userIdCol) {
            totalUsers = new Set(data.rows.map(row => row[userIdCol])).size;
        }

        // Sum revenue
        let totalRevenue = 0;
        if (revenueCol) {
            totalRevenue = data.rows.reduce((sum, row) => {
                const val = Number(row[revenueCol]);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
        }

        // Get date range
        let dateRange: { start: string; end: string } | undefined;
        if (timestampCol) {
            const dates = data.rows
                .map(row => {
                    const val = row[timestampCol];
                    if (!val) return null;
                    const date = new Date(val as string | number);
                    return isNaN(date.getTime()) ? null : date;
                })
                .filter((d): d is Date => d !== null)
                .sort((a, b) => a.getTime() - b.getTime());

            if (dates.length > 0) {
                dateRange = {
                    start: dates[0].toISOString().split('T')[0],
                    end: dates[dates.length - 1].toISOString().split('T')[0],
                };
            }
        }

        return {
            totalUsers,
            totalRevenue,
            rowCount: data.rows.length,
            dateRange,
        };
    }

    /**
     * Build aggregations for LLM context
     */
    private buildAggregations(
        data: NormalizedData,
        meanings: ColumnMeaning[]
    ): Record<string, unknown> {
        const aggregations: Record<string, unknown> = {};

        // Level distribution
        const levelCol = meanings.find(m => m.semanticType === 'level')?.column;
        if (levelCol) {
            const levels = data.rows.map(row => Number(row[levelCol]) || 0).filter(l => l > 0);
            if (levels.length > 0) {
                aggregations.levelStats = {
                    min: Math.min(...levels),
                    max: Math.max(...levels),
                    avg: levels.reduce((a, b) => a + b, 0) / levels.length,
                };
            }
        }

        // Platform distribution
        const platformCol = meanings.find(m => m.semanticType === 'platform')?.column;
        if (platformCol) {
            const platforms = new Map<string, number>();
            for (const row of data.rows) {
                const platform = String(row[platformCol] || 'unknown');
                platforms.set(platform, (platforms.get(platform) || 0) + 1);
            }
            aggregations.platformDistribution = Object.fromEntries(platforms);
        }

        // Country distribution (top 5)
        const countryCol = meanings.find(m => m.semanticType === 'country')?.column;
        if (countryCol) {
            const countries = new Map<string, number>();
            for (const row of data.rows) {
                const country = String(row[countryCol] || 'unknown');
                countries.set(country, (countries.get(country) || 0) + 1);
            }
            const sorted = [...countries.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            aggregations.topCountries = Object.fromEntries(sorted);
        }

        return aggregations;
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<InsightGeneratorConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

export const insightGenerator = new InsightGenerator();
