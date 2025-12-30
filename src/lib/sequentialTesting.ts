/**
 * Sequential Testing Module
 * Implements O'Brien-Fleming and other group sequential testing methods
 * for safe early stopping in A/B experiments
 */

// ============================================================================
// Types
// ============================================================================

export interface SequentialTestConfig {
    /** Maximum number of interim analyses (looks) */
    maxLooks: number;
    /** Overall significance level (alpha) */
    alpha: number;
    /** Desired statistical power */
    power: number;
    /** One-sided or two-sided test */
    sided: 'one' | 'two';
    /** Spending function type */
    spendingFunction: 'obrien-fleming' | 'pocock' | 'haybittle-peto' | 'alpha-spending';
}

export interface InterimAnalysis {
    /** Current look number (1-indexed) */
    lookNumber: number;
    /** Information fraction (0-1, proportion of max sample collected) */
    informationFraction: number;
    /** Observed z-score */
    zScore: number;
    /** P-value for this analysis */
    pValue: number;
    /** Critical boundary for this look */
    criticalBoundary: number;
    /** Whether to stop for efficacy */
    stopForEfficacy: boolean;
    /** Whether to stop for futility */
    stopForFutility: boolean;
    /** Cumulative alpha spent */
    alphaSpent: number;
    /** Remaining alpha */
    alphaRemaining: number;
}

export interface SequentialTestResult {
    /** Configuration used */
    config: SequentialTestConfig;
    /** All interim analyses performed */
    analyses: InterimAnalysis[];
    /** Current status */
    status: 'continue' | 'stop_efficacy' | 'stop_futility' | 'complete';
    /** Final decision if stopped */
    decision?: 'reject_null' | 'fail_to_reject' | 'inconclusive';
    /** Adjusted p-value accounting for multiple looks */
    adjustedPValue?: number;
    /** Boundaries for all planned looks */
    boundaries: number[];
    /** Information schedule */
    informationSchedule: number[];
}

export interface FutilityBoundary {
    /** Information fraction */
    informationFraction: number;
    /** Futility z-score boundary */
    boundary: number;
    /** Conditional power threshold */
    conditionalPowerThreshold: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Standard normal quantiles */
const Z_ALPHA_05 = 1.96;  // Two-sided 5%
// const Z_ALPHA_01 = 2.576; // Two-sided 1% (reserved for future use)

/** Default configuration */
export const DEFAULT_CONFIG: SequentialTestConfig = {
    maxLooks: 5,
    alpha: 0.05,
    power: 0.8,
    sided: 'two',
    spendingFunction: 'obrien-fleming',
};

// ============================================================================
// Alpha Spending Functions
// ============================================================================

/**
 * O'Brien-Fleming alpha spending function
 * Most conservative - requires very strong evidence early on
 */
export function obrienFlemingSpending(t: number, alpha: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return alpha;

    // O'Brien-Fleming: 2 * (1 - Φ(z_α/2 / √t))
    const zAlpha = gaussianQuantile(1 - alpha / 2);
    const z = zAlpha / Math.sqrt(t);
    return 2 * (1 - gaussianCDF(z));
}

/**
 * Pocock alpha spending function
 * Spends alpha more evenly across looks
 */
export function pocockSpending(t: number, alpha: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return alpha;

    // Pocock: α * log(1 + (e-1) * t)
    return alpha * Math.log(1 + (Math.E - 1) * t);
}

/**
 * Haybittle-Peto alpha spending function
 * Uses fixed boundary (z=3) for interim, saves alpha for final
 */
export function haybittlePetoSpending(t: number, alpha: number, isInterim: boolean): number {
    if (t <= 0) return 0;
    if (t >= 1) return alpha;

    // Very little alpha spent at interim (z=3 boundary)
    if (isInterim) {
        return 0.001 * t; // Minimal spending at interim
    }
    return alpha;
}

/**
 * Lan-DeMets alpha spending function (generalized)
 * Parameterized by rho for flexibility
 */
export function lanDeMetsSpending(t: number, alpha: number, rho: number = 1): number {
    if (t <= 0) return 0;
    if (t >= 1) return alpha;

    if (rho === 1) {
        // O'Brien-Fleming like
        return obrienFlemingSpending(t, alpha);
    } else if (rho === 0.5) {
        // Pocock like
        return pocockSpending(t, alpha);
    }

    // General case: α * t^rho
    return alpha * Math.pow(t, rho);
}

// ============================================================================
// Sequential Test Engine
// ============================================================================

export class SequentialTestEngine {
    private config: SequentialTestConfig;
    private analyses: InterimAnalysis[] = [];
    private boundaries: number[] = [];
    private informationSchedule: number[] = [];
    private _cumulativeAlphaSpent: number = 0;

