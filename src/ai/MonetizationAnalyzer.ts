/**
 * MonetizationAnalyzer
 * Analyzes monetization patterns and opportunities in mobile games
 * Provides ad placement optimization, IAP timing, and economy analysis
 */

import { NormalizedData } from '../types';

// Types
export interface AdPlacementMetrics {
  placementId: string;
  placementType: 'interstitial' | 'rewarded' | 'banner';
  placementContext: string;
  impressions: number;
  completions: number;
  completionRate: number;
  revenue: number;
  ecpm: number;
  fillRate: number;
  retentionImpact: number;
}

export interface AdTimingRecommendation {
  showAd: boolean;
  adType: 'interstitial' | 'rewarded' | 'none';
  confidence: number;
  reason: string;
  sessionDepthScore: number;
  engagementScore: number;
}

export interface OfferRecommendation {
  showOffer: boolean;
  offerType: 'starter_pack' | 'currency_bundle' | 'level_skip' | 'vip_retention' | 'flash_sale' | 'none';
  discountPercent: number;
  urgency: 'low' | 'medium' | 'high';
  expiryHours: number;
  reason: string;
}

export interface ProgressionWall {
  levelId: number;
  attempts: number;
  successRate: number;
  avgAttemptTime: number;
  quitRate: number;
  purchaseRate: number;
  boosterUsageRate: number;
  wallSeverity: 'soft' | 'medium' | 'hard';
  wallType: 'intentional' | 'unintentional' | 'monetization_gate';
  recommendation: string;
}

export interface EconomyHealth {
  date: string;
  softCurrencyEarned: number;
  softCurrencySpent: number;
  netFlow: number;
  sinkToSourceRatio: number;
  avgPlayerBalance: number;
  status: 'healthy' | 'inflation' | 'deflation';
  recommendation: string;
}

export interface ARPDAUMetrics {
  date: string;
  dau: number;
  iapRevenue: number;
  adRevenue: number;
  totalRevenue: number;
  arpdau: number;
  arpdauIAP: number;
  arpdauAds: number;
}

export interface UserMonetizationFeatures {
  userId: string;
  isPayer: boolean;
  totalSpend: number;
  daysSinceInstall: number;
  sessionCount: number;
  currentLevel: number;
  recentSuccessRate: number;
  recentFailureRate: number;
  sessionTimeMinutes: number;
  currencyBalance: number;
  boostersAvailable: number;
  adsSeen: number;
  weeklyActiveRatio: number;
  churnProbability?: number;
  ltvPrediction?: number;
}

export interface SpendingSegment {
  segment: 'whale' | 'dolphin' | 'minnow' | 'non_payer';
  ltvThreshold: number;
  avgPurchaseValue: number;
  purchaseFrequency: number;
}

// Ad placement benchmarks by geo
const AD_BENCHMARKS = {
  interstitial: {
    minCompletionRate: 0.85,
    maxRetentionDrop: 0.05,
    targetECPM: { us: 15, eu: 12, row: 5 },
  },
  rewarded: {
    minCompletionRate: 0.95,
    optInRate: 0.30,
    targetECPM: { us: 25, eu: 20, row: 10 },
  },
  banner: {
    targetECPM: { us: 2, eu: 1.5, row: 0.5 },
  },
};

// Spending segment thresholds
const SPENDING_THRESHOLDS = {
  whale: { ltv: 100, avgPurchase: 20 },
  dolphin: { ltv: 20, avgPurchase: 5 },
  minnow: { ltv: 1, avgPurchase: 1 },
};

