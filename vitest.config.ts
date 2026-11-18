import path from 'node:path';
import { defineConfig } from 'vitest/config';

process.loadEnvFile(path.resolve(__dirname, '.env.test'));

export default defineConfig({
  test: {
    testTimeout: process.env.VITEST_DEBUG ? 0 : 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
    setupFiles: ['./src/tests/setup.ts'],
    // Playwright specs in e2e/ run with `pnpm test:e2e`, not Vitest.
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
