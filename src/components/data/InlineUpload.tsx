/**
 * Inline Upload Component
 * Drag & drop file upload with preview and smart column mapping
 * Phase 3: Data Sources
 */

import { useState, useCallback, useRef } from 'react';
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
        <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-th-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-th-text-primary">Upload File</h3>
                        <p className="text-sm text-th-text-muted">
                            {currentStep === 'dropzone' && 'Drag & drop or select a file'}
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
                {/* Step: Dropzone */}
                {currentStep === 'dropzone' && (
                    <DropZone
                        isDragging={isDragging}
                        isProcessing={isProcessing}
                        error={error}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    />
                )}

                {/* Step: Preview */}
                {currentStep === 'preview' && parsedFile && (
                    <PreviewStep
                        parsedFile={parsedFile}
                        dataName={dataName}
                        onDataNameChange={setDataName}
                        onContinue={() => setCurrentStep('mapping')}
                        onBack={handleReset}
                    />
                )}

                {/* Step: Mapping */}
                {currentStep === 'mapping' && parsedFile && (
                    <MappingStep
                        columns={parsedFile.columns}
                        columnMeanings={columnMeanings}
                        isProcessing={isProcessing}
                        error={error}
                        onImport={handleImport}
                        onBack={() => setCurrentStep('preview')}
                    />
                )}

                {/* Step: Complete */}
                {currentStep === 'complete' && parsedFile && (
                    <CompleteStep
                        fileName={parsedFile.fileName}
                        dataName={dataName}
                        rowCount={parsedFile.rows.length}
                        onViewAnalytics={onComplete}
                        onUploadMore={handleReset}
                    />
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
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
        <div className="space-y-4">
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={onClick}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                    isDragging
                        ? 'border-th-accent-primary bg-th-accent-primary/5'
                        : 'border-th-border hover:border-th-text-muted hover:bg-th-bg-elevated'
                }`}
            >
                {isProcessing ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-th-accent-primary animate-spin mb-4" />
                        <p className="text-th-text-secondary font-medium">Processing file...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <FileSpreadsheet className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-th-text-primary font-medium mb-1">
                            Drag & drop your file here
                        </p>
                        <p className="text-sm text-th-text-muted mb-4">
                            or click to browse
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-th-text-muted">
                            <span className="px-2 py-1 bg-th-bg-elevated rounded">CSV</span>
                            <span className="px-2 py-1 bg-th-bg-elevated rounded">JSON</span>
                            <span className="px-2 py-1 bg-th-bg-elevated rounded">Excel</span>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}
        </div>
    );
}

function PreviewStep({
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
        <div className="space-y-6">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-400">
                    File loaded: {parsedFile.fileName}
                </span>
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
                        {parsedFile.rows.length.toLocaleString()} rows × {parsedFile.columns.length} columns
                    </span>
                </div>
                <div className="overflow-x-auto border border-th-border rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-th-bg-elevated">
                            <tr>
                                {parsedFile.columns.map((col) => (
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
                            {parsedFile.preview.map((row, idx) => (
                                <tr key={idx} className="border-b border-th-border last:border-0">
                                    {parsedFile.columns.map((col) => (
                                        <td
                                            key={col}
                                            className="px-4 py-2 text-th-text-secondary whitespace-nowrap max-w-[200px] truncate"
                                        >
                                            {row[col] === null || row[col] === undefined ? (
                                                <span className="text-th-text-muted italic">null</span>
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
        <div className="text-center py-6">
            {/* Success icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
            </div>

            <h3 className="text-xl font-semibold text-th-text-primary mb-2">
                Data imported successfully!
            </h3>
            <p className="text-th-text-muted mb-6">
                Your data is ready for analysis
            </p>

            {/* Summary */}
            <div className="bg-th-bg-elevated rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-th-text-muted">File</span>
                        <span className="text-th-text-primary font-medium">{fileName}</span>
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
                    onClick={onUploadMore}
                    className="flex items-center gap-2 px-5 py-2.5 bg-th-bg-elevated text-th-text-primary rounded-xl font-medium border border-th-border hover:bg-th-interactive-hover transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Upload More Data
                </button>
            </div>
        </div>
    );
}

export default InlineUpload;
