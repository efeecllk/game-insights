/**
 * Experiment Intelligence Engine
 * Automated analysis, risk detection, and recommendations
 * Phase 5: AI/ML Features - A/B Test Intelligence
 */

import type { Experiment } from './experimentStore';

// ============================================================================
// Types
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RecommendedAction = 'continue' | 'stop_winner' | 'stop_no_effect' | 'extend' | 'investigate';

export interface ExperimentRisk {
    type: string;
    level: RiskLevel;
    message: string;
    details?: string;
    recommendation?: string;
}

export interface ExperimentInsight {
    type: 'positive' | 'negative' | 'neutral' | 'warning';
    title: string;
    message: string;
    metric?: string;
    impact?: number;
}

export interface ExperimentRecommendation {
    action: RecommendedAction;
    confidence: number; // 0-1
    reason: string;
    details: string[];
}

export interface ExperimentIntelligence {
    experimentId: string;
    analyzedAt: string;
    risks: ExperimentRisk[];
    insights: ExperimentInsight[];
    recommendation: ExperimentRecommendation;
    healthScore: number; // 0-100
    dataQuality: {
        sampleRatioMismatch: boolean;
        sufficientSampleSize: boolean;
        stableMetrics: boolean;
    };
}

// ============================================================================
// Risk Detection
// ============================================================================

/**
 * Detect sample ratio mismatch (SRM)
 * Checks if traffic is being split as expected
 */
export function detectSampleRatioMismatch(
    experiment: Experiment
): ExperimentRisk | null {
    if (!experiment.results || experiment.results.length < 2) return null;

    const totalSamples = experiment.results.reduce((sum, r) => sum + r.sampleSize, 0);
    if (totalSamples < 100) return null; // Need minimum samples

    for (const variant of experiment.variants) {
        const result = experiment.results.find(r => r.variantId === variant.id);
        if (!result) continue;

        const expectedRatio = variant.trafficPercent / 100;
        const actualRatio = result.sampleSize / totalSamples;
        const deviation = Math.abs(actualRatio - expectedRatio) / expectedRatio;

        // Chi-square test for SRM
        const expectedCount = totalSamples * expectedRatio;
        const chiSquare = Math.pow(result.sampleSize - expectedCount, 2) / expectedCount;

        if (chiSquare > 3.84) { // p < 0.05
            return {
                type: 'sample_ratio_mismatch',
                level: deviation > 0.1 ? 'critical' : 'high',
                message: `Traffic split differs from expected by ${(deviation * 100).toFixed(1)}%`,
                details: `${variant.name} has ${(actualRatio * 100).toFixed(1)}% vs expected ${(expectedRatio * 100).toFixed(1)}%`,
                recommendation: 'Investigate assignment logic. Results may be invalid.',
            };
        }
    }

    return null;
}

/**
 * Detect novelty effect risk
 * Early results may be inflated due to user curiosity
 */
