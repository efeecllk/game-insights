/**
 * Gaming Industry Pack
 *
 * Comprehensive analytics configuration for mobile and casual games.
 * Supports puzzle, idle, battle royale, match3, and gacha game types.
 */

import {
  IndustryPack,
  IndustrySemanticType,
  DetectionIndicator,
  MetricDefinition,
  FunnelTemplate,
  ChartConfig,
  InsightTemplate,
  TerminologyMap,
  IndustryTheme,
} from '../types';

/**
 * Gaming-specific semantic types
 */
const semanticTypes: IndustrySemanticType[] = [
  // Core identification
  { type: 'user_id', patterns: ['user_id', 'player_id', 'uid', 'playerId', 'userId'], priority: 10 },
  { type: 'session_id', patterns: ['session_id', 'sid', 'match_id', 'sessionId'], priority: 8 },
  { type: 'event_name', patterns: ['event_name', 'event_type', 'action', 'eventName', 'eventType'], priority: 9 },
  { type: 'timestamp', patterns: ['timestamp', 'date', 'time', 'created_at', 'ts', 'eventTime', 'install_date'], priority: 10 },

  // Monetization
  { type: 'revenue', patterns: ['revenue', 'income', 'earnings', 'rev', 'iap_revenue', 'total_revenue'], priority: 9 },
  { type: 'currency', patterns: ['currency', 'gold', 'gems', 'coins', 'gemsSpent', 'goldEarned', 'diamonds'], priority: 7 },
  { type: 'price', patterns: ['price', 'amount', 'cost', 'price_usd'], priority: 7 },

  // Progression
  { type: 'level', patterns: ['level', 'lvl', 'player_level', 'upgrade_level', 'stage', 'wave'], priority: 8 },
  { type: 'score', patterns: ['score', 'points', 'high_score', 'best_score'], priority: 7 },
  { type: 'xp', patterns: ['xp', 'experience', 'exp'], priority: 6 },
  { type: 'rank', patterns: ['rank', 'tier', 'league', 'division'], priority: 6 },

  // Demographics
  { type: 'country', patterns: ['country', 'region', 'geo', 'country_code'], priority: 5 },
  { type: 'platform', patterns: ['platform', 'os', 'device_type'], priority: 6 },
  { type: 'device', patterns: ['device', 'model', 'device_model'], priority: 4 },
  { type: 'version', patterns: ['version', 'ver', 'app_version', 'build'], priority: 5 },

  // Retention & Cohort
  { type: 'retention_day', patterns: ['retention', 'd1', 'd7', 'd30', 'retention_d'], priority: 8 },
  { type: 'cohort', patterns: ['cohort', 'install_cohort', 'cohort_day'], priority: 7 },
  { type: 'segment', patterns: ['segment', 'group', 'bucket', 'player_segment'], priority: 5 },

  // Puzzle/Match3 specific
  { type: 'moves', patterns: ['moves', 'attempts', 'moves_left', 'turns'], priority: 9, description: 'Puzzle game moves' },
  { type: 'booster', patterns: ['booster', 'powerup', 'helper', 'boosters_used', 'power_up'], priority: 9, description: 'Power-ups used' },
  { type: 'lives', patterns: ['lives', 'hearts', 'energy'], priority: 8, description: 'Lives/energy system' },

  // Idle game specific
  { type: 'prestige', patterns: ['prestige', 'rebirth', 'ascend', 'reset'], priority: 10, description: 'Idle game prestige' },
  { type: 'offline_reward', patterns: ['offline', 'idle', 'away', 'offlineMinutes', 'offline_time'], priority: 10, description: 'Offline rewards' },
  { type: 'upgrade', patterns: ['upgrade', 'enhance', 'improve', 'upgrade_count'], priority: 7 },

  // Gacha/RPG specific
  { type: 'rarity', patterns: ['rarity', 'ssr', 'sr', 'legendary', 'epic', 'rare', 'common'], priority: 10, description: 'Character/item rarity' },
  { type: 'banner', patterns: ['banner', 'summon', 'bannerName', 'gacha_banner'], priority: 10, description: 'Gacha banner' },
  { type: 'pull_type', patterns: ['pull', 'gacha', 'pullType', 'summon_type'], priority: 9, description: 'Gacha pull type' },
  { type: 'pity_count', patterns: ['pity', 'pity_count', 'guaranteed'], priority: 8, description: 'Pity system counter' },

  // Battle Royale specific
  { type: 'kills', patterns: ['kills', 'eliminations', 'frags', 'kill_count'], priority: 10, description: 'Eliminations' },
  { type: 'placement', patterns: ['placement', 'position', 'standing', 'finish_position'], priority: 10, description: 'Match placement' },
  { type: 'damage', patterns: ['damage', 'dmg', 'damage_dealt'], priority: 8, description: 'Damage dealt' },
  { type: 'survival_time', patterns: ['survival', 'alive', 'survivalTime', 'time_alive'], priority: 8, description: 'Survival time' },

  // Ad monetization
  { type: 'ad_impression', patterns: ['ad_impression', 'impression_count', 'ads_shown'], priority: 7 },
  { type: 'ad_revenue', patterns: ['ad_revenue', 'ad_earnings', 'ad_revenue_usd'], priority: 8 },
  { type: 'ad_network', patterns: ['ad_network', 'network_name', 'admob', 'unity_ads', 'applovin'], priority: 6 },
  { type: 'ad_type', patterns: ['ad_type', 'ad_format', 'interstitial', 'rewarded', 'banner_ad'], priority: 6 },
  { type: 'ecpm', patterns: ['ecpm', 'cpm', 'ad_ecpm'], priority: 7 },
  { type: 'ad_watched', patterns: ['ad_watched', 'watched_full', 'ad_completed'], priority: 7 },

  // IAP tracking
  { type: 'iap_revenue', patterns: ['iap_revenue', 'purchase_revenue', 'iap_revenue_usd'], priority: 9 },
  { type: 'purchase_amount', patterns: ['purchase_amount', 'transaction_amount', 'spend'], priority: 8 },
  { type: 'product_id', patterns: ['product_id', 'bundle_id', 'pack_id', 'sku'], priority: 6 },
  { type: 'offer_id', patterns: ['offer_id', 'promo_id', 'deal_id'], priority: 6 },
  { type: 'offer_shown', patterns: ['offer_shown', 'promo_shown', 'offer_displayed'], priority: 5 },

  // Engagement metrics
  { type: 'session_duration', patterns: ['session_duration', 'session_length', 'time_spent', 'play_time'], priority: 8 },
  { type: 'session_count', patterns: ['session_count', 'session_number', 'sessions_total'], priority: 7 },
  { type: 'rounds_played', patterns: ['rounds_played', 'games_played', 'matches_played', 'rounds_this_session'], priority: 7 },
  { type: 'days_since_install', patterns: ['days_since_install', 'install_day', 'player_age', 'account_age'], priority: 8 },

  // Premium features
  { type: 'vip_level', patterns: ['vip_level', 'vip_tier', 'premium_level'], priority: 7 },
  { type: 'battle_pass_level', patterns: ['battle_pass', 'pass_level', 'season_pass'], priority: 7 },
  { type: 'premium_currency', patterns: ['premium_currency', 'premium_gems', 'paid_currency'], priority: 6 },

  // Acquisition
  { type: 'is_organic', patterns: ['is_organic', 'organic_user', 'acquisition_type'], priority: 6 },
  { type: 'acquisition_source', patterns: ['acquisition_source', 'utm_source', 'install_source', 'campaign'], priority: 6 },
];

