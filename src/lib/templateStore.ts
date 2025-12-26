/**
 * Template Store
 * Manages dashboard templates with IndexedDB persistence
 * Phase 4: Community & Ecosystem
 */

import { dbPut, dbGetAll, dbGet, dbDelete, dbGetByIndex, generateId } from './db';
import type { ChartRecommendation } from '../ai/ChartSelector';
import type { GameCategory } from '../types';

// Dashboard layout type (matches ChartSelector output)
interface DashboardLayout {
    kpis: ChartRecommendation[];
    mainCharts: ChartRecommendation[];
    sideCharts: ChartRecommendation[];
}

// ============================================================================
// Types
// ============================================================================

export type TemplateCategory =
    | 'retention'
    | 'monetization'
    | 'engagement'
    | 'progression'
    | 'acquisition'
    | 'general';

export type SemanticType =
    | 'user_id'
    | 'session_id'
    | 'timestamp'
    | 'event_name'
    | 'revenue'
    | 'currency'
    | 'level'
    | 'score'
    | 'country'
    | 'platform'
    | 'device'
    | 'version'
    | 'retention_day'
    | 'cohort'
    | 'item_id'
    | 'category'
    | 'dau'
    | 'mau'
    | 'arpu'
    | 'ltv'
    | string; // Allow custom semantic types

export interface ColumnRequirement {
    semantic: SemanticType;
    optional: boolean;
    description?: string;
    alternatives?: SemanticType[];
}

export interface KPIConfig {
    id: string;
    name: string;
    metric: string;
    format: 'number' | 'currency' | 'percentage' | 'compact';
    colorScheme?: 'violet' | 'green' | 'blue' | 'orange' | 'red';
    icon?: string;
    description?: string;
}

export interface ChartConfig {
    id: string;
    type: ChartRecommendation['chartType'];
    title: string;
    subtitle?: string;
    xColumn?: string;
    yColumn?: string;
    groupBy?: string;
    filters?: Array<{ column: string; operator: string; value: unknown }>;
    options?: Record<string, unknown>;
}

export interface InsightTemplate {
    id: string;
    type: 'positive' | 'negative' | 'warning' | 'opportunity' | 'neutral';
    category: TemplateCategory;
    title: string;
    template: string; // Template with {variable} placeholders
    requiredMetrics: string[];
    conditions?: Array<{ metric: string; operator: string; value: number }>;
}

export interface TemplateLayout {
    kpis: KPIConfig[];
    mainCharts: ChartConfig[];
    sideCharts: ChartConfig[];
    insights?: InsightTemplate[];
}

export interface DashboardTemplate {
    id: string;
    name: string;
    description: string;
    author: string;
    authorUrl?: string;
    version: string;

    // Content
    layout: TemplateLayout;

    // Metadata
    gameTypes: GameCategory[];
    requiredColumns: ColumnRequirement[];
    optionalColumns?: ColumnRequirement[];
    tags: string[];
    category: TemplateCategory;

    // Community
    downloads: number;
    stars: number;
    featured: boolean;
    verified: boolean;

    // Timestamps
    createdAt: string;
    updatedAt: string;

    // Preview
    previewImage?: string;
    sampleData?: Record<string, unknown>[];
}

export interface TemplateReview {
    id: string;
    templateId: string;
    author: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
    createdAt: string;
}

export interface TemplateImportResult {
    success: boolean;
    template: DashboardTemplate;
    mappedColumns: Array<{
        required: SemanticType;
        mapped: string | null;
        confidence: number;
    }>;
    warnings: string[];
    errors: string[];
}

// ============================================================================
// IndexedDB Operations
// ============================================================================

const STORE_NAME = 'templates';
// const REVIEWS_STORE = 'templateReviews'; // Reserved for future use

export async function saveTemplate(template: DashboardTemplate): Promise<void> {
    return dbPut(STORE_NAME, template);
}

export async function getAllTemplates(): Promise<DashboardTemplate[]> {
    return dbGetAll(STORE_NAME);
}

export async function getTemplate(id: string): Promise<DashboardTemplate | undefined> {
    return dbGet(STORE_NAME, id);
}

export async function deleteTemplate(id: string): Promise<void> {
    return dbDelete(STORE_NAME, id);
}

export async function getTemplatesByCategory(category: TemplateCategory): Promise<DashboardTemplate[]> {
    return dbGetByIndex(STORE_NAME, 'category', category);
}

