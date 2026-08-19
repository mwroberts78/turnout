import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  mealOptions,
  opportunities,
  signUps,
  tenants,
  users,
} from '../../db/schema';
import { withRollback } from '../test-utils';

describe('tenants RLS', () => {
  it('a tenant can read its own row', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();

      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx.select().from(tenants);
      expect(asA).toHaveLength(1);
      expect(asA[0].id).toEqual(tenantA.id);

      await actAs(tenantB.id);
      const asB = await tx.select().from(tenants);
      expect(asB).toHaveLength(1);
      expect(asB[0].id).toEqual(tenantB.id);
    });
  });

  it("a tenant cannot read another tenant's row", async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();

      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantB.id));
      expect(asA).toHaveLength(0);

      await actAs(tenantB.id);
      const asB = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantA.id));
      expect(asB).toHaveLength(0);
    });
  });

  it("a tenant cannot update another tenant's row", async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();

      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantB.id);
      const updated = await tx
        .update(tenants)
        .set({ ...tenantA, name: 'Changed by Tenant B' })
        .where(eq(tenants.id, tenantA.id))
        .returning();

      expect(updated).toHaveLength(0);

      await actAs(tenantA.id);
      const result = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantA.id));

      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('A');
    });
  });
});

describe('users RLS', () => {
  it('can read users within own tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();

      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      const [userA1] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a1',
          email: 'a1@x.com',
          firstName: 'A1',
          lastName: 'A1',
        })
        .returning();

      const [userA2] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a2',
          email: 'a2@x.com',
          firstName: 'A2',
          lastName: 'A2',
        })
        .returning();

      const [userB1] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b1',
          email: 'b1@x.com',
          firstName: 'B1',
          lastName: 'B1',
        })
        .returning();

      const [userB2] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b2',
          email: 'b2@x.com',
          firstName: 'B2',
          lastName: 'B2',
        })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx.select().from(users);
      expect(asA.map((u) => u.id).sort()).toEqual(
        [userA1.id, userA2.id].sort(),
      );

      await actAs(tenantB.id);
      const asB = await tx.select().from(users);
      expect(asB.map((u) => u.id).sort()).toEqual(
        [userB1.id, userB2.id].sort(),
      );
    });
  });

  it('a user cannot see users from another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx.select().from(users);
      expect(asA.map((u) => u.id)).toEqual([userA.id]);

      await actAs(tenantB.id);
      const asB = await tx.select().from(users);
      expect(asB.map((u) => u.id)).toEqual([userB.id]);
    });
  });

  it('cannot insert a user scoped to another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(users).values({
            tenantId: tenantB.id,
            clerkUserId: 'user_x',
            email: 'x@x.com',
            firstName: 'X',
            lastName: 'X',
          });
        }),
      ).rejects.toMatchObject({
        cause: { message: expect.stringMatching(/row-level security/i) },
      });

      const result = await tx.select().from(users);
      expect(result).toHaveLength(0);
    });
  });

  it('cannot update a user belonging to another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      await actAs(tenantB.id);
      const updated = await tx
        .update(users)
        .set({ ...userA, firstName: 'Changed by Tenant B' })
        .where(eq(users.id, userA.id))
        .returning();

      expect(updated).toHaveLength(0);

      await actAs(tenantA.id);
      const result = await tx
        .select()
        .from(users)
        .where(eq(users.id, userA.id));

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toEqual('A');
    });
  });
});

