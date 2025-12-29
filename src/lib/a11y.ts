/**
 * Accessibility Utilities
 * Phase 8: Usability & Accessibility
 * 
 * Provides utility functions and hooks for WCAG 2.1 compliance:
 * - Screen reader announcements via live regions
 * - Focus trapping for modals and dialogs
 * - Reduced motion preference detection
 */

import { useEffect, useState, useCallback, useRef, RefObject } from 'react';

// ============================================================================
// Screen Reader Announcements
// ============================================================================

/**
 * Announces a message to screen readers using an ARIA live region.
 * Creates a temporary visually hidden element that screen readers will read.
 * 
 * @param message - The message to announce
 * @param priority - 'polite' (waits for pause) or 'assertive' (interrupts)
 */
export function announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
): void {
    // Check if we already have a live region
    let liveRegion = document.getElementById('a11y-live-region');
    
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'a11y-live-region';
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.setAttribute('role', 'status');
        // Visually hidden but accessible to screen readers
        liveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        document.body.appendChild(liveRegion);
    }
    
    // Update the priority if needed
    liveRegion.setAttribute('aria-live', priority);
    
    // Clear and set new message (screen readers detect the change)
    liveRegion.textContent = '';
    // Use setTimeout to ensure the DOM change is detected
    setTimeout(() => {
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }, 100);
}

// ============================================================================
// Focus Trapping
// ============================================================================

/**
 * Gets all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]',
        'audio[controls]',
        'video[controls]',
        'details>summary:first-of-type',
    ].join(',');
    
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
    
    // Filter out elements that are not visible
    return elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               el.offsetParent !== null;
    });
}

/**
 * Traps focus within a container element.
 * Returns a cleanup function to remove the trap.
 * 
 * @param container - The element to trap focus within
 * @returns Cleanup function
 */
export function trapFocus(container: HTMLElement): () => void {
    const focusableElements = getFocusableElements(container);
    const firstFocusable = focusableElements[0];

    // Store the previously focused element to restore later
    const previouslyFocused = document.activeElement as HTMLElement | null;
    
    // Focus the first focusable element
    if (firstFocusable) {
        firstFocusable.focus();
    }
    
    function handleKeyDown(e: KeyboardEvent) {
        if (e.key !== 'Tab') return;
        
        // Refresh the list in case elements changed
        const currentFocusable = getFocusableElements(container);
        const first = currentFocusable[0];
        const last = currentFocusable[currentFocusable.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab: if on first element, go to last
            if (document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            }
        } else {
            // Tab: if on last element, go to first
            if (document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        }
    }
    
    // Handle focus trying to escape the container
    function handleFocusIn(e: FocusEvent) {
        const target = e.target as HTMLElement;
        if (!container.contains(target)) {
            e.stopPropagation();
            firstFocusable?.focus();
        }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    
    // Return cleanup function
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('focusin', handleFocusIn);
        
        // Restore focus to the previously focused element
        if (previouslyFocused && previouslyFocused.focus) {
            previouslyFocused.focus();
        }
    };
}

// ============================================================================
// Focus Trap Hook
// ============================================================================

/**
 * Hook to manage focus trapping in a modal or dialog
 * 
 * @param containerRef - Ref to the container element
 * @param isActive - Whether the focus trap should be active
 * @param options - Configuration options
 */
export function useFocusTrap(
    containerRef: RefObject<HTMLElement>,
    isActive: boolean,
    options: {
        /** Called when Escape is pressed */
        onEscape?: () => void;
        /** Initial element to focus (defaults to first focusable) */
        initialFocus?: RefObject<HTMLElement>;
        /** Element to return focus to when deactivated */
        returnFocus?: RefObject<HTMLElement>;
    } = {}
): void {
    const { onEscape, initialFocus, returnFocus } = options;
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    
    useEffect(() => {
        if (!isActive || !containerRef.current) return;
        
        const container = containerRef.current;
        
        // Store the currently focused element
        previouslyFocusedRef.current = document.activeElement as HTMLElement;
        
        // Focus initial element or first focusable
        if (initialFocus?.current) {
            initialFocus.current.focus();
        } else {
            const focusable = getFocusableElements(container);
            if (focusable.length > 0) {
                focusable[0].focus();
            }
        }
        
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && onEscape) {
                e.preventDefault();
                onEscape();
                return;
            }
            
            if (e.key !== 'Tab') return;
            
            const focusable = getFocusableElements(container);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        }
        
        function handleFocusIn(e: FocusEvent) {
            const target = e.target as HTMLElement;
            if (!container.contains(target)) {
                e.stopPropagation();
                const focusable = getFocusableElements(container);
                focusable[0]?.focus();
            }
        }
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('focusin', handleFocusIn);
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('focusin', handleFocusIn);
            
            // Return focus
            const targetElement = returnFocus?.current || previouslyFocusedRef.current;
            if (targetElement && targetElement.focus) {
                targetElement.focus();
            }
        };
    }, [isActive, containerRef, onEscape, initialFocus, returnFocus]);
}

