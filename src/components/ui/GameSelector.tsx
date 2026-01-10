/**
 * Game Type Selector - Simplified Design
 *
 * Clean selector with:
 * - Simple, clear buttons
 * - Minimal animations
 * - Clear active state
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { GameCategory } from '../../types';
import { gameCategories } from '../../lib/dataProviders';

interface GameSelectorProps {
    selected: GameCategory;
    onChange: (category: GameCategory) => void;
}

export const GameSelector = memo(function GameSelector({ selected, onChange }: GameSelectorProps) {
    return (
        <div className="bg-th-bg-surface rounded-xl p-4 border border-th-border-subtle">
            {/* Label */}
            <p className="text-xs text-th-text-muted uppercase tracking-wider font-medium mb-3">
                Demo Game Type
            </p>

            {/* Button grid - simple and clean */}
            <div className="flex flex-wrap gap-2">
                {gameCategories.map((game) => {
                    const isSelected = selected === game.id;
                    return (
                        <button
                            key={game.id}
                            onClick={() => onChange(game.id)}
                            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isSelected
                                    ? 'bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/30'
                                    : 'bg-th-bg-elevated text-th-text-secondary hover:text-th-text-primary border border-th-border-subtle hover:border-th-border-default'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-base">{game.icon}</span>
                                <span>{game.name}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

export default GameSelector;
