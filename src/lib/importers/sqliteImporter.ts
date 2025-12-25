/**
 * SQLite Importer
 * Features: Browser-based SQLite reading using sql.js
 */

import initSqlJs, { Database, SqlValue } from 'sql.js';
import type { ImportResult, ImportOptions } from './index';

export interface SQLiteImportOptions extends ImportOptions {
    tableName?: string;
    query?: string;
}

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialize SQL.js (loads WASM)
 */
async function getSqlJs() {
    if (!SQL) {
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
        const SqlJs = await getSqlJs();
        const buffer = await file.arrayBuffer();
        const db = new SqlJs.Database(new Uint8Array(buffer));

        try {
            const result = db.exec(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            );

            if (result.length === 0 || !result[0].values) {
                return [];
            }

            return result[0].values.map((row: SqlValue[]) => row[0] as string);
        } finally {
            db.close();
        }
    },

    /**
     * Get table schema
     */
    async getTableSchema(file: File, tableName: string): Promise<{ name: string; type: string }[]> {
        const SqlJs = await getSqlJs();
        const buffer = await file.arrayBuffer();
        const db = new SqlJs.Database(new Uint8Array(buffer));

        try {
            const result = db.exec(`PRAGMA table_info("${tableName}")`);

            if (result.length === 0 || !result[0].values) {
                return [];
            }

            return result[0].values.map((row: SqlValue[]) => ({
                name: row[1] as string,
                type: row[2] as string
            }));
        } finally {
            db.close();
        }
    },

    /**
     * Import SQLite database
     */
    async import(file: File, options: SQLiteImportOptions = {}): Promise<ImportResult> {
        const startTime = Date.now();
        const warnings: string[] = [];

        try {
            const SqlJs = await getSqlJs();
            const buffer = await file.arrayBuffer();
            const db: Database = new SqlJs.Database(new Uint8Array(buffer));

            try {
                let query: string;
                let tableName = options.tableName;

                if (options.query) {
                    // Use custom query
                    query = options.query;
                } else {
                    // Find table to query
                    if (!tableName) {
                        const tables = await this.getTables(file);
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
                    query = `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`;
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
