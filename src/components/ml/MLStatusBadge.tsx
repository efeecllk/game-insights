/**
 * ML Status Badge
 * Shows ML model training/ready status
 * Phase 3: AI/ML Integration
 */

import { Brain, Loader2 } from 'lucide-react';
import { useMLOptional } from '../../context/MLContext';
import { useGameData } from '../../hooks/useGameData';

interface MLStatusBadgeProps {
    className?: string;
}

export function MLStatusBadge({ className = '' }: MLStatusBadgeProps) {
    const ml = useMLOptional();
    const { hasRealData } = useGameData();

    // Not in ML context or no real data
    if (!ml || !hasRealData) {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-500 ${className}`}>
                <Brain className="w-3 h-3" />
                <span>ML: No Data</span>
            </div>
        );
    }

    // Training in progress
    if (ml.isTraining) {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 ${className}`}>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Training...</span>
            </div>
        );
    }

    // Error state
    if (ml.error) {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 ${className}`}>
                <Brain className="w-3 h-3" />
                <span>ML Error</span>
            </div>
        );
    }

    // Ready
    if (ml.isReady) {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 ${className}`}>
                <Brain className="w-3 h-3" />
                <span>ML Ready</span>
            </div>
        );
    }

    // Initializing
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-400 ${className}`}>
            <Brain className="w-3 h-3" />
            <span>ML: Init</span>
        </div>
    );
}

export default MLStatusBadge;
