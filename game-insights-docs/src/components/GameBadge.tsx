import React from 'react';

type GameType = 'puzzle' | 'idle' | 'battle-royale' | 'match3' | 'gacha';

interface GameBadgeProps {
  type: GameType;
  label?: string;
}

const gameTypeConfig: Record<GameType, { icon: string; label: string }> = {
  puzzle: { icon: '🧩', label: 'Puzzle' },
  idle: { icon: '⏰', label: 'Idle' },
  'battle-royale': { icon: '🎯', label: 'Battle Royale' },
  match3: { icon: '💎', label: 'Match-3 Meta' },
  gacha: { icon: '🎰', label: 'Gacha RPG' },
};

export default function GameBadge({ type, label }: GameBadgeProps) {
  const config = gameTypeConfig[type];

  return (
    <span className={`game-badge game-badge--${type}`}>
      {config.icon} {label || config.label}
    </span>
  );
}
