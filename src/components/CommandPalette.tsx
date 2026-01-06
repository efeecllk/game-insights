/**
 * Command Palette - Obsidian Analytics Design
 * Global search and navigation with Cmd+K
 * Phase 8: Usability & Accessibility
 *
 * Premium design with:
 * - Glassmorphism container
 * - Warm orange accent theme (#DA7756)
 * - Animated transitions
 * - Noise texture background
 *
 * Accessibility Features:
 * - Focus trapping within modal
 * - ARIA roles and labels for dialog pattern
 * - Keyboard navigation with arrow keys
 * - Screen reader announcements for search results
 * - Focus restoration on close
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    LayoutDashboard,
    TrendingUp,
    DollarSign,
    Brain,
    Gamepad2,
    Upload,
    Settings,
    HelpCircle,
    Keyboard,
    Filter,
    BarChart3,
    Zap,
    Database,
    FlaskConical,
    LayoutGrid,
    FileText,
} from 'lucide-react';
import { useFocusTrap, announceToScreenReader, useAriaId } from '../lib/a11y';

// ============================================================================
// Types
// ============================================================================

interface Command {
    id: string;
    name: string;
    description?: string;
    shortcut?: string;
    icon: React.ElementType;
    action: () => void;
    category: 'navigation' | 'action' | 'help';
    keywords?: string[];
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

// ============================================================================
// Command Palette Component
// ============================================================================

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    
    // Generate unique IDs for ARIA
    const dialogLabelId = useAriaId('command-palette-label');
    const dialogDescId = useAriaId('command-palette-desc');
    const listboxId = useAriaId('command-list');

    // Focus trap for modal
    useFocusTrap(dialogRef, isOpen, {
        onEscape: onClose,
        initialFocus: inputRef,
    });

    // Define all available commands
    const commands: Command[] = useMemo(() => [
        // Navigation
        {
            id: 'dashboard',
            name: 'Dashboard',
            description: 'Go to overview dashboard',
            shortcut: 'G D',
            icon: LayoutDashboard,
            action: () => { navigate('/'); onClose(); },
            category: 'navigation',
            keywords: ['home', 'overview', 'main'],
        },
        {
            id: 'analytics',
            name: 'Analytics',
            description: 'View detailed analytics',
            shortcut: 'G A',
            icon: BarChart3,
            action: () => { navigate('/analytics'); onClose(); },
            category: 'navigation',
            keywords: ['charts', 'metrics', 'data'],
        },
        {
            id: 'retention',
            name: 'Retention',
            description: 'View retention metrics',
            shortcut: 'G R',
            icon: TrendingUp,
            action: () => { navigate('/analytics'); onClose(); },
            category: 'navigation',
            keywords: ['cohort', 'd1', 'd7', 'd30'],
        },
        {
            id: 'monetization',
            name: 'Monetization',
            description: 'Revenue and purchase analytics',
            shortcut: 'G M',
            icon: DollarSign,
            action: () => { navigate('/monetization'); onClose(); },
            category: 'navigation',
            keywords: ['revenue', 'money', 'purchases', 'iap'],
        },
        {
            id: 'predictions',
            name: 'Predictions',
            description: 'AI-powered forecasts and insights',
            shortcut: 'G P',
            icon: Brain,
            action: () => { navigate('/predictions'); onClose(); },
            category: 'navigation',
            keywords: ['ai', 'forecast', 'churn', 'ltv'],
        },
        {
            id: 'funnels',
            name: 'Funnels',
            description: 'Conversion funnel analysis',
            shortcut: 'G F',
            icon: Filter,
            action: () => { navigate('/funnels'); onClose(); },
            category: 'navigation',
            keywords: ['conversion', 'dropoff', 'flow'],
        },
        {
            id: 'ab-testing',
            name: 'A/B Testing',
            description: 'Experiment management',
            shortcut: 'G E',
            icon: FlaskConical,
            action: () => { navigate('/ab-testing'); onClose(); },
            category: 'navigation',
            keywords: ['experiments', 'variants', 'test'],
        },
        {
            id: 'dashboards',
            name: 'Custom Dashboards',
            description: 'Build custom dashboards',
            icon: LayoutGrid,
            action: () => { navigate('/dashboards'); onClose(); },
            category: 'navigation',
            keywords: ['custom', 'widgets', 'builder'],
        },
        {
            id: 'games',
            name: 'Games',
            description: 'Manage your games',
            shortcut: 'G G',
            icon: Gamepad2,
            action: () => { navigate('/games'); onClose(); },
            category: 'navigation',
            keywords: ['projects', 'apps', 'switch'],
        },
        {
            id: 'data-sources',
            name: 'Data Sources',
            description: 'Manage data connections',
            icon: Database,
            action: () => { navigate('/data-sources'); onClose(); },
            category: 'navigation',
            keywords: ['integrations', 'api', 'connections'],
        },
        {
            id: 'templates',
            name: 'Templates',
            description: 'Browse dashboard templates',
            icon: FileText,
            action: () => { navigate('/templates'); onClose(); },
            category: 'navigation',
            keywords: ['marketplace', 'presets'],
        },
        {
            id: 'settings',
            name: 'Settings',
            description: 'App settings and preferences',
            shortcut: 'G S',
            icon: Settings,
            action: () => { navigate('/settings'); onClose(); },
            category: 'navigation',
            keywords: ['preferences', 'config', 'options'],
        },
        // Actions
        {
            id: 'upload',
            name: 'Upload Data',
            description: 'Upload CSV or JSON file',
            shortcut: 'U',
            icon: Upload,
            action: () => { navigate('/upload'); onClose(); },
            category: 'action',
            keywords: ['import', 'file', 'csv', 'json'],
        },
        {
            id: 'realtime',
            name: 'Realtime View',
            description: 'View live metrics',
            icon: Zap,
            action: () => { navigate('/realtime'); onClose(); },
            category: 'action',
            keywords: ['live', 'now', 'current'],
        },
        // Help
        {
            id: 'help',
            name: 'Help & Documentation',
            description: 'Get help with Game Insights',
            shortcut: '?',
            icon: HelpCircle,
            action: () => { window.open('https://docs.game-insights.dev', '_blank'); onClose(); },
            category: 'help',
            keywords: ['docs', 'guide', 'support'],
        },
        {
            id: 'shortcuts',
            name: 'Keyboard Shortcuts',
            description: 'View all keyboard shortcuts',
            icon: Keyboard,
            action: () => { /* Show shortcuts modal */ onClose(); },
            category: 'help',
            keywords: ['keys', 'hotkeys', 'bindings'],
        },
    ], [navigate, onClose]);

    // Filter commands based on query
    const filteredCommands = useMemo(() => {
        if (!query.trim()) return commands;

        const lowerQuery = query.toLowerCase();
        return commands.filter(cmd => {
            const searchText = [
                cmd.name,
                cmd.description,
                ...(cmd.keywords || []),
            ].join(' ').toLowerCase();
            return searchText.includes(lowerQuery);
        });
    }, [commands, query]);

    // Group commands by category
    const groupedCommands = useMemo(() => {
        const groups: Record<string, Command[]> = {
            navigation: [],
            action: [],
            help: [],
        };
        filteredCommands.forEach(cmd => {
            groups[cmd.category].push(cmd);
        });
        return groups;
    }, [filteredCommands]);

    // Get flat list for keyboard navigation
    const flatCommands = useMemo(() => {
        return [...groupedCommands.navigation, ...groupedCommands.action, ...groupedCommands.help];
    }, [groupedCommands]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input when opened and announce to screen readers
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
            announceToScreenReader('Command palette opened. Type to search commands.');
        }
    }, [isOpen]);

    // Announce search results to screen readers
    useEffect(() => {
        if (isOpen && query.trim()) {
            const resultCount = flatCommands.length;
            if (resultCount === 0) {
                announceToScreenReader('No commands found');
            } else {
                const plural = resultCount === 1 ? '' : 's';
                announceToScreenReader(resultCount + ' command' + plural + ' found');
            }
        }
    }, [isOpen, query, flatCommands.length]);

    // Scroll selected item into view
    useEffect(() => {
        const selectedElement = listRef.current?.querySelector('[data-index="' + selectedIndex + '"]');
        selectedElement?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (flatCommands[selectedIndex]) {
                    flatCommands[selectedIndex].action();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [flatCommands, selectedIndex, onClose]);

    if (!isOpen) return null;

    const categoryLabels: Record<string, string> = {
        navigation: 'Navigation',
        action: 'Actions',
        help: 'Help',
    };

    let globalIndex = -1;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 "
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Dialog */}
                <motion.div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={dialogLabelId}
                    aria-describedby={dialogDescId}
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-xl bg-slate-900  border border-slate-700 rounded-2xl shadow-lg overflow-hidden"
                >
                    {/* Noise texture */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                    <div className="relative">
                        {/* Hidden labels for screen readers */}
                        <h2 id={dialogLabelId} className="sr-only">
                            Command Palette
                        </h2>
                        <p id={dialogDescId} className="sr-only">
                            Search and navigate to any page or action. Use arrow keys to navigate and Enter to select.
                        </p>

                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
                            <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                <Search className="w-4 h-4 text-[#DA7756]" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                                role="combobox"
                                aria-expanded="true"
                                aria-controls={listboxId}
                                aria-activedescendant={
                                    flatCommands[selectedIndex]?.id ? 'command-' + flatCommands[selectedIndex].id : undefined
                                }
                                aria-autocomplete="list"
                                aria-label="Search commands"
                            />
                            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 bg-white/[0.03] rounded-lg border border-slate-800">
                                ESC
                            </kbd>
                        </div>

                        {/* Command List */}
                        <div
                            ref={listRef}
                            id={listboxId}
                            role="listbox"
                            aria-label="Commands"
                            className="max-h-[50vh] overflow-y-auto p-2"
                        >
                            {flatCommands.length === 0 ? (
                                <div className="py-8 text-center text-slate-500 text-sm" role="status">
                                    No commands found for "{query}"
                                </div>
                            ) : (
                                Object.entries(groupedCommands).map(([category, cmds]) => {
                                    if (cmds.length === 0) return null;
                                    return (
                                        <div key={category} className="mb-2" role="group" aria-label={categoryLabels[category]}>
                                            <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                                {categoryLabels[category]}
                                            </div>
                                            {cmds.map((cmd) => {
                                                globalIndex++;
                                                const isSelected = globalIndex === selectedIndex;
                                                const Icon = cmd.icon;
                                                const currentIndex = globalIndex;

                                                return (
                                                    <motion.button
                                                        key={cmd.id}
                                                        id={'command-' + cmd.id}
                                                        data-index={currentIndex}
                                                        role="option"
                                                        aria-selected={isSelected}
                                                        onClick={cmd.action}
                                                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                                                        whileHover={{ x: 4 }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                                            isSelected
                                                                ? 'bg-[#DA7756]/10 border border-[#DA7756]/20'
                                                                : 'border border-transparent hover:bg-white/[0.03]'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'bg-[#DA7756]/20 text-[#DA7756]'
                                                                    : 'bg-white/[0.03] text-slate-400'
                                                            }`}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className={`text-sm font-medium truncate ${
                                                                    isSelected ? 'text-white' : 'text-slate-300'
                                                                }`}
                                                            >
                                                                {cmd.name}
                                                            </div>
                                                            {cmd.description && (
                                                                <div className="text-xs text-slate-500 truncate">{cmd.description}</div>
                                                            )}
                                                        </div>
                                                        {cmd.shortcut && (
                                                            <kbd
                                                                className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border ${
                                                                    isSelected
                                                                        ? 'bg-[#DA7756]/10 border-[#DA7756]/20 text-[#DA7756]'
                                                                        : 'bg-white/[0.02] border-slate-800 text-slate-500'
                                                                }`}
                                                                aria-label={'Keyboard shortcut: ' + cmd.shortcut}
                                                            >
                                                                {cmd.shortcut}
                                                            </kbd>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-white/[0.03] rounded border border-slate-800">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 bg-white/[0.03] rounded border border-slate-800">↓</kbd>
                                    <span className="text-slate-600">navigate</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-white/[0.03] rounded border border-slate-800">↵</kbd>
                                    <span className="text-slate-600">select</span>
                                </span>
                            </div>
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 bg-white/[0.03] rounded border border-slate-800">ESC</kbd>
                                <span className="text-slate-600">close</span>
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ============================================================================
// Hook to manage command palette
// ============================================================================

export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Cmd+K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            // / to open (when not in input)
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                setIsOpen(true);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev),
    };
}

export default CommandPalette;
