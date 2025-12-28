# Data Providers API

Data Providers implement a factory pattern to deliver game-type-specific data handlers. Each provider returns retention, funnel, revenue, and KPI data tailored to the game category.

**Source Location:** `src/lib/dataProviders.ts`

## IDataProvider Interface

The abstract interface all data providers implement:

```typescript
interface IDataProvider {
    getRetentionData(): RetentionData;
    getFunnelData(): FunnelStep[];
    getKPIData(): KPIData[];
    getRevenueData(): TimeSeriesData[];
    getSegmentData(): SegmentData[];
}
```

## Factory Function

Create a data provider for a specific game category:

```typescript
import { createDataProvider, GameCategory } from '@/lib/dataProviders';

const provider = createDataProvider('puzzle');
const retention = provider.getRetentionData();
const funnel = provider.getFunnelData();
const kpis = provider.getKPIData();
const revenue = provider.getRevenueData();
const segments = provider.getSegmentData();
```

## Data Types

### RetentionData

```typescript
interface RetentionData {
    days: string[];        // ['Day 0', 'Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30']
    values: number[];      // [100, 42, 28, 18, 12, 7]
    benchmark?: number[];  // Optional industry benchmark
}
```

### FunnelStep

```typescript
interface FunnelStep {
    name: string;          // Step name
    value: number;         // Absolute count
    percentage: number;    // Percentage of total
    dropOff?: number;      // Drop-off from previous step
}
```

### KPIData

```typescript
interface KPIData {
    label: string;
    value: string | number;
    change?: number;
    changeType: 'up' | 'down' | 'neutral';
    icon?: string;
}
```

### TimeSeriesData

```typescript
interface TimeSeriesData {
    name: string;
    data: DataPoint[];
    color?: string;
}

interface DataPoint {
    timestamp: string | number;
    value: number;
    label?: string;
}
```

### SegmentData

```typescript
interface SegmentData {
    name: string;
    value: number;
    percentage: number;
    color?: string;
}
```

## Available Providers

### PuzzleGameDataProvider

For puzzle, match-3, and level-based games.

```typescript
class PuzzleGameDataProvider implements IDataProvider {
    getRetentionData(): RetentionData {
        // Day 1: 42%, Day 7: 18%, Day 30: 5%
    }

    getFunnelData(): FunnelStep[] {
        // Level progression funnel
        // Level 1 -> Level 5 -> Level 10 -> Level 15 -> Level 20 -> Level 30
    }

    getKPIData(): KPIData[] {
        // DAU, Day 1 Retention, Level 15 Pass Rate, Avg Session Length
    }

    getRevenueData(): TimeSeriesData[] {
        // Ad Revenue by day of week
    }

    getSegmentData(): SegmentData[] {
        // Booster usage: Color Bomb, Extra Moves, Rainbow
    }
}
```

**Key Metrics:**
- Level progression funnel (Level 1 through Level 30)
- Level pass rates
- Booster usage distribution
- Ad revenue patterns

### IdleGameDataProvider

For idle, clicker, and incremental games.

```typescript
class IdleGameDataProvider implements IDataProvider {
    getRetentionData(): RetentionData {
        // Day 1: 55%, Day 7: 25%, Day 30: 12%
    }

    getFunnelData(): FunnelStep[] {
        // Prestige funnel
        // Never Prestiged -> Prestige 1x -> Prestige 2-5x -> Prestige 5+
    }

    getKPIData(): KPIData[] {
        // DAU, D1 Retention, Avg Offline Time, Sessions/Day
    }

    getRevenueData(): TimeSeriesData[] {
        // IAP Revenue by time of day
    }

    getSegmentData(): SegmentData[] {
        // Offline vs Online time distribution
    }
}
```

**Key Metrics:**
- Prestige funnel
- Offline/online time split
- Sessions per day
- Revenue by time of day

### BattleRoyaleDataProvider

For FPS, battle royale, and competitive shooter games.

```typescript
class BattleRoyaleDataProvider implements IDataProvider {
    getRetentionData(): RetentionData {
        // Day 1: 38%, Day 7: 15%, Day 30: 6%
    }

    getFunnelData(): FunnelStep[] {
        // Rank distribution
        // Bronze -> Silver -> Gold -> Diamond -> Legendary
    }

    getKPIData(): KPIData[] {
        // DAU, D1 Retention, Avg Match Time, Matches/Session
    }

    getRevenueData(): TimeSeriesData[] {
        // Battle Pass revenue by week
    }

    getSegmentData(): SegmentData[] {
        // Weapon meta: AK-47, Shotgun, SMG, Sniper
    }
}
```

