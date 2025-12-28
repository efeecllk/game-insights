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
    },
})
