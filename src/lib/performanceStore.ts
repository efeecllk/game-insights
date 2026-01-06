/**
 * Performance Store - Centralized performance management
 *
 * Tracks active features, manages expensive operations, and stores
 * user performance preferences for optimal resource usage.
 *
 * Key Features:
 * - Track which features are currently active/visible
 * - Pause/resume expensive operations when components unmount
 * - Store user performance preferences (balanced vs lite mode)
 * - Coordinate background tasks across components
 */

// ============================================================================
// Types
// ============================================================================

export type PerformanceMode = 'full' | 'balanced' | 'lite';

export interface ActiveFeature {
    id: string;
    name: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    isExpensive: boolean;
    startedAt: number;
}

export interface PausableOperation {
    id: string;
    name: string;
    pause: () => void;
    resume: () => void;
    isPaused: boolean;
}

export interface PerformancePreferences {
    mode: PerformanceMode;
    enableAnimations: boolean;
    enableBlur: boolean;
    enableLiveUpdates: boolean;
    maxConcurrentOperations: number;
    reducedMotion: boolean;
}

interface PerformanceState {
    activeFeatures: Map<string, ActiveFeature>;
    pausableOperations: Map<string, PausableOperation>;
    preferences: PerformancePreferences;
    isLowPowerMode: boolean;
    currentFPS: number;
    memoryPressure: 'low' | 'medium' | 'high';
}

type PerformanceListener = (state: PerformanceState) => void;

// ============================================================================
// Default Preferences
// ============================================================================

const DEFAULT_PREFERENCES: PerformancePreferences = {
    mode: 'balanced',
    enableAnimations: true,
    enableBlur: true,
    enableLiveUpdates: true,
    maxConcurrentOperations: 3,
    reducedMotion: false,
};

// ============================================================================
// Performance Store Class
// ============================================================================

class PerformanceStore {
    private state: PerformanceState;
    private listeners: Set<PerformanceListener> = new Set();
    private fpsMonitorId: number | null = null;
    private mediaQuery: MediaQueryList | null = null;
    private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

    constructor() {
        // Load preferences from localStorage
        const savedPrefs = this.loadPreferences();

        this.state = {
            activeFeatures: new Map(),
            pausableOperations: new Map(),
            preferences: savedPrefs,
            isLowPowerMode: false,
            currentFPS: 60,
            memoryPressure: 'low',
        };

        // Detect reduced motion preference
        if (typeof window !== 'undefined') {
            this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.state.preferences.reducedMotion = this.mediaQuery.matches;

            this.mediaQueryHandler = (e: MediaQueryListEvent) => {
                this.updatePreferences({ reducedMotion: e.matches });
            };
            this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
        }
    }

    /**
     * Cleanup method to remove event listeners
     * Should be called when the store is no longer needed
     */
    destroy(): void {
        // Remove media query listener
        if (this.mediaQuery && this.mediaQueryHandler) {
            this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
            this.mediaQuery = null;
            this.mediaQueryHandler = null;
        }

        // Stop FPS monitoring
        if (this.fpsMonitorId !== null) {
            cancelAnimationFrame(this.fpsMonitorId);
            this.fpsMonitorId = null;
        }

        // Clear all listeners
        this.listeners.clear();

        // Clear all operations
        this.state.activeFeatures.clear();
        this.state.pausableOperations.clear();
    }

    // ============================================================================
    // Preferences Management
    // ============================================================================

    private loadPreferences(): PerformancePreferences {
        if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

        try {
            const saved = localStorage.getItem('game-insights-performance-prefs');
            if (saved) {
                return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
            }
        } catch {
            // Ignore parse errors
        }
        return DEFAULT_PREFERENCES;
    }

