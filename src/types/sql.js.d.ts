/**
 * Type declarations for sql.js
 */

declare module 'sql.js' {
    export type SqlValue = string | number | Uint8Array | null;

    export interface QueryExecResult {
        columns: string[];
        values: SqlValue[][];
    }

    export interface Database {
        run(sql: string, params?: SqlValue[]): Database;
        exec(sql: string, params?: SqlValue[]): QueryExecResult[];
        each(sql: string, params: SqlValue[], callback: (row: Record<string, SqlValue>) => void, done: () => void): Database;
        prepare(sql: string): Statement;
        export(): Uint8Array;
        close(): void;
        getRowsModified(): number;
    }

    export interface Statement {
        bind(params?: SqlValue[]): boolean;
        step(): boolean;
        getAsObject(params?: Record<string, SqlValue>): Record<string, SqlValue>;
        get(params?: SqlValue[]): SqlValue[];
        getColumnNames(): string[];
        free(): boolean;
        reset(): void;
    }

    export interface SqlJsStatic {
        Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
    }

    export interface InitSqlJsOptions {
        locateFile?: (filename: string) => string;
        wasmBinary?: ArrayBuffer;
    }

    export default function initSqlJs(options?: InitSqlJsOptions): Promise<SqlJsStatic>;
}
