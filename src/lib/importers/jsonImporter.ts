/**
 * JSON/NDJSON Importer
 * Features: Array, nested objects, NDJSON/JSON Lines support
 */

import type { ImportResult, ImportOptions } from './index';

export interface JSONImportOptions extends ImportOptions {
    isNDJSON?: boolean;
    dataPath?: string; // Path to data array (e.g., "data", "results", "items")
    flattenNested?: boolean;
}

/**
 * Flatten nested object with dot notation
 */
function flattenObject(
    obj: Record<string, unknown>,
    prefix = '',
    maxDepth = 3
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            maxDepth > 0
        ) {
            Object.assign(result, flattenObject(value as Record<string, unknown>, newKey, maxDepth - 1));
        } else if (Array.isArray(value)) {
            // Convert arrays to JSON string for now
            result[newKey] = JSON.stringify(value);
        } else {
            result[newKey] = value;
        }
    }

    return result;
}

/**
 * Get value at path (e.g., "data.results")
 */
function getAtPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[part];
    }

    return current;
}

/**
 * Auto-detect the data array in a JSON object
 */
function findDataArray(obj: Record<string, unknown>): { path: string; data: unknown[] } | null {
    // Common data paths
    const commonPaths = ['data', 'results', 'items', 'rows', 'records', 'events', 'entries'];

    for (const path of commonPaths) {
        const value = obj[path];
        if (Array.isArray(value) && value.length > 0) {
            return { path, data: value };
        }
    }

    // Look for any array property
    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            return { path: key, data: value };
        }
    }

    return null;
}

/**
 * Parse NDJSON (newline-delimited JSON)
 */
function parseNDJSON(content: string): { data: Record<string, unknown>[]; errors: string[] } {
    const lines = content.split('\n').filter(line => line.trim());
    const data: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        try {
            const parsed = JSON.parse(lines[i]);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                data.push(parsed);
            } else {
                errors.push(`Line ${i + 1}: Expected object, got ${typeof parsed}`);
            }
        } catch {
            errors.push(`Line ${i + 1}: Invalid JSON`);
        }
    }

    return { data, errors };
}

export const jsonImporter = {
    /**
     * Import JSON/NDJSON file
     */
    async import(file: File, options: JSONImportOptions = {}): Promise<ImportResult> {
        const startTime = Date.now();
        const content = await file.text();
        const errors: ImportResult['errors'] = [];
        const warnings: string[] = [];

        let rawData: Record<string, unknown>[];

        // Check if NDJSON (each line is a JSON object)
        const isNDJSON = options.isNDJSON ||
            (content.trim().startsWith('{') && !content.trim().endsWith('}'));

        if (isNDJSON) {
            const result = parseNDJSON(content);
            rawData = result.data;
            result.errors.forEach(e => warnings.push(e));
        } else {
            try {
                const parsed = JSON.parse(content);

                if (Array.isArray(parsed)) {
                    // Direct array of objects
                    rawData = parsed.filter(item => typeof item === 'object' && item !== null);
                } else if (typeof parsed === 'object' && parsed !== null) {
                    // Object with data array
                    if (options.dataPath) {
                        const atPath = getAtPath(parsed, options.dataPath);
                        if (Array.isArray(atPath)) {
                            rawData = atPath.filter(item => typeof item === 'object' && item !== null);
                        } else {
                            return {
                                success: false,
                                data: [],
                                columns: [],
                                rowCount: 0,
                                metadata: {
                                    source: 'file',
                                    fileName: file.name,
                                    fileSize: file.size,
                                    format: 'json',
                                    importedAt: new Date().toISOString(),
                                    processingTimeMs: Date.now() - startTime
                                },
                                errors: [{
                                    message: `Path "${options.dataPath}" is not an array`,
                                    severity: 'error'
                                }],
                                warnings
                            };
                        }
                    } else {
                        // Auto-detect data array
                        const found = findDataArray(parsed);
                        if (found) {
                            rawData = found.data.filter(item => typeof item === 'object' && item !== null) as Record<string, unknown>[];
                            warnings.push(`Auto-detected data at path: "${found.path}"`);
                        } else {
                            // Treat the object itself as a single row
                            rawData = [parsed];
                            warnings.push('No data array found, treating root object as single row');
                        }
                    }
                } else {
                    return {
                        success: false,
                        data: [],
                        columns: [],
                        rowCount: 0,
                        metadata: {
                            source: 'file',
                            fileName: file.name,
                            fileSize: file.size,
                            format: 'json',
                            importedAt: new Date().toISOString(),
                            processingTimeMs: Date.now() - startTime
                        },
                        errors: [{
                            message: 'JSON must be an array or object containing an array',
                            severity: 'error'
                        }],
                        warnings
                    };
                }
            } catch (e) {
                return {
                    success: false,
                    data: [],
                    columns: [],
                    rowCount: 0,
                    metadata: {
                        source: 'file',
                        fileName: file.name,
                        fileSize: file.size,
                        format: 'json',
                        importedAt: new Date().toISOString(),
                        processingTimeMs: Date.now() - startTime
                    },
                    errors: [{
                        message: `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`,
                        severity: 'error'
                    }],
                    warnings
                };
            }
        }

        // Apply skip/limit
        const skipRows = options.skipRows || 0;
        const maxRows = options.maxRows;
        let data = rawData.slice(skipRows);
        if (maxRows) data = data.slice(0, maxRows);

        // Flatten nested objects if requested
        if (options.flattenNested !== false) {
            data = data.map(row => flattenObject(row));
        }

        // Get all unique columns
        const columnSet = new Set<string>();
        for (const row of data) {
            Object.keys(row).forEach(key => columnSet.add(key));
        }
        const columns = Array.from(columnSet);

        // Normalize all rows to have all columns
        const normalizedData = data.map(row => {
            const normalized: Record<string, unknown> = {};
            for (const col of columns) {
                normalized[col] = row[col] ?? null;
            }
            return normalized;
        });

        return {
            success: true,
            data: normalizedData,
            columns,
            rowCount: normalizedData.length,
            metadata: {
                source: 'file',
                fileName: file.name,
                fileSize: file.size,
                format: isNDJSON ? 'ndjson' : 'json',
                importedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime
            },
            errors,
            warnings
        };
    }
};
