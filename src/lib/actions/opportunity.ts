'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { getCurrentAppUser } from '../auth';
import {
  createOpportunity,
  deleteOpportunity,
  findOpportunityById,
  findOpportunityRecipients,
  MealOptionInUseError,
  OpportunityConflictError,
  type OpportunityWithDetails,
  togglePublish,
  updateOpportunity,
} from '../dal/opportunity';
import { queueEmails } from '../email/queue';
import {
  opportunityCancelledEmail,
  opportunityChangedEmail,
} from '../email/templates';
import {
  buildOpportunityFormSchema,
  type OpportunityFormSchema,
} from '../schemas/opportunity-form';
import { isAdminUser } from '../types/appUser';
import { deleteBlobImage } from '../utils/blob';
import { isUuid } from '../utils/isUuid';
import { isValidTimeZone } from '../utils/isValidTimeZone';

export type SaveOpportunityResult =
  | { success: true; id: string }
  | { success: false; message: string };

export async function deleteOpportunityAction(oppId: string) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || !isAdminUser(appUser)) {
    throw new Error('Not authorized');
  }

  const existing = await findOpportunityById(oppId, appUser.tenantId);
  const recipients =
    existing && existing.startTime > new Date()
      ? await findOpportunityRecipients(oppId, appUser.tenantId)
      : [];

  await deleteOpportunity(oppId, appUser.tenantId, appUser.id);

  if (existing) {
    queueEmails(recipients.map((r) => opportunityCancelledEmail(r, existing)));
  }

  revalidatePath('/opportunities/manage');
}

function scheduleOrPlaceChanged(
  before: OpportunityWithDetails,
  after: OpportunityWithDetails,
) {
  return (
    before.startTime.getTime() !== after.startTime.getTime() ||
    before.endTime.getTime() !== after.endTime.getTime() ||
    before.location !== after.location ||
    before.timeZone !== after.timeZone
  );
}

export async function togglePublishOpportunityAction(oppId: string) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || !isAdminUser(appUser)) {
    throw new Error('Not authorized');
  }

  await togglePublish(oppId, appUser.tenantId, appUser.id);

  revalidatePath(`/opportunities/manage/${oppId}`);
}

export async function saveOpportunityAction(
  oppId: string | null,
  input: z.input<OpportunityFormSchema>,
  browserTimeZone: string,
  projectId: string | null = null,
): Promise<SaveOpportunityResult> {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || !isAdminUser(appUser)) {
    throw new Error('Not authorized');
  }

  if (!isValidTimeZone(browserTimeZone)) {
    return { success: false, message: 'Invalid time zone' };
  }

  if (projectId !== null && !isUuid(projectId)) {
    return { success: false, message: "That project isn't available anymore" };
  }

  let minCapacity = 0;
  let previousImageUrl: string | null = null;
  let existing: OpportunityWithDetails | undefined;
  if (oppId) {
    existing = await findOpportunityById(oppId, appUser.tenantId);
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
      : await createOpportunity(appUser.tenantId, appUser.id, parsed.data, {
          projectId: projectId ?? undefined,
        });

    if (!id) return { success: false, message: 'Opportunity not found' };

    if (previousImageUrl && previousImageUrl !== parsed.data.imageUrl) {
      await deleteBlobImage(previousImageUrl);
    }

    // Volunteers hear about it when the time or place changes on something
    // they're still going to.
    if (existing && existing.signUps.length > 0) {
      const updated = await findOpportunityById(id, appUser.tenantId);

      if (
        updated &&
        updated.startTime > new Date() &&
        scheduleOrPlaceChanged(existing, updated)
      ) {
        const recipients = await findOpportunityRecipients(
          id,
          appUser.tenantId,
        );
        queueEmails(recipients.map((r) => opportunityChangedEmail(r, updated)));
      }
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
