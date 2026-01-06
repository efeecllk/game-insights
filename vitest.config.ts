/**
 * Vitest Configuration
 * Phase 7: Testing & Quality Assurance
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', 'tests/e2e'],

        // Use forks instead of threads - cleaner process exit
        pool: 'forks',
        poolOptions: {
            forks: {
                // Each test file gets isolated process
                singleFork: false,
                isolate: true,
            },
        },

        // Limit concurrent workers to reduce memory pressure
        maxWorkers: 4,
        minWorkers: 1,

        // Timeouts to prevent hanging
        testTimeout: 30000,
        hookTimeout: 10000,
        teardownTimeout: 3000,

        // Force exit after tests complete
        passWithNoTests: true,

        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                '**/*.config.{js,ts}',
                '**/types.ts',
            ],
            thresholds: {
                // Initial thresholds - increase as we add more tests
                statements: 3,
                branches: 10,
                functions: 30,
                lines: 3,
            },
        },
        // Mock IndexedDB for browser APIs
        deps: {
            inline: ['vitest-canvas-mock'],
        },
    },
});
