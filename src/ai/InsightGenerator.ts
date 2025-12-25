/**
 * Insight Generator
 * Generates actionable insights from data analysis
 * Supports both template-based and LLM-powered generation
 */

import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';
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

export interface Insight {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning' | 'opportunity';
    category?: 'retention' | 'monetization' | 'engagement' | 'progression' | 'quality';
    title: string;
    description: string;
    metric?: string;
    value?: number | string;
    change?: number;
    priority?: number;
    recommendation?: string;
    confidence?: number;
    evidence?: string[];
    source?: 'template' | 'llm';
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
}

// ============ INSIGHT TEMPLATES ============

const INSIGHT_TEMPLATES: {
    requires: SemanticType[];
    category: Insight['category'];
    generate: (data: NormalizedData, columns: Map<SemanticType, string>) => Insight | null;
}[] = [
    {
        requires: ['revenue'],
        category: 'monetization',
        generate: (data, cols) => {
            const revenueCol = cols.get('revenue')!;
            const total = data.rows.reduce((sum, row) => sum + (Number(row[revenueCol]) || 0), 0);
            return {
                id: 'total-revenue',
                type: 'positive',
                category: 'monetization',
                title: 'Total Revenue',
                description: `Your dataset contains $${total.toLocaleString()} in revenue data.`,
                metric: 'revenue',
                value: total,
                priority: 7,
                confidence: 1,
                source: 'template',
            };
        }
    },
    {
        requires: ['user_id'],
        category: 'engagement',
        generate: (data, cols) => {
            const userCol = cols.get('user_id')!;
            const uniqueUsers = new Set(data.rows.map(row => row[userCol])).size;
            return {
                id: 'unique-users',
                type: 'neutral',
                category: 'engagement',
                title: 'Unique Users',
                description: `Found ${uniqueUsers.toLocaleString()} unique users in the dataset.`,
                metric: 'users',
                value: uniqueUsers,
                priority: 5,
                confidence: 1,
                source: 'template',
            };
        }
    },
    {
        requires: ['retention_day'],
        category: 'retention',
        generate: (data, cols) => {
            const retCol = cols.get('retention_day')!;
            const hasLowRetention = data.rows.some(row => {
                const val = Number(row[retCol]);
                return val > 0 && val < 20;
            });
            if (hasLowRetention) {
                return {
                    id: 'retention-warning',
                    type: 'warning',
                    category: 'retention',
                    title: 'Retention Opportunity',
                    description: 'Consider analyzing early retention drop-offs.',
                    recommendation: 'Focus on Day 1-3 engagement features.',
                    priority: 8,
                    confidence: 0.7,
                    source: 'template',
                };
            }
            return null;
        }
    },
    {
        requires: ['level'],
        category: 'progression',
        generate: (data, cols) => {
            const levelCol = cols.get('level')!;
            const levels = data.rows.map(row => Number(row[levelCol]) || 0).filter(l => l > 0);
            if (levels.length === 0) return null;

            const maxLevel = Math.max(...levels);
            const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
            return {
                id: 'level-distribution',
                type: 'neutral',
                category: 'progression',
                title: 'Level Progress',
                description: `Players range from level 1 to ${maxLevel}. Average: ${avgLevel.toFixed(1)}`,
                metric: 'level',
                value: avgLevel,
                priority: 4,
                confidence: 1,
                source: 'template',
            };
        }
    },
    {
        requires: ['error_type'],
        category: 'quality',
        generate: (data, cols) => {
            const errorCol = cols.get('error_type')!;
            const errorCount = data.rows.filter(row => row[errorCol]).length;
            const errorRate = (errorCount / data.rows.length) * 100;
            if (errorRate > 5) {
                return {
                    id: 'error-alert',
                    type: 'negative',
                    category: 'quality',
                    title: 'High Error Rate',
                    description: `${errorRate.toFixed(1)}% of events contain errors.`,
                    metric: 'error_rate',
                    value: errorRate,
                    recommendation: 'Investigate frequent error types.',
                    priority: 9,
                    confidence: 1,
                    source: 'template',
                };
            }
            return null;
        }
    },
    {
        requires: ['session_id', 'user_id'],
        category: 'engagement',
        generate: (data, cols) => {
            const sessionCol = cols.get('session_id')!;
            const userCol = cols.get('user_id')!;

            const userSessions = new Map<string, Set<string>>();
            for (const row of data.rows) {
                const userId = String(row[userCol] ?? '');
                const sessionId = String(row[sessionCol] ?? '');
                if (!userId || !sessionId) continue;

                if (!userSessions.has(userId)) {
                    userSessions.set(userId, new Set());
                }
                userSessions.get(userId)!.add(sessionId);
            }

            if (userSessions.size === 0) return null;

            const avgSessions = Array.from(userSessions.values())
                .reduce((sum, s) => sum + s.size, 0) / userSessions.size;

            return {
                id: 'sessions-per-user',
                type: avgSessions > 3 ? 'positive' : 'neutral',
                category: 'engagement',
                title: 'Sessions Per User',
                description: `Users average ${avgSessions.toFixed(1)} sessions each.`,
                metric: 'sessions_per_user',
                value: avgSessions,
                priority: 5,
                confidence: 1,
                source: 'template',
            };
        }
    },
];

