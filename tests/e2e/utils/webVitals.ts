/**
 * Web Vitals Measurement Utility for E2E Tests
 * Measures Core Web Vitals using Performance API
 */

import { Page, expect } from '@playwright/test';

export interface WebVitalsMetrics {
    /** Largest Contentful Paint (ms) */
    LCP: number | null;
    /** First Input Delay (ms) - requires user interaction */
    FID: number | null;
    /** Cumulative Layout Shift */
    CLS: number | null;
    /** First Contentful Paint (ms) */
    FCP: number | null;
    /** Time to First Byte (ms) */
    TTFB: number | null;
    /** Time to Interactive (ms) - approximate */
    TTI: number | null;
}

export interface WebVitalsThresholds {
    LCP?: number;
    FCP?: number;
    CLS?: number;
    TTFB?: number;
    TTI?: number;
}

/**
 * Default thresholds based on Core Web Vitals recommendations
 * Good: LCP < 2.5s, FCP < 1.8s, CLS < 0.1, TTFB < 800ms
 */
export const DEFAULT_THRESHOLDS: WebVitalsThresholds = {
    LCP: 2500,
    FCP: 1800,
    CLS: 0.1,
    TTFB: 800,
    TTI: 5000,
};

/**
 * Inject Web Vitals measurement script into the page
 */
async function injectWebVitalsScript(page: Page): Promise<void> {
    await page.addInitScript(() => {
        // Store metrics globally
        (window as unknown as { __webVitals: WebVitalsMetrics }).__webVitals = {
            LCP: null,
            FID: null,
            CLS: null,
            FCP: null,
            TTFB: null,
            TTI: null,
        };

        // Measure FCP
        const fcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            for (const entry of entries) {
                if (entry.name === 'first-contentful-paint') {
                    (window as unknown as { __webVitals: WebVitalsMetrics }).__webVitals.FCP = entry.startTime;
                }
            }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // Measure LCP
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                (window as unknown as { __webVitals: WebVitalsMetrics }).__webVitals.LCP = lastEntry.startTime;
            }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Measure CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
                    clsValue += (entry as PerformanceEntry & { value: number }).value;
                    (window as unknown as { __webVitals: WebVitalsMetrics }).__webVitals.CLS = clsValue;
                }
            }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Measure TTFB from navigation timing
        setTimeout(() => {
            const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navEntry) {
                (window as unknown as { __webVitals: WebVitalsMetrics }).__webVitals.TTFB = navEntry.responseStart;
            }
        }, 0);

        // Approximate TTI using Long Tasks API
        let lastLongTaskEnd = 0;
        const ttiObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                lastLongTaskEnd = entry.startTime + entry.duration;
            }
        });
        try {
            ttiObserver.observe({ type: 'longtask', buffered: true });
        } catch {
            // Long Tasks API not supported
        }

        // Set TTI after load
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                if (navEntry) {
                    const loadTime = navEntry.loadEventEnd;
                    (window as unknown as { __webVitals: WebVitalsMetrics }).__webVitals.TTI = Math.max(loadTime, lastLongTaskEnd);
                }
            }, 100);
        });
    });
}

/**
 * Measure Web Vitals for a page
 * @param page Playwright page instance
 * @param waitTime Additional wait time for metrics to stabilize (ms)
 */
export async function measureWebVitals(
    page: Page,
    waitTime: number = 1000
): Promise<WebVitalsMetrics> {
    // Wait for page to be mostly stable
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(waitTime);

    // Get metrics from page
    const metrics = await page.evaluate(() => {
        return (window as unknown as { __webVitals: WebVitalsMetrics }).__webVitals;
    });

    return metrics;
}

/**
 * Setup Web Vitals measurement for a page (call before navigation)
 */
export async function setupWebVitalsMeasurement(page: Page): Promise<void> {
    await injectWebVitalsScript(page);
}

/**
 * Assert Web Vitals meet thresholds
 */
