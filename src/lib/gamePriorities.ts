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
        'Funnels': 2,       // Level progression is critical
        'Engagement': 3,
        'Monetization': 4,
        'Health': 5,
        'Realtime': 6,
        'Distributions': 7,
        'Explore': 8,
        'User Analysis': 9,
        'Dashboards': 10,
        'A/B Testing': 11,
        'Remote Configs': 12,
        'DataSuite': 13,
        'Game Settings': 14,
    },
    idle: {
        'Overview': 1,
        'Engagement': 2,    // Session time is critical
        'Monetization': 3,  // Ads + IAP balance
        'Distributions': 4, // Prestige distribution
        'Funnels': 5,
        'Health': 6,
        'Realtime': 7,
        'Explore': 8,
        'User Analysis': 9,
        'Dashboards': 10,
        'A/B Testing': 11,
        'Remote Configs': 12,
        'DataSuite': 13,
        'Game Settings': 14,
    },
    battle_royale: {
        'Overview': 1,
        'Realtime': 2,      // Live matches critical
        'Distributions': 3, // Rank distribution
        'Engagement': 4,
        'Health': 5,        // Server health
        'Monetization': 6,
        'Funnels': 7,
        'Explore': 8,
        'User Analysis': 9,
        'Dashboards': 10,
        'A/B Testing': 11,
        'Remote Configs': 12,
        'DataSuite': 13,
        'Game Settings': 14,
    },
    match3_meta: {
        'Overview': 1,
        'Funnels': 2,       // Chapter/story progression
        'Engagement': 3,    // Decoration engagement
        'Monetization': 4,
        'User Analysis': 5, // Player segments
        'Health': 6,
        'Realtime': 7,
        'Distributions': 8,
        'Explore': 9,
        'Dashboards': 10,
        'A/B Testing': 11,
        'Remote Configs': 12,
        'DataSuite': 13,
        'Game Settings': 14,
    },
    gacha_rpg: {
        'Overview': 1,
        'Monetization': 2,  // Revenue is king
        'Distributions': 3, // Pull/pity distribution
        'User Analysis': 4, // Whale identification
        'Realtime': 5,      // Limited banner tracking
        'Engagement': 6,
        'Funnels': 7,
        'Health': 8,
        'Explore': 9,
        'Dashboards': 10,
        'A/B Testing': 11,
        'Remote Configs': 12,
        'DataSuite': 13,
        'Game Settings': 14,
    },
    custom: {
        'Overview': 1,
        'Explore': 2,
        'Dashboards': 3,
        'Funnels': 4,
        'Engagement': 5,
        'Distributions': 6,
        'Monetization': 7,
        'Health': 8,
        'Realtime': 9,
        'User Analysis': 10,
        'A/B Testing': 11,
        'Remote Configs': 12,
        'DataSuite': 13,
        'Game Settings': 14,
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
