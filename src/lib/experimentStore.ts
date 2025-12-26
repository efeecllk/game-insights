/**
 * Experiment Store
 * A/B Testing experiment management for Phase 6
 */

import { dbPut, dbGetAll, dbGet, dbDelete, generateId } from './db';

// ============================================================================
// Types
// ============================================================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
export type ExperimentType = 'ab' | 'multivariate' | 'feature_flag';

export interface Variant {
    id: string;
    name: string;
    description: string;
    trafficPercent: number;
    isControl: boolean;
}

export interface ExperimentMetric {
    id: string;
    name: string;
    type: 'conversion' | 'revenue' | 'engagement' | 'retention' | 'custom';
    isPrimary: boolean;
    targetValue?: number;
    minimumDetectableEffect?: number;
}

export interface VariantResult {
    variantId: string;
    sampleSize: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    avgRevenue: number;
    confidenceInterval: [number, number];
    improvement: number; // vs control
    pValue: number;
    isSignificant: boolean;
}

export interface Experiment {
    id: string;
    name: string;
    description: string;
    hypothesis: string;
    type: ExperimentType;
    status: ExperimentStatus;

    // Configuration
    variants: Variant[];
    metrics: ExperimentMetric[];
    targetAudience: string;
    trafficAllocation: number; // 0-100, percentage of users in experiment

    // Timing
    startDate?: string;
    endDate?: string;
    estimatedDuration?: number; // days

    // Sample size calculation
    baselineConversionRate: number;
    minimumDetectableEffect: number;
    statisticalPower: number; // typically 0.8
    significanceLevel: number; // typically 0.05
    requiredSampleSize: number;

    // Results
    results?: VariantResult[];
    winner?: string; // variant id
    conclusionNotes?: string;

    // Metadata
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    tags: string[];
}

// ============================================================================
// Store Operations
// ============================================================================

const EXPERIMENTS_STORE = 'experiments';

export async function saveExperiment(experiment: Experiment): Promise<void> {
    experiment.updatedAt = new Date().toISOString();
    return dbPut(EXPERIMENTS_STORE, experiment);
}

export async function getExperiment(id: string): Promise<Experiment | undefined> {
    return dbGet(EXPERIMENTS_STORE, id);
}

export async function getAllExperiments(): Promise<Experiment[]> {
    return dbGetAll(EXPERIMENTS_STORE);
}

export async function getExperimentsByStatus(status: ExperimentStatus): Promise<Experiment[]> {
    const all = await getAllExperiments();
    return all.filter(e => e.status === status);
}

export async function deleteExperiment(id: string): Promise<void> {
    return dbDelete(EXPERIMENTS_STORE, id);
}

// ============================================================================
// Experiment Creation
// ============================================================================

export function createExperiment(
    name: string,
    description: string,
    options: Partial<Experiment> = {}
): Experiment {
    const now = new Date().toISOString();
    const controlVariant: Variant = {
        id: generateId(),
        name: 'Control',
        description: 'Original experience',
        trafficPercent: 50,
        isControl: true,
    };
    const treatmentVariant: Variant = {
        id: generateId(),
        name: 'Treatment',
        description: 'New experience',
        trafficPercent: 50,
        isControl: false,
    };

    return {
        id: generateId(),
        name,
        description,
        hypothesis: options.hypothesis || '',
        type: options.type || 'ab',
        status: 'draft',
        variants: options.variants || [controlVariant, treatmentVariant],
        metrics: options.metrics || [{
            id: generateId(),
            name: 'Conversion Rate',
            type: 'conversion',
            isPrimary: true,
            minimumDetectableEffect: 0.05,
        }],
        targetAudience: options.targetAudience || 'All Users',
        trafficAllocation: options.trafficAllocation || 100,
        baselineConversionRate: options.baselineConversionRate || 0.05,
        minimumDetectableEffect: options.minimumDetectableEffect || 0.2,
        statisticalPower: options.statisticalPower || 0.8,
        significanceLevel: options.significanceLevel || 0.05,
        requiredSampleSize: 0, // Will be calculated
        createdAt: now,
        updatedAt: now,
        tags: options.tags || [],
    };
}

export function createVariant(
    name: string,
    description: string,
    trafficPercent: number,
    isControl: boolean = false
): Variant {
    return {
        id: generateId(),
        name,
        description,
        trafficPercent,
        isControl,
    };
}

// ============================================================================
// Sample Size Calculation
// ============================================================================

/**
 * Calculate required sample size per variant using standard formula
 * Based on: n = 2 * ((Z_alpha + Z_beta)^2 * p * (1-p)) / MDE^2
 */
