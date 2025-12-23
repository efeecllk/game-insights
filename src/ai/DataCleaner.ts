/**
 * Data Cleaner
 * AI-driven data cleaning with issue detection and automatic fixes
 */

import { NormalizedData } from '../adapters/BaseAdapter';
import { ColumnMeaning, SemanticType } from './SchemaAnalyzer';

// Types of data issues
export type DataIssue =
    | 'missing_values'      // Null, undefined, empty
    | 'invalid_type'        // Wrong data type
    | 'outlier'             // Statistical outlier
    | 'duplicate'           // Duplicate rows
    | 'inconsistent_format' // Date formats, casing
    | 'invalid_range'       // Out of expected range
    | 'encoding_error'      // Character encoding issues
    | 'whitespace'          // Leading/trailing spaces
    | 'special_chars';      // Unexpected characters

export interface DataQualityIssue {
    column: string;
    issueType: DataIssue;
    severity: 'low' | 'medium' | 'high';
    affectedRows: number;
    affectedRowsPercent: number;
    examples: unknown[];
    suggestedFix: CleaningStrategy;
}

export interface CleaningStrategy {
    action: CleaningAction;
    description: string;
    params?: Record<string, unknown>;
}

export type CleaningAction =
    | 'remove_rows'         // Delete affected rows
    | 'fill_null'           // Fill with default value
    | 'fill_mean'           // Fill with column mean
    | 'fill_median'         // Fill with column median
    | 'fill_mode'           // Fill with most common value
    | 'forward_fill'        // Fill with previous value
    | 'trim_whitespace'     // Remove leading/trailing spaces
    | 'lowercase'           // Convert to lowercase
    | 'uppercase'           // Convert to uppercase
    | 'titlecase'           // Convert to title case
    | 'parse_date'          // Parse to consistent date format
    | 'parse_number'        // Parse string to number
    | 'cap_outliers'        // Cap at percentile boundaries
    | 'remove_duplicates'   // Remove duplicate rows
    | 'regex_replace'       // Replace with regex
    | 'no_action';          // Skip cleaning

export interface CleaningPlan {
    issues: DataQualityIssue[];
    suggestedActions: {
        column: string;
        action: CleaningAction;
        reason: string;
    }[];
    estimatedRowsAffected: number;
    estimatedCleanPercentage: number;
}

export interface CleaningResult {
    cleanedData: NormalizedData;
    appliedActions: {
        column: string;
        action: CleaningAction;
        rowsAffected: number;
    }[];
    rowsRemoved: number;
    rowsModified: number;
    qualityScoreBefore: number;
    qualityScoreAfter: number;
}

// Validation rules per semantic type
const SEMANTIC_TYPE_RULES: Partial<Record<SemanticType, {
    expectedType: 'string' | 'number' | 'date';
    allowNull: boolean;
    range?: { min?: number; max?: number };
    pattern?: RegExp;
}>> = {
    user_id: { expectedType: 'string', allowNull: false },
    timestamp: { expectedType: 'date', allowNull: false },
    revenue: { expectedType: 'number', allowNull: true, range: { min: 0 } },
    price: { expectedType: 'number', allowNull: true, range: { min: 0 } },
    level: { expectedType: 'number', allowNull: true, range: { min: 1 } },
    score: { expectedType: 'number', allowNull: true, range: { min: 0 } },
    retention_day: { expectedType: 'number', allowNull: true, range: { min: 0, max: 1 } },
    country: { expectedType: 'string', allowNull: true, pattern: /^[A-Z]{2}$/ },
    platform: { expectedType: 'string', allowNull: true },
};

export class DataCleaner {
    /**
     * Analyze data quality and generate cleaning plan
     */
    analyze(data: NormalizedData, columnMeanings: ColumnMeaning[]): CleaningPlan {
        const issues: DataQualityIssue[] = [];
        const meaningMap = new Map(columnMeanings.map(m => [m.column, m]));

        for (const column of data.columns) {
            const meaning = meaningMap.get(column);
            const values = data.rows.map(r => r[column]);

            // Check for missing values
            const missingIssue = this.checkMissingValues(column, values, meaning);
            if (missingIssue) issues.push(missingIssue);

            // Check for type issues
            const typeIssue = this.checkTypeIssues(column, values, meaning);
            if (typeIssue) issues.push(typeIssue);

            // Check for whitespace
            const wsIssue = this.checkWhitespace(column, values);
            if (wsIssue) issues.push(wsIssue);

            // Check for outliers (numeric columns)
            const outlierIssue = this.checkOutliers(column, values);
            if (outlierIssue) issues.push(outlierIssue);
        }

        // Check for duplicates
        const dupIssue = this.checkDuplicates(data);
        if (dupIssue) issues.push(dupIssue);

        // Generate suggested actions
        const suggestedActions = issues.map(issue => ({
            column: issue.column,
            action: issue.suggestedFix.action,
            reason: issue.suggestedFix.description,
        }));

        const estimatedRowsAffected = issues.reduce((sum, i) => sum + i.affectedRows, 0);

        return {
            issues,
            suggestedActions,
            estimatedRowsAffected,
            estimatedCleanPercentage: Math.min(100, (estimatedRowsAffected / data.rows.length) * 100),
        };
    }

