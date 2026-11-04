import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { mealOptions, opportunities, signUps } from '@/db/schema';
import {
  createOpportunity,
  deleteOpportunity,
  findOpportunitiesByTenant,
  findOpportunityById,
  findPublishedOpportunities,
  findPublishedOpportunityById,
  MealOptionInUseError,
  OpportunityConflictError,
  togglePublish,
  updateOpportunity,
} from '@/lib/dal/opportunity';
import {
  baseOpportunityInput,
  cleanupTestTenant,
  createPublished,
  createTestTenantAndAdmin,
  createTestVolunteer,
  daysFromNow,
} from './dal-test-utils';

describe('opportunity DAL', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
  });

  describe('createOpportunity', () => {
    it('creates an opportunity with the given values', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput(),
      );

      expect(oppId).toBeDefined();
    });

    it('creates meal options when mealProvided is true', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput({
          mealProvided: true,
          mealOptions: [{ mealName: 'Vegetarian' }, { mealName: 'Chicken' }],
        }),
      );

      const rows = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.opportunityId, oppId));

      expect(rows.map((r) => r.mealName).sort()).toEqual([
        'Chicken',
        'Vegetarian',
      ]);
      expect(rows.every((r) => r.createdBy === admin.id)).toBe(true);
    });

    it('does not create meal options when mealProvided is false', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput({
          mealProvided: false,
          mealOptions: [{ mealName: 'Vegetarian' }],
        }),
      );

      const rows = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.opportunityId, oppId));

      expect(rows).toHaveLength(0);
    });
  });

  describe('findOpportunityById / findOpportunitiesByTenant', () => {
    it('excludes soft-deleted opportunities', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput(),
      );
      await deleteOpportunity(oppId, tenant.id, admin.id);

      const found = await findOpportunityById(oppId, tenant.id);
      expect(found).toBeUndefined();

      const list = await findOpportunitiesByTenant(tenant.id);
      expect(list.find((o) => o.id === oppId)).toBeUndefined();
    });

    it('counts only non-deleted signups for an opportunity', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput(),
      );
      const volunteer = await createTestVolunteer(tenant.id);

      await db.insert(signUps).values([
        {
          tenantId: tenant.id,
          userId: volunteer.id,
          opportunityId: oppId,
          estimatedHours: 2,
          createdBy: volunteer.id,
        },
        {
          tenantId: tenant.id,
          userId: volunteer.id,
          opportunityId: oppId,
          estimatedHours: 2,
          createdBy: volunteer.id,
          deletedAt: new Date(),
          deletedBy: volunteer.id,
        },
      ]);

      const list = await findOpportunitiesByTenant(tenant.id);
      expect(list.find((o) => o.id === oppId)?.signupCount).toBe(1);
    });
  });

  describe('deleteOpportunity', () => {
    it('sets deletedAt and deletedBy instead of removing the row', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput(),
      );

      await deleteOpportunity(oppId, tenant.id, admin.id);

      const [row] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppId));

      expect(row.deletedAt).not.toBeNull();
      expect(row.deletedBy).toBe(admin.id);
    });
  });

  describe('togglePublish', () => {
    it('flips isPublished and records the acting user', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput(),
      );

      await togglePublish(oppId, tenant.id, admin.id);
      let [row] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppId));
      expect(row.isPublished).toBe(true);
      expect(row.updatedBy).toBe(admin.id);

      await togglePublish(oppId, tenant.id, admin.id);
      [row] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppId));
      expect(row.isPublished).toBe(false);
    });
  });

  describe('updateOpportunity', () => {
    it('updates basic fields', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput(),
      );

      const updatedId = await updateOpportunity(
        oppId,
        tenant.id,
        admin.id,
        baseOpportunityInput({ title: 'New Title' }),
      );

      expect(updatedId).toBe(oppId);

      const [row] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppId));
      expect(row.title).toBe('New Title');
      expect(row.updatedBy).toBe(admin.id);
    });

    it('returns null for an opportunity that does not exist', async () => {
      const result = await updateOpportunity(
        crypto.randomUUID(),
        tenant.id,
        admin.id,
        baseOpportunityInput(),
      );

      expect(result).toBeNull();
    });

    it('throws OpportunityConflictError when turning off mealProvided while a signup wants a meal', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput({
          mealProvided: true,
          mealOptions: [{ mealName: 'Vegetarian' }],
        }),
      );
      const volunteer = await createTestVolunteer(tenant.id);
      await db.insert(signUps).values({
        tenantId: tenant.id,
        userId: volunteer.id,
        opportunityId: oppId,
        estimatedHours: 2,
        wantsMeal: true,
        createdBy: volunteer.id,
      });

      await expect(
        updateOpportunity(
          oppId,
          tenant.id,
          admin.id,
          baseOpportunityInput({ mealProvided: false }),
        ),
      ).rejects.toThrow(OpportunityConflictError);
    });

    it('throws OpportunityConflictError when turning off tshirtProvided while a signup wants one', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput({ tshirtProvided: true }),
      );
      const volunteer = await createTestVolunteer(tenant.id);
      await db.insert(signUps).values({
        tenantId: tenant.id,
        userId: volunteer.id,
        opportunityId: oppId,
        estimatedHours: 2,
        wantsTShirt: true,
        tshirtSize: 'md',
        createdBy: volunteer.id,
      });

      await expect(
        updateOpportunity(
          oppId,
          tenant.id,
          admin.id,
          baseOpportunityInput({ tshirtProvided: false }),
        ),
      ).rejects.toThrow(OpportunityConflictError);
    });

    it('throws MealOptionInUseError when removing a meal option a signup selected', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput({
          mealProvided: true,
          mealOptions: [{ mealName: 'Vegetarian' }],
        }),
      );
      const [mealOption] = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.opportunityId, oppId));
      const volunteer = await createTestVolunteer(tenant.id);
      await db.insert(signUps).values({
        tenantId: tenant.id,
        userId: volunteer.id,
        opportunityId: oppId,
        estimatedHours: 2,
        wantsMeal: true,
        selectedMeal: mealOption.id,
        createdBy: volunteer.id,
      });

      await expect(
        updateOpportunity(
          oppId,
          tenant.id,
          admin.id,
          baseOpportunityInput({ mealProvided: true, mealOptions: [] }),
        ),
      ).rejects.toThrow(MealOptionInUseError);
    });

    it('syncs meal options: renames kept ones, adds new ones, removes unused ones', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput({
          mealProvided: true,
          mealOptions: [{ mealName: 'Vegetarian' }, { mealName: 'Beef' }],
        }),
      );
      const existing = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.opportunityId, oppId));
      const vegetarian = existing.find((m) => m.mealName === 'Vegetarian');
      if (!vegetarian) throw new Error('expected seeded meal option');

      await updateOpportunity(
        oppId,
        tenant.id,
        admin.id,
        baseOpportunityInput({
          mealProvided: true,
          mealOptions: [
            { mealOptionId: vegetarian.id, mealName: 'Vegan' },
            { mealName: 'Fish' },
          ],
        }),
      );

      const after = await db
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.opportunityId, oppId));
      expect(after.map((m) => m.mealName).sort()).toEqual(['Fish', 'Vegan']);
    });
  });

  describe('findPublishedOpportunities', () => {
    it('returns only published, non-deleted, upcoming opportunities', async () => {
      const visible = await createPublished(tenant.id, admin.id);

      await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput({
          startTime: daysFromNow(7),
          endTime: daysFromNow(7, 16),
        }),
      ); // draft

      await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(-7),
        endTime: daysFromNow(-7, 16),
      }); // past

      const deleted = await createPublished(tenant.id, admin.id);
      await deleteOpportunity(deleted, tenant.id, admin.id);

      const result = await findPublishedOpportunities(tenant.id, admin.id);

      expect(result.map((o) => o.id)).toEqual([visible]);
    });

    it('orders soonest first', async () => {
      const later = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(14),
        endTime: daysFromNow(14, 16),
      });

      const sooner = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(3),
        endTime: daysFromNow(3, 16),
      });

      const result = await findPublishedOpportunities(tenant.id, admin.id);

      expect(result.map((o) => o.id)).toEqual([sooner, later]);
    });

    it("flags isSignedUp only for the given user's active sign-up", async () => {
      const me = await createTestVolunteer(tenant.id);
      const other = await createTestVolunteer(tenant.id);
      const mine = await createPublished(tenant.id, admin.id);
      const theirs = await createPublished(tenant.id, admin.id);
      const cancelled = await createPublished(tenant.id, admin.id);

      await db.insert(signUps).values([
        {
          tenantId: tenant.id,
          userId: me.id,
          opportunityId: mine,
          estimatedHours: 2,
          createdBy: me.id,
        },
        {
          tenantId: tenant.id,
          userId: other.id,
          opportunityId: mine,
          estimatedHours: 2,
          createdBy: other.id,
        },
        {
          tenantId: tenant.id,
          userId: other.id,
          opportunityId: theirs,
          estimatedHours: 2,
          createdBy: other.id,
        },
        {
          tenantId: tenant.id,
          userId: me.id,
          opportunityId: cancelled,
          estimatedHours: 2,
          createdBy: me.id,
          deletedAt: new Date(),
          deletedBy: me.id,
        },
      ]);

      const result = await findPublishedOpportunities(tenant.id, me.id);
      const byId = Object.fromEntries(result.map((o) => [o.id, o]));

      expect(byId[mine]).toMatchObject({ isSignedUp: true, signupCount: 2 });
      expect(byId[theirs]).toMatchObject({ isSignedUp: false, signupCount: 1 });
      expect(byId[cancelled]).toMatchObject({
        isSignedUp: false,
        signupCount: 0,
      });
    });
  });

  describe('findPublishedOpportunityById', () => {
    it('returns details with meal options, organizer, and sign-up flags', async () => {
      const me = await createTestVolunteer(tenant.id);
      const other = await createTestVolunteer(tenant.id);
      const oppId = await createPublished(tenant.id, admin.id, {
        mealProvided: true,
        mealOptions: [{ mealName: 'Vegetarian' }],
      });

      await db.insert(signUps).values([
        {
          tenantId: tenant.id,
          userId: me.id,
          opportunityId: oppId,
          estimatedHours: 2,
          createdBy: me.id,
        },
        {
          tenantId: tenant.id,
          userId: other.id,
          opportunityId: oppId,
          estimatedHours: 2,
          createdBy: other.id,
        },
      ]);

      const result = await findPublishedOpportunityById(
        oppId,
        tenant.id,
        me.id,
      );

      expect(result).toMatchObject({
        id: oppId,
        signupCount: 2,
        isSignedUp: true,
        creator: { firstName: admin.firstName, email: admin.email },
      });
      expect(result?.mealOptions.map((m) => m.mealName)).toEqual([
        'Vegetarian',
      ]);
      expect(result).not.toHaveProperty('signUps');
    });

    it('ignores cancelled sign-ups', async () => {
      const me = await createTestVolunteer(tenant.id);
      const oppId = await createPublished(tenant.id, admin.id);

      await db.insert(signUps).values({
        tenantId: tenant.id,
        userId: me.id,
        opportunityId: oppId,
        estimatedHours: 2,
        createdBy: me.id,
        deletedAt: new Date(),
        deletedBy: me.id,
      });

      const result = await findPublishedOpportunityById(
        oppId,
        tenant.id,
        me.id,
      );

      expect(result).toMatchObject({ signupCount: 0, isSignedUp: false });
    });

    it('returns null for an unpublished opportunity', async () => {
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityInput(),
      );

      expect(
        await findPublishedOpportunityById(oppId, tenant.id, admin.id),
      ).toBeNull();
    });

    it('returns null for a soft-deleted opportunity', async () => {
      const oppId = await createPublished(tenant.id, admin.id);
      await deleteOpportunity(oppId, tenant.id, admin.id);

      expect(
        await findPublishedOpportunityById(oppId, tenant.id, admin.id),
      ).toBeNull();
    });

    it('still returns a published opportunity that has already happened', async () => {
      const oppId = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(-7),
        endTime: daysFromNow(-7, 16),
      });

      expect(
        await findPublishedOpportunityById(oppId, tenant.id, admin.id),
      ).not.toBeNull();
    });
  });
});
