/**
 * IndustrySelector - Obsidian Analytics Design
 *
 * Premium industry selection with:
 * - Icon-based industry cards
 * - Auto-detection with confidence display
 * - Sub-category expansion
 */

import { useState, useRef, useEffect } from 'react';
import {
  Gamepad2,
  Building2,
  ShoppingCart,
  GraduationCap,
  PlayCircle,
  Landmark,
  HeartPulse,
  Layers,
  ChevronDown,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { IndustryType, IndustryPack } from '../industry/types';
import { cn } from '../lib/utils';

// Industry icons mapping
const INDUSTRY_ICONS: Record<IndustryType, React.ElementType> = {
  gaming: Gamepad2,
  saas: Building2,
  ecommerce: ShoppingCart,
  edtech: GraduationCap,
  media: PlayCircle,
  fintech: Landmark,
  healthcare: HeartPulse,
  custom: Layers,
};

// Industry colors
const INDUSTRY_COLORS: Record<IndustryType, string> = {
  gaming: 'text-[#DA7756]',
  saas: 'text-[#8F8B82]',
  ecommerce: 'text-[#7A8B5B]',
  edtech: 'text-[#E5A84B]',
  media: 'text-rose-400',
  fintech: 'text-[#C15F3C]',
  healthcare: 'text-rose-300',
  custom: 'text-gray-400',
};

interface IndustrySelectorProps {
  variant?: 'default' | 'compact' | 'sidebar';
  showConfidence?: boolean;
  className?: string;
}

export function IndustrySelector({
  variant = 'default',
  showConfidence = true,
  className,
}: IndustrySelectorProps) {
  const {
    selectedIndustry,
    selectedSubCategory,
    isAutoDetected,
    detectionConfidence,
    setIndustry,
    setAutoDetect,
    currentPack,
    availableIndustries,
    getPack,
  } = useProduct();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Icon = INDUSTRY_ICONS[selectedIndustry] || Layers;
  const colorClass = INDUSTRY_COLORS[selectedIndustry] || 'text-gray-400';

  // Get display name
  const displayName = currentPack?.name || selectedIndustry;
  const subCategoryName = currentPack?.subCategories.find(
    (sc) => sc.id === selectedSubCategory
  )?.name;

  // Render compact variant (for sidebar)
  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} className={cn('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
            'bg-white/5 hover:bg-white/10 border border-white/10',
            'text-white/80 hover:text-white'
          )}
        >
          <Icon className={cn('w-4 h-4', colorClass)} />
          <span className="text-sm font-medium">{displayName}</span>
          {subCategoryName && (
            <span className="text-xs text-white/50">/ {subCategoryName}</span>
          )}
          <ChevronDown className="w-3 h-3 ml-auto text-white/40" />
        </button>

        {isOpen && (
          <IndustryDropdown
            selectedIndustry={selectedIndustry}
            selectedSubCategory={selectedSubCategory}
            availableIndustries={availableIndustries}
            getPack={getPack}
            onSelectIndustry={(industry, subCategory) => {
              setIndustry(industry, subCategory);
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  // Render default variant
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
          'bg-white/5 hover:bg-white/10 border border-white/10',
          'text-white hover:border-white/20 w-full'
        )}
      >
        {/* Icon */}
        <div className={cn('p-2 rounded-lg', `bg-${selectedIndustry}-500/20`)}>
          <Icon className={cn('w-5 h-5', colorClass)} />
        </div>

        {/* Text */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium">{displayName}</span>
            {subCategoryName && (
              <>
                <span className="text-white/30">/</span>
                <span className="text-white/60">{subCategoryName}</span>
              </>
            )}
          </div>

          {/* Detection status */}
          {showConfidence && isAutoDetected && detectionConfidence > 0 && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3 h-3 text-accent-primary" />
              <span className="text-xs text-white/50">
                Auto-detected ({Math.round(detectionConfidence * 100)}% confidence)
              </span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-white/40 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <IndustryDropdown
          selectedIndustry={selectedIndustry}
          selectedSubCategory={selectedSubCategory}
          availableIndustries={availableIndustries}
          getPack={getPack}
          onSelectIndustry={(industry, subCategory) => {
            setIndustry(industry, subCategory);
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
          showAutoDetect
          isAutoDetected={isAutoDetected}
          onToggleAutoDetect={() => setAutoDetect(!isAutoDetected)}
        />
      )}
    </div>
  );
}

// Dropdown component
interface IndustryDropdownProps {
  selectedIndustry: IndustryType;
  selectedSubCategory: string | null;
  availableIndustries: IndustryType[];
  getPack: (industry: IndustryType) => IndustryPack | undefined;
  onSelectIndustry: (industry: IndustryType, subCategory?: string) => void;
  onClose: () => void;
  showAutoDetect?: boolean;
  isAutoDetected?: boolean;
  onToggleAutoDetect?: () => void;
}

function IndustryDropdown({
  selectedIndustry,
  selectedSubCategory,
  availableIndustries,
  getPack,
  onSelectIndustry,
  onClose: _onClose,
  showAutoDetect,
  isAutoDetected,
  onToggleAutoDetect,
}: IndustryDropdownProps) {
  void _onClose; // Reserved for future use
  const [expandedIndustry, setExpandedIndustry] = useState<IndustryType | null>(null);

  return (
    <div
      className={cn(
        'absolute top-full left-0 right-0 mt-2 z-50',
        'bg-bg-card border border-white/10 rounded-xl shadow-xl',
        'overflow-hidden min-w-[280px]'
      )}
    >
      {/* Auto-detect toggle */}
      {showAutoDetect && onToggleAutoDetect && (
        <button
          onClick={onToggleAutoDetect}
          className={cn(
            'flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors',
            'border-b border-white/10',
            isAutoDetected
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'hover:bg-white/5 text-white/60'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isAutoDetected && 'animate-spin-slow')} />
          <span>Auto-detect from data</span>
          {isAutoDetected && <Check className="w-4 h-4 ml-auto" />}
        </button>
      )}

      {/* Industry list */}
      <div className="max-h-[400px] overflow-y-auto py-2">
        {availableIndustries.map((industry) => {
          const pack = getPack(industry);
          const Icon = INDUSTRY_ICONS[industry] || Layers;
          const colorClass = INDUSTRY_COLORS[industry] || 'text-gray-400';
          const isSelected = selectedIndustry === industry;
          const hasSubCategories = pack && pack.subCategories.length > 1;
          const isExpanded = expandedIndustry === industry;

          return (
            <div key={industry}>
              <button
                onClick={() => {
                  if (hasSubCategories) {
                    setExpandedIndustry(isExpanded ? null : industry);
                  } else {
                    onSelectIndustry(industry);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors',
                  isSelected && !hasSubCategories
                    ? 'bg-accent-primary/10 text-white'
                    : 'hover:bg-white/5 text-white/80'
                )}
              >
                <Icon className={cn('w-5 h-5', colorClass)} />
                <span className="flex-1 text-left">{pack?.name || industry}</span>
                {isSelected && !hasSubCategories && (
                  <Check className="w-4 h-4 text-accent-primary" />
                )}
                {hasSubCategories && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-white/40 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                )}
              </button>

              {/* Sub-categories */}
              {hasSubCategories && isExpanded && (
                <div className="bg-white/5 py-1">
                  {pack.subCategories.map((subCat) => {
                    const isSubSelected =
                      isSelected && selectedSubCategory === subCat.id;

                    return (
                      <button
                        key={subCat.id}
                        onClick={() => {
                          onSelectIndustry(industry, subCat.id);
                        }}
                        className={cn(
                          'flex items-center gap-3 w-full pl-12 pr-4 py-2 text-sm transition-colors',
                          isSubSelected
                            ? 'bg-accent-primary/10 text-white'
                            : 'hover:bg-white/5 text-white/60'
                        )}
                      >
                        <span className="flex-1 text-left">{subCat.name}</span>
                        {isSubSelected && (
                          <Check className="w-4 h-4 text-accent-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * IndustryBadge - Small inline badge showing current industry
 */
interface IndustryBadgeProps {
  industry?: IndustryType;
  subCategory?: string;
  className?: string;
}

export function IndustryBadge({ industry, subCategory, className }: IndustryBadgeProps) {
  const { selectedIndustry, selectedSubCategory, getPack } = useProduct();

  const displayIndustry = industry || selectedIndustry;
  const displaySubCategory = subCategory || selectedSubCategory;
  const pack = getPack(displayIndustry);

  const Icon = INDUSTRY_ICONS[displayIndustry] || Layers;
  const colorClass = INDUSTRY_COLORS[displayIndustry] || 'text-gray-400';
  const subCatName = pack?.subCategories.find((sc) => sc.id === displaySubCategory)?.name;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs',
        'bg-white/10 text-white/70',
        className
      )}
    >
      <Icon className={cn('w-3 h-3', colorClass)} />
      <span>{pack?.name || displayIndustry}</span>
      {subCatName && (
        <>
          <span className="text-white/30">/</span>
          <span className="text-white/50">{subCatName}</span>
        </>
      )}
    </span>
  );
}

export default IndustrySelector;