    /**
     * Apply cleaning actions to data
     */
    clean(data: NormalizedData, plan: CleaningPlan, approve: CleaningAction[] | 'all'): CleaningResult {
        let cleanedRows = [...data.rows.map(r => ({ ...r }))];
        const appliedActions: CleaningResult['appliedActions'] = [];
        let rowsRemoved = 0;
        let rowsModified = 0;

        const qualityScoreBefore = this.calculateQualityScore(data.rows);

        for (const issue of plan.issues) {
            const action = issue.suggestedFix.action;
            if (approve !== 'all' && !approve.includes(action)) continue;

            const before = cleanedRows.length;
            const result = this.applyAction(cleanedRows, issue.column, action, issue.suggestedFix.params);
            cleanedRows = result.rows;

            appliedActions.push({
                column: issue.column,
                action,
                rowsAffected: result.affected,
            });

            rowsModified += result.modified;
            rowsRemoved += before - cleanedRows.length;
        }

        const qualityScoreAfter = this.calculateQualityScore(cleanedRows);

        return {
            cleanedData: {
                columns: data.columns,
                rows: cleanedRows,
                metadata: {
                    ...data.metadata,
                    source: `${data.metadata.source} (cleaned)`,
                    rowCount: cleanedRows.length,
                }
            },
            appliedActions,
            rowsRemoved,
            rowsModified,
            qualityScoreBefore,
            qualityScoreAfter,
        };
    }

    /**
     * Calculate data quality score (0-100)
     */
    calculateQualityScore(rows: Record<string, unknown>[]): number {
        if (rows.length === 0) return 0;

        let totalCells = 0;
        let cleanCells = 0;

        for (const row of rows) {
            for (const value of Object.values(row)) {
                totalCells++;
                if (value !== null && value !== undefined && value !== '') {
                    // Check if string with whitespace issues
                    if (typeof value === 'string' && value.trim() !== value) {
                        cleanCells += 0.8; // Partial credit
                    } else {
                        cleanCells++;
                    }
                }
            }
        }

        return Math.round((cleanCells / totalCells) * 100);
    }

    // Private methods

    private checkMissingValues(column: string, values: unknown[], meaning?: ColumnMeaning): DataQualityIssue | null {
        const missing = values.filter(v => v === null || v === undefined || v === '');
        if (missing.length === 0) return null;

        const percent = (missing.length / values.length) * 100;
        const rule = meaning ? SEMANTIC_TYPE_RULES[meaning.semanticType] : undefined;

        return {
            column,
            issueType: 'missing_values',
            severity: percent > 20 ? 'high' : percent > 5 ? 'medium' : 'low',
            affectedRows: missing.length,
            affectedRowsPercent: percent,
            examples: missing.slice(0, 3),
            suggestedFix: {
                action: rule?.allowNull === false ? 'remove_rows' : 'fill_mode',
                description: rule?.allowNull === false
                    ? `Required field ${column} has missing values - remove rows`
                    : `Fill missing ${column} with most common value`,
            }
        };
    }

    private checkTypeIssues(column: string, values: unknown[], meaning?: ColumnMeaning): DataQualityIssue | null {
        if (!meaning) return null;

        const rule = SEMANTIC_TYPE_RULES[meaning.semanticType];
        if (!rule) return null;

        const invalid = values.filter(v => {
            if (v === null || v === undefined) return false;
            if (rule.expectedType === 'number' && typeof v !== 'number') return true;
            if (rule.expectedType === 'string' && typeof v !== 'string') return true;
            if (rule.range) {
                const num = Number(v);
                if (rule.range.min !== undefined && num < rule.range.min) return true;
                if (rule.range.max !== undefined && num > rule.range.max) return true;
            }
            return false;
        });

        if (invalid.length === 0) return null;

        const percent = (invalid.length / values.length) * 100;

        return {
            column,
            issueType: 'invalid_type',
            severity: percent > 10 ? 'high' : 'medium',
            affectedRows: invalid.length,
            affectedRowsPercent: percent,
            examples: invalid.slice(0, 3),
            suggestedFix: {
                action: rule.expectedType === 'number' ? 'parse_number' : 'no_action',
                description: `Convert ${column} to ${rule.expectedType}`,
            }
        };
    }

