import type { GameCategory } from '@/types';

// Provider types
export type AIProvider = 'openai' | 'anthropic' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  apiKeys: {
    openai?: string;
    anthropic?: string;
  };
  models: {
    openai: string;
    anthropic: string;
    ollama: string;
  };
  triggers: {
    onUpload: boolean;
    onDemand: boolean;
    scheduled: boolean;
    scheduleInterval?: 'daily' | 'weekly';
  };
  ollamaEndpoint: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKeys: {},
  models: {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    ollama: 'llama3',
  },
  triggers: {
    onUpload: true,
    onDemand: true,
    scheduled: false,
  },
  ollamaEndpoint: 'http://localhost:11434',
};

// Insight types
export type InsightType = 'positive' | 'negative' | 'neutral' | 'warning' | 'opportunity';
export type InsightCategory = 'retention' | 'monetization' | 'engagement' | 'progression' | 'quality';
export type BusinessImpact = 'high' | 'medium' | 'low';

export interface RevenueImpact {
  type: 'increase' | 'decrease';
  percentage: number;
  estimated?: number;
}

export interface MetricDataPoint {
  date: string;
  value: number;
}

export interface AIInsight {
  id: string;
  projectId: string;
  gameType: GameCategory;
  generatedAt: string;
  source: 'ai' | 'template';
  provider?: AIProvider;
  model?: string;

  // Core insight data
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  recommendation: string;
  priority: number;
  confidence: number;
  businessImpact: BusinessImpact;
  revenueImpact?: RevenueImpact;
  evidence?: string[];

  // For sparkline
  metricName?: string;
  metricHistory?: MetricDataPoint[];

  // Category tags
  tags: string[];

  // Action state
  actioned?: boolean;
  actionedAt?: string;
  actionType?: 'segment' | 'alert' | 'exported';
}

// Chat types
export interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    toolCalls?: ToolCallResult[];
    suggestions?: string[];
  };
}

export interface ToolCallResult {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  success: boolean;
  error?: string;
}

export interface ChatSession {
  id: string;
  projectId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Segment types
export interface UserSegment {
  id: string;
  projectId: string;
  name: string;
  description: string;
  filters: SegmentFilter[];
  createdAt: string;
  createdFrom?: string; // insight ID
}

export interface SegmentFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

// Alert types
export interface MetricAlert {
  id: string;
  projectId: string;
  metricName: string;
  condition: 'above' | 'below' | 'change';
  threshold: number;
  enabled: boolean;
  createdAt: string;
  createdFrom?: string; // insight ID
  lastTriggered?: string;
}

// Provider status
export interface ProviderStatus {
  provider: AIProvider;
  connected: boolean;
  model: string;
  lastChecked: string;
  error?: string;
}

// Generation request/response types
export interface InsightGenerationRequest {
  projectId: string;
  gameType: GameCategory;
  data: Record<string, unknown>[];
  columns: ColumnInfo[];
  existingMetrics?: Record<string, number>;
}

export interface ColumnInfo {
  name: string;
  type: string;
  semanticType?: string;
  sampleValues?: unknown[];
}

export interface InsightGenerationResponse {
  insights: AIInsight[];
  processingTime: number;
  tokensUsed?: number;
}

export interface ChatRequest {
  projectId: string;
  message: string;
  context?: {
    currentPage?: string;
    selectedData?: Record<string, unknown>[];
    insights?: AIInsight[];
  };
}

export interface ChatResponse {
  message: ChatMessage;
  toolCalls?: ToolCallResult[];
}

// Store types for IndexedDB
export interface AIStoreSchema {
  insights: AIInsight;
  chatSessions: ChatSession;
  segments: UserSegment;
  alerts: MetricAlert;
}
