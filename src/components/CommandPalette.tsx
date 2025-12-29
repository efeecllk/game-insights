/**
 * Command Palette
 * Global search and navigation with Cmd+K
 * Phase 8: Usability & Accessibility
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Scroll selected item into view
    useEffect(() => {
        const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Palette */}
            <div className="relative w-full max-w-xl bg-th-bg-card border border-th-border rounded-xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-th-border">
                    <Search className="w-5 h-5 text-th-text-secondary" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent text-th-text-primary placeholder:text-th-text-secondary outline-none text-sm"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-th-text-secondary bg-th-bg-elevated rounded border border-th-border">
                        ESC
                    </kbd>
                </div>

                {/* Command List */}
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
                    {flatCommands.length === 0 ? (
                        <div className="py-8 text-center text-th-text-secondary text-sm">
                            No commands found for "{query}"
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([category, cmds]) => {
                            if (cmds.length === 0) return null;
                            return (
                                <div key={category} className="mb-2">
                                    <div className="px-2 py-1.5 text-xs font-medium text-th-text-secondary uppercase tracking-wider">
                                        {categoryLabels[category]}
                                    </div>
                                    {cmds.map((cmd) => {
                                        globalIndex++;
                                        const isSelected = globalIndex === selectedIndex;
                                        const Icon = cmd.icon;

                                        return (
                                            <button
                                                key={cmd.id}
                                                data-index={globalIndex}
                                                onClick={cmd.action}
                                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                                                    isSelected
                                                        ? 'bg-th-accent-primary/20 text-th-text-primary'
                                                        : 'text-th-text-secondary hover:bg-th-bg-elevated'
                                                }`}
                                            >
                                                <Icon className={`w-5 h-5 ${isSelected ? 'text-th-accent-primary' : ''}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{cmd.name}</div>
                                                    {cmd.description && (
                                                        <div className="text-xs text-th-text-secondary truncate">
                                                            {cmd.description}
                                                        </div>
                                                    )}
                                                </div>
                                                {cmd.shortcut && (
                                                    <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-th-text-secondary bg-th-bg-elevated rounded border border-th-border">
                                                        {cmd.shortcut}
                                                    </kbd>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-th-border text-xs text-th-text-secondary">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-th-bg-elevated rounded border border-th-border">↑</kbd>
                            <kbd className="px-1 py-0.5 bg-th-bg-elevated rounded border border-th-border">↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-th-bg-elevated rounded border border-th-border">↵</kbd>
                            to select
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-th-bg-elevated rounded border border-th-border">ESC</kbd>
                        to close
                    </span>
                </div>
            </div>
        </div>
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
