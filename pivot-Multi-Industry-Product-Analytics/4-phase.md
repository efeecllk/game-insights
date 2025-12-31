# Phase 4: UI/UX Transformation

## Overview

Transform the user interface to support multi-industry contexts. This phase replaces GameContext with ProductContext, implements dynamic terminology, creates the IndustrySelector component, and updates all UI components to be industry-aware.

**Duration**: 2 weeks
**Dependencies**: Phase 1 (Core Abstractions), Phase 2 (Gaming Pack), Phase 3 (SaaS & E-commerce Packs)

---

## Objectives

1. Replace GameContext with ProductContext
2. Implement dynamic terminology system
3. Create IndustrySelector component
4. Update Sidebar with industry-specific navigation
5. Transform KPICard and other components for multi-industry support
6. Implement industry theming system

---

## Task 4.1: ProductContext Implementation

### File: `src/context/ProductContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { IndustryType, IndustrySubCategory, ProductCategory, IndustryPack } from '@/industry/types';
import { IndustryRegistry } from '@/industry/IndustryRegistry';

// Terminology function type
type TerminologyFunction = (key: string, plural?: boolean) => string;

interface ProductContextState {
  // Industry selection
  selectedIndustry: IndustryType | null;
  selectedSubCategory: IndustrySubCategory | null;
  productCategory: ProductCategory | null;

  // Current industry pack
  currentPack: IndustryPack | null;

  // Detection results
  detectedIndustry: IndustryType | null;
  detectionConfidence: number;
  detectionReasons: string[];
  alternativeIndustries: Array<{ industry: IndustryType; confidence: number }>;

  // UI state
  isIndustryOverridden: boolean;

  // Actions
  setIndustry: (industry: IndustryType, subCategory?: IndustrySubCategory) => void;
  setDetectedIndustry: (
    industry: IndustryType,
    confidence: number,
    reasons: string[],
    alternatives?: Array<{ industry: IndustryType; confidence: number }>
  ) => void;
  resetToDetected: () => void;
  clearIndustry: () => void;

  // Terminology helper
  t: TerminologyFunction;

  // Theme helpers
  getPrimaryColor: () => string;
  getAccentColor: () => string;
  getChartColors: () => string[];
}

const defaultState: ProductContextState = {
  selectedIndustry: null,
  selectedSubCategory: null,
  productCategory: null,
  currentPack: null,
  detectedIndustry: null,
  detectionConfidence: 0,
  detectionReasons: [],
  alternativeIndustries: [],
  isIndustryOverridden: false,
  setIndustry: () => {},
  setDetectedIndustry: () => {},
  resetToDetected: () => {},
  clearIndustry: () => {},
  t: (key) => key,
  getPrimaryColor: () => '#8b5cf6',
  getAccentColor: () => '#6366f1',
  getChartColors: () => ['#8b5cf6', '#6366f1', '#ec4899', '#06b6d4', '#22c55e', '#f97316'],
};

const ProductContext = createContext<ProductContextState>(defaultState);

interface ProductProviderProps {
  children: ReactNode;
  registry?: IndustryRegistry;
}

