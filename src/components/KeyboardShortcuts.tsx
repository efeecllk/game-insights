/**
 * Keyboard Shortcuts Provider
 * Global keyboard navigation and shortcuts
 * Phase 8: Usability & Accessibility
 * 
 * Accessibility Features:
 * - Focus trapping within modal
 * - ARIA roles and labels for dialog pattern
 * - Keyboard navigation
 * - Screen reader friendly shortcut descriptions
 * - Focus restoration on close
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusTrap, useAriaId, announceToScreenReader } from '../lib/a11y';
import { X } from 'lucide-react';

// ============================================================================
// Shortcuts Modal Component
// ============================================================================

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    
    // Generate unique IDs for ARIA
    const dialogLabelId = useAriaId('shortcuts-label');
    const dialogDescId = useAriaId('shortcuts-desc');

    // Focus trap for modal
    useFocusTrap(dialogRef, isOpen, {
        onEscape: onClose,
    });

    // Announce modal open to screen readers
    useEffect(() => {
        if (isOpen) {
            announceToScreenReader('Keyboard shortcuts dialog opened');
        }
    }, [isOpen]);

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
                { keys: ['Cmd/Ctrl', 'K'], description: 'Open command palette' },
                { keys: ['/'], description: 'Quick search' },
                { keys: ['U'], description: 'Upload data' },
                { keys: ['?'], description: 'Show keyboard shortcuts' },
            ],
        },
        {
            category: 'General',
            items: [
                { keys: ['Esc'], description: 'Close modal or cancel' },
                { keys: ['Arrow Up', 'Arrow Down'], description: 'Navigate lists' },
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
                aria-hidden="true"
            />

            {/* Modal */}
            <div 
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogLabelId}
                aria-describedby={dialogDescId}
                className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-th-bg-card border border-th-border rounded-xl shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-th-border bg-th-bg-card">
                    <h2 id={dialogLabelId} className="text-lg font-semibold text-th-text-primary">
                        Keyboard Shortcuts
                    </h2>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="p-1 hover:bg-th-bg-elevated rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-th-accent-primary"
                        aria-label="Close keyboard shortcuts dialog"
                    >
                        <X className="w-5 h-5 text-th-text-secondary" aria-hidden="true" />
                    </button>
                </div>

                <p id={dialogDescId} className="sr-only">
                    A list of keyboard shortcuts organized by category. Use Tab to navigate through shortcuts.
                </p>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {shortcuts.map((section) => (
                        <section key={section.category} aria-labelledby={'section-' + section.category.toLowerCase()}>
                            <h3 
                                id={'section-' + section.category.toLowerCase()}
                                className="text-sm font-medium text-th-text-secondary uppercase tracking-wider mb-3"
                            >
                                {section.category}
                            </h3>
                            <dl className="space-y-2">
                                {section.items.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <dt className="text-sm text-th-text-primary">
                                            {shortcut.description}
                                        </dt>
                                        <dd className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <span key={keyIndex} className="flex items-center">
                                                    <kbd className="inline-flex items-center justify-center min-w-[24px] px-2 py-1 text-xs font-medium text-th-text-secondary bg-th-bg-elevated border border-th-border rounded">
                                                        {key}
                                                    </kbd>
                                                    {keyIndex < shortcut.keys.length - 1 && (
                                                        <span className="mx-1 text-th-text-muted text-xs" aria-hidden="true">then</span>
                                                    )}
                                                </span>
                                            ))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
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
    const keySequenceRef = useRef('');
    const sequenceTimeoutRef = useRef(0);

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
