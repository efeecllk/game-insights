/**
 * Game Insights Dashboard - Main Application
 * Clean Architecture with SOLID Principles
 */

import { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, Clock, Target, Gamepad2 } from 'lucide-react';
import { GameProvider, useGame } from './context/GameContext';
import { DataProvider } from './context/DataContext';
import { IntegrationProvider } from './context/IntegrationContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import { Sidebar } from './components/Sidebar';
import { KPICard } from './components/ui/KPICard';
import { GameSelector } from './components/ui/GameSelector';

// Charts
import { RetentionCurve } from './components/charts/RetentionCurve';
import { FunnelChart } from './components/charts/FunnelChart';
import { RevenueChart } from './components/charts/RevenueChart';
import { SegmentChart } from './components/charts/SegmentChart';

// Pages
import { UploadPage } from './pages/Upload';
import { SettingsPage } from './pages/Settings';
import { RealtimePage } from './pages/Realtime';
import { FunnelsPage } from './pages/Funnels';
import { MonetizationPage } from './pages/Monetization';
import { AnalyticsPage } from './pages/Analytics';
import { IntegrationsPage } from './pages/Integrations';
import { TemplatesPage } from './pages/Templates';
import { PredictionsPage } from './pages/Predictions';
import { ABTestingPage } from './pages/ABTesting';
import { DashboardBuilderPage } from './pages/DashboardBuilder';
import { GamesPage } from './pages/Games';
import { FunnelBuilderPage } from './pages/FunnelBuilder';

// Data & Types
import { createDataProvider, gameCategories } from './lib/dataProviders';

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-th-text-primary flex items-center gap-3">
                        <span>{gameInfo?.icon}</span>
                        {gameInfo?.name} Analytics
                    </h1>
                    <p className="text-th-text-muted mt-1">{gameInfo?.description}</p>
                </div>
            </div>

            {/* Game Type Selector */}
            <GameSelector selected={selectedGame} onChange={setSelectedGame} />

            {/* KPI Grid */}
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

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RetentionCurve data={retentionData} />
                <FunnelChart data={funnelData} config={chartConfigs.funnel} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={revenueData} />
                <SegmentChart data={segmentData} config={chartConfigs.segment} />
            </div>

            {/* AI Insights Placeholder */}
            <div className="bg-th-bg-surface rounded-card p-6 border border-th-border-subtle">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-th-accent-primary-muted flex items-center justify-center">
                        <span className="text-xl">🧠</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-th-text-primary">AI Insights</h3>
                        <p className="text-sm text-th-text-muted">Auto-generated recommendations</p>
                    </div>
                </div>
                <div className="space-y-3">
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
            </div>
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

    return (
        <div className={`p-4 rounded-xl border ${styles[type]}`}>
            <div className="flex items-start gap-3">
                <span className="text-lg">{icons[type]}</span>
                <p className="text-sm text-th-text-secondary">{message}</p>
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
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-th-text-primary">{title}</h1>
                {badge && (
                    <span className="text-xs font-semibold text-th-accent-primary bg-th-accent-primary-muted px-2 py-1 rounded">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-th-text-muted">{description ?? 'This section is under development'}</p>
            <div className="bg-th-bg-surface rounded-xl p-12 border border-th-border-subtle flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-4">🚧</span>
                <p className="text-th-text-secondary font-medium">Coming soon...</p>
                <p className="text-th-text-muted text-sm mt-2">Check back for updates</p>
            </div>
        </div>
    );
}

/**
 * Main App Component
 */
function App() {
    return (
        <ThemeProvider>
            <DataProvider>
                <IntegrationProvider>
                    <GameProvider>
                        <div className="min-h-screen bg-th-bg-base flex">
                            {/* Sidebar Navigation */}
                            <Sidebar />

                            {/* Main Content Area */}
                            <main className="flex-1 ml-[200px] p-6">
                                <Routes>
                                    <Route path="/" element={<OverviewPage />} />
                                    <Route path="/integrations" element={<IntegrationsPage />} />
                                    <Route path="/templates" element={<TemplatesPage />} />
                                    <Route path="/predictions" element={<PredictionsPage />} />
                                    <Route path="/analytics" element={<AnalyticsPage />} />
                                    <Route path="/realtime" element={<RealtimePage />} />
                                    <Route path="/dashboards" element={<DashboardBuilderPage />} />
                                    <Route path="/explore" element={<PlaceholderPage title="Explore" description="Query builder and data exploration" />} />
                                    <Route path="/funnels" element={<FunnelsPage />} />
                                    <Route path="/funnel-builder" element={<FunnelBuilderPage />} />
                                    <Route path="/engagement" element={<PlaceholderPage title="Engagement" description="User engagement metrics" />} />
                                    <Route path="/distributions" element={<PlaceholderPage title="Distributions" description="Data distribution analysis" badge="Beta" />} />
                                    <Route path="/health" element={<PlaceholderPage title="Health" description="SDK health and error tracking" />} />
                                    <Route path="/monetization" element={<MonetizationPage />} />
                                    <Route path="/user-analysis" element={<PlaceholderPage title="User Analysis" description="Cohort and segment analysis" />} />
                                    <Route path="/remote-configs" element={<PlaceholderPage title="Remote Configs" description="Feature flags and configuration" />} />
                                    <Route path="/ab-testing" element={<ABTestingPage />} />
                                    <Route path="/games" element={<GamesPage />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                    <Route path="/upload" element={<UploadPage />} />
                                </Routes>
                            </main>
                        </div>
                    </GameProvider>
                </IntegrationProvider>
            </DataProvider>
        </ThemeProvider>
    );
}

export default App;
