import { FileSpreadsheet, TableProperties, Wand2, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type UploadStep = 'upload' | 'preview' | 'analyzing' | 'review' | 'complete';

export interface UploadHintGroup {
    title: string;
    hints: string[];
}

export interface UploadHowItWorksStep {
    step: number;
    icon: LucideIcon;
    title: string;
    description: string;
}

export interface UploadSampleDownload {
    name: string;
    file: string;
}

export const UPLOAD_STEP_HINTS: Record<UploadStep, UploadHintGroup> = {
    upload: {
        title: 'Upload Your Data',
        hints: [
            'Supported formats: CSV, Excel (.xlsx), JSON, and SQLite databases',
            'Your data should include columns like user_id, timestamp, and event_type',
            'Files up to 50MB are processed instantly; larger files use streaming',
            'Drag and drop works, or click to browse your files',
        ],
    },
    preview: {
        title: 'Preview Your Data',
        hints: [
            'Review the data quality score to understand data completeness',
            'Check column statistics to verify data was parsed correctly',
            'Look for any warnings or issues that might affect analysis',
            'We analyze a sample of your data (up to 1,000 rows) for speed',
        ],
    },
    analyzing: {
        title: 'AI Analysis in Progress',
        hints: [
            'Detecting your game type based on column patterns',
            'Identifying metrics (revenue, scores) and dimensions (countries, platforms)',
            'Mapping columns to standard analytics schema',
            'Calculating data quality and suggesting visualizations',
        ],
    },
    review: {
        title: 'Review Column Mappings',
        hints: [
            'Verify the detected game type matches your game genre',
            'Adjust column roles if the AI made incorrect assumptions',
            'Check the confidence score - lower scores may need manual review',
            'Click on any column to change its mapping or role',
        ],
    },
    complete: {
        title: 'Ready for Analytics',
        hints: ['Your data has been processed and is ready for visualization'],
    },
};

export const UPLOAD_HOW_IT_WORKS_STEPS: UploadHowItWorksStep[] = [
    {
        step: 1,
        icon: FileSpreadsheet,
        title: 'Upload File',
        description: 'Upload your CSV, Excel, or JSON file with game analytics data',
    },
    {
        step: 2,
        icon: TableProperties,
        title: 'Preview Data',
        description: 'Review your data structure and quality before analysis',
    },
    {
        step: 3,
        icon: Wand2,
        title: 'AI Analysis',
        description: 'Our AI detects game type and maps columns automatically',
    },
    {
        step: 4,
        icon: CheckCircle,
        title: 'Review & Confirm',
        description: 'Verify mappings and customize as needed before import',
    },
];

export const UPLOAD_SAMPLE_DOWNLOADS: UploadSampleDownload[] = [
    { name: 'Puzzle Game', file: 'puzzle_game_analytics.csv' },
    { name: 'Idle Clicker', file: 'idle_clicker_analytics.csv' },
    { name: 'Battle Royale', file: 'battle_royale_analytics.csv' },
    { name: 'Gacha RPG', file: 'gacha_rpg_analytics.csv' },
    { name: 'Match3 Meta', file: 'match3_meta_analytics.csv' },
];

export function mapColumnTypeToDataType(type: string): 'string' | 'number' | 'boolean' | 'date' {
    switch (type) {
        case 'number':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'date':
            return 'date';
        default:
            return 'string';
    }
}
