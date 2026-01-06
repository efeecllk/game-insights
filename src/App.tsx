/**
 * Game Insights Dashboard - Main Application
 * Clean Architecture with SOLID Principles
 *
 * Performance Optimizations:
 * - Code splitting with React.lazy() for heavy pages
 * - Suspense boundaries for loading states
 * - Manual chunks in vite.config.ts for vendor splitting
 *
 * Accessibility Features (Phase 8):
 * - Skip link to main content
 * - Proper landmark regions (main, nav)
 * - Semantic heading hierarchy
 * - Screen reader announcements
 *
 * Error Handling (Phase 8):
 * - ErrorBoundary for catching React errors
 * - ToastProvider for user-friendly notifications
 */

import { useMemo, useState, lazy, Suspense } from 'react';
import { QuickStartCard } from './components/ui/QuickStartCard';
import { ContextualHint } from './components/ui/ContextualHint';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Clock, Target, Gamepad2, Loader2, Sparkles, AlertTriangle, Lightbulb, Info, AlertCircle } from 'lucide-react';
import { GameProvider, useGame } from './context/GameContext';
import { DataProvider } from './context/DataContext';
import { IntegrationProvider } from './context/IntegrationContext';
import { MLProvider } from './context/MLContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { PerformanceProvider } from './context/PerformanceContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Components (always loaded - core UI)
import { Sidebar } from './components/Sidebar';
import { KPICard } from './components/ui/KPICard';
import { GameSelector } from './components/ui/GameSelector';
import { CommandPalette, useCommandPalette } from './components/CommandPalette';
import { ShortcutsModal, useKeyboardShortcuts } from './components/KeyboardShortcuts';
import { WelcomeFlow, useOnboarding } from './components/Onboarding';

// Charts (always loaded - used on main overview)
import { RetentionCurve } from './components/charts/RetentionCurve';
import { FunnelChart } from './components/charts/FunnelChart';
import { RevenueChart } from './components/charts/RevenueChart';
import { SegmentChart } from './components/charts/SegmentChart';

// ML Components
import { MLInsightsPanel } from './components/ml';

// ============================================================================
// Lazy-loaded Pages (Code Splitting)
// All pages are lazy loaded to reduce initial bundle size
// Only the Overview page components are eagerly loaded
// ============================================================================

// All pages lazy loaded for optimal code splitting
const UploadPage = lazy(() => import('./pages/Upload').then(m => ({ default: m.UploadPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));
const GamesPage = lazy(() => import('./pages/Games').then(m => ({ default: m.GamesPage })));

// Heavy pages with complex UI - lazy loaded
const DashboardBuilderPage = lazy(() => import('./pages/DashboardBuilder'));
const ABTestingPage = lazy(() => import('./pages/ABTesting'));
const FunnelBuilderPage = lazy(() => import('./pages/FunnelBuilder'));
const AttributionPage = lazy(() => import('./pages/Attribution'));
const PredictionsPage = lazy(() => import('./pages/Predictions'));

// Analytics pages - lazy loaded (use echarts)
const RealtimePage = lazy(() => import('./pages/Realtime'));
const FunnelsPage = lazy(() => import('./pages/Funnels'));
const MonetizationPage = lazy(() => import('./pages/Monetization'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const DataHubPage = lazy(() => import('./pages/DataHub'));
const TemplatesPage = lazy(() => import('./pages/Templates'));
const WhatIfPage = lazy(() => import('./pages/WhatIf'));
const MLStudioPage = lazy(() => import('./pages/MLStudio'));

// Data & Types
import { createSmartDataProvider, gameCategories } from './lib/dataProviders';
import { useData } from './context/DataContext';

// ============================================================================
// Skip Link Component (Accessibility)
// ============================================================================

/**
 * Skip link for keyboard navigation - allows users to skip to main content
 */
function SkipLink() {
    return (
        <a
            href="#main-content"
            className="skip-link"
        >
            Skip to main content
        </a>
    );
}

// ============================================================================
// Loading Components
// ============================================================================

/**
 * Page loading spinner for Suspense fallback
 */
function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-th-accent-primary animate-spin" aria-hidden="true" />
                <p className="text-sm text-th-text-muted">Loading...</p>
            </div>
        </div>
    );
}

// Icon mapping for KPIs
const iconMap: Record<string, typeof Users> = {
    'Daily Active Users': Users,
    'D1 Retention': TrendingUp,
    'Day 1 Retention': TrendingUp,
    'D30 Retention': TrendingUp,
    'Level 15 Pass Rate': Target,
    'Avg Session Length': Clock,
    'Avg Offline Time': Clock,
    'Sessions/Day': Gamepad2,
    'Matches/Session': Gamepad2,
    'Avg Match Time': Clock,
    'Meta Engagement': Target,
    'IAP Conv Rate': DollarSign,
    'ARPPU': DollarSign,
    'Whale Count': DollarSign,
    'Revenue (Today)': DollarSign,
};

/**
 * Overview Dashboard Page - Obsidian Analytics Design
 *
 * Premium dashboard with:
 * - Cinematic entrance animations
 * - Glassmorphism containers
 * - Luminous accent effects
 * - Refined typography hierarchy
 */

// Animation variants for staggered entrance
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
        },
    },
};

