/**
 * Universal Data Importer
 * Unified interface for importing data from any source
 */

export type {
    ImportResult,
    ImportMetadata,
    ImportError,
    ImportSource,
    FileFormat,
    ImportOptions,
} from './internal/types';

export {
    detectFileFormat,
    getSupportedExtensions,
    isFormatSupported,
    validateFileMimeType,
} from './internal/fileFormat';

export { importFile } from './internal/importFile';

// Export all importers
export { csvImporter, type CSVImportOptions } from './csvImporter';
export { jsonImporter, type JSONImportOptions } from './jsonImporter';
export { excelImporter, type ExcelImportOptions } from './excelImporter';
export { sqliteImporter, type SQLiteImportOptions } from './sqliteImporter';
export { urlImporter, type URLImportOptions } from './urlImporter';
export { clipboardImporter } from './clipboardImporter';
export {
    streamingCsvImporter,
    type StreamingImportOptions,
    type StreamingProgress,
    type StreamingImportResult,
    type ChunkData,
} from './streamingCsvImporter';
export {
    folderImporter,
    type FolderImportOptions,
    type FolderImportResult,
    type FolderImportProgress,
    type FileImportResult,
    type ColumnCompatibility,
    type MergeStrategy,
} from './folderImporter';
