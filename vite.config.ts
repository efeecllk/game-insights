import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
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
        // Report compressed sizes
        reportCompressedSize: true,
        // Warn if chunks are too large
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React vendor chunk - essential for app startup
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // Charts library - large dependency, lazy load when needed
                    'vendor-echarts': ['echarts', 'echarts-for-react'],
                    // SQL.js for SQLite support - heavy WASM
                    'vendor-sql': ['sql.js'],
                    // Excel parsing library - only needed for file uploads
                    'vendor-xlsx': ['xlsx'],
                    // Animation library - used across app
                    'vendor-motion': ['framer-motion'],
                    // CSV/compression utilities
                    'vendor-utils': ['papaparse', 'pako'],
                    // Internationalization - can be loaded async
                    'vendor-i18n': ['i18next', 'react-i18next'],
                    // Icon library - tree-shaken but still sizeable
                    'vendor-icons': ['lucide-react'],
                },
            },
        },
    },
    // Optimize dependency pre-bundling
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'framer-motion',
            'lucide-react',
        ],
        exclude: [
            // Exclude heavy dependencies that are lazy-loaded
            'sql.js',
        ],
    },
})
