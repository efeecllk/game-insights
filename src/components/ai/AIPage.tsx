/**
 * AIPage - Main AI Analytics page layout
 *
 * Features:
 * - Insight generation trigger
 * - Filtered insight list with categories
 * - Selected insight detail panel
 * - Provider status indicator
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Zap,
  MessageCircle,
  Download,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useGame } from '@/context/GameContext';
import { useAI } from '@/context/AIContext';
import { useAIInsights } from '@/hooks';
import type { AIInsight } from '@/services/ai/types';
import { InsightList } from './InsightList';
import { ProviderStatus } from './ProviderStatus';

const typeIcons = {
  positive: TrendingUp,
  negative: TrendingDown,
  warning: AlertTriangle,
  opportunity: Lightbulb,
  neutral: Sparkles,
};

interface AIPageProps {
  onOpenChat?: () => void;
}

export function AIPage({ onOpenChat }: AIPageProps) {
  const { activeGameData } = useData();
  const { selectedGame } = useGame();
  const { generateInsights, isGenerating, generationProgress, isConfigured, createSegment, createAlert, markInsightActioned } = useAI();
  const { insights } = useAIInsights({
    projectId: activeGameData?.id,
  });

  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!activeGameData || !isConfigured) return;

    const columns = Object.keys(activeGameData.rawData[0] || {}).map((name) => ({
      name,
      type: typeof activeGameData.rawData[0]?.[name] || 'unknown',
    }));

    await generateInsights({
      projectId: activeGameData.id,
      gameType: selectedGame,
      columns,
      data: activeGameData.rawData,
      useFullAnalysis: true,
    });
  }, [activeGameData, selectedGame, generateInsights, isConfigured]);

  const handleAction = useCallback(
    (insight: AIInsight, action: 'segment' | 'alert' | 'exported') => {
      if (!activeGameData) return;

      if (action === 'segment') {
        createSegment({
          projectId: activeGameData.id,
          name: `Segment: ${insight.title}`,
          description: `Created from insight: ${insight.description}`,
          filters: [],
          createdFrom: insight.id,
        });
        markInsightActioned(insight.id, 'segment');
      } else if (action === 'alert') {
        createAlert({
          projectId: activeGameData.id,
          metricName: insight.metricName || insight.category,
          condition: insight.type === 'negative' || insight.type === 'warning' ? 'below' : 'above',
          threshold: 0,
          enabled: true,
          createdFrom: insight.id,
        });
        markInsightActioned(insight.id, 'alert');
      } else if (action === 'exported') {
        markInsightActioned(insight.id, 'exported');
      }
    },
    [activeGameData, createSegment, createAlert, markInsightActioned]
  );

  const handleExportAll = () => {
    const markdown = insights
      .map(
        (i) => `## ${i.title}
**Category:** ${i.category} | **Priority:** ${i.priority}/10 | **Impact:** ${i.businessImpact}

${i.description}

**Recommendation:** ${i.recommendation}

---
`
      )
      .join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insights-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeGameData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <div className="p-4 rounded-2xl bg-th-bg-elevated border border-th-border mb-4">
          <Bot className="w-10 h-10 text-th-text-muted" />
        </div>
        <h2 className="text-xl font-semibold text-th-text-primary mb-2">No Data Selected</h2>
        <p className="text-sm text-th-text-muted max-w-md text-center">
          Upload game data or select an existing dataset to generate AI-powered insights.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-th-accent-primary/20 rounded-2xl blur-sm" />
            <div className="relative w-12 h-12 rounded-2xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-th-accent-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-th-text-primary">AI Analytics</h1>
            <p className="text-sm text-th-text-muted">
              Powered by advanced language models
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ProviderStatus />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-th-bg-surface rounded-xl border border-th-border">
        <div className="flex items-center gap-3">
          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating || !isConfigured}
            className="flex items-center gap-2 px-4 py-2.5 bg-th-accent-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-th-accent-primary-hover"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Insights
              </>
            )}
          </motion.button>

          {/* Progress indicator */}
          {isGenerating && generationProgress && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-th-bg-elevated rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-th-accent-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress.progress}%` }}
                />
              </div>
              <span className="text-xs text-th-text-muted">{generationProgress.step}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Export All */}
          {insights.length > 0 && (
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-surface-hover transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
          )}

          {/* Chat Button */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-surface-hover transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Insights List */}
        <div className="flex-1 overflow-y-auto pr-2">
          <InsightList
            insights={insights}
            selectedInsight={selectedInsight}
            onSelectInsight={setSelectedInsight}
            onAction={handleAction}
          />
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedInsight && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-96 flex-shrink-0 overflow-y-auto"
            >
              <InsightDetailPanel
                insight={selectedInsight}
                onClose={() => setSelectedInsight(null)}
                onAction={(action) => handleAction(selectedInsight, action)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Detail Panel Component
function InsightDetailPanel({
  insight,
  onClose,
  onAction,
}: {
  insight: AIInsight;
  onClose: () => void;
  onAction: (action: 'segment' | 'alert' | 'exported') => void;
}) {
  const Icon = typeIcons[insight.type];

  return (
    <div className="bg-th-bg-surface rounded-2xl border border-th-border p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20">
            <Icon className="w-5 h-5 text-th-accent-primary" />
          </div>
          <div>
            <span className="text-xs text-th-text-muted capitalize">{insight.category}</span>
            <h3 className="text-lg font-semibold text-th-text-primary">{insight.title}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-th-text-muted hover:text-th-text-secondary hover:bg-th-bg-elevated transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Impact Badge */}
      {insight.revenueImpact && (
        <div
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium mb-4 ${
            insight.revenueImpact.type === 'increase'
              ? 'bg-th-success-muted text-th-success'
              : 'bg-th-error-muted text-th-error'
          }`}
        >
          {insight.revenueImpact.type === 'increase' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {insight.revenueImpact.type === 'increase' ? '+' : '-'}
          {insight.revenueImpact.percentage}% revenue
          {insight.revenueImpact.estimated && (
            <span className="text-xs opacity-75">
              (${insight.revenueImpact.estimated.toLocaleString()})
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-th-text-secondary mb-2">Description</h4>
        <p className="text-sm text-th-text-primary">{insight.description}</p>
      </div>

      {/* Recommendation */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-th-text-secondary mb-2">Recommendation</h4>
        <p className="text-sm text-th-text-primary">{insight.recommendation}</p>
      </div>

      {/* Evidence */}
      {insight.evidence && insight.evidence.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-th-text-secondary mb-2">Evidence</h4>
          <ul className="space-y-1">
            {insight.evidence.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-th-text-primary">
                <span className="text-th-accent-primary mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-th-bg-elevated rounded-xl mb-6">
        <div>
          <span className="text-xs text-th-text-muted">Priority</span>
          <div className="text-lg font-semibold text-th-text-primary">{insight.priority}/10</div>
        </div>
        <div>
          <span className="text-xs text-th-text-muted">Confidence</span>
          <div className="text-lg font-semibold text-th-text-primary">
            {Math.round(insight.confidence * 100)}%
          </div>
        </div>
        <div>
          <span className="text-xs text-th-text-muted">Impact</span>
          <div className="text-sm font-medium text-th-text-primary capitalize">
            {insight.businessImpact}
          </div>
        </div>
        <div>
          <span className="text-xs text-th-text-muted">Source</span>
          <div className="text-sm font-medium text-th-text-primary capitalize">{insight.source}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => onAction('segment')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-th-accent-primary-muted border border-th-accent-primary/30 text-th-accent-primary rounded-xl font-medium hover:bg-th-accent-primary/20 transition-colors"
        >
          Create Segment
        </button>
        <button
          onClick={() => onAction('alert')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-th-bg-elevated border border-th-border text-th-text-secondary rounded-xl font-medium hover:bg-th-bg-surface-hover transition-colors"
        >
          Set Alert
        </button>
      </div>

      {/* Generated At */}
      <div className="mt-4 pt-4 border-t border-th-border-subtle text-xs text-th-text-muted text-center">
        Generated {new Date(insight.generatedAt).toLocaleString()}
        {insight.model && ` • ${insight.model}`}
      </div>
    </div>
  );
}

export default AIPage;
