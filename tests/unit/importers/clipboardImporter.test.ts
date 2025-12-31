/**
 * Clipboard Importer Unit Tests
 * Tests for clipboard paste import with format detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clipboardImporter } from '@/lib/importers/clipboardImporter';

describe('clipboardImporter', () => {
    // =========================================================================
    // importFromText Tests
    // =========================================================================

    describe('importFromText', () => {
        it('should import CSV content', async () => {
            const content = 'name,age\nJohn,30\nJane,25';

            const result = await clipboardImporter.importFromText(content);

            expect(result.success).toBe(true);
            expect(result.metadata.source).toBe('clipboard');
            expect(result.metadata.format).toBe('csv');
            expect(result.rowCount).toBe(2);
        });

        it('should import TSV content (spreadsheet paste)', async () => {
            const content = 'name\tage\tactive\nJohn\t30\ttrue\nJane\t25\tfalse';

            const result = await clipboardImporter.importFromText(content);

            expect(result.success).toBe(true);
            expect(result.metadata.format).toBe('tsv');
            expect(result.columns).toEqual(['name', 'age', 'active']);
        });

        it('should import JSON array content', async () => {
            const content = JSON.stringify([
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' }
            ]);

            const result = await clipboardImporter.importFromText(content);

            expect(result.success).toBe(true);
            expect(result.metadata.format).toBe('json');
            expect(result.rowCount).toBe(2);
        });

        it('should import JSON object with data array', async () => {
            const content = JSON.stringify({
                data: [{ value: 1 }, { value: 2 }]
            });

            const result = await clipboardImporter.importFromText(content);

            expect(result.success).toBe(true);
            expect(result.metadata.format).toBe('json');
            expect(result.rowCount).toBe(2);
        });

        it('should handle empty content', async () => {
            const result = await clipboardImporter.importFromText('');

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toBe('No content to import');
        });

        it('should handle whitespace-only content', async () => {
            const result = await clipboardImporter.importFromText('   \n\t  ');

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toBe('No content to import');
        });

        it('should pass options through to importers', async () => {
            const content = 'skip this\na,b\n1,2\n3,4';

            const result = await clipboardImporter.importFromText(content, { skipRows: 1 });

            expect(result.success).toBe(true);
        });
    });

    // =========================================================================
    // Format Detection Tests
    // =========================================================================

    describe('format detection', () => {
        it('should detect JSON array by [ prefix', async () => {
            const content = '[{"a":1}]';

            const result = await clipboardImporter.importFromText(content);

            expect(result.metadata.format).toBe('json');
        });

        it('should detect JSON object by { prefix', async () => {
            const content = '{"data":[{"a":1}]}';

            const result = await clipboardImporter.importFromText(content);

            expect(result.metadata.format).toBe('json');
        });

        it('should fallback to CSV for invalid JSON starting with {', async () => {
            const content = '{not valid json\na,b\n1,2';

            const result = await clipboardImporter.importFromText(content);

            expect(result.metadata.format).toBe('csv');
        });

        it('should prefer TSV when tabs are consistent', async () => {
            const content = 'a\tb\tc\n1\t2\t3\n4\t5\t6';

            const result = await clipboardImporter.importFromText(content);

            expect(result.metadata.format).toBe('tsv');
        });

        it('should prefer CSV when commas are more consistent than tabs', async () => {
            const content = 'a,b,c\n1,2,3\n4,5,6';

            const result = await clipboardImporter.importFromText(content);

            expect(result.metadata.format).toBe('csv');
        });
    });

    // =========================================================================
    // importFromClipboard Tests
    // =========================================================================

    describe('importFromClipboard', () => {
        const originalNavigator = global.navigator;

        beforeEach(() => {
            // Mock navigator.clipboard
            Object.defineProperty(global, 'navigator', {
                value: {
                    clipboard: {
                        readText: vi.fn()
                    }
                },
                writable: true,
                configurable: true
            });
        });

        afterEach(() => {
            Object.defineProperty(global, 'navigator', {
                value: originalNavigator,
                writable: true,
                configurable: true
            });
            vi.restoreAllMocks();
        });

        it('should read from system clipboard', async () => {
            const clipboardContent = 'name,value\ntest,100';
            vi.mocked(navigator.clipboard.readText).mockResolvedValue(clipboardContent);

            const result = await clipboardImporter.importFromClipboard();

            expect(navigator.clipboard.readText).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.data[0].name).toBe('test');
        });

        it('should handle clipboard read error', async () => {
            vi.mocked(navigator.clipboard.readText).mockRejectedValue(
                new Error('Clipboard access denied')
            );

            const result = await clipboardImporter.importFromClipboard();

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('Clipboard access denied');
        });

        it('should handle generic clipboard error', async () => {
            vi.mocked(navigator.clipboard.readText).mockRejectedValue('Unknown error');

            const result = await clipboardImporter.importFromClipboard();

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('Failed to read clipboard');
        });

        it('should pass options to text import', async () => {
            const clipboardContent = 'a,b\n1,2\n3,4\n5,6';
            vi.mocked(navigator.clipboard.readText).mockResolvedValue(clipboardContent);

            const result = await clipboardImporter.importFromClipboard({ maxRows: 2 });

            expect(result.rowCount).toBe(2);
        });
    });

    // =========================================================================
    // Integration Tests
    // =========================================================================

    describe('integration', () => {
        it('should handle Excel-style paste with mixed data types', async () => {
            const content = 'Product\tPrice\tQuantity\tIn Stock\niPhone\t999.99\t50\tTRUE\nAndroid\t499.50\t100\tFALSE';

            const result = await clipboardImporter.importFromText(content);

            expect(result.success).toBe(true);
            expect(result.data[0].Price).toBe(999.99);
            expect(result.data[0]['In Stock']).toBe(true);
            expect(result.data[1].Quantity).toBe(100);
        });

        it('should handle Google Sheets paste', async () => {
            // Google Sheets typically uses tabs
            const content = 'Date\tRevenue\tUsers\n2024-01-01\t1000\t500\n2024-01-02\t1500\t750';

            const result = await clipboardImporter.importFromText(content);

            expect(result.success).toBe(true);
            expect(result.metadata.format).toBe('tsv');
            expect(result.rowCount).toBe(2);
        });

        it('should handle API response paste', async () => {
            // The auto-detect looks for common paths: data, results, items, rows, records, events, entries
            // Then looks for any array property with objects
            const content = JSON.stringify({
                status: 200,
                message: 'Success',
                data: [
                    { id: 1, email: 'user1@test.com' },
                    { id: 2, email: 'user2@test.com' }
                ]
            });

            const result = await clipboardImporter.importFromText(content);

            expect(result.success).toBe(true);
            // Should auto-detect the data array
            expect(result.rowCount).toBe(2);
        });

        it('should preserve metadata through import', async () => {
            const content = 'a,b\n1,2';

            const result = await clipboardImporter.importFromText(content);

            expect(result.metadata.source).toBe('clipboard');
            expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
        });
    });
});
