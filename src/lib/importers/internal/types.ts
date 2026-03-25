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
    /** For folder imports: name of the folder */
    folderName?: string;
    /** For folder imports: index of this file in the folder */
    fileIndex?: number;
    /** For folder imports: total files in folder */
    totalFilesInFolder?: number;
}

export interface ImportError {
    line?: number;
    column?: string;
    message: string;
    severity: 'error' | 'warning';
}

export type ImportSource =
    | 'file'
    | 'folder'
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
