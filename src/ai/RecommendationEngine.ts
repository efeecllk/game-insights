/**
 * Recommendation Engine
 * AI-generated actionable recommendations
 * Phase 5: Advanced AI & Automation
 */

import type { GameCategory } from '../types';
import type { UserFeatures, ChurnPrediction, LTVPrediction } from './ml/types';

// ============================================================================
// Types
// ============================================================================

export type RecommendationCategory =
    | 'retention'
    | 'monetization'
    | 'engagement'
    | 'acquisition'
    | 'progression'
    | 'quality';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Recommendation {
    id: string;
    category: RecommendationCategory;
    priority: RecommendationPriority;
    title: string;
    description: string;
    rationale: string;
    actions: RecommendationAction[];
    impact: ImpactEstimate;
    confidence: number;
    relatedMetrics: string[];
    createdAt: string;
    expiresAt?: string;
}

export interface RecommendationAction {
    type: 'implement' | 'investigate' | 'monitor' | 'experiment';
    description: string;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
}

export interface ImpactEstimate {
    metric: string;
    currentValue: number;
    projectedValue: number;
    changePercent: number;
    revenueImpact?: {
        monthly: number;
        yearly: number;
    };
    confidenceRange: [number, number];
}

// ============================================================================
// Recommendation Templates
// ============================================================================

interface RecommendationTemplate {
    id: string;
    category: RecommendationCategory;
    condition: (context: RecommendationContext) => boolean;
    priority: (context: RecommendationContext) => RecommendationPriority;
    generate: (context: RecommendationContext) => Partial<Recommendation>;
}

interface RecommendationContext {
    // Metrics
    dau: number;
    mau: number;
    d1Retention: number;
    d7Retention: number;
    d30Retention: number;
    arpu: number;
    arppu: number;
    payerConversionRate: number;
    avgSessionLength: number;
    avgSessionsPerDay: number;

    // Trends
    dauTrend: number; // -1 to 1
    revenueTrend: number;
    retentionTrend: number;

    // Game specific
    gameType: GameCategory;
    avgLevel: number;
    hardestLevel?: number;
    topDropoffLevel?: number;

    // User segments
    atRiskUsers: number;
    atRiskPercentage: number;
    highValueUsers: number;
    nonPayersEngaged: number;

    // Historical
    benchmarks: Record<string, number>;
}

// ============================================================================
// Recommendation Templates Library
// ============================================================================

