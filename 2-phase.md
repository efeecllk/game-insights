# Phase 2: Games Page - Multi-Game Portfolio Management

## Objective

Transform the Games page from a basic game list into a comprehensive game portfolio management system that:
1. Shows clear data status for each game (has data / needs data / syncing)
2. Guides users to connect data sources per game
3. Enables comparison across games
4. Provides quick actions for common workflows
5. Helps users understand which games need attention

---

## Current State Analysis

### What Exists
- Game CRUD operations (create, edit, delete)
- Pin/unpin games to top
- Active/inactive toggle
- Basic stats (total games, pinned, active, platforms)
- Genre-based icon assignment
- Timezone and currency per game
- Store URLs (App Store, Play Store)

### What's Missing

| Missing Feature | User Pain Point |
|----------------|-----------------|
| No data status per game | Users don't know which games have analytics data |
| No quick "Add Data" action | Must navigate away to upload data for a game |
| No game health indicators | Can't see which games need attention at a glance |
| No data source connection per game | Games aren't linked to their data sources |
| No comparison view | Can't compare metrics across games |
| No onboarding for first game | New users don't know where to start |
| No sample/template games | Learning curve is steep |

---

## Task Breakdown

### Task 2.1: Add Data Status to Game Cards

**Purpose:** Show users which games have data at a glance

**File:** `src/pages/Games.tsx` (GameCard component)

**Data Status Types:**

```typescript
type GameDataStatus =
  | 'no_data'           // No uploads, no connections for this game
  | 'has_data'          // Data available, all good
  | 'data_stale'        // Data older than configured threshold
  | 'syncing'           // Currently fetching from integration
  | 'sync_error'        // Integration has errors
  | 'partial_data'      // Some data, but key columns missing
```

**Visual Indicators:**

```
Game Card with Status Indicators
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────┐                                                        │
│  │ 🧩  │  Puzzle Saga                     ● Connected          │
│  └─────┘  Puzzle • iOS                                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  📊 12,450 events  │  👥 2,341 users  │  📅 Last 7 days    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Data Source: Google Sheets (Auto-sync: 15 min)                 │
│  Last sync: 2 hours ago                                         │
│                                                                  │
│  [View Analytics]  [⚙️]  [...]                                   │
└─────────────────────────────────────────────────────────────────┘

Game Card WITHOUT Data
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────┐                                                        │
│  │ ⚔️  │  Battle Zone                     ○ No Data            │
│  └─────┘  Battle Royale • Cross-Platform                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ⚠️ No analytics data connected                              ││
│  │                                                              ││
│  │  [Upload CSV]  [Connect Data Source]                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [⚙️ Settings]  [...]                                            │
└─────────────────────────────────────────────────────────────────┘

Game Card with STALE Data
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────┐                                                        │
│  │ 🎰  │  Lucky Slots                     ⚠️ Stale Data        │
│  └─────┘  Casino • iOS, Android                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  📊 8,200 events  │  👥 1,205 users  │  ⚠️ 5 days old      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Data Source: Manual Upload                                     │
│  Last update: 5 days ago                                        │
│                                                                  │
│  [Upload New Data]  [View Analytics]  [⚙️]  [...]               │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
interface GameCardProps {
  game: Game;
  dataStatus: {
    status: GameDataStatus;
    eventCount?: number;
    userCount?: number;
    dateRange?: { start: Date; end: Date };
    dataSource?: {
      type: IntegrationType;
      name: string;
      syncStrategy: SyncStrategy;
      lastSync?: Date;
    };
  };
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

---

### Task 2.2: Create First Game Onboarding

**Purpose:** Guide new users to create and configure their first game

**File:** `src/components/games/FirstGameWizard.tsx`

**Show When:**
- No games exist in games store
- Or user explicitly clicked "Add First Game"

**Wizard Steps:**

```
Step 1: Basic Info
┌─────────────────────────────────────────────────────────────────┐
│  Step 1 of 4: Tell us about your game                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Game Name *                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ My Awesome Game                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  What type of game is it? *                                     │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │    🧩    │ │    ⏰    │ │    ⚔️    │ │    🍬    │           │
│  │  Puzzle  │ │   Idle   │ │ Battle   │ │ Match-3  │           │
│  │          │ │          │ │ Royale   │ │  Meta    │           │
│  │ Selected │ │          │ │          │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │    🎲    │ │    🎰    │ │    🏎️    │ │   🎯    │           │
│  │  Gacha   │ │  Casino  │ │  Racing  │ │  Other   │           │
│  │   RPG    │ │          │ │          │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│                                      [Cancel]  [Next: Platform] │
└─────────────────────────────────────────────────────────────────┘

