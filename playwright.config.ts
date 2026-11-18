import { defineConfig, devices } from '@playwright/test';

// .env.e2e first so its values win; loadEnvFile never overwrites a variable
// that's already set.
for (const file of ['.env.e2e', '.env.local']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Optional: a missing file just leaves those variables unset.
  }
}

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  // The dev server compiles routes on first visit, which can be slow.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global.setup.ts',
  globalTeardown: './e2e/global.teardown.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'auth', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['auth'],
    },
    {
      // Volunteers mostly sign up from their phones, so the employee flows
      // also run in mobile Safari's engine.
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      dependencies: ['auth'],
      testMatch: /(public|employee)\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