describe('opportunities RLS', () => {
  it('can read opportunities within own tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      await actAs(tenantB.id);
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      await actAs(tenantA.id);
      const [oppA1] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      const [oppA2] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 2',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      await actAs(tenantB.id);
      const [oppB1] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantB.id,
          description: 'Tenant B - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      const [oppB2] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantB.id,
          description: 'Tenant B- Test Opportunity 2',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx.select().from(opportunities);
      expect(asA).toHaveLength(2);
      expect(asA.map((o) => o.id).sort()).toEqual([oppA1.id, oppA2.id].sort());

      await actAs(tenantB.id);
      const asB = await tx.select().from(opportunities);
      expect(asB).toHaveLength(2);
      expect(asB.map((o) => o.id).sort()).toEqual([oppB1.id, oppB2.id].sort());
    });
  });

  it('cannot read opportunities from another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      await actAs(tenantB.id);
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      await actAs(tenantA.id);
      const [oppA1] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      await actAs(tenantB.id);
      const [oppB1] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantB.id,
          description: 'Tenant B - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppB1.id));
      expect(asA).toHaveLength(0);

      await actAs(tenantB.id);
      const asB = await tx
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppA1.id));
      expect(asB).toHaveLength(0);
    });
  });

  it('cannot insert an opportunity scoped to another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      await actAs(tenantB.id);
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      await actAs(tenantA.id);
      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(opportunities).values({
            tenantId: tenantB.id,
            description: 'Inserting into Tenant B as Tenant A',
            opportunityType: 'in-person',
            location: 'Location',
            startTime: new Date('2026-09-01T09:00:00-04:00'),
            endTime: new Date('2026-09-01T13:00:00-04:00'),
            mealProvided: false,
            tshirtProvided: false,

            createdBy: userA.id,
            updatedBy: userA.id,
          });
        }),
      ).rejects.toMatchObject({
        cause: { message: expect.stringMatching(/row-level security/i) },
      });

      const resultA = await tx.select().from(opportunities);
      expect(resultA).toHaveLength(0);

      await actAs(tenantB.id);
      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(opportunities).values({
            tenantId: tenantA.id,
            description: 'Inserting into Tenant A as Tenant B',
            opportunityType: 'in-person',
            location: 'Location',
            startTime: new Date('2026-09-01T09:00:00-04:00'),
            endTime: new Date('2026-09-01T13:00:00-04:00'),
            mealProvided: false,
            tshirtProvided: false,

            createdBy: userB.id,
            updatedBy: userB.id,
          });
        }),
      ).rejects.toMatchObject({
        cause: { message: expect.stringMatching(/row-level security/i) },
      });

      const resultB = await tx.select().from(opportunities);
      expect(resultB).toHaveLength(0);
    });
  });
});

