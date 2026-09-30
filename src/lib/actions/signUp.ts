'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { getCurrentAppUser } from '../auth';
import { deleteSignUp, updateSignUp } from '../dal/signUp';
import { signupEditFormSchema } from '../schemas/signup-edit-form';

export async function deleteSignUpAction(oppId: string, signUpId: string) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || appUser.role !== 'admin') {
    throw new Error('Not authorized');
  }

  await deleteSignUp(signUpId, appUser.tenantId, appUser.id);

  revalidatePath(`/opportunities/manage/${oppId}`);
}

export async function updateSignUpAction(
  oppId: string,
  signUpId: string,
  input: z.input<typeof signupEditFormSchema>,
) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || appUser.role !== 'admin') {
    throw new Error('Not authorized)');
  }

  const parsed = signupEditFormSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors in the form' };
  }

  await updateSignUp(signUpId, appUser.tenantId, appUser.id, parsed.data);

  revalidatePath(`/opportunities/manage/${oppId}`);
  return { success: true };
}
