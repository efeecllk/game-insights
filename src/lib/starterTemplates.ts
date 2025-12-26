/**
 * Starter Templates
 * Built-in templates for common analytics scenarios
 * Phase 4: Community & Ecosystem
 */

import type { DashboardTemplate, TemplateLayout, ColumnRequirement } from './templateStore';

// ============================================================================
// Common Layouts
// ============================================================================

const RETENTION_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-dau', name: 'Daily Active Users', metric: 'dau', format: 'compact', colorScheme: 'violet', icon: 'Users' },
        { id: 'kpi-d1', name: 'D1 Retention', metric: 'retention_d1', format: 'percentage', colorScheme: 'green', icon: 'TrendingUp' },
        { id: 'kpi-d7', name: 'D7 Retention', metric: 'retention_d7', format: 'percentage', colorScheme: 'blue', icon: 'Calendar' },
        { id: 'kpi-stickiness', name: 'DAU/MAU', metric: 'stickiness', format: 'percentage', colorScheme: 'orange', icon: 'Activity' },
    ],
    mainCharts: [
        { id: 'main-retention', type: 'bar', title: 'Retention Curve', subtitle: 'Day-over-day retention rates', xColumn: 'retention_day', yColumn: 'retention_rate' },
        { id: 'main-dau', type: 'line', title: 'DAU Over Time', subtitle: 'Daily active users trend', xColumn: 'date', yColumn: 'dau' },
    ],
    sideCharts: [
        { id: 'side-cohort', type: 'bar', title: 'Cohort Performance', subtitle: 'Retention by install week', xColumn: 'cohort_week', yColumn: 'retention_d7' },
        { id: 'side-platform', type: 'pie', title: 'Users by Platform', subtitle: 'Platform distribution', xColumn: 'platform', yColumn: 'user_count' },
    ],
};

const MONETIZATION_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-revenue', name: 'Total Revenue', metric: 'total_revenue', format: 'currency', colorScheme: 'green', icon: 'DollarSign' },
        { id: 'kpi-arpu', name: 'ARPU', metric: 'arpu', format: 'currency', colorScheme: 'violet', icon: 'TrendingUp' },
        { id: 'kpi-arppu', name: 'ARPPU', metric: 'arppu', format: 'currency', colorScheme: 'blue', icon: 'Zap' },
        { id: 'kpi-conversion', name: 'Conversion Rate', metric: 'conversion_rate', format: 'percentage', colorScheme: 'orange', icon: 'Percent' },
    ],
    mainCharts: [
        { id: 'main-revenue', type: 'area', title: 'Revenue Over Time', subtitle: 'Daily revenue trend', xColumn: 'date', yColumn: 'revenue' },
        { id: 'main-ltv', type: 'line', title: 'LTV Curve', subtitle: 'Cumulative value by day', xColumn: 'lifetime_day', yColumn: 'cumulative_revenue' },
    ],
    sideCharts: [
        { id: 'side-source', type: 'donut', title: 'Revenue by Source', subtitle: 'IAP, Ads, Subscriptions', xColumn: 'revenue_source', yColumn: 'revenue' },
        { id: 'side-spenders', type: 'pie', title: 'Spender Segments', subtitle: 'Whale, Dolphin, Minnow', xColumn: 'spender_tier', yColumn: 'user_count' },
    ],
};

const ENGAGEMENT_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-sessions', name: 'Avg Sessions/Day', metric: 'avg_sessions', format: 'number', colorScheme: 'violet', icon: 'Activity' },
        { id: 'kpi-duration', name: 'Avg Session Length', metric: 'avg_session_duration', format: 'number', colorScheme: 'blue', icon: 'Clock' },
        { id: 'kpi-playtime', name: 'Daily Playtime', metric: 'daily_playtime', format: 'number', colorScheme: 'green', icon: 'Timer' },
        { id: 'kpi-actions', name: 'Actions/Session', metric: 'actions_per_session', format: 'number', colorScheme: 'orange', icon: 'MousePointer' },
    ],
    mainCharts: [
        { id: 'main-sessions', type: 'line', title: 'Sessions Over Time', subtitle: 'Daily session count', xColumn: 'date', yColumn: 'session_count' },
        { id: 'main-duration', type: 'area', title: 'Session Duration Trend', subtitle: 'Average minutes per session', xColumn: 'date', yColumn: 'avg_duration' },
    ],
    sideCharts: [
        { id: 'side-hour', type: 'bar', title: 'Peak Hours', subtitle: 'Sessions by hour of day', xColumn: 'hour', yColumn: 'session_count' },
        { id: 'side-day', type: 'bar', title: 'Active Days', subtitle: 'Sessions by day of week', xColumn: 'day_of_week', yColumn: 'session_count' },
    ],
};