    private checkWhitespace(column: string, values: unknown[]): DataQualityIssue | null {
        const withWs = values.filter(v =>
            typeof v === 'string' && v !== v.trim()
        );

        if (withWs.length === 0) return null;

        return {
            column,
            issueType: 'whitespace',
            severity: 'low',
            affectedRows: withWs.length,
            affectedRowsPercent: (withWs.length / values.length) * 100,
            examples: withWs.slice(0, 3),
            suggestedFix: {
                action: 'trim_whitespace',
                description: `Trim whitespace from ${column}`,
            }
        };
    }

    private checkOutliers(column: string, values: unknown[]): DataQualityIssue | null {
        const numbers = values.filter(v => typeof v === 'number') as number[];
        if (numbers.length < 10) return null;

        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const stdDev = Math.sqrt(
            numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length
        );

        const outliers = numbers.filter(n => Math.abs(n - mean) > 3 * stdDev);
        if (outliers.length === 0) return null;

        return {
            column,
            issueType: 'outlier',
            severity: 'medium',
            affectedRows: outliers.length,
            affectedRowsPercent: (outliers.length / values.length) * 100,
            examples: outliers.slice(0, 3),
            suggestedFix: {
                action: 'cap_outliers',
                description: `Cap outliers in ${column} at ±3 std dev`,
                params: { mean, stdDev },
            }
        };
    }

    private checkDuplicates(data: NormalizedData): DataQualityIssue | null {
        const seen = new Set<string>();
        let dupCount = 0;

        for (const row of data.rows) {
            const key = JSON.stringify(row);
            if (seen.has(key)) dupCount++;
            else seen.add(key);
        }

        if (dupCount === 0) return null;

        return {
            column: '*',
            issueType: 'duplicate',
            severity: 'medium',
            affectedRows: dupCount,
            affectedRowsPercent: (dupCount / data.rows.length) * 100,
            examples: [],
            suggestedFix: {
                action: 'remove_duplicates',
                description: 'Remove duplicate rows',
            }
        };
    }

    private applyAction(
        rows: Record<string, unknown>[],
        column: string,
        action: CleaningAction,
        params?: Record<string, unknown>
    ): { rows: Record<string, unknown>[]; affected: number; modified: number } {
        let affected = 0;
        let modified = 0;

        switch (action) {
            case 'trim_whitespace':
                for (const row of rows) {
                    if (typeof row[column] === 'string') {
                        const trimmed = (row[column] as string).trim();
                        if (trimmed !== row[column]) {
                            row[column] = trimmed;
                            modified++;
                        }
                    }
                }
                affected = modified;
                break;

            case 'fill_mode':
                const modeCount = new Map<unknown, number>();
                for (const row of rows) {
                    const val = row[column];
                    if (val !== null && val !== undefined && val !== '') {
                        modeCount.set(val, (modeCount.get(val) || 0) + 1);
                    }
                }
                let mode: unknown = null;
                let maxCount = 0;
                for (const [val, count] of modeCount) {
                    if (count > maxCount) { mode = val; maxCount = count; }
                }
                for (const row of rows) {
                    if (row[column] === null || row[column] === undefined || row[column] === '') {
                        row[column] = mode;
                        modified++;
                    }
                }
                affected = modified;
                break;

            case 'remove_rows':
                const filtered = rows.filter(r =>
                    r[column] !== null && r[column] !== undefined && r[column] !== ''
                );
                affected = rows.length - filtered.length;
                return { rows: filtered, affected, modified: 0 };

            case 'remove_duplicates':
                const seen = new Set<string>();
                const unique = rows.filter(r => {
                    const key = JSON.stringify(r);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                affected = rows.length - unique.length;
                return { rows: unique, affected, modified: 0 };

            case 'cap_outliers':
                const mean = params?.mean as number || 0;
                const stdDev = params?.stdDev as number || 1;
                const lower = mean - 3 * stdDev;
                const upper = mean + 3 * stdDev;
                for (const row of rows) {
                    const val = row[column] as number;
                    if (typeof val === 'number') {
                        if (val < lower) { row[column] = lower; modified++; }
                        else if (val > upper) { row[column] = upper; modified++; }
                    }
                }
                affected = modified;
                break;
        }

        return { rows, affected, modified };
    }
}

export const dataCleaner = new DataCleaner();
