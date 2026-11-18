import { expect, test } from './support/fixtures';

test.use({ storageState: { cookies: [], origins: [] } });

test('landing page invites people to get started', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Make it easy for your people to show up.',
    }),
  ).toBeVisible();
  // Link-styled buttons are anchors with role="button" (Base UI's Button
  // rendering a Link), so they're found by the button role.
  await expect(
    page.getByRole('button', { name: 'Get started' }).first(),
  ).toHaveAttribute('href', '/sign-up');
  await expect(page).toHaveTitle('Turnout');
});

test('signed-out visitors are sent to sign in', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/sign-in/);
});

test('unknown pages show the not-found page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
});
