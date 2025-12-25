# Phase 3: One-Click Integrations

**Goal:** Connect to where indie devs already store data. No manual exports, no data engineering.

**Tagline:** "Connect once. Insights flow automatically."

---

## The Problem

Indie developers use various services:
- Firebase for auth and events
- PlayFab for player data
- Google Sheets for manual tracking
- PostgreSQL for custom backends
- REST APIs for server data

Manually exporting and uploading is:
- Time-consuming
- Error-prone
- Data gets stale quickly
- Breaks when formats change

We need direct connections that "just work."

---

## Integration Tiers

### Tier 1: Most Used (80% of indie devs)
| Service | Priority | Complexity |
|---------|----------|------------|
| Google Sheets | Critical | Low |
| Firebase Analytics | Critical | Medium |
| REST API (generic) | Critical | Done ✓ |
| CSV/JSON files | Critical | Done ✓ |

### Tier 2: Common Backends
| Service | Priority | Complexity |
|---------|----------|------------|
| Supabase | High | Low |
| PostgreSQL | High | Medium |
| MongoDB | Medium | Medium |
| MySQL | Medium | Medium |

### Tier 3: Game Platforms
| Service | Priority | Complexity |
|---------|----------|------------|
| PlayFab | High | Medium |
| Unity Gaming Services | High | Medium |
| GameAnalytics | Medium | Medium |
| Steam API | Medium | High |

### Tier 4: Advanced
| Service | Priority | Complexity |
|---------|----------|------------|
| BigQuery | Medium | High |
| Snowflake | Low | High |
| AWS Athena | Low | High |
| Mixpanel | Low | Medium |

---

## Features

### 3.1 Google Sheets Integration
**Status:** New | **Priority:** Critical

Many indie devs track data in Google Sheets manually.

- [ ] **One-click Google auth** (OAuth 2.0)
- [ ] **Spreadsheet picker** - browse and select sheets
- [ ] **Auto-detect data range** - find the table automatically
- [ ] **Column mapping** - same AI as file upload
- [ ] **Sync options:**
  - One-time import
  - Scheduled refresh (hourly/daily)
  - Real-time sync (when sheet changes)
- [ ] **Multi-sheet support** - combine data from multiple sheets
- [ ] **Preserve formulas** - import calculated values

### 3.2 Firebase Analytics Integration
**Status:** New | **Priority:** Critical

Firebase is THE analytics solution for many indie mobile games.

- [ ] **Firebase project connection:**
  - Service account JSON upload
  - Project picker from Google account
- [ ] **Event stream access:**
  - Standard events (first_open, session_start, etc.)
  - Custom events
  - User properties
- [ ] **BigQuery export bridge:**
  - Connect to Firebase's BigQuery export
  - Query raw events
  - Cost-aware querying
- [ ] **Real-time listener:**
  - Live event stream
  - Recent events preview
- [ ] **Pre-built dashboards:**
  - Firebase-specific retention curves
  - Event funnel analysis
  - User property breakdown

### 3.3 Supabase Integration
**Status:** New | **Priority:** High

Supabase is popular for indie game backends.

- [ ] **Connection via:**
  - API URL + API Key (simple)
  - Direct PostgreSQL connection
- [ ] **Table browser:**
  - See all tables
  - Preview data
  - Select columns
- [ ] **Query builder:**
  - Visual query construction
  - Filter by date/values
  - Aggregate functions
- [ ] **Real-time subscription:**
  - Listen for new rows
  - Auto-refresh dashboards

### 3.4 PostgreSQL Direct Connection
**Status:** Planned | **Priority:** High

For devs with custom backends.

- [ ] **Connection config:**
  - Host, port, database
  - Username, password (encrypted storage)
  - SSL options
- [ ] **Schema browser:**
  - View all tables/views
  - Column information
  - Row counts
- [ ] **Query builder:**
  - Visual query construction
  - Raw SQL option
  - Query templates
- [ ] **Connection pooling** - efficient database usage
- [ ] **Read-only mode** - safety first

### 3.5 PlayFab Integration
**Status:** New | **Priority:** High

PlayFab is common for multiplayer and LiveOps.

- [ ] **Title connection:**
  - Title ID + Secret Key
  - Developer account auth
- [ ] **Data access:**
  - Player data
  - PlayStream events
  - Economy data (virtual currencies, items)
  - Leaderboards
- [ ] **Event filtering:**
  - By event type
  - By date range
  - By player segment
- [ ] **PlayFab-specific dashboards:**
  - Economy health
  - Player segments
  - Event funnels

### 3.6 Unity Gaming Services Integration
**Status:** New | **Priority:** High

For Unity developers using UGS.

- [ ] **Unity Dashboard auth** (OAuth)
- [ ] **Analytics events** - standard + custom
- [ ] **Cloud Save data** - player progression
- [ ] **Remote Config** - feature flag status
- [ ] **Economy data** - virtual currencies, IAP

