/**
 * Template Marketplace Page
 * Browse, preview, and use dashboard templates
 * Phase 4: Community & Ecosystem
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Filter,
    Download,
    Star,
    CheckCircle,
    ChevronDown,
    Layout,
    BarChart3,
    TrendingUp,
    Zap,
    Package,
    Eye,
    Plus,
    Upload,
    X,
} from 'lucide-react';
import type { DashboardTemplate, TemplateCategory } from '../lib/templateStore';
import {
    getAllTemplates,
    saveTemplate,
    incrementDownloads,
    incrementStars,
    decrementStars,
    serializeTemplate,
    deserializeTemplate,
    validateTemplate,
} from '../lib/templateStore';
import { STARTER_TEMPLATES, initializeStarterTemplates } from '../lib/starterTemplates';
import type { GameCategory } from '../types';

// ============================================================================
// Types
// ============================================================================

type SortOption = 'popular' | 'recent' | 'stars' | 'name';
type ViewMode = 'grid' | 'list';

interface TemplateFilters {
    category: TemplateCategory | 'all';
    gameType: GameCategory | 'all';
    search: string;
    verified: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function TemplatesPage() {
    const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<TemplateFilters>({
        category: 'all',
        gameType: 'all',
        search: '',
        verified: false,
    });
    const [sortBy, setSortBy] = useState<SortOption>('popular');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [starredTemplates, setStarredTemplates] = useState<Set<string>>(new Set());

    // Load templates
    useEffect(() => {
        async function loadTemplates() {
            setLoading(true);
            try {
                // Initialize starter templates
                await initializeStarterTemplates();
                const all = await getAllTemplates();
                setTemplates(all.length > 0 ? all : STARTER_TEMPLATES);
            } catch (error) {
                console.error('Failed to load templates:', error);
                setTemplates(STARTER_TEMPLATES);
            } finally {
                setLoading(false);
            }
        }
        loadTemplates();
    }, []);

    // Filter and sort templates
    const filteredTemplates = useMemo(() => {
        let result = [...templates];

        // Apply filters
        if (filters.category !== 'all') {
            result = result.filter(t => t.category === filters.category);
        }
        if (filters.gameType !== 'all') {
            result = result.filter(t => t.gameTypes.includes(filters.gameType as GameCategory));
        }
        if (filters.verified) {
            result = result.filter(t => t.verified);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(t =>
                t.name.toLowerCase().includes(search) ||
                t.description.toLowerCase().includes(search) ||
                t.tags.some(tag => tag.toLowerCase().includes(search))
            );
        }

        // Sort
        switch (sortBy) {
            case 'popular':
                result.sort((a, b) => b.downloads - a.downloads);
                break;
            case 'recent':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'stars':
                result.sort((a, b) => b.stars - a.stars);
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        return result;
    }, [templates, filters, sortBy]);

    // Stats
    const stats = useMemo(() => ({
        total: templates.length,
        featured: templates.filter(t => t.featured).length,
        verified: templates.filter(t => t.verified).length,
        downloads: templates.reduce((sum, t) => sum + t.downloads, 0),
    }), [templates]);

    // Handlers
    const handleUseTemplate = async (template: DashboardTemplate) => {
        await incrementDownloads(template.id);
        // In a real app, this would apply the template to the current dashboard
        alert(`Template "${template.name}" applied! (Demo - actual implementation would configure dashboard)`);
        setSelectedTemplate(null);
    };

    const handleToggleStar = async (templateId: string) => {
        if (starredTemplates.has(templateId)) {
            await decrementStars(templateId);
            setStarredTemplates(prev => {
                const next = new Set(prev);
                next.delete(templateId);
                return next;
            });
        } else {
            await incrementStars(templateId);
            setStarredTemplates(prev => new Set(prev).add(templateId));
        }
        // Refresh templates
        const updated = await getAllTemplates();
        setTemplates(updated.length > 0 ? updated : STARTER_TEMPLATES);
    };

    const handleExportTemplate = (template: DashboardTemplate) => {
        const json = serializeTemplate(template);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportTemplate = async (file: File) => {
        try {
            const text = await file.text();
            const template = deserializeTemplate(text);
            const validation = validateTemplate(template);

            if (!validation.valid) {
                alert(`Invalid template: ${validation.errors.join(', ')}`);
                return;
            }

            await saveTemplate(template);
            const updated = await getAllTemplates();
            setTemplates(updated);
            setShowImportModal(false);
            alert('Template imported successfully!');
        } catch (error) {
            alert(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-th-text-primary">Template Marketplace</h1>
                    <p className="text-th-text-muted mt-1">
                        Discover and use community dashboard templates
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg hover:bg-th-interactive-hover transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Import
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-th-accent-primary text-white rounded-lg hover:bg-th-accent-primary-hover transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Template
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Package} label="Templates" value={stats.total} color="violet" />
                <StatCard icon={Star} label="Featured" value={stats.featured} color="yellow" />
                <StatCard icon={CheckCircle} label="Verified" value={stats.verified} color="green" />
                <StatCard icon={Download} label="Total Downloads" value={formatNumber(stats.downloads)} color="blue" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-muted" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={filters.search}
                        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-th-border rounded-lg focus:ring-2 focus:ring-th-accent-primary focus:border-transparent bg-th-bg-surface text-th-text-primary"
                    />
                </div>

                {/* Category Filter */}
                <div className="relative">
                    <select
                        value={filters.category}
                        onChange={e => setFilters(prev => ({ ...prev, category: e.target.value as TemplateCategory | 'all' }))}
                        className="appearance-none pl-3 pr-10 py-2 border border-th-border rounded-lg focus:ring-2 focus:ring-th-accent-primary bg-th-bg-surface text-th-text-primary"
                    >
                        <option value="all">All Categories</option>
                        <option value="retention">Retention</option>
                        <option value="monetization">Monetization</option>
                        <option value="engagement">Engagement</option>
                        <option value="progression">Progression</option>
                        <option value="acquisition">Acquisition</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-muted pointer-events-none" />
                </div>

                {/* Game Type Filter */}
                <div className="relative">
                    <select
                        value={filters.gameType}
                        onChange={e => setFilters(prev => ({ ...prev, gameType: e.target.value as GameCategory | 'all' }))}
                        className="appearance-none pl-3 pr-10 py-2 border border-th-border rounded-lg focus:ring-2 focus:ring-th-accent-primary bg-th-bg-surface text-th-text-primary"
                    >
                        <option value="all">All Game Types</option>
                        <option value="puzzle">Puzzle</option>
                        <option value="idle">Idle</option>
                        <option value="battle_royale">Battle Royale</option>
                        <option value="match3_meta">Match-3 Meta</option>
                        <option value="gacha_rpg">Gacha RPG</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-muted pointer-events-none" />
                </div>

                {/* Verified Filter */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.verified}
                        onChange={e => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                        className="w-4 h-4 rounded border-th-border text-th-accent-primary focus:ring-th-accent-primary"
                    />
                    <span className="text-sm text-th-text-secondary">Verified only</span>
                </label>

                {/* Sort */}
                <div className="relative ml-auto">
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as SortOption)}
                        className="appearance-none pl-3 pr-10 py-2 border border-th-border rounded-lg focus:ring-2 focus:ring-th-accent-primary bg-th-bg-surface text-th-text-primary"
                    >
                        <option value="popular">Most Popular</option>
                        <option value="recent">Most Recent</option>
                        <option value="stars">Most Stars</option>
                        <option value="name">Name A-Z</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-muted pointer-events-none" />
                </div>

                {/* View Mode */}
                <div className="flex items-center gap-1 border border-th-border rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-th-accent-primary-muted text-th-accent-primary' : 'text-th-text-muted hover:text-th-text-secondary'}`}
                    >
                        <Layout className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-th-accent-primary-muted text-th-accent-primary' : 'text-th-text-muted hover:text-th-text-secondary'}`}
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Templates Grid/List */}
            {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 bg-th-bg-surface rounded-card border border-th-border">
                    <Package className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-th-text-primary">No templates found</h3>
                    <p className="text-th-text-muted mt-1">Try adjusting your filters or search query</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            isStarred={starredTemplates.has(template.id)}
                            onView={() => setSelectedTemplate(template)}
                            onStar={() => handleToggleStar(template.id)}
                            onUse={() => handleUseTemplate(template)}
                            onExport={() => handleExportTemplate(template)}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTemplates.map(template => (
                        <TemplateListItem
                            key={template.id}
                            template={template}
                            isStarred={starredTemplates.has(template.id)}
                            onView={() => setSelectedTemplate(template)}
                            onStar={() => handleToggleStar(template.id)}
                            onUse={() => handleUseTemplate(template)}
                        />
                    ))}
                </div>
            )}

            {/* Template Detail Modal */}
            {selectedTemplate && (
                <TemplateDetailModal
                    template={selectedTemplate}
                    isStarred={starredTemplates.has(selectedTemplate.id)}
                    onClose={() => setSelectedTemplate(null)}
                    onUse={() => handleUseTemplate(selectedTemplate)}
                    onStar={() => handleToggleStar(selectedTemplate.id)}
                    onExport={() => handleExportTemplate(selectedTemplate)}
                />
            )}

            {/* Import Modal */}
            {showImportModal && (
                <ImportModal
                    onClose={() => setShowImportModal(false)}
                    onImport={handleImportTemplate}
                />
            )}
        </div>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: 'violet' | 'yellow' | 'green' | 'blue';
}) {
    const colorClasses = {
        violet: 'bg-th-accent-primary-muted text-th-accent-primary',
        yellow: 'bg-yellow-500/10 text-yellow-400',
        green: 'bg-th-success-muted text-th-success',
        blue: 'bg-th-info-muted text-th-info',
    };

    return (
        <div className="bg-th-bg-surface rounded-card border border-th-border p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-2xl font-bold text-th-text-primary">{value}</p>
                <p className="text-sm text-th-text-muted">{label}</p>
            </div>
        </div>
    );
}

