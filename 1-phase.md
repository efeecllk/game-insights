# Phase 1: Overview Page - Real Data Integration & User Onboarding

## Objective

Transform the Overview page from a static mock-data demo into a dynamic, user-driven dashboard that:
1. Clearly guides new users to upload data or connect a data source
2. Displays real analytics when data is available
3. Provides contextual empty states for each section
4. Maintains the current beautiful UI while adding functionality

---

## Current State Analysis

### Problems to Solve

| Issue | Impact | Priority |
|-------|--------|----------|
| Shows mock data immediately | Users don't understand they need to upload data | Critical |
| No empty state handling | Confusing UX for new users | Critical |
| DataContext not used | Real uploaded data is ignored | Critical |
| No onboarding flow | Users don't know where to start | High |
| KPIs are hardcoded | Metrics don't reflect actual game | High |
| AI Insights are static | Not personalized to user's data | Medium |

### Current Data Flow (Broken)
```
User lands on Overview
    ↓
GameContext provides selectedGame (default: 'puzzle')
    ↓
createDataProvider(selectedGame) returns MockDataProvider
    ↓
Charts render with HARDCODED demo data
    ↓
User sees fake analytics (thinks it's their data?)
```

### Target Data Flow (Fixed)
```
User lands on Overview
    ↓
Check: Does user have ANY data uploaded?
    ├─ NO → Show "Getting Started" welcome screen
    │       with clear CTA to upload data
    │
    └─ YES → Check: Is data available for selected game type?
             ├─ NO → Show "No data for this game type"
             │       with option to switch or upload
             │
             └─ YES → Load real data from DataContext
                      Calculate actual metrics
                      Render personalized dashboard
```

---

## Task Breakdown

### Task 1.1: Create DataStatusBanner Component

**Purpose:** A prominent, always-visible banner showing data status

**File:** `src/components/DataStatusBanner.tsx`

**States to Handle:**

```typescript
type DataStatus =
  | 'no_data'           // No uploads, no connections
  | 'demo_mode'         // User explicitly chose demo
  | 'data_available'    // Has real data
  | 'data_stale'        // Data older than 24h
  | 'sync_error'        // Integration has errors
  | 'syncing'           // Currently fetching
```

**UI Design:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Demo Mode                                                     │
│ You're viewing sample data. Upload your game data to see real   │
│ analytics.                                                       │
│                                                                  │
│ [Upload Data]  [Connect Data Source]  [Continue with Demo →]    │
└─────────────────────────────────────────────────────────────────┘
```

**For `data_stale`:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Data may be outdated                                          │
│ Last sync: 3 days ago. Some metrics might not reflect current   │
│ game performance.                                                │
│                                                                  │
│ [Refresh Now]  [Configure Auto-Sync]  [Dismiss]                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Details:**
- Position: Below header, above KPI grid
- Dismissible but remembers dismissal in localStorage (reset daily)
- Animate in/out smoothly
- Theme-aware (dark/light)
- Responsive (stacks on mobile)

---

### Task 1.2: Create WelcomeScreen Component

**Purpose:** Full-page onboarding for first-time users

**File:** `src/components/WelcomeScreen.tsx`

**Show When:**
- No game data in IndexedDB
- No connected integrations
- User hasn't dismissed with "Continue with Demo"

**UI Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                     🎮 Welcome to Game Insights                  │
│                                                                  │
│     AI-powered analytics for mobile game developers              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  📁 Upload   │  │  🔌 Connect  │  │  🎯 Demo     │           │
│  │    File      │  │ Data Source  │  │    Mode      │           │
│  │              │  │              │  │              │           │
│  │ CSV, JSON,   │  │ Google       │  │ Explore with │           │
│  │ Excel files  │  │ Sheets,      │  │ sample data  │           │
│  │              │  │ Firebase,    │  │ for a puzzle │           │
│  │ Best for:    │  │ Supabase...  │  │ game         │           │
│  │ Quick start  │  │              │  │              │           │
│  │ One-time     │  │ Best for:    │  │ Best for:    │           │
│  │ analysis     │  │ Live sync    │  │ Evaluation   │           │
│  │              │  │ Automation   │  │ Learning UI  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ─────────────── What you'll get ───────────────                │
│                                                                  │
│  ✅ Automatic game type detection                                │
│  ✅ Smart column mapping with AI                                 │
│  ✅ Retention curves, funnels, revenue analysis                  │
│  ✅ AI-generated insights and recommendations                    │
│  ✅ All data stays on your device (local-first)                  │
│                                                                  │
│  ─────────────── Supported Formats ───────────────              │
│                                                                  │
│  📄 CSV    📊 Excel (.xlsx)    📋 JSON    🔗 Google Sheets      │
│  🗄️ SQLite  🔥 Firebase  ⚡ Supabase  🐘 PostgreSQL             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- "Upload File" → Navigate to `/upload`
- "Connect Data Source" → Navigate to `/integrations`
- "Demo Mode" → Set localStorage flag, show Overview with mock data + banner

**Edge Cases to Handle:**
- User closes browser before completing → Show welcome again
- User uploads partial data → Show welcome with "Continue where you left off"
- User connected source but sync failed → Show warning + retry option

---

### Task 1.3: Refactor OverviewPage to Use Real Data

**File:** `src/App.tsx` (OverviewPage function)

**Changes Required:**

1. **Import DataContext:**
```typescript
import { useData } from './context/DataContext';
```

2. **Check for data availability:**
```typescript
const { gameDataList, activeGameData, isReady } = useData();
const hasRealData = gameDataList.length > 0;
const isInDemoMode = localStorage.getItem('demo_mode') === 'true';
```

3. **Conditional rendering logic:**
```typescript
// Show loading while checking data
if (!isReady) {
  return <LoadingSkeleton />;
}