describe('meal_options RLS', () => {
  it('can read meal options within own tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      const [oppA] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      const [mealOptionA1] = await tx
        .insert(mealOptions)
        .values({
          tenantId: userA.tenantId,
          opportunityId: oppA.id,
          mealName: 'Meat',

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      const [mealOptionA2] = await tx
        .insert(mealOptions)
        .values({
          tenantId: userA.tenantId,
          opportunityId: oppA.id,
          mealName: 'Vegetarian',

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      const [mealOptionA3] = await tx
        .insert(mealOptions)
        .values({
          tenantId: userA.tenantId,
          opportunityId: oppA.id,
          mealName: 'Vegan',

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      await actAs(tenantB.id);
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      const [oppB] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantB.id,
          description: 'Tenant B - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      const [mealOptionB1] = await tx
        .insert(mealOptions)
        .values({
          tenantId: userB.tenantId,
          opportunityId: oppB.id,
          mealName: 'Meat',

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      const [mealOptionB2] = await tx
        .insert(mealOptions)
        .values({
          tenantId: userB.tenantId,
          opportunityId: oppB.id,
          mealName: 'Vegetarian',

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      const [mealOptionB3] = await tx
        .insert(mealOptions)
        .values({
          tenantId: userB.tenantId,
          opportunityId: oppB.id,
          mealName: 'Vegan',

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx.select().from(mealOptions);
      expect(asA).toHaveLength(3);
      expect(asA.map((mo) => mo.id).sort()).toEqual(
        [mealOptionA1.id, mealOptionA2.id, mealOptionA3.id].sort(),
      );

      await actAs(tenantB.id);
      const asB = await tx.select().from(mealOptions);
      expect(asB).toHaveLength(3);
      expect(asB.map((mo) => mo.id).sort()).toEqual(
        [mealOptionB1.id, mealOptionB2.id, mealOptionB3.id].sort(),
      );
    });
  });

  it('cannot read meal options from another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      const [oppA] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      const [mealOptionA1] = await tx
        .insert(mealOptions)
        .values({
          tenantId: userA.tenantId,
          opportunityId: oppA.id,
          mealName: 'Meat',

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      await actAs(tenantB.id);
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      const [oppB] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantB.id,
          description: 'Tenant B - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      const [mealOptionB1] = await tx
        .insert(mealOptions)
        .values({
          tenantId: userB.tenantId,
          opportunityId: oppB.id,
          mealName: 'Meat',

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.id, mealOptionB1.id));
      expect(asA).toHaveLength(0);

      await actAs(tenantB.id);
      const asB = await tx
        .select()
        .from(mealOptions)
        .where(eq(mealOptions.id, mealOptionA1.id));
      expect(asB).toHaveLength(0);
    });
  });

  it('cannot insert a meal option scoped to another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      const [oppA] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,
          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(mealOptions).values({
            tenantId: tenantB.id,
            opportunityId: oppA.id,
            mealName: 'Meat',
            createdBy: userA.id,
            updatedBy: userA.id,
          });
        }),
      ).rejects.toMatchObject({
        cause: { message: expect.stringMatching(/row-level security/i) },
      });

      const result = await tx.select().from(mealOptions);
      expect(result).toHaveLength(0);
    });
  });
});

describe('sign_ups RLS', () => {
  it('can read sign-ups within own tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      const [oppA] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      const [signupA1] = await tx
        .insert(signUps)
        .values({
          tenantId: userA.tenantId,
          userId: userA.id,
          opportunityId: oppA.id,
          comments: 'Signup A1',
          estimatedHours: 4,
          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      const [signupA2] = await tx
        .insert(signUps)
        .values({
          tenantId: userA.tenantId,
          userId: userA.id,
          opportunityId: oppA.id,
          comments: 'Signup A2',
          estimatedHours: 4,
          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      await actAs(tenantB.id);
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      const [oppB] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantB.id,
          description: 'Tenant B - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      const [signupB1] = await tx
        .insert(signUps)
        .values({
          tenantId: userB.tenantId,
          userId: userB.id,
          opportunityId: oppB.id,
          comments: 'Signup B1',
          estimatedHours: 4,
          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      const [signupB2] = await tx
        .insert(signUps)
        .values({
          tenantId: userB.tenantId,
          userId: userB.id,
          opportunityId: oppB.id,
          comments: 'Signup B2',
          estimatedHours: 4,
          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx.select().from(signUps);
      expect(asA).toHaveLength(2);
      expect(asA.map((s) => s.id).sort()).toEqual(
        [signupA1.id, signupA2.id].sort(),
      );

      await actAs(tenantB.id);
      const asB = await tx.select().from(signUps);
      expect(asB).toHaveLength(2);
      expect(asB.map((s) => s.id).sort()).toEqual(
        [signupB1.id, signupB2.id].sort(),
      );
    });
  });

  it('cannot read sign-ups from another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      const [oppA] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      const [signupA1] = await tx
        .insert(signUps)
        .values({
          tenantId: userA.tenantId,
          userId: userA.id,
          opportunityId: oppA.id,
          comments: 'Signup A1',
          estimatedHours: 4,
          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      await actAs(tenantB.id);
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      const [oppB] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantB.id,
          description: 'Tenant B - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      const [signupB1] = await tx
        .insert(signUps)
        .values({
          tenantId: userB.tenantId,
          userId: userB.id,
          opportunityId: oppB.id,
          comments: 'Signup B1',
          estimatedHours: 4,
          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      await actAs(tenantA.id);
      const asA = await tx
        .select()
        .from(signUps)
        .where(eq(signUps.id, signupB1.id));
      expect(asA).toHaveLength(0);

      await actAs(tenantB.id);
      const asB = await tx
        .select()
        .from(signUps)
        .where(eq(signUps.id, signupA1.id));
      expect(asB).toHaveLength(0);
    });
  });

  it('cannot insert a sign-up scoped to another tenant', async () => {
    await withRollback(async (tx, actAs) => {
      const [tenantA] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'org_a' })
        .returning();
      const [tenantB] = await tx
        .insert(tenants)
        .values({ name: 'B', clerkOrgId: 'org_b' })
        .returning();

      await actAs(tenantA.id);
      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenantA.id,
          clerkUserId: 'user_a',
          email: 'a@x.com',
          firstName: 'A',
          lastName: 'A',
        })
        .returning();

      const [oppA] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantA.id,
          description: 'Tenant A - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userA.id,
          updatedBy: userA.id,
        })
        .returning();

      await actAs(tenantB.id);
      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenantB.id,
          clerkUserId: 'user_b',
          email: 'b@x.com',
          firstName: 'B',
          lastName: 'B',
        })
        .returning();

      const [oppB] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenantB.id,
          description: 'Tenant B - Test Opportunity 1',
          opportunityType: 'in-person',
          location: 'Location',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          mealProvided: false,
          tshirtProvided: false,

          createdBy: userB.id,
          updatedBy: userB.id,
        })
        .returning();

      await actAs(tenantA.id);
      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(signUps).values({
            tenantId: userB.tenantId,
            userId: userA.id,
            opportunityId: oppA.id,
            comments: 'Signup B as A',
            estimatedHours: 4,
            createdBy: userA.id,
            updatedBy: userA.id,
          });
        }),
      ).rejects.toMatchObject({
        cause: { message: expect.stringMatching(/row-level security/i) },
      });

      const resultA = await tx.select().from(signUps);
      expect(resultA).toHaveLength(0);

      await actAs(tenantB.id);
      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(signUps).values({
            tenantId: userA.tenantId,
            userId: userB.id,
            opportunityId: oppB.id,
            comments: 'Signup A as B',
            estimatedHours: 4,
            createdBy: userB.id,
            updatedBy: userB.id,
          });
        }),
      ).rejects.toMatchObject({
        cause: { message: expect.stringMatching(/row-level security/i) },
      });

      const resultB = await tx.select().from(signUps);
      expect(resultB).toHaveLength(0);
    });
  });
});
