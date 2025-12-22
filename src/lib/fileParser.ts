/**
 * CSV/JSON Parser Utility
 * Handles file parsing and type inference
 */

export interface ParseResult {
    data: Record<string, unknown>[];
    headers: string[];
    rowCount: number;
    errors: string[];
}

/**
 * Parse a file (CSV or JSON)
 */
export async function parseFile(file: File): Promise<ParseResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const content = await file.text();

    switch (extension) {
        case 'csv':
            return parseCSV(content);
        case 'json':
            return parseJSON(content);
        default:
            return {
                data: [],
                headers: [],
                rowCount: 0,
                errors: [`Unsupported file format: ${extension}`]
            };
    }
}

/**
 * Parse CSV content
 */
function parseCSV(content: string): ParseResult {
    const errors: string[] = [];
    const lines = content.trim().split('\n');

    if (lines.length === 0) {
        return { data: [], headers: [], rowCount: 0, errors: ['Empty file'] };
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const data: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            const values = parseCSVLine(line);
            const row: Record<string, unknown> = {};

            headers.forEach((header, index) => {
                row[header] = parseValue(values[index]);
            });

            data.push(row);
        } catch (error) {
            errors.push(`Error parsing line ${i + 1}`);
        }
    }

    return {
        data,
        headers,
        rowCount: data.length,
        errors
    };
}

/**
 * Parse a single CSV line handling quotes
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Parse JSON content
 */
function parseJSON(content: string): ParseResult {
    try {
        const parsed = JSON.parse(content);

        // Handle array of objects
        if (Array.isArray(parsed)) {
            const data = parsed as Record<string, unknown>[];
            const headers = data.length > 0 ? Object.keys(data[0]) : [];
            return { data, headers, rowCount: data.length, errors: [] };
        }

        // Handle NDJSON-like object with data array
        if (parsed.data && Array.isArray(parsed.data)) {
            const data = parsed.data as Record<string, unknown>[];
            const headers = data.length > 0 ? Object.keys(data[0]) : [];
            return { data, headers, rowCount: data.length, errors: [] };
        }

        return {
            data: [],
            headers: [],
            rowCount: 0,
            errors: ['JSON must be an array of objects']
        };
    } catch (error) {
        return {
            data: [],
            headers: [],
            rowCount: 0,
            errors: ['Invalid JSON format']
        };
    }
}

/**
 * Parse string value to appropriate type
 */
function parseValue(value: string | undefined): unknown {
    if (value === undefined || value === '') return null;

    // Boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Number
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') return num;

    // Date (ISO format)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date.toISOString();
    }

    // String
    return value;
}

/**
 * Get sample rows for preview
 */
export function getSampleRows(data: Record<string, unknown>[], count = 5): Record<string, unknown>[] {
    return data.slice(0, count);
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
