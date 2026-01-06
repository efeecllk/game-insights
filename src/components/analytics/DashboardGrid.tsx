/**
 * DashboardGrid Component - Obsidian Analytics Design
 *
 * Layout container for auto-generated dashboard with:
 * - Responsive grid layout
 * - Coordinated component spacing
 * - Logical section ordering
 */

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

export function DashboardGrid({
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
    // Check if there are critical/high severity anomalies that should be shown prominently
    const hasCriticalAnomalies = anomalies?.some(a => a.severity === 'critical' || a.severity === 'high');
    const anomalyStats = anomalies ? {
        total: anomalies.length,
        critical: anomalies.filter(a => a.severity === 'critical').length,
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length,
    } : undefined;

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
}

export default DashboardGrid;
