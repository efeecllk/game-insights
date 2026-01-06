/**
 * Overview Page - Obsidian Analytics Design
 *
 * Premium dashboard with:
 * - Glassmorphism containers
 * - Warm orange accent theme (Claude brand colors)
 * - Animated tab indicator
 * - Staggered entrance animations
 * - Noise texture backgrounds
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
    Users,
    Clock,
    UserPlus,
    Activity,
    LucideIcon,
    Info,
    Gamepad2,
    ArrowUpRight,
    Zap,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { KPICardCompact } from '../components/ui/KPICard';

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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
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

export function OverviewPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'integration'>('overview');
    const { t } = useTranslation();

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Game Header */}
            <motion.div variants={itemVariants}>
                <Card variant="elevated" padding="md">
                    <div className="flex items-center gap-4">
                        {/* Game icon with glow */}
                        <motion.div
                            className="relative"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                        >
                            <div className="absolute inset-0 bg-[#DA7756]/30 rounded-xl blur-lg" />
                            <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 flex items-center justify-center">
                                <Gamepad2 className="w-7 h-7 text-[#DA7756]" />
                            </div>
                        </motion.div>

                        <div className="flex-1">
                            {/* Game title with gradient */}
                            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                Event Forge
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span>
                                    {t('common.role')}:{' '}
                                    <span className="text-slate-300">{t('common.admin')}</span>
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span>
                                    {t('common.organization')}:{' '}
                                    <span className="text-slate-300">GA Mobile</span>
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span className="flex items-center gap-1.5">
                                    <span className="text-lg">🎮</span>
                                    <span className="px-2 py-0.5 text-xs bg-slate-800/50 border border-white/[0.06] rounded-md text-slate-500">
                                        SDK
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Status indicator */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-full"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DA7756] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DA7756]" />
                            </span>
                            <span className="text-xs font-medium text-[#DA7756]">Live</span>
                        </motion.div>
                    </div>
                </Card>
            </motion.div>

            {/* Animated Tabs */}
            <motion.div variants={itemVariants} className="relative">
                <div className="flex gap-1 p-1 bg-slate-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl w-fit">
                    {(['overview', 'integration'] as const).map((tab) => (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={activeTab === tab}
                            aria-controls={`panel-${tab}`}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === tab
                                    ? 'text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 rounded-lg"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">
                                {t(`pages.overview.tabs.${tab}`)}
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        id="panel-overview"
                        role="tabpanel"
                        aria-labelledby="tab-overview"
                        className="space-y-6"
                    >
                        {/* KPI Overview Section */}
                        <Card variant="default" padding="none">
                            <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-[#DA7756]" />
                                    </div>
                                    <h2 className="font-display font-semibold text-white">
                                        {t('pages.overview.sections.overview')}
                                    </h2>
                                </div>
                                <motion.button
                                    whileHover={{ x: 4 }}
                                    className="flex items-center gap-1 text-sm text-[#DA7756] hover:text-[#C15F3C] transition-colors"
                                >
                                    {t('pages.overview.sections.explorer')}
                                    <ArrowUpRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                            <div className="grid grid-cols-4 divide-x divide-white/[0.04]">
                                {kpiData.map((kpi, index) => (
                                    <KPICardCompact
                                        key={kpi.labelKey}
                                        label={t(kpi.labelKey)}
                                        value={kpi.value}
                                        change={kpi.change * 100}
                                        changeType={kpi.trend}
                                        icon={kpi.icon}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </Card>

                        {/* Active Users Chart */}
                        <Card variant="default" padding="md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-display font-semibold text-white">
                                        {t('pages.overview.sections.activeUsers')}
                                    </h3>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        className="text-slate-600 hover:text-slate-400 transition-colors"
                                        aria-label="More information about active users"
                                    >
                                        <Info className="w-4 h-4" />
                                    </motion.button>
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-full">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DA7756] opacity-75" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#DA7756]" />
                                        </span>
                                        <span className="text-[10px] font-medium text-[#DA7756] uppercase tracking-wide">
                                            {t('common.live')}
                                        </span>
                                    </span>
                                </div>
                                <span className="text-sm text-slate-500">{t('common.realtime')}</span>
                            </div>
                            <ActiveUsersChart data={activeUsersData} t={t} />
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'integration' && (
                    <motion.div
                        key="integration"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        id="panel-integration"
                        role="tabpanel"
                        aria-labelledby="tab-integration"
                    >
                        <IntegrationTab />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ActiveUsersChart({
    data,
    t,
}: {
    data: { timestamps: string[]; values: number[] };
    t: (key: string) => string;
}) {
    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            textStyle: {
                color: '#f1f5f9',
                fontFamily: 'DM Sans',
            },
            padding: [12, 16],
            extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;',
        },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: data.timestamps,
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                fontFamily: 'DM Sans',
            },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            max: 500,
            axisLine: { show: false },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.04)',
                },
            },
        },
        series: [
            {
                name: 'Active Users',
                type: 'line',
                data: data.values,
                smooth: 0.3,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: {
                    color: '#DA7756',
                    width: 2,
                },
                itemStyle: {
                    color: '#DA7756',
                    borderColor: '#0f172a',
                    borderWidth: 2,
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(218, 119, 86, 0.2)' },
                            { offset: 1, color: 'rgba(218, 119, 86, 0)' },
                        ],
                    },
                },
            },
        ],
    };

    return (
        <div className="flex items-end gap-4">
            <div className="flex-1">
                <ReactECharts option={option} style={{ height: 280 }} />
            </div>
            <div className="text-right pb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="w-3 h-0.5 bg-[#DA7756] rounded" aria-hidden="true" />
                    <span>{t('common.time')}</span>
                </div>
            </div>
        </div>
    );
}