/**
 * Detection indicators for gaming industry
 */
const detectionIndicators: DetectionIndicator[] = [
  // Strong puzzle indicators
  { types: ['moves', 'booster'], weight: 10, reason: 'Puzzle game mechanics (moves, boosters)' },
  { types: ['lives', 'level'], weight: 8, reason: 'Lives and level system typical of puzzle games' },

  // Strong idle game indicators
  { types: ['prestige'], weight: 10, reason: 'Prestige system indicates idle game' },
  { types: ['offline_reward'], weight: 10, reason: 'Offline rewards indicate idle game' },
  { types: ['upgrade', 'currency'], weight: 6, reason: 'Upgrade systems common in idle games' },

  // Strong gacha indicators
  { types: ['banner', 'pull_type'], weight: 10, reason: 'Gacha banner system' },
  { types: ['rarity'], weight: 9, reason: 'Rarity system typical of gacha games' },
  { types: ['pity_count'], weight: 8, reason: 'Pity system indicates gacha game' },

  // Strong battle royale indicators
  { types: ['placement', 'kills'], weight: 10, reason: 'Placement and kills indicate battle royale' },
  { types: ['damage', 'survival_time'], weight: 8, reason: 'Combat metrics typical of BR games' },

  // General gaming indicators
  { types: ['level', 'score'], weight: 5, reason: 'Level and score systems' },
  { types: ['session_duration', 'rounds_played'], weight: 4, reason: 'Gaming engagement metrics' },
  { types: ['ad_revenue', 'iap_revenue'], weight: 5, reason: 'Mobile game monetization' },
  { types: ['vip_level', 'battle_pass_level'], weight: 6, reason: 'Premium gaming features' },
];