export class MonetizationAnalyzer {
  /**
   * Calculate optimal ad timing based on session state
   */
  getOptimalAdTiming(user: UserMonetizationFeatures): AdTimingRecommendation {
    const sessionDepthScore = this.calculateSessionDepthScore(
      user.sessionCount,
      user.adsSeen,
      10 // avg session length in actions
    );

    const engagementScore = this.calculateEngagementScore(user);
    const frustrationScore = this.calculateFrustrationScore(user);

    // Never show ads to new users in first session
    if (user.sessionCount < 2 || user.sessionTimeMinutes < 1) {
      return {
        showAd: false,
        adType: 'none',
        confidence: 0.9,
        reason: 'too_early_in_experience',
        sessionDepthScore,
        engagementScore,
      };
    }

    // High engagement + low frustration = good for interstitial
    if (engagementScore > 0.6 && frustrationScore < 0.3) {
      return {
        showAd: true,
        adType: 'interstitial',
        confidence: engagementScore,
        reason: 'high_engagement_low_frustration',
        sessionDepthScore,
        engagementScore,
      };
    }

    // Frustrated player = offer rewarded video as help
    if (frustrationScore > 0.5) {
      return {
        showAd: true,
        adType: 'rewarded',
        confidence: 0.7,
        reason: 'frustrated_player_needs_help',
        sessionDepthScore,
        engagementScore,
      };
    }

    // Session depth check
    if (sessionDepthScore > 0.5) {
      return {
        showAd: true,
        adType: 'interstitial',
        confidence: sessionDepthScore,
        reason: 'optimal_session_depth',
        sessionDepthScore,
        engagementScore,
      };
    }

    return {
      showAd: false,
      adType: 'none',
      confidence: 0.6,
      reason: 'wait_for_better_timing',
      sessionDepthScore,
      engagementScore,
    };
  }

  /**
   * Calculate optimal offer timing for IAP
   */
  getOptimalOfferTiming(user: UserMonetizationFeatures): OfferRecommendation {
    // Already a payer - different offers
    if (user.isPayer) {
      return this.getPayerOffer(user);
    }

    // Too early - user hasn't experienced value
    if (user.sessionCount < 2 || user.currentLevel < 5) {
      return {
        showOffer: false,
        offerType: 'none',
        discountPercent: 0,
        urgency: 'low',
        expiryHours: 0,
        reason: 'too_early',
      };
    }

    // Starter pack window (days 1-7)
    if (user.daysSinceInstall <= 7) {
      // High engagement + stuck = aggressive offer
      if (user.weeklyActiveRatio > 0.7 && user.recentFailureRate > 0.4) {
        return {
          showOffer: true,
          offerType: 'starter_pack',
          discountPercent: 80,
          urgency: 'high',
          expiryHours: 24,
          reason: 'high_engagement_stuck',
        };
      }

      // Standard qualified user
      if (user.sessionCount >= 3) {
        return {
          showOffer: true,
          offerType: 'starter_pack',
          discountPercent: 50,
          urgency: 'medium',
          expiryHours: 72,
          reason: 'qualified_new_user',
        };
      }
    }

    // Progression wall detected
    const wall = this.detectProgressionWallForUser(user);
    if (wall) {
      return {
        showOffer: true,
        offerType: wall.wallSeverity === 'hard' ? 'currency_bundle' : 'level_skip',
        discountPercent: wall.wallSeverity === 'hard' ? 60 : 40,
        urgency: wall.wallSeverity === 'hard' ? 'high' : 'medium',
        expiryHours: wall.wallSeverity === 'hard' ? 12 : 48,
        reason: `progression_wall_${wall.wallSeverity}`,
      };
    }

    // Currency depletion
    if (user.currencyBalance < 100 && user.boostersAvailable === 0) {
      return {
        showOffer: true,
        offerType: 'currency_bundle',
        discountPercent: 50,
        urgency: 'medium',
        expiryHours: 48,
        reason: 'currency_depleted',
      };
    }

    // Churn risk intervention
    if (user.churnProbability && user.churnProbability > 0.6) {
      return {
        showOffer: true,
        offerType: 'flash_sale',
        discountPercent: 70,
        urgency: 'high',
        expiryHours: 12,
        reason: 'churn_prevention',
      };
    }

    return {
      showOffer: false,
      offerType: 'none',
      discountPercent: 0,
      urgency: 'low',
      expiryHours: 0,
      reason: 'not_qualified',
    };
  }

