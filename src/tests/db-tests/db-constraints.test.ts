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

describe('tenants constraints', () => {
  it('requires name', async () => {
    await withRollback(async (tx) => {
      await expect(
        tx
          .insert(tenants)
          // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          .values({ clerkOrgId: 'org_x' } as any),
      ).rejects.toMatchObject({
        cause: { code: '23502' },
      });
    });
  });

  it('requires a clerkOrgId', async () => {
    await withRollback(async (tx) => {
      await expect(
        tx
          .insert(tenants)
          // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          .values({ name: 'Tenant A' } as any),
      ).rejects.toMatchObject({
        cause: { code: '23502' },
      });
    });
  });

  it('requires a unique clerkOrgId', async () => {
    await withRollback(async (tx) => {
      await tx.insert(tenants).values({ name: 'A', clerkOrgId: 'dup' });
      await expect(
        tx.insert(tenants).values({ name: 'B', clerkOrgId: 'dup' }),
      ).rejects.toMatchObject({ cause: { code: '23505' } });
    });
  });

  it('defaults tier to "free"', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'A', clerkOrgId: 'A' })
        .returning();

      expect(tenant.tier).toEqual('free');
    });
  });

  it('rejects a tier value outside the enum', async () => {
    await withRollback(async (tx) => {
      await expect(
        tx
          .insert(tenants)
          // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          .values({ name: 'A', clerkOrgId: 'A', tier: 'super' } as any),
      ).rejects.toMatchObject({
        cause: { code: '22P02' },
      });
    });
  });
});

describe('users constraints', () => {
  it('rejects a tenantId that does not reference an existing tenant', async () => {
    await withRollback(async (tx) => {
      await expect(
        tx.insert(users).values({
          tenantId: '00000000-0000-0000-0000-000000000000',
          clerkUserId: 'user_x',
          email: 'x@x.com',
          firstName: 'X',
          lastName: 'X',
        }),
      ).rejects.toMatchObject({ cause: { code: '23503' } });
    });
  });

  it('requires a unique clerkUserId', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: 'Tenant',
          clerkOrgId: 'org_a',
        })
        .returning();

      await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_x',
          email: 'x@x.com',
          firstName: 'X',
          lastName: 'X',
        })
        .returning();

      await expect(
        tx.insert(users).values({
          tenantId: tenant.id,
          clerkUserId: 'user_x',
          email: 'x@x.com',
          firstName: 'X',
          lastName: 'X',
        }),
      ).rejects.toMatchObject({
        cause: { code: '23505' },
      });
    });
  });

  it('requires email, firstName, lastName', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(users).values({
            tenantId: tenant.id,
            clerkUserId: 'user_1',
            firstName: 'A',
            lastName: 'A',
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(users).values({
            tenantId: tenant.id,
            clerkUserId: 'user_1',
            email: 'x@x.com',
            lastName: 'A',
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(users).values({
            tenantId: tenant.id,
            clerkUserId: 'user_1',
            email: 'x@x.com',
            firstName: 'A',
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });
    });
  });

  it('defaults role to "employee"', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_x',
          email: 'x@x.com',
          firstName: 'X',
          lastName: 'X',
        })
        .returning();

      expect(user.role).toEqual('employee');
    });
  });

  it('rejects a role value outside the enum', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      await expect(
        tx.insert(users).values({
          tenantId: tenant.id,
          clerkUserId: 'user_x',
          email: 'x@x.com',
          firstName: 'X',
          lastName: 'X',
          role: 'super',
          // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
        } as any),
      ).rejects.toMatchObject({
        cause: { code: '22P02' },
      });
    });
  });

  it('allows updatedBy to reference an existing user', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [userA] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_a',
          email: 'x@x.com',
          firstName: 'User A',
          lastName: 'User A',
        })
        .returning();

      const [userB] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_b',
          email: 'x@x.com',
          firstName: 'User B',
          lastName: 'User B',
        })
        .returning();

      const [userBUpdated] = await tx
        .update(users)
        .set({
          ...userB,
          firstName: 'User B updated by User',
          updatedBy: userA.id,
        })
        .where(eq(users.id, userB.id))
        .returning();

      expect(userBUpdated.updatedBy).toEqual(userA.id);
    });
  });
});

