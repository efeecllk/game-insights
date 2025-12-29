/**
 * URL Importer
 * Features: Import from public URLs, Google Sheets, Dropbox, Google Drive
 */

import { csvImporter } from './csvImporter';
import { jsonImporter } from './jsonImporter';
import type { ImportResult, ImportOptions } from './index';

export interface URLImportOptions extends ImportOptions {
    headers?: Record<string, string>;
    timeout?: number;
}

/**
 * Convert Google Sheets URL to export URL
 */
function convertGoogleSheetsUrl(url: string): string | null {
    // Format: https://docs.google.com/spreadsheets/d/{ID}/edit
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
        const id = match[1];
        // Export as CSV
        return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
    }
    return null;
}

/**
 * Convert Google Drive sharing URL to direct download
 */
function convertGoogleDriveUrl(url: string): string | null {
    // Format: https://drive.google.com/file/d/{ID}/view
    const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
        const id = match[1];
        return `https://drive.google.com/uc?export=download&id=${id}`;
    }
    return null;
}

/**
 * Convert Dropbox sharing URL to direct download
 */
function convertDropboxUrl(url: string): string | null {
    // Replace dl=0 with dl=1 for direct download
    if (url.includes('dropbox.com')) {
        return url.replace('dl=0', 'dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    }
    return null;
}

/**
 * Detect format from URL
 */
function detectFormatFromUrl(url: string): 'csv' | 'json' | 'unknown' {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('format=csv') || urlLower.endsWith('.csv')) {
        return 'csv';
    }
    if (urlLower.endsWith('.json') || urlLower.includes('format=json')) {
        return 'json';
    }

    return 'unknown';
}

export const urlImporter = {
    /**
     * Import from URL
     */
    async import(url: string, options: URLImportOptions = {}): Promise<ImportResult> {
        const startTime = Date.now();
        const warnings: string[] = [];

        // Convert special URLs
        let fetchUrl = url;
        const originalUrl = url;

        const googleSheetsUrl = convertGoogleSheetsUrl(url);
        if (googleSheetsUrl) {
            fetchUrl = googleSheetsUrl;
            warnings.push('Converted Google Sheets URL to CSV export');
        }

        const googleDriveUrl = convertGoogleDriveUrl(url);
        if (googleDriveUrl) {
            fetchUrl = googleDriveUrl;
            warnings.push('Converted Google Drive URL to direct download');
        }

        const dropboxUrl = convertDropboxUrl(url);
        if (dropboxUrl) {
            fetchUrl = dropboxUrl;
            warnings.push('Converted Dropbox URL to direct download');
        }

        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                options.timeout || 30000
            );

            const response = await fetch(fetchUrl, {
                headers: options.headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();
            const contentType = response.headers.get('content-type') || '';

            // Detect format
            let format = detectFormatFromUrl(fetchUrl);
            if (format === 'unknown') {
                if (contentType.includes('json')) {
                    format = 'json';
                } else if (contentType.includes('csv') || contentType.includes('text/plain')) {
                    format = 'csv';
                } else {
                    // Try to detect from content
                    const trimmed = content.trim();
                    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                        format = 'json';
                    } else {
                        format = 'csv';
                    }
                }
            }

            // Create a fake file for the importers
            const blob = new Blob([content], { type: 'text/plain' });
            const fileName = fetchUrl.split('/').pop() || `download.${format}`;
            const file = new File([blob], fileName);

            // Import based on format
            let result: ImportResult;
            if (format === 'json') {
                result = await jsonImporter.import(file, options);
            } else {
                result = await csvImporter.import(file, options);
            }

            // Update metadata
            result.metadata.source = 'url';
            result.metadata.fileName = originalUrl;
            result.warnings = [...warnings, ...result.warnings];
            result.metadata.processingTimeMs = Date.now() - startTime;

            return result;

        } catch (error) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
                metadata: {
                    source: 'url',
                    fileName: url,
                    importedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime
                },
                errors: [{
                    message: error instanceof Error
                        ? error.name === 'AbortError'
                            ? 'Request timed out'
                            : error.message
                        : 'Failed to fetch URL',
                    severity: 'error'
                }],
                warnings
            };
        }
    }
};
