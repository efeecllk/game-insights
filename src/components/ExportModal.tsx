/**
 * Export Modal Component - Obsidian Analytics Design
 * Phase 6: Export & Sharing
 * Phase 8: Accessibility Improvements
 *
 * Premium modal with:
 * - Glassmorphism effects with depth
 * - Warm orange accent theme (#DA7756)
 * - Animated transitions
 * - Noise texture backgrounds
 *
 * Accessibility Features:
 * - Focus trapping within modal
 * - ARIA roles and labels for dialog pattern
 * - Tab panel pattern for Download/Share tabs
 * - Screen reader announcements for actions
 * - Focus restoration on close
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={dialogLabelId}
                    aria-describedby={dialogDescId}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
                >
                    {/* Noise texture */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                    <div className="relative">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                    className="relative"
                                >
                                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-xl blur-lg" />
                                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#DA7756]/20 to-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                        <Download className="w-5 h-5 text-[#DA7756]" />
                                    </div>
                                </motion.div>
                                <div>
                                    <h2 id={dialogLabelId} className="text-lg font-semibold text-white">Export & Share</h2>
                                    <p id={dialogDescId} className="text-sm text-slate-500">{title}</p>
                                </div>
                            </div>
                            <motion.button
                                ref={closeButtonRef}
                                onClick={onClose}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                                aria-label="Close dialog"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </motion.button>
                        </div>

                        {/* Tabs */}
                        <div
                            role="tablist"
                            id={tablistId}
                            aria-label="Export options"
                            className="flex border-b border-white/[0.06]"
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
                                className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'download'
                                        ? 'text-[#DA7756]'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {activeTab === 'download' && (
                                    <motion.div
                                        layoutId="exportTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DA7756]"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <div className="flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
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
                                className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'share'
                                        ? 'text-[#DA7756]'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {activeTab === 'share' && (
                                    <motion.div
                                        layoutId="exportTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DA7756]"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <div className="flex items-center justify-center gap-2">
                                    <Link2 className="w-4 h-4" />
                                    Share Link
                                </div>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            {activeTab === 'download' ? (
                                <motion.div
                                    role="tabpanel"
                                    id={downloadPanelId}
                                    aria-labelledby="download-tab"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    {/* Format Selection */}
                                    <fieldset>
                                        <legend className="block text-sm font-medium text-slate-400 mb-3">
                                            Export Format
                                        </legend>
                                        <div className="grid grid-cols-2 gap-2" role="radiogroup">
                                            {exportFormats.map(({ format, icon: Icon, label, description: desc }) => (
                                                <motion.button
                                                    key={format}
                                                    role="radio"
                                                    aria-checked={selectedFormat === format}
                                                    onClick={() => setSelectedFormat(format)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`p-3 rounded-xl border transition-all text-left ${
                                                        selectedFormat === format
                                                            ? 'border-[#DA7756]/30 bg-[#DA7756]/10'
                                                            : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon
                                                            className={`w-4 h-4 ${
                                                                selectedFormat === format ? 'text-[#DA7756]' : 'text-slate-500'
                                                            }`}
                                                        />
                                                        <span
                                                            className={`font-medium ${
                                                                selectedFormat === format ? 'text-white' : 'text-slate-300'
                                                            }`}
                                                        >
                                                            {label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </fieldset>

                                    {/* Export Info */}
                                    {(selectedFormat === 'png' || selectedFormat === 'pdf') && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                                            role="alert"
                                        >
                                            <p className="text-sm text-amber-400">
                                                {selectedFormat.toUpperCase()} export requires additional setup.
                                                Install the required libraries first.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Export Button */}
                                    <motion.button
                                        onClick={handleExport}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-3 bg-[#DA7756]/20 border border-[#DA7756]/30 hover:bg-[#DA7756]/30 text-[#DA7756] font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export as {selectedFormat.toUpperCase()}
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    role="tabpanel"
                                    id={sharePanelId}
                                    aria-labelledby="share-tab"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    {dashboardId ? (
                                        <>
                                            {/* Share Options */}
                                            <div className="space-y-3">
                                                <div>
                                                    <label htmlFor="expires-select" className="block text-sm font-medium text-slate-400 mb-2">
                                                        <Clock className="w-4 h-4 inline mr-1" />
                                                        Link Expires In
                                                    </label>
                                                    <select
                                                        id="expires-select"
                                                        value={shareOptions.expiresIn}
                                                        onChange={(e) =>
                                                            setShareOptions((prev) => ({
                                                                ...prev,
                                                                expiresIn: Number(e.target.value),
                                                            }))
                                                        }
                                                        className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#DA7756]/50 focus:bg-white/[0.05] transition-all"
                                                    >
                                                        <option value={1}>1 hour</option>
                                                        <option value={24}>24 hours</option>
                                                        <option value={168}>7 days</option>
                                                        <option value={720}>30 days</option>
                                                        <option value={0}>Never</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label htmlFor="password-input" className="block text-sm font-medium text-slate-400 mb-2">
                                                        <Lock className="w-4 h-4 inline mr-1" />
                                                        Password Protection (optional)
                                                    </label>
                                                    <input
                                                        id="password-input"
                                                        type="password"
                                                        value={shareOptions.password}
                                                        onChange={(e) =>
                                                            setShareOptions((prev) => ({
                                                                ...prev,
                                                                password: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Enter password"
                                                        className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#DA7756]/50 focus:bg-white/[0.05] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Generate Link Button */}
                                            <motion.button
                                                onClick={handleCreateShareLink}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-3 bg-[#DA7756]/20 border border-[#DA7756]/30 hover:bg-[#DA7756]/30 text-[#DA7756] font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Link2 className="w-4 h-4" />
                                                Generate Share Link
                                            </motion.button>

                                            {/* New Link Display */}
                                            {newLink && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-3 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20"
                                                    role="status"
                                                    aria-live="polite"
                                                >
                                                    <p className="text-sm text-[#DA7756] mb-2">Link created!</p>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={newLink.url}
                                                            readOnly
                                                            aria-label="Share link URL"
                                                            className="flex-1 px-3 py-2 bg-black/30 border border-white/[0.06] rounded-lg text-white text-sm font-mono"
                                                        />
                                                        <motion.button
                                                            onClick={() => handleCopyLink(newLink.url)}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors"
                                                            aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
                                                        >
                                                            {copied ? (
                                                                <Check className="w-4 h-4 text-[#DA7756]" />
                                                            ) : (
                                                                <Copy className="w-4 h-4 text-white" />
                                                            )}
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Existing Links */}
                                            {shareLinks.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-medium text-slate-400 mb-2">Active Links</h3>
                                                    <ul className="space-y-2 max-h-40 overflow-y-auto" aria-label="Active share links">
                                                        {shareLinks
                                                            .filter((l) => l.dashboardId === dashboardId)
                                                            .map((link) => (
                                                                <motion.li
                                                                    key={link.id}
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg border border-white/[0.04]"
                                                                >
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                        <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                                                        <span className="text-sm text-slate-300 truncate font-mono">
                                                                            {link.url}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                                        <button
                                                                            onClick={() => handleCopyLink(link.url)}
                                                                            className="p-1.5 hover:bg-white/[0.05] rounded transition-colors"
                                                                            aria-label="Copy link"
                                                                        >
                                                                            <Copy className="w-3 h-3 text-slate-400" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteLink(link.id)}
                                                                            className="p-1.5 hover:bg-rose-500/20 rounded transition-colors"
                                                                            aria-label="Delete link"
                                                                        >
                                                                            <Trash2 className="w-3 h-3 text-rose-400" />
                                                                        </button>
                                                                    </div>
                                                                </motion.li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/[0.06] mx-auto mb-4 flex items-center justify-center">
                                                <Link2 className="w-8 h-8 text-slate-600" />
                                            </div>
                                            <p className="text-slate-500">Share links are only available for dashboards</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
