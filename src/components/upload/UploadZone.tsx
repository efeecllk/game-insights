/**
 * Upload Zone Component - Simplified Design
 *
 * Clean upload experience with:
 * - File upload as the primary action (most common)
 * - Advanced options hidden by default
 * - Clear feedback and guidance
 */

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, FileSpreadsheet, Database, Globe, Clipboard, FolderOpen, HardDrive, ChevronDown } from 'lucide-react';
import { importFile, getSupportedExtensions, isFormatSupported, type ImportResult, type FolderImportProgress, detectFileFormat } from '../../lib/importers';
import { folderImporter, type MergeStrategy, type FolderImportResult } from '../../lib/importers/folderImporter';
import { urlImporter } from '../../lib/importers/urlImporter';
import { clipboardImporter } from '../../lib/importers/clipboardImporter';
import { streamingCsvImporter, type StreamingProgress } from '../../lib/importers/streamingCsvImporter';
import { saveChunk } from '../../lib/chunkedDataStore';
import { parseError, ErrorCode, AppError } from '../../lib/errorHandler';
import { FolderUploadPreview } from './FolderUploadPreview';

interface UploadZoneProps {
    onFileLoaded: (result: ImportResult, file?: File) => void;
    onFolderLoaded?: (result: FolderImportResult) => void;
    isLoading?: boolean;
}

type ImportMode = 'file' | 'folder' | 'url' | 'paste';

interface FolderPreviewData {
    files: Array<{ name: string; format: string; size: number }>;
    unsupportedFiles: string[];
    totalSize: number;
    rawFiles: File[];
}