// ============================================================================
// Game-Specific Templates
// ============================================================================

const PUZZLE_PROGRESSION_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-max-level', name: 'Max Level Reached', metric: 'max_level', format: 'number', colorScheme: 'violet', icon: 'Trophy' },
        { id: 'kpi-avg-level', name: 'Avg Level', metric: 'avg_level', format: 'number', colorScheme: 'blue', icon: 'Target' },
        { id: 'kpi-completion', name: 'Level Completion', metric: 'level_completion_rate', format: 'percentage', colorScheme: 'green', icon: 'CheckCircle' },
        { id: 'kpi-boosters', name: 'Booster Usage', metric: 'booster_usage_rate', format: 'percentage', colorScheme: 'orange', icon: 'Zap' },
    ],
    mainCharts: [
        { id: 'main-funnel', type: 'funnel', title: 'Level Progression Funnel', subtitle: 'Players reaching each level', xColumn: 'level', yColumn: 'player_count' },
        { id: 'main-difficulty', type: 'bar', title: 'Level Difficulty', subtitle: 'Attempts per level', xColumn: 'level', yColumn: 'avg_attempts' },
    ],
    sideCharts: [
        { id: 'side-distribution', type: 'histogram', title: 'Level Distribution', subtitle: 'Where players are stuck', xColumn: 'current_level', yColumn: 'player_count' },
        { id: 'side-boosters', type: 'donut', title: 'Booster Types Used', subtitle: 'Most popular power-ups', xColumn: 'booster_type', yColumn: 'usage_count' },
    ],
};

const IDLE_ECONOMY_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-prestige', name: 'Avg Prestige Level', metric: 'avg_prestige', format: 'number', colorScheme: 'violet', icon: 'Star' },
        { id: 'kpi-offline', name: 'Offline Earnings', metric: 'avg_offline_earnings', format: 'currency', colorScheme: 'green', icon: 'Moon' },
        { id: 'kpi-upgrades', name: 'Upgrades Purchased', metric: 'total_upgrades', format: 'compact', colorScheme: 'blue', icon: 'ArrowUp' },
        { id: 'kpi-currency', name: 'Currency Balance', metric: 'avg_currency_balance', format: 'compact', colorScheme: 'orange', icon: 'Coins' },
    ],
    mainCharts: [
        { id: 'main-prestige', type: 'funnel', title: 'Prestige Progression', subtitle: 'Players at each prestige level', xColumn: 'prestige_level', yColumn: 'player_count' },
        { id: 'main-earnings', type: 'area', title: 'Earnings Over Time', subtitle: 'Total currency earned', xColumn: 'date', yColumn: 'total_earnings' },
    ],
    sideCharts: [
        { id: 'side-offline', type: 'pie', title: 'Online vs Offline', subtitle: 'Time distribution', xColumn: 'session_type', yColumn: 'time_spent' },
        { id: 'side-upgrades', type: 'bar', title: 'Popular Upgrades', subtitle: 'Most purchased upgrades', xColumn: 'upgrade_name', yColumn: 'purchase_count' },
    ],
};

const GACHA_BANNER_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-pulls', name: 'Total Pulls', metric: 'total_pulls', format: 'compact', colorScheme: 'violet', icon: 'Gift' },
        { id: 'kpi-ssr-rate', name: 'SSR Rate', metric: 'ssr_rate', format: 'percentage', colorScheme: 'orange', icon: 'Star' },
        { id: 'kpi-pity', name: 'Avg Pity', metric: 'avg_pity', format: 'number', colorScheme: 'blue', icon: 'Target' },
        { id: 'kpi-revenue', name: 'Banner Revenue', metric: 'banner_revenue', format: 'currency', colorScheme: 'green', icon: 'DollarSign' },
    ],
    mainCharts: [
        { id: 'main-pulls', type: 'line', title: 'Daily Pulls', subtitle: 'Pull volume over time', xColumn: 'date', yColumn: 'pull_count' },
        { id: 'main-revenue', type: 'area', title: 'Banner Revenue', subtitle: 'Revenue from banner', xColumn: 'date', yColumn: 'revenue' },
    ],
    sideCharts: [
        { id: 'side-rarity', type: 'donut', title: 'Rarity Distribution', subtitle: 'Pulls by rarity tier', xColumn: 'rarity', yColumn: 'pull_count' },
        { id: 'side-type', type: 'pie', title: 'Pull Type', subtitle: 'Free vs Paid pulls', xColumn: 'pull_type', yColumn: 'count' },
    ],
};

