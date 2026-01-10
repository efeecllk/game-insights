/**
 * DashboardGrid Component - Obsidian Analytics Design
 *
 * Layout container for auto-generated dashboard with:
 * - Responsive grid layout
 * - Coordinated component spacing
 * - Logical section ordering
 */

import { memo, useMemo } from 'react';
import { ChartRecommendation } from '../../ai/ChartSelector';
import { NormalizedData } from '../../adapters/BaseAdapter';
import { ColumnMeaning } from '../../ai/SchemaAnalyzer';
import { CalculatedMetrics } from '../../ai/MetricCalculator';
import { Insight } from '../../ai/InsightGenerator';
import { Anomaly } from '../../ai/AnomalyDetector';
import { DetectedFunnel } from '../../ai/FunnelDetector';
import { CohortAnalysisResult, CohortDefinition } from '../../ai/CohortAnalyzer';
import { GameCategory } from '../../types';
import { QuestionResult } from '../../ai/QuestionAnswering';

import { KPIGrid } from './KPIGrid';
import { ChartRenderer } from './ChartRenderer';
import { InsightsPanel } from './InsightsPanel';
import { FunnelPreview } from './FunnelPreview';
import { AnomalyAlertPanel } from './AnomalyAlertPanel';
import { CohortDashboard } from './CohortDashboard';
import { MetricTrendPanel } from './MetricTrendPanel';
import { SpenderTiersChart } from './SpenderTiersChart';
import { RevenueBreakdownChart } from './RevenueBreakdownChart';
import { DAUTrendChart } from './DAUTrendChart';

interface DashboardGridProps {
    dashboardLayout: {
        kpis: ChartRecommendation[];
        mainCharts: ChartRecommendation[];
        sideCharts: ChartRecommendation[];
    };
    data: NormalizedData;
    columnMeanings: ColumnMeaning[];
    metrics?: CalculatedMetrics;
    insights: Insight[];
    anomalies?: Anomaly[];
    funnels?: DetectedFunnel[];
    cohortAnalysis?: CohortAnalysisResult;
    availableCohortDimensions?: CohortDefinition[];
    onCohortDimensionChange?: (dimension: CohortDefinition) => void;
    gameType: GameCategory;
    suggestedQuestions?: string[];
    onAskQuestion: (question: string) => Promise<QuestionResult | null>;
}

