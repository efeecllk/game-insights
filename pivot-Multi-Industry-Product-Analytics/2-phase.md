# Phase 2: Gaming Pack Migration

## Objective
Migrate all existing game-specific code into the Gaming Industry Pack format. This ensures backward compatibility while proving the new abstraction layer works correctly with real implementation.

---

## Duration
**Estimated: 2 weeks**

---

## Prerequisites
- Phase 1 complete (Foundation & Core Abstractions)

---

## Tasks

### Task 2.1: Create Gaming Pack Structure

**Files to create:**
```
src/industry/packs/gaming/
├── index.ts               # Main pack export
├── semanticTypes.ts       # Gaming semantic type definitions
├── indicators.ts          # Detection indicators
├── metrics.ts             # Gaming-specific metrics
├── funnels.ts             # Funnel templates
├── charts.ts              # Chart configurations
├── insights.ts            # Insight templates
├── terminology.ts         # Gaming vocabulary
├── theme.ts               # Gaming theme
└── tips.ts                # Gaming tips per sub-category
```

**Acceptance Criteria:**
- [ ] Directory structure created
- [ ] All files compile without errors

---

### Task 2.2: Extract Semantic Types from SchemaAnalyzer

**Source File:** `src/ai/SchemaAnalyzer.ts` (lines 45-150)

**Target File:** `src/industry/packs/gaming/semanticTypes.ts`

Extract all gaming-related semantic types from `COLUMN_PATTERNS`:

```typescript
import { IndustrySemanticType } from '../../types';

export const gamingSemanticTypes: IndustrySemanticType[] = [
  // Universal types (used across industries)
  {
    type: 'user_id',
    patterns: [/user.*id/i, /player.*id/i, /uid/i, /account.*id/i],
    industry: 'universal',
    category: 'identifier',
    description: 'Unique user identifier',
  },
  {
    type: 'session_id',
    patterns: [/session.*id/i, /sid/i],
    industry: 'universal',
    category: 'identifier',
    description: 'Session identifier',
  },
  {
    type: 'timestamp',
    patterns: [/timestamp/i, /created.*at/i, /event.*time/i, /date/i],
    industry: 'universal',
    category: 'timestamp',
    description: 'Event timestamp',
  },
  {
    type: 'revenue',
    patterns: [/revenue/i, /amount/i, /price/i, /spend/i, /purchase.*value/i],
    industry: 'universal',
    category: 'revenue',
    description: 'Revenue or monetary value',
  },
  {
    type: 'country',
    patterns: [/country/i, /region/i, /geo/i, /location/i],
    industry: 'universal',
    category: 'demographic',
    description: 'Geographic location',
  },
  {
    type: 'platform',
    patterns: [/platform/i, /os/i, /device.*type/i],
    industry: 'universal',
    category: 'demographic',
    description: 'Platform or device type',
  },
  {
    type: 'event_type',
    patterns: [/event.*type/i, /event.*name/i, /action/i],
    industry: 'universal',
    category: 'identifier',
    description: 'Type of event',
  },

  // Gaming-specific types
  {
    type: 'level',
    patterns: [/^level$/i, /^lvl$/i, /player.*level/i, /current.*level/i],
    industry: 'gaming',
    category: 'progression',
    description: 'Player or game level',
  },
  {
    type: 'score',
    patterns: [/^score$/i, /points/i, /high.*score/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Player score',
  },
  {
    type: 'xp',
    patterns: [/^xp$/i, /experience/i, /exp.*points/i],
    industry: 'gaming',
    category: 'progression',
    description: 'Experience points',
  },
  {
    type: 'currency',
    patterns: [/^coins$/i, /^gems$/i, /^gold$/i, /currency/i, /^credits$/i],
    industry: 'gaming',
    category: 'revenue',
    description: 'In-game currency',
  },
  {
    type: 'session_duration',
    patterns: [/session.*duration/i, /play.*time/i, /time.*played/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Session duration',
  },

  // Puzzle game types
  {
    type: 'moves',
    patterns: [/moves/i, /attempts/i, /moves.*left/i, /turns/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Number of moves (puzzle games)',
  },
  {
    type: 'booster',
    patterns: [/booster/i, /power.*up/i, /item.*used/i, /bonus/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Booster or power-up usage',
  },
  {
    type: 'lives',
    patterns: [/lives/i, /hearts/i, /attempts.*left/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Lives remaining',
  },
  {
    type: 'stars',
    patterns: [/stars/i, /star.*rating/i, /completion.*stars/i],
    industry: 'gaming',
    category: 'progression',
    description: 'Star rating on level completion',
  },

  // Idle game types
  {
    type: 'prestige',
    patterns: [/prestige/i, /rebirth/i, /ascension/i, /reset/i],
    industry: 'gaming',
    category: 'progression',
    description: 'Prestige/rebirth count',
  },
  {
    type: 'offline_reward',
    patterns: [/offline.*reward/i, /idle.*earning/i, /afk/i],
    industry: 'gaming',
    category: 'revenue',
    description: 'Offline rewards earned',
  },
  {
    type: 'upgrade',
    patterns: [/upgrade/i, /enhancement/i, /level.*up/i],
    industry: 'gaming',
    category: 'progression',
    description: 'Upgrade or enhancement',
  },
  {
    type: 'automation',
    patterns: [/automation/i, /auto.*buy/i, /auto.*collect/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Automation features used',
  },

  // Battle Royale types
  {
    type: 'placement',
    patterns: [/placement/i, /position/i, /^rank$/i, /standing/i],
    industry: 'gaming',
    category: 'progression',
    description: 'Match placement/ranking',
  },
  {
    type: 'kills',
    patterns: [/kills/i, /eliminations/i, /frags/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Number of kills/eliminations',
  },
  {
    type: 'damage',
    patterns: [/damage/i, /dmg/i, /damage.*dealt/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Damage dealt',
  },
  {
    type: 'survival_time',
    patterns: [/survival.*time/i, /time.*alive/i, /match.*duration/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Survival time in match',
  },
  {
    type: 'weapon',
    patterns: [/weapon/i, /gun/i, /loadout/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Weapon used',
  },

  // Gacha RPG types
  {
    type: 'pull_type',
    patterns: [/pull.*type/i, /summon.*type/i, /gacha.*type/i],
    industry: 'gaming',
    category: 'revenue',
    description: 'Type of gacha pull',
  },
  {
    type: 'banner',
    patterns: [/banner/i, /event.*name/i, /summon.*event/i],
    industry: 'gaming',
    category: 'revenue',
    description: 'Banner/event name',
  },
  {
    type: 'pity_count',
    patterns: [/pity/i, /pity.*count/i, /guaranteed/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Pity counter',
  },
  {
    type: 'rarity',
    patterns: [/rarity/i, /tier/i, /stars/i, /grade/i],
    industry: 'gaming',
    category: 'progression',
    description: 'Item/character rarity',
  },
  {
    type: 'character_id',
    patterns: [/character.*id/i, /hero.*id/i, /unit.*id/i],
    industry: 'gaming',
    category: 'identifier',
    description: 'Character/hero identifier',
  },

  // Match-3 + Meta types (shared with puzzle)
  {
    type: 'decoration',
    patterns: [/decoration/i, /furniture/i, /item.*placed/i],
    industry: 'gaming',
    category: 'engagement',
    description: 'Decoration/furniture item',
  },
  {
    type: 'story_chapter',
    patterns: [/chapter/i, /story/i, /episode/i],
    industry: 'gaming',
    category: 'progression',
    description: 'Story chapter/episode',
  },
];
```

