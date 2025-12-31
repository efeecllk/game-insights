/**
 * Test Setup
 * Global configuration for Vitest tests
 * Phase 7: Testing & Quality Assurance
 */

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                // Navigation
                'navigation.overview': 'Overview',
                'navigation.games': 'Games',
                'navigation.dataSources': 'Data Sources',
                'navigation.templates': 'Templates',
                'navigation.predictions': 'Predictions',
                'navigation.aiAnalytics': 'AI Analytics',
                'navigation.realtime': 'Realtime',
                'navigation.dashboards': 'Dashboards',
                'navigation.explore': 'Explore',
                'navigation.funnels': 'Funnels',
                'navigation.funnelBuilder': 'Funnel Builder',
                'navigation.engagement': 'Engagement',
                'navigation.distributions': 'Distributions',
                'navigation.health': 'Health',
                'navigation.monetization': 'Monetization',
                'navigation.userAnalysis': 'User Analysis',
                'navigation.remoteConfigs': 'Remote Configs',
                'navigation.abTesting': 'A/B Testing',
                'navigation.attribution': 'Attribution',
                'navigation.settings': 'Game Settings',
                // Sidebar
                'sidebar.theme': 'Theme',
                'sidebar.activeGame': 'Active Game',
                'sidebar.toggleTheme': 'Toggle theme',
            };
            return translations[key] || key;
        },
        i18n: {
            language: 'en',
            changeLanguage: vi.fn().mockResolvedValue(undefined),
        },
    }),
    Trans: ({ children }: { children: React.ReactNode }) => children,
    initReactI18next: {
        type: '3rdParty',
        init: vi.fn(),
    },
}));

// Mock IndexedDB
const indexedDB = {
    open: vi.fn(() => ({
        result: {
            createObjectStore: vi.fn(),
            transaction: vi.fn(() => ({
                objectStore: vi.fn(() => ({
                    put: vi.fn(),
                    get: vi.fn(),
                    getAll: vi.fn(),
                    delete: vi.fn(),
                })),
            })),
        },
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
    })),
    deleteDatabase: vi.fn(),
};

vi.stubGlobal('indexedDB', indexedDB);

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock IntersectionObserver
class IntersectionObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    root = null;
    rootMargin = '';
    thresholds = [];
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Mock window.URL.createObjectURL
vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
    configurable: true,
});

// Mock scrollIntoView for elements
Element.prototype.scrollIntoView = vi.fn();

// Polyfill Blob.text() for jsdom
if (!Blob.prototype.text) {
    Blob.prototype.text = function() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(this);
        });
    };
}

// Mock console.warn/error to keep test output clean (optional)
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});
