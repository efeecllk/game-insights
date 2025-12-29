/**
 * Data Hub Page
 * Unified data connection hub - the single entry point for all data import methods
 * Phase 3: Data Sources - Streamlined Data Connection & Management
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
import {
    Integration,
    IntegrationType,
    IntegrationConfig,
    INTEGRATION_CATALOG,
    IntegrationCatalogItem,
    formatLastSync,
    getStatusIcon,
    getIntegrationIcon,
} from '../lib/integrationStore';

// ============================================================================
// Types
// ============================================================================

type ImportMethod = 'upload' | 'connect' | 'paste';

// ============================================================================
// Main Page Component
// ============================================================================

export function DataHubPage() {
    const {
        integrations,
        isLoading,
        addIntegration,
        removeIntegration,
        refreshIntegration,
        pauseIntegration,
        resumeIntegration,
    } = useIntegrations();

    const { gameDataList } = useData();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [, setActiveMethod] = useState<ImportMethod | null>(null);

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

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <HeroSection onSelectMethod={setActiveMethod} />

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

            {/* Connected Integrations Section */}
            {integrations.length > 0 && (
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
                                onRefresh={() => refreshIntegration(integration.id)}
                                onPause={() => pauseIntegration(integration.id)}
                                onResume={() => resumeIntegration(integration.id)}
                                onRemove={() => removeIntegration(integration.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State (when nothing connected yet) */}
            {!hasData && (
                <EmptyStateGuide onSelectMethod={setActiveMethod} />
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
                        await addIntegration(config);
                        setShowAddModal(false);
                        setSelectedType(null);
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
    onSelectMethod,
}: {
    onSelectMethod: (method: ImportMethod) => void;
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
                    onClick={() => onSelectMethod('connect')}
                    gradientFrom="from-purple-500"
                    gradientTo="to-indigo-500"
                    featured
                />

                <ImportOptionCard
                    icon={<ClipboardPaste className="w-7 h-7" />}
                    title="Paste Data"
                    description="Copy from spreadsheet"
                    benefits={['Quick test', 'Small data', 'No file needed']}
                    buttonLabel="Paste Data"
                    onClick={() => onSelectMethod('paste')}
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
    onSelectMethod,
}: {
    onSelectMethod: (method: ImportMethod) => void;
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
                    onClick={() => onSelectMethod('connect')}
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
            <div className="bg-th-bg-surface rounded-2xl border border-th-border w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-th-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-th-text-primary">
                            {selectedType ? 'Configure Integration' : 'Add Data Source'}
                        </h2>
                        <p className="text-sm text-th-text-muted mt-1">
                            {selectedType
                                ? 'Enter your connection details'
                                : 'Choose a data source to connect'}
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
    // PostgreSQL fields (for future implementation)
    const [host] = useState('');
    const [port] = useState('5432');
    const [database] = useState('');
    const [username] = useState('');
    const [password] = useState('');
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
                        supabase: { projectUrl, tableName },
                    };
                    break;

                case 'google_sheets':
                    config = {
                        name,
                        type,
                        auth: { type: 'oauth', provider: 'google' },
                        syncStrategy,
                        googleSheets: { spreadsheetId, hasHeaderRow: true },
                    };
                    break;

                case 'postgresql':
                    config = {
                        name,
                        type,
                        auth: { type: 'basic', username, password },
                        syncStrategy,
                        postgresql: { host, port: parseInt(port), database, ssl: true, tableName },
                    };
                    break;

                case 'webhook':
                    config = {
                        name,
                        type,
                        auth: apiKey ? { type: 'apikey', key: apiKey } : { type: 'none' },
                        syncStrategy: { type: 'webhook' },
                        webhook: { endpointPath: `/webhook/${Date.now()}`, secretKey: apiKey || undefined },
                    };
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
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-primary transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to integrations
            </button>

            {/* Integration header */}
            <div className="flex items-center gap-4 p-4 bg-th-bg-elevated rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-th-bg-surface flex items-center justify-center text-2xl">
                    {catalogItem?.icon}
                </div>
                <div>
                    <div className="font-semibold text-th-text-primary">{catalogItem?.name}</div>
                    <div className="text-sm text-th-text-muted">{catalogItem?.description}</div>
                </div>
            </div>

            {/* Common: Name */}
            <FormField label="Connection Name" required>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="My Data Source"
                    className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary transition-colors"
                    required
                />
            </FormField>

            {/* Type-specific fields - simplified for now */}
            {type === 'supabase' && (
                <>
                    <FormField label="Project URL" required hint="Found in your Supabase project settings">
                        <input
                            type="url"
                            value={projectUrl}
                            onChange={e => setProjectUrl(e.target.value)}
                            placeholder="https://xxx.supabase.co"
                            className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary transition-colors"
                            required
                        />
                    </FormField>
                    <FormField label="API Key (anon or service role)" required>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="eyJ..."
                            className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary transition-colors"
                            required
                        />
                    </FormField>
                    <FormField label="Table Name" required>
                        <input
                            type="text"
                            value={tableName}
                            onChange={e => setTableName(e.target.value)}
                            placeholder="game_events"
                            className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary transition-colors"
                            required
                        />
                    </FormField>
                </>
            )}

            {type === 'google_sheets' && (
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
                        className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary transition-colors"
                        required
                    />
                </FormField>
            )}

            {/* Sync settings */}
            {type !== 'webhook' && (
                <FormField label="Sync Settings">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-th-bg-elevated rounded-lg cursor-pointer hover:bg-th-interactive-hover transition-colors">
                            <input
                                type="radio"
                                name="syncType"
                                value="manual"
                                checked={syncType === 'manual'}
                                onChange={() => setSyncType('manual')}
                                className="text-th-accent-primary"
                            />
                            <div>
                                <div className="text-th-text-primary">Manual</div>
                                <div className="text-sm text-th-text-muted">Refresh data on demand</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-th-bg-elevated rounded-lg cursor-pointer hover:bg-th-interactive-hover transition-colors">
                            <input
                                type="radio"
                                name="syncType"
                                value="scheduled"
                                checked={syncType === 'scheduled'}
                                onChange={() => setSyncType('scheduled')}
                                className="text-th-accent-primary"
                            />
                            <div className="flex-1">
                                <div className="text-th-text-primary">Scheduled</div>
                                <div className="text-sm text-th-text-muted">Auto-refresh at intervals</div>
                            </div>
                            {syncType === 'scheduled' && (
                                <select
                                    value={syncInterval}
                                    onChange={e => setSyncInterval(e.target.value)}
                                    className="px-3 py-1.5 bg-th-bg-surface border border-th-border rounded-lg text-th-text-primary text-sm"
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
            <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 text-th-text-muted hover:text-th-text-primary transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-th-accent-primary hover:bg-th-accent-primary-hover text-white rounded-xl disabled:opacity-50 transition-colors"
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
            <label className="block text-sm font-medium text-th-text-secondary mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-th-text-muted mt-1.5">{hint}</p>}
        </div>
    );
}

export default DataHubPage;
