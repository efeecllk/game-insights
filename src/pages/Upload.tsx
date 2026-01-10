/**
 * Upload Page - Obsidian Analytics Design
 *
 * Premium upload experience with:
 * - "How It Works" onboarding section
 * - Step-by-step hints and guidance
 * - Try Example Data functionality
 * - Visual feedback for analysis results
 * - Animated step indicators
 * - Glassmorphism cards
 * - Warm orange accent theme
 * - Framer Motion transitions
 * - Enhanced error handling
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    Upload,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    FileSpreadsheet,
    Lightbulb,
    Wand2,
    TableProperties,
    Play,
    Info,
    Target,
    Gauge,
    Columns,
    Download,
} from 'lucide-react';
import { UploadZone } from '../components/upload/UploadZone';
import { ColumnMapper } from '../components/upload/ColumnMapper';
import { DataPreview } from '../components/upload/DataPreview';
import type { ImportResult } from '../lib/importers';
import { analyzeSchema, ColumnMapping, SchemaAnalysisResult } from '../lib/columnAnalyzer';
import { detectTemplate } from '../lib/templates';
import { getStoredApiKey } from './Settings';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { parseError } from '../lib/errorHandler';
import { GameCategory } from '../types';
import { Button } from '../components/ui/Button';
import { sampleDatasets, generateSampleData } from '../lib/sampleData';

type Step = 'upload' | 'preview' | 'analyzing' | 'review' | 'complete';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// Step hints data
const stepHints: Record<Step, { title: string; hints: string[] }> = {
    upload: {
        title: 'Upload Your Data',
        hints: [
            'Supported formats: CSV, Excel (.xlsx), JSON, and SQLite databases',
            'Your data should include columns like user_id, timestamp, and event_type',
            'Files up to 50MB are processed instantly; larger files use streaming',
            'Drag and drop works, or click to browse your files',
        ],
    },
    preview: {
        title: 'Preview Your Data',
        hints: [
            'Review the data quality score to understand data completeness',
            'Check column statistics to verify data was parsed correctly',
            'Look for any warnings or issues that might affect analysis',
            'We analyze a sample of your data (up to 1,000 rows) for speed',
        ],
    },
    analyzing: {
        title: 'AI Analysis in Progress',
        hints: [
            'Detecting your game type based on column patterns',
            'Identifying metrics (revenue, scores) and dimensions (countries, platforms)',
            'Mapping columns to standard analytics schema',
            'Calculating data quality and suggesting visualizations',
        ],
    },
    review: {
        title: 'Review Column Mappings',
        hints: [
            'Verify the detected game type matches your game genre',
            'Adjust column roles if the AI made incorrect assumptions',
            'Check the confidence score - lower scores may need manual review',
            'Click on any column to change its mapping or role',
        ],
    },
    complete: {
        title: 'Ready for Analytics',
        hints: ['Your data has been processed and is ready for visualization'],
    },
};

// Game type descriptions for analysis results
const gameTypeDescriptions: Record<string, { name: string; description: string }> = {
    puzzle: { name: 'Puzzle Game', description: 'Level progression, booster usage, and difficulty analytics' },
    idle: { name: 'Idle / Clicker', description: 'Prestige mechanics, offline earnings, and session patterns' },
    battle_royale: { name: 'Battle Royale', description: 'Match rankings, weapon meta, and competitive metrics' },
    match3_meta: { name: 'Match-3 + Meta', description: 'Story progression, decoration choices, and engagement loops' },
    gacha_rpg: { name: 'Gacha RPG', description: 'Banner performance, spender tiers, and hero collection metrics' },
    other: { name: 'Custom Game', description: 'Generic analytics with retention, revenue, and funnel metrics' },
};

export function UploadPage() {
    const navigate = useNavigate();
    const { addGameData } = useData();
    const { showError, success } = useToast();
    const [step, setStep] = useState<Step>('upload');
    const [fileInfo, setFileInfo] = useState<{ name: string; rows: number } | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [analysisResult, setAnalysisResult] = useState<SchemaAnalysisResult | null>(null);
    const [detectedTemplate, setDetectedTemplate] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHowItWorks, setShowHowItWorks] = useState(true);
    const [showHints, setShowHints] = useState(true);

    const apiKey = getStoredApiKey();

    const handleFileLoaded = async (result: ImportResult, file?: File) => {
        setImportResult(result);
        setFileInfo({
            name: file?.name || result.metadata.fileName || 'Imported data',
            rows: result.rowCount,
        });
        setError(null);

        // Check for template match
        const template = detectTemplate(result.columns);
        if (template) {
            setDetectedTemplate(template.name);
        }

        // Go to preview step
        setStep('preview');
        setShowHowItWorks(false); // Hide onboarding after first file
    };

    const handleTryExampleData = (datasetId: string) => {
        try {
            const result = generateSampleData(datasetId);
            const dataset = sampleDatasets.find((d) => d.id === datasetId);
            handleFileLoaded(result);
            if (dataset) {
                setFileInfo({
                    name: `${dataset.name} (Sample)`,
                    rows: result.rowCount,
                });
            }
        } catch (err) {
            const parsed = parseError(err);
            setError(parsed.message);
        }
    };

    const handleContinueToAnalysis = async () => {
        if (!importResult) return;

        setStep('analyzing');
        setError(null);

        try {
            const analysis = await analyzeSchema(importResult.data, apiKey ? { apiKey } : undefined);
            setAnalysisResult(analysis);
            setStep('review');
        } catch (err) {
            console.error('Analysis failed:', err);
            const parsed = parseError(err);
            setError(parsed.message);
            showError(err, () => handleContinueToAnalysis());
            setStep('preview');
        }
    };

    const handleColumnsUpdate = (columns: ColumnMapping[]) => {
        if (analysisResult) {
            setAnalysisResult({ ...analysisResult, columns });
        }
    };

    const handleConfirm = async () => {
        if (!importResult || !analysisResult || !fileInfo) return;

        setError(null);

        try {
            // Map column type to expected format
            const mapDataType = (type: string): 'string' | 'number' | 'boolean' | 'date' => {
                switch (type) {
                    case 'number':
                        return 'number';
                    case 'boolean':
                        return 'boolean';
                    case 'date':
                        return 'date';
                    default:
                        return 'string';
                }
            };

            // Save to DataContext
            await addGameData({
                name: fileInfo.name.replace(/\.[^/.]+$/, ''), // Remove file extension
                type: (analysisResult.gameType as GameCategory) || 'custom',
                uploadedAt: new Date().toISOString(),
                fileName: fileInfo.name,
                columnMappings: analysisResult.columns.map((col) => ({
                    originalName: col.original,
                    canonicalName: col.canonical || col.original,
                    role: col.role,
                    dataType: mapDataType(col.type),
                })),
                rawData: importResult.data,
                rowCount: importResult.rowCount,
            });

            // Show success toast and navigate to analytics page
            success('Data imported successfully', `${importResult.rowCount.toLocaleString()} rows loaded`);
            navigate('/analytics');
        } catch (err) {
            console.error('Failed to save data:', err);
            const parsed = parseError(err);
            setError(parsed.message);
            showError(err, handleConfirm);
        }
    };

    const handleStartOver = () => {
        setStep('upload');
        setImportResult(null);
        setAnalysisResult(null);
        setFileInfo(null);
        setDetectedTemplate(null);
        setError(null);
        setShowHowItWorks(true);
    };

    // Calculate confidence display for analysis results
    const getConfidenceDisplay = (confidence: number) => {
        if (confidence >= 0.8) return { label: 'High', color: 'text-[#7A8B5B]', bg: 'bg-[#7A8B5B]/10' };
        if (confidence >= 0.6) return { label: 'Medium', color: 'text-[#E5A84B]', bg: 'bg-[#E5A84B]/10' };
        return { label: 'Low', color: 'text-[#E25C5C]', bg: 'bg-[#E25C5C]/10' };
    };

    // Get role icon
    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'identifier':
                return <Target className="w-3 h-3" />;
            case 'timestamp':
                return <FileSpreadsheet className="w-3 h-3" />;
            case 'metric':
                return <Gauge className="w-3 h-3" />;
            case 'dimension':
                return <Columns className="w-3 h-3" />;
            default:
                return <Info className="w-3 h-3" />;
        }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
            {/* Page Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/20 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-[#DA7756]" />
                    </div>
                </motion.div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-white">Upload Data</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Import your game analytics data for AI-powered analysis</p>
                </div>
            </motion.div>

            {/* How It Works Section */}
            <AnimatePresence>
                {showHowItWorks && step === 'upload' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-700 overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                            <Lightbulb className="w-5 h-5 text-[#DA7756]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">How It Works</h3>
                                            <p className="text-sm text-slate-500">4 simple steps to analyze your game data</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowHowItWorks(false)}
                                        className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
                                    >
                                        Hide
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[
                                        {
                                            step: 1,
                                            icon: FileSpreadsheet,
                                            title: 'Upload File',
                                            description: 'Upload your CSV, Excel, or JSON file with game analytics data',
                                        },
                                        {
                                            step: 2,
                                            icon: TableProperties,
                                            title: 'Preview Data',
                                            description: 'Review your data structure and quality before analysis',
                                        },
                                        {
                                            step: 3,
                                            icon: Wand2,
                                            title: 'AI Analysis',
                                            description: 'Our AI detects game type and maps columns automatically',
                                        },
                                        {
                                            step: 4,
                                            icon: CheckCircle,
                                            title: 'Review & Confirm',
                                            description: 'Verify mappings and customize as needed before import',
                                        },
                                    ].map((item, index) => (
                                        <motion.div
                                            key={item.step}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 + 0.2 }}
                                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-[#DA7756]/20 text-[#DA7756] flex items-center justify-center text-xs font-bold">
                                                    {item.step}
                                                </div>
                                                <item.icon className="w-4 h-4 text-[#DA7756]" />
                                            </div>
                                            <h4 className="font-medium text-white text-sm mb-1">{item.title}</h4>
                                            <p className="text-xs text-slate-500">{item.description}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Try Example Data Section */}
            <AnimatePresence>
                {step === 'upload' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative bg-gradient-to-br from-[#DA7756]/5 to-[#C15F3C]/5 rounded-2xl p-4 border border-[#DA7756]/10"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center flex-shrink-0">
                                <Play className="w-4 h-4 text-[#DA7756]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[#DA7756] font-medium text-sm mb-2">Try Example Data</p>
                                <p className="text-xs text-slate-500 mb-3">
                                    See how Game Insights works with sample datasets - no upload required
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {sampleDatasets.map((dataset) => (
                                        <button
                                            key={dataset.id}
                                            onClick={() => handleTryExampleData(dataset.id)}
                                            className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/50 hover:border-[#DA7756]/30 transition-all"
                                            title={dataset.description}
                                        >
                                            {dataset.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-800/50">
                                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                        <Download className="w-3 h-3" />
                                        Or download comprehensive sample CSVs (700-850 rows each):
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { name: 'Puzzle Game', file: 'puzzle_game_analytics.csv' },
                                            { name: 'Idle Clicker', file: 'idle_clicker_analytics.csv' },
                                            { name: 'Battle Royale', file: 'battle_royale_analytics.csv' },
                                            { name: 'Gacha RPG', file: 'gacha_rpg_analytics.csv' },
                                            { name: 'Match3 Meta', file: 'match3_meta_analytics.csv' },
                                        ].map((sample) => (
                                            <a
                                                key={sample.file}
                                                href={`/sample-data/${sample.file}`}
                                                download={sample.file}
                                                className="px-2 py-1 text-xs bg-slate-800/30 hover:bg-slate-800/50 text-slate-400 hover:text-slate-300 rounded border border-slate-700/30 hover:border-slate-600/50 transition-all flex items-center gap-1"
                                            >
                                                <Download className="w-3 h-3" />
                                                {sample.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* API Key Warning */}
            <AnimatePresence>
                {!apiKey && step !== 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative bg-gradient-to-br from-[#E5A84B]/10 to-[#C49840]/5  rounded-2xl p-4 border border-[#E5A84B]/20 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <div className="relative flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#E5A84B]/20 border border-[#E5A84B]/30 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-4 h-4 text-[#E5A84B]" />
                            </div>
                            <div>
                                <p className="text-[#E5A84B] font-medium">No API key configured</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Add your OpenAI API key in{' '}
                                    <a href="/settings" className="text-[#DA7756] hover:text-[#C15F3C] transition-colors">
                                        Settings
                                    </a>{' '}
                                    for better column detection. Without it, we'll use pattern matching only.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Steps */}
            <motion.div variants={itemVariants} className="flex items-center gap-2 sm:gap-4">
                <StepIndicator number={1} label="Upload" active={step === 'upload'} complete={step !== 'upload'} />
                <ChevronRight className="w-4 h-4 text-slate-700" />
                <StepIndicator
                    number={2}
                    label="Preview"
                    active={step === 'preview'}
                    complete={['analyzing', 'review', 'complete'].includes(step)}
                />
                <ChevronRight className="w-4 h-4 text-slate-700" />
                <StepIndicator
                    number={3}
                    label="Analyze"
                    active={step === 'analyzing'}
                    complete={step === 'review' || step === 'complete'}
                />
                <ChevronRight className="w-4 h-4 text-slate-700" />
                <StepIndicator number={4} label="Review" active={step === 'review'} complete={step === 'complete'} />
            </motion.div>

            {/* Step-specific hints */}
            <AnimatePresence>
                {showHints && step !== 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <button
                                onClick={() => setShowHints(!showHints)}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-[#DA7756]" />
                                    <span className="text-sm font-medium text-slate-300">{stepHints[step].title}</span>
                                </div>
                                {showHints ? (
                                    <ChevronUp className="w-4 h-4 text-slate-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                )}
                            </button>
                            <motion.ul
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 space-y-2 pl-6"
                            >
                                {stepHints[step].hints.map((hint, index) => (
                                    <li key={index} className="text-xs text-slate-500 list-disc">
                                        {hint}
                                    </li>
                                ))}
                            </motion.ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content based on step */}
            <AnimatePresence mode="wait">
                {step === 'upload' && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <UploadZone onFileLoaded={handleFileLoaded} />
                    </motion.div>
                )}

                {step === 'preview' && importResult && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Template Detection */}
                        {detectedTemplate && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative bg-gradient-to-br from-[#DA7756]/10 to-[#C15F3C]/5  rounded-2xl p-4 border border-[#DA7756]/20 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                                <div className="relative flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#DA7756]/20 border border-[#DA7756]/30 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-[#DA7756]" />
                                    </div>
                                    <div>
                                        <p className="text-[#DA7756] font-medium">Detected: {detectedTemplate}</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            We recognized this format and will apply optimized column mappings.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Data Preview */}
                        <DataPreview result={importResult} />

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                            <Button variant="ghost" onClick={handleStartOver}>
                                Start Over
                            </Button>
                            <Button
                                variant="primary"
                                icon={<ArrowRight className="w-4 h-4" />}
                                iconPosition="right"
                                onClick={handleContinueToAnalysis}
                            >
                                Continue to Analysis
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'analyzing' && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="relative bg-slate-900  rounded-2xl p-12 border border-slate-700 overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-[#DA7756]/30 rounded-2xl"
                            />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border border-[#DA7756]/30 flex items-center justify-center mb-6"
                            >
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Sparkles className="w-8 h-8 text-[#DA7756]" />
                                </motion.div>
                            </motion.div>
                        </div>
                        <h3 className="text-lg font-semibold text-white">Analyzing your data</h3>
                        <p className="text-slate-500 mt-2 max-w-md">
                            {apiKey ? 'Using AI to understand your column structure...' : 'Using pattern matching to detect columns...'}
                        </p>
                        {fileInfo && (
                            <p className="text-sm text-slate-600 mt-4 font-mono">
                                {fileInfo.name} - {fileInfo.rows.toLocaleString()} rows
                            </p>
                        )}

                        {/* Analysis progress indicators */}
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {stepHints.analyzing.hints.map((hint, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.5 }}
                                    className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded"
                                >
                                    {hint}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'review' && analysisResult && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Enhanced Analysis Summary */}
                        <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-700 overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                            <div className="relative space-y-4">
                                {/* Game Type Detection */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#DA7756]/20 border border-[#DA7756]/30 flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-[#DA7756]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-lg">
                                                {gameTypeDescriptions[analysisResult.gameType]?.name || 'Custom Game'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {gameTypeDescriptions[analysisResult.gameType]?.description || 'Generic analytics'}
                                            </p>
                                        </div>
                                    </div>
                                    {analysisResult.warnings.length > 0 && (
                                        <span className="text-xs text-[#E5A84B] bg-[#E5A84B]/10 border border-[#E5A84B]/20 px-3 py-1.5 rounded-full font-medium">
                                            {analysisResult.warnings.length} warning{analysisResult.warnings.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                                    {/* Data Quality */}
                                    <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Gauge className="w-4 h-4 text-[#DA7756]" />
                                            <span className="text-xs text-slate-500 uppercase tracking-wide">Data Quality</span>
                                        </div>
                                        <p className={`text-xl font-bold ${
                                            analysisResult.dataQuality >= 0.8 ? 'text-[#7A8B5B]' :
                                            analysisResult.dataQuality >= 0.6 ? 'text-[#E5A84B]' : 'text-[#E25C5C]'
                                        }`}>
                                            {Math.round(analysisResult.dataQuality * 100)}%
                                        </p>
                                    </div>

                                    {/* Columns Detected */}
                                    <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Columns className="w-4 h-4 text-[#DA7756]" />
                                            <span className="text-xs text-slate-500 uppercase tracking-wide">Columns</span>
                                        </div>
                                        <p className="text-xl font-bold text-white">{analysisResult.columns.length}</p>
                                    </div>

                                    {/* Avg Confidence */}
                                    <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Target className="w-4 h-4 text-[#DA7756]" />
                                            <span className="text-xs text-slate-500 uppercase tracking-wide">Confidence</span>
                                        </div>
                                        {(() => {
                                            const avgConfidence = analysisResult.columns.reduce((sum, col) => sum + col.confidence, 0) / analysisResult.columns.length;
                                            const display = getConfidenceDisplay(avgConfidence);
                                            return (
                                                <p className={`text-xl font-bold ${display.color}`}>
                                                    {display.label}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Detected Columns Summary */}
                                <div className="pt-4 border-t border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Detected Column Roles</p>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.columns.map((col) => {
                                            const display = getConfidenceDisplay(col.confidence);
                                            return (
                                                <div
                                                    key={col.original}
                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${display.bg} border border-slate-700/50`}
                                                    title={`${col.original} -> ${col.canonical} (${col.role}, ${Math.round(col.confidence * 100)}% confidence)`}
                                                >
                                                    <span className={display.color}>{getRoleIcon(col.role)}</span>
                                                    <span className="text-slate-300 truncate max-w-[120px]">{col.original}</span>
                                                    <span className="text-slate-500">as</span>
                                                    <span className="text-[#DA7756] font-medium">{col.role}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Data Quality Explanation */}
                                <div className="pt-4 border-t border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Quality Score Breakdown</p>
                                    <div className="text-xs text-slate-400 space-y-1">
                                        <p>
                                            The data quality score ({Math.round(analysisResult.dataQuality * 100)}%) is based on:
                                        </p>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            <li>Completeness: How many cells have valid, non-null values</li>
                                            <li>Consistency: Data types match expected patterns (dates, numbers, etc.)</li>
                                            <li>Column detection: How confidently we mapped columns to standard roles</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column Mapper */}
                        <ColumnMapper columns={analysisResult.columns} onUpdate={handleColumnsUpdate} onConfirm={handleConfirm} />

                        {/* Back button */}
                        <div className="flex">
                            <Button variant="ghost" onClick={() => setStep('preview')}>
                                Back to Preview
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'complete' && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="relative bg-slate-900  rounded-2xl p-12 border border-[#DA7756]/20 overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <div className="relative">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-[#DA7756]/30 rounded-2xl" />
                                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DA7756]/30 to-[#C15F3C]/20 border border-[#DA7756]/40 flex items-center justify-center mb-6">
                                    <CheckCircle className="w-8 h-8 text-[#DA7756]" />
                                </div>
                            </motion.div>
                        </div>
                        <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg font-semibold text-white"
                        >
                            Data Ready!
                        </motion.h3>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-slate-500 mt-2"
                        >
                            Your data has been processed and is ready for AI analysis.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-4 mt-6"
                        >
                            <Button variant="ghost" onClick={handleStartOver}>
                                Upload Another
                            </Button>
                            <Button variant="primary" icon={<Sparkles className="w-4 h-4" />} onClick={() => navigate('/analytics')}>
                                View Analytics
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative bg-gradient-to-br from-[#E25C5C]/10 to-[#E25C5C]/5  rounded-2xl p-4 border border-[#E25C5C]/20 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <p className="relative text-[#E25C5C]">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function StepIndicator({ number, label, active, complete }: { number: number; label: string; active: boolean; complete: boolean }) {
    return (
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2">
            <motion.div
                animate={{
                    scale: active ? [1, 1.1, 1] : 1,
                    boxShadow: active ? '0 0 20px rgba(218, 119, 86, 0.3)' : 'none',
                }}
                transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
                className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${
                        active
                            ? 'bg-[#DA7756] text-white'
                            : complete
                              ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                              : 'bg-slate-800/50 text-slate-500 border border-slate-800'
                    }
                `}
            >
                {complete && !active ? <CheckCircle className="w-4 h-4" /> : number}
            </motion.div>
            <span className={`text-sm hidden sm:inline ${active ? 'text-white font-medium' : 'text-slate-500'}`}>{label}</span>
        </motion.div>
    );
}

export default UploadPage;
