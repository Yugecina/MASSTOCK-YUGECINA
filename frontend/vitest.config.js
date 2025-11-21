/* eslint-disable no-undef */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment - using happy-dom for better performance
    environment: 'happy-dom',

    // Setup files
    setupFiles: ['./vitest.setup.js'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        '**/*.spec.js',
        '**/*.test.js',
        '**/index.js',
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },

    // Test file patterns
    include: ['src/**/__tests__/**/*.{test,spec}.{js,jsx}'],

    // Watch options
    watch: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
});
