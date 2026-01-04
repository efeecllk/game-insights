/**
 * SyntheticDataGenerator - Generate realistic sample data for each industry
 *
 * Creates synthetic data with realistic distributions and patterns
 * for testing and demo purposes.
 */

import { IndustryType } from '../industry/types';

/**
 * Generator configuration
 */
export interface GeneratorConfig {
  industry: IndustryType;
  subCategory?: string;
  rowCount: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  userCount?: number;
  seed?: number;
}

/**
 * Base class for synthetic data generation
 */
export abstract class SyntheticDataGenerator {
  protected config: GeneratorConfig;
  protected random: () => number;

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.random = config.seed ? this.seededRandom(config.seed) : Math.random.bind(Math);
  }

  /**
   * Generate seeded random number generator for reproducible data
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  /**
   * Generate random integer in range [min, max]
   */
  protected randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in range [min, max]
   */
  protected randomFloat(min: number, max: number, decimals = 2): number {
    const value = this.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
  }

  /**
   * Pick random item from array
   */
  protected randomChoice<T>(array: T[]): T {
    return array[Math.floor(this.random() * array.length)];
  }

  /**
   * Pick random items from array with weights
   */
  protected weightedChoice<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  /**
   * Generate random date in range
   */
  protected randomDate(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    return new Date(startTime + this.random() * (endTime - startTime));
  }

  /**
   * Generate date with time-of-day bias (more activity in evening)
   */
  protected randomDateWithBias(start: Date, end: Date): Date {
    const date = this.randomDate(start, end);

    // Bias towards evening hours (6pm-11pm)
    const hour = this.weightedChoice(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      [1, 1, 1, 1, 1, 1, 2, 3, 4, 4, 4, 3, 5, 5, 4, 4, 5, 6, 8, 10, 10, 8, 5, 2]
    );

    date.setHours(hour, this.randomInt(0, 59), this.randomInt(0, 59));
    return date;
  }

  /**
   * Generate UUID
   */
  protected generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (this.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate short ID
   */
  protected generateId(prefix: string = ''): string {
    return prefix + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate data - must be implemented by subclass
   */
  abstract generate(): Record<string, unknown>[];
}

/**
 * Gaming industry data generator
 */
export class GamingDataGenerator extends SyntheticDataGenerator {
  private platforms = ['ios', 'android'];
  private countries = ['US', 'UK', 'DE', 'JP', 'KR', 'BR', 'IN', 'CA', 'FR', 'AU'];
  private eventTypes = [
    'session_start',
    'session_end',
    'level_start',
    'level_complete',
    'level_fail',
    'purchase',
    'ad_watched',
    'tutorial_complete',
    'booster_used',
  ];
  private spenderTiers = ['non_spender', 'minnow', 'dolphin', 'whale'];
  private spenderWeights = [85, 10, 4, 1];

  generate(): Record<string, unknown>[] {
    const data: Record<string, unknown>[] = [];
    const userCount = this.config.userCount || Math.ceil(this.config.rowCount / 10);

    // Generate users
    const users = Array.from({ length: userCount }, (_, i) => {
      const installDate = this.randomDate(this.config.dateRange.start, this.config.dateRange.end);
      return {
        userId: `user_${(i + 1).toString().padStart(6, '0')}`,
        installDate,
        platform: this.randomChoice(this.platforms),
        country: this.randomChoice(this.countries),
        spenderTier: this.weightedChoice(this.spenderTiers, this.spenderWeights),
        maxLevel: this.randomInt(1, 200),
        totalRevenue: 0,
      };
    });

    // Calculate user revenue based on spender tier
    users.forEach((user) => {
      switch (user.spenderTier) {
        case 'whale':
          user.totalRevenue = this.randomFloat(100, 5000);
          break;
        case 'dolphin':
          user.totalRevenue = this.randomFloat(20, 100);
          break;
        case 'minnow':
          user.totalRevenue = this.randomFloat(0.99, 20);
          break;
        default:
          user.totalRevenue = 0;
      }
    });

    // Generate events
    for (let i = 0; i < this.config.rowCount; i++) {
      const user = this.randomChoice(users);
      const eventDate = this.randomDateWithBias(user.installDate, this.config.dateRange.end);
      const eventName = this.randomChoice(this.eventTypes);
      const level = this.randomInt(1, user.maxLevel);

      const event: Record<string, unknown> = {
        event_id: this.generateUUID(),
        user_id: user.userId,
        event_name: eventName,
        timestamp: eventDate.toISOString(),
        platform: user.platform,
        country: user.country,
        level,
        session_id: this.generateId('sess_'),
      };

      // Add event-specific fields
      if (eventName === 'level_complete' || eventName === 'level_fail') {
        event.score = this.randomInt(100, 10000);
        event.moves_used = this.randomInt(5, 50);
        event.boosters_used = this.randomInt(0, 3);
        event.lives_remaining = this.randomInt(0, 5);
        event.duration_seconds = this.randomInt(30, 300);
      }

      if (eventName === 'purchase') {
        event.revenue = this.randomChoice([0.99, 1.99, 4.99, 9.99, 19.99, 49.99, 99.99]);
        event.product_id = this.randomChoice(['coins_100', 'coins_500', 'gems_50', 'booster_pack', 'vip_pass']);
      }

      if (eventName === 'ad_watched') {
        event.ad_type = this.randomChoice(['rewarded', 'interstitial']);
        event.ad_revenue = this.randomFloat(0.001, 0.05);
        event.ad_network = this.randomChoice(['admob', 'unity', 'applovin', 'ironsource']);
      }

      if (eventName === 'session_start' || eventName === 'session_end') {
        event.session_duration = this.randomInt(60, 1800);
        event.days_since_install = Math.floor(
          (eventDate.getTime() - user.installDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      data.push(event);
    }

    return data;
  }
}

/**
 * SaaS industry data generator
 */
export class SaaSDataGenerator extends SyntheticDataGenerator {
  private plans = ['free', 'starter', 'professional', 'enterprise'];
  private planMRR = [0, 29, 99, 499];
  private features = ['dashboard', 'reports', 'api', 'integrations', 'support', 'export', 'automation'];
  private industries = ['tech', 'finance', 'healthcare', 'retail', 'education', 'manufacturing'];
  private eventTypes = [
    'login',
    'feature_used',
    'report_generated',
    'api_call',
    'invite_sent',
    'settings_changed',
    'export_created',
    'integration_connected',
  ];

  generate(): Record<string, unknown>[] {
    const data: Record<string, unknown>[] = [];
    const accountCount = this.config.userCount || Math.ceil(this.config.rowCount / 20);

    // Generate accounts
    const accounts = Array.from({ length: accountCount }, (_, i) => {
      const signupDate = this.randomDate(this.config.dateRange.start, this.config.dateRange.end);
      const planIndex = this.weightedChoice([0, 1, 2, 3], [40, 30, 20, 10]);

      return {
        accountId: `acc_${(i + 1).toString().padStart(6, '0')}`,
        companyName: `Company ${i + 1}`,
        signupDate,
        plan: this.plans[planIndex],
        mrr: this.planMRR[planIndex],
        seats: this.randomInt(1, planIndex === 3 ? 100 : planIndex === 2 ? 20 : 5),
        industry: this.randomChoice(this.industries),
        isChurned: this.random() < 0.05, // 5% churn
        trialEnd: new Date(signupDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      };
    });

    // Generate events
    for (let i = 0; i < this.config.rowCount; i++) {
      const account = this.randomChoice(accounts);
      const eventDate = this.randomDateWithBias(account.signupDate, this.config.dateRange.end);
      const eventName = this.randomChoice(this.eventTypes);

      const event: Record<string, unknown> = {
        event_id: this.generateUUID(),
        account_id: account.accountId,
        user_id: `${account.accountId}_user_${this.randomInt(1, account.seats)}`,
        event_name: eventName,
        timestamp: eventDate.toISOString(),
        plan: account.plan,
        mrr: account.mrr,
        seats: account.seats,
        industry: account.industry,
      };

      // Add event-specific fields
      if (eventName === 'feature_used') {
        event.feature = this.randomChoice(this.features);
        event.duration_seconds = this.randomInt(10, 600);
      }

      if (eventName === 'api_call') {
        event.endpoint = this.randomChoice(['/users', '/reports', '/data', '/export', '/webhook']);
        event.response_time_ms = this.randomInt(50, 500);
        event.status_code = this.weightedChoice([200, 201, 400, 401, 500], [80, 10, 5, 3, 2]);
      }

      if (eventName === 'login') {
        event.login_method = this.randomChoice(['password', 'sso', 'google', 'microsoft']);
        event.is_first_login = this.random() < 0.1;
      }

      // Calculate trial status
      const daysSinceSignup = Math.floor(
        (eventDate.getTime() - account.signupDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      event.days_since_signup = daysSinceSignup;
      event.is_trial = account.plan === 'free' && daysSinceSignup <= 14;
      event.trial_days_remaining = event.is_trial ? Math.max(0, 14 - daysSinceSignup) : null;
      event.is_churned = account.isChurned;

      data.push(event);
    }

    return data;
  }
}

/**
 * E-commerce industry data generator
 */
export class EcommerceDataGenerator extends SyntheticDataGenerator {
  private categories = ['electronics', 'clothing', 'home', 'sports', 'beauty', 'books', 'toys'];
  private paymentMethods = ['credit_card', 'paypal', 'apple_pay', 'google_pay', 'klarna'];
  private orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  private eventTypes = ['page_view', 'product_view', 'add_to_cart', 'remove_from_cart', 'checkout_start', 'purchase', 'return'];
  private trafficSources = ['organic', 'paid_search', 'social', 'email', 'direct', 'referral'];

  generate(): Record<string, unknown>[] {
    const data: Record<string, unknown>[] = [];
    const customerCount = this.config.userCount || Math.ceil(this.config.rowCount / 5);

    // Generate customers
    const customers = Array.from({ length: customerCount }, (_, i) => {
      const firstVisit = this.randomDate(this.config.dateRange.start, this.config.dateRange.end);

      return {
        customerId: `cust_${(i + 1).toString().padStart(6, '0')}`,
        firstVisit,
        segment: this.weightedChoice(
          ['new', 'returning', 'loyal', 'at_risk', 'churned'],
          [30, 35, 20, 10, 5]
        ),
        totalOrders: 0,
        totalSpent: 0,
        source: this.randomChoice(this.trafficSources),
      };
    });

    // Pre-calculate customer stats
    customers.forEach((customer) => {
      switch (customer.segment) {
        case 'loyal':
          customer.totalOrders = this.randomInt(5, 20);
          customer.totalSpent = this.randomFloat(500, 5000);
          break;
        case 'returning':
          customer.totalOrders = this.randomInt(2, 5);
          customer.totalSpent = this.randomFloat(100, 500);
          break;
        case 'at_risk':
          customer.totalOrders = this.randomInt(1, 3);
          customer.totalSpent = this.randomFloat(50, 200);
          break;
        default:
          customer.totalOrders = this.randomInt(0, 1);
          customer.totalSpent = this.randomFloat(0, 100);
      }
    });

    // Generate events
    for (let i = 0; i < this.config.rowCount; i++) {
      const customer = this.randomChoice(customers);
      const eventDate = this.randomDateWithBias(customer.firstVisit, this.config.dateRange.end);
      const eventType = this.weightedChoice(
        this.eventTypes,
        [20, 30, 15, 5, 8, 15, 7]
      );

      const productPrice = this.randomFloat(9.99, 499.99);
      const category = this.randomChoice(this.categories);

      const event: Record<string, unknown> = {
        event_id: this.generateUUID(),
        customer_id: customer.customerId,
        event_type: eventType,
        timestamp: eventDate.toISOString(),
        session_id: this.generateId('sess_'),
        product_id: `prod_${this.randomInt(1, 1000).toString().padStart(4, '0')}`,
        category,
        price: productPrice,
        source: customer.source,
        device: this.randomChoice(['desktop', 'mobile', 'tablet']),
      };

      // Add event-specific fields
      if (eventType === 'purchase') {
        const quantity = this.randomInt(1, 3);
        const discount = this.random() < 0.3 ? this.randomFloat(5, 50) : 0;
        const shipping = this.randomFloat(0, 15);
        const subtotal = productPrice * quantity;

        event.order_id = this.generateId('ord_');
        event.quantity = quantity;
        event.order_subtotal = subtotal;
        event.discount = discount;
        event.shipping_cost = shipping;
        event.order_total = subtotal - discount + shipping;
        event.payment_method = this.randomChoice(this.paymentMethods);
        event.order_status = this.weightedChoice(
          this.orderStatuses,
          [5, 10, 15, 60, 5, 5]
        );
        event.coupon_code = this.random() < 0.2 ? this.randomChoice(['SAVE10', 'WELCOME', 'SUMMER20', 'VIP']) : null;
      }

      if (eventType === 'add_to_cart') {
        event.cart_id = this.generateId('cart_');
        event.quantity = this.randomInt(1, 3);
        event.cart_value = this.randomFloat(20, 500);
        event.cart_items = this.randomInt(1, 5);
      }

      if (eventType === 'return') {
        event.return_id = this.generateId('ret_');
        event.return_reason = this.randomChoice([
          'wrong_size',
          'defective',
          'not_as_described',
          'changed_mind',
          'better_price_elsewhere',
        ]);
        event.return_amount = productPrice;
      }

      if (eventType === 'checkout_start') {
        event.cart_value = this.randomFloat(30, 500);
        event.cart_items = this.randomInt(1, 8);
        event.cart_abandoned = this.random() < 0.7; // 70% abandon at checkout
      }

      data.push(event);
    }

    return data;
  }
}

/**
 * Factory for creating data generators
 */
export function createDataGenerator(config: GeneratorConfig): SyntheticDataGenerator {
  switch (config.industry) {
    case 'gaming':
      return new GamingDataGenerator(config);
    case 'saas':
      return new SaaSDataGenerator(config);
    case 'ecommerce':
      return new EcommerceDataGenerator(config);
    default:
      throw new Error(`No generator available for industry: ${config.industry}`);
  }
}

/**
 * Generate sample data for an industry
 */
export function generateSampleData(
  industry: IndustryType,
  rowCount: number = 10000,
  seed?: number
): Record<string, unknown>[] {
  const config: GeneratorConfig = {
    industry,
    rowCount,
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      end: new Date(),
    },
    seed,
  };

  const generator = createDataGenerator(config);
  return generator.generate();
}

export default {
  createDataGenerator,
  generateSampleData,
  GamingDataGenerator,
  SaaSDataGenerator,
  EcommerceDataGenerator,
};
