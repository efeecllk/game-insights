/**
 * Data Hub Page - Obsidian Analytics Design
 *
 * Premium data connection hub with:
 * - Glassmorphism containers
 * - Warm orange accent theme
 * - Animated entrance effects
 * - Refined integration cards
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Plug,
    ClipboardPaste,
    Plus,
    RefreshCw,
    Trash2,
    Pause,
    Play,
    Search,
    AlertCircle,
    Clock,
    Database,
    Loader2,
    ChevronRight,
    X,
    FileSpreadsheet,
    CloudLightning,
    Check,
    Activity,
} from 'lucide-react';
import { useIntegrations } from '../context/IntegrationContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
    Integration,
    IntegrationType,
    INTEGRATION_CATALOG,
    formatLastSync,
    getIntegrationIcon,
} from '../lib/integrationStore';
import { ConnectionWizard } from '../components/data';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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

// ============================================================================
// Main Page Component
// ============================================================================

export function DataHubPage() {
    const {
        integrations,
        isLoading,
        removeIntegration,
        refreshIntegration,
        pauseIntegration,
        resumeIntegration,
    } = useIntegrations();

    const { gameDataList } = useData();
    const { showError, success, warning } = useToast();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [wizardType, setWizardType] = useState<IntegrationType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const connectedCount = integrations.filter(i => i.status === 'connected').length;
    const errorCount = integrations.filter(i => i.status === 'error').length;
    const totalRows = integrations.reduce((sum, i) => sum + (i.metadata.rowCount || 0), 0) +
        gameDataList.reduce((sum, g) => sum + g.rowCount, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 className="w-8 h-8 text-[#DA7756] animate-spin relative" />
                </div>
            </div>
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
                                <div className="absolute inset-0 bg-gradient-to-br from-[#DA7756]/30 to-[#C15F3C]/20 rounded-xl blur-lg" />
                                <div className="relative w-12 h-12 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 rounded-xl flex items-center justify-center">
                                    <Database className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>
                            <div>
                                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                    Data Hub
                                </h1>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    Connect, import, and manage your data sources
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => setShowAddModal(true)}
                        >
                            Add Source
                        </Button>
                    </div>
                </Card>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    label="Connected"
                    value={connectedCount}
                    icon={Plug}
                    color="orange"
                    index={0}
                />
                <StatCard
                    label="Data Uploads"
                    value={gameDataList.length}
                    icon={FileSpreadsheet}
                    color="blue"
                    index={1}
                />
                <StatCard
                    label="Total Rows"
                    value={totalRows.toLocaleString()}
                    icon={Database}
                    color="deepOrange"
                    index={2}
                />
                <StatCard
                    label="Issues"
                    value={errorCount}
                    icon={AlertCircle}
                    color={errorCount > 0 ? 'rose' : 'slate'}
                    index={3}
                />
            </div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                <QuickAction
                    icon={Upload}
                    title="Upload File"
                    description="CSV, Excel, JSON"
                    to="/upload"
                    color="orange"
                />
                <QuickAction
                    icon={Plug}
                    title="Connect API"
                    description="Real-time data sync"
                    onClick={() => setShowAddModal(true)}
                    color="blue"
                />
                <QuickAction
                    icon={ClipboardPaste}
                    title="Paste Data"
                    description="Quick import"
                    to="/upload?mode=paste"
                    color="violet"
                />
            </motion.div>

            {/* Search */}
            {(integrations.length > 0 || gameDataList.length > 0) && (
                <motion.div variants={itemVariants}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search data sources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                        />
                    </div>
                </motion.div>
            )}

            {/* Integrations List */}
            {integrations.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CloudLightning className="w-5 h-5 text-[#DA7756]" />
                        Connected Integrations
                    </h2>
                    <div className="space-y-3">
                        {integrations
                            .filter(i => i.config.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((integration, index) => (
                                <IntegrationCard
                                    key={integration.id}
                                    integration={integration}
                                    onRefresh={async () => {
                                        try {
                                            await refreshIntegration(integration.id);
                                            success('Data refreshed successfully');
                                        } catch (error) {
                                            showError(error);
                                        }
                                    }}
                                    onPause={() => pauseIntegration(integration.id)}
                                    onResume={() => resumeIntegration(integration.id)}
                                    onRemove={() => {
                                        warning('Integration removed');
                                        removeIntegration(integration.id);
                                    }}
                                    index={index}
                                />
                            ))}
                    </div>
                </motion.div>
            )}

            {/* Uploaded Data List */}
            {gameDataList.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                        Uploaded Data
                    </h2>
                    <div className="space-y-3">
                        {gameDataList
                            .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((data, index) => (
                                <UploadedDataCard
                                    key={data.id}
                                    data={data}
                                    index={index}
                                />
                            ))}
                    </div>
                </motion.div>
            )}

            {/* Empty State */}
            {integrations.length === 0 && gameDataList.length === 0 && (
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg" className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="relative inline-block mb-4"
                        >
                            <div className="absolute inset-0 bg-[#DA7756]/20 rounded-xl blur-xl" />
                            <div className="relative w-16 h-16 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 rounded-xl flex items-center justify-center mx-auto">
                                <Database className="w-8 h-8 text-[#DA7756]" />
                            </div>
                        </motion.div>
                        <h3 className="text-xl font-semibold text-white mb-2">No data sources yet</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Connect your analytics platform, upload files, or paste data directly to start analyzing your game.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Link to="/upload">
                                <Button variant="primary" icon={<Upload className="w-4 h-4" />}>
                                    Upload File
                                </Button>
                            </Link>
                            <Button
                                variant="secondary"
                                icon={<Plug className="w-4 h-4" />}
                                onClick={() => setShowAddModal(true)}
                            >
                                Connect API
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Add Integration Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddIntegrationModal
                        onClose={() => setShowAddModal(false)}
                        onSelect={(type) => {
                            setWizardType(type);
                            setShowAddModal(false);
                            setShowWizard(true);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Connection Wizard */}
            <AnimatePresence>
                {showWizard && wizardType && (
                    <ConnectionWizard
                        initialType={wizardType}
                        onComplete={() => {
                            setShowWizard(false);
                            setWizardType(null);
                        }}
                        onCancel={() => {
                            setShowWizard(false);
                            setWizardType(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    index,
}: {
    label: string;
    value: string | number;
    icon: typeof Database;
    color: 'orange' | 'blue' | 'deepOrange' | 'rose' | 'slate';
    index: number;
}) {
    const colorStyles = {
        orange: {
            bg: 'from-[#DA7756]/20 to-[#DA7756]/5',
            border: 'border-[#DA7756]/20',
            icon: 'text-[#DA7756]',
            glow: 'bg-[#DA7756]/20',
        },
        blue: {
            bg: 'from-blue-500/20 to-blue-500/5',
            border: 'border-blue-500/20',
            icon: 'text-blue-400',
            glow: 'bg-blue-500/20',
        },
        deepOrange: {
            bg: 'from-[#C15F3C]/20 to-[#C15F3C]/5',
            border: 'border-[#C15F3C]/20',
            icon: 'text-[#C15F3C]',
            glow: 'bg-[#C15F3C]/20',
        },
        rose: {
            bg: 'from-rose-500/20 to-rose-500/5',
            border: 'border-rose-500/20',
            icon: 'text-rose-400',
            glow: 'bg-rose-500/20',
        },
        slate: {
            bg: 'from-slate-500/20 to-slate-500/5',
            border: 'border-slate-500/20',
            icon: 'text-slate-400',
            glow: 'bg-slate-500/20',
        },
    };

    const style = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="default" padding="md" className="group hover:border-white/[0.12] transition-all">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`absolute inset-0 ${style.glow} rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${style.icon}`} />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-sm text-slate-500">{label}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

// ============================================================================
// Quick Action
// ============================================================================

function QuickAction({
    icon: Icon,
    title,
    description,
    to,
    onClick,
    color,
}: {
    icon: typeof Upload;
    title: string;
    description: string;
    to?: string;
    onClick?: () => void;
    color: 'orange' | 'blue' | 'violet';
}) {
    const colorStyles = {
        orange: 'from-[#DA7756]/20 to-[#DA7756]/5 border-[#DA7756]/20 hover:border-[#DA7756]/40',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
        violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 hover:border-violet-500/40',
    };

    const iconColors = {
        orange: 'text-[#DA7756]',
        blue: 'text-blue-400',
        violet: 'text-violet-400',
    };

    const content = (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`p-5 rounded-xl bg-gradient-to-br ${colorStyles[color]} border cursor-pointer transition-all group`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center ${iconColors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
        </motion.div>
    );

    if (to) {
        return <Link to={to}>{content}</Link>;
    }

    return <div onClick={onClick}>{content}</div>;
}

// ============================================================================
// Integration Card
// ============================================================================

function IntegrationCard({
    integration,
    onRefresh,
    onPause,
    onResume,
    onRemove,
    index,
}: {
    integration: Integration;
    onRefresh: () => void;
    onPause: () => void;
    onResume: () => void;
    onRemove: () => void;
    index: number;
}) {
    const [showHealth, setShowHealth] = useState(false);

    const statusColors = {
        connected: 'bg-[#6BBF59]/10 text-[#6BBF59] border-[#6BBF59]/20',
        syncing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        disconnected: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    const iconClass = getIntegrationIcon(integration.config.type);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="default" padding="md" className="group hover:border-white/[0.12] transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center text-2xl">
                        {iconClass}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">{integration.config.name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[integration.status]}`}>
                                {integration.status === 'syncing' && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
                                {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <Database className="w-3.5 h-3.5" />
                                {(integration.metadata.rowCount || 0).toLocaleString()} rows
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatLastSync(integration.lastSyncAt)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowHealth(!showHealth)}
                            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors"
                            title="Connection health"
                        >
                            <Activity className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onRefresh}
                            disabled={integration.status === 'syncing'}
                            className="p-2 rounded-lg text-slate-500 hover:text-[#DA7756] hover:bg-[#DA7756]/10 transition-colors disabled:opacity-50"
                            title="Refresh data"
                        >
                            <RefreshCw className={`w-4 h-4 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                        </motion.button>
                        {integration.status === 'paused' ? (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onResume}
                                className="p-2 rounded-lg text-slate-500 hover:text-[#6BBF59] hover:bg-[#6BBF59]/10 transition-colors"
                                title="Resume sync"
                            >
                                <Play className="w-4 h-4" />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onPause}
                                className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                title="Pause sync"
                            >
                                <Pause className="w-4 h-4" />
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onRemove}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove integration"
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                <AnimatePresence>
                    {showHealth && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-4 border-t border-white/[0.06]">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                        <p className="text-xs text-slate-500 mb-1">Status</p>
                                        <p className="text-sm font-medium text-white capitalize">{integration.status}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                        <p className="text-xs text-slate-500 mb-1">Sync Duration</p>
                                        <p className="text-sm font-medium text-white">{integration.metadata.syncDuration || 0}ms</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                        <p className="text-xs text-slate-500 mb-1">Data Freshness</p>
                                        <p className="text-sm font-medium text-white">{integration.metadata.dataFreshness ? formatLastSync(integration.metadata.dataFreshness) : 'N/A'}</p>
                                    </div>
                                </div>
                                {integration.lastError && (
                                    <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                        <p className="text-xs text-rose-400 font-medium mb-1">Last Error</p>
                                        <p className="text-sm text-rose-300">{integration.lastError}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}

// ============================================================================
// Uploaded Data Card
// ============================================================================

function UploadedDataCard({
    data,
    index,
}: {
    data: { id: string; name: string; rowCount: number; uploadedAt?: string };
    index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Link to={`/analytics`}>
                <Card variant="default" padding="md" className="group hover:border-white/[0.12] transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{data.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Database className="w-3.5 h-3.5" />
                                    {data.rowCount.toLocaleString()} rows
                                </span>
                                {data.uploadedAt && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(data.uploadedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-[#6BBF59]/10 text-[#6BBF59] border border-[#6BBF59]/20 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Ready
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#DA7756] group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </Card>
            </Link>
        </motion.div>
    );
}

// ============================================================================
// Add Integration Modal
// ============================================================================

function AddIntegrationModal({
    onClose,
    onSelect,
}: {
    onClose: () => void;
    onSelect: (type: IntegrationType) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCatalog = INTEGRATION_CATALOG.filter(
        (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-white/[0.08] shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Add Data Source</h2>
                        <p className="text-sm text-slate-500 mt-1">Connect to your analytics platform</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/[0.06]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search integrations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                        />
                    </div>
                </div>

                {/* Integration List */}
                <div className="p-4 overflow-y-auto max-h-96 space-y-2">
                    {filteredCatalog.map((item) => (
                        <motion.button
                            key={item.type}
                            whileHover={{ scale: 1.01, x: 4 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onSelect(item.type)}
                            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#DA7756]/30 hover:bg-[#DA7756]/5 transition-all text-left group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center text-2xl">
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-white">{item.name}</h3>
                                    <span className={`px-2 py-0.5 text-xs rounded-full border ${
                                        item.complexity === 'low'
                                            ? 'bg-[#6BBF59]/10 text-[#6BBF59] border-[#6BBF59]/20'
                                            : item.complexity === 'medium'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                        {item.complexity}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 truncate">{item.description}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#DA7756] transition-colors" />
                        </motion.button>
                    ))}

                    {filteredCatalog.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-slate-500">No integrations found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.06] flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Can't find your platform? <button className="text-[#DA7756] hover:text-[#C15F3C]">Request integration</button>
                    </p>
                    <Link to="/upload">
                        <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />}>
                            Upload File Instead
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default DataHubPage;
