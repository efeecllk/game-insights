/**
 * Data Provider - Implements Dependency Inversion Principle
 * High-level modules depend on abstractions, not concrete implementations
 *
 * Supports both real uploaded data and demo data for exploration
 */

import {
    GameCategory,
    RetentionData,
    FunnelStep,
    KPIData,
    SegmentData,
    TimeSeriesData
} from '../types';
import { GameData } from './dataStore';
import { RealDataProvider, EmptyDataProvider } from './realDataProvider';

/**
 * Spender tier data structure
 */
export interface SpenderTier {
    tier: string;
    users: number;
    revenue: number;
    percentage: number;
}

/**
 * Attribution channel data structure
 */
export interface AttributionChannel {
    name: string;
    users: number;
    revenue: number;
    percentage: number;
}

/**
 * Revenue time series point
 */
export interface RevenueTimePoint {
    date: string;
    value: number;
}

/**
 * Session metrics
 */
export interface SessionMetrics {
    avgSessionLength: number;
    sessionsPerUser: number;
}

/**
 * Abstract data provider interface
 */
export interface IDataProvider {
    getRetentionData(): RetentionData;
    getFunnelData(): FunnelStep[];
    getKPIData(): KPIData[];
    getRevenueData(): TimeSeriesData[];
    getSegmentData(): SegmentData[];

    // Extended metrics
    getDAU(): number;
    getMAU(): number;
    calculateARPU(): number;
    getTotalRevenue(): number;
    getRetentionDay(day: number): number;
    getAvgSessionLength(): number;
    getPayerConversion(): number;
    getSpenderTiers(): SpenderTier[];
    getRevenueTimeSeries(period: 'daily' | 'weekly' | 'monthly'): RevenueTimePoint[];
    getAttributionChannels(): AttributionChannel[];
    calculateFunnelSteps(stepDefinitions: Array<{ name: string; event?: string; condition?: Record<string, unknown> }>): FunnelStep[];
    getHistoricalGrowthRate(): number;
    getSessionMetrics(): SessionMetrics;
}

/**
 * Base Demo Data with common patterns
 */
const baseRetentionCurve = (
    d1: number,
    d7: number,
    d30: number
): RetentionData => ({
    days: ['Day 0', 'Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30'],
    values: [100, d1, Math.floor(d1 * 0.7), d7, Math.floor(d7 * 0.7), d30],
    benchmark: [100, 42, 28, 18, 12, 7],
});

/**
 * Base class with default implementations for extended metrics
 */
abstract class BaseDataProvider implements IDataProvider {
    abstract getRetentionData(): RetentionData;
    abstract getFunnelData(): FunnelStep[];
    abstract getKPIData(): KPIData[];
    abstract getRevenueData(): TimeSeriesData[];
    abstract getSegmentData(): SegmentData[];

    getDAU(): number {
        return 50000;
    }

    getMAU(): number {
        return 250000;
    }

    calculateARPU(): number {
        return 0.15;
    }

    getTotalRevenue(): number {
        return 105000;
    }

    getRetentionDay(day: number): number {
        const retention = this.getRetentionData();
        const dayIndex = retention.days.findIndex(d => d.includes(day.toString()));
        return dayIndex >= 0 ? retention.values[dayIndex] : 0;
    }

    getAvgSessionLength(): number {
        return 8.5;
    }

    getPayerConversion(): number {
        return 3.5;
    }

    getSpenderTiers(): SpenderTier[] {
        return [
            { tier: 'Non-Payers', users: 45000, revenue: 0, percentage: 90 },
            { tier: 'Minnows ($1-$10)', users: 3500, revenue: 12250, percentage: 7 },
            { tier: 'Dolphins ($10-$100)', users: 1200, revenue: 42000, percentage: 2.4 },
            { tier: 'Whales ($100+)', users: 300, revenue: 45000, percentage: 0.6 },
        ];
    }

    getRevenueTimeSeries(period: 'daily' | 'weekly' | 'monthly'): RevenueTimePoint[] {
        const today = new Date();
        const points: RevenueTimePoint[] = [];
        const count = period === 'daily' ? 30 : period === 'weekly' ? 12 : 6;

        for (let i = count - 1; i >= 0; i--) {
            const date = new Date(today);
            if (period === 'daily') date.setDate(date.getDate() - i);
            else if (period === 'weekly') date.setDate(date.getDate() - i * 7);
            else date.setMonth(date.getMonth() - i);

            points.push({
                date: date.toISOString().slice(0, 10),
                value: 3000 + Math.random() * 1500,
            });
        }
        return points;
    }

