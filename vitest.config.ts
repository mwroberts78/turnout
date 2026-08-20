import path from 'node:path';
import { defineConfig } from 'vitest/config';

process.loadEnvFile(path.resolve(__dirname, '.env.test'));

export default defineConfig({
  test: {
    testTimeout: process.env.VITEST_DEBUG ? 0 : 5000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