/**
 * Gaming metrics definitions
 */
const metrics: MetricDefinition[] = [
  // Core KPIs
  {
    id: 'dau',
    name: 'Daily Active Users',
    description: 'Unique users active per day',
    formula: { expression: 'COUNT_DISTINCT($user_id) WHERE DATE($timestamp) = TODAY()', requiredTypes: ['user_id', 'timestamp'] },
    format: 'number',
    category: 'kpi',
  },
  {
    id: 'mau',
    name: 'Monthly Active Users',
    description: 'Unique users active in the last 30 days',
    formula: { expression: 'COUNT_DISTINCT($user_id) WHERE $timestamp >= TODAY() - 30', requiredTypes: ['user_id', 'timestamp'] },
    format: 'number',
    category: 'kpi',
  },
  {
    id: 'stickiness',
    name: 'DAU/MAU Ratio',
    description: 'User engagement stickiness',
    formula: { expression: '($dau / $mau) * 100', requiredTypes: ['user_id', 'timestamp'] },
    format: 'percentage',
    category: 'engagement',
    thresholds: { good: 20, warning: 10, bad: 5 },
  },
  {
    id: 'arpdau',
    name: 'ARPDAU',
    description: 'Average Revenue Per Daily Active User',
    formula: { expression: 'SUM($revenue) / COUNT_DISTINCT($user_id)', requiredTypes: ['revenue', 'user_id'] },
    format: 'currency',
    category: 'monetization',
  },
  {
    id: 'arppu',
    name: 'ARPPU',
    description: 'Average Revenue Per Paying User',
    formula: { expression: 'SUM($revenue) / COUNT_DISTINCT($user_id WHERE $revenue > 0)', requiredTypes: ['revenue', 'user_id'] },
    format: 'currency',
    category: 'monetization',
  },
  {
    id: 'conversion_rate',
    name: 'Payer Conversion Rate',
    description: 'Percentage of users who made a purchase',
    formula: { expression: 'COUNT_DISTINCT($user_id WHERE $revenue > 0) / COUNT_DISTINCT($user_id) * 100', requiredTypes: ['revenue', 'user_id'] },
    format: 'percentage',
    category: 'monetization',
    thresholds: { good: 5, warning: 2, bad: 1 },
  },

  // Retention metrics
  {
    id: 'd1_retention',
    name: 'D1 Retention',
    description: 'Percentage of users returning on day 1',
    formula: { expression: 'RETENTION($user_id, $timestamp, 1)', requiredTypes: ['user_id', 'timestamp'] },
    format: 'percentage',
    category: 'retention',
    thresholds: { good: 40, warning: 30, bad: 20 },
  },
  {
    id: 'd7_retention',
    name: 'D7 Retention',
    description: 'Percentage of users returning on day 7',
    formula: { expression: 'RETENTION($user_id, $timestamp, 7)', requiredTypes: ['user_id', 'timestamp'] },
    format: 'percentage',
    category: 'retention',
    thresholds: { good: 20, warning: 12, bad: 8 },
  },
  {
    id: 'd30_retention',
    name: 'D30 Retention',
    description: 'Percentage of users returning on day 30',
    formula: { expression: 'RETENTION($user_id, $timestamp, 30)', requiredTypes: ['user_id', 'timestamp'] },
    format: 'percentage',
    category: 'retention',
    thresholds: { good: 10, warning: 5, bad: 3 },
  },

  // Engagement metrics
  {
    id: 'avg_session_duration',
    name: 'Avg Session Duration',
    description: 'Average time spent per session',
    formula: { expression: 'AVG($session_duration)', requiredTypes: ['session_duration'] },
    format: 'duration',
    category: 'engagement',
  },
  {
    id: 'sessions_per_day',
    name: 'Sessions per DAU',
    description: 'Average sessions per active user per day',
    formula: { expression: 'COUNT($session_id) / COUNT_DISTINCT($user_id)', requiredTypes: ['session_id', 'user_id'] },
    format: 'decimal',
    category: 'engagement',
  },

  // Puzzle-specific metrics
  {
    id: 'level_completion_rate',
    name: 'Level Completion Rate',
    description: 'Percentage of level attempts completed',
    formula: { expression: 'COUNT(WHERE $event_name = "level_complete") / COUNT(WHERE $event_name = "level_start") * 100', requiredTypes: ['event_name', 'level'] },
    format: 'percentage',
    category: 'funnel',
    subCategories: ['puzzle', 'match3'],
  },
  {
    id: 'moves_per_level',
    name: 'Avg Moves per Level',
    description: 'Average moves used per level attempt',
    formula: { expression: 'AVG($moves)', requiredTypes: ['moves'] },
    format: 'number',
    category: 'engagement',
    subCategories: ['puzzle', 'match3'],
  },
  {
    id: 'booster_usage_rate',
    name: 'Booster Usage Rate',
    description: 'Percentage of levels where boosters were used',
    formula: { expression: 'COUNT(WHERE $booster > 0) / COUNT($level) * 100', requiredTypes: ['booster', 'level'] },
    format: 'percentage',
    category: 'engagement',
    subCategories: ['puzzle', 'match3'],
  },

  // Idle-specific metrics
  {
    id: 'prestige_rate',
    name: 'Prestige Rate',
    description: 'Average prestiges per user',
    formula: { expression: 'SUM($prestige) / COUNT_DISTINCT($user_id)', requiredTypes: ['prestige', 'user_id'] },
    format: 'decimal',
    category: 'engagement',
    subCategories: ['idle'],
  },
  {
    id: 'offline_time_ratio',
    name: 'Offline/Online Ratio',
    description: 'Ratio of offline to online play time',
    formula: { expression: 'SUM($offline_reward) / SUM($session_duration)', requiredTypes: ['offline_reward', 'session_duration'] },
    format: 'decimal',
    category: 'engagement',
    subCategories: ['idle'],
  },

  // Gacha-specific metrics
  {
    id: 'pull_count',
    name: 'Total Pulls',
    description: 'Total gacha pulls',
    formula: { expression: 'COUNT($pull_type)', requiredTypes: ['pull_type'] },
    format: 'number',
    category: 'engagement',
    subCategories: ['gacha'],
  },
  {
    id: 'ssr_rate',
    name: 'SSR Rate',
    description: 'Percentage of pulls that are SSR',
    formula: { expression: 'COUNT(WHERE $rarity = "ssr") / COUNT($pull_type) * 100', requiredTypes: ['rarity', 'pull_type'] },
    format: 'percentage',
    category: 'engagement',
    subCategories: ['gacha'],
  },
  {
    id: 'avg_pity',
    name: 'Avg Pity to SSR',
    description: 'Average pulls to get SSR',
    formula: { expression: 'AVG($pity_count WHERE $rarity = "ssr")', requiredTypes: ['pity_count', 'rarity'] },
    format: 'number',
    category: 'engagement',
    subCategories: ['gacha'],
  },

  // Battle Royale-specific metrics
  {
    id: 'avg_placement',
    name: 'Avg Placement',
    description: 'Average match finish position',
    formula: { expression: 'AVG($placement)', requiredTypes: ['placement'] },
    format: 'decimal',
    category: 'engagement',
    subCategories: ['battle_royale'],
  },
  {
    id: 'kd_ratio',
    name: 'K/D Ratio',
    description: 'Kills per death',
    formula: { expression: 'SUM($kills) / COUNT(WHERE $placement > 1)', requiredTypes: ['kills', 'placement'] },
    format: 'decimal',
    category: 'engagement',
    subCategories: ['battle_royale'],
  },
  {
    id: 'win_rate',
    name: 'Win Rate',
    description: 'Percentage of matches won',
    formula: { expression: 'COUNT(WHERE $placement = 1) / COUNT($session_id) * 100', requiredTypes: ['placement', 'session_id'] },
    format: 'percentage',
    category: 'engagement',
    subCategories: ['battle_royale'],
    thresholds: { good: 10, warning: 5, bad: 2 },
  },

  // Ad monetization metrics
  {
    id: 'ad_revenue_per_user',
    name: 'Ad Revenue per User',
    description: 'Average ad revenue per active user',
    formula: { expression: 'SUM($ad_revenue) / COUNT_DISTINCT($user_id)', requiredTypes: ['ad_revenue', 'user_id'] },
    format: 'currency',
    category: 'monetization',
  },
  {
    id: 'ads_per_session',
    name: 'Ads per Session',
    description: 'Average ads shown per session',
    formula: { expression: 'SUM($ad_impression) / COUNT_DISTINCT($session_id)', requiredTypes: ['ad_impression', 'session_id'] },
    format: 'decimal',
    category: 'monetization',
  },
];

