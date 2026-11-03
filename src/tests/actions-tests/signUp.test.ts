import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { signUps } from '@/db/schema';
import { deleteSignUpAction, updateSignUpAction } from '@/lib/actions/signUp';
import { getCurrentAppUser } from '@/lib/auth';
import { createOpportunity } from '@/lib/dal/opportunity';
import {
  asActiveAppUser,
  cleanupTestTenant,
  createTestTenantAndAdmin,
  createTestVolunteer,
} from '../dal-tests/dal-test-utils';

vi.mock('@/lib/auth', () => ({
  getCurrentAppUser: vi.fn(),
}));

describe('signUp actions', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];
  let oppId: string;

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
    oppId = await createOpportunity(tenant.id, admin.id, {
      title: 'Park Cleanup',
      description: null,
      opportunityType: 'virtual',
      location: null,
      imageUrl: null,
      startTime: new Date('2026-06-01T14:00:00Z'),
      endTime: new Date('2026-06-01T16:00:00Z'),
      timeZone: null,
      hasPhysicalLocation: false,
      mealProvided: false,
      mealOptions: [],
      tshirtProvided: false,
      maxSignupsAllowed: null,
    });
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
    vi.clearAllMocks();
  });

  async function createTestSignUp() {
    const volunteer = await createTestVolunteer(tenant.id);
    const [signUp] = await db
      .insert(signUps)
      .values({
        tenantId: tenant.id,
        userId: volunteer.id,
        opportunityId: oppId,
        estimatedHours: 2,
        createdBy: volunteer.id,
      })
      .returning();

    return { volunteer, signUp };
  }

  describe('deleteSignUpAction', () => {
    it('throws Not authorized for a non-admin user and leaves the row untouched', async () => {
      const { signUp, volunteer } = await createTestSignUp();
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      await expect(deleteSignUpAction(oppId, signUp.id)).rejects.toThrow(
        'Not authorized',
      );

      const [row] = await db
        .select()
        .from(signUps)
        .where(eq(signUps.id, signUp.id));
      expect(row.deletedAt).toBeNull();
    });

    it('soft-deletes the sign-up and revalidates for an admin', async () => {
      const { signUp } = await createTestSignUp();
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

      await deleteSignUpAction(oppId, signUp.id);

      const [row] = await db
        .select()
        .from(signUps)
        .where(eq(signUps.id, signUp.id));
      expect(row.deletedAt).not.toBeNull();
      expect(row.deletedBy).toBe(admin.id);
      expect(revalidatePath).toHaveBeenCalledWith(
        `/opportunities/manage/${oppId}`,
      );
    });
  });

  describe('updateSignUpAction', () => {
    it('throws Not authorized for a non-admin user', async () => {
      const { signUp, volunteer } = await createTestSignUp();
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      await expect(
        updateSignUpAction(oppId, signUp.id, {
          workCompleted: true,
          actualHours: '3',
        }),
      ).rejects.toThrow('Not authorized');
    });

    it('returns a validation message for invalid form input', async () => {
      const { signUp } = await createTestSignUp();
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

      const result = await updateSignUpAction(oppId, signUp.id, {
        workCompleted: true,
        actualHours: '-1',
      });

      expect(result).toEqual({
        success: false,
        message: 'Please fix the errors in the form',
      });
    });

    it('updates the sign-up and revalidates for an admin', async () => {
      const { signUp } = await createTestSignUp();
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

      const result = await updateSignUpAction(oppId, signUp.id, {
        workCompleted: true,
        actualHours: '3.5',
      });

      expect(result).toEqual({ success: true });

      const [row] = await db
        .select()
        .from(signUps)
        .where(eq(signUps.id, signUp.id));
      expect(row.workCompleted).toBe(true);
      expect(row.actualHours).toBe(3.5);
      expect(row.updatedBy).toBe(admin.id);
      expect(revalidatePath).toHaveBeenCalledWith(
        `/opportunities/manage/${oppId}`,
      );
    });
  });
});
