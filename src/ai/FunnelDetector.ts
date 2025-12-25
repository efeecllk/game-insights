/**
 * Funnel Detector
 * Auto-detects and analyzes user progression funnels
 */

import { NormalizedData } from '../adapters/BaseAdapter';
import { ColumnMeaning } from './SchemaAnalyzer';
import { GameCategory } from '../types';

// ============ TYPES ============

export interface FunnelStep {
    id: string;
    name: string;
    eventName?: string;             // If event-based
    condition?: string;             // Description of condition
    userCount: number;
    percentage: number;             // Of total funnel start
    dropOffRate: number;            // From previous step (%)
    avgTimeToNext?: number;         // Seconds to next step
}

export interface DetectedFunnel {
    id: string;
    name: string;
    type: 'progression' | 'conversion' | 'onboarding' | 'custom';
    steps: FunnelStep[];
    totalUsers: number;
    completionRate: number;
    avgCompletionTime: number;      // Seconds
    bottleneck: {
        step: string;
        dropOffRate: number;
        recommendations: string[];
    } | null;
}

export interface FunnelOptimization {
    step: string;
    currentDropOff: number;
    potentialLift: number;          // Estimated improvement
    priority: 'high' | 'medium' | 'low';
    suggestions: string[];
}

export interface FunnelAnalysisResult {
    detectedFunnels: DetectedFunnel[];
    optimizations: FunnelOptimization[];
    gameType: GameCategory;
    analyzedAt: string;
}

// ============ GAME-TYPE FUNNELS ============

interface PredefinedFunnel {
    name: string;
    type: DetectedFunnel['type'];
    steps: { name: string; eventMatch?: string[]; levelRange?: [number, number] }[];
}

const GAME_FUNNELS: Partial<Record<GameCategory, PredefinedFunnel[]>> = {
    puzzle: [
        {
            name: 'Tutorial Completion',
            type: 'onboarding',
            steps: [
                { name: 'Install', eventMatch: ['install', 'first_open'] },
                { name: 'Tutorial Start', eventMatch: ['tutorial_start', 'first_level'] },
                { name: 'Tutorial Complete', eventMatch: ['tutorial_complete', 'tutorial_end'] },
                { name: 'Level 1', levelRange: [1, 1] },
            ],
        },
        {
            name: 'First Week Journey',
            type: 'progression',
            steps: [
                { name: 'Day 1', eventMatch: ['session'] },
                { name: 'Day 3', eventMatch: ['session'] },
                { name: 'Day 7', eventMatch: ['session'] },
                { name: 'First Purchase', eventMatch: ['purchase', 'iap'] },
            ],
        },
    ],
    idle: [
        {
            name: 'Prestige Funnel',
            type: 'progression',
            steps: [
                { name: 'Start', eventMatch: ['session_start', 'first_open'] },
                { name: 'First Milestone', eventMatch: ['milestone', 'achievement'] },
                { name: 'Prestige 1', eventMatch: ['prestige', 'rebirth', 'ascend'] },
                { name: 'Prestige 2', eventMatch: ['prestige', 'rebirth', 'ascend'] },
            ],
        },
    ],
    gacha_rpg: [
        {
            name: 'First Pull Journey',
            type: 'conversion',
            steps: [
                { name: 'Install', eventMatch: ['install', 'first_open'] },
                { name: 'Tutorial', eventMatch: ['tutorial_complete'] },
                { name: 'Free Pull', eventMatch: ['gacha_free', 'free_pull'] },
                { name: 'Paid Pull', eventMatch: ['gacha_paid', 'paid_pull', 'purchase'] },
            ],
        },
    ],
    battle_royale: [
        {
            name: 'Match Completion',
            type: 'progression',
            steps: [
                { name: 'Queue', eventMatch: ['match_start', 'queue'] },
                { name: 'Land', eventMatch: ['land', 'drop'] },
                { name: 'First Kill', eventMatch: ['kill', 'elimination'] },
                { name: 'Top 10', eventMatch: ['placement'] },
                { name: 'Victory', eventMatch: ['win', 'victory'] },
            ],
        },
    ],
    match3_meta: [
        {
            name: 'Meta Engagement',
            type: 'progression',
            steps: [
                { name: 'First Match', levelRange: [1, 1] },
                { name: 'Story Chapter 1', eventMatch: ['story', 'chapter'] },
                { name: 'First Decoration', eventMatch: ['decorate', 'customize'] },
                { name: 'First Purchase', eventMatch: ['purchase', 'iap'] },
            ],
        },
    ],
};

