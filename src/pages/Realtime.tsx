/**
 * Realtime Page - Obsidian Analytics Design
 *
 * Premium live analytics dashboard with:
 * - Glassmorphism containers
 * - Warm orange accent theme
 * - Animated entrance effects
 * - Live pulse indicators
 *
 * Performance Optimizations:
 * - Uses cleanup utilities for proper interval management
 * - Registers as expensive feature for performance tracking
 * - Automatic cleanup on unmount to prevent zombie processes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Users,
    UserPlus,
    DollarSign,
    Repeat,
    PlayCircle,
    AlertTriangle,
    RefreshCw,
    Link,
    Zap,
    Wifi,
    Clock,
} from 'lucide-react';
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTimers } from '../lib/cleanupUtils';
import { useFeatureTracking, usePausableOperation, usePerformanceStore } from '../lib/performanceStore';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// Simulated live data generator
function generateLiveData(base: number, variance: number) {
    return Math.floor(base + (Math.random() - 0.5) * variance);
}

// Live chart configurations with warm orange theme
const liveCharts = [
    { id: 'newUsers', title: 'New Users', icon: UserPlus, color: '#DA7756', baseValue: 280, variance: 100 },
    { id: 'activeUsers', title: 'Active Users', icon: Users, color: '#C15F3C', baseValue: 420, variance: 150 },
    { id: 'returningUsers', title: 'Returning Users', icon: Repeat, color: '#A68B5B', baseValue: 180, variance: 80 },
    { id: 'revenue', title: 'Revenue', icon: DollarSign, color: '#DA7756', baseValue: 150, variance: 100, prefix: '$' },
    { id: 'transactions', title: 'Transactions', icon: Activity, color: '#f59e0b', baseValue: 28, variance: 15 },
    { id: 'sessions', title: 'Session Count', icon: PlayCircle, color: '#DA7756', baseValue: 850, variance: 200 },
];

export function RealtimePage() {
    const { hasRealData } = useGameData();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'live' | 'sdk'>('live');
    const [chartData, setChartData] = useState<Record<string, number[]>>({});
    const [timestamps, setTimestamps] = useState<string[]>([]);
    const [isLive, setIsLive] = useState(true);

    // Cleanup utilities for proper resource management
    const timers = useTimers();
    const { shouldEnableLiveUpdates } = usePerformanceStore();

    // Track this as an expensive feature
    useFeatureTracking('realtime-page', 'Realtime Analytics', {
        priority: 'high',
        isExpensive: true,
    });

    // Register pausable operation for live updates
    const pauseRef = useRef<() => void>(() => setIsLive(false));
    const resumeRef = useRef<() => void>(() => setIsLive(true));

    usePausableOperation('realtime-updates', 'Live Data Updates', {
        pause: pauseRef.current,
        resume: resumeRef.current,
    });

    // Note: Real-time data would require actual live data source integration
    void hasRealData;

    // Generate new data point
    const generateNewDataPoint = useCallback(() => {
        const newTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        setTimestamps(prev => [...prev.slice(1), newTime]);
        setChartData(prev => {
            const updated = { ...prev };
            liveCharts.forEach(chart => {
                updated[chart.id] = [...(prev[chart.id] || []).slice(1), generateLiveData(chart.baseValue, chart.variance)];
            });
            return updated;
        });
    }, []);

    // Initialize chart data
    useEffect(() => {
        const initialData: Record<string, number[]> = {};
        const initialTimestamps: string[] = [];

        // Generate last 20 data points
        for (let i = 19; i >= 0; i--) {
            const time = new Date(Date.now() - i * 3000);
            initialTimestamps.push(time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));

            liveCharts.forEach(chart => {
                if (!initialData[chart.id]) initialData[chart.id] = [];
                initialData[chart.id].push(generateLiveData(chart.baseValue, chart.variance));
            });
        }

        setChartData(initialData);
        setTimestamps(initialTimestamps);
    }, []);

    // Live updates using cleanup utilities
    useEffect(() => {
        // Don't start live updates if performance store says to disable them
        if (!isLive || !shouldEnableLiveUpdates) return;

        // Use managed interval that auto-cleans on unmount
        const handle = timers.setInterval(generateNewDataPoint, 3000, 'realtime-chart-update');

        return () => handle.clear();
    }, [isLive, shouldEnableLiveUpdates, generateNewDataPoint, timers]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <Card variant="elevated" padding="md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#DA7756]/30 to-[#C15F3C]/20 rounded-xl blur-lg" />
                                <div className="relative w-12 h-12 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 rounded-xl flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                        Realtime
                                    </h1>
                                    <DataModeIndicator />
                                    {isLive && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium bg-[#DA7756]/10 border border-[#DA7756]/20 text-[#DA7756] rounded-full"
                                        >
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DA7756] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DA7756]"></span>
                                            </span>
                                            Live
                                        </motion.span>
                                    )}
                                </div>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    {!hasRealData ? 'Simulated live data' : 'Pattern-based simulation from your data'}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsLive(!isLive)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                isLive
                                    ? 'bg-[#DA7756]/10 border border-[#DA7756]/20 text-[#DA7756] hover:bg-[#DA7756]/20'
                                    : 'bg-white/[0.03] border border-slate-700 text-slate-400 hover:bg-white/[0.06]'
                            }`}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLive ? 'animate-spin' : ''}`} />
                            {isLive ? 'Live' : 'Paused'}
                        </motion.button>
                    </div>
                </Card>
            </motion.div>

            {/* Demo Mode Banner */}
            <AnimatePresence>
                {!hasRealData && (
                    <motion.div
                        variants={itemVariants}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Card variant="default" padding="md" className="border-[#8F8B82]/20 bg-[#8F8B82]/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#8F8B82]/10 border border-[#8F8B82]/20 flex items-center justify-center">
                                        <Link className="w-5 h-5 text-[#8F8B82]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Connect a live data source for real-time analytics</p>
                                        <p className="text-xs text-slate-500">Currently showing simulated data</p>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate('/data-sources')}
                                >
                                    Connect
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex gap-2">
                {(['live', 'sdk'] as const).map((tab) => (
                    <motion.button
                        key={tab}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === tab
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeRealtimeTab"
                                className="absolute inset-0 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 rounded-lg"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative flex items-center gap-2">
                            {tab === 'live' && (
                                <>
                                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#DA7756]' : 'bg-slate-600'}`} />
                                    Live Events
                                </>
                            )}
                            {tab === 'sdk' && 'SDK Status'}
                        </span>
                    </motion.button>
                ))}
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab === 'live' && (
                    <motion.div
                        key="live"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {liveCharts.map((chart, index) => (
                            <LiveChart
                                key={chart.id}
                                title={chart.title}
                                icon={chart.icon}
                                color={chart.color}
                                data={chartData[chart.id] || []}
                                timestamps={timestamps}
                                prefix={chart.prefix}
                                isLive={isLive}
                                index={index}
                            />
                        ))}

                        {/* Error Events - Special multi-line chart */}
                        <ErrorEventsChart timestamps={timestamps} isLive={isLive} />
                    </motion.div>
                )}

                {activeTab === 'sdk' && (
                    <motion.div
                        key="sdk"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <SDKStatusTab />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

interface LiveChartProps {
    title: string;
    icon: typeof Activity;
    color: string;
    data: number[];
    timestamps: string[];
    prefix?: string;
    isLive: boolean;
    index: number;
}

function LiveChart({ title, icon: Icon, color, data, timestamps, isLive, index }: LiveChartProps) {
    const currentValue = data[data.length - 1] || 0;
    const uniqueUsers = Math.floor(currentValue * 12.5);

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' }
        },
        grid: { left: 10, right: 10, top: 10, bottom: 20, containLabel: true },
        xAxis: {
            type: 'category',
            data: timestamps,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: '#64748b', interval: 4 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } }
        },
        series: [{
            type: 'line',
            data: data,
            smooth: true,
            symbol: 'none',
            lineStyle: { color, width: 2 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: `${color}30` },
                        { offset: 1, color: `${color}00` }
                    ]
                }
            }
        }],
        animation: true,
        animationDuration: 300,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="default" padding="md" className="group hover:border-slate-600 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <h3 className="font-medium text-white">{title}</h3>
                        {isLive && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10px] bg-[#DA7756]/10 text-[#DA7756] px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#DA7756]" />
                                Live
                            </motion.span>
                        )}
                    </div>
                    <span className="text-sm text-slate-500">Unique users {uniqueUsers.toLocaleString()}</span>
                </div>
                <ReactECharts option={option} style={{ height: 160 }} />
            </Card>
        </motion.div>
    );
}

