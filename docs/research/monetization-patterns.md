# Mobile Game Monetization Patterns

Research findings on optimal monetization strategies for mobile games, including ad placement, IAP timing, and player segmentation.

---

## 1. Ad Placement Optimization

### 1.1 Key Metrics for Ad Placement

| Column Name | Semantic Type | Description |
|-------------|---------------|-------------|
| `ad_type` | `ad_type` | interstitial, rewarded, banner |
| `ad_placement_id` | `ad_placement_id` | Unique identifier for placement context |
| `ad_trigger_event` | `event_name` | What triggered the ad (level_complete, death, etc.) |
| `session_depth` | `session_depth` | Number of actions/levels in current session |
| `time_in_session` | `session_duration` | Seconds since session start |
| `engagement_score` | `engagement_score` | Calculated player engagement |
| `frustration_score` | `frustration_score` | Calculated player frustration |
| `ad_viewed` | `boolean` | Whether ad was watched to completion |
| `ad_revenue` | `ad_revenue` | eCPM/revenue from ad impression |

### 1.2 Optimal Ad Timing Formula

```typescript
// Session depth score (0-1, higher = better time for ad)
function calculateSessionDepthScore(
  actionsThisSession: number,
  adsSeen: number,
  avgSessionLength: number
): number {
  if (actionsThisSession < 3) return 0;

  const sessionProgress = actionsThisSession / avgSessionLength;
  const adSaturation = adsSeen / actionsThisSession;

  // Peak at 40-60% session progress, decline after
  const progressScore = Math.exp(-Math.pow((sessionProgress - 0.5) * 3, 2));

  // Penalize if too many ads already shown
  const frequencyPenalty = Math.max(0, 1 - adSaturation * 3);

  return progressScore * frequencyPenalty;
}
```

### 1.3 Optimal Interstitial Timing

```typescript
const optimalInterstitialDepth = {
  minActions: 3,        // Never show before 3 meaningful actions
  sweetSpotStart: 5,    // Engagement peak begins
  sweetSpotEnd: 15,     // Before fatigue sets in
  maxFrequency: 1/3,    // Max 1 ad per 3 levels/actions
};
```

### 1.4 Interstitial vs Rewarded Video

**Interstitial Optimal Moments:**
- After level completion (not failure)
- After natural pause points (story scenes, loading)
- At session depth of 5-10 actions
- When engagement score > 0.6

**Rewarded Video Optimal Moments:**
- After failure (offer continue/extra life)
- When currency is low but not depleted
- Before hard content (offer boost)
- At daily reward claim (bonus multiplier)

### 1.5 Ad Placement Benchmarks

| Ad Type | Min Completion Rate | Max Retention Drop | Target eCPM (US) |
|---------|--------------------|--------------------|------------------|
| Interstitial | 85% | 5% | $15 |
| Rewarded | 95% | N/A | $25 |
| Banner | N/A | N/A | $2 |

---

## 2. Premium/IAP Offer Timing

### 2.1 First-Time Buyer Triggers

**Optimal First-Offer Timing:**
```typescript
interface FirstOfferTiming {
  // Trigger conditions (any one qualifies)
  minSessionsCompleted: 2;          // Not on first session
  minLevelReached: 5;               // Has experienced core loop
  minTimePlayedMinutes: 15;         // Investment established
  maxDaysSinceInstall: 7;           // While still engaged

  // Qualifier conditions (must meet all)
  hasCompletedTutorial: true;
  hasNotSeenOfferBefore: true;
  sessionEngagementScore: '>0.5';
}
```

### 2.2 Starter Pack Strategy

| User State | Offer Type | Discount | Urgency | Expiry |
|------------|------------|----------|---------|--------|
| High engagement + stuck | Aggressive starter pack | 80% | High | 24h |
| Qualified new user (D3-7) | Standard starter pack | 50% | Medium | 72h |
| Late window (D7+) | Light offer | 30% | Low | 168h |

### 2.3 Progression Wall Detection

```typescript
interface ProgressionWallMetrics {
  levelId: number;
  attempts: number;
  failures: number;
  avgAttemptsForLevel: number;   // Benchmark from all users
  timeAtLevel: number;           // Minutes stuck
  currencyAvailable: number;
  boostersAvailable: number;
}

// Wall severity classification
// Hard wall: attemptsRatio > 3, failureRate > 0.8, no resources
// Medium wall: attemptsRatio > 2, failureRate > 0.6
// Soft wall: attemptsRatio > 1.5, failureRate > 0.5
```

### 2.4 Wall Type Classification

| Wall Type | Quit Rate | Purchase Rate | Recommendation |
|-----------|-----------|---------------|----------------|
| Unintentional | > 40% | < 5% | Reduce difficulty or add hints |
| Monetization Gate | < 30% | > 10% | Working as intended, monitor churn |
| Intentional Challenge | < 20% | < 5% | Add rewarded video option |

---

## 3. Player Segmentation

### 3.1 Spending Segments

| Segment | LTV Threshold | Avg Purchase | Frequency | Behavior Signals |
|---------|---------------|--------------|-----------|------------------|
| Whale | $100+ | > $20 | > 2/month | Buys premium bundles, purchases during events |
| Dolphin | $20-100 | $5-20 | 1-2/month | Responds to sales, buys starter packs |
| Minnow | $1-20 | < $5 | 1-2 total | Single purchase, deep discounts only |
| Non-payer | $0 | $0 | 0 | Watches rewarded videos, high engagement |