    getAttributionChannels(): AttributionChannel[] {
        return [
            { name: 'Organic', users: 12500, revenue: 18750, percentage: 28 },
            { name: 'Facebook Ads', users: 8200, revenue: 24600, percentage: 22 },
            { name: 'Google Ads', users: 6800, revenue: 20400, percentage: 18 },
            { name: 'Apple Search', users: 4500, revenue: 11250, percentage: 12 },
            { name: 'Referral', users: 3200, revenue: 9600, percentage: 10 },
            { name: 'Direct', users: 2800, revenue: 8400, percentage: 10 },
        ];
    }

    calculateFunnelSteps(_stepDefinitions: Array<{ name: string; event?: string; condition?: Record<string, unknown> }>): FunnelStep[] {
        // Default implementation returns the normal funnel data
        return this.getFunnelData();
    }

    getHistoricalGrowthRate(): number {
        return 5.2;
    }

    getSessionMetrics(): SessionMetrics {
        return {
            avgSessionLength: this.getAvgSessionLength(),
            sessionsPerUser: 3.2,
        };
    }
}

// ============ PUZZLE GAME DATA ============

export class PuzzleGameDataProvider extends BaseDataProvider {
    getRetentionData(): RetentionData {
        return baseRetentionCurve(42, 18, 5);
    }

    getFunnelData(): FunnelStep[] {
        return [
            { name: 'Level 1', value: 10000, percentage: 100, dropOff: 0 },
            { name: 'Level 5', value: 7500, percentage: 75, dropOff: 25 },
            { name: 'Level 10', value: 5200, percentage: 52, dropOff: 23 },
            { name: 'Level 15', value: 2800, percentage: 28, dropOff: 24 },
            { name: 'Level 20', value: 1500, percentage: 15, dropOff: 13 },
            { name: 'Level 30', value: 800, percentage: 8, dropOff: 7 },
        ];
    }

    getKPIData(): KPIData[] {
        return [
            { label: 'Daily Active Users', value: '50,421', change: 12.5, changeType: 'up' },
            { label: 'Day 1 Retention', value: '42%', change: 5.2, changeType: 'up' },
            { label: 'Level 15 Pass Rate', value: '45%', change: -8.3, changeType: 'down' },
            { label: 'Avg Session Length', value: '8m 24s', change: 2.1, changeType: 'up' },
        ];
    }

    getRevenueData(): TimeSeriesData[] {
        return [{
            name: 'Ad Revenue',
            data: [
                { timestamp: 'Mon', value: 2400, label: '$2.4K' },
                { timestamp: 'Tue', value: 2100, label: '$2.1K' },
                { timestamp: 'Wed', value: 2800, label: '$2.8K' },
                { timestamp: 'Thu', value: 3200, label: '$3.2K' },
                { timestamp: 'Fri', value: 4100, label: '$4.1K' },
                { timestamp: 'Sat', value: 3800, label: '$3.8K' },
                { timestamp: 'Sun', value: 3500, label: '$3.5K' },
            ],
            color: '#DA7756',
        }];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Color Bomb', value: 45, percentage: 45, color: '#DA7756' },
            { name: 'Extra Moves', value: 32, percentage: 32, color: '#C15F3C' },
            { name: 'Rainbow', value: 23, percentage: 23, color: '#E5A84B' },
        ];
    }
}

// ============ IDLE GAME DATA ============

export class IdleGameDataProvider extends BaseDataProvider {
    getRetentionData(): RetentionData {
        return baseRetentionCurve(55, 25, 12);
    }

    getFunnelData(): FunnelStep[] {
        return [
            { name: 'Never Prestiged', value: 4500, percentage: 45, dropOff: 0 },
            { name: 'Prestige 1x', value: 3000, percentage: 30, dropOff: 15 },
            { name: 'Prestige 2-5x', value: 1800, percentage: 18, dropOff: 12 },
            { name: 'Prestige 5+', value: 700, percentage: 7, dropOff: 11 },
        ];
    }

    getKPIData(): KPIData[] {
        return [
            { label: 'Daily Active Users', value: '120,847', change: 8.3, changeType: 'up' },
            { label: 'D1 Retention', value: '55%', change: 3.1, changeType: 'up' },
            { label: 'Avg Offline Time', value: '8.5h', change: 0, changeType: 'neutral' },
            { label: 'Sessions/Day', value: '6.2', change: 1.2, changeType: 'up' },
        ];
    }