**Key Metrics:**
- Rank distribution
- Match duration
- Matches per session
- Weapon usage meta

### Match3MetaDataProvider

For match-3 games with story/decoration meta layers.

```typescript
class Match3MetaDataProvider implements IDataProvider {
    getRetentionData(): RetentionData {
        // Day 1: 48%, Day 7: 20%, Day 30: 8%
    }

    getFunnelData(): FunnelStep[] {
        // Chapter/story progression
        // Chapter 1 -> Chapter 3 -> Chapter 5 -> Chapter 7
    }

    getKPIData(): KPIData[] {
        // DAU, D1 Retention, Meta Engagement, IAP Conv Rate
    }

    getRevenueData(): TimeSeriesData[] {
        // IAP (Stars) revenue by day
    }

    getSegmentData(): SegmentData[] {
        // Decoration style preferences: Modern, Classic, Cozy
    }
}
```

**Key Metrics:**
- Story chapter progression
- Meta engagement rate
- Decoration style preferences
- IAP conversion rates

### GachaRPGDataProvider

For gacha, hero collector, and turn-based RPG games.

```typescript
class GachaRPGDataProvider implements IDataProvider {
    getRetentionData(): RetentionData {
        // Day 1: 52%, Day 7: 28%, Day 30: 22%
    }

    getFunnelData(): FunnelStep[] {
        // Spender segments
        // F2P -> Minnow ($1-10) -> Dolphin ($10-100) -> Whale ($100+)
    }

    getKPIData(): KPIData[] {
        // DAU, D30 Retention, ARPPU, Whale Count
    }

    getRevenueData(): TimeSeriesData[] {
        // Banner revenue: Luna, Kai, Nova, Limited Collab
    }

    getSegmentData(): SegmentData[] {
        // Revenue by source: Limited Banner, Battle Pass, Direct Packs
    }
}
```

**Key Metrics:**
- Spender tier distribution
- ARPPU (Average Revenue Per Paying User)
- Whale count and behavior
- Banner performance

## Game Categories

Available game categories with metadata:

```typescript
import { gameCategories } from '@/lib/dataProviders';

const categories = [
    {
        id: 'puzzle',
        name: 'Puzzle Game',
        icon: '...',
        description: 'Match-3, puzzle solving, level-based games',
    },
    {
        id: 'idle',
        name: 'Idle / Clicker',
        icon: '...',
        description: 'Incremental, idle mining, factory games',
    },
    {
        id: 'battle_royale',
        name: 'Battle Royale',
        icon: '...',
        description: 'FPS, competitive shooters, survival games',
    },
    {
        id: 'match3_meta',
        name: 'Match-3 + Meta',
        icon: '...',
        description: 'Match-3 with story/decoration meta layer',
    },
    {
        id: 'gacha_rpg',
        name: 'Gacha RPG',
        icon: '...',
        description: 'Hero collectors, turn-based RPGs with gacha',
    },
];
```

## Creating Custom Providers

Implement the `IDataProvider` interface for custom game types:

```typescript
import { IDataProvider, RetentionData, FunnelStep, KPIData, TimeSeriesData, SegmentData } from '@/lib/dataProviders';

class MyCustomGameProvider implements IDataProvider {
    getRetentionData(): RetentionData {
        return {
            days: ['Day 0', 'Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30'],
            values: [100, 45, 30, 20, 14, 9],
            benchmark: [100, 40, 25, 15, 10, 5],
        };
    }

    getFunnelData(): FunnelStep[] {
        return [
            { name: 'Tutorial Start', value: 10000, percentage: 100, dropOff: 0 },
            { name: 'Tutorial Complete', value: 8500, percentage: 85, dropOff: 15 },
            { name: 'First Match', value: 7000, percentage: 70, dropOff: 15 },
            { name: 'First Win', value: 4500, percentage: 45, dropOff: 25 },
            { name: 'First Purchase', value: 500, percentage: 5, dropOff: 40 },
        ];
    }

    getKPIData(): KPIData[] {
        return [
            { label: 'Daily Active Users', value: '75,234', change: 8.5, changeType: 'up' },
            { label: 'Day 1 Retention', value: '45%', change: 2.3, changeType: 'up' },
            { label: 'Win Rate', value: '52%', change: -1.2, changeType: 'down' },
            { label: 'Avg Match Duration', value: '12m 30s', change: 0, changeType: 'neutral' },
        ];
    }

    getRevenueData(): TimeSeriesData[] {
        return [{
            name: 'Total Revenue',
            data: [
                { timestamp: 'Mon', value: 5000 },
                { timestamp: 'Tue', value: 4800 },
                { timestamp: 'Wed', value: 5200 },
                { timestamp: 'Thu', value: 5500 },
                { timestamp: 'Fri', value: 6800 },
                { timestamp: 'Sat', value: 7200 },
                { timestamp: 'Sun', value: 6500 },
            ],
            color: '#8b5cf6',
        }];
    }

    getSegmentData(): SegmentData[] {
        return [
            { name: 'Character Skins', value: 40, percentage: 40, color: '#8b5cf6' },
            { name: 'Battle Pass', value: 35, percentage: 35, color: '#6366f1' },
            { name: 'Currency Packs', value: 25, percentage: 25, color: '#ec4899' },
        ];
    }
}

// Register with factory
function createDataProvider(category: GameCategory): IDataProvider {
    switch (category) {
        case 'my_custom':
            return new MyCustomGameProvider();
        // ... other cases
    }
}
```