/**
 * Pre-defined funnels
 */
const funnels: FunnelTemplate[] = [
  {
    id: 'tutorial_funnel',
    name: 'Tutorial Completion',
    description: 'Track tutorial completion and early retention',
    steps: [
      { id: 'install', name: 'Install', semanticType: 'user_id', eventPatterns: ['install', 'first_open'] },
      { id: 'tutorial_start', name: 'Tutorial Start', semanticType: 'event_name', eventPatterns: ['tutorial_start', 'tutorial_begin'] },
      { id: 'tutorial_complete', name: 'Tutorial Complete', semanticType: 'event_name', eventPatterns: ['tutorial_complete', 'tutorial_end'] },
      { id: 'first_level', name: 'First Level', semanticType: 'level', condition: '$level = 1' },
      { id: 'd1_return', name: 'D1 Return', semanticType: 'retention_day', condition: '$retention_day >= 1' },
    ],
  },
  {
    id: 'purchase_funnel',
    name: 'Purchase Funnel',
    description: 'Track path to first purchase',
    steps: [
      { id: 'active', name: 'Active User', semanticType: 'user_id' },
      { id: 'store_view', name: 'View Store', semanticType: 'event_name', eventPatterns: ['store_open', 'shop_view'] },
      { id: 'item_view', name: 'View Item', semanticType: 'event_name', eventPatterns: ['item_view', 'offer_shown'] },
      { id: 'purchase', name: 'Purchase', semanticType: 'revenue', condition: '$revenue > 0' },
      { id: 'repeat_purchase', name: 'Repeat Purchase', semanticType: 'revenue', condition: 'COUNT($revenue) > 1' },
    ],
  },
  {
    id: 'engagement_funnel',
    name: 'Engagement Ladder',
    description: 'Track user engagement progression',
    steps: [
      { id: 'install', name: 'Install', semanticType: 'user_id' },
      { id: 'd1_active', name: 'D1 Active', semanticType: 'retention_day', condition: '$retention_day >= 1' },
      { id: 'd7_active', name: 'D7 Active', semanticType: 'retention_day', condition: '$retention_day >= 7' },
      { id: 'd30_active', name: 'D30 Active', semanticType: 'retention_day', condition: '$retention_day >= 30' },
    ],
  },
  {
    id: 'level_funnel',
    name: 'Level Progression',
    description: 'Track level progression dropoff',
    subCategories: ['puzzle', 'match3'],
    steps: [
      { id: 'level_1', name: 'Level 1', semanticType: 'level', condition: '$level >= 1' },
      { id: 'level_5', name: 'Level 5', semanticType: 'level', condition: '$level >= 5' },
      { id: 'level_10', name: 'Level 10', semanticType: 'level', condition: '$level >= 10' },
      { id: 'level_25', name: 'Level 25', semanticType: 'level', condition: '$level >= 25' },
      { id: 'level_50', name: 'Level 50', semanticType: 'level', condition: '$level >= 50' },
    ],
  },
  {
    id: 'gacha_funnel',
    name: 'Gacha Progression',
    description: 'Track gacha engagement',
    subCategories: ['gacha'],
    steps: [
      { id: 'first_pull', name: 'First Pull', semanticType: 'pull_type' },
      { id: 'first_ssr', name: 'First SSR', semanticType: 'rarity', condition: '$rarity = "ssr"' },
      { id: 'paid_pull', name: 'Paid Pull', semanticType: 'pull_type', condition: '$premium_currency > 0' },
      { id: 'banner_pity', name: 'Hit Pity', semanticType: 'pity_count' },
    ],
  },
];

