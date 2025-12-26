/**
 * Export Modal Component
 * Phase 6: Export & Sharing
 */

import { useState } from 'react';
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

    if (!isOpen) return null;

    const exportFormats: { format: ExportFormat; icon: typeof FileImage; label: string; description: string }[] = [
        { format: 'csv', icon: Table, label: 'CSV', description: 'Spreadsheet format' },
        { format: 'json', icon: FileJson, label: 'JSON', description: 'Raw data format' },
        { format: 'markdown', icon: FileText, label: 'Markdown', description: 'Report format' },
        { format: 'png', icon: FileImage, label: 'PNG', description: 'Image snapshot' },
        { format: 'pdf', icon: FileText, label: 'PDF', description: 'Document format' },
    ];

    const handleExport = () => {
        const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

        switch (selectedFormat) {
            case 'csv':
                if (data && data.length > 0) {
                    exportToCSV(data, { format: 'csv', filename: `${filename}.csv` });
                }
                break;
            case 'json':
                exportToJSON(
                    { title, description, data, metrics, exportedAt: new Date().toISOString() },
                    { filename: `${filename}.json` }
                );
                break;
            case 'markdown':
                const md = generateMarkdownReport({
                    title,
                    description,
                    metrics,
                    generatedAt: new Date(),
                });
                exportToMarkdown(md, { filename: `${filename}.md` });
                break;
            case 'png':
            case 'pdf':
                alert(`${selectedFormat.toUpperCase()} export requires additional libraries. See console for setup instructions.`);
                console.log(`To enable ${selectedFormat.toUpperCase()} export, install: npm install html2canvas${selectedFormat === 'pdf' ? ' jspdf' : ''}`);
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
    };

    const handleCopyLink = async (url: string) => {
        const success = await copyToClipboard(url);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteLink = (id: string) => {
        deleteShareLink(id);
        setShareLinks(getShareLinks());
        if (newLink?.id === id) {
            setNewLink(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-lg mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <Download className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Export & Share</h2>
                            <p className="text-sm text-zinc-500">{title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('download')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'download'
                                ? 'text-violet-400 border-b-2 border-violet-400'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" />
                            Download
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('share')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'share'
                                ? 'text-violet-400 border-b-2 border-violet-400'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Link2 className="w-4 h-4" />
                            Share Link
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeTab === 'download' ? (
                        <div className="space-y-4">
                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Export Format
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {exportFormats.map(({ format, icon: Icon, label, description }) => (
                                        <button
                                            key={format}
                                            onClick={() => setSelectedFormat(format)}
                                            className={`p-3 rounded-xl border transition-all text-left ${
                                                selectedFormat === format
                                                    ? 'border-violet-500 bg-violet-500/10'
                                                    : 'border-white/10 hover:border-white/20 bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-4 h-4 ${
                                                    selectedFormat === format ? 'text-violet-400' : 'text-zinc-500'
                                                }`} />
                                                <span className={`font-medium ${
                                                    selectedFormat === format ? 'text-white' : 'text-zinc-300'
                                                }`}>
                                                    {label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1">{description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Export Info */}
                            {(selectedFormat === 'png' || selectedFormat === 'pdf') && (
                                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
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
                                <Download className="w-4 h-4" />
                                Export as {selectedFormat.toUpperCase()}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dashboardId ? (
                                <>
                                    {/* Share Options */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                                <Clock className="w-4 h-4 inline mr-1" />
                                                Link Expires In
                                            </label>
                                            <select
                                                value={shareOptions.expiresIn}
                                                onChange={(e) => setShareOptions(prev => ({
                                                    ...prev,
                                                    expiresIn: Number(e.target.value)
                                                }))}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500"
                                            >
                                                <option value={1}>1 hour</option>
                                                <option value={24}>24 hours</option>
                                                <option value={168}>7 days</option>
                                                <option value={720}>30 days</option>
                                                <option value={0}>Never</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                                <Lock className="w-4 h-4 inline mr-1" />
                                                Password Protection (optional)
                                            </label>
                                            <input
                                                type="password"
                                                value={shareOptions.password}
                                                onChange={(e) => setShareOptions(prev => ({
                                                    ...prev,
                                                    password: e.target.value
                                                }))}
                                                placeholder="Enter password"
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Generate Link Button */}
                                    <button
                                        onClick={handleCreateShareLink}
                                        className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Link2 className="w-4 h-4" />
                                        Generate Share Link
                                    </button>

                                    {/* New Link Display */}
                                    {newLink && (
                                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                            <p className="text-sm text-green-400 mb-2">Link created!</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={newLink.url}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm"
                                                />
                                                <button
                                                    onClick={() => handleCopyLink(newLink.url)}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-white" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Existing Links */}
                                    {shareLinks.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-zinc-400 mb-2">
                                                Active Links
                                            </h4>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {shareLinks.filter(l => l.dashboardId === dashboardId).map(link => (
                                                    <div
                                                        key={link.id}
                                                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <ExternalLink className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                                            <span className="text-sm text-zinc-300 truncate">
                                                                {link.url}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                            <button
                                                                onClick={() => handleCopyLink(link.url)}
                                                                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <Copy className="w-3 h-3 text-zinc-400" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLink(link.id)}
                                                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3 text-red-400" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <Link2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
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
