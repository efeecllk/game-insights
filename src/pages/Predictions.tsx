/**
 * Predictions Dashboard
 * AI-powered predictive analytics and recommendations
 * Phase 5: Advanced AI & Automation
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    AlertTriangle,
    Lightbulb,
    Target,
    Clock,
    ChevronRight,
    RefreshCw,
    Bell,
    BarChart3,
    Brain,
    Zap,
} from 'lucide-react';

// Types
interface RevenueForecast {
    date: string;
    projected: number;
    low: number;
    high: number;
}

interface ChurnRiskUser {
    id: string;
    name: string;
    riskScore: number;
    lastSeen: string;
    factors: string[];
}

interface Recommendation {
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: string;
    effort: string;
}

interface Alert {
    id: string;
    type: 'warning' | 'opportunity' | 'info';
    title: string;
    message: string;
    timestamp: string;
}

// Mock data generators
const generateForecast = (): RevenueForecast[] => {
    const forecast: RevenueForecast[] = [];
    const baseRevenue = 3500;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const variation = Math.random() * 0.2 - 0.1;
        const trend = 1 + (i * 0.003);
        const projected = baseRevenue * trend * (1 + variation);

        forecast.push({
            date: date.toISOString().slice(0, 10),
            projected: Math.round(projected),
            low: Math.round(projected * 0.8),
            high: Math.round(projected * 1.2),
        });
    }
    return forecast;
};

const generateChurnRiskUsers = (): ChurnRiskUser[] => [
    {
        id: '1',
        name: 'User #12847',
        riskScore: 0.89,
        lastSeen: '3 days ago',
        factors: ['Declining sessions', 'Stuck at level 15'],
    },
    {
        id: '2',
        name: 'User #8923',
        riskScore: 0.78,
        lastSeen: '5 days ago',
        factors: ['No recent purchases', 'Low engagement'],
    },
    {
        id: '3',
        name: 'User #4521',
        riskScore: 0.72,
        lastSeen: '2 days ago',
        factors: ['Session length dropping'],
    },
];

const generateRecommendations = (): Recommendation[] => [
    {
        id: '1',
        priority: 'high',
        category: 'Retention',
        title: 'Improve Level 12 Experience',
        description: 'Level 12 shows 45% drop-off rate. Consider reducing difficulty or adding hints.',
        impact: '+15% D7 retention',
        effort: 'Medium',
    },
    {
        id: '2',
        priority: 'high',
        category: 'Monetization',
        title: 'Launch Starter Pack Campaign',
        description: 'Target users who completed tutorial but haven\'t purchased.',
        impact: '+$2,400/month',
        effort: 'Low',
    },
    {
        id: '3',
        priority: 'medium',
        category: 'Engagement',
        title: 'Add Daily Login Rewards',
        description: 'Implement progressive daily rewards to improve D7 retention.',
        impact: '+8% weekly retention',
        effort: 'Medium',
    },
];

const generateAlerts = (): Alert[] => [
    {
        id: '1',
        type: 'warning',
        title: 'Churn Risk Alert',
        message: '156 users showing high churn probability (>70%)',
        timestamp: '2 hours ago',
    },
    {
        id: '2',
        type: 'opportunity',
        title: 'Conversion Opportunity',
        message: '89 engaged non-payers ready for first purchase offer',
        timestamp: '4 hours ago',
    },
];

// Components
const StatCard: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
    change?: number;
    sublabel?: string;
    color?: string;
}> = ({ icon: Icon, label, value, change, sublabel, color = 'violet' }) => (
    <div className="bg-card rounded-card p-5 border border-white/5">
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg bg-${color}-500/20`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            {change !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(change)}%
                </div>
            )}
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
        {sublabel && <div className="text-xs text-gray-500 mt-1">{sublabel}</div>}
    </div>
);

const ForecastChart: React.FC<{ data: RevenueForecast[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.high));
    const total = data.reduce((sum, d) => sum + d.projected, 0);

    return (
        <div className="bg-card rounded-card p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">Revenue Forecast</h3>
                    <p className="text-sm text-gray-400">Next 30 days projection</p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold text-white">${(total / 1000).toFixed(1)}K</div>
                    <div className="text-sm text-gray-400">Projected total</div>
                </div>
            </div>

            <div className="h-48 flex items-end gap-1">
                {data.slice(0, 30).map((day, i) => {
                    const height = (day.projected / maxValue) * 100;
                    const isWeekend = new Date(day.date).getDay() % 6 === 0;

                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col justify-end"
                            title={`${day.date}: $${day.projected}`}
                        >
                            <div
                                className={`rounded-t transition-all ${isWeekend ? 'bg-violet-500/80' : 'bg-violet-500/50'
                                    } hover:bg-violet-400`}
                                style={{ height: `${height}%` }}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Today</span>
                <span>+15 days</span>
                <span>+30 days</span>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-violet-500/50" />
                    <span className="text-xs text-gray-400">Weekday</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-violet-500/80" />
                    <span className="text-xs text-gray-400">Weekend (higher)</span>
                </div>
            </div>
        </div>
    );
};

const ChurnRiskPanel: React.FC<{ users: ChurnRiskUser[] }> = ({ users }) => (
    <div className="bg-card rounded-card p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-lg font-semibold text-white">Churn Risk Users</h3>
                <p className="text-sm text-gray-400">High probability to churn</p>
            </div>
            <button className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
            </button>
        </div>

        <div className="space-y-3">
            {users.map(user => (
                <div key={user.id} className="p-3 bg-dark rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{user.name}</span>
                        <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-400">{user.lastSeen}</div>
                            <div className={`px-2 py-0.5 rounded text-xs font-medium ${user.riskScore >= 0.8
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-orange-500/20 text-orange-400'
                                }`}>
                                {(user.riskScore * 100).toFixed(0)}% risk
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.factors.map((factor, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400">
                                {factor}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <button className="w-full mt-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
            Launch Re-engagement Campaign
        </button>
    </div>
);

const RecommendationsPanel: React.FC<{ recommendations: Recommendation[] }> = ({ recommendations }) => {
    const priorityColors = {
        critical: 'border-red-500 bg-red-500/10',
        high: 'border-orange-500 bg-orange-500/10',
        medium: 'border-yellow-500 bg-yellow-500/10',
        low: 'border-blue-500 bg-blue-500/10',
    };

    const priorityIcons = {
        critical: <Zap className="w-4 h-4 text-red-400" />,
        high: <AlertTriangle className="w-4 h-4 text-orange-400" />,
        medium: <Lightbulb className="w-4 h-4 text-yellow-400" />,
        low: <Target className="w-4 h-4 text-blue-400" />,
    };

    return (
        <div className="bg-card rounded-card p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
                    <p className="text-sm text-gray-400">Actionable insights</p>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Refresh">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="space-y-3">
                {recommendations.map(rec => (
                    <div
                        key={rec.id}
                        className={`p-4 rounded-lg border-l-4 ${priorityColors[rec.priority]}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">{priorityIcons[rec.priority]}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-400">
                                        {rec.category}
                                    </span>
                                </div>
                                <h4 className="text-white font-medium mb-1">{rec.title}</h4>
                                <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="text-green-400">Impact: {rec.impact}</span>
                                    <span className="text-gray-500">Effort: {rec.effort}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AlertsPanel: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
    const alertStyles = {
        warning: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        opportunity: { icon: Lightbulb, color: 'text-green-400', bg: 'bg-green-500/10' },
        info: { icon: Bell, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    };

    return (
        <div className="bg-card rounded-card p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-white">Intelligent Alerts</h3>
                </div>
                <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                    {alerts.length} active
                </span>
            </div>

            <div className="space-y-3">
                {alerts.map(alert => {
                    const style = alertStyles[alert.type];
                    const Icon = style.icon;

                    return (
                        <div key={alert.id} className={`p-3 rounded-lg ${style.bg}`}>
                            <div className="flex items-start gap-3">
                                <Icon className={`w-5 h-5 ${style.color} mt-0.5`} />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-white font-medium">{alert.title}</h4>
                                        <span className="text-xs text-gray-500">{alert.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">{alert.message}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const WhatIfAnalysis: React.FC = () => {
    const [dauChange, setDauChange] = useState(0);
    const [arpuChange, setArpuChange] = useState(0);
    const baseRevenue = 3500;
    const projectedChange = (1 + dauChange / 100) * (1 + arpuChange / 100) - 1;
    const projectedRevenue = baseRevenue * 30 * (1 + projectedChange);

    return (
        <div className="bg-card rounded-card p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">What-If Analysis</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                        DAU Change: {dauChange > 0 ? '+' : ''}{dauChange}%
                    </label>
                    <input
                        type="range"
                        min="-30"
                        max="30"
                        value={dauChange}
                        onChange={(e) => setDauChange(Number(e.target.value))}
                        className="w-full accent-violet-500"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                        ARPU Change: {arpuChange > 0 ? '+' : ''}{arpuChange}%
                    </label>
                    <input
                        type="range"
                        min="-30"
                        max="30"
                        value={arpuChange}
                        onChange={(e) => setArpuChange(Number(e.target.value))}
                        className="w-full accent-violet-500"
                    />
                </div>

                <div className="p-4 bg-dark rounded-lg border border-white/5">
                    <div className="text-sm text-gray-400 mb-1">Projected 30-Day Revenue</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                            ${(projectedRevenue / 1000).toFixed(1)}K
                        </span>
                        <span className={`text-sm ${projectedChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {projectedChange >= 0 ? '+' : ''}{(projectedChange * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        vs baseline ${(baseRevenue * 30 / 1000).toFixed(1)}K
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Page Component
export const PredictionsPage: React.FC = () => {
    const [forecast, setForecast] = useState<RevenueForecast[]>([]);
    const [churnUsers, setChurnUsers] = useState<ChurnRiskUser[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate data loading
        const loadData = async () => {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setForecast(generateForecast());
            setChurnUsers(generateChurnRiskUsers());
            setRecommendations(generateRecommendations());
            setAlerts(generateAlerts());
            setIsLoading(false);
        };
        loadData();
    }, []);

    const stats = useMemo(() => {
        const totalForecast = forecast.reduce((sum, d) => sum + d.projected, 0);
        return {
            revenue30d: totalForecast,
            atRiskUsers: 156,
            opportunities: 89,
            modelAccuracy: 87,
        };
    }, [forecast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading predictions...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Predictions</h1>
                    <p className="text-gray-400 mt-1">AI-powered insights and forecasts</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors">
                        <Clock className="w-4 h-4" />
                        <span>Last updated: 5 min ago</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={DollarSign}
                    label="30-Day Revenue Projection"
                    value={`$${(stats.revenue30d / 1000).toFixed(1)}K`}
                    change={12}
                    sublabel="High confidence"
                    color="green"
                />
                <StatCard
                    icon={Users}
                    label="At-Risk Users"
                    value={stats.atRiskUsers.toString()}
                    sublabel=">70% churn probability"
                    color="orange"
                />
                <StatCard
                    icon={Target}
                    label="Conversion Opportunities"
                    value={stats.opportunities.toString()}
                    sublabel="High-intent non-payers"
                    color="blue"
                />
                <StatCard
                    icon={BarChart3}
                    label="Model Accuracy"
                    value={`${stats.modelAccuracy}%`}
                    sublabel="Based on last 30 days"
                    color="violet"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Forecast */}
                <div className="lg:col-span-2 space-y-6">
                    <ForecastChart data={forecast} />
                    <RecommendationsPanel recommendations={recommendations} />
                </div>

                {/* Right Column - Alerts & Actions */}
                <div className="space-y-6">
                    <AlertsPanel alerts={alerts} />
                    <ChurnRiskPanel users={churnUsers} />
                    <WhatIfAnalysis />
                </div>
            </div>
        </div>
    );
};

export default PredictionsPage;