**Acceptance Criteria:**
- [ ] All 40+ semantic types extracted
- [ ] Each type has patterns, industry, category, description
- [ ] Types are categorized correctly (universal vs gaming)

---

### Task 2.3: Extract Detection Indicators from GameTypeDetector

**Source File:** `src/ai/GameTypeDetector.ts` (lines 16-50)

**Target File:** `src/industry/packs/gaming/indicators.ts`

```typescript
import { DetectionIndicator, IndustrySubCategory } from '../../types';

export const gamingIndicators: Map<IndustrySubCategory, DetectionIndicator[]> = new Map([
  ['puzzle', [
    { signals: ['moves', 'booster'], weight: 5 },
    { signals: ['level', 'score'], weight: 3 },
    { signals: ['lives'], weight: 3 },
    { signals: ['stars'], weight: 2 },
    { signals: ['session_id'], weight: 1 },
  ]],

  ['idle', [
    { signals: ['prestige'], weight: 5 },
    { signals: ['offline_reward'], weight: 5 },
    { signals: ['upgrade'], weight: 4 },
    { signals: ['automation'], weight: 3 },
    { signals: ['currency'], weight: 3 },
    { signals: ['level'], weight: 1 },
  ]],

  ['battle_royale', [
    { signals: ['placement', 'kills'], weight: 5 },
    { signals: ['damage', 'survival_time'], weight: 4 },
    { signals: ['weapon'], weight: 3 },
    { signals: ['rank'], weight: 3 },
    { signals: ['user_id'], weight: 1 },
  ]],

  ['match3_meta', [
    { signals: ['moves', 'booster'], weight: 5 },
    { signals: ['decoration'], weight: 4 },
    { signals: ['story_chapter'], weight: 4 },
    { signals: ['level', 'score'], weight: 3 },
    { signals: ['item_id', 'category'], weight: 2 },
    { signals: ['revenue', 'price'], weight: 1 },
  ]],

  ['gacha_rpg', [
    { signals: ['pull_type', 'banner'], weight: 5 },
    { signals: ['rarity'], weight: 5 },
    { signals: ['pity_count'], weight: 4 },
    { signals: ['character_id'], weight: 3 },
    { signals: ['currency'], weight: 3 },
    { signals: ['level', 'xp'], weight: 2 },
    { signals: ['rank'], weight: 1 },
  ]],

  ['custom', [
    { signals: ['user_id', 'session_id'], weight: 2 },
    { signals: ['timestamp'], weight: 1 },
  ]],
]);
```

**Acceptance Criteria:**
- [ ] All 6 game types have indicators
- [ ] Weights match original GameTypeDetector logic
- [ ] Signal references match semantic type names

---

### Task 2.4: Extract Metrics from DataProviders

**Source File:** `src/lib/dataProviders.ts` (entire file)

**Target File:** `src/industry/packs/gaming/metrics.ts`

