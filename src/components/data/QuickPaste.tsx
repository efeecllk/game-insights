/**
 * Quick Paste Component - Obsidian Analytics Design
 *
 * Paste tabular data directly with:
 * - Glassmorphism containers
 * - Warm orange accent colors (#DA7756)
 * - Framer Motion animations
 * - Step-by-step wizard flow
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clipboard,
    Check,
    X,
    ChevronRight,
    AlertCircle,
    Loader2,
    Sparkles,
    Eye,
    FileSpreadsheet,
    Table2,
    Trash2,
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

type DataFormat = 'tsv' | 'csv' | 'json' | 'unknown';

interface PasteStep {
    step: 'paste' | 'preview' | 'mapping' | 'complete';
}

interface ParsedData {
    format: DataFormat;
    rows: Record<string, unknown>[];
    columns: string[];
    preview: Record<string, unknown>[];
    rawText: string;
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

export function QuickPaste({
    onComplete,
    onCancel,
}: {
    onComplete?: () => void;
    onCancel?: () => void;
}) {
    const { addGameData } = useData();
    const [currentStep, setCurrentStep] = useState<PasteStep['step']>('paste');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pastedText, setPastedText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [columnMeanings, setColumnMeanings] = useState<ColumnMeaning[]>([]);
    const [dataName, setDataName] = useState('');

    // Detect data format
    const detectFormat = (text: string): DataFormat => {
        const trimmed = text.trim();

        // Check for JSON
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                JSON.parse(trimmed);
                return 'json';
            } catch {
                // Not valid JSON
            }
        }

        // Check for TSV (tabs are common from Excel/Sheets copy)
        const lines = trimmed.split('\n');
        if (lines.length > 0) {
            const firstLine = lines[0];
            const tabCount = (firstLine.match(/\t/g) || []).length;
            const commaCount = (firstLine.match(/,/g) || []).length;

            if (tabCount > 0 && tabCount >= commaCount) {
                return 'tsv';
            }
            if (commaCount > 0) {
                return 'csv';
            }
        }

        return 'unknown';
    };

    // Parse pasted text
    const parseText = useCallback((text: string): ParsedData | null => {
        const format = detectFormat(text);
        let rows: Record<string, unknown>[] = [];

        try {
            if (format === 'json') {
                const parsed = JSON.parse(text.trim());
                rows = Array.isArray(parsed) ? parsed : [parsed];
            } else if (format === 'tsv') {
                rows = parseTSV(text);
            } else if (format === 'csv') {
                rows = parseCSV(text);
            } else {
                // Try TSV as fallback
                rows = parseTSV(text);
                if (rows.length === 0 || Object.keys(rows[0] || {}).length <= 1) {
                    // Try CSV
                    rows = parseCSV(text);
                }
            }

            if (rows.length === 0) {
                return null;
            }

            const columns = Object.keys(rows[0]);
            const preview = rows.slice(0, 5);

            return {
                format: format === 'unknown' ? (rows.length > 0 ? 'tsv' : 'unknown') : format,
                rows,
                columns,
                preview,
                rawText: text,
            };
        } catch {
            return null;
        }
    }, []);

    // Parse TSV
    const parseTSV = (text: string): Record<string, unknown>[] => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split('\t').map(h => h.trim());
        const rows: Record<string, unknown>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split('\t');
            const row: Record<string, unknown> = {};
            headers.forEach((header, idx) => {
                const value = values[idx]?.trim() || '';
                const num = parseFloat(value);
                row[header] = !isNaN(num) && value !== '' ? num : value;
            });
            rows.push(row);
        }

        return rows;
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

    // Handle paste from clipboard button
    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setPastedText(text);
                processText(text);
            }
        } catch {
            setError('Unable to read from clipboard. Please paste manually using Ctrl/Cmd+V.');
        }
    };

    // Process pasted text
    const processText = async (text: string) => {
        if (!text.trim()) {
            setError('Please paste some data first.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const parsed = parseText(text);

            if (!parsed || parsed.rows.length === 0) {
                throw new Error('Could not parse the pasted data. Please ensure it\'s in a tabular format (CSV, TSV, or JSON).');
            }

            setParsedData(parsed);
            setDataName(`Pasted Data ${new Date().toLocaleDateString()}`);

            // Analyze columns
            const schemaInfo = {
                columns: parsed.columns.map(name => ({
                    name,
                    type: (typeof parsed.rows[0]?.[name] === 'number' ? 'number' : 'string') as 'string' | 'number' | 'boolean' | 'date' | 'unknown',
                    nullable: parsed.preview.some(row => row[name] === null || row[name] === undefined || row[name] === ''),
                    sampleValues: parsed.preview.map(row => row[name]).filter(v => v != null && v !== '').slice(0, 5),
                })),
                rowCount: parsed.rows.length,
                sampleData: parsed.preview,
            };
            const meanings = schemaAnalyzer.analyze(schemaInfo);
            setColumnMeanings(meanings);

            setCurrentStep('preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse data');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle process button click
    const handleProcess = () => {
        processText(pastedText);
    };

    // Handle import
    const handleImport = async () => {
        if (!parsedData) return;

        setIsProcessing(true);
        try {
            const columnMappings = columnMeanings.map(m => ({
                originalName: m.column,
                canonicalName: m.semanticType,
                role: inferRole(m.semanticType) as 'identifier' | 'timestamp' | 'metric' | 'dimension' | 'noise' | 'unknown',
                dataType: (m.detectedType === 'number' ? 'number' : 'string') as 'string' | 'number' | 'boolean' | 'date',
            }));

            await addGameData({
                name: dataName,
                fileName: `pasted-${parsedData.format}-${Date.now()}.txt`,
                rawData: parsedData.rows,
                uploadedAt: new Date().toISOString(),
                type: 'custom',
                columnMappings,
                rowCount: parsedData.rows.length,
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
        setParsedData(null);
        setPastedText('');
        setColumnMeanings([]);
        setDataName('');
        setError(null);
        setCurrentStep('paste');
    };

    // Format badge
    const getFormatBadge = (format: DataFormat) => {
        const badges = {
            tsv: { label: 'Tab-Separated', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            csv: { label: 'Comma-Separated', color: 'bg-[#DA7756]/10 text-[#DA7756] border-[#DA7756]/20' },
            json: { label: 'JSON', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
            unknown: { label: 'Unknown', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
        };
        return badges[format];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Clipboard className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Quick Paste</h3>
                        <p className="text-sm text-slate-400">
                            {currentStep === 'paste' && 'Paste data from Excel, Sheets, or any table'}
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
            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    {['paste', 'preview', 'mapping', 'complete'].map((step, idx) => (
                        <div key={step} className="flex items-center gap-2">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                                    currentStep === step
                                        ? 'bg-[#DA7756] text-white'
                                        : ['paste', 'preview', 'mapping', 'complete'].indexOf(currentStep) > idx
                                        ? 'bg-[#DA7756]/20 text-[#DA7756]'
                                        : 'bg-white/[0.06] text-slate-500'
                                }`}
                            >
                                {['paste', 'preview', 'mapping', 'complete'].indexOf(currentStep) > idx ? (
                                    <Check className="w-3 h-3" />
                                ) : (
                                    idx + 1
                                )}
                            </div>
                            {idx < 3 && (
                                <div
                                    className={`w-8 h-0.5 rounded-full transition-colors ${
                                        ['paste', 'preview', 'mapping', 'complete'].indexOf(currentStep) > idx
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
                    {/* Step: Paste */}
                    {currentStep === 'paste' && (
                        <motion.div key="paste" {...stepTransition}>
                            <PasteStepContent
                                pastedText={pastedText}
                                onTextChange={setPastedText}
                                isProcessing={isProcessing}
                                error={error}
                                onProcess={handleProcess}
                                onPasteFromClipboard={handlePasteFromClipboard}
                                onClear={() => { setPastedText(''); setError(null); }}
                            />
                        </motion.div>
                    )}

                    {/* Step: Preview */}
                    {currentStep === 'preview' && parsedData && (
                        <motion.div key="preview" {...stepTransition}>
                            <PreviewStepContent
                                parsedData={parsedData}
                                dataName={dataName}
                                onDataNameChange={setDataName}
                                onContinue={() => setCurrentStep('mapping')}
                                onBack={handleReset}
                                getFormatBadge={getFormatBadge}
                            />
                        </motion.div>
                    )}

                    {/* Step: Mapping */}
                    {currentStep === 'mapping' && parsedData && (
                        <motion.div key="mapping" {...stepTransition}>
                            <MappingStepContent
                                columns={parsedData.columns}
                                columnMeanings={columnMeanings}
                                isProcessing={isProcessing}
                                error={error}
                                onImport={handleImport}
                                onBack={() => setCurrentStep('preview')}
                            />
                        </motion.div>
                    )}

                    {/* Step: Complete */}
                    {currentStep === 'complete' && parsedData && (
                        <motion.div key="complete" {...stepTransition}>
                            <CompleteStepContent
                                format={parsedData.format}
                                dataName={dataName}
                                rowCount={parsedData.rows.length}
                                onViewAnalytics={onComplete}
                                onPasteMore={handleReset}
                                getFormatBadge={getFormatBadge}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function PasteStepContent({
    pastedText,
    onTextChange,
    isProcessing,
    error,
    onProcess,
    onPasteFromClipboard,
    onClear,
}: {
    pastedText: string;
    onTextChange: (text: string) => void;
    isProcessing: boolean;
    error: string | null;
    onProcess: () => void;
    onPasteFromClipboard: () => void;
    onClear: () => void;
}) {
    const hasText = pastedText.trim().length > 0;
    const lineCount = pastedText.split('\n').filter(l => l.trim()).length;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* Instructions */}
            <motion.div
                variants={itemVariants}
                className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl"
            >
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <Table2 className="w-4 h-4 text-violet-400" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-white font-medium">
                        Copy data from any spreadsheet
                    </p>
                    <p className="text-sm text-slate-400">
                        Select your data in Excel, Google Sheets, or any table and paste it here.
                        Headers should be in the first row.
                    </p>
                </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div variants={itemVariants} className="flex items-center gap-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onPasteFromClipboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] rounded-lg text-white transition-all"
                >
                    <Clipboard className="w-4 h-4" />
                    Paste from Clipboard
                </motion.button>
                {hasText && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClear}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </motion.button>
                )}
            </motion.div>

            {/* Textarea */}
            <motion.div variants={itemVariants} className="relative">
                <textarea
                    autoFocus
                    value={pastedText}
                    onChange={(e) => onTextChange(e.target.value)}
                    placeholder="Paste your data here...&#10;&#10;Example:&#10;user_id&#9;date&#9;revenue&#10;user_001&#9;2025-01-01&#9;4.99&#10;user_002&#9;2025-01-01&#9;9.99"
                    className="w-full h-64 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                    spellCheck={false}
                />
                {hasText && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-3 right-3 text-xs text-slate-500 bg-slate-800/80 px-2 py-1 rounded-md"
                    >
                        {lineCount} line{lineCount !== 1 ? 's' : ''}
                    </motion.div>
                )}
            </motion.div>

            {/* Supported formats */}
            <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs text-slate-500">
                <span>Supported formats:</span>
                <span className="px-2 py-1 bg-white/[0.03] border border-white/[0.06] rounded-md">Tab-separated (Excel)</span>
                <span className="px-2 py-1 bg-white/[0.03] border border-white/[0.06] rounded-md">CSV</span>
                <span className="px-2 py-1 bg-white/[0.03] border border-white/[0.06] rounded-md">JSON Array</span>
            </motion.div>

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

            {/* Process button */}
            <motion.div variants={itemVariants} className="flex justify-end pt-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onProcess}
                    disabled={!hasText || isProcessing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#DA7756] hover:bg-[#C15F3C] text-white rounded-xl font-medium shadow-lg shadow-[#DA7756]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <ChevronRight className="w-4 h-4" />
                            Process Data
                        </>
                    )}
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

