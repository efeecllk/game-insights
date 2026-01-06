/**
 * Cohort Builder - Obsidian Analytics Design
 *
 * Visual cohort creation with:
 * - Glassmorphism containers
 * - Orange accent colors
 * - Framer Motion animations
 * - Animated rule builder
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    Trash2,
    Save,
    Play,
    Copy,
    Calendar,
    DollarSign,
    Gamepad2,
    Clock,
    Globe,
    Smartphone,
    ChevronDown,
    X,
    Sparkles,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type RuleOperator =
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'contains'
    | 'not_contains'
    | 'in'
    | 'not_in';

export type RuleProperty =
    | 'install_date'
    | 'last_active'
    | 'total_revenue'
    | 'purchase_count'
    | 'session_count'
    | 'level'
    | 'country'
    | 'platform'
    | 'app_version'
    | 'days_since_install'
    | 'days_since_last_active';

export interface CohortRule {
    id: string;
    property: RuleProperty;
    operator: RuleOperator;
    value: string | number | string[];
    secondValue?: string | number;
}

export interface RuleGroup {
    id: string;
    logic: 'AND' | 'OR';
    rules: CohortRule[];
}

export interface Cohort {
    id: string;
    name: string;
    description: string;
    groups: RuleGroup[];
    groupLogic: 'AND' | 'OR';
    estimatedSize?: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Property Definitions
// ============================================================================

const PROPERTY_CONFIG: Record<RuleProperty, {
    label: string;
    icon: typeof Users;
    type: 'date' | 'number' | 'string' | 'select';
    operators: RuleOperator[];
    options?: string[];
}> = {
    install_date: {
        label: 'Install Date',
        icon: Calendar,
        type: 'date',
        operators: ['equals', 'between', 'greater_than', 'less_than'],
    },
    last_active: {
        label: 'Last Active',
        icon: Clock,
        type: 'date',
        operators: ['equals', 'between', 'greater_than', 'less_than'],
    },
    days_since_install: {
        label: 'Days Since Install',
        icon: Calendar,
        type: 'number',
        operators: ['equals', 'greater_than', 'less_than', 'between'],
    },
    days_since_last_active: {
        label: 'Days Inactive',
        icon: Clock,
        type: 'number',
        operators: ['equals', 'greater_than', 'less_than', 'between'],
    },
    total_revenue: {
        label: 'Total Revenue',
        icon: DollarSign,
        type: 'number',
        operators: ['equals', 'greater_than', 'less_than', 'between'],
    },
    purchase_count: {
        label: 'Purchase Count',
        icon: DollarSign,
        type: 'number',
        operators: ['equals', 'greater_than', 'less_than', 'between'],
    },
    session_count: {
        label: 'Session Count',
        icon: Gamepad2,
        type: 'number',
        operators: ['equals', 'greater_than', 'less_than', 'between'],
    },
    level: {
        label: 'Player Level',
        icon: Gamepad2,
        type: 'number',
        operators: ['equals', 'greater_than', 'less_than', 'between'],
    },
    country: {
        label: 'Country',
        icon: Globe,
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: ['US', 'GB', 'DE', 'JP', 'KR', 'BR', 'FR', 'CA', 'AU', 'IN'],
    },
    platform: {
        label: 'Platform',
        icon: Smartphone,
        type: 'select',
        operators: ['equals', 'not_equals', 'in'],
        options: ['iOS', 'Android', 'Web'],
    },
    app_version: {
        label: 'App Version',
        icon: Smartphone,
        type: 'string',
        operators: ['equals', 'not_equals', 'contains'],
    },
};

const OPERATOR_LABELS: Record<RuleOperator, string> = {
    equals: 'equals',
    not_equals: 'does not equal',
    greater_than: 'is greater than',
    less_than: 'is less than',
    between: 'is between',
    contains: 'contains',
    not_contains: 'does not contain',
    in: 'is one of',
    not_in: 'is not one of',
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function createEmptyRule(): CohortRule {
    return {
        id: generateId(),
        property: 'days_since_install',
        operator: 'less_than',
        value: 7,
    };
}

function createEmptyGroup(): RuleGroup {
    return {
        id: generateId(),
        logic: 'AND',
        rules: [createEmptyRule()],
    };
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

const groupVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 },
    },
};

const ruleVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: { duration: 0.2 },
    },
};

// ============================================================================
// Cohort Builder Component
// ============================================================================

interface CohortBuilderProps {
    initialCohort?: Cohort;
    onSave?: (cohort: Cohort) => void;
    onCancel?: () => void;
}

export function CohortBuilder({ initialCohort, onSave, onCancel }: CohortBuilderProps) {
    const [name, setName] = useState(initialCohort?.name || '');
    const [description, setDescription] = useState(initialCohort?.description || '');
    const [groups, setGroups] = useState<RuleGroup[]>(
        initialCohort?.groups || [createEmptyGroup()]
    );
    const [groupLogic, setGroupLogic] = useState<'AND' | 'OR'>(initialCohort?.groupLogic || 'AND');
    const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const addGroup = useCallback(() => {
        setGroups(prev => [...prev, createEmptyGroup()]);
    }, []);

    const removeGroup = useCallback((groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    }, []);

    const updateGroupLogic = useCallback((groupId: string, logic: 'AND' | 'OR') => {
        setGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, logic } : g
        ));
    }, []);

    const addRule = useCallback((groupId: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, rules: [...g.rules, createEmptyRule()] }
                : g
        ));
    }, []);

    const removeRule = useCallback((groupId: string, ruleId: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, rules: g.rules.filter(r => r.id !== ruleId) }
                : g
        ));
    }, []);

    const updateRule = useCallback((groupId: string, ruleId: string, updates: Partial<CohortRule>) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? {
                    ...g,
                    rules: g.rules.map(r =>
                        r.id === ruleId ? { ...r, ...updates } : r
                    )
                }
                : g
        ));
    }, []);

    const calculateSize = useCallback(async () => {
        setIsCalculating(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEstimatedSize(Math.floor(Math.random() * 50000) + 1000);
        setIsCalculating(false);
    }, []);

    const handleSave = useCallback(() => {
        if (!name.trim()) return;

        const cohort: Cohort = {
            id: initialCohort?.id || generateId(),
            name: name.trim(),
            description: description.trim(),
            groups,
            groupLogic,
            estimatedSize: estimatedSize || undefined,
            createdAt: initialCohort?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        onSave?.(cohort);
    }, [name, description, groups, groupLogic, estimatedSize, initialCohort, onSave]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-slate-900  rounded-2xl border border-slate-700 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-[#DA7756]" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-white text-lg">Cohort Builder</h2>
                        <p className="text-sm text-slate-400">Define user segments with rules</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {onCancel && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#DA7756]/20 hover:bg-[#DA7756]/30 border border-[#DA7756]/30 hover:border-[#DA7756]/40 text-[#DA7756] rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Save className="w-4 h-4" />
                        Save Cohort
                    </motion.button>
                </div>
            </div>

            {/* Cohort Info */}
            <div className="px-6 py-5 border-b border-slate-800 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Cohort Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., High-Value Players"
                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Description (optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe this cohort..."
                        rows={2}
                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 resize-none transition-all"
                    />
                </div>
            </div>

            {/* Rule Groups */}
            <div className="px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-[#DA7756]" />
                        <h3 className="font-medium text-white">Filter Rules</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Match</span>
                        <select
                            value={groupLogic}
                            onChange={(e) => setGroupLogic(e.target.value as 'AND' | 'OR')}
                            className="px-3 py-1.5 bg-white/[0.03] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
                        >
                            <option value="AND" className="bg-slate-900">ALL</option>
                            <option value="OR" className="bg-slate-900">ANY</option>
                        </select>
                        <span className="text-slate-400">of the following groups</span>
                    </div>
                </div>

                <AnimatePresence>
                    {groups.map((group, groupIndex) => (
                        <motion.div
                            key={group.id}
                            variants={groupVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {groupIndex > 0 && (
                                <div className="flex items-center justify-center py-3">
                                    <span className="px-4 py-1 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-full text-xs font-medium text-[#DA7756]">
                                        {groupLogic}
                                    </span>
                                </div>
                            )}
                            <RuleGroupEditor
                                group={group}
                                canDelete={groups.length > 1}
                                onUpdateLogic={(logic) => updateGroupLogic(group.id, logic)}
                                onAddRule={() => addRule(group.id)}
                                onRemoveRule={(ruleId) => removeRule(group.id, ruleId)}
                                onUpdateRule={(ruleId, updates) => updateRule(group.id, ruleId, updates)}
                                onDelete={() => removeGroup(group.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.01, borderColor: 'rgba(218, 119, 86, 0.3)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={addGroup}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-700 rounded-xl text-sm text-slate-400 hover:text-[#DA7756] transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Group
                </motion.button>
            </div>

            {/* Estimate Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={calculateSize}
                        disabled={isCalculating}
                        className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-slate-700 rounded-xl text-sm text-white disabled:opacity-50 transition-all"
                    >
                        <Play className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
                        {isCalculating ? 'Calculating...' : 'Calculate Size'}
                    </motion.button>
                    <AnimatePresence>
                        {estimatedSize !== null && !isCalculating && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="text-sm"
                            >
                                <span className="text-slate-400">Estimated size: </span>
                                <span className="font-semibold text-[#DA7756]">
                                    {estimatedSize.toLocaleString()} users
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <Copy className="w-4 h-4" />
                    Duplicate
                </motion.button>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Rule Group Editor
// ============================================================================

interface RuleGroupEditorProps {
    group: RuleGroup;
    canDelete: boolean;
    onUpdateLogic: (logic: 'AND' | 'OR') => void;
    onAddRule: () => void;
    onRemoveRule: (ruleId: string) => void;
    onUpdateRule: (ruleId: string, updates: Partial<CohortRule>) => void;
    onDelete: () => void;
}

function RuleGroupEditor({
    group,
    canDelete,
    onUpdateLogic,
    onAddRule,
    onRemoveRule,
    onUpdateRule,
    onDelete,
}: RuleGroupEditorProps) {
    return (
        <div className="border border-slate-700 rounded-xl overflow-hidden bg-white/[0.01]">
            {/* Group Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-slate-800">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Match</span>
                    <select
                        value={group.logic}
                        onChange={(e) => onUpdateLogic(e.target.value as 'AND' | 'OR')}
                        className="px-2 py-1 bg-white/[0.03] border border-slate-700 rounded-lg text-white focus:outline-none"
                    >
                        <option value="AND" className="bg-slate-900">ALL</option>
                        <option value="OR" className="bg-slate-900">ANY</option>
                    </select>
                    <span className="text-slate-400">of the following</span>
                </div>
                {canDelete && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onDelete}
                        className="p-1.5 hover:bg-[#E25C5C]/10 rounded-lg text-slate-400 hover:text-[#E25C5C] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </motion.button>
                )}
            </div>

            {/* Rules */}
            <div className="p-4 space-y-2">
                <AnimatePresence>
                    {group.rules.map((rule, index) => (
                        <motion.div
                            key={rule.id}
                            variants={ruleVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {index > 0 && (
                                <div className="flex items-center justify-center py-1">
                                    <span className="text-xs text-slate-500 font-medium">{group.logic}</span>
                                </div>
                            )}
                            <RuleEditor
                                rule={rule}
                                canDelete={group.rules.length > 1}
                                onUpdate={(updates) => onUpdateRule(rule.id, updates)}
                                onDelete={() => onRemoveRule(rule.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(218, 119, 86, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddRule}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#DA7756] rounded-lg transition-all"
                >
                    <Plus className="w-3 h-3" />
                    Add Rule
                </motion.button>
            </div>
        </div>
    );
}

// ============================================================================
// Rule Editor
// ============================================================================

interface RuleEditorProps {
    rule: CohortRule;
    canDelete: boolean;
    onUpdate: (updates: Partial<CohortRule>) => void;
    onDelete: () => void;
}

function RuleEditor({ rule, canDelete, onUpdate, onDelete }: RuleEditorProps) {
    const config = PROPERTY_CONFIG[rule.property];
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2 p-3 bg-white/[0.02] border border-slate-800 rounded-xl">
            {/* Property */}
            <div className="relative">
                <select
                    value={rule.property}
                    onChange={(e) => {
                        const prop = e.target.value as RuleProperty;
                        const newConfig = PROPERTY_CONFIG[prop];
                        onUpdate({
                            property: prop,
                            operator: newConfig.operators[0],
                            value: newConfig.type === 'number' ? 0 : '',
                        });
                    }}
                    className="pl-8 pr-8 py-2 bg-white/[0.03] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 appearance-none cursor-pointer"
                >
                    {Object.entries(PROPERTY_CONFIG).map(([key, { label }]) => (
                        <option key={key} value={key} className="bg-slate-900">{label}</option>
                    ))}
                </select>
                <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Operator */}
            <select
                value={rule.operator}
                onChange={(e) => onUpdate({ operator: e.target.value as RuleOperator })}
                className="px-3 py-2 bg-white/[0.03] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
            >
                {config.operators.map(op => (
                    <option key={op} value={op} className="bg-slate-900">{OPERATOR_LABELS[op]}</option>
                ))}
            </select>

            {/* Value */}
            {config.type === 'select' && config.options ? (
                <select
                    value={rule.value as string}
                    onChange={(e) => onUpdate({ value: e.target.value })}
                    className="px-3 py-2 bg-white/[0.03] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
                >
                    {config.options.map(opt => (
                        <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={config.type === 'number' ? 'number' : config.type === 'date' ? 'date' : 'text'}
                    value={rule.value as string | number}
                    onChange={(e) => onUpdate({
                        value: config.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                    })}
                    className="w-24 px-3 py-2 bg-white/[0.03] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
                />
            )}

            {/* Between second value */}
            {rule.operator === 'between' && (
                <>
                    <span className="text-xs text-slate-400">and</span>
                    <input
                        type={config.type === 'number' ? 'number' : config.type === 'date' ? 'date' : 'text'}
                        value={rule.secondValue || ''}
                        onChange={(e) => onUpdate({
                            secondValue: config.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                        })}
                        className="w-24 px-3 py-2 bg-white/[0.03] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
                    />
                </>
            )}

            {/* Delete */}
            {canDelete && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onDelete}
                    className="p-1.5 hover:bg-[#E25C5C]/10 rounded-lg text-slate-400 hover:text-[#E25C5C] transition-colors ml-auto"
                >
                    <Trash2 className="w-4 h-4" />
                </motion.button>
            )}
        </div>
    );
}

export default CohortBuilder;
