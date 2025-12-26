/**
 * Funnel Store
 * Custom funnel creation and management for Phase 6
 */

import { dbPut, dbGetAll, dbGet, dbDelete, generateId } from './db';

// ============================================================================
// Types
// ============================================================================

export interface FunnelStep {
    id: string;
    name: string;
    event: string;
    filters?: FunnelFilter[];
    order: number;
}

export interface FunnelFilter {
    property: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
}

export interface Funnel {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    steps: FunnelStep[];

    // Settings
    conversionWindow: number; // hours
    countingMethod: 'unique' | 'totals';
    breakdownProperty?: string;

    // Metadata
    createdAt: string;
    updatedAt: string;
    lastViewedAt?: string;
}

export interface FunnelResult {
    funnelId: string;
    calculatedAt: string;
    steps: {
        stepId: string;
        name: string;
        users: number;
        conversionRate: number;
        dropoffRate: number;
    }[];
    overallConversion: number;
    medianTime: number; // seconds
}

// ============================================================================
// Store Operations
// ============================================================================

const FUNNELS_STORE = 'funnels';

export async function saveFunnel(funnel: Funnel): Promise<void> {
    funnel.updatedAt = new Date().toISOString();
    return dbPut(FUNNELS_STORE, funnel);
}

export async function getFunnel(id: string): Promise<Funnel | undefined> {
    return dbGet(FUNNELS_STORE, id);
}

export async function getAllFunnels(): Promise<Funnel[]> {
    return dbGetAll(FUNNELS_STORE);
}

export async function deleteFunnel(id: string): Promise<void> {
    return dbDelete(FUNNELS_STORE, id);
}

export async function duplicateFunnel(id: string, newName: string): Promise<Funnel | undefined> {
    const original = await getFunnel(id);
    if (!original) return undefined;

    const now = new Date().toISOString();
    const duplicate: Funnel = {
        ...original,
        id: generateId(),
        name: newName,
        steps: original.steps.map(s => ({ ...s, id: generateId() })),
        createdAt: now,
        updatedAt: now,
        lastViewedAt: undefined,
    };

    await saveFunnel(duplicate);
    return duplicate;
}

// ============================================================================
// Funnel Creation
// ============================================================================

export function createFunnel(name: string, options: Partial<Funnel> = {}): Funnel {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        name,
        description: options.description,
        icon: options.icon || '🔻',
        steps: options.steps || [],
        conversionWindow: options.conversionWindow || 24,
        countingMethod: options.countingMethod || 'unique',
        breakdownProperty: options.breakdownProperty,
        createdAt: now,
        updatedAt: now,
    };
}

export function createFunnelStep(name: string, event: string, order: number): FunnelStep {
    return {
        id: generateId(),
        name,
        event,
        order,
        filters: [],
    };
}

// ============================================================================
// Event Options (for dropdown)
// ============================================================================

export const COMMON_EVENTS = [
    { value: 'app_open', label: 'App Open', category: 'lifecycle' },
    { value: 'session_start', label: 'Session Start', category: 'lifecycle' },
    { value: 'tutorial_start', label: 'Tutorial Start', category: 'onboarding' },
    { value: 'tutorial_complete', label: 'Tutorial Complete', category: 'onboarding' },
    { value: 'registration', label: 'Registration', category: 'onboarding' },
    { value: 'level_start', label: 'Level Start', category: 'gameplay' },
    { value: 'level_complete', label: 'Level Complete', category: 'gameplay' },
    { value: 'level_fail', label: 'Level Fail', category: 'gameplay' },
    { value: 'purchase_start', label: 'Purchase Started', category: 'monetization' },
    { value: 'purchase_complete', label: 'Purchase Completed', category: 'monetization' },
    { value: 'ad_request', label: 'Ad Requested', category: 'monetization' },
    { value: 'ad_impression', label: 'Ad Impression', category: 'monetization' },
    { value: 'ad_click', label: 'Ad Click', category: 'monetization' },
    { value: 'share', label: 'Share', category: 'social' },
    { value: 'invite_send', label: 'Invite Sent', category: 'social' },
    { value: 'invite_accept', label: 'Invite Accepted', category: 'social' },
    { value: 'achievement_unlock', label: 'Achievement Unlocked', category: 'progression' },
    { value: 'item_acquire', label: 'Item Acquired', category: 'economy' },
    { value: 'item_use', label: 'Item Used', category: 'economy' },
    { value: 'currency_earn', label: 'Currency Earned', category: 'economy' },
    { value: 'currency_spend', label: 'Currency Spent', category: 'economy' },
];

