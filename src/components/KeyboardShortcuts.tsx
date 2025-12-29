/**
 * Keyboard Shortcuts Provider
 * Global keyboard navigation and shortcuts
 * Phase 8: Usability & Accessibility
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// Shortcuts Modal Component
// ============================================================================

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const shortcuts = [
        {
            category: 'Navigation',
            items: [
                { keys: ['G', 'D'], description: 'Go to Dashboard' },
                { keys: ['G', 'A'], description: 'Go to Analytics' },
                { keys: ['G', 'R'], description: 'Go to Retention' },
                { keys: ['G', 'M'], description: 'Go to Monetization' },
                { keys: ['G', 'P'], description: 'Go to Predictions' },
                { keys: ['G', 'F'], description: 'Go to Funnels' },
                { keys: ['G', 'E'], description: 'Go to Experiments' },
                { keys: ['G', 'G'], description: 'Go to Games' },
                { keys: ['G', 'S'], description: 'Go to Settings' },
            ],
        },
        {
            category: 'Actions',
            items: [
                { keys: ['⌘', 'K'], description: 'Open command palette' },
                { keys: ['/'], description: 'Quick search' },
                { keys: ['U'], description: 'Upload data' },
                { keys: ['?'], description: 'Show keyboard shortcuts' },
            ],
        },
        {
            category: 'General',
            items: [
                { keys: ['Esc'], description: 'Close modal/cancel' },
                { keys: ['↑', '↓'], description: 'Navigate lists' },
                { keys: ['Enter'], description: 'Select item' },
                { keys: ['Tab'], description: 'Move to next element' },
            ],
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-th-bg-card border border-th-border rounded-xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-th-border bg-th-bg-card">
                    <h2 className="text-lg font-semibold text-th-text-primary">Keyboard Shortcuts</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-th-bg-elevated rounded-lg transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="w-5 h-5 text-th-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {shortcuts.map((section) => (
                        <div key={section.category}>
                            <h3 className="text-sm font-medium text-th-text-secondary uppercase tracking-wider mb-3">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.items.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <span className="text-sm text-th-text-primary">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <span key={keyIndex}>
                                                    <kbd className="inline-flex items-center justify-center min-w-[24px] px-2 py-1 text-xs font-medium text-th-text-secondary bg-th-bg-elevated border border-th-border rounded">
                                                        {key}
                                                    </kbd>
                                                    {keyIndex < shortcut.keys.length - 1 && (
                                                        <span className="mx-1 text-th-text-secondary">then</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 px-6 py-3 border-t border-th-border bg-th-bg-card text-xs text-th-text-secondary text-center">
                    Press <kbd className="px-1 py-0.5 bg-th-bg-elevated rounded border border-th-border">?</kbd> to toggle this dialog
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

interface UseKeyboardShortcutsOptions {
    onOpenCommandPalette: () => void;
    onOpenShortcuts: () => void;
}

export function useKeyboardShortcuts({
    onOpenCommandPalette,
    onOpenShortcuts,
}: UseKeyboardShortcutsOptions) {
    const navigate = useNavigate();

    // Track key sequence for two-key shortcuts (like G then D)
    const keySequenceRef = { current: '' };
    const sequenceTimeoutRef = { current: 0 };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if user is typing in an input
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
            target.isContentEditable) {
            return;
        }

        // Clear sequence after timeout
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = window.setTimeout(() => {
            keySequenceRef.current = '';
        }, 500);

        const key = e.key.toLowerCase();

        // Handle single-key shortcuts
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            // ? for shortcuts help
            if (e.key === '?') {
                e.preventDefault();
                onOpenShortcuts();
                return;
            }

            // / for search
            if (e.key === '/') {
                e.preventDefault();
                onOpenCommandPalette();
                return;
            }

            // U for upload
            if (key === 'u') {
                e.preventDefault();
                navigate('/upload');
                return;
            }

            // Two-key navigation (G then letter)
            if (key === 'g') {
                keySequenceRef.current = 'g';
                return;
            }

            // Second key in sequence
            if (keySequenceRef.current === 'g') {
                e.preventDefault();
                keySequenceRef.current = '';

                switch (key) {
                    case 'd':
                        navigate('/');
                        break;
                    case 'a':
                        navigate('/analytics');
                        break;
                    case 'r':
                        navigate('/analytics'); // Retention in analytics
                        break;
                    case 'm':
                        navigate('/monetization');
                        break;
                    case 'p':
                        navigate('/predictions');
                        break;
                    case 'f':
                        navigate('/funnels');
                        break;
                    case 'e':
                        navigate('/ab-testing');
                        break;
                    case 'g':
                        navigate('/games');
                        break;
                    case 's':
                        navigate('/settings');
                        break;
                }
            }
        }
    }, [navigate, onOpenCommandPalette, onOpenShortcuts]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            clearTimeout(sequenceTimeoutRef.current);
        };
    }, [handleKeyDown]);
}

export default ShortcutsModal;
