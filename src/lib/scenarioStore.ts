/**
 * Scenario Store
 * Persists what-if analysis scenarios using IndexedDB
 * Phase 5: Advanced AI & Automation
 */

import { dbPut, dbGetAll, dbGet, dbDelete, generateId } from './db';
import type {
    BaselineMetrics,
    ScenarioModification,
    ScenarioResult,
} from '../ai/WhatIfEngine';

// ============================================================================
// Types
// ============================================================================

export interface SavedScenario {
    id: string;
    name: string;
    description?: string;
    /** Baseline metrics used for the scenario */
    baselineMetrics: BaselineMetrics;
    /** Modifications applied */
    modifications: ScenarioModification;
    /** Time horizon in days */
    timeHorizon: number;
    /** Daily new users assumption */
    dailyNewUsers: number;
    /** Cached result from the engine */
    result?: ScenarioResult;
    /** Tags for organization */
    tags: string[];
    /** Whether this is a favorite */
    isFavorite: boolean;
    /** Game ID this scenario belongs to */
    gameId?: string;
    /** Creation timestamp */
    createdAt: string;
    /** Last updated timestamp */
    updatedAt: string;
}

export interface ScenarioFilter {
    gameId?: string;
    tags?: string[];
    isFavorite?: boolean;
    search?: string;
}

// ============================================================================
// Store Name
// ============================================================================

const STORE_NAME = 'scenarios';

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Save a new scenario or update an existing one
 */
