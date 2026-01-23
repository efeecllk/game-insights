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
    Download,
} from 'lucide-react';
import { UploadZone } from '../components/upload/UploadZone';
import { ColumnMapper } from '../components/upload/ColumnMapper';
import { DataPreview } from '../components/upload/DataPreview';
import { AnalysisInsights } from '../components/upload/AnalysisInsights';
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
                    <div className="relative w-14 h-14 rounded-2xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-th-accent-primary" />
                    </div>
                </motion.div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-th-text-primary">Upload Data</h1>
                    <p className="text-sm text-th-text-muted mt-0.5">Import your game analytics data for AI-powered analysis</p>
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
                        <div className="relative bg-th-bg-surface rounded-2xl p-6 border border-th-border-subtle overflow-hidden">
                            <div className="relative">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                                            <Lightbulb className="w-5 h-5 text-th-accent-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-th-text-primary">How It Works</h3>
                                            <p className="text-sm text-th-text-muted">4 simple steps to analyze your game data</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowHowItWorks(false)}
                                        className="text-th-text-muted hover:text-th-text-secondary transition-colors text-sm"
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
                                            className="bg-th-bg-elevated/50 rounded-xl p-4 border border-th-border-subtle"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-th-accent-primary-muted text-th-accent-primary flex items-center justify-center text-xs font-bold">
                                                    {item.step}
                                                </div>
                                                <item.icon className="w-4 h-4 text-th-accent-primary" />
                                            </div>
                                            <h4 className="font-medium text-th-text-primary text-sm mb-1">{item.title}</h4>
                                            <p className="text-xs text-th-text-muted">{item.description}</p>
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
                        className="relative bg-th-bg-surface rounded-2xl p-4 border border-th-border-subtle"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                <Play className="w-4 h-4 text-th-accent-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-th-accent-primary font-medium text-sm mb-2">Try Example Data</p>
                                <p className="text-xs text-th-text-muted mb-3">
                                    See how Game Insights works with sample datasets - no upload required
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {sampleDatasets.map((dataset) => (
                                        <button
                                            key={dataset.id}
                                            onClick={() => handleTryExampleData(dataset.id)}
                                            className="px-3 py-1.5 text-xs bg-th-bg-elevated/50 hover:bg-th-bg-elevated text-th-text-secondary hover:text-th-text-primary rounded-lg border border-th-border-subtle hover:border-th-accent-primary/30 transition-all"
                                            title={dataset.description}
                                        >
                                            {dataset.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-th-border-subtle">
                                    <p className="text-xs text-th-text-muted mb-2 flex items-center gap-1">
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
                                                className="px-2 py-1 text-xs bg-th-bg-elevated/30 hover:bg-th-bg-elevated/50 text-th-text-muted hover:text-th-text-secondary rounded border border-th-border-subtle hover:border-th-border transition-all flex items-center gap-1"
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
                        className="relative bg-th-warning-muted rounded-2xl p-4 border border-th-warning/20 overflow-hidden"
                    >
                        <div className="relative flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-th-warning-muted border border-th-warning/30 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-4 h-4 text-th-warning" />
                            </div>
                            <div>
                                <p className="text-th-warning font-medium">No API key configured</p>
                                <p className="text-sm text-th-text-secondary mt-1">
                                    Add your OpenAI API key in{' '}
                                    <a href="/settings" className="text-th-accent-primary hover:text-th-accent-primary-hover transition-colors">
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
                <ChevronRight className="w-4 h-4 text-th-border" />
                <StepIndicator
                    number={2}
                    label="Preview"
                    active={step === 'preview'}
                    complete={['analyzing', 'review', 'complete'].includes(step)}
                />
                <ChevronRight className="w-4 h-4 text-th-border" />
                <StepIndicator
                    number={3}
                    label="Analyze"
                    active={step === 'analyzing'}
                    complete={step === 'review' || step === 'complete'}
                />
                <ChevronRight className="w-4 h-4 text-th-border" />
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
                        <div className="bg-th-bg-elevated/30 rounded-xl p-4 border border-th-border-subtle">
                            <button
                                onClick={() => setShowHints(!showHints)}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-th-accent-primary" />
                                    <span className="text-sm font-medium text-th-text-secondary">{stepHints[step].title}</span>
                                </div>
                                {showHints ? (
                                    <ChevronUp className="w-4 h-4 text-th-text-muted" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-th-text-muted" />
                                )}
                            </button>
                            <motion.ul
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 space-y-2 pl-6"
                            >
                                {stepHints[step].hints.map((hint, index) => (
                                    <li key={index} className="text-xs text-th-text-muted list-disc">
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
                                className="relative bg-th-accent-primary-muted rounded-2xl p-4 border border-th-accent-primary/20 overflow-hidden"
                            >
                                <div className="relative flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-th-accent-primary-muted border border-th-accent-primary/30 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-th-accent-primary" />
                                    </div>
                                    <div>
                                        <p className="text-th-accent-primary font-medium">Detected: {detectedTemplate}</p>
                                        <p className="text-sm text-th-text-secondary mt-1">
                                            We recognized this format and will apply optimized column mappings.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Data Preview */}
                        <DataPreview result={importResult} />

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-th-border-subtle">
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
                        className="relative bg-th-bg-surface rounded-2xl p-12 border border-th-border-subtle overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-th-accent-primary/20 rounded-2xl"
                            />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="relative w-16 h-16 rounded-2xl bg-th-accent-primary-muted border border-th-accent-primary/30 flex items-center justify-center mb-6"
                            >
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Sparkles className="w-8 h-8 text-th-accent-primary" />
                                </motion.div>
                            </motion.div>
                        </div>
                        <h3 className="text-lg font-semibold text-th-text-primary">Analyzing your data</h3>
                        <p className="text-th-text-muted mt-2 max-w-md">
                            {apiKey ? 'Using AI to understand your column structure...' : 'Using pattern matching to detect columns...'}
                        </p>
                        {fileInfo && (
                            <p className="text-sm text-th-text-disabled mt-4 font-mono">
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
                                    className="text-xs text-th-text-muted bg-th-bg-elevated/50 px-2 py-1 rounded"
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
                        {/* AI Analysis Insights */}
                        <AnalysisInsights
                            analysis={analysisResult}
                            rowCount={importResult?.rowCount || 0}
                        />

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
                        className="relative bg-th-bg-surface rounded-2xl p-12 border border-th-accent-primary/20 overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                        <div className="relative">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                className="relative"
                            >
                                <div className="relative w-16 h-16 rounded-2xl bg-th-accent-primary-muted border border-th-accent-primary/30 flex items-center justify-center mb-6">
                                    <CheckCircle className="w-8 h-8 text-th-accent-primary" />
                                </div>
                            </motion.div>
                        </div>
                        <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg font-semibold text-th-text-primary"
                        >
                            Data Ready!
                        </motion.h3>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-th-text-muted mt-2"
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
                        className="relative bg-th-error-muted rounded-2xl p-4 border border-th-error/20 overflow-hidden"
                    >
                        <p className="relative text-th-error">{error}</p>
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
                    scale: active ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
                className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${
                        active
                            ? 'bg-th-accent-primary text-white'
                            : complete
                              ? 'bg-th-accent-primary-muted text-th-accent-primary border border-th-accent-primary/30'
                              : 'bg-th-bg-elevated/50 text-th-text-muted border border-th-border-subtle'
                    }
                `}
            >
                {complete && !active ? <CheckCircle className="w-4 h-4" /> : number}
            </motion.div>
            <span className={`text-sm hidden sm:inline ${active ? 'text-th-text-primary font-medium' : 'text-th-text-muted'}`}>{label}</span>
        </motion.div>
    );
}

export default UploadPage;
