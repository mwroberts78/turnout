import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { test as base, expect } from '@playwright/test';

export const authFile = {
  admin: 'e2e/.auth/admin.json',
  employee: 'e2e/.auth/employee.json',
};

// Every test gets a Clerk testing token and fails on uncaught page errors or
// React hydration mismatches (for example, a time rendered differently on the
// server and in the browser).
export const test = base.extend<{ pageProblems: string[] }>({
  pageProblems: [
    async ({ page }, use) => {
      const problems: string[] = [];

      page.on('pageerror', (error) => {
        // WebKit reports requests it cancels during navigation (and PostHog's
        // cross-origin call on localhost) as "access control checks" errors.
        // Those are browser noise, not app errors.
        if (/due to access control checks|posthog/i.test(error.message)) {
          return;
        }
        problems.push(error.message);
      });
      page.on('console', (message) => {
        if (message.type() === 'error' && /hydrat/i.test(message.text())) {
          problems.push(message.text());
        }
      });

      await setupClerkTestingToken({ page });
      await use(problems);

      expect(problems, 'page errors or hydration warnings').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
