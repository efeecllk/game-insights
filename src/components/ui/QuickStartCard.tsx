/**
 * Quick Start Card - First-time User Experience
 *
 * A clean, focused card that guides new users through setup.
 * Simple design with clear calls to action.
 */

import { useNavigate } from 'react-router-dom';
import {
    Upload,
    Sparkles,
    ArrowRight,
    Play,
    BarChart3,
    Shield,
} from 'lucide-react';
import { Button } from './Button';

interface QuickStartCardProps {
    onTryDemo?: () => void;
    compact?: boolean;
}

export function QuickStartCard({ onTryDemo, compact = false }: QuickStartCardProps) {
    const navigate = useNavigate();

    if (compact) {
        return (
            <div className="bg-th-bg-surface rounded-xl p-6 border border-th-border-subtle">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/20 flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6 text-th-accent-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-th-text-primary mb-2">Get Started</h3>
                    <p className="text-sm text-th-text-muted mb-4">
                        Upload your data or explore with a demo
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Upload className="w-4 h-4" />}
                            onClick={() => navigate('/upload')}
                        >
                            Upload
                        </Button>
                        {onTryDemo && (
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<Play className="w-4 h-4" />}
                                onClick={onTryDemo}
                            >
                                Demo
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-th-bg-surface rounded-xl border border-th-border-subtle overflow-hidden">
            <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-th-text-primary mb-2">
                        Welcome to Insights
                    </h2>
                    <p className="text-th-text-secondary max-w-md mx-auto">
                        Upload your data and get AI-powered insights instantly.
                        No configuration needed.
                    </p>
                </div>

                {/* Two Column Layout - Clear options */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {/* Upload Option - Primary action */}
                    <button
                        onClick={() => navigate('/upload')}
                        className="group text-left p-6 rounded-xl bg-th-accent-primary-muted border border-th-accent-primary/30 hover:border-th-accent-primary/50 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-xl bg-th-accent-primary/20 border border-th-accent-primary/30 flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-th-accent-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-th-text-primary mb-2">Upload Your Data</h3>
                        <p className="text-sm text-th-text-secondary mb-4">
                            CSV, JSON, Excel, or SQLite. We auto-detect columns and game type.
                        </p>
                        <span className="inline-flex items-center text-sm font-medium text-th-accent-primary">
                            Start uploading <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    {/* Demo Option - Secondary action */}
                    <button
                        onClick={onTryDemo}
                        className="group text-left p-6 rounded-xl bg-th-bg-elevated border border-th-border-subtle hover:border-th-border-default transition-colors"
                    >
                        <div className="w-12 h-12 rounded-xl bg-th-bg-surface border border-th-border-subtle flex items-center justify-center mb-4">
                            <Sparkles className="w-6 h-6 text-th-text-muted" />
                        </div>
                        <h3 className="text-lg font-semibold text-th-text-primary mb-2">Explore with Demo Data</h3>
                        <p className="text-sm text-th-text-secondary mb-4">
                            See how it works with realistic sample data. No signup required.
                        </p>
                        <span className="inline-flex items-center text-sm font-medium text-th-text-secondary group-hover:text-th-text-primary">
                            Try demo <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>

                {/* Features - Simple list */}
                <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-th-border-subtle">
                    <Feature icon={BarChart3} label="Auto-detect game type" />
                    <Feature icon={Sparkles} label="AI-powered insights" />
                    <Feature icon={Shield} label="100% local - your data stays private" />
                </div>
            </div>
        </div>
    );
}

function Feature({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-th-text-muted">
            <Icon className="w-4 h-4 text-th-text-disabled" />
            <span>{label}</span>
        </div>
    );
}

export default QuickStartCard;
