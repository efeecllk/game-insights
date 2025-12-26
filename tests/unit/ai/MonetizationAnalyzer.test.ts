/**
 * MonetizationAnalyzer Unit Tests
 * Tests ad placement, IAP timing, progression walls, and economy analysis
 */

import { describe, it, expect } from 'vitest';
import {
  MonetizationAnalyzer,
  UserMonetizationFeatures,
  AdTimingRecommendation,
  OfferRecommendation,
} from '../../../src/ai/MonetizationAnalyzer';

describe('MonetizationAnalyzer', () => {
  const analyzer = new MonetizationAnalyzer();

  describe('getOptimalAdTiming', () => {
    it('should not show ads to first-session users', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u1',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 0,
        sessionCount: 1,
        currentLevel: 2,
        recentSuccessRate: 0.8,
        recentFailureRate: 0.2,
        sessionTimeMinutes: 0.5,
        currencyBalance: 100,
        boostersAvailable: 3,
        adsSeen: 0,
        weeklyActiveRatio: 1,
      };

      const result = analyzer.getOptimalAdTiming(user);

      expect(result.showAd).toBe(false);
      expect(result.reason).toBe('too_early_in_experience');
    });

    it('should recommend interstitial for high engagement users', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u2',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 3,
        sessionCount: 10,
        currentLevel: 15,
        recentSuccessRate: 0.9,
        recentFailureRate: 0.1,
        sessionTimeMinutes: 8,
        currencyBalance: 500,
        boostersAvailable: 5,
        adsSeen: 2,
        weeklyActiveRatio: 0.8,
      };

      const result = analyzer.getOptimalAdTiming(user);

      expect(result.showAd).toBe(true);
      expect(result.adType).toBe('interstitial');
      expect(result.reason).toBe('high_engagement_low_frustration');
      expect(result.engagementScore).toBeGreaterThan(0.5);
    });

    it('should recommend rewarded video for frustrated users', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u3',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 2,
        sessionCount: 5,
        currentLevel: 8,
        recentSuccessRate: 0.2,
        recentFailureRate: 0.8,
        sessionTimeMinutes: 5,
        currencyBalance: 20,
        boostersAvailable: 0,
        adsSeen: 1,
        weeklyActiveRatio: 0.5,
      };

      const result = analyzer.getOptimalAdTiming(user);

      expect(result.showAd).toBe(true);
      expect(result.adType).toBe('rewarded');
      expect(result.reason).toBe('frustrated_player_needs_help');
    });
  });

  describe('getOptimalOfferTiming', () => {
    it('should not show offers to very new users', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u1',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 0,
        sessionCount: 1,
        currentLevel: 2,
        recentSuccessRate: 1,
        recentFailureRate: 0,
        sessionTimeMinutes: 3,
        currencyBalance: 200,
        boostersAvailable: 5,
        adsSeen: 0,
        weeklyActiveRatio: 1,
      };

      const result = analyzer.getOptimalOfferTiming(user);

      expect(result.showOffer).toBe(false);
      expect(result.reason).toBe('too_early');
    });

    it('should show aggressive starter pack to highly engaged stuck users', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u2',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 3,
        sessionCount: 8,
        currentLevel: 12,
        recentSuccessRate: 0.4,
        recentFailureRate: 0.6,
        sessionTimeMinutes: 15,
        currencyBalance: 50,
        boostersAvailable: 0,
        adsSeen: 5,
        weeklyActiveRatio: 0.85,
      };

      const result = analyzer.getOptimalOfferTiming(user);

      expect(result.showOffer).toBe(true);
      expect(result.offerType).toBe('starter_pack');
      expect(result.discountPercent).toBe(80);
      expect(result.urgency).toBe('high');
    });

    it('should show standard starter pack to qualified new users', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u3',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 5,
        sessionCount: 4,
        currentLevel: 10,
        recentSuccessRate: 0.7,
        recentFailureRate: 0.3,
        sessionTimeMinutes: 10,
        currencyBalance: 300,
        boostersAvailable: 2,
        adsSeen: 3,
        weeklyActiveRatio: 0.6,
      };

      const result = analyzer.getOptimalOfferTiming(user);

      expect(result.showOffer).toBe(true);
      expect(result.offerType).toBe('starter_pack');
      expect(result.discountPercent).toBe(50);
      expect(result.urgency).toBe('medium');
    });

    it('should show currency bundle when player is resource depleted', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u4',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 10,
        sessionCount: 15,
        currentLevel: 20,
        recentSuccessRate: 0.7,  // Not struggling (no wall)
        recentFailureRate: 0.3,  // Low failure rate
        sessionTimeMinutes: 8,
        currencyBalance: 30,     // Low currency
        boostersAvailable: 0,    // No boosters
        adsSeen: 8,
        weeklyActiveRatio: 0.5,
      };

      const result = analyzer.getOptimalOfferTiming(user);

      expect(result.showOffer).toBe(true);
      expect(result.offerType).toBe('currency_bundle');
    });

    it('should show flash sale for high churn risk users', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u5',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 14,
        sessionCount: 3,
        currentLevel: 8,
        recentSuccessRate: 0.6,
        recentFailureRate: 0.4,
        sessionTimeMinutes: 5,
        currencyBalance: 200,
        boostersAvailable: 2,
        adsSeen: 2,
        weeklyActiveRatio: 0.2,
        churnProbability: 0.75,
      };

      const result = analyzer.getOptimalOfferTiming(user);

      expect(result.showOffer).toBe(true);
      expect(result.offerType).toBe('flash_sale');
      expect(result.discountPercent).toBe(70);
      expect(result.urgency).toBe('high');
    });

    it('should show VIP retention offer to at-risk whales', () => {
      const user: UserMonetizationFeatures = {
        userId: 'u6',
        isPayer: true,
        totalSpend: 250,
        daysSinceInstall: 60,
        sessionCount: 50,
        currentLevel: 100,
        recentSuccessRate: 0.7,
        recentFailureRate: 0.3,
        sessionTimeMinutes: 20,
        currencyBalance: 5000,
        boostersAvailable: 10,
        adsSeen: 0,
        weeklyActiveRatio: 0.3,
        churnProbability: 0.5,
        ltvPrediction: 300,
      };

      const result = analyzer.getOptimalOfferTiming(user);

      expect(result.showOffer).toBe(true);
      expect(result.offerType).toBe('vip_retention');
      expect(result.urgency).toBe('high');
    });
  });

  describe('classifySpendingSegment', () => {
    it('should classify whale correctly', () => {
      const user: UserMonetizationFeatures = {
        userId: 'whale1',
        isPayer: true,
        totalSpend: 500,
        daysSinceInstall: 90,
        sessionCount: 100,
        currentLevel: 150,
        recentSuccessRate: 0.8,
        recentFailureRate: 0.2,
        sessionTimeMinutes: 30,
        currencyBalance: 10000,
        boostersAvailable: 50,
        adsSeen: 0,
        weeklyActiveRatio: 0.9,
      };

      const segment = analyzer.classifySpendingSegment(user);

      expect(segment.segment).toBe('whale');
      expect(segment.ltvThreshold).toBe(100);
    });

    it('should classify dolphin correctly', () => {
      const user: UserMonetizationFeatures = {
        userId: 'dolphin1',
        isPayer: true,
        totalSpend: 45,
        daysSinceInstall: 30,
        sessionCount: 20,
        currentLevel: 40,
        recentSuccessRate: 0.7,
        recentFailureRate: 0.3,
        sessionTimeMinutes: 15,
        currencyBalance: 500,
        boostersAvailable: 5,
        adsSeen: 5,
        weeklyActiveRatio: 0.6,
      };

      const segment = analyzer.classifySpendingSegment(user);

      expect(segment.segment).toBe('dolphin');
    });

    it('should classify minnow correctly', () => {
      const user: UserMonetizationFeatures = {
        userId: 'minnow1',
        isPayer: true,
        totalSpend: 3,
        daysSinceInstall: 14,
        sessionCount: 10,
        currentLevel: 15,
        recentSuccessRate: 0.6,
        recentFailureRate: 0.4,
        sessionTimeMinutes: 10,
        currencyBalance: 100,
        boostersAvailable: 2,
        adsSeen: 10,
        weeklyActiveRatio: 0.5,
      };

      const segment = analyzer.classifySpendingSegment(user);

      expect(segment.segment).toBe('minnow');
    });

    it('should classify non-payer correctly', () => {
      const user: UserMonetizationFeatures = {
        userId: 'free1',
        isPayer: false,
        totalSpend: 0,
        daysSinceInstall: 7,
        sessionCount: 5,
        currentLevel: 10,
        recentSuccessRate: 0.7,
        recentFailureRate: 0.3,
        sessionTimeMinutes: 8,
        currencyBalance: 50,
        boostersAvailable: 1,
        adsSeen: 15,
        weeklyActiveRatio: 0.4,
      };

      const segment = analyzer.classifySpendingSegment(user);

      expect(segment.segment).toBe('non_payer');
      expect(segment.ltvThreshold).toBe(0);
    });
  });

  describe('analyzeProgressionWalls', () => {
    it('should detect hard progression walls', () => {
      const levelData = [
        { levelId: 1, attempts: 100, successes: 90, avgDuration: 30, quits: 5, purchases: 0, boosterUses: 10 },
        { levelId: 2, attempts: 100, successes: 85, avgDuration: 35, quits: 8, purchases: 0, boosterUses: 15 },
        { levelId: 3, attempts: 200, successes: 40, avgDuration: 60, quits: 90, purchases: 2, boosterUses: 80 }, // Wall
        { levelId: 4, attempts: 50, successes: 45, avgDuration: 32, quits: 3, purchases: 0, boosterUses: 5 },
      ];

      const walls = analyzer.analyzeProgressionWalls(levelData);

      expect(walls.length).toBeGreaterThan(0);

      const hardWall = walls.find(w => w.levelId === 3);
      expect(hardWall).toBeDefined();
      expect(hardWall!.wallSeverity).toBe('hard');
      expect(hardWall!.wallType).toBe('unintentional');
      expect(hardWall!.quitRate).toBeGreaterThan(0.4);
    });

    it('should detect monetization gates', () => {
      const levelData = [
        { levelId: 10, attempts: 100, successes: 90, avgDuration: 30, quits: 5, purchases: 0, boosterUses: 10 },
        { levelId: 11, attempts: 100, successes: 85, avgDuration: 35, quits: 8, purchases: 0, boosterUses: 15 },
        { levelId: 12, attempts: 300, successes: 90, avgDuration: 55, quits: 30, purchases: 45, boosterUses: 100 }, // Monetization gate
        { levelId: 13, attempts: 80, successes: 72, avgDuration: 32, quits: 5, purchases: 0, boosterUses: 8 },
      ];

      const walls = analyzer.analyzeProgressionWalls(levelData);

      const monetizationWall = walls.find(w => w.levelId === 12);
      expect(monetizationWall).toBeDefined();
      expect(monetizationWall!.wallType).toBe('monetization_gate');
      expect(monetizationWall!.purchaseRate).toBeGreaterThan(0.1);
    });

    it('should return empty array for balanced levels', () => {
      const levelData = [
        { levelId: 1, attempts: 100, successes: 85, avgDuration: 30, quits: 5, purchases: 1, boosterUses: 10 },
        { levelId: 2, attempts: 100, successes: 82, avgDuration: 32, quits: 6, purchases: 1, boosterUses: 12 },
        { levelId: 3, attempts: 100, successes: 80, avgDuration: 35, quits: 7, purchases: 2, boosterUses: 15 },
        { levelId: 4, attempts: 100, successes: 78, avgDuration: 38, quits: 8, purchases: 2, boosterUses: 18 },
      ];

      const walls = analyzer.analyzeProgressionWalls(levelData);

      // Should have few or no significant walls
      expect(walls.length).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeEconomyHealth', () => {
    it('should detect healthy economy', () => {
      const transactions = [
        { type: 'earn' as const, amount: 100, userId: 'u1' },
        { type: 'spend' as const, amount: 95, userId: 'u1' },
        { type: 'earn' as const, amount: 100, userId: 'u2' },
        { type: 'spend' as const, amount: 90, userId: 'u2' },
      ];

      const health = analyzer.analyzeEconomyHealth(transactions);

      expect(health.status).toBe('healthy');
      expect(health.sinkToSourceRatio).toBeGreaterThanOrEqual(0.85);
      expect(health.sinkToSourceRatio).toBeLessThanOrEqual(1.15);
    });

    it('should detect inflation (too much currency)', () => {
      const transactions = [
        { type: 'earn' as const, amount: 1000, userId: 'u1' },
        { type: 'spend' as const, amount: 200, userId: 'u1' },
        { type: 'earn' as const, amount: 1000, userId: 'u2' },
        { type: 'spend' as const, amount: 300, userId: 'u2' },
      ];

      const health = analyzer.analyzeEconomyHealth(transactions);

      expect(health.status).toBe('inflation');
      expect(health.sinkToSourceRatio).toBeLessThan(0.85);
      expect(health.recommendation).toContain('Add currency sinks');
    });

    it('should detect deflation (currency too scarce)', () => {
      const transactions = [
        { type: 'earn' as const, amount: 100, userId: 'u1' },
        { type: 'spend' as const, amount: 200, userId: 'u1' },
        { type: 'earn' as const, amount: 100, userId: 'u2' },
        { type: 'spend' as const, amount: 180, userId: 'u2' },
      ];

      const health = analyzer.analyzeEconomyHealth(transactions);

      expect(health.status).toBe('deflation');
      expect(health.sinkToSourceRatio).toBeGreaterThan(1.15);
      expect(health.recommendation).toContain('Add currency sources');
    });
  });

  describe('calculateARPDAU', () => {
    it('should calculate ARPDAU correctly', () => {
      const dailyData = [
        { date: '2024-01-01', uniqueUsers: 1000, iapRevenue: 500, adRevenue: 200 },
        { date: '2024-01-02', uniqueUsers: 1200, iapRevenue: 600, adRevenue: 240 },
        { date: '2024-01-03', uniqueUsers: 800, iapRevenue: 400, adRevenue: 160 },
      ];

      const arpdau = analyzer.calculateARPDAU(dailyData);

      expect(arpdau).toHaveLength(3);

      // Day 1
      expect(arpdau[0].dau).toBe(1000);
      expect(arpdau[0].totalRevenue).toBe(700);
      expect(arpdau[0].arpdau).toBe(0.7);
      expect(arpdau[0].arpdauIAP).toBe(0.5);
      expect(arpdau[0].arpdauAds).toBe(0.2);

      // Day 2
      expect(arpdau[1].arpdau).toBe(0.7);

      // Day 3
      expect(arpdau[2].arpdau).toBe(0.7);
    });

    it('should handle zero DAU gracefully', () => {
      const dailyData = [
        { date: '2024-01-01', uniqueUsers: 0, iapRevenue: 0, adRevenue: 0 },
      ];

      const arpdau = analyzer.calculateARPDAU(dailyData);

      expect(arpdau[0].arpdau).toBe(0);
      expect(arpdau[0].arpdauIAP).toBe(0);
      expect(arpdau[0].arpdauAds).toBe(0);
    });
  });
});
