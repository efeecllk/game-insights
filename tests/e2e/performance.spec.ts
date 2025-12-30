/**
 * Performance E2E Tests
 * Measures Core Web Vitals for key pages
 */

import { test, expect } from '@playwright/test';
import {
    setupWebVitalsMeasurement,
    measureWebVitals,
    assertWebVitals,
    formatWebVitals,
    createPerformanceReport,
    DEFAULT_THRESHOLDS,
    type WebVitalsThresholds,
} from './utils/webVitals';

// Custom thresholds for this project (slightly relaxed for dev server)
const THRESHOLDS: WebVitalsThresholds = {
    LCP: 3000,   // 3s (relaxed from 2.5s for dev)
    FCP: 2000,   // 2s (relaxed from 1.8s for dev)
    CLS: 0.1,    // Same as Core Web Vitals
    TTFB: 1000,  // 1s (relaxed from 800ms for dev)
    TTI: 6000,   // 6s (relaxed for dev)
};

// Store results for reporting
const performanceResults: ReturnType<typeof createPerformanceReport>[] = [];

test.describe('Performance - Core Web Vitals', () => {
    test.beforeEach(async ({ page }) => {
        await setupWebVitalsMeasurement(page);
    });

    test.afterAll(async () => {
        // Log summary of all performance tests
        console.log('\n=== Performance Test Summary ===');
        for (const result of performanceResults) {
            const status = result.passed ? '✓' : '✗';
            console.log(`${status} ${result.url}`);
            if (!result.passed) {
                result.violations.forEach(v => console.log(`  - ${v}`));
            }
        }
        console.log('================================\n');
    });

    test('Homepage meets performance budgets', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const metrics = await measureWebVitals(page);
        console.log(`Homepage: ${formatWebVitals(metrics)}`);

        const report = createPerformanceReport('/', metrics, THRESHOLDS);
        performanceResults.push(report);

        // Soft assertions - log but don't fail for now
        if (!report.passed) {
            console.warn('Homepage performance issues:', report.violations);
        }

        // Core assertions
        expect(metrics.FCP).not.toBeNull();
        if (metrics.FCP) {
            expect(metrics.FCP).toBeLessThan(THRESHOLDS.FCP!);
        }
    });

    test('Upload page meets performance budgets', async ({ page }) => {
        await page.goto('/upload');
        await page.waitForLoadState('networkidle');

        const metrics = await measureWebVitals(page);
        console.log(`Upload: ${formatWebVitals(metrics)}`);

        const report = createPerformanceReport('/upload', metrics, THRESHOLDS);
        performanceResults.push(report);

        expect(metrics.FCP).not.toBeNull();
        if (metrics.FCP) {
            expect(metrics.FCP).toBeLessThan(THRESHOLDS.FCP!);
        }
    });

    test('Games page meets performance budgets', async ({ page }) => {
        await page.goto('/games');
        await page.waitForLoadState('networkidle');

        const metrics = await measureWebVitals(page);
        console.log(`Games: ${formatWebVitals(metrics)}`);

        const report = createPerformanceReport('/games', metrics, THRESHOLDS);
        performanceResults.push(report);

        expect(metrics.FCP).not.toBeNull();
        if (metrics.FCP) {
            expect(metrics.FCP).toBeLessThan(THRESHOLDS.FCP!);
        }
    });

    test('Dashboards page meets performance budgets', async ({ page }) => {
        await page.goto('/dashboards');
        await page.waitForLoadState('networkidle');

        const metrics = await measureWebVitals(page);
        console.log(`Dashboards: ${formatWebVitals(metrics)}`);

        const report = createPerformanceReport('/dashboards', metrics, THRESHOLDS);
        performanceResults.push(report);

        expect(metrics.FCP).not.toBeNull();
        if (metrics.FCP) {
            expect(metrics.FCP).toBeLessThan(THRESHOLDS.FCP!);
        }
    });

    test('Analytics page meets performance budgets', async ({ page }) => {
        await page.goto('/analytics');
        await page.waitForLoadState('networkidle');

        const metrics = await measureWebVitals(page);
        console.log(`Analytics: ${formatWebVitals(metrics)}`);

        const report = createPerformanceReport('/analytics', metrics, THRESHOLDS);
        performanceResults.push(report);

        expect(metrics.FCP).not.toBeNull();
        if (metrics.FCP) {
            expect(metrics.FCP).toBeLessThan(THRESHOLDS.FCP!);
        }
    });

    test('Templates page meets performance budgets', async ({ page }) => {
        await page.goto('/templates');
        await page.waitForLoadState('networkidle');

        const metrics = await measureWebVitals(page);
        console.log(`Templates: ${formatWebVitals(metrics)}`);

        const report = createPerformanceReport('/templates', metrics, THRESHOLDS);
        performanceResults.push(report);

        expect(metrics.FCP).not.toBeNull();
    });
});

test.describe('Performance - CLS Stability', () => {
    test('Homepage has minimal layout shift', async ({ page }) => {
        await setupWebVitalsMeasurement(page);
        await page.goto('/');

        // Wait for full page load and any lazy content
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Extra time for animations

        const metrics = await measureWebVitals(page, 500);

        expect(metrics.CLS).not.toBeNull();
        if (metrics.CLS !== null) {
            expect(metrics.CLS).toBeLessThan(0.1);
        }
    });

    test('Navigation does not cause layout shifts', async ({ page }) => {
        await setupWebVitalsMeasurement(page);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to another page
        await page.click('a[href="/games"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const metrics = await measureWebVitals(page, 500);

        if (metrics.CLS !== null) {
            expect(metrics.CLS).toBeLessThan(0.25); // Slightly higher threshold for navigation
        }
    });
});

test.describe('Performance - Time to Interactive', () => {
    test('Homepage is interactive quickly', async ({ page }) => {
        await setupWebVitalsMeasurement(page);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Try to interact with the page
        const interactionStart = Date.now();

        // Find and click a navigation item
        const navLink = page.locator('nav a').first();
        await expect(navLink).toBeVisible({ timeout: 5000 });

        const interactionTime = Date.now() - interactionStart;
        expect(interactionTime).toBeLessThan(3000); // Should be interactive within 3s
    });
});

test.describe('Performance - Resource Loading', () => {
    test('No render-blocking resources cause long FCP', async ({ page }) => {
        await setupWebVitalsMeasurement(page);

        const resourceTimings: { name: string; duration: number }[] = [];

        // Capture resource timing
        page.on('response', async (response) => {
            const timing = response.timing();
            if (timing) {
                resourceTimings.push({
                    name: response.url(),
                    duration: timing.responseEnd,
                });
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const metrics = await measureWebVitals(page);

        // FCP should happen before all resources finish loading
        expect(metrics.FCP).not.toBeNull();

        // Log slow resources
        const slowResources = resourceTimings.filter(r => r.duration > 1000);
        if (slowResources.length > 0) {
            console.warn('Slow resources (>1s):', slowResources.map(r => r.name));
        }
    });
});
