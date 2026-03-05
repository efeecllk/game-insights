/**
 * SQLite Importer
 * Features: Browser-based SQLite reading using sql.js
 */

import type { ImportResult, ImportOptions } from './index';

/** Maximum SQLite file size: 100 MB (prevents browser tab crash on large files) */
const MAX_SQLITE_FILE_SIZE = 100 * 1024 * 1024;

/** Allowed file extensions for SQLite imports */
const ALLOWED_SQLITE_EXTENSIONS = new Set(['db', 'sqlite', 'sqlite3']);

export interface SQLiteImportOptions extends ImportOptions {
    tableName?: string;
    query?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlJsStatic = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlValue = any;

let SQL: SqlJsStatic | null = null;

/**
 * Sanitize a SQLite identifier (table/column name) to prevent SQL injection.
 * Only allows alphanumeric, underscores, hyphens, and spaces.
 */
function sanitizeSqlIdentifier(name: string): string {
    if (!/^[a-zA-Z0-9_ -]+$/.test(name)) {
        throw new Error(`Invalid identifier: "${name}" contains disallowed characters`);
    }
    // Double-quote escaping: replace any " with "" for safe use in "identifier"
    return name.replace(/"/g, '""');
}

/**
 * Initialize SQL.js (loads WASM)
 */
async function getSqlJs(): Promise<SqlJsStatic> {
    if (!SQL) {
        // Dynamic import for ES module compatibility
        const sqlJs = await import('sql.js');
        const initSqlJs = sqlJs.default || sqlJs;
        SQL = await initSqlJs({
            // Load from CDN
            locateFile: (filename: string) =>
                `https://sql.js.org/dist/${filename}`
        });
    }
    return SQL;
}

export const sqliteImporter = {
    /**
     * Get list of tables from database
     */
    async getTables(file: File): Promise<string[]> {
        let db: Database | null = null;
        try {
            const SqlJs = await getSqlJs();
            const buffer = await file.arrayBuffer();
            db = new SqlJs.Database(new Uint8Array(buffer));

            const tableQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
            const result = db.exec(tableQuery);

            if (result.length === 0 || !result[0].values) {
                return [];
            }

            return result[0].values.map((row: SqlValue[]) => row[0] as string);
        } catch {
            return [];
        } finally {
            db?.close();
        }
    },

    /**
     * Get table schema
     */
    async getTableSchema(file: File, tableName: string): Promise<{ name: string; type: string }[]> {
        let db: Database | null = null;
        try {
            const SqlJs = await getSqlJs();
            const buffer = await file.arrayBuffer();
            db = new SqlJs.Database(new Uint8Array(buffer));

            const safeName = sanitizeSqlIdentifier(tableName);
            const result = db.exec(`PRAGMA table_info("${safeName}")`);

            if (result.length === 0 || !result[0].values) {
                return [];
            }

            return result[0].values.map((row: SqlValue[]) => ({
                name: row[1] as string,
                type: row[2] as string
            }));
        } catch {
            return [];
        } finally {
            db?.close();
        }
    },

    /**
     * Import SQLite database
     */
    async import(file: File, options: SQLiteImportOptions = {}): Promise<ImportResult> {
        const startTime = Date.now();
        const warnings: string[] = [];

        // Extension validation
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (ext && !ALLOWED_SQLITE_EXTENSIONS.has(ext)) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
                metadata: {
                    source: 'file',
                    fileName: file.name,
                    fileSize: file.size,
                    format: 'sqlite',
                    importedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime
                },
                errors: [{
                    message: `Unsupported file extension ".${ext}". Expected one of: ${[...ALLOWED_SQLITE_EXTENSIONS].join(', ')}`,
                    severity: 'error'
                }],
                warnings
            };
        }

        // File size guard — prevents browser tab crash on very large files
        if (file.size > MAX_SQLITE_FILE_SIZE) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
                metadata: {
                    source: 'file',
                    fileName: file.name,
                    fileSize: file.size,
                    format: 'sqlite',
                    importedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime
                },
                errors: [{
                    message: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum supported size is ${MAX_SQLITE_FILE_SIZE / 1024 / 1024} MB.`,
                    severity: 'error'
                }],
                warnings
            };
        }

        try {
            const SqlJs = await getSqlJs();
            const buffer = await file.arrayBuffer();
            const db: Database = new SqlJs.Database(new Uint8Array(buffer));

            try {
                let query: string;
                let tableName = options.tableName;

                if (options.query) {
                    // Whitelist: only allow SELECT and WITH (CTE) statements
                    const upperQuery = options.query.toUpperCase().trim();
                    if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
                        throw new Error('Custom queries may only read data (SELECT statements)');
                    }
                    // Also block dangerous keywords even inside SELECT
                    if (/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|ATTACH|DETACH)\b/.test(upperQuery)) {
                        throw new Error('Custom queries may only read data (SELECT statements)');
                    }
                    query = options.query;
                } else {
                    // Find table to query — use the already-opened db to avoid double file read
                    if (!tableName) {
                        const tableResult = db.exec(
                            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                        );

                        const tables = (tableResult.length > 0 && tableResult[0].values)
                            ? tableResult[0].values.map((row: SqlValue[]) => row[0] as string)
                            : [];

                        if (tables.length === 0) {
                            return {
                                success: false,
                                data: [],
                                columns: [],
                                rowCount: 0,
                                metadata: {
                                    source: 'file',
                                    fileName: file.name,
                                    fileSize: file.size,
                                    format: 'sqlite',
                                    importedAt: new Date().toISOString(),
                                    processingTimeMs: Date.now() - startTime
                                },
                                errors: [{ message: 'No tables found in database', severity: 'error' }],
                                warnings
                            };
                        }

                        tableName = tables[0];
                        if (tables.length > 1) {
                            warnings.push(`Multiple tables found, using "${tableName}". Available: ${tables.join(', ')}`);
                        }
                    }

                    // Build query with limit/offset
                    const limit = options.maxRows || 10000;
                    const offset = options.skipRows || 0;
                    const safeTableName = sanitizeSqlIdentifier(tableName!);
                    query = `SELECT * FROM "${safeTableName}" LIMIT ${limit} OFFSET ${offset}`;
                }

                // Execute query
                const result = db.exec(query);

                if (result.length === 0) {
                    return {
                        success: true,
                        data: [],
                        columns: [],
                        rowCount: 0,
                        metadata: {
                            source: 'file',
                            fileName: file.name,
                            fileSize: file.size,
                            format: 'sqlite',
                            importedAt: new Date().toISOString(),
                            processingTimeMs: Date.now() - startTime
                        },
                        errors: [],
                        warnings: ['Query returned no results']
                    };
                }

                const columns = result[0].columns;
                const rows = result[0].values;

                // Convert to objects
                const data: Record<string, unknown>[] = rows.map((row: SqlValue[]) => {
                    const obj: Record<string, unknown> = {};
                    for (let i = 0; i < columns.length; i++) {
                        obj[columns[i]] = row[i];
                    }
                    return obj;
                });

                return {
                    success: true,
                    data,
                    columns,
                    rowCount: data.length,
                    metadata: {
                        source: 'file',
                        fileName: file.name,
                        fileSize: file.size,
                        format: 'sqlite',
                        importedAt: new Date().toISOString(),
                        processingTimeMs: Date.now() - startTime
                    },
                    errors: [],
                    warnings
                };

            } finally {
                db.close();
            }

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
                    format: 'sqlite',
                    importedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime
                },
                errors: [{
                    message: error instanceof Error ? error.message : 'Failed to parse SQLite database',
                    severity: 'error'
                }],
                warnings
            };
        }
    }
};
