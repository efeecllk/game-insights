/**
 * Upload Zone Component - Enhanced UX Design
 *
 * Clean upload experience with:
 * - File upload as the primary action (most common)
 * - Comprehensive format guidance
 * - Expected column types for each game type
 * - Clear drag-and-drop instructions
 * - Advanced options hidden by default
 * - Clear feedback and guidance
 */

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    AlertCircle,
    CheckCircle,
    Loader2,
    FileSpreadsheet,
    Database,
    Globe,
    Clipboard,
    FolderOpen,
    HardDrive,
    ChevronDown,
    Info,
    MousePointerClick,
} from 'lucide-react';
import {
    importFile,
    getSupportedExtensions,
    isFormatSupported,
    type ImportResult,
    type FolderImportProgress,
    detectFileFormat,
} from '../../lib/importers';
import {
    folderImporter,
    type MergeStrategy,
    type FolderImportResult,
} from '../../lib/importers/folderImporter';
import { urlImporter } from '../../lib/importers/urlImporter';
import { clipboardImporter } from '../../lib/importers/clipboardImporter';
import {
    streamingCsvImporter,
    type StreamingProgress,
} from '../../lib/importers/streamingCsvImporter';
import { saveChunk } from '../../lib/chunkedDataStore';
import { parseError, ErrorCode, AppError } from '../../lib/errorHandler';
import { FolderUploadPreview } from './FolderUploadPreview';
import { expectedColumnsByGameType } from '../../lib/sampleData';

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

// Detailed format information
const formatInfo = [
    {
        icon: FileSpreadsheet,
        name: 'CSV / Excel',
        extensions: '.csv, .xlsx, .xls',
        description: 'Tabular data with headers',
        maxSize: 'Unlimited (streaming for 50MB+)',
    },
    {
        icon: FileText,
        name: 'JSON',
        extensions: '.json',
        description: 'Array of objects',
        maxSize: '50MB',
    },
    {
        icon: Database,
        name: 'SQLite',
        extensions: '.db, .sqlite',
        description: 'Database files',
        maxSize: '50MB',
    },
];