function OverviewPage() {
    const { selectedGame, setSelectedGame } = useGame();
    const { activeGameData, gameDataList } = useData();
    const [showDemoMode, setShowDemoMode] = useState(false);

    // Check if this is a first-time user (no data ever uploaded)
    const isFirstTimeUser = gameDataList.length === 0;

    // Get data provider - uses real data if available, otherwise demo data
    const dataProvider = useMemo(
        () => createSmartDataProvider(selectedGame, activeGameData),
        [selectedGame, activeGameData]
    );

    // Check if using real data
    const isUsingRealData = activeGameData !== null;

    // Get game metadata
    const gameInfo = gameCategories.find((g) => g.id === selectedGame);

    // Fetch data from provider
    const retentionData = dataProvider.getRetentionData();
    const funnelData = dataProvider.getFunnelData();
    const kpiData = dataProvider.getKPIData();
    const revenueData = dataProvider.getRevenueData();
    const segmentData = dataProvider.getSegmentData();

    // Handler for demo mode
    const handleTryDemo = () => {
        setShowDemoMode(true);
    };

    // Chart configurations based on game type
    const chartConfigs = useMemo(() => {
        switch (selectedGame) {
            case 'puzzle':
                return {
                    funnel: { title: 'Level Progression', subtitle: 'Player drop-off by level' },
                    segment: { title: 'Booster Usage', subtitle: 'Most used power-ups' },
                };
            case 'idle':
                return {
                    funnel: { title: 'Prestige Funnel', subtitle: 'How many times players prestige' },
                    segment: { title: 'Time Distribution', subtitle: 'Online vs offline gameplay' },
                };
            case 'battle_royale':
                return {
                    funnel: { title: 'Rank Distribution', subtitle: 'Player skill tiers' },
                    segment: { title: 'Weapon Meta', subtitle: 'Most popular weapons' },
                };
            case 'match3_meta':
                return {
                    funnel: { title: 'Story Progression', subtitle: 'Chapter completion rates' },
                    segment: { title: 'Decoration Styles', subtitle: 'Player preferences' },
                };
            case 'gacha_rpg':
                return {
                    funnel: { title: 'Spender Tiers', subtitle: 'F2P to Whale distribution' },
                    segment: { title: 'Revenue Sources', subtitle: 'Where money comes from' },
                };
            default:
                return {
                    funnel: { title: 'Funnel', subtitle: 'Progression analysis' },
                    segment: { title: 'Segments', subtitle: 'Distribution breakdown' },
                };
        }
    }, [selectedGame]);

    // Show QuickStartCard for first-time users who haven't seen demo yet
    if (isFirstTimeUser && !showDemoMode) {
        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6 max-w-4xl mx-auto"
            >
                <QuickStartCard onTryDemo={handleTryDemo} />

                {/* Brief explanation of what the app does */}
                <motion.div variants={itemVariants} className="text-center">
                    <p className="text-sm text-th-text-muted">
                        Game Insights automatically analyzes retention, funnels, revenue, and player behavior
                    </p>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* First-time demo mode hint */}
            {isFirstTimeUser && showDemoMode && (
                <motion.div variants={itemVariants}>
                    <ContextualHint
                        id="demo-mode-hint"
                        variant="tip"
                        message="You're viewing demo data. Upload your own CSV to see insights from your game."
                        actionText="Upload now"
                        onAction={() => window.location.href = '/upload'}
                    />
                </motion.div>
            )}

            {/* Page Header - Premium gradient styling */}
            <motion.header variants={itemVariants} className="relative">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-4">
                            {/* Animated icon container */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl" />
                                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                    <span className="text-2xl" aria-hidden="true">{gameInfo?.icon}</span>
                                </div>
                            </motion.div>

                            <div>
                                <h1 className="text-2xl font-display font-bold text-th-text-primary flex items-center gap-3">
                                    <span className="text-th-text-primary">
                                        {isUsingRealData ? activeGameData?.name : `${gameInfo?.name} Analytics`}
                                    </span>
                                    {isUsingRealData ? (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.4 }}
                                            className="text-[10px] font-semibold uppercase tracking-wider bg-[#DA7756]/15 text-[#DA7756] px-2.5 py-1 rounded-full border border-[#DA7756]/20"
                                        >
                                            Your Data
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.4 }}
                                            className="text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20"
                                        >
                                            Demo
                                        </motion.span>
                                    )}
                                </h1>
                                <p className="text-sm text-th-text-muted mt-1">
                                    {isUsingRealData
                                        ? `Analyzing ${activeGameData?.rowCount?.toLocaleString() || activeGameData?.rawData?.length?.toLocaleString() || 0} rows of data`
                                        : gameInfo?.description
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DA7756]/10 border border-[#DA7756]/20"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DA7756] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DA7756]" />
                        </span>
                        <span className="text-[11px] font-medium text-[#DA7756] uppercase tracking-wider">Live</span>
                    </motion.div>
                </div>
            </motion.header>

            {/* Game Type Selector */}
            <motion.div variants={itemVariants}>
                <GameSelector selected={selectedGame} onChange={setSelectedGame} />
            </motion.div>

            {/* KPI Grid */}
            <section aria-labelledby="kpi-heading">
                <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiData.map((kpi, index) => (
                        <KPICard
                            key={kpi.label}
                            icon={iconMap[kpi.label] ?? Users}
                            label={kpi.label}
                            value={kpi.value}
                            change={kpi.change}
                            changeType={kpi.changeType}
                            index={index}
                        />
                    ))}
                </div>
            </section>

            {/* ML Insights Panel - Only shown when ML is ready */}
            {isUsingRealData && (
                <motion.section variants={itemVariants} aria-labelledby="ml-insights-heading">
                    <h2 id="ml-insights-heading" className="sr-only">Machine Learning Insights</h2>
                    <MLInsightsPanel compact />
                </motion.section>
            )}

            {/* Charts Row 1 */}
            <motion.section variants={itemVariants} aria-labelledby="charts-heading-1">
                <h2 id="charts-heading-1" className="sr-only">Retention and Funnel Charts</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer title="Retention Curve" subtitle="User retention over time">
                        <RetentionCurve data={retentionData} />
                    </ChartContainer>
                    <ChartContainer title={chartConfigs.funnel.title} subtitle={chartConfigs.funnel.subtitle}>
                        <FunnelChart data={funnelData} config={chartConfigs.funnel} />
                    </ChartContainer>
                </div>
            </motion.section>

            {/* Charts Row 2 */}
            <motion.section variants={itemVariants} aria-labelledby="charts-heading-2">
                <h2 id="charts-heading-2" className="sr-only">Revenue and Segment Charts</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer title="Revenue Trends" subtitle="Daily revenue breakdown">
                        <RevenueChart data={revenueData} />
                    </ChartContainer>
                    <ChartContainer title={chartConfigs.segment.title} subtitle={chartConfigs.segment.subtitle}>
                        <SegmentChart data={segmentData} config={chartConfigs.segment} />
                    </ChartContainer>
                </div>
            </motion.section>

            {/* AI Insights - Premium Section */}
            <motion.section variants={itemVariants} aria-labelledby="insights-heading">
                <AIInsightsSection selectedGame={selectedGame} />
            </motion.section>
        </motion.div>
    );
}

