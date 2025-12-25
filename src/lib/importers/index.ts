/**
 * Universal Data Importer
 * Unified interface for importing data from any source
 */

export interface ImportResult {
    success: boolean;
    data: Record<string, unknown>[];
    columns: string[];
    rowCount: number;
    metadata: ImportMetadata;
    errors: ImportError[];
    warnings: string[];
}

export interface ImportMetadata {
    source: ImportSource;
    fileName?: string;
    fileSize?: number;
    encoding?: string;
    format?: string;
    delimiter?: string;
    sheetName?: string;
    importedAt: string;
    processingTimeMs: number;
}

export interface ImportError {
    line?: number;
    column?: string;
    message: string;
    severity: 'error' | 'warning';
}

export type ImportSource =
    | 'file'
    | 'url'
    | 'clipboard'
    | 'api';

export type FileFormat =
    | 'csv'
    | 'json'
    | 'ndjson'
    | 'xlsx'
    | 'xls'
    | 'sqlite'
    | 'tsv'
    | 'unknown';

export interface ImportOptions {
    encoding?: string;
    delimiter?: string;
    hasHeader?: boolean;
    sheetIndex?: number;
    sheetName?: string;
    tableName?: string;
    maxRows?: number;
    skipRows?: number;
}

/**
 * Detect file format from extension and content
 */
export function detectFileFormat(file: File): FileFormat {
    const ext = file.name.split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'csv': return 'csv';
        case 'tsv': return 'tsv';
        case 'json': return 'json';
        case 'ndjson':
        case 'jsonl': return 'ndjson';
        case 'xlsx': return 'xlsx';
        case 'xls': return 'xls';
        case 'db':
        case 'sqlite':
        case 'sqlite3': return 'sqlite';
        default: return 'unknown';
    }
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
    return [
        '.csv', '.tsv',
        '.json', '.ndjson', '.jsonl',
        '.xlsx', '.xls',
        '.db', '.sqlite', '.sqlite3'
    ];
}

/**
 * Check if file format is supported
 */
export function isFormatSupported(file: File): boolean {
    return detectFileFormat(file) !== 'unknown';
}

// Export all importers
export { csvImporter, type CSVImportOptions } from './csvImporter';
export { jsonImporter, type JSONImportOptions } from './jsonImporter';
export { excelImporter, type ExcelImportOptions } from './excelImporter';
export { sqliteImporter, type SQLiteImportOptions } from './sqliteImporter';
export { urlImporter, type URLImportOptions } from './urlImporter';
export { clipboardImporter } from './clipboardImporter';

// Import all importers for unified import function
import { csvImporter } from './csvImporter';
import { jsonImporter } from './jsonImporter';
import { excelImporter } from './excelImporter';
import { sqliteImporter } from './sqliteImporter';

/**
 * Universal import function - auto-detects format and imports
 */
export async function importFile(
    file: File,
    options: ImportOptions = {}
): Promise<ImportResult> {
    const startTime = Date.now();
    const format = detectFileFormat(file);

    try {
        let result: ImportResult;

        switch (format) {
            case 'csv':
            case 'tsv':
                result = await csvImporter.import(file, {
                    ...options,
                    delimiter: format === 'tsv' ? '\t' : options.delimiter
                });
                break;
            case 'json':
            case 'ndjson':
                result = await jsonImporter.import(file, {
                    ...options,
                    isNDJSON: format === 'ndjson'
                });
                break;
            case 'xlsx':
            case 'xls':
                result = await excelImporter.import(file, options);
                break;
            case 'sqlite':
                result = await sqliteImporter.import(file, options);
                break;
            default:
                return {
                    success: false,
                    data: [],
                    columns: [],
                    rowCount: 0,
                    metadata: {
                        source: 'file',
                        fileName: file.name,
                        fileSize: file.size,
                        importedAt: new Date().toISOString(),
                        processingTimeMs: Date.now() - startTime
                    },
                    errors: [{
                        message: `Unsupported file format: ${file.name.split('.').pop()}`,
                        severity: 'error'
                    }],
                    warnings: []
                };
        }

        // Update processing time
        result.metadata.processingTimeMs = Date.now() - startTime;
        return result;

    } catch (error) {
        return {
            success: false,
            data: [],
            columns: [],
            rowCount: 0,
            metadata: {
                source: 'file',
                fileName: file.name,
                fileSize: file.size,
                importedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime
            },
            errors: [{
                message: error instanceof Error ? error.message : 'Unknown import error',
                severity: 'error'
            }],
            warnings: []
        };
    }
}
