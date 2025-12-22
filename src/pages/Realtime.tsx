/**
 * Realtime Page - Live Analytics Dashboard
 * Shows live updating charts for real-time monitoring
 */

import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Activity, Users, UserPlus, DollarSign, Repeat, PlayCircle, AlertTriangle, RefreshCw } from 'lucide-react';

// Simulated live data generator
function generateLiveData(base: number, variance: number) {
    return Math.floor(base + (Math.random() - 0.5) * variance);
}

// Live chart configurations
const liveCharts = [
    { id: 'newUsers', title: 'New Users', icon: UserPlus, color: '#8b5cf6', baseValue: 280, variance: 100 },
    { id: 'activeUsers', title: 'Active Users', icon: Users, color: '#6366f1', baseValue: 420, variance: 150 },
    { id: 'returningUsers', title: 'Returning Users', icon: Repeat, color: '#06b6d4', baseValue: 180, variance: 80 },
    { id: 'revenue', title: 'Revenue', icon: DollarSign, color: '#10b981', baseValue: 150, variance: 100, prefix: '$' },
    { id: 'transactions', title: 'Transactions', icon: Activity, color: '#f59e0b', baseValue: 28, variance: 15 },
    { id: 'sessions', title: 'Session Count', icon: PlayCircle, color: '#ec4899', baseValue: 850, variance: 200 },
];

export function RealtimePage() {
    const [activeTab, setActiveTab] = useState<'live' | 'sdk'>('live');
    const [chartData, setChartData] = useState<Record<string, number[]>>({});
    const [timestamps, setTimestamps] = useState<string[]>([]);
    const [isLive, setIsLive] = useState(true);

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

    // Live updates
    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            const newTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

            setTimestamps(prev => [...prev.slice(1), newTime]);
            setChartData(prev => {
                const updated = { ...prev };
                liveCharts.forEach(chart => {
                    updated[chart.id] = [...(prev[chart.id] || []).slice(1), generateLiveData(chart.baseValue, chart.variance)];
                });
                return updated;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [isLive]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-violet-600" />
                        Realtime
                    </h1>
                </div>
                <button
                    onClick={() => setIsLive(!isLive)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <RefreshCw className={`w-4 h-4 ${isLive ? 'animate-spin' : ''}`} />
                    {isLive ? 'Live' : 'Paused'}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'live'
                                ? 'border-violet-600 text-violet-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        Live Events
                    </button>
                    <button
                        onClick={() => setActiveTab('sdk')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sdk'
                                ? 'border-violet-600 text-violet-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        SDK Status
                    </button>
                </div>
            </div>

            {activeTab === 'live' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {liveCharts.map(chart => (
                        <LiveChart
                            key={chart.id}
                            title={chart.title}
                            icon={chart.icon}
                            color={chart.color}
                            data={chartData[chart.id] || []}
                            timestamps={timestamps}
                            prefix={chart.prefix}
                            isLive={isLive}
                        />
                    ))}

                    {/* Error Events - Special multi-line chart */}
                    <ErrorEventsChart timestamps={timestamps} isLive={isLive} />
                </div>
            )}

            {activeTab === 'sdk' && (
                <SDKStatusTab />
            )}
        </div>
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
}

function LiveChart({ title, icon: Icon, color, data, timestamps, prefix = '', isLive }: LiveChartProps) {
    const currentValue = data[data.length - 1] || 0;
    const uniqueUsers = Math.floor(currentValue * 12.5);

    const option = {
        tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#e5e7eb', textStyle: { color: '#374151' } },
        grid: { left: 10, right: 10, top: 10, bottom: 20, containLabel: true },
        xAxis: {
            type: 'category',
            data: timestamps,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: '#9ca3af', interval: 4 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
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
                        { offset: 0, color: `${color}20` },
                        { offset: 1, color: `${color}00` }
                    ]
                }
            }
        }],
        animation: true,
        animationDuration: 300,
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{title}</h3>
                    <span className="text-xs text-gray-400">ⓘ</span>
                    {isLive && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                        </span>
                    )}
                </div>
                <span className="text-sm text-gray-500">Unique users {uniqueUsers.toLocaleString()}</span>
            </div>
            <ReactECharts option={option} style={{ height: 160 }} />
        </div>
    );
}

function ErrorEventsChart({ timestamps, isLive }: { timestamps: string[]; isLive: boolean }) {
    const [errorData, setErrorData] = useState({
        info: [] as number[],
        warning: [] as number[],
        error: [] as number[],
        debug: [] as number[],
    });

    useEffect(() => {
        // Initialize with random data
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
        const interval = setInterval(() => {
            setErrorData(prev => ({
                info: [...prev.info.slice(1), generateLiveData(50, 20)],
                warning: [...prev.warning.slice(1), generateLiveData(30, 15)],
                error: [...prev.error.slice(1), generateLiveData(15, 10)],
                debug: [...prev.debug.slice(1), generateLiveData(40, 20)],
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, [isLive]);

    const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['info', 'warning', 'error', 'debug'], bottom: 0, textStyle: { fontSize: 10 } },
        grid: { left: 10, right: 10, top: 10, bottom: 40, containLabel: true },
        xAxis: {
            type: 'category',
            data: timestamps,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: '#9ca3af', interval: 4 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
            axisLabel: { show: false }
        },
        series: [
            { name: 'info', type: 'line', stack: 'errors', data: errorData.info, smooth: true, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: '#3b82f6' } },
            { name: 'warning', type: 'line', stack: 'errors', data: errorData.warning, smooth: true, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: '#f59e0b' } },
            { name: 'error', type: 'line', stack: 'errors', data: errorData.error, smooth: true, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: '#ef4444' } },
            { name: 'debug', type: 'line', stack: 'errors', data: errorData.debug, smooth: true, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: '#6b7280' } },
        ],
    };

    const totalErrors = errorData.error.reduce((a, b) => a + b, 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <h3 className="font-medium text-gray-900">Error Events</h3>
                    {isLive && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                        </span>
                    )}
                </div>
                <span className="text-sm text-gray-500">Count {totalErrors.toLocaleString()}</span>
            </div>
            <ReactECharts option={option} style={{ height: 200 }} />
        </div>
    );
}

function SDKStatusTab() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <h3 className="font-medium text-gray-900">SDK Health</h3>
                </div>
                <div className="text-3xl font-bold text-green-600">99.9%</div>
                <p className="text-sm text-gray-500 mt-1">Uptime last 24h</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <h3 className="font-medium text-gray-900">Events/min</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600">12.4K</div>
                <p className="text-sm text-gray-500 mt-1">Average throughput</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <h3 className="font-medium text-gray-900">Latency</h3>
                </div>
                <div className="text-3xl font-bold text-violet-600">23ms</div>
                <p className="text-sm text-gray-500 mt-1">P95 response time</p>
            </div>
        </div>
    );
}

export default RealtimePage;
