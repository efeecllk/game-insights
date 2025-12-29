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
// New Templates - Hyper-Casual, Social Casino, Racing, Strategy, Simulation,
// Educational, Multiplayer Shooter, Subscription
// ============================================================================

const HYPER_CASUAL_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-installs', name: 'Daily Installs', metric: 'daily_installs', format: 'compact', colorScheme: 'violet', icon: 'Download' },
        { id: 'kpi-d1', name: 'D1 Retention', metric: 'retention_d1', format: 'percentage', colorScheme: 'green', icon: 'TrendingUp' },
        { id: 'kpi-cpi', name: 'CPI', metric: 'cost_per_install', format: 'currency', colorScheme: 'orange', icon: 'DollarSign' },
    ],
    mainCharts: [
        { id: 'main-installs', type: 'line', title: 'Install Trend', subtitle: 'Daily new installs', xColumn: 'date', yColumn: 'installs' },
        { id: 'main-playtime', type: 'bar', title: 'Session Distribution', subtitle: 'Playtime per session', xColumn: 'session_bucket', yColumn: 'user_count' },
    ],
    sideCharts: [
        { id: 'side-source', type: 'pie', title: 'Traffic Source', subtitle: 'Where users come from', xColumn: 'source', yColumn: 'install_count' },
    ],
};

const SOCIAL_CASINO_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-dau', name: 'Daily Active Users', metric: 'dau', format: 'compact', colorScheme: 'violet', icon: 'Users' },
        { id: 'kpi-coins', name: 'Avg Coin Balance', metric: 'avg_coin_balance', format: 'compact', colorScheme: 'orange', icon: 'Coins' },
        { id: 'kpi-sessions', name: 'Sessions/Day', metric: 'sessions_per_day', format: 'number', colorScheme: 'blue', icon: 'Activity' },
        { id: 'kpi-spin-revenue', name: 'Spin Revenue', metric: 'spin_revenue', format: 'currency', colorScheme: 'green', icon: 'DollarSign' },
    ],
    mainCharts: [
        { id: 'main-spins', type: 'line', title: 'Daily Spins', subtitle: 'Total spin count over time', xColumn: 'date', yColumn: 'spin_count' },
        { id: 'main-coin-flow', type: 'area', title: 'Coin Economy', subtitle: 'Coins earned vs spent', xColumn: 'date', yColumn: 'net_coins' },
    ],
    sideCharts: [
        { id: 'side-game-type', type: 'donut', title: 'Game Popularity', subtitle: 'Slots, Poker, Bingo', xColumn: 'game_type', yColumn: 'session_count' },
        { id: 'side-jackpots', type: 'bar', title: 'Jackpot Distribution', subtitle: 'Wins by size', xColumn: 'jackpot_tier', yColumn: 'win_count' },
    ],
};

const RACING_GAME_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-races', name: 'Daily Races', metric: 'daily_races', format: 'compact', colorScheme: 'violet', icon: 'Flag' },
        { id: 'kpi-avg-time', name: 'Avg Lap Time', metric: 'avg_lap_time', format: 'number', colorScheme: 'blue', icon: 'Clock' },
        { id: 'kpi-unlocks', name: 'Vehicle Unlocks', metric: 'vehicle_unlocks', format: 'compact', colorScheme: 'green', icon: 'Unlock' },
    ],
    mainCharts: [
        { id: 'main-times', type: 'line', title: 'Track Best Times', subtitle: 'Fastest times trend', xColumn: 'date', yColumn: 'best_time' },
        { id: 'main-vehicles', type: 'bar', title: 'Vehicle Usage', subtitle: 'Most popular vehicles', xColumn: 'vehicle_name', yColumn: 'race_count' },
    ],
    sideCharts: [
        { id: 'side-tracks', type: 'donut', title: 'Track Popularity', subtitle: 'Races per track', xColumn: 'track_name', yColumn: 'race_count' },
        { id: 'side-finish', type: 'histogram', title: 'Finish Position', subtitle: 'Position distribution', xColumn: 'position', yColumn: 'count' },
    ],
};

