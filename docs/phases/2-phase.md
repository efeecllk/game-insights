# Phase 2: Zero-Config Analytics

**Goal:** AI does ALL the work. Upload data, get insights. No configuration, no manual chart building.

**Tagline:** "Upload once. Understand everything."

---

## The Problem

Indie developers are game makers, not data analysts. They:
- Don't know what metrics matter for their game type
- Don't know how to build retention curves or funnels
- Don't have time to configure dashboards
- Want answers, not tools

The system should act like having a data analyst on the team.

---

## Features

### 2.1 Instant Dashboard Generation
**Status:** Partially Done | **Priority:** Critical

Current: Game type detection + chart recommendations
Target: Complete auto-generated dashboard ready instantly

- [ ] **One-click dashboard** - Upload → See insights
- [ ] **Game-type-specific layouts:**
  - Puzzle: Level funnel, booster analysis, session length
  - Idle: Offline rewards, prestige funnel, progression speed
  - RPG: Character usage, item economy, story completion
  - Battle Royale: Match stats, weapon meta, skill distribution
  - Casual: Session patterns, ad engagement, simple retention
- [ ] **Smart chart selection** based on available columns
- [ ] **Automatic KPI calculation** from raw data
- [ ] **Benchmark comparisons** (industry standards)
- [ ] **Mobile-first responsive layouts**

### 2.2 AI Insight Engine (Enhanced)
**Status:** Partially Done | **Priority:** Critical

Current: Template-based insights
Target: Deep AI analysis with actionable recommendations

- [ ] **Pattern detection:**
  - Retention drop-offs ("D3 retention 40% below D1 - critical funnel issue")
  - Revenue anomalies ("Revenue spiked 300% on Dec 20 - was there a sale?")
  - Engagement patterns ("Peak playtime: 8pm-10pm weekdays")
  - Churn indicators ("Users who fail level 15 have 3x higher churn")
- [ ] **Comparative analysis:**
  - Week-over-week changes
  - Cohort comparisons
  - Before/after events
- [ ] **Natural language insights:**
  - "Your Day 7 retention is 15%, which is good for puzzle games"
  - "Players who use boosters have 2x higher LTV"
  - "Consider adding a checkpoint at level 12 - 60% of players quit there"
- [ ] **Prioritized recommendations:**
  - Impact score (potential revenue/retention lift)
  - Effort estimate (easy/medium/hard to implement)
  - Confidence level (based on data volume)

### 2.3 Automatic Metric Calculation
**Status:** New | **Priority:** Critical

Derive standard game metrics automatically:

- [ ] **Retention metrics:**
  - D1, D3, D7, D14, D30 retention
  - Rolling retention
  - Return rate
- [ ] **Engagement metrics:**
  - DAU, WAU, MAU
  - DAU/MAU ratio (stickiness)
  - Session count, session length
  - Sessions per user
- [ ] **Monetization metrics:**
  - ARPU, ARPPU
  - Conversion rate (free to paying)
  - LTV (projected)
  - Revenue by source (IAP, ads, subscriptions)
- [ ] **Progression metrics:**
  - Level completion rates
  - Time to milestone
  - Content consumption speed
  - Difficulty curve analysis
- [ ] **Quality metrics:**
  - Error rate
  - Crash rate
  - Load times

### 2.4 Smart Question Answering
**Status:** New | **Priority:** High

Natural language interface for data exploration:

- [ ] **Ask questions in plain English:**
  - "What's my retention this week?"
  - "Which level has the highest failure rate?"
  - "How much revenue did whales generate last month?"
  - "Compare iOS vs Android engagement"
- [ ] **Follow-up questions:**
  - "Break that down by country"
  - "Show me the trend over time"
  - "Why did that happen?"
- [ ] **Suggested questions** based on data:
  - "You might want to ask: 'What causes players to churn after level 10?'"
- [ ] **Query history** - quickly re-run past questions

### 2.5 Anomaly Detection
**Status:** New | **Priority:** High

Automatic detection of unusual patterns:

