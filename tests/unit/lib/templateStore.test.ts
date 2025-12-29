/**
 * Template Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createTemplate,
    exportDashboardAsTemplate,
    importTemplate,
    serializeTemplate,
    deserializeTemplate,
    validateTemplate,
    saveTemplate,
    getAllTemplates,
    getTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    getTemplatesByGameType,
    getFeaturedTemplates,
    getPopularTemplates,
    incrementDownloads,
    incrementStars,
    decrementStars,
    type DashboardTemplate,
    type TemplateLayout,
    type ColumnRequirement,
} from '../../../src/lib/templateStore';

// Mock the db module
vi.mock('../../../src/lib/db', () => ({
    dbPut: vi.fn().mockResolvedValue(undefined),
    dbGetAll: vi.fn().mockResolvedValue([]),
    dbGet: vi.fn().mockResolvedValue(undefined),
    dbDelete: vi.fn().mockResolvedValue(undefined),
    dbGetByIndex: vi.fn().mockResolvedValue([]),
    generateId: vi.fn().mockReturnValue('test-id-123'),
}));

import { dbPut, dbGetAll, dbGet, dbDelete, dbGetByIndex } from '../../../src/lib/db';

describe('templateStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTemplate', () => {
        const sampleLayout: TemplateLayout = {
            kpis: [],
            mainCharts: [],
            sideCharts: [],
        };

        it('should create a template with required fields', () => {
            const template = createTemplate('Test Template', 'Test description', sampleLayout);

            expect(template.id).toBe('test-id-123');
            expect(template.name).toBe('Test Template');
            expect(template.description).toBe('Test description');
            expect(template.layout).toEqual(sampleLayout);
            expect(template.version).toBe('1.0.0');
        });

        it('should set default author to Anonymous', () => {
            const template = createTemplate('Test', 'Desc', sampleLayout);
            expect(template.author).toBe('Anonymous');
        });

        it('should set default game types to custom', () => {
            const template = createTemplate('Test', 'Desc', sampleLayout);
            expect(template.gameTypes).toEqual(['custom']);
        });

        it('should set default category to general', () => {
            const template = createTemplate('Test', 'Desc', sampleLayout);
            expect(template.category).toBe('general');
        });

        it('should initialize stats to zero', () => {
            const template = createTemplate('Test', 'Desc', sampleLayout);
            expect(template.downloads).toBe(0);
            expect(template.stars).toBe(0);
            expect(template.featured).toBe(false);
            expect(template.verified).toBe(false);
        });

        it('should set timestamps', () => {
            const template = createTemplate('Test', 'Desc', sampleLayout);
            expect(template.createdAt).toBeDefined();
            expect(template.updatedAt).toBeDefined();
        });

        it('should allow custom options', () => {
            const template = createTemplate('Test', 'Desc', sampleLayout, {
                author: 'John Doe',
                gameTypes: ['puzzle', 'idle'],
                requiredColumns: [{ semantic: 'user_id', optional: false }],
                tags: ['retention', 'engagement'],
                category: 'retention',
            });

            expect(template.author).toBe('John Doe');
            expect(template.gameTypes).toEqual(['puzzle', 'idle']);
            expect(template.requiredColumns.length).toBe(1);
            expect(template.tags).toEqual(['retention', 'engagement']);
            expect(template.category).toBe('retention');
        });
    });

    describe('exportDashboardAsTemplate', () => {
        it('should convert dashboard layout to template layout', () => {
            const dashboardLayout = {
                kpis: [
                    { chartType: 'kpi' as const, title: 'DAU', columns: ['dau'], description: 'Daily Active Users', insight: '', priority: 1 },
                ],
                mainCharts: [
                    { chartType: 'line' as const, title: 'Trend', columns: ['date', 'value'], description: 'Trend chart', insight: '', priority: 2 },
                ],
                sideCharts: [],
            };

            const columnMeanings = [
                { column: 'dau', semantic: 'dau', confidence: 0.95 },
                { column: 'date', semantic: 'timestamp', confidence: 0.9 },
            ];

            const template = exportDashboardAsTemplate(dashboardLayout, columnMeanings, {
                name: 'Test Export',
                description: 'Exported template',
            });

            expect(template.name).toBe('Test Export');
            expect(template.layout.kpis.length).toBe(1);
            expect(template.layout.mainCharts.length).toBe(1);
        });

        it('should extract required columns from meanings', () => {
            const dashboardLayout = { kpis: [], mainCharts: [], sideCharts: [] };
            const columnMeanings = [
                { column: 'user_id', semantic: 'user_id', confidence: 0.95 },
                { column: 'revenue', semantic: 'revenue', confidence: 0.85 },
                { column: 'low_conf', semantic: 'unknown', confidence: 0.5 },
            ];

            const template = exportDashboardAsTemplate(dashboardLayout, columnMeanings, {
                name: 'Test',
                description: 'Test',
            });

            // Only columns with confidence >= 0.7 should be included
            expect(template.requiredColumns.length).toBe(2);
        });
    });

    describe('importTemplate', () => {
        const sampleTemplate: DashboardTemplate = {
            id: 'tpl-1',
            name: 'Test Template',
            description: 'Test',
            author: 'Test',
            version: '1.0.0',
            layout: { kpis: [], mainCharts: [], sideCharts: [] },
            gameTypes: ['puzzle'],
            requiredColumns: [
                { semantic: 'user_id', optional: false },
                { semantic: 'revenue', optional: true },
            ],
            tags: [],
            category: 'general',
            downloads: 0,
            stars: 0,
            featured: false,
            verified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        it('should map columns by exact semantic match', () => {
            const availableColumns = [
                { name: 'user_id', semantic: 'user_id', dataType: 'string' },
                { name: 'total_revenue', semantic: 'revenue', dataType: 'number' },
            ];

            const result = importTemplate(sampleTemplate, availableColumns);

            expect(result.success).toBe(true);
            expect(result.mappedColumns.length).toBe(2);
            expect(result.mappedColumns[0].mapped).toBe('user_id');
            expect(result.mappedColumns[0].confidence).toBe(1.0);
        });

        it('should return error when required column is missing', () => {
            const availableColumns = [
                { name: 'other_col', semantic: 'other', dataType: 'string' },
            ];

            const result = importTemplate(sampleTemplate, availableColumns);

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('user_id');
        });

        it('should add warning for optional missing columns', () => {
            const availableColumns = [
                { name: 'user_id', semantic: 'user_id', dataType: 'string' },
            ];

            const result = importTemplate(sampleTemplate, availableColumns);

            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(w => w.includes('revenue'))).toBe(true);
        });

        it('should use fuzzy matching for column names', () => {
            const templateWithSemantics: DashboardTemplate = {
                ...sampleTemplate,
                requiredColumns: [{ semantic: 'revenue', optional: false }],
            };

            const availableColumns = [
                { name: 'total_revenue_usd', dataType: 'number' },
            ];

            const result = importTemplate(templateWithSemantics, availableColumns);

            expect(result.mappedColumns[0].mapped).toBe('total_revenue_usd');
            expect(result.mappedColumns[0].confidence).toBe(0.7);
        });
    });

    describe('serializeTemplate', () => {
        it('should serialize template to JSON string', () => {
            const template = createTemplate('Test', 'Desc', { kpis: [], mainCharts: [], sideCharts: [] });
            const json = serializeTemplate(template);

            expect(typeof json).toBe('string');
            expect(JSON.parse(json)).toEqual(template);
        });
    });

    describe('deserializeTemplate', () => {
        it('should deserialize valid JSON to template', () => {
            const template = createTemplate('Test', 'Desc', { kpis: [], mainCharts: [], sideCharts: [] });
            const json = JSON.stringify(template);

            const result = deserializeTemplate(json);
            expect(result.id).toBe(template.id);
            expect(result.name).toBe(template.name);
        });

        it('should throw error for missing required fields', () => {
            const invalidJson = JSON.stringify({ name: 'Test' });
            expect(() => deserializeTemplate(invalidJson)).toThrow('Invalid template format: missing required fields');
        });

        it('should throw error for incomplete layout', () => {
            const invalidJson = JSON.stringify({
                id: '123',
                name: 'Test',
                layout: { kpis: [] },
            });
            expect(() => deserializeTemplate(invalidJson)).toThrow('Invalid template format: incomplete layout');
        });
    });

    describe('validateTemplate', () => {
        const validTemplate: DashboardTemplate = {
            id: 'tpl-1',
            name: 'Valid Template',
            description: 'A valid template description',
            author: 'Test',
            version: '1.0.0',
            layout: {
                kpis: [{ id: 'kpi-1', name: 'DAU', metric: 'dau', format: 'number' }],
                mainCharts: [],
                sideCharts: [],
            },
            gameTypes: ['puzzle'],
            requiredColumns: [],
            tags: [],
            category: 'general',
            downloads: 0,
            stars: 0,
            featured: false,
            verified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        it('should validate a correct template', () => {
            const result = validateTemplate(validTemplate);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should reject template with short name', () => {
            const invalid = { ...validTemplate, name: 'AB' };
            const result = validateTemplate(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('name'))).toBe(true);
        });

        it('should warn about short description', () => {
            const template = { ...validTemplate, description: 'Short' };
            const result = validateTemplate(template);
            expect(result.warnings.some(w => w.includes('description'))).toBe(true);
        });

        it('should warn about empty game types', () => {
            const template = { ...validTemplate, gameTypes: [] as any };
            const result = validateTemplate(template);
            expect(result.warnings.some(w => w.includes('game types'))).toBe(true);
        });

        it('should reject empty layout', () => {
            const template = {
                ...validTemplate,
                layout: { kpis: [], mainCharts: [], sideCharts: [] },
            };
            const result = validateTemplate(template);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('at least one'))).toBe(true);
        });

        it('should warn about duplicate required column semantics', () => {
            const template = {
                ...validTemplate,
                requiredColumns: [
                    { semantic: 'user_id' as const, optional: false },
                    { semantic: 'user_id' as const, optional: false },
                ],
            };
            const result = validateTemplate(template);
            expect(result.warnings.some(w => w.includes('Duplicate'))).toBe(true);
        });
    });

    describe('IndexedDB operations', () => {
        const mockTemplate: DashboardTemplate = {
            id: 'tpl-1',
            name: 'Test Template',
            description: 'Test',
            author: 'Test',
            version: '1.0.0',
            layout: { kpis: [], mainCharts: [], sideCharts: [] },
            gameTypes: ['puzzle'],
            requiredColumns: [],
            tags: [],
            category: 'retention',
            downloads: 100,
            stars: 50,
            featured: true,
            verified: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };

        it('should save template to database', async () => {
            await saveTemplate(mockTemplate);
            expect(dbPut).toHaveBeenCalledWith('templates', mockTemplate);
        });

        it('should get all templates', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockTemplate]);
            const templates = await getAllTemplates();
            expect(templates).toEqual([mockTemplate]);
            expect(dbGetAll).toHaveBeenCalledWith('templates');
        });

        it('should get template by ID', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(mockTemplate);
            const template = await getTemplate('tpl-1');
            expect(template).toEqual(mockTemplate);
            expect(dbGet).toHaveBeenCalledWith('templates', 'tpl-1');
        });

        it('should delete template', async () => {
            await deleteTemplate('tpl-1');
            expect(dbDelete).toHaveBeenCalledWith('templates', 'tpl-1');
        });

        it('should get templates by category', async () => {
            vi.mocked(dbGetByIndex).mockResolvedValueOnce([mockTemplate]);
            const templates = await getTemplatesByCategory('retention');
            expect(templates).toEqual([mockTemplate]);
            expect(dbGetByIndex).toHaveBeenCalledWith('templates', 'category', 'retention');
        });

        it('should get templates by game type', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockTemplate]);
            const templates = await getTemplatesByGameType('puzzle');
            expect(templates).toEqual([mockTemplate]);
        });

        it('should filter templates that do not match game type', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockTemplate]);
            const templates = await getTemplatesByGameType('idle');
            expect(templates.length).toBe(0);
        });

        it('should get featured templates sorted by downloads', async () => {
            const templates = [
                { ...mockTemplate, id: '1', downloads: 50, featured: true },
                { ...mockTemplate, id: '2', downloads: 200, featured: true },
                { ...mockTemplate, id: '3', downloads: 100, featured: false },
            ];
            vi.mocked(dbGetAll).mockResolvedValueOnce(templates);

            const featured = await getFeaturedTemplates();
            expect(featured.length).toBe(2);
            expect(featured[0].downloads).toBe(200);
        });

        it('should get popular templates with limit', async () => {
            const templates = Array.from({ length: 20 }, (_, i) => ({
                ...mockTemplate,
                id: `tpl-${i}`,
                downloads: i * 10,
            }));
            vi.mocked(dbGetAll).mockResolvedValueOnce(templates);

            const popular = await getPopularTemplates(5);
            expect(popular.length).toBe(5);
            expect(popular[0].downloads).toBe(190);
        });
    });

    describe('incrementDownloads', () => {
        it('should increment downloads count', async () => {
            const template = {
                id: 'tpl-1',
                downloads: 10,
                updatedAt: '2024-01-01T00:00:00Z',
            };
            vi.mocked(dbGet).mockResolvedValueOnce(template as any);

            await incrementDownloads('tpl-1');

            expect(dbPut).toHaveBeenCalledWith('templates', expect.objectContaining({
                downloads: 11,
            }));
        });

        it('should not call save if template not found', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);
            await incrementDownloads('non-existent');
            expect(dbPut).not.toHaveBeenCalled();
        });
    });

    describe('incrementStars', () => {
        it('should increment stars count', async () => {
            const template = { id: 'tpl-1', stars: 5, updatedAt: '' };
            vi.mocked(dbGet).mockResolvedValueOnce(template as any);

            await incrementStars('tpl-1');

            expect(dbPut).toHaveBeenCalledWith('templates', expect.objectContaining({
                stars: 6,
            }));
        });
    });

    describe('decrementStars', () => {
        it('should decrement stars count', async () => {
            const template = { id: 'tpl-1', stars: 5, updatedAt: '' };
            vi.mocked(dbGet).mockResolvedValueOnce(template as any);

            await decrementStars('tpl-1');

            expect(dbPut).toHaveBeenCalledWith('templates', expect.objectContaining({
                stars: 4,
            }));
        });

        it('should not decrement below zero', async () => {
            const template = { id: 'tpl-1', stars: 0, updatedAt: '' };
            vi.mocked(dbGet).mockResolvedValueOnce(template as any);

            await decrementStars('tpl-1');

            expect(dbPut).not.toHaveBeenCalled();
        });
    });
});