// Game-specific insight tips
const GAME_INSIGHTS: Record<GameCategory, string[]> = {
    puzzle: [
        'Consider adding hint systems for stuck players',
        'Level completion times can reveal difficulty spikes',
        'Boosters near hard levels drive IAP conversion',
    ],
    idle: [
        'Optimize offline reward calculations for engagement',
        'Monitor currency inflation over time',
        'Prestige timing affects long-term retention',
    ],
    battle_royale: [
        'Track time-to-first-kill for early engagement',
        'Analyze where players drop most frequently',
        'Weapon balance affects matchmaking satisfaction',
    ],
    match3_meta: [
        'Hard levels should appear every 10-15 stages',
        'Monitor booster usage patterns for balance',
        'Meta progression drives long-term engagement',
    ],
    gacha_rpg: [
        'Track pity system hits and near-misses',
        'Analyze character collection completion rates',
        'Banner timing affects revenue spikes',
    ],
    custom: [
        'Focus on engagement metrics for unknown game types',
    ],
};

// ============ INSIGHT GENERATOR CLASS ============

export class InsightGenerator {
    private config: InsightGeneratorConfig;

    constructor(config: InsightGeneratorConfig = {}) {
        this.config = {
            useLLM: true,
            maxInsights: 10,
            minConfidence: 0.5,
            ...config,
        };
    }

    /**
     * Generate insights from analyzed data (main entry point)
     * Uses LLM if available, falls back to templates
     */
    async generate(
        data: NormalizedData,
        meanings: ColumnMeaning[],
        gameType: GameCategory,
        metrics?: CalculatedMetrics,
        anomalies?: Anomaly[]
    ): Promise<Insight[]> {
        // Try LLM-powered generation first
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

                    // Merge with critical template insights
                    const templateInsights = this.generateTemplateInsights(data, meanings, gameType);
                    return this.mergeInsights(llmInsights, templateInsights);
                } catch (error) {
                    console.warn('LLM insight generation failed, using templates:', error);
                }
            }
        }

        // Fallback to template-only generation
        return this.generateTemplateInsights(data, meanings, gameType);
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

        // Convert LLM insights to our format
        return result.insights.map((llmInsight, index) => ({
            id: `llm-insight-${index}`,
            type: llmInsight.type as Insight['type'],
            category: llmInsight.category,
            title: llmInsight.title,
            description: llmInsight.description,
            metric: llmInsight.metric,
            value: llmInsight.value,
            change: llmInsight.change,
            priority: llmInsight.priority,
            recommendation: llmInsight.recommendation,
            confidence: llmInsight.confidence,
            evidence: llmInsight.evidence,
            source: 'llm' as const,
        }));
    }

    /**
     * Generate template-based insights (synchronous fallback)
     */
    generateTemplateInsights(
        data: NormalizedData,
        meanings: ColumnMeaning[],
        gameType: GameCategory
    ): Insight[] {
        const insights: Insight[] = [];
        const columnMap = new Map(meanings.map(m => [m.semanticType, m.column]));
        const semanticTypes = new Set(meanings.map(m => m.semanticType));

        // Run template-based insights
        for (const template of INSIGHT_TEMPLATES) {
            if (!template.requires.every(t => semanticTypes.has(t))) continue;
            const insight = template.generate(data, columnMap);
            if (insight) insights.push(insight);
        }

        // Add game-specific tip
        const tips = GAME_INSIGHTS[gameType] || GAME_INSIGHTS.custom;
        if (tips.length > 0) {
            insights.push({
                id: 'game-tip',
                type: 'neutral',
                category: 'engagement',
                title: `Tip for ${gameType.replace(/_/g, ' ')} Games`,
                description: tips[Math.floor(Math.random() * tips.length)],
                priority: 3,
                confidence: 0.8,
                source: 'template',
            });
        }

        // Data quality insight
        const nullCount = data.rows.reduce((count, row) => {
            return count + Object.values(row).filter(v => v === null || v === undefined || v === '').length;
        }, 0);
        const totalCells = data.rows.length * (Object.keys(data.rows[0] || {}).length || 1);
        const nullRate = (nullCount / totalCells) * 100;

        if (nullRate > 10) {
            insights.push({
                id: 'data-quality',
                type: 'warning',
                category: 'quality',
                title: 'Data Quality Issue',
                description: `${nullRate.toFixed(1)}% of fields are empty. Consider data cleaning.`,
                priority: 6,
                confidence: 1,
                source: 'template',
            });
        }

        return insights;
    }

    /**
     * Merge LLM and template insights, removing duplicates
     */
    private mergeInsights(llmInsights: Insight[], templateInsights: Insight[]): Insight[] {
        const merged = [...llmInsights];
        const llmTitles = new Set(llmInsights.map(i => i.title.toLowerCase()));

        // Add unique template insights
        for (const insight of templateInsights) {
            // Skip if LLM already covered this topic
            if (llmTitles.has(insight.title.toLowerCase())) continue;

            // Include high-confidence template insights that LLM might have missed
            if (insight.confidence && insight.confidence >= 0.9) {
                merged.push(insight);
            }
        }

        // Sort by priority (higher first)
        merged.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Limit to max insights
        return merged.slice(0, this.config.maxInsights);
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