export function detectNoveltyEffect(experiment: Experiment): ExperimentRisk | null {
    if (!experiment.startDate || !experiment.results) return null;

    const daysSinceStart = Math.floor(
        (Date.now() - new Date(experiment.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // First 7 days may show novelty effect
    if (daysSinceStart < 7) {
        const hasSignificantResult = experiment.results.some(r => r.isSignificant && !r.variantId);
        if (hasSignificantResult) {
            return {
                type: 'novelty_effect',
                level: daysSinceStart < 3 ? 'high' : 'medium',
                message: 'Results may be inflated by novelty effect',
                details: `Only ${daysSinceStart} days since start. Users may be exploring the new experience.`,
                recommendation: 'Wait at least 7 days before drawing conclusions.',
            };
        }
    }

    return null;
}

/**
 * Detect peeking/multiple testing problem
 * Checking results too often inflates false positive rate
 */
export function detectPeekingRisk(experiment: Experiment): ExperimentRisk | null {
    if (!experiment.results) return null;

    const totalSamples = experiment.results.reduce((sum, r) => sum + r.sampleSize, 0);
    const progressPercent = (totalSamples / experiment.requiredSampleSize) * 100;

    // If checking for significance before reaching sample size
    if (progressPercent < 50) {
        const hasSignificantResult = experiment.results.some(r => r.isSignificant);
        if (hasSignificantResult) {
            return {
                type: 'peeking',
                level: progressPercent < 25 ? 'high' : 'medium',
                message: 'Early significance may be unreliable',
                details: `Only ${progressPercent.toFixed(0)}% of required sample collected. P-values are not valid with repeated peeking.`,
                recommendation: 'Use sequential testing or wait for full sample size.',
            };
        }
    }

    return null;
}

/**
 * Detect underpowered experiment
 */
export function detectUnderpowered(experiment: Experiment): ExperimentRisk | null {
    if (!experiment.results) return null;

    const totalSamples = experiment.results.reduce((sum, r) => sum + r.sampleSize, 0);
    const progressPercent = (totalSamples / experiment.requiredSampleSize) * 100;

    // If near end but no significance
    if (progressPercent > 80) {
        const anySignificant = experiment.results.some(r => r.isSignificant);
        if (!anySignificant) {
            return {
                type: 'underpowered',
                level: 'medium',
                message: 'Experiment may be underpowered',
                details: `${progressPercent.toFixed(0)}% complete with no significant results. Effect size may be smaller than expected.`,
                recommendation: 'Consider extending the experiment or accepting smaller effects.',
            };
        }
    }

    return null;
}

/**
 * Detect metric quality issues
 */
export function detectMetricIssues(experiment: Experiment): ExperimentRisk | null {
    if (!experiment.results || experiment.results.length < 2) return null;

    // Check for extreme conversion rates
    for (const result of experiment.results) {
        if (result.conversionRate > 0.9 || result.conversionRate < 0.001) {
            return {
                type: 'metric_quality',
                level: 'medium',
                message: 'Unusual conversion rate detected',
                details: `Conversion rate of ${(result.conversionRate * 100).toFixed(2)}% seems extreme.`,
                recommendation: 'Verify metric definition and data collection.',
            };
        }
    }

    // Check for high variance (wide confidence intervals)
    const control = experiment.results.find(r => {
        const v = experiment.variants.find(v => v.id === r.variantId);
        return v?.isControl;
    });

    if (control) {
        const ciWidth = control.confidenceInterval[1] - control.confidenceInterval[0];
        if (ciWidth > control.conversionRate * 0.5) {
            return {
                type: 'high_variance',
                level: 'low',
                message: 'High variance in results',
                details: 'Wide confidence intervals may make it hard to detect effects.',
                recommendation: 'Consider longer runtime or larger sample size.',
            };
        }
    }

    return null;
}

// ============================================================================
// Insight Generation
// ============================================================================

/**
 * Generate insights from experiment results
 */
export function generateInsights(experiment: Experiment): ExperimentInsight[] {
    const insights: ExperimentInsight[] = [];

    if (!experiment.results || experiment.results.length < 2) {
        return insights;
    }

    const control = experiment.results.find(r => {
        const v = experiment.variants.find(v => v.id === r.variantId);
        return v?.isControl;
    });

    const treatments = experiment.results.filter(r => {
        const v = experiment.variants.find(v => v.id === r.variantId);
        return !v?.isControl;
    });

    // Check for clear winner
    const significantWinner = treatments.find(t => t.isSignificant && t.improvement > 0);
    if (significantWinner) {
        const variant = experiment.variants.find(v => v.id === significantWinner.variantId);
        insights.push({
            type: 'positive',
            title: 'Clear Winner',
            message: `${variant?.name} shows a statistically significant ${(significantWinner.improvement * 100).toFixed(1)}% improvement.`,
            impact: significantWinner.improvement,
        });
    }

    // Check for clear loser
    const significantLoser = treatments.find(t => t.isSignificant && t.improvement < -0.05);
    if (significantLoser) {
        const variant = experiment.variants.find(v => v.id === significantLoser.variantId);
        insights.push({
            type: 'negative',
            title: 'Significant Decline',
            message: `${variant?.name} shows a ${Math.abs(significantLoser.improvement * 100).toFixed(1)}% decrease. Consider stopping this variant.`,
            impact: significantLoser.improvement,
        });
    }

    // Sample size progress
    const totalSamples = experiment.results.reduce((sum, r) => sum + r.sampleSize, 0);
    const progressPercent = (totalSamples / experiment.requiredSampleSize) * 100;

    if (progressPercent >= 100) {
        insights.push({
            type: 'neutral',
            title: 'Target Sample Reached',
            message: 'Experiment has collected the required sample size for statistical validity.',
        });
    } else if (progressPercent >= 50) {
        insights.push({
            type: 'neutral',
            title: 'Halfway Complete',
            message: `${progressPercent.toFixed(0)}% of required samples collected.`,
        });
    }

    // Revenue impact (if applicable)
    const revenueImpact = treatments.reduce((best, t) => {
        if (!control) return best;
        const impact = (t.avgRevenue - control.avgRevenue) * t.sampleSize;
        return impact > best ? impact : best;
    }, 0);

    if (revenueImpact > 100) {
        insights.push({
            type: 'positive',
            title: 'Revenue Opportunity',
            message: `Potential additional revenue of $${revenueImpact.toFixed(0)} based on current results.`,
            metric: 'revenue',
            impact: revenueImpact,
        });
    }

    return insights;
}

// ============================================================================
// Recommendation Engine
// ============================================================================

/**
 * Generate recommendation for experiment
 */
export function generateRecommendation(
    experiment: Experiment,
    risks: ExperimentRisk[]
): ExperimentRecommendation {
    const hasCriticalRisk = risks.some(r => r.level === 'critical');
    const hasHighRisk = risks.some(r => r.level === 'high');

    if (!experiment.results || experiment.results.length < 2) {
        return {
            action: 'continue',
            confidence: 0.9,
            reason: 'Insufficient data',
            details: ['Waiting for experiment results to accumulate'],
        };
    }

    const totalSamples = experiment.results.reduce((sum, r) => sum + r.sampleSize, 0);
    const progressPercent = (totalSamples / experiment.requiredSampleSize) * 100;

    // Critical risk - investigate
    if (hasCriticalRisk) {
        return {
            action: 'investigate',
            confidence: 0.9,
            reason: 'Critical issues detected',
            details: risks.filter(r => r.level === 'critical').map(r => r.message),
        };
    }

    // Check for clear winner with sufficient samples
    const significantWinner = experiment.results.find(r => {
        const v = experiment.variants.find(v => v.id === r.variantId);
        return !v?.isControl && r.isSignificant && r.improvement > 0.05;
    });

    if (significantWinner && progressPercent >= 50 && !hasHighRisk) {
        return {
            action: 'stop_winner',
            confidence: 0.95 - (risks.length * 0.1),
            reason: 'Clear winner detected',
            details: [
                `Treatment shows ${(significantWinner.improvement * 100).toFixed(1)}% improvement`,
                `P-value: ${significantWinner.pValue.toFixed(4)}`,
                `${progressPercent.toFixed(0)}% of required sample collected`,
            ],
        };
    }

    // Check for clear loser
    const significantLoser = experiment.results.find(r => {
        const v = experiment.variants.find(v => v.id === r.variantId);
        return !v?.isControl && r.isSignificant && r.improvement < -0.1;
    });

    if (significantLoser && progressPercent >= 30) {
        return {
            action: 'stop_no_effect',
            confidence: 0.85,
            reason: 'Treatment is performing worse',
            details: [
                `Treatment shows ${Math.abs(significantLoser.improvement * 100).toFixed(1)}% decrease`,
                'Consider stopping to avoid losing conversions',
            ],
        };
    }

    // Full sample reached without significance
    if (progressPercent >= 100) {
        const anyImprovement = experiment.results.some(r => {
            const v = experiment.variants.find(v => v.id === r.variantId);
            return !v?.isControl && r.improvement > 0.02;
        });

        if (anyImprovement) {
            return {
                action: 'extend',
                confidence: 0.7,
                reason: 'Potential effect detected but not significant',
                details: [
                    'Effect size may be smaller than expected',
                    'Consider running longer or accepting smaller MDE',
                ],
            };
        }

        return {
            action: 'stop_no_effect',
            confidence: 0.8,
            reason: 'No significant effect detected',
            details: [
                'Full sample collected without finding a winner',
                'Treatment may not have meaningful impact',
            ],
        };
    }

    // Default: continue
    return {
        action: 'continue',
        confidence: 0.9 - (risks.length * 0.1),
        reason: 'Experiment running normally',
        details: [
            `${progressPercent.toFixed(0)}% of required samples collected`,
            `Estimated ${Math.ceil((experiment.requiredSampleSize - totalSamples) / 500)} days remaining`,
        ],
    };
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze an experiment and return intelligence report
 */
export function analyzeExperiment(experiment: Experiment): ExperimentIntelligence {
    // Collect all risks
    const risks: ExperimentRisk[] = [];

    const srmRisk = detectSampleRatioMismatch(experiment);
    if (srmRisk) risks.push(srmRisk);

    const noveltyRisk = detectNoveltyEffect(experiment);
    if (noveltyRisk) risks.push(noveltyRisk);

    const peekingRisk = detectPeekingRisk(experiment);
    if (peekingRisk) risks.push(peekingRisk);

    const underpoweredRisk = detectUnderpowered(experiment);
    if (underpoweredRisk) risks.push(underpoweredRisk);

    const metricRisk = detectMetricIssues(experiment);
    if (metricRisk) risks.push(metricRisk);

    // Generate insights
    const insights = generateInsights(experiment);

    // Generate recommendation
    const recommendation = generateRecommendation(experiment, risks);

    // Calculate health score
    let healthScore = 100;
    for (const risk of risks) {
        switch (risk.level) {
            case 'critical': healthScore -= 40; break;
            case 'high': healthScore -= 25; break;
            case 'medium': healthScore -= 15; break;
            case 'low': healthScore -= 5; break;
        }
    }
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Data quality checks
    const dataQuality = {
        sampleRatioMismatch: !srmRisk,
        sufficientSampleSize: experiment.results
            ? experiment.results.reduce((sum, r) => sum + r.sampleSize, 0) >= experiment.requiredSampleSize * 0.25
            : false,
        stableMetrics: !metricRisk,
    };

    return {
        experimentId: experiment.id,
        analyzedAt: new Date().toISOString(),
        risks,
        insights,
        recommendation,
        healthScore,
        dataQuality,
    };
}

// ============================================================================
// Aggregate Insights (Cross-Experiment)
// ============================================================================

export interface AggregateInsights {
    totalExperiments: number;
    activeExperiments: number;
    completedExperiments: number;
    avgWinRate: number;
    avgEffectSize: number;
    commonRisks: { type: string; count: number }[];
    recentWinners: { experimentId: string; name: string; improvement: number }[];
    recommendations: string[];
}

/**
 * Generate aggregate insights across all experiments
 */
export function generateAggregateInsights(experiments: Experiment[]): AggregateInsights {
    const active = experiments.filter(e => e.status === 'running');
    const completed = experiments.filter(e => e.status === 'completed');

    // Calculate win rate
    const experimentsWithWinner = completed.filter(e => e.winner);
    const avgWinRate = completed.length > 0
        ? experimentsWithWinner.length / completed.length
        : 0;

    // Calculate average effect size
    const effectSizes = completed
        .filter(e => e.results)
        .flatMap(e => e.results!.filter(r => r.isSignificant && r.improvement > 0))
        .map(r => r.improvement);
    const avgEffectSize = effectSizes.length > 0
        ? effectSizes.reduce((a, b) => a + b, 0) / effectSizes.length
        : 0;

    // Collect common risks
    const riskCounts: Record<string, number> = {};
    for (const exp of active) {
        const analysis = analyzeExperiment(exp);
        for (const risk of analysis.risks) {
            riskCounts[risk.type] = (riskCounts[risk.type] || 0) + 1;
        }
    }
    const commonRisks = Object.entries(riskCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Recent winners
    const recentWinners = completed
        .filter(e => e.winner && e.results)
        .slice(0, 5)
        .map(e => {
            const winnerResult = e.results!.find(r => r.variantId === e.winner);
            return {
                experimentId: e.id,
                name: e.name,
                improvement: winnerResult?.improvement || 0,
            };
        });

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgWinRate < 0.3) {
        recommendations.push('Low win rate detected. Consider improving hypothesis quality or increasing sample sizes.');
    }
    if (commonRisks.some(r => r.type === 'peeking' && r.count > 2)) {
        recommendations.push('Multiple experiments show peeking risk. Consider implementing sequential testing.');
    }
    if (active.length > 5) {
        recommendations.push('Many concurrent experiments may cause interaction effects. Consider prioritization.');
    }

    return {
        totalExperiments: experiments.length,
        activeExperiments: active.length,
        completedExperiments: completed.length,
        avgWinRate,
        avgEffectSize,
        commonRisks,
        recentWinners,
        recommendations,
    };
}