### 3.2 Conversion Potential Signals

For non-payers, track these signals for conversion potential:
- Watches rewarded videos regularly
- High engagement but no spend
- Almost purchased (abandoned cart)
- Currency hoarder behavior

### 3.3 Churn Prevention Offers

| Risk Level | Segment | Offer Type | Discount | Urgency | Expiry |
|------------|---------|------------|----------|---------|--------|
| High | Whale | VIP retention bundle | 30% | High | 24h |
| Medium | Dolphin | Comeback currency pack | 50% | Medium | 72h |
| High | Non-payer | Flash starter pack | 80% | High | 12h |

---

## 4. Key Monetization Metrics

### 4.1 ARPDAU Calculation

```typescript
ARPDAU = (IAP Revenue + Ad Revenue) / DAU

// Breakdown
ARPDAU_IAP = IAP Revenue / DAU
ARPDAU_Ads = Ad Revenue / DAU
```

**Industry Benchmarks:**
- Hyper-casual: $0.05-0.15 ARPDAU (90% ads)
- Casual/Puzzle: $0.10-0.30 ARPDAU (60% IAP, 40% ads)
- Midcore: $0.20-0.50 ARPDAU (80% IAP)
- Hardcore/RPG: $0.50-2.00 ARPDAU (95% IAP)

### 4.2 Conversion Metrics

| Metric | Formula | Benchmark |
|--------|---------|-----------|
| Conversion Rate | Payers / Total Users | 2-5% |
| Time to First Purchase | Hours from install to first buy | 24-72h |
| Avg Purchase Value | Total Revenue / # Purchases | $3-10 |
| Paying User ARPDAU | Revenue / Paying DAU | 10-50x non-payer |

### 4.3 Ad Metrics

| Metric | Formula | Benchmark |
|--------|---------|-----------|
| eCPM | (Revenue / Impressions) * 1000 | $5-25 |
| Fill Rate | Filled Requests / Total Requests | > 95% |
| Ads per Session | Ad Impressions / Sessions | 2-5 |
| Rewarded Opt-in Rate | Rewarded Starts / Eligible Users | 30%+ |

---

## 5. Currency Economy Analysis

### 5.1 Sink/Source Balance

```typescript
// Healthy economy: 0.85 <= sinkToSourceRatio <= 1.15
sinkToSourceRatio = totalSpent / totalEarned

// Warning signs
if (ratio < 0.85) → Inflation (add sinks)
if (ratio > 1.15) → Deflation (add sources)
```

### 5.2 Economy Health Indicators

| Status | Sink/Source Ratio | Recommendation |
|--------|-------------------|----------------|
| Healthy | 0.85 - 1.15 | Monitor for changes |
| Inflation | < 0.85 | Add currency sinks: limited-time items, upgrades |
| Deflation | > 1.15 | Add currency sources: daily rewards, achievements |

### 5.3 Currency Depletion Triggers

```typescript
// Offer timing based on currency state
if (balance < neededForNextItem && daysUntilDepletion < 1) {
  → Show currency bundle offer (60% discount, high urgency)
}

if (spentToday > earnedToday * 1.5 && daysUntilDepletion < 3) {
  → Show economy pack offer (40% discount, medium urgency)
}
```

---

## 6. Session Analysis

### 6.1 Session End Classification

| End Type | Signals | Action |
|----------|---------|--------|
| Natural End | Completed goals, long session | Normal |
| Rage Quit | Failed level, exit < 5 seconds | Track, reduce difficulty |
| Frustration Exit | 3+ failures in 5 minutes | Offer help/boost |
| Ad Exit | Left after ad impression | Reduce ad frequency |
| Offer Exit | Left after seeing offer | Adjust offer timing |
| Time Constrained | Regular intervals (work/school) | Send push notifications |

### 6.2 Engagement Score Formula

```typescript
// 0-100 score with 4 components (25 points each)
Recency = 25 - (hoursSinceLastSession / 24) * 5
Frequency = weeklyActiveRatio * 25
Duration = min(25, avgSessionLength / 30 * 25)
Depth = levelScore(10) + featureScore(10) + socialScore(5)

// Tier classification
Super: 80+
Core: 60-79
Regular: 40-59
Casual: 20-39
Dormant: < 20
```

---

## 7. Implementation in Game Insights

All these patterns are implemented in `src/ai/MonetizationAnalyzer.ts`:

```typescript
import { MonetizationAnalyzer } from '@/ai';

const analyzer = new MonetizationAnalyzer();

// Get ad timing recommendation
const adTiming = analyzer.getOptimalAdTiming(userFeatures);

// Get IAP offer recommendation
const offer = analyzer.getOptimalOfferTiming(userFeatures);

// Detect progression walls
const walls = analyzer.analyzeProgressionWalls(levelData);

// Analyze economy health
const economy = analyzer.analyzeEconomyHealth(transactions);

// Calculate ARPDAU
const arpdau = analyzer.calculateARPDAU(dailyData);

// Classify spending segment
const segment = analyzer.classifySpendingSegment(userFeatures);
```
