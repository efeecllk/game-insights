# Phase 6: Data Sources & Public Datasets

## Overview

Expand data connectivity with new adapters, integrate public datasets for testing and demos, and create synthetic data generators for each industry. This phase ensures users can quickly test the platform with real-world data patterns.

**Duration**: 2 weeks
**Dependencies**: Phase 1-5 (Core infrastructure complete)

---

## Objectives

1. Implement BigQuery adapter for public datasets
2. Create sample data generators per industry
3. Build dataset marketplace with pre-configured sources
4. Implement Kaggle dataset import
5. Create synthetic data generation engine
6. Add demo mode with sample data

---

## Task 6.1: BigQuery Public Dataset Adapter

### File: `src/adapters/BigQueryPublicAdapter.ts`

```typescript
import { BaseAdapter, AdapterConfig, DataSourceSchema, FetchOptions } from './BaseAdapter';

/**
 * Configuration for BigQuery Public Datasets
 * Note: Uses BigQuery's free tier for public datasets (1TB/month free)
 */
export interface BigQueryPublicConfig extends AdapterConfig {
  type: 'bigquery-public';
  projectId: string;        // BigQuery project ID
  datasetId: string;        // Dataset name (e.g., 'thelook_ecommerce')
  tableId: string;          // Table name
  apiKey?: string;          // Optional API key for higher quotas
}

// Pre-configured public datasets
export const PUBLIC_DATASETS = {
  // E-commerce
  thelook_ecommerce: {
    projectId: 'bigquery-public-data',
    datasetId: 'thelook_ecommerce',
    tables: {
      orders: 'orders',
      order_items: 'order_items',
      users: 'users',
      products: 'products',
      events: 'events',
      inventory_items: 'inventory_items',
    },
    industry: 'ecommerce',
    description: 'Fictitious e-commerce dataset with 100K+ users',
    rowCount: '~2M events',
  },

  // Google Analytics 4 Sample
  ga4_obfuscated_sample: {
    projectId: 'bigquery-public-data',
    datasetId: 'ga4_obfuscated_sample_ecommerce',
    tables: {
      events: 'events_*',
    },
    industry: 'ecommerce',
    description: 'Real GA4 data from Google Merchandise Store',
    rowCount: '~7M events',
  },

  // Gaming
  firebase_flood_it: {
    projectId: 'firebase-public-project',
    datasetId: 'analytics_153293282',
    tables: {
      events: 'events_*',
    },
    industry: 'gaming',
    description: 'Real Firebase Analytics from Flood-It game',
    rowCount: '~1M events',
  },

  // Austin Bikeshare (can be adapted for fitness/transportation)
  austin_bikeshare: {
    projectId: 'bigquery-public-data',
    datasetId: 'austin_bikeshare',
    tables: {
      bikeshare_trips: 'bikeshare_trips',
      bikeshare_stations: 'bikeshare_stations',
    },
    industry: 'custom',
    description: 'Austin B-cycle bikeshare trip data',
    rowCount: '~650K trips',
  },

  // Stack Overflow (can be adapted for SaaS/community metrics)
  stackoverflow: {
    projectId: 'bigquery-public-data',
    datasetId: 'stackoverflow',
    tables: {
      posts_questions: 'posts_questions',
      posts_answers: 'posts_answers',
      users: 'users',
      comments: 'comments',
    },
    industry: 'saas',
    description: 'Stack Overflow Q&A data',
    rowCount: '~50M posts',
  },
} as const;

export type PublicDatasetId = keyof typeof PUBLIC_DATASETS;

/**
 * Adapter for querying BigQuery public datasets
 * Uses REST API without requiring Google Cloud SDK
 */
export class BigQueryPublicAdapter extends BaseAdapter<BigQueryPublicConfig> {
  private baseUrl = 'https://bigquery.googleapis.com/bigquery/v2';

  constructor(config: BigQueryPublicConfig) {
    super(config);
  }

  /**
   * Create adapter from preset public dataset
   */
  static fromPreset(
    datasetId: PublicDatasetId,
    tableKey: string,
    apiKey?: string
  ): BigQueryPublicAdapter {
    const preset = PUBLIC_DATASETS[datasetId];
    const tableId = preset.tables[tableKey as keyof typeof preset.tables];

    if (!tableId) {
      throw new Error(`Table "${tableKey}" not found in dataset "${datasetId}"`);
    }

    return new BigQueryPublicAdapter({
      type: 'bigquery-public',
      name: `${preset.description} - ${tableKey}`,
      projectId: preset.projectId,
      datasetId: preset.datasetId,
      tableId,
      apiKey,
    });
  }

  async connect(): Promise<boolean> {
    try {
      // Test connection by fetching schema
      await this.fetchSchema();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('BigQuery connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async fetchSchema(): Promise<DataSourceSchema> {
    const { projectId, datasetId, tableId } = this.config;

    // Handle wildcard tables (e.g., events_*)
    const actualTableId = tableId.includes('*')
      ? tableId.replace('*', '20231201') // Use a specific date partition
      : tableId;

    const url = `${this.baseUrl}/projects/${projectId}/datasets/${datasetId}/tables/${actualTableId}`;

    const response = await this.fetchWithKey(url);
    const data = await response.json();

    const columns = data.schema.fields.map((field: any) => ({
      name: field.name,
      type: this.mapBQType(field.type),
      nullable: field.mode !== 'REQUIRED',
      description: field.description,
    }));

    return {
      columns,
      primaryKey: columns.find((c: any) => c.name.includes('id'))?.name,
      rowCount: parseInt(data.numRows) || undefined,
    };
  }

  async fetchData(options: FetchOptions = {}): Promise<Record<string, unknown>[]> {
    const { projectId, datasetId, tableId } = this.config;
    const { limit = 1000, offset = 0, filters, orderBy } = options;

    // Build SQL query
    let query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\``;

    // Handle wildcard tables
    if (tableId.includes('*')) {
      query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\``;
    }

    // Add filters
    if (filters && filters.length > 0) {
      const whereClause = filters
        .map((f) => {
          const value = typeof f.value === 'string' ? `'${f.value}'` : f.value;
          return `${f.column} ${f.operator} ${value}`;
        })
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
    }

    // Add ordering
    if (orderBy) {
      query += ` ORDER BY ${orderBy.column} ${orderBy.direction || 'ASC'}`;
    }

    // Add pagination
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    // Execute query
    const result = await this.executeQuery(query);
    return result;
  }

  /**
   * Execute a BigQuery SQL query
   */
  private async executeQuery(query: string): Promise<Record<string, unknown>[]> {
    const { projectId } = this.config;
    const url = `${this.baseUrl}/projects/${projectId}/queries`;

    const response = await this.fetchWithKey(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        useLegacySql: false,
        maxResults: 10000,
      }),
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Query failed');
    }

    // Transform rows to objects
    const schema = data.schema.fields;
    const rows = data.rows || [];

    return rows.map((row: any) => {
      const obj: Record<string, unknown> = {};
      row.f.forEach((field: any, index: number) => {
        obj[schema[index].name] = this.parseValue(field.v, schema[index].type);
      });
      return obj;
    });
  }

  /**
   * Fetch with optional API key
   */
  private async fetchWithKey(url: string, options: RequestInit = {}): Promise<Response> {
    const { apiKey } = this.config;

    const finalUrl = apiKey ? `${url}?key=${apiKey}` : url;

    const response = await fetch(finalUrl, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`BigQuery API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Map BigQuery types to our types
   */
  private mapBQType(bqType: string): string {
    const typeMap: Record<string, string> = {
      STRING: 'string',
      INTEGER: 'integer',
      INT64: 'integer',
      FLOAT: 'number',
      FLOAT64: 'number',
      NUMERIC: 'number',
      BOOLEAN: 'boolean',
      BOOL: 'boolean',
      TIMESTAMP: 'timestamp',
      DATE: 'date',
      DATETIME: 'datetime',
      TIME: 'time',
      RECORD: 'object',
      STRUCT: 'object',
      ARRAY: 'array',
    };

    return typeMap[bqType] || 'string';
  }

  /**
   * Parse value based on type
   */
  private parseValue(value: any, type: string): unknown {
    if (value === null || value === undefined) return null;

    switch (type) {
      case 'INTEGER':
      case 'INT64':
        return parseInt(value, 10);
      case 'FLOAT':
      case 'FLOAT64':
      case 'NUMERIC':
        return parseFloat(value);
      case 'BOOLEAN':
      case 'BOOL':
        return value === 'true' || value === true;
      case 'TIMESTAMP':
      case 'DATETIME':
        return new Date(parseFloat(value) * 1000).toISOString();
      default:
        return value;
    }
  }
}
```

---

## Task 6.2: Kaggle Dataset Import

### File: `src/adapters/KaggleImporter.ts`

```typescript
import { DataSourceSchema } from './BaseAdapter';

/**
 * Popular Kaggle datasets for product analytics
 */
export const KAGGLE_DATASETS = {
  // Gaming
  cookie_cats: {
    id: 'yufengsui/mobile-games-ab-testing',
    name: 'Cookie Cats A/B Test',
    description: 'Retention data from Cookie Cats puzzle game',
    industry: 'gaming',
    files: ['cookie_cats.csv'],
    columns: ['userid', 'version', 'sum_gamerounds', 'retention_1', 'retention_7'],
    sampleSize: 90189,
  },

  mobile_iap: {
    id: 'rikdifos/mobile-strategy-games-iap',
    name: 'Mobile Strategy Games IAP',
    description: 'In-app purchase data from mobile strategy games',
    industry: 'gaming',
    files: ['mobile_strategy_games.csv'],
    columns: ['name', 'avg_user_rating', 'user_rating_count', 'price', 'in_app_purchases'],
    sampleSize: 17007,
  },

  // E-commerce
  ecommerce_behavior: {
    id: 'mkechinov/ecommerce-behavior-data-from-multi-category-store',
    name: 'E-commerce Behavior Data',
    description: 'User behavior from multi-category online store',
    industry: 'ecommerce',
    files: ['2019-Oct.csv', '2019-Nov.csv'],
    columns: ['event_time', 'event_type', 'product_id', 'category_id', 'brand', 'price', 'user_id', 'user_session'],
    sampleSize: 285000000,
  },

  olist_ecommerce: {
    id: 'olistbr/brazilian-ecommerce',
    name: 'Brazilian E-commerce (Olist)',
    description: 'Real orders from Brazilian marketplace',
    industry: 'ecommerce',
    files: ['olist_orders_dataset.csv', 'olist_customers_dataset.csv', 'olist_order_items_dataset.csv'],
    columns: ['order_id', 'customer_id', 'order_status', 'order_purchase_timestamp', 'price'],
    sampleSize: 100000,
  },

  // SaaS / Subscription
  telco_churn: {
    id: 'blastchar/telco-customer-churn',
    name: 'Telco Customer Churn',
    description: 'Subscription service churn prediction data',
    industry: 'saas',
    files: ['WA_Fn-UseC_-Telco-Customer-Churn.csv'],
    columns: ['customerID', 'tenure', 'MonthlyCharges', 'TotalCharges', 'Churn', 'Contract'],
    sampleSize: 7043,
  },

  // EdTech
  oulad: {
    id: 'anlgrbz/student-performance-data-set',
    name: 'Open University Learning Analytics',
    description: 'Student interaction and performance data',
    industry: 'edtech',
    files: ['studentInfo.csv', 'studentAssessment.csv', 'studentVle.csv'],
    columns: ['id_student', 'code_module', 'final_result', 'studied_credits', 'num_of_prev_attempts'],
    sampleSize: 32593,
  },

  // Media / Streaming
  netflix_titles: {
    id: 'shivamb/netflix-shows',
    name: 'Netflix Titles',
    description: 'Netflix movies and TV shows catalog',
    industry: 'media',
    files: ['netflix_titles.csv'],
    columns: ['show_id', 'type', 'title', 'release_year', 'rating', 'duration'],
    sampleSize: 8807,
  },

  spotify_tracks: {
    id: 'maharshipandya/-spotify-tracks-dataset',
    name: 'Spotify Tracks',
    description: 'Spotify tracks with audio features',
    industry: 'media',
    files: ['dataset.csv'],
    columns: ['track_id', 'artists', 'track_name', 'popularity', 'duration_ms', 'explicit'],
    sampleSize: 114000,
  },
} as const;

export type KaggleDatasetId = keyof typeof KAGGLE_DATASETS;

/**
 * Import Kaggle datasets
 * Note: Requires user to download from Kaggle and upload
 * Future: Could integrate with Kaggle API
 */
export class KaggleImporter {
  /**
   * Get dataset info
   */
  static getDatasetInfo(datasetId: KaggleDatasetId) {
    return KAGGLE_DATASETS[datasetId];
  }

  /**
   * Get all datasets for an industry
   */
  static getDatasetsByIndustry(industry: string) {
    return Object.entries(KAGGLE_DATASETS)
      .filter(([_, dataset]) => dataset.industry === industry)
      .map(([id, dataset]) => ({ id, ...dataset }));
  }

  /**
   * Generate download instructions
   */
  static getDownloadInstructions(datasetId: KaggleDatasetId): string {
    const dataset = KAGGLE_DATASETS[datasetId];

    return `
## Download Instructions for "${dataset.name}"

1. Visit: https://www.kaggle.com/datasets/${dataset.id}
2. Click "Download" (requires Kaggle account)
3. Extract the ZIP file
4. Upload the following files:
   ${dataset.files.map((f) => `- ${f}`).join('\n   ')}

**Note**: You can also use Kaggle CLI:
\`\`\`bash
kaggle datasets download -d ${dataset.id}
unzip ${dataset.id.split('/')[1]}.zip
\`\`\`
    `.trim();
  }

  /**
   * Validate uploaded file matches expected schema
   */
  static validateFile(
    datasetId: KaggleDatasetId,
    columns: string[]
  ): { valid: boolean; missingColumns: string[]; extraColumns: string[] } {
    const dataset = KAGGLE_DATASETS[datasetId];
    const expectedColumns = dataset.columns;

    const missingColumns = expectedColumns.filter((c) => !columns.includes(c));
    const extraColumns = columns.filter((c) => !expectedColumns.includes(c));

    return {
      valid: missingColumns.length === 0,
      missingColumns,
      extraColumns,
    };
  }
}
```

---

## Task 6.3: Synthetic Data Generator

### File: `src/generators/SyntheticDataGenerator.ts`

```typescript
import { IndustryType } from '@/industry/types';

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
  seed?: number; // For reproducible generation
}

