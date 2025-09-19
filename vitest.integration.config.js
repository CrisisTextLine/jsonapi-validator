/// <reference types="vitest" />
import { defineConfig } from 'vite'

// Integration test configuration
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.js', 'tests/integration/**/*.test.js'],
    setupFiles: ['./tests/integration/setup.js'],
    testTimeout: 30000, // Longer timeout for integration tests
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'node_modules/',
        'src/test-setup.js',
        '**/*.config.js',
        'dist/',
        'coverage/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}'
      ]
    }
  }
})