  /**
   * Analyze level difficulty and detect progression walls
   */
  analyzeProgressionWalls(levelData: Array<{
    levelId: number;
    attempts: number;
    successes: number;
    avgDuration: number;
    quits: number;
    purchases: number;
    boosterUses: number;
  }>): ProgressionWall[] {
    // Calculate global baseline
    const globalSuccessRate = levelData.reduce((sum, l) => sum + (l.successes / l.attempts), 0) / levelData.length;

    return levelData.map(level => {
      const successRate = level.successes / level.attempts;
      const quitRate = level.quits / level.attempts;
      const purchaseRate = level.purchases / level.attempts;
      const boosterUsageRate = level.boosterUses / level.attempts;

      const isDifficultySpike = successRate < globalSuccessRate * 0.6;

      // Classify wall type
      let wallSeverity: 'soft' | 'medium' | 'hard';
      let wallType: 'intentional' | 'unintentional' | 'monetization_gate';

      if (quitRate > 0.4 && purchaseRate < 0.05) {
        wallSeverity = 'hard';
        wallType = 'unintentional'; // Too hard, losing players
      } else if (purchaseRate > 0.1 && quitRate < 0.3) {
        wallSeverity = successRate < 0.3 ? 'hard' : 'medium';
        wallType = 'monetization_gate'; // Designed hard, converts
      } else if (successRate < globalSuccessRate * 0.7) {
        wallSeverity = 'medium';
        wallType = 'intentional'; // Challenge level
      } else {
        wallSeverity = 'soft';
        wallType = 'intentional';
      }

      const recommendation = this.getWallRecommendation(wallType, quitRate, purchaseRate);

      return {
        levelId: level.levelId,
        attempts: level.attempts,
        successRate,
        avgAttemptTime: level.avgDuration,
        quitRate,
        purchaseRate,
        boosterUsageRate,
        wallSeverity: isDifficultySpike ? wallSeverity : 'soft',
        wallType,
        recommendation,
      };
    }).filter(wall => wall.successRate < globalSuccessRate * 0.8);
  }