export async function saveScenario(
    scenario: Omit<SavedScenario, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<SavedScenario> {
    const now = new Date().toISOString();

    const savedScenario: SavedScenario = {
        ...scenario,
        id: scenario.id || generateId(),
        createdAt: scenario.id ? (await getScenario(scenario.id))?.createdAt || now : now,
        updatedAt: now,
    };

    await dbPut(STORE_NAME, savedScenario);
    return savedScenario;
}

/**
 * Get a single scenario by ID
 */
export async function getScenario(id: string): Promise<SavedScenario | null> {
    const scenario = await dbGet<SavedScenario>(STORE_NAME, id);
    return scenario || null;
}

/**
 * Get all scenarios
 */
export async function getAllScenarios(): Promise<SavedScenario[]> {
    const scenarios = await dbGetAll<SavedScenario>(STORE_NAME);
    return scenarios.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

/**
 * Get scenarios with optional filtering
 */
export async function getScenarios(filter?: ScenarioFilter): Promise<SavedScenario[]> {
    let scenarios = await getAllScenarios();

    if (filter) {
        if (filter.gameId) {
            scenarios = scenarios.filter(s => s.gameId === filter.gameId);
        }

        if (filter.tags && filter.tags.length > 0) {
            scenarios = scenarios.filter(s =>
                filter.tags!.some(tag => s.tags.includes(tag))
            );
        }

        if (filter.isFavorite !== undefined) {
            scenarios = scenarios.filter(s => s.isFavorite === filter.isFavorite);
        }

        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            scenarios = scenarios.filter(s =>
                s.name.toLowerCase().includes(searchLower) ||
                (s.description && s.description.toLowerCase().includes(searchLower))
            );
        }
    }

    return scenarios;
}

/**
 * Delete a scenario by ID
 */
export async function deleteScenario(id: string): Promise<void> {
    await dbDelete(STORE_NAME, id);
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(id: string): Promise<SavedScenario | null> {
    const scenario = await getScenario(id);
    if (!scenario) return null;

    scenario.isFavorite = !scenario.isFavorite;
    scenario.updatedAt = new Date().toISOString();

    await dbPut(STORE_NAME, scenario);
    return scenario;
}

/**
 * Duplicate a scenario with a new name
 */
export async function duplicateScenario(
    id: string,
    newName?: string
): Promise<SavedScenario | null> {
    const original = await getScenario(id);
    if (!original) return null;

    const duplicate: Omit<SavedScenario, 'id' | 'createdAt' | 'updatedAt'> = {
        ...original,
        name: newName || `${original.name} (Copy)`,
        isFavorite: false,
    };

    // Remove id to generate a new one
    return saveScenario(duplicate);
}

/**
 * Add a tag to a scenario
 */
export async function addTag(id: string, tag: string): Promise<SavedScenario | null> {
    const scenario = await getScenario(id);
    if (!scenario) return null;

    if (!scenario.tags.includes(tag)) {
        scenario.tags.push(tag);
        scenario.updatedAt = new Date().toISOString();
        await dbPut(STORE_NAME, scenario);
    }

    return scenario;
}

/**
 * Remove a tag from a scenario
 */
export async function removeTag(id: string, tag: string): Promise<SavedScenario | null> {
    const scenario = await getScenario(id);
    if (!scenario) return null;

    scenario.tags = scenario.tags.filter(t => t !== tag);
    scenario.updatedAt = new Date().toISOString();
    await dbPut(STORE_NAME, scenario);

    return scenario;
}

/**
 * Get all unique tags used across scenarios
 */
export async function getAllTags(): Promise<string[]> {
    const scenarios = await getAllScenarios();
    const tagSet = new Set<string>();

    for (const scenario of scenarios) {
        for (const tag of scenario.tags) {
            tagSet.add(tag);
        }
    }

    return Array.from(tagSet).sort();
}

/**
 * Update the cached result for a scenario
 */
export async function updateScenarioResult(
    id: string,
    result: ScenarioResult
): Promise<SavedScenario | null> {
    const scenario = await getScenario(id);
    if (!scenario) return null;

    scenario.result = result;
    scenario.updatedAt = new Date().toISOString();
    await dbPut(STORE_NAME, scenario);

    return scenario;
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Delete all scenarios for a game
 */
export async function deleteGameScenarios(gameId: string): Promise<number> {
    const scenarios = await getScenarios({ gameId });
    let deleted = 0;

    for (const scenario of scenarios) {
        await deleteScenario(scenario.id);
        deleted++;
    }

    return deleted;
}

/**
 * Export scenarios to JSON
 */
export async function exportScenarios(filter?: ScenarioFilter): Promise<string> {
    const scenarios = await getScenarios(filter);
    return JSON.stringify(scenarios, null, 2);
}

/**
 * Import scenarios from JSON
 */
export async function importScenarios(
    json: string,
    options?: { overwrite?: boolean }
): Promise<{ imported: number; skipped: number }> {
    const scenarios: SavedScenario[] = JSON.parse(json);
    let imported = 0;
    let skipped = 0;

    for (const scenario of scenarios) {
        const existing = await getScenario(scenario.id);

        if (existing && !options?.overwrite) {
            skipped++;
            continue;
        }

        await saveScenario(scenario);
        imported++;
    }

    return { imported, skipped };
}

// ============================================================================
// Default Scenarios (Templates)
// ============================================================================

export const SCENARIO_TEMPLATES: Array<Omit<SavedScenario, 'id' | 'createdAt' | 'updatedAt'>> = [
    {
        name: 'Retention Improvement +10%',
        description: 'What if we improve D1-D30 retention by 10%?',
        baselineMetrics: {
            dau: 10000,
            mau: 50000,
            retention: { d1: 0.40, d7: 0.20, d30: 0.10 },
            arpu: 0.50,
            arppu: 15.00,
            conversionRate: 0.03,
            avgRevenuePerPurchase: 4.99,
            avgSessionLength: 12,
            sessionsPerDau: 2.5,
        },
        modifications: { retentionChange: 0.10 },
        timeHorizon: 30,
        dailyNewUsers: 1000,
        tags: ['retention', 'template'],
        isFavorite: false,
    },
    {
        name: 'Conversion Rate +20%',
        description: 'What if we improve free-to-paid conversion by 20%?',
        baselineMetrics: {
            dau: 10000,
            mau: 50000,
            retention: { d1: 0.40, d7: 0.20, d30: 0.10 },
            arpu: 0.50,
            arppu: 15.00,
            conversionRate: 0.03,
            avgRevenuePerPurchase: 4.99,
            avgSessionLength: 12,
            sessionsPerDau: 2.5,
        },
        modifications: { conversionChange: 0.20 },
        timeHorizon: 30,
        dailyNewUsers: 1000,
        tags: ['monetization', 'template'],
        isFavorite: false,
    },
    {
        name: 'Marketing Campaign',
        description: 'What if we run a campaign that increases DAU by 50%?',
        baselineMetrics: {
            dau: 10000,
            mau: 50000,
            retention: { d1: 0.40, d7: 0.20, d30: 0.10 },
            arpu: 0.50,
            arppu: 15.00,
            conversionRate: 0.03,
            avgRevenuePerPurchase: 4.99,
            avgSessionLength: 12,
            sessionsPerDau: 2.5,
        },
        modifications: { dauChange: 0.50 },
        timeHorizon: 30,
        dailyNewUsers: 1500,
        tags: ['marketing', 'template'],
        isFavorite: false,
    },
    {
        name: 'Combined Optimization',
        description: 'Retention +5%, Conversion +10%, ARPU +15%',
        baselineMetrics: {
            dau: 10000,
            mau: 50000,
            retention: { d1: 0.40, d7: 0.20, d30: 0.10 },
            arpu: 0.50,
            arppu: 15.00,
            conversionRate: 0.03,
            avgRevenuePerPurchase: 4.99,
            avgSessionLength: 12,
            sessionsPerDau: 2.5,
        },
        modifications: {
            retentionChange: 0.05,
            conversionChange: 0.10,
            arpuChange: 0.15,
        },
        timeHorizon: 30,
        dailyNewUsers: 1000,
        tags: ['optimization', 'template'],
        isFavorite: false,
    },
];

/**
 * Initialize default scenario templates for a game
 */
export async function initializeTemplates(gameId: string): Promise<SavedScenario[]> {
    const savedScenarios: SavedScenario[] = [];

    for (const template of SCENARIO_TEMPLATES) {
        const scenario = await saveScenario({
            ...template,
            gameId,
        });
        savedScenarios.push(scenario);
    }

    return savedScenarios;
}
