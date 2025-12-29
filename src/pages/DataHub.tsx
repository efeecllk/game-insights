/**
 * Data Hub Page
 * Unified data connection hub - the single entry point for all data import methods
 * Phase 3: Data Sources - Streamlined Data Connection & Management
 * Phase 8: Enhanced error handling with user-friendly messages
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    Settings,
    Activity,
} from 'lucide-react';
import { useIntegrations } from '../context/IntegrationContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
    Integration,
    IntegrationType,
    INTEGRATION_CATALOG,
    IntegrationCatalogItem,
    formatLastSync,
    getStatusIcon,
    getIntegrationIcon,
} from '../lib/integrationStore';
import { ConnectionWizard, ConnectionHealth } from '../components/data';

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
                <Loader2 className="w-8 h-8 text-th-accent-primary animate-spin" />
            </div>
        );
    }

    const hasData = integrations.length > 0 || gameDataList.length > 0;

    const handleBrowseSources = () => {
        setShowAddModal(true);
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <HeroSection onBrowseSources={handleBrowseSources} />

            {/* Quick Stats */}
            {hasData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Database className="w-5 h-5 text-indigo-400" />}
                        label="Data Sources"
                        value={integrations.length + gameDataList.length}
                        bgColor="bg-indigo-500/10"
                    />
                    <StatCard
                        icon={<Activity className="w-5 h-5 text-green-400" />}
                        label="Connected"
                        value={connectedCount + gameDataList.length}
                        bgColor="bg-green-500/10"
                    />
                    <StatCard
                        icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                        label="Errors"
                        value={errorCount}
                        bgColor="bg-red-500/10"
                    />
                    <StatCard
                        icon={<FileSpreadsheet className="w-5 h-5 text-blue-400" />}
                        label="Total Rows"
                        value={totalRows.toLocaleString()}
                        bgColor="bg-blue-500/10"
                    />
                </div>
            )}

            {/* Uploaded Files Section */}
            {gameDataList.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-th-text-primary">Uploaded Files</h2>
                        <Link
                            to="/upload"
                            className="text-sm text-th-accent-primary hover:underline flex items-center gap-1"
                        >
                            Upload more <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid gap-3">
                        {gameDataList.map(data => (
                            <UploadedFileCard key={data.id} data={data} />
                        ))}
                    </div>
                </div>
            )}

            {/* Connection Health Dashboard */}
            {integrations.length > 0 && (
                <ConnectionHealth />
            )}

            {/* Connected Integrations Section (legacy list view) */}
            {integrations.length > 0 && integrations.length <= 3 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-th-text-primary">Connected Sources</h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="text-sm text-th-accent-primary hover:underline flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Add Source
                        </button>
                    </div>
                    <div className="grid gap-3">
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
                </div>
            )}

            {/* Empty State (when nothing connected yet) */}
            {!hasData && (
                <EmptyStateGuide onConnectSource={handleBrowseSources} />
            )}

            {/* Add Integration Modal (catalog browser) */}
            {showAddModal && (
                <AddIntegrationModal
                    onClose={() => {
                        setShowAddModal(false);
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSelectType={(type) => {
                        setShowAddModal(false);
                        setWizardType(type);
                        setShowWizard(true);
                    }}
                />
            )}

            {/* Connection Wizard (full wizard flow) */}
            {showWizard && (
                <ConnectionWizard
                    initialType={wizardType || undefined}
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
        </div>
    );
}

// ============================================================================
// Hero Section
// ============================================================================

function HeroSection({
    onBrowseSources,
}: {
    onBrowseSources: () => void;
}) {
    return (
        <div className="bg-gradient-to-br from-th-bg-surface to-th-bg-elevated rounded-2xl border border-th-border p-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-th-text-primary mb-2">
                    Connect Your Game Data
                </h1>
                <p className="text-th-text-muted max-w-lg mx-auto">
                    Game Insights works best with your actual player data.
                    Choose how you'd like to import your analytics:
                </p>
            </div>

            {/* Import Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImportOptionCard
                    icon={<Upload className="w-7 h-7" />}
                    title="Upload File"
                    description="CSV, Excel, JSON files"
                    benefits={['Quick analysis', 'One-time import', 'Historical data']}
                    buttonLabel="Upload File"
                    href="/upload"
                    gradientFrom="from-blue-500"
                    gradientTo="to-cyan-500"
                />

                <ImportOptionCard
                    icon={<Plug className="w-7 h-7" />}
                    title="Connect Live Source"
                    description="Google Sheets, Firebase, databases"
                    benefits={['Auto updates', 'Real-time sync', 'Always fresh']}
                    buttonLabel="Browse Sources"
                    onClick={onBrowseSources}
                    gradientFrom="from-purple-500"
                    gradientTo="to-indigo-500"
                    featured
                />

                <ImportOptionCard
                    icon={<ClipboardPaste className="w-7 h-7" />}
                    title="Paste Data"
                    description="Copy from spreadsheet"
                    benefits={['Quick test', 'Small data', 'No file needed']}
                    buttonLabel="Coming Soon"
                    gradientFrom="from-emerald-500"
                    gradientTo="to-teal-500"
                />
            </div>
        </div>
    );
}

function ImportOptionCard({
    icon,
    title,
    description,
    benefits,
    buttonLabel,
    href,
    onClick,
    gradientFrom,
    gradientTo,
    featured = false,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    benefits: string[];
    buttonLabel: string;
    href?: string;
    onClick?: () => void;
    gradientFrom: string;
    gradientTo: string;
    featured?: boolean;
}) {
    const cardContent = (
        <div className={`relative bg-th-bg-surface rounded-xl border p-6 h-full flex flex-col transition-all duration-200 hover:border-th-accent-primary hover:shadow-lg ${featured ? 'border-th-accent-primary/50 ring-1 ring-th-accent-primary/20' : 'border-th-border'}`}>
            {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-th-accent-primary text-white text-xs font-medium rounded-full">
                    Recommended
                </div>
            )}

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center text-white mb-4`}>
                {icon}
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">{title}</h3>
            <p className="text-sm text-th-text-muted mb-4">{description}</p>

            {/* Benefits */}
            <ul className="space-y-2 mb-6 flex-1">
                {benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-th-text-secondary">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {benefit}
                    </li>
                ))}
            </ul>

            {/* Button */}
            <button className="w-full py-2.5 px-4 bg-th-bg-elevated hover:bg-th-interactive-hover text-th-text-primary font-medium rounded-lg border border-th-border transition-colors flex items-center justify-center gap-2">
                {buttonLabel}
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );

    if (href) {
        return <Link to={href} className="block">{cardContent}</Link>;
    }

    return <div onClick={onClick} className="cursor-pointer">{cardContent}</div>;
}

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({
    icon,
    label,
    value,
    bgColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    bgColor: string;
}) {
    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <div className="text-2xl font-bold text-th-text-primary">{value}</div>
                    <div className="text-sm text-th-text-muted">{label}</div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Uploaded File Card
// ============================================================================

function UploadedFileCard({ data }: { data: { id: string; name: string; fileName?: string; rowCount: number; uploadedAt?: string } }) {
    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-th-text-primary truncate">{data.name}</h3>
                        <span className="text-green-500 flex items-center gap-1 text-sm">
                            <Check className="w-3.5 h-3.5" /> Ready
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-th-text-muted mt-1">
                        {data.fileName && <span>{data.fileName}</span>}
                        <span>{data.rowCount.toLocaleString()} rows</span>
                        {data.uploadedAt && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(data.uploadedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Link
                        to="/analytics"
                        className="px-4 py-2 bg-th-accent-primary text-white rounded-lg text-sm font-medium hover:bg-th-accent-primary-hover transition-colors"
                    >
                        View Analytics
                    </Link>
                    <Link
                        to="/upload"
                        className="p-2 text-th-text-muted hover:text-th-text-secondary hover:bg-th-interactive-hover rounded-lg transition-colors"
                        title="Upload new version"
                    >
                        <Upload className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
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
}: {
    integration: Integration;
    onRefresh: () => void;
    onPause: () => void;
    onResume: () => void;
    onRemove: () => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const catalogItem = INTEGRATION_CATALOG.find(c => c.type === integration.config.type);

    const statusStyles: Record<string, string> = {
        connected: 'text-green-500',
        syncing: 'text-blue-500',
        error: 'text-red-500',
        paused: 'text-yellow-500',
    };

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
            {/* Main Row */}
            <div className="p-4 flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-th-bg-elevated flex items-center justify-center text-2xl">
                    {getIntegrationIcon(integration.config.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-th-text-primary truncate">
                            {integration.config.name}
                        </h3>
                        <span className={`text-sm flex items-center gap-1 ${statusStyles[integration.status] || 'text-th-text-muted'}`}>
                            {getStatusIcon(integration.status)}
                            <span className="capitalize">{integration.status}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-th-text-muted mt-1">
                        <span>{catalogItem?.name || integration.config.type}</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatLastSync(integration.lastSyncAt)}
                        </span>
                        {integration.metadata.rowCount !== undefined && (
                            <span>{integration.metadata.rowCount.toLocaleString()} rows</span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onRefresh}
                        disabled={integration.status === 'syncing'}
                        className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover rounded-lg transition-colors disabled:opacity-50"
                        title="Sync Now"
                    >
                        <RefreshCw className={`w-5 h-5 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                    </button>
                    {integration.status === 'paused' ? (
                        <button
                            onClick={onResume}
                            className="p-2 text-th-text-muted hover:text-green-500 hover:bg-th-interactive-hover rounded-lg transition-colors"
                            title="Resume"
                        >
                            <Play className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={onPause}
                            className="p-2 text-th-text-muted hover:text-yellow-500 hover:bg-th-interactive-hover rounded-lg transition-colors"
                            title="Pause"
                        >
                            <Pause className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover rounded-lg transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-2 text-th-text-muted hover:text-red-500 hover:bg-th-interactive-hover rounded-lg transition-colors"
                        title="Remove"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {integration.status === 'error' && integration.lastError && (
                <div className="px-4 pb-4">
                    <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-red-400">{integration.lastError}</p>
                            <button className="text-sm text-red-400 hover:text-red-300 underline mt-1">
                                Fix Connection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-th-border pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-th-text-muted mb-1">Type</div>
                            <div className="text-th-text-primary">{catalogItem?.name}</div>
                        </div>
                        <div>
                            <div className="text-th-text-muted mb-1">Created</div>
                            <div className="text-th-text-primary">
                                {new Date(integration.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-th-text-muted mb-1">Sync Strategy</div>
                            <div className="text-th-text-primary capitalize">
                                {integration.config.syncStrategy.type}
                                {integration.config.syncStrategy.type === 'scheduled' &&
                                    ` (${integration.config.syncStrategy.intervalMinutes} min)`}
                            </div>
                        </div>
                        <div>
                            <div className="text-th-text-muted mb-1">Last Sync Duration</div>
                            <div className="text-th-text-primary">
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
// Empty State Guide
// ============================================================================

function EmptyStateGuide({
    onConnectSource,
}: {
    onConnectSource: () => void;
}) {
    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border p-8 text-center">
            <div className="w-16 h-16 bg-th-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CloudLightning className="w-8 h-8 text-th-accent-primary" />
            </div>
            <h3 className="text-xl font-semibold text-th-text-primary mb-2">
                Ready to analyze your game data?
            </h3>
            <p className="text-th-text-muted mb-6 max-w-md mx-auto">
                Upload a file to get started instantly, or connect a live data source for automatic updates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                    to="/upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-th-accent-primary text-white rounded-xl font-medium hover:bg-th-accent-primary-hover transition-colors"
                >
                    <Upload className="w-5 h-5" />
                    Upload Your First File
                </Link>
                <button
                    onClick={onConnectSource}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-th-bg-elevated text-th-text-primary rounded-xl font-medium border border-th-border hover:bg-th-interactive-hover transition-colors"
                >
                    <Plug className="w-5 h-5" />
                    Connect Data Source
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Add Integration Modal (imported from original Integrations.tsx)
// ============================================================================

function AddIntegrationModal({
    onClose,
    searchQuery,
    onSearchChange,
    onSelectType,
}: {
    onClose: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelectType: (type: IntegrationType) => void;
}) {
    const filteredCatalog = INTEGRATION_CATALOG.filter(
        item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedByTier = {
        1: filteredCatalog.filter(i => i.tier === 1),
        2: filteredCatalog.filter(i => i.tier === 2),
        3: filteredCatalog.filter(i => i.tier >= 3),
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-th-bg-surface rounded-2xl border border-th-border w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-th-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-th-text-primary">Add Data Source</h2>
                        <p className="text-sm text-th-text-muted mt-1">
                            Choose a data source to connect
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder="Search integrations..."
                            className="w-full pl-10 pr-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary transition-colors"
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
                <h3 className="text-lg font-semibold text-th-text-primary">{title}</h3>
                <p className="text-sm text-th-text-muted">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(item => (
                    <button
                        key={item.type}
                        onClick={() => onSelect(item.type)}
                        className="flex items-center gap-4 p-4 bg-th-bg-elevated hover:bg-th-interactive-hover border border-th-border hover:border-th-accent-primary/50 rounded-xl text-left transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-th-bg-surface flex items-center justify-center text-2xl">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-th-text-primary group-hover:text-th-accent-primary transition-colors">
                                {item.name}
                            </div>
                            <div className="text-sm text-th-text-muted truncate">
                                {item.description}
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-th-text-muted group-hover:text-th-accent-primary transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default DataHubPage;
