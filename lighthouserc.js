/**
 * Lighthouse CI Configuration
 * Phase 7: Performance Testing
 */

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/games',
        'http://localhost:4173/dashboards',
        'http://localhost:4173/upload',
      ],
      settings: {
        preset: 'desktop',
        // Skip some audits that don't apply to SPAs
        skipAudits: [
          'uses-http2',
          'uses-long-cache-ttl',
        ],
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],

        // Best Practices
        'errors-in-console': ['warn', { maxLength: 0 }],
        'no-vulnerable-libraries': ['error', { minScore: 1 }],
        'csp-xss': 'off', // Not applicable to local dev
        'inspector-issues': 'off',

        // Accessibility
        'color-contrast': ['warn', { minScore: 0.9 }],
        'heading-order': 'warn',
        'link-name': 'warn',
        'button-name': 'warn',
        'image-alt': 'warn',

        // SEO (less critical for app)
        'meta-description': 'off',
        'document-title': 'warn',

        // PWA (optional for now)
        'installable-manifest': 'off',
        'service-worker': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        'maskable-icon': 'off',
        'apple-touch-icon': 'off',

        // Categories
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
