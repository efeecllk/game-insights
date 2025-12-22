/**
 * Demo Data Provider - Implements Dependency Inversion Principle
 * High-level modules depend on abstractions, not concrete implementations
 */

import {
    GameCategory,
    RetentionData,
    FunnelStep,
    KPIData,
    SegmentData,
    TimeSeriesData
} from '../types';

/**
 * Abstract data provider interface
 */
export interface IDataProvider {
    getRetentionData(): RetentionData;
    getFunnelData(): FunnelStep[];
    getKPIData(): KPIData[];
    getRevenueData(): TimeSeriesData[];
    getSegmentData(): SegmentData[];
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

// ============ PUZZLE GAME DATA ============

export class PuzzleGameDataProvider implements IDataProvider {
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
            color: '#8b5cf6',
        }];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Color Bomb', value: 45, percentage: 45, color: '#8b5cf6' },
            { name: 'Extra Moves', value: 32, percentage: 32, color: '#6366f1' },
            { name: 'Rainbow', value: 23, percentage: 23, color: '#ec4899' },
        ];
    }
}

// ============ IDLE GAME DATA ============

export class IdleGameDataProvider implements IDataProvider {
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
                color: '#22c55e',
            },
        ];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Offline (78%)', value: 78, percentage: 78, color: '#6366f1' },
            { name: 'Online (22%)', value: 22, percentage: 22, color: '#8b5cf6' },
        ];
    }
}

// ============ BATTLE ROYALE DATA ============

export class BattleRoyaleDataProvider implements IDataProvider {
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
                color: '#f97316',
            },
        ];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'AK-47', value: 32, percentage: 32, color: '#ef4444' },
            { name: 'Shotgun', value: 28, percentage: 28, color: '#f97316' },
            { name: 'SMG', value: 22, percentage: 22, color: '#eab308' },
            { name: 'Sniper', value: 18, percentage: 18, color: '#22c55e' },
        ];
    }
}

// ============ MATCH-3 META DATA ============

export class Match3MetaDataProvider implements IDataProvider {
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
                color: '#ec4899',
            },
        ];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Modern Style', value: 45, percentage: 45, color: '#8b5cf6' },
            { name: 'Classic Style', value: 30, percentage: 30, color: '#6366f1' },
            { name: 'Cozy Style', value: 25, percentage: 25, color: '#ec4899' },
        ];
    }
}

// ============ GACHA RPG DATA ============

export class GachaRPGDataProvider implements IDataProvider {
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
                color: '#8b5cf6',
            },
        ];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Limited Banner', value: 55, percentage: 55, color: '#8b5cf6' },
            { name: 'Battle Pass', value: 25, percentage: 25, color: '#6366f1' },
            { name: 'Direct Packs', value: 20, percentage: 20, color: '#22d3ee' },
        ];
    }
}

// ============ DATA PROVIDER FACTORY ============

/**
 * Factory function - Dependency Inversion Principle
 * Returns appropriate data provider based on game category
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
