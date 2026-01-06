/**
 * QuickStart Page - Obsidian Analytics Design
 *
 * Premium onboarding experience with:
 * - Glassmorphism cards
 * - Animated entrance effects
 * - Claude warm orange accent theme
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  Database,
  Sparkles,
  ArrowRight,
  Gamepad2,
  Building2,
  ShoppingCart,
  Loader2,
  Zap,
} from 'lucide-react';
import { useDemoMode } from '../components/DemoModeProvider';
import { IndustryType } from '../industry/types';
import { cn } from '../lib/utils';

// ============================================================================
// Types & Constants
// ============================================================================

const DEMO_OPTIONS: Array<{
  industry: IndustryType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: 'orange' | 'blue' | 'amber';
  metrics: string[];
}> = [
  {
    industry: 'gaming',
    name: 'Mobile Gaming',
    description: 'Puzzle game with retention, levels, and monetization data',
    icon: Gamepad2,
    color: 'orange',
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
    color: 'amber',
    metrics: ['GMV', 'AOV', 'Cart Abandonment', 'Repeat Purchase'],
  },
];

const COLOR_CLASSES = {
  orange: {
    border: 'border-[#DA7756]/20 hover:border-[#DA7756]/40',
    bg: 'hover:bg-[#DA7756]/5',
    icon: 'text-[#DA7756]',
    iconBg: 'bg-[#DA7756]/10 border-[#DA7756]/20',
    button: 'bg-[#DA7756]/20 hover:bg-[#DA7756]/30 text-[#DA7756] border-[#DA7756]/30',
    glow: 'group-hover:shadow-[#DA7756]/10',
  },
  blue: {
    border: 'border-[#8F8B82]/20 hover:border-[#8F8B82]/40',
    bg: 'hover:bg-[#8F8B82]/5',
    icon: 'text-[#8F8B82]',
    iconBg: 'bg-[#8F8B82]/10 border-[#8F8B82]/20',
    button: 'bg-[#8F8B82]/20 hover:bg-[#8F8B82]/30 text-[#8F8B82] border-[#8F8B82]/30',
    glow: 'group-hover:shadow-[#8F8B82]/10',
  },
  amber: {
    border: 'border-amber-500/20 hover:border-amber-500/40',
    bg: 'hover:bg-amber-500/5',
    icon: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    button: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30',
    glow: 'group-hover:shadow-amber-500/10',
  },
};

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};

// ============================================================================
// Component
// ============================================================================

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

      {/* Decorative glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#DA7756]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C15F3C]/5 rounded-full blur-3xl" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative max-w-5xl w-full"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DA7756]/10 border border-[#DA7756]/20 mb-6">
            <Zap className="w-4 h-4 text-[#DA7756]" />
            <span className="text-sm font-medium text-[#DA7756]">AI-Powered Analytics</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-[#DA7756] via-[#E8956A] to-[#C15F3C] bg-clip-text text-transparent">
              Game Insights
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AI-powered analytics that automatically understands your data and provides
            industry-specific insights in seconds
          </p>
        </motion.div>

        {/* Main Options Grid */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {/* Upload Data */}
          <motion.button
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
            onClick={() => navigate('/upload')}
            className="group relative text-left"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DA7756]/0 via-[#DA7756]/10 to-[#DA7756]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] group-hover:border-[#DA7756]/30 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-[#DA7756]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Upload Your Data</h3>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                  CSV, JSON, Excel, or SQLite file. We'll auto-detect your industry and
                  suggest visualizations.
                </p>
                <div className="flex items-center text-[#DA7756] text-sm font-medium">
                  Get started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.button>

          {/* Connect Data Source */}
          <motion.button
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
            onClick={() => navigate('/data-sources')}
            className="group relative text-left"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8F8B82]/0 via-[#8F8B82]/10 to-[#8F8B82]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] group-hover:border-[#8F8B82]/30 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-[#8F8B82]/10 border border-[#8F8B82]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Database className="w-7 h-7 text-[#8F8B82]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Connect Live Source</h3>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                  PostgreSQL, Supabase, Firebase, Google Sheets, or REST API integration.
                </p>
                <div className="flex items-center text-[#8F8B82] text-sm font-medium">
                  Browse sources <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.button>

          {/* Try Demo - Teaser */}
          <motion.div
            variants={cardVariants}
            className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-[#C15F3C]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Try Demo Mode</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Explore with realistic sample data. No signup required.
              </p>
              <div className="flex items-center text-[#C15F3C] text-sm font-medium">
                Select industry below <ArrowRight className="w-4 h-4 ml-1 animate-bounce-x" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Demo Options Panel */}
        <motion.div
          variants={cardVariants}
          className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/[0.06] overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#C15F3C]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Quick Demo</h3>
                <p className="text-slate-500 text-sm">
                  Choose an industry to explore with 10,000 rows of realistic sample data
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {DEMO_OPTIONS.map((option, index) => {
                const Icon = option.icon;
                const isLoadingThis = loadingIndustry === option.industry;
                const colors = COLOR_CLASSES[option.color];

                return (
                  <motion.div
                    key={option.industry}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                    className={cn(
                      'group p-5 rounded-xl border transition-all duration-300',
                      colors.border,
                      colors.bg,
                      isLoading && !isLoadingThis && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0', colors.iconBg)}>
                        <Icon className={cn('w-5 h-5', colors.icon)} />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{option.name}</h4>
                        <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{option.description}</p>
                      </div>
                    </div>

                    {/* Sample metrics */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {option.metrics.map((metric) => (
                        <span
                          key={metric}
                          className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-white/[0.03] text-slate-500 rounded border border-white/[0.06]"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDemoStart(option.industry)}
                      disabled={isLoading}
                      className={cn(
                        'w-full py-2.5 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2',
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
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center mt-10 space-y-2">
          <p className="text-slate-500 text-sm">
            Your data stays on your machine. No server uploads required.
          </p>
          <p className="text-slate-600 text-xs">
            Game Insights supports Gaming, SaaS, E-commerce, and more industries.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
