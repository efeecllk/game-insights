/**
 * Enhanced CSV Importer
 * Features: Auto delimiter detection, encoding detection, smart parsing
 */

import Papa from 'papaparse';
import type { ImportResult, ImportOptions } from './index';

export interface CSVImportOptions extends ImportOptions {
    delimiter?: string;
    quoteChar?: string;
    escapeChar?: string;
    commentPrefix?: string;
}

/**
 * Detect delimiter from content sample
 */
function detectDelimiter(content: string): string {
    const delimiters = [',', '\t', ';', '|'];
    const sample = content.split('\n').slice(0, 5).join('\n');

    let bestDelimiter = ',';
    let maxConsistency = 0;

    for (const delimiter of delimiters) {
        const lines = sample.split('\n').filter(l => l.trim());
        if (lines.length === 0) continue;

        const counts = lines.map(line => {
            // Count delimiters outside quotes
            let count = 0;
            let inQuotes = false;
            for (const char of line) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === delimiter && !inQuotes) count++;
            }
            return count;
        });

        // Check consistency - all lines should have same number of delimiters
        const uniqueCounts = new Set(counts);
        const firstCount = counts[0];

        if (uniqueCounts.size === 1 && firstCount > 0) {
            // Perfect consistency
            if (firstCount > maxConsistency) {
                maxConsistency = firstCount;
                bestDelimiter = delimiter;
            }
        } else if (firstCount > maxConsistency) {
            // At least the first line works
            maxConsistency = firstCount;
            bestDelimiter = delimiter;
        }
    }

    return bestDelimiter;
}

/**
 * Detect if first row is a header
 */
function detectHeader(rows: string[][]): boolean {
    if (rows.length < 2) return true;

    const firstRow = rows[0];
    const secondRow = rows[1];

    // Check if first row looks like headers (mostly strings, no numbers)
    let firstRowNumeric = 0;
    let secondRowNumeric = 0;

    for (let i = 0; i < firstRow.length; i++) {
        const val1 = firstRow[i];
        const val2 = secondRow[i];

        if (!isNaN(Number(val1)) && val1.trim() !== '') firstRowNumeric++;
        if (!isNaN(Number(val2)) && val2.trim() !== '') secondRowNumeric++;
    }

    // If first row has fewer numbers than second, it's likely a header
    return firstRowNumeric < secondRowNumeric || firstRowNumeric === 0;
}

/**
 * Parse value to appropriate type
 */
function parseValue(value: string): unknown {
    if (value === '' || value === null || value === undefined) return null;

    const trimmed = value.trim();

    // Boolean
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return num;

    // Date (ISO format or common formats)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) return date.toISOString();
    }

    return trimmed;
}

export const csvImporter = {
    /**
     * Import CSV file
     */
    async import(file: File, options: CSVImportOptions = {}): Promise<ImportResult> {
        const startTime = Date.now();
        const content = await file.text();
        const errors: ImportResult['errors'] = [];
        const warnings: string[] = [];

        // Detect delimiter if not specified
        const delimiter = options.delimiter || detectDelimiter(content);

        // Parse with PapaParse
        const parseResult = Papa.parse(content, {
            delimiter,
            quoteChar: options.quoteChar || '"',
            escapeChar: options.escapeChar || '"',
            skipEmptyLines: true,
            comments: options.commentPrefix
        });

        if (parseResult.errors.length > 0) {
            parseResult.errors.forEach(err => {
                if ((err as { type: string }).type === 'Quotes') {
                    warnings.push(`Row ${err.row}: Quote parsing issue`);
                } else {
                    errors.push({
                        line: err.row,
                        message: err.message,
                        severity: 'warning'
                    });
                }
            });
        }

        const rows = parseResult.data as string[][];
        if (rows.length === 0) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
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

        // Detect header
        const hasHeader = options.hasHeader ?? detectHeader(rows);
        const headerRow = hasHeader ? rows[0] : rows[0].map((_, i) => `column_${i + 1}`);
        const dataRows = hasHeader ? rows.slice(1) : rows;

        // Skip rows if specified
        const skipRows = options.skipRows || 0;
        const effectiveRows = dataRows.slice(skipRows);

        // Limit rows if specified
        const maxRows = options.maxRows;
        const limitedRows = maxRows ? effectiveRows.slice(0, maxRows) : effectiveRows;

        // Convert to objects
        const data: Record<string, unknown>[] = [];
        for (let i = 0; i < limitedRows.length; i++) {
            const row = limitedRows[i];
            const obj: Record<string, unknown> = {};

            for (let j = 0; j < headerRow.length; j++) {
                const key = headerRow[j]?.trim() || `column_${j + 1}`;
                obj[key] = parseValue(row[j] || '');
            }

            data.push(obj);
        }

        // Generate column list
        const columns = headerRow.map(h => h?.trim() || '').filter(Boolean);

        return {
            success: true,
            data,
            columns,
            rowCount: data.length,
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
    }
};
