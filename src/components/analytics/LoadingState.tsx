/**
 * LoadingState Component
 *
 * Clean loading state with:
 * - Animated progress steps
 * - Orange accent colors
 * - Smooth animations
 */

import { motion } from 'framer-motion';
import { Loader2, Brain, BarChart3, Search, Sparkles, CheckCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface LoadingStateProps {
    stage?: 'sampling' | 'analyzing' | 'detecting' | 'generating';
    progress?: number;
    rowCount?: number;
}

// ============================================================================
// Constants
// ============================================================================

const STAGES = [
    { id: 'sampling', label: 'Sampling data...', icon: Search },
    { id: 'analyzing', label: 'Analyzing patterns...', icon: BarChart3 },
    { id: 'detecting', label: 'Detecting anomalies...', icon: Brain },
    { id: 'generating', label: 'Generating insights...', icon: Sparkles },
];

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// ============================================================================
// Main Component
// ============================================================================

export function LoadingState({ stage = 'sampling', progress = 0, rowCount }: LoadingStateProps) {
    const currentStageIndex = STAGES.findIndex(s => s.id === stage);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-slate-900  rounded-2xl border border-slate-800 p-8 max-w-md w-full shadow-lg"
            >
                {/* Animated Icon */}
                <motion.div
                    variants={itemVariants}
                    className="flex justify-center mb-6"
                >
                    <div className="w-16 h-16 bg-[#DA7756] rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                </motion.div>

                {/* Title */}
                <motion.div variants={itemVariants}>
                    <h2 className="text-xl font-bold text-white text-center mb-2">
                        Analyzing Your Data
                    </h2>
                    <p className="text-slate-400 text-center text-sm mb-6">
                        {rowCount
                            ? `Processing ${rowCount.toLocaleString()} rows...`
                            : 'AI is processing your data to generate insights'}
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <div className="space-y-3">
                    {STAGES.map((s, index) => {
                        const Icon = s.icon;
                        const isComplete = index < currentStageIndex;
                        const isCurrent = index === currentStageIndex;

                        return (
                            <motion.div
                                key={s.id}
                                variants={itemVariants}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                                    isCurrent
                                        ? 'bg-[#DA7756]/10 border border-[#DA7756]/30'
                                        : isComplete
                                        ? 'bg-[#C15F3C]/10 border border-[#C15F3C]/30'
                                        : 'bg-white/[0.02] border border-slate-800'
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                        isCurrent
                                            ? 'bg-[#DA7756] text-white '
                                            : isComplete
                                            ? 'bg-[#C15F3C] text-white '
                                            : 'bg-white/[0.05] text-slate-500'
                                    }`}
                                >
                                    {isCurrent ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isComplete ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <Icon className="w-4 h-4" />
                                    )}
                                </div>
                                <span
                                    className={`text-sm font-medium transition-colors ${
                                        isCurrent
                                            ? 'text-[#DA7756]'
                                            : isComplete
                                            ? 'text-[#C15F3C]'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {s.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                <motion.div variants={itemVariants} className="mt-6">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>Progress</span>
                        <span className="tabular-nums">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden border border-slate-800">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(progress, 5)}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full bg-[#DA7756] rounded-full"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default LoadingState;
