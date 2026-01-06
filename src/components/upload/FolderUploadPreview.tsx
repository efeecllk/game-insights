/**
 * Folder Upload Preview - Obsidian Analytics Design
 *
 * Premium folder upload with:
 * - File list preview
 * - Merge strategy options
 * - Column compatibility check
 */

import { useState, useMemo } from 'react';
import {
    FileText,
    FileSpreadsheet,
    Database,
    AlertCircle,
    CheckCircle,
    Loader2,
    FolderOpen,
    Merge,
    Layers,
    X
} from 'lucide-react';
import type { FileFormat, FolderImportProgress, ColumnCompatibility } from '../../lib/importers';
import type { MergeStrategy } from '../../lib/importers/folderImporter';

interface FilePreview {
    name: string;
    format: FileFormat;
    size: number;
}

interface FolderUploadPreviewProps {
    files: FilePreview[];
    unsupportedFiles: string[];
    totalSize: number;
    isImporting: boolean;
    progress?: FolderImportProgress;
    columnCompatibility?: ColumnCompatibility;
    mergeStrategy: MergeStrategy;
    onMergeStrategyChange: (strategy: MergeStrategy) => void;
    onImport: () => void;
    onCancel: () => void;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFormatIcon(format: FileFormat) {
    switch (format) {
        case 'csv':
        case 'tsv':
            return FileSpreadsheet;
        case 'xlsx':
        case 'xls':
            return FileSpreadsheet;
        case 'json':
        case 'ndjson':
            return FileText;
        case 'sqlite':
            return Database;
        default:
            return FileText;
    }
}

function getFormatColor(format: FileFormat): string {
    switch (format) {
        case 'csv':
        case 'tsv':
            return 'text-[#DA7756]';
        case 'xlsx':
        case 'xls':
            return 'text-[#DA7756]';
        case 'json':
        case 'ndjson':
            return 'text-yellow-400';
        case 'sqlite':
            return 'text-[#8F8B82]';
        default:
            return 'text-zinc-400';
    }
}

export function FolderUploadPreview({
    files,
    unsupportedFiles,
    totalSize,
    isImporting,
    progress,
    columnCompatibility,
    mergeStrategy,
    onMergeStrategyChange,
    onImport,
    onCancel
}: FolderUploadPreviewProps) {
    const [showAllFiles, setShowAllFiles] = useState(false);

    const displayedFiles = useMemo(() => {
        return showAllFiles ? files : files.slice(0, 10);
    }, [files, showAllFiles]);

    const formatSummary = useMemo(() => {
        const summary: Record<string, number> = {};
        for (const file of files) {
            summary[file.format] = (summary[file.format] || 0) + 1;
        }
        return summary;
    }, [files]);

    return (
        <div className="bg-bg-card rounded-card p-6 border border-slate-800 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-accent-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {files.length} files ready to import
                        </h3>
                        <p className="text-sm text-zinc-400">
                            Total size: {formatFileSize(totalSize)}
                        </p>
                    </div>
                </div>
                {!isImporting && (
                    <button
                        onClick={onCancel}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Format Summary */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(formatSummary).map(([format, count]) => {
                    const Icon = getFormatIcon(format as FileFormat);
                    return (
                        <div
                            key={format}
                            className="flex items-center gap-2 px-3 py-1.5 bg-bg-elevated rounded-lg text-sm"
                        >
                            <Icon className={`w-4 h-4 ${getFormatColor(format as FileFormat)}`} />
                            <span className="text-zinc-300">
                                {count} {format.toUpperCase()}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Unsupported Files Warning */}
            {unsupportedFiles.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-yellow-500 font-medium">
                            {unsupportedFiles.length} unsupported files will be skipped
                        </p>
                        <p className="text-yellow-500/70 text-sm mt-1">
                            {unsupportedFiles.slice(0, 3).join(', ')}
                            {unsupportedFiles.length > 3 && ` and ${unsupportedFiles.length - 3} more`}
                        </p>
                    </div>
                </div>
            )}

            {/* Column Compatibility */}
            {columnCompatibility && (
                <div className="p-4 bg-bg-elevated rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                        {columnCompatibility.isFullyCompatible ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-[#7A8B5B]" />
                                <span className="text-[#7A8B5B] font-medium">
                                    All files have compatible columns
                                </span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                                <span className="text-yellow-500 font-medium">
                                    Files have different columns
                                </span>
                            </>
                        )}
                    </div>
                    <div className="text-sm text-zinc-400">
                        <span className="text-zinc-300">{columnCompatibility.commonColumns.length}</span> common columns
                        {' · '}
                        <span className="text-zinc-300">{columnCompatibility.allColumns.length}</span> total unique columns
                    </div>
                </div>
            )}

            {/* Merge Strategy */}
            {!isImporting && files.length > 1 && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-300">
                        Import Strategy
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => onMergeStrategyChange('auto')}
                            className={`p-4 rounded-xl border transition-all ${
                                mergeStrategy === 'auto'
                                    ? 'border-accent-primary bg-accent-primary/10'
                                    : 'border-white/[0.1] bg-bg-elevated hover:border-white/20'
                            }`}
                        >
                            <Layers className={`w-6 h-6 mx-auto mb-2 ${
                                mergeStrategy === 'auto' ? 'text-accent-primary' : 'text-zinc-400'
                            }`} />
                            <div className="text-sm font-medium text-white">Auto</div>
                            <div className="text-xs text-zinc-500 mt-1">
                                Smart detection
                            </div>
                        </button>
                        <button
                            onClick={() => onMergeStrategyChange('merge')}
                            className={`p-4 rounded-xl border transition-all ${
                                mergeStrategy === 'merge'
                                    ? 'border-accent-primary bg-accent-primary/10'
                                    : 'border-white/[0.1] bg-bg-elevated hover:border-white/20'
                            }`}
                        >
                            <Merge className={`w-6 h-6 mx-auto mb-2 ${
                                mergeStrategy === 'merge' ? 'text-accent-primary' : 'text-zinc-400'
                            }`} />
                            <div className="text-sm font-medium text-white">Merge</div>
                            <div className="text-xs text-zinc-500 mt-1">
                                Combine all rows
                            </div>
                        </button>
                        <button
                            onClick={() => onMergeStrategyChange('separate')}
                            className={`p-4 rounded-xl border transition-all ${
                                mergeStrategy === 'separate'
                                    ? 'border-accent-primary bg-accent-primary/10'
                                    : 'border-white/[0.1] bg-bg-elevated hover:border-white/20'
                            }`}
                        >
                            <FolderOpen className={`w-6 h-6 mx-auto mb-2 ${
                                mergeStrategy === 'separate' ? 'text-accent-primary' : 'text-zinc-400'
                            }`} />
                            <div className="text-sm font-medium text-white">Separate</div>
                            <div className="text-xs text-zinc-500 mt-1">
                                Keep individual
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* File List */}
            <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-300 mb-2">Files</div>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                    {displayedFiles.map((file, index) => {
                        const Icon = getFormatIcon(file.format);
                        const isProcessing = progress && index === progress.currentIndex;
                        const isComplete = progress && index < progress.completedFiles;

                        return (
                            <div
                                key={`${file.name}-${index}`}
                                className={`flex items-center gap-3 p-2 rounded-lg ${
                                    isProcessing ? 'bg-accent-primary/10' : 'bg-bg-elevated'
                                }`}
                            >
                                {isImporting ? (
                                    isProcessing ? (
                                        <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
                                    ) : isComplete ? (
                                        <CheckCircle className="w-4 h-4 text-[#7A8B5B]" />
                                    ) : (
                                        <Icon className={`w-4 h-4 ${getFormatColor(file.format)}`} />
                                    )
                                ) : (
                                    <Icon className={`w-4 h-4 ${getFormatColor(file.format)}`} />
                                )}
                                <span className="flex-1 text-sm text-zinc-300 truncate">
                                    {file.name}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {formatFileSize(file.size)}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {files.length > 10 && !showAllFiles && (
                    <button
                        onClick={() => setShowAllFiles(true)}
                        className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
                    >
                        Show all {files.length} files
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            {isImporting && progress && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                            Importing {progress.currentFile || 'files'}...
                        </span>
                        <span className="text-zinc-300">
                            {progress.completedFiles}/{progress.totalFiles}
                        </span>
                    </div>
                    <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent-primary transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            {!isImporting && (
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-bg-elevated hover:bg-bg-elevated/80 text-zinc-300 font-medium rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onImport}
                        className="flex-1 px-4 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <FolderOpen className="w-4 h-4" />
                        Import {files.length} Files
                    </button>
                </div>
            )}
        </div>
    );
}

export default FolderUploadPreview;
