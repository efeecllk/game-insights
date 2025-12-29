/**
 * Cohort Builder
 * Visual cohort creation with rule builder
 * Phase 9: Advanced Features
 */

import { useState, useCallback } from 'react';
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
    secondValue?: string | number; // For "between" operator
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

    // Add a new group
    const addGroup = useCallback(() => {
        setGroups(prev => [...prev, createEmptyGroup()]);
    }, []);

    // Remove a group
    const removeGroup = useCallback((groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    }, []);

    // Update group logic
    const updateGroupLogic = useCallback((groupId: string, logic: 'AND' | 'OR') => {
        setGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, logic } : g
        ));
    }, []);

    // Add rule to group
    const addRule = useCallback((groupId: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, rules: [...g.rules, createEmptyRule()] }
                : g
        ));
    }, []);

    // Remove rule from group
    const removeRule = useCallback((groupId: string, ruleId: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, rules: g.rules.filter(r => r.id !== ruleId) }
                : g
        ));
    }, []);

    // Update rule
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

    // Calculate estimated size (mock)
    const calculateSize = useCallback(async () => {
        setIsCalculating(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEstimatedSize(Math.floor(Math.random() * 50000) + 1000);
        setIsCalculating(false);
    }, []);

    // Save cohort
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
        <div className="bg-th-bg-card rounded-xl border border-th-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-th-accent-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-th-accent-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-th-text-primary">Cohort Builder</h2>
                        <p className="text-sm text-th-text-secondary">Define user segments with rules</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-th-text-secondary hover:text-th-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-th-accent-primary text-white rounded-lg text-sm font-medium hover:bg-th-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save Cohort
                    </button>
                </div>
            </div>

            {/* Cohort Info */}
            <div className="px-6 py-4 border-b border-th-border space-y-4">
                <div>
                    <label className="block text-sm font-medium text-th-text-primary mb-1">
                        Cohort Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., High-Value Players"
                        className="w-full px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-primary/50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-th-text-primary mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe this cohort..."
                        rows={2}
                        className="w-full px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-primary/50 resize-none"
                    />
                </div>
            </div>

            {/* Rule Groups */}
            <div className="px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-th-text-primary">Filter Rules</h3>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-th-text-secondary">Match</span>
                        <select
                            value={groupLogic}
                            onChange={(e) => setGroupLogic(e.target.value as 'AND' | 'OR')}
                            className="px-2 py-1 bg-th-bg-elevated border border-th-border rounded text-th-text-primary focus:outline-none"
                        >
                            <option value="AND">ALL</option>
                            <option value="OR">ANY</option>
                        </select>
                        <span className="text-th-text-secondary">of the following groups</span>
                    </div>
                </div>

                {groups.map((group, groupIndex) => (
                    <div key={group.id}>
                        {groupIndex > 0 && (
                            <div className="flex items-center justify-center py-2">
                                <span className="px-3 py-1 bg-th-bg-elevated rounded-full text-xs font-medium text-th-text-secondary">
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
                    </div>
                ))}

                <button
                    onClick={addGroup}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-th-border rounded-xl text-sm text-th-text-secondary hover:text-th-text-primary hover:border-th-accent-primary/50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Group
                </button>
            </div>

            {/* Estimate Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-th-border bg-th-bg-elevated">
                <div className="flex items-center gap-4">
                    <button
                        onClick={calculateSize}
                        disabled={isCalculating}
                        className="flex items-center gap-2 px-4 py-2 bg-th-bg-card border border-th-border rounded-lg text-sm text-th-text-primary hover:bg-th-bg-elevated transition-colors disabled:opacity-50"
                    >
                        <Play className="w-4 h-4" />
                        {isCalculating ? 'Calculating...' : 'Calculate Size'}
                    </button>
                    {estimatedSize !== null && !isCalculating && (
                        <div className="text-sm">
                            <span className="text-th-text-secondary">Estimated size: </span>
                            <span className="font-semibold text-th-text-primary">
                                {estimatedSize.toLocaleString()} users
                            </span>
                        </div>
                    )}
                </div>
                <button
                    className="flex items-center gap-2 text-sm text-th-text-secondary hover:text-th-text-primary transition-colors"
                >
                    <Copy className="w-4 h-4" />
                    Duplicate
                </button>
            </div>
        </div>
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
        <div className="border border-th-border rounded-xl overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-th-bg-elevated border-b border-th-border">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-th-text-secondary">Match</span>
                    <select
                        value={group.logic}
                        onChange={(e) => onUpdateLogic(e.target.value as 'AND' | 'OR')}
                        className="px-2 py-1 bg-th-bg-card border border-th-border rounded text-th-text-primary focus:outline-none"
                    >
                        <option value="AND">ALL</option>
                        <option value="OR">ANY</option>
                    </select>
                    <span className="text-th-text-secondary">of the following</span>
                </div>
                {canDelete && (
                    <button
                        onClick={onDelete}
                        className="p-1 text-th-text-secondary hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Rules */}
            <div className="p-4 space-y-2">
                {group.rules.map((rule, index) => (
                    <div key={rule.id}>
                        {index > 0 && (
                            <div className="flex items-center justify-center py-1">
                                <span className="text-xs text-th-text-secondary">{group.logic}</span>
                            </div>
                        )}
                        <RuleEditor
                            rule={rule}
                            canDelete={group.rules.length > 1}
                            onUpdate={(updates) => onUpdateRule(rule.id, updates)}
                            onDelete={() => onRemoveRule(rule.id)}
                        />
                    </div>
                ))}

                <button
                    onClick={onAddRule}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-th-accent-primary hover:bg-th-accent-primary/10 rounded transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Rule
                </button>
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
        <div className="flex items-center gap-2 p-2 bg-th-bg-elevated rounded-lg">
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
                    className="pl-8 pr-8 py-1.5 bg-th-bg-card border border-th-border rounded text-sm text-th-text-primary focus:outline-none appearance-none cursor-pointer"
                >
                    {Object.entries(PROPERTY_CONFIG).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <Icon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-secondary pointer-events-none" />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-th-text-secondary pointer-events-none" />
            </div>

            {/* Operator */}
            <select
                value={rule.operator}
                onChange={(e) => onUpdate({ operator: e.target.value as RuleOperator })}
                className="px-3 py-1.5 bg-th-bg-card border border-th-border rounded text-sm text-th-text-primary focus:outline-none"
            >
                {config.operators.map(op => (
                    <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                ))}
            </select>

            {/* Value */}
            {config.type === 'select' && config.options ? (
                <select
                    value={rule.value as string}
                    onChange={(e) => onUpdate({ value: e.target.value })}
                    className="px-3 py-1.5 bg-th-bg-card border border-th-border rounded text-sm text-th-text-primary focus:outline-none"
                >
                    {config.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={config.type === 'number' ? 'number' : config.type === 'date' ? 'date' : 'text'}
                    value={rule.value as string | number}
                    onChange={(e) => onUpdate({
                        value: config.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                    })}
                    className="w-24 px-3 py-1.5 bg-th-bg-card border border-th-border rounded text-sm text-th-text-primary focus:outline-none"
                />
            )}

            {/* Between second value */}
            {rule.operator === 'between' && (
                <>
                    <span className="text-xs text-th-text-secondary">and</span>
                    <input
                        type={config.type === 'number' ? 'number' : config.type === 'date' ? 'date' : 'text'}
                        value={rule.secondValue || ''}
                        onChange={(e) => onUpdate({
                            secondValue: config.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                        })}
                        className="w-24 px-3 py-1.5 bg-th-bg-card border border-th-border rounded text-sm text-th-text-primary focus:outline-none"
                    />
                </>
            )}

            {/* Delete */}
            {canDelete && (
                <button
                    onClick={onDelete}
                    className="p-1 text-th-text-secondary hover:text-red-400 transition-colors ml-auto"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

export default CohortBuilder;
