/**
 * Funnel Builder Page
 * Custom funnel creation and analysis
 * Redesigned with Obsidian design system
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Sparkles,
    Layers,
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
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 },
    },
};

// ============================================================================
// Noise texture for glassmorphism
// ============================================================================

const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`;

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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="relative">
                    <div className="w-12 h-12 border-2 border-emerald-500/20 rounded-full" />
                    <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-emerald-400 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-32 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative p-6 space-y-6"
            >
                {/* Header */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20"
                        >
                            <Filter className="w-6 h-6 text-emerald-400" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
                                Funnel Builder
                            </h1>
                            <p className="text-slate-400 text-sm">Create and analyze custom conversion funnels</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {isEditing && selectedFunnel ? (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAddStep}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/[0.08] text-slate-300 hover:border-white/[0.12] transition-all"
                                    style={{ backgroundImage: noiseTexture }}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Step
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsEditing(false)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/[0.08] text-slate-300 hover:border-white/[0.12] transition-all"
                                    style={{ backgroundImage: noiseTexture }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveFunnel}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    Save
                                </motion.button>
                            </>
                        ) : (
                            <>
                                {selectedFunnel && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/[0.08] text-slate-300 hover:border-white/[0.12] transition-all"
                                        style={{ backgroundImage: noiseTexture }}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Edit
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Funnel
                                </motion.button>
                            </>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Funnel List */}
                    <motion.div variants={itemVariants} className="col-span-3">
                        <div
                            className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-4"
                            style={{ backgroundImage: noiseTexture }}
                        >
                            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Layers className="w-3 h-3" />
                                Your Funnels
                            </h3>
                            <div className="space-y-2">
                                <AnimatePresence>
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
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>

                    {/* Funnel Editor/Viewer */}
                    <motion.div variants={itemVariants} className="col-span-9">
                        {selectedFunnel ? (
                            <div className="space-y-6">
                                {/* Funnel Info */}
                                <motion.div
                                    variants={cardVariants}
                                    className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6"
                                    style={{ backgroundImage: noiseTexture }}
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 200 }}
                                                className="text-3xl"
                                            >
                                                {selectedFunnel.icon}
                                            </motion.span>
                                            <div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={selectedFunnel.name}
                                                        onChange={(e) => setSelectedFunnel({
                                                            ...selectedFunnel,
                                                            name: e.target.value
                                                        })}
                                                        className="text-xl font-semibold text-white bg-transparent border-b-2 border-emerald-500/30 focus:outline-none focus:border-emerald-500 pb-1"
                                                    />
                                                ) : (
                                                    <h2 className="text-xl font-semibold text-white">
                                                        {selectedFunnel.name}
                                                    </h2>
                                                )}
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {selectedFunnel.steps.length} steps
                                                </p>
                                            </div>
                                        </div>

                                        {/* Settings */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/[0.06]">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-slate-400">{selectedFunnel.conversionWindow}h window</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/[0.06]">
                                                <Users className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-slate-400 capitalize">{selectedFunnel.countingMethod}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Steps */}
                                    <div className="space-y-3">
                                        <AnimatePresence>
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
                                        </AnimatePresence>
                                    </div>
                                </motion.div>

                                {/* Results Summary */}
                                {result && !isEditing && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="grid grid-cols-3 gap-4"
                                    >
                                        <ResultCard
                                            label="Overall Conversion"
                                            value={`${result.overallConversion.toFixed(1)}%`}
                                            icon={<TrendingDown className="w-5 h-5" />}
                                            color="emerald"
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
                                            color="teal"
                                        />
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <motion.div
                                variants={cardVariants}
                                className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-12 text-center"
                                style={{ backgroundImage: noiseTexture }}
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/[0.06] flex items-center justify-center">
                                    <Filter className="w-8 h-8 text-slate-600" />
                                </div>
                                <p className="text-slate-400">Select a funnel or create a new one</p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </motion.div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateFunnelModal
                        onClose={() => setShowCreateModal(false)}
                        onCreate={handleCreateFunnel}
                    />
                )}
            </AnimatePresence>
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
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                isSelected
                    ? 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:from-slate-800/60 hover:to-slate-900/60 border border-white/[0.04] hover:border-white/[0.08]'
            }`}
            onClick={onSelect}
        >
            <span className="text-xl">{funnel.icon}</span>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {funnel.name}
                </p>
                <p className="text-xs text-slate-500">{funnel.steps.length} steps</p>
            </div>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
                <MoreVertical className="w-4 h-4 text-slate-400" />
            </motion.button>

            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 z-10 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-2xl py-1 w-36"
                        style={{ backgroundImage: noiseTexture }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                onDuplicate();
                                setShowMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                            Duplicate
                        </button>
                        <button
                            onClick={() => {
                                onDelete();
                                setShowMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className="relative"
        >
            <motion.div
                whileHover={isEditing ? { scale: 1.01 } : {}}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isEditing
                        ? 'bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-white/[0.08]'
                        : 'bg-gradient-to-br from-slate-800/20 to-slate-900/20 border-transparent hover:border-white/[0.04]'
                }`}
            >
                {/* Step Number */}
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-semibold text-sm"
                >
                    {index + 1}
                </motion.div>

                {/* Drag Handle (editing mode) */}
                {isEditing && (
                    <GripVertical className="w-4 h-4 text-slate-600 cursor-grab hover:text-slate-400 transition-colors" />
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
                                className="flex-1 px-3 py-2 bg-slate-900/50 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                            />
                            <div className="relative">
                                <select
                                    value={step.event}
                                    onChange={(e) => onUpdate({ event: e.target.value })}
                                    className="px-3 py-2 bg-slate-900/50 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 appearance-none pr-8 transition-colors"
                                >
                                    {COMMON_EVENTS.map(event => (
                                        <option key={event.value} value={event.value}>
                                            {event.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="font-medium text-white">{step.name}</p>
                            <p className="text-sm text-slate-500">
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
                            <p className="text-xs text-slate-500">users</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-lg font-semibold ${
                                result.conversionRate > 50 ? 'text-emerald-400' :
                                result.conversionRate > 20 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                                {result.conversionRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-500">conversion</p>
                        </div>
                        {index > 0 && (
                            <div className="text-right">
                                <p className="text-sm text-rose-400">
                                    -{result.dropoffRate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-500">dropoff</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Button (editing mode) */}
                {isEditing && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onDelete}
                        className="p-2 hover:bg-rose-500/20 rounded-lg transition-colors text-rose-400"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                )}
            </motion.div>

            {/* Arrow connector */}
            {!isLast && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center py-1"
                >
                    <ArrowDown className="w-4 h-4 text-slate-600" />
                </motion.div>
            )}
        </motion.div>
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
    color: 'emerald' | 'blue' | 'teal';
}) {
    const colors = {
        emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-400',
        blue: 'from-blue-500/20 to-indigo-500/10 border-blue-500/20 text-blue-400',
        teal: 'from-teal-500/20 to-cyan-500/10 border-teal-500/20 text-teal-400',
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-4"
            style={{ backgroundImage: noiseTexture }}
        >
            <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} border flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                </div>
            </div>
        </motion.div>
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 backdrop-blur-xl rounded-2xl border border-white/[0.08] w-full max-w-md mx-4 shadow-2xl"
                style={{ backgroundImage: noiseTexture }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">New Funnel</h2>
                            <p className="text-sm text-slate-500">Create a custom conversion funnel</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </motion.button>
                </div>

                <div className="p-5 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Funnel Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., New User Onboarding"
                            className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onCreate(name || 'New Funnel');
                            }}
                        />
                    </div>

                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-800/50 hover:bg-slate-800/70 text-slate-300 rounded-xl transition-colors border border-white/[0.06]"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onCreate(name || 'New Funnel')}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Create
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
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
