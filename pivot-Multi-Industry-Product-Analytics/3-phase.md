# Phase 3: New Industry Packs (SaaS & E-commerce)

## Objective
Create two new industry packs (SaaS and E-commerce) to validate the multi-industry architecture and provide immediate value for non-gaming users. These packs will serve as templates for future industry additions.

---

## Duration
**Estimated: 2 weeks**

---

## Prerequisites
- Phase 1 complete (Foundation & Core Abstractions)
- Phase 2 complete (Gaming Pack Migration)

---

## Tasks

### Task 3.1: Create SaaS Pack Structure

**Files to create:**
```
src/industry/packs/saas/
├── index.ts               # Main pack export
├── semanticTypes.ts       # SaaS semantic type definitions
├── indicators.ts          # Detection indicators
├── metrics.ts             # SaaS-specific metrics (MRR, ARR, NRR, etc.)
├── funnels.ts             # Trial conversion, expansion funnels
├── charts.ts              # Chart configurations
├── insights.ts            # SaaS insight templates
├── terminology.ts         # SaaS vocabulary
├── theme.ts               # SaaS theme
└── tips.ts                # SaaS tips per sub-category
```

---

### Task 3.2: SaaS Semantic Types

**File:** `src/industry/packs/saas/semanticTypes.ts`

```typescript
import { IndustrySemanticType } from '../../types';

export const saasSemanticTypes: IndustrySemanticType[] = [
  // Revenue types
  {
    type: 'mrr',
    patterns: [/^mrr$/i, /monthly.*recurring/i, /mrr.*value/i],
    industry: 'saas',
    category: 'revenue',
    description: 'Monthly Recurring Revenue',
  },
  {
    type: 'arr',
    patterns: [/^arr$/i, /annual.*recurring/i, /arr.*value/i],
    industry: 'saas',
    category: 'revenue',
    description: 'Annual Recurring Revenue',
  },
  {
    type: 'expansion_mrr',
    patterns: [/expansion/i, /upgrade.*revenue/i, /upsell/i],
    industry: 'saas',
    category: 'revenue',
    description: 'Expansion MRR from upgrades',
  },
  {
    type: 'contraction_mrr',
    patterns: [/contraction/i, /downgrade/i, /reduction/i],
    industry: 'saas',
    category: 'revenue',
    description: 'Contraction MRR from downgrades',
  },
  {
    type: 'churned_mrr',
    patterns: [/churned.*mrr/i, /lost.*revenue/i, /cancelled.*mrr/i],
    industry: 'saas',
    category: 'revenue',
    description: 'MRR lost to churn',
  },

  // Subscription types
  {
    type: 'subscription_tier',
    patterns: [/tier/i, /plan/i, /subscription.*type/i, /pricing.*tier/i],
    industry: 'saas',
    category: 'progression',
    description: 'Subscription plan/tier',
  },
  {
    type: 'subscription_status',
    patterns: [/subscription.*status/i, /account.*status/i, /active.*status/i],
    industry: 'saas',
    category: 'quality',
    description: 'Subscription status (active/cancelled/paused)',
  },
  {
    type: 'billing_cycle',
    patterns: [/billing.*cycle/i, /payment.*interval/i, /monthly|annual|yearly/i],
    industry: 'saas',
    category: 'demographic',
    description: 'Billing frequency',
  },

  // Trial types
  {
    type: 'trial_start',
    patterns: [/trial.*start/i, /started.*trial/i, /trial.*begin/i],
    industry: 'saas',
    category: 'timestamp',
    description: 'Trial start date',
  },
  {
    type: 'trial_end',
    patterns: [/trial.*end/i, /trial.*expire/i, /trial.*expir/i],
    industry: 'saas',
    category: 'timestamp',
    description: 'Trial end date',
  },
  {
    type: 'trial_status',
    patterns: [/trial.*status/i, /in.*trial/i, /trial.*active/i],
    industry: 'saas',
    category: 'quality',
    description: 'Trial status',
  },

  // Churn types
  {
    type: 'churn_date',
    patterns: [/churn.*date/i, /cancel.*date/i, /cancelled.*at/i],
    industry: 'saas',
    category: 'timestamp',
    description: 'Churn/cancellation date',
  },
  {
    type: 'churn_reason',
    patterns: [/churn.*reason/i, /cancel.*reason/i, /cancellation.*reason/i],
    industry: 'saas',
    category: 'quality',
    description: 'Reason for churning',
  },

  // Engagement types
  {
    type: 'feature_usage',
    patterns: [/feature.*usage/i, /feature.*used/i, /feature.*adopted/i],
    industry: 'saas',
    category: 'engagement',
    description: 'Feature adoption/usage',
  },
  {
    type: 'seats',
    patterns: [/^seats$/i, /licenses/i, /user.*count/i, /team.*size/i],
    industry: 'saas',
    category: 'engagement',
    description: 'Number of seats/licenses',
  },
  {
    type: 'api_calls',
    patterns: [/api.*calls/i, /api.*requests/i, /requests.*count/i],
    industry: 'saas',
    category: 'engagement',
    description: 'API usage count',
  },
  {
    type: 'storage_used',
    patterns: [/storage/i, /disk.*usage/i, /data.*size/i],
    industry: 'saas',
    category: 'engagement',
    description: 'Storage consumed',
  },
  {
    type: 'login_count',
    patterns: [/login.*count/i, /sign.*ins/i, /logins/i],
    industry: 'saas',
    category: 'engagement',
    description: 'Number of logins',
  },

  // Customer success types
  {
    type: 'nps_score',
    patterns: [/^nps$/i, /net.*promoter/i, /nps.*score/i],
    industry: 'saas',
    category: 'engagement',
    description: 'Net Promoter Score',
  },
  {
    type: 'csat_score',
    patterns: [/csat/i, /satisfaction.*score/i, /satisfaction.*rating/i],
    industry: 'saas',
    category: 'engagement',
    description: 'Customer Satisfaction Score',
  },
  {
    type: 'health_score',
    patterns: [/health.*score/i, /customer.*health/i, /account.*health/i],
    industry: 'saas',
    category: 'quality',
    description: 'Customer health score',
  },
  {
    type: 'support_tickets',
    patterns: [/support.*ticket/i, /ticket.*count/i, /help.*request/i],
    industry: 'saas',
    category: 'quality',
    description: 'Support ticket count',
  },

  // Acquisition types
  {
    type: 'acquisition_source',
    patterns: [/acquisition.*source/i, /signup.*source/i, /lead.*source/i],
    industry: 'saas',
    category: 'demographic',
    description: 'Customer acquisition channel',
  },
  {
    type: 'acquisition_cost',
    patterns: [/acquisition.*cost/i, /^cac$/i, /customer.*cost/i],
    industry: 'saas',
    category: 'revenue',
    description: 'Customer acquisition cost',
  },

  // Company types (B2B)
  {
    type: 'company_name',
    patterns: [/company.*name/i, /org.*name/i, /account.*name/i],
    industry: 'saas',
    category: 'identifier',
    description: 'Company/organization name',
  },
  {
    type: 'company_size',
    patterns: [/company.*size/i, /employee.*count/i, /org.*size/i],
    industry: 'saas',
    category: 'demographic',
    description: 'Company size',
  },
  {
    type: 'industry_vertical',
    patterns: [/industry/i, /vertical/i, /sector/i],
    industry: 'saas',
    category: 'demographic',
    description: 'Customer industry vertical',
  },
];
```

