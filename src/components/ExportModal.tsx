/**
 * Export Modal Component
 * Phase 6: Export & Sharing
 * Phase 8: Accessibility Improvements
 * 
 * Accessibility Features:
 * - Focus trapping within modal
 * - ARIA roles and labels for dialog pattern
 * - Tab panel pattern for Download/Share tabs
 * - Screen reader announcements for actions
 * - Focus restoration on close
 */

import { useState, useRef, useEffect } from 'react';
import {
    X,
    Download,
    Link2,
    Copy,
    Check,
    FileImage,
    FileText,
    Table,
    FileJson,
    Clock,
    Lock,
    ExternalLink,
    Trash2,
} from 'lucide-react';
import {
    ExportFormat,
    exportToCSV,
    exportToJSON,
    exportToMarkdown,
    generateMarkdownReport,
    generateShareLink,
    getShareLinks,
    deleteShareLink,
    copyToClipboard,
    ShareLink,
} from '../lib/exportUtils';
import { useFocusTrap, announceToScreenReader, useAriaId } from '../lib/a11y';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    data?: Record<string, unknown>[];
    dashboardId?: string;
    metrics?: { label: string; value: string | number; change?: number }[];
}

type ExportTab = 'download' | 'share';

export function ExportModal({
    isOpen,
    onClose,
    title,
    description,
    data,
    dashboardId,
    metrics,
}: ExportModalProps) {
    const [activeTab, setActiveTab] = useState<ExportTab>('download');
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
    const [copied, setCopied] = useState(false);
    const [shareLinks, setShareLinks] = useState<ShareLink[]>(() => getShareLinks());
    const [shareOptions, setShareOptions] = useState({
        expiresIn: 24,
        password: '',
    });
    const [newLink, setNewLink] = useState<ShareLink | null>(null);
    
    // Refs for focus management
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    
    // Generate unique IDs for ARIA
    const dialogLabelId = useAriaId('export-modal-label');
    const dialogDescId = useAriaId('export-modal-desc');
    const tablistId = useAriaId('export-tabs');
    const downloadPanelId = useAriaId('download-panel');
    const sharePanelId = useAriaId('share-panel');

    // Focus trap for modal
    useFocusTrap(dialogRef, isOpen, {
        onEscape: onClose,
    });
    
    // Announce modal open to screen readers
    useEffect(() => {
        if (isOpen) {
            announceToScreenReader('Export and Share dialog opened for ' + title);
        }
    }, [isOpen, title]);

    if (!isOpen) return null;

    const exportFormats: { format: ExportFormat; icon: typeof FileImage; label: string; description: string }[] = [
        { format: 'csv', icon: Table, label: 'CSV', description: 'Spreadsheet format' },
        { format: 'json', icon: FileJson, label: 'JSON', description: 'Raw data format' },
        { format: 'markdown', icon: FileText, label: 'Markdown', description: 'Report format' },
        { format: 'png', icon: FileImage, label: 'PNG', description: 'Image snapshot' },
        { format: 'pdf', icon: FileText, label: 'PDF', description: 'Document format' },
    ];

    const handleExport = () => {
        const filename = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

        switch (selectedFormat) {
            case 'csv':
                if (data && data.length > 0) {
                    exportToCSV(data, { format: 'csv', filename: filename + '.csv' });
                    announceToScreenReader('Exporting data as CSV file');
                }
                break;
            case 'json':
                exportToJSON(
                    { title, description, data, metrics, exportedAt: new Date().toISOString() },
                    { filename: filename + '.json' }
                );
                announceToScreenReader('Exporting data as JSON file');
                break;
            case 'markdown':
                const md = generateMarkdownReport({
                    title,
                    description,
                    metrics,
                    generatedAt: new Date(),
                });
                exportToMarkdown(md, { filename: filename + '.md' });
                announceToScreenReader('Exporting data as Markdown file');
                break;
            case 'png':
            case 'pdf':
                alert(selectedFormat.toUpperCase() + ' export requires additional libraries. See console for setup instructions.');
                console.log('To enable ' + selectedFormat.toUpperCase() + ' export, install: npm install html2canvas' + (selectedFormat === 'pdf' ? ' jspdf' : ''));
                break;
        }
    };

    const handleCreateShareLink = () => {
        if (!dashboardId) return;

        const link = generateShareLink(dashboardId, {
            expiresIn: shareOptions.expiresIn || undefined,
            password: shareOptions.password || undefined,
        });

        setNewLink(link);
        setShareLinks(getShareLinks());
        announceToScreenReader('Share link created successfully');
    };

    const handleCopyLink = async (url: string) => {
        const success = await copyToClipboard(url);
        if (success) {
            setCopied(true);
            announceToScreenReader('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteLink = (id: string) => {
        deleteShareLink(id);
        setShareLinks(getShareLinks());
        if (newLink?.id === id) {
            setNewLink(null);
        }
        announceToScreenReader('Share link deleted');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div 
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogLabelId}
                aria-describedby={dialogDescId}
                className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-lg mx-4 shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center" aria-hidden="true">
                            <Download className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 id={dialogLabelId} className="text-lg font-semibold text-white">Export & Share</h2>
                            <p id={dialogDescId} className="text-sm text-zinc-500">{title}</p>
                        </div>
                    </div>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5 text-zinc-400" aria-hidden="true" />
                    </button>
                </div>

                {/* Tabs */}
                <div 
                    role="tablist" 
                    id={tablistId}
                    aria-label="Export options"
                    className="flex border-b border-white/10"
                >
                    <button
                        role="tab"
                        id="download-tab"
                        aria-selected={activeTab === 'download'}
                        aria-controls={downloadPanelId}
                        tabIndex={activeTab === 'download' ? 0 : -1}
                        onClick={() => setActiveTab('download')}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowRight') {
                                setActiveTab('share');
                            }
                        }}
                        className={'flex-1 px-4 py-3 text-sm font-medium transition-colors ' + (
                            activeTab === 'download'
                                ? 'text-violet-400 border-b-2 border-violet-400'
                                : 'text-zinc-500 hover:text-zinc-300'
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" aria-hidden="true" />
                            Download
                        </div>
                    </button>
                    <button
                        role="tab"
                        id="share-tab"
                        aria-selected={activeTab === 'share'}
                        aria-controls={sharePanelId}
                        tabIndex={activeTab === 'share' ? 0 : -1}
                        onClick={() => setActiveTab('share')}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') {
                                setActiveTab('download');
                            }
                        }}
                        className={'flex-1 px-4 py-3 text-sm font-medium transition-colors ' + (
                            activeTab === 'share'
                                ? 'text-violet-400 border-b-2 border-violet-400'
                                : 'text-zinc-500 hover:text-zinc-300'
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Link2 className="w-4 h-4" aria-hidden="true" />
                            Share Link
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeTab === 'download' ? (
                        <div 
                            role="tabpanel"
                            id={downloadPanelId}
                            aria-labelledby="download-tab"
                            className="space-y-4"
                        >
                            {/* Format Selection */}
                            <fieldset>
                                <legend className="block text-sm font-medium text-zinc-400 mb-2">
                                    Export Format
                                </legend>
                                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                                    {exportFormats.map(({ format, icon: Icon, label, description: desc }) => (
                                        <button
                                            key={format}
                                            role="radio"
                                            aria-checked={selectedFormat === format}
                                            onClick={() => setSelectedFormat(format)}
                                            className={'p-3 rounded-xl border transition-all text-left ' + (
                                                selectedFormat === format
                                                    ? 'border-violet-500 bg-violet-500/10'
                                                    : 'border-white/10 hover:border-white/20 bg-white/5'
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon className={'w-4 h-4 ' + (
                                                    selectedFormat === format ? 'text-violet-400' : 'text-zinc-500'
                                                )} aria-hidden="true" />
                                                <span className={'font-medium ' + (
                                                    selectedFormat === format ? 'text-white' : 'text-zinc-300'
                                                )}>
                                                    {label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1">{desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            {/* Export Info */}
                            {(selectedFormat === 'png' || selectedFormat === 'pdf') && (
                                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20" role="alert">
                                    <p className="text-sm text-yellow-400">
                                        {selectedFormat.toUpperCase()} export requires additional setup.
                                        Install the required libraries first.
                                    </p>
                                </div>
                            )}

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" aria-hidden="true" />
                                Export as {selectedFormat.toUpperCase()}
                            </button>
                        </div>
                    ) : (
                        <div 
                            role="tabpanel"
                            id={sharePanelId}
                            aria-labelledby="share-tab"
                            className="space-y-4"
                        >
                            {dashboardId ? (
                                <>
                                    {/* Share Options */}
                                    <div className="space-y-3">
                                        <div>
                                            <label htmlFor="expires-select" className="block text-sm font-medium text-zinc-400 mb-2">
                                                <Clock className="w-4 h-4 inline mr-1" aria-hidden="true" />
                                                Link Expires In
                                            </label>
                                            <select
                                                id="expires-select"
                                                value={shareOptions.expiresIn}
                                                onChange={(e) => setShareOptions(prev => ({
                                                    ...prev,
                                                    expiresIn: Number(e.target.value)
                                                }))}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                                            >
                                                <option value={1}>1 hour</option>
                                                <option value={24}>24 hours</option>
                                                <option value={168}>7 days</option>
                                                <option value={720}>30 days</option>
                                                <option value={0}>Never</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="password-input" className="block text-sm font-medium text-zinc-400 mb-2">
                                                <Lock className="w-4 h-4 inline mr-1" aria-hidden="true" />
                                                Password Protection (optional)
                                            </label>
                                            <input
                                                id="password-input"
                                                type="password"
                                                value={shareOptions.password}
                                                onChange={(e) => setShareOptions(prev => ({
                                                    ...prev,
                                                    password: e.target.value
                                                }))}
                                                placeholder="Enter password"
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Generate Link Button */}
                                    <button
                                        onClick={handleCreateShareLink}
                                        className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Link2 className="w-4 h-4" aria-hidden="true" />
                                        Generate Share Link
                                    </button>

                                    {/* New Link Display */}
                                    {newLink && (
                                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20" role="status" aria-live="polite">
                                            <p className="text-sm text-green-400 mb-2">Link created!</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={newLink.url}
                                                    readOnly
                                                    aria-label="Share link URL"
                                                    className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm"
                                                />
                                                <button
                                                    onClick={() => handleCopyLink(newLink.url)}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                    aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-white" aria-hidden="true" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Existing Links */}
                                    {shareLinks.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-zinc-400 mb-2">
                                                Active Links
                                            </h3>
                                            <ul className="space-y-2 max-h-40 overflow-y-auto" aria-label="Active share links">
                                                {shareLinks.filter(l => l.dashboardId === dashboardId).map(link => (
                                                    <li
                                                        key={link.id}
                                                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <ExternalLink className="w-4 h-4 text-zinc-500 flex-shrink-0" aria-hidden="true" />
                                                            <span className="text-sm text-zinc-300 truncate">
                                                                {link.url}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                            <button
                                                                onClick={() => handleCopyLink(link.url)}
                                                                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                                                aria-label="Copy link"
                                                            >
                                                                <Copy className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLink(link.id)}
                                                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                                                                aria-label="Delete link"
                                                            >
                                                                <Trash2 className="w-3 h-3 text-red-400" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <Link2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" aria-hidden="true" />
                                    <p className="text-zinc-500">
                                        Share links are only available for dashboards
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
