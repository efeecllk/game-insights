/**
 * Data Quality Assessment
 * Calculate statistics and quality scores for imported data
 */

export interface ColumnStats {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'mixed' | 'unknown';
    totalCount: number;
    nullCount: number;
    uniqueCount: number;
    nullPercentage: number;
    uniquePercentage: number;
    sampleValues: unknown[];
    // Numeric stats
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    // String stats
    minLength?: number;
    maxLength?: number;
    avgLength?: number;
    // Distribution (top 10 values)
    distribution: { value: string; count: number; percentage: number }[];
}

export interface DataQualityReport {
    totalRows: number;
    totalColumns: number;
    overallScore: number; // 0-100
    completeness: number; // % of non-null cells
    columns: ColumnStats[];
    issues: DataIssue[];
    summary: string;
}

export interface DataIssue {
    column: string;
    type: 'missing' | 'outlier' | 'inconsistent' | 'duplicate' | 'format';
    severity: 'low' | 'medium' | 'high';
    message: string;
    affectedRows: number;
}

/**
 * Detect value type
 */
function detectType(value: unknown): 'string' | 'number' | 'boolean' | 'date' | 'null' {
    if (value === null || value === undefined || value === '') return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
        // Check if it's a date string
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
        // Check if it's a number string
        if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
    }
    return 'string';
}

/**
 * Calculate column statistics
 */
function calculateColumnStats(
    name: string,
    values: unknown[]
): ColumnStats {
    const totalCount = values.length;
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const nullCount = totalCount - nonNullValues.length;

    // Detect predominant type
    const typeCounts = new Map<string, number>();
    for (const value of nonNullValues) {
        const type = detectType(value);
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }

    let predominantType: ColumnStats['type'] = 'unknown';
    let maxCount = 0;
    for (const [type, count] of typeCounts) {
        if (count > maxCount) {
            maxCount = count;
            predominantType = type as ColumnStats['type'];
        }
    }

    if (typeCounts.size > 1 && maxCount < nonNullValues.length * 0.9) {
        predominantType = 'mixed';
    }

    // Unique values
    const uniqueValues = new Set(nonNullValues.map(v => String(v)));
    const uniqueCount = uniqueValues.size;

    // Sample values (first 5 unique)
    const sampleValues = Array.from(uniqueValues).slice(0, 5);

    // Distribution (top 10)
    const valueCounts = new Map<string, number>();
    for (const value of nonNullValues) {
        const key = String(value);
        valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
    }

    const distribution = Array.from(valueCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({
            value: value.length > 50 ? value.substring(0, 50) + '...' : value,
            count,
            percentage: (count / nonNullValues.length) * 100
        }));

    const stats: ColumnStats = {
        name,
        type: predominantType,
        totalCount,
        nullCount,
        uniqueCount,
        nullPercentage: (nullCount / totalCount) * 100,
        uniquePercentage: (uniqueCount / Math.max(nonNullValues.length, 1)) * 100,
        sampleValues,
        distribution
    };

    // Numeric stats
    if (predominantType === 'number') {
        const numbers = nonNullValues
            .map(v => typeof v === 'number' ? v : Number(v))
            .filter(n => !isNaN(n));

        if (numbers.length > 0) {
            numbers.sort((a, b) => a - b);
            stats.min = numbers[0];
            stats.max = numbers[numbers.length - 1];
            stats.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
            stats.median = numbers[Math.floor(numbers.length / 2)];
        }
    }

    // String stats
    if (predominantType === 'string') {
        const lengths = nonNullValues
            .filter(v => typeof v === 'string')
            .map(v => (v as string).length);

        if (lengths.length > 0) {
            stats.minLength = Math.min(...lengths);
            stats.maxLength = Math.max(...lengths);
            stats.avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        }
    }

    return stats;
}

/**
 * Detect data quality issues
 */
