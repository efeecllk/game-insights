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
import { Routes, Route, useLocation } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, Clock, Target, Gamepad2, Loader2 } from 'lucide-react';
import { GameProvider, useGame } from './context/GameContext';
import { DataProvider } from './context/DataContext';
import { IntegrationProvider } from './context/IntegrationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
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

// ============================================================================
// Lazy-loaded Pages (Code Splitting)
// Heavy pages that are not needed on initial load
// ============================================================================

// Core pages (loaded immediately)
import { UploadPage } from './pages/Upload';
import { SettingsPage } from './pages/Settings';
import { GamesPage } from './pages/Games';

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

// Data & Types
import { createDataProvider, gameCategories } from './lib/dataProviders';

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
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-th-accent-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-th-bg-base"
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
                <Loader2 className="w-8 h-8 text-accent-primary animate-spin" aria-hidden="true" />
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
 * Overview Dashboard Page
 * Dynamically renders charts based on selected game type
 */
function OverviewPage() {
    const { selectedGame, setSelectedGame } = useGame();

    // Get data provider based on selected game (Dependency Inversion)
    const dataProvider = useMemo(
        () => createDataProvider(selectedGame),
        [selectedGame]
    );

    // Get game metadata
    const gameInfo = gameCategories.find((g) => g.id === selectedGame);

    // Fetch data from provider
    const retentionData = dataProvider.getRetentionData();
    const funnelData = dataProvider.getFunnelData();
    const kpiData = dataProvider.getKPIData();
    const revenueData = dataProvider.getRevenueData();
    const segmentData = dataProvider.getSegmentData();

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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-th-text-primary flex items-center gap-3">
                        <span aria-hidden="true">{gameInfo?.icon}</span>
                        {gameInfo?.name} Analytics
                    </h1>
                    <p className="text-th-text-muted mt-1">{gameInfo?.description}</p>
                </div>
            </header>

            {/* Game Type Selector */}
            <GameSelector selected={selectedGame} onChange={setSelectedGame} />

            {/* KPI Grid */}
            <section aria-labelledby="kpi-heading">
                <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiData.map((kpi) => (
                        <KPICard
                            key={kpi.label}
                            icon={iconMap[kpi.label] ?? Users}
                            label={kpi.label}
                            value={kpi.value}
                            change={kpi.change}
                            changeType={kpi.changeType}
                        />
                    ))}
                </div>
            </section>

            {/* Charts Row 1 */}
            <section aria-labelledby="charts-heading-1">
                <h2 id="charts-heading-1" className="sr-only">Retention and Funnel Charts</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RetentionCurve data={retentionData} />
                    <FunnelChart data={funnelData} config={chartConfigs.funnel} />
                </div>
            </section>

            {/* Charts Row 2 */}
            <section aria-labelledby="charts-heading-2">
                <h2 id="charts-heading-2" className="sr-only">Revenue and Segment Charts</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueChart data={revenueData} />
                    <SegmentChart data={segmentData} config={chartConfigs.segment} />
                </div>
            </section>

            {/* AI Insights */}
            <section 
                aria-labelledby="insights-heading"
                className="bg-th-bg-surface rounded-card p-6 border border-th-border-subtle"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-th-accent-primary-muted flex items-center justify-center" aria-hidden="true">
                        <span className="text-xl">🧠</span>
                    </div>
                    <div>
                        <h2 id="insights-heading" className="text-lg font-semibold text-th-text-primary">AI Insights</h2>
                        <p className="text-sm text-th-text-muted">Auto-generated recommendations</p>
                    </div>
                </div>
                <div className="space-y-3" role="list" aria-label="AI-generated insights">
                    {selectedGame === 'puzzle' && (
                        <>
                            <InsightCard type="warning" message="Level 15 has 72% failure rate. Consider adding hints or reducing difficulty." />
                            <InsightCard type="opportunity" message="Booster usage correlates with 2.3x higher D7 retention. Promote early booster trial." />
                        </>
                    )}
                    {selectedGame === 'idle' && (
                        <>
                            <InsightCard type="info" message="85% of players never prestige. Add tutorial showing prestige benefits." />
                            <InsightCard type="opportunity" message="Peak engagement at 8am and 6pm. Schedule push notifications 30min before." />
                        </>
                    )}
                    {selectedGame === 'battle_royale' && (
                        <>
                            <InsightCard type="warning" message="Bottom 50% players in first 3 matches have 68% churn. Improve skill-based matchmaking." />
                            <InsightCard type="info" message="Squad players have 2.1x higher retention than solo. Promote squad features." />
                        </>
                    )}
                    {selectedGame === 'match3_meta' && (
                        <>
                            <InsightCard type="opportunity" message="Players who decorate in first session have 2.5x higher D7 retention." />
                            <InsightCard type="warning" message="Chapter 5-7 has 45% story drop-off. Content refresh needed." />
                        </>
                    )}
                    {selectedGame === 'gacha_rpg' && (
                        <>
                            <InsightCard type="critical" message="8 whale users inactive for 3+ days. Trigger personalized re-engagement." />
                            <InsightCard type="info" message="Limited banners generate 3.2x revenue. Optimal frequency: every 3 weeks." />
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

/**
 * Insight Card Component
 */
function InsightCard({
    type,
    message
}: {
    type: 'warning' | 'opportunity' | 'info' | 'critical';
    message: string;
}) {
    const styles = {
        warning: 'bg-th-warning-muted border-th-warning/20 text-th-warning',
        opportunity: 'bg-th-success-muted border-th-success/20 text-th-success',
        info: 'bg-th-info-muted border-th-info/20 text-th-info',
        critical: 'bg-th-error-muted border-th-error/20 text-th-error',
    };

    const icons = {
        warning: '⚠️',
        opportunity: '💡',
        info: 'ℹ️',
        critical: '🚨',
    };

    const labels = {
        warning: 'Warning',
        opportunity: 'Opportunity',
        info: 'Information',
        critical: 'Critical alert',
    };

    return (
        <div className={`p-4 rounded-xl border ${styles[type]}`} role="listitem">
            <div className="flex items-start gap-3">
                <span className="text-lg" aria-hidden="true">{icons[type]}</span>
                <div>
                    <span className="sr-only">{labels[type]}: </span>
                    <p className="text-sm text-th-text-secondary">{message}</p>
                </div>
            </div>
        </div>
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
                    <span className="text-xs font-semibold text-th-accent-primary bg-th-accent-primary-muted px-2 py-1 rounded">
                        {badge}
                    </span>
                )}
            </header>
            <p className="text-th-text-muted">{description ?? 'This section is under development'}</p>
            <div className="bg-th-bg-surface rounded-xl p-12 border border-th-border-subtle flex flex-col items-center justify-center text-center">
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

    return (
        <>
            {/* Skip Link for Keyboard Navigation */}
            <SkipLink />

            {/* Onboarding Flow */}
            {showOnboarding && (
                <WelcomeFlow
                    onComplete={() => setShowOnboarding(false)}
                    onSkip={() => {
                        localStorage.setItem('game-insights-onboarded', 'true');
                        setShowOnboarding(false);
                    }}
                />
            )}

            <div className="min-h-screen bg-th-bg-base flex">
                {/* Sidebar Navigation */}
                <Sidebar />

                {/* Main Content Area */}
                <main 
                    id="main-content" 
                    className="flex-1 ml-[200px] p-6"
                    tabIndex={-1}
                    aria-label={pageTitle + ' - Main content'}
                >
                    <Routes>
                        {/* Core routes - not lazy loaded */}
                        <Route path="/" element={<OverviewPage />} />
                        <Route path="/games" element={<GamesPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/upload" element={<UploadPage />} />

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
                <ToastProvider position="bottom-right" maxToasts={5}>
                    <DataProvider>
                        <IntegrationProvider>
                            <GameProvider>
                                <AppContent />
                            </GameProvider>
                        </IntegrationProvider>
                    </DataProvider>
                </ToastProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