export function UploadZone({ onFileLoaded, onFolderLoaded, isLoading }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [mode, setMode] = useState<ImportMode>('file');
    const [urlInput, setUrlInput] = useState('');
    const [pasteInput, setPasteInput] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [showFormatDetails, setShowFormatDetails] = useState(false);

    // Folder-specific state
    const [folderPreview, setFolderPreview] = useState<FolderPreviewData | null>(null);
    const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('auto');
    const [folderProgress, setFolderProgress] = useState<FolderImportProgress | undefined>();
    const [isFolderImporting, setIsFolderImporting] = useState(false);

    // Streaming progress state for large files
    const [streamingProgress, setStreamingProgress] = useState<StreamingProgress | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    const loading = isLoading || localLoading || isFolderImporting || isStreaming;

    const handleFile = useCallback(
        async (file: File) => {
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
                setError(
                    `Large ${format.toUpperCase()} files are not supported yet. For files over 50MB, please use CSV format which supports streaming. Alternatively, split your ${format.toUpperCase()} file into smaller parts.`
                );
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
                        },
                    });

                    if (!result.success) {
                        const parsed = parseError(
                            new AppError(ErrorCode.FILE_PARSE_ERROR, result.errors[0]?.message)
                        );
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
                    onFileLoaded(
                        {
                            ...result,
                            data: result.sampleData, // Use sample for preview
                            metadata: {
                                ...result.metadata,
                                // Add chunked info
                                format: `${result.metadata.format} (streamed: ${result.totalChunks} chunks)`,
                            },
                        },
                        file
                    );
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
                    const parsed = parseError(
                        new AppError(ErrorCode.FILE_PARSE_ERROR, result.errors[0]?.message)
                    );
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
        },
        [onFileLoaded]
    );

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
                const parsed = parseError(
                    new AppError(ErrorCode.NETWORK_ERROR, result.errors[0]?.message)
                );
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
                const parsed = parseError(
                    new AppError(ErrorCode.FILE_PARSE_ERROR, result.errors[0]?.message)
                );
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
                files: analysis.supportedFiles.map((f) => ({
                    name: f.name,
                    format: f.format,
                    size: f.size,
                })),
                unsupportedFiles: analysis.unsupportedFiles,
                totalSize: analysis.totalSize,
                rawFiles: Array.from(files).filter((f) => isFormatSupported(f)),
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
                onProgress: setFolderProgress,
            });

            if (!result.success) {
                const parsed = parseError(
                    new AppError(ErrorCode.FILE_PARSE_ERROR, result.errors[0]?.message)
                );
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
                const firstSuccess = result.files.find((f) => f.success);
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

    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    return (
        <div className="w-full space-y-4">
            {/* Primary: File Upload - Always visible as the main action */}
            {mode === 'file' && (
                <div className="space-y-4">
                    {/* Main Upload Zone */}
                    <motion.label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        whileHover={{ scale: loading ? 1 : 1.01 }}
                        whileTap={{ scale: loading ? 1 : 0.99 }}
                        transition={{ duration: 0.2 }}
                        className={`
                            relative flex flex-col items-center justify-center
                            w-full min-h-[280px] p-6
                            border-2 border-dashed rounded-2xl
                            cursor-pointer transition-all duration-300
                            ${
                                isDragging
                                    ? 'border-[#DA7756] bg-[#DA7756]/10 shadow-lg shadow-[#DA7756]/10'
                                    : 'border-[#4a4845]/50 bg-[#1f1e1b]/50 hover:border-[#DA7756]/50 hover:bg-[#1f1e1b] hover:shadow-lg hover:shadow-[#DA7756]/5'
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
                                    <div className="w-16 h-16 rounded-2xl bg-[#DA7756]/10 flex items-center justify-center">
                                        <HardDrive className="w-8 h-8 text-[#DA7756]" />
                                    </div>
                                    <div className="w-full max-w-xs">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[#b8b5ad]">
                                                {streamingProgress.phase === 'parsing'
                                                    ? 'Processing...'
                                                    : 'Complete!'}
                                            </span>
                                            <span className="text-[#DA7756] font-medium">
                                                {streamingProgress.percent}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#DA7756] to-[#C15F3C] transition-all duration-300"
                                                style={{ width: `${streamingProgress.percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-[#8F8B82] mt-2">
                                            <span>
                                                {streamingProgress.rowsProcessed.toLocaleString()} rows
                                            </span>
                                            <span>
                                                {(
                                                    streamingProgress.bytesProcessed /
                                                    1024 /
                                                    1024
                                                ).toFixed(1)}{' '}
                                                MB /{' '}
                                                {(streamingProgress.totalBytes / 1024 / 1024).toFixed(
                                                    1
                                                )}{' '}
                                                MB
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#8F8B82] mt-1">
                                            Chunk {streamingProgress.chunkIndex + 1} - Streaming large
                                            file
                                        </p>
                                    </div>
                                </>
                            ) : loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="relative">
                                        <motion.div
                                            className="w-14 h-14 rounded-2xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                        >
                                            <Loader2 className="w-7 h-7 text-[#DA7756]" />
                                        </motion.div>
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl border-2 border-[#DA7756]/30 border-t-[#DA7756]"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        />
                                    </div>
                                    <p className="text-[#b8b5ad] font-medium">Importing your data...</p>
                                </motion.div>
                            ) : error ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                        className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                                    >
                                        <AlertCircle className="w-7 h-7 text-red-500" />
                                    </motion.div>
                                    <div className="text-center">
                                        <p className="text-red-400 font-medium">{error}</p>
                                        <p className="text-[#8F8B82] text-sm mt-1">
                                            Click or drop to try again
                                        </p>
                                    </div>
                                </motion.div>
                            ) : fileName ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                                        className="w-14 h-14 rounded-2xl bg-[#7A8B5B]/10 border border-[#7A8B5B]/20 flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-7 h-7 text-[#7A8B5B]" />
                                    </motion.div>
                                    <div className="text-center">
                                        <p className="text-white font-medium">{fileName}</p>
                                        <p className="text-[#7A8B5B] text-sm mt-1">
                                            File loaded successfully
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Animated Upload Icon */}
                                    <AnimatePresence mode="wait">
                                        {isDragging ? (
                                            <motion.div
                                                key="dragging"
                                                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.8, opacity: 0, y: -10 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/10 border-2 border-dashed border-[#DA7756] flex items-center justify-center shadow-lg shadow-[#DA7756]/20"
                                            >
                                                <motion.div
                                                    animate={{ y: [-2, 2, -2] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                                >
                                                    <Upload className="w-10 h-10 text-[#DA7756]" />
                                                </motion.div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="default"
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DA7756]/10 to-[#C15F3C]/5 border border-[#DA7756]/20 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#DA7756]/10 transition-shadow"
                                            >
                                                <Upload className="w-8 h-8 text-[#DA7756]" />
                                                {/* Pulse ring on hover */}
                                                <motion.div
                                                    className="absolute inset-0 rounded-2xl border border-[#DA7756]/30"
                                                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="space-y-2">
                                        <p className="text-white font-medium text-lg">
                                            {isDragging
                                                ? 'Drop your file here'
                                                : 'Drag & drop your data file'}
                                        </p>
                                        <div className="flex items-center justify-center gap-2 text-[#8F8B82] text-sm">
                                            <MousePointerClick className="w-4 h-4" />
                                            <span>or click to browse</span>
                                        </div>
                                    </div>

                                    {/* Format badges */}
                                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                                        {formatInfo.map((fmt, index) => (
                                            <motion.div
                                                key={fmt.name}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-center gap-2 px-3 py-2 bg-[#343330]/50 hover:bg-[#343330] rounded-xl border border-[#4a4845]/50 hover:border-[#DA7756]/30 transition-all cursor-default group"
                                            >
                                                <fmt.icon className="w-4 h-4 text-[#DA7756] group-hover:scale-110 transition-transform" />
                                                <span className="text-xs text-[#b8b5ad] group-hover:text-[#d4d1c9] transition-colors">{fmt.name}</span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Size hint */}
                                    <p className="text-xs text-[#6b6967] mt-2">
                                        Files up to 50MB are processed instantly. Larger CSV files use
                                        streaming.
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.label>

                    {/* Expandable Format Details */}
                    <div className="border-t border-[#343330] pt-4">
                        <button
                            onClick={() => setShowFormatDetails(!showFormatDetails)}
                            className="flex items-center gap-2 text-sm text-[#8F8B82] hover:text-[#d4d1c9] transition-colors"
                        >
                            <Info className="w-4 h-4" />
                            <span>What data formats and columns are supported?</span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${showFormatDetails ? 'rotate-180' : ''}`}
                            />
                        </button>

                        <AnimatePresence>
                            {showFormatDetails && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 space-y-6">
                                        {/* Supported Formats */}
                                        <div>
                                            <h4 className="text-sm font-medium text-[#d4d1c9] mb-3">
                                                Supported File Formats
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {formatInfo.map((fmt) => (
                                                    <div
                                                        key={fmt.name}
                                                        className="bg-[#343330]/30 rounded-xl p-3 border border-[#4a4845]/50"
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <fmt.icon className="w-5 h-5 text-[#DA7756]" />
                                                            <span className="font-medium text-white text-sm">
                                                                {fmt.name}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 text-xs text-[#8F8B82]">
                                                            <p>
                                                                <span className="text-[#b8b5ad]">Extensions:</span>{' '}
                                                                {fmt.extensions}
                                                            </p>
                                                            <p>
                                                                <span className="text-[#b8b5ad]">Format:</span>{' '}
                                                                {fmt.description}
                                                            </p>
                                                            <p>
                                                                <span className="text-[#b8b5ad]">Max size:</span>{' '}
                                                                {fmt.maxSize}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Expected Columns by Game Type */}
                                        <div>
                                            <h4 className="text-sm font-medium text-[#d4d1c9] mb-3">
                                                Expected Columns by Game Type
                                            </h4>
                                            <p className="text-xs text-[#8F8B82] mb-3">
                                                Your data should include columns like these. We'll
                                                automatically detect the game type based on your columns.
                                            </p>
                                            <div className="space-y-3">
                                                {Object.entries(expectedColumnsByGameType).slice(0, 5).map(
                                                    ([gameType, cols]) => (
                                                        <div
                                                            key={gameType}
                                                            className="bg-[#343330]/30 rounded-xl p-3 border border-[#4a4845]/50"
                                                        >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-medium text-[#DA7756] text-sm capitalize">
                                                                    {gameType.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {cols.required.map((col) => (
                                                                    <span
                                                                        key={col}
                                                                        className="px-2 py-0.5 bg-[#DA7756]/10 text-[#DA7756] text-xs rounded border border-[#DA7756]/20"
                                                                        title="Required"
                                                                    >
                                                                        {col}*
                                                                    </span>
                                                                ))}
                                                                {cols.optional.slice(0, 5).map((col) => (
                                                                    <span
                                                                        key={col}
                                                                        className="px-2 py-0.5 bg-[#4a4845]/50 text-[#b8b5ad] text-xs rounded"
                                                                        title="Optional"
                                                                    >
                                                                        {col}
                                                                    </span>
                                                                ))}
                                                                {cols.optional.length > 5 && (
                                                                    <span className="px-2 py-0.5 text-[#8F8B82] text-xs">
                                                                        +{cols.optional.length - 5} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                            <p className="text-xs text-[#6b6967] mt-3">
                                                <span className="text-[#DA7756]">*</span> = Required columns.
                                                Other columns are optional but improve analysis quality.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Advanced Import Options - Progressive Disclosure */}
            {mode === 'file' && (
                <div className="border-t border-th-border-subtle pt-4">
                    <button
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                    >
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}
                        />
                        <span>
                            {showAdvancedOptions ? 'Hide other import options' : 'More import options'}
                        </span>
                    </button>

                    {showAdvancedOptions && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setMode('folder')}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-th-border-subtle bg-th-bg-surface hover:border-[#DA7756]/30 transition-colors text-center"
                            >
                                <FolderOpen className="w-5 h-5 text-th-text-muted" />
                                <span className="text-sm font-medium text-th-text-secondary">
                                    Import Folder
                                </span>
                                <span className="text-xs text-th-text-muted">Multiple files</span>
                            </button>
                            <button
                                onClick={() => setMode('url')}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-th-border-subtle bg-th-bg-surface hover:border-[#DA7756]/30 transition-colors text-center"
                            >
                                <Globe className="w-5 h-5 text-th-text-muted" />
                                <span className="text-sm font-medium text-th-text-secondary">
                                    Import URL
                                </span>
                                <span className="text-xs text-th-text-muted">Google Sheets, etc</span>
                            </button>
                            <button
                                onClick={() => setMode('paste')}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-th-border-subtle bg-th-bg-surface hover:border-[#DA7756]/30 transition-colors text-center"
                            >
                                <Clipboard className="w-5 h-5 text-th-text-muted" />
                                <span className="text-sm font-medium text-th-text-secondary">
                                    Paste Data
                                </span>
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
                        onClick={() => {
                            setMode('file');
                            setFolderPreview(null);
                        }}
                        className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-secondary transition-colors"
                    >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                        <span>Back to file upload</span>
                    </button>
                    {folderPreview ? (
                        <FolderUploadPreview
                            files={folderPreview.files.map((f) => ({
                                ...f,
                                format: f.format as import('../../lib/importers').FileFormat,
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
                                border-white/[0.1] bg-bg-card hover:border-[#DA7756]/50 hover:bg-bg-card-hover
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
                                            <p className="text-[#8F8B82] text-sm mt-1">
                                                Click to try again
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-2xl bg-[#DA7756]/10 flex items-center justify-center">
                                            <FolderOpen className="w-8 h-8 text-[#DA7756]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                Click to select a folder
                                            </p>
                                            <p className="text-[#8F8B82] text-sm mt-1">
                                                All supported files will be imported
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-2 text-xs text-[#8F8B82]">
                                                <FileSpreadsheet className="w-4 h-4" />
                                                CSV/Excel
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[#8F8B82]">
                                                <FileText className="w-4 h-4" />
                                                JSON
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[#8F8B82]">
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
                                    className="w-full px-4 py-3 bg-th-bg-elevated border border-th-border-subtle rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-[#DA7756]"
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
                                className="w-full px-4 py-3 bg-[#DA7756] hover:bg-[#C15F3C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
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
                                    className="w-full h-48 px-4 py-3 bg-th-bg-elevated border border-th-border-subtle rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-[#DA7756] font-mono text-sm resize-none"
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
                                className="w-full px-4 py-3 bg-[#DA7756] hover:bg-[#C15F3C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
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
