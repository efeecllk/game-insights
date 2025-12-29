/**
 * Dashboard Store Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    saveDashboard,
    getDashboard,
    getAllDashboards,
    deleteDashboard,
    duplicateDashboard,
    createDashboard,
    createWidget,
    initializeDefaultDashboards,
    getMockMetricValue,
    getMockChartData,
    WIDGET_PRESETS,
    METRIC_OPTIONS,
    DEFAULT_DASHBOARDS,
    type Dashboard,
    type DashboardWidget,
    type WidgetType,
    type MetricType,
} from '../../../src/lib/dashboardStore';

// Mock the db module
vi.mock('../../../src/lib/db', () => ({
    dbPut: vi.fn().mockResolvedValue(undefined),
    dbGetAll: vi.fn().mockResolvedValue([]),
    dbGet: vi.fn().mockResolvedValue(undefined),
    dbDelete: vi.fn().mockResolvedValue(undefined),
    generateId: vi.fn().mockReturnValue('dashboard-id-123'),
}));

import { dbPut, dbGetAll, dbGet, dbDelete } from '../../../src/lib/db';

describe('dashboardStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('IndexedDB operations', () => {
        const mockDashboard: Dashboard = {
            id: 'dash-1',
            name: 'Test Dashboard',
            description: 'A test dashboard',
            icon: '📊',
            widgets: [],
            columns: 12,
            rowHeight: 80,
            theme: 'system',
            autoRefresh: false,
            refreshInterval: 300,
            isDefault: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };

        it('should save dashboard to database', async () => {
            await saveDashboard(mockDashboard);
            expect(dbPut).toHaveBeenCalledWith('dashboards', expect.objectContaining({
                id: 'dash-1',
                updatedAt: expect.any(String),
            }));
        });

        it('should update updatedAt when saving', async () => {
            const oldDate = '2024-01-01T00:00:00Z';
            const dashboard = { ...mockDashboard, updatedAt: oldDate };
            await saveDashboard(dashboard);

            expect(dbPut).toHaveBeenCalledWith('dashboards', expect.objectContaining({
                updatedAt: expect.not.stringMatching(oldDate),
            }));
        });

        it('should get dashboard by ID', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(mockDashboard);
            const dashboard = await getDashboard('dash-1');
            expect(dashboard).toEqual(mockDashboard);
            expect(dbGet).toHaveBeenCalledWith('dashboards', 'dash-1');
        });

        it('should return undefined for non-existent dashboard', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);
            const dashboard = await getDashboard('non-existent');
            expect(dashboard).toBeUndefined();
        });

        it('should get all dashboards', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([mockDashboard]);
            const dashboards = await getAllDashboards();
            expect(dashboards).toEqual([mockDashboard]);
            expect(dbGetAll).toHaveBeenCalledWith('dashboards');
        });

        it('should delete dashboard', async () => {
            await deleteDashboard('dash-1');
            expect(dbDelete).toHaveBeenCalledWith('dashboards', 'dash-1');
        });
    });

    describe('duplicateDashboard', () => {
        const originalDashboard: Dashboard = {
            id: 'original-1',
            name: 'Original Dashboard',
            description: 'Original description',
            icon: '📊',
            widgets: [
                { id: 'w1', type: 'kpi', position: { x: 0, y: 0, w: 3, h: 2 }, config: {} },
            ],
            columns: 12,
            rowHeight: 80,
            theme: 'dark',
            autoRefresh: true,
            refreshInterval: 60,
            isDefault: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            lastViewedAt: '2024-01-15T00:00:00Z',
        };

        it('should return undefined if original not found', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(undefined);
            const result = await duplicateDashboard('non-existent', 'New Name');
            expect(result).toBeUndefined();
        });

        it('should create duplicate with new ID', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(originalDashboard);
            const result = await duplicateDashboard('original-1', 'Duplicate Dashboard');

            expect(result?.id).toBe('dashboard-id-123');
            expect(result?.id).not.toBe(originalDashboard.id);
        });

        it('should use new name for duplicate', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(originalDashboard);
            const result = await duplicateDashboard('original-1', 'New Dashboard Name');

            expect(result?.name).toBe('New Dashboard Name');
        });

        it('should set isDefault to false for duplicate', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(originalDashboard);
            const result = await duplicateDashboard('original-1', 'Duplicate');

            expect(result?.isDefault).toBe(false);
        });

        it('should clear lastViewedAt for duplicate', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(originalDashboard);
            const result = await duplicateDashboard('original-1', 'Duplicate');

            expect(result?.lastViewedAt).toBeUndefined();
        });

        it('should copy widgets from original', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(originalDashboard);
            const result = await duplicateDashboard('original-1', 'Duplicate');

            expect(result?.widgets.length).toBe(originalDashboard.widgets.length);
        });

        it('should copy settings from original', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(originalDashboard);
            const result = await duplicateDashboard('original-1', 'Duplicate');

            expect(result?.theme).toBe(originalDashboard.theme);
            expect(result?.autoRefresh).toBe(originalDashboard.autoRefresh);
            expect(result?.refreshInterval).toBe(originalDashboard.refreshInterval);
        });

        it('should save duplicate to database', async () => {
            vi.mocked(dbGet).mockResolvedValueOnce(originalDashboard);
            await duplicateDashboard('original-1', 'Duplicate');

            expect(dbPut).toHaveBeenCalledWith('dashboards', expect.objectContaining({
                name: 'Duplicate',
            }));
        });
    });

    describe('createDashboard', () => {
        it('should create dashboard with required name', () => {
            const dashboard = createDashboard('My Dashboard');

            expect(dashboard.id).toBe('dashboard-id-123');
            expect(dashboard.name).toBe('My Dashboard');
        });

        it('should set default icon', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.icon).toBe('📊');
        });

        it('should set empty widgets array', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.widgets).toEqual([]);
        });

        it('should set default columns to 12', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.columns).toBe(12);
        });

        it('should set default rowHeight to 80', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.rowHeight).toBe(80);
        });

        it('should set default theme to system', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.theme).toBe('system');
        });

        it('should set autoRefresh to false by default', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.autoRefresh).toBe(false);
        });

        it('should set default refreshInterval to 300', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.refreshInterval).toBe(300);
        });

        it('should set isDefault to false by default', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.isDefault).toBe(false);
        });

        it('should set timestamps', () => {
            const dashboard = createDashboard('Test');
            expect(dashboard.createdAt).toBeDefined();
            expect(dashboard.updatedAt).toBeDefined();
        });

        it('should allow custom options', () => {
            const dashboard = createDashboard('Custom Dashboard', {
                description: 'Custom description',
                icon: '🚀',
                columns: 16,
                rowHeight: 100,
                theme: 'dark',
                autoRefresh: true,
                refreshInterval: 60,
                isDefault: true,
            });

            expect(dashboard.description).toBe('Custom description');
            expect(dashboard.icon).toBe('🚀');
            expect(dashboard.columns).toBe(16);
            expect(dashboard.rowHeight).toBe(100);
            expect(dashboard.theme).toBe('dark');
            expect(dashboard.autoRefresh).toBe(true);
            expect(dashboard.refreshInterval).toBe(60);
            expect(dashboard.isDefault).toBe(true);
        });

        it('should allow preset widgets', () => {
            const widgets: DashboardWidget[] = [
                { id: 'w1', type: 'kpi', position: { x: 0, y: 0, w: 3, h: 2 }, config: {} },
                { id: 'w2', type: 'line_chart', position: { x: 3, y: 0, w: 6, h: 4 }, config: {} },
            ];

            const dashboard = createDashboard('Test', { widgets });
            expect(dashboard.widgets.length).toBe(2);
        });
    });

    describe('createWidget', () => {
        it('should create widget with required fields', () => {
            const widget = createWidget('kpi', { x: 0, y: 0, w: 3, h: 2 });

            expect(widget.id).toBe('dashboard-id-123');
            expect(widget.type).toBe('kpi');
            expect(widget.position).toEqual({ x: 0, y: 0, w: 3, h: 2 });
        });

        it('should set empty config by default', () => {
            const widget = createWidget('line_chart', { x: 0, y: 0, w: 6, h: 4 });
            expect(widget.config).toEqual({});
        });

        it('should allow custom config', () => {
            const config = {
                metric: 'dau' as MetricType,
                title: 'Daily Active Users',
                showTrend: true,
            };

            const widget = createWidget('kpi', { x: 0, y: 0, w: 3, h: 2 }, config);
            expect(widget.config).toEqual(config);
        });
    });

    describe('WIDGET_PRESETS', () => {
        it('should have presets for all widget types', () => {
            const expectedTypes: WidgetType[] = ['kpi', 'line_chart', 'bar_chart', 'pie_chart', 'area_chart', 'table', 'funnel', 'cohort', 'text'];

            expectedTypes.forEach(type => {
                expect(WIDGET_PRESETS[type]).toBeDefined();
            });
        });

        it('should have name for each preset', () => {
            Object.values(WIDGET_PRESETS).forEach(preset => {
                expect(preset.name).toBeDefined();
                expect(preset.name.length).toBeGreaterThan(0);
            });
        });

        it('should have icon for each preset', () => {
            Object.values(WIDGET_PRESETS).forEach(preset => {
                expect(preset.icon).toBeDefined();
            });
        });

        it('should have defaultSize for each preset', () => {
            Object.values(WIDGET_PRESETS).forEach(preset => {
                expect(preset.defaultSize.w).toBeGreaterThan(0);
                expect(preset.defaultSize.h).toBeGreaterThan(0);
            });
        });

        it('should have description for each preset', () => {
            Object.values(WIDGET_PRESETS).forEach(preset => {
                expect(preset.description).toBeDefined();
            });
        });
    });

    describe('METRIC_OPTIONS', () => {
        it('should have multiple metric options', () => {
            expect(METRIC_OPTIONS.length).toBeGreaterThan(0);
        });

        it('should have value, label, and format for each option', () => {
            METRIC_OPTIONS.forEach(option => {
                expect(option.value).toBeDefined();
                expect(option.label).toBeDefined();
                expect(option.format).toBeDefined();
            });
        });

        it('should include essential metrics', () => {
            const values = METRIC_OPTIONS.map(o => o.value);
            expect(values).toContain('dau');
            expect(values).toContain('revenue');
            expect(values).toContain('d7_retention');
            expect(values).toContain('arpu');
        });

        it('should have correct formats for metrics', () => {
            const dau = METRIC_OPTIONS.find(o => o.value === 'dau');
            expect(dau?.format).toBe('number');

            const revenue = METRIC_OPTIONS.find(o => o.value === 'revenue');
            expect(revenue?.format).toBe('currency');

            const retention = METRIC_OPTIONS.find(o => o.value === 'd7_retention');
            expect(retention?.format).toBe('percent');
        });
    });

    describe('DEFAULT_DASHBOARDS', () => {
        it('should have multiple default dashboards', () => {
            expect(DEFAULT_DASHBOARDS.length).toBeGreaterThan(0);
        });

        it('should have an Overview dashboard', () => {
            const overview = DEFAULT_DASHBOARDS.find(d => d.name === 'Overview');
            expect(overview).toBeDefined();
        });

        it('should have one default dashboard marked as isDefault', () => {
            const defaults = DEFAULT_DASHBOARDS.filter(d => d.isDefault);
            expect(defaults.length).toBe(1);
        });

        it('should have widgets in default dashboards', () => {
            DEFAULT_DASHBOARDS.forEach(dashboard => {
                expect(dashboard.widgets.length).toBeGreaterThan(0);
            });
        });

        it('should have Overview with KPI widgets', () => {
            const overview = DEFAULT_DASHBOARDS.find(d => d.name === 'Overview');
            const kpis = overview?.widgets.filter(w => w.type === 'kpi');
            expect(kpis?.length).toBeGreaterThan(0);
        });
    });

    describe('initializeDefaultDashboards', () => {
        it('should not create dashboards if dashboards already exist', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([{ id: 'existing' }] as any);
            await initializeDefaultDashboards();
            expect(dbPut).not.toHaveBeenCalled();
        });

        it('should create default dashboards if none exist', async () => {
            vi.mocked(dbGetAll).mockResolvedValueOnce([]);
            await initializeDefaultDashboards();
            expect(dbPut).toHaveBeenCalledTimes(DEFAULT_DASHBOARDS.length);
        });
    });

    describe('getMockMetricValue', () => {
        it('should return value and change for dau', () => {
            const result = getMockMetricValue('dau');
            expect(result.value).toBeDefined();
            expect(result.change).toBeDefined();
        });

        it('should return value and change for revenue', () => {
            const result = getMockMetricValue('revenue');
            expect(result.value).toBeGreaterThan(0);
        });

        it('should return value and change for retention metrics', () => {
            const d1 = getMockMetricValue('d1_retention');
            const d7 = getMockMetricValue('d7_retention');
            const d30 = getMockMetricValue('d30_retention');

            expect(d1.value).toBeGreaterThan(0);
            expect(d7.value).toBeGreaterThan(0);
            expect(d30.value).toBeGreaterThan(0);
        });

        it('should return zeros for custom metric', () => {
            const result = getMockMetricValue('custom');
            expect(result.value).toBe(0);
            expect(result.change).toBe(0);
        });

        it('should return zeros for unknown metric', () => {
            const result = getMockMetricValue('unknown' as MetricType);
            expect(result.value).toBe(0);
        });
    });

    describe('getMockChartData', () => {
        it('should return data for specified number of days', () => {
            const data = getMockChartData('dau', 7);
            expect(data.length).toBe(7);
        });

        it('should default to 30 days', () => {
            const data = getMockChartData('dau');
            expect(data.length).toBe(30);
        });

        it('should have date and value for each data point', () => {
            const data = getMockChartData('revenue', 5);
            data.forEach(point => {
                expect(point.date).toBeDefined();
                expect(point.value).toBeDefined();
            });
        });

        it('should have dates in YYYY-MM-DD format', () => {
            const data = getMockChartData('dau', 3);
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            data.forEach(point => {
                expect(point.date).toMatch(dateRegex);
            });
        });

        it('should return values based on metric base value', () => {
            const dauData = getMockChartData('dau', 5);
            const baseValue = getMockMetricValue('dau').value;

            // Values should be in a reasonable range around the base
            dauData.forEach(point => {
                expect(point.value).toBeGreaterThan(baseValue * 0.5);
                expect(point.value).toBeLessThan(baseValue * 1.5);
            });
        });
    });
});
