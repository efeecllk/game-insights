/**
 * Folder Importer
 * Import multiple files from a folder with merge strategies
 */

import { importFile, detectFileFormat, isFormatSupported } from './index';
import type { ImportResult, ImportOptions, ImportError, FileFormat } from './index';

export type MergeStrategy = 'separate' | 'merge' | 'auto';

export interface FolderImportOptions extends ImportOptions {
    /** How to handle multiple files: separate datasets, merge into one, or auto-detect */
    mergeStrategy?: MergeStrategy;
    /** Only merge files with matching columns */
    requireMatchingColumns?: boolean;
    /** Maximum concurrent file imports */
    concurrency?: number;
    /** Progress callback */
    onProgress?: (progress: FolderImportProgress) => void;
}

export interface FolderImportProgress {
    currentFile: string;
    currentIndex: number;
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
    percentage: number;
}

export interface FolderImportResult {
    success: boolean;
    /** Individual results for each file */
    files: FileImportResult[];
    /** Merged data if merge strategy was used */
    mergedData?: ImportResult;
    /** Total rows across all files */
    totalRows: number;
    /** Total files processed */
    totalFiles: number;
    /** Successfully imported files */
    successfulFiles: number;
    /** Failed files */
    failedFiles: number;
    /** Column compatibility info */
    columnCompatibility: ColumnCompatibility;
    /** Overall errors */
    errors: ImportError[];
    /** Warnings */
    warnings: string[];
    /** Processing time in milliseconds */
    processingTimeMs: number;
}

export interface FileImportResult extends ImportResult {
    /** Original file name */
    fileName: string;
    /** File format detected */
    format: FileFormat;
    /** Index in the folder */
    fileIndex: number;
}

export interface ColumnCompatibility {
    /** Columns present in all files */
    commonColumns: string[];
    /** All unique columns across files */
    allColumns: string[];
    /** Columns unique to specific files */
    uniqueToFiles: Record<string, string[]>;
    /** Whether all files have identical columns */
    isFullyCompatible: boolean;
}

/**
 * Analyze column compatibility across multiple import results
 */
function analyzeColumnCompatibility(results: ImportResult[]): ColumnCompatibility {
    if (results.length === 0) {
        return {
            commonColumns: [],
            allColumns: [],
            uniqueToFiles: {},
            isFullyCompatible: true
        };
    }

    const allColumnSets = results.map(r => new Set(r.columns));
    const allColumns = [...new Set(results.flatMap(r => r.columns))];

    // Find common columns (present in ALL files)
    const commonColumns = allColumns.filter(col =>
        allColumnSets.every(set => set.has(col))
    );

    // Find columns unique to specific files
    const uniqueToFiles: Record<string, string[]> = {};
    results.forEach((result, index) => {
        const fileName = result.metadata.fileName || `file_${index}`;
        const uniqueCols = result.columns.filter(col =>
            !allColumnSets.every(set => set.has(col))
        );
        if (uniqueCols.length > 0) {
            uniqueToFiles[fileName] = uniqueCols;
        }
    });

    return {
        commonColumns,
        allColumns,
        uniqueToFiles,
        isFullyCompatible: commonColumns.length === allColumns.length
    };
}

/**
 * Merge multiple import results into one
 */
function mergeResults(
    results: FileImportResult[],
    compatibility: ColumnCompatibility,
    requireMatchingColumns: boolean
): ImportResult {
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
        return {
            success: false,
            data: [],
            columns: [],
            rowCount: 0,
            metadata: {
                source: 'file',
                importedAt: new Date().toISOString(),
                processingTimeMs: 0
            },
            errors: [{ message: 'No files were successfully imported', severity: 'error' }],
            warnings: []
        };
    }

    const warnings: string[] = [];
    let columns: string[];

    if (requireMatchingColumns) {
        columns = compatibility.commonColumns;
        if (columns.length < compatibility.allColumns.length) {
            warnings.push(
                `Using ${columns.length} common columns. ` +
                `${compatibility.allColumns.length - columns.length} columns excluded due to incompatibility.`
            );
        }
    } else {
        columns = compatibility.allColumns;
    }

    // Merge all data
    const mergedData: Record<string, unknown>[] = [];
    for (const result of successfulResults) {
        for (const row of result.data) {
            const normalizedRow: Record<string, unknown> = {};
            for (const col of columns) {
                normalizedRow[col] = row[col] ?? null;
            }
            mergedData.push(normalizedRow);
        }
    }

    const fileNames = successfulResults.map(r => r.fileName).join(', ');

    return {
        success: true,
        data: mergedData,
        columns,
        rowCount: mergedData.length,
        metadata: {
            source: 'file',
            fileName: `Merged: ${fileNames}`,
            importedAt: new Date().toISOString(),
            processingTimeMs: successfulResults.reduce(
                (sum, r) => sum + r.metadata.processingTimeMs,
                0
            ),
            format: 'merged'
        },
        errors: [],
        warnings
    };
}

