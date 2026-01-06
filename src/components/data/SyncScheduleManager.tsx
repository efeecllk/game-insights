/**
 * Sync Schedule Manager - Obsidian Analytics Design
 *
 * Configure sync schedules with:
 * - Glassmorphism containers
 * - Warm orange accent colors (#DA7756)
 * - Framer Motion animations
 * - Interactive schedule presets
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
// Animation Variants
// ============================================================================

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
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 text-center"
            >
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-slate-500/20 rounded-2xl blur-xl" />
                    <div className="relative w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                        <Clock className="w-8 h-8 text-slate-400" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                    No Sync Schedules
                </h3>
                <p className="text-slate-400">
                    Connect data sources to manage their sync schedules.
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
            {/* Overview Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SyncTypeCard
                    icon={<RefreshCw className="w-5 h-5 text-slate-400" />}
                    label="Manual"
                    count={groupedIntegrations.manual.length}
                    description="On-demand sync"
                    color="slate"
                    index={0}
                />
                <SyncTypeCard
                    icon={<Clock className="w-5 h-5 text-blue-400" />}
                    label="Scheduled"
                    count={groupedIntegrations.scheduled.length}
                    description="Automatic intervals"
                    color="blue"
                    index={1}
                />
                <SyncTypeCard
                    icon={<Zap className="w-5 h-5 text-[#DA7756]" />}
                    label="Real-time"
                    count={groupedIntegrations.realtime.length}
                    description="Continuous sync"
                    color="orange"
                    index={2}
                />
                <SyncTypeCard
                    icon={<Bell className="w-5 h-5 text-violet-400" />}
                    label="Webhook"
                    count={groupedIntegrations.webhook.length}
                    description="Push-based"
                    color="violet"
                    index={3}
                />
            </motion.div>

            {/* Upcoming Syncs */}
            <AnimatePresence>
                {nextSyncs.length > 0 && (
                    <motion.div
                        variants={cardVariants}
                        className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5"
                    >
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 flex items-center justify-center">
                                <History className="w-4 h-4 text-[#DA7756]" />
                            </div>
                            Upcoming Syncs
                        </h3>
                        <div className="space-y-2">
                            {nextSyncs.slice(0, 5).map(({ integration, nextSync }, idx) => (
                                <UpcomingSyncRow
                                    key={integration.id}
                                    integration={integration}
                                    nextSync={nextSync}
                                    onRefresh={() => refreshIntegration(integration.id)}
                                    index={idx}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Integration Schedule List */}
            <motion.div
                variants={cardVariants}
                className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
            >
                <div className="px-5 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Sync Schedules</h3>
                            <p className="text-sm text-slate-400">
                                Configure when each data source syncs
                            </p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-white/[0.06]">
                    {integrations.map((integration, idx) => (
                        <ScheduleRow
                            key={integration.id}
                            integration={integration}
                            isExpanded={expandedId === integration.id}
                            onToggle={() => setExpandedId(expandedId === integration.id ? null : integration.id)}
                            onRefresh={() => refreshIntegration(integration.id)}
                            onPause={() => pauseIntegration(integration.id)}
                            onResume={() => resumeIntegration(integration.id)}
                            index={idx}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Sync Tips */}
            <motion.div
                variants={cardVariants}
                className="bg-[#DA7756]/5 border border-[#DA7756]/10 rounded-2xl p-5"
            >
                <h4 className="font-medium text-[#DA7756] mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 flex items-center justify-center">
                        <Info className="w-4 h-4 text-[#DA7756]" />
                    </div>
                    Sync Best Practices
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#DA7756] flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">
                            Use real-time sync for dashboards that need live data
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#DA7756] flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">
                            Schedule syncs during off-peak hours to reduce API usage
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#DA7756] flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">
                            Pause syncs for integrations you're not actively using
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#DA7756] flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">
                            Use webhooks when available for instant updates
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
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
    index,
}: {
    icon: React.ReactNode;
    label: string;
    count: number;
    description: string;
    color: 'slate' | 'blue' | 'orange' | 'violet';
    index: number;
}) {
    const colorMap = {
        slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/20', glow: '' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/10' },
        orange: { bg: 'bg-[#DA7756]/10', border: 'border-[#DA7756]/20', glow: 'shadow-[#DA7756]/10' },
        violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', glow: 'shadow-violet-500/10' },
    };

    const colors = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`rounded-xl p-4 ${colors.bg} border ${colors.border} shadow-lg ${colors.glow}`}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-sm text-slate-400">{label}</div>
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{description}</p>
        </motion.div>
    );
}

function UpcomingSyncRow({
    integration,
    nextSync,
    onRefresh,
    index,
}: {
    integration: Integration;
    nextSync: Date;
    onRefresh: () => void;
    index: number;
}) {
    const catalogItem = INTEGRATION_CATALOG.find(c => c.type === integration.config.type);
    const timeUntil = getTimeUntil(nextSync);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
            className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-colors"
        >
            <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xl">
                {getIntegrationIcon(integration.config.type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">
                    {integration.config.name}
                </div>
                <div className="text-sm text-slate-400">
                    {catalogItem?.name} • Next sync {timeUntil}
                </div>
            </div>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRefresh}
                className="px-4 py-2 bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/20 rounded-xl text-sm font-medium hover:bg-[#DA7756]/20 transition-colors"
            >
                Sync Now
            </motion.button>
        </motion.div>
    );
}

function ScheduleRow({
    integration,
    isExpanded,
    onToggle,
    onRefresh,
    onPause,
    onResume,
    index,
}: {
    integration: Integration;
    isExpanded: boolean;
    onToggle: () => void;
    onRefresh: () => void;
    onPause: () => void;
    onResume: () => void;
    index: number;
}) {
    const catalogItem = INTEGRATION_CATALOG.find(c => c.type === integration.config.type);
    const isPaused = integration.status === 'paused';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
        >
            {/* Main Row */}
            <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={onToggle}
            >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xl">
                    {getIntegrationIcon(integration.config.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white truncate">
                            {integration.config.name}
                        </h4>
                        {isPaused && (
                            <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                                Paused
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-slate-400">
                        {catalogItem?.name} • {formatLastSync(integration.lastSyncAt)}
                    </div>
                </div>

                {/* Schedule Badge */}
                <ScheduleBadge strategy={integration.config.syncStrategy} />

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
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-50"
                        title="Sync Now"
                    >
                        <RefreshCw className={`w-4 h-4 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                    </motion.button>
                    {isPaused ? (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={e => {
                                e.stopPropagation();
                                onResume();
                            }}
                            className="p-2 text-slate-500 hover:text-[#DA7756] hover:bg-[#DA7756]/10 rounded-lg transition-colors"
                            title="Resume"
                        >
                            <Play className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={e => {
                                e.stopPropagation();
                                onPause();
                            }}
                            className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Pause"
                        >
                            <Pause className="w-4 h-4" />
                        </motion.button>
                    )}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                    </motion.div>
                </div>
            </div>

            {/* Expanded Config */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 border-t border-white/[0.06] pt-4 ml-14">
                            <h5 className="text-sm font-medium text-slate-300 mb-3">
                                Change Sync Schedule
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {syncPresets.map((preset, idx) => {
                                    const isActive = matchesStrategy(integration.config.syncStrategy, preset.strategy);
                                    const Icon = preset.icon;

                                    return (
                                        <motion.button
                                            key={preset.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`p-3 rounded-xl border text-left transition-all ${
                                                isActive
                                                    ? 'border-[#DA7756]/30 bg-[#DA7756]/10 shadow-lg shadow-[#DA7756]/10'
                                                    : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-[#DA7756]' : 'text-slate-500'}`} />
                                                <span className={`font-medium ${isActive ? 'text-[#DA7756]' : 'text-white'}`}>
                                                    {preset.name}
                                                </span>
                                                {isActive && <Check className="w-4 h-4 text-[#DA7756] ml-auto" />}
                                            </div>
                                            <p className="text-xs text-slate-500">{preset.description}</p>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Custom Interval (for scheduled) */}
                            {integration.config.syncStrategy.type === 'scheduled' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mt-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                                >
                                    <label className="text-sm font-medium text-slate-300 mb-3 block">
                                        Custom Interval
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min={5}
                                            max={1440}
                                            step={5}
                                            value={integration.config.syncStrategy.intervalMinutes}
                                            readOnly
                                            className="flex-1 h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#DA7756] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#DA7756]/30"
                                        />
                                        <span className="text-sm font-medium text-white min-w-[80px] text-right">
                                            {formatInterval(integration.config.syncStrategy.intervalMinutes)}
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Status Info */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                            >
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 mb-1">Last Sync</div>
                                        <div className="text-white font-medium">{formatLastSync(integration.lastSyncAt)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1">Sync Duration</div>
                                        <div className="text-white font-medium">
                                            {integration.metadata.syncDuration
                                                ? `${(integration.metadata.syncDuration / 1000).toFixed(2)}s`
                                                : 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1">Rows Synced</div>
                                        <div className="text-white font-medium">
                                            {integration.metadata.rowCount?.toLocaleString() || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ScheduleBadge({ strategy }: { strategy: SyncStrategy }) {
    switch (strategy.type) {
        case 'manual':
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-lg text-xs font-medium">
                    <RefreshCw className="w-3 h-3" />
                    Manual
                </span>
            );
        case 'scheduled':
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    Every {formatInterval(strategy.intervalMinutes)}
                </span>
            );
        case 'realtime':
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/20 rounded-lg text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    Real-time
                </span>
            );
        case 'webhook':
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-xs font-medium">
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