/**
 * Base class for synthetic data generation
 */
export abstract class SyntheticDataGenerator {
  protected config: GeneratorConfig;
  protected random: () => number;

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.random = config.seed
      ? this.seededRandom(config.seed)
      : Math.random;
  }

  /**
   * Generate seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  /**
   * Generate random integer in range
   */
  protected randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in range
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
   * Generate random date in range
   */
  protected randomDate(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    return new Date(startTime + this.random() * (endTime - startTime));
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
   * Generate data - must be implemented by subclass
   */
  abstract generate(): Record<string, unknown>[];
}

/**
 * Gaming industry data generator
 */
export class GamingDataGenerator extends SyntheticDataGenerator {
  private gameTypes = ['puzzle', 'idle', 'battle_royale', 'match3', 'gacha'];
  private platforms = ['ios', 'android'];
  private countries = ['US', 'UK', 'DE', 'JP', 'KR', 'BR', 'IN'];

  generate(): Record<string, unknown>[] {
    const data: Record<string, unknown>[] = [];
    const userCount = this.config.userCount || Math.ceil(this.config.rowCount / 10);

    // Generate users
    const users = Array.from({ length: userCount }, (_, i) => ({
      userId: `user_${i + 1}`,
      installDate: this.randomDate(this.config.dateRange.start, this.config.dateRange.end),
      platform: this.randomChoice(this.platforms),
      country: this.randomChoice(this.countries),
      spenderTier: this.randomChoice(['non_spender', 'minnow', 'dolphin', 'whale']),
    }));

    // Generate events for each user
    for (let i = 0; i < this.config.rowCount; i++) {
      const user = this.randomChoice(users);
      const eventDate = this.randomDate(user.installDate, this.config.dateRange.end);

      data.push({
        event_id: this.generateUUID(),
        user_id: user.userId,
        event_name: this.randomChoice([
          'session_start', 'level_complete', 'level_fail',
          'purchase', 'ad_watched', 'tutorial_complete'
        ]),
        timestamp: eventDate.toISOString(),
        platform: user.platform,
        country: user.country,
        level: this.randomInt(1, 100),
        score: this.randomInt(0, 10000),
        session_duration: this.randomInt(30, 3600),
        revenue: this.random() > 0.95 ? this.randomFloat(0.99, 99.99) : 0,
        moves_used: this.randomInt(1, 50),
        boosters_used: this.randomInt(0, 5),
        lives_remaining: this.randomInt(0, 5),
      });
    }

    return data;
  }
}