---

### Task 3.3: SaaS Detection Indicators

**File:** `src/industry/packs/saas/indicators.ts`

```typescript
import { DetectionIndicator, IndustrySubCategory } from '../../types';

export const saasIndicators: Map<IndustrySubCategory, DetectionIndicator[]> = new Map([
  ['b2b', [
    { signals: ['mrr', 'arr'], weight: 5 },
    { signals: ['subscription_tier'], weight: 4 },
    { signals: ['seats', 'licenses'], weight: 4 },
    { signals: ['company_name', 'company_size'], weight: 4 },
    { signals: ['expansion_mrr', 'contraction_mrr'], weight: 3 },
    { signals: ['nps_score', 'health_score'], weight: 2 },
  ]],

  ['b2c', [
    { signals: ['mrr'], weight: 5 },
    { signals: ['subscription_tier'], weight: 4 },
    { signals: ['trial_start', 'trial_end'], weight: 3 },
    { signals: ['churn_date', 'churn_reason'], weight: 3 },
    { signals: ['feature_usage'], weight: 2 },
  ]],

  ['api', [
    { signals: ['api_calls'], weight: 5 },
    { signals: ['mrr'], weight: 3 },
    { signals: ['subscription_tier'], weight: 3 },
    { signals: ['storage_used'], weight: 2 },
  ]],

  ['marketplace', [
    { signals: ['mrr'], weight: 4 },
    { signals: ['subscription_tier'], weight: 3 },
    { signals: ['seats'], weight: 3 },
    { signals: ['feature_usage'], weight: 2 },
  ]],

  ['custom', [
    { signals: ['subscription_tier'], weight: 3 },
    { signals: ['mrr'], weight: 3 },
    { signals: ['user_id', 'timestamp'], weight: 1 },
  ]],
]);
```

---

### Task 3.4: SaaS Metrics

**File:** `src/industry/packs/saas/metrics.ts`

