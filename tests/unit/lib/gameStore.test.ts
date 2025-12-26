/**
 * Game Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import {
    createGame,
    createDefaultGameSettings,
    getGenreIcon,
    getGenreLabel,
    getPlatformLabel,
    GENRE_OPTIONS,
    PLATFORM_OPTIONS,
} from '../../../src/lib/gameStore';

describe('gameStore', () => {
    describe('createGame', () => {
        it('should create a game with required fields', () => {
            const game = createGame('Test Game', 'puzzle');

            expect(game.id).toBeDefined();
            expect(game.name).toBe('Test Game');
            expect(game.genre).toBe('puzzle');
            expect(game.icon).toBe('🧩');
            expect(game.isActive).toBe(true);
            expect(game.isPinned).toBe(false);
            expect(game.createdAt).toBeDefined();
            expect(game.updatedAt).toBeDefined();
        });

        it('should use correct icon for genre', () => {
            expect(createGame('Test', 'puzzle').icon).toBe('🧩');
            expect(createGame('Test', 'idle').icon).toBe('⏰');
            expect(createGame('Test', 'battle_royale').icon).toBe('🎯');
            expect(createGame('Test', 'match3_meta').icon).toBe('🍬');
            expect(createGame('Test', 'gacha_rpg').icon).toBe('⚔️');
        });

        it('should set default platform to cross_platform', () => {
            const game = createGame('Test', 'puzzle');
            expect(game.platform).toBe('cross_platform');
        });

        it('should allow custom platform', () => {
            const game = createGame('Test', 'puzzle', { platform: 'ios' });
            expect(game.platform).toBe('ios');
        });

        it('should set default currency to USD', () => {
            const game = createGame('Test', 'puzzle');
            expect(game.currency).toBe('USD');
        });

        it('should allow custom options', () => {
            const game = createGame('Test', 'puzzle', {
                description: 'Test description',
                bundleId: 'com.test.game',
                currency: 'EUR',
                isPinned: true,
            });

            expect(game.description).toBe('Test description');
            expect(game.bundleId).toBe('com.test.game');
            expect(game.currency).toBe('EUR');
            expect(game.isPinned).toBe(true);
        });
    });

    describe('createDefaultGameSettings', () => {
        it('should create settings with correct game ID', () => {
            const settings = createDefaultGameSettings('game-123');

            expect(settings.gameId).toBe('game-123');
        });

        it('should set default date range', () => {
            const settings = createDefaultGameSettings('game-123');
            expect(settings.dateRange).toBe('last_7_days');
        });

        it('should enable alerts by default', () => {
            const settings = createDefaultGameSettings('game-123');
            expect(settings.alertsEnabled).toBe(true);
        });

        it('should set default alert thresholds', () => {
            const settings = createDefaultGameSettings('game-123');

            expect(settings.alertThresholds.dauDropPercent).toBe(20);
            expect(settings.alertThresholds.revenueDropPercent).toBe(30);
            expect(settings.alertThresholds.retentionDropPercent).toBe(15);
        });

        it('should have empty connected sources', () => {
            const settings = createDefaultGameSettings('game-123');
            expect(settings.connectedSources).toEqual([]);
        });
    });

    describe('getGenreIcon', () => {
        it('should return correct icons for all genres', () => {
            expect(getGenreIcon('puzzle')).toBe('🧩');
            expect(getGenreIcon('idle')).toBe('⏰');
            expect(getGenreIcon('battle_royale')).toBe('🎯');
            expect(getGenreIcon('match3_meta')).toBe('🍬');
            expect(getGenreIcon('gacha_rpg')).toBe('⚔️');
            expect(getGenreIcon('casino')).toBe('🎰');
            expect(getGenreIcon('simulation')).toBe('🏗️');
            expect(getGenreIcon('strategy')).toBe('♟️');
            expect(getGenreIcon('sports')).toBe('⚽');
            expect(getGenreIcon('racing')).toBe('🏎️');
            expect(getGenreIcon('action')).toBe('💥');
            expect(getGenreIcon('other')).toBe('🎮');
        });
    });

    describe('getGenreLabel', () => {
        it('should return correct labels for all genres', () => {
            expect(getGenreLabel('puzzle')).toBe('Puzzle');
            expect(getGenreLabel('idle')).toBe('Idle / Clicker');
            expect(getGenreLabel('battle_royale')).toBe('Battle Royale');
            expect(getGenreLabel('match3_meta')).toBe('Match-3 + Meta');
            expect(getGenreLabel('gacha_rpg')).toBe('Gacha / RPG');
        });
    });

    describe('getPlatformLabel', () => {
        it('should return correct labels for all platforms', () => {
            expect(getPlatformLabel('ios')).toBe('iOS');
            expect(getPlatformLabel('android')).toBe('Android');
            expect(getPlatformLabel('web')).toBe('Web');
            expect(getPlatformLabel('steam')).toBe('Steam');
            expect(getPlatformLabel('console')).toBe('Console');
            expect(getPlatformLabel('cross_platform')).toBe('Cross-Platform');
        });
    });

    describe('GENRE_OPTIONS', () => {
        it('should have all 12 genres', () => {
            expect(GENRE_OPTIONS.length).toBe(12);
        });

        it('should have value, label, and icon for each option', () => {
            GENRE_OPTIONS.forEach(option => {
                expect(option.value).toBeDefined();
                expect(option.label).toBeDefined();
                expect(option.icon).toBeDefined();
            });
        });
    });

    describe('PLATFORM_OPTIONS', () => {
        it('should have 6 platforms', () => {
            expect(PLATFORM_OPTIONS.length).toBe(6);
        });

        it('should have value and label for each option', () => {
            PLATFORM_OPTIONS.forEach(option => {
                expect(option.value).toBeDefined();
                expect(option.label).toBeDefined();
            });
        });
    });
});
