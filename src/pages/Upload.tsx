/**
 * Upload Page - Enhanced data upload with multi-format support
 * Phase 8: Enhanced error handling with user-friendly messages
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
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

type Step = 'upload' | 'preview' | 'analyzing' | 'review' | 'complete';

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
            rows: result.rowCount
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
            const analysis = await analyzeSchema(
                importResult.data,
                apiKey ? { apiKey } : undefined
            );
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
                    case 'number': return 'number';
                    case 'boolean': return 'boolean';
                    case 'date': return 'date';
                    default: return 'string';
                }
            };

            // Save to DataContext
            await addGameData({
                name: fileInfo.name.replace(/\.[^/.]+$/, ''), // Remove file extension
                type: (analysisResult.gameType as GameCategory) || 'custom',
                uploadedAt: new Date().toISOString(),
                fileName: fileInfo.name,
                columnMappings: analysisResult.columns.map(col => ({
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
        <div className="space-y-6 max-w-4xl">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Upload Data</h1>
                <p className="text-zinc-500 mt-1">
                    Import your game analytics data for AI-powered analysis
                </p>
            </div>

            {/* API Key Warning */}
            {!apiKey && step !== 'complete' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-card p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-yellow-500 font-medium">No API key configured</p>
                        <p className="text-sm text-zinc-400 mt-1">
                            Add your OpenAI API key in{' '}
                            <a href="/settings" className="text-accent-primary hover:underline">Settings</a>
                            {' '}for better column detection. Without it, we'll use pattern matching only.
                        </p>
                    </div>
                </div>
            )}

            {/* Progress Steps */}
            <div className="flex items-center gap-4">
                <StepIndicator number={1} label="Upload" active={step === 'upload'} complete={step !== 'upload'} />
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <StepIndicator number={2} label="Preview" active={step === 'preview'} complete={['analyzing', 'review', 'complete'].includes(step)} />
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <StepIndicator number={3} label="Analyze" active={step === 'analyzing'} complete={step === 'review' || step === 'complete'} />
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <StepIndicator number={4} label="Review" active={step === 'review'} complete={step === 'complete'} />
            </div>

            {/* Content based on step */}
            {step === 'upload' && (
                <UploadZone onFileLoaded={handleFileLoaded} />
            )}

            {step === 'preview' && importResult && (
                <div className="space-y-6">
                    {/* Template Detection */}
                    {detectedTemplate && (
                        <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-card p-4 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-accent-primary font-medium">
                                    Detected: {detectedTemplate}
                                </p>
                                <p className="text-sm text-zinc-400 mt-1">
                                    We recognized this format and will apply optimized column mappings.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Data Preview */}
                    <DataPreview result={importResult} />

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                        <button
                            onClick={handleStartOver}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Start Over
                        </button>
                        <button
                            onClick={handleContinueToAnalysis}
                            className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                        >
                            Continue to Analysis
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 'analyzing' && (
                <div className="bg-bg-card rounded-card p-12 border border-white/[0.06] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center mb-4 animate-pulse">
                        <Sparkles className="w-8 h-8 text-accent-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Analyzing your data</h3>
                    <p className="text-zinc-500 mt-2 max-w-md">
                        {apiKey
                            ? 'Using AI to understand your column structure...'
                            : 'Using pattern matching to detect columns...'}
                    </p>
                    {fileInfo && (
                        <p className="text-sm text-zinc-600 mt-4">
                            {fileInfo.name} • {fileInfo.rows.toLocaleString()} rows
                        </p>
                    )}
                </div>
            )}

            {step === 'review' && analysisResult && (
                <div className="space-y-6">
                    {/* Analysis Summary */}
                    <div className="bg-bg-card rounded-card p-4 border border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-accent-primary" />
                            </div>
                            <div>
                                <p className="text-white font-medium">
                                    Detected: <span className="text-accent-primary">{analysisResult.gameType.replace('_', ' ')}</span> game
                                </p>
                                <p className="text-sm text-zinc-500">
                                    {analysisResult.columns.length} columns •
                                    Data quality: {Math.round(analysisResult.dataQuality * 100)}%
                                </p>
                            </div>
                        </div>
                        {analysisResult.warnings.length > 0 && (
                            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                                {analysisResult.warnings.length} warning{analysisResult.warnings.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Column Mapper */}
                    <ColumnMapper
                        columns={analysisResult.columns}
                        onUpdate={handleColumnsUpdate}
                        onConfirm={handleConfirm}
                    />

                    {/* Back button */}
                    <div className="flex">
                        <button
                            onClick={() => setStep('preview')}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            ← Back to Preview
                        </button>
                    </div>
                </div>
            )}

            {step === 'complete' && (
                <div className="bg-bg-card rounded-card p-12 border border-green-500/20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Data Ready!</h3>
                    <p className="text-zinc-500 mt-2">
                        Your data has been processed and is ready for AI analysis.
                    </p>
                    <div className="flex items-center gap-4 mt-6">
                        <button
                            onClick={handleStartOver}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Upload Another
                        </button>
                        <button
                            onClick={() => navigate('/analytics')}
                            className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            View Analytics
                        </button>
                    </div>
                </div>
            )}

            {/* Error display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-card p-4 text-red-500">
                    {error}
                </div>
            )}
        </div>
    );
}

function StepIndicator({
    number,
    label,
    active,
    complete
}: {
    number: number;
    label: string;
    active: boolean;
    complete: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${active ? 'bg-accent-primary text-white' :
                    complete ? 'bg-green-500 text-white' :
                        'bg-bg-elevated text-zinc-500'}
            `}>
                {complete && !active ? '✓' : number}
            </div>
            <span className={`text-sm ${active ? 'text-white' : 'text-zinc-500'}`}>
                {label}
            </span>
        </div>
    );
}

export default UploadPage;
