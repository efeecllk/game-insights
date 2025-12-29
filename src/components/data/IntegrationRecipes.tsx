/**
 * Integration Recipes Component
 * Display step-by-step integration guides
 * Phase 4: Community & Ecosystem
 */

import { useState, useEffect, useMemo } from 'react';
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
                <div className="animate-spin w-8 h-8 border-2 border-th-accent-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Book className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-th-text-primary">Integration Recipes</h2>
                        <p className="text-sm text-th-text-muted">Step-by-step guides for connecting data sources</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-muted" />
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-th-bg-surface border border-th-border rounded-xl text-th-text-primary placeholder-th-text-muted focus:outline-none focus:border-th-accent-primary"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                        showFilters
                            ? 'bg-th-accent-primary/10 border-th-accent-primary text-th-accent-primary'
                            : 'bg-th-bg-surface border-th-border text-th-text-secondary hover:bg-th-bg-elevated'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    {(filters.integrationType !== 'all' || filters.difficulty !== 'all') && (
                        <span className="w-2 h-2 rounded-full bg-th-accent-primary" />
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-th-bg-surface border border-th-border rounded-xl">
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Integration Type
                        </label>
                        <select
                            value={filters.integrationType}
                            onChange={(e) => setFilters(f => ({ ...f, integrationType: e.target.value as IntegrationType | 'all' }))}
                            className="w-full px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary"
                        >
                            <option value="all">All Integrations</option>
                            {INTEGRATION_CATALOG.map(cat => (
                                <option key={cat.type} value={cat.type}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-th-text-secondary mb-2">
                            Difficulty
                        </label>
                        <select
                            value={filters.difficulty}
                            onChange={(e) => setFilters(f => ({ ...f, difficulty: e.target.value as RecipeDifficulty | 'all' }))}
                            className="w-full px-3 py-2 bg-th-bg-elevated border border-th-border rounded-lg text-th-text-primary"
                        >
                            <option value="all">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Recipe List or Detail View */}
            {selectedRecipe ? (
                <RecipeDetail
                    recipe={selectedRecipe}
                    onBack={() => setSelectedRecipe(null)}
                    onVote={(helpful) => markRecipeHelpful(selectedRecipe.id, helpful)}
                />
            ) : (
                <RecipeList
                    recipes={filteredRecipes}
                    onSelect={handleSelectRecipe}
                />
            )}
        </div>
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
            <div className="text-center py-12 bg-th-bg-surface border border-th-border rounded-xl">
                <Book className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-th-text-primary mb-2">No recipes found</h3>
                <p className="text-th-text-muted">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onSelect(recipe)} />
            ))}
        </div>
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

    const difficultyColors: Record<RecipeDifficulty, string> = {
        beginner: 'bg-green-500/10 text-green-400',
        intermediate: 'bg-yellow-500/10 text-yellow-400',
        advanced: 'bg-red-500/10 text-red-400',
    };

    const helpfulPercent = recipe.helpful + recipe.notHelpful > 0
        ? Math.round((recipe.helpful / (recipe.helpful + recipe.notHelpful)) * 100)
        : 100;

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-5 bg-th-bg-surface border border-th-border rounded-xl hover:border-th-accent-primary/50 hover:bg-th-bg-elevated transition-all group"
        >
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-th-bg-elevated flex items-center justify-center flex-shrink-0 text-2xl">
                    {integrationIcon || <Book className="w-6 h-6 text-th-text-secondary" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-th-text-primary group-hover:text-th-accent-primary transition-colors truncate">
                            {recipe.title}
                        </h3>
                        {recipe.verified && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-th-text-muted line-clamp-2">{recipe.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-th-text-muted group-hover:text-th-accent-primary flex-shrink-0 transition-colors" />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 mt-4 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[recipe.difficulty]}`}>
                    {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                </span>
                <span className="flex items-center gap-1 text-th-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {recipe.estimatedTime}
                </span>
                <span className="flex items-center gap-1 text-th-text-muted">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {helpfulPercent}% helpful
                </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
                {recipe.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-th-bg-elevated rounded text-xs text-th-text-muted">
                        {tag}
                    </span>
                ))}
                {recipe.tags.length > 3 && (
                    <span className="text-xs text-th-text-muted">+{recipe.tags.length - 3} more</span>
                )}
            </div>
        </button>
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
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-th-text-muted hover:text-th-text-primary transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to recipes
            </button>

            {/* Header */}
            <div className="p-6 bg-th-bg-surface border border-th-border rounded-xl">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-th-bg-elevated flex items-center justify-center flex-shrink-0 text-3xl">
                        {integration ? getIntegrationIcon(recipe.integrationType) : <Book className="w-7 h-7 text-th-text-secondary" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-semibold text-th-text-primary">{recipe.title}</h1>
                            {recipe.verified && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 rounded text-xs text-green-400">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Verified
                                </span>
                            )}
                        </div>
                        <p className="text-th-text-muted">{recipe.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-th-text-muted">
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
                        <span className="text-th-text-secondary">Progress</span>
                        <span className="text-th-text-muted">{completedSteps.size} of {recipe.steps.length} steps</span>
                    </div>
                    <div className="h-2 bg-th-bg-elevated rounded-full overflow-hidden">
                        <div
                            className="h-full bg-th-accent-primary rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Prerequisites */}
            {recipe.prerequisites.length > 0 && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <h3 className="font-medium text-blue-400 mb-2">Prerequisites</h3>
                    <ul className="space-y-1">
                        {recipe.prerequisites.map((prereq, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-th-text-secondary">
                                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                {prereq}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Steps */}
            <div className="space-y-3">
                <h2 className="font-semibold text-th-text-primary">Steps</h2>
                {recipe.steps.map((step) => (
                    <div
                        key={step.order}
                        className={`border rounded-xl overflow-hidden transition-colors ${
                            completedSteps.has(step.order)
                                ? 'border-green-500/30 bg-green-500/5'
                                : 'border-th-border bg-th-bg-surface'
                        }`}
                    >
                        {/* Step Header */}
                        <button
                            onClick={() => toggleStep(step.order)}
                            className="w-full flex items-center gap-3 p-4 text-left"
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                                    completedSteps.has(step.order)
                                        ? 'bg-green-500 text-white'
                                        : 'bg-th-bg-elevated text-th-text-secondary'
                                }`}
                            >
                                {completedSteps.has(step.order) ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    step.order
                                )}
                            </div>
                            <span className="flex-1 font-medium text-th-text-primary">{step.title}</span>
                            <ChevronDown
                                className={`w-5 h-5 text-th-text-muted transition-transform ${
                                    expandedSteps.has(step.order) ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {/* Step Content */}
                        {expandedSteps.has(step.order) && (
                            <div className="px-4 pb-4 space-y-4">
                                <p className="text-th-text-secondary pl-11">{step.description}</p>

                                {/* Code Block */}
                                {step.code && (
                                    <div className="ml-11 bg-th-bg-elevated rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-2 border-b border-th-border">
                                            <span className="text-xs text-th-text-muted uppercase">
                                                {step.codeLanguage || 'code'}
                                            </span>
                                            <button
                                                onClick={() => copyCode(step.code!, step.order)}
                                                className="flex items-center gap-1 text-xs text-th-text-muted hover:text-th-text-primary transition-colors"
                                            >
                                                {copiedCode === step.order ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" />
                                                        Copy
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <pre className="p-3 text-sm text-th-text-primary overflow-x-auto font-mono">
                                            <code>{step.code}</code>
                                        </pre>
                                    </div>
                                )}

                                {/* Tip */}
                                {step.tip && (
                                    <div className="ml-11 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-400">{step.tip}</p>
                                    </div>
                                )}

                                {/* Warning */}
                                {step.warning && (
                                    <div className="ml-11 flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-yellow-400">{step.warning}</p>
                                    </div>
                                )}

                                {/* Mark Complete Button */}
                                <div className="ml-11">
                                    <button
                                        onClick={() => markComplete(step.order)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            completedSteps.has(step.order)
                                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                : 'bg-th-bg-elevated text-th-text-secondary hover:bg-th-interactive-hover'
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
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Troubleshooting */}
            {recipe.troubleshooting.length > 0 && (
                <div className="p-4 bg-th-bg-surface border border-th-border rounded-xl">
                    <h3 className="font-semibold text-th-text-primary mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        Troubleshooting
                    </h3>
                    <div className="space-y-3">
                        {recipe.troubleshooting.map((item, idx) => (
                            <div key={idx} className="pl-7">
                                <p className="font-medium text-th-text-primary text-sm">{item.problem}</p>
                                <p className="text-sm text-th-text-muted mt-1">{item.solution}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Feedback */}
            <div className="p-4 bg-th-bg-surface border border-th-border rounded-xl">
                <h3 className="font-medium text-th-text-primary mb-3">Was this recipe helpful?</h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleVote(true)}
                        disabled={voted !== null}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            voted === 'helpful'
                                ? 'bg-green-500/20 text-green-400'
                                : voted
                                ? 'bg-th-bg-elevated text-th-text-muted cursor-not-allowed'
                                : 'bg-th-bg-elevated text-th-text-secondary hover:bg-green-500/10 hover:text-green-400'
                        }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        Yes, helpful
                    </button>
                    <button
                        onClick={() => handleVote(false)}
                        disabled={voted !== null}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            voted === 'notHelpful'
                                ? 'bg-red-500/20 text-red-400'
                                : voted
                                ? 'bg-th-bg-elevated text-th-text-muted cursor-not-allowed'
                                : 'bg-th-bg-elevated text-th-text-secondary hover:bg-red-500/10 hover:text-red-400'
                        }`}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Not helpful
                    </button>
                </div>
                {voted && (
                    <p className="text-sm text-th-text-muted mt-2">
                        Thanks for your feedback!
                    </p>
                )}
            </div>
        </div>
    );
}

export default IntegrationRecipes;
