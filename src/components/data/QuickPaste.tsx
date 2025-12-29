/**
 * Quick Paste Component
 * Paste tabular data directly from clipboard
 * Phase 3: Data Sources
 */

import { useState, useCallback } from 'react';
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
            tsv: { label: 'Tab-Separated', color: 'bg-blue-500/10 text-blue-400' },
            csv: { label: 'Comma-Separated', color: 'bg-green-500/10 text-green-400' },
            json: { label: 'JSON', color: 'bg-purple-500/10 text-purple-400' },
            unknown: { label: 'Unknown', color: 'bg-gray-500/10 text-gray-400' },
        };
        return badges[format];
    };

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-th-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Clipboard className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-th-text-primary">Quick Paste</h3>
                        <p className="text-sm text-th-text-muted">
                            {currentStep === 'paste' && 'Paste data from Excel, Sheets, or any table'}
                            {currentStep === 'preview' && 'Review your data'}
                            {currentStep === 'mapping' && 'Verify column mappings'}
                            {currentStep === 'complete' && 'Import complete!'}
                        </p>
                    </div>
                </div>
                {onCancel && currentStep !== 'complete' && (
                    <button
                        onClick={onCancel}
                        className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-th-interactive-hover rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Step: Paste */}
                {currentStep === 'paste' && (
                    <PasteStep
                        pastedText={pastedText}
                        onTextChange={setPastedText}
                        isProcessing={isProcessing}
                        error={error}
                        onProcess={handleProcess}
                        onPasteFromClipboard={handlePasteFromClipboard}
                        onClear={() => { setPastedText(''); setError(null); }}
                    />
                )}

                {/* Step: Preview */}
                {currentStep === 'preview' && parsedData && (
                    <PreviewStep
                        parsedData={parsedData}
                        dataName={dataName}
                        onDataNameChange={setDataName}
                        onContinue={() => setCurrentStep('mapping')}
                        onBack={handleReset}
                        getFormatBadge={getFormatBadge}
                    />
                )}

                {/* Step: Mapping */}
                {currentStep === 'mapping' && parsedData && (
                    <MappingStep
                        columns={parsedData.columns}
                        columnMeanings={columnMeanings}
                        isProcessing={isProcessing}
                        error={error}
                        onImport={handleImport}
                        onBack={() => setCurrentStep('preview')}
                    />
                )}

                {/* Step: Complete */}
                {currentStep === 'complete' && parsedData && (
                    <CompleteStep
                        format={parsedData.format}
                        dataName={dataName}
                        rowCount={parsedData.rows.length}
                        onViewAnalytics={onComplete}
                        onPasteMore={handleReset}
                        getFormatBadge={getFormatBadge}
                    />
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function PasteStep({
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
        <div className="space-y-4">
            {/* Instructions */}
            <div className="flex items-start gap-3 p-4 bg-th-bg-elevated rounded-xl">
                <Table2 className="w-5 h-5 text-th-accent-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                    <p className="text-sm text-th-text-primary font-medium">
                        Copy data from any spreadsheet
                    </p>
                    <p className="text-sm text-th-text-muted">
                        Select your data in Excel, Google Sheets, or any table and paste it here.
                        Headers should be in the first row.
                    </p>
                </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onPasteFromClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-th-bg-elevated hover:bg-th-interactive-hover rounded-lg border border-th-border transition-colors"
                >
                    <Clipboard className="w-4 h-4" />
                    Paste from Clipboard
                </button>
                {hasText && (
                    <button
                        onClick={onClear}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-th-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Textarea */}
            <div className="relative">
                <textarea
                    autoFocus
                    value={pastedText}
                    onChange={(e) => onTextChange(e.target.value)}
                    placeholder="Paste your data here...&#10;&#10;Example:&#10;user_id&#9;date&#9;revenue&#10;user_001&#9;2025-01-01&#9;4.99&#10;user_002&#9;2025-01-01&#9;9.99"
                    className="w-full h-64 px-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted font-mono text-sm resize-none focus:outline-none focus:border-th-accent-primary transition-colors"
                    spellCheck={false}
                />
                {hasText && (
                    <div className="absolute bottom-3 right-3 text-xs text-th-text-muted bg-th-bg-elevated px-2 py-1 rounded">
                        {lineCount} line{lineCount !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Supported formats */}
            <div className="flex items-center gap-2 text-xs text-th-text-muted">
                <span>Supported formats:</span>
                <span className="px-2 py-0.5 bg-th-bg-elevated rounded">Tab-separated (Excel)</span>
                <span className="px-2 py-0.5 bg-th-bg-elevated rounded">CSV</span>
                <span className="px-2 py-0.5 bg-th-bg-elevated rounded">JSON Array</span>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Process button */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={onProcess}
                    disabled={!hasText || isProcessing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-th-accent-primary text-white rounded-xl font-medium hover:bg-th-accent-primary-hover disabled:opacity-50 transition-colors"
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
                </button>
            </div>
        </div>
    );
}

function PreviewStep({
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
        <div className="space-y-6">
            {/* Success info */}
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Check className="w-5 h-5 text-green-500" />
                <div className="flex items-center gap-2">
                    <span className="text-sm text-green-400">Data parsed successfully</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
                        {badge.label}
                    </span>
                </div>
            </div>

            {/* Data name input */}
            <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">
                    Name your data source
                </label>
                <input
                    type="text"
                    value={dataName}
                    onChange={(e) => onDataNameChange(e.target.value)}
                    placeholder="e.g., Player Events January 2025"
                    className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary transition-colors"
                />
            </div>

            {/* Preview table */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview (first 5 rows)
                    </h4>
                    <span className="text-xs text-th-text-muted">
                        {parsedData.rows.length.toLocaleString()} rows × {parsedData.columns.length} columns
                    </span>
                </div>
                <div className="overflow-x-auto border border-th-border rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-th-bg-elevated">
                            <tr>
                                {parsedData.columns.map((col) => (
                                    <th
                                        key={col}
                                        className="px-4 py-2 text-left text-th-text-muted font-medium border-b border-th-border whitespace-nowrap"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {parsedData.preview.map((row, idx) => (
                                <tr key={idx} className="border-b border-th-border last:border-0">
                                    {parsedData.columns.map((col) => (
                                        <td
                                            key={col}
                                            className="px-4 py-2 text-th-text-secondary whitespace-nowrap max-w-[200px] truncate"
                                        >
                                            {row[col] === null || row[col] === undefined || row[col] === '' ? (
                                                <span className="text-th-text-muted italic">empty</span>
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
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-th-border">
                <button
                    onClick={onBack}
                    className="text-sm text-th-text-muted hover:text-th-text-primary transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={onContinue}
                    disabled={!dataName.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-th-accent-primary text-white rounded-xl font-medium hover:bg-th-accent-primary-hover disabled:opacity-50 transition-colors"
                >
                    Continue to Column Mapping
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function MappingStep({
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
        if (confidence >= 0.9) return 'text-green-400';
        if (confidence >= 0.7) return 'text-yellow-400';
        return 'text-orange-400';
    };

    const getConfidenceBar = (confidence: number) => {
        const width = Math.round(confidence * 100);
        return (
            <div className="w-20 h-1.5 bg-th-bg-elevated rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${
                        confidence >= 0.9
                            ? 'bg-green-500'
                            : confidence >= 0.7
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                    }`}
                    style={{ width: `${width}%` }}
                />
            </div>
        );
    };

    const unknownCount = columnMeanings.filter((m) => m.semanticType === 'unknown').length;

    return (
        <div className="space-y-6">
            {/* AI Badge */}
            <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-purple-400">
                    AI-assisted column detection
                </span>
            </div>

            {/* Column mappings */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-th-text-secondary">
                    Detected column types
                </h4>
                <div className="border border-th-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-th-bg-elevated">
                            <tr>
                                <th className="px-4 py-2 text-left text-th-text-muted font-medium border-b border-th-border">
                                    Your Column
                                </th>
                                <th className="px-4 py-2 text-left text-th-text-muted font-medium border-b border-th-border">
                                    Detected Type
                                </th>
                                <th className="px-4 py-2 text-left text-th-text-muted font-medium border-b border-th-border">
                                    Confidence
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col) => {
                                const meaning = getMeaning(col);
                                const isUnknown = meaning?.semanticType === 'unknown';
                                return (
                                    <tr
                                        key={col}
                                        className={`border-b border-th-border last:border-0 ${
                                            isUnknown ? 'bg-yellow-500/5' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-th-text-primary font-medium">
                                            {isUnknown && (
                                                <AlertCircle className="w-4 h-4 text-yellow-500 inline mr-2" />
                                            )}
                                            {col}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                    isUnknown
                                                        ? 'bg-yellow-500/10 text-yellow-400'
                                                        : 'bg-th-bg-elevated text-th-text-secondary'
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
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Warning for unknown columns */}
            {unknownCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-400">
                        {unknownCount} column{unknownCount > 1 ? 's' : ''} couldn't be automatically detected.
                        They will be imported as-is and you can manually configure them later.
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-th-border">
                <button
                    onClick={onBack}
                    className="text-sm text-th-text-muted hover:text-th-text-primary transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={onImport}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-th-accent-primary text-white rounded-xl font-medium hover:bg-th-accent-primary-hover disabled:opacity-50 transition-colors"
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
                </button>
            </div>
        </div>
    );
}

function CompleteStep({
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
        <div className="text-center py-6">
            {/* Success icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
            </div>

            <h3 className="text-xl font-semibold text-th-text-primary mb-2">
                Data imported successfully!
            </h3>
            <p className="text-th-text-muted mb-6">
                Your pasted data is ready for analysis
            </p>

            {/* Summary */}
            <div className="bg-th-bg-elevated rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-th-text-muted">Format</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
                            {badge.label}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-th-text-muted">Name</span>
                        <span className="text-th-text-primary font-medium">{dataName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-th-text-muted">Rows imported</span>
                        <span className="text-th-text-primary font-medium">{rowCount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
                {onViewAnalytics && (
                    <button
                        onClick={onViewAnalytics}
                        className="flex items-center gap-2 px-5 py-2.5 bg-th-accent-primary text-white rounded-xl font-medium hover:bg-th-accent-primary-hover transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        View Analytics
                    </button>
                )}
                <button
                    onClick={onPasteMore}
                    className="flex items-center gap-2 px-5 py-2.5 bg-th-bg-elevated text-th-text-primary rounded-xl font-medium border border-th-border hover:bg-th-interactive-hover transition-colors"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Paste More Data
                </button>
            </div>
        </div>
    );
}

export default QuickPaste;
