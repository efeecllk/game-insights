/**
 * Empty State Component
 * Shows when no data is available for a section
 */

import { Upload, Database, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Icon className="w-8 h-8 text-th-text-muted mb-2" />
                <p className="text-sm text-th-text-muted">{title}</p>
                {showUploadButton && (
                    <button
                        onClick={() => navigate('/upload')}
                        className="mt-2 text-xs text-th-accent-primary hover:underline"
                    >
                        Upload data
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-th-bg-elevated flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-th-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-th-text-primary mb-1">{title}</h3>
            <p className="text-sm text-th-text-muted max-w-sm mb-4">{description}</p>
            {showUploadButton && (
                <button
                    onClick={() => navigate('/upload')}
                    className="flex items-center gap-2 px-4 py-2 bg-th-accent-primary hover:bg-th-accent-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Upload Data
                </button>
            )}
        </div>
    );
}

export default EmptyState;