describe('opportunities constraints', () => {
  it('requires description, startTime, endTime, createdBy', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(opportunities).values({
            tenantId: tenant.id,
            startTime: new Date('2026-09-01T09:00:00-04:00'),
            endTime: new Date('2026-09-01T13:00:00-04:00'),
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(opportunities).values({
            tenantId: tenant.id,
            description: 'Description',
            endTime: new Date('2026-09-01T13:00:00-04:00'),
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(opportunities).values({
            tenantId: tenant.id,
            description: 'Description',
            startTime: new Date('2026-09-01T09:00:00-04:00'),
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(opportunities).values({
            tenantId: tenant.id,
            description: 'Description',
            startTime: new Date('2026-09-01T09:00:00-04:00'),
            endTime: new Date('2026-09-01T13:00:00-04:00'),
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });
    });
  });

  it('defaults opportunityType to "in-person"', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      expect(opportunity.opportunityType).toEqual('in-person');
    });
  });

  it('defaults mealProvided and tshirtProvided to false', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      expect(opportunity.mealProvided).toEqual(false);
      expect(opportunity.tshirtProvided).toEqual(false);
    });
  });

  it('rejects an opportunityType value outside the enum', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      await expect(
        tx.insert(opportunities).values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
          opportunityType: 'super',
          // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
        } as any),
      ).rejects.toMatchObject({
        cause: { code: '22P02' },
      });
    });
  });

  it('allows updatedBy to be null', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      const [updatedOpportunity] = await tx
        .update(opportunities)
        .set({
          description: 'Updated Description',
        })
        .where(eq(opportunities.id, opportunity.id))
        .returning();

      expect(updatedOpportunity.updatedBy).toBeNull();
    });
  });
});

describe('meal_options constraints', () => {
  it('requires tenantId, opportunityId, mealName, createdBy', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(mealOptions).values({
            opportunityId: opportunity.id,
            mealName: 'Meal Name',
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(mealOptions).values({
            tenantId: tenant.id,
            mealName: 'Meal Name',
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(mealOptions).values({
            tenantId: tenant.id,
            opportunityId: opportunity.id,
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(mealOptions).values({
            tenantId: tenant.id,
            opportunityId: opportunity.id,
            mealName: 'Meal Name',
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });
    });
  });

  it('rejects an opportunityId that does not reference an existing opportunity', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      await expect(
        tx.insert(mealOptions).values({
          tenantId: tenant.id,
          opportunityId: '00000000-0000-0000-0000-000000000000',
          mealName: 'Meal Name',
          createdBy: user.id,
        }),
      ).rejects.toMatchObject({ cause: { code: '23503' } });
    });
  });
});

