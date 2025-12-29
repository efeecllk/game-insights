/**
 * Integrations Page - Integration Hub UI
 * Manage all data source connections
 * Phase 3: One-Click Integrations
 * Phase 8: Enhanced error handling with user-friendly messages
 */

import { useState } from 'react';
import {
    Plus,
    RefreshCw,
    Trash2,
    Settings,
    Pause,
    Play,
    Search,
    AlertCircle,
    Check,
    Clock,
    Database,
    Link2,
    Loader2,
    ChevronRight,
    X,
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Database className="w-7 h-7 text-accent-primary" />
                        Data Sources
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        Connect to your data and sync automatically
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Data Source
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon="📊"
                    label="Total Sources"
                    value={integrations.length}
                    sublabel="Connected data sources"
                />
                <StatCard
                    icon="🟢"
                    label="Connected"
                    value={connectedCount}
                    sublabel="Active connections"
                    highlight={connectedCount > 0}
                />
                <StatCard
                    icon="🔴"
                    label="Errors"
                    value={errorCount}
                    sublabel="Need attention"
                    highlight={errorCount > 0}
                    highlightColor="red"
                />
                <StatCard
                    icon="📈"
                    label="Total Rows"
                    value={integrations.reduce((sum, i) => sum + (i.metadata.rowCount || 0), 0).toLocaleString()}
                    sublabel="Across all sources"
                />
            </div>

            {/* Integrations List */}
            {integrations.length === 0 ? (
                <EmptyState onAdd={() => setShowAddModal(true)} />
            ) : (
                <div className="space-y-4">
                    {integrations.map(integration => (
                        <IntegrationCard
                            key={integration.id}
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
                    ))}
                </div>
            )}

            {/* Add Integration Modal */}
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
    highlightColor = 'green',
}: {
    icon: string;
    label: string;
    value: string | number;
    sublabel: string;
    highlight?: boolean;
    highlightColor?: 'green' | 'red';
}) {
    const highlightClass = highlight
        ? highlightColor === 'red'
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-green-500/30 bg-green-500/5'
        : 'border-white/[0.06]';

    return (
        <div className={`bg-bg-card rounded-card p-4 border ${highlightClass}`}>
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-sm text-zinc-500">{label}</div>
                    <div className="text-xs text-zinc-600">{sublabel}</div>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="bg-bg-card rounded-card p-12 border border-white/[0.06] text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-primary/10 flex items-center justify-center">
                <Link2 className="w-8 h-8 text-accent-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No data sources connected</h3>
            <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                Connect to Google Sheets, Supabase, PostgreSQL, or receive real-time data via webhooks.
            </p>
            <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl transition-colors"
            >
                <Plus className="w-5 h-5" />
                Add Your First Data Source
            </button>
        </div>
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
        <div className="bg-bg-card rounded-card border border-white/[0.06] overflow-hidden">
            {/* Main Row */}
            <div className="p-4 flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center text-2xl">
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
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={integration.status === 'syncing'}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                    </button>
                    {integration.status === 'paused' ? (
                        <button
                            onClick={onResume}
                            className="p-2 text-zinc-400 hover:text-green-500 hover:bg-bg-elevated rounded-lg transition-colors"
                            title="Resume"
                        >
                            <Play className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={onPause}
                            className="p-2 text-zinc-400 hover:text-yellow-500 hover:bg-bg-elevated rounded-lg transition-colors"
                            title="Pause"
                        >
                            <Pause className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-bg-elevated rounded-lg transition-colors"
                        title="Remove"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {integration.status === 'error' && integration.lastError && (
                <div className="px-4 pb-4">
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-400">{integration.lastError}</div>
                    </div>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/[0.06] pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-zinc-500 mb-1">Type</div>
                            <div className="text-white">{catalogItem?.name}</div>
                        </div>
                        <div>
                            <div className="text-zinc-500 mb-1">Created</div>
                            <div className="text-white">
                                {new Date(integration.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 mb-1">Sync Strategy</div>
                            <div className="text-white capitalize">
                                {integration.config.syncStrategy.type}
                                {integration.config.syncStrategy.type === 'scheduled' &&
                                    ` (every ${integration.config.syncStrategy.intervalMinutes} min)`}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 mb-1">Last Sync Duration</div>
                            <div className="text-white">
                                {integration.metadata.syncDuration
                                    ? `${(integration.metadata.syncDuration / 1000).toFixed(2)}s`
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-bg-card rounded-2xl border border-white/[0.1] w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {selectedType ? 'Configure Integration' : 'Add Data Source'}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            {selectedType
                                ? 'Enter your connection details'
                                : 'Choose a data source to connect'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedType ? (
                        <ConfigurationForm
                            type={selectedType}
                            onBack={() => onSelectType(null)}
                            onSubmit={onAdd}
                        />
                    ) : (
                        <>
                            {/* Search */}
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => onSearchChange(e.target.value)}
                                    placeholder="Search integrations..."
                                    className="w-full pl-10 pr-4 py-3 bg-bg-elevated border border-white/[0.1] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-accent-primary transition-colors"
                                />
                            </div>

                            {/* Tier 1 - Most Used */}
                            {groupedByTier[1].length > 0 && (
                                <IntegrationGroup
                                    title="Most Used"
                                    subtitle="80% of indie devs use these"
                                    items={groupedByTier[1]}
                                    onSelect={onSelectType}
                                />
                            )}

                            {/* Tier 2 - Common Backends */}
                            {groupedByTier[2].length > 0 && (
                                <IntegrationGroup
                                    title="Databases"
                                    subtitle="Connect to your backend"
                                    items={groupedByTier[2]}
                                    onSelect={onSelectType}
                                />
                            )}

                            {/* Tier 3 - Game Platforms */}
                            {groupedByTier[3].length > 0 && (
                                <IntegrationGroup
                                    title="Game Platforms"
                                    subtitle="Gaming-specific services"
                                    items={groupedByTier[3]}
                                    onSelect={onSelectType}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
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
                <p className="text-sm text-zinc-500">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(item => (
                    <button
                        key={item.type}
                        onClick={() => onSelect(item.type)}
                        className="flex items-center gap-4 p-4 bg-bg-elevated hover:bg-bg-card-hover border border-white/[0.06] hover:border-accent-primary/50 rounded-xl text-left transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-bg-card flex items-center justify-center text-2xl">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-white group-hover:text-accent-primary transition-colors">
                                {item.name}
                            </div>
                            <div className="text-sm text-zinc-500 truncate">
                                {item.description}
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-accent-primary transition-colors" />
                    </button>
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
                    config = {
                        name,
                        type,
                        auth: { type: 'apikey', key: apiKey },
                        syncStrategy,
                        supabase: {
                            projectUrl,
                            tableName,
                        },
                    };
                    break;

                case 'google_sheets':
                    config = {
                        name,
                        type,
                        auth: { type: 'oauth', provider: 'google' },
                        syncStrategy,
                        googleSheets: {
                            spreadsheetId,
                            hasHeaderRow: true,
                        },
                    };
                    break;

                case 'postgresql':
                    config = {
                        name,
                        type,
                        auth: { type: 'basic', username, password },
                        syncStrategy,
                        postgresql: {
                            host,
                            port: parseInt(port),
                            database,
                            ssl: true,
                            tableName,
                        },
                    };
                    break;

                case 'webhook':
                    config = {
                        name,
                        type,
                        auth: apiKey ? { type: 'apikey', key: apiKey } : { type: 'none' },
                        syncStrategy: { type: 'webhook' },
                        webhook: {
                            endpointPath: `/webhook/${Date.now()}`,
                            secretKey: apiKey || undefined,
                        },
                    };
                    break;

                default:
                    config = {
                        name,
                        type,
                        auth: { type: 'none' },
                        syncStrategy,
                    };
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
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to integrations
            </button>

            {/* Integration header */}
            <div className="flex items-center gap-4 p-4 bg-bg-elevated rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-bg-card flex items-center justify-center text-2xl">
                    {catalogItem?.icon}
                </div>
                <div>
                    <div className="font-semibold text-white">{catalogItem?.name}</div>
                    <div className="text-sm text-zinc-500">{catalogItem?.description}</div>
                </div>
            </div>

            {/* Common: Name */}
            <FormField label="Connection Name" required>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="My Data Source"
                    className="form-input"
                    required
                />
            </FormField>

            {/* Type-specific fields */}
            {type === 'supabase' && (
                <>
                    <FormField label="Project URL" required hint="Found in your Supabase project settings">
                        <input
                            type="url"
                            value={projectUrl}
                            onChange={e => setProjectUrl(e.target.value)}
                            placeholder="https://xxx.supabase.co"
                            className="form-input"
                            required
                        />
                    </FormField>
                    <FormField label="API Key (anon or service role)" required>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="eyJ..."
                            className="form-input"
                            required
                        />
                    </FormField>
                    <FormField label="Table Name" required>
                        <input
                            type="text"
                            value={tableName}
                            onChange={e => setTableName(e.target.value)}
                            placeholder="game_events"
                            className="form-input"
                            required
                        />
                    </FormField>
                </>
            )}

            {type === 'google_sheets' && (
                <>
                    <FormField
                        label="Spreadsheet ID"
                        required
                        hint="The ID from the spreadsheet URL: docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit"
                    >
                        <input
                            type="text"
                            value={spreadsheetId}
                            onChange={e => setSpreadsheetId(e.target.value)}
                            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            className="form-input"
                            required
                        />
                    </FormField>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-200">
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
                            <input
                                type="text"
                                value={host}
                                onChange={e => setHost(e.target.value)}
                                placeholder="db.example.com"
                                className="form-input"
                                required
                            />
                        </FormField>
                        <FormField label="Port" required>
                            <input
                                type="number"
                                value={port}
                                onChange={e => setPort(e.target.value)}
                                placeholder="5432"
                                className="form-input"
                                required
                            />
                        </FormField>
                    </div>
                    <FormField label="Database" required>
                        <input
                            type="text"
                            value={database}
                            onChange={e => setDatabase(e.target.value)}
                            placeholder="myapp_production"
                            className="form-input"
                            required
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Username" required>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="postgres"
                                className="form-input"
                                required
                            />
                        </FormField>
                        <FormField label="Password" required>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="form-input"
                                required
                            />
                        </FormField>
                    </div>
                    <FormField label="Table Name">
                        <input
                            type="text"
                            value={tableName}
                            onChange={e => setTableName(e.target.value)}
                            placeholder="game_events (optional - can select later)"
                            className="form-input"
                        />
                    </FormField>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Database className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-200">
                                Connection is read-only for safety. Credentials are encrypted locally.
                            </div>
                        </div>
                    </div>
                </>
            )}

            {type === 'webhook' && (
                <>
                    <div className="p-4 bg-bg-elevated rounded-xl">
                        <div className="text-sm text-zinc-400 mb-2">Your webhook URL will be:</div>
                        <code className="text-accent-primary text-sm break-all">
                            https://your-domain.com/webhook/[unique-id]
                        </code>
                    </div>
                    <FormField label="Secret Key (optional)" hint="Used to validate incoming webhooks">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="whsec_..."
                            className="form-input"
                        />
                    </FormField>
                </>
            )}

            {/* Sync settings (for non-webhook types) */}
            {type !== 'webhook' && (
                <FormField label="Sync Settings">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg cursor-pointer hover:bg-bg-card-hover transition-colors">
                            <input
                                type="radio"
                                name="syncType"
                                value="manual"
                                checked={syncType === 'manual'}
                                onChange={() => setSyncType('manual')}
                                className="text-accent-primary"
                            />
                            <div>
                                <div className="text-white">Manual</div>
                                <div className="text-sm text-zinc-500">Refresh data on demand</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg cursor-pointer hover:bg-bg-card-hover transition-colors">
                            <input
                                type="radio"
                                name="syncType"
                                value="scheduled"
                                checked={syncType === 'scheduled'}
                                onChange={() => setSyncType('scheduled')}
                                className="text-accent-primary"
                            />
                            <div className="flex-1">
                                <div className="text-white">Scheduled</div>
                                <div className="text-sm text-zinc-500">Auto-refresh at intervals</div>
                            </div>
                            {syncType === 'scheduled' && (
                                <select
                                    value={syncInterval}
                                    onChange={e => setSyncInterval(e.target.value)}
                                    className="px-3 py-1.5 bg-bg-card border border-white/[0.1] rounded-lg text-white text-sm"
                                >
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
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-400">{error}</div>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            Connect
                        </>
                    )}
                </button>
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
            <label className="block text-sm font-medium text-zinc-300 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-zinc-500 mt-1.5">{hint}</p>}
        </div>
    );
}

export default IntegrationsPage;