    getRevenueData(): TimeSeriesData[] {
        return [
            {
                name: 'IAP Revenue',
                data: [
                    { timestamp: '6am', value: 800 },
                    { timestamp: '9am', value: 2200 },
                    { timestamp: '12pm', value: 1500 },
                    { timestamp: '3pm', value: 1800 },
                    { timestamp: '6pm', value: 3500 },
                    { timestamp: '9pm', value: 2800 },
                    { timestamp: '12am', value: 1200 },
                ],
                color: '#DA7756',
            },
        ];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Offline (78%)', value: 78, percentage: 78, color: '#DA7756' },
            { name: 'Online (22%)', value: 22, percentage: 22, color: '#E5A84B' },
        ];
    }
}

// ============ BATTLE ROYALE DATA ============

export class BattleRoyaleDataProvider extends BaseDataProvider {
    getRetentionData(): RetentionData {
        return baseRetentionCurve(38, 15, 6);
    }

    getFunnelData(): FunnelStep[] {
        return [
            { name: 'Bronze', value: 2500, percentage: 25, dropOff: 0 },
            { name: 'Silver', value: 3000, percentage: 30, dropOff: -5 },
            { name: 'Gold', value: 2500, percentage: 25, dropOff: 5 },
            { name: 'Diamond', value: 1500, percentage: 15, dropOff: 10 },
            { name: 'Legendary', value: 500, percentage: 5, dropOff: 10 },
        ];
    }

    getKPIData(): KPIData[] {
        return [
            { label: 'Daily Active Users', value: '524,821', change: 15.2, changeType: 'up' },
            { label: 'D1 Retention', value: '38%', change: 2.1, changeType: 'up' },
            { label: 'Avg Match Time', value: '18m', change: -1.5, changeType: 'down' },
            { label: 'Matches/Session', value: '3.2', change: 0.8, changeType: 'up' },
        ];
    }

    getRevenueData(): TimeSeriesData[] {
        return [
            {
                name: 'Battle Pass',
                data: [
                    { timestamp: 'Week 1', value: 45000 },
                    { timestamp: 'Week 2', value: 32000 },
                    { timestamp: 'Week 3', value: 28000 },
                    { timestamp: 'Week 4', value: 52000 },
                ],
                color: '#C15F3C',
            },
        ];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'AK-47', value: 32, percentage: 32, color: '#E25C5C' },
            { name: 'Shotgun', value: 28, percentage: 28, color: '#C15F3C' },
            { name: 'SMG', value: 22, percentage: 22, color: '#E5A84B' },
            { name: 'Sniper', value: 18, percentage: 18, color: '#DA7756' },
        ];
    }
}

// ============ MATCH-3 META DATA ============

export class Match3MetaDataProvider extends BaseDataProvider {
    getRetentionData(): RetentionData {
        return baseRetentionCurve(48, 20, 8);
    }

    getFunnelData(): FunnelStep[] {
        return [
            { name: 'Chapter 1', value: 10000, percentage: 100, dropOff: 0 },
            { name: 'Chapter 3', value: 6500, percentage: 65, dropOff: 35 },
            { name: 'Chapter 5', value: 3500, percentage: 35, dropOff: 30 },
            { name: 'Chapter 7', value: 1200, percentage: 12, dropOff: 23 },
        ];
    }

    getKPIData(): KPIData[] {
        return [
            { label: 'Daily Active Users', value: '198,421', change: 5.8, changeType: 'up' },
            { label: 'D1 Retention', value: '48%', change: 4.2, changeType: 'up' },
            { label: 'Meta Engagement', value: '72%', change: 8.5, changeType: 'up' },
            { label: 'IAP Conv Rate', value: '4.2%', change: 0.3, changeType: 'up' },
        ];
    }

    getRevenueData(): TimeSeriesData[] {
        return [
            {
                name: 'IAP (Stars)',
                data: [
                    { timestamp: 'Mon', value: 8500 },
                    { timestamp: 'Tue', value: 7200 },
                    { timestamp: 'Wed', value: 9100 },
                    { timestamp: 'Thu', value: 8800 },
                    { timestamp: 'Fri', value: 11200 },
                    { timestamp: 'Sat', value: 14500 },
                    { timestamp: 'Sun', value: 12800 },
                ],
                color: '#E5A84B',
            },
        ];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Modern Style', value: 45, percentage: 45, color: '#DA7756' },
            { name: 'Classic Style', value: 30, percentage: 30, color: '#C15F3C' },
            { name: 'Cozy Style', value: 25, percentage: 25, color: '#E5A84B' },
        ];
    }
}

