import { eq } from 'drizzle-orm';
import { refresh } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { signUps } from '@/db/schema';
import {
  cancelOwnSignUpAction,
  reportOwnHoursAction,
  updateOwnSignUpAction,
} from '@/lib/actions/signUp';
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

function formInput(overrides: Record<string, unknown> = {}) {
  return {
    estimatedHours: '3',
    wantsMeal: false,
    selectedMeal: null,
    wantsTShirt: false,
    tshirtSize: null,
    comments: '',
    ...overrides,
  };
}

describe('own signUp actions', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];
  let volunteer: Awaited<ReturnType<typeof createTestVolunteer>>;
  let signUpId: string;

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
    volunteer = await createTestVolunteer(tenant.id);
    const oppId = await createPublished(tenant.id, admin.id, {
      tshirtProvided: true,
    });
    ({ id: signUpId } = await insertSignUp(tenant.id, volunteer.id, oppId));
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
    vi.clearAllMocks();
  });

  async function findRow() {
    const [row] = await db
      .select()
      .from(signUps)
      .where(eq(signUps.id, signUpId));
    return row;
  }

  describe('updateOwnSignUpAction', () => {
    it('throws Not authorized for a user who is not active', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue({ status: 'signed-out' });

      await expect(
        updateOwnSignUpAction(signUpId, formInput()),
      ).rejects.toThrow('Not authorized');
    });

    it("updates the current user's signup and refreshes the page", async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      const result = await updateOwnSignUpAction(
        signUpId,
        formInput({ wantsTShirt: true, tshirtSize: 'sm' }),
      );

      expect(result).toEqual({ success: true });
      expect(await findRow()).toMatchObject({
        estimatedHours: 3,
        wantsTShirt: true,
        tshirtSize: 'sm',
      });
      expect(refresh).toHaveBeenCalled();
    });

    it("refuses to touch another user's signup", async () => {
      const other = await createTestVolunteer(tenant.id);
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(other));

      const result = await updateOwnSignUpAction(signUpId, formInput());

      expect(result).toEqual({
        success: false,
        message: "This signup isn't available anymore.",
      });
      expect((await findRow()).estimatedHours).toBe(2);
    });

    it('rejects invalid input without writing', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      const result = await updateOwnSignUpAction(
        signUpId,
        formInput({ wantsTShirt: true }),
      );

      expect(result).toEqual({
        success: false,
        message: 'Please fix the errors in the form',
      });
      expect((await findRow()).wantsTShirt).toBe(false);
    });

    it('returns not-found for an id that is not a uuid', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      const result = await updateOwnSignUpAction('nope', formInput());

      expect(result.success).toBe(false);
    });
  });

  describe('cancelOwnSignUpAction', () => {
    it('throws Not authorized for a user who is not active', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue({ status: 'no-org' });

      await expect(cancelOwnSignUpAction(signUpId)).rejects.toThrow(
        'Not authorized',
      );
      expect((await findRow()).deletedAt).toBeNull();
    });

    it("cancels the current user's signup", async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      const result = await cancelOwnSignUpAction(signUpId);

      expect(result).toEqual({ success: true });
      expect((await findRow()).deletedBy).toBe(volunteer.id);
      expect(refresh).toHaveBeenCalled();
    });

    it("refuses to cancel another user's signup, even as an admin", async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

      const result = await cancelOwnSignUpAction(signUpId);

      expect(result.success).toBe(false);
      expect((await findRow()).deletedAt).toBeNull();
    });
  });

  describe('reportOwnHoursAction', () => {
    async function pastSignUpId() {
      const oppId = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(-2),
        endTime: daysFromNow(-2, 16),
      });
      return (await insertSignUp(tenant.id, volunteer.id, oppId)).id;
    }

    it('throws Not authorized for a user who is not active', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue({ status: 'no-org' });

      await expect(
        reportOwnHoursAction(signUpId, { actualHours: '2' }),
      ).rejects.toThrow('Not authorized');
    });

    it('logs hours for the current user and refreshes the page', async () => {
      const id = await pastSignUpId();
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      const result = await reportOwnHoursAction(id, { actualHours: '4' });

      expect(result).toEqual({ success: true });
      const [row] = await db.select().from(signUps).where(eq(signUps.id, id));
      expect(row).toMatchObject({ workCompleted: true, actualHours: 4 });
      expect(refresh).toHaveBeenCalled();
    });

    it('rejects invalid hours without writing', async () => {
      const id = await pastSignUpId();
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      const result = await reportOwnHoursAction(id, { actualHours: '30' });

      expect(result).toEqual({
        success: false,
        message: 'Please fix the errors in the form',
      });
      const [row] = await db.select().from(signUps).where(eq(signUps.id, id));
      expect(row.workCompleted).toBe(false);
    });

    it('explains that hours open once the opportunity starts', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      const result = await reportOwnHoursAction(signUpId, { actualHours: '2' });

      expect(result).toEqual({
        success: false,
        message: 'You can log hours once the opportunity has started.',
      });
    });
  });
});