/**
 * Premium Chart Container with glassmorphism
 */
function ChartContainer({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="relative group"
        >
            {/* Hover glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DA7756]/0 via-[#DA7756]/5 to-[#DA7756]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-th-bg-surface  rounded-2xl border border-th-border group-hover:border-th-accent-primary/20 transition-colors duration-300 overflow-hidden shadow-theme-sm">
                {/* Header */}
                <div className="relative px-5 py-4 border-b border-th-border-subtle">
                    <h3 className="text-sm font-semibold text-th-text-primary">{title}</h3>
                    <p className="text-xs text-th-text-muted mt-0.5">{subtitle}</p>
                </div>

                {/* Chart content */}
                <div className="relative p-4">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}

/**
 * AI Insights Section with premium styling
 */
function AIInsightsSection({ selectedGame }: { selectedGame: string }) {
    const insights = useMemo(() => {
        switch (selectedGame) {
            case 'puzzle':
                return [
                    { type: 'warning' as const, message: 'Level 15 has 72% failure rate. Consider adding hints or reducing difficulty.' },
                    { type: 'opportunity' as const, message: 'Booster usage correlates with 2.3x higher D7 retention. Promote early booster trial.' },
                ];
            case 'idle':
                return [
                    { type: 'info' as const, message: '85% of players never prestige. Add tutorial showing prestige benefits.' },
                    { type: 'opportunity' as const, message: 'Peak engagement at 8am and 6pm. Schedule push notifications 30min before.' },
                ];
            case 'battle_royale':
                return [
                    { type: 'warning' as const, message: 'Bottom 50% players in first 3 matches have 68% churn. Improve skill-based matchmaking.' },
                    { type: 'info' as const, message: 'Squad players have 2.1x higher retention than solo. Promote squad features.' },
                ];
            case 'match3_meta':
                return [
                    { type: 'opportunity' as const, message: 'Players who decorate in first session have 2.5x higher D7 retention.' },
                    { type: 'warning' as const, message: 'Chapter 5-7 has 45% story drop-off. Content refresh needed.' },
                ];
            case 'gacha_rpg':
                return [
                    { type: 'critical' as const, message: '8 whale users inactive for 3+ days. Trigger personalized re-engagement.' },
                    { type: 'info' as const, message: 'Limited banners generate 3.2x revenue. Optimal frequency: every 3 weeks.' },
                ];
            default:
                return [];
        }
    }, [selectedGame]);

    return (
        <div className="relative group">
            {/* Subtle hover effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DA7756]/0 via-[#DA7756]/5 to-[#DA7756]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-th-bg-surface  rounded-2xl border border-th-border overflow-hidden shadow-theme-sm">
                {/* Header */}
                <div className="relative px-6 py-4 border-b border-th-border-subtle flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/30 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-th-accent-primary" />
                    </div>
                    <div>
                        <h2 id="insights-heading" className="text-base font-semibold text-th-text-primary">AI Insights</h2>
                        <p className="text-xs text-th-text-muted">Auto-generated recommendations based on your data</p>
                    </div>
                </div>

                {/* Insights list */}
                <div className="relative p-4 space-y-3" role="list" aria-label="AI-generated insights">
                    {insights.map((insight, index) => (
                        <InsightCard key={index} type={insight.type} message={insight.message} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Insight Card Component - Premium styling with animations
 */
function InsightCard({
    type,
    message,
    index = 0,
}: {
    type: 'warning' | 'opportunity' | 'info' | 'critical';
    message: string;
    index?: number;
}) {
    const config = {
        warning: {
            bg: 'bg-amber-500/5',
            border: 'border-amber-500/20',
            icon: AlertTriangle,
            iconColor: 'text-amber-400',
            label: 'Warning',
        },
        opportunity: {
            bg: 'bg-[#DA7756]/5',
            border: 'border-[#DA7756]/20',
            icon: Lightbulb,
            iconColor: 'text-[#DA7756]',
            label: 'Opportunity',
        },
        info: {
            bg: 'bg-[#8F8B82]/5',
            border: 'border-[#8F8B82]/20',
            icon: Info,
            iconColor: 'text-[#8F8B82]',
            label: 'Information',
        },
        critical: {
            bg: 'bg-rose-500/5',
            border: 'border-rose-500/20',
            icon: AlertCircle,
            iconColor: 'text-rose-400',
            label: 'Critical alert',
        },
    };

    const { bg, border, icon: IconComponent, iconColor, label } = config[type];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
            whileHover={{ x: 4 }}
            className={`p-4 rounded-xl border ${bg} ${border}  group cursor-pointer transition-colors duration-200 hover:bg-th-interactive-hover`}
            role="listitem"
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${bg} border ${border}`}>
                    <IconComponent className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <span className="sr-only">{label}: </span>
                    <p className="text-sm text-th-text-secondary leading-relaxed">{message}</p>
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="text-th-text-disabled group-hover:text-th-text-muted transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </motion.div>
            </div>
        </motion.div>
    );
}

/**
 * Placeholder page for other routes
 */
function PlaceholderPage({ title, description, badge }: { title: string; description?: string; badge?: string }) {
    return (
        <div className="space-y-6">
            <header className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-th-text-primary">{title}</h1>
                {badge && (
                    <span className="text-xs font-semibold text-th-accent-primary bg-th-accent-primary-muted border border-th-accent-primary/20 px-2 py-1 rounded">
                        {badge}
                    </span>
                )}
            </header>
            <p className="text-th-text-secondary">{description ?? 'This section is under development'}</p>
            <div className="bg-th-bg-surface  rounded-2xl p-12 border border-th-border flex flex-col items-center justify-center text-center shadow-theme-sm">
                <span className="text-4xl mb-4" aria-hidden="true">🚧</span>
                <p className="text-th-text-secondary font-medium">Coming soon...</p>
                <p className="text-th-text-muted text-sm mt-2">Check back for updates</p>
            </div>
        </div>
    );
}

/**
 * Get page title based on current route
 */
function getPageTitle(pathname: string): string {
    const titles: Record<string, string> = {
        '/': 'Overview',
        '/games': 'Games',
        '/settings': 'Settings',
        '/upload': 'Upload Data',
        '/data-sources': 'Data Sources',
        '/templates': 'Templates',
        '/predictions': 'Predictions',
        '/analytics': 'Analytics',
        '/realtime': 'Realtime',
        '/dashboards': 'Dashboards',
        '/funnels': 'Funnels',
        '/monetization': 'Monetization',
        '/ab-testing': 'A/B Testing',
        '/attribution': 'Attribution',
        '/what-if': 'What-If Analysis',
        '/ml-studio': 'ML Studio',
    };
    return titles[pathname] || 'Page';
}

/**
 * App Content with Keyboard Shortcuts
 */
function AppContent() {
    const commandPalette = useCommandPalette();
    const [showShortcuts, setShowShortcuts] = useState(false);
    const { hasCompleted: hasOnboarded } = useOnboarding();
    const [showOnboarding, setShowOnboarding] = useState(!hasOnboarded);
    const location = useLocation();

    // Initialize keyboard shortcuts
    useKeyboardShortcuts({
        onOpenCommandPalette: commandPalette.open,
        onOpenShortcuts: () => setShowShortcuts(true),
    });

    const pageTitle = getPageTitle(location.pathname);

    // Don't render dashboard when onboarding is active
    if (showOnboarding) {
        return (
            <WelcomeFlow
                onComplete={() => setShowOnboarding(false)}
                onSkip={() => {
                    localStorage.setItem('game-insights-onboarded', 'true');
                    setShowOnboarding(false);
                }}
            />
        );
    }

    return (
        <>
            {/* Skip Link for Keyboard Navigation */}
            <SkipLink />

            <div className="min-h-screen bg-th-bg-base flex">
                {/* Sidebar Navigation */}
                <Sidebar />

                {/* Main Content Area */}
                <main
                    id="main-content"
                    className="flex-1 ml-[220px] p-6"
                    tabIndex={-1}
                    aria-label={pageTitle + ' - Main content'}
                >
                    <Routes>
                        {/* Overview - core route, eagerly loaded */}
                        <Route path="/" element={<OverviewPage />} />

                        {/* Lazy-loaded routes wrapped in Suspense */}
                        <Route path="/games" element={
                            <Suspense fallback={<PageLoader />}>
                                <GamesPage />
                            </Suspense>
                        } />
                        <Route path="/settings" element={
                            <Suspense fallback={<PageLoader />}>
                                <SettingsPage />
                            </Suspense>
                        } />
                        <Route path="/upload" element={
                            <Suspense fallback={<PageLoader />}>
                                <UploadPage />
                            </Suspense>
                        } />

                        {/* Lazy-loaded routes wrapped in Suspense */}
                        <Route path="/data-sources" element={
                            <Suspense fallback={<PageLoader />}>
                                <DataHubPage />
                            </Suspense>
                        } />
                        <Route path="/integrations" element={
                            <Suspense fallback={<PageLoader />}>
                                <DataHubPage />
                            </Suspense>
                        } />
                        <Route path="/templates" element={
                            <Suspense fallback={<PageLoader />}>
                                <TemplatesPage />
                            </Suspense>
                        } />
                        <Route path="/predictions" element={
                            <Suspense fallback={<PageLoader />}>
                                <PredictionsPage />
                            </Suspense>
                        } />
                        <Route path="/analytics" element={
                            <Suspense fallback={<PageLoader />}>
                                <AnalyticsPage />
                            </Suspense>
                        } />
                        <Route path="/realtime" element={
                            <Suspense fallback={<PageLoader />}>
                                <RealtimePage />
                            </Suspense>
                        } />
                        <Route path="/dashboards" element={
                            <Suspense fallback={<PageLoader />}>
                                <DashboardBuilderPage />
                            </Suspense>
                        } />
                        <Route path="/explore" element={<PlaceholderPage title="Explore" description="Query builder and data exploration" />} />
                        <Route path="/funnels" element={
                            <Suspense fallback={<PageLoader />}>
                                <FunnelsPage />
                            </Suspense>
                        } />
                        <Route path="/funnel-builder" element={
                            <Suspense fallback={<PageLoader />}>
                                <FunnelBuilderPage />
                            </Suspense>
                        } />
                        <Route path="/engagement" element={<PlaceholderPage title="Engagement" description="User engagement metrics" />} />
                        <Route path="/distributions" element={<PlaceholderPage title="Distributions" description="Data distribution analysis" badge="Beta" />} />
                        <Route path="/health" element={<PlaceholderPage title="Health" description="SDK health and error tracking" />} />
                        <Route path="/monetization" element={
                            <Suspense fallback={<PageLoader />}>
                                <MonetizationPage />
                            </Suspense>
                        } />
                        <Route path="/user-analysis" element={<PlaceholderPage title="User Analysis" description="Cohort and segment analysis" />} />
                        <Route path="/attribution" element={
                            <Suspense fallback={<PageLoader />}>
                                <AttributionPage />
                            </Suspense>
                        } />
                        <Route path="/remote-configs" element={<PlaceholderPage title="Remote Configs" description="Feature flags and configuration" />} />
                        <Route path="/ab-testing" element={
                            <Suspense fallback={<PageLoader />}>
                                <ABTestingPage />
                            </Suspense>
                        } />
                        <Route path="/what-if" element={
                            <Suspense fallback={<PageLoader />}>
                                <WhatIfPage />
                            </Suspense>
                        } />
                        <Route path="/ml-studio" element={
                            <Suspense fallback={<PageLoader />}>
                                <MLStudioPage />
                            </Suspense>
                        } />
                    </Routes>
                </main>
            </div>

            {/* Command Palette */}
            <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />

            {/* Keyboard Shortcuts Modal */}
            <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </>
    );
}

/**
 * Main App Component
 * Wrapped with ErrorBoundary and ToastProvider for enhanced error handling
 */
function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <PerformanceProvider>
                    <ToastProvider position="bottom-right" maxToasts={5}>
                        <DataProvider>
                            <MLProvider>
                                <IntegrationProvider>
                                    <GameProvider>
                                        <AppContent />
                                    </GameProvider>
                                </IntegrationProvider>
                            </MLProvider>
                        </DataProvider>
                    </ToastProvider>
                </PerformanceProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
