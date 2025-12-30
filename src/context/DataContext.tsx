/**
 * Data Context - Global state for uploaded game data
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

const DataContext = createContext<DataContextType | undefined>(undefined);

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
                    getAllGameProfiles()
                ]);
                setGameDataList(data);
                setProfiles(profs);

                // Set active to most recent
                if (data.length > 0) {
                    const sorted = [...data].sort((a, b) =>
                        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                    );
                    setActiveGameData(sorted[0]);
                }
                if (profs.length > 0) {
                    setActiveProfile(profs[0]);
                }
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

        // Save all in parallel
        await Promise.all(newDataList.map(data => saveGameData(data)));

        setGameDataList(prev => [...prev, ...newDataList]);

        // Set the first one as active
        if (newDataList.length > 0) {
            setActiveGameData(newDataList[0]);
        }

        return newDataList;
    }, []);

    const removeGameData = useCallback(async (id: string): Promise<void> => {
        await deleteGameData(id);
        setGameDataList(prev => prev.filter(d => d.id !== id));
        if (activeGameData?.id === id) {
            setActiveGameData(null);
        }
    }, [activeGameData]);

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

    return (
        <DataContext.Provider value={{
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
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
