/**
 * Fintech Industry Pack
 *
 * Analytics configuration for financial technology products including:
 * - Neobanks and digital banking
 * - Payment processors
 * - Trading platforms
 * - Lending platforms
 * - Cryptocurrency exchanges
 * - Personal finance apps
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
 * Fintech-specific semantic types
 */
const semanticTypes: IndustrySemanticType[] = [
  // Core identification
  { type: 'user_id', patterns: ['user_id', 'userId', 'customer_id', 'account_holder_id', 'uid'], priority: 10 },
  { type: 'account_id', patterns: ['account_id', 'wallet_id', 'portfolio_id', 'accountId'], priority: 10 },
  { type: 'transaction_id', patterns: ['transaction_id', 'txn_id', 'tx_id', 'payment_id', 'order_id', 'trx_id'], priority: 10 },
  { type: 'timestamp', patterns: ['timestamp', 'date', 'time', 'created_at', 'executed_at', 'ts'], priority: 10 },
  { type: 'event_name', patterns: ['event_name', 'event_type', 'action', 'eventName'], priority: 9 },

  // Transaction & Payment
  { type: 'transaction_amount', patterns: ['amount', 'transaction_amount', 'txn_amount', 'payment_amount', 'value'], priority: 10, description: 'Transaction value' },
  { type: 'transaction_type', patterns: ['transaction_type', 'txn_type', 'type', 'payment_type'], priority: 9 },
  { type: 'transaction_status', patterns: ['status', 'transaction_status', 'payment_status', 'state'], priority: 9 },
  { type: 'currency', patterns: ['currency', 'currency_code', 'ccy', 'asset'], priority: 8 },
  { type: 'fee_amount', patterns: ['fee', 'fee_amount', 'commission', 'transaction_fee', 'service_fee'], priority: 8 },
  { type: 'merchant', patterns: ['merchant', 'merchant_name', 'vendor', 'payee', 'recipient'], priority: 7 },
  { type: 'category', patterns: ['category', 'merchant_category', 'mcc', 'spending_category'], priority: 7 },

  // Account & Balance
  { type: 'account_balance', patterns: ['balance', 'account_balance', 'available_balance', 'current_balance'], priority: 10, description: 'Account balance' },
  { type: 'account_type', patterns: ['account_type', 'product_type', 'wallet_type'], priority: 8 },
  { type: 'credit_limit', patterns: ['credit_limit', 'limit', 'available_credit', 'credit_line'], priority: 8 },
  { type: 'aum', patterns: ['aum', 'assets_under_management', 'portfolio_value', 'total_assets'], priority: 10, description: 'Assets Under Management' },

  // Trading & Investment
  { type: 'trade_volume', patterns: ['volume', 'trade_volume', 'trading_volume', 'quantity'], priority: 9 },
  { type: 'trade_price', patterns: ['price', 'trade_price', 'execution_price', 'fill_price'], priority: 9 },
  { type: 'symbol', patterns: ['symbol', 'ticker', 'asset_symbol', 'instrument', 'pair'], priority: 9 },
  { type: 'trade_side', patterns: ['side', 'trade_side', 'direction', 'buy_sell'], priority: 8 },
  { type: 'order_type', patterns: ['order_type', 'execution_type', 'trade_type'], priority: 8 },
  { type: 'pnl', patterns: ['pnl', 'profit_loss', 'realized_pnl', 'unrealized_pnl', 'gain_loss'], priority: 9 },
  { type: 'roi', patterns: ['roi', 'return', 'yield', 'performance'], priority: 8 },

  // Lending & Credit
  { type: 'loan_amount', patterns: ['loan_amount', 'principal', 'borrowed_amount', 'credit_amount'], priority: 9 },
  { type: 'interest_rate', patterns: ['interest_rate', 'apr', 'apy', 'rate'], priority: 8 },
  { type: 'loan_status', patterns: ['loan_status', 'repayment_status', 'credit_status'], priority: 8 },
  { type: 'credit_score', patterns: ['credit_score', 'fico', 'credit_rating', 'risk_score'], priority: 8 },
  { type: 'due_date', patterns: ['due_date', 'payment_due', 'maturity_date'], priority: 7 },
  { type: 'overdue_days', patterns: ['overdue_days', 'days_past_due', 'dpd', 'delinquency_days'], priority: 8 },

  // KYC & Compliance
  { type: 'kyc_status', patterns: ['kyc_status', 'verification_status', 'identity_status', 'verified'], priority: 9 },
  { type: 'kyc_level', patterns: ['kyc_level', 'tier', 'verification_level', 'account_tier'], priority: 8 },
  { type: 'risk_level', patterns: ['risk_level', 'risk_score', 'risk_rating', 'aml_risk'], priority: 8 },
  { type: 'country', patterns: ['country', 'region', 'jurisdiction', 'residence_country'], priority: 7 },

  // User Engagement
  { type: 'login_count', patterns: ['login_count', 'logins', 'sessions', 'app_opens'], priority: 7 },
  { type: 'last_active', patterns: ['last_active', 'last_login', 'last_transaction', 'last_seen'], priority: 7 },
  { type: 'signup_date', patterns: ['signup_date', 'created_at', 'registration_date', 'onboarded_at'], priority: 8 },
  { type: 'first_transaction', patterns: ['first_transaction', 'first_deposit', 'first_trade', 'activation_date'], priority: 8 },

  // Fraud & Security
  { type: 'fraud_flag', patterns: ['fraud_flag', 'is_fraud', 'suspicious', 'flagged'], priority: 9 },
  { type: 'fraud_score', patterns: ['fraud_score', 'risk_score', 'fraud_probability'], priority: 8 },
  { type: 'chargeback', patterns: ['chargeback', 'dispute', 'refund_reason'], priority: 8 },

  // Crypto specific
  { type: 'wallet_address', patterns: ['wallet_address', 'address', 'from_address', 'to_address'], priority: 7 },
  { type: 'network', patterns: ['network', 'chain', 'blockchain', 'protocol'], priority: 7 },
  { type: 'gas_fee', patterns: ['gas_fee', 'network_fee', 'gas_used', 'gas_price'], priority: 7 },
];