```typescript
import { MetricDefinition } from '../../types';

export const saasMetrics: MetricDefinition[] = [
  // Revenue metrics
  {
    id: 'mrr',
    name: 'MRR',
    description: 'Monthly Recurring Revenue',
    formula: 'SUM(mrr)',
    requiredSemantics: ['mrr'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 0, prefix: '$' },
  },
  {
    id: 'arr',
    name: 'ARR',
    description: 'Annual Recurring Revenue',
    formula: 'mrr * 12',
    requiredSemantics: ['mrr'],
    category: 'derived',
    formatting: { type: 'currency', decimals: 0, prefix: '$' },
  },
  {
    id: 'nrr',
    name: 'NRR',
    description: 'Net Revenue Retention',
    formula: '(mrr + expansion_mrr - contraction_mrr - churned_mrr) / mrr_start',
    requiredSemantics: ['mrr', 'expansion_mrr', 'contraction_mrr'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 0 },
    benchmarks: { poor: 0.9, average: 1.0, good: 1.1, excellent: 1.2 },
  },
  {
    id: 'grr',
    name: 'GRR',
    description: 'Gross Revenue Retention',
    formula: '(mrr - contraction_mrr - churned_mrr) / mrr_start',
    requiredSemantics: ['mrr', 'contraction_mrr'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 0 },
    benchmarks: { poor: 0.8, average: 0.9, good: 0.95, excellent: 0.98 },
  },
  {
    id: 'arpu',
    name: 'ARPU',
    description: 'Average Revenue Per User',
    formula: 'SUM(mrr) / COUNT(DISTINCT user_id)',
    requiredSemantics: ['mrr', 'user_id'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 2, prefix: '$' },
  },
  {
    id: 'arpa',
    name: 'ARPA',
    description: 'Average Revenue Per Account',
    formula: 'SUM(mrr) / COUNT(DISTINCT company_name)',
    requiredSemantics: ['mrr', 'company_name'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 2, prefix: '$' },
  },

  // Churn metrics
  {
    id: 'churn_rate',
    name: 'Churn Rate',
    description: 'Monthly customer churn rate',
    formula: 'churned_customers / total_customers_start',
    requiredSemantics: ['churn_date', 'user_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { excellent: 0.02, good: 0.05, average: 0.08, poor: 0.10 },
  },
  {
    id: 'revenue_churn',
    name: 'Revenue Churn',
    description: 'Monthly MRR churn rate',
    formula: 'churned_mrr / mrr_start',
    requiredSemantics: ['churned_mrr', 'mrr'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { excellent: 0.01, good: 0.03, average: 0.05, poor: 0.08 },
  },

  // Acquisition metrics
  {
    id: 'cac',
    name: 'CAC',
    description: 'Customer Acquisition Cost',
    formula: 'SUM(acquisition_cost)',
    requiredSemantics: ['acquisition_cost'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 2, prefix: '$' },
  },
  {
    id: 'ltv',
    name: 'LTV',
    description: 'Customer Lifetime Value',
    formula: 'arpu / churn_rate',
    requiredSemantics: ['mrr', 'churn_date'],
    category: 'derived',
    formatting: { type: 'currency', decimals: 0, prefix: '$' },
  },
  {
    id: 'ltv_cac_ratio',
    name: 'LTV:CAC',
    description: 'LTV to CAC Ratio',
    formula: 'ltv / cac',
    requiredSemantics: ['mrr', 'acquisition_cost'],
    category: 'kpi',
    formatting: { type: 'number', decimals: 1, suffix: 'x' },
    benchmarks: { poor: 1, average: 2, good: 3, excellent: 5 },
  },
  {
    id: 'cac_payback',
    name: 'CAC Payback',
    description: 'Months to recover CAC',
    formula: 'cac / arpu',
    requiredSemantics: ['acquisition_cost', 'mrr'],
    category: 'derived',
    formatting: { type: 'number', decimals: 1, suffix: ' months' },
    benchmarks: { excellent: 6, good: 12, average: 18, poor: 24 },
  },

  // Trial metrics
  {
    id: 'trial_conversion',
    name: 'Trial Conversion',
    description: 'Trial to paid conversion rate',
    formula: 'converted_trials / total_trials',
    requiredSemantics: ['trial_start', 'subscription_status'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { poor: 0.10, average: 0.20, good: 0.30, excellent: 0.40 },
  },
  {
    id: 'time_to_value',
    name: 'Time to Value',
    description: 'Days to first key action',
    formula: 'AVG(first_value_date - signup_date)',
    requiredSemantics: ['timestamp', 'feature_usage'],
    category: 'kpi',
    formatting: { type: 'number', decimals: 1, suffix: ' days' },
    benchmarks: { excellent: 1, good: 3, average: 7, poor: 14 },
  },

  // Engagement metrics
  {
    id: 'active_users',
    name: 'Active Users',
    description: 'Monthly active users',
    formula: 'COUNT(DISTINCT user_id)',
    requiredSemantics: ['user_id', 'timestamp'],
    category: 'kpi',
    formatting: { type: 'number', decimals: 0 },
  },
  {
    id: 'dau_mau',
    name: 'DAU/MAU',
    description: 'Product stickiness ratio',
    formula: 'dau / mau',
    requiredSemantics: ['user_id', 'timestamp'],
    category: 'derived',
    formatting: { type: 'percentage', decimals: 0 },
    benchmarks: { poor: 0.10, average: 0.15, good: 0.20, excellent: 0.25 },
  },
  {
    id: 'feature_adoption',
    name: 'Feature Adoption',
    description: 'Percentage using key features',
    formula: 'users_with_feature / total_users',
    requiredSemantics: ['feature_usage', 'user_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 0 },
  },
  {
    id: 'avg_seats',
    name: 'Avg Seats',
    description: 'Average seats per account',
    formula: 'AVG(seats)',
    requiredSemantics: ['seats'],
    category: 'derived',
    formatting: { type: 'number', decimals: 1 },
  },

  // Health metrics
  {
    id: 'nps',
    name: 'NPS',
    description: 'Net Promoter Score',
    formula: 'promoters_pct - detractors_pct',
    requiredSemantics: ['nps_score'],
    category: 'kpi',
    formatting: { type: 'number', decimals: 0 },
    benchmarks: { poor: 0, average: 30, good: 50, excellent: 70 },
  },
  {
    id: 'health_score_avg',
    name: 'Avg Health Score',
    description: 'Average customer health',
    formula: 'AVG(health_score)',
    requiredSemantics: ['health_score'],
    category: 'kpi',
    formatting: { type: 'number', decimals: 0 },
  },
];
```

