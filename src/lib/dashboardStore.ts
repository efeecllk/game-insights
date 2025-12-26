/**
 * Dashboard Store
 * Custom dashboard management for Phase 6
 */

import { dbPut, dbGetAll, dbGet, dbDelete, generateId } from './db';

// ============================================================================
// Types
// ============================================================================

export type WidgetType = 'kpi' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'area_chart' | 'table' | 'funnel' | 'cohort' | 'text';
export type MetricType = 'dau' | 'mau' | 'revenue' | 'd1_retention' | 'd7_retention' | 'd30_retention' | 'arpu' | 'arppu' | 'conversion_rate' | 'session_length' | 'sessions_per_user' | 'custom';

export interface WidgetPosition {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface WidgetConfig {
    metric?: MetricType;
    customMetric?: string;
    title?: string;
    subtitle?: string;
    dateRange?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
    customDateRange?: [string, string];
    comparison?: 'previous_period' | 'previous_year' | 'none';
    format?: 'number' | 'percent' | 'currency';
    decimals?: number;
    showTrend?: boolean;
    chartColor?: string;
    textContent?: string;
}

export interface DashboardWidget {
    id: string;
    type: WidgetType;
    position: WidgetPosition;
    config: WidgetConfig;
}

export interface Dashboard {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    widgets: DashboardWidget[];

    // Layout settings
    columns: number;
    rowHeight: number;

    // Display settings
    theme: 'light' | 'dark' | 'system';
    autoRefresh: boolean;
    refreshInterval: number; // seconds

    // Metadata
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
    lastViewedAt?: string;
}

// ============================================================================
// Store Operations
// ============================================================================

const DASHBOARDS_STORE = 'dashboards';

export async function saveDashboard(dashboard: Dashboard): Promise<void> {
    dashboard.updatedAt = new Date().toISOString();
    return dbPut(DASHBOARDS_STORE, dashboard);
}

export async function getDashboard(id: string): Promise<Dashboard | undefined> {
    return dbGet(DASHBOARDS_STORE, id);
}

export async function getAllDashboards(): Promise<Dashboard[]> {
    return dbGetAll(DASHBOARDS_STORE);
}

export async function deleteDashboard(id: string): Promise<void> {
    return dbDelete(DASHBOARDS_STORE, id);
}

export async function duplicateDashboard(id: string, newName: string): Promise<Dashboard | undefined> {
    const original = await getDashboard(id);
    if (!original) return undefined;

    const now = new Date().toISOString();
    const duplicate: Dashboard = {
        ...original,
        id: generateId(),
        name: newName,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
        lastViewedAt: undefined,
    };

    await saveDashboard(duplicate);
    return duplicate;
}

// ============================================================================
// Dashboard Creation
// ============================================================================

export function createDashboard(name: string, options: Partial<Dashboard> = {}): Dashboard {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        name,
        description: options.description,
        icon: options.icon || '📊',
        widgets: options.widgets || [],
        columns: options.columns || 12,
        rowHeight: options.rowHeight || 80,
        theme: options.theme || 'system',
        autoRefresh: options.autoRefresh || false,
        refreshInterval: options.refreshInterval || 300,
        isDefault: options.isDefault || false,
        createdAt: now,
        updatedAt: now,
    };
}

export function createWidget(
    type: WidgetType,
    position: WidgetPosition,
    config: WidgetConfig = {}
): DashboardWidget {
    return {
        id: generateId(),
        type,
        position,
        config,
    };
}

// ============================================================================
// Widget Presets
// ============================================================================

export const WIDGET_PRESETS: Record<WidgetType, {
    name: string;
    icon: string;
    defaultSize: { w: number; h: number };
    description: string;
}> = {
    kpi: {
        name: 'KPI Card',
        icon: '📈',
        defaultSize: { w: 3, h: 2 },
        description: 'Single metric with trend indicator',
    },
    line_chart: {
        name: 'Line Chart',
        icon: '📉',
        defaultSize: { w: 6, h: 4 },
        description: 'Time series visualization',
    },
    bar_chart: {
        name: 'Bar Chart',
        icon: '📊',
        defaultSize: { w: 6, h: 4 },
        description: 'Compare categories',
    },
    pie_chart: {
        name: 'Pie Chart',
        icon: '🥧',
        defaultSize: { w: 4, h: 4 },
        description: 'Show distribution',
    },
    area_chart: {
        name: 'Area Chart',
        icon: '📈',
        defaultSize: { w: 6, h: 4 },
        description: 'Stacked time series',
    },
    table: {
        name: 'Data Table',
        icon: '📋',
        defaultSize: { w: 6, h: 4 },
        description: 'Detailed data view',
    },
    funnel: {
        name: 'Funnel',
        icon: '🔻',
        defaultSize: { w: 4, h: 4 },
        description: 'Conversion funnel',
    },
    cohort: {
        name: 'Cohort Heatmap',
        icon: '🔥',
        defaultSize: { w: 8, h: 5 },
        description: 'Retention cohort analysis',
    },
    text: {
        name: 'Text Block',
        icon: '📝',
        defaultSize: { w: 4, h: 2 },
        description: 'Add notes or headers',
    },
};