- [ ] **Revenue anomalies:**
  - Sudden spikes or drops
  - Unusual purchase patterns
  - Fraud indicators
- [ ] **Engagement anomalies:**
  - DAU drops
  - Session length changes
  - Unusual playtime patterns
- [ ] **Technical anomalies:**
  - Error rate spikes
  - Performance degradation
  - SDK issues
- [ ] **Alert system:**
  - In-app notifications
  - Email alerts (optional)
  - Configurable thresholds

### 2.6 Cohort Analysis (Automated)
**Status:** New | **Priority:** Medium

Automatic cohort generation and analysis:

- [ ] **Auto-generate cohorts by:**
  - Install date (weekly/monthly)
  - First purchase date
  - Acquisition source
  - Platform
  - Country
- [ ] **Cohort comparison charts:**
  - Retention curves per cohort
  - Revenue per cohort
  - Engagement per cohort
- [ ] **Best/worst cohort identification**
- [ ] **Cohort-specific insights**

### 2.7 Funnel Auto-Detection
**Status:** New | **Priority:** Medium

Automatically identify and analyze user funnels:

- [ ] **Detect progression funnels:**
  - Tutorial → First level → Level 10 → First purchase
  - Install → Registration → First session → Return
- [ ] **Calculate drop-off** at each step
- [ ] **Suggest optimizations** for high drop-off points
- [ ] **Compare funnel performance** over time

---

## Technical Implementation

### AI Enhancement Architecture
```
Data → Feature Extraction → ML Models → Insights →
Natural Language Generation → Prioritization → Display
```

### New AI Modules
```
src/ai/
├── InsightEngine.ts       # Enhanced insight generation
├── MetricCalculator.ts    # Auto-calculate standard metrics
├── AnomalyDetector.ts     # Pattern anomaly detection
├── CohortAnalyzer.ts      # Automatic cohort analysis
├── FunnelDetector.ts      # Auto-detect user funnels
├── QuestionAnswering.ts   # Natural language queries
├── BenchmarkData.ts       # Industry benchmarks
└── RecommendationEngine.ts # Prioritized suggestions
```

### LLM Integration
```typescript
// Enhanced prompt for game-specific insights
const systemPrompt = `
You are a senior game analytics expert. Analyze this data and provide:
1. Key metrics summary in plain English
2. Top 3 issues affecting retention/revenue
3. Top 3 opportunities to improve
4. Specific, actionable recommendations

Game type: ${gameType}
Available metrics: ${metrics.join(', ')}
Time range: ${dateRange}
`;
```

### Caching Strategy
- Pre-compute common metrics on data import
- Cache LLM responses for repeated queries
- Incremental updates for new data

---

## User Experience

### First-Time User Flow
1. Upload CSV
2. See loading animation: "Analyzing your game..."
3. Dashboard appears with:
   - 4 KPI cards (most important metrics)
   - 2 main charts (retention + revenue or engagement)
   - 3-5 AI insights with recommendations
   - "Ask a question" prompt
4. User immediately understands their game's health

### Returning User Flow
1. Open dashboard
2. See "What's new" summary since last visit
3. Any anomalies highlighted
4. Quick actions for common tasks

---

## Success Metrics

- **< 30 seconds** from upload to first insight
- **> 80%** of insights rated "useful" by users
- **Zero manual configuration** for standard dashboards
- **5+ actionable insights** per dataset

---

## Dependencies

- Phase 1: Clean, normalized data import

## Enables

- Phase 4: Community templates (share generated dashboards)
- Phase 5: Predictive analytics (build on metrics)

---

## Estimated Effort

| Component | Effort | Priority |
|-----------|--------|----------|
| Instant dashboard | Large | Critical |
| Enhanced insights | Large | Critical |
| Metric calculator | Medium | Critical |
| Question answering | Large | High |
| Anomaly detection | Medium | High |
| Cohort analysis | Medium | Medium |
| Funnel detection | Medium | Medium |

**Total:** ~6-8 weeks of focused development