const BATTLE_ROYALE_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-matches', name: 'Daily Matches', metric: 'daily_matches', format: 'compact', colorScheme: 'violet', icon: 'Crosshair' },
        { id: 'kpi-wins', name: 'Win Rate', metric: 'win_rate', format: 'percentage', colorScheme: 'green', icon: 'Trophy' },
        { id: 'kpi-kd', name: 'Avg K/D', metric: 'avg_kd_ratio', format: 'number', colorScheme: 'orange', icon: 'Target' },
        { id: 'kpi-survival', name: 'Avg Survival', metric: 'avg_survival_time', format: 'number', colorScheme: 'blue', icon: 'Clock' },
    ],
    mainCharts: [
        { id: 'main-rank', type: 'histogram', title: 'Rank Distribution', subtitle: 'Player placement distribution', xColumn: 'placement', yColumn: 'match_count' },
        { id: 'main-matches', type: 'line', title: 'Match Volume', subtitle: 'Daily matches played', xColumn: 'date', yColumn: 'match_count' },
    ],
    sideCharts: [
        { id: 'side-weapons', type: 'bar', title: 'Weapon Usage', subtitle: 'Most used weapons', xColumn: 'weapon_name', yColumn: 'usage_count' },
        { id: 'side-mode', type: 'pie', title: 'Game Modes', subtitle: 'Solo, Duo, Squad', xColumn: 'game_mode', yColumn: 'match_count' },
    ],
};

// ============================================================================
// Column Requirements
// ============================================================================

const RETENTION_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Unique user identifier' },
    { semantic: 'timestamp', optional: false, description: 'Event timestamp', alternatives: ['date', 'created_at'] },
    { semantic: 'platform', optional: true, description: 'iOS, Android, etc.' },
];

const MONETIZATION_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Unique user identifier' },
    { semantic: 'revenue', optional: false, description: 'Transaction amount', alternatives: ['price', 'amount'] },
    { semantic: 'timestamp', optional: false, description: 'Transaction time' },
    { semantic: 'currency', optional: true, description: 'Currency code (USD, EUR)' },
];

const ENGAGEMENT_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Unique user identifier' },
    { semantic: 'session_id', optional: false, description: 'Session identifier' },
    { semantic: 'timestamp', optional: false, description: 'Event timestamp' },
];

const PUZZLE_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'level', optional: false, description: 'Level number', alternatives: ['stage', 'chapter'] },
    { semantic: 'timestamp', optional: false, description: 'Event time' },
    { semantic: 'moves', optional: true, description: 'Moves used in level' },
    { semantic: 'booster', optional: true, description: 'Booster type used' },
];

const IDLE_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'prestige', optional: true, description: 'Prestige level' },
    { semantic: 'timestamp', optional: false, description: 'Event time' },
    { semantic: 'currency', optional: true, description: 'In-game currency' },
];

const GACHA_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'banner', optional: true, description: 'Banner name' },
    { semantic: 'rarity', optional: true, description: 'Pull rarity (SSR, SR, R)' },
    { semantic: 'timestamp', optional: false, description: 'Pull time' },
    { semantic: 'pull_type', optional: true, description: 'Free or paid pull' },
];

const BATTLE_ROYALE_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'placement', optional: true, description: 'Match placement', alternatives: ['rank', 'position'] },
    { semantic: 'kills', optional: true, description: 'Kills in match' },
    { semantic: 'timestamp', optional: false, description: 'Match time' },
    { semantic: 'survival_time', optional: true, description: 'Time survived' },
];

// ============================================================================
// Starter Templates
// ============================================================================

