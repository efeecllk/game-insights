/**
 * Game Priority Configuration
 * Defines sidebar menu order and chart importance per game type
 */

import { GameCategory } from '../types';

/**
 * Priority order for sidebar menu items per game type
 * Lower number = higher priority (appears at top)
 */
export const sidebarPriorities: Record<GameCategory, Record<string, number>> = {
    puzzle: {
        'Overview': 1,
        'Data Sources': 2,  // Phase 3: Integration Hub
        'Templates': 3,     // Phase 4: Community Templates
        'Predictions': 4,   // Phase 5: AI Predictions
        'AI Analytics': 5,
        'Funnels': 6,       // Level progression is critical
        'Engagement': 7,
        'Monetization': 8,
        'Health': 9,
        'Realtime': 10,
        'Distributions': 11,
        'Explore': 12,
        'User Analysis': 13,
        'Dashboards': 14,
        'A/B Testing': 15,
        'Remote Configs': 16,
        'Game Settings': 17,
    },
    idle: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'Predictions': 4,
        'AI Analytics': 5,
        'Engagement': 6,    // Session time is critical
        'Monetization': 7,  // Ads + IAP balance
        'Distributions': 8, // Prestige distribution
        'Funnels': 9,
        'Health': 10,
        'Realtime': 11,
        'Explore': 12,
        'User Analysis': 13,
        'Dashboards': 14,
        'A/B Testing': 15,
        'Remote Configs': 16,
        'Game Settings': 17,
    },
    battle_royale: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'Predictions': 4,
        'AI Analytics': 5,
        'Realtime': 6,      // Live matches critical
        'Distributions': 7, // Rank distribution
        'Engagement': 8,
        'Health': 9,        // Server health
        'Monetization': 10,
        'Funnels': 11,
        'Explore': 12,
        'User Analysis': 13,
        'Dashboards': 14,
        'A/B Testing': 15,
        'Remote Configs': 16,
        'Game Settings': 17,
    },
    match3_meta: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'Predictions': 4,
        'AI Analytics': 5,
        'Funnels': 6,       // Chapter/story progression
        'Engagement': 7,    // Decoration engagement
        'Monetization': 8,
        'User Analysis': 9, // Player segments
        'Health': 10,
        'Realtime': 11,
        'Distributions': 12,
        'Explore': 13,
        'Dashboards': 14,
        'A/B Testing': 15,
        'Remote Configs': 16,
        'Game Settings': 17,
    },
    gacha_rpg: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'Predictions': 4,
        'AI Analytics': 5,
        'Monetization': 6,  // Revenue is king
        'Distributions': 7, // Pull/pity distribution
        'User Analysis': 8, // Whale identification
        'Realtime': 9,      // Limited banner tracking
        'Engagement': 10,
        'Funnels': 11,
        'Health': 12,
        'Explore': 13,
        'Dashboards': 14,
        'A/B Testing': 15,
        'Remote Configs': 16,
        'Game Settings': 17,
    },
    custom: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'Predictions': 4,
        'AI Analytics': 5,
        'Explore': 6,
        'Dashboards': 7,
        'Funnels': 8,
        'Engagement': 9,
        'Distributions': 10,
        'Monetization': 11,
        'Health': 12,
        'Realtime': 13,
        'User Analysis': 14,
        'A/B Testing': 15,
        'Remote Configs': 16,
        'Game Settings': 17,
    },
};

/**
 * Chart priority per game type
 * Determines which charts appear first in Overview
 */
export type ChartType = 'retention' | 'funnel' | 'revenue' | 'segment';

export const chartPriorities: Record<GameCategory, ChartType[]> = {
    puzzle: ['funnel', 'retention', 'segment', 'revenue'],     // Level funnel most important
    idle: ['retention', 'segment', 'revenue', 'funnel'],       // Retention is key for idle
    battle_royale: ['segment', 'retention', 'funnel', 'revenue'], // Weapon/rank distribution
    match3_meta: ['funnel', 'segment', 'retention', 'revenue'],   // Story funnel + decoration
    gacha_rpg: ['revenue', 'segment', 'retention', 'funnel'],     // Revenue first for gacha
    custom: ['retention', 'funnel', 'revenue', 'segment'],         // Default order for custom
};

/**
 * Chart titles per game type
 */
export const chartTitles: Record<GameCategory, Record<ChartType, { title: string; subtitle: string }>> = {
    puzzle: {
        retention: { title: 'User Retention', subtitle: 'Day-over-day player return rate' },
        funnel: { title: 'Level Progression', subtitle: 'Player drop-off by level' },
        revenue: { title: 'Daily Revenue', subtitle: 'IAP and ad revenue' },
        segment: { title: 'Booster Usage', subtitle: 'Most used power-ups' },
    },
    idle: {
        retention: { title: 'Session Retention', subtitle: 'Return rate by offline time' },
        funnel: { title: 'Prestige Funnel', subtitle: 'Players by prestige level' },
        revenue: { title: 'Revenue Mix', subtitle: 'Ads vs IAP breakdown' },
        segment: { title: 'Time Distribution', subtitle: 'Online vs offline play' },
    },
    battle_royale: {
        retention: { title: 'Player Retention', subtitle: 'Return rate by skill tier' },
        funnel: { title: 'Rank Distribution', subtitle: 'Players by competitive rank' },
        revenue: { title: 'Battle Pass Revenue', subtitle: 'Season earnings' },
        segment: { title: 'Weapon Meta', subtitle: 'Most used weapons' },
    },
    match3_meta: {
        retention: { title: 'Story Retention', subtitle: 'Chapter completion rates' },
        funnel: { title: 'Chapter Progression', subtitle: 'Story mode drop-off' },
        revenue: { title: 'Decoration Revenue', subtitle: 'Meta game earnings' },
        segment: { title: 'Style Preferences', subtitle: 'Decoration choices' },
    },
    gacha_rpg: {
        retention: { title: 'Whale Retention', subtitle: 'High spender return rate' },
        funnel: { title: 'Spender Tiers', subtitle: 'F2P to whale distribution' },
        revenue: { title: 'Banner Revenue', subtitle: 'Pull income breakdown' },
        segment: { title: 'Pull Distribution', subtitle: 'SSR rate by banner' },
    },
    custom: {
        retention: { title: 'Retention', subtitle: 'Player return rate' },
        funnel: { title: 'Funnel', subtitle: 'Progression analysis' },
        revenue: { title: 'Revenue', subtitle: 'Earnings breakdown' },
        segment: { title: 'Segments', subtitle: 'Distribution breakdown' },
    },
};

export default { sidebarPriorities, chartPriorities, chartTitles };
