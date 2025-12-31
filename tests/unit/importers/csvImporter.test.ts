/**
 * CSV Importer Unit Tests
 * Tests for CSV file import with delimiter detection, header detection, and type parsing
 */

import { describe, it, expect } from 'vitest';
import { csvImporter } from '@/lib/importers/csvImporter';

// Helper to create a mock File
function createMockFile(content: string, name = 'test.csv'): File {
    const blob = new Blob([content], { type: 'text/csv' });
    return new File([blob], name, { type: 'text/csv' });
}

describe('csvImporter', () => {
    // =========================================================================
    // Basic Import Tests
    // =========================================================================

    describe('basic import', () => {
        it('should import a simple CSV file', async () => {
            const content = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
            expect(result.columns).toEqual(['name', 'age', 'city']);
            expect(result.data[0]).toEqual({ name: 'John', age: 30, city: 'NYC' });
            expect(result.data[1]).toEqual({ name: 'Jane', age: 25, city: 'LA' });
        });

        it('should return metadata with correct format', async () => {
            const content = 'id,value\n1,100';
            const file = createMockFile(content, 'data.csv');

            const result = await csvImporter.import(file);

            expect(result.metadata.source).toBe('file');
            expect(result.metadata.fileName).toBe('data.csv');
            expect(result.metadata.format).toBe('csv');
            expect(result.metadata.delimiter).toBe(',');
            expect(result.metadata.importedAt).toBeDefined();
            expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
        });

        it('should handle empty file', async () => {
            const file = createMockFile('');

            const result = await csvImporter.import(file);

            expect(result.success).toBe(false);
            expect(result.rowCount).toBe(0);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].message).toBe('Empty file');
        });
    });

    // =========================================================================
    // Delimiter Detection Tests
    // =========================================================================

    describe('delimiter detection', () => {
        it('should auto-detect comma delimiter', async () => {
            const content = 'a,b,c\n1,2,3\n4,5,6';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.metadata.delimiter).toBe(',');
            expect(result.columns).toEqual(['a', 'b', 'c']);
        });

        it('should auto-detect tab delimiter (TSV)', async () => {
            const content = 'a\tb\tc\n1\t2\t3\n4\t5\t6';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.metadata.delimiter).toBe('\t');
            expect(result.columns).toEqual(['a', 'b', 'c']);
        });

        it('should auto-detect semicolon delimiter', async () => {
            const content = 'a;b;c\n1;2;3\n4;5;6';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.metadata.delimiter).toBe(';');
            expect(result.columns).toEqual(['a', 'b', 'c']);
        });

        it('should auto-detect pipe delimiter', async () => {
            const content = 'a|b|c\n1|2|3\n4|5|6';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.metadata.delimiter).toBe('|');
            expect(result.columns).toEqual(['a', 'b', 'c']);
        });

        it('should use specified delimiter over auto-detection', async () => {
            const content = 'a;b;c\n1;2;3';
            const file = createMockFile(content);

            const result = await csvImporter.import(file, { delimiter: ';' });

            expect(result.metadata.delimiter).toBe(';');
            expect(result.columns).toEqual(['a', 'b', 'c']);
        });
    });

    // =========================================================================
    // Header Detection Tests
    // =========================================================================

    describe('header detection', () => {
        it('should auto-detect header row when first row is text', async () => {
            const content = 'name,score,level\nAlice,1000,5\nBob,2000,10';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.columns).toEqual(['name', 'score', 'level']);
            expect(result.rowCount).toBe(2);
        });

        it('should generate column names when no header', async () => {
            const content = '1,100,A\n2,200,B\n3,300,C';
            const file = createMockFile(content);

            const result = await csvImporter.import(file, { hasHeader: false });

            expect(result.columns).toEqual(['column_1', 'column_2', 'column_3']);
            expect(result.rowCount).toBe(3);
        });

        it('should respect hasHeader option when explicitly set to true', async () => {
            const content = 'id,value\n1,100\n2,200';
            const file = createMockFile(content);

            const result = await csvImporter.import(file, { hasHeader: true });

            expect(result.columns).toEqual(['id', 'value']);
            expect(result.rowCount).toBe(2);
        });
    });

    // =========================================================================
    // Type Parsing Tests
    // =========================================================================

    describe('type parsing', () => {
        it('should parse numbers correctly', async () => {
            const content = 'int,float,negative\n42,3.14,-100';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.data[0].int).toBe(42);
            expect(result.data[0].float).toBe(3.14);
            expect(result.data[0].negative).toBe(-100);
        });

        it('should parse booleans correctly', async () => {
            const content = 'active,verified\ntrue,false\nTRUE,FALSE';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.data[0].active).toBe(true);
            expect(result.data[0].verified).toBe(false);
            expect(result.data[1].active).toBe(true);
            expect(result.data[1].verified).toBe(false);
        });

        it('should parse ISO dates correctly', async () => {
            const content = 'date,datetime\n2024-01-15,2024-01-15T10:30:00Z';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.data[0].date).toContain('2024-01-15');
            expect(result.data[0].datetime).toContain('2024-01-15');
        });

        it('should handle null/empty values', async () => {
            const content = 'a,b,c\n1,,3\n,,';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.data[0].a).toBe(1);
            expect(result.data[0].b).toBe(null);
            expect(result.data[0].c).toBe(3);
            expect(result.data[1].a).toBe(null);
        });

        it('should keep strings as strings', async () => {
            const content = 'text\nhello world\n"quoted text"';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.data[0].text).toBe('hello world');
            expect(result.data[1].text).toBe('quoted text');
        });
    });

    // =========================================================================
    // Quote Handling Tests
    // =========================================================================

    describe('quote handling', () => {
        it('should handle quoted fields with commas', async () => {
            const content = 'name,address\n"Smith, John","123 Main St, Apt 4"';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.data[0].name).toBe('Smith, John');
            expect(result.data[0].address).toBe('123 Main St, Apt 4');
        });

        it('should handle quoted fields with newlines', async () => {
            const content = 'name,description\nProduct,"Line 1\nLine 2"';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.data[0].description).toContain('Line 1');
        });

        it('should handle escaped quotes', async () => {
            const content = 'quote\n"He said ""Hello"""';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.data[0].quote).toBe('He said "Hello"');
        });
    });

    // =========================================================================
    // Options Tests
    // =========================================================================

    describe('options', () => {
        it('should skip specified number of rows', async () => {
            // skipRows skips data rows AFTER the header, not the header itself
            const content = 'name,value\nskip1,100\nA,1\nB,2';
            const file = createMockFile(content);

            const result = await csvImporter.import(file, { skipRows: 1 });

            expect(result.columns).toEqual(['name', 'value']);
            expect(result.rowCount).toBe(2);
            expect(result.data[0].name).toBe('A');
        });

        it('should limit number of rows', async () => {
            const content = 'id\n1\n2\n3\n4\n5';
            const file = createMockFile(content);

            const result = await csvImporter.import(file, { maxRows: 3 });

            expect(result.rowCount).toBe(3);
            expect(result.data.map(r => r.id)).toEqual([1, 2, 3]);
        });

        it('should support custom quote character', async () => {
            const content = "name,value\n'quoted',100";
            const file = createMockFile(content);

            const result = await csvImporter.import(file, { quoteChar: "'" });

            expect(result.data[0].name).toBe('quoted');
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle single column', async () => {
            const content = 'values\n1\n2\n3';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.columns).toEqual(['values']);
            expect(result.rowCount).toBe(3);
        });

        it('should handle single row', async () => {
            const content = 'a,b,c\n1,2,3';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.rowCount).toBe(1);
        });

        it('should handle inconsistent column counts', async () => {
            const content = 'a,b,c\n1,2\n1,2,3,4';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            // Should still parse, possibly with warnings
            expect(result.success).toBe(true);
        });

        it('should trim whitespace from headers', async () => {
            const content = ' name , age , city \n1,2,3';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.columns).toEqual(['name', 'age', 'city']);
        });

        it('should handle BOM character', async () => {
            const content = '\uFEFFname,value\ntest,100';
            const file = createMockFile(content);

            const result = await csvImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(1);
        });
    });
});