const TEMPLATES: RecommendationTemplate[] = [
    // Retention Templates
    {
        id: 'low_d1_retention',
        category: 'retention',
        condition: (ctx) => ctx.d1Retention < 0.35,
        priority: (ctx) => ctx.d1Retention < 0.25 ? 'critical' : 'high',
        generate: (ctx) => ({
            title: 'Improve First-Day Experience',
            description: `D1 retention is ${(ctx.d1Retention * 100).toFixed(1)}%, below the recommended 40% for ${ctx.gameType} games.`,
            rationale: 'First-day retention is the strongest predictor of long-term success. Users who return on day 1 are 3x more likely to become long-term players.',
            actions: [
                {
                    type: 'implement',
                    description: 'Streamline tutorial to under 2 minutes',
                    effort: 'medium',
                    timeframe: '1-2 weeks',
                },
                {
                    type: 'implement',
                    description: 'Add "quick win" moment in first session',
                    effort: 'medium',
                    timeframe: '1 week',
                },
                {
                    type: 'experiment',
                    description: 'A/B test push notification timing for D1 reminder',
                    effort: 'low',
                    timeframe: '2 weeks',
                },
            ],
            impact: {
                metric: 'd1_retention',
                currentValue: ctx.d1Retention,
                projectedValue: Math.min(0.45, ctx.d1Retention * 1.3),
                changePercent: 30,
                revenueImpact: {
                    monthly: ctx.dau * ctx.arpu * 0.3 * 30,
                    yearly: ctx.dau * ctx.arpu * 0.3 * 365,
                },
                confidenceRange: [0.7, 0.9],
            },
            relatedMetrics: ['d1_retention', 'tutorial_completion', 'first_session_length'],
        }),
    },
    {
        id: 'd7_drop',
        category: 'retention',
        condition: (ctx) => ctx.d7Retention / ctx.d1Retention < 0.35,
        priority: () => 'high',
        generate: (ctx) => ({
            title: 'Address Early Game Content Gap',
            description: `Only ${((ctx.d7Retention / ctx.d1Retention) * 100).toFixed(0)}% of D1 users return by D7. This suggests content or engagement issues in the first week.`,
            rationale: 'The D1→D7 transition is where most users decide if a game is worth their time. A steep drop indicates the core loop isn\'t compelling enough.',
            actions: [
                {
                    type: 'investigate',
                    description: 'Analyze where users stop in first week (level, feature)',
                    effort: 'low',
                    timeframe: '2-3 days',
                },
                {
                    type: 'implement',
                    description: 'Add daily login rewards with increasing value',
                    effort: 'medium',
                    timeframe: '1 week',
                },
                {
                    type: 'implement',
                    description: 'Introduce a "week 1 goal" system',
                    effort: 'medium',
                    timeframe: '1-2 weeks',
                },
            ],
            impact: {
                metric: 'd7_retention',
                currentValue: ctx.d7Retention,
                projectedValue: ctx.d7Retention * 1.25,
                changePercent: 25,
                confidenceRange: [0.6, 0.85],
            },
            relatedMetrics: ['d7_retention', 'd3_retention', 'sessions_per_week'],
        }),
    },
    {
        id: 'level_bottleneck',
        category: 'progression',
        condition: (ctx) => ctx.topDropoffLevel !== undefined && ctx.topDropoffLevel < 20,
        priority: () => 'high',
        generate: (ctx) => ({
            title: `Fix Progression Blocker at Level ${ctx.topDropoffLevel}`,
            description: `Level ${ctx.topDropoffLevel} is causing significant player drop-off. This is blocking ${((ctx.atRiskPercentage) * 100).toFixed(0)}% of active players.`,
            rationale: 'Players who get stuck for too long without progress will churn. Early-game blockers are especially damaging.',
            actions: [
                {
                    type: 'investigate',
                    description: `Playtest level ${ctx.topDropoffLevel} to identify difficulty spikes`,
                    effort: 'low',
                    timeframe: '1-2 days',
                },
                {
                    type: 'implement',
                    description: 'Reduce difficulty or add hint system',
                    effort: 'medium',
                    timeframe: '3-5 days',
                },
                {
                    type: 'implement',
                    description: 'Add optional easy mode or skip after 3 failures',
                    effort: 'medium',
                    timeframe: '1 week',
                },
            ],
            impact: {
                metric: 'level_completion_rate',
                currentValue: 0.4,
                projectedValue: 0.65,
                changePercent: 62,
                revenueImpact: {
                    monthly: ctx.dau * ctx.arpu * 0.15 * 30,
                    yearly: ctx.dau * ctx.arpu * 0.15 * 365,
                },
                confidenceRange: [0.7, 0.9],
            },
            relatedMetrics: ['level_attempts', 'failure_rate', 'd7_retention'],
        }),
    },

    // Monetization Templates
    {
        id: 'low_conversion',
        category: 'monetization',
        condition: (ctx) => ctx.payerConversionRate < 0.02,
        priority: (ctx) => ctx.payerConversionRate < 0.01 ? 'critical' : 'high',
        generate: (ctx) => ({
            title: 'Improve Payer Conversion Rate',
            description: `Only ${(ctx.payerConversionRate * 100).toFixed(2)}% of users convert to paying. Industry average is 2-5%.`,
            rationale: 'Payer conversion is the foundation of F2P monetization. Even small improvements have outsized revenue impact.',
            actions: [
                {
                    type: 'implement',
                    description: 'Add time-limited starter pack offer ($0.99-$2.99)',
                    effort: 'low',
                    timeframe: '3-5 days',
                },
                {
                    type: 'experiment',
                    description: 'Test showing IAP at natural "want" moments',
                    effort: 'medium',
                    timeframe: '1-2 weeks',
                },
                {
                    type: 'implement',
                    description: 'Add "try before you buy" limited free samples',
                    effort: 'medium',
                    timeframe: '1 week',
                },
            ],
            impact: {
                metric: 'payer_conversion',
                currentValue: ctx.payerConversionRate,
                projectedValue: ctx.payerConversionRate * 2,
                changePercent: 100,
                revenueImpact: {
                    monthly: ctx.mau * ctx.arppu * ctx.payerConversionRate * 30,
                    yearly: ctx.mau * ctx.arppu * ctx.payerConversionRate * 365,
                },
                confidenceRange: [0.5, 0.8],
            },
            relatedMetrics: ['payer_conversion', 'first_purchase_day', 'starter_pack_conversion'],
        }),
    },
    {
        id: 'high_intent_non_payers',
        category: 'monetization',
        condition: (ctx) => ctx.nonPayersEngaged > 50,
        priority: () => 'medium',
        generate: (ctx) => ({
            title: 'Convert Engaged Non-Payers',
            description: `${ctx.nonPayersEngaged} highly engaged users haven't purchased yet. They have 3x higher conversion potential.`,
            rationale: 'Engaged non-payers are showing intent through gameplay. They\'re ready for the right offer at the right time.',
            actions: [
                {
                    type: 'implement',
                    description: 'Target with personalized offers based on gameplay',
                    effort: 'medium',
                    timeframe: '1 week',
                },
                {
                    type: 'implement',
                    description: 'Show "most popular" items among similar players',
                    effort: 'low',
                    timeframe: '3 days',
                },
                {
                    type: 'experiment',
                    description: 'Test discounted first-purchase offer',
                    effort: 'low',
                    timeframe: '1 week',
                },
            ],
            impact: {
                metric: 'conversion_from_engaged',
                currentValue: 0,
                projectedValue: ctx.nonPayersEngaged * 0.15 * ctx.arppu,
                changePercent: 100,
                revenueImpact: {
                    monthly: ctx.nonPayersEngaged * 0.15 * ctx.arppu * 30,
                    yearly: ctx.nonPayersEngaged * 0.15 * ctx.arppu * 365,
                },
                confidenceRange: [0.4, 0.7],
            },
            relatedMetrics: ['high_intent_users', 'time_to_first_purchase', 'offer_conversion'],
        }),
    },

    // Engagement Templates
    {
        id: 'low_session_length',
        category: 'engagement',
        condition: (ctx) => ctx.avgSessionLength < 5,
        priority: () => 'medium',
        generate: (ctx) => ({
            title: 'Increase Session Length',
            description: `Average session is only ${ctx.avgSessionLength.toFixed(1)} minutes. Target is 10+ minutes for ${ctx.gameType} games.`,
            rationale: 'Longer sessions indicate higher engagement and correlate with better retention and monetization.',
            actions: [
                {
                    type: 'implement',
                    description: 'Add session-based rewards (play 10 min, get bonus)',
                    effort: 'low',
                    timeframe: '3-5 days',
                },
                {
                    type: 'investigate',
                    description: 'Identify where sessions typically end',
                    effort: 'low',
                    timeframe: '1-2 days',
                },
                {
                    type: 'implement',
                    description: 'Add "one more game" prompts with incentives',
                    effort: 'low',
                    timeframe: '2-3 days',
                },
            ],
            impact: {
                metric: 'avg_session_length',
                currentValue: ctx.avgSessionLength,
                projectedValue: ctx.avgSessionLength * 1.5,
                changePercent: 50,
                confidenceRange: [0.6, 0.8],
            },
            relatedMetrics: ['session_length', 'sessions_per_day', 'd7_retention'],
        }),
    },

    // Churn Prevention Templates
    {
        id: 'high_churn_risk',
        category: 'retention',
        condition: (ctx) => ctx.atRiskPercentage > 0.15,
        priority: (ctx) => ctx.atRiskPercentage > 0.25 ? 'critical' : 'high',
        generate: (ctx) => ({
            title: 'Address High Churn Risk',
            description: `${(ctx.atRiskPercentage * 100).toFixed(0)}% of users (${ctx.atRiskUsers} people) are showing churn signals.`,
            rationale: 'Proactive churn prevention is 5x more effective than win-back campaigns. These users can still be saved.',
            actions: [
                {
                    type: 'implement',
                    description: 'Send personalized re-engagement notification',
                    effort: 'low',
                    timeframe: '1-2 days',
                },
                {
                    type: 'implement',
                    description: 'Offer "comeback bonus" for returning players',
                    effort: 'low',
                    timeframe: '2-3 days',
                },
                {
                    type: 'investigate',
                    description: 'Survey at-risk users about their experience',
                    effort: 'low',
                    timeframe: '1 week',
                },
            ],
            impact: {
                metric: 'saved_users',
                currentValue: 0,
                projectedValue: ctx.atRiskUsers * 0.3,
                changePercent: 30,
                revenueImpact: {
                    monthly: ctx.atRiskUsers * 0.3 * ctx.arpu * 30,
                    yearly: ctx.atRiskUsers * 0.3 * ctx.arpu * 365,
                },
                confidenceRange: [0.5, 0.75],
            },
            relatedMetrics: ['churn_rate', 'at_risk_users', 'reactivation_rate'],
        }),
    },
];

