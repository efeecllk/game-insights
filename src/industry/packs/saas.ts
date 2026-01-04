/**
 * SaaS Industry Pack
 *
 * Analytics configuration for B2B and B2C SaaS products.
 * Supports subscription businesses with MRR, churn, and feature adoption metrics.
 */

import {
  IndustryPack,
  IndustrySemanticType,
  DetectionIndicator,
  MetricDefinition,
  FunnelTemplate,
  ChartConfig,
  InsightTemplate,
  TerminologyMap,
  IndustryTheme,
} from '../types';

/**
 * SaaS-specific semantic types
 */
const semanticTypes: IndustrySemanticType[] = [
  // Core identification
  { type: 'account_id', patterns: ['account_id', 'org_id', 'organization_id', 'company_id', 'tenant_id', 'accountId'], priority: 10 },
  { type: 'user_id', patterns: ['user_id', 'userId', 'member_id', 'uid'], priority: 9 },
  { type: 'email', patterns: ['email', 'user_email', 'contact_email'], priority: 7 },
  { type: 'timestamp', patterns: ['timestamp', 'date', 'time', 'created_at', 'updated_at', 'ts'], priority: 10 },
  { type: 'event_name', patterns: ['event_name', 'event_type', 'action', 'eventName'], priority: 9 },

  // Subscription & Revenue
  { type: 'mrr', patterns: ['mrr', 'monthly_revenue', 'monthly_recurring_revenue', 'mrr_usd'], priority: 10, description: 'Monthly Recurring Revenue' },
  { type: 'arr', patterns: ['arr', 'annual_revenue', 'annual_recurring_revenue'], priority: 10, description: 'Annual Recurring Revenue' },
  { type: 'subscription_tier', patterns: ['plan', 'tier', 'subscription', 'subscription_tier', 'pricing_tier', 'plan_name'], priority: 9 },
  { type: 'seats', patterns: ['seats', 'licenses', 'user_count', 'team_size', 'seat_count'], priority: 8 },
  { type: 'contract_value', patterns: ['contract_value', 'deal_value', 'acv', 'tcv'], priority: 8 },

  // Trial & Lifecycle
  { type: 'trial_start', patterns: ['trial_start', 'trial_started', 'trial_begin'], priority: 9 },
  { type: 'trial_end', patterns: ['trial_end', 'trial_ended', 'trial_expires'], priority: 9 },
  { type: 'trial_days', patterns: ['trial_days', 'trial_remaining', 'days_in_trial'], priority: 7 },
  { type: 'signup_date', patterns: ['signup_date', 'created_at', 'registration_date'], priority: 8 },
  { type: 'subscription_start', patterns: ['subscription_start', 'paid_start', 'converted_at'], priority: 8 },

  // Churn & Retention
  { type: 'churn_date', patterns: ['churn_date', 'cancelled_at', 'cancellation_date', 'churned_at'], priority: 10 },
  { type: 'churn_reason', patterns: ['churn_reason', 'cancel_reason', 'cancellation_reason'], priority: 7 },
  { type: 'is_churned', patterns: ['is_churned', 'churned', 'cancelled', 'is_active'], priority: 9 },

  // Expansion & Contraction
  { type: 'expansion_revenue', patterns: ['expansion', 'upsell', 'upgrade_revenue', 'expansion_mrr'], priority: 8 },
  { type: 'contraction_revenue', patterns: ['contraction', 'downgrade', 'contraction_mrr'], priority: 8 },
  { type: 'plan_change', patterns: ['plan_change', 'upgrade', 'downgrade', 'tier_change'], priority: 7 },

  // Engagement
  { type: 'feature_used', patterns: ['feature', 'feature_used', 'feature_name', 'capability'], priority: 8 },
  { type: 'api_calls', patterns: ['api_calls', 'api_requests', 'api_usage', 'request_count'], priority: 7 },
  { type: 'active_users', patterns: ['active_users', 'mau', 'wau', 'dau', 'active_members'], priority: 8 },
  { type: 'login_count', patterns: ['login_count', 'logins', 'sign_ins', 'sessions'], priority: 7 },
  { type: 'last_active', patterns: ['last_active', 'last_login', 'last_seen', 'last_activity'], priority: 7 },

  // Onboarding
  { type: 'onboarding_step', patterns: ['onboarding_step', 'setup_step', 'activation_step'], priority: 8 },
  { type: 'onboarding_complete', patterns: ['onboarding_complete', 'setup_complete', 'activated'], priority: 8 },
  { type: 'time_to_value', patterns: ['time_to_value', 'ttv', 'activation_time'], priority: 7 },

  // Support & NPS
  { type: 'nps_score', patterns: ['nps', 'nps_score', 'net_promoter'], priority: 7 },
  { type: 'support_tickets', patterns: ['support_tickets', 'tickets', 'help_requests'], priority: 6 },
  { type: 'csat_score', patterns: ['csat', 'satisfaction', 'csat_score'], priority: 6 },

  // Company demographics
  { type: 'company_size', patterns: ['company_size', 'employee_count', 'employees', 'org_size'], priority: 6 },
  { type: 'industry', patterns: ['industry', 'vertical', 'sector'], priority: 5 },
  { type: 'country', patterns: ['country', 'region', 'geo', 'location'], priority: 5 },
];

