/**
 * Games (Datasets) Page
 *
 * Displays all uploaded game datasets from IndexedDB.
 * Allows selecting, viewing, and deleting datasets.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Database,
    Plus,
    Trash2,
    Clock,
    FileSpreadsheet,
    Columns,
    CheckCircle2,
    Upload,
    MoreVertical,
    Rows,
    Tag,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useGame } from '@/context/GameContext';
import { GameData } from '@/lib/dataStore';
import { gameCategories } from '@/lib/dataProviders';
import { GameCategory } from '@/types';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// ============================================================================
// Helpers
// ============================================================================

function getGameTypeLabel(type: string): string {
    const cat = gameCategories.find(c => c.id === type);
    return cat?.name ?? 'Custom';
}

function getGameTypeIcon(type: string): string {
    const cat = gameCategories.find(c => c.id === type);
    return cat?.icon ?? '📊';
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function formatRowCount(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toLocaleString();
}

// ============================================================================
// Main Page Component
// ============================================================================

export function GamesPage() {
    const {
        gameDataList,
        activeGameData,
        setActiveGameData,
        removeGameData,
        isLoading,
    } = useData();
    const { setSelectedGame } = useGame();
    const navigate = useNavigate();

    function handleSelectDataset(data: GameData) {
        setActiveGameData(data);
        // Sync the game type context
        if (data.type && data.type !== 'custom') {
            setSelectedGame(data.type as GameCategory);
        }
    }

    async function handleDeleteDataset(id: string) {
        if (!confirm('Are you sure you want to delete this dataset? This cannot be undone.')) return;
        await removeGameData(id);
    }

    // Sort: active dataset first, then by upload date (newest first)
    const sortedDatasets = [...gameDataList].sort((a, b) => {
        if (a.id === activeGameData?.id) return -1;
        if (b.id === activeGameData?.id) return 1;
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

    const totalRows = gameDataList.reduce((sum, d) => sum + (d.rowCount || 0), 0);
    const uniqueTypes = new Set(gameDataList.map(d => d.type)).size;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-[#DA7756] border-t-transparent rounded-full"
                />
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
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl" />
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/20 flex items-center justify-center">
                            <Database className="w-6 h-6 text-[#DA7756]" />
                        </div>
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-th-text-primary">My Datasets</h1>
                        <p className="text-sm text-th-text-muted">
                            {gameDataList.length > 0
                                ? `${gameDataList.length} dataset${gameDataList.length !== 1 ? 's' : ''} uploaded`
                                : 'Upload game data to get started'}
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/upload')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DA7756]/20 border border-[#DA7756]/30 text-[#DA7756] hover:bg-[#DA7756]/30 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Upload Data
                </motion.button>
            </motion.div>

            {/* Stats */}
            {gameDataList.length > 0 && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard icon={Database} label="Datasets" value={gameDataList.length.toString()} />
                    <StatCard icon={Rows} label="Total Rows" value={formatRowCount(totalRows)} />
                    <StatCard icon={Tag} label="Game Types" value={uniqueTypes.toString()} />
                    <StatCard
                        icon={CheckCircle2}
                        label="Active"
                        value={activeGameData ? '1' : '0'}
                    />
                </motion.div>
            )}

            {/* Empty State */}
            {gameDataList.length === 0 && (
                <motion.div
                    variants={itemVariants}
                    className="relative bg-th-bg-surface rounded-2xl border border-th-border-subtle p-16 text-center overflow-hidden"
                >
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-th-bg-elevated/50 border border-th-border-subtle flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-10 h-10 text-th-text-disabled" />
                        </div>
                        <h2 className="text-lg font-semibold text-th-text-primary mb-2">No datasets yet</h2>
                        <p className="text-th-text-muted mb-6 max-w-md mx-auto">
                            Upload a CSV, Excel, or JSON file with your game data to start analyzing player behavior, retention, and revenue.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/upload')}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#DA7756]/20 border border-[#DA7756]/30 text-[#DA7756] hover:bg-[#DA7756]/30 transition-colors text-sm font-medium"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Your First Dataset
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Dataset Cards */}
            {sortedDatasets.length > 0 && (
                <motion.section variants={itemVariants}>
                    <h2 className="text-sm font-semibold text-th-text-primary mb-4 flex items-center gap-2">
                        <Database className="w-4 h-4 text-th-text-muted" />
                        <span className="uppercase tracking-wider">All Datasets</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedDatasets.map((data, index) => (
                            <DatasetCard
                                key={data.id}
                                data={data}
                                index={index}
                                isActive={data.id === activeGameData?.id}
                                onSelect={() => handleSelectDataset(data)}
                                onDelete={() => handleDeleteDataset(data.id)}
                            />
                        ))}
                    </div>
                </motion.section>
            )}
        </motion.div>
    );
}

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="relative group"
        >
            <div className="bg-th-bg-surface rounded-2xl border border-th-border group-hover:border-th-border-strong p-4 transition-colors duration-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-th-accent-primary/10 text-th-accent-primary border border-th-accent-primary/20 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-th-text-primary font-mono">{value}</p>
                        <p className="text-[11px] text-th-text-muted uppercase tracking-wider">{label}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Dataset Card