function TemplateCard({ template, isStarred, onView, onStar, onUse, onExport: _onExport }: {
    template: DashboardTemplate;
    isStarred: boolean;
    onView: () => void;
    onStar: () => void;
    onUse: () => void;
    onExport: () => void;
}) {
    // _onExport available for future context menu
    const categoryIcon = {
        retention: TrendingUp,
        monetization: BarChart3,
        engagement: Zap,
        progression: TrendingUp,
        acquisition: TrendingUp,
        general: Layout,
    }[template.category] || Layout;

    const CategoryIcon = categoryIcon;

    return (
        <div className="bg-th-bg-surface rounded-card border border-th-border overflow-hidden hover:shadow-theme-lg transition-shadow">
            {/* Preview Header */}
            <div className="h-32 bg-gradient-to-br from-violet-500 to-indigo-600 p-4 relative">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {template.featured && (
                            <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full">
                                Featured
                            </span>
                        )}
                        {template.verified && (
                            <span className="px-2 py-0.5 bg-green-400 text-green-900 text-xs font-medium rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                        )}
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); onStar(); }}
                        className={`p-1.5 rounded-full ${isStarred ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                        <Star className="w-4 h-4" fill={isStarred ? 'currentColor' : 'none'} />
                    </button>
                </div>

                {/* Chart preview placeholder */}
                <div className="absolute bottom-2 left-4 right-4 flex gap-1">
                    <div className="flex-1 h-8 bg-white/20 rounded" />
                    <div className="flex-1 h-8 bg-white/20 rounded" />
                    <div className="flex-1 h-8 bg-white/20 rounded" />
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-th-accent-primary-muted text-th-accent-primary rounded-lg">
                        <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-th-text-primary truncate">{template.name}</h3>
                        <p className="text-sm text-th-text-muted line-clamp-2 mt-0.5">{template.description}</p>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                    {template.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-th-bg-elevated text-th-text-secondary text-xs rounded-full">
                            {tag}
                        </span>
                    ))}
                    {template.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-th-bg-elevated text-th-text-secondary text-xs rounded-full">
                            +{template.tags.length - 3}
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-th-border-subtle text-sm text-th-text-muted">
                    <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" /> {formatNumber(template.downloads)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" /> {template.stars}
                    </span>
                    <span className="text-th-text-muted">by {template.author}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onView}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-th-border rounded-lg hover:bg-th-interactive-hover text-sm font-medium"
                    >
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                    <button
                        onClick={onUse}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-th-accent-primary text-white rounded-lg hover:bg-th-accent-primary-hover text-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> Use
                    </button>
                </div>
            </div>
        </div>
    );
}

function TemplateListItem({ template, isStarred, onView, onStar, onUse }: {
    template: DashboardTemplate;
    isStarred: boolean;
    onView: () => void;
    onStar: () => void;
    onUse: () => void;
}): React.ReactElement {
    return (
        <div className="bg-th-bg-surface rounded-card border border-th-border p-4 flex items-center gap-4 hover:shadow-theme-sm transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Layout className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-th-text-primary">{template.name}</h3>
                    {template.verified && (
                        <CheckCircle className="w-4 h-4 text-th-success" />
                    )}
                    {template.featured && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded-full">
                            Featured
                        </span>
                    )}
                </div>
                <p className="text-sm text-th-text-muted line-clamp-1">{template.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-th-text-muted">
                    <span>by {template.author}</span>
                    <span>{formatNumber(template.downloads)} downloads</span>
                    <span>{template.stars} stars</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onStar}
                    className={`p-2 rounded-lg ${isStarred ? 'bg-yellow-500/10 text-yellow-400' : 'hover:bg-th-interactive-hover text-th-text-muted'}`}
                >
                    <Star className="w-5 h-5" fill={isStarred ? 'currentColor' : 'none'} />
                </button>
                <button
                    onClick={onView}
                    className="px-4 py-2 border border-th-border rounded-lg hover:bg-th-interactive-hover text-sm font-medium"
                >
                    Preview
                </button>
                <button
                    onClick={onUse}
                    className="px-4 py-2 bg-th-accent-primary text-white rounded-lg hover:bg-th-accent-primary-hover text-sm font-medium"
                >
                    Use Template
                </button>
            </div>
        </div>
    );
}

function TemplateDetailModal({ template, isStarred, onClose, onUse, onStar, onExport }: {
    template: DashboardTemplate;
    isStarred: boolean;
    onClose: () => void;
    onUse: () => void;
    onStar: () => void;
    onExport: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-th-bg-surface rounded-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="h-40 bg-gradient-to-br from-violet-500 to-indigo-600 p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-start gap-2">
                        {template.featured && (
                            <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full">
                                Featured
                            </span>
                        )}
                        {template.verified && (
                            <span className="px-2 py-0.5 bg-green-400 text-green-900 text-xs font-medium rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                        )}
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                        <h2 className="text-2xl font-bold text-white">{template.name}</h2>
                        <p className="text-white/80 mt-1">by {template.author}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    <p className="text-th-text-secondary">{template.description}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 py-4 border-y border-th-border-subtle">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-th-text-primary">{formatNumber(template.downloads)}</p>
                            <p className="text-sm text-th-text-muted">Downloads</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-th-text-primary">{template.stars}</p>
                            <p className="text-sm text-th-text-muted">Stars</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-th-text-primary">v{template.version}</p>
                            <p className="text-sm text-th-text-muted">Version</p>
                        </div>
                    </div>

                    {/* Game Types */}
                    <div>
                        <h3 className="text-sm font-medium text-th-text-primary mb-2">Compatible Game Types</h3>
                        <div className="flex flex-wrap gap-2">
                            {template.gameTypes.map(type => (
                                <span key={type} className="px-3 py-1 bg-th-accent-primary-muted text-th-accent-primary rounded-full text-sm">
                                    {formatGameType(type)}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Required Columns */}
                    <div>
                        <h3 className="text-sm font-medium text-th-text-primary mb-2">Required Data Columns</h3>
                        <div className="space-y-2">
                            {template.requiredColumns.map(col => (
                                <div key={col.semantic} className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full ${col.optional ? 'bg-th-text-muted' : 'bg-th-accent-primary'}`} />
                                    <span className="font-mono text-th-text-secondary">{col.semantic}</span>
                                    {col.optional && <span className="text-th-text-muted">(optional)</span>}
                                    {col.description && <span className="text-th-text-muted">- {col.description}</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Layout Preview */}
                    <div>
                        <h3 className="text-sm font-medium text-th-text-primary mb-2">Dashboard Layout</h3>
                        <div className="bg-th-bg-base rounded-lg p-4 space-y-3">
                            <div className="text-xs text-th-text-muted">
                                <strong>{template.layout.kpis.length}</strong> KPIs,{' '}
                                <strong>{template.layout.mainCharts.length}</strong> main charts,{' '}
                                <strong>{template.layout.sideCharts.length}</strong> side charts
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {template.layout.kpis.map(kpi => (
                                    <div key={kpi.id} className="bg-th-bg-surface rounded p-2 text-center text-xs">
                                        <div className="font-medium text-th-text-primary">{kpi.name}</div>
                                        <div className="text-th-text-muted">{kpi.format}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {template.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-th-bg-elevated text-th-text-secondary rounded-full text-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-th-border-subtle flex items-center gap-3">
                    <button
                        onClick={onStar}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                            isStarred
                                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                : 'border-th-border text-th-text-secondary hover:bg-th-interactive-hover'
                        }`}
                    >
                        <Star className="w-4 h-4" fill={isStarred ? 'currentColor' : 'none'} />
                        {isStarred ? 'Starred' : 'Star'}
                    </button>
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg hover:bg-th-interactive-hover"
                    >
                        <Download className="w-4 h-4" />
                        Export JSON
                    </button>
                    <button
                        onClick={onUse}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-th-accent-primary text-white rounded-lg hover:bg-th-accent-primary-hover font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Use This Template
                    </button>
                </div>
            </div>
        </div>
    );
}

function ImportModal({ onClose, onImport }: {
    onClose: () => void;
    onImport: (file: File) => void;
}) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImport(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-th-bg-surface rounded-card max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-th-text-primary">Import Template</h2>
                    <button onClick={onClose} className="p-2 hover:bg-th-interactive-hover rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-th-text-secondary mb-6">
                    Import a template from a JSON file exported from Game Insights.
                </p>

                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-th-border rounded-xl hover:border-th-accent-primary cursor-pointer transition-colors">
                    <Upload className="w-10 h-10 text-th-text-muted mb-3" />
                    <span className="text-th-text-secondary font-medium">Click to select file</span>
                    <span className="text-th-text-muted text-sm mt-1">or drag and drop</span>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-th-border rounded-lg hover:bg-th-interactive-hover"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Utilities
// ============================================================================

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function formatGameType(type: GameCategory): string {
    const names: Record<GameCategory, string> = {
        puzzle: 'Puzzle',
        idle: 'Idle',
        battle_royale: 'Battle Royale',
        match3_meta: 'Match-3 Meta',
        gacha_rpg: 'Gacha RPG',
        custom: 'Custom',
    };
    return names[type] || type;
}

export default TemplatesPage;
