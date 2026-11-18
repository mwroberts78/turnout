import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { mealOptions, opportunities, signUps } from '@/db/schema';
import {
  cancelOwnSignUp,
  findOwnSignUpById,
  findSignUpsForUser,
  updateOwnSignUp,
} from '@/lib/dal/signUp';
import type { SignupFormOutput } from '@/lib/schemas/signup-form';
import {
  cleanupTestTenant,
  createPublished,
  createTestTenantAndAdmin,
  createTestVolunteer,
  daysFromNow,
  insertSignUp,
} from './dal-test-utils';

function signupInput(
  overrides: Partial<SignupFormOutput> = {},
): SignupFormOutput {
  return {
    estimatedHours: 3,
    wantsMeal: false,
    selectedMeal: null,
    wantsTShirt: false,
    tshirtSize: null,
    comments: null,
    ...overrides,
  };
}

describe('own signUp DAL', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];
  let volunteer: Awaited<ReturnType<typeof createTestVolunteer>>;

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
    volunteer = await createTestVolunteer(tenant.id);
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
  });

  async function findRow(signUpId: string) {
    const [row] = await db
      .select()
      .from(signUps)
      .where(eq(signUps.id, signUpId));
    return row;
  }

  describe('findSignUpsForUser', () => {
    it("returns only the user's active signups, ordered by start time", async () => {
      const later = await createPublished(tenant.id, admin.id, {
        title: 'Later',
        startTime: daysFromNow(10),
        endTime: daysFromNow(10, 16),
      });
      const sooner = await createPublished(tenant.id, admin.id, {
        title: 'Sooner',
        startTime: daysFromNow(2),
        endTime: daysFromNow(2, 16),
      });
      const cancelled = await createPublished(tenant.id, admin.id, {
        title: 'Cancelled',
      });
      const other = await createTestVolunteer(tenant.id);

      await insertSignUp(tenant.id, volunteer.id, later);
      await insertSignUp(tenant.id, volunteer.id, sooner);
      await insertSignUp(tenant.id, volunteer.id, cancelled, {
        deletedAt: new Date(),
      });
      await insertSignUp(tenant.id, other.id, later);

      const result = await findSignUpsForUser(tenant.id, volunteer.id);

      expect(result.map((s) => s.opportunity.title)).toEqual([
        'Sooner',
        'Later',
      ]);
    });

    it('hides signups whose opportunity was deleted', async () => {
      const oppId = await createPublished(tenant.id, admin.id);
      await insertSignUp(tenant.id, volunteer.id, oppId);
      await db
        .update(opportunities)
        .set({ deletedAt: new Date() })
        .where(eq(opportunities.id, oppId));

      expect(await findSignUpsForUser(tenant.id, volunteer.id)).toEqual([]);
    });

    it('includes the selected meal and the opportunity meal options', async () => {
      const oppId = await createPublished(tenant.id, admin.id, {
        mealProvided: true,
        mealOptions: [{ mealName: 'Pizza' }, { mealName: 'Salad' }],
      });
      const [pizza] = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.mealName, 'Pizza'));
      await insertSignUp(tenant.id, volunteer.id, oppId, {
        wantsMeal: true,
        selectedMeal: pizza.id,
      });

      const [result] = await findSignUpsForUser(tenant.id, volunteer.id);

      expect(result.selectedMealOption?.mealName).toBe('Pizza');
      expect(result.opportunity.mealOptions).toHaveLength(2);
    });
  });

  describe('findOwnSignUpById', () => {
    it("returns null for another user's signup", async () => {
      const oppId = await createPublished(tenant.id, admin.id);
      const other = await createTestVolunteer(tenant.id);
      const signUp = await insertSignUp(tenant.id, other.id, oppId);

      expect(
        await findOwnSignUpById(signUp.id, tenant.id, volunteer.id),
      ).toBeNull();
    });

    it('returns the signup for its owner', async () => {
      const oppId = await createPublished(tenant.id, admin.id);
      const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);

      const result = await findOwnSignUpById(
        signUp.id,
        tenant.id,
        volunteer.id,
      );

      expect(result?.id).toBe(signUp.id);
    });
  });

  describe('updateOwnSignUp', () => {
    it('updates the signup and records who changed it', async () => {
      const oppId = await createPublished(tenant.id, admin.id, {
        tshirtProvided: true,
      });
      const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);

      const result = await updateOwnSignUp(
        signUp.id,
        tenant.id,
        volunteer.id,
        signupInput({ wantsTShirt: true, tshirtSize: 'lg', comments: 'Hi' }),
      );

      expect(result).toEqual({ ok: true });
      expect(await findRow(signUp.id)).toMatchObject({
        estimatedHours: 3,
        wantsTShirt: true,
        tshirtSize: 'lg',
        comments: 'Hi',
        updatedBy: volunteer.id,
      });
    });

    it("returns not-found for another user's signup and leaves it alone", async () => {
      const oppId = await createPublished(tenant.id, admin.id);
      const other = await createTestVolunteer(tenant.id);
      const signUp = await insertSignUp(tenant.id, other.id, oppId);

      const result = await updateOwnSignUp(
        signUp.id,
        tenant.id,
        volunteer.id,
        signupInput(),
      );

      expect(result).toEqual({ ok: false, reason: 'not-found' });
      expect((await findRow(signUp.id)).estimatedHours).toBe(2);
    });

    it('returns not-found for a cancelled signup', async () => {
      const oppId = await createPublished(tenant.id, admin.id);
      const signUp = await insertSignUp(tenant.id, volunteer.id, oppId, {
        deletedAt: new Date(),
      });

      expect(
        await updateOwnSignUp(
          signUp.id,
          tenant.id,
          volunteer.id,
          signupInput(),
        ),
      ).toEqual({ ok: false, reason: 'not-found' });
    });

    it('returns started once the opportunity has begun', async () => {
      const oppId = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(-1),
        endTime: daysFromNow(-1, 16),
      });
      const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);

      expect(
        await updateOwnSignUp(
          signUp.id,
          tenant.id,
          volunteer.id,
          signupInput(),
        ),
      ).toEqual({ ok: false, reason: 'started' });
    });

    it('returns invalid-meal for a meal from another opportunity', async () => {
      const oppId = await createPublished(tenant.id, admin.id, {
        mealProvided: true,
        mealOptions: [{ mealName: 'Pizza' }],
      });
      const otherId = await createPublished(tenant.id, admin.id, {
        mealProvided: true,
        mealOptions: [{ mealName: 'Tacos' }],
      });
      const [tacos] = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.opportunityId, otherId));
      const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);

      expect(
        await updateOwnSignUp(
          signUp.id,
          tenant.id,
          volunteer.id,
          signupInput({ wantsMeal: true, selectedMeal: tacos.id }),
        ),
      ).toEqual({ ok: false, reason: 'invalid-meal' });
    });
  });

  describe('cancelOwnSignUp', () => {
    it('soft-deletes the signup and records who cancelled it', async () => {
      const oppId = await createPublished(tenant.id, admin.id);
      const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);

      expect(await cancelOwnSignUp(signUp.id, tenant.id, volunteer.id)).toEqual(
        { ok: true },
      );

      const row = await findRow(signUp.id);
      expect(row.deletedAt).not.toBeNull();
      expect(row.deletedBy).toBe(volunteer.id);
    });

    it("returns not-found for another user's signup", async () => {
      const oppId = await createPublished(tenant.id, admin.id);
      const other = await createTestVolunteer(tenant.id);
      const signUp = await insertSignUp(tenant.id, other.id, oppId);

      expect(await cancelOwnSignUp(signUp.id, tenant.id, volunteer.id)).toEqual(
        { ok: false, reason: 'not-found' },
      );
      expect((await findRow(signUp.id)).deletedAt).toBeNull();
    });

    it('returns started once the opportunity has begun', async () => {
      const oppId = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(-1),
        endTime: daysFromNow(-1, 16),
      });
      const signUp = await insertSignUp(tenant.id, volunteer.id, oppId);

      expect(await cancelOwnSignUp(signUp.id, tenant.id, volunteer.id)).toEqual(
        { ok: false, reason: 'started' },
      );
      expect((await findRow(signUp.id)).deletedAt).toBeNull();
    });

    it("returns not-found for another tenant's signup", async () => {
      const other = await createTestTenantAndAdmin();
      try {
        const oppId = await createPublished(other.tenant.id, other.admin.id);
        const signUp = await insertSignUp(
          other.tenant.id,
          other.admin.id,
          oppId,
        );

        expect(
          await cancelOwnSignUp(signUp.id, tenant.id, other.admin.id),
        ).toEqual({ ok: false, reason: 'not-found' });
      } finally {
        await cleanupTestTenant(other.tenant.id);
      }
    });
  });
});
