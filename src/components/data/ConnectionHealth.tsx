/**
 * Connection Health Dashboard - Obsidian Analytics Design
 *
 * Premium health monitoring with:
 * - Glassmorphism containers
 * - Animated health indicators
 * - Color-coded status variants
 * - Expandable detail panels
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Zap,
    Pause,
    XCircle,
    ChevronDown,
    ExternalLink,
    Settings,
    BarChart3,
} from 'lucide-react';
import { useIntegrations } from '../../context/IntegrationContext';
import {
    Integration,
    IntegrationStatus,
    INTEGRATION_CATALOG,
    formatLastSync,
    getIntegrationIcon,
} from '../../lib/integrationStore';

// ============================================================================
// Types
// ============================================================================

interface HealthMetrics {
    uptime: number; // percentage
    avgSyncDuration: number; // ms
    errorRate: number; // percentage
    lastError?: string;
    lastErrorAt?: string;
    syncHistory: SyncHistoryItem[];
}

interface SyncHistoryItem {
    timestamp: string;
    success: boolean;
    duration: number;
    rowCount: number;
    error?: string;
}

// ============================================================================
// Animation Variants
// ============================================================================

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
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

const expandVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
        opacity: 0,
        height: 0,
        transition: { duration: 0.2 },
    },
};

// ============================================================================
// Main Component
// ============================================================================

export function ConnectionHealth() {
    const { integrations, refreshIntegration, pauseIntegration, resumeIntegration } = useIntegrations();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'healthy' | 'warning' | 'error'>('all');

    // Calculate overall health
    const overallHealth = useMemo(() => {
        if (integrations.length === 0) return { score: 100, status: 'healthy' as const };

        const healthyCount = integrations.filter(i => i.status === 'connected').length;
        const errorCount = integrations.filter(i => i.status === 'error').length;
        const pausedCount = integrations.filter(i => i.status === 'paused').length;

        const activeCount = integrations.length - pausedCount;
        const score = activeCount > 0 ? Math.round((healthyCount / activeCount) * 100) : 100;

        let status: 'healthy' | 'warning' | 'error' = 'healthy';
        if (errorCount > 0) status = 'error';
        else if (score < 100) status = 'warning';

        return { score, status, healthyCount, errorCount, pausedCount };
    }, [integrations]);

    // Filter integrations
    const filteredIntegrations = useMemo(() => {
        return integrations.filter(i => {
            if (filter === 'all') return true;
            if (filter === 'healthy') return i.status === 'connected';
            if (filter === 'warning') return i.status === 'syncing' || i.status === 'paused';
            if (filter === 'error') return i.status === 'error' || i.status === 'disconnected';
            return true;
        });
    }, [integrations, filter]);

    if (integrations.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 text-center"
            >
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl blur-xl" />
                    <div className="relative w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                        <Activity className="w-8 h-8 text-slate-400" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                    No Data Sources Connected
                </h3>
                <p className="text-slate-400">
                    Connect your first data source to see health metrics here.
                </p>
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
            {/* Overall Health Summary */}
            <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Connection Health
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Real-time status of all your data sources
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => integrations.forEach(i => refreshIntegration(i.id))}
                        className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] rounded-xl text-sm text-slate-300 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh All
                    </motion.button>
                </div>

                {/* Health Score Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <HealthScoreCard score={overallHealth.score} status={overallHealth.status} />
                    <MetricCard
                        icon={<CheckCircle className="w-5 h-5 text-[#DA7756]" />}
                        label="Healthy"
                        value={overallHealth.healthyCount ?? 0}
                        color="orange"
                    />
                    <MetricCard
                        icon={<AlertCircle className="w-5 h-5 text-rose-400" />}
                        label="Errors"
                        value={overallHealth.errorCount ?? 0}
                        color="rose"
                    />
                    <MetricCard
                        icon={<Pause className="w-5 h-5 text-amber-400" />}
                        label="Paused"
                        value={overallHealth.pausedCount ?? 0}
                        color="amber"
                    />
                </div>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div variants={itemVariants} className="flex items-center gap-2">
                {(['all', 'healthy', 'warning', 'error'] as const).map(f => (
                    <motion.button
                        key={f}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            filter === f
                                ? 'bg-[#DA7756]/20 border border-[#DA7756]/30 text-[#DA7756]'
                                : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== 'all' && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                filter === f ? 'bg-[#DA7756]/20' : 'bg-white/[0.06]'
                            }`}>
                                {f === 'healthy'
                                    ? integrations.filter(i => i.status === 'connected').length
                                    : f === 'warning'
                                    ? integrations.filter(i => ['syncing', 'paused'].includes(i.status)).length
                                    : integrations.filter(i => ['error', 'disconnected'].includes(i.status)).length}
                            </span>
                        )}
                    </motion.button>
                ))}
            </motion.div>

            {/* Integration List */}
            <motion.div variants={containerVariants} className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredIntegrations.map(integration => (
                        <motion.div
                            key={integration.id}
                            variants={itemVariants}
                            layout
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <IntegrationHealthCard
                                integration={integration}
                                isExpanded={expandedId === integration.id}
                                onToggle={() => setExpandedId(expandedId === integration.id ? null : integration.id)}
                                onRefresh={() => refreshIntegration(integration.id)}
                                onPause={() => pauseIntegration(integration.id)}
                                onResume={() => resumeIntegration(integration.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredIntegrations.length === 0 && (
                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 text-center"
                    >
                        <p className="text-slate-400">No integrations match this filter.</p>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function HealthScoreCard({ score, status }: { score: number; status: 'healthy' | 'warning' | 'error' }) {
    const colors = {
        healthy: {
            ring: 'stroke-[#DA7756]',
            text: 'text-[#DA7756]',
            bg: 'from-[#DA7756]/20 to-[#DA7756]/5',
            border: 'border-[#DA7756]/20',
            glow: 'shadow-[#DA7756]/20',
        },
        warning: {
            ring: 'stroke-amber-500',
            text: 'text-amber-400',
            bg: 'from-amber-500/20 to-amber-500/5',
            border: 'border-amber-500/20',
            glow: 'shadow-amber-500/20',
        },
        error: {
            ring: 'stroke-rose-500',
            text: 'text-rose-400',
            bg: 'from-rose-500/20 to-rose-500/5',
            border: 'border-rose-500/20',
            glow: 'shadow-rose-500/20',
        },
    };

    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl p-4 bg-gradient-to-br ${colors[status].bg} border ${colors[status].border} shadow-lg ${colors[status].glow}`}
        >
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="40"
                            strokeWidth="8"
                            fill="none"
                            className="stroke-white/[0.06]"
                        />
                        <motion.circle
                            cx="40"
                            cy="40"
                            r="40"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            className={colors[status].ring}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            style={{ strokeDasharray: circumference }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xl font-bold ${colors[status].text}`}>
                            {score}%
                        </span>
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-slate-400">Health Score</div>
                    <div className={`text-lg font-semibold capitalize ${colors[status].text}`}>
                        {status}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'orange' | 'rose' | 'amber';
}) {
    const colorStyles = {
        orange: 'from-[#DA7756]/10 to-[#DA7756]/5 border-[#DA7756]/20',
        rose: 'from-rose-500/10 to-rose-500/5 border-rose-500/20',
        amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 bg-gradient-to-br ${colorStyles[color]} border transition-all`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-sm text-slate-400">{label}</div>
                </div>
            </div>
        </motion.div>
    );
}

function IntegrationHealthCard({
    integration,
    isExpanded,
    onToggle,
    onRefresh,
    onPause,
    onResume,
}: {
    integration: Integration;
    isExpanded: boolean;
    onToggle: () => void;
    onRefresh: () => void;
    onPause: () => void;
    onResume: () => void;
}) {
    const catalogItem = INTEGRATION_CATALOG.find(c => c.type === integration.config.type);

    // Generate mock health metrics based on integration status
    const health = useMemo(() => generateHealthMetrics(integration), [integration]);

    const statusConfig = getStatusConfig(integration.status);

    return (
        <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
            {/* Main Row */}
            <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={onToggle}
            >
                {/* Status Indicator */}
                <motion.div
                    animate={integration.status === 'syncing' ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`w-3 h-3 rounded-full ${statusConfig.dotColor}`}
                />

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-xl">
                    {getIntegrationIcon(integration.config.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">
                            {integration.config.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.badgeColor}`}>
                            {statusConfig.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                        <span>{catalogItem?.name}</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatLastSync(integration.lastSyncAt)}
                        </span>
                    </div>
                </div>

                {/* Quick Metrics */}
                <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                        <div className="text-slate-500">Uptime</div>
                        <div className={`font-medium ${health.uptime >= 95 ? 'text-[#DA7756]' : health.uptime >= 80 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {health.uptime.toFixed(1)}%
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-500">Avg Sync</div>
                        <div className="font-medium text-white">
                            {health.avgSyncDuration < 1000
                                ? `${health.avgSyncDuration}ms`
                                : `${(health.avgSyncDuration / 1000).toFixed(1)}s`}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-500">Error Rate</div>
                        <div className={`font-medium ${health.errorRate === 0 ? 'text-[#DA7756]' : health.errorRate < 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {health.errorRate.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={e => {
                            e.stopPropagation();
                            onRefresh();
                        }}
                        disabled={integration.status === 'syncing'}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-50"
                        title="Sync Now"
                    >
                        <RefreshCw className={`w-4 h-4 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                    </motion.button>
                    {integration.status === 'paused' ? (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={e => {
                                e.stopPropagation();
                                onResume();
                            }}
                            className="p-2 text-slate-400 hover:text-[#DA7756] hover:bg-[#DA7756]/10 rounded-lg transition-colors"
                            title="Resume"
                        >
                            <Zap className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={e => {
                                e.stopPropagation();
                                onPause();
                            }}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Pause"
                        >
                            <Pause className="w-4 h-4" />
                        </motion.button>
                    )}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        variants={expandVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="border-t border-white/[0.06] overflow-hidden"
                    >
                        {/* Error Alert */}
                        {integration.status === 'error' && integration.lastError && (
                            <div className="px-4 py-3 bg-rose-500/10 border-b border-rose-500/20">
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-rose-400 font-medium">Last Error</p>
                                        <p className="text-sm text-rose-400/80 mt-1">{integration.lastError}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <button className="text-sm text-rose-400 hover:text-rose-300 underline transition-colors">
                                                View Resolution Guide
                                            </button>
                                            <button
                                                onClick={onRefresh}
                                                className="text-sm text-rose-400 hover:text-rose-300 underline transition-colors"
                                            >
                                                Retry Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Metrics Grid */}
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricTile
                                label="Uptime"
                                value={`${health.uptime.toFixed(1)}%`}
                                icon={<Activity className="w-4 h-4" />}
                                trend={health.uptime >= 99 ? 'up' : health.uptime >= 95 ? 'stable' : 'down'}
                            />
                            <MetricTile
                                label="Avg Sync Time"
                                value={health.avgSyncDuration < 1000 ? `${health.avgSyncDuration}ms` : `${(health.avgSyncDuration / 1000).toFixed(1)}s`}
                                icon={<Clock className="w-4 h-4" />}
                            />
                            <MetricTile
                                label="Error Rate"
                                value={`${health.errorRate.toFixed(1)}%`}
                                icon={<AlertCircle className="w-4 h-4" />}
                                trend={health.errorRate === 0 ? 'up' : health.errorRate < 5 ? 'stable' : 'down'}
                            />
                            <MetricTile
                                label="Total Rows"
                                value={(integration.metadata.rowCount || 0).toLocaleString()}
                                icon={<BarChart3 className="w-4 h-4" />}
                            />
                        </div>

                        {/* Sync History */}
                        <div className="px-4 pb-4">
                            <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Syncs</h4>
                            <div className="space-y-2">
                                {health.syncHistory.slice(0, 5).map((sync, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-3 p-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm"
                                    >
                                        {sync.success ? (
                                            <CheckCircle className="w-4 h-4 text-[#DA7756]" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-400" />
                                        )}
                                        <span className="text-slate-400">{sync.timestamp}</span>
                                        <span className="text-slate-300">
                                            {sync.rowCount.toLocaleString()} rows
                                        </span>
                                        <span className="text-slate-500">{sync.duration}ms</span>
                                        {sync.error && (
                                            <span className="text-rose-400 truncate">{sync.error}</span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 pb-4 flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-all"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Logs
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MetricTile({
    label,
    value,
    icon,
    trend,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'stable';
}) {
    return (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">{value}</span>
                {trend && (
                    <span>
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-[#DA7756]" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-400" />}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusConfig(status: IntegrationStatus): {
    label: string;
    dotColor: string;
    badgeColor: string;
} {
    switch (status) {
        case 'connected':
            return {
                label: 'Healthy',
                dotColor: 'bg-[#DA7756]',
                badgeColor: 'bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/20',
            };
        case 'syncing':
            return {
                label: 'Syncing',
                dotColor: 'bg-blue-500',
                badgeColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
            };
        case 'paused':
            return {
                label: 'Paused',
                dotColor: 'bg-amber-500',
                badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
            };
        case 'error':
            return {
                label: 'Error',
                dotColor: 'bg-rose-500',
                badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
            };
        case 'disconnected':
            return {
                label: 'Disconnected',
                dotColor: 'bg-slate-500',
                badgeColor: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
            };
        default:
            return {
                label: 'Unknown',
                dotColor: 'bg-slate-500',
                badgeColor: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
            };
    }
}

function generateHealthMetrics(integration: Integration): HealthMetrics {
    // Generate realistic-looking metrics based on integration state
    const baseUptime = integration.status === 'connected' ? 99 : integration.status === 'error' ? 75 : 95;
    const baseErrorRate = integration.status === 'error' ? 15 : integration.status === 'connected' ? 0 : 5;

    // Generate mock sync history
    const syncHistory: SyncHistoryItem[] = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Every hour
        const success = integration.status !== 'error' || i > 0; // Latest one can fail if error status

        syncHistory.push({
            timestamp: timestamp.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            }),
            success,
            duration: Math.floor(Math.random() * 800 + 200), // 200-1000ms
            rowCount: Math.floor(Math.random() * 500 + 100), // 100-600 rows
            error: !success ? integration.lastError : undefined,
        });
    }

    return {
        uptime: baseUptime + Math.random() * 1 - 0.5, // Small variation
        avgSyncDuration: integration.metadata.syncDuration || Math.floor(Math.random() * 500 + 300),
        errorRate: baseErrorRate + Math.random() * 2,
        lastError: integration.lastError,
        lastErrorAt: integration.status === 'error' ? new Date().toISOString() : undefined,
        syncHistory,
    };
}

export default ConnectionHealth;
