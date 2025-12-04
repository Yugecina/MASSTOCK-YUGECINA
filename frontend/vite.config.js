import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['react-window'],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    // Remove console.log in production build
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          store: ['zustand'],
        },
      },
    },
  },
  esbuild: {
    // Remove all console.* calls in production
    drop: process.env.VITE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  test: {
    globals: true,
    environment: 'happy-dom', // Use happy-dom instead of jsdom
    setupFiles: './vitest.setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.js',
        '**/*.test.{js,jsx}',
        '**/*.config.{js,ts}',
        '**/dist/**',
      ],
    },
  },
})
