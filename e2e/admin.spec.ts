import { setupClerkTestingToken } from '@clerk/testing/playwright';
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

test.use({ storageState: authFile.admin });

let admin: Awaited<ReturnType<typeof findUser>>;
let employee: Awaited<ReturnType<typeof findUser>>;

test.beforeAll(async () => {
  admin = await findUser(process.env.E2E_ADMIN_EMAIL ?? '');
  employee = await findUser(process.env.E2E_EMPLOYEE_EMAIL ?? '');
});

test('builds and publishes a project that employees can browse', async ({
  page,
  browser,
}) => {
  const opportunity = await seedOpportunity(admin, {
    title: uniqueTitle('Planting'),
  });
  const title = uniqueTitle('Service Week');

  await page.goto('/projects/manage/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill('A week of service.');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByRole('combobox', { name: 'Opportunity' }).click();
  await page.getByRole('option', { name: exactly(opportunity.title) }).click();
  await page.getByRole('button', { name: 'Add to project' }).click();
  await expect(
    page.getByRole('link', { name: opportunity.title }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Publish' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Publish' })
    .click();
  await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible();

  const employeeContext = await browser.newContext({
    storageState: authFile.employee,
  });
  const employeePage = await employeeContext.newPage();
  await setupClerkTestingToken({ page: employeePage });
  await employeePage.goto('/projects');
  await employeePage.getByRole('link', { name: exactly(title) }).click();
  await expect(
    employeePage.getByRole('heading', { name: title }),
  ).toBeVisible();
  await expect(
    employeePage.getByRole('link', { name: exactly(opportunity.title) }),
  ).toBeVisible();
  await employeeContext.close();
});

test('reports show logged hours and download as CSV', async ({ page }) => {
  const opportunity = await seedOpportunity(admin, {
    title: uniqueTitle('Report'),
    startTime: daysFromNow(-5),
  });
  await seedSignUp(employee, opportunity.id, {
    workCompleted: true,
    actualHours: 2.5,
  });

  await page.goto('/reports');
  const row = page.getByRole('row').filter({ hasText: opportunity.title });
  await expect(row).toContainText('2.5');

  const byOpportunity = page
    .locator('[data-slot=card]')
    .filter({ hasText: 'By opportunity' });
  const downloadPromise = page.waitForEvent('download');
  await byOpportunity.getByRole('button', { name: 'CSV' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^opportunities-12m-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  expect(Buffer.concat(chunks).toString()).toContain(opportunity.title);
});

test('marks a volunteer complete from the signups table', async ({ page }) => {
  const opportunity = await seedOpportunity(admin, {
    title: uniqueTitle('Mark complete'),
    startTime: daysFromNow(-1),
  });
  await seedSignUp(employee, opportunity.id);

  await page.goto(`/opportunities/manage/${opportunity.id}`);
  const row = page.getByRole('row').filter({ hasText: employee.email });
  await row.getByRole('button').last().click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();

  const sheet = page.getByRole('dialog');
  await sheet.getByRole('switch', { name: 'Work completed' }).click();
  await sheet.getByLabel('Actual hours').fill('1.5');
  await sheet.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Signup updated')).toBeVisible();
  await expect
    .poll(() => findSignUp(employee.id, opportunity.id))
    .toMatchObject({ workCompleted: true, actualHours: 1.5 });
});
