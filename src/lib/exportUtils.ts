/**
 * Export Utilities
 * Export dashboards and data to various formats
 * Phase 6: Polish, Power & Production
 */

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'png' | 'pdf' | 'csv' | 'json' | 'markdown';

export interface ExportOptions {
    format: ExportFormat;
    filename?: string;
    includeTitle?: boolean;
    includeTitlebar?: boolean;
    theme?: 'light' | 'dark';
    quality?: number; // 0-1 for images
    paperSize?: 'a4' | 'letter' | 'auto';
}

export interface DataExportOptions {
    format: 'csv' | 'json';
    filename?: string;
    includeHeaders?: boolean;
    dateFormat?: string;
}

// ============================================================================
// Image Export (PNG)
// ============================================================================

/**
 * Export an HTML element as PNG image
 * Note: Requires html2canvas library (npm install html2canvas)
 */
export async function exportToPNG(
    _element: HTMLElement,
    _options: ExportOptions = { format: 'png' }
): Promise<void> {
    // Note: This function requires html2canvas to be installed
    // In a full implementation, you would:
    // 1. npm install html2canvas
    // 2. Uncomment the dynamic import below

    console.warn('PNG export requires html2canvas library. Install with: npm install html2canvas');
    alert('PNG export requires additional setup. Check console for details.');

    /*
    try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(element, {
            backgroundColor: options.theme === 'light' ? '#ffffff' : '#0a0a0b',
            scale: options.quality ? options.quality * 2 : 2,
            useCORS: true,
            logging: false,
        });
        canvas.toBlob((blob: Blob | null) => {
            if (blob) downloadBlob(blob, filename);
        }, 'image/png', options.quality || 0.9);
    } catch (err) {
        console.error('PNG export failed:', err);
    }
    */
}

// ============================================================================
// PDF Export
// ============================================================================

/**
 * Export content as PDF
 * Note: Requires html2canvas and jspdf libraries
 */
export async function exportToPDF(
    _element: HTMLElement,
    _options: ExportOptions = { format: 'pdf' }
): Promise<void> {
    // Note: This function requires html2canvas and jspdf to be installed
    // In a full implementation, you would:
    // 1. npm install html2canvas jspdf
    // 2. Uncomment the dynamic import below

    console.warn('PDF export requires html2canvas and jspdf libraries. Install with: npm install html2canvas jspdf');
    alert('PDF export requires additional setup. Check console for details.');

    /*
    try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const canvas = await html2canvas(element, {
            backgroundColor: options.theme === 'light' ? '#ffffff' : '#0a0a0b',
            scale: 2,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(filename);
    } catch (err) {
        console.error('PDF export failed:', err);
    }
    */
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Export data array as CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
    data: T[],
    options: DataExportOptions = { format: 'csv' }
): void {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    const filename = options.filename || `export-${Date.now()}.csv`;
    const headers = Object.keys(data[0]);

    let csv = '';

    // Add headers
    if (options.includeHeaders !== false) {
        csv += headers.map(h => escapeCSVValue(String(h))).join(',') + '\n';
    }

    // Add rows
    for (const row of data) {
        csv += headers.map(h => escapeCSVValue(formatValue(row[h], options.dateFormat))).join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}

/**
 * Escape CSV values (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Format value for CSV export
 */
function formatValue(value: unknown, dateFormat?: string): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
        if (dateFormat) {
            return formatDate(value, dateFormat);
        }
        return value.toISOString();
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

/**
 * Simple date formatter
 */
function formatDate(date: Date, format: string): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return format
        .replace('YYYY', String(date.getFullYear()))
        .replace('MM', pad(date.getMonth() + 1))
        .replace('DD', pad(date.getDate()))
        .replace('HH', pad(date.getHours()))
        .replace('mm', pad(date.getMinutes()))
        .replace('ss', pad(date.getSeconds()));
}

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Export data as JSON file
 */
export function exportToJSON<T>(
    data: T,
    options: { filename?: string; pretty?: boolean } = {}
): void {
    const filename = options.filename || `export-${Date.now()}.json`;
    const json = options.pretty !== false
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);

    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, filename);
}

// ============================================================================
// Markdown Export
// ============================================================================

/**
 * Generate markdown report from data
 */
export function generateMarkdownReport(options: {
    title: string;
    description?: string;
    metrics?: { label: string; value: string | number; change?: number }[];
    sections?: { title: string; content: string }[];
    generatedAt?: Date;
}): string {
    let md = `# ${options.title}\n\n`;

    if (options.description) {
        md += `${options.description}\n\n`;
    }

    if (options.generatedAt) {
        md += `*Generated: ${options.generatedAt.toLocaleString()}*\n\n`;
    }

    if (options.metrics && options.metrics.length > 0) {
        md += `## Key Metrics\n\n`;
        md += `| Metric | Value | Change |\n`;
        md += `|--------|-------|--------|\n`;
        for (const m of options.metrics) {
            const change = m.change !== undefined
                ? (m.change >= 0 ? `+${m.change}%` : `${m.change}%`)
                : '-';
            md += `| ${m.label} | ${m.value} | ${change} |\n`;
        }
        md += '\n';
    }

    if (options.sections) {
        for (const section of options.sections) {
            md += `## ${section.title}\n\n`;
            md += `${section.content}\n\n`;
        }
    }

    return md;
}

/**
 * Export markdown to file
 */
export function exportToMarkdown(
    content: string,
    options: { filename?: string } = {}
): void {
    const filename = options.filename || `report-${Date.now()}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    downloadBlob(blob, filename);
}

// ============================================================================
// Shareable Links (Mock Implementation)
// ============================================================================

export interface ShareLink {
    id: string;
    url: string;
    dashboardId: string;
    createdAt: string;
    expiresAt?: string;
    password?: string;
    accessCount: number;
}

/**
 * Generate a shareable link (mock - in real app this would hit an API)
 */
export function generateShareLink(dashboardId: string, options: {
    expiresIn?: number; // hours
    password?: string;
} = {}): ShareLink {
    const id = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();

    const link: ShareLink = {
        id,
        url: `${window.location.origin}/shared/${id}`,
        dashboardId,
        createdAt: now.toISOString(),
        accessCount: 0,
    };

    if (options.expiresIn) {
        const expires = new Date(now.getTime() + options.expiresIn * 60 * 60 * 1000);
        link.expiresAt = expires.toISOString();
    }

    if (options.password) {
        link.password = options.password;
    }

    // Store in localStorage (in real app, would be server-side)
    const links = JSON.parse(localStorage.getItem('shareLinks') || '[]');
    links.push(link);
    localStorage.setItem('shareLinks', JSON.stringify(links));

    return link;
}

/**
 * Get all share links
 */
export function getShareLinks(): ShareLink[] {
    return JSON.parse(localStorage.getItem('shareLinks') || '[]');
}

/**
 * Delete a share link
 */
export function deleteShareLink(id: string): void {
    const links = getShareLinks().filter(l => l.id !== id);
    localStorage.setItem('shareLinks', JSON.stringify(links));
}

// ============================================================================
// Clipboard
// ============================================================================

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