const STRATEGY_GAME_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-dau', name: 'Daily Active Users', metric: 'dau', format: 'compact', colorScheme: 'violet', icon: 'Users' },
        { id: 'kpi-resources', name: 'Avg Resources', metric: 'avg_resources', format: 'compact', colorScheme: 'green', icon: 'Package' },
        { id: 'kpi-battles', name: 'Daily Battles', metric: 'daily_battles', format: 'compact', colorScheme: 'orange', icon: 'Swords' },
        { id: 'kpi-buildings', name: 'Avg Buildings', metric: 'avg_buildings', format: 'number', colorScheme: 'blue', icon: 'Building' },
    ],
    mainCharts: [
        { id: 'main-progression', type: 'funnel', title: 'Base Level Funnel', subtitle: 'Players at each HQ level', xColumn: 'hq_level', yColumn: 'player_count' },
        { id: 'main-battles', type: 'line', title: 'Battle Activity', subtitle: 'Daily attacks and defenses', xColumn: 'date', yColumn: 'battle_count' },
    ],
    sideCharts: [
        { id: 'side-units', type: 'bar', title: 'Unit Composition', subtitle: 'Army composition breakdown', xColumn: 'unit_type', yColumn: 'count' },
        { id: 'side-resources', type: 'donut', title: 'Resource Distribution', subtitle: 'Gold, Wood, Stone, etc.', xColumn: 'resource_type', yColumn: 'amount' },
    ],
};

const SIMULATION_GAME_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-playtime', name: 'Avg Playtime', metric: 'avg_daily_playtime', format: 'number', colorScheme: 'violet', icon: 'Clock' },
        { id: 'kpi-economy', name: 'Economy Health', metric: 'economy_index', format: 'number', colorScheme: 'green', icon: 'TrendingUp' },
        { id: 'kpi-progression', name: 'Avg Progress', metric: 'avg_progression', format: 'percentage', colorScheme: 'blue', icon: 'Target' },
    ],
    mainCharts: [
        { id: 'main-playtime', type: 'area', title: 'Playtime Distribution', subtitle: 'Time spent per session', xColumn: 'date', yColumn: 'total_playtime' },
        { id: 'main-milestones', type: 'funnel', title: 'Milestone Completion', subtitle: 'Players reaching milestones', xColumn: 'milestone', yColumn: 'player_count' },
    ],
    sideCharts: [
        { id: 'side-activities', type: 'donut', title: 'Activity Types', subtitle: 'How players spend time', xColumn: 'activity_type', yColumn: 'time_spent' },
        { id: 'side-economy', type: 'line', title: 'Currency Flow', subtitle: 'Income vs expenses', xColumn: 'date', yColumn: 'net_currency' },
    ],
};

const EDUCATIONAL_GAME_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-completion', name: 'Course Completion', metric: 'course_completion_rate', format: 'percentage', colorScheme: 'green', icon: 'CheckCircle' },
        { id: 'kpi-accuracy', name: 'Avg Accuracy', metric: 'avg_accuracy', format: 'percentage', colorScheme: 'violet', icon: 'Target' },
        { id: 'kpi-streak', name: 'Avg Streak', metric: 'avg_streak_days', format: 'number', colorScheme: 'orange', icon: 'Flame' },
        { id: 'kpi-lessons', name: 'Lessons/Day', metric: 'lessons_per_day', format: 'number', colorScheme: 'blue', icon: 'Book' },
    ],
    mainCharts: [
        { id: 'main-progress', type: 'funnel', title: 'Learning Path Progress', subtitle: 'Students at each stage', xColumn: 'stage', yColumn: 'student_count' },
        { id: 'main-scores', type: 'line', title: 'Score Improvement', subtitle: 'Average scores over time', xColumn: 'date', yColumn: 'avg_score' },
    ],
    sideCharts: [
        { id: 'side-topics', type: 'bar', title: 'Topic Performance', subtitle: 'Accuracy by topic', xColumn: 'topic', yColumn: 'accuracy' },
        { id: 'side-time', type: 'donut', title: 'Study Time', subtitle: 'Time per subject', xColumn: 'subject', yColumn: 'time_spent' },
    ],
};

const MULTIPLAYER_SHOOTER_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-kd', name: 'Avg K/D Ratio', metric: 'avg_kd_ratio', format: 'number', colorScheme: 'orange', icon: 'Target' },
        { id: 'kpi-matches', name: 'Daily Matches', metric: 'daily_matches', format: 'compact', colorScheme: 'violet', icon: 'Crosshair' },
        { id: 'kpi-win-rate', name: 'Win Rate', metric: 'win_rate', format: 'percentage', colorScheme: 'green', icon: 'Trophy' },
        { id: 'kpi-headshots', name: 'Headshot %', metric: 'headshot_rate', format: 'percentage', colorScheme: 'blue', icon: 'Zap' },
    ],
    mainCharts: [
        { id: 'main-weapons', type: 'bar', title: 'Weapon Usage', subtitle: 'Kills by weapon type', xColumn: 'weapon_name', yColumn: 'kill_count' },
        { id: 'main-kd-trend', type: 'line', title: 'K/D Trend', subtitle: 'Performance over time', xColumn: 'date', yColumn: 'kd_ratio' },
    ],
    sideCharts: [
        { id: 'side-maps', type: 'donut', title: 'Map Popularity', subtitle: 'Matches by map', xColumn: 'map_name', yColumn: 'match_count' },
        { id: 'side-modes', type: 'pie', title: 'Game Modes', subtitle: 'TDM, CTF, Domination', xColumn: 'game_mode', yColumn: 'match_count' },
    ],
};