export function calculateSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number, // relative, e.g., 0.1 for 10% improvement
    power: number = 0.8,
    significanceLevel: number = 0.05
): { perVariant: number; total: number; } {
    // Z-scores for common values
    const zAlpha = getZScore(1 - significanceLevel / 2);
    const zBeta = getZScore(power);

    // Expected treatment rate
    const treatmentRate = baselineRate * (1 + minimumDetectableEffect);

    // Pooled standard error
    const pooledRate = (baselineRate + treatmentRate) / 2;
    const pooledStdErr = Math.sqrt(2 * pooledRate * (1 - pooledRate));

    // Effect size
    const effectSize = Math.abs(treatmentRate - baselineRate);

    // Sample size per variant
    const perVariant = Math.ceil(
        2 * Math.pow((zAlpha + zBeta) * pooledStdErr / effectSize, 2)
    );

    return {
        perVariant,
        total: perVariant * 2,
    };
}

/**
 * Estimate experiment duration based on daily traffic
 */
export function estimateDuration(
    requiredSampleSize: number,
    dailyTraffic: number,
    trafficAllocation: number = 100
): number {
    const effectiveTraffic = dailyTraffic * (trafficAllocation / 100);
    return Math.ceil(requiredSampleSize / effectiveTraffic);
}

// ============================================================================
// Statistical Analysis
// ============================================================================

/**
 * Perform statistical significance test (two-proportion z-test)
 */
export function analyzeResults(
    controlConversions: number,
    controlSampleSize: number,
    treatmentConversions: number,
    treatmentSampleSize: number,
    significanceLevel: number = 0.05
): {
    controlRate: number;
    treatmentRate: number;
    improvement: number;
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: [number, number];
    winner: 'control' | 'treatment' | 'none';
} {
    const controlRate = controlConversions / controlSampleSize;
    const treatmentRate = treatmentConversions / treatmentSampleSize;
    const improvement = controlRate > 0 ? (treatmentRate - controlRate) / controlRate : 0;

    // Pooled proportion
    const pooledRate = (controlConversions + treatmentConversions) / (controlSampleSize + treatmentSampleSize);

    // Standard error
    const standardError = Math.sqrt(
        pooledRate * (1 - pooledRate) * (1 / controlSampleSize + 1 / treatmentSampleSize)
    );

    // Z-score
    const zScore = standardError > 0 ? (treatmentRate - controlRate) / standardError : 0;

    // Two-tailed p-value
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

    // Confidence interval for difference
    const criticalZ = getZScore(1 - significanceLevel / 2);
    const marginOfError = criticalZ * standardError;
    const diff = treatmentRate - controlRate;
    const confidenceInterval: [number, number] = [diff - marginOfError, diff + marginOfError];

    const isSignificant = pValue < significanceLevel;

    let winner: 'control' | 'treatment' | 'none' = 'none';
    if (isSignificant) {
        winner = treatmentRate > controlRate ? 'treatment' : 'control';
    }

    return {
        controlRate,
        treatmentRate,
        improvement,
        pValue,
        isSignificant,
        confidenceInterval,
        winner,
    };
}

/**
 * Calculate Bayesian probability of being best
 */
export function calculateBayesianProbability(
    controlConversions: number,
    controlSampleSize: number,
    treatmentConversions: number,
    treatmentSampleSize: number,
    simulations: number = 10000
): { controlProbability: number; treatmentProbability: number; } {
    let controlWins = 0;
    let treatmentWins = 0;

    // Beta distribution parameters (using uninformative prior)
    const controlAlpha = controlConversions + 1;
    const controlBeta = controlSampleSize - controlConversions + 1;
    const treatmentAlpha = treatmentConversions + 1;
    const treatmentBeta = treatmentSampleSize - treatmentConversions + 1;

    // Monte Carlo simulation
    for (let i = 0; i < simulations; i++) {
        const controlSample = betaSample(controlAlpha, controlBeta);
        const treatmentSample = betaSample(treatmentAlpha, treatmentBeta);

        if (controlSample > treatmentSample) {
            controlWins++;
        } else {
            treatmentWins++;
        }
    }

    return {
        controlProbability: controlWins / simulations,
        treatmentProbability: treatmentWins / simulations,
    };
}

// ============================================================================
// Experiment Actions
// ============================================================================

export async function startExperiment(id: string): Promise<Experiment | undefined> {
    const experiment = await getExperiment(id);
    if (!experiment) return undefined;

    experiment.status = 'running';
    experiment.startDate = new Date().toISOString();
    await saveExperiment(experiment);
    return experiment;
}