/**
 * Detection indicators for Fintech
 */
const detectionIndicators: DetectionIndicator[] = [
  { types: ['transaction_amount', 'transaction_status'], weight: 10, reason: 'Transaction data indicates fintech' },
  { types: ['account_balance', 'aum'], weight: 10, reason: 'Balance/AUM tracking indicates financial product' },
  { types: ['trade_volume', 'symbol'], weight: 10, reason: 'Trading data indicates investment platform' },
  { types: ['loan_amount', 'interest_rate'], weight: 10, reason: 'Loan data indicates lending platform' },
  { types: ['kyc_status', 'kyc_level'], weight: 9, reason: 'KYC tracking indicates regulated fintech' },
  { types: ['credit_score', 'credit_limit'], weight: 9, reason: 'Credit data indicates lending/banking' },
  { types: ['fee_amount', 'merchant'], weight: 8, reason: 'Payment processing indicators' },
  { types: ['pnl', 'roi'], weight: 8, reason: 'Investment performance tracking' },
  { types: ['fraud_flag', 'fraud_score'], weight: 7, reason: 'Fraud monitoring indicates fintech' },
  { types: ['wallet_address', 'network'], weight: 8, reason: 'Crypto wallet data' },
];

/**
 * Fintech metrics definitions
 */
const metrics: MetricDefinition[] = [
  // Transaction KPIs
  {
    id: 'total_transaction_volume',
    name: 'Total Transaction Volume',
    description: 'Total value of all transactions',
    formula: { expression: 'SUM($transaction_amount)', requiredTypes: ['transaction_amount'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'transaction_count',
    name: 'Transaction Count',
    description: 'Number of transactions',
    formula: { expression: 'COUNT($transaction_id)', requiredTypes: ['transaction_id'] },
    format: 'number',
    category: 'kpi',
  },
  {
    id: 'avg_transaction_value',
    name: 'Avg Transaction Value',
    description: 'Average transaction amount',
    formula: { expression: 'AVG($transaction_amount)', requiredTypes: ['transaction_amount'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'payment_success_rate',
    name: 'Payment Success Rate',
    description: 'Percentage of successful transactions',
    formula: { expression: 'COUNT(WHERE $transaction_status = "success") / COUNT($transaction_id) * 100', requiredTypes: ['transaction_status', 'transaction_id'] },
    format: 'percentage',
    category: 'kpi',
    thresholds: { good: 98, warning: 95, bad: 90 },
  },

  // Revenue metrics
  {
    id: 'total_fees',
    name: 'Total Fee Revenue',
    description: 'Revenue from transaction fees',
    formula: { expression: 'SUM($fee_amount)', requiredTypes: ['fee_amount'] },
    format: 'currency',
    category: 'monetization',
  },
  {
    id: 'fee_per_transaction',
    name: 'Fee per Transaction',
    description: 'Average fee collected per transaction',
    formula: { expression: 'SUM($fee_amount) / COUNT($transaction_id)', requiredTypes: ['fee_amount', 'transaction_id'] },
    format: 'currency',
    category: 'monetization',
  },
  {
    id: 'take_rate',
    name: 'Take Rate',
    description: 'Fee as percentage of transaction volume',
    formula: { expression: 'SUM($fee_amount) / SUM($transaction_amount) * 100', requiredTypes: ['fee_amount', 'transaction_amount'] },
    format: 'percentage',
    category: 'monetization',
  },

  // AUM & Portfolio
  {
    id: 'total_aum',
    name: 'Total AUM',
    description: 'Total Assets Under Management',
    formula: { expression: 'SUM($aum)', requiredTypes: ['aum'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'avg_portfolio_size',
    name: 'Avg Portfolio Size',
    description: 'Average portfolio value per user',
    formula: { expression: 'SUM($aum) / COUNT_DISTINCT($user_id)', requiredTypes: ['aum', 'user_id'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'total_deposits',
    name: 'Total Deposits',
    description: 'Total deposit volume',
    formula: { expression: 'SUM($transaction_amount WHERE $transaction_type = "deposit")', requiredTypes: ['transaction_amount', 'transaction_type'] },
    format: 'currency',
    category: 'kpi',
  },
  {
    id: 'net_deposits',
    name: 'Net Deposits',
    description: 'Deposits minus withdrawals',
    formula: { expression: 'SUM($transaction_amount WHERE $transaction_type = "deposit") - SUM($transaction_amount WHERE $transaction_type = "withdrawal")', requiredTypes: ['transaction_amount', 'transaction_type'] },
    format: 'currency',
    category: 'kpi',
  },

  // Trading metrics
  {
    id: 'total_trade_volume',
    name: 'Trading Volume',
    description: 'Total trading volume',
    formula: { expression: 'SUM($trade_volume * $trade_price)', requiredTypes: ['trade_volume', 'trade_price'] },
    format: 'currency',
    category: 'kpi',
    subCategories: ['trading', 'crypto'],
  },
  {
    id: 'trades_per_user',
    name: 'Trades per User',
    description: 'Average trades per active trader',
    formula: { expression: 'COUNT($transaction_id) / COUNT_DISTINCT($user_id)', requiredTypes: ['transaction_id', 'user_id'] },
    format: 'number',
    category: 'engagement',
    subCategories: ['trading', 'crypto'],
  },
  {
    id: 'avg_portfolio_return',
    name: 'Avg Portfolio Return',
    description: 'Average ROI across portfolios',
    formula: { expression: 'AVG($roi)', requiredTypes: ['roi'] },
    format: 'percentage',
    category: 'engagement',
    subCategories: ['trading', 'wealth'],
  },

  // Lending metrics
  {
    id: 'total_loan_volume',
    name: 'Total Loan Volume',
    description: 'Total loans originated',
    formula: { expression: 'SUM($loan_amount)', requiredTypes: ['loan_amount'] },
    format: 'currency',
    category: 'kpi',
    subCategories: ['lending'],
  },
  {
    id: 'avg_loan_size',
    name: 'Avg Loan Size',
    description: 'Average loan amount',
    formula: { expression: 'AVG($loan_amount)', requiredTypes: ['loan_amount'] },
    format: 'currency',
    category: 'kpi',
    subCategories: ['lending'],
  },
  {
    id: 'default_rate',
    name: 'Default Rate',
    description: 'Percentage of defaulted loans',
    formula: { expression: 'COUNT(WHERE $loan_status = "default") / COUNT($loan_amount) * 100', requiredTypes: ['loan_status', 'loan_amount'] },
    format: 'percentage',
    category: 'retention',
    subCategories: ['lending'],
    thresholds: { good: 2, warning: 5, bad: 10 },
  },
  {
    id: 'delinquency_rate',
    name: 'Delinquency Rate (30+)',
    description: 'Loans 30+ days past due',
    formula: { expression: 'COUNT(WHERE $overdue_days >= 30) / COUNT($loan_amount) * 100', requiredTypes: ['overdue_days', 'loan_amount'] },
    format: 'percentage',
    category: 'retention',
    subCategories: ['lending'],
    thresholds: { good: 3, warning: 7, bad: 15 },
  },

  // KYC & Activation
  {
    id: 'kyc_completion_rate',
    name: 'KYC Completion Rate',
    description: 'Users completing KYC verification',
    formula: { expression: 'COUNT(WHERE $kyc_status = "verified") / COUNT_DISTINCT($user_id) * 100', requiredTypes: ['kyc_status', 'user_id'] },
    format: 'percentage',
    category: 'funnel',
    thresholds: { good: 80, warning: 60, bad: 40 },
  },
  {
    id: 'activation_rate',
    name: 'Activation Rate',
    description: 'Users making first transaction',
    formula: { expression: 'COUNT_DISTINCT(WHERE $first_transaction IS NOT NULL) / COUNT_DISTINCT($user_id) * 100', requiredTypes: ['first_transaction', 'user_id'] },
    format: 'percentage',
    category: 'funnel',
    thresholds: { good: 70, warning: 50, bad: 30 },
  },
  {
    id: 'time_to_first_transaction',
    name: 'Time to First Transaction',
    description: 'Days from signup to first transaction',
    formula: { expression: 'AVG(DATEDIFF($first_transaction, $signup_date))', requiredTypes: ['first_transaction', 'signup_date'] },
    format: 'number',
    category: 'funnel',
  },

  // Engagement
  {
    id: 'mau',
    name: 'Monthly Active Users',
    description: 'Users with transactions this month',
    formula: { expression: 'COUNT_DISTINCT($user_id WHERE $timestamp >= TODAY() - 30)', requiredTypes: ['user_id', 'timestamp'] },
    format: 'number',
    category: 'engagement',
  },
  {
    id: 'transacting_user_rate',
    name: 'Transacting User Rate',
    description: 'Percentage of users transacting monthly',
    formula: { expression: 'COUNT_DISTINCT($user_id WHERE $timestamp >= TODAY() - 30) / COUNT_DISTINCT($user_id) * 100', requiredTypes: ['user_id', 'timestamp'] },
    format: 'percentage',
    category: 'engagement',
    thresholds: { good: 50, warning: 30, bad: 15 },
  },
  {
    id: 'avg_transactions_per_user',
    name: 'Transactions per User',
    description: 'Average monthly transactions per active user',
    formula: { expression: 'COUNT($transaction_id) / COUNT_DISTINCT($user_id)', requiredTypes: ['transaction_id', 'user_id'] },
    format: 'number',
    category: 'engagement',
  },

  // Fraud & Risk
  {
    id: 'fraud_rate',
    name: 'Fraud Rate',
    description: 'Percentage of fraudulent transactions',
    formula: { expression: 'COUNT(WHERE $fraud_flag = true) / COUNT($transaction_id) * 100', requiredTypes: ['fraud_flag', 'transaction_id'] },
    format: 'percentage',
    category: 'kpi',
    thresholds: { good: 0.1, warning: 0.5, bad: 1 },
  },
  {
    id: 'chargeback_rate',
    name: 'Chargeback Rate',
    description: 'Percentage of chargebacks',
    formula: { expression: 'COUNT(WHERE $chargeback IS NOT NULL) / COUNT($transaction_id) * 100', requiredTypes: ['chargeback', 'transaction_id'] },
    format: 'percentage',
    category: 'kpi',
    thresholds: { good: 0.5, warning: 1, bad: 2 },
  },
  {
    id: 'fraud_loss',
    name: 'Fraud Loss',
    description: 'Total value lost to fraud',
    formula: { expression: 'SUM($transaction_amount WHERE $fraud_flag = true)', requiredTypes: ['transaction_amount', 'fraud_flag'] },
    format: 'currency',
    category: 'kpi',
  },

  // Retention
  {
    id: 'user_churn_rate',
    name: 'User Churn Rate',
    description: 'Users inactive for 90+ days',
    formula: { expression: 'COUNT_DISTINCT($user_id WHERE $last_active < TODAY() - 90) / COUNT_DISTINCT($user_id) * 100', requiredTypes: ['user_id', 'last_active'] },
    format: 'percentage',
    category: 'retention',
    thresholds: { good: 5, warning: 15, bad: 30 },
  },
  {
    id: 'balance_churn',
    name: 'Balance Churn',
    description: 'AUM lost from churned users',
    formula: { expression: 'SUM($aum WHERE $last_active < TODAY() - 90)', requiredTypes: ['aum', 'last_active'] },
    format: 'currency',
    category: 'retention',
  },
];

/**
 * Pre-defined funnels
 */
const funnels: FunnelTemplate[] = [
  {
    id: 'onboarding_funnel',
    name: 'User Onboarding',
    description: 'Track user activation journey',
    steps: [
      { id: 'signup', name: 'Signup', semanticType: 'signup_date' },
      { id: 'kyc_start', name: 'Start KYC', semanticType: 'event_name', eventPatterns: ['kyc_started', 'verification_started'] },
      { id: 'kyc_complete', name: 'KYC Complete', semanticType: 'kyc_status', condition: '$kyc_status = "verified"' },
      { id: 'first_deposit', name: 'First Deposit', semanticType: 'first_transaction' },
      { id: 'active', name: 'Active User', semanticType: 'transaction_id' },
    ],
  },
  {
    id: 'deposit_funnel',
    name: 'Deposit Flow',
    description: 'Track deposit completion',
    steps: [
      { id: 'initiate', name: 'Initiate Deposit', semanticType: 'event_name', eventPatterns: ['deposit_initiated', 'add_funds_clicked'] },
      { id: 'method', name: 'Select Method', semanticType: 'event_name', eventPatterns: ['payment_method_selected'] },
      { id: 'confirm', name: 'Confirm Amount', semanticType: 'event_name', eventPatterns: ['deposit_confirmed', 'amount_entered'] },
      { id: 'complete', name: 'Deposit Complete', semanticType: 'transaction_status', condition: '$transaction_status = "success" AND $transaction_type = "deposit"' },
    ],
  },
  {
    id: 'trading_funnel',
    name: 'Trading Journey',
    description: 'First trade completion',
    subCategories: ['trading', 'crypto'],
    steps: [
      { id: 'funded', name: 'Account Funded', semanticType: 'account_balance', condition: '$account_balance > 0' },
      { id: 'browse', name: 'Browse Assets', semanticType: 'event_name', eventPatterns: ['asset_viewed', 'market_opened'] },
      { id: 'order', name: 'Place Order', semanticType: 'event_name', eventPatterns: ['order_placed', 'trade_initiated'] },
      { id: 'executed', name: 'Trade Executed', semanticType: 'transaction_status', condition: '$transaction_status = "success"' },
    ],
  },
  {
    id: 'loan_application',
    name: 'Loan Application',
    description: 'Loan origination funnel',
    subCategories: ['lending'],
    steps: [
      { id: 'apply', name: 'Start Application', semanticType: 'event_name', eventPatterns: ['loan_application_started', 'apply_clicked'] },
      { id: 'documents', name: 'Submit Documents', semanticType: 'event_name', eventPatterns: ['documents_uploaded', 'verification_submitted'] },
      { id: 'approved', name: 'Approved', semanticType: 'loan_status', condition: '$loan_status = "approved"' },
      { id: 'disbursed', name: 'Loan Disbursed', semanticType: 'loan_status', condition: '$loan_status = "disbursed"' },
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
      name: 'Transaction Volume',
      description: 'Transaction volume over time',
      metrics: ['total_transaction_volume', 'transaction_count'],
    },
    {
      type: 'area',
      name: 'AUM Growth',
      description: 'Assets under management over time',
      metrics: ['total_aum', 'net_deposits'],
    },
    {
      type: 'funnel',
      name: 'Onboarding Funnel',
      description: 'User activation journey',
      metrics: ['kyc_completion_rate', 'activation_rate'],
    },
    {
      type: 'bar',
      name: 'Transaction Analysis',
      description: 'Transactions by type and status',
      metrics: ['payment_success_rate', 'avg_transaction_value'],
    },
    {
      type: 'pie',
      name: 'Volume Distribution',
      description: 'Transaction volume by category',
      metrics: ['total_transaction_volume'],
    },
    {
      type: 'cohort',
      name: 'User Retention',
      description: 'Transaction retention by signup cohort',
      metrics: ['transacting_user_rate', 'user_churn_rate'],
    },
    {
      type: 'heatmap',
      name: 'Activity Patterns',
      description: 'Transaction activity by time',
      metrics: ['transaction_count'],
    },
    {
      type: 'scatter',
      name: 'Risk Analysis',
      description: 'Fraud score vs transaction amount',
      metrics: ['fraud_rate', 'avg_transaction_value'],
    },
  ],
  defaultCharts: ['line', 'area', 'funnel'],
};

/**
 * Insight templates
 */
const insightTemplates: InsightTemplate[] = [
  {
    id: 'high_success_rate',
    name: 'High Payment Success',
    template: 'Payment success rate of {{payment_success_rate}}% exceeds industry benchmark. Infrastructure is performing well.',
    requiredMetrics: ['payment_success_rate'],
    priority: 8,
    category: 'positive',
  },
  {
    id: 'success_rate_alert',
    name: 'Payment Issues',
    template: 'Payment success rate dropped to {{payment_success_rate}}%. Review payment processor logs and error codes.',
    requiredMetrics: ['payment_success_rate'],
    priority: 10,
    category: 'negative',
  },
  {
    id: 'fraud_alert',
    name: 'Fraud Alert',
    template: 'Fraud rate at {{fraud_rate}}% is above threshold. Review flagged transactions and tighten controls.',
    requiredMetrics: ['fraud_rate'],
    priority: 10,
    category: 'negative',
  },
  {
    id: 'kyc_bottleneck',
    name: 'KYC Bottleneck',
    template: 'Only {{kyc_completion_rate}}% complete KYC. Simplify verification or add more document options.',
    requiredMetrics: ['kyc_completion_rate'],
    priority: 8,
    category: 'actionable',
  },
  {
    id: 'activation_opportunity',
    name: 'Activation Gap',
    template: '{{activation_rate}}% activation rate. Focus on getting users to first transaction faster.',
    requiredMetrics: ['activation_rate'],
    priority: 8,
    category: 'actionable',
  },
  {
    id: 'aum_growth',
    name: 'AUM Growth',
    template: 'Net deposits of {{net_deposits}} driving AUM growth. Consider launching referral program.',
    requiredMetrics: ['net_deposits'],
    priority: 7,
    category: 'positive',
  },
  {
    id: 'high_churn_risk',
    name: 'Churn Risk',
    template: 'User churn rate at {{user_churn_rate}}%. {{balance_churn}} at risk. Launch re-engagement campaign.',
    requiredMetrics: ['user_churn_rate', 'balance_churn'],
    priority: 9,
    category: 'actionable',
  },
  {
    id: 'lending_health',
    name: 'Lending Portfolio Health',
    template: 'Default rate at {{default_rate}}% with {{delinquency_rate}}% delinquency. Portfolio performing within targets.',
    requiredMetrics: ['default_rate', 'delinquency_rate'],
    priority: 8,
    category: 'neutral',
  },
];

/**
 * Fintech terminology
 */
const terminology: TerminologyMap = {
  user: { singular: 'User', plural: 'Users' },
  session: { singular: 'Session', plural: 'Sessions' },
  conversion: { singular: 'Activation', plural: 'Activations' },
  revenue: { singular: 'Volume', plural: 'Volume' },
  transaction: { singular: 'Transaction', plural: 'Transactions' },
  account: { singular: 'Account', plural: 'Accounts' },
  deposit: { singular: 'Deposit', plural: 'Deposits' },
};

/**
 * Fintech theme
 */
const theme: IndustryTheme = {
  primaryColor: '#DA7756', // Terracotta
  accentColor: '#C15F3C', // Deep terracotta
  chartColors: [
    '#DA7756', // Terracotta
    '#C15F3C', // Deep terracotta
    '#E5A84B', // Gold
    '#A68B5B', // Brown
    '#8B7355', // Earth brown
    '#B89B7D', // Tan
    '#E25C5C', // Red
    '#8F8B82', // Neutral
  ],
  icon: 'landmark',
};

/**
 * Complete Fintech Industry Pack
 */
export const FintechPack: IndustryPack = {
  id: 'fintech',
  name: 'Fintech',
  description: 'Financial technology analytics for payments, trading, lending, and digital banking platforms.',
  version: '1.0.0',

  subCategories: [
    { id: 'payments', name: 'Payments', description: 'Payment processors and gateways' },
    { id: 'neobank', name: 'Neobank', description: 'Digital banking and challenger banks' },
    { id: 'trading', name: 'Trading', description: 'Stock and investment trading platforms' },
    { id: 'crypto', name: 'Crypto', description: 'Cryptocurrency exchanges and wallets' },
    { id: 'lending', name: 'Lending', description: 'Lending and credit platforms' },
    { id: 'wealth', name: 'Wealth Management', description: 'Robo-advisors and wealth platforms' },
    { id: 'pf', name: 'Personal Finance', description: 'Budgeting and personal finance apps' },
    { id: 'custom', name: 'Custom', description: 'Other fintech types' },
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
 * Load and register the Fintech pack
 */
export function loadFintechPack(): IndustryPack {
  return FintechPack;
}

export default FintechPack;