    constructor(config: Partial<SequentialTestConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.calculateBoundaries();
    }

    /**
     * Calculate critical boundaries for all planned looks
     */
    private calculateBoundaries(): void {
        const { maxLooks, alpha, spendingFunction } = this.config;
        this.boundaries = [];
        this.informationSchedule = [];

        let cumulativeSpent = 0;

        for (let k = 1; k <= maxLooks; k++) {
            const t = k / maxLooks; // Information fraction
            this.informationSchedule.push(t);

            // Calculate alpha to spend at this look
            let alphaToSpend: number;

            switch (spendingFunction) {
                case 'obrien-fleming':
                    alphaToSpend = obrienFlemingSpending(t, alpha) - cumulativeSpent;
                    break;
                case 'pocock':
                    alphaToSpend = pocockSpending(t, alpha) - cumulativeSpent;
                    break;
                case 'haybittle-peto':
                    alphaToSpend = k < maxLooks ? 0.001 : alpha - cumulativeSpent;
                    break;
                case 'alpha-spending':
                default:
                    alphaToSpend = lanDeMetsSpending(t, alpha) - cumulativeSpent;
            }

            // Convert alpha to z-score boundary
            const boundaryAlpha = this.config.sided === 'two' ? alphaToSpend / 2 : alphaToSpend;
            const boundary = gaussianQuantile(1 - boundaryAlpha);

            this.boundaries.push(Math.max(boundary, 1)); // Minimum boundary of 1
            cumulativeSpent += alphaToSpend;
        }
    }

    /**
     * Perform interim analysis at current look
     */
    performInterimAnalysis(
        lookNumber: number,
        controlSampleSize: number,
        treatmentSampleSize: number,
        controlMean: number,
        treatmentMean: number,
        pooledStdDev: number
    ): InterimAnalysis {
        if (lookNumber < 1 || lookNumber > this.config.maxLooks) {
            throw new Error(`Look number must be between 1 and ${this.config.maxLooks}`);
        }

        const informationFraction = lookNumber / this.config.maxLooks;

        // Calculate z-score
        const n1 = controlSampleSize;
        const n2 = treatmentSampleSize;
        const se = pooledStdDev * Math.sqrt(1/n1 + 1/n2);
        const zScore = (treatmentMean - controlMean) / se;

        // Get critical boundary for this look
        const criticalBoundary = this.boundaries[lookNumber - 1];

        // Calculate p-value
        const pValue = 2 * (1 - gaussianCDF(Math.abs(zScore)));

        // Check stopping rules
        const absZ = Math.abs(zScore);
        const stopForEfficacy = absZ >= criticalBoundary;

        // Futility check (conditional power < 10%)
        const conditionalPower = this.calculateConditionalPower(
            zScore,
            informationFraction,
            0 // Assume effect size of 0 for futility
        );
        const stopForFutility = !stopForEfficacy && conditionalPower < 0.1;

        // Update cumulative alpha spent
        const spendingFunc = this.config.spendingFunction;
        let alphaSpent: number;

        switch (spendingFunc) {
            case 'obrien-fleming':
                alphaSpent = obrienFlemingSpending(informationFraction, this.config.alpha);
                break;
            case 'pocock':
                alphaSpent = pocockSpending(informationFraction, this.config.alpha);
                break;
            default:
                alphaSpent = lanDeMetsSpending(informationFraction, this.config.alpha);
        }

        this._cumulativeAlphaSpent = alphaSpent;

        const analysis: InterimAnalysis = {
            lookNumber,
            informationFraction,
            zScore,
            pValue,
            criticalBoundary,
            stopForEfficacy,
            stopForFutility,
            alphaSpent,
            alphaRemaining: this.config.alpha - alphaSpent,
        };

        this.analyses.push(analysis);
        return analysis;
    }

