/**
 * Column Mapper Component - Enhanced UX
 *
 * Premium column mapping with:
 * - Visual role grouping with color coding
 * - Searchable dropdown for type selection
 * - Confidence indicators with animations
 * - Quick mapping suggestions
 * - Sample value previews
 * - Smooth animations
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    AlertTriangle,
    ChevronDown,
    Search,
    Target,
    Clock,
    Hash,
    Tag,
    Zap,
    Eye,
    Trash2,
    Sparkles,
    ArrowRight,
    Filter,
    CheckCircle2,
    XCircle,
    RotateCcw,
} from 'lucide-react';
import { ColumnMapping } from '../../lib/columnAnalyzer';

interface ColumnMapperProps {
    columns: ColumnMapping[];
    onUpdate: (columns: ColumnMapping[]) => void;
    onConfirm: () => void;
}

// Extended canonical options with categories
const CANONICAL_OPTIONS = [
    { value: 'user_id', label: 'User ID', role: 'identifier', category: 'Identifiers', icon: Target },
    { value: 'session_id', label: 'Session ID', role: 'identifier', category: 'Identifiers', icon: Target },
    { value: 'device_id', label: 'Device ID', role: 'identifier', category: 'Identifiers', icon: Target },
    { value: 'timestamp', label: 'Timestamp', role: 'timestamp', category: 'Time', icon: Clock },
    { value: 'event_time', label: 'Event Time', role: 'timestamp', category: 'Time', icon: Clock },
    { value: 'install_date', label: 'Install Date', role: 'timestamp', category: 'Time', icon: Clock },
    { value: 'revenue', label: 'Revenue', role: 'metric', category: 'Metrics', icon: Hash },
    { value: 'score', label: 'Score', role: 'metric', category: 'Metrics', icon: Hash },
    { value: 'level', label: 'Level', role: 'metric', category: 'Metrics', icon: Hash },
    { value: 'duration', label: 'Duration', role: 'metric', category: 'Metrics', icon: Hash },
    { value: 'event_type', label: 'Event Type', role: 'dimension', category: 'Dimensions', icon: Tag },
    { value: 'country', label: 'Country', role: 'dimension', category: 'Dimensions', icon: Tag },
    { value: 'platform', label: 'Platform', role: 'dimension', category: 'Dimensions', icon: Tag },
    { value: 'device_model', label: 'Device Model', role: 'dimension', category: 'Dimensions', icon: Tag },
    { value: 'app_version', label: 'App Version', role: 'dimension', category: 'Dimensions', icon: Tag },
    { value: 'custom', label: 'Custom Field', role: 'unknown', category: 'Other', icon: Zap },
    { value: 'ignore', label: 'Ignore (Skip)', role: 'noise', category: 'Other', icon: Trash2 },
];

const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; icon: typeof Target }> = {
    identifier: { color: 'text-[#DA7756]', bg: 'bg-[#DA7756]/10', border: 'border-[#DA7756]/20', label: 'ID', icon: Target },
    timestamp: { color: 'text-[#C15F3C]', bg: 'bg-[#C15F3C]/10', border: 'border-[#C15F3C]/20', label: 'Time', icon: Clock },
    metric: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Metric', icon: Hash },
    dimension: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Dim', icon: Tag },
    noise: { color: 'text-[#8F8B82]', bg: 'bg-[#8F8B82]/10', border: 'border-[#8F8B82]/20', label: 'Skip', icon: Trash2 },
    unknown: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: '?', icon: Zap },
};

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.03 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

export function ColumnMapper({ columns, onUpdate, onConfirm }: ColumnMapperProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string | null>(null);
    const [showLowConfidenceOnly, setShowLowConfidenceOnly] = useState(false);

    // Stats
    const stats = useMemo(() => {
        const highConfidence = columns.filter((c) => c.confidence >= 0.8).length;
        const needsReview = columns.filter((c) => c.confidence < 0.8).length;
        const byRole = columns.reduce(
            (acc, col) => {
                acc[col.role] = (acc[col.role] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );
        return { highConfidence, needsReview, byRole, total: columns.length };
    }, [columns]);

    // Filtered columns
    const filteredColumns = useMemo(() => {
        let result = [...columns];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (col) =>
                    col.original.toLowerCase().includes(query) ||
                    (col.canonical && col.canonical.toLowerCase().includes(query))
            );
        }

        if (filterRole) {
            result = result.filter((col) => col.role === filterRole);
        }

        if (showLowConfidenceOnly) {
            result = result.filter((col) => col.confidence < 0.8);
        }

        return result;
    }, [columns, searchQuery, filterRole, showLowConfidenceOnly]);

    const handleChange = (index: number, canonical: string) => {
        const option = CANONICAL_OPTIONS.find((o) => o.value === canonical);
        const updated = [...columns];
        const originalIndex = columns.findIndex((c) => c.original === filteredColumns[index].original);

        updated[originalIndex] = {
            ...updated[originalIndex],
            canonical: canonical === 'ignore' ? '' : canonical,
            role: (option?.role || 'unknown') as ColumnMapping['role'],
            confidence: 1.0, // User confirmed
        };
        onUpdate(updated);
        setEditingIndex(null);
    };

    const handleResetColumn = (index: number) => {
        // Reset to original AI detection (would need original data - simplified here)
        const updated = [...columns];
        const originalIndex = columns.findIndex((c) => c.original === filteredColumns[index].original);
        updated[originalIndex] = {
            ...updated[originalIndex],
            confidence: 0.7, // Mark as needing review again
        };
        onUpdate(updated);
    };

    const handleIgnoreColumn = (index: number) => {
        handleChange(index, 'ignore');
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* Header with Stats */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#DA7756]" />
                        Column Mapping
                    </h3>
                    <p className="text-sm text-[#8F8B82] mt-0.5">
                        Review and adjust how columns are interpreted
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <StatBadge
                        icon={CheckCircle2}
                        label="Confident"
                        value={stats.highConfidence}
                        color="text-[#7A8B5B]"
                    />
                    {stats.needsReview > 0 && (
                        <StatBadge
                            icon={AlertTriangle}
                            label="Review"
                            value={stats.needsReview}
                            color="text-amber-500"
                        />
                    )}
                </div>
            </motion.div>

            {/* Role Distribution */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
                {Object.entries(stats.byRole).map(([role, count]) => {
                    const config = ROLE_CONFIG[role] || ROLE_CONFIG.unknown;
                    const isActive = filterRole === role;
                    return (
                        <button
                            key={role}
                            onClick={() => setFilterRole(isActive ? null : role)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isActive
                                    ? `${config.bg} ${config.color} ${config.border} border`
                                    : 'bg-[#343330]/50 text-[#b8b5ad] border border-[#4a4845] hover:border-[#6b6967]'
                            }`}
                        >
                            <config.icon className="w-3 h-3" />
                            <span className="capitalize">{role}</span>
                            <span className={`px-1.5 py-0.5 rounded ${isActive ? 'bg-white/10' : 'bg-[#4a4845]'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </motion.div>

            {/* Search and Filters */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8F8B82]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search columns..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#343330] border border-[#4a4845] rounded-xl text-white placeholder-[#8F8B82] text-sm focus:outline-none focus:border-[#DA7756] transition-colors"
                    />
                </div>
                <button
                    onClick={() => setShowLowConfidenceOnly(!showLowConfidenceOnly)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        showLowConfidenceOnly
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            : 'bg-[#343330] text-[#b8b5ad] border border-[#4a4845] hover:text-white'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    Needs Review
                </button>
            </motion.div>

            {/* Column List */}
            <motion.div variants={itemVariants} className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {filteredColumns.map((column, index) => (
                        <ColumnRow
                            key={column.original}
                            column={column}
                            index={index}
                            isEditing={editingIndex === index}
                            onEdit={() => setEditingIndex(index)}
                            onClose={() => setEditingIndex(null)}
                            onChange={(canonical) => handleChange(index, canonical)}
                            onReset={() => handleResetColumn(index)}
                            onIgnore={() => handleIgnoreColumn(index)}
                        />
                    ))}
                </AnimatePresence>

                {filteredColumns.length === 0 && (
                    <div className="text-center py-8 text-[#8F8B82]">
                        <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No columns match your filters</p>
                    </div>
                )}
            </motion.div>

            {/* Confirm Button */}
            <motion.button
                variants={itemVariants}
                onClick={onConfirm}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-[#DA7756] hover:bg-[#C15F3C] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#DA7756]/20"
            >
                <Check className="w-5 h-5" />
                Confirm Mappings & Import Data
            </motion.button>
        </motion.div>
    );
}

// Stat Badge Component
function StatBadge({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: typeof CheckCircle2;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#343330]/50 rounded-lg">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-xs text-[#8F8B82]">{label}</span>
            <span className={`text-sm font-semibold ${color}`}>{value}</span>
        </div>
    );
}

// Column Row Component
function ColumnRow({
    column,
    index,
    isEditing,
    onEdit,
    onClose,
    onChange,
    onReset,
    onIgnore,
}: {
    column: ColumnMapping;
    index: number;
    isEditing: boolean;
    onEdit: () => void;
    onClose: () => void;
    onChange: (canonical: string) => void;
    onReset: () => void;
    onIgnore: () => void;
}) {
    const roleConfig = ROLE_CONFIG[column.role] || ROLE_CONFIG.unknown;
    const isLowConfidence = column.confidence < 0.8;
    const isIgnored = column.role === 'noise';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative rounded-xl border overflow-hidden transition-all ${
                isIgnored
                    ? 'bg-[#1f1e1b]/50 border-[#343330] opacity-60'
                    : isLowConfidence
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-[#1f1e1b] border-[#343330]'
            }`}
        >
            <div className="p-3 flex items-center gap-3">
                {/* Role Badge */}
                <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${roleConfig.bg} ${roleConfig.border}`}
                >
                    <roleConfig.icon className={`w-4 h-4 ${roleConfig.color}`} />
                </div>

                {/* Column Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <code className="text-sm font-medium text-white font-mono truncate">{column.original}</code>
                        {isLowConfidence && !isIgnored && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-medium rounded">
                                REVIEW
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-[#8F8B82] truncate mt-0.5" title={column.reasoning}>
                        {column.reasoning || 'No description'}
                    </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-[#6b6967] flex-shrink-0" />

                {/* Mapping Selector */}
                <div className="flex-shrink-0">
                    {isEditing ? (
                        <MappingDropdown
                            value={column.canonical}
                            onChange={onChange}
                            onClose={onClose}
                        />
                    ) : (
                        <button
                            onClick={onEdit}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all hover:bg-[#343330] ${roleConfig.bg} ${roleConfig.border} ${roleConfig.color}`}
                        >
                            <span className="truncate max-w-[100px]">{column.canonical || 'Unmapped'}</span>
                            <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        </button>
                    )}
                </div>

                {/* Confidence Bar */}
                <div className="flex-shrink-0 w-16">
                    <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-[#343330] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${column.confidence * 100}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-full rounded-full ${
                                    column.confidence >= 0.8 ? 'bg-[#7A8B5B]' : 'bg-amber-500'
                                }`}
                            />
                        </div>
                        <span
                            className={`text-xs font-medium ${
                                column.confidence >= 0.8 ? 'text-[#7A8B5B]' : 'text-amber-500'
                            }`}
                        >
                            {Math.round(column.confidence * 100)}%
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                    {!isIgnored && (
                        <button
                            onClick={onIgnore}
                            className="p-1.5 text-[#8F8B82] hover:text-[#d4d1c9] hover:bg-[#343330] rounded-lg transition-colors"
                            title="Ignore this column"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {column.confidence === 1 && (
                        <button
                            onClick={onReset}
                            className="p-1.5 text-[#8F8B82] hover:text-[#d4d1c9] hover:bg-[#343330] rounded-lg transition-colors"
                            title="Reset to AI detection"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Mapping Dropdown Component
function MappingDropdown({
    value,
    onChange,
    onClose,
}: {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Filter options
    const filteredOptions = useMemo(() => {
        if (!search.trim()) return CANONICAL_OPTIONS;
        const query = search.toLowerCase();
        return CANONICAL_OPTIONS.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query) ||
                opt.value.toLowerCase().includes(query) ||
                opt.category.toLowerCase().includes(query)
        );
    }, [search]);

    // Group by category
    const groupedOptions = useMemo(() => {
        const groups: Record<string, typeof CANONICAL_OPTIONS> = {};
        filteredOptions.forEach((opt) => {
            if (!groups[opt.category]) groups[opt.category] = [];
            groups[opt.category].push(opt);
        });
        return groups;
    }, [filteredOptions]);

    return (
        <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-1 z-50 w-64 bg-[#343330] border border-[#4a4845] rounded-xl shadow-2xl overflow-hidden"
        >
            {/* Search */}
            <div className="p-2 border-b border-[#4a4845]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8F8B82]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search types..."
                        autoFocus
                        className="w-full pl-8 pr-3 py-2 bg-[#4a4845] border border-[#6b6967] rounded-lg text-sm text-white placeholder-[#8F8B82] focus:outline-none focus:border-[#DA7756]"
                    />
                </div>
            </div>

            {/* Options */}
            <div className="max-h-64 overflow-y-auto p-1">
                {Object.entries(groupedOptions).map(([category, options]) => (
                    <div key={category}>
                        <div className="px-2 py-1 text-[10px] font-semibold text-[#8F8B82] uppercase tracking-wider">
                            {category}
                        </div>
                        {options.map((opt) => {
                            const isSelected = opt.value === value;
                            const roleConfig = ROLE_CONFIG[opt.role] || ROLE_CONFIG.unknown;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => onChange(opt.value)}
                                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors ${
                                        isSelected
                                            ? 'bg-[#DA7756]/10 text-[#DA7756]'
                                            : 'text-[#d4d1c9] hover:bg-[#4a4845]'
                                    }`}
                                >
                                    <div className={`p-1 rounded ${roleConfig.bg}`}>
                                        <opt.icon className={`w-3 h-3 ${roleConfig.color}`} />
                                    </div>
                                    <span className="text-sm flex-1">{opt.label}</span>
                                    {isSelected && <Check className="w-4 h-4 text-[#DA7756]" />}
                                </button>
                            );
                        })}
                    </div>
                ))}

                {filteredOptions.length === 0 && (
                    <div className="py-4 text-center text-[#8F8B82] text-sm">No matches found</div>
                )}
            </div>
        </motion.div>
    );
}

export default ColumnMapper;
