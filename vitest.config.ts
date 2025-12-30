/**
 * Vitest configuration for MVP 1.0 testing
 * @version 1.0.0
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/**/*.ts',
        'src/data/**/*.ts',
        'src/types/**/*.ts',
        'src/stores/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/lib/firebase.ts',
        'src/lib/utils.ts',
        'src/services/**',
        'src/components/**',
        'src/pages/**',
      ],
      thresholds: {
        // Core logic coverage targets
        'src/lib/game-engine.ts': {
          statements: 80,
          branches: 70,
          functions: 85,
          lines: 80,
        },
        'src/lib/effect-system.ts': {
          statements: 95,
          branches: 80,
          functions: 100,
          lines: 95,
        },
        'src/lib/game-utils.ts': {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 95,
        },
        'src/data/cards/mvp-cards.ts': {
          statements: 95,
          branches: 95,
          functions: 85,
          lines: 95,
        },
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
