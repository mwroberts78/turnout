import { and, count, eq, isNull } from 'drizzle-orm';
import { mealOptions, opportunities, signUps } from '@/db/schema';
import type { SignupFormOutput } from '../schemas/signup-form';
import { mockDelay } from '../utils/mockDelay';
import { type Tx, withTenantContext } from './withTenantContext';

export type OwnSignUp = Awaited<ReturnType<typeof findSignUpsForUser>>[number];

export type OwnSignUpChangeResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'started' | 'invalid-meal' };

export async function deleteSignUp(
  signUpId: string,
  tenantId: string,
  userId: string,
) {
  await mockDelay();

  await withTenantContext(tenantId, (tx) =>
    tx
      .update(signUps)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(eq(signUps.id, signUpId)),
  );
}

export async function updateSignUp(
  signUpId: string,
  tenantId: string,
  userId: string,
  data: { workCompleted: boolean; actualHours: number | null },
) {
  await mockDelay();

  await withTenantContext(tenantId, (tx) =>
    tx
      .update(signUps)
      .set({
        workCompleted: data.workCompleted,
        actualHours: data.actualHours,
        updatedBy: userId,
      })
      .where(eq(signUps.id, signUpId)),
  );
}

export type CreateSignUpResult =
  | { ok: true; signUpId: string }
  | {
      ok: false;
      reason:
        | 'not-found'
        | 'started'
        | 'already-signed-up'
        | 'full'
        | 'invalid-meal';
    };

export async function createSignUp(
  oppId: string,
  tenantId: string,
  userId: string,
  input: SignupFormOutput,
): Promise<CreateSignUpResult> {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    // Locks the opportunity row so concurrent signups wait their turn,
    // which keeps the capacity and duplicate checks below accurate.

    const [opportunity] = await tx
      .select()
      .from(opportunities)
      .where(
        and(
          eq(opportunities.id, oppId),
          eq(opportunities.tenantId, tenantId),
          eq(opportunities.isPublished, true),
          isNull(opportunities.deletedAt),
        ),
      )
      .for('update');

    if (!opportunity) return { ok: false, reason: 'not-found' };

    if (opportunity.startTime <= new Date()) {
      return { ok: false, reason: 'started' };
    }

    const [existing] = await tx
      .select({ id: signUps.id })
      .from(signUps)
      .where(
        and(
          eq(signUps.opportunityId, oppId),
          eq(signUps.userId, userId),
          isNull(signUps.deletedAt),
        ),
      );

    if (existing) return { ok: false, reason: 'already-signed-up' };

    if (opportunity.maxSignupsAllowed !== null) {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(signUps)
        .where(
          and(eq(signUps.opportunityId, oppId), isNull(signUps.deletedAt)),
        );

      if (total >= opportunity.maxSignupsAllowed) {
        return { ok: false, reason: 'full' };
      }
    }

    if (input.selectedMeal) {
      const [meal] = await tx
        .select({ id: mealOptions.id })
        .from(mealOptions)
        .where(
          and(
            eq(mealOptions.id, input.selectedMeal),
            eq(mealOptions.opportunityId, oppId),
          ),
        );

      if (!meal) return { ok: false, reason: 'invalid-meal' };
    }

    const [created] = await tx
      .insert(signUps)
      .values({
        ...input,
        tenantId: opportunity.tenantId,
        userId,
        opportunityId: oppId,
        createdBy: userId,
      })
      .returning({ id: signUps.id });

    return { ok: true, signUpId: created.id };
  });
}

const ownSignUpRelations = {
  selectedMealOption: { columns: { id: true, mealName: true } },
  opportunity: {
    columns: {
      id: true,
      title: true,
      opportunityType: true,
      location: true,
      imageUrl: true,
      startTime: true,
      endTime: true,
      timeZone: true,
      mealProvided: true,
      tshirtProvided: true,
      deletedAt: true,
    },
    with: { mealOptions: { columns: { id: true, mealName: true } } },
  },
} as const;

// Signups whose opportunity was deleted are hidden from the volunteer; the
// relational query API can't filter on a related table, so it happens here.
export async function findSignUpsForUser(tenantId: string, userId: string) {
  await mockDelay();

  const rows = await withTenantContext(tenantId, (tx) =>
    tx.query.signUps.findMany({
      where: and(
        eq(signUps.tenantId, tenantId),
        eq(signUps.userId, userId),
        isNull(signUps.deletedAt),
      ),
      with: ownSignUpRelations,
    }),
  );

  return rows
    .filter((row) => row.opportunity.deletedAt === null)
    .sort(
      (a, b) =>
        a.opportunity.startTime.getTime() - b.opportunity.startTime.getTime(),
    );
}

export async function findOwnSignUpById(
  signUpId: string,
  tenantId: string,
  userId: string,
) {
  await mockDelay();

  const row = await withTenantContext(tenantId, (tx) =>
    tx.query.signUps.findFirst({
      where: and(
        eq(signUps.id, signUpId),
        eq(signUps.tenantId, tenantId),
        eq(signUps.userId, userId),
        isNull(signUps.deletedAt),
      ),
      with: ownSignUpRelations,
    }),
  );

  if (!row || row.opportunity.deletedAt !== null) return null;
  return row;
}

async function lockOwnSignUp(
  tx: Tx,
  signUpId: string,
  tenantId: string,
  userId: string,
) {
  const [row] = await tx
    .select({
      id: signUps.id,
      opportunityId: opportunities.id,
      startTime: opportunities.startTime,
    })
    .from(signUps)
    .innerJoin(opportunities, eq(opportunities.id, signUps.opportunityId))
    .where(
      and(
        eq(signUps.id, signUpId),
        eq(signUps.tenantId, tenantId),
        eq(signUps.userId, userId),
        isNull(signUps.deletedAt),
        isNull(opportunities.deletedAt),
      ),
    )
    .for('update', { of: signUps });

  return row ?? null;
}

export async function updateOwnSignUp(
  signUpId: string,
  tenantId: string,
  userId: string,
  input: SignupFormOutput,
): Promise<OwnSignUpChangeResult> {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    const signUp = await lockOwnSignUp(tx, signUpId, tenantId, userId);

    if (!signUp) return { ok: false, reason: 'not-found' };
    if (signUp.startTime <= new Date()) return { ok: false, reason: 'started' };

    if (input.selectedMeal) {
      const [meal] = await tx
        .select({ id: mealOptions.id })
        .from(mealOptions)
        .where(
          and(
            eq(mealOptions.id, input.selectedMeal),
            eq(mealOptions.opportunityId, signUp.opportunityId),
          ),
        );

      if (!meal) return { ok: false, reason: 'invalid-meal' };
    }

    await tx
      .update(signUps)
      .set({ ...input, updatedBy: userId })
      .where(eq(signUps.id, signUpId));

    return { ok: true };
  });
}

export async function cancelOwnSignUp(
  signUpId: string,
  tenantId: string,
  userId: string,
): Promise<OwnSignUpChangeResult> {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    const signUp = await lockOwnSignUp(tx, signUpId, tenantId, userId);

    if (!signUp) return { ok: false, reason: 'not-found' };
    if (signUp.startTime <= new Date()) return { ok: false, reason: 'started' };

    await tx
      .update(signUps)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(eq(signUps.id, signUpId));

    return { ok: true };
  });
}