export const FILTER_OPERATORS = [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'greater_than', label: 'greater than' },
    { value: 'less_than', label: 'less than' },
];

// ============================================================================
// Sample Funnels
// ============================================================================

export const SAMPLE_FUNNELS: Omit<Funnel, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'New User Onboarding',
        description: 'Track user progression from first open to first purchase',
        icon: '🚀',
        conversionWindow: 168, // 7 days
        countingMethod: 'unique',
        steps: [
            { id: 's1', name: 'App Open', event: 'app_open', order: 1 },
            { id: 's2', name: 'Tutorial Started', event: 'tutorial_start', order: 2 },
            { id: 's3', name: 'Tutorial Completed', event: 'tutorial_complete', order: 3 },
            { id: 's4', name: 'First Level Complete', event: 'level_complete', order: 4 },
            { id: 's5', name: 'First Purchase', event: 'purchase_complete', order: 5 },
        ],
    },
    {
        name: 'Purchase Funnel',
        description: 'Track the purchase flow from store view to completion',
        icon: '💰',
        conversionWindow: 1,
        countingMethod: 'totals',
        steps: [
            { id: 'p1', name: 'Store Opened', event: 'app_open', order: 1 },
            { id: 'p2', name: 'Product Viewed', event: 'item_acquire', order: 2 },
            { id: 'p3', name: 'Checkout Started', event: 'purchase_start', order: 3 },
            { id: 'p4', name: 'Purchase Completed', event: 'purchase_complete', order: 4 },
        ],
    },
    {
        name: 'Level Progression',
        description: 'Track player progression through game levels',
        icon: '🎮',
        conversionWindow: 720, // 30 days
        countingMethod: 'unique',
        steps: [
            { id: 'l1', name: 'Level 1', event: 'level_complete', order: 1, filters: [{ property: 'level', operator: 'equals', value: 1 }] },
            { id: 'l2', name: 'Level 5', event: 'level_complete', order: 2, filters: [{ property: 'level', operator: 'equals', value: 5 }] },
            { id: 'l3', name: 'Level 10', event: 'level_complete', order: 3, filters: [{ property: 'level', operator: 'equals', value: 10 }] },
            { id: 'l4', name: 'Level 25', event: 'level_complete', order: 4, filters: [{ property: 'level', operator: 'equals', value: 25 }] },
            { id: 'l5', name: 'Level 50', event: 'level_complete', order: 5, filters: [{ property: 'level', operator: 'equals', value: 50 }] },
        ],
    },
];

export async function initializeSampleFunnels(): Promise<void> {
    const existing = await getAllFunnels();
    if (existing.length > 0) return;

    const now = new Date().toISOString();
    for (const funnelDef of SAMPLE_FUNNELS) {
        const funnel: Funnel = {
            id: generateId(),
            ...funnelDef,
            createdAt: now,
            updatedAt: now,
        };
        await saveFunnel(funnel);
    }
}

// ============================================================================
// Mock Result Generation
// ============================================================================

export function getMockFunnelResult(funnel: Funnel): FunnelResult {
    const baseUsers = 10000 + Math.floor(Math.random() * 5000);
    let currentUsers = baseUsers;

    const steps = funnel.steps.map((step, index) => {
        // Random dropoff between 15-40% per step
        const dropoffRate = index === 0 ? 0 : 15 + Math.random() * 25;
        currentUsers = index === 0 ? currentUsers : Math.floor(currentUsers * (1 - dropoffRate / 100));

        return {
            stepId: step.id,
            name: step.name,
            users: currentUsers,
            conversionRate: (currentUsers / baseUsers) * 100,
            dropoffRate,
        };
    });

    const lastStep = steps[steps.length - 1];
    const overallConversion = lastStep ? (lastStep.users / baseUsers) * 100 : 0;

    return {
        funnelId: funnel.id,
        calculatedAt: new Date().toISOString(),
        steps,
        overallConversion,
        medianTime: 120 + Math.floor(Math.random() * 600), // 2-12 minutes
    };
}
