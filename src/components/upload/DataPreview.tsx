/**
 * Data Preview Component - Enhanced UX
 *
 * Premium data preview with:
 * - Interactive column explorer with distributions
 * - Data quality dashboard with visual metrics
 * - Searchable data table with sticky headers
 * - Type-aware column indicators
 * - Smooth animations and transitions
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Info,
    BarChart3,
    Hash,
    Calendar,
    Type,
    ToggleLeft,
    ChevronDown,
    Search,
    Table2,
    Columns,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Sparkles,
    Eye,
    EyeOff,
    ArrowUpDown,
} from 'lucide-react';
import { analyzeDataQuality, getQualityColor, getQualityLabel } from '../../lib/validation/dataQuality';
import type { ImportResult } from '../../lib/importers';

interface DataPreviewProps {
    result: ImportResult;
    maxRows?: number;
}

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

// Type icons
const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'number':
        case 'integer':
        case 'float':
            return Hash;
        case 'date':
        case 'datetime':
        case 'timestamp':
            return Calendar;
        case 'boolean':
            return ToggleLeft;
        default:
            return Type;
    }
};

const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
        case 'number':
        case 'integer':
        case 'float':
            return 'text-th-accent-primary bg-th-accent-primary/10 border-th-accent-primary/20';
        case 'date':
        case 'datetime':
        case 'timestamp':
            return 'text-th-accent-secondary bg-th-accent-secondary/10 border-th-accent-secondary/20';
        case 'boolean':
            return 'text-th-warning bg-th-warning/10 border-th-warning/20';
        default:
            return 'text-th-success bg-th-success/10 border-th-success/20';
    }
};

export function DataPreview({ result, maxRows = 15 }: DataPreviewProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'table'>('overview');
    const [expandedColumn, setExpandedColumn] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllColumns, setShowAllColumns] = useState(false);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const qualityReport = useMemo(
        () => analyzeDataQuality(result.data, result.columns),
        [result.data, result.columns]
    );

    // Filtered and sorted preview data
    const previewData = useMemo(() => {
        let data = [...result.data];

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter((row) =>
                Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(query))
            );
        }

        // Sort
        if (sortColumn) {
            data.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return data.slice(0, maxRows);
    }, [result.data, searchQuery, sortColumn, sortDirection, maxRows]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Calculate type distribution
    const typeDistribution = useMemo(() => {
        const types: Record<string, number> = {};
        qualityReport.columns.forEach((col) => {
            const type = col.type || 'unknown';
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }, [qualityReport.columns]);

    const displayColumns = showAllColumns ? result.columns : result.columns.slice(0, 10);

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* Quick Stats Bar */}
            <motion.div
                variants={fadeIn}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
                <QuickStat
                    icon={FileText}
                    label="Rows"
                    value={qualityReport.totalRows.toLocaleString()}
                    color="text-th-accent-primary"
                />
                <QuickStat
                    icon={Columns}
                    label="Columns"
                    value={qualityReport.totalColumns.toString()}
                    color="text-th-accent-primary"
                />
                <QuickStat
                    icon={BarChart3}
                    label="Quality"
                    value={`${Math.round(qualityReport.overallScore)}%`}
                    color={getQualityColor(qualityReport.overallScore)}
                    badge={getQualityLabel(qualityReport.overallScore)}
                />
                <QuickStat
                    icon={Clock}
                    label="Processed"
                    value={`${result.metadata?.processingTimeMs || 0}ms`}
                    color="text-th-text-secondary"
                />
            </motion.div>

            {/* Tab Navigation */}
            <motion.div variants={fadeIn} className="flex gap-1 p-1 bg-th-bg-subtle/50 rounded-xl">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'columns', label: 'Columns', icon: Columns },
                    { id: 'table', label: 'Data Table', icon: Table2 },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-th-accent-primary text-white shadow-lg'
                                : 'text-th-text-secondary hover:text-th-text-primary hover:bg-th-bg-elevated/50'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Data Quality Dashboard */}
                        <div className="bg-th-bg-surface rounded-2xl border border-th-border-subtle overflow-hidden">
                            <div className="p-4 border-b border-th-border-subtle">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                qualityReport.overallScore >= 80
                                                    ? 'bg-th-success/10'
                                                    : qualityReport.overallScore >= 60
                                                      ? 'bg-th-warning/10'
                                                      : 'bg-th-error/10'
                                            }`}
                                        >
                                            <Sparkles
                                                className={`w-5 h-5 ${getQualityColor(qualityReport.overallScore)}`}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-th-text-primary">Data Quality Analysis</h3>
                                            <p className="text-sm text-th-text-muted">{qualityReport.summary}</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`text-3xl font-bold ${getQualityColor(qualityReport.overallScore)}`}
                                    >
                                        {Math.round(qualityReport.overallScore)}%
                                    </div>
                                </div>
                            </div>

                            {/* Quality Metrics Grid */}
                            <div className="grid grid-cols-3 divide-x divide-th-border-subtle">
                                <QualityMetric
                                    label="Completeness"
                                    value={100 - (qualityReport.columns.reduce((acc, c) => acc + c.nullPercentage, 0) / qualityReport.columns.length)}
                                    description="Non-null values"
                                />
                                <QualityMetric
                                    label="Unique Values"
                                    value={(qualityReport.columns.reduce((acc, c) => acc + (c.uniqueCount / qualityReport.totalRows * 100), 0) / qualityReport.columns.length)}
                                    description="Value diversity"
                                />
                                <QualityMetric
                                    label="Type Consistency"
                                    value={qualityReport.overallScore}
                                    description="Type matching"
                                />
                            </div>
                        </div>

                        {/* Type Distribution */}
                        <div className="bg-th-bg-surface rounded-2xl border border-th-border-subtle p-4">
                            <h4 className="text-sm font-medium text-th-text-secondary mb-3">Column Type Distribution</h4>
                            <div className="flex gap-4">
                                {Object.entries(typeDistribution).map(([type, count]) => {
                                    const TypeIcon = getTypeIcon(type);
                                    const percentage = Math.round((count / qualityReport.totalColumns) * 100);
                                    return (
                                        <div key={type} className="flex items-center gap-2">
                                            <div
                                                className={`p-1.5 rounded-lg border ${getTypeColor(type)}`}
                                            >
                                                <TypeIcon className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-th-text-primary capitalize">{type}</div>
                                                <div className="text-xs text-th-text-muted">
                                                    {count} ({percentage}%)
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Issues Section */}
                        {qualityReport.issues.length > 0 && (
                            <div className="bg-th-bg-surface rounded-2xl border border-th-border-subtle p-4">
                                <h4 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-th-warning" />
                                    Data Issues ({qualityReport.issues.length})
                                </h4>
                                <div className="space-y-2">
                                    {qualityReport.issues.slice(0, 5).map((issue, i) => (
                                        <IssueCard key={i} issue={issue} />
                                    ))}
                                    {qualityReport.issues.length > 5 && (
                                        <button className="text-xs text-th-text-muted hover:text-th-text-secondary transition-colors">
                                            +{qualityReport.issues.length - 5} more issues
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        {result.metadata && (
                            <div className="flex flex-wrap gap-2">
                                {result.metadata.format && (
                                    <MetadataBadge label="Format" value={result.metadata.format.toUpperCase()} />
                                )}
                                {result.metadata.delimiter && (
                                    <MetadataBadge
                                        label="Delimiter"
                                        value={result.metadata.delimiter === '\t' ? 'TAB' : result.metadata.delimiter}
                                    />
                                )}
                                {result.metadata.sheetName && (
                                    <MetadataBadge label="Sheet" value={result.metadata.sheetName} />
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'columns' && (
                    <motion.div
                        key="columns"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {/* Column List */}
                        {qualityReport.columns.map((col) => (
                            <ColumnCard
                                key={col.name}
                                column={col}
                                isExpanded={expandedColumn === col.name}
                                onToggle={() => setExpandedColumn(expandedColumn === col.name ? null : col.name)}
                                totalRows={qualityReport.totalRows}
                            />
                        ))}
                    </motion.div>
                )}

                {activeTab === 'table' && (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {/* Search & Controls */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-muted" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search in data..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-th-bg-subtle border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted text-sm focus:outline-none focus:border-th-accent-primary transition-colors"
                                />
                            </div>
                            <button
                                onClick={() => setShowAllColumns(!showAllColumns)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                    showAllColumns
                                        ? 'bg-th-accent-primary/10 text-th-accent-primary border border-th-accent-primary/30'
                                        : 'bg-th-bg-subtle text-th-text-secondary border border-th-border hover:text-th-text-primary'
                                }`}
                            >
                                {showAllColumns ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                {showAllColumns ? 'All' : `${displayColumns.length}/${result.columns.length}`}
                            </button>
                        </div>

                        {/* Data Table */}
                        <div className="bg-th-bg-surface rounded-2xl border border-th-border-subtle overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-th-bg-subtle">
                                            <th className="px-3 py-3 text-left text-th-text-muted font-medium w-12">#</th>
                                            {displayColumns.map((col) => {
                                                const colInfo = qualityReport.columns.find((c) => c.name === col);
                                                const TypeIcon = getTypeIcon(colInfo?.type || 'string');
                                                return (
                                                    <th
                                                        key={col}
                                                        className="px-3 py-3 text-left font-medium min-w-[120px] max-w-[200px]"
                                                    >
                                                        <button
                                                            onClick={() => handleSort(col)}
                                                            className="flex items-center gap-2 text-th-text-secondary hover:text-th-text-primary transition-colors group w-full"
                                                        >
                                                            <TypeIcon className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(colInfo?.type || 'string').split(' ')[0]}`} />
                                                            <span className="truncate">{col}</span>
                                                            <ArrowUpDown
                                                                className={`w-3 h-3 flex-shrink-0 transition-opacity ${
                                                                    sortColumn === col
                                                                        ? 'opacity-100 text-th-accent-primary'
                                                                        : 'opacity-0 group-hover:opacity-50'
                                                                }`}
                                                            />
                                                        </button>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-th-border-subtle">
                                        {previewData.map((row, i) => (
                                            <tr key={i} className="hover:bg-th-bg-subtle/50 transition-colors">
                                                <td className="px-3 py-2.5 text-th-text-disabled font-mono text-xs">{i + 1}</td>
                                                {displayColumns.map((col) => (
                                                    <td
                                                        key={col}
                                                        className="px-3 py-2.5 max-w-[200px]"
                                                        title={String(row[col] ?? '')}
                                                    >
                                                        {row[col] === null || row[col] === undefined ? (
                                                            <span className="text-th-text-disabled italic text-xs">null</span>
                                                        ) : typeof row[col] === 'boolean' ? (
                                                            row[col] ? (
                                                                <CheckCircle2 className="w-4 h-4 text-th-success" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-th-text-muted" />
                                                            )
                                                        ) : (
                                                            <span className="text-th-text-secondary truncate block">
                                                                {String(row[col])}
                                                            </span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table Footer */}
                            <div className="px-4 py-3 border-t border-th-border-subtle flex items-center justify-between text-xs text-th-text-muted">
                                <span>
                                    Showing {previewData.length} of {qualityReport.totalRows.toLocaleString()} rows
                                </span>
                                {!showAllColumns && result.columns.length > 10 && (
                                    <span>
                                        {result.columns.length - 10} columns hidden
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Import Warnings */}
            {result.warnings.length > 0 && (
                <motion.div variants={fadeIn} className="space-y-2">
                    {result.warnings.map((warning, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-th-warning bg-th-warning/5 px-3 py-2 rounded-lg border border-th-warning/20">
                            <Info className="w-4 h-4 flex-shrink-0" />
                            {warning}
                        </div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}

// Quick Stat Component
function QuickStat({
    icon: Icon,
    label,
    value,
    color,
    badge,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    badge?: string;
}) {
    return (
        <div className="bg-th-bg-surface rounded-xl p-3 border border-th-border-subtle">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-th-text-muted">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${color}`}>{value}</span>
                {badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${color.replace('text-', 'bg-').replace(/-.00/, '/10')} ${color}`}>
                        {badge}
                    </span>
                )}
            </div>
        </div>
    );
}

// Quality Metric Component
function QualityMetric({ label, value, description }: { label: string; value: number; description: string }) {
    const clampedValue = Math.min(100, Math.max(0, value));
    return (
        <div className="p-4 text-center">
            <div className="text-2xl font-bold text-th-text-primary mb-1">{Math.round(clampedValue)}%</div>
            <div className="text-sm font-medium text-th-text-secondary">{label}</div>
            <div className="text-xs text-th-text-muted">{description}</div>
            <div className="mt-2 h-1.5 bg-th-bg-subtle rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedValue}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                        clampedValue >= 80
                            ? 'bg-th-success'
                            : clampedValue >= 60
                              ? 'bg-th-warning'
                              : 'bg-th-error'
                    }`}
                />
            </div>
        </div>
    );
}

// Column Card Component
function ColumnCard({
    column,
    isExpanded,
    onToggle,
    totalRows,
}: {
    column: {
        name: string;
        type: string;
        nullPercentage: number;
        uniqueCount: number;
        sampleValues: unknown[];
        min?: number;
        max?: number;
    };
    isExpanded: boolean;
    onToggle: () => void;
    totalRows: number;
}) {
    const TypeIcon = getTypeIcon(column.type);
    const fillPercent = 100 - column.nullPercentage;
    const uniquePercent = Math.min(100, (column.uniqueCount / totalRows) * 100);

    return (
        <motion.div
            layout
            className="bg-th-bg-surface rounded-xl border border-th-border-subtle overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-th-bg-subtle/50 transition-colors"
            >
                <div className={`p-2 rounded-lg border ${getTypeColor(column.type)}`}>
                    <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                    <div className="font-medium text-th-text-primary truncate">{column.name}</div>
                    <div className="text-xs text-th-text-muted capitalize">{column.type}</div>
                </div>
                <div className="flex items-center gap-4">
                    <MiniProgress
                        label="Complete"
                        value={fillPercent}
                        color={fillPercent >= 90 ? 'var(--color-success)' : fillPercent >= 70 ? 'var(--color-warning)' : 'var(--color-error)'}
                    />
                    <MiniProgress label="Unique" value={uniquePercent} color="var(--color-accent-primary)" />
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-th-text-muted" />
                    </motion.div>
                </div>
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-2 border-t border-th-border-subtle">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                <StatBox label="Unique Values" value={column.uniqueCount.toLocaleString()} />
                                <StatBox label="Null %" value={`${column.nullPercentage.toFixed(1)}%`} />
                                {column.type === 'number' && column.min !== undefined && (
                                    <>
                                        <StatBox label="Min" value={column.min.toLocaleString()} />
                                        <StatBox label="Max" value={column.max?.toLocaleString() || '-'} />
                                    </>
                                )}
                            </div>
                            {column.sampleValues.length > 0 && (
                                <div>
                                    <div className="text-xs text-th-text-muted mb-1.5">Sample Values</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {column.sampleValues.slice(0, 5).map((val, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-th-bg-subtle text-th-text-secondary text-xs rounded-lg font-mono truncate max-w-[150px]"
                                                title={String(val)}
                                            >
                                                {String(val)}
                                            </span>
                                        ))}
                                        {column.sampleValues.length > 5 && (
                                            <span className="px-2 py-1 text-th-text-muted text-xs">
                                                +{column.sampleValues.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Mini Progress Component
function MiniProgress({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="text-right">
            <div className="text-xs text-th-text-muted mb-0.5">{label}</div>
            <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 bg-th-bg-subtle rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
                    />
                </div>
                <span className="text-xs text-th-text-secondary w-8">{Math.round(value)}%</span>
            </div>
        </div>
    );
}

// Stat Box Component
function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-th-bg-subtle/50 rounded-lg p-2">
            <div className="text-xs text-th-text-muted">{label}</div>
            <div className="text-sm font-medium text-th-text-primary">{value}</div>
        </div>
    );
}

// Issue Card Component
function IssueCard({ issue }: { issue: { severity: string; column: string; message: string } }) {
    const severityConfig = {
        high: { color: 'text-th-error', bg: 'bg-th-error/10', border: 'border-th-error/20', icon: AlertTriangle },
        medium: { color: 'text-th-warning', bg: 'bg-th-warning/10', border: 'border-th-warning/20', icon: AlertTriangle },
        low: { color: 'text-th-chart-5', bg: 'bg-th-chart-5/10', border: 'border-th-chart-5/20', icon: Info },
    };
    const config = severityConfig[issue.severity as keyof typeof severityConfig] || severityConfig.low;

    return (
        <div className={`flex items-start gap-3 p-3 rounded-xl ${config.bg} border ${config.border}`}>
            <config.icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${config.color}`}>{issue.column}</div>
                <div className="text-xs text-th-text-secondary">{issue.message}</div>
            </div>
        </div>
    );
}

// Metadata Badge Component
function MetadataBadge({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-th-bg-subtle/50 rounded-lg text-xs">
            <span className="text-th-text-muted">{label}:</span>
            <span className="text-th-text-secondary font-medium">{value}</span>
        </div>
    );
}

export default DataPreview;