### 3.7 Generic Webhook Receiver
**Status:** New | **Priority:** Medium

For custom real-time data.

- [ ] **Unique webhook URL** per project
- [ ] **Event schema detection** from first events
- [ ] **Buffering** - handle burst traffic
- [ ] **Validation** - ensure data quality
- [ ] **Dashboard auto-update** on new events

### 3.8 Integration Hub UI
**Status:** New | **Priority:** Critical

Central place to manage all connections.

- [ ] **Integration marketplace:**
  - Browse available integrations
  - Popularity/rating
  - Setup guides
- [ ] **Connection status:**
  - Last sync time
  - Error indicators
  - Data freshness
- [ ] **Quick actions:**
  - Refresh now
  - Edit connection
  - Pause sync
  - Delete
- [ ] **Data source switcher:**
  - Toggle between sources
  - Merge multiple sources
  - Source comparison

---

## Technical Implementation

### Adapter Architecture (Existing)
```
DataSource → Adapter → NormalizedData → Dashboard
```

### New Adapters
```
src/adapters/
├── BaseAdapter.ts          # Done ✓
├── FileAdapter.ts          # Done ✓
├── APIAdapter.ts           # Done ✓
├── GoogleSheetsAdapter.ts  # New
├── FirebaseAdapter.ts      # New
├── SupabaseAdapter.ts      # New
├── PostgresAdapter.ts      # Planned
├── PlayFabAdapter.ts       # New
├── UnityAdapter.ts         # New
├── WebhookAdapter.ts       # New
└── index.ts
```

### Authentication Patterns
```typescript
type AuthMethod =
  | { type: 'oauth'; provider: 'google' | 'unity' | 'firebase' }
  | { type: 'apikey'; key: string }
  | { type: 'serviceAccount'; credentials: object }
  | { type: 'basic'; username: string; password: string }
  | { type: 'connection'; connectionString: string };
```

### Secure Credential Storage
- Encrypt credentials at rest
- Never log credentials
- Session-based access tokens
- Optional: External secret manager support

### Sync Strategies
```typescript
type SyncStrategy =
  | { type: 'manual' }                          // User triggers
  | { type: 'scheduled'; interval: number }     // Every N minutes
  | { type: 'realtime'; method: 'websocket' | 'polling' }
  | { type: 'webhook' };                        // Push-based
```

---

## User Experience

### Adding an Integration
1. Click "Add Data Source"
2. See integration marketplace
3. Click on service (e.g., "Firebase")
4. Follow guided setup:
   - Authenticate
   - Select data
   - Configure sync
5. See data flowing into dashboard

### Integration Status Page
```
╔═══════════════════════════════════════════════════╗
║  Data Sources                           [+ Add]   ║
╠═══════════════════════════════════════════════════╣
║  🟢 Firebase Analytics                            ║
║     Last sync: 2 minutes ago                      ║
║     Events: 12,345 | Users: 1,234                 ║
║     [Refresh] [Settings] [Pause]                  ║
╠═══════════════════════════════════════════════════╣
║  🟢 Google Sheets - "Daily Metrics"               ║
║     Last sync: 1 hour ago                         ║
║     Rows: 365 | Columns: 12                       ║
║     [Refresh] [Settings] [Pause]                  ║
╠═══════════════════════════════════════════════════╣
║  🔴 PostgreSQL - Production DB                    ║
║     Error: Connection refused                     ║
║     [Retry] [Edit Connection] [Remove]            ║
╚═══════════════════════════════════════════════════╝
```

---

## Success Metrics

- **< 5 minutes** to connect any Tier 1 integration
- **< 2 clicks** to refresh data from any source
- **> 95%** connection success rate
- **Zero credentials leaked** (security audit)

---

## Dependencies

- Phase 1: Normalization layer (adapters use it)
- Phase 2: Dashboard generation (for integrated data)

## Enables

- Phase 4: Community-shared integration configs
- Phase 5: Cross-source analytics

---

## Security Considerations

### Credential Handling
- Never store raw passwords
- Use OAuth where possible
- Encrypt all credentials with user-specific keys
- Support read-only database connections
- Audit log for all data access

### Rate Limiting
- Respect API rate limits
- Implement backoff strategies
- Cache where appropriate
- Warn users about quota usage

### Data Privacy
- Clear data locality info
- Option to process data locally only
- No credential transmission to external services (except auth endpoints)

---

## Estimated Effort

| Integration | Effort | Priority |
|-------------|--------|----------|
| Google Sheets | Medium | Critical |
| Firebase | Large | Critical |
| Supabase | Medium | High |
| PostgreSQL | Medium | High |
| PlayFab | Large | High |
| Unity | Large | High |
| Webhook receiver | Medium | Medium |
| Integration Hub UI | Large | Critical |

**Total:** ~8-12 weeks of focused development
