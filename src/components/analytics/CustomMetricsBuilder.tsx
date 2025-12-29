/**
 * Custom Metrics Builder
 * Create and manage custom KPIs
 * Phase 9: Advanced Features
 */

import { useState, useMemo } from 'react';
import {
    Calculator,
    Plus,
    Save,
    Trash2,
    Edit3,
    Copy,
    DollarSign,
    Clock,
    Percent,
    Hash,
    AlertCircle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type MetricFormat = 'number' | 'percent' | 'currency' | 'duration';
export type AggregationType = 'sum' | 'avg' | 'count' | 'unique' | 'min' | 'max';
export type FormulaOperator = '+' | '-' | '*' | '/';

export interface BaseMetric {
    id: string;
    name: string;
    type: 'base';
}

export interface CustomMetric {
    id: string;
    name: string;
    description: string;
    formula: {
        type: 'simple' | 'ratio' | 'calculated';
        baseMetrics: string[];
        operators?: FormulaOperator[];
        expression?: string;
    };
    format: MetricFormat;
    decimals: number;
    aggregation: AggregationType;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Base Metrics (Available for formulas)
// ============================================================================

const BASE_METRICS: BaseMetric[] = [
    { id: 'dau', name: 'Daily Active Users', type: 'base' },
    { id: 'mau', name: 'Monthly Active Users', type: 'base' },
    { id: 'new_users', name: 'New Users', type: 'base' },
    { id: 'revenue', name: 'Revenue', type: 'base' },
    { id: 'purchases', name: 'Purchase Count', type: 'base' },
    { id: 'paying_users', name: 'Paying Users', type: 'base' },
    { id: 'sessions', name: 'Sessions', type: 'base' },
    { id: 'session_duration', name: 'Session Duration', type: 'base' },
    { id: 'ad_impressions', name: 'Ad Impressions', type: 'base' },
    { id: 'ad_revenue', name: 'Ad Revenue', type: 'base' },
    { id: 'level_completions', name: 'Level Completions', type: 'base' },
    { id: 'level_failures', name: 'Level Failures', type: 'base' },
];

// ============================================================================
// Sample Custom Metrics
// ============================================================================

const SAMPLE_METRICS: CustomMetric[] = [
    {
        id: 'arpdau',
        name: 'ARPDAU',
        description: 'Average Revenue Per Daily Active User',
        formula: { type: 'ratio', baseMetrics: ['revenue', 'dau'] },
        format: 'currency',
        decimals: 2,
        aggregation: 'avg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'conversion_rate',
        name: 'Payer Conversion Rate',
        description: 'Percentage of users who make a purchase',
        formula: { type: 'ratio', baseMetrics: ['paying_users', 'dau'] },
        format: 'percent',
        decimals: 2,
        aggregation: 'avg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'level_success_rate',
        name: 'Level Success Rate',
        description: 'Percentage of level attempts that succeed',
        formula: {
            type: 'calculated',
            baseMetrics: ['level_completions', 'level_failures'],
            expression: 'level_completions / (level_completions + level_failures)',
        },
        format: 'percent',
        decimals: 1,
        aggregation: 'avg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// ============================================================================
// Custom Metrics Builder Component
// ============================================================================

export function CustomMetricsBuilder() {
    const [metrics, setMetrics] = useState<CustomMetric[]>(SAMPLE_METRICS);
    const [isCreating, setIsCreating] = useState(false);
    const [editingMetric, setEditingMetric] = useState<CustomMetric | null>(null);

    const handleSave = (metric: CustomMetric) => {
        if (editingMetric) {
            setMetrics(prev => prev.map(m => m.id === metric.id ? metric : m));
        } else {
            setMetrics(prev => [...prev, metric]);
        }
        setIsCreating(false);
        setEditingMetric(null);
    };

    const handleDelete = (id: string) => {
        setMetrics(prev => prev.filter(m => m.id !== id));
    };

    const handleDuplicate = (metric: CustomMetric) => {
        const duplicate: CustomMetric = {
            ...metric,
            id: `custom_${Date.now()}`,
            name: `${metric.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setMetrics(prev => [...prev, duplicate]);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-th-accent-primary/20 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-th-accent-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-th-text-primary">Custom Metrics</h3>
                        <p className="text-sm text-th-text-secondary">Create and manage your own KPIs</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-th-accent-primary text-white rounded-lg text-sm font-medium hover:bg-th-accent-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Metric
                </button>
            </div>

            {/* Metric Editor */}
            {(isCreating || editingMetric) && (
                <MetricEditor
                    metric={editingMetric}
                    onSave={handleSave}
                    onCancel={() => {
                        setIsCreating(false);
                        setEditingMetric(null);
                    }}
                />
            )}

            {/* Metrics List */}
            <div className="bg-th-bg-card rounded-xl border border-th-border overflow-hidden">
                <div className="px-6 py-4 border-b border-th-border">
                    <h4 className="font-medium text-th-text-primary">Your Metrics ({metrics.length})</h4>
                </div>
                <div className="divide-y divide-th-border">
                    {metrics.map((metric) => (
                        <MetricCard
                            key={metric.id}
                            metric={metric}
                            onEdit={() => setEditingMetric(metric)}
                            onDelete={() => handleDelete(metric.id)}
                            onDuplicate={() => handleDuplicate(metric)}
                        />
                    ))}
                    {metrics.length === 0 && (
                        <div className="px-6 py-12 text-center text-th-text-secondary">
                            No custom metrics yet. Create your first one!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Metric Card
// ============================================================================

function MetricCard({
    metric,
    onEdit,
    onDelete,
    onDuplicate,
}: {
    metric: CustomMetric;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}) {
    const formatIcon = {
        number: Hash,
        percent: Percent,
        currency: DollarSign,
        duration: Clock,
    }[metric.format];

    const Icon = formatIcon;

    // Mock current value
    const mockValue = useMemo(() => {
        switch (metric.format) {
            case 'currency': return `$${(Math.random() * 10).toFixed(metric.decimals)}`;
            case 'percent': return `${(Math.random() * 100).toFixed(metric.decimals)}%`;
            case 'duration': return `${Math.floor(Math.random() * 60)}m`;
            default: return (Math.random() * 1000).toFixed(metric.decimals);
        }
    }, [metric.format, metric.decimals]);

    return (
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-th-bg-elevated transition-colors">
            <div className="w-10 h-10 rounded-lg bg-th-bg-elevated flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-th-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-th-text-primary">{metric.name}</div>
                <div className="text-sm text-th-text-secondary truncate">{metric.description}</div>
            </div>
            <div className="text-right flex-shrink-0">
                <div className="font-semibold text-th-text-primary">{mockValue}</div>
                <div className="text-xs text-green-400">+5.2%</div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={onEdit}
                    className="p-2 hover:bg-th-bg-card rounded-lg transition-colors"
                >
                    <Edit3 className="w-4 h-4 text-th-text-secondary" />
                </button>
                <button
                    onClick={onDuplicate}
                    className="p-2 hover:bg-th-bg-card rounded-lg transition-colors"
                >
                    <Copy className="w-4 h-4 text-th-text-secondary" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 hover:bg-th-bg-card rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4 text-th-text-secondary hover:text-red-400" />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Metric Editor
// ============================================================================

function MetricEditor({
    metric,
    onSave,
    onCancel,
}: {
    metric: CustomMetric | null;
    onSave: (metric: CustomMetric) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(metric?.name || '');
    const [description, setDescription] = useState(metric?.description || '');
    const [format, setFormat] = useState<MetricFormat>(metric?.format || 'number');
    const [decimals, setDecimals] = useState(metric?.decimals || 2);
    const [numerator, setNumerator] = useState(metric?.formula.baseMetrics[0] || '');
    const [denominator, setDenominator] = useState(metric?.formula.baseMetrics[1] || '');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        if (!numerator) {
            setError('Please select a numerator metric');
            return;
        }

        const newMetric: CustomMetric = {
            id: metric?.id || `custom_${Date.now()}`,
            name: name.trim(),
            description: description.trim(),
            formula: {
                type: denominator ? 'ratio' : 'simple',
                baseMetrics: denominator ? [numerator, denominator] : [numerator],
            },
            format,
            decimals,
            aggregation: 'avg',
            createdAt: metric?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        onSave(newMetric);
    };

    return (
        <div className="bg-th-bg-card rounded-xl border border-th-border p-6">
            <h4 className="font-semibold text-th-text-primary mb-4">
                {metric ? 'Edit Metric' : 'Create New Metric'}
            </h4>

            {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-th-text-primary mb-1">
                        Metric Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        placeholder="e.g., ARPDAU"
                        className="w-full px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-primary/50"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-th-text-primary mb-1">
                        Description
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does this metric measure?"
                        className="w-full px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-primary/50"
                    />
                </div>

                {/* Formula */}
                <div>
                    <label className="block text-sm font-medium text-th-text-primary mb-2">
                        Formula
                    </label>
                    <div className="flex items-center gap-3">
                        <select
                            value={numerator}
                            onChange={(e) => { setNumerator(e.target.value); setError(''); }}
                            className="flex-1 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary focus:outline-none"
                        >
                            <option value="">Select metric...</option>
                            {BASE_METRICS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <span className="text-th-text-secondary font-medium">÷</span>
                        <select
                            value={denominator}
                            onChange={(e) => setDenominator(e.target.value)}
                            className="flex-1 px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary focus:outline-none"
                        >
                            <option value="">(optional)</option>
                            {BASE_METRICS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Format Options */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-th-text-primary mb-1">
                            Format
                        </label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as MetricFormat)}
                            className="w-full px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary focus:outline-none"
                        >
                            <option value="number">Number</option>
                            <option value="percent">Percentage</option>
                            <option value="currency">Currency</option>
                            <option value="duration">Duration</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-th-text-primary mb-1">
                            Decimal Places
                        </label>
                        <select
                            value={decimals}
                            onChange={(e) => setDecimals(parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary focus:outline-none"
                        >
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-th-border">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-th-text-secondary hover:text-th-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-th-accent-primary text-white rounded-lg text-sm font-medium hover:bg-th-accent-primary/90 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save Metric
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CustomMetricsBuilder;
