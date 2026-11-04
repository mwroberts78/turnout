import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { mealOptions, opportunities, signUps } from '@/db/schema';
import { createOpportunity } from '@/lib/dal/opportunity';
import { createSignUp, deleteSignUp, updateSignUp } from '@/lib/dal/signUp';
import type { SignupFormOutput } from '@/lib/schemas/signup-form';
import {
  baseOpportunityInput,
  cleanupTestTenant,
  createPublished,
  createTestTenantAndAdmin,
  createTestVolunteer,
  daysFromNow,
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

  describe('createSignUp', () => {
    function signupInput(
      overrides: Partial<SignupFormOutput> = {},
    ): SignupFormOutput {
      return {
        estimatedHours: 2,
        wantsMeal: false,
        selectedMeal: null,
        wantsTShirt: false,
        tshirtSize: null,
        comments: null,
        ...overrides,
      };
    }

    it('creates a signup with tenant and creator derived server-side', async () => {
      const publishedId = await createPublished(tenant.id, admin.id);
      const volunteer = await createTestVolunteer(tenant.id);

      const result = await createSignUp(
        publishedId,
        tenant.id,
        volunteer.id,
        signupInput({ comments: 'Excited!' }),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const [row] = await db
        .select()
        .from(signUps)
        .where(eq(signUps.id, result.signUpId));

      expect(row).toMatchObject({
        tenantId: tenant.id,
        userId: volunteer.id,
        opportunityId: publishedId,
        createdBy: volunteer.id,
        estimatedHours: 2,
        comments: 'Excited!',
      });
    });

    it('returns not-found for an unpublished opportunity', async () => {
      const draftId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput({
          startTime: daysFromNow(7),
          endTime: daysFromNow(7, 16),
        }),
      );
      const volunteer = await createTestVolunteer(tenant.id);

      const result = await createSignUp(
        draftId,
        tenant.id,
        volunteer.id,
        signupInput(),
      );

      expect(result).toEqual({ ok: false, reason: 'not-found' });
    });

    it('returns not-found for a soft-deleted opportunity', async () => {
      const publishedId = await createPublished(tenant.id, admin.id);
      await db
        .update(opportunities)
        .set({ deletedAt: new Date() })
        .where(eq(opportunities.id, publishedId));
      const volunteer = await createTestVolunteer(tenant.id);

      const result = await createSignUp(
        publishedId,
        tenant.id,
        volunteer.id,
        signupInput(),
      );

      expect(result).toEqual({ ok: false, reason: 'not-found' });
    });

    it('returns not-found for another tenant’s opportunity', async () => {
      const other = await createTestTenantAndAdmin();
      try {
        const otherOppId = await createPublished(
          other.tenant.id,
          other.admin.id,
        );
        const volunteer = await createTestVolunteer(tenant.id);

        const result = await createSignUp(
          otherOppId,
          tenant.id,
          volunteer.id,
          signupInput(),
        );

        expect(result).toEqual({ ok: false, reason: 'not-found' });
      } finally {
        await cleanupTestTenant(other.tenant.id);
      }
    });

    it('returns started for an opportunity that has already begun', async () => {
      const pastId = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(-1),
        endTime: daysFromNow(-1, 16),
      });
      const volunteer = await createTestVolunteer(tenant.id);

      const result = await createSignUp(
        pastId,
        tenant.id,
        volunteer.id,
        signupInput(),
      );

      expect(result).toEqual({ ok: false, reason: 'started' });
    });

    it('returns already-signed-up on a second signup', async () => {
      const publishedId = await createPublished(tenant.id, admin.id);
      const volunteer = await createTestVolunteer(tenant.id);

      await createSignUp(publishedId, tenant.id, volunteer.id, signupInput());
      const second = await createSignUp(
        publishedId,
        tenant.id,
        volunteer.id,
        signupInput(),
      );

      expect(second).toEqual({ ok: false, reason: 'already-signed-up' });
    });

    it('allows signing up again after a cancelled signup', async () => {
      const publishedId = await createPublished(tenant.id, admin.id);
      const volunteer = await createTestVolunteer(tenant.id);

      const first = await createSignUp(
        publishedId,
        tenant.id,
        volunteer.id,
        signupInput(),
      );
      if (!first.ok) throw new Error('first signup failed');
      await deleteSignUp(first.signUpId, tenant.id, volunteer.id);

      const second = await createSignUp(
        publishedId,
        tenant.id,
        volunteer.id,
        signupInput(),
      );

      expect(second.ok).toBe(true);
    });

    it('returns full at capacity, and a cancellation frees the spot', async () => {
      const publishedId = await createPublished(tenant.id, admin.id, {
        maxSignupsAllowed: 1,
      });
      const first = await createTestVolunteer(tenant.id);
      const second = await createTestVolunteer(tenant.id);

      const firstResult = await createSignUp(
        publishedId,
        tenant.id,
        first.id,
        signupInput(),
      );
      if (!firstResult.ok) throw new Error('first signup failed');

      expect(
        await createSignUp(publishedId, tenant.id, second.id, signupInput()),
      ).toEqual({ ok: false, reason: 'full' });

      await deleteSignUp(firstResult.signUpId, tenant.id, first.id);

      expect(
        (await createSignUp(publishedId, tenant.id, second.id, signupInput()))
          .ok,
      ).toBe(true);
    });

    it('saves a meal belonging to the opportunity', async () => {
      const publishedId = await createPublished(tenant.id, admin.id, {
        mealProvided: true,
        mealOptions: [{ mealName: 'Pizza' }],
      });
      const [meal] = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.opportunityId, publishedId));
      const volunteer = await createTestVolunteer(tenant.id);

      const result = await createSignUp(
        publishedId,
        tenant.id,
        volunteer.id,
        signupInput({ wantsMeal: true, selectedMeal: meal.id }),
      );

      expect(result.ok).toBe(true);
    });

    it('returns invalid-meal for a meal from another opportunity', async () => {
      const publishedId = await createPublished(tenant.id, admin.id, {
        mealProvided: true,
        mealOptions: [{ mealName: 'Pizza' }],
      });
      const otherId = await createPublished(tenant.id, admin.id, {
        mealProvided: true,
        mealOptions: [{ mealName: 'Tacos' }],
      });
      const [otherMeal] = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.opportunityId, otherId));
      const volunteer = await createTestVolunteer(tenant.id);

      const result = await createSignUp(
        publishedId,
        tenant.id,
        volunteer.id,
        signupInput({ wantsMeal: true, selectedMeal: otherMeal.id }),
      );

      expect(result).toEqual({ ok: false, reason: 'invalid-meal' });
    });

    it('lets only one of two simultaneous signups take the last spot', async () => {
      const publishedId = await createPublished(tenant.id, admin.id, {
        maxSignupsAllowed: 1,
      });
      const a = await createTestVolunteer(tenant.id);
      const b = await createTestVolunteer(tenant.id);

      const results = await Promise.all([
        createSignUp(publishedId, tenant.id, a.id, signupInput()),
        createSignUp(publishedId, tenant.id, b.id, signupInput()),
      ]);

      expect(results.filter((r) => r.ok)).toHaveLength(1);
      expect(results.filter((r) => !r.ok)).toEqual([
        { ok: false, reason: 'full' },
      ]);
    });
  });
});