function IntegrationTab() {
    const eventTypes = [
        { name: 'Resource events', count: 988, color: 'bg-sky-500' },
        { name: 'Progression events', count: 563634, color: 'bg-[#DA7756]' },
        { name: 'Health events', count: null, status: 'Not tracking', color: 'bg-slate-600' },
        { name: 'Design events', count: 286378, color: 'bg-[#C15F3C]' },
        { name: 'Business events', count: 229, color: 'bg-amber-500' },
        { name: 'Ad events', count: 5264, color: 'bg-violet-500' },
        { name: 'Impression events', count: 511, color: 'bg-rose-500' },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <motion.div variants={itemVariants}>
                <Card variant="default" padding="md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display font-semibold text-white">
                            Total events sent yesterday
                        </h3>
                        <motion.button
                            whileHover={{ x: 4 }}
                            className="flex items-center gap-1 text-sm text-[#DA7756] hover:text-[#C15F3C] transition-colors"
                        >
                            Event types
                            <ArrowUpRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {eventTypes.map((event, index) => (
                            <motion.div
                                key={event.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${event.color} flex-shrink-0`}
                                    aria-hidden="true"
                                />
                                <span className="text-sm text-slate-400 truncate">{event.name}</span>
                                {event.count !== null ? (
                                    <span className="text-sm font-mono font-medium text-white ml-auto">
                                        {event.count.toLocaleString()}
                                    </span>
                                ) : (
                                    <span className="text-sm text-rose-400 ml-auto">{event.status}</span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card variant="default" padding="lg" className="text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="py-8"
                    >
                        <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl blur-xl" />
                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/[0.08] flex items-center justify-center mx-auto">
                                <span className="text-3xl" role="img" aria-label="Chart placeholder">
                                    📊
                                </span>
                            </div>
                        </div>
                        <p className="text-slate-500">Event charts will appear here</p>
                    </motion.div>
                </Card>
            </motion.div>
        </motion.div>
    );
}

export default OverviewPage;
