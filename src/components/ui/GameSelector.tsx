/**
 * Game Type Selector Component
 * Allows switching between different game demo scenarios
 */

import { GameCategory, GameProfile } from '../../types';
import { gameCategories } from '../../lib/dataProviders';

interface GameSelectorProps {
    selected: GameCategory;
    onChange: (category: GameCategory) => void;
}

export function GameSelector({ selected, onChange }: GameSelectorProps) {
    return (
        <div className="bg-bg-card rounded-card p-4 border border-white/[0.06]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                Select Demo Game Type
            </p>
            <div className="flex flex-wrap gap-2">
                {gameCategories.map((game) => (
                    <button
                        key={game.id}
                        onClick={() => onChange(game.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selected === game.id
                                ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/50'
                                : 'bg-bg-elevated text-zinc-400 border border-white/[0.06] hover:bg-bg-card-hover hover:text-zinc-200'
                            }`}
                    >
                        <span className="mr-2">{game.icon}</span>
                        {game.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default GameSelector;
