/**
 * Sync Schedule Manager Component
 * Configure and manage sync schedules for data sources
 * Phase 3: Data Sources
 */

import { useState, useMemo } from 'react';
import {
    Clock,
    RefreshCw,
    Zap,
    Bell,
    Calendar,
    Play,
    Pause,
    Settings,
    ChevronDown,
    Check,
    Info,
    History,
} from 'lucide-react';
import { useIntegrations } from '../../context/IntegrationContext';
import {
    Integration,
    SyncStrategy,
    INTEGRATION_CATALOG,
    getIntegrationIcon,
    formatLastSync,
} from '../../lib/integrationStore';

// ============================================================================
// Types
// ============================================================================

interface SchedulePreset {
    id: string;
    name: string;
    description: string;
    strategy: SyncStrategy;
    icon: React.ElementType;
}

// ============================================================================
// Presets
// ============================================================================

const syncPresets: SchedulePreset[] = [
    {
        id: 'manual',
        name: 'Manual',
        description: 'Only sync when you click refresh',
        strategy: { type: 'manual' },
        icon: RefreshCw,
    },
    {
        id: 'hourly',
        name: 'Hourly',
        description: 'Sync every hour automatically',
        strategy: { type: 'scheduled', intervalMinutes: 60 },
        icon: Clock,
    },
    {
        id: 'daily',
        name: 'Daily',
        description: 'Sync once per day at midnight',
        strategy: { type: 'scheduled', intervalMinutes: 1440 },
        icon: Calendar,
    },
    {
        id: 'realtime',
        name: 'Real-time',
        description: 'Keep data continuously updated',
        strategy: { type: 'realtime', method: 'polling', pollIntervalSeconds: 30 },
        icon: Zap,
    },
];

// ============================================================================
// Main Component
// ============================================================================