export const METRIC_OPTIONS: { value: MetricType; label: string; format: 'number' | 'percent' | 'currency' }[] = [
    { value: 'dau', label: 'Daily Active Users', format: 'number' },
    { value: 'mau', label: 'Monthly Active Users', format: 'number' },
    { value: 'revenue', label: 'Revenue', format: 'currency' },
    { value: 'd1_retention', label: 'D1 Retention', format: 'percent' },
    { value: 'd7_retention', label: 'D7 Retention', format: 'percent' },
    { value: 'd30_retention', label: 'D30 Retention', format: 'percent' },
    { value: 'arpu', label: 'ARPU', format: 'currency' },
    { value: 'arppu', label: 'ARPPU', format: 'currency' },
    { value: 'conversion_rate', label: 'Conversion Rate', format: 'percent' },
    { value: 'session_length', label: 'Avg Session Length', format: 'number' },
    { value: 'sessions_per_user', label: 'Sessions/User', format: 'number' },
];

// ============================================================================
// Default Dashboards
// ============================================================================

export const DEFAULT_DASHBOARDS: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'Overview',
        description: 'Key metrics at a glance',
        icon: '🏠',
        isDefault: true,
        columns: 12,
        rowHeight: 80,
        theme: 'system',
        autoRefresh: false,
        refreshInterval: 300,
        widgets: [
            {
                id: 'w1',
                type: 'kpi',
                position: { x: 0, y: 0, w: 3, h: 2 },
                config: { metric: 'dau', title: 'DAU', showTrend: true },
            },
            {
                id: 'w2',
                type: 'kpi',
                position: { x: 3, y: 0, w: 3, h: 2 },
                config: { metric: 'revenue', title: 'Revenue', showTrend: true, format: 'currency' },
            },
            {
                id: 'w3',
                type: 'kpi',
                position: { x: 6, y: 0, w: 3, h: 2 },
                config: { metric: 'd7_retention', title: 'D7 Retention', showTrend: true, format: 'percent' },
            },
            {
                id: 'w4',
                type: 'kpi',
                position: { x: 9, y: 0, w: 3, h: 2 },
                config: { metric: 'arpu', title: 'ARPU', showTrend: true, format: 'currency' },
            },
            {
                id: 'w5',
                type: 'line_chart',
                position: { x: 0, y: 2, w: 8, h: 4 },
                config: { metric: 'dau', title: 'DAU Trend', dateRange: 'last_30_days' },
            },
            {
                id: 'w6',
                type: 'pie_chart',
                position: { x: 8, y: 2, w: 4, h: 4 },
                config: { title: 'Revenue Sources' },
            },
            {
                id: 'w7',
                type: 'cohort',
                position: { x: 0, y: 6, w: 8, h: 5 },
                config: { title: 'Retention Cohort' },
            },
            {
                id: 'w8',
                type: 'funnel',
                position: { x: 8, y: 6, w: 4, h: 5 },
                config: { title: 'Conversion Funnel' },
            },
        ],
    },
    {
        name: 'Retention Deep Dive',
        description: 'Detailed retention analysis',
        icon: '🔄',
        isDefault: false,
        columns: 12,
        rowHeight: 80,
        theme: 'system',
        autoRefresh: false,
        refreshInterval: 300,
        widgets: [
            {
                id: 'r1',
                type: 'kpi',
                position: { x: 0, y: 0, w: 4, h: 2 },
                config: { metric: 'd1_retention', title: 'D1 Retention', showTrend: true, format: 'percent' },
            },
            {
                id: 'r2',
                type: 'kpi',
                position: { x: 4, y: 0, w: 4, h: 2 },
                config: { metric: 'd7_retention', title: 'D7 Retention', showTrend: true, format: 'percent' },
            },
            {
                id: 'r3',
                type: 'kpi',
                position: { x: 8, y: 0, w: 4, h: 2 },
                config: { metric: 'd30_retention', title: 'D30 Retention', showTrend: true, format: 'percent' },
            },
            {
                id: 'r4',
                type: 'cohort',
                position: { x: 0, y: 2, w: 12, h: 6 },
                config: { title: 'Retention Cohort Heatmap' },
            },
            {
                id: 'r5',
                type: 'line_chart',
                position: { x: 0, y: 8, w: 6, h: 4 },
                config: { title: 'Retention Over Time', metric: 'd7_retention' },
            },
            {
                id: 'r6',
                type: 'bar_chart',
                position: { x: 6, y: 8, w: 6, h: 4 },
                config: { title: 'Retention by Cohort' },
            },
        ],
    },
    {
        name: 'Revenue Analytics',
        description: 'Monetization metrics',
        icon: '💰',
        isDefault: false,
        columns: 12,
        rowHeight: 80,
        theme: 'system',
        autoRefresh: false,
        refreshInterval: 300,
        widgets: [
            {
                id: 'm1',
                type: 'kpi',
                position: { x: 0, y: 0, w: 3, h: 2 },
                config: { metric: 'revenue', title: 'Total Revenue', showTrend: true, format: 'currency' },
            },
            {
                id: 'm2',
                type: 'kpi',
                position: { x: 3, y: 0, w: 3, h: 2 },
                config: { metric: 'arpu', title: 'ARPU', showTrend: true, format: 'currency' },
            },
            {
                id: 'm3',
                type: 'kpi',
                position: { x: 6, y: 0, w: 3, h: 2 },
                config: { metric: 'arppu', title: 'ARPPU', showTrend: true, format: 'currency' },
            },
            {
                id: 'm4',
                type: 'kpi',
                position: { x: 9, y: 0, w: 3, h: 2 },
                config: { metric: 'conversion_rate', title: 'Conversion Rate', showTrend: true, format: 'percent' },
            },
            {
                id: 'm5',
                type: 'area_chart',
                position: { x: 0, y: 2, w: 8, h: 4 },
                config: { title: 'Revenue Trend', metric: 'revenue' },
            },
            {
                id: 'm6',
                type: 'pie_chart',
                position: { x: 8, y: 2, w: 4, h: 4 },
                config: { title: 'Revenue by Source' },
            },
            {
                id: 'm7',
                type: 'bar_chart',
                position: { x: 0, y: 6, w: 6, h: 4 },
                config: { title: 'Top Products' },
            },
            {
                id: 'm8',
                type: 'table',
                position: { x: 6, y: 6, w: 6, h: 4 },
                config: { title: 'Recent Transactions' },
            },
        ],
    },
];

