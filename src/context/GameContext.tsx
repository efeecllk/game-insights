/**
 * Game Context - Shares selected game type across components
 * Auto-syncs with uploaded data game type
 * Phase 1: Core Data Integration
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { GameCategory } from '../types';
import { useData } from './DataContext';

interface GameContextType {
    selectedGame: GameCategory;
    setSelectedGame: (game: GameCategory) => void;
    isAutoSynced: boolean;
    setAutoSync: (enabled: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const [selectedGame, setSelectedGame] = useState<GameCategory>('puzzle');
    const [isAutoSynced, setAutoSync] = useState(true);
    const { activeGameData } = useData();

    // Sync game type from uploaded data when it changes
    useEffect(() => {
        if (!isAutoSynced) return;

        if (activeGameData?.type && activeGameData.type !== 'custom') {
            const gameType = activeGameData.type as GameCategory;
            if (gameType !== selectedGame) {
                setSelectedGame(gameType);
            }
        }
    }, [activeGameData, isAutoSynced]); // eslint-disable-line react-hooks/exhaustive-deps

    // Wrapped setter that disables auto-sync on manual selection
    const handleSetSelectedGame = useCallback((game: GameCategory) => {
        setSelectedGame(game);
        // If user manually selects a game, we might want to keep auto-sync
        // but let them override. Uncomment below to disable auto-sync on manual change:
        // setAutoSync(false);
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo<GameContextType>(() => ({
        selectedGame,
        setSelectedGame: handleSetSelectedGame,
        isAutoSynced,
        setAutoSync,
    }), [selectedGame, handleSetSelectedGame, isAutoSynced]);

    return (
        <GameContext.Provider value={value}>
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
