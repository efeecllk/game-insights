/**
 * Funnel Builder Page
 * Custom funnel creation and analysis for Phase 6
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Filter,
    Plus,
    Trash2,
    Copy,
    ArrowDown,
    Edit3,
    MoreVertical,
    X,
    Check,
    Clock,
    Users,
    TrendingDown,
    GripVertical,
    ChevronDown,
} from 'lucide-react';
import {
    Funnel,
    FunnelStep,
    FunnelResult,
    getAllFunnels,
    saveFunnel,
    deleteFunnel,
    duplicateFunnel,
    createFunnel,
    createFunnelStep,
    initializeSampleFunnels,
    getMockFunnelResult,
    COMMON_EVENTS,
} from '../lib/funnelStore';

// ============================================================================
// Main Page Component
// ============================================================================

export function FunnelBuilderPage() {
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
    const [result, setResult] = useState<FunnelResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const loadFunnels = useCallback(async () => {
        setLoading(true);
        await initializeSampleFunnels();
        const all = await getAllFunnels();
        setFunnels(all);
        if (all.length > 0) {
            setSelectedFunnel((current) => current || all[0]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadFunnels();
    }, [loadFunnels]);

    useEffect(() => {
        if (selectedFunnel) {
            // Calculate mock results
            setResult(getMockFunnelResult(selectedFunnel));
        }
    }, [selectedFunnel]);

    async function handleSaveFunnel() {
        if (!selectedFunnel) return;
        await saveFunnel(selectedFunnel);
        await loadFunnels();
        setIsEditing(false);
    }

    async function handleCreateFunnel(name: string) {
        const newFunnel = createFunnel(name);
        // Add initial steps
        newFunnel.steps = [
            createFunnelStep('Step 1', 'app_open', 1),
            createFunnelStep('Step 2', 'session_start', 2),
        ];
        await saveFunnel(newFunnel);
        await loadFunnels();
        setSelectedFunnel(newFunnel);
        setIsEditing(true);
        setShowCreateModal(false);
    }

    async function handleDeleteFunnel(id: string) {
        if (!confirm('Are you sure you want to delete this funnel?')) return;
        await deleteFunnel(id);
        await loadFunnels();
        if (selectedFunnel?.id === id) {
            const remaining = funnels.filter(f => f.id !== id);
            setSelectedFunnel(remaining[0] || null);
        }
    }

    async function handleDuplicateFunnel(id: string) {
        const original = funnels.find(f => f.id === id);
        if (!original) return;
        const duplicate = await duplicateFunnel(id, `${original.name} (Copy)`);
        if (duplicate) {
            await loadFunnels();
            setSelectedFunnel(duplicate);
        }
    }

    function handleAddStep() {
        if (!selectedFunnel) return;
        const newStep = createFunnelStep(
            `Step ${selectedFunnel.steps.length + 1}`,
            'app_open',
            selectedFunnel.steps.length + 1
        );
        setSelectedFunnel({
            ...selectedFunnel,
            steps: [...selectedFunnel.steps, newStep],
        });
    }

    function handleUpdateStep(stepId: string, updates: Partial<FunnelStep>) {
        if (!selectedFunnel) return;
        setSelectedFunnel({
            ...selectedFunnel,
            steps: selectedFunnel.steps.map(s =>
                s.id === stepId ? { ...s, ...updates } : s
            ),
        });
    }

    function handleDeleteStep(stepId: string) {
        if (!selectedFunnel) return;
        const newSteps = selectedFunnel.steps
            .filter(s => s.id !== stepId)
            .map((s, i) => ({ ...s, order: i + 1 }));
        setSelectedFunnel({
            ...selectedFunnel,
            steps: newSteps,
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Filter className="w-7 h-7 text-accent-primary" />
                        Funnel Builder
                    </h1>
                    <p className="text-zinc-500 mt-1">Create and analyze custom conversion funnels</p>
                </div>
                <div className="flex gap-3">
                    {isEditing && selectedFunnel ? (
                        <>
                            <button
                                onClick={handleAddStep}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Step
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveFunnel}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            {selectedFunnel && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New Funnel
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Funnel List */}
                <div className="col-span-3">
                    <div className="bg-bg-card rounded-xl border border-white/10 p-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-4">Your Funnels</h3>
                        <div className="space-y-2">
                            {funnels.map(funnel => (
                                <FunnelListItem
                                    key={funnel.id}
                                    funnel={funnel}
                                    isSelected={selectedFunnel?.id === funnel.id}
                                    onSelect={() => {
                                        setSelectedFunnel(funnel);
                                        setIsEditing(false);
                                    }}
                                    onDelete={() => handleDeleteFunnel(funnel.id)}
                                    onDuplicate={() => handleDuplicateFunnel(funnel.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Funnel Editor/Viewer */}
                <div className="col-span-9">
                    {selectedFunnel ? (
                        <div className="space-y-6">
                            {/* Funnel Info */}
                            <div className="bg-bg-card rounded-xl border border-white/10 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{selectedFunnel.icon}</span>
                                        <div>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={selectedFunnel.name}
                                                    onChange={(e) => setSelectedFunnel({
                                                        ...selectedFunnel,
                                                        name: e.target.value
                                                    })}
                                                    className="text-xl font-semibold text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-violet-500"
                                                />
                                            ) : (
                                                <h2 className="text-xl font-semibold text-white">
                                                    {selectedFunnel.name}
                                                </h2>
                                            )}
                                            <p className="text-sm text-zinc-500">
                                                {selectedFunnel.steps.length} steps
                                            </p>
                                        </div>
                                    </div>

                                    {/* Settings */}
                                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{selectedFunnel.conversionWindow}h window</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span className="capitalize">{selectedFunnel.countingMethod}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="space-y-3">
                                    {selectedFunnel.steps.map((step, index) => (
                                        <FunnelStepCard
                                            key={step.id}
                                            step={step}
                                            index={index}
                                            result={result?.steps[index]}
                                            isEditing={isEditing}
                                            onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                                            onDelete={() => handleDeleteStep(step.id)}
                                            isLast={index === selectedFunnel.steps.length - 1}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Results Summary */}
                            {result && !isEditing && (
                                <div className="grid grid-cols-3 gap-4">
                                    <ResultCard
                                        label="Overall Conversion"
                                        value={`${result.overallConversion.toFixed(1)}%`}
                                        icon={<TrendingDown className="w-5 h-5" />}
                                        color="violet"
                                    />
                                    <ResultCard
                                        label="Total Users"
                                        value={result.steps[0]?.users.toLocaleString() || '0'}
                                        icon={<Users className="w-5 h-5" />}
                                        color="blue"
                                    />
                                    <ResultCard
                                        label="Median Time"
                                        value={formatTime(result.medianTime)}
                                        icon={<Clock className="w-5 h-5" />}
                                        color="green"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-bg-card rounded-xl border border-white/10 p-12 text-center">
                            <Filter className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-500">Select a funnel or create a new one</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateFunnelModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateFunnel}
                />
            )}
        </div>
    );
}

// ============================================================================
// Funnel List Item
// ============================================================================

function FunnelListItem({
    funnel,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
}: {
    funnel: Funnel;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                isSelected
                    ? 'bg-accent-primary/10 text-white'
                    : 'hover:bg-white/5 text-zinc-400'
            }`}
            onClick={onSelect}
        >
            <span className="text-xl">{funnel.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{funnel.name}</p>
                <p className="text-xs text-zinc-500">{funnel.steps.length} steps</p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
                <div
                    className="absolute right-0 top-full mt-1 z-10 bg-zinc-800 rounded-lg border border-white/10 shadow-xl py-1 w-32"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            onDuplicate();
                            setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        Duplicate
                    </button>
                    <button
                        onClick={() => {
                            onDelete();
                            setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Funnel Step Card
// ============================================================================

function FunnelStepCard({
    step,
    index,
    result,
    isEditing,
    onUpdate,
    onDelete,
    isLast,
}: {
    step: FunnelStep;
    index: number;
    result?: FunnelResult['steps'][0];
    isEditing: boolean;
    onUpdate: (updates: Partial<FunnelStep>) => void;
    onDelete: () => void;
    isLast: boolean;
}) {
    return (
        <div className="relative">
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isEditing
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/[0.02] border-transparent'
            }`}>
                {/* Step Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                </div>

                {/* Drag Handle (editing mode) */}
                {isEditing && (
                    <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
                )}

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={step.name}
                                onChange={(e) => onUpdate({ name: e.target.value })}
                                placeholder="Step name"
                                className="flex-1 px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                            />
                            <div className="relative">
                                <select
                                    value={step.event}
                                    onChange={(e) => onUpdate({ event: e.target.value })}
                                    className="px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 appearance-none pr-8"
                                >
                                    {COMMON_EVENTS.map(event => (
                                        <option key={event.value} value={event.value}>
                                            {event.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="font-medium text-white">{step.name}</p>
                            <p className="text-sm text-zinc-500">
                                {COMMON_EVENTS.find(e => e.value === step.event)?.label || step.event}
                            </p>
                        </div>
                    )}
                </div>

                {/* Results (viewing mode) */}
                {!isEditing && result && (
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-lg font-semibold text-white">
                                {result.users.toLocaleString()}
                            </p>
                            <p className="text-xs text-zinc-500">users</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-lg font-semibold ${
                                result.conversionRate > 50 ? 'text-green-400' :
                                result.conversionRate > 20 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                                {result.conversionRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-zinc-500">conversion</p>
                        </div>
                        {index > 0 && (
                            <div className="text-right">
                                <p className="text-sm text-red-400">
                                    -{result.dropoffRate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-zinc-500">dropoff</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Button (editing mode) */}
                {isEditing && (
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Arrow connector */}
            {!isLast && (
                <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-zinc-600" />
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Result Card
// ============================================================================

function ResultCard({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: 'violet' | 'blue' | 'green';
}) {
    const colors = {
        violet: 'bg-violet-500/10 text-violet-400',
        blue: 'bg-blue-500/10 text-blue-400',
        green: 'bg-green-500/10 text-green-400',
    };

    return (
        <div className="bg-bg-card rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-zinc-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Create Modal
// ============================================================================

function CreateFunnelModal({
    onClose,
    onCreate,
}: {
    onClose: () => void;
    onCreate: (name: string) => void;
}) {
    const [name, setName] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-md mx-4 shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <Filter className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">New Funnel</h2>
                            <p className="text-sm text-zinc-500">Create a custom conversion funnel</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Funnel Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., New User Onboarding"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onCreate(name || 'New Funnel')}
                            className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default FunnelBuilderPage;