export const STARTER_TEMPLATES: DashboardTemplate[] = [
    // Retention Template
    {
        id: 'starter-retention',
        name: 'Retention Analysis',
        description: 'Track user retention with D1, D7, D30 metrics and cohort analysis. Essential for understanding player stickiness.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: RETENTION_LAYOUT,
        gameTypes: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg', 'custom'],
        requiredColumns: RETENTION_COLUMNS,
        tags: ['retention', 'cohort', 'essential', 'beginner'],
        category: 'retention',
        downloads: 1250,
        stars: 89,
        featured: true,
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Monetization Template
    {
        id: 'starter-monetization',
        name: 'Revenue & Monetization',
        description: 'Comprehensive revenue tracking with ARPU, ARPPU, LTV projections and spender segmentation.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: MONETIZATION_LAYOUT,
        gameTypes: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg', 'custom'],
        requiredColumns: MONETIZATION_COLUMNS,
        tags: ['revenue', 'monetization', 'ltv', 'essential'],
        category: 'monetization',
        downloads: 980,
        stars: 76,
        featured: true,
        verified: true,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Engagement Template
    {
        id: 'starter-engagement',
        name: 'Player Engagement',
        description: 'Session analysis with playtime tracking, peak hours identification, and engagement patterns.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: ENGAGEMENT_LAYOUT,
        gameTypes: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg', 'custom'],
        requiredColumns: ENGAGEMENT_COLUMNS,
        tags: ['engagement', 'sessions', 'playtime', 'essential'],
        category: 'engagement',
        downloads: 850,
        stars: 62,
        featured: true,
        verified: true,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Puzzle Game Template
    {
        id: 'starter-puzzle',
        name: 'Puzzle Game Analytics',
        description: 'Level progression funnels, difficulty analysis, and booster usage tracking for puzzle games.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: PUZZLE_PROGRESSION_LAYOUT,
        gameTypes: ['puzzle', 'match3_meta'],
        requiredColumns: PUZZLE_COLUMNS,
        tags: ['puzzle', 'levels', 'progression', 'difficulty'],
        category: 'progression',
        downloads: 720,
        stars: 54,
        featured: true,
        verified: true,
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Idle Game Template
    {
        id: 'starter-idle',
        name: 'Idle Game Economy',
        description: 'Prestige tracking, offline earnings analysis, and upgrade progression for idle games.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: IDLE_ECONOMY_LAYOUT,
        gameTypes: ['idle'],
        requiredColumns: IDLE_COLUMNS,
        tags: ['idle', 'prestige', 'economy', 'offline'],
        category: 'progression',
        downloads: 480,
        stars: 38,
        featured: false,
        verified: true,
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Gacha Template
    {
        id: 'starter-gacha',
        name: 'Gacha Banner Performance',
        description: 'Pull rates, pity tracking, banner revenue, and rarity distribution for gacha games.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: GACHA_BANNER_LAYOUT,
        gameTypes: ['gacha_rpg'],
        requiredColumns: GACHA_COLUMNS,
        tags: ['gacha', 'banner', 'pulls', 'rarity'],
        category: 'monetization',
        downloads: 620,
        stars: 48,
        featured: false,
        verified: true,
        createdAt: '2024-03-15T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Battle Royale Template
    {
        id: 'starter-battle-royale',
        name: 'Battle Royale Matches',
        description: 'Match analytics with placement distribution, K/D tracking, and weapon meta analysis.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: BATTLE_ROYALE_LAYOUT,
        gameTypes: ['battle_royale'],
        requiredColumns: BATTLE_ROYALE_COLUMNS,
        tags: ['battle-royale', 'matches', 'weapons', 'competitive'],
        category: 'engagement',
        downloads: 540,
        stars: 42,
        featured: false,
        verified: true,
        createdAt: '2024-04-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
];

/**
 * Initialize starter templates in IndexedDB
 */
export async function initializeStarterTemplates(): Promise<void> {
    const { getAllTemplates, saveTemplate } = await import('./templateStore');

    const existing = await getAllTemplates();
    const existingIds = new Set(existing.map(t => t.id));

    for (const template of STARTER_TEMPLATES) {
        if (!existingIds.has(template.id)) {
            await saveTemplate(template);
        }
    }
}

/**
 * Get all starter template IDs
 */
export function getStarterTemplateIds(): string[] {
    return STARTER_TEMPLATES.map(t => t.id);
}

/**
 * Check if a template is a starter template
 */
export function isStarterTemplate(templateId: string): boolean {
    return STARTER_TEMPLATES.some(t => t.id === templateId);
}
