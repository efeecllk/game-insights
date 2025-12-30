/**
 * Overview Page - Design System v2
 * Fully theme-aware GameAnalytics-style dashboard
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import { Users, Clock, UserPlus, Activity, LucideIcon, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { KPICardCompact } from '../components/ui/KPICard';
import { useTheme } from '../context/ThemeContext';

// Sample data for demo
const activeUsersData = {
    timestamps: ['13:00', '15:00', '18:00', '21:00', '00:00', '03:00', '06:00', '09:00', '13:00'],
    values: [280, 420, 380, 320, 180, 45, 120, 260, 85],
};

interface KPIDataItem {
    labelKey: string;
    value: string;
    change: number;
    trend: 'up' | 'down';
    icon: LucideIcon;
    tooltipKey: string;
}

const kpiData: KPIDataItem[] = [
    { labelKey: 'kpi.dau', value: '5.4k', change: 0.06, trend: 'up', icon: Users, tooltipKey: 'kpi.dauFull' },
    { labelKey: 'kpi.playtime', value: '12m 42s', change: 0.11, trend: 'up', icon: Clock, tooltipKey: 'kpi.playtimeTooltip' },
    { labelKey: 'kpi.newUsers', value: '3.33k', change: -0.94, trend: 'down', icon: UserPlus, tooltipKey: 'kpi.newUsersTooltip' },
    { labelKey: 'kpi.sessions', value: '9.88k', change: 0.23, trend: 'up', icon: Activity, tooltipKey: 'kpi.sessionsTooltip' },
];

export function OverviewPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'integration'>('overview');
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();

    return (
        <div className="space-y-6">
            {/* Game Header */}
            <Card variant="default" padding="md" animate staggerIndex={1}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-th-bg-elevated rounded-xl flex items-center justify-center border border-th-border">
                        <span className="text-xl" role="img" aria-label="Game icon">⚔️</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold text-th-text-primary">Event Forge</h1>
                        <div className="flex items-center gap-4 text-sm text-th-text-muted mt-1">
                            <span>{t('common.role')}: <span className="text-th-text-secondary">{t('common.admin')}</span></span>
                            <span>{t('common.organization')}: <span className="text-th-text-secondary">GA Mobile</span></span>
                            <span>{t('common.platform')}: <span className="text-th-text-secondary">🎮</span></span>
                            <span className="text-th-text-disabled">SDK</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="border-b border-th-border">
                <div className="flex gap-6" role="tablist" aria-label="Overview sections">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'overview'}
                        aria-controls="panel-overview"
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-accent-primary focus-visible:ring-offset-2 ${activeTab === 'overview'
                            ? 'border-th-accent-primary text-th-accent-primary'
                            : 'border-transparent text-th-text-muted hover:text-th-text-secondary'
                        }`}
                    >
                        {t('pages.overview.tabs.overview')}
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'integration'}
                        aria-controls="panel-integration"
                        onClick={() => setActiveTab('integration')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-accent-primary focus-visible:ring-offset-2 ${activeTab === 'integration'
                            ? 'border-th-accent-primary text-th-accent-primary'
                            : 'border-transparent text-th-text-muted hover:text-th-text-secondary'
                        }`}
                    >
                        {t('pages.overview.tabs.integration')}
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-6">
                    {/* Overview Section */}
                    <Card variant="default" padding="none" animate staggerIndex={2}>
                        <div className="p-4 border-b border-th-border-subtle flex items-center justify-between">
                            <h2 className="font-display font-semibold text-th-text-primary">{t('pages.overview.sections.overview')}</h2>
                            <button className="text-sm text-th-accent-primary hover:text-th-accent-primary-hover transition-colors">
                                {t('pages.overview.sections.explorer')}
                            </button>
                        </div>
                        <div className="grid grid-cols-4 divide-x divide-th-border-subtle">
                            {kpiData.map((kpi) => (
                                <KPICardCompact
                                    key={kpi.labelKey}
                                    label={t(kpi.labelKey)}
                                    value={kpi.value}
                                    change={kpi.change * 100}
                                    changeType={kpi.trend}
                                    icon={kpi.icon}
                                />
                            ))}
                        </div>
                    </Card>

                    {/* Active Users Chart */}
                    <Card variant="default" padding="md" animate staggerIndex={3}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="font-display font-semibold text-th-text-primary">{t('pages.overview.sections.activeUsers')}</h3>
                                <button
                                    className="text-th-text-disabled hover:text-th-text-muted transition-colors"
                                    aria-label="More information about active users"
                                >
                                    <Info className="w-4 h-4" />
                                </button>
                                <span className="badge badge-success text-[10px]">
                                    {t('common.live')}
                                </span>
                            </div>
                            <span className="text-sm text-th-text-muted">{t('common.realtime')}</span>
                        </div>
                        <ActiveUsersChart data={activeUsersData} isDark={resolvedTheme === 'dark'} t={t} />
                    </Card>
                </div>
            )}

            {activeTab === 'integration' && (
                <div id="panel-integration" role="tabpanel" aria-labelledby="tab-integration">
                    <IntegrationTab />
                </div>
            )}
        </div>
    );
}

