/**
 * Inline Upload Component - Obsidian Analytics Design
 *
 * Drag & drop file upload with:
 * - Glassmorphism containers
 * - Emerald accent colors
 * - Framer Motion animations
 * - Smart column mapping
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileSpreadsheet,
    Check,
    X,
    ChevronRight,
    AlertCircle,
    Loader2,
    Sparkles,
    Eye,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { schemaAnalyzer, ColumnMeaning } from '../../ai/SchemaAnalyzer';

// ============================================================================
// Types
// ============================================================================

// Helper to infer role from semantic type
function inferRole(semanticType: string): string {
    const identifiers = ['user_id', 'session_id', 'device_id', 'event_id'];
    const timestamps = ['timestamp', 'date', 'install_date', 'first_open'];
    const metrics = ['revenue', 'dau', 'mau', 'arpu', 'ltv', 'retention_day', 'session_duration', 'level', 'score'];

    if (identifiers.includes(semanticType)) return 'identifier';
    if (timestamps.includes(semanticType)) return 'timestamp';
    if (metrics.includes(semanticType)) return 'metric';
    if (semanticType === 'unknown') return 'unknown';
    return 'dimension';
}

interface UploadStep {
    step: 'dropzone' | 'preview' | 'mapping' | 'complete';
}

interface ParsedFile {
    fileName: string;
    rows: Record<string, unknown>[];
    columns: string[];
    preview: Record<string, unknown>[];
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

const stepTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
};

// ============================================================================
// Main Component
// ============================================================================

export function InlineUpload({
    onComplete,
    onCancel,
}: {
    onComplete?: () => void;
    onCancel?: () => void;
}) {
    const { addGameData } = useData();
    const [currentStep, setCurrentStep] = useState<UploadStep['step']>('dropzone');
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
    const [columnMeanings, setColumnMeanings] = useState<ColumnMeaning[]>([]);
    const [dataName, setDataName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file drop
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const file = e.dataTransfer.files[0];
        if (file) {
            await processFile(file);
        }
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await processFile(file);
        }
    }, []);

    // Process uploaded file
    const processFile = async (file: File) => {
        setIsProcessing(true);
        setError(null);

        try {
            const extension = file.name.split('.').pop()?.toLowerCase();

            if (!['csv', 'json', 'xlsx', 'xls'].includes(extension || '')) {
                throw new Error('Unsupported file format. Please use CSV, JSON, or Excel.');
            }

            let rows: Record<string, unknown>[] = [];

            if (extension === 'json') {
                const text = await file.text();
                const parsed = JSON.parse(text);
                rows = Array.isArray(parsed) ? parsed : [parsed];
            } else if (extension === 'csv') {
                const text = await file.text();
                rows = parseCSV(text);
            } else {
                // For Excel, we'll use a simplified approach
                throw new Error('Excel files require the xlsx library. Please use CSV or JSON for now.');
            }

            if (rows.length === 0) {
                throw new Error('No data found in file.');
            }

            const columns = Object.keys(rows[0]);
            const preview = rows.slice(0, 5);

            setParsedFile({
                fileName: file.name,
                rows,
                columns,
                preview,
            });

            setDataName(file.name.replace(/\.[^/.]+$/, ''));

            // Analyze columns
            const schemaInfo = {
                columns: columns.map(name => ({
                    name,
                    type: (typeof rows[0]?.[name] === 'number' ? 'number' : 'string') as 'string' | 'number' | 'boolean' | 'date' | 'unknown',
                    nullable: preview.some(row => row[name] === null || row[name] === undefined),
                    sampleValues: preview.map(row => row[name]).filter(v => v != null).slice(0, 5),
                })),
                rowCount: rows.length,
                sampleData: preview,
            };
            const meanings = schemaAnalyzer.analyze(schemaInfo);
            setColumnMeanings(meanings);

            setCurrentStep('preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file');
        } finally {
            setIsProcessing(false);
        }
    };

    // Parse CSV
    const parseCSV = (text: string): Record<string, unknown>[] => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = parseCSVLine(lines[0]);
        const rows: Record<string, unknown>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row: Record<string, unknown> = {};
            headers.forEach((header, idx) => {
                const value = values[idx]?.trim() || '';
                // Try to parse as number
                const num = parseFloat(value);
                row[header] = !isNaN(num) && value !== '' ? num : value;
            });
            rows.push(row);
        }

        return rows;
    };

    // Parse CSV line handling quotes
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Handle import
    const handleImport = async () => {
        if (!parsedFile) return;

        setIsProcessing(true);
        try {
            // Convert column meanings to column mappings
            const columnMappings = columnMeanings.map(m => ({
                originalName: m.column,
                canonicalName: m.semanticType,
                role: inferRole(m.semanticType) as 'identifier' | 'timestamp' | 'metric' | 'dimension' | 'noise' | 'unknown',
                dataType: (m.detectedType === 'number' ? 'number' : 'string') as 'string' | 'number' | 'boolean' | 'date',
            }));

            await addGameData({
                name: dataName,
                fileName: parsedFile.fileName,
                rawData: parsedFile.rows,
                uploadedAt: new Date().toISOString(),
                type: 'custom',
                columnMappings,
                rowCount: parsedFile.rows.length,
            });
            setCurrentStep('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import data');
        } finally {
            setIsProcessing(false);
        }
    };

    // Reset
    const handleReset = () => {
        setParsedFile(null);
        setColumnMeanings([]);
        setDataName('');
        setError(null);
        setCurrentStep('dropzone');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-slate-900  rounded-2xl border border-slate-700 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Upload File</h3>
                        <p className="text-sm text-slate-400">
                            {currentStep === 'dropzone' && 'Drag & drop or select a file'}
                            {currentStep === 'preview' && 'Review your data'}
                            {currentStep === 'mapping' && 'Verify column mappings'}
                            {currentStep === 'complete' && 'Import complete!'}
                        </p>
                    </div>
                </div>
                {onCancel && currentStep !== 'complete' && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onCancel}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>
                )}
            </div>

            {/* Step Indicator */}
            <div className="px-5 py-3 border-b border-slate-800 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    {['dropzone', 'preview', 'mapping', 'complete'].map((step, idx) => (
                        <div key={step} className="flex items-center gap-2">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                                    currentStep === step
                                        ? 'bg-[#DA7756] text-white'
                                        : ['dropzone', 'preview', 'mapping', 'complete'].indexOf(currentStep) > idx
                                        ? 'bg-[#DA7756]/20 text-[#DA7756]'
                                        : 'bg-white/[0.06] text-slate-500'
                                }`}
                            >
                                {['dropzone', 'preview', 'mapping', 'complete'].indexOf(currentStep) > idx ? (
                                    <Check className="w-3 h-3" />
                                ) : (
                                    idx + 1
                                )}
                            </div>
                            {idx < 3 && (
                                <div
                                    className={`w-8 h-0.5 rounded-full transition-colors ${
                                        ['dropzone', 'preview', 'mapping', 'complete'].indexOf(currentStep) > idx
                                            ? 'bg-[#DA7756]/50'
                                            : 'bg-white/[0.06]'
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {/* Step: Dropzone */}
                    {currentStep === 'dropzone' && (
                        <motion.div key="dropzone" {...stepTransition}>
                            <DropZone
                                isDragging={isDragging}
                                isProcessing={isProcessing}
                                error={error}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            />
                        </motion.div>
                    )}

                    {/* Step: Preview */}
                    {currentStep === 'preview' && parsedFile && (
                        <motion.div key="preview" {...stepTransition}>
                            <PreviewStepContent
                                parsedFile={parsedFile}
                                dataName={dataName}
                                onDataNameChange={setDataName}
                                onContinue={() => setCurrentStep('mapping')}
                                onBack={handleReset}
                            />
                        </motion.div>
                    )}

                    {/* Step: Mapping */}
                    {currentStep === 'mapping' && parsedFile && (
                        <motion.div key="mapping" {...stepTransition}>
                            <MappingStepContent
                                columns={parsedFile.columns}
                                columnMeanings={columnMeanings}
                                isProcessing={isProcessing}
                                error={error}
                                onImport={handleImport}
                                onBack={() => setCurrentStep('preview')}
                            />
                        </motion.div>
                    )}

                    {/* Step: Complete */}
                    {currentStep === 'complete' && parsedFile && (
                        <motion.div key="complete" {...stepTransition}>
                            <CompleteStepContent
                                fileName={parsedFile.fileName}
                                dataName={dataName}
                                rowCount={parsedFile.rows.length}
                                onViewAnalytics={onComplete}
                                onUploadMore={handleReset}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
            />
        </motion.div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function DropZone({
    isDragging,
    isProcessing,
    error,
    onDragOver,
    onDragLeave,
    onDrop,
    onClick,
}: {
    isDragging: boolean;
    isProcessing: boolean;
    error: string | null;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onClick: () => void;
}) {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            <motion.div
                variants={itemVariants}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={onClick}
                whileHover={{ scale: 1.01 }}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    isDragging
                        ? 'border-[#DA7756] bg-[#DA7756]/5'
                        : 'border-white/[0.12] hover:border-white/[0.2] hover:bg-white/[0.02]'
                }`}
            >
                {isProcessing ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-[#DA7756] animate-spin mb-4" />
                        <p className="text-white font-medium">Processing file...</p>
                    </div>
                ) : (
                    <>
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="relative w-16 h-16 mx-auto mb-4"
                        >
                            <div className="absolute inset-0 bg-blue-500/20 rounded-2xl" />
                            <div className="relative w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <FileSpreadsheet className="w-8 h-8 text-blue-400" />
                            </div>
                        </motion.div>
                        <p className="text-white font-medium mb-1">
                            Drag & drop your file here
                        </p>
                        <p className="text-sm text-slate-400 mb-4">
                            or click to browse
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                            <span className="px-2 py-1 bg-white/[0.03] border border-slate-800 rounded-md">CSV</span>
                            <span className="px-2 py-1 bg-white/[0.03] border border-slate-800 rounded-md">JSON</span>
                            <span className="px-2 py-1 bg-white/[0.03] border border-slate-800 rounded-md">Excel</span>
                        </div>
                    </>
                )}
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl"
                    >
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-300">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function PreviewStepContent({
    parsedFile,
    dataName,
    onDataNameChange,
    onContinue,
    onBack,
}: {
    parsedFile: ParsedFile;
    dataName: string;
    onDataNameChange: (name: string) => void;
    onContinue: () => void;
    onBack: () => void;
}) {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* File info */}
            <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 p-3 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-xl"
            >
                <div className="w-8 h-8 rounded-lg bg-[#DA7756]/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#DA7756]" />
                </div>
                <span className="text-sm text-[#DA7756] font-medium">
                    File loaded: {parsedFile.fileName}
                </span>
            </motion.div>

            {/* Data name input */}
            <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name your data source
                </label>
                <input
                    type="text"
                    value={dataName}
                    onChange={(e) => onDataNameChange(e.target.value)}
                    placeholder="e.g., Player Events January 2025"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                />
            </motion.div>

            {/* Preview table */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        Preview (first 5 rows)
                    </h4>
                    <span className="text-xs text-slate-500">
                        {parsedFile.rows.length.toLocaleString()} rows × {parsedFile.columns.length} columns
                    </span>
                </div>
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-white/[0.03]">
                            <tr>
                                {parsedFile.columns.map((col) => (
                                    <th
                                        key={col}
                                        className="px-4 py-2.5 text-left text-slate-400 font-medium border-b border-slate-800 whitespace-nowrap"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {parsedFile.preview.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-800 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    {parsedFile.columns.map((col) => (
                                        <td
                                            key={col}
                                            className="px-4 py-2.5 text-slate-300 whitespace-nowrap max-w-[200px] truncate"
                                        >
                                            {row[col] === null || row[col] === undefined ? (
                                                <span className="text-slate-600 italic">null</span>
                                            ) : (
                                                String(row[col])
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                variants={itemVariants}
                className="flex items-center justify-between pt-4 border-t border-slate-800"
            >
                <motion.button
                    whileHover={{ x: -4 }}
                    onClick={onBack}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                    ← Back
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onContinue}
                    disabled={!dataName.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#DA7756] hover:bg-[#C15F3C] text-white rounded-xl font-medium  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue to Column Mapping
                    <ChevronRight className="w-4 h-4" />
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

function MappingStepContent({
    columns,
    columnMeanings,
    isProcessing,
    error,
    onImport,
    onBack,
}: {
    columns: string[];
    columnMeanings: ColumnMeaning[];
    isProcessing: boolean;
    error: string | null;
    onImport: () => void;
    onBack: () => void;
}) {
    const getMeaning = (col: string) => columnMeanings.find((m) => m.column === col);

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return 'text-[#DA7756]';
        if (confidence >= 0.7) return 'text-amber-400';
        return 'text-[#C15F3C]';
    };

    const getConfidenceBar = (confidence: number) => {
        const width = Math.round(confidence * 100);
        return (
            <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                        confidence >= 0.9
                            ? 'bg-[#DA7756]'
                            : confidence >= 0.7
                            ? 'bg-amber-500'
                            : 'bg-[#C15F3C]'
                    }`}
                />
            </div>
        );
    };

    const unknownCount = columnMeanings.filter((m) => m.semanticType === 'unknown').length;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* AI Badge */}
            <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl"
            >
                <Sparkles className="w-5 h-5 text-violet-400" />
                <span className="text-sm text-violet-300 font-medium">
                    AI-assisted column detection
                </span>
            </motion.div>

            {/* Column mappings */}
            <motion.div variants={itemVariants} className="space-y-3">
                <h4 className="text-sm font-medium text-slate-300">
                    Detected column types
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-white/[0.03]">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-slate-400 font-medium border-b border-slate-800">
                                    Your Column
                                </th>
                                <th className="px-4 py-2.5 text-left text-slate-400 font-medium border-b border-slate-800">
                                    Detected Type
                                </th>
                                <th className="px-4 py-2.5 text-left text-slate-400 font-medium border-b border-slate-800">
                                    Confidence
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col, idx) => {
                                const meaning = getMeaning(col);
                                const isUnknown = meaning?.semanticType === 'unknown';
                                return (
                                    <motion.tr
                                        key={col}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`border-b border-slate-800 last:border-0 ${
                                            isUnknown ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'
                                        } transition-colors`}
                                    >
                                        <td className="px-4 py-3 text-white font-medium">
                                            {isUnknown && (
                                                <AlertCircle className="w-4 h-4 text-amber-500 inline mr-2" />
                                            )}
                                            {col}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded-md text-xs font-medium border ${
                                                    isUnknown
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        : 'bg-white/[0.03] text-slate-300 border-slate-700'
                                                }`}
                                            >
                                                {meaning?.semanticType || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {getConfidenceBar(meaning?.confidence || 0)}
                                                <span
                                                    className={`text-xs font-medium ${getConfidenceColor(
                                                        meaning?.confidence || 0
                                                    )}`}
                                                >
                                                    {Math.round((meaning?.confidence || 0) * 100)}%
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Warning for unknown columns */}
            <AnimatePresence>
                {unknownCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                    >
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-300">
                            {unknownCount} column{unknownCount > 1 ? 's' : ''} couldn't be automatically detected.
                            They will be imported as-is and you can manually configure them later.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl"
                    >
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-300">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <motion.div
                variants={itemVariants}
                className="flex items-center justify-between pt-4 border-t border-slate-800"
            >
                <motion.button
                    whileHover={{ x: -4 }}
                    onClick={onBack}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                    ← Back
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onImport}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#DA7756] hover:bg-[#C15F3C] text-white rounded-xl font-medium  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            Import Data
                        </>
                    )}
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

function CompleteStepContent({
    fileName,
    dataName,
    rowCount,
    onViewAnalytics,
    onUploadMore,
}: {
    fileName: string;
    dataName: string;
    rowCount: number;
    onViewAnalytics?: () => void;
    onUploadMore: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="text-center py-6"
        >
            {/* Success icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="relative w-16 h-16 mx-auto mb-4"
            >
                <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#DA7756]" />
                </div>
            </motion.div>

            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold text-white mb-2"
            >
                Data imported successfully!
            </motion.h3>
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-400 mb-6"
            >
                Your data is ready for analysis
            </motion.p>

            {/* Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/[0.02] border border-slate-800 rounded-xl p-4 mb-6 text-left max-w-md mx-auto"
            >
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">File</span>
                        <span className="text-white font-medium">{fileName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Name</span>
                        <span className="text-white font-medium">{dataName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Rows imported</span>
                        <span className="text-white font-medium">{rowCount.toLocaleString()}</span>
                    </div>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-3"
            >
                {onViewAnalytics && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onViewAnalytics}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#DA7756] hover:bg-[#C15F3C] text-white rounded-xl font-medium  transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        View Analytics
                    </motion.button>
                )}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onUploadMore}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-xl font-medium border border-slate-700 hover:border-slate-600 transition-all"
                >
                    <Upload className="w-4 h-4" />
                    Upload More Data
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

export default InlineUpload;