export function SyncScheduleManager() {
    const { integrations, refreshIntegration, pauseIntegration, resumeIntegration } = useIntegrations();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Group integrations by sync type
    const groupedIntegrations = useMemo(() => {
        return {
            manual: integrations.filter(i => i.config.syncStrategy.type === 'manual'),
            scheduled: integrations.filter(i => i.config.syncStrategy.type === 'scheduled'),
            realtime: integrations.filter(i => i.config.syncStrategy.type === 'realtime'),
            webhook: integrations.filter(i => i.config.syncStrategy.type === 'webhook'),
        };
    }, [integrations]);

    // Calculate next sync times
    const nextSyncs = useMemo(() => {
        const syncs: Array<{ integration: Integration; nextSync: Date }> = [];

        integrations.forEach(i => {
            if (i.config.syncStrategy.type === 'scheduled' && i.status !== 'paused') {
                const interval = i.config.syncStrategy.intervalMinutes * 60 * 1000;
                const lastSync = i.lastSyncAt ? new Date(i.lastSyncAt).getTime() : Date.now();
                const nextSync = new Date(lastSync + interval);
                syncs.push({ integration: i, nextSync });
            }
        });

        return syncs.sort((a, b) => a.nextSync.getTime() - b.nextSync.getTime());
    }, [integrations]);

    if (integrations.length === 0) {
        return (
            <div className="bg-th-bg-surface rounded-xl border border-th-border p-8 text-center">
                <div className="w-16 h-16 bg-th-bg-elevated rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-th-text-muted" />
                </div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-2">
                    No Sync Schedules
                </h3>
                <p className="text-th-text-muted">
                    Connect data sources to manage their sync schedules.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SyncTypeCard
                    icon={<RefreshCw className="w-5 h-5 text-gray-400" />}
                    label="Manual"
                    count={groupedIntegrations.manual.length}
                    description="On-demand sync"
                    color="gray"
                />
                <SyncTypeCard
                    icon={<Clock className="w-5 h-5 text-blue-400" />}
                    label="Scheduled"
                    count={groupedIntegrations.scheduled.length}
                    description="Automatic intervals"
                    color="blue"
                />
                <SyncTypeCard
                    icon={<Zap className="w-5 h-5 text-green-400" />}
                    label="Real-time"
                    count={groupedIntegrations.realtime.length}
                    description="Continuous sync"
                    color="green"
                />
                <SyncTypeCard
                    icon={<Bell className="w-5 h-5 text-purple-400" />}
                    label="Webhook"
                    count={groupedIntegrations.webhook.length}
                    description="Push-based"
                    color="purple"
                />
            </div>

            {/* Upcoming Syncs */}
            {nextSyncs.length > 0 && (
                <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
                    <h3 className="font-semibold text-th-text-primary mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-th-accent-primary" />
                        Upcoming Syncs
                    </h3>
                    <div className="space-y-2">
                        {nextSyncs.slice(0, 5).map(({ integration, nextSync }) => (
                            <UpcomingSyncRow
                                key={integration.id}
                                integration={integration}
                                nextSync={nextSync}
                                onRefresh={() => refreshIntegration(integration.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Integration Schedule List */}
            <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
                <div className="p-4 border-b border-th-border-subtle">
                    <h3 className="font-semibold text-th-text-primary flex items-center gap-2">
                        <Settings className="w-5 h-5 text-th-accent-primary" />
                        Sync Schedules
                    </h3>
                    <p className="text-sm text-th-text-muted mt-1">
                        Configure when each data source syncs
                    </p>
                </div>

                <div className="divide-y divide-th-border-subtle">
                    {integrations.map(integration => (
                        <ScheduleRow
                            key={integration.id}
                            integration={integration}
                            isExpanded={expandedId === integration.id}
                            onToggle={() => setExpandedId(expandedId === integration.id ? null : integration.id)}
                            onRefresh={() => refreshIntegration(integration.id)}
                            onPause={() => pauseIntegration(integration.id)}
                            onResume={() => resumeIntegration(integration.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Sync Tips */}
            <div className="bg-th-accent-primary-muted rounded-xl p-4">
                <h4 className="font-medium text-th-accent-primary mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Sync Best Practices
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-th-text-secondary">
                            Use real-time sync for dashboards that need live data
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-th-text-secondary">
                            Schedule syncs during off-peak hours to reduce API usage
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-th-text-secondary">
                            Pause syncs for integrations you're not actively using
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-th-text-secondary">
                            Use webhooks when available for instant updates
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function SyncTypeCard({
    icon,
    label,
    count,
    description,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    count: number;
    description: string;
    color: 'gray' | 'blue' | 'green' | 'purple';
}) {
    const colorMap = {
        gray: 'bg-gray-500/10',
        blue: 'bg-blue-500/10',
        green: 'bg-green-500/10',
        purple: 'bg-purple-500/10',
    };

    return (
        <div className={`rounded-xl p-4 ${colorMap[color]}`}>
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <div className="text-2xl font-bold text-th-text-primary">{count}</div>
                    <div className="text-sm text-th-text-muted">{label}</div>
                </div>
            </div>
            <p className="text-xs text-th-text-muted mt-2">{description}</p>
        </div>
    );
}

function UpcomingSyncRow({
    integration,
    nextSync,
    onRefresh,
}: {
    integration: Integration;
    nextSync: Date;
    onRefresh: () => void;
}) {
    const catalogItem = INTEGRATION_CATALOG.find(c => c.type === integration.config.type);
    const timeUntil = getTimeUntil(nextSync);

    return (
        <div className="flex items-center gap-4 p-3 bg-th-bg-elevated rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-th-bg-surface flex items-center justify-center text-xl">
                {getIntegrationIcon(integration.config.type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-th-text-primary truncate">
                    {integration.config.name}
                </div>
                <div className="text-sm text-th-text-muted">
                    {catalogItem?.name} • Next sync {timeUntil}
                </div>
            </div>
            <button
                onClick={onRefresh}
                className="px-3 py-1.5 bg-th-accent-primary/10 text-th-accent-primary rounded-lg text-sm font-medium hover:bg-th-accent-primary/20 transition-colors"
            >
                Sync Now
            </button>
        </div>
    );
}

function ScheduleRow({
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
    const isPaused = integration.status === 'paused';

    return (
        <div>
            {/* Main Row */}
            <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-th-bg-surface-hover transition-colors"
                onClick={onToggle}
            >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-th-bg-elevated flex items-center justify-center text-xl">
                    {getIntegrationIcon(integration.config.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-th-text-primary truncate">
                            {integration.config.name}
                        </h4>
                        {isPaused && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full">
                                Paused
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-th-text-muted">
                        {catalogItem?.name} • {formatLastSync(integration.lastSyncAt)}
                    </div>
                </div>

                {/* Schedule Badge */}
                <ScheduleBadge strategy={integration.config.syncStrategy} />

                {/* Actions */}
                <div className="flex items-center gap-2">
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
                    {isPaused ? (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                onResume();
                            }}
                            className="p-2 text-th-text-muted hover:text-green-500 hover:bg-th-interactive-hover rounded-lg transition-colors"
                            title="Resume"
                        >
                            <Play className="w-4 h-4" />
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
                    <ChevronDown
                        className={`w-5 h-5 text-th-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Expanded Config */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-th-border-subtle pt-4 ml-14">
                    <h5 className="text-sm font-medium text-th-text-secondary mb-3">
                        Change Sync Schedule
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {syncPresets.map(preset => {
                            const isActive = matchesStrategy(integration.config.syncStrategy, preset.strategy);
                            const Icon = preset.icon;

                            return (
                                <button
                                    key={preset.id}
                                    className={`p-3 rounded-lg border text-left transition-colors ${
                                        isActive
                                            ? 'border-th-accent-primary bg-th-accent-primary-muted'
                                            : 'border-th-border-subtle hover:border-th-border bg-th-bg-elevated hover:bg-th-bg-surface-hover'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-th-accent-primary' : 'text-th-text-muted'}`} />
                                        <span className={`font-medium ${isActive ? 'text-th-accent-primary' : 'text-th-text-primary'}`}>
                                            {preset.name}
                                        </span>
                                        {isActive && <Check className="w-4 h-4 text-th-accent-primary ml-auto" />}
                                    </div>
                                    <p className="text-xs text-th-text-muted">{preset.description}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Interval (for scheduled) */}
                    {integration.config.syncStrategy.type === 'scheduled' && (
                        <div className="mt-4 p-3 bg-th-bg-elevated rounded-lg">
                            <label className="text-sm font-medium text-th-text-secondary mb-2 block">
                                Custom Interval
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={5}
                                    max={1440}
                                    step={5}
                                    value={integration.config.syncStrategy.intervalMinutes}
                                    readOnly
                                    className="flex-1"
                                />
                                <span className="text-sm font-medium text-th-text-primary min-w-[80px]">
                                    {formatInterval(integration.config.syncStrategy.intervalMinutes)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Status Info */}
                    <div className="mt-4 p-3 bg-th-bg-elevated rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-th-text-muted">Last Sync</div>
                                <div className="text-th-text-primary">{formatLastSync(integration.lastSyncAt)}</div>
                            </div>
                            <div>
                                <div className="text-th-text-muted">Sync Duration</div>
                                <div className="text-th-text-primary">
                                    {integration.metadata.syncDuration
                                        ? `${(integration.metadata.syncDuration / 1000).toFixed(2)}s`
                                        : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div className="text-th-text-muted">Rows Synced</div>
                                <div className="text-th-text-primary">
                                    {integration.metadata.rowCount?.toLocaleString() || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ScheduleBadge({ strategy }: { strategy: SyncStrategy }) {
    switch (strategy.type) {
        case 'manual':
            return (
                <span className="flex items-center gap-1 px-2 py-1 bg-gray-500/10 text-gray-400 rounded-lg text-xs font-medium">
                    <RefreshCw className="w-3 h-3" />
                    Manual
                </span>
            );
        case 'scheduled':
            return (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    Every {formatInterval(strategy.intervalMinutes)}
                </span>
            );
        case 'realtime':
            return (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    Real-time
                </span>
            );
        case 'webhook':
            return (
                <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-medium">
                    <Bell className="w-3 h-3" />
                    Webhook
                </span>
            );
        default:
            return null;
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatInterval(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    if (minutes === 60) return '1 hour';
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
    if (minutes === 1440) return '1 day';
    return `${Math.round(minutes / 1440)} days`;
}

function getTimeUntil(date: Date): string {
    const now = Date.now();
    const diff = date.getTime() - now;

    if (diff < 0) return 'overdue';
    if (diff < 60000) return 'in less than a minute';
    if (diff < 3600000) return `in ${Math.round(diff / 60000)} minutes`;
    if (diff < 86400000) return `in ${Math.round(diff / 3600000)} hours`;
    return `in ${Math.round(diff / 86400000)} days`;
}

function matchesStrategy(current: SyncStrategy, preset: SyncStrategy): boolean {
    if (current.type !== preset.type) return false;

    if (current.type === 'scheduled' && preset.type === 'scheduled') {
        return current.intervalMinutes === preset.intervalMinutes;
    }

    return true;
}

export default SyncScheduleManager;
