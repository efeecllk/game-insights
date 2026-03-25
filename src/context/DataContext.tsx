/**
 * Data Context - Global state for uploaded game data
 */

import { useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import {
    GameData,
    GameProfile,
    getAllGameData,
    getAllGameProfiles,
    saveGameData,
    saveGameProfile,
    deleteGameData,
    generateId,
    initDB
} from '../lib/dataStore';
import { createRequiredContext, firstOrNull, selectMostRecentBy } from './internal/contextUtils';

interface DataContextType {
    // Game Data
    gameDataList: GameData[];
    activeGameData: GameData | null;
    setActiveGameData: (data: GameData | null) => void;
    addGameData: (data: Omit<GameData, 'id'>) => Promise<GameData>;
    addMultipleGameData: (dataList: Omit<GameData, 'id'>[]) => Promise<GameData[]>;
    removeGameData: (id: string) => Promise<void>;

    // Game Profiles
    profiles: GameProfile[];
    activeProfile: GameProfile | null;
    setActiveProfile: (profile: GameProfile | null) => void;
    addProfile: (profile: Omit<GameProfile, 'id' | 'createdAt'>) => Promise<GameProfile>;

    // Loading state
    isLoading: boolean;
    isReady: boolean;
}

const [DataContext, useRequiredDataContext] = createRequiredContext<DataContextType>('useData', 'DataProvider');

export function DataProvider({ children }: { children: ReactNode }) {
    const [gameDataList, setGameDataList] = useState<GameData[]>([]);
    const [activeGameData, setActiveGameData] = useState<GameData | null>(null);
    const [profiles, setProfiles] = useState<GameProfile[]>([]);
    const [activeProfile, setActiveProfile] = useState<GameProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);

    // Initialize DB and load data
    useEffect(() => {
        async function loadData() {
            try {
                await initDB();
                const [data, profs] = await Promise.all([
                    getAllGameData(),
                    getAllGameProfiles(),
                ]);

                setGameDataList(data);
                setProfiles(profs);
                setActiveGameData(selectMostRecentBy(data, (item) => item.uploadedAt));
                setActiveProfile(firstOrNull(profs));
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setIsLoading(false);
                setIsReady(true);
            }
        }

        loadData();
    }, []);

    const addGameData = useCallback(async (data: Omit<GameData, 'id'>): Promise<GameData> => {
        const newData: GameData = {
            ...data,
            id: generateId(),
        };
        await saveGameData(newData);
        setGameDataList(prev => [...prev, newData]);
        setActiveGameData(newData);
        return newData;
    }, []);

    const addMultipleGameData = useCallback(async (dataList: Omit<GameData, 'id'>[]): Promise<GameData[]> => {
        const newDataList: GameData[] = dataList.map(data => ({
            ...data,
            id: generateId(),
        }));

        await Promise.all(newDataList.map(data => saveGameData(data)));

        setGameDataList(prev => [...prev, ...newDataList]);

        setActiveGameData(firstOrNull(newDataList));

        return newDataList;
    }, []);

    const removeGameData = useCallback(async (id: string): Promise<void> => {
        await deleteGameData(id);
        setGameDataList(prev => prev.filter(d => d.id !== id));
        setActiveGameData(current => (current?.id === id ? null : current));
    }, []);

    const addProfile = useCallback(async (profile: Omit<GameProfile, 'id' | 'createdAt'>): Promise<GameProfile> => {
        const newProfile: GameProfile = {
            ...profile,
            id: generateId(),
            createdAt: new Date().toISOString(),
        };
        await saveGameProfile(newProfile);
        setProfiles(prev => [...prev, newProfile]);
        setActiveProfile(newProfile);
        return newProfile;
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo<DataContextType>(() => ({
        gameDataList,
        activeGameData,
        setActiveGameData,
        addGameData,
        addMultipleGameData,
        removeGameData,
        profiles,
        activeProfile,
        setActiveProfile,
        addProfile,
        isLoading,
        isReady,
    }), [
        gameDataList,
        activeGameData,
        addGameData,
        addMultipleGameData,
        removeGameData,
        profiles,
        activeProfile,
        addProfile,
        isLoading,
        isReady,
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    return useRequiredDataContext();
}