/**
 * Chart configurations
 */
const chartConfigs: ChartConfig = {
  types: [
    {
      type: 'retention',
      name: 'Retention Curve',
      description: 'Day-over-day retention visualization',
      metrics: ['d1_retention', 'd7_retention', 'd30_retention'],
    },
    {
      type: 'funnel',
      name: 'Conversion Funnel',
      description: 'Step-by-step conversion analysis',
      metrics: ['conversion_rate'],
    },
    {
      type: 'cohort',
      name: 'Cohort Analysis',
      description: 'User behavior by install cohort',
      metrics: ['d1_retention', 'd7_retention', 'arpdau'],
    },
    {
      type: 'line',
      name: 'Trend Analysis',
      description: 'Metric trends over time',
      metrics: ['dau', 'mau', 'arpdau', 'revenue'],
    },
    {
      type: 'bar',
      name: 'Level Distribution',
      description: 'Distribution across levels',
      metrics: ['level_completion_rate'],
      subCategories: ['puzzle', 'match3'],
    },
    {
      type: 'heatmap',
      name: 'Difficulty Heatmap',
      description: 'Level difficulty by day and level',
      metrics: ['level_completion_rate', 'moves_per_level'],
      subCategories: ['puzzle', 'match3'],
    },
    {
      type: 'pie',
      name: 'Spender Segments',
      description: 'Revenue distribution by spender tier',
      metrics: ['arppu', 'conversion_rate'],
    },
    {
      type: 'scatter',
      name: 'K/D vs Placement',
      description: 'Combat performance analysis',
      metrics: ['kd_ratio', 'avg_placement'],
      subCategories: ['battle_royale'],
    },
  ],
  defaultCharts: ['retention', 'funnel', 'line'],
};

