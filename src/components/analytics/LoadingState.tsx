/**
 * LoadingState Component
 * Shows analysis progress with animated UI
 */

import { Loader2, Brain, BarChart3, Search, Sparkles } from 'lucide-react';

interface LoadingStateProps {
    stage?: 'sampling' | 'analyzing' | 'detecting' | 'generating';
    progress?: number;
}

const STAGES = [
    { id: 'sampling', label: 'Sampling data...', icon: Search },
    { id: 'analyzing', label: 'Analyzing patterns...', icon: BarChart3 },
    { id: 'detecting', label: 'Detecting anomalies...', icon: Brain },
    { id: 'generating', label: 'Generating insights...', icon: Sparkles },
];

export function LoadingState({ stage = 'sampling', progress = 0 }: LoadingStateProps) {
    const currentStageIndex = STAGES.findIndex(s => s.id === stage);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full shadow-sm">
                {/* Animated Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                    Analyzing Your Data
                </h2>
                <p className="text-gray-500 text-center text-sm mb-6">
                    AI is processing your data to generate insights
                </p>

                {/* Progress Steps */}
                <div className="space-y-3">
                    {STAGES.map((s, index) => {
                        const Icon = s.icon;
                        const isComplete = index < currentStageIndex;
                        const isCurrent = index === currentStageIndex;

                        return (
                            <div
                                key={s.id}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                    isCurrent
                                        ? 'bg-violet-50 border border-violet-200'
                                        : isComplete
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-gray-50 border border-gray-100'
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        isCurrent
                                            ? 'bg-violet-500 text-white'
                                            : isComplete
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                    }`}
                                >
                                    {isCurrent ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isComplete ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <Icon className="w-4 h-4" />
                                    )}
                                </div>
                                <span
                                    className={`text-sm font-medium ${
                                        isCurrent
                                            ? 'text-violet-700'
                                            : isComplete
                                            ? 'text-green-700'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                    <div className="mt-6">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoadingState;