```typescript
import { MetricDefinition } from '../../types';

export const gamingMetrics: MetricDefinition[] = [
  // Universal Gaming Metrics
  {
    id: 'dau',
    name: 'DAU',
    description: 'Daily Active Users',
    formula: 'COUNT(DISTINCT user_id)',
    requiredSemantics: ['user_id', 'timestamp'],
    category: 'kpi',
    formatting: { type: 'number', decimals: 0 },
    benchmarks: { good: 10000, excellent: 50000 },
  },
  {
    id: 'mau',
    name: 'MAU',
    description: 'Monthly Active Users',
    formula: 'COUNT(DISTINCT user_id) WHERE timestamp IN last_30_days',
    requiredSemantics: ['user_id', 'timestamp'],
    category: 'kpi',
    formatting: { type: 'number', decimals: 0 },
  },
  {
    id: 'dau_mau',
    name: 'DAU/MAU',
    description: 'Stickiness Ratio',
    formula: 'dau / mau',
    requiredSemantics: ['user_id', 'timestamp'],
    category: 'derived',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { poor: 0.1, average: 0.15, good: 0.2, excellent: 0.25 },
  },
  {
    id: 'retention_d1',
    name: 'D1 Retention',
    description: 'Day 1 Retention Rate',
    formula: 'retention_calculation(1)',
    requiredSemantics: ['user_id', 'timestamp'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { poor: 0.25, average: 0.35, good: 0.40, excellent: 0.50 },
  },
  {
    id: 'retention_d7',
    name: 'D7 Retention',
    description: 'Day 7 Retention Rate',
    formula: 'retention_calculation(7)',
    requiredSemantics: ['user_id', 'timestamp'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { poor: 0.10, average: 0.15, good: 0.20, excellent: 0.30 },
  },
  {
    id: 'retention_d30',
    name: 'D30 Retention',
    description: 'Day 30 Retention Rate',
    formula: 'retention_calculation(30)',
    requiredSemantics: ['user_id', 'timestamp'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { poor: 0.03, average: 0.05, good: 0.08, excellent: 0.12 },
  },
  {
    id: 'arpu',
    name: 'ARPU',
    description: 'Average Revenue Per User',
    formula: 'SUM(revenue) / COUNT(DISTINCT user_id)',
    requiredSemantics: ['revenue', 'user_id'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 2, prefix: '$' },
  },
  {
    id: 'arpdau',
    name: 'ARPDAU',
    description: 'Average Revenue Per Daily Active User',
    formula: 'daily_revenue / dau',
    requiredSemantics: ['revenue', 'user_id', 'timestamp'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 2, prefix: '$' },
  },
  {
    id: 'arppu',
    name: 'ARPPU',
    description: 'Average Revenue Per Paying User',
    formula: 'SUM(revenue) / COUNT(DISTINCT paying_user_id)',
    requiredSemantics: ['revenue', 'user_id'],
    category: 'derived',
    formatting: { type: 'currency', decimals: 2, prefix: '$' },
  },
  {
    id: 'paying_users',
    name: 'Paying Users %',
    description: 'Percentage of users who made a purchase',
    formula: 'COUNT(DISTINCT paying_user_id) / COUNT(DISTINCT user_id)',
    requiredSemantics: ['revenue', 'user_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { poor: 0.01, average: 0.02, good: 0.05, excellent: 0.10 },
  },
  {
    id: 'avg_session_duration',
    name: 'Avg Session Duration',
    description: 'Average time per session',
    formula: 'AVG(session_duration)',
    requiredSemantics: ['session_duration'],
    category: 'kpi',
    formatting: { type: 'duration', decimals: 0 },
    benchmarks: { poor: 180, average: 300, good: 600, excellent: 900 },
  },
  {
    id: 'sessions_per_day',
    name: 'Sessions/Day',
    description: 'Average sessions per user per day',
    formula: 'COUNT(session_id) / COUNT(DISTINCT user_id)',
    requiredSemantics: ['session_id', 'user_id'],
    category: 'derived',
    formatting: { type: 'number', decimals: 1 },
  },

  // Puzzle-specific metrics
  {
    id: 'level_completion_rate',
    name: 'Level Completion',
    description: 'Percentage of levels completed',
    formula: 'completed_levels / attempted_levels',
    requiredSemantics: ['level', 'user_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
  },
  {
    id: 'booster_usage_rate',
    name: 'Booster Usage',
    description: 'Percentage of sessions using boosters',
    formula: 'sessions_with_boosters / total_sessions',
    requiredSemantics: ['booster', 'session_id'],
    category: 'derived',
    formatting: { type: 'percentage', decimals: 1 },
  },
  {
    id: 'avg_moves_per_level',
    name: 'Avg Moves/Level',
    description: 'Average moves used per level',
    formula: 'SUM(moves) / COUNT(level)',
    requiredSemantics: ['moves', 'level'],
    category: 'derived',
    formatting: { type: 'number', decimals: 1 },
  },

  // Idle-specific metrics
  {
    id: 'prestige_rate',
    name: 'Prestige Rate',
    description: 'Users who have prestiged at least once',
    formula: 'COUNT(DISTINCT user_id WHERE prestige > 0) / COUNT(DISTINCT user_id)',
    requiredSemantics: ['prestige', 'user_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
  },
  {
    id: 'avg_prestige_level',
    name: 'Avg Prestige Level',
    description: 'Average prestige level of active users',
    formula: 'AVG(prestige)',
    requiredSemantics: ['prestige'],
    category: 'derived',
    formatting: { type: 'number', decimals: 1 },
  },
  {
    id: 'offline_ratio',
    name: 'Offline/Online Ratio',
    description: 'Ratio of offline to online earnings',
    formula: 'SUM(offline_reward) / SUM(online_reward)',
    requiredSemantics: ['offline_reward'],
    category: 'derived',
    formatting: { type: 'percentage', decimals: 1 },
  },

  // Battle Royale-specific metrics
  {
    id: 'avg_placement',
    name: 'Avg Placement',
    description: 'Average match placement',
    formula: 'AVG(placement)',
    requiredSemantics: ['placement'],
    category: 'kpi',
    formatting: { type: 'number', decimals: 1 },
  },
  {
    id: 'kd_ratio',
    name: 'K/D Ratio',
    description: 'Average kills per death',
    formula: 'SUM(kills) / SUM(deaths)',
    requiredSemantics: ['kills'],
    category: 'derived',
    formatting: { type: 'number', decimals: 2 },
  },
  {
    id: 'win_rate',
    name: 'Win Rate',
    description: 'Percentage of matches won (1st place)',
    formula: 'COUNT(placement = 1) / COUNT(*)',
    requiredSemantics: ['placement'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
  },
  {
    id: 'avg_survival_time',
    name: 'Avg Survival Time',
    description: 'Average time survived per match',
    formula: 'AVG(survival_time)',
    requiredSemantics: ['survival_time'],
    category: 'derived',
    formatting: { type: 'duration', decimals: 0 },
  },

  // Gacha-specific metrics
  {
    id: 'pulls_per_user',
    name: 'Pulls/User',
    description: 'Average gacha pulls per user',
    formula: 'COUNT(pull_type) / COUNT(DISTINCT user_id)',
    requiredSemantics: ['pull_type', 'user_id'],
    category: 'derived',
    formatting: { type: 'number', decimals: 1 },
  },
  {
    id: 'ssr_rate',
    name: 'SSR Rate',
    description: 'Rate of highest rarity pulls',
    formula: 'COUNT(rarity = SSR) / COUNT(pull_type)',
    requiredSemantics: ['rarity', 'pull_type'],
    category: 'derived',
    formatting: { type: 'percentage', decimals: 2 },
  },
  {
    id: 'pity_conversion',
    name: 'Pity Conversion',
    description: 'Users hitting pity that continue pulling',
    formula: 'pity_continuation_rate',
    requiredSemantics: ['pity_count', 'user_id'],
    category: 'derived',
    formatting: { type: 'percentage', decimals: 1 },
  },
];
```

**Acceptance Criteria:**
- [ ] All gaming metrics extracted
- [ ] Universal and game-type-specific metrics separated
- [ ] Formulas match original calculations
- [ ] Benchmarks included where available

---

### Task 2.5: Extract Funnel Templates from FunnelDetector

**Source File:** `src/ai/FunnelDetector.ts`

**Target File:** `src/industry/packs/gaming/funnels.ts`