describe('sign_ups constraints', () => {
  it('requires tenantId, userId, opportunityId, estimatedHours, createdBy', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(signUps).values({
            opportunityId: opportunity.id,
            userId: user.id,
            estimatedHours: 4,
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(signUps).values({
            tenantId: tenant.id,
            userId: user.id,
            estimatedHours: 4,
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(signUps).values({
            tenantId: tenant.id,
            opportunityId: opportunity.id,
            estimatedHours: 4,
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(signUps).values({
            tenantId: tenant.id,
            opportunityId: opportunity.id,
            userId: user.id,
            createdBy: user.id,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });

      await expect(
        tx.transaction(async (savepoint) => {
          await savepoint.insert(signUps).values({
            tenantId: tenant.id,
            opportunityId: opportunity.id,
            userId: user.id,
            estimatedHours: 4,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
          } as any);
        }),
      ).rejects.toMatchObject({ cause: { code: '23502' } });
    });
  });

  it('defaults workCompleted, wantsMeal, wantsTShirt to false', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      const [signUp] = await tx
        .insert(signUps)
        .values({
          tenantId: tenant.id,
          opportunityId: opportunity.id,
          userId: user.id,
          estimatedHours: 4,
          createdBy: user.id,
        })
        .returning();

      expect(signUp.workCompleted).toEqual(false);
      expect(signUp.wantsTShirt).toEqual(false);
      expect(signUp.wantsMeal).toEqual(false);
    });
  });

  it('allows selectedMeal and tshirtSize to be null', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      const [signUp] = await tx
        .insert(signUps)
        .values({
          tenantId: tenant.id,
          opportunityId: opportunity.id,
          userId: user.id,
          estimatedHours: 4,
          createdBy: user.id,
          selectedMeal: null,
          tshirtSize: null,
        })
        .returning();

      expect(signUp.selectedMeal).toBeNull();
      expect(signUp.tshirtSize).toBeNull();
    });
  });

  it('rejects a tshirtSize value outside the enum', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      await expect(
        tx.insert(signUps).values({
          tenantId: tenant.id,
          opportunityId: opportunity.id,
          userId: user.id,
          estimatedHours: 4,
          createdBy: user.id,
          tshirtSize: 'super-size',
          // biome-ignore lint/suspicious/noExplicitAny: intentionally bypassing the notNull type check to verify the DB rejects it too
        } as any),
      ).rejects.toMatchObject({
        cause: { code: '22P02' },
      });
    });
  });

  it('rejects a selectedMeal that does not reference an existing meal option', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      await expect(
        tx.insert(signUps).values({
          tenantId: tenant.id,
          opportunityId: opportunity.id,
          selectedMeal: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
          estimatedHours: 4,
          createdBy: user.id,
        }),
      ).rejects.toMatchObject({ cause: { code: '23503' } });
    });
  });
});

describe('referential integrity on delete', () => {
  it('deleting a tenant with existing users fails (no cascade defined)', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      await expect(
        tx.delete(tenants).where(eq(tenants.id, tenant.id)),
      ).rejects.toMatchObject({
        cause: { code: '23503' },
      });
    });
  });

  it('deleting an opportunity with existing sign-ups fails (no cascade defined)', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: 'Tenant', clerkOrgId: 'org_a' })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: 'user_1',
          firstName: 'A',
          lastName: 'A',
          email: 'x@x.com',
        })
        .returning();

      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          tenantId: tenant.id,
          description: 'Description',
          startTime: new Date('2026-09-01T09:00:00-04:00'),
          endTime: new Date('2026-09-01T13:00:00-04:00'),
          createdBy: user.id,
        })
        .returning();

      await tx
        .insert(signUps)
        .values({
          tenantId: tenant.id,
          opportunityId: opportunity.id,
          userId: user.id,
          estimatedHours: 4,
          createdBy: user.id,
        })
        .returning();

      await expect(
        tx.delete(opportunities).where(eq(opportunities.id, opportunity.id)),
      ).rejects.toMatchObject({
        cause: { code: '23503' },
      });
    });
  });
});

describe('timestamps', () => {
  it('sets createdAt automatically on insert', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: 'Tenant',
          clerkOrgId: 'org_a',
        })
        .returning();

      expect(tenant.createdAt).toBeInstanceOf(Date);
    });
  });

  it('updates updatedAt automatically on update via $onUpdate', async () => {
    await withRollback(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: 'Tenant',
          clerkOrgId: 'org_a',
        })
        .returning();

      const [updated] = await tx
        .update(tenants)
        .set({
          name: 'Tenant Updated',
        })
        .where(eq(tenants.id, tenant.id))
        .returning();

      expect(updated.updatedAt).toBeInstanceOf(Date);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        tenant.updatedAt.getTime(),
      );
    });
  });
});