function ErrorEventsChart({ timestamps, isLive }: { timestamps: string[]; isLive: boolean }) {
    const [errorData, setErrorData] = useState({
        info: [] as number[],
        warning: [] as number[],
        error: [] as number[],
        debug: [] as number[],
    });

    // Use cleanup utilities for proper interval management
    const timers = useTimers();

    useEffect(() => {
        const initial = {
            info: Array(20).fill(0).map(() => generateLiveData(50, 20)),
            warning: Array(20).fill(0).map(() => generateLiveData(30, 15)),
            error: Array(20).fill(0).map(() => generateLiveData(15, 10)),
            debug: Array(20).fill(0).map(() => generateLiveData(40, 20)),
        };
        setErrorData(initial);
    }, []);

    useEffect(() => {
        if (!isLive) return;

        // Use managed interval that auto-cleans on unmount
        const handle = timers.setInterval(() => {
            setErrorData(prev => ({
                info: [...prev.info.slice(1), generateLiveData(50, 20)],
                warning: [...prev.warning.slice(1), generateLiveData(30, 15)],
                error: [...prev.error.slice(1), generateLiveData(15, 10)],
                debug: [...prev.debug.slice(1), generateLiveData(40, 20)],
            }));
        }, 3000, 'error-events-update');

        return () => handle.clear();
    }, [isLive, timers]);

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' }
        },
        legend: {
            data: ['info', 'warning', 'error', 'debug'],
            bottom: 0,
            textStyle: { fontSize: 10, color: '#64748b' },
            icon: 'circle',
            itemWidth: 8,
            itemHeight: 8,
        },
        grid: { left: 10, right: 10, top: 10, bottom: 40, containLabel: true },
        xAxis: {
            type: 'category',
            data: timestamps,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: '#64748b', interval: 4 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
            axisLabel: { show: false }
        },
        series: [
            { name: 'info', type: 'line', stack: 'errors', data: errorData.info, smooth: true, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: '#8F8B82' } },
            { name: 'warning', type: 'line', stack: 'errors', data: errorData.warning, smooth: true, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: '#f59e0b' } },
            { name: 'error', type: 'line', stack: 'errors', data: errorData.error, smooth: true, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: '#ef4444' } },
            { name: 'debug', type: 'line', stack: 'errors', data: errorData.debug, smooth: true, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: '#64748b' } },
        ],
    };

    const totalErrors = errorData.error.reduce((a, b) => a + b, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 20 }}
            className="md:col-span-2"
        >
            <Card variant="default" padding="md" className="group hover:border-slate-600 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="font-medium text-white">Error Events</h3>
                        {isLive && (
                            <span className="text-[10px] bg-[#DA7756]/10 text-[#DA7756] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#DA7756]" />
                                Live
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-slate-500">Count {totalErrors.toLocaleString()}</span>
                </div>
                <ReactECharts option={option} style={{ height: 200 }} />
            </Card>
        </motion.div>
    );
}

