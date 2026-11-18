'use server';

import { refresh } from 'next/cache';
import { getCurrentAppUser } from '../auth';
import {
  type AssignOpportunityResult,
  assignOpportunityToProject,
  createProject,
  deleteProject,
  type MoveOpportunityResult,
  moveOpportunityToProject,
  removeOpportunityFromProject,
  toggleProjectPublish,
  updateProject,
} from '../dal/project';
import {
  type ProjectFormInput,
  projectFormSchema,
} from '../schemas/project-form';
import { type AppUser, isAdminUser } from '../types/appUser';
import { isUuid } from '../utils/isUuid';

type ActionResult = { success: true } | { success: false; message: string };

const projectNotFound = {
  success: false,
  message: "This project isn't available anymore.",
} as const;

async function requireAdmin(): Promise<Extract<AppUser, { status: 'active' }>> {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || !isAdminUser(appUser)) {
    throw new Error('Not authorized');
  }

  return appUser;
}

export async function saveProjectAction(
  projectId: string | null,
  input: ProjectFormInput,
): Promise<
  { success: true; id: string } | { success: false; message: string }
> {
  const appUser = await requireAdmin();

  if (projectId !== null && !isUuid(projectId)) return projectNotFound;

  const parsed = projectFormSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors in the form' };
  }

  const id = projectId
    ? await updateProject(projectId, appUser.tenantId, appUser.id, parsed.data)
    : await createProject(appUser.tenantId, appUser.id, parsed.data);

  if (!id) return projectNotFound;

  return { success: true, id };
}

export async function toggleProjectPublishAction(
  projectId: string,
): Promise<ActionResult> {
  const appUser = await requireAdmin();

  if (!isUuid(projectId)) return projectNotFound;

  const found = await toggleProjectPublish(
    projectId,
    appUser.tenantId,
    appUser.id,
  );

  refresh();

  return found ? { success: true } : projectNotFound;
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionResult> {
  const appUser = await requireAdmin();

  if (!isUuid(projectId)) return projectNotFound;

  const found = await deleteProject(projectId, appUser.tenantId, appUser.id);

  return found ? { success: true } : projectNotFound;
}

const assignFailureMessages: Record<
  Extract<AssignOpportunityResult, { ok: false }>['reason'],
  string
> = {
  'project-not-found': projectNotFound.message,
  'opportunity-not-found': "That opportunity isn't available anymore.",
  'in-other-project': 'That opportunity already belongs to another project.',
};

export async function addOpportunityToProjectAction(
  projectId: string,
  oppId: string,
): Promise<ActionResult> {
  const appUser = await requireAdmin();

  if (!isUuid(projectId)) return projectNotFound;

  if (!isUuid(oppId)) {
    return {
      success: false,
      message: assignFailureMessages['opportunity-not-found'],
    };
  }

  const result = await assignOpportunityToProject(
    oppId,
    projectId,
    appUser.tenantId,
    appUser.id,
  );

  refresh();

  if (!result.ok) {
    return { success: false, message: assignFailureMessages[result.reason] };
  }

  return { success: true };
}

export async function removeOpportunityFromProjectAction(
  projectId: string,
  oppId: string,
): Promise<ActionResult> {
  const appUser = await requireAdmin();

  if (!isUuid(projectId) || !isUuid(oppId)) {
    return {
      success: false,
      message: "That opportunity isn't in this project anymore.",
    };
  }

  const removed = await removeOpportunityFromProject(
    oppId,
    projectId,
    appUser.tenantId,
    appUser.id,
  );

  refresh();

  return removed
    ? { success: true }
    : {
        success: false,
        message: "That opportunity isn't in this project anymore.",
      };
}

const moveFailureMessages: Record<
  Extract<MoveOpportunityResult, { ok: false }>['reason'],
  string
> = {
  'project-not-found': projectNotFound.message,
  'opportunity-not-found': "That opportunity isn't available anymore.",
};

export async function moveOpportunityToProjectAction(
  oppId: string,
  projectId: string | null,
): Promise<ActionResult> {
  const appUser = await requireAdmin();

  if (!isUuid(oppId)) {
    return {
      success: false,
      message: moveFailureMessages['opportunity-not-found'],
    };
  }

  if (projectId !== null && !isUuid(projectId)) return projectNotFound;

  const result = await moveOpportunityToProject(
    oppId,
    projectId,
    appUser.tenantId,
    appUser.id,
  );

  refresh();

  if (!result.ok) {
    return { success: false, message: moveFailureMessages[result.reason] };
  }

  return { success: true };
}
