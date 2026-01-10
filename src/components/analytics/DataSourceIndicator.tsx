/**
 * DataSourceIndicator Component
 *
 * Shows users what data source a chart is using with:
 * - Visual indicator badge
 * - Tooltip with details
 * - Column names used for calculations
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Database, FileSpreadsheet, AlertCircle, Info } from 'lucide-react';

export type DataSourceType = 'uploaded' | 'calculated' | 'demo' | 'unavailable';

interface DataSourceIndicatorProps {
    sourceType: DataSourceType;
    columns?: string[];
    tableName?: string;
    rowCount?: number;
    className?: string;
}

const SOURCE_CONFIG: Record<DataSourceType, {
    label: string;
    description: string;
    icon: React.ElementType;
    bgColor: string;
    textColor: string;
    borderColor: string;
}> = {
    uploaded: {
        label: 'Your Data',
        description: 'Calculated from your uploaded dataset',
        icon: FileSpreadsheet,
        bgColor: 'bg-[#DA7756]/10',
        textColor: 'text-[#DA7756]',
        borderColor: 'border-[#DA7756]/20',
    },
    calculated: {
        label: 'Calculated',
        description: 'Derived from your data using statistical methods',
        icon: Database,
        bgColor: 'bg-[#8F8B82]/10',
        textColor: 'text-[#8F8B82]',
        borderColor: 'border-[#8F8B82]/20',
    },
    demo: {
        label: 'Demo Data',
        description: 'Sample data for demonstration purposes',
        icon: Info,
        bgColor: 'bg-[#E5A84B]/10',
        textColor: 'text-[#E5A84B]',
        borderColor: 'border-[#E5A84B]/20',
    },
    unavailable: {
        label: 'No Data',
        description: 'Required columns not found in dataset',
        icon: AlertCircle,
        bgColor: 'bg-[#E25C5C]/10',
        textColor: 'text-[#E25C5C]',
        borderColor: 'border-[#E25C5C]/20',
    },
};

export const DataSourceIndicator = memo(function DataSourceIndicator({
    sourceType,
    columns,
    tableName,
    rowCount,
    className = '',
}: DataSourceIndicatorProps) {
    const config = SOURCE_CONFIG[sourceType];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`group relative inline-flex ${className}`}
        >
            {/* Badge */}
            <div
                className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                    ${config.bgColor} ${config.textColor} border ${config.borderColor}
                    cursor-help transition-all
                    hover:brightness-110
                `}
            >
                <Icon className="w-3 h-3" />
                <span>{config.label}</span>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl p-3">
                    <p className="text-sm text-white font-medium mb-1">{config.description}</p>

                    {columns && columns.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Columns used:</p>
                            <div className="flex flex-wrap gap-1">
                                {columns.map((col, idx) => (
                                    <span
                                        key={idx}
                                        className="px-1.5 py-0.5 text-xs bg-white/[0.05] rounded text-slate-300"
                                    >
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {tableName && (
                        <p className="text-xs text-slate-500 mt-2">
                            Source: <span className="text-slate-400">{tableName}</span>
                        </p>
                    )}

                    {rowCount !== undefined && (
                        <p className="text-xs text-slate-500">
                            Rows: <span className="text-slate-400">{rowCount.toLocaleString()}</span>
                        </p>
                    )}

                    {/* Arrow */}
                    <div className="absolute bottom-0 left-4 transform translate-y-full -mt-px">
                        <div className="border-8 border-transparent border-t-slate-700" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default DataSourceIndicator;
