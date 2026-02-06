/**
 * Data Hub Page
 *
 * Central place to manage uploaded datasets.
 * Shows all game data entries with quick actions.
 */

import { motion } from 'framer-motion';
import { Database, Upload, Clock, FileSpreadsheet, Trash2, BarChart2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

export function DataHubPage() {
    const { gameDataList, activeGameData, setActiveGameData, removeGameData } = useData();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-th-accent-primary/10 flex items-center justify-center">
                        <Database className="w-5 h-5 text-th-accent-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold text-th-text-primary">Data Sources</h1>
                        <p className="text-sm text-th-text-muted">{gameDataList.length} dataset{gameDataList.length !== 1 ? 's' : ''} uploaded</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/upload')}
                    className="flex items-center gap-2 px-4 py-2 bg-th-accent-primary text-th-text-inverse rounded-lg hover:bg-th-accent-primary-hover transition-colors text-sm font-medium"
                >
                    <Upload className="w-4 h-4" />
                    Upload New
                </button>
            </div>

            {/* Empty state */}
            {gameDataList.length === 0 && (
                <div className="bg-th-bg-surface border border-th-border-subtle rounded-xl p-12 text-center">
                    <FileSpreadsheet className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                    <h2 className="text-lg font-display font-semibold text-th-text-primary mb-2">
                        No data sources yet
                    </h2>
                    <p className="text-sm text-th-text-muted max-w-md mx-auto mb-4">
                        Upload a CSV, Excel, JSON, or SQLite file to get started with analytics.
                    </p>
                    <button
                        onClick={() => navigate('/upload')}
                        className="px-4 py-2 bg-th-accent-primary text-th-text-inverse rounded-lg hover:bg-th-accent-primary-hover transition-colors text-sm font-medium"
                    >
                        Upload Data
                    </button>
                </div>
            )}

            {/* Data list */}
            {gameDataList.length > 0 && (
                <div className="grid gap-3">
                    {gameDataList.map((data) => {
                        const isActive = activeGameData?.id === data.id;
                        return (
                            <motion.div
                                key={data.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-th-bg-surface border rounded-xl p-4 cursor-pointer transition-colors ${
                                    isActive
                                        ? 'border-th-accent-primary'
                                        : 'border-th-border-subtle hover:border-th-border-default'
                                }`}
                                onClick={() => setActiveGameData(data)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-th-bg-elevated flex items-center justify-center flex-shrink-0">
                                            <BarChart2 className="w-5 h-5 text-th-text-muted" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-medium text-th-text-primary truncate">
                                                {data.name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-th-text-muted mt-0.5">
                                                <span>{data.rowCount.toLocaleString()} rows</span>
                                                <span className="capitalize">{data.type.replace('_', ' ')}</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(data.uploadedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await removeGameData(data.id);
                                        }}
                                        className="p-2 text-th-text-muted hover:text-red-400 rounded-lg hover:bg-th-bg-elevated transition-colors"
                                        title="Delete dataset"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default DataHubPage;
