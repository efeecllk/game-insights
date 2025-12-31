/**
 * What-If Analysis Engine
 * Simulates scenarios by modifying metrics and projecting impact
 * Phase 5: Advanced AI & Automation
 */

// ============================================================================
// Types
// ============================================================================

export interface BaselineMetrics {
    /** Daily Active Users */
    dau: number;
    /** Monthly Active Users */
    mau: number;
    /** Retention rates by day */
    retention: {
        d1: number;
        d7: number;
        d30: number;
    };
    /** Average Revenue Per User */
    arpu: number;
    /** Average Revenue Per Paying User */
    arppu: number;
    /** Conversion rate (free to paying) */
    conversionRate: number;
    /** Average revenue per purchase */
    avgRevenuePerPurchase: number;
    /** Average session length in minutes */
    avgSessionLength: number;
    /** Sessions per DAU */
    sessionsPerDau: number;
}

export interface ScenarioModification {
    /** Retention change as decimal (e.g., 0.1 = +10%) */
    retentionChange?: number;
    /** ARPU change as decimal */
    arpuChange?: number;
    /** Conversion rate change as decimal */
    conversionChange?: number;
    /** DAU change as decimal (e.g., from marketing) */
    dauChange?: number;
    /** ARPPU change as decimal */
    arppuChange?: number;
    /** Session length change as decimal */
    sessionLengthChange?: number;
}

export interface ScenarioInput {
    name: string;
    baselineMetrics: BaselineMetrics;
    modifications: ScenarioModification;
    /** Projection horizon in days */
    timeHorizon: number;
    /** Daily new user acquisition */
    dailyNewUsers?: number;
}

export interface ProjectedDay {
    day: number;
    dau: number;
    revenue: number;
    newUsers: number;
    returningUsers: number;
    payingUsers: number;
}

export interface ScenarioResult {
    /** Scenario name */
    name: string;
    /** Daily projections */
    projections: ProjectedDay[];
    /** Summary metrics */
    summary: {
        totalRevenue: number;
        avgDau: number;
        avgRevenue: number;
        projectedLtv: number;
        peakDau: number;
        peakRevenue: number;
    };
    /** Impact compared to baseline */
    impact: {
        revenueChange: number;
        revenueChangePercent: number;
        dauChange: number;
        dauChangePercent: number;
        ltvChange: number;
        ltvChangePercent: number;
    };
    /** Confidence range */
    confidence: {
        low: number;
        high: number;
        level: number;
    };
    /** Breakdown by user source */
    breakdown: {
        revenueFromExisting: number;
        revenueFromNew: number;
        revenueFromReactivated: number;
    };
}

export interface ScenarioComparison {
    baseline: ScenarioResult;
    modified: ScenarioResult;
    difference: {
        totalRevenue: number;
        avgDau: number;
        projectedLtv: number;
    };
    percentChange: {
        revenue: number;
        dau: number;
        ltv: number;
    };
    recommendation: string;
}

// ============================================================================
// Constants (exported for future advanced features)
// ============================================================================

/** Retention decay factors by day (D0=1, D1, D3, D7, D14, D30) */
export const RETENTION_DECAY_DAYS = [0, 1, 3, 7, 14, 30];

/** Industry average retention benchmarks */
export const INDUSTRY_BENCHMARKS = {
    d1: 0.40,
    d7: 0.20,
    d30: 0.10,
};

// ============================================================================
// What-If Engine Class
// ============================================================================

export class WhatIfEngine {
    /** Stored baseline for future comparison features */
    private _storedBaseline: BaselineMetrics | null = null;

    /**
     * Set baseline metrics for comparison (stored for future multi-scenario features)
     */
    setBaseline(metrics: BaselineMetrics): void {
        this._storedBaseline = metrics;
    }

    /**
     * Get stored baseline metrics
     */
    getBaseline(): BaselineMetrics | null {
        return this._storedBaseline;
    }

