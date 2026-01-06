/**
 * Data Preview Component - Obsidian Analytics Design
 *
 * Premium data preview with:
 * - Column statistics
 * - Quality scoring
 * - Sample data display
 */

import { useMemo } from 'react';
import { AlertTriangle, Info, BarChart3 } from 'lucide-react';
import { analyzeDataQuality, getQualityColor, getQualityLabel } from '../../lib/validation/dataQuality';
import type { ImportResult } from '../../lib/importers';

interface DataPreviewProps {
    result: ImportResult;
    maxRows?: number;
}

export function DataPreview({ result, maxRows = 10 }: DataPreviewProps) {
    const qualityReport = useMemo(() =>
        analyzeDataQuality(result.data, result.columns),
        [result.data, result.columns]
    );

    const previewData = result.data.slice(0, maxRows);

    return (
        <div className="space-y-6">
            {/* Quality Score Card */}
            <div className="bg-bg-card rounded-card p-4 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            qualityReport.overallScore >= 80 ? 'bg-green-500/10' :
                            qualityReport.overallScore >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'
                        }`}>
                            <BarChart3 className={`w-6 h-6 ${getQualityColor(qualityReport.overallScore)}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-bold ${getQualityColor(qualityReport.overallScore)}`}>
                                    {Math.round(qualityReport.overallScore)}%
                                </span>
                                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                                    qualityReport.overallScore >= 80 ? 'bg-green-500/10 text-green-500' :
                                    qualityReport.overallScore >= 60 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                    {getQualityLabel(qualityReport.overallScore)}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-500">{qualityReport.summary}</p>
                        </div>
                    </div>
                    <div className="text-right text-sm text-zinc-500">
                        <p>{qualityReport.totalRows.toLocaleString()} rows</p>
                        <p>{qualityReport.totalColumns} columns</p>
                    </div>
                </div>

                {/* Metadata */}
                {result.metadata && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-4 text-xs text-zinc-500">
                        {result.metadata.format && (
                            <span className="px-2 py-1 bg-bg-elevated rounded">
                                Format: {result.metadata.format.toUpperCase()}
                            </span>
                        )}
                        {result.metadata.delimiter && (
                            <span className="px-2 py-1 bg-bg-elevated rounded">
                                Delimiter: {result.metadata.delimiter === '\t' ? 'TAB' : result.metadata.delimiter}
                            </span>
                        )}
                        {result.metadata.sheetName && (
                            <span className="px-2 py-1 bg-bg-elevated rounded">
                                Sheet: {result.metadata.sheetName}
                            </span>
                        )}
                        <span className="px-2 py-1 bg-bg-elevated rounded">
                            Processed in {result.metadata.processingTimeMs}ms
                        </span>
                    </div>
                )}
            </div>

            {/* Issues */}
            {qualityReport.issues.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300">Data Issues</h4>
                    <div className="space-y-2">
                        {qualityReport.issues.slice(0, 5).map((issue, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-3 p-3 rounded-lg ${
                                    issue.severity === 'high' ? 'bg-red-500/10 border border-red-500/20' :
                                    issue.severity === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                    'bg-blue-500/10 border border-blue-500/20'
                                }`}
                            >
                                {issue.severity === 'high' ? (
                                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                ) : issue.severity === 'medium' ? (
                                    <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${
                                        issue.severity === 'high' ? 'text-red-400' :
                                        issue.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                                    }`}>
                                        {issue.column}
                                    </p>
                                    <p className="text-xs text-zinc-400">{issue.message}</p>
                                </div>
                            </div>
                        ))}
                        {qualityReport.issues.length > 5 && (
                            <p className="text-xs text-zinc-500 text-center">
                                +{qualityReport.issues.length - 5} more issues
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Warnings from import */}
            {result.warnings.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300">Import Notes</h4>
                    <div className="space-y-1">
                        {result.warnings.map((warning, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-yellow-500">
                                <Info className="w-4 h-4" />
                                {warning}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Column Statistics */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">Column Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {qualityReport.columns.slice(0, 8).map((col) => (
                        <div
                            key={col.name}
                            className="bg-bg-elevated rounded-lg p-3 border border-white/[0.06]"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-white truncate" title={col.name}>
                                    {col.name}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary">
                                    {col.type}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-zinc-500">Unique: </span>
                                    <span className="text-zinc-300">{col.uniqueCount.toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Null: </span>
                                    <span className={col.nullPercentage > 20 ? 'text-yellow-500' : 'text-zinc-300'}>
                                        {col.nullPercentage.toFixed(1)}%
                                    </span>
                                </div>
                                {col.type === 'number' && col.min !== undefined && (
                                    <>
                                        <div>
                                            <span className="text-zinc-500">Min: </span>
                                            <span className="text-zinc-300">{col.min.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">Max: </span>
                                            <span className="text-zinc-300">{col.max?.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            {col.sampleValues.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                                    <span className="text-xs text-zinc-500">Sample: </span>
                                    <span className="text-xs text-zinc-400 truncate">
                                        {col.sampleValues.slice(0, 3).map(v => String(v)).join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {qualityReport.columns.length > 8 && (
                    <p className="text-xs text-zinc-500 text-center">
                        +{qualityReport.columns.length - 8} more columns
                    </p>
                )}
            </div>

            {/* Data Table Preview */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">
                    Data Preview (first {previewData.length} rows)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-bg-elevated">
                                {result.columns.slice(0, 8).map((col) => (
                                    <th
                                        key={col}
                                        className="px-4 py-2 text-left text-zinc-400 font-medium truncate max-w-[150px]"
                                        title={col}
                                    >
                                        {col}
                                    </th>
                                ))}
                                {result.columns.length > 8 && (
                                    <th className="px-4 py-2 text-left text-zinc-500 font-normal">
                                        +{result.columns.length - 8} more
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, i) => (
                                <tr
                                    key={i}
                                    className="border-t border-white/[0.06] hover:bg-bg-card-hover"
                                >
                                    {result.columns.slice(0, 8).map((col) => (
                                        <td
                                            key={col}
                                            className="px-4 py-2 text-zinc-300 truncate max-w-[150px]"
                                            title={String(row[col] ?? '')}
                                        >
                                            {row[col] === null || row[col] === undefined ? (
                                                <span className="text-zinc-600 italic">null</span>
                                            ) : (
                                                String(row[col])
                                            )}
                                        </td>
                                    ))}
                                    {result.columns.length > 8 && (
                                        <td className="px-4 py-2 text-zinc-600">...</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DataPreview;
