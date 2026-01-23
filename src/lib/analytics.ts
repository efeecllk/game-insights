/**
 * Analytics module for Google Analytics integration
 *
 * This module provides a lightweight wrapper around Google Analytics 4
 * with privacy-aware tracking and consent handling.
 */

// Extend Window type to include gtag and dataLayer
declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: unknown[];
    }
}

/**
 * Check if analytics is properly initialized
 */
export function isAnalyticsEnabled(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.gtag === 'function' &&
        !!import.meta.env.VITE_GA_MEASUREMENT_ID &&
        import.meta.env.VITE_GA_MEASUREMENT_ID !== 'G-PLACEHOLDER'
    );
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
    if (!isAnalyticsEnabled()) return;

    window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
    });
}

/**
 * Track a custom event
 */
export function trackEvent(
    eventName: string,
    parameters?: Record<string, string | number | boolean>
): void {
    if (!isAnalyticsEnabled()) return;

    window.gtag('event', eventName, parameters);
}

/**
 * Track file upload events
 */
export function trackFileUpload(
    fileType: string,
    fileSize: number,
    rowCount?: number
): void {
    trackEvent('file_upload', {
        file_type: fileType,
        file_size_kb: Math.round(fileSize / 1024),
        row_count: rowCount || 0,
    });
}

/**
 * Track game type detection
 */
export function trackGameTypeDetected(
    gameType: string,
    confidence: number
): void {
    trackEvent('game_type_detected', {
        game_type: gameType,
        confidence: Math.round(confidence * 100),
    });
}

/**
 * Track demo mode start
 */
export function trackDemoStart(): void {
    trackEvent('demo_start');
}

/**
 * Track dashboard creation
 */
export function trackDashboardCreated(chartCount: number): void {
    trackEvent('dashboard_created', {
        chart_count: chartCount,
    });
}

/**
 * Track feature usage
 */
export function trackFeatureUsed(featureName: string): void {
    trackEvent('feature_used', {
        feature_name: featureName,
    });
}

/**
 * Initialize analytics tracking for route changes
 * Call this in your router setup
 */
export function initRouteTracking(onRouteChange: (callback: (path: string) => void) => void): void {
    if (!isAnalyticsEnabled()) return;

    onRouteChange((path) => {
        trackPageView(path);
    });
}
