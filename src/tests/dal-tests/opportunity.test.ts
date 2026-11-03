import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { mealOptions, opportunities, signUps } from '@/db/schema';
import {
  createOpportunity,
  deleteOpportunity,
  findOpportunitiesByTenant,
  findOpportunityById,
  MealOptionInUseError,
  OpportunityConflictError,
  togglePublish,
  updateOpportunity,
} from '@/lib/dal/opportunity';
import {
  cleanupTestTenant,
  createTestTenantAndAdmin,
  createTestVolunteer,
} from './dal-test-utils';

function baseOpportunityInput(
  overrides: Partial<Parameters<typeof createOpportunity>[2]> = {},
) {
  return {
    title: 'Park Cleanup',
    description: 'Bring gloves',
    opportunityType: 'virtual' as const,
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
    ...overrides,
  };
}

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
});
