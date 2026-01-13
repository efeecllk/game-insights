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
    ChevronRight,
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
            return 'text-[#DA7756] bg-[#DA7756]/10 border-[#DA7756]/20';
        case 'date':
        case 'datetime':
        case 'timestamp':
            return 'text-[#C15F3C] bg-[#C15F3C]/10 border-[#C15F3C]/20';
        case 'boolean':
            return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        default:
            return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
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
                    color="text-[#DA7756]"
                />
                <QuickStat
                    icon={Columns}
                    label="Columns"
                    value={qualityReport.totalColumns.toString()}
                    color="text-[#DA7756]"
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
                    color="text-[#b8b5ad]"
                />
            </motion.div>

            {/* Tab Navigation */}
            <motion.div variants={fadeIn} className="flex gap-1 p-1 bg-[#343330]/50 rounded-xl">
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
                                ? 'bg-[#DA7756] text-white shadow-lg'
                                : 'text-[#b8b5ad] hover:text-white hover:bg-[#4a4845]/50'
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
                        <div className="bg-[#1f1e1b] rounded-2xl border border-[#343330] overflow-hidden">
                            <div className="p-4 border-b border-[#343330]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                qualityReport.overallScore >= 80
                                                    ? 'bg-[#7A8B5B]/10'
                                                    : qualityReport.overallScore >= 60
                                                      ? 'bg-[#E5A84B]/10'
                                                      : 'bg-[#E25C5C]/10'
                                            }`}
                                        >
                                            <Sparkles
                                                className={`w-5 h-5 ${getQualityColor(qualityReport.overallScore)}`}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">Data Quality Analysis</h3>
                                            <p className="text-sm text-[#8F8B82]">{qualityReport.summary}</p>
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
                            <div className="grid grid-cols-3 divide-x divide-[#343330]">
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
                        <div className="bg-[#1f1e1b] rounded-2xl border border-[#343330] p-4">
                            <h4 className="text-sm font-medium text-[#d4d1c9] mb-3">Column Type Distribution</h4>
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
                                                <div className="text-sm font-medium text-white capitalize">{type}</div>
                                                <div className="text-xs text-[#8F8B82]">
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
                            <div className="bg-[#1f1e1b] rounded-2xl border border-[#343330] p-4">
                                <h4 className="text-sm font-medium text-[#d4d1c9] mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Data Issues ({qualityReport.issues.length})
                                </h4>
                                <div className="space-y-2">
                                    {qualityReport.issues.slice(0, 5).map((issue, i) => (
                                        <IssueCard key={i} issue={issue} />
                                    ))}
                                    {qualityReport.issues.length > 5 && (
                                        <button className="text-xs text-[#8F8B82] hover:text-[#b8b5ad] transition-colors">
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8F8B82]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search in data..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#343330] border border-[#4a4845] rounded-xl text-white placeholder-[#8F8B82] text-sm focus:outline-none focus:border-[#DA7756] transition-colors"
                                />
                            </div>
                            <button
                                onClick={() => setShowAllColumns(!showAllColumns)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                    showAllColumns
                                        ? 'bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/30'
                                        : 'bg-[#343330] text-[#b8b5ad] border border-[#4a4845] hover:text-white'
                                }`}
                            >
                                {showAllColumns ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                {showAllColumns ? 'All' : `${displayColumns.length}/${result.columns.length}`}
                            </button>
                        </div>

                        {/* Data Table */}
                        <div className="bg-[#1f1e1b] rounded-2xl border border-[#343330] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-[#343330]">
                                            <th className="px-3 py-3 text-left text-[#8F8B82] font-medium w-12">#</th>
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
                                                            className="flex items-center gap-2 text-[#d4d1c9] hover:text-white transition-colors group w-full"
                                                        >
                                                            <TypeIcon className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(colInfo?.type || 'string').split(' ')[0]}`} />
                                                            <span className="truncate">{col}</span>
                                                            <ArrowUpDown
                                                                className={`w-3 h-3 flex-shrink-0 transition-opacity ${
                                                                    sortColumn === col
                                                                        ? 'opacity-100 text-[#DA7756]'
                                                                        : 'opacity-0 group-hover:opacity-50'
                                                                }`}
                                                            />
                                                        </button>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#343330]">
                                        {previewData.map((row, i) => (
                                            <tr key={i} className="hover:bg-[#343330]/50 transition-colors">
                                                <td className="px-3 py-2.5 text-[#6b6967] font-mono text-xs">{i + 1}</td>
                                                {displayColumns.map((col) => (
                                                    <td
                                                        key={col}
                                                        className="px-3 py-2.5 max-w-[200px]"
                                                        title={String(row[col] ?? '')}
                                                    >
                                                        {row[col] === null || row[col] === undefined ? (
                                                            <span className="text-[#6b6967] italic text-xs">null</span>
                                                        ) : typeof row[col] === 'boolean' ? (
                                                            row[col] ? (
                                                                <CheckCircle2 className="w-4 h-4 text-[#7A8B5B]" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-[#8F8B82]" />
                                                            )
                                                        ) : (
                                                            <span className="text-[#d4d1c9] truncate block">
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
                            <div className="px-4 py-3 border-t border-[#343330] flex items-center justify-between text-xs text-[#8F8B82]">
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
                        <div key={i} className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/20">
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
        <div className="bg-[#1f1e1b] rounded-xl p-3 border border-[#343330]">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-[#8F8B82]">{label}</span>
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
            <div className="text-2xl font-bold text-white mb-1">{Math.round(clampedValue)}%</div>
            <div className="text-sm font-medium text-[#d4d1c9]">{label}</div>
            <div className="text-xs text-[#8F8B82]">{description}</div>
            <div className="mt-2 h-1.5 bg-[#343330] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedValue}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                        clampedValue >= 80
                            ? 'bg-[#7A8B5B]'
                            : clampedValue >= 60
                              ? 'bg-[#E5A84B]'
                              : 'bg-[#E25C5C]'
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
            className="bg-[#1f1e1b] rounded-xl border border-[#343330] overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#343330]/50 transition-colors"
            >
                <div className={`p-2 rounded-lg border ${getTypeColor(column.type)}`}>
                    <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                    <div className="font-medium text-white truncate">{column.name}</div>
                    <div className="text-xs text-[#8F8B82] capitalize">{column.type}</div>
                </div>
                <div className="flex items-center gap-4">
                    <MiniProgress
                        label="Complete"
                        value={fillPercent}
                        color={fillPercent >= 90 ? '#7A8B5B' : fillPercent >= 70 ? '#E5A84B' : '#E25C5C'}
                    />
                    <MiniProgress label="Unique" value={uniquePercent} color="#DA7756" />
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-[#8F8B82]" />
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
                        <div className="px-4 pb-4 pt-2 border-t border-[#343330]">
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
                                    <div className="text-xs text-[#8F8B82] mb-1.5">Sample Values</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {column.sampleValues.slice(0, 5).map((val, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-[#343330] text-[#d4d1c9] text-xs rounded-lg font-mono truncate max-w-[150px]"
                                                title={String(val)}
                                            >
                                                {String(val)}
                                            </span>
                                        ))}
                                        {column.sampleValues.length > 5 && (
                                            <span className="px-2 py-1 text-[#8F8B82] text-xs">
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
            <div className="text-xs text-[#8F8B82] mb-0.5">{label}</div>
            <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 bg-[#343330] rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
                    />
                </div>
                <span className="text-xs text-[#b8b5ad] w-8">{Math.round(value)}%</span>
            </div>
        </div>
    );
}

// Stat Box Component
function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#343330]/50 rounded-lg p-2">
            <div className="text-xs text-[#8F8B82]">{label}</div>
            <div className="text-sm font-medium text-white">{value}</div>
        </div>
    );
}

// Issue Card Component
function IssueCard({ issue }: { issue: { severity: string; column: string; message: string } }) {
    const severityConfig = {
        high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
        medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
        low: { color: 'text-[#b8b5ad]', bg: 'bg-[#8F8B82]/10', border: 'border-[#8F8B82]/20', icon: Info },
    };
    const config = severityConfig[issue.severity as keyof typeof severityConfig] || severityConfig.low;

    return (
        <div className={`flex items-start gap-3 p-3 rounded-xl ${config.bg} border ${config.border}`}>
            <config.icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${config.color}`}>{issue.column}</div>
                <div className="text-xs text-[#b8b5ad]">{issue.message}</div>
            </div>
        </div>
    );
}

// Metadata Badge Component
function MetadataBadge({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#343330]/50 rounded-lg text-xs">
            <span className="text-[#8F8B82]">{label}:</span>
            <span className="text-[#d4d1c9] font-medium">{value}</span>
        </div>
    );
}

export default DataPreview;
