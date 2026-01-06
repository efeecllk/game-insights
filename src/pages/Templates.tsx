/**
 * Template Marketplace Page - Obsidian Analytics Design
 *
 * Premium template marketplace with:
 * - Glassmorphism containers
 * - Warm orange accent theme
 * - Animated entrance effects
 * - Refined template cards
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
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
    Grid3X3,
    List,
    Sparkles,
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
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Load templates
    useEffect(() => {
        async function loadTemplates() {
            setLoading(true);
            try {
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

    const sortLabels: Record<SortOption, string> = {
        popular: 'Most Popular',
        recent: 'Most Recent',
        stars: 'Most Stars',
        name: 'Name A-Z',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-full" />
                    <div className="relative w-8 h-8 border-2 border-[#DA7756]/30 border-t-[#DA7756] rounded-full animate-spin" />
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
                                    <Package className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>
                            <div>
                                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                    Template Marketplace
                                </h1>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    Discover and use community dashboard templates
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                icon={<Upload className="w-4 h-4" />}
                                onClick={() => setShowImportModal(true)}
                            >
                                Import
                            </Button>
                            <Button
                                variant="primary"
                                icon={<Plus className="w-4 h-4" />}
                            >
                                Create Template
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Package} label="Templates" value={stats.total} color="orange" index={0} />
                <StatCard icon={Star} label="Featured" value={stats.featured} color="amber" index={1} />
                <StatCard icon={CheckCircle} label="Verified" value={stats.verified} color="orangeDark" index={2} />
                <StatCard icon={Download} label="Total Downloads" value={formatNumber(stats.downloads)} color="blue" index={3} />
            </div>

            {/* Filters */}
            <motion.div variants={itemVariants}>
                <Card variant="default" padding="md">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={filters.search}
                                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <select
                                value={filters.category}
                                onChange={e => setFilters(prev => ({ ...prev, category: e.target.value as TemplateCategory | 'all' }))}
                                className="appearance-none pl-3 pr-10 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 transition-all cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                <option value="retention">Retention</option>
                                <option value="monetization">Monetization</option>
                                <option value="engagement">Engagement</option>
                                <option value="progression">Progression</option>
                                <option value="acquisition">Acquisition</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>

                        {/* Game Type Filter */}
                        <div className="relative">
                            <select
                                value={filters.gameType}
                                onChange={e => setFilters(prev => ({ ...prev, gameType: e.target.value as GameCategory | 'all' }))}
                                className="appearance-none pl-3 pr-10 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 transition-all cursor-pointer"
                            >
                                <option value="all">All Game Types</option>
                                <option value="puzzle">Puzzle</option>
                                <option value="idle">Idle</option>
                                <option value="battle_royale">Battle Royale</option>
                                <option value="match3_meta">Match-3 Meta</option>
                                <option value="gacha_rpg">Gacha RPG</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>

                        {/* Verified Filter */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.verified}
                                onChange={e => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                                className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.03] text-[#DA7756] focus:ring-[#DA7756]/50"
                            />
                            <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Verified only</span>
                        </label>

                        {/* Sort */}
                        <div className="relative ml-auto">
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-slate-700 text-slate-300 hover:bg-white/[0.06] transition-colors"
                            >
                                {sortLabels[sortBy]}
                                <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {showSortDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-40 bg-slate-900/95  border border-slate-700 rounded-xl shadow-lg overflow-hidden z-50"
                                    >
                                        {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    setSortBy(option);
                                                    setShowSortDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors ${
                                                    sortBy === option ? 'bg-[#DA7756]/10 text-[#DA7756]' : 'text-slate-300'
                                                }`}
                                            >
                                                {sortLabels[option]}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* View Mode */}
                        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-slate-800 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-[#DA7756]/20 text-[#DA7756]'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-[#DA7756]/20 text-[#DA7756]'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Templates Grid/List */}
            {filteredTemplates.length === 0 ? (
                <motion.div variants={itemVariants}>
                    <Card variant="default" padding="lg" className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="relative inline-block mb-4"
                        >
                            <div className="absolute inset-0 bg-slate-500/20 rounded-xl" />
                            <div className="relative w-16 h-16 bg-white/[0.03] border border-slate-700 rounded-xl flex items-center justify-center mx-auto">
                                <Package className="w-8 h-8 text-slate-500" />
                            </div>
                        </motion.div>
                        <h3 className="text-lg font-semibold text-white">No templates found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your filters or search query</p>
                    </Card>
                </motion.div>
            ) : viewMode === 'grid' ? (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template, index) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            isStarred={starredTemplates.has(template.id)}
                            onView={() => setSelectedTemplate(template)}
                            onStar={() => handleToggleStar(template.id)}
                            onUse={() => handleUseTemplate(template)}
                            onExport={() => handleExportTemplate(template)}
                            index={index}
                        />
                    ))}
                </motion.div>
            ) : (
                <motion.div variants={itemVariants} className="space-y-3">
                    {filteredTemplates.map((template, index) => (
                        <TemplateListItem
                            key={template.id}
                            template={template}
                            isStarred={starredTemplates.has(template.id)}
                            onView={() => setSelectedTemplate(template)}
                            onStar={() => handleToggleStar(template.id)}
                            onUse={() => handleUseTemplate(template)}
                            index={index}
                        />
                    ))}
                </motion.div>
            )}

            {/* Template Detail Modal */}
            <AnimatePresence>
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
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <ImportModal
                        onClose={() => setShowImportModal(false)}
                        onImport={handleImportTemplate}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

function StatCard({ icon: Icon, label, value, color, index }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: 'orange' | 'amber' | 'orangeDark' | 'blue';
    index: number;
}) {
    const colorStyles = {
        orange: { bg: 'from-[#DA7756]/20 to-[#DA7756]/5', border: 'border-[#DA7756]/20', icon: 'text-[#DA7756]', glow: 'bg-[#DA7756]/20' },
        amber: { bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20', icon: 'text-amber-400', glow: 'bg-amber-500/20' },
        orangeDark: { bg: 'from-[#C15F3C]/20 to-[#C15F3C]/5', border: 'border-[#C15F3C]/20', icon: 'text-[#C15F3C]', glow: 'bg-[#C15F3C]/20' },
        blue: { bg: 'from-[#8F8B82]/20 to-[#8F8B82]/5', border: 'border-[#8F8B82]/20', icon: 'text-[#8F8B82]', glow: 'bg-[#8F8B82]/20' },
    };

    const style = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="default" padding="md" className="group hover:border-slate-600 transition-all">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className={`absolute inset-0 ${style.glow} rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${style.icon}`} />
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

function TemplateCard({ template, isStarred, onView, onStar, onUse, onExport: _onExport, index }: {
    template: DashboardTemplate;
    isStarred: boolean;
    onView: () => void;
    onStar: () => void;
    onUse: () => void;
    onExport: () => void;
    index: number;
}) {
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
        >
            <Card variant="default" padding="none" className="overflow-hidden group hover:border-slate-600 transition-all">
                {/* Preview Header */}
                <div className="h-32 bg-gradient-to-br from-[#DA7756]/30 via-[#C15F3C]/20 to-[#A68B5B]/30 p-4 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            {template.featured && (
                                <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-medium rounded-full">
                                    Featured
                                </span>
                            )}
                            {template.verified && (
                                <span className="px-2 py-0.5 bg-[#DA7756] text-white text-xs font-medium rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={e => { e.stopPropagation(); onStar(); }}
                            className={`p-1.5 rounded-full ${
                                isStarred
                                    ? 'bg-amber-400 text-amber-900'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <Star className="w-4 h-4" fill={isStarred ? 'currentColor' : 'none'} />
                        </motion.button>
                    </div>

                    {/* Chart preview placeholder */}
                    <div className="absolute bottom-2 left-4 right-4 flex gap-1">
                        <div className="flex-1 h-8 bg-white/20 rounded-lg" />
                        <div className="flex-1 h-8 bg-white/20 rounded-lg" />
                        <div className="flex-1 h-8 bg-white/20 rounded-lg" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                            <CategoryIcon className="w-5 h-5 text-[#DA7756]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{template.name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{template.description}</p>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                        {template.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-white/[0.03] border border-slate-800 text-slate-400 text-xs rounded-full">
                                {tag}
                            </span>
                        ))}
                        {template.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/[0.03] border border-slate-800 text-slate-500 text-xs rounded-full">
                                +{template.tags.length - 3}
                            </span>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <Download className="w-4 h-4" /> {formatNumber(template.downloads)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" /> {template.stars}
                        </span>
                        <span className="text-slate-600">by {template.author}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                        <Button variant="secondary" size="sm" onClick={onView} className="flex-1">
                            <Eye className="w-4 h-4 mr-1" /> Preview
                        </Button>
                        <Button variant="primary" size="sm" onClick={onUse} className="flex-1">
                            <Download className="w-4 h-4 mr-1" /> Use
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

function TemplateListItem({ template, isStarred, onView, onStar, onUse, index }: {
    template: DashboardTemplate;
    isStarred: boolean;
    onView: () => void;
    onStar: () => void;
    onUse: () => void;
    index: number;
}): React.ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
        >
            <Card variant="default" padding="md" className="flex items-center gap-4 hover:border-slate-600 transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 rounded-xl flex items-center justify-center border border-[#DA7756]/20">
                    <Layout className="w-6 h-6 text-[#DA7756]" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{template.name}</h3>
                        {template.verified && (
                            <CheckCircle className="w-4 h-4 text-[#DA7756]" />
                        )}
                        {template.featured && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full">
                                Featured
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{template.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                        <span>by {template.author}</span>
                        <span>{formatNumber(template.downloads)} downloads</span>
                        <span>{template.stars} stars</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onStar}
                        className={`p-2 rounded-xl ${
                            isStarred
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
                        } transition-colors`}
                    >
                        <Star className="w-5 h-5" fill={isStarred ? 'currentColor' : 'none'} />
                    </motion.button>
                    <Button variant="secondary" size="sm" onClick={onView}>
                        Preview
                    </Button>
                    <Button variant="primary" size="sm" onClick={onUse}>
                        Use Template
                    </Button>
                </div>
            </Card>
        </motion.div>
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60  flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900  rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg"
            >
                {/* Header */}
                <div className="h-40 bg-gradient-to-br from-[#DA7756]/30 via-[#C15F3C]/20 to-[#A68B5B]/30 p-6 relative">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>

                    <div className="flex items-start gap-2">
                        {template.featured && (
                            <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-medium rounded-full">
                                Featured
                            </span>
                        )}
                        {template.verified && (
                            <span className="px-2 py-0.5 bg-[#DA7756] text-white text-xs font-medium rounded-full flex items-center gap-1">
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
                    <p className="text-slate-400">{template.description}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 py-4 border-y border-slate-800">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{formatNumber(template.downloads)}</p>
                            <p className="text-sm text-slate-500">Downloads</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{template.stars}</p>
                            <p className="text-sm text-slate-500">Stars</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">v{template.version}</p>
                            <p className="text-sm text-slate-500">Version</p>
                        </div>
                    </div>

                    {/* Game Types */}
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">Compatible Game Types</h3>
                        <div className="flex flex-wrap gap-2">
                            {template.gameTypes.map(type => (
                                <span key={type} className="px-3 py-1 bg-[#DA7756]/10 border border-[#DA7756]/20 text-[#DA7756] rounded-full text-sm">
                                    {formatGameType(type)}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Required Columns */}
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">Required Data Columns</h3>
                        <div className="space-y-2">
                            {template.requiredColumns.map(col => (
                                <div key={col.semantic} className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full ${col.optional ? 'bg-slate-500' : 'bg-[#DA7756]'}`} />
                                    <span className="font-mono text-slate-400">{col.semantic}</span>
                                    {col.optional && <span className="text-slate-600">(optional)</span>}
                                    {col.description && <span className="text-slate-600">- {col.description}</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Layout Preview */}
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">Dashboard Layout</h3>
                        <div className="bg-white/[0.02] border border-slate-800 rounded-xl p-4 space-y-3">
                            <div className="text-xs text-slate-500">
                                <strong className="text-slate-400">{template.layout.kpis.length}</strong> KPIs,{' '}
                                <strong className="text-slate-400">{template.layout.mainCharts.length}</strong> main charts,{' '}
                                <strong className="text-slate-400">{template.layout.sideCharts.length}</strong> side charts
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {template.layout.kpis.map(kpi => (
                                    <div key={kpi.id} className="bg-white/[0.03] border border-slate-800 rounded-lg p-2 text-center text-xs">
                                        <div className="font-medium text-white">{kpi.name}</div>
                                        <div className="text-slate-500">{kpi.format}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {template.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-white/[0.03] border border-slate-800 text-slate-400 rounded-full text-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex items-center gap-3">
                    <Button
                        variant={isStarred ? 'primary' : 'secondary'}
                        onClick={onStar}
                        icon={<Star className="w-4 h-4" fill={isStarred ? 'currentColor' : 'none'} />}
                    >
                        {isStarred ? 'Starred' : 'Star'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onExport}
                        icon={<Download className="w-4 h-4" />}
                    >
                        Export JSON
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onUse}
                        icon={<Sparkles className="w-4 h-4" />}
                        className="flex-1"
                    >
                        Use This Template
                    </Button>
                </div>
            </motion.div>
        </motion.div>
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60  flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900  rounded-2xl border border-slate-700 max-w-md w-full p-6 shadow-lg"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Import Template</h2>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 hover:bg-white/[0.05] rounded-xl transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>
                </div>

                <p className="text-slate-500 mb-6">
                    Import a template from a JSON file exported from Game Insights.
                </p>

                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/[0.1] rounded-xl hover:border-[#DA7756]/30 hover:bg-[#DA7756]/5 cursor-pointer transition-all group">
                    <div className="relative mb-3">
                        <div className="absolute inset-0 bg-[#DA7756]/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-12 h-12 bg-white/[0.03] border border-slate-700 rounded-xl flex items-center justify-center group-hover:border-[#DA7756]/30 transition-colors">
                            <Upload className="w-6 h-6 text-slate-500 group-hover:text-[#DA7756] transition-colors" />
                        </div>
                    </div>
                    <span className="text-white font-medium">Click to select file</span>
                    <span className="text-slate-500 text-sm mt-1">or drag and drop</span>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>

                <div className="flex gap-3 mt-6">
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                </div>
            </motion.div>
        </motion.div>
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
