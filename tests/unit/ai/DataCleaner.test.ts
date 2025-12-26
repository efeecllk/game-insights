/**
 * DataCleaner Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import { DataCleaner, CleaningPlan, CleaningAction } from '../../../src/ai/DataCleaner';
import { NormalizedData } from '../../../src/adapters/BaseAdapter';
import { ColumnMeaning } from '../../../src/ai/SchemaAnalyzer';

describe('DataCleaner', () => {
    const cleaner = new DataCleaner();

    const createTestData = (rows: Record<string, unknown>[]): NormalizedData => ({
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        rows,
        metadata: {
            source: 'test',
            rowCount: rows.length,
            fetchedAt: new Date().toISOString(),
        },
    });

    describe('analyze', () => {
        it('should detect missing values', () => {
            const data = createTestData([
                { id: '1', value: 10 },
                { id: '2', value: null },
                { id: '3', value: undefined },
                { id: '', value: 20 },
            ]);

            const result = cleaner.analyze(data, []);

            const missingIdIssue = result.issues.find(
                i => i.column === 'id' && i.issueType === 'missing_values'
            );
            const missingValueIssue = result.issues.find(
                i => i.column === 'value' && i.issueType === 'missing_values'
            );

            expect(missingIdIssue).toBeDefined();
            expect(missingIdIssue?.affectedRows).toBe(1);
            expect(missingValueIssue).toBeDefined();
            expect(missingValueIssue?.affectedRows).toBe(2);
        });

        it('should detect whitespace issues', () => {
            const data = createTestData([
                { name: '  leading' },
                { name: 'trailing  ' },
                { name: '  both  ' },
                { name: 'clean' },
            ]);

            const result = cleaner.analyze(data, []);

            const wsIssue = result.issues.find(
                i => i.column === 'name' && i.issueType === 'whitespace'
            );

            expect(wsIssue).toBeDefined();
            expect(wsIssue?.affectedRows).toBe(3);
            expect(wsIssue?.suggestedFix.action).toBe('trim_whitespace');
        });

        it('should detect duplicate rows', () => {
            const data = createTestData([
                { id: '1', value: 10 },
                { id: '2', value: 20 },
                { id: '1', value: 10 }, // duplicate
                { id: '2', value: 20 }, // duplicate
            ]);

            const result = cleaner.analyze(data, []);

            const dupIssue = result.issues.find(i => i.issueType === 'duplicate');

            expect(dupIssue).toBeDefined();
            expect(dupIssue?.affectedRows).toBe(2);
            expect(dupIssue?.column).toBe('*');
        });

        it('should detect outliers in numeric columns', () => {
            const data = createTestData([
                { value: 10 },
                { value: 11 },
                { value: 12 },
                { value: 10 },
                { value: 11 },
                { value: 12 },
                { value: 10 },
                { value: 11 },
                { value: 12 },
                { value: 10 },
                { value: 1000 }, // outlier
            ]);

            const result = cleaner.analyze(data, []);

            const outlierIssue = result.issues.find(i => i.issueType === 'outlier');

            expect(outlierIssue).toBeDefined();
            expect(outlierIssue?.suggestedFix.action).toBe('cap_outliers');
        });

        it('should detect invalid type based on semantic meaning', () => {
            const data = createTestData([
                { revenue: 100 },
                { revenue: 'invalid' }, // should be number
                { revenue: 200 },
            ]);

            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.9 },
            ];

            const result = cleaner.analyze(data, meanings);

            const typeIssue = result.issues.find(i => i.issueType === 'invalid_type');

            expect(typeIssue).toBeDefined();
            expect(typeIssue?.affectedRows).toBe(1);
        });

        it('should detect out-of-range values', () => {
            const data = createTestData([
                { revenue: 100 },
                { revenue: -50 }, // revenue should be >= 0
                { revenue: 200 },
            ]);

            const meanings: ColumnMeaning[] = [
                { column: 'revenue', detectedType: 'number', semanticType: 'revenue', confidence: 0.9 },
            ];

            const result = cleaner.analyze(data, meanings);

            const rangeIssue = result.issues.find(i => i.issueType === 'invalid_type');

            expect(rangeIssue).toBeDefined();
        });

        it('should suggest remove_rows for required fields with missing values', () => {
            const data = createTestData([
                { user_id: 'u1', value: 10 },
                { user_id: null, value: 20 },
            ]);

            const meanings: ColumnMeaning[] = [
                { column: 'user_id', detectedType: 'string', semanticType: 'user_id', confidence: 0.9 },
            ];

            const result = cleaner.analyze(data, meanings);

            const missingIssue = result.issues.find(
                i => i.column === 'user_id' && i.issueType === 'missing_values'
            );

            expect(missingIssue?.suggestedFix.action).toBe('remove_rows');
        });

        it('should handle empty data', () => {
            const data = createTestData([]);

            const result = cleaner.analyze(data, []);

            expect(result.issues).toHaveLength(0);
            expect(result.suggestedActions).toHaveLength(0);
        });

        it('should calculate estimatedCleanPercentage', () => {
            const data = createTestData([
                { value: null },
                { value: null },
                { value: 10 },
                { value: 20 },
            ]);

            const result = cleaner.analyze(data, []);

            expect(result.estimatedRowsAffected).toBeGreaterThan(0);
            expect(result.estimatedCleanPercentage).toBeGreaterThan(0);
        });

        it('should assign severity based on affected percentage', () => {
            // High severity - >20% missing
            const highData = createTestData([
                { value: null },
                { value: null },
                { value: null },
                { value: 10 },
            ]);

            const highResult = cleaner.analyze(highData, []);
            const highIssue = highResult.issues.find(i => i.issueType === 'missing_values');
            expect(highIssue?.severity).toBe('high');

            // Low severity - <5% missing
            const lowData = createTestData(
                Array.from({ length: 100 }, (_, i) => ({ value: i === 0 ? null : i }))
            );

            const lowResult = cleaner.analyze(lowData, []);
            const lowIssue = lowResult.issues.find(i => i.issueType === 'missing_values');
            expect(lowIssue?.severity).toBe('low');
        });
    });

    describe('clean', () => {
        it('should trim whitespace', () => {
            const data = createTestData([
                { name: '  Alice  ' },
                { name: 'Bob' },
            ]);

            const plan: CleaningPlan = {
                issues: [{
                    column: 'name',
                    issueType: 'whitespace',
                    severity: 'low',
                    affectedRows: 1,
                    affectedRowsPercent: 50,
                    examples: ['  Alice  '],
                    suggestedFix: { action: 'trim_whitespace', description: 'Trim whitespace' },
                }],
                suggestedActions: [],
                estimatedRowsAffected: 1,
                estimatedCleanPercentage: 50,
            };

            const result = cleaner.clean(data, plan, 'all');

            expect(result.cleanedData.rows[0].name).toBe('Alice');
            expect(result.rowsModified).toBe(1);
        });

        it('should fill missing values with mode', () => {
            const data = createTestData([
                { platform: 'ios' },
                { platform: 'ios' },
                { platform: null },
                { platform: 'android' },
            ]);

            const plan: CleaningPlan = {
                issues: [{
                    column: 'platform',
                    issueType: 'missing_values',
                    severity: 'medium',
                    affectedRows: 1,
                    affectedRowsPercent: 25,
                    examples: [null],
                    suggestedFix: { action: 'fill_mode', description: 'Fill with most common value' },
                }],
                suggestedActions: [],
                estimatedRowsAffected: 1,
                estimatedCleanPercentage: 25,
            };

            const result = cleaner.clean(data, plan, 'all');

            expect(result.cleanedData.rows[2].platform).toBe('ios');
            expect(result.rowsModified).toBe(1);
        });

        it('should remove rows with missing required values', () => {
            const data = createTestData([
                { user_id: 'u1', value: 10 },
                { user_id: null, value: 20 },
                { user_id: 'u3', value: 30 },
            ]);

            const plan: CleaningPlan = {
                issues: [{
                    column: 'user_id',
                    issueType: 'missing_values',
                    severity: 'high',
                    affectedRows: 1,
                    affectedRowsPercent: 33,
                    examples: [null],
                    suggestedFix: { action: 'remove_rows', description: 'Remove rows' },
                }],
                suggestedActions: [],
                estimatedRowsAffected: 1,
                estimatedCleanPercentage: 33,
            };

            const result = cleaner.clean(data, plan, 'all');

            expect(result.cleanedData.rows).toHaveLength(2);
            expect(result.rowsRemoved).toBe(1);
        });

        it('should remove duplicate rows', () => {
            const data = createTestData([
                { id: '1', value: 10 },
                { id: '2', value: 20 },
                { id: '1', value: 10 },
            ]);

            const plan: CleaningPlan = {
                issues: [{
                    column: '*',
                    issueType: 'duplicate',
                    severity: 'medium',
                    affectedRows: 1,
                    affectedRowsPercent: 33,
                    examples: [],
                    suggestedFix: { action: 'remove_duplicates', description: 'Remove duplicates' },
                }],
                suggestedActions: [],
                estimatedRowsAffected: 1,
                estimatedCleanPercentage: 33,
            };

            const result = cleaner.clean(data, plan, 'all');

            expect(result.cleanedData.rows).toHaveLength(2);
        });

        it('should cap outliers', () => {
            const data = createTestData([
                { value: 10 },
                { value: 1000 }, // outlier
            ]);

            // Set mean and stdDev so 1000 is outside ±3 std dev
            const mean = 10;
            const stdDev = 1;
            // Upper bound = 10 + 3*1 = 13, so 1000 is an outlier

            const plan: CleaningPlan = {
                issues: [{
                    column: 'value',
                    issueType: 'outlier',
                    severity: 'medium',
                    affectedRows: 1,
                    affectedRowsPercent: 50,
                    examples: [1000],
                    suggestedFix: {
                        action: 'cap_outliers',
                        description: 'Cap outliers',
                        params: { mean, stdDev },
                    },
                }],
                suggestedActions: [],
                estimatedRowsAffected: 1,
                estimatedCleanPercentage: 50,
            };

            const result = cleaner.clean(data, plan, 'all');

            expect(result.rowsModified).toBeGreaterThan(0);
            expect(result.cleanedData.rows[1].value).toBe(13); // capped at upper bound
        });

        it('should only apply approved actions', () => {
            const data = createTestData([
                { name: '  Alice  ', platform: null },
            ]);

            const plan: CleaningPlan = {
                issues: [
                    {
                        column: 'name',
                        issueType: 'whitespace',
                        severity: 'low',
                        affectedRows: 1,
                        affectedRowsPercent: 100,
                        examples: ['  Alice  '],
                        suggestedFix: { action: 'trim_whitespace', description: 'Trim' },
                    },
                    {
                        column: 'platform',
                        issueType: 'missing_values',
                        severity: 'low',
                        affectedRows: 1,
                        affectedRowsPercent: 100,
                        examples: [null],
                        suggestedFix: { action: 'fill_mode', description: 'Fill' },
                    },
                ],
                suggestedActions: [],
                estimatedRowsAffected: 2,
                estimatedCleanPercentage: 100,
            };

            // Only approve trim_whitespace
            const approved: CleaningAction[] = ['trim_whitespace'];
            const result = cleaner.clean(data, plan, approved);

            expect(result.cleanedData.rows[0].name).toBe('Alice');
            expect(result.cleanedData.rows[0].platform).toBeNull();
        });

        it('should calculate quality score improvement', () => {
            const data = createTestData([
                { name: '  test  ', value: null },
            ]);

            const plan: CleaningPlan = {
                issues: [{
                    column: 'name',
                    issueType: 'whitespace',
                    severity: 'low',
                    affectedRows: 1,
                    affectedRowsPercent: 50,
                    examples: ['  test  '],
                    suggestedFix: { action: 'trim_whitespace', description: 'Trim' },
                }],
                suggestedActions: [],
                estimatedRowsAffected: 1,
                estimatedCleanPercentage: 50,
            };

            const result = cleaner.clean(data, plan, 'all');

            expect(result.qualityScoreAfter).toBeGreaterThanOrEqual(result.qualityScoreBefore);
        });
    });

    describe('calculateQualityScore', () => {
        it('should return 100 for perfectly clean data', () => {
            const rows = [
                { id: '1', value: 10 },
                { id: '2', value: 20 },
            ];

            const score = cleaner.calculateQualityScore(rows);

            expect(score).toBe(100);
        });

        it('should return 0 for empty data', () => {
            const score = cleaner.calculateQualityScore([]);

            expect(score).toBe(0);
        });

        it('should reduce score for null values', () => {
            const cleanRows = [{ value: 10 }];
            const dirtyRows = [{ value: null }];

            const cleanScore = cleaner.calculateQualityScore(cleanRows);
            const dirtyScore = cleaner.calculateQualityScore(dirtyRows);

            expect(dirtyScore).toBeLessThan(cleanScore);
        });

        it('should give partial credit for strings with whitespace', () => {
            const cleanRows = [{ name: 'Alice' }];
            const wsRows = [{ name: '  Alice  ' }];

            const cleanScore = cleaner.calculateQualityScore(cleanRows);
            const wsScore = cleaner.calculateQualityScore(wsRows);

            expect(wsScore).toBeGreaterThan(0);
            expect(wsScore).toBeLessThan(cleanScore);
        });
    });
});