    /**
     * Simulate a scenario and return projections
     * @param isBaselineCalculation - internal flag to prevent infinite recursion
     */
    simulateScenario(input: ScenarioInput, isBaselineCalculation: boolean = false): ScenarioResult {
        const { baselineMetrics, modifications, timeHorizon, dailyNewUsers = 1000 } = input;

        // Apply modifications to baseline
        const modifiedMetrics = this.applyModifications(baselineMetrics, modifications);

        // Generate retention curve
        const retentionCurve = this.generateRetentionCurve(modifiedMetrics.retention, timeHorizon);

        // Project each day
        const projections: ProjectedDay[] = [];
        let totalRevenue = 0;
        let totalDau = 0;
        let peakDau = 0;
        let peakRevenue = 0;

        // Track cohorts by day they joined
        const cohorts: number[][] = [];

        for (let day = 0; day < timeHorizon; day++) {
            // Add new cohort
            const newUsers = dailyNewUsers * (1 + (modifications.dauChange || 0));
            cohorts.push([newUsers]);

            // Calculate returning users from all previous cohorts
            let returningUsers = 0;
            for (let cohortDay = 0; cohortDay < cohorts.length; cohortDay++) {
                const daysRetained = day - cohortDay;
                if (daysRetained > 0 && daysRetained < retentionCurve.length) {
                    const cohortSize = cohorts[cohortDay][0];
                    const retainedUsers = cohortSize * retentionCurve[daysRetained];
                    returningUsers += retainedUsers;
                }
            }

            const dau = newUsers + returningUsers;
            const payingUsers = dau * modifiedMetrics.conversionRate;
            const dailyRevenue = payingUsers * modifiedMetrics.arppu;

            totalRevenue += dailyRevenue;
            totalDau += dau;
            peakDau = Math.max(peakDau, dau);
            peakRevenue = Math.max(peakRevenue, dailyRevenue);

            projections.push({
                day,
                dau: Math.round(dau),
                revenue: Math.round(dailyRevenue * 100) / 100,
                newUsers: Math.round(newUsers),
                returningUsers: Math.round(returningUsers),
                payingUsers: Math.round(payingUsers),
            });
        }

        // Calculate LTV
        const projectedLtv = this.calculateLtv(modifiedMetrics, retentionCurve);

        // Calculate impact (skip baseline comparison if this IS the baseline calculation)
        let impact = {
            revenueChange: 0,
            revenueChangePercent: 0,
            dauChange: 0,
            dauChangePercent: 0,
            ltvChange: 0,
            ltvChangePercent: 0,
        };

        if (!isBaselineCalculation) {
            // Calculate baseline for comparison (only when not already calculating baseline)
            const baselineResult = this.calculateBaseline(baselineMetrics, timeHorizon, dailyNewUsers);

            impact = {
                revenueChange: totalRevenue - baselineResult.totalRevenue,
                revenueChangePercent: baselineResult.totalRevenue > 0
                    ? ((totalRevenue - baselineResult.totalRevenue) / baselineResult.totalRevenue) * 100
                    : 0,
                dauChange: (totalDau / timeHorizon) - baselineResult.avgDau,
                dauChangePercent: baselineResult.avgDau > 0
                    ? (((totalDau / timeHorizon) - baselineResult.avgDau) / baselineResult.avgDau) * 100
                    : 0,
                ltvChange: projectedLtv - baselineResult.ltv,
                ltvChangePercent: baselineResult.ltv > 0
                    ? ((projectedLtv - baselineResult.ltv) / baselineResult.ltv) * 100
                    : 0,
            };
        }

        // Estimate confidence based on modification magnitude
        const modificationMagnitude = this.calculateModificationMagnitude(modifications);
        const confidenceLevel = Math.max(0.5, 1 - modificationMagnitude * 0.3);

        return {
            name: input.name,
            projections,
            summary: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                avgDau: Math.round(totalDau / timeHorizon),
                avgRevenue: Math.round((totalRevenue / timeHorizon) * 100) / 100,
                projectedLtv: Math.round(projectedLtv * 100) / 100,
                peakDau: Math.round(peakDau),
                peakRevenue: Math.round(peakRevenue * 100) / 100,
            },
            impact,
            confidence: {
                low: totalRevenue * (1 - (1 - confidenceLevel) * 0.5),
                high: totalRevenue * (1 + (1 - confidenceLevel) * 0.5),
                level: confidenceLevel,
            },
            breakdown: {
                revenueFromExisting: totalRevenue * 0.6, // Estimate
                revenueFromNew: totalRevenue * 0.35,
                revenueFromReactivated: totalRevenue * 0.05,
            },
        };
    }

    /**
     * Compare two scenarios
     */
    compareScenarios(
        baselineInput: ScenarioInput,
        modifiedInput: ScenarioInput
    ): ScenarioComparison {
        const baseline = this.simulateScenario(baselineInput);
        const modified = this.simulateScenario(modifiedInput);

        const difference = {
            totalRevenue: modified.summary.totalRevenue - baseline.summary.totalRevenue,
            avgDau: modified.summary.avgDau - baseline.summary.avgDau,
            projectedLtv: modified.summary.projectedLtv - baseline.summary.projectedLtv,
        };

        const percentChange = {
            revenue: baseline.summary.totalRevenue > 0
                ? (difference.totalRevenue / baseline.summary.totalRevenue) * 100
                : 0,
            dau: baseline.summary.avgDau > 0
                ? (difference.avgDau / baseline.summary.avgDau) * 100
                : 0,
            ltv: baseline.summary.projectedLtv > 0
                ? (difference.projectedLtv / baseline.summary.projectedLtv) * 100
                : 0,
        };

        // Generate recommendation
        let recommendation = '';
        if (percentChange.revenue > 10) {
            recommendation = 'Strong positive impact. Consider implementing this change.';
        } else if (percentChange.revenue > 5) {
            recommendation = 'Moderate positive impact. Worth testing with A/B experiment.';
        } else if (percentChange.revenue > 0) {
            recommendation = 'Slight positive impact. May not be worth the implementation effort.';
        } else if (percentChange.revenue > -5) {
            recommendation = 'Neutral or slightly negative impact. Proceed with caution.';
        } else {
            recommendation = 'Significant negative impact. Not recommended.';
        }

        return {
            baseline,
            modified,
            difference,
            percentChange,
            recommendation,
        };
    }

    /**
     * Run sensitivity analysis on a single variable
     */
    sensitivityAnalysis(
        baselineInput: ScenarioInput,
        variable: keyof ScenarioModification,
        range: { min: number; max: number; steps: number }
    ): Array<{ value: number; result: ScenarioResult }> {
        const results: Array<{ value: number; result: ScenarioResult }> = [];
        const stepSize = (range.max - range.min) / range.steps;

        for (let i = 0; i <= range.steps; i++) {
            const value = range.min + stepSize * i;
            const input: ScenarioInput = {
                ...baselineInput,
                name: `${variable} = ${(value * 100).toFixed(1)}%`,
                modifications: {
                    ...baselineInput.modifications,
                    [variable]: value,
                },
            };

            results.push({
                value,
                result: this.simulateScenario(input),
            });
        }

        return results;
    }

    /**
     * Find breakeven point for a metric change
     */
    findBreakeven(
        baselineInput: ScenarioInput,
        variable: keyof ScenarioModification,
        targetRevenueChange: number = 0
    ): number | null {
        // Binary search for breakeven
        let low = -0.5;
        let high = 0.5;
        const tolerance = 0.001;
        const maxIterations = 50;

        for (let i = 0; i < maxIterations; i++) {
            const mid = (low + high) / 2;
            const input: ScenarioInput = {
                ...baselineInput,
                modifications: {
                    ...baselineInput.modifications,
                    [variable]: mid,
                },
            };

            const result = this.simulateScenario(input);
            const revenueChange = result.impact.revenueChange;

            if (Math.abs(revenueChange - targetRevenueChange) < tolerance) {
                return mid;
            }

            if (revenueChange < targetRevenueChange) {
                low = mid;
            } else {
                high = mid;
            }
        }

        return null;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private applyModifications(
        baseline: BaselineMetrics,
        modifications: ScenarioModification
    ): BaselineMetrics {
        return {
            ...baseline,
            dau: baseline.dau * (1 + (modifications.dauChange || 0)),
            retention: {
                d1: Math.min(1, baseline.retention.d1 * (1 + (modifications.retentionChange || 0))),
                d7: Math.min(1, baseline.retention.d7 * (1 + (modifications.retentionChange || 0))),
                d30: Math.min(1, baseline.retention.d30 * (1 + (modifications.retentionChange || 0))),
            },
            arpu: baseline.arpu * (1 + (modifications.arpuChange || 0)),
            arppu: baseline.arppu * (1 + (modifications.arppuChange || 0)),
            conversionRate: Math.min(1, baseline.conversionRate * (1 + (modifications.conversionChange || 0))),
            avgSessionLength: baseline.avgSessionLength * (1 + (modifications.sessionLengthChange || 0)),
        };
    }

    private generateRetentionCurve(
        retention: BaselineMetrics['retention'],
        days: number
    ): number[] {
        const curve: number[] = [1]; // D0 = 100%

        // Interpolate and extrapolate from known points
        const knownPoints = [
            { day: 1, rate: retention.d1 },
            { day: 7, rate: retention.d7 },
            { day: 30, rate: retention.d30 },
        ];

        for (let day = 1; day < days; day++) {
            // Find surrounding known points
            let prevPoint = knownPoints[0];
            let nextPoint = knownPoints[knownPoints.length - 1];

            for (let i = 0; i < knownPoints.length - 1; i++) {
                if (day >= knownPoints[i].day && day <= knownPoints[i + 1].day) {
                    prevPoint = knownPoints[i];
                    nextPoint = knownPoints[i + 1];
                    break;
                }
            }

            let rate: number;
            if (day <= prevPoint.day) {
                // Before first point - linear interpolation from 1
                rate = 1 - (1 - prevPoint.rate) * (day / prevPoint.day);
            } else if (day >= nextPoint.day) {
                // After last point - exponential decay
                const decayRate = Math.log(nextPoint.rate) / nextPoint.day;
                rate = Math.exp(decayRate * day);
            } else {
                // Between points - log-linear interpolation
                const t = (day - prevPoint.day) / (nextPoint.day - prevPoint.day);
                const logPrev = Math.log(prevPoint.rate);
                const logNext = Math.log(nextPoint.rate);
                rate = Math.exp(logPrev + t * (logNext - logPrev));
            }

            curve.push(Math.max(0, Math.min(1, rate)));
        }

        return curve;
    }

    private calculateLtv(
        metrics: BaselineMetrics,
        retentionCurve: number[]
    ): number {
        // LTV = Sum of (retention[day] * daily_revenue_per_user) for all days
        const dailyRevenuePerUser = metrics.arpu;
        let totalLtv = 0;

        for (const retention of retentionCurve) {
            totalLtv += retention * dailyRevenuePerUser;
        }

        return totalLtv;
    }

    private calculateBaseline(
        metrics: BaselineMetrics,
        timeHorizon: number,
        dailyNewUsers: number
    ): { totalRevenue: number; avgDau: number; ltv: number } {
        const input: ScenarioInput = {
            name: 'Baseline',
            baselineMetrics: metrics,
            modifications: {},
            timeHorizon,
            dailyNewUsers,
        };

        // Pass true to prevent infinite recursion
        const result = this.simulateScenario(input, true);
        return {
            totalRevenue: result.summary.totalRevenue,
            avgDau: result.summary.avgDau,
            ltv: result.summary.projectedLtv,
        };
    }

    private calculateModificationMagnitude(modifications: ScenarioModification): number {
        const values = Object.values(modifications).filter((v): v is number => typeof v === 'number');
        if (values.length === 0) return 0;

        const avgMagnitude = values.reduce((sum, v) => sum + Math.abs(v), 0) / values.length;
        return Math.min(1, avgMagnitude);
    }
}

// ============================================================================
// Factory & Singleton
// ============================================================================

let engineInstance: WhatIfEngine | null = null;

export function getWhatIfEngine(): WhatIfEngine {
    if (!engineInstance) {
        engineInstance = new WhatIfEngine();
    }
    return engineInstance;
}

export function createWhatIfEngine(): WhatIfEngine {
    return new WhatIfEngine();
}
