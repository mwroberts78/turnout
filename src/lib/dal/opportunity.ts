import {
  and,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNull,
  sql,
} from 'drizzle-orm';
import type { z } from 'zod';
import {
  mealOptions,
  type Opportunity,
  opportunities,
  signUps,
} from '@/db/schema';
import {
  needsTimeZone,
  type OpportunityFormSchema,
} from '../schemas/opportunity-form';
import { mockDelay } from '../utils/mockDelay';
import { type Tx, withTenantContext } from './withTenantContext';

export type OpportunityWithDetails = NonNullable<
  Awaited<ReturnType<typeof findOpportunityById>>
>;

type OpportunityFormData = z.output<OpportunityFormSchema>;

function toOpportunityValues(data: OpportunityFormData) {
  return {
    title: data.title.trim(),
    description: data.description?.trim() || null,
    opportunityType: data.opportunityType,
    location:
      data.opportunityType === 'virtual' ? null : data.location?.trim() || null,
    imageUrl: data.imageUrl,
    startTime: data.startTime,
    endTime: data.endTime,
    timeZone: needsTimeZone(data) ? data.timeZone : null,
    mealProvided: data.mealProvided,
    tshirtProvided: data.tshirtProvided,
    maxSignupsAllowed: data.maxSignupsAllowed,
  };
}

export async function findOpportunitiesByTenant(
  tenantId: string,
): Promise<(Opportunity & { signupCount: number })[]> {
  await mockDelay();

  return withTenantContext(tenantId, (tx) =>
    tx
      .select({
        ...getTableColumns(opportunities),
        signupCount: sql<number>`count(${signUps.id})`.mapWith(Number),
      })
      .from(opportunities)
      .leftJoin(
        signUps,
        and(
          eq(signUps.opportunityId, opportunities.id),
          isNull(signUps.deletedAt),
        ),
      )
      .where(
        and(
          eq(opportunities.tenantId, tenantId),
          isNull(opportunities.deletedAt),
        ),
      )
      .groupBy(opportunities.id)
      .orderBy(desc(opportunities.startTime)),
  );
}

export async function findOpportunityById(oppId: string, tenantId: string) {
  await mockDelay();

  return withTenantContext(tenantId, (tx) =>
    tx.query.opportunities.findFirst({
      where: and(eq(opportunities.id, oppId), isNull(opportunities.deletedAt)),
      with: {
        mealOptions: true,
        creator: {
          columns: { firstName: true, lastName: true, email: true },
        },
        updater: {
          columns: { firstName: true, lastName: true, email: true },
        },
        signUps: {
          where: isNull(signUps.deletedAt),
          columns: {
            id: true,
            wantsMeal: true,
            selectedMeal: true,
            wantsTShirt: true,
          },
        },
      },
    }),
  );
}

export async function findSignupsForOpportunity(
  oppId: string,
  tenantId: string,
) {
  await mockDelay();

  return withTenantContext(tenantId, (tx) =>
    tx.query.signUps.findMany({
      where: and(eq(signUps.opportunityId, oppId), isNull(signUps.deletedAt)),
      with: {
        user: {
          columns: { firstName: true, lastName: true, email: true },
        },
        selectedMealOption: { columns: { mealName: true } },
      },
    }),
  );
}

export async function deleteOpportunity(
  oppId: string,
  tenantId: string,
  userId: string,
) {
  await mockDelay();

  await withTenantContext(tenantId, (tx) =>
    tx
      .update(opportunities)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(eq(opportunities.id, oppId)),
  );
}

export async function togglePublish(
  oppId: string,
  tenantId: string,
  userId: string,
) {
  await mockDelay();

  await withTenantContext(tenantId, (tx) =>
    tx
      .update(opportunities)
      .set({
        isPublished: sql`NOT ${opportunities.isPublished}`,
        updatedBy: userId,
      })
      .where(eq(opportunities.id, oppId)),
  );
}

export async function createOpportunity(
  tenantId: string,
  userId: string,
  data: OpportunityFormData,
) {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    const [created] = await tx
      .insert(opportunities)
      .values({ ...toOpportunityValues(data), tenantId, createdBy: userId })
      .returning({ id: opportunities.id });

    if (data.mealProvided && data.mealOptions.length > 0) {
      await tx.insert(mealOptions).values(
        data.mealOptions.map((m) => ({
          tenantId,
          opportunityId: created.id,
          mealName: m.mealName.trim(),
          createdBy: userId,
        })),
      );
    }

    return created.id;
  });
}