    private savePreferences(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(
                'game-insights-performance-prefs',
                JSON.stringify(this.state.preferences)
            );
        } catch {
            // Ignore storage errors
        }
    }

    updatePreferences(updates: Partial<PerformancePreferences>): void {
        this.state.preferences = { ...this.state.preferences, ...updates };
        this.savePreferences();
        this.notifyListeners();

        // Auto-apply mode-based settings
        if (updates.mode) {
            this.applyModeSettings(updates.mode);
        }
    }

    private applyModeSettings(mode: PerformanceMode): void {
        switch (mode) {
            case 'full':
                this.state.preferences.enableAnimations = true;
                this.state.preferences.enableBlur = true;
                this.state.preferences.enableLiveUpdates = true;
                this.state.preferences.maxConcurrentOperations = 5;
                break;
            case 'balanced':
                this.state.preferences.enableAnimations = true;
                this.state.preferences.enableBlur = false;
                this.state.preferences.enableLiveUpdates = true;
                this.state.preferences.maxConcurrentOperations = 3;
                break;
            case 'lite':
                this.state.preferences.enableAnimations = false;
                this.state.preferences.enableBlur = false;
                this.state.preferences.enableLiveUpdates = false;
                this.state.preferences.maxConcurrentOperations = 1;
                break;
        }
        this.savePreferences();
    }

    getPreferences(): PerformancePreferences {
        return { ...this.state.preferences };
    }

    // ============================================================================
    // Active Features Tracking
    // ============================================================================

    registerFeature(feature: Omit<ActiveFeature, 'startedAt'>): () => void {
        const fullFeature: ActiveFeature = {
            ...feature,
            startedAt: Date.now(),
        };

        this.state.activeFeatures.set(feature.id, fullFeature);
        this.notifyListeners();

        // Return cleanup function
        return () => this.unregisterFeature(feature.id);
    }

    unregisterFeature(id: string): void {
        this.state.activeFeatures.delete(id);
        this.notifyListeners();
    }

    getActiveFeatures(): ActiveFeature[] {
        return Array.from(this.state.activeFeatures.values());
    }

    isFeatureActive(id: string): boolean {
        return this.state.activeFeatures.has(id);
    }

    getExpensiveFeatureCount(): number {
        return Array.from(this.state.activeFeatures.values())
            .filter(f => f.isExpensive).length;
    }

    // ============================================================================
    // Pausable Operations
    // ============================================================================

    registerPausableOperation(operation: Omit<PausableOperation, 'isPaused'>): () => void {
        const fullOperation: PausableOperation = {
            ...operation,
            isPaused: false,
        };

        this.state.pausableOperations.set(operation.id, fullOperation);
        this.notifyListeners();

        // Auto-pause if in low power mode or too many concurrent operations
        if (this.shouldAutoPause()) {
            this.pauseOperation(operation.id);
        }

        // Return cleanup function
        return () => this.unregisterPausableOperation(operation.id);
    }

    unregisterPausableOperation(id: string): void {
        const operation = this.state.pausableOperations.get(id);
        if (operation && !operation.isPaused) {
            operation.pause();
        }
        this.state.pausableOperations.delete(id);
        this.notifyListeners();
    }

    pauseOperation(id: string): void {
        const operation = this.state.pausableOperations.get(id);
        if (operation && !operation.isPaused) {
            operation.pause();
            operation.isPaused = true;
            this.notifyListeners();
        }
    }

    resumeOperation(id: string): void {
        const operation = this.state.pausableOperations.get(id);
        if (operation && operation.isPaused) {
            operation.resume();
            operation.isPaused = false;
            this.notifyListeners();
        }
    }

    pauseAllOperations(): void {
        this.state.pausableOperations.forEach((operation) => {
            if (!operation.isPaused) {
                operation.pause();
                operation.isPaused = true;
            }
        });
        this.notifyListeners();
    }

    resumeAllOperations(): void {
        this.state.pausableOperations.forEach((operation) => {
            if (operation.isPaused) {
                operation.resume();
                operation.isPaused = false;
            }
        });
        this.notifyListeners();
    }

    private shouldAutoPause(): boolean {
        const activeExpensive = this.getExpensiveFeatureCount();
        return (
            this.state.isLowPowerMode ||
            activeExpensive >= this.state.preferences.maxConcurrentOperations
        );
    }

    // ============================================================================
    // Performance Monitoring
    // ============================================================================

    setLowPowerMode(enabled: boolean): void {
        this.state.isLowPowerMode = enabled;

        if (enabled) {
            // Auto-pause expensive operations
            this.state.pausableOperations.forEach((op, id) => {
                if (!op.isPaused) {
                    this.pauseOperation(id);
                }
            });
        }

        this.notifyListeners();
    }

    updateFPS(fps: number): void {
        this.state.currentFPS = fps;

        // Auto-switch to lite mode if FPS drops significantly
        if (fps < 20 && this.state.preferences.mode !== 'lite') {
            console.warn('[PerformanceStore] Low FPS detected, consider switching to lite mode');
        }

        this.notifyListeners();
    }

    updateMemoryPressure(pressure: 'low' | 'medium' | 'high'): void {
        this.state.memoryPressure = pressure;

        if (pressure === 'high') {
            // Aggressively pause non-critical operations
            this.state.pausableOperations.forEach((_, id) => {
                const feature = this.state.activeFeatures.get(id);
                if (feature && feature.priority !== 'critical') {
                    this.pauseOperation(id);
                }
            });
        }

        this.notifyListeners();
    }

    startFPSMonitoring(): () => void {
        if (typeof window === 'undefined') return () => {};

        let frameCount = 0;
        let lastTime = performance.now();

        const measure = () => {
            frameCount++;
            const now = performance.now();

            if (now - lastTime >= 1000) {
                this.updateFPS(frameCount);
                frameCount = 0;
                lastTime = now;
            }

            this.fpsMonitorId = requestAnimationFrame(measure);
        };

        this.fpsMonitorId = requestAnimationFrame(measure);

        return () => {
            if (this.fpsMonitorId !== null) {
                cancelAnimationFrame(this.fpsMonitorId);
                this.fpsMonitorId = null;
            }
        };
    }

    // ============================================================================
    // State Access
    // ============================================================================

    getState(): PerformanceState {
        return {
            ...this.state,
            activeFeatures: new Map(this.state.activeFeatures),
            pausableOperations: new Map(this.state.pausableOperations),
            preferences: { ...this.state.preferences },
        };
    }

    // ============================================================================
    // Subscription
    // ============================================================================

    subscribe(listener: PerformanceListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        const state = this.getState();
        this.listeners.forEach((listener) => listener(state));
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Check if expensive operations should be throttled
     */
    shouldThrottle(): boolean {
        return (
            this.state.isLowPowerMode ||
            this.state.currentFPS < 30 ||
            this.state.memoryPressure === 'high' ||
            this.state.preferences.mode === 'lite'
        );
    }

    /**
     * Get recommended throttle delay based on current performance
     */
    getThrottleDelay(): number {
        if (this.state.preferences.mode === 'lite') return 500;
        if (this.state.currentFPS < 20) return 300;
        if (this.state.currentFPS < 30) return 200;
        if (this.state.memoryPressure === 'high') return 200;
        return 100;
    }

    /**
     * Check if live updates should be enabled
     */
    shouldEnableLiveUpdates(): boolean {
        return (
            this.state.preferences.enableLiveUpdates &&
            !this.state.isLowPowerMode &&
            this.state.memoryPressure !== 'high'
        );
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const performanceStore = new PerformanceStore();

// ============================================================================
// React Hook for Performance Store
// ============================================================================

import { useEffect, useState, useCallback } from 'react';

export function usePerformanceStore() {
    const [state, setState] = useState(performanceStore.getState());

    useEffect(() => {
        return performanceStore.subscribe(setState);
    }, []);

    const registerFeature = useCallback((feature: Omit<ActiveFeature, 'startedAt'>) => {
        return performanceStore.registerFeature(feature);
    }, []);

    const registerPausableOperation = useCallback(
        (operation: Omit<PausableOperation, 'isPaused'>) => {
            return performanceStore.registerPausableOperation(operation);
        },
        []
    );

    const updatePreferences = useCallback((updates: Partial<PerformancePreferences>) => {
        performanceStore.updatePreferences(updates);
    }, []);

    return {
        state,
        preferences: state.preferences,
        isLowPowerMode: state.isLowPowerMode,
        shouldThrottle: performanceStore.shouldThrottle(),
        shouldEnableLiveUpdates: performanceStore.shouldEnableLiveUpdates(),
        registerFeature,
        registerPausableOperation,
        updatePreferences,
        pauseAllOperations: performanceStore.pauseAllOperations.bind(performanceStore),
        resumeAllOperations: performanceStore.resumeAllOperations.bind(performanceStore),
        setLowPowerMode: performanceStore.setLowPowerMode.bind(performanceStore),
    };
}

/**
 * Hook for registering a feature with automatic cleanup
 */
export function useFeatureTracking(
    id: string,
    name: string,
    options: { priority?: ActiveFeature['priority']; isExpensive?: boolean } = {}
) {
    useEffect(() => {
        const cleanup = performanceStore.registerFeature({
            id,
            name,
            priority: options.priority || 'medium',
            isExpensive: options.isExpensive || false,
        });

        return cleanup;
    }, [id, name, options.priority, options.isExpensive]);
}

/**
 * Hook for pausable operations with automatic cleanup
 */
export function usePausableOperation(
    id: string,
    name: string,
    handlers: { pause: () => void; resume: () => void }
) {
    useEffect(() => {
        const cleanup = performanceStore.registerPausableOperation({
            id,
            name,
            pause: handlers.pause,
            resume: handlers.resume,
        });

        return cleanup;
    }, [id, name, handlers.pause, handlers.resume]);
}
