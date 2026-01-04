/**
 * E-commerce Industry Pack
 *
 * Analytics configuration for online retail and e-commerce platforms.
 * Supports transaction tracking, cart analysis, customer segmentation.
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
 * E-commerce semantic types
 */
const semanticTypes: IndustrySemanticType[] = [
  // Core identification
  { type: 'customer_id', patterns: ['customer_id', 'user_id', 'shopper_id', 'buyer_id', 'customerId'], priority: 10 },
  { type: 'order_id', patterns: ['order_id', 'transaction_id', 'orderId', 'purchase_id'], priority: 10 },
  { type: 'session_id', patterns: ['session_id', 'visit_id', 'sessionId'], priority: 8 },
  { type: 'timestamp', patterns: ['timestamp', 'date', 'order_date', 'purchase_date', 'created_at'], priority: 10 },
  { type: 'event_type', patterns: ['event_type', 'action', 'event_name', 'eventType'], priority: 9 },

  // Product
  { type: 'product_id', patterns: ['product_id', 'sku', 'item_id', 'productId', 'asin'], priority: 9 },
  { type: 'product_name', patterns: ['product_name', 'item_name', 'title', 'name'], priority: 6 },
  { type: 'category', patterns: ['category', 'product_category', 'department', 'category_name'], priority: 7 },
  { type: 'subcategory', patterns: ['subcategory', 'sub_category', 'category_l2'], priority: 5 },
  { type: 'brand', patterns: ['brand', 'manufacturer', 'vendor', 'brand_name'], priority: 6 },

  // Pricing & Revenue
  { type: 'price', patterns: ['price', 'unit_price', 'item_price', 'product_price'], priority: 9 },
  { type: 'quantity', patterns: ['quantity', 'qty', 'units', 'count', 'item_quantity'], priority: 8 },
  { type: 'order_total', patterns: ['order_total', 'total', 'order_value', 'transaction_total', 'gmv'], priority: 10 },
  { type: 'discount', patterns: ['discount', 'discount_amount', 'promo_value', 'savings'], priority: 7 },
  { type: 'shipping_cost', patterns: ['shipping', 'shipping_cost', 'delivery_fee', 'freight'], priority: 6 },
  { type: 'tax', patterns: ['tax', 'tax_amount', 'vat', 'sales_tax'], priority: 5 },
  { type: 'revenue', patterns: ['revenue', 'net_revenue', 'gross_revenue'], priority: 10 },

  // Cart
  { type: 'cart_id', patterns: ['cart_id', 'basket_id', 'cartId'], priority: 8 },
  { type: 'cart_value', patterns: ['cart_value', 'basket_value', 'cart_total'], priority: 9 },
  { type: 'cart_items', patterns: ['cart_items', 'basket_items', 'items_in_cart'], priority: 7 },
  { type: 'cart_abandoned', patterns: ['abandoned', 'cart_abandoned', 'is_abandoned'], priority: 9, description: 'Cart abandonment flag' },

  // Order status
  { type: 'order_status', patterns: ['order_status', 'status', 'fulfillment_status'], priority: 8 },
  { type: 'payment_method', patterns: ['payment_method', 'payment_type', 'payment_provider'], priority: 6 },
  { type: 'payment_status', patterns: ['payment_status', 'payment_state', 'is_paid'], priority: 7 },

  // Shipping & Fulfillment
  { type: 'shipping_method', patterns: ['shipping_method', 'delivery_type', 'shipping_option'], priority: 5 },
  { type: 'delivery_date', patterns: ['delivery_date', 'delivered_at', 'ship_date'], priority: 5 },
  { type: 'tracking_number', patterns: ['tracking', 'tracking_number', 'shipment_id'], priority: 4 },

  // Customer
  { type: 'customer_segment', patterns: ['segment', 'customer_segment', 'customer_type', 'tier'], priority: 7 },
  { type: 'first_purchase', patterns: ['first_purchase', 'first_order', 'first_order_date'], priority: 8 },
  { type: 'lifetime_value', patterns: ['ltv', 'lifetime_value', 'customer_ltv', 'clv'], priority: 8 },
  { type: 'order_count', patterns: ['order_count', 'purchase_count', 'total_orders'], priority: 7 },

  // Returns
  { type: 'return_id', patterns: ['return_id', 'rma', 'refund_id'], priority: 7 },
  { type: 'return_reason', patterns: ['return_reason', 'refund_reason'], priority: 6 },
  { type: 'return_amount', patterns: ['return_amount', 'refund_amount', 'returned_value'], priority: 7 },

  // Marketing
  { type: 'utm_source', patterns: ['utm_source', 'source', 'traffic_source', 'referrer'], priority: 6 },
  { type: 'utm_medium', patterns: ['utm_medium', 'medium', 'channel'], priority: 5 },
  { type: 'utm_campaign', patterns: ['utm_campaign', 'campaign', 'promo_code'], priority: 6 },
  { type: 'coupon_code', patterns: ['coupon', 'coupon_code', 'promo', 'discount_code'], priority: 7 },

  // Demographics
  { type: 'country', patterns: ['country', 'shipping_country', 'billing_country'], priority: 5 },
  { type: 'city', patterns: ['city', 'shipping_city'], priority: 4 },
  { type: 'device', patterns: ['device', 'device_type', 'platform'], priority: 5 },
];