```typescript
import { FunnelTemplate } from '../../types';

export const gamingFunnels: FunnelTemplate[] = [
  // Universal gaming funnels
  {
    id: 'new_user_journey',
    name: 'New User Journey',
    description: 'Track new users from install to engaged player',
    type: 'onboarding',
    steps: [
      { name: 'Install', eventMatch: ['install', 'first_open', 'app_open'] },
      { name: 'Tutorial Start', eventMatch: ['tutorial_start', 'onboarding_start'] },
      { name: 'Tutorial Complete', eventMatch: ['tutorial_complete', 'onboarding_complete'] },
      { name: 'First Session', eventMatch: ['session_start', 'game_start'] },
      { name: 'Day 1 Return', semanticType: 'timestamp' },
    ],
  },
  {
    id: 'purchase_funnel',
    name: 'Purchase Funnel',
    description: 'Track path to first purchase',
    type: 'conversion',
    steps: [
      { name: 'Session Start', eventMatch: ['session_start'] },
      { name: 'Store Visit', eventMatch: ['store_view', 'shop_open', 'iap_view'] },
      { name: 'Item Selected', eventMatch: ['item_select', 'product_view'] },
      { name: 'Purchase Started', eventMatch: ['checkout_start', 'purchase_start'] },
      { name: 'Purchase Complete', eventMatch: ['purchase', 'iap_complete', 'transaction'] },
    ],
  },

  // Puzzle-specific funnels
  {
    id: 'level_progression',
    name: 'Level Progression',
    description: 'Track player progression through levels',
    type: 'progression',
    industrySubCategories: ['puzzle', 'match3_meta'],
    steps: [
      { name: 'Level 1', condition: 'level >= 1' },
      { name: 'Level 5', condition: 'level >= 5' },
      { name: 'Level 10', condition: 'level >= 10' },
      { name: 'Level 25', condition: 'level >= 25' },
      { name: 'Level 50', condition: 'level >= 50' },
      { name: 'Level 100', condition: 'level >= 100' },
    ],
  },
  {
    id: 'booster_conversion',
    name: 'Booster Conversion',
    description: 'Track free-to-paid booster usage',
    type: 'conversion',
    industrySubCategories: ['puzzle', 'match3_meta'],
    steps: [
      { name: 'Free Booster Used', eventMatch: ['free_booster', 'bonus_used'] },
      { name: 'Booster Depleted', eventMatch: ['no_boosters', 'booster_empty'] },
      { name: 'Store Viewed', eventMatch: ['store_view', 'booster_shop'] },
      { name: 'Booster Purchased', eventMatch: ['booster_purchase', 'iap_booster'] },
    ],
  },

  // Idle-specific funnels
  {
    id: 'prestige_funnel',
    name: 'Prestige Funnel',
    description: 'Track prestige/rebirth progression',
    type: 'progression',
    industrySubCategories: ['idle'],
    steps: [
      { name: 'First Max Level', eventMatch: ['max_level', 'level_cap'] },
      { name: 'Prestige Unlocked', eventMatch: ['prestige_available', 'rebirth_unlocked'] },
      { name: 'First Prestige', eventMatch: ['prestige_1', 'first_rebirth'] },
      { name: 'Prestige 5', condition: 'prestige >= 5' },
      { name: 'Prestige 10', condition: 'prestige >= 10' },
    ],
  },
  {
    id: 'automation_unlock',
    name: 'Automation Unlock',
    description: 'Track automation feature adoption',
    type: 'progression',
    industrySubCategories: ['idle'],
    steps: [
      { name: 'Manual Play', eventMatch: ['first_click', 'manual_collect'] },
      { name: 'Auto Unlock Available', eventMatch: ['auto_available'] },
      { name: 'First Auto Purchased', eventMatch: ['auto_purchase', 'automation_buy'] },
      { name: 'Full Automation', eventMatch: ['all_auto', 'max_automation'] },
    ],
  },

  // Battle Royale-specific funnels
  {
    id: 'rank_progression',
    name: 'Rank Progression',
    description: 'Track competitive rank advancement',
    type: 'progression',
    industrySubCategories: ['battle_royale'],
    steps: [
      { name: 'Bronze', condition: 'rank = bronze' },
      { name: 'Silver', condition: 'rank = silver' },
      { name: 'Gold', condition: 'rank = gold' },
      { name: 'Platinum', condition: 'rank = platinum' },
      { name: 'Diamond', condition: 'rank = diamond' },
    ],
  },
  {
    id: 'match_engagement',
    name: 'Match Engagement',
    description: 'Track in-match engagement milestones',
    type: 'progression',
    industrySubCategories: ['battle_royale'],
    steps: [
      { name: 'Match Started', eventMatch: ['match_start', 'game_start'] },
      { name: 'First Engagement', eventMatch: ['first_kill', 'first_damage'] },
      { name: 'Top 50%', condition: 'placement <= 50' },
      { name: 'Top 10', condition: 'placement <= 10' },
      { name: 'Victory', condition: 'placement = 1' },
    ],
  },

  // Gacha-specific funnels
  {
    id: 'banner_conversion',
    name: 'Banner Conversion',
    description: 'Track banner engagement to pull',
    type: 'conversion',
    industrySubCategories: ['gacha_rpg'],
    steps: [
      { name: 'Banner Viewed', eventMatch: ['banner_view', 'summon_view'] },
      { name: 'Free Pull Used', eventMatch: ['free_pull', 'daily_summon'] },
      { name: 'Currency Used', eventMatch: ['paid_pull', 'gem_summon'] },
      { name: 'Multi-Pull', eventMatch: ['multi_pull', 'ten_pull'] },
      { name: 'Whale Pull', eventMatch: ['whale_pull'], condition: 'pulls_session >= 100' },
    ],
  },
  {
    id: 'character_collection',
    name: 'Character Collection',
    description: 'Track character roster building',
    type: 'progression',
    industrySubCategories: ['gacha_rpg'],
    steps: [
      { name: 'First Character', condition: 'unique_characters >= 1' },
      { name: '5 Characters', condition: 'unique_characters >= 5' },
      { name: '10 Characters', condition: 'unique_characters >= 10' },
      { name: '25 Characters', condition: 'unique_characters >= 25' },
      { name: 'Collector', condition: 'unique_characters >= 50' },
    ],
  },

  // Match-3 + Meta specific funnels
  {
    id: 'story_progression',
    name: 'Story Progression',
    description: 'Track meta-game story progress',
    type: 'progression',
    industrySubCategories: ['match3_meta'],
    steps: [
      { name: 'Chapter 1', condition: 'chapter >= 1' },
      { name: 'Chapter 5', condition: 'chapter >= 5' },
      { name: 'Chapter 10', condition: 'chapter >= 10' },
      { name: 'Chapter 20', condition: 'chapter >= 20' },
    ],
  },
  {
    id: 'decoration_engagement',
    name: 'Decoration Engagement',
    description: 'Track decoration/customization features',
    type: 'conversion',
    industrySubCategories: ['match3_meta'],
    steps: [
      { name: 'First Decoration', eventMatch: ['first_decor', 'decoration_placed'] },
      { name: 'Room Complete', eventMatch: ['room_complete', 'area_finished'] },
      { name: 'Premium Decor Viewed', eventMatch: ['premium_decor_view'] },
      { name: 'Premium Purchased', eventMatch: ['premium_decor_buy'] },
    ],
  },
];
```

