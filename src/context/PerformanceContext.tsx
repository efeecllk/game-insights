/**
 * Performance Context - Manages performance optimizations
 *
 * Detects low-performance scenarios and provides toggles for:
 * - Reduced motion (disables Framer Motion animations)
 * - Reduced blur (removes  and blur effects)
 * - Lite mode (combines both + reduces chart complexity)
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

type PerformanceMode = 'auto' | 'full' | 'balanced' | 'lite';

interface PerformanceContextType {
    // Current mode
    mode: PerformanceMode;
    setMode: (mode: PerformanceMode) => void;

    // Computed flags (based on mode)
    enableAnimations: boolean;
    enableBlur: boolean;
    enableComplexCharts: boolean;
    enableNoiseTexture: boolean;

    // Performance stats
    isLowEndDevice: boolean;
    fps: number;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

// Detect low-end devices
function detectLowEndDevice(): boolean {
    // Check for low memory
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (nav.deviceMemory && nav.deviceMemory < 4) {
        return true;
    }

    // Check for low CPU cores
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        return true;
    }

    // Check for reduced motion preference
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        return true;
    }

    // Check for battery saving mode (mobile)
    // @ts-expect-error - getBattery is not in TypeScript's Navigator type
    if (navigator.getBattery) {
        // Async check - will update state later
        return false;
    }

    return false;
}

// Monitor FPS - optimized to only run for short detection periods
function createFPSMonitor(callback: (fps: number) => void, duration = 5000) {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;
    let startTime = performance.now();
    let stopped = false;

    function measureFPS() {
        if (stopped) return;

        frameCount++;
        const now = performance.now();

        if (now - lastTime >= 1000) {
            callback(frameCount);
            frameCount = 0;
            lastTime = now;
        }

        // Stop after duration to save CPU
        if (now - startTime >= duration) {
            stopped = true;
            return;
        }

        rafId = requestAnimationFrame(measureFPS);
    }

    rafId = requestAnimationFrame(measureFPS);

    return () => {
        stopped = true;
        cancelAnimationFrame(rafId);
    };
}

export function PerformanceProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<PerformanceMode>(() => {
        const saved = localStorage.getItem('performance-mode');
        return (saved as PerformanceMode) || 'auto';
    });
    const [isLowEndDevice, setIsLowEndDevice] = useState(false);
    const [fps, setFps] = useState(60);
    const [autoDetectedMode, setAutoDetectedMode] = useState<'full' | 'balanced' | 'lite'>('full');

    // Detect device capabilities on mount
    useEffect(() => {
        const isLowEnd = detectLowEndDevice();
        setIsLowEndDevice(isLowEnd);

        if (isLowEnd) {
            setAutoDetectedMode('lite');
        }
    }, []);

    // Monitor FPS once on mount for initial detection (5 seconds)
    // Runs only once to determine performance tier, then stops to save CPU
    useEffect(() => {
        if (mode !== 'auto') return;

        let lowFpsCount = 0;
        let sampleCount = 0;
        let totalFps = 0;

        // Run FPS detection for 5 seconds, then stop
        const cleanup = createFPSMonitor((currentFps) => {
            setFps(currentFps);
            sampleCount++;
            totalFps += currentFps;

            // If FPS drops below 30 for 3 consecutive seconds, switch to lite
            if (currentFps < 30) {
                lowFpsCount++;
                if (lowFpsCount >= 3) {
                    setAutoDetectedMode('lite');
                }
            } else if (currentFps < 45) {
                lowFpsCount = 0;
                setAutoDetectedMode('balanced');
            } else {
                lowFpsCount = 0;
                setAutoDetectedMode('full');
            }
        }, 5000); // Only monitor for 5 seconds

        return cleanup;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const setMode = useCallback((newMode: PerformanceMode) => {
        setModeState(newMode);
        localStorage.setItem('performance-mode', newMode);
    }, []);

    // Compute effective mode
    const effectiveMode = mode === 'auto' ? autoDetectedMode : mode;

    // Compute flags based on mode
    const flags = useMemo(() => {
        switch (effectiveMode) {
            case 'full':
                return {
                    enableAnimations: true,
                    enableBlur: true,
                    enableComplexCharts: true,
                    enableNoiseTexture: true,
                };
            case 'balanced':
                return {
                    enableAnimations: true,
                    enableBlur: false, // Disable blur for balanced
                    enableComplexCharts: true,
                    enableNoiseTexture: false,
                };
            case 'lite':
                return {
                    enableAnimations: false,
                    enableBlur: false,
                    enableComplexCharts: false,
                    enableNoiseTexture: false,
                };
            default:
                return {
                    enableAnimations: true,
                    enableBlur: true,
                    enableComplexCharts: true,
                    enableNoiseTexture: true,
                };
        }
    }, [effectiveMode]);

    // Apply CSS class to document root
    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove('perf-full', 'perf-balanced', 'perf-lite');
        root.classList.add(`perf-${effectiveMode}`);

        // Also set CSS custom property for transitions
        if (!flags.enableAnimations) {
            root.style.setProperty('--animation-duration', '0s');
            root.style.setProperty('--transition-duration', '0s');
        } else {
            root.style.removeProperty('--animation-duration');
            root.style.removeProperty('--transition-duration');
        }

        // Cleanup: remove classes and properties when unmounting
        return () => {
            root.classList.remove('perf-full', 'perf-balanced', 'perf-lite');
            root.style.removeProperty('--animation-duration');
            root.style.removeProperty('--transition-duration');
        };
    }, [effectiveMode, flags.enableAnimations]);

    // Memoize context value to prevent unnecessary re-renders of consumers
    const contextValue = useMemo(() => ({
        mode,
        setMode,
        ...flags,
        isLowEndDevice,
        fps,
    }), [mode, setMode, flags, isLowEndDevice, fps]);

    return (
        <PerformanceContext.Provider value={contextValue}>
            {children}
        </PerformanceContext.Provider>
    );
}

export function usePerformance() {
    const context = useContext(PerformanceContext);
    if (!context) {
        throw new Error('usePerformance must be used within a PerformanceProvider');
    }
    return context;
}

/**
 * Hook for conditionally disabling Framer Motion animations
 * Usage: <motion.div {...(useAnimationProps(variants))} />
 */
export function useAnimationProps(variants?: object) {
    const { enableAnimations } = usePerformance();

    if (!enableAnimations) {
        return {}; // Return empty props to disable animation
    }

    return variants ? { variants } : {};
}