    /**
     * Calculate conditional power given current data
     */
    calculateConditionalPower(
        currentZScore: number,
        informationFraction: number,
        assumedEffectSize: number
    ): number {
        const remainingFraction = 1 - informationFraction;
        if (remainingFraction <= 0) return currentZScore > Z_ALPHA_05 ? 1 : 0;

        // Final z-score under assumed effect
        const finalZ = currentZScore * Math.sqrt(informationFraction) +
                       assumedEffectSize * Math.sqrt(remainingFraction);

        // Critical value at final analysis
        const criticalZ = this.boundaries[this.config.maxLooks - 1];

        // P(Z_final > critical | current data)
        const conditionalZ = (criticalZ - finalZ) / Math.sqrt(1);
        return 1 - gaussianCDF(conditionalZ);
    }

    /**
     * Get current test status and result
     */
    getResult(): SequentialTestResult {
        const lastAnalysis = this.analyses[this.analyses.length - 1];

        let status: SequentialTestResult['status'] = 'continue';
        let decision: SequentialTestResult['decision'];

        if (lastAnalysis) {
            if (lastAnalysis.stopForEfficacy) {
                status = 'stop_efficacy';
                decision = 'reject_null';
            } else if (lastAnalysis.stopForFutility) {
                status = 'stop_futility';
                decision = 'fail_to_reject';
            } else if (lastAnalysis.lookNumber >= this.config.maxLooks) {
                status = 'complete';
                decision = Math.abs(lastAnalysis.zScore) >= lastAnalysis.criticalBoundary
                    ? 'reject_null'
                    : 'fail_to_reject';
            }
        }

        // Calculate adjusted p-value
        let adjustedPValue: number | undefined;
        if (lastAnalysis && status !== 'continue') {
            adjustedPValue = this.calculateAdjustedPValue(lastAnalysis.zScore, lastAnalysis.lookNumber);
        }

        return {
            config: this.config,
            analyses: [...this.analyses],
            status,
            decision,
            adjustedPValue,
            boundaries: [...this.boundaries],
            informationSchedule: [...this.informationSchedule],
        };
    }

    /**
     * Calculate stage-wise adjusted p-value
     */
    private calculateAdjustedPValue(observedZ: number, stoppingLook: number): number {
        // Use spending function to get cumulative alpha at stopping point
        const t = stoppingLook / this.config.maxLooks;

        switch (this.config.spendingFunction) {
            case 'obrien-fleming':
                return obrienFlemingSpending(t, 2 * (1 - gaussianCDF(Math.abs(observedZ))));
            case 'pocock':
                return pocockSpending(t, 2 * (1 - gaussianCDF(Math.abs(observedZ))));
            default:
                return 2 * (1 - gaussianCDF(Math.abs(observedZ)));
        }
    }

    /**
     * Get recommended sample size per look
     */
    getRecommendedSampleSize(
        minDetectableEffect: number,
        baselineRate: number,
        isConversion: boolean = true
    ): number[] {
        const { power, alpha, sided } = this.config;

        // Calculate base sample size (fixed design)
        let baseSampleSize: number;

        if (isConversion) {
            // For conversion rates
            const p1 = baselineRate;
            const p2 = baselineRate + minDetectableEffect;
            const pPooled = (p1 + p2) / 2;

            const zAlpha = sided === 'two' ? Z_ALPHA_05 : gaussianQuantile(1 - alpha);
            const zBeta = gaussianQuantile(power);

            baseSampleSize = 2 * Math.pow(
                (zAlpha * Math.sqrt(2 * pPooled * (1 - pPooled)) +
                 zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) /
                (p2 - p1),
                2
            );
        } else {
            // For continuous outcomes
            const zAlpha = sided === 'two' ? Z_ALPHA_05 : gaussianQuantile(1 - alpha);
            const zBeta = gaussianQuantile(power);

            baseSampleSize = 2 * Math.pow((zAlpha + zBeta) / minDetectableEffect, 2);
        }

        // Adjust for sequential design (inflation factor)
        const inflationFactor = this.getSequentialInflationFactor();
        const maxSampleSize = Math.ceil(baseSampleSize * inflationFactor);

        // Distribute across looks
        return this.informationSchedule.map(t => Math.ceil(maxSampleSize * t));
    }