/**
 * Detection indicators for SaaS
 */
const detectionIndicators: DetectionIndicator[] = [
  { types: ['mrr', 'subscription_tier'], weight: 10, reason: 'MRR and subscription tiers indicate SaaS' },
  { types: ['arr'], weight: 10, reason: 'ARR is SaaS-specific metric' },
  { types: ['trial_start', 'trial_end'], weight: 9, reason: 'Trial system indicates SaaS product' },
  { types: ['churn_date', 'is_churned'], weight: 9, reason: 'Churn tracking indicates subscription business' },
  { types: ['seats', 'account_id'], weight: 8, reason: 'Seat-based licensing indicates B2B SaaS' },
  { types: ['expansion_revenue', 'contraction_revenue'], weight: 8, reason: 'Expansion/contraction tracking' },
  { types: ['feature_used', 'api_calls'], weight: 6, reason: 'Feature and API usage tracking' },
  { types: ['onboarding_step', 'time_to_value'], weight: 7, reason: 'Onboarding tracking indicates SaaS' },
  { types: ['nps_score', 'csat_score'], weight: 5, reason: 'Customer satisfaction metrics' },
];

/**
 * SaaS metrics definitions
 */
const metrics: MetricDefinition[] = [
  // Revenue KPIs
  {
    id: 'total_mrr',
    name: 'Total MRR',
    description: 'Total Monthly Recurring Revenue',
    formula: { expression: 'SUM($mrr)', requiredTypes: ['mrr'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'total_arr',
    name: 'Total ARR',
    description: 'Total Annual Recurring Revenue',
    formula: { expression: 'SUM($mrr) * 12', requiredTypes: ['mrr'], fallback: 'SUM($arr)' },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'net_mrr_growth',
    name: 'Net MRR Growth',
    description: 'Month-over-month MRR change',
    formula: { expression: '(SUM($mrr) - LAG(SUM($mrr), 1)) / LAG(SUM($mrr), 1) * 100', requiredTypes: ['mrr'] },
    format: 'percentage',
    category: 'kpi',
    thresholds: { good: 10, warning: 5, bad: 0 },
  },
  {
    id: 'arpa',
    name: 'ARPA',
    description: 'Average Revenue Per Account',
    formula: { expression: 'SUM($mrr) / COUNT_DISTINCT($account_id)', requiredTypes: ['mrr', 'account_id'] },
    format: 'currency',
    category: 'monetization',
  },

  // Churn metrics
  {
    id: 'churn_rate',
    name: 'Monthly Churn Rate',
    description: 'Percentage of customers churned',
    formula: { expression: 'COUNT(WHERE $is_churned = true) / COUNT_DISTINCT($account_id) * 100', requiredTypes: ['is_churned', 'account_id'] },
    format: 'percentage',
    category: 'retention',
    thresholds: { good: 2, warning: 5, bad: 10 },
  },
  {
    id: 'revenue_churn',
    name: 'Revenue Churn',
    description: 'MRR lost to churn',
    formula: { expression: 'SUM($mrr WHERE $is_churned = true)', requiredTypes: ['mrr', 'is_churned'] },
    format: 'currency',
    category: 'retention',
  },
  {
    id: 'nrr',
    name: 'Net Revenue Retention',
    description: 'Revenue retained including expansion',
    formula: { expression: '(SUM($mrr) + SUM($expansion_revenue) - SUM($contraction_revenue) - SUM($mrr WHERE $is_churned = true)) / LAG(SUM($mrr), 1) * 100', requiredTypes: ['mrr'] },
    format: 'percentage',
    category: 'retention',
    thresholds: { good: 110, warning: 100, bad: 90 },
  },
  {
    id: 'grr',
    name: 'Gross Revenue Retention',
    description: 'Revenue retained without expansion',
    formula: { expression: '(SUM($mrr) - SUM($mrr WHERE $is_churned = true)) / LAG(SUM($mrr), 1) * 100', requiredTypes: ['mrr', 'is_churned'] },
    format: 'percentage',
    category: 'retention',
    thresholds: { good: 95, warning: 90, bad: 85 },
  },

  // Trial & Conversion
  {
    id: 'trial_to_paid',
    name: 'Trial to Paid Conversion',
    description: 'Percentage of trials converting to paid',
    formula: { expression: 'COUNT(WHERE $subscription_start IS NOT NULL) / COUNT(WHERE $trial_start IS NOT NULL) * 100', requiredTypes: ['trial_start', 'subscription_start'] },
    format: 'percentage',
    category: 'funnel',
    thresholds: { good: 25, warning: 15, bad: 10 },
  },
  {
    id: 'avg_trial_length',
    name: 'Avg Trial Length',
    description: 'Average days in trial before conversion',
    formula: { expression: 'AVG(DATEDIFF($subscription_start, $trial_start))', requiredTypes: ['trial_start', 'subscription_start'] },
    format: 'number',
    category: 'funnel',
  },

  // Engagement
  {
    id: 'active_rate',
    name: 'Active Account Rate',
    description: 'Percentage of accounts active this month',
    formula: { expression: 'COUNT_DISTINCT($account_id WHERE $last_active >= TODAY() - 30) / COUNT_DISTINCT($account_id) * 100', requiredTypes: ['account_id', 'last_active'] },
    format: 'percentage',
    category: 'engagement',
    thresholds: { good: 80, warning: 60, bad: 40 },
  },
  {
    id: 'feature_adoption',
    name: 'Feature Adoption Rate',
    description: 'Percentage of accounts using key features',
    formula: { expression: 'COUNT_DISTINCT($account_id WHERE $feature_used IS NOT NULL) / COUNT_DISTINCT($account_id) * 100', requiredTypes: ['account_id', 'feature_used'] },
    format: 'percentage',
    category: 'engagement',
  },
  {
    id: 'avg_api_calls',
    name: 'Avg API Calls per Account',
    description: 'Average API usage per account',
    formula: { expression: 'SUM($api_calls) / COUNT_DISTINCT($account_id)', requiredTypes: ['api_calls', 'account_id'] },
    format: 'number',
    category: 'engagement',
  },
  {
    id: 'seats_utilization',
    name: 'Seats Utilization',
    description: 'Percentage of purchased seats being used',
    formula: { expression: 'SUM($active_users) / SUM($seats) * 100', requiredTypes: ['active_users', 'seats'] },
    format: 'percentage',
    category: 'engagement',
    thresholds: { good: 80, warning: 50, bad: 30 },
  },

  // Customer metrics
  {
    id: 'ltv',
    name: 'Customer LTV',
    description: 'Average customer lifetime value',
    formula: { expression: 'AVG($mrr) * 12 / ($churn_rate / 100)', requiredTypes: ['mrr'] },
    format: 'currency',
    category: 'monetization',
  },
  {
    id: 'nps',
    name: 'NPS Score',
    description: 'Net Promoter Score',
    formula: { expression: 'AVG($nps_score)', requiredTypes: ['nps_score'] },
    format: 'number',
    category: 'engagement',
    thresholds: { good: 50, warning: 20, bad: 0 },
  },
];

/**
 * Pre-defined funnels
 */
const funnels: FunnelTemplate[] = [
  {
    id: 'signup_to_paid',
    name: 'Trial to Paid',
    description: 'Track trial conversion journey',
    steps: [
      { id: 'signup', name: 'Signup', semanticType: 'signup_date' },
      { id: 'trial_start', name: 'Start Trial', semanticType: 'trial_start' },
      { id: 'activated', name: 'Activated', semanticType: 'onboarding_complete' },
      { id: 'converted', name: 'Converted to Paid', semanticType: 'subscription_start' },
    ],
  },
  {
    id: 'onboarding_funnel',
    name: 'Onboarding Completion',
    description: 'Track onboarding step completion',
    steps: [
      { id: 'signup', name: 'Signup', semanticType: 'signup_date' },
      { id: 'profile', name: 'Complete Profile', semanticType: 'onboarding_step', condition: '$onboarding_step = "profile"' },
      { id: 'first_action', name: 'First Key Action', semanticType: 'event_name', eventPatterns: ['first_action', 'key_action'] },
      { id: 'invite', name: 'Invite Team', semanticType: 'event_name', eventPatterns: ['invite_sent', 'team_invite'] },
      { id: 'complete', name: 'Onboarding Complete', semanticType: 'onboarding_complete' },
    ],
  },
  {
    id: 'expansion_funnel',
    name: 'Expansion Journey',
    description: 'Track path to upgrade',
    steps: [
      { id: 'active', name: 'Active Customer', semanticType: 'account_id' },
      { id: 'usage_spike', name: 'High Usage', semanticType: 'api_calls', condition: '$api_calls > PERCENTILE(90)' },
      { id: 'upgrade_prompt', name: 'Sees Upgrade', semanticType: 'event_name', eventPatterns: ['upgrade_shown', 'limit_reached'] },
      { id: 'upgraded', name: 'Upgraded', semanticType: 'plan_change' },
    ],
  },
];

/**
 * Chart configurations
 */
const chartConfigs: ChartConfig = {
  types: [
    {
      type: 'line',
      name: 'MRR Trend',
      description: 'Monthly recurring revenue over time',
      metrics: ['total_mrr', 'net_mrr_growth'],
    },
    {
      type: 'area',
      name: 'Revenue Composition',
      description: 'MRR breakdown by plan tier',
      metrics: ['total_mrr', 'arpa'],
    },
    {
      type: 'funnel',
      name: 'Conversion Funnel',
      description: 'Trial to paid conversion',
      metrics: ['trial_to_paid'],
    },
    {
      type: 'bar',
      name: 'Churn Analysis',
      description: 'Churn by reason and segment',
      metrics: ['churn_rate', 'revenue_churn'],
    },
    {
      type: 'cohort',
      name: 'Retention Cohorts',
      description: 'Revenue retention by signup month',
      metrics: ['nrr', 'grr'],
    },
    {
      type: 'heatmap',
      name: 'Feature Adoption',
      description: 'Feature usage by customer segment',
      metrics: ['feature_adoption'],
    },
  ],
  defaultCharts: ['line', 'funnel', 'cohort'],
};

/**
 * Insight templates
 */
const insightTemplates: InsightTemplate[] = [
  {
    id: 'nrr_strong',
    name: 'Strong NRR',
    template: 'Net Revenue Retention of {{nrr}}% indicates healthy expansion outpacing churn.',
    requiredMetrics: ['nrr'],
    priority: 9,
    category: 'positive',
  },
  {
    id: 'churn_warning',
    name: 'Churn Alert',
    template: 'Churn rate of {{churn_rate}}% is above target. Review recent cancellation reasons.',
    requiredMetrics: ['churn_rate'],
    priority: 10,
    category: 'negative',
  },
  {
    id: 'trial_conversion_low',
    name: 'Trial Conversion Issue',
    template: 'Only {{trial_to_paid}}% of trials convert. Consider improving onboarding experience.',
    requiredMetrics: ['trial_to_paid'],
    priority: 8,
    category: 'actionable',
  },
  {
    id: 'seat_utilization_low',
    name: 'Low Seat Usage',
    template: 'Only {{seats_utilization}}% of seats are active. Risk of downgrades at renewal.',
    requiredMetrics: ['seats_utilization'],
    priority: 7,
    category: 'actionable',
  },
];

/**
 * SaaS terminology
 */
const terminology: TerminologyMap = {
  user: { singular: 'Customer', plural: 'Customers' },
  session: { singular: 'Visit', plural: 'Visits' },
  conversion: { singular: 'Conversion', plural: 'Conversions' },
  revenue: { singular: 'MRR', plural: 'MRR' },
  account: { singular: 'Account', plural: 'Accounts' },
  subscription: { singular: 'Subscription', plural: 'Subscriptions' },
};

/**
 * SaaS theme
 */
const theme: IndustryTheme = {
  primaryColor: '#3b82f6', // Blue
  accentColor: '#0ea5e9', // Sky
  chartColors: [
    '#3b82f6', // Blue
    '#0ea5e9', // Sky
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
  ],
  icon: 'building-2',
};

/**
 * Complete SaaS Industry Pack
 */
export const SaaSPack: IndustryPack = {
  id: 'saas',
  name: 'SaaS',
  description: 'Subscription software analytics with MRR, churn, retention, and feature adoption tracking.',
  version: '1.0.0',

  subCategories: [
    { id: 'b2b', name: 'B2B SaaS', description: 'Enterprise and business software' },
    { id: 'b2c', name: 'B2C SaaS', description: 'Consumer subscription products' },
    { id: 'api', name: 'API Products', description: 'Developer tools and APIs' },
    { id: 'marketplace', name: 'Marketplace', description: 'Multi-tenant platforms' },
    { id: 'custom', name: 'Custom', description: 'Other SaaS types' },
  ],

  semanticTypes,
  detectionIndicators,
  metrics,
  funnels,
  chartConfigs,
  insightTemplates,
  terminology,
  theme,

  metadata: {
    author: 'ProductInsights',
    license: 'MIT',
  },
};

/**
 * Load and register the SaaS pack
 */
export function loadSaaSPack(): IndustryPack {
  return SaaSPack;
}

export default SaaSPack;
