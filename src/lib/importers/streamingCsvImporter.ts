/**
 * Streaming CSV Importer
 * Handles large files (1GB+) using Papa Parse streaming and chunked storage
 */

import Papa from 'papaparse';
import type { ImportResult, ImportError } from './index';

export interface StreamingImportOptions {
    /** Chunk size for processing (default: 10000 rows) */
    chunkSize?: number;
    /** Maximum rows to import (0 = unlimited) */
    maxRows?: number;
    /** Sample size for preview (default: 1000 rows) */
    sampleSize?: number;
    /** Custom delimiter (auto-detected if not provided) */
    delimiter?: string;
    /** Progress callback */
    onProgress?: (progress: StreamingProgress) => void;
    /** Chunk callback - receives each chunk of data */
    onChunk?: (chunk: ChunkData) => Promise<void>;
}

export interface StreamingProgress {
    /** Bytes processed so far */
    bytesProcessed: number;
    /** Total file size in bytes */
    totalBytes: number;
    /** Percentage complete (0-100) */
    percent: number;
    /** Rows processed so far */
    rowsProcessed: number;
    /** Estimated total rows (rough estimate based on sample) */
    estimatedTotalRows: number;
    /** Current phase: 'scanning' | 'parsing' | 'storing' | 'complete' */
    phase: 'scanning' | 'parsing' | 'storing' | 'complete';
    /** Current chunk index */
    chunkIndex: number;
}

export interface ChunkData {
    /** Chunk index (0-based) */
    index: number;
    /** Data rows in this chunk */
    rows: Record<string, unknown>[];
    /** Column names */
    columns: string[];
    /** Is this the first chunk? */
    isFirst: boolean;
    /** Is this the last chunk? */
    isLast: boolean;
}

export interface StreamingImportResult extends ImportResult {
    /** Total chunks created */
    totalChunks: number;
    /** Chunk IDs for retrieving data */
    chunkIds: string[];
    /** Sample data for preview (first N rows) */
    sampleData: Record<string, unknown>[];
    /** Was the import streamed (true) or loaded in memory (false)? */
    wasStreamed: boolean;
}

/**
 * Detect delimiter from first few KB of file
 */
async function detectDelimiter(file: File): Promise<string> {
    const sampleSize = Math.min(file.size, 32768); // 32KB sample
    const sample = await file.slice(0, sampleSize).text();

    const delimiters = [',', '\t', ';', '|'];
    const lines = sample.split('\n').slice(0, 10);

    let bestDelimiter = ',';
    let maxScore = 0;

    for (const delimiter of delimiters) {
        const counts = lines.map(line => {
            let count = 0;
            let inQuotes = false;
            for (const char of line) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === delimiter && !inQuotes) count++;
            }
            return count;
        });

        // Score based on consistency and count
        const uniqueCounts = new Set(counts.filter(c => c > 0));
        const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

        // Perfect consistency gets bonus
        const consistencyBonus = uniqueCounts.size === 1 ? 100 : 0;
        const score = avgCount + consistencyBonus;

        if (score > maxScore) {
            maxScore = score;
            bestDelimiter = delimiter;
        }
    }

    return bestDelimiter;
}

/**
 * Parse value to appropriate type
 */
function parseValue(value: string): unknown {
    if (value === '' || value === null || value === undefined) return null;

    const trimmed = value.trim();

    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return num;

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) return date.toISOString();
    }

    return trimmed;
}

/**
 * Streaming CSV importer for large files
 */
