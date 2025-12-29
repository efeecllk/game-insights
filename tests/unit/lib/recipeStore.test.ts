/**
 * Recipe Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    saveRecipe,
    getAllRecipes,
    getRecipe,
    deleteRecipe,
    getRecipesByIntegrationType,
    getRecipesByDifficulty,
    createRecipe,
    incrementRecipeViews,
    markRecipeHelpful,
    initializeStarterRecipes,
    getDifficultyColor,
    getDifficultyLabel,
    STARTER_RECIPES,
    type IntegrationRecipe,
    type RecipeStep,
    type RecipeDifficulty,
} from '../../../src/lib/recipeStore';

// Mock the db module
vi.mock('../../../src/lib/db', () => ({
    dbPut: vi.fn().mockResolvedValue(undefined),
    dbGetAll: vi.fn().mockResolvedValue([]),
    dbGet: vi.fn().mockResolvedValue(undefined),
    dbDelete: vi.fn().mockResolvedValue(undefined),
    generateId: vi.fn().mockReturnValue('recipe-id-123'),
}));

import { dbPut, dbGetAll, dbGet, dbDelete } from '../../../src/lib/db';

describe('recipeStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('IndexedDB operations', () => {
        const mockRecipe: IntegrationRecipe = {
            id: 'recipe-1',
            title: 'Test Recipe',
            description: 'A test recipe',
            author: 'Test Author',
            version: '1.0.0',
            integrationType: 'google_sheets',
            gameTypes: ['puzzle'],
            steps: [{ order: 1, title: 'Step 1', description: 'Do something' }],
            prerequisites: ['Requirement 1'],
            troubleshooting: [{ problem: 'Issue', solution: 'Fix it' }],
            difficulty: 'beginner',
            estimatedTime: '10 minutes',
            tags: ['test'],
            verified: true,
            views: 100,
            helpful: 80,
            notHelpful: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };

        it('should save recipe to database', async () => {
            await saveRecipe(mockRecipe);
            expect(dbPut).toHaveBeenCalledWith('recipes', mockRecipe);
        });

        it('should get all recipes', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockRecipe]);
            const recipes = await getAllRecipes();
            expect(recipes).toEqual([mockRecipe]);
            expect(dbGetAll).toHaveBeenCalledWith('recipes');
        });

        it('should get recipe by ID', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(mockRecipe);
            const recipe = await getRecipe('recipe-1');
            expect(recipe).toEqual(mockRecipe);
            expect(dbGet).toHaveBeenCalledWith('recipes', 'recipe-1');
        });

        it('should return undefined for non-existent recipe', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);
            const recipe = await getRecipe('non-existent');
            expect(recipe).toBeUndefined();
        });

        it('should delete recipe', async () => {
            await deleteRecipe('recipe-1');
            expect(dbDelete).toHaveBeenCalledWith('recipes', 'recipe-1');
        });

        it('should get recipes by integration type', async () => {
            const recipes = [
                { ...mockRecipe, id: '1', integrationType: 'google_sheets' as const },
                { ...mockRecipe, id: '2', integrationType: 'firebase' as const },
                { ...mockRecipe, id: '3', integrationType: 'google_sheets' as const },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(recipes);

            const filtered = await getRecipesByIntegrationType('google_sheets');
            expect(filtered.length).toBe(2);
        });

        it('should get recipes by difficulty', async () => {
            const recipes = [
                { ...mockRecipe, id: '1', difficulty: 'beginner' as const },
                { ...mockRecipe, id: '2', difficulty: 'intermediate' as const },
                { ...mockRecipe, id: '3', difficulty: 'beginner' as const },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(recipes);

            const filtered = await getRecipesByDifficulty('beginner');
            expect(filtered.length).toBe(2);
        });
    });

    describe('createRecipe', () => {
        const sampleSteps: RecipeStep[] = [
            { order: 1, title: 'Step 1', description: 'First step' },
            { order: 2, title: 'Step 2', description: 'Second step' },
        ];

        it('should create recipe with required fields', () => {
            const recipe = createRecipe('Test Recipe', 'A test recipe', 'google_sheets', sampleSteps);

            expect(recipe.id).toBe('recipe-id-123');
            expect(recipe.title).toBe('Test Recipe');
            expect(recipe.description).toBe('A test recipe');
            expect(recipe.integrationType).toBe('google_sheets');
            expect(recipe.steps).toEqual(sampleSteps);
        });

        it('should set default author to Anonymous', () => {
            const recipe = createRecipe('Test', 'Desc', 'firebase', sampleSteps);
            expect(recipe.author).toBe('Anonymous');
        });

        it('should set default version to 1.0.0', () => {
            const recipe = createRecipe('Test', 'Desc', 'firebase', sampleSteps);
            expect(recipe.version).toBe('1.0.0');
        });

        it('should set default game types to custom', () => {
            const recipe = createRecipe('Test', 'Desc', 'firebase', sampleSteps);
            expect(recipe.gameTypes).toEqual(['custom']);
        });

        it('should set default difficulty to intermediate', () => {
            const recipe = createRecipe('Test', 'Desc', 'firebase', sampleSteps);
            expect(recipe.difficulty).toBe('intermediate');
        });

        it('should set default estimated time to 15 minutes', () => {
            const recipe = createRecipe('Test', 'Desc', 'firebase', sampleSteps);
            expect(recipe.estimatedTime).toBe('15 minutes');
        });

        it('should initialize stats to zero', () => {
            const recipe = createRecipe('Test', 'Desc', 'firebase', sampleSteps);
            expect(recipe.views).toBe(0);
            expect(recipe.helpful).toBe(0);
            expect(recipe.notHelpful).toBe(0);
            expect(recipe.verified).toBe(false);
        });

        it('should set timestamps', () => {
            const recipe = createRecipe('Test', 'Desc', 'firebase', sampleSteps);
            expect(recipe.createdAt).toBeDefined();
            expect(recipe.updatedAt).toBeDefined();
        });

        it('should allow custom options', () => {
            const recipe = createRecipe('Test', 'Desc', 'firebase', sampleSteps, {
                author: 'John Doe',
                gameTypes: ['puzzle', 'idle'],
                prerequisites: ['Node.js', 'Firebase account'],
                difficulty: 'advanced',
                estimatedTime: '30 minutes',
                tags: ['firebase', 'mobile'],
            });

            expect(recipe.author).toBe('John Doe');
            expect(recipe.gameTypes).toEqual(['puzzle', 'idle']);
            expect(recipe.prerequisites).toEqual(['Node.js', 'Firebase account']);
            expect(recipe.difficulty).toBe('advanced');
            expect(recipe.estimatedTime).toBe('30 minutes');
            expect(recipe.tags).toEqual(['firebase', 'mobile']);
        });
    });

    describe('incrementRecipeViews', () => {
        it('should increment views count', async () => {
            const recipe = {
                id: 'recipe-1',
                views: 100,
            };
            vi.mocked(dbGet).mockResolvedValueOnce(recipe as any);

            await incrementRecipeViews('recipe-1');

            expect(dbPut).toHaveBeenCalledWith('recipes', expect.objectContaining({
                views: 101,
            }));
        });

        it('should not update if recipe not found', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);
            await incrementRecipeViews('non-existent');
            expect(dbPut).not.toHaveBeenCalled();
        });
    });

    describe('markRecipeHelpful', () => {
        it('should increment helpful count when marked helpful', async () => {
            const recipe = {
                id: 'recipe-1',
                helpful: 50,
                notHelpful: 5,
            };
            vi.mocked(dbGet).mockResolvedValueOnce(recipe as any);

            await markRecipeHelpful('recipe-1', true);

            expect(dbPut).toHaveBeenCalledWith('recipes', expect.objectContaining({
                helpful: 51,
                notHelpful: 5,
            }));
        });

        it('should increment notHelpful count when marked not helpful', async () => {
            const recipe = {
                id: 'recipe-1',
                helpful: 50,
                notHelpful: 5,
            };
            vi.mocked(dbGet).mockResolvedValueOnce(recipe as any);

            await markRecipeHelpful('recipe-1', false);

            expect(dbPut).toHaveBeenCalledWith('recipes', expect.objectContaining({
                helpful: 50,
                notHelpful: 6,
            }));
        });

        it('should not update if recipe not found', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);
            await markRecipeHelpful('non-existent', true);
            expect(dbPut).not.toHaveBeenCalled();
        });
    });

    describe('initializeStarterRecipes', () => {
        it('should add recipes that do not exist', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([]);
            await initializeStarterRecipes();
            expect(dbPut).toHaveBeenCalledTimes(STARTER_RECIPES.length);
        });

        it('should not add recipes that already exist', async () => {
            const existingRecipes = STARTER_RECIPES.map(r => ({ id: r.id }));
            vi.mocked(dbGetAll).mockResolvedValueOnce(existingRecipes as any);

            await initializeStarterRecipes();
            expect(dbPut).not.toHaveBeenCalled();
        });

        it('should only add missing recipes', async () => {
            const existingRecipes = [{ id: STARTER_RECIPES[0].id }];
            vi.mocked(dbGetAll).mockResolvedValueOnce(existingRecipes as any);

            await initializeStarterRecipes();
            expect(dbPut).toHaveBeenCalledTimes(STARTER_RECIPES.length - 1);
        });
    });

    describe('getDifficultyColor', () => {
        it('should return green for beginner', () => {
            expect(getDifficultyColor('beginner')).toBe('text-green-500');
        });

        it('should return yellow for intermediate', () => {
            expect(getDifficultyColor('intermediate')).toBe('text-yellow-500');
        });

        it('should return red for advanced', () => {
            expect(getDifficultyColor('advanced')).toBe('text-red-500');
        });

        it('should return gray for unknown difficulty', () => {
            expect(getDifficultyColor('unknown' as RecipeDifficulty)).toBe('text-gray-500');
        });
    });

    describe('getDifficultyLabel', () => {
        it('should return Beginner for beginner', () => {
            expect(getDifficultyLabel('beginner')).toBe('Beginner');
        });

        it('should return Intermediate for intermediate', () => {
            expect(getDifficultyLabel('intermediate')).toBe('Intermediate');
        });

        it('should return Advanced for advanced', () => {
            expect(getDifficultyLabel('advanced')).toBe('Advanced');
        });

        it('should return Unknown for unknown difficulty', () => {
            expect(getDifficultyLabel('unknown' as RecipeDifficulty)).toBe('Unknown');
        });
    });

    describe('STARTER_RECIPES', () => {
        it('should have multiple starter recipes', () => {
            expect(STARTER_RECIPES.length).toBeGreaterThan(0);
        });

        it('should have all required fields for each recipe', () => {
            STARTER_RECIPES.forEach(recipe => {
                expect(recipe.id).toBeDefined();
                expect(recipe.title).toBeDefined();
                expect(recipe.description).toBeDefined();
                expect(recipe.author).toBeDefined();
                expect(recipe.integrationType).toBeDefined();
                expect(recipe.steps.length).toBeGreaterThan(0);
                expect(recipe.difficulty).toBeDefined();
            });
        });

        it('should have verified recipes', () => {
            const verifiedRecipes = STARTER_RECIPES.filter(r => r.verified);
            expect(verifiedRecipes.length).toBe(STARTER_RECIPES.length);
        });

        it('should have recipes for different integration types', () => {
            const types = new Set(STARTER_RECIPES.map(r => r.integrationType));
            expect(types.size).toBeGreaterThan(1);
        });

        it('should have Google Sheets recipe', () => {
            const googleSheets = STARTER_RECIPES.find(r => r.integrationType === 'google_sheets');
            expect(googleSheets).toBeDefined();
        });

        it('should have Firebase recipe', () => {
            const firebase = STARTER_RECIPES.find(r => r.integrationType === 'firebase');
            expect(firebase).toBeDefined();
        });

        it('should have Supabase recipe', () => {
            const supabase = STARTER_RECIPES.find(r => r.integrationType === 'supabase');
            expect(supabase).toBeDefined();
        });

        it('should have webhook recipe', () => {
            const webhook = STARTER_RECIPES.find(r => r.integrationType === 'webhook');
            expect(webhook).toBeDefined();
        });

        it('should have recipes with troubleshooting', () => {
            const withTroubleshooting = STARTER_RECIPES.filter(r => r.troubleshooting.length > 0);
            expect(withTroubleshooting.length).toBeGreaterThan(0);
        });

        it('should have recipes with prerequisites', () => {
            const withPrereqs = STARTER_RECIPES.filter(r => r.prerequisites.length > 0);
            expect(withPrereqs.length).toBeGreaterThan(0);
        });

        it('should have recipes with code examples', () => {
            const withCode = STARTER_RECIPES.filter(r =>
                r.steps.some(s => s.code !== undefined)
            );
            expect(withCode.length).toBeGreaterThan(0);
        });

        it('should have recipes covering all difficulty levels', () => {
            const difficulties = new Set(STARTER_RECIPES.map(r => r.difficulty));
            expect(difficulties.has('beginner')).toBe(true);
            expect(difficulties.has('intermediate')).toBe(true);
        });
    });

    describe('Recipe step structure', () => {
        it('should have sequential order in steps', () => {
            STARTER_RECIPES.forEach(recipe => {
                recipe.steps.forEach((step, index) => {
                    expect(step.order).toBe(index + 1);
                });
            });
        });

        it('should have title and description for all steps', () => {
            STARTER_RECIPES.forEach(recipe => {
                recipe.steps.forEach(step => {
                    expect(step.title).toBeDefined();
                    expect(step.title.length).toBeGreaterThan(0);
                    expect(step.description).toBeDefined();
                    expect(step.description.length).toBeGreaterThan(0);
                });
            });
        });

        it('should have valid code languages when code is present', () => {
            const validLanguages = ['javascript', 'typescript', 'json', 'sql', 'bash', 'yaml'];
            STARTER_RECIPES.forEach(recipe => {
                recipe.steps.forEach(step => {
                    if (step.code && step.codeLanguage) {
                        expect(validLanguages).toContain(step.codeLanguage);
                    }
                });
            });
        });
    });
});