function PreviewStepContent({
    parsedData,
    dataName,
    onDataNameChange,
    onContinue,
    onBack,
    getFormatBadge,
}: {
    parsedData: ParsedData;
    dataName: string;
    onDataNameChange: (name: string) => void;
    onContinue: () => void;
    onBack: () => void;
    getFormatBadge: (format: DataFormat) => { label: string; color: string };
}) {
    const badge = getFormatBadge(parsedData.format);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Success info */}
            <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 p-3 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-xl"
            >
                <div className="w-8 h-8 rounded-lg bg-[#DA7756]/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#DA7756]" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[#DA7756] font-medium">Data parsed successfully</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${badge.color}`}>
                        {badge.label}
                    </span>
                </div>
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
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
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
                        {parsedData.rows.length.toLocaleString()} rows × {parsedData.columns.length} columns
                    </span>
                </div>
                <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-white/[0.03]">
                            <tr>
                                {parsedData.columns.map((col) => (
                                    <th
                                        key={col}
                                        className="px-4 py-2.5 text-left text-slate-400 font-medium border-b border-white/[0.06] whitespace-nowrap"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {parsedData.preview.map((row, idx) => (
                                <tr key={idx} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                                    {parsedData.columns.map((col) => (
                                        <td
                                            key={col}
                                            className="px-4 py-2.5 text-slate-300 whitespace-nowrap max-w-[200px] truncate"
                                        >
                                            {row[col] === null || row[col] === undefined || row[col] === '' ? (
                                                <span className="text-slate-600 italic">empty</span>
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
                className="flex items-center justify-between pt-4 border-t border-white/[0.06]"
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#DA7756] hover:bg-[#C15F3C] text-white rounded-xl font-medium shadow-lg shadow-[#DA7756]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-white/[0.03]">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-slate-400 font-medium border-b border-white/[0.06]">
                                    Your Column
                                </th>
                                <th className="px-4 py-2.5 text-left text-slate-400 font-medium border-b border-white/[0.06]">
                                    Detected Type
                                </th>
                                <th className="px-4 py-2.5 text-left text-slate-400 font-medium border-b border-white/[0.06]">
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
                                        className={`border-b border-white/[0.04] last:border-0 ${
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
                                                        : 'bg-white/[0.03] text-slate-300 border-white/[0.08]'
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
                className="flex items-center justify-between pt-4 border-t border-white/[0.06]"
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#DA7756] hover:bg-[#C15F3C] text-white rounded-xl font-medium shadow-lg shadow-[#DA7756]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    format,
    dataName,
    rowCount,
    onViewAnalytics,
    onPasteMore,
    getFormatBadge,
}: {
    format: DataFormat;
    dataName: string;
    rowCount: number;
    onViewAnalytics?: () => void;
    onPasteMore: () => void;
    getFormatBadge: (format: DataFormat) => { label: string; color: string };
}) {
    const badge = getFormatBadge(format);

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
                <div className="absolute inset-0 bg-[#DA7756]/20 rounded-2xl blur-xl" />
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
                Your pasted data is ready for analysis
            </motion.p>

            {/* Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6 text-left max-w-md mx-auto"
            >
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Format</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${badge.color}`}>
                            {badge.label}
                        </span>
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
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#DA7756] hover:bg-[#C15F3C] text-white rounded-xl font-medium shadow-lg shadow-[#DA7756]/20 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        View Analytics
                    </motion.button>
                )}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onPasteMore}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-xl font-medium border border-white/[0.08] hover:border-white/[0.12] transition-all"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Paste More Data
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

export default QuickPaste;