/**
 * Determine if files should be merged based on their content
 */
function shouldAutoMerge(results: FileImportResult[]): boolean {
    if (results.length <= 1) return false;

    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length <= 1) return false;

    const compatibility = analyzeColumnCompatibility(successfulResults);

    // Auto-merge if columns are mostly compatible (>80% overlap)
    const overlapRatio = compatibility.commonColumns.length / compatibility.allColumns.length;
    return overlapRatio >= 0.8;
}

/**
 * Sort files by name to maintain consistent ordering
 * Handles time-series naming patterns (e.g., data_2024_01.csv, data_2024_02.csv)
 */
function sortFiles(files: File[]): File[] {
    return [...files].sort((a, b) => {
        // Try to extract date/number patterns
        const numA = extractNumber(a.name);
        const numB = extractNumber(b.name);

        if (numA !== null && numB !== null) {
            return numA - numB;
        }

        // Fall back to alphabetical
        return a.name.localeCompare(b.name);
    });
}

function extractNumber(filename: string): number | null {
    // Try to extract year-month or sequential numbers
    const patterns = [
        /(\d{4})[-_](\d{2})[-_](\d{2})/,  // YYYY-MM-DD
        /(\d{4})[-_](\d{2})/,              // YYYY-MM
        /(\d+)/                             // Any number
    ];

    for (const pattern of patterns) {
        const match = filename.match(pattern);
        if (match) {
            if (match.length >= 4) {
                // YYYY-MM-DD
                return parseInt(match[1]) * 10000 + parseInt(match[2]) * 100 + parseInt(match[3]);
            } else if (match.length >= 3) {
                // YYYY-MM
                return parseInt(match[1]) * 100 + parseInt(match[2]);
            } else {
                return parseInt(match[1]);
            }
        }
    }

    return null;
}

/**
 * Import multiple files with concurrency limit
 */
async function importWithConcurrency(
    files: File[],
    options: FolderImportOptions,
    onProgress?: (progress: FolderImportProgress) => void
): Promise<FileImportResult[]> {
    const results: FileImportResult[] = [];
    const concurrency = options.concurrency || 3;
    let completedFiles = 0;
    let failedFiles = 0;

    // Process in batches
    for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency);

        const batchResults = await Promise.all(
            batch.map(async (file, batchIndex) => {
                const fileIndex = i + batchIndex;
                const format = detectFileFormat(file);

                onProgress?.({
                    currentFile: file.name,
                    currentIndex: fileIndex,
                    totalFiles: files.length,
                    completedFiles,
                    failedFiles,
                    percentage: Math.round((fileIndex / files.length) * 100)
                });

                try {
                    const result = await importFile(file, options);

                    if (result.success) {
                        completedFiles++;
                    } else {
                        failedFiles++;
                    }

                    return {
                        ...result,
                        fileName: file.name,
                        format,
                        fileIndex
                    } as FileImportResult;
                } catch (error) {
                    failedFiles++;
                    return {
                        success: false,
                        data: [],
                        columns: [],
                        rowCount: 0,
                        metadata: {
                            source: 'file',
                            fileName: file.name,
                            importedAt: new Date().toISOString(),
                            processingTimeMs: 0
                        },
                        errors: [{
                            message: error instanceof Error ? error.message : 'Unknown error',
                            severity: 'error'
                        }],
                        warnings: [],
                        fileName: file.name,
                        format,
                        fileIndex
                    } as FileImportResult;
                }
            })
        );

        results.push(...batchResults);
    }

    // Final progress update
    onProgress?.({
        currentFile: '',
        currentIndex: files.length,
        totalFiles: files.length,
        completedFiles,
        failedFiles,
        percentage: 100
    });

    return results;
}

