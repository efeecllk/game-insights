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
            className="flex items-center gap-2 px-3 py-2 bg-[#E5A84B]/10 border border-[#E5A84B]/20 rounded-lg hover:bg-[#E5A84B]/20 transition-colors group w-full"
        >
            <Play className="w-4 h-4 text-[#E5A84B]" />
            <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-[#E5A84B]">Demo Mode</p>
                <p className="text-xs text-[#E5A84B]/70">Using sample data</p>
            </div>
            <Upload className="w-3 h-3 text-[#E5A84B]/50 group-hover:text-[#E5A84B] transition-colors" />
        </button>
    );
}

export default DataModeIndicator;