// Optimization suggestions by drop-off location
const OPTIMIZATION_SUGGESTIONS: Record<string, string[]> = {
    tutorial: [
        'Simplify tutorial steps',
        'Add skip option for returning users',
        'Reduce tutorial length',
        'Add progress indicators',
    ],
    early_level: [
        'Reduce early level difficulty',
        'Add more hints or helpers',
        'Improve onboarding tips',
        'Consider softer difficulty curve',
    ],
    mid_level: [
        'Check for difficulty spike',
        'Add checkpoint or save system',
        'Consider difficulty adjustment',
        'Review level design at this point',
    ],
    purchase: [
        'Review pricing strategy',
        'Improve value proposition',
        'Add more purchase triggers',
        'Consider introductory offers',
    ],
    retention: [
        'Add push notifications',
        'Implement daily rewards',
        'Create more engagement hooks',
        'Review content pacing',
    ],
    default: [
        'Investigate user feedback',
        'Review analytics for this step',
        'Consider A/B testing improvements',
    ],
};

// ============ HELPER FUNCTIONS ============

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

function getNumericValue(row: Record<string, unknown>, column: string): number {
    const val = row[column];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function getSuggestionCategory(stepName: string, stepIndex: number, totalSteps: number): string {
    const lowerName = stepName.toLowerCase();

    if (lowerName.includes('tutorial') || stepIndex === 0) return 'tutorial';
    if (lowerName.includes('purchase') || lowerName.includes('buy')) return 'purchase';
    if (lowerName.includes('day') || lowerName.includes('return')) return 'retention';

    if (stepIndex < totalSteps * 0.3) return 'early_level';
    if (stepIndex < totalSteps * 0.7) return 'mid_level';

    return 'default';
}

// ============ FUNNEL DETECTOR CLASS ============

export class FunnelDetector {
    /**
     * Detect and analyze funnels in data
     */
    detect(
        data: NormalizedData,
        columnMeanings: ColumnMeaning[],
        gameType: GameCategory
    ): FunnelAnalysisResult {
        const detectedFunnels: DetectedFunnel[] = [];
        const optimizations: FunnelOptimization[] = [];

        // Find key columns
        const userIdCol = columnMeanings.find(m => m.semanticType === 'user_id')?.column;
        const levelCol = columnMeanings.find(m => m.semanticType === 'level')?.column;
        const eventCol = columnMeanings.find(m => m.semanticType === 'event_name')?.column;
        const funnelStepCol = columnMeanings.find(m => m.semanticType === 'funnel_step')?.column;

        if (!userIdCol) {
            return {
                detectedFunnels: [],
                optimizations: [],
                gameType,
                analyzedAt: new Date().toISOString(),
            };
        }

        // Detect level-based funnel if level column exists
        if (levelCol) {
            const levelFunnel = this.detectLevelFunnel(data, userIdCol, levelCol);
            if (levelFunnel && levelFunnel.steps.length > 0) {
                detectedFunnels.push(levelFunnel);
            }
        }

        // Detect explicit funnel steps if column exists
        if (funnelStepCol) {
            const stepFunnel = this.detectStepFunnel(data, userIdCol, funnelStepCol);
            if (stepFunnel && stepFunnel.steps.length > 0) {
                detectedFunnels.push(stepFunnel);
            }
        }

        // Detect event-based funnels from predefined patterns
        if (eventCol && GAME_FUNNELS[gameType]) {
            for (const predefined of GAME_FUNNELS[gameType]!) {
                const funnel = this.detectEventFunnel(
                    data,
                    userIdCol,
                    eventCol,
                    predefined
                );
                if (funnel && funnel.steps.length > 0 && funnel.completionRate > 0) {
                    detectedFunnels.push(funnel);
                }
            }
        }

        // Generate optimizations for all funnels
        for (const funnel of detectedFunnels) {
            const funnelOptimizations = this.analyzeBottlenecks(funnel);
            optimizations.push(...funnelOptimizations);
        }

        // Sort optimizations by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        optimizations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return {
            detectedFunnels,
            optimizations: optimizations.slice(0, 10), // Top 10
            gameType,
            analyzedAt: new Date().toISOString(),
        };
    }

    /**
     * Detect level-based progression funnel
     */
    detectLevelFunnel(
        data: NormalizedData,
        userIdCol: string,
        levelCol: string,
        maxLevels: number = 20
    ): DetectedFunnel | null {
        // Track max level per user
        const userMaxLevel = new Map<string, number>();

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            const level = getNumericValue(row, levelCol);

            if (!userId || level <= 0) continue;

            const current = userMaxLevel.get(userId) ?? 0;
            if (level > current) {
                userMaxLevel.set(userId, level);
            }
        }

        if (userMaxLevel.size === 0) return null;

        const totalUsers = userMaxLevel.size;

        // Count users at each level
        const levelCounts = new Map<number, number>();
        for (const maxLevel of userMaxLevel.values()) {
            for (let l = 1; l <= Math.min(maxLevel, maxLevels); l++) {
                levelCounts.set(l, (levelCounts.get(l) ?? 0) + 1);
            }
        }

        // Build funnel steps
        const steps: FunnelStep[] = [];
        let prevCount = totalUsers;

        const levels = [...levelCounts.keys()].sort((a, b) => a - b).slice(0, maxLevels);

        for (const level of levels) {
            const count = levelCounts.get(level) ?? 0;
            const dropOff = prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0;

            steps.push({
                id: generateId(),
                name: `Level ${level}`,
                userCount: count,
                percentage: Math.round((count / totalUsers) * 100 * 100) / 100,
                dropOffRate: Math.round(dropOff * 100) / 100,
            });

            prevCount = count;
        }

        // Find bottleneck
        const bottleneck = this.findBottleneck(steps);

        const lastStep = steps[steps.length - 1];
        const completionRate = lastStep ? lastStep.percentage : 0;

        return {
            id: generateId(),
            name: 'Level Progression',
            type: 'progression',
            steps,
            totalUsers,
            completionRate,
            avgCompletionTime: 0, // Would need timestamp data
            bottleneck,
        };
    }

    /**
     * Detect funnel from explicit step column
     */
    detectStepFunnel(
        data: NormalizedData,
        userIdCol: string,
        funnelStepCol: string
    ): DetectedFunnel | null {
        // Track unique users per step
        const stepUsers = new Map<string, Set<string>>();
        const stepOrder: string[] = [];

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            const step = String(row[funnelStepCol] ?? '');

            if (!userId || !step) continue;

            if (!stepUsers.has(step)) {
                stepUsers.set(step, new Set());
                stepOrder.push(step);
            }
            stepUsers.get(step)!.add(userId);
        }

        if (stepUsers.size === 0) return null;

        const totalUsers = stepUsers.get(stepOrder[0])?.size ?? 0;

        // Build steps
        const steps: FunnelStep[] = [];
        let prevCount = totalUsers;

        for (const step of stepOrder) {
            const users = stepUsers.get(step)!;
            const count = users.size;
            const dropOff = prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0;

            steps.push({
                id: generateId(),
                name: step,
                userCount: count,
                percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100 * 100) / 100 : 0,
                dropOffRate: Math.round(dropOff * 100) / 100,
            });

            prevCount = count;
        }

        const bottleneck = this.findBottleneck(steps);
        const lastStep = steps[steps.length - 1];

        return {
            id: generateId(),
            name: 'Conversion Funnel',
            type: 'conversion',
            steps,
            totalUsers,
            completionRate: lastStep ? lastStep.percentage : 0,
            avgCompletionTime: 0,
            bottleneck,
        };
    }

    /**
     * Detect event-based funnel from predefined pattern
     */
    detectEventFunnel(
        data: NormalizedData,
        userIdCol: string,
        eventCol: string,
        predefined: PredefinedFunnel
    ): DetectedFunnel | null {
        // Track users who completed each step
        const stepUsers: Set<string>[] = predefined.steps.map(() => new Set());

        for (const row of data.rows) {
            const userId = String(row[userIdCol] ?? '');
            const event = String(row[eventCol] ?? '').toLowerCase();

            if (!userId || !event) continue;

            // Check each step
            for (let i = 0; i < predefined.steps.length; i++) {
                const step = predefined.steps[i];

                if (step.eventMatch) {
                    const matches = step.eventMatch.some(e =>
                        event.includes(e.toLowerCase())
                    );
                    if (matches) {
                        stepUsers[i].add(userId);
                    }
                }
            }
        }

        // Only include if we have users in first step
        if (stepUsers[0].size === 0) return null;

        const totalUsers = stepUsers[0].size;

        // Build steps
        const steps: FunnelStep[] = [];
        let prevCount = totalUsers;

        for (let i = 0; i < predefined.steps.length; i++) {
            const count = stepUsers[i].size;
            const dropOff = prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0;

            steps.push({
                id: generateId(),
                name: predefined.steps[i].name,
                eventName: predefined.steps[i].eventMatch?.join(', '),
                userCount: count,
                percentage: Math.round((count / totalUsers) * 100 * 100) / 100,
                dropOffRate: Math.round(dropOff * 100) / 100,
            });

            prevCount = count;
        }

        const bottleneck = this.findBottleneck(steps);
        const lastStep = steps[steps.length - 1];

        return {
            id: generateId(),
            name: predefined.name,
            type: predefined.type,
            steps,
            totalUsers,
            completionRate: lastStep ? lastStep.percentage : 0,
            avgCompletionTime: 0,
            bottleneck,
        };
    }

    /**
     * Find the biggest bottleneck in a funnel
     */
    private findBottleneck(steps: FunnelStep[]): DetectedFunnel['bottleneck'] {
        if (steps.length < 2) return null;

        // Find step with highest drop-off (excluding first step which is baseline)
        let maxDropOff = 0;
        let bottleneckStep: FunnelStep | null = null;
        let bottleneckIndex = -1;

        for (let i = 1; i < steps.length; i++) {
            if (steps[i].dropOffRate > maxDropOff) {
                maxDropOff = steps[i].dropOffRate;
                bottleneckStep = steps[i];
                bottleneckIndex = i;
            }
        }

        if (!bottleneckStep || maxDropOff < 10) return null; // Ignore small drop-offs

        const category = getSuggestionCategory(
            bottleneckStep.name,
            bottleneckIndex,
            steps.length
        );

        return {
            step: bottleneckStep.name,
            dropOffRate: maxDropOff,
            recommendations: OPTIMIZATION_SUGGESTIONS[category] || OPTIMIZATION_SUGGESTIONS.default,
        };
    }

    /**
     * Analyze funnel bottlenecks and generate optimization suggestions
     */
    analyzeBottlenecks(funnel: DetectedFunnel): FunnelOptimization[] {
        const optimizations: FunnelOptimization[] = [];

        for (let i = 1; i < funnel.steps.length; i++) {
            const step = funnel.steps[i];

            // Flag steps with > 30% drop-off
            if (step.dropOffRate > 30) {
                const category = getSuggestionCategory(step.name, i, funnel.steps.length);

                // Estimate potential lift (assumes we could halve the drop-off)
                const potentialLift = step.dropOffRate * 0.5;

                optimizations.push({
                    step: step.name,
                    currentDropOff: step.dropOffRate,
                    potentialLift: Math.round(potentialLift * 100) / 100,
                    priority: step.dropOffRate > 50 ? 'high' : step.dropOffRate > 40 ? 'medium' : 'low',
                    suggestions: OPTIMIZATION_SUGGESTIONS[category] || OPTIMIZATION_SUGGESTIONS.default,
                });
            }
        }

        return optimizations;
    }

    /**
     * Get predefined funnels for a game type
     */
    getGameTypeFunnels(gameType: GameCategory): PredefinedFunnel[] {
        return GAME_FUNNELS[gameType] || [];
    }
}

export const funnelDetector = new FunnelDetector();
