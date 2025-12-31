/**
 * JSON/NDJSON Importer Unit Tests
 * Tests for JSON file import with array detection, nested flattening, and NDJSON support
 */

import { describe, it, expect } from 'vitest';
import { jsonImporter } from '@/lib/importers/jsonImporter';

// Helper to create a mock File
function createMockFile(content: string, name = 'test.json'): File {
    const blob = new Blob([content], { type: 'application/json' });
    return new File([blob], name, { type: 'application/json' });
}

describe('jsonImporter', () => {
    // =========================================================================
    // Basic Import Tests
    // =========================================================================

    describe('basic import', () => {
        it('should import a JSON array', async () => {
            const content = JSON.stringify([
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
            expect(result.columns).toContain('name');
            expect(result.columns).toContain('age');
            expect(result.data[0].name).toBe('John');
            expect(result.data[1].age).toBe(25);
        });

        it('should return metadata with correct format', async () => {
            const content = JSON.stringify([{ id: 1 }]);
            const file = createMockFile(content, 'data.json');

            const result = await jsonImporter.import(file);

            expect(result.metadata.source).toBe('file');
            expect(result.metadata.fileName).toBe('data.json');
            expect(result.metadata.format).toBe('json');
            expect(result.metadata.importedAt).toBeDefined();
            expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
        });

        it('should handle empty array', async () => {
            const content = JSON.stringify([]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(0);
            expect(result.data).toEqual([]);
        });
    });

    // =========================================================================
    // Data Array Detection Tests
    // =========================================================================

    describe('data array detection', () => {
        it('should auto-detect "data" property', async () => {
            const content = JSON.stringify({
                status: 'ok',
                data: [
                    { id: 1, value: 'A' },
                    { id: 2, value: 'B' }
                ]
            });
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
            expect(result.data[0].id).toBe(1);
        });

        it('should auto-detect "results" property', async () => {
            const content = JSON.stringify({
                results: [
                    { name: 'Alice' },
                    { name: 'Bob' }
                ]
            });
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
        });

        it('should auto-detect "items" property', async () => {
            const content = JSON.stringify({
                items: [{ sku: 'ABC' }]
            });
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.data[0].sku).toBe('ABC');
        });

        it('should auto-detect any array property', async () => {
            const content = JSON.stringify({
                metadata: { version: 1 },
                players: [
                    { id: 1, name: 'Player1' },
                    { id: 2, name: 'Player2' }
                ]
            });
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
            expect(result.warnings.some(w => w.includes('players'))).toBe(true);
        });

        it('should use specified dataPath', async () => {
            const content = JSON.stringify({
                response: {
                    users: [
                        { id: 1 },
                        { id: 2 }
                    ]
                }
            });
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { dataPath: 'response.users' });

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
        });

        it('should error when dataPath is not an array', async () => {
            const content = JSON.stringify({
                config: { setting: 'value' }
            });
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { dataPath: 'config' });

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('not an array');
        });

        it('should treat single object as single row when no array found', async () => {
            const content = JSON.stringify({
                id: 1,
                name: 'Single Item',
                value: 100
            });
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(1);
            expect(result.data[0].name).toBe('Single Item');
        });
    });

    // =========================================================================
    // Nested Object Flattening Tests
    // =========================================================================

    describe('nested object flattening', () => {
        it('should flatten nested objects with dot notation', async () => {
            const content = JSON.stringify([
                {
                    id: 1,
                    user: {
                        name: 'John',
                        email: 'john@example.com'
                    }
                }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.data[0]['user.name']).toBe('John');
            expect(result.data[0]['user.email']).toBe('john@example.com');
        });

        it('should flatten deeply nested objects up to max depth', async () => {
            const content = JSON.stringify([
                {
                    level1: {
                        level2: {
                            level3: {
                                value: 'deep'
                            }
                        }
                    }
                }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            // Should flatten up to 3 levels by default
            expect(result.data[0]['level1.level2.level3.value']).toBe('deep');
        });

        it('should convert arrays to JSON strings', async () => {
            const content = JSON.stringify([
                {
                    id: 1,
                    tags: ['a', 'b', 'c']
                }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.data[0].tags).toBe('["a","b","c"]');
        });

        it('should not flatten when flattenNested is false', async () => {
            const content = JSON.stringify([
                {
                    id: 1,
                    nested: { a: 1, b: 2 }
                }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { flattenNested: false });

            expect(result.data[0].nested).toEqual({ a: 1, b: 2 });
        });
    });

    // =========================================================================
    // NDJSON Tests
    // =========================================================================

    describe('NDJSON support', () => {
        it('should import NDJSON format when using isNDJSON option', async () => {
            const content = '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}\n{"id":3,"name":"Charlie"}';
            const file = createMockFile(content, 'data.ndjson');

            // Explicitly use isNDJSON since auto-detection may treat valid multi-line JSON objects differently
            const result = await jsonImporter.import(file, { isNDJSON: true });

            expect(result.success).toBe(true);
            expect(result.metadata.format).toBe('ndjson');
            expect(result.rowCount).toBe(3);
            expect(result.data[0].name).toBe('Alice');
            expect(result.data[2].name).toBe('Charlie');
        });

        it('should handle NDJSON with blank lines', async () => {
            const content = '{"id":1}\n\n{"id":2}\n';
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { isNDJSON: true });

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
        });

        it('should report errors for invalid lines in NDJSON', async () => {
            const content = '{"id":1}\ninvalid json\n{"id":2}';
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { isNDJSON: true });

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
            expect(result.warnings.some(w => w.includes('Invalid JSON'))).toBe(true);
        });

        it('should use isNDJSON option', async () => {
            const content = '{"id":1}\n{"id":2}';
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { isNDJSON: true });

            expect(result.metadata.format).toBe('ndjson');
            expect(result.rowCount).toBe(2);
        });
    });

    // =========================================================================
    // Options Tests
    // =========================================================================

    describe('options', () => {
        it('should skip specified number of rows', async () => {
            const content = JSON.stringify([
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { skipRows: 1 });

            expect(result.rowCount).toBe(2);
            expect(result.data[0].id).toBe(2);
        });

        it('should limit number of rows', async () => {
            const content = JSON.stringify([
                { id: 1 },
                { id: 2 },
                { id: 3 },
                { id: 4 },
                { id: 5 }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { maxRows: 3 });

            expect(result.rowCount).toBe(3);
        });

        it('should combine skip and limit', async () => {
            const content = JSON.stringify([
                { id: 1 },
                { id: 2 },
                { id: 3 },
                { id: 4 },
                { id: 5 }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { skipRows: 1, maxRows: 2 });

            expect(result.rowCount).toBe(2);
            expect(result.data[0].id).toBe(2);
            expect(result.data[1].id).toBe(3);
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    describe('error handling', () => {
        it('should handle invalid JSON', async () => {
            const content = '{ invalid json }';
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('Invalid JSON');
        });

        it('should reject primitive values', async () => {
            const content = '"just a string"';
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('array or object');
        });

        it('should filter out non-object items from array', async () => {
            const content = JSON.stringify([
                { id: 1 },
                'string',
                null,
                { id: 2 },
                42
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
        });
    });

    // =========================================================================
    // Column Normalization Tests
    // =========================================================================

    describe('column normalization', () => {
        it('should collect all unique columns from all rows', async () => {
            const content = JSON.stringify([
                { a: 1, b: 2 },
                { b: 3, c: 4 },
                { a: 5, c: 6 }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.columns).toContain('a');
            expect(result.columns).toContain('b');
            expect(result.columns).toContain('c');
        });

        it('should fill missing columns with null', async () => {
            const content = JSON.stringify([
                { a: 1 },
                { b: 2 }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.data[0].b).toBe(null);
            expect(result.data[1].a).toBe(null);
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    describe('edge cases', () => {
        it('should handle very deeply nested data path', async () => {
            const content = JSON.stringify({
                level1: {
                    level2: {
                        level3: {
                            items: [{ id: 1 }]
                        }
                    }
                }
            });
            const file = createMockFile(content);

            const result = await jsonImporter.import(file, { dataPath: 'level1.level2.level3.items' });

            expect(result.success).toBe(true);
            expect(result.data[0].id).toBe(1);
        });

        it('should handle null values in objects', async () => {
            const content = JSON.stringify([
                { id: 1, value: null },
                { id: 2, value: 'test' }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.data[0].value).toBe(null);
            expect(result.data[1].value).toBe('test');
        });

        it('should handle empty objects', async () => {
            const content = JSON.stringify([{}, { id: 1 }]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.success).toBe(true);
            expect(result.rowCount).toBe(2);
        });

        it('should handle unicode content', async () => {
            const content = JSON.stringify([
                { name: '日本語', emoji: '🎮' }
            ]);
            const file = createMockFile(content);

            const result = await jsonImporter.import(file);

            expect(result.data[0].name).toBe('日本語');
            expect(result.data[0].emoji).toBe('🎮');
        });
    });
});