export function UploadZone({ onFileLoaded, onFolderLoaded, isLoading }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [mode, setMode] = useState<ImportMode>('file');
    const [urlInput, setUrlInput] = useState('');
    const [pasteInput, setPasteInput] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    // Folder-specific state
    const [folderPreview, setFolderPreview] = useState<FolderPreviewData | null>(null);
    const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('auto');
    const [folderProgress, setFolderProgress] = useState<FolderImportProgress | undefined>();
    const [isFolderImporting, setIsFolderImporting] = useState(false);

    // Streaming progress state for large files
    const [streamingProgress, setStreamingProgress] = useState<StreamingProgress | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    const loading = isLoading || localLoading || isFolderImporting || isStreaming;

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setFileName(file.name);
        setStreamingProgress(null);

        // Validate file format
        if (!isFormatSupported(file)) {
            const parsed = parseError(new AppError(ErrorCode.FILE_UNSUPPORTED));
            setError(parsed.message);
            return;
        }

        const format = detectFileFormat(file);
        const isLargeFile = file.size > 50 * 1024 * 1024; // 50MB threshold
        const isCsv = format === 'csv' || format === 'tsv';

        // For large non-CSV files, show helpful error (streaming only supports CSV)
        if (isLargeFile && !isCsv) {
            setError(`Large ${format.toUpperCase()} files are not supported yet. For files over 50MB, please use CSV format which supports streaming. Alternatively, split your ${format.toUpperCase()} file into smaller parts.`);
            return;
        }

        // Use streaming for large CSV files
        if (isLargeFile && isCsv) {
            setIsStreaming(true);
            const datasetId = `dataset_${Date.now()}`;

            try {
                const result = await streamingCsvImporter.import(file, {
                    chunkSize: 10000,
                    sampleSize: 1000,
                    onProgress: (progress) => {
                        setStreamingProgress(progress);
                    },
                    onChunk: async (chunk) => {
                        // Store each chunk in IndexedDB
                        await saveChunk(datasetId, chunk);
                    }
                });

                if (!result.success) {
                    const parsed = parseError(new AppError(ErrorCode.FILE_PARSE_ERROR, result.errors[0]?.message));
                    setError(parsed.message);
                    setIsStreaming(false);
                    return;
                }

                if (result.rowCount === 0) {
                    const parsed = parseError(new AppError(ErrorCode.FILE_EMPTY));
                    setError(parsed.message);
                    setIsStreaming(false);
                    return;
                }

                // Pass result with sample data to onFileLoaded
                onFileLoaded({
                    ...result,
                    data: result.sampleData, // Use sample for preview
                    metadata: {
                        ...result.metadata,
                        // Add chunked info
                        format: `${result.metadata.format} (streamed: ${result.totalChunks} chunks)`
                    }
                }, file);
            } catch (err) {
                const parsed = parseError(err);
                setError(parsed.message);
            } finally {
                setIsStreaming(false);
                setStreamingProgress(null);
            }
            return;
        }

        // Standard import for smaller files (no size limit for non-streaming)
        setLocalLoading(true);

        try {
            const result = await importFile(file);

            if (!result.success) {
                const parsed = parseError(new AppError(ErrorCode.FILE_PARSE_ERROR, result.errors[0]?.message));
                setError(parsed.message);
                setLocalLoading(false);
                return;
            }

            if (result.rowCount === 0) {
                const parsed = parseError(new AppError(ErrorCode.FILE_EMPTY));
                setError(parsed.message);
                setLocalLoading(false);
                return;
            }

            onFileLoaded(result, file);
        } catch (err) {
            const parsed = parseError(err);
            setError(parsed.message);
        } finally {
            setLocalLoading(false);
        }
    }, [onFileLoaded]);

    const handleUrlImport = async () => {
        if (!urlInput.trim()) {
            setError('Please enter a URL');
            return;
        }

        setError(null);
        setLocalLoading(true);
        setFileName(urlInput);

        try {
            const result = await urlImporter.import(urlInput.trim());

            if (!result.success) {
                const parsed = parseError(new AppError(ErrorCode.NETWORK_ERROR, result.errors[0]?.message));
                setError(parsed.message);
                setLocalLoading(false);
                return;
            }

            onFileLoaded(result);
        } catch (err) {
            const parsed = parseError(err);
            setError(parsed.message);
        } finally {
            setLocalLoading(false);
        }
    };

    const handlePasteImport = async () => {
        const content = pasteInput.trim();
        if (!content) {
            setError('Please paste some data');
            return;
        }

        setError(null);
        setLocalLoading(true);
        setFileName('Pasted data');

        try {
            const result = await clipboardImporter.importFromText(content);

            if (!result.success) {
                const parsed = parseError(new AppError(ErrorCode.FILE_PARSE_ERROR, result.errors[0]?.message));
                setError(parsed.message);
                setLocalLoading(false);
                return;
            }

            if (result.rowCount === 0) {
                const parsed = parseError(new AppError(ErrorCode.DATA_MISSING));
                setError(parsed.message);
                setLocalLoading(false);
                return;
            }

            onFileLoaded(result);
        } catch (err) {
            const parsed = parseError(err);
            setError(parsed.message);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleFolderSelect = async (files: FileList) => {
        setError(null);

        try {
            const analysis = await folderImporter.analyze(files);

            if (analysis.supportedFiles.length === 0) {
                setError('No supported files found in the folder');
                return;
            }

            setFolderPreview({
                files: analysis.supportedFiles.map(f => ({
                    name: f.name,
                    format: f.format,
                    size: f.size
                })),
                unsupportedFiles: analysis.unsupportedFiles,
                totalSize: analysis.totalSize,
                rawFiles: Array.from(files).filter(f => isFormatSupported(f))
            });
        } catch (err) {
            const parsed = parseError(err);
            setError(parsed.message);
        }
    };

    const handleFolderImport = async () => {
        if (!folderPreview) return;

        setIsFolderImporting(true);
        setFolderProgress(undefined);

        try {
            const result = await folderImporter.import(folderPreview.rawFiles, {
                mergeStrategy,
                onProgress: setFolderProgress
            });

            if (!result.success) {
                const parsed = parseError(new AppError(ErrorCode.FILE_PARSE_ERROR, result.errors[0]?.message));
                setError(parsed.message);
                setIsFolderImporting(false);
                return;
            }

            // If we have merged data, use that; otherwise use the first successful file
            if (result.mergedData && result.mergedData.success) {
                onFileLoaded(result.mergedData);
            } else if (onFolderLoaded) {
                onFolderLoaded(result);
            } else if (result.files.length > 0) {
                // Fallback: load the first successful file
                const firstSuccess = result.files.find(f => f.success);
                if (firstSuccess) {
                    onFileLoaded(firstSuccess);
                }
            }

            setFolderPreview(null);
            setFileName(`${result.successfulFiles} files imported`);
        } catch (err) {
            const parsed = parseError(err);
            setError(parsed.message);
        } finally {
            setIsFolderImporting(false);
        }
    };

    const handleFolderCancel = () => {
        setFolderPreview(null);
        setError(null);
    };

    const handleFolderInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFolderSelect(files);
        }
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setMode('file');

        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const formatButtons = [
        { icon: FileSpreadsheet, label: 'CSV/Excel', ext: '.csv, .xlsx' },
        { icon: FileText, label: 'JSON', ext: '.json' },
        { icon: Database, label: 'SQLite', ext: '.db' },
    ];

    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    return (
        <div className="w-full space-y-4">
            {/* Primary: File Upload - Always visible as the main action */}
            {mode === 'file' && (
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        relative flex flex-col items-center justify-center
                        w-full h-64 p-6
                        border-2 border-dashed rounded-card
                        cursor-pointer transition-all duration-200
                        ${isDragging
                            ? 'border-accent-primary bg-accent-primary/10'
                            : 'border-white/[0.1] bg-bg-card hover:border-accent-primary/50 hover:bg-bg-card-hover'
                        }
                        ${error ? 'border-red-500/50' : ''}
                        ${loading ? 'pointer-events-none opacity-60' : ''}
                    `}
                >
                    <input
                        type="file"
                        accept={getSupportedExtensions().join(',')}
                        onChange={handleInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={loading}
                    />

                    <div className="flex flex-col items-center gap-4 text-center">
                        {isStreaming && streamingProgress ? (
                            <>
                                <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center">
                                    <HardDrive className="w-8 h-8 text-accent-primary" />
                                </div>
                                <div className="w-full max-w-xs">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-zinc-400">
                                            {streamingProgress.phase === 'parsing' ? 'Processing...' : 'Complete!'}
                                        </span>
                                        <span className="text-accent-primary font-medium">
                                            {streamingProgress.percent}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
                                            style={{ width: `${streamingProgress.percent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-500 mt-2">
                                        <span>
                                            {(streamingProgress.rowsProcessed).toLocaleString()} rows
                                        </span>
                                        <span>
                                            {(streamingProgress.bytesProcessed / 1024 / 1024).toFixed(1)} MB / {(streamingProgress.totalBytes / 1024 / 1024).toFixed(1)} MB
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Chunk {streamingProgress.chunkIndex + 1} • Streaming large file
                                    </p>
                                </div>
                            </>
                        ) : loading ? (
                            <>
                                <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
                                <p className="text-zinc-400">Importing your data...</p>
                            </>
                        ) : error ? (
                            <>
                                <AlertCircle className="w-12 h-12 text-red-500" />
                                <div>
                                    <p className="text-red-500 font-medium">{error}</p>
                                    <p className="text-zinc-500 text-sm mt-1">Click or drop to try again</p>
                                </div>
                            </>
                        ) : fileName ? (
                            <>
                                <CheckCircle className="w-12 h-12 text-[#6BBF59]" />
                                <div>
                                    <p className="text-white font-medium">{fileName}</p>
                                    <p className="text-zinc-500 text-sm mt-1">File loaded successfully</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-accent-primary" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">
                                        Drag & drop your data file here
                                    </p>
                                    <p className="text-zinc-500 text-sm mt-1">
                                        or click to browse
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    {formatButtons.map((fmt) => (
                                        <div key={fmt.label} className="flex items-center gap-2 text-xs text-zinc-500">
                                            <fmt.icon className="w-4 h-4" />
                                            {fmt.label}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </label>
            )}

            {/* Advanced Import Options - Progressive Disclosure */}
            {mode === 'file' && (
                <div className="border-t border-th-border-subtle pt-4">
                    <button
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
                        <span>{showAdvancedOptions ? 'Hide other import options' : 'More import options'}</span>
                    </button>

                    {showAdvancedOptions && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setMode('folder')}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-th-border-subtle bg-th-bg-surface hover:border-th-accent-primary/30 transition-colors text-center"
                            >
                                <FolderOpen className="w-5 h-5 text-th-text-muted" />
                                <span className="text-sm font-medium text-th-text-secondary">Import Folder</span>
                                <span className="text-xs text-th-text-muted">Multiple files</span>
                            </button>
                            <button
                                onClick={() => setMode('url')}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-th-border-subtle bg-th-bg-surface hover:border-th-accent-primary/30 transition-colors text-center"
                            >
                                <Globe className="w-5 h-5 text-th-text-muted" />
                                <span className="text-sm font-medium text-th-text-secondary">Import URL</span>
                                <span className="text-xs text-th-text-muted">Google Sheets, etc</span>
                            </button>
                            <button
                                onClick={() => setMode('paste')}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-th-border-subtle bg-th-bg-surface hover:border-th-accent-primary/30 transition-colors text-center"
                            >
                                <Clipboard className="w-5 h-5 text-th-text-muted" />
                                <span className="text-sm font-medium text-th-text-secondary">Paste Data</span>
                                <span className="text-xs text-th-text-muted">From spreadsheet</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Folder Upload Mode */}
            {mode === 'folder' && (
                <div className="space-y-4">
                    <button
                        onClick={() => { setMode('file'); setFolderPreview(null); }}
                        className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                    >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                        <span>Back to file upload</span>
                    </button>
                    {folderPreview ? (
                    <FolderUploadPreview
                        files={folderPreview.files.map(f => ({
                            ...f,
                            format: f.format as import('../../lib/importers').FileFormat
                        }))}
                        unsupportedFiles={folderPreview.unsupportedFiles}
                        totalSize={folderPreview.totalSize}
                        isImporting={isFolderImporting}
                        progress={folderProgress}
                        mergeStrategy={mergeStrategy}
                        onMergeStrategyChange={setMergeStrategy}
                        onImport={handleFolderImport}
                        onCancel={handleFolderCancel}
                    />
                ) : (
                    <label
                        className={`
                            relative flex flex-col items-center justify-center
                            w-full h-64 p-6
                            border-2 border-dashed rounded-card
                            cursor-pointer transition-all duration-200
                            border-white/[0.1] bg-bg-card hover:border-accent-primary/50 hover:bg-bg-card-hover
                            ${error ? 'border-red-500/50' : ''}
                            ${loading ? 'pointer-events-none opacity-60' : ''}
                        `}
                    >
                        <input
                            type="file"
                            // @ts-expect-error webkitdirectory is not in React types
                            webkitdirectory=""
                            directory=""
                            multiple
                            onChange={handleFolderInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={loading}
                        />

                        <div className="flex flex-col items-center gap-4 text-center">
                            {error ? (
                                <>
                                    <AlertCircle className="w-12 h-12 text-red-500" />
                                    <div>
                                        <p className="text-red-500 font-medium">{error}</p>
                                        <p className="text-zinc-500 text-sm mt-1">Click to try again</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center">
                                        <FolderOpen className="w-8 h-8 text-accent-primary" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            Click to select a folder
                                        </p>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            All supported files will be imported
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <FileSpreadsheet className="w-4 h-4" />
                                            CSV/Excel
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <FileText className="w-4 h-4" />
                                            JSON
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <Database className="w-4 h-4" />
                                            SQLite
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </label>
                    )}
                </div>
            )}

            {/* URL Import Mode */}
            {mode === 'url' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setMode('file')}
                        className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                    >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                        <span>Back to file upload</span>
                    </button>
                    <div className="bg-th-bg-surface rounded-xl p-6 border border-th-border-subtle">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-th-text-secondary mb-2">
                                    Data URL
                                </label>
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://example.com/data.csv or Google Sheets URL"
                                    className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border-subtle rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary"
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-th-text-muted">
                                <span>Supports:</span>
                                <span>CSV/JSON URLs</span>
                                <span>Google Sheets</span>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 text-th-error text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handleUrlImport}
                                disabled={loading || !urlInput.trim()}
                                className="w-full px-4 py-3 bg-th-accent-primary hover:bg-th-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-th-text-inverse font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Globe className="w-4 h-4" />
                                        Import from URL
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Paste Mode */}
            {mode === 'paste' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setMode('file')}
                        className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                    >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                        <span>Back to file upload</span>
                    </button>
                    <div className="bg-th-bg-surface rounded-xl p-6 border border-th-border-subtle">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-th-text-secondary mb-2">
                                    Paste your data
                                </label>
                                <textarea
                                    value={pasteInput}
                                    onChange={(e) => setPasteInput(e.target.value)}
                                    placeholder="Paste CSV, TSV (from spreadsheet), or JSON data here..."
                                    className="w-full h-48 px-4 py-3 bg-th-bg-elevated border border-th-border-subtle rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary font-mono text-sm resize-none"
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-th-text-muted">
                                <span>Tip:</span>
                                <span>Copy from Excel/Sheets and paste directly</span>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 text-th-error text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handlePasteImport}
                                disabled={loading || !pasteInput.trim()}
                                className="w-full px-4 py-3 bg-th-accent-primary hover:bg-th-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-th-text-inverse font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Clipboard className="w-4 h-4" />
                                        Import Pasted Data
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UploadZone;
