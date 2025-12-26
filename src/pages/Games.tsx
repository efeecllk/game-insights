/**
 * Games Management Page
 * Multi-game management for Phase 6
 */

import { useState, useEffect } from 'react';
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
        // Map game genre to game type for the context
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

    // Sort games: pinned first, then by name
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
                <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Gamepad2 className="w-7 h-7 text-accent-primary" />
                        Games
                    </h1>
                    <p className="text-zinc-500 mt-1">Manage your game portfolio</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Game
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Gamepad2 className="w-5 h-5" />}
                    label="Total Games"
                    value={games.length}
                    color="violet"
                />
                <StatCard
                    icon={<Star className="w-5 h-5" />}
                    label="Pinned"
                    value={pinnedGames.length}
                    color="yellow"
                />
                <StatCard
                    icon={<Check className="w-5 h-5" />}
                    label="Active"
                    value={games.filter(g => g.isActive).length}
                    color="green"
                />
                <StatCard
                    icon={<Globe className="w-5 h-5" />}
                    label="Platforms"
                    value={new Set(games.map(g => g.platform)).size}
                    color="blue"
                />
            </div>

            {/* Pinned Games */}
            {pinnedGames.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        Pinned Games
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pinnedGames.map(game => (
                            <GameCard
                                key={game.id}
                                game={game}
                                onSelect={() => handleSelectGame(game)}
                                onEdit={() => setEditingGame(game)}
                                onDelete={() => handleDeleteGame(game.id)}
                                onTogglePin={() => handleTogglePin(game)}
                                onToggleActive={() => handleToggleActive(game)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* All Games */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-zinc-400" />
                    {pinnedGames.length > 0 ? 'Other Games' : 'All Games'}
                </h2>
                {otherGames.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherGames.map(game => (
                            <GameCard
                                key={game.id}
                                game={game}
                                onSelect={() => handleSelectGame(game)}
                                onEdit={() => setEditingGame(game)}
                                onDelete={() => handleDeleteGame(game.id)}
                                onTogglePin={() => handleTogglePin(game)}
                                onToggleActive={() => handleToggleActive(game)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-bg-card rounded-xl border border-white/10 p-12 text-center">
                        <Gamepad2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500">No games yet. Add your first game to get started.</p>
                    </div>
                )}
            </section>

            {/* Add/Edit Modal */}
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
        </div>
    );
}

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'violet' | 'yellow' | 'green' | 'blue';
}) {
    const colors = {
        violet: 'bg-violet-500/10 text-violet-400',
        yellow: 'bg-yellow-500/10 text-yellow-400',
        green: 'bg-green-500/10 text-green-400',
        blue: 'bg-blue-500/10 text-blue-400',
    };

    return (
        <div className="bg-bg-card rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-zinc-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Game Card
// ============================================================================

function GameCard({
    game,
    onSelect,
    onEdit,
    onDelete,
    onTogglePin,
    onToggleActive,
}: {
    game: Game;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onToggleActive: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div
            className={`group relative bg-bg-card rounded-xl border transition-all cursor-pointer ${
                game.isActive
                    ? 'border-white/10 hover:border-white/20'
                    : 'border-white/5 opacity-60'
            }`}
            onClick={onSelect}
        >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-start gap-3">
                    <span className="text-3xl">{game.icon}</span>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{game.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-zinc-400">
                                {getGenreLabel(game.genre)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-zinc-500">
                                {getPlatformLabel(game.platform)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <MoreVertical className="w-4 h-4 text-zinc-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div
                            className="absolute right-4 top-12 z-10 bg-zinc-800 rounded-lg border border-white/10 shadow-xl py-1 w-40"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => {
                                    onEdit();
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    onTogglePin();
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                            >
                                {game.isPinned ? (
                                    <>
                                        <StarOff className="w-4 h-4" />
                                        Unpin
                                    </>
                                ) : (
                                    <>
                                        <Star className="w-4 h-4" />
                                        Pin
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    onToggleActive();
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                {game.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="border-t border-white/10 my-1" />
                            <button
                                onClick={() => {
                                    onDelete();
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-2">
                {game.description && (
                    <p className="text-sm text-zinc-500 line-clamp-2">{game.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {game.timezone.split('/')[1] || game.timezone}
                    </span>
                    <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {game.currency}
                    </span>
                </div>

                {/* Store Links */}
                {(game.appStoreUrl || game.playStoreUrl) && (
                    <div className="flex items-center gap-2 pt-2">
                        {game.appStoreUrl && (
                            <a
                                href={game.appStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
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
                                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                            >
                                Play Store <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Pin indicator */}
            {game.isPinned && (
                <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
            )}
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {isEditing ? 'Edit Game' : 'Add Game'}
                            </h2>
                            <p className="text-sm text-zinc-500">
                                {isEditing ? 'Update game details' : 'Add a new game to your portfolio'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Game Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter game name"
                            required
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                        />
                    </div>

                    {/* Genre */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Genre *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {GENRE_OPTIONS.slice(0, 6).map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, genre: value })}
                                    className={`p-2 rounded-lg border text-left transition-all ${
                                        formData.genre === value
                                            ? 'border-violet-500 bg-violet-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <span className="text-xl">{icon}</span>
                                    <p className="text-xs text-zinc-400 mt-1">{label}</p>
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {GENRE_OPTIONS.slice(6).map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, genre: value })}
                                    className={`p-2 rounded-lg border text-left transition-all ${
                                        formData.genre === value
                                            ? 'border-violet-500 bg-violet-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <span className="text-xl">{icon}</span>
                                    <p className="text-xs text-zinc-400 mt-1">{label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Platform
                        </label>
                        <select
                            value={formData.platform}
                            onChange={(e) => setFormData({ ...formData, platform: e.target.value as GamePlatform })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500"
                        >
                            {PLATFORM_OPTIONS.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of your game"
                            rows={2}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                        />
                    </div>

                    {/* Settings Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Timezone
                            </label>
                            <select
                                value={formData.timezone}
                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500"
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
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Currency
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500"
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

                    {/* Optional: Store Links */}
                    <div className="pt-4 border-t border-white/10">
                        <p className="text-sm font-medium text-zinc-400 mb-3">Store Links (Optional)</p>
                        <div className="space-y-3">
                            <input
                                type="url"
                                value={formData.appStoreUrl}
                                onChange={(e) => setFormData({ ...formData, appStoreUrl: e.target.value })}
                                placeholder="App Store URL"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                            />
                            <input
                                type="url"
                                value={formData.playStoreUrl}
                                onChange={(e) => setFormData({ ...formData, playStoreUrl: e.target.value })}
                                placeholder="Play Store URL"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            {isEditing ? 'Save Changes' : 'Add Game'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
