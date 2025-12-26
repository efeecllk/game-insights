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
