/**
 * Clipboard Importer
 * Features: Paste from spreadsheets, JSON, or tabular data
 */

import { csvImporter } from './csvImporter';
import { jsonImporter } from './jsonImporter';
import type { ImportResult, ImportOptions } from './index';

/**
 * Detect format from pasted content
 */
function detectFormat(content: string): 'json' | 'csv' | 'tsv' {
    const trimmed = content.trim();

    // Check for JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
            JSON.parse(trimmed);
            return 'json';
        } catch {
            // Not valid JSON, continue
        }
    }

    // Check for TSV (common from spreadsheet paste)
    const lines = trimmed.split('\n').slice(0, 5);
    const tabCounts = lines.map(line => (line.match(/\t/g) || []).length);
    const commaCounts = lines.map(line => (line.match(/,/g) || []).length);

    const avgTabs = tabCounts.reduce((a, b) => a + b, 0) / tabCounts.length;
    const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length;

    // If consistent tabs and more than commas, it's TSV
    if (avgTabs > 0 && avgTabs >= avgCommas) {
        const tabVariance = tabCounts.map(c => Math.abs(c - avgTabs)).reduce((a, b) => a + b, 0);
        if (tabVariance < 2) {
            return 'tsv';
        }
    }

    return 'csv';
}

export const clipboardImporter = {
    /**
     * Import from clipboard content
     */
    async importFromText(content: string, options: ImportOptions = {}): Promise<ImportResult> {
        const startTime = Date.now();

        if (!content || !content.trim()) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
                metadata: {
                    source: 'clipboard',
                    importedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime
                },
                errors: [{ message: 'No content to import', severity: 'error' }],
                warnings: []
            };
        }

        const format = detectFormat(content);

        // Create a fake file
        const blob = new Blob([content], { type: 'text/plain' });
        const file = new File([blob], `clipboard.${format}`);

        let result: ImportResult;

        if (format === 'json') {
            result = await jsonImporter.import(file, options);
        } else {
            result = await csvImporter.import(file, {
                ...options,
                delimiter: format === 'tsv' ? '\t' : options.delimiter
            });
        }

        // Update metadata
        result.metadata.source = 'clipboard';
        result.metadata.format = format;
        result.metadata.processingTimeMs = Date.now() - startTime;

        return result;
    },

    /**
     * Import from system clipboard
     */
    async importFromClipboard(options: ImportOptions = {}): Promise<ImportResult> {
        try {
            const content = await navigator.clipboard.readText();
            return this.importFromText(content, options);
        } catch (error) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
                metadata: {
                    source: 'clipboard',
                    importedAt: new Date().toISOString(),
                    processingTimeMs: 0
                },
                errors: [{
                    message: error instanceof Error
                        ? error.message
                        : 'Failed to read clipboard. Please paste content manually.',
                    severity: 'error'
                }],
                warnings: []
            };
        }
    }
};