export async function getTemplatesByGameType(gameType: GameCategory): Promise<DashboardTemplate[]> {
    const all = await getAllTemplates();
    return all.filter(t => t.gameTypes.includes(gameType));
}

export async function getFeaturedTemplates(): Promise<DashboardTemplate[]> {
    const all = await getAllTemplates();
    return all.filter(t => t.featured).sort((a, b) => b.downloads - a.downloads);
}

export async function getPopularTemplates(limit: number = 10): Promise<DashboardTemplate[]> {
    const all = await getAllTemplates();
    return all.sort((a, b) => b.downloads - a.downloads).slice(0, limit);
}

// ============================================================================
// Template Creation
// ============================================================================

export function createTemplate(
    name: string,
    description: string,
    layout: TemplateLayout,
    options: {
        author?: string;
        gameTypes?: GameCategory[];
        requiredColumns?: ColumnRequirement[];
        tags?: string[];
        category?: TemplateCategory;
    } = {}
): DashboardTemplate {
    const now = new Date().toISOString();

    return {
        id: generateId(),
        name,
        description,
        author: options.author || 'Anonymous',
        version: '1.0.0',
        layout,
        gameTypes: options.gameTypes || ['custom'],
        requiredColumns: options.requiredColumns || [],
        tags: options.tags || [],
        category: options.category || 'general',
        downloads: 0,
        stars: 0,
        featured: false,
        verified: false,
        createdAt: now,
        updatedAt: now,
    };
}

// ============================================================================
// Template Export/Import
// ============================================================================

/**
 * Export current dashboard configuration as a template
 */
export function exportDashboardAsTemplate(
    dashboardLayout: DashboardLayout,
    columnMeanings: Array<{ column: string; semantic: string; confidence: number }>,
    metadata: {
        name: string;
        description: string;
        author?: string;
        gameTypes?: GameCategory[];
        tags?: string[];
        category?: TemplateCategory;
    }
): DashboardTemplate {
    // Convert dashboard layout to template layout
    const templateLayout: TemplateLayout = {
        kpis: dashboardLayout.kpis.map((kpi: ChartRecommendation, index: number) => ({
            id: `kpi-${index}`,
            name: kpi.title,
            metric: kpi.columns[0] || 'unknown',
            format: inferFormat(kpi.columns[0] || ''),
            description: kpi.description,
        })),
        mainCharts: dashboardLayout.mainCharts.map((chart: ChartRecommendation, index: number) => ({
            id: `main-${index}`,
            type: chart.chartType,
            title: chart.title,
            subtitle: chart.description,
            xColumn: chart.columns[0],
            yColumn: chart.columns[1],
        })),
        sideCharts: dashboardLayout.sideCharts.map((chart: ChartRecommendation, index: number) => ({
            id: `side-${index}`,
            type: chart.chartType,
            title: chart.title,
            subtitle: chart.description,
            xColumn: chart.columns[0],
            yColumn: chart.columns[1],
        })),
    };

    // Extract required columns from meanings
    const requiredColumns: ColumnRequirement[] = columnMeanings
        .filter(m => m.confidence >= 0.7)
        .map(m => ({
            semantic: m.semantic as SemanticType,
            optional: m.confidence < 0.9,
            description: `Maps to column: ${m.column}`,
        }));

    return createTemplate(metadata.name, metadata.description, templateLayout, {
        author: metadata.author,
        gameTypes: metadata.gameTypes,
        requiredColumns,
        tags: metadata.tags,
        category: metadata.category,
    });
}

/**
 * Import a template and map it to the current data columns
 */
export function importTemplate(
    template: DashboardTemplate,
    availableColumns: Array<{ name: string; semantic?: string; dataType: string }>
): TemplateImportResult {
    const mappedColumns: TemplateImportResult['mappedColumns'] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Map required columns to available columns
    for (const required of template.requiredColumns) {
        const match = findBestColumnMatch(required, availableColumns);

        if (match) {
            mappedColumns.push({
                required: required.semantic,
                mapped: match.column,
                confidence: match.confidence,
            });

            if (match.confidence < 0.8) {
                warnings.push(`Column "${match.column}" mapped to "${required.semantic}" with low confidence (${Math.round(match.confidence * 100)}%)`);
            }
        } else if (required.optional) {
            mappedColumns.push({
                required: required.semantic,
                mapped: null,
                confidence: 0,
            });
            warnings.push(`Optional column "${required.semantic}" not found`);
        } else {
            mappedColumns.push({
                required: required.semantic,
                mapped: null,
                confidence: 0,
            });
            errors.push(`Required column "${required.semantic}" not found in data`);
        }
    }

    return {
        success: errors.length === 0,
        template,
        mappedColumns,
        warnings,
        errors,
    };
}

