/**
 * Analytics Page
 * Auto-generated dashboard from uploaded data
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    Upload,
    RefreshCw,
    Settings,
    Sparkles,
    AlertCircle,
    ChevronDown,
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useData } from '../context/DataContext';
import { LoadingState, DashboardGrid } from '../components/analytics';
import { questionAnswering } from '../ai/QuestionAnswering';
import { NormalizedData } from '../adapters/BaseAdapter';

export function AnalyticsPage() {
    const { activeGameData, gameDataList, setActiveGameData } = useData();
    const analytics = useAnalytics();
    const [showDataSelector, setShowDataSelector] = useState(false);

    // Convert raw data to NormalizedData format
    const normalizedData: NormalizedData = activeGameData?.rawData
        ? {
            columns: Object.keys(activeGameData.rawData[0] || {}),
            rows: activeGameData.rawData,
            metadata: {
                source: activeGameData.fileName || 'upload',
                fetchedAt: activeGameData.uploadedAt || new Date().toISOString(),
                rowCount: activeGameData.rawData.length,
            },
        }
        : {
            columns: [],
            rows: [],
            metadata: {
                source: 'empty',
                fetchedAt: new Date().toISOString(),
                rowCount: 0,
            },
        };

    // Get suggested questions for the game type
    const suggestedQuestions = analytics.result
        ? questionAnswering.getSuggestedQuestions(analytics.result.gameType)
        : [];

    // No data state
    if (!activeGameData) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-th-accent-primary-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BarChart3 className="w-8 h-8 text-th-accent-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-th-text-primary mb-2">No Data Available</h2>
                    <p className="text-th-text-muted mb-6">
                        Upload your game analytics data to get AI-powered insights and visualizations.
                    </p>
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-th-accent-primary text-white rounded-lg font-medium hover:bg-th-accent-primary-hover transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                        Upload Data
                    </Link>
                </div>
            </div>
        );
    }

    // Loading state
    if (analytics.isLoading || analytics.isProcessing) {
        return <LoadingState stage={analytics.isProcessing ? 'analyzing' : 'sampling'} />;
    }

    // Error state
    if (analytics.error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="bg-th-error-muted border border-th-error/20 rounded-card p-8 max-w-md text-center">
                    <div className="w-12 h-12 bg-th-error-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-th-error" />
                    </div>
                    <h3 className="text-lg font-semibold text-th-error mb-2">Analysis Failed</h3>
                    <p className="text-th-error mb-4">{analytics.error}</p>
                    <button
                        onClick={() => {
                            analytics.clearError();
                            analytics.runAnalysis();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-th-error text-white rounded-lg hover:bg-th-error/90 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    // No result yet
    if (!analytics.result) {
        return <LoadingState stage="sampling" />;
    }

    const { result } = analytics;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-th-bg-surface rounded-card border border-th-border p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-th-text-primary">{analytics.dataName}</h1>
                                <span className="px-2 py-0.5 text-xs bg-th-accent-primary-muted text-th-accent-primary rounded-full capitalize">
                                    {result.gameType.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-th-text-muted mt-1">
                                <span>{result.pipelineStats.sampledRows.toLocaleString()} rows analyzed</span>
                                <span>Quality: {(result.qualityBefore * 100).toFixed(0)}%</span>
                                <span>{result.pipelineStats.processingTimeMs}ms</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Data Selector */}
                        {gameDataList.length > 1 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDataSelector(!showDataSelector)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-th-text-secondary border border-th-border rounded-lg hover:bg-th-interactive-hover transition-colors"
                                >
                                    Switch Data
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                {showDataSelector && (
                                    <div className="absolute right-0 mt-2 w-64 bg-th-bg-surface border border-th-border rounded-lg shadow-lg z-10">
                                        {gameDataList.map(data => (
                                            <button
                                                key={data.id}
                                                onClick={() => {
                                                    setActiveGameData(data);
                                                    setShowDataSelector(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-th-interactive-hover first:rounded-t-lg last:rounded-b-lg ${
                                                    data.id === activeGameData?.id ? 'bg-th-accent-primary-muted' : ''
                                                }`}
                                            >
                                                <div className="font-medium text-th-text-primary">{data.name}</div>
                                                <div className="text-xs text-th-text-muted">
                                                    {data.rowCount.toLocaleString()} rows
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Refresh */}
                        <button
                            onClick={() => analytics.runAnalysis()}
                            className="p-2 text-th-text-muted hover:text-th-text-secondary hover:bg-th-interactive-hover rounded-lg transition-colors"
                            title="Re-run analysis"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        {/* Settings */}
                        <Link
                            to="/settings"
                            className="p-2 text-th-text-muted hover:text-th-text-secondary hover:bg-th-interactive-hover rounded-lg transition-colors"
                            title="Analytics settings"
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dashboard */}
            {result.dashboardLayout && (
                <DashboardGrid
                    dashboardLayout={result.dashboardLayout}
                    data={normalizedData}
                    columnMeanings={result.columnMeanings}
                    metrics={result.metrics}
                    insights={result.insights}
                    anomalies={result.anomalies}
                    funnels={result.funnels}
                    gameType={result.gameType}
                    suggestedQuestions={suggestedQuestions}
                    onAskQuestion={analytics.askQuestion}
                />
            )}

            {/* Stats Footer */}
            <div className="bg-th-bg-surface rounded-card border border-th-border p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-th-text-primary">
                            {result.chartRecommendations.length}
                        </div>
                        <div className="text-xs text-th-text-muted">Charts Generated</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-th-text-primary">
                            {result.insights.length}
                        </div>
                        <div className="text-xs text-th-text-muted">Insights Found</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-th-text-primary">
                            {result.anomalyStats?.total || 0}
                        </div>
                        <div className="text-xs text-th-text-muted">Anomalies Detected</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-th-text-primary">
                            {result.funnelStats?.detected || 0}
                        </div>
                        <div className="text-xs text-th-text-muted">Funnels Identified</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-th-text-primary">
                            {result.columnMeanings.length}
                        </div>
                        <div className="text-xs text-th-text-muted">Columns Analyzed</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsPage;
