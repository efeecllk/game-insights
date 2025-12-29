/**
 * Data Preview & Validation Component
 * Displays data preview with quality validation
 * Phase 3: Data Sources
 */

import { useState, useMemo } from 'react';
import {
    Table2,
    AlertTriangle,
    CheckCircle,
    Info,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Download,
    AlertCircle,
    BarChart2,
    Hash,
    Calendar,
    Type,
    ToggleLeft,
    XCircle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ColumnStats {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
    nullable: boolean;
    uniqueCount: number;
    nullCount: number;
    minValue?: number | string;
    maxValue?: number | string;
    avgValue?: number;
    sampleValues: unknown[];
}

export interface ValidationIssue {
    row: number;
    column: string;
    type: 'missing' | 'type_mismatch' | 'out_of_range' | 'invalid_format' | 'duplicate';
    message: string;
    severity: 'error' | 'warning';
    value?: unknown;
}

export interface DataPreviewProps {
    data: Record<string, unknown>[];
    columns: ColumnStats[];
    totalRows: number;
    issues?: ValidationIssue[];
    onValidate?: () => void;
    onExport?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function DataPreview({
    data,
    columns,
    totalRows,
    issues = [],
    onExport,
}: DataPreviewProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showIssuesOnly, setShowIssuesOnly] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const pageSize = 25;

    // Group issues by row
    const issuesByRow = useMemo(() => {
        const map = new Map<number, ValidationIssue[]>();
        issues.forEach(issue => {
            const rowIssues = map.get(issue.row) || [];
            rowIssues.push(issue);
            map.set(issue.row, rowIssues);
        });
        return map;
    }, [issues]);

    // Filter and sort data
    const processedData = useMemo(() => {
        let result = [...data];

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(query)
                )
            );
        }

        // Filter by issues
        if (showIssuesOnly) {
            result = result.filter((_, idx) => issuesByRow.has(idx));
        }

        // Sort
        if (sortColumn) {
            result.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchQuery, showIssuesOnly, issuesByRow, sortColumn, sortDirection]);

    // Paginate
    const paginatedData = useMemo(() => {
        const start = currentPage * pageSize;
        return processedData.slice(start, start + pageSize);
    }, [processedData, currentPage, pageSize]);

    const totalPages = Math.ceil(processedData.length / pageSize);

    // Validation summary
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    return (
        <div className="space-y-4">
            {/* Validation Summary */}
            <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-th-text-primary flex items-center gap-2">
                            <Table2 className="w-5 h-5 text-th-accent-primary" />
                            Data Preview
                        </h3>
                        <span className="text-sm text-th-text-muted">
                            {totalRows.toLocaleString()} rows • {columns.length} columns
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {onExport && (
                            <button
                                onClick={onExport}
                                className="flex items-center gap-2 px-3 py-1.5 bg-th-bg-elevated hover:bg-th-interactive-hover rounded-lg text-sm text-th-text-secondary transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        )}
                    </div>
                </div>

                {/* Quality Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QualityCard
                        icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                        label="Valid Rows"
                        value={totalRows - new Set(issues.map(i => i.row)).size}
                        total={totalRows}
                        color="green"
                    />
                    <QualityCard
                        icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                        label="Errors"
                        value={errorCount}
                        color="red"
                    />
                    <QualityCard
                        icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
                        label="Warnings"
                        value={warningCount}
                        color="yellow"
                    />
                    <QualityCard
                        icon={<BarChart2 className="w-5 h-5 text-blue-500" />}
                        label="Completeness"
                        value={Math.round((1 - columns.reduce((sum, c) => sum + c.nullCount, 0) / (totalRows * columns.length)) * 100)}
                        suffix="%"
                        color="blue"
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(0);
                        }}
                        placeholder="Search data..."
                        className="w-full pl-9 pr-4 py-2 bg-th-bg-surface border border-th-border rounded-lg text-sm text-th-text-primary placeholder:text-th-text-muted focus:outline-none focus:border-th-accent-primary"
                    />
                </div>

                <button
                    onClick={() => setShowIssuesOnly(!showIssuesOnly)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showIssuesOnly
                            ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                            : 'bg-th-bg-surface border border-th-border text-th-text-secondary hover:bg-th-interactive-hover'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    {showIssuesOnly ? 'Showing Issues' : 'Show Issues Only'}
                    {issues.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${showIssuesOnly ? 'bg-red-500/20' : 'bg-th-bg-elevated'}`}>
                            {new Set(issues.map(i => i.row)).size}
                        </span>
                    )}
                </button>

                <div className="flex-1" />

                <div className="text-sm text-th-text-muted">
                    Showing {Math.min(processedData.length, pageSize)} of {processedData.length}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-th-bg-surface rounded-xl border border-th-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-th-border-subtle bg-th-bg-elevated">
                                <th className="px-4 py-3 text-left text-th-text-muted font-medium w-12">
                                    #
                                </th>
                                {columns.map(col => (
                                    <th
                                        key={col.name}
                                        className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-th-bg-surface-hover transition-colors"
                                        onClick={() => handleSort(col.name)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ColumnTypeIcon type={col.type} />
                                            <span className="text-th-text-primary">{col.name}</span>
                                            {sortColumn === col.name && (
                                                <span className="text-th-accent-primary">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((row, rowIdx) => {
                                const actualRowIdx = currentPage * pageSize + rowIdx;
                                const rowIssues = issuesByRow.get(actualRowIdx) || [];
                                const hasError = rowIssues.some(i => i.severity === 'error');
                                const hasWarning = rowIssues.some(i => i.severity === 'warning');

                                return (
                                    <tr
                                        key={rowIdx}
                                        className={`border-b border-th-border-subtle transition-colors ${
                                            hasError
                                                ? 'bg-red-500/5 hover:bg-red-500/10'
                                                : hasWarning
                                                ? 'bg-yellow-500/5 hover:bg-yellow-500/10'
                                                : 'hover:bg-th-bg-surface-hover'
                                        }`}
                                    >
                                        <td className="px-4 py-2 text-th-text-muted font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                {actualRowIdx + 1}
                                                {hasError && <XCircle className="w-3 h-3 text-red-500" />}
                                                {!hasError && hasWarning && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                                            </div>
                                        </td>
                                        {columns.map(col => {
                                            const value = row[col.name];
                                            const cellIssue = rowIssues.find(i => i.column === col.name);

                                            return (
                                                <td
                                                    key={col.name}
                                                    className="px-4 py-2"
                                                    onClick={() => setSelectedColumn(selectedColumn === col.name ? null : col.name)}
                                                >
                                                    <CellValue
                                                        value={value}
                                                        type={col.type}
                                                        issue={cellIssue}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-th-border-subtle bg-th-bg-elevated">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-th-interactive-hover rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i;
                                } else if (currentPage < 3) {
                                    pageNum = i;
                                } else if (currentPage > totalPages - 4) {
                                    pageNum = totalPages - 5 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                                            currentPage === pageNum
                                                ? 'bg-th-accent-primary text-white'
                                                : 'text-th-text-muted hover:bg-th-interactive-hover'
                                        }`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-th-interactive-hover rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Column Stats */}
            <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
                <h4 className="font-medium text-th-text-primary mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-th-accent-primary" />
                    Column Statistics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {columns.map(col => (
                        <ColumnStatsCard key={col.name} column={col} totalRows={totalRows} />
                    ))}
                </div>
            </div>

            {/* Issues List */}
            {issues.length > 0 && (
                <div className="bg-th-bg-surface rounded-xl border border-th-border p-4">
                    <h4 className="font-medium text-th-text-primary mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Validation Issues ({issues.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {issues.slice(0, 20).map((issue, idx) => (
                            <IssueCard key={idx} issue={issue} />
                        ))}
                        {issues.length > 20 && (
                            <p className="text-sm text-th-text-muted text-center py-2">
                                And {issues.length - 20} more issues...
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Sub Components
// ============================================================================

function QualityCard({
    icon,
    label,
    value,
    total,
    suffix = '',
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    total?: number;
    suffix?: string;
    color: 'green' | 'red' | 'yellow' | 'blue';
}) {
    const colorMap = {
        green: 'bg-green-500/10',
        red: 'bg-red-500/10',
        yellow: 'bg-yellow-500/10',
        blue: 'bg-blue-500/10',
    };

    return (
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-sm text-th-text-muted">{label}</span>
            </div>
            <div className="text-2xl font-bold text-th-text-primary">
                {value.toLocaleString()}{suffix}
                {total !== undefined && (
                    <span className="text-sm text-th-text-muted font-normal ml-1">
                        / {total.toLocaleString()}
                    </span>
                )}
            </div>
        </div>
    );
}

function ColumnTypeIcon({ type }: { type: ColumnStats['type'] }) {
    switch (type) {
        case 'number':
            return <Hash className="w-4 h-4 text-blue-500" />;
        case 'date':
            return <Calendar className="w-4 h-4 text-purple-500" />;
        case 'boolean':
            return <ToggleLeft className="w-4 h-4 text-green-500" />;
        case 'string':
            return <Type className="w-4 h-4 text-orange-500" />;
        default:
            return <Info className="w-4 h-4 text-gray-500" />;
    }
}

function CellValue({
    value,
    type,
    issue,
}: {
    value: unknown;
    type: ColumnStats['type'];
    issue?: ValidationIssue;
}) {
    if (value === null || value === undefined || value === '') {
        return (
            <span className={`text-th-text-disabled italic ${issue ? 'text-red-400' : ''}`}>
                null
            </span>
        );
    }

    const baseStyle = issue
        ? issue.severity === 'error'
            ? 'text-red-400 underline decoration-red-400 decoration-wavy'
            : 'text-yellow-500 underline decoration-yellow-500 decoration-dotted'
        : 'text-th-text-primary';

    switch (type) {
        case 'number':
            return (
                <span className={`font-mono ${baseStyle}`}>
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </span>
            );
        case 'boolean':
            return (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    value ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                    {value ? 'true' : 'false'}
                </span>
            );
        case 'date':
            return (
                <span className={`font-mono text-xs ${baseStyle}`}>
                    {String(value)}
                </span>
            );
        default:
            const strValue = String(value);
            return (
                <span className={baseStyle} title={strValue.length > 50 ? strValue : undefined}>
                    {strValue.length > 50 ? strValue.slice(0, 50) + '...' : strValue}
                </span>
            );
    }
}

function ColumnStatsCard({ column, totalRows }: { column: ColumnStats; totalRows: number }) {
    const completeness = Math.round((1 - column.nullCount / totalRows) * 100);
    const uniqueness = Math.round((column.uniqueCount / totalRows) * 100);

    return (
        <div className="bg-th-bg-elevated rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <ColumnTypeIcon type={column.type} />
                <span className="font-medium text-th-text-primary truncate">{column.name}</span>
                <span className="text-xs px-2 py-0.5 bg-th-bg-surface rounded-full text-th-text-muted capitalize">
                    {column.type}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <div className="text-th-text-muted">Completeness</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-th-border-subtle rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${completeness >= 95 ? 'bg-green-500' : completeness >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${completeness}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-th-text-primary">{completeness}%</span>
                    </div>
                </div>
                <div>
                    <div className="text-th-text-muted">Unique</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-th-border-subtle rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${uniqueness}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-th-text-primary">{uniqueness}%</span>
                    </div>
                </div>
            </div>

            {column.type === 'number' && column.minValue !== undefined && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <div className="text-th-text-muted">Min</div>
                        <div className="font-mono text-th-text-primary">{column.minValue}</div>
                    </div>
                    <div>
                        <div className="text-th-text-muted">Avg</div>
                        <div className="font-mono text-th-text-primary">
                            {column.avgValue?.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="text-th-text-muted">Max</div>
                        <div className="font-mono text-th-text-primary">{column.maxValue}</div>
                    </div>
                </div>
            )}

            {column.sampleValues.length > 0 && (
                <div className="mt-3">
                    <div className="text-xs text-th-text-muted mb-1">Sample Values</div>
                    <div className="flex flex-wrap gap-1">
                        {column.sampleValues.slice(0, 3).map((val, idx) => (
                            <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-th-bg-surface rounded text-xs text-th-text-secondary font-mono"
                            >
                                {String(val).slice(0, 20)}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function IssueCard({ issue }: { issue: ValidationIssue }) {
    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg ${
            issue.severity === 'error' ? 'bg-red-500/5' : 'bg-yellow-500/5'
        }`}>
            {issue.severity === 'error' ? (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-th-text-primary">Row {issue.row + 1}</span>
                    <span className="text-th-text-muted">•</span>
                    <span className="text-th-text-secondary">{issue.column}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                        issue.type === 'missing' ? 'bg-gray-500/10 text-gray-400' :
                        issue.type === 'type_mismatch' ? 'bg-orange-500/10 text-orange-400' :
                        issue.type === 'duplicate' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-blue-500/10 text-blue-400'
                    }`}>
                        {issue.type.replace('_', ' ')}
                    </span>
                </div>
                <p className="text-sm text-th-text-muted mt-0.5">{issue.message}</p>
            </div>
        </div>
    );
}

export default DataPreview;
