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
        'Games': 2,         // Phase 6: Multi-Game Management
        'Data Sources': 3,  // Phase 3: Integration Hub
        'Templates': 4,     // Phase 4: Community Templates
        'Predictions': 5,   // Phase 5: AI Predictions
        'AI Analytics': 6,
        'Funnels': 7,       // Level progression is critical
        'Funnel Builder': 8,
        'Engagement': 9,
        'Monetization': 10,
        'Attribution': 11,  // Phase 9: Attribution Analytics
        'Health': 12,
        'Realtime': 13,
        'Distributions': 14,
        'Explore': 15,
        'User Analysis': 16,
        'Dashboards': 17,
        'A/B Testing': 18,
        'Remote Configs': 19,
        'Game Settings': 20,
    },
    idle: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'AI Analytics': 6,
        'Engagement': 7,    // Session time is critical
        'Monetization': 8,  // Ads + IAP balance
        'Distributions': 9, // Prestige distribution
        'Funnels': 10,
        'Funnel Builder': 11,
        'Attribution': 12,  // Phase 9: Attribution Analytics
        'Health': 13,
        'Realtime': 14,
        'Explore': 15,
        'User Analysis': 16,
        'Dashboards': 17,
        'A/B Testing': 18,
        'Remote Configs': 19,
        'Game Settings': 20,
    },
    battle_royale: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'AI Analytics': 6,
        'Realtime': 7,      // Live matches critical
        'Distributions': 8, // Rank distribution
        'Engagement': 9,
        'Health': 10,       // Server health
        'Monetization': 11,
        'Attribution': 12,  // Phase 9: Attribution Analytics
        'Funnels': 13,
        'Funnel Builder': 14,
        'Explore': 15,
        'User Analysis': 16,
        'Dashboards': 17,
        'A/B Testing': 18,
        'Remote Configs': 19,
        'Game Settings': 20,
    },
    match3_meta: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'AI Analytics': 6,
        'Funnels': 7,       // Chapter/story progression
        'Funnel Builder': 8,
        'Engagement': 9,    // Decoration engagement
        'Monetization': 10,
        'Attribution': 11,  // Phase 9: Attribution Analytics
        'User Analysis': 12, // Player segments
        'Health': 13,
        'Realtime': 14,
        'Distributions': 15,
        'Explore': 16,
        'Dashboards': 17,
        'A/B Testing': 18,
        'Remote Configs': 19,
        'Game Settings': 20,
    },
    gacha_rpg: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'AI Analytics': 6,
        'Monetization': 7,  // Revenue is king
        'Attribution': 8,   // Phase 9: Attribution Analytics (critical for UA)
        'Distributions': 9, // Pull/pity distribution
        'User Analysis': 10, // Whale identification
        'Realtime': 11,     // Limited banner tracking
        'Engagement': 12,
        'Funnels': 13,
        'Funnel Builder': 14,
        'Health': 15,
        'Explore': 16,
        'Dashboards': 17,
        'A/B Testing': 18,
        'Remote Configs': 19,
        'Game Settings': 20,
    },
    custom: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'AI Analytics': 6,
        'Explore': 7,
        'Dashboards': 8,
        'Funnels': 9,
        'Funnel Builder': 10,
        'Engagement': 11,
        'Distributions': 12,
        'Monetization': 13,
        'Attribution': 14,  // Phase 9: Attribution Analytics
        'Health': 15,
        'Realtime': 16,
        'User Analysis': 17,
        'A/B Testing': 18,
        'Remote Configs': 19,
        'Game Settings': 20,
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
