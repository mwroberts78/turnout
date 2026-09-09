'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentAppUser } from '../auth';
import { deleteOpportunity } from '../dal/opportunity';

export async function deleteOpportunityAction(oppId: string) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || appUser.role !== 'admin') {
    throw new Error('Not authorized');
  }

  await deleteOpportunity(oppId, appUser.tenantId, appUser.id);

  revalidatePath('/opportunities/manage');
}