/**
 * Find the best matching column for a requirement
 */
function findBestColumnMatch(
    requirement: ColumnRequirement,
    columns: Array<{ name: string; semantic?: string; dataType: string }>
): { column: string; confidence: number } | null {
    // First, try exact semantic match
    const exactMatch = columns.find(c => c.semantic === requirement.semantic);
    if (exactMatch) {
        return { column: exactMatch.name, confidence: 1.0 };
    }

    // Try alternative semantic types
    if (requirement.alternatives) {
        for (const alt of requirement.alternatives) {
            const altMatch = columns.find(c => c.semantic === alt);
            if (altMatch) {
                return { column: altMatch.name, confidence: 0.9 };
            }
        }
    }

    // Try fuzzy matching by column name
    const semanticLower = requirement.semantic.toLowerCase().replace(/_/g, '');
    for (const col of columns) {
        const colLower = col.name.toLowerCase().replace(/[_\s-]/g, '');
        if (colLower.includes(semanticLower) || semanticLower.includes(colLower)) {
            return { column: col.name, confidence: 0.7 };
        }
    }

    return null;
}

/**
 * Infer format from metric name
 */
function inferFormat(metric: string): KPIConfig['format'] {
    const lower = metric.toLowerCase();
    if (lower.includes('revenue') || lower.includes('price') || lower.includes('arpu') || lower.includes('ltv')) {
        return 'currency';
    }
    if (lower.includes('rate') || lower.includes('percent') || lower.includes('retention') || lower.includes('conversion')) {
        return 'percentage';
    }
    if (lower.includes('dau') || lower.includes('mau') || lower.includes('users') || lower.includes('count')) {
        return 'compact';
    }
    return 'number';
}

// ============================================================================
// Template Serialization
// ============================================================================

/**
 * Serialize template to JSON for sharing
 */
export function serializeTemplate(template: DashboardTemplate): string {
    return JSON.stringify(template, null, 2);
}

/**
 * Deserialize template from JSON
 */
export function deserializeTemplate(json: string): DashboardTemplate {
    const parsed = JSON.parse(json);

    // Validate required fields
    if (!parsed.id || !parsed.name || !parsed.layout) {
        throw new Error('Invalid template format: missing required fields');
    }

    // Validate layout structure
    if (!parsed.layout.kpis || !parsed.layout.mainCharts || !parsed.layout.sideCharts) {
        throw new Error('Invalid template format: incomplete layout');
    }

    return parsed as DashboardTemplate;
}

// ============================================================================
// Template Validation
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateTemplate(template: DashboardTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!template.name || template.name.length < 3) {
        errors.push('Template name must be at least 3 characters');
    }
    if (!template.description || template.description.length < 10) {
        warnings.push('Consider adding a more detailed description');
    }
    if (template.gameTypes.length === 0) {
        warnings.push('No game types specified - template may be hard to discover');
    }

    // Layout validation
    if (template.layout.kpis.length === 0 &&
        template.layout.mainCharts.length === 0 &&
        template.layout.sideCharts.length === 0) {
        errors.push('Template must have at least one KPI or chart');
    }

    // Required columns validation
    const uniqueSemantics = new Set(template.requiredColumns.map(r => r.semantic));
    if (uniqueSemantics.size !== template.requiredColumns.length) {
        warnings.push('Duplicate required column semantics detected');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Increment Stats
// ============================================================================

export async function incrementDownloads(templateId: string): Promise<void> {
    const template = await getTemplate(templateId);
    if (template) {
        template.downloads++;
        template.updatedAt = new Date().toISOString();
        await saveTemplate(template);
    }
}

export async function incrementStars(templateId: string): Promise<void> {
    const template = await getTemplate(templateId);
    if (template) {
        template.stars++;
        template.updatedAt = new Date().toISOString();
        await saveTemplate(template);
    }
}

export async function decrementStars(templateId: string): Promise<void> {
    const template = await getTemplate(templateId);
    if (template && template.stars > 0) {
        template.stars--;
        template.updatedAt = new Date().toISOString();
        await saveTemplate(template);
    }
}