// ============================================================================

function DatasetCard({
    data,
    index,
    isActive,
    onSelect,
    onDelete,
}: {
    data: GameData;
    index: number;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    const columnCount = data.columnMappings?.length ?? 0;
    const mappedColumns = data.columnMappings?.filter(c => c.role !== 'unknown' && c.role !== 'noise').length ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ y: -4 }}
            className="relative group cursor-pointer"
            onClick={onSelect}
        >
            <div className={`bg-th-bg-surface rounded-2xl border transition-colors duration-200 overflow-hidden ${
                isActive
                    ? 'border-th-accent-primary/40 ring-1 ring-th-accent-primary/20'
                    : 'border-th-border group-hover:border-th-border-strong'
            }`}>

                {/* Header */}
                <div className="relative p-4 border-b border-th-border-subtle">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">{getGameTypeIcon(data.type)}</span>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-th-text-primary truncate">{data.name}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-th-accent-primary/10 text-th-accent-primary border border-th-accent-primary/20 uppercase tracking-wider font-medium">
                                    {getGameTypeLabel(data.type)}
                                </span>
                                {isActive && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-th-success/10 text-th-success border border-th-success/20 uppercase tracking-wider font-medium">
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1.5 hover:bg-th-bg-elevated/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <MoreVertical className="w-4 h-4 text-th-text-muted" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    className="absolute right-4 top-12 z-10 bg-th-bg-surface rounded-xl border border-th-border shadow-lg py-1.5 w-40 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {!isActive && (
                                        <button
                                            onClick={() => { onSelect(); setShowMenu(false); }}
                                            className="w-full px-3 py-2 text-left text-sm text-th-text-secondary hover:bg-th-bg-elevated/50 flex items-center gap-2 transition-colors"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-th-success" />
                                            Set Active
                                        </button>
                                    )}
                                    <div className="border-t border-th-border-subtle my-1" />
                                    <button
                                        onClick={() => { onDelete(); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-th-error hover:bg-th-error/10 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Details */}
                <div className="relative p-4 space-y-2">
                    <div className="flex items-center gap-4 text-[11px] text-th-text-disabled">
                        <span className="flex items-center gap-1">
                            <Rows className="w-3 h-3" />
                            {formatRowCount(data.rowCount || 0)} rows
                        </span>
                        <span className="flex items-center gap-1">
                            <Columns className="w-3 h-3" />
                            {columnCount} columns
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-th-text-disabled">
                        <span className="flex items-center gap-1">
                            <FileSpreadsheet className="w-3 h-3" />
                            {data.fileName}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-th-text-disabled">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(data.uploadedAt)}
                        </span>
                    </div>

                    {/* Column mapping quality indicator */}
                    {columnCount > 0 && (
                        <div className="pt-2 border-t border-th-border-subtle mt-2">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-th-text-disabled">Mapped columns</span>
                                <span className="text-th-text-muted font-mono">
                                    {mappedColumns}/{columnCount}
                                </span>
                            </div>
                            <div className="mt-1.5 h-1 bg-th-bg-elevated/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-th-accent-primary/60 rounded-full transition-all"
                                    style={{ width: `${columnCount > 0 ? (mappedColumns / columnCount) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Active indicator */}
                {isActive && (
                    <div className="absolute top-3 right-12">
                        <CheckCircle2 className="w-4 h-4 text-th-success" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default GamesPage;
