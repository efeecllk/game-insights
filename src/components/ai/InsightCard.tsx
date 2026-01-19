/**
 * InsightCard - Enhanced insight card with sparkline and actions
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  ChevronDown,
  Users,
  Bell,
  Copy,
  Check,
} from 'lucide-react';
import type { AIInsight } from '@/services/ai/types';
import { SparklineChart } from './SparklineChart';

interface InsightCardProps {
  insight: AIInsight;
  isSelected?: boolean;
  onSelect?: (insight: AIInsight) => void;
  onAction?: (insight: AIInsight, action: 'segment' | 'alert' | 'exported') => void;
  compact?: boolean;
}

const typeIcons = {
  positive: TrendingUp,
  negative: TrendingDown,
  warning: AlertTriangle,
  opportunity: Lightbulb,
  neutral: CheckCircle,
};

const typeColors = {
  positive: 'text-th-success bg-th-success-muted border-th-success/20',
  negative: 'text-th-error bg-th-error-muted border-th-error/20',
  warning: 'text-th-warning bg-th-warning-muted border-th-warning/20',
  opportunity: 'text-th-accent-primary bg-th-accent-primary-muted border-th-accent-primary/20',
  neutral: 'text-th-text-secondary bg-th-bg-elevated border-th-border',
};

const impactColors = {
  high: 'bg-th-error-muted text-th-error',
  medium: 'bg-th-warning-muted text-th-warning',
  low: 'bg-th-bg-elevated text-th-text-muted',
};

export function InsightCard({
  insight,
  isSelected = false,
  onSelect,
  onAction,
  compact = false,
}: InsightCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const Icon = typeIcons[insight.type];
  const colorClass = typeColors[insight.type];

  const handleCopyMarkdown = () => {
    const markdown = `## ${insight.title}

**Category:** ${insight.category}
**Type:** ${insight.type}
**Priority:** ${insight.priority}/10
**Business Impact:** ${insight.businessImpact}

### Description
${insight.description}

### Recommendation
${insight.recommendation}

${insight.evidence && insight.evidence.length > 0 ? `### Evidence\n${insight.evidence.map((e) => `- ${e}`).join('\n')}` : ''}
`;

    navigator.clipboard.writeText(markdown);
    setCopiedId(insight.id);
    onAction?.(insight, 'exported');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => onSelect?.(insight)}
        className={`p-3 rounded-xl border cursor-pointer transition-all ${
          isSelected
            ? 'bg-th-accent-primary-muted border-th-accent-primary/30'
            : 'bg-th-bg-surface border-th-border hover:border-th-border-strong'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-lg ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-th-text-primary truncate">{insight.title}</h4>
            <p className="text-xs text-th-text-muted mt-0.5 line-clamp-2">{insight.description}</p>
            <div className="flex items-center gap-2 mt-2">
              {insight.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[10px] rounded bg-th-bg-elevated text-th-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      onClick={() => onSelect?.(insight)}
      className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'bg-th-accent-primary-muted border-th-accent-primary/30 ring-1 ring-th-accent-primary/20'
          : 'bg-th-bg-surface border-th-border hover:border-th-border-strong'
      }`}
    >
      {/* Actioned badge */}
      {insight.actioned && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-th-success-muted text-th-success text-[10px] rounded-full">
          <Check className="w-3 h-3" />
          Actioned
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-xl ${colorClass} border`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-th-text-primary">{insight.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-th-text-muted capitalize">{insight.category}</span>
              <span className="w-1 h-1 rounded-full bg-th-border" />
              <span className={`text-xs px-1.5 py-0.5 rounded ${impactColors[insight.businessImpact]}`}>
                {insight.businessImpact} impact
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {insight.tags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs rounded-lg ${
                tag.includes('+')
                  ? 'bg-th-success-muted text-th-success'
                  : tag.includes('-')
                    ? 'bg-th-error-muted text-th-error'
                    : 'bg-th-bg-elevated text-th-text-secondary'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-th-text-secondary line-clamp-2 mb-3">{insight.description}</p>

        {/* Sparkline */}
        {insight.metricHistory && insight.metricHistory.length > 0 && (
          <div className="mb-3">
            <SparklineChart
              data={insight.metricHistory}
              trend={insight.type === 'positive' ? 'up' : insight.type === 'negative' ? 'down' : 'neutral'}
            />
          </div>
        )}

        {/* Priority & Confidence */}
        <div className="flex items-center justify-between text-xs text-th-text-muted pt-3 border-t border-th-border-subtle">
          <div className="flex items-center gap-3">
            <span>
              Priority: <span className="text-th-text-secondary font-medium">{insight.priority}/10</span>
            </span>
            <span>
              Confidence:{' '}
              <span className="text-th-text-secondary font-medium">
                {Math.round(insight.confidence * 100)}%
              </span>
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="flex items-center gap-1 text-th-text-muted hover:text-th-text-secondary transition-colors"
          >
            Actions
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showActions ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Actions Dropdown */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-th-border-subtle"
          >
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.(insight, 'segment');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-th-bg-surface-hover transition-colors"
              >
                <Users className="w-4 h-4" />
                Create Segment
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.(insight, 'alert');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-th-bg-surface-hover transition-colors"
              >
                <Bell className="w-4 h-4" />
                Set Alert
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyMarkdown();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-th-bg-surface-hover transition-colors"
              >
                {copiedId === insight.id ? (
                  <Check className="w-4 h-4 text-th-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default InsightCard;
