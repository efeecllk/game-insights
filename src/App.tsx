/**
 * Game Insights Dashboard - Main Application
 * Clean Architecture with SOLID Principles
 */

import { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, Clock, Target, Gamepad2 } from 'lucide-react';

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
// Note: OverviewPage from ./pages/Overview is available for GameAnalytics-style view if needed

// Data & Types
import { GameCategory } from './types';
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
    const [selectedGame, setSelectedGame] = useState<GameCategory>('puzzle');

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
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span>{gameInfo?.icon}</span>
                        {gameInfo?.name} Analytics
                    </h1>
                    <p className="text-zinc-500 mt-1">{gameInfo?.description}</p>
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
            <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                        <span className="text-xl">🧠</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">AI Insights</h3>
                        <p className="text-sm text-zinc-500">Auto-generated recommendations</p>
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
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
        opportunity: 'bg-green-500/10 border-green-500/20 text-green-500',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
        critical: 'bg-red-500/10 border-red-500/20 text-red-500',
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
                <p className="text-sm text-zinc-300">{message}</p>
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
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {badge && (
                    <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-1 rounded">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-gray-500">{description ?? 'This section is under development'}</p>
            <div className="bg-white rounded-xl p-12 border border-gray-200 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-4xl mb-4">🚧</span>
                <p className="text-gray-600 font-medium">Coming soon...</p>
                <p className="text-gray-400 text-sm mt-2">Check back for updates</p>
            </div>
        </div>
    );
}

/**
 * Main App Component
 */
function App() {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 ml-[200px] p-6">
                <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/realtime" element={<PlaceholderPage title="Realtime" description="Live events and SDK status" />} />
                    <Route path="/dashboards" element={<PlaceholderPage title="Dashboards" description="Custom dashboard builder" />} />
                    <Route path="/explore" element={<PlaceholderPage title="Explore" description="Query builder and data exploration" />} />
                    <Route path="/funnels" element={<PlaceholderPage title="Funnels" description="Conversion funnel analysis" />} />
                    <Route path="/engagement" element={<PlaceholderPage title="Engagement" description="User engagement metrics" />} />
                    <Route path="/distributions" element={<PlaceholderPage title="Distributions" description="Data distribution analysis" badge="Beta" />} />
                    <Route path="/health" element={<PlaceholderPage title="Health" description="SDK health and error tracking" />} />
                    <Route path="/monetization" element={<PlaceholderPage title="Monetization" description="Revenue and transaction analytics" />} />
                    <Route path="/user-analysis" element={<PlaceholderPage title="User Analysis" description="Cohort and segment analysis" />} />
                    <Route path="/remote-configs" element={<PlaceholderPage title="Remote Configs" description="Feature flags and configuration" />} />
                    <Route path="/ab-testing" element={<PlaceholderPage title="A/B Testing" description="Experiment dashboard" />} />
                    <Route path="/datasuite" element={<PlaceholderPage title="DataSuite" description="Data export and custom queries" />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/upload" element={<UploadPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
