/**
 * Analytics Page - Obsidian Analytics Design
 *
 * Premium analytics dashboard with:
 * - Glassmorphism containers
 * - Warm orange accent theme
 * - Animated entrance effects
 * - Noise texture backgrounds
 * - Refined data selector dropdown
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    Upload,
    RefreshCw,
    Settings,
    Sparkles,
    AlertCircle,
    ChevronDown,
    Database,
    Zap,
    GitBranch,
    Users,
    Columns,
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useData } from '../context/DataContext';
import { LoadingState, DashboardGrid } from '../components/analytics';
import { questionAnswering } from '../ai/QuestionAnswering';
import { NormalizedData } from '../adapters/BaseAdapter';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
        },
    },
};

export function AnalyticsPage() {
    const { activeGameData, gameDataList, setActiveGameData } = useData();
    const analytics = useAnalytics();
    const [showDataSelector, setShowDataSelector] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setShowDataSelector(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="min-h-[80vh] flex flex-col items-center justify-center"
            >
                <div className="text-center max-w-md">
                    {/* Icon with glow */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="relative mb-6 inline-block"
                    >
                        <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 rounded-2xl flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-[#DA7756]" />
                        </div>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-display font-bold text-white mb-2"
                    >
                        No Data Available
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-slate-500 mb-6"
                    >
                        Upload your game analytics data to get AI-powered insights and visualizations.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Link to="/upload">
                            <Button variant="primary" icon={<Upload className="w-5 h-5" />}>
                                Upload Data
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // Loading state
    if (analytics.isLoading || analytics.isProcessing) {
        return (
            <LoadingState
                stage={analytics.isProcessing ? 'analyzing' : 'sampling'}
                rowCount={activeGameData?.rowCount}
            />
        );
    }

    // Error state
    if (analytics.error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-[60vh] flex flex-col items-center justify-center"
            >
                <Card variant="default" padding="lg" className="max-w-md text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="relative inline-block mb-4"
                    >
                        <div className="w-12 h-12 bg-[#E25C5C]/10 border border-[#E25C5C]/20 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-[#E25C5C]" />
                        </div>
                    </motion.div>
                    <h3 className="text-lg font-semibold text-[#E25C5C] mb-2">Analysis Failed</h3>
                    <p className="text-slate-500 mb-4">{analytics.error}</p>
                    <Button
                        variant="danger"
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={() => {
                            analytics.clearError();
                            analytics.runAnalysis();
                        }}
                    >
                        Retry Analysis
                    </Button>
                </Card>
            </motion.div>
        );
    }

    // No result yet
    if (!analytics.result) {
        return <LoadingState stage="sampling" />;
    }

    const { result } = analytics;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <Card variant="elevated" padding="md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Icon */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <div className="w-12 h-12 bg-th-accent-primary-muted border border-th-accent-primary/20 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-display font-bold text-th-text-primary">
                                        {analytics.dataName}
                                    </h1>
                                    <span className="px-2 py-0.5 text-xs bg-[#DA7756]/10 border border-[#DA7756]/20 text-[#DA7756] rounded-full capitalize">
                                        {result.gameType.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1.5">
                                        <Database className="w-3.5 h-3.5" />
                                        {result.pipelineStats.sampledRows.toLocaleString()} rows
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className="flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5" />
                                        {(result.qualityBefore * 100).toFixed(0)}% quality
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className="text-slate-600">
                                        {result.pipelineStats.processingTimeMs}ms
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Data Selector */}
                            {gameDataList.length > 1 && (
                                <div className="relative" ref={selectorRef}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowDataSelector(!showDataSelector)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 bg-white/[0.03] border border-slate-700 rounded-lg hover:bg-white/[0.06] hover:border-slate-600 transition-colors"
                                    >
                                        Switch Data
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showDataSelector ? 'rotate-180' : ''}`} />
                                    </motion.button>

                                    <AnimatePresence>
                                        {showDataSelector && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                className="absolute right-0 mt-2 w-64 bg-slate-900/95  border border-slate-700 rounded-xl shadow-lg overflow-hidden z-50"
                                            >
                                                {gameDataList.map((data, index) => (
                                                    <motion.button
                                                        key={data.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        onClick={() => {
                                                            setActiveGameData(data);
                                                            setShowDataSelector(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-3 hover:bg-white/[0.05] transition-colors border-b border-slate-800 last:border-0 ${
                                                            data.id === activeGameData?.id ? 'bg-[#DA7756]/10 border-l-2 border-l-[#DA7756]' : ''
                                                        }`}
                                                    >
                                                        <div className="font-medium text-white">{data.name}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {data.rowCount.toLocaleString()} rows
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Refresh */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => analytics.runAnalysis()}
                                className="p-2 text-slate-500 hover:text-[#DA7756] hover:bg-white/[0.05] rounded-lg transition-colors"
                                title="Re-run analysis"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </motion.button>

                            {/* Settings */}
                            <Link
                                to="/settings"
                                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-lg transition-colors"
                                title="Analytics settings"
                            >
                                <Settings className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Dashboard */}
            {result.dashboardLayout && (
                <motion.div variants={itemVariants}>
                    <DashboardGrid
                        dashboardLayout={result.dashboardLayout}
                        data={normalizedData}
                        columnMeanings={result.columnMeanings}
                        metrics={result.metrics}
                        insights={result.insights}
                        anomalies={result.anomalies}
                        funnels={result.funnels}
                        cohortAnalysis={result.cohortAnalysis}
                        availableCohortDimensions={result.availableCohortDimensions}
                        onCohortDimensionChange={analytics.changeCohortDimension}
                        gameType={result.gameType}
                        suggestedQuestions={suggestedQuestions}
                        onAskQuestion={analytics.askQuestion}
                    />
                </motion.div>
            )}

            {/* Stats Footer */}
            <motion.div variants={itemVariants}>
                <Card variant="default" padding="md">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <StatItem
                            icon={BarChart3}
                            value={result.chartRecommendations.length}
                            label="Charts Generated"
                            index={0}
                        />
                        <StatItem
                            icon={Zap}
                            value={result.insights.length}
                            label="Insights Found"
                            index={1}
                        />
                        <StatItem
                            icon={AlertCircle}
                            value={result.anomalyStats?.total || 0}
                            label="Anomalies Detected"
                            index={2}
                        />
                        <StatItem
                            icon={GitBranch}
                            value={result.funnelStats?.detected || 0}
                            label="Funnels Identified"
                            index={3}
                        />
                        <StatItem
                            icon={Users}
                            value={result.cohortAnalysis?.cohorts.length || 0}
                            label="Cohorts Analyzed"
                            index={4}
                        />
                        <StatItem
                            icon={Columns}
                            value={result.columnMeanings.length}
                            label="Columns Analyzed"
                            index={5}
                        />
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}

interface StatItemProps {
    icon: React.ElementType;
    value: number;
    label: string;
    index: number;
}

function StatItem({ icon: Icon, value, label, index }: StatItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="text-center p-3 rounded-xl hover:bg-white/[0.02] transition-colors group cursor-default"
        >
            <div className="flex items-center justify-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-slate-600 group-hover:text-[#DA7756]/60 transition-colors" />
                <span className="text-2xl font-display font-bold text-white">{value}</span>
            </div>
            <div className="text-xs text-slate-500">{label}</div>
        </motion.div>
    );
}

export default AnalyticsPage;
