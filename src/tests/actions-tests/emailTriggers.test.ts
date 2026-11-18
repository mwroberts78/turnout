import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteOpportunityAction,
  saveOpportunityAction,
} from '@/lib/actions/opportunity';
import {
  cancelOwnSignUpAction,
  createSignUpAction,
  deleteSignUpAction,
  updateSignUpAction,
} from '@/lib/actions/signUp';
import { getCurrentAppUser } from '@/lib/auth';
import { queueEmails } from '@/lib/email/queue';
import type { EmailMessage } from '@/lib/email/templates';
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

function queued(): EmailMessage[] {
  return vi.mocked(queueEmails).mock.calls.flatMap(([messages]) => messages);
}

function signupForm(overrides: Record<string, unknown> = {}) {
  return {
    estimatedHours: '2',
    wantsMeal: false,
    selectedMeal: null,
    wantsTShirt: false,
    tshirtSize: null,
    comments: '',
    ...overrides,
  };
}

// Form values for an opportunity in New York, starting `days` from now.
function opportunityForm(
  days: number,
  overrides: Record<string, unknown> = {},
) {
  const day = daysFromNow(days).toISOString().slice(0, 10);
  return {
    title: 'Park Cleanup',
    description: null,
    opportunityType: 'in-person' as const,
    location: 'Riverside Park',
    imageUrl: null,
    startTime: `${day}T10:00`,
    endTime: `${day}T12:00`,
    timeZone: 'America/New_York',
    hasPhysicalLocation: true,
    mealProvided: false,
    mealOptions: [],
    tshirtProvided: false,
    maxSignupsAllowed: '',
    ...overrides,
  };
}

describe('email triggers', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];
  let volunteer: Awaited<ReturnType<typeof createTestVolunteer>>;

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
    volunteer = await createTestVolunteer(tenant.id);
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
    vi.clearAllMocks();
  });

  it('confirms a new signup to the volunteer', async () => {
    const oppId = await createPublished(tenant.id, admin.id, {
      title: 'Food Drive',
    });
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(volunteer));

    await createSignUpAction(oppId, signupForm());

    expect(queued()).toMatchObject([
      { to: volunteer.email, subject: "You're signed up: Food Drive" },
    ]);
  });

  it('sends nothing when a signup is refused', async () => {
    const oppId = await createPublished(tenant.id, admin.id, {
      maxSignupsAllowed: 1,
    });
    const other = await createTestVolunteer(tenant.id);
    await insertSignUp(tenant.id, other.id, oppId);
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(volunteer));

    await createSignUpAction(oppId, signupForm());

    expect(queued()).toEqual([]);
  });

  it('confirms when a volunteer cancels their own signup', async () => {
    const oppId = await createPublished(tenant.id, admin.id, {
      title: 'Food Drive',
    });
    const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(volunteer));

    await cancelOwnSignUpAction(signUp.id);

    expect(queued()).toMatchObject([
      { to: volunteer.email, subject: 'Signup cancelled: Food Drive' },
    ]);
  });

  it('tells the volunteer when an admin removes their signup', async () => {
    const oppId = await createPublished(tenant.id, admin.id, {
      title: 'Food Drive',
    });
    const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

    await deleteSignUpAction(oppId, signUp.id);

    expect(queued()).toMatchObject([
      {
        to: volunteer.email,
        subject: "You've been removed from Food Drive",
      },
    ]);
  });

  it('tells the volunteer when an admin changes their hours, but not on a no-op save', async () => {
    const oppId = await createPublished(tenant.id, admin.id, {
      title: 'Food Drive',
    });
    const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

    await updateSignUpAction(oppId, signUp.id, {
      workCompleted: false,
      actualHours: '',
    });
    expect(queued()).toEqual([]);

    await updateSignUpAction(oppId, signUp.id, {
      workCompleted: true,
      actualHours: '3',
    });
    expect(queued()).toMatchObject([
      {
        to: volunteer.email,
        subject: 'Your hours were updated: Food Drive',
      },
    ]);
    expect(queued()[0].text).toContain('Status: Completed, 3 hrs');
  });

  it('warns everyone signed up when an upcoming opportunity is deleted', async () => {
    const oppId = await createPublished(tenant.id, admin.id, {
      title: 'Food Drive',
    });
    const other = await createTestVolunteer(tenant.id);
    await insertSignUp(tenant.id, volunteer.id, oppId);
    await insertSignUp(tenant.id, other.id, oppId);
    await insertSignUp(tenant.id, admin.id, oppId, { deletedAt: new Date() });
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

    await deleteOpportunityAction(oppId);

    expect(queued()).toHaveLength(2);
    expect(queued().every((m) => m.subject === 'Cancelled: Food Drive')).toBe(
      true,
    );
  });

  it('stays quiet when deleting an opportunity that already happened', async () => {
    const oppId = await createPublished(tenant.id, admin.id, {
      startTime: daysFromNow(-3),
      endTime: daysFromNow(-3, 16),
    });
    await insertSignUp(tenant.id, volunteer.id, oppId);
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

    await deleteOpportunityAction(oppId);

    expect(queued()).toEqual([]);
  });

  it('emails signed-up volunteers when the time or place changes', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
    const created = await saveOpportunityAction(
      null,
      opportunityForm(10),
      'America/New_York',
    );
    if (!created.success) throw new Error(created.message);
    await insertSignUp(tenant.id, volunteer.id, created.id);

    await saveOpportunityAction(
      created.id,
      opportunityForm(10, { description: 'Bring gloves' }),
      'America/New_York',
    );
    expect(queued()).toEqual([]);

    await saveOpportunityAction(
      created.id,
      opportunityForm(10, { location: 'Lakeside Park' }),
      'America/New_York',
    );
    expect(queued()).toMatchObject([
      { to: volunteer.email, subject: 'Updated details: Park Cleanup' },
    ]);
    expect(queued()[0].text).toContain('Where: Lakeside Park');
  });
});
