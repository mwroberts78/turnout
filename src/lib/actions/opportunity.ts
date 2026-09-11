'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentAppUser } from '../auth';
import { deleteOpportunity, togglePublish } from '../dal/opportunity';

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

  revalidatePath(`/opportuntiies/manage/${oppId}`);
}
