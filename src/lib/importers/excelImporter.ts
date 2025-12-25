/**
 * Excel Importer
 * Features: .xlsx and .xls support, multi-sheet, auto-header detection
 */

import * as XLSX from 'xlsx';
import type { ImportResult, ImportOptions } from './index';

export interface ExcelImportOptions extends ImportOptions {
    sheetIndex?: number;
    sheetName?: string;
    range?: string; // e.g., "A1:Z100"
}

/**
 * Parse value from Excel cell
 */
function parseExcelValue(value: unknown): unknown {
    if (value === undefined || value === null || value === '') return null;

    // XLSX already parses dates as Date objects
    if (value instanceof Date) {
        return value.toISOString();
    }

    return value;
}

/**
 * Detect if first row is a header
 */
function detectHeader(rows: unknown[][]): boolean {
    if (rows.length < 2) return true;

    const firstRow = rows[0];
    const secondRow = rows[1];

    let firstRowNumeric = 0;
    let secondRowNumeric = 0;

    for (let i = 0; i < Math.min(firstRow.length, secondRow.length); i++) {
        if (typeof firstRow[i] === 'number') firstRowNumeric++;
        if (typeof secondRow[i] === 'number') secondRowNumeric++;
    }

    return firstRowNumeric < secondRowNumeric || firstRowNumeric === 0;
}

export const excelImporter = {
    /**
     * Get list of sheet names from file
     */
    async getSheets(file: File): Promise<string[]> {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        return workbook.SheetNames;
    },

    /**
     * Import Excel file
     */
    async import(file: File, options: ExcelImportOptions = {}): Promise<ImportResult> {
        const startTime = Date.now();
        const warnings: string[] = [];

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, {
                type: 'array',
                cellDates: true, // Parse dates as Date objects
                cellNF: true     // Preserve number formats
            });

            // Select sheet
            let sheetName: string;
            if (options.sheetName && workbook.SheetNames.includes(options.sheetName)) {
                sheetName = options.sheetName;
            } else if (options.sheetIndex !== undefined && options.sheetIndex < workbook.SheetNames.length) {
                sheetName = workbook.SheetNames[options.sheetIndex];
            } else {
                sheetName = workbook.SheetNames[0];
                if (workbook.SheetNames.length > 1) {
                    warnings.push(`Multiple sheets found, using "${sheetName}". Available: ${workbook.SheetNames.join(', ')}`);
                }
            }

            const sheet = workbook.Sheets[sheetName];

            // Convert to array of arrays
            const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: null,
                range: options.range
            });

            if (rawRows.length === 0) {
                return {
                    success: false,
                    data: [],
                    columns: [],
                    rowCount: 0,
                    metadata: {
                        source: 'file',
                        fileName: file.name,
                        fileSize: file.size,
                        format: file.name.endsWith('.xlsx') ? 'xlsx' : 'xls',
                        sheetName,
                        importedAt: new Date().toISOString(),
                        processingTimeMs: Date.now() - startTime
                    },
                    errors: [{ message: 'Sheet is empty', severity: 'error' }],
                    warnings
                };
            }

            // Filter out completely empty rows
            const rows = rawRows.filter(row =>
                row.some(cell => cell !== null && cell !== undefined && cell !== '')
            );

            // Detect header
            const hasHeader = options.hasHeader ?? detectHeader(rows);
            const headerRow = hasHeader
                ? rows[0].map((h, i) => (h?.toString().trim() || `column_${i + 1}`))
                : rows[0].map((_, i) => `column_${i + 1}`);
            const dataRows = hasHeader ? rows.slice(1) : rows;

            // Apply skip/limit
            const skipRows = options.skipRows || 0;
            const maxRows = options.maxRows;
            let limitedRows = dataRows.slice(skipRows);
            if (maxRows) limitedRows = limitedRows.slice(0, maxRows);

            // Convert to objects
            const data: Record<string, unknown>[] = [];
            for (const row of limitedRows) {
                const obj: Record<string, unknown> = {};
                for (let j = 0; j < headerRow.length; j++) {
                    const key = headerRow[j];
                    obj[key] = parseExcelValue(row[j]);
                }
                data.push(obj);
            }

            const columns = headerRow.filter(Boolean);

            return {
                success: true,
                data,
                columns,
                rowCount: data.length,
                metadata: {
                    source: 'file',
                    fileName: file.name,
                    fileSize: file.size,
                    format: file.name.endsWith('.xlsx') ? 'xlsx' : 'xls',
                    sheetName,
                    importedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime
                },
                errors: [],
                warnings
            };

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
                    format: file.name.endsWith('.xlsx') ? 'xlsx' : 'xls',
                    importedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime
                },
                errors: [{
                    message: error instanceof Error ? error.message : 'Failed to parse Excel file',
                    severity: 'error'
                }],
                warnings
            };
        }
    }
};
