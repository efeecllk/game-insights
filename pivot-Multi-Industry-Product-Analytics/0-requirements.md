# Multi-Industry Product Analytics Platform - Requirements Document

## Executive Summary

Transform "Game Insights" from a mobile game analytics platform into a flexible, multi-industry product analytics solution. The platform will automatically detect industry types from uploaded data and provide tailored metrics, visualizations, and insights for each industry vertical.

---

## Vision Statement

> "The first AI-powered product analytics platform that automatically detects your industry, understands your schema, and delivers insights without configuration."

---

## Business Requirements

### BR-1: Multi-Industry Support
The platform must support analytics for multiple industry verticals beyond mobile games:
- **Gaming** (existing - puzzle, idle, battle royale, match3, gacha)
- **SaaS/Subscription** (B2B, B2C, API products)
- **E-commerce** (retail, marketplace, subscription box, digital products)
- **EdTech** (online learning, courses, certifications)
- **Media/Streaming** (video, audio, content platforms)
- **Fintech** (banking, payments, trading)
- **Healthcare** (patient engagement, telehealth)
- **Custom** (user-defined industry)

### BR-2: Zero-Configuration Analytics
The platform must maintain the current "upload and get insights" philosophy:
- Automatic industry detection from data patterns
- Automatic schema recognition and column mapping
- Automatic metric calculation based on detected industry
- Automatic chart/visualization selection

### BR-3: Backward Compatibility
Existing game analytics users must not experience breaking changes:
- All existing game types continue to work
- Existing data in IndexedDB must be migrated seamlessly
- Existing APIs and hooks remain functional (with deprecation warnings)

### BR-4: Extensibility
The platform must be extensible without code changes:
- Add new industries via configuration (Industry Packs)
- Define custom metrics via formula builder
- Create custom semantic type mappings
- Install third-party industry packs

### BR-5: Privacy & Local-First
Maintain current privacy-first architecture:
- Data stays on user's machine (IndexedDB)
- No server-side analytics required
- Optional cloud features (future)

---

## Functional Requirements

### FR-1: Industry Detection System

#### FR-1.1: Industry Detector
- **Input**: Column meanings from SchemaAnalyzer
- **Output**: Industry type, sub-category, confidence score, alternative suggestions
- **Behavior**: Analyze semantic patterns to classify data source
- **Accuracy Target**: >85% correct detection for supported industries

#### FR-1.2: Detection Indicators
Each industry must define weighted signals for detection:
```
Example (SaaS):
- mrr + arr → weight 5 (strong signal)
- subscription_tier → weight 4
- trial_start + trial_end → weight 3
```

#### FR-1.3: Cross-Industry Support
- Detect when data spans multiple industries
- Identify primary vs secondary industry
- Provide recommendations for mixed datasets

### FR-2: Industry Pack System

#### FR-2.1: Pack Structure
Each Industry Pack must include:
- **Identification**: ID, name, description, version
- **Sub-categories**: Industry-specific segments (e.g., B2B vs B2C for SaaS)
- **Semantic Types**: Column patterns for this industry
- **Detection Indicators**: Weighted signals for auto-detection
- **Metrics**: KPI definitions with formulas and benchmarks
- **Funnel Templates**: Pre-built conversion funnels
- **Chart Configurations**: Visualization recommendations
- **Insight Templates**: AI-generated recommendation patterns
- **Terminology**: Industry-specific vocabulary mapping
- **Theme**: Colors, icons, branding

#### FR-2.2: Pack Registry
- Central registry for all installed packs
- Dynamic loading/unloading of packs
- Event system for pack changes
- Conflict resolution for overlapping patterns

#### FR-2.3: Built-in Packs (MVP)
1. **Gaming Pack** - Migrated from current implementation
2. **SaaS Pack** - MRR, churn, trial conversion, NRR
3. **E-commerce Pack** - GMV, AOV, cart abandonment, repeat purchase

### FR-3: Enhanced Schema Analysis

#### FR-3.1: Extended Semantic Types
Current 43 types expanded to 100+ covering all industries:
- Universal types (user_id, timestamp, revenue, etc.)
- Gaming types (moves, prestige, kills, banner, etc.)
- SaaS types (mrr, arr, subscription_tier, churn_date, etc.)
- E-commerce types (order_id, cart_value, sku, shipping, etc.)
- EdTech types (course_id, completion_rate, assessment_score, etc.)
- Media types (watch_time, content_id, playback_quality, etc.)

#### FR-3.2: Pluggable Pattern Registry
- External configuration for semantic patterns
- User-defined custom column mappings
- Import/export of mapping configurations

### FR-4: Metric System