export const DashboardGrid = memo(function DashboardGrid({
    dashboardLayout,
    data,
    columnMeanings,
    metrics,
    insights,
    anomalies,
    funnels,
    cohortAnalysis,
    availableCohortDimensions,
    onCohortDimensionChange,
    gameType,
    suggestedQuestions,
    onAskQuestion,
}: DashboardGridProps) {
    // Memoize anomaly calculations to prevent re-computation on every render
    const hasCriticalAnomalies = useMemo(
        () => anomalies?.some(a => a.severity === 'critical' || a.severity === 'high'),
        [anomalies]
    );

    const anomalyStats = useMemo(() => anomalies ? {
        total: anomalies.length,
        critical: anomalies.filter(a => a.severity === 'critical').length,
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length,
    } : undefined, [anomalies]);

    // Prepare spender tiers data from monetization metrics
    const spenderTiersData = useMemo(() => {
        if (!metrics?.monetization?.spenderSegments) return [];

        return metrics.monetization.spenderSegments.map(segment => ({
            tier: segment.tier === 'whale' ? 'Whale ($100+)' :
                  segment.tier === 'dolphin' ? 'Dolphin ($20-100)' :
                  segment.tier === 'minnow' ? 'Minnow ($1-20)' : 'Non-Payer',
            users: segment.userCount,
            revenue: segment.totalRevenue,
            percentage: segment.percentage,
        }));
    }, [metrics?.monetization?.spenderSegments]);

    // Prepare revenue breakdown data
    const revenueBreakdowns = useMemo(() => {
        if (!metrics?.revenueBreakdowns) {
            return { source: [], country: [], platform: [], product: [] };
        }
        return {
            source: metrics.revenueBreakdowns.source,
            country: metrics.revenueBreakdowns.country,
            platform: metrics.revenueBreakdowns.platform,
            product: metrics.revenueBreakdowns.product,
        };
    }, [metrics?.revenueBreakdowns]);

    // Check if we have revenue breakdown data
    const hasRevenueBreakdowns = useMemo(() => {
        return (
            revenueBreakdowns.source.length > 0 ||
            revenueBreakdowns.country.length > 0 ||
            revenueBreakdowns.platform.length > 0 ||
            revenueBreakdowns.product.length > 0
        );
    }, [revenueBreakdowns]);

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <KPIGrid metrics={metrics} />

            {/* Critical/High Anomaly Alerts - Show prominently after KPIs */}
            {hasCriticalAnomalies && anomalies && (
                <AnomalyAlertPanel
                    anomalies={anomalies}
                    anomalyStats={anomalyStats}
                />
            )}

            {/* Main Charts Row */}
            {dashboardLayout.mainCharts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {dashboardLayout.mainCharts.map((chart, index) => (
                        <ChartRenderer
                            key={`main-${index}`}
                            recommendation={chart}
                            data={data}
                            columnMeanings={columnMeanings}
                            height={320}
                        />
                    ))}
                </div>
            )}

            {/* Side Charts Row */}
            {dashboardLayout.sideCharts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {dashboardLayout.sideCharts.map((chart, index) => (
                        <ChartRenderer
                            key={`side-${index}`}
                            recommendation={chart}
                            data={data}
                            columnMeanings={columnMeanings}
                            height={280}
                        />
                    ))}
                </div>
            )}

            {/* DAU Trend and Spender Tiers Row */}
            {(metrics?.dauTrend || spenderTiersData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {metrics?.dauTrend && metrics.dauTrend.length > 0 && (
                        <DAUTrendChart
                            data={metrics.dauTrend}
                            currentDAU={metrics.engagement?.dau}
                            currentMAU={metrics.engagement?.mau}
                            sourceColumns={['user_id', 'timestamp']}
                        />
                    )}
                    {spenderTiersData.length > 0 && (
                        <SpenderTiersChart
                            tiers={spenderTiersData}
                            totalUsers={metrics?.monetization?.totalUsers ?? 0}
                            totalRevenue={metrics?.monetization?.totalRevenue ?? 0}
                            sourceColumns={['user_id', 'revenue']}
                        />
                    )}
                </div>
            )}

            {/* Revenue Breakdown Row */}
            {hasRevenueBreakdowns && (
                <div className="grid grid-cols-1 gap-6">
                    <RevenueBreakdownChart
                        breakdowns={{
                            ...revenueBreakdowns,
                            custom: [],
                        }}
                        totalRevenue={metrics?.monetization?.totalRevenue ?? 0}
                    />
                </div>
            )}

            {/* Funnels Row */}
            {funnels && funnels.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {funnels.slice(0, 2).map((funnel, index) => (
                        <FunnelPreview key={index} funnel={funnel} />
                    ))}
                </div>
            )}

            {/* Cohort Analysis Dashboard */}
            {cohortAnalysis && cohortAnalysis.cohorts.length > 0 && (
                <CohortDashboard
                    cohortAnalysis={cohortAnalysis}
                    availableDimensions={availableCohortDimensions}
                    onDimensionChange={onCohortDimensionChange}
                />
            )}

            {/* Metric Trends with Drill-down */}
            {metrics && (
                <MetricTrendPanel metrics={metrics} />
            )}

            {/* Non-critical Anomaly Alerts - Show after charts if no critical ones */}
            {!hasCriticalAnomalies && anomalies && anomalies.length > 0 && (
                <AnomalyAlertPanel
                    anomalies={anomalies}
                    anomalyStats={anomalyStats}
                />
            )}

            {/* Insights Panel - Now without anomalies since they have their own panel */}
            <InsightsPanel
                insights={insights}
                gameType={gameType}
                suggestedQuestions={suggestedQuestions}
                onAskQuestion={onAskQuestion}
            />
        </div>
    );
});

export default DashboardGrid;