export function ProductProvider({ children, registry }: ProductProviderProps) {
  const industryRegistry = registry || IndustryRegistry.getInstance();

  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<IndustrySubCategory | null>(null);
  const [detectedIndustry, setDetectedIndustryState] = useState<IndustryType | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [detectionReasons, setDetectionReasons] = useState<string[]>([]);
  const [alternativeIndustries, setAlternativeIndustries] = useState<Array<{ industry: IndustryType; confidence: number }>>([]);
  const [isIndustryOverridden, setIsIndustryOverridden] = useState(false);

  // Compute current pack based on selected industry
  const currentPack = selectedIndustry
    ? industryRegistry.getPack(selectedIndustry)
    : null;

  // Compute product category
  const productCategory: ProductCategory | null = selectedIndustry && selectedSubCategory
    ? { industry: selectedIndustry, subCategory: selectedSubCategory }
    : null;

  // Set industry (manual override)
  const setIndustry = useCallback((industry: IndustryType, subCategory?: IndustrySubCategory) => {
    const pack = industryRegistry.getPack(industry);
    if (!pack) {
      console.warn(`Industry pack not found: ${industry}`);
      return;
    }

    setSelectedIndustry(industry);

    // Use provided subCategory or first from pack
    const effectiveSubCategory = subCategory || pack.subCategories[0]?.id;
    setSelectedSubCategory(effectiveSubCategory || null);

    // Mark as overridden if different from detected
    setIsIndustryOverridden(industry !== detectedIndustry);
  }, [industryRegistry, detectedIndustry]);

  // Set detected industry (from IndustryDetector)
  const setDetectedIndustry = useCallback((
    industry: IndustryType,
    confidence: number,
    reasons: string[],
    alternatives: Array<{ industry: IndustryType; confidence: number }> = []
  ) => {
    setDetectedIndustryState(industry);
    setDetectionConfidence(confidence);
    setDetectionReasons(reasons);
    setAlternativeIndustries(alternatives);

    // Auto-select if not already selected or not overridden
    if (!selectedIndustry || !isIndustryOverridden) {
      setIndustry(industry);
      setIsIndustryOverridden(false);
    }
  }, [selectedIndustry, isIndustryOverridden, setIndustry]);

  // Reset to detected industry
  const resetToDetected = useCallback(() => {
    if (detectedIndustry) {
      setIndustry(detectedIndustry);
      setIsIndustryOverridden(false);
    }
  }, [detectedIndustry, setIndustry]);

  // Clear industry selection
  const clearIndustry = useCallback(() => {
    setSelectedIndustry(null);
    setSelectedSubCategory(null);
    setDetectedIndustryState(null);
    setDetectionConfidence(0);
    setDetectionReasons([]);
    setAlternativeIndustries([]);
    setIsIndustryOverridden(false);
  }, []);

  // Terminology helper function
  const t: TerminologyFunction = useCallback((key: string, plural = false) => {
    if (!currentPack?.terminology) {
      return key;
    }

    const term = currentPack.terminology[key];
    if (!term) {
      return key;
    }

    return plural && term.plural ? term.plural : term.singular;
  }, [currentPack]);

  // Theme helpers
  const getPrimaryColor = useCallback(() => {
    return currentPack?.theme?.primaryColor || '#8b5cf6';
  }, [currentPack]);

  const getAccentColor = useCallback(() => {
    return currentPack?.theme?.accentColor || '#6366f1';
  }, [currentPack]);

  const getChartColors = useCallback(() => {
    return currentPack?.theme?.chartColors || [
      '#8b5cf6', '#6366f1', '#ec4899', '#06b6d4', '#22c55e', '#f97316'
    ];
  }, [currentPack]);

  const value: ProductContextState = {
    selectedIndustry,
    selectedSubCategory,
    productCategory,
    currentPack,
    detectedIndustry,
    detectionConfidence,
    detectionReasons,
    alternativeIndustries,
    isIndustryOverridden,
    setIndustry,
    setDetectedIndustry,
    resetToDetected,
    clearIndustry,
    t,
    getPrimaryColor,
    getAccentColor,
    getChartColors,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

// Main hook
export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

// Convenience hooks
export function useTerminology() {
  const { t } = useProduct();
  return t;
}

export function useIndustryTheme() {
  const { getPrimaryColor, getAccentColor, getChartColors, currentPack } = useProduct();
  return {
    primaryColor: getPrimaryColor(),
    accentColor: getAccentColor(),
    chartColors: getChartColors(),
    icon: currentPack?.theme?.icon,
  };
}

export function useIndustryMetrics() {
  const { currentPack } = useProduct();
  return currentPack?.metrics || [];
}

export function useIndustryFunnels() {
  const { currentPack } = useProduct();
  return currentPack?.funnels || [];
}

export { ProductContext };
```

### File: `src/context/index.ts` (Update)

```typescript
// Re-export all contexts
export * from './DataContext';
export * from './ProductContext';

// Legacy support - deprecated
export { useProduct as useGame } from './ProductContext';
```

---

## Task 4.2: Dynamic Terminology System

### File: `src/hooks/useTerminology.ts`

```typescript
import { useMemo } from 'react';
import { useProduct } from '@/context/ProductContext';

interface TerminologyOptions {
  capitalize?: boolean;
  plural?: boolean;
}

/**
 * Hook for accessing industry-specific terminology
 *
 * @example
 * const { term, terms } = useTerminology();
 * term('user') // "Player" for gaming, "Customer" for SaaS
 * terms('user') // "Players" for gaming, "Customers" for SaaS
 */
export function useTerminology() {
  const { t, currentPack } = useProduct();

  // Get singular term
  const term = useMemo(() => {
    return (key: string, options: TerminologyOptions = {}) => {
      const { capitalize = false, plural = false } = options;
      let result = t(key, plural);

      if (capitalize && result) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
      }

      return result;
    };
  }, [t]);

  // Get plural term (convenience)
  const terms = useMemo(() => {
    return (key: string, options: Omit<TerminologyOptions, 'plural'> = {}) => {
      return term(key, { ...options, plural: true });
    };
  }, [term]);

  // Get all terminology for current industry
  const allTerms = useMemo(() => {
    return currentPack?.terminology || {};
  }, [currentPack]);

  return { term, terms, allTerms, t };
}

/**
 * Common terminology keys used across the app
 */
export const TERMINOLOGY_KEYS = {
  // Users
  USER: 'user',
  SESSION: 'session',

  // Actions
  CONVERSION: 'conversion',
  RETENTION: 'retention',
  CHURN: 'churn',

  // Money
  REVENUE: 'revenue',
  TRANSACTION: 'transaction',

  // Content
  CONTENT: 'content',
  ITEM: 'item',

  // Time
  ACTIVE: 'active',
  ENGAGED: 'engaged',
} as const;
```

### File: `src/components/ui/Term.tsx`

```typescript
import React from 'react';
import { useTerminology } from '@/hooks/useTerminology';

interface TermProps {
  /** Terminology key to look up */
  k: string;
  /** Whether to use plural form */
  plural?: boolean;
  /** Whether to capitalize first letter */
  capitalize?: boolean;
  /** Fallback text if key not found */
  fallback?: string;
  /** Additional className */
  className?: string;
}

/**
 * Component for rendering industry-specific terminology
 *
 * @example
 * <Term k="user" /> // "Player" for gaming
 * <Term k="user" plural /> // "Players" for gaming
 * <Term k="user" capitalize /> // "Player" with capital P
 */
export function Term({ k, plural = false, capitalize = true, fallback, className }: TermProps) {
  const { term } = useTerminology();

  let text = term(k, { plural, capitalize });

  // Use fallback if term returns the key unchanged
  if (text === k && fallback) {
    text = fallback;
  }

  return <span className={className}>{text}</span>;
}

/**
 * Plural version of Term component
 */
export function Terms({ k, capitalize = true, fallback, className }: Omit<TermProps, 'plural'>) {
  return <Term k={k} plural capitalize={capitalize} fallback={fallback} className={className} />;
}
```

---

## Task 4.3: IndustrySelector Component

### File: `src/components/IndustrySelector.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  AlertCircle,
  Sparkles,
  Gamepad2,
  Building2,
  ShoppingCart,
  GraduationCap,
  Play,
  Landmark,
  Heart,
  Settings
} from 'lucide-react';
import { useProduct } from '@/context/ProductContext';
import { IndustryRegistry } from '@/industry/IndustryRegistry';
import { IndustryType, IndustrySubCategory } from '@/industry/types';
import { cn } from '@/lib/utils';