## Integration with React Context

Use providers with the GameContext:

```typescript
import { useGame } from '@/context/GameContext';
import { createDataProvider } from '@/lib/dataProviders';
import { useMemo } from 'react';

function Dashboard() {
    const { gameType } = useGame();

    const dataProvider = useMemo(
        () => createDataProvider(gameType),
        [gameType]
    );

    const retentionData = dataProvider.getRetentionData();
    const funnelData = dataProvider.getFunnelData();
    const kpiData = dataProvider.getKPIData();

    return (
        <div>
            <RetentionChart data={retentionData} />
            <FunnelChart data={funnelData} />
            <KPIGrid data={kpiData} />
        </div>
    );
}
```

## Real Data Integration

Replace demo providers with real data from adapters:

```typescript
import { IDataProvider } from '@/lib/dataProviders';
import { NormalizedData } from '@/adapters/BaseAdapter';
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';

class RealDataProvider implements IDataProvider {
    constructor(
        private data: NormalizedData,
        private columnMeanings: ColumnMeaning[]
    ) {}

    getRetentionData(): RetentionData {
        const retentionCol = this.columnMeanings.find(
            m => m.semanticType === 'retention_day'
        );

        if (!retentionCol) {
            return { days: [], values: [] };
        }

        // Calculate retention from real data
        const retentionByDay = new Map<string, number>();
        const userCol = this.columnMeanings.find(m => m.semanticType === 'user_id');

        // ... calculation logic

        return {
            days: Array.from(retentionByDay.keys()),
            values: Array.from(retentionByDay.values()),
        };
    }

    getFunnelData(): FunnelStep[] {
        // Calculate from real event data
        const funnelCol = this.columnMeanings.find(
            m => m.semanticType === 'funnel_step'
        );

        // ... calculation logic

        return [];
    }

    getKPIData(): KPIData[] {
        const kpis: KPIData[] = [];

        // Calculate real KPIs
        const userCol = this.columnMeanings.find(m => m.semanticType === 'user_id');
        if (userCol) {
            const uniqueUsers = new Set(
                this.data.rows.map(r => r[userCol.column])
            ).size;

            kpis.push({
                label: 'Unique Users',
                value: uniqueUsers.toLocaleString(),
                changeType: 'neutral',
            });
        }

        const revenueCol = this.columnMeanings.find(m => m.semanticType === 'revenue');
        if (revenueCol) {
            const totalRevenue = this.data.rows.reduce(
                (sum, r) => sum + (Number(r[revenueCol.column]) || 0),
                0
            );

            kpis.push({
                label: 'Total Revenue',
                value: `$${totalRevenue.toLocaleString()}`,
                changeType: 'neutral',
            });
        }

        return kpis;
    }

    getRevenueData(): TimeSeriesData[] {
        // Calculate time series from real data
        return [];
    }

    getSegmentData(): SegmentData[] {
        // Calculate segments from real data
        return [];
    }
}
```

## Best Practices

1. **Use the factory function** - Always use `createDataProvider(gameType)` rather than instantiating providers directly
2. **Cache providers** - Use `useMemo` to avoid recreating providers on every render
3. **Handle missing data** - Return empty arrays/objects when data is unavailable
4. **Type safety** - Leverage TypeScript interfaces for all data structures
5. **Real vs Demo data** - Clearly separate demo providers from real data providers