Step 2: Platform & Settings
┌─────────────────────────────────────────────────────────────────┐
│  Step 2 of 4: Platform & Configuration                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Platform *                              Currency *              │
│  ┌────────────────────────┐             ┌──────────────────┐    │
│  │ iOS               ▾    │             │ USD ($)      ▾   │    │
│  └────────────────────────┘             └──────────────────┘    │
│                                                                  │
│  Timezone *                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ UTC-8 (Pacific Time)                                     ▾  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Store URLs (optional)                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🍎 App Store URL                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🤖 Play Store URL                                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│                                       [Back]  [Next: Data]      │
└─────────────────────────────────────────────────────────────────┘

Step 3: Connect Data
┌─────────────────────────────────────────────────────────────────┐
│  Step 3 of 4: How should we get your data?                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Choose how you'll provide analytics data:                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  📁 Upload a File                               Recommended ││
│  │                                                              ││
│  │  Upload a CSV or Excel file with your game events.          ││
│  │  Best for: Quick start, one-time analysis                   ││
│  │                                                              ││
│  │  [Select File...]                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🔌 Connect a Data Source                                    ││
│  │                                                              ││
│  │  Link to Google Sheets, Firebase, Supabase, etc.            ││
│  │  Best for: Automated updates, live data                     ││
│  │                                                              ││
│  │  [Browse Data Sources...]                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ⏭️ Skip for Now                                             ││
│  │                                                              ││
│  │  Set up data connection later from the game settings.       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│                                       [Back]  [Next: Review]    │
└─────────────────────────────────────────────────────────────────┘

Step 4: Review & Create
┌─────────────────────────────────────────────────────────────────┐
│  Step 4 of 4: Review & Create                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🧩  My Awesome Game                                         ││
│  │                                                              ││
│  │  Type: Puzzle                                                ││
│  │  Platform: iOS                                               ││
│  │  Currency: USD ($)                                           ││
│  │  Timezone: UTC-8 (Pacific Time)                              ││
│  │                                                              ││
│  │  Data Source: CSV Upload (pending)                          ││
│  │  File: game_events_jan2025.csv (45,231 rows)                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ✓ Game type detected: Puzzle (92% confidence)                  │
│  ✓ 12 columns mapped automatically                              │
│  ⚠️ 2 columns need manual mapping                                │
│                                                                  │
│  After creating:                                                 │
│  □ Take me to analytics dashboard                               │
│  □ Stay on Games page to add more games                         │
│                                                                  │
│                                       [Back]  [Create Game 🎉]  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Task 2.3: Game-Data Association System

**Purpose:** Link games to their data sources

**File:** `src/lib/gameDataAssociation.ts`

**Data Model:**

```typescript
interface GameDataAssociation {
  gameId: string;
  dataSourceType: 'upload' | 'integration';

  // For uploads
  uploadId?: string;          // Reference to gameData store

  // For integrations
  integrationId?: string;     // Reference to integrations store

  // Metadata
  lastSyncAt?: string;
  rowCount?: number;
  dateRange?: {
    start: string;
    end: string;
  };

  // Column mappings specific to this game
  columnMappings?: ColumnMapping[];
}
```

**Schema Update (db.ts):**

```typescript
// Add to games store or create new store
// Version 7
if (!db.objectStoreNames.contains('gameDataAssociations')) {
  const store = db.createObjectStore('gameDataAssociations', { keyPath: 'gameId' });
  store.createIndex('dataSourceType', 'dataSourceType');
  store.createIndex('integrationId', 'integrationId');
}
```

**Helper Functions:**

```typescript
// Associate upload with game
export async function associateUpload(
  gameId: string,
  uploadId: string
): Promise<void>

// Associate integration with game
export async function associateIntegration(
  gameId: string,
  integrationId: string
): Promise<void>

// Get data status for a game
export async function getGameDataStatus(
  gameId: string
): Promise<GameDataStatus>

// Get all data for a game (from upload or integration)
export async function getGameData(
  gameId: string
): Promise<NormalizedData | null>

// Check if game has any data
export async function gameHasData(
  gameId: string
): Promise<boolean>
```

