import {
  daysFromNow,
  findSignUp,
  findUser,
  seedOpportunity,
  seedSignUp,
  uniqueTitle,
} from './support/db';
import { authFile, expect, test } from './support/fixtures';
import { exactly } from './support/text';

test.use({ storageState: authFile.employee });

let admin: Awaited<ReturnType<typeof findUser>>;
let employee: Awaited<ReturnType<typeof findUser>>;

test.beforeAll(async () => {
  admin = await findUser(process.env.E2E_ADMIN_EMAIL ?? '');
  employee = await findUser(process.env.E2E_EMPLOYEE_EMAIL ?? '');
});

test('finds an opportunity and signs up from the side sheet', async ({
  page,
}) => {
  const opportunity = await seedOpportunity(admin, {
    title: uniqueTitle('Food drive'),
    tshirtProvided: true,
    meals: ['Pizza', 'Salad'],
  });

  await page.goto('/opportunities');
  await page
    .getByPlaceholder('Search opportunities...')
    .fill(opportunity.title);
  const card = page.getByRole('link', { name: exactly(opportunity.title) });
  await expect(card).toHaveCount(1);
  await card.click();

  await expect(page).toHaveURL(`/opportunities/view/${opportunity.id}`);
  const sheet = page.getByRole('dialog');
  await expect(
    sheet.getByRole('heading', { name: opportunity.title }),
  ).toBeVisible();

  await sheet.getByRole('switch', { name: "I'd like a meal" }).click();
  await sheet.getByRole('button', { name: 'Sign up', exact: true }).click();
  await expect(sheet.getByText('Select a meal', { exact: true })).toBeVisible();

  await sheet.getByRole('combobox', { name: 'Meal choice' }).click();
  await page.getByRole('option', { name: 'Pizza' }).click();
  await sheet.getByRole('switch', { name: "I'd like a t-shirt" }).click();
  await sheet.getByRole('combobox', { name: 'T-shirt size' }).click();
  await page.getByRole('option', { name: 'Large', exact: true }).click();
  await sheet.getByRole('button', { name: 'Sign up', exact: true }).click();

  await expect(page.getByText("You're signed up!")).toBeVisible();
  await expect(
    sheet.getByText("You're signed up for this opportunity."),
  ).toBeVisible();
  expect(await findSignUp(employee.id, opportunity.id)).toMatchObject({
    wantsMeal: true,
    wantsTShirt: true,
    tshirtSize: 'lg',
  });

  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/opportunities');
  await expect(card.getByText('Signed up')).toBeVisible();
});

test('a full opportunity cannot be joined', async ({ page }) => {
  const opportunity = await seedOpportunity(admin, {
    title: uniqueTitle('Full'),
    maxSignupsAllowed: 1,
  });
  await seedSignUp(admin, opportunity.id);

  await page.goto(`/opportunities/view/${opportunity.id}`);

  await expect(page.getByText('This opportunity is full.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Sign up', exact: true }),
  ).toHaveCount(0);
});

test('edits and then cancels an upcoming signup', async ({ page }) => {
  const opportunity = await seedOpportunity(admin, {
    title: uniqueTitle('Tutoring'),
  });
  await seedSignUp(employee, opportunity.id);

  await page.goto('/my-signups');
  const card = page
    .locator('[data-slot=card]')
    .filter({ hasText: opportunity.title });

  await card.getByRole('button', { name: 'Edit' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Estimated hours').fill('4');
  await sheet.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Signup updated')).toBeVisible();
  await expect(card.getByText('Est. 4 hrs')).toBeVisible();

  await card.getByRole('button', { name: 'Cancel signup' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancel signup' })
    .click();
  await expect(page.getByText('Signup cancelled')).toBeVisible();
  await expect(card).toHaveCount(0);
  expect(await findSignUp(employee.id, opportunity.id)).toBeUndefined();
});

test('logs hours for a past opportunity', async ({ page }) => {
  const opportunity = await seedOpportunity(admin, {
    title: uniqueTitle('Cleanup'),
    startTime: daysFromNow(-2),
  });
  await seedSignUp(employee, opportunity.id);

  await page.goto('/my-signups');
  const card = page
    .locator('[data-slot=card]')
    .filter({ hasText: opportunity.title });
  await expect(card.getByText('Hours not logged')).toBeVisible();

  await card.getByRole('button', { name: 'Log hours' }).click();
  await page.getByLabel('Hours volunteered').fill('3');
  await page.getByRole('button', { name: 'Save hours' }).click();

  await expect(page.getByText('Hours logged. Thank you!')).toBeVisible();
  await expect(card.getByText('Completed · 3 hrs')).toBeVisible();
  expect(await findSignUp(employee.id, opportunity.id)).toMatchObject({
    workCompleted: true,
    actualHours: 3,
  });
});

test('admin pages are hidden from employees', async ({ page }) => {
  for (const path of [
    '/opportunities/manage',
    '/projects/manage',
    '/reports',
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible();
  }
});
