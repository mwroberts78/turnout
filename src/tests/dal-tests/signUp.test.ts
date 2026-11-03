import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { signUps } from '@/db/schema';
import { createOpportunity } from '@/lib/dal/opportunity';
import { deleteSignUp, updateSignUp } from '@/lib/dal/signUp';
import {
  cleanupTestTenant,
  createTestTenantAndAdmin,
  createTestVolunteer,
} from './dal-test-utils';

describe('signUp DAL', () => {
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

  describe('deleteSignUp', () => {
    it('sets deletedAt and deletedBy instead of removing the row', async () => {
      const { signUp } = await createTestSignUp();

      await deleteSignUp(signUp.id, tenant.id, admin.id);

      const [row] = await db
        .select()
        .from(signUps)
        .where(eq(signUps.id, signUp.id));
      expect(row.deletedAt).not.toBeNull();
      expect(row.deletedBy).toBe(admin.id);
    });
  });

  describe('updateSignUp', () => {
    it('updates workCompleted and actualHours, recording the acting user', async () => {
      const { signUp } = await createTestSignUp();

      await updateSignUp(signUp.id, tenant.id, admin.id, {
        workCompleted: true,
        actualHours: 3.5,
      });

      const [row] = await db
        .select()
        .from(signUps)
        .where(eq(signUps.id, signUp.id));
      expect(row.workCompleted).toBe(true);
      expect(row.actualHours).toBe(3.5);
      expect(row.updatedBy).toBe(admin.id);
    });

    it('allows clearing actualHours back to null', async () => {
      const { signUp } = await createTestSignUp();
      await updateSignUp(signUp.id, tenant.id, admin.id, {
        workCompleted: true,
        actualHours: 3.5,
      });

      await updateSignUp(signUp.id, tenant.id, admin.id, {
        workCompleted: false,
        actualHours: null,
      });

      const [row] = await db
        .select()
        .from(signUps)
        .where(eq(signUps.id, signUp.id));
      expect(row.workCompleted).toBe(false);
      expect(row.actualHours).toBeNull();
    });
  });
});
