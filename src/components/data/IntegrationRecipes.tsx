/**
 * Integration Recipes - Obsidian Analytics Design
 *
 * Step-by-step integration guides with:
 * - Glassmorphism containers
 * - Warm orange accent colors (#DA7756)
 * - Framer Motion animations
 * - Interactive progress tracking
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    Search,
    Filter,
    Clock,
    CheckCircle,
    ChevronRight,
    ChevronDown,
    Copy,
    Check,
    AlertTriangle,
    Lightbulb,
    ThumbsUp,
    ThumbsDown,
    Sparkles,
} from 'lucide-react';
import {
    IntegrationRecipe,
    RecipeDifficulty,
    STARTER_RECIPES,
    getAllRecipes,
    incrementRecipeViews,
    markRecipeHelpful,
} from '../../lib/recipeStore';
import { INTEGRATION_CATALOG, getIntegrationIcon } from '../../lib/integrationStore';
import type { IntegrationType } from '../../lib/integrationStore';

// ============================================================================
// Types
// ============================================================================

interface RecipeFilters {
    integrationType: IntegrationType | 'all';
    difficulty: RecipeDifficulty | 'all';
    search: string;
}

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

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

// ============================================================================
// Main Component
// ============================================================================

export function IntegrationRecipes() {
    const [recipes, setRecipes] = useState<IntegrationRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<IntegrationRecipe | null>(null);
    const [filters, setFilters] = useState<RecipeFilters>({
        integrationType: 'all',
        difficulty: 'all',
        search: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    // Load recipes
    useEffect(() => {
        async function loadRecipes() {
            setLoading(true);
            try {
                const all = await getAllRecipes();
                setRecipes(all.length > 0 ? all : STARTER_RECIPES);
            } catch (error) {
                console.error('Failed to load recipes:', error);
                setRecipes(STARTER_RECIPES);
            } finally {
                setLoading(false);
            }
        }
        loadRecipes();
    }, []);

    // Filter recipes
    const filteredRecipes = useMemo(() => {
        let result = [...recipes];

        if (filters.integrationType !== 'all') {
            result = result.filter(r => r.integrationType === filters.integrationType);
        }
        if (filters.difficulty !== 'all') {
            result = result.filter(r => r.difficulty === filters.difficulty);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(r =>
                r.title.toLowerCase().includes(search) ||
                r.description.toLowerCase().includes(search) ||
                r.tags.some(t => t.toLowerCase().includes(search))
            );
        }

        return result;
    }, [recipes, filters]);

    // Handle recipe selection
    const handleSelectRecipe = async (recipe: IntegrationRecipe) => {
        setSelectedRecipe(recipe);
        await incrementRecipeViews(recipe.id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center animate-pulse">
                    <Book className="w-6 h-6 text-[#DA7756]" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-violet-500/20 rounded-xl blur-lg" />
                        <div className="relative w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <Book className="w-6 h-6 text-violet-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Integration Recipes</h2>
                        <p className="text-sm text-slate-400">Step-by-step guides for connecting data sources</p>
                    </div>
                </div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50 focus:border-[#DA7756]/50 transition-all"
                    />
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                        showFilters
                            ? 'bg-[#DA7756]/20 border-[#DA7756]/30 text-[#DA7756]'
                            : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    {(filters.integrationType !== 'all' || filters.difficulty !== 'all') && (
                        <span className="w-2 h-2 rounded-full bg-[#DA7756]" />
                    )}
                </motion.button>
            </motion.div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Integration Type
                                </label>
                                <select
                                    value={filters.integrationType}
                                    onChange={(e) => setFilters(f => ({ ...f, integrationType: e.target.value as IntegrationType | 'all' }))}
                                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
                                >
                                    <option value="all" className="bg-slate-900">All Integrations</option>
                                    {INTEGRATION_CATALOG.map(cat => (
                                        <option key={cat.type} value={cat.type} className="bg-slate-900">{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Difficulty
                                </label>
                                <select
                                    value={filters.difficulty}
                                    onChange={(e) => setFilters(f => ({ ...f, difficulty: e.target.value as RecipeDifficulty | 'all' }))}
                                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#DA7756]/50"
                                >
                                    <option value="all" className="bg-slate-900">All Levels</option>
                                    <option value="beginner" className="bg-slate-900">Beginner</option>
                                    <option value="intermediate" className="bg-slate-900">Intermediate</option>
                                    <option value="advanced" className="bg-slate-900">Advanced</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recipe List or Detail View */}
            <AnimatePresence mode="wait">
                {selectedRecipe ? (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <RecipeDetail
                            recipe={selectedRecipe}
                            onBack={() => setSelectedRecipe(null)}
                            onVote={(helpful) => markRecipeHelpful(selectedRecipe.id, helpful)}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <RecipeList
                            recipes={filteredRecipes}
                            onSelect={handleSelectRecipe}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Recipe List
// ============================================================================

function RecipeList({
    recipes,
    onSelect,
}: {
    recipes: IntegrationRecipe[];
    onSelect: (recipe: IntegrationRecipe) => void;
}) {
    if (recipes.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08]"
            >
                <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Book className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No recipes found</h3>
                <p className="text-slate-400">Try adjusting your filters</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
            {recipes.map((recipe, index) => (
                <motion.div
                    key={recipe.id}
                    variants={cardVariants}
                    transition={{ delay: index * 0.05 }}
                >
                    <RecipeCard recipe={recipe} onClick={() => onSelect(recipe)} />
                </motion.div>
            ))}
        </motion.div>
    );
}

// ============================================================================
// Recipe Card
// ============================================================================

function RecipeCard({
    recipe,
    onClick,
}: {
    recipe: IntegrationRecipe;
    onClick: () => void;
}) {
    const integration = INTEGRATION_CATALOG.find(c => c.type === recipe.integrationType);
    const integrationIcon = integration ? getIntegrationIcon(recipe.integrationType) : null;

    const difficultyColors: Record<RecipeDifficulty, { bg: string; text: string; border: string }> = {
        beginner: { bg: 'bg-[#DA7756]/10', text: 'text-[#DA7756]', border: 'border-[#DA7756]/20' },
        intermediate: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
        advanced: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    };

    const helpfulPercent = recipe.helpful + recipe.notHelpful > 0
        ? Math.round((recipe.helpful / (recipe.helpful + recipe.notHelpful)) * 100)
        : 100;

    const difficultyStyle = difficultyColors[recipe.difficulty];

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.01, borderColor: 'rgba(218, 119, 86, 0.3)' }}
            whileTap={{ scale: 0.99 }}
            className="w-full text-left p-5 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-white/[0.08] rounded-xl transition-all group"
        >
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0 text-2xl">
                    {integrationIcon || <Book className="w-6 h-6 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white group-hover:text-[#DA7756] transition-colors truncate">
                            {recipe.title}
                        </h3>
                        {recipe.verified && (
                            <CheckCircle className="w-4 h-4 text-[#DA7756] flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{recipe.description}</p>
                </div>
                <motion.div
                    animate={{ x: 0 }}
                    whileHover={{ x: 4 }}
                >
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#DA7756] flex-shrink-0 transition-colors" />
                </motion.div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-4 text-sm">
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${difficultyStyle.bg} ${difficultyStyle.text} ${difficultyStyle.border}`}>
                    {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {recipe.estimatedTime}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {helpfulPercent}% helpful
                </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
                {recipe.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-slate-400">
                        {tag}
                    </span>
                ))}
                {recipe.tags.length > 3 && (
                    <span className="text-xs text-slate-500">+{recipe.tags.length - 3} more</span>
                )}
            </div>
        </motion.button>
    );
}

// ============================================================================
// Recipe Detail
// ============================================================================

function RecipeDetail({
    recipe,
    onBack,
    onVote,
}: {
    recipe: IntegrationRecipe;
    onBack: () => void;
    onVote: (helpful: boolean) => void;
}) {
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [voted, setVoted] = useState<'helpful' | 'notHelpful' | null>(null);
    const [copiedCode, setCopiedCode] = useState<number | null>(null);

    const integration = INTEGRATION_CATALOG.find(c => c.type === recipe.integrationType);

    const toggleStep = (stepNumber: number) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(stepNumber)) {
                next.delete(stepNumber);
            } else {
                next.add(stepNumber);
            }
            return next;
        });
    };

    const markComplete = (stepNumber: number) => {
        setCompletedSteps(prev => {
            const next = new Set(prev);
            if (next.has(stepNumber)) {
                next.delete(stepNumber);
            } else {
                next.add(stepNumber);
                // Auto-expand next step
                if (stepNumber < recipe.steps.length) {
                    setExpandedSteps(exp => new Set([...exp, stepNumber + 1]));
                }
            }
            return next;
        });
    };

    const copyCode = async (code: string, stepNumber: number) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(stepNumber);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleVote = (helpful: boolean) => {
        if (voted) return;
        setVoted(helpful ? 'helpful' : 'notHelpful');
        onVote(helpful);
    };

    const progress = recipe.steps.length > 0
        ? Math.round((completedSteps.size / recipe.steps.length) * 100)
        : 0;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Back Button */}
            <motion.button
                variants={itemVariants}
                onClick={onBack}
                whileHover={{ x: -4 }}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to recipes
            </motion.button>

            {/* Header */}
            <motion.div
                variants={itemVariants}
                className="p-6 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl"
            >
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0 text-3xl">
                        {integration ? getIntegrationIcon(recipe.integrationType) : <Book className="w-7 h-7 text-slate-400" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-semibold text-white">{recipe.title}</h1>
                            {recipe.verified && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#DA7756]/10 border border-[#DA7756]/20 rounded-lg text-xs text-[#DA7756]">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Verified
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400">{recipe.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <span>By {recipe.author}</span>
                            <span>v{recipe.version}</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {recipe.estimatedTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-300">Progress</span>
                        <span className="text-slate-400">{completedSteps.size} of {recipe.steps.length} steps</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#DA7756] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Prerequisites */}
            {recipe.prerequisites.length > 0 && (
                <motion.div
                    variants={itemVariants}
                    className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl"
                >
                    <h3 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Prerequisites
                    </h3>
                    <ul className="space-y-1">
                        {recipe.prerequisites.map((prereq, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                {prereq}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {/* Steps */}
            <motion.div variants={itemVariants} className="space-y-3">
                <h2 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#DA7756]" />
                    Steps
                </h2>
                <AnimatePresence>
                    {recipe.steps.map((step) => (
                        <motion.div
                            key={step.order}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: step.order * 0.05 }}
                            className={`border rounded-xl overflow-hidden transition-all ${
                                completedSteps.has(step.order)
                                    ? 'border-[#DA7756]/30 bg-[#DA7756]/5'
                                    : 'border-white/[0.08] bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95'
                            }`}
                        >
                            {/* Step Header */}
                            <motion.button
                                onClick={() => toggleStep(step.order)}
                                className="w-full flex items-center gap-3 p-4 text-left"
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-colors ${
                                        completedSteps.has(step.order)
                                            ? 'bg-[#DA7756] text-white'
                                            : 'bg-white/[0.06] text-slate-400'
                                    }`}
                                >
                                    {completedSteps.has(step.order) ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        step.order
                                    )}
                                </div>
                                <span className="flex-1 font-medium text-white">{step.title}</span>
                                <motion.div animate={{ rotate: expandedSteps.has(step.order) ? 180 : 0 }}>
                                    <ChevronDown className="w-5 h-5 text-slate-500" />
                                </motion.div>
                            </motion.button>

                            {/* Step Content */}
                            <AnimatePresence>
                                {expandedSteps.has(step.order) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-4 pb-4 space-y-4"
                                    >
                                        <p className="text-slate-400 pl-11">{step.description}</p>

                                        {/* Code Block */}
                                        {step.code && (
                                            <div className="ml-11 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
                                                    <span className="text-xs text-slate-500 uppercase">
                                                        {step.codeLanguage || 'code'}
                                                    </span>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => copyCode(step.code!, step.order)}
                                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        {copiedCode === step.order ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5 text-[#DA7756]" />
                                                                <span className="text-[#DA7756]">Copied</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5" />
                                                                Copy
                                                            </>
                                                        )}
                                                    </motion.button>
                                                </div>
                                                <pre className="p-3 text-sm text-slate-300 overflow-x-auto font-mono">
                                                    <code>{step.code}</code>
                                                </pre>
                                            </div>
                                        )}

                                        {/* Tip */}
                                        {step.tip && (
                                            <div className="ml-11 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                                <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-blue-400">{step.tip}</p>
                                            </div>
                                        )}

                                        {/* Warning */}
                                        {step.warning && (
                                            <div className="ml-11 flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-amber-400">{step.warning}</p>
                                            </div>
                                        )}

                                        {/* Mark Complete Button */}
                                        <div className="ml-11">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => markComplete(step.order)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                                    completedSteps.has(step.order)
                                                        ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                                        : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                {completedSteps.has(step.order) ? (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Completed
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Mark as Complete
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Troubleshooting */}
            {recipe.troubleshooting.length > 0 && (
                <motion.div
                    variants={itemVariants}
                    className="p-4 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-white/[0.08] rounded-xl"
                >
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        Troubleshooting
                    </h3>
                    <div className="space-y-3">
                        {recipe.troubleshooting.map((item, idx) => (
                            <div key={idx} className="pl-7">
                                <p className="font-medium text-white text-sm">{item.problem}</p>
                                <p className="text-sm text-slate-400 mt-1">{item.solution}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Feedback */}
            <motion.div
                variants={itemVariants}
                className="p-4 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-white/[0.08] rounded-xl"
            >
                <h3 className="font-medium text-white mb-3">Was this recipe helpful?</h3>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVote(true)}
                        disabled={voted !== null}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            voted === 'helpful'
                                ? 'bg-[#DA7756]/20 text-[#DA7756] border border-[#DA7756]/30'
                                : voted
                                ? 'bg-white/[0.02] text-slate-500 cursor-not-allowed'
                                : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:bg-[#DA7756]/10 hover:text-[#DA7756]'
                        }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        Yes, helpful
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVote(false)}
                        disabled={voted !== null}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            voted === 'notHelpful'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : voted
                                ? 'bg-white/[0.02] text-slate-500 cursor-not-allowed'
                                : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:bg-rose-500/10 hover:text-rose-400'
                        }`}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Not helpful
                    </motion.button>
                </div>
                <AnimatePresence>
                    {voted && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-slate-400 mt-2"
                        >
                            Thanks for your feedback!
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

export default IntegrationRecipes;