export async function pauseExperiment(id: string): Promise<Experiment | undefined> {
    const experiment = await getExperiment(id);
    if (!experiment) return undefined;

    experiment.status = 'paused';
    await saveExperiment(experiment);
    return experiment;
}

export async function completeExperiment(
    id: string,
    winner?: string,
    notes?: string
): Promise<Experiment | undefined> {
    const experiment = await getExperiment(id);
    if (!experiment) return undefined;

    experiment.status = 'completed';
    experiment.endDate = new Date().toISOString();
    if (winner) experiment.winner = winner;
    if (notes) experiment.conclusionNotes = notes;
    await saveExperiment(experiment);
    return experiment;
}

export async function archiveExperiment(id: string): Promise<Experiment | undefined> {
    const experiment = await getExperiment(id);
    if (!experiment) return undefined;

    experiment.status = 'archived';
    await saveExperiment(experiment);
    return experiment;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getZScore(probability: number): number {
    // Approximation of inverse normal CDF
    if (probability <= 0 || probability >= 1) return 0;

    const a1 = -3.969683028665376e1;
    const a2 = 2.209460984245205e2;
    const a3 = -2.759285104469687e2;
    const a4 = 1.383577518672690e2;
    const a5 = -3.066479806614716e1;
    const a6 = 2.506628277459239e0;

    const b1 = -5.447609879822406e1;
    const b2 = 1.615858368580409e2;
    const b3 = -1.556989798598866e2;
    const b4 = 6.680131188771972e1;
    const b5 = -1.328068155288572e1;

    const c1 = -7.784894002430293e-3;
    const c2 = -3.223964580411365e-1;
    const c3 = -2.400758277161838e0;
    const c4 = -2.549732539343734e0;
    const c5 = 4.374664141464968e0;
    const c6 = 2.938163982698783e0;

    const d1 = 7.784695709041462e-3;
    const d2 = 3.224671290700398e-1;
    const d3 = 2.445134137142996e0;
    const d4 = 3.754408661907416e0;

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number, r: number;

    if (probability < pLow) {
        q = Math.sqrt(-2 * Math.log(probability));
        return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (probability <= pHigh) {
        q = probability - 0.5;
        r = q * q;
        return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
            (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
        q = Math.sqrt(-2 * Math.log(1 - probability));
        return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
}

function normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
}

function betaSample(alpha: number, beta: number): number {
    // Generate sample from Beta distribution using Gamma samples
    const gammaAlpha = gammaSample(alpha);
    const gammaBeta = gammaSample(beta);
    return gammaAlpha / (gammaAlpha + gammaBeta);
}

function gammaSample(shape: number): number {
    // Marsaglia and Tsang's method for shape >= 1
    if (shape < 1) {
        return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
        let x: number, v: number;
        do {
            x = randomNormal();
            v = 1 + c * x;
        } while (v <= 0);

        v = v * v * v;
        const u = Math.random();

        if (u < 1 - 0.0331 * (x * x) * (x * x)) {
            return d * v;
        }

        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
            return d * v;
        }
    }
}

function randomNormal(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ============================================================================
// Mock Data Generation (for demo)
// ============================================================================

export function generateMockResults(experiment: Experiment): VariantResult[] {
    const results: VariantResult[] = [];

    for (const variant of experiment.variants) {
        const isControl = variant.isControl;
        const baseRate = experiment.baselineConversionRate;

        // Generate slightly different results for treatment
        const actualRate = isControl ? baseRate : baseRate * (1 + (Math.random() * 0.3 - 0.05));
        const sampleSize = Math.floor(experiment.requiredSampleSize * (variant.trafficPercent / 100) * (0.8 + Math.random() * 0.4));
        const conversions = Math.floor(sampleSize * actualRate);

        const controlResult = results.find(r => {
            const cv = experiment.variants.find(v => v.id === r.variantId);
            return cv?.isControl;
        });

        const improvement = controlResult
            ? ((conversions / sampleSize) - controlResult.conversionRate) / controlResult.conversionRate
            : 0;

        // Calculate confidence interval
        const rate = conversions / sampleSize;
        const se = Math.sqrt(rate * (1 - rate) / sampleSize);
        const z = 1.96;

        results.push({
            variantId: variant.id,
            sampleSize,
            conversions,
            conversionRate: rate,
            revenue: conversions * (15 + Math.random() * 10),
            avgRevenue: 15 + Math.random() * 10,
            confidenceInterval: [rate - z * se, rate + z * se],
            improvement: isControl ? 0 : improvement,
            pValue: isControl ? 1 : 0.01 + Math.random() * 0.1,
            isSignificant: !isControl && Math.random() > 0.3,
        });
    }

    return results;
}

// ============================================================================
// Default Experiments
// ============================================================================

export const SAMPLE_EXPERIMENTS: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'Onboarding Flow Optimization',
        description: 'Test simplified vs original onboarding tutorial',
        hypothesis: 'A simplified 3-step onboarding will increase D7 retention by 15%',
        type: 'ab',
        status: 'running',
        variants: [
            { id: 'v1', name: 'Control', description: 'Original 7-step onboarding', trafficPercent: 50, isControl: true },
            { id: 'v2', name: 'Simplified', description: '3-step onboarding', trafficPercent: 50, isControl: false },
        ],
        metrics: [
            { id: 'm1', name: 'D7 Retention', type: 'retention', isPrimary: true, minimumDetectableEffect: 0.15 },
            { id: 'm2', name: 'Tutorial Completion', type: 'conversion', isPrimary: false },
        ],
        targetAudience: 'New Users',
        trafficAllocation: 100,
        baselineConversionRate: 0.18,
        minimumDetectableEffect: 0.15,
        statisticalPower: 0.8,
        significanceLevel: 0.05,
        requiredSampleSize: 3500,
        startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 21,
        tags: ['onboarding', 'retention'],
    },
    {
        name: 'Starter Pack Pricing',
        description: 'Test different price points for the starter pack',
        hypothesis: '$3.99 will generate more total revenue than $2.99 or $4.99',
        type: 'multivariate',
        status: 'completed',
        variants: [
            { id: 'v1', name: '$2.99', description: 'Lower price point', trafficPercent: 33, isControl: true },
            { id: 'v2', name: '$3.99', description: 'Medium price point', trafficPercent: 33, isControl: false },
            { id: 'v3', name: '$4.99', description: 'Higher price point', trafficPercent: 34, isControl: false },
        ],
        metrics: [
            { id: 'm1', name: 'Purchase Rate', type: 'conversion', isPrimary: true, minimumDetectableEffect: 0.1 },
            { id: 'm2', name: 'Total Revenue', type: 'revenue', isPrimary: false },
        ],
        targetAudience: 'Non-Payers Day 3+',
        trafficAllocation: 100,
        baselineConversionRate: 0.08,
        minimumDetectableEffect: 0.2,
        statisticalPower: 0.8,
        significanceLevel: 0.05,
        requiredSampleSize: 8000,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 25,
        winner: 'v2',
        conclusionNotes: '$3.99 showed 23% higher revenue per user than $2.99, with only 8% lower conversion. Implementing as default.',
        tags: ['pricing', 'monetization'],
    },
    {
        name: 'Push Notification Timing',
        description: 'Test morning vs evening push notifications for re-engagement',
        hypothesis: 'Evening notifications (6PM) will have higher open rates than morning (9AM)',
        type: 'ab',
        status: 'draft',
        variants: [
            { id: 'v1', name: 'Morning (9AM)', description: 'Send at 9AM local time', trafficPercent: 50, isControl: true },
            { id: 'v2', name: 'Evening (6PM)', description: 'Send at 6PM local time', trafficPercent: 50, isControl: false },
        ],
        metrics: [
            { id: 'm1', name: 'Open Rate', type: 'engagement', isPrimary: true, minimumDetectableEffect: 0.1 },
            { id: 'm2', name: 'Session Start Rate', type: 'engagement', isPrimary: false },
        ],
        targetAudience: 'Lapsed Users (3-7 days inactive)',
        trafficAllocation: 50,
        baselineConversionRate: 0.12,
        minimumDetectableEffect: 0.15,
        statisticalPower: 0.8,
        significanceLevel: 0.05,
        requiredSampleSize: 5000,
        estimatedDuration: 14,
        tags: ['engagement', 'notifications'],
    },
];

export async function initializeSampleExperiments(): Promise<void> {
    const existing = await getAllExperiments();
    if (existing.length > 0) return;

    const now = new Date().toISOString();
    for (const expDef of SAMPLE_EXPERIMENTS) {
        const experiment: Experiment = {
            id: generateId(),
            ...expDef,
            createdAt: now,
            updatedAt: now,
        };

        // Generate mock results for running/completed experiments
        if (experiment.status === 'running' || experiment.status === 'completed') {
            experiment.results = generateMockResults(experiment);
        }

        await saveExperiment(experiment);
    }
}