---

### Task 3.5: SaaS Funnels

**File:** `src/industry/packs/saas/funnels.ts`

```typescript
import { FunnelTemplate } from '../../types';

export const saasFunnels: FunnelTemplate[] = [
  {
    id: 'trial_to_paid',
    name: 'Trial to Paid',
    description: 'Track trial conversion journey',
    type: 'conversion',
    steps: [
      { name: 'Sign Up', eventMatch: ['signup', 'register', 'create_account'] },
      { name: 'Trial Started', eventMatch: ['trial_start', 'trial_begin'] },
      { name: 'Activated', eventMatch: ['activated', 'first_value', 'aha_moment'] },
      { name: 'Engaged', eventMatch: ['engaged', 'active_usage'] },
      { name: 'Converted', eventMatch: ['converted', 'subscribed', 'paid', 'purchase'] },
    ],
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'User onboarding completion',
    type: 'onboarding',
    steps: [
      { name: 'Account Created', eventMatch: ['signup', 'account_created'] },
      { name: 'Profile Setup', eventMatch: ['profile_complete', 'setup_step_1'] },
      { name: 'First Integration', eventMatch: ['integration_added', 'connected'] },
      { name: 'Invited Team', eventMatch: ['invite_sent', 'team_added'] },
      { name: 'First Project', eventMatch: ['project_created', 'workspace_created'] },
    ],
  },
  {
    id: 'expansion',
    name: 'Expansion Path',
    description: 'Track upgrade/expansion journey',
    type: 'progression',
    industrySubCategories: ['b2b'],
    steps: [
      { name: 'Starter', condition: 'subscription_tier = starter' },
      { name: 'Pro', condition: 'subscription_tier = pro' },
      { name: 'Team', condition: 'subscription_tier = team' },
      { name: 'Enterprise', condition: 'subscription_tier = enterprise' },
    ],
  },
  {
    id: 'seat_expansion',
    name: 'Seat Expansion',
    description: 'Track seat/license growth',
    type: 'progression',
    industrySubCategories: ['b2b'],
    steps: [
      { name: '1 Seat', condition: 'seats >= 1' },
      { name: '5 Seats', condition: 'seats >= 5' },
      { name: '10 Seats', condition: 'seats >= 10' },
      { name: '25 Seats', condition: 'seats >= 25' },
      { name: '50+ Seats', condition: 'seats >= 50' },
    ],
  },
  {
    id: 'feature_adoption',
    name: 'Feature Adoption',
    description: 'Core feature usage progression',
    type: 'progression',
    steps: [
      { name: 'Core Feature 1', eventMatch: ['feature_1_used'] },
      { name: 'Core Feature 2', eventMatch: ['feature_2_used'] },
      { name: 'Core Feature 3', eventMatch: ['feature_3_used'] },
      { name: 'Power User', eventMatch: ['all_features_used', 'power_user'] },
    ],
  },
  {
    id: 'api_adoption',
    name: 'API Adoption',
    description: 'API integration journey',
    type: 'conversion',
    industrySubCategories: ['api'],
    steps: [
      { name: 'Docs Visited', eventMatch: ['docs_view', 'api_docs'] },
      { name: 'API Key Created', eventMatch: ['api_key_created'] },
      { name: 'First Call', eventMatch: ['first_api_call'] },
      { name: 'Regular Usage', condition: 'api_calls >= 100' },
      { name: 'High Volume', condition: 'api_calls >= 10000' },
    ],
  },
];
```

---

### Task 3.6: Create E-commerce Pack

**File:** `src/industry/packs/ecommerce/semanticTypes.ts`

