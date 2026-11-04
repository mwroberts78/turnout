import { and, count, eq, isNull } from 'drizzle-orm';
import { mealOptions, opportunities, signUps } from '@/db/schema';
import type { SignupFormOutput } from '../schemas/signup-form';
import { mockDelay } from '../utils/mockDelay';
import { withTenantContext } from './withTenantContext';

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