// ============================================================================
// Reduced Motion Hook
// ============================================================================

/**
 * Hook to detect if the user prefers reduced motion.
 * Useful for disabling animations for users with vestibular disorders.
 * 
 * @returns boolean - true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        // Check on initial render (SSR safe)
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        function handleChange(event: MediaQueryListEvent) {
            setPrefersReducedMotion(event.matches);
        }
        
        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
        // Legacy browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);
    
    return prefersReducedMotion;
}

// ============================================================================
// Roving Tabindex Hook
// ============================================================================

/**
 * Hook for managing roving tabindex in a list of interactive elements.
 * Only one item is tabbable at a time, arrow keys navigate between items.
 * 
 * @param itemCount - Number of items in the list
 * @param options - Configuration options
 */
export function useRovingTabindex(
    itemCount: number,
    options: {
        /** Initial active index */
        initialIndex?: number;
        /** Orientation of the list */
        orientation?: 'horizontal' | 'vertical' | 'both';
        /** Loop navigation at ends */
        loop?: boolean;
        /** Callback when active index changes */
        onIndexChange?: (index: number) => void;
    } = {}
): {
    activeIndex: number;
    setActiveIndex: (index: number) => void;
    getTabIndex: (index: number) => number;
    handleKeyDown: (e: React.KeyboardEvent, index: number) => void;
} {
    const {
        initialIndex = 0,
        orientation = 'vertical',
        loop = true,
        onIndexChange,
    } = options;
    
    const [activeIndex, setActiveIndexState] = useState(initialIndex);
    
    const setActiveIndex = useCallback((index: number) => {
        setActiveIndexState(index);
        onIndexChange?.(index);
    }, [onIndexChange]);
    
    const getTabIndex = useCallback((index: number): number => {
        return index === activeIndex ? 0 : -1;
    }, [activeIndex]);
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        const prevKeys = orientation === 'horizontal' ? ['ArrowLeft'] : 
                        orientation === 'vertical' ? ['ArrowUp'] : 
                        ['ArrowUp', 'ArrowLeft'];
        const nextKeys = orientation === 'horizontal' ? ['ArrowRight'] : 
                        orientation === 'vertical' ? ['ArrowDown'] : 
                        ['ArrowDown', 'ArrowRight'];
        
        let newIndex = currentIndex;
        
        if (prevKeys.includes(e.key)) {
            e.preventDefault();
            newIndex = loop 
                ? (currentIndex - 1 + itemCount) % itemCount
                : Math.max(0, currentIndex - 1);
        } else if (nextKeys.includes(e.key)) {
            e.preventDefault();
            newIndex = loop 
                ? (currentIndex + 1) % itemCount
                : Math.min(itemCount - 1, currentIndex + 1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            newIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            newIndex = itemCount - 1;
        }
        
        if (newIndex !== currentIndex) {
            setActiveIndex(newIndex);
        }
    }, [itemCount, loop, orientation, setActiveIndex]);
    
    return { activeIndex, setActiveIndex, getTabIndex, handleKeyDown };
}

// ============================================================================
// ID Generation for ARIA
// ============================================================================

let idCounter = 0;

/**
 * Generates a unique ID for ARIA attributes
 * 
 * @param prefix - Optional prefix for the ID
 */
export function generateAriaId(prefix = 'a11y'): string {
    idCounter++;
    return `${prefix}-${idCounter}`;
}

/**
 * Hook for generating stable unique IDs
 */
export function useAriaId(prefix = 'a11y'): string {
    const idRef = useRef<string>();
    
    if (!idRef.current) {
        idRef.current = generateAriaId(prefix);
    }
    
    return idRef.current;
}