function detectIssues(columns: ColumnStats[]): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const col of columns) {
        // High null percentage
        if (col.nullPercentage > 50) {
            issues.push({
                column: col.name,
                type: 'missing',
                severity: col.nullPercentage > 80 ? 'high' : 'medium',
                message: `${col.nullPercentage.toFixed(1)}% missing values`,
                affectedRows: col.nullCount
            });
        } else if (col.nullPercentage > 20) {
            issues.push({
                column: col.name,
                type: 'missing',
                severity: 'low',
                message: `${col.nullPercentage.toFixed(1)}% missing values`,
                affectedRows: col.nullCount
            });
        }

        // Mixed types
        if (col.type === 'mixed') {
            issues.push({
                column: col.name,
                type: 'inconsistent',
                severity: 'medium',
                message: 'Mixed data types detected',
                affectedRows: col.totalCount
            });
        }

        // Potential duplicates (very low uniqueness for identifiers)
        if (col.name.toLowerCase().includes('id') && col.uniquePercentage < 50) {
            issues.push({
                column: col.name,
                type: 'duplicate',
                severity: 'medium',
                message: `Low uniqueness (${col.uniquePercentage.toFixed(1)}%) for ID column`,
                affectedRows: col.totalCount - col.uniqueCount
            });
        }

        // Numeric outliers (if min/max spread is huge)
        if (col.type === 'number' && col.min !== undefined && col.max !== undefined && col.mean !== undefined) {
            const range = col.max - col.min;
            if (range > 0 && (col.max > col.mean * 100 || col.min < col.mean / 100)) {
                issues.push({
                    column: col.name,
                    type: 'outlier',
                    severity: 'low',
                    message: `Potential outliers detected (range: ${col.min} to ${col.max})`,
                    affectedRows: 0 // Can't determine without full analysis
                });
            }
        }
    }

    return issues;
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(columns: ColumnStats[], issues: DataIssue[]): number {
    // Base score: completeness
    const avgCompleteness = columns.reduce((sum, col) =>
        sum + (100 - col.nullPercentage), 0) / columns.length;

    // Deduct for issues
    let deduction = 0;
    for (const issue of issues) {
        switch (issue.severity) {
            case 'high': deduction += 15; break;
            case 'medium': deduction += 8; break;
            case 'low': deduction += 3; break;
        }
    }

    return Math.max(0, Math.min(100, avgCompleteness - deduction));
}

/**
 * Generate quality report for data
 */
export function analyzeDataQuality(
    data: Record<string, unknown>[],
    columnNames: string[]
): DataQualityReport {
    if (data.length === 0) {
        return {
            totalRows: 0,
            totalColumns: columnNames.length,
            overallScore: 0,
            completeness: 0,
            columns: [],
            issues: [],
            summary: 'No data to analyze'
        };
    }

    // Calculate stats for each column
    const columns: ColumnStats[] = columnNames.map(name => {
        const values = data.map(row => row[name]);
        return calculateColumnStats(name, values);
    });

    // Detect issues
    const issues = detectIssues(columns);

    // Calculate overall score
    const overallScore = calculateQualityScore(columns, issues);

    // Calculate completeness
    const totalCells = data.length * columnNames.length;
    const nullCells = columns.reduce((sum, col) => sum + col.nullCount, 0);
    const completeness = ((totalCells - nullCells) / totalCells) * 100;

    // Generate summary
    let summary = `${data.length.toLocaleString()} rows, ${columnNames.length} columns. `;
    if (overallScore >= 80) {
        summary += 'Data quality is good.';
    } else if (overallScore >= 60) {
        summary += 'Some data quality issues detected.';
    } else {
        summary += 'Significant data quality issues found.';
    }

    return {
        totalRows: data.length,
        totalColumns: columnNames.length,
        overallScore,
        completeness,
        columns,
        issues,
        summary
    };
}

/**
 * Get quality score color
 */
export function getQualityColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
}

/**
 * Get quality score label
 */
export function getQualityLabel(score: number): string {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
}
