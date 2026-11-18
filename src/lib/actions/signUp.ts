'use server';

import { refresh, revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { getCurrentAppUser } from '../auth';
import { findPublishedOpportunityById } from '../dal/opportunity';
import {
  type CreateSignUpResult,
  cancelOwnSignUp,
  createSignUp,
  deleteSignUp,
  findOwnSignUpById,
  type OwnSignUpChangeResult,
  type ReportOwnHoursResult,
  reportOwnHours,
  updateOwnSignUp,
  updateSignUp,
} from '../dal/signUp';
import { reportHoursFormSchema } from '../schemas/report-hours-form';
import { signupEditFormSchema } from '../schemas/signup-edit-form';
import {
  buildSignupFormSchema,
  type SignupFormSchema,
} from '../schemas/signup-form';
import { isAdminUser } from '../types/appUser';
import { isUuid } from '../utils/isUuid';

export async function deleteSignUpAction(oppId: string, signUpId: string) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || !isAdminUser(appUser)) {
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

  if (appUser.status !== 'active' || !isAdminUser(appUser)) {
    throw new Error('Not authorized');
  }

  const parsed = signupEditFormSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors in the form' };
  }

  await updateSignUp(signUpId, appUser.tenantId, appUser.id, parsed.data);

  revalidatePath(`/opportunities/manage/${oppId}`);
  return { success: true };
}

const signUpFailureMessages: Record<
  Extract<CreateSignUpResult, { ok: false }>['reason'],
  string
> = {
  'not-found': "This opportunity isn't available anymore.",
  started: 'Sign-ups are closed. This opportunity has already started.',
  'already-signed-up': "You're already signed up for this opportunity.",
  full: 'Sorry, this opportunity just filled up.',
  'invalid-meal': 'Please choose one of the listed meals.',
};

export async function createSignUpAction(
  oppId: string,
  input: z.input<SignupFormSchema>,
): Promise<{ success: true } | { success: false; message: string }> {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    throw new Error('Not authorized');
  }

  if (!isUuid(oppId)) {
    return { success: false, message: signUpFailureMessages['not-found'] };
  }

  const opportunity = await findPublishedOpportunityById(
    oppId,
    appUser.tenantId,
    appUser.id,
  );

  if (!opportunity) {
    return { success: false, message: signUpFailureMessages['not-found'] };
  }

  const parsed = buildSignupFormSchema({
    mealProvided: opportunity.mealProvided,
    tshirtProvided: opportunity.tshirtProvided,
    mealOptionIds: opportunity.mealOptions.map((m) => m.id),
  }).safeParse(input);

  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors in the form' };
  }

  const result = await createSignUp(
    oppId,
    appUser.tenantId,
    appUser.id,
    parsed.data,
  );

  refresh();

  if (!result.ok) {
    return { success: false, message: signUpFailureMessages[result.reason] };
  }

  return { success: true };
}

type ActionResult = { success: true } | { success: false; message: string };

const ownSignUpFailureMessages: Record<
  Extract<OwnSignUpChangeResult, { ok: false }>['reason'],
  string
> = {
  'not-found': "This signup isn't available anymore.",
  started:
    "This opportunity has already started, so the signup can't be changed.",
  'invalid-meal': 'Please choose one of the listed meals.',
};

export async function updateOwnSignUpAction(
  signUpId: string,
  input: z.input<SignupFormSchema>,
): Promise<ActionResult> {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    throw new Error('Not authorized');
  }

  if (!isUuid(signUpId)) {
    return { success: false, message: ownSignUpFailureMessages['not-found'] };
  }

  const signUp = await findOwnSignUpById(
    signUpId,
    appUser.tenantId,
    appUser.id,
  );

  if (!signUp) {
    return { success: false, message: ownSignUpFailureMessages['not-found'] };
  }

  const parsed = buildSignupFormSchema({
    mealProvided: signUp.opportunity.mealProvided,
    tshirtProvided: signUp.opportunity.tshirtProvided,
    mealOptionIds: signUp.opportunity.mealOptions.map((m) => m.id),
  }).safeParse(input);

  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors in the form' };
  }

  const result = await updateOwnSignUp(
    signUpId,
    appUser.tenantId,
    appUser.id,
    parsed.data,
  );

  refresh();

  if (!result.ok) {
    return { success: false, message: ownSignUpFailureMessages[result.reason] };
  }

  return { success: true };
}

export async function cancelOwnSignUpAction(
  signUpId: string,
): Promise<ActionResult> {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    throw new Error('Not authorized');
  }

  if (!isUuid(signUpId)) {
    return { success: false, message: ownSignUpFailureMessages['not-found'] };
  }

  const result = await cancelOwnSignUp(signUpId, appUser.tenantId, appUser.id);

  refresh();

  if (!result.ok) {
    return { success: false, message: ownSignUpFailureMessages[result.reason] };
  }

  return { success: true };
}

const reportHoursFailureMessages: Record<
  Extract<ReportOwnHoursResult, { ok: false }>['reason'],
  string
> = {
  'not-found': "This signup isn't available anymore.",
  'not-started': 'You can log hours once the opportunity has started.',
};

export async function reportOwnHoursAction(
  signUpId: string,
  input: z.input<typeof reportHoursFormSchema>,
): Promise<ActionResult> {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    throw new Error('Not authorized');
  }

  if (!isUuid(signUpId)) {
    return { success: false, message: reportHoursFailureMessages['not-found'] };
  }

  const parsed = reportHoursFormSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors in the form' };
  }

  const result = await reportOwnHours(
    signUpId,
    appUser.tenantId,
    appUser.id,
    parsed.data,
  );

  refresh();

  if (!result.ok) {
    return {
      success: false,
      message: reportHoursFailureMessages[result.reason],
    };
  }

  return { success: true };
}
