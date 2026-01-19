/**
 * InsightList - Grid of insight cards with filtering and sorting
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SortAsc, SortDesc, Sparkles } from 'lucide-react';
import type { AIInsight, InsightCategory } from '@/services/ai/types';
import { InsightCard } from './InsightCard';
import { CategoryFilter } from './CategoryFilter';

interface InsightListProps {
  insights: AIInsight[];
  selectedInsight: AIInsight | null;
  onSelectInsight: (insight: AIInsight) => void;
  onAction: (insight: AIInsight, action: 'segment' | 'alert' | 'exported') => void;
}

type SortBy = 'priority' | 'confidence' | 'date';
type SortOrder = 'asc' | 'desc';

export function InsightList({
  insights,
  selectedInsight,
  onSelectInsight,
  onAction,
}: InsightListProps) {
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Calculate counts by category
  const countByCategory = useMemo(() => {
    const counts: Record<InsightCategory, number> = {
      retention: 0,
      monetization: 0,
      engagement: 0,
      progression: 0,
      quality: 0,
    };
    for (const insight of insights) {
      counts[insight.category]++;
    }
    return counts;
  }, [insights]);

  // Filter and sort insights
  const filteredInsights = useMemo(() => {
    let filtered = insights;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((i) => i.category === selectedCategory);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'date':
          comparison = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [insights, selectedCategory, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-2xl bg-th-bg-elevated border border-th-border mb-4">
          <Sparkles className="w-8 h-8 text-th-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-th-text-primary mb-2">No insights yet</h3>
        <p className="text-sm text-th-text-muted max-w-xs">
          Generate insights from your data to see AI-powered recommendations here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sort */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <CategoryFilter
          counts={countByCategory}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />

        <div className="flex items-center gap-2">
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-1.5 bg-th-bg-elevated border border-th-border rounded-lg text-sm text-th-text-secondary focus:outline-none focus:border-th-accent-primary/50"
          >
            <option value="priority">Priority</option>
            <option value="confidence">Confidence</option>
            <option value="date">Date</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={toggleSortOrder}
            className="p-1.5 rounded-lg bg-th-bg-elevated border border-th-border text-th-text-muted hover:text-th-text-secondary transition-colors"
            title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
          >
            {sortOrder === 'desc' ? (
              <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-th-text-muted">
        Showing {filteredInsights.length} of {insights.length} insights
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredInsights.map((insight) => (
            <motion.div
              key={insight.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <InsightCard
                insight={insight}
                isSelected={selectedInsight?.id === insight.id}
                onSelect={onSelectInsight}
                onAction={onAction}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredInsights.length === 0 && (
        <div className="text-center py-8 text-th-text-muted">
          No insights found for the selected filters.
        </div>
      )}
    </div>
  );
}

export default InsightList;
