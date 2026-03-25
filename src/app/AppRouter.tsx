import { lazy, memo, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    AlertTriangle,
    Clock,
    DollarSign,
    Gamepad2,
    Info,
    Lightbulb,
    Loader2,
    Sparkles,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { KPICard } from '../components/ui/KPICard';
import { GameSelector } from '../components/ui/GameSelector';
import { QuickStartCard } from '../components/ui/QuickStartCard';
import { ContextualHint } from '../components/ui/ContextualHint';
import { useAnalytics, useCommandPalette, useKeyboardShortcuts, useOnboarding, useSidebarSettings } from '../hooks';
import { useData } from '../context/DataContext';
import { useGame } from '../context/GameContext';
import { createSmartDataProvider, gameCategories } from '../lib/dataProviders';

const CommandPalette = lazy(() => import('../components/CommandPalette'));
const ShortcutsModal = lazy(() => import('../components/KeyboardShortcuts'));
const WelcomeFlow = lazy(() => import('../components/Onboarding'));
const RetentionCurve = lazy(() => import('../components/charts/RetentionCurve').then((m) => ({ default: m.RetentionCurve })));
const FunnelChart = lazy(() => import('../components/charts/FunnelChart').then((m) => ({ default: m.FunnelChart })));
const RevenueChart = lazy(() => import('../components/charts/RevenueChart').then((m) => ({ default: m.RevenueChart })));
const SegmentChart = lazy(() => import('../components/charts/SegmentChart').then((m) => ({ default: m.SegmentChart })));

const UploadPage = lazy(() => import('../pages/Upload').then((m) => ({ default: m.UploadPage })));
const SettingsPage = lazy(() => import('../pages/Settings').then((m) => ({ default: m.SettingsPage })));
const GamesPage = lazy(() => import('../pages/Games').then((m) => ({ default: m.GamesPage })));
const DashboardBuilderPage = lazy(() => import('../pages/DashboardBuilder'));
const AIAnalyticsPage = lazy(() => import('../pages/AIAnalytics'));
const FunnelsPage = lazy(() => import('../pages/Funnels'));
const MonetizationPage = lazy(() => import('../pages/Monetization'));
const LandingPage = lazy(() => import('../pages/Landing'));

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

const dashboardRoutes = [
    { path: '/', element: <OverviewPage /> },
    { path: '/upload', element: <UploadPage /> },
    { path: '/games', element: <GamesPage /> },
    { path: '/analytics', element: <AIAnalyticsPage /> },
    { path: '/funnels', element: <FunnelsPage /> },
    { path: '/monetization', element: <MonetizationPage /> },
    { path: '/dashboards', element: <DashboardBuilderPage /> },
    { path: '/dashboards/:id', element: <DashboardBuilderPage /> },
    { path: '/settings', element: <SettingsPage /> },
] as const;

function withPageLoader(element: JSX.Element) {
    return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

function SkipLink() {
    return (
        <a href="#main-content" className="skip-link">
            Skip to main content
        </a>
    );
}

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

function ChartLoader() {
    return (
        <div className="flex items-center justify-center h-[280px]" role="status">
            <Loader2 className="w-6 h-6 text-th-text-muted animate-spin" aria-hidden="true" />
        </div>
    );
}

function getPageTitle(pathname: string): string {
    const titles: Record<string, string> = {
        '/': 'Overview',
        '/games': 'My Datasets',
        '/settings': 'Settings',
        '/upload': 'Upload Data',
        '/data-sources': 'Data Sources',
        '/analytics': 'Analytics',
        '/dashboards': 'Dashboards',
        '/funnels': 'Funnels',
        '/monetization': 'Monetization',
    };

    return titles[pathname] || 'Page';
}

function ChartContainer({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border-subtle overflow-hidden">
            <div className="px-5 py-4 border-b border-th-border-subtle">
                <h3 className="text-sm font-semibold text-th-text-primary">{title}</h3>
                <p className="text-xs text-th-text-muted mt-0.5">{subtitle}</p>
            </div>

            <div className="p-4">{children}</div>
        </div>
    );
}

const InsightCard = memo(function InsightCard({
    type,
    message,
}: {
    type: 'warning' | 'opportunity' | 'info' | 'critical';
    message: string;
}) {
    const config = {
        warning: {
            bg: 'bg-th-warning-muted',
            border: 'border-th-warning/20',
            icon: AlertTriangle,
            iconColor: 'text-th-warning',
            label: 'Warning',
        },
        opportunity: {
            bg: 'bg-th-accent-primary-muted',
            border: 'border-th-accent-primary/20',
            icon: Lightbulb,
            iconColor: 'text-th-accent-primary',
            label: 'Opportunity',
        },
        info: {
            bg: 'bg-th-info-muted',
            border: 'border-th-info/20',
            icon: Info,
            iconColor: 'text-th-info',
            label: 'Information',
        },
        critical: {
            bg: 'bg-th-error-muted',
            border: 'border-th-error/20',
            icon: AlertCircle,
            iconColor: 'text-th-error',
            label: 'Critical alert',
        },
    };

    const { bg, border, icon: IconComponent, iconColor, label } = config[type];

    return (
        <div className={`p-4 rounded-lg border ${bg} ${border} hover:bg-th-interactive-hover transition-colors`} role="listitem">
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${bg} border ${border}`}>
                    <IconComponent className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <span className="sr-only">{label}: </span>
                    <p className="text-sm text-th-text-secondary leading-relaxed">{message}</p>
                </div>
            </div>
        </div>
    );
});

const AIInsightsSection = memo(function AIInsightsSection({
    selectedGame,
    isUsingRealData,
}: {
    selectedGame: string;
    isUsingRealData: boolean;
}) {
    const { result } = useAnalytics();

    const insights = useMemo(() => {
        const mapInsightType = (type: string): 'warning' | 'opportunity' | 'info' | 'critical' => {
            switch (type) {
                case 'positive':
                    return 'opportunity';
                case 'negative':
                case 'warning':
                    return 'warning';
                case 'opportunity':
                    return 'opportunity';
                default:
                    return 'info';
            }
        };

        if (isUsingRealData && result?.insights && result.insights.length > 0) {
            return result.insights.slice(0, 3).map((insight) => ({
                type: mapInsightType(insight.type),
                message: insight.description || insight.title,
            }));
        }

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
    }, [isUsingRealData, result?.insights, selectedGame]);

    const subtitle = isUsingRealData && result?.insights?.length
        ? 'Generated from your uploaded data'
        : 'Auto-generated recommendations based on your data';

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-th-border-subtle flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-th-accent-primary" />
                </div>
                <div>
                    <h2 id="insights-heading" className="text-base font-semibold text-th-text-primary">
                        AI Insights
                    </h2>
                    <p className="text-xs text-th-text-muted">{subtitle}</p>
                </div>
            </div>

            <div className="p-4 space-y-3" role="list" aria-label="AI-generated insights">
                {insights.map((insight, index) => (
                    <InsightCard key={index} type={insight.type} message={insight.message} />
                ))}
            </div>
        </div>
    );
});

function OverviewPage() {
    const { selectedGame, setSelectedGame } = useGame();
    const { activeGameData, gameDataList } = useData();
    const [showDemoMode, setShowDemoMode] = useState(false);

    const isFirstTimeUser = gameDataList.length === 0;
    const dataProvider = useMemo(
        () => createSmartDataProvider(selectedGame, activeGameData),
        [selectedGame, activeGameData]
    );
    const isUsingRealData = activeGameData !== null;
    const gameInfo = gameCategories.find((g) => g.id === selectedGame);

    const retentionData = useMemo(() => dataProvider.getRetentionData(), [dataProvider]);
    const funnelData = useMemo(() => dataProvider.getFunnelData(), [dataProvider]);
    const kpiData = useMemo(() => dataProvider.getKPIData(), [dataProvider]);
    const revenueData = useMemo(() => dataProvider.getRevenueData(), [dataProvider]);
    const segmentData = useMemo(() => dataProvider.getSegmentData(), [dataProvider]);

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

    if (isFirstTimeUser && !showDemoMode) {
        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6 max-w-4xl mx-auto"
            >
                <QuickStartCard onTryDemo={() => setShowDemoMode(true)} />

                <motion.div variants={itemVariants} className="text-center">
                    <p className="text-sm text-th-text-muted">
                        Game Insights automatically analyzes retention, funnels, revenue, and player behavior
                    </p>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
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

            <motion.header variants={itemVariants} className="relative">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-4">
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
                                            className="text-[10px] font-semibold uppercase tracking-wider bg-[#E5A84B]/15 text-[#E5A84B] px-2.5 py-1 rounded-full border border-[#E5A84B]/20"
                                        >
                                            Demo
                                        </motion.span>
                                    )}
                                </h1>
                                <p className="text-sm text-th-text-muted mt-1">
                                    {isUsingRealData
                                        ? `Analyzing ${activeGameData?.rowCount?.toLocaleString() || activeGameData?.rawData?.length?.toLocaleString() || 0} rows of data`
                                        : gameInfo?.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.header>

            <motion.div variants={itemVariants}>
                <GameSelector selected={selectedGame} onChange={setSelectedGame} />
            </motion.div>

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

            <motion.section variants={itemVariants} aria-labelledby="charts-heading-1">
                <h2 id="charts-heading-1" className="sr-only">Retention and Funnel Charts</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer title="Retention Curve" subtitle="User retention over time">
                        <Suspense fallback={<ChartLoader />}>
                            <RetentionCurve data={retentionData} />
                        </Suspense>
                    </ChartContainer>
                    <ChartContainer title={chartConfigs.funnel.title} subtitle={chartConfigs.funnel.subtitle}>
                        <Suspense fallback={<ChartLoader />}>
                            <FunnelChart data={funnelData} config={chartConfigs.funnel} />
                        </Suspense>
                    </ChartContainer>
                </div>
            </motion.section>

            <motion.section variants={itemVariants} aria-labelledby="charts-heading-2">
                <h2 id="charts-heading-2" className="sr-only">Revenue and Segment Charts</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer title="Revenue Trends" subtitle="Daily revenue breakdown">
                        <Suspense fallback={<ChartLoader />}>
                            <RevenueChart data={revenueData} />
                        </Suspense>
                    </ChartContainer>
                    <ChartContainer title={chartConfigs.segment.title} subtitle={chartConfigs.segment.subtitle}>
                        <Suspense fallback={<ChartLoader />}>
                            <SegmentChart data={segmentData} config={chartConfigs.segment} />
                        </Suspense>
                    </ChartContainer>
                </div>
            </motion.section>

            <motion.section variants={itemVariants} aria-labelledby="insights-heading">
                <AIInsightsSection selectedGame={selectedGame} isUsingRealData={isUsingRealData} />
            </motion.section>
        </motion.div>
    );
}

function AppContent() {
    const commandPalette = useCommandPalette();
    const [showShortcuts, setShowShortcuts] = useState(false);
    const { hasCompleted: hasOnboarded } = useOnboarding();
    const [showOnboarding, setShowOnboarding] = useState(!hasOnboarded);
    const location = useLocation();
    const { collapsed } = useSidebarSettings();

    useKeyboardShortcuts({
        onOpenCommandPalette: commandPalette.open,
        onOpenShortcuts: () => setShowShortcuts(true),
    });

    const pageTitle = getPageTitle(location.pathname);

    if (showOnboarding) {
        return withPageLoader(
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
            <SkipLink />

            <div className="min-h-screen bg-th-bg-base flex">
                <Sidebar />

                <main
                    id="main-content"
                    className={`flex-1 p-4 sm:p-6 transition-[margin] duration-200 ${collapsed ? 'ml-16' : 'ml-[220px]'}`}
                    tabIndex={-1}
                    aria-label={`${pageTitle} - Main content`}
                >
                    <Routes>
                        {dashboardRoutes.map(({ path, element }) => (
                            <Route
                                key={path}
                                path={path}
                                element={path === '/' ? element : withPageLoader(element)}
                            />
                        ))}
                    </Routes>
                </main>
            </div>

            {commandPalette.isOpen && (
                <Suspense fallback={null}>
                    <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
                </Suspense>
            )}

            {showShortcuts && (
                <Suspense fallback={null}>
                    <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
                </Suspense>
            )}
        </>
    );
}

function FirstTimeRedirect() {
    const { gameDataList, isReady } = useData();
    const location = useLocation();

    if (!isReady) {
        return <PageLoader />;
    }

    if (gameDataList.length === 0 && location.pathname === '/') {
        return <Navigate to="/landing" replace />;
    }

    return <AppContent />;
}

function AppRouter() {
    const location = useLocation();

    if (location.pathname === '/landing') {
        return withPageLoader(<LandingPage />);
    }

    return <FirstTimeRedirect />;
}

export default AppRouter;
