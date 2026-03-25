import {
    FileSpreadsheet,
    FileText,
    Database,
    type LucideIcon,
} from 'lucide-react';

import type { FileFormat } from '../../lib/importers';

export interface UploadFormatInfo {
    icon: LucideIcon;
    name: string;
    extensions: string;
    description: string;
    maxSize: string;
}

export const UPLOAD_FORMAT_INFO: UploadFormatInfo[] = [
    {
        icon: FileSpreadsheet,
        name: 'CSV / Excel',
        extensions: '.csv, .xlsx, .xls',
        description: 'Tabular data with headers',
        maxSize: 'Unlimited (streaming for 50MB+)',
    },
    {
        icon: FileText,
        name: 'JSON',
        extensions: '.json',
        description: 'Array of objects',
        maxSize: '50MB',
    },
    {
        icon: Database,
        name: 'SQLite',
        extensions: '.db, .sqlite',
        description: 'Database files',
        maxSize: '50MB',
    },
];

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileFormatIcon(format: FileFormat) {
    switch (format) {
        case 'csv':
        case 'tsv':
        case 'xlsx':
        case 'xls':
            return FileSpreadsheet;
        case 'json':
        case 'ndjson':
            return FileText;
        case 'sqlite':
            return Database;
        default:
            return FileText;
    }
}

export function getFileFormatColor(format: FileFormat): string {
    switch (format) {
        case 'csv':
        case 'tsv':
        case 'xlsx':
        case 'xls':
            return 'text-th-accent-primary';
        case 'json':
        case 'ndjson':
            return 'text-th-warning';
        case 'sqlite':
            return 'text-th-chart-5';
        default:
            return 'text-th-text-muted';
    }
}