// Show welcome screen if no data
if (!hasRealData && !isInDemoMode) {
  return <WelcomeScreen />;
}

// Show overview with banner
return (
  <div className="space-y-6">
    <DataStatusBanner
      hasRealData={hasRealData}
      isInDemoMode={isInDemoMode}
    />
    {/* Rest of overview */}
  </div>
);
```

4. **Create RealDataProvider:**
```typescript
// New file: src/lib/realDataProvider.ts
export class RealDataProvider implements IDataProvider {
  constructor(private gameData: GameData) {}

  getRetentionData(): RetentionData {
    // Calculate from actual data
    return calculateRetention(this.gameData.rawData, this.gameData.columnMappings);
  }

  // ... other methods
}
```

---

### Task 1.4: Implement Metric Calculations

**File:** `src/lib/metricCalculators.ts`

**Purpose:** Calculate real metrics from uploaded data

**Functions to Implement:**

```typescript
// Retention calculation
export function calculateRetention(
  data: Record<string, unknown>[],
  mappings: ColumnMapping[],
  days: number[] = [1, 3, 7, 14, 30]
): RetentionData {
  // Find user_id and timestamp columns
  const userIdCol = findColumnByType(mappings, 'user_id');
  const timestampCol = findColumnByType(mappings, 'timestamp');

  if (!userIdCol || !timestampCol) {
    throw new MissingColumnError('Retention requires user_id and timestamp');
  }

  // Group by user, find first activity date
  // Calculate % still active on day N
  // ...
}

// DAU calculation
export function calculateDAU(
  data: Record<string, unknown>[],
  mappings: ColumnMapping[],
  date?: Date
): number {
  // Count unique users active on date
}

// Revenue metrics
export function calculateRevenue(
  data: Record<string, unknown>[],
  mappings: ColumnMapping[]
): RevenueMetrics {
  const revenueCol = findColumnByType(mappings, 'revenue');
  // Sum, ARPU, ARPPU calculations
}

// Funnel calculation
export function calculateFunnel(
  data: Record<string, unknown>[],
  mappings: ColumnMapping[],
  steps: string[] // e.g., ['tutorial', 'level_1', 'level_5', 'purchase']
): FunnelStep[] {
  // Count users at each step
  // Calculate conversion rates
}
```

**Edge Cases:**

| Scenario | Handling |
|----------|----------|
| Missing user_id column | Show warning, suggest re-mapping |
| No timestamp column | Show cumulative metrics only, disable retention |
| Revenue column has nulls | Filter nulls, show "X% data missing" note |
| Data has < 100 rows | Show "Limited data" warning |
| Date range < 7 days | Disable D7/D30 retention, show note |

---

### Task 1.5: Create Empty State Components

**File:** `src/components/EmptyState.tsx`

**Variants Needed:**

1. **ChartEmptyState** - For individual charts
```
┌─────────────────────────────────────────┐
│                                         │
│           📊                            │
│                                         │
│    No retention data available          │
│                                         │
│    This chart needs:                    │
│    • user_id column ✗                   │
│    • timestamp column ✓                 │
│                                         │
│    [Fix Column Mapping]                 │
│                                         │
└─────────────────────────────────────────┘
```

2. **KPIEmptyState** - For KPI grid
```
┌─────────────────────────────────────────┐
│    --                                   │
│    DAU                                  │
│    No user_id column mapped             │
└─────────────────────────────────────────┘
```

3. **InsightsEmptyState** - For AI insights
```
┌─────────────────────────────────────────┐
│    🧠 AI Insights                        │
│                                         │
│    Upload more data to unlock insights  │
│                                         │
│    Currently have: 500 rows             │
│    Recommended: 10,000+ rows            │
│                                         │
│    [Learn about data requirements]      │
└─────────────────────────────────────────┘
```

---

### Task 1.6: Add Data Requirements Tooltip

**Purpose:** Help users understand what data each chart needs

**File:** `src/components/ChartRequirements.tsx`

**Example UI:**
```
Retention Curve ⓘ
              │
              ▼