const SUBSCRIPTION_GAME_LAYOUT: TemplateLayout = {
    kpis: [
        { id: 'kpi-mrr', name: 'MRR', metric: 'monthly_recurring_revenue', format: 'currency', colorScheme: 'green', icon: 'DollarSign' },
        { id: 'kpi-churn', name: 'Churn Rate', metric: 'churn_rate', format: 'percentage', colorScheme: 'orange', icon: 'TrendingDown' },
        { id: 'kpi-conversion', name: 'Trial Conversion', metric: 'trial_conversion_rate', format: 'percentage', colorScheme: 'violet', icon: 'UserPlus' },
        { id: 'kpi-ltv', name: 'Subscriber LTV', metric: 'subscriber_ltv', format: 'currency', colorScheme: 'blue', icon: 'Award' },
    ],
    mainCharts: [
        { id: 'main-mrr', type: 'area', title: 'MRR Growth', subtitle: 'Monthly recurring revenue trend', xColumn: 'date', yColumn: 'mrr' },
        { id: 'main-subscribers', type: 'line', title: 'Subscriber Count', subtitle: 'Active subscriptions over time', xColumn: 'date', yColumn: 'subscriber_count' },
    ],
    sideCharts: [
        { id: 'side-plans', type: 'donut', title: 'Plan Distribution', subtitle: 'Subscribers by tier', xColumn: 'plan_tier', yColumn: 'subscriber_count' },
        { id: 'side-churn', type: 'bar', title: 'Churn Reasons', subtitle: 'Why users cancel', xColumn: 'reason', yColumn: 'count' },
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

// New Column Requirements

const HYPER_CASUAL_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'timestamp', optional: false, description: 'Event timestamp' },
    { semantic: 'session_id', optional: true, description: 'Session identifier' },
];

const SOCIAL_CASINO_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'timestamp', optional: false, description: 'Event timestamp' },
    { semantic: 'session_id', optional: true, description: 'Session identifier' },
    { semantic: 'currency', optional: true, description: 'Coin balance or amount', alternatives: ['coins', 'balance'] },
];

const RACING_GAME_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'timestamp', optional: false, description: 'Race timestamp' },
    { semantic: 'item_id', optional: true, description: 'Vehicle identifier', alternatives: ['vehicle_id', 'car_id'] },
    { semantic: 'score', optional: true, description: 'Lap time or race time', alternatives: ['lap_time', 'race_time'] },
];

const STRATEGY_GAME_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'timestamp', optional: false, description: 'Event timestamp' },
    { semantic: 'level', optional: true, description: 'Base or HQ level', alternatives: ['hq_level', 'base_level'] },
    { semantic: 'currency', optional: true, description: 'Resource amounts', alternatives: ['resources', 'gold'] },
];

const SIMULATION_GAME_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'timestamp', optional: false, description: 'Event timestamp' },
    { semantic: 'session_id', optional: true, description: 'Session identifier' },
    { semantic: 'currency', optional: true, description: 'In-game currency', alternatives: ['balance', 'money'] },
];

const EDUCATIONAL_GAME_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Student identifier' },
    { semantic: 'timestamp', optional: false, description: 'Event timestamp' },
    { semantic: 'score', optional: true, description: 'Quiz or lesson score', alternatives: ['accuracy', 'grade'] },
    { semantic: 'level', optional: true, description: 'Learning stage or lesson', alternatives: ['lesson_id', 'stage'] },
];

const MULTIPLAYER_SHOOTER_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Player identifier' },
    { semantic: 'timestamp', optional: false, description: 'Match timestamp' },
    { semantic: 'kills', optional: true, description: 'Kill count in match' },
    { semantic: 'item_id', optional: true, description: 'Weapon identifier', alternatives: ['weapon_id', 'weapon_name'] },
];