```typescript
import { IndustrySemanticType } from '../../types';

export const ecommerceSemanticTypes: IndustrySemanticType[] = [
  // Order types
  {
    type: 'order_id',
    patterns: [/order.*id/i, /transaction.*id/i, /purchase.*id/i],
    industry: 'ecommerce',
    category: 'identifier',
    description: 'Order/transaction identifier',
  },
  {
    type: 'order_status',
    patterns: [/order.*status/i, /status/i, /fulfillment.*status/i],
    industry: 'ecommerce',
    category: 'quality',
    description: 'Order status (pending/shipped/delivered)',
  },
  {
    type: 'order_total',
    patterns: [/order.*total/i, /total.*amount/i, /grand.*total/i],
    industry: 'ecommerce',
    category: 'revenue',
    description: 'Total order value',
  },

  // Product types
  {
    type: 'sku',
    patterns: [/^sku$/i, /product.*code/i, /item.*code/i, /product.*sku/i],
    industry: 'ecommerce',
    category: 'identifier',
    description: 'Product SKU',
  },
  {
    type: 'product_name',
    patterns: [/product.*name/i, /item.*name/i, /product.*title/i],
    industry: 'ecommerce',
    category: 'identifier',
    description: 'Product name',
  },
  {
    type: 'product_category',
    patterns: [/category/i, /product.*category/i, /item.*type/i],
    industry: 'ecommerce',
    category: 'demographic',
    description: 'Product category',
  },
  {
    type: 'product_price',
    patterns: [/^price$/i, /unit.*price/i, /product.*price/i],
    industry: 'ecommerce',
    category: 'revenue',
    description: 'Product price',
  },
  {
    type: 'quantity',
    patterns: [/quantity/i, /qty/i, /item.*count/i],
    industry: 'ecommerce',
    category: 'engagement',
    description: 'Quantity purchased',
  },

  // Cart types
  {
    type: 'cart_id',
    patterns: [/cart.*id/i, /basket.*id/i],
    industry: 'ecommerce',
    category: 'identifier',
    description: 'Cart/basket identifier',
  },
  {
    type: 'cart_value',
    patterns: [/cart.*value/i, /basket.*value/i, /cart.*total/i],
    industry: 'ecommerce',
    category: 'revenue',
    description: 'Cart/basket value',
  },
  {
    type: 'cart_abandoned',
    patterns: [/abandoned/i, /cart.*left/i, /incomplete/i],
    industry: 'ecommerce',
    category: 'engagement',
    description: 'Cart abandonment indicator',
  },

  // Checkout types
  {
    type: 'checkout_step',
    patterns: [/checkout.*step/i, /step/i, /funnel.*step/i],
    industry: 'ecommerce',
    category: 'progression',
    description: 'Checkout step number',
  },
  {
    type: 'payment_method',
    patterns: [/payment.*method/i, /payment.*type/i, /card.*type/i],
    industry: 'ecommerce',
    category: 'demographic',
    description: 'Payment method used',
  },
  {
    type: 'shipping_method',
    patterns: [/shipping/i, /delivery.*method/i, /shipping.*type/i],
    industry: 'ecommerce',
    category: 'demographic',
    description: 'Shipping method',
  },
  {
    type: 'shipping_cost',
    patterns: [/shipping.*cost/i, /delivery.*cost/i, /freight/i],
    industry: 'ecommerce',
    category: 'revenue',
    description: 'Shipping cost',
  },

  // Discount types
  {
    type: 'discount_code',
    patterns: [/discount/i, /coupon/i, /promo.*code/i, /voucher/i],
    industry: 'ecommerce',
    category: 'revenue',
    description: 'Discount/promo code',
  },
  {
    type: 'discount_amount',
    patterns: [/discount.*amount/i, /savings/i, /coupon.*value/i],
    industry: 'ecommerce',
    category: 'revenue',
    description: 'Discount amount',
  },

  // Customer types
  {
    type: 'customer_type',
    patterns: [/customer.*type/i, /new.*returning/i, /buyer.*type/i],
    industry: 'ecommerce',
    category: 'demographic',
    description: 'New vs returning customer',
  },
  {
    type: 'order_count',
    patterns: [/order.*count/i, /purchase.*count/i, /orders.*total/i],
    industry: 'ecommerce',
    category: 'engagement',
    description: 'Total orders by customer',
  },

  // Returns types
  {
    type: 'return_id',
    patterns: [/return.*id/i, /rma/i, /refund.*id/i],
    industry: 'ecommerce',
    category: 'identifier',
    description: 'Return/refund identifier',
  },
  {
    type: 'return_reason',
    patterns: [/return.*reason/i, /refund.*reason/i, /cancellation.*reason/i],
    industry: 'ecommerce',
    category: 'quality',
    description: 'Return reason',
  },
  {
    type: 'return_amount',
    patterns: [/return.*amount/i, /refund.*amount/i],
    industry: 'ecommerce',
    category: 'revenue',
    description: 'Return/refund amount',
  },

  // Marketing types
  {
    type: 'traffic_source',
    patterns: [/traffic.*source/i, /source/i, /utm.*source/i, /channel/i],
    industry: 'ecommerce',
    category: 'demographic',
    description: 'Traffic source',
  },
  {
    type: 'campaign',
    patterns: [/campaign/i, /utm.*campaign/i, /marketing.*campaign/i],
    industry: 'ecommerce',
    category: 'demographic',
    description: 'Marketing campaign',
  },

  // Review types
  {
    type: 'review_rating',
    patterns: [/rating/i, /stars/i, /review.*score/i],
    industry: 'ecommerce',
    category: 'engagement',
    description: 'Product rating',
  },
  {
    type: 'review_text',
    patterns: [/review.*text/i, /feedback/i, /comment/i],
    industry: 'ecommerce',
    category: 'engagement',
    description: 'Review text',
  },
];
```

---

### Task 3.7: E-commerce Metrics

**File:** `src/industry/packs/ecommerce/metrics.ts`

