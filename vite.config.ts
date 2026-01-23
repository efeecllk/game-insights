import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        // Bundle analysis - generates stats.html when ANALYZE=true
        process.env.ANALYZE === 'true' && visualizer({
            filename: 'dist/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        // Target modern browsers for smaller bundle (ES2022 for better minification)
        target: 'es2022',
        // Report compressed sizes
        reportCompressedSize: true,
        // Warn if chunks are too large
        chunkSizeWarningLimit: 500,
        // Use esbuild for fast minification
        minify: 'esbuild',
        // esbuild minify options
        esbuild: {
            drop: mode === 'production' ? ['console', 'debugger'] : [],
            legalComments: 'none',
            // Pure function annotations for better tree-shaking
            pure: mode === 'production' ? ['console.log', 'console.debug', 'console.trace'] : [],
        },
        // Source maps only in development
        sourcemap: mode === 'development' ? 'inline' : false,
        // CSS optimization
        cssCodeSplit: true,
        // Reduce CSS output size
        cssMinify: 'esbuild',
        rollupOptions: {
            output: {
                // Improved chunking strategy for better caching and loading
                manualChunks(id) {
                    // Core React - always needed first
                    if (id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/scheduler/')) {
                        return 'vendor-react-core';
                    }
                    // React Router - needed for navigation
                    if (id.includes('node_modules/react-router') ||
                        id.includes('node_modules/@remix-run/router')) {
                        return 'vendor-react-router';
                    }
                    // ECharts - tree-shaken, lazy-loaded with charts
                    if (id.includes('node_modules/echarts/') ||
                        id.includes('node_modules/zrender/')) {
                        return 'vendor-echarts';
                    }
                    if (id.includes('echarts-for-react/')) {
                        return 'vendor-echarts';
                    }
                    // SQL.js - heavy WASM, only for SQLite imports
                    if (id.includes('node_modules/sql.js')) {
                        return 'vendor-sql';
                    }
                    // Excel parsing - only needed for xlsx/xls uploads
                    if (id.includes('node_modules/xlsx')) {
                        return 'vendor-xlsx';
                    }
                    // Framer Motion - split into core and features
                    if (id.includes('node_modules/framer-motion')) {
                        return 'vendor-motion';
                    }
                    // CSV/compression utilities - lightweight
                    if (id.includes('node_modules/papaparse') ||
                        id.includes('node_modules/pako')) {
                        return 'vendor-utils';
                    }
                    // i18n - can be loaded async
                    if (id.includes('node_modules/i18next') ||
                        id.includes('node_modules/react-i18next')) {
                        return 'vendor-i18n';
                    }
                    // Icons - tree-shaken per icon
                    if (id.includes('node_modules/lucide-react')) {
                        return 'vendor-icons';
                    }
                },
                // Add hashing for long-term caching
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
            treeshake: {
                moduleSideEffects: 'no-external',
                propertyReadSideEffects: false,
                // Improved tree-shaking annotations
                annotations: true,
                // Attempt to remove unused exports
                preset: 'recommended',
            },
        },
    },
    // Optimize dependency pre-bundling for faster dev server startup
    optimizeDeps: {
        include: [
            // Core dependencies - pre-bundle for faster HMR
            'react',
            'react-dom',
            'react-dom/client',
            'react-router-dom',
            'framer-motion',
            // Lightweight utils
            'papaparse',
        ],
        exclude: [
            // Heavy dependencies that are dynamically imported
            'sql.js',
            'xlsx',
        ],
        // Use esbuild for faster pre-bundling
        esbuildOptions: {
            target: 'es2022',
        },
    },
    // Dev server optimizations
    server: {
        host: '127.0.0.1',
        port: 5174,
        // Pre-warm frequently used files
        warmup: {
            clientFiles: [
                './src/App.tsx',
                './src/main.tsx',
                './src/components/Sidebar.tsx',
                './src/context/*.tsx',
            ],
        },
        // Enable dependency optimization
        preTransformRequests: true,
    },
    // Enable JSON tree-shaking
    json: {
        stringify: true,
    },
}))