// Industry icons mapping
const INDUSTRY_ICONS: Record<IndustryType, React.ElementType> = {
  gaming: Gamepad2,
  saas: Building2,
  ecommerce: ShoppingCart,
  edtech: GraduationCap,
  media: Play,
  fintech: Landmark,
  healthcare: Heart,
  custom: Settings,
};

interface IndustrySelectorProps {
  className?: string;
  showDetectionInfo?: boolean;
  compact?: boolean;
}

export function IndustrySelector({
  className,
  showDetectionInfo = true,
  compact = false
}: IndustrySelectorProps) {
  const {
    selectedIndustry,
    selectedSubCategory,
    detectedIndustry,
    detectionConfidence,
    isIndustryOverridden,
    alternativeIndustries,
    setIndustry,
    resetToDetected,
    currentPack,
  } = useProduct();

  const [isOpen, setIsOpen] = useState(false);
  const [showSubCategories, setShowSubCategories] = useState<IndustryType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const registry = IndustryRegistry.getInstance();
  const availablePacks = registry.getAllPacks();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSubCategories(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIndustrySelect = (industry: IndustryType) => {
    const pack = registry.getPack(industry);
    if (pack && pack.subCategories.length > 1) {
      setShowSubCategories(industry);
    } else {
      setIndustry(industry);
      setIsOpen(false);
      setShowSubCategories(null);
    }
  };

  const handleSubCategorySelect = (industry: IndustryType, subCategory: IndustrySubCategory) => {
    setIndustry(industry, subCategory);
    setIsOpen(false);
    setShowSubCategories(null);
  };

  const CurrentIcon = selectedIndustry ? INDUSTRY_ICONS[selectedIndustry] : Sparkles;

  // Get current sub-category name
  const currentSubCategoryName = currentPack?.subCategories.find(
    sc => sc.id === selectedSubCategory
  )?.name;

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-bg-card hover:bg-bg-card-hover border border-white/10',
          'text-white transition-colors',
          compact ? 'text-sm' : 'text-base'
        )}
      >
        <CurrentIcon className={cn('text-accent-primary', compact ? 'w-4 h-4' : 'w-5 h-5')} />

        <div className="flex flex-col items-start">
          <span className="font-medium">
            {currentPack?.name || 'Select Industry'}
          </span>
          {!compact && currentSubCategoryName && (
            <span className="text-xs text-white/60">{currentSubCategoryName}</span>
          )}
        </div>

        {/* Detection badge */}
        {showDetectionInfo && detectedIndustry && !isIndustryOverridden && (
          <span className="px-1.5 py-0.5 text-xs bg-accent-primary/20 text-accent-primary rounded">
            Auto
          </span>
        )}

        {isIndustryOverridden && (
          <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
            Manual
          </span>
        )}

        <ChevronDown className={cn(
          'w-4 h-4 text-white/60 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 mt-2 z-50',
          'bg-bg-card border border-white/10 rounded-xl shadow-xl',
          'min-w-[280px] overflow-hidden'
        )}>
          {/* Detection Info */}
          {showDetectionInfo && detectedIndustry && (
            <div className="px-4 py-3 border-b border-white/10 bg-accent-primary/5">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-accent-primary" />
                <span className="text-white/80">
                  Detected: <strong className="text-white">{registry.getPack(detectedIndustry)?.name}</strong>
                </span>
                <span className="text-white/60">
                  ({Math.round(detectionConfidence * 100)}% confidence)
                </span>
              </div>

              {isIndustryOverridden && (
                <button
                  onClick={() => {
                    resetToDetected();
                    setIsOpen(false);
                  }}
                  className="mt-2 text-xs text-accent-primary hover:text-accent-primary/80"
                >
                  Reset to detected industry
                </button>
              )}
            </div>
          )}

          {/* Industry List */}
          <div className="py-2">
            {showSubCategories ? (
              // Sub-category selection
              <>
                <button
                  onClick={() => setShowSubCategories(null)}
                  className="w-full px-4 py-2 text-left text-sm text-white/60 hover:bg-white/5 flex items-center gap-2"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                  Back to industries
                </button>

                <div className="border-t border-white/10 mt-2 pt-2">
                  {registry.getPack(showSubCategories)?.subCategories.map((subCat) => (
                    <button
                      key={subCat.id}
                      onClick={() => handleSubCategorySelect(showSubCategories, subCat.id)}
                      className={cn(
                        'w-full px-4 py-2 text-left hover:bg-white/5 flex items-center justify-between',
                        selectedIndustry === showSubCategories &&
                        selectedSubCategory === subCat.id && 'bg-accent-primary/10'
                      )}
                    >
                      <div>
                        <div className="text-white">{subCat.name}</div>
                        {subCat.description && (
                          <div className="text-xs text-white/60">{subCat.description}</div>
                        )}
                      </div>

                      {selectedIndustry === showSubCategories &&
                       selectedSubCategory === subCat.id && (
                        <Check className="w-4 h-4 text-accent-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              // Industry selection
              availablePacks.map((pack) => {
                const Icon = INDUSTRY_ICONS[pack.id];
                const isSelected = selectedIndustry === pack.id;
                const isDetected = detectedIndustry === pack.id;
                const hasSubCategories = pack.subCategories.length > 1;

                return (
                  <button
                    key={pack.id}
                    onClick={() => handleIndustrySelect(pack.id)}
                    className={cn(
                      'w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-3',
                      isSelected && 'bg-accent-primary/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isSelected ? 'text-accent-primary' : 'text-white/60'
                      )}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium',
                          isSelected ? 'text-white' : 'text-white/80'
                        )}>
                          {pack.name}
                        </span>

                        {isDetected && !isSelected && (
                          <span className="text-xs text-accent-primary">(Detected)</span>
                        )}
                      </div>

                      <div className="text-xs text-white/50">
                        {pack.subCategories.length} {pack.subCategories.length === 1 ? 'type' : 'types'}
                      </div>
                    </div>

                    {isSelected ? (
                      <Check className="w-4 h-4 text-accent-primary" />
                    ) : hasSubCategories ? (
                      <ChevronDown className="w-4 h-4 text-white/40 -rotate-90" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {/* Alternative Industries */}
          {showDetectionInfo && alternativeIndustries.length > 0 && !showSubCategories && (
            <div className="border-t border-white/10 px-4 py-3">
              <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Data may also match:
              </div>
              <div className="flex flex-wrap gap-1">
                {alternativeIndustries.slice(0, 3).map(({ industry, confidence }) => (
                  <button
                    key={industry}
                    onClick={() => handleIndustrySelect(industry)}
                    className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-white/70"
                  >
                    {registry.getPack(industry)?.name} ({Math.round(confidence * 100)}%)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Task 4.4: Updated Sidebar Component

### File: `src/components/Sidebar.tsx` (Update)

```typescript
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  Filter,
  Target,
  Beaker,
  Settings,
  HelpCircle,
  Database,
  Upload,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Layers,
} from 'lucide-react';
import { useProduct, useTerminology } from '@/context/ProductContext';
import { IndustrySelector } from './IndustrySelector';
import { cn } from '@/lib/utils';

// Navigation item definition
interface NavItem {
  id: string;
  label: string;
  terminologyKey?: string; // Optional key for dynamic label
  icon: React.ElementType;
  path: string;
  badge?: string;
}

// Base navigation items (available for all industries)
const BASE_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'retention', label: 'Retention', terminologyKey: 'retention', icon: TrendingUp, path: '/retention' },
  { id: 'users', label: 'Users', terminologyKey: 'user', icon: Users, path: '/users' },
  { id: 'revenue', label: 'Revenue', terminologyKey: 'revenue', icon: DollarSign, path: '/revenue' },
  { id: 'funnels', label: 'Funnels', icon: Filter, path: '/funnels' },
  { id: 'segments', label: 'Segments', icon: PieChart, path: '/segments' },
  { id: 'experiments', label: 'Experiments', icon: Beaker, path: '/experiments' },
];

// Industry-specific nav items
const INDUSTRY_NAV_ITEMS: Record<string, NavItem[]> = {
  gaming: [
    { id: 'levels', label: 'Level Analytics', icon: Layers, path: '/levels' },
    { id: 'meta', label: 'Meta Game', icon: Zap, path: '/meta' },
  ],
  saas: [
    { id: 'mrr', label: 'MRR Analysis', icon: Activity, path: '/mrr' },
    { id: 'trials', label: 'Trial Conversion', icon: Target, path: '/trials' },
  ],
  ecommerce: [
    { id: 'cart', label: 'Cart Analysis', icon: Activity, path: '/cart' },
    { id: 'products', label: 'Products', icon: Layers, path: '/products' },
  ],
};

// Utility nav items
const UTILITY_NAV_ITEMS: NavItem[] = [
  { id: 'data-sources', label: 'Data Sources', icon: Database, path: '/data-sources' },
  { id: 'upload', label: 'Upload Data', icon: Upload, path: '/upload' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { id: 'help', label: 'Help', icon: HelpCircle, path: '/help' },
];

export function Sidebar() {
  const location = useLocation();
  const { selectedIndustry, currentPack } = useProduct();
  const { term, terms } = useTerminology();

  // Get navigation priorities from current pack
  const navPriorities = currentPack?.chartConfigs?.navigationPriorities || [];

  // Build navigation items based on industry
  const mainNavItems = React.useMemo(() => {
    let items = [...BASE_NAV_ITEMS];

    // Add industry-specific items
    if (selectedIndustry && INDUSTRY_NAV_ITEMS[selectedIndustry]) {
      items = [...items, ...INDUSTRY_NAV_ITEMS[selectedIndustry]];
    }

    // Sort by priority if defined
    if (navPriorities.length > 0) {
      items.sort((a, b) => {
        const aIndex = navPriorities.indexOf(a.id);
        const bIndex = navPriorities.indexOf(b.id);

        // Items not in priority list go to the end
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
      });
    }

    return items;
  }, [selectedIndustry, navPriorities]);

  // Get dynamic label for nav item
  const getNavLabel = (item: NavItem): string => {
    if (item.terminologyKey) {
      // Use plural for navigation items
      const dynamicLabel = terms(item.terminologyKey, { capitalize: true });
      if (dynamicLabel !== item.terminologyKey) {
        return dynamicLabel;
      }
    }
    return item.label;
  };

  return (
    <aside className="w-64 h-screen bg-bg-dark border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">
          Product<span className="text-accent-primary">Insights</span>
        </h1>
        <p className="text-xs text-white/50 mt-1">
          {currentPack?.name || 'Multi-Industry'} Analytics
        </p>
      </div>

      {/* Industry Selector */}
      <div className="p-4 border-b border-white/10">
        <IndustrySelector showDetectionInfo compact />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{getNavLabel(item)}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-xs bg-accent-primary/20 text-accent-primary rounded">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-white/10" />

        {/* Utility Navigation */}
        <div className="space-y-1">
          {UTILITY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-white/40">
          v2.0.0 • Multi-Industry Edition
        </div>
      </div>
    </aside>
  );
}
```

---

## Task 4.5: Updated KPICard Component

### File: `src/components/analytics/KPICard.tsx` (Update)

```typescript
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { useTerminology, useIndustryTheme } from '@/context/ProductContext';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface KPICardProps {
  /** KPI identifier */
  id?: string;
  /** Display title (can use terminology keys with $ prefix) */
  title: string;
  /** Primary value to display */
  value: string | number;
  /** Change from previous period */
  change?: number;
  /** Change label (e.g., "vs last week") */
  changeLabel?: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Whether up trend is positive (default: true) */
  upIsGood?: boolean;
  /** Description tooltip */
  description?: string;
  /** Unit suffix (e.g., "%", "K", "$") */
  suffix?: string;
  /** Unit prefix (e.g., "$") */
  prefix?: string;
  /** Icon component */
  icon?: React.ElementType;
  /** Additional className */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
}

export function KPICard({
  id,
  title,
  value,
  change,
  changeLabel = 'vs last period',
  trend,
  upIsGood = true,
  description,
  suffix = '',
  prefix = '',
  icon: Icon,
  className,
  isLoading = false,
}: KPICardProps) {
  const { term } = useTerminology();
  const { primaryColor } = useIndustryTheme();

  // Process title for terminology keys (e.g., "$user Count" -> "Player Count")
  const processedTitle = React.useMemo(() => {
    if (!title.includes('$')) return title;

    return title.replace(/\$(\w+)/g, (_, key) => {
      return term(key, { capitalize: true });
    });
  }, [title, term]);

  // Determine trend direction from change if not provided
  const effectiveTrend = trend || (
    change === undefined ? 'neutral' :
    change > 0 ? 'up' :
    change < 0 ? 'down' :
    'neutral'
  );

  // Determine if the trend is positive or negative
  const isPositive = effectiveTrend === 'up' ? upIsGood : !upIsGood;
  const isNegative = effectiveTrend === 'down' ? upIsGood : !upIsGood;

  // Format change value
  const formattedChange = change !== undefined
    ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    : null;

  // Trend icon
  const TrendIcon = effectiveTrend === 'up'
    ? TrendingUp
    : effectiveTrend === 'down'
    ? TrendingDown
    : Minus;

  if (isLoading) {
    return (
      <div className={cn(
        'bg-bg-card rounded-card p-4 animate-pulse',
        className
      )}>
        <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-8 bg-white/10 rounded w-2/3" />
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-bg-card rounded-card p-4 hover:bg-bg-card-hover transition-colors',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className="w-4 h-4"
              style={{ color: primaryColor }}
            />
          )}
          <span className="text-sm text-white/70">{processedTitle}</span>
        </div>

        {description && (
          <Tooltip content={description}>
            <Info className="w-4 h-4 text-white/40 cursor-help" />
          </Tooltip>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-lg text-white/70">{prefix}</span>}
        <span className="text-2xl font-bold text-white">{value}</span>
        {suffix && <span className="text-lg text-white/70">{suffix}</span>}
      </div>

      {/* Change indicator */}
      {formattedChange && (
        <div className="flex items-center gap-1 mt-2">
          <TrendIcon
            className={cn(
              'w-4 h-4',
              isPositive && 'text-green-400',
              isNegative && 'text-red-400',
              !isPositive && !isNegative && 'text-white/40'
            )}
          />
          <span className={cn(
            'text-sm',
            isPositive && 'text-green-400',
            isNegative && 'text-red-400',
            !isPositive && !isNegative && 'text-white/40'
          )}>
            {formattedChange}
          </span>
          <span className="text-xs text-white/40">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Grid wrapper for KPI cards
 */
interface KPIGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function KPIGrid({ children, columns = 4, className }: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div className={cn(
      'grid gap-4',
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  );
}
```

---

## Task 4.6: Industry Theme Provider

### File: `src/components/IndustryThemeProvider.tsx`

```typescript
import React, { useEffect } from 'react';
import { useProduct } from '@/context/ProductContext';

interface IndustryThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Applies industry-specific theme CSS variables to the document
 */
export function IndustryThemeProvider({ children }: IndustryThemeProviderProps) {
  const { currentPack, getPrimaryColor, getAccentColor, getChartColors } = useProduct();

  useEffect(() => {
    const root = document.documentElement;

    // Apply theme colors as CSS variables
    root.style.setProperty('--industry-primary', getPrimaryColor());
    root.style.setProperty('--industry-accent', getAccentColor());

    const chartColors = getChartColors();
    chartColors.forEach((color, index) => {
      root.style.setProperty(`--industry-chart-${index + 1}`, color);
    });

    // Apply industry-specific class to body
    if (currentPack) {
      document.body.classList.forEach(cls => {
        if (cls.startsWith('industry-')) {
          document.body.classList.remove(cls);
        }
      });
      document.body.classList.add(`industry-${currentPack.id}`);
    }

    return () => {
      // Cleanup on unmount
      root.style.removeProperty('--industry-primary');
      root.style.removeProperty('--industry-accent');
      chartColors.forEach((_, index) => {
        root.style.removeProperty(`--industry-chart-${index + 1}`);
      });
    };
  }, [currentPack, getPrimaryColor, getAccentColor, getChartColors]);

  return <>{children}</>;
}
```

### File: `src/styles/industry-themes.css`

```css
/* Industry Theme CSS Variables */
:root {
  --industry-primary: #8b5cf6;
  --industry-accent: #6366f1;
  --industry-chart-1: #8b5cf6;
  --industry-chart-2: #6366f1;
  --industry-chart-3: #ec4899;
  --industry-chart-4: #06b6d4;
  --industry-chart-5: #22c55e;
  --industry-chart-6: #f97316;
}

/* Gaming Industry Theme */
body.industry-gaming {
  --industry-primary: #8b5cf6;
  --industry-accent: #6366f1;
}

/* SaaS Industry Theme */
body.industry-saas {
  --industry-primary: #3b82f6;
  --industry-accent: #2563eb;
}

/* E-commerce Industry Theme */
body.industry-ecommerce {
  --industry-primary: #22c55e;
  --industry-accent: #16a34a;
}

/* EdTech Industry Theme */
body.industry-edtech {
  --industry-primary: #f59e0b;
  --industry-accent: #d97706;
}

/* Media Industry Theme */
body.industry-media {
  --industry-primary: #ef4444;
  --industry-accent: #dc2626;
}

/* Fintech Industry Theme */
body.industry-fintech {
  --industry-primary: #06b6d4;
  --industry-accent: #0891b2;
}

/* Healthcare Industry Theme */
body.industry-healthcare {
  --industry-primary: #ec4899;
  --industry-accent: #db2777;
}

/* Utility classes using theme variables */
.bg-industry-primary {
  background-color: var(--industry-primary);
}

.text-industry-primary {
  color: var(--industry-primary);
}

.border-industry-primary {
  border-color: var(--industry-primary);
}

.bg-industry-accent {
  background-color: var(--industry-accent);
}

.text-industry-accent {
  color: var(--industry-accent);
}

/* Chart color utilities */
.chart-color-1 { color: var(--industry-chart-1); }
.chart-color-2 { color: var(--industry-chart-2); }
.chart-color-3 { color: var(--industry-chart-3); }
.chart-color-4 { color: var(--industry-chart-4); }
.chart-color-5 { color: var(--industry-chart-5); }
.chart-color-6 { color: var(--industry-chart-6); }

.bg-chart-1 { background-color: var(--industry-chart-1); }
.bg-chart-2 { background-color: var(--industry-chart-2); }
.bg-chart-3 { background-color: var(--industry-chart-3); }
.bg-chart-4 { background-color: var(--industry-chart-4); }
.bg-chart-5 { background-color: var(--industry-chart-5); }
.bg-chart-6 { background-color: var(--industry-chart-6); }
```

---

## Task 4.7: Updated App Layout

### File: `src/App.tsx` (Update)

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Providers
import { DataProvider } from '@/context/DataContext';
import { ProductProvider } from '@/context/ProductContext';
import { IndustryThemeProvider } from '@/components/IndustryThemeProvider';

// Layout Components
import { Sidebar } from '@/components/Sidebar';

// Pages
import Dashboard from '@/pages/Dashboard';
import Analytics from '@/pages/Analytics';
import Retention from '@/pages/Retention';
import Users from '@/pages/Users';
import Revenue from '@/pages/Revenue';
import Funnels from '@/pages/Funnels';
import Segments from '@/pages/Segments';
import Experiments from '@/pages/Experiments';
import DataSources from '@/pages/DataSources';
import Upload from '@/pages/Upload';
import Settings from '@/pages/Settings';
import Help from '@/pages/Help';

// Industry-specific pages (lazy loaded)
const LevelAnalytics = React.lazy(() => import('@/pages/industry/gaming/LevelAnalytics'));
const MetaGame = React.lazy(() => import('@/pages/industry/gaming/MetaGame'));
const MRRAnalysis = React.lazy(() => import('@/pages/industry/saas/MRRAnalysis'));
const TrialConversion = React.lazy(() => import('@/pages/industry/saas/TrialConversion'));
const CartAnalysis = React.lazy(() => import('@/pages/industry/ecommerce/CartAnalysis'));
const Products = React.lazy(() => import('@/pages/industry/ecommerce/Products'));

// Styles
import '@/styles/industry-themes.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-bg-darkest">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
          </div>
        }>
          {children}
        </React.Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <ProductProvider>
          <IndustryThemeProvider>
            <BrowserRouter>
              <AppLayout>
                <Routes>
                  {/* Core Routes */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/retention" element={<Retention />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/revenue" element={<Revenue />} />
                  <Route path="/funnels" element={<Funnels />} />
                  <Route path="/segments" element={<Segments />} />
                  <Route path="/experiments" element={<Experiments />} />

                  {/* Utility Routes */}
                  <Route path="/data-sources" element={<DataSources />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<Help />} />

                  {/* Gaming Industry Routes */}
                  <Route path="/levels" element={<LevelAnalytics />} />
                  <Route path="/meta" element={<MetaGame />} />

                  {/* SaaS Industry Routes */}
                  <Route path="/mrr" element={<MRRAnalysis />} />
                  <Route path="/trials" element={<TrialConversion />} />

                  {/* E-commerce Industry Routes */}
                  <Route path="/cart" element={<CartAnalysis />} />
                  <Route path="/products" element={<Products />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </IndustryThemeProvider>
        </ProductProvider>
      </DataProvider>
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-white/60">Page not found</p>
    </div>
  );
}
```

---

## Task 4.8: Detection Integration in Upload Flow

### File: `src/pages/Upload.tsx` (Update snippet)

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { useProduct } from '@/context/ProductContext';
import { IndustryDetector } from '@/industry/IndustryDetector';
import { DataPipeline } from '@/ai/DataPipeline';
import { IndustrySelector } from '@/components/IndustrySelector';
import { FileUploader } from '@/components/FileUploader';
import { DetectionResults } from '@/components/DetectionResults';

export default function Upload() {
  const navigate = useNavigate();
  const { addData } = useData();
  const { setDetectedIndustry, setIndustry, selectedIndustry } = useProduct();

  const [step, setStep] = useState<'upload' | 'detecting' | 'confirm' | 'processing'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown>[] | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  const handleFileUpload = async (file: File, data: Record<string, unknown>[]) => {
    setUploadedFile(file);
    setParsedData(data);
    setStep('detecting');

    // Run detection
    const detector = new IndustryDetector();
    const pipeline = new DataPipeline();

    // First, analyze schema
    const schemaResult = await pipeline.analyzeSchema(data);

    // Then detect industry
    const detection = detector.detect(schemaResult.columnMeanings);
    setDetectionResult(detection);

    // Set detected industry in context
    setDetectedIndustry(
      detection.primary.industry,
      detection.primary.confidence,
      detection.primary.reasons,
      detection.alternatives
    );

    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!parsedData || !selectedIndustry) return;

    setStep('processing');

    // Process data with selected industry context
    const pipeline = new DataPipeline();
    const result = await pipeline.process(parsedData, { industry: selectedIndustry });

    // Save to data store
    await addData({
      name: uploadedFile?.name || 'Uploaded Data',
      industry: selectedIndustry,
      rawData: parsedData,
      analysisResult: result,
    });

    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Upload Data</h1>

      {step === 'upload' && (
        <FileUploader onUpload={handleFileUpload} />
      )}

      {step === 'detecting' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mb-4" />
          <p className="text-white/60">Analyzing your data...</p>
        </div>
      )}

      {step === 'confirm' && detectionResult && (
        <div className="space-y-6">
          <DetectionResults result={detectionResult} />

          <div className="bg-bg-card rounded-card p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Confirm Industry Type
            </h3>

            <p className="text-white/60 mb-4">
              We detected your data as <strong className="text-white">{detectionResult.primary.industry}</strong>
              with {Math.round(detectionResult.primary.confidence * 100)}% confidence.
              You can change this if needed:
            </p>

            <IndustrySelector showDetectionInfo={false} className="mb-6" />

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
              >
                Continue with {selectedIndustry}
              </button>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
              >
                Upload Different File
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mb-4" />
          <p className="text-white/60">Processing your data...</p>
        </div>
      )}
    </div>
  );
}
```

---

## Task 4.9: Detection Results Component

### File: `src/components/DetectionResults.tsx`

```typescript
import React from 'react';
import { Check, AlertCircle, Sparkles } from 'lucide-react';
import { IndustryRegistry } from '@/industry/IndustryRegistry';
import { cn } from '@/lib/utils';

interface DetectionResultsProps {
  result: {
    primary: {
      industry: string;
      subCategory: string;
      confidence: number;
      reasons: string[];
    };
    alternatives: Array<{
      industry: string;
      confidence: number;
    }>;
    isAmbiguous: boolean;
  };
}

export function DetectionResults({ result }: DetectionResultsProps) {
  const registry = IndustryRegistry.getInstance();
  const primaryPack = registry.getPack(result.primary.industry as any);

  const confidenceLevel =
    result.primary.confidence >= 0.9 ? 'high' :
    result.primary.confidence >= 0.7 ? 'medium' : 'low';

  const confidenceColors = {
    high: 'text-green-400 bg-green-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    low: 'text-orange-400 bg-orange-400/10',
  };

  return (
    <div className="bg-bg-card rounded-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent-primary" />
        <h3 className="text-lg font-medium text-white">Detection Results</h3>
      </div>

      {/* Primary Detection */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-white text-lg font-medium">
            {primaryPack?.name || result.primary.industry}
          </div>
          <div className="text-white/60 text-sm">
            {primaryPack?.subCategories.find(s => s.id === result.primary.subCategory)?.name}
          </div>
        </div>

        <div className={cn(
          'px-3 py-1 rounded-full text-sm font-medium',
          confidenceColors[confidenceLevel]
        )}>
          {Math.round(result.primary.confidence * 100)}% confidence
        </div>
      </div>

      {/* Detection Reasons */}
      <div className="mb-4">
        <div className="text-sm text-white/60 mb-2">Detection signals:</div>
        <div className="space-y-1">
          {result.primary.reasons.slice(0, 5).map((reason, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-white/80">{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ambiguity Warning */}
      {result.isAmbiguous && (
        <div className="flex items-start gap-2 p-3 bg-yellow-400/10 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-yellow-400 font-medium">Ambiguous Detection</div>
            <div className="text-white/60 text-sm">
              Your data shows signals from multiple industries. Please verify the selection.
            </div>
          </div>
        </div>
      )}

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div>
          <div className="text-sm text-white/60 mb-2">Alternative matches:</div>
          <div className="flex flex-wrap gap-2">
            {result.alternatives.map(({ industry, confidence }) => (
              <div
                key={industry}
                className="px-2 py-1 bg-white/5 rounded text-sm text-white/70"
              >
                {registry.getPack(industry as any)?.name || industry} ({Math.round(confidence * 100)}%)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Deliverables Summary

| Component | Status | Description |
|-----------|--------|-------------|
| ProductContext | New | Replaces GameContext with multi-industry support |
| useTerminology | New | Hook for dynamic terminology |
| Term component | New | UI component for terminology rendering |
| IndustrySelector | New | Dropdown for industry/sub-category selection |
| Sidebar | Updated | Industry-aware navigation with dynamic labels |
| KPICard | Updated | Terminology support and theme integration |
| IndustryThemeProvider | New | Applies industry theme CSS variables |
| industry-themes.css | New | CSS variables and utility classes |
| App.tsx | Updated | New provider structure and routes |
| Upload page | Updated | Industry detection integration |
| DetectionResults | New | Shows detection confidence and signals |

---

## Testing Checklist

- [ ] ProductContext provides correct industry state
- [ ] Terminology changes when industry changes
- [ ] IndustrySelector shows detection info correctly
- [ ] Sidebar navigation adapts to selected industry
- [ ] KPICard displays industry-specific terminology
- [ ] Theme colors change per industry
- [ ] Upload flow detects and confirms industry
- [ ] Legacy useGame hook still works (deprecation warning)
- [ ] Routes for industry-specific pages work correctly

---

## Next Phase

**Phase 5** will implement the Plugin & Extension System, allowing users to:
- Install third-party industry packs
- Create custom metrics via formula builder
- Export and share industry pack configurations