export const streamingCsvImporter = {
    /**
     * Check if file should use streaming (>50MB)
     */
    shouldStream(file: File): boolean {
        return file.size > 50 * 1024 * 1024; // 50MB threshold
    },

    /**
     * Get estimated row count from file size
     */
    async estimateRowCount(file: File): Promise<number> {
        // Sample first 100KB to estimate avg row size
        const sampleSize = Math.min(file.size, 102400);
        const sample = await file.slice(0, sampleSize).text();
        const sampleLines = sample.split('\n').length;
        const avgBytesPerRow = sampleSize / sampleLines;
        return Math.ceil(file.size / avgBytesPerRow);
    },

    /**
     * Import large CSV with streaming
     */
    async import(
        file: File,
        options: StreamingImportOptions = {}
    ): Promise<StreamingImportResult> {
        const startTime = Date.now();
        const chunkSize = options.chunkSize || 10000;
        const sampleSize = options.sampleSize || 1000;
        const maxRows = options.maxRows || 0;

        const errors: ImportError[] = [];
        const warnings: string[] = [];
        const chunkIds: string[] = [];
        const sampleData: Record<string, unknown>[] = [];

        let columns: string[] = [];
        let rowsProcessed = 0;
        let chunkIndex = 0;
        let currentChunk: Record<string, unknown>[] = [];
        let headerRow: string[] | null = null;

        // Detect delimiter
        const delimiter = options.delimiter || await detectDelimiter(file);

        // Estimate total rows for progress
        const estimatedTotalRows = await this.estimateRowCount(file);

        // Report initial progress
        options.onProgress?.({
            bytesProcessed: 0,
            totalBytes: file.size,
            percent: 0,
            rowsProcessed: 0,
            estimatedTotalRows,
            phase: 'parsing',
            chunkIndex: 0
        });

        return new Promise((resolve, _reject) => {
            let bytesProcessed = 0;
            let stopped = false;

            Papa.parse(file, {
                delimiter,
                skipEmptyLines: true,

                step: async (results, parser) => {
                    if (stopped) return;

                    const row = results.data as string[];

                    // First row is header
                    if (!headerRow) {
                        headerRow = row.map(h => h?.trim() || `column_${row.indexOf(h) + 1}`);
                        columns = headerRow;
                        return;
                    }

                    // Convert row to object
                    const obj: Record<string, unknown> = {};
                    for (let i = 0; i < headerRow.length; i++) {
                        obj[headerRow[i]] = parseValue(row[i] || '');
                    }

                    // Collect sample data
                    if (sampleData.length < sampleSize) {
                        sampleData.push(obj);
                    }

                    currentChunk.push(obj);
                    rowsProcessed++;

                    // Check max rows
                    if (maxRows > 0 && rowsProcessed >= maxRows) {
                        stopped = true;
                        parser.abort();
                    }

                    // Flush chunk if full
                    if (currentChunk.length >= chunkSize) {
                        const chunkData: ChunkData = {
                            index: chunkIndex,
                            rows: currentChunk,
                            columns,
                            isFirst: chunkIndex === 0,
                            isLast: false
                        };

                        // Call chunk callback
                        if (options.onChunk) {
                            try {
                                await options.onChunk(chunkData);
                            } catch (err) {
                                errors.push({
                                    message: `Chunk ${chunkIndex} storage failed: ${err}`,
                                    severity: 'warning'
                                });
                            }
                        }

                        chunkIds.push(`chunk_${chunkIndex}`);
                        chunkIndex++;
                        currentChunk = [];

                        // Update progress
                        bytesProcessed = Math.min(
                            file.size,
                            (rowsProcessed / estimatedTotalRows) * file.size
                        );

                        options.onProgress?.({
                            bytesProcessed,
                            totalBytes: file.size,
                            percent: Math.round((bytesProcessed / file.size) * 100),
                            rowsProcessed,
                            estimatedTotalRows,
                            phase: 'parsing',
                            chunkIndex
                        });
                    }
                },

                error: (error) => {
                    errors.push({
                        message: error.message,
                        severity: 'error'
                    });
                },

                complete: async () => {
                    // Handle remaining data in last chunk
                    if (currentChunk.length > 0) {
                        const chunkData: ChunkData = {
                            index: chunkIndex,
                            rows: currentChunk,
                            columns,
                            isFirst: chunkIndex === 0,
                            isLast: true
                        };

                        if (options.onChunk) {
                            try {
                                await options.onChunk(chunkData);
                            } catch (err) {
                                errors.push({
                                    message: `Final chunk storage failed: ${err}`,
                                    severity: 'warning'
                                });
                            }
                        }

                        chunkIds.push(`chunk_${chunkIndex}`);
                        chunkIndex++;
                    }

                    // Final progress
                    options.onProgress?.({
                        bytesProcessed: file.size,
                        totalBytes: file.size,
                        percent: 100,
                        rowsProcessed,
                        estimatedTotalRows: rowsProcessed,
                        phase: 'complete',
                        chunkIndex
                    });

                    resolve({
                        success: errors.filter(e => e.severity === 'error').length === 0,
                        data: sampleData, // Only sample in main result
                        columns,
                        rowCount: rowsProcessed,
                        totalChunks: chunkIndex,
                        chunkIds,
                        sampleData,
                        wasStreamed: true,
                        metadata: {
                            source: 'file',
                            fileName: file.name,
                            fileSize: file.size,
                            format: 'csv',
                            delimiter,
                            importedAt: new Date().toISOString(),
                            processingTimeMs: Date.now() - startTime
                        },
                        errors,
                        warnings
                    });
                }
            });
        });
    },

    /**
     * Quick import for small files (non-streaming)
     */
    async importSmall(
        file: File,
        options: StreamingImportOptions = {}
    ): Promise<StreamingImportResult> {
        const startTime = Date.now();
        const content = await file.text();
        const delimiter = options.delimiter || await detectDelimiter(file);
        const errors: ImportError[] = [];
        const warnings: string[] = [];

        const parseResult = Papa.parse(content, {
            delimiter,
            skipEmptyLines: true
        });

        if (parseResult.errors.length > 0) {
            parseResult.errors.forEach(err => {
                warnings.push(`Row ${err.row}: ${err.message}`);
            });
        }

        const rows = parseResult.data as string[][];
        if (rows.length === 0) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
                totalChunks: 0,
                chunkIds: [],
                sampleData: [],
                wasStreamed: false,
                metadata: {
                    source: 'file',
                    fileName: file.name,
                    fileSize: file.size,
                    format: 'csv',
                    delimiter,
                    importedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime
                },
                errors: [{ message: 'Empty file', severity: 'error' }],
                warnings
            };
        }

        const headerRow = rows[0].map((h, i) => h?.trim() || `column_${i + 1}`);
        const dataRows = rows.slice(1);

        // Apply max rows limit
        const maxRows = options.maxRows || 0;
        const limitedRows = maxRows > 0 ? dataRows.slice(0, maxRows) : dataRows;

        // Convert to objects
        const data = limitedRows.map(row => {
            const obj: Record<string, unknown> = {};
            for (let i = 0; i < headerRow.length; i++) {
                obj[headerRow[i]] = parseValue(row[i] || '');
            }
            return obj;
        });

        return {
            success: true,
            data,
            columns: headerRow,
            rowCount: data.length,
            totalChunks: 1,
            chunkIds: ['chunk_0'],
            sampleData: data.slice(0, options.sampleSize || 1000),
            wasStreamed: false,
            metadata: {
                source: 'file',
                fileName: file.name,
                fileSize: file.size,
                format: 'csv',
                delimiter,
                importedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime
            },
            errors,
            warnings
        };
    },

    /**
     * Auto-select import method based on file size
     */
    async autoImport(
        file: File,
        options: StreamingImportOptions = {}
    ): Promise<StreamingImportResult> {
        if (this.shouldStream(file)) {
            return this.import(file, options);
        }
        return this.importSmall(file, options);
    }
};

export default streamingCsvImporter;