    /**
     * Get sample size inflation factor for sequential design
     */
    private getSequentialInflationFactor(): number {
        // Approximate inflation factors based on spending function
        switch (this.config.spendingFunction) {
            case 'obrien-fleming':
                return 1.015; // O'Brien-Fleming has minimal inflation
            case 'pocock':
                return 1.18;  // Pocock requires more samples
            case 'haybittle-peto':
                return 1.01;  // Very conservative interim
            default:
                return 1.05;  // Default moderate inflation
        }
    }

    /**
     * Reset engine for new test
     */
    reset(): void {
        this.analyses = [];
        this._cumulativeAlphaSpent = 0;
        this.calculateBoundaries();
    }

    /** Get cumulative alpha spent */
    getCumulativeAlphaSpent(): number {
        return this._cumulativeAlphaSpent;
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gaussian CDF (standard normal)
 */
function gaussianCDF(x: number): number {
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

/**
 * Gaussian quantile (inverse CDF)
 * Uses Abramowitz and Stegun approximation
 */
function gaussianQuantile(p: number): number {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;

    const a = [
        -3.969683028665376e+01,
        2.209460984245205e+02,
        -2.759285104469687e+02,
        1.383577518672690e+02,
        -3.066479806614716e+01,
        2.506628277459239e+00,
    ];
    const b = [
        -5.447609879822406e+01,
        1.615858368580409e+02,
        -1.556989798598866e+02,
        6.680131188771972e+01,
        -1.328068155288572e+01,
    ];
    const c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e+00,
        -2.549732539343734e+00,
        4.374664141464968e+00,
        2.938163982698783e+00,
    ];
    const d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e+00,
        3.754408661907416e+00,
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number;
    let r: number;

    if (p < pLow) {
        q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= pHigh) {
        q = p - 0.5;
        r = q * q;
        return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
               (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
        q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick check if experiment should stop early
 */
export function shouldStopEarly(
    controlN: number,
    treatmentN: number,
    controlRate: number,
    treatmentRate: number,
    currentLook: number,
    maxLooks: number = 5,
    alpha: number = 0.05
): { shouldStop: boolean; reason: 'efficacy' | 'futility' | null; pValue: number } {
    const engine = new SequentialTestEngine({ maxLooks, alpha });

    // Calculate pooled std dev for proportions
    const pooledRate = (controlN * controlRate + treatmentN * treatmentRate) / (controlN + treatmentN);
    const pooledStdDev = Math.sqrt(pooledRate * (1 - pooledRate));

    const analysis = engine.performInterimAnalysis(
        currentLook,
        controlN,
        treatmentN,
        controlRate,
        treatmentRate,
        pooledStdDev
    );

    return {
        shouldStop: analysis.stopForEfficacy || analysis.stopForFutility,
        reason: analysis.stopForEfficacy ? 'efficacy' : (analysis.stopForFutility ? 'futility' : null),
        pValue: analysis.pValue,
    };
}

/**
 * Get O'Brien-Fleming boundaries for a test
 */
export function getOBFBoundaries(maxLooks: number = 5, alpha: number = 0.05): number[] {
    const engine = new SequentialTestEngine({
        maxLooks,
        alpha,
        spendingFunction: 'obrien-fleming'
    });
    return engine.getResult().boundaries;
}

/**
 * Calculate required sample size for sequential test
 */
export function calculateSequentialSampleSize(
    baselineRate: number,
    minDetectableEffect: number,
    maxLooks: number = 5,
    power: number = 0.8,
    alpha: number = 0.05
): { perLook: number[]; total: number } {
    const engine = new SequentialTestEngine({ maxLooks, power, alpha });
    const perLook = engine.getRecommendedSampleSize(minDetectableEffect, baselineRate, true);

    return {
        perLook,
        total: perLook[perLook.length - 1],
    };
}

// ============================================================================
// Exports
// ============================================================================

export { gaussianCDF, gaussianQuantile };
