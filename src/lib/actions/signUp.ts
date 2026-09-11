'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentAppUser } from '../auth';
import { deleteSignUp } from '../dal/signUp';

export async function deleteSignUpAction(oppId: string, signUpId: string) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || appUser.role !== 'admin') {
    throw new Error('Not authorized');
  }

  await deleteSignUp(signUpId, appUser.tenantId, appUser.id);

  revalidatePath(`/opportunities/manage/${oppId}`);
}
