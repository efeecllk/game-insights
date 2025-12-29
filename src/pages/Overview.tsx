/**
 * Overview Page - GameAnalytics Style
 * Main dashboard with KPI cards and Active Users chart
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import { Users, Clock, UserPlus, Activity, TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

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

    return (
        <div className="space-y-6">
            {/* Game Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl font-bold">⚔️</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Event Forge</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>{t('common.role')}: <span className="text-gray-700">{t('common.admin')}</span></span>
                            <span>{t('common.organization')}: <span className="text-gray-700">GA Mobile</span></span>
                            <span>{t('common.platform')}: <span className="text-gray-700">🎮</span></span>
                            <span className="text-gray-400">SDK</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                                ? 'border-violet-600 text-violet-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {t('pages.overview.tabs.overview')}
                    </button>
                    <button
                        onClick={() => setActiveTab('integration')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'integration'
                                ? 'border-violet-600 text-violet-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {t('pages.overview.tabs.integration')}
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Overview Section */}
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">{t('pages.overview.sections.overview')}</h2>
                            <button className="text-sm text-violet-600 hover:underline">{t('pages.overview.sections.explorer')}</button>
                        </div>
                        <div className="grid grid-cols-4 divide-x divide-gray-100">
                            {kpiData.map((kpi) => (
                                <KPICard key={kpi.labelKey} {...kpi} t={t} />
                            ))}
                        </div>
                    </div>

                    {/* Active Users Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{t('pages.overview.sections.activeUsers')}</h3>
                                <span className="text-xs text-gray-400">i</span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    {t('common.live')}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500">{t('common.realtime')}</span>
                        </div>
                        <ActiveUsersChart data={activeUsersData} t={t} />
                    </div>
                </>
            )}

            {activeTab === 'integration' && <IntegrationTab />}
        </div>
    );
}

interface KPICardProps extends KPIDataItem {
    t: (key: string) => string;
}

function KPICard({ labelKey, value, change, trend, tooltipKey, t }: KPICardProps) {
    return (
        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <span>{t(labelKey)}</span>
                <span className="text-xs text-gray-400" title={t(tooltipKey)}>i</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className={`flex items-center gap-1 text-sm mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{change > 0 ? '+' : ''}{(change * 100).toFixed(2)}%</span>
            </div>
        </div>
    );
}

function ActiveUsersChart({ data, t }: { data: { timestamps: string[]; values: number[] }; t: (key: string) => string }) {
    const option = {
        tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1, textStyle: { color: '#374151' } },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: data.timestamps, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280', fontSize: 11 }, axisTick: { show: false } },
        yAxis: { type: 'value', max: 500, axisLine: { show: false }, axisLabel: { color: '#6b7280', fontSize: 11 }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
        series: [{
            name: 'Active Users',
            type: 'line',
            data: data.values,
            smooth: false,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: '#6366f1', width: 2 },
            itemStyle: { color: '#6366f1', borderColor: '#fff', borderWidth: 2 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(99, 102, 241, 0.1)' }, { offset: 1, color: 'rgba(99, 102, 241, 0)' }] } },
        }],
    };

    return (
        <div className="flex items-end gap-4">
            <div className="flex-1">
                <ReactECharts option={option} style={{ height: 280 }} />
            </div>
            <div className="text-right pb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-3 h-0.5 bg-indigo-500 rounded" />
                    <span>{t('common.time')}</span>
                </div>
            </div>
        </div>
    );
}

function IntegrationTab() {
    const eventTypes = [
        { name: 'Resource events', count: 988, color: 'bg-blue-500' },
        { name: 'Progression events', count: 563634, color: 'bg-violet-500' },
        { name: 'Health events', count: null, status: 'Not tracking', color: 'bg-gray-300' },
        { name: 'Design events', count: 286378, color: 'bg-green-500' },
        { name: 'Business events', count: 229, color: 'bg-orange-500' },
        { name: 'Ad events', count: 5264, color: 'bg-pink-500' },
        { name: 'Impression events', count: 511, color: 'bg-cyan-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Total events sent yesterday</h3>
                    <button className="text-sm text-violet-600 hover:underline">Event types ↗</button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {eventTypes.map((event) => (
                        <div key={event.name} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${event.color}`} />
                            <span className="text-sm text-gray-600">{event.name}</span>
                            {event.count !== null ? (
                                <span className="text-sm font-medium text-gray-900 ml-auto">{event.count.toLocaleString()}</span>
                            ) : (
                                <span className="text-sm text-red-500 ml-auto">{event.status}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">📊 Event charts will appear here</p>
            </div>
        </div>
    );
}

export default OverviewPage;
