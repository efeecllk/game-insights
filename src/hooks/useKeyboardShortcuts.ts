/**
 * useKeyboardShortcuts Hook
 * Global keyboard navigation and shortcuts
 * Extracted for lazy loading of ShortcutsModal component
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
