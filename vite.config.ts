/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.js',
        '**/*.config.js',
        'dist/',
        'coverage/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        'tests/**/*',  // Exclude integration and E2E tests from unit test coverage
        'mock-server/**/*'
      ]
    },
    exclude: [
      'node_modules/',
      'tests/**/*',  // Exclude integration and E2E tests from unit tests
      'mock-server/**/*'
    ]
  }
})