#### FR-4.1: Metric Definitions
Each metric must specify:
- Unique identifier and display name
- Description and calculation formula
- Required semantic types
- Category (KPI, derived, aggregate)
- Formatting (number, percentage, currency, duration)
- Optional benchmarks (good, excellent thresholds)

#### FR-4.2: Universal Metrics
Metrics that work across all industries:
- Daily/Weekly/Monthly Active Users
- Retention (D1, D7, D30)
- Session duration and frequency
- Revenue per user (ARPU)
- Customer Lifetime Value (LTV)
- Churn rate

#### FR-4.3: Industry-Specific Metrics
| Industry | Key Metrics |
|----------|-------------|
| Gaming | DAU, ARPDAU, Level completion, Booster usage |
| SaaS | MRR, ARR, NRR, CAC, LTV:CAC ratio, Trial conversion |
| E-commerce | GMV, AOV, Cart abandonment, Repeat purchase rate |
| EdTech | Course completion, Certification rate, Assessment pass rate |
| Media | Watch time, Completion rate, Content discovery |

### FR-5: Funnel System

#### FR-5.1: Template Funnels
Pre-built funnels for each industry:
- **Gaming**: Tutorial → First purchase → Day 7 active
- **SaaS**: Signup → Trial → Activation → Paid conversion
- **E-commerce**: Browse → Add to cart → Checkout → Purchase
- **EdTech**: Enroll → First lesson → Module complete → Certification

#### FR-5.2: Custom Funnels
Users can create funnels by:
- Selecting events/semantic types as steps
- Defining conversion windows
- Setting segment filters

### FR-6: Visualization System

#### FR-6.1: Chart Selection
Automatic chart recommendations based on:
- Data types available
- Industry context
- Metric being visualized
- User preferences

#### FR-6.2: Industry Theming
Each industry has distinct visual identity:
- Primary and accent colors
- Chart color palettes
- Industry-specific icons

### FR-7: Terminology Adaptation

#### FR-7.1: Dynamic Labels
UI text adapts to industry:
| Concept | Gaming | SaaS | E-commerce |
|---------|--------|------|------------|
| User | Player | Customer | Shopper |
| Session | Session | Visit | Visit |
| Conversion | Purchase | Subscription | Order |
| Retention | Retention | Renewal | Repeat purchase |
| Revenue | Revenue | MRR | GMV |

#### FR-7.2: Override System
Users can customize terminology per project

### FR-8: Data Sources

#### FR-8.1: Existing Adapters (Keep)
- FileAdapter (CSV, JSON, Excel, SQLite)
- GoogleSheetsAdapter
- SupabaseAdapter
- PostgreSQLAdapter
- FirebaseAdapter
- APIAdapter
- WebhookAdapter

#### FR-8.2: New Adapters (Optional)
- BigQueryAdapter (for public datasets)
- SnowflakeAdapter
- ClickHouseAdapter

#### FR-8.3: Sample Datasets
Provide built-in sample data for testing:
- BigQuery public datasets (TheLook E-commerce, Flood-It Gaming)
- Kaggle CSV imports
- Synthetic data generators per industry

---

## Non-Functional Requirements

### NFR-1: Performance
- Industry detection < 100ms for 10K rows
- Dashboard render < 500ms
- Memory usage < 500MB for 1M rows

### NFR-2: Reliability
- 99.9% uptime for core features
- Graceful degradation when optional features fail
- Auto-recovery from IndexedDB corruption

### NFR-3: Scalability
- Support 10+ industry packs simultaneously
- Handle datasets up to 10M rows
- Support 100+ custom metrics

### NFR-4: Maintainability
- Industry packs can be updated independently
- Core platform updates don't break packs
- Clear separation between core and extensions

### NFR-5: Security
- No data leaves user's browser by default
- Optional encryption for IndexedDB
- Safe parsing of uploaded files

---

## Technical Requirements

### TR-1: Architecture Changes

#### TR-1.1: New Directory Structure
```
src/
├── industry/                    # NEW: Industry abstraction layer
│   ├── types.ts                 # Core interfaces
│   ├── IndustryRegistry.ts      # Pack management
│   ├── IndustryDetector.ts      # Detection logic
│   └── packs/                   # Industry pack implementations
│       ├── gaming/
│       ├── saas/
│       ├── ecommerce/
│       └── index.ts             # Pack exports
├── ai/
│   ├── SchemaAnalyzer.ts        # EXTEND: Pluggable semantic types
│   ├── IndustryDetector.ts      # NEW: Replaces GameTypeDetector
│   └── ...
├── context/
│   ├── ProductContext.tsx       # NEW: Replaces GameContext
│   └── ...
└── ...
```

#### TR-1.2: Core Interface Definitions
- `IndustryPack` - Complete industry configuration
- `IndustrySemanticType` - Column pattern with industry context
- `MetricDefinition` - Metric calculation specification
- `FunnelTemplate` - Pre-built funnel configuration
- `TerminologyMap` - Industry vocabulary mapping

