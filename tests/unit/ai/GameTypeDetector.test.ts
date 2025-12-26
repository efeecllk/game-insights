/**
 * GameTypeDetector Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import { GameTypeDetector } from '../../../src/ai/GameTypeDetector';
import { ColumnMeaning } from '../../../src/ai/SchemaAnalyzer';

describe('GameTypeDetector', () => {
    const detector = new GameTypeDetector();

    describe('detect', () => {
        it('should detect puzzle game from puzzle indicators', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'level', semanticType: 'level', confidence: 0.9 },
                { column: 'moves', semanticType: 'moves', confidence: 0.9 },
                { column: 'score', semanticType: 'score', confidence: 0.9 },
                { column: 'booster', semanticType: 'booster', confidence: 0.8 },
                { column: 'lives', semanticType: 'lives', confidence: 0.8 },
            ];

            const result = detector.detect(meanings);

            expect(result.gameType).toBe('puzzle');
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.reasons.length).toBeGreaterThan(0);
        });

        it('should detect idle game from idle indicators', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'prestige', semanticType: 'prestige', confidence: 0.9 },
                { column: 'offline_reward', semanticType: 'offline_reward', confidence: 0.9 },
                { column: 'upgrade', semanticType: 'upgrade', confidence: 0.8 },
                { column: 'currency', semanticType: 'currency', confidence: 0.8 },
            ];

            const result = detector.detect(meanings);

            expect(result.gameType).toBe('idle');
        });

        it('should detect battle royale from BR indicators', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'placement', semanticType: 'placement', confidence: 0.9 },
                { column: 'kills', semanticType: 'kills', confidence: 0.9 },
                { column: 'damage', semanticType: 'damage', confidence: 0.8 },
                { column: 'survival_time', semanticType: 'survival_time', confidence: 0.8 },
            ];

            const result = detector.detect(meanings);

            expect(result.gameType).toBe('battle_royale');
        });

        it('should detect gacha RPG from gacha indicators', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'pull_type', semanticType: 'pull_type', confidence: 0.9 },
                { column: 'banner', semanticType: 'banner', confidence: 0.9 },
                { column: 'rarity', semanticType: 'rarity', confidence: 0.9 },
                { column: 'currency', semanticType: 'currency', confidence: 0.8 },
            ];

            const result = detector.detect(meanings);

            expect(result.gameType).toBe('gacha_rpg');
        });

        it('should return custom for generic data', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'user_id', semanticType: 'user_id', confidence: 0.9 },
                { column: 'timestamp', semanticType: 'timestamp', confidence: 0.9 },
                { column: 'value', semanticType: 'unknown', confidence: 0.5 },
            ];

            const result = detector.detect(meanings);

            // With minimal indicators, should return custom or low confidence
            expect(result.confidence).toBeLessThan(0.5);
        });

        it('should return confidence between 0 and 1', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'level', semanticType: 'level', confidence: 0.9 },
                { column: 'score', semanticType: 'score', confidence: 0.9 },
            ];

            const result = detector.detect(meanings);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });

        it('should include reasons for detection', () => {
            const meanings: ColumnMeaning[] = [
                { column: 'prestige', semanticType: 'prestige', confidence: 0.9 },
                { column: 'offline_reward', semanticType: 'offline_reward', confidence: 0.9 },
            ];

            const result = detector.detect(meanings);

            expect(result.reasons).toBeInstanceOf(Array);
            expect(result.reasons.some(r => r.includes('prestige') || r.includes('offline_reward'))).toBe(true);
        });

        it('should handle empty meanings array', () => {
            const result = detector.detect([]);

            expect(result.gameType).toBeDefined();
            // With no meanings, detector returns base confidence
            expect(result.confidence).toBeLessThan(0.5);
        });
    });
});