```typescript
import { MetricDefinition } from '../../types';

export const ecommerceMetrics: MetricDefinition[] = [
  // Revenue metrics
  {
    id: 'gmv',
    name: 'GMV',
    description: 'Gross Merchandise Value',
    formula: 'SUM(order_total)',
    requiredSemantics: ['order_total'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 0, prefix: '$' },
  },
  {
    id: 'revenue',
    name: 'Revenue',
    description: 'Net revenue after discounts',
    formula: 'SUM(order_total) - SUM(discount_amount)',
    requiredSemantics: ['order_total'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 0, prefix: '$' },
  },
  {
    id: 'aov',
    name: 'AOV',
    description: 'Average Order Value',
    formula: 'SUM(order_total) / COUNT(DISTINCT order_id)',
    requiredSemantics: ['order_total', 'order_id'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 2, prefix: '$' },
    benchmarks: { poor: 30, average: 60, good: 100, excellent: 150 },
  },
  {
    id: 'items_per_order',
    name: 'Items/Order',
    description: 'Average items per order',
    formula: 'SUM(quantity) / COUNT(DISTINCT order_id)',
    requiredSemantics: ['quantity', 'order_id'],
    category: 'derived',
    formatting: { type: 'number', decimals: 1 },
  },

  // Conversion metrics
  {
    id: 'conversion_rate',
    name: 'Conversion Rate',
    description: 'Visitors to purchasers',
    formula: 'purchasers / visitors',
    requiredSemantics: ['user_id', 'order_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 2 },
    benchmarks: { poor: 0.01, average: 0.02, good: 0.03, excellent: 0.05 },
  },
  {
    id: 'cart_abandonment_rate',
    name: 'Cart Abandonment',
    description: 'Carts abandoned before purchase',
    formula: 'abandoned_carts / total_carts',
    requiredSemantics: ['cart_abandoned'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { excellent: 0.55, good: 0.65, average: 0.70, poor: 0.80 },
  },
  {
    id: 'checkout_completion',
    name: 'Checkout Completion',
    description: 'Started checkout to purchase',
    formula: 'completed_checkouts / started_checkouts',
    requiredSemantics: ['checkout_step', 'order_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
  },

  // Customer metrics
  {
    id: 'repeat_purchase_rate',
    name: 'Repeat Purchase Rate',
    description: 'Customers who order again',
    formula: 'repeat_customers / total_customers',
    requiredSemantics: ['user_id', 'order_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { poor: 0.15, average: 0.25, good: 0.35, excellent: 0.50 },
  },
  {
    id: 'purchase_frequency',
    name: 'Purchase Frequency',
    description: 'Avg orders per customer',
    formula: 'COUNT(order_id) / COUNT(DISTINCT user_id)',
    requiredSemantics: ['order_id', 'user_id'],
    category: 'derived',
    formatting: { type: 'number', decimals: 2 },
  },
  {
    id: 'clv',
    name: 'CLV',
    description: 'Customer Lifetime Value',
    formula: 'aov * purchase_frequency * customer_lifespan',
    requiredSemantics: ['order_total', 'user_id'],
    category: 'derived',
    formatting: { type: 'currency', decimals: 0, prefix: '$' },
  },
  {
    id: 'new_vs_returning',
    name: 'New Customer %',
    description: 'Percentage of new customers',
    formula: 'new_customers / total_customers',
    requiredSemantics: ['customer_type'],
    category: 'derived',
    formatting: { type: 'percentage', decimals: 0 },
  },

  // Product metrics
  {
    id: 'top_products',
    name: 'Top Products',
    description: 'Best selling products',
    formula: 'GROUP BY sku ORDER BY SUM(quantity) DESC',
    requiredSemantics: ['sku', 'quantity'],
    category: 'aggregate',
    formatting: { type: 'number', decimals: 0 },
  },
  {
    id: 'avg_rating',
    name: 'Avg Rating',
    description: 'Average product rating',
    formula: 'AVG(review_rating)',
    requiredSemantics: ['review_rating'],
    category: 'derived',
    formatting: { type: 'number', decimals: 1, suffix: ' stars' },
  },

  // Return metrics
  {
    id: 'return_rate',
    name: 'Return Rate',
    description: 'Orders returned',
    formula: 'returned_orders / total_orders',
    requiredSemantics: ['return_id', 'order_id'],
    category: 'kpi',
    formatting: { type: 'percentage', decimals: 1 },
    benchmarks: { excellent: 0.05, good: 0.10, average: 0.15, poor: 0.25 },
  },
  {
    id: 'refund_amount',
    name: 'Refund Total',
    description: 'Total refunds issued',
    formula: 'SUM(return_amount)',
    requiredSemantics: ['return_amount'],
    category: 'kpi',
    formatting: { type: 'currency', decimals: 0, prefix: '$' },
  },

  // Marketing metrics
  {
    id: 'discount_usage',
    name: 'Discount Usage',
    description: 'Orders with discounts',
    formula: 'orders_with_discount / total_orders',
    requiredSemantics: ['discount_code'],
    category: 'derived',
    formatting: { type: 'percentage', decimals: 0 },
  },
  {
    id: 'avg_discount',
    name: 'Avg Discount',
    description: 'Average discount per order',
    formula: 'AVG(discount_amount)',
    requiredSemantics: ['discount_amount'],
    category: 'derived',
    formatting: { type: 'currency', decimals: 2, prefix: '$' },
  },
];
```

---

### Task 3.8: E-commerce Funnels