#### TR-1.3: Registry Pattern
- `IndustryRegistry` - Central pack management
- Event-based updates for pack changes
- Lazy loading for large packs

### TR-2: Data Model Changes

#### TR-2.1: ProductData (extends GameData)
```typescript
interface ProductData {
  id: string;
  name: string;
  industry: IndustryType;          // NEW
  subCategory: IndustrySubCategory; // NEW
  type?: GameCategory;              // LEGACY: backward compat
  uploadedAt: string;
  rawData: Record<string, unknown>[];
  rowCount: number;
  detectionConfidence?: number;     // NEW
  detectionReasons?: string[];      // NEW
}
```

#### TR-2.2: IndexedDB Schema Migration
- Version bump for schema changes
- Migration function for existing data
- Backward-compatible field additions

### TR-3: Context Migration

#### TR-3.1: ProductContext
- Replaces GameContext functionality
- Adds industry selection
- Provides terminology helper function `t()`
- Auto-syncs with uploaded data

#### TR-3.2: Backward Compatibility Hook
```typescript
// Deprecated but functional
const { selectedGame } = useGame();
// Preferred
const { selectedIndustry, selectedSubCategory } = useProduct();
```

### TR-4: Component Updates

#### TR-4.1: IndustrySelector
New dropdown component for industry/sub-category selection

#### TR-4.2: Sidebar Updates
- Dynamic navigation priorities per industry
- Terminology-aware labels
- Industry-specific icons

#### TR-4.3: KPICard Updates
- Use industry terminology
- Apply industry formatting

---

## Success Criteria

### SC-1: Detection Accuracy
- Gaming detection: >95% (existing capability)
- SaaS detection: >85%
- E-commerce detection: >85%
- Other industries: >75%

### SC-2: User Experience
- Existing gaming users see no UX degradation
- New industry users get relevant dashboards on first upload
- Industry switching is seamless

### SC-3: Performance
- No performance regression from current baseline
- Industry detection adds <100ms to analysis pipeline

### SC-4: Extensibility
- New industry can be added in <1 week with pack definition
- Custom metrics can be defined by users
- Third-party packs can be installed

---

## Out of Scope (v1.0)

1. **Server-side processing** - All analysis remains client-side
2. **Real-time collaboration** - Single user focus
3. **AI-generated recommendations** - Beyond template-based insights
4. **White-labeling** - No custom branding per customer
5. **Mobile app** - Web-only
6. **Regulatory compliance** (HIPAA, PCI) - Future consideration

---

## Glossary

| Term | Definition |
|------|------------|
| Industry Pack | A complete configuration for analyzing a specific industry vertical |
| Semantic Type | A recognized column meaning (e.g., user_id, revenue, timestamp) |
| Detection Indicator | Weighted signals used to identify an industry from data |
| Sub-category | A specialization within an industry (e.g., B2B vs B2C in SaaS) |
| Terminology Map | Industry-specific vocabulary for UI labels |
| Product Category | The combined industry + sub-category classification |

---

## Appendix A: Competitive Positioning

| Competitor | Our Advantage |
|------------|---------------|
| Amplitude | Zero-config setup vs weeks of event planning |
| Mixpanel | AI-powered schema detection vs manual instrumentation |
| Heap | Industry-specific insights vs generic autocapture |
| PostHog | Multi-industry support vs developer-only focus |
| Pendo | Pure analytics without forcing in-app guidance |

---

## Appendix B: Universal Metrics (AARRR Framework)

| Stage | Metric | Description |
|-------|--------|-------------|
| Acquisition | New Users | Volume of new registrations |
| Activation | Activation Rate | % completing key action |
| Retention | D1/D7/D30 | % returning on specific days |
| Revenue | ARPU | Average revenue per user |
| Revenue | LTV | Customer lifetime value |
| Referral | Viral Coefficient | Users acquired per user |

---

## Appendix C: Data Sources for Testing

### BigQuery (FREE)
- `firebase-public-project.analytics_153293282` - Gaming (Flood-It!)
- `bigquery-public-data.ga4_obfuscated_sample_ecommerce` - E-commerce
- `bigquery-public-data.thelook_ecommerce` - E-commerce (100K+ users)

### Kaggle
- Gamelytics Mobile Analytics Challenge
- Mobile IAP 2025 Dataset
- Cookie Cats (Rounds & Retention)
- E-commerce Behavior Data (285M events)
- Telco Customer Churn (7K subscribers)
- Open University Learning Analytics (OULAD)

### Public APIs
- RAWG Video Game Database
- Clash Royale API (no auth required)
- Tracker Network (Apex, CSGO stats)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-01 | Claude | Initial requirements document |
