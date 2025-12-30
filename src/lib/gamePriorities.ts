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
        'What-If Analysis': 6, // Phase 5: What-If Simulation
        'ML Studio': 7,     // Phase 7: ML Studio
        'AI Analytics': 8,
        'Funnels': 9,       // Level progression is critical
        'Funnel Builder': 10,
        'Engagement': 11,
        'Monetization': 12,
        'Attribution': 13,  // Phase 9: Attribution Analytics
        'Health': 14,
        'Realtime': 15,
        'Distributions': 16,
        'Explore': 17,
        'User Analysis': 18,
        'Dashboards': 19,
        'A/B Testing': 20,
        'Remote Configs': 21,
        'Game Settings': 22,
    },
    idle: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'What-If Analysis': 6, // Phase 5: What-If Simulation
        'ML Studio': 7,     // Phase 7: ML Studio
        'AI Analytics': 8,
        'Engagement': 9,    // Session time is critical
        'Monetization': 10,  // Ads + IAP balance
        'Distributions': 11, // Prestige distribution
        'Funnels': 12,
        'Funnel Builder': 13,
        'Attribution': 14,  // Phase 9: Attribution Analytics
        'Health': 15,
        'Realtime': 16,
        'Explore': 17,
        'User Analysis': 18,
        'Dashboards': 19,
        'A/B Testing': 20,
        'Remote Configs': 21,
        'Game Settings': 22,
    },
    battle_royale: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'What-If Analysis': 6, // Phase 5: What-If Simulation
        'ML Studio': 7,     // Phase 7: ML Studio
        'AI Analytics': 8,
        'Realtime': 9,      // Live matches critical
        'Distributions': 10, // Rank distribution
        'Engagement': 11,
        'Health': 12,       // Server health
        'Monetization': 13,
        'Attribution': 14,  // Phase 9: Attribution Analytics
        'Funnels': 15,
        'Funnel Builder': 16,
        'Explore': 17,
        'User Analysis': 18,
        'Dashboards': 19,
        'A/B Testing': 20,
        'Remote Configs': 21,
        'Game Settings': 22,
    },
    match3_meta: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'What-If Analysis': 6, // Phase 5: What-If Simulation
        'ML Studio': 7,     // Phase 7: ML Studio
        'AI Analytics': 8,
        'Funnels': 9,       // Chapter/story progression
        'Funnel Builder': 10,
        'Engagement': 11,    // Decoration engagement
        'Monetization': 12,
        'Attribution': 13,  // Phase 9: Attribution Analytics
        'User Analysis': 14, // Player segments
        'Health': 15,
        'Realtime': 16,
        'Distributions': 17,
        'Explore': 18,
        'Dashboards': 19,
        'A/B Testing': 20,
        'Remote Configs': 21,
        'Game Settings': 22,
    },
    gacha_rpg: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'What-If Analysis': 6, // Phase 5: What-If Simulation
        'ML Studio': 7,     // Phase 7: ML Studio
        'AI Analytics': 8,
        'Monetization': 9,  // Revenue is king
        'Attribution': 10,   // Phase 9: Attribution Analytics (critical for UA)
        'Distributions': 11, // Pull/pity distribution
        'User Analysis': 12, // Whale identification
        'Realtime': 13,     // Limited banner tracking
        'Engagement': 14,
        'Funnels': 15,
        'Funnel Builder': 16,
        'Health': 17,
        'Explore': 18,
        'Dashboards': 19,
        'A/B Testing': 20,
        'Remote Configs': 21,
        'Game Settings': 22,
    },
    custom: {
        'Overview': 1,
        'Games': 2,
        'Data Sources': 3,
        'Templates': 4,
        'Predictions': 5,
        'What-If Analysis': 6, // Phase 5: What-If Simulation
        'ML Studio': 7,     // Phase 7: ML Studio
        'AI Analytics': 8,
        'Explore': 9,
        'Dashboards': 10,
        'Funnels': 11,
        'Funnel Builder': 12,
        'Engagement': 13,
        'Distributions': 14,
        'Monetization': 15,
        'Attribution': 16,  // Phase 9: Attribution Analytics
        'Health': 17,
        'Realtime': 18,
        'User Analysis': 19,
        'A/B Testing': 20,
        'Remote Configs': 21,
        'Game Settings': 22,
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