// ============================================================================
// Recommendation Engine Class
// ============================================================================

export class RecommendationEngine {
    private templates: RecommendationTemplate[] = TEMPLATES;

    /**
     * Generate recommendations based on current context
     */
    generateRecommendations(context: RecommendationContext): Recommendation[] {
        const recommendations: Recommendation[] = [];

        for (const template of this.templates) {
            if (template.condition(context)) {
                const partial = template.generate(context);
                const recommendation: Recommendation = {
                    id: `${template.id}-${Date.now()}`,
                    category: template.category,
                    priority: template.priority(context),
                    title: partial.title || 'Recommendation',
                    description: partial.description || '',
                    rationale: partial.rationale || '',
                    actions: partial.actions || [],
                    impact: partial.impact || {
                        metric: 'unknown',
                        currentValue: 0,
                        projectedValue: 0,
                        changePercent: 0,
                        confidenceRange: [0, 1],
                    },
                    confidence: 0.7,
                    relatedMetrics: partial.relatedMetrics || [],
                    createdAt: new Date().toISOString(),
                };
                recommendations.push(recommendation);
            }
        }

        // Sort by priority
        const priorityOrder: Record<RecommendationPriority, number> = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
        };

        recommendations.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );

        return recommendations;
    }

    /**
     * Generate user-specific recommendations
     */
    generateUserRecommendations(
        features: UserFeatures,
        churnPrediction: ChurnPrediction,
        ltvPrediction: LTVPrediction
    ): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // Churn-based recommendations
        if (churnPrediction.riskLevel === 'critical' || churnPrediction.riskLevel === 'high') {
            recommendations.push({
                id: `user-churn-${features.userId}`,
                category: 'retention',
                priority: churnPrediction.riskLevel === 'critical' ? 'critical' : 'high',
                title: 'User At High Churn Risk',
                description: `This user has ${(churnPrediction.value * 100).toFixed(0)}% probability of churning.`,
                rationale: churnPrediction.factors?.map(f => f.description).join('. ') || '',
                actions: churnPrediction.preventionActions.map(action => ({
                    type: 'implement' as const,
                    description: action,
                    effort: 'low' as const,
                    timeframe: 'Immediate',
                })),
                impact: {
                    metric: 'user_retention',
                    currentValue: 0,
                    projectedValue: 1,
                    changePercent: 100,
                    confidenceRange: [churnPrediction.confidence * 0.8, churnPrediction.confidence],
                },
                confidence: churnPrediction.confidence,
                relatedMetrics: ['churn_probability', 'last_session', 'engagement_trend'],
                createdAt: new Date().toISOString(),
            });
        }

        // LTV-based recommendations
        if (ltvPrediction.segment === 'whale' || ltvPrediction.segment === 'dolphin') {
            recommendations.push({
                id: `user-vip-${features.userId}`,
                category: 'monetization',
                priority: ltvPrediction.segment === 'whale' ? 'high' : 'medium',
                title: `High-Value ${ltvPrediction.segment === 'whale' ? 'VIP' : ''} User`,
                description: `Projected LTV: $${ltvPrediction.value.toFixed(2)}. Prioritize retention.`,
                rationale: 'High-value users represent disproportionate revenue. Their satisfaction is critical.',
                actions: [
                    {
                        type: 'implement',
                        description: 'Offer exclusive VIP perks or early access',
                        effort: 'low',
                        timeframe: 'Ongoing',
                    },
                    {
                        type: 'monitor',
                        description: 'Track engagement closely for any decline',
                        effort: 'low',
                        timeframe: 'Ongoing',
                    },
                ],
                impact: {
                    metric: 'ltv_protection',
                    currentValue: ltvPrediction.value,
                    projectedValue: ltvPrediction.value * 1.2,
                    changePercent: 20,
                    confidenceRange: [ltvPrediction.confidence * 0.7, ltvPrediction.confidence],
                },
                confidence: ltvPrediction.confidence,
                relatedMetrics: ['ltv', 'purchase_frequency', 'session_frequency'],
                createdAt: new Date().toISOString(),
            });
        }

        // Conversion opportunity
        if (!features.isPayer && features.weeklyActiveRatio > 0.5 && features.daysActive > 3) {
            recommendations.push({
                id: `user-convert-${features.userId}`,
                category: 'monetization',
                priority: 'medium',
                title: 'High-Intent Non-Payer',
                description: 'Engaged user who hasn\'t purchased yet. Conversion opportunity.',
                rationale: `User is active ${Math.round(features.weeklyActiveRatio * 7)} days/week but hasn't purchased.`,
                actions: [
                    {
                        type: 'implement',
                        description: 'Show personalized first-purchase offer',
                        effort: 'low',
                        timeframe: 'Immediate',
                    },
                ],
                impact: {
                    metric: 'conversion',
                    currentValue: 0,
                    projectedValue: 1,
                    changePercent: 100,
                    revenueImpact: {
                        monthly: ltvPrediction.projectedSpend30d,
                        yearly: ltvPrediction.projectedSpend365d,
                    },
                    confidenceRange: [0.3, 0.5],
                },
                confidence: 0.4,
                relatedMetrics: ['conversion_probability', 'engagement_level'],
                createdAt: new Date().toISOString(),
            });
        }

        return recommendations;
    }

    /**
     * Create context from metrics
     */
    createContext(metrics: Record<string, number>, gameType: GameCategory): RecommendationContext {
        return {
            dau: metrics.dau || 0,
            mau: metrics.mau || 0,
            d1Retention: metrics.d1_retention || 0,
            d7Retention: metrics.d7_retention || 0,
            d30Retention: metrics.d30_retention || 0,
            arpu: metrics.arpu || 0,
            arppu: metrics.arppu || 0,
            payerConversionRate: metrics.payer_conversion || 0,
            avgSessionLength: metrics.avg_session_length || 0,
            avgSessionsPerDay: metrics.sessions_per_day || 0,
            dauTrend: metrics.dau_trend || 0,
            revenueTrend: metrics.revenue_trend || 0,
            retentionTrend: metrics.retention_trend || 0,
            gameType,
            avgLevel: metrics.avg_level || 0,
            topDropoffLevel: metrics.top_dropoff_level,
            atRiskUsers: metrics.at_risk_users || 0,
            atRiskPercentage: metrics.at_risk_percentage || 0,
            highValueUsers: metrics.high_value_users || 0,
            nonPayersEngaged: metrics.non_payers_engaged || 0,
            benchmarks: {},
        };
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const recommendationEngine = new RecommendationEngine();
