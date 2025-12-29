/**
 * Upload Zone Component - Enhanced multi-format support
 * Phase 8: Enhanced error handling with user-friendly messages
 */

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, FileSpreadsheet, Database, Globe, Clipboard } from 'lucide-react';
import { importFile, getSupportedExtensions, isFormatSupported, type ImportResult } from '../../lib/importers';
import { urlImporter } from '../../lib/importers/urlImporter';
import { clipboardImporter } from '../../lib/importers/clipboardImporter';
import { parseError, ErrorCode, AppError } from '../../lib/errorHandler';

interface UploadZoneProps {
    onFileLoaded: (result: ImportResult, file?: File) => void;
    isLoading?: boolean;
}

type ImportMode = 'file' | 'url' | 'paste';

export function UploadZone({ onFileLoaded, isLoading }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [mode, setMode] = useState<ImportMode>('file');
    const [urlInput, setUrlInput] = useState('');
    const [pasteInput, setPasteInput] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const loading = isLoading || localLoading;

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setFileName(file.name);
        setLocalLoading(true);

        // Validate file format
        if (!isFormatSupported(file)) {
            const parsed = parseError(new AppError(ErrorCode.FILE_UNSUPPORTED));
            setError(parsed.message);
            setLocalLoading(false);
            return;
        }

        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            const parsed = parseError(new AppError(ErrorCode.FILE_TOO_LARGE));
            setError(parsed.message);
            setLocalLoading(false);
            return;
        }

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

    return (
        <div className="w-full space-y-4">
            {/* Mode Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setMode('file')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        mode === 'file'
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-elevated text-zinc-400 hover:text-white'
                    }`}
                >
                    <Upload className="w-4 h-4" />
                    File Upload
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        mode === 'url'
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-elevated text-zinc-400 hover:text-white'
                    }`}
                >
                    <Globe className="w-4 h-4" />
                    Import URL
                </button>
                <button
                    onClick={() => setMode('paste')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        mode === 'paste'
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-elevated text-zinc-400 hover:text-white'
                    }`}
                >
                    <Clipboard className="w-4 h-4" />
                    Paste Data
                </button>
            </div>

            {/* File Upload Mode */}
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
                        {loading ? (
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
                                <CheckCircle className="w-12 h-12 text-green-500" />
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

            {/* URL Import Mode */}
            {mode === 'url' && (
                <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Data URL
                            </label>
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://example.com/data.csv or Google Sheets URL"
                                className="w-full px-4 py-3 bg-bg-elevated border border-white/[0.1] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>Supports:</span>
                            <span>CSV/JSON URLs</span>
                            <span>Google Sheets</span>
                            <span>Dropbox</span>
                            <span>Google Drive</span>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <button
                            onClick={handleUrlImport}
                            disabled={loading || !urlInput.trim()}
                            className="w-full px-4 py-3 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
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
            )}

            {/* Paste Mode */}
            {mode === 'paste' && (
                <div className="bg-bg-card rounded-card p-6 border border-white/[0.06]">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Paste your data
                            </label>
                            <textarea
                                value={pasteInput}
                                onChange={(e) => setPasteInput(e.target.value)}
                                placeholder="Paste CSV, TSV (from spreadsheet), or JSON data here..."
                                className="w-full h-48 px-4 py-3 bg-bg-elevated border border-white/[0.1] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-accent-primary font-mono text-sm resize-none"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>Tip:</span>
                            <span>Copy from Excel/Sheets and paste directly</span>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <button
                            onClick={handlePasteImport}
                            disabled={loading || !pasteInput.trim()}
                            className="w-full px-4 py-3 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
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
            )}
        </div>
    );
}

export default UploadZone;
