/**
 * Game Type Detector
 * Automatically detects game type from data patterns
 */

import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';
import { GameCategory } from '../types';

interface DetectionResult {
    gameType: GameCategory;
    confidence: number;
    reasons: string[];
}

// Weighted indicators for each game type
const GAME_INDICATORS: Record<GameCategory, { signals: SemanticType[]; weight: number }[]> = {
    puzzle: [
        { signals: ['moves', 'booster'], weight: 5 },       // Strong: puzzle-specific
        { signals: ['level', 'score'], weight: 3 },
        { signals: ['lives'], weight: 3 },
        { signals: ['session_id'], weight: 1 },
    ],
    idle: [
        { signals: ['prestige'], weight: 5 },               // Strong: idle-specific  
        { signals: ['offline_reward'], weight: 5 },
        { signals: ['upgrade'], weight: 4 },
        { signals: ['currency'], weight: 3 },
        { signals: ['level'], weight: 1 },
    ],
    battle_royale: [
        { signals: ['placement', 'kills'], weight: 5 },     // Strong: BR-specific
        { signals: ['damage', 'survival_time'], weight: 4 },
        { signals: ['rank'], weight: 3 },
        { signals: ['user_id'], weight: 1 },
    ],
    match3_meta: [
        { signals: ['moves', 'booster'], weight: 5 },
        { signals: ['level', 'score'], weight: 3 },
        { signals: ['item_id', 'category'], weight: 2 },
        { signals: ['revenue', 'price'], weight: 1 },
    ],
    gacha_rpg: [
        { signals: ['pull_type', 'banner'], weight: 5 },    // Strong: gacha-specific
        { signals: ['rarity'], weight: 5 },
        { signals: ['currency'], weight: 3 },
        { signals: ['level', 'xp'], weight: 2 },
        { signals: ['rank'], weight: 1 },
    ],
    custom: [],
};

export class GameTypeDetector {
    /**
     * Detect game type from column meanings
     */
    detect(meanings: ColumnMeaning[]): DetectionResult {
        const semanticTypes = new Set(meanings.map(m => m.semanticType));
        const scores: Record<GameCategory, number> = {
            puzzle: 0,
            idle: 0,
            battle_royale: 0,
            match3_meta: 0,
            gacha_rpg: 0,
            custom: 0,
        };
        const reasons: Record<GameCategory, string[]> = {
            puzzle: [],
            idle: [],
            battle_royale: [],
            match3_meta: [],
            gacha_rpg: [],
            custom: [],
        };

        // Calculate scores
        for (const [gameType, indicators] of Object.entries(GAME_INDICATORS)) {
            for (const { signals, weight } of indicators) {
                const matches = signals.filter(s => semanticTypes.has(s));
                if (matches.length > 0) {
                    scores[gameType as GameCategory] += weight * matches.length;
                    reasons[gameType as GameCategory].push(
                        `Found ${matches.join(', ')} (weight: ${weight})`
                    );
                }
            }
        }

        // Find winner
        const entries = Object.entries(scores) as [GameCategory, number][];
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        const [topType, topScore] = sorted[0];
        const [, secondScore] = sorted[1] || ['custom', 0];

        // Calculate confidence
        const maxPossible = Math.max(...Object.values(GAME_INDICATORS).map(
            inds => inds.reduce((sum, i) => sum + i.weight * i.signals.length, 0)
        ));
        const confidence = topScore / maxPossible;

        // If scores are too close, mark as custom
        if (topScore === 0 || topScore - secondScore < 2) {
            return {
                gameType: 'custom',
                confidence: 0.3,
                reasons: ['No clear game type pattern detected'],
            };
        }

        return {
            gameType: topType,
            confidence: Math.min(confidence + 0.3, 0.95),
            reasons: reasons[topType],
        };
    }
}

export const gameTypeDetector = new GameTypeDetector();