export function assertWebVitals(
    metrics: WebVitalsMetrics,
    thresholds: WebVitalsThresholds = DEFAULT_THRESHOLDS
): void {
    const results: string[] = [];

    if (thresholds.LCP !== undefined && metrics.LCP !== null) {
        if (metrics.LCP > thresholds.LCP) {
            results.push(`LCP: ${metrics.LCP.toFixed(0)}ms > ${thresholds.LCP}ms`);
        }
    }

    if (thresholds.FCP !== undefined && metrics.FCP !== null) {
        if (metrics.FCP > thresholds.FCP) {
            results.push(`FCP: ${metrics.FCP.toFixed(0)}ms > ${thresholds.FCP}ms`);
        }
    }

    if (thresholds.CLS !== undefined && metrics.CLS !== null) {
        if (metrics.CLS > thresholds.CLS) {
            results.push(`CLS: ${metrics.CLS.toFixed(3)} > ${thresholds.CLS}`);
        }
    }

    if (thresholds.TTFB !== undefined && metrics.TTFB !== null) {
        if (metrics.TTFB > thresholds.TTFB) {
            results.push(`TTFB: ${metrics.TTFB.toFixed(0)}ms > ${thresholds.TTFB}ms`);
        }
    }

    if (thresholds.TTI !== undefined && metrics.TTI !== null) {
        if (metrics.TTI > thresholds.TTI) {
            results.push(`TTI: ${metrics.TTI.toFixed(0)}ms > ${thresholds.TTI}ms`);
        }
    }

    if (results.length > 0) {
        throw new Error(`Web Vitals thresholds exceeded:\n${results.join('\n')}`);
    }
}

/**
 * Format metrics for logging
 */
export function formatWebVitals(metrics: WebVitalsMetrics): string {
    const lines = [
        `LCP: ${metrics.LCP !== null ? `${metrics.LCP.toFixed(0)}ms` : 'N/A'}`,
        `FCP: ${metrics.FCP !== null ? `${metrics.FCP.toFixed(0)}ms` : 'N/A'}`,
        `CLS: ${metrics.CLS !== null ? metrics.CLS.toFixed(3) : 'N/A'}`,
        `TTFB: ${metrics.TTFB !== null ? `${metrics.TTFB.toFixed(0)}ms` : 'N/A'}`,
        `TTI: ${metrics.TTI !== null ? `${metrics.TTI.toFixed(0)}ms` : 'N/A'}`,
    ];
    return lines.join(' | ');
}

/**
 * Create a performance report object for JSON output
 */
export function createPerformanceReport(
    url: string,
    metrics: WebVitalsMetrics,
    thresholds: WebVitalsThresholds = DEFAULT_THRESHOLDS
): {
    url: string;
    timestamp: string;
    metrics: WebVitalsMetrics;
    thresholds: WebVitalsThresholds;
    passed: boolean;
    violations: string[];
} {
    const violations: string[] = [];

    if (thresholds.LCP && metrics.LCP && metrics.LCP > thresholds.LCP) {
        violations.push(`LCP exceeded: ${metrics.LCP}ms > ${thresholds.LCP}ms`);
    }
    if (thresholds.FCP && metrics.FCP && metrics.FCP > thresholds.FCP) {
        violations.push(`FCP exceeded: ${metrics.FCP}ms > ${thresholds.FCP}ms`);
    }
    if (thresholds.CLS && metrics.CLS && metrics.CLS > thresholds.CLS) {
        violations.push(`CLS exceeded: ${metrics.CLS} > ${thresholds.CLS}`);
    }
    if (thresholds.TTFB && metrics.TTFB && metrics.TTFB > thresholds.TTFB) {
        violations.push(`TTFB exceeded: ${metrics.TTFB}ms > ${thresholds.TTFB}ms`);
    }

    return {
        url,
        timestamp: new Date().toISOString(),
        metrics,
        thresholds,
        passed: violations.length === 0,
        violations,
    };
}