const SUBSCRIPTION_GAME_COLUMNS: ColumnRequirement[] = [
    { semantic: 'user_id', optional: false, description: 'Subscriber identifier' },
    { semantic: 'timestamp', optional: false, description: 'Event timestamp' },
    { semantic: 'revenue', optional: true, description: 'Subscription amount', alternatives: ['price', 'amount'] },
    { semantic: 'category', optional: true, description: 'Subscription tier', alternatives: ['plan', 'tier'] },
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
    // Hyper-Casual Quick Start Template
    {
        id: 'starter-hyper-casual',
        name: 'Hyper-Casual Quick Start',
        description: 'Minimal metrics dashboard for simple hyper-casual games. Focus on installs, D1 retention, and session length.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: HYPER_CASUAL_LAYOUT,
        gameTypes: ['puzzle', 'custom'],
        requiredColumns: HYPER_CASUAL_COLUMNS,
        tags: ['hyper-casual', 'quick-start', 'minimal', 'beginner'],
        category: 'acquisition',
        downloads: 890,
        stars: 67,
        featured: true,
        verified: true,
        createdAt: '2024-04-15T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Social Casino Dashboard Template
    {
        id: 'starter-social-casino',
        name: 'Social Casino Dashboard',
        description: 'Track slots, poker, and bingo performance. Monitor coin economy, spins, jackpots, and session engagement.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: SOCIAL_CASINO_LAYOUT,
        gameTypes: ['custom'],
        requiredColumns: SOCIAL_CASINO_COLUMNS,
        tags: ['casino', 'slots', 'coins', 'economy', 'social'],
        category: 'engagement',
        downloads: 420,
        stars: 35,
        featured: false,
        verified: true,
        createdAt: '2024-05-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Racing Game Analytics Template
    {
        id: 'starter-racing',
        name: 'Racing Game Analytics',
        description: 'Analyze track times, vehicle usage, unlocks, and race completion. Perfect for racing and driving games.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: RACING_GAME_LAYOUT,
        gameTypes: ['custom'],
        requiredColumns: RACING_GAME_COLUMNS,
        tags: ['racing', 'vehicles', 'tracks', 'leaderboards'],
        category: 'engagement',
        downloads: 380,
        stars: 29,
        featured: false,
        verified: true,
        createdAt: '2024-05-15T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Strategy Game Metrics Template
    {
        id: 'starter-strategy',
        name: 'Strategy Game Metrics',
        description: 'Monitor resources, buildings, battles, and base progression for strategy and 4X games.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: STRATEGY_GAME_LAYOUT,
        gameTypes: ['custom'],
        requiredColumns: STRATEGY_GAME_COLUMNS,
        tags: ['strategy', 'resources', 'battles', 'base-building'],
        category: 'progression',
        downloads: 510,
        stars: 41,
        featured: false,
        verified: true,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Simulation Game Health Template
    {
        id: 'starter-simulation',
        name: 'Simulation Game Health',
        description: 'Track economy health, progression milestones, and time played for simulation and tycoon games.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: SIMULATION_GAME_LAYOUT,
        gameTypes: ['idle', 'custom'],
        requiredColumns: SIMULATION_GAME_COLUMNS,
        tags: ['simulation', 'economy', 'tycoon', 'playtime'],
        category: 'progression',
        downloads: 340,
        stars: 26,
        featured: false,
        verified: true,
        createdAt: '2024-06-05T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Educational Game Progress Template
    {
        id: 'starter-educational',
        name: 'Educational Game Progress',
        description: 'Learning metrics dashboard with course completion, accuracy tracking, streaks, and topic performance.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: EDUCATIONAL_GAME_LAYOUT,
        gameTypes: ['puzzle', 'custom'],
        requiredColumns: EDUCATIONAL_GAME_COLUMNS,
        tags: ['educational', 'learning', 'progress', 'accuracy'],
        category: 'progression',
        downloads: 290,
        stars: 23,
        featured: false,
        verified: true,
        createdAt: '2024-06-08T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Multiplayer Shooter Stats Template
    {
        id: 'starter-multiplayer-shooter',
        name: 'Multiplayer Shooter Stats',
        description: 'Comprehensive FPS analytics with K/D ratio, weapon usage, map popularity, and headshot tracking.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: MULTIPLAYER_SHOOTER_LAYOUT,
        gameTypes: ['battle_royale', 'custom'],
        requiredColumns: MULTIPLAYER_SHOOTER_COLUMNS,
        tags: ['shooter', 'fps', 'weapons', 'kd-ratio', 'competitive'],
        category: 'engagement',
        downloads: 670,
        stars: 52,
        featured: true,
        verified: true,
        createdAt: '2024-06-10T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Subscription Game Monitor Template
    {
        id: 'starter-subscription',
        name: 'Subscription Game Monitor',
        description: 'Track MRR, churn rate, trial conversion, and subscriber LTV for subscription-based games.',
        author: 'Game Insights Team',
        version: '1.0.0',
        layout: SUBSCRIPTION_GAME_LAYOUT,
        gameTypes: ['custom'],
        requiredColumns: SUBSCRIPTION_GAME_COLUMNS,
        tags: ['subscription', 'mrr', 'churn', 'conversion', 'saas'],
        category: 'monetization',
        downloads: 450,
        stars: 38,
        featured: true,
        verified: true,
        createdAt: '2024-06-12T00:00:00Z',
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
