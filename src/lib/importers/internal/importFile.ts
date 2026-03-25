import type { ImportOptions, ImportResult } from './types';
import { detectFileFormat, validateFileMimeType } from './fileFormat';
import { createFailureResult, finalizeImportResult } from './resultBuilders';

export async function importFile(
    file: File,
    options: ImportOptions = {}
): Promise<ImportResult> {
    const startTime = Date.now();
    const format = detectFileFormat(file);

    const mimeError = validateFileMimeType(file);
    if (mimeError) {
        return createFailureResult({
            source: 'file',
            fileName: file.name,
            fileSize: file.size,
            message: mimeError,
        });
    }

    try {
        let result: ImportResult;

        switch (format) {
            case 'csv':
            case 'tsv': {
                const { csvImporter: importer } = await import('../csvImporter');
                result = await importer.import(file, {
                    ...options,
                    delimiter: format === 'tsv' ? '\t' : options.delimiter,
                });
                break;
            }
            case 'json':
            case 'ndjson': {
                const { jsonImporter: importer } = await import('../jsonImporter');
                result = await importer.import(file, {
                    ...options,
                    isNDJSON: format === 'ndjson',
                });
                break;
            }
            case 'xlsx':
            case 'xls': {
                const { excelImporter: importer } = await import('../excelImporter');
                result = await importer.import(file, options);
                break;
            }
            case 'sqlite': {
                const { sqliteImporter: importer } = await import('../sqliteImporter');
                result = await importer.import(file, options);
                break;
            }
            default:
                return createFailureResult({
                    source: 'file',
                    fileName: file.name,
                    fileSize: file.size,
                    message: `Unsupported file format: ${file.name.split('.').pop()}`,
                });
        }

        return finalizeImportResult(result, startTime);
    } catch (error) {
        return createFailureResult({
            source: 'file',
            fileName: file.name,
            fileSize: file.size,
            message: error instanceof Error ? error.message : 'Unknown import error',
        });
    }
}