export const folderImporter = {
    /**
     * Import all supported files from a folder (FileList from directory input)
     */
    async import(
        files: FileList | File[],
        options: FolderImportOptions = {}
    ): Promise<FolderImportResult> {
        const startTime = Date.now();
        const fileArray = Array.from(files);
        const errors: ImportError[] = [];
        const warnings: string[] = [];

        // Filter to supported files only
        const supportedFiles = fileArray.filter(file => {
            const isSupported = isFormatSupported(file);
            if (!isSupported) {
                warnings.push(`Skipped unsupported file: ${file.name}`);
            }
            return isSupported;
        });

        if (supportedFiles.length === 0) {
            return {
                success: false,
                files: [],
                totalRows: 0,
                totalFiles: fileArray.length,
                successfulFiles: 0,
                failedFiles: fileArray.length,
                columnCompatibility: {
                    commonColumns: [],
                    allColumns: [],
                    uniqueToFiles: {},
                    isFullyCompatible: true
                },
                errors: [{ message: 'No supported files found in folder', severity: 'error' }],
                warnings,
                processingTimeMs: Date.now() - startTime
            };
        }

        // Sort files for consistent ordering
        const sortedFiles = sortFiles(supportedFiles);

        // Import all files
        const fileResults = await importWithConcurrency(
            sortedFiles,
            options,
            options.onProgress
        );

        const successfulResults = fileResults.filter(r => r.success);
        const columnCompatibility = analyzeColumnCompatibility(successfulResults);

        // Determine merge strategy
        const mergeStrategy = options.mergeStrategy || 'auto';
        let mergedData: ImportResult | undefined;

        if (successfulResults.length > 0) {
            if (mergeStrategy === 'merge') {
                mergedData = mergeResults(
                    fileResults,
                    columnCompatibility,
                    options.requireMatchingColumns ?? true
                );
            } else if (mergeStrategy === 'auto' && shouldAutoMerge(fileResults)) {
                mergedData = mergeResults(
                    fileResults,
                    columnCompatibility,
                    true
                );
                warnings.push('Files were automatically merged due to compatible columns.');
            }
        }

        const totalRows = successfulResults.reduce((sum, r) => sum + r.rowCount, 0);
        const successfulFiles = successfulResults.length;
        const failedFiles = fileResults.length - successfulFiles;

        // Collect all errors from individual files
        fileResults.forEach(result => {
            result.errors.forEach(err => {
                errors.push({
                    ...err,
                    message: `${result.fileName}: ${err.message}`
                });
            });
        });

        return {
            success: successfulFiles > 0,
            files: fileResults,
            mergedData,
            totalRows,
            totalFiles: fileResults.length,
            successfulFiles,
            failedFiles,
            columnCompatibility,
            errors,
            warnings,
            processingTimeMs: Date.now() - startTime
        };
    },

    /**
     * Analyze files without importing (for preview)
     */
    async analyze(files: FileList | File[]): Promise<{
        supportedFiles: Array<{ name: string; format: FileFormat; size: number }>;
        unsupportedFiles: string[];
        totalSize: number;
    }> {
        const fileArray = Array.from(files);
        const supportedFiles: Array<{ name: string; format: FileFormat; size: number }> = [];
        const unsupportedFiles: string[] = [];
        let totalSize = 0;

        for (const file of fileArray) {
            if (isFormatSupported(file)) {
                supportedFiles.push({
                    name: file.name,
                    format: detectFileFormat(file),
                    size: file.size
                });
                totalSize += file.size;
            } else {
                unsupportedFiles.push(file.name);
            }
        }

        return { supportedFiles, unsupportedFiles, totalSize };
    }
};
