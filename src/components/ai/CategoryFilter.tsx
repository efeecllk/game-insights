/**
 * CategoryFilter - Filter tabs for insight categories
 */

import { motion } from 'framer-motion';
import { Users, DollarSign, Zap, TrendingUp, CheckCircle } from 'lucide-react';
import type { InsightCategory } from '@/services/ai/types';

interface CategoryFilterProps {
  counts: Record<InsightCategory, number>;
  selected: InsightCategory | 'all';
  onChange: (category: InsightCategory | 'all') => void;
}

const categoryInfo: Record<
  InsightCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  retention: {
    label: 'Retention',
    icon: Users,
    color: 'text-[#A68B5B]',
  },
  monetization: {
    label: 'Monetization',
    icon: DollarSign,
    color: 'text-th-success',
  },
  engagement: {
    label: 'Engagement',
    icon: Zap,
    color: 'text-th-warning',
  },
  progression: {
    label: 'Progression',
    icon: TrendingUp,
    color: 'text-th-accent-primary',
  },
  quality: {
    label: 'Quality',
    icon: CheckCircle,
    color: 'text-[#C15F3C]',
  },
};

export function CategoryFilter({ counts, selected, onChange }: CategoryFilterProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const categories: (InsightCategory | 'all')[] = [
    'all',
    'retention',
    'monetization',
    'engagement',
    'progression',
    'quality',
  ];

  return (
    <div className="flex gap-1 p-1 bg-th-bg-elevated rounded-xl border border-th-border overflow-x-auto">
      {categories.map((category) => {
        const isSelected = selected === category;
        const count = category === 'all' ? total : counts[category as InsightCategory];
        const info = category === 'all' ? null : categoryInfo[category as InsightCategory];
        const Icon = info?.icon;

        return (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isSelected
                ? 'text-th-text-primary'
                : 'text-th-text-muted hover:text-th-text-secondary'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="categoryFilter"
                className="absolute inset-0 bg-th-bg-surface border border-th-border-strong rounded-lg"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {Icon && <Icon className={`w-4 h-4 ${isSelected ? info?.color : ''}`} />}
              {category === 'all' ? 'All' : info?.label}
              <span
                className={`px-1.5 py-0.5 text-xs rounded ${
                  isSelected ? 'bg-th-accent-primary-muted text-th-accent-primary' : 'bg-th-bg-surface text-th-text-muted'
                }`}
              >
                {count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