**File:** `src/industry/packs/ecommerce/funnels.ts`

```typescript
import { FunnelTemplate } from '../../types';

export const ecommerceFunnels: FunnelTemplate[] = [
  {
    id: 'checkout_funnel',
    name: 'Checkout Funnel',
    description: 'Standard e-commerce checkout flow',
    type: 'conversion',
    steps: [
      { name: 'Product View', eventMatch: ['product_view', 'pdp', 'view_item'] },
      { name: 'Add to Cart', eventMatch: ['add_to_cart', 'cart_add', 'add_item'] },
      { name: 'View Cart', eventMatch: ['view_cart', 'cart_view'] },
      { name: 'Checkout Start', eventMatch: ['checkout_start', 'begin_checkout'] },
      { name: 'Shipping Info', eventMatch: ['add_shipping', 'shipping_info'] },
      { name: 'Payment Info', eventMatch: ['add_payment', 'payment_info'] },
      { name: 'Purchase', eventMatch: ['purchase', 'order_complete', 'transaction'] },
    ],
  },
  {
    id: 'browse_to_buy',
    name: 'Browse to Buy',
    description: 'Simplified conversion funnel',
    type: 'conversion',
    steps: [
      { name: 'Visit', eventMatch: ['page_view', 'visit', 'session_start'] },
      { name: 'Browse', eventMatch: ['category_view', 'search', 'browse'] },
      { name: 'Product View', eventMatch: ['product_view', 'view_item'] },
      { name: 'Purchase', eventMatch: ['purchase', 'transaction'] },
    ],
  },
  {
    id: 'repeat_purchase',
    name: 'Repeat Purchase Journey',
    description: 'Track customer return purchases',
    type: 'progression',
    steps: [
      { name: 'First Purchase', condition: 'order_count = 1' },
      { name: 'Second Purchase', condition: 'order_count = 2' },
      { name: 'Third Purchase', condition: 'order_count = 3' },
      { name: 'Loyal (5+)', condition: 'order_count >= 5' },
      { name: 'VIP (10+)', condition: 'order_count >= 10' },
    ],
  },
  {
    id: 'cart_recovery',
    name: 'Cart Recovery',
    description: 'Abandoned cart to purchase',
    type: 'conversion',
    steps: [
      { name: 'Cart Abandoned', eventMatch: ['cart_abandoned', 'checkout_exit'] },
      { name: 'Email Sent', eventMatch: ['recovery_email_sent'] },
      { name: 'Email Opened', eventMatch: ['recovery_email_opened'] },
      { name: 'Returned', eventMatch: ['cart_recovered', 'return_visit'] },
      { name: 'Purchased', eventMatch: ['purchase', 'transaction'] },
    ],
  },
  {
    id: 'subscription_box',
    name: 'Subscription Flow',
    description: 'Subscription box conversion',
    type: 'conversion',
    industrySubCategories: ['subscription_box'],
    steps: [
      { name: 'Landing Page', eventMatch: ['subscription_page', 'landing'] },
      { name: 'Plan Selected', eventMatch: ['plan_select', 'subscription_select'] },
      { name: 'Preferences Set', eventMatch: ['preferences_complete'] },
      { name: 'Payment Added', eventMatch: ['payment_added', 'subscribe'] },
      { name: 'First Box Shipped', eventMatch: ['first_shipment', 'box_shipped'] },
    ],
  },
];
```

---

### Task 3.9: Assemble Both Packs

**File:** `src/industry/packs/saas/index.ts`

```typescript
import { IndustryPack } from '../../types';
import { saasSemanticTypes } from './semanticTypes';
import { saasIndicators } from './indicators';
import { saasMetrics } from './metrics';
import { saasFunnels } from './funnels';

export const saasPack: IndustryPack = {
  id: 'saas',
  name: 'SaaS Analytics',
  description: 'Analytics for subscription-based software products',
  version: '1.0.0',

  subCategories: [
    { id: 'b2b', name: 'B2B SaaS', description: 'Enterprise software', icon: '🏢' },
    { id: 'b2c', name: 'B2C SaaS', description: 'Consumer subscriptions', icon: '👤' },
    { id: 'api', name: 'API/Developer', description: 'Developer tools & APIs', icon: '⚙️' },
    { id: 'marketplace', name: 'Marketplace', description: 'Two-sided platforms', icon: '🛒' },
    { id: 'custom', name: 'Custom SaaS', description: 'Other SaaS products', icon: '☁️' },
  ],

  semanticTypes: saasSemanticTypes,
  indicators: saasIndicators,
  metrics: saasMetrics,
  funnelTemplates: saasFunnels,
  chartConfigs: [], // Add chart configs
  chartTitles: new Map(),
  insightTemplates: [], // Add insight templates
  tips: new Map([
    ['b2b', [
      'NRR above 100% indicates healthy expansion',
      'CAC payback under 12 months is ideal',
      'Track seat expansion as a leading indicator',
      'Monitor health scores to predict churn',
    ]],
    ['b2c', [
      'Trial conversion is your key metric',
      'Time to value predicts conversion rates',
      'Feature adoption drives retention',
      'Watch for payment failures causing involuntary churn',
    ]],
  ]),

  terminology: {
    user: 'customer',
    session: 'visit',
    conversion: 'subscription',
    retention: 'renewal',
    revenue: 'MRR',
    churn: 'churn',
    level: 'tier',
    score: 'usage',
  },

  sidebarPriorities: new Map([
    ['b2b', { 'Overview': 1, 'Monetization': 2, 'Funnels': 3, 'Health': 4 }],
    ['b2c', { 'Overview': 1, 'Funnels': 2, 'Monetization': 3, 'Health': 4 }],
  ]),

  theme: {
    primaryColor: '#3b82f6',
    accentColor: '#06b6d4',
    chartColors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    icon: '☁️',
  },
};

export default saasPack;
```

