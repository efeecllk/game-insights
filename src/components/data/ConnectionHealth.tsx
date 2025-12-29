/**
 * Connection Health Dashboard
 * Displays health status of all data source connections
 * Phase 3: Data Sources
 */

import { useState, useMemo } from 'react';
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
    ChevronUp,
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
            <div className="bg-th-bg-surface rounded-xl border border-th-border p-8 text-center">
                <div className="w-16 h-16 bg-th-bg-elevated rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-th-text-muted" />
                </div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-2">
                    No Data Sources Connected
                </h3>
                <p className="text-th-text-muted">
                    Connect your first data source to see health metrics here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overall Health Summary */}
            <div className="bg-th-bg-surface rounded-xl border border-th-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-th-text-primary">
                            Connection Health
                        </h2>
                        <p className="text-sm text-th-text-muted mt-1">
                            Real-time status of all your data sources
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => integrations.forEach(i => refreshIntegration(i.id))}
                            className="flex items-center gap-2 px-4 py-2 bg-th-bg-elevated hover:bg-th-interactive-hover rounded-lg text-sm text-th-text-secondary transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh All
                        </button>
                    </div>
                </div>

                {/* Health Score Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <HealthScoreCard score={overallHealth.score} status={overallHealth.status} />
                    <MetricCard
                        icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                        label="Healthy"
                        value={overallHealth.healthyCount ?? 0}
                        bgColor="bg-green-500/10"
                    />
                    <MetricCard
                        icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                        label="Errors"
                        value={overallHealth.errorCount ?? 0}
                        bgColor="bg-red-500/10"
                    />
                    <MetricCard
                        icon={<Pause className="w-5 h-5 text-yellow-500" />}
                        label="Paused"
                        value={overallHealth.pausedCount ?? 0}
                        bgColor="bg-yellow-500/10"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
                {(['all', 'healthy', 'warning', 'error'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === f
                                ? 'bg-th-accent-primary text-white'
                                : 'bg-th-bg-surface text-th-text-secondary hover:bg-th-interactive-hover'
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== 'all' && (
                            <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                                {f === 'healthy'
                                    ? integrations.filter(i => i.status === 'connected').length
                                    : f === 'warning'
                                    ? integrations.filter(i => ['syncing', 'paused'].includes(i.status)).length
                                    : integrations.filter(i => ['error', 'disconnected'].includes(i.status)).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Integration List */}
            <div className="space-y-3">
                {filteredIntegrations.map(integration => (
                    <IntegrationHealthCard
                        key={integration.id}
                        integration={integration}
                        isExpanded={expandedId === integration.id}
                        onToggle={() => setExpandedId(expandedId === integration.id ? null : integration.id)}
                        onRefresh={() => refreshIntegration(integration.id)}
                        onPause={() => pauseIntegration(integration.id)}
                        onResume={() => resumeIntegration(integration.id)}
                    />
                ))}

                {filteredIntegrations.length === 0 && (
                    <div className="bg-th-bg-surface rounded-xl border border-th-border p-8 text-center">
                        <p className="text-th-text-muted">No integrations match this filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function HealthScoreCard({ score, status }: { score: number; status: 'healthy' | 'warning' | 'error' }) {
    const colors = {
        healthy: { ring: 'stroke-green-500', text: 'text-green-500', bg: 'bg-green-500/10' },
        warning: { ring: 'stroke-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        error: { ring: 'stroke-red-500', text: 'text-red-500', bg: 'bg-red-500/10' },
    };

    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className={`rounded-xl p-4 ${colors[status].bg}`}>
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="40"
                            strokeWidth="8"
                            fill="none"
                            className="stroke-th-border-subtle"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r="40"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            className={colors[status].ring}
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset,
                                transition: 'stroke-dashoffset 0.5s ease',
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xl font-bold ${colors[status].text}`}>
                            {score}%
                        </span>
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-th-text-muted">Health Score</div>
                    <div className={`text-lg font-semibold capitalize ${colors[status].text}`}>
                        {status}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    bgColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    bgColor: string;
}) {
    return (
        <div className={`rounded-xl p-4 ${bgColor}`}>
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <div className="text-2xl font-bold text-th-text-primary">{value}</div>
                    <div className="text-sm text-th-text-muted">{label}</div>
                </div>
            </div>
        </div>
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
        <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
            {/* Main Row */}
            <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-th-bg-surface-hover transition-colors"
                onClick={onToggle}
            >
                {/* Status Indicator */}
                <div className={`w-3 h-3 rounded-full ${statusConfig.dotColor}`} />

                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-th-bg-elevated flex items-center justify-center text-xl">
                    {getIntegrationIcon(integration.config.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-th-text-primary truncate">
                            {integration.config.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.badgeColor}`}>
                            {statusConfig.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-th-text-muted mt-1">
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
                        <div className="text-th-text-muted">Uptime</div>
                        <div className={`font-medium ${health.uptime >= 95 ? 'text-green-500' : health.uptime >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {health.uptime.toFixed(1)}%
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-th-text-muted">Avg Sync</div>
                        <div className="font-medium text-th-text-primary">
                            {health.avgSyncDuration < 1000
                                ? `${health.avgSyncDuration}ms`
                                : `${(health.avgSyncDuration / 1000).toFixed(1)}s`}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-th-text-muted">Error Rate</div>
                        <div className={`font-medium ${health.errorRate === 0 ? 'text-green-500' : health.errorRate < 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {health.errorRate.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            onRefresh();
                        }}
                        disabled={integration.status === 'syncing'}
                        className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover rounded-lg transition-colors disabled:opacity-50"
                        title="Sync Now"
                    >
                        <RefreshCw className={`w-4 h-4 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                    </button>
                    {integration.status === 'paused' ? (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                onResume();
                            }}
                            className="p-2 text-th-text-muted hover:text-green-500 hover:bg-th-interactive-hover rounded-lg transition-colors"
                            title="Resume"
                        >
                            <Zap className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                onPause();
                            }}
                            className="p-2 text-th-text-muted hover:text-yellow-500 hover:bg-th-interactive-hover rounded-lg transition-colors"
                            title="Pause"
                        >
                            <Pause className="w-4 h-4" />
                        </button>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-th-text-muted" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-th-text-muted" />
                    )}
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-th-border">
                    {/* Error Alert */}
                    {integration.status === 'error' && integration.lastError && (
                        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-400 font-medium">Last Error</p>
                                    <p className="text-sm text-red-400/80 mt-1">{integration.lastError}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button className="text-sm text-red-400 hover:text-red-300 underline">
                                            View Resolution Guide
                                        </button>
                                        <button
                                            onClick={onRefresh}
                                            className="text-sm text-red-400 hover:text-red-300 underline"
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
                        <h4 className="text-sm font-medium text-th-text-secondary mb-3">Recent Syncs</h4>
                        <div className="space-y-2">
                            {health.syncHistory.slice(0, 5).map((sync, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-2 bg-th-bg-elevated rounded-lg text-sm"
                                >
                                    {sync.success ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="text-th-text-muted">{sync.timestamp}</span>
                                    <span className="text-th-text-secondary">
                                        {sync.rowCount.toLocaleString()} rows
                                    </span>
                                    <span className="text-th-text-muted">{sync.duration}ms</span>
                                    {sync.error && (
                                        <span className="text-red-400 truncate">{sync.error}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 pb-4 flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-th-bg-elevated hover:bg-th-interactive-hover rounded-lg text-sm text-th-text-secondary transition-colors">
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-th-bg-elevated hover:bg-th-interactive-hover rounded-lg text-sm text-th-text-secondary transition-colors">
                            <ExternalLink className="w-4 h-4" />
                            View Logs
                        </button>
                    </div>
                </div>
            )}
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
        <div className="bg-th-bg-elevated rounded-lg p-3">
            <div className="flex items-center gap-2 text-th-text-muted mb-1">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-th-text-primary">{value}</span>
                {trend && (
                    <span>
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
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
                dotColor: 'bg-green-500',
                badgeColor: 'bg-green-500/10 text-green-500',
            };
        case 'syncing':
            return {
                label: 'Syncing',
                dotColor: 'bg-blue-500 animate-pulse',
                badgeColor: 'bg-blue-500/10 text-blue-500',
            };
        case 'paused':
            return {
                label: 'Paused',
                dotColor: 'bg-yellow-500',
                badgeColor: 'bg-yellow-500/10 text-yellow-500',
            };
        case 'error':
            return {
                label: 'Error',
                dotColor: 'bg-red-500',
                badgeColor: 'bg-red-500/10 text-red-500',
            };
        case 'disconnected':
            return {
                label: 'Disconnected',
                dotColor: 'bg-gray-500',
                badgeColor: 'bg-gray-500/10 text-gray-500',
            };
        default:
            return {
                label: 'Unknown',
                dotColor: 'bg-gray-500',
                badgeColor: 'bg-gray-500/10 text-gray-500',
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
