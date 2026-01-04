/**
 * QuickStart Page - Onboarding page for new users
 *
 * Provides options to upload data, connect sources, or try demo mode.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Database,
  Sparkles,
  ArrowRight,
  Gamepad2,
  Building2,
  ShoppingCart,
  Loader2,
} from 'lucide-react';
import { useDemoMode } from '../components/DemoModeProvider';
import { IndustryType } from '../industry/types';
import { cn } from '../lib/utils';

const DEMO_OPTIONS: Array<{
  industry: IndustryType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  metrics: string[];
}> = [
  {
    industry: 'gaming',
    name: 'Mobile Gaming',
    description: 'Puzzle game with retention, levels, and monetization data',
    icon: Gamepad2,
    color: 'purple',
    metrics: ['DAU/MAU', 'D1/D7 Retention', 'ARPDAU', 'Level Completion'],
  },
  {
    industry: 'saas',
    name: 'B2B SaaS',
    description: 'Subscription app with MRR, churn, and feature adoption',
    icon: Building2,
    color: 'blue',
    metrics: ['MRR/ARR', 'Churn Rate', 'NRR', 'Trial Conversion'],
  },
  {
    industry: 'ecommerce',
    name: 'E-commerce',
    description: 'Online store with orders, cart, and customer analytics',
    icon: ShoppingCart,
    color: 'green',
    metrics: ['GMV', 'AOV', 'Cart Abandonment', 'Repeat Purchase'],
  },
];

export default function QuickStart() {
  const navigate = useNavigate();
  const { enableDemo, isLoading } = useDemoMode();
  const [loadingIndustry, setLoadingIndustry] = useState<IndustryType | null>(null);

  const handleDemoStart = async (industry: IndustryType) => {
    setLoadingIndustry(industry);
    try {
      await enableDemo(industry, { rowCount: 10000 });
      navigate('/');
    } finally {
      setLoadingIndustry(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg-darkest flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Product<span className="text-accent-primary">Insights</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            AI-powered analytics that automatically understands your data and provides
            industry-specific insights
          </p>
        </div>

        {/* Main Options Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {/* Upload Data */}
          <button
            onClick={() => navigate('/upload')}
            className="group bg-bg-card rounded-2xl p-6 border border-white/10 hover:border-accent-primary/50 transition-all text-left hover:shadow-lg hover:shadow-accent-primary/5"
          >
            <div className="w-14 h-14 rounded-xl bg-accent-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-accent-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload Your Data</h3>
            <p className="text-white/60 text-sm mb-4">
              CSV, JSON, Excel, or SQLite file. We'll auto-detect your industry and
              suggest visualizations.
            </p>
            <div className="flex items-center text-accent-primary text-sm font-medium">
              Get started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Connect Data Source */}
          <button
            onClick={() => navigate('/data-sources')}
            className="group bg-bg-card rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all text-left hover:shadow-lg hover:shadow-blue-500/5"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Database className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connect Live Source</h3>
            <p className="text-white/60 text-sm mb-4">
              PostgreSQL, Supabase, Firebase, Google Sheets, or REST API integration.
            </p>
            <div className="flex items-center text-blue-400 text-sm font-medium">
              Browse sources <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Try Demo - Teaser */}
          <div className="bg-bg-card rounded-2xl p-6 border border-white/10 text-left">
            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Try Demo Mode</h3>
            <p className="text-white/60 text-sm mb-4">
              Explore with realistic sample data. No signup required.
            </p>
            <div className="flex items-center text-purple-400 text-sm font-medium">
              Select industry below <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>

        {/* Demo Options */}
        <div className="bg-bg-card rounded-2xl p-6 md:p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-xl font-semibold text-white">Quick Demo</h3>
              <p className="text-white/60 text-sm">
                Choose an industry to explore with 10,000 rows of realistic sample data
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {DEMO_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isLoadingThis = loadingIndustry === option.industry;
              const colorClasses = {
                purple: {
                  border: 'border-purple-500/30 hover:border-purple-500/60',
                  bg: 'hover:bg-purple-500/5',
                  icon: 'text-purple-400',
                  button: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300',
                },
                blue: {
                  border: 'border-blue-500/30 hover:border-blue-500/60',
                  bg: 'hover:bg-blue-500/5',
                  icon: 'text-blue-400',
                  button: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300',
                },
                green: {
                  border: 'border-green-500/30 hover:border-green-500/60',
                  bg: 'hover:bg-green-500/5',
                  icon: 'text-green-400',
                  button: 'bg-green-500/20 hover:bg-green-500/30 text-green-300',
                },
              };
              const colors = colorClasses[option.color as keyof typeof colorClasses];

              return (
                <div
                  key={option.industry}
                  className={cn(
                    'p-5 rounded-xl border transition-all',
                    colors.border,
                    colors.bg,
                    isLoading && !isLoadingThis && 'opacity-50'
                  )}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Icon className={cn('w-8 h-8 flex-shrink-0', colors.icon)} />
                    <div>
                      <h4 className="text-white font-medium">{option.name}</h4>
                      <p className="text-white/50 text-sm mt-1">{option.description}</p>
                    </div>
                  </div>

                  {/* Sample metrics */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {option.metrics.map((metric) => (
                      <span
                        key={metric}
                        className="px-2 py-0.5 text-xs bg-white/5 text-white/50 rounded"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDemoStart(option.industry)}
                    disabled={isLoading}
                    className={cn(
                      'w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                      colors.button,
                      isLoading && 'cursor-not-allowed'
                    )}
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Try Demo
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-white/40 text-sm">
            Your data stays on your machine. No server uploads required.
          </p>
          <p className="text-white/30 text-xs">
            ProductInsights supports Gaming, SaaS, E-commerce, and more industries.
          </p>
        </div>
      </div>
    </div>
  );
}
