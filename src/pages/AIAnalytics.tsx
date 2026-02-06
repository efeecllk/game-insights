/**
 * AI Analytics Page
 *
 * AI-powered analytics with insights and recommendations.
 * Shows pipeline results from uploaded data.
 * Full chat interface and insight actions coming in Sprint 3.
 */

import { Bot, Sparkles, Info } from 'lucide-react';
import { useData } from '../context/DataContext';

export function AIAnalyticsPage() {
    const { activeGameData } = useData();

    // The AI pipeline stores insights in the game data analysis result
    // For now, we show a placeholder that will be populated in Sprint 3
    const hasData = !!activeGameData;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-th-accent-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-th-accent-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-display font-bold text-th-text-primary">AI Analytics</h1>
                    <p className="text-sm text-th-text-muted">AI-powered insights from your data</p>
                </div>
            </div>

            {/* No data state */}
            {!hasData && (
                <div className="bg-th-bg-surface border border-th-border-subtle rounded-xl p-12 text-center">
                    <Sparkles className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                    <h2 className="text-lg font-display font-semibold text-th-text-primary mb-2">
                        Upload data to get started
                    </h2>
                    <p className="text-sm text-th-text-muted max-w-md mx-auto">
                        Upload a CSV, Excel, or JSON file and the AI pipeline will automatically
                        analyze your data, detect patterns, and generate actionable insights.
                    </p>
                </div>
            )}

            {/* Data loaded - show summary */}
            {hasData && (
                <div className="bg-th-bg-surface border border-th-border-subtle rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="w-4 h-4 text-th-accent-primary" />
                        <span className="text-sm font-medium text-th-text-primary">Dataset: {activeGameData.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <span className="text-xs text-th-text-muted uppercase tracking-wider">Rows</span>
                            <p className="text-lg font-display font-bold text-th-text-primary">{activeGameData.rowCount.toLocaleString()}</p>
                        </div>
                        <div>
                            <span className="text-xs text-th-text-muted uppercase tracking-wider">Columns</span>
                            <p className="text-lg font-display font-bold text-th-text-primary">{activeGameData.columnMappings.length}</p>
                        </div>
                        <div>
                            <span className="text-xs text-th-text-muted uppercase tracking-wider">Game Type</span>
                            <p className="text-lg font-display font-bold text-th-text-primary capitalize">{activeGameData.type.replace('_', ' ')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIAnalyticsPage;