**Acceptance Criteria:**
- [ ] All funnel templates extracted
- [ ] Funnels tagged with appropriate sub-categories
- [ ] Step definitions are flexible (eventMatch, condition, semanticType)

---

### Task 2.6: Extract Chart Configurations

**Source File:** `src/lib/gamePriorities.ts`

**Target File:** `src/industry/packs/gaming/charts.ts`

```typescript
import { ChartConfiguration, ChartTitleConfig, IndustrySubCategory } from '../../types';

export const gamingChartConfigs: ChartConfiguration[] = [
  {
    id: 'retention_curve',
    type: 'line',
    name: 'Retention Curve',
    subtitle: 'Day-over-day retention rates',
    requiredSemantics: ['user_id', 'timestamp'],
    recommendedFor: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg'],
    priority: 10,
  },
  {
    id: 'level_funnel',
    type: 'funnel',
    name: 'Level Funnel',
    subtitle: 'Player progression through levels',
    requiredSemantics: ['level', 'user_id'],
    recommendedFor: ['puzzle', 'match3_meta'],
    priority: 9,
  },
  {
    id: 'revenue_timeline',
    type: 'area',
    name: 'Revenue Timeline',
    subtitle: 'Daily revenue trend',
    requiredSemantics: ['revenue', 'timestamp'],
    recommendedFor: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg'],
    priority: 8,
  },
  {
    id: 'session_pattern',
    type: 'heatmap',
    name: 'Session Pattern',
    subtitle: 'When users play',
    requiredSemantics: ['session_id', 'timestamp'],
    recommendedFor: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg'],
    priority: 6,
  },
  {
    id: 'spender_segments',
    type: 'pie',
    name: 'Spender Segments',
    subtitle: 'Revenue by player segment',
    requiredSemantics: ['revenue', 'user_id'],
    recommendedFor: ['puzzle', 'gacha_rpg'],
    priority: 7,
  },
  {
    id: 'difficulty_heatmap',
    type: 'heatmap',
    name: 'Difficulty Heatmap',
    subtitle: 'Level difficulty by attempts',
    requiredSemantics: ['level', 'moves'],
    recommendedFor: ['puzzle', 'match3_meta'],
    priority: 5,
  },
  {
    id: 'weapon_meta',
    type: 'bar',
    name: 'Weapon Meta',
    subtitle: 'Popular weapons and loadouts',
    requiredSemantics: ['weapon', 'kills'],
    recommendedFor: ['battle_royale'],
    priority: 8,
  },
  {
    id: 'prestige_funnel',
    type: 'funnel',
    name: 'Prestige Funnel',
    subtitle: 'Prestige progression',
    requiredSemantics: ['prestige', 'user_id'],
    recommendedFor: ['idle'],
    priority: 9,
  },
  {
    id: 'banner_performance',
    type: 'bar',
    name: 'Banner Performance',
    subtitle: 'Gacha banner revenue comparison',
    requiredSemantics: ['banner', 'revenue'],
    recommendedFor: ['gacha_rpg'],
    priority: 9,
  },
  {
    id: 'rarity_distribution',
    type: 'pie',
    name: 'Rarity Distribution',
    subtitle: 'Pull outcomes by rarity',
    requiredSemantics: ['rarity', 'pull_type'],
    recommendedFor: ['gacha_rpg'],
    priority: 7,
  },
];

export const gamingChartTitles: Map<IndustrySubCategory, Record<string, ChartTitleConfig>> = new Map([
  ['puzzle', {
    retention_curve: { title: 'Player Retention', subtitle: 'Day-over-day return rate' },
    level_funnel: { title: 'Level Progression', subtitle: 'Players reaching each level milestone' },
    revenue_timeline: { title: 'IAP Revenue', subtitle: 'Daily in-app purchase trends' },
    spender_segments: { title: 'Spender Tiers', subtitle: 'Minnow / Dolphin / Whale distribution' },
    difficulty_heatmap: { title: 'Level Difficulty', subtitle: 'Attempts & failures by level' },
  }],
  ['idle', {
    retention_curve: { title: 'Player Retention', subtitle: 'Day-over-day return rate' },
    prestige_funnel: { title: 'Prestige Journey', subtitle: 'Players reaching each prestige' },
    revenue_timeline: { title: 'Revenue Trend', subtitle: 'Daily earnings breakdown' },
  }],
  ['battle_royale', {
    retention_curve: { title: 'Player Retention', subtitle: 'Day-over-day return rate' },
    weapon_meta: { title: 'Weapon Meta', subtitle: 'Most effective loadouts' },
    revenue_timeline: { title: 'Revenue Trend', subtitle: 'Battle pass & cosmetic sales' },
  }],
  ['match3_meta', {
    retention_curve: { title: 'Player Retention', subtitle: 'Day-over-day return rate' },
    level_funnel: { title: 'Story Progress', subtitle: 'Chapter completion milestones' },
    revenue_timeline: { title: 'Revenue Trend', subtitle: 'IAP and decoration sales' },
  }],
  ['gacha_rpg', {
    retention_curve: { title: 'Player Retention', subtitle: 'Day-over-day return rate' },
    banner_performance: { title: 'Banner Revenue', subtitle: 'Summon event performance' },
    rarity_distribution: { title: 'Pull Outcomes', subtitle: 'Rarity distribution from gacha' },
    revenue_timeline: { title: 'Revenue Trend', subtitle: 'Daily gacha and pack sales' },
  }],
]);
```

**Acceptance Criteria:**
- [ ] All chart configurations extracted
- [ ] Chart titles customized per sub-category
- [ ] Priority ordering preserved

---

### Task 2.7: Extract Insight Templates

**Source File:** `src/ai/InsightGenerator.ts`

**Target File:** `src/industry/packs/gaming/insights.ts`

