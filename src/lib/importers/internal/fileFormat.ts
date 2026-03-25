import type { FileFormat } from './types';

const SUPPORTED_EXTENSIONS = [
    '.csv',
    '.tsv',
    '.json',
    '.ndjson',
    '.jsonl',
    '.xlsx',
    '.xls',
    '.db',
    '.sqlite',
    '.sqlite3',
];

const CSV_LIKE_FORMATS = new Set(['csv', 'tsv', 'xlsx', 'xls']);

/**
 * Detect file format from extension and content
 */
export function detectFileFormat(file: File): FileFormat {
    const ext = file.name.split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'csv':
            return 'csv';
        case 'tsv':
            return 'tsv';
        case 'json':
            return 'json';
        case 'ndjson':
        case 'jsonl':
            return 'ndjson';
        case 'xlsx':
            return 'xlsx';
        case 'xls':
            return 'xls';
        case 'db':
        case 'sqlite':
        case 'sqlite3':
            return 'sqlite';
        default:
            return 'unknown';
    }
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
    return [...SUPPORTED_EXTENSIONS];
}

/**
 * Check if file format is supported
 */
export function isFormatSupported(file: File): boolean {
    return detectFileFormat(file) !== 'unknown';
}

/**
 * Validate file MIME type against the detected format.
 * Returns null if valid, or an error message string if the MIME type is suspicious.
 */
export function validateFileMimeType(file: File): string | null {
    const format = detectFileFormat(file);
    const mime = file.type.toLowerCase();

    if (!CSV_LIKE_FORMATS.has(format) && format !== 'sqlite') {
        return null;
    }

    switch (format) {
        case 'xlsx':
            if (mime && mime !== '' &&
                !mime.includes('spreadsheetml') &&
                !mime.includes('excel') &&
                !mime.includes('octet-stream') &&
                !mime.includes('zip')) {
                return `Unexpected MIME type "${file.type}" for .xlsx file. The file may be corrupted or misnamed.`;
            }
            break;
        case 'xls':
            if (mime && mime !== '' &&
                !mime.includes('ms-excel') &&
                !mime.includes('excel') &&
                !mime.includes('octet-stream')) {
                return `Unexpected MIME type "${file.type}" for .xls file. The file may be corrupted or misnamed.`;
            }
            break;
        case 'sqlite':
            if (mime && mime !== '' &&
                !mime.includes('sqlite') &&
                !mime.includes('octet-stream')) {
                return `Unexpected MIME type "${file.type}" for SQLite file. The file may be corrupted or misnamed.`;
            }
            break;
        default:
            break;
    }

    return null;
}
