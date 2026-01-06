/**
 * Data Preview & Validation Component - Obsidian Analytics Design
 *
 * Premium data preview with:
 * - Glassmorphism containers
 * - Animated quality cards
 * - Interactive table with hover states
 * - Emerald accent styling
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

const tableRowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.2 },
    },
};

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
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* Validation Summary */}
            <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5"
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#DA7756]/20 rounded-xl blur-lg" />
                            <div className="relative w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                <Table2 className="w-5 h-5 text-[#DA7756]" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Data Preview</h3>
                            <p className="text-sm text-slate-400">
                                {totalRows.toLocaleString()} rows • {columns.length} columns
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onExport && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onExport}
                                className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Quality Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QualityCard
                        icon={<CheckCircle className="w-5 h-5 text-[#DA7756]" />}
                        label="Valid Rows"
                        value={totalRows - new Set(issues.map(i => i.row)).size}
                        total={totalRows}
                        color="orange"
                    />
                    <QualityCard
                        icon={<AlertCircle className="w-5 h-5 text-rose-400" />}
                        label="Errors"
                        value={errorCount}
                        color="rose"
                    />
                    <QualityCard
                        icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
                        label="Warnings"
                        value={warningCount}
                        color="amber"
                    />
                    <QualityCard
                        icon={<BarChart2 className="w-5 h-5 text-blue-400" />}
                        label="Completeness"
                        value={Math.round((1 - columns.reduce((sum, c) => sum + c.nullCount, 0) / (totalRows * columns.length)) * 100)}
                        suffix="%"
                        color="blue"
                    />
                </div>
            </motion.div>

            {/* Controls */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(0);
                        }}
                        placeholder="Search data..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowIssuesOnly(!showIssuesOnly)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        showIssuesOnly
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    {showIssuesOnly ? 'Showing Issues' : 'Show Issues Only'}
                    {issues.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${showIssuesOnly ? 'bg-rose-500/30' : 'bg-white/[0.06]'}`}>
                            {new Set(issues.map(i => i.row)).size}
                        </span>
                    )}
                </motion.button>

                <div className="flex-1" />

                <div className="text-sm text-slate-400">
                    Showing {Math.min(processedData.length, pageSize)} of {processedData.length}
                </div>
            </motion.div>

            {/* Data Table */}
            <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                <th className="px-4 py-3 text-left text-slate-400 font-medium w-12">
                                    #
                                </th>
                                {columns.map(col => (
                                    <th
                                        key={col.name}
                                        className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-white/[0.03] transition-colors"
                                        onClick={() => handleSort(col.name)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ColumnTypeIcon type={col.type} />
                                            <span className="text-white">{col.name}</span>
                                            {sortColumn === col.name && (
                                                <span className="text-[#DA7756]">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {paginatedData.map((row, rowIdx) => {
                                    const actualRowIdx = currentPage * pageSize + rowIdx;
                                    const rowIssues = issuesByRow.get(actualRowIdx) || [];
                                    const hasError = rowIssues.some(i => i.severity === 'error');
                                    const hasWarning = rowIssues.some(i => i.severity === 'warning');

                                    return (
                                        <motion.tr
                                            key={rowIdx}
                                            variants={tableRowVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            className={`border-b border-white/[0.04] transition-colors ${
                                                hasError
                                                    ? 'bg-rose-500/5 hover:bg-rose-500/10'
                                                    : hasWarning
                                                    ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                                    : 'hover:bg-white/[0.02]'
                                            }`}
                                        >
                                            <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    {actualRowIdx + 1}
                                                    {hasError && <XCircle className="w-3 h-3 text-rose-400" />}
                                                    {!hasError && hasWarning && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                                                </div>
                                            </td>
                                            {columns.map(col => {
                                                const value = row[col.name];
                                                const cellIssue = rowIssues.find(i => i.column === col.name);

                                                return (
                                                    <td
                                                        key={col.name}
                                                        className="px-4 py-2.5"
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
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </motion.button>

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
                                    <motion.button
                                        key={pageNum}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                            currentPage === pageNum
                                                ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                                : 'text-slate-400 hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        {pageNum + 1}
                                    </motion.button>
                                );
                            })}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                )}
            </motion.div>

            {/* Column Stats */}
            <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5"
            >
                <h4 className="font-medium text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                        <BarChart2 className="w-4 h-4 text-[#DA7756]" />
                    </div>
                    Column Statistics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {columns.map((col, idx) => (
                        <motion.div
                            key={col.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <ColumnStatsCard column={col} totalRows={totalRows} />
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Issues List */}
            <AnimatePresence>
                {issues.length > 0 && (
                    <motion.div
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5"
                    >
                        <h4 className="font-medium text-white mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                            </div>
                            Validation Issues
                            <span className="text-sm font-normal text-slate-400">
                                ({issues.length})
                            </span>
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {issues.slice(0, 20).map((issue, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <IssueCard issue={issue} />
                                </motion.div>
                            ))}
                            {issues.length > 20 && (
                                <p className="text-sm text-slate-500 text-center py-2">
                                    And {issues.length - 20} more issues...
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
    color: 'orange' | 'rose' | 'amber' | 'blue';
}) {
    const colorMap = {
        orange: { bg: 'bg-[#DA7756]/10', border: 'border-[#DA7756]/20' },
        rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    };

    const style = colorMap[color];

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 ${style.bg} border ${style.border}`}
        >
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-sm text-slate-400">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">
                {value.toLocaleString()}{suffix}
                {total !== undefined && (
                    <span className="text-sm text-slate-500 font-normal ml-1">
                        / {total.toLocaleString()}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

function ColumnTypeIcon({ type }: { type: ColumnStats['type'] }) {
    switch (type) {
        case 'number':
            return <Hash className="w-4 h-4 text-blue-400" />;
        case 'date':
            return <Calendar className="w-4 h-4 text-violet-400" />;
        case 'boolean':
            return <ToggleLeft className="w-4 h-4 text-[#DA7756]" />;
        case 'string':
            return <Type className="w-4 h-4 text-[#C15F3C]" />;
        default:
            return <Info className="w-4 h-4 text-slate-400" />;
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
            <span className={`text-slate-600 italic ${issue ? 'text-rose-400' : ''}`}>
                null
            </span>
        );
    }

    const baseStyle = issue
        ? issue.severity === 'error'
            ? 'text-rose-400 underline decoration-rose-400 decoration-wavy'
            : 'text-amber-400 underline decoration-amber-400 decoration-dotted'
        : 'text-white';

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
                    value ? 'bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 transition-colors">
            <div className="flex items-center gap-2 mb-3">
                <ColumnTypeIcon type={column.type} />
                <span className="font-medium text-white truncate">{column.name}</span>
                <span className="text-xs px-2 py-0.5 bg-white/[0.06] rounded-full text-slate-400 capitalize">
                    {column.type}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <div className="text-slate-500 text-xs mb-1">Completeness</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completeness}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className={`h-full rounded-full ${completeness >= 95 ? 'bg-[#DA7756]' : completeness >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            />
                        </div>
                        <span className="text-xs font-medium text-white">{completeness}%</span>
                    </div>
                </div>
                <div>
                    <div className="text-slate-500 text-xs mb-1">Unique</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${uniqueness}%` }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="h-full rounded-full bg-blue-500"
                            />
                        </div>
                        <span className="text-xs font-medium text-white">{uniqueness}%</span>
                    </div>
                </div>
            </div>

            {column.type === 'number' && column.minValue !== undefined && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <div className="text-slate-500">Min</div>
                        <div className="font-mono text-white">{column.minValue}</div>
                    </div>
                    <div>
                        <div className="text-slate-500">Avg</div>
                        <div className="font-mono text-white">
                            {column.avgValue?.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-500">Max</div>
                        <div className="font-mono text-white">{column.maxValue}</div>
                    </div>
                </div>
            )}

            {column.sampleValues.length > 0 && (
                <div className="mt-3">
                    <div className="text-xs text-slate-500 mb-1">Sample Values</div>
                    <div className="flex flex-wrap gap-1">
                        {column.sampleValues.slice(0, 3).map((val, idx) => (
                            <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-xs text-slate-300 font-mono"
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
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${
            issue.severity === 'error'
                ? 'bg-rose-500/5 border-rose-500/20'
                : 'bg-amber-500/5 border-amber-500/20'
        }`}>
            {issue.severity === 'error' ? (
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-white">Row {issue.row + 1}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300">{issue.column}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                        issue.type === 'missing' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                        issue.type === 'type_mismatch' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        issue.type === 'duplicate' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                        {issue.type.replace('_', ' ')}
                    </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">{issue.message}</p>
            </div>
        </div>
    );
}

export default DataPreview;
