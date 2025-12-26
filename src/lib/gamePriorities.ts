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
        'AI Analytics': 4,
        'Funnels': 5,       // Level progression is critical
        'Engagement': 6,
        'Monetization': 7,
        'Health': 8,
        'Realtime': 9,
        'Distributions': 10,
        'Explore': 11,
        'User Analysis': 12,
        'Dashboards': 13,
        'A/B Testing': 14,
        'Remote Configs': 15,
        'Game Settings': 16,
    },
    idle: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'AI Analytics': 4,
        'Engagement': 5,    // Session time is critical
        'Monetization': 6,  // Ads + IAP balance
        'Distributions': 7, // Prestige distribution
        'Funnels': 8,
        'Health': 9,
        'Realtime': 10,
        'Explore': 11,
        'User Analysis': 12,
        'Dashboards': 13,
        'A/B Testing': 14,
        'Remote Configs': 15,
        'Game Settings': 16,
    },
    battle_royale: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'AI Analytics': 4,
        'Realtime': 5,      // Live matches critical
        'Distributions': 6, // Rank distribution
        'Engagement': 7,
        'Health': 8,        // Server health
        'Monetization': 9,
        'Funnels': 10,
        'Explore': 11,
        'User Analysis': 12,
        'Dashboards': 13,
        'A/B Testing': 14,
        'Remote Configs': 15,
        'Game Settings': 16,
    },
    match3_meta: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'AI Analytics': 4,
        'Funnels': 5,       // Chapter/story progression
        'Engagement': 6,    // Decoration engagement
        'Monetization': 7,
        'User Analysis': 8, // Player segments
        'Health': 9,
        'Realtime': 10,
        'Distributions': 11,
        'Explore': 12,
        'Dashboards': 13,
        'A/B Testing': 14,
        'Remote Configs': 15,
        'Game Settings': 16,
    },
    gacha_rpg: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'AI Analytics': 4,
        'Monetization': 5,  // Revenue is king
        'Distributions': 6, // Pull/pity distribution
        'User Analysis': 7, // Whale identification
        'Realtime': 8,      // Limited banner tracking
        'Engagement': 9,
        'Funnels': 10,
        'Health': 11,
        'Explore': 12,
        'Dashboards': 13,
        'A/B Testing': 14,
        'Remote Configs': 15,
        'Game Settings': 16,
    },
    custom: {
        'Overview': 1,
        'Data Sources': 2,
        'Templates': 3,
        'AI Analytics': 4,
        'Explore': 5,
        'Dashboards': 6,
        'Funnels': 7,
        'Engagement': 8,
        'Distributions': 9,
        'Monetization': 10,
        'Health': 11,
        'Realtime': 12,
        'User Analysis': 13,
        'A/B Testing': 14,
        'Remote Configs': 15,
        'Game Settings': 16,
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
