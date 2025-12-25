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
                    <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BarChart3 className="w-8 h-8 text-violet-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
                    <p className="text-gray-500 mb-6">
                        Upload your game analytics data to get AI-powered insights and visualizations.
                    </p>
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
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
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</h3>
                    <p className="text-red-700 mb-4">{analytics.error}</p>
                    <button
                        onClick={() => {
                            analytics.clearError();
                            analytics.runAnalysis();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900">{analytics.dataName}</h1>
                                <span className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full capitalize">
                                    {result.gameType.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
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
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Switch Data
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                {showDataSelector && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                        {gameDataList.map(data => (
                                            <button
                                                key={data.id}
                                                onClick={() => {
                                                    setActiveGameData(data);
                                                    setShowDataSelector(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                                    data.id === activeGameData?.id ? 'bg-violet-50' : ''
                                                }`}
                                            >
                                                <div className="font-medium text-gray-900">{data.name}</div>
                                                <div className="text-xs text-gray-500">
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
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Re-run analysis"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        {/* Settings */}
                        <Link
                            to="/settings"
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {result.chartRecommendations.length}
                        </div>
                        <div className="text-xs text-gray-500">Charts Generated</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {result.insights.length}
                        </div>
                        <div className="text-xs text-gray-500">Insights Found</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {result.anomalyStats?.total || 0}
                        </div>
                        <div className="text-xs text-gray-500">Anomalies Detected</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {result.funnelStats?.detected || 0}
                        </div>
                        <div className="text-xs text-gray-500">Funnels Identified</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {result.columnMeanings.length}
                        </div>
                        <div className="text-xs text-gray-500">Columns Analyzed</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsPage;