┌─────────────────────────────────────────┐
│ Data Requirements                        │
│                                         │
│ Required columns:                       │
│ • user_id (identifier)                  │
│ • timestamp (event time)                │
│                                         │
│ Optional columns:                       │
│ • event_name (for specific events)      │
│                                         │
│ Minimum data:                           │
│ • 7 days of data for D7 retention       │
│ • 1,000+ unique users recommended       │
│                                         │
│ Your data status:                       │
│ ✓ user_id mapped                        │
│ ✓ timestamp mapped                      │
│ ⚠ Only 5 days of data (D7 limited)     │
└─────────────────────────────────────────┘
```

---

### Task 1.7: Implement Demo Mode Toggle

**Purpose:** Let users switch between demo and real data

**Location:** Add to GameSelector or create DataModeToggle

**UI:**
```
┌─────────────────────────────────────────┐
│  Data: [Real Data ▾]                    │
│        ├─ Real Data (My Upload)         │
│        ├─ Demo: Puzzle Game             │
│        ├─ Demo: Idle Game               │
│        ├─ Demo: Battle Royale           │
│        └─ Demo: Gacha RPG               │
└─────────────────────────────────────────┘
```

**Behavior:**
- Default to "Real Data" if available
- Allow switching to demo for learning/comparison
- Show comparison mode (real vs benchmark) in future

---

### Task 1.8: Add Quick Stats Summary

**Purpose:** Show data health at a glance

**Location:** Top-right of Overview or in header

**UI:**
```
┌─────────────────────────────────────────┐
│ Data Health                             │
│                                         │
│ 📊 45,231 events                        │
│ 👥 8,421 unique users                   │
│ 📅 Last 14 days                         │
│ 🔄 Last sync: 2 hours ago               │
│ ⚠️ 2 warnings                           │
└─────────────────────────────────────────┘
```

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/components/WelcomeScreen.tsx` | First-time user onboarding |
| `src/components/DataStatusBanner.tsx` | Persistent data status indicator |
| `src/components/EmptyState.tsx` | Reusable empty state component |
| `src/components/ChartRequirements.tsx` | Data requirements tooltip |
| `src/components/DataModeToggle.tsx` | Switch between real/demo data |
| `src/components/QuickStats.tsx` | Data health summary |
| `src/lib/metricCalculators.ts` | Real metric calculation functions |
| `src/lib/realDataProvider.ts` | IDataProvider implementation for real data |
| `src/hooks/useDataStatus.ts` | Hook to get current data status |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Add conditional rendering, data checks |
| `src/context/DataContext.tsx` | Add data status helpers |
| `src/components/analytics/KPIGrid.tsx` | Support empty states |
| `src/charts/RetentionCurve.tsx` | Add empty state handling |
| `src/charts/FunnelChart.tsx` | Add empty state handling |
| `src/charts/RevenueChart.tsx` | Add empty state handling |
| `src/charts/SegmentChart.tsx` | Add empty state handling |

---

## Dependencies

- Phase must be completed before real data flows work anywhere
- DataContext and IndexedDB persistence must be functional (already done)
- Theme system must be complete (already done)

---

## Acceptance Criteria

### Must Have (P0)
- [ ] New users see WelcomeScreen, not mock data
- [ ] DataStatusBanner shows current data state
- [ ] Real data from DataContext displayed when available
- [ ] Each chart shows appropriate empty state when data missing
- [ ] Users can explicitly enter demo mode
- [ ] Demo mode is clearly labeled

### Should Have (P1)
- [ ] Metric calculators work for retention, DAU, revenue
- [ ] Data requirements shown for each chart
- [ ] Quick stats summary visible
- [ ] Stale data warnings appear after 24h

### Nice to Have (P2)
- [ ] Comparison mode (real vs demo/benchmark)
- [ ] Animated transitions between states
- [ ] Keyboard navigation for welcome screen
- [ ] "What's New" section for returning users

---

## Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| First visit, no data | Show WelcomeScreen |
| First visit, click "Demo Mode" | Show Overview with mock data + banner |
| Upload CSV, return to Overview | Show real data, no banner |
| Upload incomplete data | Show partial data + warnings per chart |
| Connected integration has error | Show banner with error status |
| Data > 24h old | Show "Data may be outdated" banner |
| Switch between games | Charts update with correct data/empty states |

---

## Estimated Complexity

| Task | Complexity | New Code | Modified Code |
|------|------------|----------|---------------|
| 1.1 DataStatusBanner | Medium | ~150 lines | - |
| 1.2 WelcomeScreen | High | ~300 lines | - |
| 1.3 Refactor OverviewPage | High | ~100 lines | ~200 lines |
| 1.4 Metric Calculators | High | ~400 lines | - |
| 1.5 Empty State Components | Medium | ~200 lines | - |
| 1.6 Chart Requirements | Low | ~100 lines | - |
| 1.7 Demo Mode Toggle | Medium | ~80 lines | ~50 lines |
| 1.8 Quick Stats | Low | ~100 lines | - |

**Total New Code:** ~1,430 lines
**Total Modified:** ~250 lines

---

## Open Questions for User

1. Should demo mode be accessible from a "?" help menu, or always visible in the UI?
2. For users with multiple game data uploads, should we show a game switcher on Overview?
3. Should we show "benchmarks" (industry averages) alongside user's metrics?
4. What's the minimum data requirement before we show the dashboard? (100 rows? 1000?)