export async function initializeDefaultDashboards(): Promise<void> {
    const existing = await getAllDashboards();
    if (existing.length > 0) return;

    const now = new Date().toISOString();
    for (const dashDef of DEFAULT_DASHBOARDS) {
        const dashboard: Dashboard = {
            id: generateId(),
            ...dashDef,
            createdAt: now,
            updatedAt: now,
        };
        await saveDashboard(dashboard);
    }
}

// ============================================================================
// Mock Data for Widgets
// ============================================================================

export function getMockMetricValue(metric: MetricType): { value: number; change: number } {
    const mockData: Record<MetricType, { value: number; change: number }> = {
        dau: { value: 12456, change: 12.5 },
        mau: { value: 89234, change: 8.3 },
        revenue: { value: 4250, change: 15.2 },
        d1_retention: { value: 42.5, change: 2.1 },
        d7_retention: { value: 18.3, change: -1.5 },
        d30_retention: { value: 8.7, change: 0.8 },
        arpu: { value: 0.34, change: 5.6 },
        arppu: { value: 12.45, change: 3.2 },
        conversion_rate: { value: 3.2, change: 0.5 },
        session_length: { value: 8.5, change: -2.1 },
        sessions_per_user: { value: 2.3, change: 4.8 },
        custom: { value: 0, change: 0 },
    };
    return mockData[metric] || { value: 0, change: 0 };
}

export function getMockChartData(metric: MetricType, days: number = 30): { date: string; value: number }[] {
    const data: { date: string; value: number }[] = [];
    const baseValue = getMockMetricValue(metric).value;

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variance = (Math.random() - 0.5) * 0.3;
        data.push({
            date: date.toISOString().split('T')[0],
            value: Math.round(baseValue * (1 + variance)),
        });
    }

    return data;
}