```typescript
import { InsightTemplate, InsightCategory } from '../../types';

export const gamingInsights: InsightTemplate[] = [
  // Retention insights
  {
    id: 'low_d1_retention',
    requires: ['retention_d1'],
    category: 'retention',
    priority: 9,
    condition: (metrics) => metrics.retention_d1 < 0.35,
    generate: (metrics) => ({
      title: 'Low Day 1 Retention',
      description: `D1 retention is ${(metrics.retention_d1 * 100).toFixed(1)}%, below the 35% benchmark. Consider improving the tutorial experience and first session value.`,
      severity: 'warning',
      action: 'Review onboarding flow and early-game content',
    }),
  },
  {
    id: 'strong_d1_retention',
    requires: ['retention_d1'],
    category: 'retention',
    priority: 5,
    condition: (metrics) => metrics.retention_d1 >= 0.50,
    generate: (metrics) => ({
      title: 'Excellent D1 Retention',
      description: `D1 retention is ${(metrics.retention_d1 * 100).toFixed(1)}%, well above the 40% good benchmark. Your early game is engaging users effectively.`,
      severity: 'success',
    }),
  },
  {
    id: 'd7_drop',
    requires: ['retention_d1', 'retention_d7'],
    category: 'retention',
    priority: 8,
    condition: (metrics) =>
      metrics.retention_d1 > 0 &&
      (metrics.retention_d7 / metrics.retention_d1) < 0.4,
    generate: (metrics) => ({
      title: 'Sharp D1→D7 Retention Drop',
      description: `Only ${((metrics.retention_d7 / metrics.retention_d1) * 100).toFixed(0)}% of D1 users return on D7. Consider adding mid-game content or engagement hooks.`,
      severity: 'warning',
      action: 'Add daily rewards, events, or social features',
    }),
  },

  // Monetization insights
  {
    id: 'low_paying_users',
    requires: ['paying_users'],
    category: 'monetization',
    priority: 7,
    condition: (metrics) => metrics.paying_users < 0.02,
    generate: (metrics) => ({
      title: 'Low Conversion to Paying',
      description: `Only ${(metrics.paying_users * 100).toFixed(1)}% of users have made a purchase. Consider improving store visibility or introducing starter packs.`,
      severity: 'warning',
      action: 'Test promotional offers for new users',
    }),
  },
  {
    id: 'whale_concentration',
    requires: ['whale_revenue_share'],
    category: 'monetization',
    priority: 8,
    condition: (metrics) => metrics.whale_revenue_share > 0.70,
    generate: (metrics) => ({
      title: 'High Revenue Concentration',
      description: `${(metrics.whale_revenue_share * 100).toFixed(0)}% of revenue comes from top 1% of spenders. This creates risk if whales churn.`,
      severity: 'warning',
      action: 'Develop mid-tier monetization options',
    }),
  },

  // Engagement insights
  {
    id: 'short_sessions',
    requires: ['avg_session_duration'],
    category: 'engagement',
    priority: 6,
    condition: (metrics) => metrics.avg_session_duration < 180, // 3 minutes
    generate: (metrics) => ({
      title: 'Short Session Duration',
      description: `Average session is ${Math.floor(metrics.avg_session_duration / 60)}m ${metrics.avg_session_duration % 60}s. Consider adding more engaging content loops.`,
      severity: 'info',
      action: 'Add session-extending mechanics',
    }),
  },
  {
    id: 'high_stickiness',
    requires: ['dau_mau'],
    category: 'engagement',
    priority: 5,
    condition: (metrics) => metrics.dau_mau >= 0.25,
    generate: (metrics) => ({
      title: 'High DAU/MAU Stickiness',
      description: `DAU/MAU ratio of ${(metrics.dau_mau * 100).toFixed(0)}% indicates strong daily habit formation.`,
      severity: 'success',
    }),
  },

  // Progression insights (puzzle-specific)
  {
    id: 'level_wall',
    requires: ['level_funnel_dropoff'],
    category: 'progression',
    priority: 8,
    condition: (metrics) => metrics.level_funnel_dropoff > 0.30,
    generate: (metrics) => ({
      title: 'Hard Level Wall Detected',
      description: `${(metrics.level_funnel_dropoff * 100).toFixed(0)}% of players quit at a specific level range. Review difficulty curve.`,
      severity: 'warning',
      action: 'Analyze and rebalance difficult levels',
    }),
  },

  // Battle Royale insights
  {
    id: 'skill_gap',
    requires: ['skill_gap_score'],
    category: 'engagement',
    priority: 7,
    condition: (metrics) => metrics.skill_gap_score > 0.8,
    generate: (metrics) => ({
      title: 'Large Skill Gap',
      description: 'New players are frequently matched against veterans, causing frustration and churn.',
      severity: 'warning',
      action: 'Implement skill-based matchmaking',
    }),
  },

  // Gacha insights
  {
    id: 'pity_frustration',
    requires: ['pity_hit_rate'],
    category: 'monetization',
    priority: 7,
    condition: (metrics) => metrics.pity_hit_rate > 0.40,
    generate: (metrics) => ({
      title: 'High Pity Threshold Hits',
      description: `${(metrics.pity_hit_rate * 100).toFixed(0)}% of pulls reach pity. Consider adjusting base rates.`,
      severity: 'info',
      action: 'Review gacha probability distribution',
    }),
  },
];
```

**Acceptance Criteria:**
- [ ] All insight templates extracted
- [ ] Conditions are testable functions
- [ ] Insights categorized appropriately

---

### Task 2.8: Create Terminology Map

**Target File:** `src/industry/packs/gaming/terminology.ts`

```typescript
import { TerminologyMap } from '../../types';

export const gamingTerminology: TerminologyMap = {
  // Core terms
  user: 'player',
  session: 'session',
  conversion: 'purchase',
  retention: 'retention',
  revenue: 'revenue',
  churn: 'churn',

  // Gaming-specific
  level: 'level',
  score: 'score',
  achievement: 'achievement',
  currency: 'currency',
  item: 'item',
  upgrade: 'upgrade',

  // Action verbs
  signup: 'first open',
  purchase: 'IAP',
  complete: 'clear',
  fail: 'game over',
};
```

**Acceptance Criteria:**
- [ ] All gaming terminology defined
- [ ] Can be used for UI label replacement

---

### Task 2.9: Create Theme Configuration

**Target File:** `src/industry/packs/gaming/theme.ts`

