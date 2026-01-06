/**
 * Column Mapper Component - Obsidian Analytics Design
 *
 * Premium column mapping with:
 * - AI-detected column types
 * - Manual override options
 * - Validation indicators
 */

import { useState } from 'react';
import { Check, AlertTriangle, ChevronDown } from 'lucide-react';
import { ColumnMapping } from '../../lib/columnAnalyzer';

interface ColumnMapperProps {
    columns: ColumnMapping[];
    onUpdate: (columns: ColumnMapping[]) => void;
    onConfirm: () => void;
}

const CANONICAL_OPTIONS = [
    { value: 'user_id', label: 'User ID', role: 'identifier' },
    { value: 'session_id', label: 'Session ID', role: 'identifier' },
    { value: 'timestamp', label: 'Timestamp', role: 'timestamp' },
    { value: 'event_type', label: 'Event Type', role: 'dimension' },
    { value: 'revenue', label: 'Revenue', role: 'metric' },
    { value: 'level', label: 'Level', role: 'dimension' },
    { value: 'country', label: 'Country', role: 'dimension' },
    { value: 'platform', label: 'Platform', role: 'dimension' },
    { value: 'device_model', label: 'Device Model', role: 'dimension' },
    { value: 'app_version', label: 'App Version', role: 'dimension' },
    { value: 'custom', label: 'Custom Field', role: 'unknown' },
    { value: 'ignore', label: 'Ignore (Noise)', role: 'noise' },
];

const ROLE_COLORS: Record<string, string> = {
    identifier: 'bg-[#8F8B82]/20 text-[#8F8B82] border-[#8F8B82]/30',
    timestamp: 'bg-[#C15F3C]/20 text-[#C15F3C] border-[#C15F3C]/30',
    metric: 'bg-[#7A8B5B]/20 text-[#7A8B5B] border-[#7A8B5B]/30',
    dimension: 'bg-[#A68B5B]/20 text-[#A68B5B] border-[#A68B5B]/30',
    noise: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    unknown: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export function ColumnMapper({ columns, onUpdate, onConfirm }: ColumnMapperProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleChange = (index: number, canonical: string) => {
        const option = CANONICAL_OPTIONS.find(o => o.value === canonical);
        const updated = [...columns];
        updated[index] = {
            ...updated[index],
            canonical: canonical === 'ignore' ? '' : canonical,
            role: (option?.role || 'unknown') as ColumnMapping['role'],
            confidence: 1.0, // User confirmed
        };
        onUpdate(updated);
        setEditingIndex(null);
    };

    const highConfidence = columns.filter(c => c.confidence >= 0.8);
    const lowConfidence = columns.filter(c => c.confidence < 0.8);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Column Mapping</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        Review how we understood your data columns
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#6BBF59]">{highConfidence.length} confident</span>
                    {lowConfidence.length > 0 && (
                        <span className="text-yellow-500">{lowConfidence.length} needs review</span>
                    )}
                </div>
            </div>

            {/* Low confidence - needs review */}
            {lowConfidence.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-500 font-medium">Review Required</span>
                    </div>
                    <div className="space-y-2">
                        {lowConfidence.map((col) => {
                            const globalIndex = columns.findIndex(c => c.original === col.original);
                            return (
                                <ColumnRow
                                    key={col.original}
                                    column={col}
                                    isEditing={editingIndex === globalIndex}
                                    onEdit={() => setEditingIndex(globalIndex)}
                                    onChange={(canonical) => handleChange(globalIndex, canonical)}
                                    highlight
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* High confidence columns */}
            <div className="bg-bg-card border border-slate-800 rounded-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-[#6BBF59]" />
                    <span className="text-zinc-300 font-medium">Auto-Detected</span>
                </div>
                <div className="space-y-2">
                    {highConfidence.map((col) => {
                        const globalIndex = columns.findIndex(c => c.original === col.original);
                        return (
                            <ColumnRow
                                key={col.original}
                                column={col}
                                isEditing={editingIndex === globalIndex}
                                onEdit={() => setEditingIndex(globalIndex)}
                                onChange={(canonical) => handleChange(globalIndex, canonical)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Confirm button */}
            <button
                onClick={onConfirm}
                className="w-full py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium rounded-xl transition-colors"
            >
                Confirm & Continue
            </button>
        </div>
    );
}

function ColumnRow({
    column,
    isEditing,
    onEdit,
    onChange,
    highlight
}: {
    column: ColumnMapping;
    isEditing: boolean;
    onEdit: () => void;
    onChange: (canonical: string) => void;
    highlight?: boolean;
}) {
    return (
        <div className={`
      flex items-center justify-between p-3 rounded-xl
      ${highlight ? 'bg-yellow-500/5' : 'bg-bg-elevated/50'}
    `}>
            {/* Original name */}
            <div className="flex-1">
                <code className="text-sm text-white font-mono">{column.original}</code>
                <p className="text-xs text-zinc-500 mt-0.5">{column.reasoning}</p>
            </div>

            {/* Arrow */}
            <span className="text-zinc-600 mx-4">→</span>

            {/* Canonical mapping */}
            <div className="relative">
                {isEditing ? (
                    <select
                        autoFocus
                        onChange={(e) => onChange(e.target.value)}
                        onBlur={() => onChange(column.canonical)}
                        className="bg-bg-elevated border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary"
                        defaultValue={column.canonical}
                    >
                        {CANONICAL_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <button
                        onClick={onEdit}
                        className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm
              ${ROLE_COLORS[column.role] || ROLE_COLORS.unknown}
              hover:opacity-80 transition-opacity
            `}
                    >
                        <span>{column.canonical || 'Unmapped'}</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Confidence */}
            <div className="w-16 text-right ml-4">
                <span className={`text-xs ${column.confidence >= 0.8 ? 'text-[#6BBF59]' : 'text-yellow-500'}`}>
                    {Math.round(column.confidence * 100)}%
                </span>
            </div>
        </div>
    );
}

export default ColumnMapper;