/**
 * Insight templates
 */
const insightTemplates: InsightTemplate[] = [
  {
    id: 'retention_good',
    name: 'Strong Retention',
    template: 'D1 retention of {{d1_retention}}% is above industry average, indicating strong first-session experience.',
    requiredMetrics: ['d1_retention'],
    priority: 8,
    category: 'positive',
  },
  {
    id: 'retention_warning',
    name: 'Retention Warning',
    template: 'D7 retention dropped to {{d7_retention}}%, consider improving mid-game content.',
    requiredMetrics: ['d7_retention'],
    priority: 9,
    category: 'negative',
  },
  {
    id: 'monetization_opportunity',
    name: 'Monetization Opportunity',
    template: 'Only {{conversion_rate}}% of users convert. Consider earlier soft paywalls.',
    requiredMetrics: ['conversion_rate'],
    priority: 7,
    category: 'actionable',
  },
  {
    id: 'level_bottleneck',
    name: 'Level Bottleneck',
    template: 'Level {{level}} has {{level_completion_rate}}% completion - possible difficulty spike.',
    requiredMetrics: ['level_completion_rate'],
    priority: 8,
    category: 'actionable',
  },
  {
    id: 'whale_concentration',
    name: 'Whale Concentration',
    template: 'Top 10% of spenders generate {{whale_revenue_share}}% of revenue.',
    requiredMetrics: ['arppu', 'revenue'],
    priority: 6,
    category: 'neutral',
  },
];