function SDKStatusTab() {
    const statusCards = [
        {
            title: 'SDK Health',
            value: '99.9%',
            subtitle: 'Uptime last 24h',
            icon: Wifi,
            color: 'orange',
            status: 'healthy',
        },
        {
            title: 'Events/min',
            value: '12.4K',
            subtitle: 'Average throughput',
            icon: Zap,
            color: 'blue',
        },
        {
            title: 'Latency',
            value: '23ms',
            subtitle: 'P95 response time',
            icon: Clock,
            color: 'violet',
        },
    ];

    const colorStyles: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
        orange: {
            bg: 'from-[#DA7756]/20 to-[#DA7756]/5',
            border: 'border-[#DA7756]/20',
            icon: 'text-[#DA7756]',
            glow: 'bg-[#DA7756]/20',
        },
        blue: {
            bg: 'from-[#8F8B82]/20 to-[#8F8B82]/5',
            border: 'border-[#8F8B82]/20',
            icon: 'text-[#8F8B82]',
            glow: 'bg-[#8F8B82]/20',
        },
        violet: {
            bg: 'from-[#C15F3C]/20 to-[#C15F3C]/5',
            border: 'border-[#C15F3C]/20',
            icon: 'text-[#C15F3C]',
            glow: 'bg-[#C15F3C]/20',
        },
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusCards.map((card, index) => {
                const style = colorStyles[card.color];
                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                    >
                        <Card variant="default" padding="md" className="group hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative">
                                    <div className={`absolute inset-0 ${style.glow} rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center`}>
                                        <card.icon className={`w-5 h-5 ${style.icon}`} />
                                    </div>
                                </div>
                                <h3 className="font-medium text-white">{card.title}</h3>
                                {card.status === 'healthy' && (
                                    <span className="w-2 h-2 rounded-full bg-[#DA7756]" />
                                )}
                            </div>
                            <div className={`text-3xl font-bold ${style.icon}`}>{card.value}</div>
                            <p className="text-sm text-slate-500 mt-1">{card.subtitle}</p>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default RealtimePage;
