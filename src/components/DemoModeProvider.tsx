/**
 * DemoModeProvider - Context for managing demo mode state
 *
 * Provides synthetic data generation and demo mode status
 * across the application.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { IndustryType } from '../industry/types';
import { createDataGenerator, GeneratorConfig } from '../generators';

interface DemoModeState {
  isDemoMode: boolean;
  demoIndustry: IndustryType | null;
  demoData: Record<string, unknown>[] | null;
  isLoading: boolean;
  error: string | null;
  enableDemo: (industry: IndustryType, options?: DemoOptions) => Promise<void>;
  disableDemo: () => void;
}

interface DemoOptions {
  rowCount?: number;
  subCategory?: string;
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
  const [error, setError] = useState<string | null>(null);

  const enableDemo = useCallback(
    async (industry: IndustryType, options?: DemoOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const config: GeneratorConfig = {
          industry,
          subCategory: options?.subCategory,
          rowCount: options?.rowCount || 10000,
          dateRange: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
            end: new Date(),
          },
          seed: 42, // Consistent demo data
        };

        const generator = createDataGenerator(config);
        const data = generator.generate();

        setDemoData(data);
        setDemoIndustry(industry);
        setIsDemoMode(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate demo data');
        console.error('Demo generation error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const disableDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoIndustry(null);
    setDemoData(null);
    setError(null);
  }, []);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        demoIndustry,
        demoData,
        isLoading,
        error,
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

/**
 * DemoBanner - Shows demo mode status
 */
export function DemoBanner() {
  const { isDemoMode, demoIndustry, disableDemo } = useDemoMode();

  if (!isDemoMode) return null;

  const industryNames: Record<IndustryType, string> = {
    gaming: 'Gaming',
    saas: 'SaaS',
    ecommerce: 'E-commerce',
    edtech: 'EdTech',
    media: 'Media',
    fintech: 'Fintech',
    healthcare: 'Healthcare',
    custom: 'Custom',
  };

  return (
    <div className="bg-gradient-to-r from-accent-primary/20 to-purple-500/20 border-b border-accent-primary/30">
      <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <svg
            className="w-4 h-4 text-accent-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <span className="text-white">
            <strong>Demo Mode:</strong> Viewing sample{' '}
            <span className="capitalize">{demoIndustry && industryNames[demoIndustry]}</span> data
          </span>
          <span className="text-white/60">•</span>
          <span className="text-white/60">
            This is synthetic data for demonstration purposes
          </span>
        </div>

        <button
          onClick={disableDemo}
          className="flex items-center gap-1 px-2 py-1 text-sm text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Exit Demo
        </button>
      </div>
    </div>
  );
}

export default DemoModeProvider;
