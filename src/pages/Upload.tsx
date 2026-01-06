/**
 * Upload Page - Obsidian Analytics Design
 *
 * Premium upload experience with:
 * - Animated step indicators
 * - Glassmorphism cards
 * - Emerald accent theme
 * - Framer Motion transitions
 * - Enhanced error handling
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, AlertTriangle, CheckCircle, Upload, ChevronRight } from 'lucide-react';
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
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-emerald-400" />
                    </div>
                </motion.div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-white">Upload Data</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Import your game analytics data for AI-powered analysis</p>
                </div>
            </motion.div>

            {/* API Key Warning */}
            <AnimatePresence>
                {!apiKey && step !== 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-xl rounded-2xl p-4 border border-amber-500/20 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <div className="relative flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-amber-400 font-medium">No API key configured</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Add your OpenAI API key in{' '}
                                    <a href="/settings" className="text-emerald-400 hover:text-emerald-300 transition-colors">
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
                                className="relative bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-xl rounded-2xl p-4 border border-emerald-500/20 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                                <div className="relative flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-emerald-400 font-medium">Detected: {detectedTemplate}</p>
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
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
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
                        className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl p-12 border border-white/[0.08] overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-xl"
                            />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mb-6"
                            >
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Sparkles className="w-8 h-8 text-emerald-400" />
                                </motion.div>
                            </motion.div>
                        </div>
                        <h3 className="text-lg font-semibold text-white">Analyzing your data</h3>
                        <p className="text-slate-500 mt-2 max-w-md">
                            {apiKey ? 'Using AI to understand your column structure...' : 'Using pattern matching to detect columns...'}
                        </p>
                        {fileInfo && (
                            <p className="text-sm text-slate-600 mt-4 font-mono">
                                {fileInfo.name} • {fileInfo.rows.toLocaleString()} rows
                            </p>
                        )}
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
                        {/* Analysis Summary */}
                        <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            Detected: <span className="text-emerald-400">{analysisResult.gameType.replace('_', ' ')}</span> game
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {analysisResult.columns.length} columns • Data quality:{' '}
                                            <span className="text-emerald-400 font-mono">{Math.round(analysisResult.dataQuality * 100)}%</span>
                                        </p>
                                    </div>
                                </div>
                                {analysisResult.warnings.length > 0 && (
                                    <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full font-medium">
                                        {analysisResult.warnings.length} warning{analysisResult.warnings.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Column Mapper */}
                        <ColumnMapper columns={analysisResult.columns} onUpdate={handleColumnsUpdate} onConfirm={handleConfirm} />

                        {/* Back button */}
                        <div className="flex">
                            <Button variant="ghost" onClick={() => setStep('preview')}>
                                ← Back to Preview
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
                        className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl p-12 border border-emerald-500/20 overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <div className="relative">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-xl" />
                                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center mb-6">
                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
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
                        className="relative bg-gradient-to-br from-rose-500/10 to-rose-600/5 backdrop-blur-xl rounded-2xl p-4 border border-rose-500/20 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                        <p className="relative text-rose-400">{error}</p>
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
                    boxShadow: active ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
                }}
                transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
                className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${
                        active
                            ? 'bg-emerald-500 text-white'
                            : complete
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800/50 text-slate-500 border border-white/[0.06]'
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