---

### Task 2.4: Quick Actions Menu

**Purpose:** Fast access to common game operations

**File:** `src/components/games/GameQuickActions.tsx`

**UI:**

```
Game Card Hover/Click Actions
┌─────────────────────────────────────────┐
│  ┌─────┐  Puzzle Saga                   │
│  │ 🧩  │  ● Connected                   │
│  └─────┘                                │
│                                         │
│  [📊 View Analytics] [📤 Upload Data]   │
│  [🔌 Manage Source]  [⚙️ Settings]      │
│  [📈 Quick Stats]    [🗑️ Delete]        │
└─────────────────────────────────────────┘

Three-Dot Menu (expanded)
┌─────────────────────┐
│ 📊 View Analytics   │
│ 📤 Upload New Data  │
│ 🔌 Manage Source    │
│ ─────────────────── │
│ 📌 Pin to Top       │
│ ✏️ Edit Details     │
│ 🔄 Refresh Data     │
│ ─────────────────── │
│ ⏸️ Pause Sync       │
│ 📋 Duplicate Game   │
│ 🗑️ Delete Game      │
└─────────────────────┘
```

**Actions Implementation:**

| Action | Navigation/Effect |
|--------|------------------|
| View Analytics | `/analytics?gameId={id}` |
| Upload New Data | `/upload?gameId={id}` |
| Manage Source | `/integrations?gameId={id}` |
| Settings | Open edit modal |
| Quick Stats | Open stats popover |
| Pin to Top | Toggle `isPinned` |
| Refresh Data | Trigger integration sync |
| Pause Sync | Set integration status to `paused` |
| Duplicate Game | Create copy with "-copy" suffix |
| Delete Game | Confirmation modal → delete |

---

### Task 2.5: Games Dashboard Stats

**Purpose:** Portfolio-level metrics at a glance

**File:** `src/components/games/GamesDashboard.tsx`

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Game Portfolio                                             │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │      5       │ │      3       │ │    127K      │ │   $2.1K  ││
│  │  Total Games │ │  With Data   │ │ Total Users  │ │ Est. LTV ││
│  │              │ │              │ │  (all games) │ │ (30-day) ││
│  │  +1 this mo  │ │  2 need data │ │  +12% MTD    │ │ +8% MTD  ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│                                                                  │
│  Health Overview                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✅ 3 games healthy       ⚠️ 1 stale data        ❌ 1 no data   │
│                                                                  │
│  [+ Add Game]  [Manage Data Sources]  [View All Analytics]      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Task 2.6: Game Comparison View

**Purpose:** Compare metrics across multiple games

**File:** `src/pages/GamesComparison.tsx`

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Compare Games                                    [Export CSV]   │
│                                                                  │
│  Select games to compare (max 4):                               │
│  [🧩 Puzzle Saga ✓] [⏰ Idle Empire ✓] [⚔️ Battle Zone ✓]       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Puzzle Saga  Idle Empire  Battle Zone   ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  DAU               12,450       45,200       8,900          ││
│  │  D1 Retention      42%          55%          38%            ││
│  │  D7 Retention      18%          25%          15%            ││
│  │  ARPU              $0.42        $0.28        $0.65          ││
│  │  Sessions/Day      2.8          6.2          3.2            ││
│  │  Avg Session       8m 24s       12m 10s      18m 30s        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Retention Comparison                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  📈 [Retention curve chart with all 3 games overlaid]       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Revenue Comparison                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  📊 [Revenue bar chart comparing games]                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

### Task 2.7: Sample/Template Games

**Purpose:** Provide pre-configured demo games for learning

**File:** `src/lib/sampleGames.ts`

**Sample Games:**

```typescript
export const SAMPLE_GAMES: Game[] = [
  {
    id: 'sample-puzzle',
    name: '🎯 Sample: Puzzle Quest',
    icon: '🧩',
    genre: 'puzzle',
    platform: 'iOS',
    description: 'A demo puzzle game with 30 days of sample data',
    timezone: 'UTC',
    currency: 'USD',
    isActive: true,
    isPinned: false,
    isSample: true,  // New field to mark as sample
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ... similar for idle, battle_royale, gacha_rpg
];

export async function loadSampleGame(type: GameCategory): Promise<void> {
  // 1. Create the sample game
  // 2. Load bundled sample data
  // 3. Associate sample data with game
  // 4. Navigate to analytics
}
```