/**
 * SaaS industry data generator
 */
export class SaaSDataGenerator extends SyntheticDataGenerator {
  private plans = ['free', 'starter', 'professional', 'enterprise'];
  private features = ['api', 'dashboard', 'reports', 'integrations', 'support'];
  private industries = ['tech', 'finance', 'healthcare', 'retail', 'education'];

  generate(): Record<string, unknown>[] {
    const data: Record<string, unknown>[] = [];
    const userCount = this.config.userCount || Math.ceil(this.config.rowCount / 20);

    // Generate companies/accounts
    const accounts = Array.from({ length: userCount }, (_, i) => ({
      accountId: `acc_${i + 1}`,
      companyName: `Company ${i + 1}`,
      signupDate: this.randomDate(this.config.dateRange.start, this.config.dateRange.end),
      plan: this.randomChoice(this.plans),
      industry: this.randomChoice(this.industries),
      seats: this.randomInt(1, 100),
      mrr: this.randomChoice([0, 29, 99, 299, 999]),
    }));

    // Generate events
    for (let i = 0; i < this.config.rowCount; i++) {
      const account = this.randomChoice(accounts);
      const eventDate = this.randomDate(account.signupDate, this.config.dateRange.end);

      data.push({
        event_id: this.generateUUID(),
        account_id: account.accountId,
        user_id: `${account.accountId}_user_${this.randomInt(1, account.seats)}`,
        event_name: this.randomChoice([
          'login', 'feature_used', 'report_generated',
          'api_call', 'invite_sent', 'settings_changed'
        ]),
        timestamp: eventDate.toISOString(),
        plan: account.plan,
        feature: this.randomChoice(this.features),
        mrr: account.mrr,
        seats: account.seats,
        api_calls: this.randomInt(0, 1000),
        active_users: this.randomInt(1, account.seats),
        trial_days_remaining: account.plan === 'free' ? this.randomInt(0, 14) : null,
        is_churned: this.random() > 0.95,
      });
    }

    return data;
  }
}