**File:** `src/industry/packs/ecommerce/index.ts`

```typescript
import { IndustryPack } from '../../types';
import { ecommerceSemanticTypes } from './semanticTypes';
import { ecommerceIndicators } from './indicators';
import { ecommerceMetrics } from './metrics';
import { ecommerceFunnels } from './funnels';

export const ecommercePack: IndustryPack = {
  id: 'ecommerce',
  name: 'E-commerce Analytics',
  description: 'Analytics for online retail and marketplaces',
  version: '1.0.0',

  subCategories: [
    { id: 'retail', name: 'Online Retail', description: 'Direct-to-consumer stores', icon: '🛍️' },
    { id: 'marketplace', name: 'Marketplace', description: 'Multi-vendor platforms', icon: '🏪' },
    { id: 'subscription_box', name: 'Subscription Box', description: 'Recurring product delivery', icon: '📦' },
    { id: 'digital', name: 'Digital Products', description: 'Downloads, courses, media', icon: '💾' },
    { id: 'custom', name: 'Custom Store', description: 'Other e-commerce', icon: '🛒' },
  ],

  semanticTypes: ecommerceSemanticTypes,
  indicators: new Map([
    ['retail', [
      { signals: ['order_id', 'cart_value'], weight: 5 },
      { signals: ['sku', 'product_name'], weight: 4 },
      { signals: ['cart_abandoned'], weight: 3 },
      { signals: ['shipping_method'], weight: 2 },
    ]],
    ['marketplace', [
      { signals: ['order_id'], weight: 5 },
      { signals: ['sku'], weight: 4 },
      { signals: ['seller_id', 'vendor_id'], weight: 4 },
    ]],
    ['subscription_box', [
      { signals: ['subscription_id'], weight: 5 },
      { signals: ['order_id'], weight: 4 },
      { signals: ['box_number', 'shipment'], weight: 3 },
    ]],
  ]),
  metrics: ecommerceMetrics,
  funnelTemplates: ecommerceFunnels,
  chartConfigs: [],
  chartTitles: new Map(),
  insightTemplates: [],
  tips: new Map([
    ['retail', [
      'Cart abandonment is your biggest opportunity',
      'Track AOV alongside conversion rate',
      'Return rate impacts true profitability',
      'Repeat purchase rate predicts LTV',
    ]],
  ]),

  terminology: {
    user: 'customer',
    session: 'visit',
    conversion: 'purchase',
    retention: 'repeat purchase',
    revenue: 'GMV',
    churn: 'lapsed',
    level: 'order count',
    score: 'order value',
  },

  sidebarPriorities: new Map([
    ['retail', { 'Overview': 1, 'Funnels': 2, 'Monetization': 3, 'Health': 4 }],
  ]),

  theme: {
    primaryColor: '#10b981',
    accentColor: '#f59e0b',
    chartColors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'],
    icon: '🛒',
  },
};

export default ecommercePack;
```

---

### Task 3.10: Update Pack Loader

**File:** `src/industry/packs/index.ts`

```typescript
import { IndustryPack } from '../types';

export async function loadBuiltInPacks(): Promise<IndustryPack[]> {
  const packs: IndustryPack[] = [];

  // Load all packs in parallel
  const [gamingModule, saasModule, ecommerceModule] = await Promise.all([
    import('./gaming'),
    import('./saas'),
    import('./ecommerce'),
  ]);

  packs.push(gamingModule.gamingPack);
  packs.push(saasModule.saasPack);
  packs.push(ecommerceModule.ecommercePack);

  return packs;
}

export function getAvailablePackIds(): string[] {
  return ['gaming', 'saas', 'ecommerce'];
}
```

---

## Dependencies

- Phase 1 complete
- Phase 2 complete (Gaming Pack as reference)

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/industry/packs/saas/*` | Complete SaaS pack |
| `src/industry/packs/ecommerce/*` | Complete E-commerce pack |

### Modified Files
| File | Changes |
|------|---------|
| `src/industry/packs/index.ts` | Load new packs |

---

## Acceptance Criteria (Phase Complete)

- [ ] SaaS pack compiles and registers
- [ ] E-commerce pack compiles and registers
- [ ] Detection correctly identifies SaaS data
- [ ] Detection correctly identifies E-commerce data
- [ ] All metrics can be calculated
- [ ] Funnels display correctly
- [ ] Tests pass for both packs

---

## Next Phase

Phase 4 will transform the UI/UX to support multi-industry contexts, including ProductContext and dynamic terminology.
