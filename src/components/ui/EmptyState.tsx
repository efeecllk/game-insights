/**
 * Empty State Component - Obsidian Analytics Design
 *
 * Premium empty state with:
 * - Glassmorphism icon container
 * - Orange accent styling
 * - Animated entrance with Framer Motion
 * - Consistent with design system
 * - Optional sample data loading
 */

import { motion } from 'framer-motion';
import { Upload, Database, BarChart3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: 'upload' | 'database' | 'chart';
    showUploadButton?: boolean;
    showDemoButton?: boolean;
    onTryDemo?: () => void;
    compact?: boolean;
}

export function EmptyState({
    title = 'No data available',
    description = 'Upload your game data to see insights here.',
    icon = 'chart',
    showUploadButton = true,
    showDemoButton = false,
    onTryDemo,
    compact = false,
}: EmptyStateProps) {
    const navigate = useNavigate();

    const Icon = {
        upload: Upload,
        database: Database,
        chart: BarChart3,
    }[icon];

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-8 text-center"
            >
                <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-sm text-slate-500">{title}</p>
                <div className="flex items-center gap-3 mt-3">
                    {showUploadButton && (
                        <motion.button
                            onClick={() => navigate('/upload')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs text-[#DA7756] hover:text-[#DA7756]/80 transition-colors"
                        >
                            Upload data
                        </motion.button>
                    )}
                    {showDemoButton && onTryDemo && (
                        <>
                            <span className="text-slate-600">or</span>
                            <motion.button
                                onClick={onTryDemo}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-xs text-[#A68B5B] hover:text-[#A68B5B]/80 transition-colors"
                            >
                                Try demo
                            </motion.button>
                        </>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center justify-center py-12 text-center"
        >
            {/* Icon container with glow */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="relative mb-6"
            >
                <div className="absolute inset-0 bg-[#DA7756]/10 rounded-2xl blur-xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/[0.08] flex items-center justify-center">
                    <Icon className="w-8 h-8 text-slate-400" />
                </div>
            </motion.div>

            {/* Title and description */}
            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg font-semibold text-white mb-2"
            >
                {title}
            </motion.h3>
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-slate-500 max-w-sm mb-6"
            >
                {description}
            </motion.p>

            {/* Action buttons */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-3"
            >
                {showUploadButton && (
                    <Button
                        variant="primary"
                        icon={<Upload className="w-4 h-4" />}
                        onClick={() => navigate('/upload')}
                    >
                        Upload Data
                    </Button>
                )}
                {showDemoButton && onTryDemo && (
                    <Button
                        variant="ghost"
                        icon={<Sparkles className="w-4 h-4" />}
                        onClick={onTryDemo}
                    >
                        Try Demo
                    </Button>
                )}
            </motion.div>

            {/* Privacy note for first-time users */}
            {showUploadButton && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs text-slate-600 mt-6"
                >
                    Your data stays private - everything runs locally in your browser.
                </motion.p>
            )}
        </motion.div>
    );
}

export default EmptyState;
