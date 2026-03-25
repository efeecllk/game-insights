import type { ImportError, ImportMetadata, ImportResult, ImportSource } from './types';

interface FailureResultInput {
    source: ImportSource;
    message: string;
    fileName?: string;
    fileSize?: number;
    format?: string;
    delimiter?: string;
    sheetName?: string;
    folderName?: string;
    fileIndex?: number;
    totalFilesInFolder?: number;
    warnings?: string[];
    errors?: ImportError[];
}

function buildMetadata(input: FailureResultInput): ImportMetadata {
    return {
        source: input.source,
        fileName: input.fileName,
        fileSize: input.fileSize,
        format: input.format,
        delimiter: input.delimiter,
        sheetName: input.sheetName,
        importedAt: new Date().toISOString(),
        processingTimeMs: 0,
        folderName: input.folderName,
        fileIndex: input.fileIndex,
        totalFilesInFolder: input.totalFilesInFolder,
    };
}

export function createFailureResult(input: FailureResultInput): ImportResult {
    return {
        success: false,
        data: [],
        columns: [],
        rowCount: 0,
        metadata: buildMetadata(input),
        errors: input.errors ?? [{ message: input.message, severity: 'error' }],
        warnings: input.warnings ?? [],
    };
}

export function finalizeImportResult(result: ImportResult, startTime: number): ImportResult {
    result.metadata.processingTimeMs = Date.now() - startTime;
    return result;
}
