/**
 * Predictions Dashboard - Obsidian Analytics Design
 *
 * Premium AI-powered analytics with:
 * - Glassmorphism containers
 * - Warm orange accent theme
 * - Animated entrance effects
 * - Enhanced chart styling
 * - Noise texture backgrounds
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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
    Database,
} from 'lucide-react';
import { useGameData } from '../hooks/useGameData';
import { useML } from '../context/MLContext';
import DataModeIndicator from '../components/ui/DataModeIndicator';
import { ChurnRiskTable, RevenueForecastChart, MLStatusBadge } from '../components/ml';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
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

// Mock data generators
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
    color?: 'orange' | 'amber' | 'sky' | 'violet';
    index?: number;
}> = ({ icon: Icon, label, value, change, sublabel, color = 'orange' }) => {
    const colorStyles = {
        orange: {
            bg: 'from-[#DA7756]/20 to-[#DA7756]/5',
            border: 'border-[#DA7756]/20 group-hover:border-[#DA7756]/30',
            icon: 'text-[#DA7756]',
            glow: 'bg-[#DA7756]/20',
        },
        amber: {
            bg: 'from-amber-500/20 to-amber-500/5',
            border: 'border-amber-500/20 group-hover:border-amber-500/30',
            icon: 'text-amber-400',
            glow: 'bg-amber-500/20',
        },
        sky: {
            bg: 'from-sky-500/20 to-sky-500/5',
            border: 'border-sky-500/20 group-hover:border-sky-500/30',
            icon: 'text-sky-400',
            glow: 'bg-sky-500/20',
        },
        violet: {
            bg: 'from-violet-500/20 to-violet-500/5',
            border: 'border-violet-500/20 group-hover:border-violet-500/30',
            icon: 'text-violet-400',
            glow: 'bg-violet-500/20',
        },
    };

    const styles = colorStyles[color];

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            className="relative group"
        >
            <div className={`absolute -inset-0.5 ${styles.glow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
            <div className={`relative bg-gradient-to-br ${styles.bg} backdrop-blur-xl rounded-2xl p-5 border ${styles.border} transition-all duration-300 overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg bg-white/[0.05] border border-white/[0.08]`}>
                            <Icon className={`w-5 h-5 ${styles.icon}`} />
                        </div>
                        {change !== undefined && (
                            <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-[#DA7756]' : 'text-rose-400'}`}>
                                {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {Math.abs(change)}%
                            </div>
                        )}
                    </div>
                    <div className="text-2xl font-display font-bold text-white mb-1">{value}</div>
                    <div className="text-sm text-slate-400">{label}</div>
                    {sublabel && <div className="text-xs text-slate-600 mt-1">{sublabel}</div>}
                </div>
            </div>
        </motion.div>
    );
};

const ForecastChart: React.FC<{ data: RevenueForecast[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.high));
    const total = data.reduce((sum, d) => sum + d.projected, 0);

    return (
        <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-[#DA7756]" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold text-white">Revenue Forecast</h3>
                        <p className="text-sm text-slate-500">Next 30 days projection</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-display font-bold text-white">${(total / 1000).toFixed(1)}K</div>
                    <div className="text-sm text-slate-500">Projected total</div>
                </div>
            </div>

            <div className="h-48 flex items-end gap-1">
                {data.slice(0, 30).map((day, i) => {
                    const height = (day.projected / maxValue) * 100;
                    const isWeekend = new Date(day.date).getDay() % 6 === 0;

                    return (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.02, type: 'spring', stiffness: 300, damping: 20 }}
                            className="flex-1 flex flex-col justify-end"
                            title={`${day.date}: $${day.projected}`}
                        >
                            <div
                                className={`w-full rounded-t transition-all cursor-pointer ${
                                    isWeekend
                                        ? 'bg-[#DA7756]/80 hover:bg-[#DA7756]'
                                        : 'bg-[#DA7756]/50 hover:bg-[#DA7756]/70'
                                }`}
                                style={{ height: '100%' }}
                            />
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex justify-between mt-2 text-xs text-slate-600">
                <span>Today</span>
                <span>+15 days</span>
                <span>+30 days</span>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#DA7756]/50" />
                    <span className="text-xs text-slate-500">Weekday</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#DA7756]/80" />
                    <span className="text-xs text-slate-500">Weekend (higher)</span>
                </div>
            </div>
        </Card>
    );
};

const ChurnRiskPanel: React.FC<{ users: ChurnRiskUser[] }> = ({ users }) => (
    <Card variant="default" padding="lg">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                    <h3 className="font-display font-semibold text-white">Churn Risk Users</h3>
                    <p className="text-sm text-slate-500">High probability to churn</p>
                </div>
            </div>
            <motion.button
                whileHover={{ x: 4 }}
                className="text-sm text-[#DA7756] hover:text-[#E08B6D] flex items-center gap-1"
            >
                View All <ChevronRight className="w-4 h-4" />
            </motion.button>
        </div>

        <div className="space-y-3">
            {users.map((user, index) => (
                <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-slate-900/50 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{user.name}</span>
                        <div className="flex items-center gap-2">
                            <div className="text-sm text-slate-500">{user.lastSeen}</div>
                            <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                                user.riskScore >= 0.8
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                            }`}>
                                {(user.riskScore * 100).toFixed(0)}% risk
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.factors.map((factor, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-400">
                                {factor}
                            </span>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>

        <Button variant="primary" fullWidth className="mt-4">
            Launch Re-engagement Campaign
        </Button>
    </Card>
);

const RecommendationsPanel: React.FC<{ recommendations: Recommendation[] }> = ({ recommendations }) => {
    const priorityStyles = {
        critical: {
            border: 'border-rose-500/30',
            bg: 'bg-rose-500/5',
            icon: <Zap className="w-4 h-4 text-rose-400" />,
        },
        high: {
            border: 'border-amber-500/30',
            bg: 'bg-amber-500/5',
            icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        },
        medium: {
            border: 'border-yellow-500/30',
            bg: 'bg-yellow-500/5',
            icon: <Lightbulb className="w-4 h-4 text-yellow-400" />,
        },
        low: {
            border: 'border-sky-500/30',
            bg: 'bg-sky-500/5',
            icon: <Target className="w-4 h-4 text-sky-400" />,
        },
    };

    return (
        <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold text-white">AI Recommendations</h3>
                        <p className="text-sm text-slate-500">Actionable insights</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                </motion.button>
            </div>

            <div className="space-y-3">
                {recommendations.map((rec, index) => {
                    const style = priorityStyles[rec.priority];
                    return (
                        <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-xl border-l-4 ${style.border} ${style.bg}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">{style.icon}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded text-slate-400">
                                            {rec.category}
                                        </span>
                                    </div>
                                    <h4 className="text-white font-medium mb-1">{rec.title}</h4>
                                    <p className="text-sm text-slate-400 mb-2">{rec.description}</p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-[#DA7756]">Impact: {rec.impact}</span>
                                        <span className="text-slate-600">Effort: {rec.effort}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </Card>
    );
};

const AlertsPanel: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
    const alertStyles = {
        warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        opportunity: { icon: Lightbulb, color: 'text-[#DA7756]', bg: 'bg-[#DA7756]/10', border: 'border-[#DA7756]/20' },
        info: { icon: Bell, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    };

    return (
        <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-[#DA7756]" />
                    </div>
                    <h3 className="font-display font-semibold text-white">Intelligent Alerts</h3>
                </div>
                <span className="text-xs px-2 py-1 bg-[#DA7756]/10 border border-[#DA7756]/20 text-[#DA7756] rounded-full">
                    {alerts.length} active
                </span>
            </div>

            <div className="space-y-3">
                {alerts.map((alert, index) => {
                    const style = alertStyles[alert.type];
                    const Icon = style.icon;

                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 rounded-xl ${style.bg} border ${style.border}`}
                        >
                            <div className="flex items-start gap-3">
                                <Icon className={`w-5 h-5 ${style.color} mt-0.5`} />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-white font-medium">{alert.title}</h4>
                                        <span className="text-xs text-slate-600">{alert.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-slate-400">{alert.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </Card>
    );
};

const WhatIfAnalysis: React.FC = () => {
    const [dauChange, setDauChange] = useState(0);
    const [arpuChange, setArpuChange] = useState(0);
    const baseRevenue = 3500;
    const projectedChange = (1 + dauChange / 100) * (1 + arpuChange / 100) - 1;
    const projectedRevenue = baseRevenue * 30 * (1 + projectedChange);

    return (
        <Card variant="default" padding="lg">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="font-display font-semibold text-white">What-If Analysis</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                        DAU Change: <span className="text-[#DA7756]">{dauChange > 0 ? '+' : ''}{dauChange}%</span>
                    </label>
                    <input
                        type="range"
                        min="-30"
                        max="30"
                        value={dauChange}
                        onChange={(e) => setDauChange(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-[#DA7756]"
                    />
                </div>

                <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                        ARPU Change: <span className="text-[#DA7756]">{arpuChange > 0 ? '+' : ''}{arpuChange}%</span>
                    </label>
                    <input
                        type="range"
                        min="-30"
                        max="30"
                        value={arpuChange}
                        onChange={(e) => setArpuChange(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-[#DA7756]"
                    />
                </div>

                <div className="p-4 bg-slate-900/50 rounded-xl border border-white/[0.04]">
                    <div className="text-sm text-slate-400 mb-1">Projected 30-Day Revenue</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-display font-bold text-white">
                            ${(projectedRevenue / 1000).toFixed(1)}K
                        </span>
                        <span className={`text-sm ${projectedChange >= 0 ? 'text-[#DA7756]' : 'text-rose-400'}`}>
                            {projectedChange >= 0 ? '+' : ''}{(projectedChange * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                        vs baseline ${(baseRevenue * 30 / 1000).toFixed(1)}K
                    </div>
                </div>
            </div>
        </Card>
    );
};

// Main Page Component
export const PredictionsPage: React.FC = () => {
    const { dataProvider, hasRealData } = useGameData();
    const {
        isReady: mlReady,
        isTraining,
        atRiskUsers: mlAtRiskUsers,
        revenueForecast: mlRevenueForecast,
        churnPredictions,
        status: mlStatus,
    } = useML();
    const [forecast, setForecast] = useState<RevenueForecast[]>([]);
    const [churnUsers, setChurnUsers] = useState<ChurnRiskUser[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const useMLPredictions = mlReady && hasRealData;

    const generateRealDataForecast = useMemo((): RevenueForecast[] => {
        const forecast: RevenueForecast[] = [];
        const today = new Date();
        const baseRevenue = hasRealData
            ? dataProvider.getTotalRevenue() / 30
            : 3500;
        const growthRate = hasRealData
            ? dataProvider.getHistoricalGrowthRate() / 100
            : 0.003;

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const variation = Math.random() * 0.2 - 0.1;
            const trend = 1 + (i * growthRate);
            const projected = baseRevenue * trend * (1 + variation);

            forecast.push({
                date: date.toISOString().slice(0, 10),
                projected: Math.round(projected),
                low: Math.round(projected * 0.8),
                high: Math.round(projected * 1.2),
            });
        }
        return forecast;
    }, [hasRealData, dataProvider]);

    const mlChurnUsersFormatted = useMemo((): ChurnRiskUser[] => {
        if (!mlReady || mlAtRiskUsers.length === 0) return [];
        return mlAtRiskUsers.slice(0, 5).map(prediction => ({
            id: prediction.userId,
            name: `User #${prediction.userId.slice(0, 6)}`,
            riskScore: prediction.value,
            lastSeen: prediction.daysUntilChurn
                ? `May churn in ${prediction.daysUntilChurn} days`
                : 'At risk',
            factors: prediction.factors?.map(f => f.name) || ['Activity declining'],
        }));
    }, [mlReady, mlAtRiskUsers]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setForecast(generateRealDataForecast);
            setChurnUsers(useMLPredictions ? mlChurnUsersFormatted : generateChurnRiskUsers());
            setRecommendations(generateRecommendations());
            setAlerts(generateAlerts());
            setIsLoading(false);
        };
        loadData();
    }, [generateRealDataForecast, useMLPredictions, mlChurnUsersFormatted]);

    const stats = useMemo(() => {
        const totalForecast = useMLPredictions && mlRevenueForecast.length > 0
            ? mlRevenueForecast.reduce((sum, d) => sum + d.value, 0)
            : forecast.reduce((sum, d) => sum + d.projected, 0);

        const atRiskCount = useMLPredictions
            ? churnPredictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length
            : hasRealData ? Math.round(dataProvider.getDAU() * 0.0156) : 156;

        const dau = hasRealData ? dataProvider.getDAU() : 10000;
        const opportunities = Math.round(dau * 0.0089);

        const accuracy = mlStatus.modelMetrics.churn?.accuracy
            ? Math.round(mlStatus.modelMetrics.churn.accuracy * 100)
            : 87;

        return {
            revenue30d: totalForecast,
            atRiskUsers: atRiskCount,
            opportunities: hasRealData ? opportunities : 89,
            modelAccuracy: accuracy,
        };
    }, [forecast, hasRealData, dataProvider, useMLPredictions, mlRevenueForecast, churnPredictions, mlStatus]);

    if (isTraining) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64"
            >
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-violet-500/30 rounded-2xl blur-xl" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-center">
                            <Brain className="w-8 h-8 text-violet-400" />
                        </div>
                    </motion.div>
                    <div className="text-center">
                        <div className="text-lg font-medium text-white">Training ML Models</div>
                        <div className="text-slate-500">Analyzing your data for predictions...</div>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64"
            >
                <div className="flex items-center gap-3 text-slate-500">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <RefreshCw className="w-5 h-5" />
                    </motion.div>
                    <span>Loading predictions...</span>
                </div>
            </motion.div>
        );
    }

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
                                <div className="absolute inset-0 bg-violet-500/30 rounded-xl blur-lg" />
                                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center">
                                    <Brain className="w-6 h-6 text-violet-400" />
                                </div>
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                        Predictions
                                    </h1>
                                    <DataModeIndicator />
                                    <MLStatusBadge />
                                </div>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    {useMLPredictions
                                        ? 'ML-powered forecasts from trained models'
                                        : hasRealData
                                            ? 'AI-powered forecasts based on your data'
                                            : 'AI-powered insights and forecasts (demo data)'}
                                </p>
                                {useMLPredictions && (
                                    <div className="flex items-center gap-2 mt-1 text-xs text-violet-400">
                                        <Brain className="w-3.5 h-3.5" />
                                        ML models trained on {mlStatus.dataPointsUsed.toLocaleString()} data points
                                    </div>
                                )}
                                {hasRealData && !useMLPredictions && (
                                    <div className="flex items-center gap-2 mt-1 text-xs text-[#DA7756]">
                                        <Database className="w-3.5 h-3.5" />
                                        Predictions generated from your uploaded data
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.06] hover:border-white/[0.12] transition-colors"
                            >
                                <Clock className="w-4 h-4" />
                                <span>Last updated: {mlStatus.lastTrainedAt ? new Date(mlStatus.lastTrainedAt).toLocaleTimeString() : '5 min ago'}</span>
                            </motion.button>
                            <Button variant="primary" icon={<RefreshCw className="w-4 h-4" />}>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={DollarSign}
                    label="30-Day Revenue Projection"
                    value={`$${(stats.revenue30d / 1000).toFixed(1)}K`}
                    change={12}
                    sublabel="High confidence"
                    color="orange"
                />
                <StatCard
                    icon={Users}
                    label="At-Risk Users"
                    value={stats.atRiskUsers.toString()}
                    sublabel=">70% churn probability"
                    color="amber"
                />
                <StatCard
                    icon={Target}
                    label="Conversion Opportunities"
                    value={stats.opportunities.toString()}
                    sublabel="High-intent non-payers"
                    color="sky"
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
                    <motion.div variants={itemVariants}>
                        {useMLPredictions && mlRevenueForecast.length > 0 ? (
                            <Card variant="default" padding="lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <h3 className="font-display font-semibold text-white">ML Revenue Forecast</h3>
                                    <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-full">
                                        ML Powered
                                    </span>
                                </div>
                                <RevenueForecastChart
                                    forecast={mlRevenueForecast}
                                    showConfidenceInterval
                                    height={280}
                                />
                            </Card>
                        ) : (
                            <ForecastChart data={forecast} />
                        )}
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <RecommendationsPanel recommendations={recommendations} />
                    </motion.div>
                </div>

                {/* Right Column - Alerts & Actions */}
                <div className="space-y-6">
                    <motion.div variants={itemVariants}>
                        <AlertsPanel alerts={alerts} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        {useMLPredictions && mlAtRiskUsers.length > 0 ? (
                            <Card variant="default" padding="lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                                    </div>
                                    <h3 className="font-display font-semibold text-white">ML Churn Risk</h3>
                                    <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-full">
                                        ML Powered
                                    </span>
                                </div>
                                <ChurnRiskTable users={mlAtRiskUsers} maxRows={5} />
                            </Card>
                        ) : (
                            <ChurnRiskPanel users={churnUsers} />
                        )}
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <WhatIfAnalysis />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default PredictionsPage;