/**
 * Detection indicators for e-commerce
 */
const detectionIndicators: DetectionIndicator[] = [
  { types: ['order_id', 'order_total'], weight: 10, reason: 'Order IDs and totals indicate e-commerce' },
  { types: ['cart_value', 'cart_abandoned'], weight: 10, reason: 'Cart tracking indicates e-commerce' },
  { types: ['product_id', 'price', 'quantity'], weight: 9, reason: 'Product and pricing data' },
  { types: ['shipping_cost', 'shipping_method'], weight: 8, reason: 'Shipping data indicates retail' },
  { types: ['return_id', 'return_amount'], weight: 7, reason: 'Returns tracking' },
  { types: ['category', 'brand'], weight: 6, reason: 'Product categorization' },
  { types: ['coupon_code', 'discount'], weight: 6, reason: 'Promotional mechanics' },
  { types: ['customer_segment', 'lifetime_value'], weight: 7, reason: 'Customer segmentation' },
];

/**
 * E-commerce metrics definitions
 */
const metrics: MetricDefinition[] = [
  // Revenue KPIs
  {
    id: 'gmv',
    name: 'GMV',
    description: 'Gross Merchandise Value',
    formula: { expression: 'SUM($order_total)', requiredTypes: ['order_total'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'revenue',
    name: 'Net Revenue',
    description: 'Revenue after returns and discounts',
    formula: { expression: 'SUM($order_total) - SUM($return_amount) - SUM($discount)', requiredTypes: ['order_total'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'aov',
    name: 'Average Order Value',
    description: 'Average revenue per order',
    formula: { expression: 'SUM($order_total) / COUNT_DISTINCT($order_id)', requiredTypes: ['order_total', 'order_id'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'orders_count',
    name: 'Total Orders',
    description: 'Number of orders placed',
    formula: { expression: 'COUNT_DISTINCT($order_id)', requiredTypes: ['order_id'] },
    format: 'number',
    category: 'kpi',
  },

  // Conversion metrics
  {
    id: 'conversion_rate',
    name: 'Conversion Rate',
    description: 'Percentage of sessions resulting in purchase',
    formula: { expression: 'COUNT_DISTINCT($order_id) / COUNT_DISTINCT($session_id) * 100', requiredTypes: ['order_id', 'session_id'] },
    format: 'percentage',
    category: 'funnel',
    thresholds: { good: 3, warning: 2, bad: 1 },
  },
  {
    id: 'cart_abandonment_rate',
    name: 'Cart Abandonment Rate',
    description: 'Percentage of carts not completed',
    formula: { expression: 'COUNT(WHERE $cart_abandoned = true) / COUNT_DISTINCT($cart_id) * 100', requiredTypes: ['cart_abandoned', 'cart_id'] },
    format: 'percentage',
    category: 'funnel',
    thresholds: { good: 60, warning: 70, bad: 80 },
  },
  {
    id: 'add_to_cart_rate',
    name: 'Add to Cart Rate',
    description: 'Percentage of product views added to cart',
    formula: { expression: 'COUNT(WHERE $event_type = "add_to_cart") / COUNT(WHERE $event_type = "product_view") * 100', requiredTypes: ['event_type'] },
    format: 'percentage',
    category: 'funnel',
  },

  // Customer metrics
  {
    id: 'customers',
    name: 'Unique Customers',
    description: 'Total unique customers',
    formula: { expression: 'COUNT_DISTINCT($customer_id)', requiredTypes: ['customer_id'] },
    format: 'number',
    category: 'kpi',
  },
  {
    id: 'new_customers',
    name: 'New Customers',
    description: 'First-time buyers',
    formula: { expression: 'COUNT_DISTINCT($customer_id WHERE $order_count = 1)', requiredTypes: ['customer_id', 'order_count'] },
    format: 'number',
    category: 'kpi',
  },
  {
    id: 'repeat_purchase_rate',
    name: 'Repeat Purchase Rate',
    description: 'Percentage of customers who purchased more than once',
    formula: { expression: 'COUNT_DISTINCT($customer_id WHERE $order_count > 1) / COUNT_DISTINCT($customer_id) * 100', requiredTypes: ['customer_id', 'order_count'] },
    format: 'percentage',
    category: 'retention',
    thresholds: { good: 30, warning: 20, bad: 10 },
  },
  {
    id: 'customer_ltv',
    name: 'Customer LTV',
    description: 'Average lifetime value per customer',
    formula: { expression: 'SUM($order_total) / COUNT_DISTINCT($customer_id)', requiredTypes: ['order_total', 'customer_id'] },
    format: 'currency',
    category: 'monetization',
  },
  {
    id: 'orders_per_customer',
    name: 'Orders per Customer',
    description: 'Average number of orders per customer',
    formula: { expression: 'COUNT_DISTINCT($order_id) / COUNT_DISTINCT($customer_id)', requiredTypes: ['order_id', 'customer_id'] },
    format: 'decimal',
    category: 'engagement',
  },

  // Product metrics
  {
    id: 'units_sold',
    name: 'Units Sold',
    description: 'Total quantity of items sold',
    formula: { expression: 'SUM($quantity)', requiredTypes: ['quantity'] },
    format: 'number',
    category: 'kpi',
  },
  {
    id: 'avg_items_per_order',
    name: 'Items per Order',
    description: 'Average items per order',
    formula: { expression: 'SUM($quantity) / COUNT_DISTINCT($order_id)', requiredTypes: ['quantity', 'order_id'] },
    format: 'decimal',
    category: 'engagement',
  },

  // Returns
  {
    id: 'return_rate',
    name: 'Return Rate',
    description: 'Percentage of orders returned',
    formula: { expression: 'COUNT_DISTINCT($return_id) / COUNT_DISTINCT($order_id) * 100', requiredTypes: ['return_id', 'order_id'] },
    format: 'percentage',
    category: 'funnel',
    thresholds: { good: 5, warning: 10, bad: 20 },
  },
  {
    id: 'return_value',
    name: 'Return Value',
    description: 'Total value of returns',
    formula: { expression: 'SUM($return_amount)', requiredTypes: ['return_amount'] },
    format: 'currency',
    category: 'kpi',
  },

  // Discount & Promo
  {
    id: 'discount_rate',
    name: 'Avg Discount Rate',
    description: 'Average discount percentage per order',
    formula: { expression: 'SUM($discount) / SUM($order_total) * 100', requiredTypes: ['discount', 'order_total'] },
    format: 'percentage',
    category: 'monetization',
  },
  {
    id: 'coupon_usage_rate',
    name: 'Coupon Usage Rate',
    description: 'Percentage of orders using coupons',
    formula: { expression: 'COUNT(WHERE $coupon_code IS NOT NULL) / COUNT_DISTINCT($order_id) * 100', requiredTypes: ['coupon_code', 'order_id'] },
    format: 'percentage',
    category: 'monetization',
  },
];

/**
 * Pre-defined funnels
 */
const funnels: FunnelTemplate[] = [
  {
    id: 'purchase_funnel',
    name: 'Purchase Funnel',
    description: 'Track path from visit to purchase',
    steps: [
      { id: 'session', name: 'Site Visit', semanticType: 'session_id' },
      { id: 'product_view', name: 'View Product', semanticType: 'event_type', eventPatterns: ['product_view', 'pdp_view'] },
      { id: 'add_to_cart', name: 'Add to Cart', semanticType: 'event_type', eventPatterns: ['add_to_cart', 'cart_add'] },
      { id: 'checkout', name: 'Begin Checkout', semanticType: 'event_type', eventPatterns: ['checkout_start', 'begin_checkout'] },
      { id: 'purchase', name: 'Purchase', semanticType: 'order_id' },
    ],
  },
  {
    id: 'checkout_funnel',
    name: 'Checkout Flow',
    description: 'Detailed checkout abandonment analysis',
    steps: [
      { id: 'cart', name: 'Cart', semanticType: 'cart_id' },
      { id: 'checkout_start', name: 'Start Checkout', semanticType: 'event_type', eventPatterns: ['checkout_start'] },
      { id: 'shipping', name: 'Enter Shipping', semanticType: 'event_type', eventPatterns: ['shipping_info', 'address_entered'] },
      { id: 'payment', name: 'Enter Payment', semanticType: 'event_type', eventPatterns: ['payment_info', 'payment_entered'] },
      { id: 'complete', name: 'Complete Order', semanticType: 'order_id' },
    ],
  },
  {
    id: 'customer_journey',
    name: 'Customer Journey',
    description: 'Track customer lifecycle',
    steps: [
      { id: 'first_visit', name: 'First Visit', semanticType: 'session_id' },
      { id: 'first_purchase', name: 'First Purchase', semanticType: 'first_purchase' },
      { id: 'second_purchase', name: 'Second Purchase', semanticType: 'order_count', condition: '$order_count >= 2' },
      { id: 'loyal', name: 'Loyal Customer', semanticType: 'order_count', condition: '$order_count >= 5' },
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
      name: 'Revenue Trend',
      description: 'Revenue and orders over time',
      metrics: ['gmv', 'revenue', 'orders_count'],
    },
    {
      type: 'funnel',
      name: 'Conversion Funnel',
      description: 'Purchase conversion analysis',
      metrics: ['conversion_rate', 'add_to_cart_rate'],
    },
    {
      type: 'bar',
      name: 'Category Performance',
      description: 'Revenue by product category',
      metrics: ['revenue', 'aov'],
    },
    {
      type: 'pie',
      name: 'Customer Segments',
      description: 'Revenue by customer segment',
      metrics: ['customer_ltv', 'repeat_purchase_rate'],
    },
    {
      type: 'cohort',
      name: 'Purchase Cohorts',
      description: 'Repeat purchase by acquisition cohort',
      metrics: ['repeat_purchase_rate', 'customer_ltv'],
    },
    {
      type: 'heatmap',
      name: 'Time Analysis',
      description: 'Orders by day and hour',
      metrics: ['orders_count'],
    },
  ],
  defaultCharts: ['line', 'funnel', 'bar'],
};

/**
 * Insight templates
 */
const insightTemplates: InsightTemplate[] = [
  {
    id: 'cart_abandonment_high',
    name: 'High Cart Abandonment',
    template: 'Cart abandonment at {{cart_abandonment_rate}}% - consider checkout optimization.',
    requiredMetrics: ['cart_abandonment_rate'],
    priority: 9,
    category: 'actionable',
  },
  {
    id: 'aov_increase',
    name: 'AOV Opportunity',
    template: 'AOV is ${{aov}}. Consider bundle offers or upsells to increase.',
    requiredMetrics: ['aov'],
    priority: 7,
    category: 'actionable',
  },
  {
    id: 'repeat_strong',
    name: 'Strong Retention',
    template: '{{repeat_purchase_rate}}% repeat purchase rate indicates healthy customer loyalty.',
    requiredMetrics: ['repeat_purchase_rate'],
    priority: 6,
    category: 'positive',
  },
  {
    id: 'return_rate_warning',
    name: 'Return Rate Warning',
    template: 'Return rate of {{return_rate}}% may indicate product or description issues.',
    requiredMetrics: ['return_rate'],
    priority: 8,
    category: 'negative',
  },
];

/**
 * E-commerce terminology
 */
const terminology: TerminologyMap = {
  user: { singular: 'Shopper', plural: 'Shoppers' },
  session: { singular: 'Visit', plural: 'Visits' },
  conversion: { singular: 'Order', plural: 'Orders' },
  revenue: { singular: 'GMV', plural: 'GMV' },
  customer: { singular: 'Customer', plural: 'Customers' },
  product: { singular: 'Product', plural: 'Products' },
};

/**
 * E-commerce theme
 */
const theme: IndustryTheme = {
  primaryColor: '#22c55e', // Green
  accentColor: '#10b981', // Emerald
  chartColors: [
    '#22c55e', // Green
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#06b6d4', // Cyan
  ],
  icon: 'shopping-cart',
};

/**
 * Complete E-commerce Industry Pack
 */
export const EcommercePack: IndustryPack = {
  id: 'ecommerce',
  name: 'E-commerce',
  description: 'Retail and e-commerce analytics with order tracking, cart analysis, and customer segmentation.',
  version: '1.0.0',

  subCategories: [
    { id: 'retail', name: 'Online Retail', description: 'General e-commerce stores' },
    { id: 'marketplace', name: 'Marketplace', description: 'Multi-vendor platforms' },
    { id: 'dtc', name: 'DTC Brand', description: 'Direct-to-consumer brands' },
    { id: 'subscription_box', name: 'Subscription Box', description: 'Recurring product boxes' },
    { id: 'grocery', name: 'Grocery/Food', description: 'Food and grocery delivery' },
    { id: 'custom', name: 'Custom', description: 'Other e-commerce types' },
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
 * Load and register the e-commerce pack
 */
export function loadEcommercePack(): IndustryPack {
  return EcommercePack;
}

export default EcommercePack;