  /**
   * Analyze economy health (currency sources vs sinks)
   */
  analyzeEconomyHealth(transactions: Array<{
    type: 'earn' | 'spend';
    amount: number;
    userId: string;
  }>): EconomyHealth {
    const earned = transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0);
    const spent = transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0);
    const sinkToSourceRatio = earned > 0 ? spent / earned : 0;

    // Calculate player balances
    const balanceByUser: Record<string, number> = {};
    transactions.forEach(t => {
      if (!balanceByUser[t.userId]) balanceByUser[t.userId] = 0;
      balanceByUser[t.userId] += t.type === 'earn' ? t.amount : -t.amount;
    });
    const balances = Object.values(balanceByUser);
    const avgBalance = balances.reduce((a, b) => a + b, 0) / balances.length;

    let status: 'healthy' | 'inflation' | 'deflation';
    let recommendation: string;

    if (sinkToSourceRatio < 0.85) {
      status = 'inflation';
      recommendation = 'Add currency sinks: limited-time items, upgrade costs, cosmetics';
    } else if (sinkToSourceRatio > 1.15) {
      status = 'deflation';
      recommendation = 'Add currency sources: daily rewards, achievements, quests';
    } else {
      status = 'healthy';
      recommendation = 'Economy is balanced. Monitor for changes.';
    }

    return {
      date: new Date().toISOString().split('T')[0],
      softCurrencyEarned: earned,
      softCurrencySpent: spent,
      netFlow: earned - spent,
      sinkToSourceRatio,
      avgPlayerBalance: avgBalance,
      status,
      recommendation,
    };
  }

  /**
   * Calculate ARPDAU (Average Revenue Per Daily Active User)
   */
  calculateARPDAU(dailyData: Array<{
    date: string;
    uniqueUsers: number;
    iapRevenue: number;
    adRevenue: number;
  }>): ARPDAUMetrics[] {
    return dailyData.map(day => ({
      date: day.date,
      dau: day.uniqueUsers,
      iapRevenue: day.iapRevenue,
      adRevenue: day.adRevenue,
      totalRevenue: day.iapRevenue + day.adRevenue,
      arpdau: day.uniqueUsers > 0 ? (day.iapRevenue + day.adRevenue) / day.uniqueUsers : 0,
      arpdauIAP: day.uniqueUsers > 0 ? day.iapRevenue / day.uniqueUsers : 0,
      arpdauAds: day.uniqueUsers > 0 ? day.adRevenue / day.uniqueUsers : 0,
    }));
  }

  /**
   * Segment users by spending behavior
   */
  classifySpendingSegment(user: UserMonetizationFeatures): SpendingSegment {
    const ltv = user.ltvPrediction || user.totalSpend;

    if (ltv >= SPENDING_THRESHOLDS.whale.ltv) {
      return {
        segment: 'whale',
        ltvThreshold: SPENDING_THRESHOLDS.whale.ltv,
        avgPurchaseValue: SPENDING_THRESHOLDS.whale.avgPurchase,
        purchaseFrequency: 2, // per month
      };
    }

    if (ltv >= SPENDING_THRESHOLDS.dolphin.ltv) {
      return {
        segment: 'dolphin',
        ltvThreshold: SPENDING_THRESHOLDS.dolphin.ltv,
        avgPurchaseValue: SPENDING_THRESHOLDS.dolphin.avgPurchase,
        purchaseFrequency: 1,
      };
    }

    if (ltv >= SPENDING_THRESHOLDS.minnow.ltv) {
      return {
        segment: 'minnow',
        ltvThreshold: SPENDING_THRESHOLDS.minnow.ltv,
        avgPurchaseValue: SPENDING_THRESHOLDS.minnow.avgPurchase,
        purchaseFrequency: 0.5,
      };
    }

    return {
      segment: 'non_payer',
      ltvThreshold: 0,
      avgPurchaseValue: 0,
      purchaseFrequency: 0,
    };
  }

  /**
   * Analyze ad placements from data
   */
  analyzeAdPlacements(data: NormalizedData): AdPlacementMetrics[] {
    const adEvents = data.events?.filter(e =>
      e.eventType?.toLowerCase().includes('ad') ||
      e.eventName?.toLowerCase().includes('ad')
    ) || [];

    // Group by placement
    const byPlacement: Record<string, typeof adEvents> = {};
    adEvents.forEach(event => {
      const placementId = String(event.adPlacement || event.adType || 'unknown');
      if (!byPlacement[placementId]) byPlacement[placementId] = [];
      byPlacement[placementId].push(event);
    });

    return Object.entries(byPlacement).map(([placementId, events]) => {
      const impressions = events.length;
      const completions = events.filter(e => e.adCompleted === true).length;
      const revenue = events.reduce((sum, e) => sum + (Number(e.adRevenue) || 0), 0);

      return {
        placementId,
        placementType: this.inferAdType(placementId),
        placementContext: placementId,
        impressions,
        completions,
        completionRate: impressions > 0 ? completions / impressions : 0,
        revenue,
        ecpm: impressions > 0 ? (revenue / impressions) * 1000 : 0,
        fillRate: 1, // Would need request data to calculate
        retentionImpact: 0, // Would need retention data to calculate
      };
    });
  }

  // Private helper methods

  private calculateSessionDepthScore(
    actionsThisSession: number,
    adsSeen: number,
    avgSessionLength: number
  ): number {
    if (actionsThisSession < 3) return 0;

    const sessionProgress = actionsThisSession / avgSessionLength;
    const adSaturation = adsSeen / actionsThisSession;

    // Peak at 40-60% session progress
    const progressScore = Math.exp(-Math.pow((sessionProgress - 0.5) * 3, 2));

    // Penalize if too many ads already shown
    const frequencyPenalty = Math.max(0, 1 - adSaturation * 3);

    return progressScore * frequencyPenalty;
  }

  private calculateEngagementScore(user: UserMonetizationFeatures): number {
    const successWeight = 0.3;
    const timeWeight = 0.3;
    const progressWeight = 0.4;

    const successScore = user.recentSuccessRate;
    const timeScore = Math.min(user.sessionTimeMinutes / 10, 1);
    const progressScore = Math.min(user.currentLevel / 20, 1);

    return successScore * successWeight + timeScore * timeWeight + progressScore * progressWeight;
  }

  private calculateFrustrationScore(user: UserMonetizationFeatures): number {
    const failureWeight = 0.5;
    const resourceWeight = 0.3;
    const stuckWeight = 0.2;

    const failureScore = user.recentFailureRate;
    const resourceScore = user.currencyBalance < 50 ? 1 : user.currencyBalance < 200 ? 0.5 : 0;
    const stuckScore = user.boostersAvailable === 0 && user.recentFailureRate > 0.5 ? 1 : 0;

    return failureScore * failureWeight + resourceScore * resourceWeight + stuckScore * stuckWeight;
  }

  private detectProgressionWallForUser(user: UserMonetizationFeatures): ProgressionWall | null {
    // Simplified wall detection for a single user
    if (user.recentFailureRate > 0.6 && user.currencyBalance < 100 && user.boostersAvailable === 0) {
      return {
        levelId: user.currentLevel,
        attempts: 5, // Assumed
        successRate: 1 - user.recentFailureRate,
        avgAttemptTime: 60,
        quitRate: 0.2,
        purchaseRate: 0,
        boosterUsageRate: 0,
        wallSeverity: 'hard',
        wallType: 'monetization_gate',
        recommendation: 'Offer currency bundle with boosters',
      };
    }

    if (user.recentFailureRate > 0.4) {
      return {
        levelId: user.currentLevel,
        attempts: 3,
        successRate: 1 - user.recentFailureRate,
        avgAttemptTime: 60,
        quitRate: 0.1,
        purchaseRate: 0,
        boosterUsageRate: 0,
        wallSeverity: 'medium',
        wallType: 'intentional',
        recommendation: 'Show rewarded video for boost',
      };
    }

    return null;
  }

  private getPayerOffer(user: UserMonetizationFeatures): OfferRecommendation {
    const segment = this.classifySpendingSegment(user);

    // Whale retention
    if (segment.segment === 'whale' && user.churnProbability && user.churnProbability > 0.4) {
      return {
        showOffer: true,
        offerType: 'vip_retention',
        discountPercent: 30,
        urgency: 'high',
        expiryHours: 24,
        reason: 'whale_retention',
      };
    }

    // Dolphin upsell
    if (segment.segment === 'dolphin') {
      return {
        showOffer: true,
        offerType: 'currency_bundle',
        discountPercent: 40,
        urgency: 'low',
        expiryHours: 168, // 1 week
        reason: 'dolphin_upsell',
      };
    }

    return {
      showOffer: false,
      offerType: 'none',
      discountPercent: 0,
      urgency: 'low',
      expiryHours: 0,
      reason: 'payer_no_offer_needed',
    };
  }

  private getWallRecommendation(wallType: string, quitRate: number, purchaseRate: number): string {
    if (wallType === 'unintentional' && quitRate > 0.3) {
      return 'CRITICAL: Reduce difficulty or add more hints. Losing too many players.';
    }

    if (wallType === 'monetization_gate' && purchaseRate > 0.1) {
      return 'Working as intended. Monitor for excessive churn.';
    }

    if (purchaseRate < 0.02 && quitRate > 0.2) {
      return 'Consider adding rewarded video option for boost.';
    }

    return 'Monitor level performance.';
  }

  private inferAdType(placementId: string): 'interstitial' | 'rewarded' | 'banner' {
    const lower = placementId.toLowerCase();
    if (lower.includes('reward')) return 'rewarded';
    if (lower.includes('banner')) return 'banner';
    return 'interstitial';
  }
}

export const monetizationAnalyzer = new MonetizationAnalyzer();
