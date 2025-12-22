/**
 * Game Context - Shares selected game type across components
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { GameCategory } from '../types';

interface GameContextType {
    selectedGame: GameCategory;
    setSelectedGame: (game: GameCategory) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const [selectedGame, setSelectedGame] = useState<GameCategory>('puzzle');

    return (
        <GameContext.Provider value={{ selectedGame, setSelectedGame }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}
