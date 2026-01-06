/**
 * Product Context - Multi-industry product analytics context
 *
 * Manages the selected industry, sub-category, and provides
 * industry-specific terminology, metrics, and theme.
 *
 * Replaces GameContext with industry-agnostic approach.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  IndustryType,
  IndustryPack,
  TerminologyMap,
  IndustryTheme,
  MetricDefinition,
  FunnelTemplate,
} from '../industry/types';
import { getIndustryRegistry } from '../industry/IndustryRegistry';
import { registerBuiltInPacks } from '../industry/packs';
import { useData } from './DataContext';

/**
 * Product context state and actions
 */
interface ProductContextType {
  // Current selection
  selectedIndustry: IndustryType;
  selectedSubCategory: string | null;
  isAutoDetected: boolean;
  detectionConfidence: number;

  // Actions
  setIndustry: (industry: IndustryType, subCategory?: string) => void;
  setSubCategory: (subCategory: string) => void;
  setAutoDetect: (enabled: boolean) => void;

  // Industry pack access
  currentPack: IndustryPack | null;
  terminology: TerminologyMap;
  theme: IndustryTheme | null;
  metrics: MetricDefinition[];
  funnels: FunnelTemplate[];

  // Registry access
  availableIndustries: IndustryType[];
  getPack: (industry: IndustryType) => IndustryPack | undefined;

  // Terminology helpers
  t: (key: string, count?: number) => string;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Default theme fallback
const DEFAULT_THEME: IndustryTheme = {
  primaryColor: '#8b5cf6',
  accentColor: '#6366f1',
  chartColors: ['#8b5cf6', '#6366f1', '#ec4899', '#06b6d4', '#22c55e', '#f97316'],
};

// Default terminology fallback
const DEFAULT_TERMINOLOGY: TerminologyMap = {
  user: { singular: 'User', plural: 'Users' },
  session: { singular: 'Session', plural: 'Sessions' },
  conversion: { singular: 'Conversion', plural: 'Conversions' },
  revenue: { singular: 'Revenue', plural: 'Revenue' },
};

interface ProductProviderProps {
  children: ReactNode;
  defaultIndustry?: IndustryType;
}

export function ProductProvider({
  children,
  defaultIndustry = 'gaming',
}: ProductProviderProps) {
  const registry = useMemo(() => getIndustryRegistry(), []);
  const { activeGameData } = useData();

  // Initialize built-in packs on mount
  useEffect(() => {
    registerBuiltInPacks();
  }, []);

  // State
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(defaultIndustry);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [isAutoDetected, setAutoDetect] = useState(true);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [availableIndustries, setAvailableIndustries] = useState<IndustryType[]>([]);

  // Track registry changes
  useEffect(() => {
    const updateIndustries = () => {
      setAvailableIndustries(registry.getRegisteredIndustries());
    };

    updateIndustries();

    const unsubscribe = registry.subscribe(() => {
      updateIndustries();
    });

    return unsubscribe;
  }, [registry]);

  // Sync with uploaded data detection
  useEffect(() => {
    if (!isAutoDetected || !activeGameData) return;

    // Check if data has detected industry info
    const dataIndustry = (activeGameData as any).industry as IndustryType | undefined;
    const dataSubCategory = (activeGameData as any).subCategory as string | undefined;
    const confidence = (activeGameData as any).detectionConfidence as number | undefined;

    if (dataIndustry && registry.hasPack(dataIndustry)) {
      if (dataIndustry !== selectedIndustry) {
        setSelectedIndustry(dataIndustry);
      }
      if (dataSubCategory !== selectedSubCategory) {
        setSelectedSubCategory(dataSubCategory || null);
      }
      if (confidence !== undefined) {
        setDetectionConfidence(confidence);
      }
    } else if (activeGameData?.type) {
      // Legacy GameCategory support - map to gaming industry
      setSelectedIndustry('gaming');
      setSelectedSubCategory(activeGameData.type);
      setDetectionConfidence(0.8);
    }
  }, [activeGameData, isAutoDetected, registry, selectedIndustry, selectedSubCategory]);

  // Get current pack
  const currentPack = useMemo(() => {
    return registry.getPack(selectedIndustry) || null;
  }, [registry, selectedIndustry]);

  // Get terminology with fallback
  const terminology = useMemo(() => {
    return currentPack?.terminology || DEFAULT_TERMINOLOGY;
  }, [currentPack]);

  // Get theme with fallback
  const theme = useMemo(() => {
    return currentPack?.theme || DEFAULT_THEME;
  }, [currentPack]);

  // Get metrics for current industry/subcategory
  const metrics = useMemo(() => {
    return registry.getMetrics(selectedIndustry, selectedSubCategory || undefined);
  }, [registry, selectedIndustry, selectedSubCategory]);

  // Get funnels for current industry/subcategory
  const funnels = useMemo(() => {
    return registry.getFunnels(selectedIndustry, selectedSubCategory || undefined);
  }, [registry, selectedIndustry, selectedSubCategory]);

  // Set industry with optional subcategory
  const setIndustry = useCallback(
    (industry: IndustryType, subCategory?: string) => {
      setSelectedIndustry(industry);
      setSelectedSubCategory(subCategory || null);
      setDetectionConfidence(1); // Manual selection = 100% confidence
      setAutoDetect(false); // Disable auto-detect on manual selection
    },
    []
  );

  // Set just subcategory
  const setSubCategory = useCallback((subCategory: string) => {
    setSelectedSubCategory(subCategory);
  }, []);

  // Terminology helper - get term with optional pluralization
  const t = useCallback(
    (key: string, count?: number): string => {
      const term = terminology[key];
      if (!term) return key;

      if (count === undefined || count === 1) {
        return term.singular;
      }
      return term.plural;
    },
    [terminology]
  );

  // Get pack by industry ID
  const getPack = useCallback(
    (industry: IndustryType) => {
      return registry.getPack(industry);
    },
    [registry]
  );

  const value: ProductContextType = {
    selectedIndustry,
    selectedSubCategory,
    isAutoDetected,
    detectionConfidence,
    setIndustry,
    setSubCategory,
    setAutoDetect,
    currentPack,
    terminology,
    theme,
    metrics,
    funnels,
    availableIndustries,
    getPack,
    t,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

/**
 * Hook to access product context
 */
export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

/**
 * Legacy hook for backward compatibility with GameContext
 * @deprecated Use useProduct instead
 */
export function useGame() {
  const product = useProduct();

  // Map to old GameContext interface
  return {
    selectedGame: product.selectedSubCategory || product.selectedIndustry,
    setSelectedGame: (game: string) => {
      // Try to find if it's a subcategory of gaming
      const gamingPack = product.getPack('gaming');
      const isGamingSubCategory = gamingPack?.subCategories.some((sc) => sc.id === game);

      if (isGamingSubCategory) {
        product.setIndustry('gaming', game);
      } else {
        product.setIndustry(game as IndustryType);
      }
    },
    isAutoSynced: product.isAutoDetected,
    setAutoSync: product.setAutoDetect,
  };
}
