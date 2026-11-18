import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/reports/export/route';
import { getCurrentAppUser } from '@/lib/auth';
import {
  asActiveAppUser,
  cleanupTestTenant,
  createPublished,
  createTestTenantAndAdmin,
  createTestVolunteer,
  daysFromNow,
  insertSignUp,
} from '../dal-tests/dal-test-utils';

vi.mock('@/lib/auth', () => ({
  getCurrentAppUser: vi.fn(),
}));

function exportRequest(query: string) {
  return new Request(`http://localhost/api/reports/export?${query}`);
}

describe('GET /api/reports/export', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
    vi.clearAllMocks();
  });

  it('returns 404 for a non-admin employee', async () => {
    const volunteer = await createTestVolunteer(tenant.id);
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(volunteer));

    const response = await GET(exportRequest('type=volunteers'));

    expect(response.status).toBe(404);
  });

  it('returns 404 when signed out', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue({ status: 'signed-out' });

    const response = await GET(exportRequest('type=volunteers'));

    expect(response.status).toBe(404);
  });

  it('returns 400 for an unknown export type', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

    const response = await GET(exportRequest('type=salaries'));

    expect(response.status).toBe(400);
  });

  it('downloads volunteer hours as CSV for an admin', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
    const volunteer = await createTestVolunteer(tenant.id);
    const oppId = await createPublished(tenant.id, admin.id, {
      title: 'Cleanup',
      startTime: daysFromNow(-3),
      endTime: daysFromNow(-3, 16),
    });
    await insertSignUp(tenant.id, volunteer.id, oppId, {
      workCompleted: true,
      actualHours: 2.5,
    });

    const response = await GET(exportRequest('type=volunteers&range=30d'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toMatch(
      /^attachment; filename="volunteers-30d-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(await response.text()).toBe(
      'First name,Last name,Email,Signups,Completed,Hours\r\n' +
        `Vol,Unteer,${volunteer.email},1,1,2.5`,
    );
  });

  it('downloads the opportunity summary, defaulting the range', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
    await createPublished(tenant.id, admin.id, {
      title: 'Cleanup, part 2',
      startTime: daysFromNow(-3),
      endTime: daysFromNow(-3, 16),
      maxSignupsAllowed: 10,
    });

    const response = await GET(exportRequest('type=opportunities&range=bogus'));
    const [header, row] = (await response.text()).split('\r\n');

    expect(response.headers.get('Content-Disposition')).toContain(
      'opportunities-12m-',
    );
    expect(header).toBe(
      'Opportunity,Type,Start (UTC),Capacity,Signups,Completed,Hours',
    );
    expect(row).toMatch(/^"Cleanup, part 2",virtual,.+Z,10,0,0,0$/);
  });
});
