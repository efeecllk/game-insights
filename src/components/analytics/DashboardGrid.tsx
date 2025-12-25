/**
 * DashboardGrid Component
 * Layout container for auto-generated dashboard
 */

import { ChartRecommendation } from '../../ai/ChartSelector';
import { NormalizedData } from '../../adapters/BaseAdapter';
import { ColumnMeaning } from '../../ai/SchemaAnalyzer';
import { CalculatedMetrics } from '../../ai/MetricCalculator';
import { Insight } from '../../ai/InsightGenerator';
import { Anomaly } from '../../ai/AnomalyDetector';
import { DetectedFunnel } from '../../ai/FunnelDetector';
import { GameCategory } from '../../types';
import { QuestionResult } from '../../ai/QuestionAnswering';

import { KPIGrid } from './KPIGrid';
import { ChartRenderer } from './ChartRenderer';
import { InsightsPanel } from './InsightsPanel';
import { FunnelPreview } from './FunnelPreview';

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
    gameType,
    suggestedQuestions,
    onAskQuestion,
}: DashboardGridProps) {
    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <KPIGrid metrics={metrics} />

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

            {/* Insights Panel */}
            <InsightsPanel
                insights={insights}
                anomalies={anomalies}
                gameType={gameType}
                suggestedQuestions={suggestedQuestions}
                onAskQuestion={onAskQuestion}
            />
        </div>
    );
}

export default DashboardGrid;
