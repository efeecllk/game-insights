/**
 * AI Context - Global state for AI-powered analytics
 *
 * Manages:
 * - AI provider configuration and status
 * - Generated insights
 * - Chat sessions
 * - Segments and alerts
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { GameCategory } from '@/types';
import {
  getAIService,
  type AIConfig,
  type AIInsight,
  type ProviderStatus,
  type ChatSession,
  type ChatMessage,
  type UserSegment,
  type MetricAlert,
  type ColumnInfo,
} from '@/services/ai';
import { InsightChain, AnalysisChain, type AnalysisSummary } from '@/services/ai/chains';
import { ProviderFactory } from '@/services/ai/providers';

// Storage keys
const INSIGHTS_STORAGE_KEY = 'game-insights-ai-insights';
const CHAT_STORAGE_KEY = 'game-insights-ai-chat';
const SEGMENTS_STORAGE_KEY = 'game-insights-ai-segments';
const ALERTS_STORAGE_KEY = 'game-insights-ai-alerts';

interface AIContextType {
  // Configuration
  config: AIConfig;
  updateConfig: (updates: Partial<AIConfig>) => void;

  // Provider Status
  status: ProviderStatus | null;
  isConnected: boolean;
  isConfigured: boolean;
  refreshStatus: () => Promise<void>;

  // Insights
  insights: AIInsight[];
  isGenerating: boolean;
  generationProgress: { step: string; progress: number } | null;
  generateInsights: (params: GenerateInsightsParams) => Promise<AIInsight[]>;
  clearInsights: (projectId?: string) => void;
  markInsightActioned: (insightId: string, actionType: 'segment' | 'alert' | 'exported') => void;

  // Analysis Summary
  analysisSummary: AnalysisSummary | null;

  // Chat
  chatSessions: ChatSession[];
  activeChatSession: ChatSession | null;
  sendChatMessage: (projectId: string, message: string) => Promise<ChatMessage>;
  clearChatSession: (projectId: string) => void;

  // Segments
  segments: UserSegment[];
  createSegment: (segment: Omit<UserSegment, 'id' | 'createdAt'>) => UserSegment;
  deleteSegment: (segmentId: string) => void;

  // Alerts
  alerts: MetricAlert[];
  createAlert: (alert: Omit<MetricAlert, 'id' | 'createdAt'>) => MetricAlert;
  deleteAlert: (alertId: string) => void;
  toggleAlert: (alertId: string) => void;
}

interface GenerateInsightsParams {
  projectId: string;
  gameType: GameCategory;
  columns: ColumnInfo[];
  data: Record<string, unknown>[];
  existingMetrics?: Record<string, number>;
  useFullAnalysis?: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  // State
  const [config, setConfig] = useState<AIConfig>(() => getAIService().getConfig());
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    step: string;
    progress: number;
  } | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [alerts, setAlerts] = useState<MetricAlert[]>([]);

  // Load persisted data on mount
  useEffect(() => {
    try {
      const storedInsights = localStorage.getItem(INSIGHTS_STORAGE_KEY);
      if (storedInsights) {
        setInsights(JSON.parse(storedInsights));
      }

      const storedChat = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedChat) {
        setChatSessions(JSON.parse(storedChat));
      }

      const storedSegments = localStorage.getItem(SEGMENTS_STORAGE_KEY);
      if (storedSegments) {
        setSegments(JSON.parse(storedSegments));
      }

      const storedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (storedAlerts) {
        setAlerts(JSON.parse(storedAlerts));
      }
    } catch (error) {
      console.error('Failed to load AI data from storage:', error);
    }
  }, []);

  // Persist data changes
  useEffect(() => {
    localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(insights));
  }, [insights]);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    localStorage.setItem(SEGMENTS_STORAGE_KEY, JSON.stringify(segments));
  }, [segments]);

  useEffect(() => {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Load initial status
  useEffect(() => {
    refreshStatus();
  }, []);

  // Derived state
  const isConnected = useMemo(() => status?.connected ?? false, [status]);
  const isConfigured = useMemo(() => getAIService().isConfigured(), [config]);

  // Active chat session (most recent for active project)
  const activeChatSession = useMemo(() => {
    if (chatSessions.length === 0) return null;
    return chatSessions.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  }, [chatSessions]);

  // Callbacks
  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    const service = getAIService();
    service.updateConfig(updates);
    setConfig(service.getConfig());
    refreshStatus();
  }, []);

  const refreshStatus = useCallback(async () => {
    const service = getAIService();
    const newStatus = await service.getStatus(true);
    setStatus(newStatus);
  }, []);

  const generateInsights = useCallback(
    async (params: GenerateInsightsParams): Promise<AIInsight[]> => {
      const { projectId, gameType, columns, data, existingMetrics, useFullAnalysis } = params;

      setIsGenerating(true);
      setGenerationProgress({ step: 'Initializing...', progress: 0 });

      try {
        const currentConfig = getAIService().getConfig();

        if (!ProviderFactory.canCreate(currentConfig)) {
          throw new Error('AI provider not configured');
        }

        const provider = ProviderFactory.create(currentConfig);

        let newInsights: AIInsight[];
        let summary: AnalysisSummary | null = null;

        if (useFullAnalysis) {
          // Use full analysis chain with progress
          const analysisChain = new AnalysisChain(provider);
          const result = await analysisChain.runWithProgress(
            {
              projectId,
              gameType,
              columns,
              data,
              existingMetrics,
              options: {
                maxInsights: 10,
                includeRecommendations: true,
              },
            },
            (step, progress) => {
              setGenerationProgress({ step, progress });
            }
          );
          newInsights = result.insights;
          summary = result.summary;
        } else {
          // Use simple insight chain
          setGenerationProgress({ step: 'Generating insights...', progress: 30 });
          const insightChain = new InsightChain(provider);
          const result = await insightChain.run({
            projectId,
            gameType,
            columns,
            data,
            existingMetrics,
            maxInsights: 5,
          });
          newInsights = result.insights;
        }

        // Update state
        setInsights((prev) => {
          // Remove old insights for this project, add new ones
          const filtered = prev.filter((i) => i.projectId !== projectId);
          return [...filtered, ...newInsights];
        });

        if (summary) {
          setAnalysisSummary(summary);
        }

        setGenerationProgress({ step: 'Complete', progress: 100 });
        return newInsights;
      } catch (error) {
        console.error('Failed to generate insights:', error);
        setGenerationProgress({ step: 'Failed', progress: 0 });
        return [];
      } finally {
        setIsGenerating(false);
        setTimeout(() => setGenerationProgress(null), 2000);
      }
    },
    []
  );

  const clearInsights = useCallback((projectId?: string) => {
    if (projectId) {
      setInsights((prev) => prev.filter((i) => i.projectId !== projectId));
    } else {
      setInsights([]);
    }
    setAnalysisSummary(null);
  }, []);

  const markInsightActioned = useCallback(
    (insightId: string, actionType: 'segment' | 'alert' | 'exported') => {
      setInsights((prev) =>
        prev.map((insight) =>
          insight.id === insightId
            ? {
                ...insight,
                actioned: true,
                actionedAt: new Date().toISOString(),
                actionType,
              }
            : insight
        )
      );
    },
    []
  );

  const sendChatMessage = useCallback(
    async (projectId: string, message: string): Promise<ChatMessage> => {
      const service = getAIService();

      // Find or create session for this project
      let session = chatSessions.find((s) => s.projectId === projectId);
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        projectId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      if (!session) {
        session = {
          id: `session-${Date.now()}`,
          projectId,
          messages: [userMessage],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setChatSessions((prev) => [...prev, session!]);
      } else {
        session = {
          ...session,
          messages: [...session.messages, userMessage],
          updatedAt: new Date().toISOString(),
        };
        setChatSessions((prev) => prev.map((s) => (s.id === session!.id ? session! : s)));
      }

      // Get AI response
      const projectInsights = insights.filter((i) => i.projectId === projectId);
      const response = await service.chat({
        projectId,
        message,
        context: {
          insights: projectInsights,
        },
      });

      // Add assistant message to session
      const assistantMessage = response.message;
      setChatSessions((prev) =>
        prev.map((s) =>
          s.projectId === projectId
            ? {
                ...s,
                messages: [...s.messages, assistantMessage],
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );

      return assistantMessage;
    },
    [chatSessions, insights]
  );

  const clearChatSession = useCallback((projectId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.projectId !== projectId));
  }, []);

  const createSegment = useCallback(
    (segment: Omit<UserSegment, 'id' | 'createdAt'>): UserSegment => {
      const newSegment: UserSegment = {
        ...segment,
        id: `segment-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setSegments((prev) => [...prev, newSegment]);
      return newSegment;
    },
    []
  );

  const deleteSegment = useCallback((segmentId: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== segmentId));
  }, []);

  const createAlert = useCallback(
    (alert: Omit<MetricAlert, 'id' | 'createdAt'>): MetricAlert => {
      const newAlert: MetricAlert = {
        ...alert,
        id: `alert-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setAlerts((prev) => [...prev, newAlert]);
      return newAlert;
    },
    []
  );

  const deleteAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const toggleAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, enabled: !a.enabled } : a))
    );
  }, []);

  const value = useMemo(
    () => ({
      config,
      updateConfig,
      status,
      isConnected,
      isConfigured,
      refreshStatus,
      insights,
      isGenerating,
      generationProgress,
      generateInsights,
      clearInsights,
      markInsightActioned,
      analysisSummary,
      chatSessions,
      activeChatSession,
      sendChatMessage,
      clearChatSession,
      segments,
      createSegment,
      deleteSegment,
      alerts,
      createAlert,
      deleteAlert,
      toggleAlert,
    }),
    [
      config,
      updateConfig,
      status,
      isConnected,
      isConfigured,
      refreshStatus,
      insights,
      isGenerating,
      generationProgress,
      generateInsights,
      clearInsights,
      markInsightActioned,
      analysisSummary,
      chatSessions,
      activeChatSession,
      sendChatMessage,
      clearChatSession,
      segments,
      createSegment,
      deleteSegment,
      alerts,
      createAlert,
      deleteAlert,
      toggleAlert,
    ]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

export default AIContext;
