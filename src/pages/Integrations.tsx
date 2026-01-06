/**
 * Integrations Page - Integration Hub UI
 * Manage all data source connections
 * Redesigned with Obsidian design system
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    RefreshCw,
    Trash2,
    Settings,
    Pause,
    Play,
    Search,
    AlertCircle,
    Clock,
    Database,
    Link2,
    Loader2,
    ChevronRight,
    X,
    Zap,
    Sparkles,
} from 'lucide-react';
import { useIntegrations } from '../context/IntegrationContext';
import { useToast } from '../context/ToastContext';
import {
    Integration,
    IntegrationType,
    IntegrationConfig,
    INTEGRATION_CATALOG,
    IntegrationCatalogItem,
    formatLastSync,
    getStatusColor,
    getStatusIcon,
    getIntegrationIcon,
} from '../lib/integrationStore';

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ============================================================================
// Noise texture for glassmorphism
// ============================================================================

const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`;

// ============================================================================
// Main Page Component
// ============================================================================

export function IntegrationsPage() {
    const {
        integrations,
        isLoading,
        addIntegration,
        removeIntegration,
        refreshIntegration,
        pauseIntegration,
        resumeIntegration,
    } = useIntegrations();
    const { showError, success, warning } = useToast();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const connectedCount = integrations.filter(i => i.status === 'connected').length;
    const errorCount = integrations.filter(i => i.status === 'error').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="relative">
                    <div className="w-12 h-12 border-2 border-[#DA7756]/20 rounded-full" />
                    <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-[#DA7756] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-32 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-[#C15F3C]/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative p-6 space-y-6"
            >
                {/* Page Header */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20"
                        >
                            <Database className="w-6 h-6 text-cyan-400" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-200 via-blue-200 to-[#DA7756] bg-clip-text text-transparent">
                                Data Sources
                            </h1>
                            <p className="text-slate-400 text-sm">Connect to your data and sync automatically</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(218, 119, 86, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C15F3C] to-[#DA7756] text-white hover:from-[#DA7756] hover:to-[#E8956A] transition-all shadow-lg shadow-[#DA7756]/20"
                    >
                        <Plus className="w-5 h-5" />
                        Add Data Source
                    </motion.button>
                </motion.div>

                {/* Stats Cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard icon="📊" label="Total Sources" value={integrations.length} sublabel="Connected data sources" />
                    <StatCard icon="🟢" label="Connected" value={connectedCount} sublabel="Active connections" highlight={connectedCount > 0} />
                    <StatCard icon="🔴" label="Errors" value={errorCount} sublabel="Need attention" highlight={errorCount > 0} highlightColor="rose" />
                    <StatCard icon="📈" label="Total Rows" value={integrations.reduce((sum, i) => sum + (i.metadata.rowCount || 0), 0).toLocaleString()} sublabel="Across all sources" />
                </motion.div>

                {/* Integrations List */}
                {integrations.length === 0 ? (
                    <motion.div variants={itemVariants}>
                        <EmptyState onAdd={() => setShowAddModal(true)} />
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} className="space-y-4">
                        {integrations.map((integration, index) => (
                            <motion.div key={integration.id} variants={itemVariants} custom={index}>
                                <IntegrationCard
                                    integration={integration}
                                    onRefresh={async () => {
                                        try {
                                            await refreshIntegration(integration.id);
                                            success('Sync complete', `${integration.config.name} refreshed`);
                                        } catch (err) {
                                            showError(err, () => refreshIntegration(integration.id));
                                        }
                                    }}
                                    onPause={async () => {
                                        try {
                                            await pauseIntegration(integration.id);
                                            warning('Sync paused', `${integration.config.name} will not auto-sync`);
                                        } catch (err) {
                                            showError(err);
                                        }
                                    }}
                                    onResume={async () => {
                                        try {
                                            await resumeIntegration(integration.id);
                                            success('Sync resumed', `${integration.config.name} will auto-sync`);
                                        } catch (err) {
                                            showError(err);
                                        }
                                    }}
                                    onRemove={async () => {
                                        try {
                                            await removeIntegration(integration.id);
                                            success('Connection removed', `${integration.config.name} disconnected`);
                                        } catch (err) {
                                            showError(err);
                                        }
                                    }}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            {/* Add Integration Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddIntegrationModal
                        onClose={() => {
                            setShowAddModal(false);
                            setSelectedType(null);
                        }}
                        selectedType={selectedType}
                        onSelectType={setSelectedType}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onAdd={async (config) => {
                            try {
                                await addIntegration(config);
                                success('Connection added', `${config.name} connected successfully`);
                                setShowAddModal(false);
                                setSelectedType(null);
                            } catch (err) {
                                showError(err);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function StatCard({
    icon,
    label,
    value,
    sublabel,
    highlight = false,
    highlightColor = 'orange',
}: {
    icon: string;
    label: string;
    value: string | number;
    sublabel: string;
    highlight?: boolean;
    highlightColor?: 'orange' | 'rose';
}) {
    const highlightClass = highlight
        ? highlightColor === 'rose'
            ? 'border-rose-500/30 shadow-rose-500/5'
            : 'border-[#DA7756]/30 shadow-[#DA7756]/5'
        : 'border-white/[0.06]';

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={`bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl p-4 border shadow-lg ${highlightClass}`}
            style={{ backgroundImage: noiseTexture }}
        >
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-sm text-slate-400">{label}</div>
                    <div className="text-xs text-slate-500">{sublabel}</div>
                </div>
            </div>
        </motion.div>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <motion.div
            variants={cardVariants}
            className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl p-12 border border-white/[0.06] text-center"
            style={{ backgroundImage: noiseTexture }}
        >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Link2 className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No data sources connected</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Connect to Google Sheets, Supabase, PostgreSQL, or receive real-time data via webhooks.
            </p>
            <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(218, 119, 86, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={onAdd}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C15F3C] to-[#DA7756] text-white shadow-lg shadow-[#DA7756]/20 transition-all"
            >
                <Plus className="w-5 h-5" />
                Add Your First Data Source
            </motion.button>
        </motion.div>
    );
}

function IntegrationCard({
    integration,
    onRefresh,
    onPause,
    onResume,
    onRemove,
}: {
    integration: Integration;
    onRefresh: () => void;
    onPause: () => void;
    onResume: () => void;
    onRemove: () => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const catalogItem = INTEGRATION_CATALOG.find(c => c.type === integration.config.type);

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden"
            style={{ backgroundImage: noiseTexture }}
        >
            {/* Main Row */}
            <div className="p-4 flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center text-2xl">
                    {getIntegrationIcon(integration.config.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white truncate">
                            {integration.config.name}
                        </h3>
                        <span className={`text-sm ${getStatusColor(integration.status)}`}>
                            {getStatusIcon(integration.status)}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{catalogItem?.name || integration.config.type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatLastSync(integration.lastSyncAt)}
                        </span>
                        {integration.metadata.rowCount !== undefined && (
                            <>
                                <span>•</span>
                                <span>{integration.metadata.rowCount.toLocaleString()} rows</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onRefresh}
                        disabled={integration.status === 'syncing'}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                    </motion.button>
                    {integration.status === 'paused' ? (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onResume}
                            className="p-2 text-slate-400 hover:text-[#DA7756] hover:bg-[#DA7756]/10 rounded-lg transition-all"
                            title="Resume"
                        >
                            <Play className="w-5 h-5" />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onPause}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                            title="Pause"
                        >
                            <Pause className="w-5 h-5" />
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onRemove}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Remove"
                    >
                        <Trash2 className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Error Message */}
            {integration.status === 'error' && integration.lastError && (
                <div className="px-4 pb-4">
                    <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-rose-300">{integration.lastError}</div>
                    </div>
                </div>
            )}

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4 border-t border-white/[0.06] pt-4"
                    >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-white/[0.04]">
                                <div className="text-slate-500 mb-1">Type</div>
                                <div className="text-white">{catalogItem?.name}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-white/[0.04]">
                                <div className="text-slate-500 mb-1">Created</div>
                                <div className="text-white">
                                    {new Date(integration.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-white/[0.04]">
                                <div className="text-slate-500 mb-1">Sync Strategy</div>
                                <div className="text-white capitalize">
                                    {integration.config.syncStrategy.type}
                                    {integration.config.syncStrategy.type === 'scheduled' &&
                                        ` (every ${integration.config.syncStrategy.intervalMinutes} min)`}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-white/[0.04]">
                                <div className="text-slate-500 mb-1">Last Sync Duration</div>
                                <div className="text-white">
                                    {integration.metadata.syncDuration
                                        ? `${(integration.metadata.syncDuration / 1000).toFixed(2)}s`
                                        : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Add Integration Modal
// ============================================================================

function AddIntegrationModal({
    onClose,
    selectedType,
    onSelectType,
    searchQuery,
    onSearchChange,
    onAdd,
}: {
    onClose: () => void;
    selectedType: IntegrationType | null;
    onSelectType: (type: IntegrationType | null) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAdd: (config: IntegrationConfig) => Promise<void>;
}) {
    const filteredCatalog = INTEGRATION_CATALOG.filter(
        item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedByTier = {
        1: filteredCatalog.filter(i => i.tier === 1),
        2: filteredCatalog.filter(i => i.tier === 2),
        3: filteredCatalog.filter(i => i.tier === 3),
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 backdrop-blur-xl rounded-2xl border border-white/[0.08] w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                style={{ backgroundImage: noiseTexture }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {selectedType ? 'Configure Integration' : 'Add Data Source'}
                            </h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {selectedType ? 'Enter your connection details' : 'Choose a data source to connect'}
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {selectedType ? (
                        <ConfigurationForm type={selectedType} onBack={() => onSelectType(null)} onSubmit={onAdd} />
                    ) : (
                        <>
                            {/* Search */}
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => onSearchChange(e.target.value)}
                                    placeholder="Search integrations..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors"
                                />
                            </div>

                            {/* Tier 1 - Most Used */}
                            {groupedByTier[1].length > 0 && (
                                <IntegrationGroup title="Most Used" subtitle="80% of indie devs use these" items={groupedByTier[1]} onSelect={onSelectType} />
                            )}

                            {/* Tier 2 - Common Backends */}
                            {groupedByTier[2].length > 0 && (
                                <IntegrationGroup title="Databases" subtitle="Connect to your backend" items={groupedByTier[2]} onSelect={onSelectType} />
                            )}

                            {/* Tier 3 - Game Platforms */}
                            {groupedByTier[3].length > 0 && (
                                <IntegrationGroup title="Game Platforms" subtitle="Gaming-specific services" items={groupedByTier[3]} onSelect={onSelectType} />
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

function IntegrationGroup({
    title,
    subtitle,
    items,
    onSelect,
}: {
    title: string;
    subtitle: string;
    items: IntegrationCatalogItem[];
    onSelect: (type: IntegrationType) => void;
}) {
    return (
        <div className="mb-8">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(item => (
                    <motion.button
                        key={item.type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(item.type)}
                        className="flex items-center gap-4 p-4 bg-slate-800/40 hover:bg-slate-800/60 border border-white/[0.06] hover:border-[#DA7756]/30 rounded-xl text-left transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-white/[0.06] flex items-center justify-center text-2xl">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-white group-hover:text-[#DA7756] transition-colors">
                                {item.name}
                            </div>
                            <div className="text-sm text-slate-500 truncate">
                                {item.description}
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-[#DA7756] transition-colors" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Configuration Form
// ============================================================================

function ConfigurationForm({
    type,
    onBack,
    onSubmit,
}: {
    type: IntegrationType;
    onBack: () => void;
    onSubmit: (config: IntegrationConfig) => Promise<void>;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const catalogItem = INTEGRATION_CATALOG.find(c => c.type === type);

    // Form state
    const [name, setName] = useState(catalogItem?.name || '');
    const [apiKey, setApiKey] = useState('');
    const [projectUrl, setProjectUrl] = useState('');
    const [tableName, setTableName] = useState('');
    const [spreadsheetId, setSpreadsheetId] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState('5432');
    const [database, setDatabase] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [syncType, setSyncType] = useState<'manual' | 'scheduled'>('manual');
    const [syncInterval, setSyncInterval] = useState('60');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const syncStrategy = syncType === 'scheduled'
                ? { type: 'scheduled' as const, intervalMinutes: parseInt(syncInterval) }
                : { type: 'manual' as const };

            let config: IntegrationConfig;

            switch (type) {
                case 'supabase':
                    config = { name, type, auth: { type: 'apikey', key: apiKey }, syncStrategy, supabase: { projectUrl, tableName } };
                    break;
                case 'google_sheets':
                    config = { name, type, auth: { type: 'oauth', provider: 'google' }, syncStrategy, googleSheets: { spreadsheetId, hasHeaderRow: true } };
                    break;
                case 'postgresql':
                    config = { name, type, auth: { type: 'basic', username, password }, syncStrategy, postgresql: { host, port: parseInt(port), database, ssl: true, tableName } };
                    break;
                case 'webhook':
                    config = { name, type, auth: apiKey ? { type: 'apikey', key: apiKey } : { type: 'none' }, syncStrategy: { type: 'webhook' }, webhook: { endpointPath: `/webhook/${Date.now()}`, secretKey: apiKey || undefined } };
                    break;
                default:
                    config = { name, type, auth: { type: 'none' }, syncStrategy };
            }

            await onSubmit(config);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add integration');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Back button */}
            <motion.button
                type="button"
                whileHover={{ x: -4 }}
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to integrations
            </motion.button>

            {/* Integration header */}
            <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-xl border border-white/[0.06]">
                <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-white/[0.06] flex items-center justify-center text-2xl">
                    {catalogItem?.icon}
                </div>
                <div>
                    <div className="font-semibold text-white">{catalogItem?.name}</div>
                    <div className="text-sm text-slate-500">{catalogItem?.description}</div>
                </div>
            </div>

            {/* Common: Name */}
            <FormField label="Connection Name" required>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="My Data Source"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors"
                    required
                />
            </FormField>

            {/* Type-specific fields */}
            {type === 'supabase' && (
                <>
                    <FormField label="Project URL" required hint="Found in your Supabase project settings">
                        <input type="url" value={projectUrl} onChange={e => setProjectUrl(e.target.value)} placeholder="https://xxx.supabase.co" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                    </FormField>
                    <FormField label="API Key (anon or service role)" required>
                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="eyJ..." className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                    </FormField>
                    <FormField label="Table Name" required>
                        <input type="text" value={tableName} onChange={e => setTableName(e.target.value)} placeholder="game_events" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                    </FormField>
                </>
            )}

            {type === 'google_sheets' && (
                <>
                    <FormField label="Spreadsheet ID" required hint="The ID from the spreadsheet URL: docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit">
                        <input type="text" value={spreadsheetId} onChange={e => setSpreadsheetId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                    </FormField>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-200">
                                Google OAuth requires additional setup. After saving, you'll be redirected to sign in with Google.
                            </div>
                        </div>
                    </div>
                </>
            )}

            {type === 'postgresql' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Host" required>
                            <input type="text" value={host} onChange={e => setHost(e.target.value)} placeholder="db.example.com" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                        </FormField>
                        <FormField label="Port" required>
                            <input type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="5432" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                        </FormField>
                    </div>
                    <FormField label="Database" required>
                        <input type="text" value={database} onChange={e => setDatabase(e.target.value)} placeholder="myapp_production" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Username" required>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="postgres" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                        </FormField>
                        <FormField label="Password" required>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" required />
                        </FormField>
                    </div>
                    <FormField label="Table Name">
                        <input type="text" value={tableName} onChange={e => setTableName(e.target.value)} placeholder="game_events (optional - can select later)" className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" />
                    </FormField>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Database className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-200">
                                Connection is read-only for safety. Credentials are encrypted locally.
                            </div>
                        </div>
                    </div>
                </>
            )}

            {type === 'webhook' && (
                <>
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-white/[0.06]">
                        <div className="text-sm text-slate-400 mb-2">Your webhook URL will be:</div>
                        <code className="text-[#DA7756] text-sm break-all">
                            https://your-domain.com/webhook/[unique-id]
                        </code>
                    </div>
                    <FormField label="Secret Key (optional)" hint="Used to validate incoming webhooks">
                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="whsec_..." className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#DA7756]/50 transition-colors" />
                    </FormField>
                </>
            )}

            {/* Sync settings (for non-webhook types) */}
            {type !== 'webhook' && (
                <FormField label="Sync Settings">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-800/60 transition-colors border border-white/[0.04]">
                            <input type="radio" name="syncType" value="manual" checked={syncType === 'manual'} onChange={() => setSyncType('manual')} className="text-[#DA7756] accent-[#DA7756]" />
                            <div>
                                <div className="text-white">Manual</div>
                                <div className="text-sm text-slate-500">Refresh data on demand</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-800/60 transition-colors border border-white/[0.04]">
                            <input type="radio" name="syncType" value="scheduled" checked={syncType === 'scheduled'} onChange={() => setSyncType('scheduled')} className="text-[#DA7756] accent-[#DA7756]" />
                            <div className="flex-1">
                                <div className="text-white">Scheduled</div>
                                <div className="text-sm text-slate-500">Auto-refresh at intervals</div>
                            </div>
                            {syncType === 'scheduled' && (
                                <select value={syncInterval} onChange={e => setSyncInterval(e.target.value)} className="px-3 py-1.5 bg-slate-900/50 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#DA7756]/50">
                                    <option value="5">Every 5 min</option>
                                    <option value="15">Every 15 min</option>
                                    <option value="60">Every hour</option>
                                    <option value="1440">Daily</option>
                                </select>
                            )}
                        </label>
                    </div>
                </FormField>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-rose-300">{error}</div>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onBack}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                    Cancel
                </motion.button>
                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(218, 119, 86, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-[#C15F3C] to-[#DA7756] text-white disabled:opacity-50 transition-all shadow-lg shadow-[#DA7756]/20"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            Connect
                        </>
                    )}
                </motion.button>
            </div>
        </form>
    );
}

function FormField({
    label,
    required,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                {label}
                {required && <span className="text-rose-400 ml-1">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
        </div>
    );
}

export default IntegrationsPage;
