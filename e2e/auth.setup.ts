import { clerk } from '@clerk/testing/playwright';
import { authFile, expect, test } from './support/fixtures';

const accounts = [
  { role: 'admin', email: process.env.E2E_ADMIN_EMAIL },
  { role: 'employee', email: process.env.E2E_EMPLOYEE_EMAIL },
] as const;

for (const { role, email } of accounts) {
  test(`sign in as ${role}`, async ({ page }) => {
    if (!email)
      throw new Error(`Set E2E_${role.toUpperCase()}_EMAIL in .env.e2e`);

    await page.goto('/');
    await clerk.signIn({ page, emailAddress: email });
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: /Welcome back/ }),
    ).toBeVisible();

    await page.context().storageState({ path: authFile[role] });
  });
}