```typescript
import { IndustryTheme } from '../../types';

export const gamingTheme: IndustryTheme = {
  primaryColor: '#8b5cf6',      // Purple
  accentColor: '#6366f1',       // Indigo
  chartColors: [
    '#8b5cf6',  // chart-purple
    '#6366f1',  // chart-indigo
    '#ec4899',  // chart-pink
    '#22d3ee',  // chart-cyan
    '#22c55e',  // chart-green
    '#f97316',  // chart-orange
    '#f43f5e',  // chart-rose
    '#a855f7',  // chart-violet
  ],
  icon: '🎮',
};
```

**Acceptance Criteria:**
- [ ] Theme colors match existing Tailwind config
- [ ] Icon represents gaming

---

### Task 2.10: Create Tips Configuration

**Target File:** `src/industry/packs/gaming/tips.ts`

```typescript
import { IndustrySubCategory } from '../../types';

export const gamingTips: Map<IndustrySubCategory, string[]> = new Map([
  ['puzzle', [
    'Watch for level completion drop-offs to identify difficulty spikes',
    'Booster purchase conversion is key to puzzle game monetization',
    'Track lives usage patterns to optimize energy systems',
    'Level 10-15 is often the first major churn point',
  ]],
  ['idle', [
    'Prestige timing is critical for long-term retention',
    'Balance offline vs online rewards carefully',
    'Automation unlocks should feel rewarding but not mandatory',
    'Track time between prestiges to measure pacing',
  ]],
  ['battle_royale', [
    'Skill-based matchmaking impacts retention significantly',
    'Battle pass completion rates indicate engagement health',
    'Monitor weapon balance through kill/pick rate ratios',
    'Track new player survival time to assess accessibility',
  ]],
  ['match3_meta', [
    'Story progression is as important as puzzle completion',
    'Decoration engagement correlates with long-term retention',
    'Lives and boosters need balanced economies',
    'Events drive both engagement and monetization',
  ]],
  ['gacha_rpg', [
    'Banner timing and character appeal drive revenue spikes',
    'Monitor pity counter distribution for frustration signals',
    'Character usage diversity indicates meta health',
    'Limited-time events are critical for reactivation',
  ]],
]);
```

**Acceptance Criteria:**
- [ ] Tips provide actionable guidance
- [ ] Tips are specific to each game type

---

### Task 2.11: Assemble Gaming Pack

**Target File:** `src/industry/packs/gaming/index.ts`

```typescript
import { IndustryPack } from '../../types';
import { gamingSemanticTypes } from './semanticTypes';
import { gamingIndicators } from './indicators';
import { gamingMetrics } from './metrics';
import { gamingFunnels } from './funnels';
import { gamingChartConfigs, gamingChartTitles } from './charts';
import { gamingInsights } from './insights';
import { gamingTerminology } from './terminology';
import { gamingTheme } from './theme';
import { gamingTips } from './tips';

export const gamingPack: IndustryPack = {
  id: 'gaming',
  name: 'Gaming Analytics',
  description: 'Analytics for mobile games, PC games, and gaming platforms',
  version: '1.0.0',

  subCategories: [
    { id: 'puzzle', name: 'Puzzle Game', description: 'Match-3, puzzle solving, level-based games', icon: '🧩' },
    { id: 'idle', name: 'Idle / Clicker', description: 'Incremental, idle mining, factory games', icon: '⏰' },
    { id: 'battle_royale', name: 'Battle Royale', description: 'FPS, competitive shooters, survival', icon: '🔫' },
    { id: 'match3_meta', name: 'Match-3 + Meta', description: 'Match-3 with story/decoration layer', icon: '🍬' },
    { id: 'gacha_rpg', name: 'Gacha RPG', description: 'Hero collectors with gacha mechanics', icon: '⚔️' },
    { id: 'custom', name: 'Custom Game', description: 'Other game types', icon: '🎮' },
  ],

  semanticTypes: gamingSemanticTypes,
  indicators: gamingIndicators,
  metrics: gamingMetrics,
  funnelTemplates: gamingFunnels,
  chartConfigs: gamingChartConfigs,
  chartTitles: gamingChartTitles,
  insightTemplates: gamingInsights,
  tips: gamingTips,
  terminology: gamingTerminology,

  sidebarPriorities: new Map([
    ['puzzle', {
      'Overview': 1,
      'Funnels': 2,
      'Monetization': 3,
      'Health': 4,
      'Analytics': 5,
    }],
    ['idle', {
      'Overview': 1,
      'Monetization': 2,
      'Funnels': 3,
      'Health': 4,
      'Analytics': 5,
    }],
    ['battle_royale', {
      'Overview': 1,
      'Analytics': 2,
      'Health': 3,
      'Monetization': 4,
      'Funnels': 5,
    }],
    ['match3_meta', {
      'Overview': 1,
      'Funnels': 2,
      'Monetization': 3,
      'Analytics': 4,
      'Health': 5,
    }],
    ['gacha_rpg', {
      'Overview': 1,
      'Monetization': 2,
      'Analytics': 3,
      'Health': 4,
      'Funnels': 5,
    }],
  ]),

  theme: gamingTheme,
};

export default gamingPack;
```

**Acceptance Criteria:**
- [ ] Pack compiles without errors
- [ ] All sub-modules are integrated
- [ ] Pack can be registered with IndustryRegistry

---

### Task 2.12: Register Gaming Pack

**Update File:** `src/industry/packs/index.ts`

```typescript
import { IndustryPack } from '../types';

export async function loadBuiltInPacks(): Promise<IndustryPack[]> {
  const packs: IndustryPack[] = [];

  // Gaming pack (always included)
  const { gamingPack } = await import('./gaming');
  packs.push(gamingPack);

  return packs;
}

export function getAvailablePackIds(): string[] {
  return ['gaming', 'saas', 'ecommerce'];
}
```

**Acceptance Criteria:**
- [ ] Gaming pack loads on app startup
- [ ] Pack is available in registry

---

### Task 2.13: Create Backward Compatibility Layer

**File:** `src/lib/legacySupport.ts`

