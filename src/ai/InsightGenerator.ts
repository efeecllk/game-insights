/**
 * Insight Generator
 * Generates actionable insights from data analysis
 */

import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';
import { NormalizedData } from '../adapters/BaseAdapter';
import { GameCategory } from '../types';

export interface Insight {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning';
    title: string;
    description: string;
    metric?: string;
    value?: number | string;
    change?: number; // percentage change
    recommendation?: string;
}

// Insight templates based on data patterns
const INSIGHT_TEMPLATES: {
    requires: SemanticType[];
    generate: (data: NormalizedData, columns: Map<SemanticType, string>) => Insight | null;
}[] = [
        {
            requires: ['revenue'],
            generate: (data, cols) => {
                const revenueCol = cols.get('revenue')!;
                const total = data.rows.reduce((sum, row) => sum + (Number(row[revenueCol]) || 0), 0);
                return {
                    id: 'total-revenue',
                    type: 'positive',
                    title: 'Total Revenue',
                    description: `Your dataset contains $${total.toLocaleString()} in revenue data.`,
                    metric: 'revenue',
                    value: total,
                };
            }
        },
        {
            requires: ['user_id'],
            generate: (data, cols) => {
                const userCol = cols.get('user_id')!;
                const uniqueUsers = new Set(data.rows.map(row => row[userCol])).size;
                return {
                    id: 'unique-users',
                    type: 'neutral',
                    title: 'Unique Users',
                    description: `Found ${uniqueUsers.toLocaleString()} unique users in the dataset.`,
                    metric: 'users',
                    value: uniqueUsers,
                };
            }
        },
        {
            requires: ['retention_day'],
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
                        title: 'Retention Opportunity',
                        description: 'Consider analyzing early retention drop-offs.',
                        recommendation: 'Focus on Day 1-3 engagement features.',
                    };
                }
                return null;
            }
        },
        {
            requires: ['level'],
            generate: (data, cols) => {
                const levelCol = cols.get('level')!;
                const levels = data.rows.map(row => Number(row[levelCol]) || 0);
                const maxLevel = Math.max(...levels);
                const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
                return {
                    id: 'level-distribution',
                    type: 'neutral',
                    title: 'Level Progress',
                    description: `Players range from level 1 to ${maxLevel}. Average: ${avgLevel.toFixed(1)}`,
                    metric: 'level',
                    value: avgLevel,
                };
            }
        },
        {
            requires: ['error_type'],
            generate: (data, cols) => {
                const errorCol = cols.get('error_type')!;
                const errorCount = data.rows.filter(row => row[errorCol]).length;
                const errorRate = (errorCount / data.rows.length) * 100;
                if (errorRate > 5) {
                    return {
                        id: 'error-alert',
                        type: 'negative',
                        title: 'High Error Rate',
                        description: `${errorRate.toFixed(1)}% of events contain errors.`,
                        metric: 'error_rate',
                        value: errorRate,
                        recommendation: 'Investigate frequent error types.',
                    };
                }
                return null;
            }
        },
    ];

// Game-specific insights
const GAME_INSIGHTS: Record<GameCategory, string[]> = {
    puzzle: [
        'Consider adding hint systems for stuck players',
        'Level completion times can reveal difficulty spikes',
    ],
    idle: [
        'Optimize offline reward calculations',
        'Monitor currency inflation over time',
    ],
    battle_royale: [
        'Track time-to-first-kill for engagement',
        'Analyze where players drop most frequently',
    ],
    match3_meta: [
        'Hard levels should appear every 10-15 stages',
        'Monitor booster usage patterns',
    ],
    gacha_rpg: [
        'Track pity system hits and near-misses',
        'Analyze character collection completion rates',
    ],
    custom: [],
};

export class InsightGenerator {
    /**
     * Generate insights from analyzed data
     */
    generate(
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

        // Add game-specific tips
        const tips = GAME_INSIGHTS[gameType] || [];
        if (tips.length > 0) {
            insights.push({
                id: 'game-tip',
                type: 'neutral',
                title: `Tip for ${gameType.replace('_', ' ')} Games`,
                description: tips[Math.floor(Math.random() * tips.length)],
            });
        }

        // Data quality insight
        const nullCount = data.rows.reduce((count, row) => {
            return count + Object.values(row).filter(v => v === null || v === undefined).length;
        }, 0);
        const nullRate = (nullCount / (data.rows.length * Object.keys(data.rows[0] || {}).length)) * 100;

        if (nullRate > 10) {
            insights.push({
                id: 'data-quality',
                type: 'warning',
                title: 'Data Quality Issue',
                description: `${nullRate.toFixed(1)}% of fields are empty. Consider data cleaning.`,
            });
        }

        return insights;
    }
}

export const insightGenerator = new InsightGenerator();