/**
 * Gaming terminology
 */
const terminology: TerminologyMap = {
  user: { singular: 'Player', plural: 'Players' },
  session: { singular: 'Session', plural: 'Sessions' },
  conversion: { singular: 'Purchase', plural: 'Purchases' },
  revenue: { singular: 'Revenue', plural: 'Revenue' },
  level: { singular: 'Level', plural: 'Levels' },
  match: { singular: 'Match', plural: 'Matches' },
};

/**
 * Gaming theme
 */
const theme: IndustryTheme = {
  primaryColor: '#8b5cf6', // Purple
  accentColor: '#6366f1', // Indigo
  chartColors: [
    '#8b5cf6', // Purple
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#22c55e', // Green
    '#f97316', // Orange
    '#eab308', // Yellow
    '#ef4444', // Red
  ],
  icon: 'gamepad-2',
};

/**
 * Complete Gaming Industry Pack
 */
export const GamingPack: IndustryPack = {
  id: 'gaming',
  name: 'Gaming',
  description: 'Mobile and casual game analytics with support for puzzle, idle, battle royale, match3, and gacha games.',
  version: '1.0.0',

  subCategories: [
    { id: 'puzzle', name: 'Puzzle', description: 'Level-based puzzle games with lives and boosters' },
    { id: 'idle', name: 'Idle/Incremental', description: 'Idle games with prestige systems' },
    { id: 'battle_royale', name: 'Battle Royale', description: 'PvP survival games' },
    { id: 'match3', name: 'Match-3 Meta', description: 'Match-3 with meta progression' },
    { id: 'gacha', name: 'Gacha/RPG', description: 'Character collection games' },
    { id: 'hypercasual', name: 'Hyper-casual', description: 'Simple, ad-monetized games' },
    { id: 'custom', name: 'Custom', description: 'Other game types' },
  ],

  semanticTypes,
  detectionIndicators,
  metrics,
  funnels,
  chartConfigs,
  insightTemplates,
  terminology,
  theme,

  metadata: {
    author: 'ProductInsights',
    license: 'MIT',
  },
};

/**
 * Load and register the gaming pack
 */
export function loadGamingPack(): IndustryPack {
  return GamingPack;
}

export default GamingPack;