```typescript
import { ProductCategory, IndustryType, IndustrySubCategory } from '@/industry/types';
import { industryRegistry } from '@/industry';

// Legacy type alias
export type GameCategory =
  | 'puzzle'
  | 'idle'
  | 'battle_royale'
  | 'match3_meta'
  | 'gacha_rpg'
  | 'custom';

/**
 * Convert legacy GameCategory to ProductCategory
 */
export function legacyGameCategoryToProduct(category: GameCategory): ProductCategory {
  const pack = industryRegistry.get('gaming');
  const subCat = pack?.subCategories.find(s => s.id === category);

  return {
    industry: 'gaming',
    subCategory: category,
    displayName: subCat?.name ?? category,
    icon: subCat?.icon ?? '🎮',
  };
}

/**
 * Convert ProductCategory to legacy GameCategory
 * Only works when industry is gaming
 */
export function productToLegacyGameCategory(product: ProductCategory): GameCategory | null {
  if (product.industry !== 'gaming') {
    return null;
  }
  return product.subCategory as GameCategory;
}

/**
 * Check if a ProductCategory is gaming
 */
export function isGamingCategory(product: ProductCategory): boolean {
  return product.industry === 'gaming';
}

/**
 * Map old GameData.type to new ProductData format
 */
export function migrateGameDataType(type: GameCategory): {
  industry: IndustryType;
  subCategory: IndustrySubCategory;
} {
  return {
    industry: 'gaming',
    subCategory: type,
  };
}
```

**Acceptance Criteria:**
- [ ] Legacy types can be converted to new format
- [ ] New types can be converted back (for gaming only)
- [ ] Migration helpers work correctly

---

### Task 2.14: Write Integration Tests

**File:** `src/industry/packs/gaming/__tests__/gamingPack.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { gamingPack } from '../index';
import { industryRegistry, industryDetector } from '@/industry';
import { ColumnMeaning } from '@/ai/SchemaAnalyzer';

describe('Gaming Pack', () => {
  beforeAll(() => {
    industryRegistry.register(gamingPack);
  });

  describe('Pack Structure', () => {
    it('should have valid pack structure', () => {
      expect(gamingPack.id).toBe('gaming');
      expect(gamingPack.subCategories.length).toBeGreaterThan(0);
      expect(gamingPack.semanticTypes.length).toBeGreaterThan(30);
      expect(gamingPack.indicators.size).toBeGreaterThan(0);
    });

    it('should have metrics for each sub-category', () => {
      expect(gamingPack.metrics.length).toBeGreaterThan(10);
    });
  });

  describe('Detection', () => {
    it('should detect puzzle game from moves/booster signals', () => {
      const meanings: ColumnMeaning[] = [
        { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
        { column: 'moves', detectedType: 'number', semanticType: 'moves', confidence: 0.9 },
        { column: 'booster_used', detectedType: 'boolean', semanticType: 'booster', confidence: 0.8 },
        { column: 'level', detectedType: 'number', semanticType: 'level', confidence: 0.9 },
      ];

      const result = industryDetector.detect(meanings);
      expect(result.industry).toBe('gaming');
      expect(result.subCategory).toBe('puzzle');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect idle game from prestige signals', () => {
      const meanings: ColumnMeaning[] = [
        { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
        { column: 'prestige_level', detectedType: 'number', semanticType: 'prestige', confidence: 0.9 },
        { column: 'offline_earnings', detectedType: 'number', semanticType: 'offline_reward', confidence: 0.8 },
      ];

      const result = industryDetector.detect(meanings);
      expect(result.industry).toBe('gaming');
      expect(result.subCategory).toBe('idle');
    });

    it('should detect battle royale from kills/placement signals', () => {
      const meanings: ColumnMeaning[] = [
        { column: 'player_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
        { column: 'kills', detectedType: 'number', semanticType: 'kills', confidence: 0.9 },
        { column: 'placement', detectedType: 'number', semanticType: 'placement', confidence: 0.9 },
        { column: 'damage_dealt', detectedType: 'number', semanticType: 'damage', confidence: 0.8 },
      ];

      const result = industryDetector.detect(meanings);
      expect(result.industry).toBe('gaming');
      expect(result.subCategory).toBe('battle_royale');
    });

    it('should detect gacha from banner/rarity signals', () => {
      const meanings: ColumnMeaning[] = [
        { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
        { column: 'banner_name', detectedType: 'string', semanticType: 'banner', confidence: 0.9 },
        { column: 'pull_type', detectedType: 'string', semanticType: 'pull_type', confidence: 0.9 },
        { column: 'rarity', detectedType: 'string', semanticType: 'rarity', confidence: 0.9 },
      ];

      const result = industryDetector.detect(meanings);
      expect(result.industry).toBe('gaming');
      expect(result.subCategory).toBe('gacha_rpg');
    });
  });

  describe('Terminology', () => {
    it('should have gaming-specific terminology', () => {
      expect(gamingPack.terminology.user).toBe('player');
      expect(gamingPack.terminology.session).toBe('session');
    });
  });
});
```

**Acceptance Criteria:**
- [ ] All detection tests pass
- [ ] Pack structure tests pass
- [ ] Integration with registry works

---

## Dependencies

- Phase 1 complete (Foundation & Core Abstractions)

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/industry/packs/gaming/index.ts` | Main pack export |
| `src/industry/packs/gaming/semanticTypes.ts` | Semantic type definitions |
| `src/industry/packs/gaming/indicators.ts` | Detection indicators |
| `src/industry/packs/gaming/metrics.ts` | Metric definitions |
| `src/industry/packs/gaming/funnels.ts` | Funnel templates |
| `src/industry/packs/gaming/charts.ts` | Chart configurations |
| `src/industry/packs/gaming/insights.ts` | Insight templates |
| `src/industry/packs/gaming/terminology.ts` | Gaming vocabulary |
| `src/industry/packs/gaming/theme.ts` | Gaming theme |
| `src/industry/packs/gaming/tips.ts` | Gaming tips |
| `src/lib/legacySupport.ts` | Backward compatibility |

### Modified Files
| File | Changes |
|------|---------|
| `src/industry/packs/index.ts` | Load gaming pack |

---

## Acceptance Criteria (Phase Complete)

- [ ] All gaming-specific code extracted into pack format
- [ ] Gaming pack registered and functional
- [ ] Detection works for all 5 game types
- [ ] Metrics, funnels, charts all available through registry
- [ ] Backward compatibility layer works
- [ ] All tests pass
- [ ] No breaking changes to existing functionality

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Missing semantic types | Cross-reference with SchemaAnalyzer |
| Detection accuracy regression | Extensive testing with real data |
| Performance impact | Lazy loading of pack components |

---

## Next Phase

Phase 3 will create new industry packs (SaaS, E-commerce) using the same pattern established in this phase.
