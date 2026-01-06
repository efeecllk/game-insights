/**
 * Data Mode Indicator - Obsidian Analytics Design
 *
 * Shows whether user is viewing demo data or their own uploaded data
 * with premium visual indicators
 */

import { Database, Play, Upload } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

export function DataModeIndicator() {
    const { activeGameData, gameDataList } = useData();
    const navigate = useNavigate();
    const hasRealData = gameDataList.length > 0;

    if (hasRealData && activeGameData) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#7A8B5B]/10 border border-[#7A8B5B]/20 rounded-lg">
                <Database className="w-4 h-4 text-[#7A8B5B]" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#7A8B5B]">Your Data</p>
                    <p className="text-xs text-[#7A8B5B]/70 truncate">{activeGameData.name}</p>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors group w-full"
        >
            <Play className="w-4 h-4 text-amber-400" />
            <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-amber-400">Demo Mode</p>
                <p className="text-xs text-amber-400/70">Using sample data</p>
            </div>
            <Upload className="w-3 h-3 text-amber-400/50 group-hover:text-amber-400 transition-colors" />
        </button>
    );
}

export default DataModeIndicator;
