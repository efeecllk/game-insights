/**
 * Empty State Component - Obsidian Analytics Design
 *
 * Premium empty state with:
 * - Glassmorphism icon container
 * - Emerald accent styling
 * - Animated entrance with Framer Motion
 * - Consistent with design system
 */

import { motion } from 'framer-motion';
import { Upload, Database, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: 'upload' | 'database' | 'chart';
    showUploadButton?: boolean;
    compact?: boolean;
}

export function EmptyState({
    title = 'No data available',
    description = 'Upload your game data to see insights here.',
    icon = 'chart',
    showUploadButton = true,
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
                {showUploadButton && (
                    <motion.button
                        onClick={() => navigate('/upload')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        Upload data
                    </motion.button>
                )}
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
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl" />
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

            {/* Upload button */}
            {showUploadButton && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <Button
                        variant="primary"
                        icon={<Upload className="w-4 h-4" />}
                        onClick={() => navigate('/upload')}
                    >
                        Upload Data
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}

export default EmptyState;