**UI for Loading Samples:**

```
Empty Games Page
┌─────────────────────────────────────────────────────────────────┐
│  No games yet                                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🎮 Create Your First Game                                │   │
│  │                                                           │   │
│  │  [+ Add My Game]                                         │   │
│  │                                                           │   │
│  │  or try a sample game to explore the features:           │   │
│  │                                                           │   │
│  │  [🧩 Try Puzzle Demo]  [⏰ Try Idle Demo]                 │   │
│  │  [⚔️ Try Battle Royale]  [🎲 Try Gacha RPG]               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Task 2.8: Game Search & Filters

**Purpose:** Find games quickly in large portfolios

**File:** `src/components/games/GameFilters.tsx`

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Search games...                                              │
│                                                                  │
│  Filters:                                                        │
│  [All Types ▾]  [All Platforms ▾]  [All Status ▾]  [Sort: A-Z ▾]│
│                                                                  │
│  Active filters: Platform: iOS (×)  Status: Has Data (×)  [Clear]│
└─────────────────────────────────────────────────────────────────┘
```

**Filter Options:**

| Filter | Options |
|--------|---------|
| Type | All, Puzzle, Idle, Battle Royale, Match-3, Gacha, Casino, Other |
| Platform | All, iOS, Android, Web, Steam, Console, Cross-Platform |
| Status | All, Has Data, No Data, Syncing, Error, Stale |
| Sort | A-Z, Z-A, Recently Updated, Most Users, Most Revenue |

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/components/games/FirstGameWizard.tsx` | Multi-step wizard for first game |
| `src/components/games/GameQuickActions.tsx` | Quick action menu component |
| `src/components/games/GamesDashboard.tsx` | Portfolio stats dashboard |
| `src/components/games/GameFilters.tsx` | Search and filter UI |
| `src/components/games/GameDataStatus.tsx` | Data status indicator component |
| `src/pages/GamesComparison.tsx` | Cross-game comparison view |
| `src/lib/gameDataAssociation.ts` | Game-to-data linking logic |
| `src/lib/sampleGames.ts` | Sample game definitions and data |
| `src/hooks/useGameDataStatus.ts` | Hook to get game data status |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/Games.tsx` | Add data status, quick actions, filters |
| `src/lib/db.ts` | Version 7 with gameDataAssociations store |
| `src/lib/gameStore.ts` | Add isSample field, sample game helpers |
| `src/App.tsx` | Add /games/compare route |
| `src/components/Sidebar.tsx` | Add "Compare" link under Games |

---

## Dependencies

- Phase 1 must be completed (Overview data flow)
- DataContext and integrations must work
- Metric calculators from Phase 1

---

## Acceptance Criteria

### Must Have (P0)
- [ ] Each game card shows data status (has data / no data / stale)
- [ ] Users can associate uploads with specific games
- [ ] First-game wizard guides new users
- [ ] Quick actions available for each game
- [ ] Empty state shows sample game options

### Should Have (P1)
- [ ] Portfolio-level stats dashboard
- [ ] Search and filter functionality
- [ ] Game duplication feature
- [ ] Bulk operations (delete multiple, export list)

### Nice to Have (P2)
- [ ] Cross-game comparison view
- [ ] Sample games with bundled data
- [ ] Game health notifications
- [ ] Import/export game configurations

---

## Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No games exist | Show empty state with wizard CTA |
| Add first game without data | Show game card with "No Data" status |
| Upload data for a game | Game card updates to show "Connected" |
| Integration sync fails | Show error status on game card |
| Search for "puzzle" | Filter to show only puzzle games |
| Click "Compare" with 2+ games | Navigate to comparison view |
| Delete game with data | Confirm dialog, delete game + association |

---

## Open Questions for User

1. Should deleting a game also delete its associated data, or keep data for potential reassignment?
2. Maximum number of games to support? (affects UI scaling decisions)
3. Should sample games be distinguishable from real games, or fully identical?
4. Do you want game "folders" or "tags" for organization?
5. Should there be a "Game Template" feature to quickly create similar games?