function ActiveUsersChart({
    data,
    isDark,
    t,
}: {
    data: { timestamps: string[]; values: number[] };
    isDark: boolean;
    t: (key: string) => string;
}) {
    // Theme-aware chart colors
    const colors = {
        text: isDark ? '#a1a1aa' : '#6b7280',
        grid: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
        line: isDark ? '#a78bfa' : '#8b5cf6',
        area: isDark
            ? [{ offset: 0, color: 'rgba(167, 139, 250, 0.15)' }, { offset: 1, color: 'rgba(167, 139, 250, 0)' }]
            : [{ offset: 0, color: 'rgba(139, 92, 246, 0.1)' }, { offset: 1, color: 'rgba(139, 92, 246, 0)' }],
        tooltip: {
            bg: isDark ? '#242430' : '#ffffff',
            border: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
            text: isDark ? '#f4f4f5' : '#374151',
        },
    };

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: colors.tooltip.bg,
            borderColor: colors.tooltip.border,
            borderWidth: 1,
            textStyle: { color: colors.tooltip.text, fontFamily: 'DM Sans' },
            padding: [8, 12],
        },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: data.timestamps,
            axisLine: { lineStyle: { color: colors.grid } },
            axisLabel: { color: colors.text, fontSize: 11, fontFamily: 'DM Sans' },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            max: 500,
            axisLine: { show: false },
            axisLabel: { color: colors.text, fontSize: 11, fontFamily: 'JetBrains Mono' },
            splitLine: { lineStyle: { color: colors.grid } },
        },
        series: [{
            name: 'Active Users',
            type: 'line',
            data: data.values,
            smooth: 0.3,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: colors.line, width: 2 },
            itemStyle: { color: colors.line, borderColor: isDark ? '#16161e' : '#ffffff', borderWidth: 2 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: colors.area,
                },
            },
        }],
    };

    return (
        <div className="flex items-end gap-4">
            <div className="flex-1">
                <ReactECharts option={option} style={{ height: 280 }} />
            </div>
            <div className="text-right pb-8">
                <div className="flex items-center gap-2 text-sm text-th-text-muted">
                    <span className="w-3 h-0.5 bg-th-accent-primary rounded" aria-hidden="true" />
                    <span>{t('common.time')}</span>
                </div>
            </div>
        </div>
    );
}

function IntegrationTab() {
    const eventTypes = [
        { name: 'Resource events', count: 988, color: 'bg-th-info' },
        { name: 'Progression events', count: 563634, color: 'bg-th-accent-primary' },
        { name: 'Health events', count: null, status: 'Not tracking', color: 'bg-th-text-disabled' },
        { name: 'Design events', count: 286378, color: 'bg-th-success' },
        { name: 'Business events', count: 229, color: 'bg-th-warning' },
        { name: 'Ad events', count: 5264, color: 'bg-th-chart-3' },
        { name: 'Impression events', count: 511, color: 'bg-th-chart-4' },
    ];

    return (
        <div className="space-y-6">
            <Card variant="default" padding="md" animate staggerIndex={1}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-th-text-primary">Total events sent yesterday</h3>
                    <button className="text-sm text-th-accent-primary hover:text-th-accent-primary-hover transition-colors">
                        Event types ↗
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {eventTypes.map((event) => (
                        <div key={event.name} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${event.color} flex-shrink-0`} aria-hidden="true" />
                            <span className="text-sm text-th-text-secondary truncate">{event.name}</span>
                            {event.count !== null ? (
                                <span className="text-sm font-mono font-medium text-th-text-primary ml-auto">
                                    {event.count.toLocaleString()}
                                </span>
                            ) : (
                                <span className="text-sm text-th-error ml-auto">{event.status}</span>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
            <Card variant="default" padding="lg" animate staggerIndex={2} className="text-center">
                <div className="py-8">
                    <div className="text-4xl mb-3" role="img" aria-label="Chart placeholder">📊</div>
                    <p className="text-th-text-muted">Event charts will appear here</p>
                </div>
            </Card>
        </div>
    );
}

export default OverviewPage;