/**
 * E-commerce industry data generator
 */
export class EcommerceDataGenerator extends SyntheticDataGenerator {
  private categories = ['electronics', 'clothing', 'home', 'sports', 'beauty'];
  private paymentMethods = ['credit_card', 'paypal', 'apple_pay', 'google_pay'];
  private orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  generate(): Record<string, unknown>[] {
    const data: Record<string, unknown>[] = [];
    const userCount = this.config.userCount || Math.ceil(this.config.rowCount / 5);

    // Generate customers
    const customers = Array.from({ length: userCount }, (_, i) => ({
      customerId: `cust_${i + 1}`,
      firstPurchase: this.randomDate(this.config.dateRange.start, this.config.dateRange.end),
      segment: this.randomChoice(['new', 'returning', 'loyal', 'at_risk', 'churned']),
    }));

    // Generate events
    for (let i = 0; i < this.config.rowCount; i++) {
      const customer = this.randomChoice(customers);
      const eventDate = this.randomDate(customer.firstPurchase, this.config.dateRange.end);
      const eventType = this.randomChoice(['view', 'add_to_cart', 'remove_from_cart', 'purchase', 'return']);

      const productPrice = this.randomFloat(9.99, 499.99);
      const quantity = this.randomInt(1, 5);

      data.push({
        event_id: this.generateUUID(),
        customer_id: customer.customerId,
        event_type: eventType,
        timestamp: eventDate.toISOString(),
        product_id: `prod_${this.randomInt(1, 1000)}`,
        category: this.randomChoice(this.categories),
        price: productPrice,
        quantity: eventType === 'purchase' ? quantity : null,
        order_total: eventType === 'purchase' ? this.randomFloat(productPrice, productPrice * 3) : null,
        order_status: eventType === 'purchase' ? this.randomChoice(this.orderStatuses) : null,
        payment_method: eventType === 'purchase' ? this.randomChoice(this.paymentMethods) : null,
        cart_value: eventType === 'add_to_cart' ? this.randomFloat(10, 500) : null,
        cart_abandoned: eventType === 'add_to_cart' && this.random() > 0.7,
        discount_applied: this.random() > 0.8 ? this.randomFloat(5, 50) : 0,
        shipping_cost: eventType === 'purchase' ? this.randomFloat(0, 15) : null,
      });
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
```

---

## Task 6.4: Dataset Marketplace UI

### File: `src/pages/DataSources.tsx`

```typescript
import React, { useState } from 'react';
import {
  Database,
  Cloud,
  FileSpreadsheet,
  Download,
  Play,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { PUBLIC_DATASETS, PublicDatasetId } from '@/adapters/BigQueryPublicAdapter';
import { KAGGLE_DATASETS, KaggleDatasetId, KaggleImporter } from '@/adapters/KaggleImporter';
import { createDataGenerator } from '@/generators/SyntheticDataGenerator';
import { useProduct } from '@/context/ProductContext';
import { useData } from '@/context/DataContext';
import { cn } from '@/lib/utils';

type DataSourceCategory = 'all' | 'bigquery' | 'kaggle' | 'synthetic' | 'connected';

export default function DataSources() {
  const { selectedIndustry } = useProduct();
  const { addData } = useData();

  const [selectedCategory, setSelectedCategory] = useState<DataSourceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Filter datasets by industry and search
  const filterByIndustryAndSearch = <T extends { name: string; industry: string; description: string }>(
    datasets: Record<string, T>
  ): Array<[string, T]> => {
    return Object.entries(datasets).filter(([_, dataset]) => {
      const matchesIndustry = !selectedIndustry || dataset.industry === selectedIndustry || dataset.industry === 'custom';
      const matchesSearch =
        !searchQuery ||
        dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesIndustry && matchesSearch;
    });
  };

  const filteredBigQuery = filterByIndustryAndSearch(PUBLIC_DATASETS as any);
  const filteredKaggle = filterByIndustryAndSearch(KAGGLE_DATASETS as any);

  // Generate synthetic data
  const handleGenerateSynthetic = async (industry: string, rowCount: number) => {
    setIsGenerating(true);
    setGeneratingId(industry);

    try {
      const generator = createDataGenerator({
        industry: industry as any,
        rowCount,
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          end: new Date(),
        },
      });

      const data = generator.generate();

      await addData({
        name: `Synthetic ${industry.charAt(0).toUpperCase() + industry.slice(1)} Data`,
        industry: industry as any,
        rawData: data,
        isSynthetic: true,
      });

      // Success notification would go here
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Sources</h1>
          <p className="text-white/60">Connect to datasets or generate sample data</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-accent-primary focus:outline-none"
          />
        </div>

        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          {(['all', 'bigquery', 'kaggle', 'synthetic'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1 rounded text-sm transition-colors',
                selectedCategory === cat
                  ? 'bg-accent-primary text-white'
                  : 'text-white/60 hover:text-white'
              )}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* BigQuery Public Datasets */}
      {(selectedCategory === 'all' || selectedCategory === 'bigquery') && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            BigQuery Public Datasets
            <span className="text-xs text-white/40 font-normal">(Free tier: 1TB/month)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBigQuery.map(([id, dataset]) => (
              <DatasetCard
                key={id}
                id={id}
                name={dataset.name}
                description={dataset.description}
                industry={dataset.industry}
                rowCount={dataset.rowCount}
                type="bigquery"
                onConnect={() => {
                  // TODO: Implement BigQuery connection
                  console.log('Connect to BigQuery:', id);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Kaggle Datasets */}
      {(selectedCategory === 'all' || selectedCategory === 'kaggle') && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Kaggle Datasets
            <span className="text-xs text-white/40 font-normal">(Download required)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKaggle.map(([id, dataset]) => (
              <DatasetCard
                key={id}
                id={id}
                name={dataset.name}
                description={dataset.description}
                industry={dataset.industry}
                rowCount={`~${dataset.sampleSize.toLocaleString()} rows`}
                type="kaggle"
                onDownload={() => {
                  const instructions = KaggleImporter.getDownloadInstructions(id as KaggleDatasetId);
                  console.log(instructions);
                  // Open download modal with instructions
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Synthetic Data Generators */}
      {(selectedCategory === 'all' || selectedCategory === 'synthetic') && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Generate Sample Data
            <span className="text-xs text-white/40 font-normal">(Instant, no download needed)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['gaming', 'saas', 'ecommerce'].map((industry) => (
              <div
                key={industry}
                className="bg-bg-card rounded-xl p-4 border border-white/10 hover:border-accent-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium">
                      {industry.charAt(0).toUpperCase() + industry.slice(1)} Sample Data
                    </h3>
                    <p className="text-white/60 text-sm">
                      Realistic synthetic data for testing
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>

                <div className="flex gap-2">
                  {[1000, 10000, 50000].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleGenerateSynthetic(industry, count)}
                      disabled={isGenerating}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm transition-colors',
                        isGenerating && generatingId === industry
                          ? 'bg-accent-primary/50 text-white cursor-wait'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      )}
                    >
                      {isGenerating && generatingId === industry ? (
                        <span className="animate-pulse">Generating...</span>
                      ) : (
                        `${(count / 1000).toFixed(0)}K rows`
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Dataset Card Component
interface DatasetCardProps {
  id: string;
  name: string;
  description: string;
  industry: string;
  rowCount: string;
  type: 'bigquery' | 'kaggle';
  onConnect?: () => void;
  onDownload?: () => void;
}

function DatasetCard({
  id,
  name,
  description,
  industry,
  rowCount,
  type,
  onConnect,
  onDownload,
}: DatasetCardProps) {
  const industryColors: Record<string, string> = {
    gaming: 'bg-purple-500/20 text-purple-400',
    ecommerce: 'bg-green-500/20 text-green-400',
    saas: 'bg-blue-500/20 text-blue-400',
    edtech: 'bg-yellow-500/20 text-yellow-400',
    media: 'bg-red-500/20 text-red-400',
    custom: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="bg-bg-card rounded-xl p-4 border border-white/10 hover:border-accent-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-medium line-clamp-1">{name}</h3>
        <span className={cn('px-2 py-0.5 rounded text-xs', industryColors[industry])}>
          {industry}
        </span>
      </div>

      <p className="text-white/60 text-sm line-clamp-2 mb-3">{description}</p>

      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs">{rowCount}</span>

        {type === 'bigquery' && (
          <button
            onClick={onConnect}
            className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30"
          >
            <Play className="w-4 h-4" />
            Connect
          </button>
        )}

        {type === 'kaggle' && (
          <button
            onClick={onDownload}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30"
          >
            <ExternalLink className="w-4 h-4" />
            View on Kaggle
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Task 6.5: Demo Mode

### File: `src/components/DemoModeProvider.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createDataGenerator } from '@/generators/SyntheticDataGenerator';
import { IndustryType } from '@/industry/types';

interface DemoModeState {
  isDemoMode: boolean;
  demoIndustry: IndustryType | null;
  demoData: Record<string, unknown>[] | null;
  isLoading: boolean;
  enableDemo: (industry: IndustryType) => Promise<void>;
  disableDemo: () => void;
}

const DemoModeContext = createContext<DemoModeState | null>(null);

interface DemoModeProviderProps {
  children: ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoIndustry, setDemoIndustry] = useState<IndustryType | null>(null);
  const [demoData, setDemoData] = useState<Record<string, unknown>[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const enableDemo = useCallback(async (industry: IndustryType) => {
    setIsLoading(true);

    try {
      // Generate demo data
      const generator = createDataGenerator({
        industry,
        rowCount: 10000,
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        seed: 42, // Consistent demo data
      });

      const data = generator.generate();

      setDemoData(data);
      setDemoIndustry(industry);
      setIsDemoMode(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disableDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoIndustry(null);
    setDemoData(null);
  }, []);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        demoIndustry,
        demoData,
        isLoading,
        enableDemo,
        disableDemo,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
}
```

### File: `src/components/DemoBanner.tsx`

```typescript
import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useDemoMode } from './DemoModeProvider';
import { cn } from '@/lib/utils';

export function DemoBanner() {
  const { isDemoMode, demoIndustry, disableDemo } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-accent-primary/20 to-purple-500/20 border-b border-accent-primary/30">
      <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-accent-primary" />
          <span className="text-white">
            <strong>Demo Mode:</strong> Viewing sample{' '}
            <span className="capitalize">{demoIndustry}</span> data
          </span>
          <span className="text-white/60">•</span>
          <span className="text-white/60">
            This is synthetic data for demonstration purposes
          </span>
        </div>

        <button
          onClick={disableDemo}
          className="flex items-center gap-1 px-2 py-1 text-sm text-white/70 hover:text-white rounded hover:bg-white/10"
        >
          <X className="w-4 h-4" />
          Exit Demo
        </button>
      </div>
    </div>
  );
}
```

---

## Task 6.6: Quick Start Page

### File: `src/pages/QuickStart.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Database,
  Sparkles,
  ArrowRight,
  Gamepad2,
  Building2,
  ShoppingCart,
} from 'lucide-react';
import { useDemoMode } from '@/components/DemoModeProvider';
import { IndustryType } from '@/industry/types';
import { cn } from '@/lib/utils';

const DEMO_OPTIONS: Array<{
  industry: IndustryType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    industry: 'gaming',
    name: 'Mobile Gaming',
    description: 'Puzzle game with retention and monetization data',
    icon: Gamepad2,
    color: 'purple',
  },
  {
    industry: 'saas',
    name: 'B2B SaaS',
    description: 'Subscription app with MRR and churn metrics',
    icon: Building2,
    color: 'blue',
  },
  {
    industry: 'ecommerce',
    name: 'E-commerce',
    description: 'Online store with orders and cart data',
    icon: ShoppingCart,
    color: 'green',
  },
];

export default function QuickStart() {
  const navigate = useNavigate();
  const { enableDemo, isLoading } = useDemoMode();

  const handleDemoStart = async (industry: IndustryType) => {
    await enableDemo(industry);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg-darkest flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Product<span className="text-accent-primary">Insights</span>
          </h1>
          <p className="text-xl text-white/60">
            AI-powered analytics that automatically understands your data
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Upload Data */}
          <button
            onClick={() => navigate('/upload')}
            className="group bg-bg-card rounded-2xl p-6 border border-white/10 hover:border-accent-primary/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-accent-primary" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Upload Your Data</h3>
            <p className="text-white/60 text-sm mb-4">
              CSV, JSON, Excel, or SQLite file
            </p>
            <div className="flex items-center text-accent-primary text-sm">
              Get started <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Connect Data Source */}
          <button
            onClick={() => navigate('/data-sources')}
            className="group bg-bg-card rounded-2xl p-6 border border-white/10 hover:border-accent-primary/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Connect Live Source</h3>
            <p className="text-white/60 text-sm mb-4">
              PostgreSQL, Supabase, Firebase, or API
            </p>
            <div className="flex items-center text-blue-400 text-sm">
              Browse sources <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Try Demo */}
          <button
            onClick={() => {}}
            disabled
            className="group bg-bg-card rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Try Demo Mode</h3>
            <p className="text-white/60 text-sm mb-4">
              Explore with sample data
            </p>
            <div className="flex items-center text-purple-400 text-sm">
              Select below <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        </div>

        {/* Demo Options */}
        <div className="bg-bg-card rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Quick Demo
          </h3>
          <p className="text-white/60 text-sm mb-6">
            Choose an industry to explore with realistic sample data
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {DEMO_OPTIONS.map((option) => {
              const Icon = option.icon;
              const colorClasses = {
                purple: 'border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5',
                blue: 'border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5',
                green: 'border-green-500/30 hover:border-green-500/60 hover:bg-green-500/5',
              };

              return (
                <button
                  key={option.industry}
                  onClick={() => handleDemoStart(option.industry)}
                  disabled={isLoading}
                  className={cn(
                    'p-4 rounded-xl border transition-all text-left',
                    colorClasses[option.color as keyof typeof colorClasses],
                    isLoading && 'opacity-50 cursor-wait'
                  )}
                >
                  <Icon className={cn(
                    'w-8 h-8 mb-3',
                    option.color === 'purple' && 'text-purple-400',
                    option.color === 'blue' && 'text-blue-400',
                    option.color === 'green' && 'text-green-400'
                  )} />
                  <h4 className="text-white font-medium">{option.name}</h4>
                  <p className="text-white/50 text-sm">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-sm">
          Your data stays on your machine. No server uploads required.
        </div>
      </div>
    </div>
  );
}
```

---

## Deliverables Summary

| Component | Status | Description |
|-----------|--------|-------------|
| BigQueryPublicAdapter | New | Adapter for BigQuery public datasets |
| KaggleImporter | New | Helper for Kaggle dataset imports |
| SyntheticDataGenerator | New | Multi-industry data generators |
| DataSources Page | New | Dataset marketplace UI |
| DemoModeProvider | New | Context for demo mode state |
| DemoBanner | New | Banner showing demo status |
| QuickStart Page | New | Onboarding page for new users |

---

## Public Dataset Catalog

### BigQuery (Free Tier)

| Dataset | Industry | Rows | Description |
|---------|----------|------|-------------|
| TheLook E-commerce | E-commerce | ~2M | Full e-commerce data |
| GA4 Sample | E-commerce | ~7M | Real Google Analytics data |
| Firebase Flood-It | Gaming | ~1M | Mobile game analytics |
| Austin Bikeshare | Custom | ~650K | Trip data |
| Stack Overflow | SaaS | ~50M | Q&A community data |

### Kaggle (Download Required)

| Dataset | Industry | Rows | Description |
|---------|----------|------|-------------|
| Cookie Cats | Gaming | 90K | A/B test retention data |
| Mobile IAP | Gaming | 17K | In-app purchase data |
| E-commerce Behavior | E-commerce | 285M | Multi-category store |
| Olist E-commerce | E-commerce | 100K | Brazilian marketplace |
| Telco Churn | SaaS | 7K | Subscription churn |
| OULAD | EdTech | 32K | Learning analytics |
| Netflix Titles | Media | 8K | Content catalog |
| Spotify Tracks | Media | 114K | Audio features |

---

## Testing Checklist

- [ ] BigQuery adapter connects to public datasets
- [ ] Kaggle dataset info is accurate
- [ ] Synthetic generators produce valid data
- [ ] Data matches industry schemas
- [ ] Demo mode loads quickly
- [ ] Quick start page is intuitive
- [ ] Data source filtering works
- [ ] Industry detection works on generated data

---

## Next Phase

**Phase 7** will focus on Testing & Documentation, including:
- Comprehensive test suite
- API documentation
- User guides per industry
- Migration guide from Game Insights
- Performance benchmarks
