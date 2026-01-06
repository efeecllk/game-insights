/**
 * Empty State Component - Simplified Design
 *
 * Clean empty state with:
 * - Clear icon and messaging
 * - Obvious call to action
 * - Consistent with design system
 */

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
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-th-bg-elevated border border-th-border-subtle flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-th-text-muted" />
                </div>
                <p className="text-sm text-th-text-muted">{title}</p>
                <div className="flex items-center gap-3 mt-3">
                    {showUploadButton && (
                        <button
                            onClick={() => navigate('/upload')}
                            className="text-xs text-th-accent-primary hover:text-th-accent-primary-hover transition-colors"
                        >
                            Upload data
                        </button>
                    )}
                    {showDemoButton && onTryDemo && (
                        <>
                            <span className="text-th-text-disabled">or</span>
                            <button
                                onClick={onTryDemo}
                                className="text-xs text-th-text-secondary hover:text-th-text-primary transition-colors"
                            >
                                Try demo
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            {/* Icon container - simple */}
            <div className="w-16 h-16 rounded-xl bg-th-bg-elevated border border-th-border-subtle flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-th-text-muted" />
            </div>

            {/* Title and description */}
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">
                {title}
            </h3>
            <p className="text-sm text-th-text-muted max-w-sm mb-6">
                {description}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
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
            </div>

            {/* Privacy note for first-time users */}
            {showUploadButton && (
                <p className="text-xs text-th-text-disabled mt-6">
                    Your data stays private - everything runs locally in your browser.
                </p>
            )}
        </div>
    );
}

export default EmptyState;
