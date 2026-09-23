'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { getCurrentAppUser } from '../auth';
import {
  createOpportunity,
  deleteOpportunity,
  findOpportunityById,
  MealOptionInUseError,
  OpportunityConflictError,
  togglePublish,
  updateOpportunity,
} from '../dal/opportunity';
import {
  buildOpportunityFormSchema,
  type OpportunityFormSchema,
} from '../schemas/opportunity-form';
import { deleteBlobImage } from '../utils/blob';
import { isValidTimeZone } from '../utils/isValidTimeZone';

export type SaveOpportunityResult =
  | { success: true; id: string }
  | { success: false; message: string };

export async function deleteOpportunityAction(oppId: string) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || appUser.role !== 'admin') {
    throw new Error('Not authorized');
  }

  await deleteOpportunity(oppId, appUser.tenantId, appUser.id);

  revalidatePath('/opportunities/manage');
}

export async function togglePublishOpportunityAction(oppId: string) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || appUser.role !== 'admin') {
    throw new Error('Not authorized');
  }

  await togglePublish(oppId, appUser.tenantId, appUser.id);

  revalidatePath(`/opportunities/manage/${oppId}`);
}

export async function saveOpportunityAction(
  oppId: string | null,
  input: z.input<OpportunityFormSchema>,
  browserTimeZone: string,
): Promise<SaveOpportunityResult> {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || appUser.role !== 'admin') {
    throw new Error('Not authorized');
  }

  if (!isValidTimeZone(browserTimeZone)) {
    return { success: false, message: 'Invalid time zone' };
  }

  let minCapacity = 0;
  let previousImageUrl: string | null = null;
  if (oppId) {
    const existing = await findOpportunityById(oppId, appUser.tenantId);
    if (!existing) return { success: false, message: 'Opportunity not found' };
    minCapacity = existing.signUps.length;
    previousImageUrl = existing.imageUrl;
  }

  const parsed = buildOpportunityFormSchema(
    minCapacity,
    browserTimeZone,
  ).safeParse(input);
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors in the form' };
  }

  try {
    const id = oppId
      ? await updateOpportunity(
          oppId,
          appUser.tenantId,
          appUser.id,
          parsed.data,
        )
      : await createOpportunity(appUser.tenantId, appUser.id, parsed.data);

    if (!id) return { success: false, message: 'Opportunity not found' };

    if (previousImageUrl && previousImageUrl !== parsed.data.imageUrl) {
      await deleteBlobImage(previousImageUrl);
    }

    revalidatePath('/opportunities/manage');
    revalidatePath(`/opportunities/manage/${id}`);
    return { success: true, id };
  } catch (error) {
    if (
      error instanceof MealOptionInUseError ||
      error instanceof OpportunityConflictError
    ) {
      return { success: false, message: error.message };
    }

    throw error;
  }
}
