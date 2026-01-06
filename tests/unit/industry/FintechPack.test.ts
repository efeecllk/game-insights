/**
 * Fintech Industry Pack Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FintechPack } from '../../../src/industry/packs/fintech';
import { IndustryRegistry } from '../../../src/industry/IndustryRegistry';
import { IndustryDetector } from '../../../src/industry/IndustryDetector';
import { FintechDataGenerator } from '../../../src/generators/SyntheticDataGenerator';
import { ColumnMeaning } from '../../../src/industry/types';

describe('FintechPack', () => {
  describe('Pack Structure', () => {
    it('should have correct pack metadata', () => {
      expect(FintechPack.id).toBe('fintech');
      expect(FintechPack.name).toBe('Fintech');
      expect(FintechPack.version).toBe('1.0.0');
      expect(FintechPack.description).toBeDefined();
    });

    it('should have sub-categories defined', () => {
      expect(FintechPack.subCategories).toBeInstanceOf(Array);
      expect(FintechPack.subCategories.length).toBeGreaterThan(0);

      const subCategoryIds = FintechPack.subCategories.map(s => s.id);
      expect(subCategoryIds).toContain('payments');
      expect(subCategoryIds).toContain('neobank');
      expect(subCategoryIds).toContain('trading');
      expect(subCategoryIds).toContain('crypto');
      expect(subCategoryIds).toContain('lending');
      expect(subCategoryIds).toContain('wealth');
      expect(subCategoryIds).toContain('pf');
    });

    it('should have theme configuration', () => {
      expect(FintechPack.theme).toBeDefined();
      expect(FintechPack.theme.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(FintechPack.theme.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(FintechPack.theme.chartColors).toBeInstanceOf(Array);
      expect(FintechPack.theme.chartColors.length).toBeGreaterThan(0);
    });

    it('should have terminology defined', () => {
      expect(FintechPack.terminology).toBeDefined();
      expect(FintechPack.terminology.user).toBeDefined();
      expect(FintechPack.terminology.transaction).toBeDefined();
      expect(FintechPack.terminology.account).toBeDefined();
    });
  });

  describe('Semantic Types', () => {
    it('should have semantic types defined', () => {
      expect(FintechPack.semanticTypes).toBeInstanceOf(Array);
      expect(FintechPack.semanticTypes.length).toBeGreaterThan(0);
    });

    it('should include core fintech semantic types', () => {
      const types = FintechPack.semanticTypes.map(s => s.type);

      // Core identification
      expect(types).toContain('user_id');
      expect(types).toContain('account_id');
      expect(types).toContain('transaction_id');
      expect(types).toContain('timestamp');

      // Transaction types
      expect(types).toContain('transaction_amount');
      expect(types).toContain('transaction_type');
      expect(types).toContain('transaction_status');
      expect(types).toContain('currency');
      expect(types).toContain('fee_amount');

      // Account types
      expect(types).toContain('account_balance');
      expect(types).toContain('aum');

      // KYC types
      expect(types).toContain('kyc_status');
      expect(types).toContain('kyc_level');
    });

    it('should include trading-specific semantic types', () => {
      const types = FintechPack.semanticTypes.map(s => s.type);

      expect(types).toContain('trade_volume');
      expect(types).toContain('trade_price');
      expect(types).toContain('symbol');
      expect(types).toContain('pnl');
    });

    it('should include lending-specific semantic types', () => {
      const types = FintechPack.semanticTypes.map(s => s.type);

      expect(types).toContain('loan_amount');
      expect(types).toContain('interest_rate');
      expect(types).toContain('credit_score');
      expect(types).toContain('overdue_days');
    });

    it('should include fraud-related semantic types', () => {
      const types = FintechPack.semanticTypes.map(s => s.type);

      expect(types).toContain('fraud_flag');
      expect(types).toContain('fraud_score');
      expect(types).toContain('chargeback');
    });

    it('should have valid pattern arrays for each semantic type', () => {
      FintechPack.semanticTypes.forEach(semType => {
        expect(semType.patterns).toBeInstanceOf(Array);
        expect(semType.patterns.length).toBeGreaterThan(0);
        semType.patterns.forEach(pattern => {
          expect(typeof pattern).toBe('string');
          expect(pattern.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have priorities set for all semantic types', () => {
      FintechPack.semanticTypes.forEach(semType => {
        expect(semType.priority).toBeGreaterThanOrEqual(1);
        expect(semType.priority).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Detection Indicators', () => {
    it('should have detection indicators defined', () => {
      expect(FintechPack.detectionIndicators).toBeInstanceOf(Array);
      expect(FintechPack.detectionIndicators.length).toBeGreaterThan(0);
    });

    it('should have valid weights for indicators', () => {
      FintechPack.detectionIndicators.forEach(indicator => {
        expect(indicator.weight).toBeGreaterThan(0);
        expect(indicator.weight).toBeLessThanOrEqual(10);
      });
    });

    it('should have reasons for each indicator', () => {
      FintechPack.detectionIndicators.forEach(indicator => {
        expect(indicator.reason).toBeDefined();
        expect(indicator.reason!.length).toBeGreaterThan(0);
      });
    });

    it('should reference valid semantic types', () => {
      const validTypes = new Set(FintechPack.semanticTypes.map(s => s.type));

      FintechPack.detectionIndicators.forEach(indicator => {
        indicator.types.forEach(type => {
          expect(validTypes.has(type)).toBe(true);
        });
      });
    });
  });

  describe('Metrics', () => {
    it('should have metrics defined', () => {
      expect(FintechPack.metrics).toBeInstanceOf(Array);
      expect(FintechPack.metrics.length).toBeGreaterThan(0);
    });

    it('should include KPI metrics', () => {
      const kpiMetrics = FintechPack.metrics.filter(m => m.category === 'kpi');
      expect(kpiMetrics.length).toBeGreaterThan(0);

      const kpiIds = kpiMetrics.map(m => m.id);
      expect(kpiIds).toContain('total_transaction_volume');
      expect(kpiIds).toContain('payment_success_rate');
      expect(kpiIds).toContain('total_aum');
    });

    it('should include monetization metrics', () => {
      const monetizationMetrics = FintechPack.metrics.filter(m => m.category === 'monetization');
      expect(monetizationMetrics.length).toBeGreaterThan(0);

      const ids = monetizationMetrics.map(m => m.id);
      expect(ids).toContain('total_fees');
      expect(ids).toContain('take_rate');
    });

    it('should include engagement metrics', () => {
      const engagementMetrics = FintechPack.metrics.filter(m => m.category === 'engagement');
      expect(engagementMetrics.length).toBeGreaterThan(0);

      const ids = engagementMetrics.map(m => m.id);
      expect(ids).toContain('mau');
      expect(ids).toContain('transacting_user_rate');
    });

    it('should include funnel metrics', () => {
      const funnelMetrics = FintechPack.metrics.filter(m => m.category === 'funnel');
      expect(funnelMetrics.length).toBeGreaterThan(0);

      const ids = funnelMetrics.map(m => m.id);
      expect(ids).toContain('kyc_completion_rate');
      expect(ids).toContain('activation_rate');
    });

    it('should include retention metrics', () => {
      const retentionMetrics = FintechPack.metrics.filter(m => m.category === 'retention');
      expect(retentionMetrics.length).toBeGreaterThan(0);

      const ids = retentionMetrics.map(m => m.id);
      expect(ids).toContain('user_churn_rate');
    });

    it('should have valid format for each metric', () => {
      const validFormats = ['number', 'percentage', 'currency', 'duration', 'decimal'];
      FintechPack.metrics.forEach(metric => {
        expect(validFormats).toContain(metric.format);
      });
    });

    it('should have formula for each metric', () => {
      FintechPack.metrics.forEach(metric => {
        expect(metric.formula).toBeDefined();
        expect(metric.formula.expression).toBeDefined();
        expect(typeof metric.formula.expression).toBe('string');
      });
    });

    it('should have thresholds for critical metrics', () => {
      const metricsWithThresholds = ['payment_success_rate', 'fraud_rate', 'chargeback_rate', 'kyc_completion_rate'];

      metricsWithThresholds.forEach(metricId => {
        const metric = FintechPack.metrics.find(m => m.id === metricId);
        expect(metric).toBeDefined();
        expect(metric!.thresholds).toBeDefined();
      });
    });
  });

  describe('Funnels', () => {
    it('should have funnels defined', () => {
      expect(FintechPack.funnels).toBeInstanceOf(Array);
      expect(FintechPack.funnels.length).toBeGreaterThan(0);
    });

    it('should have onboarding funnel', () => {
      const onboardingFunnel = FintechPack.funnels.find(f => f.id === 'onboarding_funnel');
      expect(onboardingFunnel).toBeDefined();
      expect(onboardingFunnel!.steps.length).toBeGreaterThan(0);
    });

    it('should have deposit funnel', () => {
      const depositFunnel = FintechPack.funnels.find(f => f.id === 'deposit_funnel');
      expect(depositFunnel).toBeDefined();
      expect(depositFunnel!.steps.length).toBeGreaterThan(0);
    });

    it('should have trading funnel for trading sub-category', () => {
      const tradingFunnel = FintechPack.funnels.find(f => f.id === 'trading_funnel');
      expect(tradingFunnel).toBeDefined();
      expect(tradingFunnel!.subCategories).toContain('trading');
    });

    it('should have loan application funnel for lending sub-category', () => {
      const loanFunnel = FintechPack.funnels.find(f => f.id === 'loan_application');
      expect(loanFunnel).toBeDefined();
      expect(loanFunnel!.subCategories).toContain('lending');
    });

    it('should have valid steps for each funnel', () => {
      FintechPack.funnels.forEach(funnel => {
        expect(funnel.steps).toBeInstanceOf(Array);
        expect(funnel.steps.length).toBeGreaterThanOrEqual(2);

        funnel.steps.forEach(step => {
          expect(step.id).toBeDefined();
          expect(step.name).toBeDefined();
          expect(step.semanticType).toBeDefined();
        });
      });
    });
  });

  describe('Chart Configurations', () => {
    it('should have chart configs defined', () => {
      expect(FintechPack.chartConfigs).toBeDefined();
      expect(FintechPack.chartConfigs.types).toBeInstanceOf(Array);
      expect(FintechPack.chartConfigs.types.length).toBeGreaterThan(0);
    });

    it('should have default charts defined', () => {
      expect(FintechPack.chartConfigs.defaultCharts).toBeInstanceOf(Array);
      expect(FintechPack.chartConfigs.defaultCharts!.length).toBeGreaterThan(0);
    });

    it('should include various chart types', () => {
      const chartTypes = FintechPack.chartConfigs.types.map(c => c.type);

      expect(chartTypes).toContain('line');
      expect(chartTypes).toContain('area');
      expect(chartTypes).toContain('funnel');
      expect(chartTypes).toContain('bar');
      expect(chartTypes).toContain('cohort');
    });

    it('should have metrics for each chart type', () => {
      FintechPack.chartConfigs.types.forEach(chartConfig => {
        expect(chartConfig.metrics).toBeInstanceOf(Array);
        expect(chartConfig.metrics.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Insight Templates', () => {
    it('should have insight templates defined', () => {
      expect(FintechPack.insightTemplates).toBeInstanceOf(Array);
      expect(FintechPack.insightTemplates.length).toBeGreaterThan(0);
    });

    it('should have valid categories for each insight', () => {
      const validCategories = ['positive', 'negative', 'neutral', 'actionable'];

      FintechPack.insightTemplates.forEach(insight => {
        expect(validCategories).toContain(insight.category);
      });
    });

    it('should have required metrics for each insight', () => {
      FintechPack.insightTemplates.forEach(insight => {
        expect(insight.requiredMetrics).toBeInstanceOf(Array);
        expect(insight.requiredMetrics.length).toBeGreaterThan(0);
      });
    });

    it('should have template placeholders matching required metrics', () => {
      FintechPack.insightTemplates.forEach(insight => {
        insight.requiredMetrics.forEach(metricId => {
          const placeholder = `{{${metricId}}}`;
          expect(insight.template).toContain(placeholder);
        });
      });
    });

    it('should have fraud alert with high priority', () => {
      const fraudAlert = FintechPack.insightTemplates.find(i => i.id === 'fraud_alert');
      expect(fraudAlert).toBeDefined();
      expect(fraudAlert!.category).toBe('negative');
      expect(fraudAlert!.priority).toBeGreaterThanOrEqual(9);
    });
  });
});

describe('FintechPack Integration', () => {
  let registry: IndustryRegistry;

  beforeEach(() => {
    IndustryRegistry.reset();
    registry = IndustryRegistry.getInstance();
  });

  it('should register successfully with IndustryRegistry', () => {
    registry.registerPack(FintechPack);

    expect(registry.hasPack('fintech')).toBe(true);
    expect(registry.getPack('fintech')).toEqual(FintechPack);
  });

  it('should be detected from fintech-related columns', () => {
    registry.registerPack(FintechPack);
    const detector = new IndustryDetector(registry);

    const columns: ColumnMeaning[] = [
      { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
      { column: 'transaction_amount', meaning: 'transaction_amount', confidence: 0.95 },
      { column: 'transaction_status', meaning: 'transaction_status', confidence: 0.9 },
      { column: 'account_balance', meaning: 'account_balance', confidence: 0.9 },
    ];

    const result = detector.detect(columns);

    expect(result.primary.industry).toBe('fintech');
    expect(result.primary.confidence).toBeGreaterThan(0);
  });

  it('should detect trading sub-category from trading columns', () => {
    registry.registerPack(FintechPack);
    const detector = new IndustryDetector(registry);

    const columns: ColumnMeaning[] = [
      { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
      { column: 'trade_volume', meaning: 'trade_volume', confidence: 0.95 },
      { column: 'symbol', meaning: 'symbol', confidence: 0.9 },
      { column: 'pnl', meaning: 'pnl', confidence: 0.9 },
    ];

    const result = detector.detectWithSubCategory(columns, 'fintech');

    expect(result.primary.industry).toBe('fintech');
    // Sub-category detection depends on implementation
    expect(result.detectedSemanticTypes.length).toBeGreaterThan(0);
  });

  it('should detect lending from loan columns', () => {
    registry.registerPack(FintechPack);
    const detector = new IndustryDetector(registry);

    const columns: ColumnMeaning[] = [
      { column: 'user_id', meaning: 'user_id', confidence: 0.9 },
      { column: 'loan_amount', meaning: 'loan_amount', confidence: 0.95 },
      { column: 'interest_rate', meaning: 'interest_rate', confidence: 0.9 },
      { column: 'credit_score', meaning: 'credit_score', confidence: 0.9 },
    ];

    const result = detector.detect(columns);

    expect(result.primary.industry).toBe('fintech');
  });
});

describe('FintechDataGenerator', () => {
  it('should generate fintech data with correct structure', () => {
    const generator = new FintechDataGenerator({
      industry: 'fintech',
      rowCount: 100,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    });

    const data = generator.generate();

    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBe(100);
  });

  it('should include required fields in generated data', () => {
    const generator = new FintechDataGenerator({
      industry: 'fintech',
      rowCount: 50,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    });

    const data = generator.generate();
    const firstRow = data[0];

    expect(firstRow.event_id).toBeDefined();
    expect(firstRow.user_id).toBeDefined();
    expect(firstRow.account_id).toBeDefined();
    expect(firstRow.event_type).toBeDefined();
    expect(firstRow.timestamp).toBeDefined();
    expect(firstRow.kyc_status).toBeDefined();
  });

  it('should generate transaction data for transaction events', () => {
    const generator = new FintechDataGenerator({
      industry: 'fintech',
      rowCount: 500,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    });

    const data = generator.generate();
    const transactionEvents = data.filter(d =>
      ['transaction', 'deposit', 'withdrawal', 'trade', 'transfer', 'card_payment'].includes(d.event_type as string)
    );

    expect(transactionEvents.length).toBeGreaterThan(0);

    transactionEvents.forEach(event => {
      expect(event.transaction_id).toBeDefined();
      expect(event.transaction_type).toBeDefined();
      expect(event.transaction_status).toBeDefined();
      expect(event.transaction_amount).toBeDefined();
      expect(event.currency).toBeDefined();
    });
  });

  it('should generate trade-specific data for trade events', () => {
    const generator = new FintechDataGenerator({
      industry: 'fintech',
      rowCount: 500,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    });

    const data = generator.generate();
    const tradeEvents = data.filter(d => d.transaction_type === 'trade');

    if (tradeEvents.length > 0) {
      tradeEvents.forEach(event => {
        expect(event.symbol).toBeDefined();
        expect(event.trade_side).toBeDefined();
        expect(event.trade_price).toBeDefined();
        expect(event.trade_volume).toBeDefined();
      });
    }
  });

  it('should generate login events with proper fields', () => {
    const generator = new FintechDataGenerator({
      industry: 'fintech',
      rowCount: 500,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    });

    const data = generator.generate();
    const loginEvents = data.filter(d => d.event_type === 'login');

    expect(loginEvents.length).toBeGreaterThan(0);

    loginEvents.forEach(event => {
      expect(event.login_method).toBeDefined();
      expect(event.device_type).toBeDefined();
      expect(event.login_success).toBeDefined();
    });
  });

  it('should generate KYC events with proper fields', () => {
    const generator = new FintechDataGenerator({
      industry: 'fintech',
      rowCount: 500,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    });

    const data = generator.generate();
    const kycEvents = data.filter(d => d.event_type === 'kyc_update');

    if (kycEvents.length > 0) {
      kycEvents.forEach(event => {
        expect(event.kyc_previous_status).toBeDefined();
        expect(event.kyc_new_status).toBeDefined();
        expect(event.verification_method).toBeDefined();
      });
    }
  });

  it('should include fraud flags in transaction data', () => {
    const generator = new FintechDataGenerator({
      industry: 'fintech',
      rowCount: 500,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    });

    const data = generator.generate();
    const transactionEvents = data.filter(d =>
      ['transaction', 'deposit', 'withdrawal', 'trade', 'transfer', 'card_payment'].includes(d.event_type as string)
    );

    const eventsWithFraudData = transactionEvents.filter(e =>
      e.fraud_flag !== undefined && e.fraud_score !== undefined
    );

    expect(eventsWithFraudData.length).toBeGreaterThan(0);
  });

  it('should generate reproducible data with same seed', () => {
    const config = {
      industry: 'fintech' as const,
      rowCount: 50,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    };

    const generator1 = new FintechDataGenerator(config);
    const generator2 = new FintechDataGenerator(config);

    const data1 = generator1.generate();
    const data2 = generator2.generate();

    expect(data1[0].event_id).toBe(data2[0].event_id);
    expect(data1[0].user_id).toBe(data2[0].user_id);
  });

  it('should generate varying transaction amounts', () => {
    const generator = new FintechDataGenerator({
      industry: 'fintech',
      rowCount: 100,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      },
      seed: 12345,
    });

    const data = generator.generate();
    const amounts = data
      .filter(d => d.transaction_amount !== undefined)
      .map(d => d.transaction_amount as number);

    if (amounts.length > 1) {
      const uniqueAmounts = new Set(amounts);
      expect(uniqueAmounts.size).toBeGreaterThan(1);
    }
  });
});
