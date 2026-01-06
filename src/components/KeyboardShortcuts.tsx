/**
 * Keyboard Shortcuts Provider - Obsidian Analytics Design
 * Global keyboard navigation and shortcuts
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
 * - Keyboard navigation
 * - Screen reader friendly shortcut descriptions
 * - Focus restoration on close
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap, useAriaId, announceToScreenReader } from '../lib/a11y';
import { X, Keyboard } from 'lucide-react';

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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
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

                {/* Modal */}
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
                    className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-slate-900  border border-slate-700 rounded-2xl shadow-lg"
                >
                    {/* Noise texture */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

                    <div className="relative max-h-[80vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 ">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                    className="relative"
                                >
                                    <div className="absolute inset-0 bg-[#DA7756]/20 rounded-xl blur-lg" />
                                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#DA7756]/20 to-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                        <Keyboard className="w-5 h-5 text-[#DA7756]" />
                                    </div>
                                </motion.div>
                                <h2 id={dialogLabelId} className="text-lg font-semibold text-white">
                                    Keyboard Shortcuts
                                </h2>
                            </div>
                            <motion.button
                                ref={closeButtonRef}
                                onClick={onClose}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                                aria-label="Close keyboard shortcuts dialog"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </motion.button>
                        </div>

                        <p id={dialogDescId} className="sr-only">
                            A list of keyboard shortcuts organized by category. Use Tab to navigate through shortcuts.
                        </p>

                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 space-y-6"
                        >
                            {shortcuts.map((section, sectionIndex) => (
                                <motion.section
                                    key={section.category}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: sectionIndex * 0.1 + 0.2 }}
                                    aria-labelledby={'section-' + section.category.toLowerCase()}
                                >
                                    <h3
                                        id={'section-' + section.category.toLowerCase()}
                                        className="text-[10px] font-semibold text-[#DA7756] uppercase tracking-wider mb-3"
                                    >
                                        {section.category}
                                    </h3>
                                    <dl className="space-y-1">
                                        {section.items.map((shortcut, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                                            >
                                                <dt className="text-sm text-slate-300">{shortcut.description}</dt>
                                                <dd className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, keyIndex) => (
                                                        <span key={keyIndex} className="flex items-center">
                                                            <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-1.5 text-xs font-medium text-slate-300 bg-white/[0.03] border border-slate-700 rounded-lg">
                                                                {key}
                                                            </kbd>
                                                            {keyIndex < shortcut.keys.length - 1 && (
                                                                <span className="mx-1.5 text-slate-600 text-xs">then</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </motion.section>
                            ))}
                        </motion.div>

                        {/* Footer */}
                        <div className="sticky bottom-0 px-6 py-3 border-t border-slate-800 bg-slate-900/80  text-xs text-slate-500 text-center">
                            Press{' '}
                            <kbd className="px-2 py-1 bg-white/[0.03] rounded-lg border border-slate-800 text-[#DA7756]">
                                ?
                            </kbd>{' '}
                            to toggle this dialog
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
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
