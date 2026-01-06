/**
 * Games Management Page - Obsidian Analytics Design
 *
 * Premium games portfolio with:
 * - Glassmorphism cards
 * - Animated grid layouts
 * - Premium modals
 * - Emerald accent theme
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gamepad2,
    Plus,
    Settings,
    Trash2,
    Star,
    StarOff,
    Globe,
    Clock,
    DollarSign,
    Edit3,
    X,
    Check,
    ExternalLink,
    MoreVertical,
} from 'lucide-react';
import {
    Game,
    GameGenre,
    GamePlatform,
    getAllGames,
    saveGame,
    deleteGame,
    createGame,
    initializeSampleGames,
    GENRE_OPTIONS,
    PLATFORM_OPTIONS,
    getGenreLabel,
    getPlatformLabel,
} from '../lib/gameStore';
import { useGame } from '../context/GameContext';

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
// Main Page Component
// ============================================================================

export function GamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const { setSelectedGame } = useGame();

    useEffect(() => {
        loadGames();
    }, []);

    async function loadGames() {
        setLoading(true);
        await initializeSampleGames();
        const all = await getAllGames();
        setGames(all);
        setLoading(false);
    }

    async function handleTogglePin(game: Game) {
        await saveGame({ ...game, isPinned: !game.isPinned });
        await loadGames();
    }

    async function handleToggleActive(game: Game) {
        await saveGame({ ...game, isActive: !game.isActive });
        await loadGames();
    }

    async function handleDeleteGame(id: string) {
        if (!confirm('Are you sure you want to delete this game?')) return;
        await deleteGame(id);
        await loadGames();
    }

    async function handleSaveGame(game: Game) {
        await saveGame(game);
        await loadGames();
        setEditingGame(null);
        setShowAddModal(false);
    }

    function handleSelectGame(game: Game) {
        const typeMap: Record<string, string> = {
            puzzle: 'puzzle',
            idle: 'idle',
            battle_royale: 'battle_royale',
            match3_meta: 'match3_meta',
            gacha_rpg: 'gacha_rpg',
        };
        const gameType = typeMap[game.genre] || 'puzzle';
        setSelectedGame(gameType as Parameters<typeof setSelectedGame>[0]);
    }

    const sortedGames = [...games].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.name.localeCompare(b.name);
    });

    const pinnedGames = sortedGames.filter(g => g.isPinned);
    const otherGames = sortedGames.filter(g => !g.isPinned);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
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
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Gamepad2 className="w-6 h-6 text-emerald-400" />
                        </div>
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-white">Games</h1>
                        <p className="text-sm text-slate-500">Manage your game portfolio</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Game
                </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Gamepad2} label="Total Games" value={games.length} color="emerald" />
                <StatCard icon={Star} label="Pinned" value={pinnedGames.length} color="amber" />
                <StatCard icon={Check} label="Active" value={games.filter(g => g.isActive).length} color="teal" />
                <StatCard icon={Globe} label="Platforms" value={new Set(games.map(g => g.platform)).size} color="blue" />
            </motion.div>

            {/* Pinned Games */}
            {pinnedGames.length > 0 && (
                <motion.section variants={itemVariants}>
                    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="uppercase tracking-wider">Pinned Games</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pinnedGames.map((game, index) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                index={index}
                                onSelect={() => handleSelectGame(game)}
                                onEdit={() => setEditingGame(game)}
                                onDelete={() => handleDeleteGame(game.id)}
                                onTogglePin={() => handleTogglePin(game)}
                                onToggleActive={() => handleToggleActive(game)}
                            />
                        ))}
                    </div>
                </motion.section>
            )}

            {/* All Games */}
            <motion.section variants={itemVariants}>
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-slate-500" />
                    <span className="uppercase tracking-wider">{pinnedGames.length > 0 ? 'Other Games' : 'All Games'}</span>
                </h2>
                {otherGames.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherGames.map((game, index) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                index={index + pinnedGames.length}
                                onSelect={() => handleSelectGame(game)}
                                onEdit={() => setEditingGame(game)}
                                onDelete={() => handleDeleteGame(game.id)}
                                onTogglePin={() => handleTogglePin(game)}
                                onToggleActive={() => handleToggleActive(game)}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-12 text-center overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                                <Gamepad2 className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-slate-500">No games yet. Add your first game to get started.</p>
                        </div>
                    </motion.div>
                )}
            </motion.section>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {(showAddModal || editingGame) && (
                    <GameModal
                        game={editingGame}
                        onSave={handleSaveGame}
                        onClose={() => {
                            setShowAddModal(false);
                            setEditingGame(null);
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
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    color: 'emerald' | 'amber' | 'teal' | 'blue';
}) {
    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="relative group"
        >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                <div className="relative flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors[color]} border flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white font-mono">{value}</p>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Game Card
// ============================================================================

function GameCard({
    game,
    index,
    onSelect,
    onEdit,
    onDelete,
    onTogglePin,
    onToggleActive,
}: {
    game: Game;
    index: number;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onToggleActive: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ y: -4 }}
            className={`relative group cursor-pointer ${!game.isActive ? 'opacity-60' : ''}`}
            onClick={onSelect}
        >
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

            <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl rounded-2xl border border-white/[0.06] group-hover:border-emerald-500/20 transition-colors overflow-hidden">
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                {/* Header */}
                <div className="relative p-4 border-b border-white/[0.04]">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">{game.icon}</span>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-white truncate">{game.name}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-medium">
                                    {getGenreLabel(game.genre)}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] text-slate-500 border border-white/[0.06] uppercase tracking-wider">
                                    {getPlatformLabel(game.platform)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    className="absolute right-4 top-12 z-10 bg-slate-900 rounded-xl border border-white/[0.08] shadow-2xl py-1.5 w-40 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => { onEdit(); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/[0.03] flex items-center gap-2 transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4 text-slate-500" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { onTogglePin(); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/[0.03] flex items-center gap-2 transition-colors"
                                    >
                                        {game.isPinned ? (
                                            <><StarOff className="w-4 h-4 text-slate-500" />Unpin</>
                                        ) : (
                                            <><Star className="w-4 h-4 text-amber-400" />Pin</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { onToggleActive(); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/[0.03] flex items-center gap-2 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-slate-500" />
                                        {game.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <div className="border-t border-white/[0.06] my-1" />
                                    <button
                                        onClick={() => { onDelete(); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
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
                    {game.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">{game.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {game.timezone.split('/')[1] || game.timezone}
                        </span>
                        <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {game.currency}
                        </span>
                    </div>
                    {(game.appStoreUrl || game.playStoreUrl) && (
                        <div className="flex items-center gap-3 pt-2">
                            {game.appStoreUrl && (
                                <a
                                    href={game.appStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                >
                                    App Store <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                            {game.playStoreUrl && (
                                <a
                                    href={game.playStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                >
                                    Play Store <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Pin indicator */}
                {game.isPinned && (
                    <div className="absolute top-3 right-12">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ============================================================================
// Game Modal
// ============================================================================

function GameModal({
    game,
    onSave,
    onClose,
}: {
    game: Game | null;
    onSave: (game: Game) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<Game>>({
        name: game?.name || '',
        genre: game?.genre || 'puzzle',
        platform: game?.platform || 'cross_platform',
        description: game?.description || '',
        bundleId: game?.bundleId || '',
        appStoreUrl: game?.appStoreUrl || '',
        playStoreUrl: game?.playStoreUrl || '',
        timezone: game?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        currency: game?.currency || 'USD',
    });

    const isEditing = !!game;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.name || !formData.genre) return;

        if (isEditing && game) {
            onSave({
                ...game,
                ...formData,
                name: formData.name!,
                genre: formData.genre!,
                platform: formData.platform || 'cross_platform',
            });
        } else {
            const newGame = createGame(
                formData.name!,
                formData.genre as GameGenre,
                {
                    platform: formData.platform as GamePlatform,
                    description: formData.description,
                    bundleId: formData.bundleId,
                    appStoreUrl: formData.appStoreUrl,
                    playStoreUrl: formData.playStoreUrl,
                    timezone: formData.timezone,
                    currency: formData.currency,
                }
            );
            onSave(newGame);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-white/[0.08] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Noise texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-center justify-between p-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">
                                {isEditing ? 'Edit Game' : 'Add Game'}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {isEditing ? 'Update game details' : 'Add a new game to your portfolio'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="relative p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Name */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                            Game Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter game name"
                            required
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                        />
                    </div>

                    {/* Genre */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                            Genre *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {GENRE_OPTIONS.map(({ value, label, icon }) => (
                                <motion.button
                                    key={value}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setFormData({ ...formData, genre: value })}
                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                        formData.genre === value
                                            ? 'border-emerald-500/30 bg-emerald-500/10'
                                            : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
                                    }`}
                                >
                                    <span className="text-xl">{icon}</span>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{label}</p>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                            Platform
                        </label>
                        <select
                            value={formData.platform}
                            onChange={(e) => setFormData({ ...formData, platform: e.target.value as GamePlatform })}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                        >
                            {PLATFORM_OPTIONS.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of your game"
                            rows={2}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-all text-sm"
                        />
                    </div>

                    {/* Settings Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                Timezone
                            </label>
                            <select
                                value={formData.timezone}
                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                            >
                                <option value="America/New_York">Eastern (ET)</option>
                                <option value="America/Chicago">Central (CT)</option>
                                <option value="America/Denver">Mountain (MT)</option>
                                <option value="America/Los_Angeles">Pacific (PT)</option>
                                <option value="Europe/London">London (GMT)</option>
                                <option value="Europe/Paris">Paris (CET)</option>
                                <option value="Asia/Tokyo">Tokyo (JST)</option>
                                <option value="Asia/Shanghai">Shanghai (CST)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                Currency
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="JPY">JPY</option>
                                <option value="CNY">CNY</option>
                                <option value="KRW">KRW</option>
                            </select>
                        </div>
                    </div>

                    {/* Store Links */}
                    <div className="pt-4 border-t border-white/[0.06]">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">Store Links (Optional)</p>
                        <div className="space-y-3">
                            <input
                                type="url"
                                value={formData.appStoreUrl}
                                onChange={(e) => setFormData({ ...formData, appStoreUrl: e.target.value })}
                                placeholder="App Store URL"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                            />
                            <input
                                type="url"
                                value={formData.playStoreUrl}
                                onChange={(e) => setFormData({ ...formData, playStoreUrl: e.target.value })}
                                placeholder="Play Store URL"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 rounded-xl transition-colors text-sm font-medium"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Check className="w-4 h-4" />
                            {isEditing ? 'Save Changes' : 'Add Game'}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

export default GamesPage;