// ============ GACHA RPG DATA ============

export class GachaRPGDataProvider extends BaseDataProvider {
    getRetentionData(): RetentionData {
        return baseRetentionCurve(52, 28, 22);
    }

    getFunnelData(): FunnelStep[] {
        return [
            { name: 'F2P', value: 7500, percentage: 75, dropOff: 0 },
            { name: 'Minnow ($1-10)', value: 1500, percentage: 15, dropOff: 60 },
            { name: 'Dolphin ($10-100)', value: 750, percentage: 7.5, dropOff: 7.5 },
            { name: 'Whale ($100+)', value: 250, percentage: 2.5, dropOff: 5 },
        ];
    }

    getKPIData(): KPIData[] {
        return [
            { label: 'Daily Active Users', value: '82,547', change: 3.2, changeType: 'up' },
            { label: 'D30 Retention', value: '22%', change: 1.8, changeType: 'up' },
            { label: 'ARPPU', value: '$85', change: 12.5, changeType: 'up' },
            { label: 'Whale Count', value: '2,064', change: 5.2, changeType: 'up' },
        ];
    }

    getRevenueData(): TimeSeriesData[] {
        return [
            {
                name: 'Banner Revenue',
                data: [
                    { timestamp: 'Luna Banner', value: 45000 },
                    { timestamp: 'Kai Banner', value: 32000 },
                    { timestamp: 'Nova Banner', value: 28000 },
                    { timestamp: 'Limited Collab', value: 78000 },
                ],
                color: '#DA7756',
            },
        ];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Limited Banner', value: 55, percentage: 55, color: '#DA7756' },
            { name: 'Battle Pass', value: 25, percentage: 25, color: '#C15F3C' },
            { name: 'Direct Packs', value: 20, percentage: 20, color: '#E5A84B' },
        ];
    }
}

// ============ DATA PROVIDER FACTORY ============

/**
 * Factory function - Dependency Inversion Principle
 * Returns appropriate data provider based on game category
 * This returns DEMO data - use createSmartDataProvider for real data support
 */
export function createDataProvider(category: GameCategory): IDataProvider {
    switch (category) {
        case 'puzzle':
            return new PuzzleGameDataProvider();
        case 'idle':
            return new IdleGameDataProvider();
        case 'battle_royale':
            return new BattleRoyaleDataProvider();
        case 'match3_meta':
            return new Match3MetaDataProvider();
        case 'gacha_rpg':
            return new GachaRPGDataProvider();
        default:
            return new PuzzleGameDataProvider(); // Default
    }
}

/**
 * Smart factory that uses real data when available, falls back to demo data
 * @param category - Game category for demo data fallback
 * @param gameData - Optional uploaded game data to use
 * @returns Data provider with real or demo data
 */
export function createSmartDataProvider(
    category: GameCategory,
    gameData: GameData | null
): IDataProvider {
    if (gameData && gameData.rawData && gameData.rawData.length > 0) {
        return new RealDataProvider(gameData);
    }
    return createDataProvider(category);
}

/**
 * Create an empty data provider for no-data states
 */
export function createEmptyDataProvider(): IDataProvider {
    return new EmptyDataProvider();
}

/**
 * Check if data provider has meaningful data
 */
export function hasData(provider: IDataProvider): boolean {
    const kpis = provider.getKPIData();
    const funnel = provider.getFunnelData();
    return kpis.length > 0 || funnel.length > 0;
}

/**
 * All available game categories with metadata
 */
export const gameCategories: Array<{
    id: GameCategory;
    name: string;
    icon: string;
    description: string;
}> = [
        {
            id: 'puzzle',
            name: 'Puzzle Game',
            icon: '🧩',
            description: 'Match-3, puzzle solving, level-based games',
        },
        {
            id: 'idle',
            name: 'Idle / Clicker',
            icon: '⏰',
            description: 'Incremental, idle mining, factory games',
        },
        {
            id: 'battle_royale',
            name: 'Battle Royale',
            icon: '🔫',
            description: 'FPS, competitive shooters, survival games',
        },
        {
            id: 'match3_meta',
            name: 'Match-3 + Meta',
            icon: '🍬',
            description: 'Match-3 with story/decoration meta layer',
        },
        {
            id: 'gacha_rpg',
            name: 'Gacha RPG',
            icon: '⚔️',
            description: 'Hero collectors, turn-based RPGs with gacha',
        },
    ];