export async function updateOpportunity(
  oppId: string,
  tenantId: string,
  userId: string,
  data: OpportunityFormData,
) {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    const [current] = await tx
      .select({
        mealProvided: opportunities.mealProvided,
        tshirtProvided: opportunities.tshirtProvided,
      })
      .from(opportunities)
      .where(and(eq(opportunities.id, oppId), isNull(opportunities.deletedAt)));

    if (!current) return null;

    if (current.mealProvided && !data.mealProvided) {
      await assertNoSignupsWant(tx, oppId, signUps.wantsMeal, 'a meal');
    }

    if (current.tshirtProvided && !data.tshirtProvided) {
      await assertNoSignupsWant(tx, oppId, signUps.wantsTShirt, 'a t-shirt');
    }

    const [updated] = await tx
      .update(opportunities)
      .set({ ...toOpportunityValues(data), updatedBy: userId })
      .where(and(eq(opportunities.id, oppId), isNull(opportunities.deletedAt)))
      .returning({ id: opportunities.id });

    if (!updated) return null;

    if (data.mealProvided) {
      await syncMealOptions(tx, oppId, tenantId, userId, data.mealOptions);
    }

    return updated.id;
  });
}

export class OpportunityConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpportunityConflictError';
  }
}

export class MealOptionInUseError extends Error {
  constructor(mealName: string, signupCount: number) {
    super(
      `${signupCount} signup${signupCount === 1 ? '' : 's'} selected "${mealName}", so it can't be removed`,
    );
    this.name = 'MealOptionInUseError';
  }
}

async function syncMealOptions(
  tx: Tx,
  oppId: string,
  tenantId: string,
  userId: string,
  submitted: OpportunityFormData['mealOptions'],
) {
  const existing = await tx
    .select({ id: mealOptions.id, mealName: mealOptions.mealName })
    .from(mealOptions)
    .where(eq(mealOptions.opportunityId, oppId));

  const existingIds = new Set(existing.map((m) => m.id));
  const keptIds = new Set(
    submitted.flatMap((m) => (m.mealOptionId ? [m.mealOptionId] : [])),
  );

  if ([...keptIds].some((id) => !existingIds.has(id))) {
    throw new Error('Unknown meal option');
  }

  const removed = existing.filter((m) => !keptIds.has(m.id));

  if (removed.length > 0) {
    const removedIds = removed.map((m) => m.id);

    const inUse = await tx
      .select({
        mealId: signUps.selectedMeal,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(signUps)
      .where(
        and(
          inArray(signUps.selectedMeal, removedIds),
          isNull(signUps.deletedAt),
        ),
      )
      .groupBy(signUps.selectedMeal);

    if (inUse.length > 0) {
      const name =
        removed.find((m) => m.id === inUse[0].mealId)?.mealName ?? 'this meal';
      throw new MealOptionInUseError(name, inUse[0].count);
    }

    await tx
      .update(signUps)
      .set({ selectedMeal: null })
      .where(inArray(signUps.selectedMeal, removedIds));

    await tx.delete(mealOptions).where(inArray(mealOptions.id, removedIds));
  }

  for (const m of submitted) {
    if (m.mealOptionId) {
      await tx
        .update(mealOptions)
        .set({ mealName: m.mealName.trim(), updatedBy: userId })
        .where(
          and(
            eq(mealOptions.id, m.mealOptionId),
            eq(mealOptions.opportunityId, oppId),
          ),
        );
    } else {
      await tx.insert(mealOptions).values({
        tenantId,
        opportunityId: oppId,
        mealName: m.mealName.trim(),
        createdBy: userId,
      });
    }
  }
}

async function assertNoSignupsWant(
  tx: Tx,
  oppId: string,
  column: typeof signUps.wantsMeal | typeof signUps.wantsTShirt,
  label: string,
) {
  const [{ count }] = await tx
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(signUps)
    .where(
      and(
        eq(signUps.opportunityId, oppId),
        eq(column, true),
        isNull(signUps.deletedAt),
      ),
    );

  if (count > 0) {
    throw new OpportunityConflictError(
      `${count} signup${count === 1 ? '' : 's'} chose ${label}, so it can't be turned off`,
    );
  }
}
