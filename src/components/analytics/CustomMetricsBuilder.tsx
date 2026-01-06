/**
 * Custom Metrics Builder - Obsidian Analytics Design
 *
 * Premium KPI builder with:
 * - Glassmorphism containers
 * - Emerald accent colors
 * - Framer Motion animations
 * - Animated metric cards
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    X,
    TrendingUp,
    Sparkles,
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

const editorVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
        opacity: 0,
        height: 0,
        transition: { duration: 0.2 },
    },
};

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
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div
                variants={itemVariants}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                        <Calculator className="w-6 h-6 text-[#DA7756]" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">Custom Metrics</h3>
                        <p className="text-sm text-slate-400">Create and manage your own KPIs</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#DA7756]/20 hover:bg-[#DA7756]/30 border border-[#DA7756]/30 hover:border-[#DA7756]/40 text-[#DA7756] rounded-xl text-sm font-medium transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Create Metric
                </motion.button>
            </motion.div>

            {/* Metric Editor */}
            <AnimatePresence>
                {(isCreating || editingMetric) && (
                    <motion.div
                        variants={editorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <MetricEditor
                            metric={editingMetric}
                            onSave={handleSave}
                            onCancel={() => {
                                setIsCreating(false);
                                setEditingMetric(null);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metrics List */}
            <motion.div
                variants={itemVariants}
                className="bg-slate-900  rounded-2xl border border-slate-700 overflow-hidden"
            >
                {/* List Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-[#DA7756]" />
                        <h4 className="font-medium text-white">Your Metrics</h4>
                        <span className="px-2 py-0.5 bg-white/[0.06] rounded-full text-xs text-slate-400">
                            {metrics.length}
                        </span>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="divide-y divide-white/[0.06]">
                    <AnimatePresence>
                        {metrics.map((metric, index) => (
                            <motion.div
                                key={metric.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <MetricCard
                                    metric={metric}
                                    onEdit={() => setEditingMetric(metric)}
                                    onDelete={() => handleDelete(metric.id)}
                                    onDuplicate={() => handleDuplicate(metric)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {metrics.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-6 py-16 text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-slate-800 flex items-center justify-center">
                                <Calculator className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-slate-400">No custom metrics yet.</p>
                            <p className="text-sm text-slate-500 mt-1">Create your first one to get started!</p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
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
    const formatConfig = {
        number: { icon: Hash, color: 'text-[#8F8B82]', bg: 'bg-[#8F8B82]/10' },
        percent: { icon: Percent, color: 'text-[#C15F3C]', bg: 'bg-[#C15F3C]/10' },
        currency: { icon: DollarSign, color: 'text-[#DA7756]', bg: 'bg-[#DA7756]/10' },
        duration: { icon: Clock, color: 'text-[#E5A84B]', bg: 'bg-[#E5A84B]/10' },
    }[metric.format];

    const Icon = formatConfig.icon;

    // Mock current value
    const mockValue = useMemo(() => {
        switch (metric.format) {
            case 'currency': return `$${(Math.random() * 10).toFixed(metric.decimals)}`;
            case 'percent': return `${(Math.random() * 100).toFixed(metric.decimals)}%`;
            case 'duration': return `${Math.floor(Math.random() * 60)}m`;
            default: return (Math.random() * 1000).toFixed(metric.decimals);
        }
    }, [metric.format, metric.decimals]);

    const changePercent = (Math.random() * 20 - 5).toFixed(1);
    const isPositive = parseFloat(changePercent) >= 0;

    return (
        <motion.div
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            className="flex items-center gap-4 px-6 py-4 transition-colors"
        >
            {/* Format Icon */}
            <div className={`w-10 h-10 rounded-xl ${formatConfig.bg} border border-slate-800 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${formatConfig.color}`} />
            </div>

            {/* Metric Info */}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-white">{metric.name}</div>
                <div className="text-sm text-slate-400 truncate">{metric.description}</div>
            </div>

            {/* Value & Change */}
            <div className="text-right flex-shrink-0 mr-4">
                <div className="font-semibold text-white">{mockValue}</div>
                <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-[#DA7756]' : 'text-[#E25C5C]'}`}>
                    <TrendingUp className={`w-3 h-3 ${!isPositive && 'rotate-180'}`} />
                    {isPositive ? '+' : ''}{changePercent}%
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onEdit}
                    className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors group"
                >
                    <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onDuplicate}
                    className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors group"
                >
                    <Copy className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onDelete}
                    className="p-2 hover:bg-[#E25C5C]/10 rounded-lg transition-colors group"
                >
                    <Trash2 className="w-4 h-4 text-slate-500 group-hover:text-[#E25C5C] transition-colors" />
                </motion.button>
            </div>
        </motion.div>
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
        <div className="bg-slate-900  rounded-2xl border border-slate-700 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                        {metric ? <Edit3 className="w-5 h-5 text-[#DA7756]" /> : <Plus className="w-5 h-5 text-[#DA7756]" />}
                    </div>
                    <h4 className="font-semibold text-white">
                        {metric ? 'Edit Metric' : 'Create New Metric'}
                    </h4>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onCancel}
                    className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </motion.button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 mb-4 bg-[#E25C5C]/10 border border-[#E25C5C]/20 rounded-xl text-sm text-[#E25C5C]"
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-5">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Metric Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        placeholder="e.g., ARPDAU"
                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Description
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does this metric measure?"
                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                    />
                </div>

                {/* Formula */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Formula
                    </label>
                    <div className="flex items-center gap-3">
                        <select
                            value={numerator}
                            onChange={(e) => { setNumerator(e.target.value); setError(''); }}
                            className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50"
                        >
                            <option value="" className="bg-slate-900">Select metric...</option>
                            {BASE_METRICS.map(m => (
                                <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>
                            ))}
                        </select>
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-slate-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#DA7756] font-semibold">÷</span>
                        </div>
                        <select
                            value={denominator}
                            onChange={(e) => setDenominator(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50"
                        >
                            <option value="" className="bg-slate-900">(optional)</option>
                            {BASE_METRICS.map(m => (
                                <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Format Options */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Format
                        </label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as MetricFormat)}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50"
                        >
                            <option value="number" className="bg-slate-900">Number</option>
                            <option value="percent" className="bg-slate-900">Percentage</option>
                            <option value="currency" className="bg-slate-900">Currency</option>
                            <option value="duration" className="bg-slate-900">Duration</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Decimal Places
                        </label>
                        <select
                            value={decimals}
                            onChange={(e) => setDecimals(parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50"
                        >
                            <option value="0" className="bg-slate-900">0</option>
                            <option value="1" className="bg-slate-900">1</option>
                            <option value="2" className="bg-slate-900">2</option>
                            <option value="3" className="bg-slate-900">3</option>
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCancel}
                        className="px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#DA7756]/20 hover:bg-[#DA7756]/30 border border-[#DA7756]/30 hover:border-[#DA7756]/40 text-[#DA7756] rounded-xl text-sm font-medium transition-all"
                    >
                        <Save className="w-4 h-4" />
                        Save Metric
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

export default CustomMetricsBuilder